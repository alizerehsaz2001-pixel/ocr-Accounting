import React, { useState, useEffect, useMemo } from "react";
import { ChevronLeft, Info, BookOpen, Landmark, Search, FileText, ArrowRightLeft, RefreshCw, CheckCircle, PlusCircle, AlertCircle, PlayCircle } from "lucide-react";
import { BankOperationsEngine, BankStatementStatus } from "../lib/bank-engine";

interface BankOperationsProps {
  isDarkMode: boolean;
  showNotification: (text: string, type?: "success" | "error" | "info") => void;
  onBack: () => void;
}

const engine = new BankOperationsEngine();

export default function BankOperations({ isDarkMode, showNotification, onBack }: BankOperationsProps) {
  const [activeTab, setActiveTab] = useState<"transfers" | "reconciliation">("transfers");
  const [showFriendlyGuide, setShowFriendlyGuide] = useState(true);

  // Transfers State
  const [transfers, setTransfers] = useState(engine.getTransfers());
  const [newTransfer, setNewTransfer] = useState({
    sourceBank: "", destBank: "", amount: "", trackingNum: "", description: ""
  });

  // Reconciliation State
  const [statements, setStatements] = useState(engine.getStatements());
  const [ledgerLines, setLedgerLines] = useState(engine.getLedgerLines());
  const [selectedBank, setSelectedBank] = useState("Bank_Mellat");
  const [importText, setImportText] = useState("");

  const loadData = () => {
    setTransfers([...engine.getTransfers()]);
    setStatements([...engine.getStatements()]);
    setLedgerLines([...engine.getLedgerLines()]);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTransfer.sourceBank || !newTransfer.destBank || !newTransfer.amount) {
      showNotification("لطفاً فیلدهای ضروری حواله را پر کنید.", "error");
      return;
    }
    const result = engine.executeTransfer(
      newTransfer.sourceBank,
      newTransfer.destBank,
      Number(newTransfer.amount),
      new Date().toISOString().split('T')[0],
      newTransfer.description,
      newTransfer.trackingNum
    );

    if (result.success) {
      showNotification(`حواله با موفقیت ثبت شد. سند حسابداری (${result.voucherId}) صادر گردید.`, "success");
      setNewTransfer({ sourceBank: "", destBank: "", amount: "", trackingNum: "", description: "" });
      loadData();
    } else {
      showNotification(result.error || "خطا در ثبت حواله", "error");
    }
  };

  const handleImportMock = () => {
    // Generate some mock statements for the selected bank
    const mockLines = [
      { bank_account_id: selectedBank, transaction_date: new Date().toISOString().split('T')[0], document_number: "REF-555", description: "واریز حواله ساتنا پایا", debit: 0, credit: 15000000, running_balance: 115000000 },
      { bank_account_id: selectedBank, transaction_date: new Date().toISOString().split('T')[0], document_number: "TRX-777", description: "پرداخت قبض برق", debit: 5000000, credit: 0, running_balance: 110000000 },
      { bank_account_id: selectedBank, transaction_date: new Date().toISOString().split('T')[0], document_number: "FEE-001", description: "کارمزد پیامک", debit: 150000, credit: 0, running_balance: 109850000 }
    ];
    const count = engine.importStatementLines(mockLines);
    showNotification(`${count} سطر صورتحساب با موفقیت ایمپورت شد.`, "success");
    loadData();
  };

  const handleAutoReconcile = () => {
    const result = engine.autoReconcile(selectedBank);
    if (result.matchedCount > 0) {
      showNotification(result.messages[0], "success");
    } else {
      showNotification(result.messages[0], "info");
    }
    loadData();
  };

  const handleBookFee = (id: string) => {
    const result = engine.bookBankFee(id);
    if (result.success) {
      showNotification(`هزینه کارمزد بانکی شناسایی و سند (${result.voucherId}) صادر شد.`, "success");
      loadData();
    } else {
      showNotification(result.error || "خطا در ثبت کارمزد", "error");
    }
  };

  const handleBookUnknownDeposit = (id: string) => {
    const result = engine.bookUnknownDeposit(id);
    if (result.success) {
      showNotification(`واریزی ناشناس به عنوان قلم باز شناسایی و سند (${result.voucherId}) صادر شد.`, "success");
      loadData();
    } else {
      showNotification(result.error || "خطا در ثبت واریزی ناشناس", "error");
    }
  };

  const filteredStatements = statements.filter(s => s.bank_account_id === selectedBank);
  const filteredLedger = ledgerLines.filter(l => l.bank_account_id === selectedBank);

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col max-w-6xl mx-auto w-full animate-fade-in" dir="rtl">
      {/* Header and Back */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className={`text-xl font-black tracking-tight ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>
              عملیات بانکی و مغایرت‌گیری
            </h2>
            <button
              onClick={() => setShowFriendlyGuide(!showFriendlyGuide)}
              className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 flex items-center gap-1 hover:bg-indigo-500/20 transition-all"
            >
              <Info className="w-3.5 h-3.5" />
              {showFriendlyGuide ? "پنهان‌سازی آموزش" : "آموزش معماری ماژول بانک"}
            </button>
          </div>
          <p className={`text-xs mt-1.5 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
             انتقال وجه بین بانکی و تطبیق هوشمند تراکنش‌های دفتر کل با فایل‌های خروجی بانک (Excel/CSV).
          </p>
        </div>
        <button
          onClick={onBack}
          className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all ${
            isDarkMode ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-white border text-slate-600 hover:bg-slate-50"
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
          بازگشت به خزانه‌داری
        </button>
      </div>

      {/* Friendly Guide */}
      {showFriendlyGuide && (
        <div className={`p-5 rounded-2xl border mb-6 transition-all ${
          isDarkMode ? "bg-indigo-950/15 border-indigo-900/40 text-slate-200" : "bg-indigo-50/40 border-indigo-100 text-slate-800"
        }`}>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 shrink-0 mt-0.5">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-sm text-indigo-600 dark:text-indigo-400 mb-2">
                💡 معماری فنی و حسابداری این ماژول
              </h3>
              <p className="text-xs leading-relaxed opacity-90 mb-4">
                این بخش بر اساس بالاترین استانداردهای معماری نرم‌افزارهای بانکی (Core Banking) و اصول حسابداری دوبل طراحی شده است:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                <div className={`p-3.5 rounded-xl border ${isDarkMode ? "bg-slate-950/40 border-slate-850" : "bg-white border-slate-100"}`}>
                  <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 mb-2">۱. حواله یکپارچه (Single-JV)</span>
                  <p className="text-[11px] leading-relaxed opacity-85">
                    انتقال بین دو حساب بانکی شما، در قالب <strong>یک سند واحد (یک رکورد)</strong> ثبت می‌شود. بانک مقصد بدهکار و بانک مبدا بستانکار می‌شود. این کار از اشتباه و ثبت دوگانه (Double Transaction) جلوگیری می‌کند.
                  </p>
                </div>

                <div className={`p-3.5 rounded-xl border ${isDarkMode ? "bg-slate-950/40 border-slate-850" : "bg-white border-slate-100"}`}>
                  <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-500 mb-2">۲. اقلام باز (Open Items)</span>
                  <p className="text-[11px] leading-relaxed opacity-85">
                    پس از آپلود فایل اکسل بانک، سیستم تراکنش‌ها را مغایرت‌گیری می‌کند. اگر مشتری پولی واریز کرده باشد که شما ثبت نکرده‌اید (یا کارمزد پنهان)، سیستم آن‌ها را باز می‌گذارد تا <strong>با یک کلیک سند صدور بزنید</strong>.
                  </p>
                </div>

                <div className={`p-3.5 rounded-xl border ${isDarkMode ? "bg-slate-950/40 border-slate-850" : "bg-white border-slate-100"}`}>
                  <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 mb-2">۳. ایزوله‌سازی ACID</span>
                  <p className="text-[11px] leading-relaxed opacity-85">
                    الگوریتم مغایرت‌گیری به شکل تراکنش‌های ACID نوشته شده. یعنی اگر در بررسی هزارمین رکورد خطایی رخ دهد، کل فرایند <strong>Rollback</strong> می‌شود تا دیتابیس هرگز دچار تناقض و به‌هم‌ریختگی نشود.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6">
        <button
          onClick={() => setActiveTab("transfers")}
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === "transfers"
              ? "border-indigo-500 text-indigo-500"
              : "border-transparent text-slate-500 hover:text-slate-400"
          }`}
        >
          حواله بین بانکی
        </button>
        <button
          onClick={() => setActiveTab("reconciliation")}
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === "reconciliation"
              ? "border-indigo-500 text-indigo-500"
              : "border-transparent text-slate-500 hover:text-slate-400"
          }`}
        >
          مغایرت‌گیری بانکی
        </button>
      </div>

      {activeTab === "transfers" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={`p-6 rounded-2xl border ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} lg:col-span-1`}>
            <h4 className="font-bold text-sm mb-4 flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-indigo-500" /> ثبت حواله جدید
            </h4>
            <form onSubmit={handleTransfer} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold mb-1.5 opacity-80">از حساب (مبدا) *</label>
                <select value={newTransfer.sourceBank} onChange={e => setNewTransfer({...newTransfer, sourceBank: e.target.value})} className={`w-full p-2.5 rounded-lg text-xs font-mono border ${isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                   <option value="">انتخاب بانک...</option>
                   <option value="Bank_Mellat">بانک ملت - جاری</option>
                   <option value="Bank_Saman">بانک سامان - کوتاه‌مدت</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5 opacity-80">به حساب (مقصد) *</label>
                <select value={newTransfer.destBank} onChange={e => setNewTransfer({...newTransfer, destBank: e.target.value})} className={`w-full p-2.5 rounded-lg text-xs font-mono border ${isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                   <option value="">انتخاب بانک...</option>
                   <option value="Bank_Mellat">بانک ملت - جاری</option>
                   <option value="Bank_Saman">بانک سامان - کوتاه‌مدت</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5 opacity-80">مبلغ (ریال) *</label>
                <input type="number" value={newTransfer.amount} onChange={e => setNewTransfer({...newTransfer, amount: e.target.value})} className={`w-full p-2.5 rounded-lg text-xs font-mono border ${isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"}`} placeholder="مثلا 10000000" />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5 opacity-80">شماره پیگیری</label>
                <input type="text" value={newTransfer.trackingNum} onChange={e => setNewTransfer({...newTransfer, trackingNum: e.target.value})} className={`w-full p-2.5 rounded-lg text-xs font-mono border ${isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"}`} />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5 opacity-80">شرح</label>
                <input type="text" value={newTransfer.description} onChange={e => setNewTransfer({...newTransfer, description: e.target.value})} className={`w-full p-2.5 rounded-lg text-xs border ${isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"}`} />
              </div>
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl text-xs font-bold mt-2">
                ثبت حواله و تولید سند
              </button>
            </form>
          </div>
          <div className="lg:col-span-2 flex flex-col gap-4">
             <div className={`p-4 rounded-xl border flex items-center gap-2 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
               <div className="p-1.5 rounded bg-blue-500/10 text-blue-500"><Landmark className="w-4 h-4" /></div>
               <h4 className="font-bold text-sm">لیست حواله‌های ثبت شده</h4>
             </div>
             {transfers.length === 0 ? (
               <div className="flex-1 flex items-center justify-center text-xs opacity-50 py-10">حواله‌ای یافت نشد.</div>
             ) : (
               transfers.map(t => (
                 <div key={t.id} className={`p-4 rounded-xl border flex flex-col gap-2 ${isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                    <div className="flex items-center justify-between">
                       <span className="font-bold text-xs">{t.description || "حواله وجه"}</span>
                       <span className="text-blue-500 font-bold text-xs">{t.amount.toLocaleString()} ریال</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] opacity-70 font-mono">
                      <span>از: {t.source_bank_account_id}</span>
                      <span>به: {t.destination_bank_account_id}</span>
                      <span>سند: {t.journal_voucher_id}</span>
                    </div>
                 </div>
               ))
             )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
           <div className={`p-4 rounded-2xl border flex flex-col md:flex-row gap-4 items-center justify-between ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
              <div className="flex items-center gap-4 w-full md:w-auto">
                 <select value={selectedBank} onChange={e => setSelectedBank(e.target.value)} className={`p-2 rounded-lg text-xs font-bold border ${isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200"}`}>
                   <option value="Bank_Mellat">بانک ملت - جاری</option>
                   <option value="Bank_Saman">بانک سامان - کوتاه‌مدت</option>
                 </select>
                 <button onClick={handleImportMock} className="px-4 py-2 text-[10px] font-bold rounded-lg border bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/20 transition-all flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    آپلود فایل Excel / CSV بانک
                 </button>
              </div>
              <button onClick={handleAutoReconcile} className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all">
                 <RefreshCw className="w-4 h-4" /> تطبیق هوشمند (ACID Transaction)
              </button>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bank Statement Column */}
              <div className={`rounded-2xl border flex flex-col overflow-hidden ${isDarkMode ? "border-slate-800 bg-slate-900/40" : "border-slate-200 bg-white"}`}>
                <div className={`p-4 flex items-center justify-between border-b ${isDarkMode ? "border-slate-800" : "border-slate-100"}`}>
                  <h4 className="font-bold text-sm">ردیف‌های فایل خروجی بانک</h4>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${isDarkMode ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"}`}>Imported Statement</span>
                </div>
                <div className="p-4 flex-1 flex flex-col gap-3">
                  {filteredStatements.length === 0 ? (
                    <div className="text-center text-xs opacity-50 py-10 flex flex-col items-center gap-2">
                      <FileText className="w-6 h-6 opacity-40" />
                      فایل اکسل بانک هنوز آپلود نشده است.
                    </div>
                  ) : (
                    filteredStatements.map(s => (
                      <div key={s.id} className={`p-3 rounded-xl border flex flex-col gap-2 ${
                        s.reconciliation_status === BankStatementStatus.AUTO_MATCHED ? (isDarkMode ? "bg-emerald-900/20 border-emerald-900" : "bg-emerald-50 border-emerald-100") :
                        (isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200")
                      }`}>
                         <div className="flex justify-between items-start">
                           <span className="font-bold text-xs">{s.description}</span>
                           <span className={`text-xs font-bold ${s.credit > 0 ? "text-emerald-500" : "text-rose-500"}`}>
                             {s.credit > 0 ? "+" : "-"}{(s.credit || s.debit).toLocaleString()}
                           </span>
                         </div>
                         <div className="flex justify-between items-center mt-1 pt-1.5 border-t border-slate-200/10 border-dashed">
                            <span className="text-[10px] opacity-70 font-mono">پیگیری: {s.document_number}</span>
                            {s.reconciliation_status === BankStatementStatus.UNMATCHED ? (
                               <div className="flex items-center gap-2">
                                 <span className="text-[9px] text-slate-500 font-bold bg-slate-500/10 px-1.5 py-0.5 rounded">قلم باز</span>
                                 {s.debit > 0 && s.debit < 500000 ? (
                                    <button onClick={() => handleBookFee(s.id)} className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/20 hover:bg-amber-500/20 transition-all flex items-center gap-1">
                                       <PlusCircle className="w-3 h-3" /> ثبت کارمزد
                                    </button>
                                 ) : s.credit > 0 ? (
                                    <button onClick={() => handleBookUnknownDeposit(s.id)} className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20 hover:bg-emerald-500/20 transition-all flex items-center gap-1">
                                       <PlusCircle className="w-3 h-3" /> ثبت واریزی ناشناس
                                    </button>
                                 ) : (
                                    <span className="text-[10px] font-bold text-rose-500 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> نامشخص</span>
                                 )}
                               </div>
                            ) : (
                               <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1"><CheckCircle className="w-3 h-3"/> تطبیق شد</span>
                            )}
                         </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* System Ledger Column */}
              <div className={`rounded-2xl border flex flex-col overflow-hidden ${isDarkMode ? "border-slate-800 bg-slate-900/40" : "border-slate-200 bg-white"}`}>
                <div className={`p-4 flex items-center justify-between border-b ${isDarkMode ? "border-slate-800" : "border-slate-100"}`}>
                  <h4 className="font-bold text-sm">اسناد حسابداری (دفتر معین بانک)</h4>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${isDarkMode ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"}`}>System Ledger</span>
                </div>
                <div className="p-4 flex-1 flex flex-col gap-3">
                   {filteredLedger.length === 0 ? (
                    <div className="text-center text-xs opacity-50 py-10">سندی در دفتر کل یافت نشد.</div>
                  ) : (
                    filteredLedger.map(l => (
                      <div key={l.id} className={`p-3 rounded-xl border flex flex-col gap-2 ${
                        l.is_reconciled ? (isDarkMode ? "bg-emerald-900/20 border-emerald-900" : "bg-emerald-50 border-emerald-100") :
                        (isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200")
                      }`}>
                         <div className="flex justify-between items-start">
                           <span className="font-bold text-xs">{l.description}</span>
                           {/* In ledger, Debit to Bank means deposit (+) */}
                           <span className={`text-xs font-bold ${l.debit > 0 ? "text-emerald-500" : "text-rose-500"}`}>
                             {l.debit > 0 ? "+" : "-"}{(l.debit || l.credit).toLocaleString()}
                           </span>
                         </div>
                         <div className="flex justify-between items-center mt-1">
                            <span className="text-[10px] opacity-70 font-mono">پیگیری: {l.document_number}</span>
                            {l.is_reconciled ? (
                               <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1"><CheckCircle className="w-3 h-3"/> تطبیق شد</span>
                            ) : (
                               <span className="text-[10px] font-bold text-rose-500 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> نامشخص</span>
                            )}
                         </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
