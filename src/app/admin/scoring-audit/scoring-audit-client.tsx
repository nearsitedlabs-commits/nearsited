"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle, ChevronDown, ChevronRight, TrendingDown, TrendingUp,
  Activity, Info, Zap, Target, BarChart3,
} from "lucide-react";
import type { AuditBusiness, ScoreExplanation } from "./score-explainer";
import { explainScore, generateAuditReport } from "./score-explainer";

// ── Helpers ───────────────────────────────────────────────────────────────────

function scoreColor(s: number) {
  return s >= 70 ? "text-[var(--score-good)]" : s >= 45 ? "text-[var(--score-mid)]" : "text-[var(--score-high)]";
}

function scoreBg(s: number) {
  return s >= 70 ? "bg-[var(--score-good-tint)] border-[var(--score-good)]/30" : s >= 45 ? "bg-[var(--score-mid-tint)] border-[var(--score-mid)]/30" : "bg-red-500/10 border-red-500/30";
}

function statusBadge(ws: string | null) {
  switch (ws) {
    case "no_website":    return <span className="rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-400">No Website</span>;
    case "social_only":   return <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400">Social Only</span>;
    case "platform_only": return <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-400">Platform</span>;
    case "has_website":   return <span className="rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-tertiary)]">Has Website</span>;
    default:              return <span className="rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-tertiary)]">Unknown</span>;
  }
}

function flagIcon(type: ScoreExplanation["flags"][number]["type"]) {
  switch (type) {
    case "high_warning": return <TrendingUp className="h-3.5 w-3.5 text-red-400" />;
    case "low_warning":  return <TrendingDown className="h-3.5 w-3.5 text-amber-400" />;
    case "suspicious":   return <AlertTriangle className="h-3.5 w-3.5 text-orange-400" />;
    case "cliff":        return <Activity className="h-3.5 w-3.5 text-blue-400" />;
    case "info":         return <Info className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />;
  }
}

function flagBg(type: ScoreExplanation["flags"][number]["type"]) {
  switch (type) {
    case "high_warning": return "border-red-500/20 bg-red-500/5";
    case "low_warning":  return "border-amber-500/20 bg-amber-500/5";
    case "suspicious":   return "border-orange-500/20 bg-orange-500/5";
    case "cliff":        return "border-blue-500/20 bg-blue-500/5";
    case "info":         return "border-[var(--border)] bg-[var(--bg-elevated)]";
  }
}

// ── Score breakdown row ───────────────────────────────────────────────────────

