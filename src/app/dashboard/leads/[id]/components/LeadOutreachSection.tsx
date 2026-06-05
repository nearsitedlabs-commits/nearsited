"use client";

import { Copy, ExternalLink, Loader2, Mail, Phone, RefreshCw, Send } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import PipelineSelect from "@/components/ui/PipelineSelect";

// ── Types ─────────────────────────────────────────────────────────────────────

type OutreachChannel = "email" | "whatsapp";

const OUTREACH_CHANNELS: { id: OutreachChannel; label: string; icon: typeof Mail }[] = [
  { id: "email",    label: "Email",     icon: Mail },
  { id: "whatsapp", label: "WhatsApp",  icon: Phone },
];

// ── Props ─────────────────────────────────────────────────────────────────────

type LeadOutreachSectionProps = {
  outreachChannel: OutreachChannel;
  setOutreachChannel: (channel: OutreachChannel) => void;
  contactInfo: {
    email: string | null;
    phone: string | null;
    loading: boolean;
  };
  manualEmail: string;
  setManualEmail: (email: string) => void;
  pitchTone: string;
  setPitchTone: (tone: string) => void;
  pitchLength: string;
  setPitchLength: (length: string) => void;
  pitchFocus: string;
  setPitchFocus: (focus: string) => void;
  pitchOpening: string;
  setPitchOpening: (opening: string) => void;
  pitchUrgency: string;
  setPitchUrgency: (urgency: string) => void;
  hasAudit: boolean;
  hasDesign: boolean;
  generatingPitch: boolean;
  handleGeneratePitch: () => Promise<void>;
  pitchError: string | null;
  pitchResult: { subject: string; body: string } | null;
  handleCopyPitch: () => void;
};

// ── Component ─────────────────────────────────────────────────────────────────

