import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";

function getAiClient(): GoogleGenAI | null {
  const rawKey = (process.env.GEMINI_API_KEY || "").trim().replace(/^["']|["']$/g, "");
  if (!rawKey || rawKey === "MY_GEMINI_API_KEY" || rawKey.length < 10) {
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

  try {
    const response = await ai.models.generateContent({
      model: "gemini-4-hydrogen",
      contents: `Réécris cette scène de Réel Facebook (${currentScene.duration} secondes) selon cette consigne : "${
        instruction || "Rends-la plus percutante"
      }".
Scène actuelle :
- Narration : "${currentScene.narration}"
- Titre écran : "${currentScene.overlayTitle}"
- Sous-titre écran : "${currentScene.overlaySubtitle}"
- Badge : "${currentScene.badge}"`,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            narration: { type: Type.STRING },
            overlayTitle: { type: Type.STRING },
            overlaySubtitle: { type: Type.STRING },
            badge: { type: Type.STRING },
            soundEffect: { type: Type.STRING },
          },
          required: ["narration", "overlayTitle", "overlaySubtitle", "badge", "soundEffect"],
        },
      },
    });

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
