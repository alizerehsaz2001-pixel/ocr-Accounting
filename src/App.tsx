/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import {
  FileSpreadsheet,
  FileJson,
  Printer,
  PlusCircle,
  Trash2,
  UploadCloud,
  X,
  Sparkles,
  Camera,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RotateCcw,
  Search,
  ArrowRightLeft,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { TransactionItem, UploadedFile } from "./types";
import CameraCapture from "./components/CameraCapture";

// Real-world Farsi sample ledger to help users get started quickly with the interface
const INITIAL_SAMPLE_DATA: TransactionItem[] = [];

// Farsi support helpers
const persianNumbers = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
const convertToPersianDigits = (num: number | string | null): string => {
  if (num === null || num === undefined) return "";
  return num
    .toString()
    .replace(/[0-9]/g, (w) => persianNumbers[parseInt(w, 10)]);
};

// Beautiful currency formatter for Farsi accounting layout
const formatCurrency = (amount: number | null): string => {
  if (amount === null || amount === undefined) return "۰";
  const numString = Math.abs(amount).toLocaleString("en-US");
  return convertToPersianDigits(numString);
};

export default function App() {
  // Main data state
  const [transactions, setTransactions] = useState<TransactionItem[]>(() => {
    const saved = localStorage.getItem("extracted_transactions");
    return saved ? JSON.parse(saved) : INITIAL_SAMPLE_DATA;
  });

  const [activeFile, setActiveFile] = useState<UploadedFile | null>(() => {
    const saved = localStorage.getItem("active_uploaded_file");
    return saved ? JSON.parse(saved) : null;
  });

  // UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [notification, setNotification] = useState<{
    text: string;
    type: "success" | "error" | "info";
  } | null>(null);

  // Filter & sorting states
  const [sortField, setSortField] = useState<keyof TransactionItem>("id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Local file input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync to local storage
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

  // Convert File object to Base64 safely
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Strip out metadata prefix (e.g., 'data:image/jpeg;base64,') to send raw base64 to server
        const base64Data = result.split(",")[1];
        resolve(base64Data);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // Main processing pipeline
  const processImageForExtraction = async (base64Image: string, fileName: string, fileMimeType: string) => {
    setIsProcessing(true);
    showNotification("در حال ارسال تصویر به هوش مصنوعی حسابدار و استخراج ردیف‌های مالی...", "info");

    const newFile: UploadedFile = {
      id: `file-${Date.now()}`,
      name: fileName,
      size: Math.round((base64Image.length * 3) / 4), // Approximate bytes from base64 length
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
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "سرور در استخراج داده خطایی ارسال کرد.");
      }

      const extractedItems: TransactionItem[] = result.data.map((item: any, idx: number) => ({
        id: `extracted-${Date.now()}-${idx}`,
        Date: item.Date !== undefined ? item.Date : null,
        Description: item.Description !== undefined ? item.Description : null,
        // Ensure values are parsed strictly as numbers
        Debit: item.Debit !== null && !isNaN(Number(item.Debit)) ? Number(item.Debit) : 0,
        Credit: item.Credit !== null && !isNaN(Number(item.Credit)) ? Number(item.Credit) : 0,
        Remarks: item.Remarks !== undefined ? item.Remarks : null,
      }));

      // Merge extracted items or replace current ledger based on selection
      if (extractedItems.length === 0) {
        showNotification("هوش مصنوعی هیچ داده تراکنشی در این تصویر شناسایی نکرد. می‌توانید به صورت دستی ردیف اضافه کنید.", "info");
      } else {
        setTransactions((prev) => [...extractedItems, ...prev]);
        showNotification(`تعداد ${extractedItems.length} تراکنش با موفقیت به انتهای جدول اضافه شدند!`, "success");
      }

      setActiveFile({
        ...newFile,
        status: "success",
        results: extractedItems,
      });
    } catch (err: any) {
      console.error(err);
      const errorMsg = err.message || "برقراری ارتباط با مدل هوش مصنوعی امکان‌پذیر نبود.";
      showNotification(errorMsg, "error");
      setActiveFile({
        ...newFile,
        status: "error",
        error: errorMsg,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Upload actions handles
  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      showNotification("لطفاً فقط فایل‌های تصویری معتبر (JPG, PNG و غیره) آپلود نمایید.", "error");
      return;
    }
    try {
      const base64 = await convertFileToBase64(file);
      await processImageForExtraction(base64, file.name, file.type);
    } catch (error) {
      console.error(error);
      showNotification("خطا در پیش‌پردازش فایل تصویر", "error");
    }
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(true);
  };

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  // Camera scan capture confirm action
  const handleCameraCapture = (base64Data: string) => {
    setIsCameraOpen(false);
    // Strip pure mime type
    const mimeMatch = base64Data.match(/^data:(image\/[a-z]+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
    const rawBase64 = base64Data.replace(/^data:image\/[a-z]+;base64,/, "");
    processImageForExtraction(rawBase64, `اسکن_دوربین_${Date.now()}.jpg`, mimeType);
  };

  // Table direct operations (add, delete, inline edit)
  const addManualRow = () => {
    const newRow: TransactionItem = {
      id: `manual-${Date.now()}`,
      Date: convertToPersianDigits(new Date().toLocaleDateString("fa-IR")),
      Description: "شرح سند جدید",
      Debit: 0,
      Credit: 0,
      Remarks: "",
    };
    setTransactions((prev) => [newRow, ...prev]);
    showNotification("یک ردیف خالی حسابداری به بالای جدول اضافه شد.", "info");
  };

  const deleteRow = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    showNotification("ردیف مالی مربوطه حذف شد.", "info");
  };

  const handleCellEdit = (id: string, field: keyof TransactionItem, value: any) => {
    setTransactions((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          let parsedValue = value;
          // Parse values safely for numeric accounting sums
          if (field === "Debit" || field === "Credit") {
            // Replace both English/Persian commas and keep raw integers
            const cleaned = String(value).replace(/[\u0660-\u0669\u06F0-\u06F9]/g, (d) => {
              return String(d.charCodeAt(0) & 15);
            }).replace(/[^0-9]/g, "");
            parsedValue = cleaned === "" ? 0 : Number(cleaned);
          }
          return { ...t, [field]: parsedValue };
        }
        return t;
      })
    );
  };

  // Bulk state actions
  const clearAllTransactions = () => {
    if (window.confirm("آیا از پاک‌سازی کامل جدول تراکنش‌ها و اسناد جاری اطمینان دارید؟ این عمل غیر قابل بازگشت است.")) {
      setTransactions([]);
      setActiveFile(null);
      showNotification("کلیه سند حسابداری پاک‌سازی شد.", "info");
    }
  };

  const resetToSampleData = () => {
    if (window.confirm("آیا مایلید جدول را با تراکنش‌های آماده نمونه پر کنید؟ داده‌های در حال ویرایش شما بازنشانی می‌شوند.")) {
      setTransactions(INITIAL_SAMPLE_DATA);
      setActiveFile(null);
      showNotification("جدول نمونه مالی مجدداً بارگذاری شد.", "success");
    }
  };

  // Exports data format configurations
  const exportToCSV = () => {
    if (transactions.length === 0) {
      showNotification("جدول شما خالی است؛ موردی برای خروجی وجود ندارد.", "error");
      return;
    }

    // Standard CSV parsing with Excel double quote protection
    const headers = ["تاریخ", "شرح تراکنش", "بدهکار (Debit)", "بستانکار (Credit)", "توضیحات / کد پیگیری"];
    const rows = transactions.map((t) => [
      t.Date || "",
      t.Description || "",
      t.Debit || 0,
      t.Credit || 0,
      t.Remarks || "",
    ]);

    // Format content with double-quotes for safety (handles inline Persian commas gracefully)
    const csvContent =
      [headers.join(","), ...rows.map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");

    // Prepend UTF-8 Byte Order Mark (BOM) to ensure absolute alignment compatibility inside Microsoft Excel
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `گزارش_استخراج_مالی_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification("خروجی معتبر اکسل / CSV با موفقیت دانلود شد.", "success");
  };

  const exportToJSON = () => {
    // Generate actual English key JSON array with Persian values as requested
    const exportData = transactions.map((t) => ({
      Date: t.Date,
      Description: t.Description,
      Debit: t.Debit,
      Credit: t.Credit,
      Remarks: t.Remarks,
    }));

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `data_extraction_array_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification("فایل داده آرایه معتبر JSON دانلود شد.", "success");
  };

  const copyJSONToClipboard = () => {
    const cleanJSONData = transactions.map((t) => ({
      Date: t.Date,
      Description: t.Description,
      Debit: t.Debit,
      Credit: t.Credit,
      Remarks: t.Remarks,
    }));

    navigator.clipboard.writeText(JSON.stringify(cleanJSONData, null, 2));
    showNotification("آرایه به فرمت JSON در حافظه موقت کپی گردید.", "success");
  };

  // Sorting helper
  const triggerSort = (field: keyof TransactionItem) => {
    const isAsc = sortField === field && sortOrder === "asc";
    const order = isAsc ? "desc" : "asc";
    setSortField(field);
    setSortOrder(order);

    const sorted = [...transactions].sort((a, b) => {
      let valA = a[field];
      let valB = b[field];

      if (valA === null || valA === undefined) valA = "";
      if (valB === null || valB === undefined) valB = "";

      if (typeof valA === "number" && typeof valB === "number") {
        return order === "asc" ? valA - valB : valB - valA;
      }

      return order === "asc"
        ? String(valA).localeCompare(String(valB), "fa")
        : String(valB).localeCompare(String(valA), "fa");
    });

    setTransactions(sorted);
  };

  const handlePrint = () => {
    window.print();
  };

  // Live filtered records
  const filteredTransactions = transactions.filter((t) => {
    const q = searchQuery.toLowerCase();
    return (
      (t.Description && t.Description.toLowerCase().includes(q)) ||
      (t.Remarks && t.Remarks.toLowerCase().includes(q)) ||
      (t.Date && t.Date.includes(q))
    );
  });

  return (
    <div
      className="flex h-screen w-full overflow-hidden bg-[#F0F2F5] text-[#1A1A1B] font-sans selection:bg-blue-100 selection:text-blue-900"
      dir="rtl"
    >
      {/* Dynamic Flash Notifications */}
      {notification && (
        <div
          className={`fixed top-4 left-4 z-50 flex items-center gap-3 rounded-xl px-5 py-3.5 shadow-xl border backdrop-blur-md transition-all duration-300 animate-slide-in ${
            notification.type === "success"
              ? "bg-emerald-50/95 border-emerald-200 text-emerald-800"
              : notification.type === "error"
              ? "bg-rose-50/95 border-rose-200 text-rose-800"
              : "bg-blue-50/95 border-blue-200 text-blue-800"
          }`}
          id="system-notification"
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
          ) : notification.type === "error" ? (
            <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
          ) : (
            <Sparkles className="h-5 w-5 text-blue-500 shrink-0" />
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

      {/* Right Sidebar - ERP Style for High Density */}
      <aside className="w-64 bg-[#1E293B] flex-shrink-0 flex flex-col print:hidden select-none border-l border-slate-700">
        {/* Sidebar Brand Logo */}
        <div className="p-6 flex items-center gap-3 border-b border-slate-700">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold shadow-sm">
            AI
          </div>
          <span className="text-white font-semibold text-base tracking-tight">حسابدار هوشمند</span>
        </div>

        {/* Sidebar Nav Actions */}
        <nav className="flex-1 py-4 space-y-1">
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

          <button
            onClick={clearAllTransactions}
            className="w-full flex items-center px-4 py-2.5 text-rose-400 hover:bg-slate-800 hover:text-rose-300 transition-colors text-right"
          >
            <Trash2 className="h-4 w-4 ml-2.5 shrink-0" />
            <span className="text-xs">حذف کل جدول</span>
          </button>
        </nav>
      </aside>

      {/* Main Container Workspace Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header toolbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 text-slate-800 shrink-0 print:hidden select-none">
          <div className="flex items-center gap-4">
            <h1 className="text-[15px] font-bold text-slate-800">
              استخراج، تحلیل و ثبت داده‌های فاکتور و اسناد مالی
            </h1>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
              activeFile?.status === "processing" 
                ? "bg-amber-100 text-amber-800 border border-amber-200 animate-pulse" 
                : "bg-blue-100 text-blue-800 border border-blue-200"
            }`}>
              {activeFile?.status === "processing" ? "در حال استخراج هبستوی" : "آماده بارگذاری اسناد"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold shadow-sm hover:bg-blue-700 active:scale-95 transition"
            >
              آپلود تصویر جدید
            </button>
          </div>
        </header>

        {/* Scrollable grid area splits into preview vs results */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col lg:flex-row gap-6">
          {/* Right Column (visual left): Image Upload, Scan and live file status */}
          <section className="w-full lg:w-[40%] flex flex-col gap-6 shrink-0 print:hidden">
            {/* Visual Upload Guide Box */}
            <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5">
              <h2 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-600" />
                درگاه بارگذاری تصاویر اسناد
              </h2>

              {/* Box Drop Zone */}
              <div
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all ${
                  dragActive
                    ? "border-blue-500 bg-blue-50/30"
                    : "border-slate-200 bg-slate-50/50 hover:bg-slate-50"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={onFileChange}
                  accept="image/*"
                  className="hidden"
                />
                <div className="rounded-xl bg-white p-3 shadow-xs text-blue-600 border border-slate-100">
                  <UploadCloud className="h-5 w-5" />
                </div>
                <p className="mt-3 text-xs font-semibold text-slate-800">
                  سند یا فاکتور را به اینجا بکشید
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  یا جهت جستجو در سیستم کلیک نمایید
                </p>
                <div className="mt-4 flex items-center justify-center gap-1.5 text-[9px] bg-slate-100 text-slate-500 px-2.5 py-1 rounded-md border border-slate-200/50">
                  <span>فرمت‌های مورد پشتیبانی: PNG, JPG, GIF</span>
                </div>
              </div>

              {/* Alternate direct camera trigger */}
              <button
                onClick={() => setIsCameraOpen(true)}
                className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-800 py-2.5 text-xs font-semibold text-slate-100 hover:bg-slate-700 active:scale-95 transition"
              >
                <Camera className="h-3.5 w-3.5 text-blue-400" />
                اسکن مستقیم با دوربین دستگاه
              </button>
            </div>

            {/* Selected Active image view container */}
            {activeFile && (
              <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden flex flex-col animate-fade-in">
                <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <span className="text-[11px] font-bold text-slate-700">مدرک فعلی در حال نمایش</span>
                  <div className="flex items-center gap-2">
                    {activeFile.status === "processing" && (
                      <span className="text-[9px] font-semibold bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-full animate-pulse">
                        هوش مصنوعی فعال است...
                      </span>
                    )}
                    <button
                      onClick={() => setActiveFile(null)}
                      className="text-slate-400 hover:text-slate-600 rounded"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-slate-100 flex items-center justify-center min-h-[220px]">
                  <div className="relative w-full max-h-[260px] overflow-hidden rounded-lg border border-slate-200 flex items-center justify-center bg-white shadow-sm">
                    <img
                      src={activeFile.preview}
                      alt={activeFile.name}
                      className="max-h-[250px] object-contain"
                    />
                    {activeFile.status === "processing" && (
                      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[1px] flex flex-col items-center justify-center text-white p-4 select-none">
                        <div className="h-7 w-7 animate-spin rounded-full border-2 border-white border-t-blue-500 mb-2" />
                        <span className="text-[10px] text-center font-medium opacity-90 max-w-[180px]">
                          در حال بررسی سطرها و مبالغ بدهکار/بستانکار
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                  <span className="truncate max-w-[160px]">فایل: {activeFile.name}</span>
                  <span>حجم: {Math.round(activeFile.size / 1024)} KB</span>
                </div>

                {activeFile.status === "error" && (
                  <div className="m-3 p-3 bg-rose-50 border border-rose-100 rounded-xl text-[11px] text-rose-700">
                     <strong>مشکل در پردازش:</strong> {activeFile.error}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Left Column (visual right): Live Editable Balance Grid Sheet & Output panels */}
          <section className="flex-1 flex flex-col gap-6 overflow-hidden">
            {/* Guide message block - conditional show */}
            {guideOpen && (
              <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-4 shadow-xs animate-fade-in print:hidden flex items-start gap-3">
                <HelpCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-bold text-xs text-blue-900">چگونه کار با این سامانه را آغاز کنید؟</h3>
                  <ul className="list-disc list-inside text-[11px] text-blue-800 mt-2 space-y-1">
                    <li>یک سند، فاکتور دست‌نویس یا پیوند دفتری اسکن کنید یا روی دوربین بزنید.</li>
                    <li>سیستم داده‌ها را تفکیک و در خانه‌های جدول پایین درج می‌نماید.</li>
                    <li>خانه‌های سطرها به خوبی با کلیک مستقیم قابل بازنویسی و تغییر فوری هستند.</li>
                  </ul>
                </div>
                <button onClick={() => setGuideOpen(false)} className="text-blue-500 hover:text-blue-700">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}


            {/* Extracted main spreadsheet panel  */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs flex-1 flex flex-col overflow-hidden">
              {/* Content Action/Header bar */}
              <div className="p-3 border-b border-slate-100 bg-slate-50/60 flex flex-col md:flex-row items-center justify-between gap-3 shrink-0 print:hidden select-none">
                <div className="relative w-full md:w-60">
                  <Search className="h-3.5 w-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="فیلتر لحظه‌ای نتایج..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg pr-8 pl-3 py-1.5 text-xs text-slate-800 outline-none focus:border-blue-500"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1.5 justify-end w-full md:w-auto">
                  <button
                    onClick={exportToCSV}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                    title="Excel format"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                    خروجی اکسل
                  </button>
                  <button
                    onClick={exportToJSON}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    <FileJson className="h-3.5 w-3.5 text-blue-600" />
                    خروجی JSON
                  </button>
                  <button
                    onClick={handlePrint}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    <Printer className="h-3.5 w-3.5 text-slate-500" />
                    چاپ سند
                  </button>
                </div>
              </div>

              {/* Data list grid layout */}
              <div className="flex-1 overflow-auto">
                <table className="w-full text-right border-collapse text-[11px]">
                  <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10 select-none">
                    <tr>
                      <th className="p-3 w-[110px] border-b border-slate-200">
                        <button
                          onClick={() => triggerSort("Date")}
                          className="hover:text-slate-800 inline-flex items-center gap-1 font-bold text-slate-600"
                        >
                          تاریخ تراکنش
                          {sortField === "Date" && (sortOrder === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                        </button>
                      </th>
                      <th className="p-3 border-b border-slate-200 text-slate-600 font-bold">شرح یا بابت تراکنش سند مالی</th>
                      <th className="p-3 w-[120px] border-b border-slate-200">
                        <button
                          onClick={() => triggerSort("Debit")}
                          className="hover:text-slate-800 inline-flex items-center gap-1 font-bold text-slate-600"
                        >
                          بدهکار (Debit)
                          {sortField === "Debit" && (sortOrder === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                        </button>
                      </th>
                      <th className="p-3 w-[120px] border-b border-slate-200">
                        <button
                          onClick={() => triggerSort("Credit")}
                          className="hover:text-slate-800 inline-flex items-center gap-1 font-bold text-slate-600"
                        >
                          بستانکار (Credit)
                          {sortField === "Credit" && (sortOrder === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                        </button>
                      </th>
                      <th className="p-3 w-[140px] border-b border-slate-200 text-slate-600 font-bold">ملحقات / کد مدرک</th>
                      <th className="p-3 w-[45px] text-center border-b border-slate-200 print:hidden select-none">حذف</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          <div className="flex flex-col items-center justify-center p-4">
                            <AlertCircle className="h-8 w-8 text-slate-300 mb-2" />
                            <p className="text-xs font-semibold">هیچ ردیف حسابداری منطبق بر فیلتر شما یافت نشد.</p>
                            <p className="text-[10px] text-slate-400 mt-1">
                              یک تصویر جدید بارگذاری کنید یا ردیف فرضی اضافه نمایید.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map((t) => (
                        <tr key={t.id} className="hover:bg-blue-50/40 transition">
                          {/* Date Block */}
                          <td className="p-2">
                            <input
                              type="text"
                              value={t.Date || ""}
                              onChange={(e) => handleCellEdit(t.id, "Date", e.target.value)}
                              className="w-full bg-transparent border-b border-transparent focus:border-blue-500 py-1 px-1 text-[11px] text-slate-800 rounded outline-none focus:bg-white"
                              placeholder="نامعلوم"
                            />
                          </td>

                          {/* Description Block */}
                          <td className="p-2">
                            <input
                              type="text"
                              value={t.Description || ""}
                              onChange={(e) => handleCellEdit(t.id, "Description", e.target.value)}
                              className="w-full bg-transparent border-b border-transparent focus:border-blue-500 py-1 px-1 text-[11px] text-slate-800 rounded outline-none focus:bg-white"
                              placeholder="نامعلوم"
                            />
                          </td>

                          {/* Debit Column */}
                          <td className="p-2 font-mono">
                            <input
                              type="text"
                              value={t.Debit !== null ? t.Debit : ""}
                              onChange={(e) => handleCellEdit(t.id, "Debit", e.target.value)}
                              className="w-full bg-transparent text-rose-700 font-bold border-b border-transparent focus:border-rose-500 py-1 px-1 text-[11px] rounded outline-none focus:bg-white"
                              placeholder="0"
                            />
                          </td>

                          {/* Credit Column */}
                          <td className="p-2 font-mono">
                            <input
                              type="text"
                              value={t.Credit !== null ? t.Credit : ""}
                              onChange={(e) => handleCellEdit(t.id, "Credit", e.target.value)}
                              className="w-full bg-transparent text-emerald-700 font-bold border-b border-transparent focus:border-emerald-500 py-1 px-1 text-[11px] rounded outline-none focus:bg-white"
                              placeholder="0"
                            />
                          </td>

                          {/* Remarks/Check Numbers */}
                          <td className="p-2">
                            <input
                              type="text"
                              value={t.Remarks || ""}
                              onChange={(e) => handleCellEdit(t.id, "Remarks", e.target.value)}
                              className="w-full bg-transparent border-b border-transparent focus:border-blue-500 py-1 px-1 text-[11px] text-slate-500 rounded outline-none focus:bg-white"
                              placeholder="..."
                            />
                          </td>

                          {/* Row Actions */}
                          <td className="p-2 text-center print:hidden">
                            <button
                              onClick={() => deleteRow(t.id)}
                              className="text-slate-300 hover:text-rose-500 p-1 rounded hover:bg-slate-100 transition-colors"
                              title="حذف سطر"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Status footer list size */}
              <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 select-none shrink-0 print:hidden">
                <span>تعداد کل سطرها: {convertToPersianDigits(transactions.length)} مفصل معین</span>
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                  بروزرسانی داده به صورت زنده فعال است
                </span>
              </div>
            </div>

            {/* Live compliance visual JSON output panel */}
            <div className="bg-[#1E1E1E] rounded-xl border border-slate-800 flex flex-col overflow-hidden max-h-[190px] shrink-0 print:hidden font-mono shadow-md">
              <div className="px-4 py-1.5 border-b border-slate-700 bg-[#252526] flex justify-between items-center select-none shrink-0">
                <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                  Output JSON Array (آرایه نتایج به فارسی)
                </span>
                <button 
                  onClick={copyJSONToClipboard}
                  className="text-[9px] bg-slate-700 text-slate-200 px-2 py-0.5 rounded hover:bg-slate-600 transition"
                >
                  کپی خروجی
                </button>
              </div>
              <div className="flex-1 p-3 text-[10px] leading-relaxed text-blue-300 overflow-auto whitespace-pre select-all text-left ltr" dir="ltr">
                {JSON.stringify(
                  transactions.map((t) => ({
                    Date: t.Date || null,
                    Description: t.Description || null,
                    Debit: t.Debit,
                    Credit: t.Credit,
                    Remarks: t.Remarks || null,
                  })),
                  null,
                  2
                )}
              </div>
            </div>
          </section>
        </div>

        {/* System Footer bar details */}
        <footer className="h-8 bg-slate-800 text-slate-400 flex items-center justify-between px-6 text-[10px] select-none shrink-0 print:hidden">
          <div className="flex gap-4">
            <span>سیستم: آنلاین</span>
            <span>هسته هوش مصنوعی: Gemini-Vision-Controller</span>
          </div>
          <div className="flex gap-4">
            <span>توسعه یافته بر پایه React & Express</span>
            <span className="text-emerald-400">ساختار آماده استخراج</span>
          </div>
        </footer>
      </main>

      {/* Live web scan camera overlay */}
      {isCameraOpen && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={() => setIsCameraOpen(false)}
        />
      )}
    </div>
  );
}

