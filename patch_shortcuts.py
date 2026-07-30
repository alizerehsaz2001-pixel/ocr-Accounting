import sys

with open("src/App.tsx", "r", encoding="utf-8") as f:
    content = f.read()

target_start = """            {/* Direct Quick Action Shortcuts */}
            <button
              onClick={() => setIsAuditLogsOpen(true)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all border text-[10px] font-bold ${
                isDarkMode 
                  ? "bg-slate-800/40 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 hover:border-slate-700" 
                  : "bg-slate-50 border-slate-200 shadow-sm text-slate-600 hover:bg-slate-100 hover:text-slate-800"
              }`}
              title="سیاهه رویدادها (گزارش‌گیری)"
            >
              <Activity className="h-3.5 w-3.5 text-indigo-400 dark:text-indigo-500 shrink-0" />
              <span className="hidden sm:inline">سیاهه رویدادها</span>
            </button>
            <button
              onClick={() => {
                setIsFileManagerOpen(true);
                logEvent("مشاهده فایل‌ها", "کاربر بخش مدیریت فایل‌ها و وضعیت حافظه را باز کرد.");
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all border text-[10px] font-bold ${
                isDarkMode 
                  ? "bg-slate-800/40 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 hover:border-slate-700" 
                  : "bg-slate-50 border-slate-200 shadow-sm text-slate-600 hover:bg-slate-100 hover:text-slate-800"
              }`}
              title="مدیریت اسناد و فایل‌ها (فضای ابری)"
            >
              <HardDrive className="h-3.5 w-3.5 text-blue-400 dark:text-blue-500 shrink-0" />
              <span className="hidden sm:inline">مدیریت فایل‌ها</span>
            </button>
            {currentUser?.role === "admin" && (
              <button
                onClick={() => handleOpenProtectedPanel("admin")}
                className={`p-1.5 rounded-lg transition-all border ${
                  isDarkMode 
                    ? "bg-slate-800/40 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 hover:border-slate-700" 
                    : "bg-slate-50 border-slate-200 shadow-sm text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                }`}
                title="پنل مدیریت سامانه"
              >
                <Shield className="h-3.5 w-3.5 text-rose-400 dark:text-rose-500" />
              </button>
            )}"""

new_shortcuts = """            {/* Direct Quick Action Shortcuts */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsAuditLogsOpen(true)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-colors text-[11px] font-bold ${
                  isDarkMode 
                    ? "text-slate-400 hover:text-indigo-400 hover:bg-slate-800" 
                    : "text-slate-500 hover:text-indigo-600 hover:bg-slate-100"
                }`}
                title="سیاهه رویدادها"
              >
                <Activity className="h-4 w-4 shrink-0 opacity-80" />
                <span className="hidden sm:inline">گزارش‌ها</span>
              </button>
              
              <button
                onClick={() => {
                  setIsFileManagerOpen(true);
                  logEvent("مشاهده فایل‌ها", "کاربر بخش مدیریت فایل‌ها را باز کرد.");
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-colors text-[11px] font-bold ${
                  isDarkMode 
                    ? "text-slate-400 hover:text-blue-400 hover:bg-slate-800" 
                    : "text-slate-500 hover:text-blue-600 hover:bg-slate-100"
                }`}
                title="مدیریت اسناد"
              >
                <HardDrive className="h-4 w-4 shrink-0 opacity-80" />
                <span className="hidden sm:inline">فایل‌ها</span>
              </button>

              {currentUser?.role === "admin" && (
                <button
                  onClick={() => handleOpenProtectedPanel("admin")}
                  className={`p-1.5 rounded-md transition-colors ${
                    isDarkMode 
                      ? "text-slate-400 hover:text-rose-400 hover:bg-slate-800" 
                      : "text-slate-500 hover:text-rose-600 hover:bg-slate-100"
                  }`}
                  title="پنل مدیریت"
                >
                  <Shield className="w-4 h-4 shrink-0 opacity-80" />
                </button>
              )}
            </div>"""

if target_start in content:
    content = content.replace(target_start, new_shortcuts)
    with open("src/App.tsx", "w", encoding="utf-8") as f:
        f.write(content)
    print("Shortcuts replaced successfully.")
else:
    print("Target block not found.")
