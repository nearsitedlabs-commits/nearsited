"use client";

import Link from "next/link";
import type { ReactNode } from "react";

export type AuthMode = "login" | "signup";

type AuthCardProps = {
  mode: AuthMode;
  children: ReactNode;
  error?: string | null;
};

export default function AuthCard({ mode, children, error }: AuthCardProps) {
  const isLogin = mode === "login";

  return (
    <div className="relative z-10 flex w-full items-center justify-center px-4 py-12">
      <div className="w-full max-w-[420px] space-y-6">
        {/* ── Logo + Heading ──────────────────────────────────────────── */}
        <div className="text-center">
          <Link href="/" className="inline-block">
            <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--accent)]/25 bg-[var(--accent-tint)] transition-colors hover:bg-[var(--accent)]/20">
              <svg width="22" height="13" viewBox="0 0 48 28" fill="none">
                <rect x="1" y="4" width="18" height="18" rx="9" fill="none" stroke="var(--accent)" strokeWidth="2.2" />
                <rect x="29" y="4" width="18" height="18" rx="9" fill="none" stroke="var(--accent)" strokeWidth="2.2" />
                <line x1="19" y1="13" x2="29" y2="13" stroke="var(--accent)" strokeWidth="2.2" />
                <circle cx="38" cy="13" r="2.5" fill="var(--accent-hover)" />
                <circle cx="39.5" cy="11.5" r="0.8" fill="white" opacity="0.8" />
              </svg>
            </span>
          </Link>
          <h1 className="mt-4 text-2xl font-medium tracking-[-0.04em] text-[var(--text-primary)]">
            {isLogin ? "Sign in" : "Create an account"}
          </h1>
          <p className="mt-1.5 text-sm text-[var(--text-tertiary)]">
            {isLogin ? "Welcome back to Nearsited" : "Get started with Nearsited"}
          </p>
        </div>

        {/* ── Back to home ────────────────────────────────────────────── */}
        <div className="text-center">
          <Link href="/" className="text-xs text-[var(--text-tertiary)] transition-colors hover:text-[var(--accent)]">
            ← Back to home
          </Link>
        </div>

        {/* ── Card ────────────────────────────────────────────────────── */}
        <div
          className="rounded-[20px] border p-8 shadow-[var(--brand-shadow-lg)]"
          style={{
            borderColor: "rgba(255,255,255,0.08)",
            background: "rgba(18,23,30,0.85)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div className="-mt-8 -mx-8 mb-8 h-px bg-gradient-to-r from-transparent via-[var(--accent)]/40 to-transparent" />

          {error && (
            <div className="mb-4 rounded-xl border border-[var(--badge-red-border)] bg-[var(--badge-red-bg)] px-4 py-3 text-sm text-[var(--badge-red-text)]">
              {error}
            </div>
          )}

          {children}
        </div>

        {/* ── Footer link ─────────────────────────────────────────────── */}
        <p className="text-center text-sm text-[var(--text-tertiary)]">
          {isLogin ? (
            <>
              Don&rsquo;t have an account?{" "}
              <a href="/signup" className="font-medium text-[var(--accent)] transition-colors hover:text-[var(--accent-hover)]">
                Create account
              </a>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <a href="/login" className="font-medium text-[var(--accent)] transition-colors hover:text-[var(--accent-hover)]">
                Sign in
              </a>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
