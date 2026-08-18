import React, { useState } from "react";
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
  ChevronDown,
  ChevronUp,
  Search,
  Download,
  Copy,
  Activity,
  Play,
  Pause,
  Sliders,
  Trash2,
  TrendingUp,
  FileSpreadsheet,
  FileCode,
  RotateCcw,
  Layers,
  Filter,
  Clock,
  BarChart3,
  CheckCheck,
  FileCheck,
  Coins
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
  stage?: "queued" | "preprocessing" | "analyzing_layout" | "extracting_fields" | "verifying_math" | "saving" | "completed";
  progressPercent?: number;
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
  totalAmountExtracted?: number;
  extractedRowsPreview?: any[];
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
  concurrencyLimit?: number;
  onChangeConcurrencyLimit?: (limit: number) => void;
  isPaused?: boolean;
  onTogglePause?: () => void;
  onRetryFailed?: () => void;
  onRetryItem?: (id: string) => void;
  onRemoveItem?: (id: string) => void;
  onClearCompleted?: () => void;
}

export const BatchOCRProgressPanel: React.FC<BatchOCRProgressPanelProps> = ({
  isOpen,
  isMinimized,
  onToggleMinimize,
  onClose,
  onCancelBatch,
  items,
  isDarkMode,
  onViewScan,
  concurrencyLimit = 3,
  onChangeConcurrencyLimit,
  isPaused = false,
  onTogglePause,
  onRetryFailed,
  onRetryItem,
  onRemoveItem,
  onClearCompleted
}) => {
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "success" | "error">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"items" | "analytics">("items");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  if (!isOpen || items.length === 0) return null;

  const totalCount = items.length;
  const successCount = items.filter(i => i.status === "success").length;
  const retryingCount = items.filter(i => i.status === "retrying").length;
  const processingCount = items.filter(i => i.status === "processing").length;
  const queuedCount = items.filter(i => i.status === "queued").length;
  const errorCount = items.filter(i => i.status === "error").length;

  const totalExtractedRows = items.reduce((sum, i) => sum + (i.extractedCount || 0), 0);
  const totalTokens = items.reduce((sum, i) => sum + (i.tokensUsed || 0), 0);
  const totalFinancialAmount = items.reduce((sum, i) => sum + (i.totalAmountExtracted || 0), 0);
  
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
  const adjustedWorkers = Math.max(1, concurrencyLimit);
  const etaSeconds = avgTimeSeconds && remainingDocs > 0
    ? Math.ceil((parseFloat(avgTimeSeconds) * remainingDocs) / adjustedWorkers)
    : null;

  const getItemPercent = (item: BatchOCRProgressItem): number => {
    if (item.status === "success") return 100;
    if (item.status === "queued") return 0;
    if (item.progressPercent !== undefined) return item.progressPercent;
    
    switch (item.stage) {
      case "preprocessing": return 15;
      case "analyzing_layout": return 35;
      case "extracting_fields": return 65;
      case "verifying_math": return 88;
      case "saving": return 94;
      case "completed": return 100;
      default: return item.status === "processing" ? 50 : 0;
    }
  };

  const getItemStageStepText = (item: BatchOCRProgressItem): string => {
    if (item.status === "success") return "مرحله ۵ از ۵: استخراج کامل";
    if (item.status === "error") return "خطا در فرآیند استخراج";
    if (item.status === "queued") return "در صف نوبت پردازش";
    
    switch (item.stage) {
      case "preprocessing": return "مرحله ۱ از ۵: پیش‌پردازش تصویر";
      case "analyzing_layout": return "مرحله ۲ از ۵: تحلیل چیدمان";
      case "extracting_fields": return "مرحله ۳ از ۵: استخراج هوش مصنوعی";
      case "verifying_math": return "مرحله ۴ از ۵: موازنه ریاضی و ممیزی";
      case "saving": return "مرحله ۴ از ۵: ذخیره‌سازی داده";
      case "completed": return "مرحله ۵ از ۵: پردازش نهایی";
      default: return item.statusMessage || "در حال پردازش";
    }
  };

  const overallProgressSum = items.reduce((sum, item) => sum + getItemPercent(item), 0);
  const progressPercent = totalCount > 0 ? Math.round(overallProgressSum / totalCount) : 0;

  // Categories extraction
  const categoriesMap: Record<string, number> = {};
  items.forEach(i => {
    const type = i.documentType || "سند نامشخص";
    categoriesMap[type] = (categoriesMap[type] || 0) + 1;
  });
  const categoryList = Object.keys(categoriesMap);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("fa-IR").format(val) + " ریال";
  };

  const filteredItems = items.filter(item => {
    const matchesFilter = 
      filterStatus === "all" ? true :
      filterStatus === "active" ? (item.status === "processing" || item.status === "retrying" || item.status === "queued") :
      filterStatus === "success" ? item.status === "success" :
      (item.status === "error");

    const matchesCategory = selectedCategory === "all" || (item.documentType || "سند نامشخص") === selectedCategory;

    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.documentType && item.documentType.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesFilter && matchesCategory && matchesSearch;
  });

  const handleExportBatchToExcel = () => {
    const successItems = items.filter(i => i.status === "success");
    if (successItems.length === 0) return;

    const exportRows = successItems.map((item, idx) => ({
      "ردیف": idx + 1,
      "نام سند": item.name,
      "نوع سند": item.documentType || "نامشخص",
      "تعداد ردیف مالی": item.extractedCount || 0,
      "مبلغ کل استخراج‌شده (ریال)": item.totalAmountExtracted || 0,
      "ضریب اطمینان (%)": item.confidenceScore || 100,
      "مدل پردازش": item.modelUsed || "Gemini OCR Engine",
      "توکن مصرفی": item.tokensUsed || 0,
      "زمان پردازش (ثانیه)": item.processingTimeMs ? (item.processingTimeMs / 1000).toFixed(1) : "-",
      "وضعیت": "موفق"
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "گزارش پردازش موازی اسناد");
    XLSX.writeFile(workbook, `Mehrayin_Batch_OCR_Report_${Date.now()}.xlsx`);
  };

  const handleCopyItemDetails = (item: BatchOCRProgressItem) => {
    const text = `نام سند: ${item.name}\nنوع سند: ${item.documentType || "نامشخص"}\nتعداد ردیف: ${item.extractedCount || 0}\nمبلغ کل: ${item.totalAmountExtracted ? formatCurrency(item.totalAmountExtracted) : "-"}\nضریب اطمینان: ${item.confidenceScore || 100}%\nزمان پردازش: ${item.processingTimeMs ? (item.processingTimeMs / 1000).toFixed(1) + "s" : "-"}`;
    navigator.clipboard.writeText(text);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // Minimized Widget Bar (Floating at bottom-left)
  if (isMinimized) {
    return (
      <motion.div 
        initial={{ y: 60, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 60, opacity: 0, scale: 0.9 }}
        className={`fixed bottom-6 left-6 z-50 p-3.5 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.25)] border backdrop-blur-2xl flex items-center gap-4 transition-all ${
          isDarkMode 
            ? "bg-slate-900/95 border-indigo-500/40 text-slate-100 shadow-indigo-950/50" 
            : "bg-white/95 border-indigo-200 text-slate-800 shadow-indigo-200/60"
        }`}
        dir="rtl"
      >
        <div className="relative flex items-center justify-center shrink-0">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg transition-all ${
            isPaused 
              ? "bg-gradient-to-br from-amber-500 to-orange-500 shadow-amber-500/30"
              : activeCount > 0 
              ? "bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-600 shadow-indigo-500/30" 
              : "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/30"
          }`}>
            {isPaused ? (
              <Pause className="w-5 h-5 text-white" />
            ) : activeCount > 0 ? (
              <Activity className="w-5 h-5 text-white animate-pulse" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-white" />
            )}
          </div>
          {activeCount > 0 && !isPaused && (
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-blue-400 rounded-full animate-ping ring-2 ring-slate-900" />
          )}
        </div>

        <div className="flex flex-col min-w-[150px]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black tracking-tight">موتور موازی Gemini</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
              isFinished 
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                : "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30"
            }`}>
              {successCount}/{totalCount}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-bold truncate">
            {isPaused 
              ? "پردازش متوقف شده" 
              : activeCount > 0 
              ? `${activeCount} سند فعال (${concurrencyLimit} همزمان)...`
              : "استخراج سری اسناد کامل شد"}
          </span>
        </div>

        <div className="w-24 h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden shrink-0">
          <div 
            className={`h-full transition-all duration-500 rounded-full ${
              isFinished ? "bg-emerald-500" : "bg-gradient-to-r from-blue-500 to-indigo-500"
            }`} 
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex items-center gap-1 border-r border-slate-200 dark:border-slate-800 pr-3">
          {onTogglePause && !isFinished && (
            <button
              onClick={onTogglePause}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                isPaused 
                  ? "bg-amber-500/20 text-amber-500 hover:bg-amber-500/30" 
                  : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-200"
              }`}
              title={isPaused ? "ادامه پردازش" : "توقف موقت"}
            >
              {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4" />}
            </button>
          )}

          <button 
            onClick={onToggleMinimize}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
            title="بزرگنمایی پنل"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors cursor-pointer"
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
      initial={{ opacity: 0, scale: 0.98, y: 14 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98, y: 14 }}
      className={`w-full my-6 rounded-3xl border shadow-[0_16px_50px_rgba(0,0,0,0.2)] overflow-hidden backdrop-blur-2xl transition-all ${
        isDarkMode
          ? "bg-slate-900/95 border-indigo-500/30 text-slate-100 shadow-indigo-950/30"
          : "bg-white/95 border-indigo-100 text-slate-900 shadow-indigo-100/60"
      }`}
      dir="rtl"
    >
      {/* Header Bar */}
      <div className={`relative p-5 sm:p-6 border-b flex flex-wrap items-center justify-between gap-4 overflow-hidden ${
        isDarkMode ? "border-slate-800/80 bg-slate-950/50" : "border-slate-100 bg-slate-50/70"
      }`}>
        {/* Subtle mesh background aura */}
        <div className={`absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl pointer-events-none opacity-20 ${
          isFinished ? "bg-emerald-500" : isPaused ? "bg-amber-500" : "bg-indigo-600"
        }`} />
        
        {/* Title & Engine Status */}
        <div className="flex items-center gap-4 z-10">
          <div className="relative">
            <div className={`w-13 h-13 rounded-2xl flex items-center justify-center shadow-xl transition-all ${
              isPaused 
                ? "bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/25"
                : isFinished 
                ? "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/25"
                : "bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-600 shadow-indigo-500/30"
            }`}>
              {isPaused ? (
                <Pause className="w-6 h-6 text-white" />
              ) : isFinished ? (
                <CheckCheck className="w-6 h-6 text-white" />
              ) : (
                <Zap className="w-6 h-6 text-white animate-pulse" />
              )}
            </div>
            {!isFinished && !isPaused && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500 border-2 border-white dark:border-slate-950"></span>
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-base sm:text-lg font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-700 dark:from-white dark:via-indigo-200 dark:to-slate-300">
                موتور پردازش موازی اسناد (Gemini OCR Engine)
              </h3>
              
              {isPaused && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
                  <Pause className="w-3 h-3" />
                  توقف موقت
                </span>
              )}
              {!isPaused && activeCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 flex items-center gap-1.5 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                  {activeCount} سند در حال پردازش ({concurrencyLimit} موازی)
                </span>
              )}
              {isFinished && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  استخراج موفق
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium flex items-center gap-2 flex-wrap">
              <span>خط پردازش چندنخی هوشمند با قابلیت ممیزی ریاضی ۵ لایه، پالایش نویز و بازتلاش خودکار</span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800 font-bold">
                Gemini Multi-Modal
              </span>
            </p>
          </div>
        </div>

        {/* Action Controls Toolbar */}
        <div className="flex items-center gap-2 z-10 flex-wrap">
          {/* Concurrency Selector */}
          {onChangeConcurrencyLimit && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border bg-slate-100/90 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700/80 text-xs font-bold shadow-xs">
              <Sliders className="w-3.5 h-3.5 text-indigo-500" />
              <span className="text-slate-500 dark:text-slate-400 text-[11px] hidden sm:inline">همزمانی:</span>
              <div className="flex gap-1">
                {[2, 3, 5, 8].map(limit => (
                  <button
                    key={limit}
                    onClick={() => onChangeConcurrencyLimit(limit)}
                    className={`px-2.5 py-1 rounded-xl text-[10.5px] font-black transition-all cursor-pointer ${
                      concurrencyLimit === limit
                        ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30 scale-105"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                    title={`پردازش همزمان حداکثر ${limit} سند`}
                  >
                    {limit}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Pause / Resume Button */}
          {onTogglePause && !isFinished && (
            <button
              onClick={onTogglePause}
              className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer border ${
                isPaused 
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-amber-400 shadow-amber-500/25" 
                  : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
              }`}
              title={isPaused ? "ادامه پردازش صف اسناد" : "توقف موقت پردازش اسناد"}
            >
              {isPaused ? (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>ادامه پردازش</span>
                </>
              ) : (
                <>
                  <Pause className="w-4 h-4" />
                  <span>توقف موقت</span>
                </>
              )}
            </button>
          )}

          {/* Retry Failed */}
          {errorCount > 0 && onRetryFailed && (
            <button
              onClick={onRetryFailed}
              className="px-3.5 py-2 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="تلاش مجدد برای اسناد دارای خطا"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>تلاش مجدد ({errorCount})</span>
            </button>
          )}

          {/* Export Excel */}
          {successCount > 0 && (
            <button
              onClick={handleExportBatchToExcel}
              className="px-4 py-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black transition-all shadow-lg shadow-emerald-500/25 flex items-center gap-1.5 active:scale-95 cursor-pointer border border-emerald-400/20"
              title="دانلود خروجی جامع اکسل"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">گزارش اکسل</span>
            </button>
          )}

          {!isFinished && (
            <button
              onClick={onCancelBatch}
              className="px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-500/15 border border-slate-200 dark:border-slate-700 text-rose-600 dark:text-rose-400 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <StopCircle className="w-4 h-4" />
              <span>لغو کل صف</span>
            </button>
          )}

          <div className="w-px h-7 bg-slate-200 dark:bg-slate-700 mx-1"></div>

          <button
            onClick={onToggleMinimize}
            className="p-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
            title="کوچک‌سازی پنل"
          >
            <Minimize2 className="w-4 h-4" />
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-2xl hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
            title="بستن"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Metrics Bento Grid */}
      <div className={`p-5 sm:p-6 border-b space-y-5 ${
        isDarkMode ? "border-slate-800/80 bg-slate-900/40" : "border-slate-100 bg-white"
      }`}>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {/* Metric 1 */}
          <div className={`p-4 rounded-2xl border transition-all ${
            isDarkMode 
              ? "bg-slate-950/60 border-slate-800 hover:border-slate-700" 
              : "bg-slate-50/90 border-slate-200/80 hover:border-slate-300"
          }`}>
            <div className="flex items-center justify-between gap-1 flex-wrap text-slate-500 dark:text-slate-400 text-xs font-bold mb-2">
              <span className="flex items-center gap-1.5 truncate">
                <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                <span className="truncate">کل اسناد</span>
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 shrink-0">صف</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black">{totalCount.toLocaleString("fa-IR")}</span>
              <span className="text-[10px] text-slate-400 font-medium">سند</span>
            </div>
          </div>

          {/* Metric 2 */}
          <div className={`p-4 rounded-2xl border transition-all ${
            isDarkMode 
              ? "bg-slate-950/60 border-slate-800 hover:border-emerald-500/30" 
              : "bg-slate-50/90 border-slate-200/80 hover:border-emerald-300"
          }`}>
            <div className="flex items-center justify-between gap-1 flex-wrap text-slate-500 dark:text-slate-400 text-xs font-bold mb-2">
              <span className="flex items-center gap-1.5 truncate">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="truncate">استخراج موفق</span>
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 shrink-0">تکمیل</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{successCount.toLocaleString("fa-IR")}</span>
              <span className="text-[10px] text-emerald-500/80 font-medium">از {totalCount}</span>
            </div>
          </div>

          {/* Metric 3 */}
          <div className={`p-4 rounded-2xl border transition-all ${
            isDarkMode 
              ? "bg-slate-950/60 border-slate-800 hover:border-indigo-500/30" 
              : "bg-slate-50/90 border-slate-200/80 hover:border-indigo-300"
          }`}>
            <div className="flex items-center justify-between gap-1 flex-wrap text-slate-500 dark:text-slate-400 text-xs font-bold mb-2">
              <span className="flex items-center gap-1.5 truncate">
                <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
                <span className="truncate">ردیف‌های مالی</span>
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-500 shrink-0">اقلام</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{totalExtractedRows.toLocaleString("fa-IR")}</span>
              <span className="text-[10px] text-indigo-500/80 font-medium">ردیف</span>
            </div>
          </div>

          {/* Metric 4: Financial Total Sum */}
          <div className={`p-4 rounded-2xl border transition-all ${
            isDarkMode 
              ? "bg-slate-950/60 border-slate-800 hover:border-teal-500/30" 
              : "bg-slate-50/90 border-slate-200/80 hover:border-teal-300"
          }`}>
            <div className="flex items-center justify-between gap-1 flex-wrap text-slate-500 dark:text-slate-400 text-xs font-bold mb-2">
              <span className="flex items-center gap-1.5 truncate">
                <TrendingUp className="w-4 h-4 text-teal-500 shrink-0" />
                <span className="truncate">جمع مالی کل</span>
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-500 shrink-0">تومان</span>
            </div>
            <div className="flex items-baseline gap-1 truncate">
              <span className="text-lg font-black text-teal-600 dark:text-teal-400 truncate">
                {totalFinancialAmount > 0 ? (totalFinancialAmount / 10000).toLocaleString("fa-IR") : "۰"}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">تومان</span>
            </div>
          </div>

          {/* Metric 5 */}
          <div className={`p-4 rounded-2xl border transition-all ${
            isDarkMode 
              ? "bg-slate-950/60 border-slate-800 hover:border-emerald-500/30" 
              : "bg-slate-50/90 border-slate-200/80 hover:border-emerald-300"
          }`}>
            <div className="flex items-center justify-between gap-1 flex-wrap text-slate-500 dark:text-slate-400 text-xs font-bold mb-2">
              <span className="flex items-center gap-1.5 truncate">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="truncate">ضریب اطمینان</span>
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 shrink-0">ممیزی</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black">{avgConfidence}</span>
              <span className="text-sm font-bold text-slate-400">%</span>
            </div>
          </div>

          {/* Metric 6 */}
          <div className={`p-4 rounded-2xl border transition-all ${
            isDarkMode 
              ? "bg-slate-950/60 border-slate-800 hover:border-purple-500/30" 
              : "bg-slate-50/90 border-slate-200/80 hover:border-purple-300"
          }`}>
            <div className="flex items-center justify-between gap-1 flex-wrap text-slate-500 dark:text-slate-400 text-xs font-bold mb-2">
              <span className="flex items-center gap-1.5 truncate">
                <Clock className="w-4 h-4 text-purple-500 shrink-0" />
                <span className="truncate">زمان باقی‌مانده</span>
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-500 shrink-0">ETA</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-black text-slate-700 dark:text-slate-200 truncate">
                {isPaused ? "توقف" : etaSeconds ? `${etaSeconds} ثانیه` : isFinished ? "پایان" : "محاسبه..."}
              </span>
            </div>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="pt-2">
          <div className="flex items-center justify-between text-xs mb-2.5 font-bold">
            <span className="text-slate-600 dark:text-slate-300 flex items-center gap-2">
              <span>پیشرفت پردازش موازی:</span>
              <span className="px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/30 font-black">
                {progressPercent}%
              </span>
            </span>
            {totalTokens > 0 && (
              <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-amber-500" />
                <span>مصرف توکن Gemini:</span>
                <strong className="text-slate-800 dark:text-slate-200 font-mono">{totalTokens.toLocaleString("fa-IR")}</strong>
              </span>
            )}
          </div>
          
          <div className="w-full h-3.5 bg-slate-100 dark:bg-slate-800/90 rounded-full overflow-hidden p-0.5 shadow-inner border border-slate-200/50 dark:border-slate-700/50">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className={`h-full rounded-full relative overflow-hidden transition-all ${
                isFinished 
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500 shadow-md shadow-emerald-500/20" 
                  : isPaused
                  ? "bg-amber-500"
                  : "bg-gradient-to-r from-indigo-600 via-blue-500 to-teal-400 shadow-md shadow-indigo-500/20"
              }`}
            >
              {!isFinished && !isPaused && (
                <div className="absolute inset-0 bg-white/25 animate-shimmer" />
              )}
            </motion.div>
          </div>
        </div>

        {/* Navigation Tabs + Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 mt-2">
          {/* Main Tabs (Items vs Analytics) + Status Pills */}
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            {/* Status Filter Pills */}
            <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/90 text-[11px] font-bold border border-slate-200/60 dark:border-slate-700/60 overflow-x-auto">
              {[
                { id: "all", label: "همه اسناد", count: totalCount, color: "blue" },
                { id: "active", label: "در حال پردازش / صف", count: activeCount + queuedCount, color: "indigo" },
                { id: "success", label: "موفق", count: successCount, color: "emerald" },
                ...(errorCount > 0 ? [{ id: "error", label: "خطادار", count: errorCount, color: "rose" }] : [])
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterStatus(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    filterStatus === tab.id
                      ? isDarkMode
                        ? "bg-slate-700 text-white shadow-xs"
                        : "bg-white text-slate-900 shadow-xs border border-slate-200/80 font-black"
                      : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.5 rounded-lg text-[10px] font-bold ${
                    filterStatus === tab.id 
                      ? "bg-indigo-500/20 text-indigo-600 dark:text-indigo-300" 
                      : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Category Filter + Search Box */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {categoryList.length > 0 && (
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={`px-3 py-2 rounded-2xl text-xs font-bold border outline-none cursor-pointer transition-all ${
                  isDarkMode 
                    ? "bg-slate-950/90 border-slate-700 text-slate-200 focus:border-indigo-500" 
                    : "bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500"
                }`}
              >
                <option value="all">دسته‌بندی (همه)</option>
                {categoryList.map(cat => (
                  <option key={cat} value={cat}>{cat} ({categoriesMap[cat]})</option>
                ))}
              </select>
            )}

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجوی نام سند یا نوع..."
                className={`w-full pr-10 pl-4 py-2 rounded-2xl text-xs font-bold border focus:outline-none transition-all ${
                  isDarkMode 
                    ? "bg-slate-950/80 border-slate-700 text-slate-200 placeholder-slate-500 focus:border-indigo-500" 
                    : "bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-indigo-500 hover:bg-white"
                }`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Item Progress Cards List */}
      <div className={`p-4 sm:p-5 max-h-[540px] overflow-y-auto custom-scrollbar space-y-3 ${
        isDarkMode ? "bg-slate-950/30" : "bg-slate-50/40"
      }`}>
        <AnimatePresence>
          {filteredItems.map((item) => {
            const isProcessing = item.status === "processing";
            const isRetrying = item.status === "retrying";
            const isSuccess = item.status === "success";
            const isError = item.status === "error";
            const isQueued = item.status === "queued";
            const isExpanded = expandedItemId === item.id;

            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`rounded-2xl border transition-all overflow-hidden relative group shadow-xs ${
                  isSuccess
                    ? isDarkMode ? "bg-emerald-950/15 border-emerald-500/25 hover:border-emerald-500/40" : "bg-white border-emerald-200 hover:border-emerald-300"
                    : isRetrying
                    ? isDarkMode ? "bg-amber-950/20 border-amber-500/30 hover:border-amber-500/50" : "bg-amber-50/60 border-amber-200 hover:border-amber-300"
                    : isProcessing
                    ? isDarkMode ? "bg-indigo-950/20 border-indigo-500/30 hover:border-indigo-500/50" : "bg-indigo-50/60 border-indigo-200 hover:border-indigo-300"
                    : isError
                    ? isDarkMode ? "bg-rose-950/20 border-rose-500/30 hover:border-rose-500/50" : "bg-rose-50/60 border-rose-200 hover:border-rose-300"
                    : isDarkMode ? "bg-slate-900/60 border-slate-800 hover:border-slate-700" : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                {/* Status Indicator Bar (Right Edge in RTL) */}
                <div className={`absolute top-0 bottom-0 right-0 w-1.5 ${
                  isSuccess ? "bg-emerald-500" 
                  : isRetrying ? "bg-amber-500" 
                  : isProcessing ? "bg-indigo-500" 
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
                    <div className="relative w-13 h-13 rounded-2xl overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow-sm">
                      {item.preview ? (
                        <img src={item.preview} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <FileText className="w-6 h-6 text-slate-400" />
                      )}
                      {(isProcessing || isRetrying) && (
                        <div className="absolute inset-0 bg-slate-950/50 flex items-center justify-center backdrop-blur-[1.5px]">
                          <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-black truncate max-w-[200px] sm:max-w-[340px] text-slate-900 dark:text-slate-100">
                          {item.name}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
                          {formatFileSize(item.size)}
                        </span>
                        {item.documentType && (
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/30">
                            {item.documentType}
                          </span>
                        )}
                      </div>

                      {/* Status & Stage Text */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`text-xs font-bold flex items-center gap-1.5 ${
                          isSuccess ? "text-emerald-600 dark:text-emerald-400" : 
                          isRetrying ? "text-amber-600 dark:text-amber-400" : 
                          isProcessing ? "text-indigo-600 dark:text-indigo-400" : 
                          isError ? "text-rose-600 dark:text-rose-400" :
                          "text-slate-500 dark:text-slate-400"
                        }`}>
                          {isRetrying && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                          <span>{item.statusMessage}</span>
                        </p>
                      </div>

                      {/* Individual Document Progress Bar */}
                      <div className="w-full max-w-md bg-slate-200/80 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden mt-1 relative">
                        <div 
                          className={`h-full transition-all duration-500 rounded-full ${
                            isSuccess ? "bg-emerald-500" 
                            : isError ? "bg-rose-500" 
                            : isRetrying ? "bg-amber-500" 
                            : "bg-gradient-to-r from-indigo-500 via-blue-500 to-teal-400"
                          }`}
                          style={{ width: `${getItemPercent(item)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right: Stage Badge, Percentage & Controls */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {/* Stage & Percentage Badge */}
                    <div className={`px-3 py-1.5 rounded-2xl text-[11px] font-black flex items-center gap-1.5 border shadow-2xs ${
                      isSuccess ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                      : isError ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30"
                      : isRetrying ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                      : isProcessing ? "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700"
                    }`}>
                      <Zap className="w-3.5 h-3.5 text-current" />
                      <span>{getItemStageStepText(item)}</span>
                      <span className="font-extrabold dir-ltr text-[10px] opacity-90">({getItemPercent(item)}٪)</span>
                    </div>

                    {isSuccess && (
                      <div className="flex items-center gap-1.5">
                        {item.confidenceScore !== undefined && (
                          <span className="px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10.5px] font-black flex items-center gap-1 border border-emerald-100 dark:border-emerald-500/20">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>{item.confidenceScore}%</span>
                          </span>
                        )}
                        <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[10.5px] font-bold">
                          {item.extractedCount?.toLocaleString("fa-IR") || 0} ردیف
                        </span>
                      </div>
                    )}

                    {isError && onRetryItem && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRetryItem(item.id);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 text-[10.5px] font-black border border-amber-500/30 flex items-center gap-1 cursor-pointer"
                        title="تلاش مجدد این سند"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>تلاش مجدد</span>
                      </button>
                    )}

                    {onRemoveItem && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveItem(item.id);
                        }}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/15 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                        title="حذف از صف پردازش"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Animated Line Progress for Processing */}
                {(isProcessing || isRetrying) && (
                  <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full w-1/2 bg-gradient-to-r from-transparent via-indigo-500 to-transparent animate-shimmer" />
                  </div>
                )}

                {/* Expanded Details Drawer */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className={`px-5 pb-5 border-t text-xs space-y-4 ${
                        isDarkMode ? "bg-slate-950/70 border-slate-800/80" : "bg-slate-50/90 border-slate-200"
                      }`}
                    >
                      {/* 5-Stage Stepper Pipeline Visualization */}
                      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                          <span className="flex items-center gap-2">
                            <Cpu className="w-4 h-4 text-indigo-500 animate-pulse" />
                            <span className="font-black">مراحل استخراج ۵ گانه موتور پردازش هوشمند:</span>
                          </span>
                          <span className="text-indigo-600 dark:text-indigo-400 font-black dir-ltr">
                            {getItemPercent(item)}٪
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                          {[
                            { step: 1, name: "پیش‌پردازش و فیلتر", pct: 15, icon: "📸" },
                            { step: 2, name: "تحلیل چیدمان سند", pct: 35, icon: "📐" },
                            { step: 3, name: "بینایی Gemini OCR", pct: 65, icon: "⚡" },
                            { step: 4, name: "موازنه ریاضی و ممیزی", pct: 88, icon: "⚖️" },
                            { step: 5, name: "استخراج نهایی", pct: 100, icon: "✅" },
                          ].map((st) => {
                            const currentPct = getItemPercent(item);
                            const isPassed = currentPct >= st.pct || isSuccess;
                            const isActive = !isSuccess && !isError && (
                              (st.step === 1 && (item.stage === "preprocessing" || currentPct <= 15)) ||
                              (st.step === 2 && item.stage === "analyzing_layout") ||
                              (st.step === 3 && item.stage === "extracting_fields") ||
                              (st.step === 4 && (item.stage === "verifying_math" || item.stage === "saving")) ||
                              (st.step === 5 && item.stage === "completed")
                            );

                            return (
                              <div 
                                key={st.step}
                                className={`p-2.5 rounded-xl border flex flex-col items-center text-center transition-all ${
                                  isPassed 
                                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold"
                                    : isActive
                                    ? "bg-indigo-500/15 border-indigo-500/40 text-indigo-700 dark:text-indigo-300 shadow-xs scale-102 font-black"
                                    : "bg-slate-100/60 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800 text-slate-400"
                                }`}
                              >
                                <div className="text-lg mb-1">{st.icon}</div>
                                <span className="text-[10.5px] leading-tight">{st.name}</span>
                                <span className="text-[9px] font-medium opacity-80 mt-0.5 dir-ltr">{st.pct}٪</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Meta stats */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col gap-1">
                          <span className="text-slate-500 dark:text-slate-400 font-bold text-[10px]">مدل پردازش:</span>
                          <span className="font-black text-slate-800 dark:text-slate-200">{item.modelUsed || "Gemini Flash Vision"}</span>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col gap-1">
                          <span className="text-slate-500 dark:text-slate-400 font-bold text-[10px]">زمان پردازش:</span>
                          <span className="font-black text-slate-800 dark:text-slate-200">
                            {item.processingTimeMs ? `${(item.processingTimeMs / 1000).toFixed(2)} ثانیه` : "در حال پردازش..."}
                          </span>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col gap-1">
                          <span className="text-slate-500 dark:text-slate-400 font-bold text-[10px]">توکن‌های مصرفی:</span>
                          <span className="font-black text-slate-800 dark:text-slate-200 font-mono">
                            {item.tokensUsed ? item.tokensUsed.toLocaleString("fa-IR") : "-"}
                          </span>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col gap-1">
                          <span className="text-slate-500 dark:text-slate-400 font-bold text-[10px]">مبلغ استخراج‌شده:</span>
                          <span className="font-black text-teal-600 dark:text-teal-400">
                            {item.totalAmountExtracted ? formatCurrency(item.totalAmountExtracted) : "-"}
                          </span>
                        </div>
                      </div>

                      {/* Error details if any */}
                      {item.errorMessage && (
                        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 text-rose-700 dark:text-rose-300 text-xs leading-relaxed font-medium">
                          <strong className="font-black">پیام خطا:</strong> {item.errorMessage}
                        </div>
                      )}

                      {/* Extracted Rows Inline Preview */}
                      {item.extractedRowsPreview && item.extractedRowsPreview.length > 0 && (
                        <div className="space-y-2">
                          <span className="font-black text-slate-700 dark:text-slate-300 text-[11px] block">
                            پیش‌نمایش اقلام مالی استخراج‌شده ({item.extractedRowsPreview.length} ردیف):
                          </span>
                          <div className="max-h-44 overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800 text-[10.5px]">
                            <table className="w-full text-right border-collapse">
                              <thead className={`sticky top-0 ${isDarkMode ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-800"} font-black`}>
                                <tr>
                                  <th className="p-2.5 border-b border-slate-200 dark:border-slate-700">شرح / کالا</th>
                                  <th className="p-2.5 border-b border-slate-200 dark:border-slate-700">تعداد</th>
                                  <th className="p-2.5 border-b border-slate-200 dark:border-slate-700">قیمت واحد</th>
                                  <th className="p-2.5 border-b border-slate-200 dark:border-slate-700">مبلغ کل</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                {item.extractedRowsPreview.slice(0, 5).map((row, rIdx) => (
                                  <tr key={rIdx} className={isDarkMode ? "hover:bg-slate-800/40" : "hover:bg-slate-50"}>
                                    <td className="p-2.5 truncate max-w-[160px] font-medium">{row.شرح_کالا || row.نام_کالا || row.کالا || row.شرح || "-"}</td>
                                    <td className="p-2.5">{row.تعداد || row.مقدار || "-"}</td>
                                    <td className="p-2.5">{row.قیمت_واحد || row.فی || "-"}</td>
                                    <td className="p-2.5 font-black text-emerald-600 dark:text-emerald-400">{row.مبلغ_کل || row.مبلغ || "-"}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Action buttons inside drawer */}
                      <div className="flex items-center justify-between gap-3 pt-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyItemDetails(item);
                          }}
                          className={`px-4 py-2.5 rounded-2xl text-[11px] font-black flex items-center gap-2 transition-all cursor-pointer border ${
                            copiedId === item.id 
                              ? "bg-emerald-500 border-emerald-500 text-white shadow-emerald-500/20" 
                              : "bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-xs"
                          }`}
                        >
                          {copiedId === item.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          <span>{copiedId === item.id ? "مشخصات کپی شد" : "کپی خلاصه مشخصات"}</span>
                        </button>

                        {isSuccess && onViewScan && item.scanId && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewScan(item.scanId!);
                            }}
                            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-[11px] font-black flex items-center gap-2 shadow-lg shadow-indigo-500/25 cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]"
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
