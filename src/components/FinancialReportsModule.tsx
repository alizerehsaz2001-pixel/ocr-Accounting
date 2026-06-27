import React, { useState, useMemo } from "react";
import { 
  Columns, 
  BookOpen, 
  PieChart as PieChartIcon, 
  Database, 
  Zap, 
  FileCode, 
  CheckCircle, 
  ChevronLeft, 
  Calendar, 
  Filter, 
  ArrowLeftRight, 
  DollarSign, 
  TrendingUp, 
  Percent, 
  FileSpreadsheet, 
  Search, 
  RefreshCw, 
  HelpCircle,
  Download,
  AlertCircle,
  TrendingDown,
  Layers,
  ChevronRight,
  Info
} from "lucide-react";
import { SQL_ARCHITECTURAL_QUERIES } from "../lib/reporting";
import { 
  VoucherHeader, 
  VoucherLine, 
  VoucherStatus, 
  Account, 
  AccountLevel, 
  DetailedAccount 
} from "../lib/accounting";
import { motion, AnimatePresence } from "motion/react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from "recharts";
import * as XLSX from "xlsx";

interface FinancialReportsModuleProps {
  isDarkMode: boolean;
  onBack: () => void;
  showNotification: (text: string, type?: "success" | "error" | "info") => void;
}

type TabType = "dashboard" | "trial-balance" | "ledgers" | "balance-sheet" | "profit-and-loss" | "optimization";

// Default Fallbacks
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
  { id: "a1020", code: "1020", name: "حساب‌های دریافتنی", level: AccountLevel.SUBLEDGER, parent_id: "a10" },
  { id: "a2010", code: "2010", name: "حساب‌های پرداختنی", level: AccountLevel.SUBLEDGER, parent_id: "a20" },
  { id: "a5010", code: "5010", name: "هزینه ملزومات اداری", level: AccountLevel.SUBLEDGER, parent_id: "a50" },
  { id: "a5020", code: "5020", name: "هزینه حقوق و دستمزد پرسنل", level: AccountLevel.SUBLEDGER, parent_id: "a50" },
];

const INITIAL_VOUCHERS: VoucherHeader[] = [
  {
    id: "v101",
    voucher_number: 1,
    date: "1402/12/01",
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    status: VoucherStatus.PERMANENT,
    description: "بابت خرید ملزومات اداری دوره‌ای و پرداخت الکترونیکی از حساب بانک سامان",
    user_id: "u1"
  },
  {
    id: "v102",
    voucher_number: 2,
    date: "1402/12/05",
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    status: VoucherStatus.TEMPORARY,
    description: "بابت شناسایی و پرداخت علی‌الحساب حقوق پرسنل اداری",
    user_id: "u1"
  }
];

const INITIAL_LINES: VoucherLine[] = [
  { id: "l1", voucher_id: "v101", account_id: "a5010", debit: 5400000, credit: 0, description: "خرید زونکن، خودکار و کاغذ آ۴ شرکت" },
  { id: "l2", voucher_id: "v101", account_id: "a1010", debit: 0, credit: 5400000, description: "تسویه از بانک سامان" },
  { id: "l3", voucher_id: "v102", account_id: "a5020", debit: 120000000, credit: 0, description: "حقوق اساسی پرسنل" },
  { id: "l4", voucher_id: "v102", account_id: "a1010", debit: 0, credit: 120000000, description: "واریز به حساب بانک ملت پرسنل" },
];

