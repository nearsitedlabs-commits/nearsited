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

export function LandingFooter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "subscribed" | "error">("idle");

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) return;

    // Client-side only — no mailing list API integrated yet.
    // Logs to console for now; shows a thank-you message on success.
    console.log("[NEWSLETTER] Subscribe:", email.trim());
    setStatus("subscribed");
    setEmail("");
  }, [email]);

  return (
    <FadeIn>
      <footer className="relative overflow-hidden border-t border-[var(--border)] bg-[var(--bg-surface)] px-6 py-12 md:px-8">
        <CanvasBackground />
        <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[2fr_1fr_1fr_1fr]">
          <div>
            <div className="mb-4 inline-flex items-center gap-2.5 text-base font-medium text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-sans)' }}>
              <Image src="/logo-icon.svg" alt="" width={28} height={16} className="block shrink-0" />
              <span className="text-base font-medium tracking-[0.02em] text-[var(--text-primary)]">NearSited</span>
              </div>
              <p className="max-w-sm text-sm leading-7 text-[var(--text-tertiary)]">
                Discover untapped opportunities — businesses that need websites, redesigns, or a stronger online presence.
              </p>

              {/* ── Newsletter signup ── */}
              <div className="mt-6">
                <p className="mb-2 text-[0.7rem] uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
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
                      className="text-sm text-[var(--accent)]"
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
                      className="flex gap-2"
                    >
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        required
                        aria-label="Email for newsletter"
                        className="min-w-0 flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none transition focus:border-[var(--accent)]/50"
                      />
                      <button
                        type="submit"
                        className="shrink-0 rounded-lg bg-[var(--accent)] px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)]"
                      >
                        Subscribe
                      </button>
                    </motion.form>
                  )}
                </AnimatePresence>
                {status === "error" && (
                  <p className="mt-1 text-xs text-[var(--status-error-text)]">
                    Something went wrong. Please try again.
                  </p>
                )}
              </div>
          </div>
          <div>
            <div className="mb-4 text-[0.7rem] uppercase tracking-[0.12em] text-[var(--text-tertiary)]">Product</div>
            <ul className="space-y-3 text-sm text-[var(--text-tertiary)]">
              <li><a href="#how" className="transition hover:text-[var(--text-primary)]">How it works</a></li>
              <li><a href="#report" className="transition hover:text-[var(--text-primary)]">Sample report</a></li>
              <li><a href="#pitch" className="transition hover:text-[var(--text-primary)]">Sample pitch</a></li>
              <li><Link href="/pricing" className="transition hover:text-[var(--text-primary)]">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <div className="mb-4 text-[0.7rem] uppercase tracking-[0.12em] text-[var(--text-tertiary)]">Company</div>
            <ul className="space-y-3 text-sm text-[var(--text-tertiary)]">
              <li><Link href="/#story" className="transition hover:text-[var(--text-primary)]">About</Link></li>
              <li><a href="mailto:nearsitedlabs@gmail.com" className="transition hover:text-[var(--text-primary)]">Contact</a></li>
            </ul>
          </div>
          <div>
            <div className="mb-4 text-[0.7rem] uppercase tracking-[0.12em] text-[var(--text-tertiary)]">Legal</div>
            <ul className="space-y-3 text-sm text-[var(--text-tertiary)]">
              <li><Link href="/terms" className="transition hover:text-[var(--text-primary)]">Terms</Link></li>
              <li><Link href="/privacy" className="transition hover:text-[var(--text-primary)]">Privacy</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-[var(--border)] pt-6 text-sm text-[var(--text-tertiary)] md:flex-row">
          <span>© 2026 Nearsited. All rights reserved.</span>
          <span className="text-[var(--text-secondary)]">Built by Again Labs · <a href="https://againlive.com" className="transition hover:text-[var(--text-primary)]" target="_blank" rel="noopener noreferrer">Again Live</a> family of products</span>
        </div>
      </footer>
    </FadeIn>
  );
}
