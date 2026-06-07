/**
 * Nearsited Scoring Library
 *
 * Single source of truth for all score math. Never inline score computations
 * elsewhere — import these functions instead.
 *
 * Score formulas defined in docs/SCHEMA.md §9, docs/CLAUDE.md §Score Model.
 * Colour classes reference CSS custom properties from globals.css.
 */

// ── Types ────────────────────────────────────────────────────────────────────

export type CriteriaScores = {
  modernity: number;
  readability: number;
  cta: number;
  hierarchy: number;
  trust: number;
};

export type UxCriteriaScores = {
  navigation: number;
  cta_flow: number;
  form_experience: number;
  interaction_feedback: number;
  scroll_experience: number;
};

export type DesignIssue = {
  title: string;
  detail: string;
  point_deduction?: number;
  impact?: "High" | "Medium" | "Low";
};

export type OverallInput = {
  performance: number;
  seo: number;
  mobile: number;
  uxDesign: number;
  trust: number;
};

// ── Score Labels & Colors ────────────────────────────────────────────────────

export type ScoreLabel = "Poor" | "Needs Improvement" | "Good" | "Strong";

/**
 * Returns the human-readable label for a score (0–100).
 * 0–39 Poor · 40–69 Needs Improvement · 70–84 Good · 85–100 Strong
 */
export function scoreLabel(score: number): ScoreLabel {
  if (score >= 85) return "Strong";
  if (score >= 70) return "Good";
  if (score >= 40) return "Needs Improvement";
  return "Poor";
}

export type ScoreColor = "red" | "amber" | "green" | "emerald";

/**
 * Returns a colour identifier for the score threshold.
 * Poor=red, Needs Improvement=amber, Good=green, Strong=emerald
 */
export function scoreColor(score: number): ScoreColor {
  if (score >= 85) return "emerald";
  if (score >= 70) return "green";
  if (score >= 40) return "amber";
  return "red";
}

/**
 * Returns Tailwind-compatible colour classes for the score label/ring.
 * Uses CSS custom properties from globals.css for dark-theme consistency.
 */
export function scoreColorClasses(score: number): {
  text: string;
  border: string;
  bg: string;
  ring: string;
} {
  const label = scoreLabel(score);
  switch (label) {
    case "Strong":
      return {
        text: "text-[var(--score-good)]",
        border: "border-[var(--score-good)]",
        bg: "bg-[var(--score-good-tint)]",
        ring: "stroke-[var(--score-good)]",
      };
    case "Good":
      return {
        text: "text-[var(--score-good)]",
        border: "border-[var(--score-good)]",
        bg: "bg-[var(--score-good-tint)]",
        ring: "stroke-[var(--score-good)]",
      };
    case "Needs Improvement":
      return {
        text: "text-[var(--score-mid)]",
        border: "border-[var(--score-mid)]",
        bg: "bg-[var(--score-mid-tint)]",
        ring: "stroke-[var(--score-mid)]",
      };
    case "Poor":
      return {
        text: "text-[var(--score-high)]",
        border: "border-[var(--score-high)]",
        bg: "bg-[var(--score-high-tint)]",
        ring: "stroke-[var(--score-high)]",
      };
  }
}

// ── Individual Score Computations ─────────────────────────────────────────────

/**
 * Compute the UX/Design score from per-criterion scores (1–10 each).
 * Formula: round((modernity + readability + cta + hierarchy) / 4 * 10)
 */
export function uxDesignScore(criteria: CriteriaScores): number {
  const avg = (criteria.modernity + criteria.readability + criteria.cta + criteria.hierarchy) / 4;
  return Math.round(avg * 10);
}

/**
 * Compute the Trust score from the trust criterion (1–10).
 * Formula: round(trust * 10)
 */
export function trustScore(criteria: Pick<CriteriaScores, "trust">): number {
  return Math.round(criteria.trust * 10);
}

