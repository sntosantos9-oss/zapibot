const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const INSTANCE_ID = process.env.INSTANCE_ID || "3E69E1869488A159D171A26423D316DC";
const TOKEN = process.env.TOKEN || "CF8B44F238B2241D77061B9C";

app.get('/', (_req, res) => res.status(200).send('OK / (Z-API enabled)'));
app.get('/health', (_req, res) => res.status(200).json({ ok: true }));

app.get('/debug', (_req, res) => {
  // não vaza segredos, só últimos 4 chars
  res.json({
    port: process.env.PORT,
    instanceId_tail: INSTANCE_ID.slice(-4),
    token_tail: TOKEN.slice(-4),
    node: process.version
  });
});

app.post('/send', async (req, res) => {
  try {
    const { number, message } = req.body || {};
    if (!number || !message) {
      return res.status(400).json({ error: 'number e message são obrigatórios' });
    }

    const url = `https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN}/send-text`;
    const payload = { phone: number, message };
    console.log('POST /send ->', { number, msg_len: String(message).length, url_tail: url.slice(-12) });

    const { data } = await axios.post(url, payload, { timeout: 15000 });
    console.log('ZAPI OK');
    return res.json(data);
  } catch (err) {
    const details = err?.response?.data || err.message;
    console.error('ZAPI ERR:', details);
    return res.status(502).json({ error: 'Falha Z-API', details });
  }
});

process.on('unhandledRejection', r => console.error('unhandledRejection:', r));
process.on('uncaughtException', e => console.error('uncaughtException:', e));

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`UP on ${PORT} | node=${process.version}`);
  if (!process.env.INSTANCE_ID || !process.env.TOKEN) {
    console.warn('ENV faltando no Render; usando fallback do código (não recomendado).');
  }
});
