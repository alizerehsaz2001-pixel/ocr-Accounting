import React, { useState } from 'react';
import { Camera, Cpu, Download, CheckCircle2, ChevronLeft, ChevronRight, X, BrainCircuit, Cloud, Database } from 'lucide-react';

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
      shadow: isDarkMode ? "shadow-blue-900/30" : "shadow-blue-500/20",
    },
    purple: {
      text: isDarkMode ? "text-purple-400" : "text-purple-600",
      bgLight: isDarkMode ? "bg-purple-500/10" : "bg-purple-50",
      bgSolid: isDarkMode ? "bg-purple-600" : "bg-purple-600",
      bgHover: isDarkMode ? "hover:bg-purple-500" : "hover:bg-purple-700",
      shadow: isDarkMode ? "shadow-purple-900/30" : "shadow-purple-500/20",
    },
    emerald: {
      text: isDarkMode ? "text-emerald-400" : "text-emerald-600",
      bgLight: isDarkMode ? "bg-emerald-500/10" : "bg-emerald-50",
      bgSolid: isDarkMode ? "bg-emerald-600" : "bg-emerald-600",
      bgHover: isDarkMode ? "hover:bg-emerald-500" : "hover:bg-emerald-700",
      shadow: isDarkMode ? "shadow-emerald-900/30" : "shadow-emerald-500/20",
    }
  };

  const steps = [
    {
      title: "اسکن و تحلیل هوشمند سند",
      subtitle: "بارگذاری و اسکن آنی",
      icon: <Camera className={`w-12 h-12 ${colorClasses.blue.text}`} />,
      description: "تصویر یا PDF اسناد مالی (فاکتور، رسید بانکی، سند حسابداری) را بارگذاری کنید یا مستقیماً با دوربین دستگاه خود اسکن نمایید تا تحلیل شروع شود.",
      color: "blue" as const,
      features: [
        "پشتیبانی کامل از تصویر و PDF",
        "اسکن زنده با دوربین دستگاه",
        "پیش‌نمایش تصویر قبل از پردازش"
      ]
    },
    {
      title: "استخراج داده‌ها با هسته جمنی",
      subtitle: "تفکیک ارقام و موازنه مالی",
      icon: <Cpu className={`w-12 h-12 ${colorClasses.purple.text}`} />,
      description: "هوش مصنوعی قدرتمند Gemini اقلام سند را خط به خط تفکیک کرده، مقادیر بدهکار/بستانکار و مالیات را شناسایی و موازنه می‌کند.",
      color: "purple" as const,
      features: [
        "استخراج دقیق فاکتورهای دست‌نویس",
        "موازنه و صحت‌سنجی خودکار تراز",
        "تشخیص فیلدها و کدهای پیگیری"
      ]
    },
    {
      title: "مدیریت فضا ابری و خروجی اکسل",
      subtitle: "ذخیره‌سازی امن و یکپارچه",
      icon: <Database className={`w-12 h-12 ${colorClasses.emerald.text}`} />,
      description: "اسناد پردازش‌شده به صورت خودکار در فضای ابری همگام‌سازی شده و می‌توانید خروجی جدول حسابداری را مستقیماً به اکسل منتقل کنید.",
      color: "emerald" as const,
      features: [
        "همگام‌سازی ابری با دیتابیس هوشمند",
        "خروجی اکسل استاندارد سپیدار و هلو",
        "دسته‌بندی در پوشه‌های دلخواه"
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
        onClick={onClose}
      />
      
      <div className={`relative w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col overflow-hidden transform transition-all animate-in zoom-in-95 duration-500 ${
        isDarkMode ? "bg-slate-900 border border-slate-800 text-slate-200" : "bg-white border border-slate-200 text-slate-800"
      }`}>
        
        {/* Progress Bar */}
        <div className="flex w-full h-1">
          {steps.map((s, idx) => {
            const isActive = idx === currentStep;
            const isPast = idx < currentStep;
            let barColor = isDarkMode ? "bg-slate-800" : "bg-slate-200";
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
        <div className="p-6 sm:p-10 flex flex-col flex-1 relative">
           
           {/* Close */}
           <button 
             onClick={onClose}
             className={`absolute top-4 left-4 p-2 rounded-full transition-colors z-10 ${
               isDarkMode ? "text-slate-500 hover:bg-slate-800 hover:text-slate-300" : "text-slate-400 hover:bg-slate-150 hover:text-slate-600"
             }`}
           >
             <X className="w-5 h-5" />
           </button>
 
           <div className="flex flex-col items-center text-center mt-2">
              <div className={`p-4 rounded-2xl mb-4 shadow-inner ${stepColors.bgLight}`}>
                {step.icon}
              </div>
              
              <span className={`text-[10px] font-black tracking-wider uppercase mb-1.5 ${stepColors.text}`}>
                مرحله {currentStep + 1} از {steps.length} • {step.subtitle}
              </span>
 
              <h2 className="text-xl sm:text-2xl font-black mb-3">
                {step.title}
              </h2>
              
              <p className={`text-xs sm:text-sm leading-relaxed max-w-lg mx-auto mb-6 ${
                isDarkMode ? "text-slate-400" : "text-slate-600"
              }`}>
                {step.description}
              </p>
 
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
                {step.features.map((feature, idx) => (
                  <div key={idx} className={`p-3 rounded-xl flex flex-col items-center text-center gap-1.5 border ${
                    isDarkMode ? "bg-slate-950/40 border-slate-800/60" : "bg-slate-50 border-slate-150"
                  }`}>
                    <CheckCircle2 className={`w-4 h-4 ${stepColors.text}`} />
                    <span className="text-[10.5px] font-bold leading-normal">{feature}</span>
                  </div>
                ))}
              </div>
           </div>
 
        </div>
 
        {/* Footer Navigation */}
        <div className={`p-4 sm:p-5 border-t flex items-center justify-between ${
          isDarkMode ? "bg-slate-950/40 border-slate-800" : "bg-slate-50 border-slate-150"
        }`}>
           
           <button
             onClick={handlePrev}
             disabled={currentStep === 0}
             className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
               currentStep === 0 
               ? "opacity-0 invisible" 
               : (isDarkMode ? "text-slate-400 hover:bg-slate-800 hover:text-white" : "text-slate-500 hover:bg-slate-200 hover:text-slate-900")
             }`}
           >
             <ChevronRight className="w-4 h-4" />
             مرحله قبل
           </button>
 
           <div className="flex gap-1.5">
             {steps.map((_, idx) => {
               const isActive = idx === currentStep;
               let dotColor = isDarkMode ? "bg-slate-800" : "bg-slate-200";
               if (isActive) dotColor = stepColors.text;
               return (
                 <div 
                   key={idx} 
                   className={`h-1.5 rounded-full transition-all duration-300 ${dotColor} ${isActive ? "w-4" : "w-1.5"}`} 
                 />
               );
             })}
           </div>
 
           <button
             onClick={handleNext}
             className={`flex items-center gap-1.5 px-6 py-2 rounded-xl text-xs font-black transition-all shadow-md hover:shadow-lg active:scale-95 text-white ${stepColors.bgSolid} ${stepColors.bgHover} shadow-md ${stepColors.shadow}`}
           >
             {currentStep === steps.length - 1 ? (
               "شروع به کار"
             ) : (
               <>
                 بعدی
                 <ChevronLeft className="w-4 h-4" />
               </>
             )}
           </button>
 
        </div>
 
      </div>
    </div>
  );
}
