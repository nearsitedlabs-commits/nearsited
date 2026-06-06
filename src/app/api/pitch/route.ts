import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { scopedAdmin } from "@/lib/api/scoped-admin";
import type { WebsiteStatus } from "@/lib/db-types";
import { expensiveOpLimiter, checkRateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";
import { pitchSchema } from "@/lib/validation";
import {
  getBusinessTypeContext,
  openingInstruction,
  urgencyInstruction,
  buildAngle,
  buildWorkflowPrompt,
  buildFullPrompt,
  buildAuditOnlyPrompt,
  buildDesignOnlyPrompt,
  cleanGeminiJson,
} from "@/lib/pitch/prompts";
import { GEMINI_URL } from "@/lib/gemini";

// ── Constants ────────────────────────────────────────────────────────────────
const GEMINI_TIMEOUT_MS = 30_000;

// ── Types ────────────────────────────────────────────────────────────────────
type StrategyResult = {
  performance_score: number | null;
  seo_score?: number | null;
  fcp: string | null;
  lcp: string | null;
  tbt: string | null;
  cls: string | null;
  status: "ok" | "timeout" | "error";
};

type PitchRequestBody = {
  businessId?: string;
  website?: string;
  audit?: {
    mobile?: StrategyResult;
    desktop?: StrategyResult;
  };
  design?: {
    mobile?: DesignAnalysisRow;
    desktop?: DesignAnalysisRow;
  };
  tone?: "professional" | "friendly" | "luxury";
  length?: "short" | "medium" | "detailed";
  channel?: "email" | "whatsapp";
  workflow?: "website" | "social_only" | "no_digital_presence";
  socialPlatforms?: string[];
  focus?: string;
  opening?: "direct" | "question" | "empathy" | "data";
  urgency?: "low" | "medium" | "high";
  force?: boolean;
};

type GeminiResponse = {
  candidates: { content: { parts: { text: string }[] } }[];
};

type ParsedPitch = {
  subject: string;
  body: string;
};

type AuditRow = {
  performance_score: number | null;
  seo_score: number | null;
  strategy: string;
  fcp: string | null;
  lcp: string | null;
  tbt: string | null;
  cls: string | null;
};

type DesignAnalysisRow = {
  design_score: number | null;
  issues: { title: string; detail: string; point_deduction?: number; impact?: string }[] | null;
};

// ── Route ────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as PitchRequestBody;
    
    // ── Zod validation ──────────────────────────────────────────────────────
    const parsed = pitchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues.map((i) => i.message) },
        { status: 400 },
      );
    }
    const {
      businessId,
      website,
      audit,
      design,
      tone = "professional",
      length = "medium",
      channel = "email",
      workflow,
      socialPlatforms,
      focus,
      opening = "direct",
      urgency = "medium",
      force = false,
    } = parsed.data;

    const hasPersistedMode = typeof businessId === "string" && businessId.trim().length > 0;
    const hasEphemeralMode = !hasPersistedMode
      && typeof website === "string"
      && website.trim().length > 0
      && typeof audit === "object"
      && audit !== null
      && ((audit.mobile && typeof audit.mobile === "object") || (audit.desktop && typeof audit.desktop === "object"));

    if (!hasPersistedMode && !hasEphemeralMode) {
      return NextResponse.json(
        { error: "Missing required fields: businessId for persisted mode, or website + audit for ephemeral mode" },
        { status: 400 },
      );
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      console.log("[PITCH] Missing GEMINI_API_KEY");
      return NextResponse.json(
        { error: "Server configuration error: missing Gemini API key" },
        { status: 500 },
      );
    }

    // 1. Auth
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log("[PITCH] Authentication failed:", authError?.message);
      return NextResponse.json(
        { error: "Unauthorized — please sign in" },
        { status: 401 },
      );
    }

    console.log("[PITCH] Authenticated user:...", user.id.slice(-4));

    // Rate limit: strict limit for expensive pitch generation
    const identifier = getRateLimitIdentifier(request, user.id);
    const blocked = await checkRateLimit(request, expensiveOpLimiter, identifier);
    if (blocked) return blocked;

    let promptBusinessName = "there";
    let promptBusinessType = "business";
    let promptLocation = "their market";
    let promptWebsite = "";
    let promptRating: number | null = null;
    let promptReviewCount: number | null = null;
    let leadType: WebsiteStatus = "has_website";
    let resolvedPerfScore: number | null = null;
    let auditContext = "No audit data available.";
    let designContext = "No design analysis available.";
    let shouldPersist = false;
    let persistedBusinessId: string | undefined;

    if (hasPersistedMode) {
      shouldPersist = true;
      persistedBusinessId = businessId!.trim();

      // 2. Cache check — return early if a fresh pitch exists for this business+tone and force is not set
      const sa = scopedAdmin(user.id);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data: cachedPitchData, error: cacheReadError } = await sa.from("pitches")
        .select("*")
        .eq("business_id", persistedBusinessId)
        .eq("tone", tone)
        .gte("created_at", thirtyDaysAgo)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (cacheReadError && cacheReadError.code !== "PGRST116") {
        console.warn("[PITCH] cache read failed, falling through to live API:", cacheReadError.message);
      }

      const cachedPitch = cachedPitchData as Record<string, unknown> | null;

      if (!force && cachedPitch) {
        const cachedAt = cachedPitch.created_at as string;
        const cacheAgeMs = Date.now() - new Date(cachedAt).getTime();
        const days = Math.floor(cacheAgeMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((cacheAgeMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        console.log(`[PITCH] cache hit — returning cached pitch for ${persistedBusinessId} (age: ${days}d ${hours}h)`);
        return NextResponse.json({
          success: true,
          cached: true,
          cached_at: cachedAt,
          persisted: true,
          pitch: {
            id: cachedPitch.id as string,
            subject: cachedPitch.subject as string,
            body: cachedPitch.body as string,
            tone: cachedPitch.tone as string,
            lead_type: cachedPitch.lead_type as string,
            pitch_status: cachedPitch.pitch_status as string,
          },
        });
      }

      console.log("[PITCH] cache miss — generating new pitch for", persistedBusinessId);

      // 3. Fetch business + latest audit + latest design analysis — using regular client (RLS enforced)
      const { data: business, error: fetchError } = await supabase
        .from("businesses")
        .select("id, name, business_type, city, website_status, website, rating, review_count")
        .eq("id", persistedBusinessId)
        .single();

      if (fetchError || !business) {
        console.error("[PITCH] Failed to fetch business:", fetchError);
        return NextResponse.json(
          { error: fetchError?.message ?? "Business not found" },
          { status: 404 },
        );
      }

      promptBusinessName = business.name ?? "there";
      promptBusinessType = business.business_type ?? "business";
      promptLocation = business.city ?? "their market";
      promptWebsite = business.website ?? "";
      leadType = (business.website_status ?? "unknown") as WebsiteStatus;
      promptRating = business.rating;
      promptReviewCount = business.review_count;

      const { data: audits } = await supabase
        .from("audits")
        .select("strategy, performance_score, seo_score, fcp, lcp, tbt, cls")
        .eq("business_id", persistedBusinessId)
        .order("created_at", { ascending: false })
        .limit(2);

      const auditRows = (audits ?? []) as AuditRow[];
      const desktopAudit = auditRows.find((a) => a.strategy === "desktop");
      const mobileAudit = auditRows.find((a) => a.strategy === "mobile");

      const { data: designRows } = await supabase
        .from("design_analyses")
        .select("design_score, issues")
        .eq("business_id", persistedBusinessId)
        .order("analyzed_at", { ascending: false })
        .limit(1);

      const designData = (designRows?.[0] ?? null) as DesignAnalysisRow | null;

      const perfScore = desktopAudit?.performance_score ?? mobileAudit?.performance_score ?? null;
      resolvedPerfScore = perfScore;
      auditContext = perfScore !== null
        ? `Performance score: ${perfScore}/100. LCP: ${desktopAudit?.lcp ?? mobileAudit?.lcp ?? "N/A"}. FCP: ${desktopAudit?.fcp ?? mobileAudit?.fcp ?? "N/A"}.`
        : "No audit data available.";

      designContext = designData?.design_score !== null
        ? `Design score: ${designData?.design_score ?? "N/A"}/100.\n${(designData?.issues ?? []).slice(0, 3).map((i) => `- ${i.title}: ${i.detail}`).join("\n")}`
        : "No design analysis available.";
    } else {
      // Ephemeral review mode: use runtime analysis data, do not persist.
      promptWebsite = website!.trim();
      if (typeof audit?.desktop === "object" && audit.desktop !== null) {
        const desktopAudit = audit.desktop as StrategyResult;
        const mobileAudit = audit?.mobile as StrategyResult | undefined;
        const perfScore = desktopAudit.performance_score ?? mobileAudit?.performance_score ?? null;
        resolvedPerfScore = perfScore;
        auditContext = perfScore !== null
          ? `Performance score: ${perfScore}/100. LCP: ${desktopAudit.lcp ?? mobileAudit?.lcp ?? "N/A"}. FCP: ${desktopAudit.fcp ?? mobileAudit?.fcp ?? "N/A"}.`
          : "No audit data available.";
      } else if (typeof audit?.mobile === "object" && audit.mobile !== null) {
        const mobileAudit = audit.mobile as StrategyResult;
        const perfScore = mobileAudit.performance_score ?? null;
        resolvedPerfScore = perfScore;
        auditContext = perfScore !== null
          ? `Performance score: ${perfScore}/100. LCP: ${mobileAudit.lcp ?? "N/A"}. FCP: ${mobileAudit.fcp ?? "N/A"}.`
          : "No audit data available.";
      }

      if (design && (design.mobile || design.desktop)) {
        const mobileDesign = design.mobile;
        const desktopDesign = design.desktop;
        const scores = [mobileDesign?.design_score, desktopDesign?.design_score].filter((value): value is number => typeof value === "number");
        const maxScore = scores.length > 0 ? Math.max(...scores) : null;
        const allIssues = [...(mobileDesign?.issues ?? []), ...(desktopDesign?.issues ?? [])].slice(0, 3);
        designContext = maxScore !== null
          ? `Design score: ${maxScore}/100.\n${allIssues.map((i) => `- ${i.title}: ${i.detail}`).join("\n")}`
          : "No design analysis available.";
      }
    }

    const { angle, painPoint } = buildAngle(leadType, resolvedPerfScore);

    // ── Workflow-specific prompts ──
    let workflowPromptBuilt = false;
    if (workflow === "social_only" || workflow === "no_digital_presence") {
      workflowPromptBuilt = true;
    }

    const hasAuditData = auditContext !== "No audit data available.";
    const hasDesignData = designContext !== "No design analysis available.";

    if (!hasAuditData && !hasDesignData && !workflowPromptBuilt) {
      console.log("[PITCH] No audit or design data — cannot generate pitch for website lead");
      return NextResponse.json(
        { error: "No audit or design data available for this lead. Run an audit first to generate a pitch." },
        { status: 400 },
      );
    }

    const reviewContext = promptRating != null && promptReviewCount != null
      ? `\nReviews: ${promptRating.toFixed(1)}★ from ${promptReviewCount.toLocaleString()} reviews on Google.`
      : promptRating != null
        ? `\nGoogle Rating: ${promptRating.toFixed(1)}★.`
        : promptReviewCount != null
          ? `\nGoogle reviews: ${promptReviewCount.toLocaleString()} reviews.`
          : "";

    const promptWebsiteSection = hasPersistedMode
      ? `Business: ${promptBusinessName}`
      : `Website: ${promptWebsite}`;

    const pitchConfig = `Tone: ${tone} (professional = concise and confident; friendly = warm and approachable; luxury = polished and premium)
Industry context: ${getBusinessTypeContext(promptBusinessType)}
Opening style: ${openingInstruction(opening)}
Urgency: ${urgencyInstruction(urgency)}${focus && focus !== "all" ? `\nFocus particularly on: ${focus}.` : ""}`;

    // ── Build prompt ──
    const prompt = workflowPromptBuilt
      ? buildWorkflowPrompt(promptBusinessName, promptBusinessType, promptLocation, workflow ?? "no_digital_presence", socialPlatforms ?? [], tone, length, channel, promptRating, promptReviewCount, opening, urgency, focus)
      : hasAuditData && hasDesignData
      ? buildFullPrompt(promptWebsiteSection, promptBusinessType, promptLocation, reviewContext, leadType, angle, painPoint, auditContext, designContext, pitchConfig, channel, tone, length, promptBusinessName)
      : hasAuditData
        ? buildAuditOnlyPrompt(promptWebsiteSection, promptBusinessType, promptLocation, reviewContext, leadType, angle, painPoint, auditContext, pitchConfig, channel, tone, length, promptBusinessName)
        : buildDesignOnlyPrompt(promptWebsiteSection, promptBusinessType, promptLocation, reviewContext, leadType, angle, painPoint, designContext, pitchConfig, channel, tone, length, promptBusinessName);

    // 4. Call Gemini API
    let parsedPitch: ParsedPitch;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

      const geminiResponse = await fetch(GEMINI_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": geminiApiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7 },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      console.log("[PITCH] Gemini HTTP status:", geminiResponse.status);

      if (!geminiResponse.ok) {
        const errorText = await geminiResponse.text().catch(() => "Unknown error");
        console.error("[PITCH] Gemini API error:", geminiResponse.status, errorText);
        if (geminiResponse.status === 429) {
          return NextResponse.json({
            success: false,
            error: "AI quota exceeded. Please try again in a minute.",
            retryAfter: 60,
          }, { status: 429 });
        }
        return NextResponse.json(
          { error: `Gemini API returned ${geminiResponse.status}` },
          { status: 502 },
        );
      }

      const geminiData = (await geminiResponse.json()) as GeminiResponse;
      const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

      if (!rawText) {
        console.error("[PITCH] Gemini returned empty response");
        return NextResponse.json(
          { error: "Gemini returned an empty response" },
          { status: 502 },
        );
      }

      try {
        const cleaned = cleanGeminiJson(rawText);
        parsedPitch = JSON.parse(cleaned) as ParsedPitch;
      } catch {
        if (process.env.NODE_ENV !== 'production') {
          console.error("[PITCH] JSON parse failed. Raw Gemini response:", rawText);
        } else {
          console.error("[PITCH] JSON parse failed. Response length:", rawText?.length);
        }
        return NextResponse.json(
          { error: "Gemini returned invalid JSON" },
          { status: 500 },
        );
      }

      if (!parsedPitch.subject || !parsedPitch.body) {
        console.error("[PITCH] Gemini response missing required fields");
        return NextResponse.json(
          { error: "AI response missing required fields: subject, body" },
          { status: 500 },
        );
      }
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : String(fetchError);
      console.error("[PITCH] Gemini API call failed:", message);
      return NextResponse.json(
        { error: "Failed to generate pitch via AI" },
        { status: 502 },
      );
    }

    if (shouldPersist) {
      const adminSupabase = scopedAdmin(user.id);
      const pitchId = crypto.randomUUID();
      const now = new Date().toISOString();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: insertError } = await (adminSupabase.from("pitches") as any).insert({
        id: pitchId,
        user_id: user.id,
        business_id: persistedBusinessId,
        subject: parsedPitch.subject,
        body: parsedPitch.body,
        tone,
        lead_type: leadType,
        pitch_status: "draft",
        created_at: now,
      });

      if (insertError) {
        console.error("[PITCH] CRITICAL: insert failed", { code: insertError.code, message: insertError.message });
        return NextResponse.json(
          { success: false, persisted: false, errors: [insertError.message] },
          { status: 500 },
        );
      }

      console.log("[PITCH] Pitch saved successfully for business:", persistedBusinessId);

      return NextResponse.json({
        success: true,
        cached: false,
        persisted: true,
        pitch: {
          id: pitchId,
          subject: parsedPitch.subject,
          body: parsedPitch.body,
          tone,
          lead_type: leadType,
          pitch_status: "draft",
        },
      });
    }

    return NextResponse.json({
      success: true,
      cached: false,
      persisted: false,
      pitch: {
        subject: parsedPitch.subject,
        body: parsedPitch.body,
        tone,
        lead_type: leadType,
        pitch_status: "ephemeral",
      },
    });
  } catch (error) {
    console.error("[PITCH] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

