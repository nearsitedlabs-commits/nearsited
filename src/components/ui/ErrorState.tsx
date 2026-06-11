"use client";

import { cn } from "@/lib/cn";

type ErrorStateProps = {
  description?: string;
  onRetry?: () => void;
  className?: string;
};

export function ErrorState({ description, onRetry, className }: ErrorStateProps) {
  return (
    <div className={cn("flex min-h-[240px] flex-col items-center justify-center py-16 text-center", className)}>
      <p className="text-sm font-medium text-[var(--color-text-primary)]">
        Something didn&apos;t load right.
      </p>
      {description && (
        <p className="mx-auto mt-1 max-w-sm text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
          {description}
        </p>
      )}
      <div className="mt-4 flex flex-col items-center gap-2">
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] px-3 py-2 text-xs font-medium text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-accent)]/40 hover:text-[var(--color-accent)]"
          >
            Try again
          </button>
        )}
        <a
          href="mailto:nearsitedlabs@gmail.com"
          className="text-[11px] text-[var(--color-text-tertiary)] hover:underline"
        >
          nearsitedlabs@gmail.com
        </a>
      </div>
    </div>
  );
}
ErrorState.displayName = "ErrorState";
