export enum ChequeType {
  RECEIVED = 'RECEIVED',
  PAID = 'PAID'
}

export enum ChequeStatus {
  // Received
  REGISTERED = 'REGISTERED',
  SENT_TO_BANK = 'SENT_TO_BANK',
  COLLECTED = 'COLLECTED',
  BOUNCED = 'BOUNCED',
  RETURNED = 'RETURNED',
  // Paid
  ISSUED = 'ISSUED',
  CLEARED = 'CLEARED',
  BOUNCED_PAID = 'BOUNCED_PAID'
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
  payer_payee_id: string; // Floating Detailed Account ID
  type: ChequeType;
  current_status: ChequeStatus;
}

export interface ChequeStatusHistory {
  id: string;
  cheque_id: string;
  from_status: ChequeStatus | null;
  to_status: ChequeStatus;
  action_date: string;
  user_id: string;
  journal_voucher_id: string | null;
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

// Service Class containing state transitions and auto-vouchering
export class ChequeManagementEngine {
  private cheques: Map<string, Cheque> = new Map();
  private history: ChequeStatusHistory[] = [];
  private vouchers: JournalVoucher[] = [];

  // Standard account codes 
  private accountCodes = {
    notesReceivable: '1104', // اسناد دریافتنی
    accountsReceivable: '1103', // حساب‌های دریافتنی
    chequesInTransit: '1105', // اسناد در جریان وصول
    bank: '1101', // موجودی نقد و بانک
    accountsPayable: '2101', // حساب‌های پرداختنی
    notesPayable: '2102', // اسناد پرداختنی
  };

