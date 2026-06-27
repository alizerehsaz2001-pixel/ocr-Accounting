import React, { useState, useEffect, useMemo, useRef } from "react";
import { 
  Plus, 
  Save, 
  Trash2, 
  Lock, 
  FileText, 
  CheckCircle, 
  RefreshCw, 
  AlertCircle, 
  Edit, 
  Eye, 
  Search, 
  Filter, 
  ArrowLeftRight, 
  Check, 
  ChevronDown, 
  AlertTriangle, 
  Sparkles, 
  PlusCircle,
  HelpCircle,
  BookOpen,
  Info,
  Copy,
  Printer,
  Download
} from "lucide-react";
import { 
  VoucherHeader, 
  VoucherLine, 
  VoucherStatus, 
  validateVoucher, 
  renumberVouchers,
  Account,
  AccountLevel,
  DetailedAccount,
  AccountDetailedLink
} from "../lib/accounting";
import { motion, AnimatePresence } from "motion/react";

// Pre-populate rich default accounts and links if they don't exist in localStorage
const DEFAULT_ACCOUNTS: Account[] = [
  { id: "a1", code: "1", name: "دارایی‌ها", level: AccountLevel.GROUP, parent_id: null },
  { id: "a2", code: "2", name: "بدهی‌ها", level: AccountLevel.GROUP, parent_id: null },
  { id: "a3", code: "3", name: "حقوق صاحبان سهام", level: AccountLevel.GROUP, parent_id: null },
  { id: "a4", code: "4", name: "درآمدها و فروش", level: AccountLevel.GROUP, parent_id: null },
  { id: "a5", code: "5", name: "هزینه‌ها", level: AccountLevel.GROUP, parent_id: null },
  
  { id: "a10", code: "10", name: "دارایی‌های جاری", level: AccountLevel.LEDGER, parent_id: "a1" },
  { id: "a11", code: "11", name: "دارایی‌های ثابت", level: AccountLevel.LEDGER, parent_id: "a1" },
  { id: "a20", code: "20", name: "بدهی‌های جاری", level: AccountLevel.LEDGER, parent_id: "a2" },
  { id: "a50", code: "50", name: "هزینه‌های اداری و عمومی", level: AccountLevel.LEDGER, parent_id: "a5" },
  
  { id: "a1010", code: "1010", name: "موجودی نقد و بانک", level: AccountLevel.SUBLEDGER, parent_id: "a10" },
  { id: "a1020", code: "1020", name: "حساب‌های دریافتنی تجاری", level: AccountLevel.SUBLEDGER, parent_id: "a10" },
  { id: "a2010", code: "2010", name: "حساب‌های پرداختنی تجاری", level: AccountLevel.SUBLEDGER, parent_id: "a20" },
  { id: "a5010", code: "5010", name: "هزینه ملزومات اداری", level: AccountLevel.SUBLEDGER, parent_id: "a50" },
  { id: "a5020", code: "5020", name: "هزینه حقوق و دستمزد پرسنل", level: AccountLevel.SUBLEDGER, parent_id: "a50" },
];

const DEFAULT_DETAILED_ACCOUNTS: DetailedAccount[] = [
  { id: "d1", code: "10001", name: "بانک سامان - حساب جاری مرکزی", type: "Bank" },
  { id: "d2", code: "10002", name: "بانک ملت - شعبه کارآفرینان", type: "Bank" },
  { id: "d3", code: "20001", name: "شرکت آفرینش‌های نوین آلفا", type: "Customer" },
  { id: "d4", code: "30001", name: "بازرگانی توسعه تجهیز آریا", type: "Supplier" },
  { id: "d5", code: "40001", name: "جناب آقای مهندس رسولی", type: "Employee" },
  { id: "d6", code: "40002", name: "سرکار خانم صادقی (حسابدار)", type: "Employee" },
];

const DEFAULT_LINKS: AccountDetailedLink[] = [
  { account_id: "a1010", detailed_account_id: "d1" }, // موجودی نقد و بانک -> بانک سامان
  { account_id: "a1010", detailed_account_id: "d2" }, // موجودی نقد و بانک -> بانک ملت
  { account_id: "a1020", detailed_account_id: "d3" }, // دریافتنی تجاری -> شرکت آلفا
  { account_id: "a1020", detailed_account_id: "d5" }, // دریافتنی تجاری -> جناب رسولی
  { account_id: "a2010", detailed_account_id: "d4" }, // پرداختنی تجاری -> توسعه تجهیز آریا
  { account_id: "a5020", detailed_account_id: "d5" }, // هزینه حقوق -> جناب رسولی
  { account_id: "a5020", detailed_account_id: "d6" }, // هزینه حقوق -> سرکار خانم صادقی
];

// Initial Vouchers Data (with Local Storage support)
const INITIAL_VOUCHERS: VoucherHeader[] = [
  {
    id: "v101",
    voucher_number: 1,
    date: new Date().toISOString().split("T")[0],
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    status: VoucherStatus.PERMANENT,
    description: "بابت خرید ملزومات اداری دوره‌ای و پرداخت الکترونیکی از حساب بانک سامان",
    user_id: "u1"
  },
  {
    id: "v102",
    voucher_number: 2,
    date: new Date().toISOString().split("T")[0],
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    status: VoucherStatus.TEMPORARY,
    description: "بابت شناسایی و پرداخت علی‌الحساب حقوق اسفند ماه پرسنل اداری",
    user_id: "u1"
  }
];

const INITIAL_LINES: VoucherLine[] = [
  { id: "l1", voucher_id: "v101", account_id: "a5010", debit: 5400000, credit: 0, description: "خرید زونکن، خودکار و کاغذ آ۴ شرکت" },
  { id: "l2", voucher_id: "v101", account_id: "a1010", detailed_account_id: "d1", debit: 0, credit: 5400000, description: "تسویه از بانک سامان - حواله پایا" },
  { id: "l3", voucher_id: "v102", account_id: "a5020", detailed_account_id: "d5", debit: 120000000, credit: 0, description: "حقوق اساسی جناب آقای مهندس رسولی" },
  { id: "l4", voucher_id: "v102", account_id: "a1010", detailed_account_id: "d2", debit: 0, credit: 120000000, description: "واریز به حساب بانک ملت ایشان" },
];

interface VoucherModuleProps {
  isDarkMode: boolean;
  onBack: () => void;
  showNotification: (text: string, type?: "success" | "error" | "info") => void;
}

