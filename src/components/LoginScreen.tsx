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
  EyeOff,
  Send
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
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

    if (!confirmPassword) {
      newErrors.confirmPassword = "تکرار رمز عبور الزامی است.";
    } else if (confirmPassword !== password) {
      newErrors.confirmPassword = "رمز عبور و تکرار آن یکسان نیستند.";
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

    const cleanEmail = userEmail.trim().toLowerCase();

    try {
      // 1. Create firebase user using Email & Password
      const credential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
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
        email: cleanEmail,
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
        // Automatically attempt login if email is already registered
        try {
          const signInCred = await signInWithEmailAndPassword(auth, cleanEmail, password);
          if (signInCred.user) {
            const userDocRef = doc(db, "users", signInCred.user.uid);
            let userSnap = null;
            try {
              userSnap = await getDoc(userDocRef);
            } catch (snapErr) {
              console.warn("Firestore lookup error:", snapErr);
            }

            if (userSnap && userSnap.exists()) {
              const userData = userSnap.data();
              showNotification(`حساب کاربری شما قبلاً ایجاد شده بود. ورود موفقیت‌آمیز انجام شد. خوش آمدید، ${userData.name || 'کاربر'}!`, "success");
              onEnterDemo(
                userData.name,
                userData.email || cleanEmail,
                userData.phone || userPhone.trim(),
                userData.companyName || companyName.trim(),
                userData.nationalCode || userNationalCode.trim(),
                userData.jobTitle || jobTitle.trim()
              );
              return;
            } else {
              const payload = {
                id: signInCred.user.uid,
                name: fullName.trim() || signInCred.user.displayName || "کاربر",
                firstName: fullName.trim().split(" ")[0] || "",
                lastName: fullName.trim().split(" ").slice(1).join(" ") || "",
                email: cleanEmail,
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
              } catch (writeErr) {
                console.warn("Could not write user profile:", writeErr);
              }
              showNotification("ورود با موفقیت انجام شد و مشخصات حساب شما به‌روزرسانی گردید.", "success");
              onEnterDemo(
                payload.name,
                payload.email,
                payload.phone,
                payload.companyName,
                payload.nationalCode,
                payload.jobTitle
              );
              return;
            }
          }
        } catch (loginErr: any) {
          farsiError = "این آدرس ایمیل قبلاً در سامانه ثبت شده است. اگر حساب متعلق به شماست، رمز عبور وارد شده نادرست است یا می‌توانید از تب «ورود دستی» استفاده نمایید.";
        }
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

    const cleanEmail = userEmail.trim().toLowerCase();

    if (!cleanEmail) {
      showNotification("آدرس ایمیل الزامی است.", "error");
      return;
    }
    if (!password) {
      showNotification("رمز عبور الزامی است.", "error");
      return;
    }

    setLoading(true);

    try {
      const credential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const user = credential.user;

      if (!user) {
        throw new Error("خطا در ورود.");
      }

      // Fetch user profile from Firestore
      const userDocRef = doc(db, "users", user.uid);
      let userSnap = null;
      try {
        userSnap = await getDoc(userDocRef);
      } catch (docErr) {
        console.warn("Firestore lookup error during login:", docErr);
      }

      if (userSnap && userSnap.exists()) {
        const userData = userSnap.data();
        showNotification(`خوش آمدید، ${userData.name || user.displayName || 'کاربر'}!`, "success");
        onEnterDemo(
          userData.name, 
          userData.email || user.email || cleanEmail, 
          userData.phone || "", 
          userData.companyName || "", 
          userData.nationalCode || "", 
          userData.jobTitle || ""
        );
      } else {
        // Fallback: create profile if user auth exists but doc is missing
        const displayName = user.displayName || cleanEmail.split("@")[0] || "کاربر سامانه";
        const fallbackProfile = {
          id: user.uid,
          name: displayName,
          firstName: displayName.split(" ")[0] || "کاربر",
          lastName: displayName.split(" ").slice(1).join(" ") || "",
          email: user.email || cleanEmail,
          phone: userPhone.trim() || "",
          nationalCode: userNationalCode.trim() || "",
          companyName: companyName.trim() || "سازمان (ورود دستی)",
          jobTitle: jobTitle.trim() || "کاربر سیستم",
          role: "user",
          status: "active",
          createdAt: new Date().toISOString(),
          isOnboarded: true
        };
        try {
          await setDoc(userDocRef, fallbackProfile);
        } catch (e) {
          console.warn("Could not save fallback profile to Firestore:", e);
        }

        showNotification(`ورود با موفقیت انجام شد. خوش آمدید، ${displayName}!`, "success");
        onEnterDemo(
          fallbackProfile.name,
          fallbackProfile.email,
          fallbackProfile.phone,
          fallbackProfile.companyName,
          fallbackProfile.nationalCode,
          fallbackProfile.jobTitle
        );
      }
    } catch (err: any) {
      console.error("Manual login error:", err);
      let farsiError = "ایمیل یا رمز عبور اشتباه است.";
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        farsiError = "ایمیل یا رمز عبور وارد شده با مشخصات سامانه همخوانی ندارد. لطفاً ابتدا ثبت‌نام کنید یا از رمز عبور صحیح استفاده نمایید.";
      } else if (err.code === "auth/invalid-email") {
        farsiError = "فرمت آدرس ایمیل وارد شده نامعتبر است.";
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
      className={`min-h-screen w-full flex items-center justify-center p-4 sm:p-6 relative overflow-y-auto py-10 font-sans select-none ${
        isDarkMode 
          ? "bg-[#090D16] text-slate-100 selection:bg-indigo-500/30" 
          : "bg-[#F3F6FA] text-slate-800 selection:bg-indigo-500/20"
      }`} 
      dir="rtl"
    >
      {/* Background Ambient Visual Glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {isDarkMode ? (
          <>
            <div className="absolute -top-32 -right-32 w-[550px] h-[550px] rounded-full blur-[130px] opacity-25 bg-indigo-600/30"></div>
            <div className="absolute -bottom-32 -left-32 w-[550px] h-[550px] rounded-full blur-[130px] opacity-20 bg-amber-500/20"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[160px] opacity-10 bg-blue-600/20"></div>
          </>
        ) : (
          <>
            <div className="absolute -top-32 -right-32 w-[550px] h-[550px] rounded-full blur-[130px] opacity-60 bg-indigo-100/70"></div>
            <div className="absolute -bottom-32 -left-32 w-[550px] h-[550px] rounded-full blur-[130px] opacity-50 bg-amber-100/60"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[160px] opacity-40 bg-blue-50/70"></div>
          </>
        )}
        <div className={`absolute inset-0 opacity-[0.03] ${isDarkMode ? "bg-[radial-gradient(#ffffff_1px,transparent_1px)]" : "bg-[radial-gradient(#000000_1px,transparent_1px)]"} [background-size:24px_24px]`}></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[560px] relative z-10 my-auto"
      >
        {/* Main Glass Card */}
        <div className={`rounded-3xl p-6 sm:p-9 relative transition-all duration-300 ${
          isDarkMode 
            ? "bg-slate-900/90 backdrop-blur-2xl border border-slate-800/90 shadow-[0_25px_60px_rgba(0,0,0,0.6)]" 
            : "bg-white/95 backdrop-blur-2xl border border-slate-200/90 shadow-[0_20px_50px_rgba(15,23,42,0.08)]"
        }`}>
          
          {/* Top Status & New Tab Bar */}
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100 dark:border-slate-800/70">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-emerald-500 dark:text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                درگاه امن احراز هویت (SSL 256-bit)
              </span>
            </div>

            <button
              onClick={openInNewTab}
              className={`flex items-center gap-1.5 text-[11px] font-bold transition-all px-2.5 py-1 rounded-xl border cursor-pointer ${
                isDarkMode 
                  ? "bg-slate-800/60 border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-700" 
                  : "bg-slate-100/80 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200"
              }`}
              title="باز کردن در تب جدید جهت سازگاری کامل پروتکل‌های امنیتی"
            >
              <span>تب جدید</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          {/* Header Brand */}
          <div className="flex flex-col items-center text-center mb-7 relative">
            <div className="relative mb-3">
              <div className="w-14 h-14 bg-gradient-to-tr from-indigo-600 via-indigo-500 to-blue-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/25">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div className="absolute -bottom-1 -left-1 w-5 h-5 bg-amber-500 rounded-lg flex items-center justify-center text-white shadow-md">
                <Sparkles className="w-3 h-3" />
              </div>
            </div>
            
            <h1 className="text-xl sm:text-2xl font-black tracking-tight mb-1 bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-blue-500 to-amber-500">
              سامانه حسابداری و ممیزی زره‌اسکن
            </h1>
            <p className={`text-[11.5px] max-w-[340px] leading-relaxed font-medium ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
              ورود امن و یکپارچه به موتور استخراج اسناد مالی و هوش حسابرسی
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className={`grid grid-cols-3 p-1.5 rounded-2xl mb-6 relative border ${
            isDarkMode 
              ? "bg-slate-950/70 border-slate-800/80" 
              : "bg-slate-100/90 border-slate-200/80"
          }`}>
            <button
              onClick={() => { setActiveTab("google"); setErrorMessage(null); }}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2 text-[11px] font-black rounded-xl transition-all duration-200 cursor-pointer ${
                activeTab === "google" 
                  ? isDarkMode 
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400/40" 
                    : "bg-white text-indigo-700 shadow-md shadow-slate-300/60 border border-indigo-200" 
                  : isDarkMode 
                    ? "text-slate-400 hover:text-slate-200 hover:bg-white/5" 
                    : "text-slate-600 hover:text-slate-900 hover:bg-black/5"
              }`}
            >
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                <path fill={activeTab === "google" && isDarkMode ? "#ffffff" : "#EA4335"} d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.529-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l3.227-3.11C18.281 1.09 15.45 0 12.24 0 5.58 0 0 5.37 0 12s5.58 12 12.24 12c6.96 0 11.57-4.89 11.57-11.79 0-.79-.085-1.4-.19-1.925H12.24z" />
              </svg>
              <span className="truncate">ورود با گوگل</span>
            </button>

            <button
              onClick={() => { setActiveTab("register"); setErrorMessage(null); }}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2 text-[11px] font-black rounded-xl transition-all duration-200 cursor-pointer ${
                activeTab === "register" 
                  ? isDarkMode 
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400/40" 
                    : "bg-white text-indigo-700 shadow-md shadow-slate-300/60 border border-indigo-200" 
                  : isDarkMode 
                    ? "text-slate-400 hover:text-slate-200 hover:bg-white/5" 
                    : "text-slate-600 hover:text-slate-900 hover:bg-black/5"
              }`}
            >
              <User className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">ثبت‌نام جدید</span>
            </button>

            <button
              onClick={() => { setActiveTab("login"); setErrorMessage(null); }}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2 text-[11px] font-black rounded-xl transition-all duration-200 cursor-pointer ${
                activeTab === "login" 
                  ? isDarkMode 
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400/40" 
                    : "bg-white text-indigo-700 shadow-md shadow-slate-300/60 border border-indigo-200" 
                  : isDarkMode 
                    ? "text-slate-400 hover:text-slate-200 hover:bg-white/5" 
                    : "text-slate-600 hover:text-slate-900 hover:bg-black/5"
              }`}
            >
              <KeyRound className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">ورود دستی</span>
            </button>
          </div>

          {/* Quick 1-Click Demo VIP Button */}
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
              className={`w-full py-3 px-4 rounded-2xl text-[11.5px] font-black flex items-center justify-between transition-all duration-300 cursor-pointer group border shadow-sm ${
                isDarkMode 
                  ? "bg-gradient-to-r from-amber-500/10 via-slate-900 to-indigo-950/40 border-amber-500/30 text-amber-200 hover:border-amber-400 hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]" 
                  : "bg-gradient-to-r from-amber-50/80 via-white to-indigo-50/70 border-amber-200/90 text-amber-900 hover:border-amber-300 hover:shadow-md"
              }`}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 animate-pulse group-hover:scale-110 transition-transform" />
                <span>ورود فوری به محیط آزمایشی (بدون نیاز به ثبت‌نام)</span>
              </div>
              <span className="px-2 py-0.5 rounded-lg text-[9.5px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/30">
                1-Click Demo
              </span>
            </button>
          </div>

          {/* Error Alert Box */}
          {errorMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-500 text-[11px] leading-relaxed text-right flex flex-col gap-2.5"
            >
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-rose-500/15">
                <button
                  type="button"
                  onClick={openInNewTab}
                  className="px-3 py-1 bg-rose-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 hover:bg-rose-600 transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>باز کردن در تب جدید</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab("login"); setErrorMessage(null); }}
                  className="px-3 py-1 bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 rounded-lg text-[10px] font-bold hover:opacity-90 transition-opacity cursor-pointer"
                >
                  <span>انتقال به ورود دستی</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* TAB 1: Google Sign In */}
          {activeTab === "google" && (
            <div className="space-y-6">
              <div className={`p-4 rounded-2xl text-center text-[11px] leading-relaxed border ${
                isDarkMode ? "bg-slate-950/60 text-slate-300 border-slate-800" : "bg-slate-50 text-slate-600 border-slate-200/80"
              }`}>
                با کلیک روی دکمه زیر، مستقیماً از طریق حساب معتبر گوگل خود وارد سامانه شوید و به تمام اسناد و ابزارهای ممیزی دسترسی پیدا کنید.
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleGoogleSignIn}
                disabled={loading}
                className={`w-full flex items-center justify-center gap-3 px-5 py-4 rounded-2xl font-black text-xs transition-all cursor-pointer border shadow-lg ${
                  isDarkMode 
                    ? "bg-slate-800 hover:bg-slate-750 border-slate-700 text-slate-100 hover:border-slate-600 shadow-slate-950/40" 
                    : "bg-white hover:bg-slate-50 border-slate-200 text-slate-800 shadow-slate-200/80"
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                    <span>در حال اتصال امن به سرورهای گوگل...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#EA4335"
                        d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.529-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l3.227-3.11C18.281 1.09 15.45 0 12.24 0 5.58 0 0 5.37 0 12s5.58 12 12.24 12c6.96 0 11.57-4.89 11.57-11.79 0-.79-.085-1.4-.19-1.925H12.24z"
                      />
                    </svg>
                    <span>احراز هویت و ورود مستقیم با حساب گوگل</span>
                  </>
                )}
              </motion.button>

              <div className={`p-3.5 rounded-2xl text-[10.5px] leading-relaxed flex items-center justify-between gap-3 border ${
                isDarkMode 
                  ? "bg-amber-500/5 border-amber-500/15 text-amber-200/90" 
                  : "bg-amber-50/60 border-amber-200 text-amber-800"
              }`}>
                <span>💡 در صورت مواجهه با محدودیت فریم مرورگر:</span>
                <button
                  type="button"
                  onClick={openInNewTab}
                  className="shrink-0 px-3 py-1 bg-amber-500/15 text-amber-600 dark:text-amber-300 font-bold rounded-xl hover:bg-amber-500/25 transition-colors cursor-pointer flex items-center gap-1 border border-amber-500/20"
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
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                
                {/* Row 1: Name and Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5 text-right">
                    <label className={`text-[11px] font-bold flex items-center gap-1 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                      <User className="w-3 h-3 text-indigo-400" />
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
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium border transition-colors outline-none ${
                        errors.fullName 
                          ? "border-rose-500/50 bg-rose-500/5 text-rose-500" 
                          : isDarkMode ? "bg-slate-950 border-slate-800 text-white focus:border-indigo-500" : "bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500 focus:bg-white"
                      }`}
                    />
                    {errors.fullName && (
                      <p className="text-[9.5px] text-rose-500 font-bold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>{errors.fullName}</span>
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5 text-right">
                    <label className={`text-[11px] font-bold flex items-center gap-1 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                      <Mail className="w-3 h-3 text-indigo-400" />
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
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium border text-left font-mono transition-colors outline-none ${
                        errors.userEmail 
                          ? "border-rose-500/50 bg-rose-500/5 text-rose-500" 
                          : isDarkMode ? "bg-slate-950 border-slate-800 text-white focus:border-indigo-500" : "bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500 focus:bg-white"
                      }`}
                    />
                    {errors.userEmail && (
                      <p className="text-[9.5px] text-rose-500 font-bold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>{errors.userEmail}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Row 2: Password and Confirm Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5 text-right">
                    <label className={`text-[11px] font-bold flex items-center gap-1 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                      <Lock className="w-3 h-3 text-indigo-400" />
                      <span>رمز عبور (حداقل ۶ کاراکتر)</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="گذرواژه امن"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (errors.password) setErrors(prev => ({ ...prev, password: "" }));
                          if (errors.confirmPassword && confirmPassword === e.target.value) {
                            setErrors(prev => ({ ...prev, confirmPassword: "" }));
                          }
                        }}
                        className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium border text-left font-mono outline-none transition-colors ${
                          errors.password 
                            ? "border-rose-500/50 bg-rose-500/5 text-rose-500" 
                            : isDarkMode ? "bg-slate-950 border-slate-800 text-white focus:border-indigo-500" : "bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500 focus:bg-white"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-3 top-2.5 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-[9.5px] text-rose-500 font-bold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>{errors.password}</span>
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5 text-right">
                    <label className={`text-[11px] font-bold flex items-center gap-1 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                      <Lock className="w-3 h-3 text-indigo-400" />
                      <span>تکرار رمز عبور</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="تکرار گذرواژه"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: "" }));
                        }}
                        className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium border text-left font-mono outline-none transition-colors ${
                          errors.confirmPassword 
                            ? "border-rose-500/50 bg-rose-500/5 text-rose-500" 
                            : isDarkMode ? "bg-slate-950 border-slate-800 text-white focus:border-indigo-500" : "bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500 focus:bg-white"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute left-3 top-2.5 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-[9.5px] text-rose-500 font-bold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>{errors.confirmPassword}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Row 3: Phone and National ID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5 text-right">
                    <label className={`text-[11px] font-bold flex items-center gap-1 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                      <Phone className="w-3 h-3 text-indigo-400" />
                      <span>شماره همراه</span>
                    </label>
                    <input
                      type="text"
                      placeholder="09123456789"
                      value={userPhone}
                      onChange={(e) => {
                        setUserPhone(e.target.value);
                        if (errors.userPhone) setErrors(prev => ({ ...prev, userPhone: "" }));
                      }}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium outline-none transition-colors border text-left font-mono ${
                        errors.userPhone
                          ? "border-rose-500/50 bg-rose-500/5 text-rose-500"
                          : isDarkMode 
                            ? "bg-slate-950 border-slate-800 text-white focus:border-indigo-500" 
                            : "bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500 focus:bg-white"
                      }`}
                    />
                    {errors.userPhone && (
                      <p className="text-[9.5px] text-rose-500 font-bold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>{errors.userPhone}</span>
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5 text-right">
                    <label className={`text-[11px] font-bold flex items-center gap-1 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                      <FileText className="w-3 h-3 text-indigo-400" />
                      <span>کد ملی ۱۰ رقمی</span>
                    </label>
                    <input
                      type="text"
                      placeholder="0012345678"
                      value={userNationalCode}
                      onChange={(e) => {
                        setUserNationalCode(e.target.value);
                        if (errors.userNationalCode) setErrors(prev => ({ ...prev, userNationalCode: "" }));
                      }}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium outline-none transition-colors border text-left font-mono ${
                        errors.userNationalCode
                          ? "border-rose-500/50 bg-rose-500/5 text-rose-500"
                          : isDarkMode 
                            ? "bg-slate-950 border-slate-800 text-white focus:border-indigo-500" 
                            : "bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500 focus:bg-white"
                      }`}
                    />
                    {errors.userNationalCode && (
                      <p className="text-[9.5px] text-rose-500 font-bold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>{errors.userNationalCode}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Row 4: Company and Job Title */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5 text-right">
                    <label className={`text-[11px] font-bold flex items-center gap-1 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                      <Building2 className="w-3 h-3 text-indigo-400" />
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
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium outline-none transition-colors border ${
                        errors.companyName
                          ? "border-rose-500/50 bg-rose-500/5 text-rose-500"
                          : isDarkMode 
                            ? "bg-slate-950 border-slate-800 text-white focus:border-indigo-500" 
                            : "bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500 focus:bg-white"
                      }`}
                    />
                    {errors.companyName && (
                      <p className="text-[9.5px] text-rose-500 font-bold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>{errors.companyName}</span>
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5 text-right">
                    <label className={`text-[11px] font-bold flex items-center gap-1 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                      <Briefcase className="w-3 h-3 text-indigo-400" />
                      <span>سمت سازمانی</span>
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: حسابرس ارشد"
                      value={jobTitle}
                      onChange={(e) => {
                        setJobTitle(e.target.value);
                        if (errors.jobTitle) setErrors(prev => ({ ...prev, jobTitle: "" }));
                      }}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium outline-none transition-colors border ${
                        errors.jobTitle
                          ? "border-rose-500/50 bg-rose-500/5 text-rose-500"
                          : isDarkMode 
                            ? "bg-slate-950 border-slate-800 text-white focus:border-indigo-500" 
                            : "bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500 focus:bg-white"
                      }`}
                    />
                    {errors.jobTitle && (
                      <p className="text-[9.5px] text-rose-500 font-bold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>{errors.jobTitle}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Confidentiality Agreement */}
                <div className="pt-1 text-right">
                  <button
                    type="button"
                    onClick={() => {
                      setAgreeConfidentiality(!agreeConfidentiality);
                      if (errors.agree) setErrors(prev => ({ ...prev, agree: "" }));
                    }}
                    className="flex items-start gap-2 text-right cursor-pointer group"
                  >
                    <div className={`mt-0.5 shrink-0 transition-colors ${
                      agreeConfidentiality 
                        ? "text-indigo-500" 
                        : errors.agree 
                          ? "text-rose-500" 
                          : "text-slate-400"
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
                        : isDarkMode ? "text-slate-400" : "text-slate-600"
                    }`}>
                      اینجانب صحت اطلاعات فوق را تأیید نموده و متعهد به حفظ محرمانگی کامل اسناد و صورتهای مالی بارگذاری شده می‌باشم.
                    </span>
                  </button>
                  {errors.agree && (
                    <p className="text-[9px] text-rose-500 font-bold flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{errors.agree}</span>
                    </p>
                  )}
                </div>

                {/* Submit Register Button */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl font-black text-xs transition-all cursor-pointer mt-4 shadow-lg bg-gradient-to-r from-indigo-600 via-indigo-500 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-indigo-500/25 border border-indigo-400/20"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>در حال ایجاد حساب کاربری...</span>
                    </>
                  ) : (
                    <span>تکمیل ثبت‌نام و ورود به سامانه</span>
                  )}
                </motion.button>
              </form>
            </motion.div>
          )}

          {/* TAB 3: Direct login with email & password */}
          {activeTab === "login" && (
            <motion.div 
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div className={`p-3.5 rounded-2xl text-center text-[11px] leading-relaxed ${
                isDarkMode ? "bg-slate-950/60 text-slate-300 border border-slate-800" : "bg-slate-50 text-slate-600 border border-slate-200/80"
              }`}>
                در صورتی که قبلاً ثبت‌نام کرده‌اید، آدرس ایمیل و گذرواژه خود را وارد فرمایید:
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="space-y-1.5 text-right">
                  <label className={`text-[11px] font-bold flex items-center gap-1 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                    <Mail className="w-3 h-3 text-indigo-400" />
                    <span>آدرس ایمیل</span>
                  </label>
                  <input
                    type="email"
                    placeholder="user@example.com"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium border text-left font-mono outline-none transition-all duration-200 ${
                      isDarkMode 
                        ? "bg-slate-950 border-slate-800 text-white focus:border-indigo-500" 
                        : "bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500 focus:bg-white"
                    }`}
                  />
                </div>

                <div className="space-y-1.5 text-right">
                  <label className={`text-[11px] font-bold flex items-center gap-1 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                    <KeyRound className="w-3 h-3 text-indigo-400" />
                    <span>گذرواژه</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="رمز عبور خود را وارد کنید"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium border text-left font-mono outline-none transition-all duration-200 ${
                        isDarkMode 
                          ? "bg-slate-950 border-slate-800 text-white focus:border-indigo-500" 
                          : "bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500 focus:bg-white"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-2.5 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Login Button */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl font-black text-xs transition-all cursor-pointer mt-4 shadow-lg bg-gradient-to-r from-indigo-600 via-indigo-500 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-indigo-500/25 border border-indigo-400/20"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>در حال اعتبارسنجی و ورود...</span>
                    </>
                  ) : (
                    <span>ورود به حساب کاربری</span>
                  )}
                </motion.button>
              </form>
            </motion.div>
          )}

          {/* Footer Info & Support Channels */}
          <div className={`mt-6 pt-4 border-t flex flex-col gap-3 text-center ${isDarkMode ? "border-slate-800/80" : "border-slate-100"}`}>
            <div className="flex items-center gap-1.5 justify-center">
              <Lock className="w-3.5 h-3.5 text-emerald-500" />
              <span className={`text-[10px] font-bold ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                پروتکل‌های محرمانگی مالی و رمزنگاری بانکی فعال است.
              </span>
            </div>

            <div className={`p-2.5 rounded-2xl border text-xs flex flex-wrap items-center justify-between gap-2 ${
              isDarkMode ? "bg-slate-950/60 border-slate-800 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-700"
            }`}>
              <span className="text-[10px] font-black text-slate-400">ارتباط و پشتیبانی اختصاصی:</span>
              <div className="flex items-center gap-3 text-[11px] font-mono dir-ltr">
                <a 
                  href="https://t.me/Alizhz" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1 transition-colors"
                >
                  <Send className="w-3 h-3" />
                  <span>@Alizhz</span>
                </a>
                <span className="opacity-30">|</span>
                <a 
                  href="mailto:alizerehsaz2001@gmail.com" 
                  className="text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 transition-colors"
                >
                  <Mail className="w-3 h-3" />
                  <span>alizerehsaz2001@gmail.com</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
