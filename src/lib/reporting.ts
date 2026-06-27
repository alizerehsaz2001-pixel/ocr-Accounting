export interface TrialBalanceRow {
  account_code: string;
  account_name: string;
  level: "GROUP" | "LEDGER" | "SUBLEDGER";
  // گردش قبل از دوره
  opening_debit: number;
  opening_credit: number;
  // گردش طی دوره
  period_debit: number;
  period_credit: number;
  // جمع گردش تا کنون
  ytd_debit: number;
  ytd_credit: number;
  // مانده نهایی
  closing_balance_debit: number;
  closing_balance_credit: number;
}

export interface JournalEntry {
  date: string;
  voucher_number: number;
  header_desc: string;
  account_code: string;
  account_name: string;
  line_desc: string;
  debit: number;
  credit: number;
}

export interface LedgerEntry {
  date: string;
  voucher_number: number;
  description: string;
  debit: number;
  credit: number;
  running_balance: number;
}

export interface BalanceSheetItem {
  id: string;
  name: string;
  amount: number;
}

export interface BalanceSheetData {
  assets: {
    current: BalanceSheetItem[];
    non_current: BalanceSheetItem[];
    total: number;
  };
  liabilities: {
    current: BalanceSheetItem[];
    non_current: BalanceSheetItem[];
    total: number;
  };
  equity: {
    items: BalanceSheetItem[];
    total: number;
  };
}

