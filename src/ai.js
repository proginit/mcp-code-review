import axios from "axios";

const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://127.0.0.1:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3:latest";

/**
 * Analiza el diff de un Pull Request usando un modelo local de Ollama.
 * Devuelve un array JSON de observaciones [{ title, comment, example }]
 */
export async function analyzeDiff(diffText) {
  if (!diffText || diffText.trim().length === 0) {
    return [
      {
        title: "Sin contenido",
        comment: "El diff está vacío o no fue leído correctamente.",
      },
    ];
  }

  const prompt = `
Eres un revisor de código experto en principios de Clean Code, SOLID y buenas prácticas.
Analiza el siguiente diff de código y devuelve una lista JSON de observaciones.
Cada elemento debe tener este formato:
[
  {
    "title": "Título breve del problema",
    "comment": "Descripción del problema o mejora",
    "example": "Ejemplo opcional de cómo mejorar el código"
  }
]
Si no hay observaciones, devuelve [].

DIFF:
${diffText}
`;

  try {
    console.log(`🧠 Enviando diff al modelo ${OLLAMA_MODEL}...`);
    const resp = await axios.post(
      `${OLLAMA_HOST}/api/generate`,
      {
        model: OLLAMA_MODEL,
        prompt,
        format: "json",
        stream: false,
        options: { temperature: 0.3, max_tokens: 800 },
      },
      { timeout: 60000 }
    );

    // Manejo flexible del formato devuelto por Ollama
    const text =
      resp.data?.response || resp.data?.content || JSON.stringify(resp.data);
    const parsed = tryParseSuggestions(text);
    console.log(
      `✅ Análisis completado (${parsed.length} sugerencias encontradas)`
    );

    return parsed;
  } catch (err) {
    console.error("❌ Error llamando a Ollama:", err.message || err);
    return [
      {
        title: "Error de análisis",
        comment:
          "No fue posible analizar el diff con el modelo local. Verifica si Ollama está corriendo.",
      },
    ];
  }
}

/**
 * Intenta parsear el texto recibido como JSON válido de sugerencias.
 */
function tryParseSuggestions(text) {
  try {
    // Buscar el bloque JSON más probable
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch)
      throw new Error("No se encontró estructura JSON en la respuesta.");
    const suggestions = JSON.parse(jsonMatch[0]);

    // Validar que sea un array con estructura esperada
    if (Array.isArray(suggestions)) {
      return suggestions.map((s) => ({
        title: s.title || "Observación",
        comment: s.comment || "Sin comentario.",
        example: s.example || null,
      }));
    }
    throw new Error("Formato inesperado en respuesta JSON.");
  } catch (parseErr) {
    console.warn("⚠️ Respuesta no estructurada, devolviendo texto plano.");
    return [{ title: "Análisis textual", comment: text.slice(0, 600) }];
  }
}
