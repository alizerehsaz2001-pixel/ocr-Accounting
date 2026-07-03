import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

// Replace (اختیاری) with (اجباری)
content = content.replace(
  'گفتگو با هوش مصنوعی درباره این سند قبل از استخراج (اختیاری):',
  'گفتگو با هوش مصنوعی درباره این سند قبل از استخراج (اجباری):'
);

// Update the start extraction button
const buttonTarget = `                          onClick={async () => {
                            if (!pendingFile) return;
                            setIsExtracting(true);`;

const buttonReplacement = `                          disabled={preExtractChat.length === 0}
                          onClick={async () => {
                            if (!pendingFile || preExtractChat.length === 0) return;
                            setIsExtracting(true);`;

if (content.includes(buttonTarget)) {
  content = content.replace(buttonTarget, buttonReplacement);
} else {
  console.error("buttonTarget not found");
}

const classTarget = `                          className="px-4.5 py-2 rounded-xl text-[11px] font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 shadow-md shadow-blue-500/10 hover:shadow-blue-500/20 hover:-translate-y-0.5 transition-all"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-blue-200 shrink-0" />
                          <span>شروع تحلیل و استخراج</span>
                        </button>`;

const classReplacement = `                          className={\`px-4.5 py-2 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all \${
                            preExtractChat.length === 0 
                              ? "bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed" 
                              : "bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/10 hover:shadow-blue-500/20 hover:-translate-y-0.5"
                          }\`}
                        >
                          <Sparkles className={\`w-3.5 h-3.5 shrink-0 \${preExtractChat.length === 0 ? "text-slate-400 dark:text-slate-500" : "text-blue-200"}\`} />
                          <span>شروع تحلیل و استخراج</span>
                        </button>`;

if (content.includes(classTarget)) {
  content = content.replace(classTarget, classReplacement);
} else {
  console.error("classTarget not found");
}

fs.writeFileSync('src/App.tsx', content);
console.log('Successfully patched App.tsx for mandatory chat');
