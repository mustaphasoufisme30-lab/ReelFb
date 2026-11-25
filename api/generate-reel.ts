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

function parseJsonResponse(rawText?: string): any {
  const cleaned = (rawText || "{}")
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  return JSON.parse(cleaned || "{}");
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

const VALID_THEMES = new Set(["electric", "sunset", "dark-luxe", "emerald", "crimson", "cyber"]);
const VALID_SFX = new Set(["whoosh", "ding", "pop", "impact", "none"]);

export default async function handler(req: any, res: any) {
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée. Utilisez POST." });
  }

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: "Corps JSON invalide." });
    }
  }

  const {
    idea,
    tone = "viral",
    targetAudience = "Grand public",
    language = "français",
    visualStyle = "cyber",
  } = body || {};

  if (!idea || typeof idea !== "string" || !idea.trim()) {
    return res.status(400).json({ error: "L'idée de texte est requise." });
  }

  const isArabicLang =
    language === "arabe" || language === "ar" || /[\u0600-\u06FF]/.test(idea);

  const ai = getAiClient();
  if (!ai) {
    return res.status(503).json({
      error: isArabicLang
        ? "مفتاح Gemini API غير مُعدّ في متغيرات البيئة (GEMINI_API_KEY)."
        : "Clé API Gemini non configurée dans les variables d'environnement (GEMINI_API_KEY).",
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
      title: { type: Type.STRING, description: "Titre percutant du Réel Facebook" },
      hookRating: { type: Type.STRING, description: "Score de l'accroche (ex: 'A+ Explosif')" },
      viralityScore: { type: Type.INTEGER, description: "Score de potentiel viral de 1 à 100" },
      retentionTip: { type: Type.STRING, description: "Conseil clé pour maximiser la rétention sur Facebook" },
      recommendedBgmTrack: { type: Type.STRING, description: "Ambiance musicale recommandée" },
      fbPostCaption: { type: Type.STRING, description: "Texte complet du post Facebook avec emojis et saut de lignes" },
      hashtags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "5 à 8 hashtags viraux Facebook" },
      scenes: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            order: { type: Type.INTEGER },
            phase: { type: Type.STRING, description: "hook | problem | solution | cta" },
            phaseLabel: { type: Type.STRING },
            startTime: { type: Type.NUMBER },
            endTime: { type: Type.NUMBER },
            duration: { type: Type.NUMBER },
            narration: { type: Type.STRING },
            overlayTitle: { type: Type.STRING },
            overlaySubtitle: { type: Type.STRING },
            badge: { type: Type.STRING },
            soundEffect: { type: Type.STRING, description: "whoosh | ding | pop | impact" },
            visualTheme: { type: Type.STRING, description: "cyber | sunset | dark-luxe | electric | emerald | crimson" },
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

  try {
    let response;
    try {
      response = await withTimeout(
        ai.models.generateContent({
          model: "gemini-4-hydrogen",
          contents: prompt,
          config: {
            systemInstruction,
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            responseMimeType: "application/json",
            responseSchema,
          },
        }),
        14000
      );
    } catch (primaryErr: any) {
      if (isAuthError(primaryErr)) throw primaryErr;
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
        14000
      );
    }

    const parsedData = parseJsonResponse(response.text);
    const defaultTimings = [
      { start: 0, end: 3, duration: 3, phase: "hook", label: isArabicLang ? "المقدمة الخاطفة (0-3 ث)" : "L'Accroche (0-3s)" },
      { start: 3, end: 8, duration: 5, phase: "problem", label: isArabicLang ? "المشكلة الكبرى (3-8 ث)" : "Le Problème (3-8s)" },
      { start: 8, end: 15, duration: 7, phase: "solution", label: isArabicLang ? "الحل الذكي (8-15 ث)" : "La Solution (8-15s)" },
      { start: 15, end: 20, duration: 5, phase: "cta", label: isArabicLang ? "الدعوة للتفاعل (15-20 ث)" : "L'Appel à l'Action (15-20s)" },
    ];

    const rawScenes = Array.isArray(parsedData.scenes) ? parsedData.scenes : [];
    if (rawScenes.length === 0) {
      throw new Error("Réponse IA incomplète.");
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

    const normalizedHashtags =
      Array.isArray(parsedData.hashtags) && parsedData.hashtags.length > 0
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

    return res.status(200).json({
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
    });
  } catch (error: any) {
    console.error("Error generating reel (serverless):", error?.message || error);
    if (isAuthError(error)) {
      return res.status(401).json({
        error: isArabicLang
          ? "مفتاح Gemini API غير صالح. يرجى التحقق من GEMINI_API_KEY."
          : "Clé API Gemini invalide. Veuillez vérifier GEMINI_API_KEY.",
      });
    }
    if (isQuotaError(error)) {
      return res.status(429).json({
        error: isArabicLang
          ? "تم تجاوز الحد المسموح به مؤقتاً. يرجى المحاولة بعد قليل."
          : "Quota Gemini temporairement atteint. Veuillez réessayer dans quelques instants.",
      });
    }
    return res.status(502).json({
      error: isArabicLang
        ? "تعذر الاتصال بخدمة الذكاء الاصطناعي حالياً. يرجى المحاولة مجدداً."
        : "Impossible de générer le Réel pour le moment. Veuillez réessayer.",
    });
  }
}
