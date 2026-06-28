export enum RecordStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  CLOSED = 'CLOSED'
}

export enum VoucherStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  POSTED = 'POSTED' // Only POSTED affects the ledger
}

export interface CashRegister {
  id: string;
  register_name: string;
  branch_id: string;
  responsible_user_id: string; // Floating Detailed ID
  current_balance: number;
  status: RecordStatus;
  associated_account_id: string; // Ledger account
}

export interface PettyCashFund {
  id: string;
  fund_name: string;
  custodian_id: string; // Floating Detailed ID
  max_ceiling_amount: number;
  current_balance: number;
  status: RecordStatus;
  associated_account_id: string; // Ledger account
}

export interface PettyCashVoucher {
  id: string;
  fund_id: string;
  voucher_number: string;
  submission_date: string;
  total_expense_amount: number;
  description: string;
  status: VoucherStatus;
}

export interface PettyCashLine {
  id: string;
  voucher_id: string;
  expense_account_id: string; // Ledger account
  detailed_account_id?: string; // Optional detailed
  amount: number;
  tax_amount: number;
  invoice_number: string;
  invoice_date: string;
  description: string;
}

export interface SystemLedgerLine {
  id: string;
  journal_voucher_id: string;
  account_code: string;
  detailed_account_id?: string;
  date: string;
  debit: number;
  credit: number;
  description: string;
}

export interface CashTransaction {
  id: string;
  register_id: string;
  transaction_type: 'RECEIPT' | 'PAYMENT'; // دریافت نقدی / پرداخت نقدی
  amount: number;
  date: string;
  document_number: string;
  payer_payee: string;
  description: string;
}

export class PettyCashEngine {
  private funds: PettyCashFund[] = [];
  private vouchers: PettyCashVoucher[] = [];
  private lines: PettyCashLine[] = [];
  private ledger: SystemLedgerLine[] = [];
  private registers: CashRegister[] = [];
  private cashTransactions: CashTransaction[] = [];

  private accountCodes = {
    pettyCash: '1102', // تنخواه‌گردان
    bank: '1101', // موجودی نقد و بانک
    vatReceivable: '1108', // مالیات بر ارزش افزوده خرید
  };

  constructor() {
    this.loadFromStorage();
    if (this.funds.length === 0 && this.registers.length === 0) {
      this.seedInitialData();
    }
  }

  private loadFromStorage() {
    try {
      const storedFunds = localStorage.getItem('petty_cash_funds_db');
      if (storedFunds) this.funds = JSON.parse(storedFunds);

      const storedVouchers = localStorage.getItem('petty_cash_vouchers_db');
      if (storedVouchers) this.vouchers = JSON.parse(storedVouchers);

      const storedLines = localStorage.getItem('petty_cash_lines_db');
      if (storedLines) this.lines = JSON.parse(storedLines);

      const storedLedger = localStorage.getItem('petty_cash_ledger_db');
      if (storedLedger) this.ledger = JSON.parse(storedLedger);

      const storedRegisters = localStorage.getItem('petty_cash_registers_db');
      if (storedRegisters) this.registers = JSON.parse(storedRegisters);

      const storedCashTx = localStorage.getItem('petty_cash_cash_tx_db');
      if (storedCashTx) this.cashTransactions = JSON.parse(storedCashTx);
    } catch (e) {
      console.error("Error loading petty cash DB", e);
    }
  }

  private saveToStorage() {
    localStorage.setItem('petty_cash_funds_db', JSON.stringify(this.funds));
    localStorage.setItem('petty_cash_vouchers_db', JSON.stringify(this.vouchers));
    localStorage.setItem('petty_cash_lines_db', JSON.stringify(this.lines));
    localStorage.setItem('petty_cash_ledger_db', JSON.stringify(this.ledger));
    localStorage.setItem('petty_cash_registers_db', JSON.stringify(this.registers));
    localStorage.setItem('petty_cash_cash_tx_db', JSON.stringify(this.cashTransactions));
  }

