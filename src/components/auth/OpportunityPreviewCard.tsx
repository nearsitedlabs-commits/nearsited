/**
 * Live opportunity preview card for the auth story panel.
 *
 * Shows a realistic business opportunity with animated score ring and
 * cascading metric bars — all powered by CSS @keyframes and CSS variables.
 * Zero JavaScript animation overhead — pure CSS for instant rendering.
 */

"use client";

import { computeOpportunityScore, opportunityLabel } from "@/lib/scoring";

// Bright Smile Dental sample data — quality 41, 30 reviews, 4.2 rating
// computeOpportunityScore(41, 30, 4.2) = 72 → "High Opportunity"
const SAMPLE_QUALITY = 41;
const SAMPLE_REVIEWS = 30;
const SAMPLE_RATING = 4.2;
const sampleOppScore = computeOpportunityScore(SAMPLE_QUALITY, SAMPLE_REVIEWS, SAMPLE_RATING);
const sampleLabel = opportunityLabel(sampleOppScore);

const SCORE_BAR_COLORS = [
  "bg-[var(--score-high)]",
  "bg-[var(--score-mid)]",
  "bg-[var(--score-good)]",
  "bg-[var(--score-high)]",
];

const BAR_DATA = [
  { label: "Performance", value: 42 },
  { label: "Mobile UX",   value: 39 },
  { label: "SEO",         value: 48 },
  { label: "Trust",       value: 38 },
];

/**
 * Calculates the dashoffset for an SVG circle ring given a value (0–100).
 * r=40 → circumference ≈ 251.33
 */
function ringOffset(value: number): number {
  const circumference = 2 * Math.PI * 40;
  return circumference * (1 - value / 100);
}

export default function OpportunityPreviewCard() {
  return (
    <div className="w-full max-w-sm overflow-hidden rounded-[20px] border border-[var(--border)] bg-[var(--bg-surface-1)] shadow-[var(--brand-shadow-lg)]">
      {/* Top accent line */}
      <div className="h-px bg-gradient-to-r from-transparent via-[var(--accent)]/40 to-transparent" />

      {/* Content */}
      <div className="space-y-5 p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--text-tertiary)]">
              Dental Clinic · Dubai
            </p>
            <h3 className="mt-1.5 text-lg font-medium tracking-tight text-[var(--text-primary)]">
              Bright Smile Dental
            </h3>
            <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
              brightsmile.ae
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center rounded-full border border-[var(--badge-amber-border)] bg-[var(--badge-amber-bg)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--badge-amber-text)]">
            {sampleLabel}
          </span>
        </div>

        {/* Score ring + summary — static on first paint, animated via CSS */}
        <div className="flex items-center gap-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface-2)] p-4">
          <div className="relative flex h-[90px] w-[90px] shrink-0 items-center justify-center">
            <svg width="90" height="90" viewBox="0 0 90 90" className="-rotate-90">
              <circle cx="45" cy="45" r="40" fill="none" className="stroke-[var(--border-strong)]" strokeWidth="8" />
              <circle
                cx="45"
                cy="45"
                r="40"
                fill="none"
                className="stroke-[var(--score-mid)] animate-[ringDraw_1.2s_cubic-bezier(0.22,1,0.36,1)_0.1s_forwards]"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 40}
                strokeDashoffset={ringOffset(41)}
                style={{ strokeDashoffset: 2 * Math.PI * 40 /* start fully hidden */ }}
              />
            </svg>
            <span className="absolute text-xl font-bold text-[var(--text-primary)]">41</span>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
              Score
            </p>
            <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
              High-potential local lead with weak web presence.
            </p>
          </div>
        </div>

        {/* Metric bars — CSS-animated via @keyframes with staggered delays */}
        <div className="space-y-3">
          {BAR_DATA.map((item, i) => (
            <div key={item.label} className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[var(--text-secondary)]">{item.label}</span>
                <span className="text-[var(--text-tertiary)]">{item.value}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[var(--bg-surface-2)]">
                <div
                  className={`h-full rounded-full ${SCORE_BAR_COLORS[i]}`}
                  style={{
                    width: `${item.value}%`,
                    transform: "scaleX(0)",
                    animation: `barGrow 0.6s cubic-bezier(0.22, 1, 0.36, 1) ${0.3 + i * 0.12}s forwards`,
                    transformOrigin: "left",
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* AI pitch preview */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface-2)] p-4">
          <div className="flex items-center justify-between gap-4">
            <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
              AI Pitch — Ready
            </span>
            <span className="text-[10px] text-[var(--text-muted)]">generated in 1.4s</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
            Hi Dr. Sameer — I analysed your website and found{" "}
            <span className="font-medium text-[var(--text-primary)]">
              5 critical issues
            </span>{" "}
            that are quietly costing you patients every week…
          </p>
        </div>
      </div>

      {/* Bottom accent line */}
      <div className="h-px bg-gradient-to-r from-transparent via-[var(--accent)]/40 to-transparent" />

      {/* ── CSS @keyframes ── */}
      <style>{`
        @keyframes ringDraw {
          to {
            stroke-dashoffset: ${ringOffset(41)};
          }
        }
        @keyframes barGrow {
          from {
            transform: scaleX(0);
          }
          to {
            transform: scaleX(1);
          }
        }
      `}</style>
    </div>
  );
}
