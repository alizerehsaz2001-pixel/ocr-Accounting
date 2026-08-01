import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

content = re.sub(
    r'u\.role === "admin"[\s\n]*\? "bg-purple-100 text-purple-700"[\s\n]*: "bg-blue-100 text-blue-700"',
    r'u.role === "admin" ? "bg-purple-100 text-purple-700" : u.role === "manager" ? "bg-amber-100 text-amber-700" : u.role === "auditor" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"',
    content,
    flags=re.MULTILINE
)

with open('src/App.tsx', 'w') as f:
    f.write(content)

