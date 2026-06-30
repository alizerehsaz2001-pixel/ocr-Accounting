import { RecordStatus } from "./petty-cash-engine"; // Or standard status

export enum InvoiceType {
  SALE = "SALE",
  PURCHASE = "PURCHASE",
  SALE_RETURN = "SALE_RETURN",
  PURCHASE_RETURN = "PURCHASE_RETURN",
  PROFORMA = "PROFORMA", // Added for UI compatibility
}

export enum InvoiceStatus {
  DRAFT = "DRAFT",
  FINALIZED = "FINALIZED",
  SENT_TO_TAX_ORG = "SENT_TO_TAX_ORG",
  CANCELLED = "CANCELLED",
}

export interface InvoiceLine {
  id: string;
  invoice_id: string;
  product_id: string;
  warehouse_id: string;
  quantity: number;
  unit_price: number;
  gross_amount: number;
  discount_percentage: number;
  discount_amount: number;
  vat_percentage: number;
  vat_amount: number;
  net_amount: number;
  description?: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  internal_serial: string;
  invoice_type: InvoiceType;
  client_id: string; // Floating Detailed Account
  invoice_date: string;
  register_date: string;
  total_gross_amount: number;
  total_discount_line: number;
  total_discount_header: number;
  total_vat_amount: number;
  total_net_amount: number;
  status: InvoiceStatus;
  tax_id?: string; // 22-character Unique Tax ID (شماره منحصربه‌فرد مالیاتی)
  description?: string;
  lines: InvoiceLine[];
  manual_rounding?: number; // Manual rounding / adjusting field
}

export interface ManualExpense {
  id: string;
  date: string;
  amount: number;
  description: string;
}

export interface InvoiceStatusHistory {
  id: string;
  invoice_id: string;
  from_status: InvoiceStatus;
  to_status: InvoiceStatus;
  changed_at: string;
  changed_by: string;
}

// Supporting Interfaces for dependencies
export interface Product {
  id: string;
  name: string;
  base_price: number;
  wholesale_price: number;
  partner_price: number;
  purchase_price: number;
}

export interface Partner {
  id: string;
  name: string;
  type: "customer" | "supplier";
  credit_limit: number;
  price_list_type: "consumer" | "wholesale" | "partner";
  line_discount_percent: number;
  volume_discount_percent: number;
  person_type?: "REAL" | "LEGAL";
  national_id?: string;
  economic_code?: string;
  phone_number?: string;
  mobile_number?: string;
  province?: string;
  city?: string;
  address?: string;
}

export interface InventoryLedger {
  warehouse_id: string;
  product_id: string;
  quantity: number;
}

export class CommercialEngine {
  private invoices: Invoice[] = [];
  private statusHistory: InvoiceStatusHistory[] = [];

  // Mock dependencies
  private products: Product[] = [];
  private partners: Partner[] = [];
  private inventory: InventoryLedger[] = []; // Simple inventory check
  private manualExpenses: ManualExpense[] = [];

  constructor() {
    this.loadFromStorage();
    if (this.products.length === 0 || !this.partners.some((p) => p.national_id)) {
      this.seedInitialData();
    }
  }

  private loadFromStorage() {
    try {
      const i = localStorage.getItem("commercial_invoices_db");
      if (i) this.invoices = JSON.parse(i);
      const sh = localStorage.getItem("commercial_status_history_db");
      if (sh) this.statusHistory = JSON.parse(sh);
      const p = localStorage.getItem("commercial_products_db");
      if (p) this.products = JSON.parse(p);
      const pr = localStorage.getItem("commercial_partners_db");
      if (pr) this.partners = JSON.parse(pr);
      const inv = localStorage.getItem("commercial_inventory_db");
      if (inv) this.inventory = JSON.parse(inv);
      const exp = localStorage.getItem("commercial_expenses_db");
      if (exp) this.manualExpenses = JSON.parse(exp);
    } catch (e) {
      console.error("Failed to load commercial DB", e);
    }
  }

  private saveToStorage() {
    localStorage.setItem(
      "commercial_invoices_db",
      JSON.stringify(this.invoices),
    );
    localStorage.setItem(
      "commercial_status_history_db",
      JSON.stringify(this.statusHistory),
    );
    localStorage.setItem(
      "commercial_products_db",
      JSON.stringify(this.products),
    );
    localStorage.setItem(
      "commercial_partners_db",
      JSON.stringify(this.partners),
    );
    localStorage.setItem(
      "commercial_inventory_db",
      JSON.stringify(this.inventory),
    );
    localStorage.setItem(
      "commercial_expenses_db",
      JSON.stringify(this.manualExpenses),
    );
  }

