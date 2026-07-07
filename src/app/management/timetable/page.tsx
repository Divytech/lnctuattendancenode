import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { createMgmtClient, TIMETABLE_URL, VIEW_PAPERS_URL } from "@/lib/ums";
import * as cheerio from "cheerio";
import Link from "next/link";
import { Calendar } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TimetablePage({ searchParams }: { searchParams: Promise<{ sem?: string }> }) {
  // Next.js 15+ requires awaiting searchParams
  const params = await searchParams;
  const selectedSem = params.sem || "";

  const session = await getSession();
  if (!session.umsCookies) {
    redirect("/api/auth/logout?type=ums");
  }

  const cookieString = Object.entries(session.umsCookies)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
  const client = createMgmtClient(cookieString);

  let schedules: any[] = [];
  let error = null;
  let activeTimetable: any[] | null = null;

  try {
    const res = await client.get(TIMETABLE_URL, {
      headers: { Referer: "https://www.universitymanagementsystem.com/lnctbhopal/Student/Dashboard" },
      maxRedirects: 0
    });

    if (res.status === 302 || (typeof res.data === "string" && res.data.includes("Secure Sign In"))) {
      redirect("/api/auth/logout?type=ums");
    }

    const $ = cheerio.load(res.data);
    
    // Match the Python selector: div.row.py-3.border-bottom.align-items-start.flex-wrap
    $('div.row.py-3.border-bottom').each((_, row) => {
      const cols = $(row).find('div.col-12.col-md');
      if (cols.length >= 3) {
        const clean = (el: any) => {
          const t = $(el).text().trim();
          return t.includes(':') ? t.split(':')[1].trim() : t;
        };

        const getVal = (label: string, defaultIdx: number) => {
          let val = defaultIdx < cols.length ? clean(cols[defaultIdx]) : '';
          cols.each((_, c) => {
            if ($(c).text().includes(label)) val = clean(c);
          });
          return val;
        };

        const sessionVal = getVal("Session", 1);
        const semester = getVal("Semester", 2);
        const category = getVal("Exam Category", 5);
        
        let semKey = "";
        const aTag = $(row).find('a[onclick*="ShowPaper"]');
        if (aTag.length) {
          const match = (aTag.attr('onclick') || '').match(/ShowPaper\s*\(\s*['"]([^'"]+)['"]\s*\)/);
          if (match) semKey = match[1];
        }

        if (semKey) {
          schedules.push({ session: sessionVal, semester, category, semKey });
        }
      }
    });

    // If a semester is selected, fetch its papers
    if (selectedSem) {
      const ajaxHeaders = { 'X-Requested-With': 'XMLHttpRequest', 'Referer': TIMETABLE_URL };
      const tpRes = await client.get(`${VIEW_PAPERS_URL}?SEM=${selectedSem}`, { headers: ajaxHeaders });
      
      if (tpRes.status === 200) {
        const t$ = cheerio.load(tpRes.data);
        const subjects: any[] = [];
        
        t$('table').find('tr').each((_, tr) => {
          const tCols = t$(tr).find('td');
          if (tCols.length >= 5) {
            const firstCol = t$(tCols[0]).text().trim().toLowerCase();
            if (firstCol !== 's.no' && firstCol !== '#' && firstCol !== 'srl') {
              subjects.push({
                code: t$(tCols[1]).text().trim(),
                name: t$(tCols[2]).text().trim(),
                theory: t$(tCols[3]).text().trim(),
                practical: t$(tCols[4]).text().trim()
              });
            }
          }
        });
        
        activeTimetable = subjects;
      }
    }

  } catch (e: any) {
    if (e.message === "NEXT_REDIRECT" || (e.digest && e.digest.startsWith("NEXT_REDIRECT"))) {
      throw e;
    }
    console.error("Timetable fetch error:", e);
    error = "Failed to load timetable.";
  }

  return (
    <div className="space-y-6">
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
          <h2 className="text-lg font-bold">Time Tables</h2>
          <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded">Schedules</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/40 text-gray-400 text-xs uppercase tracking-wider">
                <th className="p-4 font-medium">Session</th>
                <th className="p-4 font-medium">Semester</th>
                <th className="p-4 font-medium">Category</th>
                <th className="p-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {error ? (
                <tr><td colSpan={4} className="p-8 text-center text-red-400">{error}</td></tr>
              ) : schedules.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-gray-500">No schedules found</td></tr>
              ) : (
                schedules.map((r, i) => (
                  <tr key={i} className={`transition-colors ${selectedSem === r.semKey ? 'bg-indigo-500/10' : 'hover:bg-white/5'}`}>
                    <td className="p-4 font-medium text-gray-300">{r.session}</td>
                    <td className="p-4 text-indigo-400 font-bold">{r.semester}</td>
                    <td className="p-4 text-gray-400">{r.category}</td>
                    <td className="p-4 text-right">
                      {r.semKey ? (
                        <Link href={`/management/timetable?sem=${r.semKey}`} className={`inline-flex items-center text-xs px-3 py-1.5 rounded transition-colors ${selectedSem === r.semKey ? 'bg-indigo-500 text-white shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-white/10 hover:bg-white/20 text-gray-200'}`}>
                          <Calendar className="w-3 h-3 mr-1" /> {selectedSem === r.semKey ? 'Viewing' : 'View Schedule'}
                        </Link>
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

      {activeTimetable && activeTimetable.length > 0 && (
        <div className="glass-card overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          <div className="p-4 border-b border-white/10 bg-indigo-900/20">
            <h3 className="text-lg font-bold text-indigo-300">Examination Schedule</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black/40 text-gray-400 text-xs uppercase tracking-wider">
                  <th className="p-4 font-medium">Code</th>
                  <th className="p-4 font-medium">Subject</th>
                  <th className="p-4 font-medium">Theory</th>
                  <th className="p-4 font-medium">Practical</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {activeTimetable.map((sub, i) => (
                  <tr key={i} className="hover:bg-white/5">
                    <td className="p-4 text-xs font-mono text-gray-400 bg-black/20">{sub.code}</td>
                    <td className="p-4 font-medium text-gray-200">{sub.name}</td>
                    <td className="p-4 text-teal-400 font-semibold">{sub.theory}</td>
                    <td className="p-4 text-emerald-400 font-semibold">{sub.practical}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
