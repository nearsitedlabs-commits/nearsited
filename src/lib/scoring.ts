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

/**
 * Computes the opportunity score — how attractive this lead is for a redesign agency.
 * Combines website weakness with business viability.
 *
 * High score = bad website + active business = strong redesign pitch candidate.
 * Low score = either too neglected (business doesn't care) or too good (doesn't need work).
 *
 * Returns 0–100.
 */
export function computeOpportunityScore(
  qualityScore: number,
  reviewCount: number = 0,
  rating: number = 0
): number {
  const weakness = websiteWeakness(qualityScore);
  const viability = businessViabilityMultiplier(reviewCount, rating);
  return Math.round(weakness * viability);
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
