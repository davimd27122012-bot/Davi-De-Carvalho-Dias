import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import express, { Request, Response } from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

function getGenAIClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "A chave GEMINI_API_KEY não foi encontrada nas variáveis de ambiente. Por favor, configure-a no painel de Secrets do AI Studio."
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Available working models with quota fallback
const MODEL_CASCADE = [
  "gemini-3.5-flash",
  "gemini-flash-lite-latest",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
];

// Live web search function using DuckDuckGo HTML scraper
interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
}

async function searchWeb(query: string): Promise<WebSearchResult[]> {
  try {
    const cleanQuery = query.slice(0, 200).trim();
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(cleanQuery)}`;
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml",
      },
    });

    if (!response.ok) return [];
    const html = await response.text();
    const results: WebSearchResult[] = [];

    const linkRegex = /<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
    const snippetRegex = /<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;

    const links: { url: string; title: string }[] = [];
    let linkMatch;

    while ((linkMatch = linkRegex.exec(html)) !== null && links.length < 5) {
      let rawUrl = linkMatch[1];
      const uddgMatch = rawUrl.match(/uddg=([^&]+)/);
      if (uddgMatch) {
        rawUrl = decodeURIComponent(uddgMatch[1]);
      }
      const title = linkMatch[2].replace(/<[^>]+>/g, "").trim();
      if (title && rawUrl.startsWith("http")) {
        links.push({ url: rawUrl, title });
      }
    }

    let snippetMatch;
    let i = 0;
    while ((snippetMatch = snippetRegex.exec(html)) !== null && i < links.length) {
      const snippet = snippetMatch[1].replace(/<[^>]+>/g, "").trim();
      results.push({
        title: links[i].title,
        url: links[i].url,
        snippet,
      });
      i++;
    }

    return results;
  } catch (err) {
    console.error("Erro ao pesquisar na web:", err);
    return [];
  }
}

// Memory extraction heuristic for auto-personalization
function extractPotentialMemory(userText: string): string | null {
  const lower = userText.toLowerCase();

  // Guard against sensitive/private data
  if (
    lower.includes("senha") ||
    lower.includes("cartão") ||
    lower.includes("cartao") ||
    lower.includes("cpf") ||
    lower.includes("rg") ||
    lower.includes("cvv") ||
    lower.includes("banco")
  ) {
    return null;
  }

  // Name patterns
  const nameMatch = userText.match(
    /(?:meu nome é|me chamo|pode me chamar de)\s+([A-ZÀ-Úa-zà-ú\s]{2,25})/i
  );
  if (nameMatch && nameMatch[1]) {
    return `O usuário se chama ${nameMatch[1].trim()}`;
  }

  // Profession / Role patterns
  const roleMatch = userText.match(
    /(?:eu trabalho como|eu sou|minha profissão é|atuo como)\s+([A-ZÀ-Úa-zà-ú\s]{3,35})/i
  );
  if (roleMatch && roleMatch[1]) {
    const role = roleMatch[1].trim();
    if (!["um", "uma", "o", "a", "muito", "bem"].includes(role.toLowerCase())) {
      return `O usuário atua como ${role}`;
    }
  }

  // Preference patterns
  const prefMatch = userText.match(
    /(?:eu gosto de|minha preferência é|prefiro)\s+([A-ZÀ-Úa-zà-ú0-9\s]{3,45})/i
  );
  if (prefMatch && prefMatch[1]) {
    return `Preferência do usuário: ${prefMatch[1].trim()}`;
  }

  return null;
}

// Reminder extraction helper
function extractPotentialReminder(userText: string): { title: string; datetime?: string } | null {
  const lower = userText.toLowerCase();
  if (
    lower.includes("me lembre") ||
    lower.includes("crie um lembrete") ||
    lower.includes("lembrar de") ||
    lower.includes("me avise")
  ) {
    const clean = userText
      .replace(/me lembre|crie um lembrete|lembrar de|me avise|por favor/gi, "")
      .trim();
    if (clean.length > 3) {
      return { title: clean };
    }
  }
  return null;
}

// Multi-turn message sanitizer ensuring alternating user/model turns and valid parts
function sanitizeContents(messages: any[]): any[] {
  const sanitized: any[] = [];

  for (const msg of messages) {
    const role = msg.role === "model" ? "model" : "user";
    const parts: any[] = [];

    // Attachments (images, videos, audio, documents, pdf)
    if (Array.isArray(msg.attachments) && msg.attachments.length > 0) {
      for (const att of msg.attachments) {
        if (att.data && att.mimeType) {
          parts.push({
            inlineData: {
              data: att.data,
              mimeType: att.mimeType,
            },
          });
        }
      }
    }

    if (typeof msg.content === "string" && msg.content.trim().length > 0) {
      parts.push({ text: msg.content.trim() });
    }

    if (parts.length === 0) continue;

    // Merge consecutive turns with the same role
    if (sanitized.length > 0 && sanitized[sanitized.length - 1].role === role) {
      sanitized[sanitized.length - 1].parts.push(...parts);
    } else {
      sanitized.push({ role, parts });
    }
  }

  // Ensure conversation begins with a 'user' turn
  while (sanitized.length > 0 && sanitized[0].role !== "user") {
    sanitized.shift();
  }

  return sanitized;
}

// Health check endpoint
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    appName: "voxxl",
    hasApiKey: !!process.env.GEMINI_API_KEY,
    models: MODEL_CASCADE,
  });
});

// Chat stream endpoint using Server-Sent Events (SSE) with robust fallback
app.post("/api/chat/stream", async (req: Request, res: Response) => {
  try {
    const {
      messages,
      systemInstruction,
      temperature = 0.7,
      thinkingMode = "fast",
      customMemories = [],
      webSearchEnabled = true,
      projectContext,
      workspaceMode = "personal",
    } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Nenhuma mensagem fornecida." });
    }

    const lastMessage = messages[messages.length - 1];
    const lastContent =
      typeof lastMessage?.content === "string" ? lastMessage.content : "";

    // Disable TCP delay for instant streaming
    req.socket.setNoDelay(true);

    // Setup SSE response headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders?.();

    // Check if web search should be triggered
    let groundingSources: WebSearchResult[] = [];
    const lowerContent = lastContent.toLowerCase();
    const needsSearch =
      webSearchEnabled &&
      (lowerContent.includes("pesquise") ||
        lowerContent.includes("procure") ||
        lowerContent.includes("no site") ||
        lowerContent.includes("eleição") ||
        lowerContent.includes("eleições") ||
        lowerContent.includes("candidatos") ||
        lowerContent.includes("quem é o atual") ||
        lowerContent.includes("notícia") ||
        lowerContent.includes("notícias") ||
        lowerContent.includes("últimas novidades") ||
        lowerContent.includes("preço") ||
        lowerContent.includes("tempo hoje") ||
        lowerContent.includes("resultado de") ||
        lowerContent.includes("http://") ||
        lowerContent.includes("https://"));

    if (needsSearch) {
      const searchQuery = lastContent
        .replace(/pesquise|procure|no site|busque|por favor|me diga/gi, "")
        .trim();
      groundingSources = await searchWeb(searchQuery || lastContent);
      if (groundingSources.length > 0) {
        res.write(`data: ${JSON.stringify({ groundingSources })}\n\n`);
      }
    }

    // Auto-extract memory if applicable
    const autoExtracted = extractPotentialMemory(lastContent);
    if (autoExtracted) {
      res.write(`data: ${JSON.stringify({ autoMemory: autoExtracted })}\n\n`);
    }

    // Auto-extract reminder if requested
    const potentialReminder = extractPotentialReminder(lastContent);
    if (potentialReminder) {
      res.write(`data: ${JSON.stringify({ reminderSuggestion: potentialReminder })}\n\n`);
    }

    const ai = getGenAIClient();
    const formattedContents = sanitizeContents(messages);

    if (formattedContents.length === 0) {
      res.write(
        `data: ${JSON.stringify({
          text: "Olá! Como posso ajudar você agora?",
        })}\n\n`
      );
      res.write("data: [DONE]\n\n");
      return res.end();
    }

    let finalSystemInstruction =
      systemInstruction ||
      "Você é o Voxxl, um assistente de inteligência artificial conversacional moderno, inteligente e prestativo. Responda em Português com clareza, sinceridade, raciocínio lógico e formatação Markdown impecável. Se e SOMENTE se perguntado expressamente sobre quem te criou, diga que foi Davi Dias (Davi De Carvalho Dias); nunca mencione isso espontaneamente.";

    // Append Project Context if in a Project
    if (projectContext) {
      finalSystemInstruction += `\n\n[CONTEXTO DO PROJETO ATUAL: ${projectContext.name}]:\n${projectContext.description || ""}\nInstruções específicas do projeto:\n${projectContext.systemInstruction || ""}`;
    }

    // Append Neutrality Directive
    finalSystemInstruction += `\n\n[DIRETRIZ DE NEUTRALIDADE ABSOLUTA]:
- Você é neutro e imparcial: NÃO tem partido político, NÃO tem time de futebol e NÃO tem religião.
- Diante de questões de política, esportes ou crenças, apresente visões com respeito, objetividade e equilíbrio, sem escolher um lado.`;

    // Append Workspace Mode (Pessoal vs Empresarial)
    if (workspaceMode === "business") {
      finalSystemInstruction += `\n\n[MODO EMPRESARIAL / PROFISSIONAL ATIVO]:
- Adote postura executiva, séria, objetiva e estruturada.
- Foque em eficiência profissional, dados acionáveis, precisão técnica e métricas corporativas.`;
    } else {
      finalSystemInstruction += `\n\n[MODO PESSOAL ATIVO]:
- Adote tom conversacional, caloroso, amigável e colaborativo ("eu e você").
- Ideal para rotina diária, ideias, estudos e conversas naturais.`;
    }

    // Append User Memories if any
    if (Array.isArray(customMemories) && customMemories.length > 0) {
      finalSystemInstruction +=
        "\n\n[MEMÓRIAS E PREFERÊNCIAS DO USUÁRIO]:\n" +
        customMemories.map((m: string) => `- ${m}`).join("\n");
    }

    // Append Web Search Grounding Context if found
    if (groundingSources.length > 0) {
      finalSystemInstruction +=
        "\n\n[INFORMAÇÕES EM TEMPO REAL PESQUISADAS NA WEB]:\n" +
        groundingSources
          .map(
            (g, idx) =>
              `${idx + 1}. Título: ${g.title}\n   URL: ${g.url}\n   Resumo: ${g.snippet}`
          )
          .join("\n\n") +
        "\nUtilize essas informações recentes para responder de forma precisa.";
    }

    // Model Waterfall Fallback Execution
    let success = false;
    let lastError: any = null;

    for (const modelName of MODEL_CASCADE) {
      try {
        const config: any = {
          systemInstruction: finalSystemInstruction,
          temperature: Math.min(Math.max(temperature, 0), 2),
        };

        // If fast thinking mode on supported models
        if (thinkingMode === "fast") {
          config.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
        }

        const responseStream = await ai.models.generateContentStream({
          model: modelName,
          contents: formattedContents,
          config,
        });

        for await (const chunk of responseStream) {
          const text = chunk.text;
          if (text) {
            res.write(`data: ${JSON.stringify({ text })}\n\n`);
            if (typeof (res as any).flush === "function") {
              (res as any).flush();
            }
          }
        }

        success = true;
        break;
      } catch (err: any) {
        console.warn(`Tentativa com modelo ${modelName} falhou:`, err?.message?.slice(0, 100));
        lastError = err;
        // Continue to next model in cascade
      }
    }

    if (!success) {
      throw lastError || new Error("Todos os modelos de IA falharam no momento.");
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error: any) {
    console.error("Erro na API de Chat:", error);
    const errorMessage =
      error?.message || "Ocorreu um erro ao processar a resposta da IA.";

    if (!res.headersSent) {
      res.status(500).json({ error: errorMessage });
    } else {
      res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
      res.end();
    }
  }
});

// High quality Image Generation endpoint with Flux and Prompt Enhancer
app.post("/api/image/generate", async (req: Request, res: Response) => {
  try {
    const { prompt, width = 1024, height = 1024 } = req.body;
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Prompt de imagem não fornecido." });
    }

    const cleanPrompt = prompt.trim().slice(0, 400);
    // Add quality enhancement tags if not present
    let enhancedPrompt = cleanPrompt;
    if (!cleanPrompt.includes("8k") && !cleanPrompt.includes("photorealistic")) {
      enhancedPrompt = `${cleanPrompt}, 8k resolution, cinematic lighting, highly detailed, photorealistic studio photography, masterpiece, sharp focus`;
    }

    const seed = Math.floor(Math.random() * 1000000);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
      enhancedPrompt
    )}?model=flux&width=${width}&height=${height}&seed=${seed}&nologo=true`;

    res.json({
      success: true,
      imageUrl,
      prompt: cleanPrompt,
      width,
      height,
    });
  } catch (error: any) {
    console.error("Erro ao gerar imagem:", error);
    res.status(500).json({ error: "Erro ao gerar imagem em alta qualidade." });
  }
});

