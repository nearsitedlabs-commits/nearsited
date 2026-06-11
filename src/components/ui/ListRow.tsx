import { type ReactNode } from "react";
import { cn } from "@/lib/cn";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ListRowProps = {
  /** Score circle, checkbox, avatar, icon, etc. */
  leading?: ReactNode;
  /** Primary label */
  title: ReactNode;
  /** One line of supporting metadata */
  subtitle?: ReactNode;
  /** Status pill, timestamp, score, etc. */
  trailing?: ReactNode;
  /** Up to 2 visible actions. A 3rd+ should go in <ActionMenu>. */
  actions?: ReactNode;
  /** Pass onClick to make the entire row interactive */
  onClick?: () => void;
  className?: string;
};

// ── Component ─────────────────────────────────────────────────────────────────

export function ListRow({
  leading,
  title,
  subtitle,
  trailing,
  actions,
  onClick,
  className,
}: ListRowProps) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 px-4",
        "min-h-[42px] max-h-[48px]",
        "border-b border-[var(--color-border-subtle)]",
        "text-left",
        onClick &&
          "cursor-pointer transition-colors duration-100 " +
          "hover:bg-[var(--color-bg-surface)] focus-visible:outline-none " +
          "focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]/40",
        className,
      )}
    >
      {/* Leading slot */}
      {leading && (
        <div className="flex shrink-0 items-center justify-center">{leading}</div>
      )}

      {/* Title + subtitle */}
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-[var(--color-text-primary)]">
          {title}
        </div>
        {subtitle && (
          <div className="truncate text-xs text-[var(--color-text-tertiary)] leading-tight mt-0.5">
            {subtitle}
          </div>
        )}
      </div>

      {/* Trailing slot */}
      {trailing && (
        <div className="shrink-0 flex items-center">{trailing}</div>
      )}

      {/* Actions (max 2 visible + overflow in ActionMenu) */}
      {actions && (
        <div className="shrink-0 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {actions}
        </div>
      )}
    </Tag>
  );
}
ListRow.displayName = "ListRow";
