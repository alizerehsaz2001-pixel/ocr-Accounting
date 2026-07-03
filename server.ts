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
    const { image, mimeType, model, tokenSettings, userPrompt } = req.body;

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

۳. قوانین مالیاتی موضوعه ایران:
   - مالیات بر ارزش افزوده (VAT - موضوع قانون مالیات بر ارزش افزوده): فاکتورهای رسمی خرید یا فروش را بررسی فرمایید. اگر ارزش افزوده (مثلاً ۹٪ یا ۱۰٪ مصوب بر حسب سال مالی سند) به عنوان ردیف جداگانه آمده است، مبالغ آن را استخراج و در سطر مربوطه گزارش نمایید.

۴. تفکیک دقیق انواع متداول اسناد مالی و فاکتورها:
   - فاکتور خرید/فروش کالا (مشمول قانون تجارت): استخراج نام دقیق کالا، تعداد، فی (قیمت واحد)، تخفیفات و مالیات بر ارزش افزوده در هر سطر فاکتور الزامی است.
   - رسیدهای بانکی و دستگاه‌های کارت‌خوان (POS): استخراج شماره کارت، پایانه، کدرهگیری، شماره مرجع، نام پذیرنده و تفکیک انواع تراکنش (خرید، پرداخت قبض) الزامی است.

۵. استانداردهای پیشرفته حسابداری شماره ۱۶ (تسعیر ارز) و دارایی ثابت:
   - تسعیر ارز: در اسناد وارداتی یا صادراتی (Invoice / Proforma)، علاوه بر مبلغ ارزی، ذکر نرخ ارز (سامانه نیما، سنا، توافقی یا آزاد) و معادل ریالی ضروری است.
   - استهلاک دارایی‌ها: در فاکتورهای ماشین آلات و تجهیزات سنگین، چنانچه عمر مفید یا نرخ نزولی ذکر شده آن را در توضیحات منتقل نمایید.
   - مدیریت مبالغ ارزی و تسعیر: اگر فاکتور ارزی است (دلار، درهم، یورو)، مبلغ ارزی را به عنوان پایه ثبت کنید و اگر در سند نرخ تسعیر یا معادل ریالی ذکر شده، آن را در قسمت تفصیلی (شرح/توضیحات) بازنویسی کنید.
   - اصل بهای تمام شده تاریخی: کالاها و خدمات دقیقاً به مبلغ توافق و پرداخت شده ثبت شوند. هرگونه هزینه حمل و نقل (کرایه باربری)، بیمه طی راه و عوارض گمرکی مندرج در فاکتور باید به حساب بهای تمام شده موجودی کالا (حساب بدهکار) منظور گردد نه هزینه های جاری اداری.
   - مالیات حقوق و عوارض تکلیفی: در بررسی لیست حقوق و دستمزد یا قبوض پرداختی، کسورات قانونی شامل بیمه تامین اجتماعی (۷٪ سهم کارگر، ۲۳٪ سهم کارفرما) و مالیات تکلیفی را با دقت تفکیک و به حساب دارایی‌های مربوطه یا بستانکاران (سازمان‌های دولتی) تخصیص دهید.

۱۱. قوانین خزانه‌داری، چک‌های صیادی و تضامین:
   - چک‌های صیادی: استخراج دقیق تاریخ صدور، تاریخ سررسید، مبلغ حروفی و عددی (تطبیق این دو و اعلام مغایرت احتمالی در توضیحات)، شناسه صیادی ۱۶ رقمی، نام گیرنده و ذینفع، و مهر یا امضای ظهرنویسی (پشت‌نویسی).
   - ضمانت‌نامه‌ها: مبالغ ضمانت‌نامه‌های بانکی، کسور وجه‌الضمان (سپرده حسن انجام کار) و پیش‌دریافت‌ها در فاکتورهای صورت‌وضعیت پیمانکاری باید به تفکیک به عنوان حساب‌های انتظامی یا دریافتنی/پرداختنی غیرتجاری استخراج شوند.

