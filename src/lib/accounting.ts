export enum AccountLevel {
  GROUP = "GROUP",           // گروه (1 digit usually)
  LEDGER = "LEDGER",         // کل (2 digits)
  SUBLEDGER = "SUBLEDGER",   // معین (4-6 digits)
}

// 1. Database Schema Design (Types representing the tables)

/**
 * جدول اصلی حساب‌ها (ساختار درختی خودارجاعی)
 * Table: accounts
 */
export interface Account {
  id: string;
  code: string;         // e.g., '1' for Group, '10' for Ledger, '1010' for Subledger
  name: string;
  level: AccountLevel;
  parent_id: string | null; // Self-referencing foreign key to accounts(id)
}

/**
 * جدول حساب‌های تفصیلی شناور
 * Table: detailed_accounts
 */
export interface DetailedAccount {
  id: string;
  code: string;         // e.g., '10001'
  name: string;
  type: string;         // e.g., 'Customer', 'Supplier', 'Bank', 'Employee'
}

/**
 * جدول واسط بین معین و تفصیلی (رابطه چند به چند)
 * Table: account_detailed_links
 */
export interface AccountDetailedLink {
  account_id: string;          // Foreign key to accounts(id) - MUST be a SUBLEDGER
  detailed_account_id: string; // Foreign key to detailed_accounts(id)
}

// ----------------------------------------------------------------------
// Journal Voucher (صدور سند حسابداری) Schema
// ----------------------------------------------------------------------

export enum VoucherStatus {
  DRAFT = "DRAFT",         // پیش‌نویس
  TEMPORARY = "TEMPORARY", // موقت
  APPROVED = "APPROVED",   // تایید شده
  PERMANENT = "PERMANENT", // قطعی / قفل شده
}

/**
 * هدر سند حسابداری
 * Table: voucher_headers
 */
export interface VoucherHeader {
  id: string;
  voucher_number: number;       // شماره سند (متوالی)
  reference_number?: string;    // شماره عطف
  date: string;                 // تاریخ سند (ISO string / Timestamp)
  created_at: string;           // تاریخ ثبت سیستم
  status: VoucherStatus;        // وضعیت سند
  description: string;          // شرح کلی سند
  user_id: string;              // کاربر ثبت‌کننده
}

/**
 * سطور (آرتیکل‌های) سند حسابداری
 * Table: voucher_lines
 */
export interface VoucherLine {
  id: string;
  voucher_id: string;           // ارتباط با هدر سند
  account_id: string;           // کد حساب معین (باید در سطح SUBLEDGER باشد)
  detailed_account_id?: string; // کد حساب تفصیلی شناور (در صورت نیاز معین)
  debit: number;                // مبلغ بدهکار
  credit: number;               // مبلغ بستانکار
  description: string;          // شرح ردیف
  cost_center_id?: string;      // مرکز هزینه/پروژه (اختیاری)
}

// 2. Backend Core Logic

/**
 * تولید یا اعتبارسنجی کدهای حساب
 */
export function validateAccountCode(
  code: string,
  level: AccountLevel,
  parentCode: string | null
): { valid: boolean; error?: string } {
  if (parentCode && !code.startsWith(parentCode)) {
    return { valid: false, error: `کد حساب (${code}) باید با کد والد (${parentCode}) شروع شود.` };
  }
  if (level === AccountLevel.GROUP && code.length !== 1) {
    return { valid: false, error: "کد حساب گروه باید ۱ رقم باشد." };
  }
  if (level === AccountLevel.LEDGER && code.length !== 2) {
    return { valid: false, error: "کد حساب کل باید ۲ رقم باشد." };
  }
  if (level === AccountLevel.SUBLEDGER && code.length !== 4) {
    return { valid: false, error: "کد حساب معین باید ۴ رقم باشد." };
  }
  return { valid: true };
}

/**
 * اعتبارسنجی بخش صدور سند (Voucher Validation)
 */
export function validateVoucherItem(
  accountId: string,
  detailedId: string,
  mockDb: {
    accounts: Account[];
    links: AccountDetailedLink[];
  }
): { valid: boolean; error?: string } {
  const account = mockDb.accounts.find((a) => a.id === accountId);
  if (!account) return { valid: false, error: "حساب یافت نشد." };

  if (account.level !== AccountLevel.SUBLEDGER) {
    return { 
      valid: false, 
      error: `امکان ثبت سند در سطح «${account.level}» وجود ندارد. اسناد باید در سطح «معین» (SUBLEDGER) ثبت شوند.` 
    };
  }

  const isLinked = mockDb.links.some(
    (link) => link.account_id === accountId && link.detailed_account_id === detailedId
  );

  if (!isLinked) {
    return { valid: false, error: "حساب تفصیلی انتخاب شده به این حساب معین متصل نیست." };
  }

  return { valid: true };
}