  private seedInitialData() {
    this.funds.push({
      id: "FND-100",
      fund_name: "تنخواه مرکزی دفتر",
      custodian_id: "EMP-001", // آقای احمدی
      max_ceiling_amount: 50000000, // 5 میلیون تومان
      current_balance: 10000000, // 1 میلیون تومان اولیه
      status: RecordStatus.ACTIVE,
      associated_account_id: this.accountCodes.pettyCash
    });

    this.registers.push({
      id: "REG-101",
      register_name: "صندوق ریالی دفتر مرکزی",
      branch_id: "BRN-01",
      responsible_user_id: "EMP-002", // خانم محمدی
      current_balance: 15000000,
      status: RecordStatus.ACTIVE,
      associated_account_id: "1103"
    });

    this.registers.push({
      id: "REG-102",
      register_name: "صندوق نقدی دبیرخانه",
      branch_id: "BRN-01",
      responsible_user_id: "EMP-003", // آقای تهرانی
      current_balance: 5000000,
      status: RecordStatus.ACTIVE,
      associated_account_id: "1103"
    });

    this.saveToStorage();
  }

  // 1. Fund Initialization / Replenishment (ACID Transaction)
  replenishFund(fundId: string, bankAccountId: string, amount: number): { success: boolean; voucherId?: string; error?: string } {
    if (amount <= 0) return { success: false, error: "مبلغ شارژ باید بیشتر از صفر باشد" };

    // --- TRANSACTION START ---
    const backupFunds = JSON.parse(JSON.stringify(this.funds));
    const backupLedger = JSON.parse(JSON.stringify(this.ledger));

    try {
      const fundIndex = this.funds.findIndex(f => f.id === fundId);
      if (fundIndex === -1) throw new Error("تنخواه مورد نظر یافت نشد");

      const fund = this.funds[fundIndex];
      
      // Validation: Ceiling Control
      if (fund.current_balance + amount > fund.max_ceiling_amount) {
        throw new Error(`مبلغ شارژ (${amount.toLocaleString()}) به علاوه موجودی فعلی، از سقف مجاز تنخواه (${fund.max_ceiling_amount.toLocaleString()}) تجاوز می‌کند.`);
      }

      // Update balance
      fund.current_balance += amount;
      this.funds[fundIndex] = fund;

      // Auto-generate Journal Voucher
      const jvId = "JV-REP-" + Math.random().toString(36).substring(2, 8).toUpperCase();
      const date = new Date().toISOString().split('T')[0];

      // Debit: Petty Cash Fund (Detailed: Custodian)
      this.ledger.push({
        id: `LL-${jvId}-DB`,
        journal_voucher_id: jvId,
        account_code: fund.associated_account_id,
        detailed_account_id: fund.custodian_id,
        date,
        debit: amount,
        credit: 0,
        description: `شارژ تنخواه ${fund.fund_name}`
      });

      // Credit: Bank
      this.ledger.push({
        id: `LL-${jvId}-CR`,
        journal_voucher_id: jvId,
        account_code: this.accountCodes.bank,
        detailed_account_id: bankAccountId,
        date,
        debit: 0,
        credit: amount,
        description: `شارژ تنخواه ${fund.fund_name}`
      });

      // --- TRANSACTION COMMIT ---
      this.saveToStorage();
      return { success: true, voucherId: jvId };

    } catch (error: any) {
      // --- TRANSACTION ROLLBACK ---
      this.funds = backupFunds;
      this.ledger = backupLedger;
      return { success: false, error: error.message || "خطای سیستمی رخ داد و عملیات لغو شد." };
    }
  }

  // 2. Draft Voucher & Expense Validation
  createVoucher(fundId: string, description: string): { success: boolean; voucher?: PettyCashVoucher; error?: string } {
    const fund = this.funds.find(f => f.id === fundId);
    if (!fund) return { success: false, error: "تنخواه یافت نشد" };

    const voucher: PettyCashVoucher = {
      id: "PCV-" + Math.random().toString(36).substring(2, 9),
      fund_id: fundId,
      voucher_number: Math.floor(Math.random() * 1000000).toString(),
      submission_date: new Date().toISOString().split('T')[0],
      total_expense_amount: 0,
      description,
      status: VoucherStatus.DRAFT
    };

    this.vouchers.push(voucher);
    this.saveToStorage();
    return { success: true, voucher };
  }

