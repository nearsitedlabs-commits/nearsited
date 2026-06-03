import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { WebsiteStatus } from "@/lib/types";

// ── Constants ────────────────────────────────────────────────────────────────
const GEMINI_MODEL = "gemini-3.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const GEMINI_TIMEOUT_MS = 30_000;

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

// ── Business Type Context ─────────────────────────────────────────────────────
function getBusinessTypeContext(businessType: string): string {
  const t = businessType.toLowerCase();
  if (/restaurant|cafe|bakery|pizza|sushi|food|bar|coffee|deli|bistro|steakhouse|seafood|catering/.test(t))
    return "Customers search 'near me' when hungry or planning meals. Online presence drives foot traffic, reservations, and delivery orders. Key owner concerns: showing up in Google Maps, displaying the menu attractively, collecting reviews, and enabling online bookings.";
  if (/salon|barbershop|nail|spa|massage|beauty|waxing|lash|threading|microblading|makeup|aesthet|laser clinic/.test(t))
    return "Clients choose providers almost entirely based on visual presentation and social proof. Key concerns: online booking convenience, portfolio/gallery presentation, review management, appearing in 'near me' searches. A weak website loses bookings to competitors with better-presented work.";
  if (/gym|yoga|pilates|crossfit|fitness|boxing|martial|dance|cycling|spin|climbing|tennis|golf/.test(t))
    return "New members research online before ever visiting. Key concerns: membership/trial signup flow, class schedule clarity, trainer bios, community feel, and 'near me' local search visibility. Most sign-up decisions happen on the website.";
  if (/dentist|doctor|gp|clinic|physio|chiropractor|optician|dermatolog|orthodont|pediatric|audiolog|speech|occupational|fertility|radiology|lab|nursing|urgent care/.test(t))
    return "Patients choose healthcare providers based on trust, credentials, and convenience. Key concerns: online appointment booking, credential display, patient testimonials, insurance information clarity, and Google Maps visibility for 'near me' health searches.";
  if (/vet|animal|pet groom|pet board|dog train|dog daycare/.test(t))
    return "Pet owners are deeply protective and research thoroughly. Key concerns: trust signals (photos, credentials, meet-the-team), booking convenience, clear service descriptions, and reviews from fellow pet owners. First impression online is critical.";
  if (/lawyer|law firm|attorney|solicitor|legal|notary|patent/.test(t))
    return "Prospective clients research extensively before reaching out to any legal professional. Key concerns: practice area clarity, case results and testimonials, approachability, contact form accessibility, and ranking for local legal search queries.";
  if (/hotel|hostel|resort|motel|b&b|bed and breakfast|boutique hotel|serviced apartment|holiday rental/.test(t))
    return "Travellers compare options across multiple sites before booking. Key concerns: direct booking conversion (reducing OTA commission), room photography quality, local attraction content, trust signals, and competing with Booking.com and Airbnb listings.";
  if (/real estate|estate agent|property|mortgage|letting/.test(t))
    return "Buyers and sellers choose agents based on market expertise and trust. Key concerns: property listing presentation, lead capture (valuation requests, viewing bookings), local market authority content, and testimonials from past clients.";
  if (/web design|digital marketing|seo|social media agency|branding|content marketing|ppc|ux design|graphic design|copywriting|app develop|software|it support|ecommerce agency|cybersecurity/.test(t))
    return "Potential clients judge the agency's own website as evidence of their quality. Key concerns: portfolio and case study presentation, clear service definitions, organic lead generation, demonstrating results, and standing out from commodity competitors.";
  if (/clothing|shoe|jewel|boutique|retail|store|shop|furniture|electronics|hardware|bicycle|outdoor|baby|music store|art supply|phone shop|computer|thrift|grocery|wine shop|home decor/.test(t))
    return "Shoppers discover local retail online before visiting or buying. Key concerns: product discoverability, local SEO for 'near me' searches, opening hours and location prominence, online catalogue or e-commerce capability, and Google Shopping presence.";
  if (/plumber|electrician|hvac|air condition|carpenter|handyman|pest control|locksmith|roofing|landscap|window clean|pool|solar|appliance|moving|security|flooring|gutter|contractor|builder|mason|demolition|surveyor|tiling/.test(t))
    return "Homeowners search urgently and often on mobile. Key concerns: instant quote/estimate request, clear service area, emergency availability, licenses and insurance credentials, and reviews from verified local customers. Speed of contact and trust signals win jobs.";
  if (/school|tutor|coaching|education|academy|bootcamp|cooking class|language|driving school|music school|art school|preschool|nursery|daycare|after.school|flight/.test(t))
    return "Parents and students research courses carefully. Key concerns: program and curriculum clarity, instructor credentials, student results and testimonials, enrollment process simplicity, and local SEO for subject + location searches.";
  if (/car dealer|auto repair|car wash|tire|auto parts|motorcycle|car detail|towing|auto glass|car rental|truck|ev charging/.test(t))
    return "Car owners search on mobile in moments of need ('tyre shop near me', 'mechanic near me'). Key concerns: service booking or quote requests, local search visibility, trust signals (certifications, reviews), opening hours prominence, and clear contact options.";
  if (/wedding|event plan|event venue|wedding photo|wedding video|dj|party rental|balloon|photo booth|catering company/.test(t))
    return "Couples and event planners shortlist vendors heavily based on portfolio quality and reviews. Key concerns: gallery/portfolio presentation, package pricing clarity, testimonials, inquiry form accessibility, and ranking for 'wedding photographer [city]' type searches.";
  if (/financial|accountant|tax|bookkeep|payroll|insurance|mortgage broker|investment|currency|loan/.test(t))
    return "Clients choose financial professionals based on trust, credentials, and clarity of services. Key concerns: clear service explanation, regulatory credential display, client testimonials, lead capture (consultation booking), and local search visibility.";
  return "Customers increasingly find and evaluate local businesses online before making contact. Key concerns: local search visibility, trust building through reviews and professional presentation, lead/inquiry capture, and mobile-first experience since most searches happen on phones.";
}

