export default function handler(_req: any, res: any) {
  const hasGeminiKey = Boolean(
    (
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.API_KEY ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
      process.env.VITE_GEMINI_API_KEY ||
      ""
    ).trim()
  );
  return res.status(200).json({
    ok: true,
    hasGeminiKey,
  });
}
