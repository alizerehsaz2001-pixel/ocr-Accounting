                            {/* Bento Grid of analysis metrics */}
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 w-full">
                            
                            {/* Card 1: Average confidence */}
                            <motion.div
                              whileHover={{ y: -2, scale: 1.01 }}
                              onClick={() => setFilterConfidence(filterConfidence === "high" ? "all" : "high")}
                              className={`relative overflow-hidden p-5 rounded-2xl border ${fileManagerViewMode === "list" ? "flex flex-col sm:flex-row sm:items-center justify-between gap-5" : "flex flex-col justify-between"} cursor-pointer transition-all duration-300 ${
                                filterConfidence === "high"
                                  ? "bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-500/20 ring-4 ring-emerald-500/10"
                                  : isDarkMode 
                                    ? "bg-slate-900/50 border-slate-800 hover:bg-slate-800 hover:border-slate-700" 
                                    : "bg-white border-slate-200/80 hover:border-slate-300 shadow-sm hover:shadow-md"
                              }`}
                              title="کلیک جهت فیلتر ردیف‌های با دقت بالا"
                            >
                              {/* Background Gradient Detail */}
                              {filterConfidence !== "high" && (
                                <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
                              )}
                              
                              <div className="flex items-center justify-between mb-3 relative z-10">
                                <span className={`text-[11px] font-bold tracking-wide ${filterConfidence === "high" ? "text-emerald-50" : "text-slate-500"}`}>
                                  میانگین صحت استخراج (OCR)
                                </span>
                                <div className={`p-2 rounded-xl transition-colors ${filterConfidence === "high" ? "bg-emerald-500 shadow-inner" : isDarkMode ? "bg-slate-800/80 ring-1 ring-slate-700/50" : "bg-slate-50 ring-1 ring-slate-200/50"}`}>
                                  <TrendingUp className={`h-4 w-4 ${filterConfidence === "high" ? "text-white" : "text-blue-500"}`} />
                                </div>
                              </div>
                              
                              <div className="flex flex-col gap-3 relative z-10">
                                <div className="flex items-baseline gap-1">
                                  <span className="text-3xl font-black font-mono tracking-tighter">
                                    {avgScore.toLocaleString("fa-IR")}
                                  </span>
                                  <span className="text-sm font-bold opacity-80">%</span>
                                </div>

                                <div className="w-full space-y-2">
                                  <div className={`w-full rounded-full h-1.5 overflow-hidden ${
                                    filterConfidence === "high" ? "bg-emerald-700/50" : isDarkMode ? "bg-slate-800" : "bg-slate-100"
                                  }`}>
                                    <div 
                                      className={`h-full transition-all duration-700 ease-out rounded-full ${
                                        filterConfidence === "high" ? "bg-white" : progressColor
                                      }`} 
                                      style={{ width: `${avgScore}%` }} 
                                    />
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${
                                      filterConfidence === "high" ? "bg-emerald-500 text-white" : ratingBg
                                    }`}>
                                      {ratingLabel}
                                    </span>
                                    {filterConfidence === "high" && (
                                      <span className="text-[9px] bg-white text-emerald-700 font-extrabold px-2 py-1 rounded-lg shadow-sm">فیلتر فعال</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </motion.div>

                            {/* Card 2: Accounting balance status */}
                            <motion.div
                              whileHover={{ y: -2, scale: 1.01 }}
                              className={`relative overflow-hidden p-5 rounded-2xl border ${fileManagerViewMode === "list" ? "flex flex-col sm:flex-row sm:items-center justify-between gap-5" : "flex flex-col justify-between"} transition-all duration-300 ${
                                isBalanced 
                                  ? isDarkMode 
                                    ? "bg-slate-900/50 border-emerald-900/50 hover:bg-slate-800/80" 
                                    : "bg-white border-emerald-200 hover:shadow-md hover:border-emerald-300" 
                                  : isDarkMode 
                                    ? "bg-slate-900/50 border-rose-900/50 hover:bg-slate-800/80" 
                                    : "bg-white border-rose-200 hover:shadow-md hover:border-rose-300"
                              }`}
                            >
                              <div className={`absolute top-0 left-0 -ml-8 -mt-8 w-32 h-32 rounded-full blur-3xl pointer-events-none opacity-20 ${isBalanced ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                              
                              <div className="flex items-center justify-between mb-4 relative z-10">
                                <span className="text-[11px] font-bold tracking-wide text-slate-500">
                                  تراز حسابداری (دو طرفه)
                                </span>
                                <div className="relative flex items-center justify-center">
                                  <div className={`absolute h-3 w-3 rounded-full opacity-40 animate-ping ${
                                    isBalanced ? "bg-emerald-500" : "bg-rose-500"
                                  }`} />
                                  <div className={`h-2.5 w-2.5 rounded-full relative ${
                                    isBalanced ? "bg-emerald-500" : "bg-rose-500"
                                  }`} />
                                </div>
                              </div>

                              <div className="flex flex-col gap-2.5 mb-3 relative z-10">
                                <div className="flex items-center justify-between text-[11px] font-medium text-slate-500">
                                  <span>جمع بدهکار:</span>
                                  <span className="font-black font-mono text-slate-700 dark:text-slate-200 tracking-tight" dir="ltr">
                                    {sumDebit.toLocaleString("fa-IR")} <span className="text-[9px] font-normal opacity-70">ریال</span>
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-[11px] font-medium text-slate-500">
                                  <span>جمع بستانکار:</span>
                                  <span className="font-black font-mono text-slate-700 dark:text-slate-200 tracking-tight" dir="ltr">
                                    {sumCredit.toLocaleString("fa-IR")} <span className="text-[9px] font-normal opacity-70">ریال</span>
                                  </span>
                                </div>
                              </div>

                              <div className={`mt-auto p-2.5 rounded-xl border flex items-center gap-2 relative z-10 transition-colors ${
                                isBalanced 
                                  ? isDarkMode ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-emerald-50 border-emerald-100 text-emerald-700" 
                                  : isDarkMode ? "bg-rose-500/10 border-rose-500/20 text-rose-400" : "bg-rose-50 border-rose-100 text-rose-700"
                              }`}>
                                {isBalanced ? (
                                  <>
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                    <div className="text-[10px] leading-tight flex-1 flex flex-col justify-center">
                                      <span className="font-bold">موازنه کاملاً برقرار است</span>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0 animate-pulse" />
                                    <div className="text-[10px] leading-tight flex-1 flex items-center justify-between">
                                      <span className="font-bold text-rose-600 dark:text-rose-400">اختلاف تراز</span>
                                      <span className="font-black font-mono text-[10px]" dir="ltr">
                                        {(Math.abs(sumDebit - sumCredit)).toLocaleString("fa-IR")}
                                      </span>
                                    </div>
                                  </>
                                )}
                              </div>
                            </motion.div>

                            {/* Card 3: Quality Breakdown / distribution */}
                            <motion.div
                              whileHover={{ y: -2, scale: 1.01 }}
                              className={`relative overflow-hidden p-5 rounded-2xl border ${fileManagerViewMode === "list" ? "flex flex-col sm:flex-row sm:items-center justify-between gap-5" : "flex flex-col justify-between"} transition-all duration-300 ${
                                isDarkMode ? "bg-slate-900/50 border-slate-800 hover:bg-slate-800" : "bg-white border-slate-200/80 hover:border-slate-300 shadow-sm hover:shadow-md"
                              }`}
                            >
                              <div className="absolute bottom-0 right-0 -mr-6 -mb-6 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

                              <div className="flex items-center justify-between mb-4 relative z-10">
                                <span className="text-[11px] font-bold tracking-wide text-slate-500">
                                  توزیع کیفیت استخراج
                                </span>
                                <div className={`p-2 rounded-xl transition-colors ${isDarkMode ? "bg-slate-800/80 ring-1 ring-slate-700/50" : "bg-slate-50 ring-1 ring-slate-200/50"}`}>
                                  <Coins className="h-4 w-4 text-amber-500" />
                                </div>
                              </div>

                              <div className="mb-4 relative z-10">
                                <div className={`flex h-2.5 w-full rounded-full overflow-hidden ${isDarkMode ? "bg-slate-800" : "bg-slate-100"}`}>
                                  <div 
                                    className="bg-emerald-500 transition-all duration-700 ease-out hover:opacity-90 hover:scale-y-110 origin-left" 
                                    style={{ width: `${count > 0 ? (excellentConfidenceCount / count) * 100 : 0}%` }} 
                                    title={`عالی: ${excellentConfidenceCount} ردیف`}
                                  />
                                  <div 
                                    className="bg-amber-400 transition-all duration-700 ease-out hover:opacity-90 hover:scale-y-110" 
                                    style={{ width: `${count > 0 ? (mediumConfidenceCount / count) * 100 : 0}%` }} 
                                    title={`متوسط: ${mediumConfidenceCount} ردیف`}
                                  />
                                  <div 
                                    className="bg-rose-500 transition-all duration-700 ease-out hover:opacity-90 hover:scale-y-110 origin-right" 
                                    style={{ width: `${count > 0 ? (lowConfidenceCount / count) * 100 : 0}%` }} 
                                    title={`ضعیف: ${lowConfidenceCount} ردیف`}
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-2 mt-auto relative z-10">
                                <button
                                  type="button"
                                  onClick={() => setFilterConfidence(filterConfidence === "high" ? "all" : "high")}
                                  className={`flex flex-col items-center p-2 rounded-xl transition-all duration-200 ${
                                    filterConfidence === "high" 
                                      ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 scale-105 shadow-sm shadow-emerald-500/10" 
                                      : "text-emerald-600 dark:text-emerald-500 hover:bg-emerald-500/5 border border-transparent"
                                  }`}
                                  title="فیلتر تراکنش‌های با کیفیت عالی"
                                >
                                  <span className="opacity-80 text-[9px] font-bold">عالی</span>
                                  <span className="text-sm font-black font-mono mt-0.5">{excellentConfidenceCount.toLocaleString("fa-IR")}</span>
                                </button>
                                
                                <button
                                  type="button"
                                  onClick={() => setFilterConfidence(filterConfidence === "medium" ? "all" : "medium")}
                                  className={`flex flex-col items-center p-2 rounded-xl transition-all duration-200 ${
                                    filterConfidence === "medium" 
                                      ? "bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 scale-105 shadow-sm shadow-amber-500/10" 
                                      : "text-amber-600 dark:text-amber-500 hover:bg-amber-500/5 border border-transparent"
                                  }`}
                                  title="فیلتر تراکنش‌های متوسط"
                                >
                                  <span className="opacity-80 text-[9px] font-bold">متوسط</span>
                                  <span className="text-sm font-black font-mono mt-0.5">{mediumConfidenceCount.toLocaleString("fa-IR")}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setFilterConfidence(filterConfidence === "low" ? "all" : "low")}
                                  className={`flex flex-col items-center p-2 rounded-xl transition-all duration-200 ${
                                    filterConfidence === "low" 
                                      ? "bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 scale-105 shadow-sm shadow-rose-500/10" 
                                      : "text-rose-600 dark:text-rose-500 hover:bg-rose-500/5 border border-transparent"
                                  }`}
                                  title="فیلتر تراکنش‌های ضعیف"
                                >
                                  <span className="opacity-80 text-[9px] font-bold">ضعیف</span>
                                  <span className="text-sm font-black font-mono mt-0.5">{lowConfidenceCount.toLocaleString("fa-IR")}</span>
                                </button>
                              </div>
                            </motion.div>

                            {/* Card 4: Quick Actions & Reset filters */}
                            <motion.div
                              whileHover={{ y: -2, scale: 1.01 }}
                              className={`relative overflow-hidden p-5 rounded-2xl border ${fileManagerViewMode === "list" ? "flex flex-col sm:flex-row sm:items-center justify-between gap-5" : "flex flex-col justify-between"} transition-all duration-300 ${
                                isDarkMode ? "bg-slate-900/50 border-slate-800 hover:bg-slate-800" : "bg-white border-slate-200/80 hover:border-slate-300 shadow-sm hover:shadow-md"
                              }`}
                            >
                              <div className="absolute bottom-0 left-0 -ml-6 -mb-6 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />

                              <div className="flex items-center justify-between mb-4 relative z-10">
                                <span className="text-[11px] font-bold tracking-wide text-slate-500">
                                  ابزار بازبینی سریع
                                </span>
                                <div className={`p-2 rounded-xl transition-colors ${isDarkMode ? "bg-slate-800/80 ring-1 ring-slate-700/50" : "bg-slate-50 ring-1 ring-slate-200/50"}`}>
                                  <Scale className="h-4 w-4 text-blue-500" />
                                </div>
                              </div>

                              <div className="flex flex-col gap-2 mb-3 relative z-10">
                                {lowConfidenceCount > 0 ? (
                                  <button
                                    type="button"
                                    onClick={() => setFilterConfidence(filterConfidence === "low" ? "all" : "low")}
                                    className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-[11px] font-bold transition-all ${
                                      filterConfidence === "low"
                                        ? "bg-rose-500 border-rose-600 text-white shadow-md shadow-rose-500/20"
                                        : "bg-rose-500/10 border-rose-500/20 text-rose-600 hover:bg-rose-500/20"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <AlertTriangle className="h-4 w-4 animate-pulse" />
                                      <span>نمایش {lowConfidenceCount.toLocaleString("fa-IR")} مورد مخدوش</span>
                                    </div>
                                    <span className={`text-[9px] px-2 py-1 rounded-lg ${filterConfidence === "low" ? "bg-rose-600" : "bg-rose-500 text-white"}`}>بررسی</span>
                                  </button>
                                ) : (
                                  <div className="w-full p-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold flex items-center justify-center gap-2 select-none shadow-sm shadow-emerald-500/5">
                                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                                    <span>هیچ ردیف مشکوکی یافت نشد</span>
                                  </div>
                                )}

                                {countEdited > 0 && (
                                  <div className="p-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-600 dark:text-amber-500 text-[11px] font-bold flex items-center justify-center gap-2">
                                    <FileEdit className="h-4 w-4" />
                                    <span>{countEdited.toLocaleString("fa-IR")} ردیف تا کنون ویرایش شده</span>
                                  </div>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => setFilterConfidence("all")}
                                className={`w-full py-2.5 mt-auto text-center text-[11px] font-black rounded-xl transition-all duration-200 border flex items-center justify-center gap-2 relative z-10 ${
                                  filterConfidence === "all"
                                    ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20"
                                    : isDarkMode 
                                      ? "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200" 
                                      : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                                }`}
                              >
                                <span>نمایش کل تراکنش‌ها ({count.toLocaleString("fa-IR")})</span>
                                {filterConfidence !== "all" && (
                                  <span className="text-[9px] bg-white/20 text-blue-100 px-2 py-1 rounded-md">لغو فیلتر</span>
                                )}
                              </button>
                            </motion.div>

                          </div>
