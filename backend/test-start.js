const http = require('http');

const req = http.request({
  hostname: 'localhost',
  port: 1337,
  path: '/api/quiz-attempts/start',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(res.statusCode, data));
});
req.write(JSON.stringify({ data: { quizId: "123" } }));
req.end();
