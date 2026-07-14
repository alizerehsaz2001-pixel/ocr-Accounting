import React, { useState } from "react";
import { Upload, Cpu, Edit3, Settings, ShieldCheck, Check, MousePointerClick, FileJson, FileSpreadsheet, Camera, Database, ArrowLeft, ArrowRight, Sparkles, Zap, ChartPie } from "lucide-react";
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
      title: "به سیستم حسابداری هوشمند خوش آمدید",
      subtitle: "معرفی پلتفرم پردازش اسناد",
      description: "این نرم‌افزار به شما کمک می‌کند تا با استفاده از هوش مصنوعی (Gemini)، فاکتورها، رسیدها و اسناد مالی خود را در کمترین زمان پردازش کرده و به داده‌های ساختاریافته حسابداری تبدیل کنید.",
      icon: <Sparkles className="h-16 w-16 text-white" />,
      color: "from-blue-600 to-indigo-600",
      features: [
        { icon: <ShieldCheck className="h-5 w-5" />, title: "امنیت داده‌ها", desc: "پردازش امن و نگهداری اطلاعات در مرورگر شما" },
        { icon: <Zap className="h-5 w-5" />, title: "سرعت بالا", desc: "استخراج آنی اقلام و مبالغ فاکتور" },
        { icon: <ChartPie className="h-5 w-5" />, title: "دقت بالا", desc: "کاهش چشمگیر خطاهای ورود دستی اطلاعات" }
      ]
    },
    {
      title: "۱. بارگذاری و اسکن اسناد",
      subtitle: "ورود اطلاعات به سیستم",
      description: "برای شروع، می‌توانید فایل‌های تصویری یا PDF خود را در برنامه آپلود کنید. همچنین امکان استفاده از دوربین برای اسکن مستقیم و زنده فاکتورها وجود دارد.",
      icon: <Upload className="h-16 w-16 text-white" />,
      color: "from-indigo-600 to-purple-600",
      features: [
        { icon: <Upload className="h-5 w-5" />, title: "آپلود فایل", desc: "پشتیبانی از فرمت‌های تصویری رایج و PDF" },
        { icon: <Camera className="h-5 w-5" />, title: "اسکن زنده", desc: "عکس‌برداری مستقیم با دوربین دستگاه" },
        { icon: <Settings className="h-5 w-5" />, title: "تنظیمات کیفیت", desc: "امکان کاهش حجم تصویر برای مصرف کمتر اینترنت" }
      ]
    },
    {
      title: "۲. استخراج هوشمند و موازنه",
      subtitle: "پردازش توسط هوش مصنوعی",
      description: "هوش مصنوعی سند شما را به دقت تحلیل کرده و مقادیری نظیر مبلغ بدهکار/بستانکار، مالیات بر ارزش افزوده، نوع ارز و نام طرف حساب را استخراج می‌کند.",
      icon: <Cpu className="h-16 w-16 text-white" />,
      color: "from-emerald-500 to-teal-600",
      features: [
        { icon: <Cpu className="h-5 w-5" />, title: "موازنه خودکار", desc: "تراز کردن مقادیر بدهکار و بستانکار هر سند" },
        { icon: <FileJson className="h-5 w-5" />, title: "درک محتوا", desc: "تشخیص فاکتورهای دست‌نویس و مخدوش" },
        { icon: <Database className="h-5 w-5" />, title: "محاسبه اطمینان", desc: "ارائه ضریب اطمینان (Confidence) برای هر پردازش" }
      ]
    },
    {
      title: "۳. بررسی، ویرایش و خروجی",
      subtitle: "مدیریت نهایی داده‌ها",
      description: "داده‌های استخراج شده در یک جدول حسابداری منظم نمایش داده می‌شوند. شما می‌توانید اطلاعات را به صورت دستی ویرایش کرده و در نهایت خروجی اکسل بگیرید.",
      icon: <FileSpreadsheet className="h-16 w-16 text-white" />,
      color: "from-orange-500 to-rose-500",
      features: [
        { icon: <Edit3 className="h-5 w-5" />, title: "ویرایش سریع", desc: "اصلاح مستقیم سلول‌ها در محیط جدول" },
        { icon: <MousePointerClick className="h-5 w-5" />, title: "خروجی اکسل", desc: "دانلود داده‌ها به صورت فایل XLSX استاندارد" },
        { icon: <Database className="h-5 w-5" />, title: "پشتیبان‌گیری", desc: "امکان دانلود فایل JSON برای نگهداری تاریخچه" }
      ]
    }
  ];

  return (
    <AnimatePresence>
      <div className={`fixed inset-0 z-[100] flex flex-col lg:flex-row overflow-hidden font-sans ${isDarkMode ? "bg-[#0B0F19]" : "bg-white"}`} dir="rtl">
        {/* Left/Top Side - Visual Abstract Presentation */}
        <motion.div 
          className="relative w-full lg:w-5/12 h-[40vh] lg:h-full flex items-center justify-center overflow-hidden"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Animated Background Gradients */}
          <div className="absolute inset-0 w-full h-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.6 }}
                className={`absolute inset-0 bg-gradient-to-br ${steps[step].color} opacity-90`}
              />
            </AnimatePresence>
            {/* Pattern overlay */}
            <div className="absolute inset-0 opacity-[0.15] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent mix-blend-overlay"></div>
          </div>

          {/* Floating Icon Container */}
          <div className="relative z-10 flex flex-col items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 30, scale: 0.8, rotate: -10 }}
                animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, y: -30, scale: 0.8, rotate: 10 }}
                transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
                className="w-32 h-32 md:w-40 md:h-40 bg-white/20 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl flex items-center justify-center relative"
              >
                {/* Glow behind icon */}
                <div className="absolute inset-0 bg-white/20 rounded-3xl blur-xl animate-pulse"></div>
                {steps[step].icon}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Right/Bottom Side - Content & Controls */}
        <div className="relative w-full lg:w-7/12 h-[60vh] lg:h-full flex flex-col justify-between px-6 py-8 md:p-12 lg:p-20 overflow-y-auto">
          {/* Step Indicator */}
          <div className="flex gap-2 mb-8 md:mb-12">
            {steps.map((_, i) => (
              <motion.div 
                key={i} 
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  step === i 
                    ? "w-8 bg-blue-600 dark:bg-blue-500" 
                    : step > i
                      ? "w-4 bg-blue-600/40 dark:bg-blue-500/40"
                      : isDarkMode ? "w-4 bg-slate-800" : "w-4 bg-slate-200"
                }`}
              />
            ))}
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.4 }}
                className="max-w-2xl"
              >
                <motion.h4 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-blue-600 dark:text-blue-400 font-bold mb-3 tracking-wide text-sm md:text-base"
                >
                  {steps[step].subtitle}
                </motion.h4>
                <motion.h2 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className={`text-3xl md:text-4xl lg:text-5xl font-black mb-6 leading-tight tracking-tight ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}
                >
                  {steps[step].title}
                </motion.h2>
                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className={`text-base md:text-lg leading-relaxed mb-10 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}
                >
                  {steps[step].description}
                </motion.p>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {steps[step].features.map((feature, idx) => (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + (idx * 0.1) }}
                      key={idx} 
                      className={`flex flex-col gap-2 p-4 rounded-2xl border transition-all hover:-translate-y-1 ${
                        isDarkMode ? "bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/80" : "bg-slate-50 border-slate-100 hover:bg-white hover:shadow-md hover:border-slate-200"
                      }`}
                    >
                      <div className={`p-2 w-fit rounded-xl ${
                        isDarkMode ? "bg-slate-700 text-blue-400" : "bg-blue-100 text-blue-600"
                      }`}>
                        {feature.icon}
                      </div>
                      <h5 className={`font-bold text-sm ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>
                        {feature.title}
                      </h5>
                      <p className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                        {feature.desc}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-between mt-12 pt-6 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={onClose}
              className={`px-4 py-2 text-sm font-bold rounded-xl transition-colors ${
                isDarkMode 
                  ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800" 
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              }`}
            >
              رد کردن آموزش
            </button>
            
            <div className="flex gap-3">
              {step > 0 && (
                <button
                  onClick={() => setStep(step - 1)}
                  className={`p-3 rounded-xl transition-colors border ${
                    isDarkMode 
                      ? "border-slate-700 text-slate-300 hover:bg-slate-800" 
                      : "border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <ArrowRight className="h-5 w-5" />
                </button>
              )}
              
              <button
                onClick={() => {
                  if (step < steps.length - 1) {
                    setStep(step + 1);
                  } else {
                    onClose();
                  }
                }}
                className="px-6 md:px-8 py-3 text-sm md:text-base font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-600/25 flex items-center gap-2 group"
              >
                <span>{step < steps.length - 1 ? "مرحله بعدی" : "ورود به نرم‌افزار"}</span>
                {step < steps.length - 1 && (
                  <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AnimatePresence>
  );
}

