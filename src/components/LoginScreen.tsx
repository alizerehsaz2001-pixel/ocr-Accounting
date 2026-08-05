import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  ShieldCheck, 
  Lock, 
  Sparkles, 
  Loader2, 
  User, 
  Mail, 
  Phone, 
  Building2, 
  Briefcase, 
  FileText, 
  CheckSquare, 
  Square,
  AlertCircle,
  ExternalLink
} from "lucide-react";

interface LoginScreenProps {
  isDarkMode: boolean;
  onEnterDemo: (
    customName?: string, 
    customEmail?: string, 
    customPhone?: string, 
    customCompany?: string, 
    customNationalCode?: string, 
    customJob?: string
  ) => void;
  showNotification: (text: string, type: "success" | "error" | "info") => void;
}

export default function LoginScreen({ isDarkMode, onEnterDemo, showNotification }: LoginScreenProps) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Registration / Specification Inputs
  const [fullName, setFullName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [userNationalCode, setUserNationalCode] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [agreeConfidentiality, setAgreeConfidentiality] = useState(true);

  // Error States
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) {
      newErrors.fullName = "نام و نام خانوادگی الزامی است.";
    } else if (fullName.trim().length < 3) {
      newErrors.fullName = "نام باید حداقل ۳ کاراکتر باشد.";
    }

    if (!userEmail.trim()) {
      newErrors.userEmail = "آدرس ایمیل الزامی است.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail.trim())) {
      newErrors.userEmail = "آدرس ایمیل نامعتبر است (مثال: user@example.com).";
    }

    if (!userPhone.trim()) {
      newErrors.userPhone = "شماره همراه الزامی است.";
    } else if (!/^09\d{9}$/.test(userPhone.trim())) {
      newErrors.userPhone = "شماره همراه باید ۱۱ رقم و با ۰۹ شروع شود (مثال: 09123456789).";
    }

    if (!userNationalCode.trim()) {
      newErrors.userNationalCode = "کد ملی الزامی است.";
    } else if (!/^\d{10}$/.test(userNationalCode.trim())) {
      newErrors.userNationalCode = "کد ملی باید دقیقاً ۱۰ رقم باشد.";
    }

    if (!companyName.trim()) {
      newErrors.companyName = "نام شرکت یا موسسه الزامی است.";
    }

    if (!jobTitle.trim()) {
      newErrors.jobTitle = "سمت سازمانی الزامی است.";
    }

    if (!agreeConfidentiality) {
      newErrors.agree = "تأیید تعهدنامه رازداری الزامی است.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      showNotification("لطفاً تمامی موارد الزامی را با دقت تکمیل نمایید.", "error");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    // Mock network request delay for ultra premium security feel
    setTimeout(() => {
      try {
        showNotification("هویت شما با موفقیت در سامانه ممیزی ثبت و تأیید شد.", "success");
        onEnterDemo(
          fullName.trim(), 
          userEmail.trim().toLowerCase(), 
          userPhone.trim(), 
          companyName.trim(), 
          userNationalCode.trim(), 
          jobTitle.trim()
        );
      } catch (err) {
        setErrorMessage("خطایی در ثبت مشخصات رخ داد. مجدداً تلاش کنید.");
      } finally {
        setLoading(false);
      }
    }, 1200);
  };

  const openInNewTab = () => {
    window.open(window.location.href, "_blank");
  };

  return (
    <div 
      className={`min-h-screen w-full flex items-center justify-center p-4 relative overflow-y-auto py-12 font-sans select-none ${
        isDarkMode 
          ? "bg-[#090D16] text-[#E2E8F0]" 
          : "bg-gradient-to-tr from-[#EDF1F7] via-[#F4F7FB] to-[#FFFFFF] text-slate-800"
      }`} 
      dir="rtl"
    >
      {/* Background Visuals */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full blur-[120px] opacity-[0.15] bg-indigo-600"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full blur-[120px] opacity-[0.15] bg-blue-600"></div>
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-xl relative z-10 my-auto"
      >
        {/* Main Card */}
        <div className={`rounded-3xl border shadow-2xl p-6 md:p-8 backdrop-blur-md overflow-hidden relative ${
          isDarkMode 
            ? "bg-slate-900/90 border-slate-800/90 shadow-slate-950/60" 
            : "bg-white/95 border-slate-200/90 shadow-slate-200/50"
        }`}>
          {/* Top Bar Button: Open New Tab */}
          <div className="flex justify-between items-center mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
              درگاه امن احراز هویت کاربران
            </span>
            <button
              onClick={openInNewTab}
              className={`flex items-center gap-1.5 text-[11px] font-medium transition-colors px-2.5 py-1 rounded-lg ${
                isDarkMode ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
              title="باز کردن در تب جدید جهت رفع هرگونه محدودیت مرورگر"
            >
              <span>تب جدید</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          {/* Header */}
          <div className="flex flex-col items-center text-center mb-6 relative">
            <motion.div 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
              className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-black shadow-lg shadow-blue-500/25 mb-3"
            >
              <Lock className="w-7 h-7" />
            </motion.div>
            
            <h1 className="text-lg font-black tracking-tight mb-1 flex items-center gap-2 justify-center">
              <span className="text-transparent bg-clip-text bg-gradient-to-l from-blue-500 to-indigo-600">سامانه حسابداری و ممیزی زره‌اسکن</span>
            </h1>
            <p className={`text-[11px] max-w-sm leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
              جهت ورود، ثبت مشخصات هویتی و پرسنلی به صورت کامل و دقیق الزامی می‌باشد.
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs leading-relaxed text-right flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMessage}</span>
            </motion.div>
          )}

          {/* Strict Specifications Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Row 1: Name and Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 text-right">
                <label className={`text-[10px] font-bold flex items-center gap-1.5 ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
                  <User className="w-3.5 h-3.5 text-indigo-500" />
                  <span>نام و نام خانوادگی</span>
                </label>
                <input
                  type="text"
                  placeholder="مثال: علی زره‌ساز"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (errors.fullName) setErrors(prev => ({ ...prev, fullName: "" }));
                  }}
                  className={`w-full px-3 py-2.5 rounded-xl text-xs font-medium outline-none transition-all border ${
                    errors.fullName
                      ? "border-rose-500 bg-rose-500/5 text-rose-500"
                      : isDarkMode 
                        ? "bg-slate-950/80 border-slate-800 text-white focus:border-indigo-500" 
                        : "bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500"
                  }`}
                />
                {errors.fullName && (
                  <p className="text-[9px] text-rose-500 font-bold flex items-center gap-1 animate-fade-in">
                    <AlertCircle className="w-3 h-3" />
                    <span>{errors.fullName}</span>
                  </p>
                )}
              </div>

              <div className="space-y-1.5 text-right">
                <label className={`text-[10px] font-bold flex items-center gap-1.5 ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
                  <Mail className="w-3.5 h-3.5 text-indigo-500" />
                  <span>آدرس ایمیل</span>
                </label>
                <input
                  type="text"
                  placeholder="مثال: user@example.com"
                  value={userEmail}
                  onChange={(e) => {
                    setUserEmail(e.target.value);
                    if (errors.userEmail) setErrors(prev => ({ ...prev, userEmail: "" }));
                  }}
                  className={`w-full px-3 py-2.5 rounded-xl text-xs font-medium outline-none transition-all border text-left font-mono ${
                    errors.userEmail
                      ? "border-rose-500 bg-rose-500/5 text-rose-500"
                      : isDarkMode 
                        ? "bg-slate-950/80 border-slate-800 text-white focus:border-indigo-500" 
                        : "bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500"
                  }`}
                />
                {errors.userEmail && (
                  <p className="text-[9px] text-rose-500 font-bold flex items-center gap-1 animate-fade-in">
                    <AlertCircle className="w-3 h-3" />
                    <span>{errors.userEmail}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Row 2: Phone and National ID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 text-right">
                <label className={`text-[10px] font-bold flex items-center gap-1.5 ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
                  <Phone className="w-3.5 h-3.5 text-indigo-500" />
                  <span>شماره تلفن همراه</span>
                </label>
                <input
                  type="text"
                  placeholder="مثال: 09123456789"
                  value={userPhone}
                  onChange={(e) => {
                    setUserPhone(e.target.value);
                    if (errors.userPhone) setErrors(prev => ({ ...prev, userPhone: "" }));
                  }}
                  className={`w-full px-3 py-2.5 rounded-xl text-xs font-medium outline-none transition-all border text-left font-mono ${
                    errors.userPhone
                      ? "border-rose-500 bg-rose-500/5 text-rose-500"
                      : isDarkMode 
                        ? "bg-slate-950/80 border-slate-800 text-white focus:border-indigo-500" 
                        : "bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500"
                  }`}
                />
                {errors.userPhone && (
                  <p className="text-[9px] text-rose-500 font-bold flex items-center gap-1 animate-fade-in">
                    <AlertCircle className="w-3 h-3" />
                    <span>{errors.userPhone}</span>
                  </p>
                )}
              </div>

              <div className="space-y-1.5 text-right">
                <label className={`text-[10px] font-bold flex items-center gap-1.5 ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
                  <FileText className="w-3.5 h-3.5 text-indigo-500" />
                  <span>کد ملی ۱۰ رقمی</span>
                </label>
                <input
                  type="text"
                  placeholder="مثال: 0012345678"
                  value={userNationalCode}
                  onChange={(e) => {
                    setUserNationalCode(e.target.value);
                    if (errors.userNationalCode) setErrors(prev => ({ ...prev, userNationalCode: "" }));
                  }}
                  className={`w-full px-3 py-2.5 rounded-xl text-xs font-medium outline-none transition-all border text-left font-mono ${
                    errors.userNationalCode
                      ? "border-rose-500 bg-rose-500/5 text-rose-500"
                      : isDarkMode 
                        ? "bg-slate-950/80 border-slate-800 text-white focus:border-indigo-500" 
                        : "bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500"
                  }`}
                />
                {errors.userNationalCode && (
                  <p className="text-[9px] text-rose-500 font-bold flex items-center gap-1 animate-fade-in">
                    <AlertCircle className="w-3 h-3" />
                    <span>{errors.userNationalCode}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Row 3: Company Name and Job Title */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 text-right">
                <label className={`text-[10px] font-bold flex items-center gap-1.5 ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
                  <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                  <span>نام شرکت / موسسه مالی</span>
                </label>
                <input
                  type="text"
                  placeholder="مثال: شرکت توسعه مهرآیین"
                  value={companyName}
                  onChange={(e) => {
                    setCompanyName(e.target.value);
                    if (errors.companyName) setErrors(prev => ({ ...prev, companyName: "" }));
                  }}
                  className={`w-full px-3 py-2.5 rounded-xl text-xs font-medium outline-none transition-all border ${
                    errors.companyName
                      ? "border-rose-500 bg-rose-500/5 text-rose-500"
                      : isDarkMode 
                        ? "bg-slate-950/80 border-slate-800 text-white focus:border-indigo-500" 
                        : "bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500"
                  }`}
                />
                {errors.companyName && (
                  <p className="text-[9px] text-rose-500 font-bold flex items-center gap-1 animate-fade-in">
                    <AlertCircle className="w-3 h-3" />
                    <span>{errors.companyName}</span>
                  </p>
                )}
              </div>

              <div className="space-y-1.5 text-right">
                <label className={`text-[10px] font-bold flex items-center gap-1.5 ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
                  <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
                  <span>سمت شغلی</span>
                </label>
                <input
                  type="text"
                  placeholder="مثال: حسابرس ارشد / مدیر مالی"
                  value={jobTitle}
                  onChange={(e) => {
                    setJobTitle(e.target.value);
                    if (errors.jobTitle) setErrors(prev => ({ ...prev, jobTitle: "" }));
                  }}
                  className={`w-full px-3 py-2.5 rounded-xl text-xs font-medium outline-none transition-all border ${
                    errors.jobTitle
                      ? "border-rose-500 bg-rose-500/5 text-rose-500"
                      : isDarkMode 
                        ? "bg-slate-950/80 border-slate-800 text-white focus:border-indigo-500" 
                        : "bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500"
                  }`}
                />
                {errors.jobTitle && (
                  <p className="text-[9px] text-rose-500 font-bold flex items-center gap-1 animate-fade-in">
                    <AlertCircle className="w-3 h-3" />
                    <span>{errors.jobTitle}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Confidentiality Agreement Checkbox */}
            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => {
                  setAgreeConfidentiality(!agreeConfidentiality);
                  if (errors.agree) setErrors(prev => ({ ...prev, agree: "" }));
                }}
                className="flex items-start gap-2.5 text-right cursor-pointer group"
              >
                <div className={`mt-0.5 shrink-0 transition-colors ${
                  agreeConfidentiality 
                    ? "text-indigo-600 dark:text-indigo-400" 
                    : errors.agree 
                      ? "text-rose-500" 
                      : "text-slate-400 group-hover:text-slate-300"
                }`}>
                  {agreeConfidentiality ? (
                    <CheckSquare className="w-4.5 h-4.5" />
                  ) : (
                    <Square className="w-4.5 h-4.5" />
                  )}
                </div>
                <span className={`text-[10px] leading-relaxed transition-colors select-none ${
                  errors.agree 
                    ? "text-rose-500 font-bold" 
                    : isDarkMode ? "text-slate-300" : "text-slate-600"
                }`}>
                  اینجانب صحت اطلاعات فوق را تأیید کرده و متعهد به حفظ محرمانگی کامل اسناد و صورتهای مالی بارگذاری شده در این سامانه می‌باشم.
                </span>
              </button>
              {errors.agree && (
                <p className="text-[9px] text-rose-500 font-bold flex items-center gap-1 mt-1 animate-fade-in">
                  <AlertCircle className="w-3 h-3" />
                  <span>{errors.agree}</span>
                </p>
              )}
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 px-5 py-4 rounded-2xl font-black text-xs bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all cursor-pointer mt-4"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4.5 h-4.5 animate-spin text-white" />
                  <span>در حال ثبت هویتی و ایمن‌سازی ورود...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4.5 h-4.5 text-indigo-200" />
                  <span>ثبت اطلاعات پرسنلی و ورود به سامانه زره‌اسکن</span>
                </>
              )}
            </motion.button>
          </form>

          {/* Footer Info */}
          <div className={`mt-6 pt-5 border-t flex flex-col gap-2.5 text-center ${isDarkMode ? "border-slate-800/80" : "border-slate-100"}`}>
            <div className="flex items-center gap-1.5 justify-center">
              <Lock className="w-3.5 h-3.5 text-emerald-500" />
              <span className={`text-[9.5px] font-bold ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
                اتصال دارای استاندارد پیشرفته محافظت از داده و رمزنگاری هوشمند SSL می‌باشد.
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
