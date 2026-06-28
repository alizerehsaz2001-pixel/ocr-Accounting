export enum BankStatementStatus {
  UNMATCHED = 'UNMATCHED',
  AUTO_MATCHED = 'AUTO_MATCHED',
  MANUALLY_MATCHED = 'MANUALLY_MATCHED'
}

export enum ReconciliationMethod {
  AUTO = 'AUTO',
  MANUAL = 'MANUAL'
}

export interface InterBankTransfer {
  id: string;
  transfer_number: string;
  source_bank_account_id: string;
  destination_bank_account_id: string;
  amount: number;
  transfer_date: string;
  tracking_number: string;
  description: string;
  journal_voucher_id: string;
}

export interface BankStatementLine {
  id: string;
  bank_account_id: string;
  transaction_date: string;
  document_number: string;
  description: string;
  debit: number; // Withdrawal from bank
  credit: number; // Deposit into bank
  running_balance: number;
  reconciliation_status: BankStatementStatus;
}

export interface BankReconciliation {
  id: string;
  bank_statement_line_id: string;
  journal_voucher_line_id: string;
  matched_by: string;
  matched_at: string;
  method: ReconciliationMethod;
}

export interface SystemLedgerLine {
  id: string; 
  bank_account_id: string;
  date: string;
  document_number: string;
  debit: number; // Deposit into bank (in our books)
  credit: number; // Withdrawal from bank (in our books)
  description: string;
  is_reconciled: boolean;
}

export class BankOperationsEngine {
  private transfers: InterBankTransfer[] = [];
  private statementLines: BankStatementLine[] = [];
  private reconciliations: BankReconciliation[] = [];
  private ledgerLines: SystemLedgerLine[] = [];
  
  private accountCodes = {
    bankFees: '5101', // هزینه کارمزد بانکی
  };

  constructor() {
    this.loadFromStorage();
    if (this.ledgerLines.length === 0) {
      this.seedMockLedger();
    }
  }

  private loadFromStorage() {
    try {
      const storedTransfers = localStorage.getItem('bank_transfers_db');
      if (storedTransfers) this.transfers = JSON.parse(storedTransfers);
      
      const storedStatements = localStorage.getItem('bank_statements_db');
      if (storedStatements) this.statementLines = JSON.parse(storedStatements);
      
      const storedRecons = localStorage.getItem('bank_reconciliations_db');
      if (storedRecons) this.reconciliations = JSON.parse(storedRecons);
      
      const storedLedger = localStorage.getItem('bank_ledger_db');
      if (storedLedger) this.ledgerLines = JSON.parse(storedLedger);
    } catch (e) {
      console.error("Error loading bank operations DB", e);
    }
  }

  private saveToStorage() {
    localStorage.setItem('bank_transfers_db', JSON.stringify(this.transfers));
    localStorage.setItem('bank_statements_db', JSON.stringify(this.statementLines));
    localStorage.setItem('bank_reconciliations_db', JSON.stringify(this.reconciliations));
    localStorage.setItem('bank_ledger_db', JSON.stringify(this.ledgerLines));
  }

