const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:pBpxKzHHTOchgJqLthCqSjNfXYHMyBvJ@junction.proxy.rlwy.net:18174/railway' });
async function run() {
  await client.connect();
  const res = await client.query("SELECT r.type, p.action FROM up_permissions p JOIN up_roles r ON p.role_id = r.id WHERE p.action LIKE 'api::quiz.quiz.%';");
  console.log(res.rows);
  await client.end();
}
run();
