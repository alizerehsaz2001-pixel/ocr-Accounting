import React, { useState } from "react";
import { ShieldAlert, KeyRound, Lock, X, AlertCircle, Eye, EyeOff, User, Phone, FileText, CheckCircle2, ArrowLeft, ArrowRight } from "lucide-react";

interface AdminPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminMasterPin: string;
  onSuccess: () => void;
  isDarkMode: boolean;
  showNotification: (msg: string, type: "success" | "error" | "info" | "warning") => void;
  logEvent: (action: string, details: string, type?: "info" | "success" | "warning" | "error" | "auth") => void;
}

export const AdminPinModal: React.FC<AdminPinModalProps> = ({
  isOpen,
  onClose,
  adminMasterPin,
  onSuccess,
  isDarkMode,
  showNotification,
  logEvent
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [enteredPin, setEnteredPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [showPinText, setShowPinText] = useState(false);

  // Specifications state
  const [adminName, setAdminName] = useState("");
  const [adminMobile, setAdminMobile] = useState("");
  const [adminPersonnelCode, setAdminPersonnelCode] = useState("");
  const [adminReason, setAdminReason] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const validateStep1 = () => {
    const errors: Record<string, string> = {};
    if (!adminName.trim()) {
      errors.name = "نام و نام خانوادگی الزامی است.";
    } else if (adminName.trim().length < 3) {
      errors.name = "نام باید حداقل ۳ کاراکتر باشد.";
    }

    if (!adminMobile.trim()) {
      errors.mobile = "شماره همراه الزامی است.";
    } else if (!/^09\d{9}$/.test(adminMobile.trim())) {
      errors.mobile = "شماره همراه وارد شده نامعتبر است (مانند: 09123456789).";
    }

    if (!adminPersonnelCode.trim()) {
      errors.personnelCode = "کد ملی یا کد پرسنلی الزامی است.";
    } else if (adminPersonnelCode.trim().length < 4) {
      errors.personnelCode = "کد باید حداقل ۴ رقم باشد.";
    }

    if (!adminReason.trim()) {
      errors.reason = "علت ورود به بخش مدیریت الزامی است.";
    } else if (adminReason.trim().length < 5) {
      errors.reason = "علت باید حداقل ۵ کاراکتر باشد.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setStep(2);
      showNotification("مشخصات ثبت شد. اکنون کد امنیتی ادمین را وارد نمایید.", "info");
      logEvent("ثبت مشخصات اولیه ورود به ادمین", `کاربر ${adminName} با موبایل ${adminMobile} و کد ${adminPersonnelCode} آماده وارد کردن پین شد.`, "info");
    } else {
      showNotification("لطفاً اطلاعات هویتی را با دقت تکمیل کنید.", "warning");
    }
  };

  const handleVerify = (pinToTest?: string) => {
    const code = pinToTest !== undefined ? pinToTest : enteredPin;
    if (code.trim() === adminMasterPin) {
      setEnteredPin("");
      setPinError("");
      onSuccess();
      showNotification("کد اختصاصی ادمین با موفقیت تأیید شد. خوش آمدید.", "success");
      logEvent(
        "ورود موفق به ادمین", 
        `مدیر سیستم [نام: ${adminName} | شماره همراه: ${adminMobile} | کد پرسنلی: ${adminPersonnelCode} | علت دسترسی: ${adminReason}] با کد اختصاصی وارد پنل شد.`, 
        "auth"
      );
      // Reset forms
      setStep(1);
      setAdminName("");
      setAdminMobile("");
      setAdminPersonnelCode("");
      setAdminReason("");
    } else {
      setPinError("کد اختصاصی نادرست است. لطفاً مجدداً بررسی کنید.");
      showNotification("کد اختصاصی ادمین اشتباه است.", "error");
      logEvent(
        "خطای کد اختصاصی ادمین", 
        `تلاش ناموفق جهت ورود به ادمین توسط [نام: ${adminName} | همراه: ${adminMobile} | کد: ${adminPersonnelCode}] با پین اشتباه`, 
        "warning"
      );
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-950/75 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      ></div>

      <div className={`relative w-full max-w-lg rounded-3xl shadow-2xl flex flex-col overflow-hidden font-sans transition-all duration-300 border animate-in zoom-in-95 duration-200 ${
        isDarkMode ? "bg-[#0b1120] border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
      }`} dir="rtl">
        
        {/* Header */}
        <div className={`flex items-center justify-between p-5 border-b ${
          isDarkMode ? "border-slate-800/80 bg-slate-900/50" : "border-slate-100 bg-slate-50"
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold font-sans">تأیید هویت و کنترل دسترسی ادمین (۲ مرحله‌ای)</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">منطقه حفاظت شده مدیر ارشد کل سیستم</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Steps indicator */}
        <div className={`px-6 py-3 border-b flex items-center justify-between text-[11px] font-bold ${
          isDarkMode ? "bg-slate-950/40 border-slate-800/60" : "bg-slate-50/50 border-slate-100"
        }`}>
          <div className="flex items-center gap-1.5">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
              step === 1 
                ? "bg-indigo-600 text-white" 
                : "bg-emerald-600 text-white"
            }`}>
              {step === 2 ? "✓" : "۱"}
            </span>
            <span className={step === 1 ? "text-indigo-500 font-extrabold" : "text-slate-400"}>ثبت مشخصات و اطلاعات هویتی</span>
          </div>
          <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1 mx-3" />
          <div className="flex items-center gap-1.5">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
              step === 2 
                ? "bg-indigo-600 text-white" 
                : "bg-slate-200 dark:bg-slate-800 text-slate-500"
            }`}>
              ۲
            </span>
            <span className={step === 2 ? "text-indigo-500 font-extrabold" : "text-slate-400"}>تأیید پین اختصاصی ادمین</span>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col">
          {step === 1 ? (
            /* STEP 1: SPECIFICATIONS FORM */
            <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-200">
              <div className="text-center mb-2">
                <h4 className="text-sm font-bold">ورود مشخصات ممیز / ناظر ارشد</h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  جهت ورود به بخش مدیریت، ثبت مشخصات هویتی و علت دسترسی جهت ذخیره در سیاهه رویدادهای سیستم (Audit Logs) الزامی است.
                </p>
              </div>

              {/* Full Name */}
              <div className="space-y-1.5 text-right">
                <label className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-500" />
                  <span>نام و نام خانوادگی ممیز</span>
                </label>
                <input
                  type="text"
                  value={adminName}
                  onChange={(e) => {
                    setAdminName(e.target.value);
                    if (formErrors.name) setFormErrors(prev => ({ ...prev, name: "" }));
                  }}
                  placeholder="مثال: علی زره‌ساز"
                  className={`w-full p-2.5 rounded-xl text-xs border outline-none transition-all ${
                    formErrors.name
                      ? "border-rose-500 bg-rose-500/5 text-rose-500"
                      : isDarkMode
                      ? "bg-slate-900 border-slate-700 text-white focus:border-indigo-500"
                      : "bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500"
                  }`}
                  autoFocus
                />
                {formErrors.name && (
                  <p className="text-[9px] text-rose-500 font-bold flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{formErrors.name}</span>
                  </p>
                )}
              </div>

              {/* Mobile and Personnel Code Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Mobile Number */}
                <div className="space-y-1.5 text-right">
                  <label className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-indigo-500" />
                    <span>شماره تلفن همراه</span>
                  </label>
                  <input
                    type="text"
                    value={adminMobile}
                    onChange={(e) => {
                      setAdminMobile(e.target.value);
                      if (formErrors.mobile) setFormErrors(prev => ({ ...prev, mobile: "" }));
                    }}
                    placeholder="مثال: 09123456789"
                    className={`w-full p-2.5 rounded-xl text-xs border outline-none text-left font-mono transition-all ${
                      formErrors.mobile
                        ? "border-rose-500 bg-rose-500/5 text-rose-500"
                        : isDarkMode
                        ? "bg-slate-900 border-slate-700 text-white focus:border-indigo-500"
                        : "bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500"
                    }`}
                  />
                  {formErrors.mobile && (
                    <p className="text-[9px] text-rose-500 font-bold flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{formErrors.mobile}</span>
                    </p>
                  )}
                </div>

                {/* Personnel Code / National ID */}
                <div className="space-y-1.5 text-right">
                  <label className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-500" />
                    <span>کد ملی یا کد پرسنلی</span>
                  </label>
                  <input
                    type="text"
                    value={adminPersonnelCode}
                    onChange={(e) => {
                      setAdminPersonnelCode(e.target.value);
                      if (formErrors.personnelCode) setFormErrors(prev => ({ ...prev, personnelCode: "" }));
                    }}
                    placeholder="مثال: 0021458963"
                    className={`w-full p-2.5 rounded-xl text-xs border outline-none text-left font-mono transition-all ${
                      formErrors.personnelCode
                        ? "border-rose-500 bg-rose-500/5 text-rose-500"
                        : isDarkMode
                        ? "bg-slate-900 border-slate-700 text-white focus:border-indigo-500"
                        : "bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500"
                    }`}
                  />
                  {formErrors.personnelCode && (
                    <p className="text-[9px] text-rose-500 font-bold flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{formErrors.personnelCode}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Reason for Access */}
              <div className="space-y-1.5 text-right">
                <label className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
                  <span>علت و شرح نیاز به دسترسی مدیریت</span>
                </label>
                <textarea
                  value={adminReason}
                  onChange={(e) => {
                    setAdminReason(e.target.value);
                    if (formErrors.reason) setFormErrors(prev => ({ ...prev, reason: "" }));
                  }}
                  placeholder="مثال: ممیزی دوره‌ای فاکتورها، ویرایش تراکنش‌های شرکت مهرآیین، مدیریت دسترسی کاربران"
                  rows={2}
                  className={`w-full p-2.5 rounded-xl text-xs border outline-none resize-none transition-all ${
                    formErrors.reason
                      ? "border-rose-500 bg-rose-500/5 text-rose-500"
                      : isDarkMode
                      ? "bg-slate-900 border-slate-700 text-white focus:border-indigo-500"
                      : "bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500"
                  }`}
                />
                {formErrors.reason && (
                  <p className="text-[9px] text-rose-500 font-bold flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{formErrors.reason}</span>
                  </p>
                )}
              </div>

              {/* Step 1 Footer */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <p className={`text-[9.5px] leading-relaxed max-w-[60%] ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
                  این سامانه مجهز به سیستم بازرسی هوشمند است. اطلاعات وارد شده ذخیره و پیگرد خواهد شد.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className={`px-4 py-2.5 text-xs font-bold rounded-xl border transition-colors ${
                      isDarkMode ? "border-slate-800 text-slate-400 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    انصراف
                  </button>
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>ادامه مرحله بعد</span>
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* STEP 2: PIN CODE KEYPAD */
            <div className="flex flex-col items-center text-center animate-in fade-in slide-in-from-right-4 duration-200">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 mb-4 shadow-inner">
                <KeyRound className="h-7 w-7 animate-pulse" />
              </div>

              <h4 className="text-sm font-bold mb-1">ورود کد اختصاصی ادمین</h4>
              <p className="text-[11px] text-slate-400 max-w-xs leading-relaxed mb-4">
                جناب <strong className="text-indigo-400 font-black">{adminName}</strong>، جهت تأیید و ورود به پنل، کد امنیت اختصاصی را وارد نمایید.
              </p>

              {/* Password Input Field */}
              <div className="w-full max-w-xs relative mb-4">
                <input
                  type={showPinText ? "text" : "password"}
                  value={enteredPin}
                  onChange={(e) => {
                    setEnteredPin(e.target.value);
                    setPinError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleVerify();
                  }}
                  placeholder="کد اختصاصی (مثلاً 7788)"
                  className={`w-full py-3 px-4 text-center font-mono font-bold text-lg tracking-widest rounded-2xl border transition-all outline-none ${
                    pinError
                      ? "border-rose-500 bg-rose-500/10 text-rose-500"
                      : isDarkMode
                      ? "bg-slate-900 border-slate-700 text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      : "bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  }`}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPinText(!showPinText)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-200"
                >
                  {showPinText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Touch Keypad */}
              <div className="grid grid-cols-3 gap-2 w-full max-w-xs mb-4" dir="ltr">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "⌫"].map((btn) => (
                  <button
                    key={btn}
                    type="button"
                    onClick={() => {
                      setPinError("");
                      if (btn === "C") {
                        setEnteredPin("");
                      } else if (btn === "⌫") {
                        setEnteredPin(prev => prev.slice(0, -1));
                      } else {
                        setEnteredPin(prev => prev + btn);
                      }
                    }}
                    className={`py-2.5 rounded-xl font-mono text-sm font-bold border transition-all active:scale-95 ${
                      btn === "C"
                        ? "bg-rose-500/10 border-rose-500/20 text-rose-500 hover:bg-rose-500/20"
                        : btn === "⌫"
                        ? "bg-amber-500/10 border-amber-500/20 text-amber-500 hover:bg-amber-500/20"
                        : isDarkMode
                        ? "bg-slate-900/80 border-slate-800 text-slate-200 hover:bg-slate-800"
                        : "bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200"
                    }`}
                  >
                    {btn}
                  </button>
                ))}
              </div>

              {pinError && (
                <div className="mb-4 text-xs text-rose-500 font-bold flex items-center gap-1.5 animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{pinError}</span>
                </div>
              )}

              {/* Preset helper info badge */}
              <div className={`w-full py-2.5 px-3 rounded-xl border text-[10px] font-bold flex items-center justify-between gap-2 mb-5 ${
                isDarkMode ? "bg-indigo-950/30 border-indigo-900/50 text-indigo-300" : "bg-indigo-50 border-indigo-100 text-indigo-700"
              }`}>
                <span>کد اختصاصی پیش‌فرض ادمین: <strong className="font-mono text-xs">{adminMasterPin}</strong></span>
                <button
                  type="button"
                  onClick={() => {
                    setEnteredPin(adminMasterPin);
                    setPinError("");
                  }}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-[9px] hover:bg-indigo-700 transition shadow-sm cursor-pointer"
                >
                  درج خودکار
                </button>
              </div>

              {/* Action Buttons */}
              <div className="w-full flex gap-2">
                <button
                  type="button"
                  onClick={() => handleVerify()}
                  className="flex-1 py-3 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  تأیید و ورود به پنل
                </button>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className={`px-4 py-3 text-xs font-bold rounded-xl border transition-colors flex items-center gap-1 ${
                    isDarkMode ? "border-slate-800 text-slate-400 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>برگشت</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPinModal;