  private seedMockLedger() {
    // Seed some initial statements and ledger entries for Mellat and Saman
    const today = new Date().toISOString().split('T')[0];
    const yest = new Date(Date.now() - 24 * 3600 * 1000).toISOString().split('T')[0];
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString().split('T')[0];

    // Bank Statement Lines (what actually happened at the bank)
    this.statementLines = [
      // Bank Mellat Statements
      { id: "BSL-M-01", bank_account_id: "Bank_Mellat", transaction_date: twoDaysAgo, document_number: "PAY-1001", description: "واریز بابت فروش کالا", debit: 0, credit: 45000000, running_balance: 145000000, reconciliation_status: BankStatementStatus.UNMATCHED },
      { id: "BSL-M-02", bank_account_id: "Bank_Mellat", transaction_date: yest, document_number: "CHQ-882", description: "وصول چک نقدی مشتری", debit: 0, credit: 15000000, running_balance: 160000000, reconciliation_status: BankStatementStatus.UNMATCHED },
      { id: "BSL-M-03", bank_account_id: "Bank_Mellat", transaction_date: today, document_number: "TRX-4421", description: "خرید ملزومات اداری", debit: 3200000, credit: 0, running_balance: 156800000, reconciliation_status: BankStatementStatus.UNMATCHED },
      { id: "BSL-M-04", bank_account_id: "Bank_Mellat", transaction_date: today, document_number: "FEE-M1", description: "کارمزد انتقال وجه پایا", debit: 120000, credit: 0, running_balance: 156680000, reconciliation_status: BankStatementStatus.UNMATCHED },
      { id: "BSL-M-05", bank_account_id: "Bank_Mellat", transaction_date: today, document_number: "DEP-UNK", description: "واریز شناسه نامشخص پایا", debit: 0, credit: 8500000, running_balance: 165180000, reconciliation_status: BankStatementStatus.UNMATCHED },

      // Bank Saman Statements
      { id: "BSL-S-01", bank_account_id: "Bank_Saman", transaction_date: twoDaysAgo, document_number: "REF-772", description: "واریز سود سپرده ماهانه", debit: 0, credit: 12500000, running_balance: 62500000, reconciliation_status: BankStatementStatus.UNMATCHED },
      { id: "BSL-S-02", bank_account_id: "Bank_Saman", transaction_date: yest, document_number: "TRX-777", description: "پرداخت قبض شرکت", debit: 5000000, credit: 0, running_balance: 57500000, reconciliation_status: BankStatementStatus.UNMATCHED }
    ];

    // System Ledger Lines (what our books recorded)
    this.ledgerLines = [
      // Bank Mellat Ledger entries
      { id: "LL-M-101", bank_account_id: "Bank_Mellat", date: twoDaysAgo, document_number: "PAY-1001", debit: 45000000, credit: 0, description: "ثبت فروش نقدی شرکت", is_reconciled: false },
      { id: "LL-M-102", bank_account_id: "Bank_Mellat", date: yest, document_number: "CHQ-882", debit: 15000000, credit: 0, description: "وصول اسناد دریافتنی", is_reconciled: false },
      { id: "LL-M-103", bank_account_id: "Bank_Mellat", date: today, document_number: "TRX-4421", debit: 0, credit: 3200000, description: "پرداخت تنخواه گردان ملزومات", is_reconciled: false },
      { id: "LL-M-104", bank_account_id: "Bank_Mellat", date: today, document_number: "OUT-091", debit: 0, credit: 18000000, description: "چک صادره عهده شرکت (در راهی)", is_reconciled: false }, // Outstanding cheque

      // Bank Saman Ledger entries
      { id: "LL-S-101", bank_account_id: "Bank_Saman", date: yest, document_number: "TRX-777", debit: 0, credit: 5000000, description: "پرداخت قبوض خدماتی", is_reconciled: false },
      { id: "LL-S-102", bank_account_id: "Bank_Saman", date: today, document_number: "IN-991", debit: 6000000, credit: 0, description: "حواله دریافتی بین راهی", is_reconciled: false } // Deposit in transit
    ];

    this.saveToStorage();
  }

  // 1. Inter-Bank Transfer Service
  executeTransfer(
    sourceBankId: string, 
    destBankId: string, 
    amount: number, 
    date: string, 
    description: string, 
    trackingNum: string
  ): { success: boolean; transfer?: InterBankTransfer; voucherId?: string; error?: string } {
    if (amount <= 0) return { success: false, error: "مبلغ نامعتبر است" };
    if (sourceBankId === destBankId) return { success: false, error: "حساب مبدا و مقصد نمی‌تواند یکسان باشد" };

    const jvId = "JV-TRF-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const transfer: InterBankTransfer = {
      id: "TRF-" + Math.random().toString(36).substring(2, 9),
      transfer_number: Math.floor(Math.random() * 1000000).toString(),
      source_bank_account_id: sourceBankId,
      destination_bank_account_id: destBankId,
      amount,
      transfer_date: date,
      tracking_number: trackingNum,
      description,
      journal_voucher_id: jvId
    };