export default function FinancialReportsModule({ isDarkMode, onBack, showNotification }: FinancialReportsModuleProps) {
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [showFriendlyReportGuide, setShowFriendlyReportGuide] = useState(true);

  // Filters State
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [includeDrafts, setIncludeDrafts] = useState<boolean>(false);
  const [includeTemporary, setIncludeTemporary] = useState<boolean>(true);
  const [includePermanent, setIncludePermanent] = useState<boolean>(true);

  // Drill-down State (for ledger viewing)
  const [selectedAccountId, setSelectedAccountId] = useState<string>("a1010");
  const [ledgerSearch, setLedgerSearch] = useState<string>("");

  // Load Data
  const accounts = useMemo<Account[]>(() => {
    const saved = localStorage.getItem("chart_of_accounts");
    return saved ? JSON.parse(saved) : DEFAULT_ACCOUNTS;
  }, []);

  const vouchers = useMemo<VoucherHeader[]>(() => {
    const saved = localStorage.getItem("vouchers_data");
    return saved ? JSON.parse(saved) : INITIAL_VOUCHERS;
  }, []);

  const allLines = useMemo<VoucherLine[]>(() => {
    const saved = localStorage.getItem("voucher_lines_data");
    return saved ? JSON.parse(saved) : INITIAL_LINES;
  }, []);

  const detailedAccounts = useMemo<DetailedAccount[]>(() => {
    const saved = localStorage.getItem("detailed_accounts");
    return saved ? JSON.parse(saved) : [];
  }, []);

  // 1. FILTER VOUCHERS based on filters
  const activeVouchers = useMemo(() => {
    return vouchers.filter(v => {
      const dateMatch = (!startDate || v.date >= startDate) && (!endDate || v.date <= endDate);
      let statusMatch = false;
      if (v.status === VoucherStatus.DRAFT && includeDrafts) statusMatch = true;
      if (v.status === VoucherStatus.TEMPORARY && includeTemporary) statusMatch = true;
      if (v.status === VoucherStatus.PERMANENT && includePermanent) statusMatch = true;
      if (v.status === "APPROVED" && includeTemporary) statusMatch = true;
      return dateMatch && statusMatch;
    });
  }, [vouchers, startDate, endDate, includeDrafts, includeTemporary, includePermanent]);

  // 2. OPENING VOUCHERS (vouchers before startDate)
  const openingVouchers = useMemo(() => {
    return vouchers.filter(v => {
      const dateBefore = startDate ? v.date < startDate : false;
      let statusMatch = false;
      if (v.status === VoucherStatus.DRAFT && includeDrafts) statusMatch = true;
      if (v.status === VoucherStatus.TEMPORARY && includeTemporary) statusMatch = true;
      if (v.status === VoucherStatus.PERMANENT && includePermanent) statusMatch = true;
      if (v.status === "APPROVED" && includeTemporary) statusMatch = true;
      return dateBefore && statusMatch;
    });
  }, [vouchers, startDate, includeDrafts, includeTemporary, includePermanent]);

  // 3. DYNAMIC 8-COLUMN TRIAL BALANCE CALCULATOR
  const trialBalanceData = useMemo(() => {
    const activeVoucherIds = new Set(activeVouchers.map(v => v.id));
    const openingVoucherIds = new Set(openingVouchers.map(v => v.id));

    const balanceMap: Record<string, {
      account_id: string;
      code: string;
      name: string;
      level: AccountLevel;
      parent_id: string | null;
      opening_debit: number;
      opening_credit: number;
      period_debit: number;
      period_credit: number;
      ytd_debit: number;
      ytd_credit: number;
      closing_balance_debit: number;
      closing_balance_credit: number;
    }> = {};

    // Initialize balance records for all accounts
    accounts.forEach(acc => {
      balanceMap[acc.id] = {
        account_id: acc.id,
        code: acc.code,
        name: acc.name,
        level: acc.level,
        parent_id: acc.parent_id,
        opening_debit: 0,
        opening_credit: 0,
        period_debit: 0,
        period_credit: 0,
        ytd_debit: 0,
        ytd_credit: 0,
        closing_balance_debit: 0,
        closing_balance_credit: 0,
      };
    });

    // Populate Subledgers first from voucher lines
    allLines.forEach(line => {
      const accBal = balanceMap[line.account_id];
      if (!accBal) return;

      const isOpening = openingVoucherIds.has(line.voucher_id);
      const isActive = activeVoucherIds.has(line.voucher_id);

      if (isOpening) {
        accBal.opening_debit += Number(line.debit) || 0;
        accBal.opening_credit += Number(line.credit) || 0;
      } else if (isActive) {
        accBal.period_debit += Number(line.debit) || 0;
        accBal.period_credit += Number(line.credit) || 0;
      }
    });

    // Roll-up from SUBLEDGER to LEDGER
    accounts.filter(a => a.level === AccountLevel.SUBLEDGER).forEach(sub => {
      const subBal = balanceMap[sub.id];
      if (!subBal || !sub.parent_id) return;
      
      const parentBal = balanceMap[sub.parent_id];
      if (parentBal) {
        parentBal.opening_debit += subBal.opening_debit;
        parentBal.opening_credit += subBal.opening_credit;
        parentBal.period_debit += subBal.period_debit;
        parentBal.period_credit += subBal.period_credit;
      }
    });

    // Roll-up from LEDGER to GROUP
    accounts.filter(a => a.level === AccountLevel.LEDGER).forEach(ledger => {
      const ledgerBal = balanceMap[ledger.id];
      if (!ledgerBal || !ledger.parent_id) return;

      const parentBal = balanceMap[ledger.parent_id];
      if (parentBal) {
        parentBal.opening_debit += ledgerBal.opening_debit;
        parentBal.opening_credit += ledgerBal.opening_credit;
        parentBal.period_debit += ledgerBal.period_debit;
        parentBal.period_credit += ledgerBal.period_credit;
      }
    });

    // Compute YTD and final balances for all
    Object.keys(balanceMap).forEach(id => {
      const bal = balanceMap[id];
      bal.ytd_debit = bal.opening_debit + bal.period_debit;
      bal.ytd_credit = bal.opening_credit + bal.period_credit;

      const netBalance = bal.ytd_debit - bal.ytd_credit;
      if (netBalance > 0) {
        bal.closing_balance_debit = netBalance;
        bal.closing_balance_credit = 0;
      } else {
        bal.closing_balance_credit = Math.abs(netBalance);
        bal.closing_balance_debit = 0;
      }
    });

    return balanceMap;
  }, [accounts, allLines, activeVouchers, openingVouchers]);

  const trialBalanceRows = useMemo(() => {
    return (Object.values(trialBalanceData) as any[]).sort((a, b) => a.code.localeCompare(b.code));
  }, [trialBalanceData]);

  // 4. DYNAMIC STANDARD BALANCE SHEET CALCULATOR
  const balanceSheetData = useMemo(() => {
    const bs = {
      assets: {
        current: [] as { name: string; code: string; amount: number }[],
        non_current: [] as { name: string; code: string; amount: number }[],
        total: 0
      },
      liabilities: {
        current: [] as { name: string; code: string; amount: number }[],
        non_current: [] as { name: string; code: string; amount: number }[],
        total: 0
      },
      equity: {
        items: [] as { name: string; code: string; amount: number }[],
        net_profit: 0,
        total: 0
      }
    };

    // Use only Subledger rows to compile the balance sheet sections to prevent double-counting
    const subledgerRows = trialBalanceRows.filter(r => r.level === AccountLevel.SUBLEDGER);

    let totalRevenues = 0;
    let totalExpenses = 0;

    subledgerRows.forEach(row => {
      const netBal = row.closing_balance_debit - row.closing_balance_credit;

      // Group 1: Assets
      if (row.code.startsWith("1")) {
        const amount = netBal; // Debit is positive for assets
        if (row.code.startsWith("10")) {
          bs.assets.current.push({ name: row.name, code: row.code, amount });
          bs.assets.total += amount;
        } else {
          bs.assets.non_current.push({ name: row.name, code: row.code, amount });
          bs.assets.total += amount;
        }
      }
      // Group 2: Liabilities
      else if (row.code.startsWith("2")) {
        const amount = -netBal; // Credit is positive for liabilities
        if (row.code.startsWith("20")) {
          bs.liabilities.current.push({ name: row.name, code: row.code, amount });
          bs.liabilities.total += amount;
        } else {
          bs.liabilities.non_current.push({ name: row.name, code: row.code, amount });
          bs.liabilities.total += amount;
        }
      }
      // Group 3: Equity
      else if (row.code.startsWith("3")) {
        const amount = -netBal; // Credit is positive for equity
        bs.equity.items.push({ name: row.name, code: row.code, amount });
        bs.equity.total += amount;
      }
      // Group 4: Revenues
      else if (row.code.startsWith("4")) {
        totalRevenues += (row.ytd_credit - row.ytd_debit);
      }
      // Group 5: Expenses
      else if (row.code.startsWith("5")) {
        totalExpenses += (row.ytd_debit - row.ytd_credit);
      }
    });

    // Net Profit/Loss is a reconciling item added to Equity
    const netProfit = totalRevenues - totalExpenses;
    bs.equity.net_profit = netProfit;
    bs.equity.total += netProfit;

    return bs;
  }, [trialBalanceRows]);

  // 5. DYNAMIC PROFIT AND LOSS STATEMENT CALCULATOR
  const profitAndLossData = useMemo(() => {
    const pl = {
      revenues: [] as { name: string; code: string; amount: number }[],
      expenses: [] as { name: string; code: string; amount: number }[],
      totalRevenues: 0,
      totalExpenses: 0,
      grossProfit: 0,
      netProfit: 0
    };

    const subledgerRows = trialBalanceRows.filter(r => r.level === AccountLevel.SUBLEDGER);

    subledgerRows.forEach(row => {
      // Group 4: Revenues
      if (row.code.startsWith("4")) {
        const amount = row.ytd_credit - row.ytd_debit;
        if (amount !== 0) {
          pl.revenues.push({ name: row.name, code: row.code, amount });
          pl.totalRevenues += amount;
        }
      }
      // Group 5: Expenses
      else if (row.code.startsWith("5")) {
        const amount = row.ytd_debit - row.ytd_credit;
        if (amount !== 0) {
          pl.expenses.push({ name: row.name, code: row.code, amount });
          pl.totalExpenses += amount;
        }
      }
    });

    pl.grossProfit = pl.totalRevenues;
    pl.netProfit = pl.totalRevenues - pl.totalExpenses;

    return pl;
  }, [trialBalanceRows]);

  // 6. DETAILED LEDGER DRILL-DOWN CALCULATOR
  const selectedAccountLedger = useMemo(() => {
    if (!selectedAccountId) return { opening_balance: 0, entries: [] };
    const targetAcc = accounts.find(a => a.id === selectedAccountId);
    if (!targetAcc) return { opening_balance: 0, entries: [] };

    // Get all nested subledger IDs for rollup inside the ledger view
    const getSubledgerIds = (accId: string): string[] => {
      const acc = accounts.find(a => a.id === accId);
      if (!acc) return [];
      if (acc.level === AccountLevel.SUBLEDGER) return [accId];
      
      const children = accounts.filter(a => a.parent_id === accId);
      return children.flatMap(child => getSubledgerIds(child.id));
    };

    const allowedSubledgerIds = new Set(getSubledgerIds(selectedAccountId));

    // Sort active vouchers chronologically
    const sortedVouchers = [...activeVouchers].sort((a, b) => 
      a.date.localeCompare(b.date) || a.voucher_number - b.voucher_number
    );

    // Opening balance calculation
    let openingBal = 0;
    const openingVoucherIds = new Set(openingVouchers.map(v => v.id));

    allLines.forEach(line => {
      if (allowedSubledgerIds.has(line.account_id)) {
        if (openingVoucherIds.has(line.voucher_id)) {
          openingBal += (Number(line.debit) || 0) - (Number(line.credit) || 0);
        }
      }
    });

    let runningBalance = openingBal;
    const entries: {
      date: string;
      voucher_number: number;
      description: string;
      debit: number;
      credit: number;
      running_balance: number;
    }[] = [];

    sortedVouchers.forEach(v => {
      const vLines = allLines.filter(l => l.voucher_id === v.id && allowedSubledgerIds.has(l.account_id));
      vLines.forEach(l => {
        const db = Number(l.debit) || 0;
        const cr = Number(l.credit) || 0;
        runningBalance += (db - cr);
        
        entries.push({
          date: v.date,
          voucher_number: v.voucher_number,
          description: l.description || v.description || "آرتیکل سند",
          debit: db,
          credit: cr,
          running_balance: runningBalance
        });
      });
    });

    return {
      opening_balance: openingBal,
      entries
    };
  }, [selectedAccountId, accounts, activeVouchers, openingVouchers, allLines]);

  const filteredLedgerEntries = useMemo(() => {
    if (!ledgerSearch.trim()) return selectedAccountLedger.entries;
    return selectedAccountLedger.entries.filter(e => 
      e.description.toLowerCase().includes(ledgerSearch.toLowerCase()) || 
      e.voucher_number.toString().includes(ledgerSearch)
    );
  }, [selectedAccountLedger, ledgerSearch]);

  // 7. COMPANY GENERAL JOURNAL (Sequenced entries)
  const dynamicJournal = useMemo(() => {
    const sortedVocs = [...activeVouchers].sort((a, b) => 
      a.date.localeCompare(b.date) || a.voucher_number - b.voucher_number
    );

    const journalEntries: {
      date: string;
      voucher_number: number;
      header_desc: string;
      account_code: string;
      account_name: string;
      line_desc: string;
      debit: number;
      credit: number;
    }[] = [];

    sortedVocs.forEach(v => {
      const vLines = allLines.filter(l => l.voucher_id === v.id);
      vLines.forEach(l => {
        const acc = accounts.find(a => a.id === l.account_id);
        journalEntries.push({
          date: v.date,
          voucher_number: v.voucher_number,
          header_desc: v.description,
          account_code: acc?.code || "نامشخص",
          account_name: acc?.name || "حساب حذف شده",
          line_desc: l.description,
          debit: Number(l.debit) || 0,
          credit: Number(l.credit) || 0
        });
      });
    });

    return journalEntries;
  }, [activeVouchers, allLines, accounts]);

  // 8. GRAPHICAL ANALYTICS METRICS (Pie and Bar charts data)
  const assetCompositionData = useMemo(() => {
    return [
      { name: "دارایی‌های جاری", value: Math.max(0, balanceSheetData.assets.current.reduce((s, a) => s + a.amount, 0)), color: "#3b82f6" },
      { name: "دارایی‌های ثابت", value: Math.max(0, balanceSheetData.assets.non_current.reduce((s, a) => s + a.amount, 0)), color: "#10b981" }
    ].filter(item => item.value > 0);
  }, [balanceSheetData]);

  const monthlyChartData = useMemo(() => {
    const monthsMap: Record<string, { name: string; درآمدها: number; هزینه‌ها: number }> = {};

    activeVouchers.forEach(v => {
      const monthStr = v.date.includes("/") 
        ? v.date.split("/").slice(0, 2).join("/") 
        : v.date.substring(0, 7); // "YYYY-MM" or "1402/12"
      
      if (!monthsMap[monthStr]) {
        monthsMap[monthStr] = { name: monthStr, درآمدها: 0, هزینه‌ها: 0 };
      }

      const vLines = allLines.filter(l => l.voucher_id === v.id);
      vLines.forEach(l => {
        const acc = accounts.find(a => a.id === l.account_id);
        if (!acc) return;

        const db = Number(l.debit) || 0;
        const cr = Number(l.credit) || 0;

        if (acc.code.startsWith("4")) {
          monthsMap[monthStr].درآمدها += (cr - db);
        } else if (acc.code.startsWith("5")) {
          monthsMap[monthStr].هزینه‌ها += (db - cr);
        }
      });
    });

    return Object.values(monthsMap).sort((a, b) => a.name.localeCompare(b.name));
  }, [activeVouchers, allLines, accounts]);

  // KPI Calculations
  const currentAssetsSum = useMemo(() => balanceSheetData.assets.current.reduce((s, a) => s + a.amount, 0), [balanceSheetData]);
  const currentLiabilitiesSum = useMemo(() => balanceSheetData.liabilities.current.reduce((s, a) => s + a.amount, 0), [balanceSheetData]);
  
  const currentRatio = useMemo(() => {
    if (currentLiabilitiesSum === 0) return currentAssetsSum > 0 ? 9.9 : 0;
    return parseFloat((currentAssetsSum / currentLiabilitiesSum).toFixed(2));
  }, [currentAssetsSum, currentLiabilitiesSum]);

  const workingCapital = useMemo(() => {
    return currentAssetsSum - currentLiabilitiesSum;
  }, [currentAssetsSum, currentLiabilitiesSum]);

  // Excel Downloads
  const downloadTrialBalanceExcel = () => {
    const excelRows = trialBalanceRows.map(r => ({
      "کد حساب": r.code,
      "نام حساب": r.name,
      "سطح حساب": r.level === "GROUP" ? "گروه" : r.level === "LEDGER" ? "کل" : "معین",
      "بدهکار قبل دوره (ریال)": r.opening_debit,
      "بستانکار قبل دوره (ریال)": r.opening_credit,
      "بدهکار طی دوره (ریال)": r.period_debit,
      "بستانکار طی دوره (ریال)": r.period_credit,
      "بدهکار تا کنون (ریال)": r.ytd_debit,
      "بستانکار تا کنون (ریال)": r.ytd_credit,
      "مانده نهایی بدهکار (ریال)": r.closing_balance_debit,
      "مانده نهایی بستانکار (ریال)": r.closing_balance_credit,
    }));
    const worksheet = XLSX.utils.json_to_sheet(excelRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "تراز آزمایشی ۸ ستونی");
    XLSX.writeFile(workbook, "Trial_Balance_Report.xlsx");
    showNotification("گزارش تراز آزمایشی به فرمت اکسل صادر گردید.", "success");
  };

  const downloadBalanceSheetExcel = () => {
    const assetItems = [
      ...balanceSheetData.assets.current.map(a => ({ "بخش": "دارایی جاری", "نام حساب": a.name, "کد": a.code, "مبلغ (ریال)": a.amount })),
      ...balanceSheetData.assets.non_current.map(a => ({ "بخش": "دارایی ثابت", "نام حساب": a.name, "کد": a.code, "مبلغ (ریال)": a.amount })),
      { "بخش": "جمع کل دارایی‌ها", "نام حساب": "-", "کد": "-", "مبلغ (ریال)": balanceSheetData.assets.total }
    ];

    const liabilityItems = [
      ...balanceSheetData.liabilities.current.map(l => ({ "بخش": "بدهی جاری", "نام حساب": l.name, "کد": l.code, "مبلغ (ریال)": l.amount })),
      ...balanceSheetData.liabilities.non_current.map(l => ({ "بخش": "بدهی بلندمدت", "نام حساب": l.name, "کد": l.code, "مبلغ (ریال)": l.amount })),
      ...balanceSheetData.equity.items.map(e => ({ "بخش": "حقوق صاحبان سهام", "نام حساب": e.name, "کد": e.code, "مبلغ (ریال)": e.amount })),
      { "بخش": "سود (زیان) خالص دوره جاری", "نام حساب": "-", "کد": "-", "مبلغ (ریال)": balanceSheetData.equity.net_profit },
      { "بخش": "جمع کل بدهی و حقوق سهامداران", "نام حساب": "-", "کد": "-", "مبلغ (ریال)": balanceSheetData.liabilities.total + balanceSheetData.equity.total }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(assetItems), "بخش دارایی‌ها");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(liabilityItems), "بخش بدهی و حقوق سهامداران");
    XLSX.writeFile(workbook, "Balance_Sheet_Report.xlsx");
    showNotification("گزارش ترازنامه به فرمت اکسل صادر گردید.", "success");
  };

  const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: "dashboard", label: "داشبورد و تحلیل نموداری", icon: PieChartIcon },
    { id: "trial-balance", label: "تراز آزمایشی (۸ ستونی)", icon: Columns },
    { id: "ledgers", label: "دفاتر قانونی (کل و معین)", icon: BookOpen },
    { id: "balance-sheet", label: "ترازنامه استاندارد", icon: PieChartIcon },
    { id: "profit-and-loss", label: "صورت سود و زیان", icon: TrendingUp },
    { id: "optimization", label: "بهینه‌سازی و معماری", icon: Database },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col max-w-7xl mx-auto w-full" dir="rtl">
      {/* Main Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 border-b dark:border-slate-800 pb-4">
        <div>
          <h2 className={`text-xl font-black tracking-tight mb-1 flex items-center gap-2 ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>
            <PieChartIcon className="w-5 h-5 text-indigo-500 animate-pulse" />
            توسعه‌یافته گزارش‌های مالی و ترازنامه‌ها
          </h2>
          <p className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
            داشبورد پیشرفته حسابداری، تراز آزمایشیRoll-up، صورت سود و زیان و بررسی توازن معادله حسابداری در لحظه
          </p>
        </div>
        <button 
          onClick={onBack} 
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border shrink-0 ${
            isDarkMode 
              ? "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800" 
              : "bg-white border-slate-250 text-slate-700 hover:bg-slate-50 shadow-xs"
          }`}
        >
          بازگشت به منوی اصلی
        </button>
      </div>

      {/* Advanced Global Filter Strip */}
      <div className={`p-4 rounded-2xl border mb-6 flex flex-col gap-4 ${
        isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-slate-50 border-slate-200"
      }`}>
        <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400">
          <Filter className="w-4 h-4" />
          تنظیم فیلترهای محاسباتی گزارش‌گیری (تغییر آنی تمام گزارشات)
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          <div>
            <label className="block text-[9px] font-bold text-slate-500 mb-1">از تاریخ رویداد مالی</label>
            <input 
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={`w-full px-3 py-1.5 rounded-lg text-xs border focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                isDarkMode ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-white border-slate-300 text-slate-800"
              }`}
            />
          </div>

          <div>
            <label className="block text-[9px] font-bold text-slate-500 mb-1">تا تاریخ رویداد مالی</label>
            <input 
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={`w-full px-3 py-1.5 rounded-lg text-xs border focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                isDarkMode ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-white border-slate-300 text-slate-800"
              }`}
            />
          </div>

          <div className="md:col-span-2 flex flex-wrap gap-4 items-center pt-4">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer">
              <input 
                type="checkbox"
                checked={includeDrafts}
                onChange={(e) => setIncludeDrafts(e.target.checked)}
                className="rounded border-slate-350 accent-indigo-600 text-indigo-600 w-4 h-4"
              />
              شامل اسناد پیش‌نویس
            </label>

            <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer">
              <input 
                type="checkbox"
                checked={includeTemporary}
                onChange={(e) => setIncludeTemporary(e.target.checked)}
                className="rounded border-slate-350 accent-indigo-600 text-indigo-600 w-4 h-4"
              />
              شامل اسناد موقت
            </label>

            <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer">
              <input 
                type="checkbox"
                checked={includePermanent}
                onChange={(e) => setIncludePermanent(e.target.checked)}
                className="rounded border-slate-350 accent-indigo-600 text-indigo-600 w-4 h-4"
              />
              شامل اسناد قطعی
            </label>
          </div>
        </div>
      </div>

      {/* Responsive Tab Bar */}
      <div className={`flex items-center overflow-x-auto gap-1 p-1 mb-6 rounded-xl border scrollbar-none ${
        isDarkMode ? "bg-slate-900/60 border-slate-800" : "bg-slate-100/60 border-slate-200"
      }`}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                isActive 
                  ? (isDarkMode ? "bg-slate-800 text-indigo-400 shadow-sm" : "bg-white text-indigo-600 shadow-sm border border-slate-250") 
                  : (isDarkMode ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50")
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="flex-1 flex flex-col"
          >
            {/* TAB 1: DASHBOARD */}
            {activeTab === "dashboard" && (
              <div className="flex flex-col gap-6">
                {/* 4 KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  <div className={`p-4 rounded-2xl border flex items-center justify-between shadow-xs ${
                    isDarkMode ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-200"
                  }`}>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400">سود خالص کل دوره (محاسباتی)</span>
                      <div className={`text-lg font-mono font-black mt-1 flex items-center gap-1.5 ${
                        profitAndLossData.netProfit >= 0 ? "text-emerald-500" : "text-rose-500"
                      }`}>
                        {profitAndLossData.netProfit >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        {profitAndLossData.netProfit.toLocaleString()}
                        <span className="text-[10px] font-sans font-medium text-slate-500">ریال</span>
                      </div>
                      <p className="text-[9px] text-slate-400 mt-1">تفاضل درآمدهای ثبت شده از هزینه‌ها</p>
                    </div>
                  </div>

                  <div className={`p-4 rounded-2xl border flex items-center justify-between shadow-xs ${
                    isDarkMode ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-200"
                  }`}>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400">نسبت جاری (نقدینگی)</span>
                      <div className={`text-lg font-mono font-black mt-1 flex items-center gap-1.5 ${
                        currentRatio >= 1.5 ? "text-indigo-500" : currentRatio > 0 ? "text-amber-500" : "text-slate-400"
                      }`}>
                        <Percent className="w-4 h-4" />
                        {currentRatio} : ۱
                      </div>
                      <p className="text-[9px] text-slate-400 mt-1">دارایی جاری تقسیم بر بدهی جاری (هدف: &gt; ۱.۵)</p>
                    </div>
                  </div>

                  <div className={`p-4 rounded-2xl border flex items-center justify-between shadow-xs ${
                    isDarkMode ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-200"
                  }`}>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400">سرمایه در گردش (Working Capital)</span>
                      <div className={`text-lg font-mono font-black mt-1 flex items-center gap-1.5 ${
                        workingCapital >= 0 ? "text-emerald-500" : "text-rose-500"
                      }`}>
                        <ArrowLeftRight className="w-4 h-4" />
                        {workingCapital.toLocaleString()}
                        <span className="text-[10px] font-sans font-medium text-slate-500">ریال</span>
                      </div>
                      <p className="text-[9px] text-slate-400 mt-1">سپر ایمنی نقدینگی عملیاتی برای پرداختها</p>
                    </div>
                  </div>

                  <div className={`p-4 rounded-2xl border flex items-center justify-between shadow-xs ${
                    isDarkMode ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-200"
                  }`}>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400">توازن معادله ترازنامه</span>
                      <div className="flex items-center gap-1.5 mt-2">
                        {Math.abs(balanceSheetData.assets.total - (balanceSheetData.liabilities.total + balanceSheetData.equity.total)) < 0.1 ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-emerald-500 animate-bounce" />
                            <span className="text-xs font-black text-emerald-500">کاملاً تراز و متوازن</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-4 h-4 text-rose-500" />
                            <span className="text-xs font-black text-rose-500">عدم توازن ترازنامه!</span>
                          </>
                        )}
                      </div>
                      <p className="text-[9px] text-slate-400 mt-1">دارایی برابر با بدهی بعلاوه سرمایه است</p>
                    </div>
                  </div>
                </div>

                {/* Dashboard Charts Panel */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Monthly Trend BarChart */}
                  <div className={`p-5 rounded-2xl border lg:col-span-2 ${
                    isDarkMode ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-200 shadow-sm"
                  }`}>
                    <h3 className={`text-xs font-black mb-4 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>تحلیل ماهانه درآمدها و هزینه‌ها (مقایسه‌ای)</h3>
                    <div className="h-72" dir="ltr">
                      {monthlyChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={monthlyChartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#1e293b" : "#f1f5f9"} />
                            <XAxis dataKey="name" stroke={isDarkMode ? "#94a3b8" : "#64748b"} fontSize={11} />
                            <YAxis stroke={isDarkMode ? "#94a3b8" : "#64748b"} fontSize={11} />
                            <RechartsTooltip 
                              contentStyle={{ 
                                backgroundColor: isDarkMode ? "#0f172a" : "#ffffff",
                                borderColor: isDarkMode ? "#334155" : "#cbd5e1",
                                color: isDarkMode ? "#f8fafc" : "#0f172a",
                                textAlign: "right"
                              }}
                            />
                            <Legend />
                            <Bar dataKey="درآمدها" fill="#10b981" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="هزینه‌ها" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">
                          داده‌ای برای نمایش نمودار درآمد/هزینه وجود ندارد. ابتدا اسنادی با سرفصل گروه ۴ یا ۵ ثبت کنید.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Asset Allocation PieChart */}
                  <div className={`p-5 rounded-2xl border ${
                    isDarkMode ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-200 shadow-sm"
                  }`}>
                    <h3 className={`text-xs font-black mb-4 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>ترکیب ساختاری دارایی‌های جاری و ثابت</h3>
                    <div className="h-72 flex flex-col justify-center items-center">
                      {assetCompositionData.length > 0 ? (
                        <>
                          <div className="w-full h-52" dir="ltr">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={assetCompositionData}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={60}
                                  outerRadius={80}
                                  paddingAngle={4}
                                  dataKey="value"
                                >
                                  {assetCompositionData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Pie>
                                <RechartsTooltip 
                                  formatter={(val: number) => `${val.toLocaleString()} ریال`}
                                  contentStyle={{ 
                                    backgroundColor: isDarkMode ? "#0f172a" : "#ffffff",
                                    borderColor: isDarkMode ? "#334155" : "#cbd5e1"
                                  }}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="flex gap-4 text-[10px] font-bold">
                            {assetCompositionData.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-1.5">
                                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
                                <span className="text-slate-500 dark:text-slate-400">{item.name}</span>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="text-xs text-slate-400 italic text-center">
                          هیچ دارایی مثبتی برای رسم نمودار ترکیب وجود ندارد.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Voucher stats indicator */}
                <div className={`p-5 rounded-2xl border ${
                  isDarkMode ? "bg-indigo-950/15 border-indigo-900/40 text-indigo-300" : "bg-indigo-50 border-indigo-150 text-indigo-800"
                }`}>
                  <h4 className="text-xs font-bold mb-1 flex items-center gap-1">
                    <Info className="w-4 h-4 text-indigo-500" />
                    راهنمای یکپارچگی دفاتر دوبل مالی
                  </h4>
                  <p className="text-[10px] leading-relaxed">
                    تمام محاسبات این داشبورد به صورت مستقیم و در لحظه از تحلیل آرتیکل‌های سند (Voucher Lines) ذخیره‌شده در سیستم استخراج می‌شوند. برای افزودن یا تغییر اسناد می‌توانید از منوی بالا گزینه «صدور سند جدید» را انتخاب کنید. با قفل یا تأیید هر سند، تراز آزمایشی و ترازنامه متناسب با کدهای کل و معین فورا آپدیت می‌گردند.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 2: TRIAL BALANCE */}
            {activeTab === "trial-balance" && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">گزارش تراز آزمایشی تفصیلی و تجمیعی (Roll-up خودکار)</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={downloadTrialBalanceExcel} 
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1.5 ${
                        isDarkMode 
                          ? "bg-slate-900 hover:bg-slate-800 border-slate-800 text-emerald-400" 
                          : "bg-white hover:bg-slate-50 border-slate-250 text-emerald-700 shadow-xs"
                      }`}
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" /> دانلود اکسل
                    </button>
                  </div>
                </div>

                <div className={`rounded-2xl border overflow-hidden ${
                  isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200"
                }`}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-[11px] min-w-[950px]">
                      <thead className={`font-bold border-b ${
                        isDarkMode ? "bg-slate-950/80 text-slate-400 border-slate-800" : "bg-slate-50 text-slate-600 border-slate-200"
                      }`}>
                        <tr>
                          <th className="px-4 py-3 w-16" rowSpan={2}>کد حساب</th>
                          <th className="px-4 py-3" rowSpan={2}>عنوان حساب سرفصل</th>
                          <th className="px-3 py-1.5 text-center border-r dark:border-slate-850" colSpan={2}>قبل از دوره</th>
                          <th className="px-3 py-1.5 text-center border-r dark:border-slate-850" colSpan={2}>طی دوره</th>
                          <th className="px-3 py-1.5 text-center border-r dark:border-slate-850" colSpan={2}>گردش تا کنون</th>
                          <th className="px-3 py-1.5 text-center border-r dark:border-slate-850" colSpan={2}>مانده نهایی</th>
                        </tr>
                        <tr className="border-t dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900/50 text-[10px]">
                          <th className="px-2 py-2 text-center border-r dark:border-slate-850 text-blue-600 dark:text-blue-400">بدهکار</th>
                          <th className="px-2 py-2 text-center text-red-600 dark:text-red-400">بستانکار</th>
                          <th className="px-2 py-2 text-center border-r dark:border-slate-850 text-blue-600 dark:text-blue-400">بدهکار</th>
                          <th className="px-2 py-2 text-center text-red-600 dark:text-red-400">بستانکار</th>
                          <th className="px-2 py-2 text-center border-r dark:border-slate-850 text-blue-600 dark:text-blue-400">بدهکار</th>
                          <th className="px-2 py-2 text-center text-red-600 dark:text-red-400">بستانکار</th>
                          <th className="px-2 py-2 text-center border-r dark:border-slate-850 text-blue-600 dark:text-blue-400 font-bold">بدهکار</th>
                          <th className="px-2 py-2 text-center text-red-600 dark:text-red-400 font-bold">بستانکار</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono">
                        {trialBalanceRows.map((row, idx) => {
                          const isGroup = row.level === AccountLevel.GROUP;
                          const isLedger = row.level === AccountLevel.LEDGER;

                          return (
                            <tr 
                              key={idx} 
                              onClick={() => {
                                setSelectedAccountId(row.account_id);
                                setActiveTab("ledgers");
                                showNotification(`دفتر معین/کل حساب ${row.name} بارگذاری شد.`, "info");
                              }}
                              className={`group cursor-pointer transition-colors ${
                                isGroup 
                                  ? (isDarkMode ? "bg-slate-850 text-slate-100 font-black" : "bg-slate-100 text-slate-900 font-black") 
                                  : isLedger 
                                    ? (isDarkMode ? "bg-slate-900/50 text-slate-200 font-bold" : "bg-slate-50 text-slate-800 font-bold") 
                                    : (isDarkMode ? "text-slate-400 hover:bg-slate-800/40" : "text-slate-600 hover:bg-indigo-50/50")
                              }`}
                            >
                              <td className="px-4 py-2.5 font-bold">{row.code}</td>
                              <td className={`px-4 py-2.5 font-sans flex items-center gap-1.5 ${
                                isGroup ? "" : isLedger ? "pr-6" : "pr-10"
                              }`}>
                                {!isGroup && !isLedger && <span className="text-[9px] text-indigo-500"> معین •</span>}
                                {row.name}
                                {!isGroup && !isLedger && (
                                  <span className="text-[8px] font-bold text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                    (جهت مشاهده دفتر کل کلیک کنید)
                                  </span>
                                )}
                              </td>
                              
                              <td className="px-2 py-2.5 text-center border-r dark:border-slate-850/50 text-slate-500">
                                {row.opening_debit > 0 ? row.opening_debit.toLocaleString() : "-"}
                              </td>
                              <td className="px-2 py-2.5 text-center text-slate-500">
                                {row.opening_credit > 0 ? row.opening_credit.toLocaleString() : "-"}
                              </td>
                              
                              <td className="px-2 py-2.5 text-center border-r dark:border-slate-850/50">
                                {row.period_debit > 0 ? row.period_debit.toLocaleString() : "-"}
                              </td>
                              <td className="px-2 py-2.5 text-center">
                                {row.period_credit > 0 ? row.period_credit.toLocaleString() : "-"}
                              </td>
                              
                              <td className="px-2 py-2.5 text-center border-r dark:border-slate-850/50 text-slate-500">
                                {row.ytd_debit > 0 ? row.ytd_debit.toLocaleString() : "-"}
                              </td>
                              <td className="px-2 py-2.5 text-center text-slate-500">
                                {row.ytd_credit > 0 ? row.ytd_credit.toLocaleString() : "-"}
                              </td>
                              
                              <td className="px-2 py-2.5 text-center border-r dark:border-slate-850/50 font-bold text-blue-600 dark:text-blue-400">
                                {row.closing_balance_debit > 0 ? row.closing_balance_debit.toLocaleString() : "-"}
                              </td>
                              <td className="px-2 py-2.5 text-center font-bold text-red-600 dark:text-red-400">
                                {row.closing_balance_credit > 0 ? row.closing_balance_credit.toLocaleString() : "-"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Trial balance explanation */}
                <div className={`p-4 rounded-xl text-xs leading-relaxed ${
                  isDarkMode ? "bg-slate-900/60 text-slate-400 border border-slate-800" : "bg-slate-50 text-slate-600 border border-slate-200"
                }`}>
                  <strong>ویژگی تراز عطف هوشمند:</strong> تراز آزمایشی فوق به صورت زنده کلیک‌شدنی است. بر روی هر سطر کلیک کنید، سیستم به طور خودکار به سربرگ «دفاتر قانونی» هدایت شده و جزئیات تراکنش‌های آن حساب را با مانده لحظه‌ای ترسیم می‌کند.
                </div>
              </div>
            )}

            {/* TAB 3: LEDGERS */}
            {activeTab === "ledgers" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Left Side: Account Select and stats */}
                <div className="flex flex-col gap-4">
                  <div className={`p-5 rounded-2xl border ${
                    isDarkMode ? "bg-slate-900/50 border-slate-850" : "bg-white border-slate-200 shadow-xs"
                  }`}>
                    <h3 className="text-xs font-black mb-3 text-slate-400">انتخاب حساب معین یا کل</h3>
                    <div className="flex flex-col gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">فیلتر سرفصل حساب</label>
                        <select 
                          value={selectedAccountId}
                          onChange={(e) => setSelectedAccountId(e.target.value)}
                          className={`w-full p-2.5 rounded-xl text-xs border focus:outline-none focus:ring-1.5 focus:ring-indigo-500/50 ${
                            isDarkMode ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-white border-slate-300 text-slate-800"
                          }`}
                        >
                          {accounts.map(acc => (
                            <option key={acc.id} value={acc.id}>
                              {acc.code} - {acc.name} ({acc.level === "GROUP" ? "گروه" : acc.level === "LEDGER" ? "کل" : "معین"})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="relative">
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">جستجوی شرح آرتیکل</label>
                        <span className="absolute right-3 top-7 text-slate-400">
                          <Search className="w-3.5 h-3.5" />
                        </span>
                        <input 
                          type="text"
                          placeholder="تراکنش خاصی را بیابید..."
                          value={ledgerSearch}
                          onChange={(e) => setLedgerSearch(e.target.value)}
                          className={`w-full pr-9 pl-3 py-2 rounded-xl text-xs border focus:outline-none ${
                            isDarkMode ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-white border-slate-300 text-slate-800"
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Quick stats for ledger */}
                  <div className={`p-5 rounded-2xl border ${
                    isDarkMode ? "bg-slate-900/40 border-slate-850" : "bg-indigo-50/30 border-indigo-100"
                  }`}>
                    <h4 className="text-xs font-black mb-3 text-indigo-500">خلاصه دفاتر حساب جاری</h4>
                    <div className="space-y-2.5 text-xs">
                      <div className="flex justify-between items-center text-slate-500">
                        <span>مانده ابتدای دوره:</span>
                        <span className="font-mono text-slate-700 dark:text-slate-300">{selectedAccountLedger.opening_balance.toLocaleString()} ریال</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-500">
                        <span>گردش بدهکار طی دوره:</span>
                        <span className="font-mono text-emerald-500 font-bold">
                          +{selectedAccountLedger.entries.reduce((s, e) => s + e.debit, 0).toLocaleString()} ریال
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-slate-500">
                        <span>گردش بستانکار طی دوره:</span>
                        <span className="font-mono text-rose-500 font-bold">
                          -{selectedAccountLedger.entries.reduce((s, e) => s + e.credit, 0).toLocaleString()} ریال
                        </span>
                      </div>
                      <div className="border-t pt-2 mt-2 flex justify-between items-center font-bold text-slate-800 dark:text-slate-100">
                        <span>مانده پایان دوره جاری:</span>
                        <span className="font-mono text-indigo-500">
                          {selectedAccountLedger.entries.length > 0 
                            ? selectedAccountLedger.entries[selectedAccountLedger.entries.length - 1].running_balance.toLocaleString() 
                            : selectedAccountLedger.opening_balance.toLocaleString()} ریال
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side: Ledger entries table */}
                <div className="lg:col-span-2 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400">نمایش ریز تراکنش‌ها و مانده لحظه‌ای (Running Balance)</span>
                  </div>

                  <div className={`rounded-2xl border overflow-hidden ${
                    isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200 shadow-xs"
                  }`}>
                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-[11px] min-w-[500px]">
                        <thead className={`font-bold border-b ${
                          isDarkMode ? "bg-slate-950/80 text-slate-400 border-slate-800" : "bg-slate-50 text-slate-600 border-slate-200"
                        }`}>
                          <tr>
                            <th className="px-3 py-3 w-20">تاریخ</th>
                            <th className="px-3 py-3 w-16 text-center">شماره سند</th>
                            <th className="px-3 py-3">شرح آرتیکل سند</th>
                            <th className="px-3 py-3 w-24 text-left text-blue-600 dark:text-blue-400">بدهکار</th>
                            <th className="px-3 py-3 w-24 text-left text-red-600 dark:text-red-400">بستانکار</th>
                            <th className="px-3 py-3 w-28 text-left text-emerald-500">مانده لحظه‌ای</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono">
                          {/* Opening Balance Row */}
                          <tr className={isDarkMode ? "bg-slate-900/30 text-slate-400" : "bg-slate-50 text-slate-500"}>
                            <td className="px-3 py-2.5 font-sans" colSpan={3}>مانده اول دوره (انتقالی از اسناد قبل)</td>
                            <td className="px-3 py-2.5 text-left">-</td>
                            <td className="px-3 py-2.5 text-left">-</td>
                            <td className="px-3 py-2.5 text-left font-bold" dir="ltr">{selectedAccountLedger.opening_balance.toLocaleString()}</td>
                          </tr>

                          {filteredLedgerEntries.map((row, idx) => (
                            <tr key={idx} className={`hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-colors ${
                              isDarkMode ? "text-slate-300" : "text-slate-700"
                            }`}>
                              <td className="px-3 py-2.5">{row.date}</td>
                              <td className="px-3 py-2.5 text-center text-slate-400 font-bold">#{row.voucher_number}</td>
                              <td className="px-3 py-2.5 font-sans text-xs">{row.description}</td>
                              <td className="px-3 py-2.5 text-left text-blue-600 dark:text-blue-400">
                                {row.debit > 0 ? row.debit.toLocaleString() : "-"}
                              </td>
                              <td className="px-3 py-2.5 text-left text-red-600 dark:text-red-400">
                                {row.credit > 0 ? row.credit.toLocaleString() : "-"}
                              </td>
                              <td className="px-3 py-2.5 text-left font-bold" dir="ltr">
                                {row.running_balance.toLocaleString()}
                              </td>
                            </tr>
                          ))}

                          {filteredLedgerEntries.length === 0 && (
                            <tr>
                              <td colSpan={6} className="px-3 py-10 text-center text-slate-400 italic">
                                هیچ تراکنشی برای حساب انتخاب شده در این بازه یافت نگردید.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: BALANCE SHEET */}
            {activeTab === "balance-sheet" && (
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500">ترازنامه مالی منطبق بر استانداردهای گزارش‌گری دوبل</span>
                    <button
                      onClick={() => setShowFriendlyReportGuide(!showFriendlyReportGuide)}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 flex items-center gap-1 hover:bg-indigo-500/20 transition-all"
                    >
                      <Info className="w-3.5 h-3.5" />
                      {showFriendlyReportGuide ? "پنهان‌سازی آموزش ساده" : "آموزش ساده ترازنامه"}
                    </button>
                  </div>
                  <button 
                    onClick={downloadBalanceSheetExcel} 
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1.5 ${
                      isDarkMode 
                        ? "bg-slate-900 hover:bg-slate-800 border-slate-800 text-emerald-400" 
                        : "bg-white hover:bg-slate-50 border-slate-250 text-emerald-700 shadow-xs"
                    }`}
                  >
                    <Download className="w-3.5 h-3.5" /> دانلود اکسل ترازنامه
                  </button>
                </div>

                {/* Friendly Report Guide Block */}
                {showFriendlyReportGuide && (
                  <div className={`p-5 rounded-2xl border transition-all ${
                    isDarkMode ? "bg-indigo-950/15 border-indigo-900/40 text-slate-200" : "bg-indigo-50/40 border-indigo-100 text-slate-800"
                  }`}>
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 shrink-0 mt-0.5">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-sm text-indigo-600 dark:text-indigo-400 mb-2 flex items-center gap-1.5">
                          💼 راهنمای خودمانی: «ترازنامه» به زبان عامیانه چیست؟
                        </h3>
                        <p className="text-xs leading-relaxed opacity-90 mb-3">
                          ترازنامه مثل یک <strong>«عکس فوری»</strong> از وضعیت سلامتی مالی شرکت یا مغازه شما در همین لحظه است. ترازنامه از یک قانون بسیار ساده و همیشگی پیروی می‌کند:
                        </p>
                        <div className="my-3 text-center py-2.5 px-4 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-black rounded-xl border border-indigo-500/20 text-xs md:text-sm tracking-wide">
                          ⚖️ دارایی‌های شما (راست) = بدهی‌های شما + سرمایه شخصی شما (چپ)
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                          <div className={`p-3 rounded-xl border ${isDarkMode ? "bg-slate-950/40 border-slate-850" : "bg-white border-slate-100"}`}>
                            <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 mb-1.5">🟢 دارایی‌ها (هر چه که داریم)</span>
                            <p className="text-[11px] leading-relaxed opacity-85">
                              وسایل، صندلی، موجودی انبار، پول نقد توی بانک یا کارتخوان، و طلب‌هایی که باید از مشتریان بگیریم.
                            </p>
                          </div>

                          <div className={`p-3 rounded-xl border ${isDarkMode ? "bg-slate-950/40 border-slate-850" : "bg-white border-slate-100"}`}>
                            <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-500 mb-1.5">🔴 بدهی‌ها (پول‌های دیگران)</span>
                            <p className="text-[11px] leading-relaxed opacity-85">
                              وام‌های بانکی، چکی که دست مردم داریم، یا خریدهای نسیه که باید پولشان را به تامین‌کننده‌ها بدهیم.
                            </p>
                          </div>

                          <div className={`p-3 rounded-xl border ${isDarkMode ? "bg-slate-950/40 border-slate-850" : "bg-white border-slate-100"}`}>
                            <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 mb-1.5">🔵 سرمایه شما (مالکیت واقعی)</span>
                            <p className="text-[11px] leading-relaxed opacity-85">
                              پولی که خودتان اول کار گذاشته‌اید به علاوه سود انباشته‌ای که در مغازه مانده و خرج نشده است.
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/15 text-[11px] leading-relaxed">
                          <strong>🚗 مثال ملموس خودرو قسطی:</strong> فرض کنید یک ماشین خریده‌اید به ارزش ۲۰۰ میلیون تومان (<strong>دارایی شما</strong>). برای خرید آن ۵۰ میلیون تومان وام گرفته‌اید (<strong>بدهی شما</strong>) و ۱۵۰ میلیون تومان هم از جیب خودتان داده‌اید (<strong>سرمایه شما</strong>). ماشین ۲۰۰ میلیونی دقیقاً با مجموع وام ۵۰ میلیونی و پول شخصی ۱۵۰ میلیونی برابر است! ترازنامه یعنی همین!
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className={`p-5 rounded-2xl border ${
                  isDarkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200 shadow-xs"
                }`}>
                  <div className="flex flex-col md:flex-row items-center justify-between border-b dark:border-slate-850 pb-4 mb-6">
                    <div>
                      <h3 className={`text-base font-black ${isDarkMode ? "text-slate-100" : "text-slate-800"}`}>ترازنامه استاندارد دوره مالی</h3>
                      <p className="text-[10px] text-slate-400 mt-1">برقراری موازنه منابع و مصارف بر پایه تراز آزمایشی</p>
                    </div>
                    <div className="mt-3 md:mt-0">
                      {Math.abs(balanceSheetData.assets.total - (balanceSheetData.liabilities.total + balanceSheetData.equity.total)) < 0.1 ? (
                        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5" /> ترازنامه متوازن است
                        </div>
                      ) : (
                        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-500 text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5" /> مغایرت ترازنامه! اختلاف: {(balanceSheetData.assets.total - (balanceSheetData.liabilities.total + balanceSheetData.equity.total)).toLocaleString()} ریال
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    {/* ASSETS column (Right side) */}
                    <div className="flex flex-col gap-4">
                      <div className={`p-4 rounded-xl border ${isDarkMode ? "bg-emerald-950/10 border-emerald-900/30" : "bg-emerald-50/50 border-emerald-100"}`}>
                        <h4 className={`text-xs font-black pb-2 border-b border-emerald-200 dark:border-emerald-900/50 mb-3 flex justify-between ${
                          isDarkMode ? "text-emerald-400" : "text-emerald-800"
                        }`}>
                          <span>دارایی‌ها (مصارف منابع)</span>
                          <span className="font-mono">مبلغ (ریال)</span>
                        </h4>

                        <div className="space-y-4">
                          <div>
                            <span className="text-[10px] font-black text-slate-400">دارایی‌های جاری:</span>
                            <ul className="space-y-2 mt-2 font-mono text-xs">
                              {balanceSheetData.assets.current.map((item, index) => (
                                <li key={index} className="flex justify-between items-center">
                                  <span className="font-sans text-slate-600 dark:text-slate-300">{item.code} - {item.name}</span>
                                  <span className="text-slate-800 dark:text-slate-200">{item.amount.toLocaleString()}</span>
                                </li>
                              ))}
                              {balanceSheetData.assets.current.length === 0 && (
                                <li className="text-[10px] italic text-slate-400">هیچ دارایی جاری ثبت نشده است.</li>
                              )}
                            </ul>
                          </div>

                          <div className="border-t pt-3 border-emerald-200 dark:border-emerald-900/30">
                            <span className="text-[10px] font-black text-slate-400">دارایی‌های ثابت (غیرجاری):</span>
                            <ul className="space-y-2 mt-2 font-mono text-xs">
                              {balanceSheetData.assets.non_current.map((item, index) => (
                                <li key={index} className="flex justify-between items-center">
                                  <span className="font-sans text-slate-600 dark:text-slate-300">{item.code} - {item.name}</span>
                                  <span className="text-slate-800 dark:text-slate-200">{item.amount.toLocaleString()}</span>
                                </li>
                              ))}
                              {balanceSheetData.assets.non_current.length === 0 && (
                                <li className="text-[10px] italic text-slate-400">هیچ دارایی ثابتی ثبت نشده است.</li>
                              )}
                            </ul>
                          </div>

                          <div className="border-t pt-3 mt-4 border-emerald-300 dark:border-emerald-500/20 flex justify-between items-center font-black text-emerald-600 dark:text-emerald-400">
                            <span>جمع کل دارایی‌ها:</span>
                            <span>{balanceSheetData.assets.total.toLocaleString()} ریال</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* LIABILITIES & EQUITY column (Left side) */}
                    <div className="flex flex-col gap-4">
                      {/* Liabilities Section */}
                      <div className={`p-4 rounded-xl border ${isDarkMode ? "bg-red-950/10 border-red-900/30" : "bg-red-50/50 border-red-100"}`}>
                        <h4 className={`text-xs font-black pb-2 border-b border-red-200 dark:border-red-900/50 mb-3 flex justify-between ${
                          isDarkMode ? "text-red-400" : "text-red-800"
                        }`}>
                          <span>بدهی‌ها (تعهدات مالی)</span>
                          <span className="font-mono">مبلغ (ریال)</span>
                        </h4>

                        <div className="space-y-4">
                          <div>
                            <span className="text-[10px] font-black text-slate-400">بدهی‌های جاری:</span>
                            <ul className="space-y-2 mt-2 font-mono text-xs">
                              {balanceSheetData.liabilities.current.map((item, index) => (
                                <li key={index} className="flex justify-between items-center">
                                  <span className="font-sans text-slate-600 dark:text-slate-300">{item.code} - {item.name}</span>
                                  <span className="text-slate-800 dark:text-slate-200">{item.amount.toLocaleString()}</span>
                                </li>
                              ))}
                              {balanceSheetData.liabilities.current.length === 0 && (
                                <li className="text-[10px] italic text-slate-400">هیچ بدهی جاری ثبت نشده است.</li>
                              )}
                            </ul>
                          </div>

                          <div className="border-t pt-3 mt-4 border-red-300 dark:border-red-500/20 flex justify-between items-center font-black text-red-600 dark:text-red-400">
                            <span>جمع کل بدهی‌ها:</span>
                            <span>{balanceSheetData.liabilities.total.toLocaleString()} ریال</span>
                          </div>
                        </div>
                      </div>

                      {/* Equity Section */}
                      <div className={`p-4 rounded-xl border ${isDarkMode ? "bg-blue-950/10 border-blue-900/30" : "bg-blue-50/50 border-blue-100"}`}>
                        <h4 className={`text-xs font-black pb-2 border-b border-blue-200 dark:border-blue-900/50 mb-3 flex justify-between ${
                          isDarkMode ? "text-blue-400" : "text-blue-800"
                        }`}>
                          <span>حقوق صاحبان سهام (سرمایه سهامداران)</span>
                          <span className="font-mono">مبلغ (ریال)</span>
                        </h4>

                        <div className="space-y-4">
                          <ul className="space-y-2 font-mono text-xs">
                            {balanceSheetData.equity.items.map((item, index) => (
                              <li key={index} className="flex justify-between items-center">
                                <span className="font-sans text-slate-600 dark:text-slate-300">{item.code} - {item.name}</span>
                                <span className="text-slate-800 dark:text-slate-200">{item.amount.toLocaleString()}</span>
                              </li>
                            ))}
                            {/* Computed Profit/Loss */}
                            <li className="flex justify-between items-center font-bold text-indigo-500">
                              <span className="font-sans">سود (زیان) خالص دوره جاری (محاسباتی)</span>
                              <span>{balanceSheetData.equity.net_profit.toLocaleString()}</span>
                            </li>
                          </ul>

                          <div className="border-t pt-3 mt-4 border-blue-300 dark:border-blue-500/20 flex justify-between items-center font-black text-blue-600 dark:text-blue-400">
                            <span>جمع کل حقوق صاحبان سهام:</span>
                            <span>{balanceSheetData.equity.total.toLocaleString()} ریال</span>
                          </div>
                        </div>
                      </div>

                      {/* Total balance equivalence checking */}
                      <div className={`p-3.5 rounded-xl border-2 flex justify-between items-center font-black ${
                        Math.abs(balanceSheetData.assets.total - (balanceSheetData.liabilities.total + balanceSheetData.equity.total)) < 0.1
                          ? (isDarkMode ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-emerald-300 bg-emerald-50 text-emerald-800")
                          : (isDarkMode ? "border-rose-500/30 bg-rose-500/10 text-rose-400" : "border-rose-300 bg-rose-50 text-rose-800")
                      }`}>
                        <span>جمع بدهی‌ها و حقوق صاحبان سهام:</span>
                        <span>{(balanceSheetData.liabilities.total + balanceSheetData.equity.total).toLocaleString()} ریال</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: PROFIT AND LOSS STATEMENT */}
            {activeTab === "profit-and-loss" && (
              <div className="flex flex-col gap-6">
                <span className="text-xs font-bold text-slate-500">صورت سود و زیان چندمرحله‌ای استاندارد</span>

                <div className={`p-5 rounded-2xl border ${
                  isDarkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200 shadow-xs"
                }`}>
                  <div className="border-b dark:border-slate-850 pb-4 mb-6 text-right">
                    <h3 className={`text-base font-black ${isDarkMode ? "text-slate-100" : "text-slate-800"}`}>صورت سود و زیان (Income Statement)</h3>
                    <p className="text-[10px] text-slate-400 mt-1">شناسایی تجمعی درآمدهای ناخالص، هزینه‌ها و محاسبه سود خالص نهایی</p>
                  </div>

                  <div className="max-w-3xl mx-auto space-y-6 font-mono text-xs">
                    {/* REVENUES SECTION */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-emerald-500 pb-1.5 border-b dark:border-slate-800 font-sans">۱. درآمدهای عملیاتی (فروش کالا و خدمات)</h4>
                      <ul className="space-y-2 pr-4 text-slate-600 dark:text-slate-300">
                        {profitAndLossData.revenues.map((item, index) => (
                          <li key={index} className="flex justify-between items-center">
                            <span className="font-sans">{item.code} - {item.name}</span>
                            <span>{item.amount.toLocaleString()} ریال</span>
                          </li>
                        ))}
                        {profitAndLossData.revenues.length === 0 && (
                          <li className="text-[10px] italic text-slate-400">هیچ درآمد ثبت‌شده‌ای در این دوره یافت نشد.</li>
                        )}
                      </ul>
                      <div className="border-t pt-2 mt-2 flex justify-between font-black text-slate-800 dark:text-slate-100">
                        <span className="font-sans">جمع درآمدهای عملیاتی:</span>
                        <span>{profitAndLossData.totalRevenues.toLocaleString()} ریال</span>
                      </div>
                    </div>

                    {/* EXPENSES SECTION */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-rose-500 pb-1.5 border-b dark:border-slate-800 font-sans">۲. هزینه‌های عمومی و اداری (عملیاتی)</h4>
                      <ul className="space-y-2 pr-4 text-slate-600 dark:text-slate-300">
                        {profitAndLossData.expenses.map((item, index) => (
                          <li key={index} className="flex justify-between items-center">
                            <span className="font-sans">{item.code} - {item.name}</span>
                            <span>({item.amount.toLocaleString()}) ریال</span>
                          </li>
                        ))}
                        {profitAndLossData.expenses.length === 0 && (
                          <li className="text-[10px] italic text-slate-400">هیچ هزینه ثبت‌شده‌ای در این دوره یافت نشد.</li>
                        )}
                      </ul>
                      <div className="border-t pt-2 mt-2 flex justify-between font-black text-rose-500">
                        <span className="font-sans">جمع هزینه‌های اداری و عمومی:</span>
                        <span>({profitAndLossData.totalExpenses.toLocaleString()}) ریال</span>
                      </div>
                    </div>

                    {/* NET PROFIT TOTAL SUMMARY */}
                    <div className={`p-4 rounded-xl border-2 flex justify-between items-center font-black ${
                      profitAndLossData.netProfit >= 0 
                        ? (isDarkMode ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400" : "border-emerald-200 bg-emerald-50 text-emerald-800")
                        : (isDarkMode ? "border-rose-500/20 bg-rose-500/10 text-rose-400" : "border-rose-200 bg-rose-50 text-rose-800")
                    }`}>
                      <span className="text-sm font-sans">سود (زیان) خالص دوره جاری:</span>
                      <span className="text-lg">{profitAndLossData.netProfit.toLocaleString()} ریال</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: OPTIMIZATION & QUERIES */}
            {activeTab === "optimization" && (
              <div className="flex flex-col gap-6">
                <div className={`p-5 rounded-2xl border flex items-start gap-4 ${
                  isDarkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200 shadow-sm"
                }`}>
                  <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl shrink-0">
                    <Zap className="w-6 h-6 animate-pulse" />
                  </div>
                  <div className="w-full text-right">
                    <h3 className={`text-sm font-bold mb-2 ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>استراتژی بهینه‌سازی دیتابیس در ترازهای آزمایشی سنگین</h3>
                    <p className={`text-[11px] leading-relaxed mb-4 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                      در سامانه‌های سازمانی بزرگ که ممکن است روزانه دهها هزار خط سند مالی جدید ثبت شود، اجرای کوئری برای محاسبه ترازنامه در کل تاریخ دیتابیس کُند (O(N)) است. کدهای SQL زیر شبیه‌سازی دقیق چگونگی انجام محاسبات و سرعت‌بخشی از طریق Materialized Views و ایندکس‌های ترکیبی هستند:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 mb-4 text-right">
                      <div className={`p-4 rounded-xl border ${isDarkMode ? "bg-slate-850 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                        <h4 className="text-xs font-bold mb-1 text-indigo-500">Composite Indexes</h4>
                        <p className={`text-[10px] leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                          ایجاد ایندکس‌های ترکیبی روی فیلدهای <code>(voucher_id, account_id)</code> سرعت اتصال سطور به هدرهای سند را تا ۱۰۰ برابر افزایش می‌دهد.
                        </p>
                      </div>
                      <div className={`p-4 rounded-xl border ${isDarkMode ? "bg-slate-850 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                        <h4 className="text-xs font-bold mb-1 text-emerald-500">Rollup Pre-Calculation</h4>
                        <p className={`text-[10px] leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                          پایگاه داده برای ساخت تراز آزمایشی، ابتدا حساب‌های فرعی معین را جمع زده و طبق ساختار درختی کد معین، فورا به والد کل و گروه منتسب می‌نماید.
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-xl overflow-hidden border dark:border-slate-800">
                      <div className="px-4 py-2 bg-slate-100 dark:bg-slate-900 flex justify-between items-center border-b dark:border-slate-800">
                        <span className="text-[10px] text-slate-500 font-mono">1. کوئری دفتر روزنامه (Journal Ledger)</span>
                      </div>
                      <pre className="p-4 overflow-x-auto text-left text-[10px] font-mono leading-relaxed bg-[#0d1117] text-emerald-400" dir="ltr">
                        {SQL_ARCHITECTURAL_QUERIES.journal}
                      </pre>
                    </div>

                    <div className="mt-4 rounded-xl overflow-hidden border dark:border-slate-800">
                      <div className="px-4 py-2 bg-slate-100 dark:bg-slate-900 flex justify-between items-center border-b dark:border-slate-800">
                        <span className="text-[10px] text-slate-500 font-mono">2. کوئری تراز ۸ ستونی تجمیعی (Hierarchical CTE Roll-up)</span>
                      </div>
                      <pre className="p-4 overflow-x-auto text-left text-[10px] font-mono leading-relaxed bg-[#0d1117] text-emerald-400" dir="ltr">
                        {SQL_ARCHITECTURAL_QUERIES.trialBalance}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
