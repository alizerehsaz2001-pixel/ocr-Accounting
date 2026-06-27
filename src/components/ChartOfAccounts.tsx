import React, { useState } from "react";
import { 
  ChevronDown, 
  ChevronLeft, 
  Folder, 
  FileText, 
  Users, 
  Briefcase, 
  Plus, 
  Hash, 
  X, 
  Save, 
  Search, 
  Edit, 
  Trash2, 
  FolderPlus, 
  FolderMinus, 
  BookOpen, 
  Filter, 
  Check, 
  Info,
  Layers,
  ArrowLeftRight,
  Eye,
  Activity
} from "lucide-react";
import { Account, AccountLevel, DetailedAccount, AccountDetailedLink, validateAccountCode, VoucherLine } from "../lib/accounting";

// Initial accounts data
const INITIAL_ACCOUNTS: Account[] = [
  { id: "a1", code: "1", name: "دارایی‌ها", level: AccountLevel.GROUP, parent_id: null },
  { id: "a2", code: "2", name: "بدهی‌ها", level: AccountLevel.GROUP, parent_id: null },
  { id: "a10", code: "10", name: "دارایی‌های جاری", level: AccountLevel.LEDGER, parent_id: "a1" },
  { id: "a11", code: "11", name: "دارایی‌های ثابت", level: AccountLevel.LEDGER, parent_id: "a1" },
  { id: "a1010", code: "1010", name: "موجودی نقد و بانک", level: AccountLevel.SUBLEDGER, parent_id: "a10" },
  { id: "a1020", code: "1020", name: "حساب‌های دریافتنی", level: AccountLevel.SUBLEDGER, parent_id: "a10" },
  { id: "a20", code: "20", name: "بدهی‌های جاری", level: AccountLevel.LEDGER, parent_id: "a2" },
  { id: "a2010", code: "2010", name: "حساب‌های پرداختنی", level: AccountLevel.SUBLEDGER, parent_id: "a20" },
];

const INITIAL_DETAILED_ACCOUNTS: DetailedAccount[] = [
  { id: "d1", code: "10001", name: "بانک سامان - شعبه مرکزی", type: "Bank" },
  { id: "d2", code: "10002", name: "بانک ملت - شعبه بازار", type: "Bank" },
  { id: "d3", code: "20001", name: "شرکت آلفا (مشتری)", type: "Customer" },
  { id: "d4", code: "30001", name: "شرکت تامین تجهیز (تامین‌کننده)", type: "Supplier" },
  { id: "d5", code: "40001", name: "علی احمدی (پرسنل)", type: "Employee" },
];

const INITIAL_LINKS: AccountDetailedLink[] = [
  { account_id: "a1010", detailed_account_id: "d1" }, // موجودی نقد و بانک -> بانک سامان
  { account_id: "a1010", detailed_account_id: "d2" }, // موجودی نقد و بانک -> بانک ملت
  { account_id: "a1020", detailed_account_id: "d3" }, // دریافتنی -> شرکت آلفا
  { account_id: "a1020", detailed_account_id: "d5" }, // دریافتنی -> پرسنل
  { account_id: "a2010", detailed_account_id: "d4" }, // پرداختنی -> تامین تجهیز
];

// Standard Iranian Chart of Accounts Template
const IRANIAN_STANDARD_ACCOUNTS: { code: string; name: string; level: AccountLevel; parent_id: string | null }[] = [
  // 1. دارایی‌ها
  { code: "1", name: "دارایی‌ها", level: AccountLevel.GROUP, parent_id: null },
  { code: "10", name: "دارایی‌های جاری", level: AccountLevel.LEDGER, parent_id: "1" },
  { code: "1010", name: "صندوق و بانک (موجودی نقد)", level: AccountLevel.SUBLEDGER, parent_id: "10" },
  { code: "1020", name: "حساب‌های دریافتنی تجاری (مشتریان)", level: AccountLevel.SUBLEDGER, parent_id: "10" },
  { code: "1030", name: "اسناد دریافتنی تجاری", level: AccountLevel.SUBLEDGER, parent_id: "10" },
  { code: "1040", name: "پیش‌پرداخت‌ها", level: AccountLevel.SUBLEDGER, parent_id: "10" },
  { code: "1050", name: "موجودی کالا و ملزومات", level: AccountLevel.SUBLEDGER, parent_id: "10" },
  
  { code: "11", name: "دارایی‌های غیرجاری", level: AccountLevel.LEDGER, parent_id: "1" },
  { code: "1110", name: "دارایی‌های ثابت مشهود (اموال و ماشین‌آلات)", level: AccountLevel.SUBLEDGER, parent_id: "11" },
  { code: "1120", name: "استهلاک انباشته دارایی‌های ثابت", level: AccountLevel.SUBLEDGER, parent_id: "11" },
  { code: "1130", name: "دارایی‌های نامشهود (حق امتیاز و برند)", level: AccountLevel.SUBLEDGER, parent_id: "11" },

  // 2. بدهی‌ها
  { code: "2", name: "بدهی‌ها", level: AccountLevel.GROUP, parent_id: null },
  { code: "20", name: "بدهی‌های جاری", level: AccountLevel.LEDGER, parent_id: "2" },
  { code: "2010", name: "حساب‌ها و اسناد پرداختنی تجاری", level: AccountLevel.SUBLEDGER, parent_id: "20" },
  { code: "2020", name: "پیش‌دریافت‌های تجاری", level: AccountLevel.SUBLEDGER, parent_id: "20" },
  { code: "2030", name: "ذخیره مالیات بر درآمد", level: AccountLevel.SUBLEDGER, parent_id: "20" },
  { code: "2040", name: "تسهیلات مالی کوتاه‌مدت دریافتی", level: AccountLevel.SUBLEDGER, parent_id: "20" },

  { code: "21", name: "بدهی‌های غیرجاری", level: AccountLevel.LEDGER, parent_id: "2" },
  { code: "2110", name: "تسهیلات مالی بلندمدت دریافتی", level: AccountLevel.SUBLEDGER, parent_id: "21" },
  { code: "2120", name: "ذخیره مزایای پایان خدمت پرسنل", level: AccountLevel.SUBLEDGER, parent_id: "21" },

  // 3. حقوق صاحبان سهام
  { code: "3", name: "حقوق صاحبان سهام", level: AccountLevel.GROUP, parent_id: null },
  { code: "30", name: "سرمایه و اندوخته‌ها", level: AccountLevel.LEDGER, parent_id: "3" },
  { code: "3010", name: "سرمایه ثبت شده شرکت", level: AccountLevel.SUBLEDGER, parent_id: "30" },
  { code: "3020", name: "سود و زیان انباشته (سنواتی)", level: AccountLevel.SUBLEDGER, parent_id: "30" },
  { code: "3030", name: "اندوخته قانونی و سایر اندوخته‌ها", level: AccountLevel.SUBLEDGER, parent_id: "30" },

  // 4. درآمدها
  { code: "4", name: "درآمدها و فروش", level: AccountLevel.GROUP, parent_id: null },
  { code: "40", name: "درآمدهای عملیاتی", level: AccountLevel.LEDGER, parent_id: "4" },
  { code: "4010", name: "فروش داخلی کالا و محصولات", level: AccountLevel.SUBLEDGER, parent_id: "40" },
  { code: "4020", name: "درآمد ارائه خدمات فنی و مهندسی", level: AccountLevel.SUBLEDGER, parent_id: "40" },
  { code: "4030", name: "تخفیفات نقدی فروش", level: AccountLevel.SUBLEDGER, parent_id: "40" },

  // 5. هزینه‌ها
  { code: "5", name: "هزینه‌ها", level: AccountLevel.GROUP, parent_id: null },
  { code: "50", name: "هزینه‌های اداری، عمومی و فروش", level: AccountLevel.LEDGER, parent_id: "5" },
  { code: "5010", name: "هزینه حقوق و دستمزد پرسنل", level: AccountLevel.SUBLEDGER, parent_id: "50" },
  { code: "5020", name: "هزینه اجاره دفتر مرکزی", level: AccountLevel.SUBLEDGER, parent_id: "50" },
  { code: "5030", name: "هزینه ملزومات اداری و مصرفی", level: AccountLevel.SUBLEDGER, parent_id: "50" },
  { code: "5040", name: "هزینه ایاب و ذهاب و سفر", level: AccountLevel.SUBLEDGER, parent_id: "50" },
  { code: "5050", name: "هزینه تلفن، آب، گاز و اینترنت", level: AccountLevel.SUBLEDGER, parent_id: "50" },
  
  { code: "51", name: "هزینه‌های مالی", level: AccountLevel.LEDGER, parent_id: "5" },
  { code: "5110", name: "هزینه کارمزد خدمات بانکی", level: AccountLevel.SUBLEDGER, parent_id: "51" },
  { code: "5120", name: "هزینه سود تسهیلات بانکی", level: AccountLevel.SUBLEDGER, parent_id: "51" }
];

interface ChartOfAccountsProps {
  isDarkMode: boolean;
  onBack: () => void;
  showNotification: (text: string, type?: "success" | "error" | "info") => void;
}

