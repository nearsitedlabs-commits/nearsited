"use client";

import {
  AlertTriangle,
  HelpCircle,
  Loader2,
  Monitor,
  RefreshCw,
  Smartphone,
} from "lucide-react";
import { blendQualityForOpportunity, computeOpportunityScore } from "@/lib/scoring";
import { MetricKey, METRIC_META, metricColor } from "@/lib/metric-meta";
import { Tooltip } from "@/components/ui/Tooltip";
import type { StrategyResult, DesignResult, DesignRetrying } from "./types";

// ── Helpers ────────────────────────────────────────────────────────────────────

function getPerformanceSummary(
  mobile: number | null,
  desktop: number | null,
): { text: string; isPositive: boolean } {
  if (mobile === null && desktop === null) return { text: "", isPositive: true };
  const count = (mobile !== null ? 1 : 0) + (desktop !== null ? 1 : 0);
  const avg = ((mobile ?? 0) + (desktop ?? 0)) / count;
  if (avg >= 85) return { text: "This site loads quickly on both mobile and desktop. Performance is a strength.", isPositive: true };
  if (avg >= 70) return { text: "This site performs reasonably well but has room for improvement, especially on mobile.", isPositive: true };
  if (avg >= 50) return { text: "This site is noticeably slow. Visitors on mobile are likely leaving before it loads.", isPositive: false };
  return { text: "This site is critically slow. Most visitors will abandon it before seeing any content.", isPositive: false };
}

function getDesignSummary(
  mobileIssues: DesignResult["issues"],
  desktopIssues: DesignResult["issues"],
): string {
  const all = [...(mobileIssues ?? []), ...(desktopIssues ?? [])];
  if (all.length === 0) return "";
  const top = all.slice(0, 3).map((i) => i.title.toLowerCase());
  if (top.length === 1) return `The main issue found: ${top[0]}.`;
  const last = top.pop();
  return `The main issues found: ${top.join(", ")}, and ${last}.`;
}

function getDesignErrorDisplay(
  error: string | undefined,
): { title: string; description: string } {
  if (!error) return { title: "Analysis failed", description: "Click retry to try again." };
  const lower = error.toLowerCase();
  if (lower.includes("screenshot")) {
    return {
      title: "Site couldn't be loaded",
      description: "The site could not be loaded for analysis.",
    };
  }
  if (error === "AI_SERVICE_BUSY") {
    return { title: "Our AI is busy", description: "Click retry to try again." };
  }
  return { title: "Analysis failed", description: "Click retry to try again." };
}

/** Check if all four components completed successfully */
function allComponentsComplete(
  auditResult: { mobile: StrategyResult; desktop: StrategyResult },
  designResult: { mobile: DesignResult; desktop: DesignResult } | null,
): boolean {
  const perfOk =
    auditResult.mobile.status === "ok" && auditResult.desktop.status === "ok";
  if (!designResult) return false;
  const designOk =
    designResult.mobile.status === "ok" && designResult.desktop.status === "ok";
  return perfOk && designOk;
}

