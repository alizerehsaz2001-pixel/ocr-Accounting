import React, { useState } from "react";
import { motion } from "motion/react";
import { ShieldCheck, Lock, Sparkles, Loader2, Zap, ArrowRight, ExternalLink, UserCheck, Mail } from "lucide-react";

interface LoginScreenProps {
  isDarkMode: boolean;
  onEnterDemo: (customName?: string, customEmail?: string) => void;
  showNotification: (text: string, type: "success" | "error" | "info") => void;
}

export default function LoginScreen({ isDarkMode, onEnterDemo, showNotification }: LoginScreenProps) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"instant" | "quick_form" | "google">("instant");
  
  // Quick registration inputs
  const [fullName, setFullName] = useState("");
  const [userEmail, setUserEmail] = useState("");

  const handleInstantLogin = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      showNotification("ورود مستقیم و سریع با موفقیت انجام شد.", "success");
      onEnterDemo(fullName || "کاربر ممیزی", userEmail || "user@ocr.accounting");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const finalName = fullName.trim() || "کاربر ممیزی";
    const finalEmail = userEmail.trim() || "user@ocr.accounting";
    
    setTimeout(() => {
      onEnterDemo(finalName, finalEmail);
      setLoading(false);
    }, 200);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      showNotification("ورود مستقیم با حساب کاربری با موفقیت انجام شد.", "success");
      onEnterDemo(fullName || "کاربر ممیزی", userEmail || "user@ocr.accounting");
    } finally {
      setLoading(false);
    }
  };

  const openInNewTab = () => {
    window.open(window.location.href, "_blank");
  };

  return (
    <div 
      className={`min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden font-sans select-none ${
        isDarkMode 
          ? "bg-[#090D16] text-[#E2E8F0]" 
          : "bg-gradient-to-tr from-[#EDF1F7] via-[#F4F7FB] to-[#FFFFFF] text-slate-800"
      }`} 
      dir="rtl"
    >
      {/* Background Visuals */}
      <div className="absolute inset-0 pointer-events-none">
        <div className={`absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full blur-[120px] opacity-[0.15] bg-blue-600`}></div>
        <div className={`absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full blur-[120px] opacity-[0.15] bg-indigo-600`}></div>
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        {/* Main Card */}
        <div className={`rounded-3xl border shadow-2xl p-7 md:p-8 backdrop-blur-md overflow-hidden relative ${
          isDarkMode 
            ? "bg-slate-900/90 border-slate-800/90 shadow-slate-950/60" 
            : "bg-white/95 border-slate-200/90 shadow-slate-200/50"
        }`}>
          {/* Top Bar Button: Open New Tab */}
          <div className="flex justify-between items-center mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
              <Zap className="w-3 h-3 animate-pulse" />
              ورود سریع و هوشمند
            </span>
            <button
              onClick={openInNewTab}
              className={`flex items-center gap-1.5 text-[11px] font-medium transition-colors px-2.5 py-1 rounded-lg ${
                isDarkMode ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
              title="باز کردن در تب جدید جهت رفع هرگونه محدودیت مرورگر"
            >
              <span>باز کردن در تب جدید</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          {/* Header */}
          <div className="flex flex-col items-center text-center mb-6 relative">
            <motion.div 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
              className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-black shadow-lg shadow-blue-500/25 mb-3 relative group"
            >
              <ShieldCheck className="w-7 h-7 relative z-10" />
            </motion.div>
            
            <h1 className="text-xl font-black tracking-tight mb-1 flex items-center gap-2 justify-center">
              <span className="text-transparent bg-clip-text bg-gradient-to-l from-blue-500 to-indigo-600">سامانه حسابداری و ممیزی هوشمند</span>
            </h1>
            <p className={`text-xs max-w-sm leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
              پردازش آنی اسناد، صورتهای مالی و ممیزی صادر شده با هوش مصنوعی
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs leading-relaxed text-right flex flex-col gap-2"
            >
              <div>{errorMessage}</div>
              <button
                onClick={handleInstantLogin}
                className="self-end px-3 py-1 bg-rose-500 text-white rounded-lg text-[11px] font-bold hover:bg-rose-600 transition-all"
              >
                ورود مستقیم و سریع الآن
              </button>
            </motion.div>
          )}

          {/* Quick Tab Selector */}
          <div className={`grid grid-cols-2 p-1 rounded-2xl mb-6 ${isDarkMode ? "bg-slate-950/60 border border-slate-800/80" : "bg-slate-100 border border-slate-200/60"}`}>
            <button
              onClick={() => setActiveTab("instant")}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "instant" 
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30" 
                  : isDarkMode ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>ورود سریع (۱ کلیک)</span>
            </button>
            <button
              onClick={() => setActiveTab("quick_form")}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "quick_form" 
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30" 
                  : isDarkMode ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>ثبت‌نام با مشخصات</span>
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === "instant" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {/* Ultra-fast instant login button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={loading}
                onClick={handleInstantLogin}
                className="w-full flex items-center justify-center gap-3 px-5 py-4 rounded-2xl font-black text-sm bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-lg shadow-blue-600/30 hover:shadow-blue-600/40 transition-all relative overflow-hidden group"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                ) : (
                  <>
                    <Zap className="w-5 h-5 text-amber-300 fill-amber-300 group-hover:scale-110 transition-transform" />
                    <span>ورود مستقیم و آنی به سامانه (بدون معطلی)</span>
                  </>
                )}
              </motion.button>

              <div className="relative py-2 flex items-center justify-center">
                <div className={`absolute inset-0 flex items-center ${isDarkMode ? "opacity-10" : "opacity-30"}`}>
                  <div className="w-full border-t border-slate-400"></div>
                </div>
                <span className={`relative px-3 text-[10px] font-bold ${isDarkMode ? "bg-slate-900 text-slate-500" : "bg-white text-slate-400"}`}>یا ورود با گوگل</span>
              </div>

              {/* Google login button */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                disabled={loading}
                onClick={handleGoogleSignIn}
                className={`w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-2xl font-bold text-xs transition-all shadow-sm ${
                  isDarkMode 
                    ? "bg-slate-800/90 border border-slate-700/80 text-white hover:bg-slate-800" 
                    : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.54 14.98 1 12 1 7.35 1 3.37 3.65 1.39 7.56l3.85 2.99c.9-2.7 3.42-4.51 6.76-4.51z" />
                  <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.51h6.46c-.29 1.48-1.14 2.73-2.42 3.57l3.77 2.92c2.2-2.03 3.48-5.02 3.48-8.66z" />
                  <path fill="#FBBC05" d="M5.24 14.44A7.16 7.16 0 0 1 4.8 12c0-.85.15-1.68.44-2.44L1.39 6.57A11.967 11.967 0 0 0 0 12c0 2 1.39 3.77 3.83 5.43l1.41-2.99z" />
                  <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.77-2.92c-1.05.7-2.39 1.13-4.19 1.13-3.34 0-5.86-1.81-6.76-4.51L1.39 16.73C3.37 20.35 7.35 23 12 23z" />
                </svg>
                <span>ورود با گوگل (Google Authentication)</span>
              </motion.button>
            </motion.div>
          )}

          {activeTab === "quick_form" && (
            <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleQuickRegisterSubmit} className="space-y-3.5">
              <div>
                <label className={`block text-[11px] font-bold mb-1.5 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                  نام و نام خانوادگی
                </label>
                <input
                  type="text"
                  placeholder="مثال: علی رضایی"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl text-xs font-medium outline-none transition-all border ${
                    isDarkMode 
                      ? "bg-slate-950/80 border-slate-800 text-white focus:border-blue-500" 
                      : "bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500"
                  }`}
                />
              </div>

              <div>
                <label className={`block text-[11px] font-bold mb-1.5 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                  ایمیل یا شماره همراه (اختیاری)
                </label>
                <input
                  type="text"
                  placeholder="user@example.com یا 0912..."
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl text-xs font-medium outline-none transition-all border ${
                    isDarkMode 
                      ? "bg-slate-950/80 border-slate-800 text-white focus:border-blue-500" 
                      : "bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500"
                  }`}
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl font-bold text-xs bg-blue-600 text-white hover:bg-blue-700 shadow-md transition-all mt-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                <span>ثبت‌نام و ورود سریع به سامانه</span>
              </motion.button>
            </motion.form>
          )}

          {/* Footer Info */}
          <div className={`mt-6 pt-5 border-t flex flex-col gap-2.5 text-center ${isDarkMode ? "border-slate-800/80" : "border-slate-100"}`}>
            <div className="flex items-center gap-1.5 justify-center">
              <Lock className="w-3.5 h-3.5 text-emerald-500" />
              <span className={`text-[10px] font-bold ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>اتصال دارای گواهی امنیت اطلاعات و لایه اختصاصی SSL</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

