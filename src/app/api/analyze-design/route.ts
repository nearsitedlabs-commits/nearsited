import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// ── Constants ────────────────────────────────────────────────────────────────
const GEMINI_MODEL = "gemini-3.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const SCREENSHOT_ONE_URL = "https://api.screenshotone.com/take";

const MOBILE_VIEWPORT = { width: 390, height: 844 };
const DESKTOP_VIEWPORT = { width: 1440, height: 900 };

const SCREENSHOT_TIMEOUT_MS = 30_000;

const REQUEST_TIMEOUT_MS = 30_000;
const RETRY_DELAYS = [3_000, 8_000];

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Fetch a URL with automatic retry on HTTP 429 (rate limit) and 503 (overloaded).
 * Each attempt has a 30-second timeout. Retries use back-off delays from RETRY_DELAYS.
 * Non-retryable errors (400, 401, 500, AbortError, network errors) are surfaced immediately
 * without retry.
 */
async function retryWithBackoff(
  fetchFn: (signal: AbortSignal) => Promise<Response>,
): Promise<Response> {
  const maxAttempts = RETRY_DELAYS.length + 1;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetchFn(controller.signal);
      clearTimeout(timeoutId);

      if (response.status === 429 || response.status === 503) {
        if (attempt < maxAttempts) {
          const delay = RETRY_DELAYS[attempt - 1];
          console.log(
            `[DESIGN] Gemini ${response.status} retry attempt ${attempt} of ${maxAttempts - 1}`,
          );
          await sleep(delay);
          continue;
        }
        // Last attempt exhausted — return the response for the caller to handle
        console.log(
          `[DESIGN] Gemini ${response.status} — all ${maxAttempts - 1} retries exhausted`,
        );
        return response;
      }

      return response;
    } catch (err) {
      clearTimeout(timeoutId);
      // AbortError, network failure, etc. — surface immediately, no retry
      throw err;
    }
  }

  throw new Error("unreachable");
}

// ── Types ────────────────────────────────────────────────────────────────────
type DesignCriterion = "modernity" | "readability" | "cta" | "hierarchy" | "trust";

type DesignIssue = {
  title: string;
  detail: string;
  point_deduction: number;
  impact: "High" | "Medium" | "Low";
};

type GeminiDesignResponse = {
  design_score: number;
  criteria_scores: Record<DesignCriterion, number>;
  issues: DesignIssue[];
};

type StrategyResult = {
  status: "ok" | "error";
  design_score?: number;
  criteria_scores?: Record<DesignCriterion, number>;
  issues?: DesignIssue[];
  raw_analysis?: GeminiDesignResponse;
  error?: string;
};

type AnalyzeRequestBody = {
  businessId?: string;
  website: string;
  force?: boolean;
};

// ── Prompt ───────────────────────────────────────────────────────────────────
const CRITIQUE_PROMPT = `You are a senior web designer evaluating a small business website screenshot for a redesign sales pitch. Analyze this screenshot critically but fairly. Score these five criteria 1-10 (10=excellent): modernity (how current vs dated it looks), readability (text legibility, contrast, fonts on this viewport), cta (presence/clarity of calls-to-action like contact/book/buy/call), hierarchy (visual organization, clutter, whitespace), trust (professionalism and credibility). Then compute an overall design_score 0-100. Then list 3 to 5 specific, concrete design issues a business owner would understand. For EACH issue provide: a short 'title' (3-6 words), a one-sentence 'detail' explaining what you see, a 'point_deduction' (integer 1-30, your estimate of how many points this issue deducts from a perfect 100), and an 'impact' rating ("High", "Medium", or "Low"). The top issues should roughly explain the gap to the actual design_score. Respond ONLY with valid JSON, no markdown, exactly: {"design_score": <int 0-100>, "criteria_scores": {"modernity": <1-10>, "readability": <1-10>, "cta": <1-10>, "hierarchy": <1-10>, "trust": <1-10>}, "issues": [{"title": "...", "detail": "...", "point_deduction": <int>, "impact": "High"|"Medium"|"Low"}]}`;

// ── Streaming helpers ────────────────────────────────────────────────────────

/** Write an NDJSON line to the stream. */
function writeJson(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  data: unknown,
) {
  controller.enqueue(encoder.encode(JSON.stringify(data) + "\n"));
}

/** Write a progress step event. */
function writeStep(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  step: string,
  label: string,
) {
  writeJson(controller, encoder, { type: "progress", step, label });
}