/** Describe what's missing when score can't be computed */
function getMissingComponents(
  auditResult: { mobile: StrategyResult; desktop: StrategyResult },
  designResult: { mobile: DesignResult; desktop: DesignResult } | null,
): string {
  const parts: string[] = [];
  if (auditResult.mobile.status !== "ok") parts.push("mobile performance");
  if (auditResult.desktop.status !== "ok") parts.push("desktop performance");
  if (!designResult || designResult.mobile.status !== "ok") parts.push("mobile design");
  if (!designResult || designResult.desktop.status !== "ok") parts.push("desktop design");
  if (parts.length === 0) return "analysis incomplete";
  return `${parts.join(", ")} didn't complete`;
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function SubScore({
  label,
  score,
}: {
  label: string;
  score: number | null | undefined;
}) {
  const color =
    !score
      ? "text-[var(--color-text-tertiary)]"
      : score >= 90
        ? "text-[var(--color-success)]"
        : score >= 50
          ? "text-[var(--color-info)]"
          : "text-[var(--score-high)]";
  return (
    <div className="flex items-center justify-between rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-3 py-2">
      <span className="text-sm text-[var(--color-text-secondary)]">{label}</span>
      <span className={`text-sm font-bold ${color}`}>{score ?? "—"}</span>
    </div>
  );
}

// ── Metric Row with Tooltip ────────────────────────────────────────────────────

function MetricRow({ metricKey, value }: { metricKey: MetricKey; value: string | null }) {
  const meta = METRIC_META[metricKey];
  return (
    <div className="rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-3 py-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <p className="text-xs font-medium text-[var(--color-text-primary)]">
            {meta.label}
          </p>
          <Tooltip content={meta.subtitle} side="top" maxWidth={220}>
            <button
              type="button"
              className="inline-flex cursor-help items-center rounded-[var(--radius-sm)] text-[var(--text-muted)] transition-colors hover:text-[var(--color-text-tertiary)]"
              tabIndex={-1}
              aria-label={`Info about ${meta.label}`}
            >
              <HelpCircle className="h-3 w-3" />
            </button>
          </Tooltip>
        </div>
        <span
          className={`shrink-0 text-sm font-bold ${metricColor(metricKey, value)}`}
        >
          {value ?? "—"}
        </span>
      </div>
    </div>
  );
}

// ── Component ───────────────────────────────────────────────────────────────────

type AuditResultsPanelProps = {
  /** The audit result containing mobile and desktop strategy results */
  auditResult: { mobile: StrategyResult; desktop: StrategyResult } | null;
  /** The design analysis result */
  designResult: { mobile: DesignResult; desktop: DesignResult } | null;
  /** Google Maps rating (nullable) */
  mapsRating: number | null;
  /** Google Maps review count (nullable) */
  mapsReviewCount: number | null;
  /** Callback to retry design analysis for a specific strategy */
  onRetryDesign: (strategy: "mobile" | "desktop") => void;
  /** Loading state for design retries */
  designRetrying: DesignRetrying;
  /** Saved timestamp from session storage */
  savedTimestamp?: number | null;
};

export function AuditResultsPanel({
  auditResult,
  designResult,
  mapsRating,
  mapsReviewCount,
  onRetryDesign,
  designRetrying,
  savedTimestamp, // eslint-disable-line @typescript-eslint/no-unused-vars
}: AuditResultsPanelProps) {
  if (!auditResult) return null;

  // ── Both strategies timed out ────────────────────────────────────────────────
  if (
    auditResult.mobile.status === "timeout" &&
    auditResult.desktop.status === "timeout"
  ) {
    return (
      <div className="mt-6 rounded-[var(--radius-md)] border border-amber-500/30 bg-amber-500/10 p-8 text-center">
        <AlertTriangle className="mx-auto h-10 w-10 text-[var(--color-info)]" />
        <h2 className="mt-4 text-lg font-medium text-[var(--color-text-primary)]">
          Couldn&rsquo;t reach the site
        </h2>
        <p className="mt-2 max-w-md mx-auto text-sm text-[var(--color-text-secondary)]">
          The site took too long to respond. This usually means it&rsquo;s down, very slow, or
          blocking automated checks. Try again or test a different URL.
        </p>
      </div>
    );
  }

  // ── Opportunity Score ─────────────────────────────────────────────────────────
  const mP = auditResult.mobile.performance_score ?? null;
  const dP = auditResult.desktop.performance_score ?? null;
  const mDesignScore = designResult?.mobile?.design_score ?? null;
  const dDesignScore = designResult?.desktop?.design_score ?? null;
  const dS = mDesignScore ?? dDesignScore ?? null;
  const hasAnyScore = mP != null || dP != null || dS != null;
  const allComplete = allComponentsComplete(auditResult, designResult);

  const opportunityScoreEl = hasAnyScore ? (
    allComplete ? (
      (() => {
        const blendedQ = blendQualityForOpportunity(mP, dP, dS);
        const oppScore = computeOpportunityScore(
          blendedQ,
          mapsReviewCount ?? 0,
          mapsRating ?? 0,
          undefined,
        );
        const isVerified = mapsRating != null;
        return (
          <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 px-5 py-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--color-accent)]">
                {isVerified ? "Opportunity Score" : "Estimated Opportunity Score"}
              </p>
              {isVerified && mapsRating != null && (
                <p className="mt-0.5 text-[11px] text-[var(--color-text-secondary)]">
                  Based on performance + design +{" "}
                  {mapsRating.toFixed(1)}★
                  {mapsReviewCount != null && mapsReviewCount > 0
                    ? ` · ${mapsReviewCount} reviews`
                    : ""}
                </p>
              )}
            </div>
            <div className="text-right">
              <span className="text-4xl font-bold text-[var(--color-accent)]">{oppScore}</span>
              <span className="text-sm text-[var(--color-text-tertiary)]"> / 100</span>
            </div>
          </div>
        );
      })()
    ) : (
      // ── Partial data — honest display ──────────────────────────────────────
      <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Dashed ring with "—" */}
            <svg
              width={48}
              height={48}
              viewBox="0 0 48 48"
              className="shrink-0"
            >
              <circle
                cx="24" cy="24" r="18"
                fill="none"
                stroke="var(--border-strong)"
                strokeWidth="3"
                strokeDasharray="4 4"
              />
              <text
                x="24" y="28" textAnchor="middle"
                fontSize="16" fontWeight="500"
                fill="var(--text-tertiary)"
                fontFamily="var(--font-sans, Geist)"
              >
                —
              </text>
            </svg>
            <div>
              <p className="text-sm font-medium text-[var(--color-text-primary)]">
                Pending — {getMissingComponents(auditResult, designResult)}
              </p>
              {/* Component breakdown */}
              <p className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">
                Performance {mP != null ? mP : "—"}/{dP != null ? dP : "—"}
                {" · "}SEO{" "}
                {auditResult.mobile.seo_score != null
                  ? auditResult.mobile.seo_score
                  : auditResult.desktop.seo_score != null
                    ? auditResult.desktop.seo_score
                    : "—"}
                {" · "}Design{" "}
                {dS != null ? `${dS}` : "retry needed"}
              </p>
            </div>
          </div>
          {/* Inline retry for missing components */}
          {(!designResult || designResult.mobile.status !== "ok") && (
            <button
              onClick={() => onRetryDesign("mobile")}
              disabled={designRetrying.mobile}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-accent)]/40 hover:text-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {designRetrying.mobile ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
              Retry design
            </button>
          )}
        </div>
      </div>
    )
  ) : null;

  // ── Performance Scores ────────────────────────────────────────────────────────
  const performanceEl = (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-6">
      <h2 className="mb-4 text-lg font-medium text-[var(--color-text-primary)]">
        Performance Scores
      </h2>
      <div className="grid gap-6 md:grid-cols-2">
        {(["mobile", "desktop"] as const).map((s) => {
          const d = auditResult[s];
          const StratIcon = s === "mobile" ? Smartphone : Monitor;
          return (
            <div key={s} className="space-y-3">
              <div className="flex items-center gap-2">
                <StratIcon className="h-4 w-4 text-[var(--color-text-tertiary)]" />
                <p className="text-sm font-medium text-[var(--color-text-primary)]">
                  {s === "mobile" ? "Mobile" : "Desktop"}
                </p>
              </div>
              {d.status === "ok" ? (
                <>
                  <SubScore label="Performance" score={d.performance_score} />
                  {d.seo_score !== undefined && (
                    <SubScore label="SEO" score={d.seo_score} />
                  )}
                  <div className="space-y-2">
                    {(["fcp", "lcp", "tbt", "cls"] as MetricKey[]).map((key) => {
                      const rawVal = d[key];
                      return (
                        <MetricRow key={key} metricKey={key} value={rawVal} />
                      );
                    })}
                  </div>
                </>
              ) : (
                <p className="text-sm text-[var(--score-high)]">
                  {d.status === "timeout" ? "Timed out" : "Failed"}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Insight callout — color depends on whether it's good news or bad news */}
      {(() => {
        const summary = getPerformanceSummary(
          auditResult.mobile.performance_score,
          auditResult.desktop.performance_score,
        );
        if (!summary.text) return null;
        return (
          <div
            className={`mt-4 rounded-[var(--radius-sm)] border p-3 text-sm ${
              summary.isPositive
                ? "border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                : "border-amber-500/30 bg-amber-500/10 text-amber-400"
            }`}
          >
            {summary.text}
          </div>
        );
      })()}
    </div>
  );

  // ── Design Analysis ───────────────────────────────────────────────────────────
  const designEl = designResult ? (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-6">
      <h2 className="mb-4 text-lg font-medium text-[var(--color-text-primary)]">
        Design Analysis
      </h2>
      <div className="grid gap-6 md:grid-cols-2">
        {(["mobile", "desktop"] as const).map((s) => {
          const d = designResult[s];
          const StratIcon = s === "mobile" ? Smartphone : Monitor;
          const errDisplay =
            d.status !== "ok" ? getDesignErrorDisplay(d.error) : null;
          return (
            <div key={s}>
              <div className="mb-3 flex items-center gap-2">
                <StratIcon className="h-4 w-4 text-[var(--color-text-tertiary)]" />
                <p className="text-sm font-medium text-[var(--color-text-primary)]">
                  {s === "mobile" ? "Mobile" : "Desktop"}
                </p>
              </div>
              {d.status === "ok" ? (
                <>
                  <div className="mb-3 flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold text-[var(--color-text-primary)]">
                      {d.design_score}
                    </span>
                    <span className="text-sm text-[var(--color-text-tertiary)]">/ 100</span>
                  </div>
                  {d.issues && d.issues.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-[var(--color-text-tertiary)]">
                        Issues found
                      </p>
                      {d.issues.slice(0, 3).map((issue, i) => (
                        <div
                          key={i}
                          className="rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] p-2"
                        >
                          <p className="text-xs font-medium text-[var(--color-text-primary)]">
                            {issue.title}
                          </p>
                          <p className="mt-0.5 text-[11px] text-[var(--color-text-tertiary)]">
                            {issue.detail}
                          </p>
                          {issue.point_deduction && (
                            <span className="mt-1 inline-block text-[10px] font-semibold text-[var(--score-high)]">
                              −{issue.point_deduction} pts
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-[var(--radius-sm)] border border-dashed border-red-500/30 bg-red-500/10 p-4">
                  <div className="text-center">
                    <p className="text-sm font-medium text-[var(--score-high)]">
                      {errDisplay?.title ?? "Analysis failed"}
                    </p>
                    <p className="mt-1 text-xs text-red-400">
                      {errDisplay?.description ?? "Click retry to try again."}
                    </p>
                  </div>
                  <div className="mt-3 flex justify-center">
                    <button
                      onClick={() => onRetryDesign(s)}
                      disabled={designRetrying[s]}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-[var(--radius-sm)] border border-red-500/40 bg-red-500/15 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {designRetrying[s] ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3 w-3" />
                      )}
                      {designRetrying[s] ? "Retrying…" : "Retry design analysis"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {(() => {
        const summary = getDesignSummary(
          designResult.mobile.issues,
          designResult.desktop.issues,
        );
        return summary ? (
          <div className="mt-4 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] p-3 text-sm text-[var(--color-text-secondary)]">
            <span className="font-medium text-[var(--color-text-primary)]">What the AI found: </span>
            {summary}
          </div>
        ) : null;
      })()}
    </div>
  ) : null;

  return (
    <div className="mt-6 space-y-6">
      {opportunityScoreEl}
      {performanceEl}
      {designEl}
    </div>
  );
}
