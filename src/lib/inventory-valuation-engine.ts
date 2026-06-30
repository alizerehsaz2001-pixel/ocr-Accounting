/**
 * Prisma Schema Reference (As requested for production database architecture):
 *
 * generator client {
 *   provider = "prisma-client-js"
 * }
 *
 * datasource db {
 *   provider = "postgresql"
 *   url      = env("DATABASE_URL")
 * }
 *
 * enum TransactionType {
 *   PURCHASE
 *   SALE
 *   PURCHASE_RETURN
 *   SALE_RETURN
 *   INITIAL_BALANCE
 * }
 *
 * model Product {
 *   id            String   @id @default(uuid())
 *   code          String   @unique
 *   name          String
 *   current_cost  Decimal  @default(0) @db.Decimal(18, 4) // Cached Moving Average
 *   
 *   transactions  InventoryTransaction[]
 *   historical_costs ProductHistoricalCost[]
 * }
 *
 * model InventoryTransaction {
 *   id               String          @id @default(uuid())
 *   product_id       String
 *   transaction_type TransactionType
 *   quantity         Decimal         @db.Decimal(18, 4)
 *   unit_cost        Decimal         @db.Decimal(18, 4) // Buy price for Purchase, MAC for Sales
 *   transaction_date DateTime        @default(now())
 *   reference_id     String?         // Invoice ID
 *   
 *   product          Product         @relation(fields: [product_id], references: [id])
 * }
 *
 * // Performance Optimization: Caching / Summary Table
 * // Stores the calculated Moving Average Cost at the end of each day/month or after each batch
 * model ProductHistoricalCost {
 *   id               String   @id @default(uuid())
 *   product_id       String
 *   date             DateTime
 *   average_cost     Decimal  @db.Decimal(18, 4)
 *   closing_quantity Decimal  @db.Decimal(18, 4)
 *   
 *   product          Product  @relation(fields: [product_id], references: [id])
 *   
 *   @@unique([product_id, date])
 * }
 */

export enum TransactionType {
  PURCHASE = "PURCHASE",
  SALE = "SALE",
  PURCHASE_RETURN = "PURCHASE_RETURN",
  SALE_RETURN = "SALE_RETURN",
  INITIAL_BALANCE = "INITIAL_BALANCE",
}

export interface InventoryTransaction {
  id: string;
  product_id: string;
  transaction_type: TransactionType;
  quantity: number;
  unit_cost: number;
  transaction_date: Date;
  reference_id?: string;
}

export interface ProductProfitabilityReportRow {
  product_id: string;
  product_code: string;
  product_name: string;
  total_quantity_sold: number;
  total_gross_revenue: number;
  total_sales_discount: number;
  total_net_revenue: number;
  total_cogs: number;
  gross_profit: number;
  gross_profit_margin_percent: number;
}

// Simulated Products
export interface SimProduct {
  id: string;
  code: string;
  name: string;
}

// Sales transactions
export interface SalesInvoiceLine {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  net_amount: number;
  transaction_date: Date;
}

export class InventoryValuationEngine {
  /**
   * 2. MOVING WEIGHTED AVERAGE COST CALCULATION
   * 
   * Calculates the Moving Average Cost (MAC) and assigns the correct COGS to each sale transaction.
   * New Avg Cost = (Current Stock Value + New Purchase Value) / (Current Stock Qty + New Purchase Qty).
   */
  public static calculateMovingAverageCost(
    transactions: InventoryTransaction[]
  ): InventoryTransaction[] {
    // Sort transactions chronologically
    const sortedTx = [...transactions].sort(
      (a, b) => a.transaction_date.getTime() - b.transaction_date.getTime()
    );

    // Group by product
    const productLedgers: Record<string, { qty: number; value: number; currentMAC: number }> = {};
    const processedTransactions: InventoryTransaction[] = [];

    for (const tx of sortedTx) {
      if (!productLedgers[tx.product_id]) {
        productLedgers[tx.product_id] = { qty: 0, value: 0, currentMAC: 0 };
      }

      const ledger = productLedgers[tx.product_id];

      if (tx.transaction_type === TransactionType.PURCHASE || tx.transaction_type === TransactionType.INITIAL_BALANCE || tx.transaction_type === TransactionType.SALE_RETURN) {
        // Incoming stock
        const txValue = tx.quantity * tx.unit_cost;
        
        ledger.qty += tx.quantity;
        ledger.value += txValue;
        
        if (ledger.qty > 0) {
          ledger.currentMAC = ledger.value / ledger.qty;
        } else {
          ledger.currentMAC = 0; // Handle edge case: negative/zero inventory
        }

        processedTransactions.push({ ...tx, unit_cost: tx.unit_cost }); // Original unit cost is kept for incoming

      } else if (tx.transaction_type === TransactionType.SALE || tx.transaction_type === TransactionType.PURCHASE_RETURN) {
        // Outgoing stock -> Must strictly use current MAC
        const appliedMAC = ledger.currentMAC;
        const txValue = tx.quantity * appliedMAC;

        ledger.qty -= tx.quantity;
        ledger.value -= txValue;

        // If inventory goes negative, we might preserve the MAC, or handle it based on accounting standards.
        // Usually, MAC doesn't change on outgoing transactions.

        processedTransactions.push({ ...tx, unit_cost: appliedMAC }); // Outgoing uses calculated MAC
      }
    }

    return processedTransactions;
  }

