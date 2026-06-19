import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { scopedAdmin } from "@/lib/api/scoped-admin";
import { rateLimiter, checkRateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";
import { blendQualityForOpportunity, computeOpportunityScore } from "@/lib/scoring";
import { deductAudit } from "@/lib/credits";

type AuditStrategy = {
  performance_score?: number | null;
  seo_score?: number | null;
  fcp?: string | null;
  lcp?: string | null;
  tbt?: string | null;
  cls?: string | null;
  status?: string;
};

type DesignStrategy = {
  status?: string;
  design_score?: number;
  criteria_scores?: Record<string, unknown>;
  issues?: Record<string, unknown>[];
  raw_analysis?: Record<string, unknown>;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      website?: string;
      name?: string;
      city?: string;
      businessType?: string;
      rating?: number;
      reviewCount?: number;
      placeId?: string;
      audit?: {
        mobile?: AuditStrategy;
        desktop?: AuditStrategy;
      };
      design?: {
        mobile?: DesignStrategy;
        desktop?: DesignStrategy;
      };
    };

    const { website, name, city, businessType, audit, design, rating, reviewCount, placeId } = body;

    if (!website?.trim()) {
      return NextResponse.json({ error: "Website URL is required" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized — please sign in" }, { status: 401 });
    }

    const identifier = getRateLimitIdentifier(request, user.id);
    const blocked = await checkRateLimit(request, rateLimiter, identifier);
    if (blocked) return blocked;

    const sa = scopedAdmin(user.id);
    const trimmedUrl = website.trim();

    const perfValues = [audit?.mobile?.performance_score, audit?.desktop?.performance_score]
      .filter((v): v is number => typeof v === "number");
    const avgPerformance = perfValues.length
      ? Math.round(perfValues.reduce((a, b) => a + b, 0) / perfValues.length)
      : null;

    const designValues = [design?.mobile?.design_score, design?.desktop?.design_score]
      .filter((v): v is number => typeof v === "number");
    const avgDesign = designValues.length
      ? Math.round(designValues.reduce((a, b) => a + b, 0) / designValues.length)
      : null;

    const qualityForOpp = blendQualityForOpportunity(
      audit?.mobile?.performance_score ?? null,
      audit?.desktop?.performance_score ?? null,
      avgDesign,
    );
    const opportunityScore = (avgPerformance !== null || avgDesign !== null)
      ? computeOpportunityScore(qualityForOpp, reviewCount ?? 0, rating ?? 0, businessType ?? null)
      : null;

    const now = new Date().toISOString();

    const { data: existingRaw, error: lookupError } = await sa.from("businesses")
      .select("id")
      .eq("website", trimmedUrl)
      .maybeSingle();
    const existing = existingRaw as unknown as { id: string } | null;

    if (lookupError) {
      console.error("[LEADS] Lookup error:", { code: lookupError.code, message: lookupError.message });
      return NextResponse.json({ error: "Failed to look up existing lead" }, { status: 500 });
    }

    if (existing?.id) {
      const updates: Record<string, unknown> = {};
      if (avgPerformance !== null) { updates.performance_score = avgPerformance; updates.audited_at = now; }
      if (avgDesign !== null) { updates.design_score = avgDesign; updates.design_analyzed_at = now; }
      if (name?.trim()) updates.name = name.trim();
      if (city?.trim()) updates.city = city.trim();
      if (businessType?.trim()) updates.business_type = businessType.trim();

      if (rating != null) updates.rating = rating;
      if (reviewCount != null) updates.review_count = reviewCount;
      if (placeId) updates.place_id = placeId;
      if (opportunityScore !== null) updates.opportunity_score = opportunityScore;

      if (Object.keys(updates).length > 0) {
        const { error: updateError } = await sa.from("businesses")
          .update(updates)
          .eq("id", existing.id);
        if (updateError) {
          console.error("[LEADS] Update error:", { code: updateError.code, message: updateError.message, details: updateError.details, hint: updateError.hint });
        }
      }

      // Persist audit + design rows to their tables (so lead detail page shows them)
      await persistAuditRows(sa, existing.id, user.id, audit);
      await persistDesignRows(sa, existing.id, user.id, design);

      // Deduct 1 credit when audit data is being saved (quick audit → save)
      if (audit || design) {
        const deducted = await deductAudit(user.id);
        if (!deducted.success) {
          console.warn(`[LEADS] Credit deduction failed on save for user=...${user.id.slice(-4)}`);
        } else {
          console.log(`[LEADS] Credit deducted for user=...${user.id.slice(-4)} (save lead with audit data)`);
        }
      }

      console.log("[LEADS] Returning existing business:", existing.id);
      return NextResponse.json({ success: true, business_id: existing.id });
    }

    let parsedName = trimmedUrl;
    try { parsedName = new URL(trimmedUrl).hostname; } catch { /* keep raw URL */ }

    const businessId = crypto.randomUUID();
    const { error: insertError } = await sa.from("businesses").insert({
      id: businessId,
      user_id: user.id,
      name: name?.trim() || parsedName,
      city: city?.trim() || null,
      business_type: businessType?.trim() || null,
      website: trimmedUrl,
      website_status: "has_website",
      performance_score: avgPerformance,
      design_score: avgDesign,
      opportunity_score: opportunityScore,
      rating: rating ?? null,
      review_count: reviewCount ?? null,
      place_id: placeId ?? null,
      discovered_at: now,
      audited_at: audit ? now : null,
      design_analyzed_at: design ? now : null,
    });

    if (insertError) {
      console.error("[LEADS] Insert error:", { code: insertError.code, message: insertError.message, details: insertError.details, hint: insertError.hint });
      return NextResponse.json({ error: "Failed to create lead" }, { status: 500 });
    }

    // Persist audit + design rows to their tables (so lead detail page shows them)
    await persistAuditRows(sa, businessId, user.id, audit);
    await persistDesignRows(sa, businessId, user.id, design);

    // Deduct 1 credit when audit data is being saved (quick audit → save)
    if (audit || design) {
      const deducted = await deductAudit(user.id);
      if (!deducted.success) {
        console.warn(`[LEADS] Credit deduction failed on save for user=...${user.id.slice(-4)}`);
      } else {
        console.log(`[LEADS] Credit deducted for user=...${user.id.slice(-4)} (new lead with audit data)`);
      }
    }

    console.log("[LEADS] Created business:", businessId);
    return NextResponse.json({ success: true, business_id: businessId });
  } catch (error) {
    console.error("[LEADS] Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────────

/** Persist audit results (mobile + desktop) to the audits table. */
async function persistAuditRows(
  sa: ReturnType<typeof scopedAdmin>,
  businessId: string,
  userId: string,
  audit: { mobile?: AuditStrategy; desktop?: AuditStrategy } | undefined,
) {
  if (!audit) return;
  const now = new Date().toISOString();
  const rows: Record<string, unknown>[] = [];

  for (const strategy of ["mobile", "desktop"] as const) {
    const s = audit[strategy];
    if (!s || s.status !== "ok") continue;
    rows.push({
      business_id: businessId,
      user_id: userId,
      strategy,
      performance_score: s.performance_score ?? null,
      seo_score: s.seo_score ?? null,
      fcp: s.fcp ?? null,
      lcp: s.lcp ?? null,
      tbt: s.tbt ?? null,
      cls: s.cls ?? null,
      has_ssl: null,
      created_at: now,
    });
  }

  if (rows.length === 0) return;
  const { error } = await sa.from("audits").insert(rows);
  if (error) {
    console.error("[LEADS] Audit row insert error:", { code: error.code, message: error.message });
  } else {
    console.log(`[LEADS] Inserted ${rows.length} audit row(s) for business ${businessId.slice(-4)}`);
  }
}

/** Persist design analysis results (mobile + desktop) to the design_analyses table. */
async function persistDesignRows(
  sa: ReturnType<typeof scopedAdmin>,
  businessId: string,
  userId: string,
  design: { mobile?: DesignStrategy; desktop?: DesignStrategy } | undefined,
) {
  if (!design) return;
  const now = new Date().toISOString();
  const rows: Record<string, unknown>[] = [];

  for (const strategy of ["mobile", "desktop"] as const) {
    const s = design[strategy];
    if (!s || s.status !== "ok") continue;
    rows.push({
      business_id: businessId,
      user_id: userId,
      strategy,
      design_score: s.design_score ?? null,
      criteria_scores: s.criteria_scores ?? null,
      issues: s.issues ?? null,
      screenshot_url: null,
      raw_analysis: s.raw_analysis ?? null,
      analyzed_at: now,
    });
  }

  if (rows.length === 0) return;
  const { error } = await sa.from("design_analyses").insert(rows);
  if (error) {
    console.error("[LEADS] Design row insert error:", { code: error.code, message: error.message });
  } else {
    console.log(`[LEADS] Inserted ${rows.length} design analysis row(s) for business ${businessId.slice(-4)}`);
  }
}
