import {
  LayoutDashboard, Building2, Compass, ScanSearch, Kanban, FileText, Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const DASHBOARD_NAV: NavItem[] = [
  { href: "/dashboard",          label: "Dashboard",             icon: LayoutDashboard },
  { href: "/dashboard/leads",    label: "Opportunities",         icon: Building2 },
  { href: "/dashboard/discover", label: "Opportunity Discovery", icon: Compass },
  { href: "/dashboard/audit",    label: "Opportunity Review",    icon: ScanSearch },
  { href: "/dashboard/pipeline", label: "Pipeline",              icon: Kanban },
  { href: "/dashboard/pitches",  label: "Pitches",               icon: FileText },
  { href: "/dashboard/settings", label: "Settings",              icon: Settings },
];

export const MOBILE_NAV: NavItem[] = [
  { href: "/dashboard",          label: "Home",      icon: LayoutDashboard },
  { href: "/dashboard/leads",    label: "Leads",     icon: Building2 },
  { href: "/dashboard/discover", label: "Discover",  icon: Compass },
  { href: "/dashboard/audit",    label: "Audit",     icon: ScanSearch },
  { href: "/dashboard/pipeline", label: "Pipeline",  icon: Kanban },
  { href: "/dashboard/pitches",  label: "Pitches",   icon: FileText },
  { href: "/dashboard/settings", label: "Settings",  icon: Settings },
];