/**
 * Compute the UX interaction score from per-criterion scores (1–10 each).
 * Formula: round((navigation + cta_flow + form_experience + interaction_feedback + scroll_experience) / 5 * 10)
 */
export function uxInteractionScore(criteria: UxCriteriaScores): number {
  const avg =
    (criteria.navigation +
      criteria.cta_flow +
      criteria.form_experience +
      criteria.interaction_feedback +
      criteria.scroll_experience) /
    5;
  return Math.round(avg * 10);
}

// ── Aggregated Scores ────────────────────────────────────────────────────────

/**
 * Compute the Overall score from the six core scores.
 * Formula: perf·0.25 + seo·0.15 + mobile·0.25 + uxdesign·0.20 + trust·0.15
 */
export function computeOverall(input: OverallInput): number {
  const weighted =
    input.performance * 0.25 +
    input.seo * 0.15 +
    input.mobile * 0.25 +
    input.uxDesign * 0.20 +
    input.trust * 0.15;

  return Math.round(weighted);
}

/**
 * Compute the projected score if top issues were fixed.
 * Projection = min(95, score + sum(top 3 issues' point_deduction))
 */
export function projection(score: number, issues: DesignIssue[]): number {
  const deductions = issues
    .map((i) => i.point_deduction ?? 0)
    .sort((a, b) => b - a) // descending
    .slice(0, 3);

  const sumDeductions = deductions.reduce((sum, d) => sum + d, 0);
  return Math.min(95, score + sumDeductions);
}

/**
 * Blended quality number for the UI.
 * When UX analysis exists: design·0.5 + ux·0.5
 * When UX doesn't exist: design score stands alone
 */
export function blendedQuality(designScore: number, uxScore: number | null | undefined): number {
  if (uxScore == null) return designScore;
  return Math.round(designScore * 0.5 + uxScore * 0.5);
}

// ── Opportunity Scoring (website weakness × business viability) ─────────────────

/**
 * Converts website quality score into a "weakness signal" for opportunity scoring.
 * Peaks around quality 40-45 (bad enough to need work, good enough to show business cares).
 * Falls off at both extremes: very low scores suggest neglected/unviable businesses,
 * very high scores suggest no redesign needed.
 *
 * Returns 0–100.
 */
export function websiteWeakness(qualityScore: number): number {
  const q = Math.max(0, Math.min(100, qualityScore));
  if (q < 40) {
    // Rising slope: q=0 → 40, q=40 → 100
    return Math.round(40 + (q / 40) * 60);
  } else if (q <= 60) {
    // Plateau and start of decline: q=40 → 100, q=60 → 75
    return Math.round(100 - ((q - 40) / 20) * 25);
  } else {
    // Sharp decline: q=60 → 75, q=100 → 0
    return Math.max(0, Math.round(75 - ((q - 60) / 40) * 75));
  }
}

/**
 * Multiplier for business viability — proxy for "will they answer the pitch?"
 * Uses Google review count (primary signal) and rating (secondary signal).
 * A business with 50+ reviews is clearly active. A business with 1 review is a gamble.
 *
 * Returns 0.2–1.0.
 */
export function businessViabilityMultiplier(
  reviewCount: number = 0,
  rating: number = 0
): number {
  const reviewScore =
    reviewCount >= 100 ? 1.0 :
    reviewCount >= 50  ? 0.9 :
    reviewCount >= 20  ? 0.75 :
    reviewCount >= 10  ? 0.6 :
    reviewCount >= 5   ? 0.45 :
    reviewCount >= 1   ? 0.3 :
    0.2;

  const ratingScore =
    rating >= 4.0 ? 1.0 :
    rating >= 3.5 ? 0.85 :
    rating >= 3.0 ? 0.65 :
    rating >= 2.0 ? 0.4 :
    0.25;

  return parseFloat(((reviewScore * 0.7) + (ratingScore * 0.3)).toFixed(3));
}

