const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf8');

const lines = content.split('\n');

let startIndex = lines.findIndex(line => line.includes('{/* Bento Grid of analysis metrics */}'));
let endIndex = lines.findIndex((line, idx) => idx > startIndex && line.includes('{/* Smart Extraction Quality & Validation Dashboard */}'));

console.log("Start:", startIndex, "End:", endIndex);
