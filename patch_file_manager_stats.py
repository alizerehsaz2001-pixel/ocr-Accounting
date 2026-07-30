import sys

with open("src/App.tsx", "r", encoding="utf-8") as f:
    content = f.read()

target_start = """                    {/* Analytics Dashboard Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Card 1 */}
                      <div className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                        isDarkMode ? "bg-slate-800/40 border-slate-800" : "bg-slate-50 border-slate-100"
                      }`}>
                        <div className="space-y-1 text-right">
                          <span className={`text-[10px] font-bold ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>کل فایل‌های ذخیره شده</span>
                          <h4 className="text-lg font-black text-indigo-500">{previousScans.length.toLocaleString("fa-IR")} <span className="text-xs font-normal">سند</span></h4>
                        </div>
                        <div className={`p-2.5 rounded-lg ${isDarkMode ? "bg-indigo-950/40 text-indigo-400" : "bg-indigo-100/60 text-indigo-600"}`}>
                          <FileText className="w-5 h-5" />
                        </div>
                      </div>

                      {/* Card 2 */}
                      <div className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                        isDarkMode ? "bg-slate-800/40 border-slate-800" : "bg-slate-50 border-slate-100"
                      }`}>
                        <div className="space-y-1 text-right">
                          <span className={`text-[10px] font-bold ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>توکن‌های مصرفی استخراج</span>
                          <h4 className="text-lg font-black text-emerald-500">{totalTokens.toLocaleString("fa-IR")} <span className="text-xs font-normal">توکن</span></h4>
                        </div>
                        <div className={`p-2.5 rounded-lg ${isDarkMode ? "bg-emerald-950/40 text-emerald-400" : "bg-emerald-100/60 text-emerald-600"}`}>
                          <Cpu className="w-5 h-5" />
                        </div>
                      </div>

                      {/* Card 3 */}
                      <div className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                        isDarkMode ? "bg-slate-800/40 border-slate-800" : "bg-slate-50 border-slate-100"
                      }`}>
                        <div className="space-y-1 text-right">
                          <span className={`text-[10px] font-bold ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>صحت استخراج هوش مصنوعی</span>
                          <h4 className="text-lg font-black text-amber-500">{avgConfidence.toLocaleString("fa-IR")}٪ <span className="text-xs font-normal">دقت</span></h4>
                        </div>
                        <div className={`p-2.5 rounded-lg ${isDarkMode ? "bg-amber-950/40 text-amber-400" : "bg-amber-100/60 text-amber-600"}`}>
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                      </div>

                      {/* Card 4 */}
                      <div className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                        isDarkMode ? "bg-slate-800/40 border-slate-800" : "bg-slate-50 border-slate-100"
                      }`}>
                        <div className="space-y-1 text-right">
                          <span className={`text-[10px] font-bold ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>تراکنش‌های ثبت شده</span>
                          <h4 className="text-lg font-black text-pink-500">{totalTransactionsCount.toLocaleString("fa-IR")} <span className="text-xs font-normal">ردیف</span></h4>
                        </div>
                        <div className={`p-2.5 rounded-lg ${isDarkMode ? "bg-pink-950/40 text-pink-400" : "bg-pink-100/60 text-pink-600"}`}>
                          <Sheet className="w-5 h-5" />
                        </div>
                      </div>
                    </div>

                    {/* Storage progress & analytics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className={`p-4 rounded-xl border md:col-span-2 flex flex-col justify-center ${isDarkMode ? "bg-slate-800/30 border-slate-800" : "bg-slate-50 border-slate-200 shadow-sm"}`}>
                        <div className="flex items-center justify-between mb-4">
                          <span className={`text-xs font-bold flex items-center gap-2 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                            <HardDrive className="w-4 h-4 text-indigo-500" />
                            وضعیت مصرف حافظه ابری کاربر
                          </span>
                          <span className="text-xs font-bold text-indigo-500" dir="ltr">
                            {formatBytes(usedStorage)} / {(5 + (currentUser?.extraStorage || 0)).toLocaleString("fa-IR")} GB
                          </span>
                        </div>
                        <div className={`w-full h-4 rounded-full overflow-hidden p-0.5 mb-2 ${isDarkMode ? "bg-slate-800" : "bg-slate-200"}`}>
                          <div className={`h-full rounded-full transition-all duration-500 bg-gradient-to-l ${
                            percentUsed > 90 
                              ? "from-rose-500 to-red-600" 
                              : percentUsed > 75 
                                ? "from-amber-400 to-amber-500" 
                                : "from-indigo-500 to-violet-600"
                          }`} style={{width: `${Math.max(2, percentUsed)}%`}}></div>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <p className={`text-[10px] ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                            سهم مصرف شده: <span className="font-bold text-indigo-500">{percentUsed.toFixed(2)}%</span> از کل ظرفیت فعال
                          </p>
                          {(currentUser?.extraStorage || 0) > 0 && (
                            <span className="text-[9px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/50">
                              فضای ارتقا یافته فعال است (+{currentUser?.extraStorage?.toLocaleString("fa-IR")} گیگ)
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className={`p-4 rounded-xl border flex items-center gap-4 ${isDarkMode ? "bg-slate-800/30 border-slate-800" : "bg-slate-50 border-slate-200 shadow-sm"}`}>
                        <div className="w-24 h-24 shrink-0 relative">
                          {(() => {
                            const folderStats = [
                              { name: 'دسته‌بندی نشده', value: previousScans.filter(s => !s.folder).reduce((acc, s) => acc + (s.file?.size || 0), 0), color: isDarkMode ? '#4f46e5' : '#6366f1' },
                              ...userDefinedFolders.map(folder => {
                                 const fname = typeof folder === 'string' ? folder : folder.name;
                                 const fcolor = typeof folder === 'string' ? 'indigo' : (folder.color || 'indigo');
                                 const colorHex = {
                                    rose: '#f43f5e',
                                    emerald: '#10b981',
                                    amber: '#f59e0b',
                                    blue: '#3b82f6',
                                    purple: '#a855f7',
                                    cyan: '#06b6d4',
                                    indigo: '#6366f1'
                                 }[fcolor] || '#6366f1';
                                 return {
                                   name: fname,
                                   value: previousScans.filter(s => s.folder === fname).reduce((acc, s) => acc + (s.file?.size || 0), 0),
                                   color: colorHex
                                 }
                              })
                            ].filter(d => d.value > 0);
                            
                            const chartData = folderStats.length > 0 ? folderStats : [{ name: 'خالی', value: 1, color: isDarkMode ? '#334155' : '#e2e8f0' }];
                            
                            return (
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={28}
                                    outerRadius={40}
                                    paddingAngle={2}
                                    dataKey="value"
                                    stroke="none"
                                  >
                                    {chartData.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                  </Pie>
                                  <Tooltip 
                                    formatter={(value: number) => folderStats.length > 0 ? formatBytes(value) : '0 Bytes'}
                                    contentStyle={{ 
                                      backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                                      borderColor: isDarkMode ? '#334155' : '#e2e8f0',
                                      borderRadius: '8px',
                                      fontSize: '10px',
                                      direction: 'rtl',
                                      textAlign: 'right'
                                    }}
                                    itemStyle={{ color: isDarkMode ? '#cbd5e1' : '#475569' }}
                                  />
                                </PieChart>
                              </ResponsiveContainer>
                            );
                          })()}
                        </div>
                        <div className="flex-1 flex flex-col justify-center">
                          <span className={`text-[10px] font-bold mb-2 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>توزیع حافظه</span>
                          <div className="space-y-1.5 max-h-[70px] overflow-y-auto pr-1">
                            {userDefinedFolders.length === 0 && previousScans.length === 0 ? (
                               <div className="text-[9px] text-slate-400">فضای ابری خالی است</div>
                            ) : (
                              <>
                                <div className="flex items-center justify-between text-[9px]">
                                  <div className="flex items-center gap-1.5 truncate">
                                    <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0"></span>
                                    <span className="truncate" title="دسته‌بندی نشده">دسته‌بندی نشده</span>
                                  </div>
                                </div>
                                {userDefinedFolders.map(folder => {
                                   const fname = typeof folder === 'string' ? folder : folder.name;
                                   const fcolor = typeof folder === 'string' ? 'indigo' : (folder.color || 'indigo');
                                   const colorConfig = FOLDER_COLORS[fcolor] || FOLDER_COLORS.indigo;
                                   const size = previousScans.filter(s => s.folder === fname).reduce((acc, s) => acc + (s.file?.size || 0), 0);
                                   if (size === 0) return null;
                                   return (
                                     <div key={fname} className="flex items-center justify-between text-[9px]">
                                       <div className="flex items-center gap-1.5 truncate">
                                         <span className={`w-2 h-2 rounded-full ${colorConfig.dot} shrink-0`}></span>
                                         <span className="truncate" title={fname}>{fname}</span>
                                       </div>
                                     </div>
                                   );
                                })}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>"""

