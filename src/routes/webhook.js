const express = require("express");
const router = express.Router();
const { askGemini } = require("../services/gemini");
const axios = require("axios");

const INSTANCE_ID = process.env.INSTANCE_ID;
const TOKEN = process.env.TOKEN;

router.post("/", async (req, res) => {
  console.log("📩 Webhook recebido:");
  console.dir(req.body, { depth: null });

  try {
    const message = req.body.message;
    const from = message?.from;
    const text = message?.text?.body;

    if (!from || !text) {
      console.log("❗ Mensagem não processada (sem 'from' ou 'text'):", req.body);
      return res.status(400).json({ error: "Mensagem inválida" });
    }

    const resposta = await askGemini(text);

    await axios.post(
      `https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN}/send-text`,
      {
        phone: from,
        message: resposta,
      },
      {
        headers: {
          "client-token": process.env.CLIENT_TOKEN,
        }
      }
    );

    console.log("✅ Mensagem enviada para", from);
    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Erro no webhook:", err.response?.data || err.message);
    res.status(500).json({ error: "Erro no processamento do webhook" });
  }
});


module.exports = router;

