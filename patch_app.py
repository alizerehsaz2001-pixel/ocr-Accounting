import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Add getDocs to import if not present
if "getDocs" not in content:
    content = content.replace(
        'import { doc, getDoc, setDoc, collection, deleteDoc } from "firebase/firestore";',
        'import { doc, getDoc, setDoc, collection, getDocs, deleteDoc } from "firebase/firestore";'
    )

hook_str = """
  // Sync users from Firestore if admin
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
"""

content = content.replace(
    '  useEffect(() => {\n    localStorage.setItem("system_users", JSON.stringify(users));\n  }, [users]);',
    hook_str + '\n  useEffect(() => {\n    localStorage.setItem("system_users", JSON.stringify(users));\n  }, [users]);'
)

with open('src/App.tsx', 'w') as f:
    f.write(content)
