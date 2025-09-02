const express = require("express");
const router = express.Router();
const { askGemini } = require("../services/gemini");

router.post("/", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Campo 'message' é obrigatório." });
  }

  try {
    const response = await askGemini(message);
    res.json({ response });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
