import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";

function resolveGeminiApiKey(): string {
  const candidates = [
    process.env.GEMINI_API_KEY,
    process.env.GOOGLE_API_KEY,
    process.env.API_KEY,
    process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    process.env.VITE_GEMINI_API_KEY,
  ];
  for (const candidate of candidates) {
    if (!candidate) continue;
    const cleaned = String(candidate)
      .trim()
      .replace(/^(?:GEMINI_API_KEY|GOOGLE_API_KEY|API_KEY)\s*=\s*/i, "")
      .replace(/^["']+|["']+$/g, "")
      .replace(/\s+/g, "");
    if (cleaned && cleaned !== "MY_GEMINI_API_KEY" && cleaned.length >= 10) {
      return cleaned;
    }
  }
  return "";
}

function getAiClient(): GoogleGenAI | null {
  const rawKey = resolveGeminiApiKey();
  if (!rawKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey: rawKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

function parseJsonResponse(rawText?: string): any {
  const cleaned = (rawText || "{}")
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  return JSON.parse(cleaned || "{}");
}

const VALID_SFX = new Set(["whoosh", "ding", "pop", "impact", "none"]);

export default async function handler(req: any, res: any) {
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée." });
  }

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: "Corps JSON invalide." });
    }
  }

  const { currentScene, instruction } = body || {};
  if (!currentScene) {
    return res.status(400).json({ error: "Scène manquante." });
  }

  const ai = getAiClient();
  if (!ai) {
    return res.status(503).json({
      error: "Clé API Gemini non configurée (GEMINI_API_KEY).",
    });
  }

  const refinePrompt = `Réécris cette scène de Réel Facebook (${currentScene.duration} secondes) selon cette consigne : "${
    instruction || "Rends-la plus percutante"
  }".
Scène actuelle :
- Narration : "${currentScene.narration}"
- Titre écran : "${currentScene.overlayTitle}"
- Sous-titre écran : "${currentScene.overlaySubtitle}"
- Badge : "${currentScene.badge}"`;

  const refineSchema = {
    type: Type.OBJECT,
    properties: {
      narration: { type: Type.STRING },
      overlayTitle: { type: Type.STRING },
      overlaySubtitle: { type: Type.STRING },
      badge: { type: Type.STRING },
      soundEffect: { type: Type.STRING },
    },
    required: ["narration", "overlayTitle", "overlaySubtitle", "badge", "soundEffect"],
  };

  try {
    let response;
    try {
      response = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: refinePrompt,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: "application/json",
          responseSchema: refineSchema,
        },
      });
    } catch {
      response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: refinePrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: refineSchema,
        },
      });
    }

    const refined = parseJsonResponse(response.text);
    return res.status(200).json({
      ...currentScene,
      ...refined,
      soundEffect: VALID_SFX.has(refined.soundEffect) ? refined.soundEffect : currentScene.soundEffect,
    });
  } catch (error: any) {
    console.warn("Error refining scene (serverless):", error?.message || error);
    return res.status(502).json({ error: "Erreur lors de l'optimisation de la scène." });
  }
}
