import Link from "next/link";
import { 
  Activity, 
  FileCheck,
  FileMinus,
  ArrowRight 
} from "lucide-react";

const cards = [
  { 
    title: "Attendance Portal", 
    icon: Activity, 
    desc: "View heatmap, detailed logs, and analyze your subject-wise attendance.", 
    href: "/accsoft/attendance",
    gridClass: "col-span-2 md:col-span-1",
    theme: "from-teal-500 to-cyan-600",
    glow: "hover:shadow-teal-500/10"
  },
  { 
    title: "Registration Form", 
    icon: FileCheck, 
    desc: "Print current session registration slip directly from AccSoft.", 
    href: "/accsoft/registration",
    gridClass: "col-span-1",
    theme: "from-violet-500 to-purple-600",
    glow: "hover:shadow-violet-500/10"
  },
  { 
    title: "No Dues Form", 
    icon: FileMinus, 
    desc: "Print No Dues form directly from AccSoft.", 
    href: "/accsoft/no-dues",
    gridClass: "col-span-1",
    theme: "from-rose-500 to-pink-600",
    glow: "hover:shadow-rose-500/10"
  }
] as const;

export default function AccSoftMenuPage() {
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
