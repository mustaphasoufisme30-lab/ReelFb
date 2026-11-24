import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";

import fs from "fs";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: "150mb" }));
app.use(express.urlencoded({ limit: "150mb", extended: true }));
app.use(express.raw({ type: ["video/*", "application/octet-stream"], limit: "150mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

/**
 * Helper: Synthesize a complete 20.0-second 24kHz 16-bit mono WAV buffer in Node.js
 * Mixes background beat + scene transition SFX (whoosh, impact, ding, pop) + AI voiceovers
 */
function synthesizeReelAudioWav(
  durationSec: number,
  musicMood: string = "energetic",
  scenes: Array<{
    startTime: number;
    endTime: number;
    soundEffect?: string;
    audioUrl?: string;
  }> = []
): Buffer {
  const sampleRate = 24000;
  const numSamples = Math.floor(durationSec * sampleRate);
  const mix = new Float32Array(numSamples);

  // 1. Synthesize Background Rhythm / Beat across 20 seconds
  if (musicMood !== "minimal") {
    const bpm = musicMood === "lofi" ? 88 : musicMood === "dramatic" ? 105 : 122;
    const stepDur = 60 / bpm / 4; // 16th note duration in seconds
    const totalSteps = Math.floor(durationSec / stepDur);

    for (let step = 0; step < totalSteps; step++) {
      const startSample = Math.floor(step * stepDur * sampleRate);
      const isKick = step % 4 === 0;
      const isSnare = step % 8 === 4;
      const isHat = step % 2 === 1;

      if (isKick) {
        const kickLen = Math.floor(0.14 * sampleRate);
        for (let i = 0; i < kickLen && startSample + i < numSamples; i++) {
          const t = i / sampleRate;
          const freq = 130 * Math.exp(-t * 24) + 42;
          const env = Math.exp(-t * 18) * 0.22;
          mix[startSample + i] += Math.sin(2 * Math.PI * freq * t) * env;
        }
      }

      if (isSnare) {
        const snareLen = Math.floor(0.08 * sampleRate);
        for (let i = 0; i < snareLen && startSample + i < numSamples; i++) {
          const t = i / sampleRate;
          const env = Math.exp(-t * 35) * 0.1;
          const noise = Math.sin(i * 12.9898) * 43758.5453;
          const rand = (noise - Math.floor(noise)) * 2 - 1;
          mix[startSample + i] += rand * env;
        }
      }

      if (isHat) {
        const hatLen = Math.floor(0.03 * sampleRate);
        for (let i = 0; i < hatLen && startSample + i < numSamples; i++) {
          const t = i / sampleRate;
          const env = Math.exp(-t * 80) * 0.04;
          const noise = Math.sin(i * 78.233) * 43758.5453;
          const rand = (noise - Math.floor(noise)) * 2 - 1;
          mix[startSample + i] += rand * env;
        }
      }
    }
  }

  // 2. Synthesize Scene Transition Sound FX (at 0s, 3s, 8s, 15s)
  for (const scene of scenes) {
    const startSample = Math.max(0, Math.floor((scene.startTime || 0) * sampleRate));
    const sfx = scene.soundEffect || "whoosh";

    if (sfx === "whoosh") {
      const len = Math.floor(0.32 * sampleRate);
      for (let i = 0; i < len && startSample + i < numSamples; i++) {
        const t = i / sampleRate;
        const env = Math.sin((Math.PI * i) / len) * 0.25;
        const freq = 280 + 900 * Math.sin((Math.PI * i) / len);
        mix[startSample + i] += Math.sin(2 * Math.PI * freq * t) * env;
      }
    } else if (sfx === "impact") {
      const len = Math.floor(0.45 * sampleRate);
      for (let i = 0; i < len && startSample + i < numSamples; i++) {
        const t = i / sampleRate;
        const freq = 110 * Math.exp(-t * 10) + 35;
        const env = Math.exp(-t * 7) * 0.38;
        mix[startSample + i] += Math.sin(2 * Math.PI * freq * t) * env;
      }
    } else if (sfx === "ding") {
      const len = Math.floor(0.55 * sampleRate);
      for (let i = 0; i < len && startSample + i < numSamples; i++) {
        const t = i / sampleRate;
        const env = Math.exp(-t * 6) * 0.25;
        mix[startSample + i] +=
          (Math.sin(2 * Math.PI * 1318.5 * t) + 0.5 * Math.sin(2 * Math.PI * 2637 * t)) *
          env;
      }
    } else if (sfx === "pop") {
      const len = Math.floor(0.1 * sampleRate);
      for (let i = 0; i < len && startSample + i < numSamples; i++) {
        const t = i / sampleRate;
        const freq = 750 * Math.exp(-t * 22) + 180;
        const env = Math.exp(-t * 25) * 0.35;
        mix[startSample + i] += Math.sin(2 * Math.PI * freq * t) * env;
      }
    }

    // 3. Mix AI Voiceover WAV if present on the scene (24kHz 16-bit mono WAV)
    if (scene.audioUrl && scene.audioUrl.startsWith("data:audio/")) {
      try {
        const base64Part = scene.audioUrl.split(",")[1];
        if (base64Part) {
          const wavBuf = Buffer.from(base64Part, "base64");
          // Skip 44-byte RIFF WAV header
          if (wavBuf.length > 44) {
            const pcmSamples = Math.floor((wavBuf.length - 44) / 2);
            const maxSceneSamples = Math.floor(
              ((scene.endTime || 20) - (scene.startTime || 0)) * sampleRate
            );
            const samplesToCopy = Math.min(pcmSamples, maxSceneSamples);
            for (let i = 0; i < samplesToCopy && startSample + i < numSamples; i++) {
              const int16 = wavBuf.readInt16LE(44 + i * 2);
              mix[startSample + i] += (int16 / 32768.0) * 0.85;
            }
          }
        }
      } catch (e) {
        // ignore malformed audioUrl
      }
    }
  }

  // 4. Encode Float32 mix into 44-byte RIFF WAV header + Int16 PCM
  const dataByteLen = numSamples * 2;
  const wavBuffer = Buffer.alloc(44 + dataByteLen);

  wavBuffer.write("RIFF", 0);
  wavBuffer.writeUInt32LE(36 + dataByteLen, 4);
  wavBuffer.write("WAVE", 8);
  wavBuffer.write("fmt ", 12);
  wavBuffer.writeUInt32LE(16, 16); // PCM chunk size
  wavBuffer.writeUInt16LE(1, 20); // PCM format = 1
  wavBuffer.writeUInt16LE(1, 22); // Mono = 1 channel
  wavBuffer.writeUInt32LE(sampleRate, 24);
  wavBuffer.writeUInt32LE(sampleRate * 2, 28); // Byte rate
  wavBuffer.writeUInt16LE(2, 32); // Block align
  wavBuffer.writeUInt16LE(16, 34); // Bits per sample
  wavBuffer.write("data", 36);
  wavBuffer.writeUInt32LE(dataByteLen, 40);

  for (let i = 0; i < numSamples; i++) {
    const clamped = Math.max(-1, Math.min(1, mix[i]));
    const val = clamped < 0 ? clamped * 32768 : clamped * 32767;
    wavBuffer.writeInt16LE(Math.round(val), 44 + i * 2);
  }

  return wavBuffer;
}

// Endpoint 1: Deterministic Frame-by-Frame 20s MP4 Compiler (Guarantees all 4 scenes on mobile & desktop)
app.post("/api/compile-frames-mp4", async (req, res) => {
  const {
    frames,
    fps = 5,
    musicMood = "energetic",
    scenes = [],
    filename = "reel-facebook-20s.mp4",
  } = req.body || {};

  if (!Array.isArray(frames) || frames.length === 0) {
    return res.status(400).json({ error: "Aucune image reçue pour la compilation MP4." });
  }

  const id = Date.now() + "_" + Math.random().toString(36).substring(7);
  const workDir = path.join("/tmp", `reel_compile_${id}`);
  const audioPath = path.join(workDir, "audio.wav");
  const outputPath = path.join(workDir, "output.mp4");

  try {
    await fs.promises.mkdir(workDir, { recursive: true });

    // 1. Write all rendered JPEG frames to disk in sequence
    for (let i = 0; i < frames.length; i++) {
      const frameData = frames[i];
      const base64Str = frameData.includes(",") ? frameData.split(",")[1] : frameData;
      const framePath = path.join(workDir, `frame_${String(i).padStart(4, "0")}.jpg`);
      await fs.promises.writeFile(framePath, Buffer.from(base64Str, "base64"));
    }

    // 2. Synthesize 20-second audio track (beat + SFX + voiceovers)
    const wavBuffer = synthesizeReelAudioWav(20.0, musicMood, scenes);
    await fs.promises.writeFile(audioPath, wavBuffer);

    // 3. Encode universal H.264 + AAC MP4 at 30 FPS (720x1280) with faststart for mobile gallery
    await execAsync(
      `ffmpeg -y -framerate ${Number(fps) || 5} -i "${workDir}/frame_%04d.jpg" -i "${audioPath}" -vf "fps=30,scale=720:1280:flags=lanczos,format=yuv420p" -c:v libx264 -preset veryfast -crf 22 -pix_fmt yuv420p -c:a aac -b:a 128k -t 20 -shortest -movflags +faststart "${outputPath}"`
    );

    const mp4Buffer = await fs.promises.readFile(outputPath);
    res.setHeader("Content-Type", "video/mp4");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(filename)}"`
    );
    res.send(mp4Buffer);
  } catch (err: any) {
    console.error("FFmpeg frame compilation error:", err);
    res.status(500).json({
      error: "Erreur lors de la compilation MP4: " + (err.message || "Erreur inconnue"),
    });
  } finally {
    try {
      if (fs.existsSync(workDir)) {
        await fs.promises.rm(workDir, { recursive: true, force: true });
      }
    } catch (e) {
      // ignore cleanup errors
    }
  }
});

// Endpoint 2: Convert recorded video stream to standard universal MP4
app.post("/api/convert-to-mp4", async (req, res) => {
  let buffer: Buffer | null = null;
  let filename = (req.query.filename as string) || "reel-facebook-20s.mp4";

  if (Buffer.isBuffer(req.body) && req.body.length > 0) {
    buffer = req.body;
  } else if (req.body && req.body.videoBase64) {
    buffer = Buffer.from(req.body.videoBase64, "base64");
    if (req.body.filename) filename = req.body.filename;
  }

  if (!buffer || buffer.length === 0) {
    return res.status(400).json({ error: "Flux vidéo manquant pour la conversion." });
  }

  const id = Date.now() + "_" + Math.random().toString(36).substring(7);
  const inputPath = path.join("/tmp", `input_${id}.webm`);
  const outputPath = path.join("/tmp", `output_${id}.mp4`);

  try {
    await fs.promises.writeFile(inputPath, buffer);

    await execAsync(
      `ffmpeg -y -i "${inputPath}" -c:v libx264 -preset veryfast -crf 23 -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart "${outputPath}"`
    );

    const mp4Buffer = await fs.promises.readFile(outputPath);
    res.setHeader("Content-Type", "video/mp4");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(filename)}"`
    );
    res.send(mp4Buffer);
  } catch (err: any) {
    console.error("FFmpeg MP4 conversion error:", err);
    res.status(500).json({ error: "Erreur lors de la conversion MP4: " + err.message });
  } finally {
    try {
      if (fs.existsSync(inputPath)) await fs.promises.unlink(inputPath);
      if (fs.existsSync(outputPath)) await fs.promises.unlink(outputPath);
    } catch (e) {
      // ignore cleanup errors
    }
  }
});

