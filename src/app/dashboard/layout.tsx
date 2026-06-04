import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SignOutButton from "./sign-out-button";
import SidebarNav from "./sidebar-nav";
import MobileBottomNav from "./mobile-nav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!user.email_confirmed_at) redirect("/signup?verify=1");

  return (
    <div className="flex min-h-screen flex-col lg:flex-row bg-[var(--bg-base)]">
      <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--bg-surface-2)]">

        {/* Brand — clicking logo goes to landing page */}
        <Link href="/" className="flex h-16 items-center gap-2.5 border-b border-[var(--border)] px-5 transition-colors hover:bg-white/[0.02]" style={{ fontFamily: 'Switzer, Geist, sans-serif' }}>
          <Image src="/logo-icon.svg" alt="" width={36} height={21} className="block shrink-0" />
          <span className="text-xl font-normal tracking-tight text-[var(--text-primary)]">
            NearSited
          </span>
        </Link>

        {/* Nav — client component for active state */}
        <SidebarNav />

        {/* Beta access widget */}
        <div className="border-t border-[var(--border)] px-4 py-3">
          <div className="rounded-xl border border-[var(--accent)]/20 bg-[var(--accent-tint)] px-3 py-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--accent)]">Free Beta</span>
              <span className="text-xs text-[var(--text-tertiary)]">Full access</span>
            </div>
            <p className="mt-1 text-[10px] text-[var(--text-tertiary)]">
              Paid plans launching soon &middot; <a href="/pricing" target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">See pricing</a>
            </p>
          </div>
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
              <p className="text-[10px] text-[var(--text-tertiary)]">Free Beta</p>
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
