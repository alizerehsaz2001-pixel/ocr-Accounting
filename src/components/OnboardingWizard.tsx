import React, { useState, useEffect } from 'react';
import { Camera, FileText, Cpu, Calculator, CheckCircle2, ChevronLeft, ChevronRight, X, LayoutDashboard, BrainCircuit, TableProperties, Download } from 'lucide-react';

interface OnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
}

export default function OnboardingWizard({ isOpen, onClose, isDarkMode }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const colorClasses = {
    blue: {
      text: isDarkMode ? "text-blue-400" : "text-blue-600",
      bgLight: isDarkMode ? "bg-blue-500/10" : "bg-blue-50",
      bgSolid: isDarkMode ? "bg-blue-600" : "bg-blue-600",
      bgHover: isDarkMode ? "hover:bg-blue-500" : "hover:bg-blue-700",
      shadow: isDarkMode ? "shadow-blue-900/50" : "shadow-blue-500/30",
    },
    purple: {
      text: isDarkMode ? "text-purple-400" : "text-purple-600",
      bgLight: isDarkMode ? "bg-purple-500/10" : "bg-purple-50",
      bgSolid: isDarkMode ? "bg-purple-600" : "bg-purple-600",
      bgHover: isDarkMode ? "hover:bg-purple-500" : "hover:bg-purple-700",
      shadow: isDarkMode ? "shadow-purple-900/50" : "shadow-purple-500/30",
    },
    indigo: {
      text: isDarkMode ? "text-indigo-400" : "text-indigo-600",
      bgLight: isDarkMode ? "bg-indigo-500/10" : "bg-indigo-50",
      bgSolid: isDarkMode ? "bg-indigo-600" : "bg-indigo-600",
      bgHover: isDarkMode ? "hover:bg-indigo-500" : "hover:bg-indigo-700",
      shadow: isDarkMode ? "shadow-indigo-900/50" : "shadow-indigo-500/30",
    },
    emerald: {
      text: isDarkMode ? "text-emerald-400" : "text-emerald-600",
      bgLight: isDarkMode ? "bg-emerald-500/10" : "bg-emerald-50",
      bgSolid: isDarkMode ? "bg-emerald-600" : "bg-emerald-600",
      bgHover: isDarkMode ? "hover:bg-emerald-500" : "hover:bg-emerald-700",
      shadow: isDarkMode ? "shadow-emerald-900/50" : "shadow-emerald-500/30",
    },
    orange: {
      text: isDarkMode ? "text-orange-400" : "text-orange-600",
      bgLight: isDarkMode ? "bg-orange-500/10" : "bg-orange-50",
      bgSolid: isDarkMode ? "bg-orange-600" : "bg-orange-600",
      bgHover: isDarkMode ? "hover:bg-orange-500" : "hover:bg-orange-700",
      shadow: isDarkMode ? "shadow-orange-900/50" : "shadow-orange-500/30",
    }
  };

  const steps = [
    {
      title: "به سیستم حسابداری هوشمند خوش آمدید",
      subtitle: "معرفی پلتفرم",
      icon: <BrainCircuit className={`w-12 h-12 ${colorClasses.blue.text}`} />,
      description: "این سیستم با استفاده از هوش مصنوعی (Gemini) به شما کمک می‌کند تا اسناد مالی، فاکتورها، و رسیدهای خود را در کسری از ثانیه پردازش کرده و به داده‌های حسابداری استاندارد تبدیل کنید.",
      color: "blue" as const,
      features: [
        "تشخیص هوشمند فاکتورهای دست‌نویس و چاپی",
        "استخراج خودکار مبالغ، تاریخ‌ها و طرف حساب",
        "موازنه دقیق حساب‌های بدهکار و بستانکار"
      ]
    },
    {
      title: "۱. ورود اطلاعات و اسکن",
      subtitle: "بارگذاری اسناد",
      icon: <Camera className={`w-12 h-12 ${colorClasses.purple.text}`} />,
      description: "برای شروع، می‌توانید فایل‌های تصویری یا PDF خود را بارگذاری کنید. همچنین امکان استفاده مستقیم از دوربین برای اسکن فاکتورها وجود دارد.",
      color: "purple" as const,
      features: [
        "پشتیبانی از فرمت‌های تصویری و PDF",
        "ابزار اختصاصی اسکن با دوربین",
        "امکان بارگذاری گروهی چندین سند (در پنل تنظیمات)"
      ]
    },
    {
      title: "۲. پردازش و استخراج هوشمند",
      subtitle: "تحلیل سند",
      icon: <Cpu className={`w-12 h-12 ${colorClasses.indigo.text}`} />,
      description: "هوش مصنوعی سند شما را خط به خط تحلیل کرده و تمامی اقلام فاکتور شامل کالاها، مالیات ارزش افزوده، تخفیف‌ها و مبالغ کل را استخراج می‌کند.",
      color: "indigo" as const,
      features: [
        "تشخیص و محاسبه دقیق VAT",
        "پشتیبانی از اسناد ناخوانا و اداری",
        "تشخیص ارز و تبدیل مقادیر"
      ]
    },
    {
      title: "۳. بررسی و مدیریت تراکنش‌ها",
      subtitle: "ترازنامه مالی",
      icon: <TableProperties className={`w-12 h-12 ${colorClasses.emerald.text}`} />,
      description: "پس از پردازش، داده‌ها به صورت یک جدول حسابداری استاندارد (بدهکار/بستانکار) نمایش داده می‌شوند. شما می‌توانید اطلاعات را به صورت دستی ویرایش و اصلاح کنید.",
      color: "emerald" as const,
      features: [
        "ویرایش مستقیم سلول‌های جدول",
        "ماشین‌حساب داخلی برای موازنه",
        "محاسبه ضریب اطمینان (Confidence)"
      ]
    },
    {
      title: "۴. خروجی و گزارش‌گیری",
      subtitle: "گزارشات خروجی",
      icon: <Download className={`w-12 h-12 ${colorClasses.orange.text}`} />,
      description: "در نهایت، می‌توانید تمام تراکنش‌های تایید شده را با یک کلیک به صورت فایل اکسل (XLSX) دانلود کرده و در نرم‌افزارهای حسابداری خود (مانند هلو، سپیدار و ...) وارد کنید.",
      color: "orange" as const,
      features: [
        "تولید فایل اکسل ساختاریافته",
        "پشتیبان‌گیری (JSON) از کل تاریخچه",
        "ذخیره امن داده‌ها در مرورگر"
      ]
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const step = steps[currentStep];
  const stepColors = colorClasses[step.color];

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6" dir="rtl">
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300"
      ></div>
      
      <div className={`relative w-full max-w-3xl rounded-[2rem] shadow-2xl flex flex-col overflow-hidden transform transition-all animate-in zoom-in-95 duration-500 ${
        isDarkMode ? "bg-slate-900 border border-slate-800 text-slate-200" : "bg-white border border-slate-200 text-slate-800"
      }`}>
        
        {/* Progress Bar */}
        <div className="flex w-full h-1.5">
          {steps.map((s, idx) => {
            const isActive = idx === currentStep;
            const isPast = idx < currentStep;
            let barColor = isDarkMode ? "bg-slate-700" : "bg-slate-300";
            if (isActive || isPast) {
              barColor = colorClasses[s.color].bgSolid;
            }
            return (
               <div 
                 key={idx} 
                 className={`flex-1 transition-all duration-500 ${barColor}`} 
               />
            );
          })}
        </div>

        {/* Content Area */}
        <div className="p-8 sm:p-12 flex flex-col flex-1 relative">
           
           {/* Skip / Close */}
           <button 
             onClick={onClose}
             className={`absolute top-6 left-6 p-2 rounded-full transition-colors z-10 ${
               isDarkMode ? "text-slate-500 hover:bg-slate-800 hover:text-slate-300" : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
             }`}
           >
             <X className="w-5 h-5" />
           </button>

           <div className="flex flex-col items-center text-center mt-4">
              <div className={`p-5 rounded-3xl mb-6 shadow-inner ${stepColors.bgLight}`}>
                {step.icon}
              </div>
              
              <span className={`text-[11px] font-black tracking-widest uppercase mb-3 ${stepColors.text}`}>
                گام {currentStep === 0 ? "آشنایی" : currentStep} از {steps.length - 1} • {step.subtitle}
              </span>

              <h2 className="text-2xl sm:text-3xl font-black mb-4">
                {step.title}
              </h2>
              
              <p className={`text-sm sm:text-base leading-loose max-w-xl mx-auto mb-10 ${
                isDarkMode ? "text-slate-400" : "text-slate-600"
              }`}>
                {step.description}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                {step.features.map((feature, idx) => (
                  <div key={idx} className={`p-4 rounded-2xl flex flex-col items-center text-center gap-2 border ${
                    isDarkMode ? "bg-slate-950/40 border-slate-800/60" : "bg-slate-50 border-slate-100"
                  }`}>
                    <CheckCircle2 className={`w-5 h-5 ${stepColors.text}`} />
                    <span className="text-[11px] font-bold leading-relaxed">{feature}</span>
                  </div>
                ))}
              </div>
           </div>

        </div>

        {/* Footer Navigation */}
        <div className={`p-6 border-t flex items-center justify-between ${
          isDarkMode ? "bg-slate-950/50 border-slate-800" : "bg-slate-50 border-slate-100"
        }`}>
           
           <button
             onClick={handlePrev}
             disabled={currentStep === 0}
             className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
               currentStep === 0 
               ? "opacity-0 invisible" 
               : (isDarkMode ? "text-slate-400 hover:bg-slate-800 hover:text-white" : "text-slate-500 hover:bg-slate-200 hover:text-slate-900")
             }`}
           >
             <ChevronRight className="w-5 h-5" />
             مرحله قبل
           </button>

           <div className="flex gap-2">
             {steps.map((_, idx) => {
               const isActive = idx === currentStep;
               let dotColor = isDarkMode ? "bg-slate-700" : "bg-slate-300";
               if (isActive) dotColor = stepColors.text;
               return (
                 <div 
                   key={idx} 
                   className={`h-2 rounded-full transition-all duration-300 ${dotColor} ${isActive ? "w-6" : "w-2"}`} 
                 />
               );
             })}
           </div>

           <button
             onClick={handleNext}
             className={`flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-black transition-all shadow-lg hover:shadow-xl active:scale-95 text-white ${stepColors.bgSolid} ${stepColors.bgHover} shadow-lg ${stepColors.shadow}`}
           >
             {currentStep === steps.length - 1 ? (
               "شروع به کار"
             ) : (
               <>
                 بعدی
                 <ChevronLeft className="w-5 h-5" />
               </>
             )}
           </button>

        </div>

      </div>
    </div>
  );
}
