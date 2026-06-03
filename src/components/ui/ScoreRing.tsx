"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

type ScoreRingProps = {
  score: number | null | undefined;
  size?: number;
  /** "verified"    = solid ring, quality-score thresholds (≤55 red, ≤74 amber, 75+ green). Lead Detail / Audit / Share.
   *  "opportunity" = solid ring, opportunity-score thresholds (<40 red, <70 amber, 70+ green). Discover / Leads list.
   *  "estimate"    = dashed track + 0.65 opacity arc + ~ prefix, opportunity thresholds. Pre-audit discovery. */
  variant?: "verified" | "opportunity" | "estimate";
};

const R = 18;
const DIM = 44;
const CIRCUMFERENCE = 2 * Math.PI * R;

// ── Count-up hook with completion signal ──────────────────────────────────────

function useCountUp(value: number, duration = 600) {
  const [display, setDisplay] = useState(0);
  const [done, setDone] = useState(false);
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) { setDisplay(value); setDone(true); return; }
    hasRun.current = true;
    setDone(false);
    const start = performance.now();
    const from = 0;
    const diff = value - from;
    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + diff * eased));
      if (progress >= 1) setDone(true);
      else requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [value, duration]);

  return { display, done };
}

// ── Tier helpers ──────────────────────────────────────────────────────────────

function verifiedTier(score: number) {
  return score <= 55 ? "var(--score-high)" : score <= 74 ? "var(--score-mid)" : "var(--score-good)";
}

function opportunityTier(score: number) {
  return score < 40 ? "var(--score-high)" : score < 70 ? "var(--score-mid)" : "var(--score-good)";
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ScoreRing({
  score,
  size = 44,
  variant = "verified",
}: ScoreRingProps) {
  const clamped = score != null ? Math.max(0, Math.min(100, score)) : 0;
  const { display, done } = useCountUp(clamped);

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
    return (
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
          ~{display}
        </text>
      </svg>
    );
  }

  // ── Solid variants (verified / opportunity) with animation ────────────
  const isOpp = variant === "opportunity";
  const offset = CIRCUMFERENCE - (clamped / 100) * CIRCUMFERENCE;

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox={`0 0 ${DIM} ${DIM}`}
      className="flex-shrink-0"
      animate={done ? { filter: ["brightness(1)", "brightness(1.25)", "brightness(1)"] } : {}}
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
        animate={done ? { filter: `url(#glow-${isOpp ? "opp" : "ver"})` } : {}}
        transition={{ duration: 0.4 }}
      >
        {display}
      </motion.text>
    </motion.svg>
  );
}
