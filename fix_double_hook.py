import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# find first occurrence of useEffect fetchAllUsers block
match = re.search(r'  useEffect\(\(\) => \{\n    const fetchAllUsers.*?\}, \[currentUser\?.role, currentUser\?.id\]\);\n', content, re.DOTALL)

if match:
    # remove all occurrences
    content = content.replace(match.group(0), "")
    
    # insert one occurrence
    content = content.replace(
        '  useEffect(() => {\n    localStorage.setItem("system_users", JSON.stringify(users));\n  }, [users]);',
        match.group(0) + '\n  useEffect(() => {\n    localStorage.setItem("system_users", JSON.stringify(users));\n  }, [users]);'
    )
    
    with open('src/App.tsx', 'w') as f:
        f.write(content)