/**
 * قوانین حسابداری برای یک سند کامل (Core Business Logic & Validations)
 * بررسی می‌شود که آیا سند آماده ذخیره‌سازی هست یا خیر.
 */
export function validateVoucher(
  header: VoucherHeader,
  lines: VoucherLine[],
  existingHeader?: VoucherHeader // در صورت ویرایش سند پاس داده می‌شود
): { valid: boolean; error?: string } {
  // 1. بررسی وضعیت قطعی (Permanent Lock)
  // در صورتی که سند قبلاً قطعی شده باشد، هیچ تغییری مجاز نیست.
  if (existingHeader && existingHeader.status === VoucherStatus.PERMANENT) {
    return { valid: false, error: "سند قطعی شده (PERMANENT) به هیچ وجه قابل ویرایش یا حذف نیست." };
  }

  // 2. قانون عدم همپوشانی مبالغ و مقادیر منفی
  for (const line of lines) {
    if (line.debit < 0 || line.credit < 0) {
      return { valid: false, error: "مبالغ بدهکار و بستانکار نمی‌توانند منفی باشند." };
    }
    if (line.debit > 0 && line.credit > 0) {
      return { valid: false, error: "در یک سطر سند، نمی‌توان همزمان هم مبلغ بدهکار و هم بستانکار داشت." };
    }
    if (line.debit === 0 && line.credit === 0) {
      return { valid: false, error: "ردیف بدون مبلغ (بدهکار و بستانکار صفر) مجاز نیست." };
    }
  }

  // 3. قانون تراز بودن (Balancing Rule)
  // این قانون معمولاً برای اسناد موقت، تایید شده و قطعی اجباری است
  // ممکن است برای سند پیش‌نویس (DRAFT) استثنا قائل شویم، اما در اینجا برای همه لحاظ می‌کنیم.
  if (header.status !== VoucherStatus.DRAFT) {
    const totalDebit = lines.reduce((sum, line) => sum + line.debit, 0);
    const totalCredit = lines.reduce((sum, line) => sum + line.credit, 0);
    
    // مقایسه با دقت بالا برای جلوگیری از خطای اعشاری
    if (Math.abs(totalDebit - totalCredit) > 0.001) {
      return { valid: false, error: `سند تراز نیست. جمع بدهکار: ${totalDebit}، جمع بستانکار: ${totalCredit}` };
    }
  }

  return { valid: true };
}

// 3. الگوریتم شماره‌گذاری مجدد (Re-numbering Algorithm)

/**
 * شماره‌گذاری مجدد اسناد موقت بر اساس تاریخ
 * هدف: از بین بردن شکاف‌های شماره سند (Gaps) به ترتیب زمانی.
 * توجه: اسناد قطعی شده نباید شماره‌شان تغییر کند (معمولاً در سیستم‌های واقعی
 * شماره سریال قطعی جداگانه است یا قبل از قطعی شدن شماره‌گذاری مجدد می‌شود).
 */
export function renumberVouchers(vouchers: VoucherHeader[]): VoucherHeader[] {
  // جدا کردن اسناد موقت از اسناد قطعی
  // فرض بر این است که فقط اسنادی که قفل نشده‌اند شماره‌گذاری مجدد می‌شوند
  const mutableVouchers = vouchers.filter(v => v.status !== VoucherStatus.PERMANENT);
  
  // مرتب‌سازی بر اساس تاریخ صعودی و سپس تاریخ ثبت (created_at) به عنوان پشتیبان
  mutableVouchers.sort((a, b) => {
    const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
    if (dateDiff === 0) {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    }
    return dateDiff;
  });

  // اختصاص شماره‌های جدید به صورت متوالی (از 1 به بالا)
  let nextVoucherNumber = 1;
  const updatedVouchers = mutableVouchers.map(voucher => ({
    ...voucher,
    voucher_number: nextVoucherNumber++
  }));

  // ترکیب با اسناد قطعی شده (که تغییری نمی‌کنند)
  const immutableVouchers = vouchers.filter(v => v.status === VoucherStatus.PERMANENT);
  
  return [...immutableVouchers, ...updatedVouchers];
}
