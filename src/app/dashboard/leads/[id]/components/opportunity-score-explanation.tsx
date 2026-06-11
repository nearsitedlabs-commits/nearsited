"use client";

import { useState, useEffect, useRef } from "react";
import { CheckCircle2, ChevronDown, Info } from "lucide-react";
import { websiteWeakness, opportunityLabel } from "@/lib/scoring";
import { opportunityInsight } from "@/lib/opportunity-insights";

// ── Types ─────────────────────────────────────────────────────────────────────

type Confidence = "High" | "Medium" | "Low";

export type OpportunityScoreExplanationProps = {
  websiteStatus: string;
  overallScore: number;
  opportunityScore: number;
  reviewCount: number | null;
  rating: number | null;
  hasAudit: boolean;
  hasDesign: boolean;
  contactAvailable: boolean;
  businessType: string | null;
  issues: Array<{ title: string; impact: string; point_deduction?: number }>;
};

// ── Pure helpers ───────────────────────────────────────────────────────────────

function getConfidence(hasAudit: boolean, hasDesign: boolean, reviewCount: number | null): Confidence {
  const r = reviewCount ?? 0;
  if (hasAudit && hasDesign && r >= 10) return "High";
  if (hasAudit || hasDesign || r >= 5)  return "Medium";
  return "Low";
}

function getSignals(
  websiteStatus: string,
  overallScore: number,
  reviewCount: number | null,
  rating: number | null,
  contactAvailable: boolean,
  issues: Array<{ title: string; impact: string }>,
): string[] {
  const r   = reviewCount ?? 0;
  const rat = rating ?? 0;
  const sigs: string[] = [];

  if (websiteStatus === "no_website")    sigs.push("No website found — full build opportunity");
  else if (websiteStatus === "social_only")   sigs.push("Social media only — no website to capture leads");
  else if (websiteStatus === "platform_only") sigs.push("Third-party platform — limited brand control");
  else if (overallScore < 50)  sigs.push("Website has significant room for improvement");
  else if (overallScore < 70)  sigs.push("Website has fixable performance and design issues");

  if (r >= 100)     sigs.push(`Highly active — ${r.toLocaleString()} customer reviews`);
  else if (r >= 20) sigs.push(`Active business with ${r} reviews`);
  else if (r >= 5)  sigs.push(`Established with ${r} reviews`);

  if (rat >= 4.0 && r >= 10) sigs.push(`Strong local reputation — ${rat.toFixed(1)} star rating`);

  if (contactAvailable) sigs.push("Contact details available — direct outreach possible");

  const highCount = issues.filter(i => i.impact === "High").length;
  if (highCount >= 2) sigs.push(`${highCount} high-impact improvements identified`);

  return sigs.slice(0, 5);
}

function getTypes(
  websiteStatus: string,
  overallScore: number,
  issues: Array<{ title: string; impact: string }>,
): string[] {
  const types: string[] = [];

  if      (websiteStatus === "no_website")    types.push("Website Needed");
  else if (websiteStatus === "social_only")   types.push("Digital Presence Gap");
  else if (websiteStatus === "platform_only") types.push("Website Upgrade");
  else if (overallScore < 50)                 types.push("Redesign Candidate");
  else                                        types.push("Performance Opportunity");

  const hasSEO  = issues.some(i => /(seo|search|meta|keyword)/i.test(i.title));
  const hasCTA  = issues.some(i => /(cta|conversion|button|lead|contact form)/i.test(i.title));

  if (hasSEO)  types.push("SEO Opportunity");
  if (hasCTA)  types.push("Conversion Optimisation");

  return types.slice(0, 3);
}

function getServices(
  websiteStatus: string,
  overallScore: number,
  issues: Array<{ title: string; impact: string }>,
): string[] {
  if (websiteStatus === "no_website")    return ["Website Design", "Google Business Setup", "Local SEO"];
  if (websiteStatus === "social_only")   return ["Website Development", "Social Integration", "Lead Capture"];
  if (websiteStatus === "platform_only") return ["Custom Website", "Brand Identity", "SEO Setup"];

  const svcs: string[] = [overallScore < 50 ? "Website Redesign" : "Website Optimisation"];

  if (issues.some(i => /(speed|performance|lcp|fcp|slow|mobile)/i.test(i.title))) svcs.push("Performance Optimisation");
  if (issues.some(i => /(seo|search|meta)/i.test(i.title)))                        svcs.push("Local SEO");
  if (issues.some(i => /(cta|conversion|lead|button)/i.test(i.title)))              svcs.push("Conversion Optimisation");
  if (issues.some(i => /(trust|review|credib)/i.test(i.title)))                     svcs.push("Trust & Credibility");

  if (svcs.length < 2) svcs.push("Local SEO");
  return svcs.slice(0, 3);
}

