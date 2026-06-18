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
    name: "Brighton Dental",
    subtitle: "Dental Clinic · Brighton, UK",
    url: "brightondental.co.uk",
    category: "Healthcare",
    quality: 76,
    reviews: 30,
    rating: 4.2,
    scoreBarData: [
      { label: "Performance", value: 42 },
      { label: "Mobile",      value: 39 },
      { label: "SEO",         value: 48 },
      { label: "Trust",       value: 38 },
    ],
    badgeLabel: "Weak Website",
    description: "Established clinic losing patients to slow load times.",
    pitchText: (
      <>
        I ran parkviewdental.com through an audit and found{" "}
        <span className="font-medium text-[var(--color-text-primary)]">
          the site takes 4.2s to load
        </span>{" "}
        on mobile — half your visitors are leaving before the page finishes.
      </>
    ),
    scoreColor: "var(--score-good)",
  },
  // 2. Social Only
  {
    name: "The Hideaway Cafe",
    subtitle: "Cafe · Byron Bay, NSW",
    url: "instagram.com/hideawaycafe",
    category: "Restaurant",
    quality: 79,
    reviews: 85,
    rating: 4.5,
    scoreBarData: [
      { label: "Instagram",   value: 78 },
      { label: "Engagement",  value: 65 },
      { label: "Reviews",     value: 85 },
      { label: "Google Maps", value: 0 },
    ],
    badgeLabel: "Social Only",
    description: "Popular cafe with no website — all bookings via DM.",
    pitchText: (
      <>
        Your Instagram is great, but you&rsquo;re renting your audience.
        A website means{" "}
        <span className="font-medium text-[var(--color-text-primary)]">
          online reservations and Google visibility
        </span>{" "}
        you actually own.
      </>
    ),
    scoreColor: "var(--score-good)",
  },
  // 3. No Website
  {
    name: "Harbor Legal Group",
    subtitle: "Legal Services · Downtown, Austin, TX",
    url: "No website — Google Business only",
    category: "Legal",
    quality: 88,
    reviews: 42,
    rating: 4.7,
    scoreBarData: [
      { label: "Google Rating", value: 94 },
      { label: "Reviews",       value: 42 },
      { label: "Visibility",    value: 15 },
      { label: "Website",       value: 0 },
    ],
    badgeLabel: "No Website",
    description: "Strong reputation, zero online search presence.",
    pitchText: (
      <>
        Great reviews, but{" "}
        <span className="font-medium text-[var(--color-text-primary)]">
          invisible on Google
        </span>{" "}
        beyond Maps. Every day without a website is potential clients finding competitors.
      </>
    ),
    scoreColor: "var(--score-good)",
  },
];

// ── Pick one deterministically-ish (random on each module init) ──────────────

const SELECTED: OppType = OPPORTUNITIES[Math.floor(Math.random() * OPPORTUNITIES.length)];

const SAMPLE_QUALITY = SELECTED.quality;
function barColor(value: number): string {
  if (value >= 70) return "bg-[var(--score-good)]";
  if (value >= 40) return "bg-[var(--score-mid)]";
  return "bg-[var(--score-high)]";
}

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
    <div className="w-full max-w-sm overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] shadow-[var(--brand-shadow-lg)]">
      {/* Top accent line */}
      <div className="h-px bg-gradient-to-r from-transparent via-[var(--accent)]/40 to-transparent" />

      {/* Content */}
      <div className="space-y-5 p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--color-text-tertiary)]">
              {SELECTED.subtitle}
            </p>
            <h3 className="mt-1.5 text-lg font-medium tracking-tight text-[var(--color-text-primary)]">
              {SELECTED.name}
            </h3>
            <p className="mt-0.5 text-sm text-[var(--color-text-secondary)]">
              {SELECTED.url}
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center rounded-[var(--radius-sm)] border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-warning)]">
            {SELECTED.badgeLabel}
          </span>
        </div>

        {/* Score ring + summary — static on first paint, animated via CSS */}
        <div className="flex items-center gap-5 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] p-4">
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
            <span className="absolute text-xl font-bold text-[var(--color-text-primary)]">
              {SAMPLE_QUALITY > 0 ? SAMPLE_QUALITY : "—"}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--color-text-tertiary)]">
              Opportunity Score
            </p>
            <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-secondary)]">
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
                  <span className="text-[var(--color-text-secondary)]">{item.label}</span>
                  <span className="text-[var(--color-text-tertiary)]">{item.value || "—"}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-[var(--radius-sm)] bg-[var(--color-bg-elevated)]">
                  <div
                    className={`h-full rounded-full ${barColor(item.value)}`}
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
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] p-4">
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[var(--color-accent)]">
              <span className="block h-px w-5 bg-[var(--color-accent)]" />
              AI Pitch
            </span>
            <span className="text-[10px] text-[var(--text-muted)]">generated in 1.4s</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">
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