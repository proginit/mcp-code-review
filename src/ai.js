import axios from "axios";
 
const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://127.0.0.1:11434";
 
export async function analyzeDiff(diffText) {
  const prompt = `
Eres un revisor de código experto en Clean Code y buenas prácticas.
Analiza este diff de Pull Request y devuelve una lista JSON de observaciones.
No incluyas texto explicativo, solo el array JSON.
Para cada observación, devuelve: { "title": "...", "comment": "...", "example": "optional code example" }.
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
 
    const text = resp.data?.response || resp.data?.content || JSON.stringify(resp.data);
    const jsonStart = text.indexOf("[");
    const jsonEnd = text.lastIndexOf("]");
    if (jsonStart >= 0 && jsonEnd >= 0) {
      return JSON.parse(text.slice(jsonStart, jsonEnd + 1));
    } else {
      return [{ title: "Análisis (texto)", comment: text }];
    }
  } catch (err) {
    console.error("Error llamando a Ollama:", err.message || err);
    return [{ title: "Error", comment: "No fue posible analizar el diff con el modelo local." }];
  }
}