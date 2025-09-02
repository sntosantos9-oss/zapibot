const axios = require("axios");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

const SYSTEM_PROMPT = `
Você é um assistente inteligente que ajuda corretores a responder perguntas sobre aluguel de flats em João Pessoa.
Seja educado, direto e sempre peça o número de telefone do interessado no final da resposta, caso ainda não tenha sido informado.
`;

async function askGemini(userMessage) {
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

  return response.data.candidates?.[0]?.content?.parts?.[0]?.text || "Não consegui gerar uma resposta.";
}

module.exports = { askGemini };
