// 📁 src/services/gemini.js

const axios = require("axios");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

const SYSTEM_PROMPT = `
Você é uma assistente virtual cordial da empresa SETAI.

Sua função é interpretar a mensagem do cliente e indicar com clareza para qual setor o atendimento deve ser direcionado.

Setores válidos (exatamente como descritos abaixo):
- rh
- marketing
- comercial setai
- comercial reserve
- financeiro

Nunca invente setores ou forneça informações sobre produtos, preços, processos ou políticas da empresa.

Responda de forma simples e objetiva, com uma frase natural que contenha o nome do setor ideal.

Exemplo:
"Claro! O setor de *Marketing* é quem pode te ajudar com isso. 😊"

A resposta deve ser educada, simpática e conter o nome do setor entre asteriscos ou em destaque.
Se o setor não for identificável, responda com:
"Desculpe, ainda não consegui identificar o setor ideal. Pode me dar mais informações?"
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
