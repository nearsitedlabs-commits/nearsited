import { computeOpportunityScore } from "@/lib/scoring";
import type { LeadRow } from "./types";

export function effectiveOpportunityScore(lead: LeadRow): number {
  if (lead.opportunity_score != null) return lead.opportunity_score;
  const qualityScore = lead.performance_score ?? 50;
  return computeOpportunityScore(qualityScore, lead.review_count ?? 0, lead.rating ?? 0);
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
  if (lead.website_status === "no_website") {
    return { text: "No Website Opportunity", color: "text-[var(--score-high)]" };
  }
  if (lead.website_status === "social_only") {
    return { text: "Social Presence Opportunity", color: "text-[var(--score-mid)]" };
  }
  if (lead.website_status === "platform_only") {
    return { text: "Platform Dependency Opportunity", color: "text-[var(--text-tertiary)]" };
  }
  const oppScore = effectiveOpportunityScore(lead);
  if (oppScore >= 70) return { text: "High Website Opportunity",  color: "text-[var(--score-good)]" };
  if (oppScore >= 40) return { text: `+${oppScore} Opportunity`,  color: "text-[var(--score-mid)]" };
  return                     { text: "Low Website Opportunity",    color: "text-[var(--text-tertiary)]" };
}
