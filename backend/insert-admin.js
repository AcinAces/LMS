require('dotenv').config();
const crypto = require('crypto');
const { Client } = require('pg');
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  
  // Get admin role
  const roleRes = await client.query("SELECT id FROM up_roles WHERE type = 'admin'");
  const roleId = roleRes.rows[0].id;

  // Insert a test user
  const docId = crypto.randomBytes(12).toString('hex');
  await client.query(`
    INSERT INTO up_users (document_id, username, email, provider, password, confirmed, blocked, created_at, updated_at, published_at, role_id)
    VALUES ($1, 'admintest', 'admintest@test.com', 'local', '$2a$10$XU.0.sR/R46z/j01uY.4UeF1K5U/G7b3K5iYv8K.ZlO4Z/X2R2QnS', true, false, NOW(), NOW(), NOW(), $2)
  `, [docId, roleId]); // Password is 'password' hashed
  
  console.log('Inserted admintest');
  await client.end();
}
run().catch(console.error);
