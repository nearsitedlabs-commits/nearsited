"use client";

import { useRef, useCallback, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type SwipeActionItem = {
  label: string;
  variant?: "default" | "danger";
  onClick: () => void;
};

type SwipeActionProps = {
  children: ReactNode;
  actions: SwipeActionItem[];
  className?: string;
};

const ACTION_WIDTH = 72; // px per action button

export function SwipeAction({ children, actions, className }: SwipeActionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const maxReveal = actions.length * ACTION_WIDTH;

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const startX = e.clientX;
    const startOffset = offset;

    const onMove = (ev: PointerEvent) => {
      const delta = startX - ev.clientX;
      const next = Math.max(0, Math.min(maxReveal, startOffset + delta));
      setOffset(next);
    };

    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      if (offset > maxReveal / 2) {
        setOffset(maxReveal);
        setRevealed(true);
      } else {
        setOffset(0);
        setRevealed(false);
      }
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }, [offset, maxReveal]);

  const close = useCallback(() => {
    setOffset(0);
    setRevealed(false);
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden", className)}
    >
      {/* Action buttons (revealed on swipe left) */}
      <div
        className="absolute inset-y-0 right-0 flex"
        style={{ width: maxReveal }}
        aria-hidden={!revealed}
      >
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={() => {
              action.onClick();
              close();
            }}
            className={cn(
              "flex flex-1 items-center justify-center",
              "text-xs font-medium text-white",
              "min-h-[44px]",
              action.variant === "danger"
                ? "bg-[var(--color-danger)]"
                : "bg-[var(--color-text-tertiary)]",
            )}
          >
            {action.label}
          </button>
        ))}
      </div>

      {/* Main content — translates left on swipe */}
      <div
        className="relative bg-[var(--color-bg-page)] transition-transform duration-200 ease-out"
        style={{ transform: `translateX(-${offset}px)` }}
        onPointerDown={handlePointerDown}
      >
        {children}
      </div>
    </div>
  );
}
