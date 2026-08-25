const fs = require('fs');
const path = require('path');

const walk = (dir, done) => {
  let results = [];
  fs.readdir(dir, (err, list) => {
    if (err) return done(err);
    let pending = list.length;
    if (!pending) return done(null, results);
    list.forEach(file => {
      file = path.resolve(dir, file);
      fs.stat(file, (err, stat) => {
        if (stat && stat.isDirectory()) {
          walk(file, (err, res) => {
            results = results.concat(res);
            if (!--pending) done(null, results);
          });
        } else {
          if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            results.push(file);
          }
          if (!--pending) done(null, results);
        }
      });
    });
  });
};

walk('frontend/src', (err, results) => {
  if (err) throw err;
  let count = 0;
  results.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    
    // First, convert 'http://localhost:1337...' and "http://localhost:1337..." to `http://localhost:1337...`
    content = content.replace(/'http:\/\/localhost:1337([^']*)'/g, "`http://localhost:1337$1`");
    content = content.replace(/"http:\/\/localhost:1337([^"]*)"/g, "`http://localhost:1337$1`");
    
    // Now replace http://localhost:1337 inside backticks with the env var
    // In JS replace string, $$ means a literal $
    const replacement = "$${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}";
    content = content.replace(/http:\/\/localhost:1337/g, replacement);
    
    if (content !== original) {
      fs.writeFileSync(file, content, 'utf8');
      count++;
    }
  });
  console.log('Modified ' + count + ' files.');
});
