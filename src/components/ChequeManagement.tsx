import React, { useState, useEffect, useMemo } from "react";
import { ChevronLeft, Info, BookOpen, CreditCard, Filter, Plus, Building, Search, RefreshCw, Send, CheckCircle, AlertTriangle, CornerUpLeft } from "lucide-react";
import { ChequeManagementEngine, Cheque, ChequeType, ChequeStatus } from "../lib/cheque-engine";

interface ChequeManagementProps {
  isDarkMode: boolean;
  showNotification: (text: string, type?: "success" | "error" | "info") => void;
  onBack: () => void;
}

const engine = new ChequeManagementEngine();

export default function ChequeManagement({ isDarkMode, showNotification, onBack }: ChequeManagementProps) {
  const [cheques, setCheques] = useState<Cheque[]>([]);
  const [showFriendlyGuide, setShowFriendlyGuide] = useState(true);
  
  // New Cheque Form
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [chequeType, setChequeType] = useState<ChequeType>(ChequeType.RECEIVED);
  const [newCheque, setNewCheque] = useState({
    cheque_number: "", sayad_id: "", amount: "", drawer_bank: "", branch: "", payer_payee_id: "", maturity_date: ""
  });

  const loadCheques = () => {
    setCheques(engine.getAllCheques());
  };

  useEffect(() => {
    loadCheques();
  }, []);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCheque.amount || !newCheque.cheque_number || !newCheque.sayad_id) {
      showNotification("لطفاً اطلاعات ضروری چک (مبلغ، شماره، شناسه صیادی) را وارد کنید.", "error");
      return;
    }

    try {
      const result = engine.createCheque({
        cheque_number: newCheque.cheque_number,
        sayad_id: newCheque.sayad_id,
        amount: Number(newCheque.amount),
        drawer_bank: newCheque.drawer_bank,
        branch: newCheque.branch,
        payer_payee_id: newCheque.payer_payee_id || "Customer_A",
        maturity_date: newCheque.maturity_date || new Date().toISOString().split('T')[0],
        register_date: new Date().toISOString().split('T')[0],
        type: chequeType
      });
      
      showNotification(`چک با موفقیت ثبت شد و سند حسابداری مربوطه (${result.voucher?.id}) صادر گردید.`, "success");
      setIsFormOpen(false);
      setNewCheque({ cheque_number: "", sayad_id: "", amount: "", drawer_bank: "", branch: "", payer_payee_id: "", maturity_date: "" });
      loadCheques();
    } catch (err: any) {
      showNotification("خطا در ثبت چک.", "error");
    }
  };

  const handleTransition = (id: string, newStatus: ChequeStatus) => {
    const result = engine.transitionStatus(id, newStatus);
    if (result.success) {
      showNotification(`وضعیت چک با موفقیت به ${getStatusLabel(newStatus)} تغییر یافت. ${result.voucher ? `سند حسابداری ${result.voucher.id} ثبت شد.` : ""}`, "success");
      loadCheques();
    } else {
      showNotification(result.error || "خطا در تغییر وضعیت", "error");
    }
  };

  const getStatusLabel = (s: ChequeStatus) => {
    const labels: Record<string, string> = {
      [ChequeStatus.REGISTERED]: "موجود در صندوق",
      [ChequeStatus.SENT_TO_BANK]: "در جریان وصول",
      [ChequeStatus.COLLECTED]: "وصول شده",
      [ChequeStatus.BOUNCED]: "برگشتی",
      [ChequeStatus.RETURNED]: "عودت داده شده",
      [ChequeStatus.ISSUED]: "صادره / پرداخت شده",
      [ChequeStatus.CLEARED]: "پاس شده (کاردکس بانک)",
      [ChequeStatus.BOUNCED_PAID]: "برگشتی صادره"
    };
    return labels[s] || s;
  };

  const receivedCheques = useMemo(() => cheques.filter(c => c.type === ChequeType.RECEIVED), [cheques]);
  const paidCheques = useMemo(() => cheques.filter(c => c.type === ChequeType.PAID), [cheques]);

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col max-w-6xl mx-auto w-full animate-fade-in" dir="rtl">
      {/* Header and Back */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className={`text-xl font-black tracking-tight ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>
              مدیریت چک‌های دریافتی و پرداختی (اسناد تجاری)
            </h2>
            <button
              onClick={() => setShowFriendlyGuide(!showFriendlyGuide)}
              className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 flex items-center gap-1 hover:bg-indigo-500/20 transition-all"
            >
              <Info className="w-3.5 h-3.5" />
              {showFriendlyGuide ? "پنهان‌سازی آموزش" : "آموزش گام به گام موتور چک"}
            </button>
          </div>
          <p className={`text-xs mt-1.5 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
             رهگیری کامل چرخه‌عمر چک‌ها، منطبق بر معماری حسابداری دوبل و تولید خودکار اسناد مالی (Journal Vouchers).
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
                💡 این ماژول چگونه کار می‌کند؟ (موتور تولید سند حسابداری خودکار)
              </h3>
              <p className="text-xs leading-relaxed opacity-90 mb-4">
                مدیریت چک در این سیستم یک <strong>دفترچه یادداشت ساده نیست</strong>! پشت این فرم‌ها یک <strong>موتور حسابداری قدرتمند</strong> قرار دارد. وقتی وضعیت چک را تغییر می‌دهید، سیستم به صورت کاملاً خودکار <strong>سند حسابداری معادل</strong> آن را تنظیم می‌کند:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div className={`p-3.5 rounded-xl border ${isDarkMode ? "bg-slate-950/40 border-slate-850" : "bg-white border-slate-100"}`}>
                  <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 mb-2">چک‌های دریافتی (مشتریان)</span>
                  <ul className="text-[11px] leading-relaxed opacity-85 space-y-2 list-disc list-inside">
                    <li><strong>ثبت چک در صندوق:</strong> بدهکار شدن «اسناد دریافتنی» / بستانکار شدن «مشتری»</li>
                    <li><strong>خواباندن به حساب (واگذاری):</strong> بدهکار شدن «اسناد در جریان وصول» / بستانکار شدن «اسناد دریافتنی»</li>
                    <li><strong>وصول شدن چک:</strong> بدهکار شدن «بانک» / بستانکار شدن «اسناد در جریان وصول»</li>
                  </ul>
                </div>

                <div className={`p-3.5 rounded-xl border ${isDarkMode ? "bg-slate-950/40 border-slate-850" : "bg-white border-slate-100"}`}>
                  <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-500 mb-2">چک‌های پرداختی (تامین‌کنندگان)</span>
                  <ul className="text-[11px] leading-relaxed opacity-85 space-y-2 list-disc list-inside">
                    <li><strong>صدور چک:</strong> بدهکار شدن «حساب‌های پرداختنی» / بستانکار شدن «اسناد پرداختنی»</li>
                    <li><strong>پاس شدن در بانک:</strong> بدهکار شدن «اسناد پرداختنی» / بستانکار شدن «موجودی نقد و بانک»</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Bar */}
      <div className="flex justify-between items-center mb-6">
        <h3 className={`text-lg font-black tracking-tight ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>
          صندوق چک‌ها
        </h3>
        <button
          onClick={() => setIsFormOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          ثبت چک جدید
        </button>
      </div>

      {/* New Cheque Form */}
      {isFormOpen && (
        <div className={`p-6 rounded-2xl border mb-6 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-sm">ثبت چک و تولید خودکار سند</h4>
            <div className="flex gap-2">
              <button 
                onClick={() => setChequeType(ChequeType.RECEIVED)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${chequeType === ChequeType.RECEIVED ? "bg-blue-500 text-white" : isDarkMode ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"}`}
              >
                دریافتی از مشتری
              </button>
              <button 
                onClick={() => setChequeType(ChequeType.PAID)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${chequeType === ChequeType.PAID ? "bg-purple-500 text-white" : isDarkMode ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"}`}
              >
                پرداختی به تامین‌کننده
              </button>
            </div>
          </div>

          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold mb-1.5 opacity-80">شماره سریال چک *</label>
              <input type="text" value={newCheque.cheque_number} onChange={e => setNewCheque({...newCheque, cheque_number: e.target.value})} className={`w-full p-2.5 rounded-lg text-xs font-mono border ${isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"}`} placeholder="123456" />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5 opacity-80">شناسه ۱۶ رقمی صیادی *</label>
              <input type="text" value={newCheque.sayad_id} onChange={e => setNewCheque({...newCheque, sayad_id: e.target.value})} className={`w-full p-2.5 rounded-lg text-xs font-mono border ${isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"}`} placeholder="xxxxxxxxxxxxxxxx" />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5 opacity-80">مبلغ (ریال) *</label>
              <input type="number" value={newCheque.amount} onChange={e => setNewCheque({...newCheque, amount: e.target.value})} className={`w-full p-2.5 rounded-lg text-xs font-mono border ${isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"}`} placeholder="500000000" />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5 opacity-80">نام بانک عهده</label>
              <input type="text" value={newCheque.drawer_bank} onChange={e => setNewCheque({...newCheque, drawer_bank: e.target.value})} className={`w-full p-2.5 rounded-lg text-xs border ${isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"}`} placeholder="بانک ملت" />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5 opacity-80">تاریخ سررسید چک</label>
              <input type="date" value={newCheque.maturity_date} onChange={e => setNewCheque({...newCheque, maturity_date: e.target.value})} className={`w-full p-2.5 rounded-lg text-xs font-mono border ${isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"}`} />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5 opacity-80">شخص طرف حساب (کد تفصیلی)</label>
              <input type="text" value={newCheque.payer_payee_id} onChange={e => setNewCheque({...newCheque, payer_payee_id: e.target.value})} className={`w-full p-2.5 rounded-lg text-xs font-mono border ${isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"}`} placeholder="Cust_1204" />
            </div>
            <div className="md:col-span-3 flex justify-end gap-3 mt-2">
              <button type="button" onClick={() => setIsFormOpen(false)} className={`px-4 py-2 text-xs font-bold rounded-xl ${isDarkMode ? "bg-slate-800 hover:bg-slate-700" : "bg-slate-200 hover:bg-slate-300"}`}>
                انصراف
              </button>
              <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-xl text-xs font-bold">
                ثبت سند
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Received Cheques List */}
        <div className={`rounded-2xl border flex flex-col overflow-hidden ${isDarkMode ? "border-slate-800 bg-slate-900/40" : "border-slate-200 bg-white"}`}>
          <div className={`p-4 flex items-center gap-2 border-b ${isDarkMode ? "border-slate-800" : "border-slate-100"}`}>
            <div className="p-1.5 rounded bg-blue-500/10 text-blue-500"><CreditCard className="w-4 h-4" /></div>
            <h4 className="font-bold text-sm">چک‌های دریافتی از مشتریان</h4>
          </div>
          <div className="p-4 flex-1 flex flex-col gap-3">
            {receivedCheques.length === 0 ? (
               <div className="flex-1 flex items-center justify-center text-xs opacity-50 py-10">هیچ چکی ثبت نشده است.</div>
            ) : (
              receivedCheques.map(c => (
                <div key={c.id} className={`p-4 rounded-xl border flex flex-col gap-3 ${isDarkMode ? "bg-slate-950/50 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-sm tracking-widest">{c.cheque_number}</span>
                    <span className="text-blue-500 font-bold text-xs">{c.amount.toLocaleString()} ریال</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] opacity-70">
                    <span>بانک: {c.drawer_bank || "نامشخص"}</span>
                    <span>سررسید: {c.maturity_date}</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mt-2 pt-3 border-t border-slate-200/10 border-dashed">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${
                      c.current_status === ChequeStatus.REGISTERED ? "bg-amber-500/10 text-amber-500" :
                      c.current_status === ChequeStatus.SENT_TO_BANK ? "bg-blue-500/10 text-blue-500" :
                      c.current_status === ChequeStatus.COLLECTED ? "bg-emerald-500/10 text-emerald-500" :
                      "bg-rose-500/10 text-rose-500"
                    }`}>
                      وضعیت: {getStatusLabel(c.current_status)}
                    </span>

                    <div className="flex gap-1.5">
                      {c.current_status === ChequeStatus.REGISTERED && (
                        <button onClick={() => handleTransition(c.id, ChequeStatus.SENT_TO_BANK)} className="bg-blue-500 hover:bg-blue-400 text-white p-1.5 rounded-lg flex items-center gap-1 text-[10px]" title="واگذاری به بانک">
                          <Send className="w-3.5 h-3.5" /> خواباندن به حساب
                        </button>
                      )}
                      {c.current_status === ChequeStatus.SENT_TO_BANK && (
                        <button onClick={() => handleTransition(c.id, ChequeStatus.COLLECTED)} className="bg-emerald-500 hover:bg-emerald-400 text-white p-1.5 rounded-lg flex items-center gap-1 text-[10px]" title="وصول">
                          <CheckCircle className="w-3.5 h-3.5" /> وصول شد
                        </button>
                      )}
                      {(c.current_status === ChequeStatus.REGISTERED || c.current_status === ChequeStatus.SENT_TO_BANK) && (
                         <button onClick={() => handleTransition(c.id, ChequeStatus.BOUNCED)} className="bg-rose-500 hover:bg-rose-400 text-white p-1.5 rounded-lg flex items-center gap-1 text-[10px]" title="برگشت زدن">
                         <AlertTriangle className="w-3.5 h-3.5" /> برگشت
                       </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Paid Cheques List */}
        <div className={`rounded-2xl border flex flex-col overflow-hidden ${isDarkMode ? "border-slate-800 bg-slate-900/40" : "border-slate-200 bg-white"}`}>
          <div className={`p-4 flex items-center gap-2 border-b ${isDarkMode ? "border-slate-800" : "border-slate-100"}`}>
            <div className="p-1.5 rounded bg-purple-500/10 text-purple-500"><Building className="w-4 h-4" /></div>
            <h4 className="font-bold text-sm">چک‌های پرداختی (صادره)</h4>
          </div>
          <div className="p-4 flex-1 flex flex-col gap-3">
             {paidCheques.length === 0 ? (
               <div className="flex-1 flex items-center justify-center text-xs opacity-50 py-10">هیچ چکی صادر نشده است.</div>
            ) : (
              paidCheques.map(c => (
                <div key={c.id} className={`p-4 rounded-xl border flex flex-col gap-3 ${isDarkMode ? "bg-slate-950/50 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-sm tracking-widest">{c.cheque_number}</span>
                    <span className="text-purple-500 font-bold text-xs">{c.amount.toLocaleString()} ریال</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] opacity-70">
                    <span>در وجه: {c.payer_payee_id}</span>
                    <span>سررسید: {c.maturity_date}</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mt-2 pt-3 border-t border-slate-200/10 border-dashed">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${
                      c.current_status === ChequeStatus.ISSUED ? "bg-amber-500/10 text-amber-500" :
                      c.current_status === ChequeStatus.CLEARED ? "bg-emerald-500/10 text-emerald-500" :
                      "bg-rose-500/10 text-rose-500"
                    }`}>
                      وضعیت: {getStatusLabel(c.current_status)}
                    </span>

                    <div className="flex gap-1.5">
                      {c.current_status === ChequeStatus.ISSUED && (
                        <button onClick={() => handleTransition(c.id, ChequeStatus.CLEARED)} className="bg-emerald-500 hover:bg-emerald-400 text-white p-1.5 rounded-lg flex items-center gap-1 text-[10px]" title="پاس شدن">
                          <CheckCircle className="w-3.5 h-3.5" /> پاس شد
                        </button>
                      )}
                      {c.current_status === ChequeStatus.ISSUED && (
                        <button onClick={() => handleTransition(c.id, ChequeStatus.BOUNCED_PAID)} className="bg-rose-500 hover:bg-rose-400 text-white p-1.5 rounded-lg flex items-center gap-1 text-[10px]" title="برگشتی">
                          <AlertTriangle className="w-3.5 h-3.5" /> برگشتی
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
