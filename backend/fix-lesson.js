require('dotenv').config();
const { Client } = require('pg');
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  await client.query("UPDATE lessons SET youtube_video_id = 'sH4GWKwkeJo', duration_in_seconds = 749 WHERE id = 1");
  console.log('Fixed!');
  process.exit(0);
}
run();
