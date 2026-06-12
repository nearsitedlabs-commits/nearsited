"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import type { LucideIcon } from "lucide-react";

export type BottomNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

type BottomNavProps = {
  items: BottomNavItem[];
  className?: string;
};

export function BottomNav({ items, className }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Mobile navigation"
      className={cn(
        "lg:hidden fixed bottom-0 left-0 right-0 z-[var(--z-nav)]",
        "border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)]",
        "pb-[var(--mobile-safe-bottom)]",
        className,
      )}
      style={{ height: "calc(var(--mobile-nav-height) + var(--mobile-safe-bottom))" }}
    >
      <div className="flex h-[var(--mobile-nav-height)] items-stretch">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5",
                "min-h-[44px] py-2 text-[10px] font-medium",
                "@media (hover: hover) { hover:text-[var(--color-text-secondary)] }",
                "transition-colors duration-150",
                isActive
                  ? "text-[var(--color-accent)]"
                  : "text-[var(--color-text-tertiary)]",
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 transition-none",
                  isActive ? "fill-current opacity-100" : "opacity-70",
                )}
                aria-hidden="true"
                strokeWidth={isActive ? 2.5 : 1.75}
              />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
