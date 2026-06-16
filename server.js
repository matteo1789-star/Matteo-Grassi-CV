require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const SYSTEM_PROMPT = `Sei l'assistente AI del portfolio professionale di Matteo Grassi.
Matteo è un professionista delle vendite con oltre 15 anni di esperienza nel digital marketing, SaaS e B2B technology.
Attualmente è Senior Account Director presso LinkedIn a Dublino (da ottobre 2023), dove guida programmi di trasformazione multi-anno con stakeholder C-level.
In precedenza ha lavorato come Account Executive in Revolut (2023), Senior Account Executive in Salesforce (2022-2023), Sales Manager e Account Executive Google Ads in Teleperformance (2019-2022), e ha ricoperto ruoli commerciali in TripAdvisor, Ve Interactive, HotelsCombined, Ryanair e Nokia.
Ha un MBA dal MIB School of Management e un Diploma in Digital Marketing dal Chartered Institute of Marketing.
Parla italiano (madrelingua), inglese (C1) e spagnolo (B2). È basato a Dublino, Irlanda.
Le sue certificazioni includono Salesforce, Sell with NLP e Google Ads.
Rispondi sempre nella stessa lingua dell'utente. Sii professionale, conciso e cordiale.
Non inventare informazioni: se non conosci qualcosa, dì che Matteo può essere contattato direttamente.`;

app.post('/api/chat', async (req, res) => {
  const { message, lang } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Invalid message' });
  }
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OpenAI API key not configured. Add OPENAI_API_KEY to your .env file.' });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 400,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: message.slice(0, 500) }
        ]
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(502).json({ error: err.error?.message || 'OpenAI error' });
    }

    const data = await response.json();
    res.json({ reply: data.choices[0].message.content });
  } catch (err) {
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Portfolio server running at http://localhost:${PORT}`);
});
