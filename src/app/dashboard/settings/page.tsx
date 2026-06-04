"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { ArrowLeft, User, CreditCard, Key, Trash2, Loader2 } from "lucide-react";
import SignOutButton from "../sign-out-button";

type UserData = {
  email: string | null;
  full_name: string | null;
  created_at: string | null;
};

type ClearScope = "leads" | "pipeline" | "pitches" | "saved_searches";

const DANGER_ACTIONS: { scope: ClearScope; label: string; description: string }[] = [
  { scope: "leads",          label: "Clear all leads",      description: "Permanently deletes all discovered businesses and their audits, analyses, and pitches." },
  { scope: "pipeline",       label: "Clear pipeline",       description: "Removes all pipeline status entries. Your discovered leads remain." },
  { scope: "pitches",        label: "Clear pitches",        description: "Deletes all generated pitch content." },
  { scope: "saved_searches", label: "Clear saved searches", description: "Removes all saved search configurations." },
];

const SECTION_ICON_BASE = "rounded-lg p-2";

export default function SettingsPage() {
  const supabase = createClient();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState<ClearScope | null>(null);
  const [clearing, setClearing] = useState(false);
  const [clearMsg, setClearMsg] = useState<string | null>(null);

  async function handleClear(scope: ClearScope) {
    setClearing(true);
    const res = await fetch("/api/data/clear", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scope }),
    });
    const json = await res.json();
    setClearing(false);
    setConfirming(null);
    setClearMsg(
      res.ok
        ? `Done — ${json.deleted} record${json.deleted !== 1 ? "s" : ""} deleted.`
        : `Error: ${json.error ?? "Unknown error"}`
    );
    setTimeout(() => setClearMsg(null), 3500);
  }

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

        {/* Danger Zone */}
        <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/5 p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-lg p-2 bg-red-500/10">
              <Trash2 className="h-5 w-5 text-red-400" />
            </div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Danger Zone</h2>
          </div>

          {clearMsg && (
            <p className={`mb-4 rounded-lg px-3 py-2 text-xs ${clearMsg.startsWith("Error") ? "border border-red-500/30 bg-red-500/10 text-red-400" : "border border-green-500/30 bg-green-500/10 text-green-400"}`}>
              {clearMsg}
            </p>
          )}

          <div className="space-y-1">
            {DANGER_ACTIONS.map(({ scope, label, description }) => {
              const isConfirming = confirming === scope;
              const isDimmed = confirming !== null && !isConfirming;
              return (
                <div
                  key={scope}
                  className={`rounded-lg p-3 transition-opacity ${isDimmed ? "opacity-40 pointer-events-none" : ""}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">{label}</p>
                      <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{description}</p>
                    </div>
                    {!isConfirming && (
                      <button
                        onClick={() => setConfirming(scope)}
                        className="shrink-0 rounded-md border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:border-red-500/60 hover:bg-red-500/10 cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  {isConfirming && (
                    <div className="mt-3 flex items-center gap-3">
                      <p className="text-xs text-red-400 flex-1">This cannot be undone.</p>
                      <button
                        onClick={() => setConfirming(null)}
                        disabled={clearing}
                        className="rounded-md border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] cursor-pointer disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleClear(scope)}
                        disabled={clearing}
                        className="flex items-center gap-1.5 rounded-md bg-red-500/20 border border-red-500/40 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/30 cursor-pointer disabled:opacity-50"
                      >
                        {clearing && <Loader2 className="h-3 w-3 animate-spin" />}
                        Yes, delete
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
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
