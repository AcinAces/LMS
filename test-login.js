async function run() {
  const res = await fetch('http://localhost:1337/api/auth/local', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'acin@test.com', password: 'password' }) // Assuming user has a password. If not, I can just query the DB for the token, but it's hard.
  });
  const data = await res.json();
  console.log('Login:', data);
}
run().catch(console.error);
