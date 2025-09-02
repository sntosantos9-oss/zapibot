const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const INSTANCE_ID = process.env.INSTANCE_ID;
const TOKEN = process.env.TOKEN;
const CLIENT_TOKEN = process.env.CLIENT_TOKEN;

if (!INSTANCE_ID || !TOKEN) {
  console.error('Faltam INSTANCE_ID/TOKEN nas env vars');
}
if (!CLIENT_TOKEN) {
  console.error('Falta CLIENT_TOKEN nas env vars (Z-API Security Token)');
}

app.get('/', (_req, res) => res.status(200).send('OK / (Z-API + Client-Token)'));
app.get('/debug', (_req, res) => {
  res.json({
    port: process.env.PORT,
    instance_tail: (INSTANCE_ID || '').slice(-4),
    client_token_tail: (CLIENT_TOKEN || '').slice(-4),
    node: process.version
  });
});

app.post('/send', async (req, res) => {
  try {
    const { number, message } = req.body || {};
    if (!number || !message) return res.status(400).json({ error: 'number e message são obrigatórios' });

    const url = `https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN}/send-text`;
    const { data } = await axios.post(
      url,
      { phone: number, message },
      { headers: { 'Client-Token': CLIENT_TOKEN }, timeout: 15000 }
    );
    return res.json(data);
  } catch (err) {
    console.error('ZAPI ERR:', err?.response?.data || err.message);
    return res.status(502).json({ error: 'Falha Z-API', details: err?.response?.data || err.message });
  }
});

process.on('unhandledRejection', r => console.error('unhandledRejection:', r));
process.on('uncaughtException', e => console.error('uncaughtException:', e));

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`UP on ${PORT}`));