  addExpenseLine(voucherId: string, expenseCode: string, amount: number, taxAmount: number, description: string, invoiceNum: string): { success: boolean; error?: string } {
    const voucher = this.vouchers.find(v => v.id === voucherId);
    if (!voucher) return { success: false, error: "صورت تنخواه یافت نشد" };
    if (voucher.status !== VoucherStatus.DRAFT && voucher.status !== VoucherStatus.REJECTED) {
      return { success: false, error: "فقط صورت‌های در وضعیت پیش‌نویس قابل ویرایش هستند" };
    }

    const fund = this.funds.find(f => f.id === voucher.fund_id);
    if (!fund) return { success: false, error: "تنخواه متصل یافت نشد" };

    const totalNewAmount = amount + taxAmount;

    // Check if adding this expense exceeds available current balance
    const currentVoucherTotal = voucher.total_expense_amount;
    if (currentVoucherTotal + totalNewAmount > fund.current_balance) {
       return { success: false, error: `مبلغ فاکتور از موجودی فعلی تنخواه (${fund.current_balance.toLocaleString()}) بیشتر است!` };
    }

    const line: PettyCashLine = {
      id: "PCL-" + Math.random().toString(36).substring(2, 9),
      voucher_id: voucherId,
      expense_account_id: expenseCode,
      amount,
      tax_amount: taxAmount,
      invoice_number: invoiceNum,
      invoice_date: new Date().toISOString().split('T')[0],
      description
    };

    voucher.total_expense_amount += totalNewAmount;
    
    this.lines.push(line);
    this.saveToStorage();
    return { success: true };
  }

  submitVoucher(voucherId: string): { success: boolean; error?: string } {
    const voucher = this.vouchers.find(v => v.id === voucherId);
    if (!voucher) return { success: false, error: "صورت تنخواه یافت نشد" };
    if (voucher.total_expense_amount <= 0) return { success: false, error: "صورت تنخواه نمی‌تواند خالی باشد" };
    
    voucher.status = VoucherStatus.SUBMITTED;
    this.saveToStorage();
    return { success: true };
  }

  // 3. Fund Settlement & Closing (ACID Transaction)
  settleAndPostPettyCash(voucherId: string): { success: boolean; voucherId?: string; error?: string } {
    // --- TRANSACTION START ---
    const backupFunds = JSON.parse(JSON.stringify(this.funds));
    const backupVouchers = JSON.parse(JSON.stringify(this.vouchers));
    const backupLedger = JSON.parse(JSON.stringify(this.ledger));

    try {
      const voucherIndex = this.vouchers.findIndex(v => v.id === voucherId);
      if (voucherIndex === -1) throw new Error("صورت تنخواه یافت نشد");
      const voucher = this.vouchers[voucherIndex];

      if (voucher.status !== VoucherStatus.SUBMITTED) {
         throw new Error("فقط صورت‌های ارسال شده (Submitted) قابل تایید و تسویه هستند");
      }

      const fundIndex = this.funds.findIndex(f => f.id === voucher.fund_id);
      if (fundIndex === -1) throw new Error("تنخواه متصل یافت نشد");
      const fund = this.funds[fundIndex];

      // Final sanity check
      if (fund.current_balance < voucher.total_expense_amount) {
        throw new Error("موجودی فعلی تنخواه برای تسویه این صورت کافی نیست (تناقض داده)");
      }

      // 1. Deduct from fund current balance
      fund.current_balance -= voucher.total_expense_amount;
      this.funds[fundIndex] = fund;

      // 2. Change voucher status
      voucher.status = VoucherStatus.POSTED;
      this.vouchers[voucherIndex] = voucher;

      // 3. Generate Consolidated Journal Voucher
      const jvId = "JV-SET-" + Math.random().toString(36).substring(2, 8).toUpperCase();
      const date = new Date().toISOString().split('T')[0];
      
      const voucherLines = this.lines.filter(l => l.voucher_id === voucher.id);
      let totalVat = 0;

      // Aggregate expenses (in a real app, group by expense_account_id, here we'll just insert separate lines for simplicity)
      for (const line of voucherLines) {
        // Debit: Various Expense Accounts
        this.ledger.push({
          id: `LL-${jvId}-EXP-${line.id}`,
          journal_voucher_id: jvId,
          account_code: line.expense_account_id,
          date,
          debit: line.amount,
          credit: 0,
          description: `تسویه فاکتور #${line.invoice_number} - ${line.description}`
        });
        totalVat += line.tax_amount;
      }

      // Debit: VAT Receivable (if any)
      if (totalVat > 0) {
        this.ledger.push({
          id: `LL-${jvId}-VAT`,
          journal_voucher_id: jvId,
          account_code: this.accountCodes.vatReceivable,
          date,
          debit: totalVat,
          credit: 0,
          description: `مالیات بر ارزش افزوده صورت تنخواه #${voucher.voucher_number}`
        });
      }

      // Credit: Petty Cash Fund (Custodian)
      this.ledger.push({
        id: `LL-${jvId}-CR`,
        journal_voucher_id: jvId,
        account_code: fund.associated_account_id,
        detailed_account_id: fund.custodian_id,
        date,
        debit: 0,
        credit: voucher.total_expense_amount,
        description: `بستانکار شدن شخص بابت تسویه تنخواه #${voucher.voucher_number}`
      });

      // --- TRANSACTION COMMIT ---
      this.saveToStorage();
      return { success: true, voucherId: jvId };

    } catch (error: any) {
      // --- TRANSACTION ROLLBACK ---
      this.funds = backupFunds;
      this.vouchers = backupVouchers;
      this.ledger = backupLedger;
      return { success: false, error: error.message || "خطای سیستمی رخ داد و عملیات تسویه لغو شد." };
    }
  }

