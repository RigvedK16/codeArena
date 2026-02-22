const express = require("express");

const { GoogleGenerativeAI } = require("@google/generative-ai");

const router = express.Router();

const SYSTEM_PROMPT =
  "You are an elite Senior Software Engineer conducting a strict code review. Evaluate the provided code purely for readability, naming conventions, modularity, and cleanliness. Return ONLY a valid JSON object with EXACTLY two keys: 'score' (an integer from 0 to 100, where <50 is poor, 50-79 is okay, 80+ is excellent) and 'feedback' (A short, 2-3 sentence paragraph. If the score is high, praise their clean habits. If the score is low, strictly criticize the unreadable parts and suggest specific improvements). Do not include markdown formatting like ```json.";

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

    if (!Number.isFinite(score) || score < 0 || score > 100 || !feedback) {
      return res.status(502).json({
        success: false,
        message: "Gemini JSON did not match the expected schema",
        raw: parsed,
      });
    }

    // Return ONLY the parsed JSON object with EXACTLY two keys.
    return res.status(200).json({ score, feedback });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to analyze code",
    });
  }
});

module.exports = router;
