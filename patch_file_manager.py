import sys

with open("src/App.tsx", "r", encoding="utf-8") as f:
    content = f.read()

target_start = """      {/* File Manager Modal */}
      {isFileManagerOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6">
          <div 
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setIsFileManagerOpen(false)}
          ></div>
          
          <div className={`relative w-full max-w-6xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up transform transition-all ${
            isDarkMode ? "bg-slate-900 border border-slate-800 text-slate-200" : "bg-white border-slate-200 text-slate-800"
          }`} dir="rtl">
            <div className={`p-5 border-b flex items-center justify-between shrink-0 ${isDarkMode ? "bg-slate-800/80 border-slate-700" : "bg-slate-50/80 border-slate-100"}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${isDarkMode ? "bg-indigo-650/20 text-indigo-400" : "bg-indigo-50 text-indigo-600"}`}>
                  <HardDrive className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base">پیشخوان مدیریت فایل و فضا ابری هوشمند</h3>
                  <p className={`text-[11px] mt-0.5 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                    فضای اختصاصی اختصاص یافته: <span className="font-bold text-emerald-500">{(5 + (currentUser?.extraStorage || 0)).toLocaleString("fa-IR")} گیگابایت</span> {(currentUser?.extraStorage || 0) > 0 && `(۵ گیگ پایه + ${currentUser.extraStorage} گیگ اهدایی ادمین)`}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsFileManagerOpen(false)}
                className={`p-2 rounded-lg transition-colors ${isDarkMode ? "hover:bg-slate-800 text-slate-400 hover:text-white" : "hover:bg-slate-200 text-slate-500 hover:text-slate-900"}`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>"""

new_header = """      {/* File Manager Modal */}
      {isFileManagerOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
            onClick={() => setIsFileManagerOpen(false)}
          ></div>
          
          <div className={`relative w-full max-w-6xl max-h-[90vh] h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up transform transition-all ${
            isDarkMode ? "bg-[#0b1120] border border-slate-800 text-slate-200 shadow-black/50" : "bg-white border border-slate-200 text-slate-800 shadow-slate-200/50"
          }`} dir="rtl">
            <div className={`px-6 py-4 border-b flex items-center justify-between shrink-0 ${isDarkMode ? "bg-[#0b1120]/80 border-slate-800/80" : "bg-white/80 border-slate-100"}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isDarkMode ? "bg-slate-800/50 text-indigo-400" : "bg-slate-100 text-indigo-600"}`}>
                  <HardDrive className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-[15px]">مدیریت اسناد و فضای ابری</h3>
              </div>
              <button 
                onClick={() => setIsFileManagerOpen(false)}
                className={`p-2 rounded-xl transition-colors ${isDarkMode ? "hover:bg-slate-800 text-slate-400 hover:text-white" : "hover:bg-slate-100 text-slate-500 hover:text-slate-900"}`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>"""

if target_start in content:
    content = content.replace(target_start, new_header)
    with open("src/App.tsx", "w", encoding="utf-8") as f:
        f.write(content)
    print("Header replaced successfully.")
else:
    print("Header target block not found.")
