const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Remove my OnboardingWizard import
content = content.replace(/import OnboardingWizard from "\.\/components\/OnboardingWizard";\n/, '');

// Remove my state block
const stateRegex = /const \[hasSeenOnboarding, setHasSeenOnboarding\] = useState\(true\);\s*useEffect\(\(\) => \{\s*const hasSeen = localStorage.getItem\('hasSeenOnboarding'\);\s*if \(\!hasSeen\) \{\s*setHasSeenOnboarding\(false\);\s*\}\s*\}, \[\]\);\s*const handleCloseOnboarding = \(\) => \{\s*setHasSeenOnboarding\(true\);\s*localStorage.setItem\('hasSeenOnboarding', 'true'\);\s*\};\s*const \[guideOpen, setGuideOpen\] = useState\(false\);/;
content = content.replace(stateRegex, 'const [guideOpen, setGuideOpen] = useState(false);');

// Revert the render block
content = content.replace(/return \(\s*<>\s*<OnboardingWizard isOpen=\{\!hasSeenOnboarding\} onClose=\{handleCloseOnboarding\} isDarkMode=\{isDarkMode\} \/>\s*<div/, 'return (\n    <div');
content = content.replace(/<\/div>\s*<\/>\s*\);\s*\}\s*$/, '</div>\n  );\n}');

fs.writeFileSync('src/App.tsx', content);
