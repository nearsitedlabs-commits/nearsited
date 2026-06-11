"use client";

import { cn } from "@/lib/cn";

type LoadingStateProps = {
  rows?: number;
  className?: string;
};

export function LoadingState({ rows = 4, className }: LoadingStateProps) {
  return (
    <div className={cn("animate-pulse", className)} aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 border-b border-[var(--color-border-subtle)] px-4"
          style={{ height: 46 }}
        >
          <div className="h-7 w-7 shrink-0 rounded-full bg-[var(--color-bg-elevated)]" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-2/3 rounded-[var(--radius-sm)] bg-[var(--color-bg-elevated)]" />
            <div className="h-2.5 w-1/3 rounded-[var(--radius-sm)] bg-[var(--color-bg-elevated)]" />
          </div>
          <div className="h-5 w-16 shrink-0 rounded-[var(--radius-sm)] bg-[var(--color-bg-elevated)]" />
        </div>
      ))}
    </div>
  );
}
LoadingState.displayName = "LoadingState";
