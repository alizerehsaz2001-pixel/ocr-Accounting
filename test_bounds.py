import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

start_str = "              {pendingFile ? ("
idx_start = content.find(start_str)

end_str = """              ) : (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.98, y: 10 }}"""
idx_end = content.find(end_str)

print("idx_start:", idx_start)
print("idx_end:", idx_end)
