with open("src/App.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "setPendingFiles([{" in lines[i]:
        # find the corresponding closing }
        j = i + 1
        while j < len(lines):
            if "});" in lines[j] and "setCustomPrompt" in lines[j+1]:
                lines[j] = lines[j].replace("});", "}]);")
                break
            j += 1

with open("src/App.tsx", "w", encoding="utf-8") as f:
    f.writelines(lines)