export const SQL_ARCHITECTURAL_QUERIES = {
  journal: `-- 1. دفتر روزنامه (Journal Ledger)
-- نمایش اسناد تایید یا قطعی شده به ترتیب کرونولوژیک (تاریخ و شماره سند)
SELECT 
    h.date, 
    h.voucher_number, 
    h.description AS header_desc,
    l.account_id,
    l.detailed_account_id,
    l.description AS line_desc,
    l.debit, 
    l.credit
FROM voucher_headers h
JOIN voucher_lines l ON h.id = l.voucher_id
WHERE h.status IN ('APPROVED', 'PERMANENT')
  AND h.date BETWEEN :start_date AND :end_date
ORDER BY h.date ASC, h.voucher_number ASC, l.id ASC;`,

  ledger: `-- 2. دفتر کل / معین (Ledger with Running Balance)
-- استفاده از Window Functions برای محاسبه مانده لحظه‌ای
WITH PriorBalance AS (
    SELECT 
        SUM(debit) - SUM(credit) AS opening_balance
    FROM voucher_headers h
    JOIN voucher_lines l ON h.id = l.voucher_id
    WHERE h.status IN ('APPROVED', 'PERMANENT') 
      AND h.date < :start_date
      AND l.account_id = :target_account_id
),
PeriodTransactions AS (
    SELECT 
        h.date,
        h.voucher_number,
        l.description,
        l.debit,
        l.credit
    FROM voucher_headers h
    JOIN voucher_lines l ON h.id = l.voucher_id
    WHERE h.status IN ('APPROVED', 'PERMANENT')
      AND h.date BETWEEN :start_date AND :end_date
      AND l.account_id = :target_account_id
)
SELECT 
    date,
    voucher_number,
    description,
    debit,
    credit,
    -- محاسبه مانده لحظه‌ای (Running Balance)
    (SELECT opening_balance FROM PriorBalance) + 
    SUM(debit - credit) OVER (ORDER BY date ASC, voucher_number ASC) AS running_balance
FROM PeriodTransactions
ORDER BY date ASC, voucher_number ASC;`,

  trialBalance: `-- 3. تراز آزمایشی ۸ ستونی (8-Column Trial Balance with Roll-up)
-- با استفاده از CTE و تجمیع از پایین به بالا (Subledger -> Ledger -> Group)
WITH AccountBalances AS (
    SELECT 
        a.id, a.code, a.name, a.level, a.parent_id,
        -- گردش قبل از دوره
        COALESCE(SUM(CASE WHEN h.date < :start_date THEN l.debit ELSE 0 END), 0) AS op_debit,
        COALESCE(SUM(CASE WHEN h.date < :start_date THEN l.credit ELSE 0 END), 0) AS op_credit,
        -- گردش طی دوره
        COALESCE(SUM(CASE WHEN h.date >= :start_date THEN l.debit ELSE 0 END), 0) AS per_debit,
        COALESCE(SUM(CASE WHEN h.date >= :start_date THEN l.credit ELSE 0 END), 0) AS per_credit
    FROM accounts a
    LEFT JOIN voucher_lines l ON a.id = l.account_id
    LEFT JOIN voucher_headers h ON l.voucher_id = h.id 
                                AND h.status IN ('APPROVED', 'PERMANENT')
                                AND h.date <= :end_date
    WHERE a.level = 'SUBLEDGER'
    GROUP BY a.id, a.code, a.name, a.level, a.parent_id
),
RollupLedger AS (
    -- Roll-up to Ledger level
    SELECT 
        p.id, p.code, p.name, p.level, p.parent_id,
        SUM(b.op_debit) AS op_debit, SUM(b.op_credit) AS op_credit,
        SUM(b.per_debit) AS per_debit, SUM(b.per_credit) AS per_credit
    FROM accounts p
    JOIN AccountBalances b ON b.parent_id = p.id
    GROUP BY p.id, p.code, p.name, p.level, p.parent_id
),
RollupGroup AS (
    -- Roll-up to Group level
    SELECT 
        g.id, g.code, g.name, g.level, g.parent_id,
        SUM(rl.op_debit) AS op_debit, SUM(rl.op_credit) AS op_credit,
        SUM(rl.per_debit) AS per_debit, SUM(rl.per_credit) AS per_credit
    FROM accounts g
    JOIN RollupLedger rl ON rl.parent_id = g.id
    GROUP BY g.id, g.code, g.name, g.level, g.parent_id
)
-- ترکیب تمامی سطوح و محاسبه ستون‌های YTD و Closing
SELECT 
    code, name, level,
    op_debit, op_credit,                     -- ستون ۱ و ۲: قبل از دوره
    per_debit, per_credit,                   -- ستون ۳ و ۴: طی دوره
    (op_debit + per_debit) AS ytd_debit,     -- ستون ۵: جمع گردش تا کنون بدهکار
    (op_credit + per_credit) AS ytd_credit,  -- ستون ۶: جمع گردش تا کنون بستانکار
    -- ستون ۷ و ۸: مانده نهایی
    GREATEST((op_debit + per_debit) - (op_credit + per_credit), 0) AS closing_debit,
    GREATEST((op_credit + per_credit) - (op_debit + per_debit), 0) AS closing_credit
FROM (
    SELECT * FROM AccountBalances
    UNION ALL
    SELECT * FROM RollupLedger
    UNION ALL
    SELECT * FROM RollupGroup
) AllLevels
ORDER BY code ASC;`,

  optimization: `-- 4. استراتژی بهینه‌سازی (Performance Optimization)
-- برای میلیون‌ها رکورد، اجرای کوئری روی کل دیتابیس کُند خواهد بود.
-- راهکار: ایجاد جدول Summary (یا Materialized View) برای مانده‌های روزانه/ماهانه

-- ساخت Materialized View برای گردش ماهانه حساب‌ها
CREATE MATERIALIZED VIEW mv_account_monthly_balances AS
SELECT 
    l.account_id,
    l.detailed_account_id,
    DATE_TRUNC('month', h.date) AS period_month,
    SUM(l.debit) AS total_debit,
    SUM(l.credit) AS total_credit
FROM voucher_headers h
JOIN voucher_lines l ON h.id = l.voucher_id
WHERE h.status IN ('APPROVED', 'PERMANENT')
GROUP BY l.account_id, l.detailed_account_id, DATE_TRUNC('month', h.date);

-- ایجاد ایندکس روی Materialized View برای جستجوی سریع
CREATE UNIQUE INDEX idx_mv_monthly_balances 
ON mv_account_monthly_balances (account_id, detailed_account_id, period_month);

-- نکته بک‌اند:
-- برای گرفتن مانده یک حساب در یک تاریخ خاص، سیستم فقط رکوردهای ماهانه از MV 
-- را جمع می‌زند و فقط برای روزهای باقی‌مانده از ماه جاری به جدول اصلی رجوع می‌کند.
-- این کار پردازش را از O(N) که N کل آرتیکل‌هاست به O(M) که M ماه‌های گذشته است کاهش می‌دهد.`
};