  private seedInitialData() {
    this.products = [
      {
        id: "p1",
        name: "لپ‌تاپ ایسوس ZenBook",
        base_price: 650000000,
        wholesale_price: 580000000,
        partner_price: 600000000,
        purchase_price: 520000000,
      },
      {
        id: "p2",
        name: "گوشی سامسونگ S24",
        base_price: 720000000,
        wholesale_price: 650000000,
        partner_price: 680000000,
        purchase_price: 590000000,
      },
    ];
    this.partners = [
      {
        id: "part1",
        name: "شرکت فن‌آوری اطلاعات شریف",
        type: "customer",
        credit_limit: 2000000000,
        price_list_type: "wholesale",
        line_discount_percent: 5,
        volume_discount_percent: 8,
        person_type: "LEGAL",
        national_id: "10103524584",
        economic_code: "411124587412",
        phone_number: "02166162000",
        mobile_number: "09121234567",
        province: "تهران",
        city: "تهران",
        address: "خیابان آزادی، دانشگاه صنعتی شریف، ساختمان نوآوری شریف",
      },
      {
        id: "part3",
        name: "بازرگانی پیشرو (حقیقی)",
        type: "supplier",
        credit_limit: 5000000000,
        price_list_type: "wholesale",
        line_discount_percent: 0,
        volume_discount_percent: 0,
        person_type: "REAL",
        national_id: "0075135833",
        economic_code: "111222333444",
        phone_number: "03132223344",
        mobile_number: "09131112233",
        province: "اصفهان",
        city: "اصفهان",
        address: "خیابان چهارباغ عباسی، مجتمع تجاری سپاهان، طبقه اول، واحد ۱۲",
      },
    ];
    this.inventory = [
      { warehouse_id: "WH-MAIN", product_id: "p1", quantity: 50 },
      { warehouse_id: "WH-MAIN", product_id: "p2", quantity: 100 },
    ];
    this.saveToStorage();
  }

  // Generate 22-character Unique Tax ID (شماره منحصربه‌فرد مالیاتی)
  generateTaxId(invoiceId: string, memoryId: string = "A1B2C3"): string {
    const timestamp = Math.floor(Date.now() / 1000)
      .toString(16)
      .toUpperCase()
      .padStart(8, "0");
    const serial = Math.floor(Math.random() * 1000000000)
      .toString()
      .padStart(10, "0");
    // Format: MemoryID (6) + HexTimestamp (8) + Serial (10)
    // Actually standard Iranian Tax ID is Memory ID (6) + Date (hex) + Serial + Control digit = 22 chars.
    // This is a simplified mock generator:
    const raw = `${memoryId}${timestamp}${serial}`.substring(0, 21);
    const controlDigit = Math.floor(Math.random() * 10).toString();
    return raw + controlDigit;
  }

  getProducts() {
    return this.products;
  }
  getPartners() {
    return this.partners;
  }
  getManualExpenses() {
    return this.manualExpenses;
  }

  addManualExpense(data: Omit<ManualExpense, "id">) {
    const expense: ManualExpense = {
      ...data,
      id: "exp-" + Math.random().toString(36).substring(2, 9),
    };
    this.manualExpenses.push(expense);
    this.saveToStorage();
    return expense;
  }

  deleteManualExpense(id: string) {
    this.manualExpenses = this.manualExpenses.filter((e) => e.id !== id);
    this.saveToStorage();
  }
  getInvoices() {
    return this.invoices;
  }

  addPartner(partner: Omit<Partner, "id">): Partner {
    const newPartner: Partner = {
      ...partner,
      id: "part-" + Math.random().toString(36).substring(2, 9).toUpperCase(),
    };
    this.partners.push(newPartner);
    this.saveToStorage();
    return newPartner;
  }

  updatePartner(updated: Partner): Partner {
    const idx = this.partners.findIndex((p) => p.id === updated.id);
    if (idx === -1) throw new Error("طرف حساب یافت نشد.");
    this.partners[idx] = { ...this.partners[idx], ...updated };
    this.saveToStorage();
    return this.partners[idx];
  }

