import React, { useState, useRef, useEffect } from "react";
import {
  Bot,
  X,
  Send,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Search,
  ChevronDown,
  ChevronUp,
  Headphones,
  Mail,
  CreditCard,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  FileText,
  Zap,
  Copy,
  Check,
  MessageSquare,
  BookOpen,
  ArrowRight,
  PhoneCall,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: Date;
}

interface MehrayinSupportWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  chatMessages: ChatMessage[];
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  isChatLoading: boolean;
  onSendChatMessage: (text?: string) => Promise<void>;
  showNotification: (msg: string, type?: "success" | "error" | "info") => void;
}

interface FaqItem {
  id: string;
  category: "purchase" | "scan" | "balance" | "files" | "security";
  categoryLabel: string;
  question: string;
  answer: string;
  promptQuestion?: string;
}

const FAQ_DATABASE: FaqItem[] = [
  {
    id: "f1",
    category: "purchase",
    categoryLabel: "خرید و اشتراک",
    question: "آیا برای خرید فضای ابری یا کلید API حتما باید از داخل برنامه اقدام کنم؟",
    answer: "خیر! نیازی به طی کردن مراحل طولانی در برنامه نیست. شما می‌توانید مستقیماً از طریق تلگرام با آیدی @Alizhz یا ارسال ایمیل به alizerehsaz2001@gmail.com با پشتیبانی در ارتباط باشید تا بلافاصله سفارش شما ثبت و فعال شود. همچنین با واریز به کارت بانک خاورمیانه (۵۸۵۹۴۷۱۰۱۰۷۹۸۹۸۵ به نام علی زره‌ساز) و ثبت فیش در برنامه، ارتقا انجام می‌شود.",
    promptQuestion: "چطور می‌توانم فضای ابری و کلید API را مستقیم و بدون فرم از تلگرام یا ایمیل بخرم؟"
  },
  {
    id: "f2",
    category: "purchase",
    categoryLabel: "خرید و اشتراک",
    question: "قیمت بسته‌های افزایش حجم و سقف اسکن چقدر است؟",
    answer: "در حال حاضر جهت تست و رفاه حال کاربران، قیمت بسته‌ها در سیستم ۰ تومان (رایگان) تنظیم شده است. جهت خریدهای عمده سازمانی، توکن‌های اختصاصی پردازش بالا یا تخفیف ویژه می‌توانید با تلگرام پشتیبانی @Alizhz تماس بگیرید.",
    promptQuestion: "شرایط بسته‌های حجمی و خرید اکانت سازمانی با پردازش بالا چیست؟"
  },
  {
    id: "f3",
    category: "scan",
    categoryLabel: "اسکن و OCR",
    question: "چه نوع اسناد و فایل‌هایی توسط هوش مصنوعی پشتیبانی می‌شوند؟",
    answer: "سیستم پشتیبانی کامل از عکس‌های باکیفیت و کم‌کیفیت فاکتور رسمی، غیررسمی، رسید دستگاه پوز، چک‌های صیادی، صورتحساب‌های بانکی و فایل‌های PDF تک‌صفحه‌ای یا چندصفحه‌ای دارد. الگوریتم ۸ زونه تمام بخش‌های هدر، خریدار، فروشنده، اقلام جدول، جمع‌های مالی و ارزش افزوده را استخراج می‌کند.",
    promptQuestion: "هوش مصنوعی مهرآیین چه مشخصات و زون‌هایی از فاکتور یا چک صیادی را استخراج می‌کند؟"
  },
  {
    id: "f4",
    category: "balance",
    categoryLabel: "تراز و مالیات",
    question: "معنی قرمز شدن موازنه بدهکار و بستانکار چیست و چگونه آن را رفع کنم؟",
    answer: "در حسابداری دوبل، مجموع مبالغ بدهکار باید دقیقاً برابر بستانکار باشد. اگر فاکتوری پس از اسکن غیرتراز شد، یعنی در یکی از ردیف‌ها ضریب اطمینان پائین بوده است. می‌توانید روی ردیف مربوطه کلیک کرده و عدد را ویرایش کنید یا از دکمه «تایید گروهی» و «دستیار تراز هوشمند» استفاده نمایید.",
    promptQuestion: "روش‌های هوشمند رفع مغایرت مالی و تراز کردن فاکتورهای غیرتراز چیست؟"
  },
  {
    id: "f5",
    category: "files",
    categoryLabel: "مدیریت فایل و اکسل",
    question: "چگونه می‌توانم از اسناد اسکن‌شده خروجی اکسل استاندارد سازمان مالیاتی بگیرم؟",
    answer: "در تب «آنالیز تصویر پیشرفته» یا بخش «مدیریت فایل‌ها»، می‌توانید یک یا چند سند را انتخاب کرده و روی دکمه «خروجی اکسل پیشرفته» کلیک کنید. اکسل خروجی کاملاً مسطح (Flat)، دارای تمام فیلدهای استاندارد مالیاتی و آماده بارگذاری در سامانه‌هاست.",
    promptQuestion: "چطور از اسناد و فاکتورها خروجی اکسل استاندارد مالیاتی تهیه کنم؟"
  },
  {
    id: "f6",
    category: "security",
    categoryLabel: "امنیت و API Key",
    question: "آیا برای کار با برنامه حتما باید Gemini API Key شخصی وارد کنم؟",
    answer: "خیر! سیستم به صورت پیش‌فرض به سرور هوش مصنوعی داخلی متصل است و بدون نیاز به تنظیمات کار می‌کند. اما اگر کلید اختصاصی Google Gemini API دارید، می‌توانید در بخش «تنظیمات هوش مصنوعی» آن را وارد کنید تا از سقف پردازش شخصی خود بهره‌مند شوید.",
    promptQuestion: "تفاوت استفاده از کلید عمومی برنامه و Gemini API Key اختصاصی در چیست؟"
  },
  {
    id: "f7",
    category: "security",
    categoryLabel: "امنیت و API Key",
    question: "امنیت اطلاعات مالی و اسناد بارگذاری‌شده من چگونه تامین می‌شود؟",
    answer: "تمام اسناد و تراکنش‌های شما در پایگاه داده ایمن Firestore و مخزن اختصاصی ذخیره شده و فقط با سطح دسترسی کاربر جاری شما قابل مشاهده است. اطلاعات حساس مالی با پروتکل‌های استاندارد ایمن‌سازی شده‌اند.",
    promptQuestion: "اطلاعات مالی و فاکتورهای من چگونه در سیستم ذخیره و ایمن می‌شوند؟"
  }
];

