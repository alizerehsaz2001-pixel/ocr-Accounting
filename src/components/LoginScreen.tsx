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
  ExternalLink,
  KeyRound,
  Eye,
  EyeOff
} from "lucide-react";
import { 
  auth, 
  db, 
  GoogleAuthProvider, 
  signInWithPopup, 
  handleFirestoreError, 
  OperationType 
} from "../lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";

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

type AuthTab = "google" | "register" | "login";

export default function LoginScreen({ isDarkMode, onEnterDemo, showNotification }: LoginScreenProps) {
  const [activeTab, setActiveTab] = useState<AuthTab>("google");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Common Profile Inputs
  const [fullName, setFullName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [userNationalCode, setUserNationalCode] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [agreeConfidentiality, setAgreeConfidentiality] = useState(true);

  // Error States
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Trigger Google Sign-In
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMessage(null);
    const provider = new GoogleAuthProvider();
    
    provider.setCustomParameters({
      prompt: "select_account"
    });

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      if (!user) {
        throw new Error("حساب کاربری یافت نشد.");
      }

      // Check if user already exists in Firestore
      const userDocRef = doc(db, "users", user.uid);
      let userSnap = null;
      try {
        userSnap = await getDoc(userDocRef);
      } catch (err) {
        console.warn("Firestore user lookup offline or error:", err);
      }

      if (userSnap && userSnap.exists()) {
        const userData = userSnap.data();
        showNotification(`خوش آمدید، ${userData.name || user.displayName}!`, "success");
        onEnterDemo(
          userData.name, 
          userData.email, 
          userData.phone || "", 
          userData.companyName || "", 
          userData.nationalCode || "", 
          userData.jobTitle || ""
        );
      } else if (user.displayName || user.email) {
        const userName = user.displayName || user.email?.split("@")[0] || "کاربر گوگل";
        showNotification(`خوش آمدید، ${userName}!`, "success");
        onEnterDemo(
          userName,
          user.email || "",
          "",
          "سازمان (ورود با گوگل)",
          "",
          "کاربر سیستم"
        );
      } else {
        setFullName(user.displayName || "");
        setUserEmail(user.email || "");
        setActiveTab("register");
        showNotification("احراز هویت گوگل موفقیت‌آمیز بود. لطفاً سایر مشخصات ممیزی خود را تکمیل نمایید.", "info");
      }
    } catch (err: any) {
      console.error("Google login error:", err);
      let farsiError = "خطا در برقراری ارتباط امن با سرورهای گوگل. لطفاً اتصال اینترنت خود را بررسی کنید.";
      if (err.code === "auth/popup-blocked") {
        farsiError = "نمایش پنجره پاپ‌آپ گوگل توسط مرورگر مسدود شده است. لطفاً آن را مجاز کنید یا دکمه «تب جدید» بالای صفحه را بزنید.";
      } else if (err.code === "auth/cancelled-popup-request") {
        farsiError = "عملیات ورود توسط کاربر لغو گردید.";
      } else if (err.code === "auth/network-request-failed" || (err.message && err.message.includes("network-request-failed"))) {
        farsiError = "به دلیل محدودیت‌های امنیتی پیش‌نمایش iframe مرورگر، ورود با گوگل مسدود گردیده است. لطفاً دکمه «باز کردن در تب جدید» را بزنید یا از تب «ورود دستی / ثبت‌نام» استفاده فرمایید.";
      } else if (err.message) {
        farsiError = `خطای سامانه: ${err.message}`;
      }
      setErrorMessage(farsiError);
      showNotification(farsiError, "error");
    } finally {
      setLoading(false);
    }
  };

  const validateRegisterForm = () => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) {
      newErrors.fullName = "نام و نام خانوادگی الزامی است.";
    }

    if (!userEmail.trim()) {
      newErrors.userEmail = "آدرس ایمیل الزامی است.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail.trim())) {
      newErrors.userEmail = "آدرس ایمیل نامعتبر است.";
    }

    if (!password) {
      newErrors.password = "رمز عبور الزامی است.";
    } else if (password.length < 6) {
      newErrors.password = "رمز عبور باید حداقل ۶ کاراکتر باشد.";
    }

    if (!userPhone.trim()) {
      newErrors.userPhone = "شماره همراه الزامی است.";
    } else if (!/^09\d{9}$/.test(userPhone.trim())) {
      newErrors.userPhone = "شماره همراه معتبر نیست (مثال: 09123456789).";
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

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateRegisterForm()) {
      showNotification("لطفاً تمامی موارد الزامی را با دقت تکمیل نمایید.", "error");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      // 1. Create firebase user using Email & Password
      const credential = await createUserWithEmailAndPassword(auth, userEmail.trim(), password);
      const user = credential.user;

      if (!user) {
        throw new Error("خطا در ایجاد حساب کاربری.");
      }

      // 2. Store additional information in Firestore
      const userDocRef = doc(db, "users", user.uid);
      
      const payload = {
        id: user.uid,
        name: fullName.trim(),
        firstName: fullName.trim().split(" ")[0] || "",
        lastName: fullName.trim().split(" ").slice(1).join(" ") || "",
        email: userEmail.trim().toLowerCase(),
        phone: userPhone.trim(),
        nationalCode: userNationalCode.trim(),
        companyName: companyName.trim(),
        jobTitle: jobTitle.trim(),
        role: "user",
        status: "active",
        createdAt: new Date().toISOString(),
        isOnboarded: true
      };

      try {
        await setDoc(userDocRef, payload);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}`);
      }

      showNotification("ثبت‌نام و احراز هویت پرسنلی شما با موفقیت انجام شد.", "success");
      onEnterDemo(
        payload.name,
        payload.email,
        payload.phone,
        payload.companyName,
        payload.nationalCode,
        payload.jobTitle
      );
    } catch (err: any) {
      console.error("Manual registration error:", err);
      let farsiError = "خطایی در فرآیند ثبت‌نام رخ داد.";
      if (err.code === "auth/email-already-in-use") {
        farsiError = "این آدرس ایمیل قبلاً در سامانه ثبت شده است. لطفاً وارد شوید.";
      } else if (err.code === "auth/weak-password") {
        farsiError = "رمز عبور ضعیف است. رمز عبور باید حداقل ۶ کاراکتر باشد.";
      } else if (err.code === "auth/invalid-email") {
        farsiError = "آدرس ایمیل نامعتبر است.";
      } else if (err.message) {
        farsiError = err.message;
      }
      setErrorMessage(farsiError);
      showNotification(farsiError, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!userEmail.trim()) {
      showNotification("آدرس ایمیل الزامی است.", "error");
      return;
    }
    if (!password) {
      showNotification("رمز عبور الزامی است.", "error");
      return;
    }

    setLoading(true);

    try {
      const credential = await signInWithEmailAndPassword(auth, userEmail.trim(), password);
      const user = credential.user;

      if (!user) {
        throw new Error("خطا در ورود.");
      }

      // Fetch user profile from Firestore
      const userDocRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        showNotification(`خوش آمدید، ${userData.name}!`, "success");
        onEnterDemo(
          userData.name, 
          userData.email, 
          userData.phone || "", 
          userData.companyName || "", 
          userData.nationalCode || "", 
          userData.jobTitle || ""
        );
      } else {
        // Fallback if auth exists but no doc (e.g. incomplete registration)
        setFullName(user.displayName || "");
        setUserEmail(user.email || "");
        setActiveTab("register");
        showNotification("لطفاً برای تکمیل فرآیند، مشخصات ممیزی خود را وارد کنید.", "info");
      }
    } catch (err: any) {
      console.error("Manual login error:", err);
      let farsiError = "ایمیل یا رمز عبور اشتباه است.";
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        farsiError = "ایمیل یا رمز عبور وارد شده با مشخصات سامانه همخوانی ندارد.";
      } else if (err.code === "auth/invalid-credential") {
        farsiError = "کد اعتبارسنجی نامعتبر است یا مشخصات نادرست می‌باشد.";
      } else if (err.message) {
        farsiError = err.message;
      }
      setErrorMessage(farsiError);
      showNotification(farsiError, "error");
    } finally {
      setLoading(false);
    }
  };

  const openInNewTab = () => {
    window.open(window.location.href, "_blank");
  };

  return (
    <div 
      className={`min-h-screen w-full flex items-center justify-center p-4 relative overflow-y-auto py-12 font-sans select-none ${
        isDarkMode 
          ? "bg-[#0A0A0B] text-slate-200" 
          : "bg-[#FAFAFA] text-slate-800"
      }`} 
      dir="rtl"
    >
      {/* Background Visuals */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {isDarkMode ? (
          <>
            <div className="absolute top-[-20%] right-[-10%] w-[70vw] h-[70vw] rounded-full blur-[140px] opacity-[0.07] bg-indigo-500"></div>
            <div className="absolute bottom-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full blur-[140px] opacity-[0.05] bg-blue-500"></div>
          </>
        ) : (
          <>
            <div className="absolute top-[-20%] right-[-10%] w-[70vw] h-[70vw] rounded-full blur-[140px] opacity-[0.4] bg-indigo-100"></div>
            <div className="absolute bottom-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full blur-[140px] opacity-[0.3] bg-blue-100"></div>
          </>
        )}
        <div className={`absolute inset-0 opacity-[0.02] ${isDarkMode ? "bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)]" : "bg-[linear-gradient(to_right,#000000_1px,transparent_1px),linear-gradient(to_bottom,#000000_1px,transparent_1px)]"} bg-[size:32px_32px]`}></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[540px] relative z-10 my-auto"
      >
        {/* Main Card */}
        <div className={`rounded-3xl p-8 md:p-10 relative ${
          isDarkMode 
            ? "bg-[#111113] border border-white/5 shadow-2xl shadow-black/50" 
            : "bg-white border border-slate-200/60 shadow-xl shadow-slate-200/50"
        }`}>
          {/* Top Bar Button */}
          <div className="flex justify-between items-center mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
              درگاه امن احراز هویت کاربران (SSL HTTPS)
            </span>
            <button
              onClick={openInNewTab}
              className={`flex items-center gap-1.5 text-[11px] font-medium transition-colors px-2.5 py-1 rounded-lg ${
                isDarkMode ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
              title="باز کردن در تب جدید جهت هماهنگی کامل پروتکل‌های امنیتی"
            >
              <span>تب جدید</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          {/* Header */}
          <div className="flex flex-col items-center text-center mb-8 relative">
            <motion.div 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
              className="w-12 h-12 bg-slate-900 dark:bg-white rounded-2xl flex items-center justify-center text-white dark:text-slate-900 shadow-md mb-4"
            >
              <Lock className="w-5 h-5" />
            </motion.div>
            
            <h1 className="text-xl font-bold tracking-tight mb-2">
              سامانه حسابداری و ممیزی زره‌اسکن
            </h1>
            <p className={`text-xs max-w-[280px] leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
              ورود امن و رمزنگاری‌شده بر بستر ابری با تایید هویت دوکاناله
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className={`flex p-1.5 rounded-2xl mb-6 relative ${isDarkMode ? "bg-slate-900/80 border border-slate-800" : "bg-slate-100/90 border border-slate-200/80"}`}>
            <button
              onClick={() => { setActiveTab("google"); setErrorMessage(null); }}
              className={`flex-1 text-center py-2.5 text-[11px] font-bold rounded-xl transition-all duration-300 relative z-10 cursor-pointer ${
                activeTab === "google" 
                  ? isDarkMode ? "bg-gradient-to-r from-slate-800 to-slate-800/90 text-white shadow-md border border-slate-700" : "bg-white text-slate-900 shadow-md border border-slate-200" 
                  : isDarkMode ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              ورود با گوگل
            </button>
            <button
              onClick={() => { setActiveTab("register"); setErrorMessage(null); }}
              className={`flex-1 text-center py-2.5 text-[11px] font-bold rounded-xl transition-all duration-300 relative z-10 cursor-pointer ${
                activeTab === "register" 
                  ? isDarkMode ? "bg-gradient-to-r from-slate-800 to-slate-800/90 text-white shadow-md border border-slate-700" : "bg-white text-slate-900 shadow-md border border-slate-200" 
                  : isDarkMode ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              ثبت‌نام جدید
            </button>
            <button
              onClick={() => { setActiveTab("login"); setErrorMessage(null); }}
              className={`flex-1 text-center py-2.5 text-[11px] font-bold rounded-xl transition-all duration-300 relative z-10 cursor-pointer ${
                activeTab === "login" 
                  ? isDarkMode ? "bg-gradient-to-r from-slate-800 to-slate-800/90 text-white shadow-md border border-slate-700" : "bg-white text-slate-900 shadow-md border border-slate-200" 
                  : isDarkMode ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              ورود دستی
            </button>
          </div>

          {/* Quick Demo Bypass Option for Seamless UX */}
          <div className="mb-6">
            <button
              type="button"
              onClick={() => {
                onEnterDemo(
                  "علی زره‌ساز", 
                  "alizerehsaz2001@gmail.com", 
                  "09121112233", 
                  "موسسه حسابرسی زره‌اسکن", 
                  "0012345678", 
                  "حسابرس ارشد"
                );
                showNotification("خوش آمدید! شما با موفقیت به عنوان کاربر مهمان وارد شدید.", "success");
              }}
              className={`w-full py-3 px-4 rounded-xl text-[11px] font-black flex items-center justify-center gap-2.5 transition-all duration-300 cursor-pointer group border ${
                isDarkMode 
                  ? "bg-gradient-to-r from-indigo-950/60 via-slate-900 to-blue-950/60 border-indigo-500/30 text-indigo-200 hover:border-indigo-400 hover:shadow-[0_0_20px_rgba(99,102,241,0.2)]" 
                  : "bg-gradient-to-r from-indigo-50 via-white to-blue-50 border-indigo-200 text-indigo-800 hover:border-indigo-300 hover:shadow-md"
              }`}
            >
              <Sparkles className="w-4 h-4 text-indigo-500 animate-spin-slow group-hover:scale-110 transition-transform" />
              <span>ورود فوری به محیط آزمایشی (دپوی کامل حسابرسی)</span>
              <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border border-indigo-500/20">
                1-Click Demo
              </span>
            </button>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs leading-relaxed text-right flex flex-col gap-3"
            >
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-rose-500/15">
                <button
                  type="button"
                  onClick={openInNewTab}
                  className="px-3 py-1.5 bg-rose-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1.5 hover:bg-rose-600 transition-colors shadow-sm cursor-pointer"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>باز کردن در تب جدید</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab("login"); setErrorMessage(null); }}
                  className="px-3 py-1.5 bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 rounded-lg text-[10px] font-bold hover:opacity-90 transition-opacity cursor-pointer"
                >
                  <span>انتقال به ورود دستی</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* TAB 1: Google Sign In */}
          {activeTab === "google" && (
            <div className="space-y-6">
              <div className={`p-5 rounded-2xl text-center text-[11px] leading-relaxed ${
                isDarkMode ? "bg-white/[0.02] text-slate-400" : "bg-slate-50 text-slate-500"
              }`}>
                جهت سهولت ورود و عدم نیاز به حفظ گذرواژه، می‌توانید با یک کلیک از طریق حساب کاربری تایید شده گوگل خود وارد سامانه شوید.
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleGoogleSignIn}
                disabled={loading}
                className={`w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-xl font-bold text-[11px] transition-all cursor-pointer border ${
                  isDarkMode 
                    ? "bg-[#1A1A1D] border-white/10 text-slate-200 hover:bg-[#222225]" 
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm"
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4.5 h-4.5 animate-spin text-blue-500" />
                    <span>در حال اتصال امن به سرورهای احراز هویت گوگل...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#EA4335"
                        d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.529-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l3.227-3.11C18.281 1.09 15.45 0 12.24 0 5.58 0 0 5.37 0 12s5.58 12 12.24 12c6.96 0 11.57-4.89 11.57-11.79 0-.79-.085-1.4-.19-1.925H12.24z"
                      />
                    </svg>
                    <span>احراز هویت و ورود یکپارچه با گوگل</span>
                  </>
                )}
              </motion.button>

              <div className={`p-3.5 rounded-xl text-[10px] leading-relaxed flex items-center justify-between gap-2 border ${
                isDarkMode 
                  ? "bg-amber-500/10 border-amber-500/20 text-amber-300" 
                  : "bg-amber-50 border-amber-200 text-amber-800"
              }`}>
                <span>💡 اگر با خطای شبکه (Network Error) در پیش‌نمایش مواجه شدید، دکمه زیر را بزنید:</span>
                <button
                  type="button"
                  onClick={openInNewTab}
                  className="shrink-0 px-2.5 py-1 bg-amber-500 text-slate-950 font-bold rounded-lg text-[9.5px] hover:bg-amber-400 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>تب جدید</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Register Details */}
          {activeTab === "register" && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                
                {/* Row 1: Name and Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2 text-right">
                    <label className={`text-[10px] font-bold flex items-center gap-1.5 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
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
                      className={`w-full px-3.5 py-3 rounded-xl text-[11px] font-medium border transition-colors outline-none ${
                        errors.fullName 
                          ? "border-rose-500/50 bg-rose-500/5 text-rose-500" 
                          : isDarkMode ? "bg-[#1A1A1D] border-white/10 text-white focus:border-indigo-500" : "bg-slate-50 border-slate-200 text-slate-800 focus:border-slate-400 focus:bg-white"
                      }`}
                    />
                    {errors.fullName && (
                      <p className="text-[9px] text-rose-500 font-bold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>{errors.fullName}</span>
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 text-right">
                    <label className={`text-[10px] font-bold flex items-center gap-1.5 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                      <span>آدرس ایمیل</span>
                    </label>
                    <input
                      type="email"
                      placeholder="user@example.com"
                      value={userEmail}
                      onChange={(e) => {
                        setUserEmail(e.target.value);
                        if (errors.userEmail) setErrors(prev => ({ ...prev, userEmail: "" }));
                      }}
                      className={`w-full px-3.5 py-3 rounded-xl text-[11px] font-medium border text-left font-mono transition-colors outline-none ${
                        errors.userEmail 
                          ? "border-rose-500/50 bg-rose-500/5 text-rose-500" 
                          : isDarkMode ? "bg-[#1A1A1D] border-white/10 text-white focus:border-indigo-500" : "bg-slate-50 border-slate-200 text-slate-800 focus:border-slate-400 focus:bg-white"
                      }`}
                    />
                    {errors.userEmail && (
                      <p className="text-[9px] text-rose-500 font-bold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>{errors.userEmail}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Password field */}
                <div className="space-y-2 text-right">
                  <label className={`text-[10px] font-bold flex items-center gap-1.5 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                    <span>رمز عبور (حداقل ۶ کاراکتر)</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="گذرواژه امن خود را وارد کنید"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errors.password) setErrors(prev => ({ ...prev, password: "" }));
                      }}
                      className={`w-full px-3.5 py-3 rounded-xl text-[11px] font-medium border text-left font-mono outline-none transition-colors ${
                        errors.password 
                          ? "border-rose-500/50 bg-rose-500/5 text-rose-500" 
                          : isDarkMode ? "bg-[#1A1A1D] border-white/10 text-white focus:border-indigo-500" : "bg-slate-50 border-slate-200 text-slate-800 focus:border-slate-400 focus:bg-white"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-[9px] text-rose-500 font-bold flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{errors.password}</span>
                    </p>
                  )}
                </div>

                {/* Row 2: Phone and National ID */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2 text-right">
                    <label className={`text-[10px] font-bold flex items-center gap-1.5 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
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
                      className={`w-full px-3.5 py-3 rounded-xl text-[11px] font-medium outline-none transition-colors border text-left font-mono ${
                        errors.userPhone
                          ? "border-rose-500/50 bg-rose-500/5 text-rose-500"
                          : isDarkMode 
                            ? "bg-[#1A1A1D] border-white/10 text-white focus:border-indigo-500" 
                            : "bg-slate-50 border-slate-200 text-slate-800 focus:border-slate-400 focus:bg-white"
                      }`}
                    />
                    {errors.userPhone && (
                      <p className="text-[9px] text-rose-500 font-bold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>{errors.userPhone}</span>
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 text-right">
                    <label className={`text-[10px] font-bold flex items-center gap-1.5 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
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
                      className={`w-full px-3.5 py-3 rounded-xl text-[11px] font-medium outline-none transition-colors border text-left font-mono ${
                        errors.userNationalCode
                          ? "border-rose-500/50 bg-rose-500/5 text-rose-500"
                          : isDarkMode 
                            ? "bg-[#1A1A1D] border-white/10 text-white focus:border-indigo-500" 
                            : "bg-slate-50 border-slate-200 text-slate-800 focus:border-slate-400 focus:bg-white"
                      }`}
                    />
                    {errors.userNationalCode && (
                      <p className="text-[9px] text-rose-500 font-bold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>{errors.userNationalCode}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Row 3: Company Name and Job Title */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2 text-right">
                    <label className={`text-[10px] font-bold flex items-center gap-1.5 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
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
                      className={`w-full px-3.5 py-3 rounded-xl text-[11px] font-medium outline-none transition-colors border ${
                        errors.companyName
                          ? "border-rose-500/50 bg-rose-500/5 text-rose-500"
                          : isDarkMode 
                            ? "bg-[#1A1A1D] border-white/10 text-white focus:border-indigo-500" 
                            : "bg-slate-50 border-slate-200 text-slate-800 focus:border-slate-400 focus:bg-white"
                      }`}
                    />
                    {errors.companyName && (
                      <p className="text-[9px] text-rose-500 font-bold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>{errors.companyName}</span>
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 text-right">
                    <label className={`text-[10px] font-bold flex items-center gap-1.5 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                      <span>سمت شغلی</span>
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: حسابرس ارشد"
                      value={jobTitle}
                      onChange={(e) => {
                        setJobTitle(e.target.value);
                        if (errors.jobTitle) setErrors(prev => ({ ...prev, jobTitle: "" }));
                      }}
                      className={`w-full px-3.5 py-3 rounded-xl text-[11px] font-medium outline-none transition-colors border ${
                        errors.jobTitle
                          ? "border-rose-500/50 bg-rose-500/5 text-rose-500"
                          : isDarkMode 
                            ? "bg-[#1A1A1D] border-white/10 text-white focus:border-indigo-500" 
                            : "bg-slate-50 border-slate-200 text-slate-800 focus:border-slate-400 focus:bg-white"
                      }`}
                    />
                    {errors.jobTitle && (
                      <p className="text-[9px] text-rose-500 font-bold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>{errors.jobTitle}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Confidentiality Agreement */}
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
                        ? isDarkMode ? "text-white" : "text-slate-900" 
                        : errors.agree 
                          ? "text-rose-500" 
                          : "text-slate-400 group-hover:text-slate-500 dark:group-hover:text-slate-300"
                    }`}>
                      {agreeConfidentiality ? (
                        <CheckSquare className="w-4 h-4" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </div>
                    <span className={`text-[10px] leading-relaxed transition-colors select-none ${
                      errors.agree 
                        ? "text-rose-500 font-bold" 
                        : isDarkMode ? "text-slate-400" : "text-slate-500"
                    }`}>
                      اینجانب صحت اطلاعات فوق را تأیید کرده و متعهد به حفظ محرمانگی کامل اسناد و صورتهای مالی بارگذاری شده می‌باشم.
                    </span>
                  </button>
                  {errors.agree && (
                    <p className="text-[9px] text-rose-500 font-bold flex items-center gap-1 mt-1">
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
                  className={`w-full flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl font-bold text-[11px] transition-all cursor-pointer mt-6 ${
                    isDarkMode 
                      ? "bg-white text-slate-900 hover:bg-slate-100" 
                      : "bg-slate-900 text-white hover:bg-slate-800"
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>در حال ثبت اطلاعات...</span>
                    </>
                  ) : (
                    <span>ایجاد حساب و ورود</span>
                  )}
                </motion.button>
              </form>
            </motion.div>
          )}

          {/* TAB 3: Direct login with email & password */}
          {activeTab === "login" && (
            <motion.div 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div className={`p-4 rounded-2xl text-center text-[11px] leading-relaxed ${
                isDarkMode ? "bg-white/[0.02] text-slate-400" : "bg-slate-50 text-slate-500"
              }`}>
                اگر پیش از این ثبت‌نام کرده‌اید، اطلاعات ورود خود را وارد نمایید.
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-5">
                <div className="space-y-2 text-right">
                  <label className={`text-[10px] font-bold flex items-center gap-1.5 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                    <span>آدرس ایمیل</span>
                  </label>
                  <input
                    type="email"
                    placeholder="user@example.com"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className={`w-full px-3.5 py-3 rounded-xl text-[11px] font-medium border text-left font-mono outline-none transition-colors ${
                      isDarkMode ? "bg-[#1A1A1D] border-white/10 text-white focus:border-indigo-500" : "bg-slate-50 border-slate-200 text-slate-800 focus:border-slate-400 focus:bg-white"
                    }`}
                  />
                </div>

                <div className="space-y-2 text-right">
                  <label className={`text-[10px] font-bold flex items-center gap-1.5 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                    <span>گذرواژه</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="رمز عبور خود را وارد کنید"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full px-3.5 py-3 rounded-xl text-[11px] font-medium border text-left font-mono outline-none transition-colors ${
                        isDarkMode ? "bg-[#1A1A1D] border-white/10 text-white focus:border-indigo-500" : "bg-slate-50 border-slate-200 text-slate-800 focus:border-slate-400 focus:bg-white"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit"
                  disabled={loading}
                  className={`w-full flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl font-bold text-[11px] transition-all cursor-pointer mt-2 ${
                    isDarkMode 
                      ? "bg-white text-slate-900 hover:bg-slate-100" 
                      : "bg-slate-900 text-white hover:bg-slate-800"
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>در حال تایید هویت...</span>
                    </>
                  ) : (
                    <span>ورود به سیستم</span>
                  )}
                </motion.button>
              </form>
            </motion.div>
          )}

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
