require('dotenv').config();
const { Client } = require('pg');
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  
  // Find all roles
  const roles = await client.query('SELECT id, name FROM up_roles');
  
  for (const role of roles.rows) {
    // Check if permission exists
    let perm = await client.query("SELECT id FROM up_permissions WHERE action = 'plugin::users-permissions.role.find'");
    let permId;
    
    if (perm.rows.length === 0) {
      const res = await client.query("INSERT INTO up_permissions (action) VALUES ('plugin::users-permissions.role.find') RETURNING id");
      permId = res.rows[0].id;
    } else {
      permId = perm.rows[0].id;
    }
    
    // Link permission to role
    const link = await client.query("SELECT id FROM up_permissions_role_lnk WHERE permission_id = $1 AND role_id = $2", [permId, role.id]);
    if (link.rows.length === 0) {
      await client.query("INSERT INTO up_permissions_role_lnk (permission_id, role_id) VALUES ($1, $2)", [permId, role.id]);
    }
  }
  
  console.log('Permissions added!');
  await client.end();
}
run().catch(console.error);
