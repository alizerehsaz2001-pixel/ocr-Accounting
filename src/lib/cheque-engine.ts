export enum ChequeType {
  RECEIVED = 'RECEIVED',
  PAID = 'PAID'
}

export enum ChequeStatus {
  // Received
  REGISTERED = 'REGISTERED',   // ثبت در صندوق
  SENT_TO_BANK = 'SENT_TO_BANK', // واگذاری به بانک (در جریان وصول)
  COLLECTED = 'COLLECTED',       // وصول شده
  BOUNCED = 'BOUNCED',           // برگشتی
  RETURNED = 'RETURNED',         // عودت داده شده به مشتری
  DISCOUNTED = 'DISCOUNTED',     // تنزیل شده (فروش قبل از سررسید)

  // Paid
  ISSUED = 'ISSUED',             // صادره
  CLEARED = 'CLEARED',           // پاس شده
  BOUNCED_PAID = 'BOUNCED_PAID', // برگشتی صادر کننده
  RETURNED_PAID = 'RETURNED_PAID'// ابطال و استرداد چک صادره
}

export interface Cheque {
  id: string;
  cheque_number: string;
  sayad_id: string;
  amount: number;
  maturity_date: string;
  register_date: string;
  drawer_bank: string;
  branch: string;
  payer_payee_id: string; // Floating Detailed Account ID (طرف حساب)
  type: ChequeType;
  current_status: ChequeStatus;
  discount_rate?: number; // Optional discount rate percentage
}

export interface ChequeStatusHistory {
  id: string;
  cheque_id: string;
  from_status: ChequeStatus | null;
  to_status: ChequeStatus;
  action_date: string;
  user_id: string;
  journal_voucher_id: string | null;
  note?: string;
}

export interface JournalVoucherLine {
  account_code: string; 
  detailed_account_id?: string;
  debit: number;
  credit: number;
  description: string;
}

export interface JournalVoucher {
  id: string;
  date: string;
  lines: JournalVoucherLine[];
  description: string;
}

export interface SayadInquiryResult {
  valid: boolean;
  color: 'WHITE' | 'YELLOW' | 'ORANGE' | 'RED';
  colorLabel: string;
  colorDesc: string;
  drawerName: string;
  nationalId: string;
  bouncedCount: number;
  bouncedAmount: number;
  creditCeiling: number;
  message: string;
}

export class ChequeManagementEngine {
  private cheques: Map<string, Cheque> = new Map();
  private history: ChequeStatusHistory[] = [];
  private vouchers: JournalVoucher[] = [];

  // Standard ERP chart of accounts codes
  private accountCodes = {
    notesReceivable: '1104',     // اسناد دریافتنی نزد صندوق
    accountsReceivable: '1103',  // حساب‌های دریافتنی تجاری (مشتریان)
    chequesInTransit: '1105',    // اسناد در جریان وصول (واگذار شده به بانک)
    bank: '1101',                // موجودی نقد و بانک
    accountsPayable: '2101',     // حساب‌های پرداختنی تجاری (تامین‌کنندگان)
    notesPayable: '2102',        // اسناد پرداختنی (چک‌های صادره)
    financeExpense: '9103',      // هزینه‌های مالی و کارمزد/تنزیل چک
  };

  constructor() {
    this.loadFromStorage();
    if (this.cheques.size === 0) {
      this.seedInitialData();
    }
  }

  private loadFromStorage() {
    try {
      const storedCheques = localStorage.getItem('cheques_db');
      if (storedCheques) {
        const parsed = JSON.parse(storedCheques) as Cheque[];
        parsed.forEach(c => this.cheques.set(c.id, c));
      }
      const storedHistory = localStorage.getItem('cheques_history_db');
      if (storedHistory) this.history = JSON.parse(storedHistory);
      const storedVouchers = localStorage.getItem('cheques_vouchers_db');
      if (storedVouchers) this.vouchers = JSON.parse(storedVouchers);
    } catch (e) {
      console.error("Error loading cheque DB", e);
    }
  }

  private saveToStorage() {
    localStorage.setItem('cheques_db', JSON.stringify(Array.from(this.cheques.values())));
    localStorage.setItem('cheques_history_db', JSON.stringify(this.history));
    localStorage.setItem('cheques_vouchers_db', JSON.stringify(this.vouchers));
  }