export default function VoucherModule({ isDarkMode, onBack, showNotification }: VoucherModuleProps) {
  // Persistence hooks for accounts & linkages (integrated with ChartOfAccounts key structure)
  const [accounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem("chart_of_accounts");
    return saved ? JSON.parse(saved) : DEFAULT_ACCOUNTS;
  });
  const [detailedAccounts] = useState<DetailedAccount[]>(() => {
    const saved = localStorage.getItem("detailed_accounts");
    return saved ? JSON.parse(saved) : DEFAULT_DETAILED_ACCOUNTS;
  });
  const [links] = useState<AccountDetailedLink[]>(() => {
    const saved = localStorage.getItem("account_detailed_links");
    return saved ? JSON.parse(saved) : DEFAULT_LINKS;
  });

  // Voucher persistence
  const [vouchers, setVouchers] = useState<VoucherHeader[]>(() => {
    const saved = localStorage.getItem("vouchers_data");
    return saved ? JSON.parse(saved) : INITIAL_VOUCHERS;
  });
  const [allLines, setAllLines] = useState<VoucherLine[]>(() => {
    const saved = localStorage.getItem("voucher_lines_data");
    return saved ? JSON.parse(saved) : INITIAL_LINES;
  });

  // Write changes back to localStorage
  useEffect(() => {
    localStorage.setItem("vouchers_data", JSON.stringify(vouchers));
  }, [vouchers]);

  useEffect(() => {
    localStorage.setItem("voucher_lines_data", JSON.stringify(allLines));
  }, [allLines]);

  // View state: 'list' | 'edit'
  const [viewState, setViewState] = useState<"list" | "edit">("list");
  const [showFriendlyVoucherGuide, setShowFriendlyVoucherGuide] = useState(true);
  
  // Search & Filters state (Voucher List)
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [dateFilter, setDateFilter] = useState("");

  // Editor states
  const [header, setHeader] = useState<VoucherHeader | null>(null);
  const [lines, setLines] = useState<VoucherLine[]>([]);

  // Searchable dropdown states inside editing grid
  const [activeCellFocus, setActiveCellFocus] = useState<{ lineId: string; field: "account_id" | "detailed_account_id" } | null>(null);
  const [dropdownSearch, setDropdownSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Advanced features states
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printVoucherId, setPrintVoucherId] = useState<string | null>(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [templateAmount, setTemplateAmount] = useState<string>("");

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveCellFocus(null);
        setDropdownSearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter subledgers
  const subledgerAccounts = useMemo(() => {
    return accounts.filter(a => a.level === AccountLevel.SUBLEDGER);
  }, [accounts]);

  // Calculations for dashboard counters
  const dashboardStats = useMemo(() => {
    const totalCount = vouchers.length;
    const draftCount = vouchers.filter(v => v.status === VoucherStatus.DRAFT).length;
    const tempCount = vouchers.filter(v => v.status === VoucherStatus.TEMPORARY).length;
    const permanentCount = vouchers.filter(v => v.status === VoucherStatus.PERMANENT).length;
    
    // Sum of all debit transactions (representing total book turnover)
    const totalTurnover = allLines.reduce((sum, line) => {
      // Find voucher header to ensure we only sum valid saved vouchers
      const vHeader = vouchers.find(v => v.id === line.voucher_id);
      if (vHeader) {
        return sum + (Number(line.debit) || 0);
      }
      return sum;
    }, 0);

    // Balance check
    let systemIsBalanced = true;
    for (const v of vouchers) {
      const vLines = allLines.filter(l => l.voucher_id === v.id);
      const dr = vLines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
      const cr = vLines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
      if (Math.abs(dr - cr) > 0.01 && v.status !== VoucherStatus.DRAFT) {
        systemIsBalanced = false;
        break;
      }
    }

    return { totalCount, draftCount, tempCount, permanentCount, totalTurnover, systemIsBalanced };
  }, [vouchers, allLines]);

  const VOUCHER_TEMPLATES = useMemo(() => [
    {
      id: "t1",
      name: "خرید ملزومات اداری و دفتری (نقدی)",
      description: "بابت خرید اقلام مصرفی اداری از محل حساب جاری بانک سامان",
      lines: [
        { account_id: "a5010", detailed_account_id: "", debit: 1, credit: 0, description: "خرید نوشت‌افزار و لوازم مصرفی دفتر مرکزی" },
        { account_id: "a1010", detailed_account_id: "d1", debit: 0, credit: 1, description: "پرداخت از حساب جاری بانک سامان" }
      ]
    },
    {
      id: "t2",
      name: "مساعده/علی‌الحساب حقوق پرسنل (واریز بانک)",
      description: "واریز علی‌الحساب یا مساعده ماهیانه پرسنل از بانک ملت",
      lines: [
        { account_id: "a5020", detailed_account_id: "d5", debit: 1, credit: 0, description: "مساعده حقوق جناب آقای رسولی" },
        { account_id: "a1010", detailed_account_id: "d2", debit: 0, credit: 1, description: "تسویه نقدی علی‌الحساب از بانک ملت" }
      ]
    },
    {
      id: "t3",
      name: "وصول مطالبات تجاری (دریافت وجه از مشتری)",
      description: "وصول نقدی مطالبات و تسویه بدهی خریداران به حساب بانک سامان",
      lines: [
        { account_id: "a1010", detailed_account_id: "d1", debit: 1, credit: 0, description: "وصول مطالبات و واریز به بانک سامان" },
        { account_id: "a1020", detailed_account_id: "d3", debit: 0, credit: 1, description: "تسویه بدهی سررسید شده شرکت آلفا" }
      ]
    },
    {
      id: "t4",
      name: "خرید اعتباری کالا و خدمات (بستانکاران)",
      description: "خرید دارایی یا هزینه‌های اداری به صورت مدت‌دار و اعتباری",
      lines: [
        { account_id: "a5010", detailed_account_id: "", debit: 1, credit: 0, description: "خرید تجهیزات و ملزومات اداری به صورت اعتباری" },
        { account_id: "a2010", detailed_account_id: "d4", debit: 0, credit: 1, description: "خرید اعتباری از شرکت توسعه تجهیز آریا" }
      ]
    }
  ], []);

  // Handle actions
  const handleCreateNew = () => {
    const nextNumber = vouchers.length > 0 ? Math.max(...vouchers.map(v => v.voucher_number)) + 1 : 1;
    const newHeader: VoucherHeader = {
      id: `v_${Date.now()}`,
      voucher_number: nextNumber,
      date: new Date().toISOString().split("T")[0],
      created_at: new Date().toISOString(),
      status: VoucherStatus.DRAFT,
      description: "",
      user_id: "u1"
    };
    setHeader(newHeader);
    // Start with 2 empty lines for user convenience
    setLines([
      { id: `l_${Date.now()}_1`, voucher_id: newHeader.id, account_id: "", debit: 0, credit: 0, description: "" },
      { id: `l_${Date.now()}_2`, voucher_id: newHeader.id, account_id: "", debit: 0, credit: 0, description: "" }
    ]);
    setViewState("edit");
    showNotification("سند حسابداری جدید ایجاد گردید.", "info");
  };

  const handleEdit = (voucherId: string) => {
    const v = vouchers.find(v => v.id === voucherId);
    if (v) {
      setHeader({ ...v });
      setLines(allLines.filter(l => l.voucher_id === voucherId));
      setViewState("edit");
    }
  };

  const handleDelete = (voucherId: string) => {
    const v = vouchers.find(v => v.id === voucherId);
    if (v?.status === VoucherStatus.PERMANENT) {
      showNotification("خطا: امکان حذف سند قطعی و قفل شده وجود ندارد.", "error");
      return;
    }
    setVouchers(prev => prev.filter(item => item.id !== voucherId));
    setAllLines(prev => prev.filter(l => l.voucher_id !== voucherId));
    showNotification("سند حسابداری مربوطه با موفقیت حذف گردید.", "success");
  };

  const handleClone = (voucherId: string) => {
    const origHeader = vouchers.find(v => v.id === voucherId);
    if (!origHeader) return;
    const origLines = allLines.filter(l => l.voucher_id === voucherId);

    const nextNumber = vouchers.length > 0 ? Math.max(...vouchers.map(v => v.voucher_number)) + 1 : 1;
    const newVoucherId = `v_clone_${Date.now()}`;
    
    const clonedHeader: VoucherHeader = {
      ...origHeader,
      id: newVoucherId,
      voucher_number: nextNumber,
      date: new Date().toISOString().split("T")[0],
      created_at: new Date().toISOString(),
      status: VoucherStatus.DRAFT,
      description: `کپی از سند شماره ${origHeader.voucher_number} - ${origHeader.description}`
    };

    const clonedLines = origLines.map((l, idx) => ({
      ...l,
      id: `l_clone_${Date.now()}_${idx}`,
      voucher_id: newVoucherId,
    }));

    setVouchers(prev => [...prev, clonedHeader]);
    setAllLines(prev => [...prev, ...clonedLines]);
    
    setHeader(clonedHeader);
    setLines(clonedLines);
    setViewState("edit");
    showNotification(`سند شماره ${origHeader.voucher_number} شبیه‌سازی گردید. لطفاً آن را ذخیره نمایید.`, "success");
  };

  const handleApplyTemplate = (templateId: string, amountStr: string) => {
    const amount = parseFloat(amountStr) || 0;
    if (amount <= 0) {
      showNotification("لطفاً مبلغ معتبری وارد نمایید.", "error");
      return;
    }
    const template = VOUCHER_TEMPLATES.find(t => t.id === templateId);
    if (!template || !header) return;

    const newLines = template.lines.map((l, idx) => ({
      id: `l_tmpl_${Date.now()}_${idx}`,
      voucher_id: header.id,
      account_id: l.account_id,
      detailed_account_id: l.detailed_account_id || "",
      debit: l.debit > 0 ? amount : 0,
      credit: l.credit > 0 ? amount : 0,
      description: l.description
    }));

    setLines(newLines);
    setHeader(prev => prev ? { ...prev, description: template.description } : null);
    setIsTemplateModalOpen(false);
    setTemplateAmount("");
    showNotification("سند الگو با موفقیت روی این سند اعمال گردید.", "success");
  };

  const handleExportToCSV = (voucherId?: string) => {
    let csvLines: {
      voucher_num: number;
      date: string;
      voucher_desc: string;
      acc_code: string;
      acc_name: string;
      det_code: string;
      det_name: string;
      debit: number;
      credit: number;
      line_desc: string;
    }[] = [];

    const targetVouchers = voucherId 
      ? vouchers.filter(v => v.id === voucherId) 
       : vouchers;

    targetVouchers.forEach(v => {
      const vLines = allLines.filter(l => l.voucher_id === v.id);
      vLines.forEach(l => {
        const acc = accounts.find(a => a.id === l.account_id);
        const det = detailedAccounts.find(d => d.id === l.detailed_account_id);
        csvLines.push({
          voucher_num: v.voucher_number,
          date: v.date,
          voucher_desc: v.description,
          acc_code: acc?.code || "",
          acc_name: acc?.name || "",
          det_code: det?.code || "",
          det_name: det?.name || "",
          debit: Number(l.debit) || 0,
          credit: Number(l.credit) || 0,
          line_desc: l.description || ""
        });
      });
    });

    const headers = [
      "شماره سند",
      "تاریخ ثبت",
      "شرح کلی سند",
      "کد معین",
      "نام معین",
      "کد تفصیلی",
      "نام تفصیلی",
      "بدهکار (ریال)",
      "بستانکار (ریال)",
      "شرح آرتیکل"
    ];

    let csvContent = "\uFEFF"; // BOM
    csvContent += headers.join(",") + "\n";

    csvLines.forEach(row => {
      const line = [
        `"${row.voucher_num}"`,
        `"${row.date}"`,
        `"${row.voucher_desc.replace(/"/g, '""')}"`,
        `"${row.acc_code}"`,
        `"${row.acc_name.replace(/"/g, '""')}"`,
        `"${row.det_code}"`,
        `"${row.det_name.replace(/"/g, '""')}"`,
        row.debit,
        row.credit,
        `"${row.line_desc.replace(/"/g, '""')}"`
      ];
      csvContent += line.join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", voucherId ? `voucher_#${voucherId}.csv` : "all_accounting_vouchers.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification("خروجی اکسل (CSV) با کدگذاری استاندارد فارسی با موفقیت بارگیری شد.", "success");
  };

  const handleParseBulkLines = () => {
    if (!importText.trim()) return;
    const rows = importText.split("\n");
    const parsedLines: VoucherLine[] = [];
    let successCount = 0;
    let failedCount = 0;

    rows.forEach((row, index) => {
      if (!row.trim()) return;
      let parts: string[] = [];
      if (row.includes("\t")) {
        parts = row.split("\t");
      } else if (row.includes(";")) {
        parts = row.split(";");
      } else {
        parts = row.split(",");
      }

      let accCode = (parts[0] || "").trim();
      let detCode = "";
      let debitVal = 0;
      let creditVal = 0;
      let desc = "";

      if (parts.length === 3) {
        debitVal = parseFloat((parts[1] || "").trim()) || 0;
        creditVal = parseFloat((parts[2] || "").trim()) || 0;
      } else if (parts.length === 4) {
        const secondIsNumber = !isNaN(Number((parts[1] || "").trim()));
        if (secondIsNumber) {
          debitVal = parseFloat((parts[1] || "").trim()) || 0;
          creditVal = parseFloat((parts[2] || "").trim()) || 0;
          desc = (parts[3] || "").trim();
        } else {
          detCode = (parts[1] || "").trim();
          debitVal = parseFloat((parts[2] || "").trim()) || 0;
          creditVal = parseFloat((parts[3] || "").trim()) || 0;
        }
      } else if (parts.length >= 5) {
        detCode = (parts[1] || "").trim();
        debitVal = parseFloat((parts[2] || "").trim()) || 0;
        creditVal = parseFloat((parts[3] || "").trim()) || 0;
        desc = parts.slice(4).join(" ").trim();
      }

      accCode = accCode.replace(/^["']|["']$/g, "");
      detCode = detCode.replace(/^["']|["']$/g, "");
      desc = desc.replace(/^["']|["']$/g, "");

      const matchedAcc = accounts.find(a => a.code === accCode && a.level === AccountLevel.SUBLEDGER);
      const matchedDet = detCode ? detailedAccounts.find(d => d.code === detCode) : undefined;

      if (matchedAcc) {
        parsedLines.push({
          id: `l_bulk_${Date.now()}_${index}`,
          voucher_id: header?.id || "",
          account_id: matchedAcc.id,
          detailed_account_id: matchedDet?.id || "",
          debit: debitVal,
          credit: creditVal,
          description: desc || header?.description || "ثبت گروهی آرتیکل"
        });
        successCount++;
      } else {
        failedCount++;
      }
    });

    if (parsedLines.length > 0) {
      const filteredCurrentLines = lines.filter(l => l.account_id !== "" || l.debit > 0 || l.credit > 0);
      setLines([...filteredCurrentLines, ...parsedLines]);
      showNotification(`واردسازی گروهی موفق! تعداد ${successCount} سطر اضافه شد. ${failedCount > 0 ? `تعداد ${failedCount} سطر به دلیل عدم تطابق کد معین نادیده گرفته شد.` : ""}`, "success");
      setIsBulkImportOpen(false);
      setImportText("");
    } else {
      showNotification("خطا: هیچ کد معین معتبری یافت نشد. لطفاً ساختار ورودی را بررسی کنید.", "error");
    }
  };

  const handleTriggerRenumber = () => {
    if (vouchers.length === 0) {
      showNotification("هیچ سندی برای شماره‌گذاری مجدد وجود ندارد.", "info");
      return;
    }
    const updated = renumberVouchers(vouchers);
    setVouchers(updated);
    showNotification("الگوریتم شماره‌گذاری مجدد با موفقیت اجرا شد. اسناد موقت مرتب گردیدند.", "success");
  };

  // Editor Calculations
  const totalDebit = lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
  const totalCredit = lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
  const imbalanceAmount = Math.abs(totalDebit - totalCredit);
  const isBalanced = imbalanceAmount === 0;
  const isLocked = header?.status === VoucherStatus.PERMANENT;

  // Real-time logical validations list
  const currentValidationIssues = useMemo(() => {
    const issues: string[] = [];
    if (!header) return issues;

    if (!header.description.trim()) {
      issues.push("توضیحات کلی (شرح کلی سند) وارد نشده است.");
    }

    if (lines.length < 2) {
      issues.push("سند حسابداری باید حداقل شامل دو آرتیکل (سطر) باشد.");
    }

    lines.forEach((l, idx) => {
      const rowNum = idx + 1;
      if (!l.account_id) {
        issues.push(`ردیف ${rowNum}: حساب معین مشخص نشده است.`);
      } else {
        // Check if this subledger has required detailed accounts linked, but none is selected
        const hasLinkedDetailed = links.some(link => link.account_id === l.account_id);
        if (hasLinkedDetailed && !l.detailed_account_id) {
          issues.push(`ردیف ${rowNum}: برای این حساب معین، انتخاب حساب تفصیلی شناور الزامی است.`);
        } else if (l.detailed_account_id) {
          const isAllowed = links.some(link => link.account_id === l.account_id && link.detailed_account_id === l.detailed_account_id);
          if (!isAllowed) {
            issues.push(`ردیف ${rowNum}: حساب تفصیلی شناور انتخاب شده با حساب معین همخوانی ندارد (عدم همخوانی در جدول واسط).`);
          }
        }
      }

      if (l.debit < 0 || l.credit < 0) {
        issues.push(`ردیف ${rowNum}: مبلغ ثبت شده نمی‌تواند منفی باشد.`);
      }

      if (l.debit > 0 && l.credit > 0) {
        issues.push(`ردیف ${rowNum}: تداخل مبالغ! یک سطر نمی‌تواند همزمان هم بدهکار و هم بستانکار باشد.`);
      }

      if ((l.debit || 0) === 0 && (l.credit || 0) === 0) {
        issues.push(`ردیف ${rowNum}: مبلغ سطر صفر است. هر سطر باید دارای بدهکار یا بستانکار باشد.`);
      }
    });

    if (!isBalanced && header.status !== VoucherStatus.DRAFT) {
      issues.push(`عدم توازن مالی! اختلاف بین جمع بدهکار و بستانکار ${imbalanceAmount.toLocaleString()} ریال است.`);
    }

    return issues;
  }, [header, lines, isBalanced, imbalanceAmount, links]);

  // Insert a Balancing Line Generator Helper
  const handleInsertBalancingLine = () => {
    if (!header || isLocked || isBalanced) return;
    
    const targetAmount = imbalanceAmount;
    const isDebitNeeded = totalCredit > totalDebit;

    const newLine: VoucherLine = {
      id: `l_${Date.now()}`,
      voucher_id: header.id,
      account_id: "",
      debit: isDebitNeeded ? targetAmount : 0,
      credit: isDebitNeeded ? 0 : targetAmount,
      description: `بابت موازنه و تراز کردن سند شماره ${header.voucher_number}`
    };

    setLines([...lines, newLine]);
    showNotification("سطر موازنه با موفقیت به انتهای سند افزوده شد.", "success");
  };

  const performBackendValidation = async (): Promise<{ success: boolean; valid: boolean; errors: string[] }> => {
    try {
      const response = await fetch("/api/vouchers/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines, links })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        return { success: true, valid: data.valid, errors: data.errors };
      }
      return { success: false, valid: false, errors: [data.error || "خطایی در اعتبارسنجی رخ داده است."] };
    } catch (err: any) {
      console.error("Backend validation failed:", err);
      return { success: false, valid: false, errors: ["خطا در برقراری ارتباط با سرور برای صحت‌سنجی"] };
    }
  };

  const handleSave = async () => {
    if (!header) return;
    if (isLocked) {
      showNotification("سند قطعی شده قابل ویرایش نیست.", "error");
      return;
    }

    // Call backend validation to check subledger-detailed mapping compatibility
    const backendResult = await performBackendValidation();
    if (!backendResult.valid && backendResult.errors.length > 0) {
      showNotification(`خطای انطباق تفصیلی و معین (تأیید سرور): ${backendResult.errors[0]}`, "error");
      return;
    }

    // Force validations before changing status to Temporary
    let finalStatus = header.status;
    if (finalStatus === VoucherStatus.DRAFT) {
      // If draft is balanced and valid, elevate to Temporary automatically to keep books correct
      if (isBalanced && lines.length >= 2 && currentValidationIssues.filter(i => !i.includes("توضیحات کلی")).length === 0) {
        finalStatus = VoucherStatus.TEMPORARY;
      }
    } else {
      // If they want temporary but has severe issues
      const severeIssues = currentValidationIssues.filter(i => !i.includes("توضیحات کلی"));
      if (severeIssues.length > 0) {
        showNotification(`خطای ساختاری: ${severeIssues[0]}`, "error");
        return;
      }
    }

    const updatedHeader = { ...header, status: finalStatus };

    setVouchers(prev => {
      const exists = prev.find(v => v.id === updatedHeader.id);
      if (exists) {
        return prev.map(v => v.id === updatedHeader.id ? updatedHeader : v);
      }
      return [...prev, updatedHeader];
    });

    setAllLines(prev => {
      const filtered = prev.filter(l => l.voucher_id !== updatedHeader.id);
      return [...filtered, ...lines];
    });

    showNotification(`سند شماره ${updatedHeader.voucher_number} در وضعیت «${
      finalStatus === VoucherStatus.TEMPORARY ? "موقت" : "پیش‌نویس"
    }» با موفقیت ذخیره گردید.`, "success");
    setViewState("list");
  };

  const handlePostToPermanent = async () => {
    if (!header) return;
    if (!isBalanced) {
      showNotification("خطا: امکان قطعی و قفل کردن سند ناتراز وجود ندارد.", "error");
      return;
    }
    if (currentValidationIssues.length > 0) {
      showNotification(`خطای اعتبارسنجی: ${currentValidationIssues[0]}`, "error");
      return;
    }

    // Call backend validation before locking
    const backendResult = await performBackendValidation();
    if (!backendResult.valid && backendResult.errors.length > 0) {
      showNotification(`خطای انطباق تفصیلی و معین (تأیید نهایی سرور): ${backendResult.errors[0]}`, "error");
      return;
    }

    const updatedHeader = { ...header, status: VoucherStatus.PERMANENT };
    setHeader(updatedHeader);

    setVouchers(prev => prev.map(v => v.id === updatedHeader.id ? updatedHeader : v));
    setAllLines(prev => {
      const filtered = prev.filter(l => l.voucher_id !== updatedHeader.id);
      return [...filtered, ...lines];
    });

    showNotification("سند حسابداری با موفقیت قطعی (قفل) گردید و دیگر قابل ویرایش یا تغییر نیست.", "success");
    setViewState("list");
  };

  // Line modification functions
  const updateLineValue = (lineId: string, field: keyof VoucherLine, value: any) => {
    if (isLocked) return;
    setLines(prev => prev.map(l => {
      if (l.id === lineId) {
        const updated = { ...l, [field]: value };
        // Mutual exclusivity of debit & credit
        if (field === "debit" && Number(value) > 0) {
          updated.credit = 0;
        } else if (field === "credit" && Number(value) > 0) {
          updated.debit = 0;
        }
        return updated;
      }
      return l;
    }));
  };

  const addLineRow = () => {
    if (!header || isLocked) return;
    const newLine: VoucherLine = {
      id: `l_${Date.now()}`,
      voucher_id: header.id,
      account_id: "",
      debit: 0,
      credit: 0,
      description: lines[lines.length - 1]?.description || header.description || ""
    };
    setLines([...lines, newLine]);
  };

  const removeLineRow = (lineId: string) => {
    if (isLocked) return;
    if (lines.length <= 1) {
      showNotification("حداقل وجود یک سطر آرتیکل در پیش‌نویس الزامی است.", "error");
      return;
    }
    setLines(prev => prev.filter(l => l.id !== lineId));
  };

  // Filtered voucher headers list based on search/status filters
  const filteredVouchers = useMemo(() => {
    return vouchers.filter(v => {
      // Search matches description or voucher number
      const matchesSearch = v.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            v.voucher_number.toString().includes(searchTerm);
      
      const matchesStatus = statusFilter === "ALL" || v.status === statusFilter;
      const matchesDate = !dateFilter || v.date === dateFilter;

      return matchesSearch && matchesStatus && matchesDate;
    }).sort((a, b) => b.voucher_number - a.voucher_number); // Newest first
  }, [vouchers, searchTerm, statusFilter, dateFilter]);

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col max-w-7xl mx-auto w-full" dir="rtl">
      
      {/* 1. LIST VIEW */}
      {viewState === "list" && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-6"
        >
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className={`text-xl font-black tracking-tight flex items-center gap-2 ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>
                  <FileText className="w-5 h-5 text-indigo-500" />
                  صدور و مدیریت اسناد حسابداری
                </h2>
                <button
                  onClick={() => setShowFriendlyVoucherGuide(!showFriendlyVoucherGuide)}
                  className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 flex items-center gap-1 hover:bg-indigo-500/20 transition-all"
                >
                  <Info className="w-3 h-3" />
                  {showFriendlyVoucherGuide ? "پنهان‌سازی آموزش ساده" : "آموزش ساده به زبان خودمانی"}
                </button>
              </div>
              <p className={`text-xs mt-1.5 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                ثبت اسناد دوبل حسابداری، برقراری توازن تراز مالی و قطعی‌سازی شماره عطف بر اساس دفتر کل روزنامه
              </p>
            </div>
            <div className="flex items-center gap-2.5 self-end md:self-auto">
              <button 
                onClick={onBack} 
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                  isDarkMode 
                    ? "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800" 
                    : "bg-white border-slate-250 text-slate-700 hover:bg-slate-50 shadow-xs"
                }`}
              >
                بازگشت به منو
              </button>
              <button 
                onClick={handleTriggerRenumber} 
                title="مرتب‌سازی اسناد بر اساس تاریخ و شماره‌گذاری مجدد ترتیبی بدون ایجاد شکاف"
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                  isDarkMode 
                    ? "bg-slate-900/60 border-slate-800 text-amber-400 hover:bg-slate-800" 
                    : "bg-amber-50/50 border-amber-200 text-amber-700 hover:bg-amber-50"
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
                مرتب‌سازی و رفع شکاف شماره‌ها
              </button>
              <button 
                onClick={() => handleExportToCSV()} 
                title="بارگیری کل اسناد حسابداری دوره جاری در قالب فایل اکسل CSV"
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                  isDarkMode 
                    ? "bg-slate-900/60 border-slate-800 text-emerald-400 hover:bg-slate-800" 
                    : "bg-emerald-50/50 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                }`}
              >
                <Save className="w-3.5 h-3.5 text-emerald-500" />
                خروجی کل اسناد (CSV)
              </button>
              <button 
                onClick={handleCreateNew} 
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-indigo-500/20 flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> صدور سند جدید
              </button>
            </div>
          </div>

          {/* Friendly Voucher Guide Block */}
          {showFriendlyVoucherGuide && (
            <div className={`p-5 rounded-2xl border transition-all ${
              isDarkMode ? "bg-indigo-950/15 border-indigo-900/40 text-slate-200" : "bg-indigo-50/40 border-indigo-100 text-slate-800"
            }`}>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 shrink-0 mt-0.5">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-sm text-indigo-600 dark:text-indigo-400 mb-2 flex items-center gap-1.5">
                    💡 آموزش به زبان خیلی ساده: «سند حسابداری» چیست؟
                  </h3>
                  <p className="text-xs leading-relaxed opacity-90 mb-3">
                    هر زمان که پولی در شرکت یا مغازه‌تان تکان می‌خورد (خرید، فروش، دریافت طلب، پرداخت قسط)، باید آن را مثل یک <strong>«داستان دو طرفه»</strong> در یک سند یادداشت کنید. این سند دو ستون اصلی دارد:
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div className={`p-3.5 rounded-xl border ${isDarkMode ? "bg-slate-950/40 border-slate-850" : "bg-white border-slate-100"}`}>
                      <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 mb-2">🔵 بدهکار (دریافت‌کننده یا دارنده)</span>
                      <p className="text-[11px] leading-relaxed opacity-85">
                        هرگاه <strong>دارایی شما زیاد شود</strong> (پول بیاید توی کارت بانکتان، وسیله‌ای بخرید)، یا <strong>هزینه‌ای بکنید</strong> (اجاره بدهید، قبض آب بدهید)، آن را در ستون <strong>بدهکار</strong> می‌نویسیم.
                      </p>
                    </div>

                    <div className={`p-3.5 rounded-xl border ${isDarkMode ? "bg-slate-950/40 border-slate-850" : "bg-white border-slate-100"}`}>
                      <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-500 mb-2">🔴 بستانکار (دهنده یا بدهکار شونده)</span>
                      <p className="text-[11px] leading-relaxed opacity-85">
                        هرگاه <strong>دارایی شما کم شود</strong> (از عابربانک پول بکشید، از حساب شرکت به کسی پول بدهید)، یا <strong>درآمدی کسب کنید</strong>، آن را در ستون <strong>بستانکار</strong> می‌نویسیم.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/15 text-[11px] leading-relaxed">
                    <strong>⚖️ قانون طلایی تراز:</strong> در حسابداری دوبل، همیشه مجموع مبالغ ستون بدهکار (آبی) باید <strong>دقیقاً برابر</strong> با ستون بستانکار (قرمز) باشد! مثلاً اگر ۵ میلیون تومان برای شرکت صندلی خریدید (بدهکار)، باید دقیقاً ۵ میلیون تومان هم از حسابتان خارج شده باشد (بستانکار). این برابری نشان‌دهنده صحت و درستی حساب‌کتاب شماست.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3-Card Analytics Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className={`p-5 rounded-2xl border flex items-center justify-between shadow-xs ${
              isDarkMode ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-200"
            }`}>
              <div className="text-right">
                <span className={`text-[10px] font-bold ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>کل اسناد دوره جاری</span>
                <div className={`text-xl font-black mt-1 ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>
                  {dashboardStats.totalCount} <span className="text-xs font-medium text-slate-500">سند</span>
                </div>
                <div className="flex gap-2 mt-1.5 text-[9px] font-bold">
                  <span className="text-emerald-500">{dashboardStats.permanentCount} قطعی</span>
                  <span className="text-amber-500">{dashboardStats.tempCount} موقت</span>
                  <span className="text-slate-400">{dashboardStats.draftCount} پیش‌نویس</span>
                </div>
              </div>
              <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-2xl">
                <FileText className="w-6 h-6" />
              </div>
            </div>

            <div className={`p-5 rounded-2xl border flex items-center justify-between shadow-xs ${
              isDarkMode ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-200"
            }`}>
              <div className="text-right">
                <span className={`text-[10px] font-bold ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>جمع گردش بدهکار دفاتر</span>
                <div className={`text-xl font-mono font-black mt-1 ${isDarkMode ? "text-blue-400" : "text-blue-600"}`}>
                  {dashboardStats.totalTurnover.toLocaleString()} <span className="text-xs font-sans font-medium text-slate-500">ریال</span>
                </div>
                <p className="text-[9px] text-slate-400 mt-1.5">ثبت تجمعی گردش تراز آزمایشی</p>
              </div>
              <div className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl">
                <ArrowLeftRight className="w-6 h-6" />
              </div>
            </div>

            <div className={`p-5 rounded-2xl border flex items-center justify-between shadow-xs ${
              isDarkMode ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-200"
            }`}>
              <div className="text-right">
                <span className={`text-[10px] font-bold ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>وضعیت توازن کلی سیستم</span>
                <div className="flex items-center gap-1.5 mt-2">
                  {dashboardStats.systemIsBalanced ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                      <span className="text-xs font-black text-emerald-500">تراز دفاتر برقرار است</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-5 h-5 text-rose-500" />
                      <span className="text-xs font-black text-rose-500">ناترازی در اسناد موقت!</span>
                    </>
                  )}
                </div>
                <p className="text-[9px] text-slate-400 mt-1.5">پایش مداوم ترازنامه آزمایشی دوبل</p>
              </div>
              <div className={`p-3 rounded-2xl ${
                dashboardStats.systemIsBalanced ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
              }`}>
                <CheckCircle className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Search & Filters */}
          <div className={`p-4 rounded-2xl border flex flex-col md:flex-row gap-3 items-center justify-between ${
            isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-slate-50 border-slate-200"
          }`}>
            <div className="relative w-full md:w-72">
              <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input 
                type="text"
                placeholder="جستجوی شماره سند یا شرح رویداد..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pr-9 pl-3 py-1.5 rounded-lg text-xs border focus:outline-none focus:ring-1.5 focus:ring-indigo-500/50 ${
                  isDarkMode ? "bg-slate-950 border-slate-800 text-slate-200 placeholder-slate-500" : "bg-white border-slate-250 text-slate-800"
                }`}
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto justify-start md:justify-end">
              <div className="flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[10px] font-bold text-slate-500 ml-1">فیلتر وضعیت:</span>
              </div>
              <div className="flex bg-slate-200/50 dark:bg-slate-950 p-0.5 rounded-lg border dark:border-slate-800">
                {["ALL", VoucherStatus.DRAFT, VoucherStatus.TEMPORARY, VoucherStatus.PERMANENT].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                      statusFilter === st 
                        ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs" 
                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    }`}
                  >
                    {st === "ALL" ? "همه اسناد" : 
                     st === VoucherStatus.DRAFT ? "پیش‌نویس" : 
                     st === VoucherStatus.TEMPORARY ? "موقت" : "قطعی شده"}
                  </button>
                ))}
              </div>

              <input 
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className={`px-2 py-1 rounded-lg text-xs border focus:outline-none ${
                  isDarkMode ? "bg-slate-950 border-slate-800 text-slate-300" : "bg-white border-slate-250 text-slate-700"
                }`}
              />
              {dateFilter && (
                <button onClick={() => setDateFilter("")} className="text-xs text-rose-500 font-bold hover:underline">
                  لغو تاریخ
                </button>
              )}
            </div>
          </div>

          {/* Vouchers Table */}
          <div className={`rounded-2xl border overflow-hidden shadow-xs ${
            isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200"
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className={`text-[10px] font-bold uppercase border-b ${
                  isDarkMode ? "bg-slate-950 text-slate-400 border-slate-800" : "bg-slate-50 text-slate-500 border-slate-200"
                }`}>
                  <tr>
                    <th className="px-5 py-3 w-20 text-center">شماره سند</th>
                    <th className="px-5 py-3 w-28">تاریخ ثبت</th>
                    <th className="px-5 py-3">شرح رویداد مالی</th>
                    <th className="px-5 py-3 w-24 text-center">آرتیکل‌ها</th>
                    <th className="px-5 py-3 w-36 text-left">جمع آرتیکل (ریال)</th>
                    <th className="px-5 py-3 w-28 text-center">وضعیت</th>
                    <th className="px-5 py-3 w-24 text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredVouchers.map(voucher => {
                    const vLines = allLines.filter(l => l.voucher_id === voucher.id);
                    const vTotalDebit = vLines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
                    const vTotalCredit = vLines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
                    const isBalancedVoucher = Math.abs(vTotalDebit - vTotalCredit) < 0.01;

                    return (
                      <tr key={voucher.id} className={`group transition-colors ${
                        isDarkMode ? "hover:bg-slate-800/20" : "hover:bg-slate-50"
                      }`}>
                        <td className="px-5 py-3.5 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                          #{voucher.voucher_number}
                        </td>
                        <td className="px-5 py-3.5 text-slate-500 font-mono">
                          {voucher.date}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className={`font-medium max-w-md truncate ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>
                            {voucher.description || <span className="text-slate-400 italic">بدون شرح کلی</span>}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-center text-slate-500 font-mono">
                          {vLines.length}
                        </td>
                        <td className="px-5 py-3.5 text-left font-mono font-black text-slate-700 dark:text-slate-300">
                          {vTotalDebit.toLocaleString()}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <div className="flex items-center justify-center">
                            {voucher.status === VoucherStatus.PERMANENT ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                <Lock className="w-2.5 h-2.5" /> قطعی شده
                              </span>
                            ) : voucher.status === VoucherStatus.TEMPORARY ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                <AlertCircle className="w-2.5 h-2.5" /> موقت
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black bg-slate-500/10 text-slate-500 border border-slate-500/20">
                                <FileText className="w-2.5 h-2.5" /> پیش‌نویس
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button 
                              onClick={() => handleEdit(voucher.id)} 
                              title={voucher.status === VoucherStatus.PERMANENT ? "مشاهده سند قطعی" : "ویرایش سند"}
                              className={`p-1.5 rounded-lg transition-all ${
                                isDarkMode ? "text-slate-400 hover:bg-slate-800 hover:text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                              }`}
                            >
                              {voucher.status === VoucherStatus.PERMANENT ? <Eye className="w-3.5 h-3.5" /> : <Edit className="w-3.5 h-3.5 text-blue-500" />}
                            </button>
                            <button 
                              onClick={() => handleClone(voucher.id)} 
                              title="کپی و شبیه‌سازی سند"
                              className={`p-1.5 rounded-lg transition-all ${
                                isDarkMode ? "text-slate-400 hover:bg-slate-800 hover:text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                              }`}
                            >
                              <Copy className="w-3.5 h-3.5 text-amber-500" />
                            </button>
                            <button 
                              onClick={() => handleExportToCSV(voucher.id)} 
                              title="دریافت فایل اکسل CSV این سند"
                              className={`p-1.5 rounded-lg transition-all ${
                                isDarkMode ? "text-slate-400 hover:bg-slate-800 hover:text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                              }`}
                            >
                              <Download className="w-3.5 h-3.5 text-emerald-500" />
                            </button>
                            <button 
                              onClick={() => {
                                setPrintVoucherId(voucher.id);
                                setIsPrintModalOpen(true);
                              }} 
                              title="مشاهده نسخه چاپی سند"
                              className={`p-1.5 rounded-lg transition-all ${
                                isDarkMode ? "text-slate-400 hover:bg-slate-800 hover:text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                              }`}
                            >
                              <Printer className="w-3.5 h-3.5 text-indigo-500" />
                            </button>
                            {voucher.status !== VoucherStatus.PERMANENT && (
                              <button 
                                onClick={() => handleDelete(voucher.id)} 
                                title="حذف سند"
                                className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredVouchers.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-slate-400 italic">
                        هیچ سند منطبق با فیلترها و مقادیر جستجو شده یافت نگردید.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* 2. CREATION / EDIT WORKSPACE */}
      {viewState === "edit" && header && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col gap-6"
        >
          {/* Editor Header Actions */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black ${
                  header.status === VoucherStatus.PERMANENT ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                  header.status === VoucherStatus.TEMPORARY ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" :
                  "bg-slate-500/10 text-slate-500 border border-slate-500/20"
                }`}>
                  {header.status === VoucherStatus.PERMANENT ? "سند قفل شده" : 
                   header.status === VoucherStatus.TEMPORARY ? "سند موقت" : "پیش‌نویس جدید"}
                </span>
                <h2 className={`text-lg font-black tracking-tight ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>
                  {header.status === VoucherStatus.DRAFT ? "تنظیم و صدور سند حسابداری" : `سند حسابداری شماره #${header.voucher_number}`}
                </h2>
                <button
                  onClick={() => setShowFriendlyVoucherGuide(!showFriendlyVoucherGuide)}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 flex items-center gap-1 hover:bg-indigo-500/20 transition-all"
                >
                  <Info className="w-3 h-3" />
                  {showFriendlyVoucherGuide ? "پنهان‌سازی راهنما" : "راهنمای ساده ثبت سند"}
                </button>
              </div>
              <p className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"} mt-1.5`}>
                تعریف کدهای معین، انتساب حساب تفصیلی شناور و توازن‌سنجی مانده بدهکار/بستانکار
              </p>
            </div>

            <div className="flex items-center gap-2 self-end md:self-auto">
              <button 
                onClick={() => setViewState("list")} 
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  isDarkMode 
                    ? "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800" 
                    : "bg-white border-slate-250 text-slate-700 hover:bg-slate-50"
                }`}
              >
                انصراف و بازگشت
              </button>
              
              {!isLocked && (
                <>
                  <button 
                    type="button"
                    onClick={() => setIsTemplateModalOpen(true)} 
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1 ${
                      isDarkMode 
                        ? "bg-slate-900 border-slate-800 text-purple-400 hover:bg-slate-800" 
                        : "bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" /> بارگذاری الگو
                  </button>

                  <button 
                    type="button"
                    onClick={() => setIsBulkImportOpen(true)} 
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1 ${
                      isDarkMode 
                        ? "bg-slate-900 border-slate-800 text-blue-400 hover:bg-slate-800" 
                        : "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                    }`}
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> واردسازی اکسل
                  </button>

                  <button 
                    onClick={handleSave} 
                    className="px-3.5 py-1.5 bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 hover:bg-slate-900 dark:hover:bg-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <Save className="w-4 h-4" /> ذخیره سند
                  </button>

                  <button 
                    disabled={!isBalanced || lines.length < 2 || currentValidationIssues.length > 0}
                    onClick={handlePostToPermanent} 
                    className="disabled:opacity-50 disabled:cursor-not-allowed px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-emerald-500/10"
                  >
                    <Lock className="w-4 h-4" /> تایید قطعی و قفل دفاتر
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
            
            {/* Left: General Voucher details & Articles table */}
            <div className="lg:col-span-3 flex flex-col gap-5">
              
              {showFriendlyVoucherGuide && (
                <div className={`p-4 rounded-xl border text-xs leading-relaxed flex items-start gap-3 transition-all ${
                  isDarkMode ? "bg-indigo-950/20 border-indigo-900/30 text-indigo-300" : "bg-indigo-50/40 border-indigo-100 text-indigo-800"
                }`}>
                  <span className="text-base shrink-0">💡</span>
                  <div>
                    <span className="font-bold block mb-1">راهنمای گام‌به‌گام ثبت سند برای همه:</span>
                    <ul className="list-disc list-inside space-y-1 opacity-90 text-[11px]">
                      <li><strong>گام اول:</strong> یک شرح ساده برای سند بنویسید (مثلاً: بابت خرید صندلی‌های جدید).</li>
                      <li><strong>گام دوم (بدهکار):</strong> حسابی که قرار است پول یا ارزش به آن اضافه شود را انتخاب کنید و مبلغ آن را در ستون <span className="font-bold text-blue-600 dark:text-blue-400">بدهکار</span> بنویسید (مثلاً: حساب اثاثه و صندلی‌ها).</li>
                      <li><strong>گام سوم (بستانکار):</strong> حسابی که پول از آن کسر شده را انتخاب کرده و همان مبلغ را در ستون <span className="font-bold text-rose-600 dark:text-rose-400">بستانکار</span> بنویسید (مثلاً: صندوق مغازه یا بانک سامان).</li>
                      <li><strong>گام چهارم:</strong> مطمئن شوید که جمع بدهکار با جمع بستانکار در پایین صفحه <strong>دقیقاً برابر (متوازن)</strong> باشد. سپس روی ذخیره یا تایید نهایی کلیک کنید!</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Metadata Panel */}
              <div className={`p-5 rounded-2xl border shadow-xs ${
                isDarkMode ? "bg-slate-900/50 border-slate-850" : "bg-white border-slate-200"
              }`}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className={`block text-[10px] font-black mb-1.5 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>شماره سند حسابداری</label>
                    <div className="relative">
                      <input 
                        type="number"
                        disabled={isLocked}
                        value={header.voucher_number}
                        onChange={(e) => setHeader({ ...header, voucher_number: Number(e.target.value) || 1 })}
                        className={`w-full px-3 py-1.5 rounded-lg text-xs font-mono font-bold border focus:outline-none focus:ring-1.5 focus:ring-indigo-500/50 ${
                          isDarkMode ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-white border-slate-300 text-slate-850"
                        } ${isLocked ? "opacity-60 bg-slate-100 dark:bg-slate-900/50 cursor-not-allowed" : ""}`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-[10px] font-black mb-1.5 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>تاریخ ثبت مالی</label>
                    <input 
                      type="date"
                      disabled={isLocked}
                      value={header.date}
                      onChange={(e) => setHeader({ ...header, date: e.target.value })}
                      className={`w-full px-3 py-1.5 rounded-lg text-xs font-mono font-bold border focus:outline-none focus:ring-1.5 focus:ring-indigo-500/50 ${
                        isDarkMode ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-white border-slate-300 text-slate-850"
                      } ${isLocked ? "opacity-60 bg-slate-100 dark:bg-slate-900/50 cursor-not-allowed" : ""}`}
                    />
                  </div>

                  <div>
                    <label className={`block text-[10px] font-black mb-1.5 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>شماره عطف / رفرنس خارجی (اختیاری)</label>
                    <input 
                      type="text"
                      disabled={isLocked}
                      placeholder="مانند: فاکتور خرید ف‌-۹۸۴"
                      value={header.reference_number || ""}
                      onChange={(e) => setHeader({ ...header, reference_number: e.target.value })}
                      className={`w-full px-3 py-1.5 rounded-lg text-xs border focus:outline-none focus:ring-1.5 focus:ring-indigo-500/50 ${
                        isDarkMode ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-white border-slate-300 text-slate-850"
                      } ${isLocked ? "opacity-60 bg-slate-100 dark:bg-slate-900/50 cursor-not-allowed" : ""}`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-[10px] font-black mb-1.5 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>شرح کلی رویداد سند</label>
                  <input 
                    type="text"
                    disabled={isLocked}
                    placeholder="شرح کلی نحوه خرید، تسویه نقدی، شناسایی حقوق یا فروش کالا..."
                    value={header.description}
                    onChange={(e) => setHeader({ ...header, description: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg text-xs border focus:outline-none focus:ring-1.5 focus:ring-indigo-500/50 ${
                      isDarkMode ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-white border-slate-300 text-slate-850"
                    } ${isLocked ? "opacity-60 bg-slate-100 dark:bg-slate-900/50 cursor-not-allowed" : ""}`}
                  />
                </div>
              </div>

              {/* Articles Grid */}
              <div className={`rounded-2xl border overflow-visible shadow-xs ${
                isDarkMode ? "bg-slate-900/40 border-slate-850" : "bg-white border-slate-200"
              }`}>
                <div className="overflow-x-auto min-h-[300px]">
                  <table className="w-full text-right text-xs table-fixed">
                    <thead className={`text-[10px] font-bold border-b ${
                      isDarkMode ? "bg-slate-950 text-slate-400 border-slate-850" : "bg-slate-50 text-slate-500 border-slate-200"
                    }`}>
                      <tr>
                        <th className="px-4 py-3 w-12 text-center">ردیف</th>
                        <th className="px-3 py-3 w-64">حساب معین (۴ رقم)</th>
                        <th className="px-3 py-3 w-56">حساب تفصیلی شناور</th>
                        <th className="px-3 py-3">شرح آرتیکل (سطر)</th>
                        <th className="px-3 py-3 w-40 text-left">بدهکار (ریال)</th>
                        <th className="px-3 py-3 w-40 text-left">بستانکار (ریال)</th>
                        <th className="px-2 py-3 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {lines.map((line, index) => {
                        const selectedAccObj = subledgerAccounts.find(a => a.id === line.account_id);
                        
                        // Find connected detailed accounts for the selected subledger
                        const linkedDetailedIds = links
                          .filter(link => link.account_id === line.account_id)
                          .map(link => link.detailed_account_id);
                        
                        const filteredDetailed = detailedAccounts.filter(da => linkedDetailedIds.includes(da.id));
                        const selectedDetailedObj = detailedAccounts.find(da => da.id === line.detailed_account_id);

                        return (
                          <tr key={line.id} className={`group transition-all ${
                            isDarkMode ? "hover:bg-slate-850/30" : "hover:bg-slate-50/70"
                          }`}>
                            {/* # Index */}
                            <td className="px-4 py-4 text-center font-mono font-bold text-slate-400">
                              {index + 1}
                            </td>

                            {/* Account_id Dropdown Searcher */}
                            <td className="px-3 py-4 overflow-visible relative">
                              <div className="relative">
                                <button
                                  type="button"
                                  disabled={isLocked}
                                  onClick={() => {
                                    if (!isLocked) {
                                      setActiveCellFocus({ lineId: line.id, field: "account_id" });
                                      setDropdownSearch("");
                                    }
                                  }}
                                  className={`w-full px-2.5 py-1.5 text-right rounded-lg border text-xs flex items-center justify-between transition-colors focus:outline-none ${
                                    isDarkMode 
                                      ? "bg-slate-950 border-slate-800 text-slate-200" 
                                      : "bg-white border-slate-300 text-slate-800"
                                  } ${isLocked ? "cursor-not-allowed opacity-75" : ""}`}
                                >
                                  <span className="truncate">
                                    {selectedAccObj 
                                      ? `${selectedAccObj.code} - ${selectedAccObj.name}` 
                                      : "انتخاب حساب معین..."}
                                  </span>
                                  {!isLocked && <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-1" />}
                                </button>

                                {/* Dropdown Container overlay */}
                                {activeCellFocus?.lineId === line.id && activeCellFocus.field === "account_id" && (
                                  <div 
                                    ref={dropdownRef}
                                    className={`absolute right-0 left-0 mt-1 z-55 rounded-xl border p-2 shadow-xl flex flex-col gap-1.5 max-h-56 overflow-y-auto ${
                                      isDarkMode ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-900"
                                    }`}
                                  >
                                    <div className="relative">
                                      <input
                                        type="text"
                                        placeholder="جستجو نام یا کد معین..."
                                        autoFocus
                                        value={dropdownSearch}
                                        onChange={(e) => setDropdownSearch(e.target.value)}
                                        className={`w-full px-2.5 py-1 rounded-md text-[11px] border focus:outline-none ${
                                          isDarkMode ? "bg-slate-900 border-slate-800 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-800"
                                        }`}
                                      />
                                    </div>
                                    <div className="flex flex-col gap-0.5 mt-1">
                                      {subledgerAccounts
                                        .filter(acc => 
                                          acc.name.includes(dropdownSearch) || acc.code.includes(dropdownSearch)
                                        )
                                        .map(acc => (
                                          <button
                                            key={acc.id}
                                            type="button"
                                            onClick={() => {
                                              updateLineValue(line.id, "account_id", acc.id);
                                              // Clear detailed account if subledger changes
                                              updateLineValue(line.id, "detailed_account_id", "");
                                              setActiveCellFocus(null);
                                              setDropdownSearch("");
                                            }}
                                            className={`text-right text-[11px] px-2 py-1.5 rounded-md transition-all flex items-center justify-between ${
                                              isDarkMode ? "hover:bg-slate-850" : "hover:bg-slate-100"
                                            }`}
                                          >
                                            <span>{acc.code} - {acc.name}</span>
                                            {line.account_id === acc.id && <Check className="w-3 h-3 text-emerald-500 shrink-0" />}
                                          </button>
                                        ))
                                      }
                                      {subledgerAccounts.filter(acc => acc.name.includes(dropdownSearch) || acc.code.includes(dropdownSearch)).length === 0 && (
                                        <div className="text-[10px] text-center text-slate-500 py-2">موردی یافت نشد.</div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Detailed_account_id Dropdown Searcher */}
                            <td className="px-3 py-4 overflow-visible relative">
                              <div className="relative">
                                <button
                                  type="button"
                                  disabled={isLocked || !line.account_id}
                                  onClick={() => {
                                    if (!isLocked && line.account_id) {
                                      setActiveCellFocus({ lineId: line.id, field: "detailed_account_id" });
                                      setDropdownSearch("");
                                    }
                                  }}
                                  className={`w-full px-2.5 py-1.5 text-right rounded-lg border text-xs flex items-center justify-between transition-colors focus:outline-none ${
                                    isDarkMode 
                                      ? "bg-slate-950 border-slate-800 text-slate-200" 
                                      : "bg-white border-slate-300 text-slate-850"
                                  } ${(!line.account_id || isLocked) ? "opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-900/30" : ""}`}
                                >
                                  <span className="truncate">
                                    {selectedDetailedObj 
                                      ? `${selectedDetailedObj.code} - ${selectedDetailedObj.name}` 
                                      : !line.account_id 
                                        ? "ابتدا معین را انتخاب کنید" 
                                        : filteredDetailed.length === 0 
                                          ? "تفصیلی آزاد (کلیک کنید)" 
                                          : "انتخاب تفصیلی..."}
                                  </span>
                                  {!isLocked && line.account_id && <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-1" />}
                                </button>

                                {/* Dropdown Container overlay */}
                                {activeCellFocus?.lineId === line.id && activeCellFocus.field === "detailed_account_id" && (
                                  <div 
                                    ref={dropdownRef}
                                    className={`absolute right-0 left-0 mt-1 z-55 rounded-xl border p-2 shadow-xl flex flex-col gap-1.5 max-h-56 overflow-y-auto ${
                                      isDarkMode ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-900"
                                    }`}
                                  >
                                    <div className="relative">
                                      <input
                                        type="text"
                                        placeholder="جستجو نام یا کد تفصیلی..."
                                        autoFocus
                                        value={dropdownSearch}
                                        onChange={(e) => setDropdownSearch(e.target.value)}
                                        className={`w-full px-2.5 py-1 rounded-md text-[11px] border focus:outline-none ${
                                          isDarkMode ? "bg-slate-900 border-slate-800 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-800"
                                        }`}
                                      />
                                    </div>
                                    <div className="flex flex-col gap-0.5 mt-1">
                                      {/* If there are linked accounts, prioritize/only show them. If none linked, allow any detailed account */}
                                      {(filteredDetailed.length > 0 ? filteredDetailed : detailedAccounts)
                                        .filter(da => 
                                          da.name.includes(dropdownSearch) || da.code.includes(dropdownSearch)
                                        )
                                        .map(da => (
                                          <button
                                            key={da.id}
                                            type="button"
                                            onClick={() => {
                                              updateLineValue(line.id, "detailed_account_id", da.id);
                                              setActiveCellFocus(null);
                                              setDropdownSearch("");
                                            }}
                                            className={`text-right text-[11px] px-2 py-1.5 rounded-md transition-all flex items-center justify-between ${
                                              isDarkMode ? "hover:bg-slate-850" : "hover:bg-slate-100"
                                            }`}
                                          >
                                            <div className="flex flex-col items-start">
                                              <span>{da.code} - {da.name}</span>
                                              <span className="text-[8px] opacity-60">نوع تفصیلی: {da.type}</span>
                                            </div>
                                            {line.detailed_account_id === da.id && <Check className="w-3 h-3 text-emerald-500 shrink-0" />}
                                          </button>
                                        ))
                                      }
                                      {detailedAccounts.filter(da => da.name.includes(dropdownSearch) || da.code.includes(dropdownSearch)).length === 0 && (
                                        <div className="text-[10px] text-center text-slate-500 py-2">موردی یافت نشد.</div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Description */}
                            <td className="px-3 py-4">
                              <input 
                                type="text"
                                disabled={isLocked}
                                placeholder="شرح آرتیکل مالی..."
                                value={line.description}
                                onChange={(e) => updateLineValue(line.id, "description", e.target.value)}
                                className={`w-full px-2.5 py-1.5 text-xs rounded-lg border focus:outline-none focus:ring-1.5 focus:ring-indigo-500/50 ${
                                  isDarkMode ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-white border-slate-300 text-slate-800"
                                } ${isLocked ? "opacity-60 cursor-not-allowed bg-slate-50 dark:bg-slate-900/10" : ""}`}
                              />
                            </td>

                            {/* Debit (بدهکار) */}
                            <td className="px-3 py-4">
                              <input 
                                type="number"
                                min="0"
                                disabled={isLocked || (Number(line.credit) > 0)}
                                placeholder="0"
                                value={line.debit || ""}
                                onChange={(e) => updateLineValue(line.id, "debit", Math.abs(Number(e.target.value)))}
                                className={`w-full text-left font-mono font-bold px-2.5 py-1.5 text-xs rounded-lg border focus:outline-none focus:ring-1.5 ${
                                  isDarkMode 
                                    ? "bg-slate-950 border-slate-800 text-blue-400 focus:ring-blue-500/30" 
                                    : "bg-white border-slate-300 text-blue-600 focus:ring-blue-500/30"
                                } ${(isLocked || Number(line.credit) > 0) ? "opacity-50 cursor-not-allowed bg-slate-55 dark:bg-slate-900/40" : ""}`}
                              />
                            </td>

                            {/* Credit (بستانکار) */}
                            <td className="px-3 py-4">
                              <input 
                                type="number"
                                min="0"
                                disabled={isLocked || (Number(line.debit) > 0)}
                                placeholder="0"
                                value={line.credit || ""}
                                onChange={(e) => updateLineValue(line.id, "credit", Math.abs(Number(e.target.value)))}
                                className={`w-full text-left font-mono font-bold px-2.5 py-1.5 text-xs rounded-lg border focus:outline-none focus:ring-1.5 ${
                                  isDarkMode 
                                    ? "bg-slate-950 border-slate-800 text-rose-400 focus:ring-rose-500/30" 
                                    : "bg-white border-slate-300 text-rose-600 focus:ring-rose-500/30"
                                } ${(isLocked || Number(line.debit) > 0) ? "opacity-50 cursor-not-allowed bg-slate-55 dark:bg-slate-900/40" : ""}`}
                              />
                            </td>

                            {/* Row Action */}
                            <td className="px-2 py-4 text-center">
                              {!isLocked ? (
                                <button
                                  type="button"
                                  onClick={() => removeLineRow(line.id)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              ) : null}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Footer Controls & Article Statistics */}
                <div className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-t ${
                  isDarkMode ? "border-slate-850 bg-slate-950/40" : "border-slate-200 bg-slate-50/50"
                }`}>
                  {!isLocked ? (
                    <div className="flex gap-2">
                      <button 
                        type="button"
                        onClick={addLineRow} 
                        className={`flex items-center gap-1 px-3 py-2 rounded-xl text-[11px] font-black transition-colors ${
                          isDarkMode ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-white border border-slate-280 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <PlusCircle className="w-4 h-4 text-indigo-500" />
                        افزودن سطر آرتیکل جدید
                      </button>
                      
                      {!isBalanced && (
                        <button 
                          type="button"
                          onClick={handleInsertBalancingLine}
                          className="flex items-center gap-1 px-3 py-2 rounded-xl text-[11px] font-black bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all"
                        >
                          <Sparkles className="w-4 h-4" />
                          تولید آرتیکل موازنه تراز
                        </button>
                      )}
                    </div>
                  ) : <div className="text-[10px] text-slate-500">سند قطعی شده غیر قابل تغییر می‌باشد.</div>}

                  <div className="flex items-center gap-6 self-end md:self-auto">
                    <div className="flex flex-col items-end gap-1.5 text-xs font-bold font-mono">
                      <div className={isDarkMode ? "text-slate-300" : "text-slate-600"}>
                        <span className="text-[9px] font-sans text-slate-400 ml-2">جمع آرتیکل بدهکار:</span>
                        {totalDebit.toLocaleString()} ریال
                      </div>
                      <div className={isDarkMode ? "text-slate-300" : "text-slate-600"}>
                        <span className="text-[9px] font-sans text-slate-400 ml-2">جمع آرتیکل بستانکار:</span>
                        {totalCredit.toLocaleString()} ریال
                      </div>
                    </div>

                    <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                      isBalanced 
                        ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-500" 
                        : "bg-rose-500/5 border-rose-500/10 text-rose-500 animate-pulse"
                    }`}>
                      {isBalanced ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                      <div className="text-right">
                        <span className="block text-[8px] uppercase font-black opacity-80">تراز موازنه دوبل</span>
                        <span className="text-xs font-black">
                          {isBalanced ? "سند تراز است" : `تفاضل: ${imbalanceAmount.toLocaleString()} ریال`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Validation Inspector Sidebar */}
            <div className="lg:col-span-1 flex flex-col gap-5">
              
              {/* Core Accounting Info Card */}
              <div className={`p-5 rounded-2xl border flex flex-col gap-4 ${
                isDarkMode ? "bg-slate-900/50 border-slate-850" : "bg-slate-50 border-slate-200"
              }`}>
                <h3 className={`text-xs font-black flex items-center gap-1.5 ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>
                  <Info className="w-4 h-4 text-indigo-500" /> پایشگر سلامت سند
                </h3>
                
                <p className={`text-[11px] leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                  سند حسابداری باید حتماً تراز بوده و آرتیکل‌ها در سطح **معین** ثبت گردند. تفصیلی‌های شناور به کنترل ریز گردش‌ها کمک می‌کنند.
                </p>

                <hr className="border-slate-200 dark:border-slate-800" />

                <div className="flex flex-col gap-2">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">قوانین و پایش تراز:</div>
                  
                  {currentValidationIssues.length === 0 ? (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl text-emerald-500 text-[10px] font-bold leading-relaxed flex gap-2">
                      <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>هیچ خطای ساختاری وجود ندارد. سند با استانداردهای دوبل و دفاتر حسابداری مطابقت دارد.</span>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      {currentValidationIssues.map((issue, idx) => (
                        <div key={idx} className="p-2.5 bg-rose-500/10 border border-rose-500/15 rounded-lg text-rose-500 text-[10px] font-bold leading-relaxed flex gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <span>{issue}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Useful Shortcuts / ERP Guidelines Card */}
              <div className={`p-5 rounded-2xl border flex flex-col gap-3 ${
                isDarkMode ? "bg-slate-900/30 border-slate-850" : "bg-slate-100/40 border-slate-250"
              }`}>
                <h4 className={`text-xs font-bold flex items-center gap-1.5 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                  <HelpCircle className="w-3.5 h-3.5 text-purple-500" /> ویژگی‌های پیشرفته ERP
                </h4>
                <ul className={`text-[10px] space-y-2 list-disc list-inside leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                  <li><strong>فیلتر هوشمند تفصیلی:</strong> لیست تفصیلی‌ها بلافاصله پس از انتخاب معین، فیلتر شده و کدهای مجاز را نمایش می‌دهد.</li>
                  <li><strong>دکمه موازنه خودکار:</strong> به جای تایپ دستی مانده مغایرت، با زدن دکمه موازنه تراز در یک ثانیه سند را بالانس کنید.</li>
                  <li><strong>بایگانی و قفل:</strong> اسناد قطعی شده غیر قابل بازگشت و تغییر نام می‌باشند تا یکپارچگی دفاتر روزنامه تایید گردد.</li>
                </ul>
              </div>

            </div>

          </div>

        </motion.div>
      )}

      {/* 3. MODALS AND OVERLAYS */}
      <AnimatePresence>
        {/* A. Print Preview Modal */}
        {isPrintModalOpen && printVoucherId && (() => {
          const printVoucher = vouchers.find(v => v.id === printVoucherId);
          const printLines = printVoucher ? allLines.filter(l => l.voucher_id === printVoucherId) : [];
          const printTotalDebit = printLines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
          const printTotalCredit = printLines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);

          return (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print"
            >
              {/* Inner Styles for native page print routing */}
              <style>{`
                @media print {
                  body * {
                    visibility: hidden !important;
                  }
                  #printable-voucher, #printable-voucher * {
                    visibility: visible !important;
                  }
                  #printable-voucher {
                    position: absolute !important;
                    left: 0 !important;
                    top: 0 !important;
                    width: 100% !important;
                    background: white !important;
                    color: black !important;
                    box-shadow: none !important;
                    padding: 0 !important;
                    margin: 0 !important;
                  }
                  .no-print {
                    display: none !important;
                  }
                }
              `}</style>

              <motion.div 
                initial={{ scale: 0.95, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 15 }}
                className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl flex flex-col border ${
                  isDarkMode ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-900"
                }`}
              >
                {/* Modal Header Controls (Hidden during print) */}
                <div className="flex items-center justify-between p-4 border-b dark:border-slate-800 bg-slate-100/50 dark:bg-slate-950/40 no-print">
                  <div className="flex items-center gap-2">
                    <Printer className="w-5 h-5 text-indigo-500" />
                    <span className="font-black text-xs">نسخه رسمی چاپی سند حسابداری</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => window.print()}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-md shadow-indigo-500/10"
                    >
                      <Printer className="w-3.5 h-3.5" /> چاپ فیزیکی سند
                    </button>
                    <button 
                      onClick={() => {
                        setIsPrintModalOpen(false);
                        setPrintVoucherId(null);
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        isDarkMode 
                          ? "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800" 
                          : "bg-white border-slate-250 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      بستن پیش‌نمایش
                    </button>
                  </div>
                </div>

                {/* Printable Document Core (Iran Standard Bookkeeping format) */}
                <div id="printable-voucher" className="p-8 flex flex-col gap-6 bg-white text-slate-900 text-right" dir="rtl">
                  {/* Document Header */}
                  <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
                    <div className="text-right flex flex-col gap-1">
                      <h1 className="text-xl font-black text-slate-950">شرکت خدمات توسعه سیستم‌های مالی یکپارچه</h1>
                      <p className="text-[10px] text-slate-500">سیستم مکانیزه صدور و بایگانی هوشمند اسناد دوبل</p>
                    </div>
                    <div className="text-center bg-slate-100 px-6 py-2.5 rounded-xl border border-slate-300">
                      <h2 className="text-lg font-black text-slate-900 tracking-wider">سند حسابداری (دوبل)</h2>
                      <span className="text-[10px] text-slate-500 font-bold">
                        وضعیت: {printVoucher?.status === VoucherStatus.PERMANENT ? "قطعی شده" : "موقت"}
                      </span>
                    </div>
                    <div className="text-left text-xs font-bold flex flex-col gap-1 font-mono text-slate-700">
                      <div>شماره سند: #{printVoucher?.voucher_number}</div>
                      <div>تاریخ ثبت سند: {printVoucher?.date}</div>
                      {printVoucher?.reference_number && <div>شماره عطف: {printVoucher.reference_number}</div>}
                    </div>
                  </div>

                  {/* General Description */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs flex gap-2">
                    <strong className="text-slate-950 shrink-0 font-bold">شرح کلی رویداد:</strong>
                    <span className="text-slate-800 leading-relaxed">{printVoucher?.description || "بدون شرح کلی"}</span>
                  </div>

                  {/* Journal Entries Table */}
                  <table className="w-full text-xs text-right border-collapse border border-slate-400">
                    <thead>
                      <tr className="bg-slate-100 text-slate-900 border-b border-slate-400 text-[10px] font-bold">
                        <th className="border border-slate-400 p-2.5 w-12 text-center">ردیف</th>
                        <th className="border border-slate-400 p-2.5 w-28 text-center">کد معین</th>
                        <th className="border border-slate-400 p-2.5 w-44">عنوان حساب معین</th>
                        <th className="border border-slate-400 p-2.5 w-44">حساب تفصیلی شناور</th>
                        <th className="border border-slate-400 p-2.5">شرح آرتیکل (سطر)</th>
                        <th className="border border-slate-400 p-2.5 w-32 text-left">بدهکار (ریال)</th>
                        <th className="border border-slate-400 p-2.5 w-32 text-left">بستانکار (ریال)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300">
                      {printLines.map((l, idx) => {
                        const acc = accounts.find(a => a.id === l.account_id);
                        const det = detailedAccounts.find(d => d.id === l.detailed_account_id);
                        return (
                          <tr key={l.id} className="text-slate-800 hover:bg-slate-50/50">
                            <td className="border border-slate-400 p-2 text-center font-mono font-bold text-slate-500">{idx + 1}</td>
                            <td className="border border-slate-400 p-2 text-center font-mono font-bold">{acc?.code || "---"}</td>
                            <td className="border border-slate-400 p-2 font-bold">{acc?.name || "حساب معین نامشخص"}</td>
                            <td className="border border-slate-400 p-2 text-slate-600">{det ? `${det.code} - ${det.name}` : "---"}</td>
                            <td className="border border-slate-400 p-2 text-[11px] leading-relaxed">{l.description || "بابت رویداد"}</td>
                            <td className="border border-slate-400 p-2 text-left font-mono font-black text-slate-900">
                              {l.debit > 0 ? l.debit.toLocaleString() : "۰"}
                            </td>
                            <td className="border border-slate-400 p-2 text-left font-mono font-black text-slate-900">
                              {l.credit > 0 ? l.credit.toLocaleString() : "۰"}
                            </td>
                          </tr>
                        );
                      })}
                      {/* Subtotal row */}
                      <tr className="bg-slate-100 text-slate-950 font-bold border-t border-slate-400">
                        <td colSpan={5} className="border border-slate-400 p-2.5 text-left font-black text-xs uppercase">جمع کل آرتیکل‌ها (ریال):</td>
                        <td className="border border-slate-400 p-2.5 text-left font-mono font-black">{printTotalDebit.toLocaleString()}</td>
                        <td className="border border-slate-400 p-2.5 text-left font-mono font-black">{printTotalCredit.toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Balancing Check Disclaimer */}
                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold border-b border-dashed pb-4">
                    <span>ثبت نهایی توسط کاربر با شناسه کاربری u1</span>
                    <span>امضای دفاتر موازنه‌شده کاملاً منطبق بر دفاتر کل روزنامه دوره جاری</span>
                  </div>

                  {/* Official Signature Lines */}
                  <div className="grid grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-200 text-center text-xs font-bold text-slate-800">
                    <div className="flex flex-col gap-12">
                      <span>تنظیم‌کننده سند (کارشناس)</span>
                      <div className="h-0.5 w-32 mx-auto border-b border-dashed border-slate-400"></div>
                      <span className="text-[10px] font-medium text-slate-400">امضا و تاریخ</span>
                    </div>
                    <div className="flex flex-col gap-12">
                      <span>تایید‌کننده سند (رئیس حسابداری)</span>
                      <div className="h-0.5 w-32 mx-auto border-b border-dashed border-slate-400"></div>
                      <span className="text-[10px] font-medium text-slate-400">امضا و تاریخ</span>
                    </div>
                    <div className="flex flex-col gap-12">
                      <span>تاییدکننده نهایی (مدیر مالی)</span>
                      <div className="h-0.5 w-32 mx-auto border-b border-dashed border-slate-400"></div>
                      <span className="text-[10px] font-medium text-slate-400">امضا و تاریخ</span>
                    </div>
                    <div className="flex flex-col gap-12">
                      <span>تصویب‌کننده نهایی (مدیرعامل)</span>
                      <div className="h-0.5 w-32 mx-auto border-b border-dashed border-slate-400"></div>
                      <span className="text-[10px] font-medium text-slate-400">مهر و امضای شرکت</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}

        {/* B. Template Selection Modal */}
        {isTemplateModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className={`w-full max-w-lg rounded-2xl shadow-2xl flex flex-col border p-5 ${
                isDarkMode ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-900"
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b dark:border-slate-800 mb-4">
                <span className="font-black text-sm flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  بارگذاری از الگوهای حسابداری پیش‌فرض
                </span>
                <button 
                  onClick={() => {
                    setIsTemplateModalOpen(false);
                    setTemplateAmount("");
                  }} 
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  بستن
                </button>
              </div>

              <div className="flex flex-col gap-4">
                <p className="text-[11px] leading-relaxed text-slate-400">
                  یکی از تراکنش‌های مالی متداول زیر را انتخاب کرده و مبلغ کل آن را وارد نمایید. سطرها به طور خودکار تراز و تنظیم می‌شوند.
                </p>

                <div>
                  <label className="block text-[10px] font-black mb-1.5 text-slate-400">مبلغ کل رویداد (ریال):</label>
                  <input 
                    type="number"
                    placeholder="مثال: 12000000"
                    value={templateAmount}
                    onChange={(e) => setTemplateAmount(e.target.value)}
                    className={`w-full px-3 py-1.5 rounded-lg text-xs font-mono font-bold border focus:outline-none focus:ring-1.5 focus:ring-indigo-500/50 ${
                      isDarkMode ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-white border-slate-300 text-slate-850"
                    }`}
                  />
                </div>

                <div className="flex flex-col gap-2 max-h-56 overflow-y-auto">
                  {VOUCHER_TEMPLATES.map(tmpl => (
                    <button
                      key={tmpl.id}
                      type="button"
                      disabled={!templateAmount || parseFloat(templateAmount) <= 0}
                      onClick={() => handleApplyTemplate(tmpl.id, templateAmount)}
                      className={`text-right p-3 rounded-xl border transition-all flex flex-col gap-1 ${
                        isDarkMode 
                          ? "bg-slate-950/50 border-slate-800 hover:bg-slate-800/40" 
                          : "bg-slate-50 border-slate-200 hover:bg-slate-100/70"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <span className="text-xs font-black text-indigo-400">{tmpl.name}</span>
                      <span className="text-[10px] opacity-70 leading-relaxed">{tmpl.description}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* C. Bulk Paste Import Modal */}
        {isBulkImportOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className={`w-full max-w-lg rounded-2xl shadow-2xl flex flex-col border p-5 ${
                isDarkMode ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-900"
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b dark:border-slate-800 mb-4">
                <span className="font-black text-sm flex items-center gap-1.5">
                  <PlusCircle className="w-4 h-4 text-blue-500" />
                  واردسازی دسته‌ای آرتیکل‌ها از فایل اکسل
                </span>
                <button 
                  onClick={() => {
                    setIsBulkImportOpen(false);
                    setImportText("");
                  }} 
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  بستن
                </button>
              </div>

              <div className="flex flex-col gap-4">
                <p className="text-[11px] leading-relaxed text-slate-400">
                  ستون‌های فایل اکسل را کپی کرده و در کادر زیر وارد کنید (یا به طور دستی با کاما یا کلید Tab جدا کنید).
                  <br />
                  <strong>ساختار ترتیب ستون‌ها:</strong> کد معین، کد تفصیلی، مبلغ بدهکار، بستانکار، شرح آرتیکل
                </p>

                <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 text-[10px] font-mono leading-relaxed text-slate-400">
                  مثال معتبر (کپی شده از فایل اکسل):
                  <br />
                  5010, , 1500000, 0, خرید زونکن دفتری
                  <br />
                  1010, d1, 0, 1500000, پرداخت از حساب سامان
                </div>

                <div>
                  <textarea 
                    rows={6}
                    placeholder="محل جای‌گذاری (Paste) ردیف‌ها..."
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg text-xs font-mono border focus:outline-none focus:ring-1.5 focus:ring-indigo-500/50 ${
                      isDarkMode ? "bg-slate-950 border-slate-800 text-slate-200 placeholder-slate-600" : "bg-white border-slate-300 text-slate-850"
                    }`}
                  />
                </div>

                <div className="flex items-center gap-2 justify-end">
                  <button 
                    onClick={() => {
                      setIsBulkImportOpen(false);
                      setImportText("");
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      isDarkMode 
                        ? "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800" 
                        : "bg-white border-slate-250 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    انصراف
                  </button>
                  <button 
                    onClick={handleParseBulkLines}
                    disabled={!importText.trim()}
                    className="disabled:opacity-50 disabled:cursor-not-allowed px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-md shadow-indigo-500/10"
                  >
                    تایید و اعمال سطرها
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
