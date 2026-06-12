"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

type BackConfig = {
  href: string;
  label?: string;
};

type MobileHeaderProps = {
  title: string;
  back?: BackConfig;
  rightSlot?: ReactNode;
  className?: string;
};

export function MobileHeader({ title, back, rightSlot, className }: MobileHeaderProps) {
  return (
    <header
      className={cn(
        "lg:hidden fixed top-0 left-0 right-0 z-[var(--z-nav)]",
        "border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)]",
        "pt-[var(--mobile-safe-top)]",
        className,
      )}
      style={{ height: "calc(var(--mobile-header-height) + var(--mobile-safe-top))" }}
    >
      <div className="flex h-[var(--mobile-header-height)] items-center gap-2 px-4">
        {back ? (
          <Link
            href={back.href}
            aria-label={back.label ?? "Go back"}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-surface)] hover:text-[var(--color-text-primary)]"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </Link>
        ) : null}

        <p className="flex-1 truncate text-base font-medium text-[var(--color-text-primary)] leading-none">
          {title}
        </p>

        {rightSlot ? (
          <div className="flex shrink-0 items-center gap-1">{rightSlot}</div>
        ) : null}
      </div>
    </header>
  );
}
