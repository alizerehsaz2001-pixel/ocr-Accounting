import React, { useState } from "react";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";
import { motion } from "motion/react";
import { ShieldCheck, Lock, Fingerprint, Sparkles, Loader2, KeyRound } from "lucide-react";

interface LoginScreenProps {
  isDarkMode: boolean;
  onEnterDemo: () => void;
  showNotification: (text: string, type: "success" | "error" | "info") => void;
}

export default function LoginScreen({ isDarkMode, onEnterDemo, showNotification }: LoginScreenProps) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      // Force select account prompt
      googleProvider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      showNotification(`ورود موفقیت‌آمیز با نام ${user.displayName || user.email}`, "success");
    } catch (error: any) {
      console.error("Google Auth Error:", error);
      let errorMsg = "خطایی در فرآیند ورود به سیستم رخ داد. لطفا دوباره تلاش کنید.";
      
      if (error?.code === "auth/popup-blocked") {
        errorMsg = "پنجره ورود توسط مرورگر مسدود شده است. لطفا پاپ‌آپ‌ها را فعال کنید یا برنامه را در یک تب جدید باز کنید.";
      } else if (error?.code === "auth/cancelled-popup-request") {
        errorMsg = "درخواست ورود توسط کاربر لغو شد.";
      } else if (error?.code === "auth/popup-closed-by-user") {
        errorMsg = "پنجره ورود گوگل قبل از تکمیل فرآیند بسته شد. لطفاً دوباره تلاش کنید. پیشنهاد می‌شود برنامه را در تب جدید باز کنید تا پاپ‌آپ بدون محدودیت لود شود.";
      } else if (error?.code === "auth/network-request-failed") {
        errorMsg = "خطای شبکه. لطفا اتصال اینترنت خود را بررسی کنید.";
      }
      
      setErrorMessage(errorMsg);
      showNotification(errorMsg, "error");
    } finally {
      setLoading(false);
    }
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
      {/* Abstract Background Visuals */}
      <div className="absolute inset-0 pointer-events-none">
        <div className={`absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full blur-[120px] opacity-[0.15] bg-blue-600`}></div>
        <div className={`absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full blur-[120px] opacity-[0.15] bg-indigo-600`}></div>
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        {/* Main Card */}
        <div className={`rounded-3xl border shadow-2xl p-8 backdrop-blur-md overflow-hidden relative ${
          isDarkMode 
            ? "bg-slate-900/80 border-slate-800/80 shadow-slate-950/50" 
            : "bg-white/90 border-slate-200/80 shadow-slate-100"
        }`}>
          {/* Visual Header */}
          <div className="flex flex-col items-center text-center mb-8 relative">
            <motion.div 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-black shadow-lg shadow-blue-500/20 mb-4 relative group"
            >
              <div className="absolute inset-0 bg-blue-400 rounded-2xl blur-md opacity-25 group-hover:opacity-40 transition-opacity"></div>
              <ShieldCheck className="w-8 h-8 relative z-10" />
            </motion.div>
            
            <h1 className="text-2xl font-black tracking-tight mb-2 flex items-center gap-2 justify-center">
              <span className="text-transparent bg-clip-text bg-gradient-to-l from-blue-500 to-indigo-500">ممیزی و حسابداری هوشمند</span>
            </h1>
            <p className={`text-xs max-w-sm leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
              ورود امن به سامانه جامع پردازش اسناد و تراکنش‌های مالی با اتکا به هوش مصنوعی ممیز
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs leading-relaxed text-right"
            >
              {errorMessage}
            </motion.div>
          )}

          {/* Secure login options container */}
          <div className="space-y-4">
            {/* Google Authentication Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              onClick={handleGoogleSignIn}
              className={`w-full flex items-center justify-center gap-3.5 px-5 py-4 rounded-2xl font-bold text-sm transition-all shadow-md relative overflow-hidden group ${
                isDarkMode 
                  ? "bg-slate-800 border border-slate-750 text-white hover:bg-slate-750 shadow-slate-950/30" 
                  : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-slate-100"
              }`}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
              ) : (
                // Google colored G icon
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.54 14.98 1 12 1 7.35 1 3.37 3.65 1.39 7.56l3.85 2.99c.9-2.7 3.42-4.51 6.76-4.51z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.51h6.46c-.29 1.48-1.14 2.73-2.42 3.57l3.77 2.92c2.2-2.03 3.48-5.02 3.48-8.66z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.24 14.44A7.16 7.16 0 0 1 4.8 12c0-.85.15-1.68.44-2.44L1.39 6.57A11.967 11.967 0 0 0 0 12c0 2 1.39 3.77 3.83 5.43l1.41-2.99z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.77-2.92c-1.05.7-2.39 1.13-4.19 1.13-3.34 0-5.86-1.81-6.76-4.51L1.39 16.73C3.37 20.35 7.35 23 12 23z"
                  />
                </svg>
              )}
              <span>ورود ایمن با حساب گوگل (Google Auth)</span>
            </motion.button>

            {/* Sandbox Sandbox Bypass option */}
            <div className="relative py-4 flex items-center justify-center">
              <div className={`absolute inset-0 flex items-center ${isDarkMode ? "opacity-10" : "opacity-30"}`}>
                <div className="w-full border-t border-slate-400"></div>
              </div>
              <span className={`relative px-4 text-[10px] font-bold tracking-widest ${isDarkMode ? "bg-slate-900 text-slate-500" : "bg-white text-slate-400"}`}>یا روش‌های دیگر</span>
            </div>

            {/* Sandbox mode demo button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onEnterDemo}
              className={`w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl font-bold text-xs transition-all ${
                isDarkMode 
                  ? "bg-slate-950/40 text-blue-400 hover:bg-slate-950 hover:text-blue-300 border border-slate-800/80" 
                  : "bg-slate-100 text-blue-700 hover:bg-slate-200 border border-slate-100"
              }`}
            >
              <Fingerprint className="w-4 h-4 shrink-0" />
              <span>ورود بدون گوگل (نسخه نمایشی / دمو)</span>
            </motion.button>
          </div>

          {/* Bottom Security / Informational Footer */}
          <div className={`mt-8 pt-6 border-t flex flex-col gap-3 text-center ${isDarkMode ? "border-slate-850" : "border-slate-100"}`}>
            <div className="flex items-center gap-1.5 justify-center">
              <Lock className="w-3.5 h-3.5 text-emerald-500" />
              <span className={`text-[10px] font-black ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>اتصال دارای گواهی امنیتی SSL و درگاه رسمی گوگل</span>
            </div>
            <p className={`text-[9px] leading-relaxed text-center px-4 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
              در صورت مواجهه با محدودیت پاپ‌آپ در پیش‌نمایش، لطفا بر روی دکمه باز کردن برنامه در تب جدید کلیک نمایید.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
