import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Add onSnapshot to imports if missing
if "onSnapshot" not in content:
    content = content.replace(
        'import { doc, getDoc, setDoc, collection, getDocs, deleteDoc } from "firebase/firestore";',
        'import { doc, getDoc, setDoc, collection, getDocs, deleteDoc, onSnapshot } from "firebase/firestore";'
    )

old_hook = """  // Sync users from Firestore if admin
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
  }, [currentUser?.role, currentUser?.id]);"""

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

if old_hook in content:
    content = content.replace(old_hook, new_hook)
else:
    print("Could not find old hook to replace.")

with open('src/App.tsx', 'w') as f:
    f.write(content)
