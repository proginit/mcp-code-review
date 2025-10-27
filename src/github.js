import axios from "axios";
import { analyzeDiff } from "./ai.js";
 
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
 
export async function handlePullRequest(pr) {
  try {
    const repoFull = pr.base.repo.full_name;
    const prNumber = pr.number;
    const diffUrl = pr.diff_url;
 
    console.log(`Analizando PR #${prNumber} de ${repoFull}`);
 
    // 1. Descargar diff
    const diffResp = await axios.get(diffUrl, {
      headers: { Accept: "application/vnd.github.v3.diff" }
    });
    const diffText = diffResp.data;
 
    // 2. Pasar el diff al modelo de IA
    const suggestions = await analyzeDiff(diffText);
 
    if (!suggestions || suggestions.length === 0) {
      await postIssueComment(repoFull, prNumber, "✅ El MCP no encontró problemas evidentes.");
      return;
    }
 
    // 3. Armar comentario
    let body = "🤖 **MCP Auto Review — Sugerencias automáticas**\n\n";
    for (const s of suggestions) {
      body += `- **${s.title || "Observación"}**: ${s.comment}\n`;
      if (s.example) body += `  - Ejemplo:\n\`\`\`\n${s.example}\n\`\`\`\n`;
      body += "\n";
    }
 
    await postIssueComment(repoFull, prNumber, body);
    console.log("✅ Comentarios publicados en el PR.");
  } catch (err) {
    console.error("❌ handlePullRequest error:", err.response?.data || err.message || err);
  }
}
 
async function postIssueComment(repoFull, prNumber, body) {
  const url = `https://api.github.com/repos/${repoFull}/issues/${prNumber}/comments`;
  await axios.post(url, { body }, {
    headers: {
      Authorization: `token ${process.env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json"
    }
  });
}