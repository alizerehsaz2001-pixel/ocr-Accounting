/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import {
  FileJson,
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
} from "lucide-react";
import { TransactionItem, UploadedFile, PreviousScan } from "./types";
import CameraCapture from "./components/CameraCapture";

export default function App() {
  // Main data states
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("theme") === "dark";
  });

  const [transactions, setTransactions] = useState<TransactionItem[]>(() => {
    const saved = localStorage.getItem("extracted_transactions");
    return saved ? JSON.parse(saved) : [];
  });

  const [activeFile, setActiveFile] = useState<UploadedFile | null>(() => {
    const saved = localStorage.getItem("active_uploaded_file");
    return saved ? JSON.parse(saved) : null;
  });

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
      "gemini-3.1-flash-lite": { limit: 3000, used: 0, lastReset: Date.now() },
      "gemini-2.5-flash-image": { limit: 5000, used: 0, lastReset: Date.now() },
      "gemini-2.5-pro": { limit: 150, used: 0, lastReset: Date.now() },
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
  const [rawJsonText, setRawJsonText] = useState<string>("");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [isJsonVerified, setIsJsonVerified] = useState<boolean>(false);

  // UI state
  const [activeTab, setActiveTab] = useState<"analysis" | "json">("analysis");
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [showTokenDetails, setShowTokenDetails] = useState<boolean>(false);
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

  // Reset verification on file change
  useEffect(() => {
    setIsJsonVerified(false);
  }, [activeFile?.id]);
  const [dragActive, setDragActive] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [isUserPanelOpen, setIsUserPanelOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
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

  // Synchronize rawJsonText from transactions when modified by the API extraction
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
      setRawJsonText(JSON.stringify(cleanJSON, null, 2));
      setJsonError(null);
    } else {
      setRawJsonText("");
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

  // Convert File object to Base64 safely with auto-resizing to prevent payload size limits
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
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
  const processImageForExtraction = async (base64Image: string, fileName: string, fileMimeType: string) => {
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
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "سرور در استخراج داده خطایی ارسال کرد.");
      }

      // Decrement/use quota on successful API response
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

      const extractedItems: TransactionItem[] = result.data.map((item: any, idx: number) => ({
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
      }));

      // Set transactions directly to current document extracted rows only
      setTransactions(extractedItems);
      
      const successFile: UploadedFile = {
        ...newFile,
        status: "success",
        results: extractedItems,
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

      showNotification("داده‌های مالی با موفقیت استخراج و خروجی صادر شد!", "success");
    } catch (err: any) {
      console.error(err);
      const errorMsg = err.message || "برقراری ارتباط با مدل هوش مصنوعی امکان‌پذیر نبود.";
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
      if (!file.type.startsWith("image/")) {
        showNotification("تنها فایل‌های تصویر پشتیبانی می‌شوند.", "error");
        return;
      }
      try {
        const base64 = await convertFileToBase64(file);
        await processImageForExtraction(base64, file.name, "image/jpeg");
      } catch (error) {
        console.error(error);
        showNotification("خطا در پیش‌پردازش فایل تصویر", "error");
      }
    }
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const base64 = await convertFileToBase64(file);
        await processImageForExtraction(base64, file.name, "image/jpeg");
      } catch (error) {
        console.error(error);
        showNotification("خطا در پیش‌پردازش فایل تصویر", "error");
      }
    }
  };

  const handleCameraCapture = async (dataUrl: string) => {
    setIsCameraOpen(false);
    try {
      const parts = dataUrl.split(",");
      const mimeType = parts[0].split(":")[1].split(";")[0];
      const rawBase64 = parts[1];
      processImageForExtraction(rawBase64, `اسکن_دوربین_${Date.now()}.jpg`, mimeType);
    } catch (err) {
      console.error("Camera data URL parsing error:", err);
      showNotification("خطا در خواندن تصویر خروجی دوربین", "error");
    }
  };

  // Direct raw JSON Textarea update validator
  const handleJsonTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    setRawJsonText(newVal);
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
    showNotification("آرایه به فرمت JSON عینا کپی گردید.", "success");
  };

  const clearCurrentFile = () => {
    setTransactions([]);
    setActiveFile(null);
    setRawJsonText("");
    setJsonError(null);
    showNotification("سند جاری پاک‌سازی شد.", "info");
  };

  const selectPreviousScan = (scan: PreviousScan) => {
    setActiveFile(scan.file);
    setTransactions(scan.transactions);
    setRawJsonText(JSON.stringify(scan.transactions, null, 2));
    setJsonError(null);
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

  return (
    <div
      className={`flex h-screen w-full overflow-hidden font-sans selection:bg-blue-100 selection:text-blue-900 transition-colors duration-300 ${
        isDarkMode ? "bg-[#0B0F19] text-[#E2E8F0]" : "bg-[#F0F2F5] text-[#1A1A1B]"
      }`}
      dir="rtl"
    >
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
      <aside className="w-64 bg-[#1E293B] flex-shrink-0 flex flex-col select-none border-l border-slate-700">
        <div className="p-6 flex items-center gap-3 border-b border-slate-700">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold shadow-sm">
            AI
          </div>
          <span className="text-white font-semibold text-base tracking-tight" dir="ltr">ocr Accounting</span>
        </div>

        <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
          <div className="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            دستورات و ابزارها
          </div>
          
          <button
            onClick={() => setGuideOpen(!guideOpen)}
            className={`w-full flex items-center px-4 py-2.5 transition-colors text-right ${
              guideOpen 
                ? "bg-blue-600/20 text-blue-400 border-r-4 border-blue-500 font-medium" 
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <HelpCircle className="h-4 w-4 ml-2.5 shrink-0" />
            <span className="text-xs">راهنمای هوشمند</span>
          </button>

          {activeFile && (
            <button
              onClick={clearCurrentFile}
              className="w-full flex items-center px-4 py-2.5 text-rose-400 hover:bg-slate-800 hover:text-rose-300 transition-colors text-right"
            >
              <Trash2 className="h-4 w-4 ml-2.5 shrink-0" />
              <span className="text-xs">حذف داده و پرونده فعلی</span>
            </button>
          )}

          {/* Recent successful extractions */}
          <div className="px-4 pt-6 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-t border-slate-700/60 mt-4 flex items-center justify-between">
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
                  <div
                    key={scan.id}
                    onClick={() => selectPreviousScan(scan)}
                    className={`group relative flex items-center justify-between p-2 rounded-lg cursor-pointer transition select-none ${
                      isActive
                        ? "bg-blue-600/20 text-blue-300 border-r-4 border-blue-500 font-medium"
                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden min-w-0 flex-1">
                      <FileText className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-blue-400" : "text-slate-500"}`} />
                      <div className="flex flex-col text-right truncate min-w-0">
                        <span className="text-[11px] font-semibold truncate leading-tight" title={scan.file.name}>
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
                      className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-700 rounded transition opacity-0 group-hover:opacity-100 shrink-0 ml-1"
                      title="حذف از تاریخچه"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="px-3 py-4 text-center rounded-lg border border-dashed border-slate-800/20 text-[10px] text-slate-500 italic">
                سندی اخیراً اسکن نشده است.
              </div>
            )}
          </div>

          <div className="px-4 pt-6 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-t border-slate-700/60 mt-4">
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
              {
                id: "gemini-3.1-flash-lite",
                name: "Gemini 3.1 Flash Lite",
                badge: "سرعت آنی",
                tokenLimit: "سند تا ۱۰MB",
                costPerRequest: "حدود ۹۰۰ توکن",
                desc: "مقرون‌به‌صرفه‌ترین مفسر برای فاکتورهای تایپی.",
                badgeClass: "bg-emerald-500/20 text-emerald-300",
              },
              {
                id: "gemini-2.5-flash-image",
                name: "Gemini 2.5 Flash",
                badge: "کلاسیک",
                tokenLimit: "سند تا ۵MB",
                costPerRequest: "حدود ۱,۲۰۰ توکن",
                desc: "تصویرخوان کلاسیک با عملکرد پایدار.",
                badgeClass: "bg-amber-500/20 text-amber-300",
              },
              {
                id: "gemini-2.5-pro",
                name: "Gemini 2.5 Pro",
                badge: "پایدار و دقیق",
                tokenLimit: "سند تا ۳۰MB",
                costPerRequest: "حدود ۱,۶۰۰ توکن",
                desc: "تحلیل محاسباتی و منطقی حسابداری فوق العاده.",
                badgeClass: "bg-rose-500/20 text-rose-300",
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
                <div
                  key={m.id}
                  onClick={() => {
                    if (!isExhausted) setSelectedModel(m.id);
                  }}
                  className={`p-3 rounded-xl transition-all border text-right select-none ${
                    isExhausted
                      ? "bg-rose-950/20 border-rose-900/50 cursor-not-allowed opacity-80"
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
                </div>
              );
            })}
          </div>

          <div className="px-3 py-1 mt-2 pb-6">
            <button
              onClick={() => {
                setModelQuotas({
                  "gemini-3.5-flash": { limit: 1500, used: 0 },
                  "gemini-3.1-pro-preview": { limit: 100, used: 0 },
                  "gemini-3.1-flash-lite": { limit: 3000, used: 0 },
                  "gemini-2.5-flash-image": { limit: 5000, used: 0 },
                  "gemini-2.5-pro": { limit: 150, used: 0 },
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
        <header className={`h-16 border-b flex items-center justify-between px-8 shrink-0 select-none transition-colors duration-300 ${
          isDarkMode ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
        }`}>
          <div className="flex items-center gap-4">
            <h1 className="text-[15px] font-bold animate-fade-in" dir="ltr">
              ocr Accounting
            </h1>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
              activeFile?.status === "processing" 
                ? isDarkMode ? "bg-amber-900/30 text-amber-400 border border-amber-800 animate-pulse" : "bg-amber-100 text-amber-800 border border-amber-200 animate-pulse" 
                : isDarkMode ? "bg-blue-900/40 text-blue-300 border border-blue-800" : "bg-blue-100 text-blue-800 border border-blue-200"
            }`}>
              {activeFile?.status === "processing" ? "در حال دریافت و تحلیل هوشمند" : "آماده تفکیک خودکار اسناد"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {currentUser?.role === "admin" && (
              <button
                onClick={() => setIsAdminPanelOpen(true)}
                className={`p-2 rounded-lg transition-colors border ${
                  isDarkMode ? "bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:border-slate-600" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
                title="پنل مدیریت سامانه"
              >
                <Shield className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={() => setIsUserPanelOpen(true)}
              className={`p-2 rounded-lg transition-colors border ${
                isDarkMode ? "bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:border-slate-600" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
              title="پنل کاربری و API Keys"
            >
              <User className="h-4 w-4" />
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold shadow-sm hover:bg-blue-700 active:scale-95 transition"
            >
              آپلود فایل جدید
            </button>
          </div>
        </header>

        {/* Workspace body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col">
          {guideOpen && (
            <div className={`p-5 shadow-sm animate-fade-in flex flex-col items-start gap-4 mb-6 shrink-0 rounded-xl border transition-colors ${
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
                            مدل‌ها اکنون با دقت فراوان، خطوط تحریری، اداری مخدوش و شکسته نستعلیق ایرانی را می‌خوانند. موتور مجهز به تحلیل بافتاری برای حدس کلمات ادغام‌شده و بازیابی صفرهای پیوسته سریع از طریق مهندسی معکوسِ جمع کل می‌باشد. پیشنهاد می‌شود برای دست‌نویس‌های کور از نسخه 2.5 Pro استفاده نمایید.
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
                <h3 className={`font-bold text-xs mb-3 ${isDarkMode ? "text-blue-100" : "text-blue-900"}`}>راهنمای کاربرد موتورهای هوش مصنوعی (مدل‌های گوگل جمینی):</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[10px]">
                  <div className={`p-2.5 rounded-lg ${isDarkMode ? "bg-slate-900/50 border border-slate-800" : "bg-white/60 border border-blue-100/50"}`}>
                    <strong className="text-blue-500 block mb-1">Gemini 3.5 Flash / Gemini 3.1 Flash Lite</strong>
                    مدل‌های پرسرعت و بهینه‌شده گوگل برای پردازش‌های فوری. مناسب برای استخراج سریع روزمره از فاکتورها و سرافرازی در تحلیل اسناد مالی استاندارد با سرعت بالا.
                  </div>
                  <div className={`p-2.5 rounded-lg ${isDarkMode ? "bg-slate-900/50 border border-slate-800" : "bg-white/60 border border-blue-100/50"}`}>
                    <strong className="text-rose-400 block mb-1">Gemini 2.5 Pro / Gemini 3.1 Pro</strong>
                    قوی‌ترین مدل‌های پردازش منطقی و محاسباتی گوگل. مجهز به زنجیره استدلال فوق‌العاده برای حل جداول حسابداری پیچیده، خوانش دست‌نویس‌های بسیار مخدوش و به حداقل رساندن خطای توهمِ عددی.
                  </div>
                  <div className={`p-2.5 rounded-lg md:col-span-2 ${isDarkMode ? "bg-slate-900/50 border border-slate-800" : "bg-white/60 border border-blue-100/50"}`}>
                    <strong className="text-amber-400 block mb-1">Gemini 2.5 Flash Image</strong>
                    تصویرخوان کلاسیک با عملکرد پایدار و مستحکم جهت پردازش پیکسلی تصاویری که زاویه نامناسب یا نور ضعیف دارند.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Conditional Layout: Hidden when no file is uploaded! */}
          {!activeFile ? (
            <div className="flex-1 flex items-center justify-center">
              <div className={`rounded-2xl shadow-md border p-8 max-w-xl w-full text-center animate-fade-in transition-colors duration-300 ${
                isDarkMode 
                  ? "bg-[#1E293B] border-slate-800 text-slate-100" 
                  : "bg-white border-slate-200 text-slate-800"
              }`}>
                <div className={`rounded-2xl p-4 shadow-inner inline-block mb-4 ${
                  isDarkMode ? "bg-slate-800 text-blue-400" : "bg-blue-50 text-blue-600"
                }`}>
                  <UploadCloud className="h-10 w-10" />
                </div>
                <h2 className={`text-base font-bold mb-2 ${isDarkMode ? "text-slate-100" : "text-slate-800"}`}>سامانه حسابرسی و استخراج هوشمند اسناد مالی</h2>
                <p className={`text-xs leading-relaxed mb-6 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                  تصویر فاکتور، سند دست‌نویس یا دفتر روزنامه خود را آپلود کنید تا هوش مصنوعی پردازش و آرایه منطبق حسابداری JSON را بی‌درنگ تولید نماید.
                </p>

                {/* Main box drop zone integrated */}
                <div
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all ${
                    dragActive
                      ? "border-blue-500 bg-blue-50/30"
                      : isDarkMode
                      ? "border-slate-700 bg-slate-900/40 hover:bg-slate-900/70"
                      : "border-slate-250 bg-slate-50 hover:bg-slate-100"
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={onFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <p className={`text-xs font-bold ${isDarkMode ? "text-slate-200" : "text-slate-700"}`}>سند یا فاکتور را به اینجا بکشید</p>
                  <p className={`text-[10px] mt-1 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>با کلیک روی این کادر می‌توانید فایل را از هارد انتخاب کنید</p>
                </div>

                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => setIsCameraOpen(true)}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-800 py-3 text-xs font-semibold text-slate-100 hover:bg-slate-750 transition"
                  >
                    <Camera className="h-4 w-4 text-blue-400" />
                    اسکن مستقیم با دوربین دستگاه
                  </button>
                </div>
              </div>
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
                    <span className="text-[11px] font-bold">سند مالی بارگذاری شده</span>
                    <button
                      onClick={clearCurrentFile}
                      className="text-slate-400 hover:text-slate-600 rounded p-1"
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
                      <img
                        src={activeFile.preview}
                        alt={activeFile.name}
                        className="max-h-[290px] object-contain"
                      />
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
              </section>

              {/* Column 2: Interactive Tabs - JSON Code vs Visual Audit Analysis */}
              <section className="flex-1 flex flex-col gap-4 overflow-hidden">
                {/* Tab Navigation header */}
                <div className={`flex p-1 rounded-xl border w-fit shrink-0 gap-1 select-none transition-all duration-300 ${
                  isDarkMode 
                    ? "bg-[#1E293B] border-slate-800" 
                    : "bg-slate-200/80 border-slate-300/60"
                }`}>
                  <button
                    onClick={() => setActiveTab("analysis")}
                    className={`px-4 py-2 rounded-lg text-[11px] font-bold transition-all flex items-center gap-2 ${
                      activeTab === "analysis"
                        ? isDarkMode ? "bg-slate-800 text-blue-400 shadow-sm" : "bg-white text-blue-700 shadow-sm"
                        : isDarkMode ? "text-slate-400 hover:text-[#f1f5f9]" : "text-slate-600 hover:text-slate-950"
                    }`}
                  >
                    <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
                    <span>بررسی صحت و ضریب اطمینان</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("json")}
                    className={`px-4 py-2 rounded-lg text-[11px] font-bold transition-all flex items-center gap-2 ${
                      activeTab === "json"
                        ? isDarkMode ? "bg-slate-800 text-blue-400 shadow-sm" : "bg-white text-blue-700 shadow-sm"
                        : isDarkMode ? "text-slate-400 hover:text-[#f1f5f9]" : "text-slate-600 hover:text-slate-950"
                    }`}
                  >
                    <FileJson className="h-4 w-4 text-blue-600" />
                    <span>آرایه خام JSON</span>
                  </button>
                </div>

                {activeTab === "json" ? (
                  /* JSON Tab */
                  <div className="bg-[#1E1E1E] rounded-xl border border-slate-800 flex-1 flex flex-col overflow-hidden font-mono shadow-md">
                    {/* JSON Header Bar */}
                    <div className="px-4 py-2.5 border-b border-slate-700 bg-[#252526] flex justify-between items-center select-none shrink-0">
                      <div className="flex items-center gap-2">
                        <FileJson className="h-4 w-4 text-blue-400" />
                        <span className="text-xs text-slate-200 font-bold tracking-wider">
                          خروجی آرایه JSON منطبق بر سند
                        </span>
                      </div>
                      {activeFile.status === "success" && (
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
                            onChange={(e) => setIsJsonVerified(e.target.checked)}
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
                ) : (
                  /* Visual Audit and Confidence Analysis Tab */
                  <div className={`rounded-xl border flex-1 flex flex-col overflow-hidden shadow-sm transition-all duration-300 ${
                    isDarkMode 
                      ? "bg-[#1E293B] border-slate-800 text-slate-100" 
                      : "bg-white border-slate-200 text-[#1A1A1B]"
                  }`}>
                    {/* Header Summary */}
                    <div className={`p-4 border-b flex flex-wrap gap-4 items-center justify-between transition-colors duration-300 ${
                      isDarkMode ? "bg-[#162032] border-slate-800" : "bg-slate-50 border-slate-200"
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg shrink-0 ${isDarkMode ? "bg-blue-950/40 text-blue-400" : "bg-blue-50 text-blue-600"}`}>
                          <Sparkles className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className={`text-xs font-bold ${isDarkMode ? "text-slate-100" : "text-slate-800"}`}>تحلیل میزان اطمینان استخراج داده‌ها</h4>
                          <p className={`text-[10px] mt-1 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>تراکنش‌های فاکتور و فیلدهای تفکیک شده مالی همراه با تخمین میزان خوانایی</p>
                        </div>
                      </div>

                      {activeFile.status === "success" && transactions.length > 0 && (() => {
                        const count = transactions.length;
                        const sumScores = transactions.reduce((acc, current) => acc + (current.ضریب_اطمینان ?? 100), 0);
                        const avgScore = Math.round(sumScores / count);
                        const countEdited = transactions.filter((tr, idx) => isRowEdited(tr, idx)).length;
                        
                        let ratingLabel = "بسیار بالا و معتبر";
                        let progressColor = "bg-emerald-500";
                        let textColor = "text-emerald-600";
                        if (avgScore < 60) {
                          ratingLabel = "کیفیت ضعیف و مشکوک";
                          progressColor = "bg-rose-500";
                          textColor = "text-rose-600";
                        } else if (avgScore < 85) {
                          ratingLabel = "متوسط و نیازمند بازبینی";
                          progressColor = "bg-amber-500";
                          textColor = "text-amber-600";
                        }

                        return (
                          <div className="flex gap-4 items-center flex-wrap">
                            {countEdited > 0 && (
                              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-center animate-pulse flex items-center gap-2">
                                <FileEdit className="h-4 w-4 text-amber-600" />
                                <div>
                                  <span className="text-[9px] block text-amber-500 font-bold mb-0.5">اصلاح دستی شده</span>
                                  <span className="text-[11px] font-bold text-amber-700 font-mono" dir="ltr">{countEdited.toLocaleString("fa-IR")} ردیف تغییر یافته</span>
                                </div>
                              </div>
                            )}

                            <div className="bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-inner text-center">
                              <span className="text-[9px] block text-slate-400 font-bold mb-0.5">تعداد ردیف‌ها</span>
                              <span className="text-sm font-extrabold text-slate-700 font-mono">{count} ردیف</span>
                            </div>

                            <div className="bg-white border border-slate-150 rounded-xl px-4 py-2 shadow-inner min-w-[140px]">
                              <div className="flex justify-between items-center gap-2 mb-1">
                                <span className="text-[9px] text-slate-400 font-bold">میانگین اطمینان</span>
                                <span className={`text-[10px] font-bold ${textColor}`}>{avgScore}%</span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div className={`h-full ${progressColor}`} style={{ width: `${avgScore}%` }} />
                              </div>
                              <span className="text-[8px] font-bold text-slate-500 block text-center mt-1">{ratingLabel}</span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Table View */}
                    <div className="flex-1 overflow-auto min-h-[300px]">
                      {activeFile.status === "processing" ? (
                        <div className="flex flex-col items-center justify-center p-12 text-slate-400 h-full">
                          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-blue-500 mb-3" />
                          <span className="text-xs">در حال پردازش سند با هوش مصنوعی...</span>
                        </div>
                      ) : transactions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-slate-400 h-full">
                          <AlertCircle className="h-8 w-8 text-slate-300 mb-3 animate-bounce" />
                          <span className="text-xs">داده‌ای یافت نشد. فایلی با کیفیت مناسب آپلود نمایید.</span>
                        </div>
                      ) : (
                        <table className="w-full text-right border-collapse text-xs">
                          <thead className={`text-[10px] uppercase font-bold sticky top-0 shadow-sm transition-colors duration-300 ${
                            isDarkMode 
                              ? "bg-[#1E293B] border-b border-slate-800 text-slate-200 bg-opacity-95" 
                              : "bg-[#FAFBFD] text-slate-600 border-b border-slate-150 bg-white/95"
                          }`}>
                            <tr>
                              <th className={`p-3 text-center border-l ${isDarkMode ? "border-slate-800" : "border-slate-200"}`}>#</th>
                              <th className={`p-3 border-l ${isDarkMode ? "border-slate-800" : "border-slate-200"}`}>تاریخ</th>
                              <th className={`p-3 border-l ${isDarkMode ? "border-slate-800" : "border-slate-200"}`}>شماره سند</th>
                              <th className={`p-3 border-l ${isDarkMode ? "border-slate-800" : "border-slate-200"}`}>طرف حساب</th>
                              <th className={`p-3 border-l ${isDarkMode ? "border-slate-800" : "border-slate-200"}`}>شرح / بابت</th>
                              <th className={`p-3 text-left border-l ${isDarkMode ? "border-slate-800" : "border-slate-200"}`}>بدهکار</th>
                              <th className={`p-3 text-left border-l ${isDarkMode ? "border-slate-800" : "border-slate-200"}`}>بستانکار</th>
                              <th className={`p-3 text-center border-l ${isDarkMode ? "border-slate-800" : "border-slate-200"}`}>ارز</th>
                              <th className={`p-3 text-center border-l ${isDarkMode ? "border-slate-800" : "border-slate-200"} select-none`}>دقت استخراج</th>
                              <th className="p-3">توضیحات تکمیلی</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-150">
                            {transactions.map((tr, index) => {
                              const score = tr.ضریب_اطمینان ?? 100;
                              const isEdited = isRowEdited(tr, index);
                              let badgeBg = "bg-emerald-50 border-emerald-200 text-emerald-800";
                              let progressBg = "bg-emerald-500";
                              let scoreDesc = "عالی / بدون ابهام";
                              if (score < 60) {
                                badgeBg = "bg-rose-50 border-rose-200 text-rose-800";
                                progressBg = "bg-rose-500";
                                scoreDesc = "ناخوانا / نامعتبر";
                              } else if (score < 85) {
                                badgeBg = "bg-amber-50 border-amber-200 text-amber-800";
                                progressBg = "bg-amber-550";
                                scoreDesc = "دست‌نویس مخدوش";
                              }

                              return (
                                <tr
                                  key={tr.id || index}
                                  className={`transition-colors ${
                                    isEdited
                                      ? "bg-amber-50/70 border-r-4 border-r-amber-500 hover:bg-amber-100/60"
                                      : "hover:bg-slate-50/70"
                                  }`}
                                >
                                  <td className="p-3 text-center border-l border-slate-100">
                                    <div className="flex items-center justify-center gap-1.5 font-mono font-bold text-slate-450">
                                      <span>{index + 1}</span>
                                      {isEdited && (
                                        <span
                                          className="p-1 bg-amber-500 text-white rounded shadow-sm"
                                          title="تغییر یافته توسط کاربر (ویرایش دستی)"
                                        >
                                          <FileEdit className="h-3 w-3" />
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="p-3 font-mono font-medium text-slate-700 border-l border-slate-100 max-w-[120px] truncate" title={tr.تاریخ || ""}>
                                    {tr.تاریخ || <span className="text-slate-400">[فاقد تاریخ]</span>}
                                  </td>
                                  <td className="p-3 font-mono text-slate-700 border-l border-slate-100 max-w-[100px] truncate" title={tr.شماره_سند || ""}>
                                    {tr.شماره_سند || <span className="text-slate-400">-</span>}
                                  </td>
                                  <td className="p-3 font-semibold text-slate-800 border-l border-slate-100 max-w-[140px] truncate" title={tr.نام_طرف_حساب || ""}>
                                    {tr.نام_طرف_حساب || <span className="text-slate-400">-</span>}
                                  </td>
                                  <td className="p-3 text-slate-800 border-l border-slate-100 max-w-[180px] truncate" title={tr.شرح || ""}>
                                    {tr.شرح || <span className="text-slate-400 font-normal">[بدون شرح]</span>}
                                  </td>
                                  <td className="p-3 border-l border-slate-100 text-left font-mono text-emerald-600 font-semibold">
                                    {tr.مبلغ_بدهکار !== null && tr.مبلغ_بدهکار > 0 ? Number(tr.مبلغ_بدهکار).toLocaleString("fa-IR") : "۰"}
                                  </td>
                                  <td className="p-3 border-l border-slate-100 text-left font-mono text-slate-600 font-semibold">
                                    {tr.مبلغ_بستانکار !== null && tr.مبلغ_بستانکار > 0 ? Number(tr.مبلغ_بستانکار).toLocaleString("fa-IR") : "۰"}
                                  </td>
                                  <td className="p-3 border-l border-slate-100 text-center font-semibold text-[10px]">
                                    {tr.نوع_ارز || <span className="text-slate-400">-</span>}
                                  </td>
                                  <td className="p-3 border-l border-slate-100 text-center select-none">
                                    <div className="flex flex-col items-center justify-center min-w-[70px] gap-1 mx-auto">
                                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeBg}`}>
                                        {score}%
                                      </span>
                                      <div className="w-12 bg-slate-150 rounded-full h-1 overflow-hidden shrink-0">
                                        <div className={`h-full ${progressBg}`} style={{ width: `${score}%` }} />
                                      </div>
                                      <span className="text-[7.5px] text-slate-400 font-extrabold block shrink-0">{scoreDesc}</span>
                                    </div>
                                  </td>
                                  <td className="p-3 text-slate-500 max-w-[140px] truncate" title={tr.توضیحات || ""}>
                                    {tr.توضیحات || <span className="text-slate-300 font-light">-</span>}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                )}
              </section>
            </div>
          )}
        </div>

        {/* System safety warning & footer */}
        <footer className="h-auto min-h-[36px] py-2 bg-slate-800 text-slate-400 flex flex-col items-center justify-center px-6 text-[10px] select-none shrink-0">
          <div className="flex w-full justify-between pb-1.5 mb-1 border-b border-slate-700 max-w-7xl">
            <div className="flex gap-4">
              <span>سیستم: آنلاین و امن</span>
              <span>هسته مفسر: {
                selectedModel === "gemini-3.5-flash" ? "Gemini 3.5 Flash" :
                selectedModel === "gemini-3.1-pro-preview" ? "Gemini 3.1 Pro" :
                selectedModel === "gemini-3.1-flash-lite" ? "Gemini 3.1 Flash Lite" :
                selectedModel === "gemini-2.5-pro" ? "Gemini 2.5 Pro" :
                "Gemini 2.5 Flash"
              }</span>
              {activeFile?.status === "success" && (
                <div className="flex items-center gap-2">
                  <span className="text-amber-400 font-mono">
                    توکن مصرفی خالص سند: {(() => {
                      const total = activeFile.tokensUsed || 0;
                      const cached = activeFile.tokenDetails?.cachedContentTokenCount || 0;
                      return Math.max(0, total - cached).toLocaleString("fa-IR");
                    })()} توکن
                    <span className="text-[10px] text-slate-500 mr-1">
                      (کل تبادلی: {(activeFile.tokensUsed || 0).toLocaleString("fa-IR")})
                    </span>
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
              const totalTokens = activeFile.tokenDetails?.totalTokenCount || activeFile.tokensUsed || (
                selectedModel === "gemini-3.1-pro-preview" ? 1800 :
                selectedModel === "gemini-2.5-pro" ? 1600 :
                selectedModel === "gemini-3.5-flash" ? 1200 :
                selectedModel === "gemini-3.1-flash-lite" ? 900 :
                1200
              );
              const promptTokens = activeFile.tokenDetails?.promptTokenCount || Math.round(totalTokens * 0.82);
              const candidateTokens = activeFile.tokenDetails?.candidatesTokenCount || (totalTokens - promptTokens);
              const cachedTokens = activeFile.tokenDetails?.cachedContentTokenCount || 0;
              const netTokens = Math.max(0, totalTokens - cachedTokens);

              return (
                <div className="space-y-3 font-mono text-sm">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-400">توکن‌های ورودی (تصویر و پرامپت):</span>
                    <span className="text-blue-400 font-bold">{promptTokens.toLocaleString("fa-IR")}</span>
                  </div>
                  {cachedTokens > 0 && (
                    <div className="flex justify-between items-center py-1 text-[11px] text-purple-300 pr-2">
                      <span>↳ کسر می‌شود (توکن‌های کش شده):</span>
                      <span className="font-bold">-{cachedTokens.toLocaleString("fa-IR")}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-1 border-t border-slate-850/50">
                    <span className="text-slate-400">توکن‌های خروجی (پاسخ استخراجی):</span>
                    <span className="text-emerald-400 font-bold">{candidateTokens.toLocaleString("fa-IR")}</span>
                  </div>
                  
                  <div className="flex flex-col gap-1 p-3 mt-2 rounded bg-purple-950/20 border border-purple-900/40">
                    <div className="flex justify-between items-center">
                      <span className="text-purple-300 font-bold text-xs">توکن‌های خالص پردازشی (مبنای هزینه):</span>
                      <span className="text-purple-400 font-bold text-base">{netTokens.toLocaleString("fa-IR")}</span>
                    </div>
                    <span className="text-[9px] text-slate-500 text-right leading-normal block font-sans">
                      * توکن‌های کش مربوط به دستورالعمل‌های طولانی سیستم بوده و از فاکتور هزینه حذف شده‌اند.
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1 px-1 text-[11px] text-slate-500 border-t border-slate-800/40">
                    <span>مجموع حجم تبادلی مدل:</span>
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
                        const escapeCsv = (str: any) => {
                          if (str == null) return "";
                          const s = String(str);
                          if (s.includes(",") || s.includes('"') || s.includes("\n")) {
                            return '"' + s.replace(/"/g, '""') + '"';
                          }
                          return s;
                        };
                        const csvHeader = "\uFEFF" + "ردیف,تاریخ,شماره_سند,نام_طرف_حساب,شرح,مبلغ_بدهکار,مبلغ_بستانکار,نوع_ارز,توضیحات,ضریب_اطمینان\n";
                        const csvRows = transactions.map((t, idx) => 
                          `${idx + 1},${escapeCsv(t.تاریخ)},${escapeCsv(t.شماره_سند)},${escapeCsv(t.نام_طرف_حساب)},${escapeCsv(t.شرح)},${t.مبلغ_بدهکار || 0},${t.مبلغ_بستانکار || 0},${escapeCsv(t.نوع_ارز)},${escapeCsv(t.توضیحات)},${t.ضریب_اطمینان || 100}`
                        ).join("\n");
                        const blob = new Blob([csvHeader + csvRows], { type: "text/csv;charset=utf-8;" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `CSV-Export-${new Date().toISOString().split('T')[0]}.csv`;
                        a.click();
                        URL.revokeObjectURL(url);
                        setNotification({ text: "فایل CSV با موفقیت اکسپورت شد.", type: "success" });
                      }}
                      className={`w-full py-1.5 rounded-lg text-[11px] font-bold transition border flex items-center justify-center gap-2 mt-1 ${
                        isDarkMode ? "bg-emerald-900/30 border-emerald-800/50 text-emerald-300 hover:bg-emerald-900/50" : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                      }`}
                    >
                      <Download className="h-3 w-3" />
                      خروجی مستقیم اکسل (CSV) از تراکنش‌های فعلی
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
                  <Settings className="h-4 w-4" />
                  مدیریت سهمیه‌ها و محدودیت‌ها
                </h4>
                <div className={`p-4 rounded-xl border ${isDarkMode ? "bg-slate-800/40 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                  <p className={`text-xs mb-3 ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
                    در صورت تجاوز از محدودیت مصرف روزانه API، می‌توانید سهمیه محاسبه شده سیستم را به صورت دستی بازنشانی کنید تا امکان ارسال ریکوئست مجدد فراهم شود.
                  </p>
                  <button
                    onClick={() => {
                      setModelQuotas({
                        "gemini-3.5-flash": { limit: 1500, used: 0, lastReset: Date.now() },
                        "gemini-3.1-pro-preview": { limit: 100, used: 0, lastReset: Date.now() },
                        "gemini-3.1-flash-lite": { limit: 3000, used: 0, lastReset: Date.now() },
                        "gemini-2.5-flash-image": { limit: 5000, used: 0, lastReset: Date.now() },
                        "gemini-2.5-pro": { limit: 150, used: 0, lastReset: Date.now() },
                      });
                      setNotification({ text: "سهمیه مدل‌ها با موفقیت ریست شد.", type: "success" });
                    }}
                    className={`w-full py-2 rounded-lg text-xs font-bold transition border ${
                      isDarkMode ? "border-slate-600 text-slate-300 hover:bg-slate-700" : "border-slate-300 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    ریست توکن‌های مصرفی (بازنشانی Quota)
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
    </div>
  );
}