۱۲. استانداردهای حسابرسی و شواهد (Auditing Standards):
   - کنترل‌های داخلی و شواهد: کنترل زنجیره تاییدات (امضای تنظیم‌کننده، تاییدکننده، تصویب‌کننده) در صورت‌وضعیت‌ها و فاکتورها. اسناد فاقد امضا یا ناقص را با لیبل "[نقص کنترل داخلی - فاقد امضا]" در توضیحات مشخص کنید.
   - تحریف‌های بااهمیت معدلات: بررسی صحت محاسبات (جمع عمودی و افقی فاکتورها). در صورت کشف مغایرت جمع مبالغ با مبلغ کل، مبلغ واقعی محاسبه شده توسط خود را یادداشت و مغایرت را در قسمت "توضیحات" به عنوان "[هشدار تحریف محاسباتی]" گزارش کنید.

۱۳. حسابداری پیشرفته و استاندارد شماره ۱۶ (تسعیر ارز):
   - تسعیر ارز: در اسناد وارداتی یا صادراتی (Invoice / Proforma)، علاوه بر مبلغ ارزی، ذکر نرخ ارز (سامانه نیما، سنا، توافقی یا بازار آزاد) و معادل ریالی. شناسایی سود و زیان تسعیر ارز در صورت تسویه حساب‌های ارزی باید به طور کامل ردیابی شود.
   - روش‌های استهلاک: در اسناد خرید دارایی‌های ثابت (ماشین‌آلات، ملک، تجهیزات)، هرگونه اشاره به ارزش اسقاط، عمر مفید یا نرخ نزولی را برای محاسبه استهلاک در توضیحات مستند کنید.

