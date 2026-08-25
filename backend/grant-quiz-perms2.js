require('dotenv').config();
﻿const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });
async function run() {
  try {
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
        // First check if it exists
        const exists = await client.query("SELECT id FROM up_permissions WHERE action = $1 AND role_id = $2", [action, role.id]);
        if (exists.rows.length === 0) {
          await client.query("INSERT INTO up_permissions (action, role_id, created_at, updated_at) VALUES ($1, $2, NOW(), NOW());", [action, role.id]);
        }
      }
    }
    console.log("Permissions granted");
  } catch (err) {
    console.error("ERROR:", err);
  } finally {
    await client.end();
  }
}
run();
