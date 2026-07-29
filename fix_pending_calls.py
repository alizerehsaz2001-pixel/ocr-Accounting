import re

with open("src/App.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("setPendingFile({", "setPendingFiles([{")
content = content.replace("size: scan.file.size,\n    });", "size: scan.file.size,\n    }]);")
content = content.replace("size: estimatedSize\n      });", "size: estimatedSize\n      }]);")
content = content.replace("setPendingFile(convertedItems[0]);", "setPendingFiles([convertedItems[0]]);")

with open("src/App.tsx", "w", encoding="utf-8") as f:
    f.write(content)
