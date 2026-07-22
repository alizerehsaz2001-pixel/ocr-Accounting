content = open('src/App.tsx').read()

# Fix bg-emerald-555 typo
content = content.replace('bg-emerald-555/15', 'bg-emerald-500/15')

# Old section start
old_toolbar = '''                        <div className="flex flex-wrap items-center justify-between gap-3">
                          {/* Left layout with Quick search and metrics */}
                          <div className="flex items-center gap-2 flex-1 min-w-[280px]">'''

new_toolbar = '''                        <div className="flex flex-wrap items-center justify-between gap-3">
                          {/* Left layout with Quick search and metrics */}
                          <div className="flex items-center gap-2 flex-1 min-w-[280px] flex-wrap">'''

content = content.replace(old_toolbar, new_toolbar)

# Old matched rows div
old_matched = '''                          {/* Right layout indicating results found */}
                          <div className="flex items-center gap-1.5 text-[10px]">
                            <span className="text-slate-400 font-medium">ردیف‌های منطبق:</span>
                            <span className="font-bold text-blue-600 font-mono">
                              {filteredTransactions.length.toLocaleString("fa-IR")}
                            </span>
                            <span className="text-slate-300">از</span>
                            <span className="font-semibold text-slate-500 font-mono">
                              {transactions.length.toLocaleString("fa-IR")}
                            </span>

                            {(filterParty || filterQuery || filterMinAmount || filterMaxAmount || filterConfidence !== "all") && (
                              <button
                                onClick={() => {
                                  setFilterParty("");
                                  setFilterQuery("");
                                  setFilterMinAmount("");
                                  setFilterMaxAmount("");
                                  setFilterConfidence("all");
                                }}
                                className="mr-2 text-[9px] text-red-500 hover:text-red-650 hover:underline flex items-center gap-1 font-bold"
                              >
                                <X className="h-2.5 w-2.5" />
                                <span>حذف فیلترها</span>
                              </button>
                            )}
                          </div>'''

new_matched = '''                          {/* Right layout indicating results found */}
                          <div className={`flex items-center gap-1.5 text-[11px] shrink-0 whitespace-nowrap px-3 py-1.5 rounded-lg border shadow-xs ${
                            isDarkMode ? "bg-slate-800/80 border-slate-700/80 text-slate-300" : "bg-slate-100/90 border-slate-200 text-slate-600"
                          }`}>
                            <span className="opacity-80 font-medium">ردیف‌های منطبق:</span>
                            <span className="font-bold text-blue-600 dark:text-blue-400 font-mono text-xs">
                              {filteredTransactions.length.toLocaleString("fa-IR")}
                            </span>
                            <span className="opacity-50">از</span>
                            <span className="font-semibold text-slate-500 dark:text-slate-400 font-mono text-xs">
                              {transactions.length.toLocaleString("fa-IR")}
                            </span>

                            {(filterParty || filterQuery || filterMinAmount || filterMaxAmount || filterConfidence !== "all") && (
                              <button
                                onClick={() => {
                                  setFilterParty("");
                                  setFilterQuery("");
                                  setFilterMinAmount("");
                                  setFilterMaxAmount("");
                                  setFilterConfidence("all");
                                }}
                                className="mr-1.5 text-[10px] text-rose-500 hover:text-rose-600 hover:underline flex items-center gap-0.5 font-bold border-r pr-2 border-slate-300 dark:border-slate-700"
                              >
                                <X className="h-3 w-3" />
                                <span>حذف فیلترها</span>
                              </button>
                            )}
                          </div>'''

if old_matched in content:
    content = content.replace(old_matched, new_matched)
    open('src/App.tsx', 'w').write(content)
    print("Successfully patched matched rows toolbar")
else:
    print("Could not find old_matched block")
