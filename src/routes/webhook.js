const express = require("express");
const router = express.Router();
const { askGemini } = require("../services/gemini");
const axios = require("axios");

const INSTANCE_ID = process.env.INSTANCE_ID;
const TOKEN = process.env.TOKEN;
const CLIENT_TOKEN = process.env.CLIENT_TOKEN;

const fromApiOrMe = (req) => req.body.fromApi || req.body.fromMe;

router.post("/", async (req, res) => {
  if (fromApiOrMe(req)) return res.sendStatus(200);

  try {
    const from = req.body.phone;
    const text = req.body.text?.message;
    if (!from || !text) return res.status(400).json({ error: "Mensagem inválida" });

    const respostaFinal = await askGemini(text);
    if (!respostaFinal) {
      console.log("⚠️ Gemini não respondeu");
      return res.sendStatus(200);
    }

    // Envia mensagem gerada pelo Gemini
    await axios.post(
      `https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN}/send-text`,
      {
        phone: from,
        message: respostaFinal
      },
      {
        headers: { "client-token": CLIENT_TOKEN }
      }
    );

    console.log("✅ Mensagem enviada via Gemini para:", from);
    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Erro geral:", err.response?.data || err.message);
    res.status(500).json({ error: "Erro no webhook" });
  }
});

module.exports = router;
