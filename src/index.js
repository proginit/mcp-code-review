import express from "express";
import dotenv from "dotenv";
import { handlePullRequest } from "./github.js";
import path from "path";
import { fileURLToPath } from "url";

// configurar __dirname en módulos ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// cargar variables de entorno desde .env
dotenv.config({ path: path.join(__dirname, "../.env") });

// Verificar variables requeridas
const requiredVars = ["GITHUB_TOKEN", "PORT", "OLLAMA_HOST"];
for (const v of requiredVars) {
  if (!process.env[v]) console.warn(`⚠️ Falta variable en .env: ${v}`);
}

// Inicializar Servidor
const app = express();
app.use(express.json());

// Endpoint principal para GitHub Webhoook
app.post("/webhook", async (req, res) => {
  const event = req.headers["x-github-event"];
  const action = req.body?.action;
  const pr = req.body?.pull_request;

  res.sendStatus(200);

  if (
    event === "pull_request" &&
    ["opened", "reopened", "synchronize"].includes(action)
  ) {
    console.log(`📥 Evento PR recibido: #${pr?.number} (${action})`);
    await handlePullRequest(pr).catch((err) =>
      console.error("❌ Error en handlePullRequest:", err)
    );
  } else {
    console.log(`📭 Evento ignorado: ${event} (${action})`);
  }
  // res.sendStatus(200);
});

// Inicia el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ MCP Server corriendo en puerto ${PORT}`);
});
