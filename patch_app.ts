import fs from 'fs';

const content = fs.readFileSync('src/App.tsx', 'utf-8');

const target = `                      <div className="flex flex-col gap-1.5 text-right">
                        <textarea
                          rows={3}
                          value={customPrompt}
                          onChange={(e) => setCustomPrompt(e.target.value)}
                          placeholder="مثلاً: 'تفکیک دقیق ردیف‌های با ارزش افزوده بالا' یا 'فقط اقلام مربوط به بستانکار...' یا بگذارید خالی بماند"
                          className={\`w-full text-[11.5px] font-sans p-3 rounded-2xl border outline-none focus:ring-2 focus:ring-blue-500/20 leading-relaxed text-right transition-all resize-none \${
                            isDarkMode 
                              ? "bg-slate-950/40 border-slate-800 text-slate-100 placeholder-slate-600 focus:border-blue-500 focus:bg-slate-950/80" 
                              : "bg-slate-50/50 border-slate-200/80 text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:bg-white"
                          }\`}
                        />
                      </div>

                      {/* Intelligent Suggestion Chips */}
                      <div>
                        <span className={\`text-[10px] font-bold block mb-2 \${isDarkMode ? "text-slate-400" : "text-slate-500"}\`}>
                          پیشنهادها و فیلترهای هوشمند:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { 
                              label: "تفکیک ارزش افزوده", 
                              text: "مبلغ مالیات ارزش افزوده و عوارض را به طور دقیق در ستون ارزش افزوده تفکیک کن." 
                            },
                            { 
                              label: "تحلیل فاکتور ارزی", 
                              text: "این فاکتور ارزی است؛ نوع ارز را به درستی استخراج کن و معادل ریالی را در توضیحات تکمیلی بنویس." 
                            },
                            { 
                              label: "مبالغ بالای ۱ میلیون", 
                              text: "فقط اقلام و ردیف‌های مالی با مبلغ بالای ۱ میلیون تومان را استخراج کن." 
                            },
                            { 
                              label: "دقت دست‌نویس مخدوش", 
                              text: "سند دارای اقلام دست‌نویس است؛ روی خوانش ارقام مخدوش و بررسی جمع کل تمرکز کن." 
                            }
                          ].map((chip, idx) => {
                            const isSelected = customPrompt === chip.text;
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setCustomPrompt(isSelected ? "" : chip.text)}
                                className={\`px-2.5 py-1.5 rounded-xl text-[10px] font-bold border transition-all \${
                                  isSelected 
                                    ? "bg-blue-500/10 border-blue-500/40 text-blue-400 shadow-sm"
                                    : isDarkMode 
                                      ? "bg-slate-800/40 border-slate-800 text-slate-400 hover:bg-slate-800/80 hover:text-slate-300" 
                                      : "bg-slate-50 border-slate-200/60 text-slate-600 hover:bg-slate-100 hover:text-slate-850"
                                }\`}
                              >
                                {chip.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>`;

