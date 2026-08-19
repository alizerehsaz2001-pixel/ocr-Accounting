/**
 * قواعد استاندارد حسابداری ایران در تشخیص بدهکار و بستانکار شدن حساب بانک در دفاتر قانونی
 * Iranian Accounting Standards: Double-Entry Bank Account Debtor / Creditor Rules
 */

export type BankTransactionNature = 'DEBIT' | 'CREDIT' | 'UNKNOWN';

export interface BankRuleClassification {
  nature: BankTransactionNature;
  label: string; // e.g. "بدهکار (ورود وجه)" | "بستانکار (خروج وجه)"
  reasonCategory: string;
  oppositeAccountSuggestion: string; // سرفصل معین طرف مقابل
}

/**
 * بررسی و تشخیص خودکار بدهکار یا بستانکار شدن بانک بر اساس شرح تراکنش یا نوع سند
 */
export function classifyIranianBankTransaction(
  description: string = '',
  documentType: string = '',
  counterpartyName: string = ''
): BankRuleClassification {
  const text = `${description} ${documentType} ${counterpartyName}`.toLowerCase();

  // قواعد بدهکار شدن بانک (ورود وجه):
  // ۱. دریافت وجه از مشتریان (تسویه حساب‌های دریافتنی)
  // ۲. دریافت pre-payment یا پیش‌پرداخت از خریداران
  // ۳. دریافت تسهیلات و وام‌های بانکی
  // ۴. واریز سرمایه اولیه یا افزایش سرمایه توسط شرکا/سهامداران
  // ۵. وصول اسناد دریافتنی (چک) / سود سپرده
  const debitPatterns = [
    { pattern: /واریز|دریافت وجه|وصول|فروش|مشتری|پیش.?پرداخت از خریدار|پیش.?دریافت|وام|تسهیلات|افزایش سرمایه|سرمایه اولیه|سود سپرده|بدهکار|ورود پول|دریافتی/i, reason: "دریافت وجه / ورود نقدینگی", opp: "حساب‌های دریافتنی تجاری / پیش‌دریافت‌ها / تسهیلات" },
    { pattern: /pre-payment.*(buyer|customer)|customer payment/i, reason: "دریافت پیش‌پرداخت از مشتری", opp: "پیش‌دریافت از مشتریان" }
  ];

  // قواعد بستانکار شدن بانک (خروج وجه):
  // ۱. پرداخت به تامین‌کنندگان و فروشندگان (تسویه حساب‌های پرداختنی)
  // ۲. پرداخت پیش‌پرداخت به فروشندگان
  // ۳. پرداخت هزینه‌های جاری (حقوق و دستمزد، اجاره، هزینه‌های اداری و عمومی، قبوض)
  // ۴. پرداخت اقساط تسهیلات و کارمزد خدمات بانکی
  // ۵. پرداخت مالیات و بیمه سازمان تأمین اجتماعی
  const creditPatterns = [
    { pattern: /حقوق|دستمزد|پرسنل|مساعده/i, reason: "پرداخت حقوق و دستمزد پرسنل", opp: "هزینه حقوق و دستمزد" },
    { pattern: /اجاره|شارژ|رهن/i, reason: "پرداخت هزینه اجاره‌بها", opp: "هزینه اجاره" },
    { pattern: /مالیات|ارزش افزوده|مودیان|دارایی/i, reason: "پرداخت مالیات و عوارض", opp: "حساب‌های پرداختنی / مالیات پرداختنی" },
    { pattern: /تامین اجتماعی|بیمه|سیاهه بیمه/i, reason: "پرداخت حق بیمه سازمان تامین اجتماعی", opp: "هزینه بیمه سهم کارفرما / بیمه پرداختنی" },
    { pattern: /کارمزد|پایا|ساتنا|خدمات بانکی|بانکداری/i, reason: "پرداخت کارمزد خدمات بانکی", opp: "هزینه‌های مالی و کارمزد بانکی" },
    { pattern: /قسط|اقساط|بازپرداخت وام/i, reason: "پرداخت اقساط تسهیلات بانکی", opp: "تسهیلات مالی دریافتنی / هزینه‌های مالی" },
    { pattern: /تامین.?کننده|فروشنده|پیش.?پرداخت به|خرید|ملزومات|قبض|برق|آب|گاز|تلفن|اینترنت|اسنپ|ایاب و ذهاب|پذیرایی/i, reason: "پرداخت به تامین‌کنندگان / هزینه‌های جاری", opp: "حساب‌های پرداختنی تجاری / هزینه‌های جاری" },
  ];

  for (const item of creditPatterns) {
    if (item.pattern.test(text)) {
      return {
        nature: 'CREDIT',
        label: 'بستانکار (خروج وجه)',
        reasonCategory: item.reason,
        oppositeAccountSuggestion: item.opp
      };
    }
  }

  for (const item of debitPatterns) {
    if (item.pattern.test(text)) {
      return {
        nature: 'DEBIT',
        label: 'بدهکار (ورود وجه)',
        reasonCategory: item.reason,
        oppositeAccountSuggestion: item.opp
      };
    }
  }

  return {
    nature: 'UNKNOWN',
    label: 'نامشخص',
    reasonCategory: 'نیاز به بررسی تکمیلی سند',
    oppositeAccountSuggestion: 'سایر حساب‌های دریافتنی / پرداختنی'
  };
}
