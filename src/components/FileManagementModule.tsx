import React, { useState, useRef } from "react";
import { 
  Folder, 
  File as FileIcon, 
  FileText, 
  Image as ImageIcon, 
  UploadCloud, 
  Trash2, 
  Download, 
  Search,
  MoreVertical,
  FileSpreadsheet,
  FileAudio,
  FileVideo,
  FileArchive,
  ChevronRight,
  FolderPlus,
  FilePlus,
  ArrowLeft
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface FileManagementModuleProps {
  isDarkMode: boolean;
  showNotification: (text: string, type?: "success" | "error" | "info") => void;
}

type FileItem = {
  id: string;
  name: string;
  type: "folder" | "file";
  extension?: string;
  size?: number;
  date: string;
  parentId: string | null;
};

// Initial Mock Data
const MOCK_FILES: FileItem[] = [
  { id: "1", name: "اسناد مالی", type: "folder", date: "2026-06-15", parentId: null },
  { id: "2", name: "قراردادها", type: "folder", date: "2026-05-20", parentId: null },
  { id: "3", name: "گزارش_سالیانه.pdf", type: "file", extension: "pdf", size: 2500000, date: "2026-06-10", parentId: null },
  { id: "4", name: "فاکتور_خرید_تیر.xlsx", type: "file", extension: "xlsx", size: 120000, date: "2026-07-01", parentId: "1" },
  { id: "5", name: "رسید_بانک_تجارت.jpg", type: "file", extension: "jpg", size: 850000, date: "2026-06-16", parentId: "1" },
];

const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

const getFileIcon = (extension?: string, className?: string) => {
  const ext = extension?.toLowerCase();
  switch (ext) {
    case "pdf": return <FileText className={`text-red-500 ${className}`} />;
    case "xlsx":
    case "xls":
    case "csv": return <FileSpreadsheet className={`text-green-600 ${className}`} />;
    case "jpg":
    case "jpeg":
    case "png": return <ImageIcon className={`text-blue-500 ${className}`} />;
    case "mp3":
    case "wav": return <FileAudio className={`text-yellow-500 ${className}`} />;
    case "mp4":
    case "avi": return <FileVideo className={`text-purple-500 ${className}`} />;
    case "zip":
    case "rar": return <FileArchive className={`text-orange-500 ${className}`} />;
    default: return <FileIcon className={`text-slate-500 ${className}`} />;
  }
};

export default function FileManagementModule({ isDarkMode, showNotification }: FileManagementModuleProps) {
  const [files, setFiles] = useState<FileItem[]>(MOCK_FILES);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Navigation functions
  const getCurrentPath = () => {
    let path = [];
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
  };

  const handleNavigateUp = () => {
    if (!currentFolderId) return;
    const currentFolder = files.find(f => f.id === currentFolderId);
    setCurrentFolderId(currentFolder?.parentId || null);
  };

  const handleNavigateToPath = (folderId: string | null) => {
    setCurrentFolderId(folderId);
  };

  // File Upload Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processFiles = (fileList: FileList) => {
    const newFiles: FileItem[] = Array.from(fileList).map(file => {
      const parts = file.name.split(".");
      const extension = parts.length > 1 ? parts.pop() : undefined;
      return {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: "file",
        extension,
        size: file.size,
        date: new Date().toISOString().split("T")[0],
        parentId: currentFolderId
      };
    });

    setFiles(prev => [...prev, ...newFiles]);
    showNotification(`${newFiles.length} فایل با موفقیت آپلود شد`, "success");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const handleDelete = (id: string, name: string) => {
    setFiles(prev => prev.filter(f => f.id !== id && f.parentId !== id));
    showNotification(`«${name}» با موفقیت حذف شد`, "success");
  };

  const handleCreateFolder = () => {
    const folderName = prompt("نام پوشه جدید:");
    if (folderName?.trim()) {
      const newFolder: FileItem = {
        id: Math.random().toString(36).substr(2, 9),
        name: folderName.trim(),
        type: "folder",
        date: new Date().toISOString().split("T")[0],
        parentId: currentFolderId
      };
      setFiles(prev => [...prev, newFolder]);
      showNotification(`پوشه «${folderName}» ایجاد شد`, "success");
    }
  };

  // Filter Data
  const displayedFiles = files.filter(f => {
    if (searchQuery) {
      return f.name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return f.parentId === currentFolderId;
  });

  return (
    <div className={`flex flex-col h-full rounded-xl border overflow-hidden transition-colors ${isDarkMode ? "bg-slate-900 border-slate-800 text-slate-200" : "bg-white border-slate-200 text-slate-800"}`}>
      
      {/* Toolbar & Breadcrumbs */}
      <div className={`p-4 border-b flex flex-wrap gap-4 items-center justify-between ${isDarkMode ? "border-slate-800 bg-slate-900/50" : "border-slate-200 bg-slate-50/50"}`}>
        
        {/* Breadcrumb Navigation */}
        <div className="flex items-center space-x-reverse space-x-2 text-sm">
          {currentFolderId && (
            <button 
              onClick={handleNavigateUp}
              className={`p-1.5 rounded-md ml-2 ${isDarkMode ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-200 text-slate-600"}`}
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          
          <button 
            onClick={() => handleNavigateToPath(null)}
            className={`font-medium ${!currentFolderId ? (isDarkMode ? "text-indigo-400" : "text-indigo-600") : (isDarkMode ? "text-slate-400 hover:text-slate-200" : "text-slate-600 hover:text-slate-900")}`}
          >
            خانه
          </button>
          
          {getCurrentPath().map((folder, index, arr) => (
            <React.Fragment key={folder.id}>
              <ChevronRight className="w-4 h-4 text-slate-400" />
              <button 
                onClick={() => handleNavigateToPath(folder.id)}
                className={`font-medium ${index === arr.length - 1 ? (isDarkMode ? "text-indigo-400" : "text-indigo-600") : (isDarkMode ? "text-slate-400 hover:text-slate-200" : "text-slate-600 hover:text-slate-900")}`}
              >
                {folder.name}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="جستجو فایل..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`text-sm pr-9 pl-4 py-2 rounded-lg outline-none border transition-colors ${
                isDarkMode 
                  ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-indigo-500 focus:bg-slate-900" 
                  : "bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-indigo-500"
              }`}
            />
          </div>
          <button 
            onClick={handleCreateFolder}
            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors ${
              isDarkMode ? "border-slate-700 hover:bg-slate-800 text-slate-300" : "border-slate-300 hover:bg-slate-100 text-slate-700"
            }`}
          >
            <FolderPlus className="w-4 h-4" />
            <span className="hidden sm:inline">پوشه جدید</span>
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-transparent bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
          >
            <UploadCloud className="w-4 h-4" />
            <span className="hidden sm:inline">آپلود</span>
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileInput} 
            className="hidden" 
            multiple 
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div 
        className={`flex-1 overflow-auto p-4 transition-all duration-300 ${isDragging ? (isDarkMode ? "bg-indigo-900/20 border-2 border-dashed border-indigo-500" : "bg-indigo-50 border-2 border-dashed border-indigo-400") : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isDragging ? (
          <div className="h-full flex flex-col items-center justify-center text-indigo-500 pointer-events-none">
            <UploadCloud className="w-16 h-16 animate-bounce" />
            <p className="mt-4 text-xl font-medium">فایل‌ها را اینجا رها کنید</p>
          </div>
        ) : displayedFiles.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500">
            <Folder className={`w-16 h-16 mb-4 ${isDarkMode ? "text-slate-700" : "text-slate-300"}`} />
            <p className="text-lg">فایلی در اینجا وجود ندارد</p>
            {!searchQuery && (
              <p className="text-sm mt-2">برای آپلود فایل‌ها را به اینجا بکشید یا دکمه آپلود را بزنید</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <AnimatePresence>
              {displayedFiles.map((file) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ y: -2 }}
                  key={file.id}
                  onDoubleClick={() => file.type === "folder" && handleFolderClick(file.id)}
                  className={`group flex flex-col p-4 rounded-xl border cursor-pointer transition-all ${
                    isDarkMode 
                      ? "border-slate-800 bg-slate-800/40 hover:bg-slate-800 hover:border-slate-700" 
                      : "border-slate-200 bg-white hover:shadow-md hover:border-slate-300"
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700/50">
                      {file.type === "folder" ? (
                        <Folder className="w-8 h-8 text-indigo-500 fill-indigo-500/20" />
                      ) : (
                        getFileIcon(file.extension, "w-8 h-8")
                      )}
                    </div>
                    
                    {/* Action Menu Trigger */}
                    <button 
                      className={`p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity ${
                        isDarkMode ? "hover:bg-slate-700 text-slate-400" : "hover:bg-slate-100 text-slate-500"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`آیا از حذف «${file.name}» اطمینان دارید؟`)) {
                          handleDelete(file.id, file.name);
                        }
                      }}
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4 hover:text-red-500 transition-colors" />
                    </button>
                  </div>
                  
                  <h3 className={`font-medium text-sm truncate mb-1 ${isDarkMode ? "text-slate-200" : "text-slate-800"}`} title={file.name}>
                    {file.name}
                  </h3>
                  
                  <div className={`flex justify-between items-center text-xs ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
                    <span>{file.date}</span>
                    <span>{file.type === "file" && file.size ? formatBytes(file.size) : "پوشه"}</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
