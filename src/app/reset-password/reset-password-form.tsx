"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import AuthCard from "@/components/auth/AuthCard";

const inputBase =
  "h-[44px] w-full rounded-[var(--radius-sm)] border bg-[var(--color-bg-elevated)] px-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] outline-none transition-colors focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--accent-tint)] disabled:opacity-50";

export function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirm?: string }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [checking, setChecking] = useState(true);
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    async function initSession() {
      const code = searchParams.get("code");
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) { router.replace("/login?error=reset_session_expired"); return; }
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login?error=reset_session_expired"); }
      else { setChecking(false); }
    }
    initSession();
  }, [supabase, router, searchParams]);

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setError(null);
    const errs: typeof fieldErrors = {};
    if (password.length < 8) errs.password = "Password must be at least 8 characters.";
    if (!confirm) errs.confirm = "Please confirm your password.";
    else if (password !== confirm) errs.confirm = "Passwords don't match.";
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }
    setFieldErrors({});
    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) { setError(updateError.message); return; }
    setDone(true);
    setTimeout(() => router.push("/dashboard"), 2000);
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg-page)]">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--color-accent)]" />
      </div>
    );
  }

  if (done) {
    return (
      <AuthCard title="Password updated." subtitle="Redirecting you to the dashboard…">
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-[var(--color-accent)]" />
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Set a new password."
      subtitle="Pick something memorable."
      error={error}
      onDismissError={() => setError(null)}
      footerLink={
        <a href="/login" className="font-medium text-[var(--color-accent)] hover:underline">
          Back to sign in
        </a>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* New password */}
        <div>
          <label htmlFor="rp-password" className="mb-1.5 block text-xs font-medium text-[var(--color-text-tertiary)]">
            New password
          </label>
          <div className="relative">
            <input
              id="rp-password"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: undefined })); }}
              placeholder="Min. 8 characters"
              autoComplete="new-password"
              autoFocus
              className={`${inputBase} pr-10 ${fieldErrors.password ? "border-[var(--color-danger)]/60" : "border-[var(--color-border-subtle)]"}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {fieldErrors.password && <p className="mt-1 text-xs text-[var(--color-danger)]">{fieldErrors.password}</p>}
        </div>

        {/* Confirm password */}
        <div>
          <label htmlFor="rp-confirm" className="mb-1.5 block text-xs font-medium text-[var(--color-text-tertiary)]">
            Confirm password
          </label>
          <div className="relative">
            <input
              id="rp-confirm"
              type={showConfirm ? "text" : "password"}
              required
              value={confirm}
              onChange={(e) => { setConfirm(e.target.value); setFieldErrors((p) => ({ ...p, confirm: undefined })); }}
              placeholder="••••••••"
              autoComplete="new-password"
              className={`${inputBase} pr-10 ${fieldErrors.confirm ? "border-[var(--color-danger)]/60" : "border-[var(--color-border-subtle)]"}`}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              aria-label={showConfirm ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors"
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {fieldErrors.confirm && <p className="mt-1 text-xs text-[var(--color-danger)]">{fieldErrors.confirm}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex h-[44px] w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-accent)] px-4 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Updating…" : "Update password"}
        </button>
      </form>
    </AuthCard>
  );
}
