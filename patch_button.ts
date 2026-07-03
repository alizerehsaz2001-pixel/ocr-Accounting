import fs from 'fs';

const content = fs.readFileSync('src/App.tsx', 'utf-8');
const target = `                            const fileData = pendingFile;
                            setPendingFile(null);
                            setIsExtracting(false);
                            setExtractionStep(0);
                            await processImageForExtraction(fileData.base64, fileData.name, fileData.mimeType, customPrompt);
                          }}`;
const addition = `                            const fileData = pendingFile;
                            setPendingFile(null);
                            setIsExtracting(false);
                            setExtractionStep(0);
                            
                            const chatContext = preExtractChat.length > 0 
                              ? "تاریخچه مکالمه با کاربر درباره این سند:\\n" + preExtractChat.map(m => \`\${m.role === 'user' ? 'کاربر' : 'دستیار'}: \${m.text}\`).join('\\n')
                              : "";
                            const finalPrompt = customPrompt 
                              ? (chatContext ? \`\${customPrompt}\\n\\n\${chatContext}\` : customPrompt) 
                              : chatContext;

                            await processImageForExtraction(fileData.base64, fileData.name, fileData.mimeType, finalPrompt);
                          }}`;

if (content.includes(target)) {
  fs.writeFileSync('src/App.tsx', content.replace(target, addition));
  console.log('Patched button successfully');
} else {
  console.log('Target not found in button patch');
}
