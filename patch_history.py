import re

content = open('src/App.tsx').read()

# Replace "Recent successful extractions" header
old_header = '''          {/* Recent successful extractions */}
          <div className={`px-4 pt-5 pb-2 text-[9px] font-black uppercase tracking-wider flex items-center justify-between border-t mt-4 ${
            isDarkMode ? "text-slate-500 border-slate-800/60" : "text-slate-400 border-slate-200"
          }`}>
            <span className="flex items-center gap-1.5">
              <span className="w-1 h-3 rounded-full bg-emerald-500" />
              تاریخچه اسکن‌های اخیر
            </span>
            <History className="h-3.5 w-3.5 opacity-60" />
          </div>'''

new_header = '''          {/* Recent successful extractions */}
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
          </div>'''
content = content.replace(old_header, new_header)

# Enhance history items empty state
old_empty = '''            {previousScans.length === 0 ? (
              <div className={`px-3 py-4 text-center rounded-xl border border-dashed text-[10px] italic ${
                isDarkMode ? "border-slate-800/60 text-slate-500" : "border-slate-250 text-slate-400"
              }`}>
                سندی اخیراً اسکن نشده است.
              </div>'''

new_empty = '''            {previousScans.length === 0 ? (
              <div className={`px-3 py-6 text-center rounded-xl border border-dashed flex flex-col items-center justify-center gap-2 ${
                isDarkMode ? "border-slate-800/80 bg-slate-900/30 text-slate-500" : "border-slate-300 bg-slate-50 text-slate-400"
              }`}>
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center mb-1">
                   <History className="w-5 h-5 opacity-50" />
                </div>
                <span className="text-[11px] font-bold">هیچ تاریخچه‌ای وجود ندارد</span>
                <span className="text-[9px] opacity-70">اسناد اسکن شده شما در اینجا نمایش داده می‌شوند</span>
              </div>'''
content = content.replace(old_empty, new_empty)

# Enhance History Items List
old_items = '''          <div className="px-2 space-y-1 overflow-y-auto max-h-[220px]">'''
new_items = '''          <div className="px-3 space-y-2 overflow-y-auto max-h-[300px] pb-4 custom-scrollbar">'''
content = content.replace(old_items, new_items)

# Enhance the filter area
old_filter = '''          {/* Search & Filters for History */}
          {previousScans.length > 0 && (
            <div className="px-4 mb-3 space-y-2">'''

new_filter = '''          {/* Search & Filters for History */}
          {previousScans.length > 0 && (
            <div className={`mx-4 mb-4 p-2.5 rounded-xl space-y-2.5 border ${isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-slate-50 border-slate-200"}`}>'''
content = content.replace(old_filter, new_filter)

old_scan_item = '''                  <motion.div
                    key={scan.id}
                    whileHover={{ x: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => selectPreviousScan(scan)}
                    className={`group relative flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all duration-200 select-none border ${
                      isActive
                        ? isDarkMode
                          ? "bg-indigo-500/10 text-indigo-300 border-indigo-500/40 font-bold shadow-md shadow-indigo-500/2"
                          : "bg-indigo-50 text-indigo-700 border-indigo-200/80 font-bold"
                        : isDarkMode
                          ? "border-transparent text-slate-400 hover:bg-slate-800/40 hover:text-white"
                          : "border-transparent text-slate-600 hover:bg-slate-200/40 hover:text-slate-900"
                    }`}
                  >'''

new_scan_item = '''                  <motion.div
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
                  >'''
content = content.replace(old_scan_item, new_scan_item)

# Enhance the Thumbnail in history items
old_thumbnail = '''                      {/* Thumbnail Container */}
                      <div className="w-7 h-7 rounded-lg overflow-hidden bg-slate-950/20 border border-slate-800/45 flex items-center justify-center shrink-0 relative shadow-inner">'''