// Helper: Dynamically initialize GoogleGenAI with validated API key
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

function isAuthError(err: any): boolean {
  const status = err?.status || err?.code;
  const msg = String(err?.message || "");
  return (
    status === 401 ||
    status === 403 ||
    msg.includes("API key not valid") ||
    msg.includes("UNAUTHENTICATED") ||
    msg.includes("API_KEY_INVALID") ||
    msg.includes("PERMISSION_DENIED") ||
    msg.includes("ACCESS_TOKEN_TYPE_UNSUPPORTED")
  );
}

function isQuotaError(err: any): boolean {
  const status = err?.status || err?.code;
  const msg = String(err?.message || "");
  return status === 429 || msg.includes("RESOURCE_EXHAUSTED");
}

function isTransientError(err: any): boolean {
  const status = Number(err?.status || err?.code);
  const msg = String(err?.message || "");
  return (
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504 ||
    msg.includes("UNAVAILABLE") ||
    msg.includes("DEADLINE_EXCEEDED") ||
    msg.includes("fetch failed") ||
    msg.includes("ETIMEDOUT") ||
    msg.includes("ECONNRESET")
  );
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("DEADLINE_EXCEEDED: Timeout")), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timer!);
  }
}

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 1): Promise<T> {
  let lastErr: any;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await withTimeout(fn(), 14000);
    } catch (err: any) {
      lastErr = err;
      const isTimeout = String(err?.message || "").includes("DEADLINE_EXCEEDED");
      if (attempt < maxRetries && !isTimeout && isTransientError(err)) {
        const delayMs = 600 * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

function parseJsonResponse(rawText?: string): any {
  const cleaned = (rawText || "{}")
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  return JSON.parse(cleaned || "{}");
}

const VALID_THEMES = new Set(["electric", "sunset", "dark-luxe", "emerald", "crimson", "cyber"]);
const VALID_SFX = new Set(["whoosh", "ding", "pop", "impact", "none"]);

// Endpoint: Generate complete 20-second Facebook Reel breakdown
app.post("/api/generate-reel", async (req, res) => {
  try {
    const {
      idea,
      tone = "viral",
      targetAudience = "Grand public",
      language = "français",
      visualStyle = "cyber",
    } = req.body || {};

    if (!idea || typeof idea !== "string" || !idea.trim()) {
      return res.status(400).json({ error: "L'idée de texte est requise." });
    }

    const isArabicLang =
      language === "arabe" || language === "ar" || /[\u0600-\u06FF]/.test(idea);

    const ai = getAiClient();
    if (!ai) {
      return res.status(503).json({
        error: isArabicLang
          ? "مفتاح Gemini API غير مُعدّ. يرجى التحقق من Settings > Secrets."
          : "Clé API Gemini non configurée. Veuillez vérifier Settings > Secrets.",
      });
    }

    const systemInstruction = `Tu es le meilleur expert mondial en création de Réels Facebook courts et viraux de EXACTEMENT 20 secondes.
Sur Facebook, la rétention chute après 3 secondes si l'accroche n'est pas explosive.
Tu dois découper l'idée fournie en EXACTEMENT 4 scènes consécutives pour atteindre un total parfait de 20 secondes :
- Scène 1 (0 à 3s) : L'ACCROCHE (Hook ultra percutant, pattern interrupt, question choc ou affirmation contre-intuitive).
- Scène 2 (3 à 8s) : LA TENSION / PROBLÈME (Explique pourquoi 99% des gens se trompent ou la douleur ressentie).
- Scène 3 (8 à 15s) : LA SOLUTION / VALEUR (2 ou 3 pépites concrètes, ultra directes, faciles à retenir).
- Scène 4 (15 à 20s) : L'APPEL À L'ACTION & BOUCLE (CTA fort : 'Enregistre ce réel', 'Commente INFO', et transition qui donne envie de revoir le début).

Règles impératives :
1. Le texte parlé (narration) doit être calibré pour le timing exact de chaque scène à un rythme dynamique (environ 2,5 à 3 mots par seconde).
2. L'overlayTitle doit être très court (3 à 6 mots percutants en majuscules pour les sous-titres visuels).
3. Langue : Rédige TOUS les champs (title, narration, overlayTitle, overlaySubtitle, badge, fbPostCaption, hashtags) impérativement en ${
      isArabicLang
        ? "ARABE (العربية الفصحى الحديثة والمؤثرة pour Facebook Reels avec hashtags en arabe)"
        : language
    }.
4. Si la langue est l'arabe, utilise des tournures virales percutantes comme : 'توقف عن هذا فوراً !', 'السر الذي يخفونه عنك', 'قاعدة ذهبية في 20 ثانية', 'احفظ هذا الفيديو الآن'.
5. Génère également le texte du post Facebook optimisé avec emojis, appel au partage et hashtags populaires.`;

    const prompt = `Crée un Réel Facebook de 20 secondes à partir de cette idée : "${idea}".
Langue demandée : ${isArabicLang ? "Arabe (العربية)" : language}
Ton : ${tone}
Audience cible : ${targetAudience}
Style visuel : ${visualStyle}`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        title: {
          type: Type.STRING,
          description: "Titre percutant du Réel Facebook",
        },
        hookRating: {
          type: Type.STRING,
          description: "Score de l'accroche (ex: 'A+ Explosif')",
        },
        viralityScore: {
          type: Type.INTEGER,
          description: "Score de potentiel viral de 1 à 100",
        },
        retentionTip: {
          type: Type.STRING,
          description: "Conseil clé pour maximiser la rétention sur Facebook",
        },
        recommendedBgmTrack: {
          type: Type.STRING,
          description:
            "Ambiance musicale recommandée (ex: 'Électro Hype', 'Lofi Chill', 'Suspense Beat')",
        },
        fbPostCaption: {
          type: Type.STRING,
          description: "Texte complet du post Facebook avec emojis et saut de lignes",
        },
        hashtags: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "5 à 8 hashtags viraux Facebook",
        },
        scenes: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              order: { type: Type.INTEGER },
              phase: {
                type: Type.STRING,
                description: "hook | problem | solution | cta",
              },
              phaseLabel: { type: Type.STRING },
              startTime: { type: Type.NUMBER },
              endTime: { type: Type.NUMBER },
              duration: { type: Type.NUMBER },
              narration: {
                type: Type.STRING,
                description: "Script exact prononcé par la voix off",
              },
              overlayTitle: {
                type: Type.STRING,
                description: "Titre principal court affiché à l'écran en gros",
              },
              overlaySubtitle: {
                type: Type.STRING,
                description: "Texte secondaire ou sous-titre clé",
              },
              badge: {
                type: Type.STRING,
                description:
                  "Sticker ou badge textuel (ex: '🚨 ATTENTION', '💡 ASTUCE', '👇 AGIS')",
              },
              soundEffect: {
                type: Type.STRING,
                description: "whoosh | ding | pop | impact",
              },
              visualTheme: {
                type: Type.STRING,
                description: "cyber | sunset | dark-luxe | electric | emerald | crimson",
              },
            },
            required: [
              "order",
              "phase",
              "phaseLabel",
              "startTime",
              "endTime",
              "duration",
              "narration",
              "overlayTitle",
              "overlaySubtitle",
              "badge",
              "soundEffect",
              "visualTheme",
            ],
          },
        },
      },
      required: [
        "title",
        "hookRating",
        "viralityScore",
        "retentionTip",
        "recommendedBgmTrack",
        "fbPostCaption",
        "hashtags",
        "scenes",
      ],
    };

    let response;
    try {
      response = await withRetry(() =>
        ai.models.generateContent({
          model: "gemini-4-hydrogen",
          contents: prompt,
          config: {
            systemInstruction,
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            responseMimeType: "application/json",
            responseSchema,
          },
        })
      );
    } catch (primaryErr: any) {
      if (isAuthError(primaryErr)) throw primaryErr;
      console.warn("Primary model failed, retrying with gemini-3.1-flash-lite:", primaryErr?.message || primaryErr);
      response = await withTimeout(
        ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: prompt,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema,
          },
        }),
        20000
      );
    }

    const parsedData = parseJsonResponse(response.text);

    // Guarantee exact 4 scenes spanning 0-3s, 3-8s, 8-15s, 15-20s
    const defaultTimings = [
      { start: 0, end: 3, duration: 3, phase: "hook", label: isArabicLang ? "المقدمة الخاطفة (0-3 ث)" : "L'Accroche (0-3s)" },
      { start: 3, end: 8, duration: 5, phase: "problem", label: isArabicLang ? "المشكلة الكبرى (3-8 ث)" : "Le Problème (3-8s)" },
      { start: 8, end: 15, duration: 7, phase: "solution", label: isArabicLang ? "الحل الذكي (8-15 ث)" : "La Solution (8-15s)" },
      { start: 15, end: 20, duration: 5, phase: "cta", label: isArabicLang ? "الدعوة للتفاعل (15-20 ث)" : "L'Appel à l'Action (15-20s)" },
    ];

    const rawScenes = Array.isArray(parsedData.scenes) ? parsedData.scenes : [];
    if (rawScenes.length === 0) {
      throw new Error("Réponse IA incomplète (aucune scène générée).");
    }
    const adjustedScenes = defaultTimings.map((timing, idx) => {
      const scene = rawScenes[idx] || {};
      const defaultSfx = idx === 0 ? "whoosh" : idx === 1 ? "impact" : idx === 2 ? "ding" : "pop";
      const defaultTheme = idx === 0 ? "crimson" : idx === 1 ? "dark-luxe" : idx === 2 ? "emerald" : "electric";
      return {
        id: `scene-${idx + 1}-${Date.now()}`,
        order: idx + 1,
        phase: timing.phase,
        phaseLabel: scene.phaseLabel || timing.label,
        startTime: timing.start,
        endTime: timing.end,
        duration: timing.duration,
        narration: scene.narration || "",
        overlayTitle: scene.overlayTitle || "",
        overlaySubtitle: scene.overlaySubtitle || "",
        badge: scene.badge || (isArabicLang ? "🔥 نصيحة" : "🔥 ASTUCE"),
        soundEffect: VALID_SFX.has(scene.soundEffect) ? scene.soundEffect : defaultSfx,
        visualTheme: VALID_THEMES.has(scene.visualTheme) ? scene.visualTheme : defaultTheme,
      };
    });

    const normalizedHashtags = Array.isArray(parsedData.hashtags) && parsedData.hashtags.length > 0
      ? parsedData.hashtags
          .map((tag: string) => {
            const clean = String(tag || "").trim();
            if (!clean) return "";
            return clean.startsWith("#") ? clean : `#${clean}`;
          })
          .filter(Boolean)
      : isArabicLang
        ? ["#ريلز_فيسبوك", "#ريلز", "#فيسبوك", "#نصائح_سريعة"]
        : ["#ReelsFacebook", "#AstuceDuJour", "#Viral", "#FacebookReels"];

    const result = {
      id: `reel-${Date.now()}`,
      title: parsedData.title || (isArabicLang ? "ريل فيسبوك 20 ثانية" : "Réel Facebook 20s"),
      idea,
      tone,
      language: isArabicLang ? "arabe" : language,
      hookRating: parsedData.hookRating || (isArabicLang ? "A+ فيروسي" : "A+ Viral"),
      viralityScore: Number(parsedData.viralityScore) || 94,
      retentionTip:
        parsedData.retentionTip ||
        (isArabicLang
          ? "أول 3 ثوانٍ تحدد 80% من مشاهدات الريل على فيسبوك."
          : "Les premières 3 secondes déterminent 80% des vues sur Facebook."),
      recommendedBgmTrack: parsedData.recommendedBgmTrack || "Électro Hype Beat",
      fbPostCaption:
        parsedData.fbPostCaption ||
        `${parsedData.title}\n\nRegarde jusqu'à la fin ! 💡\n\nPartage avec un ami qui en a besoin. 👇`,
      hashtags: normalizedHashtags,
      scenes: adjustedScenes,
      subtitleStyle: "hormozi",
      musicMood: "energetic",
    };

    res.json(result);
  } catch (error: any) {
    console.error("Error generating reel:", error?.message || error);
    const isArabicLang =
      req.body?.language === "arabe" ||
      req.body?.language === "ar" ||
      /[\u0600-\u06FF]/.test(String(req.body?.idea || ""));

    if (isAuthError(error)) {
      return res.status(401).json({
        error: isArabicLang
          ? "مفتاح Gemini API غير صالح. يرجى التحقق منه في Settings > Secrets."
          : "Clé API Gemini invalide. Veuillez vérifier votre clé dans Settings > Secrets.",
      });
    }
    if (isQuotaError(error)) {
      return res.status(429).json({
        error: isArabicLang
          ? "تم تجاوز الحد المسموح به مؤقتاً. يرجى المحاولة بعد قليل."
          : "Quota Gemini temporairement atteint. Veuillez réessayer dans quelques instants.",
      });
    }
    res.status(502).json({
      error: isArabicLang
        ? "تعذر الاتصال بخدمة الذكاء الاصطناعي حالياً. يرجى المحاولة مجدداً."
        : "Impossible de générer le Réel pour le moment. Veuillez réessayer.",
    });
  }
});

