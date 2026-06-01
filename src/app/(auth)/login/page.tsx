"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { Mail, Lock, Loader2 } from "lucide-react";
import AuthCard from "@/components/auth/AuthCard";

const AuthBackground = dynamic(
  () => import("@/components/auth/AuthBackground"),
  { ssr: false }
);

const BrandStoryPanel = dynamic(
  () => import("@/components/auth/BrandStoryPanel"),
  { ssr: false }
);

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const formRef = useRef<HTMLFormElement>(null);

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Read values directly from form to handle browser autofill correctly
    const form = formRef.current;
    const formData = new FormData(form!);
    const actualEmail = formData.get("email") as string;
    const actualPassword = formData.get("password") as string;

    // Also sync state so UI stays consistent
    if (actualEmail !== email) setEmail(actualEmail);
    if (actualPassword !== password) setPassword(actualPassword);

    if (!actualEmail || !actualPassword) {
      setError("Please enter both email and password.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: actualEmail,
      password: actualPassword,
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  async function handleGoogleLogin() {
    setError(null);
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen overflow-hidden">
      <AuthBackground />

      {/* Left — Brand storytelling panel (60%) */}
      <div className="hidden w-[60%] lg:flex">
        {/* Accent gradient overlay at edge */}
        <div className="pointer-events-none absolute left-[60%] top-0 h-full w-px bg-gradient-to-b from-transparent via-[var(--accent)]/15 to-transparent" />
        <BrandStoryPanel />
      </div>

      {/* Right — Auth card (40%) */}
      <div className="flex w-full items-start justify-center pt-[12vh] lg:w-[40%]">
        <AuthCard mode="login" error={error}>
          <form ref={formRef} onSubmit={handleEmailLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label
                htmlFor="login-email"
                className="mb-1.5 block text-xs font-medium text-[var(--text-tertiary)]"
              >
                Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  autoFocus
                  className="h-[52px] w-full rounded-lg border bg-[var(--bg-elevated)] pl-10 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none transition-colors duration-150 ease-out focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-tint)] disabled:opacity-50"
                  style={{ borderColor: "rgba(255,255,255,0.08)" }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="login-password"
                className="mb-1.5 block text-xs font-medium text-[var(--text-tertiary)]"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
                <input
                  id="login-password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="h-[52px] w-full rounded-lg border bg-[var(--bg-elevated)] pl-10 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none transition-colors duration-150 ease-out focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-tint)] disabled:opacity-50"
                  style={{ borderColor: "rgba(255,255,255,0.08)" }}
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="flex h-[52px] w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 text-sm font-semibold text-white shadow-[var(--brand-shadow-sm)] transition-all duration-150 ease-out hover:bg-[var(--accent-hover)] hover:shadow-[var(--brand-shadow-md)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Signing in…" : "Sign in"}
            </button>

            {/* Forgot password */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={async () => {
                  const form = formRef.current;
                  const formData = new FormData(form!);
                  const actualEmail = formData.get("email") as string;
                  if (!actualEmail?.trim()) {
                    setError("Enter your email address first, then click Forgot Password.");
                    return;
                  }
                  setLoading(true);
                  setError(null);
                  const { error: resetError } = await supabase.auth.resetPasswordForEmail(actualEmail.trim(), {
                    redirectTo: `${window.location.origin}/auth/callback`,
                  });
                  setLoading(false);
                  if (resetError) {
                    setError(resetError.message);
                  } else {
                    setError("✓ Password reset link sent — check your email.");
                  }
                }}
                className="cursor-pointer text-xs text-[var(--text-tertiary)] transition-colors hover:text-[var(--accent)]"
              >
                Forgot your password?
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }} />
            </div>
            <div className="relative flex justify-center">
              <span
                className="px-3 text-xs text-[var(--text-tertiary)]"
                style={{ background: "rgba(18,23,30,0.85)" }}
              >
                Or continue with
              </span>
            </div>
          </div>

          {/* Google OAuth */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading || googleLoading}
            className="flex h-[52px] w-full cursor-pointer items-center justify-center gap-3 rounded-lg border bg-[var(--bg-elevated)] px-4 text-sm font-medium text-[var(--text-secondary)] transition-all duration-150 ease-out hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            style={{ borderColor: "rgba(255,255,255,0.08)" }}
          >
            {googleLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            Continue with Google
          </button>
        </AuthCard>
      </div>
    </div>
  );
}
