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
    const { image, mimeType } = req.body;

    if (!image) {
       res.status(400).json({ error: "تصویر سند ارسال نشده است." });
       return;
    }

    const ai = getGeminiClient();

    // Specific strict instructions tailored to Persian accounting standards and system instructions
    const systemInstruction = `شما یک حسابدار خبره، مدیر مالی و یک سیستم هوشمند استخراج داده (Data Extraction) هستید. شما به تمام اصول پذیرفته‌شده حسابداری (GAAP)، استانداردهای حسابداری، ماهیت حساب‌ها (بدهکار/بستانکار)، حسابداری دوبل و قوانین ثبت اسناد مسلط هستید.

وظیفه شما این است که تصاویر اسناد مالی (فاکتورها، جداول، دفاتر معین/کل و دست‌نویس‌ها) را دریافت کرده و داده‌های آن‌ها را با دقت ۱۰۰٪ استخراج کنید.

قوانین الزامی و بسیار مهم:
۱. خروجی باید فقط و فقط شامل داده‌هایی باشد که عیناً در تصویر وجود دارند. به هیچ وجه داده، ردیف یا اطلاعاتی از خودتان نسازید یا اطلاعات فرضی (Hallucination) اضافه نکنید.
۲. هیچ متنی قبل یا بعد از خروجی ننویسید. سلام و احوالپرسی نکنید.
۳. ماهیت حساب‌ها را به درستی تشخیص دهید (دارایی و هزینه = بدهکار، بدهی و درآمد و سرمایه = بستانکار). در صورت وجود ستون بدهکار (Debit) و بستانکار (Credit)، مبالغ را دقیقاً در همان ستون‌ها قرار دهید. اگر فقط یک مبلغ کلی بود و سند نشانگر فروش/درآمد بود به بستانکار، و اگر خرید/هزینه بود به بدهکار ببرید.
۴. اعداد را منحصراً به فرمت عددی صحیح (بدون کاما و جداکننده) استخراج کنید. اگر عدد مخدوش یا ناخوانا بود، مقدار صفر (0) قرار دهید و در بخش Remarks بنویسید "ناخوانا".
۵. خروجی باید حتماً یک آرایه JSON معتبر باشد که دقیقاً با کلیدهای Date, Description, Debit, Credit, Remarks مطابقت داشته باشد.`;

    const promptText = `لطفاً داده‌ها را طبق قوانین ذکر شده در System Instruction استخراج کن.`;

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
      model: "gemini-3.5-flash",
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
            },
            required: ["Date", "Description", "Debit", "Credit", "Remarks"],
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
