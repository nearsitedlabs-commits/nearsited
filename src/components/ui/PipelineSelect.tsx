"use client";

import { useState } from "react";
import * as Select from "@radix-ui/react-select";
import * as Dialog from "@radix-ui/react-dialog";
import { ChevronDown, Trash2 } from "lucide-react";
import { cn } from "@/lib/cn";

// Stage dot colors per CLAUDE.md design rules (Rule C — color is semantic)
const STAGE_DOT: Record<string, string> = {
  new_lead:        "var(--color-text-tertiary)",
  analysed:        "var(--color-text-tertiary)",
  contacted:       "var(--color-info)",
  in_conversation: "var(--color-info)",
  won:             "var(--color-success)",
  lost:            "var(--color-danger)",
};

type Option = {
  value: string;
  label: string;
};

type Props = {
  value: string;
  onChange: (value: string) => void | Promise<void>;
  options: Option[];
  /** When provided, adds a "Remove from pipeline" destructive option with confirmation */
  onRemove?: () => void | Promise<void>;
  className?: string;
};

export default function PipelineSelect({ value, onChange, options, onRemove, className = "" }: Props) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  function handleValueChange(val: string) {
    if (val === "__remove__") {
      setConfirmOpen(true);
      return;
    }
    onChange(val);
  }

  async function handleConfirmRemove() {
    setConfirmOpen(false);
    await onRemove?.();
  }

  return (
    <>
      <Select.Root value={value} onValueChange={handleValueChange}>
        <Select.Trigger
          className={cn(
            "inline-flex cursor-pointer items-center justify-center gap-1.5",
            "rounded-[var(--radius-sm)]",
            "bg-[var(--color-bg-elevated)]",
            "px-3 py-2 text-xs font-medium text-center text-[var(--color-text-secondary)]",
            "outline-none transition-colors duration-150",
            "focus:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]/40",
            className,
          )}
        >
          {/* Leading dot for current stage */}
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: STAGE_DOT[value] ?? "var(--color-text-tertiary)" }}
            aria-hidden="true"
          />
          <Select.Value />
          <Select.Icon asChild>
            <ChevronDown className="h-3 w-3 text-[var(--color-text-tertiary)]" aria-hidden="true" />
          </Select.Icon>
        </Select.Trigger>

        <Select.Portal>
          <Select.Content
            className={cn(
              "z-50 overflow-hidden",
              "rounded-[var(--radius-sm)]",
              "bg-[var(--color-bg-elevated)]",
              "shadow-[var(--brand-shadow-lg)]",
              "animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2",
            )}
            position="popper"
            sideOffset={4}
          >
            <Select.Viewport className="p-1">
              {options.map((opt) => (
                <Select.Item
                  key={opt.value}
                  value={opt.value}
                  className="relative flex cursor-pointer select-none items-center gap-2 rounded-[var(--radius-sm)] px-2.5 py-2 text-xs font-medium text-[var(--color-text-secondary)] outline-none transition-colors duration-100 data-[highlighted]:bg-[var(--accent-tint)] data-[highlighted]:text-[var(--color-text-primary)] data-[state=checked]:text-[var(--color-accent)]"
                >
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: STAGE_DOT[opt.value] ?? "var(--color-text-tertiary)" }}
                    aria-hidden="true"
                  />
                  <Select.ItemText>{opt.label}</Select.ItemText>
                </Select.Item>
              ))}

              {/* Divider + Remove option */}
              {onRemove && (
                <>
                  <div className="my-1 h-px bg-[var(--color-border-subtle)]" role="separator" />
                  <Select.Item
                    value="__remove__"
                    className="relative flex cursor-pointer select-none items-center gap-2 rounded-[var(--radius-sm)] px-2.5 py-2 text-xs font-medium text-[var(--color-danger)] outline-none transition-colors duration-100 data-[highlighted]:bg-[rgba(196,102,90,0.10)]"
                  >
                    <Trash2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <Select.ItemText>Remove from pipeline</Select.ItemText>
                  </Select.Item>
                </>
              )}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>

      {/* Remove confirmation dialog */}
      <Dialog.Root open={confirmOpen} onOpenChange={setConfirmOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-in fade-in-0" />
          <Dialog.Content
            className={cn(
              "fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2",
              "w-[calc(100vw-32px)] max-w-sm",
              "rounded-[var(--radius-md)]",
              "bg-[var(--color-bg-elevated)]",
              "p-5",
              "shadow-[var(--brand-shadow-lg)]",
              "animate-in fade-in-0 zoom-in-95",
              "outline-none",
            )}
            aria-modal="true"
            aria-labelledby="remove-dialog-title"
          >
            <Dialog.Title
              id="remove-dialog-title"
              className="mb-2 text-sm font-semibold text-[var(--color-text-primary)]"
            >
              Remove from pipeline?
            </Dialog.Title>
            <Dialog.Description className="mb-5 text-xs leading-relaxed text-[var(--color-text-secondary)]">
              This removes the lead from your pipeline. The lead&apos;s audit data is preserved — you can re-add it at any time.
            </Dialog.Description>
            <div className="flex justify-end gap-2">
              <Dialog.Close asChild>
                <button
                  className="inline-flex cursor-pointer items-center rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] transition-colors [@media(hover:hover)]:hover:bg-[var(--accent-tint)] [@media(hover:hover)]:hover:text-[var(--color-text-primary)]"
                >
                  Cancel
                </button>
              </Dialog.Close>
              <button
                onClick={handleConfirmRemove}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 px-3 py-1.5 text-xs font-medium text-[var(--color-danger)] transition-colors [@media(hover:hover)]:hover:bg-[var(--color-danger)]/20"
              >
                <Trash2 className="h-3 w-3" aria-hidden="true" /> Remove
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
