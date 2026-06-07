import { blendQualityForOpportunity, computeOpportunityScore } from "@/lib/scoring";
import type { LeadRow } from "./types";

export function effectiveOpportunityScore(lead: LeadRow): number {
  // Use stored score if available
  if (lead.opportunity_score != null) return lead.opportunity_score;
  
  // For no-website leads: opportunity is based on business viability (reviews/rating)
  // since there's no website to evaluate but they need one built
  if (lead.website_status === "no_website") {
    // High base opportunity (they need a website built from scratch)
    // Boost by business viability (reviews + rating)
    const viability = Math.min(1, ((lead.review_count ?? 0) / 100) * 0.7 + ((lead.rating ?? 0) / 5) * 0.3);
    return Math.round(65 + viability * 30); // Range: 65-95
  }
  
  // For social-only leads: they have some online presence but no website
  if (lead.website_status === "social_only") {
    const viability = Math.min(1, ((lead.review_count ?? 0) / 100) * 0.7 + ((lead.rating ?? 0) / 5) * 0.3);
    return Math.round(55 + viability * 30); // Range: 55-85
  }
  
  // For platform-only leads: they rely on third-party platforms
  if (lead.website_status === "platform_only") {
    const viability = Math.min(1, ((lead.review_count ?? 0) / 100) * 0.7 + ((lead.rating ?? 0) / 5) * 0.3);
    return Math.round(50 + viability * 25); // Range: 50-75
  }
  
  return computeOpportunityScore(
    blendQualityForOpportunity(null, lead.performance_score, lead.design_score),
    lead.review_count ?? 0, lead.rating ?? 0, lead.business_type
  );
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  const diffDays = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function getOpportunityContext(lead: LeadRow): { text: string; color: string } {
  const oppScore = effectiveOpportunityScore(lead);
  
  if (lead.website_status === "no_website") {
    return { text: `No Website — ${oppScore} Opportunity`, color: "text-[var(--score-high)]" };
  }
  if (lead.website_status === "social_only") {
    return { text: `Social Presence — ${oppScore} Opportunity`, color: "text-[var(--score-mid)]" };
  }
  if (lead.website_status === "platform_only") {
    return { text: `Platform — ${oppScore} Opportunity`, color: "text-[var(--text-tertiary)]" };
  }
  if (oppScore >= 70) return { text: `High Website — ${oppScore}`, color: "text-[var(--score-good)]" };
  if (oppScore >= 40) return { text: `${oppScore} Opportunity`, color: "text-[var(--score-mid)]" };
  return                     { text: `Low Website — ${oppScore}`, color: "text-[var(--text-tertiary)]" };
}
