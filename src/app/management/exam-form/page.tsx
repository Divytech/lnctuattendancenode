import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { createMgmtClient, EXAM_FORM_URL } from "@/lib/ums";
import * as cheerio from "cheerio";
import DownloadButton from "@/components/DownloadButton";

export default async function ExamFormPage() {
  const session = await getSession();
  if (!session.umsCookies) {
    redirect("/api/auth/logout?type=ums");
  }

  const cookieString = Object.entries(session.umsCookies)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
  const client = createMgmtClient(cookieString);

  let forms: any[] = [];
  let error = null;

  try {
    const res = await client.get(EXAM_FORM_URL, {
      headers: { Referer: "https://www.universitymanagementsystem.com/lnctbhopal/Student/Dashboard" },
      maxRedirects: 0
    });

    if (res.status === 302 || (typeof res.data === "string" && res.data.includes("Secure Sign In"))) {
      redirect("/api/auth/logout?type=ums");
    }

    const $ = cheerio.load(res.data);
    
    $('div.glass-card').each((_, card) => {
      let details: any = {};
      const detailRow = $(card).find('div.row.mb-3');
      if (detailRow.length) {
        detailRow.find('div').each((_, col) => {
          const text = $(col).text().trim();
          if (text.includes("Srl No:")) details.srl = text.replace("Srl No:", "").trim();
          if (text.includes("Session:")) details.session = text.replace("Session:", "").trim();
          if (text.includes("Semester/Year:")) details.semester = text.replace("Semester/Year:", "").trim();
          if (text.includes("Exam Category:")) details.category = text.replace("Exam Category:", "").trim();
        });
      }

      let statuses: any = {};
      $(card).find('div.col-md-3').each((_, statusCol) => {
        const dept = $(statusCol).find('h6').text().trim();
        const stat = $(statusCol).find('span.status-badge').text().trim();
        if (dept && stat) statuses[dept] = stat;
      });

      let downloadId = "N/A";
      let remarks = "";
      const aTag = $(card).find('a[onclick]');
      if (aTag.length) {
        const onclick = aTag.attr('onclick') || '';
        const match = onclick.match(/DownloadReport\s*\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\s*\)/);
        if (match) downloadId = `${match[1]}${match[2]}${match[3]}`;
      }

      const remarksTag = $(card).find('p.text-success');
      if (remarksTag.length) {
        remarks = remarksTag.text().trim().replace("Remarks:", "").trim();
      }

      if (Object.keys(details).length > 0) {
        forms.push({
          srl: details.srl || "N/A",
          session: details.session || "N/A",
          semester: details.semester || "N/A",
          category: details.category || "N/A",
          statuses,
          downloadId,
          remarks
        });
      }
    });
  } catch (e: any) {
    if (e.message === "NEXT_REDIRECT" || (e.digest && e.digest.startsWith("NEXT_REDIRECT"))) {
      throw e;
    }
    console.error("Exam Form fetch error:", e);
    error = "Failed to load exam forms.";
  }

  return (
    <div className="space-y-6">
      {error && <div className="p-4 bg-red-500/20 text-red-300 rounded-xl">{error}</div>}
      
      {forms.length === 0 && !error ? (
        <div className="glass-card p-10 text-center text-gray-500">
          No exam forms found
        </div>
      ) : (
        forms.map((form, idx) => (
          <div key={idx} className="glass-card p-6 border border-pink-500/20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
              <div>
                <h3 className="text-xl font-black text-pink-400 mb-1">{form.semester}</h3>
                <div className="text-sm text-gray-400">
                  <span className="mr-3 text-white">Srl: {form.srl}</span>
                  <span className="mr-3">{form.session}</span>
                  <span>{form.category}</span>
                </div>
              </div>
              <div className="mt-4 md:mt-0 flex flex-col items-end">
                {form.downloadId !== "N/A" && (
                  <DownloadButton 
                    id={form.downloadId} 
                    endpoint="/api/management/download/exam-form" 
                    filenamePrefix="ExamForm" 
                    className="bg-pink-600 hover:bg-pink-500 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-[0_0_15px_rgba(236,72,153,0.3)] transition-all flex items-center disabled:opacity-50"
                    text="Download Receipt"
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {Object.entries(form.statuses).map(([dept, status]: [string, any], i) => (
                <div key={i} className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col items-center justify-center text-center">
                  <h4 className="text-xs text-gray-400 font-bold mb-2 uppercase tracking-wide">{dept}</h4>
                  <span className={`px-3 py-1 rounded text-xs font-bold ${
                    status.toUpperCase().includes('APPROVED') || status.toUpperCase().includes('PAID') 
                      ? 'bg-emerald-500/20 text-emerald-300' 
                      : status.toUpperCase().includes('PENDING')
                      ? 'bg-yellow-500/20 text-yellow-300'
                      : 'bg-gray-500/20 text-gray-300'
                  }`}>
                    {status}
                  </span>
                </div>
              ))}
            </div>

            {form.remarks && (
              <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm rounded-lg">
                <strong>Remarks:</strong> {form.remarks}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
