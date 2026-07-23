import re

content = open('src/components/AiSettingsModal.tsx').read()
content = content.replace(
    '<option value="gemini-3.6-flash">Gemini 3.6 Flash (آخرین نسخه - سریع و هوشمند)</option>',
    '<option value="gemini-3.6-flash">Gemini 3.6 Flash (آخرین نسخه - سریع و هوشمند)</option>\n                   <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (استدلال پیشرفته - Thinking High)</option>'
)
open('src/components/AiSettingsModal.tsx', 'w').write(content)
print("Updated AiSettingsModal")

content = open('src/App.tsx').read()
content = content.replace(
    '<option value="gemini-3.6-flash">Gemini 3.6 Flash (آخرین آپدیت - سریع و هوشمند)</option>',
    '<option value="gemini-3.6-flash">Gemini 3.6 Flash (آخرین آپدیت - سریع و هوشمند)</option>\n                             <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (استدلال پیشرفته - Thinking High)</option>'
)

# Add it to the usage map initialization
content = content.replace(
    '"gemini-3.6-flash": { limit: 2000, used: 0, lastReset: Date.now() },',
    '"gemini-3.6-flash": { limit: 2000, used: 0, lastReset: Date.now() },\n      "gemini-3.1-pro-preview": { limit: 50, used: 0, lastReset: Date.now() },'
)
open('src/App.tsx', 'w').write(content)
print("Updated App.tsx")
