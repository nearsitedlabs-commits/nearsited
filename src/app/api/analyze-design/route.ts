import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { scopedAdmin } from "@/lib/api/scoped-admin";
import { checkCredit, deductCredit } from "@/lib/credits";
import { expensiveOpLimiter, checkRateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";
import { businessWebsiteSchema } from "@/lib/validation";
import { writeJson, writeStep } from "@/lib/api/stream-utils";
import { blendQualityForOpportunity, computeOpportunityScore } from "@/lib/scoring";
import { runStrategy, type StrategyResult } from "@/lib/design-analysis";

// ── Route ────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // 1. Parse & validate body
    const body = (await request.json()) as Record<string, unknown>;

    // ── Zod validation ──────────────────────────────────────────────────────
    const parsed = businessWebsiteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues.map((i) => i.message) },
        { status: 400 },
      );
    }
    const { businessId, website, force } = parsed.data;

    // If businessId is provided, we'll persist results; otherwise run in
    // ephemeral mode (results displayed on screen but not saved to DB).
    const shouldPersist = Boolean(businessId);

    const trimmedWebsite = website;
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
    console.log("[DESIGN] Authenticated user:...", currentUser.id.slice(-4));

    // 3. Rate limit — strict limit for expensive analysis operations
    const identifier = getRateLimitIdentifier(request, user.id);
    const blocked = await checkRateLimit(request, expensiveOpLimiter, identifier);
    if (blocked) return blocked;

    // 4. Credit check — runs before any external API calls
    const credit = await checkCredit(user.id);
    if (!credit.allowed) {
      return NextResponse.json(
        { error: "Credit limit reached. Upgrade your plan to run more design analyses.", code: "CREDIT_LIMIT", retryAfter: 0 },
        { status: 429 },
      );
    }

    // 5. Check API keys
    const screenshotKey = process.env.SCREENSHOT_API_KEY;
    if (!screenshotKey) {
      console.log("[DESIGN] Missing SCREENSHOT_API_KEY");
      return NextResponse.json(
        { error: "Server configuration error: missing ScreenshotCore API key" },
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

    // 6. Cache check — only when persisting (need a real businessId to look up cached rows)
    if (shouldPersist && businessId) {
      const sa = scopedAdmin(currentUser.id);
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: cachedDesignData, error: cacheReadError } = await sa.from("design_analyses")
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
      console.log("[DESIGN] cache miss — running ScreenshotCore + Gemini for", businessId);
    } else {
      console.log("[DESIGN] ephemeral mode — skipping cache check, running ScreenshotCore + Gemini directly");
    }

    // ------------------------------------------------------------------
    // Stream progress via NDJSON
    // ------------------------------------------------------------------
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Step 1: Run both viewport strategies in parallel for speed
          writeStep(controller, encoder, "screenshot", "Taking screenshots (mobile + desktop)…");
          const [mobile, desktop]: [StrategyResult, StrategyResult] = await Promise.all([
            runStrategy("mobile", trimmedWebsite, screenshotKey, geminiKey),
            runStrategy("desktop", trimmedWebsite, screenshotKey, geminiKey),
          ]);

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

          // 7. Persist results — only when a real businessId was provided
          const persistenceErrors: string[] = [];
          if (shouldPersist) {
            const adminSupabase = scopedAdmin(currentUser.id);

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

              const { error: insertError } = await adminSupabase.from("design_analyses").insert({
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

            // 8. Update businesses row (admin client bypasses RLS)
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

            const { error: updateError } = await adminSupabase.from("businesses")
              .update({
                design_score: bestScore,
                design_analyzed_at: now,
                flagged_for_outreach: isFlagged,
                outreach_reason: outreachReason,
              })
              .eq("id", businessId!);

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

              // Recompute opportunity_score blending perf + new design score
              if (bestScore != null) {
                const { data: bizForOppRaw } = await adminSupabase.from("businesses")
                  .select("performance_score, rating, review_count, business_type")
                  .eq("id", businessId!)
                  .single();
                const bfp = bizForOppRaw as unknown as {
                  performance_score?: number | null;
                  rating?: number | null;
                  review_count?: number | null;
                  business_type?: string | null;
                } | null;
                if (bfp?.performance_score != null) {
                  const blendedQ = blendQualityForOpportunity(null, bfp.performance_score, bestScore);
                  const newOppScore = computeOpportunityScore(blendedQ, bfp.review_count ?? 0, bfp.rating ?? 0, bfp.business_type ?? null);
                  await adminSupabase.from("businesses").update({ opportunity_score: newOppScore }).eq("id", businessId!);
                  console.log("[DESIGN] Updated opportunity_score with blended quality:", newOppScore);
                }
              }
            }

            console.log("[DESIGN] Analysis complete — persisted for business:", businessId, "| errors:", persistenceErrors.length);
          } else {
            console.log("[DESIGN] Analysis complete — ephemeral (not persisted)");
          }

          // 9. If persistence failed, emit error instead of "done"
          if (shouldPersist && persistenceErrors.length > 0) {
            console.error("[DESIGN] Persistence failed — emitting error instead of done");
            writeJson(controller, encoder, {
              type: "error",
              message: "Design analysis failed — could not save results.",
            });
            controller.close();
            return;
          }

          // 10. Deduct credit — only for persisted analyses (ephemeral quick-audit is credit-free).
          //     Uses atomic PostgreSQL RPC that checks the limit INSIDE a locked transaction,
          //     eliminating the race condition between checkCredit() and deductCredit().
          if (shouldPersist) {
            const deducted = await deductCredit(user.id);
            if (!deducted.success) {
              console.warn(
                `[DESIGN] Credit deduction rejected for user=...${user.id.slice(-4)} ` +
                  `used=${deducted.audits_used}/${deducted.audits_limit} — ` +
                  "analysis was persisted but credit was not deducted (user at limit)",
              );
            }
          }

          // 11. Stream result + done
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
            message: "An unexpected error occurred during analysis",
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
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
