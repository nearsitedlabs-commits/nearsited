"use client";

import { CheckCircle2, ExternalLink, FileText, Loader2, Mail, Plus, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";
import type { StrategyResult, DesignResult } from "./types";
import { businessTypes } from "@/lib/data/businessTypes";
import { useRouter } from "next/navigation";

// ── Component ───────────────────────────────────────────────────────────────────

type ReviewCompleteActionsProps = {
  /** The audited URL */
  url: string;
  /** The audit result */
  auditResult: { mobile: StrategyResult; desktop: StrategyResult } | null;
  /** The design analysis result */
  designResult: { mobile: DesignResult; desktop: DesignResult } | null;
};

export function ReviewCompleteActions({
  url,
  auditResult,
  designResult,
}: ReviewCompleteActionsProps) {
  const router = useRouter();

  // ── State for combined save+pitch action ──────────────────────────────────────
  const [primaryLoading, setPrimaryLoading] = useState(false);
  const [primaryError, setPrimaryError] = useState<string | null>(null);
  const [pitchResult, setPitchResult] = useState<string | null>(null);
  const [showPitchResult, setShowPitchResult] = useState(false);
  const [savedBusinessId, setSavedBusinessId] = useState<string | null>(null);

  // ── Save-only state ───────────────────────────────────────────────────────────
  const [saveLoading, setSaveLoading] = useState(false);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [saveLeadName, setSaveLeadName] = useState("");
  const [saveLeadCity, setSaveLeadCity] = useState("");
  const [saveLeadType, setSaveLeadType] = useState("");
  const [saveLeadError, setSaveLeadError] = useState<string | null>(null);

  // ── Pipeline state ────────────────────────────────────────────────────────────
  const [pipelineLoading, setPipelineLoading] = useState(false);
  const [pipelineAdded, setPipelineAdded] = useState(false);
  const [pipelineError, setPipelineError] = useState<string | null>(null);
  const [pipelineBusinessId, setPipelineBusinessId] = useState<string | null>(null);

  const designMissing =
    !designResult ||
    (designResult.mobile.status !== "ok" && designResult.desktop.status !== "ok");

  // ── Primary action: save lead + generate pitch ───────────────────────────────
  const handlePrimaryAction = useCallback(async () => {
    if (!url.trim() || !auditResult) return;
    setPrimaryLoading(true);
    setPrimaryError(null);
    setPitchResult(null);
    setShowPitchResult(false);

    try {
      // 1. Save the lead
      const saveRes = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          website: url.trim(),
          audit: auditResult,
          ...(designResult ? { design: designResult } : {}),
        }),
      });

      const saveData = (await saveRes.json()) as {
        success?: boolean;
        business_id?: string;
        error?: string;
      };

      if (!saveRes.ok || !saveData.success) {
        throw new Error(saveData.error ?? "Failed to save lead");
      }

      const businessId = saveData.business_id!;
      setSavedBusinessId(businessId);

      // 2. Generate pitch
      const pitchRes = await fetch("/api/pitch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          website: url.trim(),
          audit: auditResult,
          ...(designResult ? { design: designResult } : {}),
        }),
      });

      const pitchData = await pitchRes.json();

      if (!pitchRes.ok) {
        // If pitch fails, still saved the lead — show partial success
        const message = pitchData.error ?? "Pitch generation failed, but lead was saved.";
        setPitchResult(message);
        setShowPitchResult(true);
        return;
      }

      const p = pitchData.pitch;
      const subject =
        typeof p === "object" && p?.subject ? String(p.subject) : "";
      const body =
        typeof p === "object" && p?.body
          ? String(p.body)
          : typeof p === "string"
            ? p
            : "No pitch could be generated.";
      setPitchResult(subject ? `${subject}\n\n${body}` : body);
      setShowPitchResult(true);
    } catch (err) {
      setPrimaryError(
        err instanceof Error ? err.message : "Failed to save and generate pitch",
      );
    } finally {
      setPrimaryLoading(false);
    }
  }, [url, auditResult, designResult]);

  // ── Save without pitch ────────────────────────────────────────────────────────
  const handleSaveOnly = useCallback(
    async (skipDetails = false) => {
      if (!url.trim()) return;
      setSaveLeadError(null);
      setSaveLoading(true);
      try {
        const res = await fetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            website: url.trim(),
            name: skipDetails ? undefined : saveLeadName || undefined,
            city: skipDetails ? undefined : saveLeadCity || undefined,
            businessType: skipDetails ? undefined : saveLeadType || undefined,
            audit: auditResult,
            ...(designResult ? { design: designResult } : {}),
          }),
        });
        const data = (await res.json()) as {
          success?: boolean;
          business_id?: string;
          error?: string;
        };
        if (!res.ok || !data.success)
          throw new Error(data.error ?? "Failed to save lead");
        router.push(`/dashboard/leads/${data.business_id}`);
      } catch (err) {
        setSaveLeadError(
          err instanceof Error ? err.message : "Failed to save lead",
        );
      } finally {
        setSaveLoading(false);
      }
    },
    [url, saveLeadName, saveLeadCity, saveLeadType, auditResult, designResult, router],
  );

  // ── Add to Pipeline ───────────────────────────────────────────────────────────
  const handleAddToPipeline = useCallback(async () => {
    if (!url.trim() || !auditResult) return;
    setPipelineError(null);
    setPipelineLoading(true);
    try {
      const res = await fetch("/api/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          website: url.trim(),
          audit: auditResult,
          ...(designResult ? { design: designResult } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(
          data.error ?? data.message ?? "Failed to add to pipeline",
        );
      }
      setPipelineBusinessId(data.business_id ?? null);
      setPipelineAdded(true);
    } catch (err) {
      setPipelineError(
        err instanceof Error ? err.message : "Failed to add to pipeline",
      );
    } finally {
      setPipelineLoading(false);
    }
  }, [url, auditResult, designResult]);

  // ── Open save form ────────────────────────────────────────────────────────────
  const handleOpenSaveForm = () => {
    let hostname = url.trim();
    try {
      hostname = new URL(url.trim()).hostname;
    } catch {
      /* keep raw */
    }
    setSaveLeadName(hostname);
    setSaveLeadCity("");
    setSaveLeadType("");
    setSaveLeadError(null);
    setShowSaveForm(true);
  };

  const timedOut =
    auditResult?.mobile.status === "timeout" &&
    auditResult?.desktop.status === "timeout";

  return (
    <div className="space-y-4">
      {/* ── Primary action card ───────────────────────────────────────────────── */}
      <div className="rounded-[var(--radius-md)] border border-[var(--color-accent)]/50 bg-[var(--color-bg-surface)] p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-medium text-[var(--color-text-primary)]">
              Generate pitch & save
            </h3>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              Saves to Opportunities. Pitch uses performance data only
              {designMissing
                ? " until design analysis completes."
                : " and design analysis."}
            </p>
          </div>
          <button
            onClick={handlePrimaryAction}
            disabled={primaryLoading || timedOut}
            className="inline-flex w-full shrink-0 cursor-pointer items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-accent)] px-6 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {primaryLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Mail className="h-4 w-4" />
            )}
            {primaryLoading ? "Saving & generating…" : "Generate pitch →"}
          </button>
        </div>

        {/* Primary action error */}
        {primaryError && (
          <div className="mt-3 rounded-[var(--radius-sm)] border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {primaryError}
          </div>
        )}

        {/* Pitch result preview */}
        {showPitchResult && pitchResult && (
          <div className="mt-4 space-y-2">
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-medium text-[var(--color-text-tertiary)]">
                  Pitch Preview
                </span>
                <div className="flex items-center gap-2">
                  {savedBusinessId && (
                    <Link
                      href={`/dashboard/leads/${savedBusinessId}`}
                      className="text-xs font-medium text-[var(--color-accent)] hover:underline"
                    >
                      View full report →
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(pitchResult);
                    }}
                    className="cursor-pointer text-xs font-medium text-[var(--color-accent)] hover:underline"
                  >
                    Copy to clipboard
                  </button>
                </div>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-text-secondary)]">
                {pitchResult}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Secondary actions row ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Save without pitch */}
        {showSaveForm ? (
          <div className="w-full rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium text-[var(--color-text-primary)]">
                Add a few details (optional)
              </p>
              <button
                onClick={() => setShowSaveForm(false)}
                className="cursor-pointer rounded-[var(--radius-sm)] p-1 text-[var(--color-text-tertiary)] transition-colors hover:text-[var(--color-text-primary)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              <input
                type="text"
                value={saveLeadName}
                onChange={(e) => setSaveLeadName(e.target.value)}
                placeholder="Business name"
                className="rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-tertiary)] focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]/20"
              />
              <input
                type="text"
                value={saveLeadCity}
                onChange={(e) => setSaveLeadCity(e.target.value)}
                placeholder="City (e.g. Dubai, London)"
                className="rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-tertiary)] focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]/20"
              />
              <select
                value={saveLeadType}
                onChange={(e) => setSaveLeadType(e.target.value)}
                className="rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--accent)]/20"
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
                onClick={() => handleSaveOnly(false)}
                disabled={saveLoading}
                className="inline-flex cursor-pointer items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-accent)] px-5 py-2 text-sm font-medium text-white transition-colors duration-150 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saveLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                {saveLoading ? "Saving…" : "Save & View Report"}
              </button>
              <button
                onClick={() => handleSaveOnly(true)}
                disabled={saveLoading}
                className="cursor-pointer text-xs text-[var(--color-text-tertiary)] underline underline-offset-2 transition-colors hover:text-[var(--color-text-secondary)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Skip details
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={handleOpenSaveForm}
            disabled={timedOut || savedBusinessId != null}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] transition-colors duration-150 hover:border-[var(--color-accent)]/40 hover:text-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FileText className="h-3.5 w-3.5" />
            Save without pitch
          </button>
        )}

        {/* Open full report */}
        {savedBusinessId && (
          <Link
            href={`/dashboard/leads/${savedBusinessId}`}
            className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] transition-colors duration-150 hover:border-[var(--color-accent)]/40 hover:text-[var(--color-accent)]"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open full report
          </Link>
        )}

        {/* + Pipeline */}
        {pipelineAdded ? (
          <div className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--color-success)]/30 bg-[var(--color-success)]/10 px-3 py-1.5 text-xs font-medium text-[var(--color-success)]">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Added to pipeline
            {pipelineBusinessId && (
              <Link
                href={`/dashboard/leads/${pipelineBusinessId}`}
                className="ml-1 underline hover:opacity-80"
              >
                View →
              </Link>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={handleAddToPipeline}
            disabled={pipelineLoading || timedOut}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] transition-colors duration-150 hover:border-[var(--color-accent)]/40 hover:text-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pipelineLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
            {pipelineLoading ? "Adding…" : "+ Pipeline"}
          </button>
        )}

        {pipelineError && (
          <p className="w-full text-xs text-red-400">{pipelineError}</p>
        )}
      </div>
    </div>
  );
}