  private seedInitialData() {
    // Some mock cheques to give a starting dashboard state
    const c1: Cheque = {
      id: "CHQ-RCV-01",
      cheque_number: "482015",
      sayad_id: "1405928174820152",
      amount: 150000000, // 15 million tomans (150m Rials)
      maturity_date: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString().split('T')[0],
      register_date: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString().split('T')[0],
      drawer_bank: "بانک ملی ایران",
      branch: "شعبه مرکزی کد ۱",
      payer_payee_id: "شرکت بازرگانی آذرخش (مشتری)",
      type: ChequeType.RECEIVED,
      current_status: ChequeStatus.REGISTERED
    };

    const c2: Cheque = {
      id: "CHQ-RCV-02",
      cheque_number: "983210",
      sayad_id: "2304958172983210",
      amount: 450000000, // 450 million Rials
      maturity_date: new Date(Date.now() + 12 * 24 * 3600 * 1000).toISOString().split('T')[0],
      register_date: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString().split('T')[0],
      drawer_bank: "بانک سامان",
      branch: "شعبه فرمانیه",
      payer_payee_id: "فروشگاه بزرگ آرین",
      type: ChequeType.RECEIVED,
      current_status: ChequeStatus.SENT_TO_BANK
    };

    const c3: Cheque = {
      id: "CHQ-PAD-01",
      cheque_number: "115024",
      sayad_id: "5402918274115024",
      amount: 280000000, // 280 million Rials
      maturity_date: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString().split('T')[0],
      register_date: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString().split('T')[0],
      drawer_bank: "بانک ملت",
      branch: "شعبه اسکان (حساب جاری شرکت)",
      payer_payee_id: "صنایع تولیدی الوند (تامین‌کننده)",
      type: ChequeType.PAID,
      current_status: ChequeStatus.ISSUED
    };

    this.cheques.set(c1.id, c1);
    this.cheques.set(c2.id, c2);
    this.cheques.set(c3.id, c3);

    // Initial history & vouchers
    this.recordHistory(c1.id, null, ChequeStatus.REGISTERED, "SYSTEM", "JV-SEED1", "ثبت اولیه در صندوق");
    this.recordHistory(c2.id, null, ChequeStatus.REGISTERED, "SYSTEM", "JV-SEED2", "ثبت اولیه در صندوق");
    this.recordHistory(c2.id, ChequeStatus.REGISTERED, ChequeStatus.SENT_TO_BANK, "SYSTEM", "JV-SEED3", "واگذاری به بانک (خواباندن به حساب)");
    this.recordHistory(c3.id, null, ChequeStatus.ISSUED, "SYSTEM", "JV-SEED4", "صدور چک عهده شرکت");

    this.saveToStorage();
  }

