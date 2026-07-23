import re

content = open('src/App.tsx').read()

old_search = '''              {/* Search input with search icon */}
              <div className="relative flex items-center">
                <Search className={`absolute right-2.5 h-3.5 w-3.5 pointer-events-none ${isDarkMode ? "text-slate-500" : "text-slate-400"}`} />
                <input
                  type="text"
                  placeholder="جستجو در نام یا نوع سند..."
                  value={historySearchQuery}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                  className={`w-full border rounded-lg py-1.5 pr-8 pl-6 text-[10px] transition-colors text-right outline-none focus:ring-1 focus:ring-indigo-500/50 ${
                    isDarkMode 
                      ? "bg-slate-950/40 border-slate-850 text-slate-200 placeholder-slate-600 focus:border-indigo-500/40" 
                      : "bg-white border-slate-250 text-slate-800 placeholder-slate-400 focus:border-indigo-400"
                  }`}
                  dir="rtl"
                />
                {historySearchQuery && (
                  <button
                    onClick={() => setHistorySearchQuery("")}
                    className="absolute left-2 text-slate-500 hover:text-slate-300 transition"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>'''

new_search = '''              {/* Search input with search icon */}
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
              </div>'''
content = content.replace(old_search, new_search)

old_filters = '''              {/* Filters Row */}
              <div className="grid grid-cols-2 gap-1.5">
                {/* Document Type Dropdown */}
                <div className="relative">
                  <select
                    value={historyDocType}
                    onChange={(e) => setHistoryDocType(e.target.value)}
                    className={`w-full border rounded-lg px-1.5 py-1 text-[9.5px] transition-colors text-right cursor-pointer outline-none ${
                      isDarkMode 
                        ? "bg-slate-950/60 border-slate-850 text-slate-300 focus:border-indigo-500/40" 
                        : "bg-white border-slate-250 text-slate-700 focus:border-indigo-450"
                    }`}
                    dir="rtl"
                  >'''

new_filters = '''              {/* Filters Row */}
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
                  >'''
content = content.replace(old_filters, new_filters)

old_date_filter = '''                {/* Date Range Dropdown */}
                <div className="relative">
                  <select
                    value={historyDateRange}
                    onChange={(e) => setHistoryDateRange(e.target.value)}
                    className={`w-full border rounded-lg px-1.5 py-1 text-[9.5px] transition-colors text-right cursor-pointer outline-none ${
                      isDarkMode 
                        ? "bg-slate-950/60 border-slate-850 text-slate-300 focus:border-indigo-500/40" 
                        : "bg-white border-slate-250 text-slate-700 focus:border-indigo-450"
                    }`}
                    dir="rtl"
                  >'''

new_date_filter = '''                {/* Date Range Dropdown */}
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
                  >'''
content = content.replace(old_date_filter, new_date_filter)

open('src/App.tsx', 'w').write(content)
print("Updated History Filters in App.tsx")
