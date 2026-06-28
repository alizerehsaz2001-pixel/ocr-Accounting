import React, { useState, useEffect } from "react";
import { ChevronLeft, Info, BookOpen, Coins, Search, FileText, PlusCircle, CheckCircle, Wallet, FileCheck2, HandCoins } from "lucide-react";
import { PettyCashEngine, PettyCashFund, PettyCashVoucher, PettyCashLine, VoucherStatus } from "../lib/petty-cash-engine";

interface PettyCashProps {
  isDarkMode: boolean;
  showNotification: (text: string, type?: "success" | "error" | "info") => void;
  onBack: () => void;
}

const engine = new PettyCashEngine();

export default function PettyCashManagement({ isDarkMode, showNotification, onBack }: PettyCashProps) {
  const [activeTab, setActiveTab] = useState<"funds" | "vouchers">("funds");
  const [showFriendlyGuide, setShowFriendlyGuide] = useState(true);

  const [funds, setFunds] = useState<PettyCashFund[]>([]);
  const [vouchers, setVouchers] = useState<PettyCashVoucher[]>([]);
  
  // Replenish state
  const [isReplenishOpen, setIsReplenishOpen] = useState(false);
  const [selectedFundId, setSelectedFundId] = useState("");
  const [replenishAmount, setReplenishAmount] = useState("");

  // Voucher state
  const [isVoucherOpen, setIsVoucherOpen] = useState(false);
  const [newVoucher, setNewVoucher] = useState({ description: "", fundId: "" });
  
  // Expense line state
  const [activeVoucherId, setActiveVoucherId] = useState("");
  const [newExpense, setNewExpense] = useState({ amount: "", taxAmount: "0", expenseCode: "5102", invoiceNum: "", description: "" });
  const [lines, setLines] = useState<PettyCashLine[]>([]);

  const loadData = () => {
    setFunds([...engine.getFunds()]);
    setVouchers([...engine.getVouchers()]);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleReplenish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFundId || !replenishAmount) {
       showNotification("لطفاً تنخواه و مبلغ شارژ را مشخص کنید.", "error");
       return;
    }
    const result = engine.replenishFund(selectedFundId, "Bank_Melli", Number(replenishAmount));
    if (result.success) {
      showNotification(`تنخواه شارژ شد و سند اتوماتیک (${result.voucherId}) صادر گردید.`, "success");
      setIsReplenishOpen(false);
      setReplenishAmount("");
      loadData();
    } else {
      showNotification(result.error || "خطا در شارژ تنخواه", "error");
    }
  };

  const handleCreateVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVoucher.fundId || !newVoucher.description) return;
    const result = engine.createVoucher(newVoucher.fundId, newVoucher.description);
    if (result.success) {
       showNotification("صورت تنخواه (پیشنویس) ایجاد شد.", "success");
       setIsVoucherOpen(false);
       setNewVoucher({description: "", fundId: ""});
       loadData();
    }
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.amount || !newExpense.invoiceNum) return;
    const result = engine.addExpenseLine(activeVoucherId, newExpense.expenseCode, Number(newExpense.amount), Number(newExpense.taxAmount), newExpense.description, newExpense.invoiceNum);
    if (result.success) {
       showNotification("فاکتور به صورت تنخواه اضافه شد.", "success");
       setNewExpense({ amount: "", taxAmount: "0", expenseCode: "5102", invoiceNum: "", description: "" });
       setLines([...engine.getLines(activeVoucherId)]);
       loadData();
    } else {
       showNotification(result.error || "خطا در ثبت فاکتور", "error");
    }
  };

  const handleOpenVoucherDetails = (vId: string) => {
     setActiveVoucherId(vId);
     setLines([...engine.getLines(vId)]);
  };

  const handleSubmitVoucher = (vId: string) => {
    const res = engine.submitVoucher(vId);
    if (res.success) {
       showNotification("صورت تنخواه برای بررسی ارسال شد.", "success");
       loadData();
    } else showNotification(res.error || "", "error");
  };

  const handleSettleVoucher = (vId: string) => {
    const res = engine.settleAndPostPettyCash(vId);
    if (res.success) {
       showNotification(`تسویه موفق! موجودی شخص کاهش یافت و سند هزینه (${res.voucherId}) صادر شد.`, "success");
       setActiveVoucherId("");
       loadData();
    } else showNotification(res.error || "", "error");
  };

  const getStatusBadge = (status: VoucherStatus) => {
     switch(status) {
        case VoucherStatus.DRAFT: return <span className="bg-slate-500/10 text-slate-500 px-2 py-0.5 rounded text-[10px] font-bold">پیشنویس</span>;
        case VoucherStatus.SUBMITTED: return <span className="bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded text-[10px] font-bold">در انتظار تایید</span>;
        case VoucherStatus.POSTED: return <span className="bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded text-[10px] font-bold">تسویه شده / سند خورده</span>;
        default: return null;
     }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col max-w-6xl mx-auto w-full animate-fade-in" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className={`text-xl font-black tracking-tight ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>
              مدیریت صندوق و تنخواه‌گردان
            </h2>
            <button
              onClick={() => setShowFriendlyGuide(!showFriendlyGuide)}
              className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 flex items-center gap-1 hover:bg-indigo-500/20 transition-all"
            >
              <Info className="w-3.5 h-3.5" />
              {showFriendlyGuide ? "پنهان‌سازی آموزش" : "معماری تنخواه و تسویه"}
            </button>
          </div>
          <p className={`text-xs mt-1.5 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
             شارژ حساب اشخاص، ثبت موقت هزینه‌ها و تولید خودکار اسناد حسابداری تسویه.
          </p>
        </div>
        <button onClick={onBack} className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all ${isDarkMode ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-white border text-slate-600 hover:bg-slate-50"}`}>
          <ChevronLeft className="w-4 h-4" /> بازگشت به خزانه‌داری
        </button>
      </div>

      {/* Guide */}
      {showFriendlyGuide && (
        <div className={`p-5 rounded-2xl border mb-6 transition-all ${isDarkMode ? "bg-indigo-950/15 border-indigo-900/40 text-slate-200" : "bg-indigo-50/40 border-indigo-100 text-slate-800"}`}>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 shrink-0 mt-0.5"><BookOpen className="w-5 h-5" /></div>
            <div className="flex-1">
              <h3 className="font-bold text-sm text-indigo-600 dark:text-indigo-400 mb-2">💡 معماری تنخواه (Imprest System) در این ماژول</h3>
              <p className="text-xs leading-relaxed opacity-90 mb-4">
                 این سیستم بر اساس کنترل دقیق موجودی، تفصیلی‌های شناور و ایزوله‌سازی تراکنش‌ها کار می‌کند.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                <div className={`p-3.5 rounded-xl border ${isDarkMode ? "bg-slate-950/40 border-slate-850" : "bg-white border-slate-100"}`}>
                  <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 mb-2">۱. شارژ و کنترل سقف</span>
                  <p className="text-[11px] leading-relaxed opacity-85">با زدن دکمه شارژ، سند (بدهکار: شخص/تنخواه، بستانکار: بانک) صادر می‌شود. سیستم اجازه نمی‌دهد موجودی شخص از <strong>سقف مجاز</strong> فراتر رود.</p>
                </div>
                <div className={`p-3.5 rounded-xl border ${isDarkMode ? "bg-slate-950/40 border-slate-850" : "bg-white border-slate-100"}`}>
                  <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 mb-2">۲. حالت پیش‌نویس موقت</span>
                  <p className="text-[11px] leading-relaxed opacity-85">تا زمانی که مدیر مالی صورت تنخواه را تایید نکرده است، فاکتورها فقط موقت هستند و <strong>هیچ اثری در دفتر کل (Ledger)</strong> و ترازنامه نمی‌گذارند.</p>
                </div>
                <div className={`p-3.5 rounded-xl border ${isDarkMode ? "bg-slate-950/40 border-slate-850" : "bg-white border-slate-100"}`}>
                  <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 mb-2">۳. تسویه و تجمیع (ACID)</span>
                  <p className="text-[11px] leading-relaxed opacity-85">با تایید تسویه، یک سند <strong>تجمیعی</strong> (بدهکار: ده‌ها حساب هزینه، بستانکار: حساب شخص) به صورت <strong>ACID Transaction</strong> صادر می‌شود.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6">
        <button onClick={() => setActiveTab("funds")} className={`px-6 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === "funds" ? "border-indigo-500 text-indigo-500" : "border-transparent text-slate-500 hover:text-slate-400"}`}>
          <Wallet className="w-4 h-4" /> موجودی تنخواه‌ها
        </button>
        <button onClick={() => setActiveTab("vouchers")} className={`px-6 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === "vouchers" ? "border-indigo-500 text-indigo-500" : "border-transparent text-slate-500 hover:text-slate-400"}`}>
          <FileCheck2 className="w-4 h-4" /> صورت‌های هزینه (تسویه)
        </button>
      </div>

      {activeTab === "funds" && (
         <div className="flex flex-col gap-6">
            <div className="flex justify-end">
               <button onClick={() => setIsReplenishOpen(!isReplenishOpen)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
                 <HandCoins className="w-4 h-4" /> شارژ تنخواه (Replenish)
               </button>
            </div>
            {isReplenishOpen && (
               <form onSubmit={handleReplenish} className={`p-5 rounded-2xl border flex items-end gap-4 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
                 <div className="flex-1">
                   <label className="block text-xs font-bold mb-1.5 opacity-80">انتخاب تنخواه</label>
                   <select value={selectedFundId} onChange={e=>setSelectedFundId(e.target.value)} className={`w-full p-2.5 rounded-lg text-xs font-bold border ${isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                     <option value="">...</option>
                     {funds.map(f => <option key={f.id} value={f.id}>{f.fund_name} (کد شخص: {f.custodian_id})</option>)}
                   </select>
                 </div>
                 <div className="flex-1">
                   <label className="block text-xs font-bold mb-1.5 opacity-80">مبلغ شارژ (ریال) *</label>
                   <input type="number" value={replenishAmount} onChange={e=>setReplenishAmount(e.target.value)} className={`w-full p-2.5 rounded-lg text-xs font-mono border ${isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"}`} placeholder="مثلا 10000000" />
                 </div>
                 <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl text-xs font-bold h-[42px]">
                   شارژ و صدور سند
                 </button>
               </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {funds.map(f => (
                  <div key={f.id} className={`p-5 rounded-2xl border flex flex-col gap-4 ${isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200"}`}>
                     <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                           <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-500"><Wallet className="w-5 h-5"/></div>
                           <div>
                              <h3 className="font-black text-sm">{f.fund_name}</h3>
                              <p className="text-[10px] opacity-60 font-mono mt-0.5">کد شخص: {f.custodian_id}</p>
                           </div>
                        </div>
                        <span className="bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded text-[10px] font-bold">فعال</span>
                     </div>
                     <div className="mt-2">
                        <div className="flex justify-between text-xs mb-1.5">
                           <span className="opacity-70">موجودی فعلی:</span>
                           <span className="font-bold text-indigo-500">{f.current_balance.toLocaleString()} ریال</span>
                        </div>
                        <div className="flex justify-between text-xs mb-1.5">
                           <span className="opacity-70">سقف مجاز:</span>
                           <span className="font-bold">{f.max_ceiling_amount.toLocaleString()} ریال</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 mt-3">
                           <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${(f.current_balance/f.max_ceiling_amount)*100}%` }}></div>
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         </div>
      )}

      {activeTab === "vouchers" && (
         <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* Vouchers List */}
            <div className={`w-full lg:w-1/3 flex flex-col gap-4`}>
               <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-sm flex items-center gap-2"><FileText className="w-4 h-4 text-indigo-500"/> لیست صورت‌های هزینه</h3>
                  <button onClick={()=>setIsVoucherOpen(!isVoucherOpen)} className="text-[10px] font-bold bg-indigo-500/10 text-indigo-500 px-2 py-1 rounded-md hover:bg-indigo-500/20">+ صورت جدید</button>
               </div>
               
               {isVoucherOpen && (
                  <form onSubmit={handleCreateVoucher} className={`p-4 rounded-xl border flex flex-col gap-3 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
                     <select value={newVoucher.fundId} onChange={e=>setNewVoucher({...newVoucher, fundId: e.target.value})} className={`p-2 rounded-lg text-xs font-bold border ${isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                       <option value="">انتخاب تنخواه...</option>
                       {funds.map(f => <option key={f.id} value={f.id}>{f.fund_name}</option>)}
                     </select>
                     <input type="text" placeholder="شرح کلی صورت (مثلا هزینه‌های خرداد)" value={newVoucher.description} onChange={e=>setNewVoucher({...newVoucher, description: e.target.value})} className={`p-2 rounded-lg text-xs border ${isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"}`} />
                     <button type="submit" className="bg-indigo-600 text-white py-2 rounded-lg text-xs font-bold">ایجاد پیش‌نویس</button>
                  </form>
               )}

               <div className="flex flex-col gap-3">
                  {vouchers.map(v => (
                     <div key={v.id} onClick={()=>handleOpenVoucherDetails(v.id)} className={`p-4 rounded-xl border cursor-pointer transition-all ${activeVoucherId === v.id ? (isDarkMode ? "bg-indigo-900/20 border-indigo-500" : "bg-indigo-50 border-indigo-400") : (isDarkMode ? "bg-slate-900/40 border-slate-800 hover:border-slate-700" : "bg-white border-slate-200 hover:border-slate-300")}`}>
                        <div className="flex justify-between items-start mb-2">
                           <span className="font-bold text-xs">{v.description}</span>
                           {getStatusBadge(v.status)}
                        </div>
                        <div className="flex justify-between text-[10px] font-mono opacity-60">
                           <span>#{v.voucher_number}</span>
                           <span>{v.submission_date}</span>
                        </div>
                        <div className="mt-3 pt-2 border-t border-dashed border-slate-200/20 text-xs font-bold flex justify-between">
                           <span>جمع کل:</span>
                           <span className="text-indigo-500">{v.total_expense_amount.toLocaleString()} ریال</span>
                        </div>
                     </div>
                  ))}
                  {vouchers.length === 0 && <div className="text-center opacity-50 text-xs py-10">هیچ صورتی ثبت نشده است.</div>}
               </div>
            </div>

            {/* Voucher Details & Lines */}
            <div className={`w-full lg:w-2/3 p-6 rounded-2xl border flex flex-col ${isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200"}`}>
               {!activeVoucherId ? (
                  <div className="flex-1 flex flex-col items-center justify-center opacity-40 py-20">
                     <FileCheck2 className="w-12 h-12 mb-3" />
                     <p className="text-sm font-bold">برای مشاهده جزئیات، یک صورت را از لیست انتخاب کنید.</p>
                  </div>
               ) : (
                  <>
                     {(() => {
                        const v = vouchers.find(x => x.id === activeVoucherId);
                        if (!v) return null;
                        return (
                           <div className="flex flex-col h-full">
                              <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
                                 <div>
                                    <h3 className="font-black text-lg mb-1">{v.description}</h3>
                                    <div className="flex gap-3 text-xs opacity-60 font-mono">
                                       <span>شماره: {v.voucher_number}</span>
                                       <span>تاریخ: {v.submission_date}</span>
                                    </div>
                                 </div>
                                 <div className="flex gap-2">
                                    {v.status === VoucherStatus.DRAFT && (
                                       <button onClick={()=>handleSubmitVoucher(v.id)} className="bg-amber-500 hover:bg-amber-400 text-white px-4 py-2 rounded-xl text-xs font-bold">ارسال به مدیر مالی</button>
                                    )}
                                    {v.status === VoucherStatus.SUBMITTED && (
                                       <button onClick={()=>handleSettleVoucher(v.id)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
                                          <CheckCircle className="w-4 h-4"/> تایید نهایی و صدور سند ACID
                                       </button>
                                    )}
                                 </div>
                              </div>

                              {v.status === VoucherStatus.DRAFT && (
                                 <form onSubmit={handleAddExpense} className={`p-4 rounded-xl border mb-6 grid grid-cols-1 md:grid-cols-4 gap-3 ${isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                                    <div className="md:col-span-4 font-bold text-sm mb-1 text-indigo-500 flex items-center gap-1.5"><PlusCircle className="w-4 h-4"/> افزودن فاکتور جدید</div>
                                    <div>
                                       <select value={newExpense.expenseCode} onChange={e=>setNewExpense({...newExpense, expenseCode: e.target.value})} className={`w-full p-2 text-xs border rounded-lg ${isDarkMode?"bg-slate-900 border-slate-700":"bg-white border-slate-300"}`}>
                                          <option value="5102">هزینه ملزومات و لوازم تحریر</option>
                                          <option value="5103">هزینه ایاب و ذهاب</option>
                                          <option value="5104">هزینه تعمیرات جزئی</option>
                                       </select>
                                    </div>
                                    <div>
                                       <input type="text" placeholder="شماره فاکتور" value={newExpense.invoiceNum} onChange={e=>setNewExpense({...newExpense, invoiceNum: e.target.value})} className={`w-full p-2 text-xs font-mono border rounded-lg ${isDarkMode?"bg-slate-900 border-slate-700":"bg-white border-slate-300"}`} />
                                    </div>
                                    <div>
                                       <input type="number" placeholder="مبلغ اصل فاکتور" value={newExpense.amount} onChange={e=>setNewExpense({...newExpense, amount: e.target.value})} className={`w-full p-2 text-xs font-mono border rounded-lg ${isDarkMode?"bg-slate-900 border-slate-700":"bg-white border-slate-300"}`} />
                                    </div>
                                    <div className="flex gap-2">
                                       <input type="number" placeholder="مالیات" value={newExpense.taxAmount} onChange={e=>setNewExpense({...newExpense, taxAmount: e.target.value})} className={`w-full p-2 text-xs font-mono border rounded-lg ${isDarkMode?"bg-slate-900 border-slate-700":"bg-white border-slate-300"}`} />
                                       <button type="submit" className="bg-indigo-600 text-white px-3 rounded-lg font-bold text-xs">+</button>
                                    </div>
                                    <div className="md:col-span-4">
                                       <input type="text" placeholder="شرح رویداد..." value={newExpense.description} onChange={e=>setNewExpense({...newExpense, description: e.target.value})} className={`w-full p-2 text-xs border rounded-lg ${isDarkMode?"bg-slate-900 border-slate-700":"bg-white border-slate-300"}`} />
                                    </div>
                                 </form>
                              )}

                              <div className="flex-1 overflow-y-auto">
                                 <table className="w-full text-xs text-right border-collapse">
                                    <thead>
                                       <tr className={`border-b ${isDarkMode?"border-slate-800":"border-slate-200"}`}>
                                          <th className="py-3 px-2 font-bold opacity-70">کد هزینه</th>
                                          <th className="py-3 px-2 font-bold opacity-70">فاکتور</th>
                                          <th className="py-3 px-2 font-bold opacity-70">شرح</th>
                                          <th className="py-3 px-2 font-bold opacity-70">مالیات</th>
                                          <th className="py-3 px-2 font-bold opacity-70 text-left">مبلغ (ریال)</th>
                                       </tr>
                                    </thead>
                                    <tbody>
                                       {lines.map(l => (
                                          <tr key={l.id} className={`border-b border-dashed ${isDarkMode?"border-slate-800/50":"border-slate-100"}`}>
                                             <td className="py-3 px-2 font-mono opacity-80">{l.expense_account_id}</td>
                                             <td className="py-3 px-2 font-mono">{l.invoice_number}</td>
                                             <td className="py-3 px-2">{l.description}</td>
                                             <td className="py-3 px-2 font-mono opacity-80">{l.tax_amount.toLocaleString()}</td>
                                             <td className="py-3 px-2 font-mono font-bold text-left text-indigo-500">{l.amount.toLocaleString()}</td>
                                          </tr>
                                       ))}
                                       {lines.length === 0 && <tr><td colSpan={5} className="py-10 text-center opacity-50">فاکتوری ثبت نشده است.</td></tr>}
                                    </tbody>
                                 </table>
                              </div>
                           </div>
                        );
                     })()}
                  </>
               )}
            </div>
         </div>
      )}
    </div>
  );
}
