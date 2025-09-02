const axios = require("axios");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

// Prompt avançado
const SYSTEM_PROMPT = `
Você é uma recepcionista virtual da empresa SETAI.

Sua missão é:
- Cumprimentar de forma educada e natural
- Entender a necessidade do cliente
- Identificar o setor ideal
- Responder de forma simpática e clara
- Indicar qual setor vai ajudá-lo
- Finalizar com educação

NUNCA:
- Fale sobre preços, processos ou dados da empresa
- Alucine informações

Setores disponíveis:
- rh → 5583994833333
- marketing → 5583994833333
- comercial setai → 5583994833333
- comercial reserve → 5583994833333

A saída deve conter:
1. Um texto completo com o nome do setor (em minúsculo e exato)
2. Não envie o link diretamente — o sistema cuidará disso

Exemplo:
"Olá! 😊 Entendi que você precisa falar com o setor de *rh*. Vou te redirecionar agora mesmo. Se precisar de mais alguma coisa, é só me chamar!"
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
