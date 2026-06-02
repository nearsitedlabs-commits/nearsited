"use client";

type ScoreRingProps = {
  score: number | null | undefined;
  size?: number;
  /** "verified" = solid ring with full opacity colors (existing behavior).
   *  "estimate" = thinner dashed track + colored progress arc at 0.65 opacity + ~ prefix. */
  variant?: "verified" | "estimate";
};

const R = 18;
const DIM = 44;
const CIRCUMFERENCE = 2 * Math.PI * R;

/**
 * Score ring — a circular progress indicator for opportunity/quality scores.
 *
 * - **verified** (default): 3.5 px solid track, 3.5 px solid arc, full-opacity
 *   tier colour, numeric label. Used for audited businesses.
 * - **estimate**: 2 px dashed track, 2 px solid arc at 65 % opacity,
 *   "~"‑prefixed label, thinner profile. Used for pre‑audit estimates.
 */
export function ScoreRing({
  score,
  size = 44,
  variant = "verified",
}: ScoreRingProps) {
  // ── Empty state ────────────────────────────────────────────────────────
  if (score == null) {
    return (
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${DIM} ${DIM}`}
        className="flex-shrink-0"
      >
        <circle
          cx="22" cy="22" r={R}
          fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="3.5"
        />
        <text
          x="22" y="26" textAnchor="middle"
          fontSize="11" fontWeight="500"
          fill="var(--text-tertiary)"
          fontFamily="var(--font-sans, Geist)"
        >
          —
        </text>
      </svg>
    );
  }

  const clamped = Math.max(0, Math.min(100, score));
  const isEstimate = variant === "estimate";

  // ── Estimate variant ───────────────────────────────────────────────────
  if (isEstimate) {
    // Tier colour at 0.65 opacity — uses existing theme semantic colors
    const tierColor =
      clamped < 40
        ? "var(--status-error-text)"
        : clamped < 70
          ? "var(--status-warning-text)"
          : "var(--status-success-text)";

    const arcLen = (clamped / 100) * CIRCUMFERENCE;

    return (
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${DIM} ${DIM}`}
        className="flex-shrink-0"
      >
        {/* Dashed track — 2 px */}
        <circle
          cx="22" cy="22" r={R}
          fill="none"
          stroke="var(--border-strong)"
          strokeWidth="2"
          strokeDasharray="3 3"
          opacity="1"
        />
        {/* Solid progress arc — 2.5 px for legibility, tier colour at 0.65 */}
        <circle
          cx="22" cy="22" r={R}
          fill="none"
          stroke={tierColor}
          strokeWidth="2.5"
          strokeDasharray={`${arcLen} ${CIRCUMFERENCE - arcLen}`}
          strokeDashoffset={0}
          strokeLinecap="round"
          opacity="0.65"
          transform="rotate(-90 22 22)"
        />
        {/* ~ prefix + number */}
        <text
          x="22" y="26" textAnchor="middle"
          fontSize="11" fontWeight="500"
          fill="var(--text-secondary)"
          fontFamily="var(--font-sans, Geist)"
        >
          ~{clamped}
        </text>
      </svg>
    );
  }

  // ── Verified variant (existing behaviour) ─────────────────────────────
  const offset = CIRCUMFERENCE - (clamped / 100) * CIRCUMFERENCE;
  const verifiedColor =
    clamped <= 55
      ? "var(--score-high)"
      : clamped <= 74
        ? "var(--score-mid)"
        : "var(--score-good)";

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${DIM} ${DIM}`}
      className="flex-shrink-0"
    >
      {/* Ghost track — 3.5 px */}
      <circle
        cx="22" cy="22" r={R}
        fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="3.5"
      />
      {/* Solid progress arc — 3.5 px, full tier colour */}
      <circle
        cx="22" cy="22" r={R}
        fill="none"
        stroke={verifiedColor}
        strokeWidth="3.5"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 22 22)"
      />
      {/* Plain number */}
      <text
        x="22" y="26" textAnchor="middle"
        fontSize="11" fontWeight="500"
        fill="var(--text-primary)"
        fontFamily="var(--font-sans, Geist)"
      >
        {clamped}
      </text>
    </svg>
  );
}
