import React, { useState } from "react";
import { ShieldAlert, KeyRound, Lock, X, AlertCircle, Eye, EyeOff } from "lucide-react";

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
  const [enteredPin, setEnteredPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [showPinText, setShowPinText] = useState(false);

  if (!isOpen) return null;

  const handleVerify = (pinToTest?: string) => {
    const code = pinToTest !== undefined ? pinToTest : enteredPin;
    if (code.trim() === adminMasterPin) {
      setEnteredPin("");
      setPinError("");
      onSuccess();
      showNotification("کد اختصاصی ادمین تأیید شد. خوش آمدید.", "success");
      logEvent("ورود موفق به ادمین", "مدیر سیستم با کد اختصاصی وارد پنل مدیریت شد.", "auth");
    } else {
      setPinError("کد اختصاصی نادرست است. لطفاً مجدداً بررسی کنید.");
      showNotification("کد اختصاصی ادمین اشتباه است.", "error");
      logEvent("خطای کد اختصاصی ادمین", "تلاش ناموفق برای احراز هویت ادمین با کد اشتباه", "warning");
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-950/75 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      ></div>

      <div className={`relative w-full max-w-md rounded-3xl shadow-2xl flex flex-col overflow-hidden font-sans transition-all duration-300 border animate-in zoom-in-95 duration-200 ${
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
              <h3 className="text-xs font-bold font-sans">تأیید کد اختصاصی مدیریت (Admin PIN)</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">منطقه حفاظت شده مدیر ارشد سیستم</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 mb-4 shadow-inner">
            <KeyRound className="h-7 w-7 animate-pulse" />
          </div>

          <h4 className="text-sm font-bold mb-1">ورود کد اختصاصی ادمین</h4>
          <p className="text-[11px] text-slate-400 max-w-xs leading-relaxed mb-5">
            جهت دسترسی به تنظیمات ارشد سیستم، کد اختصاصی امنیت را وارد نمایید.
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
              onClick={onClose}
              className={`px-4 py-3 text-xs font-bold rounded-xl border transition-colors ${
                isDarkMode ? "border-slate-800 text-slate-400 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              انصراف
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPinModal;
