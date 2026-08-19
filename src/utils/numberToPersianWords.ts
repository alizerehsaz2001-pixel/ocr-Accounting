/**
 * Utility functions for converting numbers to Persian words, formatting Persian digits,
 * and enriching accounting JSON data with word-equivalent representations for important monetary fields.
 */

export const toPersianDigits = (numOrStr: number | string | null | undefined): string => {
  if (numOrStr === null || numOrStr === undefined) return "";
  const str = String(numOrStr);
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return str.replace(/[0-9]/g, (w) => persianDigits[parseInt(w, 10)]);
};

export const toEnglishDigits = (str: string): string => {
  if (!str) return "";
  return str
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632));
};

export const numToWordsFa = (num: number): string => {
  if (isNaN(num) || num === null || num === undefined) return "";
  if (num === 0) return "صفر";
  
  // Handle negative numbers
  if (num < 0) {
    return "منفی " + numToWordsFa(Math.abs(num));
  }

  const yekan = ["", "یک", "دو", "سه", "چهار", "پنج", "شش", "هفت", "هشت", "نه"];
  const dahgan = ["", "ده", "بیست", "سی", "چهل", "پنجاه", "شصت", "هفتاد", "هشتاد", "نود"];
  const dahToNuzdah = ["ده", "یازده", "دوازده", "سیزده", "چهارده", "پانزده", "شانزده", "هفده", "هجده", "نوزده"];
  const sadgan = ["", "صد", "دویست", "سیصد", "چهارصد", "پانصد", "ششصد", "هفتصد", "هشتصد", "نهصد"];
  const stages = ["", "هزار", "میلیون", "میلیارد", "تریلیون"];

  const convertThreeDigits = (n: number): string => {
    if (n === 0) return "";
    let res = "";
    const s = Math.floor(n / 100);
    const d = Math.floor((n % 100) / 10);
    const y = n % 10;

    if (s > 0) res += sadgan[s];
    
    if (d > 0) {
      if (res !== "") res += " و ";
      if (d === 1 && y >= 0) {
        res += dahToNuzdah[y];
        return res;
      } else {
        res += dahgan[d];
      }
    }
    
    if (y > 0) {
      if (res !== "") res += " و ";
      res += yekan[y];
    }
    return res;
  };

  let temp = Math.floor(num);
  let stageCount = 0;
  const parts: string[] = [];

  while (temp > 0) {
    const chunk = temp % 1000;
    if (chunk > 0) {
      const words = convertThreeDigits(chunk);
      parts.unshift(words + (stages[stageCount] !== "" ? " " + stages[stageCount] : ""));
    }
    temp = Math.floor(temp / 1000);
    stageCount++;
  }

  const integerPartWords = parts.join(" و ");
  
  // Decimal handling if necessary
  const decimalPart = Math.round((num - Math.floor(num)) * 100);
  if (decimalPart > 0) {
    return `${integerPartWords} ممیز ${numToWordsFa(decimalPart)} صدم`;
  }

  return integerPartWords;
};

/**
 * Checks if a key represents an important monetary/financial field that should have a Persian words equivalent.
 * Excludes trivial indices, years, dates, postal codes, and IDs.
 */
export const isMonetaryKey = (keyName: string): boolean => {
  if (!keyName) return false;
  const keyLower = keyName.toLowerCase().trim();
  
  // Exclude non-monetary numeric identifiers
  if (
    keyLower.includes("کد_ملی") ||
    keyLower.includes("شناسه") ||
    keyLower.includes("کد_پستی") ||
    keyLower.includes("تاریخ") ||
    keyLower.includes("سال") ||
    keyLower.includes("ردیف") ||
    keyLower.includes("تعداد") ||
    keyLower.includes("شماره") ||
    keyLower.includes("ضریب_اطمینان") ||
    keyLower.includes("id") ||
    keyLower.includes("code") ||
    keyLower.includes("phone") ||
    keyLower.includes("date")
  ) {
    return false;
  }

  // Include monetary fields
  return (
    keyLower.includes("مبلغ") ||
    keyLower.includes("قیمت") ||
    keyLower.includes("هزینه") ||
    keyLower.includes("بدهکار") ||
    keyLower.includes("بستانکار") ||
    keyLower.includes("مالیات") ||
    keyLower.includes("عوارض") ||
    keyLower.includes("تخفیف") ||
    keyLower.includes("جمع") ||
    keyLower.includes("حقوق") ||
    keyLower.includes("دستمرزد") ||
    keyLower.includes("فی") ||
    keyLower.includes("amount") ||
    keyLower.includes("debit") ||
    keyLower.includes("credit") ||
    keyLower.includes("price") ||
    keyLower.includes("cost") ||
    keyLower.includes("total") ||
    keyLower.includes("tax") ||
    keyLower.includes("discount") ||
    keyLower.includes("balance") ||
    keyLower.includes("expense") ||
    keyLower.includes("fee")
  );
};

