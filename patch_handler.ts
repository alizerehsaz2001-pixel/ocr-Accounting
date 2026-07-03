import fs from 'fs';

const content = fs.readFileSync('src/App.tsx', 'utf-8');
const target = `    } finally {
      setIsPreExtractChatLoading(false);
    }
  };`;

const addition = `    } finally {
      setIsPreExtractChatLoading(false);
    }
  };

  const handleVerifyInstructions = async () => {
    if (!pendingFile || preExtractChat.length === 0) return;
    setIsVerifying(true);
    try {
      const response = await fetch("/api/chat-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: preExtractChat,
          image: pendingFile.base64,
          mimeType: pendingFile.mimeType,
          model: selectedModel
        }),
      });
      const data = await response.json();
      if (data.success && data.text) {
        setVerificationSummary(data.text);
      } else {
        showNotification("خطا در ایجاد خلاصه تاییدیه.", "error");
      }
    } catch (error) {
      console.error("Error creating verification summary:", error);
      showNotification("خطا در شبکه. لطفاً دوباره تلاش کنید.", "error");
    } finally {
      setIsVerifying(false);
    }
  };`;

if (content.includes(target)) {
  fs.writeFileSync('src/App.tsx', content.replace(target, addition));
  console.log('Patched handler successfully');
} else {
  console.log('Target not found in handler patch');
}
