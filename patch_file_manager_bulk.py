import sys

with open("src/App.tsx", "r", encoding="utf-8") as f:
    content = f.read()

target_start = """                        {/* Bulk Actions Sticky Panel */}
                        {selectedScanIds.length > 0 && (
                          <div className="p-3.5 rounded-xl border border-indigo-500/30 bg-indigo-50/70 dark:bg-indigo-950/20 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in shadow-sm">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
                              <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
                                تعداد <span className="font-extrabold">{selectedScanIds.length.toLocaleString("fa-IR")}</span> سند انتخاب شده است.
                              </span>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                              {/* Bulk Parallel Gemini OCR Button */}
                              <button
                                onClick={handleBulkBatchOCR}
                                className="px-3 py-1.5 rounded-lg text-[10px] font-black bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white flex items-center gap-1.5 shadow-md transition-all active:scale-95"
                                title="شروع پردازش همزمان اسناد انتخاب شده با قابلیت تلاش مجدد خودکار در صورت تراکم ترافیک"
                              >
                                <Zap className="w-3.5 h-3.5 text-amber-300 animate-bounce" />
                                <span>پردازش موازی با Gemini (استخراج OCR)</span>
                              </button>
                              {/* Move Folder Group action */}
                              <div className="relative">
                                <select
                                  onChange={(e) => {
                                    if (e.target.value !== "choose") {
                                      handleBulkMove(e.target.value === "none" ? undefined : e.target.value);
                                      e.target.value = "choose";
                                    }
                                  }}
                                  className={`text-[10px] font-bold py-1.5 pr-2 pl-6 rounded-lg border outline-none appearance-none transition-all cursor-pointer bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border-indigo-200 hover:border-indigo-500`}
                                >
                                  <option value="choose">انتقال گروهی به پوشه...</option>
                                  <option value="none">بدون پوشه (دسته‌بندی نشده)</option>
                                  {userDefinedFolders.map(f => {
                                    const folderName = typeof f === "string" ? f : f.name;
                                    return (
                                      <option key={folderName} value={folderName}>{folderName}</option>
                                    );
                                  })}
                                </select>
                                <Folder className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-indigo-500 pointer-events-none" />
                              </div>

                              {/* Bulk Star/Unstar */}
                              <div className="flex bg-white dark:bg-slate-900 rounded-lg overflow-hidden border border-amber-200 dark:border-slate-700">
                                <button
                                  onClick={() => handleBulkStar(true)}
                                  className="px-2 py-1.5 text-[10px] font-bold hover:bg-amber-50 dark:hover:bg-slate-800 text-amber-600 dark:text-amber-400 flex items-center gap-1 transition-all border-l border-amber-100 dark:border-slate-800"
                                  title="برگزیدن اسناد انتخاب‌شده"
                                >
                                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                </button>
                                <button
                                  onClick={() => handleBulkStar(false)}
                                  className="px-2 py-1.5 text-[10px] font-bold hover:bg-amber-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center gap-1 transition-all"
                                  title="حذف از برگزیده‌ها"
                                >
                                  <Star className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Bulk Tagging */}
                              <button
                                onClick={() => {
                                  const tag = window.prompt("نام برچسب را برای افزودن به اسناد انتخاب شده وارد کنید:");
                                  if (tag && tag.trim()) {
                                    setPreviousScans(prev => prev.map(s => {
                                      if (selectedScanIds.includes(s.id)) {
                                        const existingTags = s.tags || [];
                                        if (!existingTags.includes(tag.trim())) {
                                          return { ...s, tags: [...existingTags, tag.trim()] };
                                        }
                                      }
                                      return s;
                                    }));
                                    logEvent("افزودن گروهی برچسب", `کاربر برچسب «${tag}» را به ${selectedScanIds.length} سند اضافه کرد.`);
                                    showNotification(`برچسب «${tag}» به اسناد اضافه شد.`, "success");
                                    setSelectedScanIds([]);
                                  }
                                }}
                                className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1 transition-all"
                              >
                                <Tag className="w-3.5 h-3.5" />
                                <span>افزودن برچسب</span>
                              </button>

                              {/* Download Selected */}
                              <button
                                onClick={handleBulkDownload}
                                className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1 transition-all"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>دانلود گروهی</span>
                              </button>

                              {/* Export Excel Selected */}
                              <button
                                onClick={() => {
                                  let worksheetData: any[] = [];
                                  let colWidths: any[] = [];
                                  previousScans.forEach(scan => {
                                    if (selectedScanIds.includes(scan.id) && scan.transactions) {
                                      scan.transactions.forEach((t: any) => {
                                        const row: any = { "فاکتور": scan.file?.name || "نامشخص" };
                                        Object.keys(t).forEach(k => {
                                          if (k !== "id") row[k] = t[k];
                                        });
                                        worksheetData.push(row);
                                      });
                                    }
                                  });
                                  if (worksheetData.length > 0) {
                                    colWidths = Object.keys(worksheetData[0]).map(k => ({ wch: Math.max(k.length + 5, 15) }));
                                  }
                                  if (worksheetData.length === 0) {
                                    setNotification({ text: "تراکنشی برای خروجی اکسل یافت نشد.", type: "error" });
                                    return;
                                  }
                                  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
                                  const workbook = XLSX.utils.book_new();
                                  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
                                  if (colWidths) {
                                    worksheet['!cols'] = colWidths;
                                  }
                                  XLSX.writeFile(workbook, `Selected-Export.xlsx`);
                                }}
                                className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 transition-all"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>اکسل یکپارچه</span>
                              </button>

                              {/* Delete Selected */}
                              <button
                                onClick={handleBulkDelete}
                                className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-rose-500 hover:bg-rose-600 text-white flex items-center gap-1 transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>حذف گروهی</span>
                              </button>

                              {/* Cancel Selection */}
                              <button
                                onClick={() => setSelectedScanIds([])}
                                className={`px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${
                                  isDarkMode ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-100"
                                }`}
                              >
                                انصراف
                              </button>
                            </div>
                          </div>
                        )}"""

