import { type ReactNode, type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

// ── Types ─────────────────────────────────────────────────────────────────────

export type SectionVariant = "card" | "flush" | "bordered";

export type SectionProps = HTMLAttributes<HTMLElement> & {
  title?: string;
  /** Right-aligned header slot */
  action?: ReactNode;
  /**
   * "card"     — bg-surface + border + 16px padding + radius-md.
   *              Use ONLY for hero / primary-action blocks (at most one per page).
   * "flush"    — no background, no border. Title has a 0.5px border-bottom-subtle.
   *              Use for list sections and page-level content groups.
   * "bordered" — no background, 0.5px border-subtle around the content.
   *              Use for secondary content groups.
   */
  variant?: SectionVariant;
  as?: "section" | "div" | "article";
};

// ── Style maps ────────────────────────────────────────────────────────────────

const WRAPPER: Record<SectionVariant, string> = {
  card:
    "rounded-[var(--radius-md)] bg-[var(--color-bg-surface)] " +
    "border border-[var(--color-border-subtle)] p-4",
  flush: "",
  bordered:
    "rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] p-4",
};

const TITLE_BOTTOM: Record<SectionVariant, string> = {
  card: "mb-4",
  flush: "border-b border-[var(--color-border-subtle)] pb-2 mb-3",
  bordered: "mb-4",
};

// ── Component ─────────────────────────────────────────────────────────────────

export function Section({
  title,
  action,
  variant = "flush",
  as: Tag = "section",
  className,
  children,
  ...props
}: SectionProps) {
  const hasHeader = title || action;
  return (
    <Tag className={cn(WRAPPER[variant], className)} {...props}>
      {hasHeader && (
        <div className={cn("flex items-center justify-between", TITLE_BOTTOM[variant])}>
          {title && (
            <h2 className="text-sm font-medium text-[var(--color-text-primary)] leading-none">
              {title}
            </h2>
          )}
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}
      {children}
    </Tag>
  );
}
Section.displayName = "Section";
