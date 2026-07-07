import Link from "next/link";
import { 
  User, 
  GraduationCap, 
  TrendingUp, 
  CreditCard, 
  FileText, 
  Calendar, 
  Activity, 
  FileCheck,
  ArrowRight 
} from "lucide-react";

const cards = [
  { 
    title: "My Profile", 
    icon: User, 
    desc: "View and verify your registered academic details, courses, and basic student info.", 
    href: "/management/profile",
    gridClass: "col-span-2 md:col-span-2",
    theme: "from-blue-600 to-indigo-600",
    glow: "hover:shadow-blue-500/10"
  },
  { 
    title: "Exam Results", 
    icon: GraduationCap, 
    desc: "View marks and download semester marksheets.", 
    href: "/management/result",
    gridClass: "col-span-2 md:col-span-1",
    theme: "from-emerald-500 to-teal-600",
    glow: "hover:shadow-emerald-500/10"
  },
  { 
    title: "View Marks", 
    icon: TrendingUp, 
    desc: "Subject internal, mid-semester & sessionals.", 
    href: "/management/marks",
    gridClass: "col-span-1",
    theme: "from-rose-500 to-pink-600",
    glow: "hover:shadow-rose-500/10"
  },
  { 
    title: "Admit Card", 
    icon: CreditCard, 
    desc: "Download hall ticket for current exams.", 
    href: "/management/admit-card",
    gridClass: "col-span-1",
    theme: "from-amber-500 to-orange-600",
    glow: "hover:shadow-orange-500/10"
  },
  { 
    title: "Exam Form", 
    icon: FileText, 
    desc: "Check exam form submission and status.", 
    href: "/management/exam-form",
    gridClass: "col-span-2 md:col-span-1",
    theme: "from-sky-500 to-indigo-600",
    glow: "hover:shadow-sky-500/10"
  },
  { 
    title: "Time Table", 
    icon: Calendar, 
    desc: "Exam date sheets and schedules.", 
    href: "/management/timetable",
    gridClass: "col-span-1",
    theme: "from-purple-500 to-pink-600",
    glow: "hover:shadow-purple-500/10"
  },
] as const;

export default function ManagementMenuPage() {
  return (
    <div className="mx-auto grid w-full max-w-4xl grid-cols-1 sm:grid-cols-2 gap-4 md:grid-cols-3">
      {cards.map((card, index) => {
        const IconComponent = card.icon;
        return (
          <Link
            key={card.href}
            href={card.href}
            style={{ animationDelay: `${100 + index * 50}ms` }}
            className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-slate-900/40 p-5 shadow-lg backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-slate-900/60 ${card.gridClass} ${card.glow} hover:shadow-2xl`}
          >
            {/* Top glass reflection line */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            
            {/* Hover dynamic gradient backdrop */}
            <div className="absolute -inset-0.5 -z-10 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition duration-300 rounded-3xl" />
            
            <div>
              <div className="flex items-center justify-between">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${card.theme} text-white shadow-md transition-all duration-300 group-hover:scale-105 group-hover:rotate-3`}>
                  <IconComponent className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-slate-500 opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-slate-300" />
              </div>
              
              <h2 className="mt-4 text-base font-extrabold tracking-wide text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-300">
                {card.title}
              </h2>
              
              <p className="mt-1.5 text-xs font-medium leading-relaxed text-slate-400 group-hover:text-slate-300 transition-colors duration-200">
                {card.desc}
              </p>
            </div>
            
            {/* Bottom visual tag */}
            <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-slate-400">
                Portal Feature
              </span>
              <span className="text-[10px] font-bold text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                Open
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
