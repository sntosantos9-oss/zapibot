const express = require("express");
const router = express.Router();
const { askGemini } = require("../services/gemini");
const axios = require("axios");

// 🔐 Tokens e credenciais
const INSTANCE_ID = process.env.INSTANCE_ID;
const TOKEN = process.env.TOKEN;
const CLIENT_TOKEN = process.env.CLIENT_TOKEN;

// 🎯 Mapeamento de setores e números de WhatsApp
const setores = {
  "rh": "5583994833333",
  "marketing": "5583994833333",
  "comercial setai": "5583994833333",
  "comercial reserve": "5583994833333"
};

// 📩 Rota de recebimento de mensagens via Webhook da Z-API
router.post("/", async (req, res) => {
  console.log("📩 Webhook recebido:");
  console.dir(req.body, { depth: null });

  const fromApi = req.body.fromApi;
  const fromMe = req.body.fromMe;

  // 🛡️ Ignora mensagens enviadas pelo próprio bot para evitar loops
  if (fromApi || fromMe) {
    console.log("🔁 Ignorado: mensagem enviada pelo próprio bot");
    return res.sendStatus(200);
  }

  try {
    const from = req.body.phone;
    const text = req.body.text?.message;

    if (!from || !text) {
      console.log("❗ Mensagem inválida:", req.body);
      return res.status(400).json({ error: "Mensagem inválida" });
    }

    // 🧠 Consulta o Gemini com o prompt interno
    const resposta = await askGemini(text); // Ex: "rh"

    const setor = resposta.toLowerCase().trim();
    const numeroSetor = setores[setor];

    if (numeroSetor) {
      // ✅ Envia botão com link para o setor correto via Z-API
      await axios.post(
        `https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN}/send-link-buttons`,
        {
          phone: from,
          message: `Clique no botão abaixo para falar com o setor **${setor.toUpperCase()}**:`,
          buttons: [
            {
              label: `Falar com ${setor}`,
              url: `https://wa.me/${numeroSetor}`
            }
          ]
        },
        {
          headers: {
            "client-token": CLIENT_TOKEN
          }
        }
      );

      console.log("✅ Botão enviado para redirecionar ao setor:", setor);
    } else {
      // ❓ Caso o setor não seja reconhecido
      await axios.post(
        `https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN}/send-text`,
        {
          phone: from,
          message: "Desculpe, não consegui identificar o setor que você deseja falar. Por favor, diga algo como 'quero falar com o RH'."
        },
        {
          headers: {
            "client-token": CLIENT_TOKEN
          }
        }
      );

      console.log("⚠️ Setor não reconhecido na resposta do Gemini:", resposta);
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Erro no webhook:", err.response?.data || err.message);
    res.status(500).json({ error: "Erro no processamento do webhook" });
  }
});

module.exports = router;
