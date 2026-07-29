import re

with open("src/App.tsx", "r", encoding="utf-8") as f:
    content = f.read()

bad_str = """    fileList: Array<{
      id?: string;
    folder?: string;
    preview?: string;
      name: string;
      size: number;
      preview?: string;
      base64: string;
      mimeType: string;
      folder?: string;
    }>,"""

good_str = """    fileList: Array<{
      id?: string;
      name: string;
      size: number;
      preview?: string;
      base64: string;
      mimeType: string;
      folder?: string;
    }>,"""

content = content.replace(bad_str, good_str)

with open("src/App.tsx", "w", encoding="utf-8") as f:
    f.write(content)