  /**
   * 3. PRODUCT PROFITABILITY LOGIC
   * 
   * Generates the Product Profit and Loss Report over a date range.
   */
  public static generateProfitabilityReport(
    products: SimProduct[],
    salesLines: SalesInvoiceLine[],
    processedInventoryTransactions: InventoryTransaction[],
    startDate: Date,
    endDate: Date
  ): ProductProfitabilityReportRow[] {
    const reportMap = new Map<string, ProductProfitabilityReportRow>();

    // Initialize map
    for (const p of products) {
      reportMap.set(p.id, {
        product_id: p.id,
        product_code: p.code,
        product_name: p.name,
        total_quantity_sold: 0,
        total_gross_revenue: 0,
        total_sales_discount: 0,
        total_net_revenue: 0,
        total_cogs: 0,
        gross_profit: 0,
        gross_profit_margin_percent: 0,
      });
    }

    // Process Sales (Revenue & Discounts)
    for (const line of salesLines) {
      if (line.transaction_date >= startDate && line.transaction_date <= endDate) {
        const row = reportMap.get(line.product_id);
        if (row) {
          row.total_quantity_sold += line.quantity;
          row.total_gross_revenue += (line.quantity * line.unit_price);
          row.total_sales_discount += line.discount_amount;
          row.total_net_revenue += line.net_amount;
        }
      }
    }

    // Process COGS from processed inventory transactions (SALE transactions)
    for (const tx of processedInventoryTransactions) {
      if (
        tx.transaction_type === TransactionType.SALE &&
        tx.transaction_date >= startDate &&
        tx.transaction_date <= endDate
      ) {
        const row = reportMap.get(tx.product_id);
        if (row) {
          row.total_cogs += (tx.quantity * tx.unit_cost); // unit_cost here is the calculated MAC
        }
      }
    }

    // Calculate Margins
    for (const [_, row] of reportMap) {
      row.gross_profit = row.total_net_revenue - row.total_cogs;
      
      if (row.total_net_revenue > 0) {
        row.gross_profit_margin_percent = (row.gross_profit / row.total_net_revenue) * 100;
      } else {
        row.gross_profit_margin_percent = 0; // Handle division by zero
      }
    }

    // Filter out products with no activity and return array
    return Array.from(reportMap.values()).filter(r => r.total_quantity_sold > 0);
  }

  /**
   * Pure PostgreSQL implementation reference using CTEs and Window Functions
   * for calculating Moving Average Cost dynamically (Highly optimized for reporting).
   * 
   * This is provided as documentation within the engine.
   */
  public static readonly POSTGRESQL_MAC_QUERY = `
    WITH RECURSIVE InventoryLedger AS (
      SELECT
        id,
        product_id,
        transaction_type,
        transaction_date,
        quantity,
        unit_cost as raw_cost,
        CASE
          WHEN transaction_type IN ('PURCHASE', 'INITIAL_BALANCE', 'SALE_RETURN') THEN quantity
          ELSE -quantity
        END as signed_qty,
        CASE
          WHEN transaction_type IN ('PURCHASE', 'INITIAL_BALANCE', 'SALE_RETURN') THEN quantity * unit_cost
          ELSE 0
        END as incoming_value,
        ROW_NUMBER() OVER (PARTITION BY product_id ORDER BY transaction_date, id) as rn
      FROM inventory_transactions
    ),
    MovingAvg AS (
      SELECT
        id, product_id, transaction_type, transaction_date, quantity, raw_cost,
        signed_qty as cum_qty,
        incoming_value as cum_val,
        CASE
          WHEN signed_qty > 0 THEN incoming_value / signed_qty
          ELSE 0
        END as mac,
        rn
      FROM InventoryLedger
      WHERE rn = 1
      
      UNION ALL
      
      SELECT
        curr.id, curr.product_id, curr.transaction_type, curr.transaction_date, curr.quantity, curr.raw_cost,
        prev.cum_qty + curr.signed_qty as cum_qty,
        CASE
          WHEN curr.transaction_type IN ('PURCHASE', 'INITIAL_BALANCE', 'SALE_RETURN') THEN prev.cum_val + curr.incoming_value
          ELSE prev.cum_val - (curr.quantity * prev.mac) -- Deduction based on prev MAC
        END as cum_val,
        CASE
          WHEN curr.transaction_type IN ('PURCHASE', 'INITIAL_BALANCE', 'SALE_RETURN') THEN 
             (prev.cum_val + curr.incoming_value) / NULLIF(prev.cum_qty + curr.signed_qty, 0)
          ELSE prev.mac -- MAC doesn't change on sale
        END as mac,
        curr.rn
      FROM InventoryLedger curr
      JOIN MovingAvg prev ON curr.product_id = prev.product_id AND curr.rn = prev.rn + 1
    )
    SELECT * FROM MovingAvg;
  `;
}
