"use client";

import { useState, useCallback } from "react";
import { Copy, ExternalLink, Loader2, Mail, Phone, RefreshCw, Send } from "lucide-react";

type OutreachChannel = "email" | "whatsapp";

type PitchToneConfig = {
  tone: "professional" | "friendly" | "luxury";
  length: "short" | "medium" | "detailed";
  opening: "direct" | "question" | "empathy" | "data";
  urgency: "low" | "medium" | "high";
  focus: string;
};

type Props = {
  /** The business ID */
  businessId: string;
  /** Contact info for the business */
  contactInfo: { email: string | null; phone: string | null; loading: boolean };
  /** Current channel */
  outreachChannel: OutreachChannel;
  /** Change channel */
  setOutreachChannel: (ch: OutreachChannel) => void;
  /** Current pitch configuration */
  pitchConfig: PitchToneConfig;
  /** Update pitch configuration */
  setPitchConfig: (config: PitchToneConfig) => void;
  /** Whether we have audit data (enables pitch generation) */
  canGenerate: boolean;
  /** Generation state */
  generatingPitch: boolean;
  /** Generate pitch handler */
  handleGeneratePitch: (force?: boolean) => Promise<void>;
  /** Error message */
  pitchError: string | null;
  /** Generated pitch result */
  pitchResult: { subject: string; body: string } | null;
  /** Copy handler */
  handleCopyPitch: () => void;
};

const CHANNELS: { id: OutreachChannel; label: string; icon: typeof Mail }[] = [
  { id: "email", label: "Email", icon: Mail },
  { id: "whatsapp", label: "WhatsApp", icon: Phone },
];

const TONE_LABELS: Record<string, string> = {
  professional: "Professional",
  friendly: "Friendly",
  luxury: "Luxury",
};

const LENGTH_LABELS: Record<string, string> = {
  short: "Short",
  medium: "Medium",
  detailed: "Detailed",
};

/**
 * Simplified Pitch card with a single "Tone ▾" trigger.
 * Default: Friendly + Short + Direct.
 * Expands to reveal advanced options (focus, opening, urgency) on click.
 */
