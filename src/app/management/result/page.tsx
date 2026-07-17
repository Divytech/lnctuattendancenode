import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { createMgmtClient, MGMT_RESULT_URL } from "@/lib/ums";
import * as cheerio from "cheerio";
import DownloadButton from "@/components/DownloadButton";

export const dynamic = "force-dynamic";

export default async function ResultsPage() {
  const session = await getSession();
  
  if (!session.umsCookies) {
    redirect("/api/auth/logout?type=ums");
  }

  const cookieString = Object.entries(session.umsCookies)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");

  const client = createMgmtClient(cookieString);

  let results: any[] = [];
  let error = null;

  try {
    const res = await client.get(MGMT_RESULT_URL, {
      headers: { Referer: "https://www.universitymanagementsystem.com/lnctbhopal/Student/Dashboard" },
      maxRedirects: 0,
      validateStatus: (s) => s >= 200 && s < 400
    });

    if (res.status === 302 || (typeof res.data === "string" && res.data.includes("Secure Sign In"))) {
      redirect("/api/auth/logout?type=ums");
    }

    const $ = cheerio.load(res.data);
    
    $('div.row.py-3.border-bottom.align-items-start.flex-wrap').each((_, row) => {
      const cols = $(row).find('div.col-12.col-md');
      if (cols.length >= 6) {
        const clean = (el: any) => {
          const t = $(el).text().trim();
          return t.includes(':') ? t.split(':')[1].trim() : t;
        };

        const sessionVal = clean(cols[1]);
        const semester = clean(cols[2]);
        const examType = clean(cols[3]);
        const resultStatus = clean(cols[5]);
        
        let downloadId = "N/A";
        const aTag = $(row).find('a[onclick*="DownloadReport"]');
        if (aTag.length) {
          const onclick = aTag.attr('onclick') || '';
          const match = onclick.match(/DownloadReport\s*\(\s*['"]([^'"]+)['"]\s*\)/);
          if (match) downloadId = match[1];
        }

        results.push({ session: sessionVal, semester, examType, result: resultStatus, downloadId });
      }
    });

  } catch (e: any) {
    if (e.message === "NEXT_REDIRECT" || (e.digest && e.digest.startsWith("NEXT_REDIRECT"))) {
      throw e;
    }
    console.error("UMS fetch error:", e);
    error = `Failed to load results from UMS: ${e.message || e}`;
  }

  return (
    <div className="glass-card overflow-hidden">
      <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
        <h2 className="text-lg font-bold">Academic Results</h2>
        <span className="text-xs bg-teal-500/20 text-teal-300 px-2 py-1 rounded">Semester Wise</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-black/40 text-gray-400 text-xs uppercase tracking-wider">
              <th className="p-4 font-medium">Session</th>
              <th className="p-4 font-medium">Semester</th>
              <th className="p-4 font-medium">Type</th>
              <th className="p-4 font-medium">Result</th>
              <th className="p-4 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm">
            {error ? (
              <tr><td colSpan={5} className="p-8 text-center text-red-400">{error}</td></tr>
            ) : results.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-gray-500">No results found</td></tr>
            ) : (
              results.map((r, i) => (
                <tr key={i} className="hover:bg-white/5 transition-colors">
                  <td className="p-4 font-medium text-gray-300">{r.session}</td>
                  <td className="p-4 text-teal-400 font-bold">{r.semester}</td>
                  <td className="p-4 text-gray-400">{r.examType}</td>
                  <td className="p-4">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                      r.result.toUpperCase().includes('PASS') ? 'bg-emerald-500/20 text-emerald-300' :
                      r.result.toUpperCase().includes('FAIL') ? 'bg-red-500/20 text-red-300' :
                      'bg-gray-500/20 text-gray-300'
                    }`}>
                      {r.result}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {r.downloadId !== "N/A" ? (
                      <DownloadButton 
                        id={r.downloadId} 
                        endpoint="/api/management/download/result" 
                        filenamePrefix="Result" 
                        className="inline-flex items-center text-xs bg-teal-600 hover:bg-teal-500 text-white px-3 py-1.5 rounded transition-colors disabled:opacity-50"
                        text="PDF"
                      />
                    ) : (
                      <span className="text-xs text-gray-600">N/A</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
