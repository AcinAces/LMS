require('dotenv').config();
const { Client } = require('pg');
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();

  // 1. Get all permissions that the Student (authenticated) role has
  const studentPerms = await client.query(`
    SELECT p.id, p.action
    FROM up_permissions p
    JOIN up_permissions_role_lnk prl ON p.id = prl.permission_id
    JOIN up_roles r ON r.id = prl.role_id
    WHERE r.type = 'authenticated'
  `);
  console.log('Student permissions:', studentPerms.rows.length);
  studentPerms.rows.forEach(p => console.log(' -', p.action));

  // 2. Get Admin, Content Manager, Instructor role IDs
  const roles = await client.query("SELECT id, name, type FROM up_roles WHERE type IN ('admin', 'content_manager', 'instructor')");
  console.log('\nRoles to fix:', roles.rows);

  // 3. For each role, ensure they have all the same permissions
  for (const role of roles.rows) {
    for (const perm of studentPerms.rows) {
      // Check if link already exists
      const exists = await client.query(
        'SELECT 1 FROM up_permissions_role_lnk WHERE permission_id = $1 AND role_id = $2',
        [perm.id, role.id]
      );
      if (exists.rows.length === 0) {
        await client.query(
          'INSERT INTO up_permissions_role_lnk (permission_id, role_id) VALUES ($1, $2)',
          [perm.id, role.id]
        );
        console.log(`  Added "${perm.action}" to ${role.name}`);
      }
    }
  }

  console.log('\nDone! All roles now have the same permissions as Student.');
  await client.end();
}
run().catch(e => { console.error(e); process.exit(1); });
