import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

new_guide = """                {/* Guide Area */}
                <div className={`p-4 rounded-2xl border ${isDarkMode ? "bg-slate-950/40 border-slate-800" : "bg-blue-50/20 border-blue-100"}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen className="w-4 h-4 text-blue-500" />
                    <span className={`text-[11.5px] font-black ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>
                      چک‌لیست عکاسی برای استخراج دقیق:
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { title: "📐 بدون زاویه و مستقیم", desc: "سند را کاملاً تخت قرار دهید و دوربین را دقیقاً از بالا بگیرید." },
                      { title: "☀️ نورپردازی یکنواخت", desc: "از عکاسی زیر نور مستقیم شدید یا سایه خودداری کنید." },
                      { title: "✏️ ممیزی عمیق", desc: "برای پردازش برگه‌های خط‌خورده ممیزی سخت‌گیرانه را فعال کنید." },
                      { title: "📄 تجمیع اسناد", desc: "فاکتور و فیش واریزی آن را می‌توان همزمان آپلود کرد." }
                    ].map((step, idx) => (
                      <div key={idx} className={`p-2.5 rounded-xl border ${isDarkMode ? "bg-slate-900/60 border-slate-800/80" : "bg-white border-slate-150 shadow-sm"}`}>
                        <h6 className={`text-[9.5px] font-extrabold ${isDarkMode ? "text-slate-200" : "text-slate-800"} mb-1`}>{step.title}</h6>
                        <p className={`text-[8.5px] leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>{step.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Model */}"""

content = content.replace("{/* Model */}", new_guide)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
