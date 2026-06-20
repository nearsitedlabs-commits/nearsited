"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/cn";
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
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const fullText = BLOCKS.map(b => `${b.label.toUpperCase()}\n${sections[b.key]}`).join("\n\n");

  function copySection(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
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
          onClick={() => copySection(fullText, "__all__")}
          icon={copiedKey === "__all__"
            ? <Check className="h-3.5 w-3.5 text-[var(--color-accent)]" aria-hidden="true" />
            : <Copy className="h-3.5 w-3.5" aria-hidden="true" />
          }
          className="shrink-0"
        >
          {copiedKey === "__all__" ? "Copied!" : "Copy brief"}
        </SecondaryButton>
      </div>

      <div className="space-y-6">
        {BLOCKS.map((block) => {
          const isCopied = copiedKey === block.key;
          return (
            <div key={block.key} className="group">
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">
                  {block.label}
                </span>
                <GhostButton
                  size="sm"
                  onClick={() => copySection(sections[block.key], block.key)}
                  aria-label={isCopied ? "Copied" : `Copy ${block.label}`}
                  className={cn(
                    "h-7 w-7 shrink-0 p-0 min-h-0 transition-all duration-150",
                    isCopied
                      ? "opacity-100 text-[var(--color-accent)]"
                      : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 text-[var(--color-text-tertiary)] [@media(hover:hover)]:hover:text-[var(--color-text-primary)]"
                  )}
                >
                  {isCopied
                    ? <Check className="h-3 w-3" aria-hidden="true" />
                    : <Copy className="h-3 w-3" aria-hidden="true" />
                  }
                </GhostButton>
              </div>
              <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                {sections[block.key]}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
