"use client";

import { computeOpportunityScore, opportunityLabel } from "@/lib/scoring";

// Bright Smile Dental sample data — quality 41, 30 reviews, 4.2 rating
// computeOpportunityScore(41, 30, 4.2) = 72 → "High Opportunity"
const SAMPLE_QUALITY = 41;
const SAMPLE_REVIEWS = 30;
const SAMPLE_RATING = 4.2;
const sampleOppScore = computeOpportunityScore(SAMPLE_QUALITY, SAMPLE_REVIEWS, SAMPLE_RATING);
const sampleLabel = opportunityLabel(sampleOppScore);

export default function HeroCard() {
  return (
    <div className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-[var(--border)] bg-[rgba(255,255,255,0.04)] p-8 shadow-[var(--brand-shadow-lg)]">
      <div className="absolute inset-x-8 top-0 h-1 bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent" />
      <div className="space-y-6 pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-[0.3em] text-[var(--text-tertiary)]">Dental Clinic · Dubai</div>
            <h3 className="mt-2 text-xl font-semibold text-[var(--text-primary)]">Bright Smile Dental</h3>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">Jumeirah · brightsmile.ae</p>
          </div>
          <span className="inline-flex items-center rounded-full bg-[rgba(232,108,74,0.15)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.17em] text-[#ff8c64]">
            {sampleLabel}
          </span>
        </div>

        <div className="rounded-3xl border border-[var(--border)] bg-[rgba(255,255,255,0.03)] p-5">
          <div className="flex items-center gap-5 border-b border-[var(--border)] pb-5">
            <div className="flex h-[90px] w-[90px] items-center justify-center rounded-3xl bg-[rgba(255,255,255,0.04)]">
              <svg viewBox="0 0 100 100" className="h-20 w-20">
                <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="12" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#e86c4a" strokeWidth="12" strokeDasharray="251.2" strokeDashoffset="148.2" strokeLinecap="round" transform="rotate(-90 50 50)" />
                <text x="50" y="56" textAnchor="middle" fontSize="26" fontWeight="700" fill="white">41</text>
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-[10px] uppercase tracking-[0.24em] text-[var(--text-tertiary)]">Score</div>
              <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">High-potential local lead with weak web presence.</p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {[
              { label: "Performance", value: 42 },
              { label: "Mobile UX", value: 39 },
              { label: "SEO", value: 48 },
              { label: "Trust", value: 38 },
            ].map((item) => (
              <div key={item.label} className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)]">
                  <span>{item.label}</span>
                  <span>{item.value}</span>
                </div>
                <div className="h-2 rounded-full bg-[rgba(255,255,255,0.08)]">
                  <div
                    className={`h-full rounded-full ${item.value <= 55 ? "bg-[#e86c4a]" : item.value <= 74 ? "bg-[#d4a017]" : "bg-[#4caf76]"}`}
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-[var(--border)] bg-[rgba(79,70,229,0.06)] p-5">
          <div className="flex items-center justify-between gap-4 text-[10px] uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
            <span className="inline-flex items-center gap-2">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
              AI Pitch — Ready
            </span>
            <span>written in 1.4s</span>
          </div>
          <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">
            Hi Dr. Sameer — I analysed your website and found <span className="font-medium text-[var(--text-primary)]">5 critical issues</span> that are quietly costing you patients every week…
          </p>
          <div className="mt-5 flex flex-wrap gap-3 border-t border-[rgba(255,255,255,0.08)] pt-4">
            <button className="rounded-full border border-[var(--border)] bg-transparent px-4 py-2 text-[11px] font-medium text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]">
              View Full Pitch
            </button>
            <button className="rounded-full bg-[var(--accent)] px-4 py-2 text-[11px] font-semibold text-white transition hover:bg-[var(--accent-hover)]">
              Copy →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
