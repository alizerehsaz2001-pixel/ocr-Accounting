import re
with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()
if "isAiSettingsOpen" in content:
    print("Modal successfully added.")
else:
    print("Modal failed to add.")