function ExpandedBreakdown({ biz, explanation }: { biz: AuditBusiness; explanation: ScoreExplanation }) {
  return (
    <div className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--bg-base)] p-4 space-y-4">
      {/* Method badge */}
      <div className="flex items-center gap-2">
        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${explanation.method === "verified" ? "border-[var(--score-good)]/40 bg-[var(--score-good-tint)] text-[var(--score-good)]" : "border-[var(--score-mid)]/40 bg-[var(--score-mid-tint)] text-[var(--score-mid)]"}`}>
          {explanation.method === "verified" ? "✓ Verified (audited)" : "~ Estimated (pre-audit)"}
        </span>
        {explanation.storedScore !== null && explanation.method === "verified" && Math.abs(explanation.storedScore - explanation.displayScore) > 2 && (
          <span className="text-[10px] text-amber-400">Note: stored score ({explanation.storedScore}) differs from recomputed ({explanation.displayScore})</span>
        )}
      </div>

      {/* Components */}
      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">Score Components</p>
        <div className="space-y-2">
          {explanation.components.map((c) => (
            <div key={c.label} className="flex items-start gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2">
              <div className="w-36 shrink-0">
                <span className="text-xs font-medium text-[var(--text-primary)]">{c.label}</span>
              </div>
              <div className="w-14 shrink-0 text-right">
                <span className="text-sm font-bold text-[var(--accent)]">{c.displayValue}</span>
              </div>
              <div className="flex-1">
                <span className="text-xs text-[var(--text-tertiary)]">{c.description}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Formula */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)] mb-1">Formula</p>
        <p className="font-mono text-xs text-[var(--text-primary)]">{explanation.formula}</p>
      </div>

      {/* Flags */}
      {explanation.flags.length > 0 && (
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">Flags</p>
          <div className="space-y-1.5">
            {explanation.flags.map((f, i) => (
              <div key={i} className={`flex items-start gap-2 rounded-lg border px-3 py-2 ${flagBg(f.type)}`}>
                <span className="mt-0.5 shrink-0">{flagIcon(f.type)}</span>
                <p className="text-xs text-[var(--text-secondary)]">{f.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Raw data */}
      <div className="grid grid-cols-2 gap-2 text-[10px] text-[var(--text-tertiary)] sm:grid-cols-4">
        <div>Reviews: <span className="text-[var(--text-primary)]">{biz.review_count ?? "—"}</span></div>
        <div>Rating: <span className="text-[var(--text-primary)]">{biz.rating ? `${biz.rating}★` : "—"}</span></div>
        <div>Perf score: <span className="text-[var(--text-primary)]">{biz.performance_score ?? "—"}</span></div>
        <div>Design score: <span className="text-[var(--text-primary)]">{biz.design_score ?? "—"}</span></div>
        <div>Audited: <span className="text-[var(--text-primary)]">{biz.audited_at ? "Yes" : "No"}</span></div>
        <div>Stored score: <span className="text-[var(--text-primary)]">{biz.opportunity_score ?? "—"}</span></div>
        <div>Flagged for outreach: <span className="text-[var(--text-primary)]">{biz.flagged_for_outreach ? "Yes" : "No"}</span></div>
        <div>Industry: <span className="text-[var(--text-primary)]">{biz.business_type ?? "—"}</span></div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ScoringAuditClient({ businesses }: { businesses: AuditBusiness[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterFlag, setFilterFlag] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"score" | "name" | "reviews" | "rating">("score");
  const [search, setSearch] = useState("");
  const [showReport, setShowReport] = useState(true);
  const [showTop50Only, setShowTop50Only] = useState(false);

  const { explanations, report } = useMemo(() => {
    const exps = businesses.map(explainScore);
    const rep = generateAuditReport(businesses, exps);
    return { explanations: exps, report: rep };
  }, [businesses]);

  const filtered = useMemo(() => {
    let list = businesses.map((b, i) => ({ biz: b, exp: explanations[i], rank: i + 1 }));

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(({ biz }) => biz.name.toLowerCase().includes(q) || (biz.business_type ?? "").toLowerCase().includes(q));
    }
    if (filterStatus !== "all") {
      list = list.filter(({ biz }) => biz.website_status === filterStatus);
    }
    if (filterFlag === "flagged") {
      list = list.filter(({ exp }) => exp.flags.some(f => f.type === "high_warning" || f.type === "low_warning"));
    } else if (filterFlag === "high_warning") {
      list = list.filter(({ exp }) => exp.flags.some(f => f.type === "high_warning"));
    } else if (filterFlag === "low_warning") {
      list = list.filter(({ exp }) => exp.flags.some(f => f.type === "low_warning"));
    } else if (filterFlag === "suspicious") {
      list = list.filter(({ exp }) => exp.flags.some(f => f.type === "suspicious"));
    } else if (filterFlag === "cliff") {
      list = list.filter(({ exp }) => exp.flags.some(f => f.type === "cliff"));
    }

    list.sort((a, b) => {
      if (sortBy === "score")   return b.exp.displayScore - a.exp.displayScore;
      if (sortBy === "name")    return a.biz.name.localeCompare(b.biz.name);
      if (sortBy === "reviews") return (b.biz.review_count ?? 0) - (a.biz.review_count ?? 0);
      if (sortBy === "rating")  return (b.biz.rating ?? 0) - (a.biz.rating ?? 0);
      return 0;
    });

    if (showTop50Only) list = list.slice(0, 50);

    return list;
  }, [businesses, explanations, search, filterStatus, filterFlag, sortBy, showTop50Only]);

  function toggle(id: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const confidenceColor = report.scoringConfidence >= 75 ? "text-[var(--score-good)]" : report.scoringConfidence >= 55 ? "text-[var(--score-mid)]" : "text-[var(--score-high)]";

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-[var(--accent)]" />
          Opportunity Score Audit
        </h1>
        <p className="mt-1 text-sm text-[var(--text-tertiary)]">
          Read-only analysis. DO NOT modify production weights from this view.
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total Businesses", value: report.totalBusinesses, icon: Target },
          { label: "Average Score", value: report.avgScore, icon: BarChart3 },
          { label: "Flagged (Wrong Rank)", value: report.flaggedCount, icon: AlertTriangle, warn: report.flaggedCount > 5 },
          { label: "Model Confidence", value: `${report.scoringConfidence}%`, icon: Zap, colorClass: confidenceColor },
        ].map(({ label, value, icon: Icon, warn, colorClass }) => (
          <div key={label} className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-[var(--text-tertiary)]">{label}</span>
              <Icon className={`h-4 w-4 ${warn ? "text-red-400" : "text-[var(--text-tertiary)]"}`} />
            </div>
            <p className={`text-2xl font-bold ${colorClass ?? (warn ? "text-red-400" : "text-[var(--text-primary)]")}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Status distribution */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">Score Distribution by Web Presence</h2>
        <div className="flex flex-wrap gap-3">
          {report.byStatus.map((g) => (
            <div key={g.status} className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-center min-w-[120px]">
              <div className="mb-1">{statusBadge(g.status)}</div>
              <p className={`text-lg font-bold ${scoreColor(g.avgScore)}`}>{g.avgScore}</p>
              <p className="text-[10px] text-[var(--text-tertiary)]">avg · {g.count} businesses</p>
              {g.flaggedCount > 0 && <p className="text-[10px] text-red-400">{g.flaggedCount} flagged</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Audit Report */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)]">
        <button
          onClick={() => setShowReport(v => !v)}
          className="w-full flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
        >
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Audit Report</h2>
          {showReport ? <ChevronDown className="h-4 w-4 text-[var(--text-tertiary)]" /> : <ChevronRight className="h-4 w-4 text-[var(--text-tertiary)]" />}
        </button>

        {showReport && (
          <div className="border-t border-[var(--border)] p-5 space-y-6">
            {/* Systematic issues */}
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">Systematic Issues</h3>
              <div className="space-y-2">
                {report.systematicIssues.map((issue) => (
                  <div key={issue.title} className={`rounded-lg border p-3 ${issue.severity === "high" ? "border-red-500/30 bg-red-500/5" : issue.severity === "medium" ? "border-amber-500/30 bg-amber-500/5" : "border-[var(--border)] bg-[var(--bg-elevated)]"}`}>
                    <div className="flex items-start gap-2">
                      <span className={`mt-0.5 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${issue.severity === "high" ? "bg-red-500/20 text-red-400" : issue.severity === "medium" ? "bg-amber-500/20 text-amber-400" : "bg-[var(--bg-surface)] text-[var(--text-tertiary)]"}`}>
                        {issue.severity}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-[var(--text-primary)]">{issue.title} {issue.count > 0 && <span className="text-[var(--text-tertiary)]">({issue.count})</span>}</p>
                        <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{issue.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">Recommended Formula Changes</h3>
              <div className="space-y-3">
                {report.recommendations.map((rec) => (
                  <div key={rec.title} className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${rec.impact === "high" ? "bg-red-500/20 text-red-400" : rec.impact === "medium" ? "bg-amber-500/20 text-amber-400" : "bg-blue-500/20 text-blue-400"}`}>
                        {rec.impact} impact
                      </span>
                      <p className="text-sm font-medium text-[var(--text-primary)]">{rec.title}</p>
                    </div>
                    <div className="grid gap-1 sm:grid-cols-2 text-xs">
                      <div className="rounded bg-red-500/5 border border-red-500/20 px-2 py-1.5">
                        <span className="text-red-400 font-medium">Current: </span>
                        <span className="text-[var(--text-secondary)]">{rec.current}</span>
                      </div>
                      <div className="rounded bg-[var(--score-good-tint)] border border-[var(--score-good)]/20 px-2 py-1.5">
                        <span className="text-[var(--score-good)] font-medium">Suggested: </span>
                        <span className="text-[var(--text-secondary)]">{rec.suggested}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Business table */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)]">
        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3 border-b border-[var(--border)] px-5 py-4">
          <input
            type="text"
            placeholder="Search business or industry…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)] w-48"
          />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-1.5 text-xs text-[var(--text-secondary)] outline-none focus:border-[var(--accent)]">
            <option value="all">All Statuses</option>
            <option value="no_website">No Website</option>
            <option value="social_only">Social Only</option>
            <option value="platform_only">Platform Only</option>
            <option value="has_website">Has Website</option>
          </select>
          <select value={filterFlag} onChange={e => setFilterFlag(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-1.5 text-xs text-[var(--text-secondary)] outline-none focus:border-[var(--accent)]">
            <option value="all">All Flags</option>
            <option value="flagged">Flagged Only</option>
            <option value="high_warning">Over-scored</option>
            <option value="low_warning">Under-scored</option>
            <option value="suspicious">Suspicious</option>
            <option value="cliff">Threshold Cliff</option>
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}
            className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-1.5 text-xs text-[var(--text-secondary)] outline-none focus:border-[var(--accent)]">
            <option value="score">Sort: Score</option>
            <option value="reviews">Sort: Reviews</option>
            <option value="rating">Sort: Rating</option>
            <option value="name">Sort: Name</option>
          </select>
          <label className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)] cursor-pointer">
            <input type="checkbox" checked={showTop50Only} onChange={e => setShowTop50Only(e.target.checked)} />
            Top 50 only
          </label>
          <span className="ml-auto text-xs text-[var(--text-tertiary)]">{filtered.length} businesses</span>
        </div>

        {/* Table header */}
        <div className="grid grid-cols-[2rem_1fr_6rem_4rem_5rem_5rem_4rem_4rem] items-center gap-2 border-b border-[var(--border)] px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">
          <span>#</span>
          <span>Business</span>
          <span>Status</span>
          <span className="text-right">Score</span>
          <span className="text-right">Reviews</span>
          <span className="text-right">Rating</span>
          <span className="text-right">Flags</span>
          <span />
        </div>

        {/* Rows */}
        <div className="divide-y divide-[var(--border)]">
          {filtered.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-[var(--text-tertiary)]">No businesses match the current filters.</div>
          )}
          {filtered.map(({ biz, exp, rank }) => {
            const isOpen = expanded.has(biz.id);
            const hasWarning = exp.flags.some(f => f.type === "high_warning" || f.type === "low_warning");
            const hasSuspicious = exp.flags.some(f => f.type === "suspicious");
            const flagCount = exp.flags.filter(f => f.type !== "info").length;
            return (
              <div key={biz.id} className={`px-4 py-2.5 ${hasWarning ? "bg-amber-500/[0.03]" : ""}`}>
                <div className="grid grid-cols-[2rem_1fr_6rem_4rem_5rem_5rem_4rem_4rem] items-center gap-2">
                  <span className="text-xs text-[var(--text-tertiary)]">{rank}</span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[var(--text-primary)]">{biz.name}</p>
                    <p className="truncate text-[10px] text-[var(--text-tertiary)]">{biz.business_type ?? "—"}{biz.city ? ` · ${biz.city}` : ""}</p>
                  </div>
                  <div>{statusBadge(biz.website_status)}</div>
                  <div className="text-right">
                    <span className={`text-sm font-bold ${scoreColor(exp.displayScore)}`}>{exp.displayScore}</span>
                    <span className={`ml-0.5 text-[9px] ${exp.method === "verified" ? "text-[var(--score-good)]" : "text-[var(--score-mid)]"}`}>
                      {exp.method === "verified" ? "✓" : "~"}
                    </span>
                  </div>
                  <div className="text-right text-xs text-[var(--text-secondary)]">{biz.review_count ?? "—"}</div>
                  <div className="text-right text-xs text-[var(--text-secondary)]">{biz.rating ? `${biz.rating}★` : "—"}</div>
                  <div className="text-right">
                    {flagCount > 0 ? (
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${hasWarning ? "bg-red-500/15 text-red-400" : hasSuspicious ? "bg-orange-500/15 text-orange-400" : "bg-blue-500/15 text-blue-400"}`}>
                        {flagCount}
                      </span>
                    ) : (
                      <span className="text-[10px] text-[var(--score-good)]">✓</span>
                    )}
                  </div>
                  <button
                    onClick={() => toggle(biz.id)}
                    className="flex cursor-pointer items-center justify-end text-[var(--text-tertiary)] hover:text-[var(--accent)] transition-colors"
                  >
                    {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                </div>
                {isOpen && <ExpandedBreakdown biz={biz} explanation={exp} />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
