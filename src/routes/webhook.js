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

// 🎨 Modelos de mensagem formatada
const frasesDeEncaminhamento = (setor, numero) => {
  const nomeMaiusculo = setor.toUpperCase();
  const nomeCapitalizado = setor[0].toUpperCase() + setor.slice(1);
  return [
    `✅ Tudo certo! Clique no botão abaixo para falar com nosso setor **${nomeMaiusculo}**.`,
    `👉 Perfeito! Já vou te redirecionar para o setor de *${nomeCapitalizado}*.`,
    `🧭 Localizei o setor ideal para você: *${nomeCapitalizado}*. Toque no botão e siga com o atendimento.`,
    `🤖 Encaminhando você para o setor correto: *${nomeMaiusculo}*.`,
    `🎯 Achei que o setor *${nomeCapitalizado}* é o mais indicado. Vamos lá?`
  ].map(texto => ({
    message: texto,
    buttonLabel: `Falar com ${setor}`,
    url: `https://wa.me/${numero}`
  }));
};

router.post("/", async (req, res) => {
  console.log("📩 Webhook recebido:");
  console.dir(req.body, { depth: null });

  const fromApi = req.body.fromApi;
  const fromMe = req.body.fromMe;
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

    const resposta = await askGemini(text); // ex: "rh", "marketing"

    const setor = resposta.toLowerCase().trim();
    const numeroSetor = setores[setor];

    if (numeroSetor) {
      const mensagens = frasesDeEncaminhamento(setor, numeroSetor);
      const aleatoria = mensagens[Math.floor(Math.random() * mensagens.length)];

      const zapiRes = await axios.post(
        `https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN}/send-button-actions`,
        {
          phone: from,
          message: aleatoria.message,
          buttonActions: [
            {
              id: "1",
              type: "URL",
              url: aleatoria.url,
              label: aleatoria.buttonLabel
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

      console.log("📤 Botão enviado:", zapiRes.data);
    } else {
      // fallback caso Gemini retorne "indefinido"
      await axios.post(
        `https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN}/send-text`,
        {
          phone: from,
          message:
            "Desculpe, ainda não consegui entender para qual setor você gostaria de ser direcionado. Pode reformular sua mensagem? 🤔"
        },
        {
          headers: {
            "client-token": CLIENT_TOKEN
          }
        }
      );

      console.log("⚠️ Setor não reconhecido:", resposta);
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Erro no webhook:", err.response?.data || err.message);
    res.status(500).json({ error: "Erro no webhook" });
  }
});

module.exports = router;
