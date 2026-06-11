"use client";

import { type ReactNode } from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/cn";

// ── Types ─────────────────────────────────────────────────────────────────────

export type TooltipProps = {
  /** Content to show inside the tooltip */
  content: ReactNode;
  /** The element that triggers the tooltip on hover */
  children: ReactNode;
  /** Delay before showing (ms) — default 400 */
  delayDuration?: number;
  /** Side to show the tooltip — default "top" */
  side?: "top" | "bottom" | "left" | "right";
  /** Max width of the tooltip content */
  maxWidth?: number;
  /** Classname for the content wrapper */
  className?: string;
};

// ── Provider ──────────────────────────────────────────────────────────────────

/**
 * Must be wrapped near the root of the app to enable tooltip functionality.
 * Place once in `RootLayout` or the dashboard layout.
 */
export function TooltipProvider({ children }: { children: ReactNode }) {
  return <TooltipPrimitive.Provider delayDuration={400}>{children}</TooltipPrimitive.Provider>;
}
TooltipProvider.displayName = "TooltipProvider";

// ── Component ─────────────────────────────────────────────────────────────────

export function Tooltip({
  content,
  children,
  delayDuration,
  side = "top",
  maxWidth = 260,
  className,
}: TooltipProps) {
  return (
    <TooltipPrimitive.Root delayDuration={delayDuration}>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>

      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          sideOffset={6}
          className={cn(
            "z-50 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-3 py-2.5",
            "text-xs leading-relaxed text-[var(--color-text-primary)]",
            "shadow-[var(--brand-shadow-lg)]",
            "animate-in fade-in-0 zoom-in-95",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
            className,
          )}
          style={{ maxWidth }}
        >
          {content}

          <TooltipPrimitive.Arrow
            className="fill-[var(--bg-elevated)]"
            width={10}
            height={5}
          />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}
Tooltip.displayName = "Tooltip";