export function LeadOutreachSection({
  outreachChannel,
  setOutreachChannel,
  contactInfo,
  manualEmail,
  setManualEmail,
  pitchTone,
  setPitchTone,
  pitchLength,
  setPitchLength,
  pitchFocus,
  setPitchFocus,
  pitchOpening,
  setPitchOpening,
  pitchUrgency,
  setPitchUrgency,
  hasAudit,
  hasDesign,
  generatingPitch,
  handleGeneratePitch,
  pitchError,
  pitchResult,
  handleCopyPitch,
}: LeadOutreachSectionProps) {
  const shouldReduce = useReducedMotion();
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 sm:p-6">
      <h2 className="mb-3 text-base font-semibold text-[var(--text-primary)]">Ready-to-Send Outreach</h2>

      {/* Channel tabs with contact status dots */}
      <div className="mb-3 flex gap-1 rounded-lg bg-[var(--bg-elevated)] p-1">
        {OUTREACH_CHANNELS.map((channel) => {
          const ChannelIcon = channel.icon;
          const contactLabel = channel.id === "email" ? contactInfo.email : contactInfo.phone;
          const hasContact = !!contactLabel;
          return (
            <button
              key={channel.id}
              onClick={() => setOutreachChannel(channel.id)}
              className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors duration-150 ${
                outreachChannel === channel.id
                  ? "bg-[var(--bg-surface)] text-[var(--accent)] shadow-[var(--shadow-xs)]"
                  : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${contactInfo.loading ? `bg-[var(--text-tertiary)]${shouldReduce ? "" : " animate-pulse"}` : hasContact ? "bg-[var(--score-good)]" : "bg-[var(--text-tertiary)]"}`} />
              <ChannelIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{channel.label}</span>
            </button>
          );
        })}
      </div>

      {/* Contact info per channel */}
      {!contactInfo.loading && (() => {
        let contactLabel: string | null = null;
        let contactAction: { label: string; url?: string } | null = null;
        if (outreachChannel === "email") {
          if (contactInfo.email) {
            contactLabel = contactInfo.email;
            contactAction = { label: "Send via email", url: `mailto:${contactInfo.email}` };
          }
        } else if (outreachChannel === "whatsapp") {
          if (contactInfo.phone) {
            contactLabel = contactInfo.phone;
            contactAction = { label: "Open WhatsApp", url: `https://wa.me/${contactInfo.phone.replace(/[^0-9]/g, "")}` };
          }
        }
        if (contactLabel) {
          return (
            <div className="mb-3 flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2">
              <span className="text-xs text-[var(--text-secondary)] truncate max-w-[60%]">{contactLabel}</span>
              {contactAction?.url && (
                <a href={contactAction.url} target="_blank" rel="noreferrer"
                  className="inline-flex cursor-pointer items-center gap-1 rounded-md bg-[var(--accent)] px-2.5 py-1 text-[10px] font-medium text-white transition-colors duration-150 hover:bg-[var(--accent-hover)] shrink-0">
                  <ExternalLink className="h-3 w-3" /> {contactAction.label}
                </a>
              )}
            </div>
          );
        }
        // Not found
        if (outreachChannel === "email") {
          return (
            <div className="mb-3 space-y-2">
              <p className="text-xs text-[var(--text-tertiary)]">Couldn&rsquo;t find an email address on the website.</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  placeholder="Paste email address manually..."
                  className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)]"
                />
              </div>
            </div>
          );
        }
        return (
          <div className="mb-3 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2">
            <p className="text-xs text-[var(--text-tertiary)]">Couldn&rsquo;t find a phone number on the website.</p>
          </div>
        );
      })()}

      {/* Pitch controls */}
      <div className="mb-3 space-y-2">
        <div className="flex flex-wrap gap-2">
          <PipelineSelect
            value={pitchTone}
            onChange={(v) => setPitchTone(v)}
            options={[
              { value: "professional", label: "Professional" },
              { value: "friendly", label: "Friendly" },
              { value: "luxury", label: "Luxury" },
            ]}
          />
          <PipelineSelect
            value={pitchLength}
            onChange={(v) => setPitchLength(v)}
            options={[
              { value: "short", label: "Short" },
              { value: "medium", label: "Medium" },
              { value: "detailed", label: "Detailed" },
            ]}
          />
          <PipelineSelect
            value={pitchFocus}
            onChange={(v) => setPitchFocus(v)}
            options={[
              { value: "all", label: "All angles" },
              { value: "performance", label: "Performance" },
              { value: "design", label: "Design" },
              { value: "trust", label: "Trust" },
              { value: "seo", label: "SEO" },
              { value: "revenue", label: "Revenue" },
            ]}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <PipelineSelect
            value={pitchOpening}
            onChange={(v) => setPitchOpening(v)}
            options={[
              { value: "direct", label: "Direct" },
              { value: "question", label: "Question-led" },
              { value: "empathy", label: "Empathy" },
              { value: "data", label: "Data-led" },
            ]}
          />
          <PipelineSelect
            value={pitchUrgency}
            onChange={(v) => setPitchUrgency(v)}
            options={[
              { value: "low", label: "Low-key" },
              { value: "medium", label: "Medium" },
              { value: "high", label: "High urgency" },
            ]}
          />
        </div>
        <div className="flex flex-wrap gap-2">
        <div className="relative inline-block">
          {hasAudit && hasDesign ? (
            <button
              onClick={handleGeneratePitch}
              disabled={generatingPitch}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white transition-colors duration-150 hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {generatingPitch && <Loader2 className="h-3 w-3 animate-spin" />}
              <Send className="h-3 w-3" />
              {generatingPitch ? "Generating…" : "Generate"}
            </button>
          ) : (
            <div
              className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-lg bg-[var(--bg-surface-2)] px-3 py-1.5 text-xs font-medium text-[var(--text-tertiary)] opacity-60"
              title="Analyse this lead first to generate a pitch"
            >
              <Mail className="h-3 w-3" />
              Generate (analyse first)
            </div>
          )}
          {generatingPitch && <div className="absolute left-0 right-0 -bottom-1 h-1 overflow-hidden rounded-b-md"><div className={`h-1 w-full bg-[var(--accent)]/60${shouldReduce ? "" : " animate-pulse"}`}/></div>}
        </div>
        </div>
      </div>

      {pitchError && (
        <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
          {pitchError}
        </div>
      )}

      {pitchResult ? (
        <div className="space-y-2 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-3">
          <p className="text-sm font-medium text-[var(--text-primary)]">{pitchResult.subject}</p>
          <p className="whitespace-pre-wrap text-xs text-[var(--text-secondary)] leading-relaxed">{pitchResult.body}</p>
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleCopyPitch}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors duration-150 hover:border-[var(--accent)]/40 hover:text-[var(--accent)]"
            >
              <Copy className="h-3 w-3" /> Copy
            </button>
            <button
              onClick={handleGeneratePitch}
              disabled={generatingPitch}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors duration-150 hover:border-[var(--accent)]/40 hover:text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {generatingPitch ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
              Regenerate
            </button>
          </div>
        </div>
      ) : (
        <p className="text-xs text-[var(--text-tertiary)]">Configure tone and length, then click Generate.</p>
      )}
    </div>
  );
}
