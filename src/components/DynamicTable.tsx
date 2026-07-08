import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Shield, FileEdit, Check, ArrowUpDown, Calendar, AlertTriangle, CheckSquare, Square } from "lucide-react";
import { TransactionItem, DynamicColumn } from "../types";

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
  const prevTransactionsRef = useRef<TransactionItem[]>(transactions);

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

  const handleSaveRow = (originalIndex: number) => {
    if (!editingData) return;
    const updated = [...transactions];
    updated[originalIndex] = editingData;
    onUpdateTransactions(updated);
    setEditingIndex(null);
    setEditingData(null);
    onLogEvent("ویرایش دستی", `کاربر ردیف ${originalIndex + 1} را ویرایش کرد.`);
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
    <table className="w-full text-right border-collapse text-xs">
      <thead className={`text-[10px] uppercase font-black sticky top-0 z-30 transition-colors duration-300 ${isDarkMode ? "text-slate-350" : "text-slate-500"}`}>
        <tr>
          {hasSelectionSupport && (
            <th className={`px-3 py-3 text-center sticky top-0 z-30 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-md shadow-[0_1px_2px_rgba(0,0,0,0.03)] border-b border-l ${isDarkMode ? "border-slate-800/80" : "border-slate-200"} select-none w-10`}>
              <button onClick={onToggleSelectAll} className="outline-none">
                {allSelected ? <CheckSquare className="w-4 h-4 text-blue-500" /> : isIndeterminate ? <CheckSquare className="w-4 h-4 text-slate-400 opacity-60" /> : <Square className="w-4 h-4 opacity-40 hover:opacity-100" />}
              </button>
            </th>
          )}
          <th className={`px-3 py-3 text-center sticky top-0 z-30 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-md shadow-[0_1px_2px_rgba(0,0,0,0.03)] border-b border-l ${isDarkMode ? "border-slate-800/80" : "border-slate-200"} select-none`}>
            #
          </th>
          <th className={`px-3 py-3 text-center sticky top-0 z-30 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-md shadow-[0_1px_2px_rgba(0,0,0,0.03)] border-b border-l ${isDarkMode ? "border-slate-800/80" : "border-slate-200"} select-none`}>
            دقت
          </th>
          {columns.map(col => (
            <th 
              key={col.کلید}
              onClick={() => handleSort(col.کلید)}
              className={`px-3 py-3 sticky top-0 z-30 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-md shadow-[0_1px_2px_rgba(0,0,0,0.03)] border-b border-l ${isDarkMode ? "border-slate-800/80" : "border-slate-200"} cursor-pointer select-none group hover:bg-slate-100/70 dark:hover:bg-slate-800/70 hover:text-blue-600 dark:hover:text-blue-400 transition-colors`}
              title={`مرتب‌سازی بر اساس ${col.عنوان}`}
            >
              <div className="flex items-center gap-1.5 font-bold">
                <span>{col.عنوان}</span>
                {renderSortIcon(col.کلید)}
              </div>
            </th>
          ))}
          <th className={`px-3 py-3 text-center sticky top-0 z-30 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-md shadow-[0_1px_2px_rgba(0,0,0,0.03)] border-b ${isDarkMode ? "border-slate-800/80" : "border-slate-200"} font-bold`}>
            عملیات
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 relative">
        <AnimatePresence mode="popLayout">
          {sortedTransactions.map((tr, index) => {
            const originalIndex = transactions.findIndex(t => t.id === tr.id);
            const isCurrentlyEditing = editingIndex === originalIndex;
            const score = tr.ضریب_اطمینان ?? 100;
            const isSelected = selectedRowIds.includes(tr.id);
            const isHighlighted = highlightedRowIds[tr.id];
            
            return (
              <motion.tr
                key={tr.id || index}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`group hover:relative hover:z-10 hover:-translate-y-0.5 hover:scale-[1.006] ${isSelected ? (isDarkMode ? "bg-blue-900/20" : "bg-blue-50/50") : ""} ${
                  isHighlighted
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
                  <td colSpan={columns.length + (hasSelectionSupport ? 4 : 3)} className="p-0">
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
                            {columns.map(col => (
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
                      <div className="flex items-center justify-center gap-1.5 shrink-0" title={score === 100 ? "تأیید نهایی شده" : "پیش‌نویس استخراج (نیاز به بازبینی)"}>
                        {score === 100 ? (
                          <ShieldCheck className="h-5 w-5 text-emerald-500 fill-emerald-500/5 cursor-help" />
                        ) : (
                          <Shield className="h-5 w-5 text-amber-500 fill-amber-500/5 cursor-help" />
                        )}
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">{score}٪</span>
                      </div>
                    </td>
                    {columns.map(col => {
                      const val = tr[col.کلید];
                      const isNumber = col.نوع_داده === 'number';
                      const isAmount = col.کلید.includes("مبلغ") || col.کلید.includes("amount");
                      return (
                        <td key={col.کلید} className={`px-3 py-3.5 border-b border-l border-slate-200/60 dark:border-slate-800/75 max-w-[200px] truncate text-slate-700 dark:text-slate-300 text-[11.5px] font-semibold ${isNumber ? "font-mono" : ""}`}>
                           {isNumber && val ? (
                             <span className={isAmount ? (Number(val) > 0 ? (col.کلید.includes("بدهکار") ? (isDarkMode ? "text-emerald-400" : "text-emerald-600") : (isDarkMode ? "text-rose-400" : "text-rose-600")) : "") : ""}>
                               {Number(val).toLocaleString("fa-IR")}
                             </span>
                           ) : (val || "-")}
                        </td>
                      );
                    })}
                    <td className="px-3 py-3.5 text-center border-b border-slate-200/60 dark:border-slate-800/75 last:rounded-l-xl">
                       <button onClick={(e) => { e.stopPropagation(); setEditingIndex(originalIndex); setEditingData(tr); }} className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-bold text-[11px] flex items-center justify-center gap-1 mx-auto bg-blue-50 dark:bg-blue-500/10 px-2 py-1 rounded-lg">
                          <FileEdit className="w-3.5 h-3.5"/> ویرایش
                       </button>
                    </td>
                  </>
                )}
              </motion.tr>
            );
          })}
        </AnimatePresence>
      </tbody>
      <tfoot className={`sticky bottom-0 z-20 shadow-[0_-1px_2px_rgba(0,0,0,0.03)] backdrop-blur-md ${isDarkMode ? "bg-slate-900/95" : "bg-slate-50/95"}`}>
        <tr>
          <td colSpan={hasSelectionSupport ? 3 : 2} className={`px-3 py-3 text-left font-black border-t border-l ${isDarkMode ? "border-slate-700 text-slate-300" : "border-slate-200 text-slate-600"}`}>
            جمع کل صفحه:
          </td>
          {columns.map(col => {
            let footerContent: React.ReactNode = "";
            if (col.کلید === "مبلغ_بدهکار") footerContent = <span className={`font-mono ${isDarkMode ? "text-emerald-400" : "text-emerald-600"}`}>{totalDebit.toLocaleString("fa-IR")}</span>;
            else if (col.کلید === "مبلغ_بستانکار") footerContent = <span className={`font-mono ${isDarkMode ? "text-rose-400" : "text-rose-600"}`}>{totalCredit.toLocaleString("fa-IR")}</span>;
            return (
              <td key={col.کلید} className={`px-3 py-3 font-bold border-t border-l ${isDarkMode ? "border-slate-700" : "border-slate-200"}`}>
                {footerContent}
              </td>
            );
          })}
          <td className={`px-3 py-3 border-t ${isDarkMode ? "border-slate-700" : "border-slate-200"}`}></td>
        </tr>
      </tfoot>
    </table>
  );
}
