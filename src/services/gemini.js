const axios = require("axios");


const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;


const SYSTEM_PROMPT = `
Você é um recepcionista virtual da empresa SETAI.
Ao receber uma mensagem, identifique para qual dos setores o cliente quer ser redirecionado.
NUNCA puxe conversa ou faça perguntas.
Você só deve responder com o nome do setor correspondente (em minúsculo) e mais nada.

Setores disponíveis:
- rh
- marketing
- comercial setai
- comercial reserve

Exemplo:
Usuário: quero falar sobre uma vaga de trabalho  
Resposta: rh

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