/**
 * Formats a monetary number into math figures with Persian digits and Persian words representation.
 */
export const formatAmountWithWords = (
  val: number | string | null | undefined,
  unit: string = "ریال"
): { numericFa: string; wordsFa: string; fullFormatted: string } => {
  if (val === null || val === undefined || val === "") {
    return { numericFa: "-", wordsFa: "", fullFormatted: "-" };
  }

  const cleanStr = typeof val === "string" ? toEnglishDigits(val).replace(/,/g, "").trim() : String(val);
  const num = Number(cleanStr);

  if (isNaN(num)) {
    return { numericFa: String(val), wordsFa: "", fullFormatted: String(val) };
  }

  if (num === 0) {
    return {
      numericFa: "۰ " + unit,
      wordsFa: "صفر " + unit,
      fullFormatted: `۰ ${unit} (صفر ${unit})`
    };
  }

  const numericFormatted = toPersianDigits(num.toLocaleString("en-US"));
  const words = numToWordsFa(num);
  const wordsFormatted = words ? `${words} ${unit}` : "";

  return {
    numericFa: `${numericFormatted} ${unit}`,
    wordsFa: wordsFormatted,
    fullFormatted: wordsFormatted ? `${numericFormatted} ${unit} (${wordsFormatted})` : `${numericFormatted} ${unit}`
  };
};

/**
 * Enriches extracted OCR or Accounting JSON objects/arrays with word equivalents for all significant monetary fields
 * and guarantees Debit (مبلغ_بدهکار) & Credit (مبلغ_بستانکار) double-entry columns are always populated.
 */