new_stats = """                    {/* Compact Top Analytics Bar */}
                    <div className={`grid grid-cols-2 md:grid-cols-4 gap-px rounded-xl overflow-hidden border ${isDarkMode ? "bg-slate-800/50 border-slate-800/80" : "bg-slate-200/50 border-slate-200/80"}`}>
                      
                      <div className={`p-3.5 flex flex-col justify-center items-center gap-1 ${isDarkMode ? "bg-[#0b1120]/60" : "bg-white"}`}>
                        <div className="flex items-center gap-1.5 opacity-60">
                          <FileText className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-bold">کل اسناد</span>
                        </div>
                        <span className="text-base font-black text-slate-700 dark:text-slate-200">{previousScans.length.toLocaleString("fa-IR")}</span>
                      </div>

                      <div className={`p-3.5 flex flex-col justify-center items-center gap-1 ${isDarkMode ? "bg-[#0b1120]/60" : "bg-white"}`}>
                        <div className="flex items-center gap-1.5 opacity-60">
                          <Sheet className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-bold">تراکنش‌ها</span>
                        </div>
                        <span className="text-base font-black text-slate-700 dark:text-slate-200">{totalTransactionsCount.toLocaleString("fa-IR")}</span>
                      </div>

                      <div className={`p-3.5 flex flex-col justify-center items-center gap-1 ${isDarkMode ? "bg-[#0b1120]/60" : "bg-white"}`}>
                        <div className="flex items-center gap-1.5 opacity-60">
                          <Cpu className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-bold">توکن‌ها</span>
                        </div>
                        <span className="text-base font-black text-slate-700 dark:text-slate-200">{totalTokens.toLocaleString("fa-IR")}</span>
                      </div>

                      <div className={`p-3.5 flex flex-col justify-center items-center gap-1 ${isDarkMode ? "bg-[#0b1120]/60" : "bg-white"}`}>
                        <div className="flex flex-col w-full h-full justify-between items-center px-2">
                          <div className="flex items-center justify-between w-full opacity-60 mb-1">
                            <span className="text-[9px] font-bold">فضای ابری</span>
                            <span className="text-[9px] font-mono">{formatBytes(usedStorage)}</span>
                          </div>
                          <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDarkMode ? "bg-slate-800" : "bg-slate-100"}`}>
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.max(2, percentUsed)}%` }} />
                          </div>
                          <div className="w-full text-left mt-1">
                            <span className="text-[8px] opacity-40">{percentUsed.toFixed(1)}% از {(5 + (currentUser?.extraStorage || 0))}GB</span>
                          </div>
                        </div>
                      </div>
                    </div>"""

if target_start in content:
    content = content.replace(target_start, new_stats)
    with open("src/App.tsx", "w", encoding="utf-8") as f:
        f.write(content)
    print("Stats replaced successfully.")
else:
    print("Stats target block not found.")
