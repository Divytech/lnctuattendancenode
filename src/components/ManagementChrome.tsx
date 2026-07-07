"use client";

import Link from "next/link";
import { ArrowLeft, LogOut, ArrowRight, UserCheck, ShieldAlert } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

type Props = {
  name: string;
  enrollment: string;
  profilePic: string;
  hasAccsoftSession: boolean;
};

const pageTitles: Record<string, string> = {
  "/management/profile": "My Profile",
  "/management/result": "Exam Results",
  "/management/marks": "View Marks",
  "/management/admit-card": "Admit Card",
  "/management/exam-form": "Exam Form",
  "/management/timetable": "Time Table",
};

export default function ManagementChrome({ name, enrollment, profilePic, hasAccsoftSession }: Props) {
  const pathname = usePathname();
  const [greeting, setGreeting] = useState("Welcome");

  useEffect(() => {
    const hrs = new Date().getHours();
    if (hrs < 12) setGreeting("Good Morning");
    else if (hrs < 17) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");
  }, []);

  if (pathname !== "/management") {
    return (
      <nav className="sticky top-4 z-40 mb-6 flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3.5 shadow-lg backdrop-blur-xl">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/management" className="group flex shrink-0 items-center rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-300 transition-all hover:bg-white/10 hover:text-white">
            <ArrowLeft className="mr-1.5 h-4 w-4 transition-transform group-hover:-translate-x-0.5" /> Back
          </Link>
          <span className="truncate text-base font-extrabold text-white">
            {pageTitles[pathname] || "Management"}
          </span>
        </div>
        <a href="/api/auth/logout?type=ums" className="group flex shrink-0 items-center rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2 text-xs font-bold text-red-300 transition-all hover:bg-red-500/25 hover:text-white">
          <LogOut className="mr-1.5 h-3.5 w-3.5" /> Logout
        </a>
      </nav>
    );
  }

  return (
    <header className="relative mb-6 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900/90 to-purple-950/20 px-6 py-8 shadow-[0_15px_40px_rgba(0,0,0,0.4)] backdrop-blur-xl">
      {/* Decorative background lights */}
      <div className="absolute right-0 top-0 -z-10 h-32 w-32 rounded-full bg-purple-500/10 blur-[80px]" />
      <div className="absolute left-1/3 bottom-0 -z-10 h-24 w-24 rounded-full bg-teal-500/5 blur-[60px]" />

      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        
        {/* Profile details */}
        <div className="flex flex-col items-center text-center gap-4 sm:flex-row sm:text-left sm:gap-5">
          <div className="relative group shrink-0">
            <div className="absolute -inset-0.5 rounded-full bg-gradient-to-tr from-purple-500 to-teal-400 opacity-60 blur-sm group-hover:opacity-100 transition duration-500" />
            <div className="relative h-[85px] w-[85px] overflow-hidden rounded-full border-2 border-slate-950 bg-slate-900 shadow-xl">
              <img src={profilePic} alt={`${name}'s profile`} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
            </div>
            {/* Live Connection Badge */}
            <span className="absolute bottom-0.5 right-0.5 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-slate-950"></span>
            </span>
          </div>

          <div>
            <div className="flex flex-col items-center gap-1.5 sm:flex-row">
              <span className="text-xs font-semibold uppercase tracking-wider text-purple-400">{greeting}</span>
              <span className="hidden sm:inline text-slate-600">•</span>
              <div className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                <UserCheck className="h-3 w-3" /> UMS Active
              </div>
            </div>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-white sm:text-3xl bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
              {name}
            </h1>
            <p className="mt-1 font-mono text-sm font-bold tracking-wide text-slate-400">
              {enrollment}
            </p>
          </div>
        </div>

        {/* Buttons / Actions */}
        <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
          {hasAccsoftSession ? (
            <Link href="/accsoft" className="group flex items-center rounded-2xl border border-purple-500/30 bg-purple-500/10 px-4 py-2.5 text-xs font-bold text-purple-300 transition-all hover:bg-purple-500/20 hover:text-white sm:text-sm">
              <ArrowLeft className="mr-1.5 h-4 w-4 transition-transform group-hover:-translate-x-0.5" /> AccSoft Portal
            </Link>
          ) : (
            <Link href="/" className="group flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold text-slate-400 transition-all hover:bg-white/10 hover:text-white sm:text-sm">
              <ShieldAlert className="mr-1.5 h-4 w-4" /> AccSoft Offline
            </Link>
          )}
          
          <a href="/api/auth/logout?type=ums" className="group flex items-center rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs font-bold text-red-300 transition-all hover:bg-red-500/25 hover:text-white sm:text-sm">
            <LogOut className="mr-1.5 h-4 w-4" /> Logout
          </a>
        </div>
      </div>
    </header>
  );
}
