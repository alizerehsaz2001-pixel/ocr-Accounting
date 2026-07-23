content = open('server.ts').read()

old_code = '''        const currentConfig = { ...generateConfig };

        const response = await ai.models.generateContent({
          ...currentConfig,
          model: currentModel,
        });'''

new_code = '''        const currentConfig = { ...generateConfig };
        if (currentModel === "gemini-3.1-pro-preview") {
          currentConfig.config = currentConfig.config || {};
          currentConfig.config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
        }

        const response = await ai.models.generateContent({
          ...currentConfig,
          model: currentModel,
        });'''

if old_code in content:
    content = content.replace(old_code, new_code)
    open('server.ts', 'w').write(content)
    print("Patched thinking level in server.ts")
else:
    print("Could not find old_code in server.ts")
