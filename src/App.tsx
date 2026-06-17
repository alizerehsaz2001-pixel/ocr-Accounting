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
} from "lucide-react";
import { TransactionItem, UploadedFile } from "./types";
import CameraCapture from "./components/CameraCapture";

export default function App() {
  // Main data states
  const [transactions, setTransactions] = useState<TransactionItem[]>(() => {
    const saved = localStorage.getItem("extracted_transactions");
    return saved ? JSON.parse(saved) : [];
  });

  const [activeFile, setActiveFile] = useState<UploadedFile | null>(() => {
    const saved = localStorage.getItem("active_uploaded_file");
    return saved ? JSON.parse(saved) : null;
  });

  // AI Model Selection & Daily Quota States
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    return localStorage.getItem("selected_ai_model") || "gemini-3.5-flash";
  });

  const [modelQuotas, setModelQuotas] = useState<{ [key: string]: { limit: number; used: number } }>(() => {
    const saved = localStorage.getItem("ai_model_quotas");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // use default
      }
    }
    return {
      "gemini-3.5-flash": { limit: 1500, used: 4 },
      "gemini-3.1-pro-preview": { limit: 100, used: 1 },
      "gemini-3.1-flash-lite": { limit: 3000, used: 0 },
      "gemini-2.5-flash-image": { limit: 5000, used: 12 },
    };
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

  // UI state
  const [activeTab, setActiveTab] = useState<"analysis" | "json">("analysis");
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [notification, setNotification] = useState<{
    text: string;
    type: "success" | "error" | "info";
  } | null>(null);

  // Local file input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state to local storage
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

  // Synchronize rawJsonText from transactions when modified by the API extraction
  useEffect(() => {
    if (activeFile && activeFile.status === "success") {
      const cleanJSON = transactions.map((t) => ({
        Date: t.Date,
        Description: t.Description,
        Debit: t.Debit,
        Credit: t.Credit,
        Remarks: t.Remarks,
        ConfidenceScore: t.ConfidenceScore !== undefined && t.ConfidenceScore !== null ? Number(t.ConfidenceScore) : 100,
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
          const MAX_WIDTH = 1600;
          const MAX_HEIGHT = 1600;
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

          // Export as JPEG with 0.82 quality to ensure small size (e.g., <200KB) and crisp OCR resolution
          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.82);
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
        Date: item.Date !== undefined ? item.Date : null,
        Description: item.Description !== undefined ? item.Description : null,
        Debit: item.Debit !== null && !isNaN(Number(item.Debit)) ? Number(item.Debit) : 0,
        Credit: item.Credit !== null && !isNaN(Number(item.Credit)) ? Number(item.Credit) : 0,
        Remarks: item.Remarks !== undefined ? item.Remarks : null,
        ConfidenceScore: item.ConfidenceScore !== undefined && item.ConfidenceScore !== null ? Number(item.ConfidenceScore) : 100,
      }));

      // Set transactions directly to current document extracted rows only
      setTransactions(extractedItems);
      
      setActiveFile({
        ...newFile,
        status: "success",
        results: extractedItems,
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
          Date: item.Date !== undefined ? item.Date : null,
          Description: item.Description !== undefined ? item.Description : null,
          Debit: item.Debit !== undefined && !isNaN(Number(item.Debit)) ? Number(item.Debit) : 0,
          Credit: item.Credit !== undefined && !isNaN(Number(item.Credit)) ? Number(item.Credit) : 0,
          Remarks: item.Remarks !== undefined ? item.Remarks : null,
          ConfidenceScore: item.ConfidenceScore !== undefined && item.ConfidenceScore !== null ? Number(item.ConfidenceScore) : 100,
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
    navigator.clipboard.writeText(rawJsonText);
    showNotification("آرایه به فرمت JSON عینا کپى گردید.", "success");
  };

  const clearCurrentFile = () => {
    setTransactions([]);
    setActiveFile(null);
    setRawJsonText("");
    setJsonError(null);
    showNotification("سند جاری پاک‌سازی شد.", "info");
  };

  return (
    <div
      className="flex h-screen w-full overflow-hidden bg-[#F0F2F5] text-[#1A1A1B] font-sans selection:bg-blue-100 selection:text-blue-900"
      dir="rtl"
    >
      {/* Toast Notifications */}
      {notification && (
        <div
          id="toast-notification"
          className={`fixed top-4 left-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm transition-all animate-bounce ${
            notification.type === "success"
              ? "bg-emerald-50 border-emerald-100 text-emerald-800"
              : notification.type === "error"
              ? "bg-rose-50 border-rose-100 text-rose-800"
              : "bg-blue-50 border-blue-100 text-blue-800"
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
                desc: "پردازش فوق‌سریع و هوشمند فاکتورها.",
                badgeClass: "bg-blue-500/20 text-blue-300",
              },
              {
                id: "gemini-3.1-pro-preview",
                name: "Gemini 3.1 Pro",
                badge: "حسابرس ارشد",
                tokenLimit: "سند تا ۱۰۰MB",
                desc: "استدلال عمیق و مناسب دست‌خط نامنظم.",
                badgeClass: "bg-purple-500/20 text-purple-300",
              },
              {
                id: "gemini-3.1-flash-lite",
                name: "Gemini 3.1 Flash Lite",
                badge: "سرعت آنی",
                tokenLimit: "سند تا ۱۰MB",
                desc: "مقرون‌به‌صرفه‌ترین مفسر برای فاکتورهای تایپی.",
                badgeClass: "bg-emerald-500/20 text-emerald-300",
              },
              {
                id: "gemini-2.5-flash-image",
                name: "Gemini 2.5 Flash",
                badge: "کلاسیک",
                tokenLimit: "سند تا ۵MB",
                desc: "تصویرخوان کلاسیک با عملکرد پایدار.",
                badgeClass: "bg-amber-500/20 text-amber-300",
              },
            ].map((m) => {
              const quota = modelQuotas[m.id] || { limit: 100, used: 0 };
              const remaining = Math.max(0, quota.limit - quota.used);
              const percentUsed = Math.min(100, Math.round((quota.used / quota.limit) * 100));
              const isSelected = selectedModel === m.id;

              return (
                <div
                  key={m.id}
                  onClick={() => setSelectedModel(m.id)}
                  className={`p-3 rounded-xl cursor-pointer transition-all border text-right select-none ${
                    isSelected
                      ? "bg-slate-800 border-blue-500 text-white shadow-md shadow-blue-500/5"
                      : "bg-slate-900/30 border-slate-800 hover:bg-slate-800/40 text-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="text-xs font-bold font-mono text-slate-100">{m.name}</span>
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${m.badgeClass}`}>
                      {m.badge}
                    </span>
                  </div>
                  
                  <p className="text-[10px] text-slate-400 leading-relaxed mb-2.5">
                    {m.desc}
                  </p>

                  <div className="space-y-1.5 border-t border-slate-800/80 pt-2 text-[9px] text-slate-400">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">حداکثر ظرفیت:</span>
                      <span className="font-medium text-slate-300">{m.tokenLimit}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-bold">سهمیه روزانه:</span>
                      <span className="font-mono font-medium text-slate-350" dir="ltr">{quota.limit.toLocaleString("fa-IR")} بار</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">سهم باقی‌مانده:</span>
                      <span className="font-mono font-bold text-emerald-400" dir="ltr">{remaining.toLocaleString("fa-IR")} بار</span>
                    </div>
                  </div>

                  {/* Visual limit bar graph */}
                  <div className="w-full bg-slate-800 rounded-full h-1 mt-2 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        percentUsed > 85 ? "bg-rose-500" : percentUsed > 50 ? "bg-amber-400" : "bg-blue-500"
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
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 text-slate-800 shrink-0 select-none">
          <div className="flex items-center gap-4">
            <h1 className="text-[15px] font-bold text-slate-800 animate-fade-in" dir="ltr">
              ocr Accounting
            </h1>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
              activeFile?.status === "processing" 
                ? "bg-amber-100 text-amber-800 border border-amber-200 animate-pulse" 
                : "bg-blue-100 text-blue-800 border border-blue-200"
            }`}>
              {activeFile?.status === "processing" ? "در حال دریافت و تحلیل هوشمند" : "آماده تفکیک خودکار اسناد"}
            </span>
          </div>

          <div className="flex items-center gap-3">
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
            <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-4 shadow-sm animate-fade-in flex items-start gap-3 mb-6 shrink-0">
              <HelpCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-bold text-xs text-blue-900">رهنمودهای حسابداری هوشمند:</h3>
                <ul className="list-disc list-inside text-[11px] text-blue-800 mt-2 space-y-1">
                  <li>تصویر سند، عکس دست‌نویسی یا فاکتور را آپلود کنید تا بلافاصله به داده ساختاریافته فارسی مطابق اصول حسابداری تبدیل شود.</li>
                  <li>خروجی مستقیما در قالب آرایه JSON با فیلدهای استاندارد حسابداری در اختیار شماست.</li>
                  <li>امکان ویرایش مستقیم ساختار متنی JSON برای اصلاح مقادیر و نگهداری صحت کامل وجود دارد.</li>
                  <li className="font-semibold text-blue-900">توجه: هرچه تصویر ارسال شده باکیفیت‌تر، خوش‌خط‌تر و تمیزتر باشد، نتایج آنالیز و استخراج داده نیز دقیق‌تر و باکیفیت‌تر خواهد بود.</li>
                </ul>
              </div>
              <button onClick={() => setGuideOpen(false)} className="text-blue-500 hover:text-blue-700">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Conditional Layout: Hidden when no file is uploaded! */}
          {!activeFile ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-8 max-w-xl w-full text-center animate-fade-in">
                <div className="rounded-2xl bg-blue-50 p-4 shadow-inner text-blue-600 inline-block mb-4">
                  <UploadCloud className="h-10 w-10" />
                </div>
                <h2 className="text-base font-bold text-slate-800 mb-2">سامانه حسابرسی و استخراج هوشمند اسناد مالی</h2>
                <p className="text-xs text-slate-500 leading-relaxed mb-6">
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
                  <p className="text-xs font-bold text-slate-700">سند یا فاکتور را به اینجا بکشید</p>
                  <p className="text-[10px] text-slate-400 mt-1">با کلیک روی این کادر می‌توانید فایل را از هارد انتخاب کنید</p>
                </div>

                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => setIsCameraOpen(true)}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-800 py-3 text-xs font-semibold text-slate-100 hover:bg-slate-700 transition"
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
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col animate-fade-in">
                  <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <span className="text-[11px] font-bold text-slate-700">سند مالی بارگذاری شده</span>
                    <button
                      onClick={clearCurrentFile}
                      className="text-slate-400 hover:text-slate-600 rounded p-1"
                      title="حذف سند"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="p-4 bg-slate-100 flex items-center justify-center min-h-[220px]">
                    <div className="relative w-full max-h-[300px] overflow-hidden rounded-lg border border-slate-200 flex items-center justify-center bg-white shadow-sm">
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

                  <div className="p-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
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
                <div className="flex bg-slate-200/80 p-1 rounded-xl border border-slate-300/60 w-fit shrink-0 gap-1 select-none">
                  <button
                    onClick={() => setActiveTab("analysis")}
                    className={`px-4 py-2 rounded-lg text-[11px] font-bold transition-all flex items-center gap-2 ${
                      activeTab === "analysis"
                        ? "bg-white text-blue-700 shadow-sm"
                        : "text-slate-600 hover:text-slate-950"
                    }`}
                  >
                    <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
                    <span>بررسی صحت و ضریب اطمینان</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("json")}
                    className={`px-4 py-2 rounded-lg text-[11px] font-bold transition-all flex items-center gap-2 ${
                      activeTab === "json"
                        ? "bg-white text-blue-700 shadow-sm"
                        : "text-slate-600 hover:text-slate-950"
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
                          className="text-[10px] bg-slate-700 text-slate-200 px-3 py-1 rounded-lg hover:bg-slate-600 transition"
                        >
                          کپی متن تفکیک شده
                        </button>
                      )}
                    </div>

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
                  <div className="bg-white rounded-xl border border-slate-200 flex-1 flex flex-col overflow-hidden shadow-sm">
                    {/* Header Summary */}
                    <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap gap-4 items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                          <Sparkles className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-800">تحلیل میزان اطمینان استخراج داده‌ها</h4>
                          <p className="text-[10px] text-slate-500 mt-1">تراکنش‌های فاکتور و فیلدهای تفکیک شده مالی همراه با تخمین میزان خوانایی</p>
                        </div>
                      </div>

                      {activeFile.status === "success" && transactions.length > 0 && (() => {
                        const count = transactions.length;
                        const sumScores = transactions.reduce((acc, current) => acc + (current.ConfidenceScore ?? 100), 0);
                        const avgScore = Math.round(sumScores / count);
                        
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
                          <div className="flex gap-4 items-center">
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
                         <thead className="bg-[#FAFBFD] text-slate-600 text-[10px] uppercase font-bold border-b border-slate-150 sticky top-0 bg-white/95 shadow-sm">
                           <tr>
                             <th className="p-3 text-center border-l border-slate-200">#</th>
                             <th className="p-3 border-l border-slate-200">تاریخ تراکنش</th>
                             <th className="p-3 border-l border-slate-200">شرح / بابت سند</th>
                             <th className="p-3 border-l border-slate-200 text-left">مبلغ بدهکار (ریال)</th>
                             <th className="p-3 border-l border-slate-200 text-left">مبلغ بستانکار (ریال)</th>
                             <th className="p-3 border-l border-slate-200 text-center select-none">میزان اطمینان مفسر</th>
                             <th className="p-3">توضیحات و ملحقات</th>
                           </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-150">
                           {transactions.map((tr, index) => {
                             const score = tr.ConfidenceScore ?? 100;
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
                               <tr key={tr.id || index} className="hover:bg-slate-50/70 transition-colors">
                                 <td className="p-3 text-center font-mono font-bold text-slate-400 border-l border-slate-100">{index + 1}</td>
                                 <td className="p-3 font-mono font-medium text-slate-700 border-l border-slate-100">
                                   {tr.Date || <span className="text-slate-400">[فاقد تاریخ]</span>}
                                 </td>
                                 <td className="p-3 font-semibold text-slate-800 border-l border-slate-100 max-w-[200px] truncate" title={tr.Description || ""}>
                                   {tr.Description || <span className="text-slate-400 font-normal">[بدون شرح]</span>}
                                 </td>
                                 <td className="p-3 border-l border-slate-100 text-left font-mono text-emerald-600 font-semibold">
                                   {tr.Debit !== null && tr.Debit > 0 ? Number(tr.Debit).toLocaleString("fa-IR") : "۰"}
                                 </td>
                                 <td className="p-3 border-l border-slate-100 text-left font-mono text-slate-600 font-semibold">
                                   {tr.Credit !== null && tr.Credit > 0 ? Number(tr.Credit).toLocaleString("fa-IR") : "۰"}
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
                                 <td className="p-3 text-slate-500 max-w-[140px] truncate" title={tr.Remarks || ""}>
                                   {tr.Remarks || <span className="text-slate-300 font-light">-</span>}
                                 </td>
                               </tr>
                             )
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
              <span>هسته مفسর: {
                selectedModel === "gemini-3.5-flash" ? "Gemini 3.5 Flash" :
                selectedModel === "gemini-3.1-pro-preview" ? "Gemini 3.1 Pro" :
                selectedModel === "gemini-3.1-flash-lite" ? "Gemini 3.1 Flash Lite" :
                "Gemini 2.5 Flash"
              }</span>
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
    </div>
  );
}
