import axios from "axios";
import { analyzeDiff } from "./ai.js";
 
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
 
// helper reutilizable para peticiones a Github
async function githubRequest(method, url, data = {}) {
  try {
    const res = await axios({
      method,
      url,
      data,
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "mcp-code-review-bot",
      },
    });
    return res.data;
  } catch (err) {
    console.error(`❌ Error en request a GitHub (${method.toUpperCase()} ${url}):`, err.response?.data || err.message);
    throw err;
  }
}

// Función principal que maneja el Pull Request
export async function handlePullRequest(pr) {

   if (!pr) {
    console.error("❌ No se recibió un objeto Pull Request válido.");
    return;
  }

  const repoFull = pr.base.repo.full_name;
  const prNumber = pr.number;
  const diffUrl = pr.diff_url;

  console.log(`🔍 Analizando PR #${prNumber} de ${repoFull}`);

  try {
 
    // 1. Descargar el diff autenticado (importante para repos privados)
    const diffResp = await axios.get(diffUrl, {
      headers: {
        Accept: "application/vnd.github.v3.diff",
        Authorization: `token ${GITHUB_TOKEN}`,
      },
    });

    const diffText = diffResp.data;
    console.log(`📄 Diff descargado (${diffText.length} caracteres)`);
 
    // 2. Analizar el diff con la IA (Ollama)
    const suggestions = await analyzeDiff(diffText);
 
    if (!suggestions || suggestions.length === 0) {
      await postIssueComment(repoFull, prNumber, "✅ El MCP no encontró problemas evidentes.");
      return;
    }
 
    // 3. Construir el cuerpo del comentario
   let body = buildCommentBody(suggestions);

   // Publicar el comentario en el PR
    await postIssueComment(repoFull, prNumber, body);

    console.log("✅ Comentario publicado correctamente en el PR.");
  } catch (err) {
    console.error("❌ Error procesando Pull Request:", err.message || err);
    await safeComment(repoFull, prNumber, "⚠️ Error interno del MCP al analizar este PR.");
  }
}
 
// Construye el cuerpo Markdown del comentario
function buildCommentBody(suggestions) {
  if (!Array.isArray(suggestions) || suggestions.length === 0) {
    return "✅ **MCP Auto Review:** No se encontraron problemas evidentes en este Pull Request.";
  }

  let body = `### 🤖 MCP Auto Review — Sugerencias automáticas\n\n`;

  for (const s of suggestions) {
    const title = s.title || "Observación";
    const comment = s.comment || "Sin descripción.";
    const example = s.example ? `\n\`\`\`js\n${s.example}\n\`\`\`\n` : "";

    body += `#### ${title}\n${comment}${example}\n`;
  }

  return body;
}

// Envía comentario al PR
async function postIssueComment(repoFull, prNumber, body) {
  const url = `https://api.github.com/repos/${repoFull}/issues/${prNumber}/comments`;
  await githubRequest("post", url, { body });
}

// En caso de error, intenta publicar un comentario informativo
async function safeComment(repoFull, prNumber, message) {
  try {
    await postIssueComment(repoFull, prNumber, message);
  } catch {
    console.warn("⚠️ No se pudo publicar el comentario de error en el PR.");
  }
}