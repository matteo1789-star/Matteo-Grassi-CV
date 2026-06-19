require('dotenv').config();
const express = require('express');
const https = require('https');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/test', (req, res) => {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.json({ ok: false, error: 'NO KEY' });

  const body = JSON.stringify({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 30,
    system: 'You are a helpful assistant.',
    messages: [{ role: 'user', content: 'Say the word OK' }]
  });

  const req2 = https.request({
    hostname: 'api.anthropic.com',
    path: '/v1/messages',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
      'x-api-key': key,
      'anthropic-version': '2023-06-01'
    }
  }, (r) => {
    let data = '';
    r.on('data', c => data += c);
    r.on('end', () => {
      try {
        const p = JSON.parse(data);
        res.json({ ok: r.statusCode === 200, status: r.statusCode, reply: p.content?.[0]?.text, error: p.error?.message });
      } catch(e) {
        res.json({ ok: false, error: 'parse error', raw: data.slice(0, 200) });
      }
    });
  });

  req2.on('error', e => res.json({ ok: false, error: e.message }));
  req2.write(body);
  req2.end();
});

app.post('/api/chat', (req, res) => {
  res.json({ reply: 'Backend connesso! Aggiungere il SYSTEM_PROMPT.' });
});

app.listen(process.env.PORT || 3000, () => console.log('Server OK'));
