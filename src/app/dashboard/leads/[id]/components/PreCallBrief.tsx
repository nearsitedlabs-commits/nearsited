"use client";

import { Copy } from "lucide-react";

export type CallBriefSections = {
  hook: string;
  pain: string;
  scope: string;
  objection: string;
};

type Props = {
  businessName: string;
  businessType: string;
  sections: CallBriefSections;
};

/**
 * "Pre-Call Brief" card.
 * Replaces the legacy em-dash "Client Call Summary" with 4 structured blocks:
 * HOOK / PAIN / SUGGESTED SCOPE / OBJECTION TO PREP
 * Each block: small uppercase label + one or two short lines.
 */
export function PreCallBrief({ businessName, businessType, sections }: Props) {
  const blocks: { label: string; content: string }[] = [
    { label: "HOOK", content: sections.hook },
    { label: "PAIN", content: sections.pain },
    { label: "SUGGESTED SCOPE", content: sections.scope },
    { label: "OBJECTION TO PREP", content: sections.objection },
  ];

  const fullText = blocks.map((b) => `${b.label}\n${b.content}`).join("\n\n");
  const handleCopy = () => {
    navigator.clipboard.writeText(fullText);
  };

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 sm:p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Pre-Call Brief</h2>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            {businessName} — {businessType}. Read this 60 seconds before a sales call.
          </p>
        </div>
        <button
          onClick={handleCopy}
          className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-medium text-white transition-colors duration-150 hover:bg-[var(--accent-hover)]"
        >
          <Copy className="h-3.5 w-3.5" /> Copy
        </button>
      </div>
      <div className="space-y-3">
        {blocks.map((block) => (
          <div
            key={block.label}
            className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3.5 py-2.5"
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--accent)]">
              {block.label}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
              {block.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
