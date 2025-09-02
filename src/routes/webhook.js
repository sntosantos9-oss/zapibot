const express = require("express");
const router = express.Router();
const axios = require("axios");
const { interpretarMensagemComIA } = require("../services/interpretadorGemini");

const INSTANCE_ID = process.env.INSTANCE_ID;
const TOKEN = process.env.TOKEN;
const CLIENT_TOKEN = process.env.CLIENT_TOKEN;

const setores = {
  "rh": "5583994833333",
  "marketing": "5583994833333",
  "comercial setai": "5583994833333",
  "comercial reserve": "5583994833333",
  "financeiro": "5583994833333"
};

const sessoes = {};

const enviarDigitando = async (phone) => {
  await axios.post(
    `https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN}/typing`,
    { phone, typing: true },
    { headers: { "client-token": CLIENT_TOKEN } }
  );
  await new Promise((resolve) => setTimeout(resolve, 2000));
};

router.post("/", async (req, res) => {
  if (req.body.fromApi || req.body.fromMe) return res.sendStatus(200);

  try {
    const from = req.body.phone;
    const text = req.body.text?.message?.trim();
    if (!from || !text) return res.sendStatus(400);

    const sessao = sessoes[from] || { nome: null, historico: [] };
    sessao.historico.push(text);

    const respostaIA = await interpretarMensagemComIA(sessao.historico.join("\n"), sessao.nome);

    if (respostaIA.nome) sessao.nome = respostaIA.nome;
    sessoes[from] = sessao;

    await enviarDigitando(from);

    if (respostaIA.proxima_acao === "encaminhar_setor" && respostaIA.setor) {
      const numero = setores[respostaIA.setor.toLowerCase()];
      if (numero) {
        await axios.post(
          `https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN}/send-button-actions`,
          {
            phone: from,
            message: respostaIA.resposta,
            buttonActions: [
              {
                id: "1",
                type: "URL",
                url: `https://wa.me/${numero}`,
                label: `Falar com ${respostaIA.setor}`
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
        return res.sendStatus(200);
      }
    }

    // Mensagem comum
    await axios.post(
      `https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN}/send-text`,
      {
        phone: from,
        message: respostaIA.resposta
      },
      { headers: { "client-token": CLIENT_TOKEN } }
    );

    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Erro no webhook dinâmico:", err.response?.data || err.message);
    res.status(500).json({ error: "Erro no webhook" });
  }
});

module.exports = router;
