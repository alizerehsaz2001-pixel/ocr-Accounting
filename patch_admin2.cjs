const fs = require('fs');

let content = fs.readFileSync('src/components/AdminPanelModal.tsx', 'utf8');

content = content.replace(
  'setUsers(prev => [created, ...prev]);',
  'setUsers(prev => [created, ...prev]);\n    updateUserInFirestore(created.id, created);'
);

fs.writeFileSync('src/components/AdminPanelModal.tsx', content);