    // Add to ledger (for reconciliation later)
    this.ledgerLines.push({
      id: `LL-${jvId}-CR`,
      bank_account_id: sourceBankId,
      date,
      document_number: trackingNum,
      debit: 0,
      credit: amount,
      description: `حواله به ${this.getBankNamePersian(destBankId)} - ${description}`,
      is_reconciled: false
    });

    this.ledgerLines.push({
      id: `LL-${jvId}-DB`,
      bank_account_id: destBankId,
      date,
      document_number: trackingNum,
      debit: amount,
      credit: 0,
      description: `حواله از ${this.getBankNamePersian(sourceBankId)} - ${description}`,
      is_reconciled: false
    });

    this.transfers.push(transfer);
    this.saveToStorage();

    return { success: true, transfer, voucherId: jvId };
  }

  // 2. Import Bank Statement
  importStatementLines(lines: Omit<BankStatementLine, "id" | "reconciliation_status">[]) {
    const newLines = lines.map(line => ({
      ...line,
      id: "BSL-" + Math.random().toString(36).substring(2, 9),
      reconciliation_status: BankStatementStatus.UNMATCHED
    }));
    this.statementLines.push(...newLines);
    this.saveToStorage();
    return newLines.length;
  }

  // 3. Auto-Reconciliation Algorithm (ACID Transactional)
  autoReconcile(bankAccountId: string, daysTolerance: number = 3): { matchedCount: number; messages: string[] } {
    let matchedCount = 0;
    const messages: string[] = [];

    // --- TRANSACTION START ---
    // Create deep copies to ensure ACID properties (All-or-Nothing)
    const backupStatements = JSON.parse(JSON.stringify(this.statementLines));
    const backupLedger = JSON.parse(JSON.stringify(this.ledgerLines));
    const backupRecons = JSON.parse(JSON.stringify(this.reconciliations));

    try {
      const unmatchedStatements = this.statementLines.filter(
        s => s.bank_account_id === bankAccountId && s.reconciliation_status === BankStatementStatus.UNMATCHED
      );
      
      const unmatchedLedger = this.ledgerLines.filter(
        l => l.bank_account_id === bankAccountId && !l.is_reconciled
      );

      for (const stmt of unmatchedStatements) {
        // Rule A: Exact Match (Amount + Document + Date tolerance)
        let match = unmatchedLedger.find(l => {
          const stmtAmount = stmt.credit > 0 ? stmt.credit : stmt.debit;
          const ledgerAmount = stmt.credit > 0 ? l.debit : l.credit; // Bank Credit = Ledger Debit
          
          if (stmtAmount !== ledgerAmount) return false;
          if (stmt.document_number && l.document_number && stmt.document_number !== l.document_number) return false;
          
          const dateDiff = Math.abs(new Date(stmt.transaction_date).getTime() - new Date(l.date).getTime()) / (1000 * 3600 * 24);
          return dateDiff <= daysTolerance;
        });

        // Rule B: Fuzzy Match (Amount + 1 day tolerance, no doc number needed)
        if (!match) {
          match = unmatchedLedger.find(l => {
             const stmtAmount = stmt.credit > 0 ? stmt.credit : stmt.debit;
             const ledgerAmount = stmt.credit > 0 ? l.debit : l.credit;
             if (stmtAmount !== ledgerAmount) return false;

             const dateDiff = Math.abs(new Date(stmt.transaction_date).getTime() - new Date(l.date).getTime()) / (1000 * 3600 * 24);
             return dateDiff <= 1;
          });
        }

        if (match) {
          // Execute Match
          stmt.reconciliation_status = BankStatementStatus.AUTO_MATCHED;
          match.is_reconciled = true;

          this.reconciliations.push({
            id: "REC-" + Math.random().toString(36).substring(2, 9),
            bank_statement_line_id: stmt.id,
            journal_voucher_line_id: match.id,
            matched_by: "SYSTEM_AUTO",
            matched_at: new Date().toISOString(),
            method: ReconciliationMethod.AUTO
          });

          matchedCount++;
          // Remove matched ledger line from pool
          unmatchedLedger.splice(unmatchedLedger.indexOf(match), 1);
        }
      }

      // --- TRANSACTION COMMIT ---
      if (matchedCount > 0) {
        messages.push(`${matchedCount} تراکنش با موفقیت تطبیق داده شد.`);
        this.saveToStorage();
      } else {
        messages.push(`تراکنش مشابهی برای تطبیق خودکار یافت نشد.`);
      }

      return { matchedCount, messages };
    } catch (error) {
      // --- TRANSACTION ROLLBACK ---
      this.statementLines = backupStatements;
      this.ledgerLines = backupLedger;
      this.reconciliations = backupRecons;
      messages.push(`خطای سیستمی رخ داد. تمام عملیات‌ها برای جلوگیری از ناهمخوانی بازگردانی (Rollback) شدند.`);
      return { matchedCount: 0, messages };
    }
  }

  // 4. Manual reconciliation
  manualReconcile(
    bankAccountId: string,
    statementLineId: string,
    ledgerLineId: string,
    matchedBy: string = "USER"
  ): { success: boolean; error?: string; reconciliation?: BankReconciliation } {
    const backupStatements = JSON.parse(JSON.stringify(this.statementLines));
    const backupLedger = JSON.parse(JSON.stringify(this.ledgerLines));
    const backupRecons = JSON.parse(JSON.stringify(this.reconciliations));

    try {
      const stmt = this.statementLines.find(s => s.id === statementLineId);
      const ledg = this.ledgerLines.find(l => l.id === ledgerLineId);

      if (!stmt) throw new Error("تراکنش صورتحساب بانکی یافت نشد.");
      if (!ledg) throw new Error("سند معین حسابداری یافت نشد.");

      if (stmt.bank_account_id !== bankAccountId || ledg.bank_account_id !== bankAccountId) {
        throw new Error("هر دو آرتیکل باید مربوط به یک بانک باشند.");
      }

      if (stmt.reconciliation_status !== BankStatementStatus.UNMATCHED) {
        throw new Error("این تراکنش بانکی قبلاً تطبیق داده شده است.");
      }

      if (ledg.is_reconciled) {
        throw new Error("این سند معین حسابداری قبلاً تطبیق داده شده است.");
      }

      const stmtAmount = stmt.credit > 0 ? stmt.credit : stmt.debit;
      const ledgerAmount = stmt.credit > 0 ? ledg.debit : ledg.credit;

      if (stmtAmount !== ledgerAmount) {
        throw new Error(`مبالغ با هم مطابقت ندارند. مبلغ صورتحساب بانک: ${stmtAmount.toLocaleString()} ریال، مبلغ معین دفاتر: ${ledgerAmount.toLocaleString()} ریال`);
      }

      // Check transaction type direction
      // Statement Credit = Bank received cash = Ledger Debit (bank balance increased)
      // Statement Debit = Bank paid cash = Ledger Credit (bank balance decreased)
      const isDepositMatch = stmt.credit > 0 && ledg.debit > 0;
      const isWithdrawalMatch = stmt.debit > 0 && ledg.credit > 0;

      if (!isDepositMatch && !isWithdrawalMatch) {
        throw new Error("جهت تراکنش‌ها یکسان نیست! (واریز به حساب با بدهکار دفتر، برداشت با بستانکار دفتر تطبیق می‌گردد)");
      }

      stmt.reconciliation_status = BankStatementStatus.MANUALLY_MATCHED;
      ledg.is_reconciled = true;

      const recon: BankReconciliation = {
        id: "REC-" + Math.random().toString(36).substring(2, 9),
        bank_statement_line_id: stmt.id,
        journal_voucher_line_id: ledg.id,
        matched_by: matchedBy,
        matched_at: new Date().toISOString(),
        method: ReconciliationMethod.MANUAL
      };

      this.reconciliations.push(recon);
      this.saveToStorage();

      return { success: true, reconciliation: recon };
    } catch (e: any) {
      this.statementLines = backupStatements;
      this.ledgerLines = backupLedger;
      this.reconciliations = backupRecons;
      return { success: false, error: e.message || "خطا در تطبیق دستی" };
    }
  }

  // 5. Un-reconcile / Rollback matching
  unreconcile(reconciliationId: string): { success: boolean; error?: string } {
    const backupStatements = JSON.parse(JSON.stringify(this.statementLines));
    const backupLedger = JSON.parse(JSON.stringify(this.ledgerLines));
    const backupRecons = JSON.parse(JSON.stringify(this.reconciliations));

    try {
      const reconIndex = this.reconciliations.findIndex(r => r.id === reconciliationId);
      if (reconIndex === -1) throw new Error("تطبیق مورد نظر یافت نشد.");

      const recon = this.reconciliations[reconIndex];
      const stmt = this.statementLines.find(s => s.id === recon.bank_statement_line_id);
      const ledg = this.ledgerLines.find(l => l.id === recon.journal_voucher_line_id);

      if (stmt) stmt.reconciliation_status = BankStatementStatus.UNMATCHED;
      if (ledg) ledg.is_reconciled = false;

      this.reconciliations.splice(reconIndex, 1);
      this.saveToStorage();

      return { success: true };
    } catch (e: any) {
      this.statementLines = backupStatements;
      this.ledgerLines = backupLedger;
      this.reconciliations = backupRecons;
      return { success: false, error: e.message || "خطا در لغو تطبیق" };
    }
  }

  // Add custom statement line
  addStatementLine(line: Omit<BankStatementLine, "id" | "reconciliation_status">): BankStatementLine {
    const newLine: BankStatementLine = {
      ...line,
      id: "BSL-" + Math.random().toString(36).substring(2, 9),
      reconciliation_status: BankStatementStatus.UNMATCHED
    };
    this.statementLines.push(newLine);
    this.saveToStorage();
    return newLine;
  }

  // Add custom system ledger line
  addLedgerLine(line: Omit<SystemLedgerLine, "id" | "is_reconciled">): SystemLedgerLine {
    const newLine: SystemLedgerLine = {
      ...line,
      id: "LL-" + Math.random().toString(36).substring(2, 9),
      is_reconciled: false
    };
    this.ledgerLines.push(newLine);
    this.saveToStorage();
    return newLine;
  }

  // 6. Book Bank Fees (Auto-Voucher)
  bookBankFee(statementLineId: string): { success: boolean; voucherId?: string; error?: string } {
    const stmt = this.statementLines.find(s => s.id === statementLineId);
    if (!stmt) return { success: false, error: "تراکنش صورتحساب یافت نشد" };
    if (stmt.reconciliation_status !== BankStatementStatus.UNMATCHED) return { success: false, error: "این تراکنش قبلاً تطبیق داده شده است" };
    if (stmt.debit <= 0) return { success: false, error: "این تراکنش از نوع برداشت نیست" };

    const jvId = "JV-FEE-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Add ledger lines
    const ledgerLineId = `LL-${jvId}-CR`;
    this.ledgerLines.push({
      id: ledgerLineId,
      bank_account_id: stmt.bank_account_id,
      date: stmt.transaction_date,
      document_number: stmt.document_number || "FEE-" + Math.floor(100 + Math.random() * 900),
      debit: 0,
      credit: stmt.debit,
      description: `ثبت اتوماتیک کارمزد بانکی - ${stmt.description}`,
      is_reconciled: true // Instantly reconciled
    });

    stmt.reconciliation_status = BankStatementStatus.AUTO_MATCHED;

    this.reconciliations.push({
      id: "REC-" + Math.random().toString(36).substring(2, 9),
      bank_statement_line_id: stmt.id,
      journal_voucher_line_id: ledgerLineId,
      matched_by: "SYSTEM_AUTO_FEE",
      matched_at: new Date().toISOString(),
      method: ReconciliationMethod.AUTO
    });

    this.saveToStorage();
    return { success: true, voucherId: jvId };
  }

  // 7. Book Unknown Deposit (Auto-Voucher for Open Items)
  bookUnknownDeposit(statementLineId: string): { success: boolean; voucherId?: string; error?: string } {
    const stmt = this.statementLines.find(s => s.id === statementLineId);
    if (!stmt) return { success: false, error: "تراکنش صورتحساب یافت نشد" };
    if (stmt.reconciliation_status !== BankStatementStatus.UNMATCHED) return { success: false, error: "این تراکنش قبلاً تطبیق داده شده است" };
    if (stmt.credit <= 0) return { success: false, error: "این تراکنش از نوع واریز نیست" };

    const jvId = "JV-DEP-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Add ledger lines (Debit Bank, Credit Unknown Accounts/Suspense Account)
    const ledgerLineId = `LL-${jvId}-DB`;
    this.ledgerLines.push({
      id: ledgerLineId,
      bank_account_id: stmt.bank_account_id,
      date: stmt.transaction_date,
      document_number: stmt.document_number || "DEP-" + Math.floor(100 + Math.random() * 900),
      debit: stmt.credit,
      credit: 0,
      description: `ثبت اتوماتیک واریزی ناشناس (اقلام باز) - ${stmt.description}`,
      is_reconciled: true // Instantly reconciled
    });

    stmt.reconciliation_status = BankStatementStatus.AUTO_MATCHED;

    this.reconciliations.push({
      id: "REC-" + Math.random().toString(36).substring(2, 9),
      bank_statement_line_id: stmt.id,
      journal_voucher_line_id: ledgerLineId,
      matched_by: "SYSTEM_AUTO_DEP",
      matched_at: new Date().toISOString(),
      method: ReconciliationMethod.AUTO
    });

    this.saveToStorage();
    return { success: true, voucherId: jvId };
  }

  // 8. Custom Book Adjustment (Custom double-entry created on-the-fly)
  bookCustomAdjustment(
    bankAccountId: string,
    statementLineId: string,
    ledgerType: 'DEBIT' | 'CREDIT',
    amount: number,
    description: string,
    docNumber: string
  ): { success: boolean; voucherId?: string; error?: string } {
    const stmt = this.statementLines.find(s => s.id === statementLineId);
    if (!stmt) return { success: false, error: "تراکنش صورتحساب یافت نشد" };
    if (stmt.reconciliation_status !== BankStatementStatus.UNMATCHED) return { success: false, error: "این تراکنش قبلاً تطبیق داده شده است" };

    const stmtAmount = stmt.credit > 0 ? stmt.credit : stmt.debit;
    if (stmtAmount !== amount) {
      return { success: false, error: "مبلغ سند اصلاحی باید دقیقاً برابر با مبلغ آرتیکل صورتحساب باشد." };
    }

    const jvId = "JV-ADJ-" + Math.random().toString(36).substring(2, 8).toUpperCase();

    // Create a new ledger entry matching the direction
    // If statement has credit (deposit), ledger must be debited (+)
    // If statement has debit (withdrawal), ledger must be credited (-)
    const ledgerLineId = `LL-${jvId}-ADJ`;
    this.ledgerLines.push({
      id: ledgerLineId,
      bank_account_id: bankAccountId,
      date: stmt.transaction_date,
      document_number: docNumber || stmt.document_number || "ADJ-JV",
      debit: ledgerType === 'DEBIT' ? amount : 0,
      credit: ledgerType === 'CREDIT' ? amount : 0,
      description: `اصلاحیه مغایرت بانکی: ${description}`,
      is_reconciled: true // Instantly reconciled
    });

    stmt.reconciliation_status = BankStatementStatus.MANUALLY_MATCHED;

    this.reconciliations.push({
      id: "REC-" + Math.random().toString(36).substring(2, 9),
      bank_statement_line_id: stmt.id,
      journal_voucher_line_id: ledgerLineId,
      matched_by: "USER_ADJUSTMENT",
      matched_at: new Date().toISOString(),
      method: ReconciliationMethod.MANUAL
    });

    this.saveToStorage();
    return { success: true, voucherId: jvId };
  }

  // 9. Standard Bank Reconciliation Statement calculations
  getReconciliationReport(bankAccountId: string) {
    const allStmts = this.statementLines.filter(s => s.bank_account_id === bankAccountId);
    const allLedg = this.ledgerLines.filter(l => l.bank_account_id === bankAccountId);

    // Bank Statement Balance: get the running balance of the latest statement line
    // or fallback to default
    const latestStmt = allStmts.length > 0 
      ? [...allStmts].sort((a,b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime())[allStmts.length - 1] 
      : null;
    const bankStatementBalance = latestStmt ? latestStmt.running_balance : (bankAccountId === "Bank_Mellat" ? 165180000 : 57500000);

    // Books Balance (مانده دفاتر): cumulative ledger balance (debit increases balance, credit decreases balance)
    // Mellat start balance can be assumed as 100,000,000 Rials + sum of ledger movements
    const baseBalance = bankAccountId === "Bank_Mellat" ? 100000000 : 50000000;
    const bookBalance = baseBalance + allLedg.reduce((acc, curr) => acc + (curr.debit - curr.credit), 0);

    // Category 1: Debited in Books but not Credited in Bank Statement (Deposits in Transit - وجوه بین‌راهی)
    const depositsInTransit = allLedg.filter(l => !l.is_reconciled && l.debit > 0);
    const totalDepositsInTransit = depositsInTransit.reduce((sum, l) => sum + l.debit, 0);

    // Category 2: Credited in Books but not Debited in Bank Statement (Outstanding Cheques - چک‌های عهده / صادر شده عهده شرکت که هنوز پاس نشده)
    const outstandingCheques = allLedg.filter(l => !l.is_reconciled && l.credit > 0);
    const totalOutstandingCheques = outstandingCheques.reduce((sum, l) => sum + l.credit, 0);

    // Category 3: Deposited in Bank but not recorded in Books (واریزی‌های بانک ثبت‌نشده در دفاتر)
    const unbookedDeposits = allStmts.filter(s => s.reconciliation_status === BankStatementStatus.UNMATCHED && s.credit > 0);
    const totalUnbookedDeposits = unbookedDeposits.reduce((sum, s) => sum + s.credit, 0);

    // Category 4: Debited in Bank but not recorded in Books (برداشت‌های بانک ثبت‌نشده در دفاتر، مثلا کارمزد یا اقساط)
    const unbookedWithdrawals = allStmts.filter(s => s.reconciliation_status === BankStatementStatus.UNMATCHED && s.debit > 0);
    const totalUnbookedWithdrawals = unbookedWithdrawals.reduce((sum, s) => sum + s.debit, 0);

    // Reconciliation Statement Form:
    // -------------------------------------------------------------
    // Balance as per Bank Statement:                     bankStatementBalance
    // Add: Deposits in Transit (وجوه بین راهی)             + totalDepositsInTransit
    // Less: Outstanding Cheques (چک‌های عهده)               - totalOutstandingCheques
    // = Adjusted Bank Balance:                           adjustedBankBalance
    // -------------------------------------------------------------
    // Balance as per Books (سند معین حسابداری):           bookBalance
    // Add: Bank Credits not in Books (واریزی‌های ثبت‌نشده)    + totalUnbookedDeposits
    // Less: Bank Charges not in Books (برداشت‌های ثبت‌نشده)    - totalUnbookedWithdrawals
    // = Adjusted Books Balance:                          adjustedBookBalance
    // -------------------------------------------------------------
    const adjustedBankBalance = bankStatementBalance + totalDepositsInTransit - totalOutstandingCheques;
    const adjustedBookBalance = bookBalance + totalUnbookedDeposits - totalUnbookedWithdrawals;

    return {
      bankAccountId,
      bankStatementBalance,
      bookBalance,
      depositsInTransit,
      totalDepositsInTransit,
      outstandingCheques,
      totalOutstandingCheques,
      unbookedDeposits,
      totalUnbookedDeposits,
      unbookedWithdrawals,
      totalUnbookedWithdrawals,
      adjustedBankBalance,
      adjustedBookBalance,
      isBalanced: adjustedBankBalance === adjustedBookBalance,
      difference: Math.abs(adjustedBankBalance - adjustedBookBalance)
    };
  }

  getBankNamePersian(id: string): string {
    const names: Record<string, string> = {
      "Bank_Mellat": "بانک ملت (حساب جاری ۱۰۲۰)",
      "Bank_Saman": "بانک سامان (حساب کوتاه‌مدت ۹۰۰)",
      "Bank_Melli": "بانک ملی ایران (جاری ۳۰۰۲)"
    };
    return names[id] || id;
  }

  getTransfers() { return this.transfers; }
  getStatements() { return this.statementLines; }
  getLedgerLines() { return this.ledgerLines; }
  getReconciliations() { return this.reconciliations; }
}
