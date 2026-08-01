import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Add onSnapshot to imports if missing
if "onSnapshot" not in content:
    content = content.replace(
        'import { doc, getDoc, setDoc, collection, getDocs, deleteDoc } from "firebase/firestore";',
        'import { doc, getDoc, setDoc, collection, getDocs, deleteDoc, onSnapshot } from "firebase/firestore";'
    )

new_hook = """  // Sync users from Firestore if admin
  useEffect(() => {
    if (currentUser && ['admin', 'manager', 'auditor'].includes(currentUser.role)) {
      const isDemo = localStorage.getItem("is_demo_mode") === "true";
      if (!isDemo && auth.currentUser) {
        const usersRef = collection(db, "users");
        const unsubscribe = onSnapshot(usersRef, (snapshot) => {
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
        }, (err) => {
          console.warn("Failed to listen to all users:", err);
        });
        return () => unsubscribe();
      }
    }
  }, [currentUser?.role, currentUser?.id]);"""

# Replace everything from "// Sync users from Firestore if admin" to "}, [currentUser?.role, currentUser?.id]);"
content = re.sub(
    r'// Sync users from Firestore if admin.*?\}, \[currentUser\?\.role, currentUser\?\.id\]\);',
    new_hook,
    content,
    flags=re.DOTALL
)

with open('src/App.tsx', 'w') as f:
    f.write(content)
