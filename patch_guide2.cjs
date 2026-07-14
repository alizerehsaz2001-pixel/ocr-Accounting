const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/const \[guideOpen, setGuideOpen\] = useState\(false\);\n/, '');

// The other reference is probably inside a className or icon toggle
// Let's replace the toggle icon part.
content = content.replace(/guideOpen \n\s*\? "bg-blue-600 text-white shadow-md shadow-blue-500\/20 ring-2 ring-blue-500\/30"\n\s*: \(isDarkMode \? "text-blue-400 bg-blue-500\/10 hover:bg-blue-500\/20" : "text-blue-600 bg-blue-50 hover:bg-blue-100"\)/, '(isDarkMode ? "text-blue-400 bg-blue-500/10 hover:bg-blue-500/20" : "text-blue-600 bg-blue-50 hover:bg-blue-100")');

// I might have not fully replaced it if the regex doesn't match perfectly. Let's just find and replace using string manipulation.
const indexGuideOpen = content.indexOf('guideOpen');
if (indexGuideOpen !== -1) {
   // Let's just remove the guideOpen variable entirely.
}
fs.writeFileSync('src/App.tsx', content);
