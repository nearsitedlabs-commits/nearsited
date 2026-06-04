import { websiteWeakness, businessViabilityMultiplier } from "@/lib/scoring";

export type AuditBusiness = {
  id: string;
  name: string;
  business_type: string | null;
  city: string | null;
  website: string | null;
  website_status: string | null;
  rating: number | null;
  review_count: number | null;
  performance_score: number | null;
  design_score: number | null;
  opportunity_score: number | null;
  flagged_for_outreach: boolean;
  audited_at: string | null;
  design_analyzed_at: string | null;
  discovered_at: string;
};

export type ScoreComponent = {
  label: string;
  rawValue: number;
  displayValue: string;
  description: string;
};

export type ScoreFlag = {
  type: "high_warning" | "low_warning" | "suspicious" | "cliff" | "info";
  message: string;
};

export type ScoreExplanation = {
  method: "estimated" | "verified";
  displayScore: number;
  storedScore: number | null;
  components: ScoreComponent[];
  formula: string;
  flags: ScoreFlag[];
};

// ── Factor helpers ────────────────────────────────────────────────────────────

function redesignInfo(ws: string | null, url: string | null): { factor: number; label: string } {
  const u = (url ?? "").toLowerCase();
  if (ws === "no_website")    return { factor: 0.95, label: "No website — complete new build needed" };
  if (ws === "social_only")   return { factor: 0.85, label: "Social media only — no owned web presence" };
  if (ws === "platform_only") return { factor: 0.75, label: "Platform/directory listing — no custom site" };
  if (ws === "has_website") {
    if (u.startsWith("http://") && !u.startsWith("https://")) return { factor: 0.65, label: "HTTP-only site — outdated, likely needs full rebuild" };
    if (/wixsite\.com|squarespace\.com|godaddysites\.com|weebly\.com|business\.site/.test(u)) return { factor: 0.60, label: "DIY builder site — limited professional quality" };
    return { factor: 0.40, label: "Established website — quality unknown without audit" };
  }
  return { factor: 0.40, label: "Unknown web presence" };
}

function estimatedViabilityInfo(reviews: number, rating: number): { factor: number; label: string } {
  if (reviews >= 50 && rating >= 4.0) return { factor: 1.00, label: "50+ reviews & 4★+ — highly active, excellent reputation" };
  if (reviews >= 50)                  return { factor: 0.75, label: "50+ reviews — high activity, average rating" };
  if (reviews >= 20 && rating >= 4.0) return { factor: 0.75, label: "20–49 reviews & 4★+ — moderate activity, excellent rating" };
  if (reviews >= 20)                  return { factor: 0.60, label: "20–49 reviews — moderate activity, average rating" };
  if (reviews >= 5  && rating >= 4.0) return { factor: 0.55, label: "5–19 reviews & 4★+ — some activity, excellent rating" };
  if (reviews >= 5)                   return { factor: 0.40, label: "5–19 reviews — some activity, average rating" };
  if (rating >= 4.0)                  return { factor: 0.25, label: "<5 reviews but 4★+ — few data points, good signal" };
  return                              { factor: 0.15, label: "Very few reviews + low rating — unproven business" };
}

function reviewScoreLabel(reviews: number): { score: number; label: string } {
  if (reviews >= 100) return { score: 1.00, label: "100+ reviews (tier 6)" };
  if (reviews >= 50)  return { score: 0.90, label: "50–99 reviews (tier 5)" };
  if (reviews >= 20)  return { score: 0.75, label: "20–49 reviews (tier 4)" };
  if (reviews >= 10)  return { score: 0.60, label: "10–19 reviews (tier 3)" };
  if (reviews >= 5)   return { score: 0.45, label: "5–9 reviews (tier 2)" };
  if (reviews >= 1)   return { score: 0.30, label: "1–4 reviews (tier 1)" };
  return                     { score: 0.20, label: "0 reviews (tier 0)" };
}

function ratingScoreLabel(rating: number): { score: number; label: string } {
  if (rating >= 4.0) return { score: 1.00, label: `${rating}★ (≥4.0 tier)` };
  if (rating >= 3.5) return { score: 0.85, label: `${rating}★ (3.5–3.9 tier)` };
  if (rating >= 3.0) return { score: 0.65, label: `${rating}★ (3.0–3.4 tier)` };
  if (rating >= 2.0) return { score: 0.40, label: `${rating}★ (2.0–2.9 tier)` };
  return                    { score: 0.25, label: `${rating}★ (<2.0 tier)` };
}

