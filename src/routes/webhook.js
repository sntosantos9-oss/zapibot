try {
  const from = req.body.phone;
  const text = req.body.text?.message;

  const fromApi = req.body.fromApi;
  const fromMe = req.body.fromMe;
  if (fromApi || fromMe) {
    console.log("🔁 Ignorado: mensagem enviada pelo próprio bot");
    return res.sendStatus(200);
  }

  if (!from || !text) {
    console.log("❗ Mensagem inválida:", req.body);
    return res.status(400).json({ error: "Mensagem inválida" });
  }

  const resposta = await askGemini(text); // deve ser apenas: rh, marketing, etc

  const setores = {
    "rh": "5583994833333",
    "marketing": "5583994833333",
    "comercial setai": "5583994833333",
    "comercial reserve": "5583994833333"
  };

  const numeroSetor = setores[resposta.toLowerCase().trim()];

  if (numeroSetor) {
    await axios.post(
      `https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN}/send-link-buttons`,
      {
        phone: from,
        message: `Clique no botão abaixo para falar com o setor **${resposta}**:`,
        buttons: [
          {
            label: `Falar com ${resposta}`,
            url: `https://wa.me/${numeroSetor}`
          }
        ]
      },
      {
        headers: {
          "client-token": CLIENT_TOKEN
        }
      }
    );
    console.log("✅ Botão enviado para redirecionar ao setor:", resposta);
  } else {
    // fallback: resposta padrão
    await axios.post(
      `https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN}/send-text`,
      {
        phone: from,
        message: "Desculpe, não consegui identificar o setor que você deseja falar."
      },
      {
        headers: {
          "client-token": CLIENT_TOKEN
        }
      }
    );
    console.log("⚠️ Setor não encontrado na resposta:", resposta);
  }

  res.sendStatus(200);
} catch (err) {
  console.error("❌ Erro no webhook:", err.response?.data || err.message);
  res.status(500).json({ error: "Erro no webhook" });
}
