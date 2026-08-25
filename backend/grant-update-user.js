require('dotenv').config();
﻿const { Client } = require('pg');

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  await client.connect();
  
  // Find all roles
  const rolesRes = await client.query('SELECT id, type FROM up_roles');
  
  for (const role of rolesRes.rows) {
    // Check if permission exists
    let permRes = await client.query("SELECT id FROM up_permissions WHERE action = 'plugin::users-permissions.user.update'");
    let permId;
    if (permRes.rows.length === 0) {
      const insertRes = await client.query("INSERT INTO up_permissions (action) VALUES ('plugin::users-permissions.user.update') RETURNING id");
      permId = insertRes.rows[0].id;
    } else {
      permId = permRes.rows[0].id;
    }
    
    // Link permission to role
    const linkRes = await client.query("SELECT id FROM up_permissions_role_lnk WHERE permission_id =  AND role_id = ", [permId, role.id]);
    if (linkRes.rows.length === 0) {
      await client.query("INSERT INTO up_permissions_role_lnk (permission_id, role_id) VALUES (, )", [permId, role.id]);
      console.log('Granted update user to role', role.type);
    }
  }
  
  await client.end();
}

run().catch(console.error);
