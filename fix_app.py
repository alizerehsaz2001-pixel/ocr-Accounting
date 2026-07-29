import re

with open("src/App.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Fix pendingFiles state declaration
content = content.replace("""  const [pendingFiles, setPendingFiles] = useState<Array<{ 
    base64: string; 
    name: string; 
    mimeType: string; 
    size: number;
    id?: string;
    folder?: string;
    preview?: string;
    folder?: string;
  }>([]);""", """  const [pendingFiles, setPendingFiles] = useState<Array<{ 
    base64: string; 
    name: string; 
    mimeType: string; 
    size: number;
    id?: string;
    folder?: string;
    preview?: string;
  }>>([]);""")

# Fix notification state
content = content.replace("""  const [notification, setNotification] = useState<{
    text: string;
    type: "success" | "error" | "info";
  }>([]);""", """  const [notification, setNotification] = useState<{
    text: string;
    type: "success" | "error" | "info" | "warning";
  } | null>(null);""")

with open("src/App.tsx", "w", encoding="utf-8") as f:
    f.write(content)
