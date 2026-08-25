const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:toNemZIHpFebRFLtQHGBtJqoutFpkbfC@altaria.proxy.rlwy.net:36817/railway',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  const res = await client.query(`
    SELECT u.username, u.email, r.name as role_name, r.type as role_type
    FROM up_users u
    LEFT JOIN up_users_role_lnk url ON u.id = url.user_id
    LEFT JOIN up_roles r ON r.id = url.role_id
  `);
  console.log(res.rows);
  await client.end();
}
run().catch(console.error);
