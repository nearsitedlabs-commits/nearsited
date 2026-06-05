"use client";

import { useEffect, useState } from "react";
import { useReducedMotion, animate as motionAnimate } from "framer-motion";
import { ScoreRing } from "@/components/ui/ScoreRing";

type AnimScoreProps = {
  score: number | null | undefined;
  size?: number;
  variant?: "verified" | "opportunity" | "estimate";
};

export function AnimatedScoreRing({
  score,
  variant = "opportunity",
  size = 44,
}: AnimScoreProps) {
  const [display, setDisplay] = useState(0);
  const shouldReduce = useReducedMotion();

  useEffect(() => {
    if (score == null) return;
    const controls = motionAnimate(0, score, {
      duration: shouldReduce ? 0 : 0.8,
      ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
      onUpdate: (v: number) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [score, shouldReduce]);

  return (
    <ScoreRing
      score={score == null ? null : display}
      variant={variant}
      size={size}
      noAnimate
    />
  );
}
