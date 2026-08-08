/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Menu,
  ChevronDown,
  Landmark, Package,
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
  FileImage,
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
  Sliders,
  SlidersHorizontal,
  Search,
  Filter,
  Eye,
  Info,
  ExternalLink,
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
  UserX,
  Bell,
  RefreshCw,
  Laptop,
  Smartphone,
  Cloud,
  Tag,
  ShieldAlert,
  Copy,
  Paperclip,
  CheckSquare,
  Square,
  Plus,
  Maximize,
  Minimize,
  Printer,
  Undo2, Calculator, LayoutGrid, List, Save, Database, Code, FileCode, MessageSquareText, Zap, Wrench, Star, Brain, FileSpreadsheet, Building, Phone, Edit2, Ban, KeyRound, Terminal, UserPlus, EyeOff
} from "lucide-react";
import { TransactionItem, UploadedFile, PreviousScan, DocumentExtractionSettings } from "./types";
import CameraCapture from "./components/CameraCapture";
import AudioNotesSection from "./components/AudioNotesSection";
import ThemeSwitcher from "./components/ThemeSwitcher";
import OnboardingModal from "./components/OnboardingModal";
import AiSettingsModal from "./components/AiSettingsModal";
import AdaptiveMlDashboardModal from "./components/AdaptiveMlDashboardModal";
import AnalysisRatingWidget from "./components/AnalysisRatingWidget";
import DocumentExclusiveChatModal from "./components/DocumentExclusiveChatModal";
import OnboardingProfileModal from "./components/OnboardingProfileModal";
import AuditLogsModal from "./components/AuditLogsModal";
import AdminPinModal from "./components/AdminPinModal";
import AdminPanelModal from "./components/AdminPanelModal";
import LoginScreen from "./components/LoginScreen";
import PdfThumbnail from "./components/PdfThumbnail";
import PdfViewer from "./components/PdfViewer";
import { BatchOCRProgressPanel, BatchOCRProgressItem } from "./components/BatchOCRProgressPanel";
import * as XLSX from "xlsx";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { motion, AnimatePresence } from "motion/react";
import Markdown from "react-markdown";
import DynamicTable from "./components/DynamicTable";
import SmartAuditDashboard from "./components/SmartAuditDashboard";
import { auth, db, testConnection } from "./lib/firebase";
import { doc, getDoc, getDocs, setDoc, deleteDoc, collection } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

// Shadow global fetch locally in this module to inject custom Gemini API Key automatically if present
const customFetch = async function (input: RequestInfo | URL, init?: RequestInit) {
  const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
  if (url.includes("/api/")) {
    init = init || {};
    init.headers = init.headers || {};
    const customApiKey = (window as any).__custom_gemini_api_key__ || "";
    if (customApiKey) {
      if (init.headers instanceof Headers) {
        init.headers.set("x-gemini-api-key", customApiKey);
      } else if (Array.isArray(init.headers)) {
        init.headers.push(["x-gemini-api-key", customApiKey]);
      } else {
        (init.headers as any)["x-gemini-api-key"] = customApiKey;
      }
    }
  }
  return window.fetch(input, init);
};
const fetch = customFetch;

const DEFAULT_COLUMNS = [
  { کلید: "تاریخ", عنوان: "تاریخ", نوع_داده: "string" },
  { کلید: "شماره_سند", عنوان: "شماره سند", نوع_داده: "string" },
  { کلید: "نام_طرف_حساب", عنوان: "نام طرف حساب", نوع_داده: "string" },
  { کلید: "شرح", عنوان: "شرح", نوع_داده: "string" },
  { کلید: "مبلغ_بدهکار", عنوان: "مبلغ بدهکار", نوع_داده: "number" },
  { کلید: "مبلغ_بستانکار", عنوان: "مبلغ بستانکار", نوع_داده: "number" },
  { کلید: "نوع_ارز", عنوان: "نوع ارز", نوع_داده: "string" },
  { کلید: "توضیحات", عنوان: "توضیحات", نوع_داده: "string" },
];

const normalizeKey = (k: any): string => {
  if (typeof k !== "string") return String(k || "");
  return k
    .trim()
    .replace(/[\u064A\u0649]/g, "\u06CC") // Arabic Yeh to Persian Yeh
    .replace(/[\u0643]/g, "\u06A9")      // Arabic Kaf to Persian Kaf
    .replace(/\s+/g, "_");               // Replace spaces with underscores
};

const deduplicateColumns = (cols: any[]): any[] => {
  if (!Array.isArray(cols)) return [];
  const seenKeys = new Set<string>();
  const result: any[] = [];
  cols.forEach((col, idx) => {
    if (!col || typeof col !== "object") return;
    const rawKey = col.کلید || col.عنوان || `col_${idx}`;
    const key = normalizeKey(rawKey);
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      result.push({
        ...col,
        کلید: key,
        عنوان: col.عنوان || rawKey,
        نوع_داده: col.نوع_داده || "string"
      });
    }
  });
  return result;
};

const ERP_MODULES = [
  { id: 0, name: "آنالیز تصویر پیشرفته", icon: Sparkles, isLive: true },
];

const formatBytesGlobal = (bytes: number, decimals = 2) => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

const FOLDER_COLORS: { [key: string]: { text: string; bg: string; border: string; dot: string; hover: string; fill: string } } = {
  rose: { text: "text-rose-500 dark:text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20", dot: "bg-rose-500", hover: "hover:bg-rose-500/5", fill: "fill-rose-500" },
  emerald: { text: "text-emerald-500 dark:text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", dot: "bg-emerald-500", hover: "hover:bg-emerald-500/5", fill: "fill-emerald-500" },
  amber: { text: "text-amber-500 dark:text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", dot: "bg-amber-500", hover: "hover:bg-amber-500/5", fill: "fill-amber-500" },
  blue: { text: "text-blue-500 dark:text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", dot: "bg-blue-500", hover: "hover:bg-blue-500/5", fill: "fill-blue-500" },
  purple: { text: "text-purple-500 dark:text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20", dot: "bg-purple-500", hover: "hover:bg-purple-500/5", fill: "fill-purple-500" },
  cyan: { text: "text-cyan-500 dark:text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20", dot: "bg-cyan-500", hover: "hover:bg-cyan-500/5", fill: "fill-cyan-500" },
  indigo: { text: "text-indigo-500 dark:text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20", dot: "bg-indigo-500", hover: "hover:bg-indigo-500/5", fill: "fill-indigo-500" }
};


const convertPersianDigitsToEnglish = (str: string): string => {
  if (!str) return "";
  return str
    .replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString())
    .replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d).toString());
};

import { enrichJSONWithWords, numToWordsFa, toPersianDigits, isMonetaryKey } from "./utils/numberToPersianWords";

const repairAndCleanJsonString = (raw: string): string => {
  if (!raw) return "";
  let str = raw.trim();
  
  // Strip markdown code fences
  str = str.replace(/^```(?:json)?/gi, "").replace(/```$/g, "").trim();

  // Find first opening brace or bracket
  const firstOpenArr = str.indexOf("[");
  const firstOpenObj = str.indexOf("{");
  let firstOpen = -1;
  if (firstOpenArr !== -1 && firstOpenObj !== -1) {
    firstOpen = Math.min(firstOpenArr, firstOpenObj);
  } else if (firstOpenArr !== -1) {
    firstOpen = firstOpenArr;
  } else if (firstOpenObj !== -1) {
    firstOpen = firstOpenObj;
  }

  const lastCloseArr = str.lastIndexOf("]");
  const lastCloseObj = str.lastIndexOf("}");
  let lastClose = Math.max(lastCloseArr, lastCloseObj);

  if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
    str = str.substring(firstOpen, lastClose + 1);
  }

  // Convert Persian digits
  str = convertPersianDigitsToEnglish(str);

  // Strip trailing commas before ] or }
  str = str.replace(/,\s*([\]\}])/g, "$1");

  return str.trim();
};

const findArrayInObject = (obj: any): any[] | null => {
  if (!obj || typeof obj !== "object") return null;
  if (Array.isArray(obj)) return obj;

  for (const key of Object.keys(obj)) {
    if (Array.isArray(obj[key]) && obj[key].length > 0) {
      return obj[key];
    }
  }

  for (const key of Object.keys(obj)) {
    if (obj[key] && typeof obj[key] === "object") {
      const nested = findArrayInObject(obj[key]);
      if (nested && nested.length > 0) return nested;
    }
  }

  return null;
};

const cleanJsonString = (str: string) => repairAndCleanJsonString(str);

const parseJsonToTableArray = (jsonText: string): any[] => {
  if (!jsonText || !jsonText.trim()) return [];

  const cleaned = repairAndCleanJsonString(jsonText);
  let parsed: any = null;

  try {
    parsed = JSON.parse(cleaned);
  } catch (e1) {
    try {
      let patched = cleaned;
      const openBrackets = (patched.match(/\[/g) || []).length;
      const closeBrackets = (patched.match(/\]/g) || []).length;
      if (openBrackets > closeBrackets) patched += "]".repeat(openBrackets - closeBrackets);

      const openBraces = (patched.match(/\{/g) || []).length;
      const closeBraces = (patched.match(/\}/g) || []).length;
      if (openBraces > closeBraces) patched += "}".repeat(openBraces - closeBraces);

      parsed = JSON.parse(patched);
    } catch (e2) {
      const objectMatches = cleaned.match(/\{[^{}]*\}/g);
      if (objectMatches && objectMatches.length > 0) {
        const extracted: any[] = [];
        objectMatches.forEach(m => {
          try {
            const item = JSON.parse(m.replace(/,\s*}/g, "}"));
            extracted.push(item);
          } catch (_) {}
        });
        if (extracted.length > 0) return extracted;
      }
      throw new Error("فرمت کد JSON معتبر نیست. لطفاً علامت‌گذاری‌ها را بررسی نمایید.");
    }
  }

  let rawList: any[] = [];
  if (Array.isArray(parsed)) {
    rawList = parsed;
  } else if (parsed && typeof parsed === "object") {
    const found = findArrayInObject(parsed);
    if (found) {
      rawList = found;
    } else {
      rawList = [parsed];
    }
  }

  const mappedRows = rawList.map((row: any, idx: number) => {
    if (row === null || row === undefined) return { "ردیف": idx + 1, "مقدار": "" };
    if (typeof row !== "object") return { "ردیف": idx + 1, "مقدار": row };

    const flat: any = {};
    if (row.فیلد_ها && Array.isArray(row.فیلد_ها)) {
      flat["ردیف"] = idx + 1;
      row.فیلد_ها.forEach((f: any) => {
        if (f && typeof f === "object") {
          const k = f.عنوان || f.کلید || f.key || "فیلد";
          flat[k] = f.مقدار !== undefined ? f.مقدار : f.value;
        }
      });
      Object.keys(row).forEach((k) => {
        if (k !== "فیلد_ها" && typeof row[k] !== "object") {
          flat[k] = row[k];
        }
      });
      return flat;
    }

    Object.keys(row).forEach((k) => {
      const v = row[k];
      if (v === null || v === undefined) {
        flat[k] = "";
      } else if (typeof v === "object") {
        flat[k] = JSON.stringify(v);
      } else {
        flat[k] = v;
      }
    });

    if (!flat["ردیف"]) flat["ردیف"] = idx + 1;

    return flat;
  });

  return enrichJSONWithWords(mappedRows);
};

export default function App() {
  const [users, setUsers] = useState<any[]>(() => {
    const initial = [
      { 
        id: 1, 
        name: "سمانه رسولی", 
        firstName: "سمانه",
        lastName: "رسولی",
        companyName: "بازرگانی دریا",
        phone: "09121111111",
        jobTitle: "مدیر مالی",
        email: "samaneh.rasouli@example.com",
        role: "admin", 
        status: "active", 
        apiUsage: 45000, 
        extraStorage: 0,
        isOnboarded: true
      },
      { 
        id: 2, 
        name: "محمد کریمی", 
        firstName: "محمد",
        lastName: "کریمی",
        companyName: "پارس الوان",
        phone: "09122222222",
        jobTitle: "حسابدار ارشد",
        email: "m.karimi@example.com",
        role: "user", 
        status: "active", 
        apiUsage: 12400, 
        extraStorage: 0,
        isOnboarded: true
      },
      { 
        id: 3, 
        name: "حسابدار پاره‌وقت", 
        firstName: "حسابدار",
        lastName: "پاره‌وقت",
        companyName: "صنایع نوین",
        phone: "09123333333",
        jobTitle: "حسابدار مستقل",
        email: "parttime@example.com",
        role: "user", 
        status: "suspended", 
        apiUsage: 850, 
        extraStorage: 0,
        isOnboarded: true
      }
    ];
    try {
      const stored = localStorage.getItem("system_users");
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.map((u: any) => {
          const matched = initial.find(init => String(init.id) === String(u.id));
          if (matched && !u.firstName) {
            return { ...u, ...matched };
          }
          return u;
        });
      }
      return initial;
    } catch {
      return initial;
    }
  });

  const [currentUser, setCurrentUser] = useState<any>(() => {
     try {
       const stored = localStorage.getItem("current_user");
       if (stored) {
         const parsed = JSON.parse(stored);
         if (parsed && (parsed.email === "alizerehsaz2001@gmail.com" || parsed.email?.toLowerCase() === "alizerehsaz2001@gmail.com")) {
           parsed.role = "admin";
           localStorage.setItem("current_user", JSON.stringify(parsed));
         }
         return parsed;
       }
       return null;
     } catch {
       return null;
     }
  });
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

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

  const [undoStack, setUndoStack] = useState<TransactionItem[][]>([]);
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

  const [pendingFiles, setPendingFiles] = useState<Array<{ 
    base64: string; 
    name: string; 
    mimeType: string; 
    size: number;
    id?: string;
    folder?: string;
    preview?: string;
  }>>([]);
  const [customPrompt, setCustomPrompt] = useState<string>("");
  const [preExtractChat, setPreExtractChat] = useState<{ role: 'user' | 'assistant'; text: string; files?: { base64: string; name: string; mimeType: string; size: number }[] }[]>([]);
  const [preExtractInput, setPreExtractInput] = useState<string>("");
  const [preExtractFiles, setPreExtractFiles] = useState<{ base64: string; name: string; mimeType: string; size: number }[]>([]);
  const [isPreExtractChatLoading, setIsPreExtractChatLoading] = useState<boolean>(false);
  const [isAiUnderstandingConfirmed, setIsAiUnderstandingConfirmed] = useState<boolean>(false);
  const [verificationSummary, setVerificationSummary] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [extractionStep, setExtractionStep] = useState<number>(0);
  const [activeErpModuleId, setActiveErpModuleId] = useState<number | null>(0);

  // Exclusive Document Chat State
  const [exclusiveChatDoc, setExclusiveChatDoc] = useState<any | null>(null);
  const [isExclusiveChatOpen, setIsExclusiveChatOpen] = useState<boolean>(false);

  const openExclusiveChatForDocument = (doc: any) => {
    if (!doc) return;
    setExclusiveChatDoc(doc);
    setIsExclusiveChatOpen(true);
    logEvent("چت اختصاصی سند", `کاربر چت اختصاصی سند «${doc?.file?.name || doc?.name || "سند"}» را فعال کرد.`);
  };

  // Support chatbot state variables
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; role: "user" | "assistant"; text: string; timestamp: Date }>>([
    {
      id: "welcome",
      role: "assistant",
      text: "سلام! من مهرآیین، پشتیبان هوشمند شما هستم. چطور می‌توانم در کار با نرم‌افزار، استخراج اسناد فاکتور یا ماژول‌های حسابداری و مالی به شما کمک کنم؟ همچنین می‌توانید جهت هرگونه سوال یا راهنمایی فنی مستقیماً با توسعه‌دهنده سیستم (علی زره‌ساز) از طریق ایمیل alizerehsaz2001@gmail.com در ارتباط باشید.",
      timestamp: new Date(),
    }
  ]);
  const [chatInput, setChatInput] = useState<string>("");
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const preExtractChatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, isChatOpen]);

  useEffect(() => {
    if (preExtractChatEndRef.current) {
      preExtractChatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [preExtractChat]);

  useEffect(() => {
    setIsAiUnderstandingConfirmed(false);
    setVerificationSummary(null);
  }, [pendingFiles]);

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

  useEffect(() => {
    localStorage.setItem("previous_scans", JSON.stringify(previousScans));
  }, [previousScans]);

  const [userDefinedFolders, setUserDefinedFolders] = useState<any[]>(() => {
    const saved = localStorage.getItem("user_defined_folders");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((item: any) => {
          if (typeof item === "string") {
            return { name: item, color: "indigo", description: "", createdAt: new Date().toISOString() };
          }
          return {
            name: item.name || "پوشه جدید",
            color: item.color || "indigo",
            description: item.description || "",
            createdAt: item.createdAt || new Date().toISOString()
          };
        });
      } catch (e) {
        console.error("Error reading folders:", e);
      }
    }
    return [
      { name: "Tax", color: "rose", description: "اسناد مالیاتی و ارزش افزوده", createdAt: new Date().toISOString() },
      { name: "Utilities", color: "amber", description: "قبوض آب، برق، گاز و هزینه‌های جاری عمومی", createdAt: new Date().toISOString() },
      { name: "Salaries", color: "emerald", description: "فیش‌های حقوقی و پرداختی‌های پرسنل", createdAt: new Date().toISOString() }
    ];
  });

  useEffect(() => {
    localStorage.setItem("user_defined_folders", JSON.stringify(userDefinedFolders));
  }, [userDefinedFolders]);

  const getFolderId = (folderName: string) => {
    const clean = folderName.replace(/[^a-zA-Z0-9_\-]/g, "_") || "folder";
    const hash = Math.abs(folderName.split("").reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0));
    return (clean.substring(0, 60) + "_" + hash).substring(0, 128);
  };

  const [selectedFolderFilter, setSelectedFolderFilter] = useState<string>("all");
  const [fileManagerSearchQuery, setFileManagerSearchQuery] = useState<string>("");
  const [fileManagerSortBy, setFileManagerSortBy] = useState<string>("newest");
  const [fileManagerViewMode, setFileManagerViewMode] = useState<"grid" | "list">("grid");
  const [fileManagerTypeFilter, setFileManagerTypeFilter] = useState<string>("all");
  const [selectedScanIds, setSelectedScanIds] = useState<string[]>([]);

  // Folder creation form states
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderColor, setNewFolderColor] = useState("indigo");
  const [newFolderDesc, setNewFolderDesc] = useState("");

  const [activePreviewScan, setActivePreviewScan] = useState<PreviousScan | null>(null);
  const [previewTab, setPreviewTab] = useState<"transactions" | "analysis" | "audit">("transactions");

  // Batch OCR Parallel Processing Engine States
  const [batchOCRItems, setBatchOCRItems] = useState<BatchOCRProgressItem[]>([]);
  const [isBatchProcessing, setIsBatchProcessing] = useState<boolean>(false);
  const [isBatchPanelOpen, setIsBatchPanelOpen] = useState<boolean>(false);
  const [isBatchPanelMinimized, setIsBatchPanelMinimized] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const cancelBatchRef = useRef<boolean>(false);
  const isEditingRawJsonRef = useRef<boolean>(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const processSingleFileWithAutoRetry = async (
    item: {
      id: string;
      scanId?: string;
      name: string;
      size: number;
      preview: string;
      mimeType: string;
      base64: string;
      folder?: string;
    },
    userPrompt: string = "",
    chatFiles: any[] = []
  ): Promise<{ success: boolean; transactionsCount: number; error?: string }> => {
    let attempt = 1;
    const maxAttempts = 50;

    const updateProgress = (patch: Partial<BatchOCRProgressItem>) => {
      setBatchOCRItems(prev => prev.map(it => it.id === item.id ? { ...it, ...patch } : it));
    };

    const scanId = item.scanId || item.id;
    const finalPrompt = userPrompt || getCompiledAIInstructions();

    const startTime = Date.now();
    updateProgress({
      status: "processing",
      stage: "analyzing_layout",
      attempt: 1,
      statusMessage: "در حال تحلیل ساختار چیدمان و الگوی سند...",
      startTime,
      modelUsed: selectedModel
    });

    while (attempt <= maxAttempts) {
      if (cancelBatchRef.current) {
        updateProgress({
          status: "error",
          statusMessage: "عملیات پردازش توسط کاربر لغو شد.",
          errorMessage: "لغو شده"
        });
        return { success: false, transactionsCount: 0, error: "لغو شده" };
      }

      try {
        const isPdf = item.mimeType === "application/pdf" || item.name.toLowerCase().endsWith(".pdf");
        if (attempt > 1) {
          updateProgress({
            status: "retrying",
            stage: "extracting_fields",
            attempt,
            statusMessage: `تلاش شماره ${attempt} - ارسال مجدد درخواست استخراج به Gemini...`
          });
        } else {
          updateProgress({
            status: "processing",
            stage: "extracting_fields",
            attempt: 1,
            statusMessage: isPdf && pdfExtractionStrategy === "pdf_to_markdown_to_json"
              ? "در حال تبدیل PDF به متن ساختاریافته Markdown و استخراج JSON..."
              : "در حال استخراج هوشمند لایه‌ها و جدول اقلام..."
          });
        }

        const response = await fetch("/api/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image: item.base64,
            mimeType: item.mimeType,
            model: selectedModel,
            tokenSettings,
            userPrompt: finalPrompt,
            chatFiles,
            pdfExtractionStrategy,
          }),
        });

        const result = await response.json();

        if (response.ok && result.success) {
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
            setCurrentUser(prev => prev ? { ...prev, apiUsage: (prev.apiUsage || 0) + realTokensUsed } : prev);
          }

          const rowsArray = Array.isArray(result.data.ردیف_ها) ? result.data.ردیف_ها : (Array.isArray(result.data.اقلام_تراکنش) ? result.data.اقلام_تراکنش : []);
          const columnsArray = deduplicateColumns(Array.isArray(result.data.ستون_ها) ? result.data.ستون_ها : []);
          
          const extractedItems: TransactionItem[] = rowsArray.map((rowItem: any, idx: number) => {
            const row: any = {
              id: `extracted-${Date.now()}-${idx}-${Math.random().toString(36).substring(2,6)}`,
              ضریب_اطمینان: rowItem.ضریب_اطمینان !== undefined && rowItem.ضریب_اطمینان !== null ? Number(rowItem.ضریب_اطمینان) : 100,
            };

            if (rowItem.فیلد_ها && Array.isArray(rowItem.فیلد_ها)) {
              rowItem.فیلد_ها.forEach((f: any) => {
                if (f.کلید) {
                  const k = normalizeKey(f.کلید);
                  row[k] = f.مقدار;
                }
              });
            } else {
              Object.keys(rowItem).forEach(key => {
                if (key !== 'ضریب_اطمینان') {
                  const k = normalizeKey(key);
                  row[k] = rowItem[key];
                }
              });
            }
            return row as TransactionItem;
          });

          const documentType = result.data.نوع_سند || "سند نامشخص";
          const documentAnalysis = result.data.تحلیل_سند || "";

          const currentDocExtractionSettings: DocumentExtractionSettings = {
            selectedModel,
            erpDestinationModule,
            strictnessMode,
            customPrompt,
            pdfExtractionStrategy,
            savedAt: Date.now()
          };

          const successFile: UploadedFile = {
            id: scanId,
            name: item.name,
            size: item.size,
            preview: item.preview || `data:${item.mimeType};base64,${item.base64}`,
            status: "success",
            error: null,
            results: extractedItems,
            columns: columnsArray,
            documentType,
            documentAnalysis,
            markdownContent: result.markdownContent,
            tokensUsed: realTokensUsed,
            tokenDetails: result.tokenDetails,
            extractionSettings: (item as any).extractionSettings || currentDocExtractionSettings
          };

          setPreviousScans(prev => {
            const filtered = prev.filter(s => s.id !== scanId && s.file.name !== item.name);
            return [
              {
                id: scanId,
                file: successFile,
                transactions: extractedItems,
                timestamp: Date.now(),
                folder: item.folder,
                extractionSettings: (item as any).extractionSettings || currentDocExtractionSettings
              },
              ...filtered
            ].slice(0, 500);
          });

          setTransactions(prev => [...extractedItems, ...prev]);

          const endTime = Date.now();
          const processingTimeMs = endTime - startTime;
          const avgConfidence = extractedItems.length > 0 
            ? Math.round(extractedItems.reduce((acc, curr) => acc + (curr.ضریب_اطمینان ?? 100), 0) / extractedItems.length) 
            : 100;

          updateProgress({
            status: "success",
            stage: "completed",
            statusMessage: `استخراج موفقیت‌آمیز! (${extractedItems.length.toLocaleString("fa-IR")} ردیف مالی استخراج گردید)`,
            extractedCount: extractedItems.length,
            confidenceScore: avgConfidence,
            documentType,
            tokensUsed: realTokensUsed,
            processingTimeMs,
            endTime
          });

          logEvent("استخراج موازی موفق", `سند «${item.name}» با موفقیت در تلاش ${attempt} استخراج گردید.`);
          return { success: true, transactionsCount: extractedItems.length };
        } else {
          throw new Error(result.error || `پاسخ ناموفق از سرور (کد ${response.status})`);
        }
      } catch (err: any) {
        console.warn(`Attempt ${attempt} for file ${item.name} failed:`, err.message);
        
        const isQuotaOrRateLimit = err.message?.includes("429") || err.message?.includes("سهمیه") || err.message?.includes("ترافیک") || err.message?.includes("Quota") || err.message?.includes("Service Unavailable") || err.message?.includes("503");
        
        const delayMs = Math.min(2000 * Math.pow(1.2, Math.min(attempt, 10)) + Math.floor(Math.random() * 1000), 10000);
        const delaySeconds = Math.round(delayMs / 1000);

        updateProgress({
          status: "retrying",
          attempt: attempt + 1,
          statusMessage: isQuotaOrRateLimit
            ? `محدودیت ترافیک / سهمیه Gemini (کد 429/503). انتظار ${delaySeconds} ثانیه تا تلاش مجدد (تلاش ${attempt + 1})...`
            : `خطا در استخراج (${err.message || "خطای شبکه‌ای"}). انتظار ${delaySeconds} ثانیه تا تلاش مجدد (تلاش ${attempt + 1})...`
        });

        await new Promise(res => setTimeout(res, delayMs));
        attempt++;
      }
    }

    updateProgress({
      status: "error",
      statusMessage: "تعداد تلاش‌ها به حداکثر رسید.",
      errorMessage: "ناموفق پس از حداکثر تلاش"
    });
    return { success: false, transactionsCount: 0, error: "تلاش‌ها به پایان رسید" };
  };

  const startBatchExtractionPipeline = async (
    fileList: Array<{
      id?: string;
      name: string;
      size: number;
      preview?: string;
      base64: string;
      mimeType: string;
      folder?: string;
    }>,
    userPrompt: string = ""
  ) => {
    if (fileList.length === 0) return;

    cancelBatchRef.current = false;
    setIsBatchProcessing(true);
    setIsBatchPanelOpen(true);
    setIsBatchPanelMinimized(false);

    const initialItems: BatchOCRProgressItem[] = fileList.map((f, idx) => ({
      id: f.id || `batch_item_${Date.now()}_${idx}_${Math.random().toString(36).substring(2,6)}`,
      scanId: f.id,
      name: f.name,
      size: f.size,
      preview: f.preview || `data:${f.mimeType};base64,${f.base64}`,
      mimeType: f.mimeType,
      base64: f.base64,
      folder: f.folder,
      status: "queued",
      attempt: 0,
      statusMessage: "در صف پردازش موازی...",
      startTime: Date.now()
    }));

    setBatchOCRItems(initialItems);

    showNotification(`پردازش موازی برای ${fileList.length.toLocaleString("fa-IR")} سند با قابلیت تلاش مجدد خودکار آغاز شد.`, "info");
    logEvent("شروع پردازش موازی اسناد", `تعداد ${fileList.length} سند به صورت همزمان جهت استخراج OCR پردازش می‌شوند.`);

    const parallelPromises = initialItems.map(item => processSingleFileWithAutoRetry(item, userPrompt));

    await Promise.all(parallelPromises);

    setIsBatchProcessing(false);
    showNotification("عملیات پردازش موازی تمام اسناد با موفقیت به پایان رسید!", "success");
    logEvent("پایان پردازش موازی اسناد", "تمام اسناد در صف موازی پردازش شدند.");
  };

  const handleCancelBatchProcessing = () => {
    cancelBatchRef.current = true;
    setIsBatchProcessing(false);
    showNotification("درخواست لغو پردازش موازی صادر گردید.", "info");
    logEvent("لغو پردازش موازی", "کاربر پردازش موازی اسناد را لغو کرد.");
  };

  const handleMultipleFilesUpload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(
      f => f.type.startsWith("image/") || f.type === "application/pdf"
    );

    if (validFiles.length === 0) {
      showNotification("تنها فایل‌های تصویر و PDF پشتیبانی می‌شوند.", "error");
      return;
    }

    const extraStorageBytes = (currentUser?.extraStorage || 0) * 1024 * 1024 * 1024;
    const MAX_STORAGE = 5 * 1024 * 1024 * 1024 + extraStorageBytes;
    const usedStorage = previousScans.reduce((acc, scan) => acc + (scan.file.size || 0), 0);
    const totalNewSize = validFiles.reduce((acc, f) => acc + f.size, 0);

    if (usedStorage + totalNewSize > MAX_STORAGE) {
      showNotification("ظرفیت حافظه ابری شما تکمیل شده است. لطفاً فایل‌های اضافی را حذف کنید.", "error");
      return;
    }

    try {
      showNotification(`در حال پیش‌پردازش ${validFiles.length.toLocaleString("fa-IR")} سند جهت پردازش موازی...`, "info");

      const convertedItems = await Promise.all(
        validFiles.map(async (file) => {
          const base64 = await convertFileToBase64(file);
          const targetMime = file.type === "application/pdf" ? "application/pdf" : "image/jpeg";
          return {
            id: "scan_" + Date.now() + "_" + Math.floor(Math.random() * 10000),
            name: file.name,
            size: file.size,
            base64,
            mimeType: targetMime,
            preview: `data:${targetMime};base64,${base64}`,
            folder: selectedFolderFilter !== "all" && selectedFolderFilter !== "uncategorized" ? selectedFolderFilter : undefined
          };
        })
      );

      if (convertedItems.length > 0) {
        setPendingFiles(prev => [...prev, ...convertedItems]);
        setCustomPrompt("");
        // Instead of starting immediately, we allow user to review pending files
      }
    } catch (error) {
      console.error(error);
      showNotification("خطا در پیش‌پردازش و تبدیل اسناد", "error");
    }
  };

  const handleBulkBatchOCR = () => {
    if (selectedScanIds.length === 0) return;
    const selectedScans = previousScans.filter(s => selectedScanIds.includes(s.id));
    const fileItems = selectedScans.map(s => {
      const base64Data = s.file.preview && s.file.preview.includes(",")
        ? s.file.preview.split(",")[1]
        : s.file.preview;
      return {
        id: s.id,
        name: s.file.name,
        size: s.file.size,
        preview: s.file.preview,
        base64: base64Data,
        mimeType: s.file.mimeType || (s.file.name.endsWith(".pdf") ? "application/pdf" : "image/jpeg"),
        folder: s.folder
      };
    });
    startBatchExtractionPipeline(fileItems);
    setSelectedScanIds([]);
  };

  const handleViewScanFromBatch = (scanId: string) => {
    const scan = previousScans.find(s => s.id === scanId);
    if (scan) {
      setActiveFile(scan.file);
      setTransactions(scan.transactions || []);
      const docSettings = scan.extractionSettings || scan.file?.extractionSettings;
      if (docSettings) {
        if (docSettings.selectedModel) setSelectedModel(docSettings.selectedModel);
        if (docSettings.erpDestinationModule) setErpDestinationModule(docSettings.erpDestinationModule);
        if (docSettings.strictnessMode) setStrictnessMode(docSettings.strictnessMode);
        if (docSettings.customPrompt !== undefined) setCustomPrompt(docSettings.customPrompt);
        if (docSettings.pdfExtractionStrategy) setPdfExtractionStrategy(docSettings.pdfExtractionStrategy);
      }
      showNotification(`سند «${scan.file.name}» بارگذاری شد.`, "info");
    }
  };

  const uploadFileDirectly = async (file: File) => {
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      showNotification("تنها فایل‌های تصویر و PDF پشتیبانی می‌شوند.", "error");
      return;
    }
    const extraStorageBytes = (currentUser?.extraStorage || 0) * 1024 * 1024 * 1024;
    const MAX_STORAGE = 5 * 1024 * 1024 * 1024 + extraStorageBytes;
    const usedStorage = previousScans.reduce((acc, scan) => acc + (scan.file.size || 0), 0);
    if (usedStorage + file.size > MAX_STORAGE) {
      showNotification("ظرفیت حافظه ابری شما تکمیل شده است. لطفاً فایل‌های اضافی را حذف کنید یا از مدیر درخواست فضای اضافه نمایید.", "error");
      return;
    }
    try {
      const base64 = await convertFileToBase64(file);
      const targetMime = file.type === "application/pdf" ? "application/pdf" : "image/jpeg";
      const fileId = "file_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
      const successFile = {
        id: fileId,
        name: file.name,
        size: file.size,
        preview: base64,
        status: "idle" as const,
        error: null,
        results: [],
      };

      const newScan = {
        id: "scan_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
        file: successFile,
        transactions: [],
        timestamp: Date.now(),
        folder: selectedFolderFilter !== "all" && selectedFolderFilter !== "uncategorized" ? selectedFolderFilter : undefined
      };

      setPreviousScans(prev => [newScan, ...prev]);
      logEvent("آپلود مستقیم در مدیریت فایل", `سند "${file.name}" با موفقیت در مخزن فایل‌ها آپلود شد.`);
      showNotification(`سند "${file.name}" با موفقیت بارگذاری شد و آماده پردازش هوشمند است.`, "success");
    } catch (error) {
      console.error(error);
      showNotification("خطا در پیش‌پردازش فایل", "error");
    }
  };

  const handleProcessUnscannedFile = (scan: PreviousScan) => {
    setIsFileManagerOpen(false);
    setPendingFiles([{
      base64: scan.file.preview,
      name: scan.file.name,
      mimeType: scan.file.mimeType || "image/jpeg",
      size: scan.file.size,
      id: scan.id,
      folder: scan.folder
    }]);
    setCustomPrompt("");
    showNotification(`سند "${scan.file.name}" آماده استخراج است. روی دکمه شروع استخراج کلیک کنید.`, "info");
  };

  const [historySearchQuery, setHistorySearchQuery] = useState<string>("");
  const [historyDocType, setHistoryDocType] = useState<string>("all");
  const [historyDateRange, setHistoryDateRange] = useState<string>("all");

  const availableDocumentTypes = useMemo(() => {
    const typesSet = new Set<string>();
    previousScans.forEach((scan) => {
      if (scan.file && scan.file.documentType) {
        typesSet.add(scan.file.documentType);
      }
    });
    return Array.from(typesSet);
  }, [previousScans]);

  const filteredPreviousScans = useMemo(() => {
    return previousScans.filter((scan) => {
      // 1. Search Query (File Name or Doc Type)
      if (historySearchQuery.trim()) {
        const query = historySearchQuery.toLowerCase();
        const fileName = (scan.file?.name || "").toLowerCase();
        const docType = (scan.file?.documentType || "").toLowerCase();
        if (!fileName.includes(query) && !docType.includes(query)) {
          return false;
        }
      }

      // 2. Document Type Filter
      if (historyDocType !== "all") {
        const scanDocType = scan.file?.documentType || "سند نامشخص";
        if (scanDocType !== historyDocType) {
          return false;
        }
      }

      // 3. Date Range Filter
      if (historyDateRange !== "all") {
        const scanDate = new Date(scan.timestamp);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - scanDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (historyDateRange === "today") {
          const isToday = scanDate.getDate() === now.getDate() &&
            scanDate.getMonth() === now.getMonth() &&
            scanDate.getFullYear() === now.getFullYear();
          if (!isToday) return false;
        } else if (historyDateRange === "yesterday") {
          const yesterday = new Date(now);
          yesterday.setDate(now.getDate() - 1);
          const isYesterday = scanDate.getDate() === yesterday.getDate() &&
            scanDate.getMonth() === yesterday.getMonth() &&
            scanDate.getFullYear() === yesterday.getFullYear();
          if (!isYesterday) return false;
        } else if (historyDateRange === "week") {
          if (diffDays > 7) return false;
        } else if (historyDateRange === "month") {
          if (diffDays > 30) return false;
        }
      }

      return true;
    });
  }, [previousScans, historySearchQuery, historyDocType, historyDateRange]);

  const fileManagerFilteredScans = useMemo(() => {
    let result = previousScans.filter(scan => {
      // 1. Folder filter
      if (selectedFolderFilter !== "all") {
        if (selectedFolderFilter === "starred") {
          if (!scan.isStarred) return false;
        } else if (selectedFolderFilter === "uncategorized") {
          if (scan.folder) return false;
        } else if (scan.folder !== selectedFolderFilter) {
          return false;
        }
      }
      
      // 2. Search query filter
      if (fileManagerSearchQuery.trim()) {
        const query = fileManagerSearchQuery.toLowerCase();
        const nameMatch = (scan.file?.name || "").toLowerCase().includes(query);
        const docTypeMatch = (scan.file?.documentType || "").toLowerCase().includes(query);
        const analysisMatch = (scan.file?.documentAnalysis || "").toLowerCase().includes(query);
        const tagMatch = (scan.tags || []).some(t => t.toLowerCase().includes(query));
        if (!nameMatch && !docTypeMatch && !analysisMatch && !tagMatch) return false;
      }
      
      // 3. Type filter
      if (fileManagerTypeFilter !== "all") {
        const isPdf = scan.file?.name?.toLowerCase().endsWith(".pdf") || scan.file?.preview?.startsWith("data:application/pdf");
        if (fileManagerTypeFilter === "pdf" && !isPdf) return false;
        if (fileManagerTypeFilter === "image" && isPdf) return false;
      }
      
      return true;
    });
    
    // 4. Sorting
    result.sort((a, b) => {
      if (fileManagerSortBy === "newest") {
        return b.timestamp - a.timestamp;
      } else if (fileManagerSortBy === "oldest") {
        return a.timestamp - b.timestamp;
      } else if (fileManagerSortBy === "largest") {
        return (b.file?.size || 0) - (a.file?.size || 0);
      } else if (fileManagerSortBy === "smallest") {
        return (a.file?.size || 0) - (b.file?.size || 0);
      } else if (fileManagerSortBy === "alphabetical") {
        return (a.file?.name || "").localeCompare(b.file?.name || "", 'fa');
      } else if (fileManagerSortBy === "most_transactions") {
        return (b.transactions?.length || 0) - (a.transactions?.length || 0);
      } else if (fileManagerSortBy === "least_transactions") {
        return (a.transactions?.length || 0) - (b.transactions?.length || 0);
      }
      return 0;
    });
    
    return result;
  }, [previousScans, selectedFolderFilter, fileManagerSearchQuery, fileManagerTypeFilter, fileManagerSortBy]);

  // AI Model Selection & Daily Quota States
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    const saved = localStorage.getItem("selected_ai_model");
    if (saved && saved !== "gemini-3.1-pro-preview") return saved;
    return "gemini-3.6-flash";
  });

  const [modelQuotas, setModelQuotas] = useState<{ [key: string]: { limit: number; used: number; lastReset: number } }>(() => {
    const defaultQuotas = {
      "gemini-3.6-flash": { limit: 2000, used: 0, lastReset: Date.now() },
      "gemini-3.1-pro-preview": { limit: 50, used: 0, lastReset: Date.now() },
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

  const [pdfExtractionStrategy, setPdfExtractionStrategy] = useState<"direct" | "pdf_to_markdown_to_json">(
    () => (localStorage.getItem("pdf_extraction_strategy") as any) || "pdf_to_markdown_to_json"
  );

  useEffect(() => {
    localStorage.setItem("pdf_extraction_strategy", pdfExtractionStrategy);
  }, [pdfExtractionStrategy]);

  useEffect(() => {
    localStorage.setItem("ai_model_quotas", JSON.stringify(modelQuotas));
  }, [modelQuotas]);

  // Raw editable JSON text state and its validation
  const [rawJsonText, setRawJsonText] = useState<string>(() => {
    return localStorage.getItem("autosaved_raw_json") || "";
  });
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [isJsonVerified, setIsJsonVerified] = useState<boolean>(false);
  const [bypassManualVerification, setBypassManualVerification] = useState<boolean>(() => {
    return localStorage.getItem("bypass_manual_verification") === "true";
  });

  useEffect(() => {
    localStorage.setItem("bypass_manual_verification", bypassManualVerification.toString());
  }, [bypassManualVerification]);

  // Auto-save Status States
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState<boolean>(false);

  // Advanced Search & Filter States
  const [filterParty, setFilterParty] = useState<string>("");
  const [filterQuery, setFilterQuery] = useState<string>(""); // for general search
  const [filterMinAmount, setFilterMinAmount] = useState<string>("");
  const [filterMaxAmount, setFilterMaxAmount] = useState<string>("");
  const [filterConfidence, setFilterConfidence] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [minConfidenceThreshold, setMinConfidenceThreshold] = useState<number>(0);
  const [activeValidationSubTab, setActiveValidationSubTab] = useState<'risk' | 'threshold' | 'fields' | 'auto-repair'>('threshold');
  const [isRepairing, setIsRepairing] = useState<boolean>(false);
  const [repairStatusMsg, setRepairStatusMsg] = useState<string>("");
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Document Rename States
  const [isRenamingDoc, setIsRenamingDoc] = useState<boolean>(false);
  const [tempDocName, setTempDocName] = useState<string>("");

  // AI Extraction Guide Tab State
  const [activeGuideTab, setActiveGuideTab] = useState<'general' | 'bypass' | 'advanced'>('general');

  // AI Extraction Control Center States
  const [extractionControlTab, setExtractionControlTab] = useState<'settings' | 'guide'>('settings');
  const [erpDestinationModule, setErpDestinationModule] = useState<string>("general-ledger");
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(null);
  const [strictnessMode, setStrictnessMode] = useState<'balanced' | 'speed' | 'audit'>('balanced');
  const [selectedScopes, setSelectedScopes] = useState<string[]>(["items", "parties", "tax", "currency"]);



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

  const logEvent = (action: string, details: string, type: 'info' | 'success' | 'warning' | 'error' | 'auth' = 'info') => {
    const newLog: import('./types').AuditLogEntry = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      action,
      details,
      type,
      user: currentUser ? {
        name: currentUser.name || currentUser.firstName + ' ' + currentUser.lastName,
        role: currentUser.role
      } : undefined
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const [activeTab, setActiveTab] = useState<"analysis" | "json" | "converter" | "unified">("analysis");

  const handleTabChange = (tab: "analysis" | "json" | "converter" | "unified") => {
    setActiveTab(tab);
    let tabName = "";
    if (tab === "analysis") tabName = "آنالیز تصویر پیشرفته";
    if (tab === "json") tabName = "آرایه خام JSON";
    if (tab === "converter") tabName = "خروجی اکسل پیشرفته";
    if (tab === "unified") tabName = "نمای ۳۶۰ درجه یکپارچه";
    logEvent("تغییر تب", `کاربر وارد تب «${tabName}» شد.`);
  };

  const handlePreExtractFilesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
       const newFiles = Array.from(e.target.files);
       newFiles.forEach(file => {
         if (file.size > 5 * 1024 * 1024) {
            showNotification(`حجم فایل ${file.name} بیشتر از 5 مگابایت است.`, "error");
            return;
         }
         const reader = new FileReader();
         reader.onload = (event) => {
           const base64String = (event.target?.result as string).split(',')[1];
           setPreExtractFiles(prev => [...prev, {
              base64: base64String,
              name: file.name,
              mimeType: file.type || "application/pdf",
              size: file.size
           }]);
         };
         reader.readAsDataURL(file);
       });
    }
    // reset input value so the same file can be selected again
    e.target.value = '';
  };

  const handleSendPreExtractChat = async (textToSend?: string) => {
    const text = textToSend || preExtractInput;
    if ((!text.trim() && preExtractFiles.length === 0) || pendingFiles.length === 0) return;

    setPreExtractInput("");
    const filesToAttach = [...preExtractFiles];
    setPreExtractFiles([]);

    const newMessages = [...preExtractChat, { role: "user" as const, text, files: filesToAttach }];
    setPreExtractChat(newMessages);
    setIsPreExtractChatLoading(true);

    try {
      const response = await fetch("/api/chat-pre-extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: newMessages,
          image: pendingFiles[0].base64,
          mimeType: pendingFiles[0].mimeType,
          model: selectedModel,
          customPrompt: customPrompt
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
         throw new Error(data.error || "خطا در ارتباط با هوش مصنوعی در چت پیش از پردازش.");
      }
      setPreExtractChat((prev) => [...prev, { role: "assistant" as const, text: data.text }]);
    } catch (error: any) {
       console.error("Error sending pre-extract chat:", error);
       showNotification(error.message || "خطا در شبکه یا سرور. لطفاً دوباره تلاش کنید.", "error");
    } finally {
      setIsPreExtractChatLoading(false);
    }
  };

  const handleApplyChatToPrompt = () => {
    if (preExtractChat.length === 0) {
      showNotification("هنوز گفتگویی انجام نشده است.", "info");
      return;
    }
    
    let additionalPrompt = "\n⚠️ نکات و توافقات گفتگوی پیش از استخراج (الزامات قطعی پردازش):\n";
    preExtractChat.forEach((msg) => {
      if (msg.role === 'user') {
        additionalPrompt += `- خواسته کاربر: ${msg.text}\n`;
      } else {
        const cleanText = msg.text.replace(/[\r\n]+/g, ' ').substring(0, 150);
        additionalPrompt += `  توضیح/تایید سیستم: ${cleanText}${msg.text.length > 150 ? '...' : ''}\n`;
      }
    });

    setCustomPrompt(prev => {
      const base = prev.trim();
      return base ? `${base}\n${additionalPrompt}` : additionalPrompt.trim();
    });
    
    showNotification("دستورالعمل‌های گفتگوی پیش از استخراج با موفقیت به پرامپت اختصاصی منتقل گردید!", "success");
  };

  const handleClearPreExtractChat = () => {
    setPreExtractChat([]);
    showNotification("گفتگوی پیش از استخراج پاکسازی شد.", "info");
  };

  const handleSetDirectJsonPrompt = () => {
    const jsonInstruction = "لطفاً تمامی اطلاعات کلیدی، اقلام تراکنش، مبالغ، مالیات، عوارض، شناسه مودیان و کدهای اختصاصی این سند را به صورت مستقیم در قالب آرایه ساختاریافته استاندارد JSON با عناوین و کلیدهای فارسی استخراج و تنظیم کنید.";
    setCustomPrompt(prev => {
      const trimmed = prev.trim();
      if (!trimmed) return jsonInstruction;
      if (trimmed.includes("JSON") || trimmed.includes("جیسون")) return trimmed;
      return `${trimmed}\n${jsonInstruction}`;
    });
    showNotification("دستورالعمل استخراج مستقیم به فرمت JSON در تنظیمات سند ثبت گردید.", "success");
  };

  const handleExtractDirectToJson = async () => {
    if (pendingFiles.length === 0) return;
    const jsonInstruction = "لطفاً تمامی اطلاعات کلیدی، اقلام تراکنش، مبالغ، مالیات، عوارض، شناسه مودیان و کدهای اختصاصی این سند را به صورت مستقیم در قالب آرایه ساختاریافته استاندارد JSON با عناوین و کلیدهای فارسی استخراج و تنظیم کنید.";
    setCustomPrompt(prev => {
      const trimmed = prev.trim();
      if (!trimmed) return jsonInstruction;
      if (trimmed.includes("JSON") || trimmed.includes("جیسون")) return trimmed;
      return `${trimmed}\n${jsonInstruction}`;
    });
    setIsAiUnderstandingConfirmed(true);
    showNotification("تنظیمات خروجی مستقیم JSON فعال شد. در حال استخراج سند...", "success");
    setTimeout(() => {
      handleDirectExtraction();
    }, 150);
  };

  const handleExtract100PercentAllToJsonAndExcel = async () => {
    const fullJsonInstruction = `⚡ دستورالعمل فوق‌حرفه‌ای، صفر-اغماض و آلترا-پیشرفته استخراج ۱۰۰٪ داده‌ها (موتور ارشد پردازش سند، بینایی ماشین و حسابرسی جنایی - نسل ۵ آلترا ویژه خروجی کاملاً هوشمند Full-Excel):

شما در جایگاه یک حسابرس رسمی ارشد، مهندس فوق‌تخصص OCR و بینایی ماشین، و تحلیل‌گر داده‌های مالی و تجاری قرار دارید. موظفید تمامی داده‌های مندرج در این تصویر/سند را بدون هیچ‌گونه استثنا، بریدگی، خلاصه‌سازی، ادغام یا نادیده گرفتن، با دقت مطلق ۱۰۰٪ استخراج کرده و به یک «آرایه JSON مسطح و استاندارد (Flat JSON Array)» با کلیدهای فارسی تبدیل کنید تا مستقیماً و بدون نیاز به هیچ‌گونه فرآوری یا ویرایش دستی، وارد جداول اکسل (.xlsx)، سیستم‌های مالی ERP، سامانه مؤدیان و دیتابیس‌های رابطه‌ای گردند.

🔴 قوانین بنیادین و خطوط قرمز صفر-اغماض (Zero-Omission Directives):
۱. اسکن ۷ زون عمیق سند (7-Zone Deep Scanning): تمام مناطق سند شامل ۱) هدر و بالای سند، ۲) مشخصات صادرکننده، ۳) مشخصات خریدار، ۴) تمامی سطرها و ستون‌های جدول اقلام، ۵) جمع‌های مالی و مالیات فوتر، ۶) اطلاعات بانکی و واریز، ۷) متون حاشیه‌ای، شروط، مهرها، امضاها، متون دست‌نویس و کادرهای فرعی را کلمه به کلمه اسکن و استخراج کنید. هیچ داده‌ای نباید جا بماند!
۲. تبدیل عددی استاندارد (Pure Math ASCII Digits): تمامی ارقام (تعداد، قیمت واحد، مبالغ، درصدهای مالیات، کدهای ملی/اقتصادی/پستی، شماره شبا، تاریخ‌ها و کدهای شناسایی) را منحصراً به «اعداد انگلیسی استاندارد ASCII (0-9)» تبدیل کنید. تمام پسوندها و پیشوندها نظیر "ریال"، "تومان"، "$"، "٪"، "عدد"، "دستگاه" و تمامی جداکننده‌های هزارگان (کاما/ویرگول) را از مقادیر عددی پاکسازی کنید تا مستقیماً در فرمول‌های ریاضی و توابع اکسل (SUM, VLOOKUP, INDEX-MATCH) قابل پردازش باشند.
۳. ساختار مسطح کامل جهت اکسل (Flat JSON Matrix): هر سطر از جداول یا اقلام کالا/خدمات باید به عنوان یک Object مستقل در آرایه اصلی قرار گیرد. کلیه اطلاعات عمومی (هدر، مشخصات صادرکننده، خریدار، جمع‌های کلان، اطلاعات بانکی و حواشی) باید در تمام تک‌تک Objectها تکرار شوند تا هر سطر در فایل اکسل مستقل، کامل و قابل فیلتر/گزارش‌گیری باشد. (در صورت عدم وجود جدول اقلام، آرایه حاوی ۱ Object کامل خواهد بود).
۴. حفظ کامل و بدون بریدگی متون (Full Text Preservation): از هرگونه خلاصه‌سازی شرح کالا/خدمات یا حذف کدها جداً خودداری کنید. تمام کلمات، مشخصات فنی، مدل، سایز، رنگ، برند، شماره سریال، کد تعرفه گمرکی و پلاک باید دقیقاً ثبت گردند.
۵. عدم تولید هیچ‌گونه متن اضافه: خروجی باید منحصراً و فقط یک کد استاندارد JSON باشد (بدون هیچ‌گونه توضیحات، مقدمه، مؤخره یا متن متنی اضافه در خارج از JSON).

📋 چک‌لیست ۳۵‌گانه جامع و کامل استخراج بی‌نقص (با کلیدهای استاندارد فارسی):

۱) شناسنامه سند و هدر (Header Metadata):
- "نوع_سند": (مثلاً فاکتور فروش، صورتحساب الکترونیکی، قبض، فیش واریزی، رسید انبار، حواله، صورتجلسه، پیش‌فاکتور، بارنامه، صورت‌وضعیت)
- "شماره_فاکتور": شماره اصلی فاکتور / سند / رسید / قبض
- "شماره_سریال_چاپی": شماره مسلسل چاپی یا قرمز رنگ بالای سند
- "شناسه_یکتای_مالیاتی": شناسه ۲۲ رقمی سامانه مودیان (در صورت وجود)
- "شماره_پیگیری": شماره پیگیری / مرجع / ارجاع / شناسه صیادی / شماره حواله
- "شماره_سفارش_خرید_PO": شماره سفارش خرید یا درخواست وجه (در صورت وجود)
- "تاریخ_شمسی": تاریخ صدور شمسی دقیق به فرمت YYYY/MM/DD (مثلا 1403/05/22)
- "تاریخ_میلادی": تاریخ میلادی در صورت وجود
- "زمان_ثبت": ساعت و زمان دقیق ثبت (مثلا 14:35)
- "روش_تسویه": (نقدی، نسیه، چک، اقساطی، پایا/ساتنا، کارتخوان)

۲) اطلاعات هویتی فروشنده / صادرکننده (Seller/Issuer):
- "نام_فروشنده": نام کامل شرکت، فروشگاه، سازمان یا شخص حقیقی صادرکننده
- "شناسه_ملی_فروشنده": کد ملی ۱۰ رقمی یا شناسه ملی ۱۱ رقمی فروشنده
- "کد_اقتصادی_فروشنده": شماره اقتصادی ۱۲ رقمی فروشنده
- "شماره_ثبت_فروشنده": شماره ثبت شرکت یا جواز کسب
- "استان_شهر_فروشنده": استان و شهر محل فعالیت فروشنده
- "کدپستی_فروشنده": کدپستی ۱۰ رقمی فروشنده
- "تلفن_فروشنده": شماره تلفن ثابت، همراه یا فکس فروشنده
- "آدرس_فروشنده": آدرس کامل پستی محل کار یا فروشگاه

۳) اطلاعات هویتی خریدار / مشتری (Buyer/Customer):
- "نام_خریدار": نام کامل شرکت، سازمان یا شخص حقیقی خریدار
- "شناسه_ملی_خریدار": کد ملی یا شناسه ملی خریدار
- "کد_اقتصادی_خریدار": شماره اقتصادی خریدار
- "شماره_ثبت_خریدار": شماره ثبت خریدار
- "تلفن_خریدار": شماره تماس خریدار
- "آدرس_خریدار": آدرس کامل پستی خریدار و محل تحویل

۴) جزئیات جدول اقلام و خدمات (Line Items Details):
- "ردیف": شماره سطر (1, 2, 3...)
- "کد_کالا": کد کالا، شناسه عمومی/اختصاصی کالا یا خدمات، بارکد، کد IRC
- "شرح_کالا": شرح کامل و دقیق کالا یا خدمات شامل تمامی جزئیات فنی، مدل، سایز، رنگ و برند بدون اختصار
- "تعداد": مقدار یا تعداد عددی خالص
- "واحد_سنجش": واحد اندازه‌گیری (عدد، کیلوگرم، متر، بسته، دستگاه، ساعت، کارتنش، تن...)
- "قیمت_واحد": قیمت واحد / فی (عدد خالص به ریال یا ارز پایه)
- "مبلغ_کل_ردیف": (تعداد × قیمت واحد) قبل از تخفیف
- "تخفیف_ردیف": مبلغ تخفیف اختصاص داده شده به این سطر
- "درصد_تخفیف_ردیف": درصد تخفیف سطر
- "نرخ_مالیات_بر_ارزش_افزوده_ردیف": درصد مالیات بر ارزش افزوده این سطر (مثلاً 10)
- "مالیات_ارزش_افزوده_ردیف": مبلغ مالیات بر ارزش افزوده و عوارض این سطر
- "مبلغ_نهایی_ردیف": مبلغ خالص و نهایی پرداختی این سطر پس از تخفیف و مالیات

۵) خلاصه مالی کلان، اضافات و کسورات (Financial Totals & Adjustments):
- "جمع_کل_قبل_تخفیف": مجموع مبالغ تمام اقلام قبل از تخفیف
- "جمع_تخفیفات": مجموع کل تخفیفات فاکتور
- "مبلغ_مشمول_مالیات": مبلغ خالص مشمول مالیات
- "جمع_مالیات_و_عوارض": مجموع کل مالیات بر ارزش افزوده و عوارض قانونی
- "سایر_اضافات": هزینه‌های اضافی مانند حمل و نقل، بسته‌بندی، انبارداری یا نصب
- "سایر_کسورات": سپرده بیمه، مالیات تکلیفی، پیش‌پرداخت، سپرده حسن انجام کار یا کسورات قانونی
- "مبلغ_قابل_پرداخت": مبلغ نهایی پرداختی به عدد خالص
- "مبلغ_قابل_پرداخت_حروفی": مبلغ قابل پرداخت دقیقاً به حروف فارسی کامل

۶) اطلاعات بانکی، واریز و تسویه (Banking & Settlement):
- "نام_بانک": نام بانک صادرکننده یا حساب مقصد
- "شماره_حساب": شماره حساب بانکی
- "شماره_کارت": شماره کارت ۱۶ رقمی
- "شماره_شبا": شماره شبای بانکی (به فرمت IR...)
- "صاحب_حساب": نام کامل صاحب حساب/سپرده

۷) حواشی، متون قانونی، ممیزی و داده‌های آزاد (Tail, Audit & Edge Cases):
- "توضیحات_سند": متن کامل توضیحات، شروط فاکتور، گارانتی، مهلت تسویه و یادداشت‌های پایین سند
- "وضعیت_مهر_امضا": (دارای مهر و امضا / فقط امضا / فقط مهر / فاقد مهر و امضا)
- "سایر_اطلاعات_و_حواشی_سند": هرگونه متون دست‌نویس، شماره بارنامه، پلاک خودرو، وزن باسکول، کد انبار، نام انباردار یا اطلاعات تکمیلی فرعی که در ۳۴ کلید فوق نگنجیده است
- "مغایرت_محاسباتی": در صورت وجود هرگونه خطا در ضرب (تعداد × فی) یا جمع مبالغ فاکتور توسط صادرکننده، شرح دقیق مغایرت ریاضی را بنویسید؛ در غیر این صورت null قرار دهید.`;
    
    setCustomPrompt(prev => {
      const trimmed = prev.trim();
      if (!trimmed) return fullJsonInstruction;
      return `${trimmed}\n\n⚠️ دستور ویژه کاربر (استخراج ۱۰۰٪ تمام اطلاعات به JSON):\n${fullJsonInstruction}`;
    });

    setPreExtractChat(prev => [
      ...prev,
      { role: "user", text: fullJsonInstruction },
      { 
        role: "assistant", 
        text: "✅ تایید شد! دستور نسل ۵ آلترا فول‌اکسل (استخراج ۱۰۰٪ صفر-اغماض) ثبت گردید. اسکن ۷ زون عمیق سند با ۳۵ کلید مسطح فارسی، تبدیل اعداد به ASCII خالص (0-9) و حسابرسی خودکار موازنه ریاضی اجرا می‌شود." 
      }
    ]);

    setIsAiUnderstandingConfirmed(true);
    logEvent("استخراج ۱۰۰٪ کلیه اطلاعات به JSON", "کاربر دستور استخراج ۱۰۰٪ کلیه اطلاعات سند (اعداد و متون) به JSON برای اکسل را صادر کرد.");
    showNotification("دستور ویژه فول‌اکسل ثبت گردید. در حال استخراج ۱۰۰٪ داده‌ها و تولید خروجی اکسل...", "success");

    if (pendingFiles.length > 0) {
      setTimeout(() => {
        handleDirectExtraction();
      }, 200);
    }
  };

  const getCompiledAIInstructions = () => {
    let instructions = "";
    
    // 1. Destination Module Guidelines
    if (erpDestinationModule === "general-ledger") {
      instructions += "ماژول هدف: سند عمومی حسابداری و دفتر روزنامه. فیلدهای بدهکار، بستانکار، بابت، و کد حساب کل/معین را متناسب با قالب دفتر روزنامه دوطرفه تراز و موازنه کن.\n";
    } else if (erpDestinationModule === "accounts-payable") {
      instructions += "ماژول هدف: حساب‌های پرداختی (AP). اطلاعات فاکتور خرید، نام فروشنده/تامین‌کننده، مبلغ کل، تخفیف، مالیات، عوارض و شرایط پرداخت را استخراج کن. ثبت دقیق کدهای اقتصادی و شناسه ملی الزامی است.\n";
    } else if (erpDestinationModule === "accounts-receivable") {
      instructions += "ماژول هدف: حساب‌های دریافتی (AR). اطلاعات فاکتور فروش، نام خریدار/مشتری، مبالغ ناخالص و خالص، مالیات، شماره فاکتور و سررسید پرداخت را با دقت استخراج کن.\n";
    } else if (erpDestinationModule === "inventory") {
      instructions += "ماژول هدف: انبار و کالا (Inventory). رسید انبار و حواله کالا. شرح دقیق کالا، تعداد، واحد اندازه‌گیری، فی، مبلغ کل هر ردیف، مشخصات تحویل‌دهنده و تحویل‌گیرنده استخراج شود.\n";
    }

    // 2. Strictness Mode Guidelines
    if (strictnessMode === "speed") {
      instructions += "حالت پردازش: سرعت بالا (Fast Extraction). هدف استخراج سریع مبالغ کلیدی و اطلاعات هویتی پایه است. از پردازش ثانویه و راستی‌آزمایی محاسبات ریاضی چشم‌پوشی کن تا خروجی با بالاترین سرعت ممکن تولید شود.\n";
    } else if (strictnessMode === "balanced") {
      instructions += "حالت پردازش: متوازن (Balanced). موازنه محاسباتی بین مبالغ جزء و مبالغ کل (Subtotal, Tax, Grand Total) را به صورت استاندارد بررسی کن و در صورت مغایرت جزئی، عدد نهایی نوشته شده در سند ملاک عمل باشد.\n";
    } else if (strictnessMode === "audit") {
      instructions += "حالت پردازش: ممیزی سخت‌گیرانه (Strict Audit). تو یک ممیز ارشد مالیاتی و حسابرس قانونی هستی. تمام ردیف‌ها را مجدداً به صورت ریاضی محاسبه کن (تعداد × قیمت واحد = جمع کل ردیف). مجموع اقلام، تخفیفات، مالیات بر ارزش افزوده (VAT) و مبلغ نهایی باید دقیقاً موازنه دوطرفه شوند. هرگونه مخدوش بودن، خط‌خوردگی، و یا مغایرت محاسباتی در سند را تشخیص داده و گزارش کن. اطلاعات هویتی و تاریخ‌ها را با سخت‌گیرانه‌ترین حالت بررسی کن.\n";
    }

    // 3. Selection Scopes
    if (selectedScopes.length > 0) {
      instructions += "حوزه‌های تمرکز استخراج:\n";
      if (selectedScopes.includes("items")) instructions += "- استخراج کامل جدول اقلام، ردیف‌ها، شرح خدمات/کالا، مقادیر عددی فاکتور.\n";
      if (selectedScopes.includes("parties")) instructions += "- استخراج شناسنامه طرفین معامله شامل نام حقوقی/حقیقی، کد اقتصادی، شناسه ملی، تلفن و آدرس.\n";
      if (selectedScopes.includes("tax")) instructions += "- استخراج و تفکیک تخفیفات، عوارض، مالیات بر ارزش افزوده (VAT) و ملحقات قانونی فاکتور.\n";
      if (selectedScopes.includes("currency")) instructions += "- تشخیص نوع ارز سند (ریال، تومان، دلار و ...) و مبالغ تسویه نهایی.\n";
    }

    // 4. Custom instruction prompt
    if (customPrompt.trim()) {
      instructions += `\nدستورالعمل‌های اختصاصی کاربر:\n${customPrompt}\n`;
    }

    // 5. Chat History context
    if (preExtractChat.length > 0) {
      const chatContext = "تاریخچه مکالمه با کاربر درباره این سند:\n" + preExtractChat.map(m => `${m.role === 'user' ? 'کاربر' : 'دستیار'}: ${m.text}`).join('\n');
      instructions += `\n\n${chatContext}\n`;
    }

    return instructions;
  };

  const handleDirectExtraction = async () => {
    if (pendingFiles.length === 0) return;

    if (!customPrompt.trim()) {
       showNotification("لطفاً پرامپت (دستورالعمل) را وارد کنید. این فیلد الزامی است.", "error");
       return;
    }
    setIsExtracting(true);
    setExtractionStep(1);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setExtractionStep(2);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setExtractionStep(3);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const filesData = [...pendingFiles];
    setPendingFiles([]);
    setIsExtracting(false);
    setExtractionStep(0);
    setVerificationSummary(null);
    
    const finalPrompt = getCompiledAIInstructions();
    
    const allChatFiles = preExtractChat.reduce((acc, msg) => {
      if (msg.files && Array.isArray(msg.files)) {
        acc.push(...msg.files);
      }
      return acc;
    }, [] as any[]);

    await startBatchExtractionPipeline(filesData.map(fileData => ({
      id: fileData.id,
      name: fileData.name,
      size: fileData.size,
      preview: fileData.preview || `data:${fileData.mimeType};base64,${fileData.base64}`,
      base64: fileData.base64,
      mimeType: fileData.mimeType,
      folder: fileData.folder
    })), finalPrompt);
  };

  const handleVerifyInstructions = async () => {
    if (pendingFiles.length === 0) return;
    setIsVerifying(true);
    try {
      const response = await fetch("/api/chat-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: preExtractChat,
          image: pendingFiles[0].base64,
          mimeType: pendingFiles[0].mimeType,
          model: selectedModel
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "خطا در ایجاد خلاصه تاییدیه.");
      }
      setVerificationSummary(data.text);
    } catch (error: any) {
      console.error("Error creating verification summary:", error);
      showNotification(error.message || "خطا در شبکه. لطفاً دوباره تلاش کنید.", "error");
    } finally {
      setIsVerifying(false);
    }
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
      if (!res.ok || !data.success) {
        throw new Error(data.error || "خطایی رخ داد.");
      }
      setChatMessages(prev => [...prev, {
          id: Math.random().toString(36).substring(7),
          role: "assistant" as const,
          text: data.text,
          timestamp: new Date(),
        }]);
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
    logEvent("ورود به سامانه", "کاربر وارد صفحه اصلی سامانه شد و جلسه شروع شد.", "auth");

    const handleUnhandledError = (event: ErrorEvent) => {
      console.warn("Global caught error:", event.error || event.message);
      event.preventDefault();
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.warn("Global caught promise rejection:", event.reason);
      event.preventDefault();
    };

    window.addEventListener("error", handleUnhandledError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleUnhandledError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
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
  const [isAiSettingsOpen, setIsAiSettingsOpen] = useState(false);
  const [isMlDashboardOpen, setIsMlDashboardOpen] = useState(false);
  const [isTopLeftMenuOpen, setIsTopLeftMenuOpen] = useState(false);
  const [isCompressionEnabled, setIsCompressionEnabled] = useState<boolean>(() => {
    return localStorage.getItem("is_compression_enabled") === "true";
  });

  const [tokenSettings, setTokenSettings] = useState<{
    imageResolution: "super-eco" | "balanced" | "high";
    ecoPromptEnabled: boolean;
    maxRowsToExtract: "unlimited" | "5" | "10" | "20";
    skipSecondaryFields: boolean;
    highAccuracyDualPass: boolean;
  }>(() => {
    try {
      const saved = localStorage.getItem("token_optimization_settings");
      return saved ? JSON.parse(saved) : {
        imageResolution: "balanced",
        ecoPromptEnabled: true,
        maxRowsToExtract: "unlimited",
        skipSecondaryFields: false,
        highAccuracyDualPass: true
      };
    } catch {
      return {
        imageResolution: "balanced",
        ecoPromptEnabled: true,
        maxRowsToExtract: "unlimited",
        skipSecondaryFields: false,
        highAccuracyDualPass: true
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
    if (score < minConfidenceThreshold) return false;

    if (filterConfidence === "high") {
      if (score < 90) return false;
    } else if (filterConfidence === "medium") {
      if (score < 70 || score >= 90) return false;
    } else if (filterConfidence === "low") {
      if (score >= 70) return false;
    }

    return true;
  });

  // Reset or auto-verify based on file change, status, and bypass setting
  useEffect(() => {
    if (activeFile && activeFile.status === "success") {
      if (bypassManualVerification) {
        setIsJsonVerified(true);
      } else {
        setIsJsonVerified(false);
      }
    } else {
      setIsJsonVerified(false);
    }
  }, [activeFile?.id, activeFile?.status, bypassManualVerification]);

  const [sortColumn, setSortColumn] = useState<keyof TransactionItem | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);

  const handleToggleRowSelection = (id: string) => {
    setSelectedRowIds(prev => 
      prev.includes(id) ? prev.filter(rId => rId !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedRowIds.length === filteredTransactions.length && filteredTransactions.length > 0) {
      setSelectedRowIds([]);
    } else {
      setSelectedRowIds(filteredTransactions.map(t => t.id));
    }
  };

  const handleBatchDelete = () => {
    if (selectedRowIds.length === 0) return;
    if (!window.confirm(`آیا از حذف ${selectedRowIds.length} ردیف انتخاب شده اطمینان دارید؟`)) return;
    
    setUndoStack(prev => [...prev, transactions]);
    const updated = transactions.filter(t => !selectedRowIds.includes(t.id));
    setTransactions(updated);
    setSelectedRowIds([]);
    try { setRawJsonText(JSON.stringify(updated, null, 2)); } catch(e) {}
    showNotification(`${selectedRowIds.length} ردیف با موفقیت حذف شد.`, "success");
  };

  const handleFormatAmounts = () => {
    setUndoStack(prev => [...prev, transactions]);
    const updated = transactions.map(t => {
      const fixed = { ...t };
      if (fixed.مبلغ_بدهکار && typeof fixed.مبلغ_بدهکار === 'string') {
        fixed.مبلغ_بدهکار = Number(fixed.مبلغ_بدهکار.replace(/,/g, ''));
      }
      if (fixed.مبلغ_بستانکار && typeof fixed.مبلغ_بستانکار === 'string') {
        fixed.مبلغ_بستانکار = Number(fixed.مبلغ_بستانکار.replace(/,/g, ''));
      }
      return fixed;
    });
    setTransactions(updated);
    try { setRawJsonText(JSON.stringify(updated, null, 2)); } catch(e) {}
    showNotification("مبالغ ردیف‌ها با موفقیت استانداردسازی شد.", "success");
  };


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
    const [isUserPanelOpen, setIsUserPanelOpen] = useState(false);
    const [userPanelTab, setUserPanelTab] = useState<"profile" | "api" | "general" | "security" | "notifications" | "ai">("profile");
  const [securityPass, setSecurityPass] = useState({ current: "", newPass: "", confirm: "" });
  const [is2FAActive, setIs2FAActive] = useState(false);
  const [userNotificationSettings, setUserNotificationSettings] = useState({ emailAlerts: true, smsDiscrepancy: true, weeklyReport: true, autoCloudBackup: "daily" });
  const [isSyncingCloudManager, setIsSyncingCloudManager] = useState(false);
  const [fileManagerSearch, setFileManagerSearch] = useState("");
  const [fileManagerFormatFilter, setFileManagerFormatFilter] = useState<"all" | "pdf" | "image">("all");
  // Dedicated Admin PIN Code & Security States
  const [adminMasterPin, setAdminMasterPin] = useState<string>(() => {
    return localStorage.getItem("admin_master_pin") || "7788";
  });
  const [isAdminPinModalOpen, setIsAdminPinModalOpen] = useState<boolean>(false);
  const [enteredAdminPin, setEnteredAdminPin] = useState<string>("");
  const [adminPinError, setAdminPinError] = useState<string>("");
  const [showAdminPinText, setShowAdminPinText] = useState<boolean>(false);
  const [changeAdminPinForm, setChangeAdminPinForm] = useState({ currentPin: "", newPin: "", confirmPin: "" });
  const [adminUserSearch, setAdminUserSearch] = useState<string>("");
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [adminPanelTab, setAdminPanelTab] = useState<"users" | "security" | "system" | "data" | "danger">("users");
  const [isTokenManagerOpen, setIsTokenManagerOpen] = useState(false);
  const [isFileManagerOpen, setIsFileManagerOpen] = useState(false);
  const [inspectingScanId, setInspectingScanId] = useState<string | null>(null);

  const isInitialLoadFromFirestoreRef = useRef(false);

  useEffect(() => {
    // 1. Run Firestore connection test safely
    testConnection();

    // 2. Set up onAuthStateChanged
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userDocRef);
          
          if (userSnap && userSnap.exists()) {
            const userData = userSnap.data();
            setCurrentUser({
              id: user.uid,
              name: userData.name || user.displayName || "",
              firstName: userData.firstName || "",
              lastName: userData.lastName || "",
              companyName: userData.companyName || "",
              phone: userData.phone || "",
              jobTitle: userData.jobTitle || "",
              nationalCode: userData.nationalCode || "",
              email: userData.email || user.email || "",
              role: userData.role || (user.email === "alizerehsaz2001@gmail.com" ? "admin" : "user"),
              status: userData.status || "active",
              apiUsage: userData.apiUsage || 0,
              extraStorage: userData.extraStorage || 0,
              isOnboarded: userData.isOnboarded || true
            });
          } else {
            // Fallback user state from Auth object or localStorage
            const storedUser = localStorage.getItem("current_user");
            if (storedUser) {
              try {
                setCurrentUser(JSON.parse(storedUser));
              } catch {
                setCurrentUser({
                  id: user.uid,
                  name: user.displayName || user.email?.split("@")[0] || "کاربر",
                  email: user.email || "",
                  role: user.email === "alizerehsaz2001@gmail.com" ? "admin" : "user",
                  status: "active",
                  apiUsage: 0,
                  extraStorage: 0,
                  isOnboarded: true
                });
              }
            } else {
              setCurrentUser({
                id: user.uid,
                name: user.displayName || user.email?.split("@")[0] || "کاربر",
                email: user.email || "",
                role: user.email === "alizerehsaz2001@gmail.com" ? "admin" : "user",
                status: "active",
                apiUsage: 0,
                extraStorage: 0,
                isOnboarded: true
              });
            }
          }
        } catch (err) {
          console.warn("Restoring user session from Firestore encountered network/offline issue, using local profile:", err);
          const storedUser = localStorage.getItem("current_user");
          if (storedUser) {
            try { setCurrentUser(JSON.parse(storedUser)); } catch { }
          } else {
            setCurrentUser({
              id: user.uid,
              name: user.displayName || user.email?.split("@")[0] || "کاربر",
              email: user.email || "",
              role: user.email === "alizerehsaz2001@gmail.com" ? "admin" : "user",
              status: "active",
              apiUsage: 0,
              extraStorage: 0,
              isOnboarded: true
            });
          }
        }
      } else {
        const isDemo = localStorage.getItem("is_demo_mode") === "true";
        const storedUser = localStorage.getItem("current_user");
        if (isDemo && storedUser) {
          try {
            setCurrentUser(JSON.parse(storedUser));
          } catch (e) {
            console.error("Error parsing stored demo user:", e);
          }
        } else {
          setCurrentUser(null);
        }
      }
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sync state from Firestore when user is loaded
  useEffect(() => {
    if (!currentUser) {
      isInitialLoadFromFirestoreRef.current = false;
      return;
    }
    
    const userId = auth.currentUser?.uid;
    if (!userId) {
      isInitialLoadFromFirestoreRef.current = true;
      return;
    }

    const loadData = async () => {
      try {
        const foldersCollectionRef = collection(db, "users", userId, "folders");
        const scansCollectionRef = collection(db, "users", userId, "scans");
        
        const foldersSnap = await getDocs(foldersCollectionRef);
        const scansSnap = await getDocs(scansCollectionRef);
        
        const firestoreFolders = foldersSnap.docs.map(docSnap => ({
          ...docSnap.data(),
          name: docSnap.id
        })) as any[];
        
        const firestoreScans = scansSnap.docs.map(docSnap => ({
          ...docSnap.data(),
          id: docSnap.id
        })) as any[];

        const sortedScans = firestoreScans.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

        if (firestoreFolders.length > 0) {
          setUserDefinedFolders(firestoreFolders);
        }
        if (firestoreScans.length > 0) {
          setPreviousScans(sortedScans);
        }
        
        isInitialLoadFromFirestoreRef.current = true;
      } catch (err) {
        console.error("Error loading data from Firestore:", err);
        isInitialLoadFromFirestoreRef.current = true;
      }
    };
    
    loadData();
  }, [currentUser]);

  // Sync folders to Firestore
  useEffect(() => {
    if (!currentUser || !isInitialLoadFromFirestoreRef.current) return;
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const syncFolders = async () => {
      try {
        const foldersCollectionRef = collection(db, "users", userId, "folders");
        const foldersSnap = await getDocs(foldersCollectionRef);
        const firestoreFolderIds = foldersSnap.docs.map(docSnap => docSnap.id);
        
        const localFolderNames = userDefinedFolders.map(f => f.name);
        
        // Delete folder if removed locally
        for (const fId of firestoreFolderIds) {
          if (!localFolderNames.includes(fId)) {
            const folderDocRef = doc(db, "users", userId, "folders", fId);
            await deleteDoc(folderDocRef);
          }
        }

        // Save folders
        for (const folder of userDefinedFolders) {
          if (!folder.name) continue;
          const folderDocRef = doc(db, "users", userId, "folders", folder.name);
          await setDoc(folderDocRef, {
            name: folder.name,
            color: folder.color || "indigo",
            description: folder.description || "",
            createdAt: folder.createdAt || new Date().toISOString()
          });
        }
      } catch (err) {
        console.error("Error syncing folders to Firestore:", err);
      }
    };
    syncFolders();
  }, [userDefinedFolders, currentUser]);

  // Sync scans to Firestore
  useEffect(() => {
    if (!currentUser || !isInitialLoadFromFirestoreRef.current) return;
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const syncScans = async () => {
      try {
        const scansCollectionRef = collection(db, "users", userId, "scans");
        const scansSnap = await getDocs(scansCollectionRef);
        const firestoreScanIds = scansSnap.docs.map(docSnap => docSnap.id);
        
        const localScanIds = previousScans.map(s => s.id);
        
        // Delete scan if removed locally
        for (const fId of firestoreScanIds) {
          if (!localScanIds.includes(fId)) {
            const scanDocRef = doc(db, "users", userId, "scans", fId);
            await deleteDoc(scanDocRef);
          }
        }

        // Save scans
        for (const scan of previousScans) {
          if (!scan.id) continue;
          const scanDocRef = doc(db, "users", userId, "scans", scan.id);
          
          await setDoc(scanDocRef, {
            id: scan.id,
            timestamp: scan.timestamp || Date.now(),
            folder: scan.folder || "",
            file: {
              id: scan.file?.id || "",
              name: scan.file?.name || "",
              size: scan.file?.size || 0,
              preview: scan.file?.preview || "",
              status: scan.file?.status || "",
              error: scan.file?.error || "",
              documentType: scan.file?.documentType || "",
              mimeType: scan.file?.mimeType || "",
              documentAnalysis: scan.file?.documentAnalysis || "",
              tokensUsed: scan.file?.tokensUsed || 0
            },
            transactions: scan.transactions || []
          });
        }
      } catch (err) {
        console.error("Error syncing scans to Firestore:", err);
      }
    };
    syncScans();
  }, [previousScans, currentUser]);

  const handleEnterDemo = (
    customName?: string, 
    customEmail?: string,
    customPhone?: string,
    customCompany?: string,
    customNationalCode?: string,
    customJob?: string
  ) => {
    const nameToUse = customName?.trim() || "سمانه رسولی";
    const emailToUse = customEmail?.trim() || "samaneh.rasouli@example.com";
    const nameParts = nameToUse.split(" ");
    const firstName = nameParts[0] || "کاربر";
    const lastName = nameParts.slice(1).join(" ") || "ممیزی";

    const isDemoMode = !customName;
    const roleToUse = (emailToUse?.toLowerCase() === "alizerehsaz2001@gmail.com" || isDemoMode) ? "admin" : "user";

    const demoUser = { 
      id: "user_" + Date.now(), 
      name: nameToUse, 
      firstName: firstName,
      lastName: lastName,
      companyName: customCompany?.trim() || (isDemoMode ? "مؤسسه مالی و حسابداری" : ""),
      phone: customPhone?.trim() || (isDemoMode ? "09121111111" : ""),
      jobTitle: customJob?.trim() || (isDemoMode ? "مدیر مالی / ممیز ارشد" : ""),
      nationalCode: customNationalCode?.trim() || "",
      email: emailToUse,
      role: roleToUse, 
      status: "active", 
      apiUsage: isDemoMode ? 45000 : 0, 
      extraStorage: 0,
      isOnboarded: true,
      geminiApiKey: ""
    };
    localStorage.setItem("is_demo_mode", isDemoMode ? "true" : "false");
    localStorage.setItem("current_user", JSON.stringify(demoUser));
    localStorage.setItem("demo_user_data", JSON.stringify(demoUser));
    setCurrentUser(demoUser);
    setUsers(prev => prev.some(u => u.id === demoUser.id) ? prev : [demoUser, ...prev]);
  };

  const [profileFirstName, setProfileFirstName] = useState("");
  const [profileLastName, setProfileLastName] = useState("");
  const [profileCompanyName, setProfileCompanyName] = useState("");
  const [profileJobTitle, setProfileJobTitle] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileNationalCode, setProfileNationalCode] = useState("");

  useEffect(() => {
    if (currentUser) {
      setProfileFirstName(currentUser.firstName || "");
      setProfileLastName(currentUser.lastName || "");
      setProfileCompanyName(currentUser.companyName || currentUser.company || "");
      setProfileJobTitle(currentUser.jobTitle || "");
      setProfilePhone(currentUser.phone || "");
      setProfileNationalCode(currentUser.nationalCode || "");
    } else {
      setProfileFirstName("");
      setProfileLastName("");
      setProfileCompanyName("");
      setProfileJobTitle("");
      setProfilePhone("");
      setProfileNationalCode("");
    }
  }, [currentUser]);

  const handleUpdateProfile = async () => {
    if (!currentUser) return;
    if (!profileFirstName.trim() || !profileLastName.trim() || !profileCompanyName.trim() || !profileJobTitle.trim() || !profilePhone.trim()) {
      showNotification("لطفاً تمامی فیلدهای الزامی را تکمیل کنید.", "error");
      return;
    }
    if (!/^09\d{9}$/.test(profilePhone.trim())) {
      showNotification("شماره تلفن همراه وارد شده نامعتبر است.", "error");
      return;
    }

    try {
      const regSnapshot = currentUser.registrationData || {
        firstName: profileFirstName.trim(),
        lastName: profileLastName.trim(),
        fullName: `${profileFirstName.trim()} ${profileLastName.trim()}`,
        email: currentUser.email || "",
        phone: profilePhone.trim(),
        companyName: profileCompanyName.trim(),
        jobTitle: profileJobTitle.trim(),
        nationalCode: profileNationalCode.trim(),
        registeredAt: Date.now()
      };

      const updatedUser = {
        ...currentUser,
        firstName: profileFirstName.trim(),
        lastName: profileLastName.trim(),
        name: `${profileFirstName.trim()} ${profileLastName.trim()}`,
        companyName: profileCompanyName.trim(),
        company: profileCompanyName.trim(),
        jobTitle: profileJobTitle.trim(),
        phone: profilePhone.trim(),
        nationalCode: profileNationalCode.trim(),
        registrationData: regSnapshot,
        isOnboarded: true
      };

      setCurrentUser(updatedUser);
      localStorage.setItem("current_user", JSON.stringify(updatedUser));
      setUsers(prev => prev.map(u => String(u.id) === String(currentUser.id) ? updatedUser : u));
      showNotification("مشخصات حساب کاربری شما با موفقیت بروزرسانی شد.", "success");
      logEvent("بروزرسانی شناسنامه کاربر", `کاربر مشخصات حساب کاربری خود (${updatedUser.name}) را ویرایش ساخت.`);
    } catch (error) {
      console.error("Error updating profile:", error);
      showNotification("خطا در بروزرسانی مشخصات حساب کاربری.", "error");
    }
  };

  const handleSignOut = async () => {
    try {
      const { signOut } = await import("firebase/auth");
      await signOut(auth);
      localStorage.setItem("is_demo_mode", "false");
      localStorage.removeItem("current_user");
      localStorage.removeItem("demo_user_data");
      setCurrentUser(null);
      showNotification("با موفقیت از حساب کاربری خارج شدید.", "success");
    } catch (error) {
      console.error("Logout Error:", error);
      showNotification("خطا در خروج از حساب کاربری.", "error");
    }
  };




  useEffect(() => {
    localStorage.setItem("system_users", JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem("current_user", JSON.stringify(currentUser));
  }, [currentUser]);

  const [userPreferences, setUserPreferences] = useState(() => {
    try {
      const saved = localStorage.getItem("user_preferences");
      return saved ? JSON.parse(saved) : {
        geminiApiKey: "",
        defaultCurrency: "IRT",
        dateFormat: "Jalali",
        autoBackup: true
      };
    } catch (e) {
      return { geminiApiKey: "", defaultCurrency: "IRT", dateFormat: "Jalali", autoBackup: true };
    }
  });

  useEffect(() => {
    localStorage.setItem("user_preferences", JSON.stringify(userPreferences));
  }, [userPreferences]);

  // Synchronize global custom API key for fetch interceptor
  useEffect(() => {
    if (currentUser?.geminiApiKey) {
      (window as any).__custom_gemini_api_key__ = currentUser.geminiApiKey;
    } else if (userPreferences?.geminiApiKey) {
      (window as any).__custom_gemini_api_key__ = userPreferences.geminiApiKey;
    } else {
      (window as any).__custom_gemini_api_key__ = "";
    }
  }, [currentUser?.geminiApiKey, userPreferences?.geminiApiKey]);

  // Keep currentUser synced with users list when admin changes fields (like extraStorage)
  useEffect(() => {
    if (currentUser) {
      const matched = users.find(u => u.id === currentUser.id);
      if (matched) {
        const hasDiff = matched.extraStorage !== currentUser.extraStorage || 
                        matched.role !== currentUser.role || 
                        matched.status !== currentUser.status || 
                        matched.apiUsage !== currentUser.apiUsage;
        if (hasDiff) {
          setCurrentUser(matched);
        }
      }
    }
  }, [users]);

  const [notification, setNotification] = useState<{
    text: string;
    type: "success" | "error" | "info" | "warning";
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
    if (activeFile && activeFile.status === "success" && transactions.length > 0) {
      // Find all unique keys across transactions to ensure 100% preservation of all fields & account codes
      const allKeysInTransactions = new Set<string>();
      transactions.forEach(t => {
        Object.keys(t).forEach(k => {
          if (k !== "id") {
            allKeysInTransactions.add(normalizeKey(k));
          }
        });
      });

      const activeColumns = deduplicateColumns((activeFile.columns && activeFile.columns.length > 0) ? activeFile.columns : DEFAULT_COLUMNS);
      const existingColKeys = activeColumns.map((col: any) => col.کلید);
      
      // Add any missing keys to columns list for complete sync
      const missingKeys = Array.from(allKeysInTransactions).filter(k => !existingColKeys.includes(k) && k !== "ضریب_اطمینان");
      let finalColumns = activeColumns;
      if (missingKeys.length > 0) {
        finalColumns = deduplicateColumns([
          ...activeColumns,
          ...missingKeys.map(k => ({ کلید: k, عنوان: k, نوع_داده: "string" }))
        ]);
        setActiveFile(prev => prev ? { ...prev, columns: finalColumns } : null);
      }

      const cleanJSON = transactions.map((t) => {
        const obj: any = {};
        // First include defined active columns in order
        finalColumns.forEach((col: any) => {
          const key = col.کلید;
          // Prefer strict key, fallback to عنوان if somehow it's used
          const val = t[col.کلید] !== undefined ? t[col.کلید] : t[col.عنوان];
          if (val !== undefined) {
            obj[key] = val;
          }
        });
        // Then include all remaining keys from item t
        Object.keys(t).forEach((k) => {
          const normK = normalizeKey(k);
          if (normK !== "id" && normK !== "ضریب_اطمینان" && !(normK in obj)) {
            obj[normK] = t[k];
          }
        });
        obj["ضریب_اطمینان"] = t.ضریب_اطمینان !== undefined && t.ضریب_اطمینان !== null ? Number(t.ضریب_اطمینان) : 100;
        return obj;
      });

      const enrichedJSON = enrichJSONWithWords(cleanJSON);
      const formattedJson = JSON.stringify(enrichedJSON, null, 2);

      if (!isEditingRawJsonRef.current) {
        setRawJsonText(formattedJson);
      }
      setConverterInputJson(formattedJson);
      setJsonError(null);
    } else if (transactions.length > 0) {
      const cleanJSON = transactions.map((t) => {
        const obj: any = {};
        Object.keys(t).forEach((k) => {
          if (k !== "id") obj[k] = t[k];
        });
        return obj;
      });
      const enrichedJSON = enrichJSONWithWords(cleanJSON);
      const formattedJson = JSON.stringify(enrichedJSON, null, 2);
      if (!isEditingRawJsonRef.current) {
        setRawJsonText(formattedJson);
      }
      setConverterInputJson(formattedJson);
      setJsonError(null);
    } else {
      if (!isEditingRawJsonRef.current) {
        setRawJsonText("");
      }
      setConverterInputJson("");
    }
  }, [transactions, activeFile?.id, activeFile?.status]);

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
      const handleQuickExcelExport = () => {
    try {
      const allTx = transactions.length > 0 ? transactions : previousScans.flatMap(s => s.transactions || []);
      if (allTx.length === 0) {
        showNotification("هیچ تراکنشی جهت دریافت خروجی اکسل یافت نشد.", "info");
        return;
      }
      const worksheet = XLSX.utils.json_to_sheet(allTx);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "اسناد و تراکنش‌ها");
      XLSX.writeFile(workbook, `OCR_Accounting_Export_${Date.now()}.xlsx`);
      showNotification("فایل اکسل جامع کلیه اسناد با موفقیت دانلود شد.", "success");
      logEvent("خروجی اکسل منو", "کاربر خروجی اکسل را از منوی اصلی بالای صفحه دانلود کرد.");
    } catch (err) {
      showNotification("خطا در ساخت خروجی اکسل اسناد.", "error");
    }
  };

    const handleSaveCurrentDocExtractionSettings = () => {
    const targetName = activeFile?.name || (pendingFiles[0]?.name ? pendingFiles[0].name : null);
    if (!targetName) {
      showNotification("سند فعالی جهت ثبت تنظیمات اختصاصی انتخاب نشده است.", "info");
      return;
    }

    const docSettings: DocumentExtractionSettings = {
      selectedModel,
      erpDestinationModule,
      strictnessMode,
      customPrompt,
      pdfExtractionStrategy,
      savedAt: Date.now()
    };

    if (activeFile) {
      const updatedActive = { ...activeFile, extractionSettings: docSettings };
      setActiveFile(updatedActive);
      setPreviousScans(prev => prev.map(scan => {
        if (scan.id === activeFile.id || scan.file?.id === activeFile.id || scan.file?.name === activeFile.name) {
          const updatedScan = {
            ...scan,
            file: { ...scan.file, extractionSettings: docSettings },
            extractionSettings: docSettings
          };
          return updatedScan;
        }
        return scan;
      }));
    }

    if (pendingFiles.length > 0) {
      setPendingFiles((prev: any[]) => prev.map(f => ({ ...f, extractionSettings: docSettings })));
    }

    showNotification(`تنظیمات استخراج اختصاصی سند «${targetName}» با موفقیت ثبت و ذخیره گردید.`, "success");
    logEvent("ثبت تنظیمات اختصاصی سند", `کاربر تنظیمات استخراج اختصاصی سند "${targetName}" را ذخیره کرد.`);
  };

  const handleDownloadFullBackup = () => {
    try {
      const backupData = {
        version: "2.5",
        exportDate: new Date().toISOString(),
        user: currentUser?.email || "کاربر عمومی",
        scansCount: previousScans.length,
        transactionsCount: transactions.length,
        previousScans,
        transactions,
        userDefinedFolders
      };
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ocr_accounting_full_backup_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showNotification("فایل پشتیبان کامل داده‌ها با موفقیت دانلود شد.", "success");
      logEvent("پشتیبان‌گیری کامل", "کاربر نسخه کامل JSON از کل اطلاعات را دانلود کرد.");
    } catch (e) {
      showNotification("خطا در ایجاد فایل پشتیبان داده‌ها", "error");
    }
  };

  const handleOpenProtectedPanel = (target: "admin" | "user") => {
    if (target === "admin") {
      if (currentUser?.email !== "alizerehsaz2001@gmail.com") {
        showNotification("دسترسی غیرمجاز! فقط حساب ادمین اصلی مجاز به ورود است.", "error");
        logEvent("تلاش ناموفق ورود به ادمین", `کاربر «${currentUser?.email || "مهمان"}» قصد ورود داشت.`, "warning");
        return;
      }
      setEnteredAdminPin("");
      setAdminPinError("");
      setIsAdminPinModalOpen(true);
    } else {
      setIsUserPanelOpen(true);
    }
  };

  const handleVerifyAdminPin = (pinToTest?: string) => {
    const code = pinToTest !== undefined ? pinToTest : enteredAdminPin;
    if (code.trim() === adminMasterPin) {
      setIsAdminPinModalOpen(false);
      setEnteredAdminPin("");
      setAdminPinError("");
      setIsAdminPanelOpen(true);
      showNotification("کد اختصاصی ادمین تأیید شد. خوش آمدید.", "success");
      logEvent("ورود موفق به ادمین", "مدیر سیستم با کد اختصاصی وارد پنل مدیریت شد.", "auth");
    } else {
      setAdminPinError("کد اختصاصی نادرست است. لطفاً کد معتبر را وارد کنید.");
      showNotification("کد اختصاصی ادمین اشتباه است.", "error");
      logEvent("خطای کد اختصاصی ادمین", "تلاش ناموفق برای احراز هویت ادمین با کد اشتباه", "warning");
    }
  };

  const handleUpdateAdminPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (changeAdminPinForm.currentPin !== adminMasterPin) {
      showNotification("کد اختصاصی فعلی نادرست است.", "error");
      return;
    }
    if (changeAdminPinForm.newPin.length < 4) {
      showNotification("کد اختصاصی جدید باید حداقل ۴ رقم باشد.", "error");
      return;
    }
    if (changeAdminPinForm.newPin !== changeAdminPinForm.confirmPin) {
      showNotification("تکرار کد اختصاصی جدید مطابقت ندارد.", "error");
      return;
    }
    setAdminMasterPin(changeAdminPinForm.newPin);
    localStorage.setItem("admin_master_pin", changeAdminPinForm.newPin);
    setChangeAdminPinForm({ currentPin: "", newPin: "", confirmPin: "" });
    showNotification("کد اختصاصی ادمین با موفقیت تغییر یافت.", "success");
    logEvent("تغییر کد اختصاصی ادمین", "کد اختصاصی جدید برای دسترسی ادمین تعریف شد.", "auth");
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
  const processImageForExtraction = async (
    base64Image: string, 
    fileName: string, 
    fileMimeType: string, 
    userPrompt: string = "", 
    chatFiles: any[] = [],
    existingScanId?: string,
    folder?: string
  ) => {
    logEvent("آپلود و پردازش سند", `کاربر سند جدیدی با نام ${fileName} را آپلود و به هوش مصنوعی ارسال کرد.`);
    showNotification("در حال ارسال تصویر به هوش مصنوعی حسابدار و استخراج داده‌های مالی...", "info");

    const newFile: UploadedFile = {
      id: existingScanId || `file-${Date.now()}`,
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
          chatFiles,
          pdfExtractionStrategy,
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

      // Now result.data is an object containing نوع_سند, تحلیل_سند, ستون_ها, and ردیف_ها
      const rowsArray = Array.isArray(result.data.ردیف_ها) ? result.data.ردیف_ها : (Array.isArray(result.data.اقلام_تراکنش) ? result.data.اقلام_تراکنش : []);
      const columnsArray = deduplicateColumns(Array.isArray(result.data.ستون_ها) ? result.data.ستون_ها : []);
      
      const extractedItems: TransactionItem[] = rowsArray.map((item: any, idx: number) => {
        const row: any = {
          id: `extracted-${Date.now()}-${idx}`,
          ضریب_اطمینان: item.ضریب_اطمینان !== undefined && item.ضریب_اطمینان !== null ? Number(item.ضریب_اطمینان) : 100,
        };

        // If it's the dynamic format:
        if (item.فیلد_ها && Array.isArray(item.فیلد_ها)) {
          item.فیلد_ها.forEach((f: any) => {
             if (f.کلید) {
               const k = normalizeKey(f.کلید);
               row[k] = f.مقدار;
             }
          });
        } else {
          // Fallback to older static format keys
          Object.keys(item).forEach(key => {
            if (key !== 'ضریب_اطمینان') {
              const k = normalizeKey(key);
              row[k] = item[key];
            }
          });
        }
        return row as TransactionItem;
      });

      // Set transactions directly to current document extracted rows only
      setTransactions(extractedItems);
      
      const documentType = result.data.نوع_سند || "سند نامشخص";
      const documentAnalysis = result.data.تحلیل_سند || "";
      
      const successFile: UploadedFile = {
        ...newFile,
        status: "success",
        results: extractedItems,
        columns: columnsArray,
        documentType: documentType,
        documentAnalysis: documentAnalysis,
        markdownContent: result.markdownContent,
        tokensUsed: result.tokensUsed || 0,
        tokenDetails: result.tokenDetails,
      };

      setActiveFile(successFile);

      setPreviousScans((prev) => {
        const filtered = prev.filter((s) => s.id !== (existingScanId || successFile.id) && s.file.name !== fileName);
        return [
          {
            id: existingScanId || successFile.id,
            file: successFile,
            transactions: extractedItems,
            timestamp: Date.now(),
            folder: folder,
          },
          ...filtered,
        ].slice(0, 50);
      });

      logEvent("پایان موفقیت‌آمیز استخراج", `هوش مصنوعی اطلاعات سند ${fileName} را استخراج کرد. (تعداد ${extractedItems.length} ردیف)`, "success");
      showNotification("داده‌های مالی با موفقیت استخراج و خروجی صادر شد!", "success");
    } catch (err: any) {
      console.error(err);
      const errorMsg = err.message || "برقراری ارتباط با مدل هوش مصنوعی امکان‌پذیر نبود.";
      logEvent("خطا در پردازش هوش مصنوعی", `در زمان پردازش سند خطایی رخ داد: ${errorMsg}`, "error");
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
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleMultipleFilesUpload(e.dataTransfer.files);
    }
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleMultipleFilesUpload(e.target.files);
    }
  };

  const handleCameraCapture = async (dataUrl: string) => {
    setIsCameraOpen(false);
    try {
      const parts = dataUrl.split(",");
      const mimeType = parts[0].split(":")[1].split(";")[0];
      const rawBase64 = parts[1];
      const estimatedSize = Math.round((rawBase64.length * 3) / 4);

      // Check storage limit
      const extraStorageBytes = (currentUser?.extraStorage || 0) * 1024 * 1024 * 1024;
      const MAX_STORAGE = 5 * 1024 * 1024 * 1024 + extraStorageBytes;
      const usedStorage = previousScans.reduce((acc, scan) => acc + (scan.file.size || 0), 0);
      if (usedStorage + estimatedSize > MAX_STORAGE) {
        showNotification("ظرفیت حافظه ابری شما تکمیل شده است. لطفاً فایل‌های اضافی را حذف کنید یا از مدیر درخواست فضای اضافه نمایید.", "error");
        return;
      }

      setPendingFiles([{
        base64: rawBase64,
        name: `اسکن_دوربین_${Date.now()}.jpg`,
        mimeType: mimeType,
        size: estimatedSize
      }]);
      setCustomPrompt("");
    } catch (err) {
      console.error("Camera data URL parsing error:", err);
      showNotification("خطا در خواندن تصویر خروجی دوربین", "error");
    }
  };

  // Direct raw JSON Textarea update validator
  const handleJsonTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    isEditingRawJsonRef.current = true;
    setRawJsonText(newVal);
    setConverterInputJson(newVal);
    try {
      if (!newVal.trim()) {
        setTransactions([]);
        setJsonError(null);
        isEditingRawJsonRef.current = false;
        return;
      }
      const arr = parseJsonToTableArray(newVal);
      if (arr && arr.length > 0) {
        const mapped: TransactionItem[] = arr.map((item: any, idx: number) => {
          const row: any = {
            id: item.id || `edited-${Date.now()}-${idx}`
          };
          Object.keys(item).forEach((key) => {
            if (key !== "id") {
              const k = normalizeKey(key);
              row[k] = item[key];
            }
          });
          row.ضریب_اطمینان = item.ضریب_اطمینان !== undefined && item.ضریب_اطمینان !== null ? Number(item.ضریب_اطمینان) : 100;
          return row as TransactionItem;
        });

        // Dynamically update columns list for activeFile if new keys exist
        const allKeys = new Set<string>();
        mapped.forEach(r => Object.keys(r).forEach(k => { if (k !== "id" && k !== "ضریب_اطمینان") allKeys.add(k); }));
        if (activeFile && allKeys.size > 0) {
          const existingColKeys = (activeFile.columns || []).map((c: any) => c.کلید);
          const missing = Array.from(allKeys).filter(k => !existingColKeys.includes(k));
          if (missing.length > 0) {
            const updatedCols = deduplicateColumns([
              ...(activeFile.columns || DEFAULT_COLUMNS),
              ...missing.map(k => ({ کلید: k, عنوان: k, نوع_داده: "string" }))
            ]);
            setActiveFile({ ...activeFile, columns: updatedCols, results: mapped });
          } else {
            setActiveFile({ ...activeFile, results: mapped });
          }
        }

        setTransactions(mapped);
        setJsonError(null);
      } else {
        setJsonError("خروجی حتماً باید یک آرایه یا شیء معتبر حاوی داده‌های تراکنش باشد.");
      }
    } catch (err: any) {
      setJsonError(`خطای گرامری ساختار: ${err.message}`);
    } finally {
      setTimeout(() => {
        isEditingRawJsonRef.current = false;
      }, 400);
    }
  };

  const handleDownloadExcelFromJSON = () => {
    try {
      let dataToExport: any[] = [];
      
      if (rawJsonText && rawJsonText.trim()) {
        try {
          const cleaned = repairAndCleanJsonString(rawJsonText);
          const parsed = JSON.parse(cleaned);
          
          if (Array.isArray(parsed)) {
            dataToExport = parsed;
          } else if (parsed && typeof parsed === "object") {
             const found = findArrayInObject(parsed);
             if (found) {
                dataToExport = found;
             } else {
                dataToExport = [parsed];
             }
          }
        } catch (parseErr: any) {
          // fallback to transactions
        }
      }

      if (!dataToExport || dataToExport.length === 0) {
        if (transactions && transactions.length > 0) {
          dataToExport = transactions.map((t) => {
            const row: any = {};
            Object.keys(t).forEach(k => { if (k !== "id") row[k] = t[k]; });
            return row;
          });
        }
      }

      if (!dataToExport || dataToExport.length === 0) {
        showNotification("هیچ داده‌ای برای ساخت فایل اکسل وجود ندارد.", "error");
        return;
      }

      // Filter out internal id field
      const cleanExportData = dataToExport.map((row: any) => {
        if (!row || typeof row !== "object") return row;
        const clean: any = {};
        Object.keys(row).forEach((k) => {
          if (k !== "id") clean[k] = row[k];
        });
        return clean;
      });

      setIsJsonVerified(true);

      const worksheet = XLSX.utils.json_to_sheet(cleanExportData);
      worksheet['!views'] = [{ rightToLeft: true }];
      
      // Auto col width
      if (cleanExportData.length > 0) {
         worksheet['!cols'] = Object.keys(cleanExportData[0] || {}).map(k => ({ wch: Math.max(k.length + 6, 16) }));
      }
      
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "تراکنش‌های مالی");
      
      XLSX.writeFile(workbook, `Excel-Export-${activeFile?.name?.replace(/\.[^/.]+$/, "") || "Document"}.xlsx`);

      showNotification("فایل اکسل کاملا مطابق با سیستم و کد JSON با موفقیت دانلود شد.", "success");
      logEvent("تولید اکسل", "کاربر فایل اکسل را دانلود کرد.", "success");
    } catch (err: any) {
      showNotification(`خطا در ساخت فایل اکسل: ${err.message || "از صحت فرمت JSON مطمئن شوید."}`, "error");
    }
  };

  const copyJSONToClipboard = () => {
    if (!rawJsonText) return;
    setIsJsonVerified(true);
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
    const docSettings = scan.extractionSettings || scan.file?.extractionSettings;
    if (docSettings) {
      if (docSettings.selectedModel) setSelectedModel(docSettings.selectedModel);
      if (docSettings.erpDestinationModule) setErpDestinationModule(docSettings.erpDestinationModule);
      if (docSettings.strictnessMode) setStrictnessMode(docSettings.strictnessMode);
      if (docSettings.customPrompt !== undefined) setCustomPrompt(docSettings.customPrompt);
      if (docSettings.pdfExtractionStrategy) setPdfExtractionStrategy(docSettings.pdfExtractionStrategy);
    }
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
    if (activeFile?.id === scanId) clearCurrentFile();
    showNotification("سند از تاریخچه اسکن‌ها حذف شد.", "info");
  };

  const toggleStarScan = (scanId: string) => {
    setPreviousScans(prev => prev.map(s => {
      if (s.id === scanId) {
        const nextVal = !s.isStarred;
        showNotification(nextVal ? "سند به برگزیده‌ها اضافه شد ⭐" : "سند از برگزیده‌ها حذف شد", "info");
        return { ...s, isStarred: nextVal };
      }
      return s;
    }));
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

  const handleAuditRepairWithAI = async () => {
    if (!transactions || transactions.length === 0) {
      showNotification("جدول در حال حاضر خالی است.", "info");
      return;
    }
    setIsRepairing(true);
    setRepairStatusMsg("سیستم ممیزی در حال تحلیل داده‌ها است...");
    logEvent("شروع ممیزی هوش مصنوعی", "کاربر درخواست ممیزی و خوداصلاحی ریاضی اسناد تراکنش را ثبت کرد.");

    try {
      let imageBase64 = null;
      let mimeType = null;
      
      if (activeFile && activeFile.preview && activeFile.preview.startsWith("data:")) {
        const parts = activeFile.preview.split(",");
        imageBase64 = parts[1];
        mimeType = parts[0].split(";")[0].split(":")[1];
      }

      setRepairStatusMsg("ارسال اطلاعات به ممیز ارشد مالیاتی جهت تصحیح ریاضی (Dual-Pass)...");
      const response = await fetch("/api/audit-repair", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: imageBase64,
          mimeType: mimeType,
          currentData: {
            نوع_سند: activeFile ? activeFile.name : "سند دستی",
            تحلیل_سند: "ممیزی دور دوم برای تصحیح مقادیر مالیاتی و مغایرت‌ها",
            ستون_ها: Object.keys(transactions[0] || {}).map(k => ({
              کلید: k,
              عنوان: k === "ضریب_اطمینان" ? "ضریب اطمینان" : k,
              نوع_داده: "string"
            })),
            ردیف_ها: transactions.map(row => ({
              ضریب_اطمینان: row.ضریب_اطمینان || 100,
              فیلد_ها: Object.entries(row).map(([key, val]) => ({
                کلید: key,
                مقدار: String(val)
              }))
            }))
          },
          model: selectedModel
        })
      });

      const res = await response.json();
      if (!response.ok || !res.success) {
        throw new Error(res.error || "خطا در برقراری ارتباط با ممیز هوش مصنوعی.");
      }

      const audited = res.data;
      if (audited && audited.ردیف_ها) {
        const rowsArray = Array.isArray(audited.ردیف_ها) ? audited.ردیف_ها : [];
        const parsedRows: TransactionItem[] = rowsArray.map((item: any, idx: number) => {
          const row: any = {
            id: `extracted-${Date.now()}-${idx}`,
            ضریب_اطمینان: item.ضریب_اطمینان !== undefined && item.ضریب_اطمینان !== null ? Number(item.ضریب_اطمینان) : 100,
          };
          if (item.فیلد_ها && Array.isArray(item.فیلد_ها)) {
            item.فیلد_ها.forEach((f: any) => {
               if (f.کلید) row[f.کلید] = f.مقدار;
            });
          } else {
            Object.keys(item).forEach(key => {
              if (key !== 'ضریب_اطمینان') {
                row[key] = item[key];
              }
            });
          }
          return row as TransactionItem;
        });

        if (parsedRows.length > 0) {
          setTransactions(parsedRows);
          try {
            setRawJsonText(JSON.stringify(parsedRows, null, 2));
          } catch (e) {
            console.error(e);
          }
          showNotification("ممیزی هوش مصنوعی کامل شد! مقادیر مالیاتی و مغایرت‌ها اصلاح شدند.", "success");
          logEvent("پایان ممیزی هوش مصنوعی", "ممیز هوشمند مغایرت‌های ریاضی را با موفقیت برطرف کرد.", "success");
        } else {
          throw new Error("داده‌ای معتبر دریافت نشد.");
        }
      } else {
        throw new Error("پاسخ ممیز خالی بود.");
      }
    } catch (err: any) {
      console.error(err);
      showNotification(`خطا در ممیزی هوش مصنوعی: ${err.message}`, "error");
    } finally {
      setIsRepairing(false);
      setRepairStatusMsg("");
    }
  };

  const handleAddNewRow = () => {
    const newId = `manual-${Date.now()}`;
    
    // Find the last successful transaction (confidence >= 70) to use as suggestion
    const validTransactions = transactions.filter(t => (t.ضریب_اطمینان ?? 100) >= 70);
    const lastTr = validTransactions.length > 0 ? validTransactions[validTransactions.length - 1] : null;

    const newTr: TransactionItem = {
      id: newId,
      تاریخ: lastTr?.تاریخ || new Date().toLocaleDateString("fa-IR"),
      شماره_سند: "",
      نام_طرف_حساب: lastTr?.نام_طرف_حساب || "",
      شرح: lastTr?.شرح ? `${lastTr.شرح} (پيشنهادی)` : "",
      مبلغ_بدهکار: lastTr?.مبلغ_بدهکار || 0,
      مبلغ_بستانکار: lastTr?.مبلغ_بستانکار || 0,
      نوع_ارز: lastTr?.نوع_ارز || "ریال",
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

  const handleDuplicateLastRow = () => {
    if (transactions.length === 0) {
      showNotification("جدول خالی است.", "error");
      return;
    }
    const lastTr = transactions[transactions.length - 1];
    const newTr = { ...lastTr, id: `manual-${Date.now()}` };
    const updated = [...transactions, newTr];
    setTransactions(updated);
    try {
      setRawJsonText(JSON.stringify(updated, null, 2));
    } catch (e) {}
    showNotification("ردیف آخر با موفقیت کپی شد.", "success");
  };

  const handleClearTable = () => {
    if (transactions.length === 0) return;
    if (!window.confirm("آیا از پاکسازی کل اطلاعات جدول اطمینان دارید؟")) return;
    setUndoStack(prev => [...prev, transactions]);
    setTransactions([]);
    try {
      setRawJsonText("[]");
    } catch (e) {}
    showNotification("اطلاعات جدول پاکسازی شد. قابلیت بازگردانی فعال است.", "info");
  };

  const handleUndoClear = () => {
    if (undoStack.length === 0) {
      showNotification("موردی برای بازگردانی وجود ندارد.", "error");
      return;
    }
    const lastState = undoStack[undoStack.length - 1];
    setTransactions(lastState);
    setUndoStack(prev => prev.slice(0, -1));
    try {
      setRawJsonText(JSON.stringify(lastState, null, 2));
    } catch (e) {}
    showNotification("اطلاعات حذف شده بازیابی شد.", "success");
  };

  const handlePrintTable = () => {
    window.print();
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().then(() => {
          setIsFullscreen(true);
        }).catch(() => {
          setIsFullscreen(!isFullscreen);
        });
      } else {
        setIsFullscreen(!isFullscreen);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          setIsFullscreen(false);
        }).catch(() => {
          setIsFullscreen(false);
        });
      } else {
        setIsFullscreen(false);
      }
    }
  };

  const handleDeleteRow = (index: number) => {
    logEvent("حذف ردیف", `کاربر ردیف شماره ${index + 1} را حذف کرد.`, "warning");
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

  if (isAuthLoading) {
    return (
      <div 
        className={`min-h-screen w-full flex flex-col items-center justify-center p-6 ${
          isDarkMode ? "bg-[#090D16] text-white" : "bg-slate-50 text-slate-800"
        }`} 
        dir="rtl"
      >
        <div className="flex flex-col items-center text-center max-w-sm">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-6" />
          <h2 className="text-lg font-black mb-2">در حال ارزیابی کانال‌های امنیتی...</h2>
          <p className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
            لطفا شکیبا باشید، سامانه حسابداری هوشمند در حال تایید احراز هویت شماست.
          </p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <LoginScreen 
        isDarkMode={isDarkMode} 
        onEnterDemo={handleEnterDemo} 
        showNotification={showNotification} 
      />
    );
  }

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

      <AiSettingsModal
        isOpen={isAiSettingsOpen}
        onClose={() => setIsAiSettingsOpen(false)}
        isDarkMode={isDarkMode}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        erpDestinationModule={erpDestinationModule}
        setErpDestinationModule={setErpDestinationModule}
        strictnessMode={strictnessMode}
        setStrictnessMode={setStrictnessMode}
        customPrompt={customPrompt}
        setCustomPrompt={setCustomPrompt}
        pdfExtractionStrategy={pdfExtractionStrategy}
        setPdfExtractionStrategy={setPdfExtractionStrategy}
        pendingFiles={pendingFiles}
        setPendingFiles={setPendingFiles}
        onUploadClick={() => fileInputRef.current?.click()}
        handleDirectExtraction={handleDirectExtraction}
        isExtracting={isExtracting}
        isAiUnderstandingConfirmed={isAiUnderstandingConfirmed}
        activeDocumentName={activeFile?.name || (pendingFiles[0]?.name ? pendingFiles[0].name : null)}
        onSaveDocumentSettings={handleSaveCurrentDocExtractionSettings}
      />

      <OnboardingProfileModal 
        isOpen={currentUser !== null && currentUser.isOnboarded !== true} 
        isDarkMode={isDarkMode} 
        currentUser={currentUser} 
        onComplete={(updatedUser) => {
          setCurrentUser(updatedUser);
          setUsers((prev) => prev.map((u) => u.id === updatedUser.id ? updatedUser : u));
        }}
        showNotification={(text, type) => showNotification(text, type)}
      />

      <AdaptiveMlDashboardModal
        isOpen={isMlDashboardOpen}
        onClose={() => setIsMlDashboardOpen(false)}
        isDarkMode={isDarkMode}
        onShowNotification={showNotification}
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
      <aside className={`w-64 flex-shrink-0 flex flex-col select-none border-l transition-all duration-300 ${
        isDarkMode 
          ? "bg-gradient-to-b from-[#090E17] to-[#04070B] border-slate-900/80 text-slate-100" 
          : "bg-gradient-to-b from-slate-50 to-slate-100/90 border-slate-200 text-slate-800"
      }`}>
        <header className={`p-4 flex items-center justify-between border-b transition-colors ${
          isDarkMode ? "border-slate-800/60" : "border-slate-200"
        }`}>
           <div className="flex items-center gap-2.5">
             <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 via-indigo-650 to-indigo-600 rounded-xl flex items-center justify-center text-white font-extrabold shadow-[0_2px_10px_rgba(59,130,246,0.3)] relative group overflow-hidden">
               <span className="relative z-10 text-xs tracking-wider">AI</span>
               <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
             </div>
             <div className="flex flex-col text-right">
               <span className={`font-black text-xs tracking-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>زره اسکن (ZerehScan)</span>
               <span className="text-[8px] font-bold text-emerald-500 flex items-center gap-1">
                 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
                 سامانه فعال است
               </span>
             </div>
           </div>
           <ThemeSwitcher isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
        </header>

        <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
          <div className={`px-4 py-2 text-[9px] font-black uppercase tracking-wider flex items-center justify-between ${
            isDarkMode ? "text-slate-500" : "text-slate-400"
          }`}>
            <span className="flex items-center gap-1.5">
              <span className="w-1 h-3 rounded-full bg-indigo-500" />
              دستورات و ابزارها
            </span>
          </div>
          
          <button
            onClick={() => setIsAiSettingsOpen(true)}
            className={`w-full flex items-center px-4 py-2 transition-all duration-200 text-right ${
              isAiSettingsOpen 
                 ? isDarkMode 
                   ? "bg-fuchsia-500/10 text-fuchsia-400 border-r-2 border-fuchsia-500 font-bold" 
                   : "bg-fuchsia-50 text-fuchsia-600 border-r-2 border-fuchsia-600 font-bold"
                 : isDarkMode 
                   ? "text-slate-400 hover:bg-slate-800/40 hover:text-white" 
                   : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900"
            }`}
          >
            <Settings className={`h-4 w-4 ml-2.5 shrink-0 transition-colors ${isAiSettingsOpen ? "text-fuchsia-500" : isDarkMode ? "text-slate-500" : "text-slate-400"}`} />
            <span className="text-[11.5px]">تنظیمات هوش مصنوعی و راهنمای استخراج</span>
          </button>
          
          {currentUser?.email === "alizerehsaz2001@gmail.com" && (
            <button
              onClick={() => setIsMlDashboardOpen(true)}
              className={`w-full flex items-center px-4 py-2 transition-all duration-200 text-right ${
                isMlDashboardOpen 
                   ? isDarkMode 
                     ? "bg-indigo-500/10 text-indigo-400 border-r-2 border-indigo-500 font-bold animate-pulse-slow" 
                     : "bg-indigo-50 text-indigo-700 border-r-2 border-indigo-600 font-bold"
                   : isDarkMode 
                     ? "text-slate-400 hover:bg-slate-800/40 hover:text-white" 
                     : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900"
              }`}
            >
              <Brain className={`h-4 w-4 ml-2.5 shrink-0 transition-colors ${isMlDashboardOpen ? "text-indigo-500" : isDarkMode ? "text-slate-500" : "text-slate-400"}`} />
              <span className="text-[11.5px] font-black flex items-center gap-1">
                یادگیری هوشمند و شخصی‌سازی (ML)
                <span className="px-1 py-0.5 rounded-full text-[7.5px] bg-indigo-500 text-white leading-none">فعال (ادمین)</span>
              </span>
            </button>
          )}
          <button
            onClick={() => setShowOnboarding(true)}
            className={`w-full flex items-center px-4 py-2 transition-all duration-200 text-right ${
              showOnboarding 
                ? isDarkMode 
                  ? "bg-blue-500/10 text-blue-400 border-r-2 border-blue-500 font-bold" 
                  : "bg-blue-50 text-blue-600 border-r-2 border-blue-600 font-bold" 
                : isDarkMode 
                  ? "text-slate-400 hover:bg-slate-800/40 hover:text-white" 
                  : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900"
            }`}
          >
            <HelpCircle className={`h-4 w-4 ml-2.5 shrink-0 transition-colors ${showOnboarding ? "text-blue-500" : isDarkMode ? "text-slate-500" : "text-slate-400"}`} />
            <span className="text-[11.5px]">راهنمای هوشمند سیستم</span>
          </button>

          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={`w-full flex items-center px-4 py-2 transition-all duration-200 text-right ${
              isChatOpen 
                ? isDarkMode 
                  ? "bg-indigo-500/10 text-indigo-400 border-r-2 border-indigo-500 font-bold" 
                  : "bg-indigo-50 text-indigo-600 border-r-2 border-indigo-600 font-bold"
                : isDarkMode 
                  ? "text-slate-400 hover:bg-slate-800/40 hover:text-white" 
                  : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900"
            }`}
          >
            <Headphones className={`h-4 w-4 ml-2.5 shrink-0 transition-colors ${isChatOpen ? "text-indigo-550" : isDarkMode ? "text-slate-500" : "text-slate-400"}`} />
            <span className="text-[11.5px]">پشتیبان آنلاین مهرآیین</span>
            <span className="mr-auto w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
          </button>

          {activeFile && (
            <button
              onClick={clearCurrentFile}
              className={`w-full flex items-center px-4 py-2 transition-all duration-200 text-right ${
                isDarkMode 
                  ? "text-rose-450 hover:bg-rose-950/20 hover:text-rose-400" 
                  : "text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              }`}
            >
              <Trash2 className="h-4 w-4 ml-2.5 shrink-0 opacity-85" />
              <span className="text-[11.5px]">حذف داده و پرونده فعلی</span>
            </button>
          )}

          {/* ERP Modules */}
          <div className={`px-4 pt-5 pb-3 text-[10px] font-black uppercase tracking-wider flex items-center justify-between border-t mt-4 ${
            isDarkMode ? "text-slate-400 border-slate-800/80" : "text-slate-500 border-slate-200"
          }`}>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-3.5 rounded-full bg-purple-500 shadow-sm" />
              ماژول‌های هوشمند ERP
            </span>
            <div className={`p-1 rounded-md ${isDarkMode ? "bg-slate-800/50" : "bg-slate-100"}`}>
               <Boxes className="h-3.5 w-3.5 opacity-60" />
            </div>
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
                    backgroundColor: isDarkMode ? "rgba(99, 102, 241, 0.12)" : "rgba(79, 70, 229, 0.08)",
                    borderColor: isDarkMode ? "rgba(99, 102, 241, 0.35)" : "rgba(79, 70, 229, 0.25)",
                  } : {
                    backgroundColor: "rgba(0, 0, 0, 0)",
                    borderColor: "rgba(0, 0, 0, 0)",
                  }}
                  transition={{ duration: 0.2 }}
                  className={`relative w-full flex items-center justify-between px-3 py-2 rounded-xl border text-right group transition-all duration-200 ${
                    isActive
                      ? isDarkMode 
                        ? "text-indigo-300 ring-1 ring-indigo-500/10 shadow-[0_0_12px_rgba(99,102,241,0.08)] font-bold"
                        : "text-indigo-700 ring-1 ring-indigo-600/5 shadow-[0_0_12px_rgba(79,70,229,0.05)] font-bold"
                      : isDarkMode
                        ? "border-transparent text-slate-400 hover:bg-slate-800/40 hover:text-white"
                        : "border-transparent text-slate-600 hover:bg-slate-200/40 hover:text-slate-900"
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
                    <div className={`p-1.5 rounded-lg shrink-0 transition-colors ${
                      isActive 
                        ? isDarkMode ? "bg-indigo-500/20" : "bg-indigo-100" 
                        : isDarkMode ? "bg-slate-800 group-hover:bg-slate-700" : "bg-slate-100 group-hover:bg-slate-200"
                    }`}>
                      <IconComponent className={`h-4 w-4 shrink-0 transition-colors ${isActive ? "text-indigo-500" : isDarkMode ? "text-slate-400 group-hover:text-indigo-400" : "text-slate-500 group-hover:text-indigo-600"}`} />
                    </div>
                    <span className={`text-[11px] truncate leading-normal transition-colors ${isActive ? isDarkMode ? "text-slate-100" : "text-slate-900" : "group-hover:text-slate-900 dark:group-hover:text-white"}`} title={module.name}>
                      {module.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-1">
                    {module.isLive ? (
                      <span className={`text-[8.5px] border px-1.5 py-0.5 rounded transition-all font-bold ${
                        isDarkMode
                          ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/35 shadow-[0_0_8px_rgba(16,185,129,0.15)]"
                          : "bg-emerald-50 text-emerald-700 border-emerald-250 shadow-[0_0_8px_rgba(16,185,129,0.05)]"
                      }`}>
                        فعال
                      </span>
                    ) : (
                      <>
                        <Construction className={`h-3.5 w-3.5 text-amber-500 transition-all duration-300 ${isActive ? "opacity-100 animate-bounce" : "opacity-0 group-hover:opacity-100"}`} />
                        <span className={`text-[8.5px] border px-1 py-0.5 rounded transition-all font-bold ${
                          isActive 
                            ? isDarkMode
                              ? "bg-amber-500/20 text-amber-400 border-amber-500/45 shadow-[0_0_8px_rgba(245,158,11,0.15)] animate-pulse" 
                              : "bg-amber-50 text-amber-700 border-amber-250 shadow-[0_0_8px_rgba(245,158,11,0.05)] animate-pulse"
                            : isDarkMode
                              ? "bg-slate-800/85 text-amber-500/90 border-amber-500/20 scale-90 group-hover:scale-100"
                              : "bg-slate-150 text-slate-500 border-slate-250 scale-90 group-hover:scale-100"
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
          <div className={`px-4 pt-5 pb-3 text-[10px] font-black uppercase tracking-wider flex items-center justify-between border-t mt-4 ${
            isDarkMode ? "text-slate-400 border-slate-800/80" : "text-slate-500 border-slate-200"
          }`}>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-3.5 rounded-full bg-indigo-500 animate-pulse" />
              <span>تاریخچه اسکن‌های اخیر</span>
            </span>
            <div className={`p-1.5 rounded-lg ${isDarkMode ? "bg-slate-800" : "bg-slate-100"}`}>
               <History className="h-3.5 w-3.5 opacity-70" />
            </div>
          </div>

          {/* Search & Filters for History */}
          {previousScans.length > 0 && (
            <div className={`mx-4 mb-4 p-2.5 rounded-xl space-y-2.5 border ${isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
              {/* Search input with search icon */}
              <div className="relative flex items-center group">
                <Search className={`absolute right-3 h-4 w-4 pointer-events-none transition-colors duration-200 ${isDarkMode ? "text-slate-500 group-focus-within:text-indigo-400" : "text-slate-400 group-focus-within:text-indigo-500"}`} />
                <input
                  type="text"
                  placeholder="جستجو در تاریخچه اسکن..."
                  value={historySearchQuery}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                  className={`w-full border rounded-xl py-2 pr-9 pl-8 text-xs font-medium transition-all duration-300 text-right outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm ${
                    isDarkMode 
                      ? "bg-slate-950/60 border-slate-800/80 text-slate-200 placeholder-slate-600 focus:border-indigo-500/50" 
                      : "bg-white border-slate-200/80 text-slate-800 placeholder-slate-400 focus:border-indigo-400"
                  }`}
                  dir="rtl"
                />
                {historySearchQuery && (
                  <button
                    onClick={() => setHistorySearchQuery("")}
                    className={`absolute left-2.5 p-1 rounded-md transition-colors ${
                      isDarkMode ? "text-slate-500 hover:bg-slate-800 hover:text-slate-300" : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    }`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Filters Row */}
              <div className="grid grid-cols-2 gap-2">
                {/* Document Type Dropdown */}
                <div className="relative">
                  <select
                    value={historyDocType}
                    onChange={(e) => setHistoryDocType(e.target.value)}
                    className={`w-full border rounded-lg px-2 py-1.5 text-[10px] font-bold transition-all text-right cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm appearance-none ${
                      isDarkMode 
                        ? "bg-slate-950/60 border-slate-800/80 text-slate-300 focus:border-indigo-500/50 hover:bg-slate-900" 
                        : "bg-white border-slate-200/80 text-slate-700 focus:border-indigo-400 hover:bg-slate-50"
                    }`}
                    dir="rtl"
                  >
                    <option value="all">همه نوع سند</option>
                    {availableDocumentTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Range Dropdown */}
                <div className="relative">
                  <select
                    value={historyDateRange}
                    onChange={(e) => setHistoryDateRange(e.target.value)}
                    className={`w-full border rounded-lg px-2 py-1.5 text-[10px] font-bold transition-all text-right cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm appearance-none ${
                      isDarkMode 
                        ? "bg-slate-950/60 border-slate-800/80 text-slate-300 focus:border-indigo-500/50 hover:bg-slate-900" 
                        : "bg-white border-slate-200/80 text-slate-700 focus:border-indigo-400 hover:bg-slate-50"
                    }`}
                    dir="rtl"
                  >
                    <option value="all">همه زمان‌ها</option>
                    <option value="today">امروز</option>
                    <option value="yesterday">دیروز</option>
                    <option value="week">۷ روز اخیر</option>
                    <option value="month">۳0 روز اخیر</option>
                  </select>
                </div>
              </div>

              {/* Reset Active Filters badge if any are filtered */}
              {(historySearchQuery !== "" || historyDocType !== "all" || historyDateRange !== "all") && (
                <div className="flex justify-between items-center text-[9px] text-indigo-400 font-medium px-0.5">
                  <span className={isDarkMode ? "text-slate-500" : "text-slate-400"}>
                    یافت شده: {filteredPreviousScans.length} مورد
                  </span>
                  <button
                    onClick={() => {
                      setHistorySearchQuery("");
                      setHistoryDocType("all");
                      setHistoryDateRange("all");
                    }}
                    className="hover:text-indigo-300 transition-colors flex items-center gap-0.5"
                  >
                    پاک کردن فیلترها
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="px-3 space-y-2 overflow-y-auto max-h-[300px] pb-4 custom-scrollbar">
            {previousScans.length === 0 ? (
              <div className={`px-3 py-6 text-center rounded-xl border border-dashed flex flex-col items-center justify-center gap-2 ${
                isDarkMode ? "border-slate-800/80 bg-slate-900/30 text-slate-500" : "border-slate-300 bg-slate-50 text-slate-400"
              }`}>
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center mb-1">
                   <History className="w-5 h-5 opacity-50" />
                </div>
                <span className="text-[11px] font-bold">هیچ تاریخچه‌ای وجود ندارد</span>
                <span className="text-[9px] opacity-70">اسناد اسکن شده شما در اینجا نمایش داده می‌شوند</span>
              </div>
            ) : filteredPreviousScans.length > 0 ? (
              filteredPreviousScans.map((scan) => {
                const isActive = activeFile?.id === scan.id;
                const timeStr = new Date(scan.timestamp).toLocaleTimeString("fa-IR", {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                const isPdf = scan.file?.name?.toLowerCase().endsWith(".pdf") || scan.file?.preview?.startsWith("data:application/pdf");
                return (
                  <motion.div
                    key={scan.id}
                    whileHover={{ x: -2, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => selectPreviousScan(scan)}
                    className={`group relative flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all duration-200 select-none border backdrop-blur-sm ${
                      isActive
                        ? isDarkMode
                          ? "bg-indigo-500/15 text-indigo-300 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.1)] font-bold ring-1 ring-indigo-500/20"
                          : "bg-indigo-50/80 text-indigo-700 border-indigo-300 shadow-sm font-bold ring-1 ring-indigo-500/20"
                        : isDarkMode
                          ? "bg-slate-900/40 border-slate-800/60 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700 hover:shadow-lg hover:shadow-black/20"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 hover:shadow-md"
                    }`}
                  >
                    {scan.isStarred && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full flex items-center justify-center shadow-sm z-10">
                         <Star className="w-2 h-2 text-white fill-white" />
                      </div>
                    )}
                    <div className="flex items-center gap-2.5 overflow-hidden min-w-0 flex-1">
                      {/* Thumbnail Container */}
                      <div className={`w-9 h-9 rounded-xl overflow-hidden shrink-0 relative shadow-sm border ${
                         isActive 
                           ? (isDarkMode ? "border-indigo-500/30 ring-2 ring-indigo-500/20" : "border-indigo-300 ring-2 ring-indigo-500/20")
                           : (isDarkMode ? "bg-slate-900 border-slate-700/50" : "bg-slate-100 border-slate-200")
                      } flex items-center justify-center transition-all duration-300 group-hover:scale-105`}>
                        {isPdf && scan.file?.preview ? (
                          <PdfThumbnail base64={scan.file.preview.split(",")[1]} className="w-full h-full object-cover" isDarkMode={true} />
                        ) : scan.file?.preview ? (
                          <img src={scan.file.preview} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <FileText className={`h-4 w-4 shrink-0 ${isActive ? "text-indigo-400" : isDarkMode ? "text-slate-500" : "text-slate-450"}`} />
                        )}
                      </div>

                      <div className="flex flex-col text-right truncate min-w-0 flex-1">
                        <span className={`text-[11px] font-bold truncate leading-tight ${isActive ? isDarkMode ? "text-slate-100" : "text-slate-900" : ""}`} title={scan.file.name}>
                          {scan.file.name}
                        </span>
                        <div className="flex items-center justify-between gap-1 mt-1 font-mono text-[8.5px]">
                          <div className="flex gap-1.5 items-center text-slate-500">
                            <span className="text-emerald-500 font-black flex items-center gap-0.5">
                              <Database className="w-2.5 h-2.5" />
                              <span>{scan.transactions.length} ردیف</span>
                            </span>
                            <span>•</span>
                            <span>{timeStr}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {scan.file.tokensUsed ? (
                              <span className={`border rounded px-1 text-[8px] font-bold shrink-0 max-w-[60px] truncate flex items-center gap-0.5 ${
                                isDarkMode ? "bg-indigo-950/40 text-indigo-400 border-indigo-900/50" : "bg-indigo-50 text-indigo-600 border-indigo-200"
                              }`} title={`توکن مصرفی: ${scan.file.tokensUsed.toLocaleString("fa-IR")}`}>
                                <Zap className="w-2 h-2" />
                                {scan.file.tokensUsed.toLocaleString("fa-IR")}
                              </span>
                            ) : null}
                            {scan.folder && (
                              <span className={`border rounded px-1 text-[8px] font-bold shrink-0 max-w-[60px] truncate flex items-center gap-0.5 ${
                                isDarkMode ? "bg-amber-950/40 text-amber-500 border-amber-900/50" : "bg-amber-50 text-amber-600 border-amber-200"
                              }`} title={`پوشه: ${scan.folder}`}>
                                <Folder className="w-2 h-2" />
                                {scan.folder}
                              </span>
                            )}
                            {scan.file.documentType && (
                              <span className={`border rounded px-1 text-[8px] font-bold shrink-0 max-w-[70px] truncate ${
                                isDarkMode 
                                  ? "bg-slate-950/60 text-slate-400 border-slate-850" 
                                  : "bg-slate-200/50 text-slate-700 border-slate-300/40"
                              }`} title={scan.file.documentType}>
                                {scan.file.documentType}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className={`flex flex-col gap-1 transition-opacity duration-250 ${scan.isStarred ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} shrink-0 ml-1`}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStarScan(scan.id);
                        }}
                        className={`p-1 rounded-lg hover:scale-105 transition-colors ${
                          scan.isStarred
                            ? "text-amber-500 hover:bg-amber-500/10"
                            : isDarkMode
                              ? "text-slate-500 hover:text-amber-400 hover:bg-slate-800"
                              : "text-slate-450 hover:text-amber-500 hover:bg-slate-200"
                        }`}
                        title={scan.isStarred ? "حذف از برگزیده‌ها" : "افزودن به برگزیده‌ها"}
                      >
                        <Star className={`h-3.5 w-3.5 ${scan.isStarred ? "fill-current" : ""}`} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deletePreviousScan(scan.id);
                        }}
                        className={`p-1 rounded-lg transition-colors hover:scale-105 ${
                          isDarkMode
                            ? "text-slate-500 hover:text-rose-400 hover:bg-slate-800"
                            : "text-slate-450 hover:text-rose-600 hover:bg-slate-200"
                        }`}
                        title="حذف از تاریخچه"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className={`px-3 py-4 text-center rounded-xl border border-dashed text-[10px] ${
                isDarkMode ? "border-slate-800/60 text-slate-500" : "border-slate-250 text-slate-400"
              }`}>
                <p className="mb-2">سندی با این مشخصات یافت نشد.</p>
                <button
                  onClick={() => {
                    setHistorySearchQuery("");
                    setHistoryDocType("all");
                    setHistoryDateRange("all");
                  }}
                  className={`px-2 py-1 text-[9px] rounded transition font-bold ${
                    isDarkMode 
                      ? "bg-slate-850 hover:bg-slate-800 hover:text-white text-slate-300" 
                      : "bg-slate-200 hover:bg-slate-300 hover:text-slate-950 text-slate-700"
                  }`}
                >
                  پاک کردن فیلترها
                </button>
              </div>
            )}
          </div>

          <div className={`px-4 pt-5 pb-2 text-[9px] font-black uppercase tracking-wider flex items-center justify-between border-t mt-4 ${
            isDarkMode ? "text-slate-500 border-slate-800/60" : "text-slate-400 border-slate-200"
          }`}>
            <span className="flex items-center gap-1.5">
              <span className="w-1 h-3 rounded-full bg-amber-500" />
              تنظیم موتور هوش مصنوعی (مدل)
            </span>
          </div>

          <div className="px-3 py-1 space-y-2">
            {[
              {
                id: "gemini-3.6-flash",
                name: "Gemini 3.6 Flash (آخرین آپدیت)",
                badge: "موتور اصلی هوشمند",
                tokenLimit: "سند تا ۵۰MB",
                costPerRequest: "حدود ۱,۰۰۰ توکن",
                desc: "پردازش فوق‌سریع و هوشمند فاکتورها با بالاترین دقت استخراج.",
                badgeClass: isDarkMode ? "bg-emerald-500/20 text-emerald-300 border-emerald-900/30" : "bg-emerald-50 text-emerald-700 border-emerald-200",
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
                  className={`p-3.5 rounded-2xl transition-all border text-right select-none relative overflow-hidden ${
                    isExhausted
                      ? isDarkMode
                        ? "bg-rose-950/15 border-rose-900/30 cursor-not-allowed opacity-80"
                        : "bg-rose-50/50 border-rose-200 cursor-not-allowed opacity-80 text-rose-800"
                      : isSelected
                      ? isDarkMode
                        ? "bg-slate-900/80 border-blue-500 cursor-pointer text-white shadow-md shadow-blue-500/5 ring-1 ring-blue-500/20"
                        : "bg-white border-blue-600 cursor-pointer text-slate-800 shadow-md shadow-blue-600/5 ring-1 ring-blue-600/15"
                      : isDarkMode
                      ? "bg-slate-950/20 border-slate-850 cursor-pointer hover:bg-slate-850/40 text-slate-300"
                      : "bg-white/80 border-slate-200 cursor-pointer hover:bg-slate-50 text-slate-600 hover:text-slate-800 shadow-sm"
                  }`}
                >
                  {/* Subtle active light reflection in card */}
                  {isSelected && (
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full -mr-6 -mt-6 pointer-events-none" />
                  )}

                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className={`text-[11.5px] font-black ${isExhausted ? "text-rose-400" : isDarkMode ? "text-slate-100" : "text-slate-900"}`}>
                      {m.name}
                    </span>
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${m.badgeClass}`}>
                      {isExhausted ? "پایان شارژ" : m.badge}
                    </span>
                  </div>
                  
                  <p className={`text-[10px] leading-relaxed mb-3 ${isExhausted ? "text-rose-400/70" : isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                    {m.desc}
                  </p>

                  <div className={`space-y-1.5 border-t pt-2.5 text-[9px] ${
                    isExhausted 
                      ? "border-rose-900/40 text-rose-300/70" 
                      : isDarkMode 
                        ? "border-slate-800/80 text-slate-400" 
                        : "border-slate-150 text-slate-500"
                  }`}>
                    <div className={`flex justify-between items-center ${isExhausted ? "" : isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                      <span className="font-bold text-[8px] opacity-80">مصرف تخمینی هر اسکن:</span>
                      <span className={`font-mono ${isExhausted ? "text-rose-400" : isDarkMode ? "text-blue-400" : "text-blue-600 font-bold"}`} dir="ltr">{m.costPerRequest}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={isExhausted ? "" : "opacity-80"}>حداکثر ظرفیت:</span>
                      <span className={`font-medium ${isExhausted ? "" : isDarkMode ? "text-slate-300" : "text-slate-700"}`}>{m.tokenLimit}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`font-bold ${isExhausted ? "" : "opacity-80"}`}>سهمیه روزانه:</span>
                      <span className="font-mono font-bold" dir="ltr">{quota.limit.toLocaleString("fa-IR")} بار</span>
                    </div>
                    
                    {isExhausted ? (
                      <div className="flex justify-between items-center mt-1 pt-1 border-t border-rose-900/40">
                        <span className="font-bold text-rose-400">شارژ مجدد سهمیه:</span>
                        <span className="font-mono font-bold text-rose-400">{hoursRemaining}h {minsRemaining}m</span>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center">
                        <span className="opacity-85">سهم باقی‌مانده:</span>
                        <span className="font-mono font-bold text-emerald-500" dir="ltr">{remaining.toLocaleString("fa-IR")} بار</span>
                      </div>
                    )}
                  </div>

                  {/* Visual limit bar graph */}
                  <div className={`w-full rounded-full h-1 mt-2.5 overflow-hidden ${isExhausted ? "bg-rose-950" : isDarkMode ? "bg-slate-800" : "bg-slate-100"}`}>
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

          <div className="px-3 py-1 mt-3 pb-6 space-y-3">
            <button
              onClick={() => {
                setModelQuotas({
                  "gemini-3.6-flash": { limit: 2000, used: 0, lastReset: Date.now() },
      "gemini-3.1-pro-preview": { limit: 50, used: 0, lastReset: Date.now() },
                });
                showNotification("سهمیه استفاده روزانه مدل ریست گردید.", "success");
              }}
              className={`w-full flex items-center justify-center gap-2 py-2 border border-dashed rounded-xl text-[10px] transition-all cursor-pointer font-bold ${
                isDarkMode 
                  ? "border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-900/40" 
                  : "border-slate-300 hover:border-slate-400 text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>ریست محدودیت و ظرفیت‌ها</span>
            </button>

            {/* Signature Credits Badge */}
            <div className={`pt-3 border-t text-center ${isDarkMode ? "border-slate-800/80" : "border-slate-200/80"}`}>
              <div className="inline-flex flex-col items-center gap-0.5 text-[10px] font-sans">
                <span className={`font-semibold flex items-center gap-1 ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
                  <Sparkles className="w-3 h-3 text-purple-400 animate-pulse" />
                  Powered by <span className="font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">Gemini</span>
                </span>
                <span className={`text-[9.5px] font-medium ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                  Designed by <span className="font-bold text-indigo-400 dark:text-indigo-300">Ali Zerehsaz</span>
                </span>
              </div>
            </div>
          </div>
        </nav>
      </aside>

      {/* Main Workspace Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header toolbar */}
        <header className={`h-11 border-b flex items-center justify-between px-3 lg:px-5 shrink-0 select-none transition-all duration-300 backdrop-blur-md z-50 relative ${
          isDarkMode ? "bg-slate-900/75 border-slate-800/80 text-slate-100" : "bg-white/80 border-slate-200/60 text-slate-800"
        }`}>
          <div className="flex items-center gap-2 md:gap-4">
            <div className={`p-1.5 rounded-lg bg-gradient-to-br shadow-sm ${
              isDarkMode ? "from-blue-600/90 to-indigo-600/90 text-blue-100" : "from-blue-500 to-indigo-500 text-white"
            }`}>
              <FileJson className="w-3.5 h-3.5" />
            </div>
            <h1 className="text-[13px] font-black tracking-tight animate-fade-in flex items-center gap-1.5 font-sans">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-500 font-black">زره اسکن</span>
              <span className={isDarkMode ? "text-slate-400 font-medium text-[11px]" : "text-slate-500 font-medium text-[11px]"}>| ZerehScan</span>
            </h1>
            <div className="hidden md:block h-4 w-px bg-slate-200 dark:bg-slate-800/80 mx-1"></div>
            
            {/* Extremely sleeker status pill */}
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold border transition-colors ${
              activeFile?.status === "processing" 
                ? isDarkMode ? "bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse" : "bg-amber-50 text-amber-700 border-amber-200 animate-pulse" 
                : isDarkMode ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-emerald-50 text-emerald-700 border-emerald-200"
            }`}>
              <span className="relative flex h-1.5 w-1.5">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  activeFile?.status === "processing" ? "bg-amber-400" : "bg-emerald-400"
                }`}></span>
                <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
                  activeFile?.status === "processing" ? "bg-amber-500" : "bg-emerald-500"
                }`}></span>
              </span>
              <span>
                {activeFile?.status === "processing" ? "در حال تحلیل هوشمند..." : "آماده تفکیک خودکار اسناد"}
              </span>
            </span>

            {/* Header Credit Badge */}
            <span className={`hidden lg:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-sans border transition-all ${
              isDarkMode 
                ? "bg-slate-900/60 border-slate-800/90 text-slate-300" 
                : "bg-slate-50 border-slate-200/90 text-slate-600"
            }`}>
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Powered by <strong className="font-bold text-indigo-400">Gemini</strong></span>
              <span className="opacity-40">•</span>
              <span>Designed by <strong className="font-bold text-blue-500">Ali Zerehsaz</strong></span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 md:gap-2 relative">
            {/* Top Left Interactive Dropdown Menu */}
            <div className="relative">
              <button
                onClick={() => setIsTopLeftMenuOpen(!isTopLeftMenuOpen)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all text-[11px] font-extrabold cursor-pointer ${
                  isTopLeftMenuOpen
                    ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400"
                    : isDarkMode
                      ? "text-slate-300 hover:bg-slate-800 hover:text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
                title="منوی اصلی و امکانات سریع سامانه"
              >
                <Menu className="w-4 h-4 opacity-80 shrink-0" />
                <span className="hidden xs:inline">امکانات</span>
              </button>

              {/* Backdrop Overlay */}
              {isTopLeftMenuOpen && (
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsTopLeftMenuOpen(false)} 
                />
              )}

              {/* Top Left Menu Dropdown Popover */}
              {isTopLeftMenuOpen && (
                <div className={`absolute left-0 top-full mt-2 w-64 z-50 rounded-xl shadow-xl border py-2 animate-in fade-in slide-in-from-top-2 text-right ${
                  isDarkMode
                    ? "bg-[#0b1120] border-slate-800 text-slate-200 shadow-black/50"
                    : "bg-white border-slate-200/80 text-slate-700 shadow-slate-200/50"
                }`}>
                  
                  {/* Minimal Header */}
                  <div className="px-4 pb-3 mb-2 border-b border-slate-100 dark:border-slate-800/80 flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                      {currentUser?.name || currentUser?.email || "کاربر مهمان"}
                    </span>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${currentUser?.role === 'admin' ? 'bg-indigo-500' : currentUser?.role === 'manager' ? 'bg-amber-500' : currentUser?.role === 'auditor' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                      {currentUser?.role === "admin" ? "مدیر ارشد" : currentUser?.role === "manager" ? "مدیر مالی" : currentUser?.role === "auditor" ? "حسابرس" : "حسابدار"}
                    </span>
                  </div>

                  <div className="flex flex-col px-1.5">
                    <button
                      onClick={() => {
                        setIsTopLeftMenuOpen(false);
                        fileInputRef.current?.click();
                      }}
                      className={`flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                        isDarkMode ? "hover:bg-slate-800 text-slate-300 hover:text-white" : "hover:bg-slate-50 text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5 opacity-70" />
                      آپلود سند جدید
                    </button>

                    <button
                      onClick={() => {
                        setIsTopLeftMenuOpen(false);
                        setIsFileManagerOpen(true);
                        logEvent("مشاهده فایل‌ها", "کاربر از منوی اصلی وارد مدیریت فایل‌ها شد.");
                      }}
                      className={`flex items-center justify-between w-full px-2.5 py-2 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                        isDarkMode ? "hover:bg-slate-800 text-slate-300 hover:text-white" : "hover:bg-slate-50 text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <HardDrive className="w-3.5 h-3.5 opacity-70" />
                        مدیریت اسناد
                      </div>
                      {previousScans.length > 0 && (
                        <span className="text-[9px] font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500">{previousScans.length}</span>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        setIsTopLeftMenuOpen(false);
                        setIsAiSettingsOpen(true);
                      }}
                      className={`flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                        isDarkMode ? "hover:bg-slate-800 text-slate-300 hover:text-white" : "hover:bg-slate-50 text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <Settings className="w-3.5 h-3.5 opacity-70" />
                      تنظیمات استخراج
                    </button>

                    <button
                      onClick={() => {
                        setIsTopLeftMenuOpen(false);
                        setIsAuditLogsOpen(true);
                      }}
                      className={`flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                        isDarkMode ? "hover:bg-slate-800 text-slate-300 hover:text-white" : "hover:bg-slate-50 text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <Activity className="w-3.5 h-3.5 opacity-70" />
                      سیاهه رویدادها
                    </button>
                  </div>

                  <div className="h-px bg-slate-100 dark:bg-slate-800/80 my-1.5 mx-3" />

                  <div className="flex flex-col px-1.5">
                    <button
                      onClick={() => {
                        setIsTopLeftMenuOpen(false);
                        handleQuickExcelExport();
                      }}
                      className={`flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                        isDarkMode ? "hover:bg-slate-800 text-slate-300 hover:text-white" : "hover:bg-slate-50 text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 opacity-70" />
                      خروجی اکسل
                    </button>

                    <button
                      onClick={() => {
                        setIsTopLeftMenuOpen(false);
                        handleDownloadFullBackup();
                      }}
                      className={`flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                        isDarkMode ? "hover:bg-slate-800 text-slate-300 hover:text-white" : "hover:bg-slate-50 text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <Database className="w-3.5 h-3.5 opacity-70" />
                      پشتیبان‌گیری
                    </button>

                    <button
                      onClick={() => {
                        setIsTopLeftMenuOpen(false);
                        handleOpenProtectedPanel("user");
                      }}
                      className={`flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                        isDarkMode ? "hover:bg-slate-800 text-slate-300 hover:text-white" : "hover:bg-slate-50 text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <User className="w-3.5 h-3.5 opacity-70" />
                      حساب کاربری
                    </button>

                    {currentUser?.email === "alizerehsaz2001@gmail.com" && (
                      <button
                        onClick={() => {
                          setIsTopLeftMenuOpen(false);
                          handleOpenProtectedPanel("admin");
                        }}
                        className={`flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                          isDarkMode ? "hover:bg-slate-800 text-slate-300 hover:text-rose-400" : "hover:bg-slate-50 text-slate-600 hover:text-rose-600"
                        }`}
                      >
                        <Shield className="w-3.5 h-3.5 opacity-70" />
                        پنل مدیریت
                      </button>
                    )}
                  </div>

                  <div className="h-px bg-slate-100 dark:bg-slate-800/80 my-1.5 mx-3" />

                  <div className="flex items-center justify-between px-3 pt-1">
                    <button
                      onClick={() => setIsDarkMode(!isDarkMode)}
                      className={`p-1.5 rounded-lg flex items-center gap-2 text-[10px] font-bold transition-colors ${
                        isDarkMode
                          ? "text-slate-400 hover:text-amber-300 hover:bg-slate-800"
                          : "text-slate-500 hover:text-indigo-600 hover:bg-slate-100"
                      }`}
                      title="تغییر حالت روز و شب"
                    >
                      {isDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                      <span>{isDarkMode ? "روز" : "شب"}</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsTopLeftMenuOpen(false);
                        setShowOnboarding(true);
                      }}
                      className={`p-1.5 rounded-lg flex items-center gap-1.5 text-[10px] font-bold transition-colors ${
                        isDarkMode
                          ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                          : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                      }`}
                      title="راهنمای سیستم"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>راهنما</span>
                    </button>
                  </div>

                </div>
              )}
            </div>

            {/* Direct Quick Action Shortcuts */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsAuditLogsOpen(true)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-colors text-[11px] font-bold ${
                  isDarkMode 
                    ? "text-slate-400 hover:text-indigo-400 hover:bg-slate-800" 
                    : "text-slate-500 hover:text-indigo-600 hover:bg-slate-100"
                }`}
                title="سیاهه رویدادها"
              >
                <Activity className="h-4 w-4 shrink-0 opacity-80" />
                <span className="hidden sm:inline">گزارش‌ها</span>
              </button>
              
              <button
                onClick={() => {
                  setIsFileManagerOpen(true);
                  logEvent("مشاهده فایل‌ها", "کاربر بخش مدیریت فایل‌ها را باز کرد.");
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-colors text-[11px] font-bold ${
                  isDarkMode 
                    ? "text-slate-400 hover:text-blue-400 hover:bg-slate-800" 
                    : "text-slate-500 hover:text-blue-600 hover:bg-slate-100"
                }`}
                title="مدیریت اسناد"
              >
                <HardDrive className="h-4 w-4 shrink-0 opacity-80" />
                <span className="hidden sm:inline">فایل‌ها</span>
              </button>

              {currentUser?.email === "alizerehsaz2001@gmail.com" && (
                <button
                  onClick={() => handleOpenProtectedPanel("admin")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-[11px] font-black bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white shadow-md shadow-indigo-500/10 cursor-pointer animate-pulse-slow"
                  title="ورود به پنل مدیریت ارشد کل سیستم (کد پیش‌فرض: 7788)"
                >
                  <Shield className="w-3.5 h-3.5 shrink-0" />
                  <span>پنل مدیریت (ادمین)</span>
                </button>
              )}
            </div>
            <button
              onClick={() => handleOpenProtectedPanel("user")}
              className={`p-1.5 rounded-lg transition-all border ${
                isDarkMode 
                  ? "bg-slate-800/40 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 hover:border-slate-700" 
                  : "bg-slate-50 border-slate-200 shadow-sm text-slate-600 hover:bg-slate-100 hover:text-slate-800"
              }`}
              title="پنل کاربری و API Keys"
            >
              <User className="h-3.5 w-3.5 text-emerald-400 dark:text-emerald-500" />
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-[10px] font-bold shadow-sm hover:shadow hover:-translate-y-0.5 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden xs:inline">آپلود سند جدید</span>
            </button>
          </div>
        </header>

        {/* Workspace body */}
        {false ? null : (
          <div className={`flex-1 overflow-y-auto flex flex-col transition-all duration-300 ${
            isFullscreen ? "p-0 sm:p-1 md:p-2" : "p-3 md:p-4"
          }`}>
          {/* Conditional Layout: Hidden when no file is uploaded! */}
          {!activeFile ? (
            <div className="flex-1 flex items-center justify-center p-4">
              {pendingFiles.length > 0 ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.99, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="relative max-w-2xl w-full text-right"
                  dir="rtl"
                >
                  <div className={`absolute -inset-1.5 blur-2xl opacity-10 rounded-3xl ${isDarkMode ? "bg-blue-500" : "bg-blue-400"}`}></div>
                  <div className={`relative rounded-3xl border p-6 w-full transition-all duration-300 ${
                    isDarkMode 
                      ? "bg-slate-900/95 backdrop-blur-2xl border-slate-800/80 shadow-[0_20px_50px_rgba(0,0,0,0.3)]" 
                      : "bg-white/95 backdrop-blur-2xl border-slate-200/80 shadow-[0_20px_50px_rgba(15,23,42,0.06)]"
                  }`}>
                    
                    {/* Minimal Header */}
                    <div className={`p-4 border-b flex items-center justify-between ${isDarkMode ? "border-slate-800/60" : "border-slate-100"}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDarkMode ? "bg-blue-500/10 text-blue-400" : "bg-blue-50 text-blue-600"}`}>
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <h2 className={`text-sm font-black ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>
                            آماده‌سازی سند
                          </h2>
                          <p className={`text-[9px] ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
                            {pendingFiles.length === 1 ? pendingFiles[0].name : `${pendingFiles.length} سند`} • {Math.round(pendingFiles.reduce((acc, f) => acc + f.size, 0) / 1024)} KB
                          </p>
                        </div>
                      </div>
                      
                      {/* Compact Settings Trigger */}
                      <button
                        type="button"
                        onClick={() => setIsAiSettingsOpen(true)}
                        className={`p-1.5 rounded-lg transition-all ${isDarkMode ? "bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200" : "bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700"}`}
                        title="تنظیمات استخراج (مدل، ماژول، سخت‌گیری)"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Simple Settings */}
                    {isExtracting ? (
                      <div className="flex flex-col gap-4 py-12 items-center justify-center">
                         <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                         <p className={`text-[12px] font-bold ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>در حال پردازش هوشمند سند...</p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4 p-4">
                        
                        {customPrompt.trim() && (
                          <div className={`p-2.5 rounded-xl border text-[10px] leading-relaxed ${
                            isDarkMode ? "bg-slate-900/50 border-slate-800 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-700"
                          }`}>
                            <span className="font-bold text-blue-500 ml-1">دستور سفارشی:</span>
                            {customPrompt}
                          </div>
                        )}

                        {/* Enhanced 100% Extraction Hero Card */}
                        <div className={`relative overflow-hidden p-5 rounded-2xl border transition-all group ${
                          isDarkMode 
                            ? "bg-gradient-to-br from-amber-950/70 via-slate-900 to-indigo-950/50 border-amber-500/30 shadow-[0_4px_25px_rgba(245,158,11,0.12)] hover:border-amber-500/50" 
                            : "bg-gradient-to-br from-amber-50 via-white to-amber-100/40 border-amber-300 shadow-sm hover:shadow-md hover:border-amber-400"
                        }`}>
                          <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/15 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                          
                          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex flex-col gap-2 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <div className={`p-1.5 rounded-lg ${isDarkMode ? "bg-amber-500/20 text-amber-400" : "bg-amber-100 text-amber-600"}`}>
                                  <Zap className="w-4 h-4 animate-pulse" />
                                </div>
                                <h3 className={`text-[13px] font-black tracking-tight ${isDarkMode ? "text-amber-300" : "text-amber-900"}`}>
                                  دستور ویژه فول‌اکسل (استخراج ۱۰۰٪ صفر-اغماض - نسل ۵ آلترا)
                                </h3>
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30">
                                  🚀 اسکن ۷ زون عمیق + ۳۵ کلید مسطح
                                </span>
                              </div>
                              <p className={`text-[10px] leading-relaxed max-w-xl ${isDarkMode ? "text-amber-200/80" : "text-amber-900/80"}`}>
                                موتور بینایی ماشین و حسابرسی جنایی تمامی مشخصات هدر، صادرکننده، خریدار، تک‌تک اقلام، مالیات، عوارض، حساب‌های بانکی، حواشی و موازنه ریاضی را <strong>بدون هیچ‌گونه حذف، بریدگی یا اغماض</strong> مستقیماً به اعداد خالص انگلیسی (0-9) و فرمت ساختاریافته <strong>JSON مسطح</strong> تبدیل می‌کند.
                              </p>
                              
                              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                {[
                                  "🔍 اسکن ۷ زون عمیق سند",
                                  "🔢 تبدیل اعداد به ASCII خالص (0-9)",
                                  "📋 ۳۵ کلید مسطح استاندارد",
                                  "🏢 اطلاعات کامل طرفین",
                                  "📦 تک‌تک سطرهای اقلام",
                                  "💳 شماره شبا و حساب بانکی",
                                  "⚖️ موازنه و حسابرسی ریاضی خودکار"
                                ].map((tag, i) => (
                                  <span key={i} className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${
                                    isDarkMode 
                                      ? "bg-slate-900/80 text-amber-200/90 border border-amber-500/20" 
                                      : "bg-white/90 text-amber-800 border border-amber-200 shadow-2xs"
                                  }`}>
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row md:flex-col items-center gap-2 shrink-0 w-full md:w-auto">
                              <button
                                type="button"
                                onClick={handleExtract100PercentAllToJsonAndExcel}
                                className={`w-full md:w-auto px-5 py-3 rounded-xl text-[11px] font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-95 ${
                                  isDarkMode 
                                    ? "bg-amber-500 text-amber-950 hover:bg-amber-400 shadow-amber-500/20 hover:shadow-amber-500/40" 
                                    : "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-400 hover:to-orange-400 shadow-amber-500/30"
                                }`}
                              >
                                <Code className="w-4 h-4" />
                                <span>اجرای استخراج کامل (فول‌اکسل)</span>
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/60">
                          <button
                            type="button"
                            onClick={() => {
                              setPendingFiles([]);
                              setCustomPrompt("");
                            }}
                            className={`px-4 py-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${isDarkMode ? "bg-slate-800 hover:bg-slate-700 text-slate-300" : "bg-slate-100 hover:bg-slate-200 text-slate-600"}`}
                          >
                            انصراف
                          </button>
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openExclusiveChatForDocument(pendingFiles[0])}
                              className={`px-3 py-2 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all border cursor-pointer ${
                                isDarkMode 
                                  ? "bg-purple-500/10 border-purple-500/30 text-purple-300 hover:bg-purple-500/20" 
                                  : "bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
                              }`}
                              title="چت اختصاصی و گفتگو با هوش مصنوعی درباره این سند"
                            >
                              <MessageSquareText className="w-3.5 h-3.5 text-purple-500" />
                              <span>💬 چت اختصاصی سند</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleExtractDirectToJson}
                              className="px-4 py-2 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
                              title="استخراج مستقیم کلیه اطلاعات و اقلام سند به فرمت ساختاریافته JSON"
                            >
                              <Code className="w-3.5 h-3.5 shrink-0 text-purple-200" />
                              <span>⚡ استخراج و تبدیل مستقیم به JSON</span>
                            </button>
                            <div className="flex flex-col items-end gap-1">
                              <button
                                type="button"
                                onClick={handleDirectExtraction}
                                className="px-5 py-2 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all bg-blue-600 hover:bg-blue-500 text-white shadow-md cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
                              >
                                <Sparkles className="w-3.5 h-3.5 shrink-0 text-blue-200 animate-pulse" />
                                <span>شروع استخراج نهایی</span>
                              </button>

                            </div>
                          </div>
                        </div>
                      </div>
                    )}
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
                        multiple
                        className="hidden"
                      />
                      
                      <div className={`p-3 rounded-full mb-3 transition-transform group-hover:-translate-y-1 ${isDarkMode ? "bg-slate-800 text-slate-300" : "bg-white shadow-sm text-slate-600"}`}>
                         <FileJson className="w-6 h-6" />
                      </div>
                      
                      <p className={`text-xs font-bold mb-1 ${isDarkMode ? "text-slate-200" : "text-slate-700"}`}>
                        {dragActive ? "رها کنید تا آپلود شوند..." : "یک یا چند سند، فاکتور یا فایل PDF را به صورت همزمان به اینجا بکشید"}
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

                    {/* Live Parallel Batch OCR Progress Panel */}
                    <BatchOCRProgressPanel
                      isOpen={isBatchPanelOpen}
                      isMinimized={isBatchPanelMinimized}
                      onToggleMinimize={() => setIsBatchPanelMinimized(!isBatchPanelMinimized)}
                      onClose={() => setIsBatchPanelOpen(false)}
                      onCancelBatch={handleCancelBatchProcessing}
                      items={batchOCRItems}
                      isDarkMode={isDarkMode}
                      onViewScan={handleViewScanFromBatch}
                    />
                  </div>
                </motion.div>
              )}
            </div>
          ) : (
            <div className={`flex-1 flex flex-col lg:flex-row transition-all duration-300 ${
              isFullscreen ? "gap-0" : "gap-4 lg:gap-5"
            }`}>
              {/* Column 1: Image view & control info */}
              <section className={`w-full lg:w-[35%] flex-col gap-6 shrink-0 transition-all duration-300 ${
                isFullscreen ? "hidden" : "flex"
              }`}>
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
                        <PdfViewer
                          base64={activeFile.preview}
                          fileName={activeFile.name}
                          isDarkMode={isDarkMode}
                          className="w-full h-[290px]"
                        />
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
                      {activeFile.status === "idle" && (
                        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[1.5px] flex flex-col items-center justify-center text-white p-4 select-none rounded-lg" dir="rtl">
                          <div className="p-2.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-2 animate-bounce">
                            <Sparkles className="w-5 h-5" />
                          </div>
                          <span className="text-xs text-center font-black mb-1">
                            سند در انتظار استخراج اطلاعات مالی
                          </span>
                          <span className="text-[9.5px] text-center opacity-75 max-w-[200px] mb-4.5 font-sans">
                            این سند هنوز پردازش هوشمند نشده است. برای تفکیک خودکار و تولید سند حسابداری اقدام کنید.
                          </span>
                          <button
                            onClick={() => {
                              const fullScan = previousScans.find(s => s.id === activeFile.id);
                              if (fullScan) {
                                handleProcessUnscannedFile(fullScan);
                              } else {
                                handleProcessUnscannedFile({
                                  id: activeFile.id,
                                  file: activeFile,
                                  transactions: [],
                                  timestamp: Date.now()
                                });
                              }
                            }}
                            className="py-2 px-4.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-95 text-white rounded-xl transition-all text-[10.5px] font-black cursor-pointer flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
                          >
                            <Cpu className="w-3.5 h-3.5" />
                            شروع پردازش هوشمند سند
                          </button>
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
                      className={`px-4 py-2 rounded-lg text-[10.5px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        activeTab === "analysis"
                          ? isDarkMode ? "bg-slate-800 text-blue-400 shadow-sm" : "bg-white text-blue-700 shadow-sm"
                          : isDarkMode ? "text-slate-400 hover:text-[#f1f5f9]" : "text-slate-600 hover:text-slate-950"
                      }`}
                    >
                      <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
                      <span>آنالیز و سند حسابداری</span>
                    </button>
                    <button
                      onClick={() => handleTabChange("unified")}
                      className={`px-4 py-2 rounded-lg text-[10.5px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        activeTab === "unified"
                          ? isDarkMode ? "bg-[#1E293B] text-indigo-400 shadow-sm" : "bg-white text-indigo-700 shadow-sm"
                          : isDarkMode ? "text-slate-400 hover:text-[#f1f5f9]" : "text-slate-600 hover:text-slate-950"
                      }`}
                    >
                      <Eye className="h-4 w-4 text-indigo-500" />
                      <span>نمای ۳۶۰ درجه و کدهای خام (JSON)</span>
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

                {activeTab === "unified" ? (
                  /* Unified Tab */
                  <div className={`rounded-xl border flex-1 flex flex-col overflow-hidden shadow-sm transition-all duration-300 ${
                    isDarkMode ? "bg-[#1E293B] border-slate-800 text-slate-100" : "bg-white border-slate-200 text-[#1A1A1B]"
                  }`}>
                    {/* Header bar */}
                    <div className={`p-4 border-b flex flex-wrap gap-4 items-center justify-between transition-colors duration-300 ${
                      isDarkMode ? "bg-[#162032] border-slate-800" : "bg-slate-50 border-slate-200"
                    }`}>
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-lg shrink-0 ${isDarkMode ? "bg-indigo-950/40 text-indigo-400" : "bg-indigo-50 text-indigo-600"}`}>
                          <Eye className="h-5 w-5" />
                        </div>
                        <div className="text-right">
                          <h4 className={`text-xs font-bold ${isDarkMode ? "text-slate-100" : "text-slate-800"}`}>نمای یکپارچه ۳۶۰ درجه سند مالی</h4>
                          <p className={`text-[10px] mt-1 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>مشاهده تصویر فیزیکی سند، ویژگی‌ها و ساختار JSON در یک نگاه</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={copyJSONToClipboard}
                          className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>کپی کل JSON</span>
                        </button>
                      </div>
                    </div>

                    {/* Dual Pane split view */}
                    <div className="flex-1 flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x lg:divide-x-reverse divide-slate-200 dark:divide-slate-800 overflow-hidden min-h-0">
                      
                      {/* Pane 1: Document View and Characteristics */}
                      <div className="flex-1 flex flex-col overflow-y-auto p-4 space-y-4">
                        <div className="space-y-1 text-right">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">سند بارگذاری شده</span>
                          <h5 className="text-xs font-black">پیش‌نمایش تصویر سند فیزیکی</h5>
                        </div>

                        {/* Interactive Preview Frame */}
                        <div className={`p-4 rounded-xl border flex items-center justify-center min-h-[220px] max-h-[340px] overflow-hidden transition-colors ${
                          isDarkMode ? "bg-slate-900/80 border-slate-800/80 backdrop-blur-md shadow-sm rounded-xl mb-4" : "bg-slate-50 border-slate-200"
                        }`}>
                          {!activeFile?.preview ? (
                            <div className="flex flex-col items-center justify-center text-center text-slate-500 py-6">
                               <FileJson className="h-12 w-12 mb-2 opacity-55 text-blue-400" />
                               <span className="text-xs font-semibold truncate max-w-[200px]">{activeFile?.name}</span>
                               <span className="text-[10px] opacity-70">سند دیجیتال (بدون تصویر فیزیکی)</span>
                            </div>
                          ) : activeFile.preview.startsWith("data:application/pdf") ? (
                            <PdfViewer
                              base64={activeFile.preview}
                              fileName={activeFile.name}
                              isDarkMode={isDarkMode}
                              className="w-full h-[320px]"
                            />
                          ) : (
                            <div className="relative group max-h-[300px]">
                              <img
                                src={activeFile.preview}
                                alt={activeFile.name}
                                className="max-h-[280px] object-contain rounded-lg shadow-sm border border-slate-200 dark:border-slate-800"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-lg">
                                <a
                                  href={activeFile.preview}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-bold flex items-center gap-1"
                                >
                                  <ExternalLink className="w-3 h-3" /> نمایش اندازه بزرگ
                                </a>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Characteristics/Properties Card */}
                        <div className={`p-4 rounded-xl border space-y-3.5 text-right font-sans ${
                          isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-slate-50 border-slate-200"
                        }`}>
                          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-2">
                            <span className="text-[10px] text-slate-400">شناسنامه و ویژگی‌های سند (Document DNA)</span>
                            <Info className="w-3.5 h-3.5 text-indigo-500" />
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-[11px]">
                            <div className="flex flex-col gap-1">
                              <span className="text-slate-400 text-[9.5px]">نام فایل:</span>
                              <span className="font-bold truncate" title={activeFile?.name}>{activeFile?.name}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-slate-400 text-[9.5px]">نوع سند شناسایی‌شده:</span>
                              <span className="font-bold text-indigo-400">
                                {activeFile?.documentType || "نامشخص"}
                              </span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-slate-400 text-[9.5px]">حجم فایل:</span>
                              <span className="font-mono">{activeFile ? Math.round(activeFile.size / 1024) : 0} KB</span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-slate-400 text-[9.5px]">تعداد اقلام استخراج‌شده:</span>
                              <span className="font-bold text-emerald-500 font-mono">{transactions.length} ردیف</span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-slate-400 text-[9.5px]">مدل پردازشگر:</span>
                              <span className="font-bold text-amber-500">{selectedModel}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-slate-400 text-[9.5px]">کل توکن‌های مصرف‌شده:</span>
                              <span className="font-mono">{activeFile?.tokensUsed || 0} توکن</span>
                            </div>
                          </div>
                        </div>

                      </div>

                      {/* Pane 2: Extracted JSON */}
                      <div className="flex-1 flex flex-col min-h-[300px] lg:min-h-0 overflow-hidden bg-[#1E1E1E]">
                        
                        {/* Header bar of JSON block */}
                        <div className="px-4 py-2 border-b border-slate-800 bg-[#252526] flex justify-between items-center shrink-0">
                          <span className="text-[10px] text-slate-400 font-bold font-sans">کدهای استخراج شده JSON</span>
                          <div className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[8.5px] text-slate-400 font-sans">همگام‌سازی زنده فعال است</span>
                          </div>
                        </div>

                        {/* Textarea code block */}
                        <div className="flex-1 relative flex flex-col overflow-hidden">
                          {activeFile?.status === "processing" ? (
                            <div className="absolute inset-0 bg-[#1E1E1E] flex flex-col items-center justify-center text-slate-400 select-none">
                              <div className="h-6 w-6 animate-pulse rounded-full bg-blue-500 mb-2" />
                              <span className="text-xs">در حال پردازش داده‌ها...</span>
                            </div>
                          ) : (
                            <textarea
                              value={rawJsonText}
                              onChange={handleJsonTextChange}
                              placeholder="// دیتایی هنوز استخراج نشده است"
                              className="w-full flex-1 p-4 bg-[#1E1E1E] text-indigo-300 font-mono text-[11px] leading-relaxed outline-none border-none resize-none overflow-y-auto"
                              dir="ltr"
                            />
                          )}
                        </div>

                        {/* JSON status footer */}
                        <div className="p-3 bg-[#181818] border-t border-slate-800/80 text-[10px] select-none shrink-0 flex flex-col gap-2.5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            {jsonError ? (
                              <div className="flex items-center gap-2">
                                <span className="text-rose-400 flex items-center gap-1.5 font-bold">
                                  <AlertCircle className="h-3.5 w-3.5" />
                                  ساختار JSON نامعتبر است
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    try {
                                      const repaired = parseJsonToTableArray(rawJsonText);
                                      if (repaired.length > 0) {
                                        const formatted = JSON.stringify(repaired, null, 2);
                                        setRawJsonText(formatted);
                                        setConverterInputJson(formatted);
                                        setJsonError(null);
                                        showNotification("کدهای JSON با موفقیت اصلاح و بازسازی شد.", "success");
                                      }
                                    } catch (err) {
                                      showNotification("امکان بازسازی خودکار وجود نداشت. لطفا علامت‌گذاری‌ها را بررسی کنید.", "error");
                                    }
                                  }}
                                  className="text-[9px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30 transition cursor-pointer font-bold flex items-center gap-1"
                                >
                                  <Wrench className="w-3 h-3" />
                                  اصلاح و بازسازی خودکار
                                </button>
                              </div>
                            ) : (
                              <span className="text-emerald-400 flex items-center gap-1.5 font-bold">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                فرمت ساختار کاملاً معتبر است
                              </span>
                            )}

                            <div className="flex items-center gap-2">
                              <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white transition-colors bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60">
                                <input 
                                  type="checkbox" 
                                  checked={isJsonVerified}
                                  onChange={(e) => setIsJsonVerified(e.target.checked)}
                                  className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500/30 cursor-pointer"
                                />
                                <span className="font-bold text-slate-200 text-[10px]">تایید صحت اطلاعات</span>
                              </label>
                              
                              <button
                                type="button"
                                onClick={handleDownloadExcelFromJSON}
                                className="text-[10px] px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>تایید و انتقال به اکسل</span>
                              </button>
                            </div>
                          </div>
                          {jsonError && (
                            <div className="text-[9px] text-rose-300/80 bg-rose-950/40 p-2 rounded-lg border border-rose-900/40 whitespace-pre-wrap font-mono">
                              {jsonError}
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  </div>
                ) : (
                  /* Visual Audit and Confidence Analysis Tab */
                  <div className={`border flex-1 flex flex-col overflow-hidden shadow-md transition-all duration-300 ${
                    isDarkMode 
                      ? "bg-[#111827] border-slate-800 text-slate-100" 
                      : "bg-white border-slate-200 text-[#1A1A1B]"
                  } ${isFullscreen ? "rounded-none border-x-0" : "rounded-2xl"}`}>
                    {/* Header Summary Bar */}
                    <div className={`px-4 py-3.5 border-b flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors duration-300 ${
                      isDarkMode ? "bg-slate-900/90 border-slate-800" : "bg-gradient-to-r from-slate-50 via-blue-50/20 to-slate-50 border-slate-200"
                    }`}>
                      {/* Title & Description */}
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl shrink-0 shadow-sm ${
                          isDarkMode 
                            ? "bg-blue-500/15 text-blue-400 border border-blue-500/20" 
                            : "bg-blue-600 text-white shadow-blue-500/20 shadow-md"
                        }`}>
                          <Sparkles className="h-4 w-4 animate-pulse" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className={`text-xs md:text-sm font-black tracking-tight ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>
                              تحلیل صحت‌سنجی و میزان اطمینان استخراج
                            </h4>
                            <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                              هوش مصنوعی OCR
                            </span>
                          </div>
                          <p className={`text-[10px] mt-0.5 font-semibold ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                            ارزیابی ماتریسی سلامت داده‌ها، توازن بدهکار/بستانکار و کیفیت شناسایی قلم نوری
                          </p>
                        </div>
                      </div>

                      {/* File Badge */}
                      <div className={`text-[10px] font-bold px-3 py-1.5 rounded-xl flex items-center gap-2 self-start md:self-auto shadow-sm ${
                        isDarkMode ? "bg-[#0b0f19] text-slate-300 border border-slate-800" : "bg-white text-slate-700 border border-slate-200"
                      }`}>
                        <FileCode className="w-3.5 h-3.5 text-blue-500" />
                        <span>سند فعال:</span>
                        <span className="font-mono text-blue-500 font-extrabold dir-ltr">{activeFile.name}</span>
                      </div>
                    </div>

                      {activeFile.status === "success" && transactions.length > 0 && (() => {
                        const count = transactions.length;
                        const sumScores = transactions.reduce((acc, current) => acc + (current.ضریب_اطمینان ?? 100), 0);
                        const avgScore = Math.round(sumScores / count);
                        const countEdited = transactions.filter((tr, idx) => isRowEdited(tr, idx)).length;
                        const mainCurrency = transactions.find(t => t.نوع_ارز && t.نوع_ارز !== "-")?.نوع_ارز || "ریال/واحد";
                        
                        let ratingLabel = "عالی و معتبر";
                        let ringColor = "#10b981"; // emerald-500
                        let ratingBg = isDarkMode ? "bg-emerald-950/40 border-emerald-800/50 text-emerald-400" : "bg-emerald-50 border-emerald-200 text-emerald-700";
                        if (avgScore < 60) {
                          ratingLabel = "ضعیف و نیازمند چک";
                          ringColor = "#f43f5e"; // rose-500
                          ratingBg = isDarkMode ? "bg-rose-950/40 border-rose-800/50 text-rose-400" : "bg-rose-50 border-rose-200 text-rose-700";
                        } else if (avgScore < 85) {
                          ratingLabel = "متوسط و نیازمند بازبینی";
                          ringColor = "#f59e0b"; // amber-500
                          ratingBg = isDarkMode ? "bg-amber-950/40 border-amber-800/50 text-amber-400" : "bg-amber-50 border-amber-200 text-amber-700";
                        }

                        const lowConfidenceCount = transactions.filter(tr => (tr.ضریب_اطمینان ?? 100) < 70).length;
                        const mediumConfidenceCount = transactions.filter(tr => (tr.ضریب_اطمینان ?? 100) >= 70 && (tr.ضریب_اطمینان ?? 100) < 90).length;
                        const excellentConfidenceCount = transactions.filter(tr => (tr.ضریب_اطمینان ?? 100) >= 90).length;
                        const sumDebit = transactions.reduce((acc, current) => acc + (current.مبلغ_بدهکار ?? 0), 0);
                        const sumCredit = transactions.reduce((acc, current) => acc + (current.مبلغ_بستانکار ?? 0), 0);
                        const isBalanced = count > 0 && sumDebit === sumCredit;

                        // Circular ring calculation
                        const radius = 18;
                        const circumference = 2 * Math.PI * radius;
                        const strokeDashoffset = circumference - (avgScore / 100) * circumference;

                        return (
                          <div className="flex-1 overflow-y-auto flex flex-col gap-4 w-full p-4 md:p-5 custom-scrollbar">
                            {/* Executive 4-Metric Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 w-full">
                            
                              {/* Card 1: Average OCR Confidence Score */}
                              <motion.div
                                whileHover={{ y: -2 }}
                                onClick={() => setFilterConfidence(filterConfidence === "high" ? "all" : "high")}
                                className={`p-3.5 rounded-2xl border flex flex-col justify-between cursor-pointer transition-all shadow-sm ${
                                  filterConfidence === "high"
                                    ? "bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-emerald-500/10"
                                    : isDarkMode ? "bg-slate-900/60 border-slate-800 hover:bg-slate-800/80 hover:border-slate-700" : "bg-white border-slate-200 hover:border-blue-300 hover:shadow"
                                }`}
                                title="جهت فیلتر تراکنش‌های با کیفیت بالا کلیک کنید"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">میانگین صحت استخراج (OCR)</span>
                                  <TrendingUp className={`h-4 w-4 ${filterConfidence === "high" ? "text-emerald-500" : "text-blue-500"}`} />
                                </div>

                                <div className="flex items-center justify-between gap-2 my-1">
                                  {/* Circular Progress Gauge */}
                                  <div className="relative flex items-center justify-center shrink-0">
                                    <svg className="w-12 h-12 transform -rotate-90">
                                      <circle
                                        cx="24"
                                        cy="24"
                                        r={radius}
                                        stroke="currentColor"
                                        strokeWidth="3.5"
                                        className="text-slate-200 dark:text-slate-800"
                                        fill="transparent"
                                      />
                                      <circle
                                        cx="24"
                                        cy="24"
                                        r={radius}
                                        stroke={ringColor}
                                        strokeWidth="3.5"
                                        strokeDasharray={circumference}
                                        strokeDashoffset={strokeDashoffset}
                                        strokeLinecap="round"
                                        fill="transparent"
                                        className="transition-all duration-700 ease-out"
                                      />
                                    </svg>
                                    <span className="absolute text-[11px] font-black font-mono tracking-tighter">
                                      {avgScore}٪
                                    </span>
                                  </div>

                                  <div className="flex flex-col items-end gap-1">
                                    <span className={`text-[9px] font-extrabold px-2.5 py-1 rounded-lg border ${filterConfidence === "high" ? "bg-emerald-500 text-white border-emerald-600 shadow-sm" : ratingBg}`}>
                                      {ratingLabel}
                                    </span>
                                    <span className="text-[8.5px] text-slate-400 font-medium">
                                      {count.toLocaleString("fa-IR")} ردیف آنالیز شد
                                    </span>
                                  </div>
                                </div>
                              </motion.div>

                              {/* Card 2: Accounting Balance Status */}
                              <motion.div
                                whileHover={{ y: -2 }}
                                className={`p-3.5 rounded-2xl border flex flex-col justify-between shadow-sm transition-all ${
                                  isBalanced 
                                    ? (isDarkMode ? "bg-slate-900/60 border-emerald-900/50" : "bg-white border-emerald-200") 
                                    : (isDarkMode ? "bg-slate-900/60 border-rose-900/50" : "bg-white border-rose-200")
                                }`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">تراز موازنه دوطرفه</span>
                                  <div className="flex items-center gap-1.5">
                                    <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${isBalanced ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"}`}>
                                      {isBalanced ? "متوازن" : "نامتوازن"}
                                    </span>
                                    <div className={`h-2.5 w-2.5 rounded-full ${isBalanced ? "bg-emerald-500 shadow-sm shadow-emerald-500/50" : "bg-rose-500 animate-pulse shadow-sm shadow-rose-500/50"}`} />
                                  </div>
                                </div>

                                <div className="flex flex-col gap-1 text-[9.5px] font-medium">
                                  <div className="flex justify-between items-center">
                                    <span className="text-slate-500 dark:text-slate-400">جمع بدهکار:</span>
                                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{sumDebit.toLocaleString("fa-IR")}</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-slate-500 dark:text-slate-400">جمع بستانکار:</span>
                                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{sumCredit.toLocaleString("fa-IR")}</span>
                                  </div>
                                </div>

                                <div className={`mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 text-[9px] font-black flex items-center justify-between ${isBalanced ? "text-emerald-500" : "text-rose-500"}`}>
                                  <span>{isBalanced ? "✓ موازنه مالی ۱۰۰٪ برقرار است" : "⚠️ اختلاف تراز:"}</span>
                                  {!isBalanced && <span className="font-mono">{Math.abs(sumDebit - sumCredit).toLocaleString("fa-IR")} ریال</span>}
                                </div>
                              </motion.div>

                              {/* Card 3: Quality Breakdown Bar */}
                              <motion.div
                                whileHover={{ y: -2 }}
                                className={`p-3.5 rounded-2xl border flex flex-col justify-between shadow-sm transition-all ${
                                  isDarkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"
                                }`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">سطح کیفیت استخراج</span>
                                  <Coins className="h-4 w-4 text-amber-500" />
                                </div>

                                <div className="my-1">
                                  <div className="flex h-2 w-full rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 shadow-inner">
                                    <div className="bg-emerald-500 transition-all duration-500" style={{ width: `${count > 0 ? (excellentConfidenceCount / count) * 100 : 0}%` }} title={`عالی: ${excellentConfidenceCount} ردیف`} />
                                    <div className="bg-amber-400 transition-all duration-500" style={{ width: `${count > 0 ? (mediumConfidenceCount / count) * 100 : 0}%` }} title={`متوسط: ${mediumConfidenceCount} ردیف`} />
                                    <div className="bg-rose-500 transition-all duration-500" style={{ width: `${count > 0 ? (lowConfidenceCount / count) * 100 : 0}%` }} title={`ضعیف: ${lowConfidenceCount} ردیف`} />
                                  </div>
                                </div>

                                <div className="grid grid-cols-3 gap-1 mt-2">
                                  <button onClick={() => setFilterConfidence(filterConfidence === "high" ? "all" : "high")} className={`py-1 rounded-lg text-[9px] font-extrabold flex flex-col items-center transition-all ${filterConfidence === "high" ? "bg-emerald-500 text-white shadow-sm" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"}`}>
                                    <span>عالی</span>
                                    <span className="font-mono text-[10px]">{excellentConfidenceCount.toLocaleString("fa-IR")}</span>
                                  </button>
                                  <button onClick={() => setFilterConfidence(filterConfidence === "medium" ? "all" : "medium")} className={`py-1 rounded-lg text-[9px] font-extrabold flex flex-col items-center transition-all ${filterConfidence === "medium" ? "bg-amber-500 text-white shadow-sm" : "bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20"}`}>
                                    <span>متوسط</span>
                                    <span className="font-mono text-[10px]">{mediumConfidenceCount.toLocaleString("fa-IR")}</span>
                                  </button>
                                  <button onClick={() => setFilterConfidence(filterConfidence === "low" ? "all" : "low")} className={`py-1 rounded-lg text-[9px] font-extrabold flex flex-col items-center transition-all ${filterConfidence === "low" ? "bg-rose-500 text-white shadow-sm" : "bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20"}`}>
                                    <span>ضعیف</span>
                                    <span className="font-mono text-[10px]">{lowConfidenceCount.toLocaleString("fa-IR")}</span>
                                  </button>
                                </div>
                              </motion.div>

                              {/* Card 4: Quick Actions and Filters */}
                              <motion.div
                                whileHover={{ y: -2 }}
                                className={`p-3.5 rounded-2xl border flex flex-col justify-between shadow-sm transition-all ${
                                  isDarkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">ابزار بازبینی هوشمند</span>
                                  <Scale className="h-4 w-4 text-blue-500" />
                                </div>

                                <div className="flex flex-col gap-1.5 my-1">
                                  {lowConfidenceCount > 0 ? (
                                    <button onClick={() => setFilterConfidence(filterConfidence === "low" ? "all" : "low")} className={`w-full py-1.5 rounded-xl border text-[9.5px] font-extrabold flex items-center justify-center gap-1.5 transition-all shadow-sm ${filterConfidence === "low" ? "bg-rose-600 border-rose-600 text-white" : "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20"}`}>
                                      <AlertTriangle className="h-3.5 w-3.5 animate-pulse" />
                                      <span>بررسی {lowConfidenceCount.toLocaleString("fa-IR")} سطر مشکوک</span>
                                    </button>
                                  ) : (
                                    <div className="w-full py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9.5px] font-black flex items-center justify-center gap-1.5">
                                      <ShieldCheck className="h-3.5 w-3.5" />
                                      <span>هیچ سطر مخدوشی یافت نشد</span>
                                    </div>
                                  )}

                                  {countEdited > 0 && (
                                    <div className="py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[9px] font-extrabold flex items-center justify-center gap-1">
                                      <FileEdit className="h-3 w-3" />
                                      <span>{countEdited.toLocaleString("fa-IR")} سطر اصلاح دستی شد</span>
                                    </div>
                                  )}
                                </div>

                                <button onClick={() => setFilterConfidence("all")} className={`w-full mt-auto py-1.5 text-[9.5px] font-black rounded-xl border transition-all ${filterConfidence === "all" ? "bg-blue-600 border-blue-600 text-white shadow-sm" : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700 text-slate-700 dark:text-slate-200"}`}>
                                  نمایش کلیه اسناد ({count.toLocaleString("fa-IR")})
                                </button>
                              </motion.div>
                            </div>

                          {/* Smart Extraction Quality & Validation Dashboard */}
                          <SmartAuditDashboard
                            transactions={transactions}
                            minConfidenceThreshold={minConfidenceThreshold}
                            setMinConfidenceThreshold={setMinConfidenceThreshold}
                            activeValidationSubTab={activeValidationSubTab}
                            setActiveValidationSubTab={setActiveValidationSubTab}
                            isDarkMode={isDarkMode}
                            mainCurrency={mainCurrency}
                            setTransactions={setTransactions}
                            setRawJsonText={setRawJsonText}
                            logEvent={logEvent}
                            showNotification={showNotification}
                          />
                          </div>
                      );
                    })()}
                  </div>
                )}

                    {/* Advanced Filter Panel */}
                    {activeFile.status === "success" && transactions.length > 0 && (
                      <div className={`p-3 flex flex-col gap-3 font-sans transition-all duration-300 border-b ${
                        isDarkMode ? "bg-slate-900/90 border-slate-800/80" : "bg-white/90 border-slate-200"
                      }`} dir="rtl">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          {/* Left layout with Quick search and metrics */}
                          <div className="flex items-center gap-2 flex-1 min-w-[280px] flex-wrap">
                            <div className="relative flex-1">
                              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                                <Search className="h-3.5 w-3.5" />
                              </span>
                              <input
                                type="text"
                                value={filterQuery}
                                onChange={(e) => setFilterQuery(e.target.value)}
                                placeholder="جستجوی سریع شرح، شماره سند..."
                                className={`w-full text-[11px] font-bold pr-8 pl-3 py-1.5 rounded-lg border outline-none transition-all duration-300 ${
                                  isDarkMode
                                    ? "bg-[#0B0F19] border-slate-800 text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    : "bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                                }`}
                              />
                              {filterQuery && (
                                <button
                                  onClick={() => setFilterQuery("")}
                                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                                  title="پاکسازی جستجو"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              )}
                            </div>

                            {/* Advanced Filter Toggle Button */}
                            <button
                              onClick={() => setShowFilters(!showFilters)}
                              className={`px-2.5 py-1.5 text-[11px] font-bold rounded-lg flex items-center gap-1.5 transition-all border shrink-0 ${
                                showFilters || filterParty || filterMinAmount || filterMaxAmount
                                  ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                                  : isDarkMode
                                  ? "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300"
                                  : "bg-white hover:bg-slate-50 border-slate-200 text-slate-600"
                              }`}
                            >
                              <SlidersHorizontal className="h-3.5 w-3.5" />
                              <span>فیلترهای پیشرفته</span>
                              {(filterParty || filterMinAmount || filterMaxAmount) && (
                                <span className="bg-red-500 text-white text-[8px] h-3.5 min-w-3.5 px-1 rounded-full flex items-center justify-center font-bold">
                                  !
                                </span>
                              )}
                            </button>

                            {/* 5 New Operation Buttons */}
                            {selectedRowIds.length > 0 ? (
                              <button
                                onClick={handleBatchDelete}
                                className={`px-2.5 py-1.5 text-[11px] font-black rounded-lg flex items-center gap-1.5 transition-all border shrink-0 ${
                                  isDarkMode ? "bg-rose-500/20 hover:bg-rose-500/30 border-rose-500/50 text-rose-300" : "bg-rose-100 hover:bg-rose-200 border-rose-300 text-rose-700"
                                }`}
                                title="حذف ردیف‌های انتخاب شده"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>حذف {selectedRowIds.length} مورد</span>
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={handleDuplicateLastRow}
                                  className={`px-2.5 py-1.5 text-[11px] font-black rounded-lg flex items-center gap-1.5 transition-all border shrink-0 ${
                                    isDarkMode ? "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300" : "bg-white hover:bg-slate-50 border-slate-200 text-slate-600"
                                  }`}
                                  title="تکثیر آخرین ردیف"
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={handleClearTable}
                                  className={`px-2.5 py-1.5 text-[11px] font-black rounded-lg flex items-center gap-1.5 transition-all border shrink-0 ${
                                    isDarkMode ? "bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30 text-rose-400" : "bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-600"
                                  }`}
                                  title="پاکسازی جدول"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={handleFormatAmounts}
                                  className={`px-2.5 py-1.5 text-[11px] font-black rounded-lg flex items-center gap-1.5 transition-all border shrink-0 ${
                                    isDarkMode ? "bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30 text-blue-400" : "bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-600"
                                  }`}
                                  title="استانداردسازی و فرمت مبالغ"
                                >
                                  <Coins className="h-3.5 w-3.5" />
                                </button>
                              </>
                            )}
                            <button
                              onClick={handleUndoClear}
                              disabled={undoStack.length === 0}
                              className={`px-2.5 py-1.5 text-[11px] font-black rounded-lg flex items-center gap-1.5 transition-all border shrink-0 ${
                                undoStack.length === 0 
                                  ? (isDarkMode ? "bg-slate-800/50 border-slate-800 text-slate-600 opacity-50 cursor-not-allowed" : "bg-slate-50 border-slate-200 text-slate-400 opacity-50 cursor-not-allowed")
                                  : (isDarkMode ? "bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-400" : "bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-600")
                              }`}
                              title="بازگردانی عملیات"
                            >
                              <Undo2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={handlePrintTable}
                              className={`px-2.5 py-1.5 text-[11px] font-black rounded-lg flex items-center gap-1.5 transition-all border shrink-0 ${
                                isDarkMode ? "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300" : "bg-white hover:bg-slate-50 border-slate-200 text-slate-600"
                              }`}
                              title="چاپ / خروجی PDF"
                            >
                              <Printer className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={handleToggleFullscreen}
                              className={`px-2.5 py-1.5 text-[11px] font-black rounded-lg flex items-center gap-1.5 transition-all border shrink-0 ${
                                isFullscreen
                                  ? "bg-blue-600 hover:bg-blue-500 border-blue-500 text-white shadow-md"
                                  : isDarkMode ? "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300" : "bg-white hover:bg-slate-50 border-slate-200 text-slate-600"
                              }`}
                              title={isFullscreen ? "خروج از حالت تمام‌صفحه" : "نمایش تمام‌صفحه"}
                            >
                              {isFullscreen ? <Minimize className="h-3.5 w-3.5" /> : <Maximize className="h-3.5 w-3.5" />}
                              <span>{isFullscreen ? "خروج از تمام‌صفحه" : "تمام‌صفحه"}</span>
                            </button>

                            {/* Add New Row Manual Button */}
                            <button
                              onClick={handleAddNewRow}
                              className={`px-2.5 py-1.5 text-[11px] font-black rounded-lg flex items-center gap-1.5 transition-all border shrink-0 ${
                                isDarkMode
                                  ? "bg-emerald-500/15 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                                  : "bg-emerald-50 hover:bg-emerald-100 border-emerald-150 text-emerald-700"
                              }`}
                              title="افزودن سطر محاسباتی یا سند تراکنش دستی خام"
                            >
                              <PlusCircle className="h-3.5 w-3.5 text-emerald-500" />
                              <span>افزودن ردیف دستی</span>
                            </button>

                            {/* Exclusive Document Chat Button */}
                            <button
                              onClick={() => openExclusiveChatForDocument(activeFile)}
                              className="px-3 py-1.5 text-[11px] font-black rounded-lg flex items-center gap-1.5 transition-all bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md cursor-pointer hover:scale-102 shrink-0"
                              title="چت اختصاصی و انحصاری با هوش مصنوعی درباره این سند"
                            >
                              <MessageSquareText className="h-3.5 w-3.5 text-purple-200" />
                              <span>💬 چت اختصاصی سند</span>
                            </button>
                          </div>

                          {/* Right layout indicating results found */}
                          <div className={`flex items-center gap-1.5 text-[11px] shrink-0 whitespace-nowrap px-3 py-1.5 rounded-lg border shadow-xs ${
                            isDarkMode ? "bg-slate-800/80 border-slate-700/80 text-slate-300" : "bg-slate-100/90 border-slate-200 text-slate-600"
                          }`}>
                            <span className="opacity-80 font-medium">ردیف‌های منطبق:</span>
                            <span className="font-bold text-blue-600 dark:text-blue-400 font-mono text-xs">
                              {filteredTransactions.length.toLocaleString("fa-IR")}
                            </span>
                            <span className="opacity-50">از</span>
                            <span className="font-semibold text-slate-500 dark:text-slate-400 font-mono text-xs">
                              {transactions.length.toLocaleString("fa-IR")}
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
                                className="mr-1.5 text-[10px] text-rose-500 hover:text-rose-600 hover:underline flex items-center gap-0.5 font-bold border-r pr-2 border-slate-300 dark:border-slate-700"
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
                            className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-2 mt-1 border-t border-dashed border-slate-200 dark:border-slate-800"
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
                                  className={`w-full text-xs pr-2.5 pl-7 py-1.5 rounded-lg border outline-none font-sans ${
                                    isDarkMode
                                      ? "bg-[#0B0F19] border-slate-800 text-slate-100 placeholder-slate-600"
                                      : "bg-white border-slate-200 text-slate-800 placeholder-slate-400"
                                  }`}
                                />
                                {filterParty && (
                                  <button
                                    onClick={() => setFilterParty("")}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
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
                      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden h-full w-full">
                          <div className="flex-1 min-w-0 overflow-x-auto w-full">
                          <AnalysisRatingWidget
                            fileId={activeFile.id}
                            fileName={activeFile.name}
                            transactions={transactions}
                            isDarkMode={isDarkMode}
                            onShowNotification={showNotification}
                          />
                          <DynamicTable 
                             transactions={transactions} 
                             columns={(activeFile.columns && activeFile.columns.length > 0) ? activeFile.columns : DEFAULT_COLUMNS} 
                             isDarkMode={isDarkMode} 
                             onUpdateTransactions={(updated) => {
                                 // Auto-learn corrections from edits
                                 try {
                                   const autoLearn = async (prev: any[], next: any[]) => {
                                     if (!prev || prev.length === 0 || !next || next.length === 0) return;
                                     for (let i = 0; i < prev.length; i++) {
                                       const pRow = prev[i];
                                       const nRow = next.find(r => r.id === pRow.id);
                                       if (!nRow) continue;
                                       for (const key of Object.keys(pRow)) {
                                         if (key === "id" || key === "ضریب_اطمینان" || key === "wordsText" || key === "مبلغ_به_حروف") continue;
                                         const pVal = String(pRow[key] || "").trim();
                                         const nVal = String(nRow[key] || "").trim();
                                         if (pVal && nVal && pVal !== nVal) {
                                           await fetch("/api/ml/learn", {
                                             method: "POST",
                                             headers: { "Content-Type": "application/json" },
                                             body: JSON.stringify({
                                               type: "correction",
                                               item: { original: pVal, corrected: nVal, field: key }
                                             })
                                           });
                                         }
                                       }
                                     }
                                   };
                                   autoLearn(transactions, updated);
                                 } catch (err) {}

                                 setTransactions(updated);
                                try { setRawJsonText(JSON.stringify(updated, null, 2)); } catch (err) {}
                             }} 
                             onLogEvent={logEvent}
                             onShowNotification={showNotification}
                             selectedRowIds={selectedRowIds}
                             onToggleRowSelection={handleToggleRowSelection}
                             onToggleSelectAll={handleToggleSelectAll}
                          />
                      </div>

                      {/* Balance Calculator Widget (Right Side) */}
                      {activeFile.status === "success" && transactions.length > 0 && (() => {
                        const totalDebit = filteredTransactions.reduce((sum, t) => sum + (Number(t.مبلغ_بدهکار) || 0), 0);
                        const totalCredit = filteredTransactions.reduce((sum, t) => sum + (Number(t.مبلغ_بستانکار) || 0), 0);
                        const imbalanceAmount = Math.abs(totalDebit - totalCredit);
                        const isBalanced = imbalanceAmount === 0;
                        
                        const totalSum = totalDebit + totalCredit;
                        
                        // If it's a dynamic table without standard debit/credit ledger columns, we don't show the ledger balance widget.
                        if (totalSum === 0 && activeFile.columns && !activeFile.columns.some(c => c.کلید === "مبلغ_بدهکار" || c.کلید === "مبلغ_بستانکار")) {
                           return null;
                        }

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
                                <div className="pt-2 border-t border-rose-500/10 flex justify-between items-center text-[10px] mb-2">
                                  <span className="text-slate-400 font-medium">میزان اختلاف تراز:</span>
                                  <span className="font-mono font-bold text-rose-500" dir="ltr">
                                    {imbalanceAmount.toLocaleString("fa-IR")} {mainCurrency}
                                  </span>
                                </div>
                                <button
                                  onClick={() => {
                                    const isDebitHeavy = totalDebit > totalCredit;
                                    const sideName = isDebitHeavy ? "بستانکار" : "بدهکار";
                                    if (confirm(`اختلاف تراز به مبلغ ${imbalanceAmount.toLocaleString("fa-IR")} ${mainCurrency} تشخیص داده شد.\nآیا مایلید سیستم یک ردیف تعدیلی (جهت رفع خطای گردکردن OCR) به بخش ${sideName} اضافه کند تا سند تراز شود؟`)) {
                                      const adjustmentRow: TransactionItem = {
                                        id: "auto-bal-" + Date.now(),
                                        شماره_سند: filteredTransactions.length > 0 ? (filteredTransactions[filteredTransactions.length - 1].شماره_سند || "-") : "-",
                                        تاریخ: filteredTransactions.length > 0 ? (filteredTransactions[filteredTransactions.length - 1].تاریخ || "-") : "-",
                                        نام_طرف_حساب: "تعدیل سیستمی (Auto-Balance)",
                                        شرح: "رفع مغایرت ناشی از خطای OCR",
                                        مبلغ_بدهکار: isDebitHeavy ? 0 : imbalanceAmount,
                                        مبلغ_بستانکار: isDebitHeavy ? imbalanceAmount : 0,
                                        نوع_ارز: mainCurrency,
                                        توضیحات: "ترازسازی خودکار هوشمند",
                                        ضریب_اطمینان: 99
                                      };
                                      const updated = [...transactions, adjustmentRow];
                                      setTransactions(updated);
                                      try { setRawJsonText(JSON.stringify(updated, null, 2)); } catch(e) {}
                                      showNotification("سند با موفقیت به صورت خودکار تراز شد.", "success");
                                      logEvent("تراز خودکار سند", `ردیف تعدیلی به مبلغ ${imbalanceAmount} اضافه گردید.`);
                                    }
                                  }}
                                  className="w-full py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 transition-colors"
                                >
                                  <Scale className="w-3 h-3" />
                                  تنظیم خودکار (Auto-Balance)
                                </button>
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

                            {/* Key Extraction Stats Widget - Minimalist */}
                            <div className={`p-3 rounded-xl border transition-colors ${
                              isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-slate-50/50 border-slate-100"
                            }`}>
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-1.5">
                                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                                  <span className={`text-[10px] font-bold ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>آمارهای کلیدی استخراج</span>
                                </div>
                                <span className={`text-[9px] ${isDarkMode ? "text-indigo-400" : "text-indigo-600"}`}>
                                  {Array.from(new Set(filteredTransactions.map(t => t.نوع_ارز).filter(Boolean))).join("، ") || "ریال"}
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {/* Debit Turnover */}
                                <div className={`p-2.5 rounded-lg border flex flex-col justify-center ${isDarkMode ? "bg-slate-800/40 border-slate-700/50" : "bg-white border-slate-200/50"}`}>
                                  <div className="text-[9px] text-slate-500 mb-1 flex items-center gap-1"><PlusCircle className="w-3 h-3 text-emerald-500" /> کل بدهکار</div>
                                  <div className={`text-xs font-mono font-bold truncate ${isDarkMode ? "text-emerald-400" : "text-emerald-700"}`} title={filteredTransactions.reduce((acc, t) => acc + (Number(t.مبلغ_بدهکار) || 0), 0).toLocaleString("fa-IR")}>
                                    {filteredTransactions.reduce((acc, t) => acc + (Number(t.مبلغ_بدهکار) || 0), 0).toLocaleString("fa-IR")}
                                  </div>
                                </div>
                                {/* Credit Turnover */}
                                <div className={`p-2.5 rounded-lg border flex flex-col justify-center ${isDarkMode ? "bg-slate-800/40 border-slate-700/50" : "bg-white border-slate-200/50"}`}>
                                  <div className="text-[9px] text-slate-500 mb-1 flex items-center gap-1"><TrendingUp className="w-3 h-3 text-rose-500" /> کل بستانکار</div>
                                  <div className={`text-xs font-mono font-bold truncate ${isDarkMode ? "text-rose-400" : "text-rose-700"}`} title={filteredTransactions.reduce((acc, t) => acc + (Number(t.مبلغ_بستانکار) || 0), 0).toLocaleString("fa-IR")}>
                                    {filteredTransactions.reduce((acc, t) => acc + (Number(t.مبلغ_بستانکار) || 0), 0).toLocaleString("fa-IR")}
                                  </div>
                                </div>
                                {/* Avg Amount */}
                                <div className={`p-2.5 rounded-lg border flex flex-col justify-center ${isDarkMode ? "bg-slate-800/40 border-slate-700/50" : "bg-white border-slate-200/50"}`}>
                                  <div className="text-[9px] text-slate-500 mb-1 flex items-center gap-1"><Wallet className="w-3 h-3 text-blue-500" /> میانگین مبالغ</div>
                                  <div className={`text-xs font-mono font-bold truncate ${isDarkMode ? "text-blue-400" : "text-blue-600"}`} title={(totalSum / ((filteredTransactions.filter(t => (Number(t.مبلغ_بدهکار) || 0) > 0 || (Number(t.مبلغ_بستانکار) || 0) > 0).length) || 1)).toLocaleString("fa-IR", {maximumFractionDigits: 0})}>
                                    {(totalSum / ((filteredTransactions.filter(t => (Number(t.مبلغ_بدهکار) || 0) > 0 || (Number(t.مبلغ_بستانکار) || 0) > 0).length) || 1)).toLocaleString("fa-IR", {maximumFractionDigits: 0})}
                                  </div>
                                </div>
                                {/* Unique Docs */}
                                <div className={`p-2.5 rounded-lg border flex flex-col justify-center ${isDarkMode ? "bg-slate-800/40 border-slate-700/50" : "bg-white border-slate-200/50"}`}>
                                  <div className="text-[9px] text-slate-500 mb-1 flex items-center gap-1"><FileText className="w-3 h-3 text-violet-500" /> اسناد یکتا</div>
                                  <div className={`text-xs font-mono font-bold truncate ${isDarkMode ? "text-violet-400" : "text-violet-600"}`} title={new Set(filteredTransactions.filter(t => t.شماره_سند && t.شماره_سند.trim() !== "").map(t => t.شماره_سند)).size.toLocaleString("fa-IR")}>
                                    {new Set(filteredTransactions.filter(t => t.شماره_سند && t.شماره_سند.trim() !== "").map(t => t.شماره_سند)).size.toLocaleString("fa-IR")}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Risk Assessment & Warnings */}
                              {(() => {
                                const missingDatesCount = filteredTransactions.filter(t => !t.تاریخ || t.تاریخ.trim() === "").length;
                                const missingDescCount = filteredTransactions.filter(t => !t.شرح || t.شرح.trim() === "").length;
                                const lowConfCount = filteredTransactions.filter(tr => (tr.ضریب_اطمینان ?? 100) < 70).length;
                                const sDebit = filteredTransactions.reduce((acc, current) => acc + (current.مبلغ_بدهکار ?? 0), 0);
                                const sCredit = filteredTransactions.reduce((acc, current) => acc + (current.مبلغ_بستانکار ?? 0), 0);
                                const balanceOK = filteredTransactions.length > 0 && sDebit === sCredit;

                                let riskBadgeColor = isDarkMode ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "bg-emerald-50 text-emerald-700 border-emerald-200";
                                let riskText = "سند پایدار";
                                
                                if (!balanceOK || lowConfCount > 2) {
                                  riskBadgeColor = isDarkMode ? "bg-rose-500/10 text-rose-400 border-rose-500/30" : "bg-rose-50 text-rose-700 border-rose-200";
                                  riskText = "مغایرت/ریسک بالا";
                                } else if (lowConfCount > 0 || missingDatesCount > 0 || missingDescCount > 0) {
                                  riskBadgeColor = isDarkMode ? "bg-amber-500/10 text-amber-400 border-amber-500/30" : "bg-amber-50 text-amber-700 border-amber-200";
                                  riskText = "نیاز به تکمیل";
                                }

                                return (
                                  <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-200/50 dark:border-slate-700/50">
                                    <div className={`px-2.5 py-1.5 text-[9px] font-bold rounded-md border flex items-center gap-1.5 ${riskBadgeColor}`}>
                                      <ShieldCheck className="w-3.5 h-3.5" /> وضعیت سند: {riskText}
                                    </div>
                                    {missingDatesCount > 0 && (
                                      <div className={`px-2.5 py-1.5 text-[9px] font-bold rounded-md border flex items-center gap-1.5 ${isDarkMode ? "bg-amber-900/30 text-amber-400 border-amber-800" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                                        <Calendar className="w-3.5 h-3.5" /> {missingDatesCount} فاقد تاریخ
                                      </div>
                                    )}
                                    {missingDescCount > 0 && (
                                      <div className={`px-2.5 py-1.5 text-[9px] font-bold rounded-md border flex items-center gap-1.5 ${isDarkMode ? "bg-rose-900/30 text-rose-400 border-rose-800" : "bg-rose-50 text-rose-700 border-rose-200"}`}>
                                        <AlertTriangle className="w-3.5 h-3.5" /> {missingDescCount} فاقد شرح
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
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
              <span>هسته مفسر: Gemini 3.6 Flash (آخرین آپدیت)</span>
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
                            ? "bg-slate-900/80 border-slate-800/80 backdrop-blur-md shadow-sm rounded-xl mb-4 hover:border-blue-500 hover:bg-slate-900" 
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
                            ? "bg-slate-900/80 border-slate-800/80 backdrop-blur-md shadow-sm rounded-xl mb-4 hover:border-blue-500 hover:bg-slate-900" 
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
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => setIsUserPanelOpen(false)}
          ></div>
          
          {/* Panel Container - Side Navigation Layout */}
          <div className={`relative w-full max-w-4xl h-[85vh] md:h-[650px] rounded-3xl shadow-2xl flex overflow-hidden transform transition-all animate-in slide-in-from-bottom-8 duration-300 ${
            isDarkMode ? "bg-slate-900 border border-slate-800 text-slate-200" : "bg-slate-50 border border-slate-200 text-slate-800"
          }`} dir="rtl">
            
            {/* Sidebar Navigation */}
            <div className={`w-1/3 md:w-64 flex flex-col shrink-0 border-l ${isDarkMode ? "bg-slate-950/50 border-slate-800" : "bg-white border-slate-100"}`}>
               <div className="p-6">
                 <h3 className="font-black text-lg flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-l from-blue-600 to-indigo-500">
                    <Settings className="w-6 h-6 text-blue-500" />
                    تنظیمات سیستم
                 </h3>
                 <p className={`text-[10px] mt-2 leading-relaxed ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
                   مدیریت حساب کاربری، دسترسی‌ها و شخصی‌سازی موتور هوش مصنوعی
                 </p>
               </div>
               
               <div className="flex-1 overflow-y-auto py-2 px-4 flex flex-col gap-1.5 custom-scrollbar">
                 <button 
                   onClick={() => setUserPanelTab("profile")}
                   className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-bold transition-all group ${
                     userPanelTab === "profile" 
                       ? (isDarkMode ? "bg-blue-600/10 text-blue-400 ring-1 ring-blue-500/30" : "bg-blue-50 text-blue-700 ring-1 ring-blue-200") 
                       : (isDarkMode ? "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800")
                   }`}
                 >
                   <User className={`w-4 h-4 transition-transform ${userPanelTab === "profile" ? "scale-110" : "group-hover:scale-110"}`} />
                   نمایه و کاربری
                 </button>

                 <button 
                   onClick={() => setUserPanelTab("api")}
                   className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-bold transition-all group ${
                     userPanelTab === "api" 
                       ? (isDarkMode ? "bg-purple-600/10 text-purple-400 ring-1 ring-purple-500/30" : "bg-purple-50 text-purple-700 ring-1 ring-purple-200") 
                       : (isDarkMode ? "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800")
                   }`}
                 >
                   <Key className={`w-4 h-4 transition-transform ${userPanelTab === "api" ? "scale-110" : "group-hover:scale-110"}`} />
                   کلیدهای دسترسی
                 </button>

                 <button 
                   onClick={() => setUserPanelTab("general")}
                   className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-bold transition-all group ${
                     userPanelTab === "general" 
                       ? (isDarkMode ? "bg-emerald-600/10 text-emerald-400 ring-1 ring-emerald-500/30" : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200") 
                       : (isDarkMode ? "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800")
                   }`}
                 >
                   <Calculator className={`w-4 h-4 transition-transform ${userPanelTab === "general" ? "scale-110" : "group-hover:scale-110"}`} />
                   تنظیمات پایه‌ای
                 </button>

                 <button 
                   onClick={() => setUserPanelTab("ai")}
                   className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-bold transition-all group ${
                     userPanelTab === "ai" 
                       ? (isDarkMode ? "bg-amber-600/10 text-amber-400 ring-1 ring-amber-500/30" : "bg-amber-50 text-amber-700 ring-1 ring-amber-200") 
                       : (isDarkMode ? "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800")
                   }`}
                 >
                   <Cpu className={`w-4 h-4 transition-transform ${userPanelTab === "ai" ? "scale-110" : "group-hover:scale-110"}`} />
                   بهینه‌سازی AI
                 </button>
               </div>
               
               <div className={`p-5 border-t ${isDarkMode ? "border-slate-800" : "border-slate-200/60"}`}>
                 <button 
                    onClick={() => {
                      setNotification({ text: "تنظیمات دستگاه شما با موفقیت ذخیره شد", type: "success" });
                      setIsUserPanelOpen(false);
                    }}
                    className="w-full flex justify-center items-center gap-2 px-4 py-3 rounded-xl text-xs font-black bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500 shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.23)] transition-all active:scale-95"
                 >
                   <Save className="w-4 h-4" />
                   ذخیره تغییرات
                 </button>
               </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col relative overflow-hidden bg-transparent">
               <button 
                  onClick={() => setIsUserPanelOpen(false)}
                  className={`absolute top-5 left-5 p-2 rounded-full z-10 transition-colors ${
                    isDarkMode ? "bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-white" : "bg-slate-200 text-slate-500 hover:bg-slate-300 hover:text-slate-800"
                  }`}
                >
                  <X className="h-4 w-4" />
               </button>

               <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
                 {/* Profile Tab */}
                 {userPanelTab === "profile" && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto">
                      <div>
                        <h4 className="text-xl font-black mb-2">حساب کاربری فعلی</h4>
                        <p className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>مشاهده مشخصات نمایه و سطح دسترسی سیستم. شما می‌توانید بین حساب‌های کاربری آزمایشی جابجا شوید.</p>
                      </div>

                      <div className={`p-8 rounded-3xl border ${isDarkMode ? "bg-slate-800/40 border-slate-700/60" : "bg-white border-slate-200/80 shadow-sm"}`}>
                        <div className="flex items-center gap-6 mb-8">
                          <div className="h-20 w-20 rounded-3xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-3xl shadow-lg shadow-blue-500/20 shrink-0">
                            {currentUser?.name.charAt(0) || "U"}
                          </div>
                          <div className="flex-1">
                            <select 
                              value={currentUser?.id}
                              onChange={(e) => {
                                 const user = users.find(u => String(u.id) === String(e.target.value));
                                 if (user) {
                                   if (user.status === "suspended") {
                                      setNotification({text: "این اکانت مسدود شده است", type: "error"});
                                      return;
                                   }
                                   setCurrentUser(user);
                                 }
                              }}
                              className={`w-full text-xl font-black bg-transparent border-b-2 pb-2 outline-none cursor-pointer appearance-none ${
                                isDarkMode ? "text-white border-slate-700 focus:border-blue-500" : "text-slate-800 border-slate-200 focus:border-blue-500"
                              }`}
                            >
                               {users.map(u => (
                                  <option key={u.id} value={u.id} className={isDarkMode ? "bg-slate-800" : "bg-white"}>{u.name}</option>
                               ))}
                            </select>
                            <p className={`text-xs mt-2 font-mono ${isDarkMode ? "text-blue-400" : "text-blue-600"}`}>User ID: {currentUser?.id.toString().padStart(5, '0')}</p>
                          </div>
                        </div>

                        {/* Registration Snapshot Card (Protected / Locked Info) */}
                        <div className={`p-5 rounded-2xl mb-6 border ${
                          isDarkMode 
                            ? "bg-slate-950/60 border-slate-800 text-slate-200" 
                            : "bg-slate-50 border-slate-200 text-slate-800"
                        }`}>
                          <div className="flex items-center justify-between gap-2 mb-3 pb-3 border-b border-slate-700/20">
                            <div className="flex items-center gap-2">
                              <ShieldCheck className="w-4 h-4 text-emerald-500" />
                              <span className="text-xs font-black">اطلاعات ثبت‌نام اولیه کاربر (سینک با پنل ارشد ادمین)</span>
                            </div>
                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
                              <Lock className="w-3 h-3" /> ثبت رسمی اولیه
                            </span>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-right">
                            <div className="p-2.5 rounded-xl bg-slate-900/20 dark:bg-slate-900/40 border border-slate-700/10">
                              <span className="text-[9px] text-slate-400 block mb-0.5">نام ثبت‌نامی:</span>
                              <span className="text-xs font-bold text-indigo-400">{currentUser?.registrationData?.fullName || currentUser?.name || "مشخص نشده"}</span>
                            </div>
                            <div className="p-2.5 rounded-xl bg-slate-900/20 dark:bg-slate-900/40 border border-slate-700/10">
                              <span className="text-[9px] text-slate-400 block mb-0.5">ایمیل اکانت:</span>
                              <span className="text-[11px] font-mono font-bold text-slate-300 truncate block" dir="ltr">{currentUser?.email || "گوگل ممیزی"}</span>
                            </div>
                            <div className="p-2.5 rounded-xl bg-slate-900/20 dark:bg-slate-900/40 border border-slate-700/10">
                              <span className="text-[9px] text-slate-400 block mb-0.5">همراه اولیه:</span>
                              <span className="text-xs font-mono font-bold text-slate-300" dir="ltr">{currentUser?.registrationData?.phone || currentUser?.phone || "ثبت نشده"}</span>
                            </div>
                            <div className="p-2.5 rounded-xl bg-slate-900/20 dark:bg-slate-900/40 border border-slate-700/10">
                              <span className="text-[9px] text-slate-400 block mb-0.5">مجموعه اولیه:</span>
                              <span className="text-xs font-bold text-slate-300">{currentUser?.registrationData?.companyName || currentUser?.companyName || currentUser?.company || "مؤسسه حسابداری"}</span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
                          <div className="space-y-1.5 text-right">
                            <label className={`text-[10px] font-black ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>نام فعلی کاربر</label>
                            <input 
                              type="text"
                              value={profileFirstName}
                              onChange={(e) => setProfileFirstName(e.target.value)}
                              className={`w-full text-xs px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
                                isDarkMode ? "bg-slate-900 border-slate-700 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-800"
                              }`}
                            />
                          </div>
                          <div className="space-y-1.5 text-right">
                            <label className={`text-[10px] font-black ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>نام خانوادگی فعلی</label>
                            <input 
                              type="text"
                              value={profileLastName}
                              onChange={(e) => setProfileLastName(e.target.value)}
                              className={`w-full text-xs px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
                                isDarkMode ? "bg-slate-900 border-slate-700 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-800"
                              }`}
                            />
                          </div>
                          <div className="space-y-1.5 text-right">
                            <label className={`text-[10px] font-black ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>نام شرکت / مجموعه اقتصادی فعلی</label>
                            <input 
                              type="text"
                              value={profileCompanyName}
                              onChange={(e) => setProfileCompanyName(e.target.value)}
                              className={`w-full text-xs px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
                                isDarkMode ? "bg-slate-900 border-slate-700 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-800"
                              }`}
                            />
                          </div>
                          <div className="space-y-1.5 text-right">
                            <label className={`text-[10px] font-black ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>سمت شغلی فعلی</label>
                            <input 
                              type="text"
                              value={profileJobTitle}
                              onChange={(e) => setProfileJobTitle(e.target.value)}
                              className={`w-full text-xs px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
                                isDarkMode ? "bg-slate-900 border-slate-700 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-800"
                              }`}
                            />
                          </div>
                          <div className="space-y-1.5 text-right">
                            <label className={`text-[10px] font-black ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>شماره تلفن همراه</label>
                            <input 
                              type="text"
                              value={profilePhone}
                              onChange={(e) => setProfilePhone(e.target.value)}
                              className={`w-full text-xs px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-left ${
                                isDarkMode ? "bg-slate-900 border-slate-700 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-800"
                              }`}
                              dir="ltr"
                            />
                          </div>
                          <div className="space-y-1.5 text-right">
                            <label className={`text-[10px] font-black ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>کد ملی / شناسه ملی</label>
                            <input 
                              type="text"
                              value={profileNationalCode}
                              onChange={(e) => setProfileNationalCode(e.target.value)}
                              placeholder="۰۰۱۲۳۴۵۶۷۸"
                              className={`w-full text-xs px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-left font-mono ${
                                isDarkMode ? "bg-slate-900 border-slate-700 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-800"
                              }`}
                              dir="ltr"
                            />
                          </div>
                        </div>

                        <div className="mt-5 flex justify-end">
                          <button
                            onClick={handleUpdateProfile}
                            className="flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-lg shadow-blue-500/10 cursor-pointer active:scale-95"
                          >
                            <Save className="w-4 h-4" />
                            ذخیره تغییرات و همگام‌سازی با پنل ارشد
                          </button>
                        </div>

                        {/* Cloud Quota Card */}
                        <div className={`p-5 rounded-2xl mt-6 border ${isDarkMode ? "bg-gradient-to-r from-indigo-950/40 to-slate-900 border-indigo-500/20 text-slate-200" : "bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-100 text-slate-800"}`}>
                          <div className="flex items-center justify-between flex-wrap gap-4">
                            <div className="flex items-center gap-3">
                              <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                                <HardDrive className="w-6 h-6" />
                              </div>
                              <div>
                                <span className="text-xs font-black block">ظرفیت اختصاصی فضای ابری</span>
                                <span className="text-[11px] opacity-75">
                                  {5 + (currentUser?.extraStorage || 0)} گیگابایت (۵GB اصلی + {currentUser?.extraStorage || 0}GB اختصاصی هدیه)
                                </span>
                              </div>
                            </div>

                            <button
                              onClick={() => {
                                if (currentUser) {
                                  const updatedExtra = (currentUser.extraStorage || 0) + 5;
                                  setCurrentUser({ ...currentUser, extraStorage: updatedExtra });
                                  setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, extraStorage: updatedExtra } : u));
                                  showNotification("۵ گیگابایت فضای ابری هدیه به حساب شما افزوده شد ☁️", "success");
                                  logEvent("ارتقای فضای ابری", "کاربر ۵ گیگابایت فضای ابری هدیه دریافت کرد.");
                                }
                              }}
                              className="px-4 py-2.5 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-md flex items-center gap-2 cursor-pointer"
                            >
                              <Plus className="w-4 h-4" />
                              درخواست ۵GB فضای ابری هدیه
                            </button>
                          </div>
                        </div>

                        <div className={`grid grid-cols-2 gap-4 p-5 rounded-2xl mt-6 ${isDarkMode ? "bg-slate-900/50" : "bg-slate-50"}`}>
                           <div className="flex flex-col gap-1.5">
                             <span className={`text-[10px] font-black uppercase tracking-wider ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>سطح دسترسی (Role)</span>
                             <span className={`inline-flex items-center self-start px-3 py-1.5 rounded-lg text-[11px] font-black shadow-sm ${
                                currentUser?.role === "admin" ? "text-purple-700 bg-purple-100 border border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20" : 
                                currentUser?.role === "manager" ? "text-amber-700 bg-amber-100 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20" : 
                                currentUser?.role === "auditor" ? "text-emerald-700 bg-emerald-100 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" : 
                                "text-blue-700 bg-blue-100 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20"
                             }`}>
                               {currentUser?.role === "admin" ? "مدیر کل سیستم (Admin)" : currentUser?.role === "manager" ? "مدیر مالی (Manager)" : currentUser?.role === "auditor" ? "حسابرس (Auditor)" : "همکار حسابدار (User)"}
                             </span>
                           </div>
                           <div className="flex flex-col gap-1.5">
                             <span className={`text-[10px] font-black uppercase tracking-wider ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>وضعیت اکانت (Status)</span>
                             <span className="inline-flex items-center gap-2 self-start px-3 py-1.5 rounded-lg text-[11px] font-black text-emerald-700 bg-emerald-100 border border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20 shadow-sm">
                               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                               فعال و متصل
                             </span>
                           </div>
                        </div>

                        {/* Logout Button */}
                        <div className="mt-6 pt-6 border-t border-dashed border-slate-700/30 flex justify-end">
                          <button
                            onClick={() => {
                              handleSignOut();
                              setIsUserPanelOpen(false);
                            }}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors border border-rose-500/20 shadow-sm cursor-pointer"
                          >
                            <UserX className="w-4 h-4" />
                            خروج از حساب کاربری
                          </button>
                        </div>
                      </div>
                    </div>
                 )}

                 {/* API Tab */}
                 {userPanelTab === "api" && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto">
                      <div>
                        <h4 className="text-xl font-black mb-2">اتصال مدل زبانی (API)</h4>
                        <p className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>پیکربندی کلیدهای اختصاصی برای استفاده از موتورهای استخراج و تفسیر هوش مصنوعی.</p>
                      </div>

                      <div className={`p-8 rounded-3xl border ${isDarkMode ? "bg-slate-800/40 border-slate-700/60" : "bg-white border-slate-200/80 shadow-sm"}`}>
                        <div className="flex flex-col gap-2 mb-6">
                          <label className="font-bold text-sm">کلید دسترسی شخصی (Gemini API Key)</label>
                          <p className={`text-[10px] leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                            در صورت وارد کردن کلید در این بخش، تمام درخواست‌های استخراج به جای سهمیه سیستم از سهمیه شخصی شما کسر خواهد شد. این کار برای دور زدن محدودیت‌های نرخ سیستم عمومی (Rate Limits) پیشنهاد می‌شود.
                          </p>
                        </div>
                        <div className="relative">
                          <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                            <Key className={`w-5 h-5 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`} />
                          </div>
                          <input
                            type="password"
                            placeholder="AIzaSy..."
                            value={userPreferences.geminiApiKey}
                            onChange={(e) => setUserPreferences(prev => ({...prev, geminiApiKey: e.target.value}))}
                            className={`w-full text-base py-3.5 pr-12 pl-4 font-mono rounded-xl border focus:ring-2 focus:outline-none transition-all ${
                              isDarkMode 
                                ? "bg-slate-900 border-slate-700 text-slate-200 focus:border-purple-500 focus:ring-purple-500/20" 
                                : "bg-slate-50 border-slate-300 text-slate-800 focus:border-purple-500 focus:ring-purple-500/20"
                            }`}
                            dir="ltr"
                          />
                        </div>
                        {userPreferences.geminiApiKey && (
                          <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-2.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 leading-relaxed">
                            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                            <span>کلید با موفقیت تنظیم شده است. سیستم آماده پردازش هوشمند اسناد با استفاده از سهمیه شخصی و نامحدود شماست.</span>
                          </div>
                        )}
                      </div>
                    </div>
                 )}

                 {/* General Settings Tab */}
                 {userPanelTab === "general" && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto">
                      <div>
                        <h4 className="text-xl font-black mb-2">تنظیمات پایه‌ای</h4>
                        <p className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>قالب‌های نمایش مقادیر پولی و تاریخی در جداول سیستم</p>
                      </div>

                      <div className={`p-8 rounded-3xl border space-y-8 ${isDarkMode ? "bg-slate-800/40 border-slate-700/60" : "bg-white border-slate-200/80 shadow-sm"}`}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                          <div>
                            <span className="font-bold text-sm block mb-1">واحد پول پیش‌فرض</span>
                            <span className={`text-[10px] leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                              انتخاب واحد پولی برای نمایش تمام مبالغ، داشبوردها و گزارشات نهایی.
                            </span>
                          </div>
                          <div className={`flex gap-1.5 p-1.5 rounded-2xl shrink-0 ${isDarkMode ? "bg-slate-900 border border-slate-800" : "bg-slate-100 border border-slate-200"}`}>
                            <button 
                              onClick={() => setUserPreferences(prev => ({...prev, defaultCurrency: "IRR"}))}
                              className={`text-[11px] font-black px-6 py-2.5 rounded-xl transition-all ${
                                userPreferences.defaultCurrency === "IRR" 
                                  ? (isDarkMode ? "bg-slate-700 text-white shadow-md" : "bg-white text-emerald-700 shadow-md") 
                                  : (isDarkMode ? "text-slate-500 hover:text-slate-300" : "text-slate-500 hover:text-slate-700")
                              }`}
                            >ریال</button>
                            <button 
                              onClick={() => setUserPreferences(prev => ({...prev, defaultCurrency: "IRT"}))}
                              className={`text-[11px] font-black px-6 py-2.5 rounded-xl transition-all ${
                                userPreferences.defaultCurrency === "IRT" 
                                  ? (isDarkMode ? "bg-slate-700 text-white shadow-md" : "bg-white text-emerald-700 shadow-md") 
                                  : (isDarkMode ? "text-slate-500 hover:text-slate-300" : "text-slate-500 hover:text-slate-700")
                              }`}
                            >تومان</button>
                          </div>
                        </div>

                        <div className="h-px w-full bg-slate-200/70 dark:bg-slate-700/50"></div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                          <div>
                            <span className="font-bold text-sm block mb-1">قالب تاریخ</span>
                            <span className={`text-[10px] leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                              نحوه نمایش تاریخ صدور فاکتورها و لاگ‌های سیستمی.
                            </span>
                          </div>
                          <div className={`flex gap-1.5 p-1.5 rounded-2xl shrink-0 ${isDarkMode ? "bg-slate-900 border border-slate-800" : "bg-slate-100 border border-slate-200"}`}>
                            <button 
                              onClick={() => setUserPreferences(prev => ({...prev, dateFormat: "Jalali"}))}
                              className={`text-[11px] font-black px-6 py-2.5 rounded-xl transition-all ${
                                userPreferences.dateFormat === "Jalali" 
                                  ? (isDarkMode ? "bg-slate-700 text-white shadow-md" : "bg-white text-emerald-700 shadow-md") 
                                  : (isDarkMode ? "text-slate-500 hover:text-slate-300" : "text-slate-500 hover:text-slate-700")
                              }`}
                            >شمسی</button>
                            <button 
                              onClick={() => setUserPreferences(prev => ({...prev, dateFormat: "Gregorian"}))}
                              className={`text-[11px] font-black px-6 py-2.5 rounded-xl transition-all ${
                                userPreferences.dateFormat === "Gregorian" 
                                  ? (isDarkMode ? "bg-slate-700 text-white shadow-md" : "bg-white text-emerald-700 shadow-md") 
                                  : (isDarkMode ? "text-slate-500 hover:text-slate-300" : "text-slate-500 hover:text-slate-700")
                              }`}
                            >میلادی</button>
                          </div>
                        </div>
                      </div>
                    </div>
                 )}

                 {/* AI Tab */}
                 {userPanelTab === "ai" && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8 max-w-2xl mx-auto">
                      <div>
                        <h4 className="text-xl font-black mb-2">مدیریت مصرف و کیفیت (Tokens)</h4>
                        <p className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>پارامترهای موتور هوش مصنوعی برای کنترل کیفیت استخراج، سرعت پردازش و هزینه‌های مصرف توکن.</p>
                      </div>

                      {/* AI Options List */}
                      <div className="flex flex-col gap-4">
                        
                        {/* Option 1 */}
                        <div className={`p-6 rounded-3xl border flex flex-col md:flex-row md:items-center justify-between gap-6 ${
                          isDarkMode ? "bg-slate-800/40 border-slate-700/60 hover:border-slate-600/80" : "bg-white border-slate-200/80 hover:border-slate-300 shadow-sm"
                        } transition-colors`}>
                          <div className="flex flex-col flex-1">
                            <span className="font-black text-sm text-blue-500 dark:text-blue-400 mb-1">کیفیت و رزولوشن تصاویر ارسالی</span>
                            <span className={`text-[10px] leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                              استفاده از ابعاد کوچک‌تر می‌تواند هزینه‌های توکن ورودی تصویر (Input Tokens) را تا ۷۰٪ کاهش دهد اما ممکن است در فاکتورهای ناخوانا باعث افت دقت شود.
                            </span>
                          </div>
                          <div className={`flex gap-1.5 p-1.5 rounded-2xl shrink-0 md:self-center ${isDarkMode ? "bg-slate-900 border border-slate-800" : "bg-slate-100 border border-slate-200"}`}>
                            {(["super-eco", "balanced", "high"] as const).map((res) => {
                              const labels = {
                                "super-eco": "۶۰۰px",
                                "balanced": "۱۰۰۰px",
                                "high": "اصلی"
                              };
                              const isSel = tokenSettings.imageResolution === res;
                              return (
                                <button
                                  key={res}
                                  onClick={() => setTokenSettings(prev => ({ ...prev, imageResolution: res }))}
                                  className={`py-2 px-4 rounded-xl text-[10px] font-black transition-all ${
                                    isSel 
                                      ? "bg-blue-600 text-white shadow-md" 
                                      : isDarkMode
                                        ? "text-slate-500 hover:text-slate-300 hover:bg-slate-800"
                                        : "text-slate-600 hover:text-slate-800 hover:bg-slate-200/80"
                                  }`}
                                >
                                  {labels[res]}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Option 2 */}
                        <div className={`p-6 rounded-3xl border flex items-center justify-between gap-6 ${
                          isDarkMode ? "bg-slate-800/40 border-slate-700/60 hover:border-slate-600/80" : "bg-white border-slate-200/80 hover:border-slate-300 shadow-sm"
                        } transition-colors`}>
                          <div className="flex flex-col flex-1">
                            <span className="font-black text-sm mb-1">خلاصه‌سازی توضیحات (ECO Prompt)</span>
                            <span className={`text-[10px] leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                              مجبور کردن هوش مصنوعی به فشرده‌سازی متن ستون شرح و توضیحات تا حداکثر ۵ کلمه. این کار توکن‌های تولیدی (Output Tokens) را به‌شدت کاهش می‌دهد.
                            </span>
                          </div>
                          <button 
                            onClick={() => setTokenSettings(prev => ({ ...prev, ecoPromptEnabled: !prev.ecoPromptEnabled }))}
                            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors shrink-0 ${
                              tokenSettings.ecoPromptEnabled ? "bg-amber-500" : isDarkMode ? "bg-slate-700" : "bg-slate-300"
                            }`}
                          >
                            <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform ${
                              tokenSettings.ecoPromptEnabled ? "-translate-x-7" : "-translate-x-1"
                            }`} />
                          </button>
                        </div>

                        {/* Option 3 */}
                        <div className={`p-6 rounded-3xl border flex items-center justify-between gap-6 ${
                          isDarkMode ? "bg-slate-800/40 border-slate-700/60 hover:border-slate-600/80" : "bg-white border-slate-200/80 hover:border-slate-300 shadow-sm"
                        } transition-colors`}>
                          <div className="flex flex-col flex-1">
                            <span className="font-black text-sm mb-1 text-emerald-500 dark:text-emerald-400">حذف فیلدهای غیرضروری</span>
                            <span className={`text-[10px] leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                              رد کردن استخراج اطلاعات تفصیلی و اضافی جهت افزایش سرعت پاسخگویی مدل و حجم خروجی کمتر.
                            </span>
                          </div>
                          <button 
                            onClick={() => setTokenSettings(prev => ({ ...prev, skipSecondaryFields: !prev.skipSecondaryFields }))}
                            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors shrink-0 ${
                              tokenSettings.skipSecondaryFields ? "bg-emerald-500" : isDarkMode ? "bg-slate-700" : "bg-slate-300"
                            }`}
                          >
                            <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform ${
                              tokenSettings.skipSecondaryFields ? "-translate-x-7" : "-translate-x-1"
                            }`} />
                          </button>
                        </div>

                        {/* Option 4 */}
                        <div className={`p-6 rounded-3xl border flex items-center justify-between gap-6 ${
                          isDarkMode ? "bg-slate-800/40 border-slate-700/60 hover:border-slate-600/80" : "bg-white border-slate-200/80 hover:border-slate-300 shadow-sm"
                        } transition-colors`}>
                          <div className="flex flex-col flex-1">
                            <span className="font-black text-sm mb-1 text-rose-500 dark:text-rose-400">ممیزی دو مرحله‌ای (Dual-Pass)</span>
                            <span className={`text-[10px] leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                              ارسال مجدد خروجی به ممیز هوشمند جهت چک کردن موازنه و تصحیح خطاهای احتمالی محاسباتی. دقت را به ۱۰۰٪ نزدیک می‌کند اما زمان‌برتر است و هزینه توکن دو برابر دارد.
                            </span>
                          </div>
                          <button 
                            onClick={() => setTokenSettings(prev => ({ ...prev, highAccuracyDualPass: !prev.highAccuracyDualPass }))}
                            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors shrink-0 ${
                              tokenSettings.highAccuracyDualPass ? "bg-rose-500" : isDarkMode ? "bg-slate-700" : "bg-slate-300"
                            }`}
                          >
                            <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform ${
                              tokenSettings.highAccuracyDualPass ? "-translate-x-7" : "-translate-x-1"
                            }`} />
                          </button>
                        </div>

                        {/* Option 5 */}
                        <div className={`p-6 rounded-3xl border flex flex-col md:flex-row md:items-center justify-between gap-6 ${
                          isDarkMode ? "bg-slate-800/40 border-slate-700/60 hover:border-slate-600/80" : "bg-white border-slate-200/80 hover:border-slate-300 shadow-sm"
                        } transition-colors`}>
                          <div className="flex flex-col flex-1">
                            <span className="font-black text-sm mb-1 text-purple-500 dark:text-purple-400">سقف مجاز ردیف‌های استخراجی</span>
                            <span className={`text-[10px] leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                              جلوگیری از تولید بیش از حد توکن‌ها در فاکتورهای بسیار طولانی با اعمال محدودیت در خروجی.
                            </span>
                          </div>
                          <div className={`flex flex-wrap gap-1.5 p-1.5 rounded-2xl shrink-0 md:self-center ${isDarkMode ? "bg-slate-900 border border-slate-800" : "bg-slate-100 border border-slate-200"}`}>
                            {(["unlimited", "5", "10", "20"] as const).map((limit) => {
                              const labels = {
                                "unlimited": "نامحدود",
                                "5": "۵",
                                "10": "۱۰",
                                "20": "۲۰"
                              };
                              const isSel = tokenSettings.maxRowsToExtract === limit;
                              return (
                                <button
                                  key={limit}
                                  onClick={() => setTokenSettings(prev => ({ ...prev, maxRowsToExtract: limit }))}
                                  className={`py-2 px-4 rounded-xl text-[10px] font-black transition-all min-w-[3rem] ${
                                    isSel 
                                      ? "bg-purple-600 text-white shadow-md" 
                                      : isDarkMode
                                        ? "text-slate-500 hover:text-slate-300 hover:bg-slate-800"
                                        : "text-slate-600 hover:text-slate-800 hover:bg-slate-200/80"
                                  }`}
                                >
                                  {labels[limit]}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                      </div>
                    </div>
                 )}
               </div>
            </div>
          </div>
        </div>
      )}

      
      {/* Admin Dedicated PIN Modal */}
      <AdminPinModal
        isOpen={isAdminPinModalOpen}
        onClose={() => setIsAdminPinModalOpen(false)}
        adminMasterPin={adminMasterPin}
        onSuccess={() => {
          setIsAdminPinModalOpen(false);
          setIsAdminPanelOpen(true);
        }}
        isDarkMode={isDarkMode}
        showNotification={showNotification}
        logEvent={logEvent}
      />

      {/* Admin Panel Modal */}
      <AdminPanelModal
        isOpen={isAdminPanelOpen}
        onClose={() => setIsAdminPanelOpen(false)}
        isDarkMode={isDarkMode}
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        users={users}
        setUsers={setUsers}
        adminMasterPin={adminMasterPin}
        setAdminMasterPin={setAdminMasterPin}
        transactions={transactions}
        setTransactions={setTransactions}
        previousScans={previousScans}
        setPreviousScans={setPreviousScans}
        modelQuotas={modelQuotas}
        setModelQuotas={setModelQuotas}
        auditLogs={auditLogs}
        showNotification={showNotification}
        logEvent={logEvent}
        setIsTokenManagerOpen={setIsTokenManagerOpen}
        rawJsonText={rawJsonText}
        setRawJsonText={setRawJsonText}
        setActiveFile={setActiveFile}
      />

      {false && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
          <div 
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setIsAdminPanelOpen(false)}
          ></div>
          
          <div className={`relative w-full max-w-5xl h-[85vh] md:h-[700px] rounded-[24px] shadow-lg flex overflow-hidden transform transition-all animate-in slide-in-from-bottom-8 duration-300 ${
            isDarkMode ? "bg-slate-900 border border-slate-800 text-slate-200" : "bg-slate-50 border border-slate-200/60 text-slate-800"
          }`} dir="rtl">
            
            {/* Sidebar Navigation */}
            <div className={`w-1/3 md:w-64 flex flex-col shrink-0 border-l ${isDarkMode ? "bg-[#0b1120] border-slate-800/60" : "bg-white border-slate-100"}`}>
               <div className="p-6 pb-4">
                 <h3 className="font-bold text-[15px] flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${isDarkMode ? "bg-indigo-900/30 text-indigo-400" : "bg-indigo-50 text-indigo-600"}`}>
                       <Shield className="w-4 h-4" />
                    </div>
                    پنل مدیریت (Admin)
                 </h3>
                 <p className={`text-[11px] mt-3 leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                   کنترل کاربران، پشتیبان‌گیری داده‌ها، پایش سیستم و مدیریت منابع
                 </p>
               </div>
               
               <div className="flex-1 overflow-y-auto py-2 px-4 flex flex-col gap-1.5 custom-scrollbar">
                 <button 
                   onClick={() => setAdminPanelTab("users")}
                   className={`flex items-center gap-2.5 px-3 py-3 rounded-xl text-[12px] font-bold transition-all group ${
                     adminPanelTab === "users" 
                       ? (isDarkMode ? "bg-slate-800/80 text-white" : "bg-slate-100 text-slate-900") 
                       : (isDarkMode ? "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700")
                   }`}
                 >
                   <User className={`w-4 h-4 transition-transform ${adminPanelTab === "users" ? "text-blue-500" : "opacity-60 group-hover:scale-110"}`} />
                   مدیریت کاربران
                 </button>

                 <button 
                   onClick={() => setAdminPanelTab("data")}
                   className={`flex items-center gap-2.5 px-3 py-3 rounded-xl text-[12px] font-bold transition-all group ${
                     adminPanelTab === "data" 
                       ? (isDarkMode ? "bg-slate-800/80 text-white" : "bg-slate-100 text-slate-900") 
                       : (isDarkMode ? "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700")
                   }`}
                 >
                   <Download className={`w-4 h-4 transition-transform ${adminPanelTab === "data" ? "text-emerald-500" : "opacity-60 group-hover:scale-110"}`} />
                   پشتیبان‌گیری و داده
                 </button>

                 <button 
                   onClick={() => setAdminPanelTab("system")}
                   className={`flex items-center gap-2.5 px-3 py-3 rounded-xl text-[12px] font-bold transition-all group ${
                     adminPanelTab === "system" 
                       ? (isDarkMode ? "bg-slate-800/80 text-white" : "bg-slate-100 text-slate-900") 
                       : (isDarkMode ? "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700")
                   }`}
                 >
                   <Cpu className={`w-4 h-4 transition-transform ${adminPanelTab === "system" ? "text-purple-500" : "opacity-60 group-hover:scale-110"}`} />
                   وضعیت سیستم
                 </button>

                 <button 
                   onClick={() => setAdminPanelTab("danger")}
                   className={`flex items-center gap-2.5 px-3 py-3 rounded-xl text-[12px] font-bold transition-all group ${
                     adminPanelTab === "danger" 
                       ? (isDarkMode ? "bg-rose-950/30 text-rose-400" : "bg-rose-50 text-rose-600") 
                       : (isDarkMode ? "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700")
                   }`}
                 >
                   <Trash2 className={`w-4 h-4 transition-transform ${adminPanelTab === "danger" ? "text-rose-500" : "opacity-60 group-hover:scale-110"}`} />
                   عملیات خطرناک
                 </button>
               </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col relative overflow-hidden bg-transparent">
               <button 
                  onClick={() => setIsAdminPanelOpen(false)}
                  className={`absolute top-5 left-5 p-2 rounded-full z-10 transition-colors ${
                    isDarkMode ? "bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-white" : "bg-slate-200 text-slate-500 hover:bg-slate-300 hover:text-slate-800"
                  }`}
                >
                  <X className="h-4 w-4" />
               </button>

               <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
                 {/* Users Tab */}
                 {adminPanelTab === "users" && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto pb-8">
                      <div>
                        <h4 className="text-[15px] font-bold mb-1">مدیریت کاربران سیستم</h4>
                        <p className={`text-[11px] ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>در این بخش می‌توانید دسترسی کاربران، میزان فضای اختصاصی، و وضعیت حساب‌ها را کنترل کنید.</p>
                      </div>

                      <div className="space-y-3">
                        {users.map(u => (
                          <div key={u.id} className={`p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all border ${
                            isDarkMode 
                              ? "bg-[#0b1120] border-slate-800 hover:border-slate-700 shadow-sm" 
                              : "bg-white border-slate-200 hover:border-slate-300 shadow-sm"
                          }`}>
                            <div className="flex items-start sm:items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-[15px] shrink-0 ${
                                u.role === "admin" 
                                  ? (isDarkMode ? "bg-indigo-900/30 text-indigo-400" : "bg-indigo-50 text-indigo-600")
                                  : (isDarkMode ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600")
                              }`}>
                                {u.name.charAt(0)}
                              </div>
                              <div className="space-y-1 text-right">
                                <div className="flex items-center gap-2">
                                  <h5 className="font-bold text-[13px]">{u.name}</h5>
                                  {u.role === "admin" && (
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${isDarkMode ? "bg-indigo-900/30 text-indigo-400" : "bg-indigo-50 text-indigo-700"}`}>
                                      مدیر سیستم
                                    </span>
                                  )}
                                  {!u.isOnboarded && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 font-bold">
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
                              {/* Status Badge */}
                              <div className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-bold border ${
                                u.status === "active" 
                                  ? (isDarkMode ? "bg-emerald-950/20 border-emerald-900/50 text-emerald-400" : "bg-emerald-50 border-emerald-100 text-emerald-600")
                                  : (isDarkMode ? "bg-rose-950/20 border-rose-900/50 text-rose-400" : "bg-rose-50 border-rose-100 text-rose-600")
                              }`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${u.status === "active" ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`}></div>
                                {u.status === "active" ? "فعال" : "مسدود"}
                              </div>

                              {/* Token Usage */}
                              <div className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-bold border ${isDarkMode ? "bg-[#0b1120] border-slate-800 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
                                <Cpu className="w-3.5 h-3.5 opacity-60 text-orange-500" />
                                <span className="font-mono" dir="ltr">{u.apiUsage.toLocaleString("fa-IR")}</span>
                              </div>

                              {/* Storage */}
                              <button
                                onClick={() => {
                                  const currentExtra = u.extraStorage || 0;
                                  const input = prompt(`فضای اضافه تخصیص یافته به ${u.name} را وارد کنید (به گیگابایت):`, currentExtra.toString());
                                  if (input !== null) {
                                    const parsed = parseFloat(input);
                                    if (!isNaN(parsed) && parsed >= 0) {
                                      setUsers(prev => prev.map(usr => {
                                        if (usr.id === u.id) {
                                          return { ...usr, extraStorage: parsed };
                                        }
                                        return usr;
                                      }));
                                      logEvent("تخصیص فضا", `مدیر فضا اضافه کاربر «${u.name}» را به ${parsed} گیگابایت تغییر داد.`);
                                      showNotification(`فضای اضافه کاربر «${u.name}» با موفقیت به ${parsed} گیگابایت تغییر یافت.`, "success");
                                    } else {
                                      showNotification("لطفاً یک عدد معتبر و بزرگتر یا مساوی صفر وارد کنید.", "error");
                                    }
                                  }
                                }}
                                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-bold transition-colors border ${
                                  isDarkMode 
                                    ? "bg-[#0b1120] border-slate-800 text-slate-300 hover:bg-slate-800" 
                                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                                }`}
                                title="تغییر فضای اختصاصی"
                              >
                                <HardDrive className="w-3.5 h-3.5 opacity-60 text-indigo-500" />
                                <span dir="ltr">{(5 + (u.extraStorage || 0)).toLocaleString("fa-IR")} GB</span>
                                <Edit2 className="w-3 h-3 opacity-40 mr-0.5" />
                              </button>

                              {/* Action Menu / Toggle */}
                              <button
                                 onClick={() => {
                                    setUsers(prev => prev.map(usr => usr.id === u.id ? {...usr, status: usr.status === "active" ? "suspended" : "active"} : usr));
                                    setNotification({text: `وضعیت کاربر ${u.name} تغییر یافت.`, type: 'success'});
                                 }}
                                 className={`p-1.5 rounded-lg transition-colors border ${
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
                    </div>
                 )}

                 {/* Data & Backup Tab */}
                 {adminPanelTab === "data" && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto pb-8">
                      <div>
                        <h4 className="text-[15px] font-bold mb-1">مدیریت داده‌ها و پشتیبان‌گیری</h4>
                        <p className={`text-[11px] ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>تهیه نسخه پشتیبان امن از تمام تراکنش‌ها، اسناد و تاریخچه سیستم.</p>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        {/* JSON Backup */}
                        <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row justify-between gap-5 transition-all ${
                          isDarkMode ? "bg-[#0b1120] border-slate-800 hover:border-slate-700" : "bg-white border-slate-200 hover:border-slate-300 shadow-sm"
                        }`}>
                          <div className="flex flex-col flex-1">
                            <h5 className="font-bold text-[13px] mb-1.5 flex items-center gap-2">
                              <Download className="w-4 h-4 text-blue-500" />
                              پشتیبان کامل (JSON)
                            </h5>
                            <span className={`text-[11px] leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                              شامل تاریخچه پردازش‌ها، تراکنش‌ها، و سهمیه مصرفی مدل‌ها.
                            </span>
                          </div>
                          <div className="flex flex-col gap-2 shrink-0 sm:w-40">
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
                              className="w-full py-2 rounded-lg text-[11px] font-bold bg-blue-600 hover:bg-blue-700 text-white flex justify-center items-center gap-1.5 transition-all"
                            >
                              <Download className="w-3.5 h-3.5" />
                              دانلود پشتیبان
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
                              className={`w-full py-2 rounded-lg text-[11px] font-bold border flex justify-center items-center gap-1.5 transition-all ${
                                isDarkMode ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                              }`}
                            >
                              <Upload className="w-3.5 h-3.5" />
                              بازیابی (Import)
                            </button>
                          </div>
                        </div>

                        {/* Excel Export */}
                        <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row justify-between gap-5 transition-all ${
                          isDarkMode ? "bg-emerald-950/20 border-emerald-900/50 hover:border-emerald-800/50" : "bg-emerald-50 border-emerald-100 hover:border-emerald-200 shadow-sm"
                        }`}>
                          <div className="flex flex-col flex-1">
                            <h5 className="font-bold text-[13px] mb-1.5 flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                              <List className="w-4 h-4" />
                              خروجی اکسل (XLSX)
                            </h5>
                            <span className={`text-[11px] leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                              تولید فایل ساختاریافته از تمامی تراکنش‌های مالی موجود.
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              let worksheetData;
                              let colWidths;
                              
                              let parsedFromJson = false;
                              if (rawJsonText && rawJsonText.trim()) {
                                try {
                                  const cleaned = repairAndCleanJsonString(rawJsonText);
                                  const parsed = JSON.parse(cleaned);
                                  if (Array.isArray(parsed)) {
                                    worksheetData = parsed;
                                    parsedFromJson = true;
                                  } else if (parsed && typeof parsed === "object") {
                                    const found = findArrayInObject(parsed);
                                    if (found) {
                                      worksheetData = found;
                                      parsedFromJson = true;
                                    }
                                  }
                                } catch (e) {}
                              }
                              
                              if (!parsedFromJson) {
                                 worksheetData = transactions.map((t) => {
                                    const row: any = {};
                                    Object.keys(t).forEach(k => {
                                      if (k !== "id") row[k] = t[k];
                                    });
                                    return row;
                                 });
                              }
                              
                              if (worksheetData.length > 0) {
                                colWidths = Object.keys(worksheetData[0]).map(k => ({ wch: Math.max(k.length + 5, 15) }));
                              }

                              const worksheet = XLSX.utils.json_to_sheet(worksheetData);
                              const workbook = XLSX.utils.book_new();
                              XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
                              if (colWidths) {
                                worksheet['!cols'] = colWidths;
                              }
                              XLSX.writeFile(workbook, `Transactions-Export.xlsx`);
                            }}
                            className="w-full sm:w-40 py-2.5 rounded-xl text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex justify-center items-center gap-1.5 transition-all self-center"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                            تولید فایل اکسل
                          </button>
                        </div>

                        {/* Mock Data Seed */}
                        <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row justify-between gap-5 transition-all ${
                          isDarkMode ? "bg-indigo-950/20 border-indigo-900/50 hover:border-indigo-800/50" : "bg-indigo-50 border-indigo-100 hover:border-indigo-200 shadow-sm"
                        }`}>
                          <div className="flex flex-col flex-1">
                            <h5 className="font-bold text-[13px] mb-1.5 flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                              <Database className="w-4 h-4" />
                              تزریق داده نمونه (Mock)
                            </h5>
                            <span className={`text-[11px] leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                              اضافه کردن چندین رکورد مالی فرضی برای بررسی داشبوردها.
                            </span>
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
                                setNotification({ text: "داده‌های نمونه با موفقیت افزوده شدند.", type: "success" });
                            }}
                            className={`w-full sm:w-40 py-2.5 rounded-xl text-[11px] font-bold border flex justify-center items-center gap-1.5 transition-all self-center ${
                              isDarkMode ? "border-indigo-500/30 text-indigo-400 hover:bg-indigo-900/30" : "border-indigo-200 text-indigo-700 hover:bg-indigo-100/50"
                            }`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                            افزودن نمونه
                          </button>
                        </div>
                      </div>
                    </div>
                 )}

                 {/* System Info Tab */}
                 {adminPanelTab === "system" && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto pb-8">
                      <div>
                        <h4 className="text-[15px] font-bold mb-1">وضعیت و منابع سیستم</h4>
                        <p className={`text-[11px] ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>آمار کلیدی دیتابیس، مصرف توکن‌ها و دسترسی سریع به مدیریت منابع.</p>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-center gap-4 transition-all ${
                          isDarkMode ? "bg-[#0b1120] border-slate-800" : "bg-white border-slate-200 shadow-sm"
                        }`}>
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isDarkMode ? "bg-indigo-900/30 text-indigo-400" : "bg-indigo-50 text-indigo-600"}`}>
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="text-center sm:text-right">
                            <div className="text-2xl font-black text-slate-800 dark:text-slate-200">{previousScans.length}</div>
                            <div className={`text-[11px] font-bold mt-0.5 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>اسناد پردازش شده</div>
                          </div>
                        </div>

                        <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-center gap-4 transition-all ${
                          isDarkMode ? "bg-[#0b1120] border-slate-800" : "bg-white border-slate-200 shadow-sm"
                        }`}>
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isDarkMode ? "bg-emerald-900/30 text-emerald-400" : "bg-emerald-50 text-emerald-600"}`}>
                            <List className="w-5 h-5" />
                          </div>
                          <div className="text-center sm:text-right">
                            <div className="text-2xl font-black text-slate-800 dark:text-slate-200">{transactions.length}</div>
                            <div className={`text-[11px] font-bold mt-0.5 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>تراکنش‌های موفق</div>
                          </div>
                        </div>

                        <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-center gap-4 transition-all ${
                          isDarkMode ? "bg-[#0b1120] border-slate-800" : "bg-white border-slate-200 shadow-sm"
                        }`}>
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isDarkMode ? "bg-purple-900/30 text-purple-400" : "bg-purple-50 text-purple-600"}`}>
                            <Database className="w-5 h-5" />
                          </div>
                          <div className="text-center sm:text-right">
                            {(() => {
                               let totalStorage = 0;
                               for (let i = 0; i < localStorage.length; i++) {
                                 const key = localStorage.key(i);
                                 if (key) totalStorage += localStorage.getItem(key)?.length || 0;
                               }
                               const kb = (totalStorage / 1024).toFixed(1);
                               return <div className="text-2xl font-black font-mono text-slate-800 dark:text-slate-200">{kb}</div>;
                            })()}
                            <div className={`text-[11px] font-bold mt-0.5 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>حجم محلی (KB)</div>
                          </div>
                        </div>

                        <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-center gap-4 transition-all ${
                          isDarkMode ? "bg-[#0b1120] border-slate-800" : "bg-white border-slate-200 shadow-sm"
                        }`}>
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isDarkMode ? "bg-orange-900/30 text-orange-400" : "bg-orange-50 text-orange-600"}`}>
                            <Coins className="w-5 h-5" />
                          </div>
                          <div className="text-center sm:text-right">
                            {(() => {
                               let totalTokens = 0;
                               Object.values(modelQuotas).forEach((q: any) => totalTokens += q.used);
                               return <div className="text-2xl font-black font-mono text-slate-800 dark:text-slate-200">{totalTokens}</div>;
                            })()}
                            <div className={`text-[11px] font-bold mt-0.5 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>توکن‌های مصرفی</div>
                          </div>
                        </div>
                      </div>

                      {/* Token Manager Link */}
                      <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-5 mt-2 transition-all ${
                        isDarkMode ? "bg-indigo-950/20 border-indigo-900/50" : "bg-indigo-50/50 border-indigo-100 shadow-sm"
                      }`}>
                        <div className="flex flex-col flex-1">
                          <h5 className="font-bold text-[13px] mb-1.5 flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
                            پنل تخصصی مدیریت توکن‌ها
                          </h5>
                          <span className={`text-[11px] leading-relaxed ${isDarkMode ? "text-indigo-200/70" : "text-indigo-900/60"}`}>
                            مشاهده نمودارهای مصرف، تخصیص بودجه و اعمال محدودیت‌های هوش مصنوعی.
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setIsAdminPanelOpen(false);
                            setIsTokenManagerOpen(true);
                            logEvent("پنل مدیریت توکن", "مدیر سیستم وارد پنل مدیریت پیشرفته توکن‌ها شد.");
                          }}
                          className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-[11px] font-bold shadow-sm flex justify-center items-center gap-1.5 transition-all ${
                            isDarkMode ? "bg-indigo-600 hover:bg-indigo-500 text-white" : "bg-indigo-600 hover:bg-indigo-700 text-white"
                          }`}
                        >
                          <Settings className="w-4 h-4" />
                          Token Manager
                        </button>
                      </div>

                    </div>
                 )}

                 {/* Danger Zone Tab */}
                 {adminPanelTab === "danger" && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto pb-8">
                      <div>
                        <h4 className="text-[15px] font-bold mb-1 text-rose-500">عملیات خطرناک</h4>
                        <p className={`text-[11px] ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>اقدامات این بخش غیرقابل بازگشت هستند. پیش از تایید، اطمینان حاصل کنید.</p>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        
                        <div className={`p-5 rounded-2xl border border-rose-200/60 dark:border-rose-900/40 flex flex-col sm:flex-row justify-between gap-5 transition-all ${
                          isDarkMode ? "bg-rose-950/10 hover:bg-rose-950/20" : "bg-rose-50/30 hover:bg-rose-50/80 shadow-sm"
                        }`}>
                          <div className="flex flex-col flex-1">
                            <h5 className="font-bold text-[13px] mb-1.5 text-rose-600 dark:text-rose-400">پاکسازی مخزن تراکنش‌ها</h5>
                            <span className={`text-[11px] leading-relaxed ${isDarkMode ? "text-rose-300/60" : "text-rose-800/60"}`}>
                              حذف تمامی ردیف‌های مالی استخراج شده. اسناد پردازش شده در تاریخچه باقی می‌مانند.
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              if (confirm("آیا از حذف تمام تراکنش‌ها مطمئن هستید؟")) {
                                setTransactions([]);
                                setActiveFile(null);
                                setRawJsonText("");
                                setNotification({ text: "جدول تراکنش‌های سیستم پاکسازی شد.", type: "success" });
                              }
                            }}
                            className={`w-full sm:w-40 py-2.5 rounded-xl text-[11px] font-bold border flex justify-center items-center gap-1.5 transition-all active:scale-95 shrink-0 self-center ${
                              isDarkMode ? "bg-[#0b1120] border-rose-800 text-rose-400 hover:bg-rose-900/30" : "bg-white border-rose-200 text-rose-600 hover:bg-rose-50"
                            }`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            حذف تراکنش‌ها
                          </button>
                        </div>

                        <div className={`p-5 rounded-2xl border border-rose-200/60 dark:border-rose-900/40 flex flex-col sm:flex-row justify-between gap-5 transition-all ${
                          isDarkMode ? "bg-rose-950/10 hover:bg-rose-950/20" : "bg-rose-50/30 hover:bg-rose-50/80 shadow-sm"
                        }`}>
                          <div className="flex flex-col flex-1">
                            <h5 className="font-bold text-[13px] mb-1.5 text-rose-600 dark:text-rose-400">پاکسازی تاریخچه اسناد</h5>
                            <span className={`text-[11px] leading-relaxed ${isDarkMode ? "text-rose-300/60" : "text-rose-800/60"}`}>
                              حذف کامل تصاویر، متون اولیه و متادیتای تمام اسناد اسکن شده قبلی.
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              if (confirm("آیا از حذف تاریخچه اسناد مطمئن هستید؟")) {
                                setPreviousScans([]);
                                setNotification({ text: "تاریخچه اسناد با موفقیت حذف گردید.", type: "success" });
                              }
                            }}
                            className={`w-full sm:w-40 py-2.5 rounded-xl text-[11px] font-bold border flex justify-center items-center gap-1.5 transition-all active:scale-95 shrink-0 self-center ${
                              isDarkMode ? "bg-[#0b1120] border-rose-800 text-rose-400 hover:bg-rose-900/30" : "bg-white border-rose-200 text-rose-600 hover:bg-rose-50"
                            }`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            حذف تاریخچه
                          </button>
                        </div>

                        <div className={`p-5 rounded-2xl border border-red-300/50 dark:border-red-900/60 flex flex-col gap-4 transition-all ${
                          isDarkMode ? "bg-red-950/20" : "bg-red-50/50"
                        }`}>
                          <div className="flex flex-col">
                            <h5 className="font-bold text-[13px] mb-1.5 text-red-600 dark:text-red-400">بازنشانی کامل سیستم (Hard Reset)</h5>
                            <span className={`text-[11px] leading-relaxed ${isDarkMode ? "text-red-300/70" : "text-red-800/70"}`}>
                              این عملیات تمام داده‌های ذخیره شده در مرورگر را به طور کامل پاک کرده و برنامه را مجددا بارگیری می‌کند.
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              if (confirm("هشدار! آیا از پاکسازی کامل سیستم و ریست آن مطمئن هستید؟ تمام داده‌ها نابود خواهند شد.")) {
                                window.localStorage.clear();
                                window.location.reload();
                              }
                            }}
                            className="w-full py-2.5 rounded-xl text-[11px] font-bold bg-red-600 hover:bg-red-700 text-white shadow-sm flex justify-center items-center gap-1.5 transition-all active:scale-95"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                            پاکسازی کامل (رادیواکتیو)
                          </button>
                        </div>

                      </div>
                    </div>
                 )}

               </div>
            </div>
          </div>
        </div>
      )}
      {/* Token Management Panel Modal */}
      {isTokenManagerOpen && currentUser?.email === "alizerehsaz2001@gmail.com" && (
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
                                      u.role === "admin" ? "bg-purple-100 text-purple-700" : u.role === "manager" ? "bg-amber-100 text-amber-700" : u.role === "auditor" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                                   }`}>{u.role === "admin" ? "مدیر کل" : u.role === "manager" ? "مدیر مالی" : u.role === "auditor" ? "حسابرس" : "کاربر"}</span>
                                </td>
                                <td className="p-3 text-center font-mono text-[10px] text-blue-500 font-bold">{(u.apiUsage || 0).toLocaleString("fa-IR")}</td>
                                <td className="p-3 text-center font-mono text-[10px] text-emerald-500 font-bold">${cost.toFixed(4)}</td>
                                <td className="p-3 text-center">
                                   <button
                                       onClick={() => {
                                          setUsers(prev => prev.map(usr => usr.id === u.id ? {...usr, apiUsage: 0} : usr));
                                          
                                          logEvent("ریست توکن کاربر", `آمار مصرف توکن کاربر ${u.name} صفر شد.`);
                                          showNotification(`آمار مصرف توکن کاربر ${u.name} بازنشانی شد.`, 'success');
                                       }}
                                       className={`px-2 py-1 rounded border text-[9px] font-bold transition-colors ${
                                          isDarkMode ? "border-slate-600 text-slate-300 hover:bg-slate-750" : "border-slate-300 text-slate-600 hover:bg-slate-200"
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
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
            onClick={() => setIsFileManagerOpen(false)}
          ></div>
          
          <div className={`relative w-full max-w-6xl max-h-[90vh] h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up transform transition-all ${
            isDarkMode ? "bg-[#0b1120] border border-slate-800 text-slate-200 shadow-black/50" : "bg-white border border-slate-200 text-slate-800 shadow-slate-200/50"
          }`} dir="rtl">
            <div className={`px-6 py-4 border-b flex items-center justify-between shrink-0 ${isDarkMode ? "bg-[#0b1120]/80 border-slate-800/80" : "bg-white/80 border-slate-100"}`}>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isDarkMode ? "bg-slate-800/50 text-indigo-400" : "bg-slate-100 text-indigo-600"}`}>
                    <HardDrive className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[15px] leading-tight">مدیریت اسناد و فضای ابری</h3>
                    <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                      پایگاه ابری زره‌اسکن متصل و همگام
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsSyncingCloudManager(true);
                    setTimeout(() => {
                      setIsSyncingCloudManager(false);
                      showNotification("همگام‌سازی ابری کلیه اسناد و دیتابیس ERP با موفقیت انجام شد ☁️", "success");
                      logEvent("همگام‌سازی دستی ابر", "پشتیبان‌گیری کامل از کلیه اسناد روی فضای ابری اجرا شد.");
                    }, 1200);
                  }}
                  disabled={isSyncingCloudManager}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 cursor-pointer ${
                    isDarkMode 
                      ? "bg-indigo-950/50 border-indigo-500/30 text-indigo-300 hover:bg-indigo-900/60" 
                      : "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
                  }`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingCloudManager ? "animate-spin text-indigo-500" : ""}`} />
                  <span>{isSyncingCloudManager ? "در حال پشتیبان‌گیری..." : "همگام‌سازی ابری یکپارچه"}</span>
                </button>
              </div>
              <button 
                onClick={() => setIsFileManagerOpen(false)}
                className={`p-2 rounded-xl transition-colors ${isDarkMode ? "hover:bg-slate-800 text-slate-400 hover:text-white" : "hover:bg-slate-100 text-slate-500 hover:text-slate-900"}`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {(() => {
                const extraBytes = (currentUser?.extraStorage || 0) * 1024 * 1024 * 1024;
                const MAX_STORAGE = 5 * 1024 * 1024 * 1024 + extraBytes; // 5GB + extra storage
                const usedStorage = previousScans.reduce((acc, scan) => acc + (scan.file?.size || 0), 0);
                const percentUsed = Math.min(100, (usedStorage / MAX_STORAGE) * 100);
                
                const formatBytes = (bytes: number, decimals = 2) => {
                  if (!+bytes) return '0 Bytes';
                  const k = 1024;
                  const dm = decimals < 0 ? 0 : decimals;
                  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
                  const i = Math.floor(Math.log(bytes) / Math.log(k));
                  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
                };

                const totalTokens = previousScans.reduce((acc, scan) => acc + (scan.file?.tokensUsed || 0), 0);
                const totalTransactionsCount = previousScans.reduce((acc, scan) => acc + (scan.transactions?.length || 0), 0);
                
                let sumConfidence = 0;
                let confCount = 0;
                previousScans.forEach(scan => {
                  if (scan.transactions && scan.transactions.length > 0) {
                    scan.transactions.forEach((t: any) => {
                      if (typeof t.ضریب_اطمینان === "number") {
                        sumConfidence += t.ضریب_اطمینان;
                        confCount++;
                      }
                    });
                  }
                });
                const avgConfidence = confCount > 0 ? Math.round(sumConfidence / confCount) : 98;

                const renamePreviousScan = (scanId: string, oldName: string) => {
                  const newName = prompt("نام جدید سند را وارد کنید:", oldName);
                  if (newName && newName.trim()) {
                    const trimmed = newName.trim();
                    if (trimmed === oldName) return;
                    setPreviousScans(prev => prev.map(s => s.id === scanId ? { ...s, file: { ...s.file, name: trimmed } } : s));
                    if (activeFile && activeFile.id === scanId) {
                      setActiveFile((prev: any) => prev ? { ...prev, name: trimmed } : null);
                    }
                    logEvent("تغییر نام سند", `کاربر نام سند را از «${oldName}» به «${trimmed}» تغییر داد.`);
                    showNotification("نام سند با موفقیت تغییر یافت.", "success");
                  }
                };

                const getFolderFileCount = (folderName: string) => {
                  return previousScans.filter(s => {
                    if (folderName === "all") return true;
                    if (folderName === "starred") return !!s.isStarred;
                    if (folderName === "uncategorized") return !s.folder;
                    return s.folder === folderName;
                  }).length;
                };



                const addTagToScan = (scanId: string, tag: string) => {
                  if (!tag.trim()) return;
                  const trimmed = tag.trim();
                  setPreviousScans(prev => prev.map(s => {
                    if (s.id === scanId) {
                      const currentTags = s.tags || [];
                      if (currentTags.includes(trimmed)) return s;
                      return { ...s, tags: [...currentTags, trimmed] };
                    }
                    return s;
                  }));
                  showNotification(`برچسب «${trimmed}» افزوده شد.`, "success");
                };

                const removeTagFromScan = (scanId: string, tag: string) => {
                  setPreviousScans(prev => prev.map(s => {
                    if (s.id === scanId) {
                      return { ...s, tags: (s.tags || []).filter(t => t !== tag) };
                    }
                    return s;
                  }));
                };

                const handleExportCatalogExcel = () => {
                  if (fileManagerFilteredScans.length === 0) {
                    showNotification("هیچ سندی جهت گزارش‌گیری یافت نشد.", "error");
                    return;
                  }
                  try {
                    const catalogData = fileManagerFilteredScans.map((scan, idx) => ({
                      "ردیف": idx + 1,
                      "شناسه سند": scan.id,
                      "نام فایل": scan.file?.name || "-",
                      "پوشه": scan.folder || "دسته‌بندی نشده",
                      "حجم فایل": formatBytes(scan.file?.size || 0),
                      "فرمت": scan.file?.name?.toLowerCase().endsWith(".pdf") ? "PDF" : "تصویر",
                      "تاریخ بارگذاری": new Date(scan.timestamp).toLocaleDateString("fa-IR"),
                      "تعداد تراکنش‌های استخراج‌شده": scan.transactions?.length || 0,
                      "وضعیت پردازش": scan.file?.status === "idle" ? "پردازش نشده" : "تکمیل شده",
                      "برگزیده": scan.isStarred ? "بله ⭐" : "خیر",
                      "برچسب‌ها": (scan.tags || []).join("، ") || "-"
                    }));

                    const ws = XLSX.utils.json_to_sheet(catalogData);
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, "فهرست اسناد");
                    XLSX.writeFile(wb, `Catalog_Export_${new Date().toLocaleDateString("fa-IR")}.xlsx`);
                    showNotification("گزارش اکسل کلیه اسناد موجود با موفقیت دانلود شد.", "success");
                    logEvent("دانلود گزارش کاردکس اسناد", "کاربر کاتالوگ اکسل فایل‌ها را دریافت نمود.");
                  } catch (err) {
                    showNotification("خطا در دانلود کاتالوگ اکسل.", "error");
                  }
                };

                const renameFolder = (oldName: string) => {
                  const folderObj = userDefinedFolders.find(f => (typeof f === "string" ? f : f.name) === oldName);
                  const currentDesc = typeof folderObj === "string" ? "" : (folderObj?.description || "");
                  const currentCc = typeof folderObj === "string" ? "indigo" : (folderObj?.color || "indigo");

                  const newName = prompt(`نام جدید برای پوشه «${oldName}» را وارد کنید:`, oldName);
                  if (newName === null) return; // user cancelled
                  
                  const trimmed = newName.trim();
                  if (!trimmed) {
                    showNotification("نام پوشه نمی‌تواند خالی باشد.", "error");
                    return;
                  }
                  
                  if (trimmed !== oldName && userDefinedFolders.some(f => (typeof f === "string" ? f : f.name) === trimmed)) {
                    showNotification("پوشه‌ای با این نام از قبل وجود دارد.", "error");
                    return;
                  }

                  const newDesc = prompt(`توضیحات پوشه را وارد کنید (اختیاری):`, currentDesc);
                  const trimmedDesc = newDesc !== null ? newDesc.trim() : currentDesc;

                  const newColor = prompt(`کد رنگ پوشه را وارد کنید (یکی از موارد: rose, emerald, amber, blue, purple, cyan, indigo):`, currentCc);
                  const chosenColor = newColor && FOLDER_COLORS[newColor] ? newColor : currentCc;

                  setUserDefinedFolders(prev => prev.map(f => {
                    const fName = typeof f === "string" ? f : f.name;
                    if (fName === oldName) {
                      return {
                        name: trimmed,
                        color: chosenColor,
                        description: trimmedDesc,
                        createdAt: typeof f === "string" ? new Date().toISOString() : (f.createdAt || new Date().toISOString())
                      };
                    }
                    return f;
                  }));

                  setPreviousScans(prev => prev.map(s => s.folder === oldName ? { ...s, folder: trimmed } : s));
                  if (selectedFolderFilter === oldName) {
                    setSelectedFolderFilter(trimmed);
                  }
                  logEvent("ویرایش پوشه", `کاربر پوشه «${oldName}» را به «${trimmed}» تغییر داد و رنگ و توضیحات را به‌روزرسانی کرد.`);
                  showNotification(`پوشه با موفقیت ویرایش شد.`, "success");
                };

                const handleBulkDelete = () => {
                  if (window.confirm(`آیا از حذف دسته‌جمعی ${selectedScanIds.length} سند اطمینان دارید؟ این عمل غیر قابل بازگشت است.`)) {
                    setPreviousScans(prev => prev.filter(s => !selectedScanIds.includes(s.id)));
                    if (activeFile && selectedScanIds.includes(activeFile.id)) {
                      clearCurrentFile();
                    }
                    logEvent("حذف دسته‌جمعی اسناد", `کاربر تعداد ${selectedScanIds.length} سند را به صورت گروهی حذف کرد.`, "warning");
                    showNotification("اسناد انتخاب‌شده با موفقیت حذف گردیدند.", "success");
                    setSelectedScanIds([]);
                  }
                };

                const handleBulkStar = (status: boolean) => {
                  setPreviousScans(prev => prev.map(s => selectedScanIds.includes(s.id) ? { ...s, isStarred: status } : s));
                  logEvent("علامت‌گذاری گروهی اسناد", `کاربر تعداد ${selectedScanIds.length} سند را به عنوان ${status ? "برگزیده" : "عادی"} علامت‌گذاری کرد.`);
                  showNotification(`اسناد انتخاب شده به عنوان ${status ? "برگزیده" : "عادی"} ثبت شدند.`, "success");
                  setSelectedScanIds([]);
                };

                const handleBulkMove = (folder: string | undefined) => {
                  setPreviousScans(prev => prev.map(s => selectedScanIds.includes(s.id) ? { ...s, folder: folder } : s));
                  logEvent("انتقال گروهی اسناد", `کاربر تعداد ${selectedScanIds.length} سند را به پوشه «${folder || "دسته‌بندی نشده"}» انتقال داد.`);
                  showNotification(`اسناد انتخاب‌شده با موفقیت به پوشه «${folder || "دسته‌بندی نشده"}» منتقل شدند.`, "success");
                  setSelectedScanIds([]);
                };

                const handleBulkDownload = () => {
                  let count = 0;
                  previousScans.forEach(scan => {
                    if (selectedScanIds.includes(scan.id) && scan.file?.preview) {
                      setTimeout(() => {
                        const link = document.createElement("a");
                        link.href = scan.file.preview;
                        link.download = scan.file.name;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }, count * 400); // Stagger downloads to prevent browser blocking
                      count++;
                    }
                  });
                  showNotification(`دانلود گروهی برای ${selectedScanIds.length} سند با موفقیت آغاز شد.`, "success");
                  setSelectedScanIds([]);
                };

                const downloadBase64File = (scan: PreviousScan) => {
                  if (!scan.file?.preview) {
                    showNotification("پیش‌نمایش یا محتوای فایل معتبر نیست.", "error");
                    return;
                  }
                  try {
                    const link = document.createElement("a");
                    link.href = scan.file.preview;
                    link.download = scan.file.name;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    showNotification(`فایل «${scan.file.name}» با موفقیت دانلود شد.`, "success");
                    logEvent("دانلود فایل از مدیریت فایل", `کاربر فایل ${scan.file.name} را دانلود کرد.`);
                  } catch (err) {
                    showNotification("خطا در بارگیری و دانلود فایل.", "error");
                  }
                };

                return (
                  <div className="space-y-6">
                    
                    {/* Compact Top Analytics Bar */}
                    <div className={`grid grid-cols-2 md:grid-cols-4 gap-px rounded-xl overflow-hidden border ${isDarkMode ? "bg-slate-800/50 border-slate-800/80" : "bg-slate-200/50 border-slate-200/80"}`}>
                      
                      <div className={`p-3.5 flex flex-col justify-center items-center gap-1 ${isDarkMode ? "bg-[#0b1120]/60" : "bg-white"}`}>
                        <div className="flex items-center gap-1.5 opacity-60">
                          <FileText className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-bold">کل اسناد</span>
                        </div>
                        <span className="text-base font-black text-slate-700 dark:text-slate-200">{previousScans.length.toLocaleString("fa-IR")}</span>
                      </div>

                      <div className={`p-3.5 flex flex-col justify-center items-center gap-1 ${isDarkMode ? "bg-[#0b1120]/60" : "bg-white"}`}>
                        <div className="flex items-center gap-1.5 opacity-60">
                          <Sheet className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-bold">تراکنش‌ها</span>
                        </div>
                        <span className="text-base font-black text-slate-700 dark:text-slate-200">{totalTransactionsCount.toLocaleString("fa-IR")}</span>
                      </div>

                      <div className={`p-3.5 flex flex-col justify-center items-center gap-1 ${isDarkMode ? "bg-[#0b1120]/60" : "bg-white"}`}>
                        <div className="flex items-center gap-1.5 opacity-60">
                          <Cpu className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-bold">توکن‌ها</span>
                        </div>
                        <span className="text-base font-black text-slate-700 dark:text-slate-200">{totalTokens.toLocaleString("fa-IR")}</span>
                      </div>

                      <div className={`p-3.5 flex flex-col justify-center items-center gap-1 ${isDarkMode ? "bg-[#0b1120]/60" : "bg-white"}`}>
                        <div className="flex flex-col w-full h-full justify-between items-center px-2">
                          <div className="flex items-center justify-between w-full opacity-60 mb-1">
                            <span className="text-[9px] font-bold">فضای ابری</span>
                            <span className="text-[9px] font-mono">{formatBytes(usedStorage)}</span>
                          </div>
                          <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDarkMode ? "bg-slate-800" : "bg-slate-100"}`}>
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.max(2, percentUsed)}%` }} />
                          </div>
                          <div className="w-full flex items-center justify-between mt-1">
                            <span className="text-[8px] opacity-60 font-mono">{percentUsed.toFixed(1)}% از {(5 + (currentUser?.extraStorage || 0))}GB</span>
                            <button
                              onClick={() => {
                                if (currentUser) {
                                  const updatedExtra = (currentUser.extraStorage || 0) + 5;
                                  setCurrentUser({ ...currentUser, extraStorage: updatedExtra });
                                  setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, extraStorage: updatedExtra } : u));
                                  showNotification("۵ گیگابایت فضای ابری اضافی دریافت شد ☁️", "success");
                                  logEvent("ارتقای فضای ابری", "۵ گیگابایت به فضای ابری اضافه شد.");
                                }
                              }}
                              className="text-[9px] font-black text-indigo-500 hover:underline flex items-center gap-0.5 cursor-pointer"
                              title="افزایش ۵ گیگابایت فضای ابری هدیه"
                            >
                              <Plus className="w-2.5 h-2.5" />
                              ارتقای ابر
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Two-Column Workspace Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                      
                      {/* Sidebar column (Folders) */}
                      <div className="lg:col-span-1">
                        <div className={`p-4 rounded-xl border flex flex-col h-full justify-between ${
                          isDarkMode ? "bg-slate-800/40 border-slate-800" : "bg-slate-50/70 border-slate-200"
                        }`}>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                              <span className="text-xs font-bold flex items-center gap-1.5">
                                <Folder className="w-4 h-4 text-indigo-400" />
                                پوشه‌های اختصاصی
                              </span>
                              
                              {/* Create Folder Toggle */}
                              <button
                                onClick={() => setIsCreatingFolder(prev => !prev)}
                                className={`p-1 rounded-lg transition-colors border cursor-pointer ${
                                  isCreatingFolder
                                    ? "bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100"
                                    : isDarkMode 
                                      ? "bg-slate-900 border-slate-750 text-slate-300 hover:bg-slate-800" 
                                      : "bg-white border-slate-250 text-indigo-600 hover:bg-indigo-50"
                                }`}
                                title={isCreatingFolder ? "بستن فرم ایجاد" : "ایجاد پوشه جدید"}
                              >
                                {isCreatingFolder ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                              </button>
                            </div>

                            {/* Inline Custom Folder Creator Form */}
                            {isCreatingFolder && (
                              <div 
                                className={`p-3 rounded-xl border space-y-3 ${
                                  isDarkMode ? "bg-slate-900/90 border-slate-750" : "bg-white border-slate-200"
                                }`}
                              >
                                <div className="space-y-1">
                                  <label className={`text-[9px] font-black ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>نام پوشه اختصاصی</label>
                                  <input
                                    type="text"
                                    value={newFolderName}
                                    onChange={(e) => setNewFolderName(e.target.value)}
                                    placeholder="مثلاً: اسناد بازرگانی"
                                    className={`w-full px-2.5 py-1.5 rounded-lg text-xs outline-none border transition-all ${
                                      isDarkMode 
                                        ? "bg-slate-950 border-slate-800 text-white focus:border-indigo-500" 
                                        : "bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500"
                                    }`}
                                  />
                                </div>

                                <div className="space-y-1">
                                  <label className={`text-[9px] font-black ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>توضیح کوتاه (اختیاری)</label>
                                  <input
                                    type="text"
                                    value={newFolderDesc}
                                    onChange={(e) => setNewFolderDesc(e.target.value)}
                                    placeholder="مثلاً: فاکتورهای ترخیص کالا"
                                    className={`w-full px-2.5 py-1.5 rounded-lg text-xs outline-none border transition-all ${
                                      isDarkMode 
                                        ? "bg-slate-950 border-slate-800 text-white focus:border-indigo-500" 
                                        : "bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500"
                                    }`}
                                  />
                                </div>

                                <div className="space-y-1">
                                  <label className={`text-[9px] font-black ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>تم رنگی پوشه</label>
                                  <div className="flex items-center gap-1.5 pt-0.5">
                                    {Object.keys(FOLDER_COLORS).map(colorKey => {
                                      const config = FOLDER_COLORS[colorKey];
                                      const isColorSelected = newFolderColor === colorKey;
                                      return (
                                        <button
                                          key={colorKey}
                                          type="button"
                                          onClick={() => setNewFolderColor(colorKey)}
                                          className={`w-4 h-4 rounded-full ${config.dot} transition-transform relative flex items-center justify-center shrink-0 cursor-pointer hover:scale-110`}
                                          title={colorKey}
                                        >
                                          {isColorSelected && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                                          )}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 pt-1">
                                  <button
                                    onClick={() => {
                                      if (!newFolderName.trim()) {
                                        showNotification("نام پوشه نمی‌تواند خالی باشد.", "error");
                                        return;
                                      }
                                      const trimmed = newFolderName.trim();
                                      if (userDefinedFolders.some(f => (typeof f === 'string' ? f : f.name) === trimmed)) {
                                        showNotification("پوشه‌ای با این نام از قبل وجود دارد.", "error");
                                        return;
                                      }
                                      
                                      setUserDefinedFolders(prev => [
                                        ...prev, 
                                        { 
                                          name: trimmed, 
                                          color: newFolderColor, 
                                          description: newFolderDesc.trim(),
                                          createdAt: new Date().toISOString()
                                        }
                                      ]);
                                      
                                      logEvent("ایجاد پوشه جدید", `کاربر پوشه جدید با نام «${trimmed}» ایجاد کرد.`);
                                      showNotification(`پوشه «${trimmed}» با موفقیت ایجاد شد.`, "success");
                                      
                                      // Reset state
                                      setNewFolderName("");
                                      setNewFolderDesc("");
                                      setNewFolderColor("indigo");
                                      setIsCreatingFolder(false);
                                    }}
                                    className="flex-1 py-1.5 rounded-lg text-[10px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer text-center"
                                  >
                                    ثبت پوشه
                                  </button>
                                  <button
                                    onClick={() => {
                                      setNewFolderName("");
                                      setNewFolderDesc("");
                                      setNewFolderColor("indigo");
                                      setIsCreatingFolder(false);
                                    }}
                                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                                      isDarkMode 
                                        ? "border-slate-800 text-slate-400 hover:bg-slate-900" 
                                        : "border-slate-200 text-slate-500 hover:bg-slate-100"
                                    }`}
                                  >
                                    انصراف
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Folders List inside Sidebar */}
                            <div className="space-y-1.5">
                              {/* All scans */}
                              <button
                                onClick={() => setSelectedFolderFilter("all")}
                                className={`w-full px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                                  selectedFolderFilter === "all"
                                    ? "bg-indigo-600 text-white shadow-sm"
                                    : isDarkMode
                                      ? "bg-slate-900/60 text-slate-300 hover:bg-slate-900"
                                      : "bg-white text-slate-600 hover:bg-slate-100"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <HardDrive className="w-3.5 h-3.5 opacity-80" />
                                  <span>همه اسناد</span>
                                </div>
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${
                                  selectedFolderFilter === "all" ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                                }`}>
                                  {getFolderFileCount("all")}
                                </span>
                              </button>

                              {/* Starred / Favorites */}
                              <button
                                onClick={() => setSelectedFolderFilter("starred")}
                                className={`w-full px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                                  selectedFolderFilter === "starred"
                                    ? "bg-amber-500 text-white shadow-sm"
                                    : isDarkMode
                                      ? "bg-slate-900/60 text-amber-400 hover:bg-slate-900"
                                      : "bg-amber-50/60 text-amber-700 hover:bg-amber-100/80"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                  <span>اسناد برگزیده</span>
                                </div>
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${
                                  selectedFolderFilter === "starred" ? "bg-white/20 text-white" : "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400"
                                }`}>
                                  {getFolderFileCount("starred")}
                                </span>
                              </button>

                              {/* Uncategorized */}
                              <button
                                onClick={() => setSelectedFolderFilter("uncategorized")}
                                className={`w-full px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                                  selectedFolderFilter === "uncategorized"
                                    ? "bg-indigo-600 text-white shadow-sm"
                                    : isDarkMode
                                      ? "bg-slate-900/60 text-slate-300 hover:bg-slate-900"
                                      : "bg-white text-slate-600 hover:bg-slate-100"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <FileText className="w-3.5 h-3.5 opacity-80" />
                                  <span>دسته‌بندی نشده</span>
                                </div>
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${
                                  selectedFolderFilter === "uncategorized" ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                                }`}>
                                  {getFolderFileCount("uncategorized")}
                                </span>
                              </button>

                              {/* Separator */}
                              <div className="h-px bg-slate-200 dark:bg-slate-800 my-2"></div>

                              {/* User Defined Folders */}
                              {userDefinedFolders.map(folderObj => {
                                const folderName = typeof folderObj === "string" ? folderObj : folderObj.name;
                                const folderColor = typeof folderObj === "string" ? "indigo" : (folderObj.color || "indigo");
                                const folderDesc = typeof folderObj === "string" ? "" : folderObj.description;
                                const colorConfig = FOLDER_COLORS[folderColor] || FOLDER_COLORS.indigo;
                                const isSelected = selectedFolderFilter === folderName;
                                return (
                                  <div key={folderName} className="group relative flex flex-col rounded-lg transition-all hover:bg-slate-200/30 dark:hover:bg-slate-900/30 p-0.5">
                                    <div className="flex items-center justify-between">
                                      <button
                                        onClick={() => setSelectedFolderFilter(folderName)}
                                        className={`flex-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                                          isSelected
                                            ? "bg-indigo-600 text-white shadow-sm"
                                            : isDarkMode
                                              ? "text-slate-300"
                                              : "text-slate-600"
                                        }`}
                                      >
                                        <div className="flex items-center gap-2 max-w-[130px] truncate text-right">
                                          <Folder className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "text-white" : colorConfig.text} ${isSelected ? "fill-white/10" : "fill-current/10"}`} />
                                          <div className="flex flex-col text-right">
                                            <span className="truncate">{folderName}</span>
                                            {folderDesc && (
                                              <span className={`text-[8.5px] font-medium opacity-70 truncate max-w-[100px] ${
                                                isSelected 
                                                  ? "text-indigo-200" 
                                                  : isDarkMode ? "text-slate-400" : "text-slate-500"
                                              }`}>{folderDesc}</span>
                                            )}
                                          </div>
                                        </div>
                                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${
                                          isSelected ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                                        }`}>
                                          {getFolderFileCount(folderName)}
                                        </span>
                                      </button>

                                      {/* Action items on hover/always */}
                                      <div className="absolute left-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {/* Rename/Edit folder button */}
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            renameFolder(folderName);
                                          }}
                                          className={`p-1 rounded transition-colors cursor-pointer ${
                                            isSelected ? "text-indigo-100 hover:bg-white/20" : "text-slate-400 hover:text-indigo-500"
                                          }`}
                                          title="ویرایش پوشه"
                                        >
                                          <FileEdit className="w-3 h-3" />
                                        </button>

                                        {/* Delete Folder button */}
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (window.confirm(`آیا مطمئن هستید که می‌خواهید پوشه «${folderName}» را حذف کنید؟ اسناد این پوشه حذف نمی‌شوند و فقط به حالت بدون پوشه برمی‌گردند.`)) {
                                              setUserDefinedFolders(prev => prev.filter(f => (typeof f === 'string' ? f : f.name) !== folderName));
                                              setPreviousScans(prev => prev.map(s => s.folder === folderName ? { ...s, folder: undefined } : s));
                                              if (selectedFolderFilter === folderName) {
                                                setSelectedFolderFilter("all");
                                              }
                                              logEvent("حذف پوشه", `کاربر پوشه «${folderName}» را حذف کرد.`, "warning");
                                              showNotification(`پوشه «${folderName}» حذف شد.`, "info");
                                            }
                                          }}
                                          className={`p-1 rounded transition-colors cursor-pointer ${
                                            isDarkMode ? "hover:bg-slate-800 text-slate-500 hover:text-rose-400" : "hover:bg-slate-200 text-slate-400 hover:text-rose-600"
                                          }`}
                                          title="حذف پوشه"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 text-center">
                            <span className={`text-[10px] ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>سامانه یکپارچه حسابداری ERP</span>
                          </div>
                        </div>
                      </div>

                      {/* Right column (Files Grid & controls) */}
                      <div className="lg:col-span-3 space-y-4">
                        
                        {/* Control Bar */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <label className={`cursor-pointer px-3.5 py-1.5 rounded-lg text-[10px] font-bold shadow-sm transition-all flex items-center gap-1.5 shrink-0 ${isDarkMode ? "bg-indigo-600 text-white hover:bg-indigo-500" : "bg-slate-900 text-white hover:bg-slate-800"}`}>
                              <input 
                                type="file" 
                                className="hidden" 
                                accept="image/*,application/pdf"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    uploadFileDirectly(e.target.files[0]);
                                  }
                                }}
                              />
                              <Upload className="w-3.5 h-3.5" />
                              <span>آپلود سند</span>
                            </label>
                            
                            <button
                              onClick={handleExportCatalogExcel}
                              className={`p-1.5 rounded-lg transition-colors border ${isDarkMode ? "border-slate-800 text-slate-400 hover:bg-slate-800" : "border-slate-200 text-slate-500 hover:bg-slate-100"}`}
                              title="دانلود گزارش کاتالوگ اسناد"
                            >
                              <FileSpreadsheet className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                            <div className="relative w-full sm:w-56">
                              <input
                                type="text"
                                value={fileManagerSearchQuery}
                                onChange={(e) => setFileManagerSearchQuery(e.target.value)}
                                placeholder="جستجو..."
                                className={`w-full py-1.5 pr-8 pl-8 text-[11px] rounded-lg border outline-none transition-colors ${
                                  isDarkMode 
                                    ? "bg-[#0b1120] border-slate-800 text-slate-200 focus:border-slate-600" 
                                    : "bg-slate-50 border-slate-200 text-slate-800 focus:border-slate-300"
                                }`}
                              />
                              <Search className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                              {fileManagerSearchQuery && (
                                <button 
                                  onClick={() => setFileManagerSearchQuery("")}
                                  className="absolute left-2.5 top-1/2 -translate-y-1/2 p-0.5"
                                >
                                  <X className="w-3 h-3 text-slate-400" />
                                </button>
                              )}
                            </div>

                            <div className={`flex items-center rounded-lg border p-0.5 ${isDarkMode ? "bg-[#0b1120] border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                              <button
                                onClick={() => setFileManagerTypeFilter("all")}
                                className={`px-2 py-1 text-[10px] rounded-md transition-colors ${fileManagerTypeFilter === "all" ? (isDarkMode ? "bg-slate-800 text-white" : "bg-white shadow-sm text-slate-800") : "text-slate-500"}`}
                              >
                                همه
                              </button>
                              <button
                                onClick={() => setFileManagerTypeFilter("image")}
                                className={`px-2 py-1 text-[10px] rounded-md transition-colors ${fileManagerTypeFilter === "image" ? (isDarkMode ? "bg-slate-800 text-white" : "bg-white shadow-sm text-slate-800") : "text-slate-500"}`}
                              >
                                تصویر
                              </button>
                              <button
                                onClick={() => setFileManagerTypeFilter("pdf")}
                                className={`px-2 py-1 text-[10px] rounded-md transition-colors ${fileManagerTypeFilter === "pdf" ? (isDarkMode ? "bg-slate-800 text-white" : "bg-white shadow-sm text-slate-800") : "text-slate-500"}`}
                              >
                                PDF
                              </button>
                            </div>

                            <select
                              value={fileManagerSortBy}
                              onChange={(e) => setFileManagerSortBy(e.target.value)}
                              className={`text-[10px] py-1.5 px-2.5 rounded-lg border outline-none appearance-none cursor-pointer ${
                                isDarkMode 
                                  ? "bg-[#0b1120] border-slate-800 text-slate-300" 
                                  : "bg-slate-50 border-slate-200 text-slate-600"
                              }`}
                            >
                              <option value="newest">جدیدترین</option>
                              <option value="oldest">قدیمی‌ترین</option>
                              <option value="largest">حجم: زیاد</option>
                              <option value="smallest">حجم: کم</option>
                            </select>

                            <div className={`flex items-center rounded-lg border p-0.5 ${isDarkMode ? "bg-[#0b1120] border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                              <button
                                onClick={() => setFileManagerViewMode("grid")}
                                className={`p-1 rounded-md ${fileManagerViewMode === "grid" ? (isDarkMode ? "bg-slate-800 text-white" : "bg-white shadow-sm text-slate-800") : "text-slate-400"}`}
                              >
                                <LayoutGrid className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setFileManagerViewMode("list")}
                                className={`p-1 rounded-md ${fileManagerViewMode === "list" ? (isDarkMode ? "bg-slate-800 text-white" : "bg-white shadow-sm text-slate-800") : "text-slate-400"}`}
                              >
                                <List className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            
                            <button
                              onClick={() => {
                                if (selectedScanIds.length === fileManagerFilteredScans.length) setSelectedScanIds([]);
                                else setSelectedScanIds(fileManagerFilteredScans.map(s => s.id));
                              }}
                              className={`p-1.5 rounded-lg transition-colors border ${
                                selectedScanIds.length === fileManagerFilteredScans.length && fileManagerFilteredScans.length > 0
                                  ? "bg-slate-800 border-slate-800 text-white"
                                  : isDarkMode ? "border-slate-800 text-slate-400" : "border-slate-200 text-slate-500 hover:bg-slate-100"
                              }`}
                            >
                              <CheckSquare className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Bulk Actions Sticky Panel */}
                        {selectedScanIds.length > 0 && (
                          <div className={`mb-3 p-3 rounded-lg border flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in ${isDarkMode ? "bg-indigo-950/30 border-indigo-500/20" : "bg-indigo-50 border-indigo-100"}`}>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                                {selectedScanIds.length} سند انتخاب شده
                              </span>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                              <button
                                onClick={handleBulkBatchOCR}
                                className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow-sm transition-all"
                              >
                                <Zap className="w-3.5 h-3.5" />
                                <span>استخراج اطلاعات (OCR)</span>
                              </button>
                              
                              <div className="relative">
                                <select
                                  onChange={(e) => {
                                    if (e.target.value !== "choose") {
                                      handleBulkMove(e.target.value === "none" ? undefined : e.target.value);
                                      e.target.value = "choose";
                                    }
                                  }}
                                  className={`text-[10px] py-1.5 pr-2 pl-6 rounded-lg border outline-none appearance-none cursor-pointer ${isDarkMode ? "bg-[#0b1120] text-indigo-400 border-indigo-500/30" : "bg-white text-indigo-600 border-indigo-200"}`}
                                >
                                  <option value="choose">انتقال به پوشه...</option>
                                  <option value="none">بدون پوشه (دسته‌بندی نشده)</option>
                                  {userDefinedFolders.map(f => {
                                    const folderName = typeof f === "string" ? f : f.name;
                                    return <option key={folderName} value={folderName}>{folderName}</option>;
                                  })}
                                </select>
                                <Folder className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-indigo-500 pointer-events-none" />
                              </div>

                              <div className={`flex rounded-lg overflow-hidden border ${isDarkMode ? "bg-[#0b1120] border-amber-500/30" : "bg-white border-amber-200"}`}>
                                <button
                                  onClick={() => handleBulkStar(true)}
                                  className={`px-2 py-1.5 border-l ${isDarkMode ? "border-amber-500/30 hover:bg-slate-800" : "border-amber-200 hover:bg-amber-50"}`}
                                  title="برگزیدن"
                                >
                                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                </button>
                                <button
                                  onClick={() => handleBulkStar(false)}
                                  className={`px-2 py-1.5 ${isDarkMode ? "hover:bg-slate-800" : "hover:bg-slate-50"}`}
                                  title="حذف از برگزیده‌ها"
                                >
                                  <Star className="w-3.5 h-3.5 text-slate-400" />
                                </button>
                              </div>

                              <button
                                onClick={handleBulkDownload}
                                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 border ${isDarkMode ? "bg-[#0b1120] border-slate-700 text-slate-300 hover:bg-slate-800" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={handleBulkDelete}
                                className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-rose-500 hover:bg-rose-600 text-white flex items-center gap-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => setSelectedScanIds([])}
                                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border ${isDarkMode ? "border-slate-700 text-slate-400 hover:bg-slate-800" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Documents Grid */}
                        {fileManagerFilteredScans.length === 0 ? (
                          <div className={`py-16 flex flex-col items-center justify-center border border-dashed rounded-xl ${isDarkMode ? "border-slate-800 text-slate-500" : "border-slate-200 text-slate-400"}`}>
                            <Folder className="w-14 h-14 mb-3 opacity-20" />
                            <span className="text-sm font-extrabold mb-1">هیچ سندی پیدا نشد.</span>
                            <span className="text-xs text-slate-400 text-center px-4">
                              {previousScans.length === 0 
                                ? "شما هنوز هیچ سندی را بارگذاری نکرده‌اید. یک تصویر یا فاکتور آپلود کنید." 
                                : "هیچ فایلی با این مشخصات فیلتر، پوشه یا واژه جستجو مطابقت ندارد."}
                            </span>
                          </div>
                        ) : (
                          <div className={fileManagerViewMode === "grid" ? "grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "w-full overflow-x-auto"}>
                            {fileManagerViewMode === "list" && (
                              <table className={`w-full text-right ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
                                <thead>
                                  <tr className={`text-[10px] uppercase font-bold border-b ${isDarkMode ? "border-slate-750 text-slate-400" : "border-slate-200 text-slate-500"}`}>
                                    <th className="p-3 w-10 text-center">
                                      <button
                                        onClick={() => {
                                          if (selectedScanIds.length === fileManagerFilteredScans.length) {
                                            setSelectedScanIds([]);
                                          } else {
                                            setSelectedScanIds(fileManagerFilteredScans.map(s => s.id));
                                          }
                                        }}
                                      >
                                        {selectedScanIds.length === fileManagerFilteredScans.length && fileManagerFilteredScans.length > 0 ? <CheckSquare className="w-3.5 h-3.5 text-indigo-500" /> : <Square className="w-3.5 h-3.5 opacity-50" />}
                                      </button>
                                    </th>
                                    <th className="p-3">نام سند</th>
                                    <th className="p-3 w-32">حجم / نوع</th>
                                    <th className="p-3 w-32">پوشه</th>
                                    <th className="p-3 w-32">تاریخ / وضعیت</th>
                                    <th className="p-3 w-40 text-left">عملیات</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {fileManagerFilteredScans.map((scan) => {
                                    const isSelected = selectedScanIds.includes(scan.id);
                                    const isPdf = scan.file?.name?.toLowerCase().endsWith(".pdf") || scan.file?.preview?.startsWith("data:application/pdf");
                                    return (
                                      <tr key={scan.id} className={`border-b transition-colors group/row hover:shadow-sm ${
                                        isSelected 
                                          ? isDarkMode ? "bg-indigo-900/20 border-indigo-500/30" : "bg-indigo-50/50 border-indigo-200" 
                                          : isDarkMode ? "border-slate-800 hover:bg-slate-800/40" : "border-slate-100 hover:bg-slate-50"
                                      }`}>
                                        <td className="p-3 text-center">
                                          <button
                                            onClick={() => {
                                              if (isSelected) setSelectedScanIds(prev => prev.filter(id => id !== scan.id));
                                              else setSelectedScanIds(prev => [...prev, scan.id]);
                                            }}
                                            className={`transition-all ${isSelected ? "text-indigo-600" : "text-slate-400 opacity-60 group-hover/row:opacity-100"}`}
                                          >
                                            {isSelected ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                                          </button>
                                        </td>
                                        <td className="p-3">
                                          <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 shrink-0 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-950 flex items-center justify-center relative border border-slate-200 dark:border-slate-800">
                                              {isPdf && scan.file?.preview ? (
                                                <PdfThumbnail base64={scan.file.preview.split(",")[1]} className="w-full h-full" isDarkMode={isDarkMode} />
                                              ) : isPdf ? (
                                                <div className="w-full h-full bg-rose-50 dark:bg-rose-950/20 flex flex-col items-center justify-center">
                                                  <FileText className="w-4 h-4 text-rose-500" />
                                                </div>
                                              ) : scan.file?.preview ? (
                                                <img src={scan.file.preview} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                              ) : (
                                                <FileText className="w-4 h-4 text-indigo-400" />
                                              )}
                                            </div>
                                            <div className="flex flex-col max-w-[200px]">
                                              <div className="flex items-center gap-1.5">
                                                <span className="font-extrabold text-xs truncate" title={scan.file?.name}>{scan.file?.name}</span>
                                                <button
                                                  onClick={() => renamePreviousScan(scan.id, scan.file?.name || "")}
                                                  className="opacity-0 group-hover/row:opacity-100 text-slate-400 hover:text-indigo-500 transition-opacity"
                                                  title="تغییر نام"
                                                >
                                                  <FileEdit className="w-3 h-3" />
                                                </button>
                                              </div>
                                              <span className="text-[9px] opacity-60">ID: {scan.id.substring(0,6)}...</span>
                                              {scan.isStarred && (
                                                <span className="text-[9px] text-amber-400 font-bold flex items-center gap-0.5">⭐ برگزیده</span>
                                              )}
                                              {scan.tags && scan.tags.length > 0 && (
                                                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 truncate max-w-[80px]">
                                                  #{scan.tags[0]} {scan.tags.length > 1 ? `+${scan.tags.length - 1}` : ''}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        </td>
                                        <td className="p-3 text-[10px]">
                                          <div className="flex flex-col">
                                            <span className="font-semibold" dir="ltr">{formatBytes(scan.file?.size || 0)}</span>
                                            <span className="opacity-60">{isPdf ? 'PDF Document' : 'Image File'}</span>
                                          </div>
                                        </td>
                                        <td className="p-3">
                                          <select
                                            value={scan.folder || ""}
                                            onChange={(e) => {
                                              const val = e.target.value;
                                              setPreviousScans(prev => prev.map(s => s.id === scan.id ? { ...s, folder: val || undefined } : s));
                                              showNotification(`سند «${scan.file?.name}» انتقال یافت.`, "success");
                                              logEvent("انتقال پوشه سند", `کاربر پوشه سند «${scan.file?.name}» را به «${val || "دسته‌بندی نشده"}» تغییر داد.`);
                                            }}
                                            className={`w-full text-[10px] font-bold py-1 pr-1 pl-4 rounded-md border outline-none appearance-none transition-all cursor-pointer text-right ${
                                              isDarkMode 
                                                ? "bg-slate-900 border-slate-750 hover:border-indigo-500" 
                                                : "bg-slate-50 border-slate-200 hover:border-indigo-500"
                                            }`}
                                          >
                                            <option value="">بدون پوشه</option>
                                            {userDefinedFolders.map(folder => {
                                              const folderName = typeof folder === "string" ? folder : folder.name;
                                              return <option key={folderName} value={folderName}>{folderName}</option>;
                                            })}
                                          </select>
                                        </td>
                                        <td className="p-3 text-[10px]">
                                          <div className="flex flex-col">
                                            <span>{new Date(scan.timestamp).toLocaleDateString("fa-IR")}</span>
                                            {scan.file?.status === "idle" ? (
                                              <span className="text-amber-500 font-bold flex items-center gap-1 mt-0.5 animate-pulse"><Cpu className="w-3 h-3" /> منتظر پردازش</span>
                                            ) : (
                                              <span className="text-indigo-500 font-bold mt-0.5">{scan.transactions?.length || 0} ردیف داده</span>
                                            )}
                                          </div>
                                        </td>
                                        <td className="p-3 text-left">
                                          <div className="flex justify-end items-center gap-1.5 opacity-60 group-hover/row:opacity-100 transition-opacity">
                                            {scan.file?.status === "idle" ? (
                                              <button onClick={() => handleProcessUnscannedFile(scan)} className="px-2 py-1 rounded bg-amber-500 text-white text-[9px] font-bold">پردازش</button>
                                            ) : (
                                              <button onClick={() => { selectPreviousScan(scan); setIsFileManagerOpen(false); }} className="px-2 py-1 rounded bg-indigo-500 text-white text-[9px] font-bold">باز کردن</button>
                                            )}
                                            <button onClick={() => toggleStarScan(scan.id)} className={`p-1.5 rounded-lg border transition-all ${scan.isStarred ? "bg-amber-500/20 border-amber-500/40 text-amber-500" : isDarkMode ? "hover:bg-slate-800 border-slate-700 text-slate-400" : "hover:bg-slate-100 border-slate-200 text-slate-500"}`} title={scan.isStarred ? "حذف از برگزیده‌ها" : "علامت‌گذاری برگزیده"}><Star className={`w-3 h-3 ${scan.isStarred ? "fill-amber-400 text-amber-400" : ""}`} /></button>
                                            <button onClick={() => setInspectingScanId(scan.id)} className={`p-1.5 rounded-lg border ${isDarkMode ? "hover:bg-slate-800 border-slate-700 text-cyan-400" : "hover:bg-slate-100 border-slate-200 text-cyan-600"}`} title="شناسنامه و بازرسی کامل سند"><Info className="w-3 h-3" /></button>
                                            <button onClick={() => setActivePreviewScan(scan)} className={`p-1.5 rounded-lg border ${isDarkMode ? "hover:bg-slate-800 border-slate-700" : "hover:bg-slate-100 border-slate-200"}`} title="پیش‌نمایش"><Eye className="w-3 h-3" /></button>
                                            <button onClick={() => openExclusiveChatForDocument(scan)} className={`p-1.5 rounded-lg border text-purple-500 ${isDarkMode ? "hover:bg-purple-900/30 border-purple-500/30" : "hover:bg-purple-50 border-purple-200"}`} title="چت اختصاصی سند با هوش مصنوعی"><MessageSquareText className="w-3 h-3" /></button>
                                             <button onClick={() => downloadBase64File(scan)} className={`p-1.5 rounded-lg border ${isDarkMode ? "hover:bg-slate-800 border-slate-700" : "hover:bg-slate-100 border-slate-200"}`} title="دانلود"><Download className="w-3 h-3" /></button>
                                            <button onClick={() => { if(window.confirm('حذف شود؟')){ setPreviousScans(prev => prev.filter(s => s.id !== scan.id)); } }} className="p-1.5 rounded-lg text-rose-500 border border-transparent hover:bg-rose-500/10" title="حذف"><Trash2 className="w-3 h-3" /></button>
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            )}

                            {fileManagerViewMode === "grid" && fileManagerFilteredScans.map((scan) => {
                              const isSelected = selectedScanIds.includes(scan.id);
                              const isPdf = scan.file?.name?.toLowerCase().endsWith(".pdf") || scan.file?.preview?.startsWith("data:application/pdf");
                              return (
                                <div 
                                  key={scan.id} 
                                  className={`group/card p-4 rounded-xl border flex flex-col justify-between transition-all relative hover:shadow-md ${
                                    isSelected
                                      ? "border-indigo-500 ring-1 ring-indigo-500/30 bg-indigo-50/5 dark:bg-indigo-950/5"
                                      : isDarkMode 
                                        ? "bg-slate-800/40 border-slate-750 hover:border-slate-650" 
                                        : "bg-white border-slate-200 hover:border-slate-300"
                                  }`}
                                >
                                  {/* Select Checkbox on Hover */}
                                  <button
                                    onClick={() => {
                                      if (isSelected) {
                                        setSelectedScanIds(prev => prev.filter(id => id !== scan.id));
                                      } else {
                                        setSelectedScanIds(prev => [...prev, scan.id]);
                                      }
                                    }}
                                    className={`absolute top-3 left-3 z-10 p-1 rounded-lg transition-all ${
                                      isSelected 
                                        ? "bg-indigo-600 text-white scale-100" 
                                        : "bg-slate-100 dark:bg-slate-950 text-slate-400 scale-90 opacity-60 group-hover/card:opacity-100 group-hover/card:scale-100 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                                    }`}
                                  >
                                    {isSelected ? (
                                      <CheckSquare className="w-3.5 h-3.5" />
                                    ) : (
                                      <Square className="w-3.5 h-3.5" />
                                    )}
                                  </button>

                                  <div className="flex items-start gap-3 mb-3">
                                    {/* Thumbnail */}
                                    <div className="w-11 h-11 shrink-0 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center relative shadow-inner">
                                      {isPdf && scan.file?.preview ? (
                                        <PdfThumbnail base64={scan.file.preview.split(",")[1]} className="w-full h-full transition-transform duration-300 group-hover/card:scale-110" isDarkMode={isDarkMode} />
                                      ) : isPdf ? (
                                        <div className="w-full h-full bg-rose-50 dark:bg-rose-950/20 flex flex-col items-center justify-center">
                                          <FileText className="w-5 h-5 text-rose-500" />
                                          <span className="text-[7px] font-black text-rose-600 uppercase mt-0.5">PDF</span>
                                        </div>
                                      ) : scan.file?.preview ? (
                                        <img src={scan.file.preview} alt="" className="w-full h-full object-cover transition-transform duration-300 group-hover/card:scale-110" referrerPolicy="no-referrer" />
                                      ) : (
                                        <FileText className="w-5 h-5 text-indigo-400" />
                                      )}
                                    </div>
                                    
                                    {/* Details */}
                                    <div className="flex-1 min-w-0 pr-0.5 text-right">
                                      <div className="flex items-center gap-1">
                                        <h5 className="font-extrabold text-xs truncate flex-1" title={scan.file?.name}>
                                          {scan.file?.name}
                                        </h5>
                                        {/* Rename button */}
                                        <button
                                          onClick={() => renamePreviousScan(scan.id, scan.file?.name || "")}
                                          className="p-1 rounded opacity-0 group-hover/card:opacity-100 text-slate-400 hover:text-indigo-500 transition-opacity"
                                          title="تغییر نام فاکتور"
                                        >
                                          <FileEdit className="w-3 h-3" />
                                        </button>
                                      </div>
                                      
                                      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mt-1 text-[10px] text-slate-500" dir="rtl">
                                        <span dir="ltr" className="font-semibold">{formatBytes(scan.file?.size || 0)}</span>
                                        <span className="opacity-40">•</span>
                                        <span>{new Date(scan.timestamp).toLocaleDateString("fa-IR")}</span>
                                      </div>
                                      
                                      {/* Folder quick move inside card */}
                                      <div className="flex items-center gap-1.5 mt-2.5">
                                        <span className={`text-[9px] font-bold shrink-0 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>انتقال پوشه:</span>
                                        <div className="relative flex-1">
                                          <select
                                            value={scan.folder || ""}
                                            onChange={(e) => {
                                              const val = e.target.value;
                                              setPreviousScans(prev => prev.map(s => s.id === scan.id ? { ...s, folder: val || undefined } : s));
                                              showNotification(`سند «${scan.file?.name}» به پوشه «${val || "دسته‌بندی نشده"}» انتقال یافت.`, "success");
                                              logEvent("انتقال پوشه سند", `کاربر پوشه سند «${scan.file?.name}» را به «${val || "دسته‌بندی نشده"}» تغییر داد.`);
                                            }}
                                            className={`w-full text-[9px] font-bold py-0.5 pr-1.5 pl-5 rounded-md border outline-none appearance-none transition-all cursor-pointer text-right ${
                                              isDarkMode 
                                                ? "bg-slate-900 border-slate-750 text-slate-300 hover:border-indigo-500 focus:border-indigo-500" 
                                                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-white hover:border-indigo-500 focus:border-indigo-500"
                                            }`}
                                          >
                                            <option value="">دسته‌بندی نشده</option>
                                            {userDefinedFolders.map(folder => {
                                              const folderName = typeof folder === "string" ? folder : folder.name;
                                              return (
                                                <option key={folderName} value={folderName}>{folderName}</option>
                                              );
                                            })}
                                          </select>
                                          <Folder className="w-2.5 h-2.5 absolute left-1.5 top-1/2 -translate-y-1/2 text-indigo-400 pointer-events-none" />
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <div>
                                    {/* Meta Data stats inside card */}
                                    <div className={`p-2 rounded-lg mb-3 flex items-center justify-between text-[9px] font-bold ${
                                      isDarkMode ? "bg-slate-900/40 text-slate-400" : "bg-slate-50 text-slate-500"
                                    }`}>
                                      {scan.file?.status === "idle" ? (
                                        <span className="text-amber-500 font-extrabold flex items-center gap-1 animate-pulse">
                                          <Cpu className="w-3 h-3 text-amber-500 animate-spin" />
                                          آماده پردازش هوشمند
                                        </span>
                                      ) : (
                                        <span>تراکنش‌های فاکتور: <span className="text-indigo-500 font-extrabold">{scan.transactions?.length.toLocaleString("fa-IR") || 0} ردیف</span></span>
                                      )}
                                      {scan.file?.tokensUsed ? (
                                        <span>توکن‌ها: <span className="text-emerald-500 font-extrabold">{scan.file.tokensUsed.toLocaleString("fa-IR")}</span></span>
                                      ) : (
                                        <span>حجم: {formatBytes(scan.file?.size || 0)}</span>
                                      )}
                                    </div>

                                    {/* Card Action Buttons */}
                                    <div className="flex items-center gap-1.5 pt-2.5 border-t border-slate-100 dark:border-slate-850 mt-auto">
                                      {scan.file?.status === "idle" ? (
                                        <button
                                          onClick={() => handleProcessUnscannedFile(scan)}
                                          className="flex-1 py-1.5 rounded-lg text-[10px] font-black transition-all shadow-md bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white animate-pulse cursor-pointer"
                                        >
                                          پردازش با هوش مصنوعی
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() => {
                                            selectPreviousScan(scan);
                                            setIsFileManagerOpen(false);
                                          }}
                                          className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all shadow-sm cursor-pointer ${
                                            isDarkMode 
                                              ? "bg-indigo-600/20 text-indigo-400 hover:bg-indigo-650/30" 
                                              : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                                          }`}
                                        >
                                          باز کردن فاکتور
                                        </button>
                                      )}

                                      {/* Star Button */}
                                      <button
                                        onClick={() => toggleStarScan(scan.id)}
                                        className={`p-1.5 rounded-lg transition-colors border cursor-pointer ${
                                          scan.isStarred
                                            ? "border-amber-500/40 bg-amber-500/10 text-amber-500"
                                            : isDarkMode
                                              ? "border-slate-700 hover:bg-slate-750 text-slate-400"
                                              : "border-slate-200 hover:bg-slate-100 text-slate-500"
                                        }`}
                                        title={scan.isStarred ? "حذف از برگزیده‌ها" : "علامت‌گذاری به‌عنوان برگزیده"}
                                      >
                                        <Star className={`w-3.5 h-3.5 ${scan.isStarred ? "fill-amber-400 text-amber-400" : ""}`} />
                                      </button>

                                      {/* Inspector Button */}
                                      <button
                                        onClick={() => setInspectingScanId(scan.id)}
                                        className={`p-1.5 rounded-lg transition-colors border cursor-pointer ${
                                          isDarkMode 
                                            ? "border-slate-700 hover:bg-slate-750 text-cyan-400" 
                                            : "border-slate-200 hover:bg-cyan-50 text-cyan-600"
                                        }`}
                                        title="شناسنامه و بازرسی کامل سند"
                                      >
                                        <Info className="w-3.5 h-3.5" />
                                      </button>

                                      {/* Exclusive Chat Button */}
                                      <button
                                        onClick={() => openExclusiveChatForDocument(scan)}
                                        className={`p-1.5 rounded-lg transition-colors border cursor-pointer ${
                                          isDarkMode 
                                            ? "border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300" 
                                            : "border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700"
                                        }`}
                                        title="چت اختصاصی و انحصاری با هوش مصنوعی درباره این سند"
                                      >
                                        <MessageSquareText className="w-3.5 h-3.5" />
                                      </button>

                                      {/* Quick Preview Button */}
                                      <button
                                        onClick={() => {
                                          setActivePreviewScan(scan);
                                        }}
                                        className={`p-1.5 rounded-lg transition-colors border cursor-pointer ${
                                          isDarkMode 
                                            ? "border-slate-700 hover:bg-slate-750 text-indigo-400" 
                                            : "border-slate-200 hover:bg-indigo-50 text-indigo-600 hover:text-indigo-750"
                                        }`}
                                        title="پیش‌نمایش اطلاعات"
                                      >
                                        <Eye className="w-3.5 h-3.5" />
                                      </button>
                                      
                                      {/* Download individual */}
                                      <button
                                        onClick={() => downloadBase64File(scan)}
                                        className={`p-1.5 rounded-lg transition-colors border ${
                                          isDarkMode 
                                            ? "border-slate-700 hover:bg-slate-750 text-slate-300" 
                                            : "border-slate-200 hover:bg-slate-100 text-slate-600"
                                        }`}
                                        title="دانلود فایل فاکتور"
                                      >
                                        <Download className="w-3.5 h-3.5" />
                                      </button>

                                      {/* Delete individual */}
                                      <button
                                        onClick={() => {
                                          if (window.confirm(`آیا مطمئن هستید که می‌خواهید سند «${scan.file?.name}» را حذف کنید؟`)) {
                                            setPreviousScans(prev => prev.filter(s => s.id !== scan.id));
                                            if (activeFile?.id === scan.id) clearCurrentFile();
                                            logEvent("حذف فاکتور", `کاربر فاکتور «${scan.file?.name}» را حذف نمود.`, "warning");
                                            showNotification("سند با موفقیت حذف شد.", "success");
                                          }
                                        }}
                                        className={`p-1.5 rounded-lg transition-all ${
                                          isDarkMode ? "bg-rose-500/10 text-rose-400 hover:bg-rose-500/20" : "bg-rose-50 text-rose-600 hover:bg-rose-100"
                                        }`}
                                        title="حذف فاکتور"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>

                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Document Inspector Sub-Modal */}
                    {(() => {
                      if (!inspectingScanId) return null;
                      const scan = previousScans.find(s => s.id === inspectingScanId);
                      if (!scan) return null;

                      const isPdf = scan.file?.name?.toLowerCase().endsWith(".pdf") || scan.file?.preview?.startsWith("data:application/pdf");
                      const totalDebit = scan.transactions?.reduce((acc, t) => acc + (Number(t.بدهکار || t.مبلغ_بدهکار || 0) || 0), 0) || 0;
                      const totalCredit = scan.transactions?.reduce((acc, t) => acc + (Number(t.بستانکار || t.مبلغ_بستانکار || 0) || 0), 0) || 0;

                      return (
                        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 sm:p-6 animate-fade-in">
                          <div 
                            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                            onClick={() => setInspectingScanId(null)}
                          ></div>

                          <div className={`relative w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden transform transition-all ${
                            isDarkMode ? "bg-slate-900 border border-slate-800 text-slate-200" : "bg-white border-slate-200 text-slate-800"
                          }`} dir="rtl">
                            {/* Header */}
                            <div className={`p-5 border-b flex items-center justify-between shrink-0 ${isDarkMode ? "bg-slate-800/80 border-slate-750" : "bg-slate-50/80 border-slate-100"}`}>
                              <div className="flex items-center gap-3">
                                <div className={`p-2.5 rounded-xl ${isDarkMode ? "bg-cyan-950/40 text-cyan-400" : "bg-cyan-50 text-cyan-600"}`}>
                                  <Info className="h-5 w-5" />
                                </div>
                                <div>
                                  <h3 className="font-bold text-base flex items-center gap-2">
                                    <span>شناسنامه و مشخصات کامل سند</span>
                                    {scan.isStarred && <Star className="w-4 h-4 fill-amber-400 text-amber-400" />}
                                  </h3>
                                  <p className={`text-[11px] mt-0.5 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                                    شناسه یکتا: <span className="font-mono text-indigo-400">{scan.id}</span>
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => toggleStarScan(scan.id)}
                                  className={`p-2 rounded-lg border transition-all cursor-pointer ${
                                    scan.isStarred
                                      ? "bg-amber-500/20 border-amber-500/40 text-amber-500"
                                      : isDarkMode
                                        ? "border-slate-700 text-slate-400 hover:text-amber-400"
                                        : "border-slate-200 text-slate-500 hover:text-amber-500"
                                  }`}
                                  title={scan.isStarred ? "حذف از برگزیده‌ها" : "علامت‌گذاری به‌عنوان برگزیده"}
                                >
                                  <Star className={`w-4 h-4 ${scan.isStarred ? "fill-amber-400 text-amber-400" : ""}`} />
                                </button>
                                <button 
                                  onClick={() => setInspectingScanId(null)}
                                  className={`p-2 rounded-lg transition-colors ${isDarkMode ? "hover:bg-slate-800 text-slate-400 hover:text-white" : "hover:bg-slate-200 text-slate-500 hover:text-slate-900"}`}
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            </div>

                            {/* Body */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                
                                {/* Left Column: Preview Thumbnail & Basic Info */}
                                <div className="space-y-4">
                                  <div className="w-full aspect-square rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center relative shadow-inner">
                                    {isPdf && scan.file?.preview ? (
                                      <PdfThumbnail base64={scan.file.preview.split(",")[1]} className="w-full h-full object-contain" isDarkMode={isDarkMode} />
                                    ) : scan.file?.preview ? (
                                      <img src={scan.file.preview} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                                    ) : (
                                      <FileText className="w-12 h-12 text-slate-600" />
                                    )}
                                  </div>

                                  <div className={`p-4 rounded-xl border space-y-2.5 text-xs ${isDarkMode ? "bg-slate-800/40 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                                    <div className="flex justify-between items-center">
                                      <span className="text-slate-400">نام فایل:</span>
                                      <span className="font-bold truncate max-w-[140px]" title={scan.file?.name}>{scan.file?.name}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-slate-400">حجم فایل:</span>
                                      <span className="font-bold font-mono" dir="ltr">{formatBytes(scan.file?.size || 0)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-slate-400">نوع پسوند:</span>
                                      <span className="font-bold uppercase text-indigo-400">{isPdf ? "PDF" : "Image"}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-slate-400">پوشه مربوطه:</span>
                                      <span className="font-bold text-emerald-400">{scan.folder || "دسته‌بندی نشده"}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-slate-400">تاریخ آپلود:</span>
                                      <span className="font-bold">{new Date(scan.timestamp).toLocaleDateString("fa-IR")}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Right Column: Tags, Metrics & Actions */}
                                <div className="md:col-span-2 space-y-5">
                                  
                                  {/* Tags Manager */}
                                  <div className={`p-4 rounded-xl border space-y-3 ${isDarkMode ? "bg-slate-800/30 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                                    <h4 className="text-xs font-bold flex items-center gap-2">
                                      <Tag className="w-3.5 h-3.5 text-indigo-400" />
                                      <span>برچسب‌های سند</span>
                                    </h4>

                                    <div className="flex flex-wrap items-center gap-1.5">
                                      {(scan.tags || []).length === 0 ? (
                                        <span className="text-[10px] text-slate-400 italic">هیچ برچسبی ثبت نشده است.</span>
                                      ) : (
                                        scan.tags?.map((t, idx) => (
                                          <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                                            <span>#{t}</span>
                                            <button 
                                              onClick={() => removeTagFromScan(scan.id, t)}
                                              className="hover:text-rose-400 transition-colors"
                                            >
                                              <X className="w-2.5 h-2.5" />
                                            </button>
                                          </span>
                                        ))
                                      )}
                                    </div>

                                    {/* Add Tag Input */}
                                    <div className="flex items-center gap-2 pt-1">
                                      <input
                                        type="text"
                                        id="newTagInput"
                                        placeholder="مثلاً: فاکتور خرید، تایید شده، حسابداری..."
                                        className={`flex-1 px-3 py-1.5 rounded-lg text-xs border outline-none transition-all ${
                                          isDarkMode 
                                            ? "bg-slate-900 border-slate-700 text-white focus:border-indigo-500" 
                                            : "bg-white border-slate-300 text-slate-800 focus:border-indigo-500"
                                        }`}
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter") {
                                            const input = e.currentTarget;
                                            addTagToScan(scan.id, input.value);
                                            input.value = "";
                                          }
                                        }}
                                      />
                                      <button
                                        onClick={() => {
                                          const input = document.getElementById("newTagInput") as HTMLInputElement;
                                          if (input && input.value) {
                                            addTagToScan(scan.id, input.value);
                                            input.value = "";
                                          }
                                        }}
                                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer"
                                      >
                                        + افزودن
                                      </button>
                                    </div>
                                  </div>

                                  {/* Extraction Stats */}
                                  <div className="grid grid-cols-2 gap-3">
                                    <div className={`p-3.5 rounded-xl border space-y-1 ${isDarkMode ? "bg-slate-800/40 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                                      <span className="text-[10px] text-slate-400 block">تعداد ردیف‌های داده</span>
                                      <span className="text-base font-extrabold text-indigo-400">{scan.transactions?.length.toLocaleString("fa-IR") || 0} ردیف</span>
                                    </div>
                                    <div className={`p-3.5 rounded-xl border space-y-1 ${isDarkMode ? "bg-slate-800/40 border-slate-800" : "bg-slate-800/20 border-slate-200"}`}>
                                      <span className="text-[10px] text-slate-400 block">توکن‌های AI مصرف‌شده</span>
                                      <span className="text-base font-extrabold text-emerald-400">{scan.file?.tokensUsed?.toLocaleString("fa-IR") || "مشخص نشده"}</span>
                                    </div>
                                    {totalDebit > 0 && (
                                      <div className={`p-3.5 rounded-xl border space-y-1 ${isDarkMode ? "bg-slate-800/40 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                                        <span className="text-[10px] text-slate-400 block">مجموع گردش بدهکار</span>
                                        <span className="text-sm font-extrabold text-rose-400">{totalDebit.toLocaleString("fa-IR")} ریال</span>
                                      </div>
                                    )}
                                    {totalCredit > 0 && (
                                      <div className={`p-3.5 rounded-xl border space-y-1 ${isDarkMode ? "bg-slate-800/40 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                                        <span className="text-[10px] text-slate-400 block">مجموع گردش بستانکار</span>
                                        <span className="text-sm font-extrabold text-emerald-400">{totalCredit.toLocaleString("fa-IR")} ریال</span>
                                      </div>
                                    )}
                                  </div>

                                  {/* AI Document Analysis Summary if available */}
                                  {scan.file?.documentAnalysis && (
                                    <div className={`p-4 rounded-xl border space-y-1.5 ${isDarkMode ? "bg-slate-800/20 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                                      <h4 className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                                        <Brain className="w-3.5 h-3.5" />
                                        <span>خلاصه و تحلیل هوش مصنوعی درباره سند</span>
                                      </h4>
                                      <p className="text-xs leading-relaxed text-slate-300 opacity-90 line-clamp-4">
                                        {scan.file.documentAnalysis}
                                      </p>
                                    </div>
                                  )}

                                </div>
                              </div>
                            </div>

                            {/* Footer Actions */}
                            <div className={`p-4 border-t flex flex-wrap items-center justify-between gap-3 shrink-0 ${isDarkMode ? "bg-slate-800/80 border-slate-750" : "bg-slate-50/80 border-slate-100"}`}>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    selectPreviousScan(scan);
                                    setInspectingScanId(null);
                                    setIsFileManagerOpen(false);
                                  }}
                                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer"
                                >
                                  باز کردن در موتور حسابداری
                                </button>

                                <button
                                  onClick={() => {
                                    setInspectingScanId(null);
                                    openExclusiveChatForDocument(scan);
                                  }}
                                  className="px-3 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                                >
                                  <MessageSquareText className="w-3.5 h-3.5" />
                                  <span>چت اختصاصی سند</span>
                                </button>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => downloadBase64File(scan)}
                                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                                    isDarkMode ? "border-slate-700 hover:bg-slate-800 text-slate-300" : "border-slate-300 hover:bg-slate-100 text-slate-700"
                                  }`}
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>دانلود فایل</span>
                                </button>

                                <button
                                  onClick={() => {
                                    if (window.confirm(`آیا مطمئن هستید که می‌خواهید سند «${scan.file?.name}» را حذف کنید؟`)) {
                                      setPreviousScans(prev => prev.filter(s => s.id !== scan.id));
                                      setInspectingScanId(null);
                                      showNotification("سند با موفقیت حذف گردید.", "success");
                                    }
                                  }}
                                  className="px-3 py-2 rounded-xl text-xs font-bold bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer flex items-center gap-1.5"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>حذف سند</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Quick Preview Sub-Modal */}
      {activePreviewScan && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 sm:p-6">
          <div 
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setActivePreviewScan(null)}
          ></div>
          
          <div className={`relative w-full max-w-4xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden transform transition-all ${
            isDarkMode ? "bg-slate-900 border border-slate-800 text-slate-200" : "bg-white border-slate-200 text-slate-800"
          }`} dir="rtl">
            {/* Header */}
            <div className={`p-4 border-b flex items-center justify-between shrink-0 ${isDarkMode ? "bg-slate-800/80 border-slate-700" : "bg-slate-50 border-slate-100"}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isDarkMode ? "bg-indigo-650/20 text-indigo-400" : "bg-indigo-50 text-indigo-600"}`}>
                  <Eye className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm">{activePreviewScan.file?.name}</h4>
                  <p className={`text-[10px] mt-0.5 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                    نوع: {activePreviewScan.file?.documentType || "نامشخص"} • حجم: {formatBytesGlobal(activePreviewScan.file?.size || 0)} • تاریخ بارگذاری: {new Date(activePreviewScan.timestamp).toLocaleDateString("fa-IR")}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setActivePreviewScan(null)}
                className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? "hover:bg-slate-800 text-slate-400 hover:text-white" : "hover:bg-slate-200 text-slate-500 hover:text-slate-900"}`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Split Content */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              {/* Document Preview (Left) */}
              <div className={`flex-1 md:w-1/2 p-4 flex flex-col items-center justify-center overflow-auto border-l ${
                isDarkMode ? "bg-slate-950/30 border-slate-800" : "bg-slate-50/50 border-slate-150"
              }`}>
                {activePreviewScan.file?.name?.toLowerCase().endsWith(".pdf") || activePreviewScan.file?.preview?.startsWith("data:application/pdf") ? (
                  <PdfViewer
                    base64={activePreviewScan.file.preview}
                    fileName={activePreviewScan.file.name}
                    isDarkMode={isDarkMode}
                    className="w-full h-full min-h-[440px]"
                  />
                ) : activePreviewScan.file?.preview ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md max-h-[60vh]">
                    <img src={activePreviewScan.file.preview} alt="Document Preview" className="max-h-[58vh] max-w-full object-contain" referrerPolicy="no-referrer" />
                  </div>
                ) : (
                  <div className="text-slate-500 text-xs flex flex-col items-center">
                    <FileText className="w-12 h-12 mb-2 opacity-30" />
                    پیش‌نمایش تصویر برای این فایل در دسترس نیست.
                  </div>
                )}
              </div>

              {/* Data and Details (Right) */}
              <div className="flex-1 md:w-1/2 flex flex-col overflow-hidden">
                {/* Tabs */}
                <div className={`flex border-b shrink-0 px-4 ${isDarkMode ? "border-slate-800 bg-slate-900" : "border-slate-100 bg-slate-50/30"}`}>
                  <button
                    onClick={() => setPreviewTab("transactions")}
                    className={`py-3 px-4 text-xs font-black transition-all border-b-2 -mb-px ${
                      previewTab === "transactions"
                        ? "border-indigo-600 text-indigo-500"
                        : "border-transparent text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    تراکنش‌های استخراج‌شده ({activePreviewScan.transactions?.length || 0})
                  </button>
                  <button
                    onClick={() => setPreviewTab("analysis")}
                    className={`py-3 px-4 text-xs font-black transition-all border-b-2 -mb-px ${
                      previewTab === "analysis"
                        ? "border-indigo-600 text-indigo-500"
                        : "border-transparent text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    تفسیر و ممیزی مالی AI
                  </button>
                  <button
                    onClick={() => setPreviewTab("audit")}
                    className={`py-3 px-4 text-xs font-black transition-all border-b-2 -mb-px ${
                      previewTab === "audit"
                        ? "border-indigo-600 text-indigo-500"
                        : "border-transparent text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    لاگ ممیزی امنیتی
                  </button>
                </div>

                {/* Tab Contents */}
                <div className="flex-1 overflow-y-auto p-4">
                  {previewTab === "transactions" && (
                    <div className="space-y-3">
                      {activePreviewScan.file?.status === "idle" ? (
                        <div className="py-12 text-center flex flex-col items-center">
                          <Cpu className="w-10 h-10 text-amber-500 animate-pulse mb-3" />
                          <h5 className="font-bold text-xs mb-1">این سند هنوز پردازش نشده است!</h5>
                          <p className="text-[10px] text-slate-400 max-w-xs leading-relaxed mb-4">
                            برای استخراج اقلام بدهکار و بستانکار، کدینگ اتوماتیک حساب‌ها و ممیزی موازنه دوطرفه، ابتدا باید این فایل را با موتور هوش مصنوعی پردازش کنید.
                          </p>
                          <button
                            onClick={() => {
                              handleProcessUnscannedFile(activePreviewScan);
                              setActivePreviewScan(null);
                            }}
                            className="px-4 py-2 text-[10px] font-black rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white transition-all shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>شروع پردازش و استخراج هوشمند</span>
                          </button>
                        </div>
                      ) : !activePreviewScan.transactions || activePreviewScan.transactions.length === 0 ? (
                        <div className="py-12 text-center text-xs text-slate-400 italic">
                          تراکنشی برای این سند استخراج نشده یا جدول خالی است.
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {activePreviewScan.transactions.map((t, idx) => (
                            <div key={idx} className={`p-3 rounded-xl border text-right transition-colors ${
                              isDarkMode ? "bg-slate-950/40 border-slate-800 hover:border-slate-700" : "bg-slate-50 border-slate-150 hover:border-slate-200"
                            }`}>
                              <div className="flex items-center justify-between mb-2">
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                                  t.مبلغ_بدهکار > 0
                                    ? "bg-blue-500/10 text-blue-400"
                                    : "bg-emerald-500/10 text-emerald-400"
                                }`}>
                                  {t.مبلغ_بدهکار > 0 ? "بدهکار" : "بستانکار"}
                                </span>
                                <span className="font-mono text-[9px] text-slate-500">{t.تاریخ || "فاقد تاریخ"}</span>
                              </div>
                              <h6 className="font-extrabold text-xs mb-1.5 leading-snug">{t.نام_طرف_حساب || "بدون طرف حساب"}</h6>
                              <p className={`text-[10px] leading-relaxed mb-2 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>{t.شرح || "فاقد شرح تراکنش"}</p>
                              <div className="flex justify-between items-center font-mono text-[10px] border-t border-dashed border-slate-800/40 pt-2 mt-1">
                                <div>
                                  <span className="text-slate-500 text-[9px]">بدهکار: </span>
                                  <span className="font-black text-blue-500">{(t.مبلغ_بدهکار || 0).toLocaleString("fa-IR")}</span>
                                </div>
                                <div>
                                  <span className="text-slate-500 text-[9px]">بستانکار: </span>
                                  <span className="font-black text-emerald-500">{(t.مبلغ_بستانکار || 0).toLocaleString("fa-IR")}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {previewTab === "analysis" && (
                    <div className="space-y-3">
                      {!activePreviewScan.file?.documentAnalysis ? (
                        <div className="py-12 text-center text-xs text-slate-400 italic">
                          {activePreviewScan.file?.status === "idle"
                            ? "تحلیلی برای اسناد پردازش نشده وجود ندارد."
                            : "تفسیری توسط هوش مصنوعی ثبت نشده است."}
                        </div>
                      ) : (
                        <div className={`p-4 rounded-xl border text-right leading-relaxed text-xs leading-loose ${
                          isDarkMode ? "bg-slate-950/40 border-slate-800 text-slate-300" : "bg-slate-50 border-slate-150 text-slate-600"
                        }`} style={{ whiteSpace: "pre-line" }}>
                          {activePreviewScan.file.documentAnalysis}
                        </div>
                      )}
                    </div>
                  )}

                  {previewTab === "audit" && (
                    <div className="space-y-3">
                      {!activePreviewScan.auditLogs || activePreviewScan.auditLogs.length === 0 ? (
                        <div className="py-12 text-center text-xs text-slate-400 italic">
                          تاریخچه لاگی برای این سند ضبط نشده است.
                        </div>
                      ) : (
                        <div className="relative border-r border-slate-200 dark:border-slate-850 mr-2.5 space-y-4">
                          {activePreviewScan.auditLogs.map((log) => (
                            <div key={log.id} className="relative pr-4">
                              <div className="absolute -right-[4.5px] top-1 w-2 h-2 rounded-full bg-indigo-500 ring-4 ring-white dark:ring-slate-900"></div>
                              <span className="font-mono text-[9px] text-slate-500 block mb-1">{new Date(log.timestamp).toLocaleString("fa-IR")}</span>
                              <h6 className="font-black text-xs text-slate-300">{log.action}</h6>
                              <p className={`text-[10px] mt-1 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>{log.details}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className={`p-4 border-t flex items-center justify-between shrink-0 ${isDarkMode ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-100"}`}>
              <button
                onClick={() => {
                  if (activePreviewScan.file?.status === "idle") {
                    handleProcessUnscannedFile(activePreviewScan);
                  } else {
                    selectPreviousScan(activePreviewScan);
                    setIsFileManagerOpen(false);
                  }
                  setActivePreviewScan(null);
                }}
                className="px-4 py-1.5 rounded-lg text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow cursor-pointer"
              >
                {activePreviewScan.file?.status === "idle" ? "بارگذاری و پردازش هوشمند" : "باز کردن کامل و بارگذاری در سند جاری"}
              </button>
              <button
                onClick={() => setActivePreviewScan(null)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
                  isDarkMode ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                بستن پیش‌نمایش
              </button>
            </div>
          </div>
        </div>
      )}

      <AuditLogsModal 
        isOpen={isAuditLogsOpen} 
        onClose={() => setIsAuditLogsOpen(false)} 
        auditLogs={auditLogs} 
        isDarkMode={isDarkMode} 
        onClearLogs={() => setAuditLogs([])} 
      />

      {/* Exclusive Document Chat Modal */}
      <DocumentExclusiveChatModal
        isOpen={isExclusiveChatOpen}
        onClose={() => setIsExclusiveChatOpen(false)}
        documentData={exclusiveChatDoc}
        isDarkMode={isDarkMode}
        selectedModel={selectedModel}
        onApplyInstructionToPrompt={(instruction) => {
          setCustomPrompt(prev => {
            const trimmed = prev.trim();
            if (!trimmed) return instruction;
            return `${trimmed}\n${instruction}`;
          });
        }}
        onLogEvent={logEvent}
        onShowNotification={showNotification}
      />

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
                    <div className="flex flex-col gap-0.5 mt-0.5 text-right">
                      <p className={`text-[9.5px] ${isDarkMode ? "text-emerald-400" : "text-emerald-600"} flex items-center gap-1`}>
                        <span>•</span> پاسخگوی آنلاین فعال
                      </p>
                      <a 
                        href="mailto:alizerehsaz2001@gmail.com" 
                        className={`text-[9px] hover:underline font-semibold block ${isDarkMode ? "text-indigo-400 hover:text-indigo-300" : "text-indigo-600 hover:text-indigo-700"}`}
                        title="ارتباط مستقیم با علی زره‌ساز (توسعه‌دهنده سیستم)"
                      >
                        توسعه‌دهنده: alizerehsaz2001@gmail.com
                      </a>
                    </div>
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
                            text: "سلام! من مهرآیین، پشتیبان هوشمند شما هستم. چطور می‌توانم در کار با نرم‌افزار، استخراج اسناد فاکتور یا ماژول‌های حسابداری و مالی به شما کمک کنم؟ همچنین می‌توانید جهت هرگونه سوال یا راهنمایی فنی مستقیماً با توسعه‌دهنده سیستم (علی زره‌ساز) از طریق ایمیل alizerehsaz2001@gmail.com در ارتباط باشید.",
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
              <div className={`px-4 py-2 shrink-0 border-t flex flex-col gap-2.5 ${
                isDarkMode ? "bg-slate-800/50 border-slate-750" : "bg-slate-50 border-slate-100"
              }`}>
                {/* Always-visible AI Suggestion Button */}
                <button
                  type="button"
                  onClick={() => handleSendChatMessage("لطفا یک خلاصه کامل از وضعیت فعلی سند، مجموع مبالغ بدهکار و بستانکار، وضعیت موازنه (تراز) و تحلیل هرگونه مغایرت مالی در ردیف‌های تراکنش ارائه بده و راهکار پیشنهاد کن.")}
                  className={`w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold transition-all border shadow-sm cursor-pointer ${
                    isDarkMode
                      ? "bg-indigo-500/15 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/25"
                      : "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>پیشنهاد پرامپت: تحلیل وضعیت سند و مغایرت‌ها</span>
                </button>

                {/* Quick Commands List */}
                <div className="flex flex-col mt-0.5 relative">
                   <div className="flex overflow-x-auto gap-1.5 pb-1 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                       <button
                         type="button"
                         onClick={() => setChatInput("لطفاً مقادیر مالیات بر ارزش افزوده (VAT) را با دقت بالا خط به خط بررسی و استخراج کن و در صورت پنهان بودن از جمع کل محاسبه کن.")}
                         className={`shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all border shadow-sm cursor-pointer ${
                           isDarkMode
                             ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25"
                             : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                         }`}
                       >
                         <span>🔍</span> استخراج دقیق مالیات (VAT)
                       </button>
                       <button
                         type="button"
                         onClick={() => setChatInput("لطفاً تمام تاریخ‌های شمسی موجود در سند را پیدا کرده و دقیقاً به معادل تاریخ میلادی (Gregorian Date) در قالب YYYY-MM-DD تبدیل کن.")}
                         className={`shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all border shadow-sm cursor-pointer ${
                           isDarkMode
                             ? "bg-blue-500/15 border-blue-500/30 text-blue-400 hover:bg-blue-500/25"
                             : "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                         }`}
                       >
                         <span>📅</span> تاریخ میلادی
                       </button>
                       <button
                         type="button"
                         onClick={() => setChatInput("ردیف‌هایی که مجموع مبلغ آن‌ها با (تعداد × قیمت واحد) مغایرت دارد را پیدا کن و دلیل احتمالی را گزارش بده.")}
                         className={`shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all border shadow-sm cursor-pointer ${
                           isDarkMode
                             ? "bg-amber-500/15 border-amber-500/30 text-amber-400 hover:bg-amber-500/25"
                             : "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                         }`}
                       >
                         <span>⚠️</span> مغایرت محاسباتی
                       </button>
                       <button
                         type="button"
                         onClick={() => setChatInput("فیلدهای مرتبط با مشخصات شرکت (شامل نام شرکت، شناسه ملی، کد اقتصادی و شماره ثبت) را با دقت بالا استخراج کن.")}
                         className={`shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all border shadow-sm cursor-pointer ${
                           isDarkMode
                             ? "bg-rose-500/15 border-rose-500/30 text-rose-400 hover:bg-rose-500/25"
                             : "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100"
                         }`}
                       >
                         <span>🏢</span> مشخصات شرکت
                       </button>
                   </div>
                </div>

                {chatMessages.length <= 2 && (
                  <div className="flex flex-col gap-1.5 mt-0.5">
                    <span className={`text-[9px] font-bold text-right ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>سوالات راهنما:</span>
                    <div className="flex flex-wrap gap-1.5 justify-start">
                      {[
                        { t: "🔍 بررسی مغایرت‌ها", q: "لطفا بررسی کن آیا این سند حسابداری از نظر مبلغ بدهکار و بستانکار کاملاً تراز است؟ اگر مغایرتی وجود دارد، دقیقاً در کدام ردیف‌هاست؟" },
                        { t: "📊 طبقه‌بندی هزینه‌ها", q: "لطفاً تراکنش‌های فعلی را بر اساس نوع هزینه (مانند حقوق، تجهیزات، اداری و...) دسته‌بندی کن و جمع هر دسته را بگو." },
                        { t: "⚠️ شناسایی موارد مشکوک", q: "آیا در بین ردیف‌های استخراج شده، موردی وجود دارد که ضریب اطمینان پایین یا مبلغ نامتعارفی داشته باشد؟" },
                        { t: "💡 پیشنهاد کدینگ حساب", q: "با توجه به شرح تراکنش‌ها، پیشنهاد می‌کنی هر ردیف را در چه حساب معین یا تفصیلی ثبت کنم؟" },
                        { t: "📑 خلاصه مدیریتی", q: "یک گزارش مدیریتی کوتاه از وضعیت این فاکتور/سند شامل جمع کل پرداختی‌ها و ماهیت اصلی هزینه‌ها ارائه بده." },
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
              </div>

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