import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { scopedAdmin } from "@/lib/api/scoped-admin";
import { redirect } from "next/navigation";
import SignOutButton from "./sign-out-button";
import SidebarNav from "./sidebar-nav";
import MobileBottomNav from "./mobile-nav";
import CreditsWidget from "@/components/ui/CreditsWidget";
import type { SubscriptionRow } from "@/lib/db-types";

const TIER_LABELS: Record<string, string> = {
  free: "Free Beta",
  starter: "Starter",
  agency: "Agency",
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!user.email_confirmed_at) redirect("/signup?verify=1");

  // Fetch subscription tier for the user label and credits widget
  let planLabel = "Free Beta";
  let sub: Pick<SubscriptionRow, "tier" | "audits_used" | "audits_limit"> | null = null;
  try {
    const { data } = await scopedAdmin(user.id)
      .from("subscriptions")
      .select("tier, audits_used, audits_limit")
      .maybeSingle();
    sub = data as Pick<SubscriptionRow, "tier" | "audits_used" | "audits_limit"> | null;
    if (sub?.tier) {
      planLabel = TIER_LABELS[sub.tier as string] ?? sub.tier as string;
    }
  } catch (e) {
    console.error("Failed to fetch subscription tier:", e);
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row bg-[var(--bg-base)]">
      <aside className="hidden lg:flex shrink-0 flex-col border-r border-[var(--border)] bg-[var(--bg-surface-2)]" style={{ width: 'var(--sidebar-width, 240px)' }}>

        {/* Brand — clicking logo goes to landing page */}
        <Link href="/" className="flex h-16 items-center gap-2.5 border-b border-[var(--border)] px-5 transition-colors hover:bg-white/[0.02]" style={{ fontFamily: 'var(--font-sans)' }}>
          <Image src="/logo-icon.svg" alt="" width={36} height={21} className="block shrink-0" />
          <span className="text-xl font-normal tracking-tight text-[var(--text-primary)]">
            NearSited
          </span>
        </Link>

        {/* Nav — client component for active state */}
        <SidebarNav />

        {/* Credits widget */}
        <div className="border-t border-[var(--border)] px-4 py-3">
          <CreditsWidget
            tier={sub?.tier ?? "free"}
            auditsUsed={sub?.audits_used ?? 0}
            auditsLimit={sub?.audits_limit ?? 10}
          />
        </div>

        {/* User row */}
        <div className="border-t border-[var(--border)] p-4">
          <div className="mb-3 flex items-center gap-3 rounded-lg bg-[var(--bg-elevated)] px-3 py-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent-tint)] text-xs font-bold text-[var(--accent)]">
              {user.email?.charAt(0).toUpperCase() ?? "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-[var(--text-primary)]">
                {user.email ?? "User"}
              </p>
              <p className="text-[10px] text-[var(--text-tertiary)]">{planLabel}</p>
            </div>
          </div>
          <SignOutButton />
        </div>

      </aside>

      {/* Mobile header + main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header — visible only on small screens */}
        <header className="lg:hidden border-b border-[var(--border)] bg-[var(--bg-surface-2)] px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 transition-colors hover:bg-white/[0.02]">
            <Image src="/logo-icon.svg" alt="" width={32} height={18} className="block shrink-0" />
            <span className="text-lg font-normal tracking-tight text-[var(--text-primary)]">
              NearSited
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent-tint)] text-xs font-bold text-[var(--accent)]">
              {user.email?.charAt(0).toUpperCase() ?? "U"}
            </div>
            <SignOutButton compact={true} />
          </div>
        </header>

        {/* Main content area — pb-16 on mobile reserves space for the bottom nav */}
        <main className="flex-1 overflow-auto bg-[var(--bg-base)] pb-16 lg:pb-0">{children}</main>
      </div>

      <MobileBottomNav />
    </div>
  );
}
