require('dotenv').config();
const { Client } = require('pg');
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  const res = await client.query('SELECT * FROM up_roles');
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}
run().catch(e => { console.error(e); process.exit(1); });
