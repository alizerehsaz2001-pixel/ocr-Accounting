const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

const hookStr = `
  useEffect(() => {
    const fetchAllUsers = async () => {
      if (currentUser && ['admin', 'manager', 'auditor'].includes(currentUser.role)) {
        const isDemo = localStorage.getItem("is_demo_mode") === "true";
        if (!isDemo && auth.currentUser) {
          try {
            const usersRef = collection(db, "users");
            const snapshot = await getDocs(usersRef);
            if (!snapshot.empty) {
              const allUsers = snapshot.docs.map(doc => doc.data());
              setUsers(prev => {
                const merged = [...prev];
                allUsers.forEach(u => {
                  const idx = merged.findIndex(mu => String(mu.id) === String(u.id));
                  if (idx >= 0) {
                    merged[idx] = { ...merged[idx], ...u };
                  } else {
                    merged.push(u);
                  }
                });
                return merged;
              });
            }
          } catch (e) {
            console.warn("Failed to fetch all users:", e);
          }
        }
      }
    };
    fetchAllUsers();
  }, [currentUser?.role, currentUser?.id]);
`;

content = content.replace(
  `  useEffect(() => {
    localStorage.setItem("system_users", JSON.stringify(users));
  }, [users]);`,
  hookStr + `\n  useEffect(() => {\n    localStorage.setItem("system_users", JSON.stringify(users));\n  }, [users]);`
);

fs.writeFileSync('src/App.tsx', content);
