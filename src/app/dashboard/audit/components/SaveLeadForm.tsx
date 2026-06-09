"use client";

import { ArrowRight, Loader2, Search, X } from "lucide-react";
import { businessTypes } from "@/lib/data/businessTypes";

// ── Component ───────────────────────────────────────────────────────────────────

type SaveLeadFormProps = {
  /** Whether the save form is visible */
  showSaveForm: boolean;
  /** Callback to open the save form */
  onOpenForm: () => void;
  /** Callback to close the save form */
  onCloseForm: () => void;
  /** The audited URL */
  url: string;
  /** Business name input value */
  saveLeadName: string;
  /** Callback when business name changes */
  onSaveLeadNameChange: (name: string) => void;
  /** City input value */
  saveLeadCity: string;
  /** Callback when city changes */
  onSaveLeadCityChange: (city: string) => void;
  /** Business type select value */
  saveLeadType: string;
  /** Callback when business type changes */
  onSaveLeadTypeChange: (type: string) => void;
  /** Error message from save lead */
  saveLeadError: string | null;
  /** Whether save is in progress */
  savingLead: boolean;
  /** Callback to save the lead (skipDetails param skips name/city/type) */
  onSaveLead: (skipDetails?: boolean) => void;
  /** Google Maps lookup URL input value */
  mapsLookupUrl: string;
  /** Callback when Maps lookup URL changes */
  onMapsLookupUrlChange: (url: string) => void;
  /** Whether Maps lookup is loading */
  mapsLookupLoading: boolean;
  /** Hint text from Maps lookup */
  mapsLookupHint: string | null;
  /** Callback to perform Maps lookup */
  onMapsLookup: () => void;
};

export function SaveLeadForm({
  showSaveForm,
  onOpenForm,
  onCloseForm,
  url,
  saveLeadName,
  onSaveLeadNameChange,
  saveLeadCity,
  onSaveLeadCityChange,
  saveLeadType,
  onSaveLeadTypeChange,
  saveLeadError,
  savingLead,
  onSaveLead,
  mapsLookupUrl,
  onMapsLookupUrlChange,
  mapsLookupLoading,
  mapsLookupHint,
  onMapsLookup,
}: SaveLeadFormProps) {
  // ── Not showing form yet — render the CTA card ───────────────────────────────
  if (!showSaveForm) {
    return (
      <div className="flex flex-col gap-2 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent-tint)] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[var(--text-primary)]">
            Save to Opportunities
          </p>
          <p className="text-xs text-[var(--text-secondary)]">
            Add this lead to your Opportunities list and view the full report.
          </p>
        </div>
        <button
          onClick={onOpenForm}
          className="inline-flex w-full sm:w-auto cursor-pointer items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-[var(--accent-hover)]"
        >
          View Full Report →
        </button>
      </div>
    );
  }

  // ── Form visible ─────────────────────────────────────────────────────────────
  return (
    <div className="rounded-xl border border-[var(--accent)]/30 bg-[var(--accent-tint)] p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-[var(--text-primary)]">
          Add a few details (optional)
        </p>
        <button
          onClick={onCloseForm}
          className="cursor-pointer rounded-lg p-1 text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-primary)]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <p className="mb-3 text-xs text-[var(--text-secondary)]">
        Not a local business? Leave city and type blank — score will be based on
        performance only.
      </p>

      {/* Google Maps lookup */}
      <div className="mb-3">
        <p className="mb-1.5 text-xs font-medium text-[var(--text-tertiary)]">
          Find on Google Maps{" "}
          <span className="font-normal text-[var(--text-muted)]">
            (optional — auto-fills details below)
          </span>
        </p>
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
                onMapsLookup();
              }
            }}
          />
          <button
            type="button"
            onClick={onMapsLookup}
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

      {/* Business details fields */}
      <div className="grid gap-2 sm:grid-cols-3">
        <input
          type="text"
          value={saveLeadName}
          onChange={(e) => onSaveLeadNameChange(e.target.value)}
          placeholder="Business name"
          className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface-2)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/20"
        />
        <input
          type="text"
          value={saveLeadCity}
          onChange={(e) => onSaveLeadCityChange(e.target.value)}
          placeholder="City (e.g. Dubai, London)"
          className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface-2)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/20"
        />
        <select
          value={saveLeadType}
          onChange={(e) => onSaveLeadTypeChange(e.target.value)}
          className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface-2)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/20"
        >
          <option value="">Business type (optional)</option>
          {businessTypes.map((bt) => (
            <option key={bt.value} value={bt.value}>
              {bt.label}
            </option>
          ))}
        </select>
      </div>

      {saveLeadError && (
        <p className="mt-2 text-xs text-red-400">{saveLeadError}</p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          onClick={() => onSaveLead(false)}
          disabled={savingLead}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {savingLead ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowRight className="h-4 w-4" />
          )}
          {savingLead ? "Saving…" : "Save & View Report"}
        </button>
        <button
          onClick={() => onSaveLead(true)}
          disabled={savingLead}
          className="cursor-pointer text-xs text-[var(--text-tertiary)] underline underline-offset-2 transition-colors hover:text-[var(--text-secondary)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Skip details
        </button>
      </div>
    </div>
  );
}
