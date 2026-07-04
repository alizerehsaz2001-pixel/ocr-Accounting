export enum WarehouseDocType {
  RECEIPT = "RECEIPT", // رسید انبار (ورود)
  REMITTANCE = "REMITTANCE", // حواله انبار (خروج)
  ISSUE = "ISSUE", // سازگاری با سیستم‌های قدیمی‌تر (حواله)
  TRANSFER = "TRANSFER", // انتقال بین انبارها
  ADJUSTMENT = "ADJUSTMENT" // تعدیل (کسر و اضافه انبارگردانی)
}

export enum DocStatus {
  DRAFT = "DRAFT",
  CONFIRMED = "CONFIRMED",
  ACCOUNTED = "ACCOUNTED"
}

export enum ReferenceType {
  PURCHASE = "PURCHASE",
  SALE = "SALE",
  PRODUCTION = "PRODUCTION",
  INITIAL_BALANCE = "INITIAL_BALANCE",
  NONE = "NONE"
}

export enum TransactionReferenceType {
  PURCHASE = "PURCHASE",
  SALE = "SALE",
  PURCHASE_RETURN = "PURCHASE_RETURN",
  SALE_RETURN = "SALE_RETURN",
  INVENTORY_RECEIPT = "INVENTORY_RECEIPT",
  INVENTORY_REMITTANCE = "INVENTORY_REMITTANCE",
  STOCK_ADJUSTMENT = "STOCK_ADJUSTMENT"
}

export interface InventoryTransaction {
  id: string; // BIGINT PRIMARY KEY
  product_id: string; // INT FK
  warehouse_id: string; // INT FK
  transaction_date: number; // TIMESTAMP (Using UNIX timestamp)
  date_display: string; // For UI
  reference_type: TransactionReferenceType; // ENUM
  reference_id: string; // FK or Document Number
  
  qty_in: number; // DECIMAL
  unit_cost_in: number; // DECIMAL
  total_cost_in: number; // DECIMAL
  
  qty_out: number; // DECIMAL
  unit_cost_out: number; // DECIMAL
  total_cost_out: number; // DECIMAL
  
  running_qty: number; // DECIMAL
  running_avg_cost: number; // DECIMAL
  running_total_value: number; // DECIMAL
}

export enum PricingMethod {
  AVERAGE = "AVERAGE",
  FIFO = "FIFO",
  LIFO = "LIFO",
  STANDARD = "STANDARD"
}

export interface Warehouse {
  id: string;
  name: string;
  manager: string;
  location: string;
}

export interface ProductItem {
  id: string;
  code: string;
  name: string;
  unit: string;
  standard_price?: number; // Used for STANDARD pricing
}

export interface WarehouseDocLine {
  id: string;
  document_id: string; // FK to warehouse_documents
  product_id: string; // FK to products
  qty: number; // Legacy qty
  quantity: number; // Quantity
  unit_price: number; // Legacy unit_price
  unit_cost: number; // Unit Cost
  total_price: number; // Legacy total_price
  total_cost: number; // Total Cost
  description: string;
}

export interface WarehouseDocument {
  id: string;
  doc_number: string;
  internal_serial: number;
  doc_type: WarehouseDocType;
  reference_type: ReferenceType;
  reference_id: string | null;
  source_warehouse_id: string | null;
  destination_warehouse_id: string | null;
  date: string; // Legacy date (Y/M/D)
  doc_date: string; // Document date
  status: DocStatus;
  created_by: string;
  description: string;
  lines: WarehouseDocLine[];
}

export interface StocktakeTag {
  id: string;
  stocktake_id: string; // Grouping ID
  warehouse_id: string;
  product_id: string;
  counted_qty: number;
  system_qty: number;
  difference: number;
  status: "DRAFT" | "APPLIED";
}

export enum StocktakePeriodStatus {
  OPEN = "OPEN",
  COUNTING = "COUNTING",
  CALCULATING = "CALCULATING",
  FINALIZED = "FINALIZED"
}

export enum StocktakeItemStatus {
  MATCHED = "MATCHED",
  NEEDS_SECOND_COUNT = "NEEDS_SECOND_COUNT",
  NEEDS_THIRD_COUNT = "NEEDS_THIRD_COUNT",
  RESOLVED = "RESOLVED"
}

export interface StocktakePeriod {
  id: string;
  title: string;
  warehouse_id: string;
  start_date: string;
  end_date: string;
  status: StocktakePeriodStatus;
}

export interface StocktakeItem {
  id: string;
  period_id: string;
  product_id: string;
  system_snapshot_qty: number;
  system_unit_cost: number;
  count_1_qty: number | null;
  count_2_qty: number | null;
  count_3_qty: number | null;
  final_accepted_qty: number | null;
  variance_qty: number | null;
  status: StocktakeItemStatus;
}

export interface StocktakeAdjustment {
  id: string;
  period_id: string;
  item_id: string;
  doc_id: string;
  type: "RECEIPT" | "REMITTANCE";
}

// Keeping InventoryLedgerEntry mapped to InventoryTransaction for backward UI compatibility
export interface InventoryLedgerEntry {
  id: string;
  date: string;
  doc_id: string;
  doc_number: string;
  type: WarehouseDocType;
  warehouse_id: string;
  product_id: string;
  qty_in: number;
  qty_out: number;
  unit_price: number;
  total_value: number;
  balance_qty: number;
  balance_value: number;
}

export class InventoryEngine {
  private warehouses: Warehouse[] = [];
  private products: ProductItem[] = [];
  private documents: WarehouseDocument[] = [];
  private tags: StocktakeTag[] = [];
  private ledger: InventoryLedgerEntry[] = [];
  
  // Stocktake periods & items
  private stocktake_periods: StocktakePeriod[] = [];
  private stocktake_items: StocktakeItem[] = [];
  private stocktake_adjustments: StocktakeAdjustment[] = [];
  
  // New Cardex Table
  private inventory_transactions: InventoryTransaction[] = [];
  
  private pricingMethod: PricingMethod = PricingMethod.AVERAGE;

  constructor() {
    this.loadFromStorage();
    if (this.warehouses.length === 0) {
      this.seedInitialData();
    }
    this.recalculateLedger(); // legacy compat
  }

  private loadFromStorage() {
    try {
      const w = localStorage.getItem("inventory_warehouses_db");
      if (w) this.warehouses = JSON.parse(w);

      const p = localStorage.getItem("inventory_products_db");
      if (p) this.products = JSON.parse(p);

      const d = localStorage.getItem("inventory_documents_db");
      if (d) this.documents = JSON.parse(d);

      const t = localStorage.getItem("inventory_tags_db");
      if (t) this.tags = JSON.parse(t);

      const sp = localStorage.getItem("inventory_stocktake_periods_db");
      if (sp) this.stocktake_periods = JSON.parse(sp);

      const si = localStorage.getItem("inventory_stocktake_items_db");
      if (si) this.stocktake_items = JSON.parse(si);

      const sa = localStorage.getItem("inventory_stocktake_adjustments_db");
      if (sa) this.stocktake_adjustments = JSON.parse(sa);

      const pm = localStorage.getItem("inventory_pricing_method");
      if (pm) this.pricingMethod = pm as PricingMethod;
      
      const tx = localStorage.getItem("inventory_transactions_db");
      if (tx) this.inventory_transactions = JSON.parse(tx);
    } catch (e) {
      console.error("Failed to load inventory DB", e);
    }
  }

