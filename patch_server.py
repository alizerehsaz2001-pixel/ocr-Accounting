import re

content = open('server.ts').read()

# Add to allowed models in the array
content = content.replace('"gemini-3.6-flash",\n      "gemini-flash-latest"', '"gemini-3.6-flash",\n      "gemini-flash-latest",\n      "gemini-3.1-pro-preview"')

content = content.replace('["gemini-3.6-flash", "gemini-3.6-flash"].includes(model)', '["gemini-3.6-flash", "gemini-3.1-pro-preview"].includes(model)')

open('server.ts', 'w').write(content)
