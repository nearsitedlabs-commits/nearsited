"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import type { ReactNode } from "react";

export type AuthMode = "login" | "signup";

type AuthCardProps = {
  mode: AuthMode;
  children: ReactNode;
  error?: string | null;
};

const TRUST_INDICATORS = [
  "100 free audits included",
  "No credit card required",
];

const easeOut = [0.25, 0.1, 0.25, 1] as const;

const cardEnter = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.35, delay: 0.15, ease: easeOut },
};

const fadeIn = (delay: number) => ({
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.3, delay, ease: easeOut },
});

export default function AuthCard({ mode, children, error }: AuthCardProps) {
  const isLogin = mode === "login";

  return (
    <motion.div
      className="relative z-10 flex w-full items-center justify-center px-4 py-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <div className="w-full max-w-[420px] space-y-6">
        {/* ── Logo + Heading ──────────────────────────────────────────── */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05, ease: [0.25, 0.1, 0.25, 1] }}
        >
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
            {isLogin ? "Sign in" : "Find your first opportunity"}
          </h1>
          <p className="mt-1.5 text-sm text-[var(--text-tertiary)]">
            {isLogin ? "Welcome back" : "Discover website opportunities in under 3 minutes"}
          </p>
        </motion.div>

        {/* ── Back to home ────────────────────────────────────────────── */}
        <motion.div {...fadeIn(0.1)} className="text-center">
          <Link href="/" className="text-xs text-[var(--text-tertiary)] transition-colors hover:text-[var(--accent)]">
            ← Back to home
          </Link>
        </motion.div>

        {/* ── Card ────────────────────────────────────────────────────── */}
        <motion.div
          {...cardEnter}
          className="rounded-[20px] border p-8 shadow-[var(--brand-shadow-lg)]"
          style={{
            borderColor: "rgba(255,255,255,0.08)",
            background: "rgba(18,23,30,0.85)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div className="-mt-8 -mx-8 mb-8 h-px bg-gradient-to-r from-transparent via-[var(--accent)]/40 to-transparent" />

          {/* Error with slide-in + horizontal shake */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                key={error}
                className="mb-4 rounded-xl border border-[var(--badge-red-border)] bg-[var(--badge-red-bg)] px-4 py-3 text-sm text-[var(--badge-red-text)]"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: [0, -4, 4, -2, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {children}

          {/* ── Trust indicators ──────────────────────────────────────── */}
          <motion.div
            {...fadeIn(0.25)}
            className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 border-t border-[var(--border)] pt-5"
          >
            {TRUST_INDICATORS.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1.5 text-xs text-[var(--text-tertiary)]"
              >
                <Check className="h-3 w-3 text-[var(--accent)]" />
                {item}
              </span>
            ))}
          </motion.div>
        </motion.div>

        {/* ── Footer link ─────────────────────────────────────────────── */}
        <motion.p {...fadeIn(0.2)} className="text-center text-sm text-[var(--text-tertiary)]">
          {isLogin ? (
            <>
              Don&rsquo;t have an account?{" "}
              <a href="/signup" className="font-medium text-[var(--accent)] transition-colors hover:text-[var(--accent-hover)]">
                Find opportunities
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
        </motion.p>
      </div>
    </motion.div>
  );
}
