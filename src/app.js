require("dotenv").config(); // Funciona localmente, ignorado no Render se .env não existir
const express = require("express");

const app = express();
app.use(express.json());

// Rotas

const webhook = require("./routes/webhook");
app.use("/webhook", webhook);

const askRoute = require("./routes/ask");
app.use("/ask", askRoute);

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
