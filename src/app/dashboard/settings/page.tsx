"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { ArrowLeft, User, CreditCard, Key, Trash2, Loader2 } from "lucide-react";
import SignOutButton from "../sign-out-button";
import { FadeUp, StaggerContainer } from "@/lib/motion";
import { useReducedMotion } from "framer-motion";

type UserData = {
  email: string | null;
  full_name: string | null;
  created_at: string | null;
};

type SubData = {
  tier: "free" | "starter" | "agency";
  audits_used: number;
  audits_limit: number;
};

const TIER_LABELS: Record<string, string> = { free: "Free", starter: "Starter", agency: "Agency" };
const TIER_COLORS: Record<string, string> = {
  free:    "border-[var(--accent)]/30 bg-[var(--accent-tint)] text-[var(--accent)]",
  starter: "border-blue-500/30 bg-blue-500/10 text-blue-400",
  agency:  "border-purple-500/30 bg-purple-500/10 text-purple-400",
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
  const [sub, setSub] = useState<SubData | null>(null);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<ClearScope | null>(null);
  const [clearing, setClearing] = useState(false);
  const [clearMsg, setClearMsg] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [nameMsg, setNameMsg] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const shouldReduce = useReducedMotion();

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

  // Reconcile subscription with Dodo (webhook fallback)
  async function reconcileSubscription() {
    setSyncing(true);
    try {
      const res = await fetch("/api/check-subscription");
      const json = await res.json();
      if (json.synced && json.reason === "reconciled") {
        // Subscription was updated — refresh local state
        setSub({ tier: json.tier, audits_used: json.audits_used, audits_limit: json.audits_limit });
        setSyncMsg(`Upgrade confirmed! You're now on the ${json.tier === "starter" ? "Starter" : "Agency"} plan.`);
        setTimeout(() => setSyncMsg(null), 6000);
      } else if (json.synced && json.reason === "already_in_sync") {
        setSyncMsg(null);
      } else if (!json.synced && json.reason === "dodo_api_error") {
        setSyncMsg("Could not verify subscription status. If the problem persists, contact support.");
        setTimeout(() => setSyncMsg(null), 8000);
      }
    } catch {
      // Silent fail — reconciliation is best-effort
    } finally {
      setSyncing(false);
    }
  }

  useEffect(() => {
    async function fetchData() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { setLoading(false); return; }
      const [{ data: profile }, { data: subRow }] = await Promise.all([
        supabase.from("profiles").select("email, full_name, created_at").eq("id", authUser.id).single(),
        supabase.from("subscriptions").select("tier, audits_used, audits_limit").eq("user_id", authUser.id).maybeSingle(),
      ]);
      setUser((profile as UserData) ?? { email: authUser.email ?? null, full_name: null, created_at: null });
      const resolvedSub = (subRow as SubData) ?? { tier: "free", audits_used: 0, audits_limit: 4 };
      setSub(resolvedSub);
      setLoading(false);

      // Auto-trigger checkout if user arrived here after selecting a plan while logged out
      if (resolvedSub.tier === "free") {
        try {
          const pending = localStorage.getItem("pendingUpgradePlan");
          if (pending) {
            localStorage.removeItem("pendingUpgradePlan");
            handleUpgrade(pending);
          }
        } catch { /* ignore */ }
      }

      // Webhook fallback: if ?upgraded=1 is in the URL, reconcile with Dodo
      if (typeof window !== "undefined" && window.location.search.includes("upgraded=1")) {
        // Clean the URL param so refresh doesn't re-trigger
        window.history.replaceState({}, "", window.location.pathname);
        reconcileSubscription();
      }
    }
    fetchData();
  }, [supabase]);

  async function handleUpgrade(productId: string) {
    setUpgrading(productId);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      const json = await res.json();
      setUpgrading(null);
      if (json.url) {
        window.location.href = json.url;
      } else {
        setSyncMsg(json.error ? `Upgrade failed: ${json.error}` : "Upgrade failed. Please try again or contact support.");
        setTimeout(() => setSyncMsg(null), 6000);
      }
    } catch {
      setUpgrading(null);
      setSyncMsg("Network error. Please check your connection and try again.");
      setTimeout(() => setSyncMsg(null), 6000);
    }
  }

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

  const pageContent = (
    <>
      <Link href="/dashboard" className="mb-6 inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] transition-colors duration-150 hover:text-[var(--text-primary)]">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Link>

      <div className="mb-8">
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Settings</p>
        <h1 className="mt-1 text-3xl font-normal tracking-tight text-[var(--text-primary)]">Your <em className="italic text-[var(--accent)]">workspace.</em></h1>
      </div>

      <StaggerContainer>
        {/* Profile */}
        <FadeUp>
          <div className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className={`${SECTION_ICON_BASE} bg-[var(--accent-tint)]`}>
                <User className="h-5 w-5 text-[var(--accent)]" />
              </div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Profile</h2>
            </div>
            <div className="space-y-3">
              {/* Email (read-only) */}
              <div className="flex justify-between border-b border-[var(--border)] pb-2">
                <span className="text-sm text-[var(--text-secondary)]">Email</span>
                <span className="text-sm font-medium text-[var(--text-primary)]">{user?.email ?? "—"}</span>
              </div>

              {/* Name (editable) */}
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
                <span className="text-sm text-[var(--text-secondary)]">Name</span>
                <div className="flex items-center gap-2">
                  {editingName ? (
                    <>
                      <input
                        type="text"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        className="w-full sm:w-40 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-2.5 py-1.5 text-sm text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--accent)]"
                        placeholder="Your name"
                        autoFocus
                        disabled={savingName}
                      />
                      <button
                        onClick={async () => {
                          if (!nameInput.trim() || savingName) return;
                          setSavingName(true);
                          setNameMsg(null);
                          const { error } = await supabase
                            .from("profiles")
                            .update({ full_name: nameInput.trim() })
                            .eq("id", (await supabase.auth.getUser()).data.user?.id);
                          setSavingName(false);
                          if (error) {
                            setNameMsg("Failed to save — please try again.");
                          } else {
                            setUser((prev) => prev ? { ...prev, full_name: nameInput.trim() } : prev);
                            setEditingName(false);
                            setNameMsg("Name updated.");
                            setTimeout(() => setNameMsg(null), 2500);
                          }
                        }}
                        disabled={savingName || !nameInput.trim()}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-[var(--accent)] px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {savingName ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
                      </button>
                      <button
                        onClick={() => { setEditingName(false); setNameMsg(null); }}
                        disabled={savingName}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="text-sm font-medium text-[var(--text-primary)]">{user?.full_name ?? "—"}</span>
                      <button
                        onClick={() => { setNameInput(user?.full_name ?? ""); setEditingName(true); }}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-[var(--border)] px-2 py-1 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--accent)]/40 hover:text-[var(--accent)]"
                      >
                        Edit
                      </button>
                    </>
                  )}
                </div>
              </div>

              {nameMsg && (
                <p className={`text-xs ${nameMsg === "Name updated." ? "text-[var(--score-good)]" : "text-red-400"}`}>
                  {nameMsg}
                </p>
              )}

              {/* Member since (read-only) */}
              {user?.created_at && (
                <div className="flex justify-between border-b border-[var(--border)] pb-2">
                  <span className="text-sm text-[var(--text-secondary)]">Member since</span>
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    {new Date(user.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </FadeUp>

        {/* Plan */}
        <FadeUp>
          <div className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className={`${SECTION_ICON_BASE} bg-[var(--score-good-tint)]`}>
                <CreditCard className="h-5 w-5 text-[var(--score-good)]" />
              </div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Plan</h2>
              {syncing && (
                <div className="flex items-center gap-1.5 ml-auto">
                  <Loader2 className="h-3 w-3 animate-spin text-[var(--text-tertiary)]" />
                  <span className="text-xs text-[var(--text-tertiary)]">Syncing...</span>
                </div>
              )}
            </div>

            {/* Upgrade success / reconciliation message */}
            {syncMsg && (
              <div className="mb-4 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-xs text-green-400">
                {syncMsg}
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">{TIER_LABELS[sub?.tier ?? "free"]} Plan</p>
                <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                  {sub?.audits_used ?? 0} / {sub?.audits_limit ?? 4} credits used this month
                </p>
              </div>
              <span className={`rounded-full border px-3 py-1 text-xs font-medium ${TIER_COLORS[sub?.tier ?? "free"]}`}>
                {TIER_LABELS[sub?.tier ?? "free"]}
              </span>
            </div>
            {/* Usage bar */}
            <div className="mt-3 h-1.5 w-full rounded-full bg-[var(--bg-elevated)]">
              <div
                className="h-1.5 rounded-full bg-[var(--accent)] transition-all"
                style={{ width: `${Math.min(100, ((sub?.audits_used ?? 0) / (sub?.audits_limit ?? 4)) * 100)}%` }}
              />
            </div>
            {(!sub || sub.tier === "free") && (
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => handleUpgrade("pdt_0NgKrmYBX9pAp9NhbeMqp")}
                  disabled={upgrading !== null}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--border)] px-4 py-2 text-xs font-medium text-[var(--text-secondary)] transition-colors duration-150 hover:border-[var(--accent)]/40 hover:text-[var(--accent)] disabled:opacity-50"
                >
                  {upgrading === "pdt_0NgKrmYBX9pAp9NhbeMqp" ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                  Upgrade to Starter — $19/mo
                </button>
                <button
                  onClick={() => handleUpgrade("pdt_0NgKsF0ROmm9U603GRqMm")}
                  disabled={upgrading !== null}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-medium text-white transition-colors duration-150 hover:bg-[var(--accent-hover)] disabled:opacity-50"
                >
                  {upgrading === "pdt_0NgKsF0ROmm9U603GRqMm" ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                  Upgrade to Agency — $49/mo
                </button>
              </div>
            )}
          </div>
        </FadeUp>

        {/* Integrations */}
        <FadeUp>
          <div className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className={`${SECTION_ICON_BASE} bg-[var(--score-mid-tint)]`}>
                <Key className="h-5 w-5 text-[var(--score-mid)]" />
              </div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Integrations</h2>
            </div>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Nearsited connects to Google APIs (Places & PageSpeed), Gemini AI, ScreenshotOne, and Supabase. These integrations are managed by the platform and require no configuration from you.
            </p>
            <p className="mt-3 text-xs text-[var(--text-tertiary)]">
              If you experience issues with discovery, audits, or pitch generation, contact{" "}
              <a href="mailto:nearsitedlabs@gmail.com" className="text-[var(--accent)] hover:underline">nearsitedlabs@gmail.com</a>.
            </p>
          </div>
        </FadeUp>

        {/* Danger Zone */}
        <FadeUp>
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
        </FadeUp>

        {/* Sign out */}
        <FadeUp>
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[var(--badge-red-text)]/80">Sign out of your Nearsited account</p>
              <SignOutButton />
            </div>
          </div>
        </FadeUp>
      </StaggerContainer>
    </>
  );

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-2xl px-6 py-8">
        {shouldReduce ? pageContent : <FadeUp>{pageContent}</FadeUp>}
      </div>
    </div>
  );
}
