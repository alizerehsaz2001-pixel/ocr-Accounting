import React, { useState, useRef, useEffect } from "react";
import { 
  ShieldAlert, 
  ShieldCheck, 
  Sliders, 
  AlertTriangle, 
  Activity, 
  Sparkles, 
  CheckCircle2, 
  Calendar, 
  UserX, 
  User, 
  Coins, 
  Tag, 
  FileText, 
  Wrench, 
  ArrowLeftRight,
  TrendingUp,
  Check,
  Zap,
  Info
} from "lucide-react";
import { TransactionItem } from "../types";

interface SmartAuditDashboardProps {
  transactions: TransactionItem[];
  minConfidenceThreshold: number;
  setMinConfidenceThreshold: (val: number) => void;
  activeValidationSubTab: 'threshold' | 'risk' | 'fields' | 'auto-repair';
  setActiveValidationSubTab: (tab: 'threshold' | 'risk' | 'fields' | 'auto-repair') => void;
  isDarkMode: boolean;
  mainCurrency: string;
  setTransactions: (updated: TransactionItem[]) => void;
  setRawJsonText: (json: string) => void;
  logEvent: (action: string, details: string) => void;
  showNotification: (msg: string, type: "success" | "error" | "info" | "warning") => void;
}

export default function SmartAuditDashboard({
  transactions,
  minConfidenceThreshold,
  setMinConfidenceThreshold,
  activeValidationSubTab,
  setActiveValidationSubTab,
  isDarkMode,
  mainCurrency,
  setTransactions,
  setRawJsonText,
  logEvent,
  showNotification,
}: SmartAuditDashboardProps) {
  // Slider dragging & mouse mouse-move sync state
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);
  const [mousePosPercent, setMousePosPercent] = useState<number>(minConfidenceThreshold);
  const [isRtl, setIsRtl] = useState(true);

  // Detect text direction on mount for flawless coordinate mapping
  useEffect(() => {
    if (sliderRef.current) {
      const dir = window.getComputedStyle(sliderRef.current).direction;
      setIsRtl(dir === "rtl");
    }
  }, []);

  // Sync mouse position percent when value changes
  useEffect(() => {
    if (!isDraggingSlider) {
      setMousePosPercent(minConfidenceThreshold);
    }
  }, [minConfidenceThreshold, isDraggingSlider]);

  // Handle pointer/mouse position calculation along the slider track
  const updateSliderFromPointer = (clientX: number) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const width = rect.width;
    if (width <= 0) return;

    let offsetX = clientX - rect.left;
    if (offsetX < 0) offsetX = 0;
    if (offsetX > width) offsetX = width;

    // Flawless direction-aware coordinate mapping
    let percent = isRtl
      ? Math.round((1 - offsetX / width) * 100)
      : Math.round((offsetX / width) * 100);

    if (percent < 0) percent = 0;
    if (percent > 100) percent = 100;

    // Snap to steps of 5 for smooth precision
    percent = Math.round(percent / 5) * 5;

    setMousePosPercent(percent);
    setMinConfidenceThreshold(percent);
  };

  // Attach global window listeners for buttery-smooth mouse tracking even outside the slider container
  useEffect(() => {
    if (isDraggingSlider) {
      const handleGlobalMove = (e: PointerEvent) => {
        updateSliderFromPointer(e.clientX);
      };
      const handleGlobalUp = () => {
        setIsDraggingSlider(false);
      };

      window.addEventListener("pointermove", handleGlobalMove);
      window.addEventListener("pointerup", handleGlobalUp);
      return () => {
        window.removeEventListener("pointermove", handleGlobalMove);
        window.removeEventListener("pointerup", handleGlobalUp);
      };
    }
  }, [isDraggingSlider]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDraggingSlider(true);
    updateSliderFromPointer(e.clientX);
  };

  // ---------------- Audit Metrics Calculations ----------------
  const totalRows = transactions.length;

  const totalDebit = transactions.reduce((sum, t) => sum + (Number(t.مبلغ_بدهکار) || 0), 0);
  const totalCredit = transactions.reduce((sum, t) => sum + (Number(t.مبلغ_بستانکار) || 0), 0);
  const imbalanceAmount = Math.abs(totalDebit - totalCredit);
  const isBalanced = imbalanceAmount <= 10;

  const perfectConfCount = transactions.filter(t => (t.ضریب_اطمینان ?? 100) === 100).length;
  const lowConfCount = transactions.filter(t => (t.ضریب_اطمینان ?? 100) < 70).length;

  // Calculate Overall Document Health Score (0 to 100)
  let healthScore = 100;
  if (totalRows > 0) {
    let scoreDeductions = 0;
    if (!isBalanced) scoreDeductions += 25; // Imbalance penalty
    
    const lowConfRatio = lowConfCount / totalRows;
    scoreDeductions += Math.round(lowConfRatio * 30); // Low confidence penalty

    // Non-standard date penalty
    const badDateCount = transactions.filter(t => {
      const dt = t.تاریخ || "";
      return !dt || dt === "-" || !/^\d{4}\/\d{2}\/\d{2}$/.test(dt);
    }).length;
    scoreDeductions += Math.min(20, Math.round((badDateCount / totalRows) * 20));

    // Missing counterparty penalty
    const emptyParties = transactions.filter(t => !t.نام_طرف_حساب || t.نام_طرف_حساب === "-").length;
    scoreDeductions += Math.min(25, Math.round((emptyParties / totalRows) * 25));

    healthScore = Math.max(0, 100 - scoreDeductions);
  }

  // Tier counts
  const tier90 = transactions.filter(t => (t.ضریب_اطمینان ?? 100) >= 90).length;
  const tier70 = transactions.filter(t => (t.ضریب_اطمینان ?? 100) >= 70 && (t.ضریب_اطمینان ?? 100) < 90).length;
  const tier50 = transactions.filter(t => (t.ضریب_اطمینان ?? 100) >= 50 && (t.ضریب_اطمینان ?? 100) < 70).length;
  const tierUnder50 = transactions.filter(t => (t.ضریب_اطمینان ?? 100) < 50).length;

  // Passed / Filtered by current threshold
  const passedCount = transactions.filter(t => (t.ضریب_اطمینان ?? 100) >= minConfidenceThreshold).length;
  const hiddenCount = totalRows - passedCount;
  const passPercent = totalRows > 0 ? Math.round((passedCount / totalRows) * 100) : 100;

  // Auto Repair Issues
  const autoRepairIssues: Array<{
    id: string;
    type: "math" | "balance" | "date" | "party";
    title: string;
    desc: string;
    fixable: boolean;
    onFix: () => void;
  }> = [];

  // Check math: Qty * Price
  transactions.forEach((tr, idx) => {
    const qty = Number(tr.تعداد) || 0;
    const price = Number(tr.فی) || Number(tr.قیمت_واحد) || 0;
    const totalVal = Number(tr.مبلغ_کل) || Number(tr.مبلغ_بدهکار) || Number(tr.مبلغ_بستانکار) || 0;
    if (qty > 0 && price > 0 && totalVal > 0) {
      const expected = qty * price;
      if (Math.abs(expected - totalVal) > 10) {
        autoRepairIssues.push({
          id: `math-${idx}`,
          type: "math",
          title: `مغایرت محاسبه حاصل‌ضرب در سطر ${(idx + 1).toLocaleString("fa-IR")}`,
          desc: `تعداد (${qty.toLocaleString("fa-IR")}) × فی (${price.toLocaleString("fa-IR")}) برابر با ${expected.toLocaleString("fa-IR")} ${mainCurrency} است اما مقدار ثبت شده ${totalVal.toLocaleString("fa-IR")} است.`,
          fixable: true,
          onFix: () => {
            const updated = [...transactions];
            updated[idx] = { ...updated[idx], مبلغ_کل: expected, مبلغ_بدهکار: tr.مبلغ_بدهکار ? expected : 0, مبلغ_بستانکار: tr.مبلغ_بستانکار ? expected : 0 };
            setTransactions(updated);
            try { setRawJsonText(JSON.stringify(updated, null, 2)); } catch (e) {}
            showNotification(`مغایرت سطر ${(idx + 1).toLocaleString("fa-IR")} با موفقیت تصحیح شد.`, "success");
          }
        });
      }
    }
  });

  // Check balance
  if (!isBalanced) {
    const isDebitHeavy = totalDebit > totalCredit;
    const sideName = isDebitHeavy ? "بستانکار" : "بدهکار";
    autoRepairIssues.push({
      id: "balance-mismatch",
      type: "balance",
      title: "عدم توازن سند (اختلاف بدهکار و بستانکار)",
      desc: `مجموع بدهکار (${totalDebit.toLocaleString("fa-IR")}) با بستانکار (${totalCredit.toLocaleString("fa-IR")}) به میزان ${imbalanceAmount.toLocaleString("fa-IR")} ${mainCurrency} اختلاف دارد.`,
      fixable: true,
      onFix: () => {
        const adjustmentRow: TransactionItem = {
          id: "auto-bal-" + Date.now(),
          شماره_سند: transactions.length > 0 ? (transactions[transactions.length - 1].شماره_سند || "-") : "-",
          تاریخ: transactions.length > 0 ? (transactions[transactions.length - 1].تاریخ || "-") : "-",
          نام_طرف_حساب: "تعدیل سیستمی (Auto-Balance)",
          شرح: "رفع گردکردن و عدم توازن سند",
          مبلغ_بدهکار: isDebitHeavy ? 0 : imbalanceAmount,
          مبلغ_بستانکار: isDebitHeavy ? imbalanceAmount : 0,
          نوع_ارز: mainCurrency,
          توضیحات: "اصلاح تراز هوشمند",
          ضریب_اطمینان: 100
        };
        const updated = [...transactions, adjustmentRow];
        setTransactions(updated);
        try { setRawJsonText(JSON.stringify(updated, null, 2)); } catch (e) {}
        logEvent("تعدیل خودکار سند", `ردیف تعدیلی به مبلغ ${imbalanceAmount} اضافه شد.`);
        showNotification(`ردیف تعدیلی جهت موازنه سند در سمت ${sideName} اضافه شد.`, "success");
      }
    });
  }

  // Handle batch fixes
  const handleFixAllDates = () => {
    let fixCount = 0;
    const updated = transactions.map(t => {
      let dt = t.تاریخ || "";
      if (!dt || dt === "-") {
        fixCount++;
        return { ...t, تاریخ: "1403/01/01" };
      }
      // Clean non-digits
      const digits = dt.replace(/[^\d]/g, "");
      if (digits.length === 8) {
        fixCount++;
        return { ...t, تاریخ: `${digits.substring(0, 4)}/${digits.substring(4, 6)}/${digits.substring(6, 8)}` };
      }
      return t;
    });

    setTransactions(updated);
    try { setRawJsonText(JSON.stringify(updated, null, 2)); } catch (e) {}
    logEvent("اصلاح دسته‌جمعی تاریخ‌ها", `${fixCount} سطر تاریخ استانداردسازی شد.`);
    showNotification(`فرمت تاریخ ${fixCount.toLocaleString("fa-IR")} سطر با موفقیت استاندارد شد.`, "success");
  };

  const handleFixAllMissingParties = () => {
    let count = 0;
    const updated = transactions.map(t => {
      if (!t.نام_طرف_حساب || t.نام_طرف_حساب.trim() === "" || t.نام_طرف_حساب === "-") {
        count++;
        return { ...t, نام_طرف_حساب: "سرفصل عمومی / سایر" };
      }
      return t;
    });

    setTransactions(updated);
    try { setRawJsonText(JSON.stringify(updated, null, 2)); } catch (e) {}
    logEvent("تکمیل طرف حساب‌های خالی", `${count} سطر اصلاح گردید.`);
    showNotification(`سرفصل ${count.toLocaleString("fa-IR")} سطر نامشخص به سرفصل عمومی تغییر یافت.`, "success");
  };

  const handleApproveAllThreshold = () => {
    const updated = transactions.map(t => {
      if ((t.ضریب_اطمینان ?? 100) >= minConfidenceThreshold) {
        return { ...t, ضریب_اطمینان: 100 };
      }
      return t;
    });

    setTransactions(updated);
    try { setRawJsonText(JSON.stringify(updated, null, 2)); } catch (e) {}
    logEvent("تایید دسته‌جمعی اقلام", `ارتقا به دقت ۱۰۰٪ برای تراکنش‌های بالای ${minConfidenceThreshold}٪ انجام شد.`);
    showNotification(`تعداد ${passedCount.toLocaleString("fa-IR")} سطر با موفقیت به دقت ۱۰۰٪ ارتقا یافتند.`, "success");
  };

  return (
    <div className={`p-4 md:p-5 rounded-2xl border transition-all duration-300 shadow-sm ${
      isDarkMode ? "bg-[#111827] border-slate-800/80 text-slate-100" : "bg-white border-slate-200 text-slate-800"
    }`} dir="rtl">
      {/* ---------------- Top Section: Overview Audit Score & Metric Badges ---------------- */}
      <div className="flex flex-col lg:flex-row items-stretch justify-between gap-4 pb-5 mb-5 border-b border-slate-200/80 dark:border-slate-800/80">
        {/* Document Audit Health Score Gauge */}
        <div className={`p-4 rounded-2xl border flex items-center gap-4 transition-all ${
          isDarkMode 
            ? "bg-gradient-to-br from-slate-900 to-slate-900/60 border-slate-800" 
            : "bg-gradient-to-br from-slate-50 to-slate-100/60 border-slate-200/90"
        } min-w-[280px]`}>
          <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
            <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
              <path
                className={`${isDarkMode ? "text-slate-800" : "text-slate-200"}`}
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={`transition-all duration-1000 ease-out ${
                  healthScore >= 85 ? "text-emerald-500" : healthScore >= 65 ? "text-amber-500" : "text-rose-500"
                }`}
                strokeDasharray={`${healthScore}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute font-mono font-black text-xs">
              {healthScore.toLocaleString("fa-IR")}٪
            </span>
          </div>

          <div className="flex flex-col text-right justify-center">
            <div className="flex items-center gap-1.5 mb-1">
              <ShieldAlert className={`w-4 h-4 ${
                healthScore >= 85 ? "text-emerald-500" : healthScore >= 65 ? "text-amber-500" : "text-rose-500"
              }`} />
              <span className="text-xs font-black tracking-tight">شاخص صحت و سلامت سند</span>
            </div>
            <span className={`text-[10px] font-bold ${
              healthScore >= 85 ? "text-emerald-500" : healthScore >= 65 ? "text-amber-500" : "text-rose-500"
            }`}>
              {healthScore >= 85 ? "عالی - آماده صدور سند حسابداری" : healthScore >= 65 ? "متوازن با هشدارهای ساختاری" : "نیازمند ممیزی و رفع مغایرت فوریا"}
            </span>
            <span className="text-[9px] text-slate-400 mt-0.5 font-sans">
              سنجش جامع بر اساس تراز دوطرفه و کیفیت OCR
            </span>
          </div>
        </div>

        {/* 4 Summary Quick Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 flex-1">
          <div className={`p-3 rounded-xl border flex flex-col justify-center text-right transition-all ${
            isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-slate-50 border-slate-200/70"
          }`}>
            <span className="text-[9.5px] font-bold text-slate-400 mb-1 flex items-center gap-1">
              <FileText className="w-3 h-3 text-blue-500" />
              کل اقلام استخراج‌شده:
            </span>
            <span className="text-sm font-black font-mono text-slate-700 dark:text-slate-200">
              {totalRows.toLocaleString("fa-IR")} <span className="text-[9px] font-normal opacity-70">ردیف</span>
            </span>
          </div>

          <div className={`p-3 rounded-xl border flex flex-col justify-center text-right transition-all ${
            isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-slate-50 border-slate-200/70"
          }`}>
            <span className="text-[9.5px] font-bold text-slate-400 mb-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              اقلام ۱۰۰٪ تایید شده:
            </span>
            <span className="text-sm font-black font-mono text-emerald-500">
              {perfectConfCount.toLocaleString("fa-IR")} <span className="text-[9px] font-normal opacity-70">ردیف</span>
            </span>
          </div>

          <div className={`p-3 rounded-xl border flex flex-col justify-center text-right transition-all ${
            isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-slate-50 border-slate-200/70"
          }`}>
            <span className="text-[9.5px] font-bold text-slate-400 mb-1 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-amber-500" />
              اقلام کم‌دقت (زیر ۷۰٪):
            </span>
            <span className={`text-sm font-black font-mono ${lowConfCount > 0 ? "text-amber-500" : "text-slate-400"}`}>
              {lowConfCount.toLocaleString("fa-IR")} <span className="text-[9px] font-normal opacity-70">ردیف</span>
            </span>
          </div>

          <div className={`p-3 rounded-xl border flex flex-col justify-center text-right transition-all ${
            isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-slate-50 border-slate-200/70"
          }`}>
            <span className="text-[9.5px] font-bold text-slate-400 mb-1 flex items-center gap-1">
              <ArrowLeftRight className="w-3 h-3 text-indigo-500" />
              انحراف تراز بدهکار/بستانکار:
            </span>
            <span className={`text-sm font-black font-mono ${isBalanced ? "text-emerald-500" : "text-rose-500"}`}>
              {imbalanceAmount.toLocaleString("fa-IR")} <span className="text-[9px] font-normal opacity-70">{mainCurrency}</span>
            </span>
          </div>
        </div>
      </div>

      {/* ---------------- Sub-Tabs Header Navigation ---------------- */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800/80 pb-3 mb-4 font-sans">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-xl border ${
            isDarkMode ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" : "bg-indigo-50 text-indigo-600 border-indigo-100"
          }`}>
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black tracking-tight">داشبورد هوشمند ممیزی اسناد</h4>
            <p className="text-[9.5px] text-slate-400 font-medium">ارزیابی بر اساس قوانین استاندارد حسابداری و OCR</p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap bg-slate-100 dark:bg-slate-950 p-1 rounded-xl gap-1 border border-slate-200 dark:border-slate-800/80 shadow-inner">
          <button
            type="button"
            onClick={() => setActiveValidationSubTab('threshold')}
            className={`px-3 py-1.5 text-[9.5px] font-extrabold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeValidationSubTab === 'threshold'
                ? (isDarkMode ? "bg-slate-800 text-white shadow-sm ring-1 ring-slate-700" : "bg-white text-slate-800 shadow-sm ring-1 ring-slate-200/50")
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
            }`}
          >
            <Sliders className={`w-3.5 h-3.5 ${activeValidationSubTab === 'threshold' ? "text-indigo-500" : ""}`} />
            <span>شبیه‌ساز آستانه ({minConfidenceThreshold.toLocaleString("fa-IR")}٪)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveValidationSubTab('risk')}
            className={`px-3 py-1.5 text-[9.5px] font-extrabold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeValidationSubTab === 'risk'
                ? (isDarkMode ? "bg-slate-800 text-white shadow-sm ring-1 ring-slate-700" : "bg-white text-slate-800 shadow-sm ring-1 ring-slate-200/50")
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
            }`}
          >
            <AlertTriangle className={`w-3.5 h-3.5 ${activeValidationSubTab === 'risk' ? "text-amber-500" : ""}`} />
            <span>تحلیل مخاطرات</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveValidationSubTab('fields')}
            className={`px-3 py-1.5 text-[9.5px] font-extrabold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeValidationSubTab === 'fields'
                ? (isDarkMode ? "bg-slate-800 text-white shadow-sm ring-1 ring-slate-700" : "bg-white text-slate-800 shadow-sm ring-1 ring-slate-200/50")
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
            }`}
          >
            <Activity className={`w-3.5 h-3.5 ${activeValidationSubTab === 'fields' ? "text-emerald-500" : ""}`} />
            <span>پوشش فیلدها</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveValidationSubTab('auto-repair')}
            className={`px-3 py-1.5 text-[9.5px] font-extrabold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeValidationSubTab === 'auto-repair'
                ? (isDarkMode ? "bg-slate-800 text-white shadow-sm ring-1 ring-slate-700" : "bg-white text-slate-800 shadow-sm ring-1 ring-slate-200/50")
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${activeValidationSubTab === 'auto-repair' ? "text-blue-500 animate-pulse" : ""}`} />
            <span>خوداصلاحی ریاضی ({autoRepairIssues.length.toLocaleString("fa-IR")})</span>
          </button>
        </div>
      </div>

      {/* ---------------- Sub-Tab 1: Threshold Simulator (Interactive Mouse Slider) ---------------- */}
      {activeValidationSubTab === 'threshold' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="space-y-1 flex-1">
              <h5 className="text-[11.5px] font-extrabold flex items-center gap-2">
                تنظیم آستانه فیلتر ضریب اطمینان (Mouse Drag Synced Slider)
              </h5>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                با جابجا کردن نوار لغزنده موس، اقلام مخدوش یا با ضریب اطمینان پایین‌تر به طور زنده تفکیک می‌شوند.
              </p>
            </div>

            {/* Current Value Display & Reset */}
            <div className="flex items-center gap-2">
              {minConfidenceThreshold > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setMinConfidenceThreshold(0);
                    setMousePosPercent(0);
                  }}
                  className="text-[9.5px] font-bold text-rose-500 hover:text-rose-600 bg-rose-500/10 hover:bg-rose-500/20 px-2.5 py-1 rounded-lg transition cursor-pointer"
                >
                  حذف فیلتر
                </button>
              )}
              <span className="text-xs font-black font-mono text-indigo-500 bg-indigo-500/10 py-1 px-3 rounded-lg border border-indigo-500/20">
                {minConfidenceThreshold.toLocaleString("fa-IR")}٪
              </span>
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] text-slate-400 font-bold ml-1">میانبرهای سریع:</span>
            {[
              { label: "۰٪ (مشاهده همه)", val: 0 },
              { label: "۵۰٪ (حذف خطاهای فاحش)", val: 50 },
              { label: "۷۰٪ (حد ممیزی)", val: 70 },
              { label: "۹۰٪ (دقت عالی)", val: 90 },
            ].map((p) => (
              <button
                key={p.val}
                type="button"
                onClick={() => {
                  setMinConfidenceThreshold(p.val);
                  setMousePosPercent(p.val);
                }}
                className={`px-2.5 py-1 rounded-lg text-[9.5px] font-bold transition border cursor-pointer ${
                  minConfidenceThreshold === p.val
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                    : isDarkMode
                    ? "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"
                    : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Mouse Drag Interactive Slider Bar Container */}
          <div className={`p-4 rounded-2xl border transition-all ${
            isDarkMode ? "bg-slate-900/60 border-slate-800" : "bg-slate-50 border-slate-200"
          }`}>
            <div className="relative pt-6 pb-2">
              {/* Floating Tooltip Pill following mouse/thumb */}
              <div
                className="absolute top-0 transition-all duration-75 pointer-events-none z-10"
                style={isRtl 
                  ? { right: `${mousePosPercent}%`, transform: "translate(50%, 0)" }
                  : { left: `${mousePosPercent}%`, transform: "translate(-50%, 0)" }
                }
              >
                <div className="bg-indigo-600 text-white text-[9.5px] font-black font-mono px-2 py-0.5 rounded-full shadow-lg border border-indigo-400/30 flex items-center gap-1 whitespace-nowrap">
                  <span>{mousePosPercent.toLocaleString("fa-IR")}٪</span>
                  {isDraggingSlider && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />}
                </div>
              </div>

              {/* Slider Track Element with Pointer Mouse Events */}
              <div
                ref={sliderRef}
                onPointerDown={handlePointerDown}
                className="relative h-3 w-full rounded-full select-none group touch-none"
                style={{
                  background: isDarkMode ? "#1e293b" : "#e2e8f0",
                }}
              >
                {/* Filled Gradient Progress Track */}
                <div
                  className="absolute top-0 bottom-0 rounded-full bg-gradient-to-l from-indigo-500 via-indigo-600 to-blue-500 shadow-sm transition-all"
                  style={isRtl
                    ? { right: 0, width: `${mousePosPercent}%` }
                    : { left: 0, width: `${mousePosPercent}%` }
                  }
                />

                {/* Invisible Native Range Input Overlay for flawless native mouse / touch drag */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={minConfidenceThreshold}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setMinConfidenceThreshold(val);
                    setMousePosPercent(val);
                  }}
                  onMouseDown={() => setIsDraggingSlider(true)}
                  onMouseUp={() => setIsDraggingSlider(false)}
                  onTouchStart={() => setIsDraggingSlider(true)}
                  onTouchEnd={() => setIsDraggingSlider(false)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                  style={{ direction: isRtl ? "rtl" : "ltr" }}
                />

                {/* Draggable Mouse Thumb Handle */}
                <div
                  className="absolute top-1/2 rounded-full w-6 h-6 bg-white dark:bg-slate-900 border-2 border-indigo-600 shadow-md flex items-center justify-center transition-transform group-hover:scale-110 active:scale-125 pointer-events-none z-10"
                  style={isRtl
                    ? { right: `${mousePosPercent}%`, transform: "translate(50%, -50%)" }
                    : { left: `${mousePosPercent}%`, transform: "translate(-50%, -50%)" }
                  }
                >
                  <div className="w-2 h-2 rounded-full bg-indigo-600" />
                </div>
              </div>

              {/* Track Axis Labels */}
              <div className="flex justify-between items-center text-[9px] font-mono font-bold text-slate-400 mt-2">
                <span>{isRtl ? "۱۰۰٪ (بالاترین دقت)" : "۰٪ (نمایش همه)"}</span>
                <span>۵۰٪</span>
                <span>{isRtl ? "۰٪ (نمایش همه)" : "۱۰۰٪ (بالاترین دقت)"}</span>
              </div>
            </div>
          </div>

          {/* Confidence Quality Tier Distribution Histogram */}
          <div className="space-y-2 pt-2">
            <span className="text-[10px] font-bold text-slate-400 block">توزیع کیفیت استخراج بر اساس سطح اطمینان:</span>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              {[
                { title: "۹۰٪ - ۱۰۰٪ (عالی)", count: tier90, color: "bg-emerald-500", text: "text-emerald-500", val: 90 },
                { title: "۷۰٪ - ۸۹٪ (خوب)", count: tier70, color: "bg-blue-500", text: "text-blue-500", val: 70 },
                { title: "۵۰٪ - ۶۹٪ (مشکوک)", count: tier50, color: "bg-amber-500", text: "text-amber-500", val: 50 },
                { title: "زیر ۵۰٪ (مخدوش)", count: tierUnder50, color: "bg-rose-500", text: "text-rose-500", val: 0 },
              ].map((tier, i) => {
                const ratio = totalRows > 0 ? Math.round((tier.count / totalRows) * 100) : 0;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setMinConfidenceThreshold(tier.val);
                      setMousePosPercent(tier.val);
                    }}
                    className={`p-3 rounded-xl border text-right transition cursor-pointer hover:border-indigo-500/50 ${
                      isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-bold mb-1">
                      <span>{tier.title}</span>
                      <span className={`font-mono ${tier.text}`}>{tier.count.toLocaleString("fa-IR")} ردیف</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full ${tier.color}`} style={{ width: `${ratio}%` }} />
                    </div>
                    <span className="text-[9px] text-slate-400 font-mono mt-1 block">
                      {ratio.toLocaleString("fa-IR")}٪ از کل اسناد
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200/80 dark:border-slate-800/80">
            <div className="text-[10px] font-bold text-slate-500">
              <span>وضعیت فیلتر جاری: </span>
              <span className="text-emerald-500 font-mono">{passedCount.toLocaleString("fa-IR")} سطر مجاز</span>
              {hiddenCount > 0 && (
                <span className="text-amber-500 font-mono mr-2">({hiddenCount.toLocaleString("fa-IR")} سطر پنهان شده)</span>
              )}
            </div>

            <button
              type="button"
              disabled={passedCount === 0}
              onClick={handleApproveAllThreshold}
              className={`px-4 py-2 rounded-xl text-[10.5px] font-black transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm ${
                passedCount > 0
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95"
                  : "bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>تایید دسته‌جمعی و ارتقا به ۱۰۰٪ دقت</span>
            </button>
          </div>
        </div>
      )}

      {/* ---------------- Sub-Tab 2: Risk Analysis (Fix Buttons) ---------------- */}
      {activeValidationSubTab === 'risk' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <h5 className="text-[11.5px] font-extrabold flex items-center gap-2">
            تحلیل هوشمند ریسک و ناهماهنگی اسناد
          </h5>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Risk Card 1: Balance Mismatch */}
            <div className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 transition-all ${
              isBalanced 
                ? (isDarkMode ? "bg-emerald-950/20 border-emerald-900/40" : "bg-emerald-50/70 border-emerald-200")
                : (isDarkMode ? "bg-rose-950/20 border-rose-900/40" : "bg-rose-50/70 border-rose-200")
            }`}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-xl shrink-0 ${isBalanced ? "bg-emerald-500/20 text-emerald-500" : "bg-rose-500/20 text-rose-500"}`}>
                  {isBalanced ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5 animate-pulse" />}
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-black block">موازنه دوطرفه حسابداری</span>
                  <p className="text-[10px] leading-relaxed text-slate-600 dark:text-slate-300">
                    {isBalanced ? (
                      "انطباق کامل ریاضی! مجموع مبالغ بدهکار با بستانکار همخوانی دارد."
                    ) : (
                      <>
                        هشدار! اختلاف موازنه به مبلغ{" "}
                        <span className="font-bold font-mono text-rose-600 dark:text-rose-400">
                          {imbalanceAmount.toLocaleString("fa-IR")} {mainCurrency}
                        </span>{" "}
                        شناسایی شد.
                      </>
                    )}
                  </p>
                </div>
              </div>

              {!isBalanced && (
                <button
                  type="button"
                  onClick={() => {
                    const isDebitHeavy = totalDebit > totalCredit;
                    const adjustmentRow: TransactionItem = {
                      id: "auto-bal-" + Date.now(),
                      شماره_سند: transactions.length > 0 ? (transactions[transactions.length - 1].شماره_سند || "-") : "-",
                      تاریخ: transactions.length > 0 ? (transactions[transactions.length - 1].تاریخ || "-") : "-",
                      نام_طرف_حساب: "تعدیل سیستمی (Auto-Balance)",
                      شرح: "رفع گردکردن و عدم توازن سند",
                      مبلغ_بدهکار: isDebitHeavy ? 0 : imbalanceAmount,
                      مبلغ_بستانکار: isDebitHeavy ? imbalanceAmount : 0,
                      نوع_ارز: mainCurrency,
                      توضیحات: "اصلاح تراز هوشمند",
                      ضریب_اطمینان: 100
                    };
                    const updated = [...transactions, adjustmentRow];
                    setTransactions(updated);
                    try { setRawJsonText(JSON.stringify(updated, null, 2)); } catch (e) {}
                    logEvent("تعدیل خودکار سند", `ردیف تعدیلی اضافه گردید.`);
                    showNotification("ردیف تعدیلی جهت موازنه دوطرفه اضافه شد.", "success");
                  }}
                  className="w-full py-2 px-3 rounded-xl text-[10px] font-extrabold bg-rose-600 hover:bg-rose-700 text-white transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>اصلاح و اضافه کردن ردیف تعدیلی برای موازنه</span>
                </button>
              )}
            </div>

            {/* Risk Card 2: Date Formats */}
            {(() => {
              const badDatesCount = transactions.filter(t => {
                const dt = t.تاریخ || "";
                return !dt || dt === "-" || !/^\d{4}\/\d{2}\/\d{2}$/.test(dt);
              }).length;

              return (
                <div className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 transition-all ${
                  badDatesCount === 0 
                    ? (isDarkMode ? "bg-emerald-950/20 border-emerald-900/40" : "bg-emerald-50/70 border-emerald-200")
                    : (isDarkMode ? "bg-amber-950/20 border-amber-900/40" : "bg-amber-50/70 border-amber-200")
                }`}>
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-xl shrink-0 ${badDatesCount === 0 ? "bg-emerald-500/20 text-emerald-500" : "bg-amber-500/20 text-amber-500"}`}>
                      {badDatesCount === 0 ? <CheckCircle2 className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
                    </div>
                    <div className="space-y-1">
                      <span className="text-[11px] font-black block">صحت ساختاری تاریخ اسناد</span>
                      <p className="text-[10px] leading-relaxed text-slate-600 dark:text-slate-300">
                        {badDatesCount === 0 ? (
                          "تمامی تاریخ‌ها طبق فرمت استاندارد خورشیدی (YYYY/MM/DD) ثبت شده‌اند."
                        ) : (
                          <>
                            تعداد <span className="font-bold font-mono text-amber-600 dark:text-amber-400">{badDatesCount.toLocaleString("fa-IR")} ردیف</span> فاقد فرمت ساختاری استاندارد تاریخ هستند.
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  {badDatesCount > 0 && (
                    <button
                      type="button"
                      onClick={handleFixAllDates}
                      className="w-full py-2 px-3 rounded-xl text-[10px] font-extrabold bg-amber-600 hover:bg-amber-700 text-white transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>استانداردسازی خودکار تمامی تاریخ‌ها</span>
                    </button>
                  )}
                </div>
              );
            })()}

            {/* Risk Card 3: Missing Counterparties */}
            {(() => {
              const emptyParties = transactions.filter(t => !t.نام_طرف_حساب || t.نام_طرف_حساب === "-" || t.نام_طرف_حساب.trim() === "").length;

              return (
                <div className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 transition-all ${
                  emptyParties === 0 
                    ? (isDarkMode ? "bg-emerald-950/20 border-emerald-900/40" : "bg-emerald-50/70 border-emerald-200")
                    : (isDarkMode ? "bg-amber-950/20 border-amber-900/40" : "bg-amber-50/70 border-amber-200")
                }`}>
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-xl shrink-0 ${emptyParties === 0 ? "bg-emerald-500/20 text-emerald-500" : "bg-amber-500/20 text-amber-500"}`}>
                      {emptyParties === 0 ? <CheckCircle2 className="w-5 h-5" /> : <UserX className="w-5 h-5" />}
                    </div>
                    <div className="space-y-1">
                      <span className="text-[11px] font-black block">ثبت سرفصل (طرف حساب مالی)</span>
                      <p className="text-[10px] leading-relaxed text-slate-600 dark:text-slate-300">
                        {emptyParties === 0 ? (
                          "سرفصل و طرف حساب کلیه تراکنش‌ها با دقت مشخص شده است."
                        ) : (
                          <>
                            در <span className="font-bold font-mono text-amber-600 dark:text-amber-400">{emptyParties.toLocaleString("fa-IR")} ردیف</span> نام طرف حساب مشخص نشده است.
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  {emptyParties > 0 && (
                    <button
                      type="button"
                      onClick={handleFixAllMissingParties}
                      className="w-full py-2 px-3 rounded-xl text-[10px] font-extrabold bg-amber-600 hover:bg-amber-700 text-white transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>تعیین سرفصل عمومی برای طرف حساب‌های خالی</span>
                    </button>
                  )}
                </div>
              );
            })()}

            {/* Risk Card 4: OCR Quality */}
            <div className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 transition-all ${
              lowConfCount === 0 
                ? (isDarkMode ? "bg-emerald-950/20 border-emerald-900/40" : "bg-emerald-50/70 border-emerald-200")
                : (isDarkMode ? "bg-rose-950/20 border-rose-900/40" : "bg-rose-50/70 border-rose-200")
            }`}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-xl shrink-0 ${lowConfCount === 0 ? "bg-emerald-500/20 text-emerald-500" : "bg-rose-500/20 text-rose-500"}`}>
                  {lowConfCount === 0 ? <CheckCircle2 className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5 animate-pulse" />}
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-black block">ریسک کیفیت OCR قلم نوری</span>
                  <p className="text-[10px] leading-relaxed text-slate-600 dark:text-slate-300">
                    {lowConfCount === 0 ? (
                      "هیچ سطری با ضریب اطمینان کم‌تر از ۷۰٪ در سند وجود ندارد."
                    ) : (
                      <>
                        تعداد <span className="font-bold font-mono text-rose-600 dark:text-rose-400">{lowConfCount.toLocaleString("fa-IR")} ردیف</span> کم‌دقت ارزیابی شده‌اند.
                      </>
                    )}
                  </p>
                </div>
              </div>

              {lowConfCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setMinConfidenceThreshold(70);
                    setMousePosPercent(70);
                    setActiveValidationSubTab('threshold');
                  }}
                  className="w-full py-2 px-3 rounded-xl text-[10px] font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>فیلتر و بررسی اقلام کم‌دقت در شبیه‌ساز</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---------------- Sub-Tab 3: Field Completeness Matrix ---------------- */}
      {activeValidationSubTab === 'fields' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <h5 className="text-[11.5px] font-extrabold flex items-center gap-2">
            ماتریس پوشش و تکمیل فیلدهای اطلاعاتی
          </h5>

          {(() => {
            const dateFilled = transactions.filter(t => t.تاریخ && t.تاریخ !== "-").length;
            const docFilled = transactions.filter(t => t.شماره_سند && t.شماره_سند !== "-").length;
            const partyFilled = transactions.filter(t => t.نام_طرف_حساب && t.نام_طرف_حساب !== "-").length;
            const amountFilled = transactions.filter(t => (Number(t.مبلغ_بدهکار) || 0) > 0 || (Number(t.مبلغ_بستانکار) || 0) > 0).length;
            const descFilled = transactions.filter(t => t.شرح && t.شرح !== "-").length;

            const fieldsList = [
              { name: "تاریخ شمسی اسناد مالی", count: dateFilled, icon: Calendar, color: "bg-blue-500" },
              { name: "نام طرف حساب یا سرفصل", count: partyFilled, icon: User, color: "bg-emerald-500" },
              { name: "مبلغ مالی (بدهکار/بستانکار)", count: amountFilled, icon: Coins, color: "bg-amber-500" },
              { name: "شماره سند / ارجاع", count: docFilled, icon: Tag, color: "bg-purple-500" },
              { name: "شرح و شرح تفصیلی", count: descFilled, icon: FileText, color: "bg-indigo-500" },
            ];

            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {fieldsList.map((f, i) => {
                  const pct = totalRows > 0 ? Math.round((f.count / totalRows) * 100) : 0;
                  return (
                    <div key={i} className={`p-3.5 rounded-2xl border text-right flex flex-col gap-2 ${
                      isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200"
                    }`}>
                      <div className="flex items-center justify-between text-[10.5px] font-bold">
                        <div className="flex items-center gap-1.5">
                          <f.icon className="w-3.5 h-3.5 text-slate-400" />
                          <span>{f.name}</span>
                        </div>
                        <span className="font-mono text-indigo-500">{pct.toLocaleString("fa-IR")}٪</span>
                      </div>

                      <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full ${f.color}`} style={{ width: `${pct}%` }} />
                      </div>

                      <span className="text-[9.5px] text-slate-400 font-mono">
                        {f.count.toLocaleString("fa-IR")} از {totalRows.toLocaleString("fa-IR")} سطر پر شده است
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* ---------------- Sub-Tab 4: AI & Auto Repair Engine ---------------- */}
      {activeValidationSubTab === 'auto-repair' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <h5 className="text-[11.5px] font-extrabold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-500" />
              موتور هوشمند تشخیص و خوداصلاحی محاسباتی
            </h5>

            {autoRepairIssues.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  autoRepairIssues.forEach(issue => {
                    if (issue.fixable) issue.onFix();
                  });
                }}
                className="py-1.5 px-3 rounded-xl text-[10px] font-extrabold bg-blue-600 hover:bg-blue-700 text-white transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                <span>اعمال خوداصلاحی سراسری برای تمامی موارد</span>
              </button>
            )}
          </div>

          {autoRepairIssues.length === 0 ? (
            <div className={`p-6 rounded-2xl border text-center flex flex-col items-center justify-center gap-2 ${
              isDarkMode ? "bg-emerald-950/10 border-emerald-900/30 text-emerald-400" : "bg-emerald-50 border-emerald-200 text-emerald-800"
            }`}>
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              <span className="text-xs font-black">یکپارچگی محاسباتی ۱۰۰٪ تایید شده است!</span>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 max-w-md">
                هیچ مغایرتی در حاصل‌ضرب تعداد در فی، مجموع مبالغ بدهکار و بستانکار یا سرفصل‌های سند یافت نشد.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {autoRepairIssues.map((issue) => (
                <div
                  key={issue.id}
                  className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                    isDarkMode ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-200 shadow-sm"
                  }`}
                >
                  <div className="space-y-1 text-right flex-1">
                    <span className="text-[11px] font-black text-rose-500 block">{issue.title}</span>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">{issue.desc}</p>
                  </div>

                  {issue.fixable && (
                    <button
                      type="button"
                      onClick={issue.onFix}
                      className="px-3 py-1.5 rounded-lg text-[9.5px] font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <Wrench className="w-3 h-3" />
                      <span>اصلاح هوشمند این سطر</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
