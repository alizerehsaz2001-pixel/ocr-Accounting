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
    // Seed some mock ledger entries for the reconciliation engine to match against
    this.ledgerLines = [
      { id: "LL-100", bank_account_id: "Bank_Mellat", date: new Date().toISOString().split('T')[0], document_number: "REF-555", debit: 15000000, credit: 0, description: "واریز مشتری", is_reconciled: false },
      { id: "LL-101", bank_account_id: "Bank_Saman", date: new Date().toISOString().split('T')[0], document_number: "TRX-777", debit: 0, credit: 5000000, description: "پرداخت قبض", is_reconciled: false }
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
    
    // In a real system, we'd wrap this in a DB transaction
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
      description: `حواله به ${destBankId} - ${description}`,
      is_reconciled: false
    });

    this.ledgerLines.push({
      id: `LL-${jvId}-DB`,
      bank_account_id: destBankId,
      date,
      document_number: trackingNum,
      debit: amount,
      credit: 0,
      description: `حواله از ${sourceBankId} - ${description}`,
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

  // 4. Book Bank Fees (Auto-Voucher)
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
      document_number: stmt.document_number,
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

  // 5. Book Unknown Deposit (Auto-Voucher for Open Items)
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
      document_number: stmt.document_number,
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

  getTransfers() { return this.transfers; }
  getStatements() { return this.statementLines; }
  getLedgerLines() { return this.ledgerLines; }
  getReconciliations() { return this.reconciliations; }
}