  getFunds() { return this.funds; }
  getVouchers() { return this.vouchers; }
  getLines(voucherId: string) { return this.lines.filter(l => l.voucher_id === voucherId); }
  getLedger() { return this.ledger; }

  // --- NEW CASH REGISTER (صندوق) METHODS ---
  getRegisters() { return this.registers; }
  getCashTransactions() { return this.cashTransactions; }

  createRegister(name: string, responsibleId: string, initialBalance: number): { success: boolean; register?: CashRegister; error?: string } {
    if (!name) return { success: false, error: "نام صندوق الزامی است" };
    const id = "REG-" + Math.random().toString(36).substring(2, 9);
    const newReg: CashRegister = {
      id,
      register_name: name,
      branch_id: "BRN-01",
      responsible_user_id: responsibleId || "EMP-001",
      current_balance: initialBalance || 0,
      status: RecordStatus.ACTIVE,
      associated_account_id: "1103"
    };
    this.registers.push(newReg);

    // If initial balance is greater than zero, record a receipt transaction
    if (initialBalance > 0) {
      const txId = "CTX-INIT-" + Math.random().toString(36).substring(2, 9);
      const date = new Date().toISOString().split('T')[0];
      this.cashTransactions.push({
        id: txId,
        register_id: id,
        transaction_type: 'RECEIPT',
        amount: initialBalance,
        date,
        document_number: "INIT",
        payer_payee: "موجودی اولیه خزانه‌داری",
        description: `ثبت موجودی اولیه صندوق ${name}`
      });
    }

    this.saveToStorage();
    return { success: true, register: newReg };
  }

  recordCashTransaction(registerId: string, type: 'RECEIPT' | 'PAYMENT', amount: number, payer_payee: string, description: string, docNumber: string): { success: boolean; error?: string } {
    if (amount <= 0) return { success: false, error: "مبلغ باید بزرگتر از صفر باشد" };
    const regIndex = this.registers.findIndex(r => r.id === registerId);
    if (regIndex === -1) return { success: false, error: "صندوق یافت نشد" };
    
    const reg = this.registers[regIndex];
    if (type === 'PAYMENT' && reg.current_balance < amount) {
      return { success: false, error: "موجودی صندوق کافی نیست" };
    }

    // Update balance
    if (type === 'RECEIPT') {
      reg.current_balance += amount;
    } else {
      reg.current_balance -= amount;
    }
    this.registers[regIndex] = reg;

    const txId = "CTX-" + Math.random().toString(36).substring(2, 9);
    const date = new Date().toISOString().split('T')[0];

    const tx: CashTransaction = {
      id: txId,
      register_id: registerId,
      transaction_type: type,
      amount,
      date,
      document_number: docNumber || "CTX-" + Math.floor(Math.random() * 10000),
      payer_payee,
      description
    };
    this.cashTransactions.push(tx);

    // Ledger double entry
    const jvId = "JV-CSH-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    if (type === 'RECEIPT') {
      this.ledger.push({
        id: `LL-${jvId}-DB`,
        journal_voucher_id: jvId,
        account_code: reg.associated_account_id,
        detailed_account_id: reg.responsible_user_id,
        date,
        debit: amount,
        credit: 0,
        description: `دریافت نقدی: ${description} (از ${payer_payee})`
      });
      this.ledger.push({
        id: `LL-${jvId}-CR`,
        journal_voucher_id: jvId,
        account_code: '1201', // حساب‌های دریافتنی مشتریان
        date,
        debit: 0,
        credit: amount,
        description: `بستانکار بابت دریافت نقدی در صندوق (شرح: ${description})`
      });
    } else {
      this.ledger.push({
        id: `LL-${jvId}-DB`,
        journal_voucher_id: jvId,
        account_code: '5101', // هزینه‌های عمومی اداری
        date,
        debit: amount,
        credit: 0,
        description: `پرداخت نقدی بابت ${description} (به ${payer_payee})`
      });
      this.ledger.push({
        id: `LL-${jvId}-CR`,
        journal_voucher_id: jvId,
        account_code: reg.associated_account_id,
        detailed_account_id: reg.responsible_user_id,
        date,
        debit: 0,
        credit: amount,
        description: `پرداخت نقدی: ${description} (به ${payer_payee})`
      });
    }

