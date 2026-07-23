import re

content = open('src/App.tsx').read()

old_tools_section = '''          <div className={`px-4 py-2 text-[9px] font-black uppercase tracking-wider flex items-center justify-between ${
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
          )}'''

new_tools_section = '''          <div className={`px-4 py-3 text-[10px] font-black uppercase tracking-wider flex items-center justify-between ${
            isDarkMode ? "text-slate-400" : "text-slate-500"
          }`}>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-3.5 rounded-full bg-indigo-500 shadow-sm" />
              دستورات و ابزارها
            </span>
            <div className={`p-1 rounded-md ${isDarkMode ? "bg-slate-800/50" : "bg-slate-100"}`}>
               <Settings className="h-3.5 w-3.5 opacity-60" />
            </div>
          </div>
          
          <div className="px-2 space-y-1">
            <button
              onClick={() => setIsAiSettingsOpen(true)}
              className={`w-full flex items-center px-3 py-2 rounded-xl transition-all duration-300 text-right group ${
                isAiSettingsOpen 
                   ? isDarkMode 
                     ? "bg-gradient-to-r from-fuchsia-500/20 to-transparent text-fuchsia-300 border border-fuchsia-500/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
                     : "bg-gradient-to-r from-fuchsia-50 to-transparent text-fuchsia-700 border border-fuchsia-200/80 shadow-sm"
                  : isDarkMode 
                     ? "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent hover:border-slate-700/50" 
                     : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent hover:border-slate-200"
              }`}
            >
              <div className={`p-1.5 rounded-lg shrink-0 ml-2.5 transition-colors ${
                isAiSettingsOpen 
                  ? isDarkMode ? "bg-fuchsia-500/20" : "bg-fuchsia-100" 
                  : isDarkMode ? "bg-slate-800 group-hover:bg-slate-700" : "bg-slate-100 group-hover:bg-slate-200"
              }`}>
                <Settings className={`h-4 w-4 transition-colors ${isAiSettingsOpen ? "text-fuchsia-500" : isDarkMode ? "text-slate-400" : "text-slate-500"}`} />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold">تنظیمات هوش مصنوعی</span>
                <span className={`text-[8.5px] mt-0.5 ${isAiSettingsOpen ? (isDarkMode ? "text-fuchsia-400/70" : "text-fuchsia-600/70") : "opacity-60"}`}>مدل و راهنمای استخراج</span>
              </div>
            </button>

            <button
              onClick={() => setShowOnboarding(true)}
              className={`w-full flex items-center px-3 py-2 rounded-xl transition-all duration-300 text-right group ${
                showOnboarding 
                  ? isDarkMode 
                    ? "bg-gradient-to-r from-blue-500/20 to-transparent text-blue-300 border border-blue-500/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
                    : "bg-gradient-to-r from-blue-50 to-transparent text-blue-700 border border-blue-200/80 shadow-sm"
                  : isDarkMode 
                    ? "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent hover:border-slate-700/50" 
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent hover:border-slate-200"
              }`}
            >
              <div className={`p-1.5 rounded-lg shrink-0 ml-2.5 transition-colors ${
                showOnboarding 
                  ? isDarkMode ? "bg-blue-500/20" : "bg-blue-100" 
                  : isDarkMode ? "bg-slate-800 group-hover:bg-slate-700" : "bg-slate-100 group-hover:bg-slate-200"
              }`}>
                <HelpCircle className={`h-4 w-4 transition-colors ${showOnboarding ? "text-blue-500" : isDarkMode ? "text-slate-400" : "text-slate-500"}`} />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold">راهنمای سیستم</span>
                <span className={`text-[8.5px] mt-0.5 ${showOnboarding ? (isDarkMode ? "text-blue-400/70" : "text-blue-600/70") : "opacity-60"}`}>آشنایی با قابلیت‌ها</span>
              </div>
            </button>

            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className={`w-full flex items-center px-3 py-2 rounded-xl transition-all duration-300 text-right group ${
                isChatOpen 
                  ? isDarkMode 
                    ? "bg-gradient-to-r from-indigo-500/20 to-transparent text-indigo-300 border border-indigo-500/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
                    : "bg-gradient-to-r from-indigo-50 to-transparent text-indigo-700 border border-indigo-200/80 shadow-sm"
                  : isDarkMode 
                    ? "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent hover:border-slate-700/50" 
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent hover:border-slate-200"
              }`}
            >
              <div className={`p-1.5 rounded-lg shrink-0 ml-2.5 transition-colors relative ${
                isChatOpen 
                  ? isDarkMode ? "bg-indigo-500/20" : "bg-indigo-100" 
                  : isDarkMode ? "bg-slate-800 group-hover:bg-slate-700" : "bg-slate-100 group-hover:bg-slate-200"
              }`}>
                <Headphones className={`h-4 w-4 transition-colors ${isChatOpen ? "text-indigo-500" : isDarkMode ? "text-slate-400" : "text-slate-500"}`} />
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 animate-pulse ring-2 ring-white dark:ring-slate-900 shadow-sm"></span>
              </div>
              <div className="flex flex-col flex-1">
                <span className="text-[11px] font-bold flex items-center justify-between">
                  پشتیبان آنلاین مهرآیین
                  <span className={`text-[8.5px] font-black tracking-widest ${isChatOpen ? "text-emerald-500" : "text-slate-500"}`}>LIVE</span>
                </span>
                <span className={`text-[8.5px] mt-0.5 ${isChatOpen ? (isDarkMode ? "text-indigo-400/70" : "text-indigo-600/70") : "opacity-60"}`}>دستیار هوشمند شما</span>
              </div>
            </button>

            {activeFile && (
              <button
                onClick={clearCurrentFile}
                className={`w-full flex items-center px-3 py-2 rounded-xl transition-all duration-300 text-right group mt-1 ${
                  isDarkMode 
                    ? "text-rose-400/80 hover:bg-rose-500/10 hover:text-rose-400 border border-transparent hover:border-rose-500/20" 
                    : "text-rose-600/80 hover:bg-rose-50 hover:text-rose-700 border border-transparent hover:border-rose-200"
                }`}
              >
                <div className={`p-1.5 rounded-lg shrink-0 ml-2.5 transition-colors ${
                  isDarkMode ? "bg-rose-500/5 group-hover:bg-rose-500/20" : "bg-rose-50 group-hover:bg-rose-100"
                }`}>
                  <Trash2 className="h-4 w-4 opacity-85 transition-opacity group-hover:opacity-100" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold">حذف داده فعلی</span>
                  <span className="text-[8.5px] mt-0.5 opacity-70">بستن پرونده و پاکسازی</span>
                </div>
              </button>
            )}
          </div>'''

