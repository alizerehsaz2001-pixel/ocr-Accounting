content = open('src/App.tsx').read()
content = content.replace('bg-[#F8FAFC] border-slate-200', 'bg-white/80 border-slate-200 backdrop-blur-md shadow-sm rounded-xl mb-4')
content = content.replace('bg-slate-900/60 border-slate-800', 'bg-slate-900/80 border-slate-800/80 backdrop-blur-md shadow-sm rounded-xl mb-4')
open('src/App.tsx', 'w').write(content)
