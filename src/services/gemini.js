const axios = require("axios");


const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;


const SYSTEM_PROMPT = `
Você é o recepcionista virtual da empresa SETAI.
Sua única função é identificar para qual dos setores o cliente deseja ser redirecionado.

Seja cordial, humano e breve, mas nunca inicie conversa por conta própria.
Não tente ajudar além disso, e não responda dúvidas sobre a empresa, produtos, processos internos ou documentos.

Setores disponíveis:
- rh
- marketing
- comercial setai
- comercial reserve

Ao receber a mensagem do usuário:
1. Identifique o setor desejado com base no conteúdo.
2. Retorne apenas o NOME do setor em letras minúsculas (sem frases completas), por exemplo: "rh"
3. Nada além do nome do setor deve ser incluído na resposta.


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
