const fs = require('fs');

const diffStr = `                            {activeValidationSubTab === 'threshold' && (
                              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300 font-sans text-right" dir="rtl">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                  <div className="space-y-1.5 flex-1 text-right">
                                    <h5 className={\`text-[12px] font-black \${isDarkMode ? "text-slate-100" : "text-slate-800"}\`}>
                                      تنظیم حداقل ضریب اطمینان قابل قبول
                                    </h5>
                                    <p className={\`text-[10px] leading-relaxed \${isDarkMode ? "text-slate-400" : "text-slate-500"}\`}>
                                      با جابجایی این اسلایدر، تراکنش‌هایی با دقت پایین‌تر از حد تعیین شده به طور موقت پنهان می‌شوند. این کار به شما کمک می‌کند تا فقط روی مواردی تمرکز کنید که نیاز به بررسی دقیق‌تری دارند.
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0 self-start md:self-auto">
                                    {minConfidenceThreshold > 0 && (
                                      <button
                                        type="button"
                                        onClick={() => setMinConfidenceThreshold(0)}
                                        className="text-[9.5px] font-bold text-rose-500 hover:text-rose-600 bg-rose-500/10 hover:bg-rose-500/20 px-2.5 py-1.5 rounded-lg transition-colors"
                                      >
                                        حذف فیلتر
                                      </button>
                                    )}
                                    <span className="text-[11px] font-black font-mono text-indigo-500 bg-indigo-500/10 py-1.5 px-3.5 rounded-xl border border-indigo-500/20 text-center min-w-[70px]">
                                      {minConfidenceThreshold.toLocaleString("fa-IR")}٪
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                                  <span className="text-[10px] text-slate-400 font-bold shrink-0">۰٪</span>
                                  <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    step="5"
                                    value={minConfidenceThreshold}
                                    onChange={(e) => setMinConfidenceThreshold(Number(e.target.value))}
                                    className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all"
                                  />
                                  <span className="text-[10px] text-slate-400 font-bold shrink-0">۱۰۰٪</span>
                                </div>

                                {/* Stats of Threshold */}
                                {(() => {
                                  const passedCount = transactions.filter(t => (t.ضریب_اطمینان ?? 100) >= minConfidenceThreshold).length;
                                  const failedCount = transactions.length - passedCount;
                                  const passPercent = Math.round((passedCount / transactions.length) * 100);

                                  return (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                      <div className={\`p-4 rounded-2xl border text-right flex flex-col gap-1.5 justify-center transition-all \${
                                        isDarkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-100 shadow-sm"
                                      }\`}>
                                        <span className="text-[9.5px] text-slate-400 font-bold">تعداد اقلام تایید شده نهایی:</span>
                                        <span className="text-[13px] font-black text-emerald-500 font-mono flex items-center gap-2">
                                          {passedCount.toLocaleString("fa-IR")} ردیف
                                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">{passPercent.toLocaleString("fa-IR")}٪ کل</span>
                                        </span>
                                      </div>
                                      <div className={\`p-4 rounded-2xl border text-right flex flex-col gap-1.5 justify-center transition-all \${
                                        isDarkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-100 shadow-sm"
                                      }\`}>
                                        <span className="text-[9.5px] text-slate-400 font-bold">تعداد اقلام پنهان شده (مشکوک):</span>
                                        <span className={\`text-[13px] font-black font-mono \${failedCount > 0 ? "text-amber-500" : "text-slate-500"}\`}>
                                          {failedCount.toLocaleString("fa-IR")} ردیف
                                        </span>
                                      </div>
                                      <div className="flex flex-col justify-end">
                                        <button
                                          type="button"
                                          disabled={passedCount === 0}
                                          onClick={() => {
                                            const updated = transactions.map(t => {
                                              if ((t.ضریب_اطمینان ?? 100) >= minConfidenceThreshold) {
                                                return { ...t, ضریب_اطمینان: 100 };
                                              }
                                              return t;
                                            });
                                            setTransactions(updated);
                                            try { 
                                              setRawJsonText(JSON.stringify(updated, null, 2));
                                            } catch(e){}
                                            logEvent("تایید دسته‌جمعی تراکنش‌ها", \`کاربر کلیه تراکنش‌های با ضریب اطمینان بالاتر از \${minConfidenceThreshold}٪ را تایید نهایی کرد.\`);
                                            setNotification({ text: \`کلیه اقلام بالای \${minConfidenceThreshold}٪ با موفقیت تایید نهایی و در سطح دقت ۱۰۰٪ ذخیره شدند.\`, type: 'success' });
                                          }}
                                          className={\`w-full h-full min-h-[64px] px-4 py-3 rounded-2xl text-[10.5px] font-black transition-all duration-300 flex items-center justify-center gap-2 shadow-sm \${
                                            passedCount > 0
                                              ? "bg-emerald-500 hover:bg-emerald-600 text-white hover:shadow-md hover:-translate-y-0.5"
                                              : "bg-slate-100 text-slate-400 dark:bg-slate-800/50 dark:text-slate-600 border border-slate-200 dark:border-slate-800 cursor-not-allowed"
                                          }\`}
                                        >
                                          <ShieldCheck className="h-4 w-4" />
                                          <span>تایید دسته‌جمعی و ارتقا به ۱۰۰٪</span>
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>
                            )}

                            {activeValidationSubTab === 'risk' && (
                              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300 font-sans text-right" dir="rtl">
                                <h5 className={\`text-[12px] font-black \${isDarkMode ? "text-slate-100" : "text-slate-800"}\`}>
                                  تحلیل خودکار ناهماهنگی در اسناد
                                </h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {/* Issue 1: Balance checks */}
                                  <div className={\`p-4 rounded-2xl border flex items-start gap-3 transition-all \${
                                    isBalanced 
                                      ? (isDarkMode ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-emerald-50 border-emerald-200 text-emerald-800")
                                      : (isDarkMode ? "bg-rose-500/10 border-rose-500/20 text-rose-400" : "bg-rose-50 border-rose-200 text-rose-800")
                                  }\`}>
                                    <div className={\`p-2 rounded-xl shrink-0 \${isBalanced ? "bg-emerald-500/20 text-emerald-500" : "bg-rose-500/20 text-rose-500"}\`}>
                                      {isBalanced ? (
                                        <CheckCircle2 className="h-5 w-5" />
                                      ) : (
                                        <AlertTriangle className="h-5 w-5 animate-pulse" />
                                      )}
                                    </div>
                                    <div className="text-[10px] leading-relaxed flex-1">
                                      <span className="font-black block mb-1 text-[11.5px]">موازنه دو طرفه حسابداری</span>
                                      {isBalanced ? (
                                        <span>انطباق کامل ریاضی! تراز ۱۰۰٪ برقرار است.</span>
                                      ) : (
                                        <span>
                                          هشدار! اختلاف مجموع بدهکار و بستانکار
                                          <span className="font-black font-mono mx-1.5 text-rose-500 dark:text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded-md">{(Math.abs(sumDebit - sumCredit)).toLocaleString("fa-IR")}</span> 
                                          ریال می‌باشد.
                                        </span>
                                      )}
                                    </div>
                                  </div>`;

const lines = fs.readFileSync('src/App.tsx', 'utf-8').split('\n');

const startIdx = lines.findIndex(line => line.trim() === "{activeValidationSubTab === 'threshold' && (");
const endIdx = lines.findIndex(line => line.includes('<div className="text-[9px] leading-tight flex-1">'));

if (startIdx !== -1 && endIdx !== -1) {
  // Find the exact end block
  const realEndIdx = endIdx + 11; // 11 lines down is the closing div of the first issue
  
  const newLines = [
    ...lines.slice(0, startIdx),
    ...diffStr.split('\n'),
    ...lines.slice(realEndIdx)
  ];
  fs.writeFileSync('src/App.tsx', newLines.join('\n'));
  console.log('Fixed tabs UI');
} else {
  console.log('Could not find index', startIdx, endIdx);
}