// ── Industry Multiplier ────────────────────────────────────────────────────────

/**
 * Industry-specific opportunity multipliers.
 *
 * Certain verticals are far more likely to invest in web redesign services.
 * These multipliers adjust the opportunity score accordingly.
 *
 * High-opportunity verticals (dentists, lawyers, home services) get a boost.
 * Low-opportunity verticals (banks, chains, government) get a penalty.
 */
export const INDUSTRY_MULTIPLIERS: Record<string, number> = {
  // High opportunity — strong willingness to invest in web presence
  dentist: 1.15, orthodontist: 1.15, chiropractor: 1.15,
  lawyer: 1.15, "personal injury lawyer": 1.15,
  "divorce lawyer": 1.15, "criminal defense lawyer": 1.15,
  "estate planning lawyer": 1.15,

  // High — competitive local service verticals
  plumber: 1.10, electrician: 1.10, hvac: 1.10,
  "hvac contractor": 1.10, roofer: 1.10, painter: 1.10,
  landscaper: 1.10, "lawn care service": 1.10,
  "general contractor": 1.10, "home inspector": 1.10,
  "pest control service": 1.10, "carpet cleaner": 1.10,

  // High — restaurants, hospitality, personal care
  restaurant: 1.10, cafe: 1.10, bar: 1.10,
  bakery: 1.10, "pizza restaurant": 1.10, "fast food restaurant": 1.10,
  salon: 1.10, barber: 1.10, "hair salon": 1.10,
  "nail salon": 1.10, "day spa": 1.10, "massage therapist": 1.10,
  "tanning salon": 1.10, "tattoo shop": 1.10,
  gym: 1.10, "personal trainer": 1.10, "yoga studio": 1.10,
  "pilates studio": 1.10, "crossfit gym": 1.10,

  // Medium-high — competitive professional services
  "auto repair": 1.05, mechanic: 1.05, "car dealer": 1.05,
  "used car dealer": 1.05, "body shop": 1.05,
  "real estate agent": 1.05, "real estate agency": 1.05,
  "property management": 1.05,
  accountant: 1.05, "financial planner": 1.05,
  "mortgage broker": 1.05, "insurance agent": 1.05,

  // Low — unlikely to invest in web redesign
  bank: 0.80, "credit union": 0.80,
  "investment firm": 0.80,
  "government office": 0.75,
  "post office": 0.75,
  "non profit": 0.80, church: 0.80,
  school: 0.75, university: 0.75, college: 0.75,
  "chain store": 0.80, supermarket: 0.80,
  "department store": 0.80, "shopping mall": 0.80,
  "big box store": 0.80,
};

/** Default multiplier when industry isn't explicitly listed. */
export const DEFAULT_INDUSTRY_MULTIPLIER = 1.0;

/**
 * Returns the industry multiplier for a given business type value.
 * Matches by exact value first, then falls back to 1.0.
 * The value should be the raw `business_type` string from the DB (lowercase).
 */
export function getIndustryMultiplier(businessType?: string | null): number {
  if (!businessType) return DEFAULT_INDUSTRY_MULTIPLIER;
  const key = businessType.toLowerCase().trim();
  return INDUSTRY_MULTIPLIERS[key] ?? DEFAULT_INDUSTRY_MULTIPLIER;
}

/**
 * Blends performance and design scores into a single quality signal for opportunity scoring.
 *
 * Using max(mobile, desktop) inflates quality → collapses weakness → understates opportunity.
 * This helper averages mobile+desktop perf (not max) and blends in design when present.
 *
 * Weights: perf 60%, design 40% (performance drives UX speed; design drives agency pitch value).
 * Returns 0–100.
 */
