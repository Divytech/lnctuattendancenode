import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { createMgmtClient, MARKS_VIEW_PAPERS_URL, MGMT_DASHBOARD_URL } from "@/lib/ums";
import * as cheerio from "cheerio";

export default async function MarksPage() {
  const session = await getSession();
  if (!session.umsCookies) {
    redirect("/api/auth/logout?type=ums");
  }

  const cookieString = Object.entries(session.umsCookies)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
  const client = createMgmtClient(cookieString);

  let error = null;
  let marksData = null;

  try {
    // Determine enrollment
    let enrollment = session.enrollment;
    if (!enrollment) {
      const dashRes = await client.get(MGMT_DASHBOARD_URL);
      if (dashRes.status === 302) redirect("/api/auth/logout?type=ums");
      
      const $ = cheerio.load(dashRes.data);
      const enrollEl = $('p.text-primary').first();
      if (enrollEl.length) {
        enrollment = enrollEl.text().trim();
      } else {
        const text = $.text();
        const match = text.match(/(LN[A-Z0-9]+)/);
        if (match) enrollment = match[1];
      }
    }

    if (!enrollment) {
      throw new Error("Could not determine enrollment number. Please relogin.");
    }

    // Try recent semesters with recent months
    const currentYear = new Date().getFullYear();
    const attempts = [];
    for (const sem of ['05', '04', '03', '06', '07', '02', '01', '08']) {
      for (const year of [currentYear, currentYear - 1, currentYear - 2]) {
        for (const month of [12, 6, 5, 4]) {
          attempts.push({ SEM: sem, YR_MON: `${year}-${month.toString().padStart(2, '0')}`, CATEGORY: 'REGULAR', ENROL_NO: enrollment });
        }
      }
    }

    const ajaxHeaders = { 'X-Requested-With': 'XMLHttpRequest', 'Referer': "https://www.universitymanagementsystem.com/lnctbhopal/Student/studentrevalform" };
    
    // We will do attempts sequentially but limit to a reasonable number to avoid long loading times. 
    // In Python this was synchronous and slow. We can try in small batches.
    const BATCH_SIZE = 5;
    for (let i = 0; i < Math.min(attempts.length, 30); i += BATCH_SIZE) {
      const batch = attempts.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(batch.map(params => 
        client.get(MARKS_VIEW_PAPERS_URL, { params, headers: ajaxHeaders })
      ));

      for (const res of results) {
        if (res.status === 'fulfilled' && res.value.status === 200) {
          const text = res.value.data;
          const $ = cheerio.load(text);
          const tbody = $('tbody#tbd');
          if (tbody.length && tbody.find('tr').length > 0) {
            
            const subjects: any[] = [];
            tbody.find('tr').each((_, tr) => {
              const cols = $(tr).find('td');
              if (cols.length >= 3) {
                const code = $(cols[1]).text().trim();
                const rawText = $(cols[2]).text().trim();
                let name = rawText;
                let marks = "N/A";
                
                const match = rawText.match(/(.*?)\(Obtained Marks\s*-\s*(\d+)\)/i);
                if (match) {
                  name = match[1].trim();
                  marks = match[2].trim();
                }
                subjects.push({ code, name, marks });
              }
            });

            if (subjects.length > 0) {
              const getVal = (label: string) => {
                const tag = $(`td:contains("${label}")`);
                return tag.length ? tag.next('td').text().trim() : "N/A";
              };

              marksData = {
                name: getVal("Candidate's Name"),
                semester: getVal("Semester/Year"),
                subjects
              };
              break; // Found it! Break the inner loop
            }
          }
        }
      }
      if (marksData) break; // Break the outer loop
    }

  } catch (e: any) {
    console.error("Marks fetch error:", e);
    error = e.message || "Failed to load marks.";
  }

  return (
    <div className="space-y-6">
      {error && <div className="p-4 bg-red-500/20 text-red-300 rounded-xl">{error}</div>}
      
      {!marksData && !error ? (
        <div className="glass-card p-10 text-center text-gray-400">
          <p>No recent marks found. (We checked the most common recent exam sessions).</p>
        </div>
      ) : marksData ? (
        <div className="glass-card overflow-hidden">
          <div className="p-4 border-b border-white/10 bg-amber-900/20">
            <h3 className="text-lg font-bold text-amber-300 mb-1">{marksData.semester} - Detailed Marks</h3>
            <p className="text-sm text-gray-400">{marksData.name}</p>
          </div>
          <div className="w-full overflow-hidden">
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className="bg-black/40 text-gray-400 text-[10px] sm:text-xs uppercase tracking-wider">
                  <th className="p-2.5 sm:p-4 font-medium w-[28%] sm:w-32">Subject Code</th>
                  <th className="p-2.5 sm:p-4 font-medium">Subject Name</th>
                  <th className="p-2.5 sm:p-4 font-medium text-right w-[24%] sm:w-[20%]">Marks Obtained</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs sm:text-sm">
                {marksData.subjects.map((sub: any, i: number) => (
                  <tr key={i} className="hover:bg-white/5 transition-colors">
                    <td className="p-2.5 sm:p-4 font-mono text-gray-400 bg-black/20 text-[11px] sm:text-xs truncate">{sub.code}</td>
                    <td className="p-2.5 sm:p-4 font-medium text-gray-200 truncate">{sub.name}</td>
                    <td className="p-2.5 sm:p-4 text-right">
                      <span className="text-base sm:text-xl font-black text-amber-400">{sub.marks}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
