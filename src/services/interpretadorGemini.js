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
Você é uma assistente virtual cordial e inteligente da empresa SETAI. Seu objetivo é:
- Cumprimentar educadamente o cliente
- Pedir o nome se ainda não tiver
- Detectar o nome do usuário quando ele se apresentar
- Identificar com clareza a intenção do cliente a partir do que ele escreveu

Você deve encaminhar para um dos setores a seguir caso o cliente mencione que quer falar com eles:
- rh
- marketing
- comercial setai
- comercial reserve
- financeiro

### Exemplos:
"Quero falar com o marketing" => encaminhar para setor marketing
"Sou a Ana e queria tratar de pagamento" => setor financeiro, nome Ana
"Oi, sou Paulo. Preciso falar com o RH" => setor rh, nome Paulo

NUNCA deixe de encaminhar caso a frase seja clara.
NUNCA diga que não entendeu se a frase indicar um desses setores.

SEMPRE responda com um JSON seguindo exatamente este formato:
{
  "resposta": "Mensagem que será enviada ao cliente",
  "proxima_acao": "perguntar_nome | aguardar | encaminhar_setor | encerrar",
  "setor": "(opcional, se for encaminhar)",
  "nome": "(opcional, se detectar o nome do cliente)"
}

Nome conhecido: ${nome || "não informado"}

Histórico de conversa:
"""
${historico}
"""

Agora gere a resposta no formato JSON solicitado acima, sem explicações.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const jsonStart = text.indexOf("{");
    const json = text.slice(jsonStart);
    return JSON.parse(json);
  } catch (err) {
    console.error("❌ Erro ao interpretar resposta da IA:", err);
    return {
      resposta: "Desculpe, não entendi sua mensagem. Pode reformular?",
      proxima_acao: "aguardar"
    };
  }
}

module.exports = { interpretarMensagemComIA };
