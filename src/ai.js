import axios from "axios";

const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://127.0.0.1:11434";

export async function analyzeDiff(diffText) {
  const prompt = `
Eres un revisor de código experto en buenas prácticas, mantenibilidad y Clean Code.
Analiza el siguiente diff de un Pull Request y devuelve tus sugerencias en **español**, 
de manera clara y concisa.

👉 Tu salida DEBE SER solo un **array JSON** (sin texto adicional), con el siguiente formato:

[
  {
    "tipo": "💡 Mejora" | "⚠️ Posible error" | "🧹 Limpieza de código" | "✅ Buenas prácticas",
    "titulo": "Título breve del problema o mejora (en español)",
    "comentario": "Descripción clara del problema y por qué debería corregirse (en español)",
    "ejemplo": "Ejemplo de cómo se podría mejorar el código (opcional)"
  }
]

El campo "tipo" indica la naturaleza del comentario.

Si no hay observaciones, devuelve [].

DIFF:
${diffText}
`;

  try {
    const resp = await axios.post(
      `${OLLAMA_HOST}/api/generate`,
      {
        model: "llama3:latest",
        prompt,
        max_tokens: 800,
        format: "json",
        stream: false,
      },
      { timeout: 120000 }
    );

    const text =
      resp.data?.response || resp.data?.content || JSON.stringify(resp.data);
    const jsonStart = text.indexOf("[");
    const jsonEnd = text.lastIndexOf("]");

    if (jsonStart >= 0 && jsonEnd >= 0) {
      return JSON.parse(text.slice(jsonStart, jsonEnd + 1));
    } else {
      return [{ title: "Análisis (texto)", comment: text }];
    }
  } catch (err) {
    console.error("⚠️ Error llamando a Ollama:", err.message || err);
    return [
      {
        title: "Error",
        comment: "No fue posible analizar el diff con el modelo local.",
      },
    ];
  }
}
