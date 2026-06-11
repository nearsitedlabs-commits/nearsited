"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import AuthCard from "@/components/auth/AuthCard";

const GOOGLE_SVG = (
  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const inputBase =
  "h-[44px] w-full rounded-[var(--radius-sm)] border bg-[var(--color-bg-elevated)] px-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] outline-none transition-colors focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--accent-tint)] disabled:opacity-50";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const supabase = createClient();

  function validate(em: string, pw: string) {
    const errs: typeof fieldErrors = {};
    if (!em) errs.email = "Email is required.";
    if (!pw) errs.password = "Password is required.";
    return errs;
  }

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setError(null);
    const form = formRef.current!;
    const fd = new FormData(form);
    const em = (fd.get("email") as string).trim();
    const pw = fd.get("password") as string;
    const errs = validate(em, pw);
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }
    setFieldErrors({});
    setLoading(true);
    const { error: authErr } = await supabase.auth.signInWithPassword({ email: em, password: pw });
    if (authErr) { setError(authErr.message); setLoading(false); return; }
    router.push("/dashboard");
    router.refresh();
  }

  async function handleForgotPassword() {
    const form = formRef.current!;
    const fd = new FormData(form);
    const em = (fd.get("email") as string)?.trim();
    if (!em) { setFieldErrors({ email: "Enter your email first." }); return; }
    setLoading(true);
    setError(null);
    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(em, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (resetErr) { setError(resetErr.message); }
    else { setError("Reset link sent — check your email."); }
  }

  async function handleGoogle() {
    setError(null);
    setGoogleLoading(true);
    const { error: oauthErr } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (oauthErr) { setError(oauthErr.message); setGoogleLoading(false); }
    else { setTimeout(() => setGoogleLoading(false), 10000); }
  }

  return (
    <AuthCard
      title="Welcome back."
      subtitle="Pick up where you left off."
      error={error}
      onDismissError={() => setError(null)}
      footerLink={
        <>
          Don&rsquo;t have an account?{" "}
          <a href="/signup" className="font-medium text-[var(--color-accent)] hover:underline">
            Sign up
          </a>
        </>
      }
    >
      {/* Google */}
      <button
        type="button"
        onClick={handleGoogle}
        disabled={loading || googleLoading}
        className="flex h-[44px] w-full items-center justify-center gap-2.5 rounded-[var(--radius-sm)] border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-surface)] hover:text-[var(--color-text-primary)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : GOOGLE_SVG}
        Continue with Google
      </button>

      {/* Divider */}
      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-[var(--color-border-subtle)]" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-[var(--color-bg-surface)] px-3 text-xs text-[var(--color-text-tertiary)]">or</span>
        </div>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Email */}
        <div>
          <label htmlFor="login-email" className="mb-1.5 block text-xs font-medium text-[var(--color-text-tertiary)]">
            Email
          </label>
          <input
            id="login-email"
            name="email"
            type="email"
            required
            value={email}
            onChange={(e) => { setEmail(e.target.value); setFieldErrors((p) => ({ ...p, email: undefined })); }}
            placeholder="you@example.com"
            autoComplete="email"
            autoFocus
            className={`${inputBase} ${fieldErrors.email ? "border-[var(--color-danger)]/60" : "border-[var(--color-border-subtle)]"}`}
          />
          {fieldErrors.email && (
            <p className="mt-1 text-xs text-[var(--color-danger)]">{fieldErrors.email}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="login-password" className="mb-1.5 block text-xs font-medium text-[var(--color-text-tertiary)]">
            Password
          </label>
          <div className="relative">
            <input
              id="login-password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: undefined })); }}
              placeholder="••••••••"
              autoComplete="current-password"
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
          {fieldErrors.password && (
            <p className="mt-1 text-xs text-[var(--color-danger)]">{fieldErrors.password}</p>
          )}
        </div>

        {/* Remember me */}
        <div className="flex items-center justify-between">
          <label className="flex cursor-pointer items-center gap-2 text-xs text-[var(--color-text-tertiary)]">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-3.5 w-3.5 rounded accent-[var(--color-accent)]"
            />
            Remember me
          </label>
          <button
            type="button"
            onClick={handleForgotPassword}
            className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-accent)] transition-colors"
          >
            Forgot password?
          </button>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="flex h-[44px] w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-accent)] px-4 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </AuthCard>
  );
}
