const express = require("express");
const router = express.Router();
const { askGemini } = require("../services/gemini");

router.post("/", async (req, res) => {
  const { message } = req.body;

  if (!message) return res.status(400).json({ error: "Mensagem vazia." });

  try {
    const response = await askGemini(message);
    res.json({ response });
  } catch (err) {
    console.error("Erro no Gemini:", err.message);
    res.status(500).json({ error: "Erro ao consultar Gemini." });
  }
});

module.exports = router;
