"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { ArrowLeft, User, CreditCard, Key } from "lucide-react";
import SignOutButton from "../sign-out-button";

type UserData = {
  email: string | null;
  full_name: string | null;
  created_at: string | null;
};

const SECTION_ICON_BASE = "rounded-lg p-2";

export default function SettingsPage() {
  const supabase = createClient();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { setLoading(false); return; }
      const { data: profile } = await supabase
        .from("profiles").select("email, full_name, created_at")
        .eq("id", authUser.id).single();
      setUser((profile as UserData) ?? { email: authUser.email ?? null, full_name: null, created_at: null });
      setLoading(false);
    }
    fetchData();
  }, [supabase]);

  if (loading) {
    return (
      <div className="min-h-screen p-6">
        <div className="mx-auto max-w-2xl animate-pulse space-y-4">
          <div className="h-8 w-40 rounded-lg bg-[var(--bg-elevated)]" />
          <div className="h-64 rounded-xl bg-[var(--bg-elevated)]" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-2xl px-6 py-8">
        <Link href="/dashboard" className="mb-6 inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] transition-colors duration-150 hover:text-[var(--text-primary)]">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>

        <div className="mb-8">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Settings</p>
          <h1 className="mt-1 text-3xl font-normal tracking-tight text-[var(--text-primary)]">Your <em className="italic text-[var(--accent)]">workspace.</em></h1>
        </div>

        {/* Profile */}
        <div className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className={`${SECTION_ICON_BASE} bg-[var(--accent-tint)]`}>
              <User className="h-5 w-5 text-[var(--accent)]" />
            </div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Profile</h2>
          </div>
          <div className="space-y-3">
            {[
              { label: "Email",        value: user?.email },
              { label: "Name",         value: user?.full_name },
              { label: "Member since", value: user?.created_at ? new Date(user.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : null },
            ].filter((r) => r.value).map((row) => (
              <div key={row.label} className="flex justify-between border-b border-[var(--border)] pb-2">
                <span className="text-sm text-[var(--text-secondary)]">{row.label}</span>
                <span className="text-sm font-medium text-[var(--text-primary)]">{row.value ?? "—"}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Plan */}
        <div className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className={`${SECTION_ICON_BASE} bg-[var(--score-good-tint)]`}>
              <CreditCard className="h-5 w-5 text-[var(--score-good)]" />
            </div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Plan</h2>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">Free Beta</p>
              <p className="text-xs text-[var(--text-tertiary)]">Full access &middot; Paid plans launching soon</p>
            </div>
            <span className="rounded-full border border-[var(--accent)]/30 bg-[var(--accent-tint)] px-3 py-1 text-xs font-medium text-[var(--accent)]">
              Beta
            </span>
          </div>
          <div className="mt-4">
            <a
              href="/pricing"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-4 py-2 text-xs font-medium text-[var(--text-secondary)] transition-colors duration-150 hover:border-[var(--accent)]/40 hover:text-[var(--accent)]"
            >
              See upcoming plans
            </a>
          </div>
        </div>

        {/* Integrations */}
        <div className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className={`${SECTION_ICON_BASE} bg-[var(--score-mid-tint)]`}>
              <Key className="h-5 w-5 text-[var(--score-mid)]" />
            </div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Integrations</h2>
          </div>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            Nearsited connects to Google APIs (Places &amp; PageSpeed), Gemini AI, ScreenshotOne, and Supabase. These integrations are managed by the platform and require no configuration from you.
          </p>
          <p className="mt-3 text-xs text-[var(--text-tertiary)]">
            If you experience issues with discovery, audits, or pitch generation, contact{" "}
            <a href="mailto:nearsitedlabs@gmail.com" className="text-[var(--accent)] hover:underline">nearsitedlabs@gmail.com</a>.
          </p>
        </div>

        {/* Sign out */}
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--badge-red-text)]/80">Sign out of your Nearsited account</p>
            <SignOutButton />
          </div>
        </div>
      </div>
    </div>
  );
}
