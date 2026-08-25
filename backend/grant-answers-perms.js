const { Client } = require('pg');
const crypto = require('crypto');
const client = new Client({ 
  connectionString: 'postgresql://postgres:toNemZIHpFebRFLtQHGBtJqoutFpkbfC@altaria.proxy.rlwy.net:36817/railway',
  ssl: { rejectUnauthorized: false }
});
async function run() {
  try {
    await client.connect();
    const roles = await client.query("SELECT id, type FROM up_roles WHERE type IN ('authenticated', 'instructor', 'content_manager');");
    const actions = [
      'api::quiz-answer.quiz-answer.find',
      'api::quiz-answer.quiz-answer.findOne',
      'api::quiz-answer.quiz-answer.create',
      'api::quiz-answer.quiz-answer.update',
      'api::quiz-answer.quiz-answer.delete'
    ];
    
    for (const role of roles.rows) {
      for (const action of actions) {
        const exists = await client.query(
          "SELECT p.id FROM up_permissions p JOIN up_permissions_role_lnk l ON p.id = l.permission_id WHERE p.action = $1 AND l.role_id = $2", 
          [action, role.id]
        );
        
        if (exists.rows.length === 0) {
          const docId = crypto.randomBytes(16).toString('hex');
          const insertPerm = await client.query(
            "INSERT INTO up_permissions (document_id, action, created_at, updated_at) VALUES ($1, $2, NOW(), NOW()) RETURNING id;", 
            [docId, action]
          );
          const permId = insertPerm.rows[0].id;
          await client.query(
            "INSERT INTO up_permissions_role_lnk (permission_id, role_id) VALUES ($1, $2);", 
            [permId, role.id]
          );
        }
      }
    }
    console.log("Answers permissions granted");
  } catch (err) {
    console.error("ERROR:", err);
  } finally {
    await client.end();
  }
}
run();