  // --- Sayad ID 16-Digit Verification & central inquiry mockup ---
  inquireSayad(sayadId: string): SayadInquiryResult {
    const cleanId = sayadId.replace(/\s+/g, '');
    
    if (cleanId.length !== 16 || !/^\d+$/.test(cleanId)) {
      return {
        valid: false,
        color: 'RED',
        colorLabel: 'نابرابر',
        colorDesc: 'ساختار شناسه نامعتبر است',
        drawerName: '-',
        nationalId: '-',
        bouncedCount: 0,
        bouncedAmount: 0,
        creditCeiling: 0,
        message: 'شناسه صیاد الزماً باید ۱۶ رقم عددی فاقد حروف یا علامت باشد.'
      };
    }

    // Deterministic generation based on the last digit for testability
    const lastDigit = Number(cleanId.charAt(cleanId.length - 1));
    
    if (lastDigit === 0 || lastDigit === 1 || lastDigit === 5) {
      return {
        valid: true,
        color: 'WHITE',
        colorLabel: 'سفید (بسیار مطلوب)',
        colorDesc: 'صادرکننده فاقد هرگونه سابقه چک برگشتی رفع سوء اثر نشده است.',
        drawerName: 'حسین رضایی‌فر (حقیقی)',
        nationalId: '0018472935',
        bouncedCount: 0,
        bouncedAmount: 0,
        creditCeiling: 1500000000, // 1.5 Billion Rials
        message: 'وضعیت اعتباری عالی. ریسک معامله بسیار پایین است. ثبت چک بلامانع است.'
      };
    } else if (lastDigit === 2 || lastDigit === 8) {
      return {
        valid: true,
        color: 'YELLOW',
        colorLabel: 'زرد (مورد تایید با هشدار)',
        colorDesc: 'صادرکننده دارای حداکثر یک فقره چک برگشتی یا حداکثر مبلغ ۵۰ میلیون ریال تعهد برگشتی است.',
        drawerName: 'فاطمه السادات هاشمی',
        nationalId: '0029381724',
        bouncedCount: 1,
        bouncedAmount: 45000000,
        creditCeiling: 500000000, // 500m Rials
        message: 'وضعیت اعتباری زرد. دارای سابقه کوچک چک برگشتی. توصیه می‌شود تضامین ثانویه اخذ شود.'
      };
    } else if (lastDigit === 3 || lastDigit === 7) {
      return {
        valid: true,
        color: 'ORANGE',
        colorLabel: 'نارنجی (ریسک متوسط رو به بالا)',
        colorDesc: 'صادرکننده دارای ۲ الی ۴ فقره چک برگشتی به مبلغ حداکثر ۲۰۰ میلیون ریال رفع سوء اثر نشده است.',
        drawerName: 'صنایع چوب و فلز مدرن (حقوقی)',
        nationalId: '10103829481',
        bouncedCount: 3,
        bouncedAmount: 180000000,
        creditCeiling: 200000000,
        message: 'وضعیت اعتباری نارنجی. ریسک بالا! طبق دستورالعمل‌های کنترل داخلی، دریافت این چک منوط به تایید کتبی مدیریت مالی است.'
      };
    } else {
      return {
        valid: true,
        color: 'RED',
        colorLabel: 'قرمز (ریسک شدید - مسدود)',
        colorDesc: 'صادرکننده دارای چک‌های برگشتی مکرر یا تعهدات بالای ۲ میلیارد ریال یا حکم قضایی مسدودی حساب است.',
        drawerName: 'علیرضا اسدیان (شریک خلع ید شده)',
        nationalId: '0459382711',
        bouncedCount: 9,
        bouncedAmount: 3400000000,
        creditCeiling: 0,
        message: 'وضعیت اعتباری قرمز! حساب‌های نامبرده مسدود قضایی است. سیستم از پذیرش چک این شخص جلوگیری به عمل می‌آورد!'
      };
    }
  }

  // --- ACID Transaction Block to Create Cheque ---
  createCheque(chequeData: Omit<Cheque, 'id' | 'current_status'>): { success: boolean; cheque?: Cheque; voucher?: JournalVoucher | null; error?: string } {
    // --- TRANSACTION START ---
    // Deep copies for ACID Rollback
    const backupCheques = JSON.parse(JSON.stringify(Array.from(this.cheques.values())));
    const backupHistory = JSON.parse(JSON.stringify(this.history));
    const backupVouchers = JSON.parse(JSON.stringify(this.vouchers));

    try {
      if (chequeData.amount <= 0) {
        throw new Error("مبلغ چک الزماً باید بزرگتر از صفر باشد.");
      }

      // If received sayad cheque, validate and reject red drawers
      if (chequeData.type === ChequeType.RECEIVED) {
        const checkSayad = this.inquireSayad(chequeData.sayad_id);
        if (checkSayad.valid && checkSayad.color === 'RED') {
          throw new Error(`خطای پذیرش چک: صادرکننده این چک (${checkSayad.drawerName}) در وضعیت اعتباری قرمز است و ثبت این چک به دلایل امنیتی در سیستم مسدود می‌باشد.`);
        }
      }

      const id = "CHQ-" + (chequeData.type === ChequeType.RECEIVED ? "RCV-" : "PAD-") + Math.random().toString(36).substring(2, 8).toUpperCase();
      const initialStatus = chequeData.type === ChequeType.RECEIVED ? ChequeStatus.REGISTERED : ChequeStatus.ISSUED;
      
      const newCheque: Cheque = {
        ...chequeData,
        id,
        current_status: initialStatus
      };
      
      this.cheques.set(id, newCheque);
      
      // Auto-generate voucher
      const jv = this.generateVoucher(newCheque, null, initialStatus);
      if (jv) {
        this.vouchers.push(jv);
      }

      this.recordHistory(id, null, initialStatus, 'user_1', jv?.id || null, "ثبت اولیه در صندوق و صدور آرتیکل‌های مالی");
      
      // --- TRANSACTION COMMIT ---
      this.saveToStorage();
      return { success: true, cheque: newCheque, voucher: jv };

    } catch (error: any) {
      // --- TRANSACTION ROLLBACK ---
      this.cheques.clear();
      backupCheques.forEach((c: Cheque) => this.cheques.set(c.id, c));
      this.history = backupHistory;
      this.vouchers = backupVouchers;
      return { success: false, error: error.message || "خطای نامشخص در ثبت و پردازش تراکنش چک" };
    }
  }

