"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, Compass, GitBranch, Settings,
} from "lucide-react";

const MOBILE_NAV = [
  { href: "/dashboard",          label: "Home",      icon: LayoutDashboard },
  { href: "/dashboard/leads",    label: "Leads",     icon: Users },
  { href: "/dashboard/discover", label: "Discover",  icon: Compass },
  { href: "/dashboard/pipeline", label: "Pipeline",  icon: GitBranch },
  { href: "/dashboard/settings", label: "Settings",  icon: Settings },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border)] bg-[var(--bg-surface-2)]">
      <div className="flex items-stretch">
        {MOBILE_NAV.map((item) => {
          const Icon = item.icon;
          const isActive = item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors ${
                isActive
                  ? "text-[var(--accent)]"
                  : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
