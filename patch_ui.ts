import fs from 'fs';

const content = fs.readFileSync('src/App.tsx', 'utf-8');

const target = `                    {/* Actions or Progress */}
                    {isExtracting ? (
                      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/60 flex flex-col gap-3 text-right">
                        <span className={\`text-[11px] font-bold \${isDarkMode ? "text-slate-300" : "text-slate-700"}\`}>مراحل تحلیل و بررسی هوش مصنوعی:</span>
                        
                        {extractionStep >= 1 && (
                          <div className="flex items-center gap-2 text-[10px] text-blue-500">
                            {extractionStep === 1 ? <div className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin shrink-0" /> : <Check className="w-4 h-4 text-emerald-500 shrink-0" />}
                            <span className={extractionStep === 1 ? "animate-pulse" : "text-slate-500"}>در حال خوانش اولیه تصویر و درک محتوای سند مالی...</span>
                          </div>
                        )}
                        
                        {extractionStep >= 2 && (
                          <div className="flex items-center gap-2 text-[10px] text-indigo-500">
                            {extractionStep === 2 ? <div className="w-3.5 h-3.5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin shrink-0" /> : <Check className="w-4 h-4 text-emerald-500 shrink-0" />}
                            <span className={extractionStep === 2 ? "animate-pulse" : "text-slate-500"}>شروع صحت‌سنجی مبالغ و استخراج موجودیت‌ها...</span>
                          </div>
                        )}

                        {extractionStep >= 3 && (
                          <div className="flex items-center gap-2 text-[10px] text-emerald-500">
                            {extractionStep === 3 ? <div className="w-3.5 h-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin shrink-0" /> : <Check className="w-4 h-4 text-emerald-500 shrink-0" />}
                            <span className={extractionStep === 3 ? "animate-pulse" : "text-slate-500"}>تهیه فایل استاندارد JSON و موازنه دوطرفه...</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/60">
                        <button
                          type="button"
                          onClick={() => {
                            setPendingFile(null);
                            setCustomPrompt("");
                          }}
                          className={\`px-4 py-2 rounded-xl text-[11px] font-bold transition-all \${
                            isDarkMode 
                              ? "bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-slate-200" 
                              : "bg-slate-100 hover:bg-slate-200/80 text-slate-600 hover:text-slate-800"
                          }\`}
                        >
                          حذف و انصراف
                        </button>
                        
                        <button
                          type="button"
                          disabled={preExtractChat.length === 0}
                          onClick={async () => {
                            if (!pendingFile || preExtractChat.length === 0) return;
                            setIsExtracting(true);
                            setExtractionStep(1);
                            await new Promise(resolve => setTimeout(resolve, 1500));
                            
                            setExtractionStep(2);
                            await new Promise(resolve => setTimeout(resolve, 2000));
                            
                            setExtractionStep(3);
                            await new Promise(resolve => setTimeout(resolve, 1500));
                            
                            const fileData = pendingFile;
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
                          }}
                          className={\`px-4.5 py-2 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all \${
                            preExtractChat.length === 0 
                              ? "bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed" 
                              : "bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/10 hover:shadow-blue-500/20 hover:-translate-y-0.5"
                          }\`}
                        >
                          <Sparkles className={\`w-3.5 h-3.5 shrink-0 \${preExtractChat.length === 0 ? "text-slate-400 dark:text-slate-500" : "text-blue-200"}\`} />
                          <span>شروع تحلیل و استخراج</span>
                        </button>
                      </div>
                    )}`;

