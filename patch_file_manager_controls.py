import sys

with open("src/App.tsx", "r", encoding="utf-8") as f:
    content = f.read()

target_start = """                        {/* Control Bar */}
                        <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-3 ${
                          isDarkMode ? "bg-slate-800/20 border-slate-800" : "bg-slate-50 border-slate-200 shadow-sm"
                        }`}>
                          {/* Search box */}
                          <div className="relative w-full sm:w-72">
                            <input
                              type="text"
                              value={fileManagerSearchQuery}
                              onChange={(e) => setFileManagerSearchQuery(e.target.value)}
                              placeholder="جستجو در اسناد، نوع، تحلیل..."
                              className={`w-full py-1.5 pr-8 pl-8 text-xs rounded-lg border outline-none transition-all text-right ${
                                isDarkMode 
                                  ? "bg-slate-900 border-slate-700 text-slate-200 placeholder-slate-500 focus:border-indigo-500" 
                                  : "bg-white border-slate-200 text-slate-850 placeholder-slate-400 focus:border-indigo-500"
                              }`}
                            />
                            <Search className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            {fileManagerSearchQuery && (
                              <button 
                                onClick={() => setFileManagerSearchQuery("")}
                                className="absolute left-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
                              >
                                <X className="w-3 h-3 text-slate-400" />
                              </button>
                            )}
                          </div>

                          {/* Filters and Sorting selectors */}
                          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full sm:w-auto justify-end">
                            {/* Direct Upload inside File Manager */}
                            <label className="cursor-pointer px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-[10px] font-black shadow-sm transition-all flex items-center gap-1.5 active:scale-95 shrink-0">
                              <input 
                                type="file" 
                                className="hidden" 
                                accept="image/*,application/pdf"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    uploadFileDirectly(e.target.files[0]);
                                  }
                                }}
                              />
                              <Upload className="w-3.5 h-3.5 text-white" />
                              <span>آپلود مستقیم سند</span>
                            </label>

                            {/* Download Catalog Excel */}
                            <button
                              onClick={handleExportCatalogExcel}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-black border transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                                isDarkMode
                                  ? "bg-emerald-950/40 border-emerald-800 text-emerald-400 hover:bg-emerald-900/50"
                                  : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                              }`}
                              title="دانلود گزارش کاتالوگ و مشخصات کامل تمام اسناد در اکسل"
                            >
                              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                              <span className="hidden md:inline">خروجی اکسل اسناد</span>
                            </button>

                            {/* Type filter */}
                            <div className="flex items-center gap-1 rounded-lg border p-1 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                              <button
                                onClick={() => setFileManagerTypeFilter("all")}
                                className={`px-2 py-1 text-[10px] font-bold rounded-md transition-colors ${
                                  fileManagerTypeFilter === "all"
                                    ? "bg-indigo-600 text-white"
                                    : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                                }`}
                              >
                                همه
                              </button>
                              <button
                                onClick={() => setFileManagerTypeFilter("image")}
                                className={`px-2 py-1 text-[10px] font-bold rounded-md transition-colors ${
                                  fileManagerTypeFilter === "image"
                                    ? "bg-indigo-600 text-white"
                                    : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                                }`}
                              >
                                تصویر
                              </button>
                              <button
                                onClick={() => setFileManagerTypeFilter("pdf")}
                                className={`px-2 py-1 text-[10px] font-bold rounded-md transition-colors ${
                                  fileManagerTypeFilter === "pdf"
                                    ? "bg-indigo-600 text-white"
                                    : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                                }`}
                              >
                                PDF
                              </button>
                            </div>

                            {/* Sort Selector */}
                            <div className="relative">
                              <select
                                value={fileManagerSortBy}
                                onChange={(e) => setFileManagerSortBy(e.target.value)}
                                className={`text-[10px] font-bold py-1.5 pr-2.5 pl-6 rounded-lg border outline-none appearance-none transition-all cursor-pointer text-right ${
                                  isDarkMode 
                                    ? "bg-slate-900 border-slate-700 text-slate-300 hover:border-indigo-500" 
                                    : "bg-white border-slate-200 text-slate-600 hover:border-indigo-500"
                                }`}
                              >
                                <option value="newest">جدیدترین اسناد</option>
                                <option value="oldest">قدیمی‌ترین اسناد</option>
                                <option value="largest">بزرگترین حجم</option>
                                <option value="smallest">کمترین حجم</option>
                                <option value="alphabetical">الفبایی (نام سند)</option>
                                <option value="most_transactions">بیشترین داده استخراجی</option>
                                <option value="least_transactions">کمترین داده استخراجی</option>
                              </select>
                              <ArrowUpDown className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>

                            {/* Select All checkbox button */}
                            <button
                              onClick={() => {
                                if (selectedScanIds.length === fileManagerFilteredScans.length) {
                                  setSelectedScanIds([]);
                                } else {
                                  setSelectedScanIds(fileManagerFilteredScans.map(s => s.id));
                                }
                              }}
                              className={`p-1.5 rounded-lg transition-colors border ${
                                selectedScanIds.length === fileManagerFilteredScans.length && fileManagerFilteredScans.length > 0
                                  ? "bg-indigo-600 border-indigo-600 text-white"
                                  : isDarkMode 
                                    ? "bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800" 
                                    : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                              }`}
                              title={selectedScanIds.length === fileManagerFilteredScans.length ? "لغو انتخاب همه" : "انتخاب همه اسناد"}
                            >
                              <CheckSquare className="w-3.5 h-3.5" />
                            </button>

                            {/* View Mode Toggle */}
                            <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-0.5">
                              <button
                                onClick={() => setFileManagerViewMode("grid")}
                                className={`p-1.5 rounded-md transition-colors ${fileManagerViewMode === "grid" ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"}`}
                                title="نمایش شبکه‌ای"
                              >
                                <LayoutGrid className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setFileManagerViewMode("list")}
                                className={`p-1.5 rounded-md transition-colors ${fileManagerViewMode === "list" ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"}`}
                                title="نمایش لیستی"
                              >
                                <List className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>"""

