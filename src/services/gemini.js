const axios = require("axios");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent";

const SYSTEM_PROMPT = `
Você é uma concierge especializada no aluguel de flats em João Pessoa.
Responda de forma clara, educada e útil.
Quando possível, incentive o cliente a informar o número de telefone para contato ou WhatsApp.
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

    return response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "Desculpe, não consegui gerar uma resposta.";
  } catch (err) {
    console.error("Erro Gemini:", err.response?.data || err.message);
    throw new Error("Erro ao consultar Gemini.");
  }
}

module.exports = { askGemini };
