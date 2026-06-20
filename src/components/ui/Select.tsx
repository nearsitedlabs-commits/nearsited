"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

export type SelectOption = { value: string; label: string };

export type SelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  label?: string;
  /** "compact" reduces padding/font slightly for dense areas like the Tone panel */
  variant?: "default" | "compact";
};

export function Select({ value, onValueChange, options, placeholder, label, variant = "default" }: SelectProps) {
  const isCompact = variant === "compact";
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
          {label}
        </span>
      )}
      <SelectPrimitive.Root value={value} onValueChange={onValueChange}>
        <SelectPrimitive.Trigger
          className={cn(
            "inline-flex cursor-pointer items-center justify-between gap-1.5",
            "rounded-[var(--radius-sm)]",
            "border border-[var(--color-border-subtle)]",
            "bg-[var(--color-bg-surface)]",
            "text-[var(--color-text-primary)]",
            "outline-none transition-colors duration-150",
            "focus:border-[var(--color-accent)]",
            "focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]/40",
            "disabled:cursor-not-allowed disabled:opacity-50",
            isCompact
              ? "min-w-[90px] px-2 py-1 text-[11px]"
              : "min-w-[120px] px-2.5 py-1.5 text-xs",
          )}
        >
          <SelectPrimitive.Value
            placeholder={
              placeholder ? (
                <span className="text-[var(--color-text-secondary)]">{placeholder}</span>
              ) : undefined
            }
          />
          <SelectPrimitive.Icon asChild>
            <ChevronDown className="h-3 w-3 shrink-0 text-[var(--color-text-tertiary)]" aria-hidden="true" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>

        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
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
            <SelectPrimitive.Viewport className="p-1">
              {options.map((opt) => (
                <SelectPrimitive.Item
                  key={opt.value}
                  value={opt.value}
                  className={cn(
                    "relative flex cursor-pointer select-none items-center gap-2 pr-6",
                    "rounded-[var(--radius-sm)] px-2.5 py-1.5",
                    "text-xs text-[var(--color-text-secondary)]",
                    "outline-none transition-colors duration-100",
                    "data-[highlighted]:bg-[var(--accent-tint)] data-[highlighted]:text-[var(--color-text-primary)]",
                    "data-[state=checked]:text-[var(--color-accent)]",
                  )}
                >
                  <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
                  <SelectPrimitive.ItemIndicator className="absolute right-2">
                    <Check className="h-3 w-3" aria-hidden="true" />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    </div>
  );
}
Select.displayName = "Select";
