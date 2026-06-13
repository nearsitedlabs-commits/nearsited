"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "@/lib/motion";
import { FadeIn, fadeUpVariants } from "@/lib/motion";
import dynamic from "next/dynamic";

// Lazy-load canvas animation — footer is off-screen initially, no need to block
const CanvasBackground = dynamic(
  () => import("@/components/ui/CanvasBackground").then((mod) => ({ default: mod.CanvasBackground })),
  { ssr: false },
);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function LandingFooter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "subscribed" | "error">("idle");
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();

    if (!trimmed) {
      setValidationError("Please enter your email address.");
      return;
    }
    if (!EMAIL_RE.test(trimmed)) {
      setValidationError("Please enter a valid email address.");
      return;
    }
    setValidationError(null);
    setStatus("loading");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });

      if (!res.ok) {
        throw new Error(`API returned ${res.status}`);
      }

      console.log("[NEWSLETTER] Subscribe succeeded:", trimmed);
      setStatus("subscribed");
      setEmail("");
    } catch (err) {
      console.error("[NEWSLETTER] Subscribe failed:", err);
      setStatus("error");
    }
  }, [email]);

  return (
    <FadeIn>
      <footer className="relative overflow-hidden border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] px-6 py-12 md:px-8">
        <CanvasBackground />
        <div className="mx-auto grid max-w-7xl gap-10 md:gap-8 md:grid-cols-[2fr_1fr_1fr_1fr]">
          <div>
            <div className="mb-4 inline-flex items-center gap-2.5 text-base font-medium text-[var(--color-text-primary)]" style={{ fontFamily: 'var(--font-sans)' }}>
              <Image src="/logo-icon.svg" alt="" width={28} height={16} className="block shrink-0" />
              <span className="text-base font-medium tracking-[0.02em] text-[var(--color-text-primary)]">NearSited</span>
              </div>
              <p className="max-w-sm text-sm leading-7 text-[var(--color-text-tertiary)]">
                Discover untapped opportunities: businesses that need websites, redesigns, or a stronger online presence.
              </p>

              {/* ── Newsletter signup ── */}
              <div className="mt-6">
                <p className="mb-2 text-[0.7rem] uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">
                  Stay updated
                </p>
                <AnimatePresence mode="wait">
                  {status === "subscribed" ? (
                    <motion.p
                      key="thanks"
                      variants={fadeUpVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      className="text-sm text-[var(--color-accent)]"
                    >
                      Thanks for subscribing!
                    </motion.p>
                  ) : (
                    <motion.form
                      key="form"
                      variants={fadeUpVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      onSubmit={handleSubmit}
                      className="flex flex-col sm:flex-row gap-2"
                    >
                      <input
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setValidationError(null); }}
                        placeholder="your@email.com"
                        disabled={status === "loading"}
                        aria-label="Email for newsletter"
                        className={`min-h-[44px] min-w-0 flex-1 rounded-[var(--radius-sm)] border bg-[var(--color-bg-elevated)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] outline-none transition disabled:opacity-50 ${validationError ? "border-red-500/50 focus:border-red-500/70" : "border-[var(--color-border-subtle)] focus:border-[var(--color-accent)]/50"}`}
                      />
                      <button
                        type="submit"
                        disabled={status === "loading"}
                        className="min-h-[44px] w-full sm:w-auto shrink-0 rounded-[var(--radius-sm)] bg-[var(--color-accent)] px-3.5 py-2 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {status === "loading" ? "Subscribing…" : "Subscribe"}
                      </button>
                    </motion.form>
                  )}
                </AnimatePresence>
                {(validationError || status === "error") && (
                  <p className="mt-2 text-xs text-red-400">
                    {validationError ?? "Something went wrong. Please try again."}
                  </p>
                )}
              </div>
          </div>
          <div>
            <div className="mb-4 text-[0.7rem] uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">Product</div>
            <ul className="space-y-3 text-sm text-[var(--color-text-tertiary)]">
              <li><a href="#how" className="transition hover:text-[var(--color-text-primary)]">How it works</a></li>
              <li><a href="#report" className="transition hover:text-[var(--color-text-primary)]">Sample report</a></li>
              <li><a href="#pitch" className="transition hover:text-[var(--color-text-primary)]">Sample pitch</a></li>
              <li><Link href="/pricing" className="transition hover:text-[var(--color-text-primary)]">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <div className="mb-4 text-[0.7rem] uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">Company</div>
            <ul className="space-y-3 text-sm text-[var(--color-text-tertiary)]">
              <li><Link href="/#story" className="transition hover:text-[var(--color-text-primary)]">About</Link></li>
              <li><a href="mailto:nearsitedlabs@gmail.com" className="transition hover:text-[var(--color-text-primary)]">Contact</a></li>
            </ul>
          </div>
          <div>
            <div className="mb-4 text-[0.7rem] uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">Legal</div>
            <ul className="space-y-3 text-sm text-[var(--color-text-tertiary)]">
              <li><Link href="/terms" className="transition hover:text-[var(--color-text-primary)]">Terms</Link></li>
              <li><Link href="/privacy" className="transition hover:text-[var(--color-text-primary)]">Privacy</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-[var(--color-border-subtle)] pt-6 text-sm text-[var(--color-text-tertiary)] md:flex-row">
          <span>© 2026 Nearsited. All rights reserved.</span>
          <span className="text-[var(--color-text-secondary)]">Built by Again Labs · <a href="https://againlive.com" className="transition hover:text-[var(--color-text-primary)]" target="_blank" rel="noopener noreferrer">Again Live</a> family of products</span>
        </div>
      </footer>
    </FadeIn>
  );
}
