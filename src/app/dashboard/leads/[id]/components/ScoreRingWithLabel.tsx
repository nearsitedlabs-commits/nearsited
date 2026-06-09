"use client";

import { useEffect, useState } from "react";
import { animate as motionAnimate, useReducedMotion } from "@/lib/motion";
import { scoreLabel } from "@/lib/scoring";

export function ScoreRingWithLabel({ score, size = 56, label }: { score: number; size?: number; label?: string }) {
  const [display, setDisplay] = useState(0);
  const shouldReduce = useReducedMotion();

  useEffect(() => {
    const controls = motionAnimate(0, score, {
      duration: shouldReduce ? 0 : 0.7,
      ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
      onUpdate: (v: number) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [score, shouldReduce]);

  const stroke = size >= 70 ? 5 : size <= 42 ? 3 : 4;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (Math.min(100, Math.max(0, display)) / 100) * circumference;
  const color = score < 40 ? "var(--score-high)" : score < 70 ? "var(--score-mid)" : "var(--score-good)";
  const lbl = label ?? scoreLabel(score);
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)"
            strokeWidth={stroke} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={offset} />
        </svg>
        <span className={`absolute font-bold ${size >= 70 ? "text-xl" : "text-sm"} text-[var(--text-primary)]`}>
          {display}
        </span>
      </div>
      <span className="text-center text-xs font-medium text-[var(--text-secondary)]">{lbl}</span>
    </div>
  );
}
