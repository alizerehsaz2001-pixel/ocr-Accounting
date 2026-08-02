import re

with open('src/App.tsx', 'r') as f:
    lines = f.readlines()

# The error starts at line 5206. We need to delete lines 5206 to the end of the corrupted block, 
# and replace it with the removed text block from the first diff.

diff_str = """                          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-2">
                            <span className="text-[10px] text-slate-400">شناسنامه و ویژگی‌های سند (Document DNA)</span>
                            <Info className="w-3.5 h-3.5 text-indigo-500" />
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-[11px]">
                            <div className="flex flex-col gap-1">
                              <span className="text-slate-400 text-[9.5px]">نام فایل:</span>
                              <span className="font-bold truncate" title={activeFile?.name}>{activeFile?.name}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-slate-400 text-[9.5px]">نوع سند شناسایی‌شده:</span>
                              <span className="font-bold text-indigo-400">
                                {activeFile?.documentType || "نامشخص"}
                              </span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-slate-400 text-[9.5px]">حجم فایل:</span>
                              <span className="font-mono">{activeFile ? Math.round(activeFile.size / 1024) : 0} KB</span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-slate-400 text-[9.5px]">تعداد اقلام استخراج‌شده:</span>
                              <span className="font-bold text-emerald-500 font-mono">{transactions.length} ردیف</span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-slate-400 text-[9.5px]">مدل پردازشگر:</span>
                              <span className="font-bold text-amber-500">{selectedModel}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-slate-400 text-[9.5px]">کل توکن‌های مصرف‌شده:</span>
                              <span className="font-mono">{activeFile?.tokensUsed || 0} توکن</span>
                            </div>
                          </div>
                        </div>

                      </div>

                      {/* Pane 2: Extracted JSON */}
                      <div className="flex-1 flex flex-col min-h-[300px] lg:min-h-0 overflow-hidden bg-[#1E1E1E]">
                        
                        {/* Header bar of JSON block */}
                        <div className="px-4 py-2 border-b border-slate-800 bg-[#252526] flex justify-between items-center shrink-0">
                          <span className="text-[10px] text-slate-400 font-bold font-sans">کدهای استخراج شده JSON</span>
                          <div className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[8.5px] text-slate-400 font-sans">همگام‌سازی زنده فعال است</span>
                          </div>
                        </div>

                        {/* Textarea code block */}
                        <div className="flex-1 relative flex flex-col overflow-hidden">
                          {activeFile?.status === "processing" ? (
                            <div className="absolute inset-0 bg-[#1E1E1E] flex flex-col items-center justify-center text-slate-400 select-none">
                              <div className="h-6 w-6 animate-pulse rounded-full bg-blue-500 mb-2" />
                              <span className="text-xs">در حال پردازش داده‌ها...</span>
                            </div>
                          ) : (
                            <textarea
                              value={rawJsonText}
                              onChange={handleJsonTextChange}
                              placeholder="// دیتایی هنوز استخراج نشده است"
                              className="w-full flex-1 p-4 bg-[#1E1E1E] text-indigo-300 font-mono text-[11px] leading-relaxed outline-none border-none resize-none overflow-y-auto"
                              dir="ltr"
                            />
                          )}
                        </div>

                        {/* JSON status footer */}
                        <div className="p-3 bg-[#181818] border-t border-slate-800/80 text-[10px] select-none shrink-0 flex flex-col gap-2.5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            {jsonError ? (
                              <div className="flex items-center gap-2">
                                <span className="text-rose-400 flex items-center gap-1.5 font-bold">
                                  <AlertCircle className="h-3.5 w-3.5" />
                                  ساختار JSON نامعتبر است
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    try {
                                      const repaired = parseJsonToTableArray(rawJsonText);
                                      if (repaired.length > 0) {
                                        const formatted = JSON.stringify(repaired, null, 2);
                                        setRawJsonText(formatted);
                                        setConverterInputJson(formatted);
                                        setJsonError(null);
                                        showNotification("کدهای JSON با موفقیت اصلاح و بازسازی شد.", "success");
                                      }
                                    } catch (err) {
                                      showNotification("امکان بازسازی خودکار وجود نداشت. لطفا علامت‌گذاری‌ها را بررسی کنید.", "error");
                                    }
                                  }}
                                  className="text-[9px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30 transition cursor-pointer font-bold flex items-center gap-1"
                                >
                                  <Wrench className="w-3 h-3" />
                                  اصلاح و بازسازی خودکار
                                </button>
                              </div>
                            ) : (
                              <span className="text-emerald-400 flex items-center gap-1.5 font-bold">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                فرمت ساختار کاملاً معتبر است
                              </span>
                            )}

                            <div className="flex items-center gap-2">
                              <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white transition-colors bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60">
                                <input 
                                  type="checkbox" 
                                  checked={isJsonVerified}
                                  onChange={(e) => setIsJsonVerified(e.target.checked)}
                                  className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500/30 cursor-pointer"
                                />
                                <span className="font-bold text-slate-200 text-[10px]">تایید صحت اطلاعات</span>
                              </label>
                              
                              <button
                                type="button"
                                onClick={handleDownloadExcelFromJSON}
                                className="text-[10px] px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>تایید و انتقال به اکسل</span>
                              </button>
                            </div>
                          </div>
                          {jsonError && (
                            <div className="text-[9px] text-rose-300/80 bg-rose-950/40 p-2 rounded-lg border border-rose-900/40 whitespace-pre-wrap font-mono">
                              {jsonError}
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  </div>
                ) : (
                  /* Visual Audit and Confidence Analysis Tab */
                  <div className={`border flex-1 flex flex-col overflow-hidden shadow-md transition-all duration-300 ${
                    isDarkMode 
                      ? "bg-[#111827] border-slate-800 text-slate-100" 
                      : "bg-white border-slate-200 text-[#1A1A1B]"
                  } ${isFullscreen ? "rounded-none border-x-0" : "rounded-2xl"}`}>
                    {/* Header Summary Bar */}
                    <div className={`px-4 py-3.5 border-b flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors duration-300 ${
                      isDarkMode ? "bg-slate-900/90 border-slate-800" : "bg-gradient-to-r from-slate-50 via-blue-50/20 to-slate-50 border-slate-200"
                    }`}>
                      {/* Title & Description */}
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl shrink-0 shadow-sm ${
                          isDarkMode 
                            ? "bg-blue-500/15 text-blue-400 border border-blue-500/20" 
                            : "bg-blue-600 text-white shadow-blue-500/20 shadow-md"
                        }`}>
                          <Sparkles className="h-4 w-4 animate-pulse" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className={`text-xs md:text-sm font-black tracking-tight ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>
                              تحلیل صحت‌سنجی و میزان اطمینان استخراج
                            </h4>
                            <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                              هوش مصنوعی OCR
                            </span>
                          </div>
                          <p className={`text-[10px] mt-0.5 font-semibold ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                            ارزیابی ماتریسی سلامت داده‌ها، توازن بدهکار/بستانکار و کیفیت شناسایی قلم نوری
                          </p>
                        </div>
                      </div>

                      {/* File Badge */}
                      <div className={`text-[10px] font-bold px-3 py-1.5 rounded-xl flex items-center gap-2 self-start md:self-auto shadow-sm ${
                        isDarkMode ? "bg-[#0b0f19] text-slate-300 border border-slate-800" : "bg-white text-slate-700 border border-slate-200"
                      }`}>
                        <FileCode className="w-3.5 h-3.5 text-blue-500" />
                        <span>سند فعال:</span>
                        <span className="font-mono text-blue-500 font-extrabold dir-ltr">{activeFile.name}</span>
                      </div>
                    </div>

                      {activeFile.status === "success" && transactions.length > 0 && (() => {
                        const count = transactions.length;
                        const sumScores = transactions.reduce((acc, current) => acc + (current.ضریب_اطمینان ?? 100), 0);
                        const avgScore = Math.round(sumScores / count);
                        const countEdited = transactions.filter((tr, idx) => isRowEdited(tr, idx)).length;
                        
                        let ratingLabel = "عالی و معتبر";
                        let ringColor = "#10b981"; // emerald-500
                        let ratingBg = isDarkMode ? "bg-emerald-950/40 border-emerald-800/50 text-emerald-400" : "bg-emerald-50 border-emerald-200 text-emerald-700";
                        if (avgScore < 60) {
                          ratingLabel = "ضعیف و نیازمند چک";
                          ringColor = "#f43f5e"; // rose-500
                          ratingBg = isDarkMode ? "bg-rose-950/40 border-rose-800/50 text-rose-400" : "bg-rose-50 border-rose-200 text-rose-700";
                        } else if (avgScore < 85) {
                          ratingLabel = "متوسط و نیازمند بازبینی";
                          ringColor = "#f59e0b"; // amber-500
                          ratingBg = isDarkMode ? "bg-amber-950/40 border-amber-800/50 text-amber-400" : "bg-amber-50 border-amber-200 text-amber-700";
                        }

                        const lowConfidenceCount = transactions.filter(tr => (tr.ضریب_اطمینان ?? 100) < 70).length;
                        const mediumConfidenceCount = transactions.filter(tr => (tr.ضریب_اطمینان ?? 100) >= 70 && (tr.ضریب_اطمینان ?? 100) < 90).length;
                        const excellentConfidenceCount = transactions.filter(tr => (tr.ضریب_اطمینان ?? 100) >= 90).length;
"""

# I need to find where the corruption ends. It ends exactly at:
end_str = "                        const sumDebit = transactions.reduce((acc, current) => acc + (current.مبلغ_بدهکار ?? 0), 0);\n                        const sumCredit = transactions.reduce((acc, current) => acc + (current.مبلغ_بستانکار ?? 0), 0);"
end_idx = -1
for i, line in enumerate(lines):
    if line.strip() == "const sumDebit = transactions.reduce((acc, current) => acc + (current.مبلغ_بدهکار ?? 0), 0);":
        end_idx = i
        break

start_idx = 5205 # line 5206 in 0-indexed is 5205

# wait, line 5205 should be:
#                          <div className="flex items-center justify-between bo...
print("STARTING FROM:", lines[5205].strip())

if end_idx != -1:
    print("ENDING AT:", lines[end_idx].strip())
    new_lines = lines[:5205] + [line + "\n" for line in diff_str.split('\n')] + lines[end_idx:]
    with open('src/App.tsx', 'w') as f:
        f.writelines(new_lines)
    print("Success")
else:
    print("Could not find end index")
