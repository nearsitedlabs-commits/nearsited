import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SignOutButton from "./sign-out-button";
import SidebarNav from "./sidebar-nav";
import MobileBottomNav from "./mobile-nav";
import CreditsWidget from "@/components/ui/CreditsWidget";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!user.email_confirmed_at) redirect("/signup?verify=1");

  return (
    <div className="flex min-h-screen flex-col lg:flex-row bg-[var(--color-bg-page)]">
      {/* Skip navigation for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[9999] focus:rounded-[var(--radius-sm)] focus:bg-[var(--color-accent)] focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white focus:shadow-xl"
      >
        Skip to main content
      </a>
      <aside className="hidden lg:flex shrink-0 flex-col border-r border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)]" style={{ width: 'var(--sidebar-width, 240px)' }}>

        {/* Brand — clicking logo goes to dashboard home */}
        <Link href="/dashboard" className="flex h-16 items-center gap-2.5 border-b border-[var(--color-border-subtle)] px-5 transition-colors hover:bg-white/[0.02]" style={{ fontFamily: 'var(--font-sans)' }}>
          <Image src="/logo-icon.svg" alt="" width={36} height={21} className="block shrink-0" />
          <span className="text-xl font-normal tracking-tight text-[var(--color-text-primary)]">
            NearSited
          </span>
        </Link>

        {/* Nav — client component for active state */}
        <SidebarNav />

        {/* Credits widget — fetches its own data client-side to avoid blocking layout */}
        <div className="border-t border-[var(--color-border-subtle)] px-4 py-3">
          <CreditsWidget />
        </div>

        {/* User row */}
        <div className="border-t border-[var(--color-border-subtle)] p-4">
          <div className="mb-3 flex items-center gap-3 rounded-[var(--radius-sm)] bg-[var(--color-bg-elevated)] px-3 py-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)]/10 text-xs font-bold text-[var(--color-accent)]">
              {user.email?.charAt(0).toUpperCase() ?? "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-[var(--color-text-primary)]">
                {user.email ?? "User"}
              </p>
              <p className="text-[10px] text-[var(--color-text-tertiary)]">Free Beta</p>
            </div>
          </div>
          <SignOutButton />
        </div>

      </aside>

      {/* Mobile header + main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header — visible only on small screens */}
        <header className="lg:hidden border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-4 py-3 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5 transition-colors hover:bg-white/[0.02]">
            <Image src="/logo-icon.svg" alt="" width={32} height={18} className="block shrink-0" />
            <span className="text-lg font-normal tracking-tight text-[var(--color-text-primary)]">
              NearSited
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)]/10 text-xs font-bold text-[var(--color-accent)]">
              {user.email?.charAt(0).toUpperCase() ?? "U"}
            </div>
            <SignOutButton compact={true} />
          </div>
        </header>

        {/* Main content area — pb-16 on mobile reserves space for the bottom nav */}
        <main id="main-content" className="flex-1 overflow-auto bg-[var(--color-bg-page)] pb-16 lg:pb-0">{children}</main>
      </div>

      <MobileBottomNav />
    </div>
  );
}
