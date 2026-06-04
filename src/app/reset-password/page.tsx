"use client";

import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Loader2 } from "lucide-react";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setDone(true);
    setTimeout(() => router.push("/dashboard"), 2000);
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-[var(--bg-base)] px-4"
    >
      <div
        className="w-full max-w-sm space-y-6 rounded-[20px] border px-8 py-10 shadow-[var(--brand-shadow-lg)]"
        style={{
          borderColor: "rgba(255,255,255,0.08)",
          background: "rgba(18,23,30,0.95)",
        }}
      >
        {/* Logo */}
        <div className="flex justify-center">
          <Image src="/logo-icon.svg" alt="" width={44} height={25} className="block" />
        </div>

        {done ? (
          <div className="text-center space-y-2">
            <h1 className="text-xl font-medium text-[var(--text-primary)]">Password updated</h1>
            <p className="text-sm text-[var(--text-secondary)]">Redirecting you to the dashboard…</p>
          </div>
        ) : (
          <>
            <div className="text-center">
              <h1 className="text-xl font-medium text-[var(--text-primary)]">Set new password</h1>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">Choose a new password for your account.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-[var(--text-tertiary)]">
                  New password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    autoFocus
                    className="h-[52px] w-full rounded-lg border bg-[var(--bg-elevated)] pl-10 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none transition-colors focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-tint)]"
                    style={{ borderColor: "rgba(255,255,255,0.08)" }}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirm" className="mb-1.5 block text-xs font-medium text-[var(--text-tertiary)]">
                  Confirm password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
                  <input
                    id="confirm"
                    type="password"
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="h-[52px] w-full rounded-lg border bg-[var(--bg-elevated)] pl-10 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none transition-colors focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-tint)]"
                    style={{ borderColor: "rgba(255,255,255,0.08)" }}
                  />
                </div>
              </div>

              {error && (
                <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex h-[52px] w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 text-sm font-semibold text-white transition-all hover:bg-[var(--accent-hover)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? "Updating…" : "Update password"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