    this.saveToStorage();
    return { success: true };
  }

  transferCashToBank(registerId: string, bankAccountId: string, amount: number, docNumber: string): { success: boolean; error?: string } {
    if (amount <= 0) return { success: false, error: "مبلغ باید بزرگتر از صفر باشد" };
    const regIndex = this.registers.findIndex(r => r.id === registerId);
    if (regIndex === -1) return { success: false, error: "صندوق یافت نشد" };
    
    const reg = this.registers[regIndex];
    if (reg.current_balance < amount) {
      return { success: false, error: "موجودی صندوق کافی نیست" };
    }

    reg.current_balance -= amount;
    this.registers[regIndex] = reg;

    const txId = "CTX-" + Math.random().toString(36).substring(2, 9);
    const date = new Date().toISOString().split('T')[0];
    const docNum = docNumber || "C2B-" + Math.floor(Math.random() * 10000);

    this.cashTransactions.push({
      id: txId,
      register_id: registerId,
      transaction_type: 'PAYMENT',
      amount,
      date,
      document_number: docNum,
      payer_payee: "بانک ملی مرکزی",
      description: `واریز به بانک از صندوق ${reg.register_name}`
    });

    const jvId = "JV-C2B-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    this.ledger.push({
      id: `LL-${jvId}-DB`,
      journal_voucher_id: jvId,
      account_code: this.accountCodes.bank,
      detailed_account_id: bankAccountId,
      date,
      debit: amount,
      credit: 0,
      description: `واریز نقدی از صندوق ${reg.register_name}`
    });
    this.ledger.push({
      id: `LL-${jvId}-CR`,
      journal_voucher_id: jvId,
      account_code: reg.associated_account_id,
      detailed_account_id: reg.responsible_user_id,
      date,
      debit: 0,
      credit: amount,
      description: `واریز به بانک از صندوق ${reg.register_name}`
    });

    this.saveToStorage();
    return { success: true };
  }

  replenishRegisterFromBank(registerId: string, bankAccountId: string, amount: number, docNumber: string): { success: boolean; error?: string } {
    if (amount <= 0) return { success: false, error: "مبلغ باید بزرگتر از صفر باشد" };
    const regIndex = this.registers.findIndex(r => r.id === registerId);
    if (regIndex === -1) return { success: false, error: "صندوق یافت نشد" };
    
    const reg = this.registers[regIndex];
    reg.current_balance += amount;
    this.registers[regIndex] = reg;

    const txId = "CTX-" + Math.random().toString(36).substring(2, 9);
    const date = new Date().toISOString().split('T')[0];
    const docNum = docNumber || "B2C-" + Math.floor(Math.random() * 10000);

    this.cashTransactions.push({
      id: txId,
      register_id: registerId,
      transaction_type: 'RECEIPT',
      amount,
      date,
      document_number: docNum,
      payer_payee: "برداشت از بانک",
      description: `تامین نقدینگی صندوق از حساب بانکی`
    });

    const jvId = "JV-B2C-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    this.ledger.push({
      id: `LL-${jvId}-DB`,
      journal_voucher_id: jvId,
      account_code: reg.associated_account_id,
      detailed_account_id: reg.responsible_user_id,
      date,
      debit: amount,
      credit: 0,
      description: `تامین صندوق ${reg.register_name} از بانک`
    });
    this.ledger.push({
      id: `LL-${jvId}-CR`,
      journal_voucher_id: jvId,
      account_code: this.accountCodes.bank,
      detailed_account_id: bankAccountId,
      date,
      debit: 0,
      credit: amount,
      description: `برداشت نقدی جهت شارژ صندوق ${reg.register_name}`
    });

    this.saveToStorage();
    return { success: true };
  }

  replenishFundFromCashRegister(fundId: string, registerId: string, amount: number): { success: boolean; voucherId?: string; error?: string } {
    if (amount <= 0) return { success: false, error: "مبلغ شارژ باید بیشتر از صفر باشد" };

    const backupFunds = JSON.parse(JSON.stringify(this.funds));
    const backupRegisters = JSON.parse(JSON.stringify(this.registers));
    const backupLedger = JSON.parse(JSON.stringify(this.ledger));

    try {
      const fundIndex = this.funds.findIndex(f => f.id === fundId);
      if (fundIndex === -1) throw new Error("تنخواه مورد نظر یافت نشد");
      const fund = this.funds[fundIndex];

      const regIndex = this.registers.findIndex(r => r.id === registerId);
      if (regIndex === -1) throw new Error("صندوق مبدأ یافت نشد");
      const reg = this.registers[regIndex];

      if (reg.current_balance < amount) {
        throw new Error(`موجودی صندوق (${reg.current_balance.toLocaleString()}) برای شارژ تنخواه کافی نیست.`);
      }

      if (fund.current_balance + amount > fund.max_ceiling_amount) {
        throw new Error(`مبلغ شارژ (${amount.toLocaleString()}) به علاوه موجودی فعلی، از سقف مجاز تنخواه (${fund.max_ceiling_amount.toLocaleString()}) تجاوز می‌کند.`);
      }

      // Update balances
      fund.current_balance += amount;
      this.funds[fundIndex] = fund;

      reg.current_balance -= amount;
      this.registers[regIndex] = reg;

      // Log Cash Register transaction
      const txId = "CTX-" + Math.random().toString(36).substring(2, 9);
      const date = new Date().toISOString().split('T')[0];
      this.cashTransactions.push({
        id: txId,
        register_id: registerId,
        transaction_type: 'PAYMENT',
        amount,
        date,
        document_number: "REP-FND",
        payer_payee: `تنخواه‌دار: ${fund.custodian_id}`,
        description: `شارژ تنخواه‌گردان ${fund.fund_name} از صندوق`
      });

      // Journal Voucher
      const jvId = "JV-REP-CSH-" + Math.random().toString(36).substring(2, 8).toUpperCase();

      // Debit: Petty Cash Fund
      this.ledger.push({
        id: `LL-${jvId}-DB`,
        journal_voucher_id: jvId,
        account_code: fund.associated_account_id,
        detailed_account_id: fund.custodian_id,
        date,
        debit: amount,
        credit: 0,
        description: `شارژ تنخواه ${fund.fund_name} از صندوق ${reg.register_name}`
      });

      // Credit: Cash Register
      this.ledger.push({
        id: `LL-${jvId}-CR`,
        journal_voucher_id: jvId,
        account_code: reg.associated_account_id,
        detailed_account_id: reg.responsible_user_id,
        date,
        debit: 0,
        credit: amount,
        description: `شارژ تنخواه ${fund.fund_name} از صندوق ${reg.register_name}`
      });

      this.saveToStorage();
      return { success: true, voucherId: jvId };

    } catch (error: any) {
      this.funds = backupFunds;
      this.registers = backupRegisters;
      this.ledger = backupLedger;
      return { success: false, error: error.message || "خطا در عملیات شارژ تنخواه از صندوق" };
    }
  }

  rejectVoucher(voucherId: string): { success: boolean; error?: string } {
    const voucher = this.vouchers.find(v => v.id === voucherId);
    if (!voucher) return { success: false, error: "صورت تنخواه یافت نشد" };
    if (voucher.status !== VoucherStatus.SUBMITTED) {
      return { success: false, error: "فقط صورت‌های در انتظار تایید قابل رد شدن هستند." };
    }
    voucher.status = VoucherStatus.REJECTED;
    this.saveToStorage();
    return { success: true };
  }

  deleteExpenseLine(lineId: string, voucherId: string): { success: boolean; error?: string } {
    const voucher = this.vouchers.find(v => v.id === voucherId);
    if (!voucher) return { success: false, error: "صورت تنخواه یافت نشد" };
    if (voucher.status !== VoucherStatus.DRAFT && voucher.status !== VoucherStatus.REJECTED) {
      return { success: false, error: "فقط صورت‌های پیش‌نویس یا رد شده قابل ویرایش هستند." };
    }

    const lineIndex = this.lines.findIndex(l => l.id === lineId && l.voucher_id === voucherId);
    if (lineIndex === -1) return { success: false, error: "فاکتور یافت نشد." };

    const line = this.lines[lineIndex];
    voucher.total_expense_amount -= (line.amount + line.tax_amount);
    this.lines.splice(lineIndex, 1);
    this.saveToStorage();
    return { success: true };
  }
}