export const MOCK_TRIAL_BALANCE: TrialBalanceRow[] = [
  { account_code: "1", account_name: "دارایی‌ها", level: "GROUP", opening_debit: 1000, opening_credit: 0, period_debit: 500, period_credit: 200, ytd_debit: 1500, ytd_credit: 200, closing_balance_debit: 1300, closing_balance_credit: 0 },
  { account_code: "10", account_name: "دارایی‌های جاری", level: "LEDGER", opening_debit: 1000, opening_credit: 0, period_debit: 500, period_credit: 200, ytd_debit: 1500, ytd_credit: 200, closing_balance_debit: 1300, closing_balance_credit: 0 },
  { account_code: "1010", account_name: "موجودی نقد و بانک", level: "SUBLEDGER", opening_debit: 600, opening_credit: 0, period_debit: 300, period_credit: 200, ytd_debit: 900, ytd_credit: 200, closing_balance_debit: 700, closing_balance_credit: 0 },
  { account_code: "1020", account_name: "حساب‌های دریافتنی", level: "SUBLEDGER", opening_debit: 400, opening_credit: 0, period_debit: 200, period_credit: 0, ytd_debit: 600, ytd_credit: 0, closing_balance_debit: 600, closing_balance_credit: 0 },
  { account_code: "2", account_name: "بدهی‌ها", level: "GROUP", opening_debit: 0, opening_credit: 800, period_debit: 100, period_credit: 400, ytd_debit: 100, ytd_credit: 1200, closing_balance_debit: 0, closing_balance_credit: 1100 },
];

export const MOCK_JOURNAL: JournalEntry[] = [
  { date: "1402/12/01", voucher_number: 101, header_desc: "سرمایه‌گذاری اولیه", account_code: "1010", account_name: "موجودی نقد و بانک", line_desc: "واریز به بانک سامان", debit: 500000000, credit: 0 },
  { date: "1402/12/01", voucher_number: 101, header_desc: "سرمایه‌گذاری اولیه", account_code: "3010", account_name: "سرمایه", line_desc: "آورده نقدی شرکا", debit: 0, credit: 500000000 },
  { date: "1402/12/05", voucher_number: 102, header_desc: "خرید ملزومات", account_code: "1030", account_name: "موجودی کالا", line_desc: "خرید ۱۰ عدد لپ‌تاپ", debit: 200000000, credit: 0 },
  { date: "1402/12/05", voucher_number: 102, header_desc: "خرید ملزومات", account_code: "1010", account_name: "موجودی نقد و بانک", line_desc: "پرداخت از بانک سامان", debit: 0, credit: 200000000 },
];

export const MOCK_LEDGER: LedgerEntry[] = [
  { date: "1402/12/01", voucher_number: 101, description: "واریز به بانک سامان (سرمایه)", debit: 500000000, credit: 0, running_balance: 500000000 },
  { date: "1402/12/05", voucher_number: 102, description: "پرداخت بابت خرید لپ‌تاپ", debit: 0, credit: 200000000, running_balance: 300000000 },
  { date: "1402/12/10", voucher_number: 105, description: "دریافت از مشتری آلفا", debit: 50000000, credit: 0, running_balance: 350000000 },
];

export const MOCK_BALANCE_SHEET: BalanceSheetData = {
  assets: {
    current: [
      { id: "1010", name: "موجودی نقد و بانک", amount: 350000000 },
      { id: "1020", name: "حساب‌های دریافتنی", amount: 150000000 },
      { id: "1030", name: "موجودی کالا", amount: 200000000 },
    ],
    non_current: [
      { id: "1110", name: "دارایی‌های ثابت مشهود", amount: 500000000 },
    ],
    total: 1200000000
  },
  liabilities: {
    current: [
      { id: "2010", name: "حساب‌های پرداختنی", amount: 100000000 },
      { id: "2020", name: "پیش‌دریافت‌ها", amount: 50000000 },
    ],
    non_current: [
      { id: "2110", name: "تسهیلات بلندمدت", amount: 200000000 },
    ],
    total: 350000000
  },
  equity: {
    items: [
      { id: "3010", name: "سرمایه", amount: 500000000 },
      { id: "3020", name: "سود (زیان) انباشته", amount: 200000000 },
      { id: "3030", name: "سود (زیان) دوره جاری", amount: 150000000 },
    ],
    total: 850000000
  }
};
