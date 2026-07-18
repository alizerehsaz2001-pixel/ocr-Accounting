import React, { useState, useMemo } from "react";
import { Activity, X, Search, Trash2, Download, Filter, Calendar, Info, CheckCircle, AlertTriangle, XCircle, Shield, User } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { AuditLogEntry } from "../types";

interface AuditLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  auditLogs: AuditLogEntry[];
  isDarkMode: boolean;
  onClearLogs?: () => void;
}

export default function AuditLogsModal({ 
  isOpen, 
  onClose, 
  auditLogs, 
  isDarkMode, 
  onClearLogs 
}: AuditLogsModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAction, setFilterAction] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  const uniqueActions = useMemo(() => {
    const actions = new Set(auditLogs.map(log => log.action));
    return Array.from(actions);
  }, [auditLogs]);

  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      const matchesSearch = log.action.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (log.user?.name && log.user.name.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesAction = filterAction === "all" || log.action === filterAction;
      const matchesType = filterType === "all" || (log.type || 'info') === filterType;
      
      return matchesSearch && matchesAction && matchesType;
    });
  }, [auditLogs, searchQuery, filterAction, filterType]);

  const handleExportCSV = () => {
    if (filteredLogs.length === 0) return;
    
    // Simple CSV export
    const headers = ["ID", "Timestamp", "Type", "Action", "User", "Role", "Details"];
    const rows = filteredLogs.map(log => [
      log.id,
      new Date(log.timestamp).toLocaleString("fa-IR"),
      log.type || "info",
      `"${log.action.replace(/"/g, '""')}"`,
      `"${(log.user?.name || "سیستم").replace(/"/g, '""')}"`,
      `"${(log.user?.role || "system").replace(/"/g, '""')}"`,
      `"${log.details.replace(/"/g, '""')}"`
    ]);
    
    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `audit_logs_${new Date().toLocaleDateString("fa-IR")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getTypeStyles = (type?: string) => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle className="w-3.5 h-3.5" />,
          light: "bg-emerald-100 text-emerald-600 ring-1 ring-emerald-200 border-slate-50",
          dark: "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/50 border-slate-900",
          titleLight: "text-emerald-700",
          titleDark: "text-emerald-400"
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-3.5 h-3.5" />,
          light: "bg-amber-100 text-amber-600 ring-1 ring-amber-200 border-slate-50",
          dark: "bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/50 border-slate-900",
          titleLight: "text-amber-700",
          titleDark: "text-amber-400"
        };
      case 'error':
        return {
          icon: <XCircle className="w-3.5 h-3.5" />,
          light: "bg-red-100 text-red-600 ring-1 ring-red-200 border-slate-50",
          dark: "bg-red-500/20 text-red-400 ring-1 ring-red-500/50 border-slate-900",
          titleLight: "text-red-700",
          titleDark: "text-red-400"
        };
      case 'auth':
        return {
          icon: <Shield className="w-3.5 h-3.5" />,
          light: "bg-purple-100 text-purple-600 ring-1 ring-purple-200 border-slate-50",
          dark: "bg-purple-500/20 text-purple-400 ring-1 ring-purple-500/50 border-slate-900",
          titleLight: "text-purple-700",
          titleDark: "text-purple-400"
        };
      case 'info':
      default:
        return {
          icon: <Info className="w-3.5 h-3.5" />,
          light: "bg-indigo-100 text-indigo-600 ring-1 ring-indigo-200 border-slate-50",
          dark: "bg-indigo-500/20 text-indigo-400 ring-1 ring-indigo-500/50 border-slate-900",
          titleLight: "text-indigo-700",
          titleDark: "text-indigo-400"
        };
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className={`relative w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden ${
          isDarkMode ? "bg-slate-900 border border-slate-800 text-slate-200" : "bg-white border border-slate-200 text-slate-800"
        }`} 
        dir="rtl"
      >
        {/* Header */}
        <div className={`p-5 border-b flex flex-col gap-4 shrink-0 ${isDarkMode ? "bg-slate-800/80 border-slate-700" : "bg-slate-50/80 border-slate-200"}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${isDarkMode ? "bg-indigo-900/50 text-indigo-400" : "bg-indigo-100 text-indigo-600"}`}>
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-base">سیاهه رویدادها (Audit Logs)</h3>
                <p className={`text-xs mt-0.5 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>گزارش جامع، جستجو و فیلتر اقدامات سامانه</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={handleExportCSV}
                title="دانلود گزارش CSV"
                disabled={filteredLogs.length === 0}
                className={`p-2 rounded-lg transition-colors border ${
                  isDarkMode 
                    ? "border-slate-700 hover:bg-slate-800 text-slate-300 disabled:opacity-50" 
                    : "border-slate-200 hover:bg-slate-100 text-slate-600 disabled:opacity-50"
                }`}
              >
                <Download className="h-4 w-4" />
              </button>
              
              {onClearLogs && (
                <button 
                  onClick={() => {
                    if (window.confirm("آیا از پاک کردن تمامی تاریخچه رویدادها اطمینان دارید؟")) {
                      onClearLogs();
                    }
                  }}
                  title="پاکسازی تاریخچه"
                  disabled={auditLogs.length === 0}
                  className={`p-2 rounded-lg transition-colors border ${
                    isDarkMode 
                      ? "border-slate-700 hover:bg-red-900/30 hover:text-red-400 hover:border-red-900/50 text-slate-400 disabled:opacity-50" 
                      : "border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-slate-500 disabled:opacity-50"
                  }`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}

              <div className={`w-px h-6 mx-1 ${isDarkMode ? "bg-slate-700" : "bg-slate-300"}`} />

              <button 
                onClick={onClose}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode ? "hover:bg-slate-800 text-slate-400 hover:text-white" : "hover:bg-slate-200 text-slate-500 hover:text-slate-900"
                }`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row gap-3 mt-1">
            <div className="relative flex-1">
              <Search className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`} />
              <input 
                type="text"
                placeholder="جستجو در متن رویدادها..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full text-sm py-2 pr-9 pl-4 rounded-lg border outline-none transition-all ${
                  isDarkMode 
                    ? "bg-slate-900 border-slate-700 text-white focus:border-indigo-500" 
                    : "bg-white border-slate-300 text-slate-900 focus:border-indigo-500"
                }`}
              />
            </div>
            
            <div className="flex gap-3 sm:w-80">
              <div className="relative flex-1">
                <Filter className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`} />
                <select 
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className={`w-full text-sm py-2 pr-9 pl-2 rounded-lg border outline-none appearance-none transition-all ${
                    isDarkMode 
                      ? "bg-slate-900 border-slate-700 text-white focus:border-indigo-500" 
                      : "bg-white border-slate-300 text-slate-900 focus:border-indigo-500"
                  }`}
                >
                  <option value="all">همه انواع</option>
                  <option value="info">اطلاعات</option>
                  <option value="success">موفق</option>
                  <option value="warning">هشدار</option>
                  <option value="error">خطا</option>
                  <option value="auth">امنیتی</option>
                </select>
              </div>

              <div className="relative flex-1">
                <Filter className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`} />
                <select 
                  value={filterAction}
                  onChange={(e) => setFilterAction(e.target.value)}
                  className={`w-full text-sm py-2 pr-9 pl-2 rounded-lg border outline-none appearance-none transition-all ${
                    isDarkMode 
                      ? "bg-slate-900 border-slate-700 text-white focus:border-indigo-500" 
                      : "bg-white border-slate-300 text-slate-900 focus:border-indigo-500"
                  }`}
                >
                  <option value="all">همه رویدادها</option>
                  {uniqueActions.map(action => (
                    <option key={action} value={action}>{action}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
        
        {/* Logs Timeline */}
        <div className={`flex-1 overflow-y-auto p-5 md:p-8 ${isDarkMode ? "bg-slate-900" : "bg-slate-50"}`}>
           {auditLogs.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-16 opacity-50">
                <Activity className="h-12 w-12 mb-4" />
                <span className="text-sm">هیچ رویدادی تا کنون ثبت نشده است.</span>
             </div>
           ) : filteredLogs.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-16 opacity-50">
                <Search className="h-12 w-12 mb-4" />
                <span className="text-sm">رویدادی مطابق با جستجوی شما یافت نشد.</span>
             </div>
           ) : (
             <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-indigo-300 before:to-transparent dark:before:via-indigo-800/50">
                <AnimatePresence initial={false}>
                  {filteredLogs.map((log) => {
                     const d = new Date(log.timestamp);
                     const timeStr = d.toLocaleTimeString("fa-IR", { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                     const dateStr = d.toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" });
                     const styles = getTypeStyles(log.type);
                     
                     return (
                       <motion.div 
                         key={log.id} 
                         initial={{ opacity: 0, y: 10 }}
                         animate={{ opacity: 1, y: 0 }}
                         exit={{ opacity: 0, scale: 0.95 }}
                         className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
                       >
                          <div className={`flex items-center justify-center w-8 h-8 rounded-full border-4 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10 ${isDarkMode ? styles.dark : styles.light}`}>
                             {styles.icon}
                          </div>
                          
                          <div className={`w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] p-4 rounded-xl border shadow-sm transition-all hover:shadow-md hover:-translate-y-1 ${
                            isDarkMode 
                              ? "border-slate-800 bg-slate-800/60 hover:bg-slate-800" 
                              : "border-slate-200 bg-white"
                          }`}>
                             <div className="flex flex-wrap items-start justify-between gap-2 mb-2 border-b pb-2 border-slate-200/50 dark:border-slate-700/50">
                                <h4 className={`font-bold text-sm ${isDarkMode ? styles.titleDark : styles.titleLight}`}>
                                  {log.action}
                                </h4>
                                <div className="flex items-center gap-1.5 text-[10px] font-medium px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400">
                                  <Calendar className="w-3 h-3" />
                                  <time dir="ltr">{dateStr} {timeStr}</time>
                                </div>
                             </div>
                             
                             <p className={`text-xs leading-loose mb-3 ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
                               {log.details}
                             </p>
                             
                             <div className={`flex items-center justify-between pt-2 border-t text-[10px] ${isDarkMode ? "border-slate-700/50" : "border-slate-100"}`}>
                               <div className={`flex items-center gap-1.5 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                                 <User className="w-3 h-3" />
                                 <span>{log.user?.name || 'سیستم'}</span>
                                 <span className={`px-1.5 py-0.5 rounded opacity-80 ${isDarkMode ? "bg-slate-700" : "bg-slate-200"}`}>
                                   {log.user?.role === 'admin' ? 'مدیر' : log.user?.role === 'user' ? 'کاربر' : 'سیستم'}
                                 </span>
                               </div>
                               <span className={`font-mono text-[9px] uppercase tracking-wider ${isDarkMode ? "text-slate-600" : "text-slate-400"}`}>
                                 ID: {log.id}
                               </span>
                             </div>
                          </div>
                       </motion.div>
                     );
                  })}
                </AnimatePresence>
             </div>
           )}
        </div>
      </motion.div>
    </div>
  );
}
