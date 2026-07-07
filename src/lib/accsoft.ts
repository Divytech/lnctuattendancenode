import axios, { AxiosInstance } from 'axios';
import * as cheerio from 'cheerio';
import https from 'https';

// --- Constants ---
const FAST_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
  'Accept-Encoding': 'gzip, deflate, br'
};

export const ACCSOFT_BASE = 'https://accsoft.lnctu.ac.in';
export const LOGIN_URL = `${ACCSOFT_BASE}/AccSoft2/StudentLogin.aspx`;
export const ATTENDANCE_URL = `${ACCSOFT_BASE}/AccSoft2/Parents/StuAttendanceStatus.aspx`;

// Helper to create an HTTP/1.1 Axios instance for AccSoft
export function createFastClient(cookieString?: string): AxiosInstance {
  const agent = new https.Agent({
    keepAlive: true,
    maxSockets: 10,
    rejectUnauthorized: false // AccSoft occasionally has SSL issues
  });

  return axios.create({
    httpsAgent: agent,
    headers: {
      ...FAST_HEADERS,
      ...(cookieString ? { Cookie: cookieString } : {})
    },
    maxRedirects: 5,
    validateStatus: (status) => status >= 200 && status < 400
  });
}

// Scrape ASP.NET form data (ViewState, EventValidation, etc.)
export function getAspFormData($: cheerio.CheerioAPI): Record<string, string> {
  const fields: Record<string, string> = {};
  
  $('input, select, textarea').each((_, el) => {
    const tag = $(el);
    const name = tag.attr('name');
    if (!name) return;

    const tagName = (el.tagName || '').toLowerCase();
    
    if (tagName === 'input') {
      const type = (tag.attr('type') || 'text').toLowerCase();
      if (['submit', 'button', 'image'].includes(type)) return;
      if (['checkbox', 'radio'].includes(type) && !tag.prop('checked') && !tag.attr('checked')) return;
      fields[name] = tag.val() as string || '';
    } else if (tagName === 'select') {
      const selected = tag.find('option[selected]').first();
      if (selected.length) {
        fields[name] = selected.val() as string || '';
      } else {
        const first = tag.find('option').first();
        if (first.length) fields[name] = first.val() as string || '';
      }
    } else if (tagName === 'textarea') {
      fields[name] = tag.text();
    }
  });
  
  return fields;
}

export function abbreviateSubject(name: string): string {
  let suffix = "";
  let cleanName = name.trim();
  
  if (cleanName.endsWith("-P")) {
    suffix = " (P)";
    cleanName = cleanName.slice(0, -2);
  } else if (cleanName.endsWith("-T")) {
    suffix = " (T)";
    cleanName = cleanName.slice(0, -2);
  }
  
  const upperName = cleanName.toUpperCase();
  let short = upperName.includes("NATURAL LANGUAGE") ? "NLP & GenAI" : cleanName;
  
  return short + suffix;
}

export function normalizeDate(dateStr: string): string {
  const cleanDate = dateStr.trim();
  
  // Format 1: DD-Mmm-YYYY or DD Mmm YYYY
  const mmmMatch = cleanDate.match(/^(\d{1,2})[- ]([A-Za-z]{3})[- ](\d{4})$/);
  if (mmmMatch) {
    const day = mmmMatch[1].padStart(2, '0');
    const monthStr = mmmMatch[2];
    const year = mmmMatch[3];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthIdx = months.findIndex(m => m.toLowerCase() === monthStr.toLowerCase());
    if (monthIdx !== -1) {
      const month = String(monthIdx + 1).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }

  // Format 2: DD/MM/YYYY or DD-MM-YYYY
  const slashMatch = cleanDate.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (slashMatch) {
    const day = slashMatch[1].padStart(2, '0');
    const month = slashMatch[2].padStart(2, '0');
    const year = slashMatch[3];
    return `${year}-${month}-${day}`;
  }

  // Format 3: YYYY-MM-DD
  const ymdMatch = cleanDate.match(/^(\d{4})\-(\d{2})\-(\d{2})$/);
  if (ymdMatch) {
    return cleanDate;
  }

  // Fallback to standard JS parsing
  const d = new Date(cleanDate);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }
  return cleanDate;
}

