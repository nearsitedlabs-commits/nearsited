import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { scopedAdmin } from "@/lib/api/scoped-admin";
import { rateLimiter, checkRateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      website?: string;
      name?: string;
      city?: string;
      businessType?: string;
      audit?: {
        mobile?: { performance_score?: number | null };
        desktop?: { performance_score?: number | null };
      };
      design?: {
        mobile?: { design_score?: number | null };
        desktop?: { design_score?: number | null };
      };
    };

    const { website, name, city, businessType, audit, design } = body;

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

    const now = new Date().toISOString();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing, error: lookupError } = await (sa.from("businesses") as any)
      .select("id")
      .eq("website", trimmedUrl)
      .maybeSingle();

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

      if (Object.keys(updates).length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: updateError } = await (sa.from("businesses") as any)
          .update(updates)
          .eq("id", existing.id);
        if (updateError) {
          console.error("[LEADS] Update error:", { code: updateError.code, message: updateError.message, details: updateError.details, hint: updateError.hint });
        }
      }

      console.log("[LEADS] Returning existing business:", existing.id);
      return NextResponse.json({ success: true, business_id: existing.id });
    }

    let parsedName = trimmedUrl;
    try { parsedName = new URL(trimmedUrl).hostname; } catch { /* keep raw URL */ }

    const businessId = crypto.randomUUID();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: insertError } = await (sa.from("businesses") as any).insert({
      id: businessId,
      user_id: user.id,
      name: name?.trim() || parsedName,
      city: city?.trim() || null,
      business_type: businessType?.trim() || null,
      website: trimmedUrl,
      website_status: "has_website",
      performance_score: avgPerformance,
      design_score: avgDesign,
      discovered_at: now,
      audited_at: audit ? now : null,
      design_analyzed_at: design ? now : null,
    });

    if (insertError) {
      console.error("[LEADS] Insert error:", { code: insertError.code, message: insertError.message, details: insertError.details, hint: insertError.hint });
      return NextResponse.json({ error: "Failed to create lead" }, { status: 500 });
    }

    console.log("[LEADS] Created business:", businessId);
    return NextResponse.json({ success: true, business_id: businessId });
  } catch (error) {
    console.error("[LEADS] Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