/**
 * Clean a raw Gemini text response by removing markdown fences and extracting
 * only the first complete, balanced JSON object.  This guards against Gemini
 * returning trailing garbage after the closing `}` or wrapping the JSON in
 * ```json … ``` fences.
 */
const cleanGeminiJson = (raw: string): string => {
  // Remove ```json and ``` fences
  const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '')
  // Extract just the first complete JSON object — find opening { and its matching }
  const start = cleaned.indexOf('{')
  if (start === -1) throw new Error('No JSON object found in Gemini response')
  let depth = 0
  let end = -1
  for (let i = start; i < cleaned.length; i++) {
    if (cleaned[i] === '{') depth++
    if (cleaned[i] === '}') {
      depth--
      if (depth === 0) { end = i; break }
    }
  }
  if (end === -1) throw new Error('Unclosed JSON object in Gemini response')
  return cleaned.slice(start, end + 1)
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Take a full-page screenshot via ScreenshotOne and return base64-encoded PNG bytes. */
async function takeScreenshot(
  url: string,
  viewport: { width: number; height: number },
  accessKey: string,
): Promise<{ ok: true; base64: string } | { ok: false; error: string; status: number | null }> {
  const params = new URLSearchParams({
    url,
    access_key: accessKey,
    full_page: "true",
    viewport_width: String(viewport.width),
    viewport_height: String(viewport.height),
    format: "png",
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SCREENSHOT_TIMEOUT_MS);

  try {
    const response = await fetch(`${SCREENSHOT_ONE_URL}?${params}`, {
      signal: controller.signal,
    });

    console.log(
      `[DESIGN] ScreenshotOne (${viewport.width}w) HTTP status:`,
      response.status,
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      return { ok: false, error: errorText, status: response.status };
    }

    // ScreenshotOne can return HTTP 200 with {"is_successful": false, "error": "..."}
    // in the body when the screenshot fails (e.g. blocked page, unreachable site).
    // Check the Content-Type to detect JSON error payloads before treating the body as binary.
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json") || contentType.includes("text/")) {
      const bodyText = await response.text().catch(() => "");
      let isError = false;
      let errorMsg = "Screenshot unavailable";
      try {
        const json = JSON.parse(bodyText);
        if (json && json.is_successful === false) {
          isError = true;
          errorMsg = json.error
            ? `Screenshot unavailable: ${json.error}`
            : "Screenshot unavailable — the page could not be captured";
        }
      } catch {
        // Not JSON — treat response text as the error
        if (bodyText.length > 0 && bodyText.length < 500) {
          errorMsg = `Screenshot unavailable: ${bodyText}`;
          isError = true;
        }
      }
      if (isError) {
        console.log(`[DESIGN] ScreenshotOne (${viewport.width}w) returned error:`, errorMsg);
        return { ok: false, error: errorMsg, status: response.status };
      }
      // If we got here, it's not an error — it's a text-based response we can't use as an image
      return { ok: false, error: "Screenshot unavailable — unexpected response format", status: response.status };
    }

    const arrayBuffer = await response.arrayBuffer();

    // Verify the buffer is non-trivial (PNG has at least a few hundred bytes)
    if (arrayBuffer.byteLength < 100) {
      return { ok: false, error: "Screenshot unavailable — empty response", status: response.status };
    }

    const base64 = Buffer.from(arrayBuffer).toString("base64");
    return { ok: true, base64 };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const isAbort = err instanceof DOMException && err.name === "AbortError";
    return { ok: false, error: isAbort ? "Screenshot timed out" : message, status: null };
  } finally {
    clearTimeout(timeout);
  }
}

