import re

content = open('src/App.tsx').read()

# I want to add subtle enhancements to "Smart Extraction Quality & Validation Dashboard"
# For instance, bg-[#111827]/40 -> bg-[#0a0f18]/40
content = content.replace('bg-[#111827]/40', 'bg-slate-900/60 shadow-inner')
content = content.replace('bg-slate-50/50 border-slate-200', 'bg-slate-50 border-slate-200 shadow-sm')

# For the table DynamicTable.tsx
table_content = open('src/components/DynamicTable.tsx').read()
table_content = table_content.replace('divide-slate-100 dark:divide-slate-800/40 relative', 'divide-slate-200 dark:divide-slate-800 relative')
table_content = table_content.replace('bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-md shadow-[0_1px_2px_rgba(0,0,0,0.03)] border-b border-l', 'bg-slate-100/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-l')

# Update row hover
table_content = table_content.replace('hover:-translate-y-0.5 hover:scale-[1.006]', 'hover:-translate-y-0.5 hover:scale-[1.002] hover:shadow-lg')

open('src/App.tsx', 'w').write(content)
open('src/components/DynamicTable.tsx', 'w').write(table_content)
print("Dashboard and Table updated.")
