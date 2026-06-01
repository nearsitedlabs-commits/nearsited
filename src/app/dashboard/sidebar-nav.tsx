"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, GitBranch, FileText, Settings,
  Compass, Monitor,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/leads", label: "Opportunities", icon: Users },
  { href: "/dashboard/discover", label: "Opportunity Discovery", icon: Compass },
  { href: "/dashboard/audit", label: "Opportunity Review", icon: Monitor },
  { href: "/dashboard/pipeline", label: "Pipeline", icon: GitBranch },
  { href: "/dashboard/pitches", label: "Pitches", icon: FileText },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
      <p className="mb-2 px-2 text-[10px] font-medium uppercase tracking-widest text-[var(--text-tertiary)]">
        Main
      </p>

      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = item.href === "/dashboard"
          ? pathname === "/dashboard"
          : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2 text-sm transition-colors duration-150 rounded-lg ${
              isActive
                ? "bg-[var(--accent-tint)] text-[var(--accent)] font-medium"
                : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-white/[0.03] font-light"
            }`}
          >
            <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-[var(--accent)]" : "text-[var(--text-tertiary)]"}`} />
            <span>{item.label}</span>
          </Link>
        );
      })}

    </nav>
  );
}