// ── Opening Style Instruction ──────────────────────────────────────────────────
function openingInstruction(opening: string): string {
  switch (opening) {
    case "question":
      return "Open with a single thought-provoking question that makes the reader pause and think about what they might be missing. The question should feel personal and specific, not generic.";
    case "empathy":
      return "Open by acknowledging something genuinely positive about their business — a real observation (their rating, their location, their social presence) — before pivoting to the opportunity.";
    case "data":
      return "Open with the single most striking specific finding you have. Lead with a concrete fact or observation that immediately signals you've actually looked at their business.";
    default: // direct
      return "Get straight to the point. Open directly with the core problem or missed opportunity — no preamble, no flattery.";
  }
}

// ── Urgency Instruction ────────────────────────────────────────────────────────
function urgencyInstruction(urgency: string): string {
  switch (urgency) {
    case "high":
      return "Create a genuine sense of urgency — make clear that every day without fixing this is customers going to competitors. Be direct and specific about the cost of inaction. Don't be pushy, but don't soften it either.";
    case "low":
      return "Keep this low-pressure and relaxed. No urgency whatsoever. Frame it as a friendly observation and an easy offer — the reader should feel zero pressure to act immediately.";
    default: // medium
      return "Mention the opportunity cost of waiting once, lightly — don't dwell on it. The reader should feel gently nudged, not pressured.";
  }
}

