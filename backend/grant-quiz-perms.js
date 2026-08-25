const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:pBpxKzHHTOchgJqLthCqSjNfXYHMyBvJ@junction.proxy.rlwy.net:18174/railway' });
async function run() {
  await client.connect();
  const roles = await client.query("SELECT id, type FROM up_roles WHERE type IN ('authenticated', 'instructor', 'content_manager', 'public');");
  const actions = [
    'api::quiz.quiz.find',
    'api::quiz.quiz.findOne',
    'api::quiz.quiz.create',
    'api::quiz.quiz.update',
    'api::quiz.quiz.delete',
    'api::quiz-attempt.quiz-attempt.find',
    'api::quiz-attempt.quiz-attempt.findOne',
    'api::quiz-attempt.quiz-attempt.create',
    'api::quiz-attempt.quiz-attempt.update',
    'api::quiz-attempt.quiz-attempt.delete'
  ];
  
  for (const role of roles.rows) {
    for (const action of actions) {
      if (role.type === 'public' && (action.includes('create') || action.includes('update') || action.includes('delete'))) {
          continue;
      }
      await client.query("INSERT INTO up_permissions (action, role_id, created_at, updated_at) VALUES ($1, $2, NOW(), NOW()) ON CONFLICT DO NOTHING;", [action, role.id]);
    }
  }
  console.log("Permissions granted");
  await client.end();
}
run();
