import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { createFastClient, getAspFormData } from "@/lib/accsoft";
import * as cheerio from "cheerio";
import qs from "querystring";

const DESK_URL =
  "https://accsoft.lnctu.ac.in/AccSoft2/Parents/ParentDesk1.aspx";
const NODUES_URL =
  "https://accsoft.lnctu.ac.in/AccSoft2/Parents/StudentNoduesFormPrint.aspx";
const INTERMEDIATE_URL =
  "https://accsoft.lnctu.ac.in/AccSoft2/Parents/StudentNoduesForm.aspx";

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

    // Dynamic search for No Dues sidebar button target, fallback to ctl00$ctl00$lnkbtnNoduesform
    let eventTarget = "ctl00$ctl00$lnkbtnNoduesform";
    $desk("a").each((_, el) => {
      const text = $desk(el).text().trim();
      const id = $desk(el).attr("id") || "";
      const href = $desk(el).attr("href") || "";
      if (
        /no\s*dues/i.test(text) ||
        /nodues/i.test(id) ||
        /nodues/i.test(href)
      ) {
        if (id) {
          eventTarget = id.replace(/_/g, "$");
        } else if (href.includes("__doPostBack")) {
          const match = href.match(/__doPostBack\('([^']+)'/);
          if (match) eventTarget = match[1];
        }
      }
    });

    payload["__EVENTTARGET"] = eventTarget;
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

    // Step 3: Now fetch the populated No Dues Form Print page
    const noDuesRes = await client.get(NODUES_URL, {
      headers: { Referer: DESK_URL },
      responseType: "arraybuffer",
      maxRedirects: 5,
      validateStatus: () => true,
    });

    let responseData = noDuesRes.data as Buffer;

    // Fallback: if the form came back empty, try intermediate URL first
    const htmlStr = responseData.toString("utf-8");
    const hasData =
      htmlStr.includes("lblstuname") || htmlStr.includes("lblStudentName");
    if (hasData) {
      const $check = cheerio.load(htmlStr);
      const studentName =
        $check("#lblstuname").text().trim() ||
        $check("#lblStudentName").text().trim();
      if (!studentName) {
        console.log(
          "[No-Dues] Fallback: student name empty, trying intermediate URL..."
        );
        await client.get(INTERMEDIATE_URL, {
          headers: { Referer: DESK_URL },
          maxRedirects: 5,
          validateStatus: () => true,
        });
        const retryRes = await client.get(NODUES_URL, {
          headers: { Referer: DESK_URL },
          responseType: "arraybuffer",
          maxRedirects: 5,
          validateStatus: () => true,
        });
        responseData = retryRes.data as Buffer;
      }
    }

    const contentType =
      (noDuesRes.headers["content-type"] as string) ||
      "text/html; charset=utf-8";

    return new NextResponse(new Uint8Array(responseData), {
      status: noDuesRes.status,
      headers: { "Content-Type": contentType },
    });
  } catch (e) {
    console.error("No Dues fetch error:", e);
    return new NextResponse("Failed to load No Dues form.", {
      status: 502,
    });
  }
}