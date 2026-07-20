const fs = require('fs');
const content = fs.readFileSync('server.ts', 'utf-8');

const target = `// Pre-extraction chat endpoint
app.post("/api/chat-pre-extract", async (req, res) => {
  try {
    const { messages, image, mimeType, model } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
       return res.status(400).json({ error: "لیست پیام‌ها ارسال نشده است." });
    }
    
    const ai = getGeminiClient();
    const systemInstruction = "شما یک دستیار حسابدار هوشمند هستید. کاربر تصویری از یک سند مالی (فاکتور، فیش، چک و ...) آپلود کرده است. شما باید به سوالات کاربر در مورد این سند پاسخ دهید و در صورت نیاز راهنمایی کنید که چه چیزهایی از این سند قابل استخراج است. پس از این چت، داده‌ها در فرمت JSON استخراج خواهند شد. همیشه مودبانه، تخصصی و به زبان فارسی پاسخ دهید.";
    
    const formattedMessages = messages.map((msg: any, index: number) => {
      const msgParts: any[] = [{ text: msg.text || "فایل ضمیمه شد." }];
      
      if (msg.files && Array.isArray(msg.files)) {
         msg.files.forEach((f: any) => {
            msgParts.push({
               inlineData: {
                  mimeType: f.mimeType || "application/pdf",
                  data: f.base64
               }
            });
         });
      }

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
    });`;

const replacement = `// Pre-extraction chat endpoint
app.post("/api/chat-pre-extract", async (req, res) => {
  try {
    const { messages, image, mimeType, model, customPrompt } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
       return res.status(400).json({ error: "لیست پیام‌ها ارسال نشده است." });
    }
    
    const ai = getGeminiClient();
    let systemInstruction = "شما یک دستیار حسابدار هوشمند هستید. کاربر تصویری از یک سند مالی (فاکتور، فیش، چک و ...) آپلود کرده است. شما باید به سوالات کاربر در مورد این سند پاسخ دهید و در صورت نیاز راهنمایی کنید که چه چیزهایی از این سند قابل استخراج است. پس از این چت، داده‌ها در فرمت JSON استخراج خواهند شد. همیشه مودبانه، تخصصی و به زبان فارسی پاسخ دهید. سعی کنید مقادیر استخراجی را در صورت درخواست کاربر ارزیابی کنید.";
    
    if (customPrompt && customPrompt.trim()) {
       systemInstruction += "\\n\\nدستورالعمل خاص استخراج کاربر که باید در نظر بگیرید:\\n" + customPrompt;
    }
    
    let rawMessages = messages.map((msg: any, index: number) => {
      const msgParts: any[] = [{ text: msg.text || "فایل ضمیمه شد." }];
      
      if (msg.files && Array.isArray(msg.files)) {
         msg.files.forEach((f: any) => {
            msgParts.push({
               inlineData: {
                  mimeType: f.mimeType || "application/pdf",
                  data: f.base64
               }
            });
         });
      }

      // Attach the main image to the very first user message only
      if (index === 0 && msg.role === "user" && image) {
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
    
    // Merge consecutive messages of the same role to prevent Gemini API errors (400 Bad Request)
    const formattedMessages: any[] = [];
    for (const msg of rawMessages) {
      if (formattedMessages.length > 0 && formattedMessages[formattedMessages.length - 1].role === msg.role) {
        formattedMessages[formattedMessages.length - 1].parts.push(...msg.parts);
      } else {
        formattedMessages.push(msg);
      }
    }`;

if (content.includes(target)) {
  fs.writeFileSync('server.ts', content.replace(target, replacement));
  console.log("Success");
} else {
  console.log("Not found");
}
