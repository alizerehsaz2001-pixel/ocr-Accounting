import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import dotenv from "dotenv";
import { enrichJSONWithWords } from "./src/utils/numberToPersianWords";
import { AsyncLocalStorage } from "async_hooks";
import fs from "fs";
import {
  BASE_ACCOUNTING_OCR_SYSTEM_INSTRUCTION,
  PDF_TO_MARKDOWN_SYSTEM_INSTRUCTION,
  DUAL_PASS_AUDIT_SYSTEM_INSTRUCTION,
  AUDIT_REPAIR_SYSTEM_INSTRUCTION,
  ML_FEEDBACK_SYSTEM_INSTRUCTION,
  PRE_EXTRACT_CHAT_SYSTEM_INSTRUCTION,
  CHAT_VERIFICATION_SYSTEM_INSTRUCTION,
  DOCUMENT_EXCLUSIVE_CHAT_SYSTEM_INSTRUCTION,
  ERP_SUPPORT_SYSTEM_INSTRUCTION,
  AUTO_CATEGORIZE_SYSTEM_INSTRUCTION
} from "./src/server/systemInstructions";

dotenv.config();

const app = express();
const PORT = 3000;

const apiKeyStorage = new AsyncLocalStorage<string>();

// Security Hardening: Disable Express signature header
app.disable("x-powered-by");

// Security Headers Middleware (OWASP recommended headers)
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=*, microphone=*, geolocation=*");
  next();
});

// Sliding Window Memory Rate Limiter for API Endpoints (Anti-DoS / Quota Protection)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS_PER_WINDOW = 60; // Max 60 requests per minute per IP

const apiRateLimiter = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const clientIp = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "127.0.0.1";
  const now = Date.now();
  const record = rateLimitMap.get(clientIp);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(clientIp, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return next();
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    res.status(429).json({
      error: "تعداد درخواست‌های شما بیش از حد مجاز است (Rate Limit). لطفاً ۱ دقیقه دیگر مجدداً تلاش کنید.",
    });
    return;
  }

  record.count += 1;
  next();
};

app.use("/api/", apiRateLimiter);

// High limits for handling high-resolution document uploads
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ limit: "25mb", extended: true }));

// Custom middleware to intercept client-provided Gemini API key
app.use((req, res, next) => {
  const customKey = req.headers["x-gemini-api-key"] as string | undefined;
  if (customKey) {
    apiKeyStorage.run(customKey, () => {
      next();
    });
  } else {
    next();
  }
});

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  const customKey = apiKeyStorage.getStore();
  const apiKey = customKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("کلید API جمینای (GEMINI_API_KEY) در سرور یافت نشد. لطفا در پنل Secrets یا فایل .env کلید معتبر تنظیم کنید.");
  }
  if (customKey) {
    return new GoogleGenAI({
      apiKey: customKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
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

async function generateContentWithRetry(
  ai: GoogleGenAI,
  generateConfig: { model: string; contents: any; config?: any },
  maxRetries = 2
): Promise<any> {
  const originalModel = generateConfig.model;
  
  // Construct the sequence of supported Gemini 3.x models to try
  const candidateModels = [
    originalModel,
    "gemini-3.7-flash",
    "gemini-flash-latest",
    "gemini-3.1-flash-lite"
  ];
  
  // Filter out duplicates and null/undefined values
  const uniqueCandidates = Array.from(new Set(candidateModels.filter(Boolean)));
  
  let lastError: any = null;

  for (let mIdx = 0; mIdx < uniqueCandidates.length; mIdx++) {
    const currentModel = uniqueCandidates[mIdx];
    let attempt = 0;
    let delay = 1000;

    console.info(`[Gemini API] Attempting generation with model: "${currentModel}"`);

    while (attempt <= maxRetries) {
      try {
        const currentConfig = { ...generateConfig };

        const response = await ai.models.generateContent({
          ...currentConfig,
          model: currentModel,
        });
        if (currentModel !== originalModel) {
          console.info(`[Gemini API] Generation succeeded using fallback model: "${currentModel}"`);
        } else {
          console.info(`[Gemini API] Generation succeeded using primary model: "${currentModel}"`);
        }
        return response;
      } catch (apiError: any) {
        lastError = apiError;
        attempt++;
        
        const errorMessage = (apiError.message || "").toLowerCase();
        const apiStatus = apiError.status || apiError.statusCode || (apiError.error && apiError.error.code);
        
        const isPermanentZeroLimit =
          errorMessage.includes("limit: 0") ||
          errorMessage.includes("limit:0") ||
          (errorMessage.includes("quota exceeded") && (errorMessage.includes("limit") || errorMessage.includes("free_tier")));

        if (isPermanentZeroLimit) {
          console.warn(
            `[Gemini API] Model "${currentModel}" has 0 quota or is unavailable on this key. Falling back to the next model...`
          );
          lastError = apiError;
          break;
        }

        const isQuotaExceeded =
          apiStatus === 429 ||
          apiStatus === "RESOURCE_EXHAUSTED" ||
          errorMessage.includes("quota exceeded") ||
          errorMessage.includes("rate limit") ||
          errorMessage.includes("exhausted") ||
          errorMessage.includes("too many requests");

        const isHighDemand =
          apiStatus === 503 ||
          apiStatus === "UNAVAILABLE" ||
          errorMessage.includes("demand") ||
          errorMessage.includes("temporary") ||
          errorMessage.includes("overloaded") ||
          errorMessage.includes("unavailable") ||
          errorMessage.includes("503");

        const isTransient =
          isQuotaExceeded ||
          isHighDemand ||
          apiStatus === 500 ||
          apiStatus === "INTERNAL" ||
          errorMessage.includes("timeout") ||
          errorMessage.includes("econnreset");

        if (isTransient && attempt <= maxRetries) {
          const jitter = Math.floor(Math.random() * 500);
          const currentWait = delay + jitter;
          console.warn(
            `[Gemini API] Transient/Rate limit on "${currentModel}" (Status: ${apiStatus || "429"}). Waiting ${currentWait}ms before retry (Attempt ${attempt}/${maxRetries})...`
          );
          await new Promise((resolve) => setTimeout(resolve, currentWait));
          delay *= 1.8; // Exponential backoff
        } else {
          console.warn(
            `[Gemini API] Model "${currentModel}" failed (${isTransient ? "retries exhausted" : "non-transient error"}). Switching to next candidate model...`
          );
          break;
        }
      }
    }

    // Brief pause before trying the next candidate model to avoid hammering RPM
    if (mIdx < uniqueCandidates.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 800));
    }
  }

  // If all candidate models failed, throw the last error
  const finalError = lastError || new Error("All Gemini API models failed during generation.");
  const finalMessage = (finalError.message || "").toLowerCase();
  const finalStatus = finalError.status || finalError.statusCode || (finalError.error && finalError.error.code);
  
  if (finalStatus === 429 || finalMessage.includes("quota") || finalMessage.includes("limit") || finalMessage.includes("rate limit") || finalMessage.includes("exhausted")) {
    throw new Error("سهمیه یا محدودیت در تعداد درخواست‌های کلید API شما به پایان رسیده است (Quota Exceeded / Rate Limit). لطفا تنظیمات صورتحساب و سقف مصرف کلید خود را بررسی کنید یا چند دقیقه دیگر مجددا تلاش کنید.");
  }
  if (finalStatus === 503 || finalMessage.includes("demand") || finalMessage.includes("temporary") || finalMessage.includes("unavailable") || finalMessage.includes("503")) {
    throw new Error("در حال حاضر ترافیک سرورهای گوگل بسیار بالا است و سرویس موقتاً در دسترس نیست (Service Unavailable / High Demand). لطفا مجدداً تلاش فرمایید.");
  }
  throw finalError;
}

const MEMORY_FILE_PATH = path.join(process.cwd(), "learned_memory.json");

interface LearnerMemory {
  adaptiveEnabled: boolean;
  corrections: Array<{ id: string; original: string; corrected: string; field: string; count: number }>;
  categorizations: Array<{ id: string; description: string; category: string; count: number }>;
  customRules: Array<{ id: string; rule: string; category?: string; count: number }>;
}

const getInitialMemory = (): LearnerMemory => ({
  adaptiveEnabled: true,
  corrections: [
    { id: "c1", original: "فیلتـ", corrected: "فیلتر روغن کارگاه", field: "شرح_کالا", count: 1 },
    { id: "c2", original: "اسنپ", corrected: "هزینه حمل و نقل و ایاب ذهاب", field: "بابت", count: 1 }
  ],
  categorizations: [
    { id: "cat1", description: "خرید مانیتور اداری", category: "دارایی‌های جاری / موجودی کالا (ملزومات اداری)", count: 1 },
    { id: "cat2", description: "پرداخت قبض برق کارگاه", category: "هزینه‌ها / هزینه آب و برق و گاز", count: 1 }
  ],
  customRules: [
    { id: "r1", rule: "نام خریدار در کلیه فاکتورها همواره باید 'شرکت توسعه فناوری مهرآیین' ثبت شود مگر آنکه صریحاً نام دیگری ذکر شده باشد.", count: 1 }
  ]
});

function loadLearnedMemory(): LearnerMemory {
  try {
    if (fs.existsSync(MEMORY_FILE_PATH)) {
      const data = fs.readFileSync(MEMORY_FILE_PATH, "utf-8");
      const parsed = JSON.parse(data);
      return {
        adaptiveEnabled: parsed.adaptiveEnabled !== false,
        corrections: Array.isArray(parsed.corrections) ? parsed.corrections : [],
        categorizations: Array.isArray(parsed.categorizations) ? parsed.categorizations : [],
        customRules: Array.isArray(parsed.customRules) ? parsed.customRules : []
      };
    }
  } catch (err) {
    console.error("Error loading learned memory:", err);
  }
  const init = getInitialMemory();
  saveLearnedMemory(init);
  return init;
}

function saveLearnedMemory(memory: LearnerMemory) {
  try {
    fs.writeFileSync(MEMORY_FILE_PATH, JSON.stringify(memory, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving learned memory:", err);
  }
}

// 1. GET /api/ml/memory
app.get("/api/ml/memory", (req, res) => {
  const memory = loadLearnedMemory();
  res.json({ success: true, memory });
});

// 2. POST /api/ml/learn
app.post("/api/ml/learn", (req, res) => {
  try {
    const { type, item } = req.body;
    const memory = loadLearnedMemory();
    const id = "ml_" + Date.now() + "_" + Math.floor(Math.random() * 1000);

    if (type === "correction") {
      const { original, corrected, field } = item;
      if (!original || !corrected) {
        res.status(400).json({ error: "فیلدهای ورودی نامعتبر هستند." });
        return;
      }
      const existing = memory.corrections.find(c => c.original === original.trim() && c.field === field);
      if (existing) {
        existing.corrected = corrected.trim();
        existing.count = (existing.count || 0) + 1;
      } else {
        memory.corrections.push({ id, original: original.trim(), corrected: corrected.trim(), field: field || "شرح", count: 1 });
      }
    } else if (type === "categorization") {
      const { description, category } = item;
      if (!description || !category) {
        res.status(400).json({ error: "فیلدهای ورودی نامعتبر هستند." });
        return;
      }
      const existing = memory.categorizations.find(c => c.description === description.trim());
      if (existing) {
        existing.category = category.trim();
        existing.count = (existing.count || 0) + 1;
      } else {
        memory.categorizations.push({ id, description: description.trim(), category: category.trim(), count: 1 });
      }
    } else if (type === "rule") {
      const { rule } = item;
      if (!rule) {
        res.status(400).json({ error: "فیلدهای ورودی نامعتبر هستند." });
        return;
      }
      const existing = memory.customRules.find(r => r.rule === rule.trim());
      if (existing) {
        existing.count = (existing.count || 0) + 1;
      } else {
        memory.customRules.push({ id, rule: rule.trim(), count: 1 });
      }
    } else {
      res.status(400).json({ error: "نوع یادگیری نامعتبر است." });
      return;
    }

    saveLearnedMemory(memory);
    res.json({ success: true, memory });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. POST /api/ml/delete
app.post("/api/ml/delete", (req, res) => {
  try {
    const { type, id } = req.body;
    const memory = loadLearnedMemory();

    if (type === "correction") {
      memory.corrections = memory.corrections.filter(c => c.id !== id);
    } else if (type === "categorization") {
      memory.categorizations = memory.categorizations.filter(c => c.id !== id);
    } else if (type === "rule") {
      memory.customRules = memory.customRules.filter(r => r.id !== id);
    } else {
      res.status(400).json({ error: "نوع نامعتبر است." });
      return;
    }

    saveLearnedMemory(memory);
    res.json({ success: true, memory });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. POST /api/ml/toggle
app.post("/api/ml/toggle", (req, res) => {
  try {
    const { enabled } = req.body;
    const memory = loadLearnedMemory();
    memory.adaptiveEnabled = !!enabled;
    saveLearnedMemory(memory);
    res.json({ success: true, memory });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. POST /api/ml/reset
app.post("/api/ml/reset", (req, res) => {
  try {
    const init = getInitialMemory();
    saveLearnedMemory(init);
    res.json({ success: true, memory: init });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 6. POST /api/ml/feedback
app.post("/api/ml/feedback", async (req, res) => {
  try {
    const { fileId, rating, feedbackText, transactions } = req.body;
    const memory = loadLearnedMemory();

    if (!memory.adaptiveEnabled) {
      res.json({ success: true, message: "حالت تطبیقی غیرفعال است." });
      return;
    }

    if (rating < 5 && feedbackText && feedbackText.trim() !== "") {
      try {
        const ai = getGeminiClient();
        const feedbackPayload = `[گزارش بازخورد کاربر]\n- امتیاز کیفیت: ${rating} از 5\n- توضیحات و اصلاحات کاربر:\n"${feedbackText}"\n\n[تراکنش‌های استخراج شده فعلی جهت بررسی و ارزیابی]:\n${JSON.stringify(transactions || [])}`;

        const response = await generateContentWithRetry(ai, {
          model: "gemini-3.7-flash",
          contents: feedbackPayload,
          config: {
            systemInstruction: ML_FEEDBACK_SYSTEM_INSTRUCTION,
            responseMimeType: "application/json"
          }
        });

        const text = response.text || "";
        const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const mlData = JSON.parse(cleanJson);

        let learnedCount = 0;
        if (Array.isArray(mlData.corrections)) {
          mlData.corrections.forEach((c: any) => {
            if (c.original && c.corrected) {
              const id = "ml_fb_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
              memory.corrections.push({ id, original: c.original.trim(), corrected: c.corrected.trim(), field: c.field || "شرح_کالا", count: 1 });
              learnedCount++;
            }
          });
        }
        if (Array.isArray(mlData.categorizations)) {
          mlData.categorizations.forEach((c: any) => {
            if (c.description && c.category) {
              const id = "ml_fb_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
              memory.categorizations.push({ id, description: c.description.trim(), category: c.category.trim(), count: 1 });
              learnedCount++;
            }
          });
        }
        if (Array.isArray(mlData.customRules)) {
          mlData.customRules.forEach((r: any) => {
            if (r.rule) {
              const id = "ml_fb_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
              memory.customRules.push({ id, rule: r.rule.trim(), count: 1 });
              learnedCount++;
            }
          });
        }

        saveLearnedMemory(memory);
        res.json({ success: true, learned: true, learnedCount, memory });
        return;
      } catch (geminiErr) {
        console.error("Error analyzing feedback with Gemini:", geminiErr);
        // Fallback: save raw feedback as a custom rule directly
        const id = "ml_fb_fallback_" + Date.now();
        memory.customRules.push({ id, rule: `بازخورد کاربر: ${feedbackText}`, count: 1 });
        saveLearnedMemory(memory);
        res.json({ success: true, learned: true, fallback: true, memory });
        return;
      }
    }

    res.json({ success: true, learned: false, memory });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Persian/Farsi financial documents extraction endpoint
app.post("/api/extract", async (req, res) => {
  try {
    const { image, mimeType, model, tokenSettings, userPrompt, chatFiles, pdfExtractionStrategy } = req.body;

    let cleanImageBase64 = typeof image === "string" ? image : "";
    if (cleanImageBase64.includes("base64,")) {
      cleanImageBase64 = cleanImageBase64.split("base64,")[1];
    }
    cleanImageBase64 = cleanImageBase64.trim();

    if (!cleanImageBase64) {
       res.status(400).json({ error: "تصویر سند ارسال نشده است یا محتوای داده (Base64) خالی می‌باشد." });
       return;
    }

    const ai = getGeminiClient();

    // Target backend model powered by Gemini 3.7 Flash Ultra Gen 7
    const allowedModels = [
      "gemini-3.7-flash",
      "gemini-flash-latest"
    ];
    let selectedModel = allowedModels.includes(model) ? model : "gemini-3.7-flash";

    const memory = loadLearnedMemory();
    let mlPromptAdditions = "";

    if (memory.adaptiveEnabled) {
      if (memory.corrections.length > 0 || memory.categorizations.length > 0 || memory.customRules.length > 0) {
        mlPromptAdditions = `\n\n🧠 [حافظه فعال و الگوهای آموخته‌شده سیستم (Adaptive Machine Learning Memory)]:\nشما باید از رفتارهای پیشین و اصلاحات کاربر که در زیر آمده است درس بگیرید و آن‌ها را به عنوان الگوهای استخراج و دسته‌بندی قطعی در این سند پیاده‌سازی کنید:`;
        
        if (memory.corrections.length > 0) {
          mlPromptAdditions += `\n- اصلاحات املایی و نگارشی آموخته‌شده:`;
          memory.corrections.forEach(c => {
            mlPromptAdditions += `\n  * عبارت "${c.original}" در فیلد "${c.field}" را ترجیحاً به صورت تصحیح‌شده "${c.corrected}" استخراج کنید.`;
          });
        }

        if (memory.categorizations.length > 0) {
          mlPromptAdditions += `\n- قوانین تخصیص سرفصل و دسته‌بندی آموخته‌شده:`;
          memory.categorizations.forEach(c => {
            mlPromptAdditions += `\n  * برای شرح کالا/خدمات یا بابت نزدیک به "${c.description}"، سرفصل پیشنهادی ترجیحاً باید "${c.category}" یا نزدیک به آن باشد.`;
          });
        }

        if (memory.customRules.length > 0) {
          mlPromptAdditions += `\n- قوانین استخراج اختصاصی ممیزی آموخته‌شده:`;
          memory.customRules.forEach(r => {
            mlPromptAdditions += `\n  * قانون: ${r.rule}`;
          });
        }
        
        mlPromptAdditions += `\n\nنکته بسیار مهم: این الگوها بر اساس اصلاحات واقعی کاربر استخراج و یادگیری شده‌اند، لذا نادیده گرفتن آن‌ها مغایر با اصول یادگیری تطبیقی سیستم است.`;
      }
    }

    // Build comprehensive System Instruction utilizing centralized base rules and adaptive learning
    let systemInstruction = BASE_ACCOUNTING_OCR_SYSTEM_INSTRUCTION;
    if (mlPromptAdditions) {
      systemInstruction += `\n\n${mlPromptAdditions}`;
    }

    let promptText = `سند پیوست را با موتور ممیزی نسل ۷ آلترا به دقت و به صورت ۱۰۰٪ کامل تحلیل نمایید.
کاربر اکیداً تاکید کرده است که «تمام جزئیات سند بدون استثناء باید استخراج شود».

الزامات قطعی و غیرقابل چشم‌پوشی:
۱. استخراج تک‌تک ردیف‌های جدول کالا/خدمات بدون ادغام یا حذف حتی یک ردیف.
۲. استخراج کامل «شرح کالا یا خدمات» با تمام پسوندها، پیشوندها، مدل، برند، رنگ، سایز، ابعاد، مشخصات فنی و سریال بدون کوچک‌ترین کوتاه‌سازی یا تلخیص.
۳. استخراج کامل مشخصات هویتی فروشنده و خریدار (نام کامل، شناسه ملی/کد ملی، کد اقتصادی، شماره ثبت، کدپستی، تلفن، آدرس کامل، شهر و استان).
۴. استخراج کامل اطلاعات سربرگ (شماره فاکتور/سند، تاریخ شمسی، تاریخ میلادی، شناسه یکتای مالیاتی سامانه مودیان، نحوه تسویه، شماره سفارش).
۵. استخراج کامل ارقام جزء (تعداد، واحد، فی واحد، مبلغ کل سطر، تخفیف سطر، مالیات سطر، مبلغ نهایی سطر) و ارقام کلان (جمع کل قبل از تخفیف، جمع تخفیفات، مالیات بر ارزش افزوده، عوارض، مبلغ قابل پرداخت نهایی، مبلغ به حروف، واحد ارزی).
۶. استخراج کامل اطلاعات بانکی و تسویه (نام بانک، شماره حساب، شماره کارت، شماره شبا، صاحب حساب، شماره پیگیری، بابت تراکنش).
۷. استخراج تمام یادداشت‌ها، شروط معامله، گارانتی، توضیحات پاورقی و حاشیه سند، متن مهرها و وضعیت امضاها.

خروجی باید منحصراً شیء استاندارد JSON مطابق Schema باشد که تمام فیلدهای فوق را در ستون‌ها و ردیف‌ها پوشش دهد.`;

    if (userPrompt && typeof userPrompt === "string" && userPrompt.trim()) {
      promptText += `\n\n[دستور اختصاصی ممیز / کاربر]:\n${userPrompt.trim()}\nتوجه اکید: تمامی شرح‌ها، توضیحات متنی، متون حاشیه‌ای و ردیف‌های جدول را به صورت ۱۰۰٪ کامل و بدون خلاصه کردن در فیلدهای مربوطه درج کنید.`;
    }

    if (tokenSettings) {
      if (tokenSettings.ecoPromptEnabled) {
        promptText += `\n[حالت صرفه‌جویی توکن]: متون فیلدهای شرح و توضیحات را مختصر (حداکثر ۵ کلمه) نگه دارید.`;
      }
      if (tokenSettings.maxRowsToExtract && tokenSettings.maxRowsToExtract !== "unlimited") {
        promptText += `\n[محدودیت سطر]: حداکثر ${tokenSettings.maxRowsToExtract} سطر اول جدول را استخراج کنید.`;
      }
      if (tokenSettings.skipSecondaryFields) {
        promptText += `\n[فشرده‌سازی فیلدهای خالی]: برای فیلدهای بدون محتوا مقدار null بگذارید.`;
      }
    }

    const imagePart = {
      inlineData: {
        mimeType: mimeType || "image/png",
        data: cleanImageBase64,
      },
    };

    let markdownText: string | null = null;
    const isPdfFile = mimeType === "application/pdf" || (mimeType && mimeType.includes("pdf"));
    const shouldRunPdfToMarkdown = pdfExtractionStrategy === "pdf_to_markdown_to_json" || (isPdfFile && pdfExtractionStrategy !== "direct");

    if (shouldRunPdfToMarkdown) {
      try {
        console.info("[PDF-to-Markdown OCR] Step 1: Converting PDF/Document to structured Markdown text...");
        const mdConfig: any = {
          model: selectedModel,
          contents: {
            parts: [
              imagePart,
              { text: "لطفاً این سند/PDF را مطابق دستورالعمل سیستم به متن ساختاریافته‌ی غنی Markdown تبدیل نمایید." }
            ]
          },
          config: {
            systemInstruction: PDF_TO_MARKDOWN_SYSTEM_INSTRUCTION
          }
        };

        const mdResponse = await generateContentWithRetry(ai, mdConfig);
        if (mdResponse && mdResponse.text && mdResponse.text.trim()) {
          markdownText = mdResponse.text.trim();
          console.info(`[PDF-to-Markdown OCR] Step 1 Succeeded! Generated Markdown (${markdownText.length} chars).`);
          
          promptText = `[متن ساختاریافته Markdown استخراج‌شده اولیه از سند/PDF جهت تحلیل دقیق]:\n\`\`\`markdown\n${markdownText}\n\`\`\`\n\n${promptText}\n\nنکته اکید: لطفاً اطلاعات مالی را با دقت حداکثری و تطبیق کامل بین متن Markdown فوق‌العاده دقیق فوق و تصویر اصلی سند، تحلیل و به صورت JSON استخراج نمایید. اولویت اول شما در خواندن متون و جداول، استفاده از متن Markdown است.`;
        }
      } catch (mdErr) {
        console.warn("[PDF-to-Markdown OCR] Step 1 conversion encountered an error, falling back to direct pass:", mdErr);
        // Wait a brief moment before step 2 fallback to let token rate limits recover
        await new Promise((resolve) => setTimeout(resolve, 1200));
      }
    }

    const textPart = {
      text: promptText,
    };
    
    const parts: any[] = [imagePart, textPart];
    
    if (chatFiles && Array.isArray(chatFiles)) {
       chatFiles.forEach((f: any) => {
          parts.push({
             inlineData: {
                mimeType: f.mimeType || "application/pdf",
                data: f.base64
             }
          });
       });
    }

    let response;
    const generateConfig = {
      model: selectedModel,
      contents: { parts: parts },
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        maxOutputTokens: 8192,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            نوع_سند: {
              type: Type.STRING,
              description: "نوع دقیق سند حسابداری و تجاری (مانند فاکتور فروش، صورتحساب الکترونیکی سامانه مودیان، رسید پرداخت، فیش واریزی، قبض مالیاتی، رسید انبار، صورتحساب بانکی، فیش حقوقی، چک، قرارداد و غیره)",
            },
            تحلیل_سند: {
              type: Type.STRING,
              description: "تحلیل هوشمند، جامع و ممیزی کامل سند شامل بررسی صحت ارقام، موازنه ریاضی سطرها و جمع کل، وضعیت سامانه مودیان و کیفیت داده‌ها.",
            },
            ستون_ها: {
              type: Type.ARRAY,
              description: "فهرست کامل تمامی ستون‌های استخراج شده از سند (اطلاعات سربرگ، طرفین، اقلام جدول، سرجمع‌های مالی، پرداخت و شروط) با کلیدهای یکتای فارسی و عناوین خوانا.",
              items: {
                type: Type.OBJECT,
                properties: {
                  کلید: { type: Type.STRING, description: "کلید یکتای ستون به زبان فارسی (مثلا شماره_فاکتور، تاریخ، نام_فروشنده، شناسه_ملی_فروشنده، کد_اقتصادی_فروشنده، تلفن_فروشنده، آدرس_فروشنده، نام_خریدار، شناسه_ملی_خریدار، کد_اقتصادی_خریدار، تلفن_خریدار، آدرس_خریدار، ردیف، کد_کالا، شرح_کامل_کالا_یا_خدمات، تعداد، واحد_سنجش، فی_واحد، مبلغ_کل_ردیف، تخفیف_ردیف، مالیات_ارزش_افزوده_ردیف، مبلغ_نهایی_ردیف، توضیحات_ردیف، جمع_کل_قبل_تخفیف، جمع_تخفیفات، مالیات_و_عوارض_کل، مبلغ_قابل_پرداخت، مبلغ_به_حروف، واحد_ارزی، نام_بانک، شماره_حساب، شماره_شبا، شماره_پیگیری، توضیحات_و_شروط_سند، وضعیت_مهر_و_امضا)" },
                  عنوان: { type: Type.STRING, description: "عنوان فارسی خوانا و استاندارد ستون" }
                },
                required: ["کلید", "عنوان"]
              }
            },
            ردیف_ها: {
              type: Type.ARRAY,
              description: "لیست تمامی ردیف‌های استخراج شده منطبق بر ستون‌ها. تک‌تک ردیف‌های جدول بدون جا انداختن حتی یک ردیف باید با تمام جزئیات و تکرار اطلاعات عمومی هدر در هر سطر درج گردند.",
              items: {
                type: Type.OBJECT,
                properties: {
                  ضریب_اطمینان: {
                    type: Type.NUMBER,
                    description: "ضریب اطمینان دقت استخراج این ردیف بین 0 تا 100"
                  },
                  فیلد_ها: {
                    type: Type.ARRAY,
                    description: "مقادیر استخراج شده برای تمامی فیلدهای این ردیف.",
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        کلید: { type: Type.STRING, description: "کلید فارسی ستون مربوطه (منطبق با ستون_ها)" },
                        مقدار: { type: Type.STRING, description: "مقدار استخراج شده (متن کامل بدون خلاصه، یا عدد خالص). در صورت عدم وجود مقدار null یا خالی قرار گیرد." }
                      },
                      required: ["کلید"]
                    }
                  }
                },
                required: ["فیلد_ها"]
              }
            },
          },
          required: ["نوع_سند", "تحلیل_سند", "ستون_ها", "ردیف_ها"],
        },
      },
    };

    response = await generateContentWithRetry(ai, generateConfig);

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

    // Dual-Pass AI Self-Correction & Math Audit (Cool accuracy-raising feature!)
    if (tokenSettings && tokenSettings.highAccuracyDualPass === true) {
      console.info("[Dual-Pass AI Audit] Initiating second pass audit and validation...");

      const auditConfig = {
        model: selectedModel,
        contents: {
          parts: [
            imagePart,
            { text: `اطلاعات و داده‌های استخراج شده اولیه جهت ممیزی، بررسی تراز و اعتبارسنجی ارقام:\n\`\`\`json\n${JSON.stringify(parsedData)}\n\`\`\`` }
          ]
        },
        config: {
          systemInstruction: DUAL_PASS_AUDIT_SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: generateConfig.config.responseSchema
        }
      };

      try {
        const auditResponse = await generateContentWithRetry(ai, auditConfig);
        const auditOutputText = auditResponse.text || "{}";
        let auditedData: any = {};
        try {
          auditedData = JSON.parse(auditOutputText);
        } catch (e) {
          const match = auditOutputText.match(/\{([\s\S]*)\}/);
          if (match) auditedData = JSON.parse(match[0]);
        }
        
        if (auditedData && auditedData.ردیف_ها && auditedData.نوع_سند) {
          console.info("[Dual-Pass AI Audit] Success! Data was successfully audited and healed.");
          parsedData = auditedData;
        }
      } catch (auditErr) {
        console.warn("[Dual-Pass AI Audit] Audit failed or was bypassed, falling back to initial data:", auditErr);
      }
    }

    // Post-process JSON to enrich important monetary fields with Persian words representation
    parsedData = enrichJSONWithWords(parsedData);

    const tokensUsed = response.usageMetadata?.totalTokenCount || 0;
    const tokenDetails = {
      promptTokenCount: response.usageMetadata?.promptTokenCount || 0,
      candidatesTokenCount: response.usageMetadata?.candidatesTokenCount || 0,
      totalTokenCount: response.usageMetadata?.totalTokenCount || 0,
      cachedContentTokenCount: response.usageMetadata?.cachedContentTokenCount || 0,
    };

    res.json({ 
      success: true, 
      data: parsedData, 
      markdownContent: markdownText || undefined,
      extractionMethod: markdownText ? "pdf_to_markdown_to_json" : "direct",
      tokensUsed, 
      tokenDetails 
    });
  } catch (error: any) {
    console.error("API Error in extraction:", error);
    res.status(500).json({ success: false, error: error.message || "خطای ناشناخته در پردازش فایل" });
  }
});

// Endpoint for explicit AI-driven Mathematical Audit and Self-Correction
app.post("/api/audit-repair", async (req, res) => {
  try {
    const { image, mimeType, currentData, model } = req.body;
    
    if (!currentData) {
      return res.status(400).json({ success: false, error: "داده‌های فعلی ارسال نشده است." });
    }

    const ai = getGeminiClient();
    const allowedRepairModels = ["gemini-3.7-flash", "gemini-flash-latest"];
    const selectedModel = allowedRepairModels.includes(model) ? model : "gemini-3.7-flash";

    console.info("[API Audit Repair] Initiating on-demand mathematical alignment and OCR healing...");

    const parts: any[] = [];
    if (image) {
      parts.push({
        inlineData: {
          mimeType: mimeType || "image/png",
          data: image
        }
      });
    }
    parts.push({ text: `Current Extracted Financial Table JSON Data to audit, reconcile, and mathematically heal:\n${JSON.stringify(currentData)}` });

    const auditConfig = {
      model: selectedModel,
      contents: { parts },
      config: {
        systemInstruction: AUDIT_REPAIR_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
      }
    };

    const response = await generateContentWithRetry(ai, auditConfig);
    const outputText = response.text || "{}";
    let auditedData: any = {};
    try {
      auditedData = JSON.parse(outputText);
    } catch (e) {
      const match = outputText.match(/\{([\s\S]*)\}/);
      if (match) auditedData = JSON.parse(match[0]);
    }

    res.json({ success: true, data: auditedData });
  } catch (error: any) {
    console.error("API Error in audit repair:", error);
    res.status(500).json({ success: false, error: error.message || "خطا در ممیزی داده‌ها با هوش مصنوعی" });
  }
});

// Pre-extraction chat endpoint
app.post("/api/chat-pre-extract", async (req, res) => {
  try {
    const { messages, image, mimeType, model, customPrompt } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
       return res.status(400).json({ error: "لیست پیام‌ها ارسال نشده است." });
    }
    
    const ai = getGeminiClient();
    
    let systemInstruction = PRE_EXTRACT_CHAT_SYSTEM_INSTRUCTION;

    if (customPrompt && customPrompt.trim()) {
      systemInstruction += `\n[دستور اختصاصی کاربر]: ${customPrompt.trim()}`;
    }
    
    // Sliding window: keep up to the latest 8 messages to conserve tokens
    const windowedMessages = messages.length > 8 ? messages.slice(-8) : messages;

    const rawMessages = windowedMessages.map((msg: any, index: number) => {
      const msgParts: any[] = [{ text: msg.text || "فایل ضمیمه شد." }];
      
      // Only attach files for the latest message or first message to prevent token explosion
      if ((index === 0 || index === windowedMessages.length - 1) && msg.files && Array.isArray(msg.files)) {
         msg.files.forEach((f: any) => {
            if (f.base64) {
              msgParts.push({
                 inlineData: {
                    mimeType: f.mimeType || "application/pdf",
                    data: f.base64
                 }
              });
            }
         });
      }

      // Attach the image only to the first message in the window
      if (index === 0 && image) {
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

    // Merge consecutive messages of the same role to prevent Gemini API 400 errors
    const formattedMessages: any[] = [];
    for (const msg of rawMessages) {
      if (formattedMessages.length > 0 && formattedMessages[formattedMessages.length - 1].role === msg.role) {
        formattedMessages[formattedMessages.length - 1].parts.push(...msg.parts);
      } else {
        formattedMessages.push(msg);
      }
    }

    const selectedModel = model || "gemini-3.7-flash";

    const response = await generateContentWithRetry(ai, {
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
    
    const windowedMessages = messages.length > 8 ? messages.slice(-8) : messages;

    const formattedMessages: any[] = windowedMessages.map((msg: any) => {
      const parts: any[] = [{ text: msg.text || "فایل ضمیمه شد." }];
      return {
        role: msg.role === "assistant" || msg.role === "model" ? "model" : "user",
        parts: parts,
      };
    });
    
    // Add image as final context
    formattedMessages.push({
       role: "user",
       parts: [
         { text: "خلاصه تاییدیه استخراج (Verification Summary) را به صورت Markdown مختصر تهیه کن." },
         {
           inlineData: {
             mimeType: mimeType || "image/png",
             data: image,
           }
         }
       ]
    });

    const selectedModel = model || "gemini-3.7-flash";

    const response = await generateContentWithRetry(ai, {
      model: selectedModel,
      contents: formattedMessages,
      config: {
        systemInstruction: CHAT_VERIFICATION_SYSTEM_INSTRUCTION,
      },
    });

    res.json({ success: true, text: response.text });
  } catch (error: any) {
    console.error("API Error in verification chat:", error);
    res.status(500).json({ success: false, error: error.message || "خطای ناشناخته در بررسی و تایید" });
  }
});

// Exclusive Document AI Chat endpoint
app.post("/api/document-chat", async (req, res) => {
  try {
    const { messages, documentImage, mimeType, documentData, documentName, documentType, documentAnalysis, model } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
       return res.status(400).json({ error: "لیست پیام‌ها ارسال نشده است." });
    }
    
    const ai = getGeminiClient();
    
    let systemInstruction = DOCUMENT_EXCLUSIVE_CHAT_SYSTEM_INSTRUCTION;
    if (documentName || documentType || documentAnalysis) {
      systemInstruction += `\n[سند]: ${documentName || "سند مالی"}${documentType ? ` | نوع: ${documentType}` : ""}${documentAnalysis ? ` | تحلیل: ${documentAnalysis}` : ""}`;
    }

    if (documentData) {
      // Use compact JSON string to save significant tokens compared to indented formatting
      const dataStr = typeof documentData === "string" ? documentData : JSON.stringify(documentData);
      systemInstruction += `\n[داده‌های استخراج‌شده]: ${dataStr.substring(0, 3500)}`;
    }

    // Sliding window of last 8 messages
    const windowedMessages = messages.length > 8 ? messages.slice(-8) : messages;

    const rawMessages = windowedMessages.map((msg: any, index: number) => {
      const msgParts: any[] = [{ text: msg.text || "فایل ضمیمه شد." }];
      
      // Attach the document image to the first message only
      if (index === 0 && documentImage) {
        msgParts.push({
          inlineData: {
            mimeType: mimeType || "image/png",
            data: documentImage,
          },
        });
      }

      return {
        role: msg.role === "assistant" || msg.role === "model" ? "model" : "user",
        parts: msgParts,
      };
    });

    const formattedMessages: any[] = [];
    for (const msg of rawMessages) {
      if (formattedMessages.length > 0 && formattedMessages[formattedMessages.length - 1].role === msg.role) {
        formattedMessages[formattedMessages.length - 1].parts.push(...msg.parts);
      } else {
        formattedMessages.push(msg);
      }
    }

    const selectedModel = model || "gemini-3.7-flash";

    const response = await generateContentWithRetry(ai, {
      model: selectedModel,
      contents: formattedMessages,
      config: {
        systemInstruction: systemInstruction,
      },
    });

    const tokensUsed = response.usageMetadata?.totalTokenCount || 0;

    res.json({ success: true, text: response.text, tokensUsed });
  } catch (error: any) {
    console.error("API Error in document-chat:", error);
    res.status(500).json({ success: false, error: error.message || "خطای ناشناخته در پردازش چت اختصاصی سند" });
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

    // Sliding window of last 10 messages for general ERP chat
    const windowedMessages = messages.length > 10 ? messages.slice(-10) : messages;

    const contents = windowedMessages.map((msg: any) => ({
      role: msg.role === "assistant" || msg.role === "model" ? "model" : "user",
      parts: [{ text: msg.text }],
    }));

    const response = await generateContentWithRetry(ai, {
      model: "gemini-3.7-flash",
      contents: contents,
      config: {
        systemInstruction: ERP_SUPPORT_SYSTEM_INSTRUCTION,
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

// API endpoint to auto categorize documents using Gemini
app.post("/api/auto-categorize", async (req, res) => {
  try {
    const { files } = req.body;
    if (!files || !Array.isArray(files) || files.length === 0) {
      res.status(400).json({ error: "لیست فایل‌ها خالی یا نامعتبر است." });
      return;
    }

    const ai = getGeminiClient();
    const prompt = `لیست فایل‌های مالی جهت دسته‌بندی هوشمند:\n${JSON.stringify(files)}`;

    const response = await generateContentWithRetry(ai, {
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        systemInstruction: AUTO_CATEGORIZE_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json"
      }
    });

    let resultText = response.text || "";
    // Clean response markup if any
    if (resultText.includes("```json")) {
      resultText = resultText.split("```json")[1].split("```")[0];
    } else if (resultText.includes("```")) {
      resultText = resultText.split("```")[1].split("```")[0];
    }
    const categoriesData = JSON.parse(resultText.trim());

    res.json({
      success: true,
      categories: categoriesData.categories || {}
    });
  } catch (error: any) {
    console.error("خطا در دسته‌بندی خودکار اسناد با هوش مصنوعی:", error);
    res.status(500).json({
      success: false,
      error: error.message || "خطای ناشناخته در دسته‌بندی هوشمند اسناد"
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
