const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

/**
 * Interpreta o histórico completo e retorna a próxima ação da IA
 * @param {string} historico Conversa acumulada
 * @param {string | null} nome Nome do usuário, se já conhecido
 * @returns {Promise<{ resposta: string, proxima_acao: string, setor?: string, nome?: string }>}
 */
async function interpretarMensagemComIA(historico, nome = null) {
  const prompt = `
Você é uma assistente virtual educada, cordial e focada em atendimento para uma empresa chamada SETAI.

Com base na conversa abaixo, você deve:
- Cumprimentar caso a conversa esteja começando
- Pedir o nome se ainda não foi informado
- Extrair o nome se o usuário mencionou
- Entender a necessidade da pessoa
- Redirecionar para um dos setores abaixo se fizer sentido:
    - rh
    - marketing
    - comercial setai
    - comercial reserve
    - financeiro
- Agradecer quando receber "obrigado" ou semelhantes
- Retomar o atendimento se o cliente continuar falando após o encerramento

Nunca invente informações. Nunca diga que está aprendendo. Não diga que é IA. Seja humano, leve, simpático e direto.

Formato da resposta (JSON):
{
  "resposta": "Mensagem que você vai enviar ao cliente",
  "proxima_acao": "perguntar_nome | aguardar | encaminhar_setor | encerrar",
  "setor": "(opcional, se for encaminhar)",
  "nome": "(opcional, se detectar nome do cliente)"
}

Se o nome já é conhecido, personalize a resposta com ele.

Conversa:
"""
${historico}
"""

Nome já conhecido: ${nome || "nenhum"}

Responda agora com o JSON apenas, sem explicações.`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

  try {
    const jsonStart = text.indexOf("{");
    const json = text.slice(jsonStart);
    return JSON.parse(json);
  } catch (err) {
    console.error("❌ Erro ao interpretar resposta da IA:", text);
    return {
      resposta: "Desculpe, não entendi sua mensagem. Pode reformular?",
      proxima_acao: "aguardar"
    };
  }
}

module.exports = { interpretarMensagemComIA };
