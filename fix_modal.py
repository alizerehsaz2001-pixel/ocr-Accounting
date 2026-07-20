import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

modal_code = """      <AnimatePresence>
        {isAiSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" dir="rtl">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`absolute inset-0 backdrop-blur-sm ${isDarkMode ? "bg-slate-900/80" : "bg-slate-800/40"}`}
              onClick={() => setIsAiSettingsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl border flex flex-col ${
                isDarkMode ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"
              }`}
            >
              {/* Header */}
              <div className={`sticky top-0 z-10 flex items-center justify-between p-4 md:p-5 border-b backdrop-blur-md ${isDarkMode ? "bg-slate-900/80 border-slate-800" : "bg-white/80 border-slate-100"}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${isDarkMode ? "bg-fuchsia-500/10 text-fuchsia-400" : "bg-fuchsia-50 text-fuchsia-600"}`}>
                    <Settings className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className={`font-black text-[15px] ${isDarkMode ? "text-slate-100" : "text-slate-800"}`}>
                      تنظیمات هوش مصنوعی و راهنمای استخراج
                    </h2>
                    <p className={`text-[10px] mt-0.5 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                      پیکربندی پردازش اسناد و آپلود مستقیم
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAiSettingsOpen(false)}
                  className={`p-2 rounded-xl transition-colors ${isDarkMode ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-500"}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-4 md:p-6 flex flex-col gap-6">
                
                {/* Upload Zone */}
                <div className="flex flex-col gap-2">
                  <label className={`text-[11.5px] font-black flex items-center gap-1.5 ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>
                    <UploadCloud className="w-4 h-4 text-blue-500" /> آپلود مستقیم سند:
                  </label>
                  <div 
                    onClick={() => {
                      setIsAiSettingsOpen(false);
                      fileInputRef.current?.click();
                    }}
                    className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer overflow-hidden transition-all duration-300 group ${
                      isDarkMode
                        ? "border-slate-700 bg-slate-800/50 hover:bg-slate-800/80 hover:border-blue-500/50"
                        : "border-slate-300 bg-slate-50 hover:bg-slate-100/80 hover:border-blue-500/40"
                    }`}
                  >
                    <div className={`p-3 rounded-full mb-3 transition-transform group-hover:-translate-y-1 ${isDarkMode ? "bg-slate-800 text-slate-300" : "bg-white shadow-sm text-slate-600"}`}>
                       <FileJson className="w-6 h-6" />
                    </div>
                    <p className={`text-[11px] font-bold ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>برای آپلود کلیک کنید</p>
                    <p className={`text-[9.5px] mt-1 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>پشتیبانی از PDF و تصاویر</p>
                  </div>
                </div>

                {/* Model */}
                <div className="flex flex-col gap-2">
                  <label className={`text-[11.5px] font-black flex items-center gap-1.5 ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>
                    <Cpu className="w-4 h-4 text-blue-500" />
                    مغز پردازشگر هوش مصنوعی (مدل):
                  </label>
                  <select 
                     value={selectedModel}
                     onChange={(e) => setSelectedModel(e.target.value)}
                     className={`w-full p-3 rounded-xl border text-[11px] font-bold outline-none cursor-pointer ${isDarkMode ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-800"}`}
                  >
                     <option value="gemini-3.5-flash">Gemini 3.5 Flash (سریع و اقتصادی)</option>
                     <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (دقیق و تحلیلی)</option>
                  </select>
                </div>

                {/* ERP Module */}
                <div className="flex flex-col gap-2">
                  <label className={`text-[11.5px] font-black flex items-center gap-1.5 ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>
                    <Database className="w-4 h-4 text-emerald-500" /> ماژول مقصد:
                  </label>
                  <select 
                     value={erpDestinationModule}
                     onChange={(e) => setErpDestinationModule(e.target.value)}
                     className={`w-full p-3 rounded-xl border text-[11px] font-bold outline-none cursor-pointer ${isDarkMode ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-800"}`}
                  >
                     <option value="general-ledger">دفتر کل (General Ledger)</option>
                     <option value="accounts-payable">حساب‌های پرداختی (AP)</option>
                     <option value="accounts-receivable">حساب‌های دریافتی (AR)</option>
                     <option value="inventory">انبار و کالا (Inventory)</option>
                  </select>
                </div>

                {/* Strictness */}
                <div className="flex flex-col gap-2">
                  <label className={`text-[11.5px] font-black flex items-center gap-1.5 ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>
                    <Shield className="w-4 h-4 text-indigo-500" /> دقت و سخت‌گیری:
                  </label>
                  <select 
                     value={strictnessMode}
                     onChange={(e) => setStrictnessMode(e.target.value as any)}
                     className={`w-full p-3 rounded-xl border text-[11px] font-bold outline-none cursor-pointer ${isDarkMode ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-800"}`}
                  >
                     <option value="speed">حالت سریع (Fast)</option>
                     <option value="balanced">حالت متعادل (Balanced)</option>
                     <option value="audit">ممیزی سخت‌گیرانه (Strict Audit)</option>
                  </select>
                </div>
                
                {/* Custom Prompt */}
                <div className="flex flex-col gap-2">
                  <label className={`text-[11.5px] font-black flex items-center gap-1.5 ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>
                    <FileEdit className="w-4 h-4 text-purple-500" /> پرامپت اختصاصی (اختیاری):
                  </label>
                  <textarea
                    rows={2}
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="دستورالعمل خاصی اگر دارید بنویسید..."
                    className={`w-full p-3 rounded-xl border text-[11px] outline-none resize-none ${isDarkMode ? "bg-slate-950 border-slate-800 text-slate-200 focus:border-blue-500/50" : "bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500/50"}`}
                  />
                </div>
                
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
"""

content = content.replace("      <AnimatePresence>\n        <OnboardingModal ", modal_code + "\n      <AnimatePresence>\n        <OnboardingModal ")

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
