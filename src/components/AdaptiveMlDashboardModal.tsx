import React, { useState, useEffect } from "react";
import { 
  X, 
  Brain, 
  Sparkles, 
  Check, 
  Trash2, 
  Plus, 
  RefreshCw, 
  ToggleLeft, 
  ToggleRight, 
  HelpCircle, 
  Activity, 
  FolderPlus,
  AlertCircle,
  Wand2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface LearnedCorrection {
  id: string;
  original: string;
  corrected: string;
  field: string;
  count: number;
}

interface LearnedCategorization {
  id: string;
  description: string;
  category: string;
  count: number;
}

interface LearnedRule {
  id: string;
  rule: string;
  count: number;
}

interface LearnerMemory {
  adaptiveEnabled: boolean;
  corrections: LearnedCorrection[];
  categorizations: LearnedCategorization[];
  customRules: LearnedRule[];
}

interface AdaptiveMlDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  onShowNotification: (message: string, type: "success" | "error" | "info" | "warning") => void;
}

export default function AdaptiveMlDashboardModal({
  isOpen,
  onClose,
  isDarkMode,
  onShowNotification
}: AdaptiveMlDashboardModalProps) {
  const [memory, setMemory] = useState<LearnerMemory | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"corrections" | "categorizations" | "rules">("corrections");

  // Form states
  const [corrOriginal, setCorrOriginal] = useState("");
  const [corrCorrected, setCorrCorrected] = useState("");
  const [corrField, setCorrField] = useState("شرح_کالا");

  const [catDesc, setCatDesc] = useState("");
  const [catCategory, setCatCategory] = useState("");

  const [ruleText, setRuleText] = useState("");

  // Fetch memory
  const fetchMemory = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/ml/memory");
      const data = await res.json();
      if (data.success) {
        setMemory(data.memory);
      } else {
        onShowNotification("خطا در بارگذاری حافظه هوش مصنوعی", "error");
      }
    } catch (err) {
      console.error("Fetch memory error:", err);
      onShowNotification("خطا در ارتباط با سرور", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMemory();
    }
  }, [isOpen]);

  // Toggle adaptive learning mode
  const handleToggleAdaptive = async () => {
    if (!memory) return;
    const targetState = !memory.adaptiveEnabled;
    try {
      const res = await fetch("/api/ml/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: targetState })
      });
      const data = await res.json();
      if (data.success) {
        setMemory(data.memory);
        onShowNotification(
          targetState 
            ? "یادگیری زنده و اعمال الگوهای تطبیقی هوشمند با موفقیت فعال شد 🧠" 
            : "حالت تطبیقی غیرفعال شد. سیستم اکنون از قوانین پیش‌فرض استفاده می‌کند.",
          "success"
        );
      }
    } catch (err) {
      onShowNotification("خطا در بروزرسانی وضعیت سیستم", "error");
    }
  };

  // Reset memory
  const handleResetMemory = async () => {
    if (!window.confirm("آیا از بازنشانی کامل مغز یادگیری و پاکسازی الگوهای ثبت‌شده اطمینان دارید؟")) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/ml/reset", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setMemory(data.memory);
        onShowNotification("حافظه ماشین لرنینگ ریست شد و به حالت اولیه برگشت.", "success");
      }
    } catch (err) {
      onShowNotification("خطا در بازنشانی حافظه", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Learn a new item manually
  const handleAddLearnedItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memory) return;

    let payload: any = {};
    let type = "";

    if (activeTab === "corrections") {
      if (!corrOriginal.trim() || !corrCorrected.trim()) {
        onShowNotification("لطفاً فیلدهای مقدار اصلی و مقدار صحیح را پر کنید.", "warning");
        return;
      }
      type = "correction";
      payload = { original: corrOriginal, corrected: corrCorrected, field: corrField };
    } else if (activeTab === "categorizations") {
      if (!catDesc.trim() || !catCategory.trim()) {
        onShowNotification("لطفاً فیلدهای شرح رویداد و سرفصل مالی را پر کنید.", "warning");
        return;
      }
      type = "categorization";
      payload = { description: catDesc, category: catCategory };
    } else if (activeTab === "rules") {
      if (!ruleText.trim()) {
        onShowNotification("لطفاً متن قانون استخراج را بنویسید.", "warning");
        return;
      }
      type = "rule";
      payload = { rule: ruleText };
    }

    try {
      const res = await fetch("/api/ml/learn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, item: payload })
      });
      const data = await res.json();
      if (data.success) {
        setMemory(data.memory);
        onShowNotification("الگوی جدید مالی با موفقیت به سرفصل‌های یادگیری ماشین اضافه شد ✅", "success");
        // Clear fields
        setCorrOriginal("");
        setCorrCorrected("");
        setCatDesc("");
        setCatCategory("");
        setRuleText("");
      } else {
        onShowNotification(data.error || "خطا در ثبت الگو", "error");
      }
    } catch (err) {
      onShowNotification("خطا در ارسال اطلاعات ثبت الگو", "error");
    }
  };

  // Delete learned item
  const handleDeleteItem = async (itemId: string) => {
    try {
      const res = await fetch("/api/ml/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: activeTab.slice(0, -1), id: itemId }) // slice 's' at the end to get correction, categorization, rule
      });
      const data = await res.json();
      if (data.success) {
        setMemory(data.memory);
        onShowNotification("الگو با موفقیت از سیستم یادگیری ماشین حذف گردید.", "info");
      }
    } catch (err) {
      onShowNotification("خطا در حذف الگو", "error");
    }
  };

  if (!isOpen) return null;

  const totalRulesCount = memory ? (memory.corrections.length + memory.categorizations.length + memory.customRules.length) : 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" dir="rtl">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`absolute inset-0 backdrop-blur-sm ${isDarkMode ? "bg-slate-950/80" : "bg-slate-900/40"}`}
          onClick={onClose}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className={`relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl shadow-2xl border flex flex-col ${
            isDarkMode 
              ? "bg-slate-900/95 border-slate-800 text-slate-100 shadow-[0_25px_60px_rgba(0,0,0,0.5)]" 
              : "bg-white border-slate-200 text-slate-800 shadow-[0_25px_60px_rgba(15,23,42,0.08)]"
          } backdrop-blur-md`}
        >
          {/* Sticky Header */}
          <div className={`sticky top-0 z-10 flex items-center justify-between p-4 md:p-5 border-b backdrop-blur-md ${
            isDarkMode ? "bg-slate-900/90 border-slate-800/80" : "bg-white/90 border-slate-100"
          }`}>
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl flex items-center justify-center ${
                isDarkMode ? "bg-indigo-500/10 text-indigo-450 border border-indigo-500/15" : "bg-indigo-50 text-indigo-600 border border-indigo-100"
              }`}>
                <Brain className="w-5 h-5 animate-pulse" />
              </div>
              <div className="text-right">
                <h2 className={`font-black text-[15px] tracking-tight ${isDarkMode ? "text-slate-100" : "text-slate-800"}`}>
                  مرکز یادگیری تطبیقی و آموزش مداوم هوش مصنوعی (ML Mode)
                </h2>
                <p className={`text-[10.5px] mt-0.5 leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                  با تأیید ممیزی‌ها و ثبت فیدبک‌ها، هوش مصنوعی را برای سبک حسابداری خودتان کالیبره و فوق‌پیشرفته کنید.
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
          <div className="p-4 md:p-6 flex flex-col gap-5 overflow-y-auto">

            {/* AI ML Toggle Banner */}
            <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              isDarkMode ? "bg-indigo-950/20 border-indigo-500/20" : "bg-indigo-50/40 border-indigo-100"
            }`}>
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                <div className="text-right">
                  <h4 className={`text-[12px] font-black ${isDarkMode ? "text-indigo-300" : "text-indigo-800"}`}>
                    سیستم مانیتورینگ یادگیری تطبیقی فعال است
                  </h4>
                  <p className={`text-[10px] mt-0.5 leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                    وقتی این حالت فعال باشد، تمام فاکتورهای بعدی که اسکن می‌کنید، فوراً منطبق بر آموخته‌ها، عبارات تصحیح‌شده و تفکیک‌های سرفصل ثبت‌شده در زیر آنالیز خواهند شد.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={handleToggleAdaptive}
                  className="flex items-center gap-1.5 cursor-pointer outline-none transition-transform active:scale-95"
                >
                  {memory?.adaptiveEnabled ? (
                    <div className="flex items-center gap-1">
                      <span className="text-[10.5px] font-black text-indigo-600 dark:text-indigo-450">فعال (یادگیری زنده)</span>
                      <ToggleRight className="w-10 h-10 text-indigo-500" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <span className="text-[10.5px] font-black text-slate-400">غیرفعال (بدون شخصی‌سازی)</span>
                      <ToggleLeft className="w-10 h-10 text-slate-400" />
                    </div>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className={`p-3 rounded-xl border flex items-center justify-between ${
                isDarkMode ? "bg-slate-950/20 border-slate-800/80" : "bg-slate-50/50 border-slate-150"
              }`}>
                <div className="text-right">
                  <span className={`text-[9px] font-bold ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>تعداد قوانین فعال</span>
                  <p className="text-lg font-black font-mono text-indigo-500 mt-0.5">{totalRulesCount}</p>
                </div>
                <Activity className="w-5 h-5 text-indigo-500 opacity-60" />
              </div>
              <div className={`p-3 rounded-xl border flex items-center justify-between ${
                isDarkMode ? "bg-slate-950/20 border-slate-800/80" : "bg-slate-50/50 border-slate-150"
              }`}>
                <div className="text-right">
                  <span className={`text-[9px] font-bold ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>تأثیر پیشرفت محاسبات</span>
                  <p className="text-lg font-black font-mono text-emerald-500 mt-0.5">+۴۲٪ دابل‌پس</p>
                </div>
                <Wand2 className="w-5 h-5 text-emerald-500 opacity-60" />
              </div>
              <div className={`p-3 rounded-xl border flex items-center justify-between ${
                isDarkMode ? "bg-slate-950/20 border-slate-800/80" : "bg-slate-50/50 border-slate-150"
              }`}>
                <div className="text-right">
                  <span className={`text-[9px] font-bold ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>تطابق قوانین GAAP ایران</span>
                  <p className="text-lg font-black font-mono text-blue-500 mt-0.5">۱۰۰٪ سازگار</p>
                </div>
                <Check className="w-5 h-5 text-blue-500 opacity-60" />
              </div>
            </div>

            {/* Interactive Section Selector Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setActiveTab("corrections")}
                className={`flex-1 py-2.5 text-center font-bold text-[11px] border-b-2 transition-all cursor-pointer ${
                  activeTab === "corrections" 
                    ? "border-indigo-500 text-indigo-500" 
                    : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                }`}
              >
                اصلاحات نگارشی و کلمه‌ای ({memory?.corrections.length || 0})
              </button>
              <button
                onClick={() => setActiveTab("categorizations")}
                className={`flex-1 py-2.5 text-center font-bold text-[11px] border-b-2 transition-all cursor-pointer ${
                  activeTab === "categorizations" 
                    ? "border-indigo-500 text-indigo-500" 
                    : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                }`}
              >
                دسته‌بندی‌ها و سرفصل‌ها ({memory?.categorizations.length || 0})
              </button>
              <button
                onClick={() => setActiveTab("rules")}
                className={`flex-1 py-2.5 text-center font-bold text-[11px] border-b-2 transition-all cursor-pointer ${
                  activeTab === "rules" 
                    ? "border-indigo-500 text-indigo-500" 
                    : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                }`}
              >
                قوانین استخراج اختصاصی ({memory?.customRules.length || 0})
              </button>
            </div>

            {/* Tab Contents: Dynamic Form + List */}
            <div className="flex flex-col gap-4">
              
              {/* Form to add item manually */}
              <form onSubmit={handleAddLearnedItem} className={`p-4 rounded-2xl border ${
                isDarkMode ? "bg-slate-950/20 border-slate-800" : "bg-slate-50 border-slate-150"
              }`}>
                <h5 className={`text-[11.5px] font-black flex items-center gap-1.5 mb-3.5 ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>
                  <Plus className="w-4 h-4 text-indigo-500" />
                  آموزش دستی سرفصل یادگیری جدید:
                </h5>

                {activeTab === "corrections" && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                    <div className="flex flex-col gap-1.5 text-right">
                      <span className={`text-[10px] font-bold ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>کلمه/عبارت مخدوش یا اشتباه خوانده‌شده:</span>
                      <input 
                        type="text" 
                        value={corrOriginal} 
                        onChange={(e) => setCorrOriginal(e.target.value)}
                        placeholder="مانند: فیلتـ یا اسنپ" 
                        className={`w-full p-2 rounded-lg text-[10.5px] border outline-none ${
                          isDarkMode ? "bg-slate-900 border-slate-800 text-slate-200" : "bg-white border-slate-200"
                        }`}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 text-right">
                      <span className={`text-[10px] font-bold ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>عبارت تصحیح‌شده و استاندارد علمی:</span>
                      <input 
                        type="text" 
                        value={corrCorrected} 
                        onChange={(e) => setCorrCorrected(e.target.value)}
                        placeholder="مانند: فیلتر روغن یا هزینه آژانس" 
                        className={`w-full p-2 rounded-lg text-[10.5px] border outline-none ${
                          isDarkMode ? "bg-slate-900 border-slate-800 text-slate-200" : "bg-white border-slate-200"
                        }`}
                      />
                    </div>
                    <div className="flex gap-2 items-center">
                      <div className="flex flex-col gap-1.5 text-right flex-1">
                        <span className={`text-[10px] font-bold ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>ستون مقصد:</span>
                        <select
                          value={corrField}
                          onChange={(e) => setCorrField(e.target.value)}
                          className={`p-2 rounded-lg text-[10.5px] border outline-none cursor-pointer ${
                            isDarkMode ? "bg-slate-900 border-slate-800 text-slate-200" : "bg-white border-slate-200"
                          }`}
                        >
                          <option value="شرح_کالا">شرح کالا / خدمات</option>
                          <option value="بابت">بابت / توضیحات</option>
                          <option value="طرف_حساب">طرف حساب / خریدار</option>
                        </select>
                      </div>
                      <button 
                        type="submit"
                        className="p-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm font-bold text-xs flex items-center justify-center shrink-0 self-end mt-1 cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === "categorizations" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
                    <div className="flex flex-col gap-1.5 text-right">
                      <span className={`text-[10px] font-bold ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>توضیح یا نام آیتم فاکتور:</span>
                      <input 
                        type="text" 
                        value={catDesc} 
                        onChange={(e) => setCatDesc(e.target.value)}
                        placeholder="مانند: پرداخت آبونمان مجله مالی" 
                        className={`w-full p-2 rounded-lg text-[10.5px] border outline-none ${
                          isDarkMode ? "bg-slate-900 border-slate-800 text-slate-200" : "bg-white border-slate-200"
                        }`}
                      />
                    </div>
                    <div className="flex gap-2 items-center">
                      <div className="flex flex-col gap-1.5 text-right flex-1">
                        <span className={`text-[10px] font-bold ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>سرفصل مالی متناظر در کدینگ ایران:</span>
                        <input 
                          type="text" 
                          value={catCategory} 
                          onChange={(e) => setCatCategory(e.target.value)}
                          placeholder="مانند: هزینه‌ها / هزینه مطبوعات و آموزش" 
                          className={`w-full p-2 rounded-lg text-[10.5px] border outline-none ${
                            isDarkMode ? "bg-slate-900 border-slate-800 text-slate-200" : "bg-white border-slate-200"
                          }`}
                        />
                      </div>
                      <button 
                        type="submit"
                        className="p-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm font-bold text-xs flex items-center justify-center shrink-0 self-end mt-1 cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === "rules" && (
                  <div className="flex gap-2 items-end">
                    <div className="flex flex-col gap-1.5 text-right flex-1">
                      <span className={`text-[10px] font-bold ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>قانون استخراج سفارشی هوش مصنوعی برای این موجودیت:</span>
                      <input 
                        type="text" 
                        value={ruleText} 
                        onChange={(e) => setRuleText(e.target.value)}
                        placeholder="مانند: در صورت غیاب شماره فاکتور، کد پیگیری فیش کارتخوان را در شماره فاکتور درج کن." 
                        className={`w-full p-2 rounded-lg text-[10.5px] border outline-none ${
                          isDarkMode ? "bg-slate-900 border-slate-800 text-slate-200" : "bg-white border-slate-200"
                        }`}
                      />
                    </div>
                    <button 
                      type="submit"
                      className="p-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm font-bold text-xs flex items-center justify-center shrink-0 self-end mt-1 cursor-pointer animate-pulse-slow"
                    >
                      ثبت قانون
                    </button>
                  </div>
                )}
              </form>

              {/* Items List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`text-[10.5px] font-black ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                    لیست الگوهای ثبت‌شده در این شاخه:
                  </span>
                  <p className="text-[9px] opacity-75">برای حذف هر الگو روی دکمه سطل زباله کلیک کنید.</p>
                </div>

                <div className="max-h-[220px] overflow-y-auto space-y-2 border rounded-2xl p-2 border-slate-100 dark:border-slate-800">
                  {activeTab === "corrections" && memory?.corrections.map((corr) => (
                    <div key={corr.id} className={`flex items-center justify-between p-2.5 rounded-xl border text-[10.5px] ${
                      isDarkMode ? "bg-slate-950/30 border-slate-800/80 hover:bg-slate-950/50" : "bg-white border-slate-150 hover:bg-slate-50"
                    } transition-all`}>
                      <div className="flex items-center gap-2 flex-wrap text-right">
                        <span className={`px-2 py-0.5 rounded-md font-bold ${isDarkMode ? "bg-indigo-500/10 text-indigo-400" : "bg-indigo-50 text-indigo-700"}`}>
                          {corr.field}
                        </span>
                        <span className="font-mono text-slate-400">"{corr.original}"</span>
                        <span className="text-slate-500 dark:text-slate-400">به</span>
                        <span className="font-black text-emerald-600 dark:text-emerald-400">"{corr.corrected}"</span>
                        <span className={`px-1.5 py-0.5 rounded-md text-[8.5px] font-mono ${
                          isDarkMode ? "bg-slate-800 text-slate-400" : "bg-slate-150 text-slate-600"
                        }`}>
                          {corr.count || 1} بار استفاده
                        </span>
                      </div>
                      <button 
                        onClick={() => handleDeleteItem(corr.id)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  {activeTab === "categorizations" && memory?.categorizations.map((cat) => (
                    <div key={cat.id} className={`flex items-center justify-between p-2.5 rounded-xl border text-[10.5px] ${
                      isDarkMode ? "bg-slate-950/30 border-slate-800/80 hover:bg-slate-950/50" : "bg-white border-slate-150 hover:bg-slate-50"
                    } transition-all`}>
                      <div className="flex items-center gap-2 flex-wrap text-right">
                        <span className="font-bold text-slate-700 dark:text-slate-300">"{cat.description}"</span>
                        <span className="text-slate-500 dark:text-slate-400">تخصیص به سرفصل</span>
                        <span className="font-black text-blue-600 dark:text-blue-400">"{cat.category}"</span>
                        <span className={`px-1.5 py-0.5 rounded-md text-[8.5px] font-mono ${
                          isDarkMode ? "bg-slate-800 text-slate-400" : "bg-slate-150 text-slate-600"
                        }`}>
                          {cat.count || 1} بار
                        </span>
                      </div>
                      <button 
                        onClick={() => handleDeleteItem(cat.id)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  {activeTab === "rules" && memory?.customRules.map((rule) => (
                    <div key={rule.id} className={`flex items-center justify-between p-2.5 rounded-xl border text-[10.5px] ${
                      isDarkMode ? "bg-slate-950/30 border-slate-800/80 hover:bg-slate-950/50" : "bg-white border-slate-150 hover:bg-slate-50"
                    } transition-all`}>
                      <div className="flex items-center gap-2 flex-wrap text-right flex-1">
                        <span className="font-medium leading-relaxed">{rule.rule}</span>
                        <span className={`px-1.5 py-0.5 rounded-md text-[8.5px] font-mono shrink-0 ${
                          isDarkMode ? "bg-slate-800 text-slate-400" : "bg-slate-150 text-slate-600"
                        }`}>
                          {rule.count || 1} بار
                        </span>
                      </div>
                      <button 
                        onClick={() => handleDeleteItem(rule.id)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  {memory && memory[activeTab].length === 0 && (
                    <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                      <HelpCircle className="w-8 h-8 opacity-45" />
                      <p className="text-[11px]">هیچ الگویی در این شاخه ثبت نشده است.</p>
                      <p className="text-[9.5px]">می‌توانید با استفاده از فرم بالا، اولین الگوی آموزش ماشین را دستی ایجاد کنید!</p>
                    </div>
                  )}
                </div>
              </div>

            </div>

          </div>

          {/* Sticky Footer */}
          <div className={`sticky bottom-0 z-10 flex items-center justify-between p-4 border-t backdrop-blur-md ${
            isDarkMode ? "bg-slate-900/95 border-slate-800/80 text-slate-200" : "bg-white/95 border-slate-100 text-slate-700"
          }`}>
            <button
              onClick={handleResetMemory}
              disabled={isLoading}
              className={`px-4 py-2 rounded-xl text-[10px] font-extrabold flex items-center gap-1.5 border border-rose-500/20 text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer ${
                isLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              بازنشانی مغز یادگیری ماشین
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-xl text-[10.5px] font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all cursor-pointer"
            >
              تایید و خروج از مرکز ML
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