  deletePartner(id: string): { success: boolean; error?: string } {
    const hasInvoices = this.invoices.some((inv) => inv.client_id === id);
    if (hasInvoices) {
      return {
        success: false,
        error: "امکان حذف طرف حساب به علت وجود گردش مالی و فاکتور فعال در سیستم وجود ندارد.",
      };
    }
    this.partners = this.partners.filter((p) => p.id !== id);
    this.saveToStorage();
    return { success: true };
  }

  addProduct(product: Omit<Product, "id">): Product {
    const newProduct: Product = {
      ...product,
      id: "p-auto-" + Math.random().toString(36).substring(2, 9).toUpperCase(),
    };
    this.products.push(newProduct);
    this.saveToStorage();
    return newProduct;
  }

  // Precision decimal helper
  private round(value: number, decimals: number = 2): number {
    return Number(Math.round(Number(value + "e" + decimals)) + "e-" + decimals);
  }

  // 1. Calculate Invoice Totals (Recalculates every line item and updates header)
  calculateInvoiceTotals(invoiceId: string): void {
    const inv = this.invoices.find((i) => i.id === invoiceId);
    if (!inv) throw new Error("Invoice not found");

    let totalGross = 0;
    let totalDiscountLine = 0;
    let totalVat = 0;

    inv.lines.forEach((line) => {
      line.gross_amount = this.round(line.quantity * line.unit_price);
      line.discount_amount = this.round(
        line.gross_amount * (line.discount_percentage / 100),
      );

      const taxableAmount = line.gross_amount - line.discount_amount;
      line.vat_amount = this.round(taxableAmount * (line.vat_percentage / 100));

      line.net_amount = taxableAmount + line.vat_amount;

      totalGross += line.gross_amount;
      totalDiscountLine += line.discount_amount;
      totalVat += line.vat_amount;
    });

    inv.total_gross_amount = totalGross;
    inv.total_discount_line = totalDiscountLine;

    // Apply Header Discount proportionally if exists (simplified here as deduction before VAT)
    // For rigorous Iranian tax, header discount might affect VAT basis.
    // Here we assume total_discount_header is purely an extra deduction.
    const taxableTotal =
      totalGross - totalDiscountLine - inv.total_discount_header;

    // In real scenarios, VAT should be recalculated after header discount if header discount is taxable.
    // We will keep VAT as sum of lines for this implementation.

    inv.total_vat_amount = totalVat;
    const rawNet = taxableTotal + totalVat;
    inv.total_net_amount = Math.max(0, rawNet - (inv.manual_rounding || 0));

    this.saveToStorage();
  }

  // Create Draft Invoice
  createDraftInvoice(data: Partial<Invoice>): Invoice {
    const newInvoice: Invoice = {
      id: "INV-" + Math.random().toString(36).substring(2, 9).toUpperCase(),
      invoice_number:
        data.invoice_number || `${data.invoice_type || "SAL"}-${Date.now()}`,
      internal_serial: `SN-${Date.now()}`,
      invoice_type: data.invoice_type || InvoiceType.SALE,
      client_id: data.client_id || "",
      invoice_date: data.invoice_date || new Date().toISOString().split("T")[0],
      register_date: new Date().toISOString(),
      total_gross_amount: 0,
      total_discount_line: 0,
      total_discount_header: data.total_discount_header || 0,
      total_vat_amount: 0,
      total_net_amount: 0,
      status: InvoiceStatus.DRAFT,
      lines: data.lines || [],
      description: data.description || "",
      manual_rounding: data.manual_rounding || 0,
    };

    this.invoices.push(newInvoice);
    this.calculateInvoiceTotals(newInvoice.id);
    return newInvoice;
  }

