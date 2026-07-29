import sys

with open("src/App.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Replace setIsExcelExportModalOpen(true); with handleQuickExcelExport();
content = content.replace("setIsExcelExportModalOpen(true);", "handleQuickExcelExport();")

# Add handleQuickExcelExport definition if not present
if "const handleQuickExcelExport =" not in content:
    excel_fn = """  const handleQuickExcelExport = () => {
    try {
      const allTx = transactions.length > 0 ? transactions : previousScans.flatMap(s => s.transactions || []);
      if (allTx.length === 0) {
        showNotification("هیچ تراکنشی جهت دریافت خروجی اکسل یافت نشد.", "warning");
        return;
      }
      const worksheet = XLSX.utils.json_to_sheet(allTx);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "اسناد و تراکنش‌ها");
      XLSX.writeFile(workbook, `OCR_Accounting_Export_${Date.now()}.xlsx`);
      showNotification("فایل اکسل جامع کلیه اسناد با موفقیت دانلود شد.", "success");
      logEvent("خروجی اکسل منو", "کاربر خروجی اکسل را از منوی اصلی بالای صفحه دانلود کرد.");
    } catch (err) {
      showNotification("خطا در ساخت خروجی اکسل اسناد.", "error");
    }
  };
"""
    content = content.replace(
        "const handleDownloadFullBackup =",
        excel_fn + "\n  const handleDownloadFullBackup ="
    )

with open("src/App.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated handleQuickExcelExport successfully!")
