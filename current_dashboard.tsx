                                }`}
                              >
                                <span>نمایش کل تراکنش‌ها ({count.toLocaleString("fa-IR")})</span>
                                {filterConfidence !== "all" && (
                                  <span className="text-[9px] bg-white/20 text-blue-100 px-2 py-1 rounded-md">لغو فیلتر</span>
                                )}
                              </button>
                            </motion.div>

                          </div>
                          {/* Smart Extraction Quality & Validation Dashboard */}
                          <div className={`p-4 rounded-xl border transition-all duration-300 ${
                            isDarkMode ? "bg-[#111827]/40 border-slate-800" : "bg-slate-50/50 border-slate-200"
                          }`}>
                            {/* Tab Headers */}
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-2.5 mb-3 font-sans">
                              <div className="flex items-center gap-2">
                                <div className={`p-1.5 rounded-lg ${isDarkMode ? "bg-blue-500/10 text-blue-400" : "bg-blue-50 text-blue-600"}`}>
                                  <ShieldAlert className="h-3.5 w-3.5" />
                                </div>
                                <span className={`text-[11px] font-black ${isDarkMode ? "text-slate-100" : "text-slate-800"}`}>داشبورد هوشمند کیفی</span>
                              </div>
                              <div className="flex bg-slate-200/55 dark:bg-slate-900/60 p-1 rounded-lg gap-1">
                                <button
                                  type="button"
                                  onClick={() => setActiveValidationSubTab('threshold')}
                                  className={`px-3 py-1 text-[9px] font-bold rounded-md transition-all ${
                                    activeValidationSubTab === 'threshold'
                                      ? (isDarkMode ? "bg-blue-600 text-white" : "bg-white text-blue-600 shadow-sm")
                                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                  }`}
                                >
                                  شبیه‌ساز آستانه ({minConfidenceThreshold}٪)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setActiveValidationSubTab('risk')}
                                  className={`px-3 py-1 text-[9px] font-bold rounded-md transition-all ${
                                    activeValidationSubTab === 'risk'
                                      ? (isDarkMode ? "bg-blue-600 text-white" : "bg-white text-blue-600 shadow-sm")
                                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                  }`}
                                >
                                  مخاطرات
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setActiveValidationSubTab('fields')}
                                  className={`px-3 py-1 text-[9px] font-bold rounded-md transition-all ${
                                    activeValidationSubTab === 'fields'
                                      ? (isDarkMode ? "bg-blue-600 text-white" : "bg-white text-blue-600 shadow-sm")
                                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                  }`}
                                >
                                  سلامت فیلدها
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setActiveValidationSubTab('auto-repair')}
                                  className={`px-3 py-1 text-[9px] font-bold rounded-md transition-all flex items-center gap-1 ${
                                    activeValidationSubTab === 'auto-repair'
                                      ? (isDarkMode ? "bg-amber-600 text-white" : "bg-amber-500/10 text-amber-700 shadow-sm border border-amber-500/20")
                                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                  }`}
                                >
                                  <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
                                  <span>ممیزی و خوداصلاحی ریاضی</span>
                                </button>
                              </div>
                            </div>

                            {/* Tab Contents */}
                            {activeValidationSubTab === 'threshold' && (
                              <div className="space-y-3 animate-in fade-in duration-300 font-sans text-right" dir="rtl">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                  <div className="space-y-1 flex-1 text-right">
                                    <h5 className={`text-xs font-bold ${isDarkMode ? "text-slate-100" : "text-slate-850"}`}>
                                      تنظیم حداقل ضریب اطمینان قابل قبول
                                    </h5>
                                    <p className={`text-[10px] ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                                      با جابجایی این اسلایدر، تراکنش‌هایی با دقت پایین‌تر از حد تعیین شده به طور موقت پنهان می‌شوند.
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0 self-start md:self-auto">
                                    <span className="text-[10px] font-bold font-mono text-slate-500 bg-slate-100 dark:bg-slate-900/60 py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-800 text-center">
                                      {minConfidenceThreshold.toLocaleString("fa-IR")}٪
                                    </span>
                                    {minConfidenceThreshold > 0 && (
                                      <button
                                        type="button"
                                        onClick={() => setMinConfidenceThreshold(0)}
                                        className="text-[9px] font-bold text-red-500 hover:underline"
                                      >
                                        حذف فیلتر
                                      </button>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-3">
                                  <span className="text-[9px] text-slate-400 font-bold shrink-0">۰٪</span>
                                  <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    step="5"
                                    value={minConfidenceThreshold}
                                    onChange={(e) => setMinConfidenceThreshold(Number(e.target.value))}
                                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                  />
                                  <span className="text-[9px] text-slate-400 font-bold shrink-0">۱۰۰٪</span>
                                </div>

                                {/* Stats of Threshold */}
                                {(() => {
                                  const passedCount = transactions.filter(t => (t.ضریب_اطمینان ?? 100) >= minConfidenceThreshold).length;
                                  const failedCount = transactions.length - passedCount;
                                  const passPercent = Math.round((passedCount / transactions.length) * 100);

                                  return (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                      <div className={`p-2.5 rounded-xl border text-right flex flex-col gap-1 justify-center ${
                                        isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200"
                                      }`}>
                                        <span className="text-[9px] text-slate-400 font-bold">تعداد اقلام تایید شده نهایی:</span>
                                        <span className="text-xs font-black text-emerald-500 font-mono">
                                          {passedCount.toLocaleString("fa-IR")} ردیف ({passPercent.toLocaleString("fa-IR")}٪ کل)
                                        </span>
                                      </div>
                                      <div className={`p-2.5 rounded-xl border text-right flex flex-col gap-1 justify-center ${
                                        isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200"
                                      }`}>
                                        <span className="text-[9px] text-slate-400 font-bold">تعداد اقلام مشکوک یا نیازمند توجه:</span>
                                        <span className="text-xs font-black text-amber-500 font-mono">
                                          {failedCount.toLocaleString("fa-IR")} ردیف ({(100 - passPercent).toLocaleString("fa-IR")}٪ کل)
                                        </span>
                                      </div>
                                      <div className="flex items-center justify-end">
                                        <button
                                          type="button"
                                          disabled={passedCount === 0}
                                          onClick={() => {
                                            const updated = transactions.map(t => {
