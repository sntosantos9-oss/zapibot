const express = require("express");
const router = express.Router();
const { askGemini } = require("../services/gemini");
const axios = require("axios");

const INSTANCE_ID = process.env.INSTANCE_ID;
const TOKEN = process.env.TOKEN;
const CLIENT_TOKEN = process.env.CLIENT_TOKEN;

const setores = {
  "rh": "5583994833333",
  "marketing": "5583994833333",
  "comercial setai": "5583994833333",
  "comercial reserve": "5583994833333"
};

// Detecta setor mencionado no texto
const identificarSetor = (resposta) => {
  const normalizado = resposta.toLowerCase();
  return Object.keys(setores).find((setor) => normalizado.includes(setor)) || null;
};

router.post("/", async (req, res) => {
  const fromApi = req.body.fromApi;
  const fromMe = req.body.fromMe;
  if (fromApi || fromMe) return res.sendStatus(200);

  try {
    const from = req.body.phone;
    const text = req.body.text?.message;
    if (!from || !text) return res.status(400).json({ error: "Mensagem inválida" });

    const resposta = await askGemini(text);
    if (!resposta) return res.sendStatus(200);

    const setor = identificarSetor(resposta);
    const numero = setores[setor];

    if (setor && numero) {
      // Envia mensagem + botão
      await axios.post(
        `https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN}/send-button-actions`,
        {
          phone: from,
          message: resposta,
          buttonActions: [
            {
              id: "1",
              type: "URL",
              url: `https://wa.me/${numero}`,
              label: `Falar com ${setor}`
            }
          ]
        },
        {
          headers: {
            "client-token": CLIENT_TOKEN,
            "Content-Type": "application/json"
          }
        }
      );

      console.log(`✅ Resposta com botão enviada: ${setor}`);
    } else {
      // Só envia texto, sem botão
      await axios.post(
        `https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN}/send-text`,
        {
          phone: from,
          message: resposta
        },
        {
          headers: { "client-token": CLIENT_TOKEN }
        }
      );

      console.log(`✅ Resposta cordial enviada (sem setor):`, resposta);
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Erro no webhook:", err.response?.data || err.message);
    res.status(500).json({ error: "Erro no webhook" });
  }
});

module.exports = router;
