"use client";

import Link from "next/link";
import { MapPin, ExternalLink, Zap, TrendingUp, ArrowUp } from "lucide-react";
import type { WebsiteStatus } from "@/lib/types";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { WebsiteBadge } from "@/components/ui/WebsiteBadge";
import { opportunityInsight, type OpportunityInsight } from "@/lib/opportunity-insights";
import { computeOpportunityScore, opportunityLabel, opportunityBadgeVariant } from "@/lib/scoring";
import { useMemo } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

export type OpportunityCardData = {
  id: string;
  name: string;
  business_type: string;
  city: string;
  place_id: string | null;
  website: string | null;
  website_status: WebsiteStatus;
  rating?: number | null;
  review_count?: number | null;
  performance_score: number | null;
  design_score: number | null;
  mobile_score?: number | null;
  seo_score?: number | null;
  trust_score?: number | null;
  audited_at: string | null;
  design_analyzed_at: string | null;
  issues_count?: number;
};

type OpportunityCardProps = {
  lead: OpportunityCardData;
  /** Base href for the detail link, defaults to /dashboard/leads/ */
  detailHref?: string;
  /** Whether to show the full insight text */
  showInsight?: boolean;
  /** Whether to show action buttons */
  showActions?: boolean;
  /** Extra Tailwind classes for the card wrapper */
  className?: string;
};

// ── Opportunity Score Delta ───────────────────────────────────────────────────

function ScoreDelta({ current, potential, delta }: { current: number | null; potential: number | null; delta: number | null }) {
  if (current === null || potential === null) return null;

  const color = delta && delta >= 30 ? "text-[var(--score-good)]" : delta && delta >= 15 ? "text-[var(--score-mid)]" : "text-[var(--text-secondary)]";

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-[var(--text-tertiary)]">Current</span>
      <span className="text-sm font-semibold text-[var(--text-primary)]">{current}</span>
      <ArrowUp className="h-3.5 w-3.5 text-[var(--score-good)]" />
      <span className="text-xs text-[var(--text-tertiary)]">Potential</span>
      <span className="text-sm font-semibold text-[var(--score-good)]">{potential}</span>
      {delta !== null && (
        <span className={`ml-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium ${color} bg-[var(--bg-elevated)]`}>
          +{delta}
        </span>
      )}
    </div>
  );
}

// ── Insight Badge ─────────────────────────────────────────────────────────────

const INSIGHT_BADGE: Record<string, string> = {
  performance: "border-l-[var(--score-high)]",
  design:      "border-l-[var(--accent)]",
  trust:       "border-l-[var(--score-mid)]",
  mobile:      "border-l-[var(--score-high)]",
  seo:         "border-l-[var(--accent-warm)]",
  presence:    "border-l-[var(--score-good)]",
  social:      "border-l-[var(--score-mid)]",
  platform:    "border-l-[var(--accent-warm)]",
  mixed:       "border-l-[var(--text-tertiary)]",
};

// ── Opportunity Level Dot ─────────────────────────────────────────────────────