  private saveToStorage() {
    localStorage.setItem("inventory_warehouses_db", JSON.stringify(this.warehouses));
    localStorage.setItem("inventory_products_db", JSON.stringify(this.products));
    localStorage.setItem("inventory_documents_db", JSON.stringify(this.documents));
    localStorage.setItem("inventory_tags_db", JSON.stringify(this.tags));
    localStorage.setItem("inventory_stocktake_periods_db", JSON.stringify(this.stocktake_periods));
    localStorage.setItem("inventory_stocktake_items_db", JSON.stringify(this.stocktake_items));
    localStorage.setItem("inventory_stocktake_adjustments_db", JSON.stringify(this.stocktake_adjustments));
    localStorage.setItem("inventory_pricing_method", this.pricingMethod);
    localStorage.setItem("inventory_transactions_db", JSON.stringify(this.inventory_transactions));
  }

  // --- CORE CARDEX ALGORITHM START ---

  /**
   * insert_transaction(transaction_data):
   * Logs a movement chronologically. Automatically computes moving average cost.
   * STRICT NEGATIVE INVENTORY PREVENTION on Outbounds.
   */
  public insert_transaction(data: Omit<InventoryTransaction, "id" | "unit_cost_out" | "total_cost_out" | "running_qty" | "running_avg_cost" | "running_total_value">) {
    // 1. Get the previous running totals before this transaction date
    const prevTx = this.get_last_transaction_before(data.product_id, data.warehouse_id, data.transaction_date);
    
    let current_qty = prevTx ? prevTx.running_qty : 0;
    let current_total_value = prevTx ? prevTx.running_total_value : 0;
    let current_avg_cost = prevTx ? prevTx.running_avg_cost : 0;

    let new_qty = current_qty;
    let new_total_value = current_total_value;
    let new_avg_cost = current_avg_cost;

    let unit_cost_out = 0;
    let total_cost_out = 0;

    // Check if INBOUND
    if (data.qty_in > 0) {
      new_qty = current_qty + data.qty_in;
      new_total_value = current_total_value + data.total_cost_in;
      new_avg_cost = new_qty > 0 ? (new_total_value / new_qty) : 0;
    } 
    // Check if OUTBOUND
    else if (data.qty_out > 0) {
      if (current_qty < data.qty_out) {
        throw new Error(`موجودی ناکافی. موجودی فعلی: ${current_qty}، مقدار درخواستی: ${data.qty_out}`);
      }
      
      unit_cost_out = current_avg_cost;
      total_cost_out = data.qty_out * unit_cost_out;
      
      new_qty = current_qty - data.qty_out;
      new_total_value = current_total_value - total_cost_out;
      new_avg_cost = current_avg_cost; // Avg Cost remains unchanged on outbound
      
      // rounding artifacts protection
      if (new_qty <= 0) {
        new_total_value = 0;
        new_avg_cost = 0;
      }
    }

    const tx: InventoryTransaction = {
      ...data,
      id: "tx-" + Math.random().toString(36).substring(2, 9),
      unit_cost_out,
      total_cost_out,
      running_qty: new_qty,
      running_avg_cost: new_avg_cost,
      running_total_value: new_total_value
    };

    this.inventory_transactions.push(tx);
    
    // Check if backdated (if there are transactions after this one)
    const hasSubsequent = this.inventory_transactions.some(t => 
      t.product_id === data.product_id && 
      t.warehouse_id === data.warehouse_id && 
      t.transaction_date > data.transaction_date
    );

    if (hasSubsequent) {
      this.recalculate_cardex(data.product_id, data.warehouse_id, data.transaction_date);
    }
    
    this.saveToStorage();
    this.sync_ledger_for_ui(); // Sync to legacy UI structure
    return tx;
  }

  /**
   * recalculate_cardex:
   * Re-evaluates running quantity, average cost, and total cost sequentially 
   * for backdated entries to fix the domino effect.
   */
  public recalculate_cardex(product_id: string, warehouse_id: string, start_date: number) {
    // 1. Fetch all transactions for the product/warehouse, ordered by transaction_date ASC
    let targetTxs = this.inventory_transactions
      .filter(t => t.product_id === product_id && t.warehouse_id === warehouse_id)
      .sort((a, b) => a.transaction_date - b.transaction_date);

    // 2. Find where to start recalculating
    const startIndex = targetTxs.findIndex(t => t.transaction_date >= start_date);
    if (startIndex <= 0) {
      // Need to recalculate from beginning if no previous transactions
    }

    let current_qty = 0;
    let current_total_value = 0;
    let current_avg_cost = 0;

    if (startIndex > 0) {
      const prev = targetTxs[startIndex - 1];
      current_qty = prev.running_qty;
      current_total_value = prev.running_total_value;
      current_avg_cost = prev.running_avg_cost;
    }

    // 3. Sequentially recalculate
    for (let i = startIndex >= 0 ? startIndex : 0; i < targetTxs.length; i++) {
      let tx = targetTxs[i];
      
      if (tx.qty_in > 0) {
        current_qty += tx.qty_in;
        current_total_value += tx.total_cost_in;
        current_avg_cost = current_qty > 0 ? (current_total_value / current_qty) : 0;
      } else if (tx.qty_out > 0) {
        // Warning: this could lead to negative inventory during recalculation if not careful
        // In a strict ERP, we should flag this or block the backdated insertion entirely
        tx.unit_cost_out = current_avg_cost;
        tx.total_cost_out = tx.qty_out * current_avg_cost;
        
        current_qty -= tx.qty_out;
        current_total_value -= tx.total_cost_out;
        
        if (current_qty <= 0) {
          current_total_value = 0;
          current_avg_cost = 0;
        }
      }
      
      tx.running_qty = current_qty;
      tx.running_total_value = current_total_value;
      tx.running_avg_cost = current_avg_cost;
    }

    // Replace old transactions with recalculated ones
    this.inventory_transactions = this.inventory_transactions.map(t => {
      const updated = targetTxs.find(ut => ut.id === t.id);
      return updated ? updated : t;
    });

    this.saveToStorage();
    this.sync_ledger_for_ui();
  }

  private get_last_transaction_before(product_id: string, warehouse_id: string, date: number): InventoryTransaction | null {
    const txs = this.inventory_transactions
      .filter(t => t.product_id === product_id && t.warehouse_id === warehouse_id && t.transaction_date < date)
      .sort((a, b) => b.transaction_date - a.transaction_date); // DESC
      
    return txs.length > 0 ? txs[0] : null;
  }

