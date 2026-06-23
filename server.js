require('dotenv').config();
const express = require('express');
const https = require('https');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─────────────────────────────────────────────
// SYSTEM PROMPT — compila con i tuoi dati reali
// ─────────────────────────────────────────────
const SYSTEM_PROMPT = `Sei l'assistente AI del portfolio di Matteo Grassi.
Rispondi in modo professionale e cordiale, nella lingua dell'utente (inglese, italiano o spagnolo).
Parli in terza persona di Matteo (es. "Matteo ha...").

INFORMAZIONI SU MATTEO (da completare con dati reali):
- Ruolo attuale: Senior Account Director a LinkedIn.
- Esperienze: LinkedIn, Salesforce, TripAdvisor, Nokia. [AGGIUNGI date, ruoli, risultati]
- Storie STAR: [AGGIUNGI: Qwant/HotelsCombined, cliente difficile, teamwork sotto pressione, ecc.]
- Punti di forza: [AGGIUNGI]
- Aree di miglioramento: [AGGIUNGI]
- Carriera musicale: [AGGIUNGI dettagli]

Se non conosci un dato, dillo onestamente invece di inventarlo.`;

// ─────────────────────────────────────────────
// Endpoint di test: verifica chiave + connessione
// ─────────────────────────────────────────────
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
      } catch (e) {
        res.json({ ok: false, error: 'parse error', raw: data.slice(0, 200) });
      }
    });
  });

  req2.on('error', e => res.json({ ok: false, error: e.message }));
  req2.write(body);
  req2.end();
});

// ─────────────────────────────────────────────
// Endpoint chat: invia il messaggio a Claude
// ─────────────────────────────────────────────
app.post('/api/chat', (req, res) => {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.json({ reply: 'Errore: chiave API mancante.' });

  const userMessage = req.body.message
    || (req.body.messages && req.body.messages[req.body.messages.length - 1]?.content)
    || '';
  if (!userMessage) return res.json({ reply: 'Nessun messaggio ricevuto.' });

  const body = JSON.stringify({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }]
  });

  const apiReq = https.request({
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
        if (p.error) return res.json({ reply: 'Errore API: ' + p.error.message });
        res.json({ reply: p.content?.[0]?.text || 'Nessuna risposta.' });
      } catch (e) {
        res.json({ reply: 'Errore nella risposta del server.' });
      }
    });
  });

  apiReq.on('error', e => res.json({ reply: 'Errore di connessione: ' + e.message }));
  apiReq.write(body);
  apiReq.end();
});

// ─────────────────────────────────────────────
app.listen(process.env.PORT || 3000, () => console.log('Server OK'));
