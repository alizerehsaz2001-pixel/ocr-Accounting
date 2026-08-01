const fs = require('fs');

let content = fs.readFileSync('src/components/AdminPanelModal.tsx', 'utf8');

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
  '  const [userSearchTerm, setUserSearchTerm] = useState("");',
  '  const [userSearchTerm, setUserSearchTerm] = useState("");\n' + func
);

fs.writeFileSync('src/components/AdminPanelModal.tsx', content);
