import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update handleDownloadExcelFromJSON fallback mapping
old_fallback = '''          if (transactions && transactions.length > 0) {
            dataToExport = transactions.map((t, idx) => ({
              "ردیف": idx + 1,
              "تاریخ": t.تاریخ || "",
              "شماره_سند": t.شماره_سند || "",
              "نام_طرف_حساب": t.نام_طرف_حساب || "",
              "مبلغ_بدهکار": t.مبلغ_بدهکار || 0,
              "مبلغ_بستانکار": t.مبلغ_بستانکار || 0,
              "شرح": t.شرح || "",
              "توضیحات": t.توضیحات || ""
            }));
          }'''

new_fallback = '''          if (transactions && transactions.length > 0) {
            dataToExport = transactions.map((t, idx) => {
              const row: any = { "ردیف": idx + 1 };
              Object.keys(t).forEach(k => { if (k !== "id") row[k] = t[k]; });
              return row;
            });
          }'''

content = content.replace(old_fallback, new_fallback)

# 2. Another fallback in handleDownloadExcelFromJSON
old_fallback_2 = '''      } else if (transactions && transactions.length > 0) {
        dataToExport = transactions.map((t, idx) => ({
          "ردیف": idx + 1,
          "تاریخ": t.تاریخ || "",
          "شماره_سند": t.شماره_سند || "",
          "نام_طرف_حساب": t.نام_طرف_حساب || "",
          "مبلغ_بدهکار": t.مبلغ_بدهکار || 0,
          "مبلغ_بستانکار": t.مبلغ_بستانکار || 0,
          "شرح": t.شرح || "",
          "توضیحات": t.توضیحات || ""
        }));
      }'''

new_fallback_2 = '''      } else if (transactions && transactions.length > 0) {
        dataToExport = transactions.map((t, idx) => {
          const row: any = { "ردیف": idx + 1 };
          Object.keys(t).forEach(k => { if (k !== "id") row[k] = t[k]; });
          return row;
        });
      }'''

content = content.replace(old_fallback_2, new_fallback_2)

# 3. Direct excel export logic
old_direct_export = '''                              } else {
                                 worksheetData = transactions.map((t, idx) => ({
                                    "ردیف": idx + 1,
                                    "تاریخ": t.تاریخ,
                                    "شماره_سند": t.شماره_سند,
                                    "نام_طرف_حساب": t.نام_طرف_حساب,
                                    "شناسه_کد_ملی": t.شناسه_ملی || "",
                                    "شماره_مالیاتی": t.شماره_مالیاتی || "",
                                    "شرح": t.شرح,
                                    "هزینه_غیرقابل_قبول": t.هزینه_غیرقابل_قبول ? "بله" : "خیر",
                                    "ارزش_افزوده": t.مالیات_ارزش_افزوده || 0,
                                    "مبلغ_بدهکار": t.مبلغ_بدهکار || 0,
                                    "مبلغ_بستانکار": t.مبلغ_بستانکار || 0,
                                    "نوع_ارز": t.نوع_ارز,
                                    "توضیحات": t.توضیحات,
                                    "ضریب_اطمینان": t.ضریب_اطمینان || 100
                                 }));
                                 colWidths = [
                                    { wch: 5 }, { wch: 12 }, { wch: 10 }, { wch: 25 }, { wch: 15 }, { wch: 25 }, { wch: 40 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 30 }, { wch: 10 }
                                 ];
                              }'''

new_direct_export = '''                              } else {
                                 worksheetData = transactions.map((t, idx) => {
                                    const row: any = { "ردیف": idx + 1 };
                                    Object.keys(t).forEach(k => {
                                      if (k !== "id") row[k] = t[k];
                                    });
                                    return row;
                                 });
                                 // Auto-width based on keys
                                 if (worksheetData.length > 0) {
                                   colWidths = Object.keys(worksheetData[0]).map(k => ({ wch: Math.max(k.length + 5, 15) }));
                                 }
                              }'''

content = content.replace(old_direct_export, new_direct_export)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patch applied for exact excel output")