۱۴. تکنیک‌های تخصصی استخراج دست‌نویس‌های مخدوش و ناخوانای فارسی (Advanced Persian Handwriting OCR):در صورت داشتن تاریخ میلادی آن را تبدیل یا دقیق قید کنید.
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
۱. صد در صد داده‌های استخراج شده و تحلیل‌ها باید مستند به سند و فایل آپلود شده باشند. باید دقیقاً مطابق با چیزی که در تصویر می‌بینید تحلیل کنید و جیسون تحویل دهید. از گمانه‌زنی، فرضیه‌سازی یا تولید مقادیر خیالی خودداری نمایید (Anti-Hallucination). اگر فایلی ارسال نشده یا عاری از دیتای مالی است، فقط یک آبجکت پایه برگردانید.
۲. خروجی فقط و فقط یک آبجکت ساختار یافته JSON است. شرح متنی مجزا ارائه ندهید.
۳. در مواجهه با دست‌خط تند، شکسته یا مخدوش، ابتدا تا حد ممکن به قواعد کلمه، موقعیت سطر و موازنه مبالغ رجوع کنید. کلمات کاملاً ناخوانا به شکل "[ناخوانا]" ذخیره شوند.
۴. فرمت پاسخ برگشتی حتماً باید یک ساختار JSON معتبر منطبق بر سرفصل‌های معین باشد. آبجکت اصلی شامل کلیدهای "نوع_سند"، "تحلیل_سند" و "اقلام_تراکنش" باشد.
۵. تشخیص خودکار هزینه‌های غیرقابل قبول مالیاتی: چنانچه در فاکتور یا صورتحساب، ردیفی با عنوان «جریمه دیرکرد»، «خسارت تاخیر» یا موارد مشابه وجود داشت، این مبالغ را شناسایی کرده و فیلد "هزینه_غیرقابل_قبول" را برای آن سطر معادل true قرار دهید.`;

    let promptText = `لطفاً داده‌های موجود در تصویر یا سند پیوست شده را به دقت تحلیل کرده و نوع سند و محتوای آن‌را مطابق آن‌چه دقیقاً در تصویر می‌بینید در یک آبجکت JSON استخراج کنید و هیچ متنی خارج از JSON تولید نکنید.`;

    if (userPrompt && typeof userPrompt === "string" && userPrompt.trim()) {
      promptText += `\n\n[دستور اختصاصی حسابدار / کاربر برای استخراج]:\n${userPrompt}\nلطفا توجه ویژه‌ای به این دستور کاربر داشته باشید و ترجیحاً استخراج و تحلیل را بر مبنای این درخواست انجام دهید.`;
    }

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
          type: Type.OBJECT,
          properties: {
            نوع_سند: {
              type: Type.STRING,
              description: "نوع سند حسابداری (مانند فاکتور فروش، چک، رسید پرداختی، قبض مالیاتی، فیش حقوقی، صورتحساب بانکی، قرارداد، و غیره)",
            },
            تحلیل_سند: {
              type: Type.STRING,
              description: "تحلیل هوشمند و کلی در مورد کیفیت سند، ایرادات احتمالی ارقام، قواعد مالیاتی حاکم بر این نوع سند، و اطمینان کلی از صحت داده‌ها.",
            },
            ستون_ها: {
              type: Type.ARRAY,
              description: "لیست ستون‌های متناسب با این نوع سند. این ستون‌ها کاملا داینامیک هستند و بر اساس نوع سند (مثلا فاکتور نیاز به نام کالا، تعداد، فی، و مالیات دارد اما فیش واریزی نیاز به تاریخ، مبلغ، شماره پیگیری، مبدا و مقصد دارد) ساخته می‌شوند.",
              items: {
                type: Type.OBJECT,
                properties: {
                  کلید: { type: Type.STRING, description: "کلید انگلیسی یکتا برای این ستون (مانند quantity, item_name, date, amount, debit, credit)" },
                  عنوان: { type: Type.STRING, description: "عنوان فارسی برای نمایش به کاربر در جدول (مانند تعداد/مقدار, نام کالا, مبلغ کل, بدهکار)" },
                  نوع_داده: { type: Type.STRING, description: "نوع داده این ستون: number یا string" }
                },
                required: ["کلید", "عنوان", "نوع_داده"]
              }
            },
            ردیف_ها: {
              type: Type.ARRAY,
              description: "لیست اقلام و داده‌های استخراج شده متناسب با ستون‌های تعریف شده.",
              items: {
                type: Type.OBJECT,
                properties: {
                  ضریب_اطمینان: {
                    type: Type.INTEGER,
                    description: "درصد اطمینان از صحت استخراج این ردیف (بین 0 تا 100) براساس وضوح تصویر.",
                  },
                  فیلد_ها: {
                    type: Type.ARRAY,
                    description: "مقادیر استخراج شده برای این ردیف.",
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        کلید: { type: Type.STRING, description: "کلید انگلیسی ستون مربوطه (منطبق با ستون_ها)" },
                        مقدار: { type: Type.STRING, description: "مقدار استخراج شده (حتی اعداد به فرم رشته). در صورت خالی بودن null یا خالی." }
                      },
                      required: ["کلید"]
                    }
                  }
                },
                required: ["ضریب_اطمینان", "فیلد_ها"]
              }
            },
          },
          required: ["نوع_سند", "تحلیل_سند", "ستون_ها", "ردیف_ها"],
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
         const fallbackModels = ["gemini-3.5-flash", "gemini-3.1-pro-preview"];
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
    let parsedData: any = {};
    try {
      parsedData = JSON.parse(outputText);
    } catch (parseErr) {
      console.error("Failed to parse output json:", outputText);
      // Fallback: search for object in text if parsing failed due to markdown formatting
      const match = outputText.match(/\{([\s\S]*)\}/);
      if (match) {
        try {
            parsedData = JSON.parse(match[0]);
        } catch (e) {
            throw new Error("قالب پاسخ هوش مصنوعی نامعتبر بود. لطفاً دوباره تلاش نمایید.");
        }
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

// Pre-extraction chat endpoint
app.post("/api/chat-pre-extract", async (req, res) => {
  try {
    const { messages, image, mimeType, model } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
       return res.status(400).json({ error: "لیست پیام‌ها ارسال نشده است." });
    }
    
    const ai = getGeminiClient();
    const systemInstruction = "شما یک دستیار حسابدار هوشمند هستید. کاربر تصویری از یک سند مالی (فاکتور، فیش، چک و ...) آپلود کرده است. شما باید به سوالات کاربر در مورد این سند پاسخ دهید و در صورت نیاز راهنمایی کنید که چه چیزهایی از این سند قابل استخراج است. پس از این چت، داده‌ها در فرمت JSON استخراج خواهند شد. همیشه مودبانه، تخصصی و به زبان فارسی پاسخ دهید.";
    
    const formattedMessages = messages.map((msg: any, index: number) => {
      const msgParts: any[] = [{ text: msg.text }];
      // Attach the image to the last user message
      if (index === messages.length - 1 && msg.role === "user" && image) {
        msgParts.push({
          inlineData: {
            mimeType: mimeType || "image/png",
            data: image,
          },
        });
      }
      return {
        role: msg.role === "assistant" || msg.role === "model" ? "model" : "user",
        parts: msgParts,
      };
    });

    const selectedModel = model || "gemini-3.5-flash";

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: formattedMessages,
      config: {
        systemInstruction: systemInstruction,
      },
    });

    const tokensUsed = response.usageMetadata?.totalTokenCount || 0;

    res.json({ success: true, text: response.text, tokensUsed });
  } catch (error: any) {
    console.error("API Error in pre-extract chat:", error);
    res.status(500).json({ success: false, error: error.message || "خطای ناشناخته در پردازش پیام" });
  }
});

// Pre-extraction verification endpoint
app.post("/api/chat-verification", async (req, res) => {
  try {
    const { messages, image, mimeType, model } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
       return res.status(400).json({ error: "لیست پیام‌ها ارسال نشده است." });
    }
    
    const ai = getGeminiClient();
    const systemInstruction = "شما یک دستیار حسابدار هستید. کاربر با شما درباره یک سند مالی گفتگو کرده است. وظیفه شما این است که این گفتگو و تصویر سند را بررسی کرده و یک خلاصه برای کاربر تهیه کنید (Verification Summary). این خلاصه باید در یک فرمت ساختاریافته (مارک‌داون) باشد که شامل موجودیت‌های استخراج شده کلیدی مانند شناسه ملی (Tax ID)، تاریخ‌ها، نام شرکت‌ها یا افراد، و توافقات یا دستورالعمل‌های خاص استخراج باشد. این به کاربر اجازه می‌دهد قبل از تایید نهایی استخراج، مطمئن شود که سیستم خواسته‌های او را متوجه شده است.";
    
    const formattedMessages: any[] = messages.map((msg: any) => {
      return {
        role: msg.role === "assistant" || msg.role === "model" ? "model" : "user",
        parts: [{ text: msg.text }],
      };
    });
    
    // Add image as final context
    formattedMessages.push({
       role: "user",
       parts: [
         { text: "لطفاً با توجه به این گفتگو و این سند مالی، خلاصه تاییدیه استخراج (Verification Summary) را تهیه کن." },
         {
           inlineData: {
             mimeType: mimeType || "image/png",
             data: image,
           }
         }
       ]
    });

    const selectedModel = model || "gemini-3.5-flash";

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: formattedMessages,
      config: {
        systemInstruction: systemInstruction,
      },
    });

    res.json({ success: true, text: response.text });
  } catch (error: any) {
    console.error("API Error in verification chat:", error);
    res.status(500).json({ success: false, error: error.message || "خطای ناشناخته در بررسی و تایید" });
  }
});

// Advanced Persian ERP support chatbot assistant endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
       res.status(400).json({ error: "لیست پیام‌ها ارسال نشده است." });
       return;
    }

    const ai = getGeminiClient();

    const systemInstruction = `شما پشتیبان هوشمند و راهنمای تخصصی سیستم ممیزی، حسابداری هوشمند و اسکنر اسناد مالی ERP ما (تحت عنوان آنالیز تصویر پیشرفته) هستید.
