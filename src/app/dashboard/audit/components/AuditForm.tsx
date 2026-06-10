"use client";

import { CheckCircle2, Globe, Loader2, MapPin, RotateCcw, Search, X } from "lucide-react";
import type { AuditStep } from "./types";

// ── Constants ───────────────────────────────────────────────────────────────────

const EXAMPLE_URLS = ["lawfirmdubai.com", "dentalcaretoronto.ca", "accountingbrisbane.com.au"];

// ── Helpers ─────────────────────────────────────────────────────────────────────

function timeAgo(ts?: number | null): string {
  if (!ts) return "";
  const mins = Math.floor((Date.now() - ts) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  return `${Math.floor(hours / 24)} days ago`;
}

// ── Component ───────────────────────────────────────────────────────────────────

type AuditFormProps = {
  /** The current URL input value */
  url: string;
  /** Callback when the URL input changes */
  onUrlChange: (url: string) => void;
  /** Whether an audit is currently running */
  running: boolean;
  /** Callback to run the audit */
  onRun: () => void;
  /** Google Maps lookup URL input value */
  mapsLookupUrl: string;
  /** Callback when the Maps lookup URL changes */
  onMapsLookupUrlChange: (url: string) => void;
  /** Whether a Maps lookup is loading */
  mapsLookupLoading: boolean;
  /** Hint text from Maps lookup result */
  mapsLookupHint: string | null;
  /** Callback to perform the Maps lookup */
  onMapsLookup: () => void;
  /** The current audit step */
  step: AuditStep;
  /** Cancel handler for in-progress audits (only shown when running) */
  onCancel?: () => void;
  /** Reset/new-search handler (only shown when done) */
  onReset?: () => void;
  /** Timestamp of when the audit completed (for the status pill) */
  savedTimestamp?: number | null;
  /** Google Maps business name (for the status pill) */
  mapsBusinessName?: string | null;
};

export function AuditForm({
  url,
  onUrlChange,
  running,
  onRun,
  mapsLookupUrl,
  onMapsLookupUrlChange,
  mapsLookupLoading,
  mapsLookupHint,
  onMapsLookup,
  step,
  onCancel,
  onReset,
  savedTimestamp,
  mapsBusinessName,
}: AuditFormProps) {
  const isIdle = step === "idle";
  const isDone = step === "done";

  // ── Complete state — status pill ─────────────────────────────────────────────
  if (isDone) {
    const truncatedUrl = url.length > 50 ? url.slice(0, 47) + "…" : url;
    const googleMapsStatus = mapsBusinessName
      ? `Linked to ${mapsBusinessName}`
      : "No Google Maps link added";

    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface-1)] p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Left: icon + URL */}
          <div className="flex min-w-0 items-center gap-3">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-[var(--score-good)]" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-[var(--text-primary)]" title={url}>
                {truncatedUrl}
              </p>
              <p className="text-xs text-[var(--text-tertiary)]">
                Reviewed {timeAgo(savedTimestamp)} · {googleMapsStatus}
              </p>
            </div>
          </div>

          {/* Right: action buttons */}
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => onRun()}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors duration-150 hover:border-[var(--accent)]/40 hover:text-[var(--accent)]"
            >
              <RotateCcw className="h-3 w-3" />
              Re-run
            </button>
            {onReset && (
              <button
                onClick={onReset}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors duration-150 hover:border-[var(--accent)]/40 hover:text-[var(--accent)]"
              >
                <X className="h-3 w-3" />
                New Search
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface-1)] p-4 sm:p-6">
      {/* Header — shown in active state */}
      {!isIdle && (
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] font-medium text-[var(--text-tertiary)]">
              Opportunity Review
            </p>
            <h1 className="mt-1 text-2xl font-medium text-[var(--text-primary)]">
              Reviewing Opportunity
            </h1>
          </div>
        </div>
      )}

      {/* URL input row */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Globe className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input
            type="url"
            value={url}
            onChange={(e) => onUrlChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !running && url.trim() && onRun()}
            placeholder="Paste a business website URL"
            autoFocus={isIdle}
            className={`w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface-2)] pl-10 pr-4 text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] transition-colors duration-150 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 ${
              isIdle ? "py-3 text-base" : "py-2.5 text-sm"
            }`}
          />
        </div>
        <button
          onClick={() => onRun()}
          disabled={running || !url.trim()}
          className={`inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-5 text-sm font-medium text-white transition-colors duration-150 hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50 ${
            isIdle ? "py-3" : "py-2.5 sm:w-auto"
          }`}
        >
          {running ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          {running
            ? "Reviewing…"
            : isIdle
              ? "Analyse Website"
              : "Review Again"}
        </button>
      </div>

      {/* Google Maps lookup — only in idle / running states */}
      <div className="mt-4 border-t border-[var(--border)] pt-4">
        <div className="mb-1.5 flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
          <span className="text-xs text-[var(--text-secondary)]">
            Google Maps link{" "}
            <span className="text-[var(--text-muted)]">
              — optional, improves opportunity score
            </span>
          </span>
        </div>
        <div className="flex gap-2">
          <input
            type="url"
            value={mapsLookupUrl}
            onChange={(e) => onMapsLookupUrlChange(e.target.value)}
            placeholder="Paste Google Maps link…"
            className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-2)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/20"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void onMapsLookup();
              }
            }}
          />
          <button
            type="button"
            onClick={() => void onMapsLookup()}
            disabled={!mapsLookupUrl.trim() || mapsLookupLoading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-2)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {mapsLookupLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Search className="h-3.5 w-3.5" />
            )}
            Look up
          </button>
        </div>
        {mapsLookupHint && (
          <p
            className={`mt-1 text-xs ${
              mapsLookupHint.startsWith("Found")
                ? "text-[var(--score-good)]"
                : "text-[var(--text-tertiary)]"
            }`}
          >
            {mapsLookupHint}
          </p>
        )}
      </div>

      {/* Example URL chips — only in idle state */}
      {isIdle && (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[var(--border)] pt-4">
          <span className="text-xs font-medium text-[var(--text-secondary)]">Try:</span>
          {EXAMPLE_URLS.map((ex) => (
            <button
              key={ex}
              onClick={() => onUrlChange(ex)}
              className="cursor-pointer rounded-full border border-[var(--border)] bg-[var(--bg-surface-2)] px-3 py-1 text-xs text-[var(--text-tertiary)] transition-colors duration-150 hover:border-[var(--accent)]/40 hover:text-[var(--accent)]"
            >
              {ex}
            </button>
          ))}
        </div>
      )}

      {/* Cancel button — shown when running */}
      {running && onCancel && (
        <div className="mt-3 flex justify-end">
          <button
            onClick={onCancel}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors duration-150 hover:border-red-500/40 hover:text-red-400"
          >
            <X className="h-3.5 w-3.5" /> Cancel
          </button>
        </div>
      )}
    </div>
  );
}
