import re

content = open('src/components/ExcelExportModal.tsx').read()

# Add row filter state
old_state = '''  const [columns, setColumns] = useState<ColumnDef[]>([]);
  const [filename, setFilename] = useState(defaultFilename);'''

new_state = '''  const [columns, setColumns] = useState<ColumnDef[]>([]);
  const [filename, setFilename] = useState(defaultFilename);
  const [searchTerm, setSearchTerm] = useState("");'''
content = content.replace(old_state, new_state)

# Apply row filter on export
old_export = '''    // Filter and map data based on selected columns and order
    const exportData = data.map(row => {
      const newRow: any = {};
      columns.forEach(col => {
        if (col.visible) {
          newRow[col.label] = row[col.key];
        }
      });
      return newRow;
    });'''

new_export = '''    // Filter rows based on search term
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
    }'''
content = content.replace(old_export, new_export)


# Add row filter UI
old_ui = '''          <div className="mb-2 flex items-center justify-between">
            <label className={`text-xs font-bold ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
              انتخاب و ترتیب ستون‌ها ({columns.filter(c => c.visible).length} از {columns.length})
            </label>'''

new_ui = '''          {/* Row Filter */}
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
            </label>'''
content = content.replace(old_ui, new_ui)


open('src/components/ExcelExportModal.tsx', 'w').write(content)
print("Updated ExcelExportModal.tsx with row filtering")
