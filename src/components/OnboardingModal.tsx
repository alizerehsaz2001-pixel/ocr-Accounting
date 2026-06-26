import React, { useState } from "react";
import { Upload, Cpu, Edit3, Settings, ShieldCheck, Check, MousePointerClick, FileJson, FileSpreadsheet, Mic, Database } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
}

export default function OnboardingModal({ isOpen, onClose, isDarkMode }: OnboardingModalProps) {
  const [step, setStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      title: "به ocr Accounting خوش آمدید",
      description: "سیستم هوشمند پردازش و استخراج خودکار اسناد حسابداری، فاکتورها و لیست‌های مالی.",
      icon: <ShieldCheck className="h-10 w-10 text-blue-500" />,
      features: [
        "استخراج دقیق مبالغ، تاریخ و شرح تراکنش",
        "تشخیص فایل‌های چندصفحه‌ای مالی",
        "تطبیق و موازنه هوشمند (محاسبه بدهکار/بستانکار)"
      ]
    },
    {
      title: "حسابداری مالی و دفتر کل (هسته مرکزی)",
      description: "این بخش پایه و اساس نرم‌افزار است و تمامی اسناد در نهایت به اینجا ختم می‌شوند.",
      icon: <Database className="h-10 w-10 text-indigo-500" />,
      features: [
        "کدینگ حساب‌ها: امکان تعریف حساب‌ها در سطوح مختلف (گروه، کل، معین و تفصیلی‌های چند سطحی).",
        "صدور سند حسابداری: ثبت اسناد به صورت دستی و اتوماتیک، تایید و قطعی کردن آنها.",
        "ترازنامه‌ها و دفاتر: تهیه تراز آزمایشی (دو، چهار، شش و هشت ستونی) و چاپ دفاتر قانونی (روزنامه و کل)."
      ]
    },
    {
      title: "آپلود و پردازش تصویر",
      description: "تصویر یا PDF فاکتور خود را بارگذاری کنید. هوش مصنوعی ما به طور خودکار داده‌ها را استخراج می‌کند.",
      icon: <Upload className="h-10 w-10 text-emerald-500" />,
      features: [
        "پشتیبانی از عکس دوربین گوشی یا وب‌کم",
        "تبدیل یکپارچه به داده‌های ساختار یافته JSON",
        "صرفه‌جویی در زمان و جلوگیری از خطای انسانی"
      ]
    },
    {
      title: "بررسی، ویرایش و یادداشت صوتی",
      description: "پیش از صدور نهایی، مبالغ را بازبینی کنید.",
      icon: <Edit3 className="h-10 w-10 text-rose-500" />,
      features: [
        "امکان افزودن یادداشت شفاهی/صوتی حسابدار به هر سند",
        "ویرایش درون برنامه‌ای جداول (ردیف‌های تراکنش)",
        "خروجی مستقیم به Excel یا فرمت JSON برای ERP"
      ]
    }
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className={`relative w-full max-w-xl mx-auto rounded-2xl shadow-2xl overflow-hidden ${
            isDarkMode ? "bg-[#1E293B] border border-slate-700" : "bg-white border border-slate-200"
          }`}
          dir="rtl"
        >
          {/* Header */}
          <div className={`px-6 py-8 text-center border-b ${isDarkMode ? "border-slate-800 bg-slate-900/50" : "border-slate-100 bg-slate-50/50"}`}>
            <div className="mx-auto bg-white/10 w-20 h-20 rounded-full flex items-center justify-center mb-4 shadow-sm border border-slate-200 dark:border-slate-700">
              {steps[step].icon}
            </div>
            <h2 className={`text-2xl font-black mb-2 ${isDarkMode ? "text-slate-100" : "text-slate-800"}`}>
              {steps[step].title}
            </h2>
            <p className={`text-sm max-w-md mx-auto ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
              {steps[step].description}
            </p>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="space-y-4">
              {steps[step].features.map((feature, idx) => (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  key={idx} 
                  className={`flex items-start gap-3 p-3 rounded-xl border ${
                    isDarkMode ? "bg-slate-800/50 border-slate-700/50" : "bg-slate-50 border-slate-100"
                  }`}
                >
                  <div className={`mt-0.5 rounded-full p-1 ${
                    isDarkMode ? "bg-blue-500/20 text-blue-400" : "bg-blue-100 text-blue-600"
                  }`}>
                    <Check className="w-4 h-4" />
                  </div>
                  <span className={`text-sm font-medium ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                    {feature}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Footer controls */}
          <div className={`px-6 py-4 flex items-center justify-between border-t ${
            isDarkMode ? "border-slate-800 bg-slate-900" : "border-slate-100 bg-slate-50"
          }`}>
            <div className="flex gap-2">
              {steps.map((_, i) => (
                <div 
                  key={i} 
                  className={`w-2 h-2 rounded-full transition-all ${
                    step === i 
                      ? "w-6 bg-blue-500" 
                      : isDarkMode ? "bg-slate-700" : "bg-slate-300"
                  }`}
                />
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className={`px-4 py-2 text-sm font-bold rounded-xl transition-colors ${
                  isDarkMode 
                    ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800" 
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-200"
                }`}
              >
                رد کردن
              </button>
              
              <button
                onClick={() => {
                  if (step < steps.length - 1) {
                    setStep(step + 1);
                  } else {
                    onClose();
                  }
                }}
                className="px-6 py-2 text-sm font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
              >
                {step < steps.length - 1 ? "مرحله بعد" : "شروع کار با سیستم"}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
