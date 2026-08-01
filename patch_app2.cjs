const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  'setUsers(prev => prev.map(usr => usr.id === u.id ? {...usr, apiUsage: 0} : usr));',
  'setUsers(prev => prev.map(usr => usr.id === u.id ? {...usr, apiUsage: 0} : usr));\n                                          if (auth.currentUser && !localStorage.getItem("is_demo_mode")) { setDoc(doc(db, "users", String(u.id)), { apiUsage: 0 }, { merge: true }); }'
);

fs.writeFileSync('src/App.tsx', content);
