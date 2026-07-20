import sys

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Find the corruption start
idx_start = content.find('<span className={`animate-ping absolute inline-flex h-full w-full rounded-full opaci')
if idx_start == -1:
    print("Could not find corruption start")
    sys.exit(1)

# 2. Find the corruption end (the end of the first '۱. مغز پردازشگر هوش مصنوعی (مدل):' block that got inserted)
idx_end = content.find('<div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">:bg-blue-500 text-white shadow-sm"')
if idx_end != -1:
    idx_end = idx_end + len('<div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">')

print(f"Replacing from {idx_start} to {idx_end}")

# 3. The deleted content to restore:
deleted_content = """<span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  activeFile?.status === "processing" ? "bg-amber-400" : "bg-emerald-400"
                }`}></span>
                <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
                  activeFile?.status === "processing" ? "bg-amber-500" : "bg-emerald-500"
                }`}></span>
              </span>
              <span>
                {activeFile?.status === "processing" ? "در حال تحلیل هوشمند..." : "آماده تفکیک خودکار اسناد"}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 md:gap-2">
            <button
              onClick={() => setIsAuditLogsOpen(true)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all border text-[10px] font-bold ${
                isDarkMode 
                  ? "bg-slate-800/40 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 hover:border-slate-700" 
                  : "bg-slate-50/50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800"
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
                  : "bg-slate-50/50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800"
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
                    : "bg-slate-50/50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800"
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
                  : "bg-slate-50/50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800"
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
          </div>
        </header>

        {/* Workspace body */}
        {false ? null : (
          <div className="flex-1 overflow-y-auto p-4 flex flex-col">
          {/* Conditional Layout: Hidden when no file is uploaded! */}
          {!activeFile ? (
            <div className="flex-1 flex items-center justify-center p-4">
              {pendingFile ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.99, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="relative max-w-5xl md:max-w-6xl w-full text-right"
                  dir="rtl"
                >
                  <div className={`absolute -inset-1.5 blur-2xl opacity-10 rounded-3xl ${isDarkMode ? "bg-blue-500" : "bg-blue-400"}`}></div>
                  <div className={`relative rounded-3xl border p-6 w-full transition-all duration-300 ${
                    isDarkMode 
                      ? "bg-slate-900/95 backdrop-blur-2xl border-slate-800/80 shadow-[0_20px_50px_rgba(0,0,0,0.3)]" 
                      : "bg-white/95 backdrop-blur-2xl border-slate-200/80 shadow-[0_20px_50px_rgba(15,23,42,0.06)]"
                  }`}>
                    
                    {/* Header: Clean, Compact */}
                    <div className="flex items-start justify-between gap-4 mb-5 pb-4 border-b border-slate-100 dark:border-slate-800/60">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isDarkMode ? "bg-blue-500/10 text-blue-400 border border-blue-500/15" : "bg-blue-50 text-blue-600 border border-blue-100"
                        }`}>
                          <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                          <h2 className={`text-[15px] font-black tracking-tight ${isDarkMode ? "text-slate-100" : "text-slate-800"}`}>
                            تنظیمات هوش مصنوعی و راهنمای استخراج
                          </h2>
                          <p className={`text-[10.5px] mt-0.5 leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                            می‌توانید دستورالعمل خاصی را به دستیار بگویید یا بدون پرامپت شروع کنید.
                          </p>
                        </div>
                      </div>

                      {/* File Mini-Card (Extremely Minimalist) */}
                      <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border max-w-[180px] shrink-0 ${
                        isDarkMode ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-250/50"
                      }`}>
                        {pendingFile.mimeType === "application/pdf" ? (
                          <PdfThumbnail base64={pendingFile.base64} className="w-5 h-5 rounded-md shrink-0 border border-slate-300/30" isDarkMode={isDarkMode} />
                        ) : (
                          <div className="w-5 h-5 rounded-md overflow-hidden shrink-0 border border-slate-300/30">
                            <img 
                              src={`data:${pendingFile.mimeType};base64,${pendingFile.base64}`} 
                              alt="" 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        )}
                        <div className="min-w-0 text-right">
                          <p className={`text-[9.5px] font-bold truncate ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                            {pendingFile.name}
                          </p>
                          <p className={`text-[8.5px] font-mono leading-none ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
                            {Math.round(pendingFile.size / 1024)} KB
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Main Area: Simple Settings Layout */}
                    <div className="flex flex-col gap-6 mt-4 pb-2">
                      <div className="flex flex-col gap-5 animate-fadeIn text-right" dir="rtl">
                        {/* Model Selector */}
                        <div className="flex flex-col gap-2">
                          <label className={`text-[11.5px] font-black flex items-center gap-1.5 ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>
                            <Cpu className="w-4 h-4 text-blue-500" />
                            ۱. مغز پردازشگر هوش مصنوعی (مدل):
                          </label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">"""

new_content = content[:idx_start] + deleted_content + content[idx_end:]

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(new_content)

