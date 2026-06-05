/**
 * Gemini-based design analysis logic.
 *
 * Extracted from src/app/api/analyze-design/route.ts.
 */

import { retryWithBackoff } from "@/lib/api/retry";
import { sanitizeError } from "@/lib/api/sanitize";
import { cleanGeminiJson } from "@/lib/gemini";
import { takeScreenshot, MOBILE_VIEWPORT, DESKTOP_VIEWPORT } from "@/lib/screenshot";

// ── Constants ──────────────────────────────────────────────────────────────────

const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// ── Types ──────────────────────────────────────────────────────────────────────

export type DesignCriterion = "modernity" | "readability" | "cta" | "hierarchy" | "trust";

export type DesignIssue = {
  title: string;
  detail: string;
  point_deduction: number;
  impact: "High" | "Medium" | "Low";
};

export type GeminiDesignResponse = {
  design_score: number;
  criteria_scores: Record<DesignCriterion, number>;
  issues: DesignIssue[];
};

export type StrategyResult = {
  status: "ok" | "error";
  design_score?: number;
  criteria_scores?: Record<DesignCriterion, number>;
  issues?: DesignIssue[];
  raw_analysis?: GeminiDesignResponse;
  error?: string;
};

// ── Prompt ─────────────────────────────────────────────────────────────────────

export const CRITIQUE_PROMPT = `You are a senior web designer evaluating a small business website screenshot for a redesign sales pitch. Analyze this screenshot critically but fairly. Score these five criteria 1-10 (10=excellent): modernity (how current vs dated it looks), readability (text legibility, contrast, fonts on this viewport), cta (presence/clarity of calls-to-action like contact/book/buy/call), hierarchy (visual organization, clutter, whitespace), trust (professionalism and credibility). Then compute an overall design_score 0-100. Then list 3 to 5 specific, concrete design issues a business owner would understand. For EACH issue provide: a short 'title' (3-6 words), a one-sentence 'detail' explaining what you see, a 'point_deduction' (integer 1-30, your estimate of how many points this issue deducts from a perfect 100), and an 'impact' rating ("High", "Medium", or "Low"). The top issues should roughly explain the gap to the actual design_score. Respond ONLY with valid JSON, no markdown, exactly: {"design_score": <int 0-100>, "criteria_scores": {"modernity": <1-10>, "readability": <1-10>, "cta": <1-10>, "hierarchy": <1-10>, "trust": <1-10>}, "issues": [{"title": "...", "detail": "...", "point_deduction": <int>, "impact": "High"|"Medium"|"Low"}]}`;

// ── Gemini analysis ────────────────────────────────────────────────────────────

/** Send a screenshot to Gemini for design critique. */
export async function analyzeScreenshot(
  base64Image: string,
  apiKey: string,
): Promise<{ ok: true; data: GeminiDesignResponse } | { ok: false; error: string; status: number | null; rawText?: string }> {
  try {
    const response = await retryWithBackoff(
      (signal) =>
        fetch(GEMINI_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { inline_data: { mime_type: "image/png", data: base64Image } },
                  { text: CRITIQUE_PROMPT },
                ],
              },
            ],
          }),
          signal,
        }),
    );

    console.log("[DESIGN] Gemini HTTP status:", response.status);

    const rawText = await response.text();
    // Log Gemini response length (not content) for monitoring
    console.log("[DESIGN] Gemini response received, length:", rawText?.length);

    if (!response.ok) {
      if (response.status === 429 || response.status === 503) {
        return { ok: false, error: "AI_SERVICE_BUSY", status: response.status, rawText: undefined };
      }
      // Truncate raw error text in responses to avoid leaking AI output
      const truncated = rawText ? rawText.slice(0, 200) : "Unknown AI error";
      return { ok: false, error: truncated, status: response.status, rawText: undefined };
    }

    const parsed = JSON.parse(rawText);
    const text =
      parsed?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    if (!text) {
      return { ok: false, error: "Gemini returned empty text", status: response.status, rawText };
    }

    // Debug: log raw Gemini text content before cleaning + parsing
    // Only log full Gemini text content in development to avoid leaking AI output
    if (process.env.NODE_ENV !== 'production') {
      console.error('[DESIGN] RAW GEMINI TEXT CONTENT:', JSON.stringify(text))
    }
    console.error('[DESIGN] RAW GEMINI TEXT CONTENT LENGTH:', text?.length)

    // Clean and extract valid JSON from Gemini's response (handles markdown fences
    // and trailing garbage after the closing `}`)
    let data: GeminiDesignResponse;
    try {
      const cleaned = cleanGeminiJson(text);
      if (process.env.NODE_ENV !== 'production') {
        console.error('[DESIGN] RAW GEMINI RESPONSE >>>', typeof cleaned, cleaned)
      }
      data = JSON.parse(cleaned) as GeminiDesignResponse;
    } catch {
      // Log raw Gemini content on parse failure only in development
      if (process.env.NODE_ENV !== 'production') {
        console.error("[DESIGN] JSON parse failed. Raw Gemini response:", text);
      } else {
        console.error("[DESIGN] JSON parse failed. Response length:", text?.length);
      }
      return { ok: false, error: "Gemini returned invalid JSON", status: response.status, rawText: text };
    }

    // Basic validation
    if (
      typeof data.design_score !== "number" ||
      !data.criteria_scores ||
      !Array.isArray(data.issues)
    ) {
      if (process.env.NODE_ENV !== 'production') {
        console.log("[DESIGN] Gemini response missing required fields:", JSON.stringify(data));
      } else {
        console.log("[DESIGN] Gemini response missing required fields");
      }
      return { ok: false, error: "Gemini response missing required fields", status: response.status, rawText: text };
    }

    return { ok: true, data };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message, status: null };
  }
}

// ── Strategy runner ────────────────────────────────────────────────────────────

/** Run the full screenshot + analysis pipeline for one strategy. */
export async function runStrategy(
  strategy: "mobile" | "desktop",
  website: string,
  screenshotKey: string,
  geminiKey: string,
): Promise<StrategyResult> {
  const viewport = strategy === "mobile" ? MOBILE_VIEWPORT : DESKTOP_VIEWPORT;

  console.log(`[DESIGN] Starting ${strategy} analysis for:`, website);

  // 1. Screenshot
  const screenshot = await takeScreenshot(website, viewport, screenshotKey);
  if (!screenshot.ok) {
    console.log(`[DESIGN] ${strategy} screenshot failed:`, screenshot.error);
    return { status: "error", error: sanitizeError(screenshot.error) };
  }
  console.log(`[DESIGN] ${strategy} screenshot OK (${Math.round(screenshot.base64.length / 1024)} KB base64)`);

  // 2. Gemini analysis
  const analysis = await analyzeScreenshot(screenshot.base64, geminiKey);
  if (!analysis.ok) {
    console.log(`[DESIGN] ${strategy} Gemini analysis failed:`, analysis.error);
    if (analysis.error === "AI_SERVICE_BUSY") {
      return { status: "error", error: "AI_SERVICE_BUSY" };
    }
    return { status: "error", error: `Analysis failed: ${analysis.error}` };
  }
  console.log(`[DESIGN] ${strategy} Gemini analysis OK — score:`, analysis.data.design_score);

  return {
    status: "ok",
    design_score: analysis.data.design_score,
    criteria_scores: analysis.data.criteria_scores,
    issues: analysis.data.issues,
    raw_analysis: analysis.data,
  };
}
