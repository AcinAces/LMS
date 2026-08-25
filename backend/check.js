require('dotenv').config();
﻿const { Client } = require('pg');

async function fix() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: false
  });
  
  await client.connect();
  const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_name LIKE 'up_%'");
  console.log(res.rows);
  await client.end();
}
fix().catch(console.error);
