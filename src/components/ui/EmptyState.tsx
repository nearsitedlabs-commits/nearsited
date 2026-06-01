import { type ReactNode, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

// ── Types ─────────────────────────────────────────────────────────────────────

export type EmptyStateProps = {
  /** Icon component (lucide-react icon, etc.) */
  icon?: ReactNode;
  /** Primary title text */
  title: string;
  /** Description text */
  description?: string;
  /** Optional action button */
  action?: ReactNode;
  /** Icon container class override */
  iconClassName?: string;
  /** Root class override */
  className?: string;
};

// ── Action Button ─────────────────────────────────────────────────────────────

export type EmptyStateActionProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

export function EmptyStateAction({ className, children, ...props }: EmptyStateActionProps) {
  return (
    <button
      className={cn(
        "mt-4 inline-flex items-center gap-2",
        "rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white",
        "transition-colors duration-150 ease-out hover:bg-[var(--accent-hover)]",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-tint)]",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
EmptyStateAction.displayName = "EmptyStateAction";

// ── Component ─────────────────────────────────────────────────────────────────

export function EmptyState({
  icon,
  title,
  description,
  action,
  iconClassName,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-20 text-center",
        className,
      )}
    >
      {icon && (
        <div
          className={cn(
            "mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--bg-elevated)]",
            iconClassName,
          )}
        >
          {icon}
        </div>
      )}

      <h3 className="text-xl font-normal text-[var(--text-primary)]">
        {title}
      </h3>

      {description && (
        <p className="mt-2 max-w-xs text-xs leading-relaxed text-[var(--text-tertiary)]">
          {description}
        </p>
      )}

      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
EmptyState.displayName = "EmptyState";
