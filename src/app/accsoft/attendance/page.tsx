import { redirect } from "next/navigation";
import Link from "next/link";
import AttendanceDashboardClient from "@/components/AttendanceDashboardClient";
import { fetchDashboardData } from "./actions";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { data, error } = await fetchDashboardData({});

  if (error === "SessionExpired") {
    redirect("/api/auth/logout?type=accsoft");
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <p className="text-red-400 mb-4">{error || "An unknown error occurred"}</p>
        <Link href="/" className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">Go Back</Link>
      </div>
    );
  }

  const { profile: p, summary: s, subjects: sub, detailed_logs, heatmap_data, semester_options } = data;

  return (
    <AttendanceDashboardClient
      initialProfile={p}
      initialSummary={s}
      initialSubjects={sub}
      initialDetailedLogs={detailed_logs}
      initialHeatmapData={heatmap_data}
      initialSemesterOptions={semester_options}
      initialFilters={{
        semester: "",
        start_date: "",
        end_date: "",
        subject: "--All--"
      }}
    />
  );
}
