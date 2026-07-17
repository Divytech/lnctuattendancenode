"use server";

import { getSession } from "@/lib/session";
import { createFastClient, ATTENDANCE_URL, parseAttendanceData, getAspFormData } from "@/lib/accsoft";
import * as cheerio from "cheerio";
import qs from "querystring";

// Helper: parse ASP.NET date (DD-Mmm-YYYY) to YYYY-MM-DD
function aspDateToISO(aspDate: string): string {
  if (!aspDate) return "";
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const match = aspDate.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
  if (!match) return "";
  const day = match[1].padStart(2, '0');
  const monthIdx = months.findIndex(m => m.toLowerCase() === match[2].toLowerCase());
  if (monthIdx === -1) return "";
  const month = String(monthIdx + 1).padStart(2, '0');
  return `${match[3]}-${month}-${day}`;
}

// Helper: convert YYYY-MM-DD to DD-Mmm-YYYY for ASP.NET
function isoDateToAsp(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split('-');
  if (parts.length !== 3) return "";
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const year = parts[0];
  const month = months[parseInt(parts[1], 10) - 1];
  const day = parts[2];
  return `${day}-${month}-${year}`;
}

export type FiltersResult = {
  semester: string;
  start_date: string;
  end_date: string;
};

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
  // Track the actual filter values used (may be updated by server after semester switch)
  const resultFilters: FiltersResult = {
    semester: filters.semester || "",
    start_date: filters.start_date || "",
    end_date: filters.end_date || "",
  };

  const targetSemester = filters.semester || "";
  let startDate = filters.start_date || "";
  let endDate = filters.end_date || "";

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

        // === FIX: Extract server-default dates after semester AutoPostBack ===
        // When the semester changes, the server updates the date range to match
        // that semester's start/end dates. If the user didn't explicitly provide
        // dates, we must use the server's new defaults (mirrors Python lines 580-591).
        if (!filters.start_date && !filters.end_date) {
          const serverStartInput = $('input[name$="txtfromdate"]').first();
          const serverEndInput = $('input[name$="txtTodate"]').first();

          if (serverStartInput.length && serverStartInput.val()) {
            const converted = aspDateToISO(serverStartInput.val() as string);
            if (converted) startDate = converted;
          }
          if (serverEndInput.length && serverEndInput.val()) {
            const converted = aspDateToISO(serverEndInput.val() as string);
            if (converted) endDate = converted;
          }
        }
      }

      // Step B: Build target date format strings (e.g., 2026-02-09 -> 09-Feb-2026)
      const fmtStart = startDate ? isoDateToAsp(startDate) : "";
      const fmtEnd = endDate ? isoDateToAsp(endDate) : "";

      // Step C: Trigger "Show" filter post
      const showPayload = {
        ...payload,
        'ctl00$ctl00$ContentPlaceHolder1$cp2$txtfromdate': fmtStart || payload['ctl00$ctl00$ContentPlaceHolder1$cp2$txtfromdate'] || "",
        'ctl00$ctl00$ContentPlaceHolder1$cp2$txtTodate': fmtEnd || payload['ctl00$ctl00$ContentPlaceHolder1$cp2$txtTodate'] || "",
        'ctl00$ctl00$ContentPlaceHolder1$cp2$ddlclass': targetSemester || initialSem,
        // Always request All Subjects ('0') so client-side JS filter works instantly
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

      // Update result filters with actual values used
      resultFilters.semester = targetSemester || initialSem;
      resultFilters.start_date = startDate;
      resultFilters.end_date = endDate;
    } else {
      // No filters provided (initial GET) — extract server defaults from the page
      const $ = cheerio.load(htmlContent);
      const payload = getAspFormData($);
      resultFilters.semester = payload['ctl00$ctl00$ContentPlaceHolder1$cp2$ddlclass'] || "";

      const serverStartInput = $('input[name$="txtfromdate"]').first();
      const serverEndInput = $('input[name$="txtTodate"]').first();
      if (serverStartInput.length && serverStartInput.val()) {
        const converted = aspDateToISO(serverStartInput.val() as string);
        if (converted) resultFilters.start_date = converted;
      }
      if (serverEndInput.length && serverEndInput.val()) {
        const converted = aspDateToISO(serverEndInput.val() as string);
        if (converted) resultFilters.end_date = converted;
      }
    }

    data = parseAttendanceData(htmlContent);
  } catch (e) {
    console.error("Dashboard fetch error:", e);
    error = "Failed to load attendance data. University server might be down.";
  }

  return { data, error, filters: resultFilters };
}
