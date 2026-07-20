import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

state_code = """  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => {
    return localStorage.getItem("has_seen_onboarding") !== "true";
  });
  const [isAiSettingsOpen, setIsAiSettingsOpen] = useState(false);"""

content = content.replace('  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => {\n    return localStorage.getItem("has_seen_onboarding") !== "true";\n  });', state_code)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