  constructor() {
    this.loadFromStorage();
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

  createCheque(cheque: Omit<Cheque, 'id' | 'current_status'>): { cheque: Cheque, voucher: JournalVoucher | null } {
    const id = Math.random().toString(36).substring(2, 10);
    const initialStatus = cheque.type === ChequeType.RECEIVED ? ChequeStatus.REGISTERED : ChequeStatus.ISSUED;
    
    const newCheque: Cheque = {
      ...cheque,
      id,
      current_status: initialStatus
    };
    
    this.cheques.set(id, newCheque);
    
    // Auto-generate voucher
    const jv = this.generateVoucher(newCheque, null, initialStatus);
    if (jv) {
        this.vouchers.push(jv);
    }

    this.recordHistory(id, null, initialStatus, 'user_1', jv?.id || null);
    
    this.saveToStorage();
    return { cheque: newCheque, voucher: jv };
  }

  transitionStatus(chequeId: string, newStatus: ChequeStatus, bankAccountId?: string): { success: boolean; error?: string; cheque?: Cheque; voucher?: JournalVoucher | null } {
    const cheque = this.cheques.get(chequeId);
    if (!cheque) return { success: false, error: 'چک مورد نظر یافت نشد' };

    const oldStatus = cheque.current_status;
    if (!this.isValidTransition(cheque.type, oldStatus, newStatus)) {
        return { success: false, error: `انتقال وضعیت از ${oldStatus} به ${newStatus} غیرمجاز است` };
    }

    cheque.current_status = newStatus;
    this.cheques.set(chequeId, cheque);

    const jv = this.generateVoucher(cheque, oldStatus, newStatus, bankAccountId);
    if (jv) {
        this.vouchers.push(jv);
    }

    this.recordHistory(chequeId, oldStatus, newStatus, 'user_1', jv?.id || null);
    this.saveToStorage();

    return { success: true, cheque, voucher: jv };
  }

  private isValidTransition(type: ChequeType, from: ChequeStatus, to: ChequeStatus): boolean {
    if (type === ChequeType.RECEIVED) {
      const allowedTransitions: Record<string, ChequeStatus[]> = {
        [ChequeStatus.REGISTERED]: [ChequeStatus.SENT_TO_BANK, ChequeStatus.BOUNCED, ChequeStatus.RETURNED],
        [ChequeStatus.SENT_TO_BANK]: [ChequeStatus.COLLECTED, ChequeStatus.BOUNCED],
        [ChequeStatus.COLLECTED]: [],
        [ChequeStatus.BOUNCED]: [],
        [ChequeStatus.RETURNED]: []
      };
      return allowedTransitions[from]?.includes(to) ?? false;
    } else {
      const allowedTransitions: Record<string, ChequeStatus[]> = {
        [ChequeStatus.ISSUED]: [ChequeStatus.CLEARED, ChequeStatus.BOUNCED_PAID],
        [ChequeStatus.CLEARED]: [],
        [ChequeStatus.BOUNCED_PAID]: []
      };
      return allowedTransitions[from]?.includes(to) ?? false;
    }
  }

  private generateVoucher(cheque: Cheque, from: ChequeStatus | null, to: ChequeStatus, bankAccountId?: string): JournalVoucher | null {
    const lines: JournalVoucherLine[] = [];
    const description = `بابت چک ${cheque.type === ChequeType.RECEIVED ? 'دریافتی' : 'پرداختی'} شماره ${cheque.cheque_number}`;

    if (cheque.type === ChequeType.RECEIVED) {
      if (to === ChequeStatus.REGISTERED) {
        // Debit: Notes Receivable, Credit: Accounts Receivable
        lines.push({ account_code: this.accountCodes.notesReceivable, debit: cheque.amount, credit: 0, description });
        lines.push({ account_code: this.accountCodes.accountsReceivable, detailed_account_id: cheque.payer_payee_id, debit: 0, credit: cheque.amount, description });
      } else if (to === ChequeStatus.SENT_TO_BANK) {
        // Debit: Cheques in Transit, Credit: Notes Receivable
        lines.push({ account_code: this.accountCodes.chequesInTransit, debit: cheque.amount, credit: 0, description });
        lines.push({ account_code: this.accountCodes.notesReceivable, debit: 0, credit: cheque.amount, description });
      } else if (to === ChequeStatus.COLLECTED) {
        // Debit: Bank, Credit: Cheques in Transit
        lines.push({ account_code: bankAccountId || this.accountCodes.bank, debit: cheque.amount, credit: 0, description });
        lines.push({ account_code: this.accountCodes.chequesInTransit, debit: 0, credit: cheque.amount, description });
      } else if (to === ChequeStatus.BOUNCED) {
        // Debit: Accounts Receivable, Credit: depends on previous status
        const creditAccount = from === ChequeStatus.SENT_TO_BANK ? this.accountCodes.chequesInTransit : this.accountCodes.notesReceivable;
        lines.push({ account_code: this.accountCodes.accountsReceivable, detailed_account_id: cheque.payer_payee_id, debit: cheque.amount, credit: 0, description });
        lines.push({ account_code: creditAccount, debit: 0, credit: cheque.amount, description });
      } else if (to === ChequeStatus.RETURNED) {
         // Debit: Accounts Receivable, Credit: Notes Receivable
         lines.push({ account_code: this.accountCodes.accountsReceivable, detailed_account_id: cheque.payer_payee_id, debit: cheque.amount, credit: 0, description });
         lines.push({ account_code: this.accountCodes.notesReceivable, debit: 0, credit: cheque.amount, description });
      }
    } else {
      if (to === ChequeStatus.ISSUED) {
        // Debit: Accounts Payable, Credit: Notes Payable
        lines.push({ account_code: this.accountCodes.accountsPayable, detailed_account_id: cheque.payer_payee_id, debit: cheque.amount, credit: 0, description });
        lines.push({ account_code: this.accountCodes.notesPayable, debit: 0, credit: cheque.amount, description });
      } else if (to === ChequeStatus.CLEARED) {
        // Debit: Notes Payable, Credit: Bank
        lines.push({ account_code: this.accountCodes.notesPayable, debit: cheque.amount, credit: 0, description });
        lines.push({ account_code: bankAccountId || this.accountCodes.bank, debit: 0, credit: cheque.amount, description });
      } else if (to === ChequeStatus.BOUNCED_PAID) {
        // Revert: Debit: Notes Payable, Credit: Accounts Payable
        lines.push({ account_code: this.accountCodes.notesPayable, debit: cheque.amount, credit: 0, description });
        lines.push({ account_code: this.accountCodes.accountsPayable, detailed_account_id: cheque.payer_payee_id, debit: 0, credit: cheque.amount, description });
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

  private recordHistory(chequeId: string, from: ChequeStatus | null, to: ChequeStatus, userId: string, jvId: string | null) {
    this.history.push({
      id: Math.random().toString(36).substring(2, 9),
      cheque_id: chequeId,
      from_status: from,
      to_status: to,
      action_date: new Date().toISOString(),
      user_id: userId,
      journal_voucher_id: jvId
    });
  }

  getAllCheques(): Cheque[] {
    return Array.from(this.cheques.values());
  }

  getChequeHistory(chequeId: string): ChequeStatusHistory[] {
    return this.history.filter(h => h.cheque_id === chequeId);
  }
}
