import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { createMgmtClient, MGMT_DASHBOARD_URL, MGMT_PHOTO_URL } from "@/lib/ums";
import * as cheerio from "cheerio";
import ManagementChrome from "@/components/ManagementChrome";

export default async function ManagementLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  
  if (!session.umsCookies) {
    redirect("/api/auth/logout?type=ums");
  }

  const cookieString = Object.entries(session.umsCookies)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");

  const client = createMgmtClient(cookieString);

  let profilePic = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='35' r='20' fill='white' opacity='0.3'/%3E%3Ccircle cx='50' cy='90' r='35' fill='white' opacity='0.3'/%3E%3C/svg%3E";
  let name = "Unknown User";
  let enrollment = session.enrollment || "Unknown";

  let shouldRedirect = false;

  try {
    // Fetch dashboard to get basic info
    const dashRes = await client.post(MGMT_DASHBOARD_URL, "", {
      headers: { Referer: MGMT_DASHBOARD_URL },
      maxRedirects: 0
    });
    
    if (dashRes.status === 302 || (typeof dashRes.data === "string" && dashRes.data.includes("Secure Sign In"))) {
      shouldRedirect = true;
    } else {
      const $ = cheerio.load(dashRes.data);
      const nameEl = $('h5.mb-1.text-truncate').first();
      if (nameEl.length) name = nameEl.text().trim();
      
      const enrollEl = $('p.text-primary').first();
      if (enrollEl.length) enrollment = enrollEl.text().trim();
    }

    // Fetch Photo
    const photoRes = await client.post(MGMT_PHOTO_URL, "", {
      headers: { Referer: MGMT_DASHBOARD_URL }
    });
    
    const p$ = cheerio.load(photoRes.data);
    const imgTag = p$('img#PHOTO').attr('src');
    if (imgTag && imgTag.length > 20) {
      profilePic = imgTag;
    }
  } catch (e) {
    console.error("Layout fetch error:", e);
  }

  if (shouldRedirect) {
    redirect("/api/auth/logout?type=ums");
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <ManagementChrome
        name={name}
        enrollment={enrollment}
        profilePic={profilePic}
        hasAccsoftSession={Boolean(session.isLoggedIn)}
      />

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {children}
      </div>
    </div>
  );
}
