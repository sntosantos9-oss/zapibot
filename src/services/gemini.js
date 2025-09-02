const axios = require("axios");

// ✅ Nova URL e modelo definidos corretamente
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// 🧠 Prompt de sistema (concierge)
const SYSTEM_PROMPT = `
Você é um recepcionista da empresa SETAI, e irá redirecionar os usuários para os setores corretos mediante o entendimento do contexto da mensagem, abaixo segue uma lista com nome e número do setor:
rh:5583994833333;
marketing:5583994833333
comercial setai:5583994833333
comercial reserve:5583994833333
`;

async function askGemini(userMessage) {
  try {
    const response = await axios.post(
      `${GEMINI_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            role: "user",
            parts: [{ text: SYSTEM_PROMPT }]
          },
          {
            role: "user",
            parts: [{ text: userMessage }]
          }
        ]
      },
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

    return (
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Desculpe, não consegui gerar uma resposta."
    );
  } catch (err) {
    console.error("❌ Erro Gemini:", err.response?.data || err.message);
    throw new Error("Erro ao consultar Gemini.");
  }
}

module.exports = { askGemini };