content = content.replace(old_tools_section, new_tools_section)

# Update ERP Modules Section title as well
old_erp_title = '''          {/* ERP Modules */}
          <div className={`px-4 pt-4 pb-2 text-[9px] font-black uppercase tracking-wider flex items-center justify-between border-t mt-4 ${
            isDarkMode ? "text-slate-500 border-slate-800/60" : "text-slate-400 border-slate-200"
          }`}>
            <span className="flex items-center gap-1.5">
              <span className="w-1 h-3 rounded-full bg-purple-500" />
              ماژول‌های هوشمند ERP
            </span>
          </div>'''

new_erp_title = '''          {/* ERP Modules */}
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
          </div>'''

content = content.replace(old_erp_title, new_erp_title)

# Update the ERP Modules to have rounded corners matching the tools
old_erp_btn = '''                  className={`relative w-full flex items-center justify-between px-3 py-2 rounded-xl border text-right group transition-all duration-200 ${
                    isActive
                      ? isDarkMode 
                         ? "text-indigo-300 ring-1 ring-indigo-500/10 shadow-[0_0_12px_rgba(99,102,241,0.08)] font-bold"
                        : "text-indigo-700 ring-1 ring-indigo-600/5 shadow-[0_0_12px_rgba(79,70,229,0.05)] font-bold"
                      : isDarkMode
                        ? "border-transparent text-slate-400 hover:bg-slate-800/40 hover:text-white"
                        : "border-transparent text-slate-600 hover:bg-slate-200/40 hover:text-slate-900"
                  }`}'''

new_erp_btn = '''                  className={`relative w-full flex items-center justify-between px-3 py-2 rounded-xl border text-right group transition-all duration-300 ${
                    isActive
                      ? isDarkMode 
                         ? "text-indigo-300 ring-1 ring-indigo-500/20 bg-gradient-to-r from-indigo-500/10 to-transparent shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] font-bold"
                        : "text-indigo-700 ring-1 ring-indigo-600/20 bg-gradient-to-r from-indigo-50 to-transparent shadow-sm font-bold"
                      : isDarkMode
                        ? "border-transparent text-slate-400 hover:bg-slate-800/50 hover:border-slate-700/50 hover:text-slate-200"
                        : "border-transparent text-slate-600 hover:bg-slate-50 hover:border-slate-200 hover:text-slate-900"
                  }`}'''

content = content.replace(old_erp_btn, new_erp_btn)


# And also enhance the icons inside ERP modules
old_erp_icon = '''                    <IconComponent className={`h-4 w-4 shrink-0 transition-colors ${isActive ? "text-indigo-500" : isDarkMode ? "text-slate-500 group-hover:text-indigo-400" : "text-slate-400 group-hover:text-indigo-600"}`} />'''

new_erp_icon = '''                    <div className={`p-1.5 rounded-lg shrink-0 transition-colors ${
                      isActive 
                        ? isDarkMode ? "bg-indigo-500/20" : "bg-indigo-100" 
                        : isDarkMode ? "bg-slate-800 group-hover:bg-slate-700" : "bg-slate-100 group-hover:bg-slate-200"
                    }`}>
                      <IconComponent className={`h-4 w-4 shrink-0 transition-colors ${isActive ? "text-indigo-500" : isDarkMode ? "text-slate-400 group-hover:text-indigo-400" : "text-slate-500 group-hover:text-indigo-600"}`} />
                    </div>'''
content = content.replace(old_erp_icon, new_erp_icon)

open('src/App.tsx', 'w').write(content)
print("Successfully patched tools and ERP section UI")
