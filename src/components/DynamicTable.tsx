import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Shield, FileEdit, Check, ArrowUpDown, Calendar, AlertTriangle, CheckSquare, Square } from "lucide-react";
import { TransactionItem, DynamicColumn } from "../types";
import { numToWordsFa, toPersianDigits, isMonetaryKey } from "../utils/numberToPersianWords";

interface DynamicTableProps {
  transactions: TransactionItem[];
  columns: DynamicColumn[];
  isDarkMode: boolean;
  onUpdateTransactions: (updated: TransactionItem[]) => void;
  onLogEvent: (action: string, details: string) => void;
  onShowNotification: (msg: string, type: "success"|"error"|"info"|"warning") => void;
  selectedRowIds?: string[];
  onToggleRowSelection?: (id: string) => void;
  onToggleSelectAll?: () => void;
}

const normalizeKey = (k: any): string => {
  if (typeof k !== "string") return String(k || "");
  return k
    .trim()
    .replace(/[\u064A\u0649]/g, "\u06CC") // Arabic Yeh to Persian Yeh
    .replace(/[\u0643]/g, "\u06A9")      // Arabic Kaf to Persian Kaf
    .replace(/\s+/g, "_");               // Replace spaces with underscores
};

export default function DynamicTable({
  transactions,
  columns,
  isDarkMode,
  onUpdateTransactions,
  onLogEvent,
  onShowNotification,
  selectedRowIds = [],
  onToggleRowSelection,
  onToggleSelectAll
}: DynamicTableProps) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<TransactionItem | null>(null);
  const [highlightedRowIds, setHighlightedRowIds] = useState<Record<string, "new" | "edited">>({});
  const [justConfirmedId, setJustConfirmedId] = useState<string | null>(null);
  const prevTransactionsRef = useRef<TransactionItem[]>(transactions);

  const uniqueColumns = React.useMemo(() => {
    if (!Array.isArray(columns)) return [];
    const seen = new Set<string>();
    const res: DynamicColumn[] = [];
    columns.forEach((col, idx) => {
      if (!col) return;
      const rawK = col.کلید || col.عنوان || `col-${idx}`;
      const k = normalizeKey(rawK);
      if (!seen.has(k)) {
        seen.add(k);
        res.push({
          ...col,
          کلید: k,
          عنوان: col.عنوان || rawK
        });
      }
    });
    return res;
  }, [columns]);

  useEffect(() => {
    const prevTransactions = prevTransactionsRef.current;
    if (prevTransactions !== transactions) {
      const newHighlights: Record<string, "new" | "edited"> = {};
      let changed = false;

      if (prevTransactions.length > 0) {
        transactions.forEach(curr => {
          const prev = prevTransactions.find(p => p.id === curr.id);
          if (!prev) {
            newHighlights[curr.id] = "new";
            changed = true;
          } else {
            // Compare key values to see if any edited
            const keys = Array.from(new Set([...Object.keys(curr), ...Object.keys(prev)]));
            const isDifferent = keys.some(k => {
              if (k === "ضریب_اطمینان") {
                return (curr[k] ?? 100) !== (prev[k] ?? 100);
              }
              return curr[k] !== prev[k];
            });
            if (isDifferent) {
              newHighlights[curr.id] = "edited";
              changed = true;
            }
          }
        });
      }

      if (changed) {
        setHighlightedRowIds(prev => ({ ...prev, ...newHighlights }));
        const timeoutId = setTimeout(() => {
          setHighlightedRowIds(prev => {
            const next = { ...prev };
            Object.keys(newHighlights).forEach(id => {
              delete next[id];
            });
            return next;
          });
        }, 2500); // Highlight lasts for 2.5 seconds
        
        prevTransactionsRef.current = transactions;
        return () => clearTimeout(timeoutId);
      }
    }
    prevTransactionsRef.current = transactions;
  }, [transactions]);

  const handleSort = (colKey: string) => {
    if (sortColumn === colKey) {
      if (sortDirection === 'asc') setSortDirection('desc');
      else { setSortColumn(null); setSortDirection('asc'); }
    } else {
      setSortColumn(colKey);
      setSortDirection('asc');
    }
  };

  const sortedTransactions = [...transactions].sort((a, b) => {
    if (!sortColumn) return 0;
    const aVal = a[sortColumn];
    const bVal = b[sortColumn];
    if (aVal === bVal) return 0;
    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;
    
    const cmp = aVal > bVal ? 1 : -1;
    return sortDirection === 'asc' ? cmp : -cmp;
  });

  const renderSortIcon = (colKey: string) => {
    if (sortColumn !== colKey) return <ArrowUpDown className="w-3 h-3 opacity-30 hover:opacity-70 transition-opacity" />;
    return <ArrowUpDown className={`w-3 h-3 ${sortDirection === 'asc' ? "text-blue-500 rotate-180" : "text-blue-500"}`} />;
  };

  const handleFieldChange = (key: string, value: any) => {
    if (!editingData) return;
    setEditingData({ ...editingData, [key]: value });
  };

  const handleConfirmRowAccuracy = (originalIndex: number, trId: string) => {
    const updated = [...transactions];
    updated[originalIndex] = {
      ...updated[originalIndex],
      ضریب_اطمینان: 100
    };
    onUpdateTransactions(updated);
    setJustConfirmedId(trId);
    setTimeout(() => {
      setJustConfirmedId(null);
    }, 1200);
    onLogEvent("تایید صحت ردیف", `کاربر صحت داده‌های ردیف ${originalIndex + 1} را به ۱۰۰٪ ارتقا داد.`);
    onShowNotification(`صحت ردیف ${originalIndex + 1} با موفقیت تایید و تثبیت شد 🛡️`, "success");
  };

  const handleSaveRow = (originalIndex: number) => {
    if (!editingData) return;
    const updated = [...transactions];
    const isPromotedToVerified = (editingData.ضریب_اطمینان ?? 100) === 100;
    updated[originalIndex] = editingData;
    onUpdateTransactions(updated);
    if (editingData.id) {
      setJustConfirmedId(editingData.id);
      setTimeout(() => {
        setJustConfirmedId(null);
      }, 1200);
    }
    setEditingIndex(null);
    setEditingData(null);
    onLogEvent("ویرایش دستی", `کاربر ردیف ${originalIndex + 1} را ویرایش کرد.`);
    onShowNotification("تغییرات ردیف با موفقیت تایید و ذخیره شد.", "success");
  };

  const inputClass = `w-full text-[11px] px-1.5 py-1 rounded border outline-none font-sans ${
    isDarkMode 
      ? "bg-[#0B0F19] border-slate-700 text-slate-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
      : "bg-white border-slate-300 text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
  }`;

  const hasSelectionSupport = !!onToggleRowSelection;
  const allSelected = sortedTransactions.length > 0 && selectedRowIds.length === sortedTransactions.length;
  const isIndeterminate = selectedRowIds.length > 0 && selectedRowIds.length < sortedTransactions.length;

  const totalDebit = sortedTransactions.reduce((sum, tr) => sum + (Number(tr.مبلغ_بدهکار) || 0), 0);
  const totalCredit = sortedTransactions.reduce((sum, tr) => sum + (Number(tr.مبلغ_بستانکار) || 0), 0);

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[950px] text-right border-collapse text-xs font-sans">
        <thead className={`text-[10.5px] uppercase font-black sticky top-0 z-30 transition-colors duration-300 ${isDarkMode ? "text-slate-300 bg-slate-900" : "text-slate-600 bg-slate-100"}`}>
          <tr>
            {hasSelectionSupport && (
              <th className={`px-3 py-3.5 text-center sticky top-0 z-30 bg-slate-100/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-l ${isDarkMode ? "border-slate-800/80" : "border-slate-200"} select-none w-10 shrink-0`}>
                <button onClick={onToggleSelectAll} className="outline-none cursor-pointer">
                  {allSelected ? <CheckSquare className="w-4 h-4 text-blue-500" /> : isIndeterminate ? <CheckSquare className="w-4 h-4 text-slate-400 opacity-60" /> : <Square className="w-4 h-4 opacity-40 hover:opacity-100" />}
                </button>
              </th>
            )}
            <th className={`px-3 py-3.5 text-center sticky top-0 z-30 bg-slate-100/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-l ${isDarkMode ? "border-slate-800/80" : "border-slate-200"} select-none w-12 shrink-0`}>
              #
            </th>
            <th className={`px-3 py-3.5 text-center sticky top-0 z-30 bg-slate-100/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-l ${isDarkMode ? "border-slate-800/80" : "border-slate-200"} select-none w-16 shrink-0`}>
              دقت
            </th>
            {uniqueColumns.map(col => {
              const isLongText = col.کلید.includes("شرح") || col.کلید.includes("طرف_حساب") || col.کلید.includes("description") || col.کلید.includes("name");
              return (
                <th 
                  key={col.کلید}
                  onClick={() => handleSort(col.کلید)}
                  className={`px-4 py-3.5 sticky top-0 z-30 bg-slate-100/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-l ${isDarkMode ? "border-slate-800/80" : "border-slate-200"} cursor-pointer select-none group hover:bg-slate-200/60 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition-colors ${
                    isLongText ? "min-w-[200px]" : "min-w-[120px]"
                  }`}
                  title={`مرتب‌سازی بر اساس ${col.عنوان}`}
                >
                  <div className="flex items-center gap-1.5 font-black whitespace-nowrap">
                    <span>{col.عنوان}</span>
                    {renderSortIcon(col.کلید)}
                  </div>
                </th>
              );
            })}
            <th className={`px-4 py-3.5 text-center sticky top-0 z-30 bg-slate-100/95 dark:bg-slate-900/95 backdrop-blur-md shadow-[0_1px_2px_rgba(0,0,0,0.03)] border-b ${isDarkMode ? "border-slate-800/80" : "border-slate-200"} font-black min-w-[120px] shrink-0`}>
              عملیات
            </th>
          </tr>
        </thead>
      <tbody className="divide-y divide-slate-200 dark:divide-slate-800 relative">
        <AnimatePresence mode="popLayout">
          {sortedTransactions.map((tr, index) => {
            const originalIndex = transactions.findIndex(t => t.id === tr.id);
            const isCurrentlyEditing = editingIndex === originalIndex;
            const score = tr.ضریب_اطمینان ?? 100;
            const isSelected = selectedRowIds.includes(tr.id);
            const isHighlighted = highlightedRowIds[tr.id];
            
            const isJustConfirmed = justConfirmedId === tr.id;

            return (
              <motion.tr
                key={tr.id || index}
                initial={{ opacity: 0, y: 12 }}
                animate={
                  isJustConfirmed
                    ? { scale: [0.96, 1.035, 1], opacity: [0.6, 1] }
                    : { opacity: 1, y: 0, scale: 1 }
                }
                transition={
                  isJustConfirmed
                    ? { duration: 0.5, ease: "easeOut" }
                    : { duration: 0.25 }
                }
                exit={{ opacity: 0, y: -20 }}
                className={`group hover:relative hover:z-10 hover:-translate-y-0.5 hover:scale-[1.002] hover:shadow-lg ${isSelected ? (isDarkMode ? "bg-blue-900/20" : "bg-blue-50/50") : ""} ${
                  isJustConfirmed
                    ? "bg-emerald-500/25 ring-2 ring-emerald-500/60 shadow-lg text-emerald-950 dark:text-emerald-100 transition-all duration-300"
                    : isHighlighted
                    ? isHighlighted === "new"
                      ? isDarkMode
                        ? "bg-emerald-500/15 text-emerald-200 border-r-4 border-r-emerald-500 transition-none"
                        : "bg-emerald-50 text-emerald-900 border-r-4 border-r-emerald-500 transition-none"
                      : isDarkMode
                        ? "bg-blue-500/15 text-blue-200 border-r-4 border-r-blue-500 transition-none"
                        : "bg-blue-50 text-blue-900 border-r-4 border-r-blue-500 transition-none"
                    : isCurrentlyEditing
                      ? isDarkMode
                        ? "bg-slate-800 border-y-4 border-slate-700 shadow-xl transition-all duration-300"
                        : "bg-slate-50 border-y-4 border-slate-200 shadow-xl transition-all duration-300"
                      : isDarkMode
                        ? "hover:bg-slate-800/90 hover:shadow-xl hover:shadow-black/35 transition-all duration-1000 ease-out"
                        : "hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-1000 ease-out"
                }`}
              >
                {isCurrentlyEditing && editingData ? (
                  <td colSpan={uniqueColumns.length + (hasSelectionSupport ? 4 : 3)} className="p-0">
                     <div className={`mx-4 my-5 p-6 rounded-2xl border-2 shadow-sm ${isDarkMode ? "bg-slate-900 border-blue-500/30" : "bg-white border-blue-200"}`}>
                         <div className="flex justify-between items-center mb-6 gap-4 border-b pb-4 border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-4">
                               <div className={`p-3 rounded-2xl ${isDarkMode ? "bg-blue-500/20 text-blue-400" : "bg-blue-100 text-blue-600"}`}>
                                  <FileEdit className="w-5 h-5" />
                               </div>
                               <div>
                                  <h4 className={`text-base font-bold tracking-tight ${isDarkMode ? "text-slate-100" : "text-slate-800"}`}>ویرایش ردیف {index + 1}</h4>
                               </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button onClick={() => setEditingIndex(null)} className={`px-5 py-2.5 text-xs font-bold rounded-xl border flex-1 md:flex-none transition-colors ${isDarkMode ? "border-slate-700 hover:bg-slate-800 text-slate-300" : "border-slate-300 hover:bg-slate-50 text-slate-600"}`}>انصراف</button>
                              <button onClick={() => handleSaveRow(originalIndex)} className="px-6 py-2.5 text-xs font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-700 shadow-sm flex items-center justify-center gap-2 transition-all"><Check className="w-4 h-4"/> ذخیره</button>
                            </div>
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-5">
                            {uniqueColumns.map(col => (
                              <div key={col.کلید} className="space-y-2 cursor-text">
                                <label className={`text-[11px] font-semibold tracking-wide ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>{col.عنوان}</label>
                                <input 
                                  type={col.نوع_داده === 'number' ? 'number' : 'text'} 
                                  className={`${inputClass} text-sm py-2.5 px-3 shadow-none focus:ring-2`} 
                                  value={editingData[col.کلید] ?? ""} 
                                  onChange={(e) => handleFieldChange(col.کلید, col.نوع_داده === 'number' ? Number(e.target.value) : e.target.value)} 
                                />
                              </div>
                            ))}
                            <div className="space-y-2 cursor-text">
                                <label className={`text-[11px] font-semibold tracking-wide ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>ضریب اطمینان (%)</label>
                                <input 
                                  type="number" min="0" max="100" 
                                  className={`${inputClass} text-sm py-2.5 px-3 shadow-none focus:ring-2`} 
                                  value={editingData.ضریب_اطمینان ?? 100} 
                                  onChange={(e) => handleFieldChange("ضریب_اطمینان", Number(e.target.value))} 
                                />
                            </div>
                         </div>
                     </div>
                  </td>
                ) : (
                  <>
                    {hasSelectionSupport && (
                      <td className="px-3 py-3.5 text-center border-b border-l border-slate-200/60 dark:border-slate-800/75 font-bold cursor-pointer" onClick={(e) => { e.stopPropagation(); onToggleRowSelection(tr.id); }}>
                        <button className="outline-none" onClick={(e) => { e.stopPropagation(); onToggleRowSelection(tr.id); }}>
                          {isSelected ? <CheckSquare className="w-4 h-4 text-blue-500" /> : <Square className="w-4 h-4 opacity-30 hover:opacity-100" />}
                        </button>
                      </td>
                    )}
                    <td className={`px-3 py-3.5 text-center border-b border-l border-slate-200/60 dark:border-slate-800/75 font-bold ${hasSelectionSupport ? "" : "first:rounded-r-xl"}`}>
                      {index + 1}
                    </td>
                    <td className="px-3 py-3.5 text-center border-b border-l border-slate-200/60 dark:border-slate-800/75">
                      <div 
                        onClick={(e) => {
                          if (score < 100) {
                            e.stopPropagation();
                            handleConfirmRowAccuracy(originalIndex, tr.id);
                          }
                        }}
                        className={`flex items-center justify-center gap-1.5 shrink-0 rounded-lg p-1 transition-all ${
                          score < 100 ? "cursor-pointer hover:bg-emerald-500/10 hover:scale-105 active:scale-95" : "cursor-help"
                        }`} 
                        title={score === 100 ? "تأیید نهایی شده" : "کلیک کنید جهت تأیید سریع صحت و ارتقا به ۱۰۰٪"}
                      >
                        {score === 100 ? (
                          <ShieldCheck className="h-5 w-5 text-emerald-500 fill-emerald-500/5" />
                        ) : (
                          <Shield className="h-5 w-5 text-amber-500 fill-amber-500/5 animate-pulse hover:text-emerald-500" />
                        )}
                        <span className={`text-xs font-bold ${score === 100 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-500"}`}>{score}٪</span>
                      </div>
                    </td>
                    {uniqueColumns.map(col => {
                      const val = tr[col.کلید];
                      const isNumber = col.نوع_داده === 'number';
                      const isMonetary = isMonetaryKey(col.کلید);
                      const isWordCol = col.کلید.endsWith("_به_حروف");
                      const isLongText = col.کلید.includes("شرح") || col.کلید.includes("طرف_حساب") || col.کلید.includes("description") || col.کلید.includes("name");
                      
                      let numVal: number | null = null;
                      if (val !== undefined && val !== null && val !== "") {
                        if (typeof val === 'number') numVal = val;
                        else {
                          const parsed = Number(String(val).replace(/,/g, ""));
                          if (!isNaN(parsed)) numVal = parsed;
                        }
                      }

                      const wordsText = (numVal !== null && numVal >= 10 && isMonetary) ? numToWordsFa(numVal) : null;

                      return (
                        <td 
                          key={col.کلید} 
                          className={`px-4 py-3.5 border-b border-l border-slate-200/60 dark:border-slate-800/75 text-slate-800 dark:text-slate-200 text-[12px] font-semibold leading-relaxed ${
                            isNumber || isMonetary ? "font-mono whitespace-nowrap text-left" : isLongText ? "min-w-[220px] max-w-[380px] break-words" : "whitespace-nowrap"
                          }`}
                          title={wordsText ? `${numToWordsFa(numVal!)} ریال` : (typeof val === 'string' ? val : undefined)}
                        >
                           {isWordCol ? (
                             <span className={`text-[11px] font-sans font-medium px-2 py-0.5 rounded ${isDarkMode ? "bg-blue-950/40 text-blue-300 border border-blue-800/50" : "bg-blue-50 text-blue-800 border border-blue-200"}`}>
                               {val ? String(val) : "-"}
                             </span>
                           ) : (isNumber || isMonetary) && numVal !== null ? (
                             <div className="flex flex-col items-start gap-0.5" dir="rtl">
                               <span className={`font-mono font-bold ${col.کلید.includes("بدهکار") ? (isDarkMode ? "text-emerald-400" : "text-emerald-600") : col.کلید.includes("بستانکار") ? (isDarkMode ? "text-rose-400" : "text-rose-600") : ""}`}>
                                 {toPersianDigits(numVal.toLocaleString("en-US"))}
                               </span>
                               {wordsText && (
                                 <span className={`text-[10px] font-sans font-normal opacity-80 leading-tight ${isDarkMode ? "text-blue-300" : "text-slate-600"}`}>
                                   {wordsText} ریال
                                 </span>
                               )}
                             </div>
                           ) : (val !== undefined && val !== null && String(val).trim() !== "" ? String(val) : "-")}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3.5 text-center border-b border-slate-200/60 dark:border-slate-800/75 last:rounded-l-xl whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        {score < 100 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleConfirmRowAccuracy(originalIndex, tr.id);
                            }}
                            className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-bold text-[11px] flex items-center gap-1 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 px-2.5 py-1 rounded-lg transition-all cursor-pointer shadow-xs active:scale-95"
                            title="تأیید صحت داده‌های این ردیف (ارتقا به ۱۰۰٪)"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                            <span>تأیید</span>
                          </button>
                        )}
                        <button 
                          onClick={(e) => { e.stopPropagation(); setEditingIndex(originalIndex); setEditingData(tr); }} 
                          className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-bold text-[11px] flex items-center justify-center gap-1 bg-blue-50 dark:bg-blue-500/10 px-2.5 py-1 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-all cursor-pointer"
                        >
                          <FileEdit className="w-3.5 h-3.5"/> 
                          <span>ویرایش</span>
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </motion.tr>
            );
          })}
        </AnimatePresence>
      </tbody>
      <tfoot className={`sticky bottom-0 z-20 shadow-[0_-1px_2px_rgba(0,0,0,0.03)] backdrop-blur-md ${isDarkMode ? "bg-slate-900/95 text-slate-200" : "bg-slate-50/95 text-slate-800"}`}>
        <tr>
          <td colSpan={hasSelectionSupport ? 3 : 2} className={`px-4 py-3.5 text-left font-black border-t border-l ${isDarkMode ? "border-slate-700 text-slate-300" : "border-slate-200 text-slate-600"}`}>
            جمع کل صفحه:
          </td>
          {uniqueColumns.map(col => {
            let footerContent: React.ReactNode = "";
            if (col.کلید === "مبلغ_بدهکار") {
              footerContent = (
                <div className="flex flex-col items-start gap-0.5" dir="rtl">
                  <span className={`font-mono font-black ${isDarkMode ? "text-emerald-400" : "text-emerald-600"}`}>
                    {toPersianDigits(totalDebit.toLocaleString("en-US"))} ریال
                  </span>
                  {totalDebit > 0 && (
                    <span className="text-[10px] font-sans font-normal text-emerald-500">
                      ({numToWordsFa(totalDebit)} ریال)
                    </span>
                  )}
                </div>
              );
            } else if (col.کلید === "مبلغ_بستانکار") {
              footerContent = (
                <div className="flex flex-col items-start gap-0.5" dir="rtl">
                  <span className={`font-mono font-black ${isDarkMode ? "text-rose-400" : "text-rose-600"}`}>
                    {toPersianDigits(totalCredit.toLocaleString("en-US"))} ریال
                  </span>
                  {totalCredit > 0 && (
                    <span className="text-[10px] font-sans font-normal text-rose-500">
                      ({numToWordsFa(totalCredit)} ریال)
                    </span>
                  )}
                </div>
              );
            }
            return (
              <td key={col.کلید} className={`px-4 py-3.5 font-bold border-t border-l ${isDarkMode ? "border-slate-700" : "border-slate-200"}`}>
                {footerContent}
              </td>
            );
          })}
          <td className={`px-4 py-3.5 border-t ${isDarkMode ? "border-slate-700" : "border-slate-200"}`}></td>
        </tr>
      </tfoot>
    </table>
  </div>
  );
}
