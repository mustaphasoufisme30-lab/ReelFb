import { GoogleGenAI } from "@google/genai";

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

  const { text, voiceName = "Fenrir" } = body || {};
  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "Texte requis pour la voix off." });
  }

  const ai = getAiClient();
  if (!ai) {
    return res.status(503).json({
      error: "Synthèse vocale du navigateur activée.",
      fallbackToBrowser: true,
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash-lite-tts",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: text.slice(0, 300),
              speechMetadata: {
                style: "Energetic and charismatic social media video narrator",
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: ["Puck", "Charon", "Kore", "Fenrir", "Zephyr"].includes(voiceName)
                ? voiceName
                : "Fenrir",
            },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      return res.status(500).json({ error: "Échec de la génération audio." });
    }

    return res.status(200).json({
      audioBase64: base64Audio,
      mimeType: "audio/wav",
    });
  } catch (err: any) {
    console.warn("TTS generation fallback (serverless):", err?.message || err);
    return res.status(503).json({
      error: "Synthèse vocale du navigateur activée.",
      fallbackToBrowser: true,
    });
  }
}
