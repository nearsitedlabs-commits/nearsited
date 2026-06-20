"use client";

import { useState, useCallback } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { Copy, ExternalLink, Loader2, Mail, MessageSquare, RefreshCw, Send } from "lucide-react";
import { Button, GhostButton, SecondaryButton } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";

type OutreachChannel = "email" | "whatsapp";

export type PitchToneConfig = {
  tone: "professional" | "friendly" | "luxury";
  length: "short" | "medium" | "detailed";
  opening: "direct" | "question" | "empathy" | "data";
  urgency: "low" | "medium" | "high";
  focus: string;
};

type Props = {
  businessId: string;
  contactInfo: { email: string | null; phone: string | null; loading: boolean };
  outreachChannel: OutreachChannel;
  setOutreachChannel: (ch: OutreachChannel) => void;
  pitchConfig: PitchToneConfig;
  setPitchConfig: (config: PitchToneConfig) => void;
  canGenerate: boolean;
  generatingPitch: boolean;
  handleGeneratePitch: (force?: boolean) => Promise<void>;
  pitchError: string | null;
  pitchResult: { subject: string; body: string } | null;
  handleCopyPitch: () => void;
};

const TONE_OPTIONS   = [{ value: "professional", label: "Professional" }, { value: "friendly", label: "Friendly" }, { value: "luxury", label: "Luxury" }];
const LENGTH_OPTIONS = [{ value: "short", label: "Short" }, { value: "medium", label: "Medium" }, { value: "detailed", label: "Detailed" }];
const FOCUS_OPTIONS  = [{ value: "all", label: "All angles" }, { value: "seo", label: "Visibility & SEO" }, { value: "trust", label: "Trust" }, { value: "revenue", label: "Revenue" }];
const OPENING_OPTIONS = [{ value: "direct", label: "Direct" }, { value: "question", label: "Question-led" }, { value: "empathy", label: "Empathy" }, { value: "data", label: "Data-led" }];
const URGENCY_OPTIONS = [{ value: "low", label: "Low-key" }, { value: "medium", label: "Medium" }, { value: "high", label: "High urgency" }];

function toneLabel(config: PitchToneConfig) {
  const t = TONE_OPTIONS.find(o => o.value === config.tone)?.label ?? config.tone;
  const l = LENGTH_OPTIONS.find(o => o.value === config.length)?.label ?? config.length;
  return `${t} · ${l}`;
}