export const enrichJSONWithWords = (data: any): any => {
  if (!data) return data;

  // Deep clone to avoid mutating original unexpectedly
  const result = JSON.parse(JSON.stringify(data));

  // Helper to extract numeric amount from a row or fields array
  const getRowAmount = (rowFields: any[] | Record<string, any>): number => {
    let rawAmount: any = null;
    if (Array.isArray(rowFields)) {
      const field = rowFields.find(f => f && f.کلید && (
        f.کلید === "مبلغ_نهایی_ردیف" ||
        f.کلید === "مبلغ_کل_ردیف" ||
        f.کلید === "مبلغ_کل" ||
        f.کلید === "مبلغ" ||
        f.کلید === "فی_واحد" ||
        f.کلید === "مبلغ_قابل_پرداخت"
      ));
      if (field) rawAmount = field.مقدار;
    } else if (typeof rowFields === "object") {
      rawAmount = rowFields["مبلغ_نهایی_ردیف"] || rowFields["مبلغ_کل_ردیف"] || rowFields["مبلغ_کل"] || rowFields["مبلغ"] || rowFields["فی_واحد"] || rowFields["مبلغ_قابل_پرداخت"];
    }
    if (rawAmount !== null && rawAmount !== undefined && rawAmount !== "") {
      const num = Number(toEnglishDigits(String(rawAmount)).replace(/,/g, ""));
      return isNaN(num) ? 0 : num;
    }
    return 0;
  };

  // Helper to determine whether doc is debit-heavy (purchase/expense) or credit-heavy (sales/income)
  const isPurchaseOrExpenseDoc = (docTypeStr?: string): boolean => {
    if (!docTypeStr) return true; // Default to purchase/expense
    const dt = docTypeStr.toLowerCase();
    if (dt.includes("فروش") || dt.includes("درآمد") || dt.includes("واریز") || dt.includes("دریافت")) {
      return false;
    }
    return true;
  };

  // Case 1: Standard AI OCR Schema object { نوع_سند, ستون_ها, ردیف_ها }
  if (result.ردیف_ها && Array.isArray(result.ردیف_ها)) {
    const wordColumnsToAdd = new Map<string, string>();
    const isPurchase = isPurchaseOrExpenseDoc(result.نوع_سند);

    // Ensure ستون_ها contains بدهکار and بستانکار
    if (!result.ستون_ها) result.ستون_ها = [];
    if (Array.isArray(result.ستون_ها)) {
      const hasDebitCol = result.ستون_ها.some((c: any) => c.کلید === "مبلغ_بدهکار");
      const hasCreditCol = result.ستون_ها.some((c: any) => c.کلید === "مبلغ_بستانکار");
      if (!hasDebitCol) result.ستون_ها.push({ کلید: "مبلغ_بدهکار", عنوان: "مبلغ بدهکار (ریال)" });
      if (!hasCreditCol) result.ستون_ها.push({ کلید: "مبلغ_بستانکار", عنوان: "مبلغ بستانکار (ریال)" });
    }

    result.ردیف_ها.forEach((rowObj: any) => {
      if (rowObj.فیلد_ها && Array.isArray(rowObj.فیلد_ها)) {
        const newFields: any[] = [];
        let hasDebitField = false;
        let hasCreditField = false;

        rowObj.فیلد_ها.forEach((f: any) => {
          newFields.push(f);
          if (f && f.کلید === "مبلغ_بدهکار") hasDebitField = true;
          if (f && f.کلید === "مبلغ_بستانکار") hasCreditField = true;

          if (f && f.کلید && isMonetaryKey(f.کلید) && !f.کلید.endsWith("_به_حروف")) {
            const rawVal = f.مقدار;
            if (rawVal !== null && rawVal !== undefined && rawVal !== "") {
              const numVal = Number(toEnglishDigits(String(rawVal)).replace(/,/g, ""));
              if (!isNaN(numVal) && numVal >= 10) {
                const words = numToWordsFa(numVal);
                if (words) {
                  const wordKey = `${f.کلید}_به_حروف`;
                  const wordTitle = `${f.عنوان || f.کلید} به حروف`;
                  newFields.push({
                    کلید: wordKey,
                    عنوان: wordTitle,
                    مقدار: `${words} ریال`
                  });
                  wordColumnsToAdd.set(wordKey, wordTitle);
                }
              }
            }
          }
        });

        // Inject بدهکار & بستانکار if missing from row
        if (!hasDebitField || !hasCreditField) {
          const amt = getRowAmount(rowObj.فیلد_ها);
          if (!hasDebitField) {
            newFields.push({
              کلید: "مبلغ_بدهکار",
              عنوان: "مبلغ بدهکار (ریال)",
              مقدار: isPurchase ? (amt ? String(amt) : "0") : "0"
            });
          }
          if (!hasCreditField) {
            newFields.push({
              کلید: "مبلغ_بستانکار",
              عنوان: "مبلغ بستانکار (ریال)",
              مقدار: !isPurchase ? (amt ? String(amt) : "0") : "0"
            });
          }
        }

        rowObj.فیلد_ها = newFields;
      } else if (typeof rowObj === "object") {
        // Direct object row
        const amt = getRowAmount(rowObj);
        if (rowObj["مبلغ_بدهکار"] === undefined) {
          rowObj["مبلغ_بدهکار"] = isPurchase ? (amt ? String(amt) : "0") : "0";
        }
        if (rowObj["مبلغ_بستانکار"] === undefined) {
          rowObj["مبلغ_بستانکار"] = !isPurchase ? (amt ? String(amt) : "0") : "0";
        }

        Object.keys(rowObj).forEach((k) => {
          if (isMonetaryKey(k) && !k.endsWith("_به_حروف")) {
            const rawVal = rowObj[k];
            if (rawVal !== null && rawVal !== undefined && rawVal !== "") {
              const numVal = Number(toEnglishDigits(String(rawVal)).replace(/,/g, ""));
              if (!isNaN(numVal) && numVal >= 10) {
                const words = numToWordsFa(numVal);
                if (words) {
                  rowObj[`${k}_به_حروف`] = `${words} ریال`;
                }
              }
            }
          }
        });
      }
    });

    // Also update ستون_ها array if present with word columns
    if (result.ستون_ها && Array.isArray(result.ستون_ها)) {
      wordColumnsToAdd.forEach((title, key) => {
        const exists = result.ستون_ها.some((c: any) => c.کلید === key);
        if (!exists) {
          result.ستون_ها.push({ کلید: key, عنوان: title });
        }
      });
    }

    return result;
  }

  // Case 2: Array of transaction rows
  if (Array.isArray(result)) {
    return result.map((row) => {
      if (!row || typeof row !== "object") return row;
      const newRow = { ...row };
      const amt = getRowAmount(newRow);
      if (newRow["مبلغ_بدهکار"] === undefined) {
        newRow["مبلغ_بدهکار"] = amt ? String(amt) : "0";
      }
      if (newRow["مبلغ_بستانکار"] === undefined) {
        newRow["مبلغ_بستانکار"] = "0";
      }

      Object.keys(row).forEach((k) => {
        if (isMonetaryKey(k) && !k.endsWith("_به_حروف")) {
          const rawVal = row[k];
          if (rawVal !== null && rawVal !== undefined && rawVal !== "") {
            const numVal = Number(toEnglishDigits(String(rawVal)).replace(/,/g, ""));
            if (!isNaN(numVal) && numVal >= 10) {
              const words = numToWordsFa(numVal);
              if (words) {
                newRow[`${k}_به_حروف`] = `${words} ریال`;
              }
            }
          }
        }
      });
      return newRow;
    });
  }

  // Case 3: Generic object
  if (typeof result === "object") {
    Object.keys(result).forEach((k) => {
      if (isMonetaryKey(k) && !k.endsWith("_به_حروف")) {
        const rawVal = result[k];
        if (rawVal !== null && rawVal !== undefined && rawVal !== "") {
          const numVal = Number(toEnglishDigits(String(rawVal)).replace(/,/g, ""));
          if (!isNaN(numVal) && numVal >= 10) {
            const words = numToWordsFa(numVal);
            if (words) {
              result[`${k}_به_حروف`] = `${words} ریال`;
            }
          }
        }
      }
    });
  }

  return result;
};
