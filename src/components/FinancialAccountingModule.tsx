import React, { useState } from "react";
import { FolderTree, FilePlus, Columns, ChevronLeft } from "lucide-react";
import ChartOfAccounts from "./ChartOfAccounts";
import VoucherModule from "./VoucherModule";
import FinancialReportsModule from "./FinancialReportsModule";

interface FinancialAccountingModuleProps {
  isDarkMode: boolean;
  showNotification: (text: string, type?: "success" | "error" | "info") => void;
}

export default function FinancialAccountingModule({ isDarkMode, showNotification }: FinancialAccountingModuleProps) {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const sections = [
    {
      id: "coding",
      title: "کدینگ حساب‌ها",
      desc: "امکان تعریف حساب‌ها در سطوح مختلف (گروه، کل، معین و تفصیلی‌های چندسطحی).",
      icon: FolderTree,
      badge: "فعال",
      accent: "text-blue-500 dark:text-blue-400 bg-blue-500/10",
    },
    {
      id: "voucher",
      title: "صدور سند حسابداری",
      desc: "ثبت اسناد به صورت دستی و اتوماتیک، تایید و قطعی کردن آن‌ها.",
      icon: FilePlus,
      badge: "فعال",
      accent: "text-purple-500 dark:text-purple-400 bg-purple-500/10",
    },
    {
      id: "reports",
      title: "ترازنامه‌ها و دفاتر",
      desc: "تهیه تراز آزمایشی (دو، چهار، شش و هشت ستونی) و چاپ دفاتر قانونی (روزنامه و کل).",
      icon: Columns,
      badge: "فعال",
      accent: "text-emerald-500 dark:text-emerald-400 bg-emerald-500/10",
    },
  ];

  if (activeSection === "coding") {
    return <ChartOfAccounts isDarkMode={isDarkMode} showNotification={showNotification} onBack={() => setActiveSection(null)} />;
  }

  if (activeSection === "voucher") {
    return <VoucherModule isDarkMode={isDarkMode} showNotification={showNotification} onBack={() => setActiveSection(null)} />;
  }
  
  if (activeSection === "reports") {
    return <FinancialReportsModule isDarkMode={isDarkMode} showNotification={showNotification} onBack={() => setActiveSection(null)} />;
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col max-w-5xl mx-auto w-full" dir="rtl">
      {/* Intro Header */}
      <div className="mb-8 text-right animate-fade-in">
        <h2 className={`text-base font-black tracking-tight mb-2 ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>
          ماژول حسابداری مالی و دفتر کل (هسته مرکزی)
        </h2>
        <p className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-600"} max-w-2xl leading-relaxed`}>
          مدیریت یکپارچه حسابداری مالی، کدینگ حساب‌ها، صدور اسناد حسابداری و تولید ترازنامه‌ها و دفاتر قانونی.
        </p>
      </div>

      {/* Grid Layout of exactly the 3 sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {sections.map((sec) => {
          const Icon = sec.icon;
          return (
            <div
              key={sec.id}
              onClick={() => {
                if (sec.id === "coding" || sec.id === "voucher" || sec.id === "reports") {
                  setActiveSection(sec.id);
                } else {
                  showNotification(`بخش «${sec.title}» ایجاد شد. در فاز بعدی قابلیت‌های مورد نظر شما اضافه خواهد شد.`, "info");
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
                <span>{sec.id === "coding" || sec.id === "voucher" || sec.id === "reports" ? "ورود به بخش" : "منتظر دستور توسعه و ویژگی‌ها"}</span>
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
              راهنما:
            </h4>
            <p className={`text-[11px] leading-relaxed ${isDarkMode ? "text-slate-500" : "text-slate-500"}`}>
              این سه بخش با نام‌های دقیق و بر اساس اولویت حسابداری مالی شما آماده شده‌اند. در صورت تمایل، هر زمان که بفرمایید جزئیات یا فرم‌های اختصاصی به هر قسمت اضافه خواهد شد.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
