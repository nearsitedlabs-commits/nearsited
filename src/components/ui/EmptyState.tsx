import { type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export type EmptyStateActionProps = {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  className?: string;
};

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex min-h-[240px] flex-col items-center justify-center py-16 text-center", className)}>
      <p className="text-sm font-medium text-[var(--color-text-primary)]">{title}</p>
      {description && (
        <p className="mx-auto mt-1 max-w-sm text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
EmptyState.displayName = "EmptyState";