type Driver = { label: string; score: number; description: string };

function getDrivers(
  websiteStatus: string,
  overallScore: number,
  reviewCount: number | null,
  rating: number | null,
  contactAvailable: boolean,
): Driver[] {
  const r   = reviewCount ?? 0;
  const rat = rating ?? 0;

  const digitalGap =
    websiteStatus === "no_website"    ? 100 :
    websiteStatus === "social_only"   ? 85  :
    websiteStatus === "platform_only" ? 70  :
    websiteWeakness(overallScore);

  const activityScore =
    r >= 100 ? 100 : r >= 50 ? 90 : r >= 20 ? 75 : r >= 10 ? 60 : r >= 5 ? 45 : r >= 1 ? 30 : 20;

  const reputationScore =
    rat >= 4.5 ? 100 : rat >= 4.0 ? 85 : rat >= 3.5 ? 65 : rat >= 3.0 ? 40 : rat > 0 ? 25 : 50;

  const contactScore = contactAvailable ? 100 : 50;

  return [
    {
      label: "Digital Presence Gap",
      score: digitalGap,
      description:
        websiteStatus === "no_website"    ? "No website exists — full digital transformation opportunity." :
        websiteStatus === "social_only"   ? "Only social media detected — website creation opportunity." :
        websiteStatus === "platform_only" ? "Relies on a third-party platform — custom website opportunity." :
        overallScore < 50                 ? "Website has performance and design issues needing significant work." :
        overallScore < 70                 ? "Website needs improvements to reach its potential." :
        "Website performs well — targeted enhancements could add value.",
    },
    {
      label: "Business Activity",
      score: activityScore,
      description:
        r >= 50 ? "Highly active — a business investing in customers is likely to invest in its website." :
        r >= 20 ? "Consistent customer engagement indicates an established, operating business." :
        r >= 5  ? "Some review history suggests an operating business." :
        r >= 1  ? "Limited review history — business may be newer or less established." :
        "No review data available.",
    },
    {
      label: "Local Reputation",
      score: reputationScore,
      description:
        rat >= 4.0 ? "Strong rating signals a quality business worth investing in a website." :
        rat >= 3.5 ? "Above-average rating — a professional website could amplify their reputation." :
        rat >= 3.0 ? "Average rating — digital improvements could help strengthen customer perception." :
        rat >  0   ? "Lower rating — a professional online presence could help address trust issues." :
        "Rating data not available.",
    },
    {
      label: "Contact Accessibility",
      score: contactScore,
      description: contactAvailable
        ? "Contact information is available — direct outreach is straightforward."
        : "Contact details may need research — outreach will require extra effort.",
    },
  ];
}

// ── Sub-components ────────────────────────────────────────────────────────────

const TYPE_STYLES: Record<string, string> = {
  "Website Needed":          "border-[var(--color-success)]/30 bg-[var(--color-success)]/10 text-[var(--color-success)]",
  "Digital Presence Gap":    "border-[var(--color-success)]/30 bg-[var(--color-success)]/10 text-[var(--color-success)]",
  "Redesign Candidate":      "border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 text-[var(--color-accent)]",
  "Website Upgrade":         "border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 text-[var(--color-accent)]",
  "Performance Opportunity": "border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 text-[var(--color-accent)]",
  "SEO Opportunity":         "border-blue-500/30 bg-blue-500/10 text-blue-400",
  "Conversion Optimisation": "border-amber-500/30 bg-amber-500/10 text-amber-400",
};

