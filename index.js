const express = require('express');
const app = express();
app.use(express.json());

app.get('/', (_req, res) => res.status(200).send('OK /'));
app.get('/health', (_req, res) => res.status(200).json({ ok: true }));

process.on('unhandledRejection', r => console.error('unhandledRejection:', r));
process.on('uncaughtException', e => console.error('uncaughtException:', e));

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`UP on ${PORT}`);
});
