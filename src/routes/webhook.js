// ✅ Estrutura de atendimento em etapas (nome -> necessidade -> direcionamento)

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

// Sessões de atendimento por telefone
const sessoes = {}; // { [telefone]: { etapa, nome, mensagens: [] } }

const identificarSetor = (texto) => {
  const lower = texto.toLowerCase();
  return Object.keys(setores).find((s) => lower.includes(s)) || null;
};

router.post("/", async (req, res) => {
  const fromApi = req.body.fromApi;
  const fromMe = req.body.fromMe;
  if (fromApi || fromMe) return res.sendStatus(200);

  try {
    const from = req.body.phone;
    const text = req.body.text?.message?.trim();
    if (!from || !text) return res.sendStatus(400);

    const sessao = sessoes[from] || { etapa: 1, nome: null, mensagens: [] };

    // Etapa 1: perguntar nome
    if (sessao.etapa === 1) {
      await axios.post(`https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN}/send-text`, {
        phone: from,
        message: "👋 Olá! Sou a assistente virtual da SETAI. Qual o seu nome para que eu possa te atender melhor?"
      }, {
        headers: { "client-token": CLIENT_TOKEN }
      });
      sessao.etapa = 2;
      sessoes[from] = sessao;
      return res.sendStatus(200);
    }

    // Etapa 2: capturar nome e perguntar objetivo
    if (sessao.etapa === 2 && !sessao.nome) {
      sessao.nome = text.split(" ")[0];
      await axios.post(`https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN}/send-text`, {
        phone: from,
        message: `Prazer, ${sessao.nome}! 😊 Como posso te ajudar hoje?`
      }, {
        headers: { "client-token": CLIENT_TOKEN }
      });
      sessao.etapa = 3;
      sessoes[from] = sessao;
      return res.sendStatus(200);
    }

    // Etapa 3: entender a necessidade
    if (sessao.etapa === 3) {
      sessao.mensagens.push(text);
      const mensagemCompleta = sessao.mensagens.join(" ");
      const respostaGemini = await askGemini(mensagemCompleta);

      const setor = identificarSetor(respostaGemini);
      const numero = setores[setor];

      if (setor && numero) {
        await axios.post(`https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN}/send-button-actions`, {
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
        }, {
          headers: {
            "client-token": CLIENT_TOKEN,
            "Content-Type": "application/json"
          }
        });

        sessao.etapa = 4; // conversa encaminhada
        sessoes[from] = sessao;
        return res.sendStatus(200);
      } else {
        // Ainda não entendeu
        await axios.post(`https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN}/send-text`, {
          phone: from,
          message: `Desculpe ${sessao.nome}, não entendi exatamente com qual setor você deseja falar. Pode explicar de outro jeito?`
        }, {
          headers: { "client-token": CLIENT_TOKEN }
        });
        return res.sendStatus(200);
      }
    }

    // Etapa 4: aguardar agradecimento ou novas perguntas
    if (sessao.etapa === 4) {
      if (["obrigado", "valeu", "agradecido", "show"].includes(text.toLowerCase())) {
        await axios.post(`https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN}/send-text`, {
          phone: from,
          message: `Fico feliz em ajudar, ${sessao.nome}! 😊 Estou por aqui caso precise de algo mais.`
        }, {
          headers: { "client-token": CLIENT_TOKEN }
        });
        delete sessoes[from];
        return res.sendStatus(200);
      } else {
        // Se mandar nova necessidade, retorna atendimento
        sessao.etapa = 3;
        sessao.mensagens = [text];
        sessoes[from] = sessao;
        return res.sendStatus(200);
      }
    }
  } catch (err) {
    console.error("❌ Erro no webhook:", err.response?.data || err.message);
    res.status(500).json({ error: "Erro no webhook" });
  }
});

module.exports = router;
