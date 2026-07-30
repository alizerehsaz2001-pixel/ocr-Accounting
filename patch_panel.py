with open("src/App.tsx", "r", encoding="utf-8") as f:
    code = f.read()

import re

# We want to replace the whole Chat before extraction section
# From "{/* Chat before extraction */}" up to just before "{/* Actions */}"

start_marker = "{/* Chat before extraction */}"
end_marker = "{/* Actions */}"

start_idx = code.find(start_marker)
end_idx = code.find(end_marker)

if start_idx != -1 and end_idx != -1:
    old_section = code[start_idx:end_idx]
    
    new_section = '''{/* 100% Extraction Hero Card */}
                        <div className={`mt-2 p-4 rounded-3xl border flex flex-col md:flex-row items-center justify-between gap-4 transition-all ${
                          isDarkMode 
                            ? "bg-gradient-to-r from-amber-950/40 via-purple-950/40 to-indigo-950/40 border-amber-500/30 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.1)]" 
                            : "bg-gradient-to-r from-amber-50 via-purple-50 to-indigo-50 border-amber-200 text-amber-900 shadow-md"
                        }`}>
                          <div className="flex flex-col gap-1.5 flex-1">
                            <div className="flex items-center gap-2 font-extrabold text-[13px]">
                              <Zap className="w-5 h-5 text-amber-500 animate-bounce shrink-0" />
                              <span>دستور ویژه: استخراج ۱۰۰٪ تمام اطلاعات به JSON (فول اکسل)</span>
                            </div>
                            <p className={`text-[10px] leading-relaxed max-w-2xl ${isDarkMode ? "text-amber-300/80" : "text-amber-800/80"}`}>
                              این دستور تمامی اجزای سند اعم از هدر، تک‌تک سطرهای اقلام، تخفیفات، مالیات، کسورات و یادداشت‌ها را بدون هیچ حذفی استخراج و آماده ورود به اکسل می‌کند.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handleExtract100PercentAllToJsonAndExcel}
                            className="px-5 py-3 rounded-2xl text-[12px] font-black flex items-center gap-2 shrink-0 transition-all bg-gradient-to-r from-amber-500 via-purple-600 to-indigo-600 hover:from-amber-400 hover:via-purple-500 hover:to-indigo-500 text-white shadow-[0_4px_15px_rgba(245,158,11,0.3)] hover:shadow-[0_6px_20px_rgba(245,158,11,0.4)] hover:-translate-y-1 active:translate-y-0 cursor-pointer"
                          >
                            <Code className="w-5 h-5 text-amber-200" />
                            <span>اجرای استخراج ۱۰۰٪</span>
                          </button>
                        </div>
                        
                        '''
    code = code.replace(old_section, new_section)
    
    # We also need to fix handleDirectExtraction to not require isAiUnderstandingConfirmed
    code = code.replace(
        "    if (!isAiUnderstandingConfirmed) {\n      showNotification(\"لطفاً ابتدا تاییدیه تفهیم و درک هوش مصنوعی را بررسی و علامت بزنید.\", \"info\");\n      return;\n    }",
        ""
    )
    
    # And fix the disabled state of the "شروع استخراج نهایی" button
    # Replace: disabled={!isAiUnderstandingConfirmed} -> (remove it)
    # Replace: className logic for that button
    btn_old = """                              <button
                                type="button"
                                onClick={handleDirectExtraction}
                                disabled={!isAiUnderstandingConfirmed}
                                className={`px-5 py-2 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all ${
                                  isAiUnderstandingConfirmed 
                                    ? "bg-blue-600 hover:bg-blue-500 text-white shadow-md cursor-pointer hover:-translate-y-0.5" 
                                    : "bg-slate-300 dark:bg-slate-800 text-slate-500 dark:text-slate-500 cursor-not-allowed opacity-60"
                                }`}
                              >"""
                              
    btn_new = """                              <button
                                type="button"
                                onClick={handleDirectExtraction}
                                className="px-5 py-2 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all bg-blue-600 hover:bg-blue-500 text-white shadow-md cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
                              >"""
    code = code.replace(btn_old, btn_new)
    
    warning_old = """                              {!isAiUnderstandingConfirmed && (
                                <span className={`text-[8.5px] font-black ${isDarkMode ? "text-amber-400/80" : "text-amber-600"}`}>
                                  ⚠️ تاییدیه تفهیم هوش مصنوعی را در بالا علامت بزنید.
                                </span>
                              )}"""
    code = code.replace(warning_old, "")

    with open("src/App.tsx", "w", encoding="utf-8") as f:
        f.write(code)
    print("Patched successfully")
else:
    print("Markers not found")