// ── Pitch Angle Builder ──────────────────────────────────────────────────────
function buildAngle(
  leadType: WebsiteStatus,
  performance_score: number | null,
): { angle: string; painPoint: string } {
  switch (leadType) {
    case "has_website":
      if (performance_score !== null && performance_score < 50) {
        return {
          angle: "your site is costing you customers",
          painPoint: `Your website scores just ${performance_score}/100 on performance — that means slow loading, frustrated visitors, and lost leads. Here's the proof.`,
        };
      }
      if (performance_score !== null && performance_score <= 69) {
        return {
          angle: "real potential held back by fixable issues",
          painPoint: `Your site has decent bones (${performance_score}/100), but specific issues are dragging down conversions. We've identified exactly what's fixable.`,
        };
      }
      return {
        angle: "solid site with specific wins worth chasing",
        painPoint: `Your site performs well (${performance_score ?? "N/A"}/100), but we've spotted targeted improvements that could push it further ahead of competitors.`,
      };
    case "no_website":
      return {
        angle: "no web presence — you're invisible online",
        painPoint: "You don't have a website. Every potential customer who searches for your business finds nothing — or worse, finds a competitor.",
      };
    case "social_only":
      return {
        angle: "Facebook isn't a website",
        painPoint: "Your business relies on social media alone. But social profiles don't rank in Google, don't build trust like a proper site, and leave money on the table every day.",
      };
    case "platform_only":
      return {
        angle: "you're renting space on someone else's platform",
        painPoint: "You're listed on a booking/delivery directory, but you don't own the relationship with those customers. A real website changes that.",
      };
    default:
      return {
        angle: "let's talk about your web presence",
        painPoint: "We'd love to show you what a proper website could do for your business.",
      };
  }
}

// ── Route ────────────────────────────────────────────────────────────────────

/** Build channel-specific formatting instructions for the Gemini prompt */
function channelInstruction(channel: string, tone: string, length: string, businessName: string): string {
  switch (channel) {
    case "whatsapp":
      return `OUTREACH CHANNEL: WhatsApp Message
FORMAT: Very short message under ${{ short: "40", medium: "60", detailed: "80" }[length] ?? "60"} words.
STYLE: Casual and direct. No formatting, no line breaks. Write like a text message.
No formal greetings or sign-offs. Get straight to the point.
End with a simple question to keep the conversation going.

Return ONLY a valid JSON object, no markdown, no backticks:
{ "subject": "WhatsApp", "body": "your whatsapp message here" }`;
    default: // email
      return `OUTREACH CHANNEL: Email
FORMAT: Subject line + body. ${{ short: "Keep the email under 80 words.", medium: "Keep the email under 150 words.", detailed: "Write a detailed email up to 250 words." }[length] ?? "Keep the email under 150 words."}
${businessName !== "there" ? `Start with: Hi ${businessName} team,` : "Start with: Hi there,"}

Return ONLY a valid JSON object, no markdown, no backticks:
{ "subject": "email subject line here", "body": "full email body here" }`;
  }
}

