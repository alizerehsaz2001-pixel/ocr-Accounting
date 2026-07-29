import sys

with open("src/App.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add Menu and ChevronDown to imports if not present
if "Menu," not in content and "Menu " not in content:
    content = content.replace("import {\n  Landmark,", "import {\n  Menu,\n  ChevronDown,\n  Landmark,")

# 2. Add isTopLeftMenuOpen state
if "const [isTopLeftMenuOpen, setIsTopLeftMenuOpen] = useState(false);" not in content:
    content = content.replace(
        "const [isAiSettingsOpen, setIsAiSettingsOpen] = useState(false);",
        "const [isAiSettingsOpen, setIsAiSettingsOpen] = useState(false);\n  const [isTopLeftMenuOpen, setIsTopLeftMenuOpen] = useState(false);"
    )

# 3. Add handleDownloadFullBackup function
if "const handleDownloadFullBackup =" not in content:
    backup_fn = """  const handleDownloadFullBackup = () => {
    try {
      const backupData = {
        version: "2.5",
        exportDate: new Date().toISOString(),
        user: currentUser?.email || "کاربر عمومی",
        scansCount: previousScans.length,
        transactionsCount: transactions.length,
        previousScans,
        transactions,
        userDefinedFolders
      };
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ocr_accounting_full_backup_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showNotification("فایل پشتیبان کامل داده‌ها با موفقیت دانلود شد.", "success");
      logEvent("پشتیبان‌گیری کامل", "کاربر نسخه کامل JSON از کل اطلاعات را دانلود کرد.");
    } catch (e) {
      showNotification("خطا در ایجاد فایل پشتیبان داده‌ها", "error");
    }
  };
"""
    content = content.replace(
        "const handleOpenProtectedPanel = (target: \"admin\" | \"user\") => {",
        backup_fn + "\n  const handleOpenProtectedPanel = (target: \"admin\" | \"user\") => {"
    )

# 4. Enhance the Top-Left Header Buttons area with the new interactive Top-Left Dropdown Menu
old_header_buttons = """          <div className="flex items-center gap-1.5 md:gap-2">
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
            )}
            <button
              onClick={() => handleOpenProtectedPanel("user")}
              className={`p-1.5 rounded-lg transition-all border ${
                isDarkMode 
                  ? "bg-slate-800/40 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 hover:border-slate-700" 
                  : "bg-slate-50 border-slate-200 shadow-sm text-slate-600 hover:bg-slate-100 hover:text-slate-800"
              }`}
              title="پنل کاربری و API Keys"
            >
              <User className="h-3.5 w-3.5 text-emerald-400 dark:text-emerald-500" />
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-[10px] font-bold shadow-sm hover:shadow hover:-translate-y-0.5 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden xs:inline">آپلود سند جدید</span>
            </button>
          </div>"""

new_header_buttons = """          <div className="flex items-center gap-1.5 md:gap-2 relative">
            {/* Top Left Interactive Dropdown Menu */}
            <div className="relative">
              <button
                onClick={() => setIsTopLeftMenuOpen(!isTopLeftMenuOpen)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all border text-[11px] font-extrabold cursor-pointer shadow-sm ${
                  isTopLeftMenuOpen
                    ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white border-indigo-500 shadow-indigo-500/20"
                    : isDarkMode
                      ? "bg-slate-800/70 border-slate-700 text-slate-200 hover:bg-slate-800 hover:border-slate-600 hover:text-white"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:text-indigo-600"
                }`}
                title="منوی اصلی و امکانات سریع سامانه"
              >
                <Menu className="w-3.5 h-3.5 text-indigo-400 dark:text-indigo-400 shrink-0" />
                <span className="hidden xs:inline font-bold">منوی امکانات</span>
                <ChevronDown className={`w-3 h-3 opacity-80 transition-transform duration-200 ${isTopLeftMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Backdrop Overlay */}
              {isTopLeftMenuOpen && (
                <div 
                  className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[1px]" 
                  onClick={() => setIsTopLeftMenuOpen(false)} 
                />
              )}

              {/* Top Left Menu Dropdown Popover */}
              {isTopLeftMenuOpen && (
                <div className={`absolute left-0 top-full mt-2 w-80 z-50 rounded-2xl shadow-2xl border p-3.5 backdrop-blur-2xl transition-all duration-200 animate-in fade-in slide-in-from-top-2 text-right ${
                  isDarkMode
                    ? "bg-slate-900/95 border-slate-800 text-slate-100 shadow-slate-950/80"
                    : "bg-white/95 border-slate-200/90 text-slate-800 shadow-indigo-950/10"
                }`}>
                  {/* Menu Header Card: User & System Status */}
                  <div className={`p-3 rounded-xl mb-3 border flex items-center justify-between ${
                    isDarkMode ? "bg-slate-800/60 border-slate-700/60" : "bg-slate-50 border-slate-200/80"
                  }`}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-white flex items-center justify-center font-black text-xs shadow-md">
                        {currentUser?.name ? currentUser.name.charAt(0) : "U"}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-black truncate max-w-[150px]">
                          {currentUser?.email || "کاربر سامانه OCR"}
                        </span>
                        <span className="text-[9px] font-bold text-emerald-500 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          {currentUser?.role === "admin" ? "مدیر ارشد سیستم" : "حسابدار ارشد"}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsTopLeftMenuOpen(false)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Storage bar indicator in menu */}
                  <div className="mb-3.5 px-1">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-1">
                      <span>حافظه ابری اسناد:</span>
                      <span className="text-indigo-400 font-mono">
                        {((previousScans.reduce((acc, scan) => acc + (scan.file?.size || 0), 0)) / (1024 * 1024)).toFixed(1)}MB / 5GB
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-300" 
                        style={{ width: `${Math.min(100, (previousScans.reduce((acc, scan) => acc + (scan.file?.size || 0), 0) / (5000 * 1024 * 1024)) * 100 + 5)}%` }}
                      />
                    </div>
                  </div>

                  {/* Section 1: Quick Action Tools */}
                  <div className="space-y-1 mb-3">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-2 mb-1">
                      امکانات و ابزارهای اصلی
                    </div>
                    
                    <button
                      onClick={() => {
                        setIsTopLeftMenuOpen(false);
                        fileInputRef.current?.click();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isDarkMode ? "hover:bg-slate-800 text-slate-200" : "hover:bg-indigo-50 text-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Upload className="w-3.5 h-3.5 text-blue-500" />
                        <span>آپلود و تفکیک هوشمند اسناد</span>
                      </div>
                      <span className="text-[9px] bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded font-mono">Quick</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsTopLeftMenuOpen(false);
                        setIsFileManagerOpen(true);
                        logEvent("مشاهده فایل‌ها", "کاربر از منوی اصلی وارد مدیریت فایل‌ها شد.");
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isDarkMode ? "hover:bg-slate-800 text-slate-200" : "hover:bg-indigo-50 text-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <HardDrive className="w-3.5 h-3.5 text-indigo-500" />
                        <span>مدیریت کامل فایل‌ها و پوشه‌ها</span>
                      </div>
                      <span className="text-[9px] font-mono text-slate-400">{previousScans.length} سند</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsTopLeftMenuOpen(false);
                        setIsAiSettingsOpen(true);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isDarkMode ? "hover:bg-slate-800 text-slate-200" : "hover:bg-indigo-50 text-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Settings className="w-3.5 h-3.5 text-fuchsia-500" />
                        <span>تنظیمات مدل‌های AI و دستورات</span>
                      </div>
                      <span className="text-[9px] text-fuchsia-400 font-mono">{selectedModel.split("-")[1] || "AI"}</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsTopLeftMenuOpen(false);
                        setIsAuditLogsOpen(true);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isDarkMode ? "hover:bg-slate-800 text-slate-200" : "hover:bg-indigo-50 text-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5 text-emerald-500" />
                        <span>سیاهه رویدادها و گزارش‌ها</span>
                      </div>
                      <span className="text-[9px] text-emerald-500 font-mono">Logs</span>
                    </button>
                  </div>

                  <div className="h-px bg-slate-200 dark:bg-slate-800 my-2" />

                  {/* Section 2: Data Exports & Security */}
                  <div className="space-y-1 mb-3">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-2 mb-1">
                      خروجی داده‌ها و امنیت
                    </div>

                    <button
                      onClick={() => {
                        setIsTopLeftMenuOpen(false);
                        setIsExcelExportModalOpen(true);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isDarkMode ? "hover:bg-slate-800 text-slate-200" : "hover:bg-indigo-50 text-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                        <span>خروجی پیشرفته اکسل (Excel)</span>
                      </div>
                      <Download className="w-3 h-3 text-slate-400" />
                    </button>

                    <button
                      onClick={() => {
                        setIsTopLeftMenuOpen(false);
                        handleDownloadFullBackup();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isDarkMode ? "hover:bg-slate-800 text-slate-200" : "hover:bg-indigo-50 text-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Database className="w-3.5 h-3.5 text-amber-500" />
                        <span>پشتیبان‌گیری کامل به JSON</span>
                      </div>
                      <Download className="w-3 h-3 text-slate-400" />
                    </button>

                    <button
                      onClick={() => {
                        setIsTopLeftMenuOpen(false);
                        handleOpenProtectedPanel("user");
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isDarkMode ? "hover:bg-slate-800 text-slate-200" : "hover:bg-indigo-50 text-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-cyan-500" />
                        <span>پنل کاربری و API Keys</span>
                      </div>
                      <Key className="w-3 h-3 text-slate-400" />
                    </button>

                    {currentUser?.role === "admin" && (
                      <button
                        onClick={() => {
                          setIsTopLeftMenuOpen(false);
                          handleOpenProtectedPanel("admin");
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isDarkMode ? "hover:bg-slate-800 text-slate-200" : "hover:bg-indigo-50 text-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Shield className="w-3.5 h-3.5 text-rose-500" />
                          <span>پنل مدیریت ارشد سامانه</span>
                        </div>
                        <Shield className="w-3 h-3 text-rose-400" />
                      </button>
                    )}
                  </div>

                  <div className="h-px bg-slate-200 dark:bg-slate-800 my-2" />

                  {/* Section 3: System Preferences */}
                  <div className="flex items-center justify-between pt-1 px-1">
                    <button
                      onClick={() => setIsDarkMode(!isDarkMode)}
                      className={`p-2 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all ${
                        isDarkMode
                          ? "bg-slate-800 border-slate-700 text-amber-300 hover:bg-slate-750"
                          : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
                      }`}
                      title="تغییر حالت روز و شب"
                    >
                      {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
                      <span>{isDarkMode ? "حالت روز" : "حالت شب"}</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsTopLeftMenuOpen(false);
                        setShowOnboarding(true);
                      }}
                      className={`p-2 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all ${
                        isDarkMode
                          ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750"
                          : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200"
                      }`}
                      title="راهنمای تعاملی سامانه"
                    >
                      <HelpCircle className="w-4 h-4 text-indigo-400" />
                      <span>راهنما</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Direct Quick Action Shortcuts */}
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
            )}
            <button
              onClick={() => handleOpenProtectedPanel("user")}
              className={`p-1.5 rounded-lg transition-all border ${
                isDarkMode 
                  ? "bg-slate-800/40 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 hover:border-slate-700" 
                  : "bg-slate-50 border-slate-200 shadow-sm text-slate-600 hover:bg-slate-100 hover:text-slate-800"
              }`}
              title="پنل کاربری و API Keys"
            >
              <User className="h-3.5 w-3.5 text-emerald-400 dark:text-emerald-500" />
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-[10px] font-bold shadow-sm hover:shadow hover:-translate-y-0.5 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden xs:inline">آپلود سند جدید</span>
            </button>
          </div>"""

if old_header_buttons in content:
    content = content.replace(old_header_buttons, new_header_buttons)
    print("Replaced header buttons successfully!")
else:
    print("Error: Could not find exact old_header_buttons match.")

with open("src/App.tsx", "w", encoding="utf-8") as f:
    f.write(content)