function DriverBar({ label, score, description }: Driver) {
  const color =
    score >= 70 ? "var(--score-good)" :
    score >= 40 ? "var(--score-mid)"  :
    "var(--text-tertiary)";
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[var(--color-text-secondary)]">{label}</span>
        <span className="text-xs font-bold tabular-nums" style={{ color }}>{score}/100</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-[var(--radius-sm)] bg-[var(--color-bg-page)]">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
      <p className="text-[11px] leading-relaxed text-[var(--color-text-tertiary)]">{description}</p>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function OpportunityScoreExplanation({
  websiteStatus,
  overallScore,
  opportunityScore,
  reviewCount,
  rating,
  hasAudit,
  hasDesign,
  contactAvailable,
  businessType,
  issues,
}: OpportunityScoreExplanationProps) {
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const [tooltipOpen, setTooltipOpen]     = useState(false);
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    if (process.env.NODE_ENV === "development") console.log("[ANALYTICS] opportunity_explanation_viewed");
  }, []);

  const confidence     = getConfidence(hasAudit, hasDesign, reviewCount);
  const insight        = opportunityInsight(
    websiteStatus,
    null,  // performanceScore — not available at this level
    null,  // designScore
    null,  // mobileScore
    null,  // seoScore
    null,  // trustScore
    {
      businessType: businessType ?? undefined,
      reviewCount,
      rating,
      overallScore,
    },
  );
  const summary        = insight.summary;
  const signals        = getSignals(websiteStatus, overallScore, reviewCount, rating, contactAvailable, issues);
  const types          = getTypes(websiteStatus, overallScore, issues);
  const services       = getServices(websiteStatus, overallScore, issues);
  const drivers        = getDrivers(websiteStatus, overallScore, reviewCount, rating, contactAvailable);

  const confColor =
    confidence === "High"   ? "text-[var(--color-success)]" :
    confidence === "Medium" ? "text-[var(--color-info)]"  :
    "text-[var(--color-text-tertiary)]";

  const scoreTierColor =
    opportunityScore >= 70 ? "var(--score-good)" :
    opportunityScore >= 40 ? "var(--score-mid)"  :
    "var(--score-high)";

  const scoreTierTextColor =
    opportunityScore >= 70 ? "text-[var(--color-success)]" :
    opportunityScore >= 40 ? "text-[var(--color-info)]"  :
    "text-[var(--score-high)]";

  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] overflow-hidden">
      <div className="p-5 sm:p-6">

        {/* Score hero */}
        <div className="mb-5 flex flex-col items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-bg-elevated)] py-6">
          <span
            className="text-5xl font-bold leading-none tabular-nums"
            style={{ color: scoreTierColor }}
          >
            {opportunityScore}
          </span>
          <span className={`mt-2 text-sm font-semibold ${scoreTierTextColor}`}>
            {opportunityLabel(opportunityScore)}
          </span>
        </div>

        {/* Header row */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-[var(--color-text-primary)]">Why This Is An Opportunity</h2>

          <div className="flex flex-wrap items-center gap-2">
            {/* Type tags */}
            {types.map(t => (
              <span
                key={t}
                className={`inline-flex items-center rounded-[var(--radius-sm)] border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${TYPE_STYLES[t] ?? "border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)]"}`}
              >
                {t}
              </span>
            ))}

            {/* Confidence badge */}
            <div className="relative flex items-center gap-1">
              <span className={`text-xs font-semibold ${confColor}`}>{confidence} Confidence</span>
              <button
                onClick={() => setTooltipOpen(v => !v)}
                className="cursor-pointer text-[var(--color-text-tertiary)] transition-colors hover:text-[var(--color-text-secondary)]"
              >
                <Info className="h-3 w-3" />
              </button>
              {tooltipOpen && (
                <div className="absolute right-0 top-full z-20 mt-1.5 w-48 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] p-3 shadow-lg">
                  <p className="text-[11px] leading-relaxed text-[var(--color-text-secondary)]">
                    Reflects how much verified data was available when calculating this score.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Summary */}
        <p className="mb-4 text-sm leading-relaxed text-[var(--color-text-secondary)]">{summary}</p>

        {/* Two-column: signals + services */}
        <div className="grid gap-4 sm:grid-cols-2">

          {/* Signals */}
          <ul className="space-y-2">
            {signals.map((s, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-success)]" />
                <span className="text-xs leading-relaxed text-[var(--color-text-secondary)]">{s}</span>
              </li>
            ))}
          </ul>

          {/* Services */}
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)]">
              Recommended Services
            </p>
            <ul className="space-y-1">
              {services.map((s, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]"
                  onClick={() => {
                    if (process.env.NODE_ENV === "development") console.log("[ANALYTICS] recommendation_clicked", s);
                  }}
                >
                  <span className="h-1 w-1 shrink-0 rounded-[var(--radius-sm)] bg-[var(--color-accent)]" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Expandable score breakdown */}
      <button
        onClick={() => {
          setBreakdownOpen(v => !v);
          if (!breakdownOpen && process.env.NODE_ENV === "development") {
            console.log("[ANALYTICS] score_breakdown_expanded");
          }
        }}
        className="flex w-full cursor-pointer items-center justify-between border-t border-[var(--color-border-subtle)] px-5 sm:px-6 py-3 text-left transition-colors hover:bg-[var(--color-bg-elevated)]"
      >
        <span className="text-xs font-medium text-[var(--color-text-tertiary)]">Score Breakdown</span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-[var(--color-text-tertiary)] transition-transform duration-200 ${breakdownOpen ? "rotate-180" : ""}`}
        />
      </button>

      {breakdownOpen && (
        <div className="space-y-4 border-t border-[var(--color-border-subtle)] px-5 sm:px-6 py-4">
          {drivers.map(d => <DriverBar key={d.label} {...d} />)}
        </div>
      )}
    </div>
  );
}