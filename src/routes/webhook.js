const express = require("express");
const router = express.Router();
const axios = require("axios");
const { askGemini } = require("../services/gemini");
const { extrairNomeViaGemini } = require("../services/geminiNomeExtractor");
const { gerarFraseDeEncerramento } = require("../services/fraseEncerramentoGemini");

const INSTANCE_ID = process.env.INSTANCE_ID;
const TOKEN = process.env.TOKEN;
const CLIENT_TOKEN = process.env.CLIENT_TOKEN;

const setores = {
  "RH": { phone: "5583994833333", image: "https://img001.prntscr.com/file/img001/1YQNsTQUTkuTmrPtr3I7zA.png" },
  "marketing": { phone: "5583994833333", image: "URL_IMAGEM_MARKETING" },
  "comercial setai": { phone: "5583994833333", image: "URL_IMAGEM_COMERCIAL_SETAI" },
  "comercial reserve": { phone: "5583994833333", image: "URL_IMAGEM_COMERCIAL_RESERVE" },
  "financeiro": { phone: "5583994833333", image: "URL_IMAGEM_FINANCEIRO" }
};

const sessoes = {};

const identificarSetor = (texto) => {
  const lower = texto.toLowerCase();
  return Object.keys(setores).find((s) => lower.includes(s)) || null;
};

router.post("/", async (req, res) => {
  if (req.body.fromApi || req.body.fromMe) return res.sendStatus(200);

  try {
    const from = req.body.phone;
    const text = req.body.text?.message?.trim();
    if (!from || !text) return res.sendStatus(400);

    const lowerText = text.toLowerCase();
    const sessao = sessoes[from] || { etapa: 1, nome: null, mensagens: [], encerramentoEnviado: false };

    // Etapa 1: pedir nome
    if (sessao.etapa === 1) {
      await axios.post(
        `https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN}/send-text`,
        { phone: from, message: "👋 Olá! Sou a assistente virtual da SETAI. Qual o seu nome?" },
        { headers: { "client-token": CLIENT_TOKEN } }
      );
      sessao.etapa = 2;
      sessoes[from] = sessao;
      return res.sendStatus(200);
    }

    // Etapa 2: capturar nome
    if (sessao.etapa === 2 && !sessao.nome) {
      sessao.mensagens.push(text);
      const nome = await extrairNomeViaGemini(sessao.mensagens.join(" "));
      if (nome && nome !== "indefinido") {
        sessao.nome = nome;
        await axios.post(`https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN}/send-text`,
          { phone: from, message: `Prazer, ${sessao.nome}! Como posso te ajudar hoje?` },
          { headers: { "client-token": CLIENT_TOKEN } }
        );
        sessao.etapa = 3;
      }
      sessoes[from] = sessao;
      return res.sendStatus(200);
    }

    // Etapa 3: identificar setor e enviar imagem+botão
    if (sessao.etapa === 3) {
      sessao.mensagens.push(text);
      const resposta = await askGemini(sessao.mensagens.join(" "));
      const setor = identificarSetor(resposta);
      if (setor) {
        const { phone, image } = setores[setor];
        await axios.post(`https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN}/send-button-list`,
          {
            phone: from,
            message: `Perfeito, ${sessao.nome}! Clique abaixo para falar com o setor de *${setor.toUpperCase()}*:`,
            buttonList: { image, buttons: [{ id: "1", label: `Falar com ${setor}` }] }
          },
          { headers: { "client-token": CLIENT_TOKEN, "Content-Type": "application/json" } }
        );
        sessao.etapa = 4;
        sessao.encerramentoEnviado = false;
        sessoes[from] = sessao;
        return res.sendStatus(200);
      } else {
        await axios.post(`https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN}/send-text`,
          { phone: from, message: `Desculpe ${sessao.nome}, não entendi. Pode reformular?` },
          { headers: { "client-token": CLIENT_TOKEN } }
        );
        return res.sendStatus(200);
      }
    }

    // Etapa 4: encerramento ou retomada imediata
    if (sessao.etapa === 4) {
      const agradecimentos = ["obrigado", "valeu", "show", "agradecido"];
      const reabrir = ["sim", "quero", "preciso", "sobre", "gostaria"];

      if (reabrir.some(w => lowerText.includes(w))) {
        sessao.etapa = 3;
        sessao.mensagens = [text];
        sessao.encerramentoEnviado = false;
        sessoes[from] = sessao;
        return res.sendStatus(200);
      }

      if (agradecimentos.some(w => lowerText.includes(w)) && !sessao.encerramentoEnviado) {
        const frase = await gerarFraseDeEncerramento(sessao.nome);
        await axios.post(`https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN}/send-text`,
          { phone: from, message: frase },
          { headers: { "client-token": CLIENT_TOKEN } }
        );
        sessao.encerramentoEnviado = true;
        sessoes[from] = sessao;
        return res.sendStatus(200);
      }

      // Mensagem irrelevante ou curta, dar fallback amigável
      await axios.post(`https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN}/send-text`,
        { phone: from, message: `Estou por aqui, ${sessao.nome}! Como posso ajudar mais?` },
        { headers: { "client-token": CLIENT_TOKEN } }
      );
      return res.sendStatus(200);
    }

  } catch (err) {
    console.error("❌ Erro no webhook:", err.response?.data || err.message);
    res.status(500).json({ error: "Erro no webhook" });
  }
});

module.exports = router;
