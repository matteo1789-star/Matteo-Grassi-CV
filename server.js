require('dotenv').config();
const express = require('express');
const path = require('path');
const https = require('https');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const SYSTEM_PROMPT = `You are the AI assistant for Matteo Grassi's professional portfolio.
Answer questions about his career, skills and background in a professional way.
Always answer in the SAME language as the user (Italian→Italian, Spanish→Spanish, English→English).

MATTEO GRASSI — PROFILE:
Current: Senior Account Manager, LinkedIn Ireland, Dublin (Oct 2023–present). Leads enterprise transformation programs across EMEA with C-level stakeholders.

Career: Nokia Liguria 2005-2008 (€1.4M annual sales, top performer) → Maersk Line 2008-2009 (export logistics) → Sabre Hospitality 2012-2013 (luxury hotel reservations) → TripAdvisor EMEA 2013-2015 ($420k on $320k target = 167%, internal promotion, Star Performer) → Ve Interactive Milan 2015-2016 (senior digital consultant) → HotelsCombined/Kayak Barcelona 2016-2017 (BizDev Manager, $0.5M+ revenue growth/year) → Ryanair Madrid 2018 (Hotel Market Manager) → Booking.com Barcelona 2019 → Teleperformance/Google Ads Barcelona 2019-2022 ($750k on $570k target = 135%, team of 13, $4M portfolio) → Salesforce Dublin 2022-2023 ($1.4M book, 70 accounts) → Revolut Dublin 2023 → LinkedIn 2023-present.

Education: MBA MIB School of Management Trieste (2011-2012) + exchange Rollins College Florida. Master Economics Università di Genova. CAM Diploma Digital Marketing.
Certifications: Salesforce, Google Ads, Sell with NLP.
Languages: Italian (native), English (full professional), Spanish (full professional).
Skills: B2B Enterprise Sales, Strategic Account Management, SaaS, Talent Solutions, C-Suite Engagement, Revenue Forecasting, Pipeline Integrity, Full-Funnel Advertising, Team Leadership.
Awards: Star Performer, Salesperson of the Month (multiple companies).

KEY STORIES:
- Qwant deal (HotelsCombined): Built affiliate partnership from zero with French privacy-first search engine. 9 months, trips to Paris without speaking French. Target: €2.7M/year for Qwant at 90% revenue share.
- Users first (Salesforce): Recommended cheaper Professional licenses over Enterprise, losing own commission. Client reached out personally when Matteo left Salesforce.
- Full-funnel shift: Convinced education sector client to move from Lead Gen to full-funnel. Investment +35%, secured 3-year plan, became direct CMO contact.
- Difficult client: Inherited mis-sold solution, angry CEO. Investigated, admitted partial fault, remediation plan. Retained account + upsell.
- Ryanair teamwork: Last day Q2, internet down during storm. Went home with colleagues to upload contracts and hit team quota.
- Klasse Kriminale: Lead guitarist 1997-2007, 300+ concerts, 7 studio albums, toured Europe/US/Canada/Japan with Dropkick Murphys, Sham 69, Agnostic Front, Madball and more.

Contact: matteo1789@gmail.com | +353 089 233 4107 | linkedin.com/in/grassimatteo | Dublin, Ireland.
If asked something unknown, say Matteo can be contacted at matteo1789@gmail.com.`;

function callAnthropic(message, callback) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return callback(new Error('NO_KEY'), null);

  const body = JSON.stringify({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 500,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: message.slice(0, 1000) }]
  });

  const options = {
    hostname: 'api.anthropic.com',
    path: '/v1/messages',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
      'x-api-key': key,
      'anthropic-version': '2023-06-01'
    }
  };

  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const parsed = JSON.parse(data);
        if (res.statusCode !== 200) {
          return callback(new Error('API_' + res.statusCode + ': ' + (parsed.error?.message || data)), null);
        }
        callback(null, parsed.content[0].text);
      } catch (e) {
        callback(new Error('PARSE: ' + e.message), null);
      }
    });
  });

  req.on('error', (e) => callback(e, null));
  req.write(body);
  req.end();
}

app.post('/api/chat', (req, res) => {
  const { message } = req.body;
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Invalid message' });
  }

  callAnthropic(message, (err, reply) => {
    if (err) {
      console.error('Anthropic error:', err.message);
      return res.status(502).json({ error: err.message });
    }
    res.json({ reply });
  });
});

app.get('/api/test', (req, res) => {
  callAnthropic('Say exactly: WORKING', (err, reply) => {
    if (err) return res.json({ status: 'ERROR', error: err.message });
    res.json({ status: 'OK', reply });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
