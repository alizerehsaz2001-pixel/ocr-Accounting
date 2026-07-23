import re

content = open('src/App.tsx').read()

# Modify standard Excel export
old_standard_export = '''                              const worksheet = XLSX.utils.json_to_sheet(worksheetData);
                              worksheet["!cols"] = colWidths;
                              if (!worksheet['!views']) worksheet['!views'] = [];
                              worksheet['!views'].push({ rightToLeft: true });

                              const workbook = XLSX.utils.book_new();
                              XLSX.utils.book_append_sheet(workbook, worksheet, "تراکنش‌های مالی");
                              
                              XLSX.writeFile(workbook, `Transactions-Export-${new Date().toISOString().split('T')[0]}.xlsx`);
                              setNotification({ text: "فایل اکسل با موفقیت دانلود شد.", type: "success" });'''

new_standard_export = '''                              setExcelModalData(worksheetData);
                              setExcelModalFilename(`Transactions-Export`);
                              setIsExcelModalOpen(true);'''
content = content.replace(old_standard_export, new_standard_export)

# Modify bulk export
old_bulk_export = '''                                  colWidths = [{ wch: 25 }, { wch: 5 }, { wch: 12 }, { wch: 10 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 40 }];
                                  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
                                  worksheet["!cols"] = colWidths;
                                  if (!worksheet["!views"]) worksheet["!views"] = [];
                                  worksheet["!views"].push({ rightToLeft: true });
                                  const workbook = XLSX.utils.book_new();
                                  XLSX.utils.book_append_sheet(workbook, worksheet, "تراکنش‌های منتخب");
                                  XLSX.writeFile(workbook, `Selected-Export-${new Date().toISOString().split("T")[0]}.xlsx`);
                                  setNotification({ text: "فایل اکسل اسناد منتخب با موفقیت دانلود شد.", type: "success" });'''

new_bulk_export = '''                                  setExcelModalData(worksheetData);
                                  setExcelModalFilename(`Selected-Export`);
                                  setIsExcelModalOpen(true);'''
content = content.replace(old_bulk_export, new_bulk_export)

open('src/App.tsx', 'w').write(content)
print("Updated other export logic")
