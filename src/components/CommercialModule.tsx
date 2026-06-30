import React, { useState, useEffect, useMemo } from "react";
import {
  ShoppingBag,
  Receipt,
  Users,
  TrendingUp,
  Percent,
  BarChart3,
  Plus,
  Trash2,
  FileText,
  ChevronLeft,
  UserCheck,
  PlusCircle,
  Printer,
  Calculator,
  DollarSign,
  Scale,
  ShieldAlert,
  Info,
  BookOpen,
  ArrowUpDown,
  Send,
  Edit,
  Search,
  Eye,
  X,
  Building,
  Phone,
  MapPin,
  CreditCard,
  Download,
  Filter,
  Calendar,
  TrendingDown,
  Sparkles,
  CheckCircle,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
} from "recharts";
import {
  CommercialEngine,
  Invoice,
  InvoiceLine,
  InvoiceType,
  InvoiceStatus,
  Product,
  Partner,
  ManualExpense,
} from "../lib/commercial-engine";
import { CounterpartyService } from "../lib/counterparty-engine";

const numToWordsFa = (num: number): string => {
  if (num === 0) return "صفر";
  
  const yekan = ["", "یک", "دو", "سه", "چهار", "پنج", "شش", "هفت", "هشت", "نه"];
  const dahgan = ["", "ده", "بیست", "سی", "چهل", "پنجاه", "شصت", "هفتاد", "هشتاد", "نود"];
  const dahToNuzdah = ["ده", "یازده", "دوازده", "سیزده", "چهارده", "پانزده", "شانزده", "هفده", "هجده", "نوزده"];
  const sadgan = ["", "صد", "دویست", "سیصد", "چهارصد", "پانصد", "ششصد", "هفتصد", "هشتصد", "نهصد"];
  const stages = ["", "هزار", "میلیون", "میلیارد", "تریلیون"];

  const convertThreeDigits = (n: number): string => {
    if (n === 0) return "";
    let res = "";
    const s = Math.floor(n / 100);
    const d = Math.floor((n % 100) / 10);
    const y = n % 10;

    if (s > 0) res += sadgan[s];
    
    if (d > 0) {
      if (res !== "") res += " و ";
      if (d === 1 && y >= 0) {
        res += dahToNuzdah[y];
        return res;
      } else {
        res += dahgan[d];
      }
    }
    
    if (y > 0) {
      if (res !== "") res += " و ";
      res += yekan[y];
    }
    return res;
  };

  let temp = Math.floor(num);
  let stageCount = 0;
  const parts: string[] = [];

  while (temp > 0) {
    const chunk = temp % 1000;
    if (chunk > 0) {
      const words = convertThreeDigits(chunk);
      parts.unshift(words + (stages[stageCount] !== "" ? " " + stages[stageCount] : ""));
    }
    temp = Math.floor(temp / 1000);
    stageCount++;
  }

  return parts.join(" و ");
};

interface CommercialModuleProps {
  isDarkMode: boolean;
  showNotification: (text: string, type?: "success" | "error" | "info") => void;
}

const engine = new CommercialEngine();