function weaknessLabel(q: number, weakness: number): string {
  if (q < 40) return `Quality ${q}/100 (poor) → ${weakness}/100 weakness — strong redesign signal`;
  if (q <= 60) return `Quality ${q}/100 (mediocre) → ${weakness}/100 weakness — solid redesign opportunity`;
  if (q <= 80) return `Quality ${q}/100 (decent) → ${weakness}/100 weakness — moderate potential`;
  return `Quality ${q}/100 (good) → ${weakness}/100 weakness — low redesign need`;
}

// ── Flag detection ────────────────────────────────────────────────────────────

function computeFlags(biz: AuditBusiness, displayScore: number, method: "estimated" | "verified"): ScoreFlag[] {
  const flags: ScoreFlag[] = [];
  const ws = biz.website_status;
  const reviews = biz.review_count ?? 0;
  const rating = biz.rating ?? 0;
  const quality = biz.performance_score;

  // Over-scoring: good website quality but still high opportunity score
  if (displayScore >= 70 && ws === "has_website" && quality !== null && quality >= 70) {
    flags.push({ type: "high_warning", message: `Scored ${displayScore} but website quality is ${quality}/100 — business likely already has adequate digital presence. Low real-world opportunity.` });
  }

  // Under-scoring: no web presence but active business
  if (displayScore < 45 && (ws === "no_website" || ws === "social_only") && reviews >= 10) {
    flags.push({ type: "low_warning", message: `Scored only ${displayScore} despite no real website and ${reviews} reviews. Expected 50+. Viability score is suppressing a clear redesign opportunity.` });
  }

  // No website with very low overall score
  if (displayScore < 30 && ws === "no_website") {
    flags.push({ type: "low_warning", message: `No website business scored only ${displayScore}. Very low viability (${reviews} reviews, ${rating}★) — risky prospect but redesign need is real.` });
  }

  // Review count threshold cliffs (within ±3 of a threshold)
  const THRESHOLDS = [5, 10, 20, 50, 100];
  for (const t of THRESHOLDS) {
    if (reviews >= t - 3 && reviews <= t + 3 && reviews !== t) {
      flags.push({ type: "cliff", message: `Review count (${reviews}) is near the ${t}-review scoring threshold — score will jump significantly when crossed.` });
    }
  }

  // Large gap between estimated vs verified score
  if (method === "verified" && quality !== null) {
    const rd = redesignInfo(ws, biz.website);
    const vi = estimatedViabilityInfo(reviews, rating);
    const estimated = Math.round(rd.factor * vi.factor * 100);
    const diff = displayScore - estimated;
    if (Math.abs(diff) > 25) {
      flags.push({ type: "suspicious", message: `Audit shifted score by ${diff > 0 ? "+" : ""}${diff} pts (estimated: ${estimated} → verified: ${displayScore}). Large change — website quality differs significantly from what the URL suggested.` });
    }
  }

  // Unaudited website — score is imprecise
  if (ws === "has_website" && !biz.audited_at) {
    flags.push({ type: "info", message: "Website not audited — redesign demand uses URL pattern (0.40–0.65). Run audit to get precise quality gap score." });
  }

  // Platform-only scored high — might be intentional platform businesses
  if (ws === "platform_only" && displayScore >= 65) {
    flags.push({ type: "info", message: "Platform-only business scored high. Verify this isn't an Airbnb host, Etsy seller, or Booking.com hotel — they may intentionally avoid a custom website." });
  }

  // Near-perfect score sanity check
  if (displayScore >= 90) {
    flags.push({ type: "info", message: `Near-perfect score (${displayScore}/100). Confirm this is a reachable local business before cold outreach.` });
  }

  return flags;
}

// ── Main explainer ────────────────────────────────────────────────────────────