export function parseAttendanceData(htmlContent: string) {
  const $ = cheerio.load(htmlContent);
  const data = {
    profile: {
      name: 'Unknown Student',
      pic_url: '',
      roll_no: 'N/A',
      scholar_no: 'N/A',
      course: 'Course Info Unavailable'
    },
    summary: { total_classes: 0, present: 0, absent: 0, percent: '0%', percent_raw: 0.0 },
    subjects: [] as any[],
    detailed_logs: [] as any[],
    heatmap_data: {} as Record<string, any>,
    subject_options: [] as any[],
    semester_options: [] as any[]
  };

  try {
    const navName = $('span.d-lg-inline-flex').first();
    if (navName.length) data.profile.name = navName.text().trim();

    const navImg = $('img.rounded-circle').first();
    if (navImg.length && navImg.attr('src')) data.profile.pic_url = navImg.attr('src')!;

    const courseSpan = $('span[style*="font-size: 14px"]').first();
    if (courseSpan.length) data.profile.course = courseSpan.text().trim();

    const rollElem = $('*:contains("Class Roll No.:")').last();
    if (rollElem.length) data.profile.roll_no = rollElem.text().replace("Class Roll No.:", "").trim();

    const scholarElem = $('span[id$="lblScholarText"]');
    if (scholarElem.length) data.profile.scholar_no = scholarElem.parent().text().replace("Scholar No.:", "").trim();

    $('select[id$="ddlSubject"] option').each((_, el) => {
      const val = $(el).attr('value');
      const text = $(el).text().trim();
      if (val && val !== "0") data.subject_options.push({ value: val, text });
    });

    $('select[id$="ddlclass"] option').each((_, el) => {
      const val = $(el).attr('value');
      const text = $(el).text().trim();
      const selected = $(el).attr('selected') !== undefined;
      if (val && val !== "0") data.semester_options.push({ value: val, text, selected });
    });

    const getStat = (label: string) => {
      const bTag = $('b').filter((_, el) => {
        return $(el).text().toLowerCase().includes(label.toLowerCase());
      });
      if (bTag.length) {
        const text = bTag.parent().text().trim();
        const valText = text.slice(text.toLowerCase().indexOf(label.toLowerCase()) + label.length);
        const match = valText.match(/[\d\.]+/);
        return match ? parseFloat(match[0]) : 0;
      }
      return 0;
    };

    data.summary.total_classes = getStat("No. Of Classes");
    data.summary.present = getStat("Present (P)");
    data.summary.absent = getStat("Absent (A)");
    const pct = getStat("Present %");
    data.summary.percent_raw = pct;
    data.summary.percent = `${pct}%`;

    $('table[id$="grdSubjectWiseAttendance"] tr').each((i, el) => {
      if (i === 0) return; // skip header
      const cols = $(el).find('td');
      if (cols.length >= 6) {
        const fullName = $(cols[0]).text().trim();
        data.subjects.push({
          name: fullName,
          short_name: abbreviateSubject(fullName),
          held: parseInt($(cols[1]).text().trim(), 10),
          present: parseInt($(cols[5]).text().trim(), 10),
          absent: parseInt($(cols[3]).text().trim(), 10)
        });
      }
    });

    $('table[id$="Gridview1"] tr').each((i, el) => {
      if (i === 0) return; // skip header
      const cols = $(el).find('td');
      if (cols.length >= 5) {
        const statusText = $(cols[4]).text().trim();
        const status = statusText.includes("P") ? "P" : "A";
        const fullName = $(cols[3]).text().trim();
        
        data.detailed_logs.push({
          sr_no: $(cols[0]).text().trim(),
          date: $(cols[1]).text().trim(),
          period: $(cols[2]).text().trim(),
          subject: fullName,
          short_name: abbreviateSubject(fullName),
          status
        });
      }
    });
  } catch (e) {
    console.error("Parsing error:", e);
  }

  data.detailed_logs.forEach(log => {
    const date = normalizeDate(log.date);
    if (!data.heatmap_data[date]) {
      data.heatmap_data[date] = { present: 0, total: 0, percent: 0 };
    }
    data.heatmap_data[date].total += 1;
    if (log.status === 'P') data.heatmap_data[date].present += 1;
  });

  for (const date in data.heatmap_data) {
    const stats = data.heatmap_data[date];
    if (stats.total > 0) {
      stats.percent = Math.round((stats.present / stats.total) * 100);
    }
  }

  return data;
}
