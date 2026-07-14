const fs = require('fs');
let content = fs.readFileSync('src/components/OnboardingModal.tsx', 'utf8');

const stepsRegex = /const steps = \[\s*\{[\s\S]*?\}\s*\];/m;

const newSteps = `const steps = [
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
  ];`;

content = content.replace(stepsRegex, newSteps);

// We also need to add 'Camera' to imports if not present
if (!content.includes('Camera,')) {
    content = content.replace(/Upload, Cpu, Edit3, Settings, ShieldCheck, Check, MousePointerClick, FileJson, FileSpreadsheet, Mic, Database, ArrowLeft, ArrowRight, Sparkles, Zap, ChartPie/, 'Upload, Cpu, Edit3, Settings, ShieldCheck, Check, MousePointerClick, FileJson, FileSpreadsheet, Camera, Database, ArrowLeft, ArrowRight, Sparkles, Zap, ChartPie');
}

fs.writeFileSync('src/components/OnboardingModal.tsx', content);
console.log('Updated steps.');
