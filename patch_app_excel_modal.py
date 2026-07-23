import re

content = open('src/App.tsx').read()

# 1. Add import
if 'import { ExcelExportModal }' not in content:
    content = content.replace("import { Database", "import { ExcelExportModal } from './components/ExcelExportModal';\nimport { Database")

# 2. Add state
if 'isExcelModalOpen' not in content:
    state_injection = '''  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [excelModalData, setExcelModalData] = useState<any[]>([]);
  const [excelModalFilename, setExcelModalFilename] = useState("Export");
'''
    # Find a good place to inject state (after other useStates)
    content = re.sub(
        r'(const \[showOnboarding, setShowOnboarding\] = useState<boolean>\(false\);)',
        r'\1\n' + state_injection,
        content
    )

# 3. Add Modal Component to render
modal_jsx = '''
      {/* Excel Export Modal */}
      <ExcelExportModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        data={excelModalData}
        isDarkMode={isDarkMode}
        defaultFilename={excelModalFilename}
      />
'''
content = content.replace('{/* Onboarding Overlay */}', modal_jsx + '\n      {/* Onboarding Overlay */}')

# 4. Modify handleDownloadExcelFromJSON (around line 2470-2521)
# We need to replace the export logic to open the modal instead
old_handle_excel = '''  const handleDownloadExcelFromJSON = () => {
    try {
      if (!rawJsonText || !rawJsonText.trim()) {
        showNotification("هیچ کدی برای تولید فایل اکسل وجود ندارد.", "error");
        return;
      }
      const parsed = JSON.parse(rawJsonText);
      let arr: any[] = [];
      if (parsed && typeof parsed === "object") {
        if (Array.isArray(parsed)) {
          arr = parsed;
        } else if (parsed.ردیف_ها && Array.isArray(parsed.ردیف_ها)) {
          arr = parsed.ردیف_ها.map((row: any, idx: number) => {
            const flatRow: any = { "ردیف": idx + 1 };
            if (row.فیلد_ها && Array.isArray(row.فیلد_ها)) {
              row.فیلد_ها.forEach((f: any) => {
                flatRow[f.عنوان || f.کلید] = f.مقدار;
              });
            }
            return flatRow;
          });
        } else {
          arr = [parsed];
        }
      }
      
      if (arr.length === 0) {
        showNotification("آرایه تراکنش‌ها خالی است.", "error");
        return;
      }

      const worksheet = XLSX.utils.json_to_sheet(arr);
      
      // Estimate reasonable column widths
      const colWidths = Object.keys(arr[0] || {}).map(() => ({ wch: 18 }));
      worksheet["!cols"] = colWidths;
      
      // Set RTL direction
      if (!worksheet['!views']) worksheet['!views'] = [];
      worksheet['!views'].push({ rightToLeft: true });

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "تراکنش‌های اکسل");
      
      XLSX.writeFile(workbook, `Excel-Export-${activeFile?.name?.replace(/\.[^/.]+$/, "") || "Document"}.xlsx`);
      
      logEvent("دانلود اکسل از کدهای خام", "کاربر کدهای خام جی‌سان را مستقیماً به اکسل راست‌چین تبدیل و دانلود کرد.", "success");
      showNotification("فایل اکسل با موفقیت بارگیری شد.", "success");
    } catch (err: any) {
      showNotification("خطا در ساخت فایل اکسل. از صحت فرمت JSON مطمئن شوید.", "error");
    }
  };'''

new_handle_excel = '''  const handleDownloadExcelFromJSON = () => {
    try {
      if (!rawJsonText || !rawJsonText.trim()) {
        showNotification("هیچ کدی برای تولید فایل اکسل وجود ندارد.", "error");
        return;
      }
      const parsed = JSON.parse(rawJsonText);
      let arr: any[] = [];
      if (parsed && typeof parsed === "object") {
        if (Array.isArray(parsed)) {
          arr = parsed;
        } else if (parsed.ردیف_ها && Array.isArray(parsed.ردیف_ها)) {
          arr = parsed.ردیف_ها.map((row: any, idx: number) => {
            const flatRow: any = { "ردیف": idx + 1 };
            if (row.فیلد_ها && Array.isArray(row.فیلد_ها)) {
              row.فیلد_ها.forEach((f: any) => {
                flatRow[f.عنوان || f.کلید] = f.مقدار;
              });
            }
            return flatRow;
          });
        } else {
          arr = [parsed];
        }
      }
      
      if (arr.length === 0) {
        showNotification("آرایه تراکنش‌ها خالی است.", "error");
        return;
      }

      setExcelModalData(arr);
      setExcelModalFilename(`Excel-Export-${activeFile?.name?.replace(/\.[^/.]+$/, "") || "Document"}`);
      setIsExcelModalOpen(true);
      
      logEvent("باز کردن تنظیمات صادرات اکسل", "کاربر مودال تنظیمات اکسل را باز کرد.", "success");
    } catch (err: any) {
      showNotification("خطا در ساخت فایل اکسل. از صحت فرمت JSON مطمئن شوید.", "error");
    }
  };'''
content = content.replace(old_handle_excel, new_handle_excel)

open('src/App.tsx', 'w').write(content)
print("Added imports, states, and replaced first handleDownloadExcelFromJSON")