/** Send a screenshot to Gemini for design critique. */
async function analyzeScreenshot(
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
    console.log("[DESIGN] Gemini raw response:", rawText);

    if (!response.ok) {
      if (response.status === 429 || response.status === 503) {
        return { ok: false, error: "AI_SERVICE_BUSY", status: response.status, rawText };
      }
      return { ok: false, error: rawText, status: response.status, rawText };
    }

    // Debug: log raw Gemini API envelope before parsing
    console.error('[DESIGN] RAW GEMINI RESPONSE:', JSON.stringify(rawText))
    console.error('[DESIGN] RAW GEMINI RESPONSE LENGTH:', rawText?.length)
    console.error('[DESIGN] RAW GEMINI RESPONSE >>>', typeof rawText, rawText)

    const parsed = JSON.parse(rawText);
    const text =
      parsed?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    if (!text) {
      return { ok: false, error: "Gemini returned empty text", status: response.status, rawText };
    }

    // Debug: log raw Gemini text content before cleaning + parsing
    console.error('[DESIGN] RAW GEMINI TEXT CONTENT:', JSON.stringify(text))
    console.error('[DESIGN] RAW GEMINI TEXT CONTENT LENGTH:', text?.length)

    // Clean and extract valid JSON from Gemini's response (handles markdown fences
    // and trailing garbage after the closing `}`)
    let data: GeminiDesignResponse;
    try {
      const cleaned = cleanGeminiJson(text);
      console.error('[DESIGN] RAW GEMINI RESPONSE >>>', typeof cleaned, cleaned)
      data = JSON.parse(cleaned) as GeminiDesignResponse;
    } catch {
      console.error("[DESIGN] JSON parse failed. Raw Gemini response:", text);
      return { ok: false, error: "Gemini returned invalid JSON", status: response.status, rawText: text };
    }

    // Basic validation
    if (
      typeof data.design_score !== "number" ||
      !data.criteria_scores ||
      !Array.isArray(data.issues)
    ) {
      console.log("[DESIGN] Gemini response missing required fields:", JSON.stringify(data));
      return { ok: false, error: "Gemini response missing required fields", status: response.status, rawText: text };
    }

    return { ok: true, data };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message, status: null };
  }
}

/**
 * Sanitize an error string to avoid leaking raw API error JSON to the UI.
 * If the error looks like a JSON blob or contains sensitive technical details,
 * replace it with a user-friendly message.
 */
function sanitizeError(error: string): string {
  // If the error starts with { or [ it's likely raw JSON — replace it
  const trimmed = error.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return "Screenshot unavailable — the page could not be captured";
  }
  // If the error is very long it's likely a raw dump — truncate aggressively
  if (trimmed.length > 200) {
    return "Screenshot unavailable — an unexpected error occurred";
  }
  return trimmed;
}

