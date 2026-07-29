import re

with open("src/components/AiSettingsModal.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("pendingFile: {", "pendingFiles: Array<{")
content = content.replace("id?: string;", "id?: string;\n    folder?: string;\n    preview?: string;")
content = content.replace("} | null;", "}>>;")
content = content.replace("setPendingFile: (", "setPendingFiles: (")
content = content.replace("pendingFile,", "pendingFiles,")
content = content.replace("setPendingFile,", "setPendingFiles,")
content = content.replace("{pendingFile ?", "{pendingFiles.length > 0 ?")
content = content.replace("{pendingFile && (", "{pendingFiles.length > 0 && (")
content = content.replace("setPendingFile(null)", "setPendingFiles([])")

content = content.replace("{pendingFile.name}", "{pendingFiles.length === 1 ? pendingFiles[0].name : `${pendingFiles.length} سند`}")
content = content.replace("{Math.round(pendingFile.size / 1024)} KB", "{Math.round(pendingFiles.reduce((acc, f) => acc + f.size, 0) / 1024)} KB")

with open("src/components/AiSettingsModal.tsx", "w", encoding="utf-8") as f:
    f.write(content)
