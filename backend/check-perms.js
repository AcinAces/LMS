const { Client } = require('pg');
require('dotenv').config();

async function run() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not defined in .env");
    process.exit(1);
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  await client.connect();
  
  const res = await client.query("SELECT p.action FROM up_permissions p JOIN up_permissions_role_lnk pr ON p.id = pr.permission_id JOIN up_roles r ON r.id = pr.role_id WHERE r.type = 'authenticated' AND p.action LIKE '%user%'");
  
  console.log('Permissions:', res.rows.map(r => r.action));
  await client.end();
}

run().catch(console.error);
