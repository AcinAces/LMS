const fs = require('fs');
let file = 'frontend/src/app/page.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/'http:\/\/127\.0\.0\.1:1337([^']*)'/g, "\http://127.0.0.1:1337\\");
content = content.replace(/http:\/\/127\.0\.0\.1:1337/g, "\$\");
fs.writeFileSync(file, content);
