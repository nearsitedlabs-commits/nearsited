"use client";

import { CheckCircle2, Globe, Loader2, MapPin, RotateCcw, Search, X } from "lucide-react";
import type { AuditStep } from "./types";

const EXAMPLE_URLS = ["lawfirmdubai.com", "dentalcaretoronto.ca", "accountingbrisbane.com.au"];

function timeAgo(ts?: number | null): string {
  if (!ts) return "";
  const mins = Math.floor((Date.now() - ts) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  return `${Math.floor(hours / 24)} days ago`;
}

type AuditFormProps = {
  url: string;
  onUrlChange: (url: string) => void;
  running: boolean;
  onRun: () => void;
  mapsLookupUrl: string;
  onMapsLookupUrlChange: (url: string) => void;
  mapsLookupLoading: boolean;
  mapsLookupHint: string | null;
  onMapsLookup: () => void;
  step: AuditStep;
  onCancel?: () => void;
  onReset?: () => void;
  savedTimestamp?: number | null;
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
      <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-[var(--color-success)]" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-[var(--color-text-primary)]" title={url}>
                {truncatedUrl}
              </p>
              <p className="text-xs text-[var(--color-text-tertiary)]">
                Reviewed {timeAgo(savedTimestamp)} · {googleMapsStatus}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => onRun()}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] transition-colors duration-150 hover:border-[var(--color-accent)]/40 hover:text-[var(--color-accent)]"
            >
              <RotateCcw className="h-3 w-3" />
              Re-run
            </button>
            {onReset && (
              <button
                onClick={onReset}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] transition-colors duration-150 hover:border-[var(--color-accent)]/40 hover:text-[var(--color-accent)]"
              >
                <X className="h-3 w-3" />
                New search
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Running state — collapsed one-liner ──────────────────────────────────────
  if (running) {
    const truncatedUrl = url.length > 60 ? url.slice(0, 57) + "…" : url;
    return (
      <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] px-4 py-3">
        <div className="flex items-center gap-3">
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[var(--color-accent)]" />
          <p className="min-w-0 flex-1 truncate text-sm text-[var(--color-text-secondary)]">
            Analysing{" "}
            <span className="font-medium text-[var(--color-text-primary)]">{truncatedUrl}</span>
          </p>
        </div>
      </div>
    );
  }

  // ── Idle state — full input form ─────────────────────────────────────────────
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-4 sm:p-6">
      {/* URL input */}
      <div className="relative">
        <Globe className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
        <input
          type="url"
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !running && url.trim() && onRun()}
          placeholder="Paste a business website URL"
          autoFocus
          className="w-full rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] py-3 pl-10 pr-4 text-base text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-tertiary)] transition-colors duration-150 focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20"
        />
      </div>

      <div className="mt-3">
        <button
          onClick={() => onRun()}
          disabled={running || !url.trim()}
          className="inline-flex cursor-pointer items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-accent)] px-5 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Search className="h-4 w-4" />
          Analyse
        </button>
      </div>

      {/* Google Maps lookup */}
      <div className="mt-5 border-t border-[var(--color-border-subtle)] pt-4">
        <div className="mb-1.5 flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-[var(--color-text-tertiary)]" />
          <span className="text-xs text-[var(--color-text-secondary)]">
            Google Maps link{" "}
            <span className="text-[var(--color-text-tertiary)]">
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
            className="flex-1 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-tertiary)] focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]/20"
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
            className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-3 py-2 text-xs font-medium text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)] disabled:cursor-not-allowed disabled:opacity-50"
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
                ? "text-[var(--color-success)]"
                : "text-[var(--color-text-tertiary)]"
            }`}
          >
            {mapsLookupHint}
          </p>
        )}
      </div>

      {/* Example URL chips */}
      {isIdle && (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[var(--color-border-subtle)] pt-4">
          <span className="text-xs font-medium text-[var(--color-text-secondary)]">Try:</span>
          {EXAMPLE_URLS.map((ex) => (
            <button
              key={ex}
              onClick={() => onUrlChange(ex)}
              className="cursor-pointer rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-3 py-1 text-xs text-[var(--color-text-tertiary)] transition-colors duration-150 hover:border-[var(--color-accent)]/40 hover:text-[var(--color-accent)]"
            >
              {ex}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}