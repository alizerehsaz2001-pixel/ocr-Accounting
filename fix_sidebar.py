import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

sidebar_btn = """          <button
            onClick={() => setShowOnboarding(true)}"""

new_sidebar_btn = """          <button
            onClick={() => setIsAiSettingsOpen(true)}
            className={`w-full flex items-center px-4 py-2 transition-all duration-200 text-right ${
              isAiSettingsOpen 
                 ? isDarkMode 
                   ? "bg-fuchsia-500/10 text-fuchsia-400 border-r-2 border-fuchsia-500 font-bold" 
                   : "bg-fuchsia-50 text-fuchsia-600 border-r-2 border-fuchsia-600 font-bold"
                 : isDarkMode 
                   ? "text-slate-400 hover:bg-slate-800/40 hover:text-white" 
                   : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900"
            }`}
          >
            <Settings className={`h-4 w-4 ml-2.5 shrink-0 transition-colors ${isAiSettingsOpen ? "text-fuchsia-500" : isDarkMode ? "text-slate-500" : "text-slate-400"}`} />
            <span className="text-[11.5px]">تنظیمات هوش مصنوعی</span>
          </button>
          <button
            onClick={() => setShowOnboarding(true)}"""

content = content.replace(sidebar_btn, new_sidebar_btn)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
