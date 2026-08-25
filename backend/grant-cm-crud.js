require('dotenv').config();
const { Client } = require('pg');
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();

  const actions = [
    'api::course.course.find', 'api::course.course.findOne', 'api::course.course.create', 'api::course.course.update', 'api::course.course.delete',
    'api::lesson.lesson.find', 'api::lesson.lesson.findOne', 'api::lesson.lesson.create', 'api::lesson.lesson.update', 'api::lesson.lesson.delete',
    'api::quiz.quiz.find', 'api::quiz.quiz.findOne', 'api::quiz.quiz.create', 'api::quiz.quiz.update', 'api::quiz.quiz.delete',
    'plugin::users-permissions.user.find', 'plugin::users-permissions.user.findOne', 
    // NO create, update, destroy for users
    'api::blog.blog.find', 'api::blog.blog.findOne', 'api::blog.blog.create', 'api::blog.blog.update', 'api::blog.blog.delete',
    'api::enrollment.enrollment.find', 'api::enrollment.enrollment.findOne', 'api::enrollment.enrollment.create', 'api::enrollment.enrollment.update', 'api::enrollment.enrollment.delete',
    'api::lesson-progress.lesson-progress.find', 'api::lesson-progress.lesson-progress.findOne', 'api::lesson-progress.lesson-progress.create', 'api::lesson-progress.lesson-progress.update', 'api::lesson-progress.lesson-progress.delete',
    'plugin::users-permissions.role.find'
  ];

  const roleRes = await client.query("SELECT id FROM up_roles WHERE type = 'content_manager'");
  if (roleRes.rows.length === 0) throw new Error('Content Manager role not found');
  const cmId = roleRes.rows[0].id;

  for (const action of actions) {
    let perm = await client.query("SELECT id FROM up_permissions WHERE action = $1", [action]);
    let permId;
    if (perm.rows.length === 0) {
      const res = await client.query("INSERT INTO up_permissions (action, created_at, updated_at) VALUES ($1, NOW(), NOW()) RETURNING id", [action]);
      permId = res.rows[0].id;
    } else {
      permId = perm.rows[0].id;
    }

    const link = await client.query("SELECT 1 FROM up_permissions_role_lnk WHERE permission_id = $1 AND role_id = $2", [permId, cmId]);
    if (link.rows.length === 0) {
      await client.query("INSERT INTO up_permissions_role_lnk (permission_id, role_id) VALUES ($1, $2)", [permId, cmId]);
      console.log('Granted', action);
    }
  }

  // Ensure they have 'users-permissions.user.me' as well
  let mePerm = await client.query("SELECT id FROM up_permissions WHERE action = 'plugin::users-permissions.user.me'");
  if(mePerm.rows.length > 0) {
     const link = await client.query("SELECT 1 FROM up_permissions_role_lnk WHERE permission_id = $1 AND role_id = $2", [mePerm.rows[0].id, cmId]);
     if (link.rows.length === 0) await client.query("INSERT INTO up_permissions_role_lnk (permission_id, role_id) VALUES ($1, $2)", [mePerm.rows[0].id, cmId]);
  }

  // REMOVE create/update/delete for users if accidentally granted before
  const removeActions = ['plugin::users-permissions.user.create', 'plugin::users-permissions.user.update', 'plugin::users-permissions.user.destroy'];
  for(const action of removeActions) {
    let perm = await client.query("SELECT id FROM up_permissions WHERE action = $1", [action]);
    if (perm.rows.length > 0) {
        await client.query("DELETE FROM up_permissions_role_lnk WHERE permission_id = $1 AND role_id = $2", [perm.rows[0].id, cmId]);
    }
  }

  console.log('Content Manager permissions configured!');
  await client.end();
}
run().catch(console.error);
