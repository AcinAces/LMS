const { Client } = require('pg');
const client = new Client({ 
  connectionString: 'postgresql://postgres:toNemZIHpFebRFLtQHGBtJqoutFpkbfC@altaria.proxy.rlwy.net:36817/railway',
  ssl: { rejectUnauthorized: false }
});
async function run() {
  await client.connect();
  const res = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'up_permissions';");
  console.log(res.rows);
  await client.end();
}
run();
