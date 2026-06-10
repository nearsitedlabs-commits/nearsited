"use client";

import { useEffect, useState } from "react";

interface TimeInStageProps {
  enteredAt: string | null;
  status: string;
}

/**
 * Time-in-stage indicator.
 * Computes days since `stage_entered_at` and renders "{N}d in stage".
 * Color treatment based on staleness relative to the pipeline status.
 */
export function TimeInStage({ enteredAt, status }: TimeInStageProps) {
  const [days, setDays] = useState<number | null>(null);

  useEffect(() => {
    if (!enteredAt) return;

    const tick = () => {
      const entered = new Date(enteredAt).getTime();
      const diffMs = Date.now() - entered;
      const d = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      setDays(d < 0 ? null : d);
    };

    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [enteredAt]);

  if (days == null) return null;

  const colorClass = (() => {
    if (days <= 3) return "text-gray-400 dark:text-gray-500";
    if (days <= 7) return "text-gray-600 dark:text-gray-400";
    if (days >= 11 && status === "in_conversation") return "text-amber-600 dark:text-amber-400";
    if (days >= 8 && status === "contacted") return "text-amber-600 dark:text-amber-400";
    return "text-gray-500 dark:text-gray-400";
  })();

  return (
    <span className={`text-[10px] whitespace-nowrap ${colorClass}`}>
      {days}d in stage
    </span>
  );
}
