const express = require("express");
const router = express.Router();
const { askGemini } = require("../services/gemini");
const axios = require("axios");

const INSTANCE_ID = process.env.INSTANCE_ID;
const TOKEN = process.env.TOKEN;
const CLIENT_TOKEN = process.env.CLIENT_TOKEN;

// Setores disponíveis
const setores = {
  "rh": "5583994833333",
  "marketing": "5583994833333",
  "comercial setai": "5583994833333",
  "comercial reserve": "5583994833333"
};

// Sessões temporárias por número (em memória)
const sessaoUsuarios = {};

// Delay em milissegundos para esperar mensagens picadas
const DELAY_MILIS = 3000;

// 🎯 Modelos de mensagens de encaminhamento com encerramento
const gerarMensagem = (setor) => {
  const modelos = [
    `😄 Tudo certo! Vou te redirecionar ao setor de *${setor.toUpperCase()}*.\nSe precisar de algo mais, fico à disposição!`,
    `🤖 Entendido! O setor de *${setor}* é quem pode te atender melhor.\nQualquer dúvida, me chame novamente.`,
    `📍 Encaminhando para o time de *${setor}*.\nEstou por aqui caso precise de mais alguma coisa.`,
    `✅ Pronto! Clique no botão abaixo para falar com *${setor}*.\nEstou à disposição para ajudar com o que for necessário.`,
    `🧭 Já direcionei você ao setor *${setor.toUpperCase()}*.\nSe tiver mais alguma dúvida, é só me chamar!`
  ];
  return modelos[Math.floor(Math.random() * modelos.length)];
};

router.post("/", async (req, res) => {
  const fromApi = req.body.fromApi;
  const fromMe = req.body.fromMe;
  if (fromApi || fromMe) return res.sendStatus(200);

  try {
    const from = req.body.phone;
    const text = req.body.text?.message;
    if (!from || !text) return res.status(400).json({ error: "Mensagem inválida" });

    const agora = Date.now();
    const sessao = sessaoUsuarios[from] || {
      mensagens: [],
      ultimaMensagem: 0,
      saudado: false
    };

    // 👋 Cumprimentar o usuário uma única vez
    if (!sessao.saudado) {
      await axios.post(
        `https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN}/send-text`,
        {
          phone: from,
          message:
            "👋 Olá! Seja bem-vindo(a) à SETAI.\nSou sua assistente virtual e vou te ajudar a encontrar o setor ideal para sua necessidade. Pode me contar o que você precisa?"
        },
        {
          headers: { "client-token": CLIENT_TOKEN }
        }
      );
      sessao.saudado = true;
    }

    // Armazena mensagem e tempo
    sessao.mensagens.push(text);
    const tempoDesdeUltima = agora - sessao.ultimaMensagem;
    sessao.ultimaMensagem = agora;
    sessaoUsuarios[from] = sessao;

    // ⏳ Aguarda se a última mensagem foi há pouco tempo
    if (tempoDesdeUltima < DELAY_MILIS) {
      console.log(`⌛ Aguardando mais mensagens de ${from}...`);
      return res.sendStatus(200);
    }

    // 🧠 Quando passar o delay, analisa a conversa completa
    const mensagemCompleta = sessao.mensagens.join(" ");
    const resposta = await askGemini(mensagemCompleta);

    // 🔁 Limpa a sessão
    delete sessaoUsuarios[from];

    const setor = resposta.toLowerCase().trim();
    const numeroSetor = setores[setor];

    if (numeroSetor) {
      const mensagem = gerarMensagem(setor);
      await axios.post(
        `https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN}/send-button-actions`,
        {
          phone: from,
          message: mensagem,
          buttonActions: [
            {
              id: "1",
              type: "URL",
              url: `https://wa.me/${numeroSetor}`,
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

      console.log(`✅ Redirecionado para setor: ${setor}`);
    } else {
      await axios.post(
        `https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN}/send-text`,
        {
          phone: from,
          message:
            "🤖 Ainda não entendi com qual setor você deseja falar. Pode reformular sua mensagem com mais detalhes?"
        },
        {
          headers: { "client-token": CLIENT_TOKEN }
        }
      );

      console.log("⚠️ Setor indefinido:", resposta);
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Erro no webhook:", err.response?.data || err.message);
    res.status(500).json({ error: "Erro no webhook" });
  }
});

module.exports = router;
