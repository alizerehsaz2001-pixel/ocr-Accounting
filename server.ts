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
    const { image, mimeType, model, tokenSettings } = req.body;

    if (!image) {
       res.status(400).json({ error: "تصویر سند ارسال نشده است." });
       return;
    }

    const ai = getGeminiClient();

    // Dynamically select target backend model based on user's selection panel
    const allowedModels = [
      "gemini-3.5-flash",
      "gemini-3.1-pro-preview"
    ];
    let selectedModel = allowedModels.includes(model) ? model : "gemini-3.5-flash";

    // Fallback mapping for unsupported or quota-exhausted preview models
    const fallbackMap: Record<string, string> = {
      "gemini-3.1-pro-preview": "gemini-1.5-pro"
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

۶. قوانین مالیاتی و حقوقی پیشرفته (قانون مالیات‌های مستقیم و قانون پایانه های فروشگاهی):
   - قانون پایانه‌های فروشگاهی و سامانه مودیان: تمام فاکتورهای استاندارد جدید دارای شماره منحصر به فرد مالیاتی (۲۲ کاراکتری) هستند که باید با دقت کامل و بدون یک رقم جابجایی استخراج شود.
   - ماده ۱۳۱ و ۱۰۵ قانون مالیات‌های مستقیم: تشخیص نوع موجودیت (شخص حقیقی یا حقوقی) از روی نوع فاکتور و کد ملی/شناسه ملی جهت اعمال نرخ‌های مربوطه.
   - مالیات تکلیفی و بیمه (ماده ۸۶ ق.م.م و ماده ۳۸ قانون تامین اجتماعی): در اسناد مرتبط با خدمات پیمانکاری یا حق‌الزحمه، استخراج دقیق مبالغ کسر شده به عنوان کسورات قانونی (سپرده حسن انجام کار، بیمه، مالیات تکلیفی ۵٪ یا ۱۰٪) الزامی است و باید در ستون بستانکاران غیرتجاری تفکیک شود.
   - قانون تجارت (مواد ۶ تا ۱۴): الزام به پلمب دفاتر تجاری و تطبیق تاریخ اسناد رویدادهای مالی به ترتیب وقوع در دفتر روزنامه. از ثبت هرگونه رویداد در تاریخ‌های مخدوش، نامنظم یا پس و پیش خودداری نمایید و در صورت مشاهده خط‌خوردگی در تاریخ، آن را با لیبل "[عدم تطابق با ماده ۱۴ ق.ت]" علامت‌گذاری کنید.

۷. تکالیف ارزش افزوده و صورت‌حساب‌های الکترونیک:
   - در صورت‌حساب‌های الکترونیکی نوع اول، دوم و سوم، استخراج مبالغ قبل از تخفیف، مبلغ تخفیف، مبلغ پس از تخفیف، نرخ مالیات و عوارض ارزش افزوده مستند به ردیف‌های کالا/خدمت به صورت مجزا، حیاتی است تا مغایرتی با سامانه مودیان رخ ندهد.

۸. قوانین تکمیلی و اصول حسابداری ایران:
   - تفکیک دقیق تخفیفات (Discounts): تخفیفات تجاری به عنوان کاهنده بهای تمام شده کالا مستقیماً در مبلغ خالص محاسبه شود. اما تخفیفات نقدی باید تحت سرفصل جداگانه "تخفیفات نقدی خرید/فروش" ثبت گردد.
   - اصل افشاء حقایق (Full Disclosure): هرگونه خط‌خوردگی، مهر ابطال شد، مهر پرداخت شد، امضای کسری، یا پشت‌نویسی چک‌ها مشهود در سند را فوراً شناسایی و در ستون "توضیحات" با حساسیت بالا قید کنید.
   - مدیریت مبالغ ارزی و تسعیر: اگر فاکتور ارزی است (دلار، درهم، یورو)، مبلغ ارزی را به عنوان پایه ثبت کنید و اگر در سند نرخ تسعیر یا معادل ریالی ذکر شده، آن را در قسمت تفصیلی (شرح/توضیحات) بازنویسی کنید.
   - اصل بهای تمام شده تاریخی: کالاها و خدمات دقیقاً به مبلغ توافق و پرداخت شده ثبت شوند. هرگونه هزینه حمل و نقل (کرایه باربری)، بیمه طی راه و عوارض گمرکی مندرج در فاکتور باید به حساب بهای تمام شده موجودی کالا (حساب بدهکار) منظور گردد نه هزینه های جاری اداری.
   - مالیات حقوق و عوارض تکلیفی: در بررسی لیست حقوق و دستمزد یا قبوض پرداختی، کسورات قانونی شامل بیمه تامین اجتماعی (۷٪ سهم کارگر، ۲۳٪ سهم کارفرما) و مالیات تکلیفی را با دقت تفکیک و به حساب دارایی‌های مربوطه یا بستانکاران (سازمان‌های دولتی) تخصیص دهید.

۹. تکنیک‌های تخصصی استخراج دست‌نویس‌های مخدوش و ناخوانای فارسی (Advanced Persian Handwriting OCR):
   - تحلیل بافتاری و معنایی (Contextual Analysis): در صورتی که کلمه‌ای مخدوش یا بدخط است، با توجه به کلمات پیشین و پسین، سرفصل فرم و ماهیت صنف، محتمل‌ترین کلمه معنی‌دار را استخراج کنید (به عنوان مثال، در یک فاکتور خدمات خودرویی، کلمه چسبیده و ناخوانای شبیه "فیلتـ" قطعا "فیلتر" است).
   - تحلیل ساختار کلمات در خط تحریری و شکسته: در دست‌خط‌های سریع و اداری ایرانی، پیوستگی حروف، حذف دندانه‌ها (ط، ظ، س، ش) و جابجایی یا ادغام نقاط (ب، پ، ت، ی) بسیار شایع است. کلمه را بر اساس کلیت هندسی (Gestalt) و الگوهای کلمات رایج مالی استخراج کنید.
   - کشیدگی‌ها و الگوهای متصل: کلماتی نظیر "بابت"، "چک"، "نقدی"، "تنخواه"، "علی‌الحساب"، "مساعده"، "بدهکار"، "بستانکار" و واحدهای پولی اغلب با کشیدگی ممتد یا چسباندن حروف نوشته می‌شوند. در خوانش این الگوها دقت مضاعف داشته باشید.
   - اعداد دست‌نویس سریع و صفرهای متوالی: در نوشتار سریع، صفرهای متوالی اغلب به صورت یک خط موج‌دار یا ممتد کشیده می‌شوند. همچنین ابهام بین اعداد ۲ و ۳ یا ۲ و ۴ رایج است. در مواجهه با این موارد، حتماً از طریق موازنه ریاضی و جمع کل فاکتور (مهندسی معکوس)، رقم صحیح و تعداد صفرها را قطعی کنید.

قوانین مطلق و غیرقابل تخطی OCR:
۱. صد در صد داده‌های استخراج شده باید مستند به فایل آپلود شده باشند. از گمانه‌زنی، فرضیه‌سازی یا تولید تراکنش‌های خیالی خودداری نمایید (Anti-Hallucination). اگر فایلی ارسال نشده یا عاری از دیتای مالی است، فقط یک لیست تهی [] برگردانید.
۲. از آوردن هرگونه توضیح متنی اضافه قبل یا بعد از JSON خودداری کنید. خروجی فقط و فقط یک آرایه سازمان یافته JSON است.
۳. در مواجهه با دست‌خط تند، شکسته یا مخدوش شکاری، تا حد ممکن به قواعد کلمه، موقعیت سطر و موازنه مبالغ رجوع کنید تا بهترین خوانی را داشته باشید. کلمات مطلقاً ناخوانا به شکل "[ناخوانا]" ذخیره شوند.
۴. فرمت پاسخ برگشتی حتماً باید یک آرایه JSON معتبر منطبق بر سرفصل‌های معین باشد با کلیدهای فارسی زیر (دقیقاً با همین نام‌ها):
   "تاریخ", "شماره_سند", "نام_طرف_حساب", "شرح", "مبلغ_بدهکار", "مبلغ_بستانکار", "نوع_ارز", "توضیحات", "ضریب_اطمینان"`;

    let promptText = `لطفاً داده‌های موجود در تصویر پیوست شده را با رعایت بی‌نقص استانداردهای حسابداری، عینا و بدون هیچ اضافات، در قالب یک لیست JSON استخراج کن. هیج متنی خارج از JSON تولید نکن.`;

    if (tokenSettings) {
      if (tokenSettings.ecoPromptEnabled) {
        promptText += `\n[تنبيه کاهش هزینه توکن خروجی]: لطفاً متن داخل فیلدهای «شرح» و «توضیحات» را تا حد ممکن بسیار کوتاه و زیر ۵ کلمه نگه دارید. از ایجاد متون طولانی جهت ذخیره توکن اکیداً خودداری کنید.`;
      }
      if (tokenSettings.maxRowsToExtract && tokenSettings.maxRowsToExtract !== "unlimited") {
        promptText += `\n[محدودیت تعداد سطر]: فقط حداکثر ${tokenSettings.maxRowsToExtract} سطر ابتدایی فاکتور را برای خروجی خوانش کنید تا بقیه اقلام جهت صرفه‌جویی توکن استخراج نشوند.`;
      }
      if (tokenSettings.skipSecondaryFields) {
        promptText += `\n[فشرده‌سازی فیلدهای خالی]: برای ستون‌هایی مانند «توضیحات» یا «شماره_سند» در صورتی که فاقد محتوای صریح هستند حتما مقدار null بگذارید تا فاکتور پاسخ خروجی فشرده بماند.`;
      }
    }

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
              تاریخ: {
                type: Type.STRING,
                description: "تاریخ تراکنش یا سند (مثلاً ۱۴۰۲/۱۲/۰۵). اگر وجود نداشت یا ناخوانا بود null بگذارید. همیشه به زبان فارسی/شمسی بنویسید اگر در مدرک به همین شکل است.",
              },
              شماره_سند: {
                type: Type.STRING,
                description: "شماره سند یا شماره پیگیری تراکنش. در صورت وجود ثبت گردد، در غیر این صورت null.",
              },
              نام_طرف_حساب: {
                type: Type.STRING,
                description: "نام خریدار، فروشنده، شرکت یا شخص طرف حساب تراکنش.",
              },
              شرح: {
                type: Type.STRING,
                description: "شرح یا بابت تراکنش (مثلاً خرید لوازم یدکی، دریافت بابت تسویه حساب). اگر ناخوانا بود null.",
              },
              مبلغ_بدهکار: {
                 type: Type.NUMBER,
                 description: "مبلغ بدهکار به صورت عددی خالص بدون کاراکتر اضافی و جداکننده هزارگان. مقدار پیش فرض 0.",
              },
              مبلغ_بستانکار: {
                 type: Type.NUMBER,
                 description: "مبلغ بستانکار به صورت عددی خالص بدون کاراکتر اضافی و جداکننده هزارگان. مقدار پیش فرض 0.",
              },
              نوع_ارز: {
                type: Type.STRING,
                description: "نوع ارز مثل ریال، تومان، دلار، یورو. اگر ذکر نشده ریال پیش‌فرض است.",
              },
              توضیحات: {
                type: Type.STRING,
                description: "توضیحات اضافه نظیر شماره چک، خط خوردگی ها، کسورات قانونی یا شرایط پرداخت.",
              },
              ضریب_اطمینان: {
                type: Type.INTEGER,
                description: "درصد اطمینان از صحت استخراج این ردیف (بین 0 تا 100) براساس وضوح تصویر و دست‌خط.",
              },
            },
            required: ["تاریخ", "شماره_سند", "نام_طرف_حساب", "شرح", "مبلغ_بدهکار", "مبلغ_بستانکار", "نوع_ارز", "توضیحات", "ضریب_اطمینان"],
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
         console.log("Retrying with fallback models...");
         const fallbackModels = ["gemini-1.5-flash", "gemini-1.5-pro"];
         let fallbackSuccess = false;
         let lastError = apiError;
         
         for (const model of fallbackModels) {
           if (model === selectedModel) continue; // Skip if it was already the selected model
           console.log(`Trying fallback model: ${model}...`);
           generateConfig.model = model;
           try {
             response = await ai.models.generateContent(generateConfig);
             fallbackSuccess = true;
             console.log(`Fallback with ${model} succeeded.`);
             break;
           } catch (fallbackError: any) {
             console.error(`Fallback retry with ${model} failed:`, fallbackError.message || fallbackError);
             lastError = fallbackError;
           }
         }
         
         if (!fallbackSuccess) {
           throw lastError;
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
      cachedContentTokenCount: response.usageMetadata?.cachedContentTokenCount || 0,
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
