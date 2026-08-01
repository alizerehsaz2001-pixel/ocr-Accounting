const fs = require('fs');

let content = fs.readFileSync('src/components/AdminPanelModal.tsx', 'utf8');

// Add imports
content = content.replace(
  'import * as XLSX from "xlsx";',
  'import * as XLSX from "xlsx";\nimport { db } from "../lib/firebase";\nimport { doc, setDoc } from "firebase/firestore";'
);

// Add the wrapper function inside the component
const func = `
  const updateUserInFirestore = async (userId: string, updates: any) => {
    try {
      const userRef = doc(db, "users", String(userId));
      await setDoc(userRef, updates, { merge: true });
    } catch(err) {
      console.warn("Failed to update user in Firestore:", err);
    }
  };
`;
content = content.replace(
  '  const [systemTab, setSystemTab] = useState<"logs" | "backups" | "settings">("logs");',
  '  const [systemTab, setSystemTab] = useState<"logs" | "backups" | "settings">("logs");\n' + func
);

// Replace setUsers updates with wrapper calls
content = content.replace(
  /setUsers\(prev => prev\.map\(usr => usr\.id === u\.id \? \{ \.\.\.usr, role: newRole \} : usr\)\);/g,
  `setUsers(prev => prev.map(usr => usr.id === u.id ? { ...usr, role: newRole } : usr));\n                              updateUserInFirestore(u.id, { role: newRole });`
);

content = content.replace(
  /setUsers\(prev => prev\.map\(usr => usr\.id === u\.id \? \{ \.\.\.usr, extraStorage: parsed \} : usr\)\);/g,
  `setUsers(prev => prev.map(usr => usr.id === u.id ? { ...usr, extraStorage: parsed } : usr));\n                                  updateUserInFirestore(u.id, { extraStorage: parsed });`
);

content = content.replace(
  /setUsers\(prev => prev\.map\(usr => usr\.id === u\.id \? \{\.\.\.usr, status: usr\.status === "active" \? "suspended" : "active"\} : usr\)\);/g,
  `const newStatus = u.status === "active" ? "suspended" : "active";\n                                setUsers(prev => prev.map(usr => usr.id === u.id ? {...usr, status: newStatus} : usr));\n                                updateUserInFirestore(u.id, { status: newStatus });`
);

fs.writeFileSync('src/components/AdminPanelModal.tsx', content);