  // Update existing Draft Invoice
  updateDraftInvoice(id: string, data: Partial<Invoice>): Invoice {
    const idx = this.invoices.findIndex((i) => i.id === id);
    if (idx === -1) throw new Error("Invoice not found");
    const inv = this.invoices[idx];
    if (inv.status !== InvoiceStatus.DRAFT) {
      throw new Error("Only DRAFT invoices can be modified.");
    }

    inv.invoice_number = data.invoice_number || inv.invoice_number;
    inv.invoice_type = data.invoice_type || inv.invoice_type;
    inv.client_id = data.client_id || inv.client_id;
    inv.invoice_date = data.invoice_date || inv.invoice_date;
    inv.description = data.description !== undefined ? data.description : inv.description;
    inv.total_discount_header = data.total_discount_header !== undefined ? data.total_discount_header : inv.total_discount_header;
    inv.lines = data.lines || inv.lines;
    inv.manual_rounding = data.manual_rounding !== undefined ? data.manual_rounding : inv.manual_rounding;

    this.calculateInvoiceTotals(inv.id);
    return inv;
  }

  // 2. Finalize and Post Invoice (Transaction-Safe)
  finalizeAndPostInvoice(
    invoiceId: string,
    userId: string = "SYSTEM",
  ): { success: boolean; error?: string; invoice?: Invoice } {
    const backupInvoices = JSON.parse(JSON.stringify(this.invoices));
    const backupHistory = JSON.parse(JSON.stringify(this.statusHistory));
    const backupInventory = JSON.parse(JSON.stringify(this.inventory));

    try {
      const invIndex = this.invoices.findIndex((i) => i.id === invoiceId);
      if (invIndex === -1) throw new Error("Invoice not found.");

      const inv = this.invoices[invIndex];

      if (inv.status !== InvoiceStatus.DRAFT) {
        throw new Error("Only DRAFT invoices can be finalized.");
      }

      this.calculateInvoiceTotals(inv.id); // Ensure latest totals

      const partner = this.partners.find((p) => p.id === inv.client_id);
      if (!partner) throw new Error("Client/Partner not found.");

      // a) Credit Limit Check (Sales only)
      if (inv.invoice_type === InvoiceType.SALE) {
        const clientActiveDebt = this.invoices
          .filter(
            (i) =>
              i.client_id === partner.id &&
              i.invoice_type === InvoiceType.SALE &&
              i.status === InvoiceStatus.FINALIZED,
          )
          .reduce((sum, i) => sum + i.total_net_amount, 0);

        if (clientActiveDebt + inv.total_net_amount > partner.credit_limit) {
          throw new Error(
            `Credit Limit Exceeded! Client limit: ${partner.credit_limit.toLocaleString()}, Current Debt + this Invoice: ${(clientActiveDebt + inv.total_net_amount).toLocaleString()}`,
          );
        }
      }

      // b) Inventory Check (Sales only)
      if (inv.invoice_type === InvoiceType.SALE) {
        for (const line of inv.lines) {
          const whItem = this.inventory.find(
            (i) =>
              i.warehouse_id === line.warehouse_id &&
              i.product_id === line.product_id,
          );
          const availableQty = whItem ? whItem.quantity : 0;

          if (availableQty < line.quantity) {
            throw new Error(
              `Insufficient inventory for Product ${line.product_id} in Warehouse ${line.warehouse_id}. Available: ${availableQty}, Required: ${line.quantity}`,
            );
          }
          // Deduct inventory
          if (whItem) {
            whItem.quantity -= line.quantity;
          }
        }
      }

      // Add to inventory (Purchases)
      if (inv.invoice_type === InvoiceType.PURCHASE) {
        for (const line of inv.lines) {
          const whItem = this.inventory.find(
            (i) =>
              i.warehouse_id === line.warehouse_id &&
              i.product_id === line.product_id,
          );
          if (whItem) {
            whItem.quantity += line.quantity;
          } else {
            this.inventory.push({
              warehouse_id: line.warehouse_id,
              product_id: line.product_id,
              quantity: line.quantity,
            });
          }
        }
      }

      // c) Auto-Vouchering Trigger (Real double-entry voucher generation)
      console.log(
        `[Financial System] Auto-generating Journal Voucher for Invoice ${inv.invoice_number}...`,
      );
      try {
        this.generateJournalVoucherForInvoice(inv);
      } catch (e) {
        console.error("Failed to auto-generate voucher:", e);
      }

      // d) Auto-Inventory-Document Trigger
      console.log(
        `[Warehouse System] Auto-generating ${inv.invoice_type === InvoiceType.SALE ? "Remittance" : "Receipt"} for Invoice ${inv.invoice_number}...`,
      );

      // Finalize Status
      inv.status = InvoiceStatus.FINALIZED;

      // Generation of Samaneh Modyan Tax ID (for Sales)
      if (inv.invoice_type === InvoiceType.SALE) {
        inv.tax_id = this.generateTaxId(inv.id);
      }

      this.invoices[invIndex] = inv;

      // Log History
      this.statusHistory.push({
        id: "HST-" + Math.random().toString(36).substring(2, 9),
        invoice_id: inv.id,
        from_status: InvoiceStatus.DRAFT,
        to_status: InvoiceStatus.FINALIZED,
        changed_at: new Date().toISOString(),
        changed_by: userId,
      });

      this.saveToStorage();
      return { success: true, invoice: inv };
    } catch (error: any) {
      // Rollback transaction
      this.invoices = backupInvoices;
      this.statusHistory = backupHistory;
      this.inventory = backupInventory;
      return {
        success: false,
        error:
          error.message ||
          "Failed to finalize invoice due to an unknown error.",
      };
    }
  }

