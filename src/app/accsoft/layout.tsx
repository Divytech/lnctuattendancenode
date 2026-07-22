import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { fetchDashboardData } from "./attendance/actions";
import AccsoftChrome from "@/components/AccsoftChrome";

export default async function AccsoftLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  // Strict rule: unauthenticated users accessing /accsoft or any subpage are redirected to login
  if (!session.isLoggedIn || !session.accsoftCookies) {
    redirect("/api/auth/logout?type=accsoft");
  }

  let profile = {
    name: session.name || "Student",
    scholar_no: session.enrollment || "N/A",
    roll_no: "N/A",
    pic_url: "",
  };

  try {
    const dashResult = await fetchDashboardData({});
    if (dashResult?.data?.profile) {
      profile = {
        name: dashResult.data.profile.name || profile.name,
        scholar_no: dashResult.data.profile.scholar_no || profile.scholar_no,
        roll_no: dashResult.data.profile.roll_no || "N/A",
        pic_url: dashResult.data.profile.pic_url || "",
      };
    }
  } catch (e) {
    console.error("Accsoft layout profile fetch error:", e);
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <AccsoftChrome
        name={profile.name}
        scholarNo={profile.scholar_no}
        rollNo={profile.roll_no}
        profilePic={profile.pic_url}
        hasUmsSession={Boolean(session.umsCookies)}
      />

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {children}
      </div>
    </div>
  );
}
