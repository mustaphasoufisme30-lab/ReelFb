export default function handler(_req: any, res: any) {
  return res.status(200).json({
    ok: true,
    hasGeminiKey: Boolean((process.env.GEMINI_API_KEY || "").trim()),
  });
}
