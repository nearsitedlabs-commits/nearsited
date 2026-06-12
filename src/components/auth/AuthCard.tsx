"use client";

import Link from "next/link";
import Image from "next/image";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "@/lib/motion";
import type { ReactNode } from "react";

export type AuthMode = "login" | "signup" | "reset" | "verify";

type AuthCardProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  /** Below-card text + link, e.g. "Already have an account? Sign in" */
  footerLink?: ReactNode;
  error?: string | null;
  onDismissError?: () => void;
};

const ease = [0.25, 0.1, 0.25, 1] as const;

export default function AuthCard({
  title,
  subtitle,
  children,
  footerLink,
  error,
  onDismissError,
}: AuthCardProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-bg-page)] px-4 py-12">
      <motion.div
        className="w-full sm:max-w-[380px]"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease }}
      >
        {/* Logo */}
        <div className="mb-6 flex justify-center">
          <Link href="/" className="opacity-80 transition-opacity hover:opacity-100">
            <Image src="/logo-icon.svg" alt="Nearsited" width={40} height={23} />
          </Link>
        </div>

        {/* Heading — outside the card */}
        <div className="mb-6 text-center">
          <h1 className="text-[1.75rem] font-medium leading-tight tracking-[-0.03em] text-[var(--color-text-primary)]">
            {title}
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-text-secondary)]">
            {subtitle}
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] p-6"
          style={{ background: "var(--color-bg-surface)" }}
        >
          {/* Dismissable error banner */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                key={error}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease }}
                className="mb-4 flex items-start gap-2 rounded-[var(--radius-sm)] border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 px-3 py-2.5 text-xs text-[var(--color-danger)]"
              >
                <span className="flex-1 leading-5">{error}</span>
                {onDismissError && (
                  <button
                    type="button"
                    onClick={onDismissError}
                    aria-label="Dismiss error"
                    className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {children}
        </div>

        {/* Below-card footer link */}
        {footerLink && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.15, ease }}
            className="mt-5 text-center text-sm text-[var(--color-text-tertiary)]"
          >
            {footerLink}
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}
