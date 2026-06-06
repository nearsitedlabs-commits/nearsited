/**
 * Live opportunity preview card for the auth story panel.
 *
 * Cycles through three opportunity types on each load:
 * - Weak Website (Bright Smile Dental)
 * - Social Only (Dubai Fitness Studio)
 * - No Website (Al Noor Plumbing)
 *
 * All powered by CSS @keyframes and CSS variables.
 * Zero JavaScript animation overhead — pure CSS for instant rendering.
 */

"use client";


// ── Three opportunity types ─────────────────────────────────────────────────

type OppType = {
  name: string;
  subtitle: string;
  url: string;
  category: string;
  quality: number;
  reviews: number;
  rating: number;
  scoreBarData: { label: string; value: number }[];
  badgeLabel: string;
  description: string;
  pitchText: React.ReactNode;
  scoreColor: string;
};

const OPPORTUNITIES: OppType[] = [
  // 1. Weak Website
  {
    name: "Bright Smile Dental",
    subtitle: "Dental Clinic · Dubai",
    url: "brightsmile.ae",
    category: "Healthcare",
    quality: 46,
    reviews: 30,
    rating: 4.2,
    scoreBarData: [
      { label: "Performance", value: 42 },
      { label: "Mobile UX",   value: 39 },
      { label: "SEO",         value: 48 },
      { label: "Trust",       value: 38 },
    ],
    badgeLabel: "Weak Website",
    description: "High-potential local lead with weak web presence.",
    pitchText: (
      <>
        I analysed your website and found{" "}
        <span className="font-medium text-[var(--text-primary)]">
          5 critical issues
        </span>{" "}
        that are quietly costing you patients every week&hellip;
      </>
    ),
    scoreColor: "var(--score-mid)",
  },
  // 2. Social Only
  {
    name: "Dubai Fitness Studio",
    subtitle: "Gym · Dubai Marina",
    url: "instagram.com/dubaifitness",
    category: "Fitness",
    quality: 72,
    reviews: 85,
    rating: 4.5,
    scoreBarData: [
      { label: "Instagram",   value: 78 },
      { label: "Engagement",  value: 65 },
      { label: "Reviews",     value: 85 },
      { label: "Google Maps", value: 0 },
    ],
    badgeLabel: "Social Only",
    description: "Strong social following, no owned web presence.",
    pitchText: (
      <>
        Your Instagram looks great — but you&rsquo;re renting your audience.
        A website turns followers into{" "}
        <span className="font-medium text-[var(--text-primary)]">
          booked clients you control
        </span>
        .
      </>
    ),
    scoreColor: "#f59e0b",
  },
  // 3. No Website
  {
    name: "Al Noor Plumbing",
    subtitle: "Plumbing · Deira, Dubai",
    url: "No website — Google Business only",
    category: "Home Services",
    quality: 52,
    reviews: 42,
    rating: 4.7,
    scoreBarData: [
      { label: "Google Rating", value: 94 },
      { label: "Reviews",       value: 42 },
      { label: "Visibility",    value: 15 },
      { label: "Website",       value: 0 },
    ],
    badgeLabel: "No Website",
    description: "Highest-value lead — no website, strong reputation.",
    pitchText: (
      <>
        Great reviews, but{" "}
        <span className="font-medium text-[var(--text-primary)]">
          zero Google visibility
        </span>{" "}
        beyond Maps. Every day without a website is lost calls and lost jobs.
      </>
    ),
    scoreColor: "var(--score-high)",
  },
];

// ── Pick one deterministically-ish (random on each module init) ──────────────

const SELECTED: OppType = OPPORTUNITIES[Math.floor(Math.random() * OPPORTUNITIES.length)];

const SAMPLE_QUALITY = SELECTED.quality;
const SCORE_BAR_COLORS = [
  "bg-[var(--score-high)]",
  "bg-[var(--score-mid)]",
  "bg-[var(--score-good)]",
  "bg-[var(--score-high)]",
];

const BAR_DATA = SELECTED.scoreBarData;

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
              {SELECTED.subtitle}
            </p>
            <h3 className="mt-1.5 text-lg font-medium tracking-tight text-[var(--text-primary)]">
              {SELECTED.name}
            </h3>
            <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
              {SELECTED.url}
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center rounded-full border border-[var(--badge-amber-border)] bg-[var(--badge-amber-bg)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--badge-amber-text)]">
            {SELECTED.badgeLabel}
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
                stroke={SELECTED.scoreColor}
                className="animate-[ringDraw_1.2s_cubic-bezier(0.22,1,0.36,1)_0.1s_forwards]"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 40}
                strokeDashoffset={ringOffset(SAMPLE_QUALITY)}
                style={{ strokeDashoffset: 2 * Math.PI * 40 /* start fully hidden */ }}
              />
            </svg>
            <span className="absolute text-xl font-bold text-[var(--text-primary)]">
              {SAMPLE_QUALITY > 0 ? SAMPLE_QUALITY : "—"}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
              Opportunity Score
            </p>
            <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
              {SELECTED.description}
            </p>
          </div>
        </div>

        {/* Metric bars — CSS-animated via @keyframes with staggered delays */}
        {BAR_DATA.length > 0 && (
          <div className="space-y-3">
            {BAR_DATA.map((item, i) => (
              <div key={item.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[var(--text-secondary)]">{item.label}</span>
                  <span className="text-[var(--text-tertiary)]">{item.value || "—"}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-[var(--bg-surface-2)]">
                  <div
                    className={`h-full rounded-full ${SCORE_BAR_COLORS[i]}`}
                    style={{
                      width: `${Math.max(item.value, 5)}%`,
                      transform: "scaleX(0)",
                      animation: `barGrow 0.6s cubic-bezier(0.22, 1, 0.36, 1) ${0.3 + i * 0.12}s forwards`,
                      transformOrigin: "left",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

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
            {SELECTED.pitchText}
          </p>
        </div>
      </div>

      {/* Bottom accent line */}
      <div className="h-px bg-gradient-to-r from-transparent via-[var(--accent)]/40 to-transparent" />

      {/* ── CSS @keyframes ── */}
      <style>{`
        @keyframes ringDraw {
          to {
            stroke-dashoffset: ${ringOffset(SAMPLE_QUALITY)};
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
