"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Lock, ArrowRight, Activity, BookOpen, AlertCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next");
  const [activeTab, setActiveTab] = useState<"accsoft" | "ums">("accsoft");
  
  // AccSoft State
  const [accUsername, setAccUsername] = useState("");
  const [accPassword, setAccPassword] = useState("");
  const [accLoading, setAccLoading] = useState(false);
  const [accError, setAccError] = useState("");

  // UMS State
  const [umsUsername, setUmsUsername] = useState("");
  const [umsPassword, setUmsPassword] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaData, setCaptchaData] = useState<{ img: string; token: string; deText: string } | null>(null);
  const [umsLoading, setUmsLoading] = useState(false);
  const [umsError, setUmsError] = useState("");
  const [umsFetchingCaptcha, setUmsFetchingCaptcha] = useState(false);

  useEffect(() => {
    if (activeTab === "ums" && !captchaData) {
      fetchCaptcha();
    }
  }, [activeTab]);

  const fetchCaptcha = async () => {
    setUmsFetchingCaptcha(true);
    setUmsError("");
    try {
      const res = await fetch("/api/auth/ums/captcha");
      const data = await res.json();
      if (data.success) {
        setCaptchaData({ img: data.captcha_img, token: data.token, deText: data.captcha_de_text });
      } else {
        setUmsError(data.error || "Failed to load captcha.");
      }
    } catch (e) {
      setUmsError("Network error. Please try again.");
    }
    setUmsFetchingCaptcha(false);
  };

  const handleAccLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccLoading(true);
    setAccError("");
    try {
      const res = await fetch("/api/auth/accsoft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: accUsername, password: accPassword })
      });
      const data = await res.json();
      if (data.success) {
        router.push(nextUrl || "/accsoft");
      } else {
        setAccError(data.error || "Login failed");
      }
    } catch (err) {
      setAccError("Network error. Please try again.");
    }
    setAccLoading(false);
  };

  const handleUmsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setUmsLoading(true);
    setUmsError("");
    try {
      const res = await fetch("/api/auth/ums/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: umsUsername,
          userdtl: umsPassword,
          captchaInputText: captchaInput,
          captchaDeText: captchaData?.deText,
          requestVerificationToken: captchaData?.token
        })
      });
      const data = await res.json();
      if (data.success) {
        router.push(nextUrl || "/management");
      } else {
        setUmsError(data.error || "Login failed");
        fetchCaptcha(); // Refresh captcha on failure
        setCaptchaInput("");
      }
    } catch (err) {
      setUmsError("Network error. Please try again.");
      fetchCaptcha();
    }
    setUmsLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-glow">
            LNCT <span className="text-purple-500">Sync</span>
          </h1>
          <p className="text-gray-400">Your unified university dashboard.</p>
        </div>

        <div className="glass-card p-1">
          <div className="flex w-full mb-6 p-1 bg-black/40 rounded-xl">
            <button
              onClick={() => setActiveTab("accsoft")}
              className={`flex-1 flex items-center justify-center py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "accsoft" ? "bg-purple-600/80 text-white shadow-lg" : "text-gray-400 hover:text-gray-200"
              }`}
            >
              <Activity className="w-4 h-4 mr-2" />
              AccSoft
            </button>
            <button
              onClick={() => setActiveTab("ums")}
              className={`flex-1 flex items-center justify-center py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "ums" ? "bg-teal-500/80 text-white shadow-lg" : "text-gray-400 hover:text-gray-200"
              }`}
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Management
            </button>
          </div>

          <div className="p-5 pt-0">
            <AnimatePresence mode="wait">
              {activeTab === "accsoft" ? (
                <motion.form
                  key="accsoft"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleAccLogin}
                  className="space-y-4"
                >
                  {accError && (
                    <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-lg flex items-start text-sm">
                      <AlertCircle className="w-5 h-5 mr-2 shrink-0" />
                      {accError}
                    </div>
                  )}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">AccSoft User ID</label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                      <input 
                        type="text" 
                        value={accUsername}
                        onChange={(e) => setAccUsername(e.target.value)}
                        className="w-full bg-black/50 border border-gray-700 rounded-xl py-2.5 pl-10 pr-4 text-gray-200 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                        placeholder="Enrollment / Scholar No."
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                      <input 
                        type="password" 
                        value={accPassword}
                        onChange={(e) => setAccPassword(e.target.value)}
                        className="w-full bg-black/50 border border-gray-700 rounded-xl py-2.5 pl-10 pr-4 text-gray-200 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                  </div>
                  <button 
                    type="submit" 
                    disabled={accLoading}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium py-3 rounded-xl flex items-center justify-center transition-all disabled:opacity-50 mt-6 shadow-[0_0_15px_rgba(138,43,226,0.3)]"
                  >
                    {accLoading ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    ) : (
                      <>Login to AccSoft <ArrowRight className="w-4 h-4 ml-2" /></>
                    )}
                  </button>
                </motion.form>
              ) : (
                <motion.form
                  key="ums"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleUmsLogin}
                  className="space-y-4"
                >
                  {umsError && (
                    <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-lg flex items-start text-sm">
                      <AlertCircle className="w-5 h-5 mr-2 shrink-0" />
                      {umsError}
                    </div>
                  )}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Enrollment Number</label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                      <input 
                        type="text" 
                        value={umsUsername}
                        onChange={(e) => setUmsUsername(e.target.value)}
                        className="w-full bg-black/50 border border-gray-700 rounded-xl py-2.5 pl-10 pr-4 text-gray-200 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
                        placeholder="e.g. 0103CS..."
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                      <input 
                        type="password" 
                        value={umsPassword}
                        onChange={(e) => setUmsPassword(e.target.value)}
                        className="w-full bg-black/50 border border-gray-700 rounded-xl py-2.5 pl-10 pr-4 text-gray-200 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between items-end mb-1">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Security Captcha</label>
                      <button 
                        type="button"
                        onClick={fetchCaptcha} 
                        disabled={umsFetchingCaptcha}
                        className="text-xs text-teal-400 hover:text-teal-300"
                      >
                        Refresh
                      </button>
                    </div>
                    <div className="flex space-x-3">
                      <div className="w-1/2 bg-black/50 rounded-xl border border-gray-700 overflow-hidden flex items-center justify-center h-[46px]">
                        {umsFetchingCaptcha ? (
                          <span className="w-4 h-4 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin"></span>
                        ) : captchaData?.img ? (
                          <img src={`data:image/jpeg;base64,${captchaData.img}`} alt="captcha" className="w-full h-full object-cover opacity-80 mix-blend-screen" />
                        ) : (
                          <span className="text-xs text-gray-500">Failed</span>
                        )}
                      </div>
                      <input 
                        type="text" 
                        value={captchaInput}
                        onChange={(e) => setCaptchaInput(e.target.value)}
                        className="w-1/2 bg-black/50 border border-gray-700 rounded-xl py-2.5 px-4 text-gray-200 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors text-center font-mono tracking-widest uppercase"
                        placeholder="XXXXX"
                        required
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={umsLoading || !captchaData}
                    className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-medium py-3 rounded-xl flex items-center justify-center transition-all disabled:opacity-50 mt-6 shadow-[0_0_15px_rgba(20,184,166,0.3)]"
                  >
                    {umsLoading ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    ) : (
                      <>Login to UMS <ArrowRight className="w-4 h-4 ml-2" /></>
                    )}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-white">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