// Endpoint: Generate TTS voiceover with gemini-3.8-flash-lite-tts
app.post("/api/generate-voiceover", async (req, res) => {
  try {
    const { text, voiceName = "Fenrir" } = req.body;

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

    res.json({
      audioBase64: base64Audio,
      mimeType: "audio/wav",
    });
  } catch (err: any) {
    if (isAuthError(err)) {
      console.warn("Gemini TTS key unavailable or invalid; falling back to browser speech.");
    } else {
      console.warn("TTS generation fallback:", err?.message || err);
    }
    res.status(503).json({
      error: "Synthèse vocale du navigateur activée.",
      fallbackToBrowser: true,
    });
  }
});

// Endpoint: Refine a single scene (e.g., make punchier, change hook, shorten)
app.post("/api/refine-scene", async (req, res) => {
  try {
    const { currentScene, instruction } = req.body || {};

    const ai = getAiClient();
    if (!ai) {
      return res.status(503).json({
        error: "Clé API Gemini non configurée. Veuillez vérifier Settings > Secrets.",
      });
    }

    const response = await withRetry(() =>
      ai.models.generateContent({
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
      })
    );

    const refined = parseJsonResponse(response.text);
    res.json({
      ...currentScene,
      ...refined,
      soundEffect: VALID_SFX.has(refined.soundEffect) ? refined.soundEffect : currentScene.soundEffect,
    });
  } catch (error: any) {
    console.warn("Error refining scene:", error?.message || error);
    if (isAuthError(error)) {
      return res.status(401).json({
        error: "Clé API Gemini invalide. Veuillez vérifier Settings > Secrets.",
      });
    }
    res.status(502).json({ error: error?.message || "Erreur d'optimisation" });
  }
});

// Always return JSON errors for /api routes (never HTML or raw objects)
app.use("/api", (err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status = Number(err?.status || err?.statusCode) || 500;
  const msg = typeof err?.message === "string" && err.message ? err.message : "Erreur interne du serveur.";
  res.status(status).json({ error: msg });
});

// Vite integration
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
    app.get("*", (_req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
