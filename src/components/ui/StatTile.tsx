import { cn } from "@/lib/cn";

// ── Types ─────────────────────────────────────────────────────────────────────

export type StatTileAccent = "warning" | "info" | "success";

export type StatTileProps = {
  label: string;
  value: string | number;
  /** When set, renders a 2px left border in the corresponding semantic color. */
  accent?: StatTileAccent;
  className?: string;
};

// ── Style map ─────────────────────────────────────────────────────────────────

const ACCENT_BORDER: Record<StatTileAccent, string> = {
  warning: "border-l-2 border-l-[var(--color-warning)]",
  info:    "border-l-2 border-l-[var(--color-info)]",
  success: "border-l-2 border-l-[var(--color-success)]",
};

// ── Component ─────────────────────────────────────────────────────────────────

export function StatTile({ label, value, accent, className }: StatTileProps) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-md)] bg-[var(--color-bg-surface)]",
        "border border-[var(--color-border-subtle)]",
        "px-4 py-3",
        accent ? ACCENT_BORDER[accent] : "",
        className,
      )}
    >
      <div className="text-[11px] font-medium uppercase tracking-[0.04em] text-[var(--color-text-tertiary)] leading-none">
        {label}
      </div>
      <div className="mt-1.5 text-2xl font-medium text-[var(--color-text-primary)] leading-none tabular-nums">
        {value}
      </div>
    </div>
  );
}
StatTile.displayName = "StatTile";
