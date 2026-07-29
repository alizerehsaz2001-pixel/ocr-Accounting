import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Zap, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  X, 
  Minimize2, 
  Maximize2, 
  FileText, 
  Loader2,
  Sparkles,
  Eye,
  Check,
  Layers,
  StopCircle
} from "lucide-react";

export interface BatchOCRProgressItem {
  id: string;
  scanId?: string;
  name: string;
  size: number;
  preview: string;
  mimeType: string;
  base64: string;
  status: "queued" | "processing" | "retrying" | "success" | "error";
  attempt: number;
  statusMessage: string;
  extractedCount?: number;
  errorMessage?: string;
  startTime: number;
  endTime?: number;
  folder?: string;
}

interface BatchOCRProgressPanelProps {
  isOpen: boolean;
  isMinimized: boolean;
  onToggleMinimize: () => void;
  onClose: () => void;
  onCancelBatch: () => void;
  items: BatchOCRProgressItem[];
  isDarkMode: boolean;
  onViewScan?: (scanId: string) => void;
}

export const BatchOCRProgressPanel: React.FC<BatchOCRProgressPanelProps> = ({
  isOpen,
  isMinimized,
  onToggleMinimize,
  onClose,
  onCancelBatch,
  items,
  isDarkMode,
  onViewScan
}) => {
  if (!isOpen || items.length === 0) return null;

  const totalCount = items.length;
  const successCount = items.filter(i => i.status === "success").length;
  const retryingCount = items.filter(i => i.status === "retrying").length;
  const processingCount = items.filter(i => i.status === "processing").length;
  const queuedCount = items.filter(i => i.status === "queued").length;
  const errorCount = items.filter(i => i.status === "error").length;

  const totalExtractedRows = items.reduce((sum, i) => sum + (i.extractedCount || 0), 0);
  const activeCount = processingCount + retryingCount;
  const isFinished = activeCount === 0 && queuedCount === 0;

  const progressPercent = totalCount > 0 ? Math.round(((successCount + errorCount) / totalCount) * 100) : 0;

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  // Minimized Widget Bar
  if (isMinimized) {
    return (
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        className={`fixed bottom-6 left-6 z-50 p-3.5 rounded-2xl shadow-2xl border backdrop-blur-xl flex items-center gap-4 ${
          isDarkMode 
            ? "bg-slate-900/95 border-indigo-500/40 text-slate-100" 
            : "bg-white/95 border-indigo-200 text-slate-800"
        }`}
      >
        <div className="relative flex items-center justify-center">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md">
            {activeCount > 0 ? (
              <Zap className="w-5 h-5 text-amber-300 animate-pulse" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-300" />
            )}
          </div>
          {activeCount > 0 && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-ping"></span>
          )}
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black">پردازش موازی اسناد</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-400">
              {successCount}/{totalCount}
            </span>
          </div>
          <span className="text-[10px] text-slate-400">
            {activeCount > 0 
              ? `${activeCount.toLocaleString("fa-IR")} سند در حال تحلیل / تلاش مجدد...`
              : "تمام اسناد پردازش شدند"}
          </span>
        </div>

        <div className="w-20 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500" 
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex items-center gap-1">
          <button 
            onClick={onToggleMinimize}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="بزرگنمایی پنل"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
            title="بستن"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    );
  }

  // Expanded Overlay / Embedded Panel
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: 10 }}
      className={`w-full my-6 rounded-3xl border shadow-2xl overflow-hidden backdrop-blur-xl transition-all ${
        isDarkMode
          ? "bg-slate-900/95 border-indigo-500/30 text-slate-100"
          : "bg-white/95 border-indigo-200 text-slate-900"
      }`}
    >
      {/* Header Bar */}
      <div className={`p-4 sm:p-5 border-b flex flex-wrap items-center justify-between gap-3 ${
        isDarkMode ? "border-slate-800 bg-slate-800/40" : "border-slate-100 bg-slate-50/70"
      }`}>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-500/20 flex items-center justify-center">
            <Zap className="w-6 h-6 text-amber-300 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-black">
                پردازش موازی و استخراج هوشمند اسناد (Gemini OCR)
              </h3>
              {activeCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping"></span>
                  در حال استخراج موازی
                </span>
              )}
              {isFinished && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  تکمیل شد
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              درخواست‌ها به صورت همزمان ارسال شده و در صورت بروز تراکم ترافیک، به صورت خودکار تا دریافت پاسخ موفق تلاش مجدد می‌نمایند.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {!isFinished && (
            <button
              onClick={onCancelBatch}
              className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-black transition-all flex items-center gap-1.5 active:scale-95"
            >
              <StopCircle className="w-3.5 h-3.5" />
              <span>لغو پردازش</span>
            </button>
          )}

          <button
            onClick={onToggleMinimize}
            className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="کوچک‌سازی پنل"
          >
            <Minimize2 className="w-4 h-4" />
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="بستن"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress & Summary Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-800/40 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className={`p-3 rounded-2xl border flex items-center gap-3 ${
            isDarkMode ? "bg-slate-800/50 border-slate-700/60" : "bg-slate-50 border-slate-200"
          }`}>
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">کل اسناد صف</span>
              <span className="text-sm font-black">{totalCount.toLocaleString("fa-IR")} سند</span>
            </div>
          </div>

          <div className={`p-3 rounded-2xl border flex items-center gap-3 ${
            isDarkMode ? "bg-slate-800/50 border-slate-700/60" : "bg-slate-50 border-slate-200"
          }`}>
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">استخراج موفق</span>
              <span className="text-sm font-black text-emerald-500">{successCount.toLocaleString("fa-IR")} سند</span>
            </div>
          </div>

          <div className={`p-3 rounded-2xl border flex items-center gap-3 ${
            isDarkMode ? "bg-slate-800/50 border-slate-700/60" : "bg-slate-50 border-slate-200"
          }`}>
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <RefreshCw className="w-4 h-4 animate-spin" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">در حال تلاش مجدد</span>
              <span className="text-sm font-black text-amber-500">{retryingCount.toLocaleString("fa-IR")} سند</span>
            </div>
          </div>

          <div className={`p-3 rounded-2xl border flex items-center gap-3 ${
            isDarkMode ? "bg-slate-800/50 border-slate-700/60" : "bg-slate-50 border-slate-200"
          }`}>
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">مجموع داده‌های استخراجی</span>
              <span className="text-sm font-black text-indigo-400">{totalExtractedRows.toLocaleString("fa-IR")} ردیف</span>
            </div>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5 font-bold">
            <span className="text-slate-400">پیشرفت کلی عملیات استخراج</span>
            <span className="text-indigo-400">{progressPercent}%</span>
          </div>
          <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.4 }}
              className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Item Progress Cards */}
      <div className="p-4 sm:p-5 max-h-[420px] overflow-y-auto custom-scrollbar space-y-3">
        <AnimatePresence>
          {items.map((item) => {
            const isProcessing = item.status === "processing";
            const isRetrying = item.status === "retrying";
            const isSuccess = item.status === "success";
            const isError = item.status === "error";

            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`p-3.5 rounded-2xl border transition-all ${
                  isSuccess
                    ? isDarkMode ? "bg-emerald-950/20 border-emerald-500/30" : "bg-emerald-50/70 border-emerald-200"
                    : isRetrying
                    ? isDarkMode ? "bg-amber-950/30 border-amber-500/40" : "bg-amber-50/80 border-amber-200"
                    : isProcessing
                    ? isDarkMode ? "bg-blue-950/30 border-blue-500/40" : "bg-blue-50/80 border-blue-200"
                    : isDarkMode ? "bg-slate-800/40 border-slate-700/50" : "bg-slate-50 border-slate-200"
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  {/* Left info: Preview + Name */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0 border border-slate-700/50 bg-slate-800 flex items-center justify-center">
                      {item.preview ? (
                        <img src={item.preview} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <FileText className="w-5 h-5 text-slate-400" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold truncate max-w-[200px] sm:max-w-[260px]">
                          {item.name}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          ({formatFileSize(item.size)})
                        </span>
                        {item.folder && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            {item.folder}
                          </span>
                        )}
                      </div>

                      {/* Status message */}
                      <p className={`text-[11px] font-medium mt-0.5 ${
                        isSuccess ? "text-emerald-500" : isRetrying ? "text-amber-500" : isProcessing ? "text-blue-400" : "text-slate-400"
                      }`}>
                        {item.statusMessage}
                      </p>
                    </div>
                  </div>

                  {/* Right info: Status Badge + Extracted Rows */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {isProcessing && (
                      <div className="px-3 py-1 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] font-black flex items-center gap-1.5">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>در حال استخراج موازی</span>
                      </div>
                    )}

                    {isRetrying && (
                      <div className="px-3 py-1 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[10px] font-black flex items-center gap-1.5 animate-pulse">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>تلاش مجدد (تلاش {item.attempt})</span>
                      </div>
                    )}

                    {isSuccess && (
                      <div className="flex items-center gap-2">
                        <div className="px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-black flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>تکمیل شد ({item.extractedCount?.toLocaleString("fa-IR") || 0} ردیف)</span>
                        </div>
                        {onViewScan && item.scanId && (
                          <button
                            onClick={() => onViewScan(item.scanId!)}
                            className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 transition-colors"
                            title="مشاهده اطلاعات سند"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}

                    {isError && (
                      <div className="px-3 py-1 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] font-black flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>خطا / لغو شده</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom line pulse during active state */}
                {(isProcessing || isRetrying) && (
                  <div className="mt-2.5 w-full h-1 bg-slate-700/30 rounded-full overflow-hidden">
                    <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-shimmer" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
