import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { createMgmtClient, ADMIT_CARD_URL } from "@/lib/ums";
import * as cheerio from "cheerio";
import DownloadButton from "@/components/DownloadButton";

export default async function AdmitCardPage() {
  const session = await getSession();
  if (!session.umsCookies) {
    redirect("/api/auth/logout?type=ums");
  }

  const cookieString = Object.entries(session.umsCookies)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
  const client = createMgmtClient(cookieString);

  let admitCards: any[] = [];
  let error = null;

  try {
    const res = await client.get(ADMIT_CARD_URL, {
      headers: { Referer: "https://www.universitymanagementsystem.com/lnctbhopal/Student/Dashboard" },
      maxRedirects: 0
    });

    if (res.status === 302 || (typeof res.data === "string" && res.data.includes("Secure Sign In"))) {
      redirect("/api/auth/logout?type=ums");
    }

    const $ = cheerio.load(res.data);
    
    $('div.row.py-3.border-bottom.align-items-center.flex-wrap').each((_, row) => {
      const cols = $(row).find('div.col-12.col-md');
      if (cols.length >= 6) {
        const clean = (el: any) => {
          const t = $(el).text().trim();
          return t.includes(':') ? t.split(':')[1].trim() : t;
        };

        const sessionVal = clean(cols[1]);
        const semester = clean(cols[2]);
        const category = clean(cols[3]);
        const status = clean(cols[4]);
        
        let downloadId = "N/A";
        const aTag = $(cols[5]).find('a[onclick]');
        if (aTag.length) {
          const onclick = aTag.attr('onclick') || '';
          const match = onclick.match(/DownloadReport\s*\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\s*\)/);
          if (match) {
            downloadId = `${match[1]}${match[2]}${match[3]}`;
          }
        }

        admitCards.push({ session: sessionVal, semester, category, status, downloadId });
      }
    });
  } catch (e: any) {
    if (e.message === "NEXT_REDIRECT" || (e.digest && e.digest.startsWith("NEXT_REDIRECT"))) {
      throw e;
    }
    console.error("Admit Card fetch error:", e);
    error = "Failed to load admit cards.";
  }

  return (
    <div className="glass-card overflow-hidden">
      <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
        <h2 className="text-lg font-bold">Admit Cards</h2>
        <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded">Hall Tickets</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-black/40 text-gray-400 text-xs uppercase tracking-wider">
              <th className="p-4 font-medium">Session</th>
              <th className="p-4 font-medium">Semester</th>
              <th className="p-4 font-medium">Category</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm">
            {error ? (
              <tr><td colSpan={5} className="p-8 text-center text-red-400">{error}</td></tr>
            ) : admitCards.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-gray-500">No admit cards found</td></tr>
            ) : (
              admitCards.map((r, i) => (
                <tr key={i} className="hover:bg-white/5 transition-colors">
                  <td className="p-4 font-medium text-gray-300">{r.session}</td>
                  <td className="p-4 text-purple-400 font-bold">{r.semester}</td>
                  <td className="p-4 text-gray-400">{r.category}</td>
                  <td className="p-4">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                      r.status.toUpperCase().includes('ACTIVE') || r.status.toUpperCase().includes('GENERATED') ? 'bg-emerald-500/20 text-emerald-300' :
                      'bg-yellow-500/20 text-yellow-300'
                    }`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {r.downloadId !== "N/A" ? (
                      <DownloadButton 
                        id={r.downloadId} 
                        endpoint="/api/management/download/admit-card" 
                        filenamePrefix="AdmitCard" 
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