  // --- ACID Transaction Block to Transition Cheque Status ---
  transitionStatus(chequeId: string, newStatus: ChequeStatus, params?: { bankAccountId?: string; discountRate?: number }): { success: boolean; error?: string; cheque?: Cheque; voucher?: JournalVoucher | null } {
    // --- TRANSACTION START ---
    const backupCheques = JSON.parse(JSON.stringify(Array.from(this.cheques.values())));
    const backupHistory = JSON.parse(JSON.stringify(this.history));
    const backupVouchers = JSON.parse(JSON.stringify(this.vouchers));

    try {
      const cheque = this.cheques.get(chequeId);
      if (!cheque) throw new Error('چک مورد نظر در سیستم یافت نشد.');

      const oldStatus = cheque.current_status;
      if (!this.isValidTransition(cheque.type, oldStatus, newStatus)) {
        throw new Error(`انتقال وضعیت از "${this.getStatusLabelPersian(oldStatus)}" به "${this.getStatusLabelPersian(newStatus)}" برای این دسته چک مجاز نیست.`);
      }

      // Save additional parameters
      if (newStatus === ChequeStatus.DISCOUNTED && params?.discountRate) {
        cheque.discount_rate = params.discountRate;
      }

      cheque.current_status = newStatus;
      this.cheques.set(chequeId, cheque);

      const jv = this.generateVoucher(cheque, oldStatus, newStatus, params?.bankAccountId);
      if (jv) {
        this.vouchers.push(jv);
      }

      const note = `تغییر وضعیت از [${this.getStatusLabelPersian(oldStatus)}] به [${this.getStatusLabelPersian(newStatus)}] ${params?.discountRate ? `با نرخ تنزیل ${params.discountRate}٪` : ""}`;
      this.recordHistory(chequeId, oldStatus, newStatus, 'user_1', jv?.id || null, note);
      
      // --- TRANSACTION COMMIT ---
      this.saveToStorage();
      return { success: true, cheque, voucher: jv };

    } catch (error: any) {
      // --- TRANSACTION ROLLBACK ---
      this.cheques.clear();
      backupCheques.forEach((c: Cheque) => this.cheques.set(c.id, c));
      this.history = backupHistory;
      this.vouchers = backupVouchers;
      return { success: false, error: error.message || "انتقال وضعیت ناموفق بود و تمام تغییرات لغو (Rollback) شدند." };
    }
  }

