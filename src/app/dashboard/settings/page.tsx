"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { User, CreditCard, Key, Trash2, Loader2, Bell, Shield, Download, AlertTriangle } from "lucide-react";
import SignOutButton from "../sign-out-button";
import { FadeUp, StaggerContainer } from "@/lib/motion";
import { useReducedMotion } from "@/lib/motion";
import { Toast } from "@/components/ui/Toast";

type UserData = {
  email: string | null;
  full_name: string | null;
  created_at: string | null;
};

type SubData = {
  tier: "free" | "starter" | "agency";
  audits_used: number;
  audits_limit: number;
  searches_used: number;
  searches_limit: number;
};

const TIER_LABELS: Record<string, string> = { free: "Free", starter: "Starter", agency: "Agency" };
const TIER_COLORS: Record<string, string> = {
  free:    "border-[var(--accent)]/30 bg-[var(--accent-tint)] text-[var(--accent)]",
  starter: "border-blue-500/30 bg-blue-500/10 text-blue-400",
  agency:  "border-purple-500/30 bg-purple-500/10 text-purple-400",
};

/** Benefits copy — kept in sync with landing page Pricing.tsx PLANS array */
const PLAN_BENEFITS: Record<string, string> = {
  starter: "50 analyses/mo · 3 city searches/mo · email pitches · pipeline tracking",
  agency: "200 analyses/mo · 10 city searches/mo · WhatsApp pitches · white-label reports · priority support",
};

type ClearScope = "leads" | "pipeline" | "pitches" | "saved_searches";

const SCOPE_LABELS: Record<ClearScope, string> = {
  leads: "Clear leads",
  pipeline: "Clear pipeline",
  pitches: "Clear pitches",
  saved_searches: "Clear searches",
};

const SCOPE_DESCRIPTIONS: Record<ClearScope, string> = {
  leads: "Permanently deletes all discovered businesses and their audits, analyses, and pitches.",
  pipeline: "Removes all pipeline status entries. Your discovered leads remain.",
  pitches: "Deletes all generated pitch content.",
  saved_searches: "Removes all saved search configurations.",
};

const SECTION_ICON_BASE = "rounded-lg p-2";

// ── Confirmation Modal ─────────────────────────────────────────────────────