export function PitchCard({
  businessId, // eslint-disable-line @typescript-eslint/no-unused-vars
  contactInfo,
  outreachChannel,
  setOutreachChannel,
  pitchConfig,
  setPitchConfig,
  canGenerate,
  generatingPitch,
  handleGeneratePitch,
  pitchError,
  pitchResult,
  handleCopyPitch,
}: Props) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  // Per-channel edits — switching channel derives null automatically, no effect needed
  const [editedBodies, setEditedBodies] = useState<Record<string, string | null>>({});
  const editedBody = editedBodies[outreachChannel] ?? null;

  const effectiveBody = editedBody ?? pitchResult?.body ?? "";
  const effectiveSubject = pitchResult?.subject ?? "";

  const handleRegenerate = useCallback(() => {
    setEditedBodies(prev => ({ ...prev, [outreachChannel]: null }));
    handleGeneratePitch(true);
  }, [handleGeneratePitch, outreachChannel]);

  const handleOpenInWhatsApp = useCallback(() => {
    if (!effectiveBody || !contactInfo.phone) return;
    const text = encodeURIComponent(effectiveBody);
    window.open(`https://wa.me/${contactInfo.phone.replace(/[^0-9]/g, "")}?text=${text}`, "_blank");
  }, [effectiveBody, contactInfo.phone]);

  const summaryLabel = `${TONE_LABELS[pitchConfig.tone] ?? pitchConfig.tone} + ${LENGTH_LABELS[pitchConfig.length] ?? pitchConfig.length} + Direct`;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 sm:p-6">
      <h2 className="mb-3 text-base font-semibold text-[var(--text-primary)]">Pitch</h2>

      {/* Channel toggle */}
      <div className="mb-3 flex gap-1 rounded-lg bg-[var(--bg-elevated)] p-1">
        {CHANNELS.map((ch) => {
          const ChIcon = ch.icon;
          return (
            <button
              key={ch.id}
              type="button"
              onClick={() => setOutreachChannel(ch.id)}
              className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors duration-150 ${
                outreachChannel === ch.id
                  ? "bg-[var(--bg-surface)] text-[var(--accent)] shadow-[var(--shadow-xs)]"
                  : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
              }`}
            >
              <ChIcon className="h-3.5 w-3.5" />
              {ch.label}
            </button>
          );
        })}
      </div>

      {/* Contact hint */}
      {contactInfo.loading ? (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--text-tertiary)]" />
          <span className="text-xs text-[var(--text-tertiary)]">Finding contact info...</span>
        </div>
      ) : (
        <div className="mb-3">
          {outreachChannel === "email" && contactInfo.email && (
            <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2">
              <Mail className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
              <span className="text-xs text-[var(--text-secondary)]">{contactInfo.email}</span>
            </div>
          )}
          {outreachChannel === "whatsapp" && contactInfo.phone && (
            <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2">
              <Phone className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
              <span className="text-xs text-[var(--text-secondary)]">{contactInfo.phone}</span>
            </div>
          )}
          {outreachChannel === "email" && !contactInfo.email && (
            <p className="text-[11px] text-[var(--text-tertiary)]">No email found — pitch will be formatted for email outreach.</p>
          )}
          {outreachChannel === "whatsapp" && !contactInfo.phone && (
            <p className="text-[11px] text-[var(--text-tertiary)]">No phone number found — pitch will be formatted for WhatsApp.</p>
          )}
        </div>
      )}

      {/* Single Tone trigger + Generate button */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--accent)]/40 hover:text-[var(--accent)]"
          >
            Tone ▾ <span className="text-[var(--text-tertiary)] ml-0.5">({summaryLabel})</span>
          </button>
        </div>

        {canGenerate ? (
          <button
            onClick={() => handleGeneratePitch()}
            disabled={generatingPitch}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {generatingPitch ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
            {generatingPitch ? "Generating…" : "Generate"}
          </button>
        ) : (
          <div className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-lg bg-[var(--bg-surface-2)] px-3 py-1.5 text-xs font-medium text-[var(--text-tertiary)] opacity-60"
            title="Analyse this lead first to generate a pitch">
            <Mail className="h-3 w-3" />
            Generate (analyse first)
          </div>
        )}
      </div>

      {/* Advanced options — only revealed on Tone ▾ click */}
      {showAdvanced && (
        <div className="mb-3 space-y-2 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">Tone & Style</p>
          <div className="flex flex-wrap gap-2">
            {/* Tone */}
            <select
              value={pitchConfig.tone}
              onChange={(e) => setPitchConfig({ ...pitchConfig, tone: e.target.value as PitchToneConfig["tone"] })}
              className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs text-[var(--text-secondary)] outline-none focus:border-[var(--accent)]"
            >
              <option value="professional">Professional</option>
              <option value="friendly">Friendly</option>
              <option value="luxury">Luxury</option>
            </select>
            {/* Length */}
            <select
              value={pitchConfig.length}
              onChange={(e) => setPitchConfig({ ...pitchConfig, length: e.target.value as PitchToneConfig["length"] })}
              className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs text-[var(--text-secondary)] outline-none focus:border-[var(--accent)]"
            >
              <option value="short">Short</option>
              <option value="medium">Medium</option>
              <option value="detailed">Detailed</option>
            </select>
            {/* Focus */}
            <select
              value={pitchConfig.focus}
              onChange={(e) => setPitchConfig({ ...pitchConfig, focus: e.target.value })}
              className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs text-[var(--text-secondary)] outline-none focus:border-[var(--accent)]"
            >
              <option value="all">All angles</option>
              <option value="seo">Visibility & SEO</option>
              <option value="trust">Trust</option>
              <option value="revenue">Revenue</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            {/* Opening */}
            <select
              value={pitchConfig.opening}
              onChange={(e) => setPitchConfig({ ...pitchConfig, opening: e.target.value as PitchToneConfig["opening"] })}
              className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs text-[var(--text-secondary)] outline-none focus:border-[var(--accent)]"
            >
              <option value="direct">Direct</option>
              <option value="question">Question-led</option>
              <option value="empathy">Empathy</option>
              <option value="data">Data-led</option>
            </select>
            {/* Urgency */}
            <select
              value={pitchConfig.urgency}
              onChange={(e) => setPitchConfig({ ...pitchConfig, urgency: e.target.value as PitchToneConfig["urgency"] })}
              className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs text-[var(--text-secondary)] outline-none focus:border-[var(--accent)]"
            >
              <option value="low">Low-key</option>
              <option value="medium">Medium</option>
              <option value="high">High urgency</option>
            </select>
          </div>
        </div>
      )}

      {/* Error */}
      {pitchError && (
        <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
          {pitchError}
        </div>
      )}

      {/* Generated pitch */}
      {pitchResult ? (
        <div className="space-y-2 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-3">
          {outreachChannel === "email" && effectiveSubject && (
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-[var(--text-tertiary)]">Subject</p>
              <p className="text-sm font-medium text-[var(--text-primary)]">{effectiveSubject}</p>
            </div>
          )}
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-[var(--text-tertiary)]">Message</p>
            <textarea
              value={effectiveBody}
              onChange={(e) => setEditedBodies(prev => ({ ...prev, [outreachChannel]: e.target.value }))}
              className="mt-1 w-full resize-y rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-2.5 text-xs text-[var(--text-secondary)] leading-relaxed outline-none focus:border-[var(--accent)]"
              rows={8}
            />
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {outreachChannel === "whatsapp" && contactInfo.phone && (
              <button
                onClick={handleOpenInWhatsApp}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[var(--accent-hover)]"
              >
                <ExternalLink className="h-3 w-3" /> Open in WhatsApp ↗
              </button>
            )}
            <button
              onClick={handleCopyPitch}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--accent)]/40 hover:text-[var(--accent)]"
            >
              <Copy className="h-3 w-3" /> Copy
            </button>
            <button
              onClick={handleRegenerate}
              disabled={generatingPitch}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--accent)]/40 hover:text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {generatingPitch ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
              Regenerate
            </button>
          </div>
        </div>
      ) : (
        <p className="text-xs text-[var(--text-tertiary)]">Configure tone and generate a pitch to start outreach.</p>
      )}
    </div>
  );
}
