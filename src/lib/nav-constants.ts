import {
  LayoutDashboard, Users, Compass, Monitor, GitBranch, FileText, Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const DASHBOARD_NAV: NavItem[] = [
  { href: "/dashboard",          label: "Dashboard",             icon: LayoutDashboard },
  { href: "/dashboard/leads",    label: "Opportunities",         icon: Users },
  { href: "/dashboard/discover", label: "Opportunity Discovery", icon: Compass },
  { href: "/dashboard/audit",    label: "Opportunity Review",    icon: Monitor },
  { href: "/dashboard/pipeline", label: "Pipeline",              icon: GitBranch },
  { href: "/dashboard/pitches",  label: "Pitches",               icon: FileText },
  { href: "/dashboard/settings", label: "Settings",              icon: Settings },
];

export const MOBILE_NAV: NavItem[] = [
  { href: "/dashboard",          label: "Home",      icon: LayoutDashboard },
  { href: "/dashboard/leads",    label: "Leads",     icon: Users },
  { href: "/dashboard/discover", label: "Discover",  icon: Compass },
  { href: "/dashboard/audit",    label: "Audit",     icon: Monitor },
  { href: "/dashboard/pipeline", label: "Pipeline",  icon: GitBranch },
  { href: "/dashboard/pitches",  label: "Pitches",   icon: FileText },
  { href: "/dashboard/settings", label: "Settings",  icon: Settings },
];
