                            {/* Bento Grid of analysis metrics */}
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 w-full">
                            
                            {/* Card 1: Average confidence */}
                            <motion.div
                              whileHover={{ y: -2, scale: 1.01 }}
                              onClick={() => setFilterConfidence(filterConfidence === "high" ? "all" : "high")}
                              className={`border p-3.5 rounded-xl shadow-sm ${fileManagerViewMode === "list" ? "flex flex-col sm:flex-row sm:items-center justify-between gap-4" : "flex flex-col justify-between"} cursor-pointer transition-all duration-300 ${
                                filterConfidence === "high"
                                  ? "bg-emerald-600 border-emerald-500 text-white shadow-emerald-500/10"
                                  : isDarkMode 
                                    ? "bg-[#0b0f19] border-slate-850 hover:border-slate-750" 
                                    : "bg-white border-slate-200/90 hover:border-slate-300"
                              }`}
                              title="کلیک جهت فیلتر ردیف‌های با دقت بالا"
                            >
                              <div className="flex items-center justify-between mb-1.5">
                                <span className={`text-[10px] font-black tracking-wide ${filterConfidence === "high" ? "text-emerald-100" : "text-slate-400"}`}>
                                  میانگین صحت استخراج (OCR)
                                </span>
                                <div className={`p-1.5 rounded-lg ${filterConfidence === "high" ? "bg-emerald-500" : isDarkMode ? "bg-slate-800" : "bg-slate-100"}`}>
                                  <TrendingUp className={`h-3.5 w-3.5 ${filterConfidence === "high" ? "text-white" : "text-blue-500"}`} />
                                </div>
                              </div>
                              
                              <div className="flex items-baseline gap-1 my-1.5">
                                <span className="text-2xl font-black font-mono tracking-tight">
                                  {avgScore.toLocaleString("fa-IR")}
                                </span>
                                <span className="text-xs font-bold">%</span>
                              </div>

                              <div className="mt-1.5 w-full">
                                <div className={`w-full rounded-full h-1.5 overflow-hidden ${
                                  filterConfidence === "high" ? "bg-emerald-700" : isDarkMode ? "bg-slate-800" : "bg-slate-100"
                                }`}>
                                  <div 
                                    className={`h-full transition-all duration-500 ${
                                      filterConfidence === "high" ? "bg-white" : progressColor
                                    }`} 
                                    style={{ width: `${avgScore}%` }} 
                                  />
                                </div>
                                <div className="flex justify-between items-center mt-2">
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                                    filterConfidence === "high" ? "bg-emerald-500 text-white" : ratingBg
                                  }`}>
                                    {ratingLabel}
                                  </span>
                                  {filterConfidence === "high" && (
                                    <span className="text-[8px] bg-white text-emerald-700 font-extrabold px-1.5 py-0.5 rounded-md">فیلتر فعال</span>
                                  )}
                                </div>
                              </div>
                            </motion.div>

                            {/* Card 2: Accounting balance status */}
                            <motion.div
                              whileHover={{ y: -2, scale: 1.01 }}
                              className={`border p-3.5 rounded-xl shadow-sm ${fileManagerViewMode === "list" ? "flex flex-col sm:flex-row sm:items-center justify-between gap-4" : "flex flex-col justify-between"} transition-all duration-300 ${
                                isBalanced 
                                  ? isDarkMode 
                                    ? "bg-[#0b0f19] border-emerald-950/80 hover:border-emerald-900" 
                                    : "bg-emerald-50/20 border-emerald-200/70" 
                                  : isDarkMode 
                                    ? "bg-[#0b0f19] border-rose-950/80 hover:border-rose-900" 
                                    : "bg-rose-50/20 border-rose-200/70"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[10px] font-black tracking-wide text-slate-400">
                                  تراز حسابداری (دو طرفه)
                                </span>
                                <div className="relative flex items-center justify-center">
                                  <div className={`absolute h-2.5 w-2.5 rounded-full opacity-40 animate-ping ${
                                    isBalanced ? "bg-emerald-500" : "bg-rose-500"
                                  }`} />
                                  <div className={`h-2 w-2 rounded-full relative ${
                                    isBalanced ? "bg-emerald-500" : "bg-rose-500"
                                  }`} />
                                </div>
                              </div>

                              <div className="flex flex-col gap-1.5 my-1.5">
                                <div className="flex items-center justify-between text-[10px] font-medium text-slate-500">
                                  <span>جمع بدهکار:</span>
                                  <span className="font-extrabold font-mono text-slate-600 dark:text-slate-300" dir="ltr">
                                    {sumDebit.toLocaleString("fa-IR")} <span className="text-[8px] font-normal">ریال</span>
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-[10px] font-medium text-slate-500">
                                  <span>جمع بستانکار:</span>
                                  <span className="font-extrabold font-mono text-slate-600 dark:text-slate-300" dir="ltr">
                                    {sumCredit.toLocaleString("fa-IR")} <span className="text-[8px] font-normal">ریال</span>
                                  </span>
                                </div>
                              </div>

                              <div className={`mt-1.5 p-1.5 rounded-lg border flex items-center gap-1.5 ${
                                isBalanced 
                                  ? isDarkMode ? "bg-emerald-950/15 border-emerald-900/30 text-emerald-400" : "bg-emerald-50 border-emerald-100 text-emerald-800" 
                                  : isDarkMode ? "bg-rose-950/15 border-rose-900/30 text-rose-400" : "bg-rose-50 border-rose-100 text-rose-800"
                              }`}>
                                {isBalanced ? (
                                  <>
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                    <div className="text-[9px] leading-tight flex-1 flex flex-col justify-center">
                                      <span className="font-black">موازنه برقرار است</span>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <AlertTriangle className="h-3.5 w-3.5 text-rose-500 shrink-0 animate-pulse" />
                                    <div className="text-[9px] leading-tight flex-1 flex flex-col justify-center">
                                      <div className="flex justify-between">
                                        <span className="font-black text-rose-600 dark:text-rose-400">اختلاف تراز</span>
                                        <span className="font-bold font-mono text-[9px]" dir="ltr">
                                          {(Math.abs(sumDebit - sumCredit)).toLocaleString("fa-IR")}
                                        </span>
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                            </motion.div>

                            {/* Card 3: Quality Breakdown / distribution */}
                            <motion.div
                              whileHover={{ y: -2, scale: 1.01 }}
                              className={`border p-3.5 rounded-xl shadow-sm ${fileManagerViewMode === "list" ? "flex flex-col sm:flex-row sm:items-center justify-between gap-4" : "flex flex-col justify-between"} transition-all duration-300 ${
                                isDarkMode ? "bg-[#0b0f19] border-slate-850" : "bg-white border-slate-200/90"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[10px] font-black tracking-wide text-slate-400">
                                  توزیع کیفیت استخراج داده‌ها
                                </span>
                                <div className={`p-1.5 rounded-lg ${isDarkMode ? "bg-slate-800" : "bg-slate-100"}`}>
                                  <Coins className="h-3.5 w-3.5 text-amber-500" />
                                </div>
                              </div>

                              <div className="my-1.5">
                                <div className={`flex h-2 w-full rounded-full overflow-hidden ${isDarkMode ? "bg-slate-800" : "bg-slate-100"}`}>
                                  <div 
                                    className="bg-emerald-500 transition-all duration-500 hover:opacity-90" 
                                    style={{ width: `${count > 0 ? (excellentConfidenceCount / count) * 100 : 0}%` }} 
                                    title={`عالی: ${excellentConfidenceCount} ردیف`}
                                  />
                                  <div 
                                    className="bg-amber-500 transition-all duration-500 hover:opacity-90" 
                                    style={{ width: `${count > 0 ? (mediumConfidenceCount / count) * 100 : 0}%` }} 
                                    title={`متوسط: ${mediumConfidenceCount} ردیف`}
                                  />
                                  <div 
                                    className="bg-rose-500 transition-all duration-500 hover:opacity-90" 
                                    style={{ width: `${count > 0 ? (lowConfidenceCount / count) * 100 : 0}%` }} 
                                    title={`ضعیف: ${lowConfidenceCount} ردیف`}
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-1 text-[9px] font-bold font-mono mt-1">
                                <button
                                  type="button"
                                  onClick={() => setFilterConfidence(filterConfidence === "high" ? "all" : "high")}
                                  className={`flex flex-col items-center p-1 rounded-lg transition-all duration-200 ${
                                    filterConfidence === "high" 
                                      ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 font-black scale-105" 
                                      : "text-emerald-500 hover:bg-emerald-500/5 border border-transparent"
                                  }`}
                                  title="فیلتر تراکنش‌های با کیفیت عالی"
                                >
                                  <span className="opacity-70 text-[8px] font-sans">عالی</span>
                                  <span className="text-xs font-extrabold mt-0.5">{excellentConfidenceCount.toLocaleString("fa-IR")}</span>
                                </button>
                                
                                <button
                                  type="button"
                                  onClick={() => setFilterConfidence(filterConfidence === "medium" ? "all" : "medium")}
                                  className={`flex flex-col items-center p-1 rounded-lg transition-all duration-200 ${
                                    filterConfidence === "medium" 
                                      ? "bg-amber-500/15 border border-amber-500/30 text-amber-500 font-black scale-105" 
                                      : "text-amber-500 hover:bg-amber-500/5 border border-transparent"
                                  }`}
                                  title="فیلتر تراکنش‌های متوسط"
                                >
                                  <span className="opacity-70 text-[8px] font-sans">متوسط</span>
                                  <span className="text-xs font-extrabold mt-0.5">{mediumConfidenceCount.toLocaleString("fa-IR")}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setFilterConfidence(filterConfidence === "low" ? "all" : "low")}
                                  className={`flex flex-col items-center p-1 rounded-lg transition-all duration-200 ${
                                    filterConfidence === "low" 
                                      ? "bg-rose-500/15 border border-rose-500/30 text-rose-500 font-black scale-105" 
                                      : "text-rose-500 hover:bg-rose-500/5 border border-transparent"
                                  }`}
                                  title="فیلتر تراکنش‌های ضعیف"
                                >
                                  <span className="opacity-70 text-[8px] font-sans font-medium">ضعیف</span>
                                  <span className="text-xs font-extrabold mt-0.5">{lowConfidenceCount.toLocaleString("fa-IR")}</span>
                                </button>
                              </div>
                            </motion.div>

                            {/* Card 4: Quick Actions & Reset filters */}
                            <motion.div
                              whileHover={{ y: -2, scale: 1.01 }}
                              className={`border p-3.5 rounded-xl shadow-sm ${fileManagerViewMode === "list" ? "flex flex-col sm:flex-row sm:items-center justify-between gap-4" : "flex flex-col justify-between"} transition-all duration-300 ${
                                isDarkMode ? "bg-[#0b0f19] border-slate-850" : "bg-white border-slate-200/90"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[10px] font-black tracking-wide text-slate-400">
                                  ابزار بازبینی سریع
                                </span>
                                <div className={`p-1.5 rounded-lg ${isDarkMode ? "bg-slate-800" : "bg-slate-100"}`}>
                                  <Scale className="h-3.5 w-3.5 text-purple-500" />
                                </div>
                              </div>

                              <div className="flex flex-col gap-1.5 my-1.5">
                                {lowConfidenceCount > 0 ? (
                                  <button
                                    type="button"
                                    onClick={() => setFilterConfidence(filterConfidence === "low" ? "all" : "low")}
                                    className={`w-full text-right p-1 px-2 rounded-lg border flex items-center justify-between text-[10px] font-bold transition-all ${
                                      filterConfidence === "low"
                                        ? "bg-rose-500 border-rose-600 text-white shadow-sm shadow-rose-500/10"
                                        : "bg-rose-500/10 border-rose-500/20 text-rose-500 hover:bg-rose-500/20"
                                    }`}
                                  >
                                    <div className="flex items-center gap-1.5">
                                      <AlertTriangle className="h-3.5 w-3.5 animate-pulse" />
                                      <span>نمایش {lowConfidenceCount.toLocaleString("fa-IR")} مورد</span>
                                    </div>
                                    <span className="bg-rose-500 text-white text-[8px] px-1.5 py-0.5 rounded-md">بررسی</span>
                                  </button>
                                ) : (
                                  <div className="w-full text-right p-1 px-2 rounded-lg border border-emerald-500/15 bg-emerald-500/5 text-emerald-500 text-[10px] font-bold flex items-center gap-1.5 select-none">
                                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                                    <span>بدون ردیف مشکوک</span>
                                  </div>
                                )}

                                {countEdited > 0 && (
                                  <div className="p-1 px-2 rounded-lg border border-amber-500/15 bg-amber-500/5 text-amber-500 text-[10px] font-bold flex items-center gap-1.5">
                                    <FileEdit className="h-3.5 w-3.5 text-amber-500" />
                                    <span>{countEdited.toLocaleString("fa-IR")} ردیف ویرایش شده</span>
                                  </div>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => setFilterConfidence("all")}
                                className={`w-full py-1.5 text-center text-[10px] font-black rounded-lg transition-all duration-200 border flex items-center justify-center gap-1.5 ${
                                  filterConfidence === "all"
                                    ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                                    : isDarkMode 
                                      ? "bg-slate-800 hover:bg-slate-750 border-slate-700 text-slate-300" 
                                      : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                                }`}
                              >
                                <span>کل تراکنش‌ها ({count.toLocaleString("fa-IR")})</span>
                                {filterConfidence !== "all" && (
                                  <span className="text-[8px] bg-blue-500/10 text-blue-500 dark:bg-white/10 dark:text-blue-300 px-1 py-0.5 rounded-md">لغو فیلتر</span>
                                )}
                              </button>
                            </motion.div>

                          </div>