وظیفه شما پاسخ‌دهی به تمامی سوالات کاربران درباره کارکرد نرم‌افزار، امکانات، سرفصل‌ها، نحوه استخراج فاکتورها، قوانین ارزش افزوده و مالیاتی اعمال شده در استخراج، و همچنین بخش‌های مختلف ماژول‌های ERP است.

اطلاعات کلیدی نرم‌افزار جهت راهنمایی کاربر:
۱. آنالیز تصویر پیشرفته (سرویس اصلی): با استفاده از هوش مصنوعی قدرتمند Gemini، عکس یا فایل PDF فاکتور، رسید پوز، چک صیادی، فیش واریزی یا سند مالیاتی را بارگذاری کرده و سیستم به طور کامل اطلاعات شامل اقلام تراکنش، بدهکار/بستانکار، ارزش افزوده، شناسه مودیان و ضریب اطمینان را استخراج می‌کند.
۲. موازنه دوطرفه: جمع کل ستون‌های بدهکار و بستانکار فاکتور باید برابر باشد. اگر اختلافی باشد، سیستم هشدار می‌دهد تا ردیف‌های با ضریب اطمینان ضعیف ویرایش شوند.
۳. تب‌ها:
   - آنالیز تصویر پیشرفته: جدول اقلام و تحلیل سند، دکمه‌های تایید گروهی و انفرادی (که ضریب اطمینان را ۱۰۰٪ می‌کنند).
   - آرایه خام JSON: برای کپی کردن اطلاعات ساختاریافته استخراج شده.
   - خروجی اکسل پیشرفته: تبدیل مستقیم داده‌های استخراج شده یا آرایه JSON دلخواه به فایل اکسل استاندارد و دانلود آن.
