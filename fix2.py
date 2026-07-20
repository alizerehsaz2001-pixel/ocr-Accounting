import sys

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

start_str = "              {pendingFile ? ("
idx_start = content.find(start_str)

end_str = """              ) : (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.98, y: 10 }}"""
idx_end = content.find(end_str)

if idx_start == -1 or idx_end == -1:
    print("Could not find boundaries")
    sys.exit(1)

new_content = """              {pendingFile ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.99, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="relative max-w-2xl w-full text-right"
                  dir="rtl"
                >
                  <div className={`absolute -inset-1.5 blur-2xl opacity-10 rounded-3xl ${isDarkMode ? "bg-blue-500" : "bg-blue-400"}`}></div>
                  <div className={`relative rounded-3xl border p-6 w-full transition-all duration-300 ${
                    isDarkMode 
                      ? "bg-slate-900/95 backdrop-blur-2xl border-slate-800/80 shadow-[0_20px_50px_rgba(0,0,0,0.3)]" 
                      : "bg-white/95 backdrop-blur-2xl border-slate-200/80 shadow-[0_20px_50px_rgba(15,23,42,0.06)]"
                  }`}>
                    
                    {/* Header */}
                    <div className="flex items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-100 dark:border-slate-800/60">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isDarkMode ? "bg-blue-500/10 text-blue-400 border border-blue-500/15" : "bg-blue-50 text-blue-600 border border-blue-100"
                        }`}>
                          <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                          <h2 className={`text-[15px] font-black tracking-tight ${isDarkMode ? "text-slate-100" : "text-slate-800"}`}>
                            تنظیمات استخراج سند
                          </h2>
                        </div>
                      </div>
                      <div className="text-right">
                         <p className={`text-[10px] font-bold truncate max-w-[150px] ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>{pendingFile.name}</p>
                         <p className={`text-[9px] ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>{Math.round(pendingFile.size / 1024)} KB</p>
                      </div>
                    </div>

                    {/* Simple Settings */}
                    {isExtracting ? (
                      <div className="flex flex-col gap-4 py-8 items-center justify-center">
                         <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                         <p className={`text-[12px] font-bold ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>در حال پردازش هوشمند سند...</p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-5">
                        {/* Model */}
                        <div className="flex flex-col gap-2">
                          <label className={`text-[11px] font-bold flex items-center gap-1.5 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                             <Cpu className="w-3.5 h-3.5 text-blue-500" /> مدل پردازشی:
                          </label>
                          <select 
                             value={selectedModel}
                             onChange={(e) => setSelectedModel(e.target.value)}
                             className={`w-full p-2.5 rounded-xl border text-[11px] font-bold outline-none cursor-pointer ${isDarkMode ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-800"}`}
                          >
                             <option value="gemini-3.5-flash">Gemini 3.5 Flash (سریع و اقتصادی)</option>
                             <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (دقیق و تحلیلی)</option>
                          </select>
                        </div>

                        {/* ERP Module */}
                        <div className="flex flex-col gap-2">
                          <label className={`text-[11px] font-bold flex items-center gap-1.5 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                             <Database className="w-3.5 h-3.5 text-emerald-500" /> ماژول مقصد:
                          </label>
                          <select 
                             value={erpDestinationModule}
                             onChange={(e) => setErpDestinationModule(e.target.value)}
                             className={`w-full p-2.5 rounded-xl border text-[11px] font-bold outline-none cursor-pointer ${isDarkMode ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-800"}`}
                          >
                             <option value="general-ledger">دفتر کل (General Ledger)</option>
                             <option value="accounts-payable">حساب‌های پرداختی (AP)</option>
                             <option value="accounts-receivable">حساب‌های دریافتی (AR)</option>
                             <option value="inventory">انبار و کالا (Inventory)</option>
                          </select>
                        </div>

                        {/* Strictness */}
                        <div className="flex flex-col gap-2">
                          <label className={`text-[11px] font-bold flex items-center gap-1.5 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                             <Shield className="w-3.5 h-3.5 text-indigo-500" /> دقت و سخت‌گیری:
                          </label>
                          <select 
                             value={strictnessMode}
                             onChange={(e) => setStrictnessMode(e.target.value as any)}
                             className={`w-full p-2.5 rounded-xl border text-[11px] font-bold outline-none cursor-pointer ${isDarkMode ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-800"}`}
                          >
                             <option value="speed">حالت سریع (Fast)</option>
                             <option value="balanced">حالت متعادل (Balanced)</option>
                             <option value="audit">ممیزی سخت‌گیرانه (Strict Audit)</option>
                          </select>
                        </div>

                        {/* Custom Prompt */}
                        <div className="flex flex-col gap-2">
                          <label className={`text-[11px] font-bold flex items-center gap-1.5 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                             <FileEdit className="w-3.5 h-3.5 text-purple-500" /> پرامپت اختصاصی (اختیاری):
                          </label>
                          <textarea
                            rows={2}
                            value={customPrompt}
                            onChange={(e) => setCustomPrompt(e.target.value)}
                            placeholder="دستورالعمل خاصی اگر دارید بنویسید..."
                            className={`w-full p-2.5 rounded-xl border text-[11px] outline-none resize-none ${isDarkMode ? "bg-slate-950 border-slate-800 text-slate-200 focus:border-blue-500/50" : "bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500/50"}`}
                          />
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/60">
                          <button
                            onClick={() => {
                              setPendingFile(null);
                              setCustomPrompt("");
                            }}
                            className={`px-4 py-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${isDarkMode ? "bg-slate-800 hover:bg-slate-700 text-slate-300" : "bg-slate-100 hover:bg-slate-200 text-slate-600"}`}
                          >
                            انصراف
                          </button>
                          <button
                            onClick={handleDirectExtraction}
                            className="px-6 py-2 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all bg-blue-600 hover:bg-blue-500 text-white shadow-md cursor-pointer hover:-translate-y-0.5"
                          >
                            <Sparkles className="w-3.5 h-3.5 shrink-0 text-blue-200 animate-pulse" />
                            <span>شروع استخراج</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
"""

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content[:idx_start] + new_content + content[idx_end:])

