import axios from "axios";
import { analyzeDiff } from "./ai.js";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

export async function handlePullRequest(pr) {
  try {
    const repoFull = pr.base.repo.full_name;
    const prNumber = pr.number;
    const diffUrl = pr.diff_url;

    console.log(`🔎 Analizando PR #${prNumber} de ${repoFull}`);

    // 1️⃣ Descargar diff
    const diffResp = await axios.get(diffUrl, {
      headers: { Accept: "application/vnd.github.v3.diff" },
    });
    const diffText = diffResp.data;

    // 2️⃣ Pasar el diff al modelo IA
    const suggestions = await analyzeDiff(diffText);

    if (!suggestions || suggestions.length === 0) {
      await postIssueComment(
        repoFull,
        prNumber,
        "✅ El MCP no encontró problemas evidentes."
      );
      return;
    }

    // 3️⃣ Armar comentario
    let body = "🤖 **MCP Auto Review — Sugerencias automáticas**\n\n";

    for (const s of suggestions) {
      const tipo = s.tipo || "💡 Observación";
      const titulo = s.titulo || s.title || "Sugerencia";
      const comentario = s.comentario || s.comment || "";
      const ejemplo = s.ejemplo || s.example || "";

      // Encabezado
      body += `${tipo} **${titulo}**\n`;
      body += `${comentario}\n\n`;

      // Ejemplo (si existe)
      if (ejemplo && ejemplo.trim()) {
        body += `🧩 **Ejemplo de mejora:**\n`;
        body += `\`\`\`js\n${ejemplo.trim()}\n\`\`\`\n\n`;
      }

      body += "---\n\n"; // línea separadora entre observaciones
    }

    await postIssueComment(repoFull, prNumber, body);
    console.log("✅ Comentarios publicados en el PR.");
  } catch (err) {
    console.error(
      "❌ handlePullRequest error:",
      err.response?.data || err.message || err
    );
  }
}

async function postIssueComment(repoFull, prNumber, body) {
  const url = `https://api.github.com/repos/${repoFull}/issues/${prNumber}/comments`;
  await axios.post(
    url,
    { body },
    {
      headers: {
        Authorization: `token ${process.env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
      },
    }
  );
}
