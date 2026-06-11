"use client";

type Props = {
  error: string | null;
  running: boolean;
  hasWebsite: boolean;
  onRetry: () => void;
};

export function DesignErrorBanner({ error, running, hasWebsite, onRetry }: Props) {
  if (!error || running) return null;
  return (
    <div className="mb-6 rounded-[var(--radius-md)] border border-red-500/30 bg-red-500/10 p-4">
      <p className="text-sm font-medium text-[var(--color-danger)]">Design analysis failed</p>
      <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">{error}</p>
      {hasWebsite && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 cursor-pointer text-xs font-medium text-[var(--color-accent)] underline-offset-2 hover:text-[var(--accent-hover)] underline transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  );
}
