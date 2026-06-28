import React, { useState } from "react";
import { CreditCard, Landmark, Coins, ChevronLeft, Info, BookOpen } from "lucide-react";
import ChequeManagement from "./ChequeManagement";
import BankOperations from "./BankOperations";
import PettyCashManagement from "./PettyCashManagement";

interface TreasuryModuleProps {
  isDarkMode: boolean;
  showNotification: (text: string, type?: "success" | "error" | "info") => void;
}

export default function TreasuryModule({ isDarkMode, showNotification }: TreasuryModuleProps) {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [showFriendlyGuide, setShowFriendlyGuide] = useState(true);

  if (activeSection === "cheques") {
    return <ChequeManagement isDarkMode={isDarkMode} onBack={() => setActiveSection(null)} showNotification={showNotification} />;
  }

  if (activeSection === "banking") {
    return <BankOperations isDarkMode={isDarkMode} onBack={() => setActiveSection(null)} showNotification={showNotification} />;
  }

  if (activeSection === "cash-drawer") {
    return <PettyCashManagement isDarkMode={isDarkMode} onBack={() => setActiveSection(null)} showNotification={showNotification} />;
  }

  const sections = [
    {
      id: "cheques",
      title: "مدیریت چکها",
      desc: "ثبت چکهای دریافتی و پرداختی، هشدار سررسید چک، راسگیری و پیگیری وضعیت چک (وصول، برگشتی، در جریان وصول).",
      icon: CreditCard,
      badge: "طراحی کلی",
      accent: "text-blue-500 dark:text-blue-400 bg-blue-500/10",
    },
    {
      id: "banking",
      title: "عملیات بانکی",
      desc: "مغایرتگیری بانکی هوشمند، مدیریت حوالهها و ضمانتنامههای بانکی.",
      icon: Landmark,
      badge: "طراحی کلی",
      accent: "text-purple-500 dark:text-purple-400 bg-purple-500/10",
    },
    {
      id: "cash-drawer",
      title: "صندوق و تنخواهگردان",
      desc: "مدیریت وجوه نقد خرد و تسویه تنخواه.",
      icon: Coins,
      badge: "طراحی کلی",
      accent: "text-emerald-500 dark:text-emerald-400 bg-emerald-500/10",
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col max-w-5xl mx-auto w-full" dir="rtl">
      {/* Intro Header */}
      <div className="mb-6 text-right animate-fade-in flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className={`text-base font-black tracking-tight ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>
              ماژول خزانه‌داری (دریافت و پرداخت)
            </h2>
            <button
              onClick={() => setShowFriendlyGuide(!showFriendlyGuide)}
              className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 flex items-center gap-1 hover:bg-indigo-500/20 transition-all"
            >
              <Info className="w-3.5 h-3.5" />
              {showFriendlyGuide ? "پنهان‌سازی آموزش ساده" : "آموزش ساده به زبان خودمانی"}
            </button>
          </div>
          <p className={`text-xs mt-1.5 ${isDarkMode ? "text-slate-400" : "text-slate-600"} max-w-2xl leading-relaxed`}>
            برای مدیریت جریان وجوه نقد و کنترل حسابهای بانکی و صندوقها استفاده میشود.
          </p>
        </div>
      </div>

      {/* Friendly Guide Block */}
      {showFriendlyGuide && (
        <div className={`p-5 rounded-2xl border mb-6 transition-all ${
          isDarkMode ? "bg-indigo-950/15 border-indigo-900/40 text-slate-200" : "bg-indigo-50/40 border-indigo-100 text-slate-800"
        }`}>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 shrink-0 mt-0.5">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-sm text-indigo-600 dark:text-indigo-400 mb-2 flex items-center gap-1.5">
                راهنمای خودمونی: «خزانه‌داری» به زبان خیلی ساده چیست؟
              </h3>
              <p className="text-xs leading-relaxed opacity-90 mb-4">
                اگر حسابداری مالی کمد پرونده‌های شما باشد، <strong>خزانه‌داری گاوصندوق و کارت‌خوان‌های شماست</strong>. تمام پول‌های نقد، بانک‌ها، تنخواه‌گردان مغازه و چک‌هایی که دست شماست یا به دیگران داده‌اید در این بخش مدیریت می‌شوند تا حتی یک ریال هم گم نشود.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                <div className={`p-3.5 rounded-xl border ${isDarkMode ? "bg-slate-950/40 border-slate-850" : "bg-white border-slate-100"}`}>
                  <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 mb-2">۱. مدیریت چک‌ها</span>
                  <p className="text-[11px] leading-relaxed opacity-85">
                    برگه چک مثل پول نقدِ فرداست. اینجا تاریخ سررسید آن‌ها را ثبت می‌کنیم تا موعدشان را فراموش نکنیم و وضعیت وصول یا برگشت خوردنشان را رصد کنیم.
                  </p>
                </div>

                <div className={`p-3.5 rounded-xl border ${isDarkMode ? "bg-slate-950/40 border-slate-850" : "bg-white border-slate-100"}`}>
                  <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-500 mb-2">۲. عملیات بانکی</span>
                  <p className="text-[11px] leading-relaxed opacity-85">
                    تطبیق دادن مانده حساب بانکی شما با دفاتر شرکت تا مطمئن شویم هیچ تراکنش اشتباه یا ثبت نشده‌ای در بانک وجود ندارد (مغایرت‌گیری).
                  </p>
                </div>

                <div className={`p-3.5 rounded-xl border ${isDarkMode ? "bg-slate-950/40 border-slate-850" : "bg-white border-slate-100"}`}>
                  <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 mb-2">۳. صندوق و تنخواه</span>
                  <p className="text-[11px] leading-relaxed opacity-85">
                    ثبت و کنترل مخارج کوچک روزمره (مثل خرید قند و چای یا هزینه پست) که به عنوان تنخواه در اختیار یکی از همکاران قرار می‌گیرد.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grid Layout of exactly the 3 sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {sections.map((sec) => {
          const Icon = sec.icon;
          return (
            <div
              key={sec.id}
              onClick={() => {
                if (sec.id === "cheques") {
                   setActiveSection("cheques");
                } else if (sec.id === "banking") {
                   setActiveSection("banking");
                } else if (sec.id === "cash-drawer") {
                   setActiveSection("cash-drawer");
                } else {
                   showNotification(`بخش «${sec.title}» ایجاد شد. در گام‌های بعدی ویژگی‌های مورد نظر شما به این بخش اضافه خواهد شد.`, "info");
                }
              }}
              className={`group relative rounded-2xl border p-5 transition-all duration-300 flex flex-col justify-between hover:-translate-y-1 hover:shadow-xl cursor-pointer ${
                isDarkMode 
                  ? "bg-slate-900/40 border-slate-800 hover:border-slate-750 hover:bg-slate-900/70" 
                  : "bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50 shadow-sm"
              }`}
            >
              {/* Top Row with icon & status */}
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${sec.accent}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                  isDarkMode ? "bg-indigo-950/40 text-indigo-300 border border-indigo-900/30" : "bg-indigo-50 text-indigo-700 border border-indigo-100"
                }`}>
                  {sec.badge}
                </span>
              </div>

              {/* Title & Description */}
              <div className="text-right flex-1 mb-6">
                <h3 className={`text-xs font-black mb-2 ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>
                  {sec.title}
                </h3>
                <p className={`text-[11px] leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                  {sec.desc}
                </p>
              </div>

              {/* Action trigger footer */}
              <div className="border-t pt-3 flex items-center justify-between text-[10px] font-bold text-indigo-500 dark:text-indigo-400 border-dashed border-slate-200 dark:border-slate-800">
                <span>ورود به ماژول</span>
                <ChevronLeft className="w-3.5 h-3.5 transition-transform duration-300 group-hover:-translate-x-1" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Mini Help Section */}
      <div className={`mt-10 p-5 rounded-2xl border ${
        isDarkMode ? "bg-slate-950/20 border-slate-900" : "bg-slate-50 border-slate-100"
      }`}>
        <div className="flex items-start gap-3">
          <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 animate-pulse shrink-0"></div>
          <div className="text-right">
            <h4 className={`text-xs font-bold mb-1.5 ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>
              توضیح برای کاربر گرامی:
            </h4>
            <p className={`text-[11px] leading-relaxed ${isDarkMode ? "text-slate-500" : "text-slate-500"}`}>
              بخش خزانه‌داری بر اساس سه محور اساسی ارائه‌شده توسط شما با موفقیت به منوی سیستم متصل شد. در صورت تمایل، هر زمان که بفرمایید فرم‌ها یا جداول ثبت اطلاعات و رویدادهای مالی برای هر کدام طراحی خواهد شد.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