export function explainScore(biz: AuditBusiness): ScoreExplanation {
  const reviews = biz.review_count ?? 0;
  const rating = biz.rating ?? 0;

  // Verified path: business has been audited — use computeOpportunityScore formula
  if (biz.opportunity_score != null && biz.performance_score != null) {
    const quality = biz.performance_score;
    const weakness = websiteWeakness(quality);
    const viability = businessViabilityMultiplier(reviews, rating);
    const displayScore = Math.round(weakness * viability);

    const revInfo = reviewScoreLabel(reviews);
    const ratInfo = ratingScoreLabel(rating);
    const reviewContrib = parseFloat((revInfo.score * 0.7).toFixed(3));
    const ratingContrib = parseFloat((ratInfo.score * 0.3).toFixed(3));

    return {
      method: "verified",
      displayScore,
      storedScore: biz.opportunity_score,
      components: [
        { label: "Website Quality Gap",  rawValue: weakness,      displayValue: `${weakness}/100`,                   description: weaknessLabel(quality, weakness) },
        { label: "Review Count Signal",  rawValue: revInfo.score, displayValue: `${(revInfo.score * 100).toFixed(0)}%`, description: `${revInfo.label} × 70% weight = ${(reviewContrib * 100).toFixed(1)}%` },
        { label: "Rating Signal",        rawValue: ratInfo.score, displayValue: `${(ratInfo.score * 100).toFixed(0)}%`, description: `${ratInfo.label} × 30% weight = ${(ratingContrib * 100).toFixed(1)}%` },
        { label: "Business Viability",   rawValue: viability,     displayValue: `${(viability * 100).toFixed(1)}%`,     description: `(${revInfo.score} × 0.7) + (${ratInfo.score} × 0.3) = ${viability.toFixed(3)}` },
      ],
      formula: `websiteWeakness(${quality}) × businessViability(${reviews}rev, ${rating}★) = ${weakness} × ${viability.toFixed(3)} = ${displayScore}`,
      flags: computeFlags(biz, displayScore, "verified"),
    };
  }

  // Estimated path: no audit — use estimatedOpportunity formula
  const rd = redesignInfo(biz.website_status, biz.website);
  const vi = estimatedViabilityInfo(reviews, rating);
  const displayScore = Math.round(rd.factor * vi.factor * 100);

  return {
    method: "estimated",
    displayScore,
    storedScore: biz.opportunity_score,
    components: [
      { label: "Redesign Demand",   rawValue: rd.factor, displayValue: `${(rd.factor * 100).toFixed(0)}%`,  description: rd.label },
      { label: "Business Viability", rawValue: vi.factor, displayValue: `${(vi.factor * 100).toFixed(0)}%`, description: vi.label },
    ],
    formula: `redesignDemand(${(rd.factor * 100).toFixed(0)}%) × businessViability(${(vi.factor * 100).toFixed(0)}%) = ${displayScore}`,
    flags: computeFlags(biz, displayScore, "estimated"),
  };
}

// ── Aggregate audit report ────────────────────────────────────────────────────

export type AuditReport = {
  totalBusinesses: number;
  avgScore: number;
  flaggedCount: number;
  warningCount: number;
  byStatus: { status: string; count: number; avgScore: number; flaggedCount: number }[];
  systematicIssues: { title: string; count: number; severity: "high" | "medium" | "low"; description: string }[];
  recommendations: { title: string; current: string; suggested: string; impact: "high" | "medium" | "low" }[];
  cliffCases: number;
  scoringConfidence: number; // 0-100
};

