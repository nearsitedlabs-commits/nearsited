"use client";

import { useId } from "react";
import { cn } from "@/lib/cn";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ScoreCircleSize = 24 | 32 | 48;

export type ScoreCircleProps = {
  score: number | null | undefined;
  /** Size in px — 24 (compact), 32 (default), 48 (prominent) */
  size?: ScoreCircleSize;
  /**
   * "computed"  — solid ring. Score was calculated from live data.
   * "estimated" — dotted ring. Score is a projection or pre-audit estimate.
   *               Never shows a tilde prefix; use dotted ring to signal uncertainty.
   */
  variant?: "computed" | "estimated";
  className?: string;
};

// ── Tier color (semantic tokens only) ────────────────────────────────────────

function tierColor(score: number): string {
  if (score < 40) return "var(--color-danger)";
  if (score < 70) return "var(--color-warning)";
  return "var(--color-accent)";
}

// ── Size config ───────────────────────────────────────────────────────────────

const SIZE_CONFIG: Record<ScoreCircleSize, { r: number; cx: number; cy: number; vb: number; sw: number; fs: number; fw: number }> = {
  24: { r: 9,  cx: 12, cy: 12, vb: 24, sw: 2,   fs: 7,  fw: 500 },
  32: { r: 12, cx: 16, cy: 16, vb: 32, sw: 2.5, fs: 9,  fw: 500 },
  48: { r: 18, cx: 24, cy: 24, vb: 48, sw: 3,   fs: 12, fw: 500 },
};

// ── Component ─────────────────────────────────────────────────────────────────

export function ScoreCircle({
  score,
  size = 32,
  variant = "computed",
  className,
}: ScoreCircleProps) {
  const uid = useId().replace(/:/g, "-");
  const cfg = SIZE_CONFIG[size];
  const circumference = 2 * Math.PI * cfg.r;
  const clamped = score != null ? Math.max(0, Math.min(100, score)) : 0;
  const color = score != null ? tierColor(clamped) : "rgba(255,255,255,0.12)";
  const isEstimated = variant === "estimated";

  // ── Empty / not-yet-calculated ────────────────────────────────────────
  if (score == null) {
    return (
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${cfg.vb} ${cfg.vb}`}
        className={cn("shrink-0", className)}
        role="img"
        aria-label="Score not calculated"
      >
        <circle
          cx={cfg.cx} cy={cfg.cy} r={cfg.r}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={cfg.sw}
          strokeDasharray={isEstimated ? "3 3" : undefined}
        />
        <text
          x={cfg.cx} y={cfg.cy + cfg.fs * 0.35}
          textAnchor="middle"
          fontSize={cfg.fs}
          fontWeight={cfg.fw}
          fill="var(--color-text-tertiary)"
          fontFamily="var(--font-sans, Geist)"
        >
          —
        </text>
      </svg>
    );
  }

  const arcLen = (clamped / 100) * circumference;
  const offset = circumference - arcLen;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${cfg.vb} ${cfg.vb}`}
      className={cn("shrink-0", className)}
      role="img"
      aria-label={`Score: ${clamped}`}
    >
      <defs>
        {!isEstimated && (
          <filter id={`sc-glow-${uid}`}>
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>

      {/* Ghost track */}
      <circle
        cx={cfg.cx} cy={cfg.cy} r={cfg.r}
        fill="none"
        stroke="rgba(255,255,255,0.07)"
        strokeWidth={cfg.sw}
        strokeDasharray={isEstimated ? "3 3" : undefined}
      />

      {/* Score arc */}
      <circle
        cx={cfg.cx} cy={cfg.cy} r={cfg.r}
        fill="none"
        stroke={color}
        strokeWidth={cfg.sw}
        strokeLinecap="round"
        strokeDasharray={`${arcLen} ${circumference - arcLen}`}
        strokeDashoffset={offset}
        opacity={isEstimated ? 0.65 : 1}
        transform={`rotate(-90 ${cfg.cx} ${cfg.cy})`}
        filter={!isEstimated ? `url(#sc-glow-${uid})` : undefined}
      />

      {/* Score text */}
      <text
        x={cfg.cx}
        y={cfg.cy + cfg.fs * 0.35}
        textAnchor="middle"
        fontSize={cfg.fs}
        fontWeight={cfg.fw}
        fill={score != null ? "var(--color-text-primary)" : "var(--color-text-tertiary)"}
        fontFamily="var(--font-sans, Geist)"
      >
        {clamped}
      </text>
    </svg>
  );
}
ScoreCircle.displayName = "ScoreCircle";
