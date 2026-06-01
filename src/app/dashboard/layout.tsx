import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SignOutButton from "./sign-out-button";
import SidebarNav from "./sidebar-nav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen bg-[var(--bg-base)]">
      <aside className="flex w-60 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--bg-surface-2)]">

        {/* Brand — clicking logo goes to landing page */}
        <Link href="/" className="flex h-16 items-center gap-2.5 border-b border-[var(--border)] px-5 transition-colors hover:bg-white/[0.02]" style={{ fontFamily: 'Switzer, Geist, sans-serif' }}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--accent)]/25 bg-[var(--bg-elevated)]">
            <img src="/logo-icon.svg" alt="" width={22} height={13} className="block" />
          </div>
          <span className="text-xl font-normal tracking-tight text-[var(--text-primary)]">
            nearsited
          </span>
        </Link>

        {/* Nav — client component for active state */}
        <SidebarNav />

        {/* Credits widget — TODO: replace hardcoded values with real data */}
        <div className="border-t border-[var(--border)] px-4 py-3">
          <div className="rounded-xl border border-[var(--accent)]/20 bg-[var(--accent-tint)] px-3 py-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--accent)]">Credits</span>
              <span className={`text-xs ${100 <= 20 ? "text-[var(--score-high)] font-semibold" : "text-[var(--text-tertiary)]"}`}>100 / 100</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full transition-all duration-500 ${100 <= 20 ? "bg-[var(--score-high)]" : "bg-[var(--accent)]"}`}
                style={{ width: `${(100 / 100) * 100}%` }}
              />
            </div>
            <p className="mt-1 text-[10px] text-[var(--text-tertiary)]">
              {100 <= 0 ? "Out of credits — discover and analysis paused" : "Resets in 30 days"}
            </p>
          </div>
          <button
            className="mt-2 w-full cursor-not-allowed rounded-lg border border-dashed border-[var(--border)] py-1.5 text-[11px] font-medium text-[var(--text-tertiary)] transition-colors duration-150"
            disabled
            title="Payment integration coming soon"
          >
            Buy More Credits
          </button>
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
              <p className="text-[10px] text-[var(--text-tertiary)]">Free Plan</p>
            </div>
          </div>
          <SignOutButton />
        </div>

      </aside>
      <main className="flex-1 overflow-auto bg-[var(--bg-base)]">{children}</main>
    </div>
  );
}
