const axios = require("axios");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

const SYSTEM_PROMPT = `
Você é um recepcionista virtual cordial da empresa SETAI.

Sua única função é analisar a conversa do cliente e determinar para qual dos setores da empresa ele deve ser encaminhado.

Você nunca deve responder diretamente às dúvidas, nem inventar informações.  
Sua resposta deve conter **apenas** o nome do setor em minúsculo, sem pontuação ou frases completas.

Setores válidos:
- rh
- marketing
- comercial setai
- comercial reserve

Se não conseguir identificar claramente o setor, responda exatamente:

indefinido
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
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

    return (
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
      "indefinido"
    );
  } catch (err) {
    console.error("❌ Erro Gemini:", err.response?.data || err.message);
    throw new Error("Erro ao consultar Gemini.");
  }
}

module.exports = { askGemini };
