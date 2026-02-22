const express = require("express");

const { GoogleGenerativeAI } = require("@google/generative-ai");

const router = express.Router();

const SYSTEM_PROMPT =
  "You are an elite Senior Software Engineer conducting a strict code review. Evaluate the provided code purely for readability, naming conventions, modularity, and cleanliness. Return ONLY a valid JSON object with EXACTLY three keys: 'score' (an integer 0-100), 'feedback' (a short 2-3 sentence paragraph), and 'deductions' (an array of 0-6 objects, each with: 'points' (an integer 1-25) and 'reason' (a concise sentence describing what hurt readability)). If the code is excellent and close to 100, deductions can be empty. Do not include markdown formatting like ```json.";

function sanitizeDeductions(raw) {
  if (!Array.isArray(raw)) return [];
  const cleaned = [];
  for (const item of raw) {
    const points = Number.parseInt(item?.points, 10);
    const reason = typeof item?.reason === "string" ? item.reason.trim() : "";
    if (!Number.isFinite(points) || points <= 0) continue;
    if (!reason) continue;
    cleaned.push({ points: Math.min(Math.max(points, 1), 25), reason });
    if (cleaned.length >= 6) break;
  }
  return cleaned;
}

router.post("/analyze", async (req, res) => {
  try {
    const { code, language } = req.body || {};

    if (typeof code !== "string" || !code.trim()) {
      return res.status(400).json({
        success: false,
        message: "code (string) is required",
      });
    }

    if (typeof language !== "string" || !language.trim()) {
      return res.status(400).json({
        success: false,
        message: "language (string) is required",
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: "GEMINI_API_KEY is not set on the server",
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-flash-latest",
      systemInstruction: SYSTEM_PROMPT,
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const prompt = `Language: ${language}\n\nCode:\n${code}`;

    const result = await model.generateContent(prompt);
    const rawText = result?.response?.text?.() ?? "";

    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch (parseError) {
      return res.status(502).json({
        success: false,
        message: "Gemini returned invalid JSON",
        error: parseError?.message || String(parseError),
        raw: rawText,
      });
    }

    const score = Number.parseInt(parsed?.score, 10);
    const feedback = typeof parsed?.feedback === "string" ? parsed.feedback.trim() : "";
    const deductions = sanitizeDeductions(parsed?.deductions);

    if (!Number.isFinite(score) || score < 0 || score > 100 || !feedback) {
      return res.status(502).json({
        success: false,
        message: "Gemini JSON did not match the expected schema",
        raw: parsed,
      });
    }

    return res.status(200).json({ score, feedback, deductions });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to analyze code",
    });
  }
});

module.exports = router;