function ConfirmModal({
  open,
  title,
  description,
  destructive,
  requireType,
  confirmLabel,
  loading,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  destructive?: boolean;
  requireType?: string;
  confirmLabel: string;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [typed, setTyped] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const onCancelRef = useRef(onCancel);
  // Keep ref current after every render (no stale closure, no render-phase mutation)
  useEffect(() => { onCancelRef.current = onCancel; });

  // Focus trap — auto-focuses first element, traps Tab, closes on Escape
  useEffect(() => {
    if (!open || !containerRef.current) return;
    const trigger = document.activeElement as HTMLElement | null;
    const container = containerRef.current;
    const focusable = container.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first?.focus();

    const trap = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onCancelRef.current(); return; }
      if (e.key !== "Tab") return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first?.focus();
      }
    };
    document.addEventListener("keydown", trap);
    return () => {
      document.removeEventListener("keydown", trap);
      trigger?.focus();
    };
  }, [open]);

  if (!open) return null;

  const canConfirm = requireType ? typed === requireType : true;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        className="mx-4 w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-2xl"
      >
        <div className="mb-4 flex items-center gap-3">
          {destructive && <AlertTriangle className="h-5 w-5 text-red-400" />}
          <h3 id="confirm-modal-title" className="text-lg font-semibold text-[var(--text-primary)]">{title}</h3>
        </div>
        <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{description}</p>
        {requireType && (
          <div className="mt-4">
            <p className="mb-1.5 text-xs text-[var(--text-tertiary)]">
              Type <span className="font-mono font-medium text-[var(--text-primary)]">{requireType}</span> to confirm:
            </p>
            <input
              type="text"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoFocus
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition-colors focus:border-red-400"
              placeholder={requireType}
            />
          </div>
        )}
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!canConfirm || loading}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer ${
              destructive
                ? "bg-red-500/80 hover:bg-red-500"
                : "bg-[var(--accent)] hover:bg-[var(--accent-hover)]"
            }`}
          >
            {loading && <Loader2 className="h-3 w-3 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Simple toggle switch ────────────────────────────────────────────────────

function Toggle({ checked, onChange, label, disabled }: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between ${disabled ? "opacity-50" : ""}`}>
      <span className="text-sm text-[var(--text-secondary)]">{label}</span>
      <button
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
          checked ? "bg-[var(--accent)]" : "bg-[var(--bg-elevated)]"
        } ${disabled ? "cursor-not-allowed" : ""}`}
        role="switch"
        aria-checked={checked}
        aria-label={label}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

// ── Settings Page ───────────────────────────────────────────────────────────

export default function SettingsPage() {
  const supabase = createClient();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sub, setSub] = useState<SubData | null>(null);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const shouldReduce = useReducedMotion();

  // ── Profile state ───────────────────────────────────────────────────────
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [nameMsg, setNameMsg] = useState<string | null>(null);

  // ── Danger Zone state ───────────────────────────────────────────────────
  const [confirming, setConfirming] = useState<ClearScope | null>(null);
  const [clearing, setClearing] = useState(false);
  const [clearMsg, setClearMsg] = useState<string | null>(null);
  const [clearCounts, setClearCounts] = useState<Record<ClearScope, number> | null>(null);

  // ── Change email / password state ───────────────────────────────────────
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailMsg, setEmailMsg] = useState<string | null>(null);

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null);

  // ── Notifications state ─────────────────────────────────────────────────
  const [notifPrefs, setNotifPrefs] = useState({
    audit_complete: true,
    pitch_generated: true,
    low_credits: true,
    weekly_digest: true,
  });

  // ── Account deletion state ──────────────────────────────────────────────
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState<string | null>(null);

  // ── Settings toast ──────────────────────────────────────────────────────
  const [settingsToast, setSettingsToast] = useState<string | null>(null);
  const showSettingsToast = useCallback((msg: string) => {
    setSettingsToast(msg);
    setTimeout(() => setSettingsToast(null), 3000);
  }, []);

  // ── Fetch counts for danger zone ─────────────────────────────────────────
  const fetchClearCounts = useCallback(async () => {
    const admin = createClient();
    const { data: { user: authUser } } = await admin.auth.getUser();
    if (!authUser) return;
    const [biz, pipe, pitch, saved] = await Promise.all([
      admin.from("businesses").select("id", { count: "exact", head: true }).eq("user_id", authUser.id),
      admin.from("pipeline").select("id", { count: "exact", head: true }).eq("user_id", authUser.id),
      admin.from("pitches").select("id", { count: "exact", head: true }).eq("user_id", authUser.id),
      admin.from("territories").select("id", { count: "exact", head: true }).eq("user_id", authUser.id),
    ]);
    setClearCounts({
      leads: biz.count ?? 0,
      pipeline: pipe.count ?? 0,
      pitches: pitch.count ?? 0,
      saved_searches: saved.count ?? 0,
    });
  }, []);

  // ── Load data ───────────────────────────────────────────────────────────
  useEffect(() => {
    async function fetchData() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { setLoading(false); return; }
      const [{ data: profile }, { data: subRow }] = await Promise.all([
        supabase.from("profiles").select("email, full_name, created_at, notification_prefs").eq("id", authUser.id).single(),
        supabase.from("subscriptions").select("tier, audits_used, audits_limit, searches_used, searches_limit").eq("user_id", authUser.id).maybeSingle(),
      ]);
      setUser((profile as UserData) ?? { email: authUser.email ?? null, full_name: null, created_at: null });
      const resolvedSub = (subRow as SubData) ?? { tier: "free", audits_used: 0, audits_limit: 20, searches_used: 0, searches_limit: 3 };
      setSub(resolvedSub);

      // Load notification prefs
      if (profile?.notification_prefs) {
        const prefs = profile.notification_prefs as Record<string, boolean>;
        setNotifPrefs({
          audit_complete: prefs.audit_complete ?? true,
          pitch_generated: prefs.pitch_generated ?? true,
          low_credits: prefs.low_credits ?? true,
          weekly_digest: prefs.weekly_digest ?? true,
        });
      }

      // Fetch item counts for danger zone — non-blocking
      fetchClearCounts();

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
        window.history.replaceState({}, "", window.location.pathname);
        reconcileSubscription();
      }
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  // ── Upgrade helpers ─────────────────────────────────────────────────────
  async function reconcileSubscription() {
    setSyncing(true);
    try {
      const res = await fetch("/api/check-subscription");
      const json = await res.json();
      if (json.synced && json.reason === "reconciled") {
        setSub({ tier: json.tier, audits_used: json.audits_used, audits_limit: json.audits_limit, searches_used: json.searches_used, searches_limit: json.searches_limit });
        setSyncMsg(`Upgrade confirmed! You're now on the ${json.tier === "starter" ? "Starter" : "Agency"} plan.`);
        setTimeout(() => setSyncMsg(null), 6000);
      } else if (json.synced && json.reason === "already_in_sync") {
        setSyncMsg(null);
      } else if (!json.synced && json.reason === "dodo_api_error") {
        setSyncMsg("Could not verify subscription status. If the problem persists, contact support.");
        setTimeout(() => setSyncMsg(null), 8000);
      }
    } catch {
      // Silent fail
    } finally {
      setSyncing(false);
    }
  }

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

  // ── Danger Zone ─────────────────────────────────────────────────────────
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
    // Refresh counts
    fetchClearCounts();
    setTimeout(() => setClearMsg(null), 3500);
  }

  // ── Email change ────────────────────────────────────────────────────────
  async function handleChangeEmail() {
    if (!newEmail.trim() || emailLoading) return;
    setEmailLoading(true);
    setEmailMsg(null);
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
    setEmailLoading(false);
    if (error) {
      setEmailMsg(`Error: ${error.message}`);
    } else {
      setEmailMsg("Confirmation link sent to your new email address.");
      setNewEmail("");
      setTimeout(() => { setEmailMsg(null); setShowEmailForm(false); }, 4000);
    }
  }

  // ── Password change ─────────────────────────────────────────────────────
  async function handleChangePassword() {
    if (!currentPassword || !newPassword || !confirmPassword || passwordLoading) return;
    if (newPassword !== confirmPassword) {
      setPasswordMsg("New passwords don't match.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg("Password must be at least 6 characters.");
      return;
    }
    setPasswordLoading(true);
    setPasswordMsg(null);

    // Re-authenticate with current password first
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user?.email ?? "",
      password: currentPassword,
    });

    if (signInError) {
      setPasswordLoading(false);
      setPasswordMsg("Current password is incorrect.");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordLoading(false);
    if (error) {
      setPasswordMsg(`Error: ${error.message}`);
    } else {
      setPasswordMsg("Password updated successfully.");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      setTimeout(() => { setPasswordMsg(null); setShowPasswordForm(false); }, 3000);
    }
  }

  // ── Notification toggle ─────────────────────────────────────────────────
  async function toggleNotif(key: string, value: boolean) {
    const updated = { ...notifPrefs, [key]: value };
    setNotifPrefs(updated);
    try {
      await fetch("/api/settings/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });
      showSettingsToast("Preference saved");
    } catch {
      setNotifPrefs((prev) => ({ ...prev, [key]: !value }));
      showSettingsToast("Failed to save preference");
    }
  }

  // ── Account deletion ────────────────────────────────────────────────────
  async function handleDeleteAccount() {
    setDeletingAccount(true);
    try {
      const res = await fetch("/api/account/delete", { method: "POST" });
      const json = await res.json();
      if (res.ok) {
        await supabase.auth.signOut();
        window.location.href = "/login";
      } else {
        setDeleteMsg(json.error ?? "Failed to delete account.");
        setTimeout(() => setDeleteMsg(null), 6000);
      }
    } catch {
      setDeleteMsg("Network error. Please try again.");
      setTimeout(() => setDeleteMsg(null), 6000);
    } finally {
      setDeletingAccount(false);
      setConfirmDelete(false);
    }
  }

  // ── Loading state ───────────────────────────────────────────────────────
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
      <div className="mb-8">
        <h1 className="text-3xl font-normal tracking-tight text-[var(--text-primary)]">Your <em className="italic text-[var(--accent)]">workspace.</em></h1>
      </div>

      <StaggerContainer>
        {/* ── Profile ─────────────────────────────────────────────────── */}
        <FadeUp>
          <div className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className={`${SECTION_ICON_BASE} bg-[var(--accent-tint)]`}>
                <User className="h-5 w-5 text-[var(--accent)]" />
              </div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Profile</h2>
            </div>
            <div className="space-y-3">

              {/* Email (read-only with change option) */}
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
                <span className="text-sm text-[var(--text-secondary)]">Email</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[var(--text-primary)]">{user?.email ?? "—"}</span>
                  <button
                    onClick={() => setShowEmailForm(!showEmailForm)}
                    className="rounded-lg border border-[var(--border)] px-2 py-1 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--accent)]/40 hover:text-[var(--accent)] cursor-pointer"
                  >
                    Change
                  </button>
                </div>
              </div>
              {showEmailForm && (
                <div className="rounded-lg bg-[var(--bg-elevated)] p-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="New email address"
                      className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-sm text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--accent)]"
                      disabled={emailLoading}
                    />
                    <button
                      onClick={handleChangeEmail}
                      disabled={emailLoading || !newEmail.trim()}
                      className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-[var(--accent)] px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-50"
                    >
                      {emailLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Send confirmation"}
                    </button>
                  </div>
                  {emailMsg && (
                    <p className={`mt-2 text-xs ${emailMsg.includes("Error") ? "text-red-400" : "text-[var(--score-good)]"}`}>
                      {emailMsg}
                    </p>
                  )}
                </div>
              )}

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

              {/* Change password */}
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
                <span className="text-sm text-[var(--text-secondary)]">Password</span>
                <button
                  onClick={() => setShowPasswordForm(!showPasswordForm)}
                  className="rounded-lg border border-[var(--border)] px-2 py-1 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--accent)]/40 hover:text-[var(--accent)] cursor-pointer"
                >
                  Change
                </button>
              </div>
              {showPasswordForm && (
                <div className="rounded-lg bg-[var(--bg-elevated)] p-3 space-y-2">
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Current password"
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-sm text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--accent)]"
                    disabled={passwordLoading}
                  />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password"
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-sm text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--accent)]"
                    disabled={passwordLoading}
                  />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-sm text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--accent)]"
                    disabled={passwordLoading}
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleChangePassword}
                      disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}
                      className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-[var(--accent)] px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-50"
                    >
                      {passwordLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Update password"}
                    </button>
                  </div>
                  {passwordMsg && (
                    <p className={`text-xs ${passwordMsg === "Password updated successfully." ? "text-[var(--score-good)]" : "text-red-400"}`}>
                      {passwordMsg}
                    </p>
                  )}
                </div>
              )}

              {/* Two-factor auth (stub) — dimmed because it's not yet available */}
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-2 opacity-50" aria-hidden="true">
                <div>
                  <span className="text-sm text-[var(--text-secondary)]">Two-factor authentication</span>
                  <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">Add an extra layer of security to your account</p>
                </div>
                <span className="rounded-md border border-[var(--border)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                  Coming soon
                </span>
              </div>

              {/* Member since */}
              {user?.created_at && (
                <div className="flex justify-between pb-2">
                  <span className="text-sm text-[var(--text-secondary)]">Member since</span>
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    {new Date(user.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </FadeUp>

        {/* ── Plan ─────────────────────────────────────────────────────── */}
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

            {syncMsg && (
              <div className="mb-4 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-xs text-green-400">
                {syncMsg}
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">{TIER_LABELS[sub?.tier ?? "free"]} Plan</p>
                <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                  {sub?.tier === "free"
                    ? `${sub?.audits_used ?? 0} / ${sub?.audits_limit ?? 20} free credits used`
                    : `${sub?.audits_used ?? 0} / ${sub?.audits_limit ?? 0} credits used this month`
                  }
                </p>
              </div>
              <span className={`rounded-full border px-3 py-1 text-xs font-medium ${TIER_COLORS[sub?.tier ?? "free"]}`}>
                {TIER_LABELS[sub?.tier ?? "free"]}
              </span>
            </div>

            {/* Usage bar */}
            {(sub?.audits_limit ?? 0) > 0 && (
              <div className="mt-3 h-1.5 w-full rounded-full bg-[var(--bg-elevated)]">
                <div
                  className="h-1.5 rounded-full bg-[var(--accent)] transition-all"
                  style={{ width: `${Math.min(100, ((sub?.audits_used ?? 0) / (sub?.audits_limit ?? 1)) * 100)}%` }}
                />
              </div>
            )}

            {(!sub || sub.tier === "free") && (
              <div className="mt-4 space-y-3">
                <div className="flex flex-wrap gap-2">
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
                {/* Benefits list — kept in sync with landing page Pricing.tsx */}
                <div className="space-y-1.5">
                  <p className="text-[11px] text-[var(--text-tertiary)] leading-relaxed">
                    <span className="font-medium text-[var(--text-secondary)]">Starter:</span> {PLAN_BENEFITS.starter}
                  </p>
                  <p className="text-[11px] text-[var(--text-tertiary)] leading-relaxed">
                    <span className="font-medium text-[var(--text-secondary)]">Agency:</span> {PLAN_BENEFITS.agency}
                  </p>
                </div>
              </div>
            )}
          </div>
        </FadeUp>

        {/* ── Notifications ─────────────────────────────────────────────── */}
        <FadeUp>
          <div className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className={`${SECTION_ICON_BASE} bg-[var(--accent-tint)]`}>
                <Bell className="h-5 w-5 text-[var(--accent)]" />
              </div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Notifications</h2>
            </div>
            <div className="space-y-3">
              <Toggle
                checked={notifPrefs.audit_complete}
                onChange={(v) => toggleNotif("audit_complete", v)}
                label="Email me when an audit completes"
              />
              <Toggle
                checked={notifPrefs.pitch_generated}
                onChange={(v) => toggleNotif("pitch_generated", v)}
                label="Email me when a pitch is generated"
              />
              <Toggle
                checked={notifPrefs.low_credits}
                onChange={(v) => toggleNotif("low_credits", v)}
                label="Email me when I have fewer than 5 credits remaining"
              />
              <Toggle
                checked={notifPrefs.weekly_digest}
                onChange={(v) => toggleNotif("weekly_digest", v)}
                label="Weekly digest of pipeline activity"
              />
            </div>
          </div>
        </FadeUp>

        {/* ── Integrations ──────────────────────────────────────────────── */}
        <FadeUp>
          <div className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className={`${SECTION_ICON_BASE} bg-[var(--score-mid-tint)]`}>
                <Key className="h-5 w-5 text-[var(--score-mid)]" />
              </div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Integrations</h2>
            </div>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Nearsited connects to Google APIs (Places & PageSpeed), Gemini AI, ScreenshotCore, and Supabase. These integrations are managed by the platform and require no configuration from you.
            </p>
            <p className="mt-3 text-xs text-[var(--text-tertiary)]">
              If you experience issues with discovery, audits, or pitch generation, contact{" "}
              <a href="mailto:nearsitedlabs@gmail.com" className="text-[var(--accent)] hover:underline">nearsitedlabs@gmail.com</a>.
            </p>
          </div>
        </FadeUp>

        {/* ── Danger Zone ──────────────────────────────────────────────── */}
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
              {(["leads", "pipeline", "pitches", "saved_searches"] as ClearScope[]).map((scope) => {
                const isConfirming = confirming === scope;
                const isDimmed = confirming !== null && !isConfirming;

                return (
                  <div
                    key={scope}
                    className={`rounded-lg p-3 transition-opacity ${isDimmed ? "opacity-40 pointer-events-none" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-[var(--text-primary)]">{SCOPE_LABELS[scope]}</p>
                        <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{SCOPE_DESCRIPTIONS[scope]}</p>
                      </div>
                      {!isConfirming && (
                        <button
                          onClick={() => setConfirming(scope)}
                          className="shrink-0 rounded-md border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:border-red-500/60 hover:bg-red-500/10 cursor-pointer"
                        >
                          {SCOPE_LABELS[scope]}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </FadeUp>

        {/* ── Confirmation modals (rendered outside card for z-index) ───── */}
        {(["leads", "pipeline", "pitches", "saved_searches"] as ClearScope[]).map((scope) => {
          const count = clearCounts?.[scope] ?? 0;
          const isLeads = scope === "leads";
          const itemLabel = scope === "leads"
            ? "businesses"
            : scope === "saved_searches" ? "saved searches" : scope;

          const detailDescriptions: Record<ClearScope, string> = {
            leads: `This permanently deletes ${count} ${itemLabel} and their audits, pitches, and analyses. This cannot be undone.`,
            pipeline: `This permanently deletes ${count} pipeline entries. Your discovered leads remain. This cannot be undone.`,
            pitches: `This permanently deletes ${count} pitch records. This cannot be undone.`,
            saved_searches: `This permanently deletes ${count} saved search configurations. This cannot be undone.`,
          };

          return (
            <ConfirmModal
              key={scope}
              open={confirming === scope}
              title={SCOPE_LABELS[scope]}
              description={detailDescriptions[scope]}
              destructive
              requireType={isLeads ? "clear all leads" : undefined}
              confirmLabel={SCOPE_LABELS[scope]}
              loading={clearing}
              onConfirm={() => handleClear(scope)}
              onCancel={() => setConfirming(null)}
            />
          );
        })}

        {/* ── Data & Privacy ──────────────────────────────────────────── */}
        <FadeUp>
          <div className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className={`${SECTION_ICON_BASE} bg-[var(--score-mid-tint)]`}>
                <Shield className="h-5 w-5 text-[var(--score-mid)]" />
              </div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Data & Privacy</h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-[var(--border)] p-3">
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">Download my data</p>
                  <p className="text-xs text-[var(--text-tertiary)] mt-0.5">Export all your data as JSON (GDPR request)</p>
                </div>
                <a
                  href="/api/export/user-data"
                  download
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--accent)]/40 hover:text-[var(--accent)]"
                >
                  <Download className="h-3.5 w-3.5" />
                  Export
                </a>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-red-500/20 p-3">
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">Delete my account</p>
                  <p className="text-xs text-[var(--text-tertiary)] mt-0.5">Permanently removes your account and all associated data</p>
                </div>
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:border-red-500/60 hover:bg-red-500/10"
                >
                  Delete
                </button>
              </div>
              {deleteMsg && (
                <p className="text-xs text-red-400">{deleteMsg}</p>
              )}
            </div>
          </div>
        </FadeUp>
      </StaggerContainer>

      {/* ── Sign out link (minimal — sidebar already has sign out) ────── */}
      <div className="mt-8 text-center">
        <SignOutButton />
      </div>

      {/* ── Account deletion confirm modal ──────────────────────────────── */}
      <ConfirmModal
        open={confirmDelete}
        title="Delete my account"
        description="This permanently deletes your account, all discovered businesses, audits, pitches, pipeline data, and saved searches. This cannot be undone."
        destructive
        requireType="delete my account"
        confirmLabel="Delete my account"
        loading={deletingAccount}
        onConfirm={handleDeleteAccount}
        onCancel={() => { setConfirmDelete(false); setDeleteMsg(null); }}
      />
    </>
  );

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-2xl px-6 py-8">
        {shouldReduce ? pageContent : <FadeUp>{pageContent}</FadeUp>}
      </div>
      {settingsToast && <Toast message={settingsToast} onClose={() => setSettingsToast(null)} />}
    </div>
  );
}
