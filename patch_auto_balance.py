import sys

with open("src/App.tsx", "r", encoding="utf-8") as f:
    content = f.read()

target_start = """                                <div className="pt-2 border-t border-rose-500/10 flex justify-between items-center text-[10px]">
                                  <span className="text-slate-400 font-medium">میزان اختلاف تراز:</span>
                                  <span className="font-mono font-bold text-rose-500" dir="ltr">
                                    {imbalanceAmount.toLocaleString("fa-IR")} {mainCurrency}
                                  </span>
                                </div>
                              </div>"""

new_content = """                                <div className="pt-2 border-t border-rose-500/10 flex justify-between items-center text-[10px] mb-2">
                                  <span className="text-slate-400 font-medium">میزان اختلاف تراز:</span>
                                  <span className="font-mono font-bold text-rose-500" dir="ltr">
                                    {imbalanceAmount.toLocaleString("fa-IR")} {mainCurrency}
                                  </span>
                                </div>
                                <button
                                  onClick={() => {
                                    const isDebitHeavy = totalDebit > totalCredit;
                                    const sideName = isDebitHeavy ? "بستانکار" : "بدهکار";
                                    if (confirm(`اختلاف تراز به مبلغ ${imbalanceAmount.toLocaleString("fa-IR")} ${mainCurrency} تشخیص داده شد.\\nآیا مایلید سیستم یک ردیف تعدیلی (جهت رفع خطای گردکردن OCR) به بخش ${sideName} اضافه کند تا سند تراز شود؟`)) {
                                      const adjustmentRow: TransactionItem = {
                                        id: "auto-bal-" + Date.now(),
                                        شماره_سند: filteredTransactions.length > 0 ? (filteredTransactions[filteredTransactions.length - 1].شماره_سند || "-") : "-",
                                        تاریخ: filteredTransactions.length > 0 ? (filteredTransactions[filteredTransactions.length - 1].تاریخ || "-") : "-",
                                        نام_طرف_حساب: "تعدیل سیستمی (Auto-Balance)",
                                        شرح: "رفع مغایرت ناشی از خطای OCR",
                                        مبلغ_بدهکار: isDebitHeavy ? 0 : imbalanceAmount,
                                        مبلغ_بستانکار: isDebitHeavy ? imbalanceAmount : 0,
                                        نوع_ارز: mainCurrency,
                                        توضیحات: "ترازسازی خودکار هوشمند",
                                        ضریب_اطمینان: 99
                                      };
                                      const updated = [...transactions, adjustmentRow];
                                      setTransactions(updated);
                                      try { setRawJsonText(JSON.stringify(updated, null, 2)); } catch(e) {}
                                      showNotification("سند با موفقیت به صورت خودکار تراز شد.", "success");
                                      logEvent("تراز خودکار سند", `ردیف تعدیلی به مبلغ ${imbalanceAmount} اضافه گردید.`);
                                    }
                                  }}
                                  className="w-full py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 transition-colors"
                                >
                                  <Scale className="w-3 h-3" />
                                  تنظیم خودکار (Auto-Balance)
                                </button>
                              </div>"""

if target_start in content:
    content = content.replace(target_start, new_content)
    with open("src/App.tsx", "w", encoding="utf-8") as f:
        f.write(content)
    print("Auto-Balance added successfully.")
else:
    print("Auto-Balance target block not found.")
