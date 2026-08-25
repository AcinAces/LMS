const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:toNemZIHpFebRFLtQHGBtJqoutFpkbfC@altaria.proxy.rlwy.net:36817/railway',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  await client.query("UPDATE lessons SET youtube_video_id = 'sH4GWKwkeJo', duration_in_seconds = 749 WHERE id = 1");
  console.log('Fixed!');
  process.exit(0);
}
run();
