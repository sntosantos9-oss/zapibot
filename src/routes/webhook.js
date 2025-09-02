const express = require("express");
const router = express.Router();
const axios = require("axios");
const { extrairNomeViaGemini, gerarFraseDeEncerramento, classificarIntencao } = require("../services/interpretadorGemini");

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

const identificarSetor = (texto) => {
  const lower = texto.toLowerCase();
  return Object.keys(setores).find((s) => lower.includes(s)) || null;
};

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

    const lowerText = text.toLowerCase();
    const sessao = sessoes[from] || { nome: null, mensagens: [], etapa: 1, encerrado: false };
    sessao.mensagens.push(text);

    const intencao = await classificarIntencao(text);

    // Se conversa foi encerrada, mas o cliente retoma com nova intenção
    if (sessao.encerrado && intencao === "retomada") {
      sessao.etapa = 3;
      sessao.encerrado = false;
    }

    if (sessao.etapa === 1) {
      await enviarDigitando(from);
      await axios.post(
        `https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN}/send-text`,
        {
          phone: from,
          message: "👋 Olá! Sou a assistente virtual da SETAI. Qual o seu nome para que eu possa te atender melhor?"
        },
        { headers: { "client-token": CLIENT_TOKEN } }
      );
      sessao.etapa = 2;
      sessoes[from] = sessao;
      return res.sendStatus(200);
    }

    if (sessao.etapa === 2 && !sessao.nome) {
      const nomeDetectado = await extrairNomeViaGemini(text);
      if (nomeDetectado && nomeDetectado !== "indefinido") {
        sessao.nome = nomeDetectado;
        await enviarDigitando(from);
        await axios.post(
          `https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN}/send-text`,
          {
            phone: from,
            message: `Prazer, ${sessao.nome}! 😊 Como posso te ajudar hoje?`
          },
          { headers: { "client-token": CLIENT_TOKEN } }
        );
        sessao.etapa = 3;
        sessoes[from] = sessao;
      }
      return res.sendStatus(200);
    }

    if (sessao.etapa === 3) {
      const setor = identificarSetor(text);
      if (setor) {
        const numero = setores[setor];
        await enviarDigitando(from);
        await axios.post(
          `https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN}/send-button-actions`,
          {
            phone: from,
            message: `Perfeito, ${sessao.nome}! Pelo que entendi, o melhor setor para te ajudar é *${setor.toUpperCase()}*. Clique abaixo para falar com eles:`,
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
        sessao.etapa = 4;
        sessao.encerrado = false;
        sessoes[from] = sessao;
        return res.sendStatus(200);
      } else {
        await enviarDigitando(from);
        await axios.post(
          `https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN}/send-text`,
          {
            phone: from,
            message: `Desculpe, ${sessao.nome}, ainda não consegui entender com qual setor você deseja falar. Pode reformular? 🤔`
          },
          { headers: { "client-token": CLIENT_TOKEN } }
        );
        return res.sendStatus(200);
      }
    }

    if (sessao.etapa === 4) {
      if (intencao === "agradecimento" && !sessao.encerrado) {
        const frase = await gerarFraseDeEncerramento(sessao.nome);
        await enviarDigitando(from);
        await axios.post(
          `https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN}/send-text`,
          {
            phone: from,
            message: frase
          },
          { headers: { "client-token": CLIENT_TOKEN } }
        );
        sessao.encerrado = true;
        sessoes[from] = sessao;
        return res.sendStatus(200);
      }

      if (intencao === "retomada" || text.length >= 4) {
        sessao.etapa = 3;
        sessao.encerrado = false;
        sessoes[from] = sessao;
        return res.sendStatus(200);
      }

      await enviarDigitando(from);
      await axios.post(
        `https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN}/send-text`,
        {
          phone: from,
          message: `Estou por aqui caso precise de algo, ${sessao.nome}! 😉`
        },
        { headers: { "client-token": CLIENT_TOKEN } }
      );
    }

    return res.sendStatus(200);
  } catch (err) {
    console.error("❌ Erro no webhook:", err.response?.data || err.message);
    res.status(500).json({ error: "Erro no webhook" });
  }
});

module.exports = router;
