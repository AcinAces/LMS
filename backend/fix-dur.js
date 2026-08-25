const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:toNemZIHpFebRFLtQHGBtJqoutFpkbfC@altaria.proxy.rlwy.net:36817/railway',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  await client.query("UPDATE lessons SET duration_in_seconds = 473 WHERE document_id = 'xx5ccst5fl5roixgmnoabbsw'");
  console.log('Fixed DB duration!');
  process.exit(0);
}
run();
