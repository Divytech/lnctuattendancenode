import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { createMgmtClient, MGMT_DASHBOARD_URL, MGMT_PHOTO_URL, MGMT_SUBJECT_LIST_URL } from "@/lib/ums";
import * as cheerio from "cheerio";
import { JSDOM } from "jsdom";

type Profile = {
  name: string;
  enrollment: string;
  studentId: string;
  gender: string;
  dob: string;
  caste: string;
  abcId: string;
  phone: string;
  email: string;
  address: string;
  course: string;
  specialization: string;
  institute: string;
  admissionYear: string;
  fatherName: string;
  motherName: string;
  photoUrl: string;
};

type Semester = {
  title: string;
  subjects: Array<{ code: string; name: string }>;
};

const fallbackPhoto = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='35' r='20' fill='white' opacity='0.3'/%3E%3Ccircle cx='50' cy='90' r='35' fill='white' opacity='0.3'/%3E%3C/svg%3E";

function InfoCard({ title, rows }: { title: string; rows: Array<[string, string]> }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/65 shadow-[0_10px_30px_rgba(0,0,0,0.22)] backdrop-blur-xl">
      <h2 className="border-b border-white/10 bg-white/[0.02] px-5 py-4 font-extrabold tracking-wide text-slate-100">
        {title}
      </h2>
      <dl className="px-5 py-1">
        {rows.map(([label, value]) => (
          <div key={label} className={`flex flex-col gap-1 border-b border-white/5 py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between ${label === 'Address' ? 'sm:flex-col sm:items-start' : ''}`}>
            <dt className="text-xs font-extrabold uppercase tracking-wide text-slate-500">{label}</dt>
            <dd className={`break-words text-sm font-semibold text-slate-200 sm:max-w-[65%] sm:text-right ${label === 'Address' ? 'sm:max-w-full sm:text-left' : ''}`}>
              {value || 'N/A'}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export default async function ProfilePage() {
  const session = await getSession();
  if (!session.umsCookies) {
    redirect("/api/auth/logout?type=ums");
  }

  const cookieString = Object.entries(session.umsCookies)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
  const client = createMgmtClient(cookieString);

  const profile: Profile = {
    name: "Student", enrollment: "Unknown", studentId: "N/A",
    gender: "N/A", dob: "N/A", caste: "N/A", abcId: "N/A",
    phone: "N/A", email: "N/A", address: "N/A",
    course: "N/A", specialization: "N/A", institute: "N/A", admissionYear: "N/A",
    fatherName: "N/A", motherName: "N/A", photoUrl: fallbackPhoto
  };
  const semesters: Semester[] = [];
  let error: string | null = null;

  try {
    // UMS renders the populated dashboard only for POST requests (the Flask
    // implementation in app.py uses the same request shape).
    const dashRes = await client.post(MGMT_DASHBOARD_URL, "", {
      headers: { Referer: MGMT_DASHBOARD_URL },
      maxRedirects: 0
    });
    if (dashRes.status === 302 || (typeof dashRes.data === "string" && dashRes.data.includes("Secure Sign In"))) {
      redirect("/api/auth/logout?type=ums");
    }

    // JSDOM XPath mirrors the lxml XPath extraction used by app.py.
    const dom = new JSDOM(dashRes.data);
    const document = dom.window.document;
    const XPathResult = dom.window.XPathResult;

    const getText = (...paths: string[]) => {
      for (const xp of paths) {
        try {
          const result = document.evaluate(xp, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
          if (result.singleNodeValue) {
            const value = (result.singleNodeValue.textContent || '').replace(/\s+/g, ' ').trim();
            if (value) return value;
          }
        } catch (e) {
          console.error("XPath error:", xp, e);
        }
      }
      return '';
    };

    profile.name = getText(
      '//h5[contains(@class, "mb-1") and contains(@class, "text-truncate")]/text()',
      '//h5[contains(@class, "text-truncate")]/text()'
    ) || 'Unknown';
    profile.enrollment = getText(
      '//p[contains(@class, "text-primary")]/text()',
      '//dt[normalize-space(.)="Student Id"]/following-sibling::dd[1]//text()'
    ) || 'Unknown';
    profile.studentId = getText('//dt[normalize-space(.)="Student Id"]/following-sibling::dd[1]//text()') || 'N/A';
    profile.gender = getText('//dt[normalize-space(.)="Gender"]/following-sibling::dd[1]//text()') || 'N/A';
    profile.dob = getText(
      '//dt[normalize-space(.)="Date Of Birth"]/following-sibling::dd[1]//text()',
      '//dt[normalize-space(.)="Date of Birth"]/following-sibling::dd[1]//text()'
    ) || 'N/A';
    profile.caste = getText('//dt[normalize-space(.)="Caste"]/following-sibling::dd[1]//text()') || 'N/A';
    profile.abcId = getText('//dt[normalize-space(.)="ABC ID"]/following-sibling::dd[1]//text()') || 'N/A';
    
    profile.phone = getText(
      '//span[normalize-space(.)="Phone Number"]/following-sibling::p[1]//text()',
      '//dt[contains(normalize-space(.), "Mobile")]/following-sibling::dd[1]//text()'
    ) || 'N/A';
    profile.email = getText(
      '//span[normalize-space(.)="Email Address"]/following-sibling::p[1]//text()',
      '//dt[contains(normalize-space(.), "Email")]/following-sibling::dd[1]//text()'
    ) || 'N/A';
    profile.address = getText(
      '//span[normalize-space(.)="Address"]/following-sibling::p[1]//text()',
      '//dt[contains(normalize-space(.), "Address")]/following-sibling::dd[1]//text()'
    ) || 'N/A';
    
    profile.course = getText('//p[normalize-space(.)="Course Name"]/following-sibling::h6[1]//text()') || 'N/A';
    profile.specialization = getText('//p[normalize-space(.)="Specialization"]/following-sibling::h6[1]//text()') || 'N/A';
    profile.institute = getText('//p[normalize-space(.)="Institute Name"]/following-sibling::h6[1]//text()') || 'N/A';
    profile.admissionYear = getText('//p[contains(normalize-space(.), "Admission Year")]/following-sibling::h6[1]//text()') || 'N/A';

    profile.fatherName = getText('//p[contains(normalize-space(.), "Father")]/preceding-sibling::h6[1]//text()') || 'N/A';
    profile.motherName = getText('//p[contains(normalize-space(.), "Mother")]/preceding-sibling::h6[1]//text()') || 'N/A';
    
    // Fetch Photo
    const photoRes = await client.post(MGMT_PHOTO_URL, "", {
      headers: { Referer: MGMT_DASHBOARD_URL }
    });
    const p$ = cheerio.load(photoRes.data);
    const imgTag = p$('img#PHOTO').attr('src');
    if (imgTag && imgTag.length > 20) profile.photoUrl = imgTag;

    // Fetch Subjects
    const subRes = await client.get(MGMT_SUBJECT_LIST_URL, {
      headers: { Referer: MGMT_DASHBOARD_URL }
    });
    if (subRes.status === 200) {
      const s$ = cheerio.load(subRes.data);
      s$('div.d-flex.align-items-center.justify-content-between.mb-4').each((_, card) => {
        const content = s$(card).find('div.overflow-hidden').first();
        const semester = content.find('h6.text-truncate.mb-1').first().text().replace(/\s+/g, ' ').trim();
        if (!content.length || !semester) return;

        const subjects: Semester['subjects'] = [];
        content.find('p').each((__, subjectNode) => {
          const text = s$(subjectNode).text().replace(/\s+/g, ' ').trim();
          if (!text) return;
          const match = text.match(/^\((.*?)\)\s*-\s*(.*)$/);
          subjects.push({
            code: match?.[1]?.trim() || '',
            name: match?.[2]?.trim() || text
          });
        });
        if (subjects.length) semesters.push({ title: semester, subjects });
      });
    }

  } catch (e) {
    console.error("Profile fetch error:", e);
    error = "Failed to load profile.";
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5">
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/15 p-4 text-red-300">
          {error}
        </div>
      )}

      <section className="flex flex-col items-center rounded-2xl border border-white/10 bg-gradient-to-br from-purple-500/15 to-pink-500/10 p-6 text-center shadow-[0_10px_30px_rgba(0,0,0,0.22)] sm:flex-row sm:text-left">
        <div className="mb-4 h-[90px] w-[90px] shrink-0 overflow-hidden rounded-full border-[3px] border-purple-500/60 bg-slate-950 shadow-[0_0_20px_rgba(168,85,247,0.2)] sm:mb-0 sm:mr-5">
          <img src={profile.photoUrl} alt={`${profile.name}'s profile`} className="h-full w-full object-cover" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white">{profile.name}</h1>
          <p className="font-bold text-purple-400">{profile.enrollment}</p>
          <span className="mt-2 inline-block rounded-full border border-green-400/20 bg-green-400/15 px-3 py-1 text-xs font-extrabold text-green-400">
            ✓ Active Account
          </span>
        </div>
      </section>

      <InfoCard title="📋 Basic Information" rows={[
        ['Student ID', profile.studentId],
        ['Gender', profile.gender],
        ['Date of Birth', profile.dob],
        ['Caste', profile.caste],
        ['ABC ID', profile.abcId],
      ]} />

      <InfoCard title="📞 Contact Details" rows={[
        ['Phone', profile.phone],
        ['Email', profile.email],
        ['Address', profile.address],
      ]} />

      <InfoCard title="🎓 Course Information" rows={[
        ['Course', profile.course],
        ['Specialization', profile.specialization],
        ['Institute', profile.institute],
        ['Admission Year', profile.admissionYear],
      ]} />

      <InfoCard title="👨‍👩‍👧 Parents Information" rows={[
        ["Father's Name", profile.fatherName],
        ["Mother's Name", profile.motherName],
      ]} />

      {semesters.length > 0 && (
        <section className="pt-2">
          <h2 className="mb-3 px-2 text-xs font-extrabold uppercase tracking-widest text-slate-500">
            📚 Enrolled Subjects
          </h2>
          <div className="space-y-3">
            {semesters.map((semester, index) => (
              <details key={`${semester.title}-${index}`} open={index === 0} className="group overflow-hidden rounded-2xl border border-white/10 bg-slate-900/65 backdrop-blur-xl">
                <summary className="cursor-pointer list-none bg-white/[0.02] px-5 py-4 font-extrabold text-slate-100 transition-colors group-open:bg-purple-500/10 group-open:text-purple-400 [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center justify-between gap-4">
                    {semester.title}
                    <span className="text-lg transition-transform group-open:rotate-180">⌄</span>
                  </span>
                </summary>
                <ul className="divide-y divide-white/10">
                  {semester.subjects.map((subject, subjectIndex) => (
                    <li key={`${subject.code}-${subject.name}-${subjectIndex}`} className="flex flex-col gap-2 px-5 py-3.5 sm:flex-row sm:items-center">
                      {subject.code && (
                        <span className="min-w-20 self-start rounded-lg bg-purple-500/15 px-2.5 py-1 text-center text-xs font-extrabold text-purple-400 sm:mr-3">
                          {subject.code}
                        </span>
                      )}
                      <span className="text-sm font-semibold text-slate-200">{subject.name}</span>
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
