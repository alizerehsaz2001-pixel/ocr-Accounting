import fs from "fs";

const content = fs.readFileSync("src/App.tsx", "utf-8");

const target = `                        {/* Custom Prompt */}
                        <div className="flex flex-col gap-2">
                          <label className={\`text-[11px] font-bold flex items-center gap-1.5 \${isDarkMode ? "text-slate-300" : "text-slate-700"}\`}>
                             <FileEdit className="w-3.5 h-3.5 text-purple-500" /> پرامپت اختصاصی (اختیاری):
                          </label>
                          <textarea
                            rows={2}
                            value={customPrompt}
                            onChange={(e) => setCustomPrompt(e.target.value)}
                            placeholder="دستورالعمل خاصی اگر دارید بنویسید..."
                            className={\`w-full p-2.5 rounded-xl border text-[11px] outline-none resize-none \${isDarkMode ? "bg-slate-950 border-slate-800 text-slate-200 focus:border-blue-500/50" : "bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500/50"}\`}
                          />
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/60">`;

const replacement = `                        {/* Custom Prompt */}
                        <div className="flex flex-col gap-2">
                          <label className={\`text-[11px] font-bold flex items-center gap-1.5 \${isDarkMode ? "text-slate-300" : "text-slate-700"}\`}>
                             <FileEdit className="w-3.5 h-3.5 text-purple-500" /> پرامپت (الزامی):
                          </label>
                          <textarea
                            rows={2}
                            value={customPrompt}
                            onChange={(e) => setCustomPrompt(e.target.value)}
                            placeholder="دستورالعمل خاصی اگر دارید بنویسید (الزامی)..."
                            className={\`w-full p-2.5 rounded-xl border text-[11px] outline-none resize-none \${isDarkMode ? "bg-slate-950 border-slate-800 text-slate-200 focus:border-blue-500/50" : "bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500/50"}\`}
                            required
                          />
                        </div>

                        {/* Chat before extraction */}
                        <div className="flex flex-col gap-2 border-t pt-4 dark:border-slate-800/60 border-slate-200">
                          <label className={\`text-[11px] font-bold flex items-center gap-1.5 \${isDarkMode ? "text-slate-300" : "text-slate-700"}\`}>
                             <MessageSquare className="w-3.5 h-3.5 text-blue-500" /> گفتگوی پیش از استخراج (اطمینان از درستی داده‌ها):
                          </label>
                          <div className={\`flex flex-col gap-2 p-3 rounded-xl max-h-40 overflow-y-auto \${isDarkMode ? "bg-slate-900/50" : "bg-slate-50"}\`}>
                            {preExtractChat.length === 0 ? (
                              <p className={\`text-[10px] text-center \${isDarkMode ? "text-slate-500" : "text-slate-400"}\`}>هنوز گفتگویی انجام نشده است. می‌توانید سوالات خود را درباره سند بپرسید.</p>
                            ) : (
                              preExtractChat.map((msg, i) => (
                                <div key={i} className={\`p-2 rounded-lg text-[10px] \${msg.role === 'user' ? (isDarkMode ? 'bg-blue-900/30 text-blue-200 ml-4' : 'bg-blue-50 text-blue-800 ml-4') : (isDarkMode ? 'bg-slate-800 text-slate-300 mr-4' : 'bg-white border text-slate-700 mr-4')}\`}>
                                  <strong>{msg.role === 'user' ? 'شما' : 'هوش مصنوعی'}:</strong> {msg.text}
                                </div>
                              ))
                            )}
                            {isPreExtractChatLoading && (
                              <div className="flex items-center gap-2 p-2">
                                <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-[10px] text-slate-500">در حال پاسخگویی...</span>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={preExtractInput}
                              onChange={(e) => setPreExtractInput(e.target.value)}
                              onKeyDown={(e) => { if(e.key === 'Enter') handleSendPreExtractChat(); }}
                              placeholder="سوال خود را بپرسید..."
                              className={\`flex-1 p-2 rounded-lg border text-[11px] outline-none \${isDarkMode ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-white border-slate-200 text-slate-800"}\`}
                            />
                            <button
                              onClick={() => handleSendPreExtractChat()}
                              disabled={isPreExtractChatLoading || !preExtractInput.trim()}
                              className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all disabled:opacity-50"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/60">`;

if (content.includes(target)) {
  fs.writeFileSync("src/App.tsx", content.replace(target, replacement));
  console.log("Replaced successfully!");
} else {
  console.log("Target not found!");
}
