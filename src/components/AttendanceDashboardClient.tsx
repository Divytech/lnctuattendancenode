"use client";

import { useState, useEffect, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { fetchDashboardData } from "@/app/accsoft/attendance/actions";
import {
  User,
  Calendar,
  BookOpen,
  Filter,
  Download,
  FileText,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  X,
  LogOut
} from "lucide-react";
import Link from "next/link";

type Subject = {
  name: string;
  short_name: string;
  held: number;
  present: number;
  absent: number;
};

type Log = {
  sr_no: string;
  date: string;
  period: string;
  subject: string;
  short_name: string;
  status: 'P' | 'A';
};

type Profile = {
  name: string;
  pic_url: string;
  roll_no: string;
  scholar_no: string;
  course: string;
};

type Summary = {
  total_classes: number;
  present: number;
  absent: number;
  percent: string;
  percent_raw: number;
};

type Props = {
  initialProfile: Profile;
  initialSummary: Summary;
  initialSubjects: Subject[];
  initialDetailedLogs: Log[];
  initialHeatmapData: Record<string, { present: number; total: number; percent: number }>;
  initialSemesterOptions: { value: string; text: string; selected: boolean }[];
  initialFilters: {
    semester: string;
    start_date: string;
    end_date: string;
    subject: string;
  };
};

export default function AttendanceDashboardClient({
  initialProfile,
  initialSummary,
  initialSubjects,
  initialDetailedLogs,
  initialHeatmapData,
  initialSemesterOptions,
  initialFilters
}: Props) {
  const router = useRouter();

  // Local Data State
  const [profile, setProfile] = useState(initialProfile);
  const [summary, setSummary] = useState(initialSummary);
  const [subjects, setSubjects] = useState(initialSubjects);
  const [detailedLogs, setDetailedLogs] = useState(initialDetailedLogs);
  const [heatmapData, setHeatmapData] = useState(initialHeatmapData);
  const [semesterOptions, setSemesterOptions] = useState(initialSemesterOptions);

  const [isLoading, setIsLoading] = useState(false);

  // Filters state
  const [selectedSemester, setSelectedSemester] = useState(initialFilters.semester || semesterOptions.find(o => o.selected)?.value || "");
  const [startDate, setStartDate] = useState(initialFilters.start_date || "");
  const [endDate, setEndDate] = useState(initialFilters.end_date || "");
  const [selectedSubject, setSelectedSubject] = useState(initialFilters.subject || "--All--");

  // UI state
  const [activeChartRange, setActiveChartRange] = useState<"7d" | "30d" | "all">("7d");
  const [selectedDayDetail, setSelectedDayDetail] = useState<{ dateStr: string; logs: Log[] } | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Month state for Heatmap
  const [heatmapDate, setHeatmapDate] = useState(() => {
    if (initialFilters.end_date) {
      const d = new Date(initialFilters.end_date);
      if (!isNaN(d.getTime())) return d;
    }
    if (detailedLogs.length > 0) {
      const times = detailedLogs.map(l => new Date(l.date).getTime()).filter(t => !isNaN(t));
      if (times.length > 0) return new Date(Math.max(...times));
    }
    return new Date();
  });

  // Tooltip state
  const [tooltip, setTooltip] = useState<{
    content: string;
    x: number;
    y: number;
    visible: boolean;
  }>({ content: "", x: 0, y: 0, visible: false });

  // Handle data fetching locally to avoid URL query parameters
  const refreshData = async (semester: string, start: string, end: string) => {
    setIsLoading(true);
    try {
      const res = await fetchDashboardData({ semester, start_date: start, end_date: end });
      if (res.error === "SessionExpired") {
        router.push("/api/auth/logout?type=accsoft");
        return;
      }
      if (res.data) {
        setProfile(res.data.profile);
        setSummary(res.data.summary);
        setSubjects(res.data.subjects);
        setDetailedLogs(res.data.detailed_logs);
        setHeatmapData(res.data.heatmap_data);
        setSemesterOptions(res.data.semester_options);
        // Also update heatmap month focus
        if (end) {
          const d = new Date(end);
          if (!isNaN(d.getTime())) setHeatmapDate(d);
        } else if (res.data.detailed_logs.length > 0) {
          const times = res.data.detailed_logs.map((l: Log) => new Date(l.date).getTime()).filter((t: number) => !isNaN(t));
          if (times.length > 0) setHeatmapDate(new Date(Math.max(...times)));
        }
      } else if (res.error) {
        alert(res.error);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to load data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle filter submission
  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    refreshData(selectedSemester, startDate, endDate);
  };

  // Handle semester change instantly
  const handleSemesterChange = (semVal: string) => {
    setSelectedSemester(semVal);
    refreshData(semVal, startDate, endDate);
  };

  // Filter logs locally based on JS subject selector
  const filteredLogs = useMemo(() => {
    let visibleCount = 0;
    return detailedLogs.map(log => {
      const showRow =
        selectedSubject === "--All--" ||
        (selectedSubject === "--Absents--" && log.status === "A") ||
        log.subject === selectedSubject;

      if (showRow) {
        visibleCount++;
        return { ...log, displayIndex: visibleCount, visible: true };
      }
      return { ...log, displayIndex: 0, visible: false };
    });
  }, [detailedLogs, selectedSubject]);

  // CSV Export
  const exportToCSV = () => {
    const header = ["#", "Date", "Period", "Subject", "Status"];
    const rows = filteredLogs
      .filter(l => l.visible)
      .map((l) => [
        l.displayIndex,
        l.date,
        l.period || "-",
        l.short_name || l.subject,
        l.status
      ]);

    const csvContent = [header, ...rows]
      .map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${profile.name.replace(/\s+/g, "_")}_attendance_log.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  // PDF / Print Export
  const exportToPDF = () => {
    const rowsHTML = filteredLogs
      .filter(l => l.visible)
      .map(l => `
        <tr>
          <td style="border:1px solid #334155;padding:8px 12px;text-align:left;">${l.displayIndex}</td>
          <td style="border:1px solid #334155;padding:8px 12px;text-align:left;font-weight:700;">${l.date}</td>
          <td style="border:1px solid #334155;padding:8px 12px;text-align:center;">${l.period || '-'}</td>
          <td style="border:1px solid #334155;padding:8px 12px;text-align:left;">${l.short_name || l.subject}</td>
          <td style="border:1px solid #334155;padding:8px 12px;text-align:center;font-weight:700;${l.status === 'P' ? 'color:#10b981;' : 'color:#ef4444;'
        }">${l.status}</td>
        </tr>
      `).join("");

    const win = window.open('about:blank', '_blank');
    if (!win) {
      alert('Please allow popups for this site.');
      return;
    }

    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Attendance Log - ${profile.name}</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; padding: 30px; color: #f8fafc; background: #0f172a; margin: 0; }
          h2 { margin-bottom: 5px; color: #fff; }
          .meta { color: #94a3b8; margin-bottom: 20px; font-size: 14px; }
          table { border-collapse: collapse; width: 100%; border: 1px solid #334155; }
          th { background: #1e293b; font-weight: 700; color: #94a3b8; text-transform: uppercase; font-size: 12px; border: 1px solid #334155; padding: 12px; text-align: left; }
          .print-btn { position: fixed; bottom: 24px; right: 24px; background: linear-gradient(135deg, #a855f7, #ec4899); color: #fff; border: none; padding: 14px 28px; border-radius: 14px; font-size: 15px; font-weight: 800; cursor: pointer; box-shadow: 0 4px 20px rgba(168,85,247,0.4); letter-spacing: 0.5px; }
          @media print { .print-btn { display: none!important } body { padding: 10px; background: #fff; color: #000; } table { border-color: #ddd; } th { background: #f1f5f9; color: #334; border-color: #ddd; } td { border-color: #ddd; } }
        </style>
      </head>
      <body>
        <h2>${profile.name}</h2>
        <p class="meta">Attendance Log &bull; ${profile.course} &bull; Scholar: ${profile.scholar_no} &bull; Roll: ${profile.roll_no}</p>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Date</th>
              <th>Period</th>
              <th>Subject</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHTML}
          </tbody>
        </table>
        <button class="print-btn" onclick="window.print()">🖨️ Print / Save PDF</button>
      </body>
      </html>
    `);
    win.document.close();
  };

  // ----------------------------------------
  // TREND CALCULATION & CUSTOM SVG RENDERING
  // ----------------------------------------
  const trendPoints = useMemo(() => {
    const logs: { date: Date; status: string }[] = [];
    detailedLogs.forEach(log => {
      const d = new Date(log.date);
      if (!isNaN(d.getTime())) {
        logs.push({ date: d, status: log.status });
      }
    });

    if (logs.length === 0) return [];

    // Sort ascending by date
    logs.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Most recent date in logs
    const maxDate = new Date(logs[logs.length - 1].date.getTime());

    let startDate: Date | null = null;
    if (activeChartRange === "7d") {
      startDate = new Date(maxDate);
      startDate.setDate(maxDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
    } else if (activeChartRange === "30d") {
      startDate = new Date(maxDate);
      startDate.setDate(maxDate.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
    }

    const getDisplayStr = (d: Date) =>
      `${String(d.getDate()).padStart(2, '0')}-${d.toLocaleString('default', { month: 'short' })}`;

    const dailyMap = new Map<string, { total: number; present: number; obj: Date }>();
    logs.forEach(l => {
      const dayStr = l.date.toDateString();
      if (!dailyMap.has(dayStr)) {
        dailyMap.set(dayStr, { total: 0, present: 0, obj: l.date });
      }
      const entry = dailyMap.get(dayStr)!;
      entry.total++;
      if (l.status === 'P') entry.present++;
    });

    let runningTotal = 0;
    let runningPresent = 0;
    const points: { date: string; percent: number; timestamp: number }[] = [];

    for (const [, dayStats] of dailyMap) {
      runningTotal += dayStats.total;
      runningPresent += dayStats.present;
      if (!startDate || dayStats.obj >= startDate) {
        points.push({
          date: getDisplayStr(dayStats.obj),
          percent: parseFloat(((runningPresent / runningTotal) * 100).toFixed(2)),
          timestamp: dayStats.obj.getTime()
        });
      }
    }
    return points;
  }, [detailedLogs, activeChartRange]);

  // SVG Chart path calculation
  const svgChartDimensions = { width: 1000, height: 160 };
  const leftPad = 50;
  const rightPad = 15;
  const availWidth = svgChartDimensions.width - leftPad - rightPad;

  const chartPathData = useMemo(() => {
    if (trendPoints.length < 2) return { path: "", fillPath: "", dots: [] as any[] };

    const minPct = 0;
    const maxPct = 100;
    const count = trendPoints.length;

    const points = trendPoints.map((p, idx) => {
      const x = leftPad + (idx / (count - 1)) * availWidth;
      // Invert Y because SVG coordinates start from top-left (0,0)
      const y = svgChartDimensions.height - ((p.percent - minPct) / (maxPct - minPct)) * svgChartDimensions.height;
      return { x, y, ...p };
    });

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      // Draw smooth line
      const prev = points[i - 1];
      const curr = points[i];
      const cpX1 = prev.x + (curr.x - prev.x) / 3;
      const cpY1 = prev.y;
      const cpX2 = prev.x + 2 * (curr.x - prev.x) / 3;
      const cpY2 = curr.y;
      path += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${curr.x} ${curr.y}`;
    }

    const fillPath = `${path} L ${points[points.length - 1].x} ${svgChartDimensions.height} L ${points[0].x} ${svgChartDimensions.height} Z`;

    return { path, fillPath, dots: points };
  }, [trendPoints, availWidth]);

  // ----------------------------------------
  // HEATMAP CALENDAR RENDER COMPUTATION
  // ----------------------------------------
  const heatmapDays = useMemo(() => {
    const year = heatmapDate.getFullYear();
    const month = heatmapDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const dayCells = [];

    // Add empty cells for padding
    for (let i = 0; i < firstDayIndex; i++) {
      dayCells.push({ day: 0, dateKey: "", levelClass: "empty" });
    }

    // Add cells for days
    for (let i = 1; i <= daysInMonth; i++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const stats = heatmapData[dateKey];
      let levelClass = "no-class";

      if (stats) {
        const pct = stats.percent;
        if (pct >= 100) levelClass = "level-100";
        else if (pct >= 75) levelClass = "level-75";
        else if (pct >= 50) levelClass = "level-50";
        else if (pct > 0) levelClass = "level-25";
        else levelClass = "level-0";
      }

      dayCells.push({
        day: i,
        dateKey,
        levelClass,
        stats
      });
    }

    return dayCells;
  }, [heatmapDate, heatmapData]);

  const changeMonth = (delta: number) => {
    const newDate = new Date(heatmapDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setHeatmapDate(newDate);
  };

  const handleCellClick = (dayCell: typeof heatmapDays[0]) => {
    if (dayCell.levelClass === "empty" || dayCell.levelClass === "no-class") return;

    const dateKey = dayCell.dateKey;
    const dayLogs = detailedLogs.filter(log => {
      const logD = new Date(log.date);
      if (isNaN(logD.getTime())) return log.date === dateKey;
      const fmtLogDate = `${logD.getFullYear()}-${String(logD.getMonth() + 1).padStart(2, '0')}-${String(logD.getDate()).padStart(2, '0')}`;
      return fmtLogDate === dateKey;
    });

    setSelectedDayDetail({
      dateStr: new Date(dateKey).toLocaleDateString("en-US", {
        weekday: "long",
        day: "numeric",
        month: "short",
        year: "numeric"
      }),
      logs: dayLogs
    });
  };

  // ----------------------------------------
  // INSIGHTS & PROJECTIONS COMPUTATION
  // ----------------------------------------
  const insights = useMemo(() => {
    const total = summary.total_classes;
    const present = summary.present;
    const percent = summary.percent_raw;

    if (total === 0) return null;

    // Targets needed or skips allowed
    const targets = [50, 60, 70, 75, 80, 90].map(target => {
      if (percent < target) {
        const needed = Math.ceil((total * target / 100 - present) / (1 - target / 100));
        return { target, action: "attend", count: needed > 0 ? needed : 0 };
      } else {
        const canSkip = Math.floor(present * 100 / target - total);
        return { target, action: "skip", count: canSkip > 0 ? canSkip : 0 };
      }
    });

    // Impact calculator
    const newTotal = total + 1;
    const bunkLoss = (percent - (present / newTotal * 100)).toFixed(2);
    const attendGain = (((present + 1) / newTotal * 100) - percent).toFixed(2);

    const loss7 = (percent - ((present / (total + 7)) * 100)).toFixed(2);
    const gain7 = ((((present + 7) / (total + 7)) * 100) - percent).toFixed(2);

    // Peak and lowest cumulative calculations
    const logsList: { date: Date; status: string }[] = [];
    detailedLogs.forEach(log => {
      const d = new Date(log.date);
      if (!isNaN(d.getTime())) logsList.push({ date: d, status: log.status });
    });

    let peak = null;
    let lowest = null;

    if (logsList.length > 0) {
      logsList.sort((a, b) => a.date.getTime() - b.date.getTime());
      let runT = 0, runP = 0;
      const dailyCumulative: { date: Date; pct: number; p: number; t: number }[] = [];
      const dailyM = new Map<string, { total: number; present: number; obj: Date }>();

      logsList.forEach(l => {
        const dayStr = l.date.toDateString();
        if (!dailyM.has(dayStr)) dailyM.set(dayStr, { total: 0, present: 0, obj: l.date });
        const e = dailyM.get(dayStr)!;
        e.total++;
        if (l.status === 'P') e.present++;
      });

      for (const [, stats] of dailyM) {
        runT += stats.total;
        runP += stats.present;
        const pct = parseFloat(((runP / runT) * 100).toFixed(2));
        dailyCumulative.push({ date: stats.obj, pct, p: runP, t: runT });
      }

      // Filter out initial 0% entries
      let startIdx = 0;
      while (startIdx < dailyCumulative.length && dailyCumulative[startIdx].pct === 0) startIdx++;
      const filteredCum = dailyCumulative.slice(startIdx);

      if (filteredCum.length > 0) {
        let peakIdx = 0, lowIdx = 0;
        filteredCum.forEach((entry, i) => {
          if (entry.pct > filteredCum[peakIdx].pct) peakIdx = i;
          if (entry.pct < filteredCum[lowIdx].pct) lowIdx = i;
        });
        peak = filteredCum[peakIdx];
        lowest = filteredCum[lowIdx];
      }
    }

    return {
      targets,
      bunkLoss,
      attendGain,
      loss7,
      gain7,
      peak,
      lowest
    };
  }, [summary, detailedLogs]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">

      {isLoading && (
        <div className="fixed inset-0 z-[10000] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      )}

      {/* 1. Profile / Header bar */}
      <header className="flex flex-col md:flex-row items-center justify-between gap-4 glass-card p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)]">
            {profile.pic_url ? (
              <img src={profile.pic_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                <User className="w-8 h-8 text-slate-400" />
              </div>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
              {profile.name}
            </h1>
            <p className="text-sm text-slate-400 font-mono">{profile.roll_no} • {profile.scholar_no}</p>
            <p className="text-xs text-purple-400 font-semibold mt-1">{profile.course}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/management" className="px-4 py-2.5 bg-teal-500/10 text-teal-300 rounded-2xl hover:bg-teal-500/20 transition-colors border border-teal-500/20 font-bold text-xs sm:text-sm">
            UMS Portal
          </Link>
          <Link href="/api/auth/logout?type=accsoft" className="flex items-center px-4 py-2.5 bg-red-500/10 text-red-300 rounded-2xl hover:bg-red-500/20 transition-colors border border-red-500/20 font-bold text-xs sm:text-sm">
            <LogOut className="w-4 h-4 mr-1.5" /> Logout
          </Link>
        </div>
      </header>

      {/* 2. Semester Dropdown */}
      {semesterOptions.length > 1 && (
        <div className="glass-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-400" />
            <span className="font-extrabold text-sm text-slate-300 uppercase tracking-wider">Active Semester</span>
          </div>
          <select
            value={selectedSemester}
            onChange={(e) => handleSemesterChange(e.target.value)}
            className="w-full sm:w-64 bg-slate-950/70 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          >
            {semesterOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.text}</option>
            ))}
          </select>
        </div>
      )}

      {/* 3. Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-5 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-black text-white">{summary.total_classes}</span>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Total Classes</span>
        </div>
        <div className="glass-card p-5 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-black text-emerald-400">{summary.present}</span>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Present</span>
        </div>
        <div className="glass-card p-5 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-black text-red-400">{summary.absent}</span>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Absent</span>
        </div>
        <div className="glass-card p-5 flex flex-col items-center justify-center text-center">
          <span className={`text-3xl font-black ${summary.percent_raw >= 75 ? "text-emerald-400" : "text-red-400"
            }`}>{summary.percent}</span>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Percentage</span>
        </div>
      </div>

      {/* 4. Trend Chart */}
      <div className="glass-card p-5 min-h-[320px] flex flex-col justify-between">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            <h2 className="font-extrabold text-sm uppercase tracking-wider text-slate-200">Attendance Trend</h2>
          </div>
          <div className="flex gap-1.5 bg-black/40 p-1 rounded-xl border border-white/5">
            {(["7d", "30d", "all"] as const).map(range => (
              <button
                key={range}
                onClick={() => setActiveChartRange(range)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeChartRange === range
                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                  : "text-slate-400 hover:text-slate-200"
                  }`}
              >
                {range.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex-grow relative flex items-center justify-center">
          {isClient && trendPoints.length >= 2 ? (
            <div className="w-full h-[200px] px-2 animate-in fade-in duration-300">
              <svg
                viewBox="0 0 1000 200"
                className="w-full h-full overflow-visible"
              >
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Y-axis Labels & Grid Lines */}
                {[0, 25, 50, 75, 100].map((pct) => {
                  const y = svgChartDimensions.height - (pct / 100) * svgChartDimensions.height;
                  return (
                    <g key={pct}>
                      <line
                        x1={leftPad}
                        y1={y}
                        x2={svgChartDimensions.width - rightPad}
                        y2={y}
                        stroke="rgba(255,255,255,0.05)"
                        strokeWidth="1"
                        strokeDasharray={pct === 0 || pct === 100 ? "0" : "4 4"}
                      />
                      <text
                        x="10"
                        y={pct === 100 ? y + 9 : pct === 0 ? y - 3 : y + 3}
                        fill="rgba(255,255,255,0.4)"
                        fontSize="11"
                        fontWeight="bold"
                        className="font-mono"
                      >
                        {pct}%
                      </text>
                    </g>
                  );
                })}

                {/* Fill Under Chart */}
                <path d={chartPathData.fillPath} fill="url(#chartGradient)" />

                {/* Main Line */}
                <path
                  d={chartPathData.path}
                  fill="none"
                  stroke="#a855f7"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />

                {/* X-Axis Date Labels */}
                {chartPathData.dots.length > 0 && (() => {
                  const step = Math.max(1, Math.floor(chartPathData.dots.length / 4));
                  const labelsToRender = [];
                  for (let i = 0; i < chartPathData.dots.length; i += step) {
                    labelsToRender.push(chartPathData.dots[i]);
                  }
                  if (chartPathData.dots.length > 1 && !labelsToRender.includes(chartPathData.dots[chartPathData.dots.length - 1])) {
                    labelsToRender.push(chartPathData.dots[chartPathData.dots.length - 1]);
                  }

                  return labelsToRender.map((pt, idx) => (
                    <text
                      key={idx}
                      x={pt.x}
                      y={svgChartDimensions.height + 22}
                      fill="rgba(255,255,255,0.4)"
                      fontSize="10"
                      fontWeight="bold"
                      textAnchor="middle"
                      className="font-mono"
                    >
                      {pt.date}
                    </text>
                  ));
                })()}

                {/* Tooltip circles on points */}
                {chartPathData.dots.map((pt, idx) => (
                  <circle
                    key={idx}
                    cx={pt.x}
                    cy={pt.y}
                    r="5.5"
                    fill="#ec4899"
                    stroke="#fff"
                    strokeWidth="2"
                    className="cursor-pointer transition-colors duration-150 hover:fill-white hover:stroke-purple-500"
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setTooltip({
                        content: `${pt.date} • ${pt.percent}%`,
                        x: rect.left + rect.width / 2,
                        y: rect.top - 8,
                        visible: true
                      });
                    }}
                    onMouseLeave={() => setTooltip(prev => ({ ...prev, visible: false }))}
                  />
                ))}
              </svg>
            </div>
          ) : (
            <p className="text-xs text-slate-500 font-semibold py-10">No attendance log data available for this range.</p>
          )}
        </div>
      </div>

      {/* 5. Subjects View Table */}
      {subjects.length > 0 && (
        <div className="glass-card overflow-hidden">
          <div className="p-4 border-b border-white/10 bg-white/3 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-400" />
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-200">Subject Wise Overview</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black/30 text-slate-400 text-xs uppercase tracking-wider border-b border-white/5">
                  <th className="p-4 font-extrabold">Subject</th>
                  <th className="p-4 font-extrabold text-center">Total</th>
                  <th className="p-4 font-extrabold text-center">P</th>
                  <th className="p-4 font-extrabold text-center">A</th>
                  <th className="p-4 font-extrabold text-right">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {subjects.map((s, i) => {
                  const pct = s.held > 0 ? Math.round((s.present / s.held) * 100) : 0;
                  return (
                    <tr key={i} className="hover:bg-white/3 transition-colors">
                      <td className="p-4 font-bold text-slate-200">{s.short_name}</td>
                      <td className="p-4 text-center text-slate-400 font-mono">{s.held}</td>
                      <td className="p-4 text-center text-emerald-400 font-bold font-mono">{s.present}</td>
                      <td className="p-4 text-center text-red-400 font-bold font-mono">{s.absent}</td>
                      <td className="p-4 text-right">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-black ${pct >= 75 ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' :
                          pct >= 60 ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20' :
                            'bg-red-500/15 text-red-400 border border-red-500/20'
                          }`}>
                          {pct}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Filter Options */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 border-b border-white/5 pb-3 mb-4">
          <Filter className="w-5 h-5 text-purple-400" />
          <h2 className="font-extrabold text-sm uppercase tracking-wider text-slate-200">Filter Attendance Logs</h2>
        </div>

        <form onSubmit={handleApplyFilters} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Subject Filter</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
            >
              <option value="--All--">All Subjects</option>
              <option value="--Absents--">Absents Only</option>
              {subjects.map(s => (
                <option key={s.name} value={s.name}>{s.short_name}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-extrabold text-sm uppercase tracking-wider py-2.5 rounded-xl active:scale-[0.98] transition-all"
          >
            Apply Filter
          </button>
        </form>
      </div>

      {/* 7. Detailed Logs Log Table */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-white/10 bg-white/3 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-400" />
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-200">
              Detailed Attendance Log
              <span className="ml-2.5 px-2 py-0.5 bg-slate-800 text-[10px] font-bold rounded-lg text-slate-300">
                {filteredLogs.filter(l => l.visible).length} Records
              </span>
            </h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportToCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 text-xs font-bold rounded-xl transition-all"
            >
              <Download className="w-3.5 h-3.5" /> CSV
            </button>
            <button
              onClick={exportToPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 text-xs font-bold rounded-xl transition-all"
            >
              <FileText className="w-3.5 h-3.5" /> PDF
            </button>
          </div>
        </div>

        <div className="scroll-table max-h-[400px] overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-slate-950/90 z-20">
              <tr className="text-slate-400 text-[10px] uppercase tracking-wider border-b border-white/5">
                <th className="p-3 font-extrabold w-[50px] text-center">#</th>
                <th className="p-3 font-extrabold w-[100px]">Date</th>
                <th className="p-3 font-extrabold w-[60px] text-center">Per</th>
                <th className="p-3 font-extrabold">Subject</th>
                <th className="p-3 font-extrabold w-[80px] text-center">Status</th>
              </tr>
            </thead>
            <tbody id="detailedLogTable">
              {filteredLogs.map((log, idx) => {
                if (!log.visible) return null;
                return (
                  <tr key={idx} className="hover:bg-white/3 transition-colors">
                    <td className="p-3 text-center text-slate-500 font-mono row-num">{log.displayIndex}</td>
                    <td className="p-3 font-bold text-slate-300 font-mono">{log.date}</td>
                    <td className="p-3 text-center text-slate-400 font-mono">{log.period}</td>
                    <td className="p-3 text-slate-200">{log.short_name}</td>
                    <td className="p-3 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-lg text-xs font-black ${log.status === "P"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-red-500/10 text-red-400 border border-red-500/20"
                        }`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {filteredLogs.filter(l => l.visible).length === 0 && (
                <tr id="noRecordsRow">
                  <td colSpan={5} className="p-8 text-center text-slate-500 font-bold text-sm">
                    No matching records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 8. Insights Card */}
      {insights && (
        <div className="glass-card p-5">
          <div className="border-b border-white/5 pb-3">
            <h2 className="font-extrabold text-sm uppercase tracking-wider text-slate-200">Attendance Insights</h2>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Bunk / Attend Impact */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Next Class Impact</span>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-2.5 text-center">
                  <span className="text-[10px] font-bold text-slate-400 block">Bunk Class</span>
                  <span className="text-base font-black text-red-400">-{insights.bunkLoss}%</span>
                  <span className="text-[9px] text-red-500/60 block mt-0.5">(7 bunks ≈ -{insights.loss7}%)</span>
                </div>
                <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-2.5 text-center">
                  <span className="text-[10px] font-bold text-slate-400 block">Attend Class</span>
                  <span className="text-base font-black text-emerald-400">+{insights.attendGain}%</span>
                  <span className="text-[9px] text-emerald-500/60 block mt-0.5">(7 classes ≈ +{insights.gain7}%)</span>
                </div>
              </div>
            </div>

            {/* Peak & Lowest stats */}
            {insights.peak && insights.lowest && (
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Attendance Records</span>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-2.5 text-center">
                    <span className="text-[9px] font-bold text-slate-400 block uppercase">Peak</span>
                    <span className="text-sm font-black text-emerald-400">{insights.peak.pct}%</span>
                    <span className="text-[9px] text-slate-500 block mt-0.5">{insights.peak.p}/{insights.peak.t} classes</span>
                  </div>
                  <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-2.5 text-center">
                    <span className="text-[9px] font-bold text-slate-400 block uppercase">Lowest</span>
                    <span className="text-sm font-black text-red-400">{insights.lowest.pct}%</span>
                    <span className="text-[9px] text-slate-500 block mt-0.5">{insights.lowest.p}/{insights.lowest.t} classes</span>
                  </div>
                </div>
              </div>
            )}

            {/* Target Attend/Skip projections */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Projections</span>

              {/* Needed Targets */}
              <div className="space-y-1">
                <span className="text-[9px] font-extrabold text-amber-500/80 uppercase tracking-wider block">📈 Needed</span>
                <div className="flex flex-wrap gap-1.5">
                  {insights.targets
                    .filter(t => t.action === "attend" && t.count > 0)
                    .map(t => (
                      <div key={t.target} className="text-[10px] font-bold px-2 py-1 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-300">
                        {t.target}% → <span className="text-white">Attend {t.count}</span>
                      </div>
                    ))
                  }
                  {insights.targets.filter(t => t.action === "attend" && t.count > 0).length === 0 && (
                    <span className="text-[10px] text-emerald-400 font-bold">✨ Above all targets!</span>
                  )}
                </div>
              </div>

              {/* Can Skip Targets */}
              {insights.targets.filter(t => t.action === "skip" && t.count > 0).length > 0 && (
                <div className="space-y-1 pt-1.5 border-t border-white/5">
                  <span className="text-[9px] font-extrabold text-emerald-500/80 uppercase tracking-wider block">🎯 Can Skip</span>
                  <div className="flex flex-wrap gap-1.5">
                    {insights.targets
                      .filter(t => t.action === "skip" && t.count > 0)
                      .map(t => (
                        <div key={t.target} className="text-[10px] font-bold px-2 py-1 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-300">
                          {t.target}% → <span className="text-white">Skip {t.count}</span>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 9. Heatmap Card */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-400" />
            <h2 className="font-extrabold text-sm uppercase tracking-wider text-slate-200">Daily Heatmap</h2>
          </div>
          <div className="flex items-center gap-2 bg-black/40 p-1 border border-white/5 rounded-xl">
            <button
              onClick={() => changeMonth(-1)}
              className="p-1 hover:text-white text-slate-400 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-white px-2 uppercase tracking-wide" id="heatmapMonthLabel">
              {isClient
                ? heatmapDate.toLocaleString("default", { month: "short", year: "numeric" })
                : "Loading..."
              }
            </span>
            <button
              onClick={() => changeMonth(1)}
              className="p-1 hover:text-white text-slate-400 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <div className="w-full grid grid-cols-7 gap-2 sm:gap-3 text-center py-2 max-w-lg mx-auto">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, idx) => (
              <span key={idx} className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-widest">{d}</span>
            ))}

            {isClient ? (
              heatmapDays.map((cell, idx) => (
                <div
                  key={idx}
                  onClick={() => handleCellClick(cell)}
                  onMouseEnter={(e) => {
                    if (cell.levelClass === "empty") return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    let content = "No Class";
                    if (cell.stats) {
                      content = `${cell.dateKey}<br/>Present: ${cell.stats.present}/${cell.stats.total}<br/>Rate: ${cell.stats.percent}%`;
                    }
                    setTooltip({
                      content,
                      x: rect.left + rect.width / 2,
                      y: rect.top - 8,
                      visible: true
                    });
                  }}
                  onMouseLeave={() => setTooltip(prev => ({ ...prev, visible: false }))}
                  className={`aspect-square rounded-lg flex items-center justify-center text-xs sm:text-sm font-bold transition-colors duration-150 select-none ${cell.levelClass === "empty" ? "bg-transparent pointer-events-none" :
                    cell.levelClass === "no-class" ? "bg-white/3 border border-white/2 text-slate-600 hover:ring-2 hover:ring-white/20" :
                      cell.levelClass === "level-100" ? "bg-emerald-600 text-white cursor-pointer hover:brightness-110 hover:ring-2 hover:ring-purple-500/50" :
                        cell.levelClass === "level-75" ? "bg-emerald-400/80 text-slate-900 cursor-pointer hover:brightness-110 hover:ring-2 hover:ring-purple-500/50" :
                          cell.levelClass === "level-50" ? "bg-yellow-400/80 text-slate-900 cursor-pointer hover:brightness-110 hover:ring-2 hover:ring-purple-500/50" :
                            cell.levelClass === "level-25" ? "bg-orange-400/80 text-slate-900 cursor-pointer hover:brightness-110 hover:ring-2 hover:ring-purple-500/50" :
                              "bg-red-500/80 text-white cursor-pointer hover:brightness-110 hover:ring-2 hover:ring-purple-500/50"
                    }`}
                >
                  {cell.day > 0 ? cell.day : ""}
                </div>
              ))
            ) : (
              Array.from({ length: 35 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-lg bg-white/3 text-transparent" />
              ))
            )}
          </div>
        </div>

        {/* Heatmap Legend */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 border-t border-white/5 pt-3">
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-600 inline-block"></span>100%</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-400 inline-block"></span>&gt;75%</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-yellow-400 inline-block"></span>&gt;50%</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-orange-400 inline-block"></span>&gt;0%</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-500 inline-block"></span>0%</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-white/5 border border-white/10 inline-block"></span>No Class</div>
        </div>
      </div>

      {/* Dynamic Global Tooltip for Chart and Heatmap */}
      <div
        style={{
          left: `${tooltip.x}px`,
          top: `${tooltip.y}px`,
          transform: 'translate(-50%, -100%)',
          pointerEvents: 'none',
          opacity: tooltip.visible ? 1 : 0
        }}
        className="fixed z-[9999] bg-slate-950/95 border border-purple-500/30 text-white px-3 py-2 rounded-xl text-xs text-center shadow-xl backdrop-blur-md transition-opacity duration-150"
        dangerouslySetInnerHTML={{ __html: tooltip.content || " " }}
      />

      {/* Day Details Popup Modal */}
      {selectedDayDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
          >
            <div className="p-5 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-400" />
                <h3 className="font-extrabold text-sm text-white uppercase tracking-wide">
                  {selectedDayDetail.dateStr}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDayDetail(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex justify-center gap-3">
                <span className="badge bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-xl font-bold text-xs">
                  Present: {selectedDayDetail.logs.filter(l => l.status === "P").length}
                </span>
                <span className="badge bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-xl font-bold text-xs">
                  Absent: {selectedDayDetail.logs.filter(l => l.status === "A").length}
                </span>
                <span className="badge bg-purple-500/10 text-purple-400 border border-purple-500/20 px-3 py-1.5 rounded-xl font-bold text-xs">
                  Rate: {Math.round((selectedDayDetail.logs.filter(l => l.status === "P").length / selectedDayDetail.logs.length) * 100)}%
                </span>
              </div>

              <div className="max-h-60 overflow-y-auto scroll-table border border-white/5 rounded-2xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-950/80 text-slate-400 uppercase font-extrabold tracking-wider border-b border-white/5">
                      <th className="p-3 w-[40px] text-center">#</th>
                      <th className="p-3 w-[65px] text-center">Period</th>
                      <th className="p-3">Subject</th>
                      <th className="p-3 w-[60px] text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {selectedDayDetail.logs.map((log, idx) => (
                      <tr key={idx} className="hover:bg-white/3">
                        <td className="p-3 text-center text-slate-500 font-mono">{idx + 1}</td>
                        <td className="p-3 text-center text-slate-400 font-mono">{log.period}</td>
                        <td className="p-3 text-slate-200 font-bold">{log.short_name}</td>
                        <td className="p-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-black ${log.status === "P"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-red-500/10 text-red-400"
                            }`}>
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 bg-slate-950/40 border-t border-white/5 flex justify-end">
              <button
                onClick={() => setSelectedDayDetail(null)}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs uppercase tracking-wide rounded-xl transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
