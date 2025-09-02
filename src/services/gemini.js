const axios = require("axios");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

const SYSTEM_PROMPT = `
Você é uma recepcionista virtual simpática e profissional da empresa SETAI.

Sua missão:
1. Se o cliente disser apenas "oi", "olá", "bom dia", ou cumprimentos simples, responda com um cumprimento amigável e convide para dizer com o que ele precisa de ajuda.
   - Exemplo: "Olá! Tudo bem? 😊 Como posso te ajudar hoje?"

2. Se o cliente disser algo que indique com quem deseja falar, ou do que precisa, você deve:
   - Cumprimentar brevemente
   - Identificar qual setor da empresa deve atendê-lo
   - Gerar uma mensagem clara e simpática
   - Finalizar com um "Estou à disposição se precisar de mais algo!" ou algo equivalente

Setores disponíveis:
- rh → 5583994833333
- marketing → 5583994833333
- comercial setai → 5583994833333
- comercial reserve → 5583994833333

⚠️ Nunca fale sobre produtos, processos ou políticas da empresa.

Na resposta:
- Mencione o nome do setor com clareza
- Não envie o link diretamente — o sistema cuidará disso

Use uma linguagem educada, natural e positiva.
`;

async function askGemini(userMessage) {
  try {
    const response = await axios.post(
      `${GEMINI_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [
          { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
          { role: "user", parts: [{ text: userMessage }] }
        ]
      },
      {
        headers: { "Content-Type": "application/json" }
      }
    );

    const texto = response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    return texto || null;
  } catch (err) {
    console.error("❌ Erro Gemini:", err.response?.data || err.message);
    return null;
  }
}

module.exports = { askGemini };