  private isValidTransition(type: ChequeType, from: ChequeStatus, to: ChequeStatus): boolean {
    if (type === ChequeType.RECEIVED) {
      const allowedTransitions: Record<string, ChequeStatus[]> = {
        [ChequeStatus.REGISTERED]: [ChequeStatus.SENT_TO_BANK, ChequeStatus.BOUNCED, ChequeStatus.RETURNED, ChequeStatus.DISCOUNTED],
        [ChequeStatus.SENT_TO_BANK]: [ChequeStatus.COLLECTED, ChequeStatus.BOUNCED],
        [ChequeStatus.DISCOUNTED]: [],
        [ChequeStatus.COLLECTED]: [],
        [ChequeStatus.BOUNCED]: [ChequeStatus.SENT_TO_BANK, ChequeStatus.RETURNED], // Bounced checks can be re-submitted or returned to customer
        [ChequeStatus.RETURNED]: []
      };
      return allowedTransitions[from]?.includes(to) ?? false;
    } else {
      const allowedTransitions: Record<string, ChequeStatus[]> = {
        [ChequeStatus.ISSUED]: [ChequeStatus.CLEARED, ChequeStatus.BOUNCED_PAID, ChequeStatus.RETURNED_PAID],
        [ChequeStatus.CLEARED]: [],
        [ChequeStatus.BOUNCED_PAID]: [ChequeStatus.CLEARED, ChequeStatus.RETURNED_PAID], // Can clear later or retrieve/cancel
        [ChequeStatus.RETURNED_PAID]: []
      };
      return allowedTransitions[from]?.includes(to) ?? false;
    }
  }

