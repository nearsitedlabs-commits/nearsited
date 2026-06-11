"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/cn";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ActionMenuItem = {
  label: string;
  onClick: () => void;
  /** When true, renders the item in danger color */
  danger?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
};

export type ActionMenuProps = {
  items: ActionMenuItem[];
  /** Override the default ⋯ trigger */
  trigger?: React.ReactNode;
  align?: "start" | "center" | "end";
};

// ── Component ─────────────────────────────────────────────────────────────────

export function ActionMenu({ items, trigger, align = "end" }: ActionMenuProps) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        {trigger ?? (
          <button
            className={cn(
              "inline-flex h-7 w-7 items-center justify-center",
              "rounded-[var(--radius-sm)]",
              "text-[var(--color-text-tertiary)]",
              "transition-colors duration-100",
              "hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-text-primary)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]/40",
            )}
            aria-label="More actions"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        )}
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align={align}
          sideOffset={4}
          className={cn(
            "z-[var(--z-dropdown)] min-w-[160px] overflow-hidden",
            "rounded-[var(--radius-md)]",
            "border border-[var(--color-border-subtle)]",
            "bg-[var(--color-bg-elevated)]",
            "shadow-[var(--brand-shadow-lg)]",
            "p-1",
            "animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2",
          )}
        >
          {items.map((item, i) => (
            <DropdownMenu.Item
              key={i}
              disabled={item.disabled}
              onSelect={item.onClick}
              className={cn(
                "flex cursor-pointer select-none items-center gap-2",
                "rounded-[var(--radius-sm)] px-3 py-2",
                "text-sm",
                "transition-colors duration-100",
                "focus-visible:outline-none",
                item.danger
                  ? "text-[var(--color-danger)] data-[highlighted]:bg-[rgba(196,102,90,0.10)]"
                  : "text-[var(--color-text-secondary)] data-[highlighted]:bg-[var(--color-bg-surface)] data-[highlighted]:text-[var(--color-text-primary)]",
                item.disabled && "cursor-not-allowed opacity-40",
              )}
            >
              {item.icon && (
                <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                  {item.icon}
                </span>
              )}
              {item.label}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
ActionMenu.displayName = "ActionMenu";