new_controls = """                        {/* Control Bar */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <label className={`cursor-pointer px-3.5 py-1.5 rounded-lg text-[10px] font-bold shadow-sm transition-all flex items-center gap-1.5 shrink-0 ${isDarkMode ? "bg-indigo-600 text-white hover:bg-indigo-500" : "bg-slate-900 text-white hover:bg-slate-800"}`}>
                              <input 
                                type="file" 
                                className="hidden" 
                                accept="image/*,application/pdf"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    uploadFileDirectly(e.target.files[0]);
                                  }
                                }}
                              />
                              <Upload className="w-3.5 h-3.5" />
                              <span>آپلود سند</span>
                            </label>
                            
                            <button
                              onClick={handleExportCatalogExcel}
                              className={`p-1.5 rounded-lg transition-colors border ${isDarkMode ? "border-slate-800 text-slate-400 hover:bg-slate-800" : "border-slate-200 text-slate-500 hover:bg-slate-100"}`}
                              title="دانلود گزارش کاتالوگ اسناد"
                            >
                              <FileSpreadsheet className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                            <div className="relative w-full sm:w-56">
                              <input
                                type="text"
                                value={fileManagerSearchQuery}
                                onChange={(e) => setFileManagerSearchQuery(e.target.value)}
                                placeholder="جستجو..."
                                className={`w-full py-1.5 pr-8 pl-8 text-[11px] rounded-lg border outline-none transition-colors ${
                                  isDarkMode 
                                    ? "bg-[#0b1120] border-slate-800 text-slate-200 focus:border-slate-600" 
                                    : "bg-slate-50 border-slate-200 text-slate-800 focus:border-slate-300"
                                }`}
                              />
                              <Search className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                              {fileManagerSearchQuery && (
                                <button 
                                  onClick={() => setFileManagerSearchQuery("")}
                                  className="absolute left-2.5 top-1/2 -translate-y-1/2 p-0.5"
                                >
                                  <X className="w-3 h-3 text-slate-400" />
                                </button>
                              )}
                            </div>

                            <div className={`flex items-center rounded-lg border p-0.5 ${isDarkMode ? "bg-[#0b1120] border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                              <button
                                onClick={() => setFileManagerTypeFilter("all")}
                                className={`px-2 py-1 text-[10px] rounded-md transition-colors ${fileManagerTypeFilter === "all" ? (isDarkMode ? "bg-slate-800 text-white" : "bg-white shadow-sm text-slate-800") : "text-slate-500"}`}
                              >
                                همه
                              </button>
                              <button
                                onClick={() => setFileManagerTypeFilter("image")}
                                className={`px-2 py-1 text-[10px] rounded-md transition-colors ${fileManagerTypeFilter === "image" ? (isDarkMode ? "bg-slate-800 text-white" : "bg-white shadow-sm text-slate-800") : "text-slate-500"}`}
                              >
                                تصویر
                              </button>
                              <button
                                onClick={() => setFileManagerTypeFilter("pdf")}
                                className={`px-2 py-1 text-[10px] rounded-md transition-colors ${fileManagerTypeFilter === "pdf" ? (isDarkMode ? "bg-slate-800 text-white" : "bg-white shadow-sm text-slate-800") : "text-slate-500"}`}
                              >
                                PDF
                              </button>
                            </div>

                            <select
                              value={fileManagerSortBy}
                              onChange={(e) => setFileManagerSortBy(e.target.value)}
                              className={`text-[10px] py-1.5 px-2.5 rounded-lg border outline-none appearance-none cursor-pointer ${
                                isDarkMode 
                                  ? "bg-[#0b1120] border-slate-800 text-slate-300" 
                                  : "bg-slate-50 border-slate-200 text-slate-600"
                              }`}
                            >
                              <option value="newest">جدیدترین</option>
                              <option value="oldest">قدیمی‌ترین</option>
                              <option value="largest">حجم: زیاد</option>
                              <option value="smallest">حجم: کم</option>
                            </select>

                            <div className={`flex items-center rounded-lg border p-0.5 ${isDarkMode ? "bg-[#0b1120] border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                              <button
                                onClick={() => setFileManagerViewMode("grid")}
                                className={`p-1 rounded-md ${fileManagerViewMode === "grid" ? (isDarkMode ? "bg-slate-800 text-white" : "bg-white shadow-sm text-slate-800") : "text-slate-400"}`}
                              >
                                <LayoutGrid className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setFileManagerViewMode("list")}
                                className={`p-1 rounded-md ${fileManagerViewMode === "list" ? (isDarkMode ? "bg-slate-800 text-white" : "bg-white shadow-sm text-slate-800") : "text-slate-400"}`}
                              >
                                <List className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            
                            <button
                              onClick={() => {
                                if (selectedScanIds.length === fileManagerFilteredScans.length) setSelectedScanIds([]);
                                else setSelectedScanIds(fileManagerFilteredScans.map(s => s.id));
                              }}
                              className={`p-1.5 rounded-lg transition-colors border ${
                                selectedScanIds.length === fileManagerFilteredScans.length && fileManagerFilteredScans.length > 0
                                  ? "bg-slate-800 border-slate-800 text-white"
                                  : isDarkMode ? "border-slate-800 text-slate-400" : "border-slate-200 text-slate-500 hover:bg-slate-100"
                              }`}
                            >
                              <CheckSquare className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>"""

if target_start in content:
    content = content.replace(target_start, new_controls)
    with open("src/App.tsx", "w", encoding="utf-8") as f:
        f.write(content)
    print("Controls replaced successfully.")
else:
    print("Controls target block not found.")
