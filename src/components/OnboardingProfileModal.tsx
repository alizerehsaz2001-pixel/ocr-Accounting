import React, { useState } from "react";
import { doc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { motion, AnimatePresence } from "motion/react";
import { User, Building2, Briefcase, Phone, Mail, Sparkles, Loader2, ShieldCheck, CheckCircle2 } from "lucide-react";

interface OnboardingProfileModalProps {
  isOpen: boolean;
  isDarkMode: boolean;
  currentUser: any;
  onComplete: (updatedUser: any) => void;
  showNotification: (text: string, type: "success" | "error" | "info") => void;
}

export default function OnboardingProfileModal({
  isOpen,
  isDarkMode,
  currentUser,
  onComplete,
  showNotification
}: OnboardingProfileModalProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen || !currentUser) return null;

  const validate = () => {
    const tempErrors: Record<string, string> = {};
    if (!firstName.trim()) tempErrors.firstName = "وارد کردن نام الزامی است.";
    if (!lastName.trim()) tempErrors.lastName = "وارد کردن نام خانوادگی الزامی است.";
    if (!companyName.trim()) tempErrors.companyName = "وارد کردن نام شرکت/مجموعه الزامی است.";
    if (!jobTitle.trim()) tempErrors.jobTitle = "وارد کردن سمت شغلی الزامی است.";
    
    // Simple Iranian mobile number validation (starts with 09 and is 11 digits)
    const phoneTrimmed = phone.trim();
    if (!phoneTrimmed) {
      tempErrors.phone = "وارد کردن شماره تلفن همراه الزامی است.";
    } else if (!/^09\d{9}$/.test(phoneTrimmed)) {
      tempErrors.phone = "شماره همراه باید معتبر باشد (مانند: 09123456789).";
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const trimmedFirstName = firstName.trim();
      const trimmedLastName = lastName.trim();
      const trimmedCompanyName = companyName.trim();
      const trimmedJobTitle = jobTitle.trim();
      const trimmedPhone = phone.trim();
      const fullName = `${trimmedFirstName} ${trimmedLastName}`;

      const updatedUser = {
        ...currentUser,
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        name: fullName,
        companyName: trimmedCompanyName,
        jobTitle: trimmedJobTitle,
        phone: trimmedPhone,
        isOnboarded: true
      };

      // Update in Firestore
      const isDemo = localStorage.getItem("is_demo_mode") === "true";
      if (!isDemo && currentUser.id) {
        const userRef = doc(db, "users", String(currentUser.id));
        await setDoc(userRef, updatedUser, { merge: true });
      }

      showNotification("اطلاعات حساب کاربری شما با موفقیت ثبت و فعال شد.", "success");
      onComplete(updatedUser);
    } catch (error: any) {
      console.error("Onboarding profile save error:", error);
      showNotification("خطا در ثبت اطلاعات. لطفاً مجدداً تلاش کنید.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
        dir="rtl"
      >
        {/* Blocking Glassmorphic Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl"
        ></motion.div>
        
        {/* Main Modal Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", duration: 0.6 }}
          className={`relative w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border p-8 md:p-10 ${
            isDarkMode 
              ? "bg-slate-900 border-slate-800 text-slate-100" 
              : "bg-white border-slate-200 text-slate-800"
          }`}
        >
          {/* Top Decorative Sparkle Tag */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-black">
              <Sparkles className="w-4 h-4 animate-pulse text-indigo-400" />
              <span>پیکربندی اولیه و فعال‌سازی حساب کاربری</span>
            </div>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-black mb-2 tracking-tight">تکمیل مشخصات حساب کاربری</h2>
            <p className={`text-xs leading-relaxed max-w-sm mx-auto ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
              جهت صدور فاکتورها، گزارشات ممیزی و شخصی‌سازی تراکنش‌ها به نام شما، لطفاً فیلدهای زیر را تکمیل فرمایید.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Displaying authenticated email (read-only) */}
            <div className="space-y-1">
              <label className={`text-[10px] font-black uppercase tracking-wider block ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                نشانی ایمیل (ثبت شده با گوگل)
              </label>
              <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border text-xs font-mono font-bold ${
                isDarkMode ? "bg-slate-950/60 border-slate-850 text-slate-400" : "bg-slate-50 border-slate-100 text-slate-500"
              }`} dir="ltr">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="flex-1 text-left">{currentUser.email}</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              </div>
            </div>

            {/* First and Last Name Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className={`text-[10px] font-black block ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                  نام <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className={`w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`} />
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="مثال: محمد"
                    className={`w-full text-xs pr-11 pl-4 py-3.5 rounded-2xl border focus:outline-none focus:ring-2 transition-all ${
                      errors.firstName 
                        ? "border-rose-500/50 focus:ring-rose-500/20" 
                        : isDarkMode 
                          ? "bg-slate-950/40 border-slate-800 text-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20" 
                          : "bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500 focus:ring-indigo-500/20"
                    }`}
                  />
                </div>
                {errors.firstName && <p className="text-[10px] text-rose-500 font-bold">{errors.firstName}</p>}
              </div>

              <div className="space-y-1">
                <label className={`text-[10px] font-black block ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                  نام خانوادگی <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className={`w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`} />
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="مثال: کریمی"
                    className={`w-full text-xs pr-11 pl-4 py-3.5 rounded-2xl border focus:outline-none focus:ring-2 transition-all ${
                      errors.lastName 
                        ? "border-rose-500/50 focus:ring-rose-500/20" 
                        : isDarkMode 
                          ? "bg-slate-950/40 border-slate-800 text-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20" 
                          : "bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500 focus:ring-indigo-500/20"
                    }`}
                  />
                </div>
                {errors.lastName && <p className="text-[10px] text-rose-500 font-bold">{errors.lastName}</p>}
              </div>
            </div>

            {/* Company Name */}
            <div className="space-y-1">
              <label className={`text-[10px] font-black block ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                نام شرکت / مجموعه اقتصادی <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Building2 className={`w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`} />
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="مثال: شرکت تجارت گستر پاسارگاد"
                  className={`w-full text-xs pr-11 pl-4 py-3.5 rounded-2xl border focus:outline-none focus:ring-2 transition-all ${
                    errors.companyName 
                      ? "border-rose-500/50 focus:ring-rose-500/20" 
                      : isDarkMode 
                        ? "bg-slate-950/40 border-slate-800 text-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20" 
                        : "bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500 focus:ring-indigo-500/20"
                  }`}
                />
              </div>
              {errors.companyName && <p className="text-[10px] text-rose-500 font-bold">{errors.companyName}</p>}
            </div>

            {/* Job Title and Phone Number Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className={`text-[10px] font-black block ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                  سمت شغلی <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Briefcase className={`w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`} />
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="مثال: حسابدار ارشد / مدیر مالی"
                    className={`w-full text-xs pr-11 pl-4 py-3.5 rounded-2xl border focus:outline-none focus:ring-2 transition-all ${
                      errors.jobTitle 
                        ? "border-rose-500/50 focus:ring-rose-500/20" 
                        : isDarkMode 
                          ? "bg-slate-950/40 border-slate-800 text-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20" 
                          : "bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500 focus:ring-indigo-500/20"
                    }`}
                  />
                </div>
                {errors.jobTitle && <p className="text-[10px] text-rose-500 font-bold">{errors.jobTitle}</p>}
              </div>

              <div className="space-y-1">
                <label className={`text-[10px] font-black block ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                  شماره همراه <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className={`w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`} />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="09123456789"
                    className={`w-full text-xs pr-11 pl-4 py-3.5 rounded-2xl border focus:outline-none focus:ring-2 transition-all text-left ${
                      errors.phone 
                        ? "border-rose-500/50 focus:ring-rose-500/20" 
                        : isDarkMode 
                          ? "bg-slate-950/40 border-slate-800 text-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20" 
                          : "bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500 focus:ring-indigo-500/20"
                    }`}
                    dir="ltr"
                  />
                </div>
                {errors.phone && <p className="text-[10px] text-rose-500 font-bold">{errors.phone}</p>}
              </div>
            </div>

            {/* Shield and Privacy info */}
            <div className={`p-4 rounded-2xl flex items-start gap-3 border ${
              isDarkMode ? "bg-slate-950/20 border-slate-850" : "bg-slate-50 border-slate-100"
            }`}>
              <ShieldCheck className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
              <p className={`text-[10px] leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                اطلاعات وارد شده به صورت رمزگذاری شده در سرورهای ابری امن نگهداری شده و فقط برای فرآیندهای مالی و تولید اسناد شما استفاده می‌گردد.
              </p>
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm shadow-xl shadow-indigo-600/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-4"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>در حال ثبت و فعال‌سازی حساب کاربری...</span>
                </>
              ) : (
                <span>تایید اطلاعات و ثبت نهایی حساب</span>
              )}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
