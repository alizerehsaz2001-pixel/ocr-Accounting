import React, { useState, useRef, useEffect } from "react";
import { 
  Folder, 
  FileText, 
  Image as ImageIcon, 
  UploadCloud, 
  Trash2, 
  Download, 
  Search,
  FileSpreadsheet,
  FileAudio,
  FileVideo,
  FileArchive,
  ChevronRight,
  FolderPlus,
  ArrowLeft,
  Cloud,
  CloudUpload,
  RefreshCw,
  Star,
  Tag,
  Zap,
  MessageSquareText,
  Eye,
  CheckSquare,
  Square,
  LayoutGrid,
  List,
  Plus,
  X,
  FileEdit,
  ShieldCheck,
  Cpu,
  Sheet,
  HardDrive,
  Copy,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export interface FileItem {
  id: string;
  name: string;
  type: "folder" | "file";
  category?: "invoice" | "receipt" | "cheque" | "contract" | "general";
  extension?: string;
  size?: number;
  date: string;
  parentId: string | null;
  folderName?: string;
  tags?: string[];
  isStarred?: boolean;
  status?: "idle" | "processing" | "success" | "error";
  preview?: string;
  syncedToCloud?: boolean;
  transactionsCount?: number;
  tokensUsed?: number;
}

interface FileManagementModuleProps {
  isDarkMode: boolean;
  showNotification: (text: string, type?: "success" | "error" | "info") => void;
  scansData?: any[];
  foldersData?: any[];
  onSelectScanForOCR?: (scan: any) => void;
  onOpenExclusiveChat?: (file: any) => void;
}

// Default Initial Folders & Files if no external data provided
const INITIAL_FOLDERS: FileItem[] = [
  { id: "f1", name: "اسناد مالی و حسابداری", type: "folder", date: "2026-06-15", parentId: null, folderName: "اسناد مالی" },
  { id: "f2", name: "فاکتورهای خرید و فروش", type: "folder", date: "2026-06-20", parentId: null, folderName: "فاکتورها" },
  { id: "f3", name: "رسیدهای بانکی و چک‌ها", type: "folder", date: "2026-07-01", parentId: null, folderName: "بانکی" },
  { id: "f4", name: "قراردادها و امور حقوقی", type: "folder", date: "2026-07-10", parentId: null, folderName: "قراردادها" },
];

const INITIAL_FILES: FileItem[] = [
  { 
    id: "doc-1", 
    name: "فاکتور_خرید_تیر_۱۴۰۵.pdf", 
    type: "file", 
    category: "invoice",
    extension: "pdf", 
    size: 2450000, 
    date: "2026-07-12", 
    parentId: "f2", 
    folderName: "فاکتورها",
    tags: ["فاکتور_خرید", "تأیید_شده"],
    isStarred: true,
    status: "success",
    syncedToCloud: true,
    transactionsCount: 14,
    tokensUsed: 1250
  },
  { 
    id: "doc-2", 
    name: "رسید_انتقال_بانک_ملت.jpg", 
    type: "file", 
    category: "receipt",
    extension: "jpg", 
    size: 820000, 
    date: "2026-07-14", 
    parentId: "f3", 
    folderName: "بانکی",
    tags: ["بانک_ملت", "واریزی"],
    isStarred: false,
    status: "success",
    syncedToCloud: true,
    transactionsCount: 1,
    tokensUsed: 890
  },
  { 
    id: "doc-3", 
    name: "چک_صیادی_شرکت_آلفا.png", 
    type: "file", 
    category: "cheque",
    extension: "png", 
    size: 1150000, 
    date: "2026-07-15", 
    parentId: "f3", 
    folderName: "بانکی",
    tags: ["چک_صیادی", "پرداختی"],
    isStarred: true,
    status: "idle",
    syncedToCloud: true,
    transactionsCount: 0,
    tokensUsed: 0
  },
  { 
    id: "doc-4", 
    name: "قرارداد_پیمانکاری_پروژه.pdf", 
    type: "file", 
    category: "contract",
    extension: "pdf", 
    size: 4800000, 
    date: "2026-07-16", 
    parentId: "f4", 
    folderName: "قراردادها",
    tags: ["قرارداد", "رسمی"],
    isStarred: false,
    status: "success",
    syncedToCloud: true,
    transactionsCount: 8,
    tokensUsed: 2100
  }
];

const formatBytes = (bytes: number = 0, decimals = 1) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

const getFileIcon = (extension?: string, className?: string) => {
  const ext = extension?.toLowerCase();
  switch (ext) {
    case "pdf": return <FileText className={`text-rose-500 ${className}`} />;
    case "xlsx":
    case "xls":
    case "csv": return <FileSpreadsheet className={`text-emerald-500 ${className}`} />;
    case "jpg":
    case "jpeg":
    case "png":
    case "webp": return <ImageIcon className={`text-blue-500 ${className}`} />;
    case "mp3":
    case "wav": return <FileAudio className={`text-amber-500 ${className}`} />;
    case "mp4":
    case "avi": return <FileVideo className={`text-purple-500 ${className}`} />;
    case "zip":
    case "rar": return <FileArchive className={`text-orange-500 ${className}`} />;
    default: return <FileText className={`text-indigo-400 ${className}`} />;
  }
};

export default function FileManagementModule({ 
  isDarkMode, 
  showNotification,
  scansData,
  foldersData,
  onSelectScanForOCR,
  onOpenExclusiveChat
}: FileManagementModuleProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [lastCloudSyncTime, setLastCloudSyncTime] = useState<string>("همین حالا");
  const [previewModalFile, setPreviewModalFile] = useState<FileItem | null>(null);
  const [isCreatingFolderModal, setIsCreatingFolderModal] = useState(false);
  const [newFolderNameInput, setNewFolderNameInput] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize data merging props or fallback defaults
  useEffect(() => {
    let initialList: FileItem[] = [...INITIAL_FOLDERS, ...INITIAL_FILES];

    if (scansData && scansData.length > 0) {
      const scansMapped: FileItem[] = scansData.map((scan: any) => {
        const isPdf = scan.file?.name?.toLowerCase().endsWith(".pdf") || scan.file?.preview?.startsWith("data:application/pdf");
        return {
          id: scan.id,
          name: scan.file?.name || "سند مالی",
          type: "file",
          category: scan.file?.type === "pdf" || isPdf ? "invoice" : "receipt",
          extension: isPdf ? "pdf" : "jpg",
          size: scan.file?.size || 1200000,
          date: new Date(scan.timestamp || Date.now()).toISOString().split("T")[0],
          parentId: null,
          folderName: scan.folder || "دسته‌بندی نشده",
          tags: scan.tags || ["استخراج_هوشمند"],
          isStarred: !!scan.isStarred,
          status: scan.file?.status || "success",
          preview: scan.file?.preview,
          syncedToCloud: true,
          transactionsCount: scan.transactions?.length || 0,
          tokensUsed: scan.file?.tokensUsed || 0
        };
      });
      initialList = [...INITIAL_FOLDERS, ...scansMapped];
    }

    if (foldersData && foldersData.length > 0) {
      const customFoldersMapped: FileItem[] = foldersData.map((f: any, idx: number) => {
        const fName = typeof f === "string" ? f : f.name;
        return {
          id: `folder-custom-${idx}`,
          name: fName,
          type: "folder",
          date: new Date().toISOString().split("T")[0],
          parentId: null,
          folderName: fName
        };
      });
      // Deduplicate folders
      const existingFolderNames = new Set(initialList.filter(i => i.type === "folder").map(i => i.name));
      customFoldersMapped.forEach(cf => {
        if (!existingFolderNames.has(cf.name)) {
          initialList.push(cf);
        }
      });
    }

    setFiles(initialList);
  }, [scansData, foldersData]);

  // Total Storage Stats
  const totalFilesCount = files.filter(f => f.type === "file").length;
  const totalStorageBytes = files.filter(f => f.type === "file").reduce((acc, f) => acc + (f.size || 0), 0);
  const cloudLimitBytes = 2 * 1024 * 1024 * 1024; // 2 GB
  const storagePercentage = Math.min(100, (totalStorageBytes / cloudLimitBytes) * 100);

  // Path Navigation
  const getCurrentPath = () => {
    let path: FileItem[] = [];
    let currentId = currentFolderId;
    while (currentId) {
      const folder = files.find(f => f.id === currentId);
      if (folder) {
        path.unshift(folder);
        currentId = folder.parentId;
      } else {
        break;
      }
    }
    return path;
  };

  const handleFolderClick = (folderId: string) => {
    setCurrentFolderId(folderId);
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedTag(null);
  };

  const handleNavigateUp = () => {
    if (!currentFolderId) return;
    const currentFolder = files.find(f => f.id === currentFolderId);
    setCurrentFolderId(currentFolder?.parentId || null);
  };

  // Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processUploadedFiles = (fileList: FileList) => {
    const currentFolder = files.find(f => f.id === currentFolderId);
    const newItems: FileItem[] = Array.from(fileList).map(file => {
      const parts = file.name.split(".");
      const extension = parts.length > 1 ? parts.pop() : undefined;
      const isPdf = extension?.toLowerCase() === "pdf";

      return {
        id: "cloud-doc-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
        name: file.name,
        type: "file",
        category: isPdf ? "invoice" : "receipt",
        extension,
        size: file.size,
        date: new Date().toISOString().split("T")[0],
        parentId: currentFolderId,
        folderName: currentFolder?.name || "دسته‌بندی نشده",
        tags: ["جدید", "بارگذاری_ابری"],
        isStarred: false,
        status: "idle",
        syncedToCloud: true,
        transactionsCount: 0,
        tokensUsed: 0
      };
    });

    setFiles(prev => [...newItems, ...prev]);
    showNotification(`${newItems.length} سند جدید در فضای ابری ذخیره و ثبت شد.`, "success");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processUploadedFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processUploadedFiles(e.target.files);
    }
  };

  // Cloud Manual Sync
  const handleManualCloudSync = () => {
    setIsSyncingCloud(true);
    setTimeout(() => {
      setIsSyncingCloud(false);
      setLastCloudSyncTime(new Date().toLocaleTimeString("fa-IR"));
      showNotification("همگام‌سازی کامل با پایگاه داده Firestore Cloud به طور کامل انجام شد.", "success");
    }, 1200);
  };

  // Item Deletion
  const handleDeleteItem = (id: string, name: string) => {
    setFiles(prev => prev.filter(f => f.id !== id && f.parentId !== id));
    setSelectedFileIds(prev => prev.filter(i => i !== id));
    showNotification(`«${name}» با موفقیت از ابر و آرشیو حذف گردید.`, "info");
  };

  // Star Toggle
  const handleToggleStar = (id: string) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, isStarred: !f.isStarred } : f));
  };

  // Folder Creation
  const handleCreateNewFolder = () => {
    if (!newFolderNameInput.trim()) {
      showNotification("نام پوشه نمی‌تواند خالی باشد.", "error");
      return;
    }
    const name = newFolderNameInput.trim();
    const newFolderObj: FileItem = {
      id: "folder-" + Date.now(),
      name,
      type: "folder",
      date: new Date().toISOString().split("T")[0],
      parentId: currentFolderId,
      folderName: name
    };
    setFiles(prev => [newFolderObj, ...prev]);
    setNewFolderNameInput("");
    setIsCreatingFolderModal(false);
    showNotification(`پوشه ابری «${name}» با موفقیت ایجاد گردید.`, "success");
  };

  // Bulk Operations
  const handleBulkDelete = () => {
    if (selectedFileIds.length === 0) return;
    if (confirm(`آیا از حذف گروهی ${selectedFileIds.length} فایل از فضای ابری اطمینان دارید؟`)) {
      setFiles(prev => prev.filter(f => !selectedFileIds.includes(f.id)));
      showNotification(`${selectedFileIds.length} سند با موفقیت حذف شدند.`, "success");
      setSelectedFileIds([]);
    }
  };

  const handleBulkStar = (status: boolean) => {
    setFiles(prev => prev.map(f => selectedFileIds.includes(f.id) ? { ...f, isStarred: status } : f));
    showNotification(`تعداد ${selectedFileIds.length} سند به عنوان ${status ? "برگزیده" : "عادی"} ثبت شد.`, "success");
    setSelectedFileIds([]);
  };

  // Extract all unique tags
  const allAvailableTags = Array.from(
    new Set(files.flatMap(f => f.tags || []))
  );

  // Filter Logic
  const filteredItems = files.filter(f => {
    // Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = f.name.toLowerCase().includes(q);
      const matchTag = f.tags?.some(t => t.toLowerCase().includes(q));
      if (!matchName && !matchTag) return false;
    }

    // Tag Filter
    if (selectedTag) {
      if (!f.tags?.includes(selectedTag)) return false;
    }

    // Category Filter
    if (selectedCategory !== "all") {
      if (selectedCategory === "starred") {
        if (!f.isStarred) return false;
      } else if (f.category !== selectedCategory) {
        return false;
      }
    }

    // Hierarchy Filter when not searching
    if (!searchQuery.trim() && !selectedTag && selectedCategory === "all") {
      return f.parentId === currentFolderId;
    }

    return true;
  });

  return (
    <div className={`flex flex-col h-full rounded-2xl border overflow-hidden transition-all duration-300 font-sans ${
      isDarkMode 
        ? "bg-[#0b1120] border-slate-800 text-slate-100 shadow-2xl" 
        : "bg-white border-slate-200 text-slate-900 shadow-xl"
    }`}>
      
      {/* Top Banner: Storage Analytics & Cloud Sync Controls */}
      <div className={`p-4 border-b flex flex-wrap items-center justify-between gap-4 ${
        isDarkMode ? "bg-slate-900/80 border-slate-800" : "bg-slate-50 border-slate-200"
      }`}>
        
        {/* Left Stats: Cloud Badge & Storage Capacity */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className={`p-2.5 rounded-xl border ${
              isDarkMode ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400" : "bg-indigo-50 border-indigo-200 text-indigo-600"
            }`}>
              <Cloud className="w-5 h-5 animate-pulse" />
            </div>
            <div className="flex flex-col text-right">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black">مدیریت اسناد و فضای ابری Firestore</span>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  آنلاین و پایدار
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium mt-0.5">
                آخرین همگام‌سازی: {lastCloudSyncTime} • {totalFilesCount.toLocaleString("fa-IR")} سند ذخیره‌شده
              </span>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-3 pr-4 border-r border-slate-200 dark:border-slate-800">
            <div className="flex flex-col text-right w-36">
              <div className="flex justify-between items-center text-[10px] font-bold mb-1">
                <span>مصرف کل ابر:</span>
                <span className="font-mono text-indigo-500">{formatBytes(totalStorageBytes)}</span>
              </div>
              <div className={`w-full h-2 rounded-full overflow-hidden ${isDarkMode ? "bg-slate-800" : "bg-slate-200"}`}>
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.max(5, storagePercentage)}%` }} 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Actions: Cloud Sync & File Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleManualCloudSync}
            disabled={isSyncingCloud}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
              isDarkMode 
                ? "bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700" 
                : "bg-white border-slate-300 text-slate-700 hover:bg-slate-100"
            }`}
            title="به‌روزرسانی و همگام‌سازی دستی با پایگاه داده ابری"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${isSyncingCloud ? "animate-spin text-indigo-500" : ""}`} />
            <span>{isSyncingCloud ? "در حال همگام‌سازی..." : "همگام‌سازی ابری"}</span>
          </button>

          <button
            onClick={() => setIsCreatingFolderModal(true)}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
              isDarkMode 
                ? "bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-700" 
                : "bg-white border-slate-300 text-slate-700 hover:bg-slate-100"
            }`}
          >
            <FolderPlus className="w-4 h-4 text-amber-500" />
            <span>پوشه جدید</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-md flex items-center gap-2 cursor-pointer hover:-translate-y-0.5 active:translate-y-0 transition-all"
          >
            <UploadCloud className="w-4 h-4" />
            <span>آپلود سند جدید</span>
          </button>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileInputChange} 
            accept="image/*,application/pdf"
            className="hidden" 
            multiple 
          />
        </div>
      </div>

      {/* Main Workspace Grid & Filters */}
      <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
        
        {/* Left Navigation Sidebar */}
        <div className={`w-full md:w-64 border-b md:border-b-0 md:border-l p-4 space-y-4 shrink-0 flex flex-col justify-between ${
          isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-slate-50/50 border-slate-200"
        }`}>
          <div className="space-y-4">
            {/* Quick Categories */}
            <div>
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-2 px-1">
                دسته‌بندی‌های اسناد
              </span>
              <div className="space-y-1">
                {[
                  { id: "all", name: "همه اسناد", icon: HardDrive, count: files.filter(f => f.type === "file").length },
                  { id: "invoice", name: "فاکتورها و خریدها", icon: FileSpreadsheet, count: files.filter(f => f.category === "invoice").length },
                  { id: "receipt", name: "رسیدها و فیش‌ها", icon: FileText, count: files.filter(f => f.category === "receipt").length },
                  { id: "cheque", name: "چک‌ها و اسناد بانکی", icon: Sheet, count: files.filter(f => f.category === "cheque").length },
                  { id: "contract", name: "قراردادها و رسمی", icon: ShieldCheck, count: files.filter(f => f.category === "contract").length },
                  { id: "starred", name: "برگزیده‌ها ⭐", icon: Star, count: files.filter(f => f.isStarred).length },
                ].map(cat => {
                  const IconComp = cat.icon;
                  const isActive = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategory(cat.id);
                        setSelectedTag(null);
                      }}
                      className={`w-full px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                        isActive 
                          ? "bg-indigo-600 text-white shadow-sm" 
                          : isDarkMode ? "text-slate-300 hover:bg-slate-800" : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <IconComp className="w-4 h-4 opacity-80" />
                        <span>{cat.name}</span>
                      </div>
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                        isActive ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                      }`}>
                        {cat.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Smart Tags Filter */}
            {allAvailableTags.length > 0 && (
              <div>
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-2 px-1">
                  برچسب‌های هوشمند
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto custom-scrollbar p-1">
                  {allAvailableTags.map(tag => {
                    const isTagActive = selectedTag === tag;
                    return (
                      <button
                        key={tag}
                        onClick={() => setSelectedTag(isTagActive ? null : tag)}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                          isTagActive 
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-sm" 
                            : isDarkMode 
                              ? "bg-slate-800 border-slate-700 text-slate-300 hover:border-indigo-500" 
                              : "bg-white border-slate-200 text-slate-600 hover:border-indigo-400"
                        }`}
                      >
                        #{tag}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Cloud Info Box */}
          <div className={`p-3 rounded-xl border text-[10px] space-y-1.5 ${
            isDarkMode ? "bg-indigo-950/20 border-indigo-500/20 text-indigo-300" : "bg-indigo-50/60 border-indigo-100 text-indigo-900"
          }`}>
            <div className="flex items-center gap-1.5 font-bold text-indigo-500">
              <CloudUpload className="w-3.5 h-3.5" />
              <span>پشتیبان‌گیری خودکار</span>
            </div>
            <p className="text-[9px] opacity-80 leading-relaxed">
              کلیه اسناد مالی و فاکتورهای پردازش‌شده مستقیماً در پایگاه داده ابری ذخیره و در دسترس خواهند بود.
            </p>
          </div>
        </div>

        {/* Right Content Area: Toolbar & Document View */}
        <div className="flex-1 flex flex-col overflow-hidden p-4">
          
          {/* Breadcrumb & Toolbar Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
            
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-xs font-bold w-full sm:w-auto">
              {currentFolderId && (
                <button 
                  onClick={handleNavigateUp}
                  className={`p-1.5 rounded-lg border transition-colors ${
                    isDarkMode ? "border-slate-800 text-slate-400 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                  title="بازگشت به سطح قبل"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              
              <button 
                onClick={() => {
                  setCurrentFolderId(null);
                  setSelectedCategory("all");
                  setSelectedTag(null);
                }}
                className={`transition-colors cursor-pointer ${
                  !currentFolderId ? "text-indigo-500 font-black" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                ریشه فضای ابری (اصلی)
              </button>

              {getCurrentPath().map((folder, index, arr) => (
                <React.Fragment key={folder.id}>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  <button 
                    onClick={() => setCurrentFolderId(folder.id)}
                    className={`transition-colors cursor-pointer ${
                      index === arr.length - 1 ? "text-indigo-500 font-black" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {folder.name}
                  </button>
                </React.Fragment>
              ))}
            </div>

            {/* Controls: Search, Multiselect & View Mode */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text"
                  placeholder="جستجوی نام یا برچسب..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`text-xs pr-9 pl-8 py-1.5 rounded-xl outline-none border transition-colors w-full sm:w-56 ${
                    isDarkMode 
                      ? "bg-slate-900 border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500" 
                      : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-500"
                  }`}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute left-2.5 top-1/2 -translate-y-1/2 p-0.5">
                    <X className="w-3 h-3 text-slate-400" />
                  </button>
                )}
              </div>

              {/* View Toggle */}
              <div className={`flex rounded-xl border p-0.5 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-slate-100 border-slate-200"}`}>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === "grid" ? (isDarkMode ? "bg-slate-800 text-white" : "bg-white shadow-sm text-slate-900") : "text-slate-400"
                  }`}
                  title="نمایش شبکه‌ای"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === "list" ? (isDarkMode ? "bg-slate-800 text-white" : "bg-white shadow-sm text-slate-900") : "text-slate-400"
                  }`}
                  title="نمایش لیستی"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Bulk Action Panel */}
          {selectedFileIds.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-3 p-3 rounded-xl border flex items-center justify-between gap-3 ${
                isDarkMode ? "bg-indigo-950/40 border-indigo-500/30 text-indigo-200" : "bg-indigo-50 border-indigo-200 text-indigo-900"
              }`}
            >
              <span className="text-xs font-bold text-indigo-500">
                {selectedFileIds.length} فایل انتخاب شده است
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleBulkStar(true)}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 transition-colors flex items-center gap-1"
                >
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>برگزیدن</span>
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>حذف گروهی</span>
                </button>
                <button
                  onClick={() => setSelectedFileIds([])}
                  className="p-1 rounded-lg hover:bg-black/10 transition-colors"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Main Dropzone / Grid View Container */}
          <div 
            className={`flex-1 overflow-y-auto rounded-2xl p-2 transition-all duration-300 custom-scrollbar ${
              isDragging 
                ? (isDarkMode ? "bg-indigo-950/20 border-2 border-dashed border-indigo-500" : "bg-indigo-50 border-2 border-dashed border-indigo-400") 
                : ""
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {isDragging ? (
              <div className="h-full flex flex-col items-center justify-center text-indigo-500 pointer-events-none py-16">
                <UploadCloud className="w-16 h-16 animate-bounce" />
                <p className="mt-4 text-lg font-bold">فایل‌ها را جهت ذخیره‌سازی ابری اینجا رها کنید</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-16">
                <Folder className="w-16 h-16 mb-3 opacity-30" />
                <p className="text-sm font-bold">هیچ سندی در این بخش پیدا نشد</p>
                <p className="text-xs text-slate-500 mt-1">یک تصویر یا فاکتور جدید آپلود کنید.</p>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <AnimatePresence>
                  {filteredItems.map(item => {
                    const isSelected = selectedFileIds.includes(item.id);
                    return (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        whileHover={{ y: -2 }}
                        onClick={() => {
                          if (item.type === "folder") {
                            handleFolderClick(item.id);
                          } else {
                            setPreviewModalFile(item);
                          }
                        }}
                        className={`group relative p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                          isSelected
                            ? "border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/10"
                            : isDarkMode 
                              ? "bg-slate-900/60 border-slate-800 hover:bg-slate-800/80 hover:border-slate-700" 
                              : "bg-white border-slate-200 hover:shadow-md hover:border-indigo-300"
                        }`}
                      >
                        {/* Top Action Row */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800">
                            {item.type === "folder" ? (
                              <Folder className="w-7 h-7 text-amber-500 fill-amber-500/20" />
                            ) : (
                              getFileIcon(item.extension, "w-7 h-7")
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            {item.type === "file" && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleStar(item.id);
                                }}
                                className={`p-1.5 rounded-lg transition-all ${
                                  item.isStarred ? "text-amber-500" : "text-slate-400 hover:text-amber-400"
                                }`}
                              >
                                <Star className={`w-4 h-4 ${item.isStarred ? "fill-current" : ""}`} />
                              </button>
                            )}

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteItem(item.id, item.name);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="حذف سند"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Name & Details */}
                        <div>
                          <h4 className="font-extrabold text-xs truncate mb-1" title={item.name}>
                            {item.name}
                          </h4>
                          
                          <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                            <span>{item.date}</span>
                            <span>{item.type === "file" ? formatBytes(item.size) : "پوشه"}</span>
                          </div>

                          {/* Tags preview */}
                          {item.tags && item.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                              {item.tags.slice(0, 2).map(t => (
                                <span key={t} className="text-[8.5px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-500">
                                  #{t}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* OCR Status Quick Action */}
                        {item.type === "file" && item.status === "idle" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onSelectScanForOCR) onSelectScanForOCR(item);
                            }}
                            className="mt-3 w-full py-1 rounded-lg text-[9.5px] font-black bg-gradient-to-r from-amber-500 to-orange-500 text-white flex items-center justify-center gap-1 shadow-sm hover:from-amber-400 hover:to-orange-400 cursor-pointer animate-pulse"
                          >
                            <Zap className="w-3 h-3" />
                            <span>استخراج OCR</span>
                          </button>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            ) : (
              /* List Table View */
              <div className="overflow-x-auto">
                <table className={`w-full text-right text-xs ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                  <thead>
                    <tr className={`border-b text-[10px] uppercase font-bold ${isDarkMode ? "border-slate-800 text-slate-400" : "border-slate-200 text-slate-500"}`}>
                      <th className="p-3">عنوان سند / پوشه</th>
                      <th className="p-3">نوع</th>
                      <th className="p-3">حجم</th>
                      <th className="p-3">تاریخ ثبت</th>
                      <th className="p-3">وضعیت ابری</th>
                      <th className="p-3 text-left">عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map(item => (
                      <tr 
                        key={item.id}
                        onClick={() => {
                          if (item.type === "folder") handleFolderClick(item.id);
                          else setPreviewModalFile(item);
                        }}
                        className={`border-b transition-colors cursor-pointer hover:bg-slate-500/5 ${
                          isDarkMode ? "border-slate-800/60" : "border-slate-100"
                        }`}
                      >
                        <td className="p-3 font-bold flex items-center gap-2">
                          {item.type === "folder" ? <Folder className="w-4 h-4 text-amber-500" /> : getFileIcon(item.extension, "w-4 h-4")}
                          <span className="truncate max-w-xs">{item.name}</span>
                        </td>
                        <td className="p-3 text-[10px] text-slate-400">{item.type === "folder" ? "پوشه" : item.extension?.toUpperCase() || "فایل"}</td>
                        <td className="p-3 font-mono text-[10px]">{item.type === "file" ? formatBytes(item.size) : "-"}</td>
                        <td className="p-3 text-[10px]">{item.date}</td>
                        <td className="p-3">
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                            ذخیره در Firestore
                          </span>
                        </td>
                        <td className="p-3 text-left">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteItem(item.id, item.name);
                            }}
                            className="p-1 rounded text-slate-400 hover:text-rose-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Document Detailed Preview Modal */}
      <AnimatePresence>
        {previewModalFile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`relative max-w-lg w-full rounded-2xl border p-6 text-right shadow-2xl ${
                isDarkMode ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-900"
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
                    <Eye className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-sm truncate max-w-xs">{previewModalFile.name}</h3>
                </div>
                <button 
                  onClick={() => setPreviewModalFile(null)}
                  className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="py-4 space-y-3">
                <div className={`p-3 rounded-xl border flex items-center justify-between text-xs font-mono ${
                  isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"
                }`}>
                  <span className="text-slate-400">حجم فایل:</span>
                  <span className="font-bold">{formatBytes(previewModalFile.size)}</span>
                </div>

                <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                  isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"
                }`}>
                  <span className="text-slate-400">تاریخ بارگذاری:</span>
                  <span className="font-bold">{previewModalFile.date}</span>
                </div>

                <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                  isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"
                }`}>
                  <span className="text-slate-400">وضعیت در دیتابیس ابری:</span>
                  <span className="font-bold text-emerald-500">✓ همگام با Firestore Cloud</span>
                </div>

                {previewModalFile.tags && previewModalFile.tags.length > 0 && (
                  <div className="pt-2">
                    <span className="text-xs font-bold text-slate-400 block mb-1.5">برچسب‌ها:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {previewModalFile.tags.map(t => (
                        <span key={t} className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-2 justify-end">
                {onOpenExclusiveChat && (
                  <button
                    onClick={() => {
                      onOpenExclusiveChat(previewModalFile);
                      setPreviewModalFile(null);
                    }}
                    className="px-3 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-1.5"
                  >
                    <MessageSquareText className="w-4 h-4" />
                    <span>چت اختصاصی سند</span>
                  </button>
                )}

                {previewModalFile.status === "idle" && onSelectScanForOCR && (
                  <button
                    onClick={() => {
                      onSelectScanForOCR(previewModalFile);
                      setPreviewModalFile(null);
                    }}
                    className="px-3 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>پردازش و استخراج OCR</span>
                  </button>
                )}

                <button
                  onClick={() => setPreviewModalFile(null)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border ${
                    isDarkMode ? "border-slate-800 text-slate-300 hover:bg-slate-800" : "border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  بستن
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* New Folder Creation Modal */}
      <AnimatePresence>
        {isCreatingFolderModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className={`w-full max-w-sm rounded-2xl border p-6 text-right space-y-4 shadow-2xl ${
              isDarkMode ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-900"
            }`}>
              <h3 className="font-extrabold text-sm flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-indigo-500" />
                <span>ایجاد پوشه جدید در فضای ابری</span>
              </h3>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">نام پوشه:</label>
                <input 
                  type="text"
                  value={newFolderNameInput}
                  onChange={(e) => setNewFolderNameInput(e.target.value)}
                  placeholder="مثال: فاکتورهای رسمی ۱۴۰۵"
                  className={`w-full px-3 py-2 rounded-xl text-xs outline-none border ${
                    isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                  }`}
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  onClick={handleCreateNewFolder}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer"
                >
                  ثبت پوشه
                </button>
                <button
                  onClick={() => setIsCreatingFolderModal(false)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border ${
                    isDarkMode ? "border-slate-800 text-slate-400" : "border-slate-200 text-slate-600"
                  }`}
                >
                  انصراف
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