new_bulk = """                        {/* Bulk Actions Sticky Panel */}
                        {selectedScanIds.length > 0 && (
                          <div className={`mb-3 p-3 rounded-lg border flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in ${isDarkMode ? "bg-indigo-950/30 border-indigo-500/20" : "bg-indigo-50 border-indigo-100"}`}>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                                {selectedScanIds.length} سند انتخاب شده
                              </span>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                              <button
                                onClick={handleBulkBatchOCR}
                                className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow-sm transition-all"
                              >
                                <Zap className="w-3.5 h-3.5" />
                                <span>استخراج اطلاعات (OCR)</span>
                              </button>
                              
                              <div className="relative">
                                <select
                                  onChange={(e) => {
                                    if (e.target.value !== "choose") {
                                      handleBulkMove(e.target.value === "none" ? undefined : e.target.value);
                                      e.target.value = "choose";
                                    }
                                  }}
                                  className={`text-[10px] py-1.5 pr-2 pl-6 rounded-lg border outline-none appearance-none cursor-pointer ${isDarkMode ? "bg-[#0b1120] text-indigo-400 border-indigo-500/30" : "bg-white text-indigo-600 border-indigo-200"}`}
                                >
                                  <option value="choose">انتقال به پوشه...</option>
                                  <option value="none">بدون پوشه (دسته‌بندی نشده)</option>
                                  {userDefinedFolders.map(f => {
                                    const folderName = typeof f === "string" ? f : f.name;
                                    return <option key={folderName} value={folderName}>{folderName}</option>;
                                  })}
                                </select>
                                <Folder className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-indigo-500 pointer-events-none" />
                              </div>

                              <div className={`flex rounded-lg overflow-hidden border ${isDarkMode ? "bg-[#0b1120] border-amber-500/30" : "bg-white border-amber-200"}`}>
                                <button
                                  onClick={() => handleBulkStar(true)}
                                  className={`px-2 py-1.5 border-l ${isDarkMode ? "border-amber-500/30 hover:bg-slate-800" : "border-amber-200 hover:bg-amber-50"}`}
                                  title="برگزیدن"
                                >
                                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                </button>
                                <button
                                  onClick={() => handleBulkStar(false)}
                                  className={`px-2 py-1.5 ${isDarkMode ? "hover:bg-slate-800" : "hover:bg-slate-50"}`}
                                  title="حذف از برگزیده‌ها"
                                >
                                  <Star className="w-3.5 h-3.5 text-slate-400" />
                                </button>
                              </div>

                              <button
                                onClick={handleBulkDownload}
                                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 border ${isDarkMode ? "bg-[#0b1120] border-slate-700 text-slate-300 hover:bg-slate-800" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={handleBulkDelete}
                                className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-rose-500 hover:bg-rose-600 text-white flex items-center gap-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => setSelectedScanIds([])}
                                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border ${isDarkMode ? "border-slate-700 text-slate-400 hover:bg-slate-800" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )}"""

if target_start in content:
    content = content.replace(target_start, new_bulk)
    with open("src/App.tsx", "w", encoding="utf-8") as f:
        f.write(content)
    print("Bulk panel replaced successfully.")
else:
    print("Bulk panel target block not found.")
