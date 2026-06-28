import React, { useState, useEffect, useMemo } from "react";
import { 
  ChevronLeft, Info, BookOpen, CreditCard, Filter, Plus, Building, 
  Search, RefreshCw, Send, CheckCircle, AlertTriangle, Eye, Clock, 
  ShieldAlert, Calendar, FileText, Check, PlusCircle, Trash, DollarSign, ArrowLeftRight
} from "lucide-react";
import { 
  ChequeManagementEngine, Cheque, ChequeType, ChequeStatus, SayadInquiryResult 
} from "../lib/cheque-engine";

interface ChequeManagementProps {
  isDarkMode: boolean;
  showNotification: (text: string, type?: "success" | "error" | "info") => void;
  onBack: () => void;
}

const engine = new ChequeManagementEngine();

export default function ChequeManagement({ isDarkMode, showNotification, onBack }: ChequeManagementProps) {
  // Navigation & General tabs
  const [activeTab, setActiveTab] = useState<"chequebox" | "sayad" | "vouchers">("chequebox");
  const [showFriendlyGuide, setShowFriendlyGuide] = useState(true);
  
  // Data State
  const [cheques, setCheques] = useState<Cheque[]>([]);
  const [stats, setStats] = useState(engine.getChequeStats());
  
  // Active Cheque Selection for Details Panel
  const [selectedChequeId, setSelectedChequeId] = useState<string | null>(null);
  const selectedCheque = useMemo(() => cheques.find(c => c.id === selectedChequeId), [cheques, selectedChequeId]);
  const selectedChequeHistory = useMemo(() => selectedCheque ? engine.getChequeHistory(selectedCheque.id) : [], [selectedCheque]);

  // Filters State
  const [filterType, setFilterType] = useState<"ALL" | ChequeType>("ALL");
  const [filterStatus, setFilterStatus] = useState<"ALL" | ChequeStatus>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");

  // New Cheque Form
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formType, setFormType] = useState<ChequeType>(ChequeType.RECEIVED);
  const [newCheque, setNewCheque] = useState({
    cheque_number: "",
    sayad_id: "",
    amount: "",
    drawer_bank: "",
    branch: "",
    payer_payee_id: "",
    maturity_date: ""
  });

  // Sayad Inquiry tool state
  const [inquiryInput, setInquiryInput] = useState("");
  const [inquiryResult, setInquiryResult] = useState<SayadInquiryResult | null>(null);

  // Transition parameters state
  const [transitionBank, setTransitionBank] = useState("Bank_Melli");
  const [discountRateInput, setDiscountRateInput] = useState("5");
  const [showDiscountForm, setShowDiscountForm] = useState(false);

  // Load Data
  const loadData = () => {
    setCheques(engine.getAllCheques());
    setStats(engine.getChequeStats());
  };

  useEffect(() => {
    loadData();
  }, []);

  // Actions
  const handleCreateCheque = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCheque.amount || !newCheque.cheque_number || !newCheque.sayad_id) {
      showNotification("لطفاً اطلاعات ضروری چک (مبلغ، شماره، شناسه صیادی) را وارد کنید.", "error");
      return;
    }

    const numAmount = Number(newCheque.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      showNotification("مبلغ وارد شده معتبر نیست.", "error");
      return;
    }

    if (newCheque.sayad_id.replace(/\s+/g, '').length !== 16) {
      showNotification("شناسه صیاد باید دقیقاً ۱۶ رقم عددی باشد.", "error");
      return;
    }

    const result = engine.createCheque({
      cheque_number: newCheque.cheque_number,
      sayad_id: newCheque.sayad_id.replace(/\s+/g, ''),
      amount: numAmount,
      drawer_bank: newCheque.drawer_bank || "بانک نامشخص",
      branch: newCheque.branch || "مرکزی",
      payer_payee_id: newCheque.payer_payee_id || "Customer_General",
      maturity_date: newCheque.maturity_date || new Date().toISOString().split('T')[0],
      register_date: new Date().toISOString().split('T')[0],
      type: formType
    });

    if (result.success) {
      showNotification(
        `چک به شماره ${newCheque.cheque_number} با موفقیت ثبت و سند حسابداری (${result.voucher?.id}) صادر شد.`, 
        "success"
      );
      setIsFormOpen(false);
      // Reset form
      setNewCheque({
        cheque_number: "",
        sayad_id: "",
        amount: "",
        drawer_bank: "",
        branch: "",
        payer_payee_id: "",
        maturity_date: ""
      });
      loadData();
    } else {
      showNotification(result.error || "خطا در ثبت سند چک.", "error");
    }
  };

  const handleTransition = (id: string, newStatus: ChequeStatus) => {
    let params: any = {};
    
    if (newStatus === ChequeStatus.SENT_TO_BANK || newStatus === ChequeStatus.COLLECTED || newStatus === ChequeStatus.CLEARED) {
      params.bankAccountId = transitionBank;
    }

    if (newStatus === ChequeStatus.DISCOUNTED) {
      const rate = Number(discountRateInput);
      if (isNaN(rate) || rate < 0 || rate > 100) {
        showNotification("نرخ کارمزد تنزیل معتبر نیست.", "error");
        return;
      }
      params.discountRate = rate;
      setShowDiscountForm(false);
    }

    const result = engine.transitionStatus(id, newStatus, params);
    if (result.success) {
      const label = engine.getStatusLabelPersian(newStatus);
      showNotification(
        `وضعیت چک با موفقیت به [${label}] تغییر یافت. ${
          result.voucher ? `سند حسابداری ${result.voucher.id} ثبت گردید.` : ""
        }`, 
        "success"
      );
      loadData();
    } else {
      showNotification(result.error || "خطا در تغییر وضعیت چک", "error");
    }
  };

  const handleInquireSayad = () => {
    if (!inquiryInput) {
      showNotification("لطفاً شناسه ۱۶ رقمی صیادی را وارد کنید.", "error");
      return;
    }
    const result = engine.inquireSayad(inquiryInput);
    setInquiryResult(result);
    if (result.valid) {
      if (result.color === 'RED') {
        showNotification("توجه: وضعیت اعتباری صادرکننده قرمز است و پذیرش چک ایشان ممنوع می‌باشد.", "error");
      } else {
        showNotification(`استعلام با موفقیت انجام شد: وضعیت ${result.colorLabel}`, "success");
      }
    } else {
      showNotification(result.message, "error");
    }
  };

  const useInquiryForNewCheque = () => {
    if (!inquiryResult || !inquiryResult.valid) return;
    setFormType(ChequeType.RECEIVED);
    setNewCheque({
      cheque_number: inquiryInput.substring(10, 16),
      sayad_id: inquiryInput,
      amount: "",
      drawer_bank: "بانک نمونه صیادی",
      branch: "شعبه مرکزی",
      payer_payee_id: inquiryResult.drawerName,
      maturity_date: new Date(Date.now() + 10 * 24 * 3600 * 1000).toISOString().split('T')[0]
    });
    setIsFormOpen(true);
    setActiveTab("chequebox");
    showNotification("اطلاعات استعلام صیاد در فرم چک جدید درج شد.", "info");
  };

  // Filtered Cheques
  const filteredCheques = useMemo(() => {
    return cheques.filter(c => {
      // Type
      if (filterType !== "ALL" && c.type !== filterType) return false;
      // Status
      if (filterStatus !== "ALL" && c.current_status !== filterStatus) return false;
      // Search
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesSearch = 
          c.cheque_number.includes(term) || 
          c.sayad_id.includes(term) || 
          (c.drawer_bank && c.drawer_bank.toLowerCase().includes(term)) || 
          (c.payer_payee_id && c.payer_payee_id.toLowerCase().includes(term));
        if (!matchesSearch) return false;
      }
      // Min Amount
      if (minAmount && c.amount < Number(minAmount)) return false;
      // Max Amount
      if (maxAmount && c.amount > Number(maxAmount)) return false;
      
      return true;
    });
  }, [cheques, filterType, filterStatus, searchTerm, minAmount, maxAmount]);

  const allVouchers = useMemo(() => engine.getAllVouchers(), [cheques]);

  const getSayadColorClass = (color: 'WHITE' | 'YELLOW' | 'ORANGE' | 'RED') => {
    switch (color) {
      case 'WHITE': return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case 'YELLOW': return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case 'ORANGE': return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      case 'RED': return "bg-rose-500/10 text-rose-500 border-rose-500/30 animate-pulse";
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col max-w-6xl mx-auto w-full animate-fade-in" dir="rtl">
      {/* Upper header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className={`text-xl font-black tracking-tight ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>
              سامانه جامع مدیریت اسناد دریافتنی و پرداختنی (چک)
            </h2>
            <button
              onClick={() => setShowFriendlyGuide(!showFriendlyGuide)}
              className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 flex items-center gap-1 hover:bg-indigo-500/20 transition-all"
            >
              <Info className="w-3.5 h-3.5" />
              {showFriendlyGuide ? "پنهان‌سازی راهنما" : "موتور تولید سند حسابداری خودکار"}
            </button>
          </div>
          <p className={`text-xs mt-1.5 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
             رهگیری همزمان چرخه چک‌ها، ثبت اتوماتیک در دفتر کل و معین و تطبیق امن با دیتابیس مالی.
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

      {/* Guide Block */}
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
                ⚙️ معماری یکپارچه خزانه‌داری اسناد بهادار (چک)
              </h3>
              <p className="text-xs leading-relaxed opacity-90 mb-4">
                هر تغییر وضعیت چک با یک تراکنش **ACID** تضمین‌شده به دفاتر مالی منتقل می‌شود تا از هرگونه مغایرت میان موجودی اسناد بهادار و حساب کل بانک جلوگیری گردد.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-2">
                <div className={`p-3 rounded-xl border ${isDarkMode ? "bg-slate-950/40 border-slate-850" : "bg-white border-slate-100"}`}>
                  <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 mb-1.5">۱. ثبت در صندوق</span>
                  <p className="text-[10px] leading-relaxed opacity-80">
                     بدهکار: اسناد دریافتنی (صندوق)<br/>بستانکار: حساب‌های دریافتنی (شخص)
                  </p>
                </div>
                <div className={`p-3 rounded-xl border ${isDarkMode ? "bg-slate-950/40 border-slate-850" : "bg-white border-slate-100"}`}>
                  <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 mb-1.5">۲. واگذاری به بانک</span>
                  <p className="text-[10px] leading-relaxed opacity-80">
                    بدهکار: اسناد در جریان وصول<br/>بستانکار: اسناد دریافتنی (صندوق)
                  </p>
                </div>
                <div className={`p-3 rounded-xl border ${isDarkMode ? "bg-slate-950/40 border-slate-850" : "bg-white border-slate-100"}`}>
                  <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 mb-1.5">۳. وصول نهایی</span>
                  <p className="text-[10px] leading-relaxed opacity-80">
                    بدهکار: حساب بانکی شرکت<br/>بستانکار: اسناد در جریان وصول
                  </p>
                </div>
                <div className={`p-3 rounded-xl border ${isDarkMode ? "bg-slate-950/40 border-slate-850" : "bg-white border-slate-100"}`}>
                  <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-500 mb-1.5">۴. تنزیل چک (فروش)</span>
                  <p className="text-[10px] leading-relaxed opacity-80">
                    بدهکار: بانک + هزینه مالی تنزیل<br/>بستانکار: اسناد دریافتنی نزد صندوق
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className={`p-4 rounded-2xl border ${isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200"}`}>
          <span className="text-[10px] text-slate-500 font-bold block mb-1">چک‌های نزد صندوق (دریافتی)</span>
          <div className="flex items-center justify-between">
            <span className="font-black text-sm text-indigo-500">{stats.received.inHandCount} فقره</span>
            <span className="font-mono font-bold text-xs opacity-80">{stats.received.inHandAmount.toLocaleString()} ریال</span>
          </div>
        </div>
        <div className={`p-4 rounded-2xl border ${isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200"}`}>
          <span className="text-[10px] text-slate-500 font-bold block mb-1">در جریان وصول (واگذار شده)</span>
          <div className="flex items-center justify-between">
            <span className="font-black text-sm text-blue-500">{stats.received.inTransitCount} فقره</span>
            <span className="font-mono font-bold text-xs opacity-80">{stats.received.inTransitAmount.toLocaleString()} ریال</span>
          </div>
        </div>
        <div className={`p-4 rounded-2xl border ${isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200"}`}>
          <span className="text-[10px] text-slate-500 font-bold block mb-1">وصول شده نقدی/بانکی</span>
          <div className="flex items-center justify-between">
            <span className="font-black text-sm text-emerald-500">{stats.received.collectedCount} فقره</span>
            <span className="font-mono font-bold text-xs opacity-80">{stats.received.collectedAmount.toLocaleString()} ریال</span>
          </div>
        </div>
        <div className={`p-4 rounded-2xl border ${isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200"}`}>
          <span className="text-[10px] text-slate-500 font-bold block mb-1">تعهدات اسناد پرداختی فعال</span>
          <div className="flex items-center justify-between">
            <span className="font-black text-sm text-purple-500">{stats.paid.issuedCount} فقره</span>
            <span className="font-mono font-bold text-xs opacity-80">{stats.paid.issuedAmount.toLocaleString()} ریال</span>
          </div>
        </div>
      </div>

      {/* Primary Tab buttons */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6">
        <button 
          onClick={() => setActiveTab("chequebox")} 
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "chequebox" ? "border-indigo-500 text-indigo-500" : "border-transparent text-slate-500 hover:text-slate-400"
          }`}
        >
          <CreditCard className="w-4 h-4" /> صندوق چک‌ها و سررسیدها
        </button>
        <button 
          onClick={() => setActiveTab("sayad")} 
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "sayad" ? "border-indigo-500 text-indigo-500" : "border-transparent text-slate-500 hover:text-slate-400"
          }`}
        >
          <Building className="w-4 h-4" /> سامانه استعلام صیاد (بانک مرکزی)
        </button>
        <button 
          onClick={() => setActiveTab("vouchers")} 
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "vouchers" ? "border-indigo-500 text-indigo-500" : "border-transparent text-slate-500 hover:text-slate-400"
          }`}
        >
          <FileText className="w-4 h-4" /> اسناد حسابداری چک‌ها
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === "chequebox" && (
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          
          {/* List and Filters container */}
          <div className="flex-1 w-full flex flex-col gap-4">
            
            {/* Filter Panel */}
            <div className={`p-4 rounded-2xl border flex flex-col gap-3 ${
              isDarkMode ? "bg-slate-900/50 border-slate-800" : "bg-slate-50/50 border-slate-200"
            }`}>
              <div className="flex items-center justify-between border-b border-dashed border-slate-200/20 pb-2">
                <span className="text-xs font-bold flex items-center gap-1"><Filter className="w-3.5 h-3.5" /> فیلتر پیشرفته</span>
                <button 
                  onClick={() => {
                    setFilterType("ALL");
                    setFilterStatus("ALL");
                    setSearchTerm("");
                    setMinAmount("");
                    setMaxAmount("");
                  }}
                  className="text-[10px] text-slate-500 hover:text-indigo-500 font-bold transition-all"
                >
                  پاک کردن همه
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {/* Search Term */}
                <div className="md:col-span-2 relative">
                  <Search className="w-3.5 h-3.5 absolute right-3 top-3 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="جستجوی سریال، شناسه صیادی، بانک یا طرف حساب..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className={`w-full p-2 pr-9 rounded-lg text-xs border ${
                      isDarkMode ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200"
                    }`}
                  />
                </div>

                {/* Filter Type */}
                <div>
                  <select 
                    value={filterType} 
                    onChange={e => setFilterType(e.target.value as any)}
                    className={`w-full p-2 rounded-lg text-xs font-bold border ${
                      isDarkMode ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200"
                    }`}
                  >
                    <option value="ALL">نوع چک: همه</option>
                    <option value={ChequeType.RECEIVED}>چک‌های دریافتی (مشتریان)</option>
                    <option value={ChequeType.PAID}>چک‌های پرداختی (صادراتی)</option>
                  </select>
                </div>

                {/* Filter Status */}
                <div>
                  <select 
                    value={filterStatus} 
                    onChange={e => setFilterStatus(e.target.value as any)}
                    className={`w-full p-2 rounded-lg text-xs font-bold border ${
                      isDarkMode ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200"
                    }`}
                  >
                    <option value="ALL">وضعیت: همه</option>
                    <option value={ChequeStatus.REGISTERED}>موجود در صندوق</option>
                    <option value={ChequeStatus.SENT_TO_BANK}>در جریان وصول</option>
                    <option value={ChequeStatus.COLLECTED}>وصول شده</option>
                    <option value={ChequeStatus.BOUNCED}>برگشتی دریافتی</option>
                    <option value={ChequeStatus.DISCOUNTED}>تنزیل شده</option>
                    <option value={ChequeStatus.ISSUED}>صادر شده (پرداختی)</option>
                    <option value={ChequeStatus.CLEARED}>پاس شده (پرداختی)</option>
                    <option value={ChequeStatus.BOUNCED_PAID}>برگشتی پرداختی</option>
                  </select>
                </div>

                {/* Min Amount */}
                <div>
                  <input 
                    type="number" 
                    placeholder="حداقل مبلغ (ریال)..." 
                    value={minAmount}
                    onChange={e => setMinAmount(e.target.value)}
                    className={`w-full p-2 rounded-lg text-xs font-mono border ${
                      isDarkMode ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200"
                    }`}
                  />
                </div>

                {/* Max Amount */}
                <div>
                  <input 
                    type="number" 
                    placeholder="حداکثر مبلغ (ریال)..." 
                    value={maxAmount}
                    onChange={e => setMaxAmount(e.target.value)}
                    className={`w-full p-2 rounded-lg text-xs font-mono border ${
                      isDarkMode ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200"
                    }`}
                  />
                </div>

                <div className="md:col-span-2 flex justify-end">
                  <button 
                    onClick={() => setIsFormOpen(!isFormOpen)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> ثبت چک جدید
                  </button>
                </div>
              </div>
            </div>

            {/* New Cheque form drawer */}
            {isFormOpen && (
              <form onSubmit={handleCreateCheque} className={`p-5 rounded-2xl border flex flex-col gap-4 animate-fade-in ${
                isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
              }`}>
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h4 className="font-bold text-xs text-indigo-500 flex items-center gap-1">
                    <PlusCircle className="w-4 h-4" /> فرم ثبت و ثبت همزمان سند دوبل حسابداری
                  </h4>
                  <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl">
                    <button 
                      type="button" 
                      onClick={() => setFormType(ChequeType.RECEIVED)}
                      className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${
                        formType === ChequeType.RECEIVED ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-400"
                      }`}
                    >
                      دریافتی از مشتری
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setFormType(ChequeType.PAID)}
                      className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${
                        formType === ChequeType.PAID ? "bg-purple-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-400"
                      }`}
                    >
                      پرداختی به تامین‌کننده (صادراتی)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold mb-1 opacity-70">سریال چاپی برگه چک *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="مثال: 981024"
                      value={newCheque.cheque_number}
                      onChange={e => setNewCheque({...newCheque, cheque_number: e.target.value})}
                      className={`w-full p-2.5 rounded-lg text-xs font-mono border ${
                        isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold mb-1 opacity-70">شناسه صیادی ۱۶ رقمی بانک مرکزی *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="مثال: 1405928174820152"
                      value={newCheque.sayad_id}
                      onChange={e => setNewCheque({...newCheque, sayad_id: e.target.value})}
                      className={`w-full p-2.5 rounded-lg text-xs font-mono border ${
                        isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold mb-1 opacity-70">مبلغ معادل به ریال *</label>
                    <input 
                      type="number" 
                      required
                      placeholder="مثال: 50000000"
                      value={newCheque.amount}
                      onChange={e => setNewCheque({...newCheque, amount: e.target.value})}
                      className={`w-full p-2.5 rounded-lg text-xs font-mono border ${
                        isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold mb-1 opacity-70">بانک عهده (صادرکننده چک)</label>
                    <input 
                      type="text" 
                      placeholder="مثال: بانک ملی، بانک ملت..."
                      value={newCheque.drawer_bank}
                      onChange={e => setNewCheque({...newCheque, drawer_bank: e.target.value})}
                      className={`w-full p-2.5 rounded-lg text-xs border ${
                        isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold mb-1 opacity-70">شعبه بانک و کد شعبه</label>
                    <input 
                      type="text" 
                      placeholder="شعبه مرکزی کد ۱۲"
                      value={newCheque.branch}
                      onChange={e => setNewCheque({...newCheque, branch: e.target.value})}
                      className={`w-full p-2.5 rounded-lg text-xs border ${
                        isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold mb-1 opacity-70">تاریخ سررسید سررسید چک *</label>
                    <input 
                      type="date" 
                      required
                      value={newCheque.maturity_date}
                      onChange={e => setNewCheque({...newCheque, maturity_date: e.target.value})}
                      className={`w-full p-2.5 rounded-lg text-xs font-mono border ${
                        isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"
                      }`}
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-[10px] font-bold mb-1 opacity-70">طرف حساب (شرح حساب تفصیلی شناور)</label>
                    <input 
                      type="text" 
                      placeholder="مثلا: شرکت پخش رازی، آقای علیزاده..."
                      value={newCheque.payer_payee_id}
                      onChange={e => setNewCheque({...newCheque, payer_payee_id: e.target.value})}
                      className={`w-full p-2.5 rounded-lg text-xs border ${
                        isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"
                      }`}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-3 mt-1">
                  <button 
                    type="button" 
                    onClick={() => setIsFormOpen(false)}
                    className={`px-4 py-2 text-xs font-bold rounded-xl ${
                      isDarkMode ? "bg-slate-800 hover:bg-slate-700 text-slate-300" : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                    }`}
                  >
                    انصراف
                  </button>
                  <button 
                    type="submit" 
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl text-xs font-bold transition-all"
                  >
                    صدور سند و ثبت چک
                  </button>
                </div>
              </form>
            )}

            {/* List Results */}
            <div className="flex flex-col gap-3">
              {filteredCheques.length === 0 ? (
                <div className={`p-12 text-center text-xs opacity-50 rounded-2xl border ${
                  isDarkMode ? "bg-slate-900/10 border-slate-800" : "bg-white border-slate-200"
                }`}>
                  <CreditCard className="w-10 h-10 opacity-30 mx-auto mb-3" />
                  هیچ چکی با مشخصات وارد شده یافت نشد. برای ثبت چک جدید دکمه بالای صفحه را بزنید.
                </div>
              ) : (
                filteredCheques.map(c => (
                  <div 
                    key={c.id} 
                    onClick={() => setSelectedChequeId(c.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group ${
                      selectedChequeId === c.id
                        ? (isDarkMode ? "bg-indigo-950/25 border-indigo-500 shadow-md shadow-indigo-950/50" : "bg-indigo-50 border-indigo-300 shadow-md shadow-indigo-100")
                        : (isDarkMode ? "bg-slate-900/30 border-slate-800 hover:border-slate-700 hover:bg-slate-900/50" : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50")
                    }`}
                  >
                    {/* Basic details */}
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl shrink-0 ${
                        c.type === ChequeType.RECEIVED 
                          ? "bg-blue-500/10 text-blue-500" 
                          : "bg-purple-500/10 text-purple-500"
                      }`}>
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm tracking-wider">{c.cheque_number}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                            c.type === ChequeType.RECEIVED 
                              ? "bg-blue-500/10 text-blue-500" 
                              : "bg-purple-500/10 text-purple-500"
                          }`}>
                            {c.type === ChequeType.RECEIVED ? "دریافتی از مشتری" : "صادره عهده شرکت"}
                          </span>
                        </div>
                        <div className="text-[10px] opacity-70 mt-1 flex flex-wrap gap-x-3 gap-y-1 font-mono">
                          <span>صیاد: {c.sayad_id}</span>
                          <span>بانک عهده: {c.drawer_bank}</span>
                          <span>شعب: {c.branch}</span>
                        </div>
                      </div>
                    </div>

                    {/* Left details & status */}
                    <div className="flex items-center gap-4 justify-between md:justify-end shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-200/10">
                      <div className="text-right">
                        <span className={`text-xs font-black block ${
                          c.type === ChequeType.RECEIVED ? "text-blue-600 dark:text-blue-400" : "text-purple-600 dark:text-purple-400"
                        }`}>
                          {c.amount.toLocaleString()} ریال
                        </span>
                        <span className="text-[9px] opacity-60 font-mono mt-0.5 block flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> سررسید: {c.maturity_date}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-md border ${
                          c.current_status === ChequeStatus.REGISTERED ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                          c.current_status === ChequeStatus.SENT_TO_BANK ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                          c.current_status === ChequeStatus.COLLECTED ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                          c.current_status === ChequeStatus.BOUNCED ? "bg-rose-500/10 text-rose-500 border-rose-500/20 animate-pulse" :
                          c.current_status === ChequeStatus.DISCOUNTED ? "bg-indigo-500/10 text-indigo-500 border-indigo-500/20" :
                          c.current_status === ChequeStatus.ISSUED ? "bg-purple-500/10 text-purple-500 border-purple-500/20" :
                          c.current_status === ChequeStatus.CLEARED ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                          "bg-rose-500/10 text-rose-500 border-rose-500/20"
                        }`}>
                          {engine.getStatusLabelPersian(c.current_status)}
                        </span>
                        <Eye className="w-4 h-4 opacity-0 group-hover:opacity-70 transition-opacity text-slate-400" />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>

          {/* Details / Operations sidebar panel */}
          <div className="w-full lg:w-96 shrink-0 flex flex-col gap-4">
            
            <div className={`p-5 rounded-2xl border flex flex-col gap-4 ${
              isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200"
            }`}>
              <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                <h4 className="font-bold text-sm flex items-center gap-2">
                  <Eye className="w-4 h-4 text-indigo-500" />
                  جزئیات چک و ابزارهای تغییر وضعیت
                </h4>
              </div>

              {!selectedCheque ? (
                <div className="p-12 text-center text-xs opacity-50 flex flex-col items-center gap-2">
                  <CreditCard className="w-10 h-10 opacity-30" />
                  برای مشاهده جزئیات، اسناد مالی تولید شده و تغییر وضعیت‌های قانونی، روی یکی از چک‌ها کلیک کنید.
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {/* Quick Card Detail */}
                  <div className={`p-4 rounded-xl border ${
                    isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-100"
                  }`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] opacity-60">شناسه سیستمی: {selectedCheque.id}</span>
                      <span className="font-bold text-[10px] opacity-80">{selectedCheque.drawer_bank}</span>
                    </div>
                    <div className="text-right mb-2">
                      <span className="text-xs opacity-60 block text-[10px]">مبلغ برگه:</span>
                      <span className="font-black text-lg text-indigo-500 block">{selectedCheque.amount.toLocaleString()} ریال</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px] opacity-80 border-t border-dashed border-slate-200/15 pt-2">
                      <div>طرف حساب: <strong>{selectedCheque.payer_payee_id}</strong></div>
                      <div>سررسید: <strong className="font-mono">{selectedCheque.maturity_date}</strong></div>
                    </div>
                  </div>

                  {/* Transition parameters (Bank / discount) */}
                  <div className={`p-4 rounded-xl border flex flex-col gap-3 ${
                    isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-100"
                  }`}>
                    <span className="text-[10px] font-bold opacity-75">تنظیمات عملیات انتقال وجه:</span>
                    <div>
                      <label className="block text-[9px] opacity-60 mb-1">بانک مقصد برای خواباندن/وصول/پاس شدن:</label>
                      <select 
                        value={transitionBank} 
                        onChange={e => setTransitionBank(e.target.value)}
                        className={`w-full p-2 rounded-md text-[10px] font-bold border ${
                          isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
                        }`}
                      >
                        <option value="1101_MELLI">بانک ملی ایران - جاری ۱۰۲۰</option>
                        <option value="1101_MELLAT">بانک ملت - جاری ۳۲۰۰</option>
                        <option value="1101_SAMAN">بانک سامان - جاری ۹۱۴۰</option>
                      </select>
                    </div>

                    {showDiscountForm ? (
                      <div className="mt-1 animate-fade-in flex items-end gap-2 border-t border-dashed border-slate-200/10 pt-2">
                        <div className="flex-1">
                          <label className="block text-[9px] opacity-60 mb-1">نرخ کارمزد تنزیل چک (درصد) *</label>
                          <input 
                            type="number" 
                            min="1" 
                            max="50"
                            value={discountRateInput}
                            onChange={e => setDiscountRateInput(e.target.value)}
                            className={`w-full p-1.5 rounded-md text-[10px] border ${
                              isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
                            }`}
                          />
                        </div>
                        <button 
                          onClick={() => handleTransition(selectedCheque.id, ChequeStatus.DISCOUNTED)}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] px-3 py-2 rounded-lg"
                        >
                          تایید تنزیل
                        </button>
                      </div>
                    ) : null}
                  </div>

                  {/* Operational Controls depending on status */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-bold opacity-75 block">عملیات مجاز روی این چک:</span>
                    
                    {/* Received in Hand */}
                    {selectedCheque.type === ChequeType.RECEIVED && selectedCheque.current_status === ChequeStatus.REGISTERED && (
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={() => handleTransition(selectedCheque.id, ChequeStatus.SENT_TO_BANK)}
                          className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] py-2 px-3 rounded-lg flex items-center justify-center gap-1"
                        >
                          <Send className="w-3.5 h-3.5" /> خواباندن به حساب (واگذاری)
                        </button>
                        <button 
                          onClick={() => handleTransition(selectedCheque.id, ChequeStatus.COLLECTED)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] py-2 px-3 rounded-lg flex items-center justify-center gap-1"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> وصول نقدی چک
                        </button>
                        <button 
                          onClick={() => setShowDiscountForm(true)}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] py-2 px-3 rounded-lg flex items-center justify-center gap-1"
                        >
                          <DollarSign className="w-3.5 h-3.5" /> تنزیل قبل سررسید
                        </button>
                        <button 
                          onClick={() => handleTransition(selectedCheque.id, ChequeStatus.RETURNED)}
                          className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] py-2 px-3 rounded-lg flex items-center justify-center gap-1"
                        >
                          <ArrowLeftRight className="w-3.5 h-3.5" /> عودت به مشتری
                        </button>
                        <button 
                          onClick={() => handleTransition(selectedCheque.id, ChequeStatus.BOUNCED)}
                          className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] py-2 px-3 rounded-lg flex items-center justify-center gap-1 col-span-2"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" /> واخواست و برگشت زدن چک
                        </button>
                      </div>
                    )}

                    {/* Received In Transit */}
                    {selectedCheque.type === ChequeType.RECEIVED && selectedCheque.current_status === ChequeStatus.SENT_TO_BANK && (
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={() => handleTransition(selectedCheque.id, ChequeStatus.COLLECTED)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] py-2 px-3 rounded-lg flex items-center justify-center gap-1"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> وصول در حساب بانک مقصد
                        </button>
                        <button 
                          onClick={() => handleTransition(selectedCheque.id, ChequeStatus.BOUNCED)}
                          className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] py-2 px-3 rounded-lg flex items-center justify-center gap-1"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" /> برگشت خوردن چک خوابانده شده
                        </button>
                      </div>
                    )}

                    {/* Paid Issued */}
                    {selectedCheque.type === ChequeType.PAID && selectedCheque.current_status === ChequeStatus.ISSUED && (
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={() => handleTransition(selectedCheque.id, ChequeStatus.CLEARED)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] py-2 px-3 rounded-lg flex items-center justify-center gap-1"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> پاس شد (برداشت از بانک)
                        </button>
                        <button 
                          onClick={() => handleTransition(selectedCheque.id, ChequeStatus.RETURNED_PAID)}
                          className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] py-2 px-3 rounded-lg flex items-center justify-center gap-1"
                        >
                          <ArrowLeftRight className="w-3.5 h-3.5" /> استرداد و ابطال چک صادره
                        </button>
                        <button 
                          onClick={() => handleTransition(selectedCheque.id, ChequeStatus.BOUNCED_PAID)}
                          className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] py-2 px-3 rounded-lg flex items-center justify-center gap-1 col-span-2"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" /> برگشت خوردن چک پرداختی شرکت
                        </button>
                      </div>
                    )}

                    {/* Bounced received can be re-submitted */}
                    {selectedCheque.type === ChequeType.RECEIVED && selectedCheque.current_status === ChequeStatus.BOUNCED && (
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={() => handleTransition(selectedCheque.id, ChequeStatus.SENT_TO_BANK)}
                          className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] py-2 px-3 rounded-lg flex items-center justify-center gap-1"
                        >
                          <Send className="w-3.5 h-3.5" /> ارسال مجدد به بانک جهت وصول
                        </button>
                        <button 
                          onClick={() => handleTransition(selectedCheque.id, ChequeStatus.RETURNED)}
                          className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] py-2 px-3 rounded-lg flex items-center justify-center gap-1"
                        >
                          <ArrowLeftRight className="w-3.5 h-3.5" /> استرداد و عودت فیزیکی به مشتری
                        </button>
                      </div>
                    )}

                    {/* Terminal statuses */}
                    {(selectedCheque.current_status === ChequeStatus.COLLECTED || 
                      selectedCheque.current_status === ChequeStatus.CLEARED || 
                      selectedCheque.current_status === ChequeStatus.DISCOUNTED || 
                      selectedCheque.current_status === ChequeStatus.RETURNED || 
                      selectedCheque.current_status === ChequeStatus.RETURNED_PAID) && (
                      <div className="text-[10px] text-center opacity-70 p-4 border border-dashed rounded-xl flex flex-col items-center gap-1.5">
                        <Check className="w-5 h-5 text-emerald-500" />
                        این چک در وضعیت نهایی و قطعی حسابداری خود قرار دارد. عملیات مالی دیگری برای آن متصور نیست.
                      </div>
                    )}
                  </div>

                  {/* History Timeline */}
                  <div className="mt-2 border-t border-slate-200 dark:border-slate-800 pt-3 flex flex-col gap-3">
                    <span className="text-[10px] font-bold opacity-75 flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-indigo-500"/> سوابق و لاگ تغییرات چک:</span>
                    <div className="flex flex-col gap-3 pr-2 border-r border-slate-200 dark:border-slate-800 mr-2">
                      {selectedChequeHistory.map((h, idx) => (
                        <div key={h.id} className="relative">
                          <div className="absolute -right-[13px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-500 border-2 border-white dark:border-slate-900"></div>
                          <div className="text-[10px]">
                            <div className="flex justify-between items-center opacity-60">
                              <span>کاربر: {h.user_id}</span>
                              <span className="font-mono">{new Date(h.action_date).toLocaleDateString('fa-IR')}</span>
                            </div>
                            <p className="font-bold mt-0.5">{h.note || engine.getStatusLabelPersian(h.to_status)}</p>
                            {h.journal_voucher_id && (
                              <span className="text-[9px] font-mono font-bold bg-indigo-500/10 text-indigo-500 px-1.5 py-0.5 rounded mt-1 inline-block">
                                سند تولید شده: {h.journal_voucher_id}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {activeTab === "sayad" && (
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Query input panel */}
          <div className={`w-full lg:w-2/5 p-6 rounded-2xl border flex flex-col gap-4 ${
            isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200"
          }`}>
            <h3 className="font-bold text-sm flex items-center gap-2"><Building className="w-4 h-4 text-indigo-500"/> استعلام رتبه اعتباری صیادی بانک مرکزی</h3>
            <p className="text-xs leading-relaxed opacity-85">
               بر اساس قوانین مصوب بانک مرکزی ایران، پیش از دریافت هرگونه چک صیاد، حسابدار موظف است شناسه ۱۶ رقمی مندرج روی برگه چک را استعلام نموده و رتبه اعتباری صادرکننده را بررسی نماید.
            </p>

            <div className="flex flex-col gap-2 mt-2">
              <label className="text-xs font-bold opacity-75">شناسه صیاد ۱۶ رقمی:</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  maxLength={16}
                  placeholder="مثلاً 1405928174820152"
                  value={inquiryInput}
                  onChange={e => setInquiryInput(e.target.value.replace(/\D/g, ''))}
                  className={`flex-1 p-2.5 rounded-lg text-sm font-mono tracking-widest text-center border ${
                    isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"
                  }`}
                />
                <button 
                  onClick={handleInquireSayad}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 rounded-lg flex items-center gap-1"
                >
                  <RefreshCw className="w-4 h-4" /> استعلام
                </button>
              </div>
              <span className="text-[9px] opacity-60">تست: برای دریافت رتبه قرمز عدد آخر را ۶ قرار دهید، برای نارنجی ۳، برای زرد ۲، برای سفید ۱ یا ۰.</span>
            </div>
          </div>

          {/* Results visualization */}
          <div className="flex-1 w-full flex flex-col gap-4">
            {!inquiryResult ? (
              <div className={`p-12 text-center text-xs opacity-50 rounded-2xl border flex flex-col items-center gap-2 ${
                isDarkMode ? "bg-slate-900/10 border-slate-800" : "bg-white border-slate-200"
              }`}>
                <ShieldAlert className="w-12 h-12 text-slate-400 opacity-45" />
                منتظر وارد کردن شناسه صیادی و ثبت استعلام از پایگاه داده اعتباری بانک مرکزی ایران...
              </div>
            ) : (
              <div className={`p-6 rounded-2xl border flex flex-col gap-6 animate-fade-in ${
                isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200"
              }`}>
                
                {/* Score badge */}
                <div className={`p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  getSayadColorClass(inquiryResult.color)
                }`}>
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-widest block opacity-70">رنگ وضعیت صیاد صادرکننده:</span>
                    <h3 className="font-black text-lg mt-1">{inquiryResult.colorLabel}</h3>
                    <p className="text-xs mt-1 leading-relaxed">{inquiryResult.colorDesc}</p>
                  </div>
                  {inquiryResult.color === 'RED' ? (
                    <div className="p-3 bg-rose-500 text-white rounded-2xl font-black text-xs text-center">
                      ⚠️ پذیرش مسدود
                    </div>
                  ) : (
                    <button 
                      onClick={useInquiryForNewCheque}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm shadow-indigo-950/20"
                    >
                      استفاده در ثبت چک جدید
                    </button>
                  )}
                </div>

                {/* Details report */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`p-4 rounded-xl border flex flex-col gap-2 ${
                    isDarkMode ? "bg-slate-950 border-slate-850" : "bg-slate-50 border-slate-100"
                  }`}>
                    <span className="text-[10px] opacity-60">نام صاحب حساب جاری:</span>
                    <span className="font-bold text-sm">{inquiryResult.drawerName}</span>
                  </div>

                  <div className={`p-4 rounded-xl border flex flex-col gap-2 ${
                    isDarkMode ? "bg-slate-950 border-slate-850" : "bg-slate-50 border-slate-100"
                  }`}>
                    <span className="text-[10px] opacity-60">کد ملی / شناسه ملی صادرکننده:</span>
                    <span className="font-bold text-sm font-mono">{inquiryResult.nationalId}</span>
                  </div>

                  <div className={`p-4 rounded-xl border flex flex-col gap-2 ${
                    isDarkMode ? "bg-slate-950 border-slate-850" : "bg-slate-50 border-slate-100"
                  }`}>
                    <span className="text-[10px] opacity-60">تعداد چک‌های برگشتی فعال رفع سوء اثر نشده:</span>
                    <span className={`font-bold text-sm ${inquiryResult.bouncedCount > 0 ? "text-rose-500" : "text-emerald-500"}`}>{inquiryResult.bouncedCount} فقره</span>
                  </div>

                  <div className={`p-4 rounded-xl border flex flex-col gap-2 ${
                    isDarkMode ? "bg-slate-950 border-slate-850" : "bg-slate-50 border-slate-100"
                  }`}>
                    <span className="text-[10px] opacity-60">مبلغ کل چک‌های برگشتی رفع سوء اثر نشده:</span>
                    <span className={`font-bold text-sm ${inquiryResult.bouncedAmount > 0 ? "text-rose-500" : "text-slate-500"}`}>{inquiryResult.bouncedAmount.toLocaleString()} ریال</span>
                  </div>

                  <div className={`p-4 rounded-xl border flex flex-col gap-2 md:col-span-2 ${
                    isDarkMode ? "bg-slate-950 border-slate-850" : "bg-slate-50 border-slate-100"
                  }`}>
                    <span className="text-[10px] opacity-60">حداکثر سقف مجاز ثبت تعهد روزانه (ریال):</span>
                    <span className="font-bold text-sm text-indigo-500">{inquiryResult.creditCeiling.toLocaleString()} ریال</span>
                  </div>
                </div>

                {/* Final verdict */}
                <div className={`p-4 rounded-xl border text-xs leading-relaxed ${
                  inquiryResult.color === 'RED' ? "bg-rose-500/10 text-rose-500 border-rose-500/20" : "bg-indigo-500/10 text-indigo-500 border-indigo-500/20"
                }`}>
                  <strong>نتیجه نهایی اعتبارسنجی سیستم: </strong>
                  {inquiryResult.message}
                </div>

              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "vouchers" && (
        <div className="flex flex-col gap-4 animate-fade-in">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-500" />
              فهرست سندهای حسابداری صادر شده توسط موتور اتوماتیک خزانه‌داری چک
            </h3>
            <span className="text-xs opacity-60">کل اسناد: {allVouchers.length} سند حسابداری</span>
          </div>

          {allVouchers.length === 0 ? (
            <div className={`p-12 text-center text-xs opacity-50 rounded-2xl border ${
              isDarkMode ? "bg-slate-900/10 border-slate-800" : "bg-white border-slate-200"
            }`}>
              هیچ سندی تولید نشده است. یک چک جدید ثبت یا تغییر وضعیت دهید تا اسناد اتوماتیک مالی ایجاد شوند.
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {allVouchers.map(v => (
                <div 
                  key={v.id} 
                  className={`p-5 rounded-2xl border flex flex-col gap-4 transition-all ${
                    isDarkMode ? "bg-slate-900/40 border-slate-800 hover:border-slate-700" : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {/* Voucher Title */}
                  <div className="flex items-center justify-between border-b border-dashed border-slate-200/10 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-xl"><FileText className="w-4 h-4" /></div>
                      <div>
                        <h4 className="font-black text-xs text-indigo-500">{v.id}</h4>
                        <p className="text-[11px] opacity-75 mt-0.5">{v.description}</p>
                      </div>
                    </div>
                    <span className="font-mono text-[10px] opacity-60">تاریخ صدور: {new Date(v.date).toLocaleDateString('fa-IR')}</span>
                  </div>

                  {/* Lines Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200/10 pb-2 text-[10px] opacity-60">
                          <th className="py-2 px-2 text-right">کد حساب معین</th>
                          <th className="py-2 px-2 text-right">حساب تفصیلی شناور</th>
                          <th className="py-2 px-2 text-right">شرح ردیف آرتیکل</th>
                          <th className="py-2 px-2 text-left">بدهکار (ریال)</th>
                          <th className="py-2 px-2 text-left">بستانکار (ریال)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {v.lines.map((line, idx) => (
                          <tr key={idx} className="border-b border-dashed border-slate-200/5 last:border-0 hover:bg-slate-500/5 transition-all">
                            <td className="py-3 px-2 font-mono font-bold opacity-85">{line.account_code}</td>
                            <td className="py-3 px-2 font-bold opacity-75">{line.detailed_account_id || '-'}</td>
                            <td className="py-3 px-2 opacity-90">{line.description}</td>
                            <td className="py-3 px-2 font-mono font-bold text-left text-indigo-500">
                              {line.debit > 0 ? line.debit.toLocaleString() : '-'}
                            </td>
                            <td className="py-3 px-2 font-mono font-bold text-left text-emerald-500">
                              {line.credit > 0 ? line.credit.toLocaleString() : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