  // 3. Delete / Cancel Invoice
  cancelInvoice(
    invoiceId: string,
    userId: string = "SYSTEM",
  ): { success: boolean; error?: string } {
    const invIndex = this.invoices.findIndex((i) => i.id === invoiceId);
    if (invIndex === -1) return { success: false, error: "Invoice not found" };

    const inv = this.invoices[invIndex];
    if (
      inv.status === InvoiceStatus.FINALIZED ||
      inv.status === InvoiceStatus.SENT_TO_TAX_ORG
    ) {
      return {
        success: false,
        error:
          "Cannot delete FINALIZED invoice. Must issue a Return Invoice instead.",
      };
    }

    inv.status = InvoiceStatus.CANCELLED;
    this.statusHistory.push({
      id: "HST-" + Math.random().toString(36).substring(2, 9),
      invoice_id: inv.id,
      from_status: inv.status, // previous status
      to_status: InvoiceStatus.CANCELLED,
      changed_at: new Date().toISOString(),
      changed_by: userId,
    });

    this.saveToStorage();
    return { success: true };
  }

  sendInvoiceToTaxOrg(
    invoiceId: string,
    userId: string = "SYSTEM"
  ): { success: boolean; error?: string; invoice?: Invoice } {
    const invIndex = this.invoices.findIndex((i) => i.id === invoiceId);
    if (invIndex === -1) return { success: false, error: "Invoice not found" };

    const inv = this.invoices[invIndex];
    if (inv.status !== InvoiceStatus.FINALIZED) {
      return { success: false, error: "Only FINALIZED invoices can be sent to the Tax Authority." };
    }

    inv.status = InvoiceStatus.SENT_TO_TAX_ORG;
    
    this.statusHistory.push({
      id: "HST-" + Math.random().toString(36).substring(2, 9),
      invoice_id: inv.id,
      from_status: InvoiceStatus.FINALIZED,
      to_status: InvoiceStatus.SENT_TO_TAX_ORG,
      changed_at: new Date().toISOString(),
      changed_by: userId,
    });

    this.saveToStorage();
    return { success: true, invoice: inv };
  }

