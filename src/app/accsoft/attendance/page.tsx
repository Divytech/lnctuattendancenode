import { redirect } from "next/navigation";
import Link from "next/link";
import AttendanceDashboardClient from "@/components/AttendanceDashboardClient";
import { fetchDashboardData } from "./actions";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams;
  const semester = typeof params.semester === "string" ? params.semester : "";
  const start_date = typeof params.start_date === "string" ? params.start_date : "";
  const end_date = typeof params.end_date === "string" ? params.end_date : "";

  const result = await fetchDashboardData({ semester, start_date, end_date });

  if (result.error === "SessionExpired") {
    redirect("/api/auth/logout?type=accsoft");
  }

  if (result.error || !result.data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <p className="text-red-400 mb-4">{result.error || "An unknown error occurred"}</p>
        <Link href="/" className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">Go Back</Link>
      </div>
    );
  }

  const { profile: p, summary: s, subjects: sub, detailed_logs, heatmap_data, semester_options } = result.data;
  // Use the server-returned filters (which include auto-populated dates after semester switch)
  const serverFilters = result.filters;

  return (
    <AttendanceDashboardClient
      initialProfile={p}
      initialSummary={s}
      initialSubjects={sub}
      initialDetailedLogs={detailed_logs}
      initialHeatmapData={heatmap_data}
      initialSemesterOptions={semester_options}
      initialFilters={{
        semester: serverFilters?.semester || semester,
        start_date: serverFilters?.start_date || start_date,
        end_date: serverFilters?.end_date || end_date,
        subject: "--All--"
      }}
    />
  );
}

