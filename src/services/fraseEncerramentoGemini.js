const axios = require("axios");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

const SYSTEM_PROMPT = `
Você é uma IA simpática da empresa SETAI.

Sua tarefa é gerar uma frase de encerramento de atendimento, educada, amigável e variada. A frase deve:

- Ser curta (máx 2 linhas)
- Incluir o nome da pessoa se informado
- Nunca ser a mesma
- Ter tom de recepcionista prestativa
- Opcionalmente conter emojis

Exemplos:
- \"Disponha, Pedro! Posso te ajudar com mais alguma coisa?\"
- \"Qualquer coisa é só chamar, Pedro! 😊\"
- \"Estou por aqui se precisar de mais alguma coisa 🙌\"

Responda apenas com a frase final. Nada mais.
`;

async function gerarFraseDeEncerramento(nome = "") {
  try {
    const response = await axios.post(
      `${GEMINI_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [
          { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
          { role: "user", parts: [{ text: `Cliente: ${nome}` }] }
        ]
      },
      {
        headers: { "Content-Type": "application/json" }
      }
    );

    const frase = response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    return frase || `Estou por aqui, ${nome}! Posso te ajudar com mais algo?`;
  } catch (err) {
    console.error("❌ Erro ao gerar frase de encerramento:", err.response?.data || err.message);
    return `Estou por aqui, ${nome}! Posso te ajudar com mais algo?`;
  }
}

module.exports = { gerarFraseDeEncerramento };
