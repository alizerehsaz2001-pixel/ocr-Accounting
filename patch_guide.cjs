const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Replace setGuideOpen(!guideOpen) with setShowOnboarding(true)
content = content.replace(/onClick=\{\(\) => setGuideOpen\(!guideOpen\)\}/, 'onClick={() => setShowOnboarding(true)}');

// We should also remove the inline guide content to avoid duplicate functionality.
// The inline guide is between 2740 and some closing div. Let's find it.
const guideStart = content.indexOf('{guideOpen && (');
if (guideStart !== -1) {
    let depth = 0;
    let idx = guideStart;
    let started = false;
    while(idx < content.length) {
        if (content[idx] === '{') {
            depth++;
            started = true;
        }
        if (content[idx] === '}') {
            depth--;
        }
        idx++;
        if (started && depth === 0) {
            break;
        }
    }
    content = content.substring(0, guideStart) + content.substring(idx);
}

fs.writeFileSync('src/App.tsx', content);
console.log('App.tsx patched for guideOpen');
