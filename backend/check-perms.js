const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:toNemZIHpFebRFLtQHGBtJqoutFpkbfC@altaria.proxy.rlwy.net:36817/railway',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  const res = await client.query(`
    SELECT p.action, r.name as role_name
    FROM up_permissions p
    JOIN up_permissions_role_lnk prl ON p.id = prl.permission_id
    JOIN up_roles r ON r.id = prl.role_id
    WHERE p.action LIKE 'plugin::users-permissions.role%'
  `);
  console.log(res.rows);
  await client.end();
}
run().catch(console.error);