export default function CommercialModule({
  isDarkMode,
  showNotification,
}: CommercialModuleProps) {
  const [activeTab, setActiveTab] = useState<
    "invoices" | "partners" | "profit_loss"
  >("invoices");
  const [showFriendlyGuide, setShowFriendlyGuide] = useState(true);

  // --- Engine Data State ---
  const [products, setProducts] = useState<Product[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [manualExpenses, setManualExpenses] = useState<ManualExpense[]>([]);

  const loadData = () => {
    setProducts([...engine.getProducts()]);
    setPartners([...engine.getPartners()]);
    setInvoices([...engine.getInvoices()]);
    setManualExpenses([...engine.getManualExpenses()]);
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- Form States for adding new elements ---
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);

  // --- Search & Filter States ---
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [partnerSearchQuery, setPartnerSearchQuery] = useState("");
  const [partnerFilterType, setPartnerFilterType] = useState<string>("ALL");

  // --- Profit & Loss States ---
  const [plProductSearch, setPlProductSearch] = useState("");
  const [plProductSort, setPlProductSort] = useState<"profit" | "revenue" | "margin" | "qtySold">("profit");
  const [plProductSortDirection, setPlProductSortDirection] = useState<"asc" | "desc">("desc");
  const [plFromDate, setPlFromDate] = useState("");
  const [plToDate, setPlToDate] = useState("");
  const [plPartnerFilter, setPlPartnerFilter] = useState("ALL");
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [newExpenseData, setNewExpenseData] = useState({
    date: new Date().toLocaleDateString("fa-IR"),
    amount: 0,
    description: "",
  });

  const [newInvoice, setNewInvoice] = useState<{
    invoice_number: string;
    invoice_type: InvoiceType;
    client_id: string;
    invoice_date: string;
    description: string;
    total_discount_header: number;
    lines: InvoiceLine[];
    manual_rounding: number;
  }>({
    invoice_number: "",
    invoice_type: InvoiceType.SALE,
    client_id: "",
    invoice_date: new Date().toLocaleDateString("fa-IR"),
    description: "",
    total_discount_header: 0,
    lines: [],
    manual_rounding: 0,
  });

  const [newItemProduct, setNewItemProduct] = useState("");
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemPrice, setNewItemPrice] = useState(0);
  const [newItemDiscount, setNewItemDiscount] = useState(0);
  const [newItemVat, setNewItemVat] = useState(10);

  const [showQuickAddProduct, setShowQuickAddProduct] = useState(false);
  const [quickProductData, setQuickProductData] = useState({
    name: "",
    purchase_price: 0,
    base_price: 0,
    wholesale_price: 0,
    partner_price: 0,
  });

  const [isCreatingPartner, setIsCreatingPartner] = useState(false);
  const [viewingPartner, setViewingPartner] = useState<Partner | null>(null);
  const [isEditingPartner, setIsEditingPartner] = useState(false);
  const [editingPartnerData, setEditingPartnerData] = useState<Partial<Partner>>({});
  const [newPartner, setNewPartner] = useState<Partial<Partner>>({
    name: "",
    type: "customer",
    credit_limit: 500000000,
    price_list_type: "consumer",
    line_discount_percent: 0,
    volume_discount_percent: 0,
    person_type: "REAL",
    national_id: "",
    economic_code: "",
    phone_number: "",
    mobile_number: "",
    province: "",
    city: "",
    address: "",
  });

  // Automatically update unit price in invoice creator based on selected product and partner list
  const handleProductSelect = (
    prodId: string,
    partnerId: string,
    type: string,
  ) => {
    setNewItemProduct(prodId);
    const prod = products.find((p) => p.id === prodId);
    if (!prod) return;

    if (type === InvoiceType.PURCHASE || type === InvoiceType.PURCHASE_RETURN) {
      setNewItemPrice(prod.purchase_price);
      return;
    }

    const partner = partners.find((p) => p.id === partnerId);
    const listType = partner ? partner.price_list_type : "consumer";

    if (listType === "wholesale") {
      setNewItemPrice(prod.wholesale_price);
    } else if (listType === "partner") {
      setNewItemPrice(prod.partner_price);
    } else {
      setNewItemPrice(prod.base_price);
    }

    // Connect line discount as default
    setNewItemDiscount(partner ? partner.line_discount_percent : 0);
  };

  const formatRial = (num: number) => {
    return Math.round(num).toLocaleString("fa-IR") + " ریال";
  };

  // Add Item to active custom Invoice Creator
  const addItemToInvoice = () => {
    if (!newItemProduct) {
      showNotification("لطفاً یک کالا انتخاب نمایید.", "error");
      return;
    }
    if (newItemQty <= 0) {
      showNotification("مقدار کالا باید حداقل ۱ عدد باشد.", "error");
      return;
    }

    const existingIndex = newInvoice.lines.findIndex(
      (item) => item.product_id === newItemProduct,
    );
    const updatedItems = [...newInvoice.lines];

    const newLine: InvoiceLine = {
      id: "L-" + Math.random().toString(36).substring(2, 9),
      invoice_id: "", // Will be assigned by engine
      product_id: newItemProduct,
      warehouse_id: "WH-MAIN",
      quantity: newItemQty,
      unit_price: newItemPrice,
      gross_amount: 0,
      discount_percentage: newItemDiscount,
      discount_amount: 0,
      vat_percentage: newItemVat,
      vat_amount: 0,
      net_amount: 0,
    };

    if (existingIndex > -1) {
      updatedItems[existingIndex] = newLine;
    } else {
      updatedItems.push(newLine);
    }

    setNewInvoice((prev) => ({ ...prev, lines: updatedItems }));
    showNotification("کالا با موفقیت به اقلام فاکتور اضافه شد.", "success");

    setNewItemProduct("");
    setNewItemQty(1);
    setNewItemPrice(0);
    setNewItemDiscount(0);
    setNewItemVat(10);
  };

  const removeItemFromInvoice = (index: number) => {
    const updated = newInvoice.lines.filter((_, i) => i !== index);
    setNewInvoice((prev) => ({ ...prev, lines: updated }));
  };

  const handleLineChange = (index: number, key: keyof InvoiceLine, value: number) => {
    const updatedLines = [...newInvoice.lines];
    const currentLine = { ...updatedLines[index] };
    
    if (key === "quantity") {
      currentLine.quantity = Math.max(1, value);
    } else if (key === "unit_price") {
      currentLine.unit_price = Math.max(0, value);
    } else if (key === "discount_percentage") {
      currentLine.discount_percentage = Math.min(100, Math.max(0, value));
    }
    
    // Recalculate line totals
    currentLine.gross_amount = currentLine.quantity * currentLine.unit_price;
    currentLine.discount_amount = currentLine.gross_amount * (currentLine.discount_percentage / 100);
    const taxableAmount = currentLine.gross_amount - currentLine.discount_amount;
    currentLine.vat_amount = taxableAmount * (currentLine.vat_percentage / 100);
    currentLine.net_amount = taxableAmount + currentLine.vat_amount;
    
    updatedLines[index] = currentLine;
    setNewInvoice((prev) => ({ ...prev, lines: updatedLines }));
  };

  const handleSaveDraftInvoice = () => {
    if (
      !newInvoice.invoice_number ||
      !newInvoice.client_id ||
      newInvoice.lines.length === 0
    ) {
      showNotification(
        "تکمیل شماره فاکتور، طرف حساب و افزودن حداقل یک کالا الزامی است.",
        "error",
      );
      return;
    }

    try {
      if (editingInvoiceId) {
        const updated = engine.updateDraftInvoice(editingInvoiceId, newInvoice);
        showNotification(
          `فاکتور (پیش‌نویس) با شماره ${updated.invoice_number} با موفقیت ویرایش گردید.`,
          "success",
        );
      } else {
        const created = engine.createDraftInvoice(newInvoice);
        showNotification(
          `فاکتور (پیش‌نویس) با شماره ${created.invoice_number} با موفقیت ثبت گردید.`,
          "success",
        );
      }

      setIsCreatingInvoice(false);
      setEditingInvoiceId(null);
      setNewInvoice({
        invoice_number: "",
        invoice_type: InvoiceType.SALE,
        client_id: "",
        invoice_date: new Date().toLocaleDateString("fa-IR"),
        description: "",
        total_discount_header: 0,
        lines: [],
        manual_rounding: 0,
      });

      loadData();
    } catch (err: any) {
      showNotification(err.message || "خطا در ثبت سند پیش‌نویس", "error");
    }
  };

  const handleEditInvoice = (inv: Invoice) => {
    if (inv.status !== InvoiceStatus.DRAFT) {
      showNotification("فقط فاکتورهای پیش‌نویس قابل ویرایش هستند.", "error");
      return;
    }
    setNewInvoice({
      invoice_number: inv.invoice_number,
      invoice_type: inv.invoice_type,
      client_id: inv.client_id,
      invoice_date: inv.invoice_date,
      description: inv.description || "",
      total_discount_header: inv.total_discount_header,
      lines: inv.lines,
      manual_rounding: inv.manual_rounding || 0,
    });
    setEditingInvoiceId(inv.id);
    setIsCreatingInvoice(true);
  };

  const handleFinalizeInvoice = (invoiceId: string) => {
    const result = engine.finalizeAndPostInvoice(invoiceId);
    if (result.success) {
      showNotification(
        `فاکتور نهایی شد! کد سامانه مودیان: ${result.invoice?.tax_id || "ندارد"}`,
        "success",
      );
      loadData();
    } else {
      showNotification(result.error || "خطا در تایید فاکتور", "error");
    }
  };

  const handleSendInvoiceToTaxOrg = (invoiceId: string) => {
    const result = engine.sendInvoiceToTaxOrg(invoiceId);
    if (result.success) {
      showNotification(
        `فاکتور با موفقیت به سامانه مودیان سازمان امور مالیاتی ارسال شد. شناسه یکتای مالیاتی ثبت گردید.`,
        "success"
      );
      loadData();
    } else {
      showNotification(result.error || "خطا در ارسال فاکتور به مودیان", "error");
    }
  };

  const handleDeleteInvoice = (id: string) => {
    const result = engine.cancelInvoice(id);
    if (result.success) {
      showNotification("سند بازرگانی با موفقیت ابطال گردید.", "info");
      loadData();
    } else {
      showNotification(result.error || "خطا در ابطال سند", "error");
    }
  };

  const handleConvertProformaToSale = (proforma: Invoice) => {
    try {
      const nextNum = invoices.filter(i => i.invoice_type === InvoiceType.SALE).length + 101;
      const saleInvoiceData: Partial<Invoice> = {
        invoice_number: `SAL-1405-${nextNum}`,
        invoice_type: InvoiceType.SALE,
        client_id: proforma.client_id,
        invoice_date: new Date().toLocaleDateString("fa-IR"),
        description: `تبدیل شده از پیش‌فاکتور شماره ${proforma.invoice_number}`,
        total_discount_header: proforma.total_discount_header,
        lines: proforma.lines.map(l => ({
          ...l,
          id: "L-" + Math.random().toString(36).substring(2, 9),
        })),
      };

      const created = engine.createDraftInvoice(saleInvoiceData);
      showNotification(`پیش‌فاکتور ${proforma.invoice_number} با موفقیت به فاکتور فروش پیش‌نویس شماره ${created.invoice_number} تبدیل گردید.`, "success");
      setViewingInvoice(null);
      loadData();
      
      // Open the new draft for editing/review
      handleEditInvoice(created);
    } catch (err: any) {
      showNotification(err.message || "خطا در تبدیل پیش‌فاکتور", "error");
    }
  };

  const handleSavePartner = () => {
    if (!newPartner.name) {
      showNotification("لطفاً نام شخص یا شرکت را وارد کنید.", "error");
      return;
    }

    // Validate National ID using CounterpartyService if provided
    if (newPartner.national_id) {
      try {
        const isValid = CounterpartyService.validateIranianNationalId(newPartner.national_id);
        if (!isValid) {
          showNotification("کد ملی یا شناسه ملی وارد شده بر اساس الگوریتم اعتبارسنجی کشور نامعتبر است.", "error");
          return;
        }
      } catch (err: any) {
        showNotification(err.message || "شناسه یا کد ملی نامعتبر است.", "error");
        return;
      }
    }

    try {
      const p = engine.addPartner({
        name: newPartner.name,
        type: newPartner.type || "customer",
        credit_limit: newPartner.credit_limit || 0,
        price_list_type: newPartner.price_list_type || "consumer",
        line_discount_percent: newPartner.line_discount_percent || 0,
        volume_discount_percent: newPartner.volume_discount_percent || 0,
        person_type: newPartner.person_type || "REAL",
        national_id: newPartner.national_id || "",
        economic_code: newPartner.economic_code || "",
        phone_number: newPartner.phone_number || "",
        mobile_number: newPartner.mobile_number || "",
        province: newPartner.province || "",
        city: newPartner.city || "",
        address: newPartner.address || "",
      });

      setIsCreatingPartner(false);
      setNewPartner({
        name: "",
        type: "customer",
        credit_limit: 500000000,
        price_list_type: "consumer",
        line_discount_percent: 0,
        volume_discount_percent: 0,
        person_type: "REAL",
        national_id: "",
        economic_code: "",
        phone_number: "",
        mobile_number: "",
        province: "",
        city: "",
        address: "",
      });
      loadData();
      showNotification(`طرف حساب تجاری "${p.name}" با موفقیت ثبت گردید.`, "success");
    } catch (err: any) {
      showNotification(err.message || "خطا در ثبت طرف حساب", "error");
    }
  };

  const handleDeletePartner = (id: string) => {
    const result = engine.deletePartner(id);
    if (result.success) {
      showNotification("طرف حساب تجاری با موفقیت حذف گردید.", "info");
      loadData();
    } else {
      showNotification(result.error || "خطا در حذف طرف حساب", "error");
    }
  };

  const handleUpdatePartner = () => {
    if (!editingPartnerData.name) {
      showNotification("لطفاً نام شخص یا شرکت را وارد کنید.", "error");
      return;
    }
    if (editingPartnerData.national_id) {
      try {
        const isValid = CounterpartyService.validateIranianNationalId(editingPartnerData.national_id);
        if (!isValid) {
          showNotification("کد ملی یا شناسه ملی وارد شده بر اساس الگوریتم اعتبارسنجی کشور نامعتبر است.", "error");
          return;
        }
      } catch (err: any) {
        showNotification(err.message || "شناسه یا کد ملی نامعتبر است.", "error");
        return;
      }
    }
    try {
      const p = engine.updatePartner(editingPartnerData as Partner);
      setIsEditingPartner(false);
      setViewingPartner(p);
      loadData();
      showNotification(`اطلاعات طرف حساب "${p.name}" با موفقیت بروزرسانی گردید.`, "success");
    } catch (err: any) {
      showNotification(err.message || "خطا در ویرایش طرف حساب", "error");
    }
  };

  const handleExportPartnersCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // BOM for UTF-8 in Excel
    csvContent += "نام طرف حساب,نقش تجاری,کد ملی/شناسه ملی,تلفن همراه,تلفن ثابت,استان,شهر,سقف اعتبار (ریال),تخفیف سطری,تخفیف حجمی,آدرس\n";
    partners.forEach(p => {
      const typeLabel = p.type === "customer" ? "مشتری" : "تامین‌کننده";
      csvContent += `"${p.name}","${typeLabel}","${p.national_id || ''}","${p.mobile_number || ''}","${p.phone_number || ''}","${p.province || ''}","${p.city || ''}",${p.credit_limit},${p.line_discount_percent},${p.volume_discount_percent},"${p.address || ''}"\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `partners_export_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification("فهرست طرف‌های حساب تجاری با موفقیت صادر گردید.", "success");
  };

  const handleExportPlCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // BOM for UTF-8 in Excel
    csvContent += "نام کالا,تعداد فروش,درآمد ناخالص (ریال),بهای تمام شده (ریال),سود ناخالص (ریال),حاشیه سود\n";
    
    profitLossReport.itemsProfitList.forEach(item => {
      csvContent += `"${item.name}",${item.qtySold},${item.revenue},${item.revenue - item.profit},${item.profit},"${item.margin.toFixed(1)}%"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `product_profit_loss_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification("گزارش سود و زیان کالا با موفقیت صادر گردید.", "success");
  };

  // Profit/Loss calculation using real data with support for filtering and sorting
  const profitLossReport = useMemo(() => {
    let totalRevenue = 0;
    let totalCogs = 0;

    // Track product sales
    const productStats: Record<
      string,
      { id: string; name: string; qtySold: number; revenue: number }
    > = {};

    // Initialize all products in stats
    products.forEach((p) => {
      productStats[p.id] = {
        id: p.id,
        name: p.name,
        qtySold: 0,
        revenue: 0,
      };
    });

    const invoiceProfits: Array<{
      invoiceNo: string;
      partnerName: string;
      revenue: number;
      profit: number;
      margin: number;
    }> = [];

    invoices
      .filter((i) => {
        // Must be finalized sale
        if (i.status !== InvoiceStatus.FINALIZED || i.invoice_type !== InvoiceType.SALE) {
          return false;
        }
        // Filter by partner
        if (plPartnerFilter !== "ALL" && i.client_id !== plPartnerFilter) {
          return false;
        }
        // Filter by date range (comparing string e.g., '1405/01/01')
        if (plFromDate && i.invoice_date < plFromDate) {
          return false;
        }
        if (plToDate && i.invoice_date > plToDate) {
          return false;
        }
        return true;
      })
      .forEach((inv) => {
        totalRevenue += inv.total_net_amount;

        let invoiceCogs = 0;
        inv.lines.forEach((line) => {
          const p = products.find((x) => x.id === line.product_id);
          if (p) {
            const cogs = p.purchase_price * line.quantity;
            totalCogs += cogs;
            invoiceCogs += cogs;

            // Aggregate product stats
            if (!productStats[line.product_id]) {
              productStats[line.product_id] = {
                id: line.product_id,
                name: p.name,
                qtySold: 0,
                revenue: 0,
              };
            }
            productStats[line.product_id].qtySold += line.quantity;
            productStats[line.product_id].revenue += line.net_total;
          }
        });

        const partner = partners.find((p) => p.id === inv.client_id);
        const partnerName = partner ? partner.name : "مشتری متفرقه";

        const invRevenue = inv.total_net_amount;
        const invProfit = invRevenue - invoiceCogs;
        const invMargin = invRevenue > 0 ? (invProfit / invRevenue) * 100 : 0;

        invoiceProfits.push({
          invoiceNo: inv.invoice_number,
          partnerName,
          revenue: invRevenue,
          profit: invProfit,
          margin: invMargin,
        });
      });

    let filteredExpenses = manualExpenses;
    if (plFromDate) {
      filteredExpenses = filteredExpenses.filter((e) => e.date >= plFromDate);
    }
    if (plToDate) {
      filteredExpenses = filteredExpenses.filter((e) => e.date <= plToDate);
    }

    const totalManualExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

    const netProfit = totalRevenue - totalCogs - totalManualExpenses;
    const avgMarginPercent =
      totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // Convert product stats to list, apply search filter, then map and sort
    const rawItemsList = Object.values(productStats)
      .filter((item) => {
        if (item.qtySold <= 0) return false;
        if (plProductSearch && !item.name.toLowerCase().includes(plProductSearch.toLowerCase())) {
          return false;
        }
        return true;
      })
      .map((item) => {
        const p = products.find((x) => x.id === item.id);
        const purchasePrice = p ? p.purchase_price : 0;
        const cogs = purchasePrice * item.qtySold;
        const profit = item.revenue - cogs;
        const margin = item.revenue > 0 ? (profit / item.revenue) * 100 : 0;
        return {
          ...item,
          cogs,
          profit,
          margin,
        };
      });

    // Dynamic sorting
    const sortedItemsList = [...rawItemsList].sort((a, b) => {
      let comparison = 0;
      if (plProductSort === "profit") {
        comparison = b.profit - a.profit;
      } else if (plProductSort === "revenue") {
        comparison = b.revenue - a.revenue;
      } else if (plProductSort === "margin") {
        comparison = b.margin - a.margin;
      } else if (plProductSort === "qtySold") {
        comparison = b.qtySold - a.qtySold;
      }
      return plProductSortDirection === "desc" ? comparison : -comparison;
    });

    // Compute gold metrics (independent of table search filter so it remains accurate for the active invoice subset)
    const fullItemsList = Object.values(productStats)
      .filter((item) => item.qtySold > 0)
      .map((item) => {
        const p = products.find((x) => x.id === item.id);
        const purchasePrice = p ? p.purchase_price : 0;
        const cogs = purchasePrice * item.qtySold;
        const profit = item.revenue - cogs;
        const margin = item.revenue > 0 ? (profit / item.revenue) * 100 : 0;
        return {
          ...item,
          profit,
          margin,
        };
      });

    const topProductByProfit = fullItemsList.length > 0
      ? [...fullItemsList].sort((a, b) => b.profit - a.profit)[0]
      : null;

    const topProductByMargin = fullItemsList.length > 0
      ? [...fullItemsList].sort((a, b) => b.margin - a.margin)[0]
      : null;

    const topProductByVolume = fullItemsList.length > 0
      ? [...fullItemsList].sort((a, b) => b.qtySold - a.qtySold)[0]
      : null;

    return {
      totalRevenue,
      totalCogs,
      totalManualExpenses,
      filteredExpenses,
      netProfit,
      avgMarginPercent,
      itemsProfitList: sortedItemsList,
      invoiceProfits,
      topProductByProfit,
      topProductByMargin,
      topProductByVolume,
    };
  }, [invoices, products, partners, manualExpenses, plPartnerFilter, plFromDate, plToDate, plProductSearch, plProductSort, plProductSortDirection]);

  return (
    <div
      className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col max-w-6xl mx-auto w-full"
      dir="rtl"
    >
      {showAddExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className={`w-full max-w-sm p-6 rounded-2xl border text-right shadow-2xl ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-850'}`}>
            <div className="flex items-center justify-between border-b pb-3 mb-4 border-slate-200 dark:border-slate-800">
              <h4 className="font-black text-sm text-amber-500">➕ ثبت هزینه دستی</h4>
              <button
                onClick={() => setShowAddExpense(false)}
                className="p-1 text-slate-400 hover:text-slate-200 transition text-xs font-bold"
              >
                بستن
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">تاریخ</label>
                <input
                  type="text"
                  value={newExpenseData.date}
                  onChange={(e) => setNewExpenseData(prev => ({ ...prev, date: e.target.value }))}
                  placeholder="مثلاً: 1405/02/01"
                  className={`w-full px-3 py-1.5 rounded-lg text-xs border font-mono text-left focus:outline-none focus:ring-1 focus:ring-amber-500 ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'}`}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">مبلغ (ریال)</label>
                <input
                  type="number"
                  value={newExpenseData.amount}
                  onChange={(e) => setNewExpenseData(prev => ({ ...prev, amount: Number(e.target.value) }))}
                  className={`w-full px-3 py-1.5 rounded-lg text-xs font-mono border focus:outline-none focus:ring-1 focus:ring-amber-500 ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'}`}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">شرح هزینه</label>
                <textarea
                  value={newExpenseData.description}
                  onChange={(e) => setNewExpenseData(prev => ({ ...prev, description: e.target.value }))}
                  className={`w-full px-3 py-1.5 rounded-lg text-xs border focus:outline-none focus:ring-1 focus:ring-amber-500 ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'}`}
                  rows={3}
                ></textarea>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddExpense(false)}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-850 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-300 text-xs font-bold rounded-lg transition"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!newExpenseData.description || !newExpenseData.amount) {
                      showNotification("شرح و مبلغ الزامی است.", "error");
                      return;
                    }
                    try {
                      engine.addManualExpense(newExpenseData);
                      setManualExpenses([...engine.getManualExpenses()]);
                      showNotification("هزینه با موفقیت ثبت شد.", "success");
                      setShowAddExpense(false);
                      setNewExpenseData({ date: new Date().toLocaleDateString("fa-IR"), amount: 0, description: "" });
                    } catch (e: any) {
                      showNotification(e.message || "خطا در ثبت هزینه", "error");
                    }
                  }}
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow transition active:scale-95"
                >
                  ثبت هزینه
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Module Title */}
      <div className="mb-6 text-right flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in">
        <div>
          <div className="flex items-center gap-2">
            <h2
              className={`text-base font-black tracking-tight ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}
            >
              ماژول خرید و فروش (بازرگانی)
            </h2>
            <button
              onClick={() => setShowFriendlyGuide(!showFriendlyGuide)}
              className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 flex items-center gap-1 hover:bg-blue-500/20 transition-all"
            >
              <Info className="w-3.5 h-3.5" />
              {showFriendlyGuide
                ? "پنهان‌سازی راهنمای بازرگانی"
                : "چرخه بازرگانی به زبان خودمانی"}
            </button>
          </div>
          <p
            className={`text-xs mt-1.5 ${isDarkMode ? "text-slate-400" : "text-slate-600"} max-w-2xl leading-relaxed`}
          >
            کنترل دقیق بر درآمد، مخارج کالا و خدمات، تعیین سطوح تخفیف و ردیابی
            لحظه‌ای سود و زیان هر قلم کالا.
          </p>
        </div>

        {/* Tab Switchers */}
        <div
          className={`p-1 rounded-xl flex gap-1 border ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
        >
          {[
            { id: "invoices", label: "صدور و مدیریت فاکتورها", icon: Receipt },
            { id: "partners", label: "مشتریان و تامین‌کنندگان", icon: Users },
            {
              id: "profit_loss",
              label: "گزارش سود و زیان کالا",
              icon: TrendingUp,
            },
          ].map((t) => {
            const Icon = t.icon;
            const isSel = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => {
                  setActiveTab(t.id as any);
                  setIsCreatingInvoice(false);
                  setIsCreatingPartner(false);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  isSel
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/10"
                    : "text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Friendly Guide */}
      {showFriendlyGuide && (
        <div
          className={`p-5 rounded-2xl border mb-6 transition-all ${
            isDarkMode
              ? "bg-blue-950/15 border-blue-900/40 text-slate-250"
              : "bg-blue-50/40 border-blue-100 text-slate-800"
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 shrink-0 mt-0.5">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-sm text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-1.5">
                چرخه بازرگانی (درآمد و هزینه) به چه دردی می‌خورد؟
              </h3>
              <p className="text-xs leading-relaxed opacity-90 mb-4">
                کسب‌وکار شما بدون{" "}
                <strong>خرید کالا و فروش مجدد آن با حاشیه سود مطمئن</strong>{" "}
                سرپا نمی‌ماند. در این ماژول، فاکتورها را در هر حالتی (پیش‌فاکتور
                قبل فروش، فاکتور نهایی، برگشت از خرید و فروش کالا) ثبت می‌کنید.
                در وهله دوم، با مدیریت اعتبار مشتریان مانع پس دادن چک یا
                بی‌اعتباری معاملات می‌شوید و در نهایت، به شکل زنده حاشیه سود
                کالا را رصد می‌کنید.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                <div
                  className={`p-3.5 rounded-xl border ${isDarkMode ? "bg-slate-950/40 border-slate-850" : "bg-white border-slate-100"}`}
                >
                  <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 mb-2">
                    ۱. تنوع فاکتورها
                  </span>
                  <p className="text-[11px] leading-relaxed opacity-85">
                    از فاکتور فروش برای دریافت پول تا برگشت از خرید به خاطر
                    کالای معیوب، تمام چرخه‌ها به طور هماهنگ به انباردار و
                    حسابداری مالی سیگنال می‌دهند.
                  </p>
                </div>

                <div
                  className={`p-3.5 rounded-xl border ${isDarkMode ? "bg-slate-950/40 border-slate-850" : "bg-white border-slate-100"}`}
                >
                  <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-500 mb-2">
                    ۲. لیست قیمت متغیر و اعتبار
                  </span>
                  <p className="text-[11px] leading-relaxed opacity-85">
                    به هر شرکت، سقف اعتبار معینی بدهید و تعیین کنید فاکتور فروش
                    برای مشتری بر اساس قیمت عمده، همکار یا مصرف‌کننده معمولی
                    محاسبه شود.
                  </p>
                </div>

                <div
                  className={`p-3.5 rounded-xl border ${isDarkMode ? "bg-slate-950/40 border-slate-850" : "bg-white border-slate-100"}`}
                >
                  <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 mb-2">
                    ۳. محاسبه دقیق حاشیه سود
                  </span>
                  <p className="text-[11px] leading-relaxed opacity-85">
                    سیستم، بهای خرید اولیه (بهای تمام شده) را از بهای نهایی فروش
                    منهای تخفیف‌ها کسر کرده و سود ناخالص و درصد سود هر کالا را
                    فوراً به شما نشان می‌دهد.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- Tab 1: Invoices Section --- */}
      {activeTab === "invoices" && (
        <div className="space-y-6">
          {!isCreatingInvoice ? (
            <div
              className={`border rounded-2xl p-4 md:p-6 ${isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200/80 shadow-sm"}`}
            >
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="text-right">
                  <h3
                    className={`text-sm font-black ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}
                  >
                    لیست اسناد و فاکتورهای بازرگانی صادره
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1">
                    سیاهه پیش‌فاکتورها، خریدها، فروش‌ها و فاکتورهای برگشتی ثبت
                    شده در سیستم
                  </p>
                </div>

                <button
                  onClick={() => setIsCreatingInvoice(true)}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 shrink-0"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>صدور فاکتور جدید (فروش / خرید / مرجوعی)</span>
                </button>
              </div>

              {/* Search & Filter Bar */}
              <div className={`p-4 rounded-xl mb-6 grid grid-cols-1 md:grid-cols-4 gap-4 ${isDarkMode ? 'bg-slate-950/40 border border-slate-850' : 'bg-slate-50 border border-slate-200 shadow-xs'}`}>
                <div className="md:col-span-2 relative">
                  <Search className="absolute right-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="جستجو با شماره سند، شرح فاکتور یا نام طرف حساب..."
                    className={`w-full pr-9 pl-3 py-1.5 rounded-lg text-xs border focus:ring-1 focus:ring-blue-500 focus:outline-none ${
                      isDarkMode
                        ? "bg-slate-900 border-slate-800 text-white placeholder-slate-500"
                        : "bg-white border-slate-200 text-slate-850 placeholder-slate-400"
                    }`}
                  />
                </div>

                <div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className={`w-full px-3 py-1.5 rounded-lg text-xs border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                      isDarkMode
                        ? "bg-slate-900 border-slate-800 text-white"
                        : "bg-white border-slate-200 text-slate-800"
                    }`}
                  >
                    <option value="ALL">همه وضعیت‌ها</option>
                    <option value="DRAFT">پیش‌نویس</option>
                    <option value="FINALIZED">نهایی شده</option>
                    <option value="CANCELLED">ابطال شده</option>
                  </select>
                </div>

                <div>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className={`w-full px-3 py-1.5 rounded-lg text-xs border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                      isDarkMode
                        ? "bg-slate-900 border-slate-800 text-white"
                        : "bg-white border-slate-200 text-slate-800"
                    }`}
                  >
                    <option value="ALL">همه نوع سندها</option>
                    <option value="SALE">فاکتور فروش</option>
                    <option value="PURCHASE">فاکتور خرید</option>
                    <option value="PROFORMA">پیش‌فاکتور</option>
                    <option value="SALE_RETURN">مرجوعی فروش</option>
                    <option value="PURCHASE_RETURN">مرجوعی خرید</option>
                  </select>
                </div>
              </div>

              {/* Invoices Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse text-xs">
                  <thead>
                    <tr
                      className={`border-b ${isDarkMode ? "border-slate-800 text-slate-400" : "border-slate-100 text-slate-500"} font-black`}
                    >
                      <th className="py-3 px-2 text-right">شماره سند</th>
                      <th className="py-3 px-2 text-right">نوع سند</th>
                      <th className="py-3 px-2 text-right">وضعیت</th>
                      <th className="py-3 px-2 text-right">طرف حساب</th>
                      <th className="py-3 px-2 text-right">تاریخ</th>
                      <th className="py-3 px-2 text-left">
                        مجموع فاکتور (با مالیات)
                      </th>
                      <th className="py-3 px-2 text-center">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                    {(() => {
                      const list = invoices.filter((inv) => {
                        const partner = partners.find((p) => p.id === inv.client_id);
                        const partnerName = partner ? partner.name : "";
                        const query = searchQuery.toLowerCase();

                        const matchesSearch =
                          inv.invoice_number.toLowerCase().includes(query) ||
                          (inv.description || "").toLowerCase().includes(query) ||
                          partnerName.toLowerCase().includes(query);

                        const matchesStatus =
                          filterStatus === "ALL" || inv.status === filterStatus;

                        const matchesType =
                          filterType === "ALL" || inv.invoice_type === filterType;

                        return matchesSearch && matchesStatus && matchesType;
                      });

                      if (list.length === 0) {
                        return (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-slate-500 italic">
                              هیچ فاکتوری با فیلترهای انتخاب شده یافت نشد.
                            </td>
                          </tr>
                        );
                      }

                      return list.map((inv) => {
                        const partner = partners.find(
                          (p) => p.id === inv.client_id,
                        );
                        const partnerName = partner ? partner.name : "ناشناس";

                        const badgeTypes: {
                          [key: string]: { label: string; style: string };
                        } = {
                          [InvoiceType.PROFORMA]: {
                            label: "پیش‌فاکتور",
                            style:
                              "bg-amber-500/10 text-amber-500 border-amber-500/20",
                          },
                          [InvoiceType.SALE]: {
                            label: "فاکتور فروش",
                            style:
                              "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
                          },
                          [InvoiceType.PURCHASE]: {
                            label: "فاکتور خرید",
                            style:
                              "bg-blue-500/10 text-blue-500 border-blue-500/20",
                          },
                          [InvoiceType.SALE_RETURN]: {
                            label: "برگشت از فروش",
                            style:
                              "bg-rose-500/10 text-rose-500 border-rose-500/20",
                          },
                          [InvoiceType.PURCHASE_RETURN]: {
                            label: "برگشت از خرید",
                            style:
                              "bg-purple-500/10 text-purple-500 border-purple-500/20",
                          },
                        };

                        const statusBadges: {
                          [key: string]: { label: string; style: string };
                        } = {
                          [InvoiceStatus.DRAFT]: {
                            label: "پیش‌نویس",
                            style:
                              "bg-slate-500/10 text-slate-500 border-slate-500/20",
                          },
                          [InvoiceStatus.FINALIZED]: {
                            label: "نهایی شده",
                            style:
                              "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
                          },
                          [InvoiceStatus.SENT_TO_TAX_ORG]: {
                            label: "ارسال شده به مودیان",
                            style:
                              "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
                          },
                          [InvoiceStatus.CANCELLED]: {
                            label: "ابطال شده",
                            style:
                              "bg-rose-500/10 text-rose-500 border-rose-500/20",
                          },
                        };

                        const currentBadge = badgeTypes[inv.invoice_type] || {
                          label: inv.invoice_type,
                          style: "bg-slate-500/10 text-slate-400",
                        };
                        const statusBadge = statusBadges[inv.status] || {
                          label: inv.status,
                          style: "bg-slate-500/10 text-slate-400",
                        };

                        return (
                          <tr
                            key={inv.id}
                            className={`hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors`}
                          >
                            <td className="py-4 px-2 font-mono font-bold text-slate-250">
                              <div>{inv.invoice_number}</div>
                              {inv.tax_id && (
                                <div
                                  className="text-[9px] text-blue-500 font-mono mt-1"
                                  title="کد سامانه مودیان"
                                >
                                  TID: {inv.tax_id}
                                </div>
                              )}
                            </td>
                            <td className="py-4 px-2">
                              <span
                                className={`px-2 py-0.5 rounded border text-[10px] font-bold ${currentBadge.style}`}
                              >
                                {currentBadge.label}
                              </span>
                            </td>
                            <td className="py-4 px-2">
                              <span
                                className={`px-2 py-0.5 rounded border text-[10px] font-bold ${statusBadge.style}`}
                              >
                                {statusBadge.label}
                              </span>
                            </td>
                            <td className="py-4 px-2 font-semibold">
                              {partnerName}
                            </td>
                            <td className="py-4 px-2 font-mono text-slate-400">
                              {inv.invoice_date}
                            </td>
                            <td className="py-4 px-2 font-mono font-bold text-left text-blue-500 dark:text-blue-400">
                              {formatRial(inv.total_net_amount)}
                            </td>
                            <td className="py-4 px-2 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => setViewingInvoice(inv)}
                                  className="p-1.5 hover:bg-blue-500/10 rounded-lg text-slate-400 hover:text-blue-400 transition"
                                  title="پیش‌نمایش و چاپ فاکتور رسمی"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                {inv.status === InvoiceStatus.DRAFT && (
                                  <button
                                    onClick={() => handleEditInvoice(inv)}
                                    className="p-1.5 hover:bg-amber-500/10 rounded-lg text-slate-400 hover:text-amber-500 transition"
                                    title="ویرایش فاکتور"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                )}
                                {inv.status === InvoiceStatus.DRAFT && (
                                  <button
                                    onClick={() => handleFinalizeInvoice(inv.id)}
                                    className="p-1.5 hover:bg-indigo-500/10 rounded-lg text-slate-400 hover:text-indigo-500 transition"
                                    title="تایید و ثبت نهایی سند"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                )}
                                {inv.status === InvoiceStatus.FINALIZED && inv.invoice_type === InvoiceType.SALE && (
                                  <button
                                    onClick={() => handleSendInvoiceToTaxOrg(inv.id)}
                                    className="p-1.5 hover:bg-emerald-500/10 rounded-lg text-slate-400 hover:text-emerald-500 transition"
                                    title="ارسال فاکتور فروش به سامانه مودیان مالیاتی"
                                  >
                                    <Send className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteInvoice(inv.id)}
                                  className="p-1.5 hover:bg-rose-500/10 rounded-lg text-slate-400 hover:text-rose-500 transition"
                                  title="ابطال فاکتور"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* --- Custom Invoice Issuance / Builder Form --- */
            <div
              className={`border rounded-2xl p-5 md:p-7 relative ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200/80 shadow-sm"} animate-fade-in`}
            >
              {/* Quick Add Product Inline Modal */}
              {showQuickAddProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
                  <div className={`w-full max-w-md p-6 rounded-2xl border text-right shadow-2xl ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-850'}`}>
                    <div className="flex items-center justify-between border-b pb-3 mb-4 border-slate-200 dark:border-slate-800">
                      <h4 className="font-black text-xs text-blue-500">➕ تعریف سریع کالای تجاری جدید</h4>
                      <button
                        onClick={() => setShowQuickAddProduct(false)}
                        className="p-1 text-slate-400 hover:text-slate-200 transition text-xs font-bold"
                      >
                        بستن
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">نام کالا *</label>
                        <input
                          type="text"
                          value={quickProductData.name}
                          onChange={(e) => setQuickProductData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="مثلاً: هارد دیسک اکسترنال 2TB"
                          className={`w-full px-3 py-1.5 rounded-lg text-xs border focus:outline-none focus:ring-1 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'}`}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">قیمت خرید (ریال)</label>
                          <input
                            type="number"
                            value={quickProductData.purchase_price}
                            onChange={(e) => setQuickProductData(prev => ({ ...prev, purchase_price: Number(e.target.value) }))}
                            className={`w-full px-3 py-1.5 rounded-lg text-xs font-mono border focus:outline-none focus:ring-1 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'}`}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">قیمت مصرف‌کننده (ریال)</label>
                          <input
                            type="number"
                            value={quickProductData.base_price}
                            onChange={(e) => setQuickProductData(prev => ({ ...prev, base_price: Number(e.target.value) }))}
                            className={`w-full px-3 py-1.5 rounded-lg text-xs font-mono border focus:outline-none focus:ring-1 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'}`}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-450 mb-1">قیمت عمده (ریال)</label>
                          <input
                            type="number"
                            value={quickProductData.wholesale_price}
                            onChange={(e) => setQuickProductData(prev => ({ ...prev, wholesale_price: Number(e.target.value) }))}
                            className={`w-full px-3 py-1.5 rounded-lg text-xs font-mono border focus:outline-none focus:ring-1 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'}`}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-450 mb-1">قیمت همکار (ریال)</label>
                          <input
                            type="number"
                            value={quickProductData.partner_price}
                            onChange={(e) => setQuickProductData(prev => ({ ...prev, partner_price: Number(e.target.value) }))}
                            className={`w-full px-3 py-1.5 rounded-lg text-xs font-mono border focus:outline-none focus:ring-1 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'}`}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowQuickAddProduct(false)}
                          className="px-3 py-1.5 bg-slate-100 dark:bg-slate-850 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-300 text-xs font-bold rounded-lg transition"
                        >
                          انصراف
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!quickProductData.name) {
                              showNotification("نام کالا الزامی است.", "error");
                              return;
                            }
                            try {
                              const created = engine.addProduct(quickProductData);
                              showNotification(`کالای "${created.name}" با موفقیت تعریف شد.`, "success");
                              // Automatically set it as selected
                              setProducts([...engine.getProducts()]);
                              setNewItemProduct(created.id);
                              // Auto populate prices based on client type
                              handleProductSelect(created.id, newInvoice.client_id, newInvoice.invoice_type);
                              setShowQuickAddProduct(false);
                              setQuickProductData({
                                name: "",
                                purchase_price: 0,
                                base_price: 0,
                                wholesale_price: 0,
                                partner_price: 0
                              });
                            } catch (err: any) {
                              showNotification(err.message || "خطا در تعریف کالا", "error");
                            }
                          }}
                          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow transition active:scale-95"
                        >
                          ثبت و انتخاب کالا
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between border-b pb-4 mb-6 border-slate-200 dark:border-slate-800">
                <div className="text-right">
                  <h3 className="text-sm font-black flex items-center gap-1.5">
                    <Receipt className="w-5 h-5 text-blue-500" />
                    <span>صدور فاکتور جدید بازرگانی</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1">
                    تکمیل مشخصات عمومی فاکتور، انتخاب نوع سند و تعریف اقلام با
                    سیستم خودکار تراز قیمت
                  </p>
                </div>
                <button
                  onClick={() => setIsCreatingInvoice(false)}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-bold rounded-xl transition"
                >
                  انصراف و بازگشت
                </button>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <label className="block text-[10px] font-bold text-slate-450 mb-1.5">
                    شماره فاکتور / سند
                  </label>
                  <input
                    type="text"
                    value={newInvoice.invoice_number}
                    onChange={(e) =>
                      setNewInvoice((prev) => ({
                        ...prev,
                        invoice_number: e.target.value,
                      }))
                    }
                    className={`w-full px-3 py-2 rounded-xl text-xs border focus:ring-1 focus:ring-blue-500 focus:outline-none font-mono ${
                      isDarkMode
                        ? "bg-slate-950 border-slate-850 text-white"
                        : "bg-white border-slate-200 text-slate-800"
                    }`}
                    placeholder="مثلاً SAL-1405-103"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-450 mb-1.5">
                    نوع سند بازرگانی
                  </label>
                  <select
                    value={newInvoice.invoice_type}
                    onChange={(e) => {
                      const selectedType = e.target.value as InvoiceType;
                      setNewInvoice((prev) => ({
                        ...prev,
                        invoice_type: selectedType,
                        lines: [],
                      }));
                    }}
                    className={`w-full px-3 py-2 rounded-xl text-xs border focus:ring-1 focus:ring-blue-500 focus:outline-none ${
                      isDarkMode
                        ? "bg-slate-950 border-slate-850 text-white"
                        : "bg-white border-slate-200 text-slate-800"
                    }`}
                  >
                    <option value={InvoiceType.PROFORMA}>
                      پیش‌فاکتور فروش
                    </option>
                    <option value={InvoiceType.SALE}>فاکتور فروش کالا</option>
                    <option value={InvoiceType.PURCHASE}>
                      فاکتور خرید کالا
                    </option>
                    <option value={InvoiceType.SALE_RETURN}>
                      برگشت از فروش کالا
                    </option>
                    <option value={InvoiceType.PURCHASE_RETURN}>
                      برگشت از خرید کالا
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-450 mb-1.5">
                    طرف حساب معامله
                  </label>
                  <select
                    value={newInvoice.client_id}
                    onChange={(e) => {
                      const pId = e.target.value;
                      setNewInvoice((prev) => ({
                        ...prev,
                        client_id: pId,
                        lines: [],
                      }));
                    }}
                    className={`w-full px-3 py-2 rounded-xl text-xs border focus:ring-1 focus:ring-blue-500 focus:outline-none ${
                      isDarkMode
                        ? "bg-slate-950 border-slate-850 text-white"
                        : "bg-white border-slate-200 text-slate-800"
                    }`}
                  >
                    <option value="">انتخاب شخص یا شرکت...</option>
                    {partners.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (
                        {p.type === "customer" ? "مشتری" : "تامین‌کننده"})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-450 mb-1.5">
                    تاریخ ثبت سند
                  </label>
                  <input
                    type="text"
                    value={newInvoice.invoice_date}
                    onChange={(e) =>
                      setNewInvoice((prev) => ({
                        ...prev,
                        invoice_date: e.target.value,
                      }))
                    }
                    className={`w-full px-3 py-2 rounded-xl text-xs border focus:ring-1 focus:ring-blue-500 focus:outline-none font-mono ${
                      isDarkMode
                        ? "bg-slate-950 border-slate-850 text-white"
                        : "bg-white border-slate-200 text-slate-800"
                    }`}
                    placeholder="1405/04/08"
                  />
                </div>
              </div>

              {/* Real-time price connected guide & Credit Limit validation */}
              {(() => {
                if (!newInvoice.client_id) return null;
                const partner = partners.find((p) => p.id === newInvoice.client_id);
                if (!partner) return null;

                // Calculate credit details
                const activeDebt = invoices
                  .filter((i) => i.client_id === partner.id && i.status === InvoiceStatus.FINALIZED && i.invoice_type === InvoiceType.SALE)
                  .reduce((sum, i) => sum + i.total_net_amount, 0);

                const draftDebt = invoices
                  .filter((i) => i.client_id === partner.id && i.status === InvoiceStatus.DRAFT && i.invoice_type === InvoiceType.SALE)
                  .reduce((sum, i) => sum + i.total_net_amount, 0);

                // Simulated cheques in transit for credit control logic
                const chequesInTransit = partner.credit_limit > 0 ? Math.floor(partner.credit_limit * 0.1) : 0;
                
                const totalExposure = activeDebt + draftDebt + chequesInTransit;
                const creditRemaining = partner.credit_limit - totalExposure;
                const exposurePercent = partner.credit_limit > 0 ? Math.min(100, (totalExposure / partner.credit_limit) * 100) : 0;
                const isOverLimit = totalExposure > partner.credit_limit;

                return (
                  <div className="space-y-4 mb-6 animate-fade-in">
                    <div
                      className={`p-3 rounded-xl text-xs flex items-center gap-2 border border-dashed ${
                        isDarkMode
                          ? "bg-slate-950/40 border-slate-800 text-slate-300"
                          : "bg-slate-50 border-slate-200 text-slate-700"
                      }`}
                    >
                      <UserCheck className="w-4 h-4 text-blue-500 shrink-0" />
                      <span>
                        طرف حساب انتخاب شده متصل به{" "}
                        <strong>
                          {partner.price_list_type === "wholesale"
                            ? "لیست قیمت عمده‌فروشی"
                            : partner.price_list_type === "partner"
                              ? "لیست قیمت همکار"
                              : "لیست قیمت تک‌فروشی / مصرف‌کننده"}
                        </strong>{" "}
                        با تخفیف مصوب{" "}
                        <strong>
                          {partner.line_discount_percent}%
                        </strong>{" "}
                        است.
                      </span>
                    </div>

                    {partner.type === "customer" && (
                      <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-slate-950/40 border-slate-850' : 'bg-white border-slate-150 shadow-xs'}`}>
                        <div className="flex items-center gap-1.5 mb-3">
                          <CreditCard className="w-4 h-4 text-amber-500" />
                          <h5 className={`text-xs font-black ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>وضعیت سقف اعتبار و ریسک مالی مشتری (ریال)</h5>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[10px] font-mono text-slate-400">
                          <div>
                            <span className="block text-[8px] text-slate-500 mb-1">سقف اعتبار مصوب</span>
                            <span className="font-sans font-bold text-slate-200 text-xs">
                              {formatRial(partner.credit_limit)}
                            </span>
                          </div>
                          <div>
                            <span className="block text-[8px] text-slate-500 mb-1">بدهی قطعی (فاکتورهای نهایی)</span>
                            <span className="font-sans font-semibold text-slate-300">
                              {formatRial(activeDebt)}
                            </span>
                          </div>
                          <div>
                            <span className="block text-[8px] text-slate-500 mb-1">پیش‌نویس‌ها و تعهدات غیرقطعی</span>
                            <span className="font-sans font-semibold text-slate-300">
                              {formatRial(draftDebt + chequesInTransit)}
                            </span>
                          </div>
                          <div>
                            <span className="block text-[8px] text-slate-500 mb-1">مانده اعتبار آزاد</span>
                            <span className={`font-sans font-black text-xs ${isOverLimit ? 'text-rose-500' : 'text-emerald-400'}`}>
                              {formatRial(creditRemaining)}
                            </span>
                          </div>
                        </div>

                        {/* Exposure Bar */}
                        <div className="space-y-1 mt-3">
                          <div className="w-full bg-slate-900 dark:bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-850">
                            <div
                              className={`h-full transition-all duration-300 ${
                                isOverLimit
                                  ? "bg-rose-500 animate-pulse"
                                  : exposurePercent > 80
                                    ? "bg-amber-400"
                                    : "bg-emerald-500"
                              }`}
                              style={{ width: `${exposurePercent}%` }}
                            />
                          </div>
                          <div className="flex justify-between items-center text-[8px]">
                            <span>ریسک تعهدات: {exposurePercent.toFixed(1)}٪</span>
                            {isOverLimit ? (
                              <span className="text-rose-400 font-bold flex items-center gap-0.5">
                                <ShieldAlert className="w-2.5 h-2.5 animate-bounce" />
                                عبور بحرانی از سقف اعتبار! صدور فاکتور جدید محدود خواهد شد.
                              </span>
                            ) : exposurePercent > 80 ? (
                              <span className="text-amber-400 font-semibold">بدهی در محدوده هشدار (بالای ۸۰٪ سقف اعتبار)</span>
                            ) : (
                              <span className="text-emerald-400">طرف حساب معتبر و ریسک ایمن</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* ADD INVOICE ITEM FORM BLOCK */}
              <div
                className={`p-4 rounded-xl border mb-6 ${
                  isDarkMode
                    ? "bg-slate-950/20 border-slate-800"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <h4 className="text-[11px] font-black mb-3 text-slate-400">
                  افزودن کالا به فاکتور
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-[10px] font-bold text-slate-450">
                        انتخاب کالا
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowQuickAddProduct(true)}
                        className="text-[9px] text-blue-500 hover:text-blue-450 hover:underline flex items-center gap-0.5"
                      >
                        <Plus className="w-2.5 h-2.5" /> تعریف جدید
                      </button>
                    </div>
                    <select
                      value={newItemProduct}
                      onChange={(e) =>
                        handleProductSelect(
                          e.target.value,
                          newInvoice.client_id || "",
                          newInvoice.invoice_type || "",
                        )
                      }
                      className={`w-full px-3 py-1.5 rounded-lg text-xs border focus:outline-none ${
                        isDarkMode
                          ? "bg-slate-950 border-slate-800 text-white"
                          : "bg-white border-slate-200 text-slate-800"
                      }`}
                    >
                      <option value="">انتخاب...</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 mb-1">
                      تعداد / مقدار
                    </label>
                    <input
                      type="number"
                      value={newItemQty}
                      onChange={(e) => setNewItemQty(Number(e.target.value))}
                      className={`w-full px-3 py-1.5 rounded-lg text-xs border focus:outline-none font-mono ${
                        isDarkMode
                          ? "bg-slate-950 border-slate-800 text-white"
                          : "bg-white border-slate-200 text-slate-800"
                      }`}
                      min={1}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 mb-1">
                      قیمت واحد (ریال)
                    </label>
                    <input
                      type="number"
                      value={newItemPrice}
                      onChange={(e) => setNewItemPrice(Number(e.target.value))}
                      className={`w-full px-3 py-1.5 rounded-lg text-xs border focus:outline-none font-mono ${
                        isDarkMode
                          ? "bg-slate-950 border-slate-800 text-white"
                          : "bg-white border-slate-200 text-slate-800"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 mb-1">
                      تخفیف سطری (٪)
                    </label>
                    <input
                      type="number"
                      value={newItemDiscount}
                      onChange={(e) =>
                        setNewItemDiscount(Number(e.target.value))
                      }
                      className={`w-full px-3 py-1.5 rounded-lg text-xs border focus:outline-none font-mono ${
                        isDarkMode
                          ? "bg-slate-950 border-slate-800 text-white"
                          : "bg-white border-slate-200 text-slate-800"
                      }`}
                      min={0}
                      max={100}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 mb-1">
                      ارزش افزوده (٪)
                    </label>
                    <input
                      type="number"
                      value={newItemVat}
                      onChange={(e) =>
                        setNewItemVat(Number(e.target.value))
                      }
                      className={`w-full px-3 py-1.5 rounded-lg text-xs border focus:outline-none font-mono ${
                        isDarkMode
                          ? "bg-slate-950 border-slate-800 text-white"
                          : "bg-white border-slate-200 text-slate-800"
                      }`}
                      min={0}
                      max={100}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={addItemToInvoice}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>افزودن ردیف</span>
                  </button>
                </div>
              </div>

              {/* CURRENT INVOICE ITEMS LIST */}
              <div className="mb-6">
                <h4 className="text-[11px] font-black mb-3">
                  اقلام فاکتور جاری
                </h4>
                <div className="border rounded-xl overflow-hidden">
                  <table className="w-full text-right border-collapse text-xs">
                    <thead>
                      <tr
                        className={`border-b ${isDarkMode ? "bg-slate-950/60 text-slate-400 border-slate-800" : "bg-slate-50 text-slate-500 border-slate-200"} font-black`}
                      >
                        <th className="py-2.5 px-3">نام کالا</th>
                        <th className="py-2.5 px-3">تعداد</th>
                        <th className="py-2.5 px-3">قیمت واحد</th>
                        <th className="py-2.5 px-3">تخفیف سطری (٪)</th>
                        <th className="py-2.5 px-3">ارزش افزوده (٪)</th>
                        <th className="py-2.5 px-3 text-left">مجموع کل ردیف</th>
                        <th className="py-2.5 px-3 text-center">حذف</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 font-mono">
                      {newInvoice.lines.length > 0 ? (
                        newInvoice.lines.map((item, index) => {
                          const prod = products.find(
                            (p) => p.id === item.product_id,
                          );
                          const prodName = prod ? prod.name : "ناشناس";
                          const lineCost = item.quantity * item.unit_price;
                          const discountAmt =
                            lineCost * (item.discount_percentage / 100);
                          const taxAmt =
                            (lineCost - discountAmt) *
                            (item.vat_percentage / 100);
                          const finalLineCost = lineCost - discountAmt + taxAmt;

                          return (
                            <tr
                              key={index}
                              className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10"
                            >
                              <td className="py-2.5 px-3 font-sans font-semibold">
                                {prodName}
                              </td>
                              <td className="py-2.5 px-3">
                                <input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => handleLineChange(index, "quantity", Number(e.target.value))}
                                  className={`w-16 px-1.5 py-1 text-center font-mono rounded-lg border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                                    isDarkMode
                                      ? "bg-slate-950 border-slate-800 text-white"
                                      : "bg-white border-slate-200 text-slate-800"
                                  }`}
                                  min={1}
                                />
                              </td>
                              <td className="py-2.5 px-3">
                                <input
                                  type="number"
                                  value={item.unit_price}
                                  onChange={(e) => handleLineChange(index, "unit_price", Number(e.target.value))}
                                  className={`w-32 px-1.5 py-1 text-left font-mono rounded-lg border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                                    isDarkMode
                                      ? "bg-slate-950 border-slate-800 text-white"
                                      : "bg-white border-slate-200 text-slate-800"
                                  }`}
                                  min={0}
                                />
                              </td>
                              <td className="py-2.5 px-3 text-rose-500">
                                <input
                                  type="number"
                                  value={item.discount_percentage}
                                  onChange={(e) => handleLineChange(index, "discount_percentage", Number(e.target.value))}
                                  className={`w-16 px-1.5 py-1 text-center font-mono rounded-lg border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                                    isDarkMode
                                      ? "bg-slate-950 border-slate-800 text-white"
                                      : "bg-white border-slate-200 text-slate-800"
                                  }`}
                                  min={0}
                                  max={100}
                                />
                              </td>
                              <td className="py-2.5 px-3">
                                <input
                                  type="number"
                                  value={item.vat_percentage}
                                  onChange={(e) => handleLineChange(index, "vat_percentage", Number(e.target.value))}
                                  className={`w-16 px-1.5 py-1 text-center font-mono rounded-lg border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                                    isDarkMode
                                      ? "bg-slate-950 border-slate-800 text-white"
                                      : "bg-white border-slate-200 text-slate-800"
                                  }`}
                                  min={0}
                                  max={100}
                                />
                              </td>
                              <td className={`py-2.5 px-3 text-left font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                                {finalLineCost.toLocaleString("fa-IR")} ریال
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => removeItemFromInvoice(index)}
                                  className="p-1 hover:bg-rose-500/10 rounded-md text-rose-400 transition"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td
                            colSpan={7}
                            className="py-6 text-center italic text-slate-500"
                          >
                            هیچ ردیفی اضافه نشده است. لطفاً کالاهای بالا را
                            فرموله‌سازی و اضافه کنید.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* BOTTOM SUMMARY & DESCRIPTION */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start border-t pt-5 border-slate-200 dark:border-slate-800">
                <div>
                  <label className="block text-[10px] font-bold text-slate-450 mb-1.5">
                    توضیحات فاکتور
                  </label>
                  <textarea
                    rows={3}
                    value={newInvoice.description}
                    onChange={(e) =>
                      setNewInvoice((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className={`w-full px-3 py-2 rounded-xl text-xs border focus:ring-1 focus:ring-blue-500 focus:outline-none ${
                      isDarkMode
                        ? "bg-slate-950 border-slate-850 text-white"
                        : "bg-white border-slate-200 text-slate-800"
                    }`}
                    placeholder="شرح کلی فاکتور بازرگانی..."
                  />
                </div>

                {/* Pricing totals */}
                <div
                  className={`p-4 rounded-xl space-y-3 ${
                    isDarkMode
                      ? "bg-slate-950/60 border border-slate-850"
                      : "bg-slate-50 border border-slate-150"
                  }`}
                >
                  {(() => {
                    // Perform a quick manual calculation for UI display purposes before creating the actual draft
                    let tGross = 0;
                    let tDiscount = 0;
                    let tVat = 0;
                    newInvoice.lines.forEach((l) => {
                      const lGross = l.quantity * l.unit_price;
                      const lDisc = lGross * (l.discount_percentage / 100);
                      const taxable = lGross - lDisc;
                      const lVat = taxable * (l.vat_percentage / 100);
                      tGross += lGross;
                      tDiscount += lDisc;
                      tVat += lVat;
                    });

                    const net = Math.max(
                      0,
                      tGross -
                        tDiscount -
                        newInvoice.total_discount_header +
                        tVat -
                        (newInvoice.manual_rounding || 0)
                    );

                    return (
                      <>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-450">
                            مجموع بهای کل کالاها:
                          </span>
                          <span className="font-mono font-bold">
                            {formatRial(tGross)}
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-450">
                            مجموع تخفیف‌های سطری:
                          </span>
                          <span className="font-mono text-rose-500 font-bold">
                            {formatRial(tDiscount)}
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-450">
                            تخفیف کلی فاکتور (هدر):
                          </span>
                          <span className="font-mono text-rose-500 font-bold flex items-center gap-1.5">
                            <input
                              type="number"
                              value={newInvoice.total_discount_header}
                              onChange={(e) =>
                                setNewInvoice((prev) => ({
                                  ...prev,
                                  total_discount_header: Number(e.target.value),
                                }))
                              }
                              className={`w-32 px-1.5 py-0.5 text-left font-mono rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                                isDarkMode
                                  ? "bg-slate-950 border-slate-800 text-rose-400"
                                  : "bg-white border-slate-200 text-rose-600"
                              }`}
                              min={0}
                            />
                            <span>ریال</span>
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-450">
                            تعدیلات و گرد کردن دستی (کسر از جمع کل):
                          </span>
                          <span className="font-mono text-amber-500 font-bold flex items-center gap-1.5">
                            <input
                              type="number"
                              value={newInvoice.manual_rounding || 0}
                              onChange={(e) =>
                                setNewInvoice((prev) => ({
                                  ...prev,
                                  manual_rounding: Number(e.target.value),
                                }))
                              }
                              className={`w-32 px-1.5 py-0.5 text-left font-mono rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                                isDarkMode
                                  ? "bg-slate-950 border-slate-800 text-amber-400"
                                  : "bg-white border-slate-200 text-amber-600"
                              }`}
                            />
                            <span>ریال</span>
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-450">
                            مالیات بر ارزش افزوده (VAT):
                          </span>
                          <span className="font-mono text-amber-500 font-bold">
                            {formatRial(tVat)}
                          </span>
                        </div>

                        <div className="border-t border-slate-200 dark:border-slate-800 pt-2 flex justify-between items-center text-sm font-black">
                          <span className={`${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`}>
                            مبلغ قابل پرداخت فاکتور:
                          </span>
                          <span className="font-mono text-blue-500 font-bold">
                            {formatRial(net)}
                          </span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingInvoice(false);
                    setNewInvoice({
                      invoice_type: InvoiceType.SALE,
                      invoice_date: new Date().toLocaleDateString("fa-IR"),
                      client_id: "",
                      lines: [],
                      total_discount_header: 0,
                      description: "",
                    });
                  }}
                  className="px-4 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl font-bold transition text-slate-400 hover:text-slate-200"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={handleSaveDraftInvoice}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-lg transition"
                >
                  ثبت و نهایی‌سازی فاکتور
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- Tab 2: Partners (مشتریان و تامین‌کنندگان) Section --- */}
      {activeTab === "partners" && (
        <div className="space-y-6 animate-fade-in">
          {viewingPartner ? (
            /* ==========================================
               1. PARTNER DETAIL PROFILE & STATEMENT VIEW
               ========================================== */
            <div className={`border rounded-2xl p-4 md:p-6 ${isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200/80 shadow-sm"}`}>
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 border-slate-200 dark:border-slate-800 mb-6 text-right">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setViewingPartner(null)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl transition"
                    title="بازگشت"
                  >
                    <ChevronLeft className="w-5 h-5 rotate-180" />
                  </button>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <h3 className={`text-sm font-black ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>
                        {viewingPartner.name}
                      </h3>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                        viewingPartner.type === "customer"
                          ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                      }`}>
                        {viewingPartner.type === "customer" ? "مشتری فروش" : "تامین‌کننده خرید"}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      کد تفصیلی طرف حساب: <span className="font-mono">{viewingPartner.id}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingPartnerData({ ...viewingPartner });
                      setIsEditingPartner(true);
                      setViewingPartner(null);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-md"
                  >
                    <Edit className="w-4 h-4" />
                    <span>ویرایش مشخصات</span>
                  </button>
                  <button
                    onClick={() => setViewingPartner(null)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition"
                  >
                    بستن پرونده
                  </button>
                </div>
              </div>

              {/* KPI metrics for this viewed partner */}
              {(() => {
                const partnerInvoices = invoices.filter(inv => inv.client_id === viewingPartner.id);
                
                const totalSales = partnerInvoices
                  .filter(inv => inv.invoice_type === InvoiceType.SALE && inv.status === InvoiceStatus.FINALIZED)
                  .reduce((sum, inv) => sum + inv.total_net_amount, 0);

                const totalPurchases = partnerInvoices
                  .filter(inv => inv.invoice_type === InvoiceType.PURCHASE && inv.status === InvoiceStatus.FINALIZED)
                  .reduce((sum, inv) => sum + inv.total_net_amount, 0);

                const totalReturns = partnerInvoices
                  .filter(inv => (inv.invoice_type === InvoiceType.SALE_RETURN || inv.invoice_type === InvoiceType.PURCHASE_RETURN) && inv.status === InvoiceStatus.FINALIZED)
                  .reduce((sum, inv) => sum + inv.total_net_amount, 0);

                // Outstanding calculation
                const currentOutstanding = viewingPartner.type === "customer" 
                  ? Math.max(0, totalSales - totalReturns) 
                  : Math.max(0, totalPurchases - totalReturns);

                const remainingCredit = Math.max(0, viewingPartner.credit_limit - currentOutstanding);
                const creditUsagePercent = viewingPartner.credit_limit > 0 
                  ? Math.min(100, (currentOutstanding / viewingPartner.credit_limit) * 100) 
                  : 0;

                return (
                  <div className="space-y-6 text-right">
                    {/* Metrics row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* KPI 1: Outstanding */}
                      <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-slate-950/50 border-slate-850' : 'bg-slate-50 border-slate-200'} flex items-center justify-between`}>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 font-bold block mb-1">
                            {viewingPartner.type === "customer" ? "کل بدهی به ما (مطالبات جاری)" : "کل تعهد ما به تامین‌کننده (بدهی جاری)"}
                          </span>
                          <span className="text-sm font-black font-mono text-emerald-450">
                            {formatRial(currentOutstanding)}
                          </span>
                        </div>
                        <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-450">
                          <DollarSign className="w-5 h-5" />
                        </div>
                      </div>

                      {/* KPI 2: Total trading volume */}
                      <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-slate-950/50 border-slate-850' : 'bg-slate-50 border-slate-200'} flex items-center justify-between`}>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 font-bold block mb-1">حجم مبادلات تجاری نهایی</span>
                          <span className="text-sm font-black font-mono text-blue-400">
                            {formatRial(totalSales + totalPurchases)}
                          </span>
                        </div>
                        <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
                          <Receipt className="w-5 h-5" />
                        </div>
                      </div>

                      {/* KPI 3: Credit Limit usage */}
                      <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-slate-950/50 border-slate-850' : 'bg-slate-50 border-slate-200'} flex flex-col justify-between`}>
                        <div className="flex items-center justify-between w-full">
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 font-bold block mb-1">اعتبار آزاد تجاری</span>
                            <span className="text-sm font-black font-mono text-amber-400">
                              {formatRial(remainingCredit)}
                            </span>
                          </div>
                          <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-400">
                            <Scale className="w-4 h-4" />
                          </div>
                        </div>
                        {/* Progress bar */}
                        <div className="mt-3">
                          <div className="w-full bg-slate-900 rounded-full h-1">
                            <div 
                              className={`h-full rounded-full transition-all duration-300 ${
                                creditUsagePercent > 85 ? "bg-rose-500" : creditUsagePercent > 50 ? "bg-amber-500" : "bg-emerald-500"
                              }`}
                              style={{ width: `${creditUsagePercent}%` }}
                            />
                          </div>
                          <div className="flex justify-between items-center text-[8px] text-slate-450 mt-1">
                            <span>{creditUsagePercent.toFixed(1)}٪ سقف اعتبار مصرف شده</span>
                            <span>کل اعتبار: {formatRial(viewingPartner.credit_limit)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Main content grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Column 1: Client Bio (1/3) */}
                      <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-slate-950/20 border-slate-850' : 'bg-slate-50/50 border-slate-200'}`}>
                        <h4 className="text-xs font-black text-slate-200 border-b pb-2 mb-4 dark:border-slate-800">
                          مشخصات عمومی و بازرگانی
                        </h4>
                        
                        <div className="space-y-4 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400 text-[11px]">نوع شخصیت:</span>
                            <span className="font-bold text-slate-200">{viewingPartner.person_type === "LEGAL" ? "حقوقی / شرکتی" : "حقیقی / انفرادی"}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400 text-[11px]">شناسه ملی/کد ملی:</span>
                            <span className="font-mono font-bold text-slate-200">{viewingPartner.national_id || "ثبت نشده"}</span>
                          </div>
                          {viewingPartner.economic_code && (
                            <div className="flex justify-between items-center">
                              <span className="text-slate-400 text-[11px]">کد اقتصادی:</span>
                              <span className="font-mono text-slate-200">{viewingPartner.economic_code}</span>
                            </div>
                          )}
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400 text-[11px]">شماره همراه:</span>
                            <span className="font-mono text-slate-200">{viewingPartner.mobile_number || "ثبت نشده"}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400 text-[11px]">تلفن ثابت:</span>
                            <span className="font-mono text-slate-200">{viewingPartner.phone_number || "ثبت نشده"}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400 text-[11px]">موقعیت جغرافیایی:</span>
                            <span className="text-slate-200">
                              {viewingPartner.province || viewingPartner.city 
                                ? `${viewingPartner.province || ''} - ${viewingPartner.city || ''}` 
                                : "ثبت نشده"}
                            </span>
                          </div>
                          <div className="pt-2 border-t border-slate-850">
                            <span className="text-slate-400 text-[11px] block mb-1">نشانی دقیق:</span>
                            <p className="text-[11px] text-slate-300 leading-relaxed bg-slate-900/30 p-2.5 rounded-lg border border-slate-850">
                              {viewingPartner.address || "آدرسی ثبت نگردیده است."}
                            </p>
                          </div>

                          <div className="pt-3 border-t border-slate-850 space-y-2">
                            <h5 className="text-[10px] font-black text-slate-400">پارامترهای مالی پیش‌فرض</h5>
                            <div className="grid grid-cols-2 gap-2 text-[11px]">
                              <div className="bg-slate-900/40 p-2 rounded-lg text-center font-sans">
                                <span className="block text-[9px] text-slate-500 mb-1">لیست قیمت پیش‌فرض</span>
                                <span className="font-bold text-slate-300">
                                  {viewingPartner.price_list_type === "wholesale" ? "عمده‌فروشی" : viewingPartner.price_list_type === "partner" ? "همکار تجاری" : "تک‌فروشی"}
                                </span>
                              </div>
                              <div className="bg-slate-900/40 p-2 rounded-lg text-center font-sans">
                                <span className="block text-[9px] text-slate-500 mb-1">تخفیف سطری</span>
                                <span className="font-bold text-emerald-450">{viewingPartner.line_discount_percent}٪</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Column 2: Invoices and Statement ledger (2/3) */}
                      <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center justify-between border-b pb-2 dark:border-slate-800">
                          <h4 className="text-xs font-black text-slate-200 flex items-center gap-1.5">
                            <BookOpen className="w-4 h-4 text-blue-500" />
                            <span>ریز تراکنش‌ها و اسناد مالی (صورت‌حساب)</span>
                          </h4>
                          
                          <button
                            onClick={() => {
                              let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
                              csvContent += "شماره سند,تاریخ,نوع فاکتور,بهای ناخالص,مجموع تخفیف,مالیات ارزش افزوده,مبلغ نهایی قابل پرداخت,وضعیت سند\n";
                              partnerInvoices.forEach(inv => {
                                const typeLabel = inv.invoice_type === InvoiceType.SALE ? "فروش" : 
                                                  inv.invoice_type === InvoiceType.PURCHASE ? "خرید" : 
                                                  inv.invoice_type === InvoiceType.PROFORMA ? "پیش‌فاکتور" : 
                                                  inv.invoice_type === InvoiceType.SALE_RETURN ? "برگشت از فروش" : "برگشت از خرید";
                                const statusLabel = inv.status === InvoiceStatus.FINALIZED ? "نهایی" : 
                                                    inv.status === InvoiceStatus.DRAFT ? "پیش‌نویس" : "ابطال شده";
                                csvContent += `"${inv.invoice_number}","${inv.invoice_date}","${typeLabel}",${inv.total_gross_amount},${inv.total_discount_line + inv.total_discount_header},${inv.total_vat_amount},${inv.total_net_amount},"${statusLabel}"\n`;
                              });
                              const encodedUri = encodeURI(csvContent);
                              const link = document.createElement("a");
                              link.setAttribute("href", encodedUri);
                              link.setAttribute("download", `statement_${viewingPartner.name}.csv`);
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                              showNotification(`صورت‌حساب طرف حساب با موفقیت صادر گردید.`, "success");
                            }}
                            className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 font-bold bg-blue-500/5 px-2.5 py-1.5 rounded-lg border border-blue-500/10 transition"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>خروجی اکسل گردش حساب</span>
                          </button>
                        </div>

                        {/* Statement Table */}
                        <div className="overflow-x-auto rounded-xl border border-slate-850 bg-slate-950/20">
                          <table className="w-full text-right text-xs">
                            <thead className="bg-slate-900/60 text-slate-400 text-[10px]">
                              <tr>
                                <th className="p-3 font-black">شماره سند</th>
                                <th className="p-3 font-black">تاریخ ثبت</th>
                                <th className="p-3 font-black">نوع فاکتور</th>
                                <th className="p-3 font-black">مبلغ قابل پرداخت</th>
                                <th className="p-3 font-black">وضعیت</th>
                                <th className="p-3 font-black text-center">عملیات</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-850">
                              {partnerInvoices.length === 0 ? (
                                <tr>
                                  <td colSpan={6} className="p-6 text-center text-slate-500 italic">
                                    هیچ فاکتور یا سندی برای این طرف حساب یافت نگردید.
                                  </td>
                                </tr>
                              ) : (
                                partnerInvoices.map(inv => (
                                  <tr key={inv.id} className="hover:bg-slate-900/40 transition-colors">
                                    <td className="p-3 font-mono font-bold text-slate-205">
                                      {inv.invoice_number}
                                    </td>
                                    <td className="p-3 font-mono text-slate-300">
                                      {inv.invoice_date}
                                    </td>
                                    <td className="p-3">
                                      <span className={`inline-block text-[9px] font-black px-1.5 py-0.5 rounded ${
                                        inv.invoice_type === InvoiceType.SALE
                                          ? "bg-blue-500/10 text-blue-400"
                                          : inv.invoice_type === InvoiceType.PURCHASE
                                            ? "bg-purple-500/10 text-purple-400"
                                            : inv.invoice_type === InvoiceType.PROFORMA
                                              ? "bg-amber-500/10 text-amber-400"
                                              : "bg-rose-500/10 text-rose-400"
                                      }`}>
                                        {inv.invoice_type === InvoiceType.SALE ? "فروش" : 
                                         inv.invoice_type === InvoiceType.PURCHASE ? "خرید" : 
                                         inv.invoice_type === InvoiceType.PROFORMA ? "پیش‌فاکتور" : "برگشت فاکتور"}
                                      </span>
                                    </td>
                                    <td className="p-3 font-mono font-bold text-slate-200">
                                      {formatRial(inv.total_net_amount)}
                                    </td>
                                    <td className="p-3">
                                      <span className={`inline-block text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                                        inv.status === InvoiceStatus.FINALIZED
                                          ? "bg-emerald-500/15 text-emerald-400"
                                          : inv.status === InvoiceStatus.DRAFT
                                            ? "bg-slate-500/15 text-slate-400"
                                            : "bg-rose-500/15 text-rose-400 text-line-through"
                                      }`}>
                                        {inv.status === InvoiceStatus.FINALIZED ? "نهایی" : 
                                         inv.status === InvoiceStatus.DRAFT ? "پیش‌نویس" : "ابطال شده"}
                                      </span>
                                    </td>
                                    <td className="p-3 text-center">
                                      <button
                                        onClick={() => setViewingInvoice(inv)}
                                        className="inline-flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 bg-blue-500/5 hover:bg-blue-500/10 px-2 py-1 rounded transition font-bold"
                                      >
                                        <Eye className="w-3.5 h-3.5" />
                                        <span>مشاهده فاکتور</span>
                                      </button>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : isEditingPartner ? (
            /* ==========================================
               2. EDIT PARTNER PROFILE FORM
               ========================================== */
            <div className={`border rounded-2xl p-5 md:p-7 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200/80 shadow-sm"} animate-fade-in`}>
              <div className="flex items-center justify-between border-b pb-4 mb-6 border-slate-200 dark:border-slate-800 text-right">
                <div className="text-right">
                  <h3 className="text-sm font-black flex items-center gap-1.5 text-slate-100">
                    <Edit className="w-5 h-5 text-amber-500" />
                    <span>ویرایش و اصلاح مشخصات طرف حساب تجاری</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 font-sans">
                    اصلاح شماره تماس، آدرس پستی، تخصیص سقف اعتبار خرید تعهدی و کدهای مالیاتی طرف حساب
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsEditingPartner(false);
                    const original = partners.find(p => p.id === editingPartnerData.id);
                    if (original) setViewingPartner(original);
                  }}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-bold rounded-xl transition"
                >
                  انصراف و بازگشت
                </button>
              </div>

              {/* Form Input fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-right">
                <div>
                  <label className="block text-[10px] font-bold text-slate-450 mb-1.5">
                    نوع شخص (حقیقی / حقوقی)
                  </label>
                  <select
                    value={editingPartnerData.person_type || "REAL"}
                    onChange={(e) =>
                      setEditingPartnerData((prev) => ({
                        ...prev,
                        person_type: e.target.value as "REAL" | "LEGAL",
                      }))
                    }
                    className={`w-full px-3 py-2 rounded-xl text-xs border focus:ring-1 focus:ring-blue-500 focus:outline-none ${
                      isDarkMode
                        ? "bg-slate-950 border-slate-850 text-white"
                        : "bg-white border-slate-200 text-slate-800"
                    }`}
                  >
                    <option value="REAL">شخص حقیقی</option>
                    <option value="LEGAL">شخص حقوقی (شرکت/سازمان)</option>
                  </select>
                </div>

                <div className="md:col-span-2 text-right">
                  <label className="block text-[10px] font-bold text-slate-450 mb-1.5">
                    نام کامل شخص حقیقی یا نام شرکت
                  </label>
                  <input
                    type="text"
                    value={editingPartnerData.name || ""}
                    onChange={(e) =>
                      setEditingPartnerData((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className={`w-full px-3 py-2 rounded-xl text-xs border focus:ring-1 focus:ring-blue-500 focus:outline-none ${
                      isDarkMode
                        ? "bg-slate-950 border-slate-850 text-white"
                        : "bg-white border-slate-200 text-slate-800"
                    }`}
                    placeholder="نام و نام خانوادگی / نام ثبتی شرکت..."
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-450 mb-1.5">
                    شماره ملی / شناسه ملی حقوقی
                  </label>
                  <input
                    type="text"
                    value={editingPartnerData.national_id || ""}
                    onChange={(e) =>
                      setEditingPartnerData((prev) => ({
                        ...prev,
                        national_id: e.target.value,
                      }))
                    }
                    className={`w-full px-3 py-2 rounded-xl text-xs border focus:ring-1 focus:ring-blue-500 focus:outline-none font-mono text-left ${
                      isDarkMode
                        ? "bg-slate-950 border-slate-850 text-white"
                        : "bg-white border-slate-200 text-slate-800"
                    }`}
                    placeholder="10 رقمی یا 11 رقمی..."
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-450 mb-1.5">
                    کد اقتصادی (اختیاری)
                  </label>
                  <input
                    type="text"
                    value={editingPartnerData.economic_code || ""}
                    onChange={(e) =>
                      setEditingPartnerData((prev) => ({
                        ...prev,
                        economic_code: e.target.value,
                      }))
                    }
                    className={`w-full px-3 py-2 rounded-xl text-xs border focus:ring-1 focus:ring-blue-500 focus:outline-none font-mono text-left ${
                      isDarkMode
                        ? "bg-slate-950 border-slate-850 text-white"
                        : "bg-white border-slate-200 text-slate-800"
                    }`}
                    placeholder="مثال: 4111..."
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-450 mb-1.5">
                    دسته‌بندی (نقش تجاری)
                  </label>
                  <select
                    value={editingPartnerData.type || "customer"}
                    onChange={(e) =>
                      setEditingPartnerData((prev) => ({
                        ...prev,
                        type: e.target.value as any,
                      }))
                    }
                    className={`w-full px-3 py-2 rounded-xl text-xs border focus:ring-1 focus:ring-blue-500 focus:outline-none ${
                      isDarkMode
                        ? "bg-slate-950 border-slate-850 text-white"
                        : "bg-white border-slate-200 text-slate-800"
                    }`}
                  >
                    <option value="customer">مشتری (خریدار محصولات شما)</option>
                    <option value="supplier">تامین‌کننده (فروشنده کالا به شما)</option>
                  </select>
                </div>

                <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-200 dark:border-slate-800 text-right text-slate-100">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 mb-1.5">
                      شماره موبایل
                    </label>
                    <input
                      type="text"
                      value={editingPartnerData.mobile_number || ""}
                      onChange={(e) =>
                        setEditingPartnerData((prev) => ({
                          ...prev,
                          mobile_number: e.target.value,
                        }))
                      }
                      className={`w-full px-3 py-2 rounded-xl text-xs border focus:ring-1 focus:ring-blue-500 focus:outline-none font-mono text-left ${
                        isDarkMode
                          ? "bg-slate-950 border-slate-850 text-white"
                          : "bg-white border-slate-200 text-slate-800"
                      }`}
                      placeholder="09..."
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 mb-1.5">
                      تلفن ثابت
                    </label>
                    <input
                      type="text"
                      value={editingPartnerData.phone_number || ""}
                      onChange={(e) =>
                        setEditingPartnerData((prev) => ({
                          ...prev,
                          phone_number: e.target.value,
                        }))
                      }
                      className={`w-full px-3 py-2 rounded-xl text-xs border focus:ring-1 focus:ring-blue-500 focus:outline-none font-mono text-left ${
                        isDarkMode
                          ? "bg-slate-950 border-slate-850 text-white"
                          : "bg-white border-slate-200 text-slate-800"
                      }`}
                      placeholder="021..."
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 mb-1.5">
                      استان
                    </label>
                    <input
                      type="text"
                      value={editingPartnerData.province || ""}
                      onChange={(e) =>
                        setEditingPartnerData((prev) => ({
                          ...prev,
                          province: e.target.value,
                        }))
                      }
                      className={`w-full px-3 py-2 rounded-xl text-xs border focus:ring-1 focus:ring-blue-500 focus:outline-none ${
                        isDarkMode
                          ? "bg-slate-950 border-slate-850 text-white"
                          : "bg-white border-slate-200 text-slate-800"
                      }`}
                      placeholder="مثال: تهران"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 mb-1.5">
                      شهر
                    </label>
                    <input
                      type="text"
                      value={editingPartnerData.city || ""}
                      onChange={(e) =>
                        setEditingPartnerData((prev) => ({
                          ...prev,
                          city: e.target.value,
                        }))
                      }
                      className={`w-full px-3 py-2 rounded-xl text-xs border focus:ring-1 focus:ring-blue-500 focus:outline-none ${
                        isDarkMode
                          ? "bg-slate-950 border-slate-850 text-white"
                          : "bg-white border-slate-200 text-slate-800"
                      }`}
                      placeholder="مثال: تهران"
                    />
                  </div>

                  <div className="md:col-span-2 text-right">
                    <label className="block text-[10px] font-bold text-slate-450 mb-1.5">
                      نشانی دقیق پستی
                    </label>
                    <input
                      type="text"
                      value={editingPartnerData.address || ""}
                      onChange={(e) =>
                        setEditingPartnerData((prev) => ({
                          ...prev,
                          address: e.target.value,
                        }))
                      }
                      className={`w-full px-3 py-2 rounded-xl text-xs border focus:ring-1 focus:ring-blue-500 focus:outline-none ${
                        isDarkMode
                          ? "bg-slate-950 border-slate-850 text-white"
                          : "bg-white border-slate-200 text-slate-800"
                      }`}
                      placeholder="خیابان، کوچه، پلاک، واحد..."
                    />
                  </div>
                </div>

                <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-200 dark:border-slate-800 text-right">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 mb-1.5">
                      سقف اعتبار مجاز خرید تعهدی (ریال)
                    </label>
                    <input
                      type="number"
                      value={editingPartnerData.credit_limit || 0}
                      onChange={(e) =>
                        setEditingPartnerData((prev) => ({
                          ...prev,
                          credit_limit: Number(e.target.value),
                        }))
                      }
                      className={`w-full px-3 py-2 rounded-xl text-xs border focus:ring-1 focus:ring-blue-500 focus:outline-none font-mono text-left ${
                        isDarkMode
                          ? "bg-slate-950 border-slate-850 text-white"
                          : "bg-white border-slate-200 text-slate-800"
                      }`}
                      min={0}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 mb-1.5">
                      لیست قیمت متصل پیش‌فرض
                    </label>
                    <select
                      value={editingPartnerData.price_list_type || "consumer"}
                      onChange={(e) =>
                        setEditingPartnerData((prev) => ({
                          ...prev,
                          price_list_type: e.target.value as any,
                        }))
                      }
                      className={`w-full px-3 py-2 rounded-xl text-xs border focus:ring-1 focus:ring-blue-500 focus:outline-none ${
                        isDarkMode
                          ? "bg-slate-950 border-slate-850 text-white"
                          : "bg-white border-slate-200 text-slate-800"
                      }`}
                    >
                      <option value="consumer">تک‌فروشی (مصرف‌کننده عمومی)</option>
                      <option value="partner">همکار (فروشگاه‌های همکار سخت‌افزاری)</option>
                      <option value="wholesale">عمده‌فروشی (سفارشات حجم بزرگ)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 mb-1.5">
                      تخفیف سطری ثابت (٪)
                    </label>
                    <input
                      type="number"
                      value={editingPartnerData.line_discount_percent || 0}
                      onChange={(e) =>
                        setEditingPartnerData((prev) => ({
                          ...prev,
                          line_discount_percent: Number(e.target.value),
                        }))
                      }
                      className={`w-full px-3 py-2 rounded-xl text-xs border focus:ring-1 focus:ring-blue-500 focus:outline-none font-mono text-left ${
                        isDarkMode
                          ? "bg-slate-950 border-slate-850 text-white"
                          : "bg-white border-slate-200 text-slate-800"
                      }`}
                      min={0}
                      max={100}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 mb-1.5">
                      تخفیف حجمی مجاز نهایی (٪)
                    </label>
                    <input
                      type="number"
                      value={editingPartnerData.volume_discount_percent || 0}
                      onChange={(e) =>
                        setEditingPartnerData((prev) => ({
                          ...prev,
                          volume_discount_percent: Number(e.target.value),
                        }))
                      }
                      className={`w-full px-3 py-2 rounded-xl text-xs border focus:ring-1 focus:ring-blue-500 focus:outline-none font-mono text-left ${
                        isDarkMode
                          ? "bg-slate-950 border-slate-850 text-white"
                          : "bg-white border-slate-200 text-slate-800"
                      }`}
                      min={0}
                      max={100}
                    />
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => {
                    setIsEditingPartner(false);
                    const original = partners.find(p => p.id === editingPartnerData.id);
                    if (original) setViewingPartner(original);
                  }}
                  className="px-4 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl font-bold transition text-slate-400 hover:text-slate-200"
                >
                  انصراف
                </button>
                <button
                  onClick={handleUpdatePartner}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-lg transition"
                >
                  ذخیره و اعمال تغییرات
                </button>
              </div>
            </div>
          ) : !isCreatingPartner ? (
            /* ==========================================
               3. PARTNER MAIN DASHBOARD & GRID VIEW
               ========================================== */
            <div className="space-y-6">
              {/* Top Summary Cards Row */}
              {(() => {
                const totalCustomersCount = partners.filter(p => p.type === "customer").length;
                const totalSuppliersCount = partners.filter(p => p.type === "supplier").length;
                
                // Calculate accounts receivable & payable
                let accountsReceivable = 0;
                let accountsPayable = 0;
                let criticalPartnersCount = 0;

                partners.forEach(partner => {
                  const partnerInvoices = invoices.filter(inv => inv.client_id === partner.id && inv.status === InvoiceStatus.FINALIZED);
                  const totalSales = partnerInvoices
                    .filter(inv => inv.invoice_type === InvoiceType.SALE)
                    .reduce((sum, inv) => sum + inv.total_net_amount, 0);
                  const totalPurchases = partnerInvoices
                    .filter(inv => inv.invoice_type === InvoiceType.PURCHASE)
                    .reduce((sum, inv) => sum + inv.total_net_amount, 0);
                  const totalReturns = partnerInvoices
                    .filter(inv => (inv.invoice_type === InvoiceType.SALE_RETURN || inv.invoice_type === InvoiceType.PURCHASE_RETURN))
                    .reduce((sum, inv) => sum + inv.total_net_amount, 0);

                  const outstanding = partner.type === "customer" 
                    ? Math.max(0, totalSales - totalReturns) 
                    : Math.max(0, totalPurchases - totalReturns);

                  if (partner.type === "customer") {
                    accountsReceivable += outstanding;
                  } else {
                    accountsPayable += outstanding;
                  }

                  if (partner.credit_limit > 0 && outstanding / partner.credit_limit > 0.85) {
                    criticalPartnersCount++;
                  }
                });

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-right">
                    {/* Stat 1: Customers */}
                    <div className={`p-4 rounded-xl border flex items-center justify-between ${isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200/80 shadow-sm'}`}>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 font-bold block">تعداد کل مشتریان</span>
                        <span className="text-sm font-black text-blue-500 font-mono mt-1 block">
                          {totalCustomersCount.toLocaleString("fa-IR")}
                        </span>
                        <span className="text-[8px] text-slate-500 block mt-1">مطالبات کل: {formatRial(accountsReceivable)}</span>
                      </div>
                      <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
                        <Users className="w-5 h-5" />
                      </div>
                    </div>

                    {/* Stat 2: Suppliers */}
                    <div className={`p-4 rounded-xl border flex items-center justify-between ${isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200/80 shadow-sm'}`}>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 font-bold block">تامین‌کنندگان تجاری</span>
                        <span className="text-sm font-black text-purple-400 font-mono mt-1 block">
                          {totalSuppliersCount.toLocaleString("fa-IR")}
                        </span>
                        <span className="text-[8px] text-slate-500 block mt-1">کل بدهی ما: {formatRial(accountsPayable)}</span>
                      </div>
                      <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400">
                        <Building className="w-5 h-5" />
                      </div>
                    </div>

                    {/* Stat 3: Total Accounts Receivable */}
                    <div className={`p-4 rounded-xl border flex items-center justify-between ${isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200/80 shadow-sm'}`}>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 font-bold block">مجموع بدهکاران (بازار جاری)</span>
                        <span className="text-sm font-black text-emerald-400 font-mono mt-1 block">
                          {formatRial(accountsReceivable)}
                        </span>
                        <span className="text-[8px] text-emerald-500 block mt-1">تعهدات پرداخت فعال بازار</span>
                      </div>
                      <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
                        <DollarSign className="w-5 h-5" />
                      </div>
                    </div>

                    {/* Stat 4: Critical Credit limit alerts */}
                    <div className={`p-4 rounded-xl border flex items-center justify-between ${isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200/80 shadow-sm'}`}>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 font-bold block">بحران حد اعتبار تجاری</span>
                        <span className="text-sm font-black text-rose-500 font-mono mt-1 block">
                          {criticalPartnersCount.toLocaleString("fa-IR")} <span className="text-[10px] font-sans font-normal text-slate-400">مورد</span>
                        </span>
                        <span className="text-[8px] text-rose-400 block mt-1">مصرف حد اعتباری بالای ۸۵٪</span>
                      </div>
                      <div className="p-3 bg-rose-500/10 rounded-xl text-rose-400">
                        <ShieldAlert className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div
                className={`border rounded-2xl p-4 md:p-6 ${isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200/80 shadow-sm"}`}
              >
                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div className="text-right">
                    <h3
                      className={`text-sm font-black ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}
                    >
                      مدیریت هوشمند مشتریان و تامین‌کنندگان
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-1">
                      کنترل سقف اعتبار مصوب بازار، اتصال به لیست‌های قیمتی همکار/عمده و تعیین سطوح تخفیف تجاری
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={handleExportPartnersCSV}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition border border-slate-700"
                    >
                      <Download className="w-4 h-4 text-slate-400" />
                      <span>خروجی اکسل طرف حساب‌ها</span>
                    </button>
                    <button
                      onClick={() => setIsCreatingPartner(true)}
                      className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 shrink-0"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>ثبت طرف حساب تجاری جدید</span>
                    </button>
                  </div>
                </div>

                {/* Search & Filter Bar */}
                <div className={`p-4 rounded-xl mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 ${isDarkMode ? 'bg-slate-950/40 border border-slate-850' : 'bg-slate-50 border border-slate-200 shadow-xs'}`}>
                  <div className="md:col-span-2 relative">
                    <Search className="absolute right-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={partnerSearchQuery}
                      onChange={(e) => setPartnerSearchQuery(e.target.value)}
                      placeholder="جستجو با نام طرف حساب، شماره ملی، تلفن، آدرس..."
                      className={`w-full pr-9 pl-3 py-1.5 rounded-lg text-xs border focus:ring-1 focus:ring-blue-500 focus:outline-none ${
                        isDarkMode
                          ? "bg-slate-900 border-slate-800 text-white placeholder-slate-500"
                          : "bg-white border-slate-200 text-slate-850 placeholder-slate-400"
                      }`}
                    />
                  </div>

                  <div>
                    <select
                      value={partnerFilterType}
                      onChange={(e) => setPartnerFilterType(e.target.value)}
                      className={`w-full px-3 py-1.5 rounded-lg text-xs border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                        isDarkMode
                          ? "bg-slate-900 border-slate-800 text-white"
                          : "bg-white border-slate-200 text-slate-800"
                      }`}
                    >
                      <option value="ALL">همه طرف حساب‌ها</option>
                      <option value="customer">مشتریان (فروش)</option>
                      <option value="supplier">تامین‌کنندگان (خرید)</option>
                    </select>
                  </div>
                </div>

                {/* Partners Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-right">
                  {(() => {
                    const filteredPartners = partners.filter(p => {
                      const query = partnerSearchQuery.toLowerCase();
                      const matchesSearch = 
                        p.name.toLowerCase().includes(query) ||
                        (p.national_id && p.national_id.includes(query)) ||
                        (p.phone_number && p.phone_number.includes(query)) ||
                        (p.mobile_number && p.mobile_number.includes(query)) ||
                        (p.address && p.address.toLowerCase().includes(query));
                      
                      const matchesType = partnerFilterType === "ALL" || p.type === partnerFilterType;

                      return matchesSearch && matchesType;
                    });

                    if (filteredPartners.length === 0) {
                      return (
                        <div className="col-span-full py-12 text-center text-slate-500 italic">
                          هیچ طرف حسابی با فیلترهای فعلی یافت نشد.
                        </div>
                      );
                    }

                    return filteredPartners.map((partner) => {
                      // Compute actualized outstanding for credit usage percent
                      const partnerInvoices = invoices.filter(inv => inv.client_id === partner.id && inv.status === InvoiceStatus.FINALIZED);
                      const totalSales = partnerInvoices
                        .filter(inv => inv.invoice_type === InvoiceType.SALE)
                        .reduce((sum, inv) => sum + inv.total_net_amount, 0);
                      const totalPurchases = partnerInvoices
                        .filter(inv => inv.invoice_type === InvoiceType.PURCHASE)
                        .reduce((sum, inv) => sum + inv.total_net_amount, 0);
                      const totalReturns = partnerInvoices
                        .filter(inv => (inv.invoice_type === InvoiceType.SALE_RETURN || inv.invoice_type === InvoiceType.PURCHASE_RETURN))
                        .reduce((sum, inv) => sum + inv.total_net_amount, 0);

                      const activeDebts = partner.type === "customer" 
                        ? Math.max(0, totalSales - totalReturns) 
                        : Math.max(0, totalPurchases - totalReturns);

                      const creditUsagePercent =
                        partner.credit_limit > 0
                          ? Math.min(100, (activeDebts / partner.credit_limit) * 100)
                          : 0;

                      return (
                        <div
                          key={partner.id}
                          className={`p-4 rounded-xl border flex flex-col justify-between transition-all hover:shadow-lg ${
                            isDarkMode
                              ? "bg-slate-950/40 border-slate-850 hover:border-slate-750"
                              : "bg-white border-slate-200 hover:border-slate-300 shadow-sm"
                          }`}
                        >
                          <div>
                            {/* Header info */}
                            <div className="flex items-start justify-between gap-2 mb-3 text-right">
                              <div className="text-right">
                                <h4 className={`font-bold text-xs ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                                  {partner.name}
                                </h4>
                                <span
                                  className={`inline-block text-[9px] font-black px-1.5 py-0.5 rounded mt-1.5 ${
                                    partner.type === "customer"
                                      ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                      : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                                  }`}
                                >
                                  {partner.type === "customer"
                                    ? "مشتری فروش"
                                    : "تامین‌کننده خرید"}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => setViewingPartner(partner)}
                                  className="p-1.5 bg-blue-500/5 hover:bg-blue-500/15 rounded-lg text-blue-400 transition"
                                  title="پرونده و گردش حساب"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingPartnerData({ ...partner });
                                    setIsEditingPartner(true);
                                  }}
                                  className="p-1.5 bg-amber-500/5 hover:bg-amber-500/15 rounded-lg text-amber-400 transition"
                                  title="ویرایش اطلاعات"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeletePartner(partner.id)}
                                  className="p-1.5 hover:bg-rose-500/10 rounded-lg text-slate-500 hover:text-rose-500 transition shrink-0"
                                  title="حذف طرف حساب"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                             {/* Credit Limit Meter */}
                             <div className="space-y-1 mt-4">
                               <div className="flex justify-between items-center text-[10px]">
                                 <span className="text-slate-450">
                                   بدهی جاری / سقف اعتبار (ریال):
                                 </span>
                                 <span className="font-mono font-bold flex items-center gap-1">
                                   <span className="text-slate-350">{activeDebts.toLocaleString("fa-IR")} / </span>
                                   <input
                                     type="number"
                                     value={partner.credit_limit}
                                     onChange={(e) => {
                                       const val = Number(e.target.value);
                                       try {
                                         engine.updatePartner(partner.id, { credit_limit: val });
                                         setPartners([...engine.getPartners()]);
                                       } catch (err) {
                                         console.error(err);
                                       }
                                     }}
                                     className={`w-28 px-1.5 py-0.5 text-left font-mono rounded border text-[10px] focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                                       isDarkMode
                                         ? "bg-slate-950 border-slate-800 text-white"
                                         : "bg-white border-slate-200 text-slate-850"
                                     }`}
                                     min={0}
                                   />
                                 </span>
                               </div>
                              {/* Credit bar */}
                              <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-full transition-all duration-300 ${
                                    creditUsagePercent > 85
                                      ? "bg-rose-500 animate-pulse"
                                      : creditUsagePercent > 50
                                        ? "bg-amber-400"
                                        : "bg-blue-500"
                                  }`}
                                  style={{ width: `${creditUsagePercent}%` }}
                                />
                              </div>
                              {creditUsagePercent > 85 && (
                                <span className="text-[8px] text-rose-400 font-bold flex items-center gap-1 mt-1">
                                  <ShieldAlert className="w-3 h-3" />
                                  اعتبار طرف حساب در مرز بحرانی قرار دارد!
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Info & Meta Data Grid */}
                          <div className="mt-4 pt-3 border-t border-slate-900/60 text-[9px] text-slate-400 grid grid-cols-2 gap-y-2 gap-x-4 text-right">
                            <div className="flex items-center gap-1">
                              <span className="text-slate-500">کد ملی/شناسه:</span>
                              <span className="font-mono text-slate-350">{partner.national_id || "ثبت نشده"}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-slate-500">موبایل:</span>
                              <span className="font-mono text-slate-350">{partner.mobile_number || "ثبت نشده"}</span>
                            </div>
                            <div className="flex items-center gap-1 col-span-2">
                              <span className="text-slate-500">آدرس:</span>
                              <span className="text-slate-350 truncate" title={partner.address || ""}>{partner.address || "ثبت نشده"}</span>
                            </div>
                          </div>

                          {/* Pricing list and discounts metadata */}
                          <div className="grid grid-cols-3 gap-2 border-t pt-3 mt-3 border-slate-900/60 text-[10px] text-slate-400 font-mono bg-slate-900/20 -mx-4 -mb-4 px-4 pb-4 rounded-b-xl">
                            <div>
                              <span className="block text-[8px] text-slate-500 mb-1">
                                لیست قیمت پیش‌فرض
                              </span>
                              <span className="font-sans font-bold text-slate-200">
                                {partner.price_list_type === "wholesale"
                                  ? "عمده‌فروشی"
                                  : partner.price_list_type === "partner"
                                    ? "همکار تجاری"
                                    : "تک‌فروشی"}
                              </span>
                            </div>
                            <div>
                              <span className="block text-[8px] text-slate-500 mb-1">
                                تخفیف سطری (ثابت)
                              </span>
                              <span className="text-emerald-400 font-bold">
                                {partner.line_discount_percent}٪
                              </span>
                            </div>
                            <div>
                              <span className="block text-[8px] text-slate-500 mb-1">
                                تخفیف حجمی مجاز
                              </span>
                              <span className="text-blue-400 font-bold">
                                {partner.volume_discount_percent}٪
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          ) : (
            /* --- Custom Partner Register Form --- */
            <div
              className={`border rounded-2xl p-5 md:p-7 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200/80 shadow-sm"} animate-fade-in`}
            >
              <div className="flex items-center justify-between border-b pb-4 mb-6 border-slate-200 dark:border-slate-800">
                <div className="text-right">
                  <h3 className="text-sm font-black flex items-center gap-1.5">
                    <Users className="w-5 h-5 text-blue-500" />
                    <span>ثبت مشخصات طرف حساب تجاری جدید</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1">
                    تخصیص سقف اعتبار خرید، گروه قیمتی مناسب و تخفیف‌های خودکار سطری کالا
                  </p>
                </div>
                <button
                  onClick={() => setIsCreatingPartner(false)}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-bold rounded-xl transition"
                >
                  انصراف و بازگشت
                </button>
              </div>

              {/* Form Input fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-[10px] font-bold text-slate-450 mb-1.5">
                    نوع شخص (حقیقی / حقوقی)
                  </label>
                  <select
                    value={newPartner.person_type || "REAL"}
                    onChange={(e) =>
                      setNewPartner((prev) => ({
                        ...prev,
                        person_type: e.target.value as "REAL" | "LEGAL",
                      }))
                    }
                    className={`w-full px-3 py-2 rounded-xl text-xs border focus:ring-1 focus:ring-blue-500 focus:outline-none ${
                      isDarkMode
                        ? "bg-slate-950 border-slate-850 text-white"
                        : "bg-white border-slate-200 text-slate-800"
                    }`}
                  >
                    <option value="REAL">شخص حقیقی</option>
                    <option value="LEGAL">شخص حقوقی (شرکت/سازمان)</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-450 mb-1.5">
                    نام کامل شخص حقیقی یا نام شرکت
                  </label>
                  <input
                    type="text"
                    value={newPartner.name || ""}
                    onChange={(e) =>
                      setNewPartner((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className={`w-full px-3 py-2 rounded-xl text-xs border focus:ring-1 focus:ring-blue-500 focus:outline-none ${
                      isDarkMode
                        ? "bg-slate-950 border-slate-850 text-white"
                        : "bg-white border-slate-200 text-slate-800"
                    }`}
                    placeholder="نام و نام خانوادگی / نام ثبتی شرکت..."
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-450 mb-1.5">
                    شماره ملی / شناسه ملی حقوقی
                  </label>
                  <input
                    type="text"
                    value={newPartner.national_id || ""}
                    onChange={(e) =>
                      setNewPartner((prev) => ({
                        ...prev,
                        national_id: e.target.value,
                      }))
                    }
                    className={`w-full px-3 py-2 rounded-xl text-xs border focus:ring-1 focus:ring-blue-500 focus:outline-none font-mono text-left ${
                      isDarkMode
                        ? "bg-slate-950 border-slate-850 text-white"
                        : "bg-white border-slate-200 text-slate-800"
                    }`}
                    placeholder="10 رقمی یا 11 رقمی..."
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-450 mb-1.5">
                    کد اقتصادی (اختیاری)
                  </label>
                  <input
                    type="text"
                    value={newPartner.economic_code || ""}
                    onChange={(e) =>
                      setNewPartner((prev) => ({
                        ...prev,
                        economic_code: e.target.value,
                      }))
                    }
                    className={`w-full px-3 py-2 rounded-xl text-xs border focus:ring-1 focus:ring-blue-500 focus:outline-none font-mono text-left ${
                      isDarkMode
                        ? "bg-slate-950 border-slate-850 text-white"
                        : "bg-white border-slate-200 text-slate-800"
                    }`}
                    placeholder="مثال: 4111..."
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-450 mb-1.5">
                    دسته‌بندی (نقش تجاری)
                  </label>
                  <select
                    value={newPartner.type || "customer"}
                    onChange={(e) =>
                      setNewPartner((prev) => ({
                        ...prev,
                        type: e.target.value as any,
                      }))
                    }
                    className={`w-full px-3 py-2 rounded-xl text-xs border focus:ring-1 focus:ring-blue-500 focus:outline-none ${
                      isDarkMode
                        ? "bg-slate-950 border-slate-850 text-white"
                        : "bg-white border-slate-200 text-slate-800"
                    }`}
                  >
                    <option value="customer">مشتری (خریدار محصولات شما)</option>
                    <option value="supplier">تامین‌کننده (فروشنده کالا به شما)</option>
                  </select>
                </div>

                <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 mb-1.5">
                      شماره موبایل
                    </label>
                    <input
                      type="text"
                      value={newPartner.mobile_number || ""}
                      onChange={(e) =>
                        setNewPartner((prev) => ({
                          ...prev,
                          mobile_number: e.target.value,
                        }))
                      }
                      className={`w-full px-3 py-2 rounded-xl text-xs border focus:ring-1 focus:ring-blue-500 focus:outline-none font-mono text-left ${
                        isDarkMode
                          ? "bg-slate-950 border-slate-850 text-white"
                          : "bg-white border-slate-200 text-slate-800"
                      }`}
                      placeholder="09..."
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 mb-1.5">
                      تلفن ثابت
                    </label>
                    <input
                      type="text"
                      value={newPartner.phone_number || ""}
                      onChange={(e) =>
                        setNewPartner((prev) => ({
                          ...prev,
                          phone_number: e.target.value,
                        }))
                      }
                      className={`w-full px-3 py-2 rounded-xl text-xs border focus:ring-1 focus:ring-blue-500 focus:outline-none font-mono text-left ${
                        isDarkMode
                          ? "bg-slate-950 border-slate-850 text-white"
                          : "bg-white border-slate-200 text-slate-800"
                      }`}
                      placeholder="021..."
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 mb-1.5">
                      استان
                    </label>
                    <input
                      type="text"
                      value={newPartner.province || ""}
                      onChange={(e) =>
                        setNewPartner((prev) => ({
                          ...prev,
                          province: e.target.value,
                        }))
                      }
                      className={`w-full px-3 py-2 rounded-xl text-xs border focus:ring-1 focus:ring-blue-500 focus:outline-none ${
                        isDarkMode
                          ? "bg-slate-950 border-slate-850 text-white"
                          : "bg-white border-slate-200 text-slate-800"
                      }`}
                      placeholder="مثال: تهران"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 mb-1.5">
                      شهر
                    </label>
                    <input
                      type="text"
                      value={newPartner.city || ""}
                      onChange={(e) =>
                        setNewPartner((prev) => ({
                          ...prev,
                          city: e.target.value,
                        }))
                      }
                      className={`w-full px-3 py-2 rounded-xl text-xs border focus:ring-1 focus:ring-blue-500 focus:outline-none ${
                        isDarkMode
                          ? "bg-slate-950 border-slate-850 text-white"
                          : "bg-white border-slate-200 text-slate-800"
                      }`}
                      placeholder="مثال: تهران"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-450 mb-1.5">
                      نشانی پستی دقیق
                    </label>
                    <textarea
                      value={newPartner.address || ""}
                      onChange={(e) =>
                        setNewPartner((prev) => ({
                          ...prev,
                          address: e.target.value,
                        }))
                      }
                      rows={2}
                      className={`w-full px-3 py-2 rounded-xl text-xs border focus:ring-1 focus:ring-blue-500 focus:outline-none ${
                        isDarkMode
                          ? "bg-slate-950 border-slate-850 text-white"
                          : "bg-white border-slate-200 text-slate-800"
                      }`}
                      placeholder="خیابان، کوچه، پلاک، واحد..."
                    />
                  </div>
                </div>

                <div className="md:col-span-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <h4 className="text-xs font-bold text-blue-500 mb-3">تنظیمات مالی و فروش</h4>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-450 mb-1.5">
                    سقف اعتبار مصوب (ریال)
                  </label>
                  <input
                    type="number"
                    value={newPartner.credit_limit || 0}
                    onChange={(e) =>
                      setNewPartner((prev) => ({
                        ...prev,
                        credit_limit: Number(e.target.value),
                      }))
                    }
                    className={`w-full px-3 py-2 rounded-xl text-xs border focus:ring-1 focus:ring-blue-500 focus:outline-none font-mono text-left ${
                      isDarkMode
                        ? "bg-slate-950 border-slate-850 text-white"
                        : "bg-white border-slate-200 text-slate-800"
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-450 mb-1.5">
                    لیست قیمت متصل پیش‌فرض
                  </label>
                  <select
                    value={newPartner.price_list_type || "consumer"}
                    onChange={(e) =>
                      setNewPartner((prev) => ({
                        ...prev,
                        price_list_type: e.target.value as any,
                      }))
                    }
                    className={`w-full px-3 py-2 rounded-xl text-xs border focus:ring-1 focus:ring-blue-500 focus:outline-none ${
                      isDarkMode
                        ? "bg-slate-950 border-slate-850 text-white"
                        : "bg-white border-slate-200 text-slate-800"
                    }`}
                  >
                    <option value="consumer">تک‌فروشی (مصرف‌کننده عمومی)</option>
                    <option value="partner">همکار (فروشگاه‌های همکار سخت‌افزاری)</option>
                    <option value="wholesale">عمده‌فروشی (سفارشات حجم بزرگ)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-450 mb-1.5">
                    تخفیف سطری ثابت (٪)
                  </label>
                  <input
                    type="number"
                    value={newPartner.line_discount_percent || 0}
                    onChange={(e) =>
                      setNewPartner((prev) => ({
                        ...prev,
                        line_discount_percent: Number(e.target.value),
                      }))
                    }
                    className={`w-full px-3 py-2 rounded-xl text-xs border focus:ring-1 focus:ring-blue-500 focus:outline-none font-mono text-left ${
                      isDarkMode
                        ? "bg-slate-950 border-slate-850 text-white"
                        : "bg-white border-slate-200 text-slate-800"
                    }`}
                    min={0}
                    max={100}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-450 mb-1.5">
                    تخفیف حجمی مجاز نهایی (٪)
                  </label>
                  <input
                    type="number"
                    value={newPartner.volume_discount_percent || 0}
                    onChange={(e) =>
                      setNewPartner((prev) => ({
                        ...prev,
                        volume_discount_percent: Number(e.target.value),
                      }))
                    }
                    className={`w-full px-3 py-2 rounded-xl text-xs border focus:ring-1 focus:ring-blue-500 focus:outline-none font-mono text-left ${
                      isDarkMode
                        ? "bg-slate-950 border-slate-850 text-white"
                        : "bg-white border-slate-200 text-slate-800"
                    }`}
                    min={0}
                    max={100}
                  />
                </div>
              </div>

              {/* Action save buttons */}
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => setIsCreatingPartner(false)}
                  className="px-4 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl font-bold transition text-slate-400 hover:text-slate-200"
                >
                  انصراف
                </button>
                <button
                  onClick={handleSavePartner}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-lg transition"
                >
                  ذخیره و تایید طرف حساب
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- Tab 3: Profit & Loss (سود و زیان کالا) Section --- */}
      {activeTab === "profit_loss" && (
        <div className="space-y-6 animate-fade-in">
          {/* Header & Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className={`text-lg font-black ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>گزارش جامع سود و زیان کالا</h2>
              <p className={`text-[11px] mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>تحلیل هوشمند و تفکیکی سودآوری کالاها، مشتریان و فاکتورها بر اساس سیستم بهای تمام شده خرید (COGS)</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowAddExpense(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition shadow-sm"
              >
                <span>➕ ثبت هزینه دستی</span>
              </button>
              <button
                onClick={() => {
                  setPlProductSearch("");
                  setPlFromDate("");
                  setPlToDate("");
                  setPlPartnerFilter("ALL");
                  setPlProductSort("profit");
                  setPlProductSortDirection("desc");
                  showNotification("فیلترهای گزارش سود و زیان بازنشانی شدند.", "info");
                }}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition ${
                  isDarkMode
                    ? "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                حذف فیلترها
              </button>
              <button
                onClick={handleExportPlCSV}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>خروجی اکسل (CSV)</span>
              </button>
            </div>
          </div>

          {/* Filters Dashboard Panel */}
          <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-950/40 border-slate-850' : 'bg-slate-50 border-slate-200 shadow-xs'} grid grid-cols-1 md:grid-cols-4 gap-4`}>
            {/* Search Product */}
            <div className="relative">
              <label className="block text-[9px] font-bold text-slate-400 mb-1">جستجوی کالا</label>
              <div className="relative">
                <Search className="absolute right-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={plProductSearch}
                  onChange={(e) => setPlProductSearch(e.target.value)}
                  placeholder="نام کالا را وارد کنید..."
                  className={`w-full pr-8 pl-3 py-1.5 rounded-lg text-xs border focus:ring-1 focus:ring-blue-500 focus:outline-none ${
                    isDarkMode
                      ? "bg-slate-900 border-slate-800 text-white placeholder-slate-500"
                      : "bg-white border-slate-200 text-slate-800 placeholder-slate-400"
                  }`}
                />
              </div>
            </div>

            {/* Filter by Partner */}
            <div>
              <label className="block text-[9px] font-bold text-slate-400 mb-1">فیلتر بر اساس مشتری</label>
              <select
                value={plPartnerFilter}
                onChange={(e) => setPlPartnerFilter(e.target.value)}
                className={`w-full px-3 py-1.5 rounded-lg text-xs border focus:ring-1 focus:ring-blue-500 focus:outline-none ${
                  isDarkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"
                }`}
              >
                <option value="ALL">همه مشتریان (بدون فیلتر)</option>
                {partners.filter(p => p.type === "customer").map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* From Date */}
            <div>
              <label className="block text-[9px] font-bold text-slate-400 mb-1">از تاریخ فاکتور</label>
              <div className="relative">
                <Calendar className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={plFromDate}
                  onChange={(e) => setPlFromDate(e.target.value)}
                  placeholder="مثال: 1405/01/01"
                  className={`w-full px-3 py-1.5 rounded-lg text-xs border focus:ring-1 focus:ring-blue-500 focus:outline-none font-mono text-left ${
                    isDarkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"
                  }`}
                />
              </div>
            </div>

            {/* To Date */}
            <div>
              <label className="block text-[9px] font-bold text-slate-400 mb-1">تا تاریخ فاکتور</label>
              <div className="relative">
                <Calendar className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={plToDate}
                  onChange={(e) => setPlToDate(e.target.value)}
                  placeholder="مثال: 1405/12/29"
                  className={`w-full px-3 py-1.5 rounded-lg text-xs border focus:ring-1 focus:ring-blue-500 focus:outline-none font-mono text-left ${
                    isDarkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"
                  }`}
                />
              </div>
            </div>
          </div>

          {/* KPI Dashboard Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div
              className={`p-5 rounded-2xl border ${isDarkMode ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="block text-[10px] font-bold text-slate-500 uppercase">
                  کل درآمد ناخالص (فروش)
                </span>
                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                </div>
              </div>
              <span className={`block text-xl font-black font-mono mt-1 ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                {profitLossReport.totalRevenue.toLocaleString("fa-IR")} <span className="text-xs font-sans text-slate-400">ریال</span>
              </span>
            </div>

            <div
              className={`p-5 rounded-2xl border ${isDarkMode ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="block text-[10px] font-bold text-slate-500 uppercase">
                  بهای تمام شده فروش (COGS)
                </span>
                <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center">
                  <Calculator className="w-4 h-4 text-rose-500" />
                </div>
              </div>
              <span className={`block text-xl font-black font-mono mt-1 ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                {profitLossReport.totalCogs.toLocaleString("fa-IR")} <span className="text-xs font-sans text-slate-400">ریال</span>
              </span>
            </div>

            <div
              className={`p-5 rounded-2xl border ${isDarkMode ? "bg-amber-900/20 border-amber-800" : "bg-amber-50 border-amber-200 shadow-sm"}`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="block text-[10px] font-bold text-amber-600 uppercase">
                  جمع هزینه‌های دستی
                </span>
                <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <Calculator className="w-4 h-4 text-amber-500" />
                </div>
              </div>
              <span className={`block text-xl font-black font-mono mt-1 text-amber-600`}>
                {profitLossReport.totalManualExpenses.toLocaleString("fa-IR")} <span className="text-xs font-sans opacity-70">ریال</span>
              </span>
            </div>

            <div
              className={`p-5 rounded-2xl border relative overflow-hidden ${isDarkMode ? "bg-gradient-to-br from-emerald-900/20 to-slate-900 border-emerald-900/50" : "bg-gradient-to-br from-emerald-50 to-white border-emerald-100 shadow-sm"}`}
            >
              <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl"></div>
              <div className="flex items-center justify-between mb-3 relative z-10">
                <span className="block text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                  سود خالص
                </span>
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <span className="text-emerald-600 dark:text-emerald-400 text-xs font-black">P</span>
                </div>
              </div>
              <span className="block text-xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1 relative z-10">
                {profitLossReport.netProfit.toLocaleString("fa-IR")} <span className="text-xs font-sans opacity-70">ریال</span>
              </span>
            </div>

            <div
              className={`p-5 rounded-2xl border relative overflow-hidden ${isDarkMode ? "bg-gradient-to-br from-purple-900/20 to-slate-900 border-purple-900/50" : "bg-gradient-to-br from-purple-50 to-white border-purple-100 shadow-sm"}`}
            >
              <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-purple-500/10 rounded-full blur-xl"></div>
              <div className="flex items-center justify-between mb-3 relative z-10">
                <span className="block text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase">
                  حاشیه سود میانگین
                </span>
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Percent className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <span className="block text-xl font-black font-mono text-purple-600 dark:text-purple-400 mt-1 relative z-10">
                {profitLossReport.avgMarginPercent.toFixed(1)}٪
              </span>
            </div>
          </div>

          {/* Loss-making products warning alert */}
          {(() => {
            const lossMakingItems = profitLossReport.itemsProfitList.filter(item => item.profit < 0);
            if (lossMakingItems.length === 0) return null;
            return (
              <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-500 flex items-start gap-3 text-xs animate-fade-in">
                <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold">هشدار بهای تمام شده و عدم سودآوری کالاها!</h4>
                  <p className="mt-1 leading-relaxed opacity-90">
                    تعداد <strong className="font-mono">{lossMakingItems.length}</strong> کالا به دلیل پیشی گرفتن بهای خرید (COGS) از قیمت فروش، با سود ناخالص منفی به فروش رسیده‌اند:
                    {" "}
                    {lossMakingItems.map((item, idx) => (
                      <span key={item.id} className="inline-block bg-rose-500/10 px-2 py-0.5 rounded-md mx-1 font-sans font-bold">
                        {item.name} ({Math.abs(item.profit).toLocaleString("fa-IR")} ریال زیان)
                      </span>
                    ))}
                    . لطفاً قیمت فروش این کالاها یا مبالغ خرید اولیه ثبت شده در سیستم انبار را اصلاح نمایید.
                  </p>
                </div>
              </div>
            );
          })()}

          {/* Golden Products & Visual Analysis Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* KPI Card 1: Top Profit Maker */}
            <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-slate-900/30 border-slate-800' : 'bg-white border-slate-200 shadow-xs'} flex items-center gap-3`}>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0 text-xl font-black">👑</div>
              <div className="min-w-0 flex-1">
                <span className="block text-[9px] font-bold text-slate-500">پر سودترین محصول دوره</span>
                <span className={`block text-xs font-bold truncate mt-0.5 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                  {profitLossReport.topProductByProfit ? profitLossReport.topProductByProfit.name : "ثبت نشده"}
                </span>
                <span className="block text-[11px] font-mono text-emerald-500 font-bold mt-0.5">
                  {profitLossReport.topProductByProfit ? `+ ${profitLossReport.topProductByProfit.profit.toLocaleString("fa-IR")} ریال` : "۰"}
                </span>
              </div>
            </div>

            {/* KPI Card 2: Highest Margin Product */}
            <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-slate-900/30 border-slate-800' : 'bg-white border-slate-200 shadow-xs'} flex items-center gap-3`}>
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-[9px] font-bold text-slate-500">بالاترین درصد حاشیه سود</span>
                <span className={`block text-xs font-bold truncate mt-0.5 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                  {profitLossReport.topProductByMargin ? profitLossReport.topProductByMargin.name : "ثبت نشده"}
                </span>
                <span className="block text-[11px] font-mono text-purple-500 font-bold mt-0.5">
                  {profitLossReport.topProductByMargin ? `${profitLossReport.topProductByMargin.margin.toFixed(1)}٪ سود خالص` : "۰٪"}
                </span>
              </div>
            </div>

            {/* KPI Card 3: Most sold Product (Volume) */}
            <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-slate-900/30 border-slate-800' : 'bg-white border-slate-200 shadow-xs'} flex items-center gap-3`}>
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-[9px] font-bold text-slate-500">پرفروش‌ترین کالا (از نظر حجم/تعداد)</span>
                <span className={`block text-xs font-bold truncate mt-0.5 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                  {profitLossReport.topProductByVolume ? profitLossReport.topProductByVolume.name : "ثبت نشده"}
                </span>
                <span className="block text-[11px] font-mono text-blue-500 font-bold mt-0.5">
                  {profitLossReport.topProductByVolume ? `${profitLossReport.topProductByVolume.qtySold.toLocaleString("fa-IR")} عدد فروخته شده` : "۰ عدد"}
                </span>
              </div>
            </div>
          </div>

          {/* Visual Charts Block */}
          {profitLossReport.itemsProfitList.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
              {/* Chart 1: Bar Chart of Top 5 Items */}
              <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                <h3 className={`text-xs font-black mb-4 flex items-center gap-2 ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                  <BarChart3 className="w-4 h-4 text-blue-500" />
                  <span>نمودار مقایسه‌ای درآمد و سود ناخالص ۵ محصول برتر</span>
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={profitLossReport.itemsProfitList.slice(0, 5).map(item => ({
                        name: item.name.length > 15 ? item.name.slice(0, 15) + '...' : item.name,
                        'درآمد (ریال)': item.revenue,
                        'سود (ریال)': item.profit,
                      }))}
                      margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#1e293b" : "#f1f5f9"} />
                      <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 9 }} />
                      <YAxis stroke="#94a3b8" tick={{ fontSize: 9 }} />
                      <ChartTooltip
                        contentStyle={{
                          backgroundColor: isDarkMode ? "#020617" : "#ffffff",
                          borderColor: isDarkMode ? "#1e293b" : "#e2e8f0",
                          color: isDarkMode ? "#f8fafc" : "#0f172a",
                          borderRadius: "12px",
                          fontSize: "11px",
                          direction: "rtl"
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: "10px" }} />
                      <Bar dataKey="درآمد (ریال)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="سود (ریال)" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: Pie Chart of Profit Share */}
              <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                <h3 className={`text-xs font-black mb-4 flex items-center gap-2 ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                  <Percent className="w-4 h-4 text-emerald-500" />
                  <span>نمای سهم سود ناخالص هر محصول از سود کل (تکه‌های فعال)</span>
                </h3>
                <div className="h-64 flex flex-col sm:flex-row items-center justify-center gap-4">
                  <div className="w-full sm:w-1/2 h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={profitLossReport.itemsProfitList.filter(i => i.profit > 0).slice(0, 5).map(item => ({
                            name: item.name,
                            value: item.profit,
                          }))}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {profitLossReport.itemsProfitList.filter(i => i.profit > 0).slice(0, 5).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={["#10B981", "#3B82F6", "#8B5CF6", "#F59E0B", "#EF4444", "#EC4899"][index % 6]} />
                          ))}
                        </Pie>
                        <ChartTooltip
                          formatter={(value: any) => `${Number(value).toLocaleString("fa-IR")} ریال`}
                          contentStyle={{
                            backgroundColor: isDarkMode ? "#020617" : "#ffffff",
                            borderColor: isDarkMode ? "#1e293b" : "#e2e8f0",
                            borderRadius: "12px",
                            fontSize: "11px",
                            direction: "rtl"
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-full sm:w-1/2 flex flex-col gap-1.5 text-[10px] text-right">
                    {profitLossReport.itemsProfitList.filter(i => i.profit > 0).slice(0, 5).map((item, idx) => {
                      const sharePercent = profitLossReport.netProfit > 0 ? (item.profit / profitLossReport.netProfit) * 100 : 0;
                      return (
                        <div key={item.id} className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: ["#10B981", "#3B82F6", "#8B5CF6", "#F59E0B", "#EF4444", "#EC4899"][idx % 6] }}></span>
                            <span className={`truncate font-sans font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{item.name}</span>
                          </div>
                          <span className="font-mono font-bold text-slate-400 shrink-0">{sharePercent.toFixed(1)}٪</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Details & Invoices Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Profit per item (Detailed Table) */}
            <div
              className={`lg:col-span-2 border rounded-2xl p-5 ${isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200/80 shadow-sm"}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h3 className="text-sm font-black flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-500">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <span className={isDarkMode ? "text-slate-100" : "text-slate-800"}>تحلیل سودآوری به تفکیک کالاها</span>
                </h3>
                <div className="text-[10px] text-slate-500 flex items-center gap-1 bg-slate-150 dark:bg-slate-900 px-3 py-1 rounded-lg">
                  <span>ترتیب فعلی:</span>
                  <span className="font-bold text-blue-500">
                    {plProductSort === "profit" ? "سود ناخالص" :
                     plProductSort === "revenue" ? "درآمد خالص" :
                     plProductSort === "margin" ? "حاشیه سود" : "تعداد فروش"}
                  </span>
                  <span>({plProductSortDirection === "desc" ? "نزولی" : "صعودی"})</span>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-right border-collapse text-[11px]">
                  <thead>
                    <tr className={`border-b ${isDarkMode ? 'bg-slate-950/60 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'} font-bold`}>
                      <th className="py-3 px-4 text-right border-l border-slate-200 dark:border-slate-800">نام کالا</th>
                      
                      <th 
                        onClick={() => {
                          if (plProductSort === "qtySold") {
                            setPlProductSortDirection(d => d === "asc" ? "desc" : "asc");
                          } else {
                            setPlProductSort("qtySold");
                            setPlProductSortDirection("desc");
                          }
                        }}
                        className="py-3 px-4 text-center border-l border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-blue-500/10 transition"
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span>تعداد فروش</span>
                          <ArrowUpDown className="w-3 h-3 opacity-60" />
                        </div>
                      </th>

                      <th 
                        onClick={() => {
                          if (plProductSort === "revenue") {
                            setPlProductSortDirection(d => d === "asc" ? "desc" : "asc");
                          } else {
                            setPlProductSort("revenue");
                            setPlProductSortDirection("desc");
                          }
                        }}
                        className="py-3 px-4 text-left border-l border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-blue-500/10 transition"
                      >
                        <div className="flex items-center justify-start gap-1">
                          <span>درآمد خالص</span>
                          <ArrowUpDown className="w-3 h-3 opacity-60" />
                        </div>
                      </th>

                      <th className="py-3 px-4 text-left border-l border-slate-200 dark:border-slate-800">بهای تمام شده</th>
                      
                      <th 
                        onClick={() => {
                          if (plProductSort === "profit") {
                            setPlProductSortDirection(d => d === "asc" ? "desc" : "asc");
                          } else {
                            setPlProductSort("profit");
                            setPlProductSortDirection("desc");
                          }
                        }}
                        className="py-3 px-4 text-left border-l border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-blue-500/10 transition"
                      >
                        <div className="flex items-center justify-start gap-1">
                          <span>سود ناخالص</span>
                          <ArrowUpDown className="w-3 h-3 opacity-60" />
                        </div>
                      </th>

                      <th 
                        onClick={() => {
                          if (plProductSort === "margin") {
                            setPlProductSortDirection(d => d === "asc" ? "desc" : "asc");
                          } else {
                            setPlProductSort("margin");
                            setPlProductSortDirection("desc");
                          }
                        }}
                        className="py-3 px-4 text-center cursor-pointer hover:bg-blue-500/10 transition"
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span>حاشیه سود</span>
                          <ArrowUpDown className="w-3 h-3 opacity-60" />
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800/60' : 'divide-slate-200'} font-mono`}>
                    {profitLossReport.itemsProfitList.map((item, idx) => (
                      <tr key={item.id} className={`transition ${isDarkMode ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50'}`}>
                        <td className="py-3 px-4 font-sans font-bold border-l border-slate-200/50 dark:border-slate-800/50">
                          <div className={`flex items-center gap-2 ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                            <span className="w-5 h-5 rounded flex items-center justify-center text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono">{idx + 1}</span>
                            {item.name}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center border-l border-slate-200/50 dark:border-slate-800/50">
                          <span className={isDarkMode ? 'text-slate-300' : 'text-slate-600'}>{item.qtySold}</span>
                        </td>
                        <td className="py-3 px-4 text-left border-l border-slate-200/50 dark:border-slate-800/50">
                          <span className={isDarkMode ? 'text-slate-300' : 'text-slate-600'}>{item.revenue.toLocaleString("fa-IR")}</span>
                        </td>
                        <td className="py-3 px-4 text-left border-l border-slate-200/50 dark:border-slate-800/50">
                          <span className="text-rose-500/80">{item.cogs.toLocaleString("fa-IR")}</span>
                        </td>
                        <td className="py-3 px-4 text-left border-l border-slate-200/50 dark:border-slate-800/50 font-bold">
                          <span className={item.profit >= 0 ? "text-emerald-500" : "text-rose-500"}>
                            {item.profit.toLocaleString("fa-IR")}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              item.margin > 30 ? 'bg-emerald-500/10 text-emerald-500' : 
                              item.margin > 15 ? 'bg-blue-500/10 text-blue-500' : 
                              item.margin >= 0 ? 'bg-amber-500/10 text-amber-500' : 'bg-rose-500/10 text-rose-500'
                            }`}>
                              {item.margin.toFixed(1)}٪
                            </span>
                            <div className="w-12 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden shrink-0 hidden sm:block">
                              <div 
                                className={`h-full rounded-full ${
                                  item.margin > 30 ? 'bg-emerald-500' : 
                                  item.margin > 15 ? 'bg-blue-500' : 
                                  item.margin >= 0 ? 'bg-amber-500' : 'bg-rose-500'
                                }`}
                                style={{ width: `${Math.max(5, Math.min(100, Math.abs(item.margin)))}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {profitLossReport.itemsProfitList.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-12 text-center italic text-slate-500 font-sans text-xs">
                          هیچ تراکنش فروش موثری برای نمایش با فیلترهای فعلی وجود ندارد.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right: Profit per Invoice */}
            <div
              className={`border rounded-2xl p-5 flex flex-col ${isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200/80 shadow-sm"}`}
            >
              <h3 className="text-sm font-black mb-6 flex items-center gap-2 text-slate-100">
                <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-500">
                  <Calculator className="w-4 h-4" />
                </div>
                <span className={isDarkMode ? "text-slate-100" : "text-slate-800"}>سودآوری فاکتورهای فروش</span>
              </h3>

              <div className="flex-1 overflow-y-auto pr-1 space-y-3 max-h-[500px]">
                {profitLossReport.invoiceProfits.map((ip, idx) => (
                  <div key={idx} className={`p-3 rounded-xl border ${isDarkMode ? 'bg-slate-900 border-slate-800 hover:bg-slate-800/50' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'} transition cursor-pointer`}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className={`font-mono font-bold text-xs ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{ip.invoiceNo}</div>
                        <div className={`text-[10px] mt-0.5 truncate w-32 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{ip.partnerName}</div>
                      </div>
                      <div className={`px-2 py-1 rounded text-[10px] font-mono font-bold ${
                        ip.margin > 25 ? 'bg-emerald-500/10 text-emerald-500' : 
                        ip.margin > 15 ? 'bg-blue-500/10 text-blue-500' : 
                        ip.margin >= 0 ? 'bg-amber-500/10 text-amber-500' : 'bg-rose-500/10 text-rose-500'
                      }`}>
                        {ip.margin.toFixed(1)}٪
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-200 dark:border-slate-800/60 font-mono text-[10px]">
                      <div>
                        <div className="text-slate-400 mb-0.5">درآمد ناخالص</div>
                        <div className={isDarkMode ? 'text-slate-300' : 'text-slate-700'}>{ip.revenue.toLocaleString("fa-IR")}</div>
                      </div>
                      <div className="text-left">
                        <div className="text-slate-400 mb-0.5">سود فاکتور</div>
                        <div className={`font-bold ${ip.profit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {ip.profit.toLocaleString("fa-IR")}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {profitLossReport.invoiceProfits.length === 0 && (
                  <div className="text-center italic text-slate-500 font-sans text-xs py-8">
                    هیچ فاکتور فعالی یافت نشد.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Manual Expenses Section */}
          <div className="mt-6 border rounded-2xl p-5 flex flex-col bg-amber-50 dark:bg-amber-950/10 border-amber-200 dark:border-amber-900/50">
            <h3 className="text-sm font-black mb-6 flex items-center justify-between gap-2 text-amber-700 dark:text-amber-500">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-500">
                  <Calculator className="w-4 h-4" />
                </div>
                <span>ریز هزینه‌های دستی ثبت شده</span>
              </div>
              <span className="text-xs opacity-70">
                مبلغ کل: {profitLossReport.totalManualExpenses.toLocaleString("fa-IR")} ریال
              </span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse text-[11px]">
                <thead>
                  <tr className="border-b bg-amber-500/5 border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-600 font-bold">
                    <th className="py-2.5 px-4">تاریخ</th>
                    <th className="py-2.5 px-4">مبلغ (ریال)</th>
                    <th className="py-2.5 px-4">شرح هزینه</th>
                    <th className="py-2.5 px-4 text-left">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {profitLossReport.filteredExpenses.map((expense) => (
                    <tr key={expense.id} className="border-b border-amber-100 dark:border-amber-900/30 hover:bg-amber-500/5 transition">
                      <td className="py-2.5 px-4 font-mono text-slate-600 dark:text-slate-400">{expense.date}</td>
                      <td className="py-2.5 px-4 font-mono font-bold text-amber-600">{expense.amount.toLocaleString("fa-IR")}</td>
                      <td className="py-2.5 px-4 text-slate-700 dark:text-slate-300">{expense.description}</td>
                      <td className="py-2.5 px-4 text-left">
                        <button
                          onClick={() => {
                            if (window.confirm("آیا از حذف این هزینه اطمینان دارید؟")) {
                              engine.deleteManualExpense(expense.id);
                              setManualExpenses([...engine.getManualExpenses()]);
                            }
                          }}
                          className="text-rose-500 hover:text-rose-600 font-bold px-2 py-1 bg-rose-500/10 rounded"
                        >
                          حذف
                        </button>
                      </td>
                    </tr>
                  ))}
                  {profitLossReport.filteredExpenses.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center italic text-amber-600/50">
                        هیچ هزینه‌ای یافت نشد.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Mini Help Footer */}
      <div
        className={`mt-10 p-5 rounded-2xl border ${
          isDarkMode
            ? "bg-slate-950/20 border-slate-900"
            : "bg-slate-50 border-slate-100"
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 animate-pulse shrink-0"></div>
          <div className="text-right">
            <h4
              className={`text-xs font-bold mb-1.5 ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}
            >
              توضیح برای کاربر گرامی:
            </h4>
            <p
              className={`text-[11px] leading-relaxed ${isDarkMode ? "text-slate-500" : "text-slate-500"}`}
            >
              چرخه بازرگانی شما با سه ستون صدور فاکتور (پیش‌فاکتور، فاکتور فروش،
              خرید، و مرجوعی‌ها)، مدیریت مشتریان/تامین‌کنندگان (سقف اعتبار،
              قیمت‌های چندگانه همکار/عمده و تخفیف‌ها)، و گزارش سود و زیان دقیق
              کالا آماده شد. طبق دستور شما، در گام‌های بعدی هر کدام را که مایل
              باشید توسعه بیشتری خواهیم داد.
            </p>
          </div>
        </div>
      </div>

      {/* --- Invoice Preview & Print Modal --- */}
      {viewingInvoice && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
          <div className={`w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[90vh] ${isDarkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-slate-200'}`}>
            
            {/* Sidebar Controls */}
            <div className={`p-6 md:w-64 shrink-0 flex flex-col justify-between border-l ${isDarkMode ? 'bg-slate-950/20 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
              <div className="space-y-6">
                <div>
                  <h4 className={`text-xs font-black ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>صورتحساب رسمی استاندارد</h4>
                  <p className="text-[10px] text-slate-400 mt-1">پیش‌نمایش سند مالیاتی رسمی منطبق بر استانداردهای سازمان امور مالیاتی کشور</p>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => {
                      const partner = partners.find((p) => p.id === viewingInvoice.client_id);
                      const partnerName = partner ? partner.name : "ناشناس";
                      const nationalId = partner?.national_id || "---";
                      const economicCode = partner?.economic_code || "---";
                      const phone = partner?.phone_number || partner?.mobile_number || "---";
                      const address = `${partner?.province || ""} ${partner?.city || ""} ${partner?.address || ""}`.trim() || "---";

                      const itemsHtml = viewingInvoice.lines.map((l, index) => {
                        const prod = products.find((p) => p.id === l.product_id);
                        const prodName = prod ? prod.name : "کالای حذف شده";
                        const prodCode = prod ? prod.code : "---";
                        return `
                          <tr style="text-align: center; font-size: 11px;">
                            <td style="border: 1px solid #000; padding: 6px;">${index + 1}</td>
                            <td style="border: 1px solid #000; padding: 6px; font-family: monospace;">${prodCode}</td>
                            <td style="border: 1px solid #000; padding: 6px; text-align: right;">${prodName}</td>
                            <td style="border: 1px solid #000; padding: 6px;">${l.quantity.toLocaleString('fa-IR')}</td>
                            <td style="border: 1px solid #000; padding: 6px;">دستگاه</td>
                            <td style="border: 1px solid #000; padding: 6px; font-family: monospace; text-align: left;">${l.unit_price.toLocaleString('fa-IR')} ریال</td>
                            <td style="border: 1px solid #000; padding: 6px; font-family: monospace; text-align: left;">${l.gross_amount.toLocaleString('fa-IR')} ریال</td>
                            <td style="border: 1px solid #000; padding: 6px; font-family: monospace; text-align: left;">${l.discount_amount.toLocaleString('fa-IR')} ریال</td>
                            <td style="border: 1px solid #000; padding: 6px; font-family: monospace; text-align: left;">${(l.gross_amount - l.discount_amount).toLocaleString('fa-IR')} ریال</td>
                            <td style="border: 1px solid #000; padding: 6px; font-family: monospace; text-align: left;">${l.vat_amount.toLocaleString('fa-IR')} ریال</td>
                            <td style="border: 1px solid #000; padding: 6px; font-family: monospace; text-align: left;">${l.net_amount.toLocaleString('fa-IR')} ریال</td>
                          </tr>
                        `;
                      }).join("");

                      const totalWords = numToWordsFa(viewingInvoice.total_net_amount);

                      const printWindow = window.open("", "_blank");
                      if (printWindow) {
                        printWindow.document.write(`
                          <html dir="rtl">
                            <head>
                              <title>فاکتور رسمی - ${viewingInvoice.invoice_number}</title>
                              <style>
                                @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;700;900&display=swap');
                                body {
                                  font-family: 'Vazirmatn', sans-serif;
                                  padding: 20px;
                                  color: #000;
                                  background-color: #fff;
                                }
                                .invoice-table {
                                  width: 100%;
                                  border-collapse: collapse;
                                  margin-top: 15px;
                                }
                                .invoice-table th, .invoice-table td {
                                  border: 1px solid #000;
                                  padding: 8px;
                                }
                                .header-table {
                                  width: 100%;
                                  border: 1px solid #000;
                                  margin-bottom: 10px;
                                }
                                .header-table td {
                                  padding: 8px;
                                  vertical-align: top;
                                }
                                @media print {
                                  body { padding: 0; margin: 0; }
                                }
                              </style>
                            </head>
                            <body onload="window.print()">
                              <!-- Invoice Header -->
                              <table class="header-table" style="border-bottom: none;">
                                <tr>
                                  <td style="width: 33%; text-align: right;">
                                    <p style="margin: 0; font-size: 11px;"><strong>نام فروشنده:</strong> شرکت بازرگانی نوین توسعه (سهامی خاص)</p>
                                    <p style="margin: 4px 0 0 0; font-size: 11px;"><strong>شناسه ملی:</strong> ۱۰۱۰۰۴۵۶۷۸۹</p>
                                    <p style="margin: 4px 0 0 0; font-size: 11px;"><strong>کد اقتصادی:</strong> ۴۱۱۱۲۲۲۳۳۳۴۴</p>
                                  </td>
                                  <td style="width: 34%; text-align: center;">
                                    <h2 style="margin: 0; font-size: 15px; font-weight: 900;">صورتحساب فروش کالا و خدمات</h2>
                                    <p style="margin: 5px 0 0 0; font-size: 9px; color: #555;">(موضوع ماده ۱۹ قانون مالیات بر ارزش افزوده)</p>
                                  </td>
                                  <td style="width: 33%; text-align: left; font-size: 11px;">
                                    <p style="margin: 0;"><strong>شماره فاکتور:</strong> ${viewingInvoice.invoice_number}</p>
                                    <p style="margin: 4px 0 0 0;"><strong>تاریخ فاکتور:</strong> ${viewingInvoice.invoice_date}</p>
                                    <p style="margin: 4px 0 0 0;"><strong>وضعیت سند:</strong> ${viewingInvoice.status === "FINALIZED" ? 'تایید نهایی' : 'پیش‌نویس'}</p>
                                  </td>
                                </tr>
                              </table>

                              <!-- Buyer Info -->
                              <table class="header-table">
                                <tr style="background-color: #f5f5f5;">
                                  <td colspan="3" style="font-weight: bold; font-size: 11px; border-bottom: 1px solid #000; padding: 6px;">مشخصات خریدار</td>
                                </tr>
                                <tr>
                                  <td style="width: 33%; font-size: 11px;">
                                    <p style="margin: 0;"><strong>نام شخص / شرکت:</strong> ${partnerName}</p>
                                    <p style="margin: 4px 0 0 0;"><strong>شناسه/کد ملی:</strong> ${nationalId}</p>
                                  </td>
                                  <td style="width: 33%; font-size: 11px;">
                                    <p style="margin: 0;"><strong>کد اقتصادی:</strong> ${economicCode}</p>
                                    <p style="margin: 4px 0 0 0;"><strong>تلفن:</strong> ${phone}</p>
                                  </td>
                                  <td style="width: 33%; font-size: 11px;">
                                    <p style="margin: 0;"><strong>نشانی کامل:</strong> ${address}</p>
                                  </td>
                                </tr>
                              </table>

                              <!-- Items Table -->
                              <table class="invoice-table">
                                <thead>
                                  <tr style="background-color: #f5f5f5; font-size: 11px; font-weight: bold;">
                                    <th style="width: 4%;">ردیف</th>
                                    <th style="width: 10%;">کد کالا</th>
                                    <th style="width: 25%;">نام و مشخصات کالا</th>
                                    <th style="width: 8%;">تعداد</th>
                                    <th style="width: 6%;">واحد</th>
                                    <th style="width: 11%;">مبلغ واحد (ریال)</th>
                                    <th style="width: 11%;">جمع ناخالص</th>
                                    <th style="width: 8%;">تخفیف</th>
                                    <th style="width: 11%;">مبلغ مشمول مالیات</th>
                                    <th style="width: 8%;">مالیات (۱۰٪)</th>
                                    <th style="width: 12%;">جمع کل (ریال)</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  ${itemsHtml}
                                  <tr style="font-size: 11px; font-weight: bold; background-color: #fafafa;">
                                    <td colspan="6" style="text-align: left; padding: 8px;">جمع کل محاسبات فاکتور:</td>
                                    <td style="text-align: left;">${viewingInvoice.total_gross_amount.toLocaleString('fa-IR')}</td>
                                    <td style="text-align: left;">${(viewingInvoice.total_discount_line + viewingInvoice.total_discount_header).toLocaleString('fa-IR')}</td>
                                    <td style="text-align: left;">${(viewingInvoice.total_gross_amount - viewingInvoice.total_discount_line - viewingInvoice.total_discount_header).toLocaleString('fa-IR')}</td>
                                    <td style="text-align: left;">${viewingInvoice.total_vat_amount.toLocaleString('fa-IR')}</td>
                                    <td style="text-align: left; background-color: #eee;">${viewingInvoice.total_net_amount.toLocaleString('fa-IR')}</td>
                                  </tr>
                                </tbody>
                              </table>

                              <!-- Price in Words & Stamp -->
                              <table style="width: 100%; border: 1px solid #000; border-top: none; font-size: 11px;">
                                <tr>
                                  <td style="padding: 10px; width: 60%; vertical-align: middle;">
                                    <strong>مبلغ کل به حروف:</strong> ${totalWords} ریال
                                  </td>
                                  <td style="padding: 10px; width: 40%; text-align: left; border-right: 1px solid #000; vertical-align: top;">
                                    <strong>شرایط تسویه:</strong> نقدی / حواله سیستمی
                                  </td>
                                </tr>
                              </table>

                              <table style="width: 100%; border: 1px solid #000; border-top: none; font-size: 11px; height: 120px;">
                                <tr>
                                  <td style="width: 50%; text-align: center; vertical-align: top; padding-top: 10px;">
                                    <p style="margin: 0;"><strong>مهر و امضای فروشنده</strong></p>
                                    <div style="margin-top: 50px; font-size: 9px; color: #777;">(شرکت بازرگانی نوین توسعه)</div>
                                  </td>
                                  <td style="width: 50%; text-align: center; border-right: 1px solid #000; vertical-align: top; padding-top: 10px;">
                                    <p style="margin: 0;"><strong>مهر و امضای خریدار</strong></p>
                                    <div style="margin-top: 50px; font-size: 9px; color: #777;">(تایید دریافت کامل خدمات و کالا)</div>
                                  </td>
                                </tr>
                              </table>
                            </body>
                          </html>
                        `);
                        printWindow.document.close();
                      }
                    }}
                    className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-md"
                  >
                    <Printer className="w-4 h-4" />
                    <span>چاپ و صدور رسمی (A4)</span>
                  </button>

                  <button
                    onClick={() => {
                      showNotification("لینک دانلود PDF فاکتور با موفقیت ایجاد شد.", "success");
                    }}
                    className={`w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition border ${
                      isDarkMode
                        ? "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span>دانلود فایل PDF</span>
                  </button>

                  {viewingInvoice.invoice_type === InvoiceType.PROFORMA && (
                    <button
                      onClick={() => handleConvertProformaToSale(viewingInvoice)}
                      className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-md animate-pulse"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>تبدیل به فاکتور فروش قطعی</span>
                    </button>
                  )}
                </div>
              </div>

              <button
                onClick={() => setViewingInvoice(null)}
                className={`w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition ${
                  isDarkMode
                    ? "bg-slate-800 hover:bg-slate-700 text-slate-200"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-800"
                }`}
              >
                <X className="w-4 h-4" />
                <span>بستن پیش‌نمایش</span>
              </button>
            </div>

            {/* A4 Paper View Panel */}
            <div className={`flex-1 p-8 overflow-y-auto ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'}`}>
              <div className={`mx-auto w-full max-w-3xl p-8 border rounded shadow-lg text-[11px] font-sans ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'}`} style={{ minHeight: '11in' }}>
                
                {/* A4 Header */}
                <div className="grid grid-cols-3 items-center border-b pb-4 mb-4">
                  <div className="space-y-1">
                    <p><strong>فروشنده:</strong> شرکت بازرگانی نوین توسعه</p>
                    <p><strong>شناسه ملی:</strong> ۱۰۱۰۰۴۵۶۷۸۹</p>
                    <p><strong>کد اقتصادی:</strong> ۴۱۱۱۲۲۲۳۳۳۴۴</p>
                  </div>
                  <div className="text-center">
                    <h3 className="text-sm font-black uppercase">صورتحساب فروش کالا و خدمات</h3>
                    <p className="text-[9px] text-slate-400 mt-1">موضوع ماده ۱۹ قانون ارزش افزوده</p>
                  </div>
                  <div className="text-left space-y-1">
                    <p><strong>شماره:</strong> {viewingInvoice.invoice_number}</p>
                    <p><strong>تاریخ:</strong> {viewingInvoice.invoice_date}</p>
                    <p><strong>نوع سند:</strong> {
                      viewingInvoice.invoice_type === InvoiceType.SALE ? "فاکتور فروش" :
                      viewingInvoice.invoice_type === InvoiceType.PURCHASE ? "فاکتور خرید" :
                      viewingInvoice.invoice_type === InvoiceType.PROFORMA ? "پیش‌فاکتور" :
                      viewingInvoice.invoice_type === InvoiceType.SALE_RETURN ? "مرجوعی فروش" : "مرجوعی خرید"
                    }</p>
                  </div>
                </div>

                {/* Buyer block */}
                {(() => {
                  const partner = partners.find((p) => p.id === viewingInvoice.client_id);
                  const partnerName = partner ? partner.name : "ناشناس";
                  const nationalId = partner?.national_id || "---";
                  const economicCode = partner?.economic_code || "---";
                  const phone = partner?.phone_number || partner?.mobile_number || "---";
                  const address = `${partner?.province || ""} ${partner?.city || ""} ${partner?.address || ""}`.trim() || "---";

                  return (
                    <div className={`p-3 rounded-xl border mb-4 grid grid-cols-3 gap-4 ${isDarkMode ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="space-y-1">
                        <p><strong>خریدار:</strong> {partnerName}</p>
                        <p><strong>شناسه/کد ملی:</strong> {nationalId}</p>
                      </div>
                      <div className="space-y-1">
                        <p><strong>کد اقتصادی:</strong> {economicCode}</p>
                        <p><strong>تلفن تماس:</strong> {phone}</p>
                      </div>
                      <div className="space-y-1">
                        <p><strong>نشانی کامل:</strong> {address}</p>
                      </div>
                    </div>
                  );
                })()}

                {/* Items Table */}
                <div className="overflow-x-auto border rounded mb-4">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className={`border-b font-bold text-[10px] ${isDarkMode ? 'bg-slate-950/60 border-slate-850' : 'bg-slate-50 border-slate-200'}`}>
                        <th className="p-2 border-l border-slate-200 text-center">ردیف</th>
                        <th className="p-2 border-l border-slate-200">کالا</th>
                        <th className="p-2 border-l border-slate-200 text-center">تعداد</th>
                        <th className="p-2 border-l border-slate-200 text-left">قیمت واحد</th>
                        <th className="p-2 border-l border-slate-200 text-left">جمع ناخالص</th>
                        <th className="p-2 border-l border-slate-200 text-left">تخفیف</th>
                        <th className="p-2 border-l border-slate-200 text-left">مالیات (۱۰٪)</th>
                        <th className="p-2 text-left">مجموع نهایی</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/60 font-mono">
                      {viewingInvoice.lines.map((line, idx) => {
                        const prod = products.find((p) => p.id === line.product_id);
                        return (
                          <tr key={idx} className="hover:bg-slate-800/10">
                            <td className="p-2 border-l border-slate-200/40 text-center">{idx + 1}</td>
                            <td className="p-2 border-l border-slate-200/40 font-sans font-bold">{prod ? prod.name : "کالای حذف شده"}</td>
                            <td className="p-2 border-l border-slate-200/40 text-center">{line.quantity}</td>
                            <td className="p-2 border-l border-slate-200/40 text-left">{formatRial(line.unit_price)}</td>
                            <td className="p-2 border-l border-slate-200/40 text-left">{formatRial(line.gross_amount)}</td>
                            <td className="p-2 border-l border-slate-200/40 text-left">{formatRial(line.discount_amount)}</td>
                            <td className="p-2 border-l border-slate-200/40 text-left">{formatRial(line.vat_amount)}</td>
                            <td className="p-2 text-left font-bold text-blue-500">{formatRial(line.net_amount)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Totals Summary */}
                <div className={`p-4 rounded-xl border mb-6 space-y-2 ${isDarkMode ? 'bg-slate-950/20 border-slate-850' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-450">جمع کل ناخالص کالاها:</span>
                    <span className="font-mono font-bold">{formatRial(viewingInvoice.total_gross_amount)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-450">مجموع تخفیف‌های ردیف و هدر فاکتور:</span>
                    <span className="font-mono text-rose-500 font-bold">({formatRial(viewingInvoice.total_discount_line + viewingInvoice.total_discount_header)})</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-450">مجموع مالیات و عوارض ارزش افزوده (۱۰٪):</span>
                    <span className="font-mono text-amber-500 font-bold">{formatRial(viewingInvoice.total_vat_amount)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-black border-t pt-2 mt-2">
                    <span className="text-blue-500">جمع کل خالص قابل پرداخت (ریال):</span>
                    <span className="font-mono text-blue-500 text-base">{formatRial(viewingInvoice.total_net_amount)}</span>
                  </div>
                  <div className="pt-2 text-[10px] text-slate-400">
                    <strong>مبلغ کل به حروف:</strong> {numToWordsFa(viewingInvoice.total_net_amount)} ریال
                  </div>
                </div>

                {/* Signature section */}
                <div className="grid grid-cols-2 gap-4 h-24 text-center mt-8">
                  <div className="border border-dashed rounded-xl p-3 flex flex-col justify-between">
                    <span className="font-black">مهر و امضای فروشنده</span>
                    <span className="text-[9px] text-slate-400">(شرکت بازرگانی نوین توسعه)</span>
                  </div>
                  <div className="border border-dashed rounded-xl p-3 flex flex-col justify-between">
                    <span className="font-black">مهر و امضای خریدار</span>
                    <span className="text-[9px] text-slate-400">(تایید دریافت کامل اقلام فوق)</span>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
