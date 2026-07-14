const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf8');

const startIdx = content.indexOf('{/* Admin Panel Modal */}');
const endIdx = content.indexOf('{/* Token Management Panel Modal */}');

if (startIdx !== -1 && endIdx !== -1) {
    const original = content.substring(startIdx, endIdx);
    
    // Write original block to file for backup/reference
    fs.writeFileSync('original_admin.txt', original);
    console.log('Original block extracted successfully.');
} else {
    console.log('Could not find block boundaries.');
}
