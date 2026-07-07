import axios, { AxiosInstance } from 'axios';
import * as cheerio from 'cheerio';
import https from 'https';

export const MGMT_BASE_URL = "https://www.universitymanagementsystem.com";
export const MGMT_LOGIN_URL = `${MGMT_BASE_URL}/lnctbhopal/Home`;
export const MGMT_POST_URL = `${MGMT_BASE_URL}/lnctbhopal/Home/LoginUser`;
export const MGMT_RESULT_URL = `${MGMT_BASE_URL}/lnctbhopal/Student/studentresult`;
export const MGMT_DASHBOARD_URL = `${MGMT_BASE_URL}/lnctbhopal/Student/Dashboard`;
export const MGMT_PHOTO_URL = `${MGMT_DASHBOARD_URL}/GetPhoto`;
export const MGMT_DOWNLOAD_REPORT_URL = `${MGMT_BASE_URL}/lnctbhopal/Student/StudentResult/DownloadReport`;
export const MGMT_DOWNLOAD_FILE_URL = `${MGMT_BASE_URL}/lnctbhopal/Student/StudentResult/Download`;

export const ADMIT_CARD_URL = `${MGMT_BASE_URL}/lnctbhopal/Student/studentadmitcard`;
export const ADMIT_DOWNLOAD_REPORT_URL = `${MGMT_BASE_URL}/lnctbhopal/Student/StudentAdmitCard/DownloadReport`;
export const ADMIT_DOWNLOAD_FILE_URL = `${MGMT_BASE_URL}/lnctbhopal/Student/StudentAdmitCard/Download`;

export const EXAM_FORM_URL = `${MGMT_BASE_URL}/lnctbhopal/Student/studentexamform`;
export const EXAM_DOWNLOAD_REPORT_URL = `${MGMT_BASE_URL}/lnctbhopal/Student/StudentExamForm/DownloadReport`;
export const EXAM_DOWNLOAD_FILE_URL = `${MGMT_BASE_URL}/lnctbhopal/Student/StudentExamForm/Download`;

export const TIMETABLE_URL = `${MGMT_BASE_URL}/lnctbhopal/Student/examinationtimetable`;
export const VIEW_PAPERS_URL = `${MGMT_BASE_URL}/lnctbhopal/Student/ExaminationTimeTable/ViewPapers`;
export const MARKS_VIEW_PAPERS_URL = `${MGMT_BASE_URL}/lnctbhopal/Student/StudentRevalForm/ViewPapers`;
// The dashboard returns the student's registered-subject cards from this endpoint.
// StudentTimeTable/Index is a different page and does not contain profile subjects.
export const MGMT_SUBJECT_LIST_URL = `${MGMT_DASHBOARD_URL}/LoadSubjectList`;
export const MGMT_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Linux; Android 13; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.8",
  "Upgrade-Insecure-Requests": "1",
  "Origin": MGMT_BASE_URL,
  "Referer": `${MGMT_BASE_URL}/lnctbhopal/Home`
};

export function createMgmtClient(cookieString?: string): AxiosInstance {
  const agent = new https.Agent({
    keepAlive: true,
    rejectUnauthorized: false
  });

  return axios.create({
    httpsAgent: agent,
    headers: {
      ...MGMT_HEADERS,
      ...(cookieString ? { Cookie: cookieString } : {})
    },
    maxRedirects: 5,
    validateStatus: (status) => status >= 200 && status < 400
  });
}
