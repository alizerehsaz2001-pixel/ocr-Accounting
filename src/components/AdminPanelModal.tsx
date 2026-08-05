import React, { useState } from "react";
import {
  Shield, Users, ShieldCheck, Activity, Download, Trash2, X, User,
  Building, Phone, HardDrive, Cpu, Edit2, Ban, CheckCircle2, Upload,
  List, FileSpreadsheet, Database, Plus, FileText, Settings, KeyRound,
  Lock, Unlock, Eye, EyeOff, AlertCircle, Terminal, Coins, AlertTriangle, RefreshCw,
  Search, Filter, Check, Copy, Sparkles, ShieldAlert, Server,
  ArrowUpRight, Zap, Mail, BarChart2, CheckCircle, Clock, Info
} from "lucide-react";
import * as XLSX from "xlsx";

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  currentUser: any;
  setCurrentUser?: React.Dispatch<React.SetStateAction<any>>;
  users: any[];
  setUsers: React.Dispatch<React.SetStateAction<any[]>>;
  adminMasterPin: string;
  setAdminMasterPin: (pin: string) => void;
  transactions: any[];
  setTransactions: React.Dispatch<React.SetStateAction<any[]>>;
  previousScans: any[];
  setPreviousScans: React.Dispatch<React.SetStateAction<any[]>>;
  modelQuotas: any;
  setModelQuotas: React.Dispatch<React.SetStateAction<any>>;
  auditLogs: any[];
  showNotification: (msg: string, type: "success" | "error" | "info" | "warning") => void;
  logEvent: (action: string, details: string, type?: "info" | "success" | "warning" | "error" | "auth") => void;
  setIsTokenManagerOpen: (open: boolean) => void;
  rawJsonText?: string;
  setRawJsonText?: (txt: string) => void;
  setActiveFile?: (file: any) => void;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  isDarkMode,
  currentUser,
  setCurrentUser,
  users,
  setUsers,
  adminMasterPin,
  setAdminMasterPin,
  transactions,
  setTransactions,
  previousScans,
  setPreviousScans,
  modelQuotas,
  setModelQuotas,
  auditLogs,
  showNotification,
  logEvent,
  setIsTokenManagerOpen,
  rawJsonText,
  setRawJsonText,
  setActiveFile
}) => {
  const [adminPanelTab, setAdminPanelTab] = useState<"users" | "security" | "system" | "data" | "danger">("users");
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState<string>("all");
  const [userStatusFilter, setUserStatusFilter] = useState<string>("all");

  const updateUserInFirestore = async (userId: string, updates: any) => {
    // Local storage persistence or local state update handled directly
  };

  // PIN change form
  const [pinForm, setPinForm] = useState({ current: "", newPin: "", confirm: "" });
  const [showCurrentPin, setShowCurrentPin] = useState(false);

  // New user form modal
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "user", companyName: "", phone: "" });

  // Edit user form modal
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [isRegistrationUnlocked, setIsRegistrationUnlocked] = useState(false);

  // Terminal log search & controls
  const [terminalFilter, setTerminalFilter] = useState("");
  const [copiedLogs, setCopiedLogs] = useState(false);

  // Audit Log filter tab
  const [auditFilterTab, setAuditFilterTab] = useState<"all" | "auth" | "warning" | "info" | "error">("all");

  if (!isOpen || currentUser?.role !== "admin") return null;

  // Users Filter
  const filteredUsers = users.filter(u => {
    const matchesSearch =
      u.name?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      u.companyName?.toLowerCase().includes(userSearchTerm.toLowerCase());
    
    const matchesRole = userRoleFilter === "all" || u.role === userRoleFilter;
    const matchesStatus = userStatusFilter === "all" || (u.status || "active") === userStatusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  // User Stats summary
  const totalUsersCount = users.length;
  const activeUsersCount = users.filter(u => u.status === "active" || !u.status).length;
  const totalTokensUsed = users.reduce((acc, u) => acc + (u.apiUsage || 0), 0);
  const totalStorageGb = users.reduce((acc, u) => acc + 5 + (u.extraStorage || 0), 0);

  const handleUpdatePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinForm.current !== adminMasterPin) {
      showNotification("کد اختصاصی فعلی ادمین نادرست است.", "error");
      return;
    }
    if (pinForm.newPin.length < 4) {
      showNotification("کد اختصاصی جدید باید حداقل ۴ رقم باشد.", "error");
      return;
    }
    if (pinForm.newPin !== pinForm.confirm) {
      showNotification("تکرار کد اختصاصی جدید مطابقت ندارد.", "error");
      return;
    }

    setAdminMasterPin(pinForm.newPin);
    localStorage.setItem("admin_master_pin", pinForm.newPin);
    setPinForm({ current: "", newPin: "", confirm: "" });
    showNotification("کد اختصاصی جدید ادمین با موفقیت ذخیره شد.", "success");
    logEvent("تغییر کد اختصاصی ادمین", "کد اختصاصی ورود به پنل مدیریت به‌روزرسانی شد.", "auth");
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name.trim()) {
      showNotification("لطفاً نام کاربر را وارد کنید.", "error");
      return;
    }
    const created = {
      id: "usr-" + Date.now(),
      name: newUser.name,
      email: newUser.email || "user@company.ir",
      role: newUser.role,
      companyName: newUser.companyName || "مؤسسه حسابداری",
      phone: newUser.phone || "",
      status: "active",
      isOnboarded: true,
      apiUsage: 0,
      extraStorage: 0,
      createdAt: new Date().toISOString()
    };
    setUsers(prev => [created, ...prev]);
    updateUserInFirestore(created.id, created);
    setNewUser({ name: "", email: "", role: "user", companyName: "", phone: "" });
    setShowAddUserModal(false);
    showNotification(`کاربر جدید «${created.name}» با موفقیت تعریف گردید.`, "success");
    logEvent("تعریف کاربر جدید", `کاربر «${created.name}» با نقش ${created.role} توسط مدیر ایجاد شد.`, "info");
  };

  const handleEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!editingUser.name.trim()) {
      showNotification("لطفاً نام کاربر را وارد کنید.", "error");
      return;
    }
    setUsers(prev => prev.map(usr => usr.id === editingUser.id ? editingUser : usr));
    updateUserInFirestore(editingUser.id, editingUser);
    setShowEditUserModal(false);
    showNotification(`اطلاعات کاربر «${editingUser.name}» با موفقیت ویرایش و همگام‌سازی شد.`, "success");
    logEvent("ویرایش کاربر", `اطلاعات شناسنامه و دسترسی کاربر «${editingUser.name}» بروزرسانی شد.`, "info");
  };

  const handleCopyLogs = () => {
    const text = auditLogs.map(l => `[${new Date(l.timestamp).toISOString()}] [${l.action}] ${l.details}`).join("\n");
    navigator.clipboard.writeText(text);
    setCopiedLogs(true);
    setTimeout(() => setCopiedLogs(false), 2000);
    showNotification("لاگ‌های سیستم در حافظه کپی شدند.", "info");
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className={`relative w-full max-w-6xl h-[92vh] max-h-[850px] rounded-[32px] shadow-2xl flex flex-col md:flex-row overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-300 border ${
        isDarkMode 
          ? "bg-[#0b101d] border-slate-800 text-slate-100 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)]" 
          : "bg-slate-50 border-slate-200 text-slate-800 shadow-[0_25px_60px_-15px_rgba(15,23,42,0.15)]"
      }`} dir="rtl">
        
        {/* Sidebar Navigation */}
        <div className={`w-full md:w-72 flex flex-col shrink-0 border-b md:border-b-0 md:border-l ${
          isDarkMode ? "bg-slate-900/90 border-slate-800/80" : "bg-white border-slate-200/80"
        }`}>
          {/* Header Badge & Title */}
          <div className="p-5 pb-4 border-b dark:border-slate-800/60 border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-[15px] leading-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                    پنل ارشد مدیریت
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  </h3>
                  <span className="text-[10px] font-mono text-indigo-500 dark:text-indigo-400 font-bold tracking-wider block">
                    SUPER ADMIN COMMAND
                  </span>
                </div>
              </div>
            </div>

            {/* Live Status indicator pill */}
            <div className="mt-3 flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-950/30 dark:bg-slate-950/60 border dark:border-slate-800 border-slate-200/80 text-[10px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                <span className="font-bold text-slate-700 dark:text-slate-300">سیستم آنلاین</span>
              </div>
              <span className="font-mono text-indigo-400 dark:text-indigo-300 font-bold">Firestore Sync</span>
            </div>
          </div>
          
          {/* Navigation Items */}
          <div className="flex-1 overflow-y-auto p-3 flex flex-row md:flex-col gap-1.5 custom-scrollbar">
            <button 
              onClick={() => setAdminPanelTab("users")}
              className={`flex-1 md:flex-none flex items-center gap-3 px-3.5 py-3 rounded-2xl text-[12px] font-bold transition-all duration-200 group relative ${
                adminPanelTab === "users" 
                  ? (isDarkMode ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-sm" : "bg-indigo-50 text-indigo-900 border border-indigo-200/80 shadow-sm") 
                  : (isDarkMode ? "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900")
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all ${
                adminPanelTab === "users" ? "bg-indigo-500 text-white" : "bg-slate-500/10 opacity-70 group-hover:opacity-100"
              }`}>
                <Users className="w-4 h-4" />
              </div>
              <span className="truncate">کاربران و دسترسی‌ها</span>
              <span className="mr-auto px-2 py-0.5 rounded-lg text-[10px] font-mono font-black bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                {users.length}
              </span>
            </button>

            <button 
              onClick={() => setAdminPanelTab("security")}
              className={`flex-1 md:flex-none flex items-center gap-3 px-3.5 py-3 rounded-2xl text-[12px] font-bold transition-all duration-200 group relative ${
                adminPanelTab === "security" 
                  ? (isDarkMode ? "bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm" : "bg-amber-50 text-amber-900 border border-amber-200/80 shadow-sm") 
                  : (isDarkMode ? "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900")
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all ${
                adminPanelTab === "security" ? "bg-amber-500 text-white" : "bg-slate-500/10 opacity-70 group-hover:opacity-100"
              }`}>
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="truncate">امنیت و کد اختصاصی</span>
            </button>

            <button 
              onClick={() => setAdminPanelTab("system")}
              className={`flex-1 md:flex-none flex items-center gap-3 px-3.5 py-3 rounded-2xl text-[12px] font-bold transition-all duration-200 group relative ${
                adminPanelTab === "system" 
                  ? (isDarkMode ? "bg-purple-500/15 text-purple-300 border border-purple-500/30 shadow-sm" : "bg-purple-50 text-purple-900 border border-purple-200/80 shadow-sm") 
                  : (isDarkMode ? "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900")
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all ${
                adminPanelTab === "system" ? "bg-purple-500 text-white" : "bg-slate-500/10 opacity-70 group-hover:opacity-100"
              }`}>
                <Activity className="w-4 h-4" />
              </div>
              <span className="truncate">پایش زنده و سلامت</span>
            </button>

            <button 
              onClick={() => setAdminPanelTab("data")}
              className={`flex-1 md:flex-none flex items-center gap-3 px-3.5 py-3 rounded-2xl text-[12px] font-bold transition-all duration-200 group relative ${
                adminPanelTab === "data" 
                  ? (isDarkMode ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm" : "bg-emerald-50 text-emerald-900 border border-emerald-200/80 shadow-sm") 
                  : (isDarkMode ? "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900")
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all ${
                adminPanelTab === "data" ? "bg-emerald-500 text-white" : "bg-slate-500/10 opacity-70 group-hover:opacity-100"
              }`}>
                <Download className="w-4 h-4" />
              </div>
              <span className="truncate">پشتیبان‌گیری و داده‌ها</span>
            </button>

            <button 
              onClick={() => setAdminPanelTab("danger")}
              className={`flex-1 md:flex-none flex items-center gap-3 px-3.5 py-3 rounded-2xl text-[12px] font-bold transition-all duration-200 group relative ${
                adminPanelTab === "danger" 
                  ? (isDarkMode ? "bg-rose-950/50 text-rose-300 border border-rose-800/50 shadow-sm" : "bg-rose-50 text-rose-800 border border-rose-200 shadow-sm") 
                  : (isDarkMode ? "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900")
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all ${
                adminPanelTab === "danger" ? "bg-rose-600 text-white" : "bg-slate-500/10 opacity-70 group-hover:opacity-100"
              }`}>
                <ShieldAlert className="w-4 h-4" />
              </div>
              <span className="truncate">منطقه خطر</span>
            </button>
          </div>

          {/* Sidebar Footer Info */}
          <div className="hidden md:block p-4 m-3 rounded-2xl border text-[11px] bg-slate-950/20 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 font-mono mb-1">
              <span>کد اختصاصی ادمین:</span>
              <span className="font-bold text-indigo-500 dark:text-indigo-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                فعال
              </span>
            </div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
              <User className="w-3 h-3" />
              <span>ورود به‌عنوان: {currentUser?.name || "ادمین ارشد"}</span>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col relative overflow-hidden bg-transparent">
          {/* Top Bar with Close Button */}
          <div className="p-4 sm:p-6 pb-0 flex items-center justify-between border-b dark:border-slate-800/60 border-slate-100 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest font-mono">
                {adminPanelTab === "users" && "User & Access Management"}
                {adminPanelTab === "security" && "Security & Master PIN"}
                {adminPanelTab === "system" && "Live Monitoring & Health"}
                {adminPanelTab === "data" && "Data Management & Backup"}
                {adminPanelTab === "danger" && "Critical Operations"}
              </span>
            </div>

            <button 
              onClick={onClose}
              className={`p-2 rounded-full transition-all duration-200 border ${
                isDarkMode 
                  ? "bg-slate-800/80 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white" 
                  : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
              }`}
              title="بستن پنل"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 custom-scrollbar">
            
            {/* 1. USERS & ACCESS MANAGEMENT TAB */}
            {adminPanelTab === "users" && (
              <div className="space-y-6 animate-in fade-in duration-300 max-w-5xl mx-auto pb-8">
                
                {/* Executive Overview KPI Row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                  <div className={`p-4 rounded-2xl border transition-all ${
                    isDarkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200 shadow-sm"
                  }`}>
                    <div className="flex items-center justify-between text-slate-400 mb-2">
                      <span className="text-[11px] font-bold">کل کاربران</span>
                      <Users className="w-4 h-4 text-indigo-500" />
                    </div>
                    <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                      {totalUsersCount.toLocaleString("fa-IR")}
                    </div>
                    <span className="text-[10px] text-emerald-500 font-bold mt-1 block">
                      {activeUsersCount} کاربر فعال
                    </span>
                  </div>

                  <div className={`p-4 rounded-2xl border transition-all ${
                    isDarkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200 shadow-sm"
                  }`}>
                    <div className="flex items-center justify-between text-slate-400 mb-2">
                      <span className="text-[11px] font-bold">کاربران فعال</span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                      {activeUsersCount.toLocaleString("fa-IR")}
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold mt-1 block">
                      {((activeUsersCount / (totalUsersCount || 1)) * 100).toFixed(0)}٪ از کل سیستم
                    </span>
                  </div>

                  <div className={`p-4 rounded-2xl border transition-all ${
                    isDarkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200 shadow-sm"
                  }`}>
                    <div className="flex items-center justify-between text-slate-400 mb-2">
                      <span className="text-[11px] font-bold">مصرف توکن هوش مصنوعی</span>
                      <Coins className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400">
                      {totalTokensUsed.toLocaleString("fa-IR")}
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold mt-1 block">
                      تخمیـن هزینه: ${((totalTokensUsed / 1000000) * 0.15).toFixed(2)} USD
                    </span>
                  </div>

                  <div className={`p-4 rounded-2xl border transition-all ${
                    isDarkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200 shadow-sm"
                  }`}>
                    <div className="flex items-center justify-between text-slate-400 mb-2">
                      <span className="text-[11px] font-bold">حجم اختصاص یافته ابری</span>
                      <HardDrive className="w-4 h-4 text-purple-500" />
                    </div>
                    <div className="text-2xl font-black font-mono text-purple-600 dark:text-purple-400">
                      {totalStorageGb.toLocaleString("fa-IR")} GB
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold mt-1 block">
                      مجموع فضای ۵GB + اختصاصی
                    </span>
                  </div>
                </div>

                {/* Header & Action Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                  <div>
                    <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                      مدیریت کاربران و دسترسی‌ها
                    </h4>
                    <p className={`text-xs mt-0.5 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                      تعیین نقش، تخصیص حجم اضافه، مدیریت کلید API و ویرایش شناسنامه
                    </p>
                  </div>

                  <button
                    onClick={() => setShowAddUserModal(true)}
                    className="px-4 py-2.5 rounded-2xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    تعریف کاربر جدید
                  </button>
                </div>

                {/* Filters & Search Control */}
                <div className="flex flex-col md:flex-row items-stretch gap-3">
                  {/* Search Input */}
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      placeholder="جستجوی کاربر بر اساس نام، ایمیل، تلفن یا نام شرکت..."
                      className={`w-full py-2.5 px-4 pr-10 text-xs rounded-2xl border outline-none transition-all ${
                        isDarkMode 
                          ? "bg-slate-900/80 border-slate-800 text-white focus:border-indigo-500" 
                          : "bg-white border-slate-200 text-slate-800 focus:border-indigo-500 shadow-sm"
                      }`}
                    />
                    <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    {userSearchTerm && (
                      <button
                        onClick={() => setUserSearchTerm("")}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Role Filter Selector */}
                  <div className="flex items-center gap-2">
                    <select
                      value={userRoleFilter}
                      onChange={(e) => setUserRoleFilter(e.target.value)}
                      className={`py-2.5 px-3 text-xs font-bold rounded-2xl border outline-none cursor-pointer transition-all ${
                        isDarkMode 
                          ? "bg-slate-900 border-slate-800 text-slate-200 focus:border-indigo-500" 
                          : "bg-white border-slate-200 text-slate-700 focus:border-indigo-500 shadow-sm"
                      }`}
                    >
                      <option value="all">همه نقش‌ها</option>
                      <option value="admin">مدیر سیستم (Admin)</option>
                      <option value="manager">مدیر مالی (Manager)</option>
                      <option value="auditor">حسابرس (Auditor)</option>
                      <option value="user">کاربر عادی / حسابدار</option>
                    </select>

                    {/* Status Filter Selector */}
                    <select
                      value={userStatusFilter}
                      onChange={(e) => setUserStatusFilter(e.target.value)}
                      className={`py-2.5 px-3 text-xs font-bold rounded-2xl border outline-none cursor-pointer transition-all ${
                        isDarkMode 
                          ? "bg-slate-900 border-slate-800 text-slate-200 focus:border-indigo-500" 
                          : "bg-white border-slate-200 text-slate-700 focus:border-indigo-500 shadow-sm"
                      }`}
                    >
                      <option value="all">همه وضعیت‌ها</option>
                      <option value="active">فقط فعال</option>
                      <option value="suspended">فقط مسدود</option>
                    </select>
                  </div>
                </div>

                {/* Users Cards List */}
                <div className="space-y-4">
                  {filteredUsers.length === 0 ? (
                    <div className={`p-10 rounded-3xl text-center border ${
                      isDarkMode ? "bg-slate-900/40 border-slate-800 text-slate-400" : "bg-white border-slate-200 text-slate-500"
                    }`}>
                      <Users className="w-10 h-10 mx-auto mb-3 opacity-40 text-indigo-500" />
                      <p className="font-bold text-sm">هیچ کاربری با مشخصات جستجو شده یافت نشد.</p>
                      <p className="text-xs mt-1">لطفاً عبارات جستجو را تغییر داده یا فیلترها را بازنشانی کنید.</p>
                    </div>
                  ) : (
                    filteredUsers.map(u => {
                      const costUsd = ((u.apiUsage || 0) / 1000000) * 0.15;
                      const hasCustomKey = !!u.geminiApiKey;
                      const isSuspended = u.status === "suspended";

                      return (
                        <div key={u.id} className={`p-5 rounded-3xl flex flex-col gap-5 transition-all duration-300 border relative overflow-hidden ${
                          isDarkMode 
                            ? "bg-slate-900/50 border-slate-800/90 hover:border-slate-700 hover:bg-slate-900/80 shadow-lg shadow-black/20" 
                            : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-md shadow-sm"
                        }`}>
                          {/* Accent line on top of card depending on role */}
                          <div className={`absolute top-0 right-0 left-0 h-[3px] opacity-80 ${
                            u.role === "admin" 
                              ? "bg-gradient-to-l from-indigo-500 via-purple-500 to-indigo-600"
                              : u.role === "manager"
                              ? "bg-gradient-to-l from-amber-500 to-orange-500"
                              : u.role === "auditor"
                              ? "bg-gradient-to-l from-emerald-500 to-teal-500"
                              : "bg-slate-400"
                          }`} />

                          {/* Profile Header Row */}
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-1">
                            <div className="flex items-center gap-4">
                              {/* Avatar Block */}
                              <div className={`w-13 h-13 rounded-2xl flex items-center justify-center font-black text-lg shrink-0 border shadow-inner ${
                                u.role === "admin" 
                                  ? (isDarkMode ? "bg-indigo-950/60 border-indigo-500/40 text-indigo-300" : "bg-indigo-50 border-indigo-200 text-indigo-700")
                                  : u.role === "manager"
                                  ? (isDarkMode ? "bg-amber-950/60 border-amber-500/40 text-amber-300" : "bg-amber-50 border-amber-200 text-amber-700")
                                  : u.role === "auditor"
                                  ? (isDarkMode ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-300" : "bg-emerald-50 border-emerald-200 text-emerald-700")
                                  : (isDarkMode ? "bg-slate-800 border-slate-700 text-slate-300" : "bg-slate-100 border-slate-200 text-slate-700")
                              }`}>
                                {u.name ? u.name.charAt(0) : "U"}
                              </div>
                              
                              <div className="space-y-1 text-right">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h5 className="font-black text-base text-slate-900 dark:text-white">{u.name}</h5>
                                  
                                  {/* Role Tags */}
                                  {u.role === "admin" && (
                                    <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black ${
                                      isDarkMode ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/30" : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                    }`}>
                                      مدیر سیستم
                                    </span>
                                  )}
                                  {u.role === "manager" && (
                                    <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black ${
                                      isDarkMode ? "bg-amber-500/15 text-amber-300 border border-amber-500/30" : "bg-amber-50 text-amber-700 border border-amber-200"
                                    }`}>
                                      مدیر مالی
                                    </span>
                                  )}
                                  {u.role === "auditor" && (
                                    <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black ${
                                      isDarkMode ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    }`}>
                                      حسابرس
                                    </span>
                                  )}
                                  {u.role === "user" && (
                                    <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black ${
                                      isDarkMode ? "bg-slate-800 text-slate-300 border border-slate-700" : "bg-slate-100 text-slate-700 border border-slate-200"
                                    }`}>
                                      حسابدار
                                    </span>
                                  )}

                                  {!u.isOnboarded && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-lg bg-rose-500/10 text-rose-500 font-bold border border-rose-500/20">
                                      پروفایل ناقص
                                    </span>
                                  )}
                                </div>
                                
                                <div className={`text-[11px] flex flex-wrap gap-x-4 gap-y-1 font-semibold ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                                  {u.email && (
                                    <span className="flex items-center gap-1 opacity-90" dir="ltr">
                                      <Mail className="w-3 h-3 text-indigo-400" /> {u.email}
                                    </span>
                                  )}
                                  {u.companyName && (
                                    <span className="flex items-center gap-1 text-indigo-500 dark:text-indigo-400">
                                      <Building className="w-3 h-3"/> {u.companyName}
                                    </span>
                                  )}
                                  {u.phone && (
                                    <span className="flex items-center gap-1" dir="ltr">
                                      <Phone className="w-3 h-3 text-slate-400"/> {u.phone}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Actions Toolbar */}
                            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                              {/* Role Selector Dropdown */}
                              <select
                                value={u.role || "user"}
                                onChange={(e) => {
                                  const newRole = e.target.value;
                                  setUsers(prev => prev.map(usr => usr.id === u.id ? { ...usr, role: newRole } : usr));
                                  updateUserInFirestore(u.id, { role: newRole });
                                  showNotification(`نقش کاربر «${u.name}» به ${newRole} تغییر یافت.`, "success");
                                  logEvent("تغییر نقش کاربر", `نقش ${u.name} به ${newRole} تغییر کرد.`, "info");
                                }}
                                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border outline-none transition-all cursor-pointer ${
                                  u.role === "admin"
                                    ? (isDarkMode ? "bg-indigo-950/50 border-indigo-800 text-indigo-300" : "bg-indigo-50 border-indigo-200 text-indigo-800")
                                    : u.role === "manager"
                                    ? (isDarkMode ? "bg-amber-950/50 border-amber-800 text-amber-300" : "bg-amber-50 border-amber-200 text-amber-800")
                                    : u.role === "auditor"
                                    ? (isDarkMode ? "bg-emerald-950/50 border-emerald-800 text-emerald-300" : "bg-emerald-50 border-emerald-200 text-emerald-800")
                                    : (isDarkMode ? "bg-slate-800 border-slate-700 text-slate-300" : "bg-slate-100 border-slate-200 text-slate-700")
                                }`}
                                title="تغییر سریع سطح دسترسی"
                              >
                                <option value="user">حسابدار / کاربر عادی</option>
                                <option value="manager">مدیر مالی</option>
                                <option value="auditor">حسابرس</option>
                                <option value="admin">مدیر ارشد سیستم (Admin)</option>
                              </select>

                              {/* Status Badge */}
                              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold border ${
                                !isSuspended 
                                  ? (isDarkMode ? "bg-emerald-950/40 border-emerald-800/80 text-emerald-400" : "bg-emerald-50 border-emerald-200 text-emerald-700")
                                  : (isDarkMode ? "bg-rose-950/40 border-rose-800/80 text-rose-400" : "bg-rose-50 border-rose-200 text-rose-700")
                              }`}>
                                <div className={`w-2 h-2 rounded-full ${!isSuspended ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
                                <span>{!isSuspended ? "فعال" : "مسدود"}</span>
                              </div>

                              {/* Edit Profile Button */}
                              <button
                                onClick={() => {
                                  setEditingUser({ ...u });
                                  setIsRegistrationUnlocked(false);
                                  setShowEditUserModal(true);
                                }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all border cursor-pointer ${
                                  isDarkMode 
                                    ? "bg-slate-800/80 border-slate-700 text-indigo-300 hover:text-indigo-200 hover:border-indigo-500/50 hover:bg-slate-800" 
                                    : "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
                                }`}
                                title="ویرایش کامل شناسنامه و پروفایل کاربر"
                              >
                                <Settings className="w-3.5 h-3.5 text-indigo-500" />
                                <span>ویرایش شناسنامه</span>
                              </button>

                              {/* Quick Block / Unblock Button */}
                              <button
                                onClick={() => {
                                  const newStatus = u.status === "active" ? "suspended" : "active";
                                  setUsers(prev => prev.map(usr => usr.id === u.id ? {...usr, status: newStatus} : usr));
                                  updateUserInFirestore(u.id, { status: newStatus });
                                  logEvent("تغییر وضعیت کاربر", `کاربر ${u.name} به وضعیت ${newStatus === "active" ? "فعال" : "مسدود"} تغییر یافت.`);
                                  showNotification(`وضعیت کاربر ${u.name} به ${newStatus === "active" ? "فعال" : "مسدود"} تغییر یافت.`, "success");
                                }}
                                className={`p-2 rounded-xl transition-all border cursor-pointer ${
                                  !isSuspended
                                    ? (isDarkMode ? "border-slate-800 text-slate-400 hover:bg-rose-950/50 hover:text-rose-400 hover:border-rose-800" : "border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200")
                                    : (isDarkMode ? "border-rose-800 bg-rose-950/30 text-rose-300 hover:bg-emerald-950/50 hover:text-emerald-300 hover:border-emerald-800" : "border-rose-300 bg-rose-50 text-rose-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300")
                                }`}
                                title={!isSuspended ? "مسدود کردن کاربر" : "فعال‌سازی مجدد کاربر"}
                              >
                                {!isSuspended ? <Ban className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>

                          {/* Bento Cards Row for User Metrics */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            {/* Card 1: Token Usage */}
                            <div className={`p-3.5 rounded-2xl border transition-all ${
                              isDarkMode 
                                ? "bg-slate-950/50 border-slate-800/80 hover:border-indigo-500/30" 
                                : "bg-indigo-50/30 border-indigo-100 hover:border-indigo-300"
                            }`}>
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[10px] font-extrabold text-slate-400">توکن‌های مصرفی هوش مصنوعی</span>
                                <Coins className="w-3.5 h-3.5 text-indigo-500" />
                              </div>
                              <div className="flex items-baseline gap-1">
                                <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-base">
                                  {(u.apiUsage || 0).toLocaleString("fa-IR")}
                                </span>
                                <span className="text-[9px] text-slate-400 font-bold">توکن</span>
                              </div>
                              
                              <div className="mt-2.5 flex items-center justify-between border-t border-dashed dark:border-slate-800 border-slate-200 pt-2">
                                <div className="flex-1 ml-2">
                                  <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-indigo-500 rounded-full" 
                                      style={{ width: `${Math.min(100, ((u.apiUsage || 0) / 1000000) * 100)}%` }}
                                    />
                                  </div>
                                </div>
                                <button
                                  onClick={() => {
                                    if (confirm(`آیا از صفر کردن توکن‌های مصرفی کاربر «${u.name}» اطمینان دارید؟`)) {
                                      setUsers(prev => prev.map(usr => usr.id === u.id ? {...usr, apiUsage: 0} : usr));
                                      logEvent("ریست توکن کاربر", `آمار مصرف توکن کاربر ${u.name} صفر شد.`);
                                      showNotification(`توکن‌های کاربر ${u.name} بازنشانی گردید.`, 'success');
                                    }
                                  }}
                                  className="p-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-[9px] font-bold border border-rose-500/20 flex items-center gap-1 cursor-pointer"
                                  title="صفر کردن مصرف توکن"
                                >
                                  <RefreshCw className="w-2.5 h-2.5" />
                                  <span>ریست</span>
                                </button>
                              </div>
                            </div>

                            {/* Card 2: Estimated Cost */}
                            <div className={`p-3.5 rounded-2xl border transition-all ${
                              isDarkMode 
                                ? "bg-slate-950/50 border-slate-800/80 hover:border-emerald-500/30" 
                                : "bg-emerald-50/30 border-emerald-100 hover:border-emerald-300"
                            }`}>
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[10px] font-extrabold text-slate-400">هزینه پردازش تخمینی</span>
                                <Database className="w-3.5 h-3.5 text-emerald-500" />
                              </div>
                              <div className="flex items-baseline gap-1" dir="ltr">
                                <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-base">
                                  ${costUsd.toFixed(4)}
                                </span>
                                <span className="text-[9px] font-bold text-slate-400">USD</span>
                              </div>
                              <div className="mt-2.5 pt-2 border-t border-dashed dark:border-slate-800 border-slate-200 text-right">
                                <span className="text-[9px] text-slate-400 font-bold">۰.۱۵ دلار بر هر ۱M توکن</span>
                              </div>
                            </div>

                            {/* Card 3: Storage Limits */}
                            <div className={`p-3.5 rounded-2xl border transition-all ${
                              isDarkMode 
                                ? "bg-slate-950/50 border-slate-800/80 hover:border-amber-500/30" 
                                : "bg-amber-50/30 border-amber-100 hover:border-amber-300"
                            }`}>
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[10px] font-extrabold text-slate-400">فضای اختصاص یافته ابری</span>
                                <HardDrive className="w-3.5 h-3.5 text-amber-500" />
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-baseline gap-1">
                                  <span className="font-mono font-black text-amber-600 dark:text-amber-400 text-base">
                                    {(5 + (u.extraStorage || 0)).toLocaleString("fa-IR")}
                                  </span>
                                  <span className="text-[9px] text-slate-400 font-bold">گیگابایت</span>
                                </div>
                                <button
                                  onClick={() => {
                                    const currentExtra = u.extraStorage || 0;
                                    const input = prompt(`فضای اضافه تخصیص یافته به ${u.name} را وارد کنید (گیگابایت):`, currentExtra.toString());
                                    if (input !== null) {
                                      const parsed = parseFloat(input);
                                      if (!isNaN(parsed) && parsed >= 0) {
                                        setUsers(prev => prev.map(usr => usr.id === u.id ? { ...usr, extraStorage: parsed } : usr));
                                        updateUserInFirestore(u.id, { extraStorage: parsed });
                                        logEvent("تخصیص فضا", `فضا کاربر «${u.name}» به ${parsed} گیگابایت تغییر یافت.`);
                                        showNotification(`فضای کاربر «${u.name}» به ${parsed} گیگابایت بروزرسانی شد.`, "success");
                                      }
                                    }
                                  }}
                                  className="text-[9px] font-bold text-amber-500 hover:underline flex items-center gap-0.5 cursor-pointer"
                                >
                                  <Edit2 className="w-2.5 h-2.5" /> تغییر
                                </button>
                              </div>
                              <div className="mt-2.5 pt-2 border-t border-dashed dark:border-slate-800 border-slate-200 text-right">
                                <span className="text-[9px] text-slate-400 font-bold">۵GB پایه + {u.extraStorage || 0}GB ویژه</span>
                              </div>
                            </div>

                            {/* Card 4: Gemini Key Connection */}
                            <div className={`p-3.5 rounded-2xl border transition-all ${
                              isDarkMode 
                                ? "bg-slate-950/50 border-slate-800/80 hover:border-purple-500/30" 
                                : "bg-purple-50/30 border-purple-100 hover:border-purple-300"
                            }`}>
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[10px] font-extrabold text-slate-400">اتصال کلید Gemini API</span>
                                <KeyRound className="w-3.5 h-3.5 text-purple-500" />
                              </div>
                              <div className="flex items-center justify-between">
                                <span className={`text-[11px] font-black ${hasCustomKey ? "text-purple-600 dark:text-purple-400" : "text-slate-400"}`}>
                                  {hasCustomKey ? "کلید اختصاصی" : "اشتراکی سیستم"}
                                </span>
                                <button
                                  onClick={() => {
                                    const currentApiKey = u.geminiApiKey || "";
                                    const input = prompt(`کلید API جمینای اختصاصی (GEMINI_API_KEY) برای ${u.name} را وارد کنید:`, currentApiKey);
                                    if (input !== null) {
                                      setUsers(prev => prev.map(usr => usr.id === u.id ? { ...usr, geminiApiKey: input } : usr));
                                      updateUserInFirestore(u.id, { geminiApiKey: input });
                                      logEvent("تخصیص کلید API", `کلید API برای کاربر «${u.name}» تنظیم شد.`);
                                      showNotification(`کلید API کاربر «${u.name}» بروزرسانی گردید.`, "success");
                                    }
                                  }}
                                  className="text-[9px] font-bold text-purple-500 hover:underline flex items-center gap-0.5 cursor-pointer"
                                >
                                  <Edit2 className="w-2.5 h-2.5" /> تنظیم
                                </button>
                              </div>
                              <div className="mt-2.5 pt-2 border-t border-dashed dark:border-slate-800 border-slate-200 text-right truncate">
                                <span className="text-[9px] font-mono text-slate-400" dir="ltr">
                                  {hasCustomKey ? `${u.geminiApiKey.substring(0, 10)}...` : "SHARED_KEY_POOL"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Add User Modal */}
                {showAddUserModal && (
                  <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl ${
                      isDarkMode ? "bg-[#0f172a] border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"
                    }`} dir="rtl">
                      <div className="flex items-center justify-between mb-4 pb-3 border-b dark:border-slate-800 border-slate-100">
                        <h4 className="font-extrabold text-sm flex items-center gap-2 text-indigo-500">
                          <Plus className="w-4 h-4" />
                          تعریف کاربر جدید سیستم
                        </h4>
                        <button onClick={() => setShowAddUserModal(false)} className="text-slate-400 hover:text-slate-200">
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <form onSubmit={handleAddUser} className="space-y-3.5 text-xs">
                        <div>
                          <label className="block mb-1 font-bold text-slate-400">نام و نام خانوادگی:</label>
                          <input
                            type="text"
                            required
                            value={newUser.name}
                            onChange={(e) => setNewUser(p => ({ ...p, name: e.target.value }))}
                            placeholder="مثال: علی رضایی"
                            className={`w-full p-2.5 rounded-xl border outline-none ${
                              isDarkMode ? "bg-slate-800 border-slate-700 text-white focus:border-indigo-500" : "bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500"
                            }`}
                          />
                        </div>

                        <div>
                          <label className="block mb-1 font-bold text-slate-400">پست الکترونیک (ایمیل):</label>
                          <input
                            type="email"
                            value={newUser.email}
                            onChange={(e) => setNewUser(p => ({ ...p, email: e.target.value }))}
                            placeholder="user@company.ir"
                            className={`w-full p-2.5 rounded-xl border outline-none ${
                              isDarkMode ? "bg-slate-800 border-slate-700 text-white focus:border-indigo-500" : "bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500"
                            }`}
                          />
                        </div>

                        <div>
                          <label className="block mb-1 font-bold text-slate-400">سطح دسترسی (نقش):</label>
                          <select
                            value={newUser.role}
                            onChange={(e) => setNewUser(p => ({ ...p, role: e.target.value }))}
                            className={`w-full p-2.5 rounded-xl border outline-none ${
                              isDarkMode ? "bg-slate-800 border-slate-700 text-white focus:border-indigo-500" : "bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500"
                            }`}
                          >
                            <option value="user">کاربر عادی / حسابدار</option>
                            <option value="manager">مدیر مالی (Manager)</option>
                            <option value="auditor">حسابرس (Auditor)</option>
                            <option value="admin">مدیر سیستم (Admin)</option>
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block mb-1 font-bold text-slate-400">نام شرکت:</label>
                            <input
                              type="text"
                              value={newUser.companyName}
                              onChange={(e) => setNewUser(p => ({ ...p, companyName: e.target.value }))}
                              placeholder="شرکت نمونه"
                              className={`w-full p-2.5 rounded-xl border outline-none ${
                                isDarkMode ? "bg-slate-800 border-slate-700 text-white focus:border-indigo-500" : "bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500"
                              }`}
                            />
                          </div>
                          <div>
                            <label className="block mb-1 font-bold text-slate-400">تلفن همراه:</label>
                            <input
                              type="text"
                              value={newUser.phone}
                              onChange={(e) => setNewUser(p => ({ ...p, phone: e.target.value }))}
                              placeholder="09120000000"
                              className={`w-full p-2.5 rounded-xl border outline-none ${
                                isDarkMode ? "bg-slate-800 border-slate-700 text-white focus:border-indigo-500" : "bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500"
                              }`}
                            />
                          </div>
                        </div>

                        <div className="flex gap-2 pt-3">
                          <button
                            type="submit"
                            className="flex-1 py-2.5 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-sm"
                          >
                            ایجاد کاربر جدید
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowAddUserModal(false)}
                            className={`px-4 py-2.5 rounded-xl font-bold border ${
                              isDarkMode ? "border-slate-700 text-slate-300" : "border-slate-200 text-slate-600"
                            }`}
                          >
                            انصراف
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* Edit User Modal */}
                {showEditUserModal && editingUser && (
                  <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className={`w-full max-w-lg p-6 rounded-3xl border shadow-2xl overflow-y-auto max-h-[90vh] ${
                      isDarkMode ? "bg-[#0b1120] border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"
                    }`} dir="rtl">
                      <div className="flex items-center justify-between mb-4 pb-3 border-b dark:border-slate-800 border-slate-100">
                        <h4 className="font-extrabold text-sm flex items-center gap-2 text-indigo-500">
                          <Settings className="w-4 h-4" />
                          ویرایش شناسنامه کاربر ({editingUser.name})
                        </h4>
                        <button onClick={() => { setShowEditUserModal(false); setEditingUser(null); }} className="text-slate-400 hover:text-slate-200">
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <form onSubmit={handleEditUser} className="space-y-4 text-xs">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block mb-1 font-bold text-slate-400">نام و نام خانوادگی:</label>
                            <input
                              type="text"
                              required
                              value={editingUser.name || ""}
                              onChange={(e) => setEditingUser((p: any) => ({ ...p, name: e.target.value }))}
                              className={`w-full p-2.5 rounded-xl border outline-none ${
                                isDarkMode ? "bg-slate-800 border-slate-700 text-white focus:border-indigo-500" : "bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500"
                              }`}
                            />
                          </div>

                          <div>
                            <label className="block mb-1 font-bold text-slate-400">پست الکترونیک (ایمیل):</label>
                            <input
                              type="email"
                              value={editingUser.email || ""}
                              onChange={(e) => setEditingUser((p: any) => ({ ...p, email: e.target.value }))}
                              className={`w-full p-2.5 rounded-xl border outline-none ${
                                isDarkMode ? "bg-slate-800 border-slate-700 text-white focus:border-indigo-500" : "bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500"
                              }`}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block mb-1 font-bold text-slate-400">سطح دسترسی (نقش):</label>
                            <select
                              value={editingUser.role || "user"}
                              onChange={(e) => setEditingUser((p: any) => ({ ...p, role: e.target.value }))}
                              className={`w-full p-2.5 rounded-xl border outline-none ${
                                isDarkMode ? "bg-slate-800 border-slate-700 text-white focus:border-indigo-500" : "bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500"
                              }`}
                            >
                              <option value="user">کاربر عادی / حسابدار</option>
                              <option value="manager">مدیر مالی (Manager)</option>
                              <option value="auditor">حسابرس (Auditor)</option>
                              <option value="admin">مدیر سیستم (Admin)</option>
                            </select>
                          </div>

                          <div>
                            <label className="block mb-1 font-bold text-slate-400">وضعیت حساب کاربری:</label>
                            <select
                              value={editingUser.status || "active"}
                              onChange={(e) => setEditingUser((p: any) => ({ ...p, status: e.target.value }))}
                              className={`w-full p-2.5 rounded-xl border outline-none ${
                                isDarkMode ? "bg-slate-800 border-slate-700 text-white focus:border-indigo-500" : "bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500"
                              }`}
                            >
                              <option value="active">فعال (Active)</option>
                              <option value="suspended">مسدود شده (Suspended)</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block mb-1 font-bold text-slate-400">نام شرکت/سازمان:</label>
                            <input
                              type="text"
                              value={editingUser.companyName || ""}
                              onChange={(e) => setEditingUser((p: any) => ({ ...p, companyName: e.target.value }))}
                              className={`w-full p-2.5 rounded-xl border outline-none ${
                                isDarkMode ? "bg-slate-800 border-slate-700 text-white focus:border-indigo-500" : "bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500"
                              }`}
                            />
                          </div>

                          <div>
                            <label className="block mb-1 font-bold text-slate-400">تلفن همراه:</label>
                            <input
                              type="text"
                              value={editingUser.phone || ""}
                              onChange={(e) => setEditingUser((p: any) => ({ ...p, phone: e.target.value }))}
                              className={`w-full p-2.5 rounded-xl border outline-none ${
                                isDarkMode ? "bg-slate-800 border-slate-700 text-white focus:border-indigo-500" : "bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500"
                              }`}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block mb-1 font-bold text-slate-400">فضای ابری اضافه (گیگابایت):</label>
                            <input
                              type="number"
                              min="0"
                              step="0.5"
                              value={editingUser.extraStorage === undefined ? 0 : editingUser.extraStorage}
                              onChange={(e) => setEditingUser((p: any) => ({ ...p, extraStorage: parseFloat(e.target.value) || 0 }))}
                              className={`w-full p-2.5 rounded-xl border outline-none ${
                                isDarkMode ? "bg-slate-800 border-slate-700 text-white focus:border-indigo-500" : "bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500"
                              }`}
                            />
                          </div>

                          <div>
                            <label className="block mb-1 font-bold text-slate-400">توکن‌های مصرفی AI:</label>
                            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/30 border border-slate-800 mt-0.5">
                              <span className="font-mono font-bold text-indigo-400">
                                {(editingUser.apiUsage || 0).toLocaleString("fa-IR")}
                              </span>
                              <button
                                type="button"
                                onClick={() => setEditingUser((p: any) => ({ ...p, apiUsage: 0 }))}
                                className="px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-[9px] font-bold border border-rose-500/20"
                              >
                                صفر کردن
                              </button>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block mb-1 font-bold text-slate-400">کلید اختصاصی Gemini API Key:</label>
                          <input
                            type="text"
                            value={editingUser.geminiApiKey || ""}
                            onChange={(e) => setEditingUser((p: any) => ({ ...p, geminiApiKey: e.target.value }))}
                            placeholder="کلید GEMINI_API_KEY اختصاصی..."
                            className={`w-full p-2.5 rounded-xl border outline-none font-mono ${
                              isDarkMode ? "bg-slate-800 border-slate-700 text-white focus:border-indigo-500" : "bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500"
                            }`}
                          />
                        </div>

                        <div className="flex gap-2 pt-3 border-t dark:border-slate-800 border-slate-100">
                          <button
                            type="submit"
                            className="flex-1 py-2.5 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition flex items-center justify-center gap-1.5"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            ذخیره تغییرات شناسنامه
                          </button>
                          <button
                            type="button"
                            onClick={() => { setShowEditUserModal(false); setEditingUser(null); }}
                            className={`px-4 py-2.5 rounded-xl font-bold border ${
                              isDarkMode ? "border-slate-700 text-slate-300" : "border-slate-200 text-slate-600"
                            }`}
                          >
                            انصراف
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* 2. SECURITY & MASTER PIN TAB */}
            {adminPanelTab === "security" && (
              <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl mx-auto pb-8">
                
                {/* Security Executive Header */}
                <div className={`p-6 rounded-3xl border relative overflow-hidden bg-gradient-to-br ${
                  isDarkMode 
                    ? "from-slate-900 via-indigo-950/30 to-slate-900 border-slate-800" 
                    : "from-white via-indigo-50/50 to-white border-slate-200 shadow-sm"
                }`}>
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 text-xs font-bold mb-2">
                        <ShieldCheck className="w-4 h-4" />
                        سامانه امنیت و رمزنگاری
                      </div>
                      <h4 className="text-lg font-black text-slate-900 dark:text-white">
                        مدیریت کد اختصاصی و سطح امنیت
                      </h4>
                      <p className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                        تغییر کد اختصاصی مدیر ارشد (Admin Master PIN) و نظارت بر سیاست‌های حفاظتی
                      </p>
                    </div>

                    {/* Security Score Badge */}
                    <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800 text-center shrink-0 w-full md:w-auto min-w-[160px]">
                      <span className="text-[10px] font-bold text-slate-400 block mb-1">امتیاز امنیت سیستم</span>
                      <div className="text-2xl font-black font-mono text-emerald-400 flex items-center justify-center gap-1">
                        <span>۹۸٪</span>
                        <Sparkles className="w-4 h-4 text-amber-400" />
                      </div>
                      <span className="text-[9px] text-emerald-500 font-bold block mt-1">وضعیت: بسیار عالی</span>
                    </div>
                  </div>
                </div>

                {/* Change PIN Form Card */}
                <div className={`p-6 rounded-3xl border ${
                  isDarkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200 shadow-sm"
                }`}>
                  <h5 className="font-extrabold text-sm mb-4 flex items-center gap-2 text-indigo-500">
                    <KeyRound className="w-4 h-4" />
                    تغییر کد اختصاصی مدیر ارشد (Admin Master PIN)
                  </h5>

                  <form onSubmit={handleUpdatePin} className="space-y-4 max-w-lg">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1.5">کد اختصاصی فعلی ادمین:</label>
                      <div className="relative">
                        <input
                          type={showCurrentPin ? "text" : "password"}
                          required
                          value={pinForm.current}
                          onChange={(e) => setPinForm(p => ({ ...p, current: e.target.value }))}
                          placeholder="کد اختصاصی فعلی"
                          className={`w-full p-3 px-4 font-mono font-bold text-sm rounded-2xl border outline-none transition-all ${
                            isDarkMode ? "bg-slate-800/80 border-slate-700 text-white focus:border-indigo-500" : "bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500"
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPin(!showCurrentPin)}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
                        >
                          {showCurrentPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1.5">کد اختصاصی جدید:</label>
                        <input
                          type="password"
                          required
                          value={pinForm.newPin}
                          onChange={(e) => setPinForm(p => ({ ...p, newPin: e.target.value }))}
                          placeholder="حداقل ۴ رقم"
                          className={`w-full p-3 px-4 font-mono font-bold text-sm rounded-2xl border outline-none transition-all ${
                            isDarkMode ? "bg-slate-800/80 border-slate-700 text-white focus:border-indigo-500" : "bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500"
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1.5">تکرار کد جدید:</label>
                        <input
                          type="password"
                          required
                          value={pinForm.confirm}
                          onChange={(e) => setPinForm(p => ({ ...p, confirm: e.target.value }))}
                          placeholder="تکرار کد جدید"
                          className={`w-full p-3 px-4 font-mono font-bold text-sm rounded-2xl border outline-none transition-all ${
                            isDarkMode ? "bg-slate-800/80 border-slate-700 text-white focus:border-indigo-500" : "bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500"
                          }`}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="px-6 py-3 rounded-2xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-md shadow-indigo-600/20 flex items-center gap-2 cursor-pointer"
                    >
                      <Lock className="w-4 h-4" />
                      ذخیره کد اختصاصی جدید
                    </button>
                  </form>
                </div>

                {/* Security Policies Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className={`p-5 rounded-3xl border ${isDarkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
                    <div className="flex items-center gap-2 mb-2 text-emerald-500 font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4" />
                      احراز هویت دو مرحله‌ای (2FA)
                    </div>
                    <p className={`text-xs leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                      الزام کد اختصاصی ادمین + پیامک جهت ورود به قابلیت‌های حساس مدیریت.
                    </p>
                  </div>

                  <div className={`p-5 rounded-3xl border ${isDarkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
                    <div className="flex items-center gap-2 mb-2 text-indigo-500 font-bold text-xs">
                      <Clock className="w-4 h-4" />
                      انقضای نشست کاری (Timeout)
                    </div>
                    <p className={`text-xs leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                      خروج خودکار ادمین پس از ۳۰ دقیقه عدم فعالیت جهت حفظ امنیت داده‌ها.
                    </p>
                  </div>

                  <div className={`p-5 rounded-3xl border ${isDarkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
                    <div className="flex items-center gap-2 mb-2 text-purple-500 font-bold text-xs">
                      <Shield className="w-4 h-4" />
                      رمزنگاری داده‌ها (AES-256)
                    </div>
                    <p className={`text-xs leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                      تمامی ارتباطات و کلیدهای API با استانداردهای نظامی در دیتابیس رمزگذاری می‌شوند.
                    </p>
                  </div>
                </div>

                {/* Audit Trail Logs */}
                <div className={`p-6 rounded-3xl border ${isDarkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                    <h5 className="font-extrabold text-xs flex items-center gap-2 text-slate-900 dark:text-white">
                      <List className="w-4 h-4 text-indigo-500" />
                      لاگ رویدادهای امنیتی و نظارتی سیستم
                    </h5>

                    {/* Filter Pills */}
                    <div className="flex items-center gap-1.5">
                      {(["all", "auth", "warning", "info"] as const).map(tab => (
                        <button
                          key={tab}
                          onClick={() => setAuditFilterTab(tab)}
                          className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                            auditFilterTab === tab 
                              ? "bg-indigo-600 text-white" 
                              : (isDarkMode ? "bg-slate-800 text-slate-400 hover:text-slate-200" : "bg-slate-100 text-slate-600 hover:bg-slate-200")
                          }`}
                        >
                          {tab === "all" && "همه"}
                          {tab === "auth" && "احراز هویت"}
                          {tab === "warning" && "هشدارها"}
                          {tab === "info" && "اطلاعیه‌ها"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="max-h-64 overflow-y-auto space-y-2 custom-scrollbar pr-1">
                    {auditLogs
                      .filter(l => auditFilterTab === "all" || l.type === auditFilterTab)
                      .slice(0, 15)
                      .map((log) => (
                        <div key={log.id} className={`p-3 rounded-2xl border text-xs flex items-center justify-between gap-3 ${
                          isDarkMode ? "bg-slate-950/40 border-slate-800/80" : "bg-slate-50 border-slate-200/80"
                        }`}>
                          <div className="flex items-center gap-2.5">
                            <div className={`w-2 h-2 rounded-full shrink-0 ${
                              log.type === "auth" ? "bg-amber-500" : log.type === "warning" ? "bg-rose-500" : "bg-indigo-500"
                            }`} />
                            <span className="font-black text-slate-800 dark:text-slate-200 shrink-0">{log.action}:</span>
                            <span className={isDarkMode ? "text-slate-400" : "text-slate-600"}>{log.details}</span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 shrink-0">
                            {new Date(log.timestamp).toLocaleTimeString("fa-IR")}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>

              </div>
            )}

            {/* 3. SYSTEM & HEALTH TAB */}
            {adminPanelTab === "system" && (
              <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl mx-auto pb-8">
                <div>
                  <h4 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-purple-500" />
                    پایش زنده و سلامت منابع سیستم
                  </h4>
                  <p className={`text-xs mt-0.5 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                    تحلیل لحظه‌ای پردازنده، حافظه، تاخیر پایگاه‌داده و کنسول زنده لاگ‌ها
                  </p>
                </div>

                {/* Live Gauges Bento Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                  <div className={`p-4 rounded-3xl border text-center ${isDarkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
                    <span className="text-xs font-bold text-slate-400 block mb-1">بار پردازنده (CPU)</span>
                    <strong className="text-2xl font-black font-mono text-indigo-500">۱۸٪</strong>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
                      <div className="bg-indigo-500 h-full w-[18%]" />
                    </div>
                  </div>

                  <div className={`p-4 rounded-3xl border text-center ${isDarkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
                    <span className="text-xs font-bold text-slate-400 block mb-1">مصرف رم (RAM)</span>
                    <strong className="text-2xl font-black font-mono text-emerald-500">۴۲٪</strong>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
                      <div className="bg-emerald-500 h-full w-[42%]" />
                    </div>
                  </div>

                  <div className={`p-4 rounded-3xl border text-center ${isDarkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
                    <span className="text-xs font-bold text-slate-400 block mb-1">تاخیر دیتابیس (DB)</span>
                    <strong className="text-2xl font-black font-mono text-amber-500">۸ms</strong>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
                      <div className="bg-amber-500 h-full w-[15%]" />
                    </div>
                  </div>

                  <div className={`p-4 rounded-3xl border text-center ${isDarkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
                    <span className="text-xs font-bold text-slate-400 block mb-1">وضعیت سرویس ابری</span>
                    <strong className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-1.5 mt-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      برقرار و آنلاین
                    </strong>
                  </div>
                </div>

                {/* System Counters Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                  <div className={`p-4 rounded-3xl border ${isDarkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
                    <FileText className="w-5 h-5 text-indigo-500 mb-2" />
                    <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">{previousScans.length}</div>
                    <div className="text-xs text-slate-400 font-bold">اسناد پردازش شده</div>
                  </div>

                  <div className={`p-4 rounded-3xl border ${isDarkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
                    <List className="w-5 h-5 text-emerald-500 mb-2" />
                    <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">{transactions.length}</div>
                    <div className="text-xs text-slate-400 font-bold">تراکنش‌های ثبت شده</div>
                  </div>

                  <div className={`p-4 rounded-3xl border ${isDarkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
                    <Database className="w-5 h-5 text-purple-500 mb-2" />
                    <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                      {(JSON.stringify(transactions).length / 1024).toFixed(1)} KB
                    </div>
                    <div className="text-xs text-slate-400 font-bold">حجم حافظه محلی</div>
                  </div>

                  <div className={`p-4 rounded-3xl border ${isDarkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
                    <Coins className="w-5 h-5 text-amber-500 mb-2" />
                    <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                      {totalTokensUsed.toLocaleString("fa-IR")}
                    </div>
                    <div className="text-xs text-slate-400 font-bold">کل توکن‌های مصرفی</div>
                  </div>
                </div>

                {/* Interactive Live Terminal Stream */}
                <div className="p-5 rounded-3xl bg-[#080d1a] border border-slate-800 text-slate-200 font-mono text-xs shadow-xl">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3 border-b border-slate-800 pb-3">
                    <span className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
                      <Terminal className="w-4 h-4" />
                      کنسول لاگ زنده سیستم (Live System Console)
                    </span>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <input
                        type="text"
                        value={terminalFilter}
                        onChange={(e) => setTerminalFilter(e.target.value)}
                        placeholder="فیلتر لاگ‌ها..."
                        className="bg-slate-900 border border-slate-800 text-[11px] px-3 py-1 rounded-xl text-slate-300 outline-none flex-1 sm:w-40"
                      />

                      <button
                        onClick={handleCopyLogs}
                        className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer shrink-0"
                      >
                        <Copy className="w-3 h-3" />
                        {copiedLogs ? "کپی شد" : "کپی"}
                      </button>
                    </div>
                  </div>

                  <div className="h-48 overflow-y-auto space-y-1.5 custom-scrollbar text-[11px] leading-relaxed dir-ltr">
                    <div className="text-emerald-400">[SYSTEM OK] OCR Accounting System engine running.</div>
                    <div className="text-indigo-400">[SECURITY] Admin Master PIN authenticated. Active session verified.</div>
                    <div className="text-slate-400">[FIRESTORE] Remote cloud synchronization active.</div>
                    <div className="text-amber-400">[MEMORY] Cache memory clean and optimized.</div>
                    {auditLogs
                      .filter(l => !terminalFilter || l.action.includes(terminalFilter) || l.details.includes(terminalFilter))
                      .map(l => (
                        <div key={l.id} className="text-slate-300">
                          <span className="text-slate-500">[{new Date(l.timestamp).toLocaleTimeString()}]</span>{" "}
                          <span className="text-indigo-400 font-bold">[{l.action}]:</span> {l.details}
                        </div>
                      ))}
                  </div>
                </div>

                {/* AI Token Manager Card Link */}
                <div className={`p-5 rounded-3xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  isDarkMode ? "bg-indigo-950/30 border-indigo-900/50" : "bg-indigo-50 border-indigo-200"
                }`}>
                  <div>
                    <h5 className="font-extrabold text-sm text-indigo-600 dark:text-indigo-400 mb-1">
                      پنل تخصصی مدیریت توکن هوش مصنوعی (Token Manager)
                    </h5>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      مشاهده نمودارهای تفکیکی مصرف، سهمیه‌بندی مدل‌های Gemini و تحلیل هزینه‌ها
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      setIsTokenManagerOpen(true);
                    }}
                    className="px-5 py-2.5 rounded-2xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-md shadow-indigo-600/20 shrink-0 cursor-pointer"
                  >
                    باز کردن Token Manager
                  </button>
                </div>

              </div>
            )}

            {/* 4. DATA & BACKUP TAB */}
            {adminPanelTab === "data" && (
              <div className="space-y-6 animate-in fade-in duration-300 max-w-3xl mx-auto pb-8">
                <div>
                  <h4 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <Download className="w-5 h-5 text-emerald-500" />
                    پشتیبان‌گیری و انتقال داده‌های سیستم
                  </h4>
                  <p className={`text-xs mt-0.5 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                    دریافت بکاپ کامل JSON، خروجی گزارش اکسل و ورود اطلاعات ساختاریافته
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Complete JSON Backup */}
                  <div className={`p-6 rounded-3xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                    isDarkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200 shadow-sm"
                  }`}>
                    <div className="flex-1">
                      <h5 className="font-extrabold text-sm mb-1 flex items-center gap-2 text-indigo-500">
                        <Download className="w-4 h-4" />
                        پشتیبان کامل سیستم (JSON Backup)
                      </h5>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        شامل تمام تراکنش‌های مالی، تاریخچه اسکن‌ها، اطلاعات کاربران و تنظیمات سهمیه‌ها.
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 shrink-0 w-full sm:w-auto">
                      <button
                        onClick={() => {
                          const data = { transactions, previousScans, modelQuotas, users };
                          const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `CPA-Admin-Backup-${new Date().toISOString().split('T')[0]}.json`;
                          a.click();
                          URL.revokeObjectURL(url);
                          showNotification("فایل پشتیبان جامع با موفقیت دانلود شد.", "success");
                        }}
                        className="px-4 py-2.5 rounded-2xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition flex justify-center items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Download className="w-4 h-4" />
                        دانلود بکاپ
                      </button>

                      <button
                        onClick={() => {
                          const input = document.createElement("input");
                          input.type = "file";
                          input.accept = "application/json";
                          input.onchange = (e: any) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              try {
                                const data = JSON.parse(event.target?.result as string);
                                if (data.transactions) setTransactions(data.transactions);
                                if (data.previousScans) setPreviousScans(data.previousScans);
                                if (data.modelQuotas) setModelQuotas(data.modelQuotas);
                                if (data.users) setUsers(data.users);
                                showNotification("داده‌ها با موفقیت بازیابی شدند.", "success");
                              } catch (err) {
                                showNotification("فرمت فایل پشتیبان نامعتبر است.", "error");
                              }
                            };
                            reader.readAsText(file);
                          };
                          input.click();
                        }}
                        className={`px-4 py-2.5 rounded-2xl text-xs font-bold border transition flex justify-center items-center gap-1.5 cursor-pointer ${
                          isDarkMode ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <Upload className="w-4 h-4" />
                        بازیابی (Import)
                      </button>
                    </div>
                  </div>

                  {/* Excel Export */}
                  <div className={`p-6 rounded-3xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                    isDarkMode ? "bg-emerald-950/20 border-emerald-900/50" : "bg-emerald-50/60 border-emerald-200 shadow-sm"
                  }`}>
                    <div className="flex-1">
                      <h5 className="font-extrabold text-sm mb-1 flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                        <FileSpreadsheet className="w-4 h-4" />
                        خروجی فایل اکسل (XLSX)
                      </h5>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        تولید فایل اکسل تمام تراکنش‌ها و ردیف‌های دفتر کل جهت ارائه به حسابرس.
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        const worksheetData = transactions.map((t) => {
                          const row: any = {};
                          Object.keys(t).forEach(k => {
                            if (k !== "id") row[k] = t[k];
                          });
                          return row;
                        });
                        const worksheet = XLSX.utils.json_to_sheet(worksheetData);
                        const workbook = XLSX.utils.book_new();
                        XLSX.utils.book_append_sheet(workbook, worksheet, "تراکنش‌ها");
                        XLSX.writeFile(workbook, `Transactions-Export-${Date.now()}.xlsx`);
                        showNotification("فایل اکسل با موفقیت تولید و دانلود شد.", "success");
                      }}
                      className="px-5 py-2.5 rounded-2xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition flex justify-center items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      تولید اکسل
                    </button>
                  </div>

                  {/* Mock Data Generator */}
                  <div className={`p-6 rounded-3xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                    isDarkMode ? "bg-indigo-950/20 border-indigo-900/50" : "bg-indigo-50/60 border-indigo-200 shadow-sm"
                  }`}>
                    <div className="flex-1">
                      <h5 className="font-extrabold text-sm mb-1 flex items-center gap-2 text-indigo-500">
                        <Database className="w-4 h-4" />
                        افزودن تراکنش‌های نمونه (Mock Seed)
                      </h5>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        درج تراکنش‌های نمونه جهت آزمایش و ارزیابی نمودارهای حسابداری.
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        const newMock = [
                          {   
                              id: "mock-" + Date.now() + 1,
                              تاریخ: "۱۴۰۳/۰۲/۱۵",
                              شماره_سند: "۱۰۵۵۰",
                              نام_طرف_حساب: "شرکت تجهیزات شبکه مبین",
                              شرح: "خرید سرورهای اچ‌پی جهت ارتقا زیرساخت مرکز داده",
                              مبلغ_بدهکار: 580000000,
                              مبلغ_بستانکار: 0,
                              نوع_ارز: "ریال",
                              توضیحات: "تسویه قطعی طی چک صیادی دو ماهه",
                              ضریب_اطمینان: 92
                          },
                          {   
                              id: "mock-" + Date.now() + 2,
                              تاریخ: "۱۴۰۳/۰۲/۱۸",
                              شماره_سند: "۱۰۵۵۱",
                              نام_طرف_حساب: "حساب‌های دریافتنی / مشتریان خرد",
                              شرح: "وصول مطالبات از صورتحساب فروش قطعات ماه قبل",
                              مبلغ_بدهکار: 0,
                              مبلغ_بستانکار: 125000000,
                              نوع_ارز: "ریال",
                              توضیحات: "واریز نقدی به حساب جاری بانک سامان",
                              ضریب_اطمینان: 98
                          }
                        ];
                        setTransactions(prev => [...prev, ...newMock]);
                        showNotification("تراکنش‌های نمونه با موفقیت افزوده شدند.", "success");
                      }}
                      className={`px-5 py-2.5 rounded-2xl text-xs font-bold border transition flex justify-center items-center gap-1.5 cursor-pointer shrink-0 ${
                        isDarkMode ? "border-indigo-500/40 text-indigo-300 hover:bg-indigo-900/30" : "border-indigo-300 text-indigo-800 hover:bg-indigo-100"
                      }`}
                    >
                      <Plus className="w-4 h-4" />
                      تزریق نمونه
                    </button>
                  </div>
                </div>

              </div>
            )}

            {/* 5. DANGER ZONE TAB */}
            {adminPanelTab === "danger" && (
              <div className="space-y-6 animate-in fade-in duration-300 max-w-3xl mx-auto pb-8">
                <div>
                  <h4 className="text-base font-extrabold text-rose-500 flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5" />
                    منطقه خطر (Danger Zone)
                  </h4>
                  <p className={`text-xs mt-0.5 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                    عملیات غیرقابل بازگشت پاکسازی داده‌ها و بازنشانی کارخانه‌ای سیستم
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Clear Transactions */}
                  <div className={`p-6 rounded-3xl border border-rose-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                    isDarkMode ? "bg-rose-950/20" : "bg-rose-50/60 shadow-sm"
                  }`}>
                    <div className="flex-1">
                      <h5 className="font-extrabold text-sm text-rose-600 dark:text-rose-400 mb-1">
                        پاکسازی دفتر کل و تراکنش‌ها
                      </h5>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        حذف کامل تمامی ردیف‌های دفتر کل و تراکنش‌های استخراج شده از اسناد.
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        if (confirm("آیا از حذف کامل تمام تراکنش‌های مالی اطمینان دارید؟")) {
                          setTransactions([]);
                          if (setRawJsonText) setRawJsonText("");
                          if (setActiveFile) setActiveFile(null);
                          showNotification("مخزن تراکنش‌ها پاکسازی گردید.", "success");
                          logEvent("پاکسازی تراکنش‌ها", "تمام تراکنش‌های سیستم توسط مدیر پاکسازی شد.", "warning");
                        }
                      }}
                      className="px-5 py-2.5 rounded-2xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition flex justify-center items-center gap-1.5 shrink-0 cursor-pointer shadow-md shadow-rose-600/20"
                    >
                      <Trash2 className="w-4 h-4" />
                      حذف تراکنش‌ها
                    </button>
                  </div>

                  {/* Clear Scans */}
                  <div className={`p-6 rounded-3xl border border-rose-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                    isDarkMode ? "bg-rose-950/20" : "bg-rose-50/60 shadow-sm"
                  }`}>
                    <div className="flex-1">
                      <h5 className="font-extrabold text-sm text-rose-600 dark:text-rose-400 mb-1">
                        پاکسازی تاریخچه اسناد اسکن شده
                      </h5>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        حذف متادیتای تمام فاکتورها و اسناد آپلود شده در سیستم.
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        if (confirm("آیا از حذف تاریخچه اسناد مطمئن هستید؟")) {
                          setPreviousScans([]);
                          showNotification("تاریخچه اسناد پاکسازی شد.", "success");
                          logEvent("حذف تاریخچه اسناد", "مدیر سیستم تاریخچه اسناد را پاکسازی نمود.", "warning");
                        }
                      }}
                      className="px-5 py-2.5 rounded-2xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition flex justify-center items-center gap-1.5 shrink-0 cursor-pointer shadow-md shadow-rose-600/20"
                    >
                      <Trash2 className="w-4 h-4" />
                      حذف اسناد
                    </button>
                  </div>

                  {/* Factory Reset */}
                  <div className={`p-6 rounded-3xl border border-red-500/50 ${
                    isDarkMode ? "bg-red-950/30" : "bg-red-50"
                  }`}>
                    <h5 className="font-extrabold text-sm text-red-600 dark:text-red-400 mb-1 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      بازنشانی کامل سیستم (Factory Reset)
                    </h5>
                    <p className="text-xs text-slate-400 leading-relaxed mb-4">
                      پاکسازی کامل داده‌های ذخیره شده در مرورگر و بازگردانی برنامه به حالت اولیه کارخانه.
                    </p>

                    <button
                      onClick={() => {
                        const confirmPin = prompt("جهت بازنشانی کامل سیستم، کد اختصاصی ادمین را وارد کنید:");
                        if (confirmPin === adminMasterPin) {
                          localStorage.clear();
                          window.location.reload();
                        } else if (confirmPin !== null) {
                          showNotification("کد اختصاصی ادمین اشتباه است! بازنشانی لغو شد.", "error");
                        }
                      }}
                      className="w-full py-3.5 rounded-2xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition flex justify-center items-center gap-2 cursor-pointer shadow-lg shadow-red-600/20"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      تأیید و بازنشانی رادیواکتیو سیستم
                    </button>
                  </div>
                </div>

              </div>
            )}

          </div>
        </div>
      </div>

      {/* Edit User Identity Modal */}
      {showEditUserModal && editingUser && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 sm:p-6" dir="rtl">
          <div 
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md animate-fade-in"
            onClick={() => {
              setShowEditUserModal(false);
              setEditingUser(null);
            }}
          />

          <div className={`relative w-full max-w-3xl max-h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden transform transition-all animate-slide-up border ${
            isDarkMode 
              ? "bg-slate-900/95 border-slate-750 text-slate-100 shadow-indigo-950/50" 
              : "bg-white border-slate-200 text-slate-800 shadow-slate-300/60"
          }`}>
            {/* Modal Header */}
            <div className={`p-5 border-b flex items-center justify-between shrink-0 ${
              isDarkMode ? "bg-slate-800/80 border-slate-700/80" : "bg-gradient-to-r from-indigo-50/80 to-slate-50/80 border-slate-150"
            }`}>
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white font-extrabold text-lg shadow-md shadow-indigo-500/20">
                  {editingUser.name ? editingUser.name.charAt(0) : "U"}
                </div>
                <div>
                  <h3 className="font-extrabold text-base flex items-center gap-2">
                    <span>ویرایش کامل شناسنامه و پروفایل کاربر</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                      ID: {editingUser.id}
                    </span>
                  </h3>
                  <p className={`text-[11px] mt-0.5 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                    تغییر مشخصات فردی، سازمانی، نقش سیستمی و همگام‌سازی لحظه‌ای با دیتابیس
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowEditUserModal(false);
                  setEditingUser(null);
                }}
                className={`p-2 rounded-xl transition-colors ${
                  isDarkMode ? "hover:bg-slate-800 text-slate-400 hover:text-white" : "hover:bg-slate-200 text-slate-600 hover:text-slate-900"
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              
              {/* Section 1: Basic Registration Information & Security Lock */}
              <div className="space-y-4">
                {/* Registration Lock Banner & Explicit Override Trigger */}
                <div className={`p-4 rounded-2xl border transition-all ${
                  isDarkMode 
                    ? "bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-slate-800" 
                    : "bg-gradient-to-r from-slate-50 via-indigo-50/40 to-slate-50 border-slate-200"
                }`}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${
                        isRegistrationUnlocked 
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" 
                          : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      }`}>
                        {isRegistrationUnlocked ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-extrabold">اطلاعات پایه اعلام‌شده هنگام ثبت‌نام</h4>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                            isRegistrationUnlocked 
                              ? "bg-amber-500/15 text-amber-400 border-amber-500/30" 
                              : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                          }`}>
                            {isRegistrationUnlocked ? "قفل باز است (ویرایش آگاهانه)" : "محافظت شده (قفل ایمن ثبت‌نام)"}
                          </span>
                        </div>
                        <p className={`text-[10px] mt-1 leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                          اطلاعات فوق در زمان ثبت‌نام اولیه توسط خود کاربر اعلام گردیده است. جهت جلوگیری از دستکاری ناخواسته، تغییر مستقیم توسط ادمین مسدود می‌باشد مگر با درخواست کاربر یا اقدام آگاهانه مدیر.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (!isRegistrationUnlocked) {
                          setIsRegistrationUnlocked(true);
                          showNotification("قفل اطلاعات اولیه ثبت‌نام باز شد. تغییرات را با دقت ثبت کنید.", "info");
                        } else {
                          setIsRegistrationUnlocked(false);
                          showNotification("اطلاعات اولیه ثبت‌نام مجدداً قفل گردید.", "info");
                        }
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border ${
                        isRegistrationUnlocked
                          ? "bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30"
                          : "bg-indigo-600/20 border-indigo-500/40 text-indigo-300 hover:bg-indigo-600/30"
                      }`}
                    >
                      {isRegistrationUnlocked ? (
                        <>
                          <Lock className="w-4 h-4" />
                          <span>قفل کردن مجدد اطلاعات</span>
                        </>
                      ) : (
                        <>
                          <Unlock className="w-4 h-4" />
                          <span>باز کردن قفل ویرایش (تغییر آگاهانه ادمین)</span>
                        </>
                      )}
                    </button>
                  </div>

                  {isRegistrationUnlocked && (
                    <div className="mt-3 pt-3 border-t border-amber-500/20 text-amber-400 text-[11px] flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>
                        <strong>توجه امنیتی:</strong> ویرایش اطلاعات اولیه ثبت‌نام (ایمیل اصلی، کد ملی، نام اولیه) مستقیماً هویت کاربر را تغییر می‌دهد. این اقدام در لاگ‌های امنیتی ممیزی ثبت خواهد شد.
                      </span>
                    </div>
                  )}

                  {/* User change request badge if any */}
                  {editingUser.profileEditRequest && (
                    <div className="mt-3 p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-[11px] flex items-center justify-between gap-3">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-indigo-400" />
                        درخواست ثبت‌شده کاربر: {editingUser.profileEditRequest}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsRegistrationUnlocked(true);
                          showNotification("درخواست تغییر اطلاعات کاربر پذیرفته شد و قفل ویرایش باز شد.", "success");
                        }}
                        className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] shrink-0 transition-all cursor-pointer"
                      >
                        تایید و باز کردن قفل
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className={`text-[11px] font-bold block ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                        نام و نام خانوادگی ثبت‌نامی <span className="text-rose-500">*</span>
                      </label>
                      {!isRegistrationUnlocked && (
                        <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                          <Lock className="w-3 h-3 text-slate-500" /> غیرقابل تغییر
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      disabled={!isRegistrationUnlocked}
                      value={editingUser.name || ""}
                      onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                      placeholder="مثال: علی محمدی"
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs border outline-none transition-all ${
                        !isRegistrationUnlocked
                          ? (isDarkMode ? "bg-slate-950/60 border-slate-800 text-slate-400 opacity-75 cursor-not-allowed" : "bg-slate-100 border-slate-200 text-slate-500 opacity-80 cursor-not-allowed")
                          : (isDarkMode ? "bg-slate-950 border-amber-500/60 text-white focus:border-amber-500 ring-1 ring-amber-500/20" : "bg-amber-50/50 border-amber-400 text-slate-900 focus:border-amber-600 ring-1 ring-amber-400/20")
                      }`}
                    />
                  </div>

                  {/* National ID Code */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className={`text-[11px] font-bold block ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                        کد ملی / شناسه هویت ثبت‌نامی
                      </label>
                      {!isRegistrationUnlocked && (
                        <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                          <Lock className="w-3 h-3 text-slate-500" /> غیرقابل تغییر
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      disabled={!isRegistrationUnlocked}
                      value={editingUser.nationalCode || editingUser.nationalId || ""}
                      onChange={(e) => setEditingUser({ ...editingUser, nationalCode: e.target.value, nationalId: e.target.value })}
                      placeholder="مثال: ۰۰۱۲۳۴۵۶۷۸"
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs border outline-none transition-all font-mono ${
                        !isRegistrationUnlocked
                          ? (isDarkMode ? "bg-slate-950/60 border-slate-800 text-slate-400 opacity-75 cursor-not-allowed" : "bg-slate-100 border-slate-200 text-slate-500 opacity-80 cursor-not-allowed")
                          : (isDarkMode ? "bg-slate-950 border-amber-500/60 text-white focus:border-amber-500 ring-1 ring-amber-500/20" : "bg-amber-50/50 border-amber-400 text-slate-900 focus:border-amber-600 ring-1 ring-amber-400/20")
                      }`}
                      dir="ltr"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className={`text-[11px] font-bold block ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                        پست الکترونیکی / ایمیل اصلی ثبت‌نام <span className="text-rose-500">*</span>
                      </label>
                      {!isRegistrationUnlocked && (
                        <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                          <Lock className="w-3 h-3 text-slate-500" /> غیرقابل تغییر
                        </span>
                      )}
                    </div>
                    <input
                      type="email"
                      disabled={!isRegistrationUnlocked}
                      value={editingUser.email || ""}
                      onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                      placeholder="email@example.com"
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs border outline-none transition-all font-mono ${
                        !isRegistrationUnlocked
                          ? (isDarkMode ? "bg-slate-950/60 border-slate-800 text-slate-400 opacity-75 cursor-not-allowed" : "bg-slate-100 border-slate-200 text-slate-500 opacity-80 cursor-not-allowed")
                          : (isDarkMode ? "bg-slate-950 border-amber-500/60 text-white focus:border-amber-500 ring-1 ring-amber-500/20" : "bg-amber-50/50 border-amber-400 text-slate-900 focus:border-amber-600 ring-1 ring-amber-400/20")
                      }`}
                      dir="ltr"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className={`text-[11px] font-bold block ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                        شماره همراه اولیه ثبت‌نام
                      </label>
                      {!isRegistrationUnlocked && (
                        <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                          <Lock className="w-3 h-3 text-slate-500" /> غیرقابل تغییر
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      disabled={!isRegistrationUnlocked}
                      value={editingUser.phone || ""}
                      onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                      placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs border outline-none transition-all font-mono ${
                        !isRegistrationUnlocked
                          ? (isDarkMode ? "bg-slate-950/60 border-slate-800 text-slate-400 opacity-75 cursor-not-allowed" : "bg-slate-100 border-slate-200 text-slate-500 opacity-80 cursor-not-allowed")
                          : (isDarkMode ? "bg-slate-950 border-amber-500/60 text-white focus:border-amber-500 ring-1 ring-amber-500/20" : "bg-amber-50/50 border-amber-400 text-slate-900 focus:border-amber-600 ring-1 ring-amber-400/20")
                      }`}
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Company & Job Details */}
              <div className="space-y-4 pt-3 border-t border-slate-200 dark:border-slate-800">
                <h4 className={`text-xs font-black uppercase tracking-wider flex items-center gap-2 ${
                  isDarkMode ? "text-indigo-400" : "text-indigo-600"
                }`}>
                  <Building className="w-4 h-4" />
                  <span>اطلاعات سازمانی و پرسنلی</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Company Name */}
                  <div className="space-y-1.5">
                    <label className={`text-[11px] font-bold block ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                      نام شرکت / سازمان
                    </label>
                    <input
                      type="text"
                      value={editingUser.company || editingUser.companyName || ""}
                      onChange={(e) => setEditingUser({ ...editingUser, company: e.target.value, companyName: e.target.value })}
                      placeholder="مثال: شرکت بازرگانی سپهر"
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs border outline-none transition-all ${
                        isDarkMode 
                          ? "bg-slate-950 border-slate-800 text-white focus:border-indigo-500" 
                          : "bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500"
                      }`}
                    />
                  </div>

                  {/* Job Title */}
                  <div className="space-y-1.5">
                    <label className={`text-[11px] font-bold block ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                      سمت شغلی
                    </label>
                    <input
                      type="text"
                      value={editingUser.jobTitle || ""}
                      onChange={(e) => setEditingUser({ ...editingUser, jobTitle: e.target.value })}
                      placeholder="مثال: مدیر مالی / حسابدار ارشد"
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs border outline-none transition-all ${
                        isDarkMode 
                          ? "bg-slate-950 border-slate-800 text-white focus:border-indigo-500" 
                          : "bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500"
                      }`}
                    />
                  </div>

                  {/* Economic Code */}
                  <div className="space-y-1.5">
                    <label className={`text-[11px] font-bold block ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                      کد اقتصادی / شناسه ملی شرکت
                    </label>
                    <input
                      type="text"
                      value={editingUser.economicCode || ""}
                      onChange={(e) => setEditingUser({ ...editingUser, economicCode: e.target.value })}
                      placeholder="۴۱۱۰۰۰۰۰۰۰۰"
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs border outline-none transition-all font-mono ${
                        isDarkMode 
                          ? "bg-slate-950 border-slate-800 text-white focus:border-indigo-500" 
                          : "bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500"
                      }`}
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: System Access & Role */}
              <div className="space-y-4 pt-3 border-t border-slate-200 dark:border-slate-800">
                <h4 className={`text-xs font-black uppercase tracking-wider flex items-center gap-2 ${
                  isDarkMode ? "text-indigo-400" : "text-indigo-600"
                }`}>
                  <ShieldCheck className="w-4 h-4" />
                  <span>سطح دسترسی و وضعیت حساب کاربری</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* System Role */}
                  <div className="space-y-1.5">
                    <label className={`text-[11px] font-bold block ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                      نقش سیستمی کاربر
                    </label>
                    <select
                      value={editingUser.role || "user"}
                      onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs border outline-none transition-all cursor-pointer ${
                        isDarkMode 
                          ? "bg-slate-950 border-slate-800 text-white focus:border-indigo-500" 
                          : "bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500"
                      }`}
                    >
                      <option value="user">کاربر عادی (استخراج اسناد)</option>
                      <option value="auditor">حسابرس (تایید و ممیزی مالی)</option>
                      <option value="manager">مدیر مالی (گزارشات و خروجی‌ها)</option>
                      <option value="admin">مدیر کل ارشد (دسترسی کامل Admin)</option>
                    </select>
                  </div>

                  {/* Account Status */}
                  <div className="space-y-1.5">
                    <label className={`text-[11px] font-bold block ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                      وضعیت حساب کاربری
                    </label>
                    <select
                      value={editingUser.status || "active"}
                      onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value })}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs border outline-none transition-all cursor-pointer ${
                        isDarkMode 
                          ? "bg-slate-950 border-slate-800 text-white focus:border-indigo-500" 
                          : "bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500"
                      }`}
                    >
                      <option value="active">فعال و مجاز (Active)</option>
                      <option value="suspended">مسدود شده (Suspended)</option>
                    </select>
                  </div>

                  {/* Onboarding State */}
                  <div className="space-y-1.5">
                    <label className={`text-[11px] font-bold block ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                      تکمیل بودن شناسنامه (Onboarding)
                    </label>
                    <select
                      value={editingUser.isOnboarded ? "true" : "false"}
                      onChange={(e) => setEditingUser({ ...editingUser, isOnboarded: e.target.value === "true" })}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs border outline-none transition-all cursor-pointer ${
                        isDarkMode 
                          ? "bg-slate-950 border-slate-800 text-white focus:border-indigo-500" 
                          : "bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500"
                      }`}
                    >
                      <option value="true">تکمیل و تایید شده (تکمیل شده)</option>
                      <option value="false">نیازمند ورود اطلاعات اولیـه (در انتظار)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 4: Quotas & Custom AI Key */}
              <div className="space-y-4 pt-3 border-t border-slate-200 dark:border-slate-800">
                <h4 className={`text-xs font-black uppercase tracking-wider flex items-center gap-2 ${
                  isDarkMode ? "text-indigo-400" : "text-indigo-600"
                }`}>
                  <HardDrive className="w-4 h-4" />
                  <span>منابع اختصاصی ابری و کلید هوش مصنوعی</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Extra Storage */}
                  <div className="space-y-1.5">
                    <label className={`text-[11px] font-bold block ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                      فضای ابری اضافه (GB)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={editingUser.extraStorage !== undefined ? editingUser.extraStorage : 0}
                      onChange={(e) => setEditingUser({ ...editingUser, extraStorage: Number(e.target.value) || 0 })}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs border outline-none transition-all font-mono ${
                        isDarkMode 
                          ? "bg-slate-950 border-slate-800 text-white focus:border-indigo-500" 
                          : "bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500"
                      }`}
                    />
                    <span className="text-[10px] text-slate-400 block">
                      مجموع فضای کاربر: {(5 + (editingUser.extraStorage || 0))} گیگابایت
                    </span>
                  </div>

                  {/* Custom Gemini API Key */}
                  <div className="space-y-1.5">
                    <label className={`text-[11px] font-bold block ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                      کلید اختصاصی API هوش مصنوعی (Gemini API Key)
                    </label>
                    <input
                      type="text"
                      value={editingUser.geminiApiKey || ""}
                      onChange={(e) => setEditingUser({ ...editingUser, geminiApiKey: e.target.value })}
                      placeholder="AIzaSy..."
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs border outline-none transition-all font-mono ${
                        isDarkMode 
                          ? "bg-slate-950 border-slate-800 text-white focus:border-indigo-500" 
                          : "bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500"
                      }`}
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>

              {/* Section 5: Admin Notes */}
              <div className="space-y-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <label className={`text-[11px] font-bold block ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                  یادداشت و ملاحظات ادمین درباره کاربر
                </label>
                <textarea
                  rows={2}
                  value={editingUser.notes || ""}
                  onChange={(e) => setEditingUser({ ...editingUser, notes: e.target.value })}
                  placeholder="ملاحظات خاص مدیریت، شماره پرونده یا سوابق دسترسی..."
                  className={`w-full p-3 rounded-xl text-xs border outline-none transition-all ${
                    isDarkMode 
                      ? "bg-slate-950 border-slate-800 text-white focus:border-indigo-500" 
                      : "bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500"
                  }`}
                />
              </div>

            </div>

            {/* Modal Actions Footer */}
            <div className={`p-4 border-t flex items-center justify-between gap-3 shrink-0 ${
              isDarkMode ? "bg-slate-800/60 border-slate-700" : "bg-slate-50 border-slate-150"
            }`}>
              <button
                type="button"
                onClick={() => {
                  setShowEditUserModal(false);
                  setEditingUser(null);
                }}
                className={`px-5 py-2.5 rounded-2xl text-xs font-bold border transition-all cursor-pointer ${
                  isDarkMode ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-300 text-slate-700 hover:bg-slate-100"
                }`}
              >
                انصراف
              </button>

              <button
                type="button"
                onClick={async () => {
                  if (!editingUser || !editingUser.name?.trim()) {
                    showNotification("لطفاً نام و نام خانوادگی کاربر را وارد کنید.", "error");
                    return;
                  }

                  const updatedUser = {
                    ...editingUser,
                    name: editingUser.name.trim(),
                    email: editingUser.email?.trim() || "",
                    phone: editingUser.phone?.trim() || "",
                    nationalCode: editingUser.nationalCode?.trim() || "",
                    company: editingUser.company?.trim() || editingUser.companyName?.trim() || "",
                    companyName: editingUser.company?.trim() || editingUser.companyName?.trim() || "",
                    jobTitle: editingUser.jobTitle?.trim() || "",
                    economicCode: editingUser.economicCode?.trim() || "",
                    role: editingUser.role || "user",
                    status: editingUser.status || "active",
                    isOnboarded: editingUser.isOnboarded !== undefined ? editingUser.isOnboarded : true,
                    extraStorage: Number(editingUser.extraStorage) || 0,
                    geminiApiKey: editingUser.geminiApiKey?.trim() || "",
                    notes: editingUser.notes?.trim() || "",
                    updatedAt: Date.now()
                  };

                  // 1. Update users list state
                  setUsers(prev => prev.map(u => (u.id === editingUser.id || u.email === editingUser.email) ? updatedUser : u));

                  // 2. Sync currentUser if editing own account
                  if (currentUser && (currentUser.id === editingUser.id || currentUser.email === editingUser.email)) {
                    if (setCurrentUser) setCurrentUser(updatedUser);
                    try {
                      localStorage.setItem("currentUser", JSON.stringify(updatedUser));
                    } catch (e) {
                      console.warn("Failed to sync currentUser in localStorage", e);
                    }
                  }

                  if (isRegistrationUnlocked) {
                    logEvent("ویرایش آگاهانه اطلاعات ثبت‌نام", `قفل اطلاعات اولیه کاربر «${updatedUser.name}» باز شده و مشخصات ثبت‌نامی اولیه وی تغییر یافت.`, "warning");
                  } else {
                    logEvent("ویرایش شناسنامه کاربر", `شناسنامه و مشخصات کاربر «${updatedUser.name}» بروزرسانی و در سراسر سیستم همگام‌سازی شد.`);
                  }
                  showNotification(`شناسنامه کاربر «${updatedUser.name}» با موفقیت ویرایش و همگام گردید.`, "success");
                  setShowEditUserModal(false);
                  setEditingUser(null);
                }}
                className="px-6 py-2.5 rounded-2xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all cursor-pointer active:scale-95"
              >
                <span>ذخیره تغییرات و همگام‌سازی</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Add New User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 sm:p-6" dir="rtl">
          <div 
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md animate-fade-in"
            onClick={() => setShowAddUserModal(false)}
          />

          <div className={`relative w-full max-w-lg rounded-3xl shadow-2xl flex flex-col overflow-hidden transform transition-all animate-slide-up border ${
            isDarkMode 
              ? "bg-slate-900 border-slate-750 text-slate-100 shadow-indigo-950/50" 
              : "bg-white border-slate-200 text-slate-800 shadow-slate-300/60"
          }`}>
            <div className={`p-5 border-b flex items-center justify-between shrink-0 ${
              isDarkMode ? "bg-slate-800/80 border-slate-700/80" : "bg-indigo-50/80 border-slate-150"
            }`}>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-md">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm">تعریف کاربر جدید در سیستم</h3>
                  <p className={`text-[10px] mt-0.5 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                    ایجاد حساب کاربری و ثبت شناسنامه اولیه در پایگاه داده Firestore
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowAddUserModal(false)}
                className={`p-2 rounded-xl transition-colors ${
                  isDarkMode ? "hover:bg-slate-800 text-slate-400 hover:text-white" : "hover:bg-slate-200 text-slate-600 hover:text-slate-900"
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className={`text-[11px] font-bold block ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                  نام و نام خانوادگی <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="مثال: رضا احمدی"
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs border outline-none transition-all ${
                    isDarkMode 
                      ? "bg-slate-950 border-slate-800 text-white focus:border-indigo-500" 
                      : "bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500"
                  }`}
                />
              </div>

              <div className="space-y-1.5">
                <label className={`text-[11px] font-bold block ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                  پست الکترونیکی / ایمیل <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="user@company.com"
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs border outline-none transition-all font-mono ${
                    isDarkMode 
                      ? "bg-slate-950 border-slate-800 text-white focus:border-indigo-500" 
                      : "bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500"
                  }`}
                  dir="ltr"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className={`text-[11px] font-bold block ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                    شماره همراه
                  </label>
                  <input
                    type="text"
                    value={newUser.phone}
                    onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                    placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs border outline-none transition-all font-mono ${
                      isDarkMode 
                        ? "bg-slate-950 border-slate-800 text-white focus:border-indigo-500" 
                        : "bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500"
                    }`}
                    dir="ltr"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className={`text-[11px] font-bold block ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                    نام شرکت / سازمان
                  </label>
                  <input
                    type="text"
                    value={newUser.companyName}
                    onChange={(e) => setNewUser({ ...newUser, companyName: e.target.value })}
                    placeholder="شرکت نمونه"
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs border outline-none transition-all ${
                      isDarkMode 
                        ? "bg-slate-950 border-slate-800 text-white focus:border-indigo-500" 
                        : "bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500"
                    }`}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className={`text-[11px] font-bold block ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                  نقش سیستمی کاربر
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs border outline-none transition-all cursor-pointer ${
                    isDarkMode 
                      ? "bg-slate-950 border-slate-800 text-white focus:border-indigo-500" 
                      : "bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500"
                  }`}
                >
                  <option value="user">کاربر عادی (استخراج اسناد)</option>
                  <option value="auditor">حسابرس (تایید و ممیزی مالی)</option>
                  <option value="manager">مدیر مالی (گزارشات و خروجی‌ها)</option>
                  <option value="admin">مدیر کل ارشد (دسترسی کامل Admin)</option>
                </select>
              </div>
            </div>

            <div className={`p-4 border-t flex items-center justify-between gap-3 shrink-0 ${
              isDarkMode ? "bg-slate-800/60 border-slate-700" : "bg-slate-50 border-slate-150"
            }`}>
              <button
                type="button"
                onClick={() => setShowAddUserModal(false)}
                className={`px-5 py-2.5 rounded-2xl text-xs font-bold border transition-all cursor-pointer ${
                  isDarkMode ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-300 text-slate-700 hover:bg-slate-100"
                }`}
              >
                انصراف
              </button>

              <button
                type="button"
                onClick={async () => {
                  if (!newUser.name?.trim() || !newUser.email?.trim()) {
                    showNotification("لطفاً نام و آدرس ایمیل کاربر جدید را وارد کنید.", "error");
                    return;
                  }

                  const newId = `user_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
                  const userObj = {
                    id: newId,
                    name: newUser.name.trim(),
                    email: newUser.email.trim(),
                    phone: newUser.phone?.trim() || "",
                    company: newUser.companyName?.trim() || "",
                    companyName: newUser.companyName?.trim() || "",
                    jobTitle: "",
                    role: newUser.role || "user",
                    status: "active",
                    isOnboarded: true,
                    extraStorage: 0,
                    apiUsage: 0,
                    createdAt: Date.now()
                  };

                  setUsers(prev => [userObj, ...prev]);

                  logEvent("تعریف کاربر جدید", `کاربر جدید «${userObj.name}» در سیستم تعریف گردید.`);
                  showNotification(`کاربر جدید «${userObj.name}» با موفقیت ایجاد گردید.`, "success");
                  setShowAddUserModal(false);
                  setNewUser({ name: "", email: "", role: "user", companyName: "", phone: "" });
                }}
                className="px-6 py-2.5 rounded-2xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all cursor-pointer active:scale-95"
              >
                <span>ایجاد کاربر جدید</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanelModal;