const addition = `                    {/* Actions or Progress */}
                    {isExtracting ? (
                      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/60 flex flex-col gap-3 text-right">
                        <span className={\`text-[11px] font-bold \${isDarkMode ? "text-slate-300" : "text-slate-700"}\`}>مراحل تحلیل و بررسی هوش مصنوعی:</span>
                        
                        {extractionStep >= 1 && (
                          <div className="flex items-center gap-2 text-[10px] text-blue-500">
                            {extractionStep === 1 ? <div className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin shrink-0" /> : <Check className="w-4 h-4 text-emerald-500 shrink-0" />}
                            <span className={extractionStep === 1 ? "animate-pulse" : "text-slate-500"}>در حال خوانش اولیه تصویر و درک محتوای سند مالی...</span>
                          </div>
                        )}
                        
                        {extractionStep >= 2 && (
                          <div className="flex items-center gap-2 text-[10px] text-indigo-500">
                            {extractionStep === 2 ? <div className="w-3.5 h-3.5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin shrink-0" /> : <Check className="w-4 h-4 text-emerald-500 shrink-0" />}
                            <span className={extractionStep === 2 ? "animate-pulse" : "text-slate-500"}>شروع صحت‌سنجی مبالغ و استخراج موجودیت‌ها...</span>
                          </div>
                        )}

                        {extractionStep >= 3 && (
                          <div className="flex items-center gap-2 text-[10px] text-emerald-500">
                            {extractionStep === 3 ? <div className="w-3.5 h-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin shrink-0" /> : <Check className="w-4 h-4 text-emerald-500 shrink-0" />}
                            <span className={extractionStep === 3 ? "animate-pulse" : "text-slate-500"}>تهیه فایل استاندارد JSON و موازنه دوطرفه...</span>
                          </div>
                        )}
                      </div>
                    ) : verificationSummary ? (
                      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/60 flex flex-col gap-3">
                        <div className={\`p-4 rounded-xl text-right text-[11px] leading-relaxed \${isDarkMode ? "bg-indigo-900/20 border border-indigo-800/40 text-indigo-200" : "bg-indigo-50 border border-indigo-100 text-indigo-900"}\`}>
                          <div className="font-bold mb-2 flex items-center justify-end gap-1.5">
                             خلاصه تاییدیه استخراج (Verification Summary)
                             <Check className="w-4 h-4 text-emerald-500" />
                          </div>
                          <Markdown>{verificationSummary}</Markdown>
                        </div>
                        <div className="flex items-center justify-end gap-2.5 mt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setVerificationSummary(null);
                            }}
                            className={\`px-4 py-2 rounded-xl text-[11px] font-bold transition-all \${
                              isDarkMode 
                                ? "bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-slate-200" 
                                : "bg-slate-100 hover:bg-slate-200/80 text-slate-600 hover:text-slate-800"
                            }\`}
                          >
                            بازگشت به گفتگو
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              if (!pendingFile || preExtractChat.length === 0) return;
                              setIsExtracting(true);
                              setExtractionStep(1);
                              await new Promise(resolve => setTimeout(resolve, 1500));
                              
                              setExtractionStep(2);
                              await new Promise(resolve => setTimeout(resolve, 2000));
                              
                              setExtractionStep(3);
                              await new Promise(resolve => setTimeout(resolve, 1500));
                              
                              const fileData = pendingFile;
                              setPendingFile(null);
                              setIsExtracting(false);
                              setExtractionStep(0);
                              setVerificationSummary(null);
                              
                              const chatContext = preExtractChat.length > 0 
                                ? "تاریخچه مکالمه با کاربر درباره این سند:\\n" + preExtractChat.map(m => \`\${m.role === 'user' ? 'کاربر' : 'دستیار'}: \${m.text}\`).join('\\n')
                                : "";
                              const finalPrompt = customPrompt 
                                ? (chatContext ? \`\${customPrompt}\\n\\n\${chatContext}\` : chatContext) 
                                : chatContext;

                              await processImageForExtraction(fileData.base64, fileData.name, fileData.mimeType, finalPrompt + "\\n\\nخلاصه تایید شده:\\n" + verificationSummary);
                            }}
                            className={\`px-4.5 py-2 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20 hover:-translate-y-0.5\`}
                          >
                            <Sparkles className="w-3.5 h-3.5 shrink-0 text-emerald-200" />
                            <span>تایید نهایی و شروع استخراج</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/60">
                        <button
                          type="button"
                          onClick={() => {
                            setPendingFile(null);
                            setCustomPrompt("");
                          }}
                          className={\`px-4 py-2 rounded-xl text-[11px] font-bold transition-all \${
                            isDarkMode 
                              ? "bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-slate-200" 
                              : "bg-slate-100 hover:bg-slate-200/80 text-slate-600 hover:text-slate-800"
                          }\`}
                        >
                          حذف و انصراف
                        </button>
                        
                        <button
                          type="button"
                          disabled={preExtractChat.length === 0 || isVerifying}
                          onClick={handleVerifyInstructions}
                          className={\`px-4.5 py-2 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all \${
                            preExtractChat.length === 0 || isVerifying
                              ? "bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed" 
                              : "bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/10 hover:shadow-blue-500/20 hover:-translate-y-0.5"
                          }\`}
                        >
                          {isVerifying ? (
                             <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                          ) : (
                             <Sparkles className={\`w-3.5 h-3.5 shrink-0 \${preExtractChat.length === 0 ? "text-slate-400 dark:text-slate-500" : "text-blue-200"}\`} />
                          )}
                          <span>بررسی و تایید دستورالعمل‌ها</span>
                        </button>
                      </div>
                    )}`;

if (content.includes(target)) {
  fs.writeFileSync('src/App.tsx', content.replace(target, addition));
  console.log('Patched UI successfully');
} else {
  console.log('Target not found in UI patch');
}