export function PitchCard({
  businessId: _businessId,
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
  const [editedBodies, setEditedBodies] = useState<Record<string, string | null>>({});
  const editedBody = editedBodies[outreachChannel] ?? null;

  const effectiveBody    = editedBody ?? pitchResult?.body ?? "";
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

  return (
    <div className="rounded-[var(--radius-md)] bg-[var(--color-bg-surface)] p-5 sm:p-6">
      <h2 className="mb-4 text-base font-semibold text-[var(--color-text-primary)]">Pitch</h2>

      {/* ── Channel tabs (Radix) ── */}
      <Tabs.Root
        value={outreachChannel}
        onValueChange={(v) => setOutreachChannel(v as OutreachChannel)}
        className="mb-4"
      >
        <Tabs.List
          aria-label="Outreach channel"
          className="flex border-b border-[var(--color-border-subtle)]"
        >
          <Tabs.Trigger
            value="email"
            className="flex items-center gap-1.5 border-b-2 border-transparent px-3 py-2.5 text-xs font-medium -mb-px transition-colors outline-none min-h-[44px] sm:min-h-0 data-[state=active]:border-[var(--color-accent)] data-[state=active]:text-[var(--color-text-primary)] data-[state=inactive]:text-[var(--color-text-secondary)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]/40 focus-visible:ring-inset"
          >
            <Mail className="h-4 w-4" aria-hidden="true" /> Email
          </Tabs.Trigger>
          <Tabs.Trigger
            value="whatsapp"
            className="flex items-center gap-1.5 border-b-2 border-transparent px-3 py-2.5 text-xs font-medium -mb-px transition-colors outline-none min-h-[44px] sm:min-h-0 data-[state=active]:border-[var(--color-accent)] data-[state=active]:text-[var(--color-text-primary)] data-[state=inactive]:text-[var(--color-text-secondary)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]/40 focus-visible:ring-inset"
          >
            <MessageSquare className="h-4 w-4" aria-hidden="true" /> WhatsApp
          </Tabs.Trigger>
        </Tabs.List>

        {/* Contact hints — per channel */}
        <div className="mt-3">
          <Tabs.Content value="email" className="outline-none">
            {contactInfo.loading ? (
              <ContactLoading />
            ) : contactInfo.email ? (
              <ContactChip icon={<Mail className="h-3.5 w-3.5" aria-hidden="true" />} text={contactInfo.email} />
            ) : (
              <p className="text-[11px] text-[var(--color-text-tertiary)]">No email found — pitch will be formatted for email outreach.</p>
            )}
          </Tabs.Content>
          <Tabs.Content value="whatsapp" className="outline-none">
            {contactInfo.loading ? (
              <ContactLoading />
            ) : contactInfo.phone ? (
              <ContactChip icon={<MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />} text={contactInfo.phone} />
            ) : (
              <p className="text-[11px] text-[var(--color-text-tertiary)]">No phone number found — pitch will be formatted for WhatsApp.</p>
            )}
          </Tabs.Content>
        </div>
      </Tabs.Root>

      {/* ── Tone pill (Pattern A — collapsed by default) + Generate button ── */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <SecondaryButton
          size="sm"
          onClick={() => setShowAdvanced((v) => !v)}
          aria-expanded={showAdvanced}
          className="min-h-[44px] sm:min-h-0"
        >
          Tone ▾ <span className="text-[var(--color-text-tertiary)] ml-0.5 hidden sm:inline">({toneLabel(pitchConfig)})</span>
        </SecondaryButton>

        {canGenerate ? (
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleGeneratePitch()}
            disabled={generatingPitch}
            loading={generatingPitch}
            icon={<Send className="h-3 w-3" aria-hidden="true" />}
            className="flex-1 sm:flex-none min-h-[44px] sm:min-h-0"
          >
            {generatingPitch ? "Generating…" : "Generate pitch"}
          </Button>
        ) : (
          <div
            className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-[var(--radius-sm)] bg-[var(--color-bg-elevated)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-tertiary)] opacity-60"
            title="Analyse this lead first to generate a pitch"
          >
            <Mail className="h-3 w-3" aria-hidden="true" />
            Generate (analyse first)
          </div>
        )}
      </div>

      {/* ── Advanced tone/style panel (Pattern A expanded) ── */}
      {showAdvanced && (
        <div className="mb-4 space-y-3 rounded-[var(--radius-sm)] bg-[var(--color-bg-elevated)] p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-tertiary)]">Tone &amp; Style</p>
          <div className="flex flex-wrap gap-3">
            <Select
              label="Tone"
              value={pitchConfig.tone}
              onValueChange={(v) => setPitchConfig({ ...pitchConfig, tone: v as PitchToneConfig["tone"] })}
              options={TONE_OPTIONS}
              variant="compact"
            />
            <Select
              label="Length"
              value={pitchConfig.length}
              onValueChange={(v) => setPitchConfig({ ...pitchConfig, length: v as PitchToneConfig["length"] })}
              options={LENGTH_OPTIONS}
              variant="compact"
            />
            <Select
              label="Focus"
              value={pitchConfig.focus}
              onValueChange={(v) => setPitchConfig({ ...pitchConfig, focus: v })}
              options={FOCUS_OPTIONS}
              variant="compact"
            />
            <Select
              label="Opening"
              value={pitchConfig.opening}
              onValueChange={(v) => setPitchConfig({ ...pitchConfig, opening: v as PitchToneConfig["opening"] })}
              options={OPENING_OPTIONS}
              variant="compact"
            />
            <Select
              label="Urgency"
              value={pitchConfig.urgency}
              onValueChange={(v) => setPitchConfig({ ...pitchConfig, urgency: v as PitchToneConfig["urgency"] })}
              options={URGENCY_OPTIONS}
              variant="compact"
            />
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {pitchError && (
        <div
          role="alert"
          aria-live="polite"
          className="mb-3 rounded-[var(--radius-sm)] border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400"
        >
          {pitchError}
        </div>
      )}

      {/* ── Generated pitch ── */}
      {pitchResult ? (
        <div className="rounded-[var(--radius-sm)] bg-[var(--color-bg-elevated)] p-3 space-y-3">
          {outreachChannel === "email" && effectiveSubject && (
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-[var(--color-text-tertiary)]">Subject</p>
              <p className="mt-0.5 text-sm font-medium text-[var(--color-text-primary)]">{effectiveSubject}</p>
            </div>
          )}
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-[var(--color-text-tertiary)]">Message</p>
            <textarea
              value={effectiveBody}
              onChange={(e) => setEditedBodies(prev => ({ ...prev, [outreachChannel]: e.target.value }))}
              className="mt-1 w-full resize-none rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-page)] p-2.5 text-xs leading-relaxed text-[var(--color-text-primary)] outline-none transition-colors focus:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]/30 min-h-[120px] sm:min-h-[200px]"
              rows={8}
              aria-label="Generated pitch message"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {outreachChannel === "whatsapp" && contactInfo.phone && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleOpenInWhatsApp}
                icon={<ExternalLink className="h-3 w-3" aria-hidden="true" />}
                className="min-h-[44px] sm:min-h-0"
              >
                Open in WhatsApp
              </Button>
            )}
            <SecondaryButton
              size="sm"
              onClick={handleCopyPitch}
              icon={<Copy className="h-3 w-3" aria-hidden="true" />}
              className="min-h-[44px] sm:min-h-0"
            >
              Copy pitch
            </SecondaryButton>
            <GhostButton
              size="sm"
              onClick={handleRegenerate}
              disabled={generatingPitch}
              loading={generatingPitch}
              icon={<RefreshCw className="h-3 w-3" aria-hidden="true" />}
              className="min-h-[44px] sm:min-h-0"
            >
              Regenerate
            </GhostButton>
          </div>
        </div>
      ) : (
        <p className="text-xs text-[var(--color-text-tertiary)]">Configure tone and generate a pitch to start outreach.</p>
      )}
    </div>
  );
}

function ContactLoading() {
  return (
    <div className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-3 py-2">
      <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--color-text-tertiary)]" aria-hidden="true" />
      <span className="text-xs text-[var(--color-text-tertiary)]">Finding contact info...</span>
    </div>
  );
}

function ContactChip({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-3 py-2">
      <span className="text-[var(--color-text-tertiary)]">{icon}</span>
      <span className="text-xs text-[var(--color-text-secondary)]">{text}</span>
    </div>
  );
}
