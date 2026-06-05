"use client";

import { useCountUp } from "@/lib/shared-hooks";
import { motion } from "framer-motion";

type ScoreRingProps = {
  score: number | null | undefined;
  size?: number;
  /** "verified"    = solid ring, quality-score thresholds (≤55 red, ≤74 amber, 75+ green). Lead Detail / Audit / Share.
   *  "opportunity" = solid ring, opportunity-score thresholds (<40 red, <70 amber, 70+ green). Discover / Leads list.
   *  "estimate"    = dashed track + 0.65 opacity arc + ~ prefix, opportunity thresholds. Pre-audit discovery. */
  variant?: "verified" | "opportunity" | "estimate";
  /** Skip the count-up animation. Use when a parent already handles animation (e.g. AnimatedScoreRing). */
  noAnimate?: boolean;
  /** Show a tooltip explaining what the score means. */
  showTooltip?: boolean;
};

const R = 18;
const DIM = 44;
const CIRCUMFERENCE = 2 * Math.PI * R;

// ── Tier helpers ──────────────────────────────────────────────────────────────

function verifiedTier(score: number) {
  return score <= 55 ? "var(--score-high)" : score <= 74 ? "var(--score-mid)" : "var(--score-good)";
}

function opportunityTier(score: number) {
  return score < 40 ? "var(--score-high)" : score < 70 ? "var(--score-mid)" : "var(--score-good)";
}

// ── Score tooltip ─────────────────────────────────────────────────────────────

function ScoreTooltip({ score, variant }: { score: number; variant: "verified" | "opportunity" | "estimate" }) {
  const isOpp = variant === "opportunity" || variant === "estimate";
  const label = isOpp
    ? score < 40 ? "Low opportunity" : score < 70 ? "Medium opportunity" : "High opportunity"
    : score <= 55 ? "Poor performance" : score <= 74 ? "Needs improvement" : "Good performance";
  const detail = isOpp
    ? "Score ≥ 70 = high opportunity lead"
    : score <= 55 ? "Score ≤ 55 indicates significant issues" : score <= 74 ? "Score 55-74 indicates room for improvement" : "Score ≥ 75 indicates solid performance";
  return (
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-[var(--bg-elevated)] text-[var(--text-primary)] text-xs rounded-xl px-3 py-2 w-56 shadow-xl z-50 leading-relaxed pointer-events-none border border-[var(--border)]">
      <p className="font-medium">{label}</p>
      <p className="mt-1 text-[var(--text-tertiary)]">{detail}</p>
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[var(--bg-elevated)]" />
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ScoreRing({
  score,
  size = 44,
  variant = "verified",
  noAnimate = false,
  showTooltip = false,
}: ScoreRingProps) {
  const clamped = score != null ? Math.max(0, Math.min(100, score)) : 0;
  const { display, done } = useCountUp(noAnimate ? clamped : clamped);
  const displayValue = noAnimate ? clamped : display;
  const isDone = noAnimate ? true : done;

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

  const isEstimate = variant === "estimate";

  // Tier color
  const tierColor = isEstimate
    ? opportunityTier(clamped)
    : variant === "opportunity"
      ? opportunityTier(clamped)
      : verifiedTier(clamped);

  // ── Estimate variant ───────────────────────────────────────────────────
  if (isEstimate) {
    const arcLen = (clamped / 100) * CIRCUMFERENCE;
    const ring = (
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${DIM} ${DIM}`}
        className="flex-shrink-0"
      >
        <defs>
          <filter id="glow-estimate">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <circle
          cx="22" cy="22" r={R}
          fill="none"
          stroke="var(--border-strong)"
          strokeWidth="2"
          strokeDasharray="3 3"
        />
        <circle
          cx="22" cy="22" r={R}
          fill="none"
          stroke={tierColor}
          strokeWidth="2.5"
          strokeDasharray={`${arcLen} ${CIRCUMFERENCE - arcLen}`}
          strokeLinecap="round"
          opacity="0.65"
          transform="rotate(-90 22 22)"
        />
        <text
          x="22" y="26" textAnchor="middle"
          fontSize="11" fontWeight="500"
          fill="var(--text-secondary)"
          fontFamily="var(--font-sans, Geist)"
        >
          ~{displayValue}
        </text>
      </svg>
    );
    if (!showTooltip) return ring;
    return (
      <div className="relative inline-flex group">
        {ring}
        <ScoreTooltip score={clamped} variant={variant} />
      </div>
    );
  }

  // ── Solid variants (verified / opportunity) with animation ────────────
  const isOpp = variant === "opportunity";
  const offset = CIRCUMFERENCE - (clamped / 100) * CIRCUMFERENCE;

  const ring = (
    <motion.svg
      width={size}
      height={size}
      viewBox={`0 0 ${DIM} ${DIM}`}
      className="flex-shrink-0"
      animate={isDone ? { filter: ["brightness(1)", "brightness(1.25)", "brightness(1)"] } : {}}
      transition={{ duration: 0.8, ease: "easeOut", times: [0, 0.3, 1] }}
    >
      <defs>
        <filter id={`glow-${isOpp ? "opp" : "ver"}`}>
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* Ghost track */}
      <circle
        cx="22" cy="22" r={R}
        fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="3.5"
      />
      {/* Animated arc */}
      <motion.circle
        cx="22" cy="22" r={R}
        fill="none"
        stroke={tierColor}
        strokeWidth="3.5"
        strokeLinecap="round"
        transform="rotate(-90 22 22)"
        initial={{ strokeDasharray: CIRCUMFERENCE, strokeDashoffset: CIRCUMFERENCE }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
      />
      {/* Count-up number with completion glow */}
      <motion.text
        x="22" y="26" textAnchor="middle"
        fontSize="11" fontWeight="500"
        fill="var(--text-primary)"
        fontFamily="var(--font-sans, Geist)"
        animate={isDone ? { filter: `url(#glow-${isOpp ? "opp" : "ver"})` } : {}}
        transition={{ duration: 0.4 }}
      >
        {displayValue}
      </motion.text>
    </motion.svg>
  );

  if (!showTooltip) return ring;
  return (
    <div className="relative inline-flex group">
      {ring}
      <ScoreTooltip score={clamped} variant={variant} />
    </div>
  );
}
