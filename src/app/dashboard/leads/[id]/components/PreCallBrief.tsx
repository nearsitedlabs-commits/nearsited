"use client";

import { Copy } from "lucide-react";
import { GhostButton, SecondaryButton } from "@/components/ui/Button";

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

const BLOCKS: { key: keyof CallBriefSections; label: string }[] = [
  { key: "hook",      label: "Hook" },
  { key: "pain",      label: "Pain" },
  { key: "scope",     label: "Suggested Scope" },
  { key: "objection", label: "Objection to Prep" },
];

export function PreCallBrief({ businessName, businessType, sections }: Props) {
  const fullText = BLOCKS.map(b => `${b.label.toUpperCase()}\n${sections[b.key]}`).join("\n\n");

  function copySection(text: string) {
    navigator.clipboard.writeText(text);
  }

  return (
    <div className="rounded-[var(--radius-md)] bg-[var(--color-bg-surface-raised)] p-5 sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-[var(--color-text-primary)]">Pre-Call Brief</h2>
          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
            {businessName} — {businessType}. Read this 60 seconds before a sales call.
          </p>
        </div>
        <SecondaryButton
          size="sm"
          onClick={() => copySection(fullText)}
          icon={<Copy className="h-3.5 w-3.5" aria-hidden="true" />}
          className="shrink-0"
        >
          Copy brief
        </SecondaryButton>
      </div>

      <div className="space-y-6">
        {BLOCKS.map((block) => (
          <div key={block.key}>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">
                {block.label}
              </span>
              <GhostButton
                size="sm"
                onClick={() => copySection(sections[block.key])}
                aria-label={`Copy ${block.label}`}
                className="h-7 w-7 shrink-0 p-0 min-h-0"
              >
                <Copy className="h-3 w-3" aria-hidden="true" />
              </GhostButton>
            </div>
            <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
              {sections[block.key]}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
