import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { scopedAdmin } from "@/lib/api/scoped-admin";
import { computeOpportunityScore } from "@/lib/scoring";
import { checkCredit, deductCredit } from "@/lib/credits";
import { rateLimiter, checkRateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";
import { createTimeoutController } from "@/lib/api/timeout";
import { businessWebsiteSchema } from "@/lib/validation";

type AuditRequestBody = {
  businessId?: string;
  website: string;
  force?: boolean;
};

type StrategyMetrics = {
  performance_score: number | null;
  seo_score: number | null;
  fcp: string | null;
  lcp: string | null;
  tbt: string | null;
  cls: string | null;
};

type StrategyResult = StrategyMetrics & {
  status: "ok" | "timeout" | "error";
};

type AuditResponse = {
  mobile: StrategyResult;
  desktop: StrategyResult;
};

const PAGESPEED_URL = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";
const REQUEST_TIMEOUT_MS = 30000;

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

async function fetchPageSpeed(
  url: string,
  strategy: "mobile" | "desktop",
  apiKey: string,
): Promise<{ success: boolean; data?: unknown; error?: string; timedOut?: boolean }> {
  const params = new URLSearchParams({ url, strategy, key: apiKey });
  params.append("category", "performance");
  params.append("category", "seo");

  async function attempt(): Promise<{ success: boolean; data?: unknown; error?: string; timedOut?: boolean; status?: number }> {
    const { controller, clear } = createTimeoutController(REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(`${PAGESPEED_URL}?${params}`, {
        signal: controller.signal,
      });

      if (!response.ok) {
        return { success: false, error: `PageSpeed API returned ${response.status}`, status: response.status };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown fetch error";
      const isAbort = err instanceof DOMException && err.name === "AbortError";
      return {
        success: false,
        error: message,
        timedOut: isAbort,
      };
    } finally {
      clear();
    }
  }

  // First attempt
  const first = await attempt();
  if (first.success) return first;

  // Retry on timeout (AbortError) or transient HTTP errors (500, 429)
  const isRetryable = first.timedOut || first.status === 500 || first.status === 429;
  if (isRetryable) {
    const reason = first.timedOut ? `timeout (${REQUEST_TIMEOUT_MS}ms)` : `HTTP ${first.status}`;
    console.log(`[AUDIT] ${strategy} retrying after ${reason}...`);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return attempt();
  }

  return first;
}

function extractMetrics(lighthouseResult: unknown): StrategyMetrics {
  const lr = lighthouseResult as Record<string, unknown> | undefined;
  const categories = lr?.categories as Record<string, unknown> | undefined;

  const performance = categories?.performance as Record<string, unknown> | undefined;
  const rawPerfScore = Number(performance?.score ?? 0);
  const performance_score = Number.isFinite(rawPerfScore) ? Math.round(rawPerfScore * 100) : 0;

  const seo = categories?.seo as Record<string, unknown> | undefined;
  const rawSeoScore = Number(seo?.score ?? 0);
  const seo_score = Number.isFinite(rawSeoScore) ? Math.round(rawSeoScore * 100) : 0;

  const audits = lr?.audits as Record<string, unknown> | undefined;

  const fcp = (audits?.["first-contentful-paint"] as Record<string, unknown> | undefined)
    ?.displayValue as string | undefined ?? null;
  const lcp = (audits?.["largest-contentful-paint"] as Record<string, unknown> | undefined)
    ?.displayValue as string | undefined ?? null;
  const tbt = (audits?.["total-blocking-time"] as Record<string, unknown> | undefined)
    ?.displayValue as string | undefined ?? null;
  const cls = (audits?.["cumulative-layout-shift"] as Record<string, unknown> | undefined)
    ?.displayValue as string | undefined ?? null;

  return { performance_score, seo_score, fcp, lcp, tbt, cls };
}

function buildAuditData(lighthouseResult: unknown): unknown {
  const lr = lighthouseResult as Record<string, unknown> | undefined;
  if (!lr) return null;

  // Store only the essential parts to keep row size sane
  const categories = lr.categories;
  const audits = lr.audits as Record<string, unknown> | undefined;

  // Extract only the key audit metrics we care about
  const keyAuditIds = [
    "first-contentful-paint",
    "largest-contentful-paint",
    "total-blocking-time",
    "cumulative-layout-shift",
    "speed-index",
    "interactive",
  ];

  const keyAudits: Record<string, unknown> = {};
  if (audits) {
    for (const id of keyAuditIds) {
      if (audits[id]) {
        keyAudits[id] = audits[id];
      }
    }
  }

  return { categories, keyAudits };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AuditRequestBody;
    
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
      console.log("[AUDIT] Starting audit for business:", businessId, "website:", trimmedWebsite);
    } else {
      console.log("[AUDIT] Starting ephemeral audit (no businessId) for website:", trimmedWebsite);
    }

    // 2. Get logged-in user server-side
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log("[AUDIT] Authentication failed:", authError?.message);
      return NextResponse.json(
        { error: "Unauthorized — please sign in" },
        { status: 401 },
      );
    }

    console.log("[AUDIT] Authenticated user:...", user.id.slice(-4));

    // Rate limit: standard limit for audit operations
    const identifier = getRateLimitIdentifier(request, user.id);
    const blocked = await checkRateLimit(request, rateLimiter, identifier);
    if (blocked) return blocked;

    // 3. Credit check — runs before any external API calls
    const credit = await checkCredit(user.id);
    if (!credit.allowed) {
      return NextResponse.json(
        { error: "Audit limit reached. Upgrade your plan to run more audits.", code: "CREDIT_LIMIT", retryAfter: 0 },
        { status: 429 },
      );
    }

    // 4. Get API key
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      console.log("[AUDIT] Missing GOOGLE_PLACES_API_KEY");
      return NextResponse.json(
        { error: "Server configuration error: missing Google API key" },
        { status: 500 },
      );
    }

    // 4. Cache check — only when persisting (need a real businessId to look up cached rows)
    if (shouldPersist) {
      const sa = scopedAdmin(user.id);
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: cachedAuditsData, error: cacheReadError } = await sa.from("audits")
        .select("*")
        .eq("business_id", businessId)
        .in("strategy", ["mobile", "desktop"])
        .gte("created_at", sevenDaysAgo);

      if (cacheReadError) {
        console.warn("[AUDIT] cache read failed, falling through to live API:", cacheReadError.message);
      }

      const cachedAudits = cachedAuditsData as Record<string, unknown>[] | null;

      if (force) {
        console.log("[AUDIT] force refresh — bypassing cache for", businessId);
      } else if (cachedAudits?.length === 2) {
        const mobileCache = cachedAudits.find((a) => a.strategy === "mobile");
        const desktopCache = cachedAudits.find((a) => a.strategy === "desktop");
        const cachedAt = cachedAudits[0].created_at as string;
        const cacheAgeMs = Date.now() - new Date(cachedAt).getTime();
        const days = Math.floor(cacheAgeMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((cacheAgeMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        console.log(`[AUDIT] cache hit — returning cached results for ${businessId} (age: ${days}d ${hours}h)`);
        return NextResponse.json({
          success: true,
          cached: true,
          cached_at: cachedAt,
          mobile: mobileCache,
          desktop: desktopCache,
        });
      }
      console.log("[AUDIT] cache miss — running PageSpeed for", businessId);
    } else {
      console.log("[AUDIT] ephemeral mode — skipping cache check, running PageSpeed directly");
    }

    // ------------------------------------------------------------------
    // Stream progress via NDJSON
    // ------------------------------------------------------------------
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Step 1: Fetching business data
          writeStep(controller, encoder, "fetching", "Fetching business data...");

          // Step 2: Run PageSpeed for both strategies concurrently
          // Send BOTH step events before Promise.allSettled so the client
          // sees both "mobile" and "desktop" as ACTIVE (spinning) simultaneously
          writeStep(controller, encoder, "mobile", "Running Mobile PageSpeed…");
          writeStep(controller, encoder, "desktop", "Running Desktop PageSpeed…");

          const [mobileResult, desktopResult] = await Promise.allSettled([
            fetchPageSpeed(trimmedWebsite, "mobile", apiKey),
            fetchPageSpeed(trimmedWebsite, "desktop", apiKey),
          ]);

          writeStep(controller, encoder, "complete", "Performance complete");

          // 3. Extract metrics for each strategy
          function buildStrategyResult(
            result: PromiseSettledResult<{ success: boolean; data?: unknown; error?: string; timedOut?: boolean }>,
            strategyLabel: string,
          ): { metrics: StrategyResult; auditData: unknown } {
            if (result.status === "fulfilled" && result.value.success) {
              const lighthouseResult = (result.value.data as Record<string, unknown>)?.lighthouseResult;
              const metrics = extractMetrics(lighthouseResult);
              const auditData = buildAuditData(lighthouseResult);
              console.log(`[AUDIT] ${strategyLabel} result:`, metrics);
              return {
                metrics: { ...metrics, status: "ok" },
                auditData,
              };
            }

            const errMsg = result.status === "fulfilled"
              ? result.value.error ?? "Unknown error"
              : result.reason instanceof Error ? result.reason.message : "Unknown error";
            const timedOut = result.status === "fulfilled" ? result.value.timedOut : false;

            if (timedOut) {
              console.log(`[AUDIT] ${strategyLabel} PageSpeed timed out after ${REQUEST_TIMEOUT_MS}ms`);
              return {
                metrics: { performance_score: null, seo_score: null, fcp: null, lcp: null, tbt: null, cls: null, status: "timeout" },
                auditData: { error: "timeout" },
              };
            }

            console.log(`[AUDIT] ${strategyLabel} PageSpeed failed:`, errMsg);
            return {
              metrics: { performance_score: null, seo_score: null, fcp: null, lcp: null, tbt: null, cls: null, status: "error" },
              auditData: { error: "pagespeed_failed", message: errMsg },
            };
          }

          const mobileBuilt = buildStrategyResult(mobileResult, "Mobile");
          const desktopBuilt = buildStrategyResult(desktopResult, "Desktop");
          const mobileMetrics = mobileBuilt.metrics;
          const mobileAuditData = mobileBuilt.auditData;
          const desktopMetrics = desktopBuilt.metrics;
          const desktopAuditData = desktopBuilt.auditData;

          // 4. Derive has_ssl from the website URL
          const hasSsl = trimmedWebsite.toLowerCase().startsWith("https://");

          const now = new Date().toISOString();

          // 5. Persist results — only when a real businessId was provided
          if (shouldPersist) {
            const adminSupabase = scopedAdmin(user.id);

            // Insert TWO rows into audits using ADMIN client (bypasses RLS)
            const auditRows: Record<string, unknown>[] = [
              {
                id: crypto.randomUUID(),
                business_id: businessId,
                user_id: user.id,
                strategy: "mobile",
                performance_score: mobileMetrics.performance_score ?? 0,
                seo_score: mobileMetrics.seo_score ?? null,
                fcp: mobileMetrics.fcp,
                lcp: mobileMetrics.lcp,
                tbt: mobileMetrics.tbt,
                cls: mobileMetrics.cls,
                has_ssl: hasSsl,
                audit_data: mobileAuditData,
                created_at: now,
              },
              {
                id: crypto.randomUUID(),
                business_id: businessId,
                user_id: user.id,
                strategy: "desktop",
                performance_score: desktopMetrics.performance_score ?? 0,
                seo_score: desktopMetrics.seo_score ?? null,
                fcp: desktopMetrics.fcp,
                lcp: desktopMetrics.lcp,
                tbt: desktopMetrics.tbt,
                cls: desktopMetrics.cls,
                has_ssl: hasSsl,
                audit_data: desktopAuditData,
                created_at: now,
              },
            ];

            for (const row of auditRows) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const { error: insertError } = await (adminSupabase.from("audits") as any)
                .insert(row);

              if (insertError) {
                console.error("[AUDIT] CRITICAL: insert failed for strategy", row.strategy, { code: insertError.code, message: insertError.message, details: insertError.details, hint: insertError.hint });
              } else {
                console.log("[AUDIT] Inserted audit row for strategy", row.strategy);
              }
            }

            // 6. Determine outreach flag based on performance scores
            const bestPerfScore = Math.max(
              mobileMetrics.performance_score ?? 0,
              desktopMetrics.performance_score ?? 0,
            );
            const isFlagged = bestPerfScore < 70;
            const outreachReason = isFlagged ? (bestPerfScore < 40 ? "poor_performance" : "needs_improvement") : null;

            // 7. Compute opportunity score (rating + review_count already on the business row)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: businessRow } = await (adminSupabase.from("businesses") as any)
              .select("rating, review_count, business_type")
              .eq("id", businessId)
              .single();

            const reviewCount = (businessRow as { review_count?: number } | null)?.review_count ?? 0;
            const rating = (businessRow as { rating?: number } | null)?.rating ?? 0;
            const businessType = (businessRow as { business_type?: string | null } | null)?.business_type ?? null;
            const opportunityScore = computeOpportunityScore(bestPerfScore, reviewCount, rating, businessType);

            // 8. Update businesses row
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error: updateError } = await (adminSupabase.from("businesses") as any)
              .update({
                audited_at: now,
                performance_score: bestPerfScore,
                opportunity_score: opportunityScore,
                flagged_for_outreach: isFlagged,
                outreach_reason: outreachReason,
              })
              .eq("id", businessId);

            if (updateError) {
              console.error("[AUDIT] CRITICAL: update failed for business", businessId, { code: updateError.code, message: updateError.message, details: updateError.details, hint: updateError.hint });
            } else {
              console.log("[AUDIT] Updated audited_at + opportunity_score for business", businessId);
            }

            console.log("[AUDIT] Audit complete — persisted for business:", businessId);
          } else {
            console.log("[AUDIT] Audit complete — ephemeral (not persisted)");
          }

          // 8. Deduct credit for fresh (non-cached) audit
          await deductCredit(user.id);

          // 9. Stream result + done
          const responseBody: AuditResponse = {
            mobile: mobileMetrics,
            desktop: desktopMetrics,
          };

          writeJson(controller, encoder, { type: "result", cached: false, cached_at: now, ...responseBody });
          writeJson(controller, encoder, { type: "done" });
          controller.close();
        } catch (error) {
          console.error("[AUDIT] Stream error:", error);
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
    console.error("[AUDIT] Internal error:", error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again later." },
      { status: 500 },
    );
  }
}
