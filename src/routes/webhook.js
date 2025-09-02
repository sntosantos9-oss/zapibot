const express = require("express");
const router = express.Router();
const { askGemini } = require("../services/gemini");
const axios = require("axios");

const INSTANCE_ID = process.env.INSTANCE_ID;
const TOKEN = process.env.TOKEN;

router.post("/", async (req, res) => {
    console.log("📩 Webhook recebido:", req.body);
  try {
    
    const message = req.body.message;
    const from = message?.from;
    const text = message?.text?.body;

    if (!from || !text) {
      return res.status(400).json({ error: "Mensagem inválida" });
    }

    // Chama o Gemini com a mensagem recebida
    const resposta = await askGemini(text);

    // Envia a resposta de volta pelo WhatsApp via Z-API
    const url = `https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN}/send-text`;

    await axios.post(
  `https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN}/send-text`,
  {
    phone: from,
    message: resposta,
  },
  {
    headers: {
      "client-token": process.env.CLIENT_TOKEN,
    },
    
  }
  
);


    res.sendStatus(200);
  } catch (err) {
    console.error("Erro no webhook:", err.response?.data || err.message);
    res.status(500).json({ error: "Erro no processamento do webhook" });
  }
});

module.exports = router;

