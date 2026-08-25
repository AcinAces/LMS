const fs = require('fs');
const files = fs.readdirSync('backend').filter(f => f.endsWith('.js'));
files.forEach(f => {
  let p = 'backend/' + f;
  let content = fs.readFileSync(p, 'utf8');
  if (content.includes('postgresql://')) {
    content = content.replace(/['""]postgresql:\/\/[^'""]+['""]/g, 'process.env.DATABASE_URL');
    if (!content.includes('dotenv')) {
      content = "require('dotenv').config();\n" + content;
    }
    fs.writeFileSync(p, content);
    console.log('Scrubbed: ' + f);
  }
});
