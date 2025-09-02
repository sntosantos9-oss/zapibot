// 📁 src/services/geminiNomeExtractor.js

const axios = require("axios");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

const SYSTEM_PROMPT_NOME = `
Você é uma IA extratora de informações.
Extraia apenas o primeiro nome da pessoa baseado na mensagem enviada por ela.
Exemplos:
- "Sou a Joana" → Joana
- "Me chamo Pedro" → Pedro
- "Oi, aqui é o Bruno" → Bruno
- "Carlos" → Carlos

Se não houver nome claro, responda apenas com: indefinido
Não envie nada além do nome isolado ou "indefinido".
`;

async function extrairNomeViaGemini(mensagem) {
  try {
    const response = await axios.post(
      `${GEMINI_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [
          { role: "user", parts: [{ text: SYSTEM_PROMPT_NOME }] },
          { role: "user", parts: [{ text: mensagem }] }
        ]
      },
      {
        headers: { "Content-Type": "application/json" }
      }
    );

    const nome = response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    return nome || "indefinido";
  } catch (err) {
    console.error("❌ Erro ao extrair nome via Gemini:", err.response?.data || err.message);
    return "indefinido";
  }
}

module.exports = { extrairNomeViaGemini };