export function generateAuditReport(businesses: AuditBusiness[], explanations: ScoreExplanation[]): AuditReport {
  const total = businesses.length;
  const avgScore = total > 0 ? Math.round(businesses.reduce((s, b, i) => s + explanations[i].displayScore, 0) / total) : 0;

  const flagged = explanations.filter(e => e.flags.some(f => f.type === "high_warning" || f.type === "low_warning"));
  const warnings = explanations.filter(e => e.flags.some(f => f.type === "high_warning" || f.type === "low_warning" || f.type === "suspicious"));
  const cliffs = explanations.filter(e => e.flags.some(f => f.type === "cliff"));

  const statusGroups = ["no_website", "social_only", "platform_only", "has_website", "unknown"];
  const byStatus = statusGroups.map((status) => {
    const bizList = businesses.filter((b, i) => (b.website_status ?? "unknown") === status);
    const exps = bizList.map((b) => explanations[businesses.indexOf(b)]);
    const avg = exps.length > 0 ? Math.round(exps.reduce((s, e) => s + e.displayScore, 0) / exps.length) : 0;
    const fc = exps.filter(e => e.flags.some(f => f.type === "high_warning" || f.type === "low_warning")).length;
    return { status, count: bizList.length, avgScore: avg, flaggedCount: fc };
  }).filter(g => g.count > 0);

  const unauditedWebsites = businesses.filter(b => b.website_status === "has_website" && !b.audited_at).length;
  const overScoredGoodSites = businesses.filter((b, i) =>
    b.website_status === "has_website" &&
    (b.performance_score ?? 0) >= 70 &&
    explanations[i].displayScore >= 70
  ).length;

  const systematicIssues = [
    {
      title: "Review count cliff effects",
      count: cliffs.length,
      severity: "medium" as const,
      description: `${cliffs.length} businesses are within ±3 reviews of a scoring threshold (5, 10, 20, 50, 100). A single new review can cause a large score jump that doesn't reflect real viability change.`,
    },
    ...(unauditedWebsites > 0 ? [{
      title: "Unaudited websites using estimated redesign demand",
      count: unauditedWebsites,
      severity: "high" as const,
      description: `${unauditedWebsites} businesses with websites have never been audited. Their redesign demand factor is estimated from URL patterns only (0.40–0.65), which may significantly under-score or over-score.`,
    }] : []),
    ...(overScoredGoodSites > 0 ? [{
      title: "Good websites flagged as high opportunity",
      count: overScoredGoodSites,
      severity: "high" as const,
      description: `${overScoredGoodSites} businesses with quality scores ≥70 are ranked as high opportunities (score ≥70). These businesses likely don't need a redesign — they're false positives.`,
    }] : []),
    {
      title: "Industry multiplier missing",
      count: total,
      severity: "low" as const,
      description: "All industries are treated identically. Restaurants, plumbers, and dentists are typically far better web design prospects than banks or chain stores. No industry signal in the formula.",
    },
    {
      title: "No penalty for strong existing SEO presence",
      count: 0,
      severity: "medium" as const,
      description: "A business with good PageSpeed but strong organic rankings has less need for a rebuild. Current formula only uses performance score, not SEO score, when computing website weakness.",
    },
  ];

  const recommendations = [
    {
      title: "Replace review count thresholds with a smooth curve",
      current: "Step ladder: 0-1 reviews=0.2, 1-4=0.3, 5-9=0.45, 10-19=0.6, 20-49=0.75, 50-99=0.9, 100+=1.0",
      suggested: "Logarithmic curve: min(1.0, Math.log(reviews + 2) / Math.log(102)) — produces 0.22 at 1 review, 0.56 at 10, 0.74 at 30, 0.90 at 100. No cliffs.",
      impact: "medium" as const,
    },
    {
      title: "Cap opportunity score when quality score is ≥80",
      current: "High quality score produces low websiteWeakness, but multiplier can still push final score to 50+",
      suggested: "If performance_score ≥ 80 AND seo_score ≥ 75 (both audited), hard-cap opportunity at 20. Framing: 'not a good prospect.'",
      impact: "high" as const,
    },
    {
      title: "Add industry opportunity multiplier",
      current: "No industry signal in formula",
      suggested: "High-opportunity industries (restaurants, dental, legal, plumbing, salons) → ×1.15. Low-opportunity (banks, utilities, chains) → ×0.75. Source from business_type field.",
      impact: "medium" as const,
    },
    {
      title: "For unaudited websites, use middle-of-range default (0.55)",
      current: "Unaudited established websites default to 0.40 redesign factor — assumes quality is good",
      suggested: "Use 0.55 (midpoint of the 0.40–0.70 plausible range) for unaudited websites. This is the honest 'we don't know' position and avoids systematic under-scoring.",
      impact: "high" as const,
    },
    {
      title: "Surface SEO score in opportunity calculation",
      current: "websiteWeakness uses performance_score only",
      suggested: "Use min(performance_score, seo_score) as the quality input — a site with good performance but terrible SEO is still a strong redesign opportunity.",
      impact: "medium" as const,
    },
  ];

  // Confidence: penalise for each systematic issue found
  let confidence = 85;
  if (overScoredGoodSites > 0) confidence -= 15;
  if (unauditedWebsites > total * 0.3) confidence -= 10;
  if (cliffs.length > total * 0.2) confidence -= 5;
  confidence = Math.max(30, confidence);

  return {
    totalBusinesses: total,
    avgScore,
    flaggedCount: flagged.length,
    warningCount: warnings.length,
    byStatus,
    systematicIssues: systematicIssues.filter(i => i.count > 0 || i.severity !== "medium"),
    recommendations,
    cliffCases: cliffs.length,
    scoringConfidence: confidence,
  };
}