/** Build a workflow-specific prompt for non-website leads (social_only, no_digital_presence) */
function buildWorkflowPrompt(
  businessName: string,
  businessType: string,
  location: string,
  workflow: string,
  socialPlatforms: string[],
  tone: string,
  length: string,
  channel: string,
  rating: number | null,
  reviewCount: number | null,
  opening: string,
  urgency: string,
  focus: string | undefined,
): string {
  const reviewStr = rating != null && reviewCount != null
    ? `\nGoogle reviews: ${rating.toFixed(1)}★ (${reviewCount.toLocaleString()} reviews)`
    : rating != null
      ? `\nGoogle Rating: ${rating.toFixed(1)}★`
      : reviewCount != null
        ? `\nGoogle reviews: ${reviewCount.toLocaleString()}`
        : "";
  const platformStr = socialPlatforms.length > 0 ? socialPlatforms.join(", ") : "social media";
  const channelFmt = channel === "whatsapp" ? "WhatsApp message" : "email";

  const sharedConfig = `Tone: ${tone} (professional = concise and confident; friendly = warm and approachable; luxury = polished and premium)
${{ short: "Keep it under 80 words.", medium: "Keep it under 150 words.", detailed: "Write up to 250 words." }[length] ?? "Keep it under 150 words."}
Industry context: ${getBusinessTypeContext(businessType)}
Opening style: ${openingInstruction(opening)}
Urgency: ${urgencyInstruction(urgency)}${focus && focus !== "all" ? `\nFocus particularly on: ${focus}.` : ""}`;

  if (workflow === "social_only") {
    return `You are a web agency sales consultant writing outreach ${channelFmt}s. The prospect has an active social media presence but no dedicated website.

Business: ${businessName}
Type: ${businessType}
Location: ${location}
Detected social platforms: ${platformStr}${reviewStr}

Your job is to acknowledge their social media success first, then explain what a website would add that social alone cannot provide.

${sharedConfig}

CRITICAL RULES:
- Follow the opening style instruction above exactly.
- Tailor language and examples specifically for a ${businessType} owner.
- Start by acknowledging their social presence positively.
- Explain that a website adds credibility, search visibility, and lead capture that social platforms can't replace.
- NEVER mention audits, performance scores, SEO scores, LCP, FCP, CLS, TBT, or any technical metrics.
- NEVER mention website issues or problems with their current social presence.
- Focus on the ADDITIONAL value a website provides, not problems with what they have.
- Address the recipient directly.
- End with a soft CTA: offer to discuss how a website could complement their social presence.
- No fluff, no buzzwords, no generic compliments.
- Write like a real person, not a template.

${channelInstruction(channel, tone, length, businessName)}`;
  }

  // no_digital_presence
  return `You are a web agency sales consultant writing outreach ${channelFmt}s. The prospect has no detectable online presence — no website and no social media profiles.

Business: ${businessName}
Type: ${businessType}
Location: ${location}${reviewStr}

Your job is to help them understand the importance of having an online presence in today's market.

${sharedConfig}

CRITICAL RULES:
- Follow the opening style instruction above exactly.
- Tailor language and examples specifically for a ${businessType} owner.
- Focus on visibility, credibility, and lead generation opportunities relevant to their industry.
- Explain that many customers search online before making purchasing decisions.
- NEVER mention audits, performance scores, SEO scores, or any technical metrics.
- NEVER mention website issues since there is no website.
- Be constructive and positive — frame this as an opportunity to establish their digital presence.
- Address the recipient directly.
- End with a soft CTA: offer to discuss how they can establish an online presence.
- No fluff, no buzzwords, no generic compliments.
- Write like a real person, not a template.

${channelInstruction(channel, tone, length, businessName)}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as PitchRequestBody;
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
    } = body;

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

    console.log("[PITCH] Authenticated user:", user.id);

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
      const adminClient = createAdminClient();
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data: cachedPitchData, error: cacheReadError } = await (adminClient.from("pitches") as ReturnType<typeof adminClient.from>)
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

      // 3. Fetch business + latest audit + latest design analysis
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

      promptBusinessName = (business.name as string) ?? "there";
      promptBusinessType = (business.business_type as string) ?? "business";
      promptLocation = (business.city as string) ?? "their market";
      promptWebsite = (business.website as string) ?? "";
      leadType = (business.website_status ?? "unknown") as WebsiteStatus;
      promptRating = business.rating as number | null;
      promptReviewCount = business.review_count as number | null;

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

    // ── Workflow-specific prompts (social_only, no_digital_presence) do NOT
    //     require audit/design data. Check this FIRST so we can skip data validation. ──
    let workflowPromptBuilt = false;
    if (workflow === "social_only" || workflow === "no_digital_presence") {
      workflowPromptBuilt = true;
    }

    // ── Determine which data sources are available (based on context strings
    //     that were populated in the persisted/ephemeral branches above) ─────
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

    // ── Workflow-aware prompt override (social_only, no_digital_presence) ──
    const prompt = workflowPromptBuilt
      ? buildWorkflowPrompt(promptBusinessName, promptBusinessType, promptLocation, workflow ?? "no_digital_presence", socialPlatforms ?? [], tone, length, channel, promptRating, promptReviewCount, opening, urgency, focus)
      : hasAuditData && hasDesignData
      ? // ── Full prompt — both audit + design data available ──
        `You are a web agency sales consultant writing outreach emails that sound like a real human agency owner wrote them. Your job is to translate technical website issues into business problems the prospect cares about.

${promptWebsiteSection}
Type: ${promptBusinessType}
Location: ${promptLocation}${reviewContext}
Website status: ${leadType}
Angle: ${angle}
Pain point summary: ${painPoint}

Data we have:
${auditContext}
${designContext}

${pitchConfig}

CRITICAL RULES:
- Follow the opening style instruction above exactly for the first sentence.
- Tailor language and examples specifically for a ${promptBusinessType} owner — use industry-relevant pain points.
- Write like a real agency owner, NOT like a developer or auditor.
- NEVER list raw technical metrics (scores, LCP, TBT, CLS, PageSpeed numbers). Instead describe the BUSINESS IMPACT.
- Example of what NOT to write: "Your LCP is 4.2s and your TBT is 340ms."
- Example of what TO write: "Your website is loading slowly on phones — visitors are clicking away before seeing your content. That's lost customers every day."
- Address the recipient directly.
- Reference one specific observation from the analysis, framed as a business problem.
- Never sound like a template — make it feel personal and specific to their situation.
- End with a soft CTA: offer a free audit report or a quick call to discuss findings.
- No fluff, no buzzwords, no generic compliments.
- Keep it short and conversational — like a real person wrote it in 2 minutes.

${channelInstruction(channel, tone, length, promptBusinessName)}`
      : hasAuditData
        ? // ── Audit-only fallback — shorter, performance-focused ──
          `You are a web agency sales consultant writing outreach emails that sound like a real human agency owner wrote them. Your job is to translate performance issues into business problems the prospect cares about.

${promptWebsiteSection}
Type: ${promptBusinessType}
Location: ${promptLocation}${reviewContext}
Website status: ${leadType}
Angle: ${angle}
Pain point summary: ${painPoint}

NOTE: This lead has performance audit only — no design analysis yet. Focus exclusively on performance issues.

Performance data:
${auditContext}

${pitchConfig}

CRITICAL RULES:
- Follow the opening style instruction above exactly for the first sentence.
- Tailor language and examples specifically for a ${promptBusinessType} owner.
- Write like a real agency owner, NOT like a developer or auditor.
- NEVER list raw technical metrics (scores, LCP, TBT, CLS, PageSpeed numbers). Instead describe the BUSINESS IMPACT.
- Address the recipient directly.
- Reference the performance issues as a business problem relevant to a ${promptBusinessType}.
- Never sound like a template — make it feel personal and specific to their situation.
- End with a soft CTA: offer a free performance review or a quick call to discuss findings.
- No fluff, no buzzwords, no generic compliments.

${channelInstruction(channel, tone, length, promptBusinessName)}`
        : // ── Design-only fallback — shorter, design-focused ──
          `You are a web agency sales consultant writing outreach emails that sound like a real human agency owner wrote them. Your job is to translate design issues into business problems the prospect cares about.

${promptWebsiteSection}
Type: ${promptBusinessType}
Location: ${promptLocation}${reviewContext}
Website status: ${leadType}
Angle: ${angle}
Pain point summary: ${painPoint}

NOTE: This lead has design analysis only — no performance audit. Focus exclusively on design issues.

Design data:
${designContext}

${pitchConfig}

CRITICAL RULES:
- Follow the opening style instruction above exactly for the first sentence.
- Tailor language and examples specifically for a ${promptBusinessType} owner.
- Write like a real agency owner, NOT like a developer or auditor.
- NEVER list raw design scores. Instead describe the VISUAL IMPACT on the business.
- Address the recipient directly.
- Reference one specific design issue as a business problem relevant to a ${promptBusinessType}.
- Never sound like a template — make it feel personal and specific to their situation.
- End with a soft CTA: offer a free design review or a quick call to discuss findings.
- No fluff, no buzzwords, no generic compliments.

${channelInstruction(channel, tone, length, promptBusinessName)}`;

    // 4. Call Gemini API (correct model + header auth)
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
        console.error("[PITCH] JSON parse failed. Raw Gemini response:", rawText);
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
      const adminSupabase = createAdminClient();
      const pitchId = crypto.randomUUID();
      const now = new Date().toISOString();

      const { error: insertError } = await (adminSupabase.from("pitches") as ReturnType<typeof adminSupabase.from>).insert({
        id: pitchId,
        user_id: user.id,
        business_id: persistedBusinessId,
        subject: parsedPitch.subject,
        body: parsedPitch.body,
        tone,
        channel,
        lead_type: leadType,
        pitch_status: "draft",
        created_at: now,
      });

      if (insertError) {
        console.error("[PITCH] CRITICAL: insert failed", { code: insertError.code, message: insertError.message, details: insertError.details, hint: insertError.hint });
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
