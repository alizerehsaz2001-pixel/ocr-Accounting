import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Zap, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Minimize2, 
  Maximize2, 
  FileText, 
  Loader2,
  Sparkles,
  Eye,
  Check,
  StopCircle,
  ShieldCheck,
  Cpu,
  Clock,
  ChevronDown,
  ChevronUp,
  Search,
  Download,
  Copy,
  Activity
} from "lucide-react";
import * as XLSX from "xlsx";

export interface BatchOCRProgressItem {
  id: string;
  scanId?: string;
  name: string;
  size: number;
  preview: string;
  mimeType: string;
  base64: string;
  status: "queued" | "processing" | "retrying" | "success" | "error";
  stage?: "queued" | "analyzing_layout" | "extracting_fields" | "verifying_math" | "saving" | "completed";
  attempt: number;
  statusMessage: string;
  extractedCount?: number;
  errorMessage?: string;
  startTime: number;
  endTime?: number;
  folder?: string;
  markdownContent?: string;
  modelUsed?: string;
  confidenceScore?: number;
  documentType?: string;
  tokensUsed?: number;
  processingTimeMs?: number;
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
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "success" | "error">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen || items.length === 0) return null;

  const totalCount = items.length;
  const successCount = items.filter(i => i.status === "success").length;
  const retryingCount = items.filter(i => i.status === "retrying").length;
  const processingCount = items.filter(i => i.status === "processing").length;
  const queuedCount = items.filter(i => i.status === "queued").length;
  const errorCount = items.filter(i => i.status === "error").length;

  const totalExtractedRows = items.reduce((sum, i) => sum + (i.extractedCount || 0), 0);
  const totalTokens = items.reduce((sum, i) => sum + (i.tokensUsed || 0), 0);
  const activeCount = processingCount + retryingCount;
  const isFinished = activeCount === 0 && queuedCount === 0;

  const completedWithConfidence = items.filter(i => i.status === "success" && i.confidenceScore !== undefined);
  const avgConfidence = completedWithConfidence.length > 0
    ? Math.round(completedWithConfidence.reduce((acc, i) => acc + (i.confidenceScore || 100), 0) / completedWithConfidence.length)
    : 100;

  const completedWithTime = items.filter(i => i.status === "success" && i.processingTimeMs);
  const avgTimeSeconds = completedWithTime.length > 0
    ? (completedWithTime.reduce((acc, i) => acc + (i.processingTimeMs || 0), 0) / completedWithTime.length / 1000).toFixed(1)
    : null;

  const remainingDocs = queuedCount + activeCount;
  const etaSeconds = avgTimeSeconds && remainingDocs > 0
    ? Math.ceil(parseFloat(avgTimeSeconds) * remainingDocs)
    : null;

  const progressPercent = totalCount > 0 ? Math.round(((successCount + errorCount) / totalCount) * 100) : 0;

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const filteredItems = items.filter(item => {
    const matchesFilter = 
      filterStatus === "all" ? true :
      filterStatus === "active" ? (item.status === "processing" || item.status === "retrying" || item.status === "queued") :
      filterStatus === "success" ? item.status === "success" :
      (item.status === "error");

    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.documentType && item.documentType.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  const handleExportBatchToExcel = () => {
    const successItems = items.filter(i => i.status === "success");
    if (successItems.length === 0) return;

    const exportRows = successItems.map((item, idx) => ({
      "ردیف": idx + 1,
      "نام سند": item.name,
      "نوع سند": item.documentType || "نامشخص",
      "تعداد ردیف مالی": item.extractedCount || 0,
      "ضریب اطمینان (%)": item.confidenceScore || 100,
      "مدل پردازش": item.modelUsed || "Gemini",
      "توکن مصرفی": item.tokensUsed || 0,
      "زمان پردازش (ثانیه)": item.processingTimeMs ? (item.processingTimeMs / 1000).toFixed(1) : "-",
      "وضعیت": "موفق"
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "گزارش پردازش موازی");
    XLSX.writeFile(workbook, `Batch_OCR_Report_${Date.now()}.xlsx`);
  };

  const handleCopyItemDetails = (item: BatchOCRProgressItem) => {
    const text = `نام سند: ${item.name}\nنوع سند: ${item.documentType || "نامشخص"}\nتعداد ردیف: ${item.extractedCount || 0}\nضریب اطمینان: ${item.confidenceScore || 100}%\nزمان پردازش: ${item.processingTimeMs ? (item.processingTimeMs / 1000).toFixed(1) + "s" : "-"}`;
    navigator.clipboard.writeText(text);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // Minimized Widget Bar
  if (isMinimized) {
    return (
      <motion.div 
        initial={{ y: 50, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 50, opacity: 0, scale: 0.9 }}
        className={`fixed bottom-6 left-6 z-50 p-3.5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border backdrop-blur-2xl flex items-center gap-4 transition-colors ${
          isDarkMode 
            ? "bg-slate-900/90 border-indigo-500/30 text-slate-100 shadow-indigo-500/10" 
            : "bg-white/90 border-indigo-200 text-slate-800 shadow-indigo-200/50"
        }`}
      >
        <div className="relative flex items-center justify-center">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-inner ${
            activeCount > 0 
              ? "bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-blue-500/30" 
              : "bg-gradient-to-tr from-emerald-500 to-teal-500 shadow-emerald-500/30"
          }`}>
            {activeCount > 0 ? (
              <Activity className="w-5 h-5 text-white animate-pulse" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-white" />
            )}
          </div>
          {activeCount > 0 && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full animate-ping ring-2 ring-slate-900"></span>
          )}
        </div>

        <div className="flex flex-col min-w-[120px]">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black tracking-tight">پردازش موازی</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
              isFinished 
                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                : "bg-indigo-500/10 text-indigo-500 border-indigo-500/20"
            }`}>
              {successCount}/{totalCount}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium truncate">
            {activeCount > 0 
              ? `${activeCount.toLocaleString("fa-IR")} سند در حال استخراج...`
              : "تمام اسناد پردازش شدند"}
          </span>
        </div>

        <div className="w-24 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden shrink-0">
          <div 
            className={`h-full transition-all duration-500 rounded-full ${
              isFinished ? "bg-emerald-500" : "bg-gradient-to-r from-blue-500 to-indigo-500 relative"
            }`} 
            style={{ width: `${progressPercent}%` }}
          >
             {!isFinished && <div className="absolute inset-0 bg-white/20 animate-shimmer" />}
          </div>
        </div>

        <div className="flex items-center gap-1 border-r border-slate-200 dark:border-slate-700/50 pr-3 ml-1">
          <button 
            onClick={onToggleMinimize}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
            title="بزرگنمایی پنل"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors cursor-pointer"
            title="بستن"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    );
  }

  // Expanded Main Panel
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97, y: 12 }}
      className={`w-full my-6 rounded-3xl border shadow-[0_12px_40px_rgb(0,0,0,0.12)] overflow-hidden backdrop-blur-2xl transition-all ${
        isDarkMode
          ? "bg-slate-900/90 border-indigo-500/20 text-slate-100 shadow-indigo-900/20"
          : "bg-white/90 border-indigo-200 text-slate-900 shadow-indigo-100/50"
      }`}
    >
      {/* Header Bar */}
      <div className={`relative p-5 sm:p-6 border-b flex flex-wrap items-center justify-between gap-4 overflow-hidden ${
        isDarkMode ? "border-slate-800/60 bg-slate-800/30" : "border-slate-100 bg-slate-50/50"
      }`}>
        {/* Subtle background glow */}
        {!isFinished && (
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
        )}
        
        <div className="flex items-center gap-4 z-10">
          <div className="relative">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-colors ${
              isFinished 
                ? "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/20"
                : "bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-600 shadow-indigo-500/30"
            }`}>
              {isFinished ? (
                <CheckCircle2 className="w-6 h-6 text-white" />
              ) : (
                <Activity className="w-6 h-6 text-white animate-pulse" />
              )}
            </div>
            {!isFinished && (
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-blue-500 border-2 border-white dark:border-slate-900"></span>
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="text-base sm:text-lg font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300">
                پردازش موازی اسناد (Gemini OCR)
              </h3>
              
              {activeCount > 0 && (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                  {activeCount} سند فعال
                </span>
              )}
              {isFinished && (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  عملیات تکمیل شد
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              آنالیز همزمان اسناد با استفاده از موتور هوش مصنوعی قدرتمند Gemini برای استخراج حداکثر دقت.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 z-10">
          {successCount > 0 && (
            <button
              onClick={handleExportBatchToExcel}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 active:scale-95 cursor-pointer"
              title="دانلود گزارش اکسل"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">خروجی اکسل</span>
            </button>
          )}

          {!isFinished && (
            <button
              onClick={onCancelBatch}
              className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-slate-200 dark:border-slate-700 text-rose-600 dark:text-rose-400 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <StopCircle className="w-4 h-4" />
              <span>لغو پردازش</span>
            </button>
          )}

          <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mx-1"></div>

          <button
            onClick={onToggleMinimize}
            className="p-2.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
            title="کوچک‌سازی پنل"
          >
            <Minimize2 className="w-4 h-4" />
          </button>

          <button
            onClick={onClose}
            className="p-2.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
            title="بستن"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Metrics Bento Grid */}
      <div className={`p-5 border-b space-y-5 ${
        isDarkMode ? "border-slate-800/60 bg-slate-900/50" : "border-slate-100 bg-white"
      }`}>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {/* Metric 1 */}
          <div className={`p-4 rounded-2xl flex flex-col justify-between transition-colors ${
            isDarkMode ? "bg-slate-800/40 hover:bg-slate-800/60" : "bg-slate-50 hover:bg-slate-100"
          }`}>
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-bold mb-3">
              <FileText className="w-4 h-4 text-blue-500" />
              <span>کل اسناد</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black">{totalCount.toLocaleString("fa-IR")}</span>
            </div>
          </div>

          {/* Metric 2 */}
          <div className={`p-4 rounded-2xl flex flex-col justify-between transition-colors ${
            isDarkMode ? "bg-slate-800/40 hover:bg-slate-800/60" : "bg-slate-50 hover:bg-slate-100"
          }`}>
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-bold mb-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>موفق</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{successCount.toLocaleString("fa-IR")}</span>
            </div>
          </div>

          {/* Metric 3 */}
          <div className={`p-4 rounded-2xl flex flex-col justify-between transition-colors md:col-span-2 ${
            isDarkMode ? "bg-slate-800/40 hover:bg-slate-800/60" : "bg-slate-50 hover:bg-slate-100"
          }`}>
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <span>داده‌های استخراجی</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700">ردیف</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{totalExtractedRows.toLocaleString("fa-IR")}</span>
            </div>
          </div>

          {/* Metric 4 */}
          <div className={`p-4 rounded-2xl flex flex-col justify-between transition-colors ${
            isDarkMode ? "bg-slate-800/40 hover:bg-slate-800/60" : "bg-slate-50 hover:bg-slate-100"
          }`}>
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-bold mb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>دقت (AVG)</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black">{avgConfidence}</span>
              <span className="text-sm font-bold text-slate-400">%</span>
            </div>
          </div>

          {/* Metric 5 */}
          <div className={`p-4 rounded-2xl flex flex-col justify-between transition-colors ${
            isDarkMode ? "bg-slate-800/40 hover:bg-slate-800/60" : "bg-slate-50 hover:bg-slate-100"
          }`}>
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-bold mb-3">
              <Cpu className="w-4 h-4 text-purple-500" />
              <span>زمان (ETA)</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-black text-slate-700 dark:text-slate-200">
                {etaSeconds ? `${etaSeconds}s` : isFinished ? "پایان" : "..."}
              </span>
            </div>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="pt-2">
          <div className="flex items-center justify-between text-xs mb-2.5 font-bold">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <span>پیشرفت کلی عملیات</span>
              <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20">{progressPercent}%</span>
            </span>
            {totalTokens > 0 && (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                توکن مصرفی: <strong className="text-slate-700 dark:text-slate-200">{totalTokens.toLocaleString("fa-IR")}</strong>
              </span>
            )}
          </div>
          <div className="w-full h-3 bg-slate-100 dark:bg-slate-800/80 rounded-full overflow-hidden p-0.5 shadow-inner">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className={`h-full rounded-full relative overflow-hidden ${
                isFinished 
                  ? "bg-emerald-500" 
                  : "bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500 bg-[length:200%_auto] animate-gradient"
              }`}
            >
              {!isFinished && <div className="absolute inset-0 bg-white/20 animate-shimmer" />}
            </motion.div>
          </div>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800/60 mt-2">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-[11px] font-bold w-full sm:w-auto border border-slate-200/50 dark:border-slate-700/50">
            {[
              { id: "all", label: "همه", count: totalCount, color: "blue" },
              { id: "active", label: "در حال پردازش", count: activeCount + queuedCount, color: "indigo" },
              { id: "success", label: "موفق", count: successCount, color: "emerald" },
              ...(errorCount > 0 ? [{ id: "error", label: "خطا", count: errorCount, color: "rose" }] : [])
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id as any)}
                className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  filterStatus === tab.id
                    ? isDarkMode
                      ? "bg-slate-700 text-white shadow-sm"
                      : "bg-white text-slate-800 shadow-sm border border-slate-200/50"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                  filterStatus === tab.id 
                    ? `bg-${tab.color}-500/20 text-${tab.color}-600 dark:text-${tab.color}-300` 
                    : "bg-slate-200 dark:bg-slate-700"
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجوی نام سند..."
              className={`w-full pr-10 pl-4 py-2 rounded-xl text-xs font-medium border focus:outline-none transition-all ${
                isDarkMode 
                  ? "bg-slate-900/50 border-slate-700 text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50" 
                  : "bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 hover:bg-white"
              }`}
            />
          </div>
        </div>
      </div>

      {/* Item Progress Cards List */}
      <div className={`p-4 sm:p-5 max-h-[500px] overflow-y-auto custom-scrollbar space-y-3 ${
        isDarkMode ? "bg-slate-900/30" : "bg-slate-50/50"
      }`}>
        <AnimatePresence>
          {filteredItems.map((item) => {
            const isProcessing = item.status === "processing";
            const isRetrying = item.status === "retrying";
            const isSuccess = item.status === "success";
            const isError = item.status === "error";
            const isExpanded = expandedItemId === item.id;

            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`rounded-2xl border transition-all overflow-hidden relative group ${
                  isSuccess
                    ? isDarkMode ? "bg-emerald-950/20 border-emerald-500/20 hover:border-emerald-500/40" : "bg-emerald-50/50 border-emerald-200 hover:border-emerald-300"
                    : isRetrying
                    ? isDarkMode ? "bg-amber-950/20 border-amber-500/30 hover:border-amber-500/50" : "bg-amber-50/50 border-amber-200 hover:border-amber-300"
                    : isProcessing
                    ? isDarkMode ? "bg-blue-950/20 border-blue-500/30 hover:border-blue-500/50" : "bg-blue-50/50 border-blue-200 hover:border-blue-300"
                    : isDarkMode ? "bg-slate-800/40 border-slate-700/50 hover:border-slate-600" : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                {/* Status Indicator Bar (Left Edge) */}
                <div className={`absolute top-0 bottom-0 right-0 w-1 ${
                  isSuccess ? "bg-emerald-500" 
                  : isRetrying ? "bg-amber-500" 
                  : isProcessing ? "bg-blue-500" 
                  : isError ? "bg-rose-500" 
                  : "bg-slate-300 dark:bg-slate-700"
                }`} />

                {/* Main Row */}
                <div 
                  onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                  className="p-4 pl-4 pr-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer select-none"
                >
                  {/* Left: Preview + Name + Status */}
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700/50 bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                      {item.preview ? (
                        <img src={item.preview} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <FileText className="w-6 h-6 text-slate-400" />
                      )}
                      {(isProcessing || isRetrying) && (
                        <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center backdrop-blur-[1px]">
                          <Loader2 className="w-5 h-5 text-white animate-spin" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-bold truncate max-w-[200px] sm:max-w-[320px] text-slate-800 dark:text-slate-200">
                          {item.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">
                          {formatFileSize(item.size)}
                        </span>
                        {item.documentType && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20">
                            {item.documentType}
                          </span>
                        )}
                      </div>

                      {/* Status Message */}
                      <p className={`text-xs font-medium flex items-center gap-1.5 ${
                        isSuccess ? "text-emerald-600 dark:text-emerald-400" : 
                        isRetrying ? "text-amber-600 dark:text-amber-400" : 
                        isProcessing ? "text-blue-600 dark:text-blue-400" : 
                        isError ? "text-rose-600 dark:text-rose-400" :
                        "text-slate-500 dark:text-slate-400"
                      }`}>
                        {isRetrying && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                        <span>{item.statusMessage}</span>
                      </p>
                    </div>
                  </div>

                  {/* Right: Badges & Controls */}
                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    {isProcessing && (
                      <div className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 text-[11px] font-bold flex items-center gap-1.5">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                        </span>
                        <span>در حال پردازش</span>
                      </div>
                    )}

                    {isRetrying && (
                      <div className="px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 text-amber-600 dark:text-amber-400 text-[11px] font-bold flex items-center gap-1.5">
                        <span>تلاش مجدد ({item.attempt})</span>
                      </div>
                    )}

                    {isSuccess && (
                      <div className="flex items-center gap-2">
                        {item.confidenceScore !== undefined && (
                          <span className="px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold flex items-center gap-1.5 border border-emerald-100 dark:border-emerald-500/20">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>{item.confidenceScore}% دقت</span>
                          </span>
                        )}
                        <span className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold flex items-center gap-1.5">
                          <span>{item.extractedCount?.toLocaleString("fa-IR") || 0} ردیف استخراج شد</span>
                        </span>
                      </div>
                    )}

                    {isError && (
                      <div className="px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-[11px] font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>خطا</span>
                      </div>
                    )}

                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Animated Line Progress for Processing */}
                {(isProcessing || isRetrying) && (
                  <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full w-1/2 bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-shimmer" />
                  </div>
                )}

                {/* Expanded Details Drawer */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className={`px-4 pb-4 border-t text-xs space-y-4 ${
                        isDarkMode ? "bg-slate-900/50 border-slate-800" : "bg-slate-50 border-slate-200"
                      }`}
                    >
                      <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-1">
                          <span className="text-slate-500 dark:text-slate-400 font-medium text-[10px]">مدل پردازش هوشمند:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{item.modelUsed || "Gemini Flash"}</span>
                        </div>

                        <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-1">
                          <span className="text-slate-500 dark:text-slate-400 font-medium text-[10px]">زمان اجرای دقیق:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {item.processingTimeMs ? `${(item.processingTimeMs / 1000).toFixed(2)} ثانیه` : "در حال پردازش..."}
                          </span>
                        </div>

                        <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-1">
                          <span className="text-slate-500 dark:text-slate-400 font-medium text-[10px]">توکن‌های مصرفی:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {item.tokensUsed ? item.tokensUsed.toLocaleString("fa-IR") : "-"}
                          </span>
                        </div>

                        <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-1">
                          <span className="text-slate-500 dark:text-slate-400 font-medium text-[10px]">پوشه هدف:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{item.folder || "عمومی"}</span>
                        </div>
                      </div>

                      {/* Action buttons inside drawer */}
                      <div className="flex items-center justify-between gap-3 pt-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyItemDetails(item);
                          }}
                          className={`px-4 py-2 rounded-xl text-[11px] font-bold flex items-center gap-2 transition-all cursor-pointer border ${
                            copiedId === item.id 
                              ? "bg-emerald-500 border-emerald-500 text-white shadow-emerald-500/20" 
                              : "bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 shadow-sm"
                          }`}
                        >
                          {copiedId === item.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          <span>{copiedId === item.id ? "کپی شد" : "کپی خلاصه مشخصات"}</span>
                        </button>

                        {isSuccess && onViewScan && item.scanId && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewScan(item.scanId!);
                            }}
                            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-[11px] font-bold flex items-center gap-2 shadow-lg cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]"
                          >
                            <Eye className="w-4 h-4" />
                            <span>مشاهده جدول و جزئیات سند</span>
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