/** Run the full screenshot + analysis pipeline for one strategy. Reserved for Playwright swap (v2). */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function runStrategy(
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

// ── Route ────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // 1. Parse & validate body
    const body = (await request.json()) as AnalyzeRequestBody;
    const { businessId, website, force = false } = body;

    // If businessId is provided, we'll persist results; otherwise run in
    // ephemeral mode (results displayed on screen but not saved to DB).
    const shouldPersist = Boolean(businessId);

    if (!website || typeof website !== "string" || !website.trim()) {
      return NextResponse.json(
        { error: "Website URL is required to analyze design. No-website businesses cannot be analyzed." },
        { status: 400 },
      );
    }

    const trimmedWebsite = website.trim();
    if (shouldPersist) {
      console.log("[DESIGN] Starting design analysis for business:", businessId, "website:", trimmedWebsite);
    } else {
      console.log("[DESIGN] Starting ephemeral design analysis (no businessId) for website:", trimmedWebsite);
    }

    // 2. Auth
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log("[DESIGN] Authentication failed:", authError?.message);
      return NextResponse.json(
        { error: "Unauthorized — please sign in" },
        { status: 401 },
      );
    }

    const currentUser = user;
    console.log("[DESIGN] Authenticated user:", currentUser.id);

    // 3. Check API keys
    const screenshotKey = process.env.SCREENSHOT_API_KEY;
    if (!screenshotKey) {
      console.log("[DESIGN] Missing SCREENSHOT_API_KEY");
      return NextResponse.json(
        { error: "Server configuration error: missing ScreenshotOne API key" },
        { status: 500 },
      );
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      console.log("[DESIGN] Missing GEMINI_API_KEY");
      return NextResponse.json(
        { error: "Server configuration error: missing Gemini API key" },
        { status: 500 },
      );
    }

    // 4. Cache check — only when persisting (need a real businessId to look up cached rows)
    if (shouldPersist) {
      const adminClient = createAdminClient();
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: cachedDesignData, error: cacheReadError } = await (adminClient.from("design_analyses") as any)
        .select("*")
        .eq("business_id", businessId)
        .in("strategy", ["mobile", "desktop"])
        .gte("analyzed_at", sevenDaysAgo);

      if (cacheReadError) {
        console.warn("[DESIGN] cache read failed, falling through to live API:", cacheReadError.message);
      }

      const cachedDesign = cachedDesignData as Record<string, unknown>[] | null;

      if (force) {
        console.log("[DESIGN] force refresh — bypassing cache for", businessId);
      } else if (cachedDesign?.length === 2) {
        const mobileCache = cachedDesign.find((d) => d.strategy === "mobile");
        const desktopCache = cachedDesign.find((d) => d.strategy === "desktop");
        const cachedAt = cachedDesign[0].analyzed_at as string;
        const cacheAgeMs = Date.now() - new Date(cachedAt).getTime();
        const days = Math.floor(cacheAgeMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((cacheAgeMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        console.log(`[DESIGN] cache hit — returning cached results for ${businessId} (age: ${days}d ${hours}h)`);
        return NextResponse.json({
          success: true,
          cached: true,
          cached_at: cachedAt,
          mobile: mobileCache,
          desktop: desktopCache,
        });
      }
      console.log("[DESIGN] cache miss — running ScreenshotOne + Gemini for", businessId);
    } else {
      console.log("[DESIGN] ephemeral mode — skipping cache check, running ScreenshotOne + Gemini directly");
    }

    // ------------------------------------------------------------------
    // Stream progress via NDJSON
    // ------------------------------------------------------------------
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Step 1: Screenshot + analysis — both strategies run concurrently
          // Send BOTH screenshot step events before Promise.allSettled so the
          // client sees both "mobile-screenshot" and "desktop-screenshot" as
          // ACTIVE (spinning) simultaneously
          writeStep(controller, encoder, "mobile-screenshot", "Taking mobile screenshot…");
          writeStep(controller, encoder, "desktop-screenshot", "Taking desktop screenshot…");

          const [mobileResult, desktopResult] = await Promise.allSettled([
            (async () => {
              const screenshot = await takeScreenshot(trimmedWebsite, MOBILE_VIEWPORT, screenshotKey);
              if (!screenshot.ok) {
                return { status: "error" as const, error: sanitizeError(screenshot.error) };
              }

              const analysis = await analyzeScreenshot(screenshot.base64, geminiKey);
              if (!analysis.ok) {
                const err = analysis.error === "AI_SERVICE_BUSY" ? analysis.error : `Analysis failed: ${analysis.error}`;
                return { status: "error" as const, error: err };
              }

              return {
                status: "ok" as const,
                design_score: analysis.data.design_score,
                criteria_scores: analysis.data.criteria_scores,
                issues: analysis.data.issues,
                raw_analysis: analysis.data,
              };
            })(),
            (async () => {
              const screenshot = await takeScreenshot(trimmedWebsite, DESKTOP_VIEWPORT, screenshotKey);
              if (!screenshot.ok) {
                return { status: "error" as const, error: sanitizeError(screenshot.error) };
              }

              const analysis = await analyzeScreenshot(screenshot.base64, geminiKey);
              if (!analysis.ok) {
                const err = analysis.error === "AI_SERVICE_BUSY" ? analysis.error : `Analysis failed: ${analysis.error}`;
                return { status: "error" as const, error: err };
              }

              return {
                status: "ok" as const,
                design_score: analysis.data.design_score,
                criteria_scores: analysis.data.criteria_scores,
                issues: analysis.data.issues,
                raw_analysis: analysis.data,
              };
            })(),
          ]);

          const mobile: StrategyResult =
            mobileResult.status === "fulfilled"
              ? mobileResult.value
              : { status: "error", error: mobileResult.reason instanceof Error ? mobileResult.reason.message : "Unknown error" };

          const desktop: StrategyResult =
            desktopResult.status === "fulfilled"
              ? desktopResult.value
              : { status: "error", error: desktopResult.reason instanceof Error ? desktopResult.reason.message : "Unknown error" };

          console.log("[DESIGN] Mobile result:", mobile.status, mobile.design_score ?? "");
          console.log("[DESIGN] Desktop result:", desktop.status, desktop.design_score ?? "");

          const now = new Date().toISOString();

          // ── Check for Gemini service busy (rate-limited or overloaded) ──
          const isServiceBusy =
            (mobile.status === "error" && mobile.error === "AI_SERVICE_BUSY") ||
            (desktop.status === "error" && desktop.error === "AI_SERVICE_BUSY");

          if (isServiceBusy) {
            writeJson(controller, encoder, {
              type: "error",
              error: "AI_SERVICE_BUSY",
              message: "AI service is busy. Please try again in a moment.",
              retryAfter: 30,
            });
            controller.close();
            return;
          }

          // ── Both strategies failed — emit error instead of "done" ──
          if (mobile.status === "error" && desktop.status === "error") {
            const msg = "Design analysis failed — screenshots could not be captured. Try again later.";
            console.error("[DESIGN] Both strategies failed — emitting error:", msg);
            writeJson(controller, encoder, { type: "error", message: msg });
            controller.close();
            return;
          }

          // 5. Persist results — only when a real businessId was provided
          const persistenceErrors: string[] = [];
          if (shouldPersist) {
            const adminSupabase = createAdminClient();

            writeStep(controller, encoder, "persisting", "Saving results...");

            // Insert successful analyses into design_analyses (admin client bypasses RLS)
            for (const [strategy, result] of [
              ["mobile", mobile] as const,
              ["desktop", desktop] as const,
            ]) {
              if (result.status !== "ok" || !result.raw_analysis) {
                console.log(`[DESIGN] Skipping ${strategy} insert — status:`, result.status);
                continue;
              }

              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const { error: insertError } = await (adminSupabase.from("design_analyses") as any).insert({
                id: crypto.randomUUID(),
                business_id: businessId,
                user_id: currentUser.id,
                strategy,
                design_score: result.design_score,
                screenshot_url: null,
                issues: result.issues,
                criteria_scores: result.criteria_scores,
                raw_analysis: result.raw_analysis,
                analyzed_at: now,
              });

              if (insertError) {
                console.error(`[DESIGN] CRITICAL: insert failed for strategy ${strategy}`, {
                  code: insertError.code,
                  message: insertError.message,
                  details: insertError.details,
                  hint: insertError.hint,
                });
                persistenceErrors.push(`design_analyses insert (${strategy})`);
              } else {
                console.log(`[DESIGN] Inserted ${strategy} analysis OK`);
              }
            }

            // 6. Update businesses row (admin client bypasses RLS)
            const bestScore =
              mobile.status === "ok"
                ? mobile.design_score
                : desktop.status === "ok"
                  ? desktop.design_score
                  : null;

            // For outreach flag: flag based on design score (overrides any existing website-status-based flag)
            const scoreVal = bestScore ?? 0;
            const isFlagged = scoreVal > 0 && scoreVal < 70;
            const outreachReason = isFlagged ? (scoreVal < 40 ? "poor_design" : "design_needs_improvement") : null;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error: updateError } = await (adminSupabase.from("businesses") as any)
              .update({
                design_score: bestScore,
                design_analyzed_at: now,
                flagged_for_outreach: isFlagged,
                outreach_reason: outreachReason,
              })
              .eq("id", businessId);

            if (updateError) {
              console.error("[DESIGN] CRITICAL: businesses update failed", {
                code: updateError.code,
                message: updateError.message,
                details: updateError.details,
                hint: updateError.hint,
              });
              persistenceErrors.push("businesses update");
            } else {
              console.log("[DESIGN] Updated business design_score and design_analyzed_at");
            }

            console.log("[DESIGN] Analysis complete — persisted for business:", businessId, "| errors:", persistenceErrors.length);
          } else {
            console.log("[DESIGN] Analysis complete — ephemeral (not persisted)");
          }

          // 7. If persistence failed, emit error instead of "done"
          if (shouldPersist && persistenceErrors.length > 0) {
            console.error("[DESIGN] Persistence failed — emitting error instead of done");
            writeJson(controller, encoder, {
              type: "error",
              message: "Design analysis failed — could not save results.",
            });
            controller.close();
            return;
          }

          // 8. Stream result + done
          writeStep(controller, encoder, "complete", "Design analysis complete");

          writeJson(controller, encoder, {
            type: "result",
            cached: false,
            cached_at: now,
            mobile: mobile.status === "ok"
              ? { status: "ok", design_score: mobile.design_score, criteria_scores: mobile.criteria_scores, issues: mobile.issues }
              : { status: "error", error: mobile.error },
            desktop: desktop.status === "ok"
              ? { status: "ok", design_score: desktop.design_score, criteria_scores: desktop.criteria_scores, issues: desktop.issues }
              : { status: "error", error: desktop.error },
          });

          writeJson(controller, encoder, { type: "done" });
          controller.close();
        } catch (error) {
          console.error("[DESIGN] Stream error:", error);
          writeJson(controller, encoder, {
            type: "error",
            message: error instanceof Error ? error.message : "Internal server error",
          });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "application/x-ndjson" },
    });
  } catch (error) {
    console.error("[DESIGN] Unexpected error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
