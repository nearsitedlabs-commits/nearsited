"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

// ── Types ─────────────────────────────────────────────────────────────────────

type ShareData = {
  business: {
    name: string;
    business_type: string;
    address: string;
    city: string;
    website: string | null;
    website_status: string;
    rating: number | null;
    review_count: number | null;
    performance_score: number | null;
    design_score: number | null;
    audited_at: string | null;
    design_analyzed_at: string | null;
  };
  mobileAudit: Record<string, unknown> | null;
  desktopAudit: Record<string, unknown> | null;
  mobileDesign: Record<string, unknown> | null;
  desktopDesign: Record<string, unknown> | null;
};

// ── Count Up ──────────────────────────────────────────────────────────────────

function CountUp({ value, duration = 800 }: { value: number | null; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const done = useRef(false);

  useEffect(() => {
    if (value === null) return;
    if (done.current) { setDisplay(value); return; }
    done.current = true;
    const start = performance.now();
    const from = 0;
    const diff = value - from;
    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + diff * eased));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [value, duration]);

  if (value === null) return <span className="tabular-nums">—</span>;
  return <span className="tabular-nums">{display}</span>;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ScoreRing({ score, size = "md" }: { score: number | null; size?: "sm" | "md" | "lg" }) {
  const dim = size === "lg" ? 80 : size === "sm" ? 40 : 56;
  const stroke = size === "lg" ? 5 : size === "sm" ? 3 : 4;
  const r = (dim - stroke) / 2;
  const circumference = 2 * Math.PI * r;

  if (score === null) {
    return (
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center justify-center rounded-full border-2 border-[var(--border)] bg-[var(--bg-surface-2)]" style={{ width: dim, height: dim }}>
          <span className="text-sm font-bold text-[var(--text-tertiary)]">—</span>
        </div>
      </div>
    );
  }

  const clamped = Math.max(0, Math.min(100, score));
  const offset = circumference - (clamped / 100) * circumference;
  const color = clamped >= 70 ? "stroke-[var(--score-good)]" : clamped >= 40 ? "stroke-[var(--score-mid)]" : "stroke-[var(--score-high)]";
  const textColor = clamped >= 70 ? "text-[var(--score-good)]" : clamped >= 40 ? "text-[var(--score-mid)]" : "text-[var(--score-high)]";
  const lbl = clamped >= 85 ? "Strong" : clamped >= 70 ? "Good" : clamped >= 40 ? "Needs Improvement" : "Poor";

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative flex items-center justify-center" style={{ width: dim, height: dim }}>
        <svg width={dim} height={dim} className="-rotate-90">
          <circle cx={dim / 2} cy={dim / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-[var(--border-strong)]" />
          <motion.circle
            cx={dim / 2} cy={dim / 2} r={r} fill="none" strokeWidth={stroke} strokeLinecap="round"
            className={color}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          />
        </svg>
        <span className={`absolute font-bold ${size === "lg" ? "text-xl" : "text-sm"} ${textColor}`}>
          <CountUp value={clamped} />
        </span>
      </div>
      <span className={`text-center text-xs font-medium ${textColor}`}>{lbl}</span>
    </div>
  );
}

function SubScore({ label, score }: { label: string; score: number | null }) {
  const color = score === null
    ? "text-[var(--text-tertiary)]"
    : score >= 70 ? "text-[var(--score-good)]"
    : score >= 40 ? "text-[var(--score-mid)]"
    : "text-[var(--score-high)]";
  return (
    <div className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2">
      <span className="text-sm text-[var(--text-secondary)]">{label}</span>
      <span className={`text-sm font-bold ${color} tabular-nums`}>
        {score !== null ? <CountUp value={score} /> : "—"}
      </span>
    </div>
  );
}

function ImpactPill({ impact }: { impact: string }) {
  const color = impact === "High"
    ? "bg-[var(--status-error-bg)] text-[var(--status-error-text)] border-[var(--status-error-text)]/30"
    : impact === "Medium"
    ? "bg-[var(--status-warning-bg)] text-[var(--status-warning-text)] border-[var(--status-warning-text)]/30"
    : "bg-[var(--status-success-bg)] text-[var(--status-success-text)] border-[var(--status-success-text)]/30";
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${color}`}>
      {impact}
    </span>
  );
}

function getDesignSummary(
  mobileIssues: { title: string; detail: string }[] | undefined,
  desktopIssues: { title: string; detail: string }[] | undefined,
): string {
  const all = [...(mobileIssues ?? []), ...(desktopIssues ?? [])];
  if (all.length === 0) return "";
  const top = all.slice(0, 3).map((i) => i.title.toLowerCase());
  if (top.length === 1) return `The main issue found: ${top[0]}.`;
  const last = top.pop();
  return `The main issues found: ${top.join(", ")}, and ${last}.`;
}

// ── Reveal Section Wrapper ────────────────────────────────────────────────────

function Section({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {children}
    </motion.div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ShareReportClient({ data }: { data: ShareData }) {
  const { business, mobileAudit, desktopAudit, mobileDesign, desktopDesign } = data;
  const overallScore = business.performance_score ?? business.design_score;
  const issues = [
    ...((mobileDesign?.issues as { title: string; detail: string; point_deduction?: number; impact: string }[]) ?? []),
    ...((desktopDesign?.issues as { title: string; detail: string; point_deduction?: number; impact: string }[]) ?? []),
  ].slice(0, 5);

  return (
    <div className="min-h-screen bg-[var(--bg-base)] py-8">
      <div className="mx-auto max-w-4xl px-4">

        {/* Header */}
        <Section>
          <div className="mb-6 text-center">
            <motion.p
              className="text-xs uppercase tracking-[0.2em] text-[var(--text-tertiary)]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              Shared Report — Nearsited
            </motion.p>
            <motion.h1
              className="mt-2 text-3xl font-bold text-[var(--text-primary)]"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
            >
              {business.name}
            </motion.h1>
            <motion.p
              className="mt-1 text-sm text-[var(--text-secondary)]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              {business.business_type} &middot; {business.city} &middot; {business.address}
            </motion.p>
            {business.website && (
              <motion.a
                href={business.website}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-sm text-[var(--accent)] hover:underline"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.15 }}
              >
                {business.website}
              </motion.a>
            )}
          </div>
        </Section>

        {/* Overall Score */}
        <Section delay={0.1}>
          <div className="mb-6 flex justify-center">
            <ScoreRing score={overallScore} size="lg" />
          </div>
        </Section>

        {/* Performance Scores */}
        <Section delay={0.15}>
          <div className="mb-6 grid gap-6 md:grid-cols-2">
            {/* Mobile Audit */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface-1)] p-6">
              <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">📱 Mobile</p>
              {mobileAudit ? (
                <div className="space-y-2">
                  <SubScore label="Performance" score={(mobileAudit.performance_score as number | null) ?? null} />
                  <SubScore label="SEO" score={(mobileAudit.seo_score as number | null) ?? null} />
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg bg-[var(--bg-elevated)] p-2">
                      <span className="text-[var(--text-tertiary)]">FCP</span>
                      <p className="font-medium text-[var(--text-primary)]">{mobileAudit.fcp as string ?? "—"}</p>
                    </div>
                    <div className="rounded-lg bg-[var(--bg-elevated)] p-2">
                      <span className="text-[var(--text-tertiary)]">LCP</span>
                      <p className="font-medium text-[var(--text-primary)]">{mobileAudit.lcp as string ?? "—"}</p>
                    </div>
                    <div className="rounded-lg bg-[var(--bg-elevated)] p-2">
                      <span className="text-[var(--text-tertiary)]">TBT</span>
                      <p className="font-medium text-[var(--text-primary)]">{mobileAudit.tbt as string ?? "—"}</p>
                    </div>
                    <div className="rounded-lg bg-[var(--bg-elevated)] p-2">
                      <span className="text-[var(--text-tertiary)]">CLS</span>
                      <p className="font-medium text-[var(--text-primary)]">{mobileAudit.cls as string ?? "—"}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-[var(--text-tertiary)]">No audit data available</p>
              )}
            </div>

            {/* Desktop Audit */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface-1)] p-6">
              <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">🖥️ Desktop</p>
              {desktopAudit ? (
                <div className="space-y-2">
                  <SubScore label="Performance" score={(desktopAudit.performance_score as number | null) ?? null} />
                  <SubScore label="SEO" score={(desktopAudit.seo_score as number | null) ?? null} />
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg bg-[var(--bg-elevated)] p-2">
                      <span className="text-[var(--text-tertiary)]">FCP</span>
                      <p className="font-medium text-[var(--text-primary)]">{desktopAudit.fcp as string ?? "—"}</p>
                    </div>
                    <div className="rounded-lg bg-[var(--bg-elevated)] p-2">
                      <span className="text-[var(--text-tertiary)]">LCP</span>
                      <p className="font-medium text-[var(--text-primary)]">{desktopAudit.lcp as string ?? "—"}</p>
                    </div>
                    <div className="rounded-lg bg-[var(--bg-elevated)] p-2">
                      <span className="text-[var(--text-tertiary)]">TBT</span>
                      <p className="font-medium text-[var(--text-primary)]">{desktopAudit.tbt as string ?? "—"}</p>
                    </div>
                    <div className="rounded-lg bg-[var(--bg-elevated)] p-2">
                      <span className="text-[var(--text-tertiary)]">CLS</span>
                      <p className="font-medium text-[var(--text-primary)]">{desktopAudit.cls as string ?? "—"}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-[var(--text-tertiary)]">No audit data available</p>
              )}
            </div>
          </div>
        </Section>

        {/* AI Opportunity Summary */}
        {issues.length > 0 && (
          <Section delay={0.2}>
            <div className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--bg-surface-1)] p-6">
              <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">AI Opportunity Summary</h2>
              <p className="mb-3 text-sm leading-relaxed text-[var(--text-secondary)]">
                {getDesignSummary(
                  mobileDesign?.issues as { title: string; detail: string }[] | undefined,
                  desktopDesign?.issues as { title: string; detail: string }[] | undefined,
                )}
              </p>
              <ul className="space-y-2">
                {issues.slice(0, 4).map((issue, i) => (
                  <motion.li
                    key={i}
                    className="flex items-start gap-2 text-sm text-[var(--text-secondary)]"
                    initial={{ opacity: 0, x: -8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: i * 0.06 }}
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
                    {issue.detail}
                  </motion.li>
                ))}
              </ul>
            </div>
          </Section>
        )}

        {/* Design Issues */}
        {issues.length > 0 && (
          <Section delay={0.25}>
            <div className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--bg-surface-1)] p-6">
              <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">Design Issues</h2>
              <div className="space-y-3">
                {issues.map((issue, i) => (
                  <motion.div
                    key={i}
                    className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-3"
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-[var(--text-primary)]">{issue.title}</p>
                        <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">{issue.detail}</p>
                      </div>
                      <div className="ml-3 flex flex-col items-end gap-1">
                        <ImpactPill impact={issue.impact ?? "Medium"} />
                        {issue.point_deduction && (
                          <span className="text-xs font-bold text-[var(--score-high)]">-{issue.point_deduction}pts</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </Section>
        )}

        {/* Footer */}
        <Section delay={0.3}>
          <div className="text-center text-xs text-[var(--text-tertiary)]">
            <p>Generated by <span className="font-semibold text-[var(--accent)]">Nearsited</span> &mdash; AI-powered redesign opportunity intelligence</p>
            {business.design_analyzed_at && (
              <p className="mt-1">Analysed {new Date(business.design_analyzed_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
            )}
          </div>
        </Section>

      </div>
    </div>
  );
}
