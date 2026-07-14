const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf8');

const startIdx = content.indexOf('{guideOpen && (');
if (startIdx !== -1) {
  let depth = 0;
  let idx = startIdx;
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
  console.log(content.substring(startIdx, idx));
} else {
  console.log('Not found');
}
