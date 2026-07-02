import React, { useState, useEffect, useMemo } from "react";
import {
  Boxes,
  ArrowRightLeft,
  FileText,
  Search,
  Settings,
  ClipboardList,
  Filter,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  Calculator,
  CheckCircle2,
  Trash,
  Receipt,
  Calendar,
  User,
  Coins,
  FileSpreadsheet,
  TrendingUp,
  TrendingDown,
  Download,
  BookOpen,
  Tag,
  ChevronDown,
  Package,
  BarChart2,
  Printer,
  Eye,
  Grid,
  List
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line
} from "recharts";
import {
  inventoryEngine,
  WarehouseDocType,
  PricingMethod,
  Warehouse,
  ProductItem,
  WarehouseDocument,
  InventoryLedgerEntry,
  StocktakeTag,
  DocStatus,
  ReferenceType,
  StocktakePeriodStatus,
  StocktakeItemStatus,
  StocktakePeriod,
  StocktakeItem,
  StocktakeAdjustment
} from "../lib/inventory-engine";

interface InventoryModuleProps {
  isDarkMode: boolean;
  showNotification: (msg: string, type: "success" | "error" | "info") => void;
}

const InventoryModule: React.FC<InventoryModuleProps> = ({ isDarkMode, showNotification }) => {
  const [activeTab, setActiveTab] = useState<"kardex" | "docs" | "stocktake" | "settings">("kardex");
  
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [documents, setDocuments] = useState<WarehouseDocument[]>([]);
  const [ledger, setLedger] = useState<InventoryLedgerEntry[]>([]);
  const [tags, setTags] = useState<StocktakeTag[]>([]);
  const [pricingMethod, setPricingMethod] = useState<PricingMethod>(PricingMethod.AVERAGE);

  // New stocktaking states
  const [stocktakePeriods, setStocktakePeriods] = useState<StocktakePeriod[]>([]);
  const [activePeriodId, setActivePeriodId] = useState<string>("");
  const [stocktakeItems, setStocktakeItems] = useState<StocktakeItem[]>([]);
  const [stocktakeAdjustments, setStocktakeAdjustments] = useState<StocktakeAdjustment[]>([]);

  const loadData = () => {
    setWarehouses([...inventoryEngine.getWarehouses()]);
    setProducts([...inventoryEngine.getProducts()]);
    setDocuments([...inventoryEngine.getDocuments()]);
    setLedger([...inventoryEngine.getLedger()]);
    setTags([...inventoryEngine.getTags()]);
    setPricingMethod(inventoryEngine.getPricingMethod());
    setStocktakePeriods([...inventoryEngine.getStocktakePeriods()]);
  };

  useEffect(() => {
    if (activePeriodId) {
      setStocktakeItems([...inventoryEngine.getStocktakeItems(activePeriodId)]);
      setStocktakeAdjustments([...inventoryEngine.getStocktakeAdjustments(activePeriodId)]);
    } else {
      setStocktakeItems([]);
      setStocktakeAdjustments([]);
    }
  }, [activePeriodId, documents]);

  useEffect(() => {
    loadData();
  }, []);

  // --- Kardex State ---
  const [kardexWarehouse, setKardexWarehouse] = useState<string>("");
  const [kardexProduct, setKardexProduct] = useState<string>("");
  const [kardexStartDate, setKardexStartDate] = useState<string>("");
  const [kardexEndDate, setKardexEndDate] = useState<string>("");
  const [kardexDocType, setKardexDocType] = useState<string>("ALL");
  const [kardexSearchQuery, setKardexSearchQuery] = useState<string>("");

  const kardexData = useMemo(() => {
    if (!kardexProduct) {
      return {
        beginningBalance: { qty: 0, value: 0 },
        inflow: { qty: 0, value: 0 },
        outflow: { qty: 0, value: 0 },
        endingBalance: { qty: 0, value: 0 },
        rows: [],
        chartData: []
      };
    }

    // Sort by date display and ID to ensure proper chronological sequence
    const productLedger = [...ledger]
      .filter(l => 
        l.product_id === kardexProduct && 
        (kardexWarehouse ? l.warehouse_id === kardexWarehouse : true)
      )
      .sort((a, b) => a.date.localeCompare(b.date));

    // Calculate beginning balance (entries strictly before kardexStartDate)
    let begQty = 0;
    let begValue = 0;

    const beforePeriod = productLedger.filter(l => kardexStartDate ? l.date < kardexStartDate : false);
    if (beforePeriod.length > 0) {
      const lastBefore = beforePeriod[beforePeriod.length - 1];
      begQty = lastBefore.balance_qty;
      begValue = lastBefore.balance_value;
    }

    // Filter during period entries
    const duringPeriod = productLedger.filter(l => {
      const matchStart = kardexStartDate ? l.date >= kardexStartDate : true;
      const matchEnd = kardexEndDate ? l.date <= kardexEndDate : true;
      const matchType = kardexDocType !== "ALL" ? l.type === kardexDocType : true;
      
      let matchSearch = true;
      if (kardexSearchQuery) {
        const query = kardexSearchQuery.toLowerCase();
        matchSearch = l.doc_number.toLowerCase().includes(query);
      }
      return matchStart && matchEnd && matchType && matchSearch;
    });

    // Calculate totals during this period
    let totalInQty = 0;
    let totalInValue = 0;
    let totalOutQty = 0;
    let totalOutValue = 0;

    duringPeriod.forEach(l => {
      totalInQty += l.qty_in || 0;
      totalInValue += (l.qty_in || 0) * l.unit_price;
      totalOutQty += l.qty_out || 0;
      totalOutValue += (l.qty_out || 0) * l.unit_price;
    });

    // Determine ending balance
    const lastEntryDuring = duringPeriod[duringPeriod.length - 1];
    const endQty = lastEntryDuring ? lastEntryDuring.balance_qty : begQty;
    const endValue = lastEntryDuring ? lastEntryDuring.balance_value : begValue;

    // Generate table rows
    const rows: any[] = [];
    if (kardexStartDate) {
      rows.push({
        isVirtual: true,
        date: kardexStartDate,
        doc_number: "-",
        description: "موجودی ابتدای دوره (انتقالی)",
        warehouse_id: kardexWarehouse || "all",
        product_id: kardexProduct,
        qty_in: 0,
        qty_out: 0,
        unit_price: begQty > 0 ? Math.round(begValue / begQty) : 0,
        balance_qty: begQty,
        balance_value: begValue,
        type: null
      });
    }

    duringPeriod.forEach(l => {
      rows.push({
        ...l,
        isVirtual: false
      });
    });

    // Generate chart data for trends
    const chartData = productLedger.map((l, index) => ({
      index: index + 1,
      date: l.date,
      "موجودی (تعداد)": l.balance_qty,
      "بهای تمام شده کل (ریال)": l.balance_value,
      "بهای واحد (ریال)": l.unit_price
    }));

    // Dynamic Valuation Simulator for Sandbox comparison
    const simulateValuation = (method: PricingMethod) => {
      const txs = [...inventoryEngine.getTransactions()]
        .filter(t => 
          t.product_id === kardexProduct && 
          (kardexWarehouse ? t.warehouse_id === kardexWarehouse : true)
        )
        .sort((a, b) => a.transaction_date - b.transaction_date);

      const product = products.find(p => p.id === kardexProduct);
      const standardPrice = product?.standard_price || 100000;

      let running_qty = 0;
      let running_total_value = 0;
      let total_cogs = 0;
      const batches: Array<{ qty: number; cost: number }> = [];

      txs.forEach(tx => {
        if (tx.qty_in > 0) {
          running_qty += tx.qty_in;
          const cost_in = tx.unit_cost_in || standardPrice;
          
          if (method === PricingMethod.STANDARD) {
            running_total_value = running_qty * standardPrice;
          } else {
            batches.push({ qty: tx.qty_in, cost: cost_in });
            running_total_value += tx.qty_in * cost_in;
          }
        } else if (tx.qty_out > 0) {
          const qty_out = tx.qty_out;
          running_qty -= qty_out;

          if (method === PricingMethod.STANDARD) {
            total_cogs += qty_out * standardPrice;
            running_total_value = running_qty * standardPrice;
          } else if (method === PricingMethod.AVERAGE) {
            const prevQty = running_qty + qty_out;
            const avgCost = prevQty > 0 ? (running_total_value / prevQty) : 0;
            const val_out = qty_out * avgCost;
            total_cogs += val_out;
            running_total_value -= val_out;
          } else if (method === PricingMethod.FIFO) {
            let qty_to_consume = qty_out;
            let val_out = 0;
            const batchCopies = batches.map(b => ({ ...b }));
            
            while (qty_to_consume > 0 && batchCopies.length > 0) {
              const current_batch = batchCopies[0];
              if (current_batch.qty <= qty_to_consume) {
                val_out += current_batch.qty * current_batch.cost;
                qty_to_consume -= current_batch.qty;
                batchCopies.shift();
              } else {
                val_out += qty_to_consume * current_batch.cost;
                current_batch.qty -= qty_to_consume;
                qty_to_consume = 0;
              }
            }
            if (qty_to_consume > 0) {
              val_out += qty_to_consume * standardPrice;
            }
            total_cogs += val_out;
            batches.length = 0;
            batches.push(...batchCopies);
            running_total_value = batches.reduce((sum, b) => sum + b.qty * b.cost, 0);
          } else if (method === PricingMethod.LIFO) {
            let qty_to_consume = qty_out;
            let val_out = 0;
            const batchCopies = batches.map(b => ({ ...b }));
            
            while (qty_to_consume > 0 && batchCopies.length > 0) {
              const current_batch = batchCopies[batchCopies.length - 1];
              if (current_batch.qty <= qty_to_consume) {
                val_out += current_batch.qty * current_batch.cost;
                qty_to_consume -= current_batch.qty;
                batchCopies.pop();
              } else {
                val_out += qty_to_consume * current_batch.cost;
                current_batch.qty -= qty_to_consume;
                qty_to_consume = 0;
              }
            }
            if (qty_to_consume > 0) {
              val_out += qty_to_consume * standardPrice;
            }
            total_cogs += val_out;
            batches.length = 0;
            batches.push(...batchCopies);
            running_total_value = batches.reduce((sum, b) => sum + b.qty * b.cost, 0);
          }
        }

        if (running_qty <= 0) {
          running_total_value = 0;
        }
      });

      return {
        endingQty: running_qty,
        endingValue: Math.round(running_total_value),
        cogs: Math.round(total_cogs)
      };
    };

    const simResults = {
      [PricingMethod.AVERAGE]: simulateValuation(PricingMethod.AVERAGE),
      [PricingMethod.FIFO]: simulateValuation(PricingMethod.FIFO),
      [PricingMethod.LIFO]: simulateValuation(PricingMethod.LIFO),
      [PricingMethod.STANDARD]: simulateValuation(PricingMethod.STANDARD)
    };

    // Calculate accounting metrics
    const averageInventoryQty = (begQty + endQty) / 2 || 1;
    const turnoverRate = totalOutQty / averageInventoryQty;
    const isLowStock = endQty < 15;
    const averageUnitCost = endQty > 0 ? Math.round(endValue / endQty) : 0;

    return {
      beginningBalance: { qty: begQty, value: begValue },
      inflow: { qty: totalInQty, value: totalInValue },
      outflow: { qty: totalOutQty, value: totalOutValue },
      endingBalance: { qty: endQty, value: endValue },
      rows,
      chartData,
      averageUnitCost,
      turnoverRate,
      isLowStock,
      pricingSimulation: simResults
    };
  }, [ledger, kardexProduct, kardexWarehouse, kardexStartDate, kardexEndDate, kardexDocType, kardexSearchQuery, products]);

  const exportKardexToCSV = () => {
    if (!kardexProduct) return;
    const prod = products.find(p => p.id === kardexProduct);
    const wh = warehouses.find(w => w.id === kardexWarehouse);
    const prodName = prod ? prod.name : "";
    const whName = wh ? wh.name : "همه انبارها";

    let csvContent = "\ufeff"; // BOM for UTF-8 support in Excel
    csvContent += `گزارش تفصیلی کاردکس کالا - ${prodName} - انبار: ${whName}\n`;
    csvContent += "ردیف,تاریخ,شماره سند,نوع تراکنش,وارده (تعداد),وارده (فی),وارده (ارزش),صادره (تعداد),صادره (فی),صادره (ارزش),مانده (تعداد),مانده (ارزش)\n";

    kardexData.rows.forEach((row, idx) => {
      const typeStr = row.isVirtual ? "شروع دوره" : (
        row.type === WarehouseDocType.RECEIPT ? "رسید انبار" :
        row.type === WarehouseDocType.REMITTANCE ? "حواله انبار" :
        row.type === WarehouseDocType.TRANSFER ? "انتقال بین انبارها" : "تعدیل انبارگردانی"
      );
      
      const qtyIn = row.qty_in || 0;
      const valIn = qtyIn * row.unit_price;
      const qtyOut = row.qty_out || 0;
      const valOut = qtyOut * row.unit_price;

      csvContent += `${idx + 1},${row.date},${row.doc_number},${typeStr},${qtyIn},${qtyIn > 0 ? row.unit_price : 0},${valIn},${qtyOut},${qtyOut > 0 ? row.unit_price : 0},${valOut},${row.balance_qty},${row.balance_value}\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Kardex_${prod?.code || "Product"}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification("فایل کاردکس با موفقیت صادر گردید.", "success");
  };

  const handleInspectKardexRow = (row: any) => {
    if (row.isVirtual) return;
    const doc = documents.find(d => d.doc_number === row.doc_number);
    if (doc) {
      setSelectedKardexRow({
        row,
        doc
      });
    } else {
      showNotification("سند اصلی فیزیکی این تراکنش یافت نشد.", "warning");
    }
  };

  // --- Docs State ---
  const [showAddDoc, setShowAddDoc] = useState(false);
  const [docNumber, setDocNumber] = useState("");
  const [docType, setDocType] = useState<WarehouseDocType>(WarehouseDocType.RECEIPT);
  const [referenceType, setReferenceType] = useState<ReferenceType>(ReferenceType.NONE);
  const [referenceId, setReferenceId] = useState("");
  const [sourceWarehouseId, setSourceWarehouseId] = useState("");
  const [destinationWarehouseId, setDestinationWarehouseId] = useState("");
  const [docDate, setDocDate] = useState("");
  const [docDescription, setDocDescription] = useState("");
  const [docLines, setDocLines] = useState<Array<{ product_id: string; quantity: number; unit_cost: number }>>([]);

  // --- Documents Search and Filter States ---
  const [docSearchQuery, setDocSearchQuery] = useState("");
  const [docFilterType, setDocFilterType] = useState<string>("ALL");
  const [docFilterStatus, setDocFilterStatus] = useState<string>("ALL");
  const [docFilterWarehouse, setDocFilterWarehouse] = useState<string>("ALL");
  const [docFilterStartDate, setDocFilterStartDate] = useState("");
  const [docFilterEndDate, setDocFilterEndDate] = useState("");
  const [docViewMode, setDocViewMode] = useState<"grid" | "table">("table");
  const [selectedDocDetails, setSelectedDocDetails] = useState<WarehouseDocument | null>(null);

  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const query = docSearchQuery.toLowerCase();
      const matchSearch = !docSearchQuery || 
        doc.doc_number.toLowerCase().includes(query) ||
        (doc.description && doc.description.toLowerCase().includes(query)) ||
        (doc.created_by && doc.created_by.toLowerCase().includes(query)) ||
        (doc.internal_serial && String(doc.internal_serial).includes(query));

      const matchType = docFilterType === "ALL" || doc.doc_type === docFilterType;
      const matchStatus = docFilterStatus === "ALL" || doc.status === docFilterStatus;
      
      const matchWarehouse = docFilterWarehouse === "ALL" || 
        doc.source_warehouse_id === docFilterWarehouse || 
        doc.destination_warehouse_id === docFilterWarehouse;

      const matchStartDate = !docFilterStartDate || doc.date >= docFilterStartDate;
      const matchEndDate = !docFilterEndDate || doc.date <= docFilterEndDate;

      return matchSearch && matchType && matchStatus && matchWarehouse && matchStartDate && matchEndDate;
    });
  }, [documents, docSearchQuery, docFilterType, docFilterStatus, docFilterWarehouse, docFilterStartDate, docFilterEndDate]);

  const docsStats = useMemo(() => {
    const totalCount = documents.length;
    const draftsCount = documents.filter(d => d.status === DocStatus.DRAFT).length;
    const confirmedCount = documents.filter(d => d.status === DocStatus.CONFIRMED).length;
    const accountedCount = documents.filter(d => d.status === DocStatus.ACCOUNTED).length;

    let totalReceiptsValue = 0;
    let totalRemittancesValue = 0;

    documents.forEach(doc => {
      if (doc.status !== DocStatus.DRAFT) {
        const val = doc.lines.reduce((sum, line) => sum + (line.total_cost || (line.quantity * line.unit_cost)), 0);
        if (doc.doc_type === WarehouseDocType.RECEIPT) {
          totalReceiptsValue += val;
        } else if (doc.doc_type === WarehouseDocType.REMITTANCE || doc.doc_type === WarehouseDocType.ISSUE) {
          totalRemittancesValue += val;
        }
      }
    });

    return {
      totalCount,
      draftsCount,
      confirmedCount,
      accountedCount,
      totalReceiptsValue,
      totalRemittancesValue
    };
  }, [documents]);

  // --- View Voucher Modal State ---
  const [selectedVoucherDoc, setSelectedVoucherDoc] = useState<WarehouseDocument | null>(null);
  const [voucherHeader, setVoucherHeader] = useState<any | null>(null);
  const [voucherLines, setVoucherLines] = useState<any[]>([]);
  const [selectedKardexRow, setSelectedKardexRow] = useState<any | null>(null);

  const handleOpenAddDoc = () => {
    setDocNumber("INV-" + (documents.length + 1001));
    setDocType(WarehouseDocType.RECEIPT);
    setReferenceType(ReferenceType.NONE);
    setReferenceId("");
    setSourceWarehouseId("");
    setDestinationWarehouseId("");
    setDocDate(new Date().toLocaleDateString("fa-IR"));
    setDocDescription("");
    
    const defaultProductId = products[0]?.id || "";
    const defaultProductPrice = products[0]?.standard_price || 1000000;
    setDocLines([{ product_id: defaultProductId, quantity: 10, unit_cost: defaultProductPrice }]);
    
    setShowAddDoc(true);
  };

  const handleAddLine = () => {
    const defaultProductId = products[0]?.id || "";
    const defaultProductPrice = products[0]?.standard_price || 1000000;
    setDocLines([...docLines, { product_id: defaultProductId, quantity: 10, unit_cost: defaultProductPrice }]);
  };

  const handleRemoveLine = (idx: number) => {
    const updated = [...docLines];
    updated.splice(idx, 1);
    setDocLines(updated);
  };

  const handleLineChange = (idx: number, field: string, value: any) => {
    const updated = [...docLines];
    updated[idx] = { ...updated[idx], [field]: value };
    if (field === "product_id") {
      const prod = products.find(p => p.id === value);
      if (prod) {
        updated[idx].unit_cost = prod.standard_price || 1000000;
      }
    }
    setDocLines(updated);
  };

  const handleSaveDoc = () => {
    if (!docNumber) {
      showNotification("لطفا شماره سند را وارد کنید.", "error");
      return;
    }
    if (docLines.length === 0) {
      showNotification("حداقل یک ردیف در سند باید ثبت شده باشد.", "error");
      return;
    }
    if (docType === WarehouseDocType.RECEIPT && !destinationWarehouseId) {
      showNotification("لطفا انبار مقصد را انتخاب کنید.", "error");
      return;
    }
    if ((docType === WarehouseDocType.REMITTANCE || docType === WarehouseDocType.ISSUE) && !sourceWarehouseId) {
      showNotification("لطفا انبار مبدا را انتخاب کنید.", "error");
      return;
    }
    if (docType === WarehouseDocType.TRANSFER && (!sourceWarehouseId || !destinationWarehouseId)) {
      showNotification("لطفا انبار مبدا و مقصد را انتخاب کنید.", "error");
      return;
    }
    if (docType === WarehouseDocType.TRANSFER && sourceWarehouseId === destinationWarehouseId) {
      showNotification("انبار مبدا و مقصد نمی‌توانند یکسان باشند.", "error");
      return;
    }

    try {
      inventoryEngine.addDocument({
        doc_number: docNumber,
        doc_type: docType,
        reference_type: referenceType,
        reference_id: referenceId || null,
        source_warehouse_id: sourceWarehouseId || null,
        destination_warehouse_id: destinationWarehouseId || null,
        date: docDate,
        doc_date: docDate,
        status: DocStatus.DRAFT,
        description: docDescription,
        lines: docLines.map(l => ({
          product_id: l.product_id,
          qty: l.quantity,
          quantity: l.quantity,
          unit_price: l.unit_cost,
          unit_cost: l.unit_cost,
          total_price: l.quantity * l.unit_cost,
          total_cost: l.quantity * l.unit_cost
        }))
      });

      showNotification("سند جدید به صورت پیش‌نویس ذخیره شد.", "success");
      setShowAddDoc(false);
      loadData();
    } catch (e: any) {
      showNotification(e.message || "خطا در ثبت سند انبار", "error");
    }
  };

  const handleConfirmDoc = (docId: string) => {
    try {
      inventoryEngine.confirm_warehouse_document(docId);
      showNotification("سند انبار تایید و در کاردکس ثبت گردید.", "success");
      loadData();
    } catch (e: any) {
      showNotification(e.message || "خطا در تایید سند انبار", "error");
    }
  };

  const handleDeleteDoc = (docId: string) => {
    try {
      inventoryEngine.deleteDocument(docId);
      showNotification("سند پیش‌نویس با موفقیت حذف شد.", "success");
      loadData();
    } catch (e: any) {
      showNotification(e.message || "خطا در حذف سند", "error");
    }
  };

  const handleGenerateAccountingVoucher = (docId: string) => {
    try {
      const res = inventoryEngine.create_journal_voucher_from_doc(docId);
      showNotification(`سند حسابداری شماره ${res.voucherHeader.voucher_number} صادر شد.`, "success");
      loadData();
    } catch (e: any) {
      showNotification(e.message || "خطا در صدور سند مالی", "error");
    }
  };

  const handleViewVoucher = (doc: WarehouseDocument) => {
    try {
      const savedV = localStorage.getItem("vouchers_data");
      const savedL = localStorage.getItem("voucher_lines_data");
      if (savedV && savedL) {
        const headers = JSON.parse(savedV);
        const lines = JSON.parse(savedL);
        const header = headers.find((h: any) => h.reference_number === doc.doc_number);
        if (header) {
          const matchingLines = lines.filter((l: any) => l.voucher_id === header.id);
          const accountsSaved = localStorage.getItem("chart_of_accounts");
          const accountsList = accountsSaved ? JSON.parse(accountsSaved) : [];
          const linesWithAccountNames = matchingLines.map((l: any) => {
            const acc = accountsList.find((a: any) => a.id === l.account_id);
            return {
              ...l,
              account_name: acc ? acc.name : l.account_id,
              account_code: acc ? acc.code : ""
            };
          });
          setSelectedVoucherDoc(doc);
          setVoucherHeader(header);
          setVoucherLines(linesWithAccountNames);
        } else {
          showNotification("سند حسابداری یافت نشد.", "error");
        }
      }
    } catch (e) {
      console.error(e);
      showNotification("خطا در بارگذاری سند مالی", "error");
    }
  };
  
  // --- New Stocktake State & Handlers ---
  const [newPeriodTitle, setNewPeriodTitle] = useState("");
  const [newPeriodWarehouseId, setNewPeriodWarehouseId] = useState("");
  const [newPeriodStartDate, setNewPeriodStartDate] = useState(new Date().toLocaleDateString("fa-IR"));
  const [newPeriodEndDate, setNewPeriodEndDate] = useState(new Date().toLocaleDateString("fa-IR"));
  const [countStageInput, setCountStageInput] = useState<1 | 2 | 3>(1);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const [marketCosts, setMarketCosts] = useState<Record<string, number>>({});
  const [selectedStocktakePrint, setSelectedStocktakePrint] = useState<{ period: StocktakePeriod, type: 'blind_sheet' | 'standard_sheet' | 'minutes' } | null>(null);

  const handleAutoFillCountsWithSnapshot = () => {
    const filled: Record<string, number> = {};
    stocktakeItems.forEach(item => {
      let isEditable = false;
      if (countStageInput === 1) isEditable = true;
      if (countStageInput === 2 && item.status === StocktakeItemStatus.NEEDS_SECOND_COUNT) isEditable = true;
      if (countStageInput === 3 && item.status === StocktakeItemStatus.NEEDS_THIRD_COUNT) isEditable = true;

      if (isEditable) {
        filled[item.product_id] = item.system_snapshot_qty;
      }
    });
    setProductCounts(prev => ({ ...prev, ...filled }));
    showNotification("مقادیر شمارش فعال با موجودی دفتری سیستم شبیه‌سازی شدند.", "info");
  };

  const handleApplyPricingMethod = (method: PricingMethod) => {
    inventoryEngine.setPricingMethod(method);
    loadData();
    showNotification("روش قیمت‌گذاری با موفقیت تغییر کرد و کاردکس‌ها بروزرسانی شدند.", "success");
  };

  const handleCreatePeriod = () => {
    if (!newPeriodTitle || !newPeriodWarehouseId) {
      showNotification("لطفاً عنوان دوره و انبار را انتخاب کنید.", "error");
      return;
    }
    try {
      const p = inventoryEngine.create_stocktake_period(
        newPeriodTitle,
        newPeriodWarehouseId,
        newPeriodStartDate,
        newPeriodEndDate
      );
      showNotification(`دوره انبارگردانی «${p.title}» با موفقیت ایجاد شد.`, "success");
      setNewPeriodTitle("");
      setNewPeriodWarehouseId("");
      loadData();
      setActivePeriodId(p.id);
    } catch (e: any) {
      showNotification(e.message || "خطا در ایجاد دوره", "error");
    }
  };

  const handleDeletePeriod = (id: string) => {
    try {
      inventoryEngine.delete_stocktake_period(id);
      showNotification("دوره انبارگردانی با موفقیت حذف شد.", "success");
      if (activePeriodId === id) {
        setActivePeriodId("");
      }
      loadData();
    } catch (e: any) {
      showNotification(e.message || "خطا در حذف دوره", "error");
    }
  };

  const handleCreateSnapshot = (id: string) => {
    try {
      inventoryEngine.create_stocktake_snapshot(id);
      showNotification("موجودی دفتری انبار با موفقیت قفل گردید و شمارش فیزیکی آغاز شد.", "success");
      loadData();
      // Force trigger state reload for items
      setStocktakeItems([...inventoryEngine.getStocktakeItems(id)]);
    } catch (e: any) {
      showNotification(e.message || "خطا در ثبت موجودی دفتری", "error");
    }
  };

  const handleSetCountValue = (productId: string, val: string) => {
    setProductCounts(prev => ({
      ...prev,
      [productId]: Number(val)
    }));
  };

  const handleSetMarketCostValue = (productId: string, val: string) => {
    setMarketCosts(prev => ({
      ...prev,
      [productId]: Number(val)
    }));
  };

  const handleSubmitCounts = (stage: 1 | 2 | 3) => {
    if (!activePeriodId) return;
    const items_data = products.map(p => ({
      product_id: p.id,
      count_qty: productCounts[p.id] !== undefined ? productCounts[p.id] : 0
    }));

    try {
      inventoryEngine.submit_count_layer(activePeriodId, stage, items_data);
      showNotification(`اطلاعات شمارش مرحله ${stage} با موفقیت در سیستم ثبت گردید.`, "success");
      setProductCounts({});
      loadData();
      setStocktakeItems([...inventoryEngine.getStocktakeItems(activePeriodId)]);
    } catch (e: any) {
      showNotification(e.message || "خطا در ثبت شمارش", "error");
    }
  };

  const handleFinalizePeriod = () => {
    if (!activePeriodId) return;
    try {
      inventoryEngine.finalize_stocktake(activePeriodId, marketCosts);
      showNotification("دوره انبارگردانی با موفقیت نهایی شد. اسناد مغایرت و ردیف‌های مالی صادر شدند.", "success");
      loadData();
      setStocktakeItems([...inventoryEngine.getStocktakeItems(activePeriodId)]);
    } catch (e: any) {
      showNotification(e.message || "خطا در نهایی‌سازی انبارگردانی", "error");
    }
  };

  return (
    <div className={`flex flex-col h-full animate-fade-in ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`} dir="rtl">
      {/* Header Tabs */}
      <div className={`flex items-center gap-1 p-2 shrink-0 border-b overflow-x-auto custom-scrollbar ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <button
          onClick={() => setActiveTab("kardex")}
          className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all ${activeTab === 'kardex' ? (isDarkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-50 text-indigo-600') : (isDarkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100')}`}
        >
          <FileText className="w-4 h-4" /> کاردکس کالا
        </button>
        <button
          onClick={() => setActiveTab("docs")}
          className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all ${activeTab === 'docs' ? (isDarkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-50 text-indigo-600') : (isDarkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100')}`}
        >
          <ArrowRightLeft className="w-4 h-4" /> اسناد انبار
        </button>
        <button
          onClick={() => setActiveTab("stocktake")}
          className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all ${activeTab === 'stocktake' ? (isDarkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-50 text-indigo-600') : (isDarkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100')}`}
        >
          <ClipboardList className="w-4 h-4" /> انبارگردانی
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all mr-auto ${activeTab === 'settings' ? (isDarkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-50 text-indigo-600') : (isDarkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100')}`}
        >
          <Settings className="w-4 h-4" /> تنظیمات قیمت‌گذاری
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 flex flex-col max-w-6xl mx-auto w-full">
        
        {/* Kardex Tab */}
        {activeTab === "kardex" && (
          <div className="space-y-6 animate-fade-in text-right" dir="rtl">
            
            {/* Header Controls & Product Selector */}
            <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="font-black text-sm text-indigo-500 flex items-center gap-2">
                    <BarChart2 className="w-5 h-5" /> گزارش کاردکس تفصیلی کالا
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-1">
                    مشاهده گردش مقداری و ریالی موجودی کالاها به روش ارزیابی <span className="font-bold text-indigo-600 dark:text-indigo-400">{pricingMethod === PricingMethod.AVERAGE ? "میانگین موزون متحرک" : pricingMethod === PricingMethod.FIFO ? "اولین صادره از اولین وارده (FIFO)" : pricingMethod === PricingMethod.LIFO ? "LIFO" : "قیمت استاندارد"}</span>
                  </p>
                </div>
                
                {kardexProduct && (
                  <button
                    onClick={exportKardexToCSV}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" /> خروجی فایل اکسل (CSV)
                  </button>
                )}
              </div>

              {/* Filtering Controls */}
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">کالای هدف</label>
                  <select 
                    value={kardexProduct} 
                    onChange={e => setKardexProduct(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl text-xs border font-bold outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}
                  >
                    <option value="">لطفاً کالا را انتخاب کنید...</option>
                    {products.map(p => {
                      const totalStock = ledger
                        .filter(l => l.product_id === p.id)
                        .reduce((acc, curr) => curr.balance_qty, 0); // Last balance represents current stock
                      return (
                        <option key={p.id} value={p.id}>
                          {p.code} - {p.name} ({p.unit}) - موجودی: {totalStock.toLocaleString()}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">انبار</label>
                  <select 
                    value={kardexWarehouse} 
                    onChange={e => setKardexWarehouse(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}
                  >
                    <option value="">همه انبارها</option>
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">نوع تراکنش</label>
                  <select 
                    value={kardexDocType} 
                    onChange={e => setKardexDocType(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}
                  >
                    <option value="ALL">همه رویدادها</option>
                    <option value={WarehouseDocType.RECEIPT}>رسیدها (ورود)</option>
                    <option value={WarehouseDocType.REMITTANCE}>حواله‌ها (خروج)</option>
                    <option value={WarehouseDocType.TRANSFER}>انتقال‌ها</option>
                    <option value={WarehouseDocType.ADJUSTMENT}>تعدیلات انبارگردانی</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">از تاریخ (Shamsi)</label>
                  <input 
                    type="text" 
                    placeholder="مثال: 1403/01/01"
                    value={kardexStartDate}
                    onChange={e => setKardexStartDate(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl text-xs border font-mono outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">تا تاریخ (Shamsi)</label>
                  <input 
                    type="text" 
                    placeholder="مثال: 1403/12/29"
                    value={kardexEndDate}
                    onChange={e => setKardexEndDate(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl text-xs border font-mono outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>
              </div>

              {/* Advanced search and active presets */}
              {kardexProduct && (
                <div className="flex flex-col sm:flex-row gap-3 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 justify-between items-center">
                  <div className="relative w-full sm:w-72">
                    <Search className="w-3.5 h-3.5 absolute right-3 top-2.5 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="جستجوی شماره سند..."
                      value={kardexSearchQuery}
                      onChange={e => setKardexSearchQuery(e.target.value)}
                      className={`w-full pr-9 pl-3 py-1.5 rounded-xl text-xs border outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}
                    />
                  </div>

                  <div className="flex gap-2 text-[10px] font-bold text-slate-400">
                    <span>دوره‌های سریع:</span>
                    <button onClick={() => { setKardexStartDate("1403/01/01"); setKardexEndDate("1403/03/31"); }} className="hover:text-indigo-500 cursor-pointer">بهار ۱۴۰۳</button>
                    <span>|</span>
                    <button onClick={() => { setKardexStartDate("1403/04/01"); setKardexEndDate("1403/06/31"); }} className="hover:text-indigo-500 cursor-pointer">تابستان ۱۴۰۳</button>
                    <span>|</span>
                    <button onClick={() => { setKardexStartDate("1403/07/01"); setKardexEndDate("1403/09/30"); }} className="hover:text-indigo-500 cursor-pointer">پاییز ۱۴۰۳</button>
                    <span>|</span>
                    <button onClick={() => { setKardexStartDate("1403/10/01"); setKardexEndDate("1403/12/29"); }} className="hover:text-indigo-500 cursor-pointer">زمستان ۱۴۰۳</button>
                    <span>|</span>
                    <button onClick={() => { setKardexStartDate(""); setKardexEndDate(""); setKardexDocType("ALL"); setKardexSearchQuery(""); }} className="text-rose-500 hover:text-rose-600 cursor-pointer">ریست فیلترها</button>
                  </div>
                </div>
              )}
            </div>

            {!kardexProduct ? (
              /* Empty State when no product is selected */
              <div className={`p-16 text-center rounded-3xl border flex flex-col items-center justify-center gap-4 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <Package className="w-16 h-16 text-indigo-500 opacity-30 animate-bounce" />
                <h3 className="font-black text-slate-800 dark:text-slate-200 text-sm">آماده نمایش گزارش تفصیلی کاردکس</h3>
                <p className="text-xs text-slate-500 max-w-md leading-relaxed">
                  لطفاً ابتدا از کادر بالا کالای مورد نظر خود را انتخاب نمایید تا گردش‌های دفتری، بهای تمام شده، روندها و ترازنامه دوره‌ای آن نمایش داده شود.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* 1. Metric summary cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Card 1: Beginning Balance */}
                  <div className={`p-4 rounded-2xl border flex items-center justify-between shadow-sm ${isDarkMode ? 'bg-slate-900/40 border-slate-800/80' : 'bg-slate-50 border-slate-100'}`}>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block mb-1">موجودی ابتدای دوره</span>
                      <strong className="text-base font-mono font-black text-slate-800 dark:text-slate-100 block">{kardexData.beginningBalance.qty.toLocaleString()}</strong>
                      <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">{kardexData.beginningBalance.value.toLocaleString()} ریال</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-850 flex items-center justify-center text-slate-500">
                      <BookOpen className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Card 2: Total Inflows */}
                  <div className={`p-4 rounded-2xl border flex items-center justify-between shadow-sm ${isDarkMode ? 'bg-slate-900/40 border-slate-800/80' : 'bg-slate-50 border-slate-100'}`}>
                    <div>
                      <span className="text-[10px] font-bold text-emerald-500 block mb-1">جمع کل وارده طی دوره</span>
                      <strong className="text-base font-mono font-black text-emerald-600 dark:text-emerald-400 block">+{kardexData.inflow.qty.toLocaleString()}</strong>
                      <span className="text-[10px] text-emerald-500/80 font-mono mt-0.5 block">+{kardexData.inflow.value.toLocaleString()} ریال</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-500">
                      <ArrowDownRight className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Card 3: Total Outflows */}
                  <div className={`p-4 rounded-2xl border flex items-center justify-between shadow-sm ${isDarkMode ? 'bg-slate-900/40 border-slate-800/80' : 'bg-slate-50 border-slate-100'}`}>
                    <div>
                      <span className="text-[10px] font-bold text-rose-50 block mb-1">جمع کل صادره طی دوره</span>
                      <strong className="text-base font-mono font-black text-rose-600 dark:text-rose-400 block">-{kardexData.outflow.qty.toLocaleString()}</strong>
                      <span className="text-[10px] text-rose-500/80 font-mono mt-0.5 block">-{kardexData.outflow.value.toLocaleString()} ریال</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center text-rose-500">
                      <ArrowUpRight className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Card 4: Ending Balance */}
                  <div className={`p-4 rounded-2xl border flex items-center justify-between shadow-sm ${isDarkMode ? 'bg-indigo-950/20 border-indigo-500/20' : 'bg-indigo-50/70 border-indigo-100'}`}>
                    <div>
                      <span className="text-[10px] font-bold text-indigo-500 block mb-1">موجودی پایان دوره</span>
                      <strong className="text-lg font-mono font-black text-indigo-600 dark:text-indigo-400 block">{kardexData.endingBalance.qty.toLocaleString()}</strong>
                      <span className="text-[10px] text-indigo-500 font-mono mt-0.5 block">{kardexData.endingBalance.value.toLocaleString()} ریال</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-500">
                      <Boxes className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* 1b. KPI Sub-Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Sub-Card 1: Average Unit Cost */}
                  <div className={`p-4 rounded-2xl border flex items-center justify-between shadow-xs ${isDarkMode ? 'bg-slate-900/20 border-slate-800/60' : 'bg-slate-50/50 border-slate-100'}`}>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block mb-1">بهای واحد میانگین موجودی</span>
                      <strong className="text-xs font-mono font-black text-slate-700 dark:text-slate-300 block">
                        {kardexData.averageUnitCost ? kardexData.averageUnitCost.toLocaleString() : '۰'} <span className="text-[9px] font-normal">ریال / واحد</span>
                      </strong>
                    </div>
                    <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-1 rounded-lg">فی میانگین</span>
                  </div>

                  {/* Sub-Card 2: Turnover Rate */}
                  <div className={`p-4 rounded-2xl border flex items-center justify-between shadow-xs ${isDarkMode ? 'bg-slate-900/20 border-slate-800/60' : 'bg-slate-50/50 border-slate-100'}`}>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block mb-1">ضریب گردش کالا در دوره</span>
                      <strong className="text-xs font-mono font-black text-slate-700 dark:text-slate-300 block">
                        {kardexData.turnoverRate ? kardexData.turnoverRate.toFixed(2) : '۰.۰۰'} <span className="text-[9px] font-normal font-sans">مرتبه</span>
                      </strong>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded-lg">گردش موجودی</span>
                  </div>

                  {/* Sub-Card 3: Stock Alert status */}
                  <div className={`p-4 rounded-2xl border flex items-center justify-between shadow-xs ${isDarkMode ? 'bg-slate-900/20 border-slate-800/60' : 'bg-slate-50/50 border-slate-100'}`}>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block mb-1">سطح ایمنی ذخیره انبار</span>
                      <span className={`text-[10px] font-black block mt-1 ${kardexData.isLowStock ? 'text-amber-500' : 'text-emerald-500'}`}>
                        {kardexData.isLowStock ? '⚠️ هشدار: زیر نقطه سفارش (کمتر از ۱۵)' : '✅ ایمن (بالای حد سفارش)'}
                      </span>
                    </div>
                    <span className={`text-[9px] font-black px-2 py-1 rounded-lg ${kardexData.isLowStock ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'}`}>
                      {kardexData.isLowStock ? 'نیاز به تأمین' : 'سطح مکفی'}
                    </span>
                  </div>
                </div>

                {/* 2. Graphical Trend Analysis with Recharts */}
                <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <h4 className="font-black text-xs mb-4 text-slate-400 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-indigo-500" /> نمودار تغییرات موجودی عینی و بهای دفتری کالا
                  </h4>

                  <div className="h-64 w-full" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={kardexData.chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorQty" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" opacity={isDarkMode ? 0.1 : 0.3} />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                        <YAxis yAxisId="left" tick={{ fontSize: 10 }} label={{ value: 'موجودی (تعداد)', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: '#6366f1' } }} />
                        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} label={{ value: 'ارزش کل (ریال)', angle: 90, position: 'insideRight', style: { fontSize: 10, fill: '#10b981' } }} />
                        <Tooltip 
                          contentStyle={{ 
                            background: isDarkMode ? '#0f172a' : '#ffffff', 
                            borderColor: isDarkMode ? '#1e293b' : '#e2e8f0',
                            borderRadius: '12px',
                            fontSize: '11px',
                            textAlign: 'right'
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: 10 }} />
                        <Area yAxisId="left" type="monotone" dataKey="موجودی (تعداد)" stroke="#6366f1" fillOpacity={1} fill="url(#colorQty)" name="موجودی (تعداد)" />
                        <Area yAxisId="right" type="monotone" dataKey="بهای تمام شده کل (ریال)" stroke="#10b981" fillOpacity={1} fill="url(#colorVal)" name="بهای کل دفتری (ریال)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 2b. Pricing Sandbox Comparison Tool */}
                <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
                    <div>
                      <h4 className="font-black text-xs text-slate-400 flex items-center gap-2">
                        <Calculator className="w-4 h-4 text-indigo-500" /> جعبه‌ابزار شبیه‌سازی و مقایسه بهای تمام‌شده کالا (Pricing Sandbox)
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-1">تأثیر موازنه ارزش پایان دوره و سود ناخالص تحت هر یک از روش‌های پذیرفته‌شده حسابداری صنعتی</p>
                    </div>
                    <span className="text-[9px] font-black bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded-md">
                      روش فعال فعلی: {pricingMethod === PricingMethod.AVERAGE ? "میانگین موزون" : pricingMethod === PricingMethod.FIFO ? "FIFO" : pricingMethod === PricingMethod.LIFO ? "LIFO" : "قیمت استاندارد"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { method: PricingMethod.AVERAGE, name: "میانگین موزون متحرک", desc: "محاسبه بر مبنای بهای متوسط متغیر پس از هر رسید", color: "indigo" },
                      { method: PricingMethod.FIFO, name: "اولین صادره از اولین وارده (FIFO)", desc: "خروج کالا بر مبنای قدیمی‌ترین بهای خریدهای ثبت‌شده", color: "emerald" },
                      { method: PricingMethod.LIFO, name: "آخرین صادره از اولین وارده (LIFO)", desc: "خروج کالا بر مبنای جدیدترین بهای خریدهای ثبت‌شده", color: "rose" },
                      { method: PricingMethod.STANDARD, name: "بهای تمام‌شده استاندارد", desc: "ارزیابی دفتری کالا صرفاً با نرخ پیش‌فرض و مصوب کالا", color: "amber" }
                    ].map(({ method, name, desc, color }) => {
                      const sim = kardexData.pricingSimulation[method];
                      const isActive = pricingMethod === method;
                      const valueDiff = sim.endingValue - kardexData.pricingSimulation[pricingMethod].endingValue;

                      return (
                        <div 
                          key={method}
                          className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                            isActive 
                              ? "bg-indigo-500/5 border-indigo-500 ring-1 ring-indigo-500/20" 
                              : "bg-slate-50/30 dark:bg-slate-950/10 border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                          }`}
                        >
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-black text-xs text-slate-700 dark:text-slate-300">{name}</span>
                              {isActive && (
                                <span className="text-[9px] font-bold text-indigo-500 bg-indigo-100 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded">فعال</span>
                              )}
                            </div>
                            <p className="text-[9px] text-slate-500 leading-relaxed min-h-6">{desc}</p>

                            <div className="space-y-1.5 my-3 pt-2 border-t border-dashed border-slate-100 dark:border-slate-800">
                              <div className="flex justify-between text-[10px]">
                                <span className="text-slate-400">بهای کالای صادر شده (COGS):</span>
                                <span className="font-mono font-bold text-slate-600 dark:text-slate-300">{sim.cogs.toLocaleString()} ریال</span>
                              </div>
                              <div className="flex justify-between text-[10px]">
                                <span className="text-slate-400">ارزش کل پایان دوره:</span>
                                <span className="font-mono font-bold text-slate-600 dark:text-slate-300">{sim.endingValue.toLocaleString()} ریال</span>
                              </div>
                              <div className="flex justify-between text-[9px] pt-1">
                                <span className="text-slate-400">انحراف از روش فعال:</span>
                                <span className={`font-mono font-bold ${valueDiff === 0 ? 'text-slate-400' : valueDiff > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                  {valueDiff === 0 ? '۰' : (valueDiff > 0 ? '+' : '') + valueDiff.toLocaleString()} ریال
                                </span>
                              </div>
                            </div>
                          </div>

                          {!isActive && (
                            <button
                              onClick={() => handleApplyPricingMethod(method)}
                              className="w-full mt-2 py-1.5 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-bold border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                            >
                              اعمال روش {method} روی کل سیستم
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. ERP-grade Grouped Ledger Grid */}
                <div className={`p-4 md:p-6 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-black text-xs text-slate-400">ریزدفتر تفصیلی کاردکس (دفتر معین کالا)</h4>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                      تعداد تراکنش‌های فیلتر شده: {kardexData.rows.length}
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse text-xs whitespace-nowrap">
                      <thead>
                        {/* Grouped Header row */}
                        <tr className={`border-b-2 ${isDarkMode ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                          <th colSpan={5} className="p-3 text-center border-l border-slate-100 dark:border-slate-800 font-black">اطلاعات تراکنش سند</th>
                          <th colSpan={3} className="p-3 text-center border-l border-slate-100 dark:border-slate-800 text-emerald-600 font-black bg-emerald-500/5">بخش وارده (ورود به انبار)</th>
                          <th colSpan={3} className="p-3 text-center border-l border-slate-100 dark:border-slate-800 text-rose-600 font-black bg-rose-500/5">بخش صادره (خروج از انبار)</th>
                          <th colSpan={2} className="p-3 text-center text-indigo-600 font-black bg-indigo-500/5">بخش مانده دفتری</th>
                        </tr>
                        {/* Sub headers row */}
                        <tr className={`border-b text-[11px] ${isDarkMode ? 'border-slate-800 text-slate-400 bg-slate-950/20' : 'border-slate-200 text-slate-500 bg-slate-50/50'}`}>
                          <th className="p-3 font-bold">ردیف</th>
                          <th className="p-3 font-bold">تاریخ</th>
                          <th className="p-3 font-bold">شماره سند</th>
                          <th className="p-3 font-bold border-l border-slate-100 dark:border-slate-800">نوع رویداد</th>
                          <th className="p-3 font-bold border-l border-slate-100 dark:border-slate-800">انبار هدف</th>
                          
                          <th className="p-3 font-bold text-center text-emerald-600">تعداد</th>
                          <th className="p-3 font-bold text-left text-emerald-600">بهای واحد</th>
                          <th className="p-3 font-bold text-left text-emerald-600 border-l border-slate-100 dark:border-slate-800">ارزش وارده</th>
                          
                          <th className="p-3 font-bold text-center text-rose-600">تعداد</th>
                          <th className="p-3 font-bold text-left text-rose-600">بهای واحد</th>
                          <th className="p-3 font-bold text-left text-rose-600 border-l border-slate-100 dark:border-slate-800">ارزش صادره</th>
                          
                          <th className="p-3 font-bold text-center text-indigo-600 font-black">تعداد</th>
                          <th className="p-3 font-bold text-left text-indigo-600 font-black">ارزش کل مانده</th>
                        </tr>
                      </thead>
                      <tbody>
                        {kardexData.rows.length > 0 ? (
                          kardexData.rows.map((row, idx) => {
                            const whName = warehouses.find(w => w.id === row.warehouse_id)?.name || "انتقالی";
                            const isVirtual = row.isVirtual;
                            
                            const qtyIn = row.qty_in || 0;
                            const valIn = qtyIn * row.unit_price;
                            
                            const qtyOut = row.qty_out || 0;
                            const valOut = qtyOut * row.unit_price;

                            return (
                              <tr 
                                key={idx} 
                                onClick={() => !isVirtual && handleInspectKardexRow(row)}
                                className={`border-b last:border-0 text-[11px] transition-colors ${
                                  isVirtual 
                                    ? (isDarkMode ? 'bg-amber-950/10 hover:bg-amber-950/20 text-amber-500' : 'bg-amber-50/50 hover:bg-amber-50 text-amber-600') 
                                    : (isDarkMode ? 'border-slate-800/50 hover:bg-slate-800/30 cursor-pointer text-slate-300' : 'border-slate-100 hover:bg-indigo-50/40 cursor-pointer text-slate-700')
                                }`}
                                title={isVirtual ? undefined : "برای مشاهده جزئیات سند و سند حسابداری کلیک کنید"}
                              >
                                <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                                <td className="p-3 font-mono">{row.date}</td>
                                <td className="p-3">
                                  {isVirtual ? (
                                    <span className="text-slate-400">-</span>
                                  ) : (
                                    <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-bold">
                                      {row.doc_number}
                                    </span>
                                  )}
                                </td>
                                <td className="p-3 border-l border-slate-100 dark:border-slate-800">
                                  {isVirtual ? (
                                    <span className="font-bold">{row.description}</span>
                                  ) : (
                                    <div className="flex items-center gap-1.5">
                                      <span className={`w-1.5 h-1.5 rounded-full ${qtyIn > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                      <span className="font-medium">
                                        {row.type === WarehouseDocType.RECEIPT ? 'رسید انبار (ورودی)' :
                                         row.type === WarehouseDocType.REMITTANCE ? 'حواله انبار (خروج)' :
                                         row.type === WarehouseDocType.TRANSFER ? 'انتقال بین انبارها' : 'تعدیل انبارگردانی'}
                                      </span>
                                    </div>
                                  )}
                                </td>
                                <td className="p-3 border-l border-slate-100 dark:border-slate-800 font-medium">{whName}</td>
                                
                                {/* Inflow (وارده) */}
                                <td className="p-3 text-center text-emerald-600 font-mono font-bold">{qtyIn > 0 ? qtyIn.toLocaleString() : '-'}</td>
                                <td className="p-3 text-left text-emerald-600 font-mono">{qtyIn > 0 ? row.unit_price.toLocaleString() : '-'}</td>
                                <td className="p-3 text-left text-emerald-600 font-mono border-l border-slate-100 dark:border-slate-800">{qtyIn > 0 ? valIn.toLocaleString() : '-'}</td>
                                
                                {/* Outflow (صادره) */}
                                <td className="p-3 text-center text-rose-600 font-mono font-bold">{qtyOut > 0 ? qtyOut.toLocaleString() : '-'}</td>
                                <td className="p-3 text-left text-rose-600 font-mono">{qtyOut > 0 ? row.unit_price.toLocaleString() : '-'}</td>
                                <td className="p-3 text-left text-rose-600 font-mono border-l border-slate-100 dark:border-slate-800">{qtyOut > 0 ? valOut.toLocaleString() : '-'}</td>
                                
                                {/* Balance (مانده) */}
                                <td className="p-3 text-center text-indigo-600 font-mono font-black">{row.balance_qty.toLocaleString()}</td>
                                <td className="p-3 text-left text-indigo-600 font-mono font-bold">{row.balance_value.toLocaleString()}</td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={13} className="p-12 text-center text-slate-500 italic">هیچ رکوردی برای این کالا طبق فیلترهای بالا یافت نگردید.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}
          </div>
        )}

        {/* Docs Tab */}
        {activeTab === "docs" && (
          <div className="space-y-6 animate-fade-in text-right" dir="rtl">
            {/* 1. Header Banner */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gradient-to-r from-indigo-50/40 via-slate-50 to-slate-100/50 dark:from-slate-900/60 dark:to-slate-900/20 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800 gap-4">
              <div>
                <h2 className="text-sm font-black flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                  <ArrowRightLeft className="w-5 h-5" /> مدیریت و تفصیلی اسناد انبار
                </h2>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">تعریف انواع رسید، حواله، انتقالی، بررسی موجودی مبدأ به صورت هوشمند، اجرای موتور ارزش‌گذاری و ثبت نهایی در حسابداری دوبل مالی</p>
              </div>
              <button 
                onClick={handleOpenAddDoc}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> ثبت سند انبار جدید
              </button>
            </div>

            {/* 2. Documents Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className={`p-4 rounded-2xl border flex items-center justify-between shadow-sm ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block mb-1">کل اسناد ثبت شده</span>
                  <strong className="text-sm font-mono font-black text-slate-800 dark:text-slate-100 block">{docsStats.totalCount} سند</strong>
                  <span className="text-[9px] text-indigo-500 font-medium block mt-0.5">در انتظار تایید: {docsStats.draftsCount} پیش‌نویس</span>
                </div>
                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800/60 flex items-center justify-center text-slate-500">
                  <FileText className="w-4 h-4" />
                </div>
              </div>

              <div className={`p-4 rounded-2xl border flex items-center justify-between shadow-sm ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block mb-1">پیش‌نویس‌ها (DRAFT)</span>
                  <strong className="text-sm font-mono font-black text-amber-500 block">{docsStats.draftsCount} سند</strong>
                  <span className="text-[9px] text-slate-500 block mt-0.5">نیازمند بازبینی و ثبت نهایی کاردکس</span>
                </div>
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/20 flex items-center justify-center text-amber-500">
                  <ClipboardList className="w-4 h-4" />
                </div>
              </div>

              <div className={`p-4 rounded-2xl border flex items-center justify-between shadow-sm ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div>
                  <span className="text-[10px] font-bold text-emerald-500 block mb-1">ارزش کل رسیدها (ورودی)</span>
                  <strong className="text-sm font-mono font-black text-emerald-600 dark:text-emerald-400 block">{docsStats.totalReceiptsValue.toLocaleString()} ریال</strong>
                  <span className="text-[9px] text-slate-500 block mt-0.5">مجموع بهای اسناد رسید قطعی شده</span>
                </div>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-500">
                  <ArrowDownRight className="w-4 h-4" />
                </div>
              </div>

              <div className={`p-4 rounded-2xl border flex items-center justify-between shadow-sm ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div>
                  <span className="text-[10px] font-bold text-rose-500 block mb-1">ارزش کل حواله‌ها (خروجی)</span>
                  <strong className="text-sm font-mono font-black text-rose-600 dark:text-rose-400 block">{docsStats.totalRemittancesValue.toLocaleString()} ریال</strong>
                  <span className="text-[9px] text-slate-500 block mt-0.5">مجموع بهای اسناد حواله قطعی شده</span>
                </div>
                <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center text-rose-500">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* 3. Search & Filters Controller Panel */}
            <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-4 pb-4 border-b border-slate-100 dark:border-slate-800/80">
                <span className="text-xs font-black text-indigo-500 flex items-center gap-1.5">
                  <Filter className="w-4 h-4" /> فیلترهای پیشرفته و جستجوی اسناد انبار
                </span>
                
                {/* View Mode Toggle Buttons */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl">
                  <button 
                    onClick={() => setDocViewMode("table")}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition flex items-center gap-1.5 cursor-pointer ${docViewMode === "table" ? (isDarkMode ? "bg-slate-800 text-indigo-400 shadow-sm" : "bg-white text-indigo-600 shadow-sm") : "text-slate-400 hover:text-slate-500"}`}
                  >
                    <List className="w-3.5 h-3.5" /> نمای جدولی (ERP)
                  </button>
                  <button 
                    onClick={() => setDocViewMode("grid")}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition flex items-center gap-1.5 cursor-pointer ${docViewMode === "grid" ? (isDarkMode ? "bg-slate-800 text-indigo-400 shadow-sm" : "bg-white text-indigo-600 shadow-sm") : "text-slate-400 hover:text-slate-500"}`}
                  >
                    <Grid className="w-3.5 h-3.5" /> نمای کارتی (Grid)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
                {/* Search */}
                <div className="lg:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">جستجوی متنی (شماره سند / توضیحات)</label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                    <input 
                      type="text" 
                      placeholder="جستجو شماره سند، شرح، کاربر..."
                      value={docSearchQuery}
                      onChange={e => setDocSearchQuery(e.target.value)}
                      className={`w-full pr-9 pl-3 py-2 rounded-xl text-xs border outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'}`}
                    />
                  </div>
                </div>

                {/* Doc Type */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">نوع سند</label>
                  <select 
                    value={docFilterType}
                    onChange={e => setDocFilterType(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl text-xs border font-bold outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'}`}
                  >
                    <option value="ALL">همه انواع اسناد</option>
                    <option value={WarehouseDocType.RECEIPT}>رسید انبار (ورود)</option>
                    <option value={WarehouseDocType.REMITTANCE}>حواله انبار (خروج)</option>
                    <option value={WarehouseDocType.TRANSFER}>حواله انتقالی</option>
                    <option value={WarehouseDocType.ADJUSTMENT}>سند تعدیلات</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">وضعیت تایید مالی</label>
                  <select 
                    value={docFilterStatus}
                    onChange={e => setDocFilterStatus(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl text-xs border font-bold outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'}`}
                  >
                    <option value="ALL">همه وضعیت‌ها</option>
                    <option value={DocStatus.DRAFT}>پیش‌نویس (DRAFT)</option>
                    <option value={DocStatus.CONFIRMED}>تایید شده (CONFIRMED)</option>
                    <option value={DocStatus.ACCOUNTED}>سند مالی صادر شده</option>
                  </select>
                </div>

                {/* Warehouse */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">انبار مرتبط</label>
                  <select 
                    value={docFilterWarehouse}
                    onChange={e => setDocFilterWarehouse(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl text-xs border font-bold outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'}`}
                  >
                    <option value="ALL">همه انبارها</option>
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>

                {/* Date range inputs */}
                <div className="grid grid-cols-2 gap-1">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 mb-1">از تاریخ</label>
                    <input 
                      type="text" 
                      placeholder="1403/01/01"
                      value={docFilterStartDate}
                      onChange={e => setDocFilterStartDate(e.target.value)}
                      className={`w-full px-2 py-2 rounded-xl text-xs border font-mono outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'}`}
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 mb-1">تا تاریخ</label>
                    <input 
                      type="text" 
                      placeholder="1403/12/29"
                      value={docFilterEndDate}
                      onChange={e => setDocFilterEndDate(e.target.value)}
                      className={`w-full px-2 py-2 rounded-xl text-xs border font-mono outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'}`}
                    />
                  </div>
                </div>
              </div>

              {/* Reset filter options */}
              {(docSearchQuery || docFilterType !== "ALL" || docFilterStatus !== "ALL" || docFilterWarehouse !== "ALL" || docFilterStartDate || docFilterEndDate) && (
                <div className="flex justify-end mt-3 text-[10px] font-bold">
                  <button 
                    onClick={() => {
                      setDocSearchQuery("");
                      setDocFilterType("ALL");
                      setDocFilterStatus("ALL");
                      setDocFilterWarehouse("ALL");
                      setDocFilterStartDate("");
                      setDocFilterEndDate("");
                    }}
                    className="text-rose-500 hover:text-rose-600 transition cursor-pointer"
                  >
                    ✕ ریست کردن تمامی فیلترها
                  </button>
                </div>
              )}
            </div>

            {/* 4. Document Contents Render Area */}
            {filteredDocuments.length === 0 ? (
              <div className={`p-16 text-center rounded-3xl border flex flex-col items-center justify-center gap-4 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <Package className="w-16 h-16 text-slate-400 opacity-20 animate-pulse" />
                <h3 className="font-black text-slate-800 dark:text-slate-200 text-sm">هیچ سند انباری یافت نشد</h3>
                <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                  سندی با فیلترها و کلمات جستجو شده شما یافت نشد. لطفاً فیلترها را بررسی کرده و یا یک سند جدید انبار ثبت نمایید.
                </p>
              </div>
            ) : docViewMode === "table" ? (
              /* ERP-grade Professional Table View */
              <div className={`p-4 md:p-6 rounded-2xl border overflow-x-auto shadow-sm ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <table className="w-full text-right border-collapse text-xs whitespace-nowrap">
                  <thead>
                    <tr className={`border-b-2 text-[11px] ${isDarkMode ? 'border-slate-800 text-slate-400 bg-slate-950/20' : 'border-slate-200 text-slate-500 bg-slate-50/50'}`}>
                      <th className="p-3 font-bold">ردیف</th>
                      <th className="p-3 font-bold">تاریخ سند</th>
                      <th className="p-3 font-bold">شماره سند / سریال</th>
                      <th className="p-3 font-bold">نوع سند</th>
                      <th className="p-3 font-bold">انبار مبدأ ➔ مقصد</th>
                      <th className="p-3 font-bold text-center">تعداد اقلام</th>
                      <th className="p-3 font-bold text-left">ارزش کل سند (ریال)</th>
                      <th className="p-3 font-bold text-center">وضعیت تایید</th>
                      <th className="p-3 font-bold text-center">عملیات سند</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDocuments.map((doc, idx) => {
                      const totalVal = doc.lines.reduce((sum, line) => sum + (line.total_cost || (line.quantity * line.unit_cost)), 0);
                      const sourceWhName = warehouses.find(w => w.id === doc.source_warehouse_id)?.name;
                      const destWhName = warehouses.find(w => w.id === doc.destination_warehouse_id)?.name;

                      return (
                        <tr key={doc.id} className={`border-b last:border-0 text-[11px] hover:bg-slate-100/40 dark:hover:bg-slate-800/10 transition-colors ${isDarkMode ? 'border-slate-800/50' : 'border-slate-100'}`}>
                          <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                          <td className="p-3 font-mono">{doc.date}</td>
                          <td className="p-3">
                            <div className="flex flex-col">
                              <span className="font-mono font-black text-slate-700 dark:text-slate-300 text-xs">{doc.doc_number}</span>
                              <span className="text-[9px] text-slate-400">سریال داخلی: {doc.internal_serial}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold inline-block ${
                              doc.doc_type === WarehouseDocType.RECEIPT ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 
                              doc.doc_type === WarehouseDocType.REMITTANCE || doc.doc_type === WarehouseDocType.ISSUE ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' : 
                              doc.doc_type === WarehouseDocType.TRANSFER ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                              'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                            }`}>
                              {doc.doc_type === WarehouseDocType.RECEIPT ? 'رسید انبار' : 
                               doc.doc_type === WarehouseDocType.REMITTANCE || doc.doc_type === WarehouseDocType.ISSUE ? 'حواله انبار' : 
                               doc.doc_type === WarehouseDocType.TRANSFER ? 'انتقال بین انبارها' : 'تعدیلات انبار'}
                            </span>
                          </td>
                          <td className="p-3 font-medium">
                            {doc.doc_type === WarehouseDocType.RECEIPT && (
                              <div className="flex items-center gap-1.5">
                                <span className="text-slate-400">➔</span>
                                <span className="text-emerald-600 dark:text-emerald-400">{destWhName || "انبار مقصد"}</span>
                              </div>
                            )}
                            {(doc.doc_type === WarehouseDocType.REMITTANCE || doc.doc_type === WarehouseDocType.ISSUE) && (
                              <div className="flex items-center gap-1.5">
                                <span className="text-rose-600 dark:text-rose-400">{sourceWhName || "انبار مبدأ"}</span>
                                <span className="text-slate-400">➔</span>
                              </div>
                            )}
                            {doc.doc_type === WarehouseDocType.TRANSFER && (
                              <div className="flex items-center gap-1.5 font-bold">
                                <span className="text-rose-500">{sourceWhName}</span>
                                <span className="text-slate-400">➔</span>
                                <span className="text-emerald-500">{destWhName}</span>
                              </div>
                            )}
                            {doc.doc_type === WarehouseDocType.ADJUSTMENT && (
                              <span className="text-amber-500">تعدیل در: {sourceWhName || destWhName}</span>
                            )}
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-slate-600 dark:text-slate-300">
                            {doc.lines.length} ردیف ({doc.lines.reduce((s, l) => s + (l.quantity || l.qty), 0)} عدد)
                          </td>
                          <td className="p-3 text-left font-mono font-bold text-indigo-600 dark:text-indigo-400 text-xs">
                            {totalVal > 0 ? `${totalVal.toLocaleString()} ریال` : "محاسبه با تایید"}
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${
                              doc.status === DocStatus.DRAFT ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border border-amber-200/40 dark:border-amber-900/30' :
                              doc.status === DocStatus.CONFIRMED ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-200/40 dark:border-emerald-900/30' :
                              'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400 border border-indigo-200/40 dark:border-indigo-900/30'
                            }`}>
                              {doc.status === DocStatus.DRAFT ? 'پیش‌نویس (DRAFT)' :
                               doc.status === DocStatus.CONFIRMED ? 'تایید شده (CONFIRMED)' : 'ثبت مالی شده (ACCOUNTED)'}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* 1. View details (A4 printable voucher) for all documents */}
                              <button
                                onClick={() => setSelectedDocDetails(doc)}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                                title="مشاهده برگه برگه چاپی سند انبار"
                              >
                                <Eye className="w-3 h-3" /> برگه معین
                              </button>

                              {/* 2. State-specific Actions */}
                              {doc.status === DocStatus.DRAFT && (
                                <>
                                  <button
                                    onClick={() => handleConfirmDoc(doc.id)}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition shadow-sm flex items-center gap-1 cursor-pointer"
                                  >
                                    تایید و کاردکس
                                  </button>
                                  <button
                                    onClick={() => handleDeleteDoc(doc.id)}
                                    className="p-1 bg-rose-50 dark:bg-rose-950/30 text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-950/65 rounded-lg transition cursor-pointer"
                                    title="حذف پیش‌نویس"
                                  >
                                    <Trash className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}

                              {doc.status === DocStatus.CONFIRMED && (
                                <button
                                  onClick={() => handleGenerateAccountingVoucher(doc.id)}
                                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold transition shadow-sm flex items-center gap-1 cursor-pointer"
                                >
                                  <Coins className="w-3 h-3" /> صدور سند مالی
                                </button>
                              )}

                              {doc.status === DocStatus.ACCOUNTED && (
                                <button
                                  onClick={() => handleViewVoucher(doc)}
                                  className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer border border-indigo-200/30"
                                >
                                  <FileSpreadsheet className="w-3 h-3" /> سند حسابداری
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Improved Card (Grid) View */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredDocuments.map(doc => {
                  const totalVal = doc.lines.reduce((sum, line) => sum + (line.total_cost || (line.quantity * line.unit_cost)), 0);
                  const sourceWhName = warehouses.find(w => w.id === doc.source_warehouse_id)?.name;
                  const destWhName = warehouses.find(w => w.id === doc.destination_warehouse_id)?.name;

                  return (
                    <div key={doc.id} className={`p-6 rounded-2xl border flex flex-col gap-4 shadow-sm transition-all hover:shadow-md ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                      <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400 font-bold">شماره سند</span>
                            <span className="font-mono font-black text-sm text-slate-700 dark:text-slate-300">{doc.doc_number}</span>
                            <span className="text-[10px] text-slate-400">| سریال: {doc.internal_serial}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-3">
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {doc.date}</span>
                            <span className="flex items-center gap-1"><User className="w-3 h-3" /> {doc.created_by}</span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1.5">
                          {/* Doc Type Badge */}
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            doc.doc_type === WarehouseDocType.RECEIPT ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 
                            doc.doc_type === WarehouseDocType.REMITTANCE || doc.doc_type === WarehouseDocType.ISSUE ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' : 
                            doc.doc_type === WarehouseDocType.TRANSFER ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                            'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          }`}>
                            {doc.doc_type === WarehouseDocType.RECEIPT ? 'رسید انبار' : 
                             doc.doc_type === WarehouseDocType.REMITTANCE || doc.doc_type === WarehouseDocType.ISSUE ? 'حواله انبار' : 
                             doc.doc_type === WarehouseDocType.TRANSFER ? 'انتقال بین انبارها' : 'تعدیلات انبار'}
                          </span>

                          {/* Status Badge */}
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${
                            doc.status === DocStatus.DRAFT ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30' :
                            doc.status === DocStatus.CONFIRMED ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30' :
                            'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400 border border-indigo-200/30 dark:border-indigo-900/30'
                          }`}>
                            {doc.status === DocStatus.DRAFT ? 'پیش‌نویس (DRAFT)' :
                             doc.status === DocStatus.CONFIRMED ? 'تایید شده (CONFIRMED)' : 'ثبت مالی شده (ACCOUNTED)'}
                          </span>
                        </div>
                      </div>

                      {/* Routing Details */}
                      <div className={`p-3 rounded-xl flex items-center gap-2 text-xs font-bold ${isDarkMode ? 'bg-slate-950 text-slate-300' : 'bg-slate-50 text-slate-700'}`}>
                        {doc.doc_type === WarehouseDocType.RECEIPT && (
                          <span>وارد شده به: <span className="text-indigo-600 dark:text-indigo-400">{destWhName || "انبار مقصد"}</span></span>
                        )}
                        {(doc.doc_type === WarehouseDocType.REMITTANCE || doc.doc_type === WarehouseDocType.ISSUE) && (
                          <span>صادر شده از: <span className="text-rose-600 dark:text-rose-400">{sourceWhName || "انبار مبدا"}</span></span>
                        )}
                        {doc.doc_type === WarehouseDocType.TRANSFER && (
                          <div className="flex items-center gap-2 w-full justify-between">
                            <span>انبار مبدا: <span className="text-rose-500">{sourceWhName}</span></span>
                            <ArrowRightLeft className="w-3 h-3 opacity-50" />
                            <span>انبار مقصد: <span className="text-emerald-500">{destWhName}</span></span>
                          </div>
                        )}
                        {doc.doc_type === WarehouseDocType.ADJUSTMENT && (
                          <span>تعدیل در: <span className="text-amber-500">{sourceWhName || destWhName}</span></span>
                        )}
                      </div>

                      {/* Lines list inside the card */}
                      <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
                        <table className="w-full text-right text-[10px]">
                          <thead className={isDarkMode ? 'bg-slate-950 text-slate-400' : 'bg-slate-50 text-slate-500'}>
                            <tr className="border-b border-slate-100 dark:border-slate-800">
                              <th className="p-2 font-bold">کالا</th>
                              <th className="p-2 text-center font-bold">تعداد</th>
                              <th className="p-2 text-left font-bold">بهای واحد (ریال)</th>
                              <th className="p-2 text-left font-bold">ارزش کل (ریال)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {doc.lines.map((line, lIdx) => (
                              <tr key={line.id || lIdx} className="border-b last:border-0 border-slate-100 dark:border-slate-800">
                                <td className="p-2 truncate max-w-[120px] font-medium">{products.find(p => p.id === line.product_id)?.name || line.product_id}</td>
                                <td className="p-2 text-center font-mono font-bold">{line.quantity || line.qty}</td>
                                <td className="p-2 text-left font-mono">
                                  {line.unit_cost > 0 ? line.unit_cost.toLocaleString() : (doc.status === DocStatus.DRAFT ? "در انتظار تایید" : "صفر")}
                                </td>
                                <td className="p-2 text-left font-mono font-bold">
                                  {((line.quantity || line.qty) * line.unit_cost) > 0 ? ((line.quantity || line.qty) * line.unit_cost).toLocaleString() : (doc.status === DocStatus.DRAFT ? "محاسبه با تایید" : "صفر")}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="flex justify-between items-center text-xs mt-1">
                        <span className="text-slate-400 font-medium">ارزش کل سند انبار:</span>
                        <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-sm">
                          {totalVal > 0 ? `${totalVal.toLocaleString()} ریال` : "محاسبه با تایید"}
                        </span>
                      </div>

                      {doc.description && (
                        <p className={`text-[10px] p-2.5 rounded-lg italic ${isDarkMode ? 'bg-slate-950 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
                          <strong>شرح سند:</strong> {doc.description}
                        </p>
                      )}

                      {/* Actions Panel */}
                      <div className="flex gap-2 mt-auto pt-3 border-t border-slate-100 dark:border-slate-800">
                        {/* Always show detailed print voucher button */}
                        <button
                          onClick={() => setSelectedDocDetails(doc)}
                          className="px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                          title="مشاهده جزئیات برگه معین انبار"
                        >
                          <Eye className="w-4 h-4" /> جزئیات برگه
                        </button>

                        {doc.status === DocStatus.DRAFT && (
                          <>
                            <button
                              onClick={() => handleConfirmDoc(doc.id)}
                              className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-bold transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> تایید و ثبت کاردکس
                            </button>
                            <button
                              onClick={() => handleDeleteDoc(doc.id)}
                              className="p-2 bg-rose-50 dark:bg-rose-950/30 text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-950/60 rounded-xl transition cursor-pointer"
                              title="حذف پیش‌نویس"
                            >
                              <Trash className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        {doc.status === DocStatus.CONFIRMED && (
                          <button
                            onClick={() => handleGenerateAccountingVoucher(doc.id)}
                            className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-bold transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Coins className="w-3.5 h-3.5" /> صدور سند مالی
                          </button>
                        )}

                        {doc.status === DocStatus.ACCOUNTED && (
                          <button
                            onClick={() => handleViewVoucher(doc)}
                            className="flex-1 py-2 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 rounded-xl text-[10px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border border-indigo-200/30"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5" /> مشاهده سند حسابداری صادر شده
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Comprehensive Create Doc Modal */}
            {showAddDoc && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto backdrop-blur-sm">
                <div className={`w-full max-w-2xl p-6 rounded-2xl shadow-xl border my-8 max-h-[90vh] flex flex-col ${isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'}`}>
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4 mb-4 shrink-0">
                    <h3 className="font-black text-sm flex items-center gap-2 text-indigo-500">
                      <Plus className="w-5 h-5" /> ثبت سند انبار جدید (فرم پیش‌نویس)
                    </h3>
                    <button 
                      onClick={() => setShowAddDoc(false)} 
                      className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
                    >
                      ✕ بستن
                    </button>
                  </div>
                  
                  <div className="space-y-4 overflow-y-auto flex-1 pr-1 pl-1 custom-scrollbar">
                    {/* Header fields */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">شماره سند انبار</label>
                        <input 
                          type="text"
                          value={docNumber}
                          onChange={e => setDocNumber(e.target.value)}
                          className={`w-full px-3 py-2 rounded-xl text-xs border font-mono outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'}`}
                          placeholder="مثلاً INV-1002"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">تاریخ سند</label>
                        <input 
                          type="text"
                          value={docDate}
                          onChange={e => setDocDate(e.target.value)}
                          className={`w-full px-3 py-2 rounded-xl text-xs border font-mono outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'}`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">نوع سند انبار</label>
                        <select
                          value={docType}
                          onChange={e => {
                            const val = e.target.value as WarehouseDocType;
                            setDocType(val);
                            // Auto reset warehouse selectors based on type
                            if (val === WarehouseDocType.RECEIPT) {
                              setSourceWarehouseId("");
                            } else if (val === WarehouseDocType.REMITTANCE) {
                              setDestinationWarehouseId("");
                            }
                          }}
                          className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'}`}
                        >
                          <option value={WarehouseDocType.RECEIPT}>رسید انبار (ورود کالا)</option>
                          <option value={WarehouseDocType.REMITTANCE}>حواله انبار (خروج کالا)</option>
                          <option value={WarehouseDocType.TRANSFER}>حواله بین انبارها (انتقال)</option>
                          <option value={WarehouseDocType.ADJUSTMENT}>سند تعدیلات انبار</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">نوع مرجع</label>
                          <select
                            value={referenceType}
                            onChange={e => setReferenceType(e.target.value as ReferenceType)}
                            className={`w-full px-2 py-2 rounded-xl text-xs border outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'}`}
                          >
                            <option value={ReferenceType.NONE}>بدون مرجع</option>
                            <option value={ReferenceType.PURCHASE}>خرید کالا</option>
                            <option value={ReferenceType.SALE}>فروش کالا</option>
                            <option value={ReferenceType.PRODUCTION}>تولید</option>
                            <option value={ReferenceType.INITIAL_BALANCE}>موجودی اولیه</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">شناسه مرجع</label>
                          <input 
                            type="text"
                            value={referenceId}
                            onChange={e => setReferenceId(e.target.value)}
                            className={`w-full px-2 py-2 rounded-xl text-xs border font-mono outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'}`}
                            placeholder="شماره فاکتور/تگ"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Warehouses Selectors based on DocType */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Source Warehouse */}
                      {(docType === WarehouseDocType.REMITTANCE || docType === WarehouseDocType.ISSUE || docType === WarehouseDocType.TRANSFER || docType === WarehouseDocType.ADJUSTMENT) ? (
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">انبار مبدأ (خروج از)</label>
                          <select
                            value={sourceWarehouseId}
                            onChange={e => setSourceWarehouseId(e.target.value)}
                            className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'}`}
                          >
                            <option value="">انتخاب انبار مبدأ...</option>
                            {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                          </select>
                        </div>
                      ) : <div />}

                      {/* Destination Warehouse */}
                      {(docType === WarehouseDocType.RECEIPT || docType === WarehouseDocType.TRANSFER || docType === WarehouseDocType.ADJUSTMENT) ? (
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">انبار مقصد (ورود به)</label>
                          <select
                            value={destinationWarehouseId}
                            onChange={e => setDestinationWarehouseId(e.target.value)}
                            className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'}`}
                          >
                            <option value="">انتخاب انبار مقصد...</option>
                            {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                          </select>
                        </div>
                      ) : <div />}
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">توضیحات / شرح سند</label>
                      <textarea
                        value={docDescription}
                        onChange={e => setDocDescription(e.target.value)}
                        rows={2}
                        className={`w-full px-3 py-2 rounded-xl text-xs border outline-none resize-none ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'}`}
                        placeholder="توضیحات و بابت سند انبار را وارد کنید..."
                      />
                    </div>

                    {/* Lines Editor */}
                    <div className="border border-slate-100 dark:border-slate-800 rounded-2xl p-4 space-y-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-black text-slate-500">اقلام و ردیف‌های کالا</span>
                        <button
                          type="button"
                          onClick={handleAddLine}
                          className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/40 rounded-lg text-[10px] font-bold hover:bg-emerald-100 transition cursor-pointer flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" /> افزودن ردیف جدید
                        </button>
                      </div>

                      <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                        {docLines.map((line, idx) => {
                          const curStock = sourceWarehouseId ? inventoryEngine.get_current_stock(line.product_id, sourceWarehouseId) : 0;
                          const isOutbound = docType === WarehouseDocType.REMITTANCE || docType === WarehouseDocType.TRANSFER;
                          const hasInsufficientStock = isOutbound && line.quantity > curStock;

                          return (
                            <div key={idx} className="flex gap-2 items-end border-b border-slate-100 dark:border-slate-800 pb-3 last:border-b-0 last:pb-0">
                              <div className="flex-1 min-w-[150px]">
                                <label className="block text-[9px] text-slate-400 mb-1">انتخاب کالا</label>
                                <select
                                  value={line.product_id}
                                  onChange={e => handleLineChange(idx, "product_id", e.target.value)}
                                  className={`w-full px-2 py-1.5 rounded-lg text-[11px] border outline-none ${
                                    hasInsufficientStock 
                                      ? 'border-rose-500 bg-rose-50/10 text-rose-600 dark:text-rose-400 font-bold' 
                                      : isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-100 border-slate-200'
                                  }`}
                                >
                                  {products.map(p => <option key={p.id} value={p.id}>{p.code} - {p.name}</option>)}
                                </select>
                                {isOutbound && sourceWarehouseId && (
                                  <div className={`text-[10px] font-bold mt-1 ${hasInsufficientStock ? 'text-rose-500 animate-pulse' : 'text-emerald-500'}`}>
                                    {hasInsufficientStock 
                                      ? `⚠️ کسر موجودی! موجودی فعلی: ${curStock} عدد` 
                                      : `✓ موجودی کافی: ${curStock} عدد`}
                                  </div>
                                )}
                              </div>

                              <div className="w-[80px]">
                                <label className="block text-[9px] text-slate-400 mb-1">تعداد</label>
                                <input
                                  type="number"
                                  min={1}
                                  value={line.quantity}
                                  onChange={e => handleLineChange(idx, "quantity", Math.max(1, Number(e.target.value)))}
                                  className={`w-full px-2 py-1 border rounded-lg text-xs font-mono outline-none ${
                                    hasInsufficientStock 
                                      ? 'border-rose-500 bg-rose-50/10 text-rose-600 dark:text-rose-400 font-black' 
                                      : isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-100 border-slate-200'
                                  }`}
                                />
                              </div>

                            <div className="w-[130px]">
                              <label className="block text-[9px] text-slate-400 mb-1">
                                بهای واحد (ریال)
                              </label>
                              <input
                                type="number"
                                disabled={docType === WarehouseDocType.REMITTANCE || docType === WarehouseDocType.ISSUE || docType === WarehouseDocType.TRANSFER}
                                value={docType === WarehouseDocType.REMITTANCE || docType === WarehouseDocType.ISSUE || docType === WarehouseDocType.TRANSFER ? 0 : line.unit_cost}
                                onChange={e => handleLineChange(idx, "unit_cost", Number(e.target.value))}
                                className={`w-full px-2 py-1 border rounded-lg text-xs font-mono outline-none ${
                                  docType === WarehouseDocType.REMITTANCE || docType === WarehouseDocType.ISSUE || docType === WarehouseDocType.TRANSFER
                                    ? 'bg-slate-200 dark:bg-slate-800/40 text-slate-400 cursor-not-allowed border-transparent'
                                    : (isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-100 border-slate-200')
                                }`}
                                placeholder={docType === WarehouseDocType.REMITTANCE || docType === WarehouseDocType.ISSUE || docType === WarehouseDocType.TRANSFER ? "محاسبه با MAC" : ""}
                              />
                            </div>

                            <div className="w-[120px] text-left">
                              <span className="block text-[9px] text-slate-400 mb-1">ارزش ردیف</span>
                              <span className="font-mono text-[11px] font-bold truncate block py-1">
                                {docType === WarehouseDocType.REMITTANCE || docType === WarehouseDocType.ISSUE || docType === WarehouseDocType.TRANSFER
                                  ? "محاسبه با MAC"
                                  : `${(line.quantity * line.unit_cost).toLocaleString()} ریال`}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveLine(idx)}
                              className="p-1.5 bg-rose-50 dark:bg-rose-950/20 text-rose-600 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/40 transition mb-0.5 cursor-pointer"
                              title="حذف ردیف"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                        {docLines.length === 0 && (
                          <p className="text-center text-xs text-slate-400 py-4 italic">ردیفی برای کالا ثبت نشده است.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-4 flex gap-2 shrink-0 justify-end">
                    <button
                      onClick={() => setShowAddDoc(false)}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      انصراف
                    </button>
                    <button
                      onClick={handleSaveDoc}
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                    >
                      ذخیره سند پیش‌نویس
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Detailed Accounting Voucher Viewer Modal */}
            {selectedVoucherDoc && voucherHeader && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                <div className={`w-full max-w-xl p-6 rounded-3xl shadow-xl border ${isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'}`}>
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
                    <h3 className="font-black text-sm flex items-center gap-2 text-indigo-500">
                      <FileSpreadsheet className="w-5 h-5" /> سند حسابداری صادر شده (تراکنش انبار)
                    </h3>
                    <button 
                      onClick={() => setSelectedVoucherDoc(null)} 
                      className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
                    >
                      ✕ بستن
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Header values */}
                    <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl">
                      <div>
                        <p className="mb-1 text-slate-400 font-bold">شماره سند مالی: <span className="font-mono text-slate-700 dark:text-slate-300 font-black">{voucherHeader.voucher_number}</span></p>
                        <p className="text-slate-400">مرجع سند انبار: <span className="font-mono text-slate-700 dark:text-slate-300">{voucherHeader.reference_number}</span></p>
                      </div>
                      <div className="text-left">
                        <p className="mb-1 text-slate-400">تاریخ مالی: <span className="font-mono text-slate-700 dark:text-slate-300">{voucherHeader.date}</span></p>
                        <p className="text-slate-400">ایجاد کننده: <span className="text-slate-700 dark:text-slate-300">{voucherHeader.user_id}</span></p>
                      </div>
                    </div>

                    <p className="text-xs italic bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border-r-2 border-indigo-500">
                      <strong>شرح آرتیکل مالی:</strong> {voucherHeader.description}
                    </p>

                    {/* Ledger lines table */}
                    <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
                      <table className="w-full text-right text-[11px] border-collapse">
                        <thead className={isDarkMode ? 'bg-slate-950 text-slate-400' : 'bg-slate-50 text-slate-500'}>
                          <tr className="border-b border-slate-100 dark:border-slate-800">
                            <th className="p-2.5 font-bold">کد حساب</th>
                            <th className="p-2.5 font-bold">عنوان حساب دفتر کل</th>
                            <th className="p-2.5 text-left font-bold text-emerald-600">بدهکار (ریال)</th>
                            <th className="p-2.5 text-left font-bold text-rose-600">بستانکار (ریال)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {voucherLines.map((line, idx) => (
                            <tr key={line.id || idx} className="border-b last:border-0 border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950/20">
                              <td className="p-2.5 font-mono text-slate-500">{line.account_code || "کد نامشخص"}</td>
                              <td className="p-2.5 font-bold text-slate-700 dark:text-slate-300">{line.account_name}</td>
                              <td className="p-2.5 text-left font-mono font-bold text-emerald-600">
                                {line.debit > 0 ? line.debit.toLocaleString() : '-'}
                              </td>
                              <td className="p-2.5 text-left font-mono font-bold text-rose-600">
                                {line.credit > 0 ? line.credit.toLocaleString() : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className={`font-bold border-t ${isDarkMode ? 'bg-slate-950 text-white border-slate-800' : 'bg-slate-100 text-slate-800 border-slate-200'}`}>
                          <tr>
                            <td colSpan={2} className="p-2.5 text-right font-black">جمع تراز آرتیکل مالی:</td>
                            <td className="p-2.5 text-left font-mono font-black text-emerald-600">
                              {voucherLines.reduce((sum, l) => sum + (l.debit || 0), 0).toLocaleString()}
                            </td>
                            <td className="p-2.5 text-left font-mono font-black text-rose-600">
                              {voucherLines.reduce((sum, l) => sum + (l.credit || 0), 0).toLocaleString()}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => setSelectedVoucherDoc(null)}
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                    >
                      تایید و بستن
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Detailed Printable Warehouse Document (SelectedDocDetails Modal) */}
        {selectedDocDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto backdrop-blur-sm text-right font-sans" dir="rtl">
            <div className={`w-full max-w-4xl p-6 rounded-3xl shadow-xl border my-8 max-h-[90vh] flex flex-col ${isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'}`}>
              
              {/* Modal Header Controls (Non-Printable) */}
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4 mb-4 shrink-0 no-print">
                <h3 className="font-black text-sm flex items-center gap-2 text-indigo-500">
                  <FileText className="w-5 h-5" /> نسخه رسمی و چاپی سند انبار
                </h3>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => window.print()}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" /> چاپ سند (Print)
                  </button>
                  <button 
                    onClick={() => setSelectedDocDetails(null)} 
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    ✕ بستن
                  </button>
                </div>
              </div>

              {/* Printable Paper Voucher Area */}
              <div className="flex-1 overflow-y-auto pr-1 pl-1 print-paper custom-scrollbar text-right font-sans" dir="rtl">
                <div className={`p-8 rounded-2xl border-2 border-dashed ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50/50 border-slate-200'} space-y-6 print:border-0 print:bg-white print:text-black print:p-0`}>
                  
                  {/* Document Header */}
                  <div className="grid grid-cols-3 items-center pb-6 border-b-2 border-slate-200 dark:border-slate-800">
                    {/* Right: Company Logo & Info */}
                    <div className="text-right">
                      <h1 className="text-xs font-black tracking-tight text-indigo-600 dark:text-indigo-400 print:text-black">شرکت توسعه لجستیک و سیستم‌های ERP</h1>
                      <p className="text-[9px] text-slate-400 mt-1">سهامی خاص - ثبت انبارداری یکپارچه کشوری</p>
                    </div>
                    
                    {/* Center: Title */}
                    <div className="text-center">
                      <h2 className="text-xs font-black border-2 border-slate-800 dark:border-slate-200 px-4 py-2 rounded-xl inline-block print:border-black">
                        {selectedDocDetails.doc_type === WarehouseDocType.RECEIPT ? "رسید رسمی ورود کالا به انبار" : 
                         selectedDocDetails.doc_type === WarehouseDocType.REMITTANCE || selectedDocDetails.doc_type === WarehouseDocType.ISSUE ? "حواله رسمی خروج کالا از انبار" : 
                         selectedDocDetails.doc_type === WarehouseDocType.TRANSFER ? "برگه بین‌انبار نقل و انتقال کالا" : "سند تعدیلات رسمی انبار"}
                      </h2>
                      <span className="block text-[9px] text-slate-400 mt-2">اصلی - نسخه بایگانی واحد حسابداری مالی</span>
                    </div>

                    {/* Left: Metadata */}
                    <div className="text-left font-mono text-[10px] text-slate-500 space-y-1">
                      <p><strong>شماره سند:</strong> <span className="text-slate-800 dark:text-slate-200 print:text-black font-bold">{selectedDocDetails.doc_number}</span></p>
                      <p><strong>سریال داخلی:</strong> {selectedDocDetails.internal_serial}</p>
                      <p><strong>تاریخ ثبت:</strong> {selectedDocDetails.date}</p>
                      <p><strong>وضعیت:</strong> <span className="font-bold text-indigo-600 dark:text-indigo-400">{
                        selectedDocDetails.status === DocStatus.DRAFT ? "پیش‌نویس" :
                        selectedDocDetails.status === DocStatus.CONFIRMED ? "تایید کاردکس" : "ثبت حسابداری قطعی"
                      }</span></p>
                    </div>
                  </div>

                  {/* Routing Details & Party Information */}
                  <div className="grid grid-cols-2 gap-4 text-xs bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 print:border-black print:text-black">
                    <div className="space-y-1.5">
                      <p className="text-slate-400 font-bold">اطلاعات انبار مبدأ / صادر کننده:</p>
                      <p className="font-black text-slate-700 dark:text-slate-300 print:text-black">
                        {selectedDocDetails.source_warehouse_id 
                          ? warehouses.find(w => w.id === selectedDocDetails.source_warehouse_id)?.name 
                          : "خارج از مجموعه (تأمین‌کننده / متفرقه)"}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">کد انبار: {selectedDocDetails.source_warehouse_id || "N/A"}</p>
                    </div>
                    <div className="space-y-1.5 border-r border-slate-100 dark:border-slate-800 pr-4 print:border-black">
                      <p className="text-slate-400 font-bold">اطلاعات انبار مقصد / دریافت کننده:</p>
                      <p className="font-black text-slate-700 dark:text-slate-300 print:text-black">
                        {selectedDocDetails.destination_warehouse_id 
                          ? warehouses.find(w => w.id === selectedDocDetails.destination_warehouse_id)?.name 
                          : "خارج از مجموعه (مشتری / مصرف‌کننده / ضایعات)"}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">کد انبار: {selectedDocDetails.destination_warehouse_id || "N/A"}</p>
                    </div>
                  </div>

                  {/* Table of items */}
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden print:border-black">
                    <table className="w-full text-right text-xs border-collapse">
                      <thead>
                        <tr className={`${isDarkMode ? 'bg-slate-950 text-slate-400' : 'bg-slate-100 text-slate-600'} print:bg-white print:text-black border-b border-slate-200 dark:border-slate-800 print:border-black`}>
                          <th className="p-3 font-bold border-l last:border-l-0 border-slate-200 dark:border-slate-800 print:border-black">ردیف</th>
                          <th className="p-3 font-bold border-l last:border-l-0 border-slate-200 dark:border-slate-800 print:border-black">کد کالا</th>
                          <th className="p-3 font-bold border-l last:border-l-0 border-slate-200 dark:border-slate-800 print:border-black">شرح کالا / قطعه</th>
                          <th className="p-3 text-center font-bold border-l last:border-l-0 border-slate-200 dark:border-slate-800 print:border-black">تعداد واحد</th>
                          <th className="p-3 text-left font-bold border-l last:border-l-0 border-slate-200 dark:border-slate-800 print:border-black">بهای واحد (ریال)</th>
                          <th className="p-3 text-left font-bold border-l last:border-l-0 border-slate-200 dark:border-slate-800 print:border-black">ارزش کل ناخالص (ریال)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedDocDetails.lines.map((line, idx) => {
                          const prod = products.find(p => p.id === line.product_id);
                          return (
                            <tr key={line.id || idx} className="border-b last:border-0 border-slate-200 dark:border-slate-800 print:border-black hover:bg-slate-100/30 dark:hover:bg-slate-950/20">
                              <td className="p-3 font-mono text-slate-400 border-l last:border-l-0 border-slate-200 dark:border-slate-800 print:border-black">{idx + 1}</td>
                              <td className="p-3 font-mono font-bold border-l last:border-l-0 border-slate-200 dark:border-slate-800 print:border-black">{prod?.code || "N/A"}</td>
                              <td className="p-3 font-bold text-slate-800 dark:text-slate-100 print:text-black border-l last:border-l-0 border-slate-200 dark:border-slate-800 print:border-black">{prod?.name || "نامشخص"}</td>
                              <td className="p-3 text-center font-mono font-black border-l last:border-l-0 border-slate-200 dark:border-slate-800 print:border-black">{line.quantity || line.qty} عدد</td>
                              <td className="p-3 text-left font-mono border-l last:border-l-0 border-slate-200 dark:border-slate-800 print:border-black">
                                {line.unit_cost > 0 ? line.unit_cost.toLocaleString() : "محاسبه با MAC انبار"}
                              </td>
                              <td className="p-3 text-left font-mono font-black border-l last:border-l-0 border-slate-200 dark:border-slate-800 print:border-black">
                                {((line.quantity || line.qty) * line.unit_cost) > 0 ? ((line.quantity || line.qty) * line.unit_cost).toLocaleString() : "محاسبه با MAC انبار"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className={`font-bold border-t ${isDarkMode ? 'bg-slate-950 text-white border-slate-800' : 'bg-slate-100 text-slate-800 border-slate-200'} print:bg-white print:text-black print:border-black`}>
                        <tr>
                          <td colSpan={3} className="p-3 text-right font-black">جمع ارزش کل کالاها طبق بها:</td>
                          <td className="p-3 text-center font-mono font-black">
                            {selectedDocDetails.lines.reduce((sum, l) => sum + (l.quantity || l.qty), 0)} عدد
                          </td>
                          <td className="p-3 text-left font-mono"></td>
                          <td className="p-3 text-left font-mono font-black text-indigo-600 dark:text-indigo-400 print:text-black">
                            {selectedDocDetails.lines.reduce((sum, l) => sum + (((l.quantity || l.qty)) * l.unit_cost), 0).toLocaleString()} ریال
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Description */}
                  {selectedDocDetails.description && (
                    <p className={`text-xs p-4 rounded-xl italic ${isDarkMode ? 'bg-slate-900 text-slate-300' : 'bg-slate-100 text-slate-700'} print:bg-white print:text-black print:border print:border-black`}>
                      <strong>توضیحات بابت سند:</strong> {selectedDocDetails.description}
                    </p>
                  )}

                  {/* Signatures Row */}
                  <div className="grid grid-cols-4 gap-4 pt-12 text-center text-xs text-slate-500 font-bold border-t border-slate-200 dark:border-slate-800 print:border-black print:text-black">
                    <div className="space-y-12">
                      <span>تهیه کننده و تحویل‌دهنده</span>
                      <div className="border-b border-dashed border-slate-300 dark:border-slate-700 w-2/3 mx-auto print:border-black" />
                      <span className="text-[10px] text-slate-400 block font-mono font-bold">امضا و تاریخ</span>
                    </div>
                    <div className="space-y-12">
                      <span>تحویل‌گیرنده کالا</span>
                      <div className="border-b border-dashed border-slate-300 dark:border-slate-700 w-2/3 mx-auto print:border-black" />
                      <span className="text-[10px] text-slate-400 block font-mono font-bold">امضا و تاریخ</span>
                    </div>
                    <div className="space-y-12">
                      <span>مسئول انبار (انباردار)</span>
                      <div className="border-b border-dashed border-slate-300 dark:border-slate-700 w-2/3 mx-auto print:border-black" />
                      <span className="text-[10px] text-slate-400 block font-mono font-bold">مهر و امضا</span>
                    </div>
                    <div className="space-y-12">
                      <span>رئیس حسابداری مالی و صنعتی</span>
                      <div className="border-b border-dashed border-slate-300 dark:border-slate-700 w-2/3 mx-auto print:border-black" />
                      <span className="text-[10px] text-slate-400 block font-mono font-bold">تایید و امضا</span>
                    </div>
                  </div>

                </div>
              </div>

              {/* Modal Footer Controls (Non-Printable) */}
              <div className="flex justify-end pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 shrink-0 no-print">
                <button
                  onClick={() => setSelectedDocDetails(null)}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  تایید و بستن
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Printable Stocktake Sheet / Minutes Modal */}
        {selectedStocktakePrint && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex justify-center items-center p-4 z-50 overflow-y-auto no-print">
            <div className={`w-full max-w-4xl p-6 md:p-8 rounded-3xl border shadow-2xl flex flex-col gap-6 max-h-[90vh] overflow-y-auto animate-scale-up ${
              isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              
              {/* Header Controls (Non-Printable) */}
              <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800 no-print">
                <div className="flex items-center gap-2">
                  <Printer className="w-5 h-5 text-indigo-500" />
                  <h3 className="font-black text-sm text-slate-800 dark:text-slate-100">
                    {selectedStocktakePrint.type === 'blind_sheet' && "چاپ برگه سفید شمارش (نابینا)"}
                    {selectedStocktakePrint.type === 'standard_sheet' && "چاپ برگه شمارش همراه با مقادیر دفتری"}
                    {selectedStocktakePrint.type === 'minutes' && "چاپ صورت‌جلسه رسمی و نهایی انبارگردانی"}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
                  >
                    <Printer className="w-4 h-4" /> دستور چاپ (Print)
                  </button>
                  <button
                    onClick={() => setSelectedStocktakePrint(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    بستن
                  </button>
                </div>
              </div>

              {/* Printable Body Content */}
              <div className="flex-1 print:p-0 print:m-0 print:shadow-none" dir="rtl">
                <div className={`p-8 border rounded-2xl print:border-0 print:p-0 ${
                  isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-100 text-slate-800'
                } print:bg-white print:text-black`}>
                  
                  {/* Document Official Header */}
                  <div className="flex justify-between items-start border-b border-double border-slate-400 dark:border-slate-600 pb-5 mb-6 print:border-black">
                    <div className="space-y-1">
                      <h2 className="font-black text-lg text-slate-900 dark:text-white print:text-black">سازمان مدیریت و انبارداری یکپارچه ایران</h2>
                      <p className="text-xs text-slate-500 print:text-black">ماژول مدیریت جامع موجودی کالا و حسابداری انبار</p>
                    </div>
                    <div className="text-left space-y-1 text-[11px] font-mono text-slate-500 print:text-black">
                      <p>تاریخ پرینت: {new Date().toLocaleDateString("fa-IR")}</p>
                      <p>شناسه دوره: {selectedStocktakePrint.period.id}</p>
                      <p>وضعیت دوره: {
                        selectedStocktakePrint.period.status === StocktakePeriodStatus.OPEN ? "آماده شمارش" :
                        selectedStocktakePrint.period.status === StocktakePeriodStatus.COUNTING ? "در حال شمارش" :
                        selectedStocktakePrint.period.status === StocktakePeriodStatus.CALCULATING ? "در حال محاسبه" : "نهایی‌شده"
                      }</p>
                    </div>
                  </div>

                  {/* Document Title Banner */}
                  <div className="text-center bg-slate-200/50 dark:bg-slate-800/50 py-3 rounded-xl mb-6 print:bg-slate-100 print:text-black">
                    <h1 className="font-black text-base">
                      {selectedStocktakePrint.type === 'blind_sheet' && `برگه خام فیزیکی عملیات انبارگردانی (شمارش نابینا)`}
                      {selectedStocktakePrint.type === 'standard_sheet' && `برگه کنترل و ممیزی موجودی همراه با اقلام دفتری`}
                      {selectedStocktakePrint.type === 'minutes' && `صورت‌جلسه رسمی و خلاصه موازنه نتایج انبارگردانی پایان دوره`}
                    </h1>
                    <p className="text-[11px] mt-1 text-slate-600 dark:text-slate-400 print:text-black">
                      دوره انبارگردانی: <strong className="text-indigo-600 dark:text-indigo-400 print:text-black">« {selectedStocktakePrint.period.title} »</strong> | 
                      انبار مقصد ممیزی: <strong className="text-slate-900 dark:text-white print:text-black">{warehouses.find(w => w.id === selectedStocktakePrint.period.warehouse_id)?.name}</strong>
                    </p>
                  </div>

                  {/* Period Metadata Summary Block */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-black/20 mb-6 text-xs print:border-black print:text-black print:bg-white">
                    <div>
                      <span className="text-slate-400 block mb-0.5 print:text-black">تاریخ شروع دوره:</span>
                      <strong className="font-mono">{selectedStocktakePrint.period.start_date}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5 print:text-black">تاریخ خاتمه دوره:</span>
                      <strong className="font-mono">{selectedStocktakePrint.period.end_date}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5 print:text-black">مسئول انبارداری:</span>
                      <strong>{warehouses.find(w => w.id === selectedStocktakePrint.period.warehouse_id)?.manager || "نامشخص"}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5 print:text-black">موقعیت فیزیکی:</span>
                      <strong>{warehouses.find(w => w.id === selectedStocktakePrint.period.warehouse_id)?.location || "نامشخص"}</strong>
                    </div>
                  </div>

                  {/* Render Table depending on Print Type */}
                  {selectedStocktakePrint.type === 'blind_sheet' && (() => {
                    const printItems = inventoryEngine.getStocktakeItems(selectedStocktakePrint.period.id);
                    return (
                      <div className="overflow-x-auto">
                        <p className="text-[10px] text-slate-500 italic mb-2 print:text-black text-right">توضیح: این برگه فاقد موجودی دفتری است تا عملیات شمارش به صورت کاملا مستقل و بدون پیش‌داوری ذهنی انجام پذیرد.</p>
                        <table className="w-full text-right text-xs border border-slate-300 print:border-black">
                          <thead>
                            <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-300 print:bg-slate-100 print:text-black print:border-black">
                              <th className="p-2 border-l border-slate-300 print:border-black text-center w-12">ردیف</th>
                              <th className="p-2 border-l border-slate-300 print:border-black text-right">کد کالا</th>
                              <th className="p-2 border-l border-slate-300 print:border-black text-right">نام کالا (شرح قلم)</th>
                              <th className="p-2 border-l border-slate-300 print:border-black text-center w-24">واحد سنجش</th>
                              <th className="p-2 border-l border-slate-300 print:border-black text-center w-28">تعداد شمارش اول</th>
                              <th className="p-2 border-l border-slate-300 print:border-black text-center w-28">تعداد شمارش دوم</th>
                              <th className="p-2 text-center w-32">امضا شمارش‌کننده</th>
                            </tr>
                          </thead>
                          <tbody>
                            {printItems.map((item, idx) => {
                              const prod = products.find(p => p.id === item.product_id);
                              return (
                                <tr key={item.id} className="border-b border-slate-300 print:border-black hover:bg-slate-100/30">
                                  <td className="p-2 border-l border-slate-300 print:border-black text-center font-mono">{idx + 1}</td>
                                  <td className="p-2 border-l border-slate-300 print:border-black font-mono text-slate-500 print:text-black text-right">{prod?.code}</td>
                                  <td className="p-2 border-l border-slate-300 print:border-black font-bold text-right">{prod?.name}</td>
                                  <td className="p-2 border-l border-slate-300 print:border-black text-center">{prod?.unit || "عدد"}</td>
                                  <td className="p-2 border-l border-slate-300 print:border-black text-center text-slate-300 font-mono">................</td>
                                  <td className="p-2 border-l border-slate-300 print:border-black text-center text-slate-300 font-mono">................</td>
                                  <td className="p-2 text-center text-slate-300 font-mono">................</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}

                  {selectedStocktakePrint.type === 'standard_sheet' && (() => {
                    const printItems = inventoryEngine.getStocktakeItems(selectedStocktakePrint.period.id);
                    return (
                      <div className="overflow-x-auto">
                        <table className="w-full text-right text-xs border border-slate-300 print:border-black">
                          <thead>
                            <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-300 print:bg-slate-100 print:text-black print:border-black">
                              <th className="p-2 border-l border-slate-300 print:border-black text-center w-12">ردیف</th>
                              <th className="p-2 border-l border-slate-300 print:border-black text-right">کد کالا</th>
                              <th className="p-2 border-l border-slate-300 print:border-black text-right">نام کالا (شرح قلم)</th>
                              <th className="p-2 border-l border-slate-300 print:border-black text-center">واحد سنجش</th>
                              <th className="p-2 border-l border-slate-300 print:border-black text-center">موجودی دفتری سیستم</th>
                              <th className="p-2 border-l border-slate-300 print:border-black text-center">آخرین شمارش ثبت شده</th>
                              <th className="p-2 text-center">مغایرت عینی نسبت به دفتر</th>
                            </tr>
                          </thead>
                          <tbody>
                            {printItems.map((item, idx) => {
                              const prod = products.find(p => p.id === item.product_id);
                              const lastCount = item.count_3_qty !== null ? item.count_3_qty : (item.count_2_qty !== null ? item.count_2_qty : (item.count_1_qty !== null ? item.count_1_qty : null));
                              const variance = lastCount !== null ? (lastCount - item.system_snapshot_qty) : null;
                              return (
                                <tr key={item.id} className="border-b border-slate-300 print:border-black hover:bg-slate-100/30">
                                  <td className="p-2 border-l border-slate-300 print:border-black text-center font-mono">{idx + 1}</td>
                                  <td className="p-2 border-l border-slate-300 print:border-black font-mono text-slate-500 print:text-black text-right">{prod?.code}</td>
                                  <td className="p-2 border-l border-slate-300 print:border-black font-bold text-right">{prod?.name}</td>
                                  <td className="p-2 border-l border-slate-300 print:border-black text-center">{prod?.unit || "عدد"}</td>
                                  <td className="p-2 border-l border-slate-300 print:border-black text-center font-mono font-bold">{item.system_snapshot_qty}</td>
                                  <td className="p-2 border-l border-slate-300 print:border-black text-center font-mono">{lastCount !== null ? lastCount : "ثبت نشده"}</td>
                                  <td className="p-2 text-center font-mono font-bold">
                                    {variance === null ? "-" : (
                                      variance === 0 ? "منطبق" : (
                                        variance > 0 ? `+${variance} (اضافی)` : `${variance} (کسری)`
                                      )
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}

                  {selectedStocktakePrint.type === 'minutes' && (() => {
                    const printItems = inventoryEngine.getStocktakeItems(selectedStocktakePrint.period.id);
                    const discrepancyItems = printItems.filter(i => i.variance_qty !== null && i.variance_qty !== 0);
                    
                    const totalMatched = printItems.filter(i => i.variance_qty === 0).length;
                    const totalSurplus = printItems.filter(i => (i.variance_qty || 0) > 0);
                    const totalDeficit = printItems.filter(i => (i.variance_qty || 0) < 0);

                    // Compute estimated values
                    let surplusValue = 0;
                    totalSurplus.forEach(item => {
                      surplusValue += Math.abs(item.variance_qty || 0) * item.system_unit_cost;
                    });

                    let deficitValue = 0;
                    totalDeficit.forEach(item => {
                      deficitValue += Math.abs(item.variance_qty || 0) * item.system_unit_cost;
                    });

                    return (
                      <div className="space-y-6">
                        <div className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 print:text-black text-justify text-right">
                          به استناد دستورالعمل‌های کنترل داخلی و آیین‌نامه انبارگردانی فیزیکی، بدین‌وسیله صورت‌جلسه خلاصه نتایج شمارش و موازنه مغایرت‌های انبارگردانی فیزیکی دوره فوق‌الذکر تنظیمی در تاریخ <strong className="font-mono">{new Date().toLocaleDateString("fa-IR")}</strong> منعقد می‌گردد. طبق بازرسی‌های عینی و سه مرحله شمارش دقیق و با حضور اعضای منتخب هیئت نظارت، تعداد کل <strong>{printItems.length}</strong> قلم کالا مورد شمارش کامل فیزیکی قرار گرفت که وضعیت کلی به شرح جدول ذیل موازنه و جهت اتخاذ تصمیمات مالی و تایید اسناد تعدیلی ارسال می‌گردد.
                        </div>

                        {/* Analytic Highlights in Minutes */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                          <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 text-emerald-800 dark:bg-emerald-900/10 dark:text-emerald-400 print:border-black print:text-black print:bg-white">
                            <span className="text-[10px] block">اقلام کاملاً منطبق</span>
                            <span className="text-sm font-black font-mono">{totalMatched}</span>
                          </div>
                          <div className="p-3 rounded-xl border border-rose-200 bg-rose-50/50 text-rose-800 dark:bg-rose-900/10 dark:text-rose-400 print:border-black print:text-black print:bg-white">
                            <span className="text-[10px] block">اقلام دارای مغایرت</span>
                            <span className="text-sm font-black font-mono">{discrepancyItems.length}</span>
                          </div>
                          <div className="p-3 rounded-xl border border-indigo-200 bg-indigo-50/50 text-indigo-800 dark:bg-indigo-900/10 dark:text-indigo-400 print:border-black print:text-black print:bg-white">
                            <span className="text-[10px] block">ارزش کل اقلام اضافی</span>
                            <span className="text-sm font-black font-mono">{surplusValue.toLocaleString()} ریال</span>
                          </div>
                          <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/50 text-amber-800 dark:bg-amber-900/10 dark:text-amber-400 print:border-black print:text-black print:bg-white">
                            <span className="text-[10px] block">ارزش کل اقلام کسری</span>
                            <span className="text-sm font-black font-mono">{deficitValue.toLocaleString()} ریال</span>
                          </div>
                        </div>

                        <div className="font-bold text-xs mt-4 text-right">لیست تفصیلی اقلام دارای مغایرت و موازنه فیزیکی:</div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-right text-xs border border-slate-300 print:border-black">
                            <thead>
                              <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-300 print:bg-slate-100 print:text-black print:border-black">
                                <th className="p-2 border-l border-slate-300 print:border-black text-center w-12">ردیف</th>
                                <th className="p-2 border-l border-slate-300 print:border-black text-right">کد کالا</th>
                                <th className="p-2 border-l border-slate-300 print:border-black text-right">نام کالا (شرح مغایرت)</th>
                                <th className="p-2 border-l border-slate-300 print:border-black text-center w-16">واحد</th>
                                <th className="p-2 border-l border-slate-300 print:border-black text-center">موجودی دفتری</th>
                                <th className="p-2 border-l border-slate-300 print:border-black text-center">موجودی عینی</th>
                                <th className="p-2 border-l border-slate-300 print:border-black text-center">میزان مغایرت</th>
                                <th className="p-2 border-l border-slate-300 print:border-black text-center">ارزش واحد (ریال)</th>
                                <th className="p-2 text-center">کل ارزش مغایرت</th>
                              </tr>
                            </thead>
                            <tbody>
                              {discrepancyItems.length === 0 ? (
                                <tr>
                                  <td colSpan={9} className="p-4 text-center text-slate-500 italic">هیچ مغایرتی در اقلام این انبارگردانی یافت نشد (موازنه صد درصدی فیزیکی و دفتری).</td>
                                </tr>
                              ) : (
                                discrepancyItems.map((item, idx) => {
                                  const prod = products.find(p => p.id === item.product_id);
                                  const variance = item.variance_qty || 0;
                                  const cost = item.system_unit_cost || prod?.standard_price || 0;
                                  return (
                                    <tr key={item.id} className="border-b border-slate-300 print:border-black hover:bg-slate-100/30">
                                      <td className="p-2 border-l border-slate-300 print:border-black text-center font-mono">{idx + 1}</td>
                                      <td className="p-2 border-l border-slate-300 print:border-black font-mono text-slate-500 print:text-black text-right">{prod?.code}</td>
                                      <td className="p-2 border-l border-slate-300 print:border-black font-bold text-right">
                                        {prod?.name} ({variance > 0 ? "مازاد انبار" : "کسری انبار"})
                                      </td>
                                      <td className="p-2 border-l border-slate-300 print:border-black text-center">{prod?.unit || "عدد"}</td>
                                      <td className="p-2 border-l border-slate-300 print:border-black text-center font-mono">{item.system_snapshot_qty}</td>
                                      <td className="p-2 border-l border-slate-300 print:border-black text-center font-mono">{item.final_accepted_qty}</td>
                                      <td className="p-2 border-l border-slate-300 print:border-black text-center font-mono font-bold">
                                        {variance > 0 ? `+${variance}` : `${variance}`}
                                      </td>
                                      <td className="p-2 border-l border-slate-300 print:border-black text-center font-mono">{cost.toLocaleString()}</td>
                                      <td className="p-2 text-center font-mono font-bold text-indigo-600 dark:text-indigo-400 print:text-black">
                                        {(Math.abs(variance) * cost).toLocaleString()} ریال
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Signatures Panel */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center mt-12 pt-12 border-t border-dashed border-slate-300 dark:border-slate-700 print:border-black print:text-black text-[10px] md:text-xs">
                    <div className="space-y-12">
                      <span className="font-bold block">امضا نماینده هیئت حسابرسی مستقل</span>
                      <div className="border-b border-dashed border-slate-300 dark:border-slate-600 w-2/3 mx-auto print:border-black" />
                    </div>
                    <div className="space-y-12">
                      <span className="font-bold block">امضا مدیر امور مالی و اداری</span>
                      <div className="border-b border-dashed border-slate-300 dark:border-slate-600 w-2/3 mx-auto print:border-black" />
                    </div>
                    <div className="space-y-12">
                      <span className="font-bold block">امضا سرپرست انبارگردانی فیزیکی</span>
                      <div className="border-b border-dashed border-slate-300 dark:border-slate-600 w-2/3 mx-auto print:border-black" />
                    </div>
                    <div className="space-y-12">
                      <span className="font-bold block">امضا و مهر مسئول انبار مرکزی</span>
                      <div className="border-b border-dashed border-slate-300 dark:border-slate-600 w-2/3 mx-auto print:border-black" />
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>
        )}

        {/* Stocktake Tab */}
        {activeTab === "stocktake" && (
          <div className="space-y-6 animate-fade-in text-right">
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
              
              {/* Left Column: Period list and creation */}
              <div className="xl:col-span-1 space-y-4">
                {/* Create Period Form */}
                <div className={`p-5 rounded-2xl border flex flex-col gap-4 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <h3 className="font-black text-sm text-indigo-500 flex items-center gap-2">
                    <Plus className="w-4 h-4" /> تعریف دوره انبارگردانی جدید
                  </h3>
                  
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">عنوان دوره</label>
                    <input 
                      type="text" 
                      placeholder="مثال: انبارگردانی پایان سال ۱۴۰۴"
                      value={newPeriodTitle}
                      onChange={e => setNewPeriodTitle(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">انتخاب انبار هدف</label>
                    <select 
                      value={newPeriodWarehouseId} 
                      onChange={e => setNewPeriodWarehouseId(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}
                    >
                      <option value="">انتخاب انبار...</option>
                      {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">تاریخ شروع</label>
                      <input 
                        type="text" 
                        value={newPeriodStartDate}
                        onChange={e => setNewPeriodStartDate(e.target.value)}
                        className={`w-full px-3 py-2 rounded-xl text-[11px] font-mono border outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">تاریخ پایان</label>
                      <input 
                        type="text" 
                        value={newPeriodEndDate}
                        onChange={e => setNewPeriodEndDate(e.target.value)}
                        className={`w-full px-3 py-2 rounded-xl text-[11px] font-mono border outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}
                      />
                    </div>
                  </div>

                  <button 
                    onClick={handleCreatePeriod}
                    className="mt-2 w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                  >
                    ایجاد دوره انبارگردانی
                  </button>
                </div>

                {/* Period List */}
                <div className={`p-5 rounded-2xl border flex flex-col gap-3 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <h3 className="font-black text-sm text-slate-400 flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4" /> لیست دوره‌های انبارگردانی
                  </h3>

                  {stocktakePeriods.length === 0 ? (
                    <p className="text-xs text-slate-500 italic text-center py-4">هیچ دوره‌ای تعریف نشده است.</p>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                      {stocktakePeriods.map(p => {
                        const wh = warehouses.find(w => w.id === p.warehouse_id);
                        const isSelected = activePeriodId === p.id;
                        return (
                          <div 
                            key={p.id} 
                            onClick={() => setActivePeriodId(p.id)}
                            className={`p-3 rounded-xl border transition-all cursor-pointer text-xs ${
                              isSelected 
                                ? (isDarkMode ? 'bg-indigo-950/40 border-indigo-500/70' : 'bg-indigo-50/70 border-indigo-200') 
                                : (isDarkMode ? 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700' : 'bg-slate-50 border-slate-100 hover:border-slate-200')
                            }`}
                          >
                            <div className="flex justify-between items-center mb-1.5">
                              <span className="font-bold text-slate-800 dark:text-slate-100">{p.title}</span>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${
                                p.status === StocktakePeriodStatus.OPEN ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                p.status === StocktakePeriodStatus.COUNTING ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                p.status === StocktakePeriodStatus.CALCULATING ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                                'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                              }`}>
                                {p.status === StocktakePeriodStatus.OPEN ? 'تعریف شده (OPEN)' :
                                 p.status === StocktakePeriodStatus.COUNTING ? 'در حال شمارش (COUNTING)' :
                                 p.status === StocktakePeriodStatus.CALCULATING ? 'در حال محاسبه (CALC)' : 'نهایی شده (FINALIZED)'}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 flex justify-between items-center">
                              <span>انبار: {wh?.name || "نامشخص"}</span>
                              <span className="font-mono">{p.start_date}</span>
                            </div>
                            
                            {p.status === StocktakePeriodStatus.OPEN && (
                              <div className="flex justify-end mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/50">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeletePeriod(p.id);
                                  }}
                                  className="text-[10px] text-rose-500 hover:text-rose-600 flex items-center gap-1 font-bold cursor-pointer"
                                >
                                  <Trash className="w-3 h-3" /> حذف دوره
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Detailed active period board */}
              <div className="xl:col-span-3 space-y-4">
                {!activePeriodId ? (
                  <div className={`p-12 text-center rounded-3xl border flex flex-col items-center justify-center gap-4 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <ClipboardList className="w-12 h-12 text-indigo-500 opacity-40 animate-pulse" />
                    <h3 className="font-black text-slate-800 dark:text-slate-200 text-sm">پنل مدیریت انبارگردانی فیزیکی</h3>
                    <p className="text-xs text-slate-500 max-w-md leading-relaxed">
                      لطفاً از منوی سمت چپ یک دوره انبارگردانی فعال را انتخاب کنید یا یک دوره جدید با تخصیص انبار تعریف نمایید.
                    </p>
                  </div>
                ) : (
                  (() => {
                    const period = stocktakePeriods.find(p => p.id === activePeriodId);
                    if (!period) return null;
                    const whName = warehouses.find(w => w.id === period.warehouse_id)?.name;
                    return (
                      <div className="space-y-4">
                        {/* Period header overview */}
                        <div className={`p-5 rounded-2xl border flex flex-col md:flex-row justify-between md:items-center gap-4 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                          <div>
                            <div className="flex items-center gap-2.5 mb-1">
                              <span className="text-xs font-bold text-indigo-500">دوره فعال انبارگردانی:</span>
                              <h2 className="font-black text-base text-slate-800 dark:text-slate-100">{period.title}</h2>
                            </div>
                            <p className="text-xs text-slate-500">
                              انبار هدف: <strong className="text-slate-700 dark:text-slate-300">{whName}</strong> | تاریخ شروع: <span className="font-mono">{period.start_date}</span> | تاریخ پایان: <span className="font-mono">{period.end_date}</span>
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-400">وضعیت فرآیند:</span>
                            <span className={`text-xs px-3 py-1 rounded-xl font-black border ${
                              period.status === StocktakePeriodStatus.OPEN ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/50' :
                              period.status === StocktakePeriodStatus.COUNTING ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/50' :
                              period.status === StocktakePeriodStatus.CALCULATING ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800/50' :
                              'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50'
                            }`}>
                              {period.status === StocktakePeriodStatus.OPEN ? '۱. باز (OPEN)' :
                               period.status === StocktakePeriodStatus.COUNTING ? '۲. شمارش فیزیکی (COUNTING)' :
                               period.status === StocktakePeriodStatus.CALCULATING ? '۳. تایید مغایرت (CALCULATING)' : '۴. نهایی شده (FINALIZED)'}
                            </span>
                          </div>
                        </div>

                        {/* State 1: OPEN (Needs Snapshot) */}
                        {period.status === StocktakePeriodStatus.OPEN && (
                          <div className={`p-8 rounded-2xl border text-center space-y-4 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                            <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mx-auto text-blue-500">
                              <Coins className="w-6 h-6" />
                            </div>
                            <h4 className="font-black text-slate-800 dark:text-slate-100 text-sm">مرحله ۱: تهیه موجودی دفتری (Snapshot)</h4>
                            <p className="text-xs text-slate-500 max-w-lg mx-auto leading-relaxed">
                              پیش از شروع شمارش عینی انبار، باید عکسی از موجودی دفتری کنونی سیستم به همراه ارزش فی (میانگین موزون) برای کالاها تهیه و قفل شود تا اختلافات دقیقاً با این مقادیر موازنه گردند.
                            </p>
                            <button 
                              onClick={() => handleCreateSnapshot(period.id)}
                              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                            >
                              قفل دفتری و شروع انبارگردانی
                            </button>
                          </div>
                        )}

                        {/* State 2: COUNTING (Multi stage counts submission) */}
                        {period.status === StocktakePeriodStatus.COUNTING && (
                          <div className={`p-5 rounded-2xl border space-y-4 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                              <div>
                                <h4 className="font-black text-sm flex items-center gap-2">
                                  <ClipboardList className="w-4 h-4 text-amber-500" /> ثبت مقادیر ممیزی (شمارش چندمرحله‌ای)
                                </h4>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                  به ترتیب شمارش اول، دوم و سوم را ثبت نمایید. مغایرت شمارش اول مستلزم شمارش دوم و مابقی مستلزم شمارش سوم (داوری نهایی) است.
                                </p>
                              </div>
                              
                              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 p-1.5 rounded-xl border border-slate-100 dark:border-slate-800">
                                <span className="text-[10px] font-black text-slate-400 px-2">مرحله فعال ثبت:</span>
                                {[1, 2, 3].map(stg => (
                                  <button 
                                    key={stg}
                                    onClick={() => setCountStageInput(stg as 1 | 2 | 3)}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                      countStageInput === stg 
                                        ? 'bg-amber-500 text-white shadow-sm' 
                                        : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900'
                                    }`}
                                  >
                                    شمارش {stg === 1 ? 'اول' : stg === 2 ? 'دوم' : 'سوم'}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Print Sheet Controls & Simulator helper */}
                            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setSelectedStocktakePrint({ period, type: 'blind_sheet' })}
                                  className="px-3 py-1.5 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-bold border border-slate-200 dark:border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Printer className="w-3.5 h-3.5 text-indigo-500" /> چاپ لیست شمارش سفید (نابینا)
                                </button>
                                <button
                                  onClick={() => setSelectedStocktakePrint({ period, type: 'standard_sheet' })}
                                  className="px-3 py-1.5 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-bold border border-slate-200 dark:border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Printer className="w-3.5 h-3.5 text-indigo-500" /> چاپ لیست همراه با موجودی دفتری
                                </button>
                              </div>
                              
                              <button
                                onClick={handleAutoFillCountsWithSnapshot}
                                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                              >
                                <Calculator className="w-3.5 h-3.5" /> پر کردن خودکار با مقادیر دفتری (دمو)
                              </button>
                            </div>

                            <div className="overflow-x-auto">
                              <table className="w-full text-right text-xs">
                                <thead>
                                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400">
                                    <th className="p-2">کد کالا</th>
                                    <th className="p-2">نام کالا</th>
                                    <th className="p-2 text-center">موجودی دفتری (snapshot)</th>
                                    <th className="p-2 text-center">شمارش ۱</th>
                                    <th className="p-2 text-center">شمارش ۲</th>
                                    <th className="p-2 text-center">شمارش ۳</th>
                                    <th className="p-2 text-center">وضعیت ممیزی</th>
                                    <th className="p-2 text-left">وارد کردن تعداد عینی (شمارش {countStageInput})</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {stocktakeItems.map(item => {
                                    const prod = products.find(p => p.id === item.product_id);
                                    
                                    // Check eligibility to edit this count stage
                                    let isEditable = false;
                                    if (countStageInput === 1) isEditable = true;
                                    if (countStageInput === 2 && item.status === StocktakeItemStatus.NEEDS_SECOND_COUNT) isEditable = true;
                                    if (countStageInput === 3 && item.status === StocktakeItemStatus.NEEDS_THIRD_COUNT) isEditable = true;

                                    return (
                                      <tr key={item.id} className="border-b last:border-0 border-slate-100 dark:border-slate-800/40 hover:bg-slate-50/50 dark:hover:bg-slate-950/20">
                                        <td className="p-2 font-mono text-slate-500">{prod?.code}</td>
                                        <td className="p-2 font-bold">{prod?.name}</td>
                                        <td className="p-2 text-center font-mono">{item.system_snapshot_qty}</td>
                                        <td className="p-2 text-center font-mono font-bold text-slate-500">{item.count_1_qty !== null ? item.count_1_qty : '-'}</td>
                                        <td className="p-2 text-center font-mono font-bold text-slate-500">{item.count_2_qty !== null ? item.count_2_qty : '-'}</td>
                                        <td className="p-2 text-center font-mono font-bold text-slate-500">{item.count_3_qty !== null ? item.count_3_qty : '-'}</td>
                                        <td className="p-2 text-center">
                                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                                            item.status === StocktakeItemStatus.MATCHED ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                            item.status === StocktakeItemStatus.NEEDS_SECOND_COUNT ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                            item.status === StocktakeItemStatus.NEEDS_THIRD_COUNT ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' :
                                            'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                          }`}>
                                            {item.status === StocktakeItemStatus.MATCHED ? 'منطبق' :
                                             item.status === StocktakeItemStatus.NEEDS_SECOND_COUNT ? 'نیاز به شمارش ۲' :
                                             item.status === StocktakeItemStatus.NEEDS_THIRD_COUNT ? 'مغایر (نیاز به داوری ۳)' : 'حل شده (RESOLVED)'}
                                          </span>
                                        </td>
                                        <td className="p-2 text-left">
                                          <input 
                                            type="number" 
                                            disabled={!isEditable}
                                            placeholder={isEditable ? "مقدار..." : "غیرمجاز در این وضعیت"}
                                            value={productCounts[item.product_id] !== undefined ? productCounts[item.product_id] : (isEditable ? "" : "")}
                                            onChange={e => handleSetCountValue(item.product_id, e.target.value)}
                                            className={`w-28 px-2 py-1 rounded-lg text-center text-xs border font-mono outline-none ${
                                              isEditable 
                                                ? (isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-800') 
                                                : 'bg-slate-100 dark:bg-slate-950/40 border-transparent text-slate-400 cursor-not-allowed'
                                            }`}
                                          />
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>

                            <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-800 pt-4 mt-2">
                              <button 
                                onClick={() => {
                                  try {
                                    inventoryEngine.set_calculating_status(period.id);
                                    showNotification("مرحله محاسبات نهایی فعال گردید.", "info");
                                    loadData();
                                  } catch(e: any) {
                                    showNotification(e.message, "error");
                                  }
                                }}
                                className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-950 cursor-pointer text-slate-600 dark:text-slate-300"
                              >
                                انتقال مستقیم به مرحله محاسبات و تایید نهایی
                              </button>
                              
                              <button 
                                onClick={() => handleSubmitCounts(countStageInput)}
                                className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                              >
                                ثبت شمارش {countStageInput === 1 ? 'اول' : countStageInput === 2 ? 'دوم' : 'سوم'}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* State 3: CALCULATING (Audit discrepancy calculation & final submit) */}
                        {period.status === StocktakePeriodStatus.CALCULATING && (
                          <div className={`p-5 rounded-2xl border space-y-4 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                              <h4 className="font-black text-sm flex items-center gap-2 text-purple-500">
                                <Calculator className="w-4 h-4" /> محاسبات نهایی مغایرت‌گیری و تایید داوری
                              </h4>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                موجودی نهایی پذیرفته شده بر اساس قوانین ممیزی مشخص شده است. برای اضافات، می‌توانید نرخ بازار آزاد را ثبت کنید، در غیر این صورت از بهای دفتری snapshot استفاده خواهد شد.
                              </p>
                            </div>

                            <div className="overflow-x-auto">
                              <table className="w-full text-right text-xs border-collapse">
                                <thead>
                                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400">
                                    <th className="p-2">کد کالا</th>
                                    <th className="p-2">نام کالا</th>
                                    <th className="p-2 text-center">دفتری (System)</th>
                                    <th className="p-2 text-center">پذیرفته شده نهایی</th>
                                    <th className="p-2 text-center">مقدار مغایرت</th>
                                    <th className="p-2 text-center">بهای واحد دفتری</th>
                                    <th className="p-2 text-center">ارزش کل مغایرت (ریال)</th>
                                    <th className="p-2 text-left">تعیین بهای بازار (مختص اضافات)</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {stocktakeItems.map(item => {
                                    const prod = products.find(p => p.id === item.product_id);
                                    
                                    // Make sure accepted is calculated
                                    let accepted = item.final_accepted_qty;
                                    if (accepted === null) {
                                      if (item.count_3_qty !== null) accepted = item.count_3_qty;
                                      else if (item.count_2_qty !== null) accepted = item.count_2_qty;
                                      else if (item.count_1_qty !== null) accepted = item.count_1_qty;
                                      else accepted = item.system_snapshot_qty;
                                    }
                                    const variance = accepted - item.system_snapshot_qty;
                                    const totalCost = Math.abs(variance) * item.system_unit_cost;

                                    return (
                                      <tr key={item.id} className="border-b last:border-0 border-slate-100 dark:border-slate-800/40 hover:bg-slate-50/50 dark:hover:bg-slate-950/20">
                                        <td className="p-2 font-mono text-slate-500">{prod?.code}</td>
                                        <td className="p-2 font-bold">{prod?.name}</td>
                                        <td className="p-2 text-center font-mono">{item.system_snapshot_qty}</td>
                                        <td className="p-2 text-center font-mono font-black text-indigo-500">{accepted}</td>
                                        <td className="p-2 text-center font-mono font-black" dir="ltr">
                                          <span className={variance > 0 ? "text-emerald-500" : variance < 0 ? "text-rose-500" : "text-slate-400"}>
                                            {variance > 0 ? '+' : ''}{variance}
                                          </span>
                                        </td>
                                        <td className="p-2 text-center font-mono">{item.system_unit_cost.toLocaleString()} ریال</td>
                                        <td className="p-2 text-center font-mono font-bold">
                                          {variance !== 0 ? (
                                            <span className={variance > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
                                              {totalCost.toLocaleString()} ریال
                                            </span>
                                          ) : '-'}
                                        </td>
                                        <td className="p-2 text-left">
                                          {variance > 0 ? (
                                            <input 
                                              type="number" 
                                              placeholder="بهای بازار آزاد..."
                                              value={marketCosts[item.product_id] !== undefined ? marketCosts[item.product_id] : ""}
                                              onChange={e => handleSetMarketCostValue(item.product_id, e.target.value)}
                                              className="w-32 px-2 py-1 rounded-lg text-center text-xs border font-mono outline-none bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700"
                                            />
                                          ) : (
                                            <span className="text-[10px] text-slate-400 italic">مختص مغایرت مثبت</span>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>

                            <div className="flex justify-end items-center gap-2 border-t border-slate-100 dark:border-slate-800 pt-4">
                              <button 
                                onClick={handleFinalizePeriod}
                                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                              >
                                نهایی‌سازی انبارگردانی و صدور اسناد تعدیل و اسناد مالی مالی
                              </button>
                            </div>
                          </div>
                        )}

                        {/* State 4: FINALIZED (Display results and generated JVs/adjustments) */}
                        {period.status === StocktakePeriodStatus.FINALIZED && (
                          <div className="space-y-4">
                            {/* Summary metrics */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className={`p-4 rounded-2xl border text-right ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'}`}>
                                <p className="text-[10px] font-bold text-slate-400 mb-1">تعداد کل اقلام ممیزی</p>
                                <p className="text-xl font-mono font-black text-slate-800 dark:text-slate-100">{stocktakeItems.length}</p>
                              </div>
                              <div className={`p-4 rounded-2xl border text-right ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'}`}>
                                <p className="text-[10px] font-bold text-emerald-500 mb-1">مغایرت‌های اضافی (سورپلاس)</p>
                                <p className="text-xl font-mono font-black text-emerald-600 dark:text-emerald-400">
                                  {stocktakeItems.filter(i => (i.variance_qty || 0) > 0).length} قلم کالا
                                </p>
                              </div>
                              <div className={`p-4 rounded-2xl border text-right ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'}`}>
                                <p className="text-[10px] font-bold text-rose-500 mb-1">مغایرت‌های کسری (دفیسیت)</p>
                                <p className="text-xl font-mono font-black text-rose-600 dark:text-rose-400">
                                  {stocktakeItems.filter(i => (i.variance_qty || 0) < 0).length} قلم کالا
                                </p>
                              </div>
                            </div>

                            {/* Final inventory items details */}
                            <div className={`p-5 rounded-2xl border space-y-4 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                                <h4 className="font-black text-sm flex items-center gap-2 text-emerald-500">
                                  <CheckCircle2 className="w-4 h-4" /> جزئیات ترازنامه پایانی مغایرت‌گیری انبار
                                </h4>
                                <button
                                  onClick={() => setSelectedStocktakePrint({ period, type: 'minutes' })}
                                  className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:hover:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                >
                                  <Printer className="w-4 h-4" /> چاپ صورت‌جلسه رسمی انبارگردانی
                                </button>
                              </div>
                              
                              <div className="overflow-x-auto">
                                <table className="w-full text-right text-xs border-collapse">
                                  <thead>
                                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400">
                                      <th className="p-2">کد کالا</th>
                                      <th className="p-2">نام کالا</th>
                                      <th className="p-2 text-center">موجودی دفتری شروع</th>
                                      <th className="p-2 text-center">موجودی واقعی شمارش شده</th>
                                      <th className="p-2 text-center">میزان مغایرت</th>
                                      <th className="p-2 text-center">ارزش واحد دفتری</th>
                                      <th className="p-2 text-center">ارزش کل موازنه مغایرت</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {stocktakeItems.map(item => {
                                      const prod = products.find(p => p.id === item.product_id);
                                      const variance = item.variance_qty || 0;
                                      const totalValue = Math.abs(variance) * item.system_unit_cost;

                                      return (
                                        <tr key={item.id} className="border-b last:border-0 border-slate-100 dark:border-slate-800/40 hover:bg-slate-50/50 dark:hover:bg-slate-950/20">
                                          <td className="p-2 font-mono text-slate-500">{prod?.code}</td>
                                          <td className="p-2 font-bold text-slate-700 dark:text-slate-300">{prod?.name}</td>
                                          <td className="p-2 text-center font-mono">{item.system_snapshot_qty}</td>
                                          <td className="p-2 text-center font-mono font-black text-indigo-500">{item.final_accepted_qty}</td>
                                          <td className="p-2 text-center font-mono font-black" dir="ltr">
                                            <span className={variance > 0 ? "text-emerald-500" : variance < 0 ? "text-rose-500" : "text-slate-400"}>
                                              {variance > 0 ? '+' : ''}{variance}
                                            </span>
                                          </td>
                                          <td className="p-2 text-center font-mono">{item.system_unit_cost.toLocaleString()} ریال</td>
                                          <td className="p-2 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                                            {variance !== 0 ? `${totalValue.toLocaleString()} ریال` : '-'}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            {/* Auto-generated JVs & Adjustments listings */}
                            <div className={`p-5 rounded-2xl border space-y-3 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                              <h4 className="font-black text-sm text-slate-400 mb-2">اسناد تعدیل انبار و ردیف‌های حسابداری صادر شده بابت مغایرت</h4>
                              
                              <div className="space-y-2">
                                {documents.filter(d => d.reference_id === period.id).map(doc => {
                                  return (
                                    <div key={doc.id} className={`p-3 rounded-xl border flex flex-col sm:flex-row justify-between sm:items-center gap-3 text-xs ${isDarkMode ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                                      <div>
                                        <p className="font-bold mb-1 text-slate-700 dark:text-slate-200">
                                          {doc.doc_type === WarehouseDocType.RECEIPT ? 'رسید تعدیلی انبار (اضافی انبار)' : 'حواله تعدیلی انبار (کسری انبار)'} - شماره {doc.doc_number}
                                        </p>
                                        <p className="text-[10px] text-slate-400">تاریخ ثبت: {doc.date} | شرح: {doc.description}</p>
                                      </div>

                                      <div className="flex gap-2">
                                        <button 
                                          onClick={() => handleViewVoucher(doc)}
                                          className="px-3 py-1.5 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400 rounded-lg text-[10px] font-bold hover:bg-indigo-100 transition cursor-pointer"
                                        >
                                          مشاهده سند حسابداری (آرتیکل متعادل)
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}

                                {documents.filter(d => d.reference_id === period.id).length === 0 && (
                                  <p className="text-xs text-slate-500 italic text-center py-2">هیچ سند مغایرتی برای این دوره صادر نشده است (موجودی دفتری با شمارش کاملاً منطبق بود).</p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()
                )}
              </div>

            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="space-y-6 animate-fade-in max-w-2xl mx-auto w-full">
            <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <h3 className="font-black text-sm mb-6 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-indigo-500" />
                روش قیمت‌گذاری حواله انبار
              </h3>
              
              <div className="space-y-4">
                {[
                  { value: PricingMethod.AVERAGE, label: "میانگین موزون (Weighted Average)", desc: "محاسبه قیمت خروجی بر اساس میانگین ارزش کل موجودی تقسیم بر تعداد موجود." },
                  { value: PricingMethod.FIFO, label: "اولین صادره از اولین وارده (FIFO)", desc: "کالاهایی که زودتر وارد انبار شده‌اند، زودتر خارج می‌شوند." },
                  { value: PricingMethod.LIFO, label: "اولین صادره از آخرین وارده (LIFO)", desc: "کالاهایی که دیرتر وارد انبار شده‌اند، زودتر خارج می‌شوند." },
                  { value: PricingMethod.STANDARD, label: "قیمت استاندارد (Standard)", desc: "خروج کالا با قیمت از پیش تعیین شده و ثابت در سیستم محاسبه می‌شود." },
                ].map(method => (
                  <label key={method.value} className={`flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-all border ${pricingMethod === method.value ? (isDarkMode ? 'bg-indigo-900/20 border-indigo-500/50' : 'bg-indigo-50 border-indigo-200') : (isDarkMode ? 'bg-slate-950 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-200 hover:border-slate-300')}`}>
                    <div className="mt-0.5">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${pricingMethod === method.value ? 'border-indigo-500' : 'border-slate-400'}`}>
                        {pricingMethod === method.value && <div className="w-2 h-2 rounded-full bg-indigo-500" />}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-bold mb-1">{method.label}</div>
                      <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{method.desc}</div>
                    </div>
                    <input 
                      type="radio" 
                      className="hidden" 
                      name="pricing_method" 
                      value={method.value} 
                      checked={pricingMethod === method.value}
                      onChange={() => handleApplyPricingMethod(method.value)}
                    />
                  </label>
                ))}
              </div>
              
              <div className={`mt-6 p-4 rounded-xl text-xs leading-relaxed ${isDarkMode ? 'bg-amber-900/10 text-amber-500 border border-amber-900/30' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                <strong>توجه:</strong> با تغییر روش قیمت‌گذاری، سیستم بلافاصله ارزش‌گذاری کاردکس کالاها و اسناد خروجی (حواله‌ها) را بازطراحی و مجدداً محاسبه می‌کند. این عملیات در مقیاس‌های بزرگ زمان‌بر است اما اینجا به صورت بلادرنگ برای دموی محاسباتی پیاده شده است.
              </div>
            </div>
          </div>
        )}

        {/* Kardex Row Inspection Modal */}
        {selectedKardexRow && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" dir="rtl">
            <div className={`w-full max-w-4xl max-h-[85vh] overflow-y-auto rounded-3xl border shadow-2xl flex flex-col p-6 md:p-8 ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-100 text-slate-800'}`}>
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
                <div>
                  <h3 className="font-black text-base text-slate-850 dark:text-slate-100">بررسی تفصیلی تراکنش و اسناد تابعه</h3>
                  <p className="text-xs text-slate-500 mt-1">رهگیری زنجیره ارزش کالا از سند فیزیکی انبار تا سند دوبل حسابداری</p>
                </div>
                <button 
                  onClick={() => setSelectedKardexRow(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 transition cursor-pointer font-bold text-xs"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* 1. Physical Doc Metadata */}
                <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-950/30 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                  <h4 className="font-black text-xs text-slate-400 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-500" /> مشخصات عمومی سند انبار
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 block mb-0.5">شماره سند فیزیکی:</span>
                      <strong className="font-mono font-black text-indigo-500">{selectedKardexRow.doc.doc_number}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">تاریخ ثبت:</span>
                      <strong className="font-mono">{selectedKardexRow.doc.date}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">نوع رویداد:</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        selectedKardexRow.doc.doc_type === WarehouseDocType.RECEIPT ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' :
                        selectedKardexRow.doc.doc_type === WarehouseDocType.REMITTANCE ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400' :
                        selectedKardexRow.doc.doc_type === WarehouseDocType.TRANSFER ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400' :
                        'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400'
                      }`}>
                        {selectedKardexRow.doc.doc_type === WarehouseDocType.RECEIPT ? 'رسید انبار (ورود)' :
                         selectedKardexRow.doc.doc_type === WarehouseDocType.REMITTANCE ? 'حواله انبار (خروج)' :
                         selectedKardexRow.doc.doc_type === WarehouseDocType.TRANSFER ? 'حواله انتقال بین انبارها' : 'تعدیل انبارگردانی'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">وضعیت تایید:</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        selectedKardexRow.doc.status === DocStatus.DRAFT ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' :
                        selectedKardexRow.doc.status === DocStatus.CONFIRMED ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400' :
                        'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                      }`}>
                        {selectedKardexRow.doc.status === DocStatus.DRAFT ? 'پیش‌نویس دفتری' :
                         selectedKardexRow.doc.status === DocStatus.CONFIRMED ? 'تایید نهایی انباردار' : 'سند مالی صادر شده'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">انبار مبدأ:</span>
                      <span>{warehouses.find(w => w.id === selectedKardexRow.doc.source_warehouse_id)?.name || "امانی / تامین خارج"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">انبار مقصد:</span>
                      <span>{warehouses.find(w => w.id === selectedKardexRow.doc.destination_warehouse_id)?.name || "مصرف‌کننده / فروش"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">صادرکننده:</span>
                      <strong className="text-slate-500">{selectedKardexRow.doc.created_by || "سیستم مکانیزه"}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">شرح پیوست:</span>
                      <span className="text-slate-500 truncate block" title={selectedKardexRow.doc.description || ""}>{selectedKardexRow.doc.description || "بدون شرح پیوست"}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Document Lines (Items Table) */}
                <div className="space-y-2">
                  <h4 className="font-black text-xs text-slate-400 flex items-center gap-2">
                    <Boxes className="w-4 h-4 text-indigo-500" /> اقلام و ردیف‌های کالا در آرتیکل سند
                  </h4>
                  <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-xl">
                    <table className="w-full text-right text-xs border-collapse">
                      <thead>
                        <tr className={`border-b text-[11px] ${isDarkMode ? 'border-slate-800 text-slate-400 bg-slate-950/30' : 'border-slate-100 text-slate-500 bg-slate-50/70'}`}>
                          <th className="p-2.5">ردیف</th>
                          <th className="p-2.5">کد کالا</th>
                          <th className="p-2.5">نام کالا</th>
                          <th className="p-2.5 text-center">تعداد فیزیکی</th>
                          <th className="p-2.5 text-left">فی واحد (ریال)</th>
                          <th className="p-2.5 text-left">ارزش کل ناخالص (ریال)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedKardexRow.doc.lines.map((line: any, idx: number) => {
                          const prod = products.find(p => p.id === line.product_id);
                          const totalVal = line.total_cost || (line.quantity * line.unit_cost);
                          return (
                            <tr key={idx} className="border-b last:border-0 border-slate-100 dark:border-slate-800/45 hover:bg-slate-50/20">
                              <td className="p-2.5 font-mono text-slate-400">{idx + 1}</td>
                              <td className="p-2.5 font-mono text-slate-500">{prod?.code || "نامشخص"}</td>
                              <td className="p-2.5 font-bold text-slate-700 dark:text-slate-300">{prod?.name || "کالای عمومی حذف شده"}</td>
                              <td className="p-2.5 text-center font-mono font-bold">{Math.abs(line.quantity)}</td>
                              <td className="p-2.5 text-left font-mono">{line.unit_cost.toLocaleString()} ریال</td>
                              <td className="p-2.5 text-left font-mono font-black text-slate-800 dark:text-slate-100">{totalVal.toLocaleString()} ریال</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 3. Double-entry Financial Accounting Voucher (Journal Voucher) */}
                <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-slate-950/20 border-slate-800' : 'bg-slate-50/30 border-slate-100'}`}>
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4">
                    <div>
                      <h4 className="font-black text-xs text-slate-400 flex items-center gap-2">
                        <Receipt className="w-4 h-4 text-emerald-500" /> سند حسابداری همزمان و تراز (Double-Entry Accounting)
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-1">تراکنش‌های بدهکار/بستانکار ثبت شده در سیستم کل مالی به ازای رویداد فیزیکی انبار</p>
                    </div>

                    {selectedKardexRow.doc.status === DocStatus.CONFIRMED && (
                      <button 
                        onClick={() => {
                          handleGenerateAccountingVoucher(selectedKardexRow.doc.id);
                          // Refresh the modal state
                          const updatedDoc = documents.find(d => d.id === selectedKardexRow.doc.id);
                          if (updatedDoc) {
                            setSelectedKardexRow({
                              ...selectedKardexRow,
                              doc: updatedDoc
                            });
                          }
                        }}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold transition shadow-sm cursor-pointer"
                      >
                        صدور و تصویب سند حسابداری مالی انبار
                      </button>
                    )}
                  </div>

                  {(() => {
                    // Try to find if JV exists in local storage
                    const savedV = localStorage.getItem("vouchers_data");
                    const savedL = localStorage.getItem("voucher_lines_data");
                    if (savedV && savedL) {
                      const headers = JSON.parse(savedV);
                      const lines = JSON.parse(savedL);
                      const header = headers.find((h: any) => h.reference_number === selectedKardexRow.doc.doc_number);
                      if (header) {
                        const matchingLines = lines.filter((l: any) => l.voucher_id === header.id);
                        const accountsSaved = localStorage.getItem("chart_of_accounts");
                        const accountsList = accountsSaved ? JSON.parse(accountsSaved) : [];
                        const processedLines = matchingLines.map((l: any) => {
                          const acc = accountsList.find((a: any) => a.id === l.account_id);
                          return {
                            ...l,
                            account_name: acc ? acc.name : l.account_id,
                            account_code: acc ? acc.code : ""
                          };
                        });

                        const totalDebit = processedLines.reduce((s: number, l: any) => s + (l.debit || 0), 0);
                        const totalCredit = processedLines.reduce((s: number, l: any) => s + (l.credit || 0), 0);

                        return (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[10px] bg-slate-100/50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-200/50 dark:border-slate-800 font-mono">
                              <div>
                                <span className="text-slate-400 font-sans block">شماره سند مالی:</span>
                                <strong className="text-slate-700 dark:text-slate-200">#{header.voucher_number}</strong>
                              </div>
                              <div>
                                <span className="text-slate-400 font-sans block">شناسه یکتای حسابداری:</span>
                                <strong className="text-slate-500">{header.id}</strong>
                              </div>
                              <div>
                                <span className="text-slate-400 font-sans block">وضعیت سند مالی:</span>
                                <span className="text-emerald-500 font-bold font-sans">مصوب (Approved)</span>
                              </div>
                              <div>
                                <span className="text-slate-400 font-sans block">تاریخ صدور سند:</span>
                                <span className="text-slate-600 dark:text-slate-300">{header.date}</span>
                              </div>
                            </div>

                            <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-xl">
                              <table className="w-full text-right text-xs border-collapse">
                                <thead>
                                  <tr className={`border-b text-[10px] ${isDarkMode ? 'border-slate-800 text-slate-400 bg-slate-950/30' : 'border-slate-100 text-slate-500 bg-slate-50/70'}`}>
                                    <th className="p-2 font-bold">کد حساب</th>
                                    <th className="p-2 font-bold">حساب کل / معین</th>
                                    <th className="p-2 font-bold">شرح حسابداری آرتیکل</th>
                                    <th className="p-2 font-bold text-left text-emerald-500">بدهکار (Debit)</th>
                                    <th className="p-2 font-bold text-left text-rose-500">بستانکار (Credit)</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {processedLines.map((l: any, i: number) => (
                                    <tr key={i} className="border-b last:border-0 border-slate-100 dark:border-slate-800/40 hover:bg-slate-50/10">
                                      <td className="p-2 font-mono text-[11px] text-slate-400">{l.account_code || l.account_id}</td>
                                      <td className="p-2 font-black text-slate-700 dark:text-slate-300">{l.account_name}</td>
                                      <td className="p-2 text-slate-500 max-w-xs truncate" title={l.description}>{l.description}</td>
                                      <td className="p-2 text-left font-mono font-bold text-emerald-500">{l.debit > 0 ? `${l.debit.toLocaleString()} ریال` : '۰'}</td>
                                      <td className="p-2 text-left font-mono font-bold text-rose-500">{l.credit > 0 ? `${l.credit.toLocaleString()} ریال` : '۰'}</td>
                                    </tr>
                                  ))}
                                  {/* Balance verification row */}
                                  <tr className="bg-slate-100/30 dark:bg-slate-950/20 font-black text-[11px]">
                                    <td colSpan={3} className="p-2.5 text-center text-indigo-500">موازنه و تراز کل سند حسابداری:</td>
                                    <td className="p-2.5 text-left font-mono text-emerald-500 border-t-2 border-double border-emerald-500">{totalDebit.toLocaleString()} ریال</td>
                                    <td className="p-2.5 text-left font-mono text-rose-500 border-t-2 border-double border-rose-500">{totalCredit.toLocaleString()} ریال</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                        );
                      }
                    }

                    return (
                      <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-950/20 text-center text-slate-500 text-xs">
                        {selectedKardexRow.doc.status === DocStatus.DRAFT ? (
                          <p>⚠️ این سند فیزیکی در وضعیت پیش‌نویس (DRAFT) انبارداری قرار دارد. ابتدا سند فیزیکی را در بخش اسناد تایید نهایی کنید تا قابلیت صدور آرتیکل‌های حسابداری همزمان فعال شود.</p>
                        ) : (
                          <p>🛡️ سند حسابداری دوبل مالی برای این رویداد هنوز صادر نشده است. بر روی دکمه «صدور و تصویب سند حسابداری» در بالا کلیک کنید تا آرتیکل‌های ترازنامه و بهای تمام شده به طور خودکار صادر و ثبت شوند.</p>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button 
                  onClick={() => setSelectedKardexRow(null)}
                  className="px-6 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer"
                >
                  بستن دریچه بررسی
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default InventoryModule;
