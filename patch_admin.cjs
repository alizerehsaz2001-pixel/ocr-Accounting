const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf8');

const startStr = '{/* Admin Panel Modal */}';
const endStr = '{/* Token Management Panel Modal */}';

const startIdx = content.indexOf(startStr);
const endIdx = content.indexOf(endStr);

if (startIdx !== -1 && endIdx !== -1) {
    const original = content.substring(startIdx, endIdx);
    
    // We'll write the new UI code to replace it
    const newContent = `
      {/* Admin Panel Modal */}
      {isAdminPanelOpen && currentUser?.role === "admin" && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
          <div 
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => setIsAdminPanelOpen(false)}
          ></div>
          
          <div className={\`relative w-full max-w-5xl h-[85vh] md:h-[700px] rounded-3xl shadow-2xl flex overflow-hidden transform transition-all animate-in slide-in-from-bottom-8 duration-300 \${
            isDarkMode ? "bg-slate-900 border border-slate-800 text-slate-200" : "bg-slate-50 border border-slate-200 text-slate-800"
          }\`} dir="rtl">
            
            {/* Sidebar Navigation */}
            <div className={\`w-1/3 md:w-64 flex flex-col shrink-0 border-l \${isDarkMode ? "bg-slate-950/50 border-slate-800" : "bg-white border-slate-100"}\`}>
               <div className="p-6">
                 <h3 className="font-black text-lg flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-l from-purple-600 to-indigo-500">
                    <Shield className="w-6 h-6 text-purple-500" />
                    پنل مدیریت (Admin)
                 </h3>
                 <p className={\`text-[10px] mt-2 leading-relaxed \${isDarkMode ? "text-slate-500" : "text-slate-400"}\`}>
                   کنترل کاربران، پشتیبان‌گیری داده‌ها، پایش سیستم و مدیریت منابع
                 </p>
               </div>
               
               <div className="flex-1 overflow-y-auto py-2 px-4 flex flex-col gap-1.5 custom-scrollbar">
                 <button 
                   onClick={() => setAdminPanelTab("users")}
                   className={\`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-bold transition-all group \${
                     adminPanelTab === "users" 
                       ? (isDarkMode ? "bg-blue-600/10 text-blue-400 ring-1 ring-blue-500/30" : "bg-blue-50 text-blue-700 ring-1 ring-blue-200") 
                       : (isDarkMode ? "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800")
                   }\`}
                 >
                   <User className={\`w-4 h-4 transition-transform \${adminPanelTab === "users" ? "scale-110" : "group-hover:scale-110"}\`} />
                   مدیریت کاربران
                 </button>

                 <button 
                   onClick={() => setAdminPanelTab("data")}
                   className={\`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-bold transition-all group \${
                     adminPanelTab === "data" 
                       ? (isDarkMode ? "bg-emerald-600/10 text-emerald-400 ring-1 ring-emerald-500/30" : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200") 
                       : (isDarkMode ? "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800")
                   }\`}
                 >
                   <Download className={\`w-4 h-4 transition-transform \${adminPanelTab === "data" ? "scale-110" : "group-hover:scale-110"}\`} />
                   پشتیبان‌گیری و داده
                 </button>

                 <button 
                   onClick={() => setAdminPanelTab("system")}
                   className={\`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-bold transition-all group \${
                     adminPanelTab === "system" 
                       ? (isDarkMode ? "bg-purple-600/10 text-purple-400 ring-1 ring-purple-500/30" : "bg-purple-50 text-purple-700 ring-1 ring-purple-200") 
                       : (isDarkMode ? "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800")
                   }\`}
                 >
                   <Cpu className={\`w-4 h-4 transition-transform \${adminPanelTab === "system" ? "scale-110" : "group-hover:scale-110"}\`} />
                   وضعیت سیستم
                 </button>

                 <button 
                   onClick={() => setAdminPanelTab("danger")}
                   className={\`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-bold transition-all group \${
                     adminPanelTab === "danger" 
                       ? (isDarkMode ? "bg-rose-600/10 text-rose-400 ring-1 ring-rose-500/30" : "bg-rose-50 text-rose-700 ring-1 ring-rose-200") 
                       : (isDarkMode ? "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800")
                   }\`}
                 >
                   <Trash2 className={\`w-4 h-4 transition-transform \${adminPanelTab === "danger" ? "scale-110" : "group-hover:scale-110"}\`} />
                   عملیات خطرناک
                 </button>
               </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col relative overflow-hidden bg-transparent">
               <button 
                  onClick={() => setIsAdminPanelOpen(false)}
                  className={\`absolute top-5 left-5 p-2 rounded-full z-10 transition-colors \${
                    isDarkMode ? "bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-white" : "bg-slate-200 text-slate-500 hover:bg-slate-300 hover:text-slate-800"
                  }\`}
                >
                  <X className="h-4 w-4" />
               </button>

               <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
                 {/* Users Tab */}
                 {adminPanelTab === "users" && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
                      <div>
                        <h4 className="text-xl font-black mb-2">مدیریت کاربران سیستم</h4>
                        <p className={\`text-xs \${isDarkMode ? "text-slate-400" : "text-slate-500"}\`}>در این بخش می‌توانید دسترسی کاربران، میزان فضای اختصاصی، و وضعیت حساب‌ها را کنترل کنید.</p>
                      </div>

                      <div className={\`rounded-3xl border overflow-hidden \${isDarkMode ? "bg-slate-800/40 border-slate-700/60" : "bg-white border-slate-200/80 shadow-sm"}\`}>
                        <div className="overflow-x-auto">
                          <table className="w-full text-right text-[12px]">
                             <thead className={\`\${isDarkMode ? "bg-slate-900/80 text-slate-300" : "bg-slate-50 text-slate-600"}\`}>
                                <tr>
                                   <th className="p-4 font-black">نام کاربر</th>
                                   <th className="p-4 font-black text-center">نقش (Role)</th>
                                   <th className="p-4 font-black text-center">وضعیت حساب</th>
                                   <th className="p-4 font-black text-center">توکن مصرفی</th>
                                   <th className="p-4 font-black text-center">فضای اختصاصی</th>
                                   <th className="p-4 font-black text-center">عملیات</th>
                                </tr>
                             </thead>
                             <tbody className={\`divide-y \${isDarkMode ? "divide-slate-700/50" : "divide-slate-100"}\`}>
                                {users.map(u => (
                                   <tr key={u.id} className={\`transition-colors \${isDarkMode ? "hover:bg-slate-800/50" : "hover:bg-slate-50/80"}\`}>
                                      <td className="p-4">
                                        <div className="flex items-center gap-3">
                                          <div className={\`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white shadow-sm \${
                                            u.role === "admin" ? "bg-gradient-to-tr from-purple-500 to-fuchsia-600" : "bg-gradient-to-tr from-blue-500 to-indigo-600"
                                          }\`}>
                                            {u.name.charAt(0)}
                                          </div>
                                          <div>
                                            <div className="font-bold">{u.name}</div>
                                            <div className={\`text-[10px] font-mono mt-0.5 \${isDarkMode ? "text-slate-500" : "text-slate-400"}\`}>ID: {u.id.toString().padStart(5, '0')}</div>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="p-4 text-center">
                                         <span className={\`inline-flex px-3 py-1 rounded-lg text-[10px] font-black shadow-sm \${
                                            u.role === "admin" 
                                            ? "bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400" 
                                            : "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
                                         }\`}>{u.role === "admin" ? "مدیر کل" : "کاربر عادی"}</span>
                                      </td>
                                      <td className="p-4 text-center">
                                         <span className={\`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black shadow-sm \${
                                            u.status === "active" 
                                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" 
                                            : "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400"
                                         }\`}>
                                            {u.status === "active" ? (
                                              <><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>فعال</>
                                            ) : (
                                              <><div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>مسدود</>
                                            )}
                                         </span>
                                      </td>
                                      <td className="p-4 text-center font-mono font-bold text-[11px] text-orange-500">
                                        {u.apiUsage.toLocaleString("fa-IR")} <span className="text-[9px] text-slate-400">Tokens</span>
                                      </td>
                                      <td className="p-4 text-center">
                                         <div className="flex items-center justify-center gap-2">
                                            <span className="font-bold text-[11px] text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-1 rounded-lg shadow-sm border border-indigo-100 dark:border-indigo-500/20">
                                               {(5 + (u.extraStorage || 0)).toLocaleString("fa-IR")} GB
                                            </span>
                                            <button
                                              onClick={() => {
                                                const currentExtra = u.extraStorage || 0;
                                                const input = prompt(\`فضای اضافه تخصیص یافته به \${u.name} را وارد کنید (به گیگابایت):\`, currentExtra.toString());
                                                if (input !== null) {
                                                  const parsed = parseFloat(input);
                                                  if (!isNaN(parsed) && parsed >= 0) {
                                                    setUsers(prev => prev.map(usr => {
                                                      if (usr.id === u.id) {
                                                        return { ...usr, extraStorage: parsed };
                                                      }
                                                      return usr;
                                                    }));
                                                    logEvent("تخصیص فضا", \`مدیر فضا اضافه کاربر «\${u.name}» را به \${parsed} گیگابایت تغییر داد.\`);
                                                    showNotification(\`فضای اضافه کاربر «\${u.name}» با موفقیت به \${parsed} گیگابایت تغییر یافت.\`, "success");
                                                  } else {
                                                    showNotification("لطفاً یک عدد معتبر و بزرگتر یا مساوی صفر وارد کنید.", "error");
                                                  }
                                                }
                                              }}
                                              className="p-1.5 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-indigo-500 transition-colors shadow-sm"
                                              title="تخصیص فضای اختصاصی"
                                            >
                                               <HardDrive className="w-4 h-4" />
                                            </button>
                                         </div>
                                      </td>
                                      <td className="p-4 text-center">
                                         <button
                                             onClick={() => {
                                                setUsers(prev => prev.map(usr => usr.id === u.id ? {...usr, status: usr.status === "active" ? "suspended" : "active"} : usr));
                                                setNotification({text: \`وضعیت کاربر \${u.name} تغییر یافت.\`, type: 'success'});
                                             }}
                                             className={\`px-4 py-1.5 rounded-lg border text-[10px] font-black transition-colors shadow-sm \${
                                                u.status === "active"
                                                ? "border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-500/30 dark:hover:bg-rose-500/10"
                                                : "border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-500/30 dark:hover:bg-emerald-500/10"
                                             }\`}
                                         >
                                             {u.status === "active" ? "مسدود کن" : "فعال سازی"}
                                         </button>
                                      </td>
                                   </tr>
                                ))}
                             </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                 )}

                 {/* Data & Backup Tab */}
                 {adminPanelTab === "data" && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto">
                      <div>
                        <h4 className="text-xl font-black mb-2">مدیریت داده‌ها و پشتیبان‌گیری</h4>
                        <p className={\`text-xs \${isDarkMode ? "text-slate-400" : "text-slate-500"}\`}>تهیه نسخه پشتیبان امن از تمام تراکنش‌ها، اسناد و تاریخچه سیستم.</p>
                      </div>

                      <div className="grid grid-cols-1 gap-6">
                        {/* JSON Backup */}
                        <div className={\`p-6 rounded-3xl border flex flex-col sm:flex-row justify-between gap-6 \${
                          isDarkMode ? "bg-slate-800/40 border-slate-700/60" : "bg-white border-slate-200/80 shadow-sm"
                        }\`}>
                          <div className="flex flex-col flex-1">
                            <h5 className="font-black text-sm mb-1 flex items-center gap-2">
                              <Download className="w-4 h-4 text-blue-500" />
                              فایل پشتیبان کامل (JSON)
                            </h5>
                            <span className={\`text-[11px] leading-relaxed \${isDarkMode ? "text-slate-400" : "text-slate-500"}\`}>
                              این فایل شامل تمام تاریخچه پردازش‌ها، تراکنش‌ها، و سهمیه مصرفی مدل‌هاست که برای انتقال سیستم یا بازگردانی امن استفاده می‌شود.
                            </span>
                          </div>
                          <div className="flex flex-col gap-2 shrink-0 sm:w-48">
                            <button
                              onClick={() => {
                                const data = { transactions, previousScans, modelQuotas };
                                const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement("a");
                                a.href = url;
                                a.download = \`CPA-Backup-\${new Date().toISOString().split('T')[0]}.json\`;
                                a.click();
                                URL.revokeObjectURL(url);
                                setNotification({ text: "فایل پشتیبان با موفقیت دانلود شد.", type: "success" });
                              }}
                              className="w-full py-2.5 rounded-xl text-xs font-black bg-blue-600 hover:bg-blue-700 text-white shadow-md flex justify-center items-center gap-2 transition-all active:scale-95"
                            >
                              <Download className="w-4 h-4" />
                              دانلود پشتیبان
                            </button>
                            <button
                              onClick={() => {
                                const input = document.createElement("input");
                                input.type = "file";
                                input.accept = "application/json";
                                input.onchange = (e: any) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  const reader = new FileReader();
                                  reader.onload = (event) => {
                                    try {
                                      const data = JSON.parse(event.target?.result as string);
                                      if (data.transactions) setTransactions(data.transactions);
                                      if (data.previousScans) setPreviousScans(data.previousScans);
                                      if (data.modelQuotas) setModelQuotas(data.modelQuotas);
                                      setNotification({ text: "اطلاعات با موفقیت بازیابی شد.", type: "success" });
                                    } catch (err) {
                                      setNotification({ text: "فرمت فایل پشتیبان نامعتبر است.", type: "error" });
                                    }
                                  };
                                  reader.readAsText(file);
                                };
                                input.click();
                              }}
                              className={\`w-full py-2.5 rounded-xl text-xs font-black border flex justify-center items-center gap-2 transition-all active:scale-95 \${
                                isDarkMode ? "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700" : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                              }\`}
                            >
                              <Upload className="w-4 h-4" />
                              بازیابی (Import)
                            </button>
                          </div>
                        </div>

                        {/* Excel Export */}
                        <div className={\`p-6 rounded-3xl border flex flex-col sm:flex-row justify-between gap-6 \${
                          isDarkMode ? "bg-emerald-900/10 border-emerald-800/30" : "bg-emerald-50/50 border-emerald-200/50 shadow-sm"
                        }\`}>
                          <div className="flex flex-col flex-1">
                            <h5 className="font-black text-sm mb-1 flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                              <List className="w-4 h-4" />
                              خروجی مستقیم اکسل (XLSX)
                            </h5>
                            <span className={\`text-[11px] leading-relaxed \${isDarkMode ? "text-slate-400" : "text-slate-500"}\`}>
                              تولید یک فایل اکسل ساختاریافته از تمامی تراکنش‌های مالی موجود در سیستم با ستون‌بندی هوشمند.
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              let worksheetData;
                              let colWidths;
                              
                              if (activeFile?.columns && activeFile.columns.length > 0) {
                                 worksheetData = transactions.map((t, idx) => {
                                   const row: any = { "ردیف": idx + 1 };
                                   activeFile.columns!.forEach(col => {
                                     row[col.عنوان] = col.نوع_داده === 'number' && t[col.کلید] ? Number(t[col.کلید]) : t[col.کلید];
                                   });
                                   row["ضریب_اطمینان"] = t.ضریب_اطمینان || 100;
                                   return row;
                                 });
                                 colWidths = [{ wch: 5 }, ...activeFile.columns.map(() => ({ wch: 20 })), { wch: 10 }];
                              } else {
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
                              }

                              const worksheet = XLSX.utils.json_to_sheet(worksheetData);
                              worksheet["!cols"] = colWidths;
                              if (!worksheet['!views']) worksheet['!views'] = [];
                              worksheet['!views'].push({ rightToLeft: true });

                              const workbook = XLSX.utils.book_new();
                              XLSX.utils.book_append_sheet(workbook, worksheet, "تراکنش‌های مالی");
                              
                              XLSX.writeFile(workbook, \`Transactions-Export-\${new Date().toISOString().split('T')[0]}.xlsx\`);
                              setNotification({ text: "فایل اکسل با موفقیت دانلود شد.", type: "success" });
                            }}
                            className="w-full sm:w-48 py-2.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-md flex justify-center items-center gap-2 transition-all active:scale-95 shrink-0 self-center"
                          >
                            <Download className="w-4 h-4" />
                            تولید اکسل (Excel)
                          </button>
                        </div>

                        {/* Mock Data Seed */}
                        <div className={\`p-6 rounded-3xl border flex flex-col sm:flex-row justify-between gap-6 \${
                          isDarkMode ? "bg-slate-800/40 border-slate-700/60" : "bg-white border-slate-200/80 shadow-sm"
                        }\`}>
                          <div className="flex flex-col flex-1">
                            <h5 className="font-black text-sm mb-1 flex items-center gap-2">
                              <Database className="w-4 h-4 text-indigo-500" />
                              تزریق داده نمونه (Mock Seed)
                            </h5>
                            <span className={\`text-[11px] leading-relaxed \${isDarkMode ? "text-slate-400" : "text-slate-500"}\`}>
                              اضافه کردن چندین رکورد مالی فرضی برای تست و بررسی عملکرد داشبوردها و ماشین‌حساب‌های ترازنامه سیستم.
                            </span>
                          </div>
                          <button
                            onClick={() => {
                                const newMock = [
                                    {   
                                        id: "mock-" + Date.now() + 1,
                                        تاریخ: "۱۴۰۳/۰۲/۱۵",
                                        شماره_سند: "۱۰۵۵۰",
                                        نام_طرف_حساب: "شرکت تجهیزات شبکه مبین",
                                        شرح: "خرید سرورهای اچ‌پی جهت ارتقا زیرساخت مرکز داده",
                                        مبلغ_بدهکار: 580000000,
                                        مبلغ_بستانکار: 0,
                                        نوع_ارز: "ریال",
                                        توضیحات: "تسویه قطعی طی چک صیادی دو ماهه",
                                        ضریب_اطمینان: 92
                                    },
                                    {   
                                        id: "mock-" + Date.now() + 2,
                                        تاریخ: "۱۴۰۳/۰۲/۱۸",
                                        شماره_سند: "۱۰۵۵۱",
                                        نام_طرف_حساب: "حساب‌های دریافتنی / مشتریان خرد",
                                        شرح: "وصول مطالبات از صورتحساب فروش قطعات ماه قبل",
                                        مبلغ_بدهکار: 0,
                                        مبلغ_بستانکار: 125000000,
                                        نوع_ارز: "ریال",
                                        توضیحات: "واریز نقدی به حساب جاری بانک سامان",
                                        ضریب_اطمینان: 98
                                    },
                                    {   
                                        id: "mock-" + Date.now() + 3,
                                        تاریخ: "۱۴۰۳/۰۲/۲۰",
                                        شماره_سند: "۱۰۵۵۲",
                                        نام_طرف_حساب: "سازمان امور مالیاتی",
                                        شرح: "پرداخت علی‌الحساب مالیات بر ارزش افزوده دوره زمستان",
                                        مبلغ_بدهکار: 325000000,
                                        مبلغ_بستانکار: 0,
                                        نوع_ارز: "ریال",
                                        توضیحات: "دارای فیش واریزی شبا",
                                        ضریب_اطمینان: 100
                                    }
                                ];
                                setTransactions(prev => [...prev, ...newMock]);
                                setNotification({ text: "داده‌های نمونه با موفقیت افزوده شدند.", type: "success" });
                            }}
                            className={\`w-full sm:w-48 py-2.5 rounded-xl text-xs font-black border flex justify-center items-center gap-2 transition-all active:scale-95 shrink-0 self-center \${
                              isDarkMode ? "bg-indigo-900/30 border-indigo-500/30 text-indigo-400 hover:bg-indigo-900/50" : "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
                            }\`}
                          >
                            <Plus className="w-4 h-4" />
                            تزریق تراکنش‌ها
                          </button>
                        </div>
                      </div>
                    </div>
                 )}

                 {/* System Info Tab */}
                 {adminPanelTab === "system" && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto">
                      <div>
                        <h4 className="text-xl font-black mb-2">وضعیت و منابع سیستم</h4>
                        <p className={\`text-xs \${isDarkMode ? "text-slate-400" : "text-slate-500"}\`}>نمایش زنده آمار کلیدی دیتابیس، مصرف توکن‌ها و دسترسی سریع به پنل مدیریت منابع.</p>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className={\`p-6 rounded-3xl border flex flex-col items-center justify-center text-center gap-2 \${
                          isDarkMode ? "bg-blue-900/10 border-blue-500/20" : "bg-blue-50 border-blue-100 shadow-sm"
                        }\`}>
                          <div className={\`w-10 h-10 rounded-full flex items-center justify-center \${isDarkMode ? "bg-blue-500/20 text-blue-400" : "bg-blue-200 text-blue-700"}\`}>
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <div className={\`text-2xl font-black \${isDarkMode ? "text-blue-400" : "text-blue-700"}\`}>{previousScans.length}</div>
                            <div className={\`text-[10px] font-bold mt-1 \${isDarkMode ? "text-slate-400" : "text-blue-600/70"}\`}>اسناد پردازش شده</div>
                          </div>
                        </div>

                        <div className={\`p-6 rounded-3xl border flex flex-col items-center justify-center text-center gap-2 \${
                          isDarkMode ? "bg-emerald-900/10 border-emerald-500/20" : "bg-emerald-50 border-emerald-100 shadow-sm"
                        }\`}>
                          <div className={\`w-10 h-10 rounded-full flex items-center justify-center \${isDarkMode ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-200 text-emerald-700"}\`}>
                            <List className="w-5 h-5" />
                          </div>
                          <div>
                            <div className={\`text-2xl font-black \${isDarkMode ? "text-emerald-400" : "text-emerald-700"}\`}>{transactions.length}</div>
                            <div className={\`text-[10px] font-bold mt-1 \${isDarkMode ? "text-slate-400" : "text-emerald-600/70"}\`}>تراکنش‌های موفق</div>
                          </div>
                        </div>

                        <div className={\`p-6 rounded-3xl border flex flex-col items-center justify-center text-center gap-2 \${
                          isDarkMode ? "bg-purple-900/10 border-purple-500/20" : "bg-purple-50 border-purple-100 shadow-sm"
                        }\`}>
                          <div className={\`w-10 h-10 rounded-full flex items-center justify-center \${isDarkMode ? "bg-purple-500/20 text-purple-400" : "bg-purple-200 text-purple-700"}\`}>
                            <Database className="w-5 h-5" />
                          </div>
                          <div>
                            {(() => {
                               let totalStorage = 0;
                               for (let i = 0; i < localStorage.length; i++) {
                                 const key = localStorage.key(i);
                                 if (key) totalStorage += localStorage.getItem(key)?.length || 0;
                               }
                               const kb = (totalStorage / 1024).toFixed(1);
                               return <div className={\`text-2xl font-black font-mono \${isDarkMode ? "text-purple-400" : "text-purple-700"}\`}>{kb}</div>;
                            })()}
                            <div className={\`text-[10px] font-bold mt-1 \${isDarkMode ? "text-slate-400" : "text-purple-600/70"}\`}>حجم محلی (KB)</div>
                          </div>
                        </div>

                        <div className={\`p-6 rounded-3xl border flex flex-col items-center justify-center text-center gap-2 \${
                          isDarkMode ? "bg-orange-900/10 border-orange-500/20" : "bg-orange-50 border-orange-100 shadow-sm"
                        }\`}>
                          <div className={\`w-10 h-10 rounded-full flex items-center justify-center \${isDarkMode ? "bg-orange-500/20 text-orange-400" : "bg-orange-200 text-orange-700"}\`}>
                            <Coins className="w-5 h-5" />
                          </div>
                          <div>
                            {(() => {
                               let totalTokens = 0;
                               Object.values(modelQuotas).forEach((q: any) => totalTokens += q.used);
                               return <div className={\`text-2xl font-black font-mono \${isDarkMode ? "text-orange-400" : "text-orange-700"}\`}>{totalTokens}</div>;
                            })()}
                            <div className={\`text-[10px] font-bold mt-1 \${isDarkMode ? "text-slate-400" : "text-orange-600/70"}\`}>کل توکن‌های مصرفی</div>
                          </div>
                        </div>
                      </div>

                      {/* Token Manager Link */}
                      <div className={\`p-8 rounded-3xl border flex flex-col sm:flex-row items-center justify-between gap-6 mt-8 \${
                        isDarkMode ? "bg-slate-800/40 border-slate-700/60" : "bg-white border-slate-200/80 shadow-sm"
                      }\`}>
                        <div className="flex flex-col flex-1">
                          <h5 className="font-black text-base mb-1 flex items-center gap-2">
                            مدیریت پیشرفته منابع و توکن‌ها
                          </h5>
                          <span className={\`text-xs leading-relaxed \${isDarkMode ? "text-slate-400" : "text-slate-500"}\`}>
                            ورود به پنل تخصصی توکن‌ها برای مشاهده نمودارهای مصرف، تخصیص بودجه و اعمال محدودیت‌های هوش مصنوعی.
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setIsAdminPanelOpen(false);
                            setIsTokenManagerOpen(true);
                            logEvent("پنل مدیریت توکن", "مدیر سیستم وارد پنل مدیریت پیشرفته توکن‌ها شد.");
                          }}
                          className={\`w-full sm:w-auto px-8 py-3.5 rounded-2xl text-xs font-black shadow-[0_4px_14px_0_rgba(168,85,247,0.39)] hover:shadow-[0_6px_20px_rgba(168,85,247,0.23)] flex justify-center items-center gap-2 transition-all active:scale-95 shrink-0 \${
                            isDarkMode ? "bg-purple-600 hover:bg-purple-500 text-white" : "bg-purple-600 hover:bg-purple-700 text-white"
                          }\`}
                        >
                          <Settings className="w-4 h-4" />
                          ورود به Token Manager
                        </button>
                      </div>

                    </div>
                 )}

                 {/* Danger Zone Tab */}
                 {adminPanelTab === "danger" && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto">
                      <div>
                        <h4 className="text-xl font-black mb-2 text-rose-500">عملیات خطرناک (Danger Zone)</h4>
                        <p className={\`text-xs \${isDarkMode ? "text-slate-400" : "text-slate-500"}\`}>اقدامات این بخش غیرقابل بازگشت هستند. پیش از تایید، اطمینان حاصل کنید.</p>
                      </div>

                      <div className="grid grid-cols-1 gap-6">
                        
                        <div className={\`p-6 rounded-3xl border border-rose-200 dark:border-rose-900/50 flex flex-col sm:flex-row justify-between gap-6 \${
                          isDarkMode ? "bg-rose-950/20" : "bg-rose-50/50"
                        }\`}>
                          <div className="flex flex-col flex-1">
                            <h5 className="font-black text-sm mb-1 text-rose-600 dark:text-rose-400">پاکسازی مخزن تراکنش‌ها</h5>
                            <span className={\`text-[11px] leading-relaxed \${isDarkMode ? "text-rose-300/70" : "text-rose-800/70"}\`}>
                              حذف تمامی ردیف‌های مالی استخراج شده. اسناد پردازش شده در تاریخچه باقی می‌مانند.
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              if (confirm("آیا از حذف تمام تراکنش‌ها مطمئن هستید؟")) {
                                setTransactions([]);
                                setActiveFile(null);
                                setRawJsonText("");
                                setNotification({ text: "جدول تراکنش‌های سیستم پاکسازی شد.", type: "success" });
                              }
                            }}
                            className={\`w-full sm:w-40 py-2.5 rounded-xl text-xs font-black border flex justify-center items-center gap-2 transition-all active:scale-95 shrink-0 self-center \${
                              isDarkMode ? "bg-rose-900/40 border-rose-700/50 text-rose-400 hover:bg-rose-900/60" : "bg-white border-rose-200 text-rose-600 hover:bg-rose-100"
                            }\`}
                          >
                            <Trash2 className="w-4 h-4" />
                            حذف تراکنش‌ها
                          </button>
                        </div>

                        <div className={\`p-6 rounded-3xl border border-rose-200 dark:border-rose-900/50 flex flex-col sm:flex-row justify-between gap-6 \${
                          isDarkMode ? "bg-rose-950/20" : "bg-rose-50/50"
                        }\`}>
                          <div className="flex flex-col flex-1">
                            <h5 className="font-black text-sm mb-1 text-rose-600 dark:text-rose-400">پاکسازی تاریخچه اسناد</h5>
                            <span className={\`text-[11px] leading-relaxed \${isDarkMode ? "text-rose-300/70" : "text-rose-800/70"}\`}>
                              حذف کامل تصاویر، متون اولیه و متادیتای تمام اسناد اسکن شده قبلی.
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              if (confirm("آیا از حذف تاریخچه اسناد مطمئن هستید؟")) {
                                setPreviousScans([]);
                                setNotification({ text: "تاریخچه اسناد با موفقیت حذف گردید.", type: "success" });
                              }
                            }}
                            className={\`w-full sm:w-40 py-2.5 rounded-xl text-xs font-black border flex justify-center items-center gap-2 transition-all active:scale-95 shrink-0 self-center \${
                              isDarkMode ? "bg-rose-900/40 border-rose-700/50 text-rose-400 hover:bg-rose-900/60" : "bg-white border-rose-200 text-rose-600 hover:bg-rose-100"
                            }\`}
                          >
                            <Trash2 className="w-4 h-4" />
                            حذف تاریخچه
                          </button>
                        </div>

                        <div className={\`p-6 rounded-3xl border border-red-500/30 flex flex-col gap-4 \${
                          isDarkMode ? "bg-red-950/40" : "bg-red-50"
                        }\`}>
                          <div className="flex flex-col">
                            <h5 className="font-black text-sm mb-1 text-red-600 dark:text-red-400">بازنشانی کامل سیستم (Hard Reset)</h5>
                            <span className={\`text-[11px] leading-relaxed \${isDarkMode ? "text-red-300/70" : "text-red-800/70"}\`}>
                              این عملیات تمام داده‌های ذخیره شده در مرورگر را به طور کامل پاک کرده و برنامه را مجددا بارگیری می‌کند.
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              if (confirm("هشدار! آیا از پاکسازی کامل سیستم و ریست آن مطمئن هستید؟ تمام داده‌ها نابود خواهند شد.")) {
                                window.localStorage.clear();
                                window.location.reload();
                              }
                            }}
                            className="w-full py-3 rounded-xl text-xs font-black bg-red-600 hover:bg-red-700 text-white shadow-md flex justify-center items-center gap-2 transition-all active:scale-95"
                          >
                            <AlertTriangle className="w-4 h-4" />
                            پاکسازی کامل (رادیواکتیو)
                          </button>
                        </div>

                      </div>
                    </div>
                 )}

               </div>
            </div>
          </div>
        </div>
      )}
      `;

    const updated = content.substring(0, startIdx) + newContent + content.substring(endIdx);
    fs.writeFileSync('src/App.tsx', updated);
    console.log('App.tsx updated successfully.');
} else {
    console.log('Could not find block boundaries.');
}
