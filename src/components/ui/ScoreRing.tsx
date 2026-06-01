"use client";

type ScoreRingProps = {
  score: number | null | undefined;
  size?: number;
};

export function ScoreRing({ score, size = 44 }: ScoreRingProps) {
  const r = 18;
  const circumference = 2 * Math.PI * r;
  const dim = 44;

  // Empty state — ghost ring with em-dash
  if (score == null) {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${dim} ${dim}`} className="flex-shrink-0">
        <circle cx="22" cy="22" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="3.5" />
        <text x="22" y="26" textAnchor="middle" fontSize="11" fontWeight="500"
          fill="var(--text-tertiary)" fontFamily="var(--font-sans, Geist)">
          —
        </text>
      </svg>
    );
  }

  const clamped = Math.max(0, Math.min(100, score));
  const offset = circumference - (clamped / 100) * circumference;
  const color = clamped <= 55 ? "var(--score-high)" : clamped <= 74 ? "var(--score-mid)" : "var(--score-good)";

  return (
    <svg width={size} height={size} viewBox={`0 0 ${dim} ${dim}`} className="flex-shrink-0">
      <circle cx="22" cy="22" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="3.5" />
      <circle cx="22" cy="22" r={r} fill="none" stroke={color} strokeWidth="3.5"
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round" transform="rotate(-90 22 22)" />
      <text x="22" y="26" textAnchor="middle" fontSize="11" fontWeight="500"
        fill="var(--text-primary)" fontFamily="var(--font-sans, Geist)">
        {clamped}
      </text>
    </svg>
  );
}
