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
 * enum PersonType {
 *   REAL
 *   LEGAL
 * }
 *
 * enum CounterpartyStatus {
 *   ACTIVE
 *   INACTIVE
 * }
 *
 * model Counterparty {
 *   id            String              @id @default(uuid())
 *   code          String              @unique // کد تفصیلی
 *   person_type   PersonType          // حقیقی یا حقوقی
 *   company_name  String?
 *   first_name    String?
 *   last_name     String?
 *   national_id   String              @unique // کد ملی ۱۰ رقمی یا شناسه ملی ۱۱ رقمی
 *   economic_code String?             // کد اقتصادی
 *   credit_limit  Decimal             @default(0) @db.Decimal(18, 2) // سقف اعتبار
 *   is_customer   Boolean             @default(false)
 *   is_supplier   Boolean             @default(false)
 *   status        CounterpartyStatus  @default(ACTIVE)
 *   description   String?
 *   created_at    DateTime            @default(now())
 *
 *   contacts      CounterpartyContact[]
 * }
 *
 * model CounterpartyContact {
 *   id              String       @id @default(uuid())
 *   counterparty_id String
 *   province        String?
 *   city            String?
 *   postal_code     String?      // 10 digits
 *   phone_number    String?
 *   mobile_number   String?      // for SMS alerts
 *   address         String?
 *
 *   counterparty    Counterparty @relation(fields: [counterparty_id], references: [id], onDelete: Cascade)
 * }
 */

export enum PersonType {
  REAL = "REAL",
  LEGAL = "LEGAL",
}

export enum CounterpartyStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}

export interface Counterparty {
  id: string;
  code: string;
  person_type: PersonType;
  company_name?: string;
  first_name?: string;
  last_name?: string;
  national_id: string;
  economic_code?: string;
  credit_limit: number;
  is_customer: boolean;
  is_supplier: boolean;
  status: CounterpartyStatus;
  description?: string;
}

export interface CounterpartyContact {
  id: string;
  counterparty_id: string;
  province?: string;
  city?: string;
  postal_code?: string;
  phone_number?: string;
  mobile_number?: string;
  address?: string;
}

// Helper types to simulate related data for exposure calculations
export interface MockLedger {
  counterparty_id: string;
  debit_balance: number; // مانده بدهکاری معین
}

export interface MockCheque {
  counterparty_id: string;
  amount: number;
  status: "IN_TRANSIT" | "CLEARED" | "BOUNCED"; // چک‌های در جریان وصول
}

export interface MockInvoice {
  id: string;
  counterparty_id: string;
  amount: number;
  status: "DRAFT" | "APPROVED"; // فاکتورهای تایید نشده
  due_date: string;
  paid_amount: number;
}

export class InvalidNationalIdException extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidNationalIdException";
  }
}

export class CreditLimitExceededException extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CreditLimitExceededException";
  }
}

export class CounterpartyService {
  /**
   * 1. Iranian National ID Validation Algorithm
   * Throws InvalidNationalIdException if validation fails, otherwise returns true.
   */
  public static validateIranianNationalId(id: string): boolean {
    if (!id || id.trim() === "") {
      throw new InvalidNationalIdException("National ID cannot be empty.");
    }
    
    const digits = id.trim();
    if (!/^\d{10}$/.test(digits) && !/^\d{11}$/.test(digits)) {
      throw new InvalidNationalIdException("National ID must be exactly 10 or 11 numeric digits.");
    }

    if (digits.length === 10) {
      // Validate Real Person National ID (کد ملی اشخاص حقیقی)
      if (/^(\d)\1{9}$/.test(digits)) {
        throw new InvalidNationalIdException("National ID cannot be repeated digits.");
      }

      let sum = 0;
      for (let i = 0; i < 9; i++) {
        sum += parseInt(digits[i], 10) * (10 - i);
      }

      const remainder = sum % 11;
      const controlDigit = parseInt(digits[9], 10);

      const isValid = remainder < 2 
        ? controlDigit === remainder 
        : controlDigit === 11 - remainder;

      if (!isValid) {
        throw new InvalidNationalIdException("Invalid Control Digit for 10-digit National ID.");
      }
      return true;
    } else if (digits.length === 11) {
      // Validate Legal Person National ID (شناسه ملی شرکت‌ها)
      const controlDigit = parseInt(digits[10], 10);
      const d1 = parseInt(digits[9], 10) + 2;
      const coefficients = [29, 27, 23, 19, 17, 29, 27, 23, 19, 17];
      
      let sum = 0;
      for (let i = 0; i < 10; i++) {
        sum += (parseInt(digits[i], 10) + d1) * coefficients[i];
      }
      
      let remainder = sum % 11;
      if (remainder === 10) remainder = 0;

      if (controlDigit !== remainder) {
        throw new InvalidNationalIdException("Invalid Control Digit for 11-digit Legal National ID.");
      }
      return true;
    }

    throw new InvalidNationalIdException("Validation failed due to unknown error.");
  }

