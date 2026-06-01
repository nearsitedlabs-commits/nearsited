/**
 * Nearsited Opportunity Insights
 *
 * Client-side insight generation that produces short plain-English explanations
 * of why a lead represents an opportunity, based on available score data and
 * website classification.
 *
 * No API call needed — all logic is deterministic from scores + website_status.
 */

export type OpportunityInsight = {
  /** One-sentence summary of the opportunity */
  summary: string;
  /** Short label for the insight type */
  type: "performance" | "design" | "trust" | "mobile" | "seo" | "presence" | "social" | "platform" | "mixed";
  /** Estimated upside — the potential score if top issues are fixed */
  potentialScore: number | null;
  /** The delta: potentialScore - currentScore */
  delta: number | null;
};

/**
 * Generate an opportunity insight for a business lead.
 *
 * @param websiteStatus - From classifyWebsite() — "has_website" | "no_website" | "social_only" | "platform_only"
 * @param performanceScore  - PageSpeed performance score (0–100), nullable
 * @param designScore       - Gemini design/UX score (0–100), nullable
 * @param mobileScore       - PageSpeed mobile score (0–100), nullable
 * @param seoScore          - PageSpeed SEO score (0–100), nullable
 * @param trustScore        - Gemini trust score (0–100), nullable
 */
export function opportunityInsight(
  websiteStatus: string,
  performanceScore: number | null,
  designScore: number | null,
  mobileScore: number | null,
  seoScore: number | null,
  trustScore: number | null,
): OpportunityInsight {
  // Compute the "current" overall score from whatever we have
  const currentScore = computeEffectiveScore(performanceScore, designScore, mobileScore, seoScore, trustScore);
  const { potentialScore, delta } = computePotentialAndDelta(currentScore, websiteStatus);

  // — Presence-based insights (no audit data needed) —
  if (websiteStatus === "no_website") {
    return {
      summary: "No website exists — this business is missing every online opportunity. A strong site would unlock discovery, credibility, and leads.",
      type: "presence",
      potentialScore,
      delta,
    };
  }

  if (websiteStatus === "social_only") {
    return {
      summary: "Social media alone isn't a website — this business is renting its online presence. A dedicated site builds trust and ownership.",
      type: "social",
      potentialScore,
      delta,
    };
  }

  if (websiteStatus === "platform_only") {
    return {
      summary: "Relying on a third-party platform limits control and branding. A custom website would establish independence and professionalism.",
      type: "platform",
      potentialScore,
      delta,
    };
  }

  // — Score-based insights (has_website) —
  if (currentScore === null) {
    return {
      summary: "This business has a website but hasn't been audited yet. Run an audit to uncover the opportunity.",
      type: "mixed",
      potentialScore: null,
      delta: null,
    };
  }

  // Determine the weakest area and build the insight
  const weaknesses: string[] = [];
  let primaryType: OpportunityInsight["type"] = "mixed";

  if (mobileScore !== null && mobileScore < 50) {
    weaknesses.push(`poor mobile performance (${mobileScore}/100)`);
    primaryType = "mobile";
  }
  if (performanceScore !== null && performanceScore < 50) {
    weaknesses.push(`slow desktop performance (${performanceScore}/100)`);
    if (primaryType === "mixed") primaryType = "performance";
  }
  if (seoScore !== null && seoScore < 50) {
    weaknesses.push(`weak SEO signals (${seoScore}/100)`);
    if (primaryType === "mixed") primaryType = "seo";
  }
  if (designScore !== null && designScore < 50) {
    weaknesses.push(`outdated design (${designScore}/100)`);
    if (primaryType === "mixed") primaryType = "design";
  }
  if (trustScore !== null && trustScore < 50) {
    weaknesses.push(`missing trust signals (${trustScore}/100)`);
    if (primaryType === "mixed") primaryType = "trust";
  }

  if (weaknesses.length > 0) {
    const weaknessText = weaknesses.slice(0, 2).join(" and ");
    const remaining = weaknesses.length - 2;
    const remainingText = remaining > 0 ? `, plus ${remaining} other issue${remaining > 1 ? "s" : ""}` : "";
    return {
      summary: `${weaknessText}${remainingText} make this a strong redesign candidate. Fixing these could take the score from ${currentScore} to ${potentialScore}.`,
      type: primaryType,
      potentialScore,
      delta,
    };
  }

  // Scores exist but look decent — still frame as opportunity
  if (currentScore >= 70) {
    return {
      summary: `Solid foundation at ${currentScore}/100 — small refinements could push this into top-tier territory (potential ${potentialScore}).`,
      type: "mixed",
      potentialScore,
      delta,
    };
  }

  // Fallback — scores in the mid range
  return {
    summary: `Current score of ${currentScore}/100 leaves room for improvement. Addressing the highlighted issues could unlock significant gains.`,
    type: "mixed",
    potentialScore,
    delta,
  };
}

/**
 * Compute an effective "current" score from whatever individual scores are available.
 * Falls back through: design → performance → null
 */
function computeEffectiveScore(
  perf: number | null,
  design: number | null,
  mobile: number | null,
  seo: number | null,
  trust: number | null,
): number | null {
  const available = [perf, design, mobile, seo, trust].filter((s): s is number => s !== null);
  if (available.length === 0) return null;
  return Math.round(available.reduce((a, b) => a + b, 0) / available.length);
}

/**
 * Estimate potential score and delta.
 * For missing-website cases, the potential is a generic 70–85 range.
 * For scored sites, potential = min(95, current + ~30–40% uplift based on severity).
 */
function computePotentialAndDelta(
  currentScore: number | null,
  websiteStatus: string,
): { potentialScore: number | null; delta: number | null } {
  // No-website cases have high potential
  if (websiteStatus === "no_website" || websiteStatus === "social_only") {
    return { potentialScore: 82, delta: null };
  }
  if (websiteStatus === "platform_only") {
    return { potentialScore: 78, delta: null };
  }

  if (currentScore === null) return { potentialScore: null, delta: null };

  // Score-based potential: lower current = bigger uplift possible
  let uplift: number;
  if (currentScore < 30) uplift = 40;
  else if (currentScore < 50) uplift = 30;
  else if (currentScore < 70) uplift = 20;
  else uplift = 10;

  const potentialScore = Math.min(95, Math.round(currentScore + (currentScore * uplift) / 100));
  const delta = potentialScore - currentScore;

  return { potentialScore, delta };
}
