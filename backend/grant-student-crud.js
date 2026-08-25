const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:toNemZIHpFebRFLtQHGBtJqoutFpkbfC@altaria.proxy.rlwy.net:36817/railway',
  ssl: { rejectUnauthorized: false }
});
async function run() {
  await client.connect();
  const actions = [
    'api::enrollment.enrollment.find', 
    'api::enrollment.enrollment.findOne', 
    'api::enrollment.enrollment.create',
    'api::lesson-progress.lesson-progress.find',
    'api::lesson-progress.lesson-progress.create',
    'api::lesson-progress.lesson-progress.update',
    'api::lesson-progress.lesson-progress.sync'
  ];
  const roleRes = await client.query(SELECT id FROM up_roles WHERE type = 'authenticated');
  if (roleRes.rows.length === 0) throw new Error('Authenticated role not found');
  const roleId = roleRes.rows[0].id;
  for (const action of actions) {
    let perm = await client.query(SELECT id FROM up_permissions WHERE action = $1`, [action]);
    let permId;
    if (perm.rows.length === 0) {
      const res = await client.query(INSERT INTO up_permissions (action, created_at, updated_at) VALUES ($1, NOW(), NOW()) RETURNING id, [action]);
      permId = res.rows[0].id;
    } else {
      permId = perm.rows[0].id;
    }
    const link = await client.query(SELECT 1 FROM up_permissions_role_lnk WHERE permission_id = $1 AND role_id = $2`, [permId, roleId]);
    if (link.rows.length === 0) {
      await client.query(INSERT INTO up_permissions_role_lnk (permission_id, role_id) VALUES ($1, $2), [permId, roleId]);
      console.log('Granted', action);
    }
  }
  console.log('Student (authenticated) permissions configured!');
  await client.end();
}
run().catch(console.error);
