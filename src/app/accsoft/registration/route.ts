import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { createFastClient, getAspFormData } from "@/lib/accsoft";
import * as cheerio from "cheerio";
import qs from "querystring";

const DESK_URL =
  "https://accsoft.lnctu.ac.in/AccSoft2/Parents/ParentDesk1.aspx";
const REGISTRATION_URL =
  "https://accsoft.lnctu.ac.in/AccSoft2/Parents/StudentRegistrationFormPrint.aspx";
const INTERMEDIATE_URL =
  "https://accsoft.lnctu.ac.in/AccSoft2/Parents/StudentRegistrationForm.aspx";

export async function GET(req: NextRequest) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    return NextResponse.redirect(
      new URL("/api/auth/logout?type=accsoft", req.url)
    );
  }

  const cookieString = Object.entries(session.accsoftCookies || {})
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");

  const client = createFastClient(cookieString);

  const fastHeaders = {
    Referer: "https://accsoft.lnctu.ac.in/AccSoft2/StudentLogin.aspx",
  };

  try {
    // Step 1: GET ParentDesk1.aspx to set up context and grab VIEWSTATE
    const deskRes = await client.get(DESK_URL, {
      headers: fastHeaders,
      maxRedirects: 5,
      validateStatus: () => true,
    });

    // Security check - were we redirected to login?
    if (
      typeof deskRes.data === "string" &&
      (deskRes.data.includes("StudentLogin") ||
        (deskRes.request?.res?.responseUrl || "").includes("Login"))
    ) {
      return NextResponse.redirect(
        new URL("/api/auth/logout?type=accsoft", req.url)
      );
    }

    const $desk = cheerio.load(deskRes.data);
    const payload = getAspFormData($desk);

    // Step 2: Emulate clicking the "Registration Form" sidebar button
    payload["__EVENTTARGET"] = "ctl00$ctl00$lnkbtnRegisform";
    payload["__EVENTARGUMENT"] = "";

    const updatedHeaders = {
      "Content-Type": "application/x-www-form-urlencoded",
      Referer: DESK_URL,
    };

    await client.post(DESK_URL, qs.stringify(payload), {
      headers: updatedHeaders,
      maxRedirects: 5,
      validateStatus: () => true,
    });

    // Step 3: Now fetch the populated Registration Form Print page
    const regRes = await client.get(REGISTRATION_URL, {
      headers: { Referer: DESK_URL },
      responseType: "arraybuffer",
      maxRedirects: 5,
      validateStatus: () => true,
    });

    let responseData = regRes.data as Buffer;

    // Fallback: if the form came back empty, try intermediate URL first
    const htmlStr = responseData.toString("utf-8");
    const hasData = htmlStr.includes("lblstuname") || htmlStr.includes("lblStudentName");
    if (hasData) {
      // Check if the student name label is actually populated
      const $check = cheerio.load(htmlStr);
      const studentName = $check("#lblstuname").text().trim() || $check("#lblStudentName").text().trim();
      if (!studentName) {
        console.log("[Registration] Fallback: student name empty, trying intermediate URL...");
        // Hit the intermediate page first
        await client.get(INTERMEDIATE_URL, {
          headers: { Referer: DESK_URL },
          maxRedirects: 5,
          validateStatus: () => true,
        });
        // Then re-fetch the print page
        const retryRes = await client.get(REGISTRATION_URL, {
          headers: { Referer: DESK_URL },
          responseType: "arraybuffer",
          maxRedirects: 5,
          validateStatus: () => true,
        });
        responseData = retryRes.data as Buffer;
      }
    }

    // Determine content-type from upstream response
    const contentType =
      (regRes.headers["content-type"] as string) ||
      "text/html; charset=utf-8";

    return new NextResponse(new Uint8Array(responseData), {
      status: regRes.status,
      headers: { "Content-Type": contentType },
    });
  } catch (e) {
    console.error("Registration fetch error:", e);
    return new NextResponse("Failed to load registration form.", {
      status: 502,
    });
  }
}