  private generateVoucher(cheque: Cheque, from: ChequeStatus | null, to: ChequeStatus, bankAccountId?: string): JournalVoucher | null {
    const lines: JournalVoucherLine[] = [];
    const description = `بابت چک ${cheque.type === ChequeType.RECEIVED ? 'دریافتی' : 'پرداختی'} شماره ${cheque.cheque_number} عهده ${cheque.drawer_bank}`;

    if (cheque.type === ChequeType.RECEIVED) {
      if (to === ChequeStatus.REGISTERED) {
        // Debit: Notes Receivable (اسناد دریافتنی در صندوق), Credit: Accounts Receivable (حساب‌های دریافتنی)
        lines.push({ account_code: this.accountCodes.notesReceivable, debit: cheque.amount, credit: 0, description: `بابت دریافت چک شماره ${cheque.cheque_number} صندوق` });
        lines.push({ account_code: this.accountCodes.accountsReceivable, detailed_account_id: cheque.payer_payee_id, debit: 0, credit: cheque.amount, description: `کاهش بدهی مشتری بابت چک شماره ${cheque.cheque_number}` });
      } else if (to === ChequeStatus.SENT_TO_BANK) {
        // Debit: Cheques in Transit (اسناد در جریان وصول), Credit: Notes Receivable (اسناد دریافتنی در صندوق)
        lines.push({ account_code: this.accountCodes.chequesInTransit, debit: cheque.amount, credit: 0, description: `واگذاری چک شماره ${cheque.cheque_number} به بانک جهت وصول` });
        lines.push({ account_code: this.accountCodes.notesReceivable, debit: 0, credit: cheque.amount, description: `خروج چک شماره ${cheque.cheque_number} از صندوق شرکت` });
      } else if (to === ChequeStatus.COLLECTED) {
        // Debit: Bank, Credit: Cheques in Transit (اسناد در جریان وصول)
        lines.push({ account_code: bankAccountId || this.accountCodes.bank, debit: cheque.amount, credit: 0, description: `وصول مبلغ چک شماره ${cheque.cheque_number} و واریز به حساب` });
        lines.push({ account_code: this.accountCodes.chequesInTransit, debit: 0, credit: cheque.amount, description: `تسویه حساب اسناد در جریان وصول بابت وصول چک` });
      } else if (to === ChequeStatus.BOUNCED) {
        // Debit: Accounts Receivable (مشتری), Credit: depends on previous status
        const creditAccount = from === ChequeStatus.SENT_TO_BANK ? this.accountCodes.chequesInTransit : this.accountCodes.notesReceivable;
        lines.push({ account_code: this.accountCodes.accountsReceivable, detailed_account_id: cheque.payer_payee_id, debit: cheque.amount, credit: 0, description: `بدهکار شدن مجدد مشتری بابت برگشت خوردن چک شماره ${cheque.cheque_number}` });
        lines.push({ account_code: creditAccount, debit: 0, credit: cheque.amount, description: `کاهش دارایی اسناد چک بابت برگشت فیزیکی چک شماره ${cheque.cheque_number}` });
      } else if (to === ChequeStatus.RETURNED) {
        // Debit: Accounts Receivable (مشتری), Credit: Notes Receivable (اسناد دریافتنی در صندوق)
        lines.push({ account_code: this.accountCodes.accountsReceivable, detailed_account_id: cheque.payer_payee_id, debit: cheque.amount, credit: 0, description: `استرداد و پس دادن فیزیکی چک شماره ${cheque.cheque_number} به مشتری` });
        lines.push({ account_code: this.accountCodes.notesReceivable, debit: 0, credit: cheque.amount, description: `خروج چک استردادی شماره ${cheque.cheque_number} از دفاتر` });
      } else if (to === ChequeStatus.DISCOUNTED) {
        // Discounting: Debit: Bank (partially), Debit: Finance Expense (discount fee), Credit: Notes Receivable
        const rate = cheque.discount_rate || 5; // default 5% discount charge
        const discountFee = Math.round(cheque.amount * (rate / 100));
        const cashReceived = cheque.amount - discountFee;

        lines.push({ account_code: bankAccountId || this.accountCodes.bank, debit: cashReceived, credit: 0, description: `دریافت وجه نقد ناشی از تنزیل چک شماره ${cheque.cheque_number} قبل از سررسید` });
        lines.push({ account_code: this.accountCodes.financeExpense, debit: discountFee, credit: 0, description: `هزینه تنزیل و تنزیل کارمزد مالی چک شماره ${cheque.cheque_number} با نرخ ${rate}٪` });
        lines.push({ account_code: this.accountCodes.notesReceivable, debit: 0, credit: cheque.amount, description: `خروج چک تنزیل‌شده شماره ${cheque.cheque_number} از موجودی اسناد دریافتنی` });
      }
    } else {
      if (to === ChequeStatus.ISSUED) {
        // Debit: Accounts Payable (تامین کننده), Credit: Notes Payable (اسناد پرداختنی)
        lines.push({ account_code: this.accountCodes.accountsPayable, detailed_account_id: cheque.payer_payee_id, debit: cheque.amount, credit: 0, description: `کاهش بدهی تامین‌کننده بابت صدور برگه چک شماره ${cheque.cheque_number}` });
        lines.push({ account_code: this.accountCodes.notesPayable, debit: 0, credit: cheque.amount, description: `افزایش تعهدات اسناد پرداختنی بابت چک صادر شده شماره ${cheque.cheque_number}` });
      } else if (to === ChequeStatus.CLEARED) {
        // Debit: Notes Payable (اسناد پرداختنی), Credit: Bank
        lines.push({ account_code: this.accountCodes.notesPayable, debit: cheque.amount, credit: 0, description: `کاهش تعهد بابت پاس شدن چک صادر شده شماره ${cheque.cheque_number} در بانک` });
        lines.push({ account_code: bankAccountId || this.accountCodes.bank, debit: 0, credit: cheque.amount, description: `برداشت از حساب بانکی شرکت بابت وصول چک صادر شده شماره ${cheque.cheque_number}` });
      } else if (to === ChequeStatus.BOUNCED_PAID) {
        // Revert: Debit: Notes Payable, Credit: Accounts Payable
        lines.push({ account_code: this.accountCodes.notesPayable, debit: cheque.amount, credit: 0, description: `ابطال موقت تعهد پرداخت بابت برگشت خوردن چک صادر شده شماره ${cheque.cheque_number}` });
        lines.push({ account_code: this.accountCodes.accountsPayable, detailed_account_id: cheque.payer_payee_id, debit: 0, credit: cheque.amount, description: `بستانکار شدن تامین‌کننده بابت بدهی چک برگشتی شماره ${cheque.cheque_number}` });
      } else if (to === ChequeStatus.RETURNED_PAID) {
        // Revert: Debit: Notes Payable, Credit: Accounts Payable
        lines.push({ account_code: this.accountCodes.notesPayable, debit: cheque.amount, credit: 0, description: `استرداد و ابطال چک صادر شده شماره ${cheque.cheque_number}` });
        lines.push({ account_code: this.accountCodes.accountsPayable, detailed_account_id: cheque.payer_payee_id, debit: 0, credit: cheque.amount, description: `احیای مانده طلب تامین‌کننده ناشی از عودت چک شماره ${cheque.cheque_number}` });
      }
    }

    if (lines.length === 0) return null;

    return {
      id: "JV-" + Math.random().toString(36).substring(2, 8).toUpperCase(),
      date: new Date().toISOString(),
      lines,
      description
    };
  }