۴. ماژول‌های هوشمند ERP در منوی راست (در حال ساخت و ساز):
   - حسابداری مالی و دفتر کل (هسته مرکزی)
   - خزانه‌داری (دریافت و پرداخت)
   - خرید و فروش (بازرگانی)
   - انبارداری و کنترل موجودی
   - حقوق و دستمزد
   - دارایی‌های ثابت (اموال)
   - مالیات و تکالیف قانونی
   - گزارش‌گیری پیشرفته و داشبورد مدیریتی
   - امنیت و کنترل دسترسی کاربران
   با کلیک بر روی هرکدام پیغام "بزودی و در حال ساخت و ساز" نمایش داده می‌شود.
۵. راهنمای صوتی و دستیار متنی: امکان فیلتر کردن هوشمند، پاکسازی تاریخچه، تنظیمات کنترل توکن‌ها (بهینه سازی حجم خروجی) وجود دارد.

لطفاً همیشه به زبان فارسی، بسیار مودبانه، حرفه‌ای و صمیمانه پاسخ دهید. از بکار بردن فرمت‌های نامناسب خودداری کنید و پاسخ‌ها را خوانا بنویسید.`;

    const contents = messages.map((msg: any) => ({
      role: msg.role === "assistant" || msg.role === "model" ? "model" : "user",
      parts: [{ text: msg.text }],
    }));

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
      },
    });

    res.json({ success: true, text: response.text });
  } catch (error: any) {
    console.error("API Error in chat:", error);
    res.status(500).json({ success: false, error: error.message || "خطای ناشناخته در پردازش پیام" });
  }
});

// Interface for validating voucher mapping
interface VoucherLineInput {
  account_id: string;
  detailed_account_id?: string;
  debit: number;
  credit: number;
  description: string;
}

interface AccountDetailedLinkInput {
  account_id: string;
  detailed_account_id: string;
}

/**
 * تابعی در بکاند که صحت ارتباط حساب‌های تفصیلی و معین را در آرتیکل‌های سند حسابداری بررسی می‌کند
 * این تابع از جدول واسط (links) برای تایید همخوانی تفصیلی شناور و معین استفاده می‌کند.
 */
export function validateVoucherMapping(
  lines: VoucherLineInput[],
  links: AccountDetailedLinkInput[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!lines || !Array.isArray(lines)) {
    return { valid: false, errors: ["اقلام سند یافت نشد یا آرایه نامعتبر است."] };
  }

  // اگر پیوندها فرستاده نشده باشند، یک آرایه خالی فرض می‌کنیم
  const safeLinks = Array.isArray(links) ? links : [];

  lines.forEach((line, index) => {
    const rowNum = index + 1;
    const accountId = line.account_id;
    const detailedId = line.detailed_account_id;

    if (accountId) {
      // آیا این حساب معین اصلاً هیچ تفصیلی شناور متصلی در جدول واسطه دارد؟
      const hasAnyLinks = safeLinks.some(link => link.account_id === accountId);

      if (detailedId) {
        // تفصیلی شناور انتخاب شده است؛ پس باید حتما در جدول واسطه به این معین لینک شده باشد
        const isAllowed = safeLinks.some(
          link => link.account_id === accountId && link.detailed_account_id === detailedId
        );

        if (!isAllowed) {
          errors.push(
            `سطر ${rowNum}: حساب تفصیلی شناور انتخاب شده مجاز به تخصیص به این حساب معین نیست.`
          );
        }
      } else if (hasAnyLinks) {
        // تفصیلی انتخاب نشده ولی طبق جدول واسط برای این معین، انتخاب تفصیلی الزامی است
        errors.push(
          `سطر ${rowNum}: برای حساب معین انتخاب شده، انتخاب حساب تفصیلی شناور الزامی است.`
        );
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

// API endpoint to validate voucher detailed accounts mapping
app.post("/api/vouchers/validate", (req, res) => {
  try {
    const { lines, links } = req.body;
    
    const result = validateVoucherMapping(lines, links);
    
    res.json({
      success: true,
      valid: result.valid,
      errors: result.errors
    });
  } catch (error: any) {
    console.error("خطا در اجرای تابع اعتبارسنجی نگاشت تفصیلی بکاند:", error);
    res.status(500).json({
      success: false,
      error: error.message || "خطای ناشناخته در اجرای تابع اعتبارسنجی بکاند"
    });
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
