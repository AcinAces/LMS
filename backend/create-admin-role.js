require('dotenv').config();
const { Client } = require('pg');
const crypto = require('crypto');
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

function generateDocumentId() {
  return crypto.randomBytes(12).toString('hex');
}

async function run() {
  await client.connect();
  // Check if Admin exists
  const res = await client.query("SELECT id FROM up_roles WHERE name = 'Admin'");
  if (res.rows.length === 0) {
    const docId = generateDocumentId();
    await client.query(
      `INSERT INTO up_roles (document_id, name, description, type, created_at, updated_at, published_at)
       VALUES ($1, 'Admin', 'Platform Administrator', 'admin', NOW(), NOW(), NOW())`,
      [docId]
    );
    console.log('Admin role created');
  } else {
    console.log('Admin role already exists');
  }
  await client.end();
}
run().catch(e => { console.error(e); process.exit(1); });
