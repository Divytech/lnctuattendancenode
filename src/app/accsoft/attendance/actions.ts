"use server";

import { getSession } from "@/lib/session";
import { createFastClient, ATTENDANCE_URL, parseAttendanceData, getAspFormData } from "@/lib/accsoft";
import * as cheerio from "cheerio";
import qs from "querystring";

export async function fetchDashboardData(filters: {
  semester?: string;
  start_date?: string;
  end_date?: string;
  subject?: string;
}) {
  const session = await getSession();
  if (!session.isLoggedIn || !session.accsoftCookies) {
    return { error: "Unauthorized" };
  }

  const cookieString = Object.entries(session.accsoftCookies)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");

  const client = createFastClient(cookieString);

  let data = null;
  let error = null;

  const targetSemester = filters.semester || "";
  const startDate = filters.start_date || "";
  const endDate = filters.end_date || "";

  try {
    // 1. Initial GET request to retrieve page state (ViewState/EventValidation)
    const initialRes = await client.get(ATTENDANCE_URL, {
      headers: { Referer: "https://accsoft.lnctu.ac.in/AccSoft2/Parents/ParentDesk1.aspx" }
    });

    if (initialRes.status === 302 || (typeof initialRes.data === "string" && initialRes.data.includes("StudentLogin"))) {
      return { error: "SessionExpired" };
    }

    let htmlContent = initialRes.data;

    // 2. Perform POST filtering if filters are requested
    if (targetSemester || startDate || endDate) {
      let $ = cheerio.load(htmlContent);
      let payload = getAspFormData($);
      const initialSem = payload['ctl00$ctl00$ContentPlaceHolder1$cp2$ddlclass'] || "";

      // Step A: If the user wants a different semester, perform AutoPostBack update first
      if (targetSemester && targetSemester !== initialSem) {
        const semPayload = {
          ...payload,
          'ctl00$ctl00$ContentPlaceHolder1$cp2$ddlclass': targetSemester,
          '__EVENTTARGET': 'ctl00$ctl00$ContentPlaceHolder1$cp2$ddlclass',
          '__EVENTARGUMENT': ''
        };

        const semRes = await client.post(ATTENDANCE_URL, qs.stringify(semPayload), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Referer: ATTENDANCE_URL
          },
          maxRedirects: 0,
          validateStatus: (s) => s >= 200 && s < 400
        });

        $ = cheerio.load(semRes.data);
        payload = getAspFormData($);
      }

      // Step B: Build target date format strings (e.g., 2026-02-09 -> 09-Feb-2026)
      const formatDateForAsp = (dateStr: string) => {
        if (!dateStr) return "";
        const parts = dateStr.split('-');
        if (parts.length !== 3) return "";
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const year = parts[0];
        const month = months[parseInt(parts[1], 10) - 1];
        const day = parts[2];
        return `${day}-${month}-${year}`;
      };

      const fmtStart = startDate ? formatDateForAsp(startDate) : "";
      const fmtEnd = endDate ? formatDateForAsp(endDate) : "";

      // Step C: Trigger "Show" filter post
      const showPayload = {
        ...payload,
        'ctl00$ctl00$ContentPlaceHolder1$cp2$txtfromdate': fmtStart || payload['ctl00$ctl00$ContentPlaceHolder1$cp2$txtfromdate'] || "",
        'ctl00$ctl00$ContentPlaceHolder1$cp2$txtTodate': fmtEnd || payload['ctl00$ctl00$ContentPlaceHolder1$cp2$txtTodate'] || "",
        'ctl00$ctl00$ContentPlaceHolder1$cp2$ddlclass': targetSemester || initialSem,
        // Always request All Subjects ('0') in UMS data load, local filtering is handled in JS client component
        'ctl00$ctl00$ContentPlaceHolder1$cp2$ddlSubject': '0',
        'ctl00$ctl00$ContentPlaceHolder1$cp2$btnshow': 'Show',
        '__EVENTTARGET': '',
        '__EVENTARGUMENT': ''
      };

      const filterRes = await client.post(ATTENDANCE_URL, qs.stringify(showPayload), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Referer: ATTENDANCE_URL
        },
        maxRedirects: 0,
        validateStatus: (s) => s >= 200 && s < 400
      });

      htmlContent = filterRes.data;
    }

    data = parseAttendanceData(htmlContent);
  } catch (e) {
    console.error("Dashboard fetch error:", e);
    error = "Failed to load attendance data. University server might be down.";
  }

  return { data, error };
}
