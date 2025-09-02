const express = require("express");
const router = express.Router();
const { askGemini } = require("../services/gemini");
const axios = require("axios");

const INSTANCE_ID = process.env.INSTANCE_ID;
const TOKEN = process.env.TOKEN;
const CLIENT_TOKEN = process.env.CLIENT_TOKEN;
const fromApi = req.body.fromApi;
const fromMe = req.body.fromMe;

if (fromApi || fromMe) {
  console.log("🔁 Ignorado: mensagem enviada pelo próprio bot (loop)");
  return res.sendStatus(200);
}



router.post("/", async (req, res) => {
  console.log("📩 Webhook recebido:");
  console.dir(req.body, { depth: null });

  try {
    const from = req.body.phone;
    const text = req.body.text?.message;
    

    if (!from || !text) {
      console.log("❗ Mensagem não processada (sem 'phone' ou 'text.message'):", req.body);
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
          "client-token": CLIENT_TOKEN,
        },
      }
    );

    console.log("✅ Resposta enviada para", from);
    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Erro no webhook:", err.response?.data || err.message);
    res.status(500).json({ error: "Erro no processamento do webhook" });
  }
});

module.exports = router;
