import { blendQualityForOpportunity, computeOpportunityScore } from "@/lib/scoring";
import type { LeadRow, OpportunityStatus } from "./types";
import { noWebsiteOpportunityScore } from "@/lib/scoring";

/**
 * Derives the lifecycle status for a lead based on existing data.
 * Priority: won/lost > in_pipeline > pitched > audited > new
 */
export function deriveOpportunityStatus(
  lead: LeadRow,
  pipelineStatus?: string | null,
  hasPitch?: boolean
): OpportunityStatus {
  // Pipeline status takes highest priority
  if (pipelineStatus === "won") return "won";
  if (pipelineStatus === "lost") return "lost";

  const hasPipeline = !!pipelineStatus && pipelineStatus !== "new_lead";
  const isFullyAudited = lead.audited_at !== null && lead.design_analyzed_at !== null;

  if (hasPipeline) return "in_pipeline";
  if (hasPitch) return "pitched";
  if (isFullyAudited) return "audited";
  return "new";
}

/**
 * Relative time formatter — returns "Today", "Yesterday", "3d ago", etc.
 */
export function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  const diffDays = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Effective opportunity score for a lead.
 */
export function effectiveOpportunityScore(lead: LeadRow): number {
  if (lead.opportunity_score != null) return lead.opportunity_score;

  if (lead.website_status === "no_website") {
    return noWebsiteOpportunityScore(lead.review_count ?? 0, lead.rating ?? 0);
  }

  if (lead.website_status === "social_only") {
    const viability = Math.min(1, ((lead.review_count ?? 0) / 100) * 0.7 + ((lead.rating ?? 0) / 5) * 0.3);
    return Math.round(55 + viability * 30);
  }

  if (lead.website_status === "platform_only") {
    const viability = Math.min(1, ((lead.review_count ?? 0) / 100) * 0.7 + ((lead.rating ?? 0) / 5) * 0.3);
    return Math.round(50 + viability * 25);
  }

  return computeOpportunityScore(
    blendQualityForOpportunity(null, lead.performance_score, lead.design_score),
    lead.review_count ?? 0, lead.rating ?? 0, lead.business_type
  );
}

/**
 * Score tier key for cluster grouping.
 */
export function scoreTier(score: number): string {
  if (score >= 70) return "high";
  if (score >= 45) return "medium";
  return "low";
}
