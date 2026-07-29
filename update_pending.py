import re

with open("src/App.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Replace declaration
content = content.replace("const [pendingFile, setPendingFile] = useState<{", "const [pendingFiles, setPendingFiles] = useState<Array<{")
content = content.replace("id?: string;", "id?: string;\n    folder?: string;\n    preview?: string;")
content = content.replace("} | null>(null);", "}>>([]);")

# Replace useEffect dependency
content = content.replace("}, [pendingFile]);", "}, [pendingFiles]);")

# Replace multiple files logic
old_logic = """      if (convertedItems.length === 1 && !isBatchProcessing) {
        setPendingFile(convertedItems[0]);
        setCustomPrompt("");
      } else {
        startBatchExtractionPipeline(convertedItems);
      }"""

new_logic = """      if (convertedItems.length > 0) {
        setPendingFiles(prev => [...prev, ...convertedItems]);
        setCustomPrompt("");
        // Instead of starting immediately, we allow user to review pending files
      }"""
content = content.replace(old_logic, new_logic)

# Replace checks
content = content.replace("(!text.trim() && preExtractFiles.length === 0) || !pendingFile", "(!text.trim() && preExtractFiles.length === 0) || pendingFiles.length === 0")
content = content.replace("image: pendingFile.base64", "image: pendingFiles[0].base64")
content = content.replace("mimeType: pendingFile.mimeType", "mimeType: pendingFiles[0].mimeType")
content = content.replace("if (!pendingFile) return;", "if (pendingFiles.length === 0) return;")
content = content.replace("if (pendingFile) {", "if (pendingFiles.length > 0) {")
content = content.replace("const fileData = pendingFile;", "const filesData = [...pendingFiles];")
content = content.replace("setPendingFile(null);", "setPendingFiles([]);")

old_start = """    await startBatchExtractionPipeline([{
      id: fileData.id,
      name: fileData.name,
      size: fileData.size,
      preview: (fileData as any).preview || `data:${fileData.mimeType};base64,${fileData.base64}`,
      base64: fileData.base64,
      mimeType: fileData.mimeType,
      folder: fileData.folder
    }], finalPrompt);"""

new_start = """    await startBatchExtractionPipeline(filesData.map(fileData => ({
      id: fileData.id,
      name: fileData.name,
      size: fileData.size,
      preview: fileData.preview || `data:${fileData.mimeType};base64,${fileData.base64}`,
      base64: fileData.base64,
      mimeType: fileData.mimeType,
      folder: fileData.folder
    })), finalPrompt);"""

content = content.replace(old_start, new_start)

# Settings modal props
content = content.replace("pendingFile={pendingFile}", "pendingFiles={pendingFiles}")
content = content.replace("setPendingFile={setPendingFile}", "setPendingFiles={setPendingFiles}")

# Render checks
content = content.replace("{pendingFile ?", "{pendingFiles.length > 0 ?")
content = content.replace("{pendingFile.name}", "{pendingFiles.length === 1 ? pendingFiles[0].name : `${pendingFiles.length} سند`}")
content = content.replace("{Math.round(pendingFile.size / 1024)} KB", "{Math.round(pendingFiles.reduce((acc, f) => acc + f.size, 0) / 1024)} KB")
content = content.replace("openExclusiveChatForDocument(pendingFile)", "openExclusiveChatForDocument(pendingFiles[0])")

with open("src/App.tsx", "w", encoding="utf-8") as f:
    f.write(content)
