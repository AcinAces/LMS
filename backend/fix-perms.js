require('dotenv').config();
﻿const { Client } = require('pg');

async function fix() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: false
  });
  
  await client.connect();
  
  // Find roles
  const res = await client.query("SELECT id, name, type FROM up_roles WHERE type IN ('public', 'authenticated') OR name = 'Student'");
  const roles = res.rows;
  
  for (const role of roles) {
    for (const action of ['api::blog.blog.find', 'api::blog.blog.findOne']) {
      // Check if permission already exists
      const checkRes = await client.query("SELECT id FROM up_permissions WHERE action = $1 AND role_id = $2", [action, role.id]);
      if (checkRes.rows.length === 0) {
        await client.query("INSERT INTO up_permissions (action, role_id, created_at, updated_at) VALUES ($1, $2, NOW(), NOW())", [action, role.id]);
        console.log(`Granted ${action} to ${role.name}`);
      }
    }
  }
  
  await client.end();
}
fix().catch(console.error);