export function blendQualityForOpportunity(
  mobilePerf: number | null,
  desktopPerf: number | null,
  designScore: number | null
): number {
  const avgPerf =
    mobilePerf != null && desktopPerf != null ? (mobilePerf + desktopPerf) / 2
    : mobilePerf ?? desktopPerf ?? null;

  if (avgPerf != null && designScore != null && designScore > 0) {
    return Math.round(avgPerf * 0.6 + designScore * 0.4);
  }
  if (avgPerf != null) return Math.round(avgPerf);
  if (designScore != null && designScore > 0) return designScore;
  return 50;
}

/**
 * Computes the opportunity score — how attractive this lead is for a redesign agency.
 * Combines website weakness with business viability and industry multiplier.
 *
 * High score = bad website + active business + high-opportunity vertical = strong pitch.
 * Low score = either too neglected or too good, or low-opportunity vertical.
 *
 * Returns 0–100.
 */
export function computeOpportunityScore(
  qualityScore: number,
  reviewCount: number = 0,
  rating: number = 0,
  businessType?: string | null
): number {
  const weakness = websiteWeakness(qualityScore);
  const viability = businessViabilityMultiplier(reviewCount, rating);
  const industry = getIndustryMultiplier(businessType);
  return Math.round(weakness * viability * industry);
}

/**
 * Human-readable label for the opportunity score.
 * These thresholds are separate from scoreLabel() which describes website quality.
 */
export function opportunityLabel(opportunityScore: number): string {
  if (opportunityScore >= 70) return 'High Opportunity';
  if (opportunityScore >= 45) return 'Good Opportunity';
  if (opportunityScore >= 25) return 'Medium Opportunity';
  return 'Low Opportunity';
}

/**
 * CSS variable color for the opportunity badge.
 * Maps to the semantic badge tokens in globals.css.
 */
export function opportunityBadgeVariant(
  opportunityScore: number
): 'green' | 'amber' | 'indigo' | 'red' {
  if (opportunityScore >= 70) return 'green';
  if (opportunityScore >= 45) return 'amber';
  if (opportunityScore >= 25) return 'indigo';
  return 'red';
}

// ── Pre-Audit Estimated Opportunity Score ─────────────────────────────────────

/**
 * Estimates a business's opportunity score BEFORE an audit exists.
 * Uses website_status and URL patterns as a redesign probability signal,
 * and review count + rating as a viability signal.
 *
 * Returns 0–100. Used on the Discover page to show a preliminary
 * opportunity estimate until the user clicks "Analyse Opportunity".
 */
export function estimatedOpportunity(business: {
  website_status: string;
  website: string | null;
  rating: number | null;
  user_ratings_total: number | null;
}): number {
  const reviews = business.user_ratings_total ?? 0;
  const rating = business.rating ?? 0;
  let viability = 0.15;
  if (reviews >= 50 && rating >= 4.0) viability = 1.0;
  else if (reviews >= 50) viability = 0.75;
  else if (reviews >= 20 && rating >= 4.0) viability = 0.75;
  else if (reviews >= 20) viability = 0.6;
  else if (reviews >= 5 && rating >= 4.0) viability = 0.55;
  else if (reviews >= 5) viability = 0.4;
  else if (rating >= 4.0) viability = 0.25;

  // Redesign signal ranked by opportunity value, consistent with product positioning:
  // no_website > social_only > platform_only > bad_website > generic_website
  let redesign = 0.4;
  const url = (business.website ?? "").toLowerCase();
  if (business.website_status === "no_website") {
    redesign = 0.95;
  } else if (business.website_status === "social_only") {
    redesign = 0.85;
  } else if (business.website_status === "platform_only") {
    redesign = 0.75;
  } else if (business.website_status === "has_website") {
    if (url.startsWith("http://") && !url.startsWith("https://")) redesign = 0.65;
    else if (/wixsite\.com|squarespace\.com|godaddysites\.com|weebly\.com|business\.site/.test(url)) redesign = 0.60;
    else redesign = 0.40;
  }

  return Math.round(viability * redesign * 100);
}
