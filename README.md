# 🤖 MCP Code Review

**MCP Code Review** analiza automáticamente los *Pull Requests* de GitHub usando un modelo local de IA con **[Ollama](https://ollama.ai/)**.

Cuando alguien crea o actualiza un PR, el bot descarga el `diff`, lo analiza con IA y publica un comentario con sugerencias de mejoras basadas en **Clean Code**, **SOLID** y buenas prácticas.

---

## 🚀 Características

- Analiza automáticamente los cambios en un Pull Request.
- Comenta sugerencias directamente en GitHub.
- Funciona con modelos locales (por ejemplo, `llama3:latest` en Ollama).
- Código modular y extensible.
- Sin dependencia de servicios externos.

---

## 🛠️ Requisitos previos

- Node.js 18+
- [Ollama instalado](https://ollama.ai/download)
- Token personal de GitHub con permiso `repo`

---

## ⚙️ Instalación

1. Clona el repositorio:

   ```bash
   git clone https://github.com/tuusuario/mcp-code-review.git
   cd mcp-code-review
2. Instala las dependencias:
   ```bash
   npm install
3. Crea un archivo .env en la raíz (basado en .env.example):
    ```bash
    GITHUB_TOKEN=ghp_tu_token_aqui
    PORT=3000
    OLLAMA_HOST=http://localhost:11434
    OLLAMA_MODEL=llama3:latest
4. Inicia el servidor:
    ```bash
    npm run dev

## 🔗 Configurar Webhook en GitHub
1. En tu repositorio, ve a Settings → Webhooks → Add webhook.
2. En Payload URL, coloca la URL pública de tu servidor (por ejemplo, generada con [ngrok](https://ngrok.com/)):
    ```bash
    https://<tu_ngrok_id>.ngrok.io/webhook
3. En Content type, elige application/json.
4. En Which events would you like to trigger this webhook?

    Selecciona:
    - “Let me select individual events”
    - “Pull requests”
5. Guarda el webhook.

## Estructura del proyecto
```bash
src/
├── index.js        # Servidor Express y Webhook handler
├── github.js       # Comunicación con GitHub API
└── ai.js           # Análisis de código con Ollama