  private recordHistory(chequeId: string, from: ChequeStatus | null, to: ChequeStatus, userId: string, jvId: string | null, note?: string) {
    this.history.push({
      id: Math.random().toString(36).substring(2, 9),
      cheque_id: chequeId,
      from_status: from,
      to_status: to,
      action_date: new Date().toISOString(),
      user_id: userId,
      journal_voucher_id: jvId,
      note
    });
  }

  getAllCheques(): Cheque[] {
    return Array.from(this.cheques.values());
  }

  getChequeHistory(chequeId: string): ChequeStatusHistory[] {
    return this.history.filter(h => h.cheque_id === chequeId).sort((a, b) => new Date(a.action_date).getTime() - new Date(b.action_date).getTime());
  }

  getAllVouchers(): JournalVoucher[] {
    return this.vouchers;
  }

  getVoucherById(id: string): JournalVoucher | undefined {
    return this.vouchers.find(v => v.id === id);
  }

  getStatusLabelPersian(s: ChequeStatus): string {
    const labels: Record<string, string> = {
      [ChequeStatus.REGISTERED]: "موجود در صندوق",
      [ChequeStatus.SENT_TO_BANK]: "در جریان وصول",
      [ChequeStatus.COLLECTED]: "وصول شده",
      [ChequeStatus.BOUNCED]: "برگشتی",
      [ChequeStatus.RETURNED]: "عودت به مشتری",
      [ChequeStatus.DISCOUNTED]: "تنزیل شده",
      [ChequeStatus.ISSUED]: "صادر شده",
      [ChequeStatus.CLEARED]: "پاس شده",
      [ChequeStatus.BOUNCED_PAID]: "برگشتی پرداختی",
      [ChequeStatus.RETURNED_PAID]: "ابطال و استرداد صادره"
    };
    return labels[s] || s;
  }

  getChequeStats() {
    const list = this.getAllCheques();
    
    // Received stats
    const rTotal = list.filter(c => c.type === ChequeType.RECEIVED);
    const rInHand = rTotal.filter(c => c.current_status === ChequeStatus.REGISTERED);
    const rInTransit = rTotal.filter(c => c.current_status === ChequeStatus.SENT_TO_BANK);
    const rCollected = rTotal.filter(c => c.current_status === ChequeStatus.COLLECTED);
    const rBounced = rTotal.filter(c => c.current_status === ChequeStatus.BOUNCED);
    const rDiscounted = rTotal.filter(c => c.current_status === ChequeStatus.DISCOUNTED);

    // Paid stats
    const pTotal = list.filter(c => c.type === ChequeType.PAID);
    const pIssued = pTotal.filter(c => c.current_status === ChequeStatus.ISSUED);
    const pCleared = pTotal.filter(c => c.current_status === ChequeStatus.CLEARED);
    const pBounced = pTotal.filter(c => c.current_status === ChequeStatus.BOUNCED_PAID);

    const sumAmount = (arr: Cheque[]) => arr.reduce((sum, c) => sum + c.amount, 0);

    return {
      received: {
        totalCount: rTotal.length,
        totalAmount: sumAmount(rTotal),
        inHandCount: rInHand.length,
        inHandAmount: sumAmount(rInHand),
        inTransitCount: rInTransit.length,
        inTransitAmount: sumAmount(rInTransit),
        collectedCount: rCollected.length,
        collectedAmount: sumAmount(rCollected),
        bouncedCount: rBounced.length,
        bouncedAmount: sumAmount(rBounced),
        discountedCount: rDiscounted.length,
        discountedAmount: sumAmount(rDiscounted)
      },
      paid: {
        totalCount: pTotal.length,
        totalAmount: sumAmount(pTotal),
        issuedCount: pIssued.length,
        issuedAmount: sumAmount(pIssued),
        clearedCount: pCleared.length,
        clearedAmount: sumAmount(pCleared),
        bouncedCount: pBounced.length,
        bouncedAmount: sumAmount(pBounced)
      }
    };
  }
}