  // Bridging Cardex Engine to existing UI
  private sync_ledger_for_ui() {
    const groups: Record<string, InventoryTransaction[]> = {};
    this.inventory_transactions.forEach(tx => {
      const key = `${tx.product_id}_${tx.warehouse_id}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(tx);
    });

    const calculatedEntries: InventoryLedgerEntry[] = [];

    for (const key of Object.keys(groups)) {
      const txs = [...groups[key]].sort((a, b) => a.transaction_date - b.transaction_date);
      const [productId, warehouseId] = key.split('_');
      const product = this.products.find(p => p.id === productId);
      const standardPrice = product?.standard_price || 100000;

      let running_qty = 0;
      let running_total_value = 0;
      const batches: Array<{ qty: number; cost: number }> = [];

      txs.forEach(tx => {
        let unit_price = 0;
        let total_value = 0;

        if (tx.qty_in > 0) {
          running_qty += tx.qty_in;
          const cost_in = tx.unit_cost_in || standardPrice;
          
          if (this.pricingMethod === PricingMethod.STANDARD) {
            unit_price = standardPrice;
            total_value = tx.qty_in * standardPrice;
            running_total_value = running_qty * standardPrice;
          } else {
            unit_price = cost_in;
            total_value = tx.qty_in * cost_in;
            batches.push({ qty: tx.qty_in, cost: cost_in });
            running_total_value += total_value;
          }
        } else if (tx.qty_out > 0) {
          const qty_out = tx.qty_out;
          running_qty -= qty_out;

          if (this.pricingMethod === PricingMethod.STANDARD) {
            unit_price = standardPrice;
            total_value = qty_out * standardPrice;
            running_total_value = running_qty * standardPrice;
          } else if (this.pricingMethod === PricingMethod.AVERAGE) {
            const prevQty = running_qty + qty_out;
            const avgCost = prevQty > 0 ? (running_total_value / prevQty) : 0;
            unit_price = avgCost;
            total_value = qty_out * avgCost;
            running_total_value -= total_value;
          } else if (this.pricingMethod === PricingMethod.FIFO) {
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
            unit_price = qty_out > 0 ? val_out / qty_out : 0;
            total_value = val_out;
            
            // Apply mutated batches back to the main batches
            batches.length = 0;
            batches.push(...batchCopies);
            running_total_value = batches.reduce((sum, b) => sum + b.qty * b.cost, 0);
          } else if (this.pricingMethod === PricingMethod.LIFO) {
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
            unit_price = qty_out > 0 ? val_out / qty_out : 0;
            total_value = val_out;
            
            batches.length = 0;
            batches.push(...batchCopies);
            running_total_value = batches.reduce((sum, b) => sum + b.qty * b.cost, 0);
          }
        }

        if (running_qty <= 0) {
          running_total_value = 0;
        }

        calculatedEntries.push({
          id: tx.id,
          date: tx.date_display,
          doc_id: tx.reference_id,
          doc_number: tx.reference_id,
          type: tx.reference_type as any as WarehouseDocType,
          warehouse_id: tx.warehouse_id,
          product_id: tx.product_id,
          qty_in: tx.qty_in,
          qty_out: tx.qty_out,
          unit_price: Math.round(unit_price),
          total_value: Math.round(total_value),
          balance_qty: running_qty,
          balance_value: Math.round(running_total_value)
        });
      });
    }

    this.ledger = calculatedEntries.sort((a, b) => a.date.localeCompare(b.date));
  }

  // --- CORE CARDEX ALGORITHM END ---

  private seedInitialData() {
    this.warehouses = [
      { id: "w-1", name: "انبار مرکزی", manager: "علی احمدی", location: "تهران" },
      { id: "w-2", name: "انبار قطعات", manager: "رضا کریمی", location: "کرج" },
    ];
    this.products = [
      { id: "p-1", code: "P-1001", name: "لپ‌تاپ لنوو", unit: "عدد", standard_price: 150000000 },
      { id: "p-2", code: "P-1002", name: "موس بی‌سیم", unit: "عدد", standard_price: 2500000 },
      { id: "p-3", code: "P-1003", name: "کیبورد مکانیکی", unit: "عدد", standard_price: 4500000 },
    ];
    this.documents = [
      {
        id: "doc-1",
        doc_number: "INV-1001",
        internal_serial: 1,
        doc_type: WarehouseDocType.RECEIPT,
        reference_type: ReferenceType.INITIAL_BALANCE,
        reference_id: null,
        source_warehouse_id: null,
        destination_warehouse_id: "w-1",
        date: "1403/01/15",
        doc_date: "1403/01/15",
        status: DocStatus.ACCOUNTED,
        created_by: "سیستم انبار",
        description: "موجودی اولیه سال",
        lines: [
          {
            id: "l-1",
            document_id: "doc-1",
            product_id: "p-1",
            qty: 50,
            quantity: 50,
            unit_price: 140000000,
            unit_cost: 140000000,
            total_price: 7000000000,
            total_cost: 7000000000,
            description: "موجودی اولیه سال"
          },
          {
            id: "l-2",
            document_id: "doc-1",
            product_id: "p-2",
            qty: 200,
            quantity: 200,
            unit_price: 2000000,
            unit_cost: 2000000,
            total_price: 400000000,
            total_cost: 400000000,
            description: "موجودی اولیه سال"
          }
        ]
      }
    ];
    
    // Seed initial cardex transactions
    if (this.inventory_transactions.length === 0) {
      const now = Date.now();
      this.insert_transaction({
        product_id: "p-1",
        warehouse_id: "w-1",
        transaction_date: now - 100000,
        date_display: "1403/01/15",
        reference_type: TransactionReferenceType.INVENTORY_RECEIPT,
        reference_id: "INV-1001",
        qty_in: 50,
        unit_cost_in: 140000000,
        total_cost_in: 7000000000,
        qty_out: 0
      });
      this.insert_transaction({
        product_id: "p-2",
        warehouse_id: "w-1",
        transaction_date: now - 90000,
        date_display: "1403/01/15",
        reference_type: TransactionReferenceType.INVENTORY_RECEIPT,
        reference_id: "INV-1001",
        qty_in: 200,
        unit_cost_in: 2000000,
        total_cost_in: 400000000,
        qty_out: 0
      });
    }

    this.saveToStorage();
  }

  // Set Pricing Method
  public setPricingMethod(method: PricingMethod) {
    this.pricingMethod = method;
    this.saveToStorage();
    this.recalculateLedger();
  }

  public getPricingMethod(): PricingMethod {
    return this.pricingMethod;
  }

  // Getters
  public getWarehouses() { return this.warehouses; }
  public getProducts() { return this.products; }
  public getDocuments() { return this.documents; }
  public getTags() { return this.tags; }
  public getLedger() { return this.ledger; }
  public getTransactions() { return this.inventory_transactions; }

  // Recalculate Ledger & Pricing
  public recalculateLedger() {
    this.sync_ledger_for_ui();
  }

  // Helper method to obtain current stock
  public get_current_stock(product_id: string, warehouse_id: string): number {
    return this.getProductStock(warehouse_id, product_id);
  }

  // Helper method to obtain current MAC (moving average cost)
  public get_current_moving_average(product_id: string, warehouse_id: string): number {
    const txs = this.inventory_transactions
      .filter(t => t.product_id === product_id && t.warehouse_id === warehouse_id)
      .sort((a, b) => b.transaction_date - a.transaction_date);
    
    if (txs.length > 0) {
      return txs[0].running_avg_cost;
    }
    
    const product = this.products.find(p => p.id === product_id);
    return product?.standard_price || 0;
  }

  // 1. ADD WAREHOUSE DOCUMENT (Saves draft)
  public addDocument(doc: {
    id?: string;
    doc_number: string;
    internal_serial?: number;
    doc_type: WarehouseDocType;
    reference_type?: ReferenceType;
    reference_id?: string | null;
    source_warehouse_id?: string | null;
    destination_warehouse_id?: string | null;
    date?: string;
    doc_date?: string;
    status?: DocStatus;
    created_by?: string;
    description?: string;
    lines: Array<{
      id?: string;
      product_id: string;
      qty?: number;
      quantity?: number;
      unit_price?: number;
      unit_cost?: number;
      total_price?: number;
      total_cost?: number;
      description?: string;
    }>;
  }) {
    // --- REAL-TIME VALIDATION LAYER FOR INSUFFICIENT STOCK ---
    if (doc.doc_type === WarehouseDocType.REMITTANCE || doc.doc_type === WarehouseDocType.TRANSFER || (doc.doc_type === WarehouseDocType.ADJUSTMENT && doc.lines.some(l => (l.qty !== undefined ? l.qty : l.quantity !== undefined ? l.quantity : 0) < 0))) {
      const wId = doc.source_warehouse_id || doc.destination_warehouse_id!;
      if (!wId) {
        throw new Error("انبار مبدأ برای تراکنش خروجی مشخص نشده است.");
      }
      doc.lines.forEach(line => {
        const q = line.qty !== undefined ? line.qty : line.quantity !== undefined ? line.quantity : 0;
        if (q > 0 || (doc.doc_type === WarehouseDocType.ADJUSTMENT && q < 0)) {
          const reqQty = Math.abs(q);
          const currentStock = this.getProductStock(wId, line.product_id);
          if (currentStock < reqQty) {
            const product = this.products.find(p => p.id === line.product_id);
            const whName = this.warehouses.find(w => w.id === wId)?.name || wId;
            throw new Error(`اعتبارسنجی آنی انبار: موجودی ناکافی در انبار «${whName}» برای کالای «${product?.name || line.product_id}». موجودی فعلی: ${currentStock} عدد، مقدار درخواستی: ${reqQty} عدد.`);
          }
        }
      });
    }

    const nextSerial = this.documents.length > 0 
      ? Math.max(...this.documents.map(d => d.internal_serial || 0)) + 1 
      : 1;

    const docId = doc.id || "doc-" + Math.random().toString(36).substring(2, 9);
    
    const mappedLines: WarehouseDocLine[] = doc.lines.map(l => {
      const q = l.qty !== undefined ? l.qty : l.quantity !== undefined ? l.quantity : 0;
      const up = l.unit_price !== undefined ? l.unit_price : l.unit_cost !== undefined ? l.unit_cost : 0;
      const tp = l.total_price !== undefined ? l.total_price : l.total_cost !== undefined ? l.total_cost : q * up;
      return {
        id: l.id || "l-" + Math.random().toString(36).substring(2, 9),
        document_id: docId,
        product_id: l.product_id,
        qty: q,
        quantity: q,
        unit_price: up,
        unit_cost: up,
        total_price: tp,
        total_cost: tp,
        description: l.description || ""
      };
    });

    const newDoc: WarehouseDocument = {
      id: docId,
      doc_number: doc.doc_number,
      internal_serial: doc.internal_serial || nextSerial,
      doc_type: doc.doc_type,
      reference_type: doc.reference_type || ReferenceType.NONE,
      reference_id: doc.reference_id || null,
      source_warehouse_id: doc.source_warehouse_id || null,
      destination_warehouse_id: doc.destination_warehouse_id || null,
      date: doc.date || doc.doc_date || new Date().toLocaleDateString("fa-IR"),
      doc_date: doc.doc_date || doc.date || new Date().toLocaleDateString("fa-IR"),
      status: doc.status || DocStatus.DRAFT,
      created_by: doc.created_by || "کاربر سیستم",
      description: doc.description || "",
      lines: mappedLines
    };

    this.documents.push(newDoc);

    // If pre-confirmed, run confirmation cardex updates directly without strict stock checks
    if (newDoc.status === DocStatus.CONFIRMED || newDoc.status === DocStatus.ACCOUNTED) {
      const hasTx = this.inventory_transactions.some(t => t.reference_id === newDoc.doc_number);
      if (!hasTx) {
        this.confirm_warehouse_document_logic_only(newDoc);
      }
    }

    this.saveToStorage();
    this.recalculateLedger();
    return newDoc;
  }

  // 2. INVENTORY VALUATION ENGINE
  public inventory_valuation_engine(document_id: string) {
    const doc = this.documents.find(d => d.id === document_id);
    if (!doc) throw new Error("سند یافت نشد.");
    
    doc.lines.forEach(line => {
      if ((doc.doc_type as string) === "REMITTANCE" || doc.doc_type === WarehouseDocType.TRANSFER) {
        const wId = doc.source_warehouse_id || doc.destination_warehouse_id!;
        if (!wId) return;

        const avgCost = this.get_current_moving_average(line.product_id, wId);
        line.unit_cost = avgCost;
        line.unit_price = avgCost;
        line.total_cost = line.quantity * avgCost;
        line.total_price = line.qty * avgCost;
      }
    });
  }

  // Cardex transaction injection helper
  private confirm_warehouse_document_logic_only(doc: WarehouseDocument) {
    const now = Date.now();
    let txType = TransactionReferenceType.INVENTORY_RECEIPT;
    if ((doc.doc_type as string) === "REMITTANCE") {
      txType = TransactionReferenceType.INVENTORY_REMITTANCE;
    } else if (doc.doc_type === WarehouseDocType.ADJUSTMENT) {
      txType = TransactionReferenceType.STOCK_ADJUSTMENT;
    } else if (doc.doc_type === WarehouseDocType.TRANSFER) {
      txType = TransactionReferenceType.INVENTORY_REMITTANCE;
    }

    doc.lines.forEach((line, idx) => {
      // Outbound (Leaves source_warehouse)
      if ((doc.doc_type as string) === "REMITTANCE" || doc.doc_type === WarehouseDocType.TRANSFER || (doc.doc_type === WarehouseDocType.ADJUSTMENT && line.quantity < 0)) {
        const wId = doc.source_warehouse_id || doc.destination_warehouse_id!;
        this.insert_transaction({
          product_id: line.product_id,
          warehouse_id: wId,
          transaction_date: now + idx * 10,
          date_display: doc.date,
          reference_type: txType,
          reference_id: doc.doc_number,
          qty_in: 0,
          unit_cost_in: 0,
          total_cost_in: 0,
          qty_out: Math.abs(line.quantity)
        });
      }
      
      // Inbound (Enters destination_warehouse)
      if (doc.doc_type === WarehouseDocType.RECEIPT || doc.doc_type === WarehouseDocType.TRANSFER || (doc.doc_type === WarehouseDocType.ADJUSTMENT && line.quantity > 0)) {
        const wId = doc.destination_warehouse_id || doc.source_warehouse_id!;
        this.insert_transaction({
          product_id: line.product_id,
          warehouse_id: wId,
          transaction_date: now + idx * 10 + (doc.doc_type === WarehouseDocType.TRANSFER ? 5 : 0),
          date_display: doc.date,
          reference_type: doc.doc_type === WarehouseDocType.TRANSFER ? TransactionReferenceType.INVENTORY_RECEIPT : txType,
          reference_id: doc.doc_number,
          qty_in: Math.abs(line.quantity),
          unit_cost_in: line.unit_cost,
          total_cost_in: line.total_cost,
          qty_out: 0
        });
      }
    });
  }

  // 3. CONFIRM WAREHOUSE DOCUMENT (Strict stock checking & locking)
  public confirm_warehouse_document(document_id: string) {
    const doc = this.documents.find(d => d.id === document_id);
    if (!doc) throw new Error("سند یافت نشد.");
    if (doc.status === DocStatus.CONFIRMED || doc.status === DocStatus.ACCOUNTED) {
      throw new Error("سند قبلاً تایید شده است.");
    }

    // Strict availability check for REMITTANCE or TRANSFER
    if ((doc.doc_type as string) === "REMITTANCE" || doc.doc_type === WarehouseDocType.TRANSFER || (doc.doc_type === WarehouseDocType.ADJUSTMENT && doc.lines.some(l => l.quantity < 0))) {
      const wId = doc.source_warehouse_id || doc.destination_warehouse_id!;
      if (!wId) throw new Error("انبار مبدأ مشخص نشده است.");

      doc.lines.forEach(line => {
        if (line.quantity > 0 || (doc.doc_type === WarehouseDocType.ADJUSTMENT && line.quantity < 0)) {
          const reqQty = Math.abs(line.quantity);
          const currentStock = this.getProductStock(wId, line.product_id);
          if (currentStock < reqQty) {
            const product = this.products.find(p => p.id === line.product_id);
            throw new Error(`کسری موجودی در انبار مبدأ برای کالای «${product?.name || line.product_id}». موجودی فعلی: ${currentStock} عدد، مقدار مورد نیاز: ${reqQty} عدد.`);
          }
        }
      });
    }

    // Run valuation before locking down quantities
    if ((doc.doc_type as string) === "REMITTANCE" || doc.doc_type === WarehouseDocType.TRANSFER) {
      this.inventory_valuation_engine(doc.id);
    }

    // Commit transactions to Cardex
    this.confirm_warehouse_document_logic_only(doc);

    // Transition status
    doc.status = DocStatus.CONFIRMED;
    this.saveToStorage();
    this.recalculateLedger();
    return doc;
  }

  // 4. AUTO-ACCOUNTING INTEGRATION (صدور سند مالی انبار)
  public create_journal_voucher_from_doc(document_id: string): { voucherHeader: any; voucherLines: any[] } {
    const doc = this.documents.find(d => d.id === document_id);
    if (!doc) throw new Error("سند یافت نشد.");
    if (doc.status !== DocStatus.CONFIRMED) {
      throw new Error("سند باید ابتدا تایید (CONFIRMED) شود تا سند مالی صادر گردد.");
    }

    const totalVal = doc.lines.reduce((sum, line) => sum + (line.total_cost || (line.quantity * line.unit_cost)), 0);
    if (totalVal <= 0) {
      throw new Error("ارزش مالی اقلام سند صفر است. امکان صدور سند مالی وجود ندارد.");
    }

    let existingVouchers: any[] = [];
    try {
      const savedV = localStorage.getItem("vouchers_data");
      if (savedV) existingVouchers = JSON.parse(savedV);
    } catch (e) {
      console.error(e);
    }

    const nextVoucherNumber = existingVouchers.length > 0 
      ? Math.max(...existingVouchers.map((v: any) => v.voucher_number || 0)) + 1 
      : 1;

    const voucherId = "v-" + Math.random().toString(36).substring(2, 9);
    
    // Create Voucher Header
    const vHeader = {
      id: voucherId,
      voucher_number: nextVoucherNumber,
      reference_number: doc.doc_number,
      date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      status: "APPROVED",
      description: `صدور سند مالی انبار بابت ${
        doc.doc_type === WarehouseDocType.RECEIPT ? "رسید" : 
        ((doc.doc_type as string) === "REMITTANCE") ? "حواله" : 
        doc.doc_type === WarehouseDocType.TRANSFER ? "انتقال" : "تعدیل"
      } شماره ${doc.doc_number} - ${doc.description || ""}`,
      user_id: doc.created_by || "سیستم انبار"
    };

    const vLines: any[] = [];
    const makeLineId = () => "vl-" + Math.random().toString(36).substring(2, 9);

    this.ensureSubledgerAccountsExist();

    if (doc.doc_type === WarehouseDocType.RECEIPT) {
      // Debit: موجودی کالا (Inventory)
      vLines.push({
        id: makeLineId(),
        voucher_id: voucherId,
        account_id: "a1030",
        debit: totalVal,
        credit: 0,
        description: `بدهکار - موجودی کالا بابت رسید انبار شماره ${doc.doc_number}`
      });
      
      // Credit: حساب‌های پرداختنی تجاری / تامین‌کنندگان
      vLines.push({
        id: makeLineId(),
        voucher_id: voucherId,
        account_id: "a2010",
        detailed_account_id: "d4",
        debit: 0,
        credit: totalVal,
        description: `بستانکار - حساب‌های پرداختنی (تامین‌کننده) بابت رسید انبار شماره ${doc.doc_number}`
      });
    } else if ((doc.doc_type as string) === "REMITTANCE") {
      // Debit: بهای تمام شده کالای فروش رفته (COGS)
      vLines.push({
        id: makeLineId(),
        voucher_id: voucherId,
        account_id: "a5030",
        debit: totalVal,
        credit: 0,
        description: `بدهکار - بهای تمام شده کالای فروش رفته بابت حواله فروش شماره ${doc.doc_number}`
      });

      // Credit: موجودی کالا (Inventory)
      vLines.push({
        id: makeLineId(),
        voucher_id: voucherId,
        account_id: "a1030",
        debit: 0,
        credit: totalVal,
        description: `بستانکار - موجودی کالا بابت حواله فروش شماره ${doc.doc_number}`
      });
    } else if (doc.doc_type === WarehouseDocType.TRANSFER) {
      const srcName = this.warehouses.find(w => w.id === doc.source_warehouse_id)?.name || "مبدأ";
      const destName = this.warehouses.find(w => w.id === doc.destination_warehouse_id)?.name || "مقصد";

      vLines.push({
        id: makeLineId(),
        voucher_id: voucherId,
        account_id: "a1030",
        debit: totalVal,
        credit: 0,
        description: `بدهکار - موجودی انبار ${destName} بابت انتقال انبار شماره ${doc.doc_number}`
      });

      vLines.push({
        id: makeLineId(),
        voucher_id: voucherId,
        account_id: "a1030",
        debit: 0,
        credit: totalVal,
        description: `بستانکار - موجودی انبار ${srcName} بابت انتقال انبار شماره ${doc.doc_number}`
      });
    } else if (doc.doc_type === WarehouseDocType.ADJUSTMENT) {
      const isPositive = doc.lines.reduce((sum, l) => sum + l.quantity, 0) >= 0;
      if (isPositive) {
        vLines.push({
          id: makeLineId(),
          voucher_id: voucherId,
          account_id: "a1030",
          debit: totalVal,
          credit: 0,
          description: `بدهکار - موجودی کالا بابت تعدیل مثبت انبار شماره ${doc.doc_number}`
        });
        vLines.push({
          id: makeLineId(),
          voucher_id: voucherId,
          account_id: "a5010",
          debit: 0,
          credit: totalVal,
          description: `بستانکار - کسری و اضافی انبار بابت تعدیل مثبت انبار شماره ${doc.doc_number}`
        });
      } else {
        vLines.push({
          id: makeLineId(),
          voucher_id: voucherId,
          account_id: "a5010",
          debit: totalVal,
          credit: 0,
          description: `بدهکار - کسری و اضافی انبار بابت تعدیل منفی انبار شماره ${doc.doc_number}`
        });
        vLines.push({
          id: makeLineId(),
          voucher_id: voucherId,
          account_id: "a1030",
          debit: 0,
          credit: totalVal,
          description: `بستانکار - موجودی کالا بابت تعدیل منفی انبار شماره ${doc.doc_number}`
        });
      }
    }

    let existingLines: any[] = [];
    try {
      const savedL = localStorage.getItem("voucher_lines_data");
      if (savedL) existingLines = JSON.parse(savedL);
    } catch (e) {
      console.error(e);
    }

    existingVouchers.push(vHeader);
    existingLines.push(...vLines);

    localStorage.setItem("vouchers_data", JSON.stringify(existingVouchers));
    localStorage.setItem("voucher_lines_data", JSON.stringify(existingLines));

    doc.status = DocStatus.ACCOUNTED;
    this.saveToStorage();
    this.recalculateLedger();

    return { voucherHeader: vHeader, voucherLines: vLines };
  }

  private ensureSubledgerAccountsExist() {
    let chart: any[] = [];
    try {
      const saved = localStorage.getItem("chart_of_accounts");
      if (saved) chart = JSON.parse(saved);
      else return;
    } catch (e) {
      console.error(e);
      return;
    }

    const has1030 = chart.some(a => a.code === "1030");
    const has5030 = chart.some(a => a.code === "5030");

    let changed = false;
    if (!has1030) {
      chart.push({
        id: "a1030",
        code: "1030",
        name: "موجودی کالا (انبار)",
        level: "SUBLEDGER",
        parent_id: "a10"
      });
      changed = true;
    }
    if (!has5030) {
      chart.push({
        id: "a5030",
        code: "5030",
        name: "بهای تمام شده کالای فروش رفته",
        level: "SUBLEDGER",
        parent_id: "a50"
      });
      changed = true;
    }

    if (changed) {
      localStorage.setItem("chart_of_accounts", JSON.stringify(chart));
    }
  }

  // Delete Document (DRAFT only)
  public deleteDocument(document_id: string) {
    const idx = this.documents.findIndex(d => d.id === document_id);
    if (idx === -1) throw new Error("سند یافت نشد.");
    if (this.documents[idx].status !== DocStatus.DRAFT) {
      throw new Error("فقط اسناد پیش‌نویس (DRAFT) قابل حذف هستند.");
    }
    this.documents.splice(idx, 1);
    this.saveToStorage();
    return true;
  }

  // Get Kardex for a specific product & warehouse
  public getKardex(warehouseId?: string, productId?: string) {
    let results = this.ledger;
    if (warehouseId) results = results.filter(l => l.warehouse_id === warehouseId);
    if (productId) results = results.filter(l => l.product_id === productId);
    return results;
  }
  
  // Stocktake Actions
  public addStocktakeTag(tag: Omit<StocktakeTag, "id">) {
    const newTag: StocktakeTag = {
      ...tag,
      id: "tag-" + Math.random().toString(36).substring(2, 9)
    };
    this.tags.push(newTag);
    this.saveToStorage();
    return newTag;
  }

  public applyStocktakeTags(stocktakeId: string) {
    const tagsToApply = this.tags.filter(t => t.stocktake_id === stocktakeId && t.status === "DRAFT");
    
    // Group tags by warehouse
    const tagsByWarehouse: Record<string, StocktakeTag[]> = {};
    tagsToApply.forEach(tag => {
      if (!tagsByWarehouse[tag.warehouse_id]) tagsByWarehouse[tag.warehouse_id] = [];
      tagsByWarehouse[tag.warehouse_id].push(tag);
    });

    // Create adjustment docs
    for (const [wId, tags] of Object.entries(tagsByWarehouse)) {
      const lines = tags.filter(t => t.difference !== 0).map(t => ({
        id: "l-" + Math.random().toString(36).substring(2, 9),
        product_id: t.product_id,
        qty: t.difference,
        quantity: t.difference,
        unit_price: 0,
        unit_cost: 0,
        total_price: 0,
        total_cost: 0,
        description: `انبارگردانی اختلاف شمارش`
      }));

      if (lines.length > 0) {
        this.addDocument({
          doc_number: `ADJ-${Math.floor(Math.random()*10000)}`,
          date: new Date().toLocaleDateString("fa-IR"),
          doc_date: new Date().toLocaleDateString("fa-IR"),
          doc_type: WarehouseDocType.ADJUSTMENT,
          reference_type: ReferenceType.NONE,
          reference_id: stocktakeId,
          source_warehouse_id: null,
          destination_warehouse_id: wId,
          description: `تعدیل انبارگردانی ${stocktakeId}`,
          lines,
          created_by: "سیستم انبارگردانی",
          status: DocStatus.DRAFT
        });
      }

      // Mark applied
      tags.forEach(t => t.status = "APPLIED");
    }
    this.saveToStorage();
  }
  
  // Inventory query
  public getProductStock(warehouseId: string, productId: string) {
    const filtered = this.ledger.filter(l => l.warehouse_id === warehouseId && l.product_id === productId);
    if (filtered.length === 0) return 0;
    return filtered[filtered.length - 1].balance_qty;
  }

  // --- NEW PHYSICAL STOCKTAKE (Physical Audit) ENGINE METHODS ---

  public getStocktakePeriods() {
    return this.stocktake_periods;
  }

  public getStocktakeItems(periodId: string) {
    return this.stocktake_items.filter(i => i.period_id === periodId);
  }

  public getStocktakeAdjustments(periodId: string) {
    return this.stocktake_adjustments.filter(a => a.period_id === periodId);
  }

  public create_stocktake_period(title: string, warehouse_id: string, start_date: string, end_date: string) {
    const period: StocktakePeriod = {
      id: "stkp-" + Math.random().toString(36).substring(2, 9),
      title,
      warehouse_id,
      start_date,
      end_date,
      status: StocktakePeriodStatus.OPEN
    };
    this.stocktake_periods.push(period);
    this.saveToStorage();
    return period;
  }

  public delete_stocktake_period(period_id: string) {
    const idx = this.stocktake_periods.findIndex(p => p.id === period_id);
    if (idx === -1) throw new Error("دوره یافت نشد.");
    if (this.stocktake_periods[idx].status !== StocktakePeriodStatus.OPEN) {
      throw new Error("فقط دوره‌های باز قابل حذف هستند.");
    }
    this.stocktake_periods.splice(idx, 1);
    this.stocktake_items = this.stocktake_items.filter(i => i.period_id !== period_id);
    this.saveToStorage();
    return true;
  }

  public create_stocktake_snapshot(period_id: string) {
    const period = this.stocktake_periods.find(p => p.id === period_id);
    if (!period) throw new Error("دوره انبارگردانی یافت نشد.");
    if (period.status !== StocktakePeriodStatus.OPEN) {
      throw new Error("موجودی دفتری فقط برای دوره‌های با وضعیت OPEN قابل ثبت است.");
    }

    // Clear any existing snapshot items for this period
    this.stocktake_items = this.stocktake_items.filter(i => i.period_id !== period_id);

    // Snapshot all products
    this.products.forEach(p => {
      // Get current quantity and moving average cost from Cardex transactions
      const txs = this.inventory_transactions
        .filter(t => t.product_id === p.id && t.warehouse_id === period.warehouse_id)
        .sort((a, b) => b.transaction_date - a.transaction_date);
        
      const qty = txs.length > 0 ? txs[0].running_qty : 0;
      const cost = txs.length > 0 ? txs[0].running_avg_cost : 0;

      const item: StocktakeItem = {
        id: "stki-" + Math.random().toString(36).substring(2, 9),
        period_id: period_id,
        product_id: p.id,
        system_snapshot_qty: qty,
        system_unit_cost: cost,
        count_1_qty: null,
        count_2_qty: null,
        count_3_qty: null,
        final_accepted_qty: null,
        variance_qty: null,
        status: StocktakeItemStatus.MATCHED
      };
      this.stocktake_items.push(item);
    });

    period.status = StocktakePeriodStatus.COUNTING;
    this.saveToStorage();
  }

  public submit_count_layer(
    period_id: string, 
    count_stage: 1 | 2 | 3, 
    items_data: Array<{ product_id: string; count_qty: number }>
  ) {
    const period = this.stocktake_periods.find(p => p.id === period_id);
    if (!period) throw new Error("دوره انبارگردانی یافت نشد.");
    if (period.status !== StocktakePeriodStatus.COUNTING && period.status !== StocktakePeriodStatus.CALCULATING) {
      // Allow counts during Counting or Calculating stages
      period.status = StocktakePeriodStatus.COUNTING;
    }

    const items = this.stocktake_items.filter(i => i.period_id === period_id);

    items.forEach(item => {
      const countData = items_data.find(d => d.product_id === item.product_id);
      if (!countData) return; // Keep existing if not submitted

      const countVal = countData.count_qty;

      if (count_stage === 1) {
        item.count_1_qty = countVal;
        if (item.count_1_qty === item.system_snapshot_qty) {
          item.final_accepted_qty = item.count_1_qty;
          item.variance_qty = 0;
          item.status = StocktakeItemStatus.MATCHED;
        } else {
          item.status = StocktakeItemStatus.NEEDS_SECOND_COUNT;
        }
      } else if (count_stage === 2) {
        if (item.status === StocktakeItemStatus.NEEDS_SECOND_COUNT) {
          item.count_2_qty = countVal;
          if (item.count_2_qty === item.count_1_qty) {
            item.final_accepted_qty = item.count_2_qty;
            item.variance_qty = item.final_accepted_qty - item.system_snapshot_qty;
            item.status = StocktakeItemStatus.RESOLVED;
          } else {
            item.status = StocktakeItemStatus.NEEDS_THIRD_COUNT;
          }
        }
      } else if (count_stage === 3) {
        if (item.status === StocktakeItemStatus.NEEDS_THIRD_COUNT) {
          item.count_3_qty = countVal;
          item.final_accepted_qty = item.count_3_qty;
          item.variance_qty = item.final_accepted_qty - item.system_snapshot_qty;
          item.status = StocktakeItemStatus.RESOLVED;
        }
      }
    });

    // Automatically transition to CALCULATING if all active count items have been evaluated
    const hasUnresolved1 = items.some(i => i.count_1_qty === null);
    const hasUnresolved2 = items.some(i => i.status === StocktakeItemStatus.NEEDS_SECOND_COUNT && i.count_2_qty === null);
    const hasUnresolved3 = items.some(i => i.status === StocktakeItemStatus.NEEDS_THIRD_COUNT && i.count_3_qty === null);

    if (!hasUnresolved1 && !hasUnresolved2 && !hasUnresolved3) {
      period.status = StocktakePeriodStatus.CALCULATING;
    }

    this.saveToStorage();
  }

  public set_calculating_status(period_id: string) {
    const period = this.stocktake_periods.find(p => p.id === period_id);
    if (!period) throw new Error("دوره یافت نشد.");
    period.status = StocktakePeriodStatus.CALCULATING;
    this.saveToStorage();
  }

  public finalize_stocktake(period_id: string, market_costs?: Record<string, number>) {
    const period = this.stocktake_periods.find(p => p.id === period_id);
    if (!period) throw new Error("دوره انبارگردانی یافت نشد.");
    if (period.status === StocktakePeriodStatus.FINALIZED) {
      throw new Error("این دوره قبلاً نهایی شده است.");
    }

    const items = this.stocktake_items.filter(i => i.period_id === period_id);

    // 1. Resolve any remaining un-resolved items
    items.forEach(item => {
      if (item.final_accepted_qty === null) {
        if (item.count_3_qty !== null) {
          item.final_accepted_qty = item.count_3_qty;
        } else if (item.count_2_qty !== null) {
          item.final_accepted_qty = item.count_2_qty;
        } else if (item.count_1_qty !== null) {
          item.final_accepted_qty = item.count_1_qty;
        } else {
          item.final_accepted_qty = item.system_snapshot_qty;
        }
        item.variance_qty = item.final_accepted_qty - item.system_snapshot_qty;
        if (item.variance_qty === 0) {
          item.status = StocktakeItemStatus.MATCHED;
        } else {
          item.status = StocktakeItemStatus.RESOLVED;
        }
      }
    });

    // 2. Process non-zero variances and generate warehouse adjustments & balanced accounting vouchers
    items.forEach(item => {
      const variance = item.variance_qty || 0;
      if (variance === 0) return;

      const isSurplus = variance > 0;
      const absQty = Math.abs(variance);
      const docNum = `ADJ-${period.title}-${Math.floor(Math.random() * 1000)}`;

      // Value calculation
      let unitCost = item.system_unit_cost;
      if (isSurplus && market_costs && market_costs[item.product_id]) {
        unitCost = market_costs[item.product_id];
      }
      if (unitCost <= 0) {
        const prod = this.products.find(p => p.id === item.product_id);
        unitCost = prod?.standard_price || 100000;
      }
      const totalCost = absQty * unitCost;

      // Create document in DRAFT state
      const nextSerial = this.documents.length > 0 
        ? Math.max(...this.documents.map(d => d.internal_serial || 0)) + 1 
        : 1;

      const docId = "doc-" + Math.random().toString(36).substring(2, 9);
      const docType = isSurplus ? WarehouseDocType.RECEIPT : WarehouseDocType.REMITTANCE;

      const newDoc: WarehouseDocument = {
        id: docId,
        doc_number: docNum,
        internal_serial: nextSerial,
        doc_type: docType,
        reference_type: ReferenceType.NONE,
        reference_id: period.id,
        source_warehouse_id: isSurplus ? null : period.warehouse_id,
        destination_warehouse_id: isSurplus ? period.warehouse_id : null,
        date: new Date().toLocaleDateString("fa-IR"),
        doc_date: new Date().toLocaleDateString("fa-IR"),
        status: DocStatus.DRAFT,
        created_by: "سیستم انبارگردانی",
        description: `تعدیل ${isSurplus ? "اضافی" : "کسری"} انبارگردانی دوره ${period.title} برای کالا`,
        lines: [
          {
            id: "l-" + Math.random().toString(36).substring(2, 9),
            document_id: docId,
            product_id: item.product_id,
            qty: absQty,
            quantity: absQty,
            unit_price: unitCost,
            unit_cost: unitCost,
            total_price: totalCost,
            total_cost: totalCost,
            description: `تعدیل انبارگردانی - مقدار مغایرت: ${variance}`
          }
        ]
      };

      this.documents.push(newDoc);

      // Confirm document to write transactions to the Cardex
      this.confirm_warehouse_document_logic_only(newDoc);
      newDoc.status = DocStatus.CONFIRMED;

      // Create Balanced Accounting Voucher (JV)
      let existingVouchers: any[] = [];
      try {
        const saved = localStorage.getItem("vouchers_data");
        if (saved) existingVouchers = JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }

      const nextVoucherNumber = existingVouchers.length > 0 
        ? Math.max(...existingVouchers.map((v: any) => v.voucher_number || 0)) + 1 
        : 1;

      const voucherId = "v-" + Math.random().toString(36).substring(2, 9);
      
      const vHeader = {
         id: voucherId,
         voucher_number: nextVoucherNumber,
         reference_number: docNum,
         date: new Date().toISOString().split('T')[0],
         created_at: new Date().toISOString(),
         status: "APPROVED",
         description: `صدور سند مالی انبارگردانی بابت تعدیل موازنه ${isSurplus ? "اضافی" : "کسری"} کالا در دوره ${period.title}`,
         user_id: "سیستم انبارگردانی"
      };

      const vLines: any[] = [];
      const makeLineId = () => "vl-" + Math.random().toString(36).substring(2, 9);

      if (isSurplus) {
        // Surplus: Debit Inventory Account / Credit Other Operating Revenues
        // Debit (1030): موجودی کالا
        vLines.push({
          id: makeLineId(),
          voucher_id: voucherId,
          account_id: "a1030", // standard inventory account
          debit: totalCost,
          credit: 0,
          description: `بدهکار - موجودی کالا بابت تعدیل اضافی انبارگردانی دوره ${period.title}`
        });

        // Credit (6020): سایر درآمدهای عملیاتی / اضافی انبار
        vLines.push({
          id: makeLineId(),
          voucher_id: voucherId,
          account_id: "a6020",
          account_name: "سایر درآمدهای عملیاتی (اضافی انبار)",
          debit: 0,
          credit: totalCost,
          description: `بستانکار - سایر درآمدهای عملیاتی بابت تعدیل اضافی انبارگردانی دوره ${period.title}`
        });
      } else {
        // Deficit: Debit Inventory Shortage Expense / Credit Inventory Account
        // Debit (5040): هزینه کسر و ضایعات انبار
        vLines.push({
          id: makeLineId(),
          voucher_id: voucherId,
          account_id: "a5040",
          account_name: "هزینه کسر و ضایعات انبار",
          debit: totalCost,
          credit: 0,
          description: `بدهکار - هزینه کسر و ضایعات انبار بابت تعدیل کسری انبارگردانی دوره ${period.title}`
        });

        // Credit (1030): موجودی کالا
        vLines.push({
          id: makeLineId(),
          voucher_id: voucherId,
          account_id: "a1030",
          debit: 0,
          credit: totalCost,
          description: `بستانکار - موجودی کالا بابت تعدیل کسری انبارگردانی دوره ${period.title}`
        });
      }

      let existingLines: any[] = [];
      try {
        const savedL = localStorage.getItem("voucher_lines_data");
        if (savedL) existingLines = JSON.parse(savedL);
      } catch (e) {
        console.error(e);
      }

      existingVouchers.push(vHeader);
      existingLines.push(...vLines);

      localStorage.setItem("vouchers_data", JSON.stringify(existingVouchers));
      localStorage.setItem("voucher_lines_data", JSON.stringify(existingLines));

      newDoc.status = DocStatus.ACCOUNTED;

      // Save the stocktake_adjustments linkage
      const adj: StocktakeAdjustment = {
        id: "stka-" + Math.random().toString(36).substring(2, 9),
        period_id: period.id,
        item_id: item.id,
        doc_id: docId,
        type: isSurplus ? "RECEIPT" : "REMITTANCE"
      };
      this.stocktake_adjustments.push(adj);
    });

    period.status = StocktakePeriodStatus.FINALIZED;
    this.saveToStorage();
    this.recalculateLedger();
  }

}

export const inventoryEngine = new InventoryEngine();
