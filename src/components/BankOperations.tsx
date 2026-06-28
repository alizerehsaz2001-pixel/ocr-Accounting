import React, { useState, useEffect, useMemo } from "react";
import { 
  ChevronLeft, Info, BookOpen, Landmark, Search, FileText, 
  ArrowRightLeft, RefreshCw, CheckCircle, PlusCircle, AlertCircle, 
  Trash2, HelpCircle, Printer, Sparkles, RotateCcw, Sliders, X, Check,
  ChevronDown, ArrowUpRight, ArrowDownLeft
} from "lucide-react";
import { BankOperationsEngine, BankStatementStatus, ReconciliationMethod } from "../lib/bank-engine";

interface BankOperationsProps {
  isDarkMode: boolean;
  showNotification: (text: string, type?: "success" | "error" | "info") => void;
  onBack: () => void;
}

const engine = new BankOperationsEngine();

export default function BankOperations({ isDarkMode, showNotification, onBack }: BankOperationsProps) {
  const [activeTab, setActiveTab] = useState<"transfers" | "reconciliation" | "history" | "report">("reconciliation");
  const [showFriendlyGuide, setShowFriendlyGuide] = useState(true);

  // Core Data State
  const [transfers, setTransfers] = useState(engine.getTransfers());
  const [statements, setStatements] = useState(engine.getStatements());
  const [ledgerLines, setLedgerLines] = useState(engine.getLedgerLines());
  const [reconciliations, setReconciliations] = useState(engine.getReconciliations());

  // Filters and selections
  const [selectedBank, setSelectedBank] = useState("Bank_Mellat");
  const [searchStmt, setSearchStmt] = useState("");
  const [searchLedger, setSearchLedger] = useState("");

  // Interactive selection state for manual reconciliation
  const [selectedStmtId, setSelectedStmtId] = useState<string | null>(null);
  const [selectedLedgId, setSelectedLedgId] = useState<string | null>(null);

  // Transfers Form State
  const [newTransfer, setNewTransfer] = useState({
    sourceBank: "", destBank: "", amount: "", trackingNum: "", description: ""
  });

  // Custom Item Forms State
  const [showAddCustomLedger, setShowAddCustomLedger] = useState(false);
  const [newLedgerItem, setNewLedgerItem] = useState({
    debit: "", credit: "", description: "", docNumber: ""
  });

  const [showAddCustomStatement, setShowAddCustomStatement] = useState(false);
  const [newStatementItem, setNewStatementItem] = useState({
    debit: "", credit: "", description: "", docNumber: "", balance: ""
  });

  // Custom adjustment modal state (adjusting a statement item)
  const [adjustingItem, setAdjustingItem] = useState<any | null>(null);
  const [adjustForm, setAdjustForm] = useState({
    description: "", docNumber: ""
  });

  // CSV paste input state
  const [showCsvImporter, setShowCsvImporter] = useState(false);
  const [csvText, setCsvText] = useState("");

  const loadData = () => {
    setTransfers([...engine.getTransfers()]);
    setStatements([...engine.getStatements()]);
    setLedgerLines([...engine.getLedgerLines()]);
    setReconciliations([...engine.getReconciliations()]);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Sync state when selected bank changes
  useEffect(() => {
    setSelectedStmtId(null);
    setSelectedLedgId(null);
  }, [selectedBank]);

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
      newTransfer.description || "حواله حساب به حساب",
      newTransfer.trackingNum || "TRF-" + Math.floor(Math.random() * 10000)
    );

    if (result.success) {
      showNotification(`حواله با موفقیت ثبت شد. سند حسابداری (${result.voucherId}) صادر گردید.`, "success");
      setNewTransfer({ sourceBank: "", destBank: "", amount: "", trackingNum: "", description: "" });
      loadData();
    } else {
      showNotification(result.error || "خطا در ثبت حواله", "error");
    }
  };

  // Generate Bank Statement via Mock Import
  const handleImportMock = () => {
    const today = new Date().toISOString().split('T')[0];
    const mockLines = [
      { bank_account_id: selectedBank, transaction_date: today, document_number: "REF-105", description: "دریافت وجه پایا شرکت توسعه تجارت", debit: 0, credit: 18000000, running_balance: selectedBank === "Bank_Mellat" ? 183180000 : 75500000 },
      { bank_account_id: selectedBank, transaction_date: today, document_number: "FEE-902", description: "کارمزد پایا صادره", debit: 150000, credit: 0, running_balance: selectedBank === "Bank_Mellat" ? 183030000 : 75350000 }
    ];
    const count = engine.importStatementLines(mockLines);
    showNotification(`${count} سطر صورتحساب تراکنش بانکی جدید با موفقیت ایمپورت شد.`, "success");
    loadData();
  };

  // Import raw text or CSV
  const handleImportCSV = () => {
    if (!csvText.trim()) {
      showNotification("لطفاً متن تراکنش‌ها را وارد کنید.", "error");
      return;
    }

    try {
      // Expect format: docNumber, description, debit, credit, running_balance
      const lines = csvText.trim().split("\n");
      const importedLines: any[] = [];
      let baseBalance = selectedBank === "Bank_Mellat" ? 165180000 : 57500000;

      lines.forEach(line => {
        const parts = line.split(",").map(p => p.trim());
        if (parts.length >= 2) {
          const docNumber = parts[0] || "CSV-" + Math.floor(Math.random() * 10000);
          const description = parts[1];
          const debit = parts[2] ? Number(parts[2]) : 0;
          const credit = parts[3] ? Number(parts[3]) : 0;
          baseBalance = parts[4] ? Number(parts[4]) : (baseBalance + credit - debit);

          importedLines.push({
            bank_account_id: selectedBank,
            transaction_date: new Date().toISOString().split('T')[0],
            document_number: docNumber,
            description: description,
            debit: debit,
            credit: credit,
            running_balance: baseBalance
          });
        }
      });

      if (importedLines.length === 0) {
        throw new Error("داده معتبری استخراج نشد. الگو را چک کنید.");
      }

      const count = engine.importStatementLines(importedLines);
      showNotification(`${count} تراکنش با موفقیت از فایل متنی پارس و ایمپورت شدند.`, "success");
      setCsvText("");
      setShowCsvImporter(false);
      loadData();
    } catch (e: any) {
      showNotification("خطا در پارس اطلاعات: " + (e.message || "قالب نامعتبر است"), "error");
    }
  };

  // Trigger system automated matching with feedback
  const handleAutoReconcile = () => {
    const result = engine.autoReconcile(selectedBank);
    if (result.matchedCount > 0) {
      showNotification(result.messages[0], "success");
    } else {
      showNotification(result.messages[0], "info");
    }
    loadData();
  };

  // Execute manual match
  const handleManualReconcile = () => {
    if (!selectedStmtId || !selectedLedgId) return;
    
    const result = engine.manualReconcile(selectedBank, selectedStmtId, selectedLedgId);
    if (result.success) {
      showNotification("تطبیق دستی آرتیکل‌ها با موفقیت ثبت گردید.", "success");
      setSelectedStmtId(null);
      setSelectedLedgId(null);
      loadData();
    } else {
      showNotification(result.error || "خطا در تطبیق دستی ردیف‌ها", "error");
    }
  };

  // Rollback a reconciliation
  const handleUndoReconciliation = (id: string) => {
    const result = engine.unreconcile(id);
    if (result.success) {
      showNotification("تطبیق تراکنش با موفقیت ابطال و ردیف‌ها به حالت قلم باز بازگشتند.", "success");
      loadData();
    } else {
      showNotification(result.error || "خطا در لغو تطبیق", "error");
    }
  };

  // Quick book preset adjustment: bank fee
  const handleBookFee = (id: string) => {
    const result = engine.bookBankFee(id);
    if (result.success) {
      showNotification(`کارمزد بانکی با موفقیت ثبت شد و سند حسابداری مربوطه صادر گردید.`, "success");
      loadData();
    } else {
      showNotification(result.error || "خطا در ثبت کارمزد", "error");
    }
  };

  // Quick book preset adjustment: unknown credit deposit
  const handleBookUnknownDeposit = (id: string) => {
    const result = engine.bookUnknownDeposit(id);
    if (result.success) {
      showNotification(`سند شناسایی وصولی نامشخص در حساب موقت با موفقیت ثبت گردید.`, "success");
      loadData();
    } else {
      showNotification(result.error || "خطا در ثبت واریزی", "error");
    }
  };

  // Open custom adjustment sheet
  const handleOpenAdjustment = (stmtItem: any) => {
    setAdjustingItem(stmtItem);
    setAdjustForm({
      description: `اصلاح مغایرت - بابت ${stmtItem.description}`,
      docNumber: stmtItem.document_number || "ADJ-" + Math.floor(1000 + Math.random() * 9000)
    });
  };

  // Submit custom adjustment sheet (Creates equivalent ledger voucher & reconciles)
  const handleSubmitAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingItem) return;

    const amount = adjustingItem.credit > 0 ? adjustingItem.credit : adjustingItem.debit;
    const ledgerType = adjustingItem.credit > 0 ? 'DEBIT' : 'CREDIT'; // Deposit in bank = Debit in Ledger

    const result = engine.bookCustomAdjustment(
      selectedBank,
      adjustingItem.id,
      ledgerType,
      amount,
      adjustForm.description,
      adjustForm.docNumber
    );

    if (result.success) {
      showNotification(`سند اصلاحی با موفقیت صادر و تراکنش تطبیق یافت. شماره سند: ${result.voucherId}`, "success");
      setAdjustingItem(null);
      loadData();
    } else {
      showNotification(result.error || "خطا در ثبت سند اصلاحی", "error");
    }
  };

  // Handle adding custom ledger line manually
  const handleAddCustomLedger = (e: React.FormEvent) => {
    e.preventDefault();
    const debitVal = Number(newLedgerItem.debit) || 0;
    const creditVal = Number(newLedgerItem.credit) || 0;

    if (!newLedgerItem.description) {
      showNotification("لطفاً شرح سند را وارد کنید.", "error");
      return;
    }
    if (debitVal <= 0 && creditVal <= 0) {
      showNotification("یکی از مبالغ بدهکار یا بستانکار باید بزرگتر از صفر باشد.", "error");
      return;
    }

    engine.addLedgerLine({
      bank_account_id: selectedBank,
      date: new Date().toISOString().split('T')[0],
      document_number: newLedgerItem.docNumber || "JV-" + Math.floor(Math.random() * 10000),
      debit: debitVal,
      credit: creditVal,
      description: newLedgerItem.description
    });

    showNotification("آرتیکل جدید با موفقیت به دفتر معین بانک دفاتر اضافه شد.", "success");
    setNewLedgerItem({ debit: "", credit: "", description: "", docNumber: "" });
    setShowAddCustomLedger(false);
    loadData();
  };

  // Handle adding custom bank statement line manually
  const handleAddCustomStatement = (e: React.FormEvent) => {
    e.preventDefault();
    const debitVal = Number(newStatementItem.debit) || 0;
    const creditVal = Number(newStatementItem.credit) || 0;
    const balanceVal = Number(newStatementItem.balance) || 120000000;

    if (!newStatementItem.description) {
      showNotification("لطفاً شرح تراکنش را وارد کنید.", "error");
      return;
    }
    if (debitVal <= 0 && creditVal <= 0) {
      showNotification("یکی از مقادیر واریز یا برداشت باید پر شود.", "error");
      return;
    }

    engine.addStatementLine({
      bank_account_id: selectedBank,
      transaction_date: new Date().toISOString().split('T')[0],
      document_number: newStatementItem.docNumber || "TRX-" + Math.floor(Math.random() * 10000),
      description: newStatementItem.description,
      debit: debitVal,
      credit: creditVal,
      running_balance: balanceVal
    });

    showNotification("ردیف جدید صورتحساب با موفقیت به تاریخچه بانک اضافه گردید.", "success");
    setNewStatementItem({ debit: "", credit: "", description: "", docNumber: "", balance: "" });
    setShowAddCustomStatement(false);
    loadData();
  };

  // Memoized filters for UI representation
  const filteredStatements = useMemo(() => {
    return statements.filter(s => {
      if (s.bank_account_id !== selectedBank) return false;
      if (!searchStmt) return true;
      const term = searchStmt.toLowerCase();
      return (
        s.description.toLowerCase().includes(term) ||
        (s.document_number && s.document_number.toLowerCase().includes(term)) ||
        s.debit.toString().includes(term) ||
        s.credit.toString().includes(term)
      );
    });
  }, [statements, selectedBank, searchStmt]);

  const filteredLedger = useMemo(() => {
    return ledgerLines.filter(l => {
      if (l.bank_account_id !== selectedBank) return false;
      if (!searchLedger) return true;
      const term = searchLedger.toLowerCase();
      return (
        l.description.toLowerCase().includes(term) ||
        (l.document_number && l.document_number.toLowerCase().includes(term)) ||
        l.debit.toString().includes(term) ||
        l.credit.toString().includes(term)
      );
    });
  }, [ledgerLines, selectedBank, searchLedger]);

  // Compute stats report dynamically
  const reconReport = useMemo(() => {
    return engine.getReconciliationReport(selectedBank);
  }, [statements, ledgerLines, selectedBank]);

  // Compute matched pair list for the history tab
  const matchedPairs = useMemo(() => {
    return reconciliations
      .map(r => {
        const stmt = statements.find(s => s.id === r.bank_statement_line_id);
        const ledg = ledgerLines.find(l => l.id === r.journal_voucher_line_id);
        if (stmt && stmt.bank_account_id === selectedBank) {
          return {
            id: r.id,
            matched_by: r.matched_by,
            matched_at: r.matched_at,
            method: r.method,
            statementDesc: stmt.description,
            statementDoc: stmt.document_number,
            ledgerDesc: ledg?.description || "سند نامشخص",
            ledgerDoc: ledg?.document_number || "",
            amount: stmt.credit > 0 ? stmt.credit : stmt.debit,
            type: stmt.credit > 0 ? "واریز (بدهکار دفاتر)" : "برداشت (بستانکار دفاتر)"
          };
        }
        return null;
      })
      .filter(Boolean) as any[];
  }, [reconciliations, statements, ledgerLines, selectedBank]);

  // Printable action
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col max-w-7xl mx-auto w-full animate-fade-in" dir="rtl" id="bank-operations-container">
      {/* Print styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
          }
          #bank-operations-container {
            padding: 0 !important;
          }
        }
      `}</style>

      {/* Header and Back */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <h2 className={`text-xl font-black tracking-tight ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>
              سیستم عملیات بانکی و مغایرت‌گیری پیشرفته
            </h2>
            <button
              onClick={() => setShowFriendlyGuide(!showFriendlyGuide)}
              className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 flex items-center gap-1 hover:bg-indigo-500/20 transition-all"
            >
              <Info className="w-3.5 h-3.5" />
              {showFriendlyGuide ? "پنهان‌سازی راهنما" : "راهنمای حسابداری سیستم"}
            </button>
          </div>
          <p className={`text-xs mt-1.5 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
            انتقال وجوه، تطبیق هوشمند هوش مصنوعی/موتور قانون‌محور، صدور سند اصلاحی مغایرت، و تهیه صورت مغایرت بانکی استاندارد.
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
        <div className={`p-5 rounded-2xl border mb-6 transition-all print:hidden ${
          isDarkMode ? "bg-indigo-950/15 border-indigo-900/40 text-slate-200" : "bg-indigo-50/40 border-indigo-100 text-slate-800"
        }`}>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 shrink-0 mt-0.5">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-sm text-indigo-600 dark:text-indigo-400 mb-2">
                💡 راهنمای مغایرت‌گیری و صدور اسناد اصلاحی
              </h3>
              <p className="text-xs leading-relaxed opacity-95">
                تطبیق بانکی شامل مقایسه ردیف‌های صورتحساب بانک (ارائه شده توسط بانک) با دفتر معین حسابداری شرکت است.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                <div className={`p-3 rounded-xl border text-[11px] leading-relaxed ${isDarkMode ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-150"}`}>
                  <span className="font-bold text-indigo-500 block mb-1">۱. تطبیق خودکار (Rule-Based)</span>
                  سیستم به صورت خودکار مبالغ و شماره‌های پیگیری را با تلورانس ۳ روزه بررسی کرده و موارد معتبر را تراز می‌کند.
                </div>
                <div className={`p-3 rounded-xl border text-[11px] leading-relaxed ${isDarkMode ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-150"}`}>
                  <span className="font-bold text-emerald-500 block mb-1">۲. تطبیق دستی (Manual Match)</span>
                  در صورت تفاوت در شماره پیگیری، یک ردیف از بانک و یک ردیف از دفاتر با مبالغ یکسان را انتخاب کرده و دکمه تطبیق دستی را بزنید.
                </div>
                <div className={`p-3 rounded-xl border text-[11px] leading-relaxed ${isDarkMode ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-150"}`}>
                  <span className="font-bold text-amber-500 block mb-1">۳. صدور سند اصلاحی مغایرت</span>
                  برای اقلام باز بانک (مانند کارمزد یا واریزی نامشخص)، روی دکمه "اقلام باز" کلیک کنید تا سند حسابداری دوبل صادر و ثبت شود.
                </div>
                <div className={`p-3 rounded-xl border text-[11px] leading-relaxed ${isDarkMode ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-150"}`}>
                  <span className="font-bold text-purple-500 block mb-1">۴. گزارش صورت مغایرت بانکی</span>
                  تب صورت مغایرت بانکی را انتخاب کنید تا فرمول استاندارد حسابداری (تطبیق مانده بانک به مانده دفاتر) به همراه مابه‌التفاوت تولید شود.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bank selector and Live Balance Stats Dashboard */}
      <div className={`p-4 md:p-6 rounded-2xl border mb-6 flex flex-col gap-6 print:hidden ${
        isDarkMode ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200"
      }`}>
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Landmark className="w-5 h-5 text-indigo-500" />
            <span className="text-xs font-bold opacity-80">بانک فعال جهت عملیات:</span>
            <select 
              value={selectedBank} 
              onChange={e => setSelectedBank(e.target.value)} 
              className={`p-2.5 rounded-xl text-xs font-black border focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200"
              }`}
            >
              <option value="Bank_Mellat">بانک ملت - حساب جاری ۱۰۲۰</option>
              <option value="Bank_Saman">بانک سامان - حساب کوتاه‌مدت ۹۰۰</option>
            </select>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
            <button 
              onClick={() => setShowCsvImporter(!showCsvImporter)} 
              className="px-4 py-2.5 text-xs font-bold rounded-xl border bg-indigo-500/10 text-indigo-500 border-indigo-500/20 hover:bg-indigo-500/20 transition-all flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              آپلود یا کپی اکسل بانک
            </button>
            <button 
              onClick={handleImportMock} 
              className="px-4 py-2.5 text-xs font-bold rounded-xl border bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20 transition-all flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              بارگذاری تراکنش فرضی
            </button>
            <button 
              onClick={handleAutoReconcile} 
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm"
            >
              <Sparkles className="w-4 h-4" /> 
              تطبیق هوشمند بانک و دفاتر
            </button>
          </div>
        </div>

        {/* CSV Paste Panel */}
        {showCsvImporter && (
          <div className={`p-4 rounded-xl border ${isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-150"}`}>
            <h5 className="text-xs font-bold mb-2 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-indigo-500" />
              پارس کردن داده صورتحساب متنی (CSV)
            </h5>
            <p className="text-[10px] mb-3 opacity-70">
              هر خط را با فرمت روبرو بنویسید: <code className="font-mono px-1 bg-slate-500/10">شماره_پیگیری, شرح_تراکنش, برداشت, واریز, مانده_نهائی</code>
            </p>
            <textarea
              value={csvText}
              onChange={e => setCsvText(e.target.value)}
              placeholder="PAY-9902, واریز شرکت آلفا, 0, 42000000, 207180000&#10;FEE-881, کارمزد اس ام اس, 15000, 0, 207165000"
              rows={4}
              className={`w-full p-3 rounded-lg text-xs font-mono border focus:outline-none focus:ring-1 focus:ring-indigo-500 mb-3 ${
                isDarkMode ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-850"
              }`}
            />
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setShowCsvImporter(false)} 
                className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-400"
              >
                انصراف
              </button>
              <button 
                onClick={handleImportCSV} 
                className="px-4 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg"
              >
                پارس و پردازش صورتحساب
              </button>
            </div>
          </div>
        )}

        {/* Dashboard Indicator Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className={`p-4 rounded-xl border flex flex-col justify-between ${isDarkMode ? "bg-slate-950/40 border-slate-800/60" : "bg-slate-50/60 border-slate-150"}`}>
            <span className="text-[10px] opacity-70 block font-bold mb-1">مانده صورتحساب بانکی (فایل بانک)</span>
            <span className="text-base font-black text-blue-500 font-mono">
              {reconReport.bankStatementBalance.toLocaleString()} <span className="text-[10px] font-normal">ریال</span>
            </span>
          </div>

          <div className={`p-4 rounded-xl border flex flex-col justify-between ${isDarkMode ? "bg-slate-950/40 border-slate-800/60" : "bg-slate-50/60 border-slate-150"}`}>
            <span className="text-[10px] opacity-70 block font-bold mb-1">مانده معین بانک در دفاتر شرکت</span>
            <span className="text-base font-black text-indigo-500 font-mono">
              {reconReport.bookBalance.toLocaleString()} <span className="text-[10px] font-normal">ریال</span>
            </span>
          </div>

          <div className={`p-4 rounded-xl border flex flex-col justify-between ${isDarkMode ? "bg-slate-950/40 border-slate-800/60" : "bg-slate-50/60 border-slate-150"}`}>
            <span className="text-[10px] opacity-70 block font-bold mb-1">تعداد اقلام ترازنشده (باز)</span>
            <span className="text-base font-black text-rose-500 font-mono">
              {(reconReport.unbookedDeposits.length + reconReport.unbookedWithdrawals.length + reconReport.depositsInTransit.length + reconReport.outstandingCheques.length)} <span className="text-[10px] font-normal">ردیف</span>
            </span>
          </div>

          <div className={`p-4 rounded-xl border flex flex-col justify-between ${
            reconReport.isBalanced 
              ? (isDarkMode ? "bg-emerald-950/20 border-emerald-900/60" : "bg-emerald-50 border-emerald-100") 
              : (isDarkMode ? "bg-rose-950/20 border-rose-900/60" : "bg-rose-50 border-rose-100")
          }`}>
            <span className="text-[10px] opacity-70 block font-bold mb-1">وضعیت انطباق تراز نهایی</span>
            <div className="flex items-center gap-1.5">
              {reconReport.isBalanced ? (
                <>
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">کاملاً همخوان و تراز</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-rose-500" />
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-rose-600 dark:text-rose-400">دارای مغایرت حسابداری</span>
                    <span className="text-[9px] opacity-75 font-mono">اختلاف: {reconReport.difference.toLocaleString()} ریال</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6 print:hidden">
        <button
          onClick={() => setActiveTab("reconciliation")}
          className={`px-5 py-3 text-xs font-black border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "reconciliation"
              ? "border-indigo-500 text-indigo-500"
              : "border-transparent text-slate-500 hover:text-slate-400"
          }`}
        >
          <Sliders className="w-4 h-4" />
          تطبیق و تراز حساب‌ها (کارپوشه)
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-5 py-3 text-xs font-black border-b-2 transition-all flex items-center gap-2 relative ${
            activeTab === "history"
              ? "border-indigo-500 text-indigo-500"
              : "border-transparent text-slate-500 hover:text-slate-400"
          }`}
        >
          <CheckCircle className="w-4 h-4" />
          آرشیو اسناد تطبیق داده شده
          {matchedPairs.length > 0 && (
            <span className="absolute -top-1 -left-1 bg-indigo-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full scale-75">
              {matchedPairs.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("report")}
          className={`px-5 py-3 text-xs font-black border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "report"
              ? "border-indigo-500 text-indigo-500"
              : "border-transparent text-slate-500 hover:text-slate-400"
          }`}
        >
          <FileText className="w-4 h-4" />
          صورت مغایرت بانکی استاندارد
        </button>
        <button
          onClick={() => setActiveTab("transfers")}
          className={`px-5 py-3 text-xs font-black border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "transfers"
              ? "border-indigo-500 text-indigo-500"
              : "border-transparent text-slate-500 hover:text-slate-400"
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" />
          حواله بین بانکی جدید
        </button>
      </div>

      {/* Main Viewport */}
      {activeTab === "reconciliation" && (
        <div className="flex flex-col gap-6 print:hidden">
          {/* Manual Reconciliation Floating Action Bar */}
          {(selectedStmtId || selectedLedgId) && (
            <div className={`p-4 rounded-xl border flex flex-col md:flex-row items-center justify-between gap-4 animate-slide-in ${
              isDarkMode ? "bg-slate-900 border-indigo-900" : "bg-indigo-50/70 border-indigo-200"
            }`}>
              <div className="flex flex-col gap-1 w-full md:w-auto">
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4" /> تطبیق تعاملی (دستی) فعال است
                </span>
                <p className="text-[10px] opacity-80">
                  برای تراز دستی، یک ردیف از لیست صورتحساب بانکی (سمت راست) و یک ردیف از دفاتر (سمت چپ) انتخاب کنید. مبالغ باید دقیقاً همخوانی داشته باشند.
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded font-mono border ${selectedStmtId ? "bg-indigo-500/15 text-indigo-500 border-indigo-500/20" : "bg-slate-400/10 text-slate-400 border-dashed"}`}>
                    ردیف بانک: {selectedStmtId ? (statements.find(s => s.id === selectedStmtId)?.description || "انتخاب شده") : "منتظر انتخاب..."} 
                    {selectedStmtId && ` (${(statements.find(s => s.id === selectedStmtId)?.credit || statements.find(s => s.id === selectedStmtId)?.debit)?.toLocaleString()} ریال)`}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-mono border ${selectedLedgId ? "bg-indigo-500/15 text-indigo-500 border-indigo-500/20" : "bg-slate-400/10 text-slate-400 border-dashed"}`}>
                    ردیف دفاتر: {selectedLedgId ? (ledgerLines.find(l => l.id === selectedLedgId)?.description || "انتخاب شده") : "منتظر انتخاب..."}
                    {selectedLedgId && ` (${(ledgerLines.find(l => l.id === selectedLedgId)?.debit || ledgerLines.find(l => l.id === selectedLedgId)?.credit)?.toLocaleString()} ریال)`}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 self-end md:self-auto shrink-0">
                <button 
                  onClick={() => { setSelectedStmtId(null); setSelectedLedgId(null); }}
                  className="px-3 py-2 text-xs font-bold rounded-lg hover:bg-slate-500/10"
                >
                  لغو انتخاب‌ها
                </button>
                <button
                  disabled={!selectedStmtId || !selectedLedgId}
                  onClick={handleManualReconcile}
                  className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-md flex items-center gap-1.5 transition-all ${
                    (selectedStmtId && selectedLedgId) ? "bg-indigo-600 hover:bg-indigo-500 cursor-pointer" : "bg-slate-400 cursor-not-allowed opacity-50"
                  }`}
                >
                  <Check className="w-4 h-4" />
                  ثبت انطباق دستی دو آرتیکل
                </button>
              </div>
            </div>
          )}

          {/* Dual List Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* BANK STATEMENT COLUMN (RIGHT) */}
            <div className={`rounded-2xl border flex flex-col overflow-hidden ${isDarkMode ? "border-slate-800 bg-slate-900/40" : "border-slate-200 bg-white"}`}>
              <div className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b ${isDarkMode ? "border-slate-800 bg-slate-900/60" : "border-slate-100 bg-slate-50/50"}`}>
                <div>
                  <h4 className="font-black text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-500" />
                    ۱. اقلام صورتحساب بانک (ارائه شده از بانک)
                  </h4>
                  <p className="text-[10px] opacity-70 mt-0.5">برداشت‌ها (-) و واریزها (+) طبق تراکنش‌های واقعی ثبت شده در سرور بانک</p>
                </div>
                <button 
                  onClick={() => setShowAddCustomStatement(!showAddCustomStatement)}
                  className="text-[10px] font-bold px-2 py-1 border border-indigo-500/20 rounded-md bg-indigo-500/10 text-indigo-500 flex items-center gap-1 self-start"
                >
                  <PlusCircle className="w-3.5 h-3.5" /> افزودن سطر بانک
                </button>
              </div>

              {/* Add Custom Bank Statement Form */}
              {showAddCustomStatement && (
                <form onSubmit={handleAddCustomStatement} className={`p-4 border-b flex flex-col gap-3 ${isDarkMode ? "bg-slate-950/60 border-slate-850" : "bg-slate-50 border-slate-150"}`}>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold mb-1">مبلغ واریز به بانک (+)</label>
                      <input 
                        type="number" 
                        value={newStatementItem.credit} 
                        onChange={e => setNewStatementItem({...newStatementItem, credit: e.target.value, debit: ""})} 
                        className={`w-full p-2 text-xs rounded border ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`} 
                        placeholder="ریال"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold mb-1">مبلغ برداشت از بانک (-)</label>
                      <input 
                        type="number" 
                        value={newStatementItem.debit} 
                        onChange={e => setNewStatementItem({...newStatementItem, debit: e.target.value, credit: ""})} 
                        className={`w-full p-2 text-xs rounded border ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`} 
                        placeholder="ریال"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold mb-1">شرح تراکنش بانک *</label>
                      <input 
                        type="text" 
                        required
                        value={newStatementItem.description} 
                        onChange={e => setNewStatementItem({...newStatementItem, description: e.target.value})} 
                        className={`w-full p-2 text-xs rounded border ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`} 
                        placeholder="مثلا کارمزد دوره ای یا واریز مشتری"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold mb-1">شماره سند/پیگیری</label>
                      <input 
                        type="text" 
                        value={newStatementItem.docNumber} 
                        onChange={e => setNewStatementItem({...newStatementItem, docNumber: e.target.value})} 
                        className={`w-full p-2 text-xs rounded border ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`} 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold mb-1">مانده نهایی حساب بانکی پس از این تراکنش</label>
                    <input 
                      type="number" 
                      value={newStatementItem.balance} 
                      onChange={e => setNewStatementItem({...newStatementItem, balance: e.target.value})} 
                      className={`w-full p-2 text-xs rounded border ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`} 
                      placeholder="مانده معین بانک"
                    />
                  </div>
                  <div className="flex justify-end gap-2 mt-1">
                    <button type="button" onClick={() => setShowAddCustomStatement(false)} className="px-3 py-1 text-xs text-slate-500">انصراف</button>
                    <button type="submit" className="px-4 py-1 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded">ثبت تراکنش بانک</button>
                  </div>
                </form>
              )}

              {/* Statement Search and filter */}
              <div className={`p-3 border-b flex items-center gap-2 ${isDarkMode ? "border-slate-850" : "border-slate-100"}`}>
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute right-3 top-2.5 opacity-50" />
                  <input 
                    type="text" 
                    value={searchStmt}
                    onChange={e => setSearchStmt(e.target.value)}
                    placeholder="جستجو در شرح، سند یا مبلغ صورتحساب بانک..." 
                    className={`w-full pr-8 pl-3 py-1.5 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                      isDarkMode ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-700"
                    }`}
                  />
                </div>
                {searchStmt && (
                  <button onClick={() => setSearchStmt("")} className="text-slate-500 hover:text-slate-400 text-xs">حذف فیلتر</button>
                )}
              </div>

              {/* Statement List Items */}
              <div className="p-4 flex-1 flex flex-col gap-3 max-h-[500px] overflow-y-auto">
                {filteredStatements.length === 0 ? (
                  <div className="text-center text-xs opacity-50 py-12 flex flex-col items-center gap-2">
                    <FileText className="w-8 h-8 opacity-30" />
                    تراکنش منطبقی در صورتحساب این بانک یافت نشد.
                  </div>
                ) : (
                  filteredStatements.map(s => {
                    const isSelected = selectedStmtId === s.id;
                    const isMatched = s.reconciliation_status !== BankStatementStatus.UNMATCHED;
                    
                    return (
                      <div 
                        key={s.id} 
                        onClick={() => {
                          if (!isMatched) {
                            setSelectedStmtId(isSelected ? null : s.id);
                          }
                        }}
                        className={`p-3 rounded-xl border transition-all cursor-pointer relative ${
                          isMatched 
                            ? (isDarkMode ? "bg-emerald-950/20 border-emerald-900/50 opacity-80" : "bg-emerald-50/50 border-emerald-150 opacity-85") 
                            : isSelected 
                              ? "border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-500/5" 
                              : (isDarkMode ? "bg-slate-950 border-slate-800/80 hover:border-slate-700" : "bg-slate-50 border-slate-200 hover:border-slate-300")
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            {s.credit > 0 ? (
                              <span className="p-1 rounded bg-emerald-500/10 text-emerald-500"><ArrowDownLeft className="w-3.5 h-3.5" /></span>
                            ) : (
                              <span className="p-1 rounded bg-rose-500/10 text-rose-500"><ArrowUpRight className="w-3.5 h-3.5" /></span>
                            )}
                            <div>
                              <span className="font-bold text-xs block">{s.description}</span>
                              <span className="text-[9px] opacity-60 font-mono mt-0.5 block">تاریخ: {s.transaction_date}</span>
                            </div>
                          </div>
                          <span className={`text-xs font-black font-mono ${s.credit > 0 ? "text-emerald-500" : "text-rose-500"}`}>
                            {s.credit > 0 ? "+" : "-"}{(s.credit || s.debit).toLocaleString()} <span className="text-[9px] font-normal font-sans">ریال</span>
                          </span>
                        </div>

                        <div className="flex justify-between items-center mt-2.5 pt-2 border-t border-slate-200/10 border-dashed">
                          <div className="flex items-center gap-3">
                            <span className="text-[9px] opacity-70 font-mono">سند/پیگیری: {s.document_number || "بدون سند"}</span>
                            {s.running_balance > 0 && (
                              <span className="text-[9px] opacity-50 font-mono">مانده: {s.running_balance.toLocaleString()}</span>
                            )}
                          </div>

                          {isMatched ? (
                            <span className="text-[9px] font-black text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              تطبیق داده شد
                            </span>
                          ) : (
                            <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                              <span className="text-[9px] text-slate-500 font-bold bg-slate-500/10 px-1.5 py-0.5 rounded">قلم باز</span>
                              
                              {/* Book Adjustment Action Panel */}
                              {s.debit > 0 ? (
                                <button 
                                  onClick={() => handleBookFee(s.id)} 
                                  className="text-[9px] font-bold text-amber-500 bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/20 hover:bg-amber-500/20 transition-all"
                                  title="صدور خودکار سند هزینه کارمزد"
                                >
                                  کارمزد بانکی
                                </button>
                              ) : (
                                <button 
                                  onClick={() => handleBookUnknownDeposit(s.id)} 
                                  className="text-[9px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20 hover:bg-emerald-500/20 transition-all"
                                  title="صدور خودکار سند واریزی ناشناس به حساب معلق"
                                >
                                  وصولی ناشناس
                                </button>
                              )}
                              
                              <button 
                                onClick={() => handleOpenAdjustment(s)} 
                                className="text-[9px] font-bold text-indigo-500 bg-indigo-500/10 px-2 py-1 rounded-md border border-indigo-500/20 hover:bg-indigo-500/20 transition-all"
                                title="صدور سند حسابداری اصلاحی دلخواه برای این مبلغ"
                              >
                                سند اصلاحی مغایرت
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* SYSTEM LEDGER COLUMN (LEFT) */}
            <div className={`rounded-2xl border flex flex-col overflow-hidden ${isDarkMode ? "border-slate-800 bg-slate-900/40" : "border-slate-200 bg-white"}`}>
              <div className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b ${isDarkMode ? "border-slate-800 bg-slate-900/60" : "border-slate-100 bg-slate-50/50"}`}>
                <div>
                  <h4 className="font-black text-sm flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-indigo-500" />
                    ۲. دفتر معین بانک شرکت (طبق دفاتر حسابداری)
                  </h4>
                  <p className="text-[10px] opacity-70 mt-0.5">افزایش بانک بدهکار (+) و کاهش بستانکار (-) ثبت شده توسط حسابداران در سیستم</p>
                </div>
                <button 
                  onClick={() => setShowAddCustomLedger(!showAddCustomLedger)}
                  className="text-[10px] font-bold px-2 py-1 border border-indigo-500/20 rounded-md bg-indigo-500/10 text-indigo-500 flex items-center gap-1 self-start"
                >
                  <PlusCircle className="w-3.5 h-3.5" /> آرتیکل معین جدید
                </button>
              </div>

              {/* Add Custom Ledger Entry Form */}
              {showAddCustomLedger && (
                <form onSubmit={handleAddCustomLedger} className={`p-4 border-b flex flex-col gap-3 ${isDarkMode ? "bg-slate-950/60 border-slate-850" : "bg-slate-50 border-slate-150"}`}>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold mb-1">بدهکار (افزایش مانده دفاتر) (+)</label>
                      <input 
                        type="number" 
                        value={newLedgerItem.debit} 
                        onChange={e => setNewLedgerItem({...newLedgerItem, debit: e.target.value, credit: ""})} 
                        className={`w-full p-2 text-xs rounded border ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`} 
                        placeholder="ریال"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold mb-1">بستانکار (کاهش مانده دفاتر) (-)</label>
                      <input 
                        type="number" 
                        value={newLedgerItem.credit} 
                        onChange={e => setNewLedgerItem({...newLedgerItem, credit: e.target.value, debit: ""})} 
                        className={`w-full p-2 text-xs rounded border ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`} 
                        placeholder="ریال"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold mb-1">شرح آرتیکل دفاتر *</label>
                      <input 
                        type="text" 
                        required
                        value={newLedgerItem.description} 
                        onChange={e => setNewLedgerItem({...newLedgerItem, description: e.target.value})} 
                        className={`w-full p-2 text-xs rounded border ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`} 
                        placeholder="مثلا دریافت بابت فاکتور فروش یا چک دریافتی"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold mb-1">شماره سند</label>
                      <input 
                        type="text" 
                        value={newLedgerItem.docNumber} 
                        onChange={e => setNewLedgerItem({...newLedgerItem, docNumber: e.target.value})} 
                        className={`w-full p-2 text-xs rounded border ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`} 
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-1">
                    <button type="button" onClick={() => setShowAddCustomLedger(false)} className="px-3 py-1 text-xs text-slate-500">انصراف</button>
                    <button type="submit" className="px-4 py-1 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded">ثبت در معین دفاتر</button>
                  </div>
                </form>
              )}

              {/* Ledger Search and filter */}
              <div className={`p-3 border-b flex items-center gap-2 ${isDarkMode ? "border-slate-850" : "border-slate-100"}`}>
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute right-3 top-2.5 opacity-50" />
                  <input 
                    type="text" 
                    value={searchLedger}
                    onChange={e => setSearchLedger(e.target.value)}
                    placeholder="جستجو در شرح، سند یا مبالغ دفتر معین..." 
                    className={`w-full pr-8 pl-3 py-1.5 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                      isDarkMode ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-700"
                    }`}
                  />
                </div>
                {searchLedger && (
                  <button onClick={() => setSearchLedger("")} className="text-slate-500 hover:text-slate-400 text-xs">حذف فیلتر</button>
                )}
              </div>

              {/* Ledger List Items */}
              <div className="p-4 flex-1 flex flex-col gap-3 max-h-[500px] overflow-y-auto">
                {filteredLedger.length === 0 ? (
                  <div className="text-center text-xs opacity-50 py-12 flex flex-col items-center gap-2">
                    <Landmark className="w-8 h-8 opacity-30" />
                    آرتیکلی در معین دفاتر برای این بانک یافت نشد.
                  </div>
                ) : (
                  filteredLedger.map(l => {
                    const isSelected = selectedLedgId === l.id;
                    const isMatched = l.is_reconciled;
                    
                    return (
                      <div 
                        key={l.id} 
                        onClick={() => {
                          if (!isMatched) {
                            setSelectedLedgId(isSelected ? null : l.id);
                          }
                        }}
                        className={`p-3 rounded-xl border transition-all cursor-pointer relative ${
                          isMatched 
                            ? (isDarkMode ? "bg-emerald-950/20 border-emerald-900/50 opacity-80" : "bg-emerald-50/50 border-emerald-150 opacity-85") 
                            : isSelected 
                              ? "border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-500/5" 
                              : (isDarkMode ? "bg-slate-950 border-slate-800/80 hover:border-slate-700" : "bg-slate-50 border-slate-200 hover:border-slate-300")
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            {l.debit > 0 ? (
                              <span className="p-1 rounded bg-emerald-500/10 text-emerald-500"><ArrowDownLeft className="w-3.5 h-3.5" /></span>
                            ) : (
                              <span className="p-1 rounded bg-rose-500/10 text-rose-500"><ArrowUpRight className="w-3.5 h-3.5" /></span>
                            )}
                            <div>
                              <span className="font-bold text-xs block">{l.description}</span>
                              <span className="text-[9px] opacity-60 font-mono mt-0.5 block">تاریخ دفاتر: {l.date}</span>
                            </div>
                          </div>
                          {/* Debit in ledger is deposit (+), credit is withdrawal (-) */}
                          <span className={`text-xs font-black font-mono ${l.debit > 0 ? "text-emerald-500" : "text-rose-500"}`}>
                            {l.debit > 0 ? "+" : "-"}{(l.debit || l.credit).toLocaleString()} <span className="text-[9px] font-normal font-sans">ریال</span>
                          </span>
                        </div>

                        <div className="flex justify-between items-center mt-2.5 pt-2 border-t border-slate-200/10 border-dashed">
                          <span className="text-[9px] opacity-70 font-mono">سند روزنامه: {l.document_number || "بدون سند"}</span>
                          
                          {isMatched ? (
                            <span className="text-[9px] font-black text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              تطبیق دفاتر شد
                            </span>
                          ) : (
                            <span className="text-[9px] font-black text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              قلم مغایرت باز دفاتر
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Reconciliations Archive (Matched Items History) */}
      {activeTab === "history" && (
        <div className="flex flex-col gap-4 print:hidden">
          <div className={`p-4 rounded-xl border flex items-center justify-between ${
            isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
          }`}>
            <div>
              <h4 className="font-bold text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                تاریخچه و آرشیو اقلام تراز شده
              </h4>
              <p className="text-[10px] opacity-70 mt-0.5">در این قسمت کلیه تطبیق‌های ثبت‌شده (سیستم یا کاربر) فهرست شده و قابلیت لغو (Rollback) وجود دارد.</p>
            </div>
            <span className="text-xs font-bold font-mono px-2.5 py-1 rounded bg-slate-500/10">
              کل موارد تراز شده: {matchedPairs.length} جفت تراکنش
            </span>
          </div>

          {matchedPairs.length === 0 ? (
            <div className={`p-12 text-center text-xs opacity-50 rounded-2xl border ${isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
              هنوز هیچ تراکنشی مغایرت‌گیری و تراز نشده است. از دکمه تطبیق خودکار یا دستی استفاده کنید.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {matchedPairs.map(p => (
                <div key={p.id} className={`p-4 rounded-xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
                  isDarkMode ? "bg-slate-950 border-slate-850" : "bg-white border-slate-150"
                }`}>
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Bank Side info */}
                    <div className="border-l border-dashed pl-4 border-slate-500/20">
                      <span className="text-[9px] font-bold text-blue-500 block mb-0.5">ردیف صورتحساب بانک:</span>
                      <p className="text-xs font-bold">{p.statementDesc}</p>
                      <span className="text-[10px] opacity-60 font-mono">سند بانک: {p.statementDoc || "بدون شماره"}</span>
                    </div>

                    {/* Book Side info */}
                    <div>
                      <span className="text-[9px] font-bold text-indigo-500 block mb-0.5">ردیف سند معین دفاتر:</span>
                      <p className="text-xs font-bold">{p.ledgerDesc}</p>
                      <span className="text-[10px] opacity-60 font-mono">شماره سند: {p.ledgerDoc || "بدون شماره"}</span>
                    </div>
                  </div>

                  {/* Matching Meta Info and Action */}
                  <div className="flex items-center gap-4 shrink-0 self-end md:self-auto pt-2 md:pt-0 border-t md:border-t-0 border-slate-500/10 w-full md:w-auto justify-between md:justify-end">
                    <div className="text-right">
                      <span className="text-sm font-black font-mono block text-emerald-500">{p.amount.toLocaleString()} ریال</span>
                      <span className="text-[9px] opacity-50 font-mono block">روش: {p.method === ReconciliationMethod.AUTO ? "موتور هوشمند" : "دستی"} ({p.matched_by})</span>
                    </div>

                    <button 
                      onClick={() => handleUndoReconciliation(p.id)}
                      className="p-2 rounded-lg text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 transition-all"
                      title="لغو تطبیق و برگشت به اقلام باز"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PRINTABLE BANK RECONCILIATION STATEMENT (STANDARD REPORT) */}
      {activeTab === "report" && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-end gap-2.5 print:hidden">
            <button 
              onClick={handlePrint}
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Printer className="w-4 h-4" />
              چاپ و خروجی PDF صورت مغایرت
            </button>
          </div>

          {/* Statement Sheet Area */}
          <div 
            id="print-area" 
            className={`p-6 md:p-8 rounded-2xl border text-slate-850 bg-white flex flex-col gap-6 shadow-sm border-slate-300`}
            style={{ color: '#1e293b' }} // Forced contrast light background for printable document
          >
            {/* Report Header Logo & Title */}
            <div className="flex justify-between items-center border-b-2 border-slate-900 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded bg-slate-900 text-white font-black text-xs font-mono">ERP</div>
                <div>
                  <h3 className="font-black text-base text-slate-900">شرکت خدمات مالی و حسابداری پارس</h3>
                  <p className="text-[10px] text-slate-500 font-bold">بخش حسابداری و خزانه‌داری • سامانه کنترل داخلی</p>
                </div>
              </div>
              <div className="text-left font-mono text-[10px] text-slate-600 flex flex-col gap-1">
                <span>شماره گزارش: BR-{selectedBank}-{Math.floor(1000 + Math.random() * 9000)}</span>
                <span>تاریخ گزارش: {new Date().toLocaleDateString('fa-IR')}</span>
                <span>کاربر صادرکننده: سیستم معین بانک</span>
              </div>
            </div>

            {/* Title Badge */}
            <div className="text-center my-2">
              <h2 className="text-lg font-black text-slate-900 underline underline-offset-8">
                صورت مغایرت بانکی استاندارد (تطبیق مانده دفاتر به بانک)
              </h2>
              <p className="text-xs font-bold text-slate-600 mt-2">
                مربوط به: {engine.getBankNamePersian(selectedBank)}
              </p>
            </div>

            {/* Part 1: Start with Bank Statement Balance */}
            <div className="flex flex-col border border-slate-300 rounded-lg overflow-hidden">
              <div className="bg-slate-100 p-2.5 text-xs font-bold border-b border-slate-300 text-slate-900 flex justify-between items-center">
                <span>بخش اول: تعدیل مانده طبق صورتحساب بانک</span>
                <span className="font-mono">Adjusting Bank Statement</span>
              </div>
              
              <table className="w-full text-right text-xs">
                <tbody>
                  <tr className="border-b border-slate-200">
                    <td className="p-3 font-bold">مانده نهایی طبق صورتحساب دریافتی از بانک (A)</td>
                    <td className="p-3 font-mono text-left font-black" style={{ minWidth: '150px' }}>
                      {reconReport.bankStatementBalance.toLocaleString()} ریال
                    </td>
                  </tr>

                  {/* Deposits in transit */}
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <td className="p-3 flex flex-col gap-1">
                      <div className="font-bold text-slate-900">اضافه می‌شود: وجوه بین راهی (واریزی‌های ثبت شده در دفاتر که هنوز به بانک ننشسته‌اند)</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {reconReport.depositsInTransit.length === 0 ? "• هیچ موردی یافت نشد" : 
                          reconReport.depositsInTransit.map((l: any) => `• ${l.description} (سند: ${l.document_number}) - ${l.debit.toLocaleString()} ریال`).join(' | ')
                        }
                      </div>
                    </td>
                    <td className="p-3 font-mono text-left text-emerald-600 font-bold">
                      +{reconReport.totalDepositsInTransit.toLocaleString()} ریال
                    </td>
                  </tr>

                  {/* Outstanding Cheques */}
                  <tr className="border-b border-slate-200">
                    <td className="p-3 flex flex-col gap-1">
                      <div className="font-bold text-slate-900">کسر می‌شود: چک‌های عهده (چک‌های صادره شرکت که توسط دارنده وصول نشده‌اند)</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {reconReport.outstandingCheques.length === 0 ? "• هیچ موردی یافت نشد" : 
                          reconReport.outstandingCheques.map((l: any) => `• ${l.description} (شماره: ${l.document_number}) - ${l.credit.toLocaleString()} ریال`).join(' | ')
                        }
                      </div>
                    </td>
                    <td className="p-3 font-mono text-left text-rose-600 font-bold">
                      -{reconReport.totalOutstandingCheques.toLocaleString()} ریال
                    </td>
                  </tr>

                  <tr className="bg-slate-100/50 font-black">
                    <td className="p-3 text-slate-900">مانده تعدیل شده صورتحساب بانک (A + اضافه - کسر)</td>
                    <td className="p-3 font-mono text-left text-blue-600 text-sm">
                      {reconReport.adjustedBankBalance.toLocaleString()} ریال
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Part 2: Start with Books Ledger Balance */}
            <div className="flex flex-col border border-slate-300 rounded-lg overflow-hidden">
              <div className="bg-slate-100 p-2.5 text-xs font-bold border-b border-slate-300 text-slate-900 flex justify-between items-center">
                <span>بخش دوم: تعدیل مانده طبق دفاتر شرکت</span>
                <span className="font-mono">Adjusting Company Books</span>
              </div>
              
              <table className="w-full text-right text-xs">
                <tbody>
                  <tr className="border-b border-slate-200">
                    <td className="p-3 font-bold">مانده نهایی دفاتر حسابداری (دفتر معین بانک) (B)</td>
                    <td className="p-3 font-mono text-left font-black" style={{ minWidth: '150px' }}>
                      {reconReport.bookBalance.toLocaleString()} ریال
                    </td>
                  </tr>

                  {/* Unbooked deposits */}
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <td className="p-3 flex flex-col gap-1">
                      <div className="font-bold text-slate-900">اضافه می‌شود: واریزی‌های بانک که در دفاتر شرکت ثبت نشده‌اند (مانند حواله‌های ناشناس وصولی)</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {reconReport.unbookedDeposits.length === 0 ? "• هیچ موردی یافت نشد (تمام واریزی‌های بانک ثبت دفاتر شده‌اند)" : 
                          reconReport.unbookedDeposits.map((s: any) => `• ${s.description} (سند: ${s.document_number}) - ${s.credit.toLocaleString()} ریال`).join(' | ')
                        }
                      </div>
                    </td>
                    <td className="p-3 font-mono text-left text-emerald-600 font-bold">
                      +{reconReport.totalUnbookedDeposits.toLocaleString()} ریال
                    </td>
                  </tr>

                  {/* Unbooked charges / fees */}
                  <tr className="border-b border-slate-200">
                    <td className="p-3 flex flex-col gap-1">
                      <div className="font-bold text-slate-900">کسر می‌شود: برداشت‌های بانک که در دفاتر ثبت نشده‌اند (مانند کارمزدهای کسر شده بانک یا اقساط)</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {reconReport.unbookedWithdrawals.length === 0 ? "• هیچ موردی یافت نشد (تمام کارمزدها ثبت دفاتر شده‌اند)" : 
                          reconReport.unbookedWithdrawals.map((s: any) => `• ${s.description} - ${s.debit.toLocaleString()} ریال`).join(' | ')
                        }
                      </div>
                    </td>
                    <td className="p-3 font-mono text-left text-rose-600 font-bold">
                      -{reconReport.totalUnbookedWithdrawals.toLocaleString()} ریال
                    </td>
                  </tr>

                  <tr className="bg-slate-100/50 font-black">
                    <td className="p-3 text-slate-900">مانده تعدیل شده دفاتر شرکت (B + اضافه - کسر)</td>
                    <td className="p-3 font-mono text-left text-indigo-600 text-sm">
                      {reconReport.adjustedBookBalance.toLocaleString()} ریال
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Audit validation message inside PDF */}
            <div className={`p-4 rounded-xl border flex items-center justify-between mt-2 ${
              reconReport.isBalanced 
                ? "bg-emerald-50 border-emerald-300 text-emerald-900" 
                : "bg-rose-50 border-rose-300 text-rose-900"
            }`}>
              <div className="flex items-center gap-2">
                {reconReport.isBalanced ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-black text-xs block">تاییدیه کنترل داخلی مغایرت: حساب تراز است</span>
                      <p className="text-[10px] opacity-85 mt-0.5">هیچ مغایرت کنترل نشده‌ای بین بانک و دفاتر حسابداری وجود ندارد. سیستم در توازن کامل است.</p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    <div>
                      <span className="font-black text-xs block">عدم توازن صورت مغایرت: اختلاف غیرمعمول</span>
                      <p className="text-[10px] opacity-85 mt-0.5">به میزان {reconReport.difference.toLocaleString()} ریال مابه‌التفاوت وجود دارد. لطفاً با صدور اسناد اصلاحی یا تطبیق مجدد حساب را اصلاح فرمایید.</p>
                    </div>
                  </>
                )}
              </div>
              <span className="text-[10px] font-mono opacity-80">سامانه حسابداری دوبل هوشمند</span>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-3 gap-6 text-center mt-12 pt-8 border-t border-slate-300 text-xs">
              <div>
                <span className="font-bold block text-slate-600 mb-8">تهیه کننده (خزانه‌دار)</span>
                <div className="border-b border-slate-300 mx-auto w-2/3 h-6"></div>
              </div>
              <div>
                <span className="font-bold block text-slate-600 mb-8">رئیس حسابداری مالی</span>
                <div className="border-b border-slate-300 mx-auto w-2/3 h-6"></div>
              </div>
              <div>
                <span className="font-bold block text-slate-600 mb-8">مدیر مالی و بازرس کنترل داخلی</span>
                <div className="border-b border-slate-300 mx-auto w-2/3 h-6"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interbank Transfer Tab */}
      {activeTab === "transfers" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:hidden">
          <div className={`p-6 rounded-2xl border ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} lg:col-span-1`}>
            <h4 className="font-black text-sm mb-4 flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-indigo-500" /> ثبت حواله بین بانکی جدید
            </h4>
            <form onSubmit={handleTransfer} className="flex flex-col gap-4">
              <div>
                <label className="block text-[11px] font-bold mb-1.5 opacity-80">از بانک (حساب مبدا) *</label>
                <select 
                  value={newTransfer.sourceBank} 
                  onChange={e => setNewTransfer({...newTransfer, sourceBank: e.target.value})} 
                  className={`w-full p-2.5 rounded-lg text-xs font-bold border focus:ring-1 focus:ring-indigo-500 ${isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200"}`}
                  required
                >
                   <option value="">انتخاب حساب مبدا...</option>
                   <option value="Bank_Mellat">بانک ملت - حساب جاری ۱۰۲۰</option>
                   <option value="Bank_Saman">بانک سامان - حساب کوتاه‌مدت ۹۰۰</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold mb-1.5 opacity-80">به بانک (حساب مقصد) *</label>
                <select 
                  value={newTransfer.destBank} 
                  onChange={e => setNewTransfer({...newTransfer, destBank: e.target.value})} 
                  className={`w-full p-2.5 rounded-lg text-xs font-bold border focus:ring-1 focus:ring-indigo-500 ${isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200"}`}
                  required
                >
                   <option value="">انتخاب حساب مقصد...</option>
                   <option value="Bank_Mellat">بانک ملت - حساب جاری ۱۰۲۰</option>
                   <option value="Bank_Saman">بانک سامان - حساب کوتاه‌مدت ۹۰۰</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold mb-1.5 opacity-80">مبلغ انتقال وجه (ریال) *</label>
                <input 
                  type="number" 
                  value={newTransfer.amount} 
                  onChange={e => setNewTransfer({...newTransfer, amount: e.target.value})} 
                  className={`w-full p-2.5 rounded-lg text-xs font-mono border focus:ring-1 focus:ring-indigo-500 ${isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200"}`} 
                  placeholder="مثلا 15,000,000"
                  required 
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold mb-1.5 opacity-80">شماره ارجاع / پیگیری</label>
                <input 
                  type="text" 
                  value={newTransfer.trackingNum} 
                  onChange={e => setNewTransfer({...newTransfer, trackingNum: e.target.value})} 
                  className={`w-full p-2.5 rounded-lg text-xs font-mono border focus:ring-1 focus:ring-indigo-500 ${isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200"}`} 
                  placeholder="مثال: REF-1092"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold mb-1.5 opacity-80">توضیحات و شرح آرتیکل</label>
                <input 
                  type="text" 
                  value={newTransfer.description} 
                  onChange={e => setNewTransfer({...newTransfer, description: e.target.value})} 
                  className={`w-full p-2.5 rounded-lg text-xs border focus:ring-1 focus:ring-indigo-500 ${isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200"}`} 
                  placeholder="شرح بابت..."
                />
              </div>
              <button 
                type="submit" 
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl text-xs font-black mt-2 shadow-sm transition-all"
              >
                ثبت حواله و صدور سند دوبل (JV)
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className={`p-4 rounded-xl border flex items-center justify-between ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded bg-blue-500/10 text-blue-500"><Landmark className="w-4 h-4" /></div>
                <h4 className="font-bold text-sm">لیست حواله‌ها و جابجایی‌های دوره‌ای</h4>
              </div>
              <span className="text-[10px] opacity-70 font-mono">Total Transfers: {transfers.length}</span>
            </div>

            {transfers.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-xs opacity-50 py-12 border border-dashed rounded-2xl">
                هیچ تراکنش انتقال حساب به حسابی در این دوره مالی ثبت نشده است.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {transfers.map(t => (
                  <div key={t.id} className={`p-4 rounded-xl border flex flex-col gap-2.5 ${isDarkMode ? "bg-slate-950 border-slate-850" : "bg-slate-50 border-slate-200"}`}>
                     <div className="flex items-center justify-between">
                        <span className="font-black text-xs">{t.description || "انتقال وجه بین بانکی"}</span>
                        <span className="text-indigo-500 font-black text-xs font-mono">{t.amount.toLocaleString()} ریال</span>
                     </div>
                     <div className="flex items-center justify-between text-[10px] opacity-75 pt-1.5 border-t border-slate-200/10 border-dashed">
                       <div className="flex items-center gap-3">
                         <span className="font-bold text-blue-500">مبدا: {engine.getBankNamePersian(t.source_bank_account_id)}</span>
                         <span className="font-bold text-emerald-500">مقصد: {engine.getBankNamePersian(t.destination_bank_account_id)}</span>
                       </div>
                       <span className="font-mono bg-slate-500/10 px-2 py-0.5 rounded text-[9px]">سند حسابداری: {t.journal_voucher_id}</span>
                     </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Custom Adjustment Modal Sheet */}
      {adjustingItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in print:hidden">
          <div className={`w-full max-w-md rounded-2xl p-6 border shadow-2xl ${
            isDarkMode ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-900"
          }`}>
            <div className="flex justify-between items-start mb-4">
              <h4 className="font-black text-sm flex items-center gap-1.5 text-indigo-500">
                <Sliders className="w-5 h-5" />
                صدور سند اصلاحی مغایرت بانکی
              </h4>
              <button onClick={() => setAdjustingItem(null)} className="p-1 rounded-lg hover:bg-slate-500/10 text-slate-500">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className={`p-3 rounded-lg text-xs mb-4 font-mono ${isDarkMode ? "bg-slate-950" : "bg-slate-50"}`}>
              <div className="flex justify-between mb-1.5">
                <span className="opacity-70">مبلغ تراکنش بانک:</span>
                <span className="font-black">{(adjustingItem.credit || adjustingItem.debit).toLocaleString()} ریال</span>
              </div>
              <div className="flex justify-between mb-1.5">
                <span className="opacity-70">نوع تراکنش:</span>
                <span className={adjustingItem.credit > 0 ? "text-emerald-500 font-bold" : "text-rose-500 font-bold"}>
                  {adjustingItem.credit > 0 ? "واریزی به بانک (بدهکار معین)" : "برداشت از بانک (بستانکار معین)"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-70">شرح پیش‌فرض بانک:</span>
                <span className="font-bold truncate max-w-[200px]">{adjustingItem.description}</span>
              </div>
            </div>

            <form onSubmit={handleSubmitAdjustment} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold mb-1.5">شرح سند دفاتر شرکت *</label>
                <textarea 
                  value={adjustForm.description} 
                  onChange={e => setAdjustForm({...adjustForm, description: e.target.value})}
                  className={`w-full p-2.5 rounded-lg text-xs border focus:ring-1 focus:ring-indigo-500 ${
                    isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"
                  }`}
                  rows={2}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1.5">شماره سند روزنامه / پیگیری</label>
                <input 
                  type="text" 
                  value={adjustForm.docNumber} 
                  onChange={e => setAdjustForm({...adjustForm, docNumber: e.target.value})}
                  className={`w-full p-2.5 rounded-lg text-xs font-mono border focus:ring-1 focus:ring-indigo-500 ${
                    isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"
                  }`}
                />
              </div>

              <div className="text-[10px] opacity-75 text-amber-500 leading-relaxed bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
                ⚠️ پس از فشردن دکمه صدور سند، یک آرتیکل معین حسابداری جدید ثبت شده و بلافاصله با ردیف صورتحساب تطبیق می‌یابد.
              </div>

              <div className="flex justify-end gap-2.5 mt-2">
                <button 
                  type="button" 
                  onClick={() => setAdjustingItem(null)}
                  className="px-4 py-2 text-xs font-bold rounded-xl hover:bg-slate-500/10"
                >
                  انصراف
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-sm"
                >
                  صدور سند و تطبیق نهایی
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
