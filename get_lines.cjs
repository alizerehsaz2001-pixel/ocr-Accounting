const fs = require('fs');
const lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');
console.log(lines.slice(1235, 1245).join('\n'));
console.log('---');
console.log(lines.slice(2195, 2215).join('\n'));
