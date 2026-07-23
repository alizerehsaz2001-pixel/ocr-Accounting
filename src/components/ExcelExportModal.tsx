import React, { useState, useEffect } from 'react';
import { X, Download, Filter, List, ArrowDownUp, GripVertical, CheckSquare, Square } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Reorder } from 'motion/react';

interface ExcelExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any[];
  isDarkMode: boolean;
  defaultFilename?: string;
}

interface ColumnDef {
  key: string;
  label: string;
  visible: boolean;
}

export const ExcelExportModal: React.FC<ExcelExportModalProps> = ({
  isOpen,
  onClose,
  data,
  isDarkMode,
  defaultFilename = "Export",
}) => {
  const [columns, setColumns] = useState<ColumnDef[]>([]);
  const [filename, setFilename] = useState(defaultFilename);
  const [searchTerm, setSearchTerm] = useState("");
  
  useEffect(() => {
    if (data && data.length > 0 && isOpen) {
      // Extract all unique keys from data
      const allKeys = new Set<string>();
      data.forEach(row => {
        Object.keys(row).forEach(key => allKeys.add(key));
      });
      
      const cols = Array.from(allKeys).map(key => ({
        key,
        label: key,
        visible: true
      }));
      
      setColumns(cols);
      setFilename(`${defaultFilename}-${new Date().toISOString().split('T')[0]}`);
    }
  }, [data, isOpen, defaultFilename]);

  if (!isOpen) return null;

  const toggleColumn = (key: string) => {
    setColumns(cols => cols.map(c => c.key === key ? { ...c, visible: !c.visible } : c));
  };

  const handleExport = () => {
    if (columns.filter(c => c.visible).length === 0) {
       alert("حداقل یک ستون برای خروجی انتخاب کنید.");
       return;
    }

    // Filter rows based on search term
    const filteredData = searchTerm.trim() 
      ? data.filter(row => 
          Object.values(row).some(val => String(val).toLowerCase().includes(searchTerm.toLowerCase()))
        )
      : data;

    // Filter and map data based on selected columns and order
    const exportData = filteredData.map(row => {
      const newRow: any = {};
      columns.forEach(col => {
        if (col.visible) {
          newRow[col.label] = row[col.key];
        }
      });
      return newRow;
    });
    
    if (exportData.length === 0) {
      alert("هیچ داده‌ای برای خروجی با این فیلتر یافت نشد.");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    
    // Auto-size widths based on header length and content (simple heuristic)
    const colWidths = columns.filter(c => c.visible).map(c => ({ wch: Math.max(c.label.length + 5, 15) }));
    worksheet["!cols"] = colWidths;
    
    // Set RTL
    if (!worksheet['!views']) worksheet['!views'] = [];
    worksheet['!views'].push({ rightToLeft: true });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    
    XLSX.writeFile(workbook, `${filename}.xlsx`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`relative w-full max-w-xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden ${
        isDarkMode ? "bg-slate-900 border border-slate-700" : "bg-white border border-slate-200"
      }`}>
        
        {/* Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between ${
          isDarkMode ? "border-slate-800 bg-slate-900/50" : "border-slate-200 bg-slate-50"
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isDarkMode ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-100 text-emerald-600"}`}>
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-sm font-black ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                تنظیمات پیشرفته صادرات اکسل
              </h3>
              <p className={`text-[10px] mt-0.5 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                ستون‌ها را انتخاب کنید و ترتیب آن‌ها را با کشیدن و رها کردن تغییر دهید
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              isDarkMode ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-200 text-slate-500"
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          
          {/* Filename */}
          <div className="mb-6">
            <label className={`block text-xs font-bold mb-2 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
              نام فایل خروجی
            </label>
            <div className="relative">
              <input 
                type="text" 
                value={filename}
                onChange={e => setFilename(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl text-xs outline-none transition-all focus:ring-2 focus:ring-emerald-500/30 ${
                  isDarkMode 
                    ? "bg-slate-800 border border-slate-700 text-white focus:border-emerald-500/50" 
                    : "bg-slate-50 border border-slate-300 text-slate-900 focus:border-emerald-500"
                }`}
                dir="ltr"
              />
              <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
                .xlsx
              </span>
            </div>
          </div>

          {/* Row Filter */}
          <div className="mb-6">
            <label className={`block text-xs font-bold mb-2 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
              فیلتر داده‌ها (جستجو در محتوا)
            </label>
            <div className="relative">
              <input 
                type="text" 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="عبارت مورد نظر برای فیلتر سطرها را وارد کنید..."
                className={`w-full px-3 py-2 pr-9 rounded-xl text-xs outline-none transition-all focus:ring-2 focus:ring-emerald-500/30 ${
                  isDarkMode 
                    ? "bg-slate-800 border border-slate-700 text-white focus:border-emerald-500/50" 
                    : "bg-slate-50 border border-slate-300 text-slate-900 focus:border-emerald-500"
                }`}
                dir="rtl"
              />
              <Filter className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`} />
            </div>
            {searchTerm && (
               <p className="text-[10px] text-emerald-500 mt-2 font-bold">
                 تنها سطرهایی که شامل «{searchTerm}» هستند خروجی گرفته می‌شوند.
               </p>
            )}
          </div>

          <div className="mb-2 flex items-center justify-between">
            <label className={`text-xs font-bold ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
              انتخاب و ترتیب ستون‌ها ({columns.filter(c => c.visible).length} از {columns.length})
            </label>
            <div className="flex gap-2">
              <button 
                onClick={() => setColumns(cols => cols.map(c => ({...c, visible: true})))}
                className={`text-[9px] font-bold px-2 py-1 rounded transition-colors ${
                  isDarkMode ? "bg-slate-800 hover:bg-slate-700 text-slate-300" : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                }`}
              >
                انتخاب همه
              </button>
              <button 
                onClick={() => setColumns(cols => cols.map(c => ({...c, visible: false})))}
                className={`text-[9px] font-bold px-2 py-1 rounded transition-colors ${
                  isDarkMode ? "bg-slate-800 hover:bg-slate-700 text-slate-300" : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                }`}
              >
                هیچکدام
              </button>
            </div>
          </div>

          <div className={`rounded-xl border overflow-hidden ${isDarkMode ? "border-slate-700 bg-slate-800/50" : "border-slate-200 bg-slate-50"}`}>
             <Reorder.Group 
               axis="y" 
               values={columns} 
               onReorder={setColumns} 
               className="flex flex-col"
             >
               {columns.map(col => (
                 <Reorder.Item 
                   key={col.key} 
                   value={col}
                   className={`flex items-center gap-3 p-3 border-b last:border-b-0 cursor-grab active:cursor-grabbing bg-transparent ${
                     isDarkMode ? "border-slate-700 hover:bg-slate-800" : "border-slate-200 hover:bg-slate-100"
                   }`}
                 >
                   <div 
                     onClick={(e) => {
                       e.stopPropagation();
                       toggleColumn(col.key);
                     }}
                     className="cursor-pointer flex-shrink-0"
                   >
                     {col.visible ? (
                       <CheckSquare className="w-4 h-4 text-emerald-500" />
                     ) : (
                       <Square className={`w-4 h-4 ${isDarkMode ? "text-slate-600" : "text-slate-400"}`} />
                     )}
                   </div>
                   
                   <span className={`text-xs font-medium flex-1 select-none ${
                     col.visible ? (isDarkMode ? "text-slate-200" : "text-slate-700") : (isDarkMode ? "text-slate-500" : "text-slate-400")
                   }`}>
                     {col.label}
                   </span>

                   <GripVertical className={`w-4 h-4 flex-shrink-0 ${isDarkMode ? "text-slate-600" : "text-slate-400"}`} />
                 </Reorder.Item>
               ))}
             </Reorder.Group>
          </div>

        </div>

        {/* Footer */}
        <div className={`p-4 border-t flex justify-end gap-3 ${
          isDarkMode ? "bg-slate-900/80 border-slate-800" : "bg-slate-50 border-slate-200"
        }`}>
          <button 
            onClick={onClose}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              isDarkMode ? "bg-slate-800 hover:bg-slate-700 text-slate-300" : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-300"
            }`}
          >
            انصراف
          </button>
          <button 
            onClick={handleExport}
            className="px-6 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-md flex items-center gap-2 transition-transform active:scale-95"
          >
            <Download className="w-4 h-4" />
            دانلود فایل اکسل
          </button>
        </div>

      </div>
    </div>
  );
};
