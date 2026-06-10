import {
  LayoutDashboard, Building2, Compass, Kanban, FileText, Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const DASHBOARD_NAV: NavItem[] = [
  { href: "/dashboard",          label: "Dashboard",     icon: LayoutDashboard },
  { href: "/dashboard/discover", label: "Find",           icon: Compass },
  { href: "/dashboard/leads",    label: "Opportunities",  icon: Building2 },
  { href: "/dashboard/pipeline", label: "Pipeline",       icon: Kanban },
  { href: "/dashboard/pitches",  label: "Pitches",        icon: FileText },
  { href: "/dashboard/settings", label: "Settings",       icon: Settings },
];

export const MOBILE_NAV: NavItem[] = [
  { href: "/dashboard",          label: "Home",           icon: LayoutDashboard },
  { href: "/dashboard/discover", label: "Find",           icon: Compass },
  { href: "/dashboard/leads",    label: "Leads",          icon: Building2 },
  { href: "/dashboard/pipeline", label: "Pipeline",       icon: Kanban },
  { href: "/dashboard/pitches",  label: "Pitches",        icon: FileText },
  { href: "/dashboard/settings", label: "Settings",       icon: Settings },
];