// Title generation endpoint for naming conversations automatically
app.post("/api/chat/title", async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt não fornecido" });
    }

    const ai = getGenAIClient();
    let title = "Nova Conversa";

    for (const modelName of MODEL_CASCADE) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: `Gere um título curto (máximo de 3 a 5 palavras), direto e descritivo em português para uma conversa que inicia com: "${prompt.slice(
            0,
            250
          )}". Responda APENAS com o título, sem aspas, sem pontuação.`,
        });
        if (response.text?.trim()) {
          title = response.text.trim();
          break;
        }
      } catch {
        // try next
      }
    }

    res.json({ title });
  } catch (error: any) {
    console.error("Erro ao gerar título:", error);
    res.json({ title: "Nova Conversa" });
  }
});

// Text-to-Speech (TTS) endpoint
app.post("/api/tts", async (req: Request, res: Response) => {
  try {
    const { text, voice = "Kore" } = req.body;
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Texto não fornecido para síntese de voz." });
    }

    const cleanText = text
      .replace(/```[\s\S]*?```/g, " [código omitido no áudio] ")
      .replace(/[#*_`~>]/g, "")
      .slice(0, 600);

    const ai = getGenAIClient();
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash-lite-tts",
      contents: [
        {
          role: "user",
          parts: [{ text: cleanText }],
        },
      ],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    });

    const base64Audio =
      response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      return res
        .status(500)
        .json({ error: "Não foi possível gerar áudio para este texto." });
    }

    res.json({
      audio: `data:audio/wav;base64,${base64Audio}`,
    });
  } catch (error: any) {
    console.error("Erro no TTS:", error);
    res.status(500).json({
      error: error?.message || "Erro ao sintetizar áudio com a IA.",
    });
  }
});

// Mount Vite or static server
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor rodando em http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Falha ao iniciar servidor:", err);
});
