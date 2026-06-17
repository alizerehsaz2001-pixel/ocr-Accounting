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
    const selectedModel = allowedModels.includes(model) ? model : "gemini-3.5-flash";

    // Specific strict instructions tailored to Persian accounting standards and system instructions
    const systemInstruction = `شما یک مدیر مالی، حسابرس ارشد و موتور هوش مصنوعی OCR هستید که با تمام اصول حسابداری، استانداردهای حسابرسی، ماهیت حساب‌ها (بدهکار/بستانکار) و قوانین ثبت اسناد مالی در ایران آشنایی کامل دارید.
شما اسناد دست‌نویس، صورتحساب‌ها، فاکتورها، و دفاتر کل/معین را بررسی می‌کنید و داده‌ها را با دقت و وسواس یک حسابرس استخراج می‌کنید.

قوانین مطلق و غیرقابل تخطی:
۱. خروجی باید صد در صد منطبق بر تصویر باشد. هیچ چیز اضافی، هیچ رکورد فرضی و هیچ داده‌ای که به وضوح در تصویر مشخص نیست، نباید اضافه شود (بدون Hallucination). تا زمانی که فایلی آپلود نشده، یا دیتایی یافت نشد، فقط یک آرایه خالی برگردانید.
۲. هیچ‌گونه متن اضافه، پیشوند، پسوند، توضیح، یا احوالپرسی تولید نکنید.
۳. در خواندن دست‌خط‌های ناخوانا بیشترین تلاش را برای تطبیق الگوهای خطی بکنید، اما اطلاعات را هرگز حدس نزنید. اگر کلمه‌ای مطلقاً قابل خواندن نیست، مقدار آن را "[ناخوانا]" قرار دهید.
۴. اعداد را فقط و فقط به صورت عدد صحیح (Type Number, بدون کاما، بدون ممیز) برگردانید. اگر عدد ناخوانا بود، آن را صفر (0) قرار دهید.
۵. تشخیص دقیق بدهکار (Asset/Expense) و بستانکار (Liability/Revenue/Equity) الزامی است. مبالغ را دقیقاً در ستون مربوطه یادداشت کنید.
۶. فرمت خروجی فقط و فقط باید یک آرایه JSON معتبر (بدون تگ مارک‌داون) حاوی کلیدهای انگلیسی زیر باشد: 
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

    const response = await ai.models.generateContent({
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
    });

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

    res.json({ success: true, data: parsedData });
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
