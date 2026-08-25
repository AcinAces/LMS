const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:toNemZIHpFebRFLtQHGBtJqoutFpkbfC@altaria.proxy.rlwy.net:36817/railway',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  const res = await client.query('SELECT id, document_id, title, youtube_video_id, duration_in_seconds FROM lessons');
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}
run().catch(e => { console.error(e); process.exit(1); });
