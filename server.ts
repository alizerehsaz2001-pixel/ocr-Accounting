import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// High limits for handling high-resolution document uploads
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ limit: "25mb", extended: true }));

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("کلید API جمینای (GEMINI_API_KEY) در سرور یافت نشد. لطفا در پنل Secrets یا فایل .env کلید معتبر تنظیم کنید.");
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Persian/Farsi financial documents extraction endpoint
app.post("/api/extract", async (req, res) => {
  try {
    const { image, mimeType, model } = req.body;

    if (!image) {
       res.status(400).json({ error: "تصویر سند ارسال نشده است." });
       return;
    }

    const ai = getGeminiClient();

    // Dynamically select target backend model based on user's selection panel
    const allowedModels = [
      "gemini-3.5-flash",
      "gemini-3.1-pro-preview",
      "gemini-3.1-flash-lite",
      "gemini-2.5-flash-image"
    ];
    let selectedModel = allowedModels.includes(model) ? model : "gemini-3.5-flash";

    // Fallback mapping for unsupported or quota-exhausted preview models
    const fallbackMap: Record<string, string> = {
      "gemini-3.1-pro-preview": "gemini-2.5-pro",
      "gemini-2.5-flash-image": "gemini-2.5-flash",
    };

    if (fallbackMap[selectedModel]) {
      selectedModel = fallbackMap[selectedModel];
    }

    // Specific strict instructions tailored to Persian accounting standards and system instructions
    const systemInstruction = `شما یک حسابدار رسمی (CPA)، ممیز مالیاتی خبره، حسابرس ارشد و موتور هوش مصنوعی OCR هستید که با تمام اصول حسابداری عمومی پذیرفته شده (GAAP)، استانداردهای حسابداری ایران (مصوب سازمان حسابرسی)، ماهیت حساب‌ها (بدهکار/بستانکار) و فرآیندهای مالیاتی کشور آشنایی و تسلط کامل دارید.

وظیفه شما استخراج دقیق، سازمان‌دهی، ممیزی و بازبینی اسناد مالی، فاکتورها، صورت‌حساب‌ها، فیشهای واریزی، اسناد دست‌نویس کارگاه‌ها، دفاتر کل/معین/روزنامه و حسابرسی خط به خط اقلام است.

راهنمای جامع تخصصی، قوانین و اصول حسابداری ایران و استانداردهای حسابرسی که باید به طور کامل روی سند پیاده کنید:

۱. ساختار کدینگ و سرفصل حساب‌ها (Ledger Hierarchy):
   در تحلیل اسناد، ماهیت اقلام را با توجه به ساختار استاندارد کدینگ حسابداری ایران در سطح گروه حساب، حساب کل، حساب معین و تفصیلی ردیابی و دسته بندی کنید:
   - گروه دارایی‌های جاری (صندوق، بانک، حساب‌های دریافتنی تجاری، موجودی کالا) -> ماهیت بدهکار (بستانکارشدن به معنای کاهش).
   - سرمایه و بدهی‌ها (حساب‌های پرداختنی تجاری، پیش‌دریافت‌ها، حقوق صاحبان سهام) -> ماهیت بستانکار (بدهکارشدن به معنای کاهش).
   - هزینه‌ها (هزینه اداری و عمومی، هزینه حقوق و دستمزد، هزینه استهلاک، هزینه اجاره) -> ماهیت همیشه بدهکار.
   - درآمدها (درآمد فروش کالا، درآمد ارائه خدمات) -> ماهیت همیشه بستانکار.

۲. قاعده موازنه دوطرفه و تراز سند (Double-Entry Bookkeeping Principles):
   - هر رویداد مالی اثر دوطرفه دارد. در استخراج داده موازنه بدهکار (Debit) و بستانکار (Credit) کل سند باید برقرار باشد.
   - در صورتحساب‌ها یا فاکتورها، جمع اقلام خریداری‌شده همراه مالیات ارزش افزوده بدهکار می‌شود و در طرف مقابل صندوق یا حساب‌های پرداختنی (بستانکاران) به همان میزان بستانکار می‌گردند.
   - اسناد حسابداری واصله را طوری بازنگری کنید که هیچ عدم توازی عددی رخ ندهد. در صورت عدم ذکر موازنه صریح در مدرک خام، با توجه به ماهیت تراکنش (مثلاً خرید به بدهکار، پرداخت نقدی به بستانکار) ستون بدهکار و بستانکار را با دقت ریاضی ثبت نمایید.

۳. قوانین مالیاتی موضوعه ایران:
   - مالیات بر ارزش افزوده (VAT - موضوع قانون مالیات بر ارزش افزوده): فاکتورهای رسمی خرید یا فروش را بررسی فرمایید. اگر ارزش افزوده (مثلاً ۹٪ یا ۱۰٪ مصوب بر حسب سال مالی سند) به عنوان ردیف جداگانه آمده است، آن را با عنوان سرفصل جداگانه مانند "جاری مالیاتی - ارزش افزوده خرید/فروش" تفکیک کرده و مبالغ آن را استخراج و در سطر مربوطه گزارش نمایید.
   - ماده ۱۶۹ قانون مالیات‌های مستقیم (معاملات فصلی): اطلاعات هویتی شامل "کد اقتصادی"، "شناسه ملی" (برای اشخاص حقوقی)، "کد ملی" (برای اشخاص حقیقی)، "کد پستی" و آدرس خریدار و فروشنده را با وسواس استخراج کنید و در بخش Remarks یا توضیحات ردیف‌های مربوطه به عنوان اسناد ارزیابی درج کنید تا گزارش فصلی معتبر قابل رهگیری باشد.
   - ماده ۱۴۷ و ۱۴۸ قانون مالیات‌های مستقیم (هزینه‌های قابل قبول مالیاتی): هزینه‌های مندرج در اسناد را ارزیابی ممیزی کنید. در صورتی که هزینه‌ای خارج از چهارچوب عرف تجاری یا سقف قانونی باشد (مثلا خرید فاقد فاکتور رسمی بدون کداقتصادی)، در ستون Remarks بنویسید: "نیاز به بررسی ممیزی م.۱۴۷".

۴. تفکیک دقیق انواع متداول اسناد مالی و فاکتورها:
   - فاکتور خرید/فروش کالا (مشمول قانون تجارت): استخراج نام دقیق کالا، تعداد، فی (قیمت واحد)، تخفیف تجاری، مبلغ کل ردیف، ارزش افزوده ردیف، و مبلغ نهایی قابل پرداخت.
   - فیش واریز نقدی/حواله پایا/ساتنا/کارت به کارت: استخراج شناسه واریز، شماره پیگیری/مرجع، نام بانک مبدا و مقصد، نام واریزکننده و ذینفع، تاریخ دقیق ساعت و ثانیه. سرفصل بانک بدهکار و طرف حساب بستانکار طبقه‌بندی می‌شود.
   - برگه تنخواه گردان یا دست نویس‌های هزینه فوری کارگاهی: این اسناد معمولا فاقد کدهای رسمی مالیاتی هستند اما از نظر بهای تمام شده اهمیت دارند. تمام اقلام ریز اعم از خرید ناهار، بنزین، ملزومات مصرفی اداری را خط به خط تفکیک کنید.

۵. استانداردسازی تاریخی و محاسباتی:
   - تاریخ شمسی: تمام تاریخ‌های مندرج باید به فرمت استاندارد شمسی (سال/ماه/روز به صورت چهار رقمی و دو رقمی مثل ۱۴۰۲/۱۲/۲۹) تبدیل یا یکپارچه شوند. در صورت داشتن تاریخ میلادی آن را تبدیل یا دقیق قید کنید.
   - اعداد بدون نقص ریاضی: تمام مبالغ پولی (ریال یا تومان) باید به فرکشن دقیق فاقد نمادهای ریال و تومان و فاقد ویرگول جداکننده (مثلا ۱۲,۵۰۰,۰۰۰ ریال به صورت عدد خالص 12500000) استخراج شوند. دقت کنید که ریال و تومان در اسناد اشتباه گرفته نشوند؛ واحد رسمی ثبت دفاتر ریال است.

۶. تکنیک‌های تخصصی استخراج دست‌نویس‌های مخدوش و ناخوانای فارسی (Advanced Persian Handwriting OCR):
   - تحلیل بافتاری و معنایی (Contextual Analysis): در صورتی که کلمه‌ای مخدوش یا بدخط است، با توجه به کلمات پیشین و پسین، سرفصل فرم و ماهیت صنف، محتمل‌ترین کلمه معنی‌دار را استخراج کنید (به عنوان مثال، در یک فاکتور خدمات خودرویی، کلمه چسبیده و ناخوانای شبیه "فیلتـ" قطعا "فیلتر" است).
   - تحلیل ساختار کلمات در خط تحریری و شکسته: در دست‌خط‌های سریع و اداری ایرانی، پیوستگی حروف، حذف دندانه‌ها (ط، ظ، س، ش) و جابجایی یا ادغام نقاط (ب، پ، ت، ی) بسیار شایع است. کلمه را بر اساس کلیت هندسی (Gestalt) و الگوهای کلمات رایج مالی استخراج کنید.
   - کشیدگی‌ها و الگوهای متصل: کلماتی نظیر "بابت"، "چک"، "نقدی"، "تنخواه"، "علی‌الحساب"، "مساعده"، "بدهکار"، "بستانکار" و واحدهای پولی اغلب با کشیدگی ممتد یا چسباندن حروف نوشته می‌شوند. در خوانش این الگوها دقت مضاعف داشته باشید.
   - اعداد دست‌نویس سریع و صفرهای متوالی: در نوشتار سریع، صفرهای متوالی اغلب به صورت یک خط موج‌دار یا ممتد کشیده می‌شوند. همچنین ابهام بین اعداد ۲ و ۳ یا ۲ و ۴ رایج است. در مواجهه با این موارد، حتماً از طریق موازنه ریاضی و جمع کل فاکتور (مهندسی معکوس)، رقم صحیح و تعداد صفرها را قطعی کنید.

قوانین مطلق و غیرقابل تخطی OCR:
۱. صد در صد داده‌های استخراج شده باید مستند به فایل آپلود شده باشند. از گمانه‌زنی، فرضیه‌سازی یا تولید تراکنش‌های خیالی خودداری نمایید (Anti-Hallucination). اگر فایلی ارسال نشده یا عاری از دیتای مالی است، فقط یک لیست تهی [] برگردانید.
۲. از آوردن هرگونه توضیح متنی اضافه قبل یا بعد از JSON خودداری کنید. خروجی فقط و فقط یک آرایه سازمان یافته JSON است.
۳. در مواجهه با دست‌خط تند، شکسته یا مخدوش شکاری، تا حد ممکن به قواعد کلمه، موقعیت سطر و موازنه مبالغ رجوع کنید تا بهترین خوانی را داشته باشید. کلمات مطلقاً ناخوانا به شکل "[ناخوانا]" ذخیره شوند.
۴. فرمت پاسخ برگشتی حتماً باید یک آرایه JSON معتبر منطبق بر سرفصل‌های معین باشد با کلیدهای انگلیسی زیر:
   Date, Description, Debit, Credit, Remarks, ConfidenceScore`;

    const promptText = `لطفاً داده‌های موجود در تصویر پیوست شده را با رعایت بی‌نقص استانداردهای حسابداری، عینا و بدون هیچ اضافات، در قالب یک لیست JSON استخراج کن. هیج متنی خارج از JSON تولید نکن.`;

    const imagePart = {
      inlineData: {
        mimeType: mimeType || "image/png",
        data: image, // base64 string
      },
    };

    const textPart = {
      text: promptText,
    };

    let response;
    const generateConfig = {
      model: selectedModel,
      contents: { parts: [imagePart, textPart] },
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              Date: {
                type: Type.STRING,
                description: "تاریخ تراکنش یا سند (مثلاً ۱۴۰۲/۱۲/۰۵). اگر وجود نداشت یا ناخوانا بود null بگذارید. همیشه به زبان فارسی/شمسی بنویسید اگر در مدرک به همین شکل است.",
              },
              Description: {
                type: Type.STRING,
                description: "شرح یا بابت تراکنش (مثلاً خرید لوازم یدکی، دریافت بابت تسویه حساب). اگر ناخوانا بود null بگذارید.",
              },
              Debit: {
                type: Type.NUMBER,
                description: "مبلغ بدهکار به صورت عددی خالص و بدون هیچ کاراکتر اضافی، کاملاً به فرمت عددی و ریاضی بدون جداکننده هزارگان. اگر مقداری نداشت 0 بگذارید و اگر ناخوانا بود null بگذارید.",
              },
              Credit: {
                type: Type.NUMBER,
                description: "مبلغ بستانکار به صورت عددی خالص و بدون هیچ کاراکتر اضافی، کاملاً به فرمت عددی و ریاضی بدون جداکننده هزارگان. اگر مقداری نداشت 0 بگذارید و اگر ناخوانا بود null بگذارید.",
              },
              Remarks: {
                type: Type.STRING,
                description: "توضیحات اضافه نظیر شماره چک، شماره سند، نام دریافت‌کننده یا فیش بانکی. اگر فاقد توضیح بود null بگذارید.",
              },
              ConfidenceScore: {
                type: Type.INTEGER,
                description: "درصد میزان اطمینان از صحت استخراج کل این ردیف (بین 0 تا 100) بر اساس خوانایی و کیفیت خطوط و ارقام در تصویر. برای مقادیر خوانای فاکتورهای مرتب نمره بالا و برای دست‌نوشته‌های مخدوش نمره پایین‌تر اختصاص دهید.",
              },
            },
            required: ["Date", "Description", "Debit", "Credit", "Remarks", "ConfidenceScore"],
          },
        },
      },
    };

    try {
      response = await ai.models.generateContent(generateConfig);
    } catch (apiError: any) {
      console.error(`Attempt failed with model ${selectedModel}:`, apiError.message || apiError);
      const errorMessage = (apiError.message || "").toLowerCase();
      if (
        apiError.status === "RESOURCE_EXHAUSTED" || 
        apiError.status === 429 || 
        apiError.status === "UNAVAILABLE" ||
        apiError.status === 503 ||
        apiError.status === 500 ||
        apiError.status === "INTERNAL" ||
        errorMessage.includes("quota") ||
        errorMessage.includes("limit") ||
        errorMessage.includes("exhausted") ||
        errorMessage.includes("demand") ||
        errorMessage.includes("temporary") ||
        errorMessage.includes("unavailable")
      ) {
         console.log("Retrying with gemini-2.5-flash as fallback...");
         generateConfig.model = "gemini-2.5-flash";
         try {
           response = await ai.models.generateContent(generateConfig);
         } catch (fallbackError: any) {
           console.error("Fallback retry with gemini-2.5-flash also failed:", fallbackError.message || fallbackError);
           throw fallbackError;
         }
      } else {
         throw apiError;
      }
    }

    const outputText = response.text || "[]";
    let parsedData = [];
    try {
      parsedData = JSON.parse(outputText);
    } catch (parseErr) {
      console.error("Failed to parse output json:", outputText);
      // Fallback: search for array in text if parsing failed due to markdown formatting
      const match = outputText.match(/\[([\s\S]*)\]/);
      if (match) {
        parsedData = JSON.parse(match[0]);
      } else {
        throw new Error("قالب پاسخ هوش مصنوعی نامعتبر بود. لطفاً دوباره تلاش نمایید.");
      }
    }

    const tokensUsed = response.usageMetadata?.totalTokenCount || 0;
    const tokenDetails = {
      promptTokenCount: response.usageMetadata?.promptTokenCount || 0,
      candidatesTokenCount: response.usageMetadata?.candidatesTokenCount || 0,
      totalTokenCount: response.usageMetadata?.totalTokenCount || 0,
    };

    res.json({ success: true, data: parsedData, tokensUsed, tokenDetails });
  } catch (error: any) {
    console.error("API Error in extraction:", error);
    res.status(500).json({ success: false, error: error.message || "خطای ناشناخته در پردازش فایل" });
  }
});

// Setup dev server with Vite, otherwise serve built outputs in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running in ${process.env.NODE_ENV || "development"} mode on http://localhost:${PORT}`);
  });
}

startServer();