  /**
   * 2. Real-Time Credit Exposure Calculator
   */
  public static getCreditExposure(
    counterparty_id: string,
    ledgers: MockLedger[],
    cheques: MockCheque[],
    invoices: MockInvoice[]
  ): number {
    // Current Ledger Balance (مانده بدهکاری معین حسابهای دریافتنی)
    const ledgerBalance = ledgers
      .filter((l) => l.counterparty_id === counterparty_id)
      .reduce((acc, curr) => acc + curr.debit_balance, 0);

    // Total Value of Cheques in Transit (چکهای در جریان وصول نزد بانک)
    const chequesInTransit = cheques
      .filter((c) => c.counterparty_id === counterparty_id && c.status === "IN_TRANSIT")
      .reduce((acc, curr) => acc + curr.amount, 0);

    // Unapproved Draft Invoices
    const unapprovedInvoices = invoices
      .filter((i) => i.counterparty_id === counterparty_id && i.status === "DRAFT")
      .reduce((acc, curr) => acc + curr.amount, 0);

    // Total Exposure = Ledger + Cheques In Transit + Draft Invoices
    const totalExposure = ledgerBalance + chequesInTransit + unapprovedInvoices;
    
    return totalExposure;
  }

  /**
   * 3. Credit Limit Enforcement
   */
  public static isCreditApproved(
    counterparty: Counterparty,
    new_invoice_amount: number,
    ledgers: MockLedger[],
    cheques: MockCheque[],
    invoices: MockInvoice[]
  ): boolean {
    const currentExposure = this.getCreditExposure(
      counterparty.id,
      ledgers,
      cheques,
      invoices
    );

    return (currentExposure + new_invoice_amount) <= counterparty.credit_limit;
  }

  /**
   * Throws CreditLimitExceededException if credit is breached.
   */
  public static enforceCreditLimit(
    counterparty: Counterparty,
    new_invoice_amount: number,
    ledgers: MockLedger[],
    cheques: MockCheque[],
    invoices: MockInvoice[]
  ): void {
    const isApproved = this.isCreditApproved(
      counterparty,
      new_invoice_amount,
      ledgers,
      cheques,
      invoices
    );

    if (!isApproved) {
      const currentExposure = this.getCreditExposure(counterparty.id, ledgers, cheques, invoices);
      throw new CreditLimitExceededException(
        `Credit limit exceeded! Limit: ${counterparty.credit_limit.toLocaleString()}, ` +
        `Current Exposure: ${currentExposure.toLocaleString()}, ` +
        `Attempting to add: ${new_invoice_amount.toLocaleString()}`
      );
    }
  }

  /**
   * 4. Account Aging Report Logic (گزارش سنسنجی بدهیها)
   * 
   * Provides a breakdown of unpaid invoices by aging buckets.
   */
  public static getAgingReport(
    counterparty_id: string,
    invoices: MockInvoice[],
    currentDate: Date = new Date()
  ): {
    totalOutstanding: number;
    days0To30: number;
    days31To60: number;
    days61To90: number;
    daysOver90: number;
  } {
    const report = {
      totalOutstanding: 0,
      days0To30: 0,
      days31To60: 0,
      days61To90: 0,
      daysOver90: 0,
    };

    const MS_PER_DAY = 1000 * 60 * 60 * 24;

    invoices
      .filter((i) => i.counterparty_id === counterparty_id && i.amount > i.paid_amount)
      .forEach((invoice) => {
        const outstandingAmount = invoice.amount - invoice.paid_amount;
        report.totalOutstanding += outstandingAmount;

        const dueDate = new Date(invoice.due_date);
        const daysOverdue = Math.floor((currentDate.getTime() - dueDate.getTime()) / MS_PER_DAY);

        if (daysOverdue <= 0) {
          // Not yet due, but outstanding
          report.days0To30 += outstandingAmount;
        } else if (daysOverdue <= 30) {
          report.days0To30 += outstandingAmount;
        } else if (daysOverdue <= 60) {
          report.days31To60 += outstandingAmount;
        } else if (daysOverdue <= 90) {
          report.days61To90 += outstandingAmount;
        } else {
          report.daysOver90 += outstandingAmount;
        }
      });

    return report;
  }
}
