import re

with open('firestore.rules', 'r') as f:
    content = f.read()

content = content.replace(
    "&& data.role in ['admin', 'user']",
    "&& data.role in ['admin', 'user', 'manager', 'auditor']"
)
content = content.replace(
    "&& get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'",
    "&& get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'manager', 'auditor']"
)

with open('firestore.rules', 'w') as f:
    f.write(content)