new_thumbnail = '''                      {/* Thumbnail Container */}
                      <div className={`w-9 h-9 rounded-xl overflow-hidden shrink-0 relative shadow-sm border ${
                         isActive 
                           ? (isDarkMode ? "border-indigo-500/30 ring-2 ring-indigo-500/20" : "border-indigo-300 ring-2 ring-indigo-500/20")
                           : (isDarkMode ? "bg-slate-900 border-slate-700/50" : "bg-slate-100 border-slate-200")
                      } flex items-center justify-center transition-all duration-300 group-hover:scale-105`}>'''
content = content.replace(old_thumbnail, new_thumbnail)

# Enhance file name and texts in history items
old_texts = '''                      <div className="flex flex-col text-right truncate min-w-0 flex-1">
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
                          {scan.file.documentType && (
                            <span className={`border rounded px-1 text-[8px] font-bold shrink-0 max-w-[70px] truncate ${
                              isDarkMode
                                 ? "bg-slate-950/60 text-indigo-400 border-slate-850"
                                 : "bg-slate-200/50 text-indigo-700 border-slate-300/40"
                            }`} title={scan.file.documentType}>
                              {scan.file.documentType}
                            </span>
                          )}
                        </div>
                      </div>'''

new_texts = '''                      <div className="flex flex-col text-right truncate min-w-0 flex-1 justify-center">
                        <span className={`text-xs font-black truncate leading-tight ${isActive ? isDarkMode ? "text-indigo-100" : "text-indigo-900" : isDarkMode ? "text-slate-200" : "text-slate-800"} transition-colors duration-200`} title={scan.file.name}>
                          {scan.file.name}
                        </span>
                        <div className="flex items-center justify-between gap-1 mt-1.5 text-[9px] font-medium">
                          <div className="flex gap-1.5 items-center text-slate-500">
                            <span className={`flex items-center gap-1 font-bold ${isActive ? "text-emerald-500" : isDarkMode ? "text-emerald-400/80" : "text-emerald-600"}`}>
                              <Database className="w-3 h-3" />
                              <span className="font-mono">{scan.transactions.length} ردیف</span>
                            </span>
                            <span className="opacity-50 font-mono">• {timeStr}</span>
                          </div>
                          {scan.file.documentType && (
                            <span className={`border rounded-md px-1.5 py-0.5 text-[8.5px] font-bold shrink-0 max-w-[80px] truncate shadow-sm transition-colors ${
                              isActive
                                 ? isDarkMode ? "bg-indigo-500/20 text-indigo-200 border-indigo-500/40" : "bg-indigo-100 text-indigo-800 border-indigo-300"
                                 : isDarkMode ? "bg-slate-800 text-slate-400 border-slate-700" : "bg-white text-slate-600 border-slate-200"
                            }`} title={scan.file.documentType}>
                              {scan.file.documentType}
                            </span>
                          )}
                        </div>
                      </div>'''
content = content.replace(old_texts, new_texts)

# Enhance history delete button
old_del_btn = '''                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deletePreviousScan(scan.id);
                      }}
                      className={`p-1 rounded-lg transition-opacity duration-250 opacity-0 group-hover:opacity-100 shrink-0 ml-1 hover:scale-105 ${
                        isDarkMode
                          ? "text-slate-500 hover:text-rose-400 hover:bg-slate-800"
                          : "text-slate-450 hover:text-rose-600 hover:bg-slate-200"
                      }`}
                      title="حذف از تاریخچه"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>'''

new_del_btn = '''                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deletePreviousScan(scan.id);
                      }}
                      className={`p-1.5 rounded-lg transition-all duration-250 opacity-0 group-hover:opacity-100 shrink-0 ml-1 hover:scale-110 ${
                        isDarkMode
                          ? "text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20 border border-transparent"
                          : "text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 border border-transparent"
                      }`}
                      title="حذف از تاریخچه"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>'''
content = content.replace(old_del_btn, new_del_btn)

open('src/App.tsx', 'w').write(content)
print("Updated History section in App.tsx")
