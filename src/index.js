import express from "express";
import dotenv from "dotenv";
import { handlePullRequest } from "./github.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Forzar a dotenv a buscar el archivo .env en la raíz del proyecto
dotenv.config({ path: path.join(__dirname, "../.env") });

console.log("🔍 Variables cargadas:", {
  GITHUB_TOKEN: process.env.GITHUB_TOKEN ? "✅ Cargado" : "❌ No encontrado",
  PORT: process.env.PORT,
  OLLAMA_HOST: process.env.OLLAMA_HOST
});

dotenv.config();

console.log("🔑 TOKEN:", process.env.GITHUB_TOKEN);
const app = express();
app.use(express.json());

app.post("/webhook", async (req, res) => {
  const event = req.headers["x-github-event"];
  if (event === "pull_request" && ["opened", "reopened", "synchronize"].includes(req.body.action)) {
    console.log("📥 Pull Request recibido");
    await handlePullRequest(req.body.pull_request);
  }
  res.sendStatus(200);
});

app.listen(process.env.PORT, () => {
  console.log(`✅ MCP Server corriendo en puerto ${process.env.PORT}`);
});
