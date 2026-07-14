const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const importRegex = /import React, \{[^\}]+\} from "react";/;
content = content.replace(importRegex, 'import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";');

const onboardImport = 'import OnboardingWizard from "./components/OnboardingWizard";\n';
if (!content.includes('import OnboardingWizard')) {
    content = content.replace(/import CameraCapture from "\.\/components\/CameraCapture";/, onboardImport + 'import CameraCapture from "./components/CameraCapture";');
}

const stateRegex = /const \[guideOpen, setGuideOpen\] = useState\(false\);/;
if (content.match(stateRegex)) {
    const newState = `const [hasSeenOnboarding, setHasSeenOnboarding] = useState(true);
  
  useEffect(() => {
    const hasSeen = localStorage.getItem('hasSeenOnboarding');
    if (!hasSeen) {
      setHasSeenOnboarding(false);
    }
  }, []);

  const handleCloseOnboarding = () => {
    setHasSeenOnboarding(true);
    localStorage.setItem('hasSeenOnboarding', 'true');
  };

  const [guideOpen, setGuideOpen] = useState(false);`;
    content = content.replace(stateRegex, newState);
}

// Ensure Onboarding component is rendered right after the outermost container
const appReturnRegex = /return \(\s*<div/;
if (content.match(appReturnRegex)) {
    content = content.replace(appReturnRegex, 'return (\n    <>\n      <OnboardingWizard isOpen={!hasSeenOnboarding} onClose={handleCloseOnboarding} isDarkMode={isDarkMode} />\n      <div');
    const appReturnEndRegex = /<\/div>\s*\);\s*\}\s*$/;
    content = content.replace(appReturnEndRegex, '</div>\n    </>\n  );\n}');
}

fs.writeFileSync('src/App.tsx', content);
console.log('App.tsx patched for OnboardingWizard');
