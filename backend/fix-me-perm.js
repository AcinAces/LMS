const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:toNemZIHpFebRFLtQHGBtJqoutFpkbfC@altaria.proxy.rlwy.net:36817/railway',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();

  // Check if the users-permissions.user.me permission exists
  let perm = await client.query("SELECT id FROM up_permissions WHERE action = 'plugin::users-permissions.user.me'");
  let permId;
  
  if (perm.rows.length === 0) {
    // Create it
    const res = await client.query(
      "INSERT INTO up_permissions (action, created_at, updated_at) VALUES ('plugin::users-permissions.user.me', NOW(), NOW()) RETURNING id"
    );
    permId = res.rows[0].id;
    console.log('Created users.me permission with id:', permId);
  } else {
    permId = perm.rows[0].id;
    console.log('users.me permission already exists with id:', permId);
  }

  // Link to ALL authenticated roles (Student, Admin, Content Manager, Instructor)
  const roles = await client.query("SELECT id, name FROM up_roles WHERE type != 'public'");
  for (const role of roles.rows) {
    const exists = await client.query(
      'SELECT 1 FROM up_permissions_role_lnk WHERE permission_id = $1 AND role_id = $2',
      [permId, role.id]
    );
    if (exists.rows.length === 0) {
      await client.query(
        'INSERT INTO up_permissions_role_lnk (permission_id, role_id) VALUES ($1, $2)',
        [permId, role.id]
      );
      console.log('  Linked users.me to', role.name);
    } else {
      console.log('  Already linked to', role.name);
    }
  }

  // Also add auth.callback permission for all roles
  let authPerm = await client.query("SELECT id FROM up_permissions WHERE action = 'plugin::users-permissions.auth.callback'");
  if (authPerm.rows.length > 0) {
    console.log('\nauth.callback permission exists');
  }

  console.log('\nDone!');
  await client.end();
}
run().catch(e => { console.error(e); process.exit(1); });
