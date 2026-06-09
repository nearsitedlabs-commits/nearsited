"use client";

import {
  AlertTriangle,
  ArrowRight,
  Loader2,
  Monitor,
  RefreshCw,
  Smartphone,
} from "lucide-react";
import { blendQualityForOpportunity, computeOpportunityScore } from "@/lib/scoring";
import { MetricKey, METRIC_META, metricColor } from "@/lib/metric-meta";
import type { StrategyResult, DesignResult, DesignRetrying } from "./types";

// ── Helpers ────────────────────────────────────────────────────────────────────

function getPerformanceSummary(
  mobile: number | null,
  desktop: number | null,
): string {
  if (mobile === null && desktop === null) return "";
  const count = (mobile !== null ? 1 : 0) + (desktop !== null ? 1 : 0);
  const avg = ((mobile ?? 0) + (desktop ?? 0)) / count;
  if (avg >= 85) return "This site loads quickly on both mobile and desktop. Performance is a strength.";
  if (avg >= 70) return "This site performs reasonably well but has room for improvement, especially on mobile.";
  if (avg >= 50) return "This site is noticeably slow. Visitors on mobile are likely leaving before it loads.";
  return "This site is critically slow. Most visitors will abandon it before seeing any content.";
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
      ? "text-[var(--text-tertiary)]"
      : score >= 70
        ? "text-[var(--score-good)]"
        : score >= 40
          ? "text-[var(--score-mid)]"
          : "text-[var(--score-high)]";
  return (
    <div className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2">
      <span className="text-sm text-[var(--text-secondary)]">{label}</span>
      <span className={`text-sm font-bold ${color}`}>{score ?? "—"}</span>
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

function timeAgo(ts: number): string {
  const mins = Math.floor((Date.now() - ts) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  return `${Math.floor(hours / 24)} days ago`;
}

export function AuditResultsPanel({
  auditResult,
  designResult,
  mapsRating,
  mapsReviewCount,
  onRetryDesign,
  designRetrying,
  savedTimestamp,
}: AuditResultsPanelProps) {
  if (!auditResult) return null;

  // ── Both strategies timed out ────────────────────────────────────────────────
  if (
    auditResult.mobile.status === "timeout" &&
    auditResult.desktop.status === "timeout"
  ) {
    return (
      <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-8 text-center">
        <AlertTriangle className="mx-auto h-10 w-10 text-[var(--score-mid)]" />
        <h2 className="mt-4 text-lg font-medium text-[var(--text-primary)]">
          Couldn&rsquo;t reach the site
        </h2>
        <p className="mt-2 max-w-md mx-auto text-sm text-[var(--text-secondary)]">
          The site took too long to respond. This usually means it&rsquo;s down, very slow, or
          blocking automated checks. Try again or test a different URL.
        </p>
      </div>
    );
  }

  // ── Timestamp ─────────────────────────────────────────────────────────────────
  const timestampEl =
    savedTimestamp ? (
      <p className="mt-3 text-xs text-[var(--text-tertiary)]">
        Showing results from {timeAgo(savedTimestamp)}
      </p>
    ) : null;

  // ── Opportunity Score ─────────────────────────────────────────────────────────
  const mP = auditResult.mobile.performance_score ?? null;
  const dP = auditResult.desktop.performance_score ?? null;
  const dS =
    designResult?.mobile?.design_score ?? designResult?.desktop?.design_score ?? null;
  const hasAnyScore = mP != null || dP != null || dS != null;

  const opportunityScoreEl =
    hasAnyScore ? (() => {
      const blendedQ = blendQualityForOpportunity(mP, dP, dS);
      const oppScore = computeOpportunityScore(
        blendedQ,
        mapsReviewCount ?? 0,
        mapsRating ?? 0,
        undefined,
      );
      const isVerified = mapsRating != null;
      const hasDesign = dS != null;
      return (
        <div className="flex items-center justify-between rounded-xl border border-[var(--accent)]/30 bg-[var(--accent-tint)] px-5 py-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--accent)]">
              {isVerified ? "Opportunity Score" : "Estimated Opportunity Score"}
            </p>
            {!isVerified && (
              <p className="mt-0.5 text-[11px] text-[var(--text-secondary)]">
                Add a Google Maps link above for a more accurate score
              </p>
            )}
            {isVerified && mapsRating != null && (
              <p className="mt-0.5 text-[11px] text-[var(--text-secondary)]">
                Based on {hasDesign ? "performance + design" : "performance"} +{" "}
                {mapsRating.toFixed(1)}★
                {mapsReviewCount != null && mapsReviewCount > 0
                  ? ` · ${mapsReviewCount} reviews`
                  : ""}
              </p>
            )}
          </div>
          <div className="text-right">
            <span className="text-4xl font-bold text-[var(--accent)]">{oppScore}</span>
            <span className="text-sm text-[var(--text-tertiary)]"> / 100</span>
          </div>
        </div>
      );
    })() : null;

  // ── Performance Scores ────────────────────────────────────────────────────────
  const performanceEl = (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface-1)] p-6">
      <h2 className="mb-4 text-lg font-medium text-[var(--text-primary)]">
        Performance Scores
      </h2>
      <div className="grid gap-6 md:grid-cols-2">
        {(["mobile", "desktop"] as const).map((s) => {
          const d = auditResult[s];
          const StratIcon = s === "mobile" ? Smartphone : Monitor;
          return (
            <div key={s} className="space-y-3">
              <div className="flex items-center gap-2">
                <StratIcon className="h-4 w-4 text-[var(--text-tertiary)]" />
                <p className="text-sm font-medium text-[var(--text-primary)]">
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
                        <div
                          key={key}
                          className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface-2)] px-3 py-2.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium text-[var(--text-primary)]">
                                {METRIC_META[key].label}
                              </p>
                              <p className="mt-0.5 text-[10px] text-[var(--text-tertiary)]">
                                {METRIC_META[key].subtitle}
                              </p>
                            </div>
                            <span
                              className={`shrink-0 text-sm font-bold ${metricColor(key, rawVal)}`}
                            >
                              {rawVal ?? "—"}
                            </span>
                          </div>
                        </div>
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

      {(() => {
        const summary = getPerformanceSummary(
          auditResult.mobile.performance_score,
          auditResult.desktop.performance_score,
        );
        return summary ? (
          <div className="mt-4 rounded-lg border border-[var(--accent)]/30 bg-[var(--accent-tint)] p-3 text-sm text-[var(--accent)]">
            {summary}
          </div>
        ) : null;
      })()}
    </div>
  );

  // ── Design Analysis ───────────────────────────────────────────────────────────
  const designEl = designResult ? (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface-1)] p-6">
      <h2 className="mb-4 text-lg font-medium text-[var(--text-primary)]">
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
                <StratIcon className="h-4 w-4 text-[var(--text-tertiary)]" />
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {s === "mobile" ? "Mobile" : "Desktop"}
                </p>
              </div>
              {d.status === "ok" ? (
                <>
                  <div className="mb-3 flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold text-[var(--text-primary)]">
                      {d.design_score}
                    </span>
                    <span className="text-sm text-[var(--text-tertiary)]">/ 100</span>
                  </div>
                  {d.issues && d.issues.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-[var(--text-tertiary)]">
                        Issues found
                      </p>
                      {d.issues.slice(0, 3).map((issue, i) => (
                        <div
                          key={i}
                          className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface-2)] p-2"
                        >
                          <p className="text-xs font-medium text-[var(--text-primary)]">
                            {issue.title}
                          </p>
                          <p className="mt-0.5 text-[11px] text-[var(--text-tertiary)]">
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
                <div className="rounded-lg border border-dashed border-red-500/30 bg-red-500/10 p-4">
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
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-red-500/40 bg-red-500/15 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-50"
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
          <div className="mt-4 rounded-lg border border-[var(--accent)]/30 bg-[var(--accent-tint)] p-3 text-sm text-[var(--accent)]">
            <span className="font-medium">What the AI found: </span>
            {summary}
          </div>
        ) : null;
      })()}
    </div>
  ) : null;

  return (
    <div className="mt-6 space-y-6">
      {timestampEl}
      {opportunityScoreEl}
      {performanceEl}
      {designEl}
    </div>
  );
}