  private generateJournalVoucherForInvoice(inv: Invoice) {
    const vouchersStr = localStorage.getItem("vouchers_data");
    const linesStr = localStorage.getItem("voucher_lines_data");
    const detailedAccountsStr = localStorage.getItem("detailed_accounts");

    const vouchers = vouchersStr ? JSON.parse(vouchersStr) : [];
    const lines = linesStr ? JSON.parse(linesStr) : [];
    const detailedAccounts = detailedAccountsStr ? JSON.parse(detailedAccountsStr) : [];

    const partner = this.partners.find(p => p.id === inv.client_id);
    const partnerName = partner ? partner.name : "ناشناس";

    // 1. Check or create detailed account for the partner
    let detailedAccount = detailedAccounts.find((d: any) => d.name === partnerName);
    if (!detailedAccount) {
      const codes = detailedAccounts.map((d: any) => Number(d.code)).filter((c: any) => !isNaN(c));
      const nextCode = codes.length > 0 ? Math.max(...codes) + 1 : 10001;
      
      detailedAccount = {
        id: "d-auto-" + Math.random().toString(36).substring(2, 9),
        code: String(nextCode),
        name: partnerName,
        type: inv.invoice_type === InvoiceType.SALE ? "Customer" : "Supplier"
      };
      detailedAccounts.push(detailedAccount);
      localStorage.setItem("detailed_accounts", JSON.stringify(detailedAccounts));
    }

    // Create a balanced journal voucher
    const nextVoucherNumber = vouchers.length > 0 ? Math.max(...vouchers.map((v: any) => v.voucher_number)) + 1 : 1;
    const voucherId = "v-auto-" + Math.random().toString(36).substring(2, 9);
    
    const newVoucherHeader = {
      id: voucherId,
      voucher_number: nextVoucherNumber,
      date: new Date().toISOString().split("T")[0],
      created_at: new Date().toISOString(),
      status: "TEMPORARY",
      description: `بابت صدور خودکار سند حسابداری فاکتور ${
        inv.invoice_type === InvoiceType.SALE ? "فروش" : 
        inv.invoice_type === InvoiceType.PURCHASE ? "خرید" : 
        inv.invoice_type === InvoiceType.SALE_RETURN ? "برگشت از فروش" : "برگشت از خرید"
      } شماره ${inv.invoice_number} - مشتری/همکار: ${partnerName}`,
      user_id: "SYSTEM_COMMERCIAL"
    };

    const newVoucherLines: any[] = [];

    if (inv.invoice_type === InvoiceType.SALE) {
      // Debit: Accounts Receivable (a1020)
      newVoucherLines.push({
        id: "vl-" + Math.random().toString(36).substring(2, 9),
        voucher_id: voucherId,
        account_id: "a1020",
        detailed_account_id: detailedAccount.id,
        debit: inv.total_net_amount,
        credit: 0,
        description: `بابت بدهکار مشتری فاکتور فروش شماره ${inv.invoice_number}`
      });

      // Credit: Sales Revenue (a4010)
      newVoucherLines.push({
        id: "vl-" + Math.random().toString(36).substring(2, 9),
        voucher_id: voucherId,
        account_id: "a4010",
        debit: 0,
        credit: inv.total_gross_amount - (inv.total_discount_line + inv.total_discount_header),
        description: `بابت فروش کالا موضوع فاکتور ${inv.invoice_number}`
      });

      // Credit: VAT Payable (a2020)
      if (inv.total_vat_amount > 0) {
        newVoucherLines.push({
          id: "vl-" + Math.random().toString(36).substring(2, 9),
          voucher_id: voucherId,
          account_id: "a2020",
          debit: 0,
          credit: inv.total_vat_amount,
          description: `بابت مالیات و عوارض ارزش افزوده فاکتور ${inv.invoice_number}`
        });
      }
    } else if (inv.invoice_type === InvoiceType.PURCHASE) {
      // Debit: Merchandise Inventory (a1030)
      newVoucherLines.push({
        id: "vl-" + Math.random().toString(36).substring(2, 9),
        voucher_id: voucherId,
        account_id: "a1030",
        debit: inv.total_gross_amount - (inv.total_discount_line + inv.total_discount_header),
        credit: 0,
        description: `بابت خرید کالا موضوع فاکتور ${inv.invoice_number}`
      });

      // Debit: VAT Paid/Receivable (a1040)
      if (inv.total_vat_amount > 0) {
        newVoucherLines.push({
          id: "vl-" + Math.random().toString(36).substring(2, 9),
          voucher_id: voucherId,
          account_id: "a1040",
          debit: inv.total_vat_amount,
          credit: 0,
          description: `بابت مالیات و عوارض ارزش افزوده فاکتور خرید ${inv.invoice_number}`
        });
      }

      // Credit: Accounts Payable (a2010)
      newVoucherLines.push({
        id: "vl-" + Math.random().toString(36).substring(2, 9),
        voucher_id: voucherId,
        account_id: "a2010",
        detailed_account_id: detailedAccount.id,
        debit: 0,
        credit: inv.total_net_amount,
        description: `بابت بستانکار تامین‌کننده فاکتور خرید شماره ${inv.invoice_number}`
      });
    }

    if (newVoucherLines.length > 0) {
      vouchers.push(newVoucherHeader);
      lines.push(...newVoucherLines);

      localStorage.setItem("vouchers_data", JSON.stringify(vouchers));
      localStorage.setItem("voucher_lines_data", JSON.stringify(lines));
      console.log(`[Financial System] Journal Voucher #${nextVoucherNumber} generated successfully for invoice ${inv.invoice_number}.`);
    }
  }
}
