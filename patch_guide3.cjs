const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');
content = content.replace(/guideOpen \n\s*\? "bg-blue-600\/15 text-blue-400 border-r-4 border-blue-500 font-bold"\n\s*: "text-slate-400 hover:bg-slate-800\/50 hover:text-white"/g, 'showOnboarding \n                ? "bg-blue-600/15 text-blue-400 border-r-4 border-blue-500 font-bold"\n                : "text-slate-400 hover:bg-slate-800/50 hover:text-white"');

fs.writeFileSync('src/App.tsx', content);
