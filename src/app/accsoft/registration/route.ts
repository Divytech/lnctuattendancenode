import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";

const MAINTENANCE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Feature Under Maintenance</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Outfit', sans-serif;
      background: radial-gradient(circle at center, #1e1b4b 0%, #0f172a 100%);
    }
  </style>
</head>
<body class="min-h-screen text-slate-100 flex items-center justify-center p-4 overflow-hidden relative">
  <!-- Glowing Background Orbs -->
  <div class="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none -z-10"></div>
  <div class="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-teal-500/20 blur-[120px] rounded-full pointer-events-none -z-10"></div>

  <!-- Main Card -->
  <div class="w-full max-w-lg bg-slate-900/50 border border-white/10 backdrop-blur-xl rounded-3xl p-8 md:p-12 shadow-2xl text-center space-y-6 relative overflow-hidden animate-in fade-in zoom-in-95 duration-500">
    <div class="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
    
    <!-- Icon Container -->
    <div class="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 text-amber-400 border border-amber-500/20 shadow-lg mb-2">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-10 h-10">
        <path stroke-linecap="round" stroke-linejoin="round" d="M11.42 15.17L17.25 21A1.5 1.5 0 1019.4 18.85l-5.83-5.83M11.42 15.17a3 3 0 11-4.24-4.24 3 3 0 014.24 4.24zm0 0l-2.77-2.77M19.4 18.85l3-3m-3 3l-3.01-3.01m-2.24-2.24L11 8m4 4h-4" />
      </svg>
    </div>

    <!-- Heading -->
    <h1 class="text-3xl font-extrabold tracking-wide text-white">Under Maintenance</h1>
    
    <!-- Description -->
    <p class="text-slate-400 text-base leading-relaxed max-w-sm mx-auto">
      This form feature is currently undergoing scheduled maintenance. We are updating it to make it compatible with the new portal changes.
    </p>

    <!-- Divider -->
    <div class="h-[1px] bg-white/5 w-full"></div>

    <!-- Back Button -->
    <div>
      <a href="/accsoft" class="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-2xl shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 hover:-translate-y-0.5 transition-all duration-300">
        Go Back to Dashboard
      </a>
    </div>
  </div>
</body>
</html>`;

export async function GET(req: NextRequest) {
  const session = await getSession();
  
  if (!session.isLoggedIn) {
    return NextResponse.redirect(new URL("/api/auth/logout?type=accsoft", req.url));
  }

  return new NextResponse(MAINTENANCE_HTML, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
