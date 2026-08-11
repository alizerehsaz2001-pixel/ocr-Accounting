const fs = require('fs');

const code = `import React, { useState, useMemo } from "react";
import { 
  Activity, X, Search, Trash2, Download, Filter, Calendar, Info, 
  CheckCircle, AlertTriangle, XCircle, Shield, User, Table, 
  Clock, BarChart3, ChevronLeft, ChevronRight, FileJson
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { AuditLogEntry } from "../types";
import { 
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip, 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Area, AreaChart
} from "recharts";

interface AuditLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  auditLogs: AuditLogEntry[];
  isDarkMode: boolean;
  onClearLogs?: () => void;
}

type TabType = "timeline" | "table" | "analytics";

export default function AuditLogsModal({ 
  isOpen, 
  onClose, 
  auditLogs, 
  isDarkMode, 
  onClearLogs 
}: AuditLogsModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("timeline");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAction, setFilterAction] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: "", end: "" });
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;

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
      
      let matchesDate = true;
      if (dateRange.start || dateRange.end) {
        const logDate = new Date(log.timestamp).getTime();
        const start = dateRange.start ? new Date(dateRange.start).getTime() : 0;
        const end = dateRange.end ? new Date(dateRange.end).getTime() + 86400000 : Infinity; // Include the whole end day
        matchesDate = logDate >= start && logDate <= end;
      }
      
      return matchesSearch && matchesAction && matchesType && matchesDate;
    });
  }, [auditLogs, searchQuery, filterAction, filterType, dateRange]);

  const sortedAndFilteredLogs = useMemo(() => {
    return [...filteredLogs].sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime() || 0;
      const timeB = new Date(b.timestamp).getTime() || 0;
      if (sortOrder === "desc") return timeB - timeA;
      return timeA - timeB;
    });
  }, [filteredLogs, sortOrder]);

  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedAndFilteredLogs.slice(start, start + itemsPerPage);
  }, [sortedAndFilteredLogs, currentPage]);

  const totalPages = Math.ceil(sortedAndFilteredLogs.length / itemsPerPage);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterAction, filterType, dateRange, sortOrder]);

  const stats = useMemo(() => {
    return {
      total: auditLogs.length,
      filteredTotal: sortedAndFilteredLogs.length,
      errors: auditLogs.filter(l => l.type === 'error').length,
      warnings: auditLogs.filter(l => l.type === 'warning').length,
      auth: auditLogs.filter(l => l.type === 'auth').length,
      success: auditLogs.filter(l => l.type === 'success').length,
    };
  }, [auditLogs, sortedAndFilteredLogs]);

  const chartData = useMemo(() => {
    const typesCount = filteredLogs.reduce((acc, log) => {
      const type = log.type || 'info';
      const label = type === 'success' ? 'موفق' : type === 'error' ? 'خطا' : type === 'warning' ? 'هشدار' : type === 'auth' ? 'امنیتی' : 'اطلاعات';
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const pieData = Object.keys(typesCount).map(key => ({
      name: key,
      value: typesCount[key],
      color: key === 'موفق' ? '#10b981' : 
             key === 'خطا' ? '#f43f5e' : 
             key === 'هشدار' ? '#f59e0b' : 
             key === 'امنیتی' ? '#8b5cf6' : '#6366f1'
    }));

    const lineDataMap = new Map<string, number>();
    const reversed = [...filteredLogs].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    reversed.forEach(log => {
      const d = new Date(log.timestamp);
      const dateStr = d.toLocaleDateString("fa-IR", { month: 'short', day: 'numeric' });
      lineDataMap.set(dateStr, (lineDataMap.get(dateStr) || 0) + 1);
    });
    
    const lineData = Array.from(lineDataMap.entries())
      .slice(-14) // Last 14 active days
      .map(([date, count]) => ({ date, count }));

    return { pieData, lineData };
  }, [filteredLogs]);

  const handleExportCSV = () => {
    if (filteredLogs.length === 0) return;
    const headers = ["ID", "Timestamp", "Type", "Action", "User", "Role", "Details", "Metadata"];
    const rows = filteredLogs.map(log => [
      log.id,
      new Date(log.timestamp).toLocaleString("fa-IR"),
      log.type || "info",
      \`"\${log.action.replace(/"/g, '""')}"\`,
      \`"\${(log.user?.name || "سیستم").replace(/"/g, '""')}"\`,
      \`"\${(log.user?.role || "system").replace(/"/g, '""')}"\`,
      \`"\${log.details.replace(/"/g, '""')}"\`,
      \`"\${log.metadata ? JSON.stringify(log.metadata).replace(/"/g, '""') : ""}"\`
    ]);
    
    const csvContent = "\\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", \`audit_logs_\${new Date().toLocaleDateString("fa-IR")}.csv\`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    if (filteredLogs.length === 0) return;
    const jsonContent = JSON.stringify(filteredLogs, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", \`audit_logs_\${new Date().toLocaleDateString("fa-IR")}.json\`);
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
          titleDark: "text-emerald-400",
          badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-3.5 h-3.5" />,
          light: "bg-amber-100 text-amber-600 ring-1 ring-amber-200 border-slate-50",
          dark: "bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/50 border-slate-900",
          titleLight: "text-amber-700",
          titleDark: "text-amber-400",
          badge: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
        };
      case 'error':
        return {
          icon: <XCircle className="w-3.5 h-3.5" />,
          light: "bg-red-100 text-red-600 ring-1 ring-red-200 border-slate-50",
          dark: "bg-red-500/20 text-red-400 ring-1 ring-red-500/50 border-slate-900",
          titleLight: "text-red-700",
          titleDark: "text-red-400",
          badge: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"
        };
      case 'auth':
        return {
          icon: <Shield className="w-3.5 h-3.5" />,
          light: "bg-purple-100 text-purple-600 ring-1 ring-purple-200 border-slate-50",
          dark: "bg-purple-500/20 text-purple-400 ring-1 ring-purple-500/50 border-slate-900",
          titleLight: "text-purple-700",
          titleDark: "text-purple-400",
          badge: "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400"
        };
      case 'info':
      default:
        return {
          icon: <Info className="w-3.5 h-3.5" />,
          light: "bg-indigo-100 text-indigo-600 ring-1 ring-indigo-200 border-slate-50",
          dark: "bg-indigo-500/20 text-indigo-400 ring-1 ring-indigo-500/50 border-slate-900",
          titleLight: "text-indigo-700",
          titleDark: "text-indigo-400",
          badge: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400"
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
        className={\`relative w-full max-w-5xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden \${
          isDarkMode ? "bg-slate-900 border border-slate-800 text-slate-200" : "bg-white border border-slate-200 text-slate-800"
        }\`} 
        dir="rtl"
      >
        {/* Header & Tabs */}
        <div className={\`shrink-0 \${isDarkMode ? "bg-slate-800/80 border-slate-700" : "bg-slate-50/80 border-slate-200"} border-b\`}>
          <div className="p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={\`p-2.5 rounded-xl \${isDarkMode ? "bg-indigo-900/50 text-indigo-400" : "bg-indigo-100 text-indigo-600"}\`}>
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">سیاهه رویدادها (Audit Logs)</h3>
                  <p className={\`text-xs mt-0.5 \${isDarkMode ? "text-slate-400" : "text-slate-500"}\`}>گزارش جامع، جستجو، فیلتر و تحلیل اقدامات سامانه</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex gap-1 border p-1 rounded-lg dark:border-slate-700 border-slate-200">
                  <button onClick={handleExportCSV} title="دانلود CSV" disabled={filteredLogs.length === 0} className={\`px-3 py-1.5 rounded-md text-[10px] font-bold transition-colors flex items-center gap-1.5 \${isDarkMode ? "hover:bg-slate-800 text-slate-300 disabled:opacity-50" : "hover:bg-slate-100 text-slate-600 disabled:opacity-50"}\`}>
                    <Download className="h-3.5 w-3.5" /> <span className="hidden sm:inline">CSV</span>
                  </button>
                  <button onClick={handleExportJSON} title="دانلود JSON" disabled={filteredLogs.length === 0} className={\`px-3 py-1.5 rounded-md text-[10px] font-bold transition-colors flex items-center gap-1.5 \${isDarkMode ? "hover:bg-slate-800 text-slate-300 disabled:opacity-50" : "hover:bg-slate-100 text-slate-600 disabled:opacity-50"}\`}>
                    <FileJson className="h-3.5 w-3.5" /> <span className="hidden sm:inline">JSON</span>
                  </button>
                </div>
                
                {onClearLogs && (
                  <button 
                    onClick={() => window.confirm("آیا از پاک کردن تمامی تاریخچه اطمینان دارید؟") && onClearLogs()}
                    title="پاکسازی تاریخچه" disabled={auditLogs.length === 0}
                    className={\`p-2 rounded-lg transition-colors border \${isDarkMode ? "border-slate-700 hover:bg-red-900/30 hover:text-red-400 hover:border-red-900/50 text-slate-400 disabled:opacity-50" : "border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-slate-500 disabled:opacity-50"}\`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
                <div className={\`w-px h-6 mx-1 \${isDarkMode ? "bg-slate-700" : "bg-slate-300"}\`} />
                <button onClick={onClose} className={\`p-2 rounded-lg transition-colors \${isDarkMode ? "hover:bg-slate-800 text-slate-400 hover:text-white" : "hover:bg-slate-200 text-slate-500 hover:text-slate-900"}\`}>
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Filters Area */}
            <div className="flex flex-col xl:flex-row gap-3">
              <div className="flex flex-1 flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className={\`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 \${isDarkMode ? "text-slate-500" : "text-slate-400"}\`} />
                  <input type="text" placeholder="جستجو در متن، عملیات، کاربر..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    className={\`w-full text-xs py-2 pr-9 pl-4 rounded-lg border outline-none transition-all \${isDarkMode ? "bg-slate-900 border-slate-700 focus:border-indigo-500" : "bg-white border-slate-300 focus:border-indigo-500"}\`}
                  />
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <input type="date" value={dateRange.start} onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className={\`text-xs py-2 px-3 rounded-lg border outline-none transition-all w-1/2 sm:w-36 \${isDarkMode ? "bg-slate-900 border-slate-700 focus:border-indigo-500 [color-scheme:dark]" : "bg-white border-slate-300 focus:border-indigo-500"}\`}
                    title="از تاریخ"
                  />
                  <input type="date" value={dateRange.end} onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className={\`text-xs py-2 px-3 rounded-lg border outline-none transition-all w-1/2 sm:w-36 \${isDarkMode ? "bg-slate-900 border-slate-700 focus:border-indigo-500 [color-scheme:dark]" : "bg-white border-slate-300 focus:border-indigo-500"}\`}
                    title="تا تاریخ"
                  />
                </div>
              </div>

              <div className="flex gap-3 flex-wrap xl:flex-nowrap">
                <div className="relative flex-1 xl:w-40 min-w-[120px]">
                  <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
                    className={\`w-full text-xs py-2 px-3 rounded-lg border outline-none appearance-none transition-all \${isDarkMode ? "bg-slate-900 border-slate-700" : "bg-white border-slate-300"}\`}
                  >
                    <option value="all">همه انواع</option>
                    <option value="info">اطلاعات</option>
                    <option value="success">موفق</option>
                    <option value="warning">هشدار</option>
                    <option value="error">خطا</option>
                    <option value="auth">امنیتی</option>
                  </select>
                </div>
                <div className="relative flex-1 xl:w-48 min-w-[140px]">
                  <select value={filterAction} onChange={(e) => setFilterAction(e.target.value)}
                    className={\`w-full text-xs py-2 px-3 rounded-lg border outline-none appearance-none transition-all \${isDarkMode ? "bg-slate-900 border-slate-700" : "bg-white border-slate-300"}\`}
                  >
                    <option value="all">همه عملیات‌ها</option>
                    {uniqueActions.map(action => <option key={action} value={action}>{action}</option>)}
                  </select>
                </div>
                <button onClick={() => setSortOrder(prev => prev === "desc" ? "asc" : "desc")}
                  className={\`px-3 py-2 rounded-lg border flex items-center justify-center gap-1.5 text-xs font-bold transition-colors w-full sm:w-auto \${isDarkMode ? "bg-slate-900 border-slate-700 hover:bg-slate-800" : "bg-white border-slate-300 hover:bg-slate-100"}\`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{sortOrder === "desc" ? "جدیدترین‌ها" : "قدیمی‌ترین‌ها"}</span>
                </button>
              </div>
            </div>
          </div>
          
          {/* Tab Navigation */}
          <div className="px-5 flex gap-1">
            <button onClick={() => setActiveTab("timeline")} className={\`px-4 py-2 text-xs font-bold rounded-t-lg transition-colors flex items-center gap-2 border-b-2 \${activeTab === "timeline" ? (isDarkMode ? "bg-slate-900/50 text-indigo-400 border-indigo-500" : "bg-white text-indigo-600 border-indigo-600") : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"}\`}>
              <Clock className="w-4 h-4" /> خط زمانی
            </button>
            <button onClick={() => setActiveTab("table")} className={\`px-4 py-2 text-xs font-bold rounded-t-lg transition-colors flex items-center gap-2 border-b-2 \${activeTab === "table" ? (isDarkMode ? "bg-slate-900/50 text-indigo-400 border-indigo-500" : "bg-white text-indigo-600 border-indigo-600") : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"}\`}>
              <Table className="w-4 h-4" /> نمای جدول
            </button>
            <button onClick={() => setActiveTab("analytics")} className={\`px-4 py-2 text-xs font-bold rounded-t-lg transition-colors flex items-center gap-2 border-b-2 \${activeTab === "analytics" ? (isDarkMode ? "bg-slate-900/50 text-indigo-400 border-indigo-500" : "bg-white text-indigo-600 border-indigo-600") : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"}\`}>
              <BarChart3 className="w-4 h-4" /> تحلیل و آمار
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className={\`flex-1 overflow-y-auto \${isDarkMode ? "bg-slate-900" : "bg-slate-50"}\`}>
          {auditLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full opacity-50 py-20">
              <Activity className="h-12 w-12 mb-4" />
              <span className="text-sm">هیچ رویدادی تا کنون ثبت نشده است.</span>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full opacity-50 py-20">
              <Search className="h-12 w-12 mb-4" />
              <span className="text-sm">رویدادی مطابق با جستجوی شما یافت نشد.</span>
            </div>
          ) : (
            <>
              {/* TAB: TIMELINE */}
              {activeTab === "timeline" && (
                <div className="p-5 md:p-8 space-y-4 relative before:absolute before:inset-0 before:ml-5 md:before:ml-[50%] before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-indigo-300 before:to-transparent dark:before:via-indigo-800/50">
                  <AnimatePresence initial={false}>
                    {paginatedLogs.map((log) => {
                      const d = new Date(log.timestamp);
                      const timeStr = d.toLocaleTimeString("fa-IR", { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                      const dateStr = d.toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" });
                      const styles = getTypeStyles(log.type);
                      const isExpanded = expandedLogId === log.id;
                      
                      return (
                        <motion.div 
                          key={log.id} 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="relative flex flex-col md:flex-row items-start md:items-center justify-start md:justify-center group w-full"
                        >
                          <div className={\`hidden md:block w-[calc(50%-2rem)] \${md:group-odd:pr-8 md:group-even:pl-8} \${md:group-odd:text-right md:group-even:text-left}\`}>
                            {/* Empty space on opposite side for desktop layout */}
                          </div>

                          <div className={\`flex items-center justify-center w-8 h-8 rounded-full border-4 shrink-0 shadow-sm z-10 mx-4 \${isDarkMode ? styles.dark : styles.light} absolute left-1 md:left-auto md:relative top-2 md:top-auto\`}>
                            {styles.icon}
                          </div>
                          
                          <div className={\`w-[calc(100%-3.5rem)] ml-14 md:ml-0 md:w-[calc(50%-2rem)] p-4 rounded-xl border shadow-sm transition-all hover:shadow-md \${
                            isDarkMode ? "border-slate-800 bg-slate-800/60 hover:bg-slate-800" : "border-slate-200 bg-white hover:border-indigo-100"
                          }\`}>
                            <div className="flex flex-wrap items-start justify-between gap-2 mb-2 border-b pb-2 border-slate-200/50 dark:border-slate-700/50">
                              <h4 className={\`font-bold text-sm \${isDarkMode ? styles.titleDark : styles.titleLight}\`}>{log.action}</h4>
                              <div className="flex items-center gap-1.5 text-[10px] font-medium px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 shrink-0">
                                <Calendar className="w-3 h-3" />
                                <time dir="ltr">{dateStr} {timeStr}</time>
                              </div>
                            </div>
                            
                            <p className={\`text-xs leading-loose mb-3 \${isDarkMode ? "text-slate-300" : "text-slate-600"}\`}>{log.details}</p>
                            
                            {log.metadata && (
                              <div className="mb-3">
                                <button 
                                  onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                                  className={\`text-[10px] font-bold flex items-center gap-1 hover:underline \${isDarkMode ? "text-indigo-400" : "text-indigo-600"}\`}
                                >
                                  {isExpanded ? "پنهان کردن جزئیات" : "مشاهده جزئیات سیستمی (Metadata)"}
                                </button>
                                {isExpanded && (
                                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-2">
                                    <pre className={\`text-[10px] p-2 rounded-lg overflow-x-auto \${isDarkMode ? "bg-slate-950 text-slate-300" : "bg-slate-100 text-slate-700"}\`} dir="ltr">
                                      {JSON.stringify(log.metadata, null, 2)}
                                    </pre>
                                  </motion.div>
                                )}
                              </div>
                            )}

                            <div className={\`flex items-center justify-between pt-2 border-t text-[10px] \${isDarkMode ? "border-slate-700/50" : "border-slate-100"}\`}>
                              <div className={\`flex items-center gap-1.5 \${isDarkMode ? "text-slate-400" : "text-slate-500"}\`}>
                                <User className="w-3 h-3" />
                                <span>{log.user?.name || 'سیستم'}</span>
                                <span className={\`px-1.5 py-0.5 rounded opacity-80 \${isDarkMode ? "bg-slate-700" : "bg-slate-200"}\`}>
                                  {log.user?.role === 'admin' ? 'مدیر' : log.user?.role === 'user' ? 'کاربر' : 'سیستم'}
                                </span>
                              </div>
                              <span className={\`font-mono text-[9px] uppercase tracking-wider \${isDarkMode ? "text-slate-600" : "text-slate-400"}\`}>ID: {log.id}</span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}

              {/* TAB: TABLE */}
              {activeTab === "table" && (
                <div className="p-4 sm:p-5">
                  <div className={\`rounded-xl border overflow-x-auto \${isDarkMode ? "border-slate-800 bg-slate-900/50" : "border-slate-200 bg-white"}\`}>
                    <table className="w-full text-xs text-right">
                      <thead className={\`text-slate-500 dark:text-slate-400 \${isDarkMode ? "bg-slate-800/80" : "bg-slate-50"}\`}>
                        <tr>
                          <th className="p-3 font-bold">زمان</th>
                          <th className="p-3 font-bold">نوع</th>
                          <th className="p-3 font-bold">عملیات</th>
                          <th className="p-3 font-bold">توضیحات</th>
                          <th className="p-3 font-bold">کاربر</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                        {paginatedLogs.map((log) => {
                          const d = new Date(log.timestamp);
                          const styles = getTypeStyles(log.type);
                          return (
                            <tr key={log.id} className={\`transition-colors \${isDarkMode ? "hover:bg-slate-800/40" : "hover:bg-slate-50"}\`}>
                              <td className="p-3 whitespace-nowrap text-slate-500 dark:text-slate-400" dir="ltr">
                                {d.toLocaleDateString("fa-IR")} - {d.toLocaleTimeString("fa-IR", { hour: '2-digit', minute: '2-digit' })}
                              </td>
                              <td className="p-3">
                                <span className={\`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold \${styles.badge}\`}>
                                  {styles.icon}
                                  {log.type === 'success' ? 'موفق' : log.type === 'error' ? 'خطا' : log.type === 'warning' ? 'هشدار' : log.type === 'auth' ? 'امنیتی' : 'اطلاعات'}
                                </span>
                              </td>
                              <td className={\`p-3 font-bold whitespace-nowrap \${isDarkMode ? styles.titleDark : styles.titleLight}\`}>{log.action}</td>
                              <td className={\`p-3 min-w-[200px] \${isDarkMode ? "text-slate-300" : "text-slate-700"}\`}>{log.details}</td>
                              <td className="p-3 whitespace-nowrap">
                                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                                  <User className="w-3.5 h-3.5" />
                                  <span>{log.user?.name || 'سیستم'}</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB: ANALYTICS */}
              {activeTab === "analytics" && (
                <div className="p-4 sm:p-5 space-y-5">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className={\`p-4 rounded-xl border \${isDarkMode ? "border-slate-800 bg-slate-800/40" : "border-slate-200 bg-white"}\`}>
                      <span className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">مجموع رویدادهای فیلتر شده</span>
                      <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{stats.filteredTotal.toLocaleString("fa-IR")}</span>
                    </div>
                    <div className={\`p-4 rounded-xl border \${isDarkMode ? "border-slate-800 bg-slate-800/40" : "border-slate-200 bg-white"}\`}>
                      <span className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">موفق / اطلاعاتی</span>
                      <span className="text-2xl font-black text-emerald-500">{(stats.success + (stats.filteredTotal - stats.errors - stats.warnings - stats.auth - stats.success)).toLocaleString("fa-IR")}</span>
                    </div>
                    <div className={\`p-4 rounded-xl border \${isDarkMode ? "border-slate-800 bg-slate-800/40" : "border-slate-200 bg-white"}\`}>
                      <span className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">هشدارها</span>
                      <span className="text-2xl font-black text-amber-500">{stats.warnings.toLocaleString("fa-IR")}</span>
                    </div>
                    <div className={\`p-4 rounded-xl border \${isDarkMode ? "border-slate-800 bg-slate-800/40" : "border-slate-200 bg-white"}\`}>
                      <span className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">خطاها</span>
                      <span className="text-2xl font-black text-rose-500">{stats.errors.toLocaleString("fa-IR")}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className={\`p-5 rounded-xl border md:col-span-1 \${isDarkMode ? "border-slate-800 bg-slate-800/30" : "border-slate-200 bg-white"}\`}>
                      <h4 className="text-sm font-bold mb-4 flex items-center gap-2 text-slate-700 dark:text-slate-200">
                        <PieChart className="w-4 h-4" /> توزیع رویدادها
                      </h4>
                      <div className="h-64 w-full" dir="ltr">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={chartData.pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                              {chartData.pieData.map((entry, index) => <Cell key={\`cell-\${index}\`} fill={entry.color} />)}
                            </Pie>
                            <RechartsTooltip 
                              contentStyle={{ 
                                backgroundColor: isDarkMode ? '#1e293b' : '#fff', 
                                borderColor: isDarkMode ? '#334155' : '#e2e8f0',
                                borderRadius: '0.75rem',
                                color: isDarkMode ? '#f8fafc' : '#0f172a',
                                fontSize: '12px'
                              }} 
                              formatter={(value: number) => [value.toLocaleString("fa-IR"), 'تعداد']}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex flex-wrap justify-center gap-3 mt-2">
                        {chartData.pieData.map(entry => (
                          <div key={entry.name} className="flex items-center gap-1.5 text-[10px] font-medium text-slate-600 dark:text-slate-300">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                            {entry.name} ({entry.value.toLocaleString("fa-IR")})
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className={\`p-5 rounded-xl border md:col-span-2 \${isDarkMode ? "border-slate-800 bg-slate-800/30" : "border-slate-200 bg-white"}\`}>
                      <h4 className="text-sm font-bold mb-4 flex items-center gap-2 text-slate-700 dark:text-slate-200">
                        <Activity className="w-4 h-4" /> فعالیت طی زمان (روزهای اخیر)
                      </h4>
                      <div className="h-64 w-full" dir="ltr">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData.lineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#334155" : "#e2e8f0"} />
                            <XAxis dataKey="date" tick={{ fontSize: 10, fill: isDarkMode ? "#94a3b8" : "#64748b" }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 10, fill: isDarkMode ? "#94a3b8" : "#64748b" }} axisLine={false} tickLine={false} />
                            <RechartsTooltip 
                              contentStyle={{ 
                                backgroundColor: isDarkMode ? '#1e293b' : '#fff', 
                                borderColor: isDarkMode ? '#334155' : '#e2e8f0',
                                borderRadius: '0.75rem',
                                color: isDarkMode ? '#f8fafc' : '#0f172a',
                                fontSize: '12px'
                              }}
                              formatter={(value: number) => [value.toLocaleString("fa-IR"), 'تعداد']}
                              labelStyle={{ color: isDarkMode ? '#94a3b8' : '#64748b', marginBottom: '4px' }}
                            />
                            <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Pagination Footer (Only for Timeline & Table) */}
        {activeTab !== "analytics" && filteredLogs.length > 0 && (
          <div className={\`p-4 border-t flex items-center justify-between shrink-0 \${isDarkMode ? "bg-slate-800/80 border-slate-700" : "bg-slate-50 border-slate-200"}\`}>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              نمایش <span className="font-bold text-slate-700 dark:text-slate-200">{((currentPage - 1) * itemsPerPage + 1).toLocaleString("fa-IR")}</span> تا <span className="font-bold text-slate-700 dark:text-slate-200">{Math.min(currentPage * itemsPerPage, filteredLogs.length).toLocaleString("fa-IR")}</span> از <span className="font-bold text-slate-700 dark:text-slate-200">{filteredLogs.length.toLocaleString("fa-IR")}</span> رویداد
            </div>
            
            <div className="flex items-center gap-2" dir="ltr">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={\`p-1.5 rounded-lg border transition-colors \${isDarkMode ? "border-slate-700 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:hover:bg-transparent" : "border-slate-300 hover:bg-slate-200 text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent"}\`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <span className="text-xs font-bold w-12 text-center text-slate-700 dark:text-slate-200">
                {currentPage.toLocaleString("fa-IR")} / {totalPages.toLocaleString("fa-IR")}
              </span>
              
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={\`p-1.5 rounded-lg border transition-colors \${isDarkMode ? "border-slate-700 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:hover:bg-transparent" : "border-slate-300 hover:bg-slate-200 text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent"}\`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
`

fs.writeFileSync('src/components/AuditLogsModal.tsx', code);
