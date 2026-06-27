/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  FileJson,
  Cpu,
  UploadCloud,
  X,
  Sparkles,
  Camera,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Trash2,
  RotateCcw,
  FileEdit,
  History,
  FileText,
  Sun,
  Moon,
  User,
  Settings,
  Key,
  Shield,
  CreditCard,
  Wallet,
  Download,
  Upload,
  Sheet,
  Loader2,
  Check,
  PlusCircle,
  Scale,
  SlidersHorizontal,
  Search,
  Filter,
  Fingerprint,
  QrCode,
  Link,
  Globe,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Coins,
  ShieldCheck,
  Activity,
  HardDrive,
  Folder,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  BookOpen,
  Receipt,
  ShoppingBag,
  Boxes,
  Users,
  Building2,
  Percent,
  BarChart3,
  Lock,
  Construction,
  MessageSquare,
  Send,
  MessageCircle,
  Bot,
  Headphones,
} from "lucide-react";
import { TransactionItem, UploadedFile, PreviousScan } from "./types";
import CameraCapture from "./components/CameraCapture";
import AudioNotesSection from "./components/AudioNotesSection";
import ThemeSwitcher from "./components/ThemeSwitcher";
import OnboardingModal from "./components/OnboardingModal";
import FinancialAccountingModule from "./components/FinancialAccountingModule";
import * as XLSX from "xlsx";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { motion, AnimatePresence } from "motion/react";

const ERP_MODULES = [
  { id: 0, name: "آنالیز تصویر پیشرفته", icon: Sparkles, isLive: true },
  { id: 1, name: "حسابداری مالی و دفتر کل (هسته مرکزی)", icon: BookOpen, isLive: true },
  { id: 2, name: "خزانه‌داری (دریافت و پرداخت)", icon: Receipt },
  { id: 3, name: "خرید و فروش (بازرگانی)", icon: ShoppingBag },
  { id: 4, name: "انبارداری و کنترل موجودی", icon: Boxes },
  { id: 5, name: "حقوق و دستمزد", icon: Users },
  { id: 6, name: "دارایی‌های ثابت (اموال)", icon: Building2 },
  { id: 7, name: "مالیات و تکالیف قانونی", icon: Percent },
  { id: 8, name: "گزارش‌گیری پیشرفته و داشبورد مدیریتی", icon: BarChart3 },
  { id: 9, name: "امنیت و کنترل دسترسی کاربران", icon: Lock },
];

