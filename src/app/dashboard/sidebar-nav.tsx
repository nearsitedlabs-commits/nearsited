"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DASHBOARD_NAV } from "@/lib/nav-constants";

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
      <p className="mb-2 px-2 text-[10px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)]">
        Main
      </p>

      {DASHBOARD_NAV.map((item) => {
        const Icon = item.icon;
        const isActive = item.href === "/dashboard"
          ? pathname === "/dashboard"
          : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2 text-sm transition-colors duration-150 rounded-[var(--radius-sm)] ${
              isActive
                ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)] font-medium"
                : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:bg-white/[0.03] font-light"
            }`}
          >
            <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-[var(--color-accent)]" : "text-[var(--color-text-tertiary)]"}`} aria-hidden="true" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
