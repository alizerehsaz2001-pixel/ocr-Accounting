import React, { useState, useEffect } from "react";
import { 
  ChevronLeft, 
  Info, 
  BookOpen, 
  Coins, 
  Search, 
  FileText, 
  PlusCircle, 
  CheckCircle, 
  Wallet, 
  FileCheck2, 
  HandCoins, 
  Trash2, 
  Send, 
  XCircle, 
  RefreshCw, 
  Landmark, 
  ArrowUpDown, 
  Receipt, 
  Printer, 
  History, 
  Users, 
  Building,
  Plus
} from "lucide-react";
import { 
  PettyCashEngine, 
  PettyCashFund, 
  PettyCashVoucher, 
  PettyCashLine, 
  VoucherStatus, 
  CashRegister, 
  CashTransaction, 
  RecordStatus 
} from "../lib/petty-cash-engine";

interface PettyCashProps {
  isDarkMode: boolean;
  showNotification: (text: string, type?: "success" | "error" | "info") => void;
  onBack: () => void;
}

const engine = new PettyCashEngine();

export default function PettyCashManagement({ isDarkMode, showNotification, onBack }: PettyCashProps) {
  const [activeTab, setActiveTab] = useState<"registers" | "funds" | "vouchers">("registers");
  const [showFriendlyGuide, setShowFriendlyGuide] = useState(true);

  // Core Lists State
  const [registers, setRegisters] = useState<CashRegister[]>([]);
  const [cashTransactions, setCashTransactions] = useState<CashTransaction[]>([]);
  const [funds, setFunds] = useState<PettyCashFund[]>([]);
  const [vouchers, setVouchers] = useState<PettyCashVoucher[]>([]);

  // Modals & Panels State
  const [isAddRegisterOpen, setIsAddRegisterOpen] = useState(false);
  const [isCashTxOpen, setIsCashTxOpen] = useState(false);
  const [isBankTransferOpen, setIsBankTransferOpen] = useState(false);
  const [isReplenishOpen, setIsReplenishOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Form States
  const [newRegister, setNewRegister] = useState({
    name: "",
    responsibleId: "EMP-002", // default female cashier
    initialBalance: ""
  });

  const [cashTxForm, setCashTxForm] = useState({
    registerId: "",
    type: "RECEIPT" as "RECEIPT" | "PAYMENT",
    amount: "",
    payerPayee: "",
    description: "",
    docNumber: ""
  });

  const [bankTransferForm, setBankTransferForm] = useState({
    registerId: "",
    direction: "TO_BANK" as "TO_BANK" | "FROM_BANK",
    amount: "",
    docNumber: "",
    bankAccount: "Bank_Melli"
  });

  const [replenishSourceType, setReplenishSourceType] = useState<"bank" | "register">("bank");
  const [selectedFundId, setSelectedFundId] = useState("");
  const [selectedRegisterId, setSelectedRegisterId] = useState("");
  const [replenishAmount, setReplenishAmount] = useState("");

  // Voucher details & active view
  const [activeVoucherId, setActiveVoucherId] = useState("");
  const [isVoucherOpen, setIsVoucherOpen] = useState(false);
  const [newVoucher, setNewVoucher] = useState({ description: "", fundId: "" });
  const [newExpense, setNewExpense] = useState({ amount: "", taxAmount: "0", expenseCode: "5102", invoiceNum: "", description: "" });
  const [lines, setLines] = useState<PettyCashLine[]>([]);
  const [printVoucher, setPrintVoucher] = useState<PettyCashVoucher | null>(null);

  // Search/Filter state
  const [txSearchQuery, setTxSearchQuery] = useState("");

  const loadData = () => {
    setRegisters([...engine.getRegisters()]);
    setCashTransactions([...engine.getCashTransactions()]);
    setFunds([...engine.getFunds()]);
    setVouchers([...engine.getVouchers()]);
    if (activeVoucherId) {
      setLines([...engine.getLines(activeVoucherId)]);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeVoucherId]);

  // --- HANDLERS ---

  const handleCreateRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRegister.name) {
      showNotification("لطفاً نام صندوق را وارد کنید.", "error");
      return;
    }
    const result = engine.createRegister(
      newRegister.name,
      newRegister.responsibleId,
      Number(newRegister.initialBalance) || 0
    );
    if (result.success) {
      showNotification(`صندوق جدید با موفقیت ایجاد و فعال شد.`, "success");
      setIsAddRegisterOpen(false);
      setNewRegister({ name: "", responsibleId: "EMP-002", initialBalance: "" });
      loadData();
    } else {
      showNotification(result.error || "خطا در ایجاد صندوق", "error");
    }
  };

  const handleRecordCashTx = (e: React.FormEvent) => {
    e.preventDefault();
    const { registerId, type, amount, payerPayee, description, docNumber } = cashTxForm;
    if (!registerId || !amount || !payerPayee || !description) {
      showNotification("لطفاً تمامی فیلدهای اجباری ستاره‌دار را تکمیل کنید.", "error");
      return;
    }
    const result = engine.recordCashTransaction(
      registerId,
      type,
      Number(amount),
      payerPayee,
      description,
      docNumber
    );
    if (result.success) {
      showNotification(
        type === "RECEIPT" 
          ? "دریافت نقدی با موفقیت ثبت و به حساب صندوق و بستانکاری طرف حساب منظور شد." 
          : "پرداخت نقدی با موفقیت ثبت و از صندوق کسر شد.", 
        "success"
      );
      setIsCashTxOpen(false);
      setCashTxForm({ registerId: "", type: "RECEIPT", amount: "", payerPayee: "", description: "", docNumber: "" });
      loadData();
    } else {
      showNotification(result.error || "خطا در ثبت رویداد نقدی", "error");
    }
  };

  const handleBankTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const { registerId, direction, amount, docNumber, bankAccount } = bankTransferForm;
    if (!registerId || !amount) {
      showNotification("صندوق و مبلغ الزامی هستند.", "error");
      return;
    }

    let result;
    if (direction === "TO_BANK") {
      result = engine.transferCashToBank(registerId, bankAccount, Number(amount), docNumber);
    } else {
      result = engine.replenishRegisterFromBank(registerId, bankAccount, Number(amount), docNumber);
    }

    if (result.success) {
      showNotification(
        direction === "TO_BANK"
          ? "واریز وجه نقد صندوق به بانک مرکزی با موفقیت ثبت شد."
          : "برداشت نقد از بانک و شارژ صندوق با موفقیت انجام شد.",
        "success"
      );
      setIsBankTransferOpen(false);
      setBankTransferForm({ registerId: "", direction: "TO_BANK", amount: "", docNumber: "", bankAccount: "Bank_Melli" });
      loadData();
    } else {
      showNotification(result.error || "خطا در تراکنش بین بانکی", "error");
    }
  };

  const handleReplenish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFundId || !replenishAmount) {
       showNotification("لطفاً تنخواه و مبلغ شارژ را مشخص کنید.", "error");
       return;
    }

    let result;
    if (replenishSourceType === "bank") {
      result = engine.replenishFund(selectedFundId, "Bank_Melli", Number(replenishAmount));
    } else {
      if (!selectedRegisterId) {
        showNotification("لطفاً صندوق مبدأ را انتخاب کنید.", "error");
        return;
      }
      result = engine.replenishFundFromCashRegister(selectedFundId, selectedRegisterId, Number(replenishAmount));
    }

    if (result.success) {
      showNotification(`تنخواه شارژ شد و سند اتوماتیک (${result.voucherId}) صادر گردید.`, "success");
      setIsReplenishOpen(false);
      setReplenishAmount("");
      setSelectedRegisterId("");
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
       if (result.voucher) {
         setActiveVoucherId(result.voucher.id);
       }
       loadData();
    }
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.amount || !newExpense.invoiceNum) {
      showNotification("مبلغ فاکتور و شماره فاکتور الزامی هستند.", "error");
      return;
    }
    const result = engine.addExpenseLine(
      activeVoucherId, 
      newExpense.expenseCode, 
      Number(newExpense.amount), 
      Number(newExpense.taxAmount), 
      newExpense.description, 
      newExpense.invoiceNum
    );
    if (result.success) {
       showNotification("فاکتور به صورت تنخواه اضافه شد.", "success");
       setNewExpense({ amount: "", taxAmount: "0", expenseCode: "5102", invoiceNum: "", description: "" });
       setLines([...engine.getLines(activeVoucherId)]);
       loadData();
    } else {
       showNotification(result.error || "خطا در ثبت فاکتور", "error");
    }
  };

  const handleDeleteExpenseLine = (lineId: string) => {
    const result = engine.deleteExpenseLine(lineId, activeVoucherId);
    if (result.success) {
      showNotification("آیتم فاکتور با موفقیت حذف شد.", "success");
      setLines([...engine.getLines(activeVoucherId)]);
      loadData();
    } else {
      showNotification(result.error || "خطا در حذف آیتم", "error");
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
       loadData();
    } else showNotification(res.error || "", "error");
  };

  const handleRejectVoucher = (vId: string) => {
    const res = engine.rejectVoucher(vId);
    if (res.success) {
      showNotification("صورت هزینه رد شد و جهت اصلاح به تنخواه‌دار عودت گردید.", "info");
      loadData();
    } else {
      showNotification(res.error || "خطا در رد صورت هزینه", "error");
    }
  };

  const openPrintModal = (voucher: PettyCashVoucher) => {
    setPrintVoucher(voucher);
    setIsPrintModalOpen(true);
  };

  const getStatusBadge = (status: VoucherStatus) => {
      switch(status) {
         case VoucherStatus.DRAFT: 
           return <span className="bg-slate-500/10 text-slate-500 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-slate-500/20">پیش‌نویس</span>;
         case VoucherStatus.SUBMITTED: 
           return <span className="bg-amber-500/10 text-amber-500 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-amber-500/20">در انتظار تایید مدیریت</span>;
         case VoucherStatus.REJECTED: 
           return <span className="bg-rose-500/10 text-rose-500 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-rose-500/20">عودت شده / نیاز به اصلاح</span>;
         case VoucherStatus.POSTED: 
           return <span className="bg-emerald-500/10 text-emerald-500 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-emerald-500/20">تسویه شده / سند ثبت شده</span>;
         default: 
           return null;
      }
  };

  // Helper translations for Floating IDs
  const getCustodianName = (id: string) => {
    if (id === "EMP-001") return "آقای علیرضا احمدی (امور اداری)";
    if (id === "EMP-002") return "خانم سارا محمدی (کاشیر ارشد)";
    if (id === "EMP-003") return "آقای بهزاد تهرانی (دبیرخانه)";
    return id;
  };

  const getExpenseName = (code: string) => {
    if (code === "5102") return "ملزومات مصرفی و اداری";
    if (code === "5103") return "ایاب و ذهاب و پیک";
    if (code === "5104") return "تعمیرات جزئی ساختمان";
    return `کد معین ${code}`;
  };

  const filteredCashTx = cashTransactions
    .filter(tx => {
      if (!txSearchQuery) return true;
      const term = txSearchQuery.toLowerCase();
      const reg = registers.find(r => r.id === tx.register_id);
      return (
        tx.payer_payee.toLowerCase().includes(term) ||
        tx.description.toLowerCase().includes(term) ||
        tx.document_number.toLowerCase().includes(term) ||
        (reg && reg.register_name.toLowerCase().includes(term))
      );
    })
    .reverse(); // Latest first

  return (
    <div id="petty_cash_root" className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col max-w-7xl mx-auto w-full animate-fade-in" dir="rtl">
      
      {/* Header */}
      <div id="pc_header" className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 id="pc_title" className={`text-2xl font-black tracking-tight ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>
              مدیریت صندوق و تنخواه‌گردان (خزانه‌داری)
            </h2>
            <button
              id="pc_guide_toggle"
              onClick={() => setShowFriendlyGuide(!showFriendlyGuide)}
              className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 flex items-center gap-1 hover:bg-indigo-500/20 transition-all"
            >
              <Info className="w-3.5 h-3.5" />
              {showFriendlyGuide ? "پنهان‌سازی راهنما" : "راهنمای حسابداری نقدی"}
            </button>
          </div>
          <p id="pc_subtitle" className={`text-xs mt-1.5 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
            صدور خودکار اسناد حسابداری نقدی، کنترل موجودی خزانه‌داری، تفصیلی‌های شناور و فرآیند تسویه تنخواه.
          </p>
        </div>
        <button id="pc_back_btn" onClick={onBack} className={`px-4 py-2.5 text-xs font-bold rounded-xl flex items-center gap-2 transition-all ${isDarkMode ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
          <ChevronLeft className="w-4 h-4" /> بازگشت به داشبورد خزانه‌داری
        </button>
      </div>

      {/* Guide Panel */}
      {showFriendlyGuide && (
        <div id="pc_guide_panel" className={`p-5 rounded-2xl border mb-6 transition-all ${isDarkMode ? "bg-indigo-950/15 border-indigo-900/40 text-slate-200" : "bg-indigo-50/40 border-indigo-100 text-slate-800"}`}>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 shrink-0 mt-0.5"><BookOpen className="w-5 h-5" /></div>
            <div className="flex-1">
              <h3 className="font-bold text-sm text-indigo-600 dark:text-indigo-400 mb-2">💡 چرخه عملیاتی صندوق و تنخواه‌گردان</h3>
              <p className="text-xs leading-relaxed opacity-95 mb-4">
                این سیستم برای تضمین صحت مالی، تفکیک وظایف و ثبت دوطرفه (Double-entry) تراکنش‌های نقدی توسعه داده شده است:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-2">
                <div className={`p-4 rounded-xl border ${isDarkMode ? "bg-slate-950/40 border-slate-850" : "bg-white border-slate-100"}`}>
                  <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-sky-500/10 text-sky-500 mb-2">۱. صندوق نقدی (Cash Registers)</span>
                  <p className="text-[11px] leading-relaxed opacity-85">ثبت آنی فیش‌های دریافت/پرداخت روزانه. وجوه در این بخش به عنوان دارایی نقد صندوق ثبت می‌شوند و قابلیت واریز به بانک را دارند.</p>
                </div>
                <div className={`p-4 rounded-xl border ${isDarkMode ? "bg-slate-950/40 border-slate-850" : "bg-white border-slate-100"}`}>
                  <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-500 mb-2">۲. شارژ چندمنبعی تنخواه</span>
                  <p className="text-[11px] leading-relaxed opacity-85">تنخواه‌دار کارپرداز را می‌توان هم به طور مستقیم از <strong>حساب بانکی</strong> و هم از <strong>صندوق نقدی</strong> شارژ نمود (با اعمال کنترل سقف مجاز).</p>
                </div>
                <div className={`p-4 rounded-xl border ${isDarkMode ? "bg-slate-950/40 border-slate-850" : "bg-white border-slate-100"}`}>
                  <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 mb-2">۳. هزینه‌های موقت کارپرداز</span>
                  <p className="text-[11px] leading-relaxed opacity-85">فاکتورهای ریز هزینه‌ها به صورت پیش‌نویس توسط تنخواه‌دار ثبت شده و تا زمان ارسال و تایید نهایی، بر ترازنامه شرکت بی‌تاثیرند.</p>
                </div>
                <div className={`p-4 rounded-xl border ${isDarkMode ? "bg-slate-950/40 border-slate-850" : "bg-white border-slate-100"}`}>
                  <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 mb-2">۴. تایید و صدور سند اتوماتیک</span>
                  <p className="text-[11px] leading-relaxed opacity-85">پس از تایید صورت توسط مدیر مالی، فاکتورها تجمیع شده و سند تجمیعی هزینه‌ها صادر و حساب کارپرداز بستانکار می‌شود.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div id="pc_tabs" className="flex border-b border-slate-200 dark:border-slate-800 mb-6 overflow-x-auto">
        <button 
          id="tab_registers"
          onClick={() => setActiveTab("registers")} 
          className={`px-6 py-3.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === "registers" ? "border-indigo-500 text-indigo-500" : "border-transparent text-slate-500 hover:text-slate-400"}`}
        >
          <Coins className="w-4 h-4" /> صندوق‌های نقدی شعبه
        </button>
        <button 
          id="tab_funds"
          onClick={() => setActiveTab("funds")} 
          className={`px-6 py-3.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === "funds" ? "border-indigo-500 text-indigo-500" : "border-transparent text-slate-500 hover:text-slate-400"}`}
        >
          <Wallet className="w-4 h-4" /> موجودی تنخواه‌گردان‌ها
        </button>
        <button 
          id="tab_vouchers"
          onClick={() => setActiveTab("vouchers")} 
          className={`px-6 py-3.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === "vouchers" ? "border-indigo-500 text-indigo-500" : "border-transparent text-slate-500 hover:text-slate-400"}`}
        >
          <FileCheck2 className="w-4 h-4" /> صورت‌های هزینه کارپردازان
        </button>
      </div>

      {/* --- TAB 1: CASH REGISTERS --- */}
      {activeTab === "registers" && (
        <div id="panel_registers" className="flex flex-col gap-6">
          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="font-bold text-sm text-slate-500 flex items-center gap-1.5">
              <Coins className="w-4.5 h-4.5 text-indigo-500" />
              مدیریت نقدینگی و عملیات گاوصندوق نقدی
            </h3>
            <div className="flex flex-wrap gap-2">
              <button 
                id="btn_open_add_register"
                onClick={() => setIsAddRegisterOpen(true)} 
                className={`px-3 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${isDarkMode ? "bg-slate-850 hover:bg-slate-800 text-indigo-400 border border-indigo-500/20" : "bg-indigo-50 hover:bg-indigo-100 text-indigo-600"}`}
              >
                <Plus className="w-4 h-4" /> صندوق جدید
              </button>
              <button 
                id="btn_open_bank_transfer"
                onClick={() => setIsBankTransferOpen(true)} 
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <Landmark className="w-4 h-4" /> انتقال بین بانک و صندوق
              </button>
              <button 
                id="btn_open_cash_tx"
                onClick={() => setIsCashTxOpen(true)} 
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <Receipt className="w-4 h-4" /> ثبت دریافت / پرداخت نقدی
              </button>
            </div>
          </div>

          {/* Form Overlay: Add Register */}
          {isAddRegisterOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <form onSubmit={handleCreateRegister} className={`w-full max-w-md p-6 rounded-2xl shadow-xl flex flex-col gap-4 border ${isDarkMode ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"}`}>
                <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800">
                  <h4 className="font-black text-sm">تعریف صندوق نقدی جدید</h4>
                  <button type="button" onClick={() => setIsAddRegisterOpen(false)} className="opacity-60 hover:opacity-100"><XCircle className="w-5 h-5"/></button>
                </div>
                <div className="flex flex-col gap-3.5">
                  <div>
                    <label className="block text-xs font-bold mb-1.5">نام صندوق / باجه *</label>
                    <input 
                      type="text" 
                      placeholder="مثلا صندوق ارزی شعبه مرکز، باجه فروش ۲" 
                      value={newRegister.name} 
                      onChange={e => setNewRegister({...newRegister, name: e.target.value})} 
                      className={`w-full p-2.5 rounded-xl text-xs font-bold border ${isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"}`} 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1.5">سرپرست و مسئول صندوق *</label>
                    <select 
                      value={newRegister.responsibleId} 
                      onChange={e => setNewRegister({...newRegister, responsibleId: e.target.value})} 
                      className={`w-full p-2.5 rounded-xl text-xs font-bold border ${isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"}`}
                    >
                      <option value="EMP-002">خانم سارا محمدی (کاشیر ارشد)</option>
                      <option value="EMP-003">آقای بهزاد تهرانی (دبیرخانه)</option>
                      <option value="EMP-001">آقای علیرضا احمدی (امور اداری)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1.5">موجودی نقدی اولیه (ریال)</label>
                    <input 
                      type="number" 
                      placeholder="موجودی نقد فیزیکی موجود در صندوق" 
                      value={newRegister.initialBalance} 
                      onChange={e => setNewRegister({...newRegister, initialBalance: e.target.value})} 
                      className={`w-full p-2.5 rounded-xl text-xs font-mono border ${isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"}`} 
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-2">
                  <button type="button" onClick={() => setIsAddRegisterOpen(false)} className={`px-4 py-2 rounded-xl text-xs font-bold ${isDarkMode ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"}`}>انصراف</button>
                  <button type="submit" className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-xs font-bold">ایجاد صندوق</button>
                </div>
              </form>
            </div>
          )}

          {/* Form Overlay: Cash Transaction */}
          {isCashTxOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <form onSubmit={handleRecordCashTx} className={`w-full max-w-lg p-6 rounded-2xl shadow-xl flex flex-col gap-4 border ${isDarkMode ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"}`}>
                <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800">
                  <h4 className="font-black text-sm">ثبت فیش دریافت / پرداخت وجه نقد صندوق</h4>
                  <button type="button" onClick={() => setIsCashTxOpen(false)} className="opacity-60 hover:opacity-100"><XCircle className="w-5 h-5"/></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold mb-1.5">انتخاب صندوق هدف *</label>
                    <select 
                      value={cashTxForm.registerId} 
                      onChange={e => setCashTxForm({...cashTxForm, registerId: e.target.value})} 
                      className={`w-full p-2.5 rounded-xl text-xs font-bold border ${isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"}`}
                    >
                      <option value="">انتخاب صندوق...</option>
                      {registers.map(r => <option key={r.id} value={r.id}>{r.register_name} (موجودی: {r.current_balance.toLocaleString()} ریال)</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1.5">نوع عملیات *</label>
                    <div className="flex gap-2">
                      <button 
                        type="button" 
                        onClick={() => setCashTxForm({...cashTxForm, type: "RECEIPT"})} 
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${cashTxForm.type === "RECEIPT" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500" : "border-slate-200 dark:border-slate-800 opacity-60"}`}
                      >
                        دریافت نقدی (ورود به صندوق)
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setCashTxForm({...cashTxForm, type: "PAYMENT"})} 
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${cashTxForm.type === "PAYMENT" ? "bg-rose-500/10 text-rose-500 border-rose-500" : "border-slate-200 dark:border-slate-800 opacity-60"}`}
                      >
                        پرداخت نقدی (خروج از صندوق)
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1.5">مبلغ تراکنش (ریال) *</label>
                    <input 
                      type="number" 
                      placeholder="مبلغ وجه نقد" 
                      value={cashTxForm.amount} 
                      onChange={e => setCashTxForm({...cashTxForm, amount: e.target.value})} 
                      className={`w-full p-2.5 rounded-xl text-xs font-mono border ${isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"}`} 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1.5">طرف حساب (پرداخت‌کننده / دریافت‌کننده) *</label>
                    <input 
                      type="text" 
                      placeholder="نام شخص حقیقی یا حقوقی" 
                      value={cashTxForm.payerPayee} 
                      onChange={e => setCashTxForm({...cashTxForm, payerPayee: e.target.value})} 
                      className={`w-full p-2.5 rounded-xl text-xs font-bold border ${isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"}`} 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1.5">شماره سند فیزیکی / فیش بانکی</label>
                    <input 
                      type="text" 
                      placeholder="مثلا فیش ۱۲۰۸۹" 
                      value={cashTxForm.docNumber} 
                      onChange={e => setCashTxForm({...cashTxForm, docNumber: e.target.value})} 
                      className={`w-full p-2.5 rounded-xl text-xs font-mono border ${isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"}`} 
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold mb-1.5">شرح رویداد مالی (شرح آرتیکل) *</label>
                    <input 
                      type="text" 
                      placeholder="مثلا بابت خرید لوازم بهداشتی، تسویه موقت فاکتور مشتری" 
                      value={cashTxForm.description} 
                      onChange={e => setCashTxForm({...cashTxForm, description: e.target.value})} 
                      className={`w-full p-2.5 rounded-xl text-xs font-bold border ${isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"}`} 
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-2">
                  <button type="button" onClick={() => setIsCashTxOpen(false)} className={`px-4 py-2 rounded-xl text-xs font-bold ${isDarkMode ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"}`}>انصراف</button>
                  <button type="submit" className="bg-emerald-600 text-white px-5 py-2 rounded-xl text-xs font-bold">ثبت نهایی فیش</button>
                </div>
              </form>
            </div>
          )}

          {/* Form Overlay: Bank <-> Cash Register Transfer */}
          {isBankTransferOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <form onSubmit={handleBankTransfer} className={`w-full max-w-md p-6 rounded-2xl shadow-xl flex flex-col gap-4 border ${isDarkMode ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"}`}>
                <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800">
                  <h4 className="font-black text-sm">انتقال وجه نقد بین بانک و صندوق</h4>
                  <button type="button" onClick={() => setIsBankTransferOpen(false)} className="opacity-60 hover:opacity-100"><XCircle className="w-5 h-5"/></button>
                </div>
                <div className="flex flex-col gap-3.5">
                  <div>
                    <label className="block text-xs font-bold mb-1.5">مسیر جابجایی وجه *</label>
                    <div className="flex gap-2">
                      <button 
                        type="button" 
                        onClick={() => setBankTransferForm({...bankTransferForm, direction: "TO_BANK"})} 
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${bankTransferForm.direction === "TO_BANK" ? "bg-indigo-500/10 text-indigo-500 border-indigo-500" : "border-slate-200 dark:border-slate-800 opacity-60"}`}
                      >
                        واریز به بانک (از صندوق)
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setBankTransferForm({...bankTransferForm, direction: "FROM_BANK"})} 
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${bankTransferForm.direction === "FROM_BANK" ? "bg-indigo-500/10 text-indigo-500 border-indigo-500" : "border-slate-200 dark:border-slate-800 opacity-60"}`}
                      >
                        برداشت از بانک (به صندوق)
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1.5">صندوق هدف *</label>
                    <select 
                      value={bankTransferForm.registerId} 
                      onChange={e => setBankTransferForm({...bankTransferForm, registerId: e.target.value})} 
                      className={`w-full p-2.5 rounded-xl text-xs font-bold border ${isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"}`}
                    >
                      <option value="">انتخاب صندوق...</option>
                      {registers.map(r => <option key={r.id} value={r.id}>{r.register_name} (موجودی: {r.current_balance.toLocaleString()} ریال)</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1.5">مبلغ جابجایی (ریال) *</label>
                    <input 
                      type="number" 
                      placeholder="مبلغ وجه نقدی" 
                      value={bankTransferForm.amount} 
                      onChange={e => setBankTransferForm({...bankTransferForm, amount: e.target.value})} 
                      className={`w-full p-2.5 rounded-xl text-xs font-mono border ${isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"}`} 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1.5">شماره ارجاع / فیش بانکی</label>
                    <input 
                      type="text" 
                      placeholder="کد رهگیری تراکنش" 
                      value={bankTransferForm.docNumber} 
                      onChange={e => setBankTransferForm({...bankTransferForm, docNumber: e.target.value})} 
                      className={`w-full p-2.5 rounded-xl text-xs font-mono border ${isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"}`} 
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-2">
                  <button type="button" onClick={() => setIsBankTransferOpen(false)} className={`px-4 py-2 rounded-xl text-xs font-bold ${isDarkMode ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"}`}>انصراف</button>
                  <button type="submit" className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-xs font-bold">ثبت انتقال</button>
                </div>
              </form>
            </div>
          )}

          {/* Registers List Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {registers.map(r => (
              <div key={r.id} className={`p-5 rounded-2xl border flex flex-col gap-4 relative overflow-hidden ${isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-500"><Coins className="w-5 h-5"/></div>
                    <div>
                      <h4 className="font-black text-sm">{r.register_name}</h4>
                      <p className="text-[10px] opacity-60 font-mono mt-0.5">شناسه: {r.id}</p>
                    </div>
                  </div>
                  <span className="bg-emerald-500/10 text-emerald-500 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-emerald-500/20 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> فعال
                  </span>
                </div>
                
                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/40">
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="opacity-70">مسئول صندوق:</span>
                    <span className="font-bold opacity-90">{getCustodianName(r.responsible_user_id)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="opacity-70">کد حساب معین:</span>
                    <span className="font-mono bg-slate-100 dark:bg-slate-850 px-1.5 py-0.5 rounded text-[10px]">{r.associated_account_id}</span>
                  </div>
                  <div className="flex justify-between items-end mt-4 pt-2 border-t border-dashed border-slate-100 dark:border-slate-800/60">
                    <span className="text-xs opacity-70">نقد فیزیکی موجود:</span>
                    <span className="font-black text-base text-indigo-500">{r.current_balance.toLocaleString()} <span className="text-[10px] font-medium opacity-80">ریال</span></span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Register Log Book / Transactions Table */}
          <div className={`p-5 rounded-2xl border ${isDarkMode ? "bg-slate-900/20 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div>
                <h4 className="font-black text-sm flex items-center gap-2"><History className="w-4.5 h-4.5 text-indigo-500"/> دفتر معین صندوق (تراکنش‌های نقدی اخیر)</h4>
                <p className="text-[11px] opacity-60 mt-1">فهرست ریز دریافتی‌ها و پرداختی‌های فیزیکی گاوصندوق شعبه</p>
              </div>
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 absolute right-3 top-3 opacity-40" />
                <input 
                  type="text" 
                  placeholder="جستجو در شرح، طرف حساب، سند..." 
                  value={txSearchQuery}
                  onChange={e => setTxSearchQuery(e.target.value)}
                  className={`w-full pl-3 pr-9 py-2 rounded-xl text-xs border ${isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"}`} 
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right border-collapse">
                <thead>
                  <tr className={`border-b ${isDarkMode ? "border-slate-850" : "border-slate-100"} opacity-70`}>
                    <th className="py-3 px-3 font-bold">تاریخ</th>
                    <th className="py-3 px-3 font-bold">صندوق هدف</th>
                    <th className="py-3 px-3 font-bold">نوع</th>
                    <th className="py-3 px-3 font-bold">طرف حساب</th>
                    <th className="py-3 px-3 font-bold">شرح تراکنش</th>
                    <th className="py-3 px-3 font-mono">شماره سند</th>
                    <th className="py-3 px-3 font-bold text-left">مبلغ (ریال)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCashTx.map(tx => {
                    const reg = registers.find(r => r.id === tx.register_id);
                    return (
                      <tr key={tx.id} className={`border-b border-slate-100 dark:border-slate-850/40 hover:bg-slate-50 dark:hover:bg-slate-850/20 transition-all`}>
                        <td className="py-3.5 px-3 font-mono opacity-80">{tx.date}</td>
                        <td className="py-3.5 px-3 font-bold">{reg ? reg.register_name : "نامشخص"}</td>
                        <td className="py-3.5 px-3">
                          {tx.transaction_type === "RECEIPT" ? (
                            <span className="bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-500/20">دریافت (+)</span>
                          ) : (
                            <span className="bg-rose-500/10 text-rose-500 px-2 py-0.5 rounded text-[10px] font-bold border border-rose-500/20">پرداخت (-)</span>
                          )}
                        </td>
                        <td className="py-3.5 px-3 font-bold opacity-85">{tx.payer_payee}</td>
                        <td className="py-3.5 px-3 opacity-90">{tx.description}</td>
                        <td className="py-3.5 px-3 font-mono opacity-60">#{tx.document_number}</td>
                        <td className={`py-3.5 px-3 font-mono font-black text-left text-sm ${tx.transaction_type === "RECEIPT" ? "text-emerald-500" : "text-rose-500"}`}>
                          {tx.transaction_type === "RECEIPT" ? "+" : "-"}{tx.amount.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredCashTx.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center opacity-40">تراکنشی متناسب با جستجوی شما یافت نشد.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: PETTY CASH FUNDS --- */}
      {activeTab === "funds" && (
         <div id="panel_funds" className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h3 className="font-bold text-sm text-slate-500 flex items-center gap-1.5">
                <Wallet className="w-4.5 h-4.5 text-indigo-500" />
                کنترل تنخواه کارپردازان و کارمندان امور تدارکات
              </h3>
              <div className="flex justify-end">
                 <button 
                   id="btn_open_replenish"
                   onClick={() => setIsReplenishOpen(!isReplenishOpen)} 
                   className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2"
                 >
                   <HandCoins className="w-4 h-4" /> شارژ تنخواه‌گردان (Replenish)
                 </button>
              </div>
            </div>

            {isReplenishOpen && (
               <form onSubmit={handleReplenish} className={`p-5 rounded-2xl border flex flex-col md:flex-row items-end gap-4 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
                 <div className="flex-1 w-full">
                   <label className="block text-xs font-bold mb-1.5 opacity-80">انتخاب تنخواه هدف</label>
                   <select value={selectedFundId} onChange={e=>setSelectedFundId(e.target.value)} className={`w-full p-2.5 rounded-lg text-xs font-bold border ${isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                     <option value="">انتخاب...</option>
                     {funds.map(f => <option key={f.id} value={f.id}>{f.fund_name} (کارپرداز: {getCustodianName(f.custodian_id)})</option>)}
                   </select>
                 </div>
                 
                 <div className="flex-1 w-full">
                   <label className="block text-xs font-bold mb-1.5 opacity-80">منبع تامین مالی</label>
                   <div className="flex gap-2">
                     <button 
                       type="button" 
                       onClick={() => setReplenishSourceType("bank")} 
                       className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${replenishSourceType === "bank" ? "bg-indigo-500/10 text-indigo-500 border-indigo-500" : "border-slate-200 dark:border-slate-800"}`}
                     >
                       حساب بانکی (ملت/ملی)
                     </button>
                     <button 
                       type="button" 
                       onClick={() => setReplenishSourceType("register")} 
                       className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${replenishSourceType === "register" ? "bg-indigo-500/10 text-indigo-500 border-indigo-500" : "border-slate-200 dark:border-slate-800"}`}
                     >
                       از صندوق نقدی
                     </button>
                   </div>
                 </div>

                 {replenishSourceType === "register" && (
                   <div className="flex-1 w-full">
                     <label className="block text-xs font-bold mb-1.5 opacity-80">انتخاب صندوق مبدأ</label>
                     <select value={selectedRegisterId} onChange={e=>setSelectedRegisterId(e.target.value)} className={`w-full p-2.5 rounded-lg text-xs font-bold border ${isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                       <option value="">انتخاب...</option>
                       {registers.map(r => <option key={r.id} value={r.id}>{r.register_name} (موجودی: {r.current_balance.toLocaleString()} ریال)</option>)}
                     </select>
                   </div>
                 )}

                 <div className="flex-1 w-full">
                   <label className="block text-xs font-bold mb-1.5 opacity-80">مبلغ شارژ (ریال) *</label>
                   <input type="number" value={replenishAmount} onChange={e=>setReplenishAmount(e.target.value)} className={`w-full p-2.5 rounded-lg text-xs font-mono border ${isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"}`} placeholder="مثلا 10000000" />
                 </div>

                 <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl text-xs font-bold h-[42px] w-full md:w-auto shrink-0">
                   تایید و شارژ تنخواه
                 </button>
               </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {funds.map(f => (
                  <div key={f.id} className={`p-5 rounded-2xl border flex flex-col gap-4 ${isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
                     <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                           <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-500"><Wallet className="w-5 h-5"/></div>
                           <div>
                              <h3 className="font-black text-sm">{f.fund_name}</h3>
                              <p className="text-[10px] opacity-60 font-mono mt-0.5">تفصیلی: {f.custodian_id}</p>
                           </div>
                        </div>
                        <span className="bg-emerald-500/10 text-emerald-500 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-emerald-500/20">فعال</span>
                     </div>
                     <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/40">
                        <div className="flex justify-between items-center text-xs mb-1.5">
                           <span className="opacity-70">تنخواه‌دار:</span>
                           <span className="font-bold opacity-90">{getCustodianName(f.custodian_id)}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs mb-1.5">
                           <span className="opacity-70">موجودی فعلی نزد کارپرداز:</span>
                           <span className="font-bold text-indigo-500 text-sm">{f.current_balance.toLocaleString()} ریال</span>
                        </div>
                        <div className="flex justify-between items-center text-xs mb-1.5">
                           <span className="opacity-70">سقف مجاز تنخواه:</span>
                           <span className="font-bold">{f.max_ceiling_amount.toLocaleString()} ریال</span>
                        </div>
                        
                        {/* Progress bar to show ceiling utilization */}
                        <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 mt-4">
                           <div className="bg-indigo-500 h-1.5 rounded-full transition-all" style={{ width: `${Math.min((f.current_balance/f.max_ceiling_amount)*100, 100)}%` }}></div>
                        </div>
                        <p className="text-[10px] text-left opacity-50 mt-1">میزان شارژ: {((f.current_balance/f.max_ceiling_amount)*100).toFixed(0)}%</p>
                     </div>
                  </div>
               ))}
            </div>
         </div>
      )}

      {/* --- TAB 3: PETTY CASH VOUCHERS --- */}
      {activeTab === "vouchers" && (
         <div id="panel_vouchers" className="flex flex-col lg:flex-row gap-6 items-start">
            
            {/* Vouchers Sidebar List */}
            <div className={`w-full lg:w-1/3 flex flex-col gap-4`}>
               <div className="flex justify-between items-center mb-1">
                  <h3 className="font-black text-sm flex items-center gap-2"><FileText className="w-4.5 h-4.5 text-indigo-500"/> صورت‌های هزینه تنخواه</h3>
                  <button 
                    id="btn_open_new_voucher_form"
                    onClick={()=>setIsVoucherOpen(!isVoucherOpen)} 
                    className="text-[10px] font-bold bg-indigo-500/10 text-indigo-500 px-2.5 py-1.5 rounded-xl hover:bg-indigo-500/20 border border-indigo-500/10"
                  >
                    + صورت حساب جدید
                  </button>
               </div>
               
               {isVoucherOpen && (
                  <form onSubmit={handleCreateVoucher} className={`p-4 rounded-xl border flex flex-col gap-3.5 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
                     <div>
                       <label className="block text-[11px] font-bold opacity-75 mb-1">تنخواه‌گردان مرتبط</label>
                       <select value={newVoucher.fundId} onChange={e=>setNewVoucher({...newVoucher, fundId: e.target.value})} className={`w-full p-2 rounded-lg text-xs font-bold border ${isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                         <option value="">انتخاب...</option>
                         {funds.map(f => <option key={f.id} value={f.id}>{f.fund_name} ({getCustodianName(f.custodian_id)})</option>)}
                       </select>
                     </div>
                     <div>
                       <label className="block text-[11px] font-bold opacity-75 mb-1">شرح کلی صورت هزینه</label>
                       <input type="text" placeholder="مثلا خرید خرد ملزومات باجه ۲ خردادماه" value={newVoucher.description} onChange={e=>setNewVoucher({...newVoucher, description: e.target.value})} className={`w-full p-2 rounded-lg text-xs border ${isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"}`} />
                     </div>
                     <button type="submit" className="bg-indigo-600 text-white py-2 rounded-lg text-xs font-bold">ایجاد صورت هزینه موقت</button>
                  </form>
               )}

               <div className="flex flex-col gap-3">
                  {vouchers.map(v => (
                     <div 
                       key={v.id} 
                       onClick={()=>handleOpenVoucherDetails(v.id)} 
                       className={`p-4 rounded-xl border cursor-pointer transition-all ${activeVoucherId === v.id ? (isDarkMode ? "bg-indigo-900/15 border-indigo-500" : "bg-indigo-50 border-indigo-400 shadow-sm") : (isDarkMode ? "bg-slate-900/40 border-slate-800 hover:border-slate-700" : "bg-white border-slate-200 hover:border-slate-300 shadow-sm")}`}
                     >
                        <div className="flex justify-between items-start mb-2">
                           <span className="font-bold text-xs opacity-90">{v.description}</span>
                           {getStatusBadge(v.status)}
                        </div>
                        <div className="flex justify-between text-[10px] font-mono opacity-60">
                           <span>شماره فیش: #{v.voucher_number}</span>
                           <span>تاریخ: {v.submission_date}</span>
                        </div>
                        <div className="mt-3 pt-2 border-t border-dashed border-slate-100 dark:border-slate-800 text-xs font-bold flex justify-between">
                           <span className="opacity-70">مجموع هزینه‌ها:</span>
                           <span className="text-indigo-500 font-black">{v.total_expense_amount.toLocaleString()} ریال</span>
                        </div>
                     </div>
                  ))}
                  {vouchers.length === 0 && <div className="text-center opacity-50 text-xs py-10">هیچ صورتی هزینه ثبت نشده است.</div>}
               </div>
            </div>

            {/* Voucher Details & Invoice Lines */}
            <div className={`w-full lg:w-2/3 p-6 rounded-2xl border flex flex-col ${isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
               {!activeVoucherId ? (
                  <div className="flex-1 flex flex-col items-center justify-center opacity-40 py-24">
                     <FileCheck2 className="w-12 h-12 mb-3 text-indigo-500" />
                     <p className="text-sm font-bold">برای مشاهده جزئیات فاکتورها، ویرایش و تایید نهایی، یک صورت هزینه را از لیست انتخاب کنید.</p>
                  </div>
               ) : (
                  <>
                     {(() => {
                        const v = vouchers.find(x => x.id === activeVoucherId);
                        if (!v) return null;
                        const fund = funds.find(f => f.id === v.fund_id);
                        return (
                           <div className="flex flex-col h-full">
                              
                              {/* Voucher Detail Header */}
                              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-4 border-b border-slate-200 dark:border-slate-800 gap-4">
                                 <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h3 className="font-black text-base">{v.description}</h3>
                                      {getStatusBadge(v.status)}
                                    </div>
                                    <div className="flex gap-4 text-xs opacity-60 font-mono mt-1 flex-wrap">
                                       <span>شماره مدرک: #{v.voucher_number}</span>
                                       <span>تاریخ ثبت: {v.submission_date}</span>
                                       <span>تنخواه مبدأ: {fund?.fund_name}</span>
                                    </div>
                                 </div>
                                 <div className="flex flex-wrap gap-2">
                                    <button 
                                      onClick={() => openPrintModal(v)}
                                      className={`px-3 py-1.5 text-xs font-bold rounded-lg border flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-850 ${isDarkMode ? "border-slate-800 text-slate-300":"border-slate-200 text-slate-600"}`}
                                    >
                                      <Printer className="w-3.5 h-3.5"/> مشاهده فیش چاپی
                                    </button>

                                    {(v.status === VoucherStatus.DRAFT || v.status === VoucherStatus.REJECTED) && (
                                       <button onClick={()=>handleSubmitVoucher(v.id)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1">
                                         <Send className="w-3.5 h-3.5" /> ارسال جهت تایید مدیریت
                                       </button>
                                    )}

                                    {v.status === VoucherStatus.SUBMITTED && (
                                       <>
                                         <button onClick={()=>handleRejectVoucher(v.id)} className="bg-rose-600 hover:bg-rose-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1">
                                            <XCircle className="w-3.5 h-3.5"/> عودت و رد
                                         </button>
                                         <button onClick={()=>handleSettleVoucher(v.id)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1">
                                            <CheckCircle className="w-3.5 h-3.5"/> تایید و صدور سند تجمیعی
                                         </button>
                                       </>
                                    )}
                                 </div>
                              </div>

                              {/* Form to Add Expense line */}
                              {(v.status === VoucherStatus.DRAFT || v.status === VoucherStatus.REJECTED) && (
                                 <form onSubmit={handleAddExpense} className={`p-4 rounded-xl border mb-6 flex flex-col gap-3 ${isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                                    <div className="font-black text-xs text-indigo-500 flex items-center gap-1.5"><PlusCircle className="w-4 h-4"/> افزودن اقلام فاکتور خرید یا هزینه</div>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                      <div>
                                         <label className="block text-[10px] font-bold opacity-60 mb-1">سرفصل هزینه مالی *</label>
                                         <select value={newExpense.expenseCode} onChange={e=>setNewExpense({...newExpense, expenseCode: e.target.value})} className={`w-full p-2 text-xs border rounded-lg ${isDarkMode?"bg-slate-900 border-slate-700":"bg-white border-slate-300"}`}>
                                            <option value="5102">هزینه ملزومات و لوازم تحریر</option>
                                            <option value="5103">هزینه ایاب و ذهاب و سفر</option>
                                            <option value="5104">هزینه تعمیرات جزئی ساختمان</option>
                                         </select>
                                      </div>
                                      <div>
                                         <label className="block text-[10px] font-bold opacity-60 mb-1">شماره فاکتور / رسید *</label>
                                         <input type="text" placeholder="فاکتور ۱۰۰۲" value={newExpense.invoiceNum} onChange={e=>setNewExpense({...newExpense, invoiceNum: e.target.value})} className={`w-full p-2 text-xs font-mono border rounded-lg ${isDarkMode?"bg-slate-900 border-slate-700":"bg-white border-slate-300"}`} />
                                      </div>
                                      <div>
                                         <label className="block text-[10px] font-bold opacity-60 mb-1">مبلغ فاکتور (ریال) *</label>
                                         <input type="number" placeholder="مبلغ پایه هزینه" value={newExpense.amount} onChange={e=>setNewExpense({...newExpense, amount: e.target.value})} className={`w-full p-2 text-xs font-mono border rounded-lg ${isDarkMode?"bg-slate-900 border-slate-700":"bg-white border-slate-300"}`} />
                                      </div>
                                      <div>
                                         <label className="block text-[10px] font-bold opacity-60 mb-1">مالیات ارزش افزوده (ریال)</label>
                                         <div className="flex gap-2">
                                            <input type="number" placeholder="مالیات فاکتور" value={newExpense.taxAmount} onChange={e=>setNewExpense({...newExpense, taxAmount: e.target.value})} className={`w-full p-2 text-xs font-mono border rounded-lg ${isDarkMode?"bg-slate-900 border-slate-700":"bg-white border-slate-300"}`} />
                                            <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 rounded-lg font-black text-xs shrink-0">+</button>
                                         </div>
                                      </div>
                                    </div>
                                    <div>
                                       <label className="block text-[10px] font-bold opacity-60 mb-1">شرح دقیق اقلام فاکتور *</label>
                                       <input type="text" placeholder="مثلا خرید ۵ کارتن کاغذ A4 و خودکار برای دبیرخانه" value={newExpense.description} onChange={e=>setNewExpense({...newExpense, description: e.target.value})} className={`w-full p-2 text-xs border rounded-lg ${isDarkMode?"bg-slate-900 border-slate-700":"bg-white border-slate-300"}`} />
                                    </div>
                                 </form>
                              )}

                              {/* Expense Lines Table */}
                              <div className="flex-1 overflow-y-auto">
                                 <table className="w-full text-xs text-right border-collapse">
                                    <thead>
                                       <tr className={`border-b ${isDarkMode?"border-slate-800":"border-slate-200"} opacity-75`}>
                                          <th className="py-3 px-2 font-bold">سرپرست هزینه (کد معین)</th>
                                          <th className="py-3 px-2 font-bold">شماره فاکتور</th>
                                          <th className="py-3 px-2 font-bold">شرح هزینه</th>
                                          <th className="py-3 px-2 font-bold text-left">مالیات (ریال)</th>
                                          <th className="py-3 px-2 font-bold text-left">مبلغ (ریال)</th>
                                          {(v.status === VoucherStatus.DRAFT || v.status === VoucherStatus.REJECTED) && (
                                            <th className="py-3 px-2 text-center w-12 font-bold">حذف</th>
                                          )}
                                       </tr>
                                    </thead>
                                    <tbody>
                                       {lines.map(l => (
                                          <tr key={l.id} className={`border-b border-dashed ${isDarkMode?"border-slate-800/60":"border-slate-100 hover:bg-slate-50/50"} transition-all`}>
                                             <td className="py-3 px-2">
                                                <div className="font-bold opacity-90">{getExpenseName(l.expense_account_id)}</div>
                                                <span className="text-[10px] font-mono opacity-50">کد: {l.expense_account_id}</span>
                                             </td>
                                             <td className="py-3 px-2 font-mono opacity-80">#{l.invoice_number}</td>
                                             <td className="py-3 px-2 opacity-90 leading-relaxed">{l.description}</td>
                                             <td className="py-3 px-2 font-mono text-left opacity-70">{l.tax_amount.toLocaleString()}</td>
                                             <td className="py-3 px-2 font-mono font-black text-left text-indigo-500">{l.amount.toLocaleString()}</td>
                                             {(v.status === VoucherStatus.DRAFT || v.status === VoucherStatus.REJECTED) && (
                                               <td className="py-3 px-2 text-center">
                                                  <button 
                                                    type="button" 
                                                    onClick={() => handleDeleteExpenseLine(l.id)} 
                                                    className="text-rose-500 hover:text-rose-400 p-1 rounded-lg hover:bg-rose-500/10 transition-all"
                                                  >
                                                     <Trash2 className="w-4 h-4"/>
                                                  </button>
                                               </td>
                                             )}
                                          </tr>
                                       ))}
                                       {lines.length === 0 && (
                                         <tr>
                                           <td colSpan={6} className="py-12 text-center opacity-40">هنوز هیچ فاکتور یا مدرکی برای این صورت هزینه ثبت نشده است.</td>
                                         </tr>
                                       )}
                                    </tbody>
                                 </table>
                              </div>

                              {/* Ledger Summary */}
                              {v.status === VoucherStatus.POSTED && (
                                <div className={`p-4 rounded-xl border border-dashed mt-4 ${isDarkMode ? "bg-slate-950/40 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                                  <div className="flex justify-between items-center text-xs text-emerald-500 font-bold mb-1.5">
                                    <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4" /> سند مالی صادر شده است</span>
                                    <span>نوع سند: سند تسویه تجمیعی</span>
                                  </div>
                                  <p className="text-[10px] leading-relaxed opacity-70">
                                    آرتیکل‌های معین حسابداری این تراکنش به سرفصل هزینه‌های فوق (بدهکار) و حساب دارایی تنخواه‌گردان {fund?.fund_name} (بستانکار) ثبت و در دفتر کل ثبت قطعی گردید.
                                  </p>
                                </div>
                              )}
                           </div>
                        );
                     })()}
                  </>
               )}
            </div>
         </div>
      )}

      {/* --- PRINTABLE MODAL FOR VOUCHER --- */}
      {isPrintModalOpen && printVoucher && (
        <div id="print_modal" className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-white text-slate-900 rounded-2xl shadow-2xl p-6 md:p-8 flex flex-col gap-6 max-h-[90vh] overflow-y-auto border border-slate-300">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <h4 className="font-black text-sm text-slate-800 flex items-center gap-2">
                <Printer className="w-4.5 h-4.5 text-indigo-500" />
                نسخه چاپی صورت تنخواه‌گردان رسمی
              </h4>
              <button onClick={() => setIsPrintModalOpen(false)} className="opacity-60 hover:opacity-100 text-slate-700"><XCircle className="w-5 h-5"/></button>
            </div>

            {/* Document body formatted for print */}
            <div className="p-6 border border-slate-300 bg-slate-50 rounded-xl flex flex-col gap-4 text-slate-900 font-sans">
              <div className="flex justify-between items-center pb-4 border-b-2 border-slate-400">
                <div className="flex flex-col gap-1">
                  <h5 className="font-black text-base text-slate-800">شرکت نرم‌افزاری و بازرگانی توسعه سیستم</h5>
                  <p className="text-[10px] opacity-70">امور مالی و اداری - واحد خزانه‌داری</p>
                </div>
                <div className="text-center">
                  <h4 className="font-black text-lg border border-slate-500 px-4 py-1.5 rounded bg-white">فیش هزینه تنخواه‌گردان</h4>
                </div>
                <div className="flex flex-col text-left text-xs font-mono gap-1">
                  <div><span>شماره:</span> <span className="font-bold">PCV-{printVoucher.voucher_number}</span></div>
                  <div><span>تاریخ:</span> <span className="font-bold">{printVoucher.submission_date}</span></div>
                  <div><span>وضعیت:</span> <span className="font-bold text-indigo-600">{
                    printVoucher.status === VoucherStatus.POSTED ? "تسویه شده" : "موقت"
                  }</span></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div><span>تنخواه‌گردان مبدأ:</span> <strong className="mr-1">{
                  funds.find(f => f.id === printVoucher.fund_id)?.fund_name
                }</strong></div>
                <div><span>مسئول تنخواه (تحویل‌گیرنده):</span> <strong className="mr-1">{
                  getCustodianName(funds.find(f => f.id === printVoucher.fund_id)?.custodian_id || "")
                }</strong></div>
                <div className="col-span-2"><span>موضوع صورت هزینه:</span> <strong className="mr-1">{printVoucher.description}</strong></div>
              </div>

              {/* Items */}
              <div className="mt-2">
                <table className="w-full text-xs text-right border-collapse border border-slate-400">
                  <thead>
                    <tr className="bg-slate-200 border-b border-slate-400">
                      <th className="border border-slate-400 p-2 text-right">کد حساب مالی</th>
                      <th className="border border-slate-400 p-2 text-right">شماره فاکتور</th>
                      <th className="border border-slate-400 p-2 text-right">شرح اقلام هزینه</th>
                      <th className="border border-slate-400 p-2 text-left">مالیات (ریال)</th>
                      <th className="border border-slate-400 p-2 text-left">مبلغ (ریال)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {engine.getLines(printVoucher.id).map(l => (
                      <tr key={l.id} className="bg-white">
                        <td className="border border-slate-300 p-2 font-mono">{l.expense_account_id} ({getExpenseName(l.expense_account_id)})</td>
                        <td className="border border-slate-300 p-2 font-mono">#{l.invoice_number}</td>
                        <td className="border border-slate-300 p-2">{l.description}</td>
                        <td className="border border-slate-300 p-2 font-mono text-left">{l.tax_amount.toLocaleString()}</td>
                        <td className="border border-slate-300 p-2 font-mono font-bold text-left">{l.amount.toLocaleString()}</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-100 font-bold">
                      <td colSpan={3} className="border border-slate-400 p-2 text-left">جمع کل فاکتورها:</td>
                      <td colSpan={2} className="border border-slate-400 p-2 font-mono text-left text-base text-indigo-700">
                        {printVoucher.total_expense_amount.toLocaleString()} ریال
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-3 gap-4 text-center text-xs mt-8 pt-4 border-t border-slate-300">
                <div className="flex flex-col gap-12">
                  <span>کارپرداز (تنخواه‌دار)</span>
                  <span className="opacity-60 font-medium">امضا و اثر انگشت</span>
                </div>
                <div className="flex flex-col gap-12">
                  <span>امور مالی و حسابداری</span>
                  <span className="opacity-60 font-medium">امضا و تایید صحت مدارک</span>
                </div>
                <div className="flex flex-col gap-12">
                  <span>مدیرعامل / مدیر مالی ارشد</span>
                  <span className="opacity-60 font-medium">مهر و امضای نهایی</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button 
                onClick={() => window.print()} 
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4"/> چاپ مدرک (PDF)
              </button>
              <button onClick={() => setIsPrintModalOpen(false)} className="bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold">بستن پنجره</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
