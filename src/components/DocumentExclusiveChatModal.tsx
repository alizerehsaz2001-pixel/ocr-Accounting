import React, { useState, useEffect, useRef } from "react";
import { 
  X, 
  Send, 
  Bot, 
  User, 
  Trash2, 
  Copy, 
  Check, 
  FileText, 
  Sparkles, 
  Paperclip, 
  Eye, 
  ArrowLeft,
  FileEdit,
  Info,
  Maximize2,
  Minimize2,
  RefreshCw,
  Cpu
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Markdown from "react-markdown";
import PdfThumbnail from "./PdfThumbnail";

interface DocumentExclusiveChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentData: any | null; // UploadedFile or PreviousScan or PendingFile
  isDarkMode: boolean;
  selectedModel: string;
  onApplyInstructionToPrompt?: (instruction: string) => void;
  onLogEvent?: (action: string, details: string) => void;
  onShowNotification?: (text: string, type: "success" | "error" | "info" | "warning") => void;
}

export interface DocChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: Date;
  files?: { name: string; mimeType: string; base64: string; size: number }[];
}

export default function DocumentExclusiveChatModal({
  isOpen,
  onClose,
  documentData,
  isDarkMode,
  selectedModel,
  onApplyInstructionToPrompt,
  onLogEvent,
  onShowNotification
}: DocumentExclusiveChatModalProps) {
  const [messages, setMessages] = useState<DocChatMessage[]>([]);
  const [input, setInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [attachedFiles, setAttachedFiles] = useState<{ name: string; mimeType: string; base64: string; size: number }[]>([]);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [showImagePreview, setShowImagePreview] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Normalize document properties whether passed as UploadedFile, PreviousScan, or PendingFile
  const docFile = documentData?.file || documentData;
  const docName = docFile?.name || "سند نامشخص";
  const docId = documentData?.id || docFile?.id || "doc-unknown";
  const docPreview = docFile?.preview || "";
  const docMimeType = docFile?.mimeType || (docName.toLowerCase().endsWith(".pdf") ? "application/pdf" : "image/jpeg");
  const extractedTransactions = documentData?.transactions || docFile?.results || [];
  const docAnalysis = docFile?.documentAnalysis || "";

  // Load chat history for this specific document from LocalStorage
  useEffect(() => {
    if (isOpen && docId) {
      const storageKey = `doc_exclusive_chat_${docId}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setMessages(parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
        } catch (_) {
          initWelcomeMessage();
        }
      } else {
        initWelcomeMessage();
      }
    }
  }, [isOpen, docId, docName]);

  const initWelcomeMessage = () => {
    const initialWelcome: DocChatMessage = {
      id: `welcome-${Date.now()}`,
      role: "assistant",
      text: `سلام! من **دستیار هوشمند و انحصاری** سند **«${docName}»** هستم.

آماده‌ام به تمامی سوالات، ممیزی‌های مالیاتی، بررسی ارقام، صحت‌سنجی فاکتور یا استخراج مشخصات این سند به صورت اختصاصی پاسخ دهم.

می‌توانید یکی از پیشنهادات زیر را انتخاب کنید یا سوال خود را تایپ کنید:`,
      timestamp: new Date()
    };
    setMessages([initialWelcome]);
  };

  // Save chat history to LocalStorage
  useEffect(() => {
    if (isOpen && docId && messages.length > 0) {
      const storageKey = `doc_exclusive_chat_${docId}`;
      localStorage.setItem(storageKey, JSON.stringify(messages));
    }
  }, [messages, isOpen, docId]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (customText?: string) => {
    const messageText = customText || input;
    if ((!messageText || !messageText.trim()) && attachedFiles.length === 0) return;

    const userMsg: DocChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: messageText,
      files: attachedFiles.length > 0 ? [...attachedFiles] : undefined,
      timestamp: new Date()
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    if (!customText) setInput("");
    setAttachedFiles([]);
    setIsLoading(true);

    if (onLogEvent) {
      onLogEvent("چت اختصاصی سند", `کاربر پیامی درباره سند «${docName}» ارسال نمود.`);
    }

    try {
      // Prepare image base64 if available
      let base64Image = "";
      if (docPreview && docPreview.includes("base64,")) {
        base64Image = docPreview.split("base64,")[1];
      }

      const response = await fetch("/api/document-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({
            role: m.role,
            text: m.text,
            files: m.files
          })),
          documentImage: base64Image,
          mimeType: docMimeType,
          documentData: extractedTransactions.length > 0 ? extractedTransactions : undefined,
          documentName: docName,
          documentType: docFile?.documentType || "سند مالی",
          documentAnalysis: docAnalysis,
          model: selectedModel
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "خطا در برقراری ارتباط با مدل چت اختصاصی سند.");
      }

      const aiMsg: DocChatMessage = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        text: result.text,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      console.error("Document exclusive chat error:", err);
      const errorMsg: DocChatMessage = {
        id: `err-${Date.now()}`,
        role: "assistant",
        text: `⚠️ **متاسفانه در پردازش پیام خطایی رخ داد:** ${err.message || "لطفاً مجدداً تلاش کنید."}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
      if (onShowNotification) {
        onShowNotification("خطا در پاسخ‌دهی هوش مصنوعی سند", "error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm(`آیا از پاکسازی تمام تاریخچه چت انحصاری سند «${docName}» اطمینان دارید؟`)) {
      if (docId) {
        localStorage.removeItem(`doc_exclusive_chat_${docId}`);
      }
      initWelcomeMessage();
      if (onShowNotification) {
        onShowNotification("تاریخچه چت انحصاری سند پاکسازی شد.", "info");
      }
    }
  };

  const handleCopyText = (text: string, msgId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(msgId);
    setTimeout(() => setCopiedMsgId(null), 2000);
    if (onShowNotification) {
      onShowNotification("متن پیام کپی شد.", "success");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Str = (reader.result as string).split(",")[1];
        setAttachedFiles(prev => [
          ...prev,
          {
            name: file.name,
            mimeType: file.type || "image/jpeg",
            base64: base64Str,
            size: file.size
          }
        ]);
      };
      reader.readAsDataURL(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const isPdf = docName.toLowerCase().endsWith(".pdf") || docPreview.startsWith("data:application/pdf");

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm" dir="rtl">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className={`relative w-full ${isExpanded ? "max-w-7xl h-[94vh]" : "max-w-4xl h-[85vh]"} rounded-2xl flex flex-col shadow-2xl overflow-hidden border transition-all duration-300 ${
            isDarkMode 
              ? "bg-[#0F172A] border-slate-800 text-slate-100" 
              : "bg-white border-slate-200 text-slate-900"
          }`}
        >
          {/* Header */}
          <div className={`p-3.5 px-4 flex items-center justify-between border-b shrink-0 ${
            isDarkMode ? "bg-slate-900/90 border-slate-800" : "bg-slate-50 border-slate-200"
          }`}>
            <div className="flex items-center gap-3">
              {/* Document Thumbnail Badge */}
              <div 
                onClick={() => setShowImagePreview(true)}
                className="w-10 h-10 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center shrink-0 cursor-pointer relative group/thumb shadow-sm"
                title="مشاهده تصویر/فایل سند"
              >
                {isPdf && docPreview ? (
                  <PdfThumbnail base64={docPreview.split(",")[1]} className="w-full h-full" isDarkMode={isDarkMode} />
                ) : docPreview ? (
                  <img src={docPreview} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <FileText className="w-5 h-5 text-indigo-500" />
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity text-white">
                  <Eye className="w-4 h-4" />
                </div>
              </div>

              {/* Title & Info */}
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[9.5px] font-extrabold flex items-center gap-1 shadow-sm">
                    <Sparkles className="w-3 h-3 animate-pulse" />
                    <span>چت اختصاصی سند</span>
                  </span>
                  <h3 className="font-extrabold text-sm truncate max-w-[200px] sm:max-w-[320px]" title={docName}>
                    {docName}
                  </h3>
                </div>
                <div className="flex items-center gap-3 text-[10px] opacity-70 mt-0.5">
                  <span>{extractedTransactions.length} ردیف داده استخراج شده</span>
                  <span>•</span>
                  <span>مدل: {selectedModel}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowImagePreview(prev => !prev)}
                className={`p-1.5 rounded-lg border text-xs font-bold flex items-center gap-1 transition-all ${
                  showImagePreview
                    ? "bg-indigo-600 text-white border-indigo-500"
                    : isDarkMode 
                      ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700" 
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
                title="نمایش سند در کنار چت"
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">مشاهده سند</span>
              </button>

              <button
                type="button"
                onClick={handleClearHistory}
                className={`p-1.5 rounded-lg border text-rose-500 transition-all ${
                  isDarkMode ? "border-slate-800 hover:bg-rose-500/10" : "border-slate-200 hover:bg-rose-50"
                }`}
                title="پاکسازی چت این سند"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setIsExpanded(prev => !prev)}
                className={`p-1.5 rounded-lg border transition-all ${
                  isDarkMode ? "border-slate-800 hover:bg-slate-800 text-slate-400" : "border-slate-200 hover:bg-slate-100 text-slate-600"
                }`}
                title={isExpanded ? "کوچک‌سازی" : "بزرگ‌سازی modal"}
              >
                {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={onClose}
                className={`p-1.5 rounded-lg border transition-all ${
                  isDarkMode ? "border-slate-800 hover:bg-slate-800 text-slate-400" : "border-slate-200 hover:bg-slate-100 text-slate-600"
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Main Content Area (Split preview + Chat) */}
          <div className="flex-1 flex overflow-hidden relative">
            {/* Optional Side Document Preview */}
            <AnimatePresence>
              {showImagePreview && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: "40%", opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className={`hidden md:flex flex-col border-l h-full overflow-hidden shrink-0 ${
                    isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-100 border-slate-200"
                  }`}
                >
                  <div className="p-2 border-b flex items-center justify-between text-[11px] font-bold opacity-80 px-3">
                    <span>پیش‌نمایش سند مربوطه</span>
                    <button onClick={() => setShowImagePreview(false)} className="p-1 hover:text-rose-500">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-auto p-3 flex items-center justify-center">
                    {isPdf && docPreview ? (
                      <div className="w-full h-full min-h-[400px]">
                        <iframe src={docPreview} title="PDF Preview" className="w-full h-full rounded-lg border" />
                      </div>
                    ) : docPreview ? (
                      <img src={docPreview} alt={docName} className="max-w-full max-h-full object-contain rounded-lg shadow-md border" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="text-xs text-slate-400">پیش‌نمایش تصویری در دسترس نیست</div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Chat Body */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Preset Prompts Chips */}
              <div className={`p-2 px-4 border-b flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 ${
                isDarkMode ? "bg-slate-900/40 border-slate-800/80" : "bg-slate-50/80 border-slate-150"
              }`}>
                <span className="text-[10px] font-bold text-indigo-500 whitespace-nowrap flex items-center gap-1 shrink-0 ml-1">
                  <Sparkles className="w-3 h-3" />
                  پیشنهادها:
                </span>
                {[
                  "⚡ تبدیل ۱۰۰٪ تمام اطلاعات به JSON (جهت اکسل)",
                  "💡 خلاصه مدیریتی و ممیزی کامل سند",
                  "🔍 صحت‌سنجی جمع مبالغ، اقلام و مالیات",
                  "🏷️ استخراج مشخصات طرفین و شناسه ملی",
                  "📄 بررسی اعتبار قانونی و شناسه مودیان",
                  "📊 تحلیل فاکتور به تفکیک فی و قیمت کل"
                ].map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      if (prompt.includes("۱۰۰٪")) {
                        handleSendMessage("دستور اکید و تضمینی ویژه (Gemini 3.6 Flash): تمام اطلاعات مندرج در این سند را بدون استثنا و ۱۰۰٪ کامل استخراج کن. هر آنچه می‌بینی، از ریزترین اعداد، تاریخ‌ها، کدهای اقتصادی، شناسه ملی، مبالغ جزئی، مالیات، عوارض، تا توضیحات متنی طولانی و آدرس‌ها را به فرمت JSON تبدیل کن. خروجی باید مطلقاً و منحصراً یک آرایه JSON ساختاریافته (بدون تگ مارک‌داون ```json، بدون هیچ کلمه اضافه یا توضیح) باشد. تک‌تک سطرها و اقلام باید با کلیدهای فارسی کاملاً شفاف و استاندارد تولید شوند تا بدون نیاز به حتی یک ثانیه ویرایش، مستقیماً سطر به سطر وارد جدول اکسل شوند. تضمین ۱۰۰ درصدی دقت ریاضی مبالغ و یکپارچگی داده‌ها الزامی است.");
                      } else {
                        handleSendMessage(prompt);
                      }
                    }}
                    disabled={isLoading}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap transition-all border shrink-0 ${
                      isDarkMode 
                        ? "bg-slate-800/80 border-slate-700/70 text-slate-300 hover:bg-indigo-900/40 hover:border-indigo-500/50 hover:text-indigo-200" 
                        : "bg-white border-slate-200 text-slate-700 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700"
                    } cursor-pointer`}
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              {/* Chat Message Scroll Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex items-start gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                  >
                    {/* Avatar */}
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                      msg.role === "user"
                        ? "bg-gradient-to-tr from-blue-600 to-indigo-600 text-white"
                        : "bg-gradient-to-tr from-purple-600 to-indigo-600 text-white"
                    }`}>
                      {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>

                    {/* Content Box */}
                    <div className={`max-w-[85%] rounded-2xl p-3.5 space-y-2 text-xs leading-relaxed shadow-sm ${
                      msg.role === "user"
                        ? "bg-indigo-600 text-white rounded-tr-none"
                        : isDarkMode
                          ? "bg-slate-800/90 border border-slate-750 text-slate-100 rounded-tl-none"
                          : "bg-slate-100 border border-slate-200 text-slate-900 rounded-tl-none"
                    }`}>
                      {/* Attached Files display */}
                      {msg.files && msg.files.length > 0 && (
                        <div className="flex flex-wrap gap-2 pb-2 mb-2 border-b border-indigo-400/30">
                          {msg.files.map((file, fIdx) => (
                            <div key={fIdx} className="p-1.5 rounded-lg bg-black/20 text-[10px] font-bold flex items-center gap-1.5">
                              <Paperclip className="w-3 h-3" />
                              <span className="truncate max-w-[120px]">{file.name}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Text */}
                      {msg.role === "assistant" ? (
                        <div className="markdown-body text-xs leading-relaxed space-y-1">
                          <Markdown>{msg.text}</Markdown>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap font-sans">{msg.text}</p>
                      )}

                      {/* Footer Actions for Assistant Messages */}
                      {msg.role === "assistant" && (
                        <div className="pt-2 mt-2 border-t border-slate-200/20 dark:border-slate-700/40 flex items-center justify-between text-[10px] opacity-80">
                          <span className="text-[9px] opacity-60">
                            {new Date(msg.timestamp).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleCopyText(msg.text, msg.id)}
                              className="p-1 rounded hover:bg-slate-700/20 transition-colors flex items-center gap-1 text-slate-400 hover:text-indigo-400"
                              title="کپی پاسخ"
                            >
                              {copiedMsgId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              <span>{copiedMsgId === msg.id ? "کپی شد" : "کپی"}</span>
                            </button>

                            {onApplyInstructionToPrompt && (
                              <button
                                onClick={() => {
                                  onApplyInstructionToPrompt(msg.text);
                                  if (onShowNotification) {
                                    onShowNotification("نکات کلیدی پاسخ به پرامپت استخراج سند منتقل گردید.", "success");
                                  }
                                }}
                                className="p-1 rounded hover:bg-purple-500/20 transition-colors flex items-center gap-1 text-purple-400 hover:text-purple-300"
                                title="انتقال تحلیل یا دستور به پرامپت اصلی استخراج"
                              >
                                <FileEdit className="w-3 h-3" />
                                <span>انتقال به پرامپت سند</span>
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}

                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-3"
                  >
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 animate-spin" />
                    </div>
                    <div className={`p-3.5 rounded-2xl rounded-tl-none border text-xs flex items-center gap-2 ${
                      isDarkMode ? "bg-slate-800/80 border-slate-750 text-slate-300" : "bg-slate-100 border-slate-200 text-slate-700"
                    }`}>
                      <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: "0ms" }}></div>
                        <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: "150ms" }}></div>
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "300ms" }}></div>
                      </div>
                      <span className="font-semibold text-[11px]">هوش مصنوعی در حال تحلیل و ممیزی سند «{docName}» است...</span>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Attachments preview before sending */}
              {attachedFiles.length > 0 && (
                <div className={`p-2 px-4 border-t flex flex-wrap gap-2 text-xs ${
                  isDarkMode ? "bg-slate-900 border-slate-800" : "bg-slate-50 border-slate-200"
                }`}>
                  {attachedFiles.map((file, idx) => (
                    <div key={idx} className="p-1 px-2 rounded-lg bg-indigo-600/10 text-indigo-500 border border-indigo-500/20 text-[10px] font-bold flex items-center gap-2">
                      <Paperclip className="w-3 h-3" />
                      <span className="truncate max-w-[150px]">{file.name}</span>
                      <button onClick={() => setAttachedFiles(prev => prev.filter((_, i) => i !== idx))} className="hover:text-rose-500">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Input Control Bar */}
              <div className={`p-3 border-t shrink-0 ${
                isDarkMode ? "bg-slate-900/90 border-slate-800" : "bg-slate-50 border-slate-200"
              }`}>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    multiple
                    accept="image/*,application/pdf"
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`p-2.5 rounded-xl border transition-all ${
                      isDarkMode ? "bg-slate-800 border-slate-700 text-slate-400 hover:text-indigo-400" : "bg-white border-slate-200 text-slate-600 hover:text-indigo-600"
                    }`}
                    title="ضمیمه کردن تصویر یا فایل جدید به گفتگو"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  <textarea
                    rows={1}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder={`پرسش درباره سند «${docName}»... (مثلاً: وضعیت جمع مبالغ و ارزش افزوده این سند چگونه است؟)`}
                    className={`flex-1 p-2.5 rounded-xl border text-xs outline-none transition-all resize-none ${
                      isDarkMode 
                        ? "bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500 focus:border-indigo-500" 
                        : "bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-500"
                    }`}
                  />

                  <button
                    type="submit"
                    disabled={isLoading || (!input.trim() && attachedFiles.length === 0)}
                    className={`p-2.5 px-4 rounded-xl text-white font-bold flex items-center gap-1.5 transition-all shadow-md ${
                      !isLoading && (input.trim() || attachedFiles.length > 0)
                        ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 cursor-pointer hover:scale-102"
                        : "bg-slate-400 dark:bg-slate-800 text-slate-200 opacity-50 cursor-not-allowed"
                    }`}
                  >
                    <Send className="w-4 h-4 rotate-180" />
                    <span className="hidden sm:inline text-xs">ارسال</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
