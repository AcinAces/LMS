const https = require('https');

https.get('https://www.youtube.com/watch?v=sH4GWKwkeJo', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const match = data.match(/itemprop="duration" content="(.*?)"/);
    if (match) {
      console.log('ISO Duration:', match[1]);
      const parseMatch = match[1].match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
      const hours = parseInt(parseMatch[1] || '0', 10);
      const minutes = parseInt(parseMatch[2] || '0', 10);
      const seconds = parseInt(parseMatch[3] || '0', 10);
      console.log('Seconds:', (hours * 3600) + (minutes * 60) + seconds);
    } else {
      console.log('Not found');
    }
  });
}).on('error', err => console.error(err));
