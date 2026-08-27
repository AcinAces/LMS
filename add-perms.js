const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(process.cwd(), 'backend/.tmp/data.db');
const db = new sqlite3.Database(dbPath);

const actions = [
  'api::lesson-message.chat.getChat',
  'api::lesson-message.chat.getStudents',
  'api::lesson-message.chat.sendMessage',
  'api::lesson-message.chat.markRead'
];

db.serialize(() => {
  db.get('SELECT id FROM up_roles WHERE type = ?', ['authenticated'], (err, role) => {
    if (err || !role) {
      console.log('Role not found', err);
      return;
    }
    
    actions.forEach(action => {
      db.get('SELECT id FROM up_permissions WHERE action = ? AND role_id = ?', [action, role.id], (err, perm) => {
        if (!perm) {
          db.run("INSERT INTO up_permissions (action, role_id, created_at, updated_at) VALUES (?, ?, datetime('now'), datetime('now'))", [action, role.id], (err) => {
            if (err) console.error(err);
            else console.log('Added perm for', action);
          });
        } else {
          console.log('Perm already exists for', action);
        }
      });
    });
  });
});
