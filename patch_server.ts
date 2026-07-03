import fs from 'fs';

const content = fs.readFileSync('server.ts', 'utf-8');
const target = `// Advanced Persian ERP support chatbot assistant endpoint`;

const addition = `// Pre-extraction verification endpoint
app.post("/api/chat-verification", async (req, res) => {
  try {
    const { messages, image, mimeType, model } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
       return res.status(400).json({ error: "لیست پیام‌ها ارسال نشده است." });
    }
    
    const ai = getGeminiClient();
    const systemInstruction = "شما یک دستیار حسابدار هستید. کاربر با شما درباره یک سند مالی گفتگو کرده است. وظیفه شما این است که این گفتگو و تصویر سند را بررسی کرده و یک خلاصه برای کاربر تهیه کنید (Verification Summary). این خلاصه باید در یک فرمت ساختاریافته (مارک‌داون) باشد که شامل موجودیت‌های استخراج شده کلیدی مانند شناسه ملی (Tax ID)، تاریخ‌ها، نام شرکت‌ها یا افراد، و توافقات یا دستورالعمل‌های خاص استخراج باشد. این به کاربر اجازه می‌دهد قبل از تایید نهایی استخراج، مطمئن شود که سیستم خواسته‌های او را متوجه شده است.";
    
    const formattedMessages = messages.map((msg: any) => {
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

`;

if (content.includes(target)) {
  fs.writeFileSync('server.ts', content.replace(target, addition + target));
  console.log('Patched server.ts successfully');
} else {
  console.log('Target not found in server.ts');
}
