const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  `                                      u.role === "admin"
                                       ? "bg-purple-100 text-purple-700"
                                       : "bg-blue-100 text-blue-700"`,
  `                                      u.role === "admin"
                                       ? "bg-purple-100 text-purple-700"
                                       : u.role === "manager"
                                       ? "bg-amber-100 text-amber-700"
                                       : u.role === "auditor"
                                       ? "bg-emerald-100 text-emerald-700"
                                       : "bg-blue-100 text-blue-700"`
);

content = content.replace(
  `                                      u.role === "admin" \n                                       ? "bg-purple-100 text-purple-700" \n                                       : "bg-blue-100 text-blue-700"`,
  `                                      u.role === "admin"
                                       ? "bg-purple-100 text-purple-700"
                                       : u.role === "manager"
                                       ? "bg-amber-100 text-amber-700"
                                       : u.role === "auditor"
                                       ? "bg-emerald-100 text-emerald-700"
                                       : "bg-blue-100 text-blue-700"`
);

fs.writeFileSync('src/App.tsx', content);