export default function ChartOfAccounts({ isDarkMode, onBack, showNotification }: ChartOfAccountsProps) {
  const [accounts, setAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem("chart_of_accounts");
    return saved ? JSON.parse(saved) : INITIAL_ACCOUNTS;
  });
  const [detailedAccounts, setDetailedAccounts] = useState<DetailedAccount[]>(() => {
    const saved = localStorage.getItem("detailed_accounts");
    return saved ? JSON.parse(saved) : INITIAL_DETAILED_ACCOUNTS;
  });
  const [links, setLinks] = useState<AccountDetailedLink[]>(() => {
    const saved = localStorage.getItem("account_detailed_links");
    return saved ? JSON.parse(saved) : INITIAL_LINKS;
  });

  React.useEffect(() => {
    localStorage.setItem("chart_of_accounts", JSON.stringify(accounts));
  }, [accounts]);

  React.useEffect(() => {
    localStorage.setItem("detailed_accounts", JSON.stringify(detailedAccounts));
  }, [detailedAccounts]);

  React.useEffect(() => {
    localStorage.setItem("account_detailed_links", JSON.stringify(links));
  }, [links]);

  // Navigation tabs
  const [activeTab, setActiveTab] = useState<"tree" | "detailed" | "mapping">("tree");
  const [selectedMappingDetailedId, setSelectedMappingDetailedId] = useState<string>("");
  const [showFriendlyGuide, setShowFriendlyGuide] = useState(true);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState("");
  const [detailedFilterType, setDetailedFilterType] = useState("all");
  
  // Mapping tab specific states
  const [mappingDetailedSearch, setMappingDetailedSearch] = useState("");
  const [mappingSubledgerSearch, setMappingSubledgerSearch] = useState("");
  const [mappingTypeFilter, setMappingTypeFilter] = useState("all");

  React.useEffect(() => {
    if (activeTab === "mapping" && !selectedMappingDetailedId && detailedAccounts.length > 0) {
      setSelectedMappingDetailedId(detailedAccounts[0].id);
    }
  }, [activeTab, detailedAccounts, selectedMappingDetailedId]);
  
  // Tree expanded nodes
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(["a1", "a10"]));

  // Add Account Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newAccLevel, setNewAccLevel] = useState<AccountLevel>(AccountLevel.GROUP);
  const [newAccParentId, setNewAccParentId] = useState("");
  const [newAccCode, setNewAccCode] = useState("");
  const [newAccName, setNewAccName] = useState("");

  // Import Coding Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Load voucher lines for balances
  const voucherLines = React.useMemo<VoucherLine[]>(() => {
    try {
      const saved = localStorage.getItem("voucher_lines_data");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error(e);
      return [];
    }
  }, []);

  // Calculate balances for each account
  const accountBalances = React.useMemo(() => {
    const balances: Record<string, number> = {};
    
    // Initialize balances
    accounts.forEach(acc => {
      balances[acc.id] = 0;
    });

    // Calculate subledger balances from voucher lines
    voucherLines.forEach((line) => {
      const db = Number(line.debit) || 0;
      const cr = Number(line.credit) || 0;
      balances[line.account_id] = (balances[line.account_id] || 0) + (db - cr);
    });

    // Roll up to Ledgers
    accounts.filter(a => a.level === AccountLevel.SUBLEDGER).forEach(sub => {
      if (sub.parent_id) {
        balances[sub.parent_id] = (balances[sub.parent_id] || 0) + (balances[sub.id] || 0);
      }
    });

    // Roll up to Groups
    accounts.filter(a => a.level === AccountLevel.LEDGER).forEach(led => {
      if (led.parent_id) {
        balances[led.parent_id] = (balances[led.parent_id] || 0) + (balances[led.id] || 0);
      }
    });

    return balances;
  }, [accounts, voucherLines]);

  // Calculate transaction counts for each account
  const accountTransactionCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    accounts.forEach(acc => { counts[acc.id] = 0; });

    voucherLines.forEach((line) => {
      counts[line.account_id] = (counts[line.account_id] || 0) + 1;
    });

    // Roll up to Ledgers
    accounts.filter(a => a.level === AccountLevel.SUBLEDGER).forEach(sub => {
      if (sub.parent_id) {
        counts[sub.parent_id] = (counts[sub.parent_id] || 0) + (counts[sub.id] || 0);
      }
    });

    // Roll up to Groups
    accounts.filter(a => a.level === AccountLevel.LEDGER).forEach(led => {
      if (led.parent_id) {
        counts[led.parent_id] = (counts[led.parent_id] || 0) + (counts[led.id] || 0);
      }
    });

    return counts;
  }, [accounts, voucherLines]);

  // Suggest the next numeric code based on selected parent and level
  const suggestedCode = React.useMemo(() => {
    if (newAccLevel === AccountLevel.GROUP) {
      const groupCodes = accounts
        .filter(a => a.level === AccountLevel.GROUP)
        .map(a => parseInt(a.code))
        .filter(n => !isNaN(n));
      const max = groupCodes.length > 0 ? Math.max(...groupCodes) : 0;
      return (max + 1).toString();
    }
    
    if (!newAccParentId) return "";
    const parent = accounts.find(a => a.id === newAccParentId);
    if (!parent) return "";

    const siblings = accounts.filter(a => a.parent_id === newAccParentId);
    if (siblings.length === 0) {
      if (newAccLevel === AccountLevel.LEDGER) {
        return `${parent.code}0`;
      } else if (newAccLevel === AccountLevel.SUBLEDGER) {
        return `${parent.code}10`;
      }
      return parent.code;
    }

    const parentCodeLen = parent.code.length;
    const suffixes = siblings
      .map(s => parseInt(s.code.substring(parentCodeLen)))
      .filter(n => !isNaN(n));
    
    const maxSuffix = suffixes.length > 0 ? Math.max(...suffixes) : 0;
    const nextSuffix = maxSuffix + (newAccLevel === AccountLevel.SUBLEDGER ? 10 : 1);
    
    if (newAccLevel === AccountLevel.LEDGER) {
      return `${parent.code}${nextSuffix}`;
    } else if (newAccLevel === AccountLevel.SUBLEDGER) {
      const paddedSuffix = nextSuffix.toString().padStart(2, '0');
      return `${parent.code}${paddedSuffix}`.substring(0, 4);
    }
    return `${parent.code}${nextSuffix}`;
  }, [newAccLevel, newAccParentId, accounts]);

  const handleQuickLink = (accountId: string, detailedId: string) => {
    const exists = links.some(l => l.account_id === accountId && l.detailed_account_id === detailedId);
    if (exists) return;

    const newLinks = [...links, { account_id: accountId, detailed_account_id: detailedId }];
    setLinks(newLinks);
    showNotification("تفصیلی شناور با موفقیت به این حساب معین متصل شد.", "success");
  };

  const handleQuickUnlink = (accountId: string, detailedId: string) => {
    const newLinks = links.filter(l => !(l.account_id === accountId && l.detailed_account_id === detailedId));
    setLinks(newLinks);
    showNotification("اتصال حساب تفصیلی شناور قطع گردید.", "info");
  };

  // Edit Account Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [editAccCode, setEditAccCode] = useState("");
  const [editAccName, setEditAccName] = useState("");

  // Add Detailed Account Modal
  const [isAddDetailedModalOpen, setIsAddDetailedModalOpen] = useState(false);
  const [newDetailedCode, setNewDetailedCode] = useState("");
  const [newDetailedName, setNewDetailedName] = useState("");
  const [newDetailedType, setNewDetailedType] = useState("Customer");
  const [selectedSubledgers, setSelectedSubledgers] = useState<string[]>([]);

  // Edit Detailed Account Modal
  const [isEditDetailedModalOpen, setIsEditDetailedModalOpen] = useState(false);
  const [editingDetailed, setEditingDetailed] = useState<DetailedAccount | null>(null);
  const [editDetailedCode, setEditDetailedCode] = useState("");
  const [editDetailedName, setEditDetailedName] = useState("");
  const [editDetailedType, setEditDetailedType] = useState("Customer");
  const [editSelectedSubledgers, setEditSelectedSubledgers] = useState<string[]>([]);

  // Expand / Collapse all
  const handleExpandAll = () => {
    const allIds = accounts.map(a => a.id);
    setExpandedNodes(new Set(allIds));
    showNotification("همه گره‌های درختواره گسترش یافتند.", "info");
  };

  const handleCollapseAll = () => {
    setExpandedNodes(new Set());
    showNotification("همه گره‌های درختواره جمع شدند.", "info");
  };

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedNodes(newExpanded);
  };

  // Helper to build the tree
  const getChildren = (parentId: string | null) => {
    const list = searchTerm.trim() ? getFilteredAccounts() : accounts;
    return list.filter((acc) => acc.parent_id === parentId);
  };

  // Advanced search with ancestor matching
  const getFilteredAccounts = () => {
    if (!searchTerm.trim()) return accounts;
    const lowerSearch = searchTerm.toLowerCase();
    
    const matched = accounts.filter(acc => 
      acc.name.toLowerCase().includes(lowerSearch) || 
      acc.code.includes(lowerSearch)
    );

    const keptIds = new Set<string>();
    const addAncestor = (acc: Account) => {
      keptIds.add(acc.id);
      if (acc.parent_id) {
        const parent = accounts.find(a => a.id === acc.parent_id);
        if (parent) addAncestor(parent);
      }
    };

    matched.forEach(acc => addAncestor(acc));
    return accounts.filter(acc => keptIds.has(acc.id));
  };

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    if (val.trim()) {
      const lowerSearch = val.toLowerCase();
      const matched = accounts.filter(acc => 
        acc.name.toLowerCase().includes(lowerSearch) || 
        acc.code.includes(lowerSearch)
      );
      const parentsToExpand = new Set<string>();
      matched.forEach(acc => {
        if (acc.parent_id) {
          let parent = accounts.find(a => a.id === acc.parent_id);
          while (parent) {
            parentsToExpand.add(parent.id);
            parent = parent.parent_id ? accounts.find(a => a.id === parent.parent_id) : undefined;
          }
        }
      });
      setExpandedNodes(prev => {
        const next = new Set(prev);
        parentsToExpand.forEach(id => next.add(id));
        return next;
      });
    }
  };

  // Handle CRUD: Add Account
  const handleAddAccount = () => {
    if (!newAccCode || !newAccName) {
      showNotification("لطفا کد و نام حساب را وارد کنید.", "error");
      return;
    }

    const parent = newAccParentId ? accounts.find(a => a.id === newAccParentId) : null;
    const parentCode = parent ? parent.code : null;

    const validation = validateAccountCode(newAccCode, newAccLevel, parentCode);
    if (!validation.valid) {
      showNotification(validation.error || "کد حساب نامعتبر است.", "error");
      return;
    }

    const exists = accounts.find(a => a.code === newAccCode);
    if (exists) {
      showNotification("این کد حساب قبلا ثبت شده است.", "error");
      return;
    }

    const newAccount: Account = {
      id: `a${Date.now()}`,
      code: newAccCode,
      name: newAccName,
      level: newAccLevel,
      parent_id: newAccParentId || null
    };

    setAccounts([...accounts, newAccount]);
    if (newAccParentId) {
      setExpandedNodes(prev => new Set(prev).add(newAccParentId));
    }
    showNotification(`حساب ${newAccName} با موفقیت ثبت شد.`, "success");
    setIsAddModalOpen(false);
    setNewAccCode("");
    setNewAccName("");
  };

  // Handle CRUD: Edit Account
  const handleOpenEditAccount = (acc: Account, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingAccount(acc);
    setEditAccCode(acc.code);
    setEditAccName(acc.name);
    setIsEditModalOpen(true);
  };

  const handleEditAccount = () => {
    if (!editingAccount) return;
    if (!editAccCode || !editAccName) {
      showNotification("لطفا کد و نام حساب را وارد کنید.", "error");
      return;
    }

    // Validate code match parent if not GROUP
    if (editingAccount.level !== AccountLevel.GROUP) {
      const parent = accounts.find(a => a.id === editingAccount.parent_id);
      if (parent && !editAccCode.startsWith(parent.code)) {
        showNotification(`کد حساب جدید باید با کد والد (${parent.code}) شروع شود.`, "error");
        return;
      }
    }

    // Check code length based on Level
    const validation = validateAccountCode(editAccCode, editingAccount.level, null);
    if (!validation.valid) {
      showNotification(validation.error || "کد حساب نامعتبر است.", "error");
      return;
    }

    // Check uniqueness excluding itself
    const exists = accounts.find(a => a.code === editAccCode && a.id !== editingAccount.id);
    if (exists) {
      showNotification("این کد حساب قبلا ثبت شده است.", "error");
      return;
    }

    setAccounts(prev => prev.map(a => a.id === editingAccount.id ? { ...a, code: editAccCode, name: editAccName } : a));
    showNotification("تغییرات حساب با موفقیت ذخیره شد.", "success");
    setIsEditModalOpen(false);
    setEditingAccount(null);
  };

  // Handle CRUD: Delete Account
  const handleDeleteAccount = (acc: Account, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Check if it has children
    const hasChildren = accounts.some(a => a.parent_id === acc.id);
    if (hasChildren) {
      showNotification("این حساب دارای زیرمجموعه است و ابتدا باید فرزندان آن حذف شوند.", "error");
      return;
    }

    // Check if subledger is connected to detailed accounts
    const isLinked = links.some(l => l.account_id === acc.id);
    if (isLinked) {
      showNotification("این حساب معین به حساب‌های تفصیلی متصل است. ابتدا اتصالات تفصیلی را مدیریت کنید.", "error");
      return;
    }

    setAccounts(prev => prev.filter(a => a.id !== acc.id));
    showNotification(`حساب ${acc.name} با موفقیت حذف شد.`, "success");
  };

  // Handle CRUD: Add Detailed Account
  const handleAddDetailedAccount = () => {
    if (!newDetailedCode || !newDetailedName) {
      showNotification("لطفا کد و نام تفصیلی را وارد کنید.", "error");
      return;
    }

    const exists = detailedAccounts.find(d => d.code === newDetailedCode);
    if (exists) {
      showNotification("این کد تفصیلی قبلا ثبت شده است.", "error");
      return;
    }

    const newDetailedId = `d${Date.now()}`;
    const newDetailed: DetailedAccount = {
      id: newDetailedId,
      code: newDetailedCode,
      name: newDetailedName,
      type: newDetailedType
    };

    const newLinks: AccountDetailedLink[] = selectedSubledgers.map(subId => ({
      account_id: subId,
      detailed_account_id: newDetailedId
    }));

    setDetailedAccounts([...detailedAccounts, newDetailed]);
    setLinks([...links, ...newLinks]);
    
    if (selectedSubledgers.length > 0) {
      const newExpanded = new Set(expandedNodes);
      selectedSubledgers.forEach(id => newExpanded.add(id));
      setExpandedNodes(newExpanded);
    }

    showNotification(`حساب تفصیلی ${newDetailedName} با موفقیت ثبت شد.`, "success");
    setIsAddDetailedModalOpen(false);
    setNewDetailedCode("");
    setNewDetailedName("");
    setNewDetailedType("Customer");
    setSelectedSubledgers([]);
  };

  // Handle CRUD: Edit Detailed Account
  const handleOpenEditDetailed = (det: DetailedAccount) => {
    setEditingDetailed(det);
    setEditDetailedCode(det.code);
    setEditDetailedName(det.name);
    setEditDetailedType(det.type);
    
    // Get currently linked subledgers
    const connected = links.filter(l => l.detailed_account_id === det.id).map(l => l.account_id);
    setEditSelectedSubledgers(connected);
    setIsEditDetailedModalOpen(true);
  };

  const handleEditDetailed = () => {
    if (!editingDetailed) return;
    if (!editDetailedCode || !editDetailedName) {
      showNotification("لطفا کد و نام تفصیلی را وارد کنید.", "error");
      return;
    }

    // Check code uniqueness
    const exists = detailedAccounts.find(d => d.code === editDetailedCode && d.id !== editingDetailed.id);
    if (exists) {
      showNotification("این کد تفصیلی قبلا ثبت شده است.", "error");
      return;
    }

    // Update Detailed Account info
    setDetailedAccounts(prev => prev.map(d => d.id === editingDetailed.id ? { 
      ...d, 
      code: editDetailedCode, 
      name: editDetailedName, 
      type: editDetailedType 
    } : d));

    // Rebuild links for this detailed account
    setLinks(prev => {
      // Filter out old links of this detailed account
      const filtered = prev.filter(l => l.detailed_account_id !== editingDetailed.id);
      // Append newly selected links
      const newLinks = editSelectedSubledgers.map(subId => ({
        account_id: subId,
        detailed_account_id: editingDetailed.id
      }));
      return [...filtered, ...newLinks];
    });

    showNotification(`تغییرات تفصیلی ${editDetailedName} با موفقیت اعمال شد.`, "success");
    setIsEditDetailedModalOpen(false);
    setEditingDetailed(null);
  };

  // Handle CRUD: Delete Detailed Account
  const handleDeleteDetailed = (det: DetailedAccount) => {
    setDetailedAccounts(prev => prev.filter(d => d.id !== det.id));
    setLinks(prev => prev.filter(l => l.detailed_account_id !== det.id));
    showNotification(`حساب تفصیلی ${det.name} با موفقیت حذف گردید.`, "success");
  };

  // Handle Standard Iranian Coding Template Import
  const handleLoadStandardCoding = (mode: "merge" | "reset") => {
    if (mode === "reset") {
      const codeToIdMap: Record<string, string> = {};
      const newAccountsList: Account[] = [];

      // 1. Create Groups
      const groups = IRANIAN_STANDARD_ACCOUNTS.filter(a => a.level === AccountLevel.GROUP);
      groups.forEach(g => {
        const id = `a_std_${g.code}_${Date.now()}`;
        codeToIdMap[g.code] = id;
        newAccountsList.push({
          id,
          code: g.code,
          name: g.name,
          level: AccountLevel.GROUP,
          parent_id: null
        });
      });

      // 2. Create Ledgers
      const ledgers = IRANIAN_STANDARD_ACCOUNTS.filter(a => a.level === AccountLevel.LEDGER);
      ledgers.forEach(l => {
        const id = `a_std_${l.code}_${Date.now()}`;
        codeToIdMap[l.code] = id;
        const parentId = l.parent_id ? codeToIdMap[l.parent_id] : null;
        newAccountsList.push({
          id,
          code: l.code,
          name: l.name,
          level: AccountLevel.LEDGER,
          parent_id: parentId
        });
      });

      // 3. Create Subledgers
      const subledgers = IRANIAN_STANDARD_ACCOUNTS.filter(a => a.level === AccountLevel.SUBLEDGER);
      subledgers.forEach(s => {
        const id = `a_std_${s.code}_${Date.now()}`;
        codeToIdMap[s.code] = id;
        const parentId = s.parent_id ? codeToIdMap[s.parent_id] : null;
        newAccountsList.push({
          id,
          code: s.code,
          name: s.name,
          level: AccountLevel.SUBLEDGER,
          parent_id: parentId
        });
      });

      setAccounts(newAccountsList);
      setLinks([]); // Clear links as the old subledgers don't exist anymore
      showNotification("کدینگ استاندارد حسابداری ایران با موفقیت بازنشانی شد. اتصالات تفصیلی قبلی حذف شدند.", "success");
    } else {
      // MERGE Mode
      const mergedAccounts = [...accounts];
      const codeToIdMap: Record<string, string> = {};
      
      mergedAccounts.forEach(a => {
        codeToIdMap[a.code] = a.id;
      });

      // 1. Groups
      const groups = IRANIAN_STANDARD_ACCOUNTS.filter(a => a.level === AccountLevel.GROUP);
      groups.forEach(g => {
        if (!codeToIdMap[g.code]) {
          const id = `a_std_${g.code}_${Date.now()}`;
          codeToIdMap[g.code] = id;
          mergedAccounts.push({
            id,
            code: g.code,
            name: g.name,
            level: AccountLevel.GROUP,
            parent_id: null
          });
        }
      });

      // 2. Ledgers
      const ledgers = IRANIAN_STANDARD_ACCOUNTS.filter(a => a.level === AccountLevel.LEDGER);
      ledgers.forEach(l => {
        if (!codeToIdMap[l.code]) {
          const id = `a_std_${l.code}_${Date.now()}`;
          codeToIdMap[l.code] = id;
          const parentId = l.parent_id ? codeToIdMap[l.parent_id] : null;
          mergedAccounts.push({
            id,
            code: l.code,
            name: l.name,
            level: AccountLevel.LEDGER,
            parent_id: parentId
          });
        }
      });

      // 3. Subledgers
      const subledgers = IRANIAN_STANDARD_ACCOUNTS.filter(a => a.level === AccountLevel.SUBLEDGER);
      subledgers.forEach(s => {
        if (!codeToIdMap[s.code]) {
          const id = `a_std_${s.code}_${Date.now()}`;
          codeToIdMap[s.code] = id;
          const parentId = s.parent_id ? codeToIdMap[s.parent_id] : null;
          mergedAccounts.push({
            id,
            code: s.code,
            name: s.name,
            level: AccountLevel.SUBLEDGER,
            parent_id: parentId
          });
        }
      });

      setAccounts(mergedAccounts);
      showNotification("کدینگ استاندارد با حساب‌های فعلی تلفیق شد و حساب‌های جدید اضافه شدند.", "success");
    }
    setIsImportModalOpen(false);
  };

  // Get localized detailed type label
  const getDetailedTypeLabel = (type: string) => {
    switch (type) {
      case "Customer": return "مشتری";
      case "Supplier": return "تامین‌کننده";
      case "Bank": return "حساب بانکی";
      case "Employee": return "پرسنل";
      default: return "سایر";
    }
  };

  // Stats Counters
  const countGroups = accounts.filter(a => a.level === AccountLevel.GROUP).length;
  const countLedgers = accounts.filter(a => a.level === AccountLevel.LEDGER).length;
  const countSubledgers = accounts.filter(a => a.level === AccountLevel.SUBLEDGER).length;
  const countDetailed = detailedAccounts.length;

  // Render recursive tree node
  const renderNode = (account: Account) => {
    const children = getChildren(account.id);
    const isExpanded = expandedNodes.has(account.id);
    const hasChildren = children.length > 0;
    
    // Linked floating details for Subledgers
    const linkedDetails = account.level === AccountLevel.SUBLEDGER 
      ? links.filter(l => l.account_id === account.id)
          .map(l => detailedAccounts.find(d => d.id === l.detailed_account_id))
          .filter((d): d is DetailedAccount => d !== undefined)
      : [];

    return (
      <div key={account.id} className="relative">
        <div 
          onClick={(e) => hasChildren && toggleExpand(account.id, e)}
          className={`flex items-center gap-3 p-3 rounded-xl border border-transparent transition-all group cursor-pointer ${
            isDarkMode 
              ? "hover:bg-slate-800/60 hover:border-slate-800" 
              : "hover:bg-slate-50 hover:border-slate-100"
          }`}
        >
          {/* Collapse/Expand button */}
          <div className="w-5 h-5 flex items-center justify-center shrink-0">
            {hasChildren ? (
              <button 
                onClick={(e) => { e.stopPropagation(); toggleExpand(account.id, e); }}
                className={`p-1 rounded-md transition-all ${
                  isDarkMode ? "hover:bg-slate-700 text-slate-400" : "hover:bg-slate-200 text-slate-500"
                }`}
              >
                {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
              </button>
            ) : (
              <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
            )}
          </div>

          {/* Icon based on account level */}
          <div className={`p-2 rounded-xl flex items-center justify-center shrink-0 ${
            account.level === AccountLevel.GROUP 
              ? "bg-blue-500/10 text-blue-500" 
              : account.level === AccountLevel.LEDGER 
                ? "bg-purple-500/10 text-purple-500" 
                : "bg-emerald-500/10 text-emerald-500"
          }`}>
            {account.level === AccountLevel.SUBLEDGER ? (
              <FileText className="w-4 h-4" />
            ) : (
              <Folder className="w-4 h-4" />
            )}
          </div>

          {/* Name & Code */}
          <div className="flex-1 flex items-center justify-between min-w-0">
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <span className={`text-sm font-semibold truncate ${
                isDarkMode ? "text-slate-100" : "text-slate-800"
              }`}>
                {account.name}
              </span>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                account.level === AccountLevel.GROUP 
                  ? "bg-blue-500/10 text-blue-500" 
                  : account.level === AccountLevel.LEDGER 
                    ? "bg-purple-500/10 text-purple-500" 
                    : "bg-emerald-500/10 text-emerald-500"
              }`}>
                {account.level === AccountLevel.GROUP ? "گروه" :
                 account.level === AccountLevel.LEDGER ? "کل" : "معین"}
              </span>

              {/* Transaction count badge */}
              {accountTransactionCounts[account.id] > 0 && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono font-medium shrink-0 ${
                  isDarkMode ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"
                }`}>
                  {accountTransactionCounts[account.id]} گردش
                </span>
              )}

              {/* Balance badge */}
              {accountBalances[account.id] !== 0 && (
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-mono font-bold shrink-0 ${
                  accountBalances[account.id] > 0 
                    ? (isDarkMode ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-700") 
                    : (isDarkMode ? "bg-rose-500/10 text-rose-400" : "bg-rose-50 text-rose-700")
                }`}>
                  {accountBalances[account.id] > 0 ? "بدهکار" : "بستانکار"}: {Math.abs(accountBalances[account.id]).toLocaleString()} ریال
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-bold text-slate-500 tracking-wider">
                {account.code}
              </span>

              {/* Action Buttons on Hover */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5">
                <button
                  onClick={(e) => handleOpenEditAccount(account, e)}
                  title="ویرایش حساب"
                  className={`p-1 rounded-md transition-colors ${
                    isDarkMode ? "hover:bg-slate-700 text-slate-300" : "hover:bg-slate-200 text-slate-750"
                  }`}
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => handleDeleteAccount(account, e)}
                  title="حذف حساب"
                  className="p-1 rounded-md hover:bg-red-500/10 text-red-500 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Child list */}
        {isExpanded && hasChildren && (
          <div className="mr-6 pr-4 border-r-2 border-slate-200 dark:border-slate-800/80 mt-1 space-y-1">
            {children.map(renderNode)}
          </div>
        )}

        {/* Linked details (for subledgers) */}
        {account.level === AccountLevel.SUBLEDGER && isExpanded && (
          <div className="mr-10 pr-4 border-r border-emerald-500/30 py-2 space-y-1.5 animate-fade-in">
            <div className={`text-[10px] font-bold flex flex-wrap items-center justify-between gap-2 ${
              isDarkMode ? "text-slate-400" : "text-slate-500"
            }`}>
              <span className={`flex items-center gap-1 font-bold ${
                isDarkMode ? "text-emerald-400" : "text-emerald-700"
              }`}>
                <Users className="w-3 h-3" /> حساب‌های تفصیلی شناور متصل ({linkedDetails.length}):
              </span>
              
              {/* Inline quick-connect dropdown */}
              <select
                onChange={(e) => {
                  const val = e.target.value;
                  if (val) {
                    handleQuickLink(account.id, val);
                    e.target.value = "";
                  }
                }}
                className={`text-[9px] px-2 py-0.5 rounded border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                  isDarkMode ? "bg-slate-900 border-slate-800 text-slate-300" : "bg-white border-slate-200 text-slate-600"
                }`}
              >
                <option value="">+ اتصال تفصیلی جدید</option>
                {detailedAccounts
                  .filter(d => !links.some(l => l.account_id === account.id && l.detailed_account_id === d.id))
                  .map(d => (
                    <option key={d.id} value={d.id}>{d.code} - {d.name}</option>
                  ))}
              </select>
            </div>
            
            {linkedDetails.length > 0 ? (
              <div className="space-y-1">
                {linkedDetails.map(detail => (
                  <div 
                    key={detail.id} 
                    className={`flex items-center justify-between p-2 rounded-lg border text-xs max-w-md group/link ${
                      isDarkMode 
                        ? "bg-slate-950/60 border-slate-800 text-slate-300" 
                        : "bg-slate-50 border-slate-200 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Hash className="w-3 h-3 text-slate-400" />
                      <span>{detail.name}</span>
                      <span className={`text-[9px] px-1 rounded-full ${
                        isDarkMode ? "bg-slate-800 text-slate-400" : "bg-slate-200 text-slate-500"
                      }`}>
                        {getDetailedTypeLabel(detail.type)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-slate-500">{detail.code}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditDetailed(detail)}
                          className="p-1 rounded text-slate-400 hover:text-blue-500 transition-colors"
                          title="مدیریت تفصیلی"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleQuickUnlink(account.id, detail.id)}
                          className="p-1 rounded text-red-400 hover:text-red-600 transition-colors"
                          title="قطع اتصال"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`text-[10px] italic ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
                هیچ حساب تفصیلی شناوری به این معین متصل نشده است.
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Filter detailed accounts based on search and type
  const getFilteredDetailedList = () => {
    let list = detailedAccounts;
    if (detailedFilterType !== "all") {
      list = list.filter(d => d.type === detailedFilterType);
    }
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      list = list.filter(d => d.name.toLowerCase().includes(query) || d.code.includes(query));
    }
    return list;
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col max-w-6xl mx-auto w-full" dir="rtl">
      
      {/* Upper Dashboard stats panel */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className={`p-4 rounded-2xl border transition-all ${
          isDarkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 text-blue-500 rounded-xl">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className={`text-[11px] font-bold ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>حساب‌های گروه</p>
              <h4 className={`text-lg font-black font-mono ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>{countGroups}</h4>
            </div>
          </div>
        </div>

        <div className={`p-4 rounded-2xl border transition-all ${
          isDarkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/10 text-purple-500 rounded-xl">
              <Folder className="w-5 h-5" />
            </div>
            <div>
              <p className={`text-[11px] font-bold ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>حساب‌های کل</p>
              <h4 className={`text-lg font-black font-mono ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>{countLedgers}</h4>
            </div>
          </div>
        </div>

        <div className={`p-4 rounded-2xl border transition-all ${
          isDarkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className={`text-[11px] font-bold ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>حساب‌های معین</p>
              <h4 className={`text-lg font-black font-mono ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>{countSubledgers}</h4>
            </div>
          </div>
        </div>

        <div className={`p-4 rounded-2xl border transition-all ${
          isDarkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className={`text-[11px] font-bold ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>تفصیلی شناور</p>
              <h4 className={`text-lg font-black font-mono ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>{countDetailed}</h4>
            </div>
          </div>
        </div>
      </div>

      {/* Header and Back bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className={`text-xl font-black tracking-tight ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>
              کدینگ پیشرفته حساب‌ها
            </h2>
            <button
              onClick={() => setShowFriendlyGuide(!showFriendlyGuide)}
              className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 flex items-center gap-1 hover:bg-indigo-500/20 transition-all"
            >
              <Info className="w-3 h-3" />
              {showFriendlyGuide ? "پنهان‌سازی آموزش ساده" : "آموزش ساده به زبان خودمانی"}
            </button>
          </div>
          <p className={`text-xs mt-1.5 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
            تنظیم و مدیریت ساختار درختی و حساب‌های تفصیلی شناور در دو تب هوشمند
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
              isDarkMode 
                ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750" 
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            بازگشت به منو
          </button>
        </div>
      </div>

      {/* Friendly Guide Block */}
      {showFriendlyGuide && (
        <div className={`p-5 rounded-2xl border mb-6 transition-all ${
          isDarkMode ? "bg-indigo-950/15 border-indigo-900/40 text-slate-200" : "bg-indigo-50/40 border-indigo-100 text-slate-800"
        }`}>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 shrink-0 mt-0.5">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-sm text-indigo-600 dark:text-indigo-400 mb-2 flex items-center gap-1.5">
                راهنمای خودمونی: «کدینگ حساب‌ها» به زبان خیلی ساده چیست؟
              </h3>
              <p className="text-xs leading-relaxed opacity-90 mb-4">
                فکر کنید می‌خواهید تمام حساب‌کتاب‌های زندگی یا مغازه‌تان را منظم کنید. برای اینکه گم نشوند، از سیستم کشو و پوشه استفاده می‌کنیم که به آن <strong>کدینگ حساب‌ها</strong> می‌گویند. این ساختار ۴ سطح دارد:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-2">
                <div className={`p-3.5 rounded-xl border ${isDarkMode ? "bg-slate-950/40 border-slate-850" : "bg-white border-slate-100"}`}>
                  <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 mb-2">۱. گروه حساب (کشوهای اصلی کمد)</span>
                  <p className="text-[11px] leading-relaxed opacity-85">
                    کشوی اول: <strong>دارایی‌ها</strong> (هر چیزی که مال شماست). کشوی دوم: <strong>بدهی‌ها</strong> (طلب‌هایی که دیگران از شما دارند). کشوی سوم: <strong>هزینه‌ها</strong> و غیره.
                  </p>
                </div>

                <div className={`p-3.5 rounded-xl border ${isDarkMode ? "bg-slate-950/40 border-slate-850" : "bg-white border-slate-100"}`}>
                  <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-500 mb-2">۲. حساب کل (پوشه‌های بزرگ داخل کشو)</span>
                  <p className="text-[11px] leading-relaxed opacity-85">
                    مثلاً در کشوی دارایی‌ها، یک پوشه بزرگ داریم به نام <strong>«دارایی جاری»</strong> (پولی که توی جیبتان است یا تا یک سال آینده به پول نقد تبدیل می‌شود).
                  </p>
                </div>

                <div className={`p-3.5 rounded-xl border ${isDarkMode ? "bg-slate-950/40 border-slate-850" : "bg-white border-slate-100"}`}>
                  <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 mb-2">۳. حساب معین (برگه‌های ثبت فاکتور)</span>
                  <p className="text-[11px] leading-relaxed opacity-85">
                    برگه‌ای دقیق که تراکنش‌های خرید یا دریافت پول را در آن یادداشت می‌کنید. مثلاً حساب <strong>«موجودی نقد و بانک»</strong> یا حساب <strong>«هزینه اجاره دفتر»</strong>.
                  </p>
                </div>

                <div className={`p-3.5 rounded-xl border ${isDarkMode ? "bg-slate-950/40 border-slate-850" : "bg-white border-slate-100"}`}>
                  <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 mb-2">۴. تفصیلی شناور (آدم‌ها و بانک‌های طرف معامله)</span>
                  <p className="text-[11px] leading-relaxed opacity-85">
                    آدم‌ها، بانک‌ها، مشتریان یا کارمندانی که با آن‌ها داد و ستد می‌کنید (مثلاً <strong>«آقای محمدی»</strong>). این‌ها آزادند و می‌توانند به حساب‌های معین مختلف وصل شوند.
                  </p>
                </div>
              </div>

              <div className="mt-3.5 p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/15 text-[11px] flex items-center gap-2">
                <span className="font-bold">💡 مثال کاربردی:</span>
                <span>وقتی کارمند شما، آقای احمدی، حقوق می‌گیرد؛ <strong>هزینه حقوق و دستمزد (معین)</strong> بدهکار می‌شود و در کنارش نام <strong>آقای احمدی (تفصیلی شناور)</strong> درج می‌شود تا مشخص شود پول دقیقاً به چه کسی پرداخت شده است!</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6">
        <button
          onClick={() => { setActiveTab("tree"); setSearchTerm(""); }}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === "tree"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          }`}
        >
          درختواره کدینگ حساب‌ها
        </button>
        <button
          onClick={() => { setActiveTab("detailed"); setSearchTerm(""); }}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === "detailed"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          }`}
        >
          لیست تفصیلی‌های شناور ({countDetailed})
        </button>
        <button
          onClick={() => { setActiveTab("mapping"); setSearchTerm(""); }}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === "mapping"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          }`}
        >
          تخصیص و نگاشت تفصیلی به معین (جدول واسط)
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between mb-6">
        {activeTab !== "mapping" ? (
          <div className="relative w-full md:max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={
                activeTab === "tree" 
                  ? "جستجو در درختواره حساب‌ها (کد یا نام)..." 
                  : "جستجو در تفصیلی‌های شناور (نام یا کد)..."
              }
              className={`w-full pr-10 pl-4 py-2 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all ${
                isDarkMode 
                  ? "bg-slate-900 border-slate-800 text-slate-200 placeholder-slate-500" 
                  : "bg-white border-slate-200 text-slate-800 placeholder-slate-400"
              }`}
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm("")}
                className="absolute left-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ) : (
          <div className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-600"} font-bold`}>
            بخش تخصیص هوشمند تفصیلی شناور به حساب‌های معین از طریق جدول واسط
          </div>
        )}

        <div className="flex items-center gap-2 w-full md:w-auto">
          {activeTab === "tree" ? (
            <>
              <button 
                onClick={handleExpandAll}
                className={`flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
                  isDarkMode ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <FolderPlus className="w-3.5 h-3.5" /> باز کردن همه
              </button>
              <button 
                onClick={handleCollapseAll}
                className={`flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
                  isDarkMode ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <FolderMinus className="w-3.5 h-3.5" /> بستن همه
              </button>
              <button 
                onClick={() => setIsImportModalOpen(true)}
                className={`flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
                  isDarkMode ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
                title="بارگذاری نمونه حساب‌های استاندارد برای شرکت‌های ایرانی"
              >
                <Layers className="w-3.5 h-3.5 text-blue-500" /> کدینگ استاندارد ایران
              </button>
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors shrink-0"
              >
                <Plus className="w-4 h-4" /> تعریف حساب
              </button>
            </>
          ) : activeTab === "detailed" ? (
            <>
              <select 
                value={detailedFilterType}
                onChange={(e) => setDetailedFilterType(e.target.value)}
                className={`px-3 py-1.5 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                  isDarkMode ? "bg-slate-900 border-slate-800 text-slate-300" : "bg-white border-slate-200 text-slate-600"
                }`}
              >
                <option value="all">همه انواع تفصیلی</option>
                <option value="Customer">مشتریان</option>
                <option value="Supplier">تامین‌کنندگان</option>
                <option value="Bank">حساب‌های بانکی</option>
                <option value="Employee">پرسنل</option>
              </select>
              
              <button 
                onClick={() => setIsAddDetailedModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shrink-0"
              >
                <Plus className="w-4 h-4" /> تعریف تفصیلی
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => setIsAddDetailedModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shrink-0"
              >
                <Plus className="w-4 h-4" /> تعریف تفصیلی جدید
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main interactive sections */}
      {activeTab === "tree" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Tree list panel */}
          <div className={`lg:col-span-2 p-5 rounded-2xl border ${
            isDarkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"
          }`}>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className={`font-bold text-sm flex items-center gap-2 ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>
                <Activity className="w-4 h-4 text-blue-500" /> ساختار درختی کدینگ
              </h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                isDarkMode ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"
              }`}>
                {getFilteredAccounts().length} گره منطبق
              </span>
            </div>
            
            <div className="space-y-1.5">
              {getChildren(null).map(renderNode)}
              {getChildren(null).length === 0 && (
                <div className={`text-center py-10 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
                  هیچ حسابی منطبق با جستجوی شما یافت نشد.
                </div>
              )}
            </div>
          </div>

          {/* Guidelines and architecture explanation */}
          <div className="space-y-6">
            <div className={`p-5 rounded-2xl border flex flex-col gap-4 ${
              isDarkMode ? "bg-slate-800/30 border-slate-700" : "bg-slate-50 border-slate-200"
            }`}>
              <h4 className={`text-sm font-bold flex items-center gap-2 ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>
                <BookOpen className="w-4 h-4 text-indigo-500" /> سلسله‌مراتب کدینگ استاندارد
              </h4>
              <div className={`text-xs leading-relaxed space-y-3 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                <p>
                  <strong>۱. سطح گروه (۱ رقمی):</strong>
                  <br />بالاترین سطح طبقه‌بندی (مثال: ۱ برای دارایی‌ها، ۲ برای بدهی‌ها).
                </p>
                <p>
                  <strong>۲. سطح کل (۲ رقمی):</strong>
                  <br />گروه‌بندی اصلی دفاتر کل (مثال: ۱۰ برای دارایی‌های جاری).
                </p>
                <p>
                  <strong>۳. سطح معین (۴ رقمی):</strong>
                  <br />سطحی که مستقیماً در اسناد به کار می‌رود و تفصیلی‌ها به آن متصل می‌شوند.
                </p>
              </div>
            </div>

            <div className={`p-5 rounded-2xl border flex flex-col gap-4 ${
              isDarkMode ? "bg-slate-800/30 border-slate-700" : "bg-slate-50 border-slate-200"
            }`}>
              <h4 className={`text-sm font-bold flex items-center gap-2 ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>
                <ArrowLeftRight className="w-4 h-4 text-emerald-500" /> تفصیلی شناور چیست؟
              </h4>
              <p className={`text-xs leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                به جای تکرار کدهای معین برای مشتریان مختلف، یک بار حساب تفصیلی شناور (مثلا شرکت آلفا) تعریف شده و به هر چند حساب معین (مانند دریافتنی، پیش‌پرداخت و ...) متصل می‌شود. این باعث سبک شدن ساختار درختواره می‌شود.
              </p>
            </div>
          </div>
        </div>
      ) : activeTab === "detailed" ? (
        
        /* Floating Detailed Accounts Table View */
        <div className={`p-5 rounded-2xl border overflow-hidden ${
          isDarkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"
        }`}>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className={`font-bold border-b text-[11px] ${
                isDarkMode ? "bg-slate-950/40 border-slate-800 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-600"
              }`}>
                <tr>
                  <th className="px-4 py-3 text-center w-16">ردیف</th>
                  <th className="px-4 py-3 w-28">کد تفصیلی</th>
                  <th className="px-4 py-3">عنوان حساب تفصیلی</th>
                  <th className="px-4 py-3 w-32">نوع تفصیلی</th>
                  <th className="px-4 py-3">معین‌های متصل</th>
                  <th className="px-4 py-3 text-center w-24">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {getFilteredDetailedList().map((item, index) => {
                  // Find connected subledgers for this detailed account
                  const connectedSubledgers = links
                    .filter(l => l.detailed_account_id === item.id)
                    .map(l => accounts.find(a => a.id === l.account_id))
                    .filter((a): a is Account => a !== undefined);

                  return (
                    <tr key={item.id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors`}>
                      <td className="px-4 py-3 text-center font-mono text-slate-400">{index + 1}</td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-500">{item.code}</td>
                      <td className={`px-4 py-3 font-bold ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>
                        {item.name}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                          item.type === "Customer" ? "bg-blue-500/10 text-blue-500" :
                          item.type === "Supplier" ? "bg-amber-500/10 text-amber-500" :
                          item.type === "Bank" ? "bg-emerald-500/10 text-emerald-500" :
                          "bg-purple-500/10 text-purple-500"
                        }`}>
                          {getDetailedTypeLabel(item.type)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {connectedSubledgers.map(sub => (
                            <span 
                              key={sub.id} 
                              className={`text-[10px] px-2 py-0.5 rounded border ${
                                isDarkMode 
                                  ? "bg-slate-800 border-slate-700 text-slate-300" 
                                  : "bg-slate-100 border-slate-200 text-slate-600"
                              }`}
                            >
                              <span className="font-mono text-[9px] text-slate-400 ml-1">{sub.code}</span>
                              {sub.name}
                            </span>
                          ))}
                          {connectedSubledgers.length === 0 && (
                            <span className="text-slate-400 text-[11px] italic">بدون اتصال فعال</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button 
                            onClick={() => handleOpenEditDetailed(item)}
                            title="ویرایش تفصیلی"
                            className={`p-1.5 rounded-lg transition-colors ${
                              isDarkMode ? "hover:bg-slate-800 text-blue-400" : "hover:bg-slate-100 text-blue-600"
                            }`}
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteDetailed(item)}
                            title="حذف تفصیلی"
                            className={`p-1.5 rounded-lg transition-colors text-red-500 hover:bg-red-500/10`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {getFilteredDetailedList().length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
                      هیچ حساب تفصیلی شناوری یافت نشد.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Floating Detailed Mapping / Assignment Management View (جدول واسط) */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Right Column: Independent Entities List (1/3) */}
          <div className={`p-5 rounded-2xl border flex flex-col gap-3 ${
            isDarkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"
          }`}>
            <div className="flex flex-col gap-3 mb-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className={`font-bold text-sm flex items-center gap-2 ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>
                <Users className="w-4 h-4 text-emerald-500" /> موجودیت‌های مستقل تفصیلی
              </h3>
              
              {/* Type Filter Pills */}
              <div className="flex flex-wrap gap-1">
                {["all", "Customer", "Supplier", "Bank", "Employee"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setMappingTypeFilter(type)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                      mappingTypeFilter === type
                        ? "bg-emerald-600 text-white"
                        : isDarkMode
                          ? "bg-slate-800 text-slate-400 hover:bg-slate-750"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {type === "all" ? "همه" : getDetailedTypeLabel(type)}
                  </button>
                ))}
              </div>

              {/* Local Search input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
                <input
                  type="text"
                  value={mappingDetailedSearch}
                  onChange={(e) => setMappingDetailedSearch(e.target.value)}
                  placeholder="جستجو در موجودیت‌ها..."
                  className={`w-full pr-8 pl-3 py-1.5 rounded-lg text-[11px] border focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all ${
                    isDarkMode 
                      ? "bg-slate-950 border-slate-800 text-slate-200 placeholder-slate-500" 
                      : "bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400"
                  }`}
                />
              </div>
            </div>

            {/* Entity cards list */}
            <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
              {detailedAccounts
                .filter(d => {
                  if (mappingTypeFilter !== "all" && d.type !== mappingTypeFilter) return false;
                  if (!mappingDetailedSearch.trim()) return true;
                  const search = mappingDetailedSearch.toLowerCase();
                  return d.name.toLowerCase().includes(search) || d.code.includes(search);
                })
                .map((item) => {
                  const isSelected = selectedMappingDetailedId === item.id;
                  const connectedCount = links.filter((l) => l.detailed_account_id === item.id).length;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedMappingDetailedId(item.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col gap-1.5 ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500"
                          : isDarkMode
                            ? "border-slate-800 bg-slate-950/40 hover:bg-slate-800/40"
                            : "border-slate-100 bg-slate-50/50 hover:bg-slate-100/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900 dark:text-slate-100 font-sans">
                          {item.name}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                          item.type === "Customer" 
                            ? "bg-blue-500/10 text-blue-500"
                            : item.type === "Supplier"
                              ? "bg-amber-500/10 text-amber-500"
                              : item.type === "Bank"
                                ? "bg-emerald-500/10 text-emerald-500"
                                : "bg-purple-500/10 text-purple-500"
                        }`}>
                          {getDetailedTypeLabel(item.type)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span className="font-mono">کد: {item.code}</span>
                        <span className={`px-1.5 py-0.5 rounded font-bold ${
                          connectedCount > 0
                            ? "bg-emerald-500/10 text-emerald-600"
                            : "bg-slate-500/10 text-slate-500"
                        }`}>
                          {connectedCount} معین متصل
                        </span>
                      </div>
                    </div>
                  );
                })}
              
              {detailedAccounts.filter(d => {
                if (mappingTypeFilter !== "all" && d.type !== mappingTypeFilter) return false;
                if (!mappingDetailedSearch.trim()) return true;
                const search = mappingDetailedSearch.toLowerCase();
                return d.name.toLowerCase().includes(search) || d.code.includes(search);
              }).length === 0 && (
                <div className={`text-center py-10 text-[11px] ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
                  هیچ حساب تفصیلی شناوری منطبق با فیلتر یافت نشد.
                </div>
              )}
            </div>
          </div>

          {/* Left Column: Subledger Dynamic Assignment Interface (2/3) */}
          <div className={`lg:col-span-2 p-5 rounded-2xl border ${
            isDarkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"
          }`}>
            {(() => {
              const selectedEntity = detailedAccounts.find(d => d.id === selectedMappingDetailedId);
              if (!selectedEntity) {
                return (
                  <div className="text-center py-24 flex flex-col items-center gap-3">
                    <Users className="w-8 h-8 text-slate-400" />
                    <p className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                      جهت شروع انتساب داینامیک، یک تفصیلی شناور را از لیست سمت راست انتخاب کنید.
                    </p>
                  </div>
                );
              }

              // Get all subledger accounts in system
              const subledgerAccounts = accounts.filter(a => a.level === AccountLevel.SUBLEDGER);
              
              // Filter subledgers based on mappingSubledgerSearch
              const filteredSubledgers = subledgerAccounts.filter(s => {
                if (!mappingSubledgerSearch.trim()) return true;
                const search = mappingSubledgerSearch.toLowerCase();
                return s.name.toLowerCase().includes(search) || s.code.includes(search);
              });

              return (
                <div className="flex flex-col gap-4">
                  {/* Active Selection Details Header */}
                  <div className={`p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                    isDarkMode ? "bg-slate-950/60" : "bg-slate-50"
                  }`}>
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 font-sans">
                            {selectedEntity.name}
                          </h4>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-500`}>
                            {getDetailedTypeLabel(selectedEntity.type)}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          تخصیص داینامیک این موجودیت مستقل به حساب‌های معین در جدول واسط
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold text-slate-500">
                        کد تفصیلی: {selectedEntity.code}
                      </span>
                      <div className="h-4 w-[1px] bg-slate-300 dark:bg-slate-800" />
                      <button
                        onClick={() => handleOpenEditDetailed(selectedEntity)}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-colors flex items-center gap-1 ${
                          isDarkMode
                            ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <Edit className="w-3.5 h-3.5" /> ویرایش شناسنامه موجودیت
                      </button>
                    </div>
                  </div>

                  {/* Subledger search bar & quick bulk helpers */}
                  <div className="flex flex-col md:flex-row items-center justify-between gap-3">
                    <div className="relative w-full md:max-w-xs">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
                      <input
                        type="text"
                        value={mappingSubledgerSearch}
                        onChange={(e) => setMappingSubledgerSearch(e.target.value)}
                        placeholder="جستجو در حساب‌های معین..."
                        className={`w-full pr-8 pl-3 py-1.5 rounded-lg text-xs border focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all ${
                          isDarkMode 
                            ? "bg-slate-950 border-slate-800 text-slate-200 placeholder-slate-500" 
                            : "bg-white border-slate-200 text-slate-800 placeholder-slate-400"
                        }`}
                      />
                    </div>

                    <div className="flex items-center gap-1.5 self-stretch md:self-auto justify-end">
                      <button
                        onClick={() => {
                          // Link all filtered subledgers in one shot
                          const unlinkedSubledgerIds = filteredSubledgers
                            .filter(sub => !links.some(l => l.account_id === sub.id && l.detailed_account_id === selectedEntity.id))
                            .map(sub => sub.id);
                          
                          if (unlinkedSubledgerIds.length === 0) {
                            showNotification("تمام حساب‌های معین فیلتر شده از قبل متصل هستند.", "info");
                            return;
                          }

                          const newLinksToAdd = unlinkedSubledgerIds.map(subId => ({
                            account_id: subId,
                            detailed_account_id: selectedEntity.id
                          }));
                          setLinks([...links, ...newLinksToAdd]);
                          showNotification(`${unlinkedSubledgerIds.length} حساب معین به صورت داینامیک متصل شدند.`, "success");
                        }}
                        className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-colors bg-emerald-600 hover:bg-emerald-700 text-white`}
                      >
                        اتصال گروهی به موارد فیلتر شده
                      </button>
                      
                      <button
                        onClick={() => {
                          // Unlink all for this detailed account
                          const updatedLinks = links.filter(l => l.detailed_account_id !== selectedEntity.id);
                          setLinks(updatedLinks);
                          showNotification(`تمام اتصالات حساب تفصیلی ${selectedEntity.name} قطع گردید.`, "info");
                        }}
                        className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-colors bg-red-500/10 text-red-500 hover:bg-red-500/20`}
                      >
                        قطع تمامی اتصالات
                      </button>
                    </div>
                  </div>

                  {/* Dynamic Assignment Subledger Matrix Table */}
                  <div className="border border-slate-100 dark:border-slate-800/80 rounded-xl overflow-hidden">
                    <div className="overflow-y-auto max-h-[380px]">
                      <table className="w-full text-right text-xs">
                        <thead className={`font-bold border-b text-[10px] sticky top-0 z-10 ${
                          isDarkMode ? "bg-slate-950 border-slate-850 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-500"
                        }`}>
                          <tr>
                            <th className="px-4 py-2.5 w-24">کد معین</th>
                            <th className="px-4 py-2.5">عنوان حساب معین</th>
                            <th className="px-4 py-2.5 text-center w-28">وضعیت انتساب</th>
                            <th className="px-4 py-2.5 text-center w-28">اقدام داینامیک</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-855/60">
                          {filteredSubledgers.map((sub) => {
                            const isLinked = links.some(l => l.account_id === sub.id && l.detailed_account_id === selectedEntity.id);
                            return (
                              <tr 
                                key={sub.id} 
                                className={`hover:bg-slate-50/40 dark:hover:bg-slate-850/10 transition-all ${
                                  isLinked ? (isDarkMode ? "bg-emerald-500/[0.02]" : "bg-emerald-50/[0.15]") : ""
                                }`}
                              >
                                <td className="px-4 py-2.5 font-mono font-bold text-slate-600 dark:text-slate-400">
                                  {sub.code}
                                </td>
                                <td className="px-4 py-2.5 font-medium text-slate-900 dark:text-slate-100">
                                  {sub.name}
                                </td>
                                <td className="px-4 py-2.5 text-center">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                    isLinked
                                      ? (isDarkMode ? "bg-emerald-500/15 text-emerald-400" : "bg-emerald-50 text-emerald-700 border border-emerald-200")
                                      : (isDarkMode ? "bg-slate-800 text-slate-500" : "bg-slate-100 text-slate-400")
                                  }`}>
                                    {isLinked ? "✓ متصل" : "آزاد"}
                                  </span>
                                </td>
                                <td className="px-4 py-2 text-center">
                                  <button
                                    onClick={() => {
                                      if (isLinked) {
                                        handleQuickUnlink(sub.id, selectedEntity.id);
                                      } else {
                                        handleQuickLink(sub.id, selectedEntity.id);
                                      }
                                    }}
                                    className={`text-[10px] font-bold px-3 py-1 rounded-lg transition-all ${
                                      isLinked
                                        ? "bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400"
                                        : "bg-emerald-600 hover:bg-emerald-700 text-white"
                                    }`}
                                  >
                                    {isLinked ? "قطع اتصال" : "برقراری اتصال"}
                                  </button>
                                </td>
                              </tr>
                            );
                          })}

                          {filteredSubledgers.length === 0 && (
                            <tr>
                              <td colSpan={4} className="px-4 py-12 text-center text-xs text-slate-400 italic">
                                هیچ حساب معینی یافت نشد.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

        </div>
      )}

      {/* Add Account Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className={`w-full max-w-md p-6 rounded-2xl shadow-xl flex flex-col gap-4 ${
            isDarkMode ? "bg-slate-900 border border-slate-750" : "bg-white border border-slate-200"
          }`}>
            <div className="flex items-center justify-between">
              <h3 className={`text-base font-bold ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>
                تعریف حساب جدید
              </h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className={`p-1.5 rounded-lg transition-colors ${
                  isDarkMode ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-500"
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                  سطح حساب
                </label>
                <select 
                  value={newAccLevel} 
                  onChange={(e) => {
                    setNewAccLevel(e.target.value as AccountLevel);
                    setNewAccParentId(""); 
                    setNewAccCode("");
                  }}
                  className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                    isDarkMode ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-slate-50 border-slate-300 text-slate-800"
                  }`}
                >
                  <option value={AccountLevel.GROUP}>گروه (۱ رقمی)</option>
                  <option value={AccountLevel.LEDGER}>کل (۲ رقمی)</option>
                  <option value={AccountLevel.SUBLEDGER}>معین (۴ رقمی)</option>
                </select>
              </div>

              {newAccLevel !== AccountLevel.GROUP && (
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                    حساب والد ({newAccLevel === AccountLevel.LEDGER ? "گروه" : "کل"})
                  </label>
                  <select 
                    value={newAccParentId} 
                    onChange={(e) => {
                      setNewAccParentId(e.target.value);
                      const selectedParent = accounts.find(a => a.id === e.target.value);
                      if (selectedParent) {
                        setNewAccCode(selectedParent.code); // pre-populate with parent code
                      } else {
                        setNewAccCode("");
                      }
                    }}
                    className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                      isDarkMode ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-slate-50 border-slate-300 text-slate-800"
                    }`}
                  >
                    <option value="">-- انتخاب والد --</option>
                    {accounts.filter(a => a.level === (newAccLevel === AccountLevel.LEDGER ? AccountLevel.GROUP : AccountLevel.LEDGER)).map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                  کد حساب
                </label>
                <input 
                  type="text" 
                  value={newAccCode} 
                  onChange={(e) => setNewAccCode(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder={
                    newAccLevel === AccountLevel.GROUP ? "مثال: 3" :
                    newAccLevel === AccountLevel.LEDGER ? "مثال: 12" : "مثال: 1030"
                  }
                  className={`w-full px-3 py-2 font-mono rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                    isDarkMode ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-white border-slate-300 text-slate-800"
                  }`}
                />
                {suggestedCode && (
                  <div className="flex items-center justify-between mt-1.5 px-1 text-[10px]">
                    <span className={isDarkMode ? "text-slate-400" : "text-slate-500"}>
                      کد پیشنهادی سیستم: <strong className="font-mono text-blue-500">{suggestedCode}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setNewAccCode(suggestedCode)}
                      className="text-blue-500 hover:text-blue-600 font-bold transition-colors"
                    >
                      اعمال کد پیشنهادی
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                  عنوان حساب
                </label>
                <input 
                  type="text" 
                  value={newAccName} 
                  onChange={(e) => setNewAccName(e.target.value)}
                  placeholder="مثال: موجودی کالا"
                  className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                    isDarkMode ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-white border-slate-300 text-slate-800"
                  }`}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-2">
              <button 
                onClick={handleAddAccount}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-3.5 h-3.5" /> ذخیره حساب
              </button>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${
                  isDarkMode 
                    ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750" 
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Account Modal */}
      {isEditModalOpen && editingAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className={`w-full max-w-md p-6 rounded-2xl shadow-xl flex flex-col gap-4 ${
            isDarkMode ? "bg-slate-900 border border-slate-750" : "bg-white border border-slate-200"
          }`}>
            <div className="flex items-center justify-between">
              <h3 className={`text-base font-bold ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>
                ویرایش حساب
              </h3>
              <button 
                onClick={() => { setIsEditModalOpen(false); setEditingAccount(null); }}
                className={`p-1.5 rounded-lg transition-colors ${
                  isDarkMode ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-500"
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                  سطح حساب (غیرقابل تغییر)
                </label>
                <input 
                  type="text" 
                  disabled
                  value={
                    editingAccount.level === AccountLevel.GROUP ? "گروه" :
                    editingAccount.level === AccountLevel.LEDGER ? "کل" : "معین"
                  }
                  className={`w-full px-3 py-2 rounded-xl text-xs border bg-slate-100 dark:bg-slate-950 text-slate-500 border-slate-200 dark:border-slate-850 cursor-not-allowed`}
                />
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                  کد حساب
                </label>
                <input 
                  type="text" 
                  value={editAccCode} 
                  onChange={(e) => setEditAccCode(e.target.value.replace(/[^0-9]/g, ''))}
                  className={`w-full px-3 py-2 font-mono rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                    isDarkMode ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-white border-slate-300 text-slate-800"
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                  عنوان حساب
                </label>
                <input 
                  type="text" 
                  value={editAccName} 
                  onChange={(e) => setEditAccName(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                    isDarkMode ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-white border-slate-300 text-slate-800"
                  }`}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-2">
              <button 
                onClick={handleEditAccount}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-3.5 h-3.5" /> اعمال تغییرات
              </button>
              <button 
                onClick={() => { setIsEditModalOpen(false); setEditingAccount(null); }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${
                  isDarkMode 
                    ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750" 
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Detailed Account Modal */}
      {isAddDetailedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className={`w-full max-w-md p-6 rounded-2xl shadow-xl flex flex-col gap-4 ${
            isDarkMode ? "bg-slate-900 border border-slate-750" : "bg-white border border-slate-200"
          }`}>
            <div className="flex items-center justify-between">
              <h3 className={`text-base font-bold ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>
                تعریف تفصیلی شناور جدید
              </h3>
              <button 
                onClick={() => setIsAddDetailedModalOpen(false)}
                className={`p-1.5 rounded-lg transition-colors ${
                  isDarkMode ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-500"
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                  نوع تفصیلی
                </label>
                <select 
                  value={newDetailedType} 
                  onChange={(e) => setNewDetailedType(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                    isDarkMode ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-slate-50 border-slate-300 text-slate-800"
                  }`}
                >
                  <option value="Customer">مشتری</option>
                  <option value="Supplier">تامین‌کننده</option>
                  <option value="Bank">حساب بانکی</option>
                  <option value="Employee">پرسنل</option>
                  <option value="Other">سایر اشخاص</option>
                </select>
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                  کد تفصیلی (۵ رقمی)
                </label>
                <input 
                  type="text" 
                  value={newDetailedCode} 
                  onChange={(e) => setNewDetailedCode(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="مثال: 10001"
                  maxLength={5}
                  className={`w-full px-3 py-2 font-mono rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                    isDarkMode ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-white border-slate-300 text-slate-800"
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                  عنوان تفصیلی
                </label>
                <input 
                  type="text" 
                  value={newDetailedName} 
                  onChange={(e) => setNewDetailedName(e.target.value)}
                  placeholder="مثال: شرکت بازرگانی پارس"
                  className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                    isDarkMode ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-white border-slate-300 text-slate-800"
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                  اتصال به حساب‌های معین (اختیاری)
                </label>
                <div className={`max-h-36 overflow-y-auto p-2 rounded-xl border ${
                  isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"
                }`}>
                  {accounts.filter(a => a.level === AccountLevel.SUBLEDGER).map(subledger => (
                    <label key={subledger.id} className="flex items-center gap-2 p-1.5 hover:bg-slate-500/5 rounded cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={selectedSubledgers.includes(subledger.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSubledgers([...selectedSubledgers, subledger.id]);
                          } else {
                            setSelectedSubledgers(selectedSubledgers.filter(id => id !== subledger.id));
                          }
                        }}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/50"
                      />
                      <span className={`text-[11px] ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                        <span className="font-mono text-slate-400 ml-1">[{subledger.code}]</span>
                        {subledger.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-2">
              <button 
                onClick={handleAddDetailedAccount}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-3.5 h-3.5" /> ثبت تفصیلی
              </button>
              <button 
                onClick={() => setIsAddDetailedModalOpen(false)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${
                  isDarkMode 
                    ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750" 
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Detailed Account Modal */}
      {isEditDetailedModalOpen && editingDetailed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className={`w-full max-w-md p-6 rounded-2xl shadow-xl flex flex-col gap-4 ${
            isDarkMode ? "bg-slate-900 border border-slate-750" : "bg-white border border-slate-200"
          }`}>
            <div className="flex items-center justify-between">
              <h3 className={`text-base font-bold ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>
                ویرایش تفصیلی شناور
              </h3>
              <button 
                onClick={() => { setIsEditDetailedModalOpen(false); setEditingDetailed(null); }}
                className={`p-1.5 rounded-lg transition-colors ${
                  isDarkMode ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-500"
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                  نوع تفصیلی
                </label>
                <select 
                  value={editDetailedType} 
                  onChange={(e) => setEditDetailedType(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                    isDarkMode ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-slate-50 border-slate-300 text-slate-800"
                  }`}
                >
                  <option value="Customer">مشتری</option>
                  <option value="Supplier">تامین‌کننده</option>
                  <option value="Bank">حساب بانکی</option>
                  <option value="Employee">پرسنل</option>
                  <option value="Other">سایر اشخاص</option>
                </select>
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                  کد تفصیلی
                </label>
                <input 
                  type="text" 
                  value={editDetailedCode} 
                  onChange={(e) => setEditDetailedCode(e.target.value.replace(/[^0-9]/g, ''))}
                  className={`w-full px-3 py-2 font-mono rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                    isDarkMode ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-white border-slate-300 text-slate-800"
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                  عنوان تفصیلی
                </label>
                <input 
                  type="text" 
                  value={editDetailedName} 
                  onChange={(e) => setEditDetailedName(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                    isDarkMode ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-white border-slate-300 text-slate-800"
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                  مدیریت اتصال به معین‌ها
                </label>
                <div className={`max-h-36 overflow-y-auto p-2 rounded-xl border ${
                  isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"
                }`}>
                  {accounts.filter(a => a.level === AccountLevel.SUBLEDGER).map(subledger => (
                    <label key={subledger.id} className="flex items-center gap-2 p-1.5 hover:bg-slate-500/5 rounded cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={editSelectedSubledgers.includes(subledger.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEditSelectedSubledgers([...editSelectedSubledgers, subledger.id]);
                          } else {
                            setEditSelectedSubledgers(editSelectedSubledgers.filter(id => id !== subledger.id));
                          }
                        }}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/50"
                      />
                      <span className={`text-[11px] ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                        <span className="font-mono text-slate-400 ml-1">[{subledger.code}]</span>
                        {subledger.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-2">
              <button 
                onClick={handleEditDetailed}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-3.5 h-3.5" /> ذخیره تغییرات
              </button>
              <button 
                onClick={() => { setIsEditDetailedModalOpen(false); setEditingDetailed(null); }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${
                  isDarkMode 
                    ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750" 
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Standard Iranian Coding Template Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className={`w-full max-w-lg p-6 rounded-2xl shadow-xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto ${
            isDarkMode ? "bg-slate-900 border border-slate-750 text-slate-100" : "bg-white border border-slate-200 text-slate-900"
          }`}>
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-500" /> بارگذاری ساختار کدینگ استاندارد حسابداری ایران
              </h3>
              <button 
                onClick={() => { setIsImportModalOpen(false); setShowResetConfirm(false); }}
                className={`p-1.5 rounded-lg transition-colors ${
                  isDarkMode ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-500"
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!showResetConfirm ? (
              <>
                <div className="space-y-4 text-xs leading-relaxed">
                  <p className={isDarkMode ? "text-slate-400" : "text-slate-600"}>
                    این ابزار ساختار کدینگ حسابداری استاندارد طبق قوانین مالی و مالیاتی ایران را به صورت کامل و در سه سطح (گروه، کل و معین) بارگذاری می‌کند. این الگو شامل سرفصل‌های استاندارد دارایی‌ها، بدهی‌ها، حقوق صاحبان سهام، درآمدها و هزینه‌ها است.
                  </p>

                  <div className={`p-4 rounded-xl border space-y-2 ${
                    isDarkMode ? "bg-slate-950 border-slate-850" : "bg-slate-50 border-slate-200"
                  }`}>
                    <h4 className="font-bold text-[11px] text-blue-500">لیست سرفصل‌های کلیدی الگو:</h4>
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-500">
                      <div>۱. دارایی‌ها (جاری و ثابت مشهود)</div>
                      <div>۲. بدهی‌ها (حساب‌ها و تسهیلات)</div>
                      <div>۳. حقوق صاحبان سهام (سرمایه و سود انباشته)</div>
                      <div>۴. درآمدهای عملیاتی و ارائه خدمات</div>
                      <div>۵. هزینه‌های عمومی، اداری و پرسنل</div>
                      <div>۶. هزینه‌های مالی و کارمزدهای بانکی</div>
                    </div>
                  </div>

                  <div className="border border-amber-500/30 bg-amber-500/5 rounded-xl p-3 text-[10px] space-y-1 text-amber-600 dark:text-amber-400">
                    <div className="font-bold flex items-center gap-1">
                      <Info className="w-3.5 h-3.5" /> راهنمای انتخاب شیوه بارگذاری:
                    </div>
                    <ul className="list-disc list-inside space-y-1">
                      <li><strong>تلفیق با کدهای فعلی:</strong> فقط حساب‌هایی که کدهای آن‌ها در سیستم موجود نیست اضافه خواهند شد. به هیچ عنوان داده‌های قبلی شما حذف نمی‌شود.</li>
                      <li><strong>بازنشانی کامل (شروع تازه):</strong> ساختار فعلی به طور کامل پاک شده و ساختار استاندارد نو جایگزین می‌شود. اتصالات به حساب‌های تفصیلی قطع خواهد شد.</li>
                    </ul>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 mt-2">
                  <button 
                    onClick={() => handleLoadStandardCoding("merge")}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
                  >
                    تلفیق و ادغام با حساب‌های فعلی
                  </button>
                  <button 
                    onClick={() => setShowResetConfirm(true)}
                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
                  >
                    بازنشانی و جایگزینی کامل کدینگ
                  </button>
                  <button 
                    onClick={() => { setIsImportModalOpen(false); setShowResetConfirm(false); }}
                    className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all border ${
                      isDarkMode 
                        ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750" 
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    انصراف
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-4 py-4 text-center">
                  <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
                    <Trash2 className="w-6 h-6" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-bold text-sm text-red-500">هشدار بسیار مهم</h4>
                    <p className={`text-xs leading-relaxed ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
                      با این کار تمام کدینگ حساب‌های تعریف شده قبلی، مانده حساب‌ها و اتصالات تفصیلی شما پاک خواهد شد و سرفصل‌های پیش‌فرض استاندارد حسابداری ایران جایگزین می‌شود.
                    </p>
                    <p className="text-xs font-bold text-amber-500">
                      آیا از اجرای این عملیات اطمینان کامل دارید؟
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-2">
                  <button 
                    onClick={() => {
                      handleLoadStandardCoding("reset");
                      setShowResetConfirm(false);
                    }}
                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    بله، حذف کامل و بارگذاری استاندارد
                  </button>
                  <button 
                    onClick={() => setShowResetConfirm(false)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                      isDarkMode 
                        ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750" 
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    خیر، بازگشت
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