const addition = `                      {/* Pre-extract Chat */}
                      <div className="flex flex-col gap-2 mt-2">
                        <span className={\`text-[11px] font-black \${isDarkMode ? "text-slate-300" : "text-slate-700"}\`}>
                          گفتگو با هوش مصنوعی درباره این سند قبل از استخراج (اختیاری):
                        </span>
                        
                        <div className={\`flex flex-col border rounded-2xl overflow-hidden \${isDarkMode ? "border-slate-800 bg-slate-900/40" : "border-slate-200 bg-slate-50/50"}\`}>
                          {preExtractChat.length > 0 && (
                            <div className={\`p-4 max-h-[220px] overflow-y-auto flex flex-col gap-3 \${isDarkMode ? "bg-slate-900/80" : "bg-white"}\`}>
                              {preExtractChat.map((msg, idx) => (
                                <div key={idx} className={\`flex flex-col gap-1 \${msg.role === "user" ? "items-start" : "items-end"}\`}>
                                  <div className={\`px-3 py-2 rounded-2xl text-[11px] leading-relaxed max-w-[85%] \${
                                    msg.role === "user" 
                                      ? isDarkMode ? "bg-slate-800 text-slate-200 rounded-tr-sm" : "bg-slate-100 text-slate-700 rounded-tr-sm"
                                      : "bg-blue-600 text-white rounded-tl-sm shadow-sm"
                                  }\`}>
                                    <Markdown>{msg.text}</Markdown>
                                  </div>
                                </div>
                              ))}
                              {isPreExtractChatLoading && (
                                 <div className="flex justify-end">
                                   <div className="bg-blue-600 text-white px-3 py-2 rounded-2xl rounded-tl-sm flex gap-1 items-center h-8">
                                      <div className="w-1.5 h-1.5 rounded-full bg-white/70 animate-bounce"></div>
                                      <div className="w-1.5 h-1.5 rounded-full bg-white/70 animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                      <div className="w-1.5 h-1.5 rounded-full bg-white/70 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                   </div>
                                 </div>
                              )}
                            </div>
                          )}
                          
                          {/* Intelligent Suggestion Chips as input fillers */}
                          {preExtractChat.length === 0 && (
                            <div className="px-3 py-2 flex flex-wrap gap-1.5 border-b border-slate-100 dark:border-slate-800/50">
                              {[
                                { label: "چه اطلاعاتی داره؟", text: "این سند چه اطلاعاتی داره و مربوط به چیه؟" },
                                { label: "فاکتور ارزی", text: "این فاکتور ارزی است؛ لطفاً نوع ارز را در استخراج دقت کن." },
                                { label: "دقت دست‌نویس", text: "سند دارای اقلام دست‌نویس است؛ روی خوانش ارقام مخدوش تمرکز کن." }
                              ].map((chip, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => setPreExtractInput(chip.text)}
                                  className={\`px-2 py-1 rounded-xl text-[9.5px] font-bold border transition-all \${
                                    isDarkMode
                                      ? "bg-slate-800/40 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                                  }\`}
                                >
                                  {chip.label}
                                </button>
                              ))}
                            </div>
                          )}

                          <div className="p-2 flex flex-col gap-2">
                             <div className="flex items-center gap-2">
                               <textarea
                                 rows={1}
                                 value={preExtractInput}
                                 onChange={(e) => setPreExtractInput(e.target.value)}
                                 onKeyDown={(e) => {
                                   if (e.key === "Enter" && !e.shiftKey) {
                                     e.preventDefault();
                                     handleSendPreExtractChat();
                                   }
                                 }}
                                 placeholder="درباره این سند بپرسید یا دستورالعمل بنویسید..."
                                 className={\`flex-1 bg-transparent text-[11px] outline-none px-2 resize-none \${isDarkMode ? "text-slate-200" : "text-slate-800"}\`}
                               />
                               <button 
                                 onClick={() => handleSendPreExtractChat()}
                                 disabled={!preExtractInput.trim() || isPreExtractChatLoading}
                                 className={\`p-1.5 rounded-xl shrink-0 transition-all \${
                                   !preExtractInput.trim() || isPreExtractChatLoading 
                                    ? "opacity-50 cursor-not-allowed" 
                                    : "bg-blue-600 hover:bg-blue-500 text-white shadow-sm"
                                 } \${isDarkMode && (!preExtractInput.trim() || isPreExtractChatLoading) ? "bg-slate-800 text-slate-500" : !isDarkMode && (!preExtractInput.trim() || isPreExtractChatLoading) ? "bg-slate-200 text-slate-400" : ""}\`}
                               >
                                  <Send className={\`w-4 h-4 \${(!preExtractInput.trim() || isPreExtractChatLoading) ? "" : "text-white"}\`} />
                               </button>
                             </div>
                             
                             <div className="px-2 pb-1">
                                <label className="flex items-center gap-1.5 cursor-pointer group">
                                  <input 
                                    type="checkbox"
                                    checked={customPrompt !== ""}
                                    onChange={(e) => setCustomPrompt(e.target.checked ? "لطفا طبق توافق در پیام‌های قبلی، استخراج را انجام بده و مواردی که با هم بررسی کردیم را اعمال کن." : "")}
                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500/30"
                                  />
                                  <span className={\`text-[10px] font-bold \${isDarkMode ? "text-slate-400 group-hover:text-slate-300" : "text-slate-500 group-hover:text-slate-700"}\`}>
                                    اعمال مکالمه بالا به عنوان دستورالعمل استخراج
                                  </span>
                                </label>
                             </div>
                          </div>
                        </div>
                      </div>
                    </div>`;

if (content.includes(target)) {
  fs.writeFileSync('src/App.tsx', content.replace(target, addition));
  console.log('Patched App.tsx successfully');
} else {
  console.log('Target not found in App.tsx');
}
