import React from "react";
import { 
  X, 
  Settings, 
  UploadCloud, 
  Cpu, 
  Database, 
  Shield, 
  FileEdit, 
  Sparkles, 
  BookOpen, 
  FileText, 
  CheckCircle,
  AlertCircle,
  Code
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  erpDestinationModule: string;
  setErpDestinationModule: (module: string) => void;
  strictnessMode: "balanced" | "speed" | "audit";
  setStrictnessMode: (mode: "balanced" | "speed" | "audit") => void;
  customPrompt: string;
  setCustomPrompt: (prompt: string) => void;
  pendingFile: {
    base64: string;
    name: string;
    mimeType: string;
    size: number;
  } | null;
  setPendingFile: (file: any) => void;
  onUploadClick: () => void;
  handleDirectExtraction: () => void;
  isExtracting: boolean;
  isAiUnderstandingConfirmed?: boolean;
}

export default function AiSettingsModal({
  isOpen,
  onClose,
  isDarkMode,
  selectedModel,
  setSelectedModel,
  erpDestinationModule,
  setErpDestinationModule,
  strictnessMode,
  setStrictnessMode,
  customPrompt,
  setCustomPrompt,
  pendingFile,
  setPendingFile,
  onUploadClick,
  handleDirectExtraction,
  isExtracting,
  isAiUnderstandingConfirmed = false,
}: AiSettingsModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" dir="rtl">
        {/* Backdrop overlay with blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`absolute inset-0 backdrop-blur-sm ${isDarkMode ? "bg-slate-950/80" : "bg-slate-900/40"}`}
          onClick={onClose}
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl border flex flex-col ${
            isDarkMode 
              ? "bg-slate-900/95 border-slate-800 text-slate-100 shadow-[0_25px_60px_rgba(0,0,0,0.5)]" 
              : "bg-white border-slate-200 text-slate-800 shadow-[0_25px_60px_rgba(15,23,42,0.08)]"
          } backdrop-blur-md`}
        >
          {/* Header */}
          <div className={`sticky top-0 z-10 flex items-center justify-between p-4 md:p-5 border-b backdrop-blur-md ${
            isDarkMode ? "bg-slate-900/90 border-slate-800/80" : "bg-white/90 border-slate-100"
          }`}>
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl flex items-center justify-center ${
                isDarkMode ? "bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/15" : "bg-fuchsia-50 text-fuchsia-600 border border-fuchsia-100"
              }`}>
                <Settings className="w-5 h-5 animate-spin-slow" />
              </div>
              <div className="text-right">
                <h2 className={`font-black text-[15px] tracking-tight ${isDarkMode ? "text-slate-100" : "text-slate-800"}`}>
                  تنظیمات هوش مصنوعی و راهنمای استخراج
                </h2>
                <p className={`text-[10.5px] mt-0.5 leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                  پیکربندی هوشمند مدل پردازشگر، نحوه استخراج اسناد مالی و آپلود مستقیم
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition-all border ${
                isDarkMode 
                  ? "bg-slate-800/40 border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white" 
                  : "bg-slate-50 border-slate-200/60 hover:bg-slate-100 text-slate-500 hover:text-slate-900"
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 md:p-6 flex flex-col gap-6">
            
            {/* Direct Upload Box */}
            <div className="flex flex-col gap-2">
              <label className={`text-[12px] font-black flex items-center gap-1.5 ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>
                <UploadCloud className="w-4 h-4 text-blue-500 shrink-0" />
                بارگذاری و آپلود مستقیم سند مالی:
              </label>
              
              {pendingFile ? (
                /* Pending file preview inside modal */
                <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all ${
                  isDarkMode ? "bg-slate-950/40 border-slate-800/80" : "bg-slate-50 border-slate-250/50"
                }`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isDarkMode ? "bg-blue-500/10 text-blue-400" : "bg-blue-50 text-blue-600"
                    }`}>
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 text-right">
                      <p className={`text-[11px] font-black truncate max-w-[220px] sm:max-w-[340px] ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>
                        {pendingFile.name}
                      </p>
                      <p className={`text-[9px] font-mono mt-0.5 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
                        {Math.round(pendingFile.size / 1024)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setPendingFile(null)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${
                      isDarkMode 
                        ? "bg-rose-950/20 border-rose-900/50 text-rose-400 hover:bg-rose-950/40" 
                        : "bg-rose-50 border-rose-100 text-rose-600 hover:bg-rose-100/60"
                    }`}
                  >
                    حذف فایل
                  </button>
                </div>
              ) : (
                /* Clickable Upload Dropzone */
                <div 
                  onClick={onUploadClick}
                  className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer overflow-hidden transition-all duration-300 group ${
                    isDarkMode
                      ? "border-slate-800 bg-slate-950/20 hover:bg-slate-800/40 hover:border-blue-500/50"
                      : "border-slate-300 bg-slate-50 hover:bg-slate-100/80 hover:border-blue-500/40"
                  }`}
                >
                  <div className={`p-3 rounded-2xl mb-3 transition-all group-hover:-translate-y-1 ${
                    isDarkMode ? "bg-slate-900 text-slate-300 border border-slate-800" : "bg-white shadow-sm text-slate-600 border border-slate-150"
                  }`}>
                    <UploadCloud className="w-6 h-6 text-blue-500" />
                  </div>
                  <p className={`text-[11.5px] font-black ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                    برای آپلود مستقیم تصویر یا PDF کلیک کنید
                  </p>
                  <p className={`text-[9.5px] mt-1 leading-relaxed ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
                    فایل مورد نظر شما پس از آپلود، بلافاصله آماده تفکیک و ممیزی خواهد شد
                  </p>
                </div>
              )}
            </div>

            {/* Guide Area */}
            <div className={`p-4 rounded-2xl border ${
              isDarkMode ? "bg-slate-950/40 border-slate-800" : "bg-blue-50/20 border-blue-100"
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-4 h-4 text-blue-500" />
                <span className={`text-[11.5px] font-black ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>
                  چک‌لیست عکاسی برای استخراج دقیق:
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { title: "📐 بدون زاویه و مستقیم", desc: "سند را کاملاً تخت قرار دهید و دوربین را دقیقاً از بالا بگیرید." },
                  { title: "☀️ نورپردازی یکنواخت", desc: "از عکاسی زیر نور مستقیم شدید یا سایه خودداری کنید." },
                  { title: "✏️ ممیزی عمیق", desc: "برای پردازش برگه‌های خط‌خورده ممیزی سخت‌گیرانه را فعال کنید." },
                  { title: "📄 تجمیع اسناد", desc: "فاکتور و فیش واریزی آن را می‌توان همزمان آپلود کرد." }
                ].map((step, idx) => (
                  <div key={idx} className={`p-2.5 rounded-xl border ${
                    isDarkMode ? "bg-slate-900/60 border-slate-800/80" : "bg-white border-slate-150 shadow-sm"
                  }`}>
                    <h6 className={`text-[9.5px] font-extrabold ${isDarkMode ? "text-slate-200" : "text-slate-800"} mb-1`}>
                      {step.title}
                    </h6>
                    <p className={`text-[8.5px] leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                      {step.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Configs Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* AI Model Select */}
              <div className="flex flex-col gap-2">
                <label className={`text-[11.5px] font-black flex items-center gap-1.5 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                  <Cpu className="w-3.5 h-3.5 text-blue-500" /> 
                  مغز پردازشگر هوش مصنوعی (مدل):
                </label>
                <select 
                   value={selectedModel}
                   onChange={(e) => setSelectedModel(e.target.value)}
                   className={`w-full p-2.5 rounded-xl border text-[11px] font-bold outline-none cursor-pointer transition-all ${
                     isDarkMode 
                       ? "bg-slate-950 border-slate-800 text-slate-200 focus:border-blue-500/40" 
                       : "bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500/40"
                   }`}
                >
                   <option value="gemini-3.6-flash">Gemini 3.6 Flash (آخرین نسخه - سریع و هوشمند)</option>
                </select>
              </div>

              {/* Destination ERP Module */}
              <div className="flex flex-col gap-2">
                <label className={`text-[11.5px] font-black flex items-center gap-1.5 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                  <Database className="w-3.5 h-3.5 text-emerald-500" /> 
                  ماژول مقصد در نرم‌افزار مالی:
                </label>
                <select 
                   value={erpDestinationModule}
                   onChange={(e) => setErpDestinationModule(e.target.value)}
                   className={`w-full p-2.5 rounded-xl border text-[11px] font-bold outline-none cursor-pointer transition-all ${
                     isDarkMode 
                       ? "bg-slate-950 border-slate-800 text-slate-200 focus:border-blue-500/40" 
                       : "bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500/40"
                   }`}
                >
                   <option value="general-ledger">دفتر کل (General Ledger)</option>
                   <option value="accounts-payable">حساب‌های پرداختی (AP)</option>
                   <option value="accounts-receivable">حساب‌های دریافتی (AR)</option>
                   <option value="inventory">انبار و کالا (Inventory)</option>
                </select>
              </div>

              {/* Strictness Level */}
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className={`text-[11.5px] font-black flex items-center gap-1.5 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                  <Shield className="w-3.5 h-3.5 text-indigo-500" /> 
                  سطح دقت و سخت‌گیری ممیزی:
                </label>
                <select 
                   value={strictnessMode}
                   onChange={(e) => setStrictnessMode(e.target.value as any)}
                   className={`w-full p-2.5 rounded-xl border text-[11px] font-bold outline-none cursor-pointer transition-all ${
                     isDarkMode 
                       ? "bg-slate-950 border-slate-800 text-slate-200 focus:border-blue-500/40" 
                       : "bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500/40"
                   }`}
                >
                   <option value="speed">حالت سریع و فوری (Fast)</option>
                   <option value="balanced">حالت متعادل و خودکار (Balanced)</option>
                   <option value="audit">ممیزی موشکافانه و سخت‌گیرانه (Strict Audit)</option>
                </select>
              </div>

              {/* Custom Prompt */}
              <div className="flex flex-col gap-2 md:col-span-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <label className={`text-[11.5px] font-black flex items-center gap-1.5 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                    <FileEdit className="w-3.5 h-3.5 text-purple-500" /> 
                    پرامپت و دستورالعمل استخراج سفارشی (تنظیمات سند):
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const jsonInstruction = "لطفاً تمامی اطلاعات کلیدی، اقلام تراکنش، مبالغ، مالیات، عوارض، شناسه مودیان و کدهای اختصاصی این سند را به صورت مستقیم در قالب آرایه ساختاریافته استاندارد JSON با عناوین و کلیدهای فارسی استخراج و تنظیم کنید.";
                      setCustomPrompt(customPrompt.trim() ? `${customPrompt.trim()}\n${jsonInstruction}` : jsonInstruction);
                    }}
                    className={`px-2 py-1 rounded-lg text-[9.5px] font-black flex items-center gap-1 transition-all border ${
                      isDarkMode 
                        ? "bg-purple-500/10 border-purple-500/30 text-purple-300 hover:bg-purple-500/20" 
                        : "bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
                    } cursor-pointer`}
                    title="افزودن دستور استخراج مستقیم به فرمت آرایه استاندارد JSON"
                  >
                    <Code className="w-3 h-3 text-purple-500" />
                    <span>⚡ تنظیم خروجی مستقیم JSON</span>
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="مثال: اقلام فاکتور حتماً به همراه تخفیف نهایی استخراج شوند..."
                  className={`w-full p-2.5 rounded-xl border text-[11px] outline-none resize-none transition-all ${
                    isDarkMode 
                      ? "bg-slate-950 border-slate-800 text-slate-200 focus:border-blue-500/40" 
                      : "bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500/40"
                  }`}
                />
              </div>

            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-between gap-3 mt-4 pt-4 border-t border-slate-150 dark:border-slate-800/60">
              <button
                onClick={onClose}
                className={`px-4 py-2.5 rounded-xl text-[11px] font-bold transition-all border cursor-pointer ${
                  isDarkMode 
                    ? "bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300" 
                    : "bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-600"
                }`}
              >
                بستن تنظیمات
              </button>

              {pendingFile && (
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <button
                    onClick={() => {
                      const jsonInstruction = "لطفاً تمامی اطلاعات کلیدی، اقلام تراکنش، مبالغ، مالیات، عوارض، شناسه مودیان و کدهای اختصاصی این سند را به صورت مستقیم در قالب آرایه ساختاریافته استاندارد JSON با عناوین و کلیدهای فارسی استخراج و تنظیم کنید.";
                      setCustomPrompt(customPrompt.trim() ? `${customPrompt.trim()}\n${jsonInstruction}` : jsonInstruction);
                      onClose();
                      handleDirectExtraction();
                    }}
                    className="px-4 py-2.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md transition-all cursor-pointer hover:-translate-y-0.5"
                    title="استخراج و تنظیم مستقیم داده‌های سند به ساختار JSON"
                  >
                    <Code className="w-3.5 h-3.5 text-purple-200 shrink-0" />
                    <span>⚡ استخراج و تبدیل مستقیم به JSON</span>
                  </button>

                  <div className="flex flex-col items-end gap-1">
                    <button
                      onClick={() => {
                        if (!isAiUnderstandingConfirmed) {
                          handleDirectExtraction(); // This will trigger the standard warning toast
                          return;
                        }
                        onClose();
                        handleDirectExtraction();
                      }}
                      className={`px-5 py-2.5 rounded-xl text-[11px] font-bold flex items-center gap-2 transition-all shadow-md cursor-pointer hover:-translate-y-0.5 active:translate-y-0 ${
                        isAiUnderstandingConfirmed 
                          ? "bg-emerald-600 hover:bg-emerald-500 text-white" 
                          : "bg-slate-300 dark:bg-slate-800 text-slate-500 dark:text-slate-500 opacity-60 cursor-not-allowed"
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-200 animate-pulse shrink-0" />
                      <span>شروع استخراج هوشمند</span>
                    </button>
                    {!isAiUnderstandingConfirmed && (
                      <span className="text-[8.5px] font-black text-amber-500">
                        ⚠️ نیاز به تاییدیه تفهیم نهایی در پنل اصلی
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