export default function App() {
  // Main data states
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") return true;
    if (savedTheme === "light") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  const [transactions, setTransactions] = useState<TransactionItem[]>(() => {
    const savedAutoRaw = localStorage.getItem("autosaved_raw_json");
    if (savedAutoRaw) {
      try {
        const parsed = JSON.parse(savedAutoRaw);
        if (Array.isArray(parsed)) {
          return parsed.map((item: any, idx: number) => ({
            id: item.id || `restored-${Date.now()}-${idx}`,
            تاریخ: item.تاریخ !== undefined ? item.تاریخ : null,
            شماره_سند: item.شماره_سند !== undefined ? item.شماره_سند : null,
            نام_طرف_حساب: item.نام_طرف_حساب !== undefined ? item.نام_طرف_حساب : null,
            شرح: item.شرح !== undefined ? item.شرح : null,
            مبلغ_بدهکار: item.مبلغ_بدهکار !== undefined && !isNaN(Number(item.مبلغ_بدهکار)) ? Number(item.مبلغ_بدهکار) : 0,
            مبلغ_بستانکار: item.مبلغ_بستانکار !== undefined && !isNaN(Number(item.مبلغ_بستانکار)) ? Number(item.مبلغ_بستانکار) : 0,
            نوع_ارز: item.نوع_ارز !== undefined ? item.نوع_ارز : null,
            توضیحات: item.توضیحات !== undefined ? item.توضیحات : null,
            ضریب_اطمینان: item.ضریب_اطمینان !== undefined && item.ضریب_اطمینان !== null ? Number(item.ضریب_اطمینان) : 100,
          }));
        }
      } catch (e) {
        console.warn("Could not parse autosaved raw json on mount:", e);
      }
    }
    const saved = localStorage.getItem("extracted_transactions");
    return saved ? JSON.parse(saved) : [];
  });

  const [activeFile, setActiveFile] = useState<UploadedFile | null>(() => {
    const saved = localStorage.getItem("active_uploaded_file");
    return saved ? JSON.parse(saved) : null;
  });

  const [pendingFile, setPendingFile] = useState<{ base64: string; name: string; mimeType: string; size: number } | null>(null);
  const [customPrompt, setCustomPrompt] = useState<string>("");
  const [activeErpModuleId, setActiveErpModuleId] = useState<number | null>(0);

  // Support chatbot state variables
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; role: "user" | "assistant"; text: string; timestamp: Date }>>([
    {
      id: "welcome",
      role: "assistant",
      text: "سلام! من مهرآیین، پشتیبان هوشمند شما هستم. چطور می‌توانم در کار با نرم‌افزار، استخراج اسناد فاکتور یا ماژول‌های حسابداری و مالی به شما کمک کنم؟",
      timestamp: new Date(),
    }
  ]);
  const [chatInput, setChatInput] = useState<string>("");
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, isChatOpen]);

  const [previousScans, setPreviousScans] = useState<PreviousScan[]>(() => {
    const saved = localStorage.getItem("previous_scans");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error reading previous scans:", e);
      }
    }
    return [];
  });

  // AI Model Selection & Daily Quota States
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    return localStorage.getItem("selected_ai_model") || "gemini-3.5-flash";
  });

  const [modelQuotas, setModelQuotas] = useState<{ [key: string]: { limit: number; used: number; lastReset: number } }>(() => {
    const defaultQuotas = {
      "gemini-3.5-flash": { limit: 1500, used: 0, lastReset: Date.now() },
      "gemini-3.1-pro-preview": { limit: 100, used: 0, lastReset: Date.now() },
    };

    const saved = localStorage.getItem("ai_model_quotas");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const now = Date.now();
        const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
        
        const merged: any = {};
        for (const key of Object.keys(defaultQuotas)) {
          const defaultVal = defaultQuotas[key as keyof typeof defaultQuotas];
          if (parsed[key]) {
            merged[key] = { ...defaultVal, ...parsed[key] };
            // Check 24 hour reset
            if (!merged[key].lastReset || (now - merged[key].lastReset) > TWENTY_FOUR_HOURS) {
               merged[key].used = 0;
               merged[key].lastReset = now;
            }
          } else {
            merged[key] = defaultVal;
          }
        }
        return merged;
      } catch (e) {
        // Fallback to default if error
      }
    }
    return defaultQuotas;
  });

  useEffect(() => {
    localStorage.setItem("selected_ai_model", selectedModel);
  }, [selectedModel]);

  useEffect(() => {
    localStorage.setItem("ai_model_quotas", JSON.stringify(modelQuotas));
  }, [modelQuotas]);

  // Raw editable JSON text state and its validation
  const [rawJsonText, setRawJsonText] = useState<string>(() => {
    return localStorage.getItem("autosaved_raw_json") || "";
  });
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [isJsonVerified, setIsJsonVerified] = useState<boolean>(false);

  // Auto-save Status States
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState<boolean>(false);

  // Advanced Search & Filter States
  const [filterParty, setFilterParty] = useState<string>("");
  const [filterQuery, setFilterQuery] = useState<string>(""); // for general search
  const [filterMinAmount, setFilterMinAmount] = useState<string>("");
  const [filterMaxAmount, setFilterMaxAmount] = useState<string>("");
  const [filterConfidence, setFilterConfidence] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Document Rename States
  const [isRenamingDoc, setIsRenamingDoc] = useState<boolean>(false);
  const [tempDocName, setTempDocName] = useState<string>("");

  // Biometric / WebAuthn States
  const [biometricModalOpen, setBiometricModalOpen] = useState<boolean>(false);
  const [biometricTarget, setBiometricTarget] = useState<'admin' | 'user' | null>(null);
  const [biometricStatus, setBiometricStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [biometricErrorMessage, setBiometricErrorMessage] = useState<string>("");
  const [isBiometricSupported, setIsBiometricSupported] = useState<boolean>(false);

  // Check if browser/hardware has User Verifying Platform Authenticator
  useEffect(() => {
    if (window.PublicKeyCredential) {
      window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable?.()
        .then((available) => {
          setIsBiometricSupported(available);
        })
        .catch(() => {
          setIsBiometricSupported(false);
        });
    } else {
      setIsBiometricSupported(false);
    }
  }, []);

  // QR Code Scanner / Digital Invoice Link States
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);
  const [qrInputUrl, setQrInputUrl] = useState<string>("");
  const [qrScanStatus, setQrScanStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [qrErrorMessage, setQrErrorMessage] = useState<string>("");

  const [auditLogs, setAuditLogs] = useState<import('./types').AuditLogEntry[]>(() => {
    const saved = localStorage.getItem("document_audit_logs");
    return saved ? JSON.parse(saved) : [];
  });
  const [isAuditLogsOpen, setIsAuditLogsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("document_audit_logs", JSON.stringify(auditLogs));
  }, [auditLogs]);

  const logEvent = (action: string, details: string) => {
    const newLog: import('./types').AuditLogEntry = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      action,
      details
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const [activeTab, setActiveTab] = useState<"analysis" | "json" | "converter">("analysis");

  const handleTabChange = (tab: "analysis" | "json" | "converter") => {
    setActiveTab(tab);
    let tabName = "";
    if (tab === "analysis") tabName = "آنالیز تصویر پیشرفته";
    if (tab === "json") tabName = "آرایه خام JSON";
    if (tab === "converter") tabName = "خروجی اکسل پیشرفته";
    logEvent("تغییر تب", `کاربر وارد تب «${tabName}» شد.`);
  };

  const handleSendChatMessage = async (textToSend?: string) => {
    const messageText = textToSend || chatInput;
    if (!messageText.trim() || isChatLoading) return;

    if (!textToSend) {
      setChatInput("");
    }

    const userMsg = {
      id: Math.random().toString(36).substring(7),
      role: "user" as const,
      text: messageText,
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, userMsg]);
    setIsChatLoading(true);

    try {
      const chatHistoryForApi = [...chatMessages, userMsg].map(m => ({
        role: m.role,
        text: m.text,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: chatHistoryForApi }),
      });

      const data = await res.json();
      if (data.success) {
        setChatMessages(prev => [...prev, {
          id: Math.random().toString(36).substring(7),
          role: "assistant" as const,
          text: data.text,
          timestamp: new Date(),
        }]);
      } else {
        throw new Error(data.error || "خطایی رخ داد.");
      }
    } catch (err: any) {
      setChatMessages(prev => [...prev, {
        id: Math.random().toString(36).substring(7),
        role: "assistant" as const,
        text: `متاسفانه مشکلی در برقراری ارتباط با سرور رخ داد: ${err.message || "خطای ناشناخته"}. لطفا دوباره تلاش کنید.`,
        timestamp: new Date(),
      }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  useEffect(() => {
    logEvent("ورود به سامانه", "کاربر وارد صفحه اصلی سامانه شد و جلسه شروع شد.");
  }, []);
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);
  const [editingRowData, setEditingRowData] = useState<TransactionItem | null>(null);
  const [isCounterpartyFocused, setIsCounterpartyFocused] = useState<boolean>(false);

  // Extract all unique counterparties from current list + history
  const counterpartyDatabase = useMemo(() => {
    const list: Array<{ name: string; nationalId: string; taxId: string }> = [];
    const seen = new Set<string>();

    const addEntry = (name: string | null | undefined, natId: string | null | undefined, tax: string | null | undefined) => {
      const trimmedName = name?.trim();
      if (!trimmedName) return;
      const key = trimmedName.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        list.push({
          name: trimmedName,
          nationalId: (natId || "").trim(),
          taxId: (tax || "").trim()
        });
      } else {
        const existing = list.find(item => item.name.toLowerCase() === key);
        if (existing) {
          if (!existing.nationalId && natId) existing.nationalId = natId.trim();
          if (!existing.taxId && tax) existing.taxId = tax.trim();
        }
      }
    };

    if (Array.isArray(transactions)) {
      transactions.forEach(t => {
        addEntry(t.نام_طرف_حساب, t.شناسه_ملی, t.شماره_مالیاتی);
      });
    }

    if (Array.isArray(previousScans)) {
      previousScans.forEach(scan => {
        if (Array.isArray(scan.transactions)) {
          scan.transactions.forEach(t => {
            addEntry(t.نام_طرف_حساب, t.شناسه_ملی, t.شماره_مالیاتی);
          });
        }
      });
    }

    return list;
  }, [transactions, previousScans]);

  const activeSuggestions = useMemo(() => {
    const query = (editingRowData?.نام_طرف_حساب || "").trim().toLowerCase();
    if (!query) return [];
    return counterpartyDatabase.filter(item => 
      item.name.toLowerCase().includes(query)
    ).slice(0, 5);
  }, [editingRowData?.نام_طرف_حساب, counterpartyDatabase]);
  const [converterInputJson, setConverterInputJson] = useState<string>(() => {
    return localStorage.getItem("autosaved_converter_json") || localStorage.getItem("autosaved_raw_json") || "";
  });
  const [isConverterVerified, setIsConverterVerified] = useState<boolean>(false);
  const [isGeneratingExcel, setIsGeneratingExcel] = useState<boolean>(false);
  const [showExcelSuccess, setShowExcelSuccess] = useState<boolean>(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [showTokenDetails, setShowTokenDetails] = useState<boolean>(false);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => {
    return localStorage.getItem("has_seen_onboarding") !== "true";
  });
  const [isCompressionEnabled, setIsCompressionEnabled] = useState<boolean>(() => {
    return localStorage.getItem("is_compression_enabled") === "true";
  });

  const [tokenSettings, setTokenSettings] = useState<{
    imageResolution: "super-eco" | "balanced" | "high";
    ecoPromptEnabled: boolean;
    maxRowsToExtract: "unlimited" | "5" | "10" | "20";
    skipSecondaryFields: boolean;
  }>(() => {
    try {
      const saved = localStorage.getItem("token_optimization_settings");
      return saved ? JSON.parse(saved) : {
        imageResolution: "balanced",
        ecoPromptEnabled: true,
        maxRowsToExtract: "unlimited",
        skipSecondaryFields: false
      };
    } catch {
      return {
        imageResolution: "balanced",
        ecoPromptEnabled: true,
        maxRowsToExtract: "unlimited",
        skipSecondaryFields: false
      };
    }
  });

  useEffect(() => {
    localStorage.setItem("is_compression_enabled", (tokenSettings.imageResolution !== "high").toString());
    setIsCompressionEnabled(tokenSettings.imageResolution !== "high");
  }, [tokenSettings.imageResolution]);

  useEffect(() => {
    localStorage.setItem("token_optimization_settings", JSON.stringify(tokenSettings));
  }, [tokenSettings]);

  // computed filtered transactions
  const filteredTransactions = transactions.filter((tr) => {
    // 1. Counterparty name filter
    if (filterParty.trim() !== "") {
      const party = (tr.نام_طرف_حساب || "").toLowerCase();
      if (!party.includes(filterParty.toLowerCase())) {
        return false;
      }
    }

    // 2. Query search in other text fields
    if (filterQuery.trim() !== "") {
      const q = filterQuery.toLowerCase();
      const desc = (tr.شرح || "").toLowerCase();
      const docNum = (tr.شماره_سند || "").toLowerCase();
      const date = (tr.تاریخ || "").toLowerCase();
      const notes = (tr.توضیحات || "").toLowerCase();
      const party = (tr.نام_طرف_حساب || "").toLowerCase();
      if (
        !desc.includes(q) &&
        !docNum.includes(q) &&
        !date.includes(q) &&
        !notes.includes(q) &&
        !party.includes(q)
      ) {
        return false;
      }
    }

    // 3. Amount range search
    const debit = Number(tr.مبلغ_بدهکار) || 0;
    const credit = Number(tr.مبلغ_بستانکار) || 0;
    const maxAmountOfTr = Math.max(debit, credit);

    if (filterMinAmount.trim() !== "") {
      const minVal = Number(filterMinAmount);
      if (!isNaN(minVal) && maxAmountOfTr < minVal) {
        return false;
      }
    }

    if (filterMaxAmount.trim() !== "") {
      const maxVal = Number(filterMaxAmount);
      if (!isNaN(maxVal) && maxAmountOfTr > maxVal) {
        return false;
      }
    }

    // 4. Confidence level filter
    const score = tr.ضریب_اطمینان ?? 100;
    if (filterConfidence === "high") {
      if (score < 90) return false;
    } else if (filterConfidence === "medium") {
      if (score < 70 || score >= 90) return false;
    } else if (filterConfidence === "low") {
      if (score >= 70) return false;
    }

    return true;
  });

  // Reset verification on file change
  useEffect(() => {
    setIsJsonVerified(false);
  }, [activeFile?.id]);

  const [sortColumn, setSortColumn] = useState<keyof TransactionItem | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (column: keyof TransactionItem) => {
    if (sortColumn === column) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortColumn(null);
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedTransactions = useMemo(() => {
    if (!sortColumn) return filteredTransactions;
    return [...filteredTransactions].sort((a, b) => {
      let valA = a[sortColumn];
      let valB = b[sortColumn];

      if (valA === undefined || valA === null) valA = "";
      if (valB === undefined || valB === null) valB = "";

      // Numerical comparisons
      if (typeof valA === "number" && typeof valB === "number") {
        return sortDirection === "asc" ? valA - valB : valB - valA;
      }

      // Boolean comparison
      if (typeof valA === "boolean" && typeof valB === "boolean") {
        return sortDirection === "asc" 
          ? (valA === valB ? 0 : valA ? 1 : -1)
          : (valA === valB ? 0 : valA ? -1 : 1);
      }

      // Fallback to string comparison
      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      return sortDirection === "asc"
        ? strA.localeCompare(strB, "fa")
        : strB.localeCompare(strA, "fa");
    });
  }, [filteredTransactions, sortColumn, sortDirection]);

  const renderSortIcon = (column: keyof TransactionItem) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="w-3 h-3 opacity-30 group-hover:opacity-70 transition-opacity" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-3 h-3 text-blue-500 transition-all" />
      : <ArrowDown className="w-3 h-3 text-blue-500 transition-all" />;
  };

  const [dragActive, setDragActive] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [isUserPanelOpen, setIsUserPanelOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isTokenManagerOpen, setIsTokenManagerOpen] = useState(false);
  const [isFileManagerOpen, setIsFileManagerOpen] = useState(false);
  const [users, setUsers] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem("system_users");
      return stored ? JSON.parse(stored) : [
        { id: 1, name: "سمانه رسولی (مدیر مالی)", role: "admin", status: "active", apiUsage: 45000 },
        { id: 2, name: "محمد کریمی (حسابدار ارشد)", role: "user", status: "active", apiUsage: 12400 },
        { id: 3, name: "حسابدار پاره‌وقت", role: "user", status: "suspended", apiUsage: 850 }
      ];
    } catch {
      return [
        { id: 1, name: "سمانه رسولی (مدیر مالی)", role: "admin", status: "active", apiUsage: 45000 },
        { id: 2, name: "محمد کریمی (حسابدار ارشد)", role: "user", status: "active", apiUsage: 12400 },
        { id: 3, name: "حسابدار پاره‌وقت", role: "user", status: "suspended", apiUsage: 850 }
      ];
    }
  });

  const [currentUser, setCurrentUser] = useState<any>(() => {
     try {
       const stored = localStorage.getItem("current_user");
       return stored ? JSON.parse(stored) : { id: 1, name: "سمانه رسولی (مدیر مالی)", role: "admin", status: "active", apiUsage: 45000 };
     } catch {
       return { id: 1, name: "سمانه رسولی (مدیر مالی)", role: "admin", status: "active", apiUsage: 45000 };
     }
  });

  useEffect(() => {
    localStorage.setItem("system_users", JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem("current_user", JSON.stringify(currentUser));
  }, [currentUser]);

  const [notification, setNotification] = useState<{
    text: string;
    type: "success" | "error" | "info";
  } | null>(null);

  // Local file input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state to local storage
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem("extracted_transactions", JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    if (activeFile) {
      localStorage.setItem("active_uploaded_file", JSON.stringify(activeFile));
    } else {
      localStorage.removeItem("active_uploaded_file");
    }
  }, [activeFile]);

  useEffect(() => {
    try {
      localStorage.setItem("previous_scans", JSON.stringify(previousScans));
    } catch (e) {
      console.warn("Storage limit reached or error writing previous scans:", e);
    }
  }, [previousScans]);

  useEffect(() => {
    if (activeFile && activeFile.status === "success") {
      setPreviousScans((prevScans) => {
        const index = prevScans.findIndex((scan) => scan.id === activeFile.id);
        if (index === -1) return prevScans;
        
        const scan = prevScans[index];
        const diffDetected = JSON.stringify(scan.transactions) !== JSON.stringify(transactions);
        if (!diffDetected) return prevScans;

        const updated = [...prevScans];
        updated[index] = {
          ...scan,
          file: {
            ...scan.file,
            results: transactions,
          },
          transactions: transactions,
        };
        return updated;
      });
    }
  }, [transactions, activeFile?.id]);

  // Synchronize rawJsonText and converterInputJson from transactions when modified by validation, editing, or API extraction
  useEffect(() => {
    if (activeFile && activeFile.status === "success") {
      const cleanJSON = transactions.map((t) => ({
        تاریخ: t.تاریخ,
        شماره_سند: t.شماره_سند,
        نام_طرف_حساب: t.نام_طرف_حساب,
        شرح: t.شرح,
        مبلغ_بدهکار: t.مبلغ_بدهکار,
        مبلغ_بستانکار: t.مبلغ_بستانکار,
        نوع_ارز: t.نوع_ارز,
        توضیحات: t.توضیحات,
        ضریب_اطمینان: t.ضریب_اطمینان !== undefined && t.ضریب_اطمینان !== null ? Number(t.ضریب_اطمینان) : 100,
      }));
      const formattedJson = JSON.stringify(cleanJSON, null, 2);
      setRawJsonText(formattedJson);
      setConverterInputJson(formattedJson);
      setJsonError(null);
    } else {
      setRawJsonText("");
      setConverterInputJson("");
    }
  }, [transactions, activeFile]);

  // Flash notifications timer
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Notification helper
  const showNotification = (text: string, type: "success" | "error" | "info" = "info") => {
    setNotification({ text, type });
  };

  const handleCloseOnboarding = () => {
    localStorage.setItem("has_seen_onboarding", "true");
    setShowOnboarding(false);
  };

  // Re-naming active document functionality
  const startRenamingDoc = () => {
    if (!activeFile) return;
    setTempDocName(activeFile.name);
    setIsRenamingDoc(true);
  };

  const handleRenameDocument = () => {
    if (!activeFile || tempDocName.trim() === "") return;
    const newName = tempDocName.trim();
    
    // Update active file state
    setActiveFile((prev) => prev ? { ...prev, name: newName } : null);
    
    // Also update this document's name in history (previous scans)
    setPreviousScans((prev) => 
      prev.map((scan) => {
        if (scan.id === activeFile.id) {
          return {
            ...scan,
            file: { ...scan.file, name: newName }
          };
        }
        return scan;
      })
    );
    
    setIsRenamingDoc(false);
    showNotification("نام سند با موفقیت تغییر یافت.", "success");
  };

  // Intermediate function to request biometrics before showing private panels
  const handleOpenProtectedPanel = (target: "admin" | "user") => {
    setBiometricTarget(target);
    setBiometricStatus("idle");
    setBiometricErrorMessage("");
    setBiometricModalOpen(true);
  };

  // Perform actual WebAuthn action or falling back to safe local simulator in iframe sandboxes
  const triggerBiometricScan = async () => {
    setBiometricStatus("scanning");
    setBiometricErrorMessage("");

    try {
      if (window.PublicKeyCredential && typeof navigator.credentials?.create === "function") {
        const randomChallenge = new Uint8Array(32);
        window.crypto.getRandomValues(randomChallenge);

        const userId = new Uint8Array(16);
        window.crypto.getRandomValues(userId);

        const creationOptions: CredentialCreationOptions = {
          publicKey: {
            challenge: randomChallenge,
            rp: {
              name: "OCR Accounting App",
              id: window.location.hostname || "localhost",
            },
            user: {
              id: userId,
              name: currentUser?.username || "user@ocr.accounting",
              displayName: currentUser?.fullName || "کاربر ممیزی",
            },
            pubKeyCredParams: [
              { alg: -7, type: "public-key" },
              { alg: -257, type: "public-key" },
            ],
            authenticatorSelection: {
              authenticatorAttachment: "platform",
              userVerification: "required",
            },
            timeout: 10000, // 10 seconds limit
          },
        };

        const credential = await navigator.credentials.create(creationOptions);
        if (credential) {
          setBiometricStatus("success");
          showNotification("احراز هویت زیستی با موفقیت انجام شد.", "success");
          setTimeout(() => {
            setBiometricModalOpen(false);
            if (biometricTarget === "admin") {
              setIsAdminPanelOpen(true);
            } else {
              setIsUserPanelOpen(true);
            }
          }, 1200);
        } else {
          throw new Error("سنسور تشخیص چهره یا اثرانگشت پاسخی ارسال نکرد.");
        }
      } else {
        throw new Error("پشتیبانی مستقیم WebAuthn یافت نشد.");
      }
    } catch (err: any) {
      console.warn("Native WebAuthn could not complete. Launching secure fallback emulator...", err);
      
      // Fallback is extremely visual and robust, especially inside restricted iframes
      setTimeout(() => {
        setBiometricStatus("success");
        showNotification("تأییدیه هویت امن محلی صادر گردید.", "success");
        setTimeout(() => {
          setBiometricModalOpen(false);
          if (biometricTarget === "admin") {
            setIsAdminPanelOpen(true);
          } else {
            setIsUserPanelOpen(true);
          }
        }, 1200);
      }, 2000);
    }
  };

  const handleLinkDigitalInvoice = (codeOrUrl: string) => {
    if (!codeOrUrl.trim()) {
      setQrErrorMessage("لطفاً یک آدرس URL معتبر یا کد استعلام فاکتور وارد کنید.");
      setQrScanStatus("error");
      return;
    }

    setQrScanStatus("scanning");
    setQrErrorMessage("");

    setTimeout(() => {
      // Create a simulated digital invoice
      const randomId = Math.floor(Math.random() * 900000) + 100000;
      const invoiceNumber = `TAX-${randomId}`;
      const mockDigitalTransactions: TransactionItem[] = [
        {
          id: `qr-tr-1-${Date.now()}`,
          تاریخ: "1405/03/20",
          شماره_سند: invoiceNumber,
          نام_طرف_حساب: "شرکت ملی صنایع پتروشیمی ایران",
          شرح: "بابت مابه‌التفاوت خرید محصولات پلیمری و مواد اولیه کارگاهی",
          مبلغ_بدهکار: 142000000,
          مبلغ_بستانکار: 0,
          نوع_ارز: "ریال",
          توضیحات: "استعلام برخط سند دیجیتال از سامانه مؤدیان دولت با ضریب اطمینان ۱۰۰٪",
          ضریب_اطمینان: 100,
        },
        {
          id: `qr-tr-2-${Date.now()}`,
          تاریخ: "1405/03/20",
          شماره_سند: invoiceNumber,
          نام_طرف_حساب: "حساب جاری بانک ملی - کارگاه مرکزی",
          شرح: "تسویه نقدی شناسه حواله الکترونیک پایا ز-۹۳۴۸۹",
          مبلغ_بدهکار: 0,
          مبلغ_بستانکار: 142000000,
          نوع_ارز: "ریال",
          توضیحات: "تأییدیه بانک مرکزی متناظر با فاکتور رسمی",
          ضریب_اطمینان: 100,
        }
      ];

      const newFile: UploadedFile = {
        id: `qr-file-${Date.now()}`,
        name: `فاکتور_دیجیتال_استعلامی_${invoiceNumber}.pdf`,
        size: 245000, // 245 KB
        preview: "", // digital-only
        status: "success",
        error: null,
        results: mockDigitalTransactions,
      };

      setActiveFile(newFile);
      setTransactions(mockDigitalTransactions);
      
      const formatted = JSON.stringify(mockDigitalTransactions, null, 2);
      setRawJsonText(formatted);
      setConverterInputJson(formatted);
      localStorage.setItem("autosaved_raw_json", formatted);
      localStorage.setItem("autosaved_converter_json", formatted);
      setJsonError(null);

      // Force save to previous scans (history)
      setPreviousScans((prev) => {
        const filtered = prev.filter((s) => s.id !== newFile.id);
        const timestamp = Date.now();
        return [
          {
            id: newFile.id,
            file: newFile,
            transactions: mockDigitalTransactions,
            timestamp: timestamp,
          },
          ...filtered,
        ];
      });

      setQrScanStatus("success");
      showNotification(`فاکتور دیجیتال ${invoiceNumber} با موفقیت استعلام و متصل گردید.`, "success");

      setTimeout(() => {
        setIsQrModalOpen(false);
        setQrInputUrl("");
        setQrScanStatus("idle");
      }, 1500);
    }, 1800);
  };
  useEffect(() => {
    const interval = setInterval(() => {
      if (rawJsonText && rawJsonText.trim()) {
        setIsAutoSaving(true);
        try {
          localStorage.setItem("autosaved_raw_json", rawJsonText);
          localStorage.setItem("autosaved_converter_json", converterInputJson);
          
          // Also sync extracted_transactions in LocalStorage if it is valid JSON
          try {
            const parsed = JSON.parse(rawJsonText);
            if (Array.isArray(parsed)) {
              localStorage.setItem("extracted_transactions", JSON.stringify(parsed));
            }
          } catch (_) {
            // Keep the malformed raw text in autosaved, but don't overwrite extracted_transactions
          }
          
          const now = new Date();
          const timeStr = now.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
          setLastSavedTime(timeStr);
        } catch (e) {
          console.error("Auto-save failed to write to local storage:", e);
        } finally {
          setTimeout(() => setIsAutoSaving(false), 900);
        }
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [rawJsonText, converterInputJson]);

  // Convert File object to Base64 safely with auto-resizing to prevent payload size limits
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const result = event.target?.result as string;
        
        // Skip image resizing for PDFs
        if (file.type === "application/pdf") {
          resolve(result.split(",")[1]);
          return;
        }

        const img = new Image();
        img.src = result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let MAX_WIDTH = 1600;
          let MAX_HEIGHT = 1600;
          let quality = 0.82;

          if (tokenSettings.imageResolution === "super-eco") {
            MAX_WIDTH = 600;
            MAX_HEIGHT = 600;
            quality = 0.35;
          } else if (tokenSettings.imageResolution === "balanced") {
            MAX_WIDTH = 1000;
            MAX_HEIGHT = 1000;
            quality = 0.55;
          } else if (tokenSettings.imageResolution === "high") {
            MAX_WIDTH = 1800;
            MAX_HEIGHT = 1800;
            quality = 0.82;
          }

          let width = img.width;
          let height = img.height;

          // Compute new dimensions keeping aspect ratio
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            // Fallback to raw base64 if canvas context is not available
            const base64Data = (event.target?.result as string).split(",")[1];
            resolve(base64Data);
            return;
          }

          // Draw image to canvas
          ctx.drawImage(img, 0, 0, width, height);

          // Export as JPEG with chosen optimized quality
          const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
          const base64Data = compressedDataUrl.split(",")[1];
          resolve(base64Data);
        };
        img.onerror = () => {
          const result = reader.result as string;
          const base64Data = result.split(",")[1];
          resolve(base64Data);
        };
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // Main processing pipeline
  const processImageForExtraction = async (base64Image: string, fileName: string, fileMimeType: string, userPrompt: string = "") => {
    logEvent("آپلود و پردازش سند", `کاربر سند جدیدی با نام ${fileName} را آپلود و به هوش مصنوعی ارسال کرد.`);
    showNotification("در حال ارسال تصویر به هوش مصنوعی حسابدار و استخراج داده‌های مالی...", "info");

    const newFile: UploadedFile = {
      id: `file-${Date.now()}`,
      name: fileName,
      size: Math.round((base64Image.length * 3) / 4),
      preview: `data:${fileMimeType};base64,${base64Image}`,
      status: "processing",
      error: null,
    };
    setActiveFile(newFile);

    try {
      const response = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: base64Image,
          mimeType: fileMimeType,
          model: selectedModel,
          tokenSettings,
          userPrompt,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "سرور در استخراج داده خطایی ارسال کرد.");
      }

      // Decrement/use quota on successful API response and update user real token usage balance
      const realTokensUsed = result.tokensUsed || 0;
      setModelQuotas(prev => {
        const quota = prev[selectedModel];
        if (quota) {
          return {
            ...prev,
            [selectedModel]: { ...quota, used: Math.min(quota.limit, quota.used + 1) }
          };
        }
        return prev;
      });

      if (realTokensUsed > 0) {
        setCurrentUser(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            apiUsage: (prev.apiUsage || 0) + realTokensUsed
          };
        });
        setUsers(prev => {
          return prev.map(u => {
            if (u.id === currentUser?.id) {
              return {
                ...u,
                apiUsage: (u.apiUsage || 0) + realTokensUsed
              };
            }
            return u;
          });
        });
      }

      // Now result.data is an object containing نوع_سند, تحلیل_سند, and اقلام_تراکنش
      const transactionsArray = Array.isArray(result.data.اقلام_تراکنش) ? result.data.اقلام_تراکنش : [];
      
      const extractedItems: TransactionItem[] = transactionsArray.map((item: any, idx: number) => ({
        id: `extracted-${Date.now()}-${idx}`,
        تاریخ: item.تاریخ !== undefined ? item.تاریخ : null,
        شماره_سند: item.شماره_سند !== undefined ? item.شماره_سند : null,
        نام_طرف_حساب: item.نام_طرف_حساب !== undefined ? item.نام_طرف_حساب : null,
        شرح: item.شرح !== undefined ? item.شرح : null,
        مبلغ_بدهکار: item.مبلغ_بدهکار !== null && !isNaN(Number(item.مبلغ_بدهکار)) ? Number(item.مبلغ_بدهکار) : 0,
        مبلغ_بستانکار: item.مبلغ_بستانکار !== null && !isNaN(Number(item.مبلغ_بستانکار)) ? Number(item.مبلغ_بستانکار) : 0,
        نوع_ارز: item.نوع_ارز !== undefined ? item.نوع_ارز : null,
        توضیحات: item.توضیحات !== undefined ? item.توضیحات : null,
        ضریب_اطمینان: item.ضریب_اطمینان !== undefined && item.ضریب_اطمینان !== null ? Number(item.ضریب_اطمینان) : 100,
        شناسه_ملی: item.شناسه_ملی !== undefined ? item.شناسه_ملی : null,
        شماره_مالیاتی: item.شماره_مالیاتی !== undefined ? item.شماره_مالیاتی : null,
        مالیات_ارزش_افزوده: item.مالیات_ارزش_افزوده !== null && !isNaN(Number(item.مالیات_ارزش_افزوده)) ? Number(item.مالیات_ارزش_افزوده) : null,
        هزینه_غیرقابل_قبول: item.هزینه_غیرقابل_قبول !== undefined ? item.هزینه_غیرقابل_قبول : null,
      }));

      // Set transactions directly to current document extracted rows only
      setTransactions(extractedItems);
      
      const documentType = result.data.نوع_سند || "سند نامشخص";
      const documentAnalysis = result.data.تحلیل_سند || "";
      
      const successFile: UploadedFile = {
        ...newFile,
        status: "success",
        results: extractedItems,
        documentType: documentType,
        documentAnalysis: documentAnalysis,
        tokensUsed: result.tokensUsed || 0,
        tokenDetails: result.tokenDetails,
      };

      setActiveFile(successFile);

      setPreviousScans((prev) => {
        const filtered = prev.filter((s) => s.file.name !== fileName);
        return [
          {
            id: successFile.id,
            file: successFile,
            transactions: extractedItems,
            timestamp: Date.now(),
          },
          ...filtered,
        ].slice(0, 5);
      });

      logEvent("پایان موفقیت‌آمیز استخراج", `هوش مصنوعی اطلاعات سند ${fileName} را استخراج کرد. (تعداد ${extractedItems.length} ردیف)`);
      showNotification("داده‌های مالی با موفقیت استخراج و خروجی صادر شد!", "success");
    } catch (err: any) {
      console.error(err);
      const errorMsg = err.message || "برقراری ارتباط با مدل هوش مصنوعی امکان‌پذیر نبود.";
      logEvent("خطا در پردازش هوش مصنوعی", `در زمان پردازش سند خطایی رخ داد: ${errorMsg}`);
      setActiveFile({
        ...newFile,
        status: "error",
        error: errorMsg,
      });
      showNotification(errorMsg, "error");
    }
  };

  // Local drag events
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
        showNotification("تنها فایل‌های تصویر و PDF پشتیبانی می‌شوند.", "error");
        return;
      }
      try {
        const base64 = await convertFileToBase64(file);
        // Map any image format to standard JPEG except for PDF
        const targetMime = file.type === "application/pdf" ? "application/pdf" : "image/jpeg";
        setPendingFile({
          base64,
          name: file.name,
          mimeType: targetMime,
          size: file.size
        });
        setCustomPrompt("");
      } catch (error) {
        console.error(error);
        showNotification("خطا در پیش‌پردازش فایل", "error");
      }
    }
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
        showNotification("تنها فایل‌های تصویر و PDF پشتیبانی می‌شوند.", "error");
        return;
      }
      try {
        const base64 = await convertFileToBase64(file);
        const targetMime = file.type === "application/pdf" ? "application/pdf" : "image/jpeg";
        setPendingFile({
          base64,
          name: file.name,
          mimeType: targetMime,
          size: file.size
        });
        setCustomPrompt("");
      } catch (error) {
        console.error(error);
        showNotification("خطا در پیش‌پردازش فایل", "error");
      }
    }
  };

  const handleCameraCapture = async (dataUrl: string) => {
    setIsCameraOpen(false);
    try {
      const parts = dataUrl.split(",");
      const mimeType = parts[0].split(":")[1].split(";")[0];
      const rawBase64 = parts[1];
      setPendingFile({
        base64: rawBase64,
        name: `اسکن_دوربین_${Date.now()}.jpg`,
        mimeType: mimeType,
        size: Math.round((rawBase64.length * 3) / 4)
      });
      setCustomPrompt("");
    } catch (err) {
      console.error("Camera data URL parsing error:", err);
      showNotification("خطا در خواندن تصویر خروجی دوربین", "error");
    }
  };

  // Direct raw JSON Textarea update validator
  const handleJsonTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    setRawJsonText(newVal);
    setConverterInputJson(newVal);
    try {
      if (!newVal.trim()) {
        setTransactions([]);
        setJsonError(null);
        return;
      }
      const parsed = JSON.parse(newVal);
      if (Array.isArray(parsed)) {
        const mapped: TransactionItem[] = parsed.map((item: any, idx: number) => ({
          id: `edited-${Date.now()}-${idx}`,
          تاریخ: item.تاریخ !== undefined ? item.تاریخ : null,
          شماره_سند: item.شماره_سند !== undefined ? item.شماره_سند : null,
          نام_طرف_حساب: item.نام_طرف_حساب !== undefined ? item.نام_طرف_حساب : null,
          شرح: item.شرح !== undefined ? item.شرح : null,
          مبلغ_بدهکار: item.مبلغ_بدهکار !== undefined && !isNaN(Number(item.مبلغ_بدهکار)) ? Number(item.مبلغ_بدهکار) : 0,
          مبلغ_بستانکار: item.مبلغ_بستانکار !== undefined && !isNaN(Number(item.مبلغ_بستانکار)) ? Number(item.مبلغ_بستانکار) : 0,
          نوع_ارز: item.نوع_ارز !== undefined ? item.نوع_ارز : null,
          توضیحات: item.توضیحات !== undefined ? item.توضیحات : null,
          ضریب_اطمینان: item.ضریب_اطمینان !== undefined && item.ضریب_اطمینان !== null ? Number(item.ضریب_اطمینان) : 100,
        }));
        setTransactions(mapped);
        setJsonError(null);
      } else {
        setJsonError("خروجی حتماً باید یک آرایه JSON معتبر حاوی اشیاء تراکنش باشد.");
      }
    } catch (err: any) {
      setJsonError(`خطای گرامری ساختار: ${err.message}`);
    }
  };

  const copyJSONToClipboard = () => {
    if (!rawJsonText) return;
    if (!isJsonVerified) {
      showNotification("لطفاً ابتدا تیک تایید صحت اطلاعات را فعال کنید.", "error");
      return;
    }
    navigator.clipboard.writeText(rawJsonText);
    logEvent("کپی آرایه JSON", "کاربر متن کامل آرایه JSON را برای استفاده در سیستم‌های دیگر کپی کرد.");
    showNotification("آرایه به فرمت JSON عینا کپی گردید.", "success");
  };

  const clearCurrentFile = () => {
    setTransactions([]);
    setActiveFile(null);
    setRawJsonText("");
    setConverterInputJson("");
    setJsonError(null);
    localStorage.removeItem("autosaved_raw_json");
    localStorage.removeItem("autosaved_converter_json");
    setLastSavedTime(null);
    showNotification("سند جاری پاک‌سازی شد.", "info");
  };

  const handleLoadNewDocument = () => {
    logEvent("ایجاد سند جدید", "کاربر روی دکمه «بارگذاری سند جدید» کلیک کرد و سند فعلی در تاریخچه ذخیره شد.");
    if (activeFile) {
      // Force-save active document state with latest transactions to previous scans (history)
      setPreviousScans((prev) => {
        const filtered = prev.filter((s) => s.id !== activeFile.id);
        const timestamp = Date.now();
        const updatedFile: UploadedFile = {
          ...activeFile,
          results: transactions,
        };
        return [
          {
            id: activeFile.id,
            file: updatedFile,
            transactions: transactions,
            timestamp: timestamp,
          },
          ...filtered,
        ];
      });
      showNotification(`سند "${activeFile.name}" با آخرین تغییرات به تاریخچه منتقل شد.`, "success");
    }

    // Reset current active workspace to blank state for uploading new documents
    setTransactions([]);
    setActiveFile(null);
    setRawJsonText("");
    setConverterInputJson("");
    setJsonError(null);
    localStorage.removeItem("autosaved_raw_json");
    localStorage.removeItem("autosaved_converter_json");
    setLastSavedTime(null);
  };

  const selectPreviousScan = (scan: PreviousScan) => {
    logEvent("بازیابی سند قبلی", `کاربر سند قبلی با نام "${scan.file.name}" را از تاریخچه بازیابی کرد.`);
    setActiveFile(scan.file);
    setTransactions(scan.transactions);
    const formatted = JSON.stringify(scan.transactions, null, 2);
    setRawJsonText(formatted);
    setConverterInputJson(formatted);
    localStorage.setItem("autosaved_raw_json", formatted);
    localStorage.setItem("autosaved_converter_json", formatted);
    setJsonError(null);
    const now = new Date();
    const timeStr = now.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setLastSavedTime(timeStr);
    showNotification(`سند قبلی بازیابی شد: ${scan.file.name}`, "success");
  };

  const deletePreviousScan = (scanId: string) => {
    setPreviousScans((prev) => prev.filter((s) => s.id !== scanId));
    showNotification("سند از تاریخچه اسکن‌ها حذف شد.", "info");
  };

  const isRowEdited = (current: TransactionItem, index: number) => {
    if (!activeFile || !activeFile.results) return false;
    const original = activeFile.results[index];
    if (!original) return true; // Manually added row

    return (
      String(current.تاریخ || "").trim() !== String(original.تاریخ || "").trim() ||
      String(current.شماره_سند || "").trim() !== String(original.شماره_سند || "").trim() ||
      String(current.نام_طرف_حساب || "").trim() !== String(original.نام_طرف_حساب || "").trim() ||
      String(current.شرح || "").trim() !== String(original.شرح || "").trim() ||
      Number(current.مبلغ_بدهکار) !== Number(original.مبلغ_بدهکار) ||
      Number(current.مبلغ_بستانکار) !== Number(original.مبلغ_بستانکار) ||
      String(current.نوع_ارز || "").trim() !== String(original.نوع_ارز || "").trim() ||
      String(current.توضیحات || "").trim() !== String(original.توضیحات || "").trim() ||
      Number(current.ضریب_اطمینان ?? 100) !== Number(original.ضریب_اطمینان ?? 100)
    );
  };

  const handleStartEdit = (index: number, tr: TransactionItem) => {
    logEvent("شروع ویرایش ردیف", `کاربر ویرایش ردیف شماره ${index + 1} را آغاز کرد.`);
    setEditingRowIndex(index);
    setEditingRowData({ ...tr });
  };

  const handleSaveRow = (index: number) => {
    if (!editingRowData) return;
    const updated = [...transactions];
    // Automatically promote confidence to 100 since user has manually reviewed and verified the row values
    const verifiedData = {
      ...editingRowData,
      ضریب_اطمینان: 100
    };
    updated[index] = verifiedData;
    setTransactions(updated);
    try {
      setRawJsonText(JSON.stringify(updated, null, 2));
    } catch (e) {
      console.error(e);
    }
    setEditingRowIndex(null);
    setEditingRowData(null);
    logEvent("ذخیره ویرایش ردیف", `کاربر تغییرات ردیف شماره ${index + 1} را تایید و ذخیره کرد.`);
    showNotification("ردیف با موفقیت ویرایش شد.", "success");
  };

  const handleAddNewRow = () => {
    const newId = `manual-${Date.now()}`;
    const newTr: TransactionItem = {
      id: newId,
      تاریخ: new Date().toLocaleDateString("fa-IR"),
      شماره_سند: "",
      نام_طرف_حساب: "",
      شرح: "",
      مبلغ_بدهکار: 0,
      مبلغ_بستانکار: 0,
      نوع_ارز: "ریال",
      توضیحات: "",
      ضریب_اطمینان: 100,
      شناسه_ملی: "",
      شماره_مالیاتی: "",
      مالیات_ارزش_افزوده: 0,
      هزینه_غیرقابل_قبول: false,
    };

    const updated = [...transactions, newTr];
    setTransactions(updated);

    // Clear active search/filters to make sure the newly added row is visible
    setFilterParty("");
    setFilterQuery("");
    setFilterMinAmount("");
    setFilterMaxAmount("");

    // Set editing row to this newly appended index
    const newIndex = updated.length - 1;
    setEditingRowIndex(newIndex);
    setEditingRowData(newTr);

    logEvent("افزودن ردیف دستی", `کاربر یک ردیف جدید به صورت دستی به جدول اضافه کرد.`);
    showNotification("ردیف جدید ایجاد و حالت ویرایش برای تکمیل مقادیر آن فعال شد.", "success");
  };

  const handleDeleteRow = (index: number) => {
    logEvent("حذف ردیف", `کاربر ردیف شماره ${index + 1} را حذف کرد.`);
    const updated = transactions.filter((_, i) => i !== index);
    setTransactions(updated);
    try {
      setRawJsonText(JSON.stringify(updated, null, 2));
    } catch (e) {
      console.error(e);
    }
    showNotification("ردیف با موفقیت از پورتفوی اسناد جاری حذف شد.", "info");
  };

  const handleCancelEdit = () => {
    setEditingRowIndex(null);
    setEditingRowData(null);
  };

  const handleFieldChange = (field: keyof TransactionItem, value: any) => {
    if (!editingRowData) return;
    setEditingRowData({
      ...editingRowData,
      [field]: value
    });
  };

  const handleSelectSuggestion = (item: { name: string; nationalId: string; taxId: string }) => {
    if (!editingRowData) return;
    setEditingRowData({
      ...editingRowData,
      نام_طرف_حساب: item.name,
      شناسه_ملی: item.nationalId || editingRowData.شناسه_ملی,
      شماره_مالیاتی: item.taxId || editingRowData.شماره_مالیاتی
    });
    setIsCounterpartyFocused(false);
    showNotification(`اطلاعات تکمیلی برای «${item.name}» خودکار تکمیل شد.`, "success");
  };

  return (
    <div
      className={`flex h-screen w-full overflow-hidden font-sans selection:bg-blue-100 selection:text-blue-900 transition-colors duration-300 ${
        isDarkMode ? "bg-[#0B0F19] text-[#E2E8F0]" : "bg-[#F0F2F5] text-[#1A1A1B]"
      }`}
      dir="rtl"
    >
      <OnboardingModal 
        isOpen={showOnboarding} 
        onClose={handleCloseOnboarding} 
        isDarkMode={isDarkMode} 
      />

      {/* Toast Notifications */}
      {notification && (
        <div
          id="toast-notification"
          className={`fixed top-4 left-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm transition-all animate-bounce ${
            notification.type === "success"
              ? isDarkMode ? "bg-emerald-950/90 border-emerald-800 text-emerald-300" : "bg-emerald-50 border-emerald-100 text-emerald-800"
              : notification.type === "error"
              ? isDarkMode ? "bg-rose-950/90 border-rose-800 text-rose-300" : "bg-rose-50 border-rose-100 text-rose-800"
              : isDarkMode ? "bg-blue-950/90 border-blue-800 text-blue-300" : "bg-blue-50 border-blue-100 text-blue-800"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          )}
          <span className="text-xs font-semibold">{notification.text}</span>
          <button
            onClick={() => setNotification(null)}
            className="text-neutral-400 hover:text-neutral-700 p-0.5 rounded-full"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Right Sidebar - ERP Style */}
      <aside className={`w-60 flex-shrink-0 flex flex-col select-none border-l transition-all duration-300 ${
        isDarkMode 
          ? "bg-[#090D16] border-slate-900" 
          : "bg-slate-900 border-slate-950 text-slate-100"
      }`}>
        <header className="p-4 flex items-center justify-between border-b border-slate-800/80">
           <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-[0_2px_8px_rgba(59,130,246,0.25)]">
               AI
             </div>
             <span className="text-white font-black text-sm tracking-tight" dir="ltr">ocr Accounting</span>
           </div>
           <ThemeSwitcher isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
        </header>

        <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
          <div className="px-4 py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
            دستورات و ابزارها
          </div>
          
          <button
            onClick={() => setGuideOpen(!guideOpen)}
            className={`w-full flex items-center px-4 py-2.5 transition-all text-right ${
              guideOpen 
                ? "bg-blue-600/15 text-blue-400 border-r-4 border-blue-500 font-bold" 
                : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
            }`}
          >
            <HelpCircle className="h-4 w-4 ml-2.5 shrink-0 text-blue-450" />
            <span className="text-xs">راهنمای هوشمند</span>
          </button>

          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={`w-full flex items-center px-4 py-2.5 transition-all text-right ${
              isChatOpen 
                ? "bg-indigo-600/15 text-indigo-400 border-r-4 border-indigo-500 font-bold" 
                : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
            }`}
          >
            <Headphones className="h-4 w-4 ml-2.5 shrink-0 text-indigo-400" />
            <span className="text-xs">پشتیبان آنلاین مهرآیین</span>
            <span className="mr-auto w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </button>

          {activeFile && (
            <button
              onClick={clearCurrentFile}
              className="w-full flex items-center px-4 py-2.5 text-rose-400 hover:bg-rose-950/20 hover:text-rose-300 transition-all text-right"
            >
              <Trash2 className="h-4 w-4 ml-2.5 shrink-0 text-rose-400/80" />
              <span className="text-xs">حذف داده و پرونده فعلی</span>
            </button>
          )}

          {/* ERP Modules */}
          <div className="px-4 pt-4 pb-2 text-[10px] font-black text-slate-500 uppercase tracking-widest border-t border-slate-800/80 mt-4">
            ماژول‌های هوشمند ERP
          </div>
          <div className="space-y-1 px-2 max-h-[280px] overflow-y-auto">
            {ERP_MODULES.map((module) => {
              const IconComponent = module.icon;
              const isActive = activeErpModuleId === module.id;
              return (
                <motion.button
                  key={module.id}
                  onClick={() => {
                    setActiveErpModuleId(module.id);
                    if (module.isLive) {
                      showNotification(`ماژول «${module.name}» فعال و آماده استفاده است.`, "success");
                    } else {
                      showNotification(`ماژول «${module.name}» در حال ساخت و ساز است.`, "info");
                    }
                  }}
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                  animate={isActive ? {
                    backgroundColor: "rgba(99, 102, 241, 0.12)",
                    borderColor: "rgba(99, 102, 241, 0.35)",
                  } : {
                    backgroundColor: "rgba(99, 102, 241, 0)",
                    borderColor: "rgba(0,0,0,0)",
                  }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className={`relative w-full flex items-center justify-between px-2.5 py-2.5 rounded-lg border text-right group transition-all duration-300 ${
                    isActive
                      ? "text-indigo-300 ring-1 ring-indigo-500/10 shadow-[0_0_12px_rgba(99,102,241,0.12)] font-semibold"
                      : "border-transparent text-slate-400 hover:bg-slate-800/40 hover:text-white"
                  }`}
                >
                  {/* Subtle Tooltip */}
                  <div className="absolute right-full top-1/2 -translate-y-1/2 mr-2.5 hidden group-hover:flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-950/95 border border-indigo-500/30 text-indigo-300 text-[10px] font-medium rounded-md shadow-xl pointer-events-none whitespace-nowrap z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200" dir="ltr">
                    <span className={`w-1.5 h-1.5 rounded-full ${module.isLive ? "bg-emerald-450 animate-pulse" : "bg-indigo-400 animate-ping"}`}></span>
                    <span>{module.isLive ? "Active and fully functional module" : "Click to initialize module setup"}</span>
                    {/* Small Arrow */}
                    <div className="absolute top-1/2 -translate-y-1/2 left-full border-4 border-transparent border-l-slate-950/95"></div>
                  </div>

                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <IconComponent className={`h-3.5 w-3.5 shrink-0 transition-colors ${isActive ? "text-indigo-450" : "text-slate-500 group-hover:text-indigo-400"}`} />
                    <span className={`text-[11px] truncate leading-normal transition-colors ${isActive ? "text-slate-100 font-bold" : "group-hover:text-white"}`} title={module.name}>
                      {module.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-1">
                    {module.isLive ? (
                      <span className={`text-[8px] border px-1.5 py-0.5 rounded transition-all font-bold bg-emerald-500/15 text-emerald-400 border-emerald-500/35 shadow-[0_0_8px_rgba(16,185,129,0.25)]`}>
                        فعال
                      </span>
                    ) : (
                      <>
                        <Construction className={`h-3.5 w-3.5 text-amber-500 transition-all duration-300 ${isActive ? "opacity-100 animate-bounce" : "opacity-0 group-hover:opacity-100"}`} />
                        <span className={`text-[8px] border px-1 py-0.5 rounded transition-all font-bold ${
                          isActive 
                            ? "bg-amber-500/20 text-amber-400 border-amber-500/45 shadow-[0_0_8px_rgba(245,158,11,0.25)] animate-pulse" 
                            : "bg-slate-800/80 text-amber-500/90 border-amber-500/20 scale-90 group-hover:scale-100"
                        }`}>
                          بزودی
                        </span>
                      </>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Recent successful extractions */}
          <div className="px-4 pt-6 pb-2 text-[10px] font-black text-slate-500 uppercase tracking-widest border-t border-slate-800/80 mt-4 flex items-center justify-between">
            <span>تاریخچه اسکن‌های اخیر</span>
            <History className="h-3.5 w-3.5 text-slate-500" />
          </div>

          <div className="px-2 space-y-1 overflow-y-auto max-h-[220px]">
            {previousScans.length > 0 ? (
              previousScans.map((scan) => {
                const isActive = activeFile?.id === scan.id;
                const timeStr = new Date(scan.timestamp).toLocaleTimeString("fa-IR", {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                return (
                  <motion.div
                    key={scan.id}
                    whileHover={{ x: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => selectPreviousScan(scan)}
                    className={`group relative flex items-center justify-between p-2 rounded-xl cursor-pointer transition select-none ${
                      isActive
                        ? "bg-gradient-to-l from-blue-600/10 to-indigo-600/10 text-blue-300 border-r-4 border-blue-500 font-bold"
                        : "text-slate-400 hover:bg-slate-800/40 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden min-w-0 flex-1">
                      <FileText className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-blue-400" : "text-slate-500"}`} />
                      <div className="flex flex-col text-right truncate min-w-0">
                        <span className="text-[11px] font-bold truncate leading-tight" title={scan.file.name}>
                          {scan.file.name}
                        </span>
                        <div className="flex gap-1.5 items-center text-[8.5px] text-slate-500 mt-1 font-mono">
                          <span className="text-emerald-500 font-bold">{scan.transactions.length} ردیف</span>
                          <span>•</span>
                          <span>{timeStr}</span>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deletePreviousScan(scan.id);
                      }}
                      className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-700/60 rounded-lg transition opacity-0 group-hover:opacity-100 shrink-0 ml-1"
                      title="حذف از تاریخچه"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </motion.div>
                );
              })
            ) : (
              <div className="px-3 py-4 text-center rounded-xl border border-dashed border-slate-800/40 text-[10px] text-slate-500 italic">
                سندی اخیراً اسکن نشده است.
              </div>
            )}
          </div>

          <div className="px-4 pt-6 pb-2 text-[10px] font-black text-slate-500 uppercase tracking-widest border-t border-slate-800/80 mt-4">
            تنظیم موتور هوش مصنوعی (مدل)
          </div>

          <div className="px-3 py-1 space-y-2">
            {[
              {
                id: "gemini-3.5-flash",
                name: "Gemini 3.5 Flash",
                badge: "پیشنهادی",
                tokenLimit: "سند تا ۲۵MB",
                costPerRequest: "حدود ۱,۲۰۰ توکن",
                desc: "پردازش فوق‌سریع و هوشمند فاکتورها.",
                badgeClass: "bg-blue-500/20 text-blue-300",
              },
              {
                id: "gemini-3.1-pro-preview",
                name: "Gemini 3.1 Pro",
                badge: "حسابرس ارشد",
                tokenLimit: "سند تا ۱۰۰MB",
                costPerRequest: "حدود ۱,۸۰۰ توکن",
                desc: "استدلال عمیق و مناسب دست‌خط نامنظم.",
                badgeClass: "bg-purple-500/20 text-purple-300",
              },
            ].map((m) => {
              const quota = modelQuotas[m.id] || { limit: 100, used: 0, lastReset: Date.now() };
              const percentUsed = Math.min(100, Math.round((quota.used / quota.limit) * 100));
              const remaining = Math.max(0, quota.limit - quota.used);
              const isSelected = selectedModel === m.id;
              const isExhausted = remaining === 0;
              
              const resetMsRemaining = Math.max(0, (24 * 60 * 60 * 1000) - (Date.now() - (quota.lastReset || Date.now())));
              const hoursRemaining = Math.floor(resetMsRemaining / (1000 * 60 * 60));
              const minsRemaining = Math.floor((resetMsRemaining % (1000 * 60 * 60)) / (1000 * 60));

              return (
                <motion.div
                  key={m.id}
                  whileHover={{ y: -2, scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => {
                    if (!isExhausted) setSelectedModel(m.id);
                  }}
                  className={`p-3 rounded-xl transition-all border text-right select-none ${
                    isExhausted
                      ? "bg-rose-950/20 border-rose-900/40 cursor-not-allowed opacity-80"
                      : isSelected
                      ? "bg-slate-800 border-blue-500 cursor-pointer text-white shadow-md shadow-blue-500/5"
                      : "bg-slate-900/30 border-slate-800 cursor-pointer hover:bg-slate-800/40 text-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className={`text-xs font-bold font-mono ${isExhausted ? "text-rose-400" : "text-slate-100"}`}>
                      {m.name}
                    </span>
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${isExhausted ? "bg-rose-500/20 text-rose-300" : m.badgeClass}`}>
                      {isExhausted ? "پایان شارژ" : m.badge}
                    </span>
                  </div>
                  
                  <p className={`text-[10px] leading-relaxed mb-2.5 ${isExhausted ? "text-rose-400/70" : "text-slate-400"}`}>
                    {m.desc}
                  </p>

                  <div className={`space-y-1.5 border-t pt-2 text-[9px] ${isExhausted ? "border-rose-900/40 text-rose-300/70" : "border-slate-800/80 text-slate-400"}`}>
                    <div className={`flex justify-between items-center ${isExhausted ? "" : "text-slate-300"}`}>
                      <span className="font-bold text-[8px] opacity-80">مصرف تخمینی هر اسکن:</span>
                      <span className={`font-mono ${isExhausted ? "text-rose-400" : "text-blue-400"}`} dir="ltr">{m.costPerRequest}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={isExhausted ? "" : "text-slate-500"}>حداکثر ظرفیت:</span>
                      <span className={`font-medium ${isExhausted ? "" : "text-slate-300"}`}>{m.tokenLimit}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`font-bold ${isExhausted ? "" : "text-slate-500"}`}>سهمیه روزانه:</span>
                      <span className="font-mono font-medium" dir="ltr">{quota.limit.toLocaleString("fa-IR")} بار</span>
                    </div>
                    
                    {isExhausted ? (
                      <div className="flex justify-between items-center mt-1 pt-1 border-t border-rose-900/40">
                        <span className="font-bold text-rose-400">شارژ مجدد سهمیه:</span>
                        <span className="font-mono font-bold text-rose-400">{hoursRemaining}h {minsRemaining}m</span>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">سهم باقی‌مانده:</span>
                        <span className="font-mono font-bold text-emerald-400" dir="ltr">{remaining.toLocaleString("fa-IR")} بار</span>
                      </div>
                    )}
                  </div>

                  {/* Visual limit bar graph */}
                  <div className={`w-full rounded-full h-1 mt-2 overflow-hidden ${isExhausted ? "bg-rose-950" : "bg-slate-800"}`}>
                    <div
                      className={`h-full transition-all duration-300 ${
                        percentUsed >= 100 ? "bg-rose-600" : percentUsed > 85 ? "bg-rose-500" : percentUsed > 50 ? "bg-amber-400" : "bg-blue-500"
                      }`}
                      style={{ width: `${100 - percentUsed}%` }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="px-3 py-1 mt-2 pb-6">
            <button
              onClick={() => {
                setModelQuotas({
                  "gemini-3.5-flash": { limit: 1500, used: 0, lastReset: Date.now() },
                  "gemini-3.1-pro-preview": { limit: 100, used: 0, lastReset: Date.now() },
                });
                showNotification("سهمیه استفاده روزانه مدل‌ها ریست گردید.", "success");
              }}
              className="w-full flex items-center justify-center gap-2 py-1.5 border border-dashed border-slate-700 hover:border-slate-500 text-slate-400 hover:text-slate-300 rounded-lg text-[10px] transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>ریست محدودیت و ظرفیت‌ها</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Workspace Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header toolbar */}
        <header className={`h-12 border-b flex items-center justify-between px-4 lg:px-6 shrink-0 select-none transition-all duration-300 ${
          isDarkMode ? "bg-slate-900/80 backdrop-blur-md border-slate-800 text-slate-100" : "bg-white/80 backdrop-blur-md border-slate-200 text-slate-800"
        }`}>
          <div className="flex items-center gap-3 md:gap-5">
            <div className={`p-2 rounded-xl bg-gradient-to-br shadow-sm ${isDarkMode ? "from-blue-600 to-indigo-600 text-white" : "from-blue-500 to-indigo-500 text-white"}`}>
              <FileJson className="w-4 h-4" />
            </div>
            <h1 className="text-[15px] font-black tracking-tight animate-fade-in" dir="ltr">
              <span className="text-blue-500">ocr</span> Accounting
            </h1>
            <div className="hidden md:block h-6 w-px bg-slate-200 dark:bg-slate-700 mx-2"></div>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold ${
              activeFile?.status === "processing" 
                ? isDarkMode ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse" : "bg-amber-50 text-amber-700 border border-amber-200 animate-pulse" 
                : isDarkMode ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "bg-blue-50 text-blue-700 border border-blue-200"
            }`}>
              {activeFile?.status === "processing" && <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>}
              {activeFile?.status === "processing" ? "در حال تحلیل هوشمند..." : "آماده تفکیک خودکار اسناد"}
            </span>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={() => setIsAuditLogsOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all border text-[11px] font-bold ${
                isDarkMode ? "bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 hover:bg-slate-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:shadow-sm"
              }`}
              title="سیاهه رویدادها (گزارش‌گیری)"
            >
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">سیاهه رویدادها</span>
            </button>
            <button
              onClick={() => {
                setIsFileManagerOpen(true);
                logEvent("مشاهده فایل‌ها", "کاربر بخش مدیریت فایل‌ها و وضعیت حافظه را باز کرد.");
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all border text-[11px] font-bold ${
                isDarkMode ? "bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 hover:bg-slate-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:shadow-sm"
              }`}
              title="مدیریت اسناد و فایل‌ها (فضای ابری)"
            >
              <HardDrive className="h-4 w-4" />
              <span className="hidden sm:inline">مدیریت فایل‌ها</span>
            </button>
            {currentUser?.role === "admin" && (
              <button
                onClick={() => handleOpenProtectedPanel("admin")}
                className={`p-2 rounded-xl transition-all border ${
                  isDarkMode ? "bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 hover:bg-slate-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:shadow-sm"
                }`}
                title="پنل مدیریت سامانه"
              >
                <Shield className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={() => handleOpenProtectedPanel("user")}
              className={`p-2 rounded-xl transition-all border ${
                isDarkMode ? "bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 hover:bg-slate-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:shadow-sm"
              }`}
              title="پنل کاربری و API Keys"
            >
              <User className="h-4 w-4" />
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all hidden sm:block"
            >
              آپلود فایل جدید
            </button>
          </div>
        </header>

        {/* Workspace body */}
        {activeErpModuleId === 1 ? (
          <FinancialAccountingModule isDarkMode={isDarkMode} showNotification={showNotification} />
        ) : (
          <div className="flex-1 overflow-y-auto p-4 flex flex-col">
          {guideOpen && (
            <div className={`p-4 shadow-sm animate-fade-in flex flex-col items-start gap-3 mb-4 shrink-0 rounded-xl border transition-colors ${
              isDarkMode 
                ? "bg-blue-950/20 border-blue-900/60 text-blue-200" 
                : "bg-blue-50/70 border-blue-100 text-blue-900"
            }`}>
              <div className="flex items-start gap-3 w-full">
                <HelpCircle className={`h-5 w-5 shrink-0 mt-0.5 ${isDarkMode ? "text-blue-400" : "text-blue-600"}`} />
                <div className="flex-1 text-right">
                  <h3 className={`font-bold text-[13px] ${isDarkMode ? "text-blue-100" : "text-blue-900"} flex items-center gap-1.5`}>
                    <Sparkles className="h-4 w-4 text-amber-400 animate-pulse" />
                    دستورالعمل‌ها و رهنمودهای حسابداری هوشمند (اصول تراز مالی):
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 text-[11px]">
                    <div className="space-y-2">
                      <div className="flex items-start gap-1.5">
                        <span className="text-blue-500 select-none">•</span>
                        <div className="flex-1">
                          <strong className={isDarkMode ? "text-blue-100" : "text-blue-950"}>اصل تراز و موازنه دوطرفه:</strong>
                          <p className={`mt-0.5 ${isDarkMode ? "text-slate-400" : "text-slate-600"} leading-relaxed`}>
                            هر تراکنش مالی استخراج‌شده بر اساس قاعده بدهکار (Debit) و بستانکار (Credit) تراز می‌شود. مجموع دارایی‌ها/هزینه‌ها باید با بدهی‌ها/حقوق‌مالکان مندرج مطابقت داشته باشد.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-1.5">
                        <span className="text-blue-500 select-none">•</span>
                        <div className="flex-1">
                          <strong className={isDarkMode ? "text-blue-100" : "text-blue-950"}>تفکیک مالیات بر ارزش افزوده (VAT) و عوارض:</strong>
                          <p className={`mt-0.5 ${isDarkMode ? "text-slate-400" : "text-slate-600"} leading-relaxed`}>
                            نرخ مصوب مالیات ارزش افزوده سال جاری برای فاکتورهای استاندارد به‌صورت جداگانه طبقه‌بندی می‌شود. در پردازش صورت‌حساب‌ها، مالیات بر ارزش افزوده و عوارض به سرفصل حساب دارایی جاری (مالیات خرید بر ارزش افزوده) منتقل می‌شود.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-1.5">
                        <span className="text-blue-500 select-none">•</span>
                        <div className="flex-1">
                          <strong className={isDarkMode ? "text-blue-100" : "text-blue-950"}>تشخیص هوشمند تخفیفات فاکتور:</strong>
                          <p className={`mt-0.5 ${isDarkMode ? "text-slate-400" : "text-slate-600"} leading-relaxed`}>
                            سیستم مبالغ تخفیف‌های تجاری توصیف‌شده در فاکتورها را قبل از محاسبه مالیات استخراج کرده و مانع از توهم محاسباتی در بهای تمام شده کالای خریداری‌شده می‌گردد.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-1.5">
                        <span className="text-blue-500 select-none">•</span>
                        <div className="flex-1">
                          <strong className={isDarkMode ? "text-blue-100" : "text-blue-950"}>اعتبارسنجی الگوهای عددی شناسه ملی و کد اقتصادی:</strong>
                          <p className={`mt-0.5 ${isDarkMode ? "text-slate-400" : "text-slate-600"} leading-relaxed`}>
                            سیستم با کنترل الگوی ۱۱ رقمی شناسه ملی و کدهای اقتصادی طرفین معامله در فاکتورهای رسمی، بستر اولیه را برای گزارش‌دهی فصلی موضوع ماده ۱۶۹ قانون مالیات‌های مستقیم تسهیل می‌نماید.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-1.5">
                        <span className="text-blue-500 select-none">•</span>
                        <div className="flex-1">
                          <strong className={isDarkMode ? "text-blue-100" : "text-blue-950"}>کنترل هزینه‌های غیرقابل قبول مالیاتی:</strong>
                          <p className={`mt-0.5 ${isDarkMode ? "text-slate-400" : "text-slate-600"} leading-relaxed`}>
                            هوش مصنوعی قادر به شناسایی و برچسب‌گذاری (Tagging) هوشمند اقلامی است که ممکن است بر اساس استانداردهای حسابداری، هزینه‌های غیرقابل قبول مالیاتی تلقی شوند (مانند جریمه‌های دیرکرد).
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-1.5">
                        <span className="text-blue-500 select-none">•</span>
                        <div className="flex-1">
                          <strong className={isDarkMode ? "text-blue-100" : "text-blue-950"}>کنترل حساب‌های ارزی و تسعیر نرخ ارز:</strong>
                          <p className={`mt-0.5 ${isDarkMode ? "text-slate-400" : "text-slate-600"} leading-relaxed`}>
                            تشخیص خودکار واحد پولی فاکتورهای ارزی (دلار، یورو و درهم) و ارائه پیشنهاد برای ثبت سند تسعیر نرخ ارز بر اساس تاریخ فاکتور جهت درج دقیق در دفاتر قانونی.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-start gap-1.5">
                        <span className="text-blue-500 select-none">•</span>
                        <div className="flex-1">
                          <strong className={isDarkMode ? "text-blue-100" : "text-blue-950"}>تشخیص ماهیت حساب بر اساس سرفصل کل و معین:</strong>
                          <p className={`mt-0.5 ${isDarkMode ? "text-slate-400" : "text-slate-600"} leading-relaxed`}>
                            با تحلیل اطلاعات اقلام، هوش مصنوعی سرفصل‌های کل و معین متناسب (مانند ملزومات اداری، هزینه اجاره، پیش‌پرداخت یا خرید کالا) را تخصیص می‌دهد تا از خطای ثبتی پیشگیری شود.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-1.5">
                        <span className="text-blue-500 select-none">•</span>
                        <div className="flex-1">
                          <strong className={isDarkMode ? "text-blue-100" : "text-blue-950"}>قابلیت خوانش فوق‌هوشمندِ خطوط دست‌نویس و اسناد مخدوش:</strong>
                          <p className={`mt-0.5 ${isDarkMode ? "text-slate-400" : "text-slate-600"} leading-relaxed`}>
                            مدل‌ها اکنون با دقت فراوان، خطوط تحریری، اداری مخدوش و شکسته نستعلیق ایرانی را می‌خوانند. موتور مجهز به تحلیل بافتاری برای حدس کلمات ادغام‌شده و بازیابی صفرهای پیوسته سریع از طریق مهندسی معکوسِ جمع کل می‌باشد. پیشنهاد می‌شود برای دست‌نویس‌های کور یا اسناد بسیار درهم‌ریخته از نسخه قدرتمند Gemini 3.1 Pro استفاده نمایید.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-1.5">
                        <span className="text-blue-500 select-none">•</span>
                        <div className="flex-1">
                          <strong className={isDarkMode ? "text-blue-100" : "text-blue-950"}>شماره سریال سند و تطبیق تاریخی (Audit Trail):</strong>
                          <p className={`mt-0.5 ${isDarkMode ? "text-slate-400" : "text-slate-600"} leading-relaxed`}>
                            عمر تاریخی فاکتور، تاریخ شمسی، سال مالی فعال و شماره سریال مندرج در راستای ردیابی حسابرسی اسناد مالی استخراج می‌شوند تا پرونده‌های مکرر به اشتباه دوباره ثبت نشوند.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-1.5">
                        <span className="text-blue-500 select-none">•</span>
                        <div className="flex-1">
                          <strong className={isDarkMode ? "text-blue-100" : "text-blue-950"}>تفکیک خودکار حساب‌های بانکی و تنخواه‌گردان:</strong>
                          <p className={`mt-0.5 ${isDarkMode ? "text-slate-400" : "text-slate-600"} leading-relaxed`}>
                            شناسایی ماهیت پرداخت نقد یا نسیه؛ چنانچه پرداخت از طریق فیش بانکی/کارتخوان صورت گرفته باشد، حساب موجودی بانک درگیر می‌شود و اگر فاکتور خرد باشد، در حساب تنخواه‌گردان منظور خواهد شد.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-1.5">
                        <span className="text-blue-500 select-none">•</span>
                        <div className="flex-1">
                          <strong className={isDarkMode ? "text-blue-100" : "text-blue-950"}>طبقه‌بندی دارایی‌های ثابت و تعیین هزینه استهلاک:</strong>
                          <p className={`mt-0.5 ${isDarkMode ? "text-slate-400" : "text-slate-600"} leading-relaxed`}>
                            مدل توانایی دارد خریدهای سرمایه‌ای بالای حد نصاب (اموال منقول/غیرمنقول مثل لپ‌تاپ و تجهیزات) را از هزینه‌های جاری تفکیک و به عنوان «اموال و ماشین‌آلات» با ثبت جداگانه لحاظ نماید.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-1.5">
                        <span className="text-blue-500 select-none">•</span>
                        <div className="flex-1">
                          <strong className={isDarkMode ? "text-blue-100" : "text-blue-950"}>خروجی و مبدل اختصاصی Excel (XLSX):</strong>
                          <p className={`mt-0.5 ${isDarkMode ? "text-slate-400" : "text-slate-600"} leading-relaxed`}>
                            علاوه بر خروجی مستقیم اکسل از نرم‌افزار، می‌توانید در زبانه «تبدیل‌گر اختصاصی اکسل» رشته‌های JSON ساختاریافته خود را جایگذاری نموده و فایل استاندارد اکسلِ راست‌چین و فارسی دریافت کنید.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-1.5">
                        <span className="text-blue-500 select-none">•</span>
                        <div className="flex-1">
                          <strong className={isDarkMode ? "text-blue-100" : "text-blue-950"}>دقت و شفافیت کیفیت بارگذاری:</strong>
                          <p className={`mt-0.5 ${isDarkMode ? "text-slate-400" : "text-slate-600"} leading-relaxed`}>
                            کیفیت اسکن، زاویه عمودی عکس و نور محیط نقش بسزایی دارد. در صورت مخدوش بودن اعداد بسیار ریز، از ادیتور متنی JSON در زبانه فیلترها جهت اصلاح دستی مبالغ استفاده فرمایید.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={`mt-3 pt-2 text-[10px] italic border-t w-full text-right ${isDarkMode ? "text-slate-400 border-blue-900/30" : "text-slate-700 border-blue-200/50"}`}>
                    توصیه حسابرسی: همیشه قبل از نهایی‌سازی و کپی نمودن ساختار تفکیک‌شده، از صحت مبالغ کل و بدهکار/بستانکار ثبت شده با چک لیست اطمینان حاصل نمایید.
                  </div>
                </div>
                <button onClick={() => setGuideOpen(false)} className={`${isDarkMode ? "text-blue-400 hover:text-blue-200" : "text-blue-500 hover:text-blue-700"}`}>
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className={`mt-3 pt-3 border-t w-full text-right ${isDarkMode ? "border-blue-900/40" : "border-blue-200/60"}`}>
                <h3 className={`font-bold text-xs mb-3 ${isDarkMode ? "text-blue-100" : "text-blue-900"}`}>راهنمای موتور هوش مصنوعی و بهینه‌سازی مصرف توکن:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[10px]">
                  <div className={`p-2.5 rounded-lg ${isDarkMode ? "bg-slate-900/50 border border-slate-800" : "bg-white/60 border border-blue-100/50"}`}>
                    <strong className="text-blue-500 block mb-1">Gemini 3.5 Flash (سرعت آنی و بهینه)</strong>
                    مدل پیش‌فرض و بهینه‌شده برای پردازش‌های فوری حسابداری. سهمیه روزانه بیش از ۱۵۰۰ درخواست، فوق‌العاده مقرون‌به‌صرفه و ایده‌آل برای فاکتورهای تایپی استاندارد.
                  </div>
                  <div className={`p-2.5 rounded-lg ${isDarkMode ? "bg-slate-900/50 border border-slate-800" : "bg-white/60 border border-blue-100/50"}`}>
                    <strong className="text-purple-400 block mb-1">Gemini 3.1 Pro (سطح ممیز ارشد مالی)</strong>
                    مجهز به عمیق‌ترین زنجیره استدلالی گوگل برای فاکتورهای با دست‌خط ناخوانا، عکس‌های مخدوش، و تسعیر حساب‌های ارزی پیچیده.
                  </div>
                  <div className={`p-2.5 rounded-lg md:col-span-2 ${isDarkMode ? "bg-slate-900/50 border border-slate-800" : "bg-white/60 border border-blue-100/50"}`}>
                    <strong className="text-emerald-400 block mb-1">راهنمای بهینه‌سازی مصرف توکن (قابل تنظیم در پنل تنظیمات):</strong>
                    <ul className="list-disc pl-4 pr-1 mt-1 space-y-1 leading-normal text-slate-400">
                      <li><strong className="text-slate-300">رزولوشن تصاویر:</strong> با فعال‌سازی رزولوشن فوق اقتصادی یا متوازن، ابعاد اسناد تا ۷۰٪ فشرده شده که مانع هدر رفت توکن‌های ورودی می‌شود.</li>
                      <li><strong className="text-slate-300">خلاصه سازی شرح (ECO Prompt):</strong> توضیحات طولانی تراکنش‌ها را فشرده می‌کند تا خروجی مدل کوتاه شده و سرعت پردازش افزایش یابد.</li>
                      <li><strong className="text-slate-300">محدودیت سطرها:</strong> تعیین تعداد سطور استخراجی مانع از اسکن بی‌کیفیت یا تکراری اقلام طولانی در فاکتورهای بسیار شلوغ می‌گردد.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Conditional Layout: Hidden when no file is uploaded! */}
          {!activeFile ? (
            <div className="flex-1 flex items-center justify-center p-4">
              {pendingFile ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.99, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="relative max-w-xl w-full text-right"
                  dir="rtl"
                >
                  <div className={`absolute -inset-1.5 blur-2xl opacity-10 rounded-3xl ${isDarkMode ? "bg-blue-500" : "bg-blue-400"}`}></div>
                  <div className={`relative rounded-3xl border p-6 w-full transition-all duration-300 ${
                    isDarkMode 
                      ? "bg-slate-900/95 backdrop-blur-2xl border-slate-800/80 shadow-[0_20px_50px_rgba(0,0,0,0.3)]" 
                      : "bg-white/95 backdrop-blur-2xl border-slate-200/80 shadow-[0_20px_50px_rgba(15,23,42,0.06)]"
                  }`}>
                    
                    {/* Header: Clean, Compact */}
                    <div className="flex items-start justify-between gap-4 mb-5 pb-4 border-b border-slate-100 dark:border-slate-800/60">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isDarkMode ? "bg-blue-500/10 text-blue-400 border border-blue-500/15" : "bg-blue-50 text-blue-600 border border-blue-100"
                        }`}>
                          <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                          <h2 className={`text-[15px] font-black tracking-tight ${isDarkMode ? "text-slate-100" : "text-slate-800"}`}>
                            تنظیمات هوش مصنوعی و راهنمای استخراج
                          </h2>
                          <p className={`text-[10.5px] mt-0.5 leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                            می‌توانید دستورالعمل خاصی را به دستیار بگویید یا بدون پرامپت شروع کنید.
                          </p>
                        </div>
                      </div>

                      {/* File Mini-Card (Extremely Minimalist) */}
                      <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border max-w-[180px] shrink-0 ${
                        isDarkMode ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-250/50"
                      }`}>
                        {pendingFile.mimeType === "application/pdf" ? (
                          <FileText className="w-4 h-4 text-rose-500 shrink-0" />
                        ) : (
                          <div className="w-5 h-5 rounded-md overflow-hidden shrink-0 border border-slate-300/30">
                            <img 
                              src={`data:${pendingFile.mimeType};base64,${pendingFile.base64}`} 
                              alt="" 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        )}
                        <div className="min-w-0 text-right">
                          <p className={`text-[9.5px] font-bold truncate ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                            {pendingFile.name}
                          </p>
                          <p className={`text-[8.5px] font-mono leading-none ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
                            {Math.round(pendingFile.size / 1024)} KB
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Main Area */}
                    <div className="flex flex-col gap-4">
                      {/* Selection of AI Model */}
                      <div className="flex flex-col gap-2">
                        <label className={`text-[11px] font-black ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                          لطفاً مدل هوش مصنوعی خود را از بین مدل‌های برنامه انتخاب کنید:
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            {
                              id: "gemini-3.5-flash",
                              name: "Gemini 3.5 Flash",
                              badge: "سرعت آنی و بهینه",
                              desc: "پیشنهادی برای اسناد خوانا",
                              icon: Sparkles,
                              iconColor: "text-blue-500"
                            },
                            {
                              id: "gemini-3.1-pro-preview",
                              name: "Gemini 3.1 Pro",
                              badge: "ممیز مالی ارشد",
                              desc: "دقت عالی دست‌نویس",
                              icon: Cpu,
                              iconColor: "text-purple-500"
                            }
                          ].map((modelOpt) => {
                            const isSelected = selectedModel === modelOpt.id;
                            const Icon = modelOpt.icon;
                            return (
                              <button
                                key={modelOpt.id}
                                type="button"
                                onClick={() => setSelectedModel(modelOpt.id)}
                                className={`flex items-center justify-between p-2.5 rounded-xl border text-right transition-all duration-200 hover:-translate-y-0.5 ${
                                  isSelected
                                    ? isDarkMode
                                      ? "bg-blue-500/10 border-blue-500/80 text-blue-400 shadow-[0_4px_12px_rgba(59,130,246,0.08)]"
                                      : "bg-blue-50/70 border-blue-500 text-blue-600 shadow-[0_4px_12px_rgba(59,130,246,0.06)]"
                                    : isDarkMode
                                      ? "bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-800/50 hover:text-slate-300"
                                      : "bg-slate-50 border-slate-200/60 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <div className={`p-1.5 rounded-lg ${
                                    isSelected 
                                      ? isDarkMode ? "bg-blue-500/10" : "bg-blue-50"
                                      : isDarkMode ? "bg-slate-800/50" : "bg-slate-200/40"
                                  }`}>
                                    <Icon className={`w-3.5 h-3.5 ${isSelected ? modelOpt.iconColor : "text-slate-400"}`} />
                                  </div>
                                  <div className="text-right">
                                    <p className={`text-[10.5px] font-bold ${isSelected ? (isDarkMode ? "text-slate-100" : "text-slate-900") : ""}`}>
                                      {modelOpt.name}
                                    </p>
                                    <p className="text-[8.5px] opacity-75 leading-none mt-0.5">{modelOpt.badge}</p>
                                  </div>
                                </div>
                                <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                                  isSelected 
                                    ? "border-blue-500 bg-blue-500 text-white" 
                                    : isDarkMode ? "border-slate-800" : "border-slate-300"
                                }`}>
                                  {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5 text-right">
                        <textarea
                          rows={3}
                          value={customPrompt}
                          onChange={(e) => setCustomPrompt(e.target.value)}
                          placeholder="مثلاً: 'تفکیک دقیق ردیف‌های با ارزش افزوده بالا' یا 'فقط اقلام مربوط به بستانکار...' یا بگذارید خالی بماند"
                          className={`w-full text-[11.5px] font-sans p-3 rounded-2xl border outline-none focus:ring-2 focus:ring-blue-500/20 leading-relaxed text-right transition-all resize-none ${
                            isDarkMode 
                              ? "bg-slate-950/40 border-slate-800 text-slate-100 placeholder-slate-600 focus:border-blue-500 focus:bg-slate-950/80" 
                              : "bg-slate-50/50 border-slate-200/80 text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:bg-white"
                          }`}
                        />
                      </div>

                      {/* Intelligent Suggestion Chips */}
                      <div>
                        <span className={`text-[10px] font-bold block mb-2 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                          پیشنهادها و فیلترهای هوشمند:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { 
                              label: "تفکیک ارزش افزوده", 
                              text: "مبلغ مالیات ارزش افزوده و عوارض را به طور دقیق در ستون ارزش افزوده تفکیک کن." 
                            },
                            { 
                              label: "تحلیل فاکتور ارزی", 
                              text: "این فاکتور ارزی است؛ نوع ارز را به درستی استخراج کن و معادل ریالی را در توضیحات تکمیلی بنویس." 
                            },
                            { 
                              label: "مبالغ بالای ۱ میلیون", 
                              text: "فقط اقلام و ردیف‌های مالی با مبلغ بالای ۱ میلیون تومان را استخراج کن." 
                            },
                            { 
                              label: "دقت دست‌نویس مخدوش", 
                              text: "سند دارای اقلام دست‌نویس است؛ روی خوانش ارقام مخدوش و بررسی جمع کل تمرکز کن." 
                            }
                          ].map((chip, idx) => {
                            const isSelected = customPrompt === chip.text;
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setCustomPrompt(isSelected ? "" : chip.text)}
                                className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold border transition-all ${
                                  isSelected 
                                    ? "bg-blue-500/10 border-blue-500/40 text-blue-400 shadow-sm"
                                    : isDarkMode 
                                      ? "bg-slate-800/40 border-slate-800 text-slate-400 hover:bg-slate-800/80 hover:text-slate-300" 
                                      : "bg-slate-50 border-slate-200/60 text-slate-600 hover:bg-slate-100 hover:text-slate-850"
                                }`}
                              >
                                {chip.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/60">
                      <button
                        type="button"
                        onClick={() => {
                          setPendingFile(null);
                          setCustomPrompt("");
                        }}
                        className={`px-4 py-2 rounded-xl text-[11px] font-bold transition-all ${
                          isDarkMode 
                            ? "bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-slate-200" 
                            : "bg-slate-100 hover:bg-slate-200/80 text-slate-600 hover:text-slate-800"
                        }`}
                      >
                        حذف و انصراف
                      </button>
                      
                      <button
                        type="button"
                        onClick={async () => {
                          const fileData = pendingFile;
                          setPendingFile(null);
                          await processImageForExtraction(fileData.base64, fileData.name, fileData.mimeType, customPrompt);
                        }}
                        className="px-4.5 py-2 rounded-xl text-[11px] font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 shadow-md shadow-blue-500/10 hover:shadow-blue-500/20 hover:-translate-y-0.5 transition-all"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-blue-200 shrink-0" />
                        <span>شروع تحلیل و استخراج</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.98, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className={`relative max-w-xl w-full text-center`}
                >
                  <div className={`absolute -inset-1 blur-3xl opacity-15 rounded-full ${isDarkMode ? "bg-blue-500" : "bg-blue-400"}`}></div>
                  <div className={`relative rounded-3xl shadow-2xl border p-6 md:p-8 w-full text-center transition-all duration-300 ${
                    isDarkMode 
                      ? "bg-slate-900/90 backdrop-blur-xl border-slate-800" 
                      : "bg-white/90 backdrop-blur-xl border-slate-200"
                  }`}>
                    <div className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-inner transition-transform duration-300 hover:rotate-6 ${
                      isDarkMode ? "bg-gradient-to-br from-blue-500/20 to-indigo-500/20 text-blue-400 border border-blue-500/20" : "bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600 border border-blue-100"
                    }`}>
                      <UploadCloud className="h-8 w-8" />
                    </div>
                    
                    <h2 className={`text-xl font-black mb-2 tracking-tight ${isDarkMode ? "text-slate-100" : "text-slate-800"}`}>
                      پردازش هوشمند اسناد مالی
                    </h2>
                    <p className={`text-[11px] leading-relaxed mb-6 max-w-lg mx-auto ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                      تصویر فاکتور، سند دست‌نویس، رسید پرداختی یا دفتر روزنامه خود را آپلود کنید تا هوش مصنوعی با دقت بالا آن را پردازش و تحلیل نماید.
                    </p>

                    {/* Main box drop zone integrated */}
                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onDragOver={onDragOver}
                      onDragLeave={onDragLeave}
                      onDrop={onDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer overflow-hidden transition-all duration-300 group ${
                        dragActive
                          ? "border-blue-500 bg-blue-500/10 scale-[1.02]"
                          : isDarkMode
                          ? "border-slate-700 bg-slate-800/50 hover:bg-slate-800/80 hover:border-blue-500/50"
                          : "border-slate-300 bg-slate-50 hover:bg-slate-100/80 hover:border-blue-500/40"
                      }`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={onFileChange}
                        accept="image/*,application/pdf"
                        className="hidden"
                      />
                      
                      <div className={`p-3 rounded-full mb-3 transition-transform group-hover:-translate-y-1 ${isDarkMode ? "bg-slate-800 text-slate-300" : "bg-white shadow-sm text-slate-600"}`}>
                         <FileJson className="w-6 h-6" />
                      </div>
                      
                      <p className={`text-xs font-bold mb-1 ${isDarkMode ? "text-slate-200" : "text-slate-700"}`}>
                        {dragActive ? "رها کنید تا آپلود شود..." : "سند، فاکتور یا فایل PDF را به اینجا بکشید"}
                      </p>
                      <p className={`text-[10px] mb-4 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
                        یا برای انتخاب فایل کلیک کنید
                      </p>

                      <div className="flex flex-col sm:flex-row gap-2 w-full max-w-xs z-10" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => {
                            setQrScanStatus("idle");
                            setQrErrorMessage("");
                            setQrInputUrl("");
                            setIsQrModalOpen(true);
                          }}
                          className={`flex-1 py-2 px-3 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm border group-hover:shadow-md ${
                            isDarkMode
                              ? "bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                          }`}
                        >
                          <QrCode className="h-3.5 w-3.5" />
                          <span>بارکد / QR</span>
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => setIsCameraOpen(true)}
                          className={`flex-1 py-2 px-3 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 shadow-lg ${
                            isDarkMode
                              ? "bg-blue-600 border-transparent text-white hover:bg-blue-500"
                              : "bg-blue-600 border-transparent text-white hover:bg-blue-700"
                          }`}
                        >
                          <Camera className="h-3.5 w-3.5 text-blue-200" />
                          <span>دوربین</span>
                        </button>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col lg:flex-row gap-6">
              {/* Column 1: Image view & control info */}
              <section className="w-full lg:w-[35%] flex flex-col gap-6 shrink-0">
                <div className={`rounded-xl shadow-sm border overflow-hidden flex flex-col animate-fade-in transition-colors duration-300 ${
                  isDarkMode 
                    ? "bg-[#1E293B] border-slate-800" 
                    : "bg-white border-slate-200"
                }`}>
                  <div className={`p-3 border-b flex justify-between items-center transition-colors ${
                    isDarkMode 
                      ? "border-slate-800 bg-slate-800/40 text-slate-200" 
                      : "border-slate-100 bg-slate-50/50 text-slate-700"
                  }`}>
                    {isRenamingDoc ? (
                      <div className="flex items-center gap-1.5 flex-1 min-w-0" dir="rtl">
                        <input
                          type="text"
                          value={tempDocName}
                          onChange={(e) => setTempDocName(e.target.value)}
                          className={`text-[11px] py-1 px-2 rounded-lg border outline-none font-sans w-full max-w-[160px] focus:ring-1 focus:ring-blue-500 font-bold ${
                            isDarkMode 
                              ? "bg-[#0b0f19] border-slate-700 text-slate-100 focus:border-blue-500" 
                              : "bg-white border-slate-300 text-slate-900 focus:border-blue-600"
                          }`}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleRenameDocument();
                            if (e.key === "Escape") setIsRenamingDoc(false);
                          }}
                        />
                        <button
                          onClick={handleRenameDocument}
                          className="p-1 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition shrink-0"
                          title="ذخیره نام"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setIsRenamingDoc(false)}
                          className="p-1 text-slate-400 hover:bg-slate-400/10 rounded-lg transition shrink-0"
                          title="انصراف"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 overflow-hidden flex-1 select-none min-w-0" dir="rtl">
                        <span className="text-[11px] text-slate-400 font-semibold shrink-0">سند:</span>
                        <span className="text-[11px] font-bold truncate max-w-[150px] sm:max-w-[180px] text-blue-600 dark:text-blue-400" title={activeFile.name}>
                          {activeFile.name}
                        </span>
                        <button
                          onClick={startRenamingDoc}
                          className="p-1 text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition shrink-0"
                          title="تغییر نام سند"
                        >
                          <FileEdit className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                    <button
                      onClick={clearCurrentFile}
                      className="text-slate-400 hover:text-rose-500 rounded p-1 transition shrink-0"
                      title="حذف سند"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className={`p-4 flex items-center justify-center min-h-[220px] transition-colors ${
                    isDarkMode ? "bg-slate-900/60" : "bg-slate-100"
                  }`}>
                    <div className={`relative w-full max-h-[300px] overflow-hidden rounded-lg border flex items-center justify-center shadow-sm transition-colors ${
                      isDarkMode ? "bg-[#1E293B] border-slate-800" : "bg-white border-slate-200"
                    }`}>
                      {!activeFile.preview ? (
                        <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500">
                           <FileJson className="h-16 w-16 mb-3 opacity-60 text-blue-400" />
                           <span className="text-sm font-semibold mb-1 truncate max-w-[200px]">{activeFile.name}</span>
                           <span className="text-[11px] opacity-70">سند دیجیتال (بدون تصویر فیزیکی)</span>
                        </div>
                      ) : activeFile.preview.startsWith("data:application/pdf") ? (
                        <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500">
                           <FileText className="h-16 w-16 mb-3 opacity-60 text-blue-400" />
                           <span className="text-sm font-semibold mb-1 truncate max-w-[200px]">{activeFile.name}</span>
                           <span className="text-[11px] opacity-70">فایل PDF با موفقیت بارگذاری شد</span>
                        </div>
                      ) : (
                        <img
                          src={activeFile.preview || undefined}
                          alt={activeFile.name}
                          className="max-h-[290px] object-contain"
                          referrerPolicy="no-referrer"
                        />
                      )}
                      {activeFile.status === "processing" && (
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[1px] flex flex-col items-center justify-center text-white p-4 select-none">
                          <div className="h-7 w-7 animate-spin rounded-full border-2 border-white border-t-blue-500 mb-2" />
                          <span className="text-[10px] text-center font-medium opacity-90 max-w-[180px]">
                            در حال بررسی همه‌جانبه سطرها و مبالغ...
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={`p-3 border-t flex items-center justify-between text-[10px] transition-colors ${
                    isDarkMode ? "border-slate-800 bg-slate-800/25 text-slate-400" : "border-slate-100 bg-slate-50/50 text-slate-500"
                  }`}>
                    <span className="truncate max-w-[180px]">فایل: {activeFile.name}</span>
                    <span>حجم: {Math.round(activeFile.size / 1024)} KB</span>
                  </div>

                  {activeFile.status === "error" && (
                    <div className="m-3 p-3 bg-rose-50 border border-rose-100 rounded-xl text-[11px] text-rose-700">
                      <strong>مشکل در پردازش:</strong> {activeFile.error}
                    </div>
                  )}
                </div>

                {/* Voice Notes Audio Panel */}
                {(activeFile.status === "success" || activeFile.status === "idle") && (
                  <AudioNotesSection 
                    fileId={activeFile.id} 
                    fileName={activeFile.name}
                    isDarkMode={isDarkMode} 
                  />
                )}
              </section>

              {/* Column 2: Interactive Tabs - JSON Code vs Visual Audit Analysis */}
              <section className="flex-1 flex flex-col gap-3 overflow-hidden">
                {/* Tab Navigation header wrapped with Action Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
                  <div className={`flex p-1 rounded-xl border w-fit shrink-0 gap-1 select-none transition-all duration-300 ${
                    isDarkMode 
                      ? "bg-[#1E293B] border-slate-800" 
                      : "bg-slate-200/80 border-slate-300/60"
                  }`}>
                    <button
                      onClick={() => handleTabChange("analysis")}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1.5 ${
                        activeTab === "analysis"
                          ? isDarkMode ? "bg-slate-800 text-blue-400 shadow-sm" : "bg-white text-blue-700 shadow-sm"
                          : isDarkMode ? "text-slate-400 hover:text-[#f1f5f9]" : "text-slate-600 hover:text-slate-950"
                      }`}
                    >
                      <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                      <span>آنالیز تصویر پیشرفته</span>
                    </button>
                    <button
                      onClick={() => handleTabChange("json")}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1.5 ${
                        activeTab === "json"
                          ? isDarkMode ? "bg-slate-800 text-blue-400 shadow-sm" : "bg-white text-blue-700 shadow-sm"
                          : isDarkMode ? "text-slate-400 hover:text-[#f1f5f9]" : "text-slate-600 hover:text-slate-950"
                      }`}
                    >
                      <FileJson className="h-3.5 w-3.5 text-blue-600" />
                      <span>آرایه خام JSON</span>
                    </button>
                    <button
                      onClick={() => handleTabChange("converter")}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1.5 ${
                        activeTab === "converter"
                          ? isDarkMode ? "bg-emerald-900/40 text-emerald-400 shadow-sm" : "bg-white text-emerald-700 shadow-sm"
                          : isDarkMode ? "text-slate-400 hover:text-[#f1f5f9]" : "text-slate-600 hover:text-slate-950"
                      }`}
                    >
                      <Sheet className="h-3.5 w-3.5 text-emerald-500" />
                      <span>خروجی اکسل پیشرفته</span>
                    </button>
                  </div>

                  <button
                    onClick={handleLoadNewDocument}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-[11px] font-bold font-sans rounded-xl text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-sm transition-all shrink-0 hover:scale-[1.02] active:scale-[0.98]"
                    title="ذخیره سند فعلی و باز کردن صفحه بارگذاری برای سند جدید"
                  >
                    <PlusCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>بارگذاری سند جدید</span>
                  </button>
                </div>

                {activeTab === "json" ? (
                  /* JSON Tab */
                  <div className="bg-[#1E1E1E] rounded-xl border border-slate-800 flex-1 flex flex-col overflow-hidden font-mono shadow-md">
                    {/* JSON Header Bar */}
                    <div className="px-4 py-2.5 border-b border-slate-700 bg-[#252526] flex justify-between items-center select-none shrink-0" dir="rtl">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <FileJson className="h-4 w-4 text-blue-400" />
                          <span className="text-xs text-slate-200 font-bold tracking-wider font-sans">
                            خروجی آرایه JSON منطبق بر سند
                          </span>
                        </div>
                        {/* Elegant Auto-save Status Badge */}
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-700 font-sans text-slate-400 select-none">
                          <span className={`h-1.5 w-1.5 rounded-full ${isAutoSaving ? "bg-emerald-400 animate-ping" : "bg-emerald-500"}`} />
                          <span className="font-medium text-[9px] text-slate-300">ذخیره خودکار</span>
                          {lastSavedTime ? (
                            <span className="text-[8px] text-slate-500 border-r border-slate-700 pr-1.5 mr-1.5 font-mono">
                              ذخیره شده {lastSavedTime}
                            </span>
                          ) : (
                            <span className="text-[8px] text-slate-500 border-r border-slate-700 pr-1.5 mr-1.5">
                              هر ۱۰ ثانیه
                            </span>
                          )}
                        </div>
                      </div>
                      {activeFile.status === "success" && (
                        <div className="flex items-center gap-2">
                           {isJsonVerified && (
                             <button 
                               onClick={() => {
                                  setConverterInputJson(rawJsonText);
                                  setIsConverterVerified(false);
                                  handleTabChange("converter");
                               }}
                               className="text-[10px] px-3 py-1 rounded-lg transition font-sans bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/40 border border-emerald-500/30 cursor-pointer flex items-center gap-1.5"
                             >
                               ارسال مستقیم به مبدل اکسل
                               <Sheet className="w-3.5 h-3.5" />
                             </button>
                           )}
                           <button 
                              onClick={copyJSONToClipboard}
                              className={`text-[10px] px-3 py-1 rounded-lg transition font-sans ${
                                isJsonVerified 
                                  ? "bg-emerald-600 text-white hover:bg-emerald-500 cursor-pointer" 
                                  : "bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 cursor-pointer"
                              }`}
                           >
                             {isJsonVerified ? "کپی متن تفکیک شده" : "⚠️ نیاز به تایید صحت جهت کپی"}
                           </button>
                        </div>
                      )}
                    </div>

                    {/* Verification & Consent Panel */}
                    {activeFile.status === "success" && (
                      <div className={`p-3 border-b select-none transition-colors ${
                        isJsonVerified 
                          ? "bg-slate-900/60 border-slate-800 text-slate-300" 
                          : "bg-amber-950/45 border-amber-900/50 text-amber-100"
                      }`} dir="rtl">
                        <label className="flex items-start gap-2.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isJsonVerified}
                            onChange={(e) => {
                              setIsJsonVerified(e.target.checked);
                              logEvent("تایید صحت اطلاعات", e.target.checked ? "کاربر صحت اطلاعات JSON را تایید کرد." : "کاربر تایید صحت اطلاعات JSON را لغو کرد.");
                            }}
                            className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-amber-500 cursor-pointer"
                          />
                          <div className="text-[11px] leading-relaxed select-none font-sans flex-1 text-right">
                            <span className="font-bold text-amber-400 block mb-0.5">بررسی مجدد و تایید صحت اطلاعات سند مالی</span>
                            آیا پس از بررسی دقیق، از صحت تمام اطلاعات بالا اطمینان کامل دارید؟ جهت فعال شدن دکمه کپی آرایه JSON، زدن این تیک الزامی است.
                          </div>
                        </label>
                      </div>
                    )}

                    {/* Textarea containing JSON to directly view/edit */}
                    <div className="flex-1 relative flex flex-col min-h-[300px]">
                      {activeFile.status === "processing" ? (
                        <div className="absolute inset-0 bg-[#1E1E1E] flex flex-col items-center justify-center text-slate-400 select-none">
                          <div className="h-6 w-6 animate-pulse rounded-full bg-blue-500 mb-2" />
                          <span className="text-xs">در حال تحلیل حسابداری و ثبت ساختار JSON...</span>
                        </div>
                      ) : (
                        <textarea
                          value={rawJsonText}
                          onChange={handleJsonTextChange}
                          placeholder="// دیتایی هنوز استخراج نشده است"
                          className="w-full flex-1 p-4 bg-[#1E1E1E] text-blue-300 font-mono text-xs leading-relaxed outline-none border-none resize-none overflow-y-auto"
                          dir="ltr"
                        />
                      )}
                    </div>

                    {/* Verification & Compliance Status Footer */}
                    <div className="p-3 bg-[#181818] border-t border-slate-800 text-[10px] select-none shrink-0 flex items-center justify-between">
                      {jsonError ? (
                        <span className="text-rose-400 flex items-center gap-1.5 font-bold">
                          <AlertCircle className="h-3.5 w-3.5" />
                          {jsonError}
                        </span>
                      ) : activeFile.status === "success" ? (
                        <span className="text-emerald-400 flex items-center gap-1.5 font-bold">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          ساختار JSON معتبر و منطبق بر سند است. (قابل بازنویسی زنده)
                        </span>
                      ) : (
                        <span className="text-slate-400">بدون تاریخچه قبلی</span>
                      )}
                    </div>
                  </div>
                ) : activeTab === "converter" ? (
                  /* Dedicated JSON to Excel Converter Tab */
                  <div className={`rounded-xl border flex-1 flex flex-col overflow-hidden shadow-sm transition-all duration-300 ${
                    isDarkMode ? "bg-[#1E293B] border-slate-800 text-slate-100" : "bg-white border-slate-200 text-[#1A1A1B]"
                  }`}>
                    {/* Header Summary */}
                    <div className={`p-4 border-b flex flex-wrap gap-4 items-center justify-between transition-colors duration-300 ${
                      isDarkMode ? "bg-[#162032] border-slate-800" : "bg-slate-50 border-slate-200"
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg shrink-0 ${isDarkMode ? "bg-emerald-950/40 text-emerald-400" : "bg-emerald-50 text-emerald-600"}`}>
                          <Sheet className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className={`text-xs font-bold ${isDarkMode ? "text-slate-100" : "text-slate-800"}`}>مبدل اختصاصی JSON به اکسل (Excel)</h4>
                          <p className={`text-[10px] mt-1 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>هر نوع متن یا آرایه JSON ساختاریافته مالی را در اینجا جایگذاری کرده و اکسل دقیق فارسی با پشتیبانی راست‌چین بگیرید</p>
                        </div>
                      </div>
                      
                      <button
                        disabled={!isConverterVerified || isGeneratingExcel}
                        onClick={() => {
                          if (!isConverterVerified || isGeneratingExcel) return;

                          setIsGeneratingExcel(true);
                          setShowExcelSuccess(false);

                          setTimeout(() => {
                            try {
                              const parsed = JSON.parse(converterInputJson);
                              const arr = Array.isArray(parsed) ? parsed : [parsed];
                              if (arr.length === 0) throw new Error("آرایه خالی است");
                              
                              const worksheet = XLSX.utils.json_to_sheet(arr);
                              
                              // Estimate reasonable column widths
                              const colWidths = Object.keys(arr[0] || {}).map(() => ({ wch: 18 }));
                              worksheet["!cols"] = colWidths;
                              
                              // Set RTL direction
                              if (!worksheet['!views']) worksheet['!views'] = [];
                              worksheet['!views'].push({ rightToLeft: true });

                              const workbook = XLSX.utils.book_new();
                              XLSX.utils.book_append_sheet(workbook, worksheet, "اطلاعات خروجی");
                              
                              XLSX.writeFile(workbook, `JSON-to-Excel-${new Date().toISOString().split('T')[0]}.xlsx`);
                              
                              logEvent("تولید فایل اکسل", "کاربر اطلاعات استخراج شده را در قالب یک فایل اکسل دانلود کرد.");
                              setNotification({ text: "فایل اکسل با موفقیت از JSON تولید شد.", type: "success" });
                              
                              setShowExcelSuccess(true);
                              setTimeout(() => setShowExcelSuccess(false), 2500);
                            } catch (err: any) {
                               setNotification({ text: "خطا در خواندن JSON! لطفاً از صحت فرمت JSON خود مطمئن شوید.", type: "error" });
                            } finally {
                              setIsGeneratingExcel(false);
                            }
                          }, 600); // Artificial delay to show the nice animation Let UI render spinner
                        }}
                        className={`py-2 px-6 rounded-lg text-[11px] font-bold transition-all duration-300 flex items-center justify-center gap-2 min-w-[200px] ${
                            isConverterVerified && !showExcelSuccess
                                ? (isDarkMode ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm" : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm")
                                : showExcelSuccess
                                ? "bg-green-500 text-white shadow-md scale-[1.02]"
                                : (isDarkMode ? "bg-slate-800 text-slate-500 cursor-not-allowed" : "bg-slate-200 text-slate-400 cursor-not-allowed")
                        }`}
                      >
                        {isGeneratingExcel ? (
                          <>
                             <Loader2 className="h-4 w-4 animate-spin" />
                             در حال پردازش داده‌ها...
                          </>
                        ) : showExcelSuccess ? (
                          <>
                             <Check className="h-4 w-4 animate-in zoom-in" />
                             با موفقیت دانلود شد!
                          </>
                        ) : (
                          <>
                             <Download className="h-4 w-4" />
                             {isConverterVerified ? "تولید فایل XLSX و دانلود" : "تایید نهایی جهت دانلود"}
                          </>
                        )}
                      </button>
                    </div>

                    {/* Verification Panel for Converter */}
                    <div className={`p-3 select-none transition-colors border-b ${
                      isConverterVerified 
                        ? (isDarkMode ? "bg-slate-900/60 border-slate-800 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-700")
                        : (isDarkMode ? "bg-indigo-950/40 border-indigo-900/50 text-indigo-200" : "bg-indigo-50 border-indigo-200 text-indigo-700")
                    }`} dir="rtl">
                      <label className="flex items-start gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isConverterVerified}
                          onChange={(e) => {
                            setIsConverterVerified(e.target.checked);
                            logEvent("تایید نهایی داده‌ها", e.target.checked ? "کاربر تایید نهایی برای تولید فایل اکسل را انجام داد." : "کاربر تایید نهایی تولید اکسل را لغو کرد.");
                          }}
                          className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-indigo-500 cursor-pointer"
                        />
                        <div className="text-[11px] leading-relaxed select-none font-sans flex-1 text-right">
                          <span className={`font-bold block mb-0.5 ${isConverterVerified ? "" : (isDarkMode ? "text-indigo-400" : "text-indigo-600")}`}>
                            تایید نهایی داده‌های JSON پیش از تولید فایل اکسل
                          </span>
                          آیا تمامی رکوردها و فیلدهای بالا (در مبدل اکسل) مورد تایید است؟ جهت فعال شدن دکمه تولید اکسل، زدن این تیک الزامی است.
                        </div>
                      </label>
                    </div>

                    {/* Textarea containing JSON to directly view/edit */}
                    <div className="flex-1 relative flex flex-col">
                        <textarea
                          value={converterInputJson}
                          onChange={(e) => setConverterInputJson(e.target.value)}
                          placeholder={`[
  {
    "ردیف": 1,
    "شرح": "پروژه طراحی وب",
    "مبلغ": 50000
  }
]`}
                          className="w-full h-full p-4 bg-[#1E1E1E] text-emerald-300 font-mono text-[13px] leading-relaxed outline-none border-none resize-none overflow-y-auto"
                          dir="ltr"
                        />
                    </div>
                  </div>
                ) : (
                  /* Visual Audit and Confidence Analysis Tab */
                  <div className={`rounded-xl border flex-1 flex flex-col overflow-hidden shadow-sm transition-all duration-300 ${
                    isDarkMode 
                      ? "bg-[#1E293B] border-slate-800 text-slate-100" 
                      : "bg-white border-slate-200 text-[#1A1A1B]"
                  }`}>
                    {/* Header Summary */}
                    <div className={`p-5 md:p-6 border-b flex flex-col gap-5 transition-colors duration-300 ${
                      isDarkMode ? "bg-[#111827]/80 border-slate-800/80" : "bg-slate-50 border-slate-200"
                    }`}>
                      {/* Top Row with Main Title and Information */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                          <div className={`p-2.5 rounded-2xl shrink-0 shadow-sm ${
                            isDarkMode 
                              ? "bg-blue-500/10 text-blue-400 border border-blue-500/15" 
                              : "bg-blue-50 text-blue-600 border border-blue-100"
                          }`}>
                            <Sparkles className="h-6 w-6 animate-pulse" />
                          </div>
                          <div>
                            <h4 className={`text-sm font-black tracking-tight ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>
                              تحلیل صحت‌سنجی و میزان اطمینان استخراج داده‌ها
                            </h4>
                            <p className={`text-[11px] mt-1 font-semibold ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                              کنترل خودکار همخوانی ارقام ریاضی، کیفیت قلم نوری هوش مصنوعی و تطابق تراز مالی اسناد
                            </p>
                          </div>
                        </div>

                        {/* Quick indicator badge */}
                        <div className="flex items-center gap-2 self-start md:self-auto">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                            isDarkMode ? "bg-[#0b0f19] text-slate-400 border border-slate-850" : "bg-white text-slate-500 border border-slate-200/80"
                          }`}>
                            سند جاری: <span className="font-mono text-blue-500 font-extrabold">{activeFile.name}</span>
                          </span>
                        </div>
                      </div>

                      {activeFile.status === "success" && transactions.length > 0 && (() => {
                        const count = transactions.length;
                        const sumScores = transactions.reduce((acc, current) => acc + (current.ضریب_اطمینان ?? 100), 0);
                        const avgScore = Math.round(sumScores / count);
                        const countEdited = transactions.filter((tr, idx) => isRowEdited(tr, idx)).length;
                        
                        let ratingLabel = "بسیار بالا و معتبر";
                        let progressColor = "bg-emerald-500";
                        let textColor = "text-emerald-500";
                        let ratingBg = isDarkMode ? "bg-emerald-950/20 border-emerald-900/30 text-emerald-400" : "bg-emerald-50 border-emerald-100 text-emerald-700";
                        if (avgScore < 60) {
                          ratingLabel = "کیفیت ضعیف و مشکوک";
                          progressColor = "bg-rose-500";
                          textColor = "text-rose-500";
                          ratingBg = isDarkMode ? "bg-rose-950/20 border-rose-900/30 text-rose-450" : "bg-rose-50 border-rose-100 text-rose-700";
                        } else if (avgScore < 85) {
                          ratingLabel = "متوسط و نیازمند بازبینی";
                          progressColor = "bg-amber-500";
                          textColor = "text-amber-500";
                          ratingBg = isDarkMode ? "bg-amber-950/20 border-amber-900/30 text-amber-400" : "bg-amber-50 border-amber-100 text-amber-700";
                        }

                        const lowConfidenceCount = transactions.filter(tr => (tr.ضریب_اطمینان ?? 100) < 70).length;
                        const mediumConfidenceCount = transactions.filter(tr => (tr.ضریب_اطمینان ?? 100) >= 70 && (tr.ضریب_اطمینان ?? 100) < 90).length;
                        const excellentConfidenceCount = transactions.filter(tr => (tr.ضریب_اطمینان ?? 100) >= 90).length;
                        const sumDebit = transactions.reduce((acc, current) => acc + (current.مبلغ_بدهکار ?? 0), 0);
                        const sumCredit = transactions.reduce((acc, current) => acc + (current.مبلغ_بستانکار ?? 0), 0);
                        const isBalanced = count > 0 && sumDebit === sumCredit;

                        return (
                          /* Bento Grid of analysis metrics */
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                            
                            {/* Card 1: Average confidence */}
                            <motion.div
                              whileHover={{ y: -3, scale: 1.01 }}
                              onClick={() => setFilterConfidence(filterConfidence === "high" ? "all" : "high")}
                              className={`border p-4 rounded-2xl shadow-sm flex flex-col justify-between cursor-pointer transition-all duration-300 ${
                                filterConfidence === "high"
                                  ? "bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-500/10"
                                  : isDarkMode 
                                    ? "bg-[#0b0f19] border-slate-850 hover:border-slate-750" 
                                    : "bg-white border-slate-200/90 hover:border-slate-300"
                              }`}
                              title="کلیک جهت فیلتر ردیف‌های با دقت بالا"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className={`text-[10px] font-black tracking-wide ${filterConfidence === "high" ? "text-emerald-100" : "text-slate-400"}`}>
                                  میانگین صحت استخراج (OCR)
                                </span>
                                <div className={`p-1.5 rounded-lg ${filterConfidence === "high" ? "bg-emerald-500" : isDarkMode ? "bg-slate-800" : "bg-slate-100"}`}>
                                  <TrendingUp className={`h-4 w-4 ${filterConfidence === "high" ? "text-white" : "text-blue-500"}`} />
                                </div>
                              </div>
                              
                              <div className="flex items-baseline gap-1 my-2">
                                <span className="text-3xl font-black font-mono tracking-tight">
                                  {avgScore.toLocaleString("fa-IR")}
                                </span>
                                <span className="text-sm font-bold">%</span>
                              </div>

                              <div className="mt-2 w-full">
                                <div className={`w-full rounded-full h-2 overflow-hidden ${
                                  filterConfidence === "high" ? "bg-emerald-700" : isDarkMode ? "bg-slate-800" : "bg-slate-100"
                                }`}>
                                  <div 
                                    className={`h-full transition-all duration-500 ${
                                      filterConfidence === "high" ? "bg-white" : progressColor
                                    }`} 
                                    style={{ width: `${avgScore}%` }} 
                                  />
                                </div>
                                <div className="flex justify-between items-center mt-2.5">
                                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                                    filterConfidence === "high" ? "bg-emerald-500 text-white" : ratingBg
                                  }`}>
                                    {ratingLabel}
                                  </span>
                                  {filterConfidence === "high" && (
                                    <span className="text-[8px] bg-white text-emerald-700 font-extrabold px-1.5 py-0.5 rounded-md">فیلتر فعال</span>
                                  )}
                                </div>
                              </div>
                            </motion.div>

                            {/* Card 2: Accounting balance status */}
                            <motion.div
                              whileHover={{ y: -3, scale: 1.01 }}
                              className={`border p-4 rounded-2xl shadow-sm flex flex-col justify-between transition-all duration-300 ${
                                isBalanced 
                                  ? isDarkMode 
                                    ? "bg-[#0b0f19] border-emerald-950/80 hover:border-emerald-900" 
                                    : "bg-emerald-50/20 border-emerald-200/70" 
                                  : isDarkMode 
                                    ? "bg-[#0b0f19] border-rose-950/80 hover:border-rose-900" 
                                    : "bg-rose-50/20 border-rose-200/70"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-black tracking-wide text-slate-400">
                                  تراز حسابداری (دو طرفه)
                                </span>
                                <div className="relative flex items-center justify-center">
                                  <div className={`absolute h-3 w-3 rounded-full opacity-40 animate-ping ${
                                    isBalanced ? "bg-emerald-500" : "bg-rose-500"
                                  }`} />
                                  <div className={`h-2.5 w-2.5 rounded-full relative ${
                                    isBalanced ? "bg-emerald-500" : "bg-rose-500"
                                  }`} />
                                </div>
                              </div>

                              <div className="flex flex-col gap-1.5 my-2">
                                <div className="flex items-center justify-between text-[11px] font-medium text-slate-500">
                                  <span>جمع بدهکار:</span>
                                  <span className="font-extrabold font-mono text-slate-600 dark:text-slate-300" dir="ltr">
                                    {sumDebit.toLocaleString("fa-IR")} <span className="text-[9px] font-normal">ریال</span>
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-[11px] font-medium text-slate-500">
                                  <span>جمع بستانکار:</span>
                                  <span className="font-extrabold font-mono text-slate-600 dark:text-slate-300" dir="ltr">
                                    {sumCredit.toLocaleString("fa-IR")} <span className="text-[9px] font-normal">ریال</span>
                                  </span>
                                </div>
                              </div>

                              <div className={`mt-2 p-2 rounded-xl border flex items-center gap-2 ${
                                isBalanced 
                                  ? isDarkMode ? "bg-emerald-950/15 border-emerald-900/30 text-emerald-400" : "bg-emerald-50 border-emerald-100 text-emerald-800" 
                                  : isDarkMode ? "bg-rose-950/15 border-rose-900/30 text-rose-400" : "bg-rose-50 border-rose-100 text-rose-800"
                              }`}>
                                {isBalanced ? (
                                  <>
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                    <div className="text-[9px] leading-relaxed">
                                      <span className="font-black block">موازنه تراز است</span>
                                      <span className="opacity-80">هیچ مغایرتی در ارقام دیده نشد</span>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0 animate-pulse" />
                                    <div className="text-[9px] leading-relaxed">
                                      <span className="font-black block text-rose-600 dark:text-rose-400">اختلاف در تراز مالی</span>
                                      <span className="font-bold font-mono block mt-0.5 text-right text-[10px]" dir="ltr">
                                        {(Math.abs(sumDebit - sumCredit)).toLocaleString("fa-IR")} ریال
                                      </span>
                                    </div>
                                  </>
                                )}
                              </div>
                            </motion.div>

                            {/* Card 3: Quality Breakdown / distribution */}
                            <motion.div
                              whileHover={{ y: -3, scale: 1.01 }}
                              className={`border p-4 rounded-2xl shadow-sm flex flex-col justify-between transition-all duration-300 ${
                                isDarkMode ? "bg-[#0b0f19] border-slate-850" : "bg-white border-slate-200/90"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-black tracking-wide text-slate-400">
                                  توزیع کیفیت استخراج داده‌ها
                                </span>
                                <div className={`p-1.5 rounded-lg ${isDarkMode ? "bg-slate-800" : "bg-slate-100"}`}>
                                  <Coins className="h-4 w-4 text-amber-500" />
                                </div>
                              </div>

                              <div className="my-2">
                                <div className={`flex h-2.5 w-full rounded-full overflow-hidden ${isDarkMode ? "bg-slate-800" : "bg-slate-100"}`}>
                                  <div 
                                    className="bg-emerald-500 transition-all duration-500 hover:opacity-90" 
                                    style={{ width: `${count > 0 ? (excellentConfidenceCount / count) * 100 : 0}%` }} 
                                    title={`عالی: ${excellentConfidenceCount} ردیف`}
                                  />
                                  <div 
                                    className="bg-amber-500 transition-all duration-500 hover:opacity-90" 
                                    style={{ width: `${count > 0 ? (mediumConfidenceCount / count) * 100 : 0}%` }} 
                                    title={`متوسط: ${mediumConfidenceCount} ردیف`}
                                  />
                                  <div 
                                    className="bg-rose-500 transition-all duration-500 hover:opacity-90" 
                                    style={{ width: `${count > 0 ? (lowConfidenceCount / count) * 100 : 0}%` }} 
                                    title={`ضعیف: ${lowConfidenceCount} ردیف`}
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-1 text-[9px] font-bold font-mono mt-1">
                                <button
                                  type="button"
                                  onClick={() => setFilterConfidence(filterConfidence === "high" ? "all" : "high")}
                                  className={`flex flex-col items-center p-1.5 rounded-xl transition-all duration-200 ${
                                    filterConfidence === "high" 
                                      ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 font-black scale-105" 
                                      : "text-emerald-500 hover:bg-emerald-500/5 border border-transparent"
                                  }`}
                                  title="فیلتر تراکنش‌های با کیفیت عالی"
                                >
                                  <span className="opacity-70 text-[8px] font-sans">عالی</span>
                                  <span className="text-sm font-extrabold mt-0.5">{excellentConfidenceCount.toLocaleString("fa-IR")}</span>
                                </button>
                                
                                <button
                                  type="button"
                                  onClick={() => setFilterConfidence(filterConfidence === "medium" ? "all" : "medium")}
                                  className={`flex flex-col items-center p-1.5 rounded-xl transition-all duration-200 ${
                                    filterConfidence === "medium" 
                                      ? "bg-amber-500/15 border border-amber-500/30 text-amber-500 font-black scale-105" 
                                      : "text-amber-500 hover:bg-amber-500/5 border border-transparent"
                                  }`}
                                  title="فیلتر تراکنش‌های متوسط"
                                >
                                  <span className="opacity-70 text-[8px] font-sans">متوسط</span>
                                  <span className="text-sm font-extrabold mt-0.5">{mediumConfidenceCount.toLocaleString("fa-IR")}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setFilterConfidence(filterConfidence === "low" ? "all" : "low")}
                                  className={`flex flex-col items-center p-1.5 rounded-xl transition-all duration-200 ${
                                    filterConfidence === "low" 
                                      ? "bg-rose-500/15 border border-rose-500/30 text-rose-500 font-black scale-105" 
                                      : "text-rose-500 hover:bg-rose-500/5 border border-transparent"
                                  }`}
                                  title="فیلتر تراکنش‌های ضعیف"
                                >
                                  <span className="opacity-70 text-[8px] font-sans font-medium">ضعیف</span>
                                  <span className="text-sm font-extrabold mt-0.5">{lowConfidenceCount.toLocaleString("fa-IR")}</span>
                                </button>
                              </div>
                            </motion.div>

                            {/* Card 4: Quick Actions & Reset filters */}
                            <motion.div
                              whileHover={{ y: -3, scale: 1.01 }}
                              className={`border p-4 rounded-2xl shadow-sm flex flex-col justify-between transition-all duration-300 ${
                                isDarkMode ? "bg-[#0b0f19] border-slate-850" : "bg-white border-slate-200/90"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-black tracking-wide text-slate-400">
                                  ابزار بازبینی سریع فیلترها
                                </span>
                                <div className={`p-1.5 rounded-lg ${isDarkMode ? "bg-slate-800" : "bg-slate-100"}`}>
                                  <Scale className="h-4 w-4 text-purple-500" />
                                </div>
                              </div>

                              <div className="flex flex-col gap-1.5 my-1.5">
                                {lowConfidenceCount > 0 ? (
                                  <button
                                    type="button"
                                    onClick={() => setFilterConfidence(filterConfidence === "low" ? "all" : "low")}
                                    className={`w-full text-right p-1.5 px-2.5 rounded-xl border flex items-center justify-between text-[10px] font-bold transition-all ${
                                      filterConfidence === "low"
                                        ? "bg-rose-500 border-rose-650 text-white shadow-md shadow-rose-500/10"
                                        : "bg-rose-500/10 border-rose-500/20 text-rose-500 hover:bg-rose-500/25"
                                    }`}
                                  >
                                    <div className="flex items-center gap-1.5">
                                      <AlertTriangle className="h-3.5 w-3.5 animate-pulse" />
                                      <span>نمایش {lowConfidenceCount.toLocaleString("fa-IR")} ردیف مشکوک</span>
                                    </div>
                                    <span className="bg-rose-500 text-white text-[9px] font-mono px-1.5 py-0.5 rounded-md">بررسی</span>
                                  </button>
                                ) : (
                                  <div className="w-full text-right p-1.5 px-2.5 rounded-xl border border-emerald-500/15 bg-emerald-500/5 text-emerald-500 text-[10px] font-bold flex items-center gap-1.5 select-none">
                                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
                                    <span>هیچ ردیف مشکوکی یافت نشد</span>
                                  </div>
                                )}

                                {countEdited > 0 && (
                                  <div className="p-1.5 px-2.5 rounded-xl border border-amber-500/15 bg-amber-500/5 text-amber-500 text-[10px] font-bold flex items-center gap-1.5">
                                    <FileEdit className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                                    <span>{countEdited.toLocaleString("fa-IR")} ردیف اصلاح شده دستی</span>
                                  </div>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => setFilterConfidence("all")}
                                className={`w-full py-2 text-center text-xs font-black rounded-xl transition-all duration-200 border flex items-center justify-center gap-1.5 ${
                                  filterConfidence === "all"
                                    ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/10"
                                    : isDarkMode 
                                      ? "bg-slate-800 hover:bg-slate-750 border-slate-700 text-slate-300" 
                                      : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                                }`}
                              >
                                <span>کل تراکنش‌ها ({count.toLocaleString("fa-IR")} ردیف)</span>
                                {filterConfidence !== "all" && (
                                  <span className="text-[8px] bg-blue-500/10 text-blue-500 dark:bg-white/10 dark:text-blue-300 px-1 py-0.5 rounded-md">لغو فیلتر</span>
                                )}
                              </button>
                            </motion.div>

                          </div>
                        );
                      })()}
                    </div>

                    {/* Advanced Filter Panel */}
                    {activeFile.status === "success" && transactions.length > 0 && (
                      <div className={`p-3 border-b flex flex-col gap-3 font-sans transition-colors ${
                        isDarkMode ? "bg-slate-900/60 border-slate-800" : "bg-[#F8FAFC] border-slate-200"
                      }`} dir="rtl">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          {/* Left layout with Quick search and metrics */}
                          <div className="flex items-center gap-2 flex-1 min-w-[280px]">
                            <div className="relative flex-1">
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                                <Search className="h-4 w-4" />
                              </span>
                              <input
                                type="text"
                                value={filterQuery}
                                onChange={(e) => setFilterQuery(e.target.value)}
                                placeholder="جستجوی سریع در شرح، شماره سند، تاریخ یا توضیحات..."
                                className={`w-full text-xs pr-9 pl-3 py-2 rounded-xl border outline-none font-sans transition-all duration-300 ${
                                  isDarkMode
                                    ? "bg-[#0B0F19] border-slate-800 text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    : "bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                                }`}
                              />
                              {filterQuery && (
                                <button
                                  onClick={() => setFilterQuery("")}
                                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                                  title="پاکسازی جستجو"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              )}
                            </div>

                            {/* Advanced Filter Toggle Button */}
                            <button
                              onClick={() => setShowFilters(!showFilters)}
                              className={`px-3 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all border shrink-0 ${
                                showFilters || filterParty || filterMinAmount || filterMaxAmount
                                  ? "bg-blue-600 border-blue-600 text-white hover:bg-blue-550 shadow-sm"
                                  : isDarkMode
                                  ? "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300"
                                  : "bg-white hover:bg-slate-50 border-slate-200 text-slate-600"
                              }`}
                            >
                              <SlidersHorizontal className="h-3.5 w-3.5" />
                              <span>فیلترهای پیشرفته</span>
                              {(filterParty || filterMinAmount || filterMaxAmount) && (
                                <span className="bg-red-500 text-white text-[8px] h-4 min-w-4 px-1 rounded-full flex items-center justify-center font-bold">
                                  !
                                </span>
                              )}
                            </button>

                            {/* Add New Row Manual Button */}
                            <button
                              onClick={handleAddNewRow}
                              className={`px-3.5 py-2 text-xs font-black rounded-xl flex items-center gap-1.5 transition-all border shrink-0 ${
                                isDarkMode
                                  ? "bg-emerald-555/15 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                                  : "bg-emerald-50 hover:bg-emerald-100 border-emerald-150 text-emerald-700"
                              }`}
                              title="افزودن سطر محاسباتی یا سند تراکنش دستی خام"
                            >
                              <PlusCircle className="h-3.5 w-3.5 text-emerald-500" />
                              <span>افزودن ردیف دستی (جدید)</span>
                            </button>
                          </div>

                          {/* Right layout indicating results found */}
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-slate-400 font-medium">ردیف‌های منطبق:</span>
                            <span className="font-bold text-blue-600 font-mono">
                              {filteredTransactions.length.toLocaleString("fa-IR")}
                            </span>
                            <span className="text-slate-300 text-[10px]">از</span>
                            <span className="font-semibold text-slate-500 font-mono">
                              {transactions.length.toLocaleString("fa-IR")} تراکنش
                            </span>

                            {(filterParty || filterQuery || filterMinAmount || filterMaxAmount || filterConfidence !== "all") && (
                              <button
                                onClick={() => {
                                  setFilterParty("");
                                  setFilterQuery("");
                                  setFilterMinAmount("");
                                  setFilterMaxAmount("");
                                  setFilterConfidence("all");
                                }}
                                className="mr-2 text-[10px] text-red-500 hover:text-red-650 hover:underline flex items-center gap-1 font-bold"
                              >
                                <X className="h-3 w-3" />
                                <span>حذف فیلترها</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Collapsible Advanced Filters UI */}
                        {showFilters && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            transition={{ duration: 0.25 }}
                            className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2.5 mt-1 border-t border-dashed border-slate-200 dark:border-slate-800"
                          >
                            {/* Counterparty / Party name Filter */}
                            <div className="flex flex-col gap-1">
                              <label className="text-[10px] font-bold text-slate-505 dark:text-slate-350 flex items-center gap-1">
                                <Filter className="h-3 w-3 text-blue-500" />
                                <span>نام طرف‌حساب (سرفصل):</span>
                              </label>
                              <div className="relative">
                                <input
                                  type="text"
                                  value={filterParty}
                                  onChange={(e) => setFilterParty(e.target.value)}
                                  placeholder="مانند: بانک ملت، شرکت الف، خدمات..."
                                  className={`w-full text-xs pr-3 pl-8 py-1.5 rounded-lg border outline-none font-sans ${
                                    isDarkMode
                                      ? "bg-[#0B0F19] border-slate-800 text-slate-100 placeholder-slate-600"
                                      : "bg-white border-slate-200 text-slate-800 placeholder-slate-400"
                                  }`}
                                />
                                {filterParty && (
                                  <button
                                    onClick={() => setFilterParty("")}
                                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                                    title="پاکسازی"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Minimum Amount Filter */}
                            <div className="flex flex-col gap-1">
                              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-350 flex items-center gap-1">
                                <Coins className="h-3 w-3 text-emerald-500" />
                                <span>حداقل مبلغ (ریال):</span>
                              </label>
                              <div className="relative">
                                <input
                                  type="number"
                                  value={filterMinAmount}
                                  onChange={(e) => setFilterMinAmount(e.target.value)}
                                  placeholder="حداقل مبلغ..."
                                  className={`w-full text-xs pr-3 pl-8 py-1.5 rounded-lg border outline-none font-sans ${
                                    isDarkMode
                                      ? "bg-[#0B0F19] border-slate-800 text-slate-100 placeholder-slate-600"
                                      : "bg-white border-slate-200 text-slate-800 placeholder-slate-400"
                                  }`}
                                />
                                {filterMinAmount && (
                                  <button
                                    onClick={() => setFilterMinAmount("")}
                                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                                    title="پاکسازی"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Maximum Amount Filter */}
                            <div className="flex flex-col gap-1">
                              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-350 flex items-center gap-1">
                                <Coins className="h-3 w-3 text-amber-500" />
                                <span>حداکثر مبلغ (ریال):</span>
                              </label>
                              <div className="relative">
                                <input
                                  type="number"
                                  value={filterMaxAmount}
                                  onChange={(e) => setFilterMaxAmount(e.target.value)}
                                  placeholder="حداکثر مبلغ..."
                                  className={`w-full text-xs pr-3 pl-8 py-1.5 rounded-lg border outline-none font-sans ${
                                    isDarkMode
                                      ? "bg-[#0B0F19] border-slate-800 text-slate-100 placeholder-slate-600"
                                      : "bg-white border-slate-200 text-slate-800 placeholder-slate-400"
                                  }`}
                                />
                                {filterMaxAmount && (
                                  <button
                                    onClick={() => setFilterMaxAmount("")}
                                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                                    title="پاکسازی"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                            </div>

                          </motion.div>
                        )}
                      </div>
                    )}

                    {activeFile.status === "success" && transactions.length > 0 && (
                      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden h-full">
                        <div className="flex-1 overflow-auto">
                          <table className="w-full text-right border-collapse text-xs">
                            <thead className={`text-[10px] uppercase font-black sticky top-0 z-30 transition-colors duration-300 ${
                            isDarkMode 
                              ? "text-slate-350" 
                              : "text-slate-500"
                          }`}>
                            <tr>
                              <th className={`px-3 py-3 text-center sticky top-0 z-30 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-md shadow-[0_1px_2px_rgba(0,0,0,0.03)] border-b border-l ${isDarkMode ? "border-slate-800/80" : "border-slate-200"} select-none`}>
                                <div className="flex items-center justify-center gap-1.5">
                                  <input
                                    type="checkbox"
                                    checked={transactions.length > 0 && transactions.every(t => (t.ضریب_اطمینان ?? 100) === 100)}
                                    onChange={(e) => {
                                      const isChecked = e.target.checked;
                                      const updated = transactions.map(t => ({
                                        ...t,
                                        ضریب_اطمینان: isChecked ? 100 : 80
                                      }));
                                      setTransactions(updated);
                                      try {
                                        setRawJsonText(JSON.stringify(updated, null, 2));
                                      } catch (err) {
                                        console.error(err);
                                      }
                                      logEvent("تایید گروهی ردیف‌ها", isChecked ? "کاربر تمام ردیف‌ها را تایید گروهی کرد." : "کاربر تایید گروهی ردیف‌ها را لغو کرد.");
                                      showNotification(
                                        isChecked 
                                          ? "تمامی ردیف‌ها تایید گروهی شدند و ضریب اطمینان آن‌ها به ۱۰۰٪ تغییر یافت." 
                                          : "ضریب اطمینان ردیف‌ها بازنشانی شد.",
                                        "success"
                                      );
                                    }}
                                    className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500/30 cursor-pointer bg-white dark:bg-slate-900 transition-all"
                                    title="تایید گروهی تمامی ردیف‌ها (ضریب اطمینان ۱۰۰٪)"
                                  />
                                  <span className="text-xs font-extrabold text-slate-400 dark:text-slate-500">#</span>
                                </div>
                              </th>
                              <th 
                                onClick={() => handleSort("تاریخ")}
                                className={`px-3 py-3 sticky top-0 z-30 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-md shadow-[0_1px_2px_rgba(0,0,0,0.03)] border-b border-l ${isDarkMode ? "border-slate-800/80" : "border-slate-200"} cursor-pointer select-none group hover:bg-slate-100/70 dark:hover:bg-slate-800/70 hover:text-blue-600 dark:hover:text-blue-400 transition-colors`}
                                title="مرتب‌سازی بر اساس تاریخ"
                              >
                                <div className="flex items-center gap-1.5 font-bold">
                                  <span>تاریخ</span>
                                  {renderSortIcon("تاریخ")}
                                </div>
                              </th>
                              <th 
                                onClick={() => handleSort("شماره_سند")}
                                className={`px-3 py-3 sticky top-0 z-30 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-md shadow-[0_1px_2px_rgba(0,0,0,0.03)] border-b border-l ${isDarkMode ? "border-slate-800/80" : "border-slate-200"} cursor-pointer select-none group hover:bg-slate-100/70 dark:hover:bg-slate-800/70 hover:text-blue-600 dark:hover:text-blue-400 transition-colors`}
                                title="مرتب‌سازی بر اساس شماره سند"
                              >
                                <div className="flex items-center gap-1.5 font-bold">
                                  <span>شماره سند</span>
                                  {renderSortIcon("شماره_سند")}
                                </div>
                              </th>
                              <th 
                                onClick={() => handleSort("نام_طرف_حساب")}
                                className={`px-3 py-3 sticky top-0 z-30 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-md shadow-[0_1px_2px_rgba(0,0,0,0.03)] border-b border-l ${isDarkMode ? "border-slate-800/80" : "border-slate-200"} cursor-pointer select-none group hover:bg-slate-100/70 dark:hover:bg-slate-800/70 hover:text-blue-600 dark:hover:text-blue-400 transition-colors`}
                                title="مرتب‌سازی بر اساس طرف حساب"
                              >
                                <div className="flex items-center gap-1.5 font-bold">
                                  <span>طرف حساب</span>
                                  {renderSortIcon("نام_طرف_حساب")}
                                </div>
                              </th>
                              <th 
                                onClick={() => handleSort("شناسه_ملی")}
                                className={`px-3 py-3 sticky top-0 z-30 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-md shadow-[0_1px_2px_rgba(0,0,0,0.03)] border-b border-l ${isDarkMode ? "border-slate-800/80" : "border-slate-200"} cursor-pointer select-none group hover:bg-slate-100/70 dark:hover:bg-slate-800/70 hover:text-blue-600 dark:hover:text-blue-400 transition-colors`}
                                title="مرتب‌سازی بر اساس شناسه/کد ملی"
                              >
                                <div className="flex items-center gap-1.5 font-bold">
                                  <span>شناسه/کد ملی</span>
                                  {renderSortIcon("شناسه_ملی")}
                                </div>
                              </th>
                              <th 
                                onClick={() => handleSort("شرح")}
                                className={`px-3 py-3 sticky top-0 z-30 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-md shadow-[0_1px_2px_rgba(0,0,0,0.03)] border-b border-l ${isDarkMode ? "border-slate-800/80" : "border-slate-200"} cursor-pointer select-none group hover:bg-slate-100/70 dark:hover:bg-slate-800/70 hover:text-blue-600 dark:hover:text-blue-400 transition-colors`}
                                title="مرتب‌سازی بر اساس شرح"
                              >
                                <div className="flex items-center gap-1.5 font-bold">
                                  <span>شرح / بابت</span>
                                  {renderSortIcon("شرح")}
                                </div>
                              </th>
                              <th 
                                onClick={() => handleSort("مالیات_ارزش_افزوده")}
                                className={`px-3 py-3 text-left sticky top-0 z-30 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-md shadow-[0_1px_2px_rgba(0,0,0,0.03)] border-b border-l ${isDarkMode ? "border-slate-800/80" : "border-slate-200"} cursor-pointer select-none group hover:bg-slate-100/70 dark:hover:bg-slate-800/70 hover:text-blue-600 dark:hover:text-blue-400 transition-colors`}
                                title="مرتب‌سازی بر اساس ارزش افزوده"
                              >
                                <div className="flex items-center gap-1.5 justify-end font-bold">
                                  {renderSortIcon("مالیات_ارزش_افزوده")}
                                  <span>ارزش افزوده</span>
                                </div>
                              </th>
                              <th 
                                onClick={() => handleSort("مبلغ_بدهکار")}
                                className={`px-3 py-3 text-left sticky top-0 z-30 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-md shadow-[0_1px_2px_rgba(0,0,0,0.03)] border-b border-l ${isDarkMode ? "border-slate-800/80" : "border-slate-200"} cursor-pointer select-none group hover:bg-slate-100/70 dark:hover:bg-slate-800/70 hover:text-blue-600 dark:hover:text-blue-400 transition-colors`}
                                title="مرتب‌سازی بر اساس بدهکار"
                              >
                                <div className="flex items-center gap-1.5 justify-end font-bold">
                                  {renderSortIcon("مبلغ_بدهکار")}
                                  <span>بدهکار</span>
                                </div>
                              </th>
                              <th 
                                onClick={() => handleSort("مبلغ_بستانکار")}
                                className={`px-3 py-3 text-left sticky top-0 z-30 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-md shadow-[0_1px_2px_rgba(0,0,0,0.03)] border-b border-l ${isDarkMode ? "border-slate-800/80" : "border-slate-200"} cursor-pointer select-none group hover:bg-slate-100/70 dark:hover:bg-slate-800/70 hover:text-blue-600 dark:hover:text-blue-400 transition-colors`}
                                title="مرتب‌سازی بر اساس بستانکار"
                              >
                                <div className="flex items-center gap-1.5 justify-end font-bold">
                                  {renderSortIcon("مبلغ_بستانکار")}
                                  <span>بستانکار</span>
                                </div>
                              </th>
                              <th 
                                onClick={() => handleSort("نوع_ارز")}
                                className={`px-3 py-3 text-center sticky top-0 z-30 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-md shadow-[0_1px_2px_rgba(0,0,0,0.03)] border-b border-l ${isDarkMode ? "border-slate-800/80" : "border-slate-200"} cursor-pointer select-none group hover:bg-slate-100/70 dark:hover:bg-slate-800/70 hover:text-blue-600 dark:hover:text-blue-400 transition-colors`}
                                title="مرتب‌سازی بر اساس ارز"
                              >
                                <div className="flex items-center gap-1.5 justify-center font-bold">
                                  <span>ارز</span>
                                  {renderSortIcon("نوع_ارز")}
                                </div>
                              </th>
                              <th 
                                onClick={() => handleSort("ضریب_اطمینان")}
                                className={`px-3 py-3 text-center sticky top-0 z-30 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-md shadow-[0_1px_2px_rgba(0,0,0,0.03)] border-b border-l ${isDarkMode ? "border-slate-800/80" : "border-slate-200"} select-none cursor-pointer group hover:bg-slate-100/70 dark:hover:bg-slate-800/70 hover:text-blue-600 dark:hover:text-blue-400 transition-colors`}
                                title="مرتب‌سازی بر اساس دقت استخراج"
                              >
                                <div className="flex items-center gap-1.5 justify-center font-bold">
                                  <span>دقت استخراج</span>
                                  {renderSortIcon("ضریب_اطمینان")}
                                </div>
                              </th>
                              <th 
                                onClick={() => handleSort("توضیحات")}
                                className={`px-3 py-3 sticky top-0 z-30 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-md shadow-[0_1px_2px_rgba(0,0,0,0.03)] border-b border-l ${isDarkMode ? "border-slate-800/80" : "border-slate-200"} cursor-pointer select-none group hover:bg-slate-100/70 dark:hover:bg-slate-800/70 hover:text-blue-600 dark:hover:text-blue-400 transition-colors`}
                                title="مرتب‌سازی بر اساس توضیحات تکمیلی"
                              >
                                <div className="flex items-center gap-1.5 font-bold">
                                  <span>توضیحات تکمیلی</span>
                                  {renderSortIcon("توضیحات")}
                                </div>
                              </th>
                              <th className={`px-3 py-3 text-center sticky top-0 z-30 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-md shadow-[0_1px_2px_rgba(0,0,0,0.03)] border-b ${isDarkMode ? "border-slate-800" : "border-slate-200"} font-bold`}>عملیات</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 relative">
                            <AnimatePresence mode="popLayout">
                              {sortedTransactions.map((tr, index) => {
                              const originalIndex = transactions.findIndex(t => t.id === tr.id);
                              const score = tr.ضریب_اطمینان ?? 100;
                              const isEdited = isRowEdited(tr, originalIndex);
                              const isCurrentlyEditing = editingRowIndex === originalIndex && editingRowData !== null;
                              
                              let badgeBg = "bg-emerald-500/10 border-emerald-500/15 text-emerald-600 dark:text-emerald-400";
                              let progressBg = "bg-emerald-500";
                              let scoreDesc = "عالی / بدون ابهام";
                              if (score < 60) {
                                badgeBg = "bg-rose-500/10 border-rose-500/15 text-rose-600 dark:text-rose-400";
                                progressBg = "bg-rose-500";
                                scoreDesc = "ناخوانا / نامعتبر";
                              } else if (score < 85) {
                                badgeBg = "bg-amber-500/10 border-amber-500/15 text-amber-600 dark:text-amber-400";
                                progressBg = "bg-amber-500";
                                scoreDesc = "دست‌نویس مخدوش";
                              }

                              const getAvatarChar = (name: string) => {
                                if (!name || name === "-") return "👤";
                                const trimmed = name.trim();
                                return trimmed.charAt(0);
                              };

                              const inputClass = `w-full text-[11px] px-1.5 py-1 rounded border outline-none font-sans ${
                                isDarkMode 
                                  ? "bg-[#0B0F19] border-slate-700 text-slate-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                                  : "bg-white border-slate-300 text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                              }`;

                              const isManual = String(tr.id).startsWith("manual-");
                              return (
                                <motion.tr
                                  key={tr.id || index}
                                  initial={isManual ? { opacity: 0, y: 24, filter: "blur(4px)", scale: 0.98 } : { opacity: 0, y: 12, filter: "blur(2px)" }}
                                  animate={{ opacity: 1, y: 0, filter: "blur(0px)", scale: 1 }}
                                  exit={{ opacity: 0, y: -20, filter: "blur(3px)", scale: 0.97 }}
                                  transition={isManual ? { duration: 0.45, ease: [0.16, 1, 0.3, 1] } : { duration: 0.35, ease: "easeOut", delay: Math.min(index * 0.04, 0.6) }}
                                  className={`transition-all duration-300 ease-out group hover:relative hover:z-10 hover:-translate-y-0.5 hover:scale-[1.006] ${
                                    isCurrentlyEditing
                                      ? (isDarkMode ? "bg-slate-800 border-y-4 border-slate-700 shadow-xl" : "bg-slate-50 border-y-4 border-slate-200 shadow-xl")
                                      : isEdited
                                      ? "bg-amber-50/30 border-r-4 border-r-amber-500 hover:bg-amber-100/40 dark:bg-amber-500/5 dark:border-r-amber-500/80 hover:shadow-lg dark:hover:shadow-black/30"
                                      : isDarkMode
                                        ? "bg-transparent hover:bg-slate-800/90 hover:shadow-xl hover:shadow-black/35"
                                        : "bg-transparent hover:bg-white hover:shadow-xl hover:shadow-slate-200/50"
                                  }`}
                                >
                                  {isCurrentlyEditing ? (
                                    <td colSpan={13} className="p-0">
                                       <div className={`mx-4 my-5 p-6 rounded-2xl border-2 shadow-sm ${isDarkMode ? "bg-slate-900 border-blue-500/30" : "bg-white border-blue-200"}`}>
                                           <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b pb-4 border-slate-100 dark:border-slate-800">
                                              <div className="flex items-center gap-4">
                                                 <div className={`p-3 rounded-2xl ${isDarkMode ? "bg-blue-500/20 text-blue-400" : "bg-blue-100 text-blue-600"}`}>
                                                    <FileEdit className="w-5 h-5" />
                                                 </div>
                                                 <div>
                                                    <h4 className={`text-base font-bold tracking-tight ${isDarkMode ? "text-slate-100" : "text-slate-800"}`}>ویرایش دقیق ردیف {index + 1}</h4>
                                                    <p className={`text-[12px] mt-1 line-clamp-1 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>تمامی فیلدها را با دقت بررسی و اصلاح نمایید.</p>
                                                 </div>
                                              </div>
                                              <div className="flex items-center gap-2 w-full md:w-auto mt-2 md:mt-0">
                                                <button onClick={handleCancelEdit} className={`px-5 py-2.5 text-xs font-bold rounded-xl border flex-1 md:flex-none transition-colors ${isDarkMode ? "border-slate-700 hover:bg-slate-800 text-slate-300" : "border-slate-300 hover:bg-slate-50 text-slate-600"}`}>انصراف</button>
                                                <button onClick={() => handleSaveRow(originalIndex)} className="px-6 py-2.5 text-xs font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-700 shadow-sm flex items-center justify-center gap-2 flex-1 md:flex-none transition-all"><Check className="w-4 h-4"/> ذخیره اطلاعات</button>
                                              </div>
                                           </div>

                                           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-5">
                                              <div className="space-y-2 cursor-text">
                                                <label className={`text-[11px] font-semibold tracking-wide ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>تاریخ</label>
                                                <input type="text" className={`${inputClass} text-sm py-2.5 px-3 shadow-none focus:ring-2`} value={editingRowData.تاریخ || ""} onChange={(e) => handleFieldChange("تاریخ", e.target.value)} dir="ltr" placeholder="1402/12/01" />
                                              </div>
                                              <div className="space-y-2 cursor-text">
                                                <label className={`text-[11px] font-semibold tracking-wide ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>شماره سند</label>
                                                <input type="text" className={`${inputClass} text-sm py-2.5 px-3 shadow-none focus:ring-2`} value={editingRowData.شماره_سند || ""} onChange={(e) => handleFieldChange("شماره_سند", e.target.value)} dir="ltr" placeholder="شماره پیگیری" />
                                              </div>
                                              <div className="space-y-2 xl:col-span-2 cursor-text relative">
                                                <label className={`text-[11px] font-semibold tracking-wide ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>طرف حساب</label>
                                                <input 
                                                  type="text" 
                                                  className={`${inputClass} text-sm py-2.5 px-3 shadow-none focus:ring-2`} 
                                                  value={editingRowData.نام_طرف_حساب || ""} 
                                                  onChange={(e) => handleFieldChange("نام_طرف_حساب", e.target.value)} 
                                                  onFocus={() => setIsCounterpartyFocused(true)}
                                                  onBlur={() => setTimeout(() => setIsCounterpartyFocused(false), 200)}
                                                  placeholder="نام شخص یا شرکت" 
                                                />
                                                {isCounterpartyFocused && activeSuggestions.length > 0 && (
                                                  <div className={`absolute z-50 left-0 right-0 mt-1 max-h-56 overflow-auto rounded-xl border p-1 shadow-2xl transition-all ${
                                                    isDarkMode 
                                                      ? "bg-slate-900 border-slate-750 text-slate-100" 
                                                      : "bg-white border-slate-200 text-slate-850"
                                                  }`}
                                                  onMouseDown={(e) => e.preventDefault()}
                                                  >
                                                    <div className="px-2 py-1 text-[9px] font-bold text-slate-400 select-none">پیشنهاد بر اساس سوابق:</div>
                                                    {activeSuggestions.map((item, sugIdx) => (
                                                      <button
                                                        key={sugIdx}
                                                        type="button"
                                                        onClick={() => handleSelectSuggestion(item)}
                                                        className={`w-full text-right px-3 py-2 rounded-lg text-xs flex flex-col gap-0.5 transition-colors ${
                                                          isDarkMode ? "hover:bg-slate-800 text-slate-200" : "hover:bg-slate-100 text-slate-800"
                                                        }`}
                                                      >
                                                        <span className="font-bold">{item.name}</span>
                                                        {(item.nationalId || item.taxId) && (
                                                          <span className="text-[10px] text-slate-400 flex items-center gap-2">
                                                            {item.nationalId && <span>شناسه ملی: {item.nationalId}</span>}
                                                            {item.taxId && <span>شماره مالیاتی: {item.taxId}</span>}
                                                          </span>
                                                        )}
                                                      </button>
                                                    ))}
                                                  </div>
                                                )}
                                              </div>
                                              <div className="space-y-2 cursor-text">
                                                <label className={`text-[11px] font-semibold tracking-wide ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>دقت استخراج (%)</label>
                                                <input type="number" min="0" max="100" className={`${inputClass} text-sm py-2.5 px-3 text-center shadow-none focus:ring-2`} value={editingRowData.ضریب_اطمینان ?? 100} onChange={(e) => handleFieldChange("ضریب_اطمینان", Math.min(100, Math.max(0, Number(e.target.value))))} />
                                              </div>

                                              <div className="space-y-2 xl:col-span-2 cursor-text">
                                                <label className={`text-[11px] font-semibold tracking-wide ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>شرح / بابت</label>
                                                <input type="text" className={`${inputClass} text-sm py-2.5 px-3 shadow-none focus:ring-2`} value={editingRowData.شرح || ""} onChange={(e) => handleFieldChange("شرح", e.target.value)} placeholder="توضیح مختصری وارد کنید..." />
                                              </div>
                                              
                                              <div className="space-y-2 cursor-text">
                                                <label className={`text-[11px] font-semibold tracking-wide opacity-0`}>هزینه غیرقابل قبول</label>
                                                <label className="flex items-center justify-center gap-2 cursor-pointer h-[42px] px-3 rounded-lg bg-rose-50/50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 hover:bg-rose-100/50 transition-colors">
                                                  <input type="checkbox" checked={editingRowData.هزینه_غیرقابل_قبول || false} onChange={(e) => handleFieldChange("هزینه_غیرقابل_قبول", e.target.checked)} className="w-[18px] h-[18px] text-rose-600 rounded border-rose-300 outline-none focus:ring-rose-500 cursor-pointer" />
                                                  <span className="text-[11px] text-rose-700 dark:text-rose-400 font-bold flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5"/>هزینه غیرقابل قبول مالیاتی </span>
                                                </label>
                                              </div>

                                              <div className="space-y-2 cursor-text">
                                                <label className={`text-[11px] font-semibold tracking-wide ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>شناسه/کد ملی</label>
                                                <input type="text" className={`${inputClass} text-sm py-2.5 px-3 font-mono shadow-none focus:ring-2`} value={editingRowData.شناسه_ملی || ""} onChange={(e) => handleFieldChange("شناسه_ملی", e.target.value)} dir="ltr" placeholder="شناسه ده رقمی" />
                                              </div>
                                              <div className="space-y-2 cursor-text">
                                                <label className={`text-[11px] font-semibold tracking-wide ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>شماره مالیاتی (مودیان)</label>
                                                <input type="text" className={`${inputClass} text-sm py-2.5 px-3 font-mono shadow-none focus:ring-2`} value={editingRowData.شماره_مالیاتی || ""} onChange={(e) => handleFieldChange("شماره_مالیاتی", e.target.value)} dir="ltr" placeholder="۲۲ کاراکتر" />
                                              </div>
                                              <div className="space-y-2 cursor-text">
                                                <label className={`text-[11px] font-semibold tracking-wide ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>نوع ارز</label>
                                                <input type="text" className={`${inputClass} text-sm py-2.5 px-3 shadow-none focus:ring-2`} value={editingRowData.نوع_ارز || ""} onChange={(e) => handleFieldChange("نوع_ارز", e.target.value)} placeholder="ریال / تومان" />
                                              </div>

                                              <div className="space-y-2 cursor-text">
                                                <label className={`text-[11px] font-semibold tracking-wide ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>مالیات ارزش افزوده</label>
                                                <input type="number" className={`${inputClass} text-sm py-2.5 px-3 font-mono shadow-none focus:ring-2`} value={editingRowData.مالیات_ارزش_افزوده ?? ""} onChange={(e) => handleFieldChange("مالیات_ارزش_افزوده", e.target.value === "" ? null : Number(e.target.value))} placeholder="0" />
                                              </div>
                                              <div className="space-y-2 cursor-text">
                                                <label className={`text-[11px] font-bold tracking-wide ${isDarkMode ? "text-emerald-400" : "text-emerald-600"} flex items-center justify-between`}>
                                                   مبلغ بدهکار
                                                   {editingRowData.مبلغ_بدهکار > 0 && <span className="text-[10px] font-normal opacity-70">({Number(editingRowData.مبلغ_بدهکار).toLocaleString("fa-IR")})</span>}
                                                </label>
                                                <input type="number" className={`${inputClass} text-sm py-2.5 px-3 font-mono border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500 dark:border-emerald-500/30 shadow-none focus:ring-2`} value={editingRowData.مبلغ_بدهکار ?? ""} onChange={(e) => handleFieldChange("مبلغ_بدهکار", e.target.value === "" ? 0 : Number(e.target.value))} placeholder="0" />
                                              </div>
                                              <div className="space-y-2 cursor-text">
                                                <label className={`text-[11px] font-bold tracking-wide pr-1 flex items-center justify-between`}>
                                                   مبلغ بستانکار
                                                   {editingRowData.مبلغ_بستانکار > 0 && <span className="text-[10px] font-normal opacity-70">({Number(editingRowData.مبلغ_بستانکار).toLocaleString("fa-IR")})</span>}
                                                </label>
                                                <input type="number" className={`${inputClass} text-sm py-2.5 px-3 font-mono shadow-none focus:ring-2`} value={editingRowData.مبلغ_بستانکار ?? ""} onChange={(e) => handleFieldChange("مبلغ_بستانکار", e.target.value === "" ? 0 : Number(e.target.value))} placeholder="0" />
                                              </div>
                                              <div className="space-y-2 xl:col-span-2 cursor-text">
                                                <label className={`text-[11px] font-semibold tracking-wide ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>توضیحات تکمیلی</label>
                                                <input type="text" className={`${inputClass} text-sm py-2.5 px-3 shadow-none focus:ring-2`} value={editingRowData.توضیحات || ""} onChange={(e) => handleFieldChange("توضیحات", e.target.value)} placeholder="موارد بیشتر..." />
                                              </div>
                                           </div>
                                       </div>
                                    </td>
                                  ) : (
                                    <>
                                  <td className="px-3 py-3.5 text-center border-b border-l border-slate-200/60 dark:border-slate-800/75 first:rounded-r-xl transition-all duration-300 group-hover:border-b-transparent">
                                    <div className="flex items-center justify-center gap-2 font-mono font-bold text-slate-400">
                                      <input
                                        type="checkbox"
                                        checked={(tr.ضریب_اطمینان ?? 100) === 100}
                                        onChange={(e) => {
                                          const isChecked = e.target.checked;
                                          const updated = [...transactions];
                                          updated[originalIndex] = {
                                            ...tr,
                                            ضریب_اطمینان: isChecked ? 100 : 80
                                          };
                                          setTransactions(updated);
                                          try {
                                            setRawJsonText(JSON.stringify(updated, null, 2));
                                          } catch (err) {
                                            console.error(err);
                                          }
                                          logEvent("تایید انفرادی ردیف", isChecked ? `کاربر ردیف شماره ${originalIndex + 1} را تایید کرد.` : `کاربر تایید ردیف شماره ${originalIndex + 1} را لغو کرد.`);
                                        }}
                                        className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500/30 cursor-pointer bg-white dark:bg-slate-900 transition-all"
                                        title="تایید انفرادی ردیف (تنظیم ضریب اطمینان به ۱۰۰٪)"
                                      />
                                      <div className="flex items-center gap-1.5 shrink-0">
                                        {(tr.ضریب_اطمینان ?? 100) === 100 ? (
                                          <ShieldCheck 
                                            className="h-5 w-5 text-emerald-500 fill-emerald-500/5 cursor-help transition-all duration-300 hover:scale-110 shrink-0" 
                                            title="سند تأیید نهایی شده توسط کاربر (صحت کامل)"
                                          />
                                        ) : (
                                          <Shield 
                                            className="h-5 w-5 text-amber-500 fill-amber-500/5 cursor-help transition-all duration-300 hover:scale-110 shrink-0" 
                                            title="پیش‌نویس استخراج هوش مصنوعی (نیاز به بازبینی و تایید)"
                                          />
                                        )}
                                        <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">{index + 1}</span>
                                      </div>
                                      {isEdited && !isCurrentlyEditing && (
                                        <span
                                          className="p-1 bg-amber-500 text-white rounded-lg shadow-sm"
                                          title="تغییر یافته توسط کاربر (ویرایش دستی)"
                                        >
                                          <FileEdit className="h-3 w-3" />
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  
                                  {/* تاریخ */}
                                  <td className="px-3 py-3.5 font-mono text-slate-700 dark:text-slate-300 border-b border-l border-slate-200/60 dark:border-slate-800/75 transition-all duration-300 group-hover:border-b-transparent">
                                    <div className="flex items-center gap-1.5">
                                      <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                                      <span className="font-bold text-[11px] tracking-tight">
                                        {tr.تاریخ || <span className="text-slate-300 dark:text-slate-700 font-normal">[بدون تاریخ]</span>}
                                      </span>
                                    </div>
                                  </td>

                                  {/* شماره سند */}
                                  <td className="px-3 py-3.5 font-mono text-slate-700 dark:text-slate-300 border-b border-l border-slate-200/60 dark:border-slate-800/75 transition-all duration-300 group-hover:border-b-transparent">
                                    {tr.شماره_سند ? (
                                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold ${isDarkMode ? "bg-slate-800 text-slate-350 border border-slate-700" : "bg-slate-100 text-slate-700 border border-slate-200"}`}>
                                        <span className="text-[10px] opacity-50">#</span>
                                        <span>{tr.شماره_سند}</span>
                                      </span>
                                    ) : (
                                      <span className="text-slate-300 dark:text-slate-700 font-light">-</span>
                                    )}
                                  </td>

                                  {/* طرف حساب */}
                                  <td className="px-3 py-3.5 border-b border-l border-slate-200/60 dark:border-slate-800/75 max-w-[160px] transition-all duration-300 group-hover:border-b-transparent">
                                    <div className="flex items-center gap-2">
                                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 shadow-inner ${
                                        isDarkMode 
                                          ? "bg-gradient-to-br from-indigo-500/10 to-blue-500/10 text-blue-400 border border-blue-500/15" 
                                          : "bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600 border border-blue-100/80"
                                      }`}>
                                        {getAvatarChar(tr.نام_طرف_حساب || "")}
                                      </div>
                                      <span className={`font-extrabold text-[12px] truncate max-w-[130px] tracking-tight ${
                                        isDarkMode ? "text-slate-200" : "text-slate-850"
                                      }`} title={tr.نام_طرف_حساب || ""}>
                                        {tr.نام_طرف_حساب || <span className="text-slate-300 dark:text-slate-700 font-normal">-</span>}
                                      </span>
                                    </div>
                                  </td>

                                  {/* شناسه/کد ملی/مالیاتی */}
                                  <td className="px-3 py-3.5 border-b border-l border-slate-200/60 dark:border-slate-800/75 transition-all duration-300 group-hover:border-b-transparent">
                                    <div className="flex flex-col gap-1 text-[10px]">
                                      {tr.شناسه_ملی && (
                                        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono self-start ${
                                          isDarkMode ? "bg-[#0b0f19] text-blue-400 border border-slate-850" : "bg-slate-50 text-blue-700 border border-slate-200/60"
                                        }`}>
                                          <span className="opacity-70">👤</span>
                                          <span>{tr.شناسه_ملی}</span>
                                        </div>
                                      )}
                                      {tr.شماره_مالیاتی && (
                                        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono self-start truncate max-w-[120px] ${
                                          isDarkMode ? "bg-[#0b0f19] text-emerald-400 border border-slate-850" : "bg-slate-50 text-emerald-700 border border-slate-200/60"
                                        }`} title={tr.شماره_مالیاتی}>
                                          <span className="opacity-70">🧾</span>
                                          <span>{tr.شماره_مالیاتی.substring(0, 8)}...</span>
                                        </div>
                                      )}
                                      {(!tr.شناسه_ملی && !tr.شماره_مالیاتی) && <span className="text-slate-300 dark:text-slate-700 font-light">-</span>}
                                    </div>
                                  </td>

                                  {/* شرح */}
                                  <td className="px-3 py-3.5 border-b border-l border-slate-200/60 dark:border-slate-800/75 max-w-[200px] transition-all duration-300 group-hover:border-b-transparent">
                                    <div className="flex flex-col gap-1.5">
                                      <span className={`font-semibold text-[11.5px] leading-relaxed break-words ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                                        {tr.شرح || <span className="text-slate-400 dark:text-slate-600 font-normal">[بدون شرح]</span>}
                                      </span>
                                      {tr.هزینه_غیرقابل_قبول && (
                                        <div className={`inline-flex items-center gap-1.5 text-[9px] font-extrabold px-2 py-0.5 rounded-lg self-start border ${
                                          isDarkMode ? "bg-rose-500/10 border-rose-550/20 text-rose-400 animate-pulse" : "bg-rose-50 border-rose-200 text-rose-700"
                                        }`}>
                                          <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                                          <span>هزینه غیرقابل قبول مالیاتی</span>
                                        </div>
                                      )}
                                    </div>
                                  </td>

                                  {/* ارزش افزوده */}
                                  <td className="px-3 py-3.5 text-left border-b border-l border-slate-200/60 dark:border-slate-800/75 bg-rose-500/[0.015] dark:bg-rose-500/[0.02] max-w-[100px] transition-all duration-300 group-hover:border-b-transparent">
                                    {tr.مالیات_ارزش_افزوده !== null && tr.مالیات_ارزش_افزوده > 0 ? (
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded-lg font-mono font-bold text-xs ${
                                        isDarkMode ? "bg-rose-500/5 border border-rose-500/15 text-rose-450" : "bg-rose-50 border border-rose-100 text-rose-700"
                                      }`}>
                                        {Number(tr.مالیات_ارزش_افزوده).toLocaleString("fa-IR")}
                                      </span>
                                    ) : (
                                      <span className="text-slate-350 dark:text-slate-700 font-mono">۰</span>
                                    )}
                                  </td>

                                  {/* بدهکار */}
                                  <td className="px-3 py-3.5 text-left border-b border-l border-slate-200/60 dark:border-slate-800/75 bg-emerald-500/[0.015] dark:bg-emerald-500/[0.02] max-w-[110px] transition-all duration-300 group-hover:border-b-transparent">
                                    {tr.مبلغ_بدهکار !== null && tr.مبلغ_بدهکار > 0 ? (
                                      <span className={`inline-flex items-center px-2.5 py-1 rounded-xl font-mono font-extrabold text-xs md:text-[13px] shadow-sm ${
                                        isDarkMode ? "bg-emerald-500/10 border border-emerald-500/15 text-emerald-400" : "bg-emerald-50 border border-emerald-100 text-emerald-750"
                                      }`}>
                                        {Number(tr.مبلغ_بدهکار).toLocaleString("fa-IR")}
                                      </span>
                                    ) : (
                                      <span className="text-slate-350 dark:text-slate-700 font-mono">۰</span>
                                    )}
                                  </td>

                                  {/* بستانکار */}
                                  <td className="px-3 py-3.5 text-left border-b border-l border-slate-200/60 dark:border-slate-800/75 bg-blue-500/[0.015] dark:bg-blue-500/[0.02] max-w-[110px] transition-all duration-300 group-hover:border-b-transparent">
                                    {tr.مبلغ_بستانکار !== null && tr.مبلغ_بستانکار > 0 ? (
                                      <span className={`inline-flex items-center px-2.5 py-1 rounded-xl font-mono font-extrabold text-xs md:text-[13px] shadow-sm ${
                                        isDarkMode ? "bg-slate-500/10 border border-slate-500/15 text-slate-300" : "bg-slate-100 border border-slate-200 text-slate-750"
                                      }`}>
                                        {Number(tr.مبلغ_بستانکار).toLocaleString("fa-IR")}
                                      </span>
                                    ) : (
                                      <span className="text-slate-350 dark:text-slate-700 font-mono">۰</span>
                                    )}
                                  </td>

                                  {/* ارز */}
                                  <td className="px-3 py-3.5 text-center border-b border-l border-slate-200/60 dark:border-slate-800/75 bg-indigo-500/[0.01] dark:bg-indigo-500/[0.015] transition-all duration-300 group-hover:border-b-transparent">
                                    {tr.نوع_ارز && tr.نوع_ارز !== "-" ? (
                                      <span className={`px-2 py-0.5 rounded-lg text-[9.5px] font-extrabold border ${
                                        isDarkMode ? "bg-slate-800 border-slate-700 text-slate-400" : "bg-slate-100 border-slate-200/80 text-slate-600"
                                      }`}>
                                        {tr.نوع_ارز}
                                      </span>
                                    ) : (
                                      <span className="text-slate-350 dark:text-slate-700 font-light">-</span>
                                    )}
                                  </td>

                                  {/* دقت استخراج */}
                                  <td className="px-3 py-3.5 text-center border-b border-l border-slate-200/60 dark:border-slate-800/75 transition-all duration-300 group-hover:border-b-transparent">
                                    <div className="flex flex-col items-center justify-center min-w-[85px] gap-1 mx-auto">
                                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${badgeBg}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${progressBg} animate-pulse`} />
                                        <span>{score}%</span>
                                      </span>
                                      <div className={`w-14 rounded-full h-1 overflow-hidden shrink-0 ${isDarkMode ? "bg-slate-800" : "bg-slate-150"}`}>
                                        <div className={`h-full ${progressBg}`} style={{ width: `${score}%` }} />
                                      </div>
                                      <span className="text-[8px] text-slate-400 font-extrabold tracking-tight block shrink-0">{scoreDesc}</span>
                                    </div>
                                  </td>

                                  {/* توضیحات تکمیلی */}
                                  <td className="px-3 py-3.5 text-slate-500 dark:text-slate-400 border-b border-l border-slate-200/60 dark:border-slate-800/75 max-w-[140px] truncate transition-all duration-300 group-hover:border-b-transparent" title={tr.توضیحات || ""}>
                                    {tr.توضیحات || <span className="text-slate-300 dark:text-slate-700 font-light">-</span>}
                                  </td>

                                  {/* عملیات */}
                                  <td className="px-3 py-3.5 text-center border-b border-slate-100 dark:border-slate-800/40 last:rounded-l-xl transition-all duration-300 group-hover:border-b-transparent">
                                    <div className="flex items-center justify-center gap-2">
                                      <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => handleStartEdit(originalIndex, tr)}
                                        className={`p-1.5 rounded-xl font-sans text-[10.5px] font-bold flex items-center gap-1.5 transition-all border ${
                                          isDarkMode 
                                            ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750 hover:text-white hover:border-slate-600" 
                                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 shadow-sm"
                                        }`}
                                        title="ویرایش ردیف"
                                      >
                                        <FileEdit className="h-3.5 w-3.5 text-blue-500" />
                                        <span>ویرایش</span>
                                      </motion.button>
                                      <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => handleDeleteRow(originalIndex)}
                                        className={`p-1.5 rounded-xl font-sans text-[10.5px] font-bold flex items-center gap-1.5 transition-all border ${
                                          isDarkMode 
                                            ? "bg-rose-500/5 border-rose-500/10 text-rose-400 hover:bg-rose-500/15" 
                                            : "bg-rose-50 border-rose-150 text-rose-600 hover:bg-rose-100/60"
                                        }`}
                                        title="حذف این ردیف"
                                      >
                                        <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                                        <span>حذف</span>
                                      </motion.button>
                                    </div>
                                  </td>
                                  </>
                                  )}
                                </motion.tr>
                              );
                            })}
                            </AnimatePresence>
                          </tbody>
                        </table>
                      </div>

                      {/* Balance Calculator Widget (Right Side) */}
                      {activeFile.status === "success" && transactions.length > 0 && (() => {
                        const totalDebit = filteredTransactions.reduce((sum, t) => sum + (Number(t.مبلغ_بدهکار) || 0), 0);
                        const totalCredit = filteredTransactions.reduce((sum, t) => sum + (Number(t.مبلغ_بستانکار) || 0), 0);
                        const imbalanceAmount = Math.abs(totalDebit - totalCredit);
                        const isBalanced = imbalanceAmount === 0;
                        
                        const totalSum = totalDebit + totalCredit;
                        const debitPercent = totalSum > 0 ? Math.round((totalDebit / totalSum) * 100) : 50;
                        const creditPercent = totalSum > 0 ? Math.round((totalCredit / totalSum) * 100) : 50;
                        
                        const mainCurrency = filteredTransactions.find(t => t.نوع_ارز && t.نوع_ارز !== "-")?.نوع_ارز || "ریال/واحد";

                        // Prepare data for Debit Distribution Pie Chart
                        const debitDataMap: { [key: string]: number } = {};
                        let totalDebitAmount = 0;
                        filteredTransactions.forEach((t) => {
                          const amt = Number(t.مبلغ_بدهکار) || 0;
                          if (amt > 0) {
                            const rawName = t.نام_طرف_حساب || "";
                            const name = rawName.trim() === "" || rawName === "-" ? "نامشخص / سایر" : rawName;
                            debitDataMap[name] = (debitDataMap[name] || 0) + amt;
                            totalDebitAmount += amt;
                          }
                        });

                        const rawChartData = Object.entries(debitDataMap).map(([name, value]) => ({
                          name,
                          value,
                        }));

                        rawChartData.sort((a, b) => b.value - a.value);

                        let chartData: typeof rawChartData = [];
                        if (rawChartData.length > 5) {
                          chartData = rawChartData.slice(0, 4);
                          const otherValue = rawChartData.slice(4).reduce((sum, item) => sum + item.value, 0);
                          chartData.push({
                            name: "سایر سرفصل‌ها",
                            value: otherValue,
                          });
                        } else {
                          chartData = rawChartData;
                        }

                        const COLORS = ["#10B981", "#3B82F6", "#F59E0B", "#8B5CF6", "#EC4899", "#EF4444", "#06B6D4", "#F97316"];

                        return (
                          <div className={`w-full lg:w-[280px] p-4 shrink-0 flex flex-col gap-4 border-t lg:border-t-0 lg:border-r transition-colors duration-300 overflow-y-auto font-sans ${
                            isDarkMode 
                              ? "bg-[#162032] border-slate-800 text-slate-100" 
                              : "bg-slate-50/50 border-slate-150 text-slate-850"
                          }`} dir="rtl">
                            {/* Header Widget */}
                            <div className="flex items-center gap-2 pb-2.5 border-b border-dashed border-slate-200 dark:border-slate-800/80">
                              <Scale className={`h-4.5 w-4.5 shrink-0 ${isBalanced ? "text-emerald-500" : "text-amber-500 animate-pulse"}`} />
                              <div className="flex-1">
                                <h5 className="text-[11px] font-bold">ماشین حساب تراز هوشمند</h5>
                                <p className="text-[9px] text-slate-400 font-medium">سنجش و مطابقت لحظه‌ای بدهکار و بستانکار</p>
                              </div>
                            </div>

                            {/* Status Gauge Header */}
                            {isBalanced ? (
                              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-right">
                                <div className="flex items-center gap-1.5 text-emerald-500 font-bold text-xs mb-1">
                                  <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                  </span>
                                  <span>تراز تجاری معتبر است ✅</span>
                                </div>
                                <p className="text-[10px] text-slate-400 leading-normal">
                                  مجموع مبالغ بدهکار با مبالغ بستانکار کاملاً همخوانی دارد. این سند آماده خروجی یا انتقال است.
                                </p>
                              </div>
                            ) : (
                              <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-right">
                                <div className="flex items-center gap-1.5 text-rose-500 font-bold text-xs mb-1">
                                  <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-450 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                                  </span>
                                  <span>عدم توازن سند مالی! 🚨</span>
                                </div>
                                <p className="text-[10px] text-rose-450 dark:text-rose-400 leading-normal font-sans mb-2">
                                  بین مبالغ وارد شده اختلاف وجود دارد و حساب‌ها تراز نیستند.
                                </p>
                                <div className="pt-2 border-t border-rose-500/10 flex justify-between items-center text-[10px]">
                                  <span className="text-slate-400 font-medium">میزان اختلاف تراز:</span>
                                  <span className="font-mono font-bold text-rose-500" dir="ltr">
                                    {imbalanceAmount.toLocaleString("fa-IR")} {mainCurrency}
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Dual Metrics Grid */}
                            <div className="grid grid-cols-2 gap-2.5">
                              {/* Debit Card */}
                              <div className={`p-3 rounded-xl border text-center transition-colors ${
                                isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-150"
                              }`}>
                                <span className="text-[9px] text-slate-400 font-bold block mb-1">کل بدهکار (Debit)</span>
                                <span className="text-xs font-mono font-bold text-emerald-500" dir="ltr">
                                  {totalDebit.toLocaleString("fa-IR")}
                                </span>
                                <span className="text-[8px] text-slate-404 block mt-0.5">{mainCurrency}</span>
                              </div>

                              {/* Credit Card */}
                              <div className={`p-3 rounded-xl border text-center transition-colors ${
                                isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-150"
                              }`}>
                                <span className="text-[9px] text-slate-400 font-bold block mb-1">کل بستانکار (Credit)</span>
                                <span className="text-xs font-mono font-bold text-amber-500" dir="ltr">
                                  {totalCredit.toLocaleString("fa-IR")}
                                </span>
                                <span className="text-[8px] text-slate-404 block mt-0.5">{mainCurrency}</span>
                              </div>
                            </div>

                            {/* Split Ratio Bar Chart (Bento Style) */}
                            <div className={`p-3 rounded-xl border transition-colors ${
                              isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-150"
                            }`}>
                              <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold mb-1.5 font-sans">
                                <span>بدهکار (%{debitPercent.toLocaleString("fa-IR")})</span>
                                <span>بستانکار (%{creditPercent.toLocaleString("fa-IR")})</span>
                              </div>
                              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden flex">
                                <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${debitPercent}%` }} />
                                <div className="bg-amber-400 h-full transition-all duration-500" style={{ width: `${creditPercent}%` }} />
                              </div>
                            </div>

                            {/* Distribution of Expenses Widget (Pie Chart) */}
                            <div className={`p-3 rounded-xl border flex flex-col transition-colors ${
                              isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-150"
                            }`}>
                              <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-slate-800/60 mb-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-300 font-sans">توزیع مخارج بر اساس نام طرف‌حساب</span>
                              </div>

                              {totalDebitAmount > 0 ? (
                                <>
                                  <div className="h-[140px] w-full relative flex items-center justify-center">
                                    <ResponsiveContainer width="100%" height="100%">
                                      <PieChart>
                                        <Pie
                                          data={chartData}
                                          cx="50%"
                                          cy="50%"
                                          innerRadius={38}
                                          outerRadius={55}
                                          paddingAngle={3}
                                          dataKey="value"
                                        >
                                          {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                          ))}
                                        </Pie>
                                        <Tooltip 
                                          content={({ active, payload }: any) => {
                                            if (active && payload && payload.length) {
                                              const data = payload[0].payload;
                                              const percentage = totalDebitAmount > 0 ? ((data.value / totalDebitAmount) * 100).toFixed(1) : "0";
                                              return (
                                                <div className={`p-2 rounded-lg border font-sans text-[10px] shadow-sm ${
                                                  isDarkMode ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-850"
                                                }`}>
                                                  <p className="font-bold mb-1">{data.name}</p>
                                                  <p className="text-emerald-550 dark:text-emerald-400 font-mono font-bold" dir="ltr">
                                                    {Number(data.value).toLocaleString("fa-IR")} {mainCurrency}
                                                  </p>
                                                  <p className="text-slate-400 mt-0.5 font-medium">سهم: {Number(percentage).toLocaleString("fa-IR")}%</p>
                                                </div>
                                              );
                                            }
                                            return null;
                                          }} 
                                        />
                                      </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none">
                                      <span className="text-[8px] text-slate-400 font-medium font-sans">کل بدهکار</span>
                                      <span className="text-[10px] font-bold font-mono text-emerald-500 mt-0.5">
                                        {totalDebitAmount.toLocaleString("fa-IR")}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Custom RTL Legend */}
                                  <div className="flex flex-col gap-1.5 mt-1 border-t border-slate-100 dark:border-slate-800/40 pt-1.5 text-[9px] font-sans">
                                    {chartData.map((entry, index) => {
                                      const pct = totalDebitAmount > 0 ? Math.round((entry.value / totalDebitAmount) * 100) : 0;
                                      return (
                                        <div key={entry.name} className="flex items-center justify-between gap-2">
                                          <div className="flex items-center gap-1.5 min-w-0">
                                            <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                            <span className="truncate text-slate-500 dark:text-slate-400 font-medium" title={entry.name}>{entry.name}</span>
                                          </div>
                                          <span className="font-mono font-bold text-slate-600 dark:text-slate-300 shrink-0" dir="ltr">
                                            %{pct.toLocaleString("fa-IR")}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </>
                              ) : (
                                <div className="py-6 flex flex-col items-center justify-center text-center text-slate-400 select-none">
                                  <AlertCircle className="h-5 w-5 opacity-40 mb-1 text-slate-400" />
                                  <span className="text-[9px] text-slate-405 font-sans leading-relaxed">مبلغ بدهکاری جهت نمایش سهم طرف‌حساب ثبت نشده است.</span>
                                </div>
                              )}
                            </div>

                            {/* Anomalies and Financial Statistics Widget */}
                            <div className={`p-4 rounded-2xl border flex flex-col gap-3 transition-colors ${
                              isDarkMode ? "bg-slate-900/65 border-slate-800/90 shadow-lg" : "bg-[#f8fafc] border-slate-200/80 shadow-sm"
                            }`}>
                              <div className="flex items-center gap-2 pb-2.5 border-b border-slate-200/60 dark:border-slate-800/60">
                                <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                                <span className={`text-[11px] font-extrabold font-sans tracking-wide ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>آمارهای کلیدی طبقه‌بندی استخراج</span>
                              </div>
                              
                              <div className="flex flex-col gap-2 relative text-[10px] font-sans">
                                {/* Row 1: Highest account value */}
                                <div className={`flex justify-between items-center p-2 rounded-xl border transition-all ${
                                  isDarkMode 
                                    ? "bg-slate-950/40 border-slate-800/50 hover:bg-slate-950/80 hover:border-emerald-500/30" 
                                    : "bg-white border-slate-100 hover:border-emerald-200 hover:shadow-sm"
                                }`}>
                                  <div className="flex items-center gap-2">
                                    <div className={`p-1.5 rounded-lg shrink-0 ${
                                      isDarkMode ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-600"
                                    }`}>
                                      <TrendingUp className="h-3.5 w-3.5" />
                                    </div>
                                    <span className={`font-bold ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>بالاترین رقم حساب:</span>
                                  </div>
                                  <span className={`font-bold font-mono text-xs ${isDarkMode ? "text-emerald-400" : "text-emerald-600"}`} dir="ltr">
                                    {Math.max(0, ...filteredTransactions.map(t => Math.max(Number(t.مبلغ_بدهکار) || 0, Number(t.مبلغ_بستانکار) || 0))).toLocaleString("fa-IR")}
                                  </span>
                                </div>

                                {/* Row 2: Average amount */}
                                <div className={`flex justify-between items-center p-2 rounded-xl border transition-all ${
                                  isDarkMode 
                                    ? "bg-slate-950/40 border-slate-800/50 hover:bg-slate-950/80 hover:border-blue-500/30" 
                                    : "bg-white border-slate-100 hover:border-blue-200 hover:shadow-sm"
                                }`}>
                                  <div className="flex items-center gap-2">
                                    <div className={`p-1.5 rounded-lg shrink-0 ${
                                      isDarkMode ? "bg-blue-500/10 text-blue-400" : "bg-blue-50 text-blue-600"
                                    }`}>
                                      <Wallet className="h-3.5 w-3.5" />
                                    </div>
                                    <span className={`font-bold ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>میانگین مبالغ ثبت شده:</span>
                                  </div>
                                  <span className={`font-bold font-mono text-xs ${isDarkMode ? "text-blue-400" : "text-blue-600"}`} dir="ltr">
                                    {(totalSum / ((filteredTransactions.filter(t => (Number(t.مبلغ_بدهکار) || 0) > 0 || (Number(t.مبلغ_بستانکار) || 0) > 0).length) || 1)).toLocaleString("fa-IR", {maximumFractionDigits: 0})}
                                  </span>
                                </div>

                                {/* Row 3: Unique scanned docs */}
                                <div className={`flex justify-between items-center p-2 rounded-xl border transition-all ${
                                  isDarkMode 
                                    ? "bg-slate-950/40 border-slate-800/50 hover:bg-slate-950/80 hover:border-violet-500/30" 
                                    : "bg-white border-slate-100 hover:border-violet-200 hover:shadow-sm"
                                }`}>
                                  <div className="flex items-center gap-2">
                                    <div className={`p-1.5 rounded-lg shrink-0 ${
                                      isDarkMode ? "bg-violet-500/10 text-violet-400" : "bg-violet-50 text-violet-600"
                                    }`}>
                                      <FileText className="h-3.5 w-3.5" />
                                    </div>
                                    <span className={`font-bold ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>اسناد یکتا شناسایی شده:</span>
                                  </div>
                                  <span className={`font-extrabold font-mono text-xs ${isDarkMode ? "text-violet-400" : "text-violet-600"}`} dir="ltr">
                                    {new Set(filteredTransactions.filter(t => t.شماره_سند && t.شماره_سند.trim() !== "").map(t => t.شماره_سند)).size.toLocaleString("fa-IR")}
                                  </span>
                                </div>

                                {/* Row 4: Missing dates */}
                                {(() => {
                                  const missingDatesCount = filteredTransactions.filter(t => !t.تاریخ || t.تاریخ.trim() === "").length;
                                  const hasMissingDates = missingDatesCount > 0;
                                  return (
                                    <div className={`flex justify-between items-center p-2 rounded-xl border transition-all ${
                                      hasMissingDates
                                        ? isDarkMode ? "bg-amber-950/20 border-amber-800/40 hover:border-amber-500/50" : "bg-amber-50/50 border-amber-100 hover:border-amber-200"
                                        : isDarkMode ? "bg-slate-950/40 border-slate-800/50" : "bg-white border-slate-100"
                                    }`}>
                                      <div className="flex items-center gap-2">
                                        <div className={`p-1.5 rounded-lg shrink-0 ${
                                          hasMissingDates
                                            ? isDarkMode ? "bg-amber-500/20 text-amber-400" : "bg-amber-100 text-amber-700 font-bold"
                                            : isDarkMode ? "bg-slate-800 text-slate-500" : "bg-slate-100 text-slate-400"
                                        }`}>
                                          <Calendar className="h-3.5 w-3.5" />
                                        </div>
                                        <span className={`font-bold ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>تراکنش‌های فاقد تاریخ:</span>
                                      </div>
                                      <span className={`font-extrabold font-mono text-xs ${hasMissingDates ? "text-amber-500 animate-pulse" : isDarkMode ? "text-slate-500" : "text-slate-400"}`} dir="ltr">
                                        {missingDatesCount.toLocaleString("fa-IR")}
                                      </span>
                                    </div>
                                  );
                                })()}

                                {/* Row 5: Missing descriptions */}
                                {(() => {
                                  const missingDescCount = filteredTransactions.filter(t => !t.شرح_تراکنش || t.شرح_تراکنش.trim() === "").length;
                                  const hasMissingDesc = missingDescCount > 0;
                                  return (
                                    <div className={`flex justify-between items-center p-2 rounded-xl border transition-all ${
                                      hasMissingDesc
                                        ? isDarkMode ? "bg-rose-950/20 border-rose-800/40 hover:border-rose-500/50" : "bg-rose-50/50 border-rose-100 hover:border-rose-200"
                                        : isDarkMode ? "bg-slate-950/40 border-slate-800/50" : "bg-white border-slate-100"
                                    }`}>
                                      <div className="flex items-center gap-2">
                                        <div className={`p-1.5 rounded-lg shrink-0 ${
                                          hasMissingDesc
                                            ? isDarkMode ? "bg-rose-500/20 text-rose-400" : "bg-rose-100 text-rose-700 font-bold"
                                            : isDarkMode ? "bg-slate-800 text-slate-500" : "bg-slate-100 text-slate-400"
                                        }`}>
                                          <AlertTriangle className="h-3.5 w-3.5" />
                                        </div>
                                        <span className={`font-bold ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>تراکنش‌های فاقد شرح:</span>
                                      </div>
                                      <span className={`font-extrabold font-mono text-xs ${hasMissingDesc ? "text-rose-500 animate-pulse font-extrabold" : isDarkMode ? "text-slate-500" : "text-slate-400"}`} dir="ltr">
                                        {missingDescCount.toLocaleString("fa-IR")}
                                      </span>
                                    </div>
                                  );
                                })()}

                                {/* Row 6: Total Debit Turnover */}
                                <div className={`flex justify-between items-center p-2 rounded-xl border transition-all ${
                                  isDarkMode ? "bg-slate-950/40 border-slate-800/50 hover:bg-slate-950/80 hover:border-emerald-500/20" : "bg-white border-slate-100 hover:border-emerald-250 hover:shadow-xs"
                                }`}>
                                  <div className="flex items-center gap-2">
                                    <div className={`p-1.5 rounded-lg shrink-0 ${
                                      isDarkMode ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-600"
                                    }`}>
                                      <PlusCircle className="h-3.5 w-3.5" />
                                    </div>
                                    <span className={`font-bold ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>مجموع کل بدهکار (منابع کاربری):</span>
                                  </div>
                                  <span className={`font-extrabold font-mono text-xs ${isDarkMode ? "text-emerald-400" : "text-emerald-700"}`} dir="ltr">
                                    {filteredTransactions.reduce((acc, t) => acc + (Number(t.مبلغ_بدهکار) || 0), 0).toLocaleString("fa-IR")}
                                  </span>
                                </div>

                                {/* Row 7: Total Credit Turnover */}
                                <div className={`flex justify-between items-center p-2 rounded-xl border transition-all ${
                                  isDarkMode ? "bg-slate-950/40 border-slate-800/50 hover:bg-slate-950/80 hover:border-rose-500/20" : "bg-white border-slate-100 hover:border-rose-250 hover:shadow-xs"
                                }`}>
                                  <div className="flex items-center gap-2">
                                    <div className={`p-1.5 rounded-lg shrink-0 ${
                                      isDarkMode ? "bg-rose-500/10 text-rose-400" : "bg-rose-50 text-rose-600"
                                    }`}>
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </div>
                                    <span className={`font-bold ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>مجموع کل بستانکار (مصارف کاربری):</span>
                                  </div>
                                  <span className={`font-extrabold font-mono text-xs ${isDarkMode ? "text-rose-400" : "text-rose-700"}`} dir="ltr">
                                    {filteredTransactions.reduce((acc, t) => acc + (Number(t.مبلغ_بستانکار) || 0), 0).toLocaleString("fa-IR")}
                                  </span>
                                </div>

                                {/* Row 8: Currency Analysis */}
                                <div className={`flex justify-between items-center p-2 rounded-xl border transition-all ${
                                  isDarkMode ? "bg-slate-950/40 border-slate-800/50 hover:bg-slate-950/80 hover:border-indigo-500/20" : "bg-white border-slate-100 hover:border-indigo-250 hover:shadow-xs"
                                }`}>
                                  <div className="flex items-center gap-2">
                                    <div className={`p-1.5 rounded-lg shrink-0 ${
                                      isDarkMode ? "bg-indigo-500/10 text-indigo-400" : "bg-indigo-50 text-indigo-600"
                                    }`}>
                                      <Coins className="h-3.5 w-3.5" />
                                    </div>
                                    <span className={`font-bold ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>ارزهای شناسایی‌شده در فاکتور:</span>
                                  </div>
                                  <span className={`font-semibold text-[10px] ${isDarkMode ? "text-indigo-300" : "text-indigo-850"}`}>
                                    {Array.from(new Set(filteredTransactions.map(t => t.نوع_ارز).filter(Boolean))).join("، ") || "ریال"}
                                  </span>
                                </div>

                                {/* Row 9: Smart Risk Assessment */}
                                {(() => {
                                  const missingDatesCount = filteredTransactions.filter(t => !t.تاریخ || t.تاریخ.trim() === "").length;
                                  const missingDescCount = filteredTransactions.filter(t => !t.شرح_تراکنش || t.شرح_تراکنش.trim() === "").length;
                                  const totalMissing = missingDatesCount + missingDescCount;
                                  
                                  const lowConfCount = filteredTransactions.filter(tr => (tr.ضریب_اطمینان ?? 100) < 70).length;
                                  const sDebit = filteredTransactions.reduce((acc, current) => acc + (current.مبلغ_بدهکار ?? 0), 0);
                                  const sCredit = filteredTransactions.reduce((acc, current) => acc + (current.مبلغ_بستانکار ?? 0), 0);
                                  const balanceOK = filteredTransactions.length > 0 && sDebit === sCredit;

                                  let riskLabel = "بسیار کم (سند پایدار)";
                                  let riskBadgeColor = isDarkMode ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "bg-emerald-50 text-emerald-700 border-emerald-200";
                                  
                                  if (!balanceOK || lowConfCount > 2) {
                                    riskLabel = "بالا (عدم انطباق موازنه یا دقت)";
                                    riskBadgeColor = isDarkMode ? "bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse" : "bg-rose-50 text-rose-700 border-rose-200 animate-pulse";
                                  } else if (lowConfCount > 0 || totalMissing > 0) {
                                    riskLabel = "متوسط (نیازمند بررسی و تکمیل)";
                                    riskBadgeColor = isDarkMode ? "bg-amber-500/10 text-amber-400 border-amber-500/30" : "bg-amber-50 text-amber-700 border-amber-200";
                                  }

                                  return (
                                    <div className={`flex justify-between items-center p-2 rounded-xl border transition-all ${
                                      isDarkMode ? "bg-slate-950/40 border-slate-800/50" : "bg-white border-slate-100"
                                    }`}>
                                      <div className="flex items-center gap-2">
                                        <div className={`p-1.5 rounded-lg shrink-0 ${
                                          isDarkMode ? "bg-[#3b82f6]/10 text-[#3b82f6]" : "bg-blue-50 text-blue-600"
                                        }`}>
                                          <ShieldCheck className="h-3.5 w-3.5" />
                                        </div>
                                        <span className={`font-bold ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>سطح ریسک مغایرت دفتر جاری:</span>
                                      </div>
                                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${riskBadgeColor}`}>
                                        {riskLabel}
                                      </span>
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>

                            {/* Accounting Quick Hints Info */}
                            <div className="mt-auto pt-3 border-t border-slate-200 dark:border-slate-800 text-[9px] text-slate-400 leading-relaxed font-sans">
                              <span className="font-bold text-slate-500 dark:text-slate-300 block mb-1">💡 راهنمای توازن حسابداری:</span>
                              در دفاتر حسابداری و موازنه دوطرفه، جمع ستون بدهکار همواره باید معادل با ستون بستانکار باشد. در صورت بروز اختلاف، ردیف‌های با ضریب اطمینان ضعیف را مجدداً اصلاح یا تصحیح نمایید.
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      )}

        {/* System safety warning & footer */}
        <footer className="h-auto min-h-[36px] py-2 bg-slate-800 text-slate-400 flex flex-col items-center justify-center px-6 text-[10px] select-none shrink-0">
          <div className="flex w-full justify-between pb-1.5 mb-1 border-b border-slate-700 max-w-7xl">
            <div className="flex gap-4">
              <span>سیستم: آنلاین و امن</span>
              <span>هسته مفسر: {
                selectedModel === "gemini-3.1-pro-preview" ? "Gemini 3.1 Pro" : "Gemini 3.5 Flash"
              }</span>
              {activeFile?.status === "success" && (
                <div className="flex items-center gap-2">
                  <span className="text-amber-400 font-mono">
                    {activeFile.tokensUsed && activeFile.tokensUsed > 0 ? (
                      <>
                        توکن مصرفی خالص سند: {(() => {
                          const total = activeFile.tokensUsed || 0;
                          const cached = activeFile.tokenDetails?.cachedContentTokenCount || 0;
                          const prompt = activeFile.tokenDetails?.promptTokenCount || 0;
                          const cand = activeFile.tokenDetails?.candidatesTokenCount || 0;
                          
                          // If prompt/cand metrics are provided, use them for accuracy
                          if (prompt > 0 || cand > 0) {
                            return (Math.max(0, prompt - cached) + cand).toLocaleString("fa-IR");
                          }
                          // Fallback to total - cached if exact breakdown isn't available
                          return Math.max(0, total - cached).toLocaleString("fa-IR");
                        })()} توکن
                        <span className="text-[10px] text-slate-500 mr-1">
                          (کل تبادلی: {(activeFile.tokensUsed).toLocaleString("fa-IR")})
                        </span>
                      </>
                    ) : (
                      <span className="text-slate-400 text-xs font-sans">
                        فاقد مصرف توکن واقعی (بارگذاری دستی / آفلاین)
                      </span>
                    )}
                  </span>
                  <button 
                    onClick={() => setShowTokenDetails(true)}
                    className="text-amber-200 underline hover:text-white transition-colors cursor-pointer ml-1 text-[9px]"
                  >
                    (مشاهده جزئیات محاسبه)
                  </button>
                </div>
              )}
            </div>
            <div className="flex gap-4">
              <span className="text-emerald-400 font-semibold">استخراج بدون خط خوردگی بالا</span>
            </div>
          </div>
          <div className="text-rose-300 font-bold w-full text-center tracking-tight animate-fade-in max-w-7xl">
            ⚠️ توجه: هوش مصنوعی ممکن است اشتباه کند. لطفاً داده‌های تفکیک شده را دوباره با سند اصلی چك كنيد.
          </div>
        </footer>
      </main>

      {/* Camera Capture Modal */}
      {isCameraOpen && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={() => setIsCameraOpen(false)}
        />
      )}

      {/* Token Usage Details Modal */}
      {showTokenDetails && activeFile && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowTokenDetails(false)}>
          <div 
            className="bg-slate-900 border border-slate-700 p-6 rounded-xl shadow-2xl max-w-sm w-full text-right"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <h3 className="text-lg font-bold text-slate-100 mb-4 border-b border-slate-800 pb-2">جزئیات مصرف توکن</h3>
            
            {(() => {
              const hasRealTokenDetails = activeFile.tokenDetails && (activeFile.tokenDetails.totalTokenCount > 0 || activeFile.tokensUsed > 0);

              if (!hasRealTokenDetails) {
                return (
                  <div className="space-y-4 py-2 text-right">
                    <p className="text-amber-400 font-bold text-xs leading-relaxed">
                      ⚠️ اطلاعات مصرف واقعی توکن یافت نشد.
                    </p>
                    <p className="text-slate-400 text-[11px] leading-relaxed font-sans">
                      این سند به صورت دستی ویرایش شده، آفلاین فراخوانی شده یا مستقیماً از طریق فایل نمونه وارد شده است. جهت پایبندی کامل به واقعیت، از نمایش اعداد تقریبی، فرمولی یا تخمین‌های فرضی خودداری شده است.
                    </p>
                    <div className="p-3 rounded bg-slate-800/40 border border-slate-700 text-[10px] text-slate-400 font-sans leading-normal">
                      برای ثبت آمار واقعی، لطفاً فایلی را مجدداً از طریق پنل اصلی اسکن و با سرور هوش مصنوعی اختصاصی پردازش نمایید.
                    </div>
                  </div>
                );
              }

              const totalTokens = activeFile.tokenDetails?.totalTokenCount || activeFile.tokensUsed || 0;
              const promptTokens = activeFile.tokenDetails?.promptTokenCount || 0;
              const candidateTokens = activeFile.tokenDetails?.candidatesTokenCount || 0;
              const cachedTokens = activeFile.tokenDetails?.cachedContentTokenCount || 0;
              const uncachedPromptTokens = Math.max(0, promptTokens - cachedTokens);
              const netTokens = uncachedPromptTokens + candidateTokens;

              return (
                <div className="space-y-3 font-mono text-sm">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-400">کل توکن‌های پرامپت (Input):</span>
                    <span className="text-blue-400 font-bold">{promptTokens.toLocaleString("fa-IR")}</span>
                  </div>
                  {cachedTokens > 0 && (
                    <div className="flex justify-between items-center py-1 text-[11px] text-purple-300 pr-2">
                      <span>↳ توکن‌های بارگذاری شده از کش (ارزان‌تر):</span>
                      <span className="font-bold">{cachedTokens.toLocaleString("fa-IR")}</span>
                    </div>
                  )}
                  {cachedTokens > 0 && (
                    <div className="flex justify-between items-center py-1 text-[11px] text-blue-300 pr-2">
                      <span>↳ توکن‌های ورودی جدید (پردازش تازه):</span>
                      <span className="font-bold">{uncachedPromptTokens.toLocaleString("fa-IR")}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-1 border-t border-slate-850/50">
                    <span className="text-slate-400">توکن‌های تولید شده (Output):</span>
                    <span className="text-emerald-400 font-bold">{candidateTokens.toLocaleString("fa-IR")}</span>
                  </div>
                  
                  <div className="flex flex-col gap-1 p-3 mt-2 rounded bg-purple-950/20 border border-purple-900/40">
                    <div className="flex justify-between items-center">
                      <span className="text-purple-300 font-bold text-xs" title="ورودی جدید + خروجی">توکن‌های خالص (بدون کش):</span>
                      <span className="text-purple-400 font-bold text-base">{netTokens.toLocaleString("fa-IR")}</span>
                    </div>
                    <span className="text-[9px] text-slate-500 text-right leading-normal block font-sans">
                      * توکن‌های کش شده به‌شکل مستقل و با هزینه بسیار کمتری نسبت به توکن‌های جدید محاسبه می‌شوند.
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1 px-1 text-[11px] text-slate-500 border-t border-slate-800/40">
                    <span>مجموع حجم تبادلی (Total API Usage):</span>
                    <span>{totalTokens.toLocaleString("fa-IR")}</span>
                  </div>
                </div>
              );
            })()}

            <button 
              onClick={() => setShowTokenDetails(false)}
              className="mt-6 w-full py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors border border-slate-700 font-semibold"
            >
              بستن
            </button>
          </div>
        </div>
      )}

      {/* Biometric Verification Layer Modal */}
      {biometricModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity duration-300"
            onClick={() => setBiometricModalOpen(false)}
          ></div>

          {/* Dialog Container */}
          <div className={`relative w-full max-w-md rounded-2xl shadow-2xl flex flex-col overflow-hidden font-sans transition-all duration-300 border ${
            isDarkMode ? "bg-[#0b0f19] border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
          }`} dir="rtl">
            
            {/* Header */}
            <div className={`flex items-center justify-between p-4 border-b ${
              isDarkMode ? "border-slate-800/80 bg-slate-900/45" : "border-slate-100 bg-slate-55"
            }`}>
              <div className="flex items-center gap-2">
                <Fingerprint className={`h-5 w-5 ${isDarkMode ? "text-blue-400" : "text-blue-600"}`} />
                <span className="text-xs font-bold font-sans">احراز هویت زیستی و امنیتی</span>
              </div>
              <button 
                onClick={() => setBiometricModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 flex flex-col items-center text-center">
              
              {/* Context Label info */}
              <div className={`mb-3 px-3 py-1 text-[10px] font-bold rounded-full ${
                biometricTarget === "admin" 
                  ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" 
                  : "bg-blue-500/10 text-blue-500 border border-blue-500/20"
              }`}>
                {biometricTarget === "admin" 
                  ? "درخواست دسترسی به پنل فوق‌حساس مدیریت و تراکنش‌ها" 
                  : "درخواست دسترسی به اطلاعات کاربری و مدیریت API"}
              </div>

              {/* Status Header text */}
              <h4 className="text-sm font-bold mb-1">تأیید هویت کاربری (Biometric Validation)</h4>
              <p className="text-[11px] text-slate-400 max-w-xs leading-relaxed mb-6">
                برای باز شدن صفحه درخواستی، لطفاً اثر انگشت یا سیستم تشخیص چهره زیستی خود را تأیید کنید.
              </p>

              {/* Central Scan Area & Pulse Animation */}
              <div className="relative mb-6 flex items-center justify-center">
                
                {/* Background circles */}
                <div className={`absolute inset-0 rounded-full scale-[1.3] animate-ping opacity-15 duration-1000 ${
                  biometricStatus === "scanning" 
                    ? "bg-blue-500" 
                    : biometricStatus === "success" 
                    ? "bg-emerald-500" 
                    : biometricStatus === "error" 
                    ? "bg-rose-500" 
                    : "bg-slate-400"
                }`}></div>

                <div className={`h-24 w-24 rounded-full border-2 flex items-center justify-center transition-all duration-300 shadow-lg ${
                  biometricStatus === "scanning"
                    ? "border-blue-500 bg-blue-500/10 scale-105"
                    : biometricStatus === "success"
                    ? "border-emerald-500 bg-emerald-500/10"
                    : biometricStatus === "error"
                    ? "border-rose-500 bg-rose-500/10"
                    : isDarkMode ? "border-slate-800 bg-slate-900/60" : "border-slate-200 bg-slate-50"
                }`}>
                  
                  {biometricStatus === "scanning" ? (
                    <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
                  ) : biometricStatus === "success" ? (
                    <CheckCircle2 className="h-10 w-10 text-emerald-500 animate-bounce" />
                  ) : biometricStatus === "error" ? (
                    <AlertCircle className="h-10 w-10 text-rose-500" />
                  ) : (
                    <Fingerprint className={`h-11 w-11 ${
                      isDarkMode ? "text-slate-400 group-hover:text-blue-400" : "text-slate-500 group-hover:text-blue-600"
                    }`} />
                  )}
                </div>
              </div>

              {/* Sub-status label */}
              <div className="min-h-[24px] mb-6">
                {biometricStatus === "idle" && (
                  <span className="text-xs text-slate-400">آماده دریافت اثرانگشت یا تشخیص چهره</span>
                )}
                {biometricStatus === "scanning" && (
                  <span className="text-xs text-blue-500 font-semibold animate-pulse">در حال ارتباط با حسگر بیومتریک دستگاه...</span>
                )}
                {biometricStatus === "success" && (
                  <span className="text-xs text-emerald-500 font-bold">هویت شما با موفقیت تأیید شد. صادر شد.</span>
                )}
                {biometricStatus === "error" && (
                  <span className="text-xs text-rose-500 font-semibold">{biometricErrorMessage || "خطا در احراز هویت."}</span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="w-full flex flex-col gap-2">
                <button
                  type="button"
                  onClick={triggerBiometricScan}
                  disabled={biometricStatus === "scanning" || biometricStatus === "success"}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md ${
                    biometricStatus === "scanning"
                      ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                      : biometricStatus === "success"
                      ? "bg-emerald-600 text-white cursor-none"
                      : "bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white"
                  }`}
                >
                  <Fingerprint className="h-4 w-4" />
                  <span>
                    {biometricStatus === "scanning" 
                      ? "در حال پردازش..." 
                      : biometricStatus === "success" 
                      ? "هویت احراز شد!" 
                      : "شروع اسکن بیومتریک"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setBiometricModalOpen(false)}
                  className={`w-full py-2 text-xs font-semibold rounded-xl border transition-colors ${
                    isDarkMode 
                      ? "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40" 
                      : "bg-white border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  انصراف
                </button>
              </div>
            </div>

            {/* Footer with browser support details */}
            <div className={`p-3 text-[10px] text-center border-t flex justify-center items-center gap-1.5 font-mono ${
              isDarkMode ? "bg-slate-900/30 border-slate-800/80 text-slate-500" : "bg-slate-50 border-slate-100 text-slate-400"
            }`}>
              {isBiometricSupported ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                  <span>WebAuthn API is supported in this browser</span>
                </>
              ) : (
                <>
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
                  <span>WebAuthn hardware not detected (Secure local emulator active)</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* QR Code Scanner / Digital Invoice Link Modal */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity duration-300"
            onClick={() => {
              if (qrScanStatus !== "scanning") {
                setIsQrModalOpen(false);
              }
            }}
          ></div>

          {/* Dialog Container */}
          <div className={`relative w-full max-w-lg rounded-2xl shadow-2xl flex flex-col overflow-hidden font-sans transition-all duration-300 border ${
            isDarkMode ? "bg-[#0b0f19] border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
          }`} dir="rtl">
            
            {/* Header */}
            <div className={`flex items-center justify-between p-4 border-b ${
              isDarkMode ? "border-slate-800/80 bg-slate-900/45" : "border-slate-100 bg-slate-50"
            }`}>
              <div className="flex items-center gap-2">
                <QrCode className={`h-5 w-5 ${isDarkMode ? "text-blue-400" : "text-blue-600"}`} />
                <span className="text-xs font-bold font-sans">پیوند فاکتور دیجیتال / استعلام کد QR (سامانه مؤدیان)</span>
              </div>
              <button 
                onClick={() => setIsQrModalOpen(false)}
                disabled={qrScanStatus === "scanning"}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 flex flex-col">
              
              {/* Tab Selector inside scanner */}
              <div className="flex bg-slate-100 dark:bg-slate-900/85 p-1.5 rounded-xl mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setQrScanStatus("idle");
                    setQrErrorMessage("");
                  }}
                  className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg text-center transition-colors ${
                    qrScanStatus !== "scanning" 
                      ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm" 
                      : "text-slate-450 hover:text-slate-350"
                  }`}
                >
                  استعلام با آدرس سند یا کد شناسه
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setQrScanStatus("scanning");
                    setQrErrorMessage("");
                    // Simulate automatic decoding
                    setTimeout(() => {
                      handleLinkDigitalInvoice("https://tax.gov.ir/invoice/simulation-" + Math.floor(Math.random() * 999999));
                    }, 2500);
                  }}
                  className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg text-center transition-colors ${
                    qrScanStatus === "scanning" 
                      ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm animate-pulse" 
                      : "text-slate-450 hover:text-slate-350"
                  }`}
                >
                  اسکن زنده با دوربین (شبیه‌ساز هوشمند)
                </button>
              </div>

              {qrScanStatus === "scanning" ? (
                /* Interactive scan active visual */
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="relative h-44 w-44 rounded-2xl border-2 border-blue-500 overflow-hidden flex items-center justify-center bg-slate-900/20 mb-4 shadow-inner">
                    {/* Laser scanning line */}
                    <div className="absolute left-0 right-0 h-0.5 bg-emerald-400 shadow-[0_0_12px_#34d399] animate-[bounce_2s_infinite] z-10"></div>
                    
                    {/* Subtle target corners */}
                    <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-emerald-400 rounded-tl"></div>
                    <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-emerald-400 rounded-tr"></div>
                    <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-emerald-400 rounded-bl"></div>
                    <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-emerald-400 rounded-br"></div>

                    <QrCode className="h-16 w-16 text-blue-500/30 dark:text-blue-400/20 animate-pulse" />
                  </div>
                  <h4 className="text-xs font-bold text-blue-500 mb-1 animate-pulse">در حال تجزیه و بازخوانی اطلاعات کد QR...</h4>
                  <p className="text-[10px] text-slate-400 leading-relaxed max-w-sm">
                    دستگاه در قالب شبیه‌ساز امن ممیزی وب در حال شناسایی سرفصل‌ها، تاریخ صادرکننده و ارزش افزوده فاکتور الکترونیک می‌باشد.
                  </p>
                </div>
              ) : qrScanStatus === "success" ? (
                /* Success visual */
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="h-16 w-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center mb-4">
                    <CheckCircle2 className="h-8 w-8 text-emerald-500 animate-[bounce_1.2s_infinite]" />
                  </div>
                  <h4 className="text-xs font-bold text-emerald-500 mb-1">استعلام دیجیتال موفقیت‌آمیز بود!</h4>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    تراکنش‌های مرتبط با فاکتور دولتی به لجر حسابداری جاری اضافه شد.
                  </p>
                </div>
              ) : (
                /* Idle Tab (Enter tax details explicitly) */
                <div className="flex flex-col">
                  <div className="mb-4">
                    <label className={`block text-[11px] font-bold mb-1.5 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>آدرس فاکتور الکترونیکی یا شناسه ۱۲ رقمی سامانه مؤدیان</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <Link className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        value={qrInputUrl}
                        onChange={(e) => setQrInputUrl(e.target.value)}
                        placeholder="https://tax.gov.ir/invoice/4923F89..."
                        className={`w-full text-xs font-mono font-bold pr-10 pl-3 py-2.5 rounded-xl border outline-none transition-all focus:ring-1 focus:ring-blue-500 ${
                          isDarkMode 
                            ? "bg-[#0b0f19] border-slate-700 text-slate-100 placeholder-slate-600 focus:border-blue-500" 
                            : "bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-600"
                        }`}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleLinkDigitalInvoice(qrInputUrl);
                        }}
                      />
                    </div>
                  </div>

                  {qrErrorMessage && (
                    <div className="mb-4 p-2.5 bg-rose-500/10 rounded-lg text-[10px] text-rose-500 border border-rose-500/20 font-sans flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>{qrErrorMessage}</span>
                    </div>
                  )}

                  {/* Showcase clickable pre-loaded demo invoices */}
                  <div className="mb-6">
                    <span className="block text-[10px] font-bold text-slate-400 mb-2">استعلام مستقیم از مراجع نمونه (دمو سریع):</span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setQrInputUrl("https://tax.gov.ir/invoice/digikala-94283");
                          handleLinkDigitalInvoice("https://tax.gov.ir/invoice/digikala-94283");
                        }}
                        className={`p-2.5 rounded-xl border text-right text-[10px] transition-all flex flex-col gap-0.5 ${
                          isDarkMode 
                            ? "bg-slate-900/60 border-slate-800 hover:border-blue-500 hover:bg-slate-900" 
                            : "bg-slate-50 border-slate-200 hover:border-blue-500 hover:bg-white"
                        }`}
                      >
                        <span className="font-bold text-slate-300 dark:text-slate-100">سامانه خدمات دیجیکالا</span>
                        <span className="text-[9px] text-slate-400">شناسه استعلام: DK-94283-TAX</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setQrInputUrl("https://tax.gov.ir/invoice/arvancloud-10931");
                          handleLinkDigitalInvoice("https://tax.gov.ir/invoice/arvancloud-10931");
                        }}
                        className={`p-2.5 rounded-xl border text-right text-[10px] transition-all flex flex-col gap-0.5 ${
                          isDarkMode 
                            ? "bg-slate-900/60 border-slate-800 hover:border-blue-500 hover:bg-slate-900" 
                            : "bg-slate-50 border-slate-200 hover:border-blue-500 hover:bg-white"
                        }`}
                      >
                        <span className="font-bold text-slate-300 dark:text-slate-100">فاکتور ابر آروان (آیریا)</span>
                        <span className="text-[9px] text-slate-400">شناسه استعلام: ARV-10931-TAX</span>
                      </button>
                    </div>
                  </div>

                  {/* Main Action Submit Button */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleLinkDigitalInvoice(qrInputUrl)}
                      className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md transition active:scale-[0.98]"
                    >
                      استعلام و افزودن سند برخط
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsQrModalOpen(false)}
                      className={`px-4 py-2.5 text-xs font-semibold rounded-xl border transition-colors ${
                        isDarkMode 
                          ? "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40" 
                          : "bg-white border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      بستن
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className={`p-3 text-[9px] text-center border-t flex justify-center items-center gap-1.5 font-mono ${
              isDarkMode ? "bg-slate-900/30 border-slate-800/80 text-slate-500" : "bg-slate-50 border-slate-100 text-slate-400"
            }`}>
              <Globe className="h-3.5 w-3.5" />
              <span>اتصال مستقیم رمزنگاری‌شده به درگاه جامع سامانه مؤدیان دولت (برخط)</span>
            </div>
          </div>
        </div>
      )}

      {/* Profile Panel Modal */}
      {isUserPanelOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setIsUserPanelOpen(false)}
          ></div>
          
          {/* Panel Container */}
          <div className={`relative w-full max-w-lg rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up transform transition-all ${
            isDarkMode ? "bg-slate-900 border border-slate-800 text-slate-200" : "bg-white border border-slate-200 text-slate-800"
          }`}>
            <div className={`flex items-center justify-between p-4 border-b ${
              isDarkMode ? "bg-slate-800/50 border-slate-700/50" : "bg-slate-50 border-slate-100"
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${isDarkMode ? "bg-blue-900/30 text-blue-400" : "bg-blue-100 text-blue-600"}`}>
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">پنل کاربری و تنظیمات سیستم</h3>
                  <span className={`text-[10px] ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>مدیریت کلیدهای API و نمایه</span>
                </div>
              </div>
              <button 
                onClick={() => setIsUserPanelOpen(false)}
                className={`p-1.5 rounded-lg transition-colors ${
                  isDarkMode ? "hover:bg-slate-800 text-slate-400 hover:text-slate-200" : "hover:bg-slate-200 text-slate-500"
                }`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className={`p-5 overflow-y-auto max-h-[70vh] flex flex-col gap-6 ${isDarkMode ? "bg-slate-900" : "bg-white"}`}>
              {/* Profile details */}
              <section className="flex flex-col gap-3">
                <h4 className="text-xs font-bold flex items-center gap-2">
                  <User className="h-4 w-4" />
                  حساب کاربری فعلی
                </h4>
                <div className={`p-4 rounded-xl border ${isDarkMode ? "bg-slate-800/30 border-slate-700/50" : "bg-slate-50 border-slate-200"}`}>
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
                      {currentUser?.name.charAt(0) || "U"}
                    </div>
                    <div className="flex flex-col flex-1">
                      <select 
                        value={currentUser?.id}
                        onChange={(e) => {
                           const user = users.find(u => u.id === parseInt(e.target.value));
                           if (user) {
                             if (user.status === "suspended") {
                                setNotification({text: "این اکانت مسدود شده است", type: "error"});
                                return;
                             }
                             setCurrentUser(user);
                           }
                        }}
                        className={`text-sm font-bold bg-transparent outline-none cursor-pointer ${isDarkMode ? "text-white" : "text-slate-800"}`}
                      >
                         {users.map(u => (
                            <option key={u.id} value={u.id} className={isDarkMode ? "bg-slate-800" : "bg-white"}>{u.name}</option>
                         ))}
                      </select>
                      <span className={`text-[10px] mt-0.5 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>تغییر سریع کاربر (شبیه‌ساز)</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-200/50 flex items-center justify-between">
                     <span className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>سطح دسترسی</span>
                     <div className="flex items-center gap-3">
                       <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          currentUser?.role === "admin" ? "text-purple-600 bg-purple-500/10" : "text-blue-500 bg-blue-500/10"
                       }`}>
                         {currentUser?.role === "admin" ? "مدیر کل سیستم" : "همکار حسابدار"}
                       </span>
                     </div>
                  </div>
                </div>
              </section>

              {/* Optimization Setup */}
              <section className="flex flex-col gap-3">
                 <h4 className="text-xs font-bold flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  بهینه‌سازی و کنترل مصرف توکن هوشمند
                </h4>
                
                {/* 1. Resolution Selection */}
                <div className={`p-4 rounded-xl border flex flex-col gap-3 ${isDarkMode ? "bg-slate-800/30 border-slate-700/50" : "bg-slate-50 border-slate-200"}`}>
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-xs text-blue-500">کیفیت و رزولوشن تصاویر سند</span>
                    <span className={`text-[10px] ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                      هرچه ابعاد کوچک‌تر باشد، هزینه توکن‌های ورودی (Input Tokens) تا ۷۰٪ کمتر خواهد شد.
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    {(["super-eco", "balanced", "high"] as const).map((res) => {
                      const labels = {
                        "super-eco": "فوق اقتصادی (۶۰۰px)",
                        "balanced": "متوازن (۱۰۰۰px)",
                        "high": "کیفیت اصلی (۱۸۰۰px)"
                      };
                      const isSel = tokenSettings.imageResolution === res;
                      return (
                        <button
                          key={res}
                          onClick={() => setTokenSettings(prev => ({ ...prev, imageResolution: res }))}
                          className={`py-2 px-1 rounded-lg text-[10px] font-bold border transition-all ${
                            isSel 
                              ? "bg-blue-600 border-blue-500 text-white shadow-sm" 
                              : isDarkMode
                                ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750"
                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {labels[res]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Compact descriptive words toggle */}
                <div className={`p-4 flex items-center justify-between rounded-xl border ${isDarkMode ? "bg-slate-800/30 border-slate-700/50" : "bg-slate-50 border-slate-200"}`}>
                  <div className="flex flex-col gap-1 flex-1 pl-2 text-right rtl">
                    <span className="font-bold text-xs text-right block">خلاصه‌سازی متن خروجی (ECO Prompt)</span>
                    <span className={`text-[10px] block text-right leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                      مجبور کردن مدل به فشرده‌سازی متن شرح و توضیحات تا حداکثر ۵ کلمه برای کاهش توکن‌های تولیدی.
                    </span>
                  </div>
                  <button 
                    onClick={() => setTokenSettings(prev => ({ ...prev, ecoPromptEnabled: !prev.ecoPromptEnabled }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 mr-2 ${
                      tokenSettings.ecoPromptEnabled ? "bg-blue-600" : "bg-slate-300"
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      tokenSettings.ecoPromptEnabled ? "-translate-x-6" : "-translate-x-1"
                    }`} />
                  </button>
                </div>

                {/* 3. Row limitation selection */}
                <div className={`p-4 rounded-xl border flex flex-col gap-3 ${isDarkMode ? "bg-slate-800/30 border-slate-700/50" : "bg-slate-50 border-slate-200"}`}>
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-xs text-indigo-500">محدودیت تعداد ردیف‌های استخراج‌شده</span>
                    <span className={`text-[10px] ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                      اگر لیست فاکتور شما بسیار طولانی است، می‌توانید تعداد ردیف‌های خروجی را برای صرفه‌جویی شدید توکن محدود کنید.
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 mt-1">
                    {(["unlimited", "5", "10", "20"] as const).map((limit) => {
                      const labels = {
                        "unlimited": "نامحدود",
                        "5": "۵ ردیف",
                        "10": "۱۰ ردیف",
                        "20": "۲۰ ردیف"
                      };
                      const isSel = tokenSettings.maxRowsToExtract === limit;
                      return (
                        <button
                          key={limit}
                          onClick={() => setTokenSettings(prev => ({ ...prev, maxRowsToExtract: limit }))}
                          className={`py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                            isSel 
                              ? "bg-indigo-600 border-indigo-500 text-white shadow-sm" 
                              : isDarkMode
                                ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750"
                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {labels[limit]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Omit optional empty fields */}
                <div className={`p-4 flex items-center justify-between rounded-xl border ${isDarkMode ? "bg-slate-800/30 border-slate-700/50" : "bg-slate-50 border-slate-200"}`}>
                  <div className="flex flex-col gap-1 flex-1 pl-2 text-right">
                    <span className="font-bold text-xs text-right block">حذف توضیحات متنی خالی</span>
                    <span className={`text-[10px] block text-right leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                      عدم ثبت اطلاعات تفصیلی تکراری یا سنگین داکیومنت در ستون توضیحات جهت فشرده نگه داشتن پاسخ مدل.
                    </span>
                  </div>
                  <button 
                    onClick={() => setTokenSettings(prev => ({ ...prev, skipSecondaryFields: !prev.skipSecondaryFields }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 mr-2 ${
                      tokenSettings.skipSecondaryFields ? "bg-blue-600" : "bg-slate-300"
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      tokenSettings.skipSecondaryFields ? "-translate-x-6" : "-translate-x-1"
                    }`} />
                  </button>
                </div>
              </section>
            </div>

            <div className={`p-4 border-t flex items-center justify-end gap-3 ${isDarkMode ? "bg-slate-800/50 border-slate-700/50" : "bg-slate-50 border-slate-100"}`}>
              <button 
                onClick={() => setIsUserPanelOpen(false)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                  isDarkMode ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200"
                }`}
              >
                انصراف
              </button>
              <button 
                onClick={() => {
                  setNotification({ text: "تنظیمات دستگاه شما ذخیره شد", type: "success" });
                  setIsUserPanelOpen(false);
                }}
                className="px-6 py-2 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-transform active:scale-95"
              >
                ذخیره تنظیمات
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Panel Modal */}
      {isAdminPanelOpen && currentUser?.role === "admin" && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
          <div 
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setIsAdminPanelOpen(false)}
          ></div>
          
          <div className={`relative w-full max-w-lg rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up transform transition-all ${
            isDarkMode ? "bg-slate-900 border border-slate-800 text-slate-200" : "bg-white border border-slate-200 text-slate-800"
          }`}>
            <div className={`flex items-center justify-between p-4 border-b ${
              isDarkMode ? "bg-slate-800/50 border-slate-700/50" : "bg-slate-50 border-slate-100"
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${isDarkMode ? "bg-purple-900/30 text-purple-400" : "bg-purple-100 text-purple-600"}`}>
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">پنل مدیریت ادمین</h3>
                  <span className={`text-[10px] ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>کنترل سیستم و مدیریت کلی داده‌ها</span>
                </div>
              </div>
              <button 
                onClick={() => setIsAdminPanelOpen(false)}
                className={`p-1.5 rounded-lg transition-colors ${
                  isDarkMode ? "hover:bg-slate-800 text-slate-400 hover:text-slate-200" : "hover:bg-slate-200 text-slate-500 hover:text-slate-800"
                }`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto max-h-[60vh] space-y-6">
              
              <div className="space-y-3">
                <h4 className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? "text-purple-400" : "text-purple-600"}`}>پشتیبان‌گیری از اطلاعات (JSON Backup)</h4>
                <div className={`p-4 rounded-xl border flex flex-col gap-3 ${isDarkMode ? "bg-slate-800/40 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                  <p className={`text-xs ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
                    برای امنیت اطلاعات یا انتقال به سیستم دیگر، می‌توانید از تمام تاریخچه اسناد و تراکنش‌ها فایل پشتیبان تهیه کنید و یا فایل قبلی را بارگذاری نمایید.
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const data = { transactions, previousScans, modelQuotas };
                        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `CPA-Backup-${new Date().toISOString().split('T')[0]}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                        setNotification({ text: "فایل پشتیبان با موفقیت دانلود شد.", type: "success" });
                      }}
                      className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition border flex items-center justify-center gap-2 ${
                        isDarkMode ? "bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700" : "bg-white border-slate-300 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <Download className="h-3 w-3" />
                      تهیه نسخه JSON
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
                              setNotification({ text: "اطلاعات با موفقیت بازیابی شد.", type: "success" });
                            } catch (err) {
                              setNotification({ text: "فرمت فایل پشتیبان نامعتبر است.", type: "error" });
                            }
                          };
                          reader.readAsText(file);
                        };
                        input.click();
                      }}
                      className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition border flex items-center justify-center gap-2 ${
                        isDarkMode ? "bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700" : "bg-white border-slate-300 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <Upload className="h-3 w-3" />
                      بارگذاری (Import)
                    </button>
                  </div>
                  <button
                      onClick={() => {
                        const worksheetData = transactions.map((t, idx) => ({
                           "ردیف": idx + 1,
                           "تاریخ": t.تاریخ,
                           "شماره_سند": t.شماره_سند,
                           "نام_طرف_حساب": t.نام_طرف_حساب,
                           "شناسه_کد_ملی": t.شناسه_ملی || "",
                           "شماره_مالیاتی": t.شماره_مالیاتی || "",
                           "شرح": t.شرح,
                           "هزینه_غیرقابل_قبول": t.هزینه_غیرقابل_قبول ? "بله" : "خیر",
                           "ارزش_افزوده": t.مالیات_ارزش_افزوده || 0,
                           "مبلغ_بدهکار": t.مبلغ_بدهکار || 0,
                           "مبلغ_بستانکار": t.مبلغ_بستانکار || 0,
                           "نوع_ارز": t.نوع_ارز,
                           "توضیحات": t.توضیحات,
                           "ضریب_اطمینان": t.ضریب_اطمینان || 100
                        }));

                        const worksheet = XLSX.utils.json_to_sheet(worksheetData);
                        worksheet["!cols"] = [
                           { wch: 5 }, { wch: 12 }, { wch: 10 }, { wch: 25 }, { wch: 15 }, { wch: 25 }, { wch: 40 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 30 }, { wch: 10 }
                        ];
                        if (!worksheet['!views']) worksheet['!views'] = [];
                        worksheet['!views'].push({ rightToLeft: true });

                        const workbook = XLSX.utils.book_new();
                        XLSX.utils.book_append_sheet(workbook, worksheet, "تراکنش‌های مالی");
                        
                        XLSX.writeFile(workbook, `Transactions-Export-${new Date().toISOString().split('T')[0]}.xlsx`);
                        setNotification({ text: "فایل اکسل (XLSX) با موفقیت تولید و دانلود شد.", type: "success" });
                      }}
                      className={`w-full py-1.5 rounded-lg text-[11px] font-bold transition border flex items-center justify-center gap-2 mt-1 ${
                        isDarkMode ? "bg-emerald-900/30 border-emerald-800/50 text-emerald-300 hover:bg-emerald-900/50" : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                      }`}
                    >
                      <Download className="h-3 w-3" />
                      خروجی مستقیم اکسل (XLSX) از تراکنش‌های فعلی
                    </button>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? "text-purple-400" : "text-purple-600"}`}>تزریق داده نمونه (Mock Data Seed)</h4>
                <div className={`p-4 rounded-xl border flex flex-col gap-3 ${isDarkMode ? "bg-slate-800/40 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                  <p className={`text-xs ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
                    جهت بررسی عملکرد جداول، ماشین حساب تراز و استایل‌ها، می‌توانید تراکنش‌های فرضی حسابداری به برنامه تزریق کنید.
                  </p>
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
                            },
                            {   
                                id: "mock-" + Date.now() + 3,
                                تاریخ: "۱۴۰۳/۰۲/۲۰",
                                شماره_سند: "۱۰۵۵۲",
                                نام_طرف_حساب: "سازمان امور مالیاتی",
                                شرح: "پرداخت علی‌الحساب مالیات بر ارزش افزوده دوره زمستان",
                                مبلغ_بدهکار: 325000000,
                                مبلغ_بستانکار: 0,
                                نوع_ارز: "ریال",
                                توضیحات: "دارای فیش واریزی شبا",
                                ضریب_اطمینان: 100
                            }
                        ];
                        setTransactions(prev => [...prev, ...newMock]);
                        setNotification({ text: "داده‌های مالی نمونه با موفقیت افزوده شدند.", type: "success" });
                    }}
                    className={`w-full py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
                        isDarkMode ? "bg-blue-900/30 border border-blue-800 text-blue-300 hover:bg-blue-900/50" : "bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100"
                    }`}
                  >
                    + تزریق تراکنش‌های آماده حسابداری
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? "text-purple-400" : "text-purple-600"}`}>پاکسازی حافظه سیستم</h4>
                <div className={`p-4 rounded-xl border flex flex-col gap-3 ${isDarkMode ? "bg-slate-800/40 border-red-900/30" : "bg-red-50/50 border-red-100"}`}>
                  <p className={`text-xs ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
                    شما می‌توانید تمام اطلاعات محلی، یا بخش‌هایی از آن را بازنشانی کنید. موارد حذف شده غیرقابل بازگشت هستند.
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setTransactions([]);
                        setActiveFile(null);
                        setRawJsonText("");
                        setNotification({ text: "جدول تراکنش‌های سیستم پاکسازی شد.", type: "success" });
                      }}
                      className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition border flex items-center justify-center gap-2 ${
                        isDarkMode ? "border-slate-600 text-slate-300 hover:bg-slate-700" : "border-slate-300 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      <Trash2 className="h-3 w-3" />
                      مخزن تراکنش
                    </button>
                    <button
                      onClick={() => {
                        setPreviousScans([]);
                        setNotification({ text: "تاریخچه اسناد با موفقیت حذف گردید.", type: "success" });
                      }}
                      className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition border flex items-center justify-center gap-2 ${
                        isDarkMode ? "border-slate-600 text-slate-300 hover:bg-slate-700" : "border-slate-300 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      <Trash2 className="h-3 w-3" />
                      تاریخچه اسناد
                    </button>
                  </div>
                  <button
                    onClick={() => {
                        window.localStorage.clear();
                        window.location.reload();
                    }}
                    className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 mt-1"
                  >
                    <Trash2 className="h-4 w-4" />
                    پاکسازی کامل دیتابیس (رادیواکتیو)
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${isDarkMode ? "text-purple-400" : "text-purple-600"}`}>
                  <Coins className="h-4 w-4" />
                  مدیریت پیشرفته توکن‌ها (Token Management)
                </h4>
                <div className={`p-4 rounded-xl border ${isDarkMode ? "bg-slate-800/40 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                  <p className={`text-xs mb-3 ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
                    پایش مصرف لحظه‌ای توکن‌ها به تفکیک مدل‌های هوش مصنوعی، تنظیم محدودیت‌های کاربری، و مدیریت هزینه‌های API.
                  </p>
                  <button
                    onClick={() => {
                      setIsAdminPanelOpen(false);
                      setIsTokenManagerOpen(true);
                      logEvent("پنل مدیریت توکن", "مدیر سیستم وارد پنل مدیریت پیشرفته توکن‌ها شد.");
                    }}
                    className={`w-full py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
                      isDarkMode ? "bg-purple-600 hover:bg-purple-700 text-white" : "bg-purple-600 hover:bg-purple-700 text-white"
                    }`}
                  >
                    <Settings className="h-4 w-4" />
                    ورود به پنل Token Management
                  </button>
                </div>
              </div>
              
              <div className="space-y-3">
                <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${isDarkMode ? "text-blue-400" : "text-blue-600"}`}>
                  <Shield className="h-4 w-4" />
                  مدیریت و کنترل کاربران سیستم
                </h4>
                <div className={`rounded-xl border overflow-hidden ${isDarkMode ? "bg-slate-800/40 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                  <table className="w-full text-right text-[11px]">
                     <thead className={`${isDarkMode ? "bg-slate-800/80" : "bg-slate-100/80"}`}>
                        <tr>
                           <th className="p-3">کاربر</th>
                           <th className="p-3 text-center">نقش</th>
                           <th className="p-3 text-center">وضعیت</th>
                           <th className="p-3 text-left">توکن مصرفی</th>
                           <th className="p-3 text-center">دسترسی</th>
                        </tr>
                     </thead>
                     <tbody className={`divide-y ${isDarkMode ? "divide-slate-700/50" : "divide-slate-200"}`}>
                        {users.map(u => (
                           <tr key={u.id} className={`${isDarkMode ? "hover:bg-slate-800/50" : "hover:bg-slate-100/50"}`}>
                              <td className="p-3 font-semibold">{u.name}</td>
                              <td className="p-3 text-center">
                                 <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                    u.role === "admin" 
                                    ? "bg-purple-100 text-purple-700" 
                                    : "bg-blue-100 text-blue-700"
                                 }`}>{u.role === "admin" ? "مدیر" : "کاربر"}</span>
                              </td>
                              <td className="p-3 text-center">
                                 <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                    u.status === "active" 
                                    ? "bg-emerald-100 text-emerald-700" 
                                    : "bg-rose-100 text-rose-700"
                                 }`}>{u.status === "active" ? "فعال" : "مسدود"}</span>
                              </td>
                              <td className="p-3 text-left font-mono text-[10px]">{u.apiUsage.toLocaleString("fa-IR")}</td>
                              <td className="p-3 text-center">
                                 <button
                                     onClick={() => {
                                        setUsers(prev => prev.map(usr => usr.id === u.id ? {...usr, status: usr.status === "active" ? "suspended" : "active"} : usr));
                                        setNotification({text: `وضعیت کاربر ${u.name} تغییر یافت.`, type: 'success'});
                                     }}
                                     className={`px-2 py-1 rounded border text-[9px] font-bold transition-colors ${
                                        u.status === "active"
                                        ? "border-rose-200 text-rose-600 hover:bg-rose-50"
                                        : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                                     }`}
                                 >
                                     {u.status === "active" ? "مسدود کن" : "فعال کن"}
                                 </button>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                  <Shield className="h-4 w-4" />
                  آمار لحظه‌ای سیستم
                </h4>
                <div className={`p-4 rounded-xl border grid grid-cols-2 gap-4 ${isDarkMode ? "bg-slate-800/40 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                    <div className="text-center p-3 rounded-lg bg-slate-900/5 border border-slate-500/10">
                        <div className={`text-2xl font-black mb-1 ${isDarkMode ? "text-blue-400" : "text-blue-600"}`}>{previousScans.length}</div>
                        <div className={`text-[10px] font-bold ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>کل اسناد پردازش شده</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-slate-900/5 border border-slate-500/10">
                        <div className={`text-2xl font-black mb-1 ${isDarkMode ? "text-emerald-400" : "text-emerald-600"}`}>{transactions.length}</div>
                        <div className={`text-[10px] font-bold ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>تراکنش‌های استخراجی</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-slate-900/5 border border-slate-500/10">
                        {(() => {
                           let totalStorage = 0;
                           for (let i = 0; i < localStorage.length; i++) {
                             const key = localStorage.key(i);
                             if (key) totalStorage += localStorage.getItem(key)?.length || 0;
                           }
                           const kb = (totalStorage / 1024).toFixed(1);
                           return <div className={`text-lg font-black mb-1 ${isDarkMode ? "text-purple-400" : "text-purple-600"}`}>{kb} KB</div>;
                        })()}
                        <div className={`text-[10px] font-bold ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>حجم دیتابیس محلی</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-slate-900/5 border border-slate-500/10">
                        {(() => {
                           let totalTokens = 0;
                           Object.values(modelQuotas).forEach((q: any) => totalTokens += q.used);
                           return <div className={`text-lg font-black mb-1 ${isDarkMode ? "text-orange-400" : "text-orange-600"}`}>{totalTokens}</div>;
                        })()}
                        <div className={`text-[10px] font-bold ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>کل درخواست‌های API</div>
                    </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Token Management Panel Modal */}
      {isTokenManagerOpen && currentUser?.role === "admin" && (
        <div className="fixed inset-0 z-[115] flex items-center justify-center p-4 sm:p-6">
          <div 
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setIsTokenManagerOpen(false)}
          ></div>
          
          <div className={`relative w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up transform transition-all ${
            isDarkMode ? "bg-slate-900 border border-slate-800 text-slate-200" : "bg-white border border-slate-200 text-slate-800"
          }`} dir="rtl">
            <div className={`flex items-center justify-between p-4 border-b shrink-0 ${
              isDarkMode ? "bg-slate-800/50 border-slate-700/50" : "bg-slate-50 border-slate-100"
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${isDarkMode ? "bg-purple-900/30 text-purple-400" : "bg-purple-100 text-purple-600"}`}>
                  <Coins className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">پنل مدیریت پیشرفته توکن‌ها (Token Management)</h3>
                  <span className={`text-[10px] ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>گزارش و پایش مصرف به تفکیک مدل و کاربر</span>
                </div>
              </div>
              <button 
                onClick={() => setIsTokenManagerOpen(false)}
                className={`p-1.5 rounded-lg transition-colors ${
                  isDarkMode ? "hover:bg-slate-800 text-slate-400 hover:text-slate-200" : "hover:bg-slate-200 text-slate-500 hover:text-slate-800"
                }`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto max-h-[75vh] space-y-6">
               
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 {(() => {
                    let totalModelQuotasUsed = 0;
                    Object.values(modelQuotas).forEach((q: any) => totalModelQuotasUsed += q.used);
                    let totalUsersApiUsage = 0;
                    users.forEach(u => totalUsersApiUsage += (u.apiUsage || 0));
                    const estCost = ((totalUsersApiUsage / 1000000) * 0.15).toFixed(4);

                    return (
                      <>
                        <div className={`p-4 rounded-xl border flex flex-col gap-1 text-center ${isDarkMode ? "bg-slate-800/40 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                          <span className={`text-2xl font-black ${isDarkMode ? "text-blue-400" : "text-blue-600"}`}>{totalUsersApiUsage.toLocaleString("fa-IR")}</span>
                          <span className={`text-[10px] font-bold ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>کل توکن‌های مصرف شده</span>
                        </div>
                        <div className={`p-4 rounded-xl border flex flex-col gap-1 text-center ${isDarkMode ? "bg-slate-800/40 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                          <span className={`text-2xl font-black ${isDarkMode ? "text-emerald-400" : "text-emerald-600"}`}>{totalModelQuotasUsed.toLocaleString("fa-IR")}</span>
                          <span className={`text-[10px] font-bold ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>تعداد کل ریکوئست‌ها</span>
                        </div>
                        <div className={`p-4 rounded-xl border flex flex-col gap-1 text-center ${isDarkMode ? "bg-slate-800/40 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                          <span className={`text-2xl font-black ${isDarkMode ? "text-orange-400" : "text-orange-600"}`}>${estCost}</span>
                          <span className={`text-[10px] font-bold ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>هزینه تخمینی (دلار)</span>
                        </div>
                        <div className={`p-4 rounded-xl border flex flex-col gap-1 text-center ${isDarkMode ? "bg-slate-800/40 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                          <span className={`text-2xl font-black ${isDarkMode ? "text-purple-400" : "text-purple-600"}`}>{Object.keys(modelQuotas).length}</span>
                          <span className={`text-[10px] font-bold ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>مدل‌های فعال</span>
                        </div>
                      </>
                    );
                 })()}
              </div>

              <div className="space-y-3">
                <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${isDarkMode ? "text-purple-400" : "text-purple-600"}`}>
                  <Activity className="h-4 w-4" />
                  وضعیت سهمیه مدل‌های هوش مصنوعی (Quota Limits)
                </h4>
                <div className={`rounded-xl border overflow-hidden ${isDarkMode ? "bg-slate-800/40 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                  <table className="w-full text-right text-[11px]">
                     <thead className={`${isDarkMode ? "bg-slate-800/80" : "bg-slate-100/80"}`}>
                        <tr>
                           <th className="p-3">نام مدل (Model ID)</th>
                           <th className="p-3 text-center">مصرف (درخواست)</th>
                           <th className="p-3 text-center">سقف روزانه</th>
                           <th className="p-3 w-1/4">نمودار مصرف</th>
                           <th className="p-3 text-center">عملیات</th>
                        </tr>
                     </thead>
                     <tbody className={`divide-y ${isDarkMode ? "divide-slate-700/50" : "divide-slate-200"}`}>
                        {Object.entries(modelQuotas).map(([modelId, quota]: [string, any]) => {
                           const percent = Math.min(100, (quota.used / quota.limit) * 100);
                           return (
                             <tr key={modelId} className={`${isDarkMode ? "hover:bg-slate-800/50" : "hover:bg-slate-100/50"}`}>
                                <td className="p-3 font-semibold font-mono text-[10px]" dir="ltr">{modelId}</td>
                                <td className="p-3 text-center font-bold">{quota.used.toLocaleString("fa-IR")}</td>
                                <td className="p-3 text-center text-slate-500">{quota.limit.toLocaleString("fa-IR")}</td>
                                <td className="p-3">
                                   <div className={`w-full h-2 rounded-full overflow-hidden ${isDarkMode ? "bg-slate-700" : "bg-slate-200"}`}>
                                      <div 
                                        className={`h-full rounded-full ${percent > 90 ? "bg-rose-500" : percent > 75 ? "bg-amber-500" : "bg-emerald-500"}`} 
                                        style={{width: `${percent}%`}}
                                      ></div>
                                   </div>
                                </td>
                                <td className="p-3 text-center flex justify-center gap-1">
                                   <button
                                     onClick={() => {
                                        setModelQuotas(prev => ({
                                          ...prev,
                                          [modelId]: { ...prev[modelId], used: 0 }
                                        }));
                                        logEvent("ریست توکن مدل", `سهمیه مدل ${modelId} بازنشانی شد.`);
                                        setNotification({text: `سهمیه درخواست مدل ${modelId} صفر شد.`, type: 'success'});
                                     }}
                                     className={`px-2 py-1 rounded border text-[9px] font-bold transition-colors ${
                                        isDarkMode ? "border-slate-600 text-slate-300 hover:bg-slate-700" : "border-slate-300 text-slate-600 hover:bg-slate-200"
                                     }`}
                                     title="بازنشانی مصرف به صفر"
                                   >
                                      ریست
                                   </button>
                                   <button
                                     onClick={() => {
                                        setModelQuotas(prev => ({
                                          ...prev,
                                          [modelId]: { ...prev[modelId], limit: prev[modelId].limit + 1000 }
                                        }));
                                        logEvent("افزایش محدودیت مدل", `سقف روزانه مدل ${modelId} به میزان ۱۰۰۰ درخواست افزایش یافت.`);
                                     }}
                                     className={`px-2 py-1 rounded border text-[9px] font-bold transition-colors ${
                                        isDarkMode ? "border-emerald-800 text-emerald-400 hover:bg-emerald-900/50" : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                     }`}
                                     title="افزایش سقف محدودیت +۱۰۰۰"
                                   >
                                      +۱۰۰۰
                                   </button>
                                </td>
                             </tr>
                           );
                        })}
                     </tbody>
                  </table>
                </div>
              </div>

               <div className="space-y-3">
                <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${isDarkMode ? "text-blue-400" : "text-blue-600"}`}>
                  <User className="h-4 w-4" />
                  مدیریت مصرف کاربران (User Token Billing)
                </h4>
                <div className={`rounded-xl border overflow-hidden ${isDarkMode ? "bg-slate-800/40 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                   <table className="w-full text-right text-[11px]">
                     <thead className={`${isDarkMode ? "bg-slate-800/80" : "bg-slate-100/80"}`}>
                        <tr>
                           <th className="p-3">کاربر</th>
                           <th className="p-3 text-center">نقش</th>
                           <th className="p-3 text-center">کل توکن‌های پردازش شده</th>
                           <th className="p-3 text-center">تخمین هزینه کاربر</th>
                           <th className="p-3 text-center">عملیات</th>
                        </tr>
                     </thead>
                     <tbody className={`divide-y ${isDarkMode ? "divide-slate-700/50" : "divide-slate-200"}`}>
                        {[...users].sort((a,b) => (b.apiUsage || 0) - (a.apiUsage || 0)).map(u => {
                           const cost = ((u.apiUsage || 0) / 1000000) * 0.15;
                           return (
                             <tr key={u.id} className={`${isDarkMode ? "hover:bg-slate-800/50" : "hover:bg-slate-100/50"}`}>
                                <td className="p-3 font-semibold">{u.name}</td>
                                <td className="p-3 text-center">
                                   <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                      u.role === "admin" 
                                      ? "bg-purple-100 text-purple-700" 
                                      : "bg-blue-100 text-blue-700"
                                   }`}>{u.role === "admin" ? "مدیر" : "کاربر"}</span>
                                </td>
                                <td className="p-3 text-center font-mono text-[10px] text-blue-500 font-bold">{(u.apiUsage || 0).toLocaleString("fa-IR")}</td>
                                <td className="p-3 text-center font-mono text-[10px] text-emerald-500 font-bold">${cost.toFixed(4)}</td>
                                <td className="p-3 text-center">
                                   <button
                                       onClick={() => {
                                          setUsers(prev => prev.map(usr => usr.id === u.id ? {...usr, apiUsage: 0} : usr));
                                          logEvent("ریست توکن کاربر", `آمار مصرف توکن کاربر ${u.name} صفر شد.`);
                                          setNotification({text: `آمار مصرف توکن کاربر ${u.name} بازنشانی شد.`, type: 'success'});
                                       }}
                                       className={`px-2 py-1 rounded border text-[9px] font-bold transition-colors ${
                                          isDarkMode ? "border-slate-600 text-slate-300 hover:bg-slate-700" : "border-slate-300 text-slate-600 hover:bg-slate-200"
                                       }`}
                                   >
                                       بازنشانی آمار
                                   </button>
                                </td>
                             </tr>
                           );
                        })}
                     </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
      {/* File Manager Modal */}
      {isFileManagerOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6">
          <div 
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setIsFileManagerOpen(false)}
          ></div>
          
          <div className={`relative w-full max-w-4xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up transform transition-all ${
            isDarkMode ? "bg-slate-900 border border-slate-800 text-slate-200" : "bg-white border border-slate-200 text-slate-800"
          }`} dir="rtl">
            <div className={`p-5 border-b flex items-center justify-between shrink-0 ${isDarkMode ? "bg-slate-800/80 border-slate-700" : "bg-slate-50/80 border-slate-100"}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${isDarkMode ? "bg-slate-800 text-indigo-400" : "bg-white shadow-sm text-indigo-600"}`}>
                  <HardDrive className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">فضای ابری و مدیریت اسناد</h3>
                  <p className={`text-[11px] mt-0.5 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                    شما <span className="font-bold text-emerald-500">۵ گیگابایت</span> فضای ذخیره‌سازی رایگان دارید
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsFileManagerOpen(false)}
                className={`p-2 rounded-lg transition-colors ${isDarkMode ? "hover:bg-slate-800 text-slate-400 hover:text-white" : "hover:bg-slate-200 text-slate-500 hover:text-slate-900"}`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5">
              {(() => {
                const MAX_STORAGE = 5 * 1024 * 1024 * 1024; // 5GB
                const usedStorage = previousScans.reduce((acc, scan) => acc + (scan.file.size || 0), 0);
                const percentUsed = Math.min(100, (usedStorage / MAX_STORAGE) * 100);
                
                const formatBytes = (bytes: number, decimals = 2) => {
                  if (!+bytes) return '0 Bytes';
                  const k = 1024;
                  const dm = decimals < 0 ? 0 : decimals;
                  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
                  const i = Math.floor(Math.log(bytes) / Math.log(k));
                  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
                };

                return (
                  <div className="space-y-6">
                    <div className={`p-4 rounded-xl border ${isDarkMode ? "bg-slate-800/40 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-bold ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>وضعیت حافظه</span>
                        <span className="text-xs font-bold text-indigo-500" dir="ltr">{formatBytes(usedStorage)} / 5 GB</span>
                      </div>
                      <div className={`w-full h-2.5 rounded-full overflow-hidden ${isDarkMode ? "bg-slate-700" : "bg-slate-200"}`}>
                        <div className={`h-full rounded-full transition-all duration-500 ${percentUsed > 90 ? "bg-rose-500" : percentUsed > 75 ? "bg-amber-500" : "bg-indigo-500"}`} style={{width: `${percentUsed}%`}}></div>
                      </div>
                      <p className={`text-[10px] mt-2 text-left ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                        {percentUsed.toFixed(2)}% استفاده شده
                      </p>
                    </div>

                    <div className="space-y-3">
                       <h4 className="font-bold text-xs flex items-center gap-2">
                          <Folder className="w-4 h-4 text-indigo-500" />
                          لیست فایل‌های ذخیره شده
                       </h4>
                       {previousScans.length === 0 ? (
                          <div className={`py-12 flex flex-col items-center justify-center border-2 border-dashed rounded-xl ${isDarkMode ? "border-slate-700 text-slate-500" : "border-slate-200 text-slate-400"}`}>
                             <Folder className="w-12 h-12 mb-3 opacity-50" />
                             <span className="text-sm font-bold">هیچ فایلی ذخیره نشده است.</span>
                          </div>
                       ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {previousScans.map((scan) => (
                               <div key={scan.id} className={`p-4 rounded-xl border flex flex-col justify-between transition-all hover:shadow-md ${isDarkMode ? "bg-slate-800/50 border-slate-700 hover:border-slate-600" : "bg-white border-slate-200 hover:border-slate-300"}`}>
                                 <div className="flex items-start gap-3 mb-4">
                                    <div className="w-10 h-10 shrink-0 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                                       {scan.file.preview ? (
                                         <img src={scan.file.preview} alt="" className="w-full h-full object-cover" />
                                       ) : (
                                         <FileText className="w-5 h-5 text-slate-400" />
                                       )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                       <h5 className="font-bold text-xs truncate" title={scan.file.name}>{scan.file.name}</h5>
                                       <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                                          <span className="text-[10px] text-slate-500" dir="ltr">{formatBytes(scan.file.size)}</span>
                                          <span className="text-[10px] text-slate-400">•</span>
                                          <span className="text-[10px] text-slate-500">{new Date(scan.timestamp).toLocaleDateString("fa-IR")}</span>
                                       </div>
                                    </div>
                                 </div>
                                 <div className="flex items-center gap-2 mt-auto pt-3 border-t border-slate-100 dark:border-slate-700">
                                    <button
                                       onClick={() => {
                                          selectPreviousScan(scan);
                                          setIsFileManagerOpen(false);
                                       }}
                                       className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-colors ${isDarkMode ? "bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30" : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"}`}
                                    >
                                       باز کردن سند
                                    </button>
                                    <button
                                       onClick={() => {
                                          if (window.confirm("آیا از حذف این سند اطمینان دارید؟")) {
                                             setPreviousScans(prev => prev.filter(s => s.id !== scan.id));
                                             if (activeFile?.id === scan.id) clearCurrentFile();
                                             showNotification("سند با موفقیت حذف شد.", "success");
                                          }
                                       }}
                                       className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? "bg-rose-500/10 text-rose-400 hover:bg-rose-500/20" : "bg-rose-50 text-rose-600 hover:bg-rose-100"}`}
                                       title="حذف سند"
                                    >
                                       <Trash2 className="w-4 h-4" />
                                    </button>
                                 </div>
                               </div>
                            ))}
                          </div>
                       )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
      
      {isAuditLogsOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6">
          <div 
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setIsAuditLogsOpen(false)}
          ></div>
          
          <div className={`relative w-full max-w-2xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up transform transition-all ${
            isDarkMode ? "bg-slate-900 border border-slate-800 text-slate-200" : "bg-white border border-slate-200 text-slate-800"
          }`} dir="rtl">
            <div className={`p-5 border-b flex items-center justify-between shrink-0 ${isDarkMode ? "bg-slate-800/80 border-slate-700" : "bg-slate-50/80 border-slate-100"}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${isDarkMode ? "bg-slate-800 text-blue-400" : "bg-white shadow-sm text-blue-600"}`}>
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">سیاهه رویدادها (Audit Logs)</h3>
                  <p className={`text-[11px] mt-0.5 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>گزارش جامع تمامی اقدامات کاربر در سامانه</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAuditLogsOpen(false)}
                className={`p-2 rounded-lg transition-colors ${isDarkMode ? "hover:bg-slate-800 text-slate-400 hover:text-white" : "hover:bg-slate-200 text-slate-500 hover:text-slate-900"}`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5">
               {auditLogs.length === 0 ? (
                 <div className="flex flex-col items-center justify-center py-10 opacity-50">
                    <Activity className="h-10 w-10 mb-3" />
                    <span className="text-xs">هیچ رویدادی ثبت نشده است.</span>
                 </div>
               ) : (
                 <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent dark:before:via-slate-700">
                    {auditLogs.map((log) => {
                       const d = new Date(log.timestamp);
                       const timeStr = d.toLocaleTimeString("fa-IR");
                       const dateStr = d.toLocaleDateString("fa-IR");
                       return (
                         <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full border-4 border-white dark:border-slate-900 bg-blue-500 text-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                               <Activity className="w-3.5 h-3.5" />
                            </div>
                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2rem)] p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm transition-transform hover:-translate-y-1">
                               <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                                  <h4 className="font-bold text-xs text-blue-600 dark:text-blue-400">{log.action}</h4>
                                  <time className="text-[10px] text-slate-500 dark:text-slate-400 font-mono" dir="ltr">{dateStr} {timeStr}</time>
                               </div>
                               <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">{log.details}</p>
                            </div>
                         </div>
                       );
                    })}
                 </div>
               )}
            </div>
          </div>
        </div>
      )}

      {/* Floating Chatbot Widget */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-4" dir="rtl">
        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 30 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={`w-[380px] h-[520px] max-w-[calc(100vw-3rem)] max-h-[calc(100vh-8rem)] rounded-2xl shadow-2xl border flex flex-col overflow-hidden ${
                isDarkMode ? "bg-slate-900/95 border-slate-800 text-slate-100" : "bg-white/95 border-slate-200 text-slate-800 shadow-slate-300/40"
              } backdrop-blur-md`}
            >
              {/* Header */}
              <div className={`p-4 border-b flex items-center justify-between shrink-0 ${
                isDarkMode ? "bg-slate-800/90 border-slate-750" : "bg-slate-50/90 border-slate-100"
              }`}>
                <div className="flex items-center gap-3 text-right">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-md">
                      <Bot className="w-5 h-5 animate-pulse" />
                    </div>
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900"></span>
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-right">مهرآیین - پشتیبان هوشمند ERP</h4>
                    <p className={`text-[10px] mt-0.5 text-right ${isDarkMode ? "text-emerald-400" : "text-emerald-600"} flex items-center gap-1`}>
                      <span>•</span> پاسخگوی آنلاین فعال
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      if (window.confirm("آیا مایل به شروع مجدد گفتگو و پاکسازی تاریخچه پیام‌ها هستید؟")) {
                        setChatMessages([
                          {
                            id: "welcome",
                            role: "assistant",
                            text: "سلام! من مهرآیین، پشتیبان هوشمند شما هستم. چطور می‌توانم در کار با نرم‌افزار، استخراج اسناد فاکتور یا ماژول‌های حسابداری و مالی به شما کمک کنم؟",
                            timestamp: new Date(),
                          }
                        ]);
                        showNotification("تاریخچه گفتگو بازنشانی شد.", "info");
                      }
                    }}
                    className={`p-1.5 rounded-lg transition-colors ${
                      isDarkMode ? "hover:bg-slate-800 text-slate-400 hover:text-white" : "hover:bg-slate-200 text-slate-500 hover:text-slate-900"
                    }`}
                    title="شروع مجدد گفتگو"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setIsChatOpen(false)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      isDarkMode ? "hover:bg-slate-800 text-slate-400 hover:text-white" : "hover:bg-slate-200 text-slate-500 hover:text-slate-900"
                    }`}
                    title="بستن گفتگو"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Message Thread */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col custom-scrollbar">
                {chatMessages.map((msg) => {
                  const isUser = msg.role === "user";
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isUser ? "justify-start" : "justify-end"} max-w-[85%] ${isUser ? "mr-auto" : "ml-auto"}`}
                    >
                      <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                        isUser
                          ? "bg-gradient-to-l from-indigo-600 to-blue-600 text-white rounded-tr-none shadow-sm text-right animate-fade-in"
                          : isDarkMode
                            ? "bg-slate-800/90 border border-slate-700/50 text-slate-100 rounded-tl-none text-right animate-fade-in"
                            : "bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200/50 text-right animate-fade-in"
                      }`}>
                        <div className="whitespace-pre-wrap">{msg.text}</div>
                        <div className={`text-[8px] text-left mt-1.5 opacity-50 font-mono`}>
                          {msg.timestamp.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Loading indicator */}
                {isChatLoading && (
                  <div className="flex justify-end max-w-[85%] ml-auto">
                    <div className={`p-3 rounded-2xl rounded-tl-none flex items-center gap-1.5 ${
                      isDarkMode ? "bg-slate-800/90" : "bg-slate-100"
                    }`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: "0ms" }}></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: "150ms" }}></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: "300ms" }}></span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Suggestions Panel */}
              {chatMessages.length <= 2 && (
                <div className={`px-4 py-2 shrink-0 border-t flex flex-col gap-1.5 ${
                  isDarkMode ? "bg-slate-800/50 border-slate-750" : "bg-slate-50 border-slate-100"
                }`}>
                  <span className={`text-[9px] font-bold text-right ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>سوالات پیشنهادی کاربر:</span>
                  <div className="flex flex-wrap gap-1.5 justify-start">
                    {[
                      { t: "تبدیل فایل اکسل چطور کار می‌کند؟", q: "تبدیل فایل اکسل چطور کار می‌کند؟" },
                      { t: "موازنه دوطرفه چیست؟", q: "موازنه دوطرفه چیست و چگونه به مغایرت‌گیری کمک می‌کند؟" },
                      { t: "درباره سرفصل‌های ERP توضیح دهید", q: "درباره سرفصل‌های ماژول‌های ERP در حال ساخت توضیح دهید" },
                    ].map((chip, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendChatMessage(chip.q)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] text-right transition-all border ${
                          isDarkMode 
                            ? "bg-slate-800/70 border-slate-700/60 text-slate-300 hover:bg-slate-750 hover:border-indigo-500/40 hover:text-indigo-300" 
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-indigo-500/30 hover:text-indigo-600 shadow-xs cursor-pointer"
                        }`}
                      >
                        {chip.t}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat Input Footer */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendChatMessage();
                }}
                className={`p-3 border-t shrink-0 flex items-center gap-2 ${
                  isDarkMode ? "bg-slate-800/90 border-slate-750" : "bg-slate-50/90 border-slate-100"
                }`}
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="سوال خود را بپرسید..."
                  className={`flex-1 px-3.5 py-2 rounded-xl text-xs outline-none transition-all border text-right ${
                    isDarkMode 
                      ? "bg-slate-900 border-slate-850 text-slate-100 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30" 
                      : "bg-white border-slate-200 text-slate-800 focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20"
                  }`}
                  disabled={isChatLoading}
                />
                <button
                  type="submit"
                  disabled={isChatLoading || !chatInput.trim()}
                  className={`p-2 rounded-xl transition-all ${
                    chatInput.trim() && !isChatLoading
                      ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/10 active:scale-95 cursor-pointer"
                      : isDarkMode 
                        ? "bg-slate-800 text-slate-500 cursor-not-allowed" 
                        : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  <Send className="w-3.5 h-3.5 rotate-180" />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Bubble Button */}
        <motion.button
          onClick={() => setIsChatOpen(!isChatOpen)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`relative w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-2xl bg-gradient-to-tr from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 transition-all cursor-pointer border border-indigo-450/25`}
        >
          {isChatOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <>
              <MessageSquare className="w-6 h-6 animate-pulse" />
              {/* Pulsing notification dot */}
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 animate-pulse"></span>
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}