export default function MehrayinSupportWidget({
  isOpen,
  onClose,
  isDarkMode,
  chatMessages,
  setChatMessages,
  isChatLoading,
  onSendChatMessage,
  showNotification
}: MehrayinSupportWidgetProps) {
  const [activeTab, setActiveTab] = useState<"chat" | "faq" | "contact">("chat");
  const [chatInput, setChatInput] = useState("");
  const [faqCategory, setFaqCategory] = useState<string>("all");
  const [faqSearch, setFaqSearch] = useState("");
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>("f1");
  const [copiedCard, setCopiedCard] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTab === "chat") {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, isChatLoading, activeTab]);

  const filteredFaqs = FAQ_DATABASE.filter(item => {
    const matchesCategory = faqCategory === "all" || item.category === faqCategory;
    const matchesSearch =
      !faqSearch.trim() ||
      item.question.toLowerCase().includes(faqSearch.toLowerCase()) ||
      item.answer.toLowerCase().includes(faqSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCopyCard = () => {
    navigator.clipboard.writeText("5859471010798985");
    setCopiedCard(true);
    showNotification("شماره کارت ۵۸۵۹۴۷۱۰۱۰۷۹۸۹۸۵ با موفقیت کپی شد.", "success");
    setTimeout(() => setCopiedCard(false), 2000);
  };

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;
    const text = chatInput;
    setChatInput("");
    onSendChatMessage(text);
  };

  const handleAskFaqToAi = (item: FaqItem) => {
    setActiveTab("chat");
    const query = item.promptQuestion || item.question;
    onSendChatMessage(query);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.88, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.88, y: 30 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className={`w-[410px] h-[580px] max-w-[calc(100vw-2.5rem)] max-h-[calc(100vh-7rem)] rounded-3xl shadow-2xl border flex flex-col overflow-hidden ${
        isDarkMode
          ? "bg-slate-900/95 border-slate-800 text-slate-100 shadow-black/60"
          : "bg-white/95 border-slate-200 text-slate-800 shadow-slate-400/30"
      } backdrop-blur-xl z-[100]`}
      dir="rtl"
    >
      {/* Header */}
      <div
        className={`p-3.5 border-b flex flex-col gap-3 shrink-0 ${
          isDarkMode ? "bg-slate-850/90 border-slate-800" : "bg-slate-50/90 border-slate-150"
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 text-right">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                <Bot className="w-5.5 h-5.5 animate-pulse" />
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900"></span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="font-extrabold text-xs">مهرآیین - پشتیبان هوشمند ERP</h4>
                <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 text-[9px] font-bold">
                  پاسخگوی آنلاین
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-[9.5px]">
                <a
                  href="https://t.me/Alizhz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-400 hover:underline flex items-center gap-1 font-mono font-bold"
                >
                  <span>تلگرام: @Alizhz</span>
                </a>
                <span className="opacity-40">•</span>
                <a
                  href="mailto:alizerehsaz2001@gmail.com"
                  className="text-indigo-400 hover:underline font-mono font-bold"
                >
                  <span>ایمیل توسعه‌دهنده</span>
                </a>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                if (window.confirm("آیا مایل به بازنشانی گفتگو و پاکسازی پیام‌ها هستید؟")) {
                  setChatMessages([
                    {
                      id: "welcome",
                      role: "assistant",
                      text: "سلام! من مهرآیین، پشتیبان هوشمند ERP شما هستم. چطور می‌توانم در استخراج فاکتورها، رفع مغایرت مالی، راهنمای خرید مستقیم یا کار با ماژول‌های حسابداری به شما کمک کنم؟",
                      timestamp: new Date()
                    }
                  ]);
                  showNotification("تاریخچه گفتگو بازنشانی شد.", "info");
                }
              }}
              className={`p-1.5 rounded-xl transition-colors ${
                isDarkMode ? "hover:bg-slate-800 text-slate-400 hover:text-white" : "hover:bg-slate-200 text-slate-500 hover:text-slate-900"
              }`}
              title="بازنشانی گفتگو"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className={`p-1.5 rounded-xl transition-colors ${
                isDarkMode ? "hover:bg-slate-800 text-slate-400 hover:text-white" : "hover:bg-slate-200 text-slate-500 hover:text-slate-900"
              }`}
              title="بستن پشتیبان"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className={`grid grid-cols-3 p-1 rounded-2xl ${isDarkMode ? "bg-slate-900/80" : "bg-slate-200/60"}`}>
          <button
            onClick={() => setActiveTab("chat")}
            className={`py-1.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "chat"
                ? isDarkMode
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "bg-white text-indigo-700 shadow-sm"
                : isDarkMode
                  ? "text-slate-400 hover:text-slate-200"
                  : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>چت آنلاین</span>
          </button>

          <button
            onClick={() => setActiveTab("faq")}
            className={`py-1.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "faq"
                ? isDarkMode
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "bg-white text-indigo-700 shadow-sm"
                : isDarkMode
                  ? "text-slate-400 hover:text-slate-200"
                  : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>سوالات رایج</span>
          </button>

          <button
            onClick={() => setActiveTab("contact")}
            className={`py-1.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "contact"
                ? isDarkMode
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "bg-white text-indigo-700 shadow-sm"
                : isDarkMode
                  ? "text-slate-400 hover:text-slate-200"
                  : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>خرید مستقیم</span>
          </button>
        </div>
      </div>

      {/* Main Body Content based on Active Tab */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Tab 1: Chat View */}
        {activeTab === "chat" && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 flex flex-col custom-scrollbar">
              {chatMessages.map((msg) => {
                const isUser = msg.role === "user";
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isUser ? "justify-start" : "justify-end"} max-w-[88%] ${
                      isUser ? "mr-auto" : "ml-auto"
                    }`}
                  >
                    <div
                      className={`p-3 rounded-2xl text-[11.5px] leading-relaxed ${
                        isUser
                          ? "bg-gradient-to-l from-indigo-600 to-blue-600 text-white rounded-tr-none shadow-sm text-right"
                          : isDarkMode
                            ? "bg-slate-800/90 border border-slate-700/60 text-slate-100 rounded-tl-none text-right"
                            : "bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200/60 text-right"
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.text}</div>
                      <div className="text-[8.5px] text-left mt-1 opacity-50 font-mono">
                        {msg.timestamp.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                );
              })}

              {isChatLoading && (
                <div className="flex justify-end max-w-[85%] ml-auto">
                  <div
                    className={`p-3 rounded-2xl rounded-tl-none flex items-center gap-1.5 ${
                      isDarkMode ? "bg-slate-800/90" : "bg-slate-100"
                    }`}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    ></span>
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    ></span>
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    ></span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Suggestions Panel */}
            <div
              className={`p-3 border-t shrink-0 flex flex-col gap-2 ${
                isDarkMode ? "bg-slate-850/50 border-slate-800" : "bg-slate-50 border-slate-150"
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-bold px-0.5 text-slate-400">
                <span>پیشنهادهای هوشمند کاربردی:</span>
                <span className="text-[9px] text-indigo-400">کلیک جهت پرسش آنی</span>
              </div>

              <div className="flex gap-1.5 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
                {[
                  {
                    t: "🛒 خرید مستقیم بی‌واسطه",
                    q: "چگونه می‌توانم بدون پر کردن فرم و مستقیم از تلگرام یا ایمیل، فضای ابری یا کلید API تهیه کنم؟"
                  },
                  {
                    t: "⚖️ راهنمای رفع مغایرت",
                    q: "اگر فاکتور پس از استخراج غیرتراز شد یا مبالغ بدهکار/بستانکار با جمع فاکتور نخواند چه کنم؟"
                  },
                  {
                    t: "📑 خروجی اکسل مالیاتی",
                    q: "چطور از فاکتورها خروجی اکسل استاندارد سازمان امور مالیاتی بگیریم؟"
                  },
                  {
                    t: "🏢 استخراج شناسه ملی",
                    q: "آیا هوش مصنوعی شناسه ملی، کد اقتصادی و اطلاعات خریدار/فروشنده را با دقت استخراج می‌کند؟"
                  }
                ].map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSendChatMessage(chip.q)}
                    className={`shrink-0 px-2.5 py-1.5 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                      isDarkMode
                        ? "bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-indigo-600/20 hover:border-indigo-500/40 hover:text-indigo-300"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 shadow-2xs"
                    }`}
                  >
                    {chip.t}
                  </button>
                ))}
              </div>

              {/* Chat Input Bar */}
              <form onSubmit={handleSend} className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="سوال خود را درباره سیستم بپرسید..."
                  className={`flex-1 px-3.5 py-2 rounded-xl text-xs outline-none transition-all border text-right ${
                    isDarkMode
                      ? "bg-slate-900 border-slate-750 text-slate-100 focus:border-indigo-500/50"
                      : "bg-white border-slate-250 text-slate-800 focus:border-indigo-500/40"
                  }`}
                  disabled={isChatLoading}
                />
                <button
                  type="submit"
                  disabled={isChatLoading || !chatInput.trim()}
                  className={`p-2 rounded-xl transition-all ${
                    chatInput.trim() && !isChatLoading
                      ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 active:scale-95 cursor-pointer"
                      : isDarkMode
                        ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                        : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  <Send className="w-4 h-4 rotate-180" />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Tab 2: Frequently Asked Questions (FAQ) */}
        {activeTab === "faq" && (
          <div className="flex-1 flex flex-col p-3.5 overflow-hidden">
            {/* Search and Category Filters */}
            <div className="space-y-2.5 shrink-0 mb-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={faqSearch}
                  onChange={(e) => setFaqSearch(e.target.value)}
                  placeholder="جستجو در سوالات پر تکرار..."
                  className={`w-full pr-9 pl-3 py-1.5 text-xs rounded-xl border outline-none ${
                    isDarkMode
                      ? "bg-slate-850 border-slate-750 text-slate-100 placeholder:text-slate-500 focus:border-indigo-500/50"
                      : "bg-slate-100 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-indigo-500/40"
                  }`}
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
                {[
                  { id: "all", label: "همه سوالات" },
                  { id: "purchase", label: "🛒 خرید و اشتراک" },
                  { id: "scan", label: "📄 اسکن و OCR" },
                  { id: "balance", label: "⚖️ تراز و مالیات" },
                  { id: "files", label: "📁 مدیریت فایل" },
                  { id: "security", label: "🔒 امنیت و API" }
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setFaqCategory(cat.id)}
                    className={`shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                      faqCategory === cat.id
                        ? isDarkMode
                          ? "bg-indigo-600 border-indigo-500 text-white"
                          : "bg-indigo-600 border-indigo-600 text-white"
                        : isDarkMode
                          ? "bg-slate-800/80 border-slate-700/60 text-slate-400 hover:text-slate-200"
                          : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Accordion FAQ List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-0.5 custom-scrollbar">
              {filteredFaqs.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  هیچ سوالی متناسب با عبارت جستجوی شما یافت نشد.
                </div>
              ) : (
                filteredFaqs.map((faq) => {
                  const isExpanded = expandedFaqId === faq.id;
                  return (
                    <div
                      key={faq.id}
                      className={`rounded-2xl border transition-all overflow-hidden ${
                        isDarkMode
                          ? isExpanded
                            ? "bg-slate-850/90 border-indigo-500/30"
                            : "bg-slate-850/40 border-slate-800 hover:bg-slate-850/70"
                          : isExpanded
                            ? "bg-indigo-50/50 border-indigo-200"
                            : "bg-slate-50 border-slate-200 hover:bg-slate-100/70"
                      }`}
                    >
                      <button
                        onClick={() => setExpandedFaqId(isExpanded ? null : faq.id)}
                        className="w-full p-3 flex items-start justify-between gap-2 text-right cursor-pointer"
                      >
                        <span className="font-bold text-[11.5px] leading-relaxed text-slate-200 dark:text-slate-100">
                          {faq.question}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        )}
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="px-3 pb-3 pt-0 border-t border-dashed border-slate-700/30 text-xs space-y-2.5"
                          >
                            <p className="text-[11px] leading-relaxed text-slate-300 dark:text-slate-300 pt-2 opacity-90">
                              {faq.answer}
                            </p>

                            <div className="flex justify-end">
                              <button
                                onClick={() => handleAskFaqToAi(faq)}
                                className={`px-2.5 py-1 rounded-xl text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                                  isDarkMode
                                    ? "bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/30"
                                    : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border border-indigo-300"
                                }`}
                              >
                                <Sparkles className="w-3 h-3 text-indigo-400" />
                                <span>پرسش این موضوع از پشتیبان هوشمند</span>
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Direct Contact & Purchasing Info */}
        {activeTab === "contact" && (
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 custom-scrollbar">
            <div
              className={`p-3.5 rounded-2xl border text-xs space-y-2 ${
                isDarkMode ? "bg-sky-950/40 border-sky-500/30 text-slate-200" : "bg-sky-50 border-sky-200 text-slate-800"
              }`}
            >
              <div className="flex items-center gap-2">
                <Headphones className="w-4.5 h-4.5 text-sky-400 shrink-0" />
                <h5 className="font-extrabold text-[12px] text-sky-400">خرید مستقیم، سریع و بی‌واسطه:</h5>
              </div>
              <p className="text-[11px] leading-relaxed opacity-90">
                جهت فعال‌سازی فوری بسته‌های پردازش اسناد، خرید کلید API اختصاصی، یا مشاوره فنی نیازی به طی کردن مراحل طولانی در برنامه نیست. می‌توانید مستقیماً پیام دهید:
              </p>

              <div className="flex flex-col gap-2 pt-1">
                <a
                  href="https://t.me/Alizhz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full p-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold flex items-center justify-between transition-all cursor-pointer shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    <span>ارتباط مستقیم در تلگرام</span>
                  </div>
                  <span className="font-mono text-[11px] dir-ltr">@Alizhz</span>
                </a>

                <a
                  href="mailto:alizerehsaz2001@gmail.com"
                  className="w-full p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center justify-between transition-all cursor-pointer shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span>ارسال ایمیل مستقیم</span>
                  </div>
                  <span className="font-mono text-[10px] dir-ltr">alizerehsaz2001@gmail.com</span>
                </a>
              </div>
            </div>

            {/* Bank Card Info for Purchases */}
            <div
              className={`p-3.5 rounded-2xl border space-y-2 text-xs ${
                isDarkMode ? "bg-slate-850 border-slate-750" : "bg-slate-50 border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-amber-400">
                  <CreditCard className="w-4 h-4" />
                  <span>اطلاعات کارت جهت واریز وجه:</span>
                </div>
                <span className="text-[9.5px] text-slate-400">بانک خاورمیانه</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5 font-mono text-center">
                <div className="text-slate-400 text-[10px] font-sans">شماره کارت ۱۶ رقمی:</div>
                <div className="text-amber-300 font-extrabold text-sm tracking-wider dir-ltr">
                  5859-4710-1079-8985
                </div>
                <div className="text-slate-300 text-[11px] font-sans pt-0.5">
                  به نام: <strong className="text-white">علی زره ساز</strong>
                </div>
              </div>

              <button
                onClick={handleCopyCard}
                className={`w-full py-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                  copiedCard
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                    : isDarkMode
                      ? "bg-slate-800 text-slate-200 hover:bg-slate-750 border-slate-700"
                      : "bg-white text-slate-800 hover:bg-slate-100 border-slate-300"
                }`}
              >
                {copiedCard ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCard ? "شماره کارت کپی شد!" : "کپی شماره کارت"}</span>
              </button>
            </div>

            <div className="p-3 rounded-2xl border border-indigo-500/20 bg-indigo-500/10 text-[11px] leading-relaxed text-indigo-300 flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 text-indigo-400 mt-0.5" />
              <span>
                پس از واریز وجه، تصویر فیش واریزی را به همراه نام کاربری یا ایمیل خود به آیدی تلگرام @Alizhz ارسال کنید تا در کمتر از ۵ دقیقه سرویس شما شارژ شود.
              </span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
