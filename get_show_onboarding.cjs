const fs = require('fs');
const lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');
console.log(lines.slice(830, 840).join('\n'));
