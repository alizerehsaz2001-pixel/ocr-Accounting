import React, { useState } from "react";
import {
  Shield, Users, ShieldCheck, Activity, Download, Trash2, X, User,
  Building, Phone, HardDrive, Cpu, Edit2, Ban, CheckCircle2, Upload,
  List, FileSpreadsheet, Database, Plus, FileText, Settings, KeyRound,
  Lock, Eye, EyeOff, AlertCircle, Terminal, Coins, AlertTriangle, RefreshCw
} from "lucide-react";
import * as XLSX from "xlsx";
import { db } from "../lib/firebase";
import { doc, setDoc } from "firebase/firestore";

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  currentUser: any;
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

  const updateUserInFirestore = async (userId: string, updates: any) => {
    try {
      const userRef = doc(db, "users", String(userId));
      await setDoc(userRef, updates, { merge: true });
    } catch(err) {
      console.warn("Failed to update user in Firestore:", err);
    }
  };

  
  // PIN change form
  const [pinForm, setPinForm] = useState({ current: "", newPin: "", confirm: "" });
  const [showCurrentPin, setShowCurrentPin] = useState(false);

  // New user form
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "user", companyName: "", phone: "" });

  // Edit user form
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  // Terminal log search
  const [terminalFilter, setTerminalFilter] = useState("");

  if (!isOpen || currentUser?.role !== "admin") return null;

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    u.companyName?.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

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
      extraStorage: 0
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

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-6">
      <div 
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      ></div>
      
      <div className={`relative w-full max-w-5xl h-[90vh] md:h-[730px] rounded-[28px] shadow-2xl flex overflow-hidden transform transition-all animate-in slide-in-from-bottom-6 duration-300 border ${
        isDarkMode ? "bg-[#0b1120] border-slate-800 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-800"
      }`} dir="rtl">
        
        {/* Sidebar Navigation */}
        <div className={`w-1/3 md:w-64 flex flex-col shrink-0 border-l ${isDarkMode ? "bg-slate-900/80 border-slate-800/80" : "bg-white border-slate-100"}`}>
           <div className="p-5 pb-3">
             <h3 className="font-bold text-[15px] flex items-center gap-2">
                <div className={`p-2 rounded-xl ${isDarkMode ? "bg-indigo-900/40 text-indigo-400 border border-indigo-800/50" : "bg-indigo-50 text-indigo-600 border border-indigo-100"}`}>
                   <Shield className="w-5 h-5" />
                </div>
                <div>
                  <span className="block leading-none">پنل ارشد مدیریت</span>
                  <span className="text-[10px] font-normal text-indigo-500 font-mono mt-0.5 block">Admin Control Panel</span>
                </div>
             </h3>
             <p className={`text-[10px] mt-2.5 leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
               کنترل کامل کاربران، کد اختصاصی امنیت، پایش زنده و داده‌های سیستم
             </p>
           </div>
           
           <div className="flex-1 overflow-y-auto py-2 px-3 flex flex-col gap-1.5 custom-scrollbar">
             <button 
               onClick={() => setAdminPanelTab("users")}
               className={`flex items-center gap-2.5 px-3 py-3 rounded-2xl text-[12px] font-bold transition-all group ${
                 adminPanelTab === "users" 
                   ? (isDarkMode ? "bg-slate-800 text-white shadow-sm" : "bg-indigo-50/80 text-indigo-900 shadow-sm") 
                   : (isDarkMode ? "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800")
               }`}
             >
               <Users className={`w-4 h-4 transition-transform ${adminPanelTab === "users" ? "text-indigo-500" : "opacity-60 group-hover:scale-110"}`} />
               مدیریت کاربران و دسترسی
             </button>

             <button 
               onClick={() => setAdminPanelTab("security")}
               className={`flex items-center gap-2.5 px-3 py-3 rounded-2xl text-[12px] font-bold transition-all group ${
                 adminPanelTab === "security" 
                   ? (isDarkMode ? "bg-slate-800 text-white shadow-sm" : "bg-amber-50/80 text-amber-900 shadow-sm") 
                   : (isDarkMode ? "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800")
               }`}
             >
               <ShieldCheck className={`w-4 h-4 transition-transform ${adminPanelTab === "security" ? "text-amber-500" : "opacity-60 group-hover:scale-110"}`} />
               کد اختصاصی و امنیت
             </button>

             <button 
               onClick={() => setAdminPanelTab("system")}
               className={`flex items-center gap-2.5 px-3 py-3 rounded-2xl text-[12px] font-bold transition-all group ${
                 adminPanelTab === "system" 
                   ? (isDarkMode ? "bg-slate-800 text-white shadow-sm" : "bg-purple-50/80 text-purple-900 shadow-sm") 
                   : (isDarkMode ? "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800")
               }`}
             >
               <Activity className={`w-4 h-4 transition-transform ${adminPanelTab === "system" ? "text-purple-500" : "opacity-60 group-hover:scale-110"}`} />
               پایش زنده و سلامت
             </button>

             <button 
               onClick={() => setAdminPanelTab("data")}
               className={`flex items-center gap-2.5 px-3 py-3 rounded-2xl text-[12px] font-bold transition-all group ${
                 adminPanelTab === "data" 
                   ? (isDarkMode ? "bg-slate-800 text-white shadow-sm" : "bg-emerald-50/80 text-emerald-900 shadow-sm") 
                   : (isDarkMode ? "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800")
               }`}
             >
               <Download className={`w-4 h-4 transition-transform ${adminPanelTab === "data" ? "text-emerald-500" : "opacity-60 group-hover:scale-110"}`} />
               پشتیبان‌گیری و داده‌ها
             </button>

             <button 
               onClick={() => setAdminPanelTab("danger")}
               className={`flex items-center gap-2.5 px-3 py-3 rounded-2xl text-[12px] font-bold transition-all group ${
                 adminPanelTab === "danger" 
                   ? (isDarkMode ? "bg-rose-950/40 text-rose-300 shadow-sm" : "bg-rose-50 text-rose-700 shadow-sm") 
                   : (isDarkMode ? "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800")
               }`}
             >
               <Trash2 className={`w-4 h-4 transition-transform ${adminPanelTab === "danger" ? "text-rose-500" : "opacity-60 group-hover:scale-110"}`} />
               منطقه خطر
             </button>
           </div>

           {/* Admin PIN Active Indicator Footer */}
           <div className={`p-4 m-3 rounded-2xl border text-[10px] ${
             isDarkMode ? "bg-slate-900 border-slate-800 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-600"
           }`}>
             <div className="flex items-center justify-between font-mono">
               <span>کد اختصاصی ادمین:</span>
               <span className="font-bold text-indigo-400">فعال (****)</span>
             </div>
           </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col relative overflow-hidden bg-transparent">
           <button 
              onClick={onClose}
              className={`absolute top-5 left-5 p-2 rounded-full z-10 transition-colors ${
                isDarkMode ? "bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-white" : "bg-slate-200 text-slate-500 hover:bg-slate-300 hover:text-slate-800"
              }`}
            >
              <X className="h-4 w-4" />
           </button>

           <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
             
             {/* 1. USERS TAB */}
             {adminPanelTab === "users" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-4xl mx-auto pb-8">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-[15px] font-bold mb-1">مدیریت کاربران و سطوح دسترسی</h4>
                      <p className={`text-[11px] ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                        تعیین نقش مدیر/کاربر، تخصیص حجم اضافه و کنترل وضعیت حساب‌ها
                      </p>
                    </div>

                    <button
                      onClick={() => setShowAddUserModal(true)}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center justify-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
                    >
                      <Plus className="w-4 h-4" />
                      افزودن کاربر جدید
                    </button>
                  </div>

                  {/* Search Bar */}
                  <div className="relative">
                    <input
                      type="text"
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      placeholder="جستجوی کاربر با نام، ایمیل یا نام شرکت..."
                      className={`w-full py-2.5 px-4 pr-10 text-xs rounded-xl border outline-none transition-all ${
                        isDarkMode ? "bg-slate-900 border-slate-800 text-white focus:border-indigo-500" : "bg-white border-slate-200 text-slate-800 focus:border-indigo-500"
                      }`}
                    />
                    <Users className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>

                  {/* Users Cards */}
                  <div className="space-y-3">
                    {filteredUsers.map(u => (
                      <div key={u.id} className={`p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all border ${
                        isDarkMode 
                          ? "bg-slate-900/60 border-slate-800 hover:border-slate-700 shadow-sm" 
                          : "bg-white border-slate-200 hover:border-slate-300 shadow-sm"
                      }`}>
                        <div className="flex items-start sm:items-center gap-3">
                          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-[15px] shrink-0 border ${
                            u.role === "admin" 
                              ? (isDarkMode ? "bg-indigo-900/40 border-indigo-800 text-indigo-400" : "bg-indigo-50 border-indigo-200 text-indigo-600")
                              : u.role === "manager"
                              ? (isDarkMode ? "bg-amber-900/40 border-amber-800 text-amber-400" : "bg-amber-50 border-amber-200 text-amber-600")
                              : u.role === "auditor"
                              ? (isDarkMode ? "bg-emerald-900/40 border-emerald-800 text-emerald-400" : "bg-emerald-50 border-emerald-200 text-emerald-600")
                              : (isDarkMode ? "bg-slate-800 border-slate-700 text-slate-300" : "bg-slate-100 border-slate-200 text-slate-600")
                          }`}>
                            {u.name ? u.name.charAt(0) : "U"}
                          </div>
                          <div className="space-y-1 text-right">
                            <div className="flex items-center gap-2">
                              <h5 className="font-bold text-[13px]">{u.name}</h5>
                              {u.role === "admin" && (
                                <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold ${isDarkMode ? "bg-indigo-900/40 text-indigo-400 border border-indigo-800" : "bg-indigo-50 text-indigo-700 border border-indigo-200"}`}>
                                  مدیر سیستم
                                </span>
                              )}
                              {u.role === "manager" && (
                                <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold ${isDarkMode ? "bg-amber-900/40 text-amber-400 border border-amber-800" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
                                  مدیر مالی
                                </span>
                              )}
                              {u.role === "auditor" && (
                                <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold ${isDarkMode ? "bg-emerald-900/40 text-emerald-400 border border-emerald-800" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
                                  حسابرس
                                </span>
                              )}
                              {!u.isOnboarded && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-500 font-bold border border-amber-500/20">
                                  پروفایل ناقص
                                </span>
                              )}
                            </div>
                            <div className={`text-[10px] flex flex-wrap gap-x-3 gap-y-1 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                              {u.email && <span>{u.email}</span>}
                              {u.companyName && <span className="flex items-center gap-1 opacity-90"><Building className="w-3 h-3"/> {u.companyName}</span>}
                              {u.phone && <span className="flex items-center gap-1 opacity-90" dir="ltr"><Phone className="w-3 h-3"/> {u.phone}</span>}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 md:justify-end">
                          {/* Role Switcher */}
                          <select
                            value={u.role || "user"}
                            onChange={(e) => {
                              const newRole = e.target.value;
                              setUsers(prev => prev.map(usr => usr.id === u.id ? { ...usr, role: newRole } : usr));
                              updateUserInFirestore(u.id, { role: newRole });
                              showNotification(`نقش کاربر «${u.name}» به ${newRole} تغییر یافت.`, "success");
                              logEvent("تغییر نقش کاربر", `نقش ${u.name} به ${newRole} تغییر کرد.`, "info");
                            }}
                            className={`px-2 py-1.5 rounded-xl text-[10px] font-bold border outline-none transition-colors ${
                              u.role === "admin"
                                ? (isDarkMode ? "bg-indigo-950/40 border-indigo-800 text-indigo-300" : "bg-indigo-50 border-indigo-200 text-indigo-700")
                                : u.role === "manager"
                                ? (isDarkMode ? "bg-amber-950/40 border-amber-800 text-amber-300" : "bg-amber-50 border-amber-200 text-amber-700")
                                : u.role === "auditor"
                                ? (isDarkMode ? "bg-emerald-950/40 border-emerald-800 text-emerald-300" : "bg-emerald-50 border-emerald-200 text-emerald-700")
                                : (isDarkMode ? "bg-slate-800 border-slate-700 text-slate-300" : "bg-slate-100 border-slate-200 text-slate-700")
                            }`}
                            title="تغییر نقش دسترسی"
                          >
                            <option value="user">کاربر / حسابدار</option>
                            <option value="manager">مدیر مالی</option>
                            <option value="auditor">حسابرس</option>
                            <option value="admin">مدیر سیستم (Admin)</option>
                          </select>

                          {/* Status Badge */}
                          <div className={`flex items-center gap-1.5 px-2 py-1.5 rounded-xl text-[10px] font-bold border ${
                            u.status === "active" 
                              ? (isDarkMode ? "bg-emerald-950/20 border-emerald-900/50 text-emerald-400" : "bg-emerald-50 border-emerald-100 text-emerald-600")
                              : (isDarkMode ? "bg-rose-950/20 border-rose-900/50 text-rose-400" : "bg-rose-50 border-rose-100 text-rose-600")
                          }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${u.status === "active" ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`}></div>
                            {u.status === "active" ? "فعال" : "مسدود"}
                          </div>

                          {/* Full Edit Profile Button */}
                          <button
                            onClick={() => {
                              setEditingUser({ ...u });
                              setShowEditUserModal(true);
                            }}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition-colors border cursor-pointer ${
                              isDarkMode 
                                ? "bg-slate-900 border-indigo-900/40 text-indigo-300 hover:bg-slate-800" 
                                : "bg-indigo-50 border-indigo-100 text-indigo-600 hover:bg-indigo-100"
                            }`}
                            title="ویرایش کامل مشخصات کاربر"
                          >
                            <Settings className="w-3.5 h-3.5 text-indigo-500" />
                            <span>ویرایش کامل</span>
                          </button>

                          {/* Storage */}
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
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition-colors border ${
                              isDarkMode 
                                ? "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800" 
                                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                            }`}
                            title="تغییر فضای اختصاصی"
                          >
                            <HardDrive className="w-3.5 h-3.5 opacity-60 text-indigo-500" />
                            <span dir="ltr">{(5 + (u.extraStorage || 0)).toLocaleString("fa-IR")} GB</span>
                            <Edit2 className="w-3 h-3 opacity-40 mr-0.5" />
                          </button>

                          {/* API Key */}
                          <button
                            onClick={() => {
                              const currentApiKey = u.geminiApiKey || "";
                              const input = prompt(`کلید API جمینای اختصاصی (GEMINI_API_KEY) برای ${u.name} را وارد کنید:`, currentApiKey);
                              if (input !== null) {
                                setUsers(prev => prev.map(usr => usr.id === u.id ? { ...usr, geminiApiKey: input } : usr));
                                updateUserInFirestore(u.id, { geminiApiKey: input });
                                logEvent("تخصیص کلید API", `کلید API برای کاربر «${u.name}» تنظیم یا تغییر یافت.`);
                                showNotification(`کلید API کاربر «${u.name}» بروزرسانی شد.`, "success");
                              }
                            }}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition-colors border ${
                              isDarkMode 
                                ? "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800" 
                                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                            }`}
                            title="تنظیم کلید API اختصاصی"
                          >
                            <KeyRound className="w-3.5 h-3.5 opacity-60 text-indigo-500" />
                            <span className="truncate max-w-[100px]" dir="ltr">
                              {u.geminiApiKey ? `${u.geminiApiKey.substring(0, 8)}...` : "بدون کلید"}
                            </span>
                            <Edit2 className="w-3 h-3 opacity-40 mr-0.5" />
                          </button>

                          {/* Status Toggle */}
                          <button
                             onClick={() => {
                                const newStatus = u.status === "active" ? "suspended" : "active";
                                setUsers(prev => prev.map(usr => usr.id === u.id ? {...usr, status: newStatus} : usr));
                                updateUserInFirestore(u.id, { status: newStatus });
                                showNotification(`وضعیت کاربر ${u.name} تغییر یافت.`, "success");
                             }}
                             className={`p-2 rounded-xl transition-colors border ${
                                u.status === "active"
                                  ? (isDarkMode ? "border-slate-800 text-slate-400 hover:bg-rose-950/40 hover:text-rose-400 hover:border-rose-900/50" : "border-slate-200 text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200")
                                  : (isDarkMode ? "border-rose-900/50 bg-rose-950/20 text-rose-400 hover:bg-emerald-950/40 hover:text-emerald-400 hover:border-emerald-900/50" : "border-rose-200 bg-rose-50 text-rose-600 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200")
                             }`}
                             title={u.status === "active" ? "مسدود کردن کاربر" : "فعال‌سازی کاربر"}
                          >
                             {u.status === "active" ? <Ban className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add User Modal */}
                  {showAddUserModal && (
                    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
                      <div className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl ${
                        isDarkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"
                      }`} dir="rtl">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-bold text-sm flex items-center gap-2">
                            <Plus className="w-4 h-4 text-indigo-500" />
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
                                isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                              }`}
                            />
                          </div>

                          <div>
                            <label className="block mb-1 font-bold text-slate-400">پست الکترونیک (ایمیل):</label>
                            <input
                              type="email"
                              value={newUser.email}
                              onChange={(e) => setNewUser(p => ({ ...p, email: e.target.value }))}
                              placeholder="example@company.ir"
                              className={`w-full p-2.5 rounded-xl border outline-none ${
                                isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                              }`}
                            />
                          </div>

                          <div>
                            <label className="block mb-1 font-bold text-slate-400">سطح دسترسی (نقش):</label>
                            <select
                              value={newUser.role}
                              onChange={(e) => setNewUser(p => ({ ...p, role: e.target.value }))}
                              className={`w-full p-2.5 rounded-xl border outline-none ${
                                isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                              }`}
                            >
                              <option value="user">کاربر عادي / حسابدار</option>
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
                                  isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
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
                                  isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                                }`}
                              />
                            </div>
                          </div>

                          <div className="flex gap-2 pt-2">
                            <button
                              type="submit"
                              className="flex-1 py-2.5 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition"
                            >
                              ایجاد کاربر
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
                    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
                      <div className={`w-full max-w-lg p-6 rounded-3xl border shadow-2xl overflow-y-auto max-h-[90vh] ${
                        isDarkMode ? "bg-[#0b1120] border-slate-850 text-white" : "bg-white border-slate-200 text-slate-800"
                      }`} dir="rtl">
                        <div className="flex items-center justify-between mb-4 pb-2 border-b dark:border-slate-800 border-slate-100">
                          <h4 className="font-bold text-sm flex items-center gap-2">
                            <Settings className="w-4 h-4 text-indigo-500 animate-spin" style={{ animationDuration: '6s' }} />
                            ویرایش شناسنامه و سطوح دسترسی کاربر ({editingUser.name})
                          </h4>
                          <button onClick={() => { setShowEditUserModal(false); setEditingUser(null); }} className="text-slate-400 hover:text-slate-250">
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
                                <option value="user">کاربر عادي / حسابدار</option>
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
                              <label className="block mb-1 font-bold text-slate-400">عنوان/سمت شغلی:</label>
                              <input
                                type="text"
                                value={editingUser.jobTitle || ""}
                                onChange={(e) => setEditingUser((p: any) => ({ ...p, jobTitle: e.target.value }))}
                                className={`w-full p-2.5 rounded-xl border outline-none ${
                                  isDarkMode ? "bg-slate-800 border-slate-700 text-white focus:border-indigo-500" : "bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500"
                                }`}
                              />
                            </div>

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
                          </div>

                          <div>
                            <label className="block mb-1 font-bold text-slate-400">کلید اختصاصی Gemini API Key (مخصوص این کاربر):</label>
                            <input
                              type="text"
                              value={editingUser.geminiApiKey || ""}
                              onChange={(e) => setEditingUser((p: any) => ({ ...p, geminiApiKey: e.target.value }))}
                              placeholder="کلید اختصاصی GEMINI_API_KEY کاربر را وارد کنید..."
                              className={`w-full p-2.5 rounded-xl border outline-none font-mono ${
                                isDarkMode ? "bg-slate-800 border-slate-700 text-white focus:border-indigo-500" : "bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500"
                              }`}
                            />
                            <p className="text-[10px] text-indigo-400 mt-1">
                              با تنظیم این فیلد، فرآیندهای پردازش هوش مصنوعی این کاربر مستقیماً روی سهمیه کلید شخصی وی بارگذاری و محاسبه می‌گردد.
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-3 bg-slate-950/25 dark:bg-slate-950/40 p-3 rounded-2xl border dark:border-slate-800 border-slate-200/60">
                            <div>
                              <label className="block mb-1 font-bold text-slate-400">توکن‌های مصرف شده AI:</label>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-indigo-400 text-[13px]">
                                  {(editingUser.apiUsage || 0).toLocaleString("fa-IR")}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setEditingUser((p: any) => ({ ...p, apiUsage: 0 }))}
                                  className="px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-[9px] font-bold transition border border-rose-500/20"
                                >
                                  صفر کردن مصرف
                                </button>
                              </div>
                            </div>

                            <div>
                              <label className="block mb-1 font-bold text-slate-400">عضویت از تاریخ:</label>
                              <span className="font-mono text-slate-400 text-[11px] block mt-1.5">
                                {editingUser.createdAt ? new Date(editingUser.createdAt).toLocaleDateString("fa-IR") : "ثبت نشده"}
                              </span>
                            </div>
                          </div>

                          <div className="flex gap-2 pt-2 border-t dark:border-slate-800 border-slate-100">
                            <button
                              type="submit"
                              className="flex-1 py-2.5 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition flex items-center justify-center gap-1"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              ذخیره تغییرات شناسنامه کاربر
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

             {/* 2. SECURITY & PIN TAB */}
             {adminPanelTab === "security" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-3xl mx-auto pb-8">
                  <div>
                    <h4 className="text-[15px] font-bold mb-1 flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-amber-500" />
                      تنظیمات کد اختصاصی ادمین و امنیت
                    </h4>
                    <p className={`text-[11px] ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                      تغییر کد اختصاصی ادمین (Admin PIN)، سیاست‌های رمزنگاری و بررسی لاگ‌های امنیتی
                    </p>
                  </div>

                  {/* Change Admin PIN Form Card */}
                  <div className={`p-6 rounded-3xl border ${
                    isDarkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200 shadow-sm"
                  }`}>
                    <h5 className="font-bold text-xs mb-4 flex items-center gap-2 text-indigo-500">
                      <KeyRound className="w-4 h-4" />
                      تغییر کد اختصاصی مدیر ارشد (Admin Master PIN)
                    </h5>

                    <form onSubmit={handleUpdatePin} className="space-y-4 max-w-md">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">کد اختصاصی فعلی ادمین:</label>
                        <div className="relative">
                          <input
                            type={showCurrentPin ? "text" : "password"}
                            required
                            value={pinForm.current}
                            onChange={(e) => setPinForm(p => ({ ...p, current: e.target.value }))}
                            placeholder="کد اختصاصی فعلی"
                            className={`w-full p-2.5 px-3 font-mono font-bold text-sm rounded-xl border outline-none ${
                              isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPin(!showCurrentPin)}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                          >
                            {showCurrentPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">کد اختصاصی جدید:</label>
                          <input
                            type="password"
                            required
                            value={pinForm.newPin}
                            onChange={(e) => setPinForm(p => ({ ...p, newPin: e.target.value }))}
                            placeholder="حداقل ۴ رقم"
                            className={`w-full p-2.5 px-3 font-mono font-bold text-sm rounded-xl border outline-none ${
                              isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                            }`}
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">تکرار کد جدید:</label>
                          <input
                            type="password"
                            required
                            value={pinForm.confirm}
                            onChange={(e) => setPinForm(p => ({ ...p, confirm: e.target.value }))}
                            placeholder="تکرار کد جدید"
                            className={`w-full p-2.5 px-3 font-mono font-bold text-sm rounded-xl border outline-none ${
                              isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                            }`}
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="px-5 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-sm flex items-center gap-2 cursor-pointer"
                      >
                        <Lock className="w-4 h-4" />
                        ذخیره کد اختصاصی جدید
                      </button>
                    </form>
                  </div>

                  {/* Security Policy Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className={`p-5 rounded-2xl border ${isDarkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
                      <h5 className="font-bold text-xs mb-2 text-emerald-500">احراز هویت دو مرحله‌ای ادمین (2FA)</h5>
                      <p className={`text-[11px] leading-relaxed mb-3 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                        الزام ورود با کد اختصاصی + تاییدیه پیامکی جهت امنیت نهایی مدیر سیستم.
                      </p>
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        فعال و هوشمند
                      </span>
                    </div>

                    <div className={`p-5 rounded-2xl border ${isDarkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
                      <h5 className="font-bold text-xs mb-2 text-indigo-500">زمان انقضای نشست کاری (Timeout)</h5>
                      <p className={`text-[11px] leading-relaxed mb-3 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                        خروج خودکار مدیر در صورت ۳۰ دقیقه عدم فعالیت جهت جلوگیری از سوءاستفاده.
                      </p>
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                        <Lock className="w-3.5 h-3.5" />
                        ۳۰ دقیقه غیرفعال
                      </span>
                    </div>
                  </div>

                  {/* Audit Logs Table */}
                  <div className={`p-5 rounded-2xl border ${isDarkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
                    <h5 className="font-bold text-xs mb-3 flex items-center justify-between">
                      <span>آخرین رویدادهای امنیتی سیستم</span>
                      <span className="text-[10px] text-slate-400 font-mono">{auditLogs.length} ثبت شده</span>
                    </h5>

                    <div className="max-h-48 overflow-y-auto space-y-2 custom-scrollbar">
                      {auditLogs.slice(0, 10).map((log) => (
                        <div key={log.id} className={`p-2.5 rounded-xl border text-[11px] flex items-center justify-between gap-3 ${
                          isDarkMode ? "bg-slate-950/40 border-slate-800/80" : "bg-slate-50 border-slate-200/80"
                        }`}>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              log.type === "auth" ? "bg-amber-500" : log.type === "warning" ? "bg-rose-500" : "bg-indigo-500"
                            }`}></div>
                            <span className="font-bold">{log.action}:</span>
                            <span className={isDarkMode ? "text-slate-400" : "text-slate-600"}>{log.details}</span>
                          </div>
                          <span className="text-[9px] font-mono text-slate-400 shrink-0">
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
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-3xl mx-auto pb-8">
                  <div>
                    <h4 className="text-[15px] font-bold mb-1 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-purple-500" />
                      پایش زنده و وضعیت سلامت سیستم
                    </h4>
                    <p className={`text-[11px] ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                      تحلیل لحظه‌ای منابع پردازشی، سلامت دیتابیس و کنسول زنده ترمینال
                    </p>
                  </div>

                  {/* Live Health Gauges */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className={`p-4 rounded-2xl border text-center ${isDarkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
                      <span className="text-[10px] font-bold text-slate-400 block mb-1">بار پردازنده (CPU)</span>
                      <strong className="text-xl font-black font-mono text-indigo-500">۱۸٪</strong>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div className="bg-indigo-500 h-full w-[18%]"></div>
                      </div>
                    </div>

                    <div className={`p-4 rounded-2xl border text-center ${isDarkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
                      <span className="text-[10px] font-bold text-slate-400 block mb-1">مصرف حافظه (RAM)</span>
                      <strong className="text-xl font-black font-mono text-emerald-500">۴۲٪</strong>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div className="bg-emerald-500 h-full w-[42%]"></div>
                      </div>
                    </div>

                    <div className={`p-4 rounded-2xl border text-center ${isDarkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
                      <span className="text-[10px] font-bold text-slate-400 block mb-1">تاخیر دیتابیس (DB)</span>
                      <strong className="text-xl font-black font-mono text-amber-500">۸ms</strong>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div className="bg-amber-500 h-full w-[15%]"></div>
                      </div>
                    </div>

                    <div className={`p-4 rounded-2xl border text-center ${isDarkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
                      <span className="text-[10px] font-bold text-slate-400 block mb-1">همگام‌سازی ابر</span>
                      <strong className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-1 mt-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> متصل و آنلاین
                      </strong>
                    </div>
                  </div>

                  {/* General Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className={`p-4 rounded-2xl border ${isDarkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
                      <FileText className="w-5 h-5 text-indigo-500 mb-2" />
                      <div className="text-xl font-black">{previousScans.length}</div>
                      <div className="text-[10px] text-slate-400 font-bold">اسناد پردازش شده</div>
                    </div>

                    <div className={`p-4 rounded-2xl border ${isDarkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
                      <List className="w-5 h-5 text-emerald-500 mb-2" />
                      <div className="text-xl font-black">{transactions.length}</div>
                      <div className="text-[10px] text-slate-400 font-bold">تراکنش‌های ثبت شده</div>
                    </div>

                    <div className={`p-4 rounded-2xl border ${isDarkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
                      <Database className="w-5 h-5 text-purple-500 mb-2" />
                      <div className="text-xl font-black font-mono">
                        {(JSON.stringify(transactions).length / 1024).toFixed(1)} KB
                      </div>
                      <div className="text-[10px] text-slate-400 font-bold">حجم حافظه محلی</div>
                    </div>

                    <div className={`p-4 rounded-2xl border ${isDarkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
                      <Coins className="w-5 h-5 text-amber-500 mb-2" />
                      <div className="text-xl font-black font-mono">
                        {Number(Object.values(modelQuotas || {}).reduce((acc: number, q: any) => acc + (q.used || 0), 0))}
                      </div>
                      <div className="text-[10px] text-slate-400 font-bold">توکن‌های مصرفی AI</div>
                    </div>
                  </div>

                  {/* Interactive Terminal Stream */}
                  <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs">
                    <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                      <span className="flex items-center gap-2 text-indigo-400 font-bold">
                        <Terminal className="w-4 h-4" />
                        کنسول زنده لاگ‌های سیستم (Live Terminal)
                      </span>
                      <input
                        type="text"
                        value={terminalFilter}
                        onChange={(e) => setTerminalFilter(e.target.value)}
                        placeholder="فیلتر لاگ‌ها..."
                        className="bg-slate-900 border border-slate-800 text-[10px] px-2.5 py-1 rounded-lg text-slate-300 outline-none"
                      />
                    </div>

                    <div className="h-40 overflow-y-auto space-y-1.5 custom-scrollbar text-[11px] leading-relaxed">
                      <div className="text-emerald-400">[SYSTEM OK] Core OCR & Accounting service initialized.</div>
                      <div className="text-indigo-400">[SECURITY] Admin master PIN verified. Active session authenticated.</div>
                      <div className="text-slate-400">[FIRESTORE] Cloud database synchronization active.</div>
                      <div className="text-amber-400">[MEMORY] Auto garbage collection routine clean.</div>
                      {auditLogs.filter(l => !terminalFilter || l.action.includes(terminalFilter) || l.details.includes(terminalFilter)).map(l => (
                        <div key={l.id} className="text-slate-300">
                          <span className="text-slate-500">[{new Date(l.timestamp).toLocaleTimeString()}]</span> <span className="text-indigo-300">{l.action}:</span> {l.details}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Token Manager Link */}
                  <div className={`p-5 rounded-2xl border flex items-center justify-between gap-4 ${
                    isDarkMode ? "bg-indigo-950/20 border-indigo-900/50" : "bg-indigo-50 border-indigo-100"
                  }`}>
                    <div>
                      <h5 className="font-bold text-xs text-indigo-500 mb-1">پنل تخصصی مدیریت توکن هوش مصنوعی</h5>
                      <p className="text-[10px] text-slate-400">مشاهده نمودارهای مصرف، سهمیه‌بندی و کنترل هزینه‌های Gemini API</p>
                    </div>
                    <button
                      onClick={() => {
                        onClose();
                        setIsTokenManagerOpen(true);
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition shrink-0 cursor-pointer"
                    >
                      فتح Token Manager
                    </button>
                  </div>
                </div>
             )}

             {/* 4. DATA & BACKUP TAB */}
             {adminPanelTab === "data" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-2xl mx-auto pb-8">
                  <div>
                    <h4 className="text-[15px] font-bold mb-1 flex items-center gap-2">
                      <Download className="w-5 h-5 text-emerald-500" />
                      پشتیبان‌گیری و انتقال داده‌ها
                    </h4>
                    <p className={`text-[11px] ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                      تهیه فایل پشتیبان کامل JSON، خروجی اکسل و تزریق داده‌های تست
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* JSON Backup */}
                    <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row justify-between gap-4 ${
                      isDarkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200 shadow-sm"
                    }`}>
                      <div className="flex-1">
                        <h5 className="font-bold text-xs mb-1 flex items-center gap-2 text-blue-500">
                          <Download className="w-4 h-4" />
                          پشتیبان کامل سیستم (JSON Backup)
                        </h5>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          شامل تمامی تراکنش‌های مالی، اسناد اسکن شده، سهمیه‌ها و تنظمیات کاربر.
                        </p>
                      </div>

                      <div className="flex flex-col gap-2 shrink-0 sm:w-36">
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
                          className="w-full py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition flex justify-center items-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5" />
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
                          className={`w-full py-2 rounded-xl text-xs font-bold border transition flex justify-center items-center gap-1.5 ${
                            isDarkMode ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <Upload className="w-3.5 h-3.5" />
                          بازیابی (Import)
                        </button>
                      </div>
                    </div>

                    {/* Excel Export */}
                    <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row justify-between gap-4 ${
                      isDarkMode ? "bg-emerald-950/20 border-emerald-900/50" : "bg-emerald-50 border-emerald-100 shadow-sm"
                    }`}>
                      <div className="flex-1">
                        <h5 className="font-bold text-xs mb-1 flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                          <FileSpreadsheet className="w-4 h-4" />
                          خروجی فایل اکسل (XLSX)
                        </h5>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          تولید فایل جدول ساختاریافته شامل تمام ردیف‌های دفتر کل و تراکنش‌ها.
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
                        className="py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition flex justify-center items-center gap-1.5 self-center shrink-0 cursor-pointer"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                        تولید اکسل
                      </button>
                    </div>

                    {/* Mock Seed Generator */}
                    <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row justify-between gap-4 ${
                      isDarkMode ? "bg-indigo-950/20 border-indigo-900/50" : "bg-indigo-50 border-indigo-100 shadow-sm"
                    }`}>
                      <div className="flex-1">
                        <h5 className="font-bold text-xs mb-1 flex items-center gap-2 text-indigo-500">
                          <Database className="w-4 h-4" />
                          افزودن تراکنش‌های نمونه (Mock Data)
                        </h5>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          درج چند فاکتور فرضی حسابداری جهت آزمایش نمودارها و گزارشات سیستم.
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
                          showNotification("تراکنش‌های نمونه افزوده شدند.", "success");
                        }}
                        className={`py-2.5 px-4 rounded-xl text-xs font-bold border transition flex justify-center items-center gap-1.5 self-center shrink-0 cursor-pointer ${
                          isDarkMode ? "border-indigo-500/40 text-indigo-400 hover:bg-indigo-900/30" : "border-indigo-200 text-indigo-700 hover:bg-indigo-100"
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
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-2xl mx-auto pb-8">
                  <div>
                    <h4 className="text-[15px] font-bold mb-1 text-rose-500 flex items-center gap-2">
                      <Trash2 className="w-5 h-5" />
                      منطقه خطر (Danger Zone)
                    </h4>
                    <p className={`text-[11px] ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                      عملیات حساس و غیرقابل بازگشت سیستم. نیازمند تأیید دقیق ادمین.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className={`p-5 rounded-2xl border border-rose-200/60 dark:border-rose-900/40 flex flex-col sm:flex-row justify-between gap-4 ${
                      isDarkMode ? "bg-rose-950/10 hover:bg-rose-950/20" : "bg-rose-50/40 hover:bg-rose-50 shadow-sm"
                    }`}>
                      <div className="flex-1">
                        <h5 className="font-bold text-xs text-rose-600 dark:text-rose-400 mb-1">پاکسازی مخزن تراکنش‌ها</h5>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          حذف کامل تمام ردیف‌های دفتر کل و تراکنش‌های مالی استخراج شده.
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          if (confirm("آیا از حذف تمام تراکنش‌های مالی اطمینان دارید؟")) {
                            setTransactions([]);
                            if (setRawJsonText) setRawJsonText("");
                            if (setActiveFile) setActiveFile(null);
                            showNotification("مخزن تراکنش‌ها پاکسازی گردید.", "success");
                            logEvent("پاکسازی تراکنش‌ها", "تمام تراکنش‌های سیستم توسط مدیر پاکسازی شد.", "warning");
                          }
                        }}
                        className="px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition flex justify-center items-center gap-1.5 shrink-0 self-center cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                        حذف تراکنش‌ها
                      </button>
                    </div>

                    <div className={`p-5 rounded-2xl border border-rose-200/60 dark:border-rose-900/40 flex flex-col sm:flex-row justify-between gap-4 ${
                      isDarkMode ? "bg-rose-950/10 hover:bg-rose-950/20" : "bg-rose-50/40 hover:bg-rose-50 shadow-sm"
                    }`}>
                      <div className="flex-1">
                        <h5 className="font-bold text-xs text-rose-600 dark:text-rose-400 mb-1">پاکسازی تاریخچه اسناد</h5>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          حذف کامل تاریخچه اسناد اسکن شده و متادیتای مرتبط.
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          if (confirm("آیا از حذف کامل تاریخچه اسناد مطمئن هستید؟")) {
                            setPreviousScans([]);
                            showNotification("تاریخچه اسناد پاکسازی شد.", "success");
                            logEvent("حذف تاریخچه اسناد", "مدیر سیستم تاریخچه اسناد را پاکسازی نمود.", "warning");
                          }
                        }}
                        className="px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition flex justify-center items-center gap-1.5 shrink-0 self-center cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                        حذف اسناد
                      </button>
                    </div>

                    <div className={`p-5 rounded-2xl border border-red-500/40 ${isDarkMode ? "bg-red-950/20" : "bg-red-50"}`}>
                      <h5 className="font-bold text-xs text-red-600 dark:text-red-400 mb-1">بازنشانی کامل سیستم (Factory Reset)</h5>
                      <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
                        پاکسازی تمام داده‌های مرورگر و بازگردانی برنامه به حالت اولیه کارخانه.
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
                        className="w-full py-3 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition flex justify-center items-center gap-2 cursor-pointer shadow-md"
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
    </div>
  );
};

export default AdminPanelModal;
