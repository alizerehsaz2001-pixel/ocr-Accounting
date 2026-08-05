import React, { useState, useEffect } from "react";
import { Star, Send, Sparkles, Check, Info, BrainCircuit } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AnalysisRatingWidgetProps {
  fileId: string;
  fileName: string;
  transactions: any[];
  isDarkMode: boolean;
  onShowNotification: (message: string, type: "success" | "error" | "info" | "warning") => void;
}

export default function AnalysisRatingWidget({
  fileId,
  fileName,
  transactions,
  isDarkMode,
  onShowNotification
}: AnalysisRatingWidgetProps) {
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>("");
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [learnedLogs, setLearnedLogs] = useState<{ count: number; fallback: boolean } | null>(null);

  // Check if we already rated this file
  useEffect(() => {
    const isAlreadyRated = localStorage.getItem(`rated_${fileId}`) === "true";
    if (isAlreadyRated) {
      setIsSubmitted(true);
      const savedRating = localStorage.getItem(`rating_val_${fileId}`);
      if (savedRating) setRating(Number(savedRating));
    } else {
      setIsSubmitted(false);
      setRating(0);
      setFeedback("");
      setLearnedLogs(null);
    }
  }, [fileId]);

  const handleSubmitRating = async () => {
    if (rating === 0) {
      onShowNotification("لطفاً ابتدا با انتخاب ستاره‌ها، به کیفیت استخراج نمره دهید.", "warning");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/ml/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileId,
          rating,
          feedbackText: feedback,
          transactions
        })
      });

      const data = await res.json();
      if (data.success) {
        setIsSubmitted(true);
        localStorage.setItem(`rated_${fileId}`, "true");
        localStorage.setItem(`rating_val_${fileId}`, String(rating));
        
        if (data.learned) {
          setLearnedLogs({
            count: data.learnedCount || 0,
            fallback: !!data.fallback
          });
          onShowNotification(
            `بازخورد و نمره ثبت شد! مغز هوش مصنوعی ${data.learnedCount || 1} الگوی جدید یاد گرفت. 🧠`,
            "success"
          );
        } else {
          onShowNotification("ممنون از ثبت امتیاز و بازخورد ارزشمند شما 🌸", "success");
        }
      } else {
        onShowNotification("خطا در ثبت امتیاز و بازخورد", "error");
      }
    } catch (err) {
      console.error("Submit feedback error:", err);
      onShowNotification("خطا در ارتباط با سرور جهت ثبت بازخورد", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`p-4 rounded-2xl border transition-all ${
      isDarkMode 
        ? "bg-slate-900/40 border-slate-800 text-slate-100" 
        : "bg-indigo-50/20 border-indigo-100 text-slate-800"
    } mb-4`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Title and Rating */}
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl shrink-0 ${
            isDarkMode ? "bg-indigo-500/10 text-indigo-400" : "bg-indigo-50 text-indigo-600"
          }`}>
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div className="text-right">
            <h4 className="text-xs font-black tracking-tight flex items-center gap-1.5">
              ارزیابی هوشمند و آموزش ممیزی (Feedback-driven ML)
              <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-bold ${
                isDarkMode ? "bg-indigo-950 text-indigo-400" : "bg-indigo-100 text-indigo-800"
              }`}>موتور یادگیری تطبیقی</span>
            </h4>
            <p className={`text-[9.5px] mt-0.5 leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
              با نمره‌دهی و ارائه فیدبک اصلاحی، هوش مصنوعی را برای پردازش‌های بعدی همین فاکتور آموزش دهید.
            </p>
          </div>
        </div>

        {/* Stars Container */}
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              disabled={isSubmitted || isLoading}
              onMouseEnter={() => !isSubmitted && setHoverRating(star)}
              onMouseLeave={() => !isSubmitted && setHoverRating(0)}
              onClick={() => setRating(star)}
              className={`p-1 transition-transform active:scale-90 ${isSubmitted ? "cursor-default" : "cursor-pointer"}`}
            >
              <Star 
                className={`w-5 h-5 transition-colors ${
                  star <= (hoverRating || rating)
                    ? "fill-amber-400 text-amber-400"
                    : isDarkMode ? "text-slate-700" : "text-slate-300"
                }`}
              />
            </button>
          ))}
          {rating > 0 && (
            <span className="text-[10px] font-black mr-2 text-amber-500">
              {rating === 5 ? "عالی" : rating >= 3 ? "خوب/متوسط" : "نیاز به بهبود دارد"}
            </span>
          )}
        </div>
      </div>

      <AnimatePresence>
        {rating > 0 && !isSubmitted && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden mt-4 pt-4 border-t border-dashed border-slate-200 dark:border-slate-800 flex flex-col gap-3"
          >
            {rating < 5 && (
              <div className="flex flex-col gap-1.5 text-right">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Info className="w-3 h-3 text-indigo-500" />
                  <span>چه کلماتی اشتباه خوانده شده یا چه سرفصل‌هایی اشتباه دسته‌بندی شده است؟</span>
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="مثال: کلمه 'اسنپ' در ستون بابت باید تصحیح شده و در سرفصل 'هزینه حمل و نقل' قرار گیرد..."
                  rows={2}
                  className={`w-full p-2.5 rounded-xl text-[10.5px] leading-relaxed border outline-none resize-none ${
                    isDarkMode 
                      ? "bg-slate-950 border-slate-800 text-slate-200 placeholder-slate-700 focus:border-indigo-500" 
                      : "bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-indigo-500"
                  }`}
                />
              </div>
            )}

            <div className="flex items-center justify-between gap-4 mt-1">
              <p className={`text-[9px] leading-relaxed max-w-[70%] ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
                {rating === 5 
                  ? "ممنون از فیدبک مثبت شما! با زدن دکمه تایید، مدل استخراج فعلی را به عنوان الگوی ۱۰۰٪ صحیح قفل کنید."
                  : "سیستم با استفاده از پردازش زنده متن فوق، قوانین یادگیری جدید را استخراج و برای دفعات بعدی اعمال می‌کند."}
              </p>
              
              <button
                type="button"
                onClick={handleSubmitRating}
                disabled={isLoading}
                className={`px-4 py-2 rounded-xl text-[10.5px] font-black flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ${
                  isLoading 
                    ? "opacity-50 cursor-not-allowed bg-slate-300 text-slate-600"
                    : rating === 5
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/10"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/10"
                }`}
              >
                {isLoading ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>ثبت امتیاز و آموزش تطبیقی</span>
              </button>
            </div>
          </motion.div>
        )}

        {isSubmitted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`mt-3 p-3 rounded-xl border flex items-center justify-between ${
              isDarkMode ? "bg-emerald-950/15 border-emerald-500/20 text-emerald-400" : "bg-emerald-50 text-emerald-800 border-emerald-100"
            }`}
          >
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
              <div className="text-right">
                <p className="text-[11px] font-black">امتیاز و ارزیابی ممیزی شما برای این سند با موفقیت ثبت شد.</p>
                {learnedLogs && learnedLogs.count > 0 && (
                  <p className="text-[9.5px] mt-0.5 opacity-90 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
                    موتور یادگیری تطبیقی {learnedLogs.count} الگوی استخراج جدید برای اسکن‌های بعدی ذخیره کرد.
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-0.5 shrink-0">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star 
                  key={s} 
                  className={`w-3.5 h-3.5 ${s <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-slate-700"}`}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