function OpportunityDot({ score }: { score: number }) {
  const label = opportunityLabel(score);
  const variant = opportunityBadgeVariant(score);
  const colorMap: Record<string, string> = {
    green:  "border-[var(--badge-green-border)] text-[var(--badge-green-text)] bg-[var(--badge-green-bg)]",
    amber:  "border-[var(--badge-amber-border)] text-[var(--badge-amber-text)] bg-[var(--badge-amber-bg)]",
    indigo: "border-[var(--badge-indigo-border)] text-[var(--badge-indigo-text)] bg-[var(--badge-indigo-bg)]",
    red:    "border-[var(--badge-red-border)] text-[var(--badge-red-text)] bg-[var(--badge-red-bg)]",
  };
  const dotMap: Record<string, string> = {
    green:  "bg-[var(--badge-green-text)]",
    amber:  "bg-[var(--badge-amber-text)]",
    indigo: "bg-[var(--badge-indigo-text)]",
    red:    "bg-[var(--badge-red-text)]",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${colorMap[variant] ?? ""}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotMap[variant] ?? ""}`} />
      {label}
    </span>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function OpportunityCard({
  lead,
  detailHref = "/dashboard/leads",
  showInsight = true,
  showActions = true,
  className = "",
}: OpportunityCardProps) {
  // Compute the effective score (use the best available)
  const effectiveScore = useMemo(() => {
    return lead.performance_score ?? lead.design_score ?? null;
  }, [lead.performance_score, lead.design_score]);

  // Opportunity score (with fallback for legacy records)
  const oppScore = useMemo(() => {
    const qualityScore = effectiveScore ?? 50;
    return computeOpportunityScore(qualityScore, lead.review_count ?? 0, lead.rating ?? 0);
  }, [effectiveScore, lead.review_count, lead.rating]);

  // Generate insight
  const insight: OpportunityInsight = useMemo(() => {
    return opportunityInsight(
      lead.website_status,
      lead.performance_score,
      lead.design_score,
      lead.mobile_score ?? null,
      lead.seo_score ?? null,
      lead.trust_score ?? null,
    );
  }, [lead.website_status, lead.performance_score, lead.design_score, lead.mobile_score, lead.seo_score, lead.trust_score]);

  const detailUrl = `${detailHref}/${lead.id}`;

  return (
    <div
      className={`group relative w-full rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 transition-all duration-200 hover:border-[var(--accent)]/40 hover:shadow-[0_4px_24px_rgba(0,0,0,0.12)] ${className}`}
    >
      <div className="flex items-start gap-5">
        {/* ── Left: Score Ring (primary visual) ── */}
        <div className="flex flex-col items-center gap-2.5">
          <Link href={detailUrl} className="block">
            <ScoreRing score={effectiveScore} size={72} />
          </Link>
          <OpportunityDot score={oppScore} />
        </div>

        {/* ── Center: Business Info + Insight ── */}
        <div className="min-w-0 flex-1">
          {/* Business name + type */}
          <Link href={detailUrl} className="block">
            <h3 className="text-base font-medium text-[var(--text-primary)] transition-colors duration-150 group-hover:text-[var(--accent)] truncate max-w-full">
              {lead.name}
            </h3>
            <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">
              {lead.business_type}{lead.city ? ` · ${lead.city}` : ""}
            </p>
          </Link>

          {/* Website status + issues count */}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <WebsiteBadge status={lead.website_status} />
            {lead.issues_count !== undefined && lead.issues_count > 0 && (
              <span className="inline-flex items-center rounded-full bg-[var(--status-warning-bg)] px-2 py-0.5 text-[11px] font-medium text-[var(--status-warning-text)] border border-[var(--status-warning-text)]/30">
                {lead.issues_count} {lead.issues_count === 1 ? "issue" : "issues"}
              </span>
            )}
          </div>

          {/* Score delta: Current → Potential */}
          {insight.delta !== null && insight.potentialScore !== null && (
            <div className="mt-3">
              <ScoreDelta
                current={effectiveScore}
                potential={insight.potentialScore}
                delta={insight.delta}
              />
            </div>
          )}

          {/* Missing-website potential display */}
          {lead.website_status !== "has_website" && effectiveScore === null && (
            <div className="mt-3">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-[var(--score-good)]" />
                <span className="text-xs text-[var(--text-tertiary)]">Est. redesign potential</span>
                <span className="text-sm font-semibold text-[var(--score-good)]">{insight.potentialScore}</span>
                <span className="text-[11px] text-[var(--text-tertiary)]">/ 100</span>
              </div>
            </div>
          )}

          {/* Insight text */}
          {showInsight && (
            <div className={`mt-3 border-l-2 pl-3 ${INSIGHT_BADGE[insight.type] ?? INSIGHT_BADGE.mixed}`}>
              <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                {insight.summary}
              </p>
            </div>
          )}

          {/* ROI Estimate removed per request */}
        </div>

        {/* ── Right: Actions ── */}
        {showActions && (
          <div className="flex flex-col items-end gap-2">
            <Link
              href={detailUrl}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3.5 py-2 text-xs font-medium text-white transition-colors duration-150 hover:bg-[var(--accent-hover)]"
            >
              <Zap className="h-3.5 w-3.5" />
              View
            </Link>
            <div className="flex items-center gap-1.5">
              {lead.place_id && (
                <a
                  href={`https://www.google.com/maps/place/?q=place_id:${lead.place_id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-1.5 text-[var(--text-tertiary)] transition-colors duration-150 hover:border-[var(--score-good)]/40 hover:text-[var(--score-good)]"
                  title="View on Google Maps"
                >
                  <MapPin className="h-3.5 w-3.5" />
                </a>
              )}
              {lead.website && (
                <a
                  href={lead.website}
                  target="_blank"
                  rel="noreferrer"
                  className="cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-1.5 text-[var(--text-tertiary)] transition-colors duration-150 hover:border-[var(--accent)]/40 hover:text-[var(--accent)]"
                  title="Open website"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
