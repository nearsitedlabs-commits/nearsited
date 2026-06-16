"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "@/lib/motion";
import { X } from "lucide-react";

const COOKIE_CONSENT_KEY = "nearsited_cookie_consent";

type ConsentChoice = "accepted" | "declined" | "dismissed";

export function CookieConsent() {
  // null on SSR; populated by useEffect to avoid hydration mismatch
  const [consent, setConsent] = useState<ConsentChoice | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY) as ConsentChoice | null;
    setConsent(stored);
    if (!stored) {
      const timer = setTimeout(() => setVisible(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  function handleAccept() {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    setConsent("accepted");
    setVisible(false);
  }

  function handleDecline() {
    localStorage.setItem(COOKIE_CONSENT_KEY, "declined");
    setConsent("declined");
    setVisible(false);
  }

  function handleDismiss() {
    localStorage.setItem(COOKIE_CONSENT_KEY, "dismissed");
    setConsent("dismissed");
    setVisible(false);
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 16, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
          className="fixed bottom-4 left-4 right-4 z-[100] sm:bottom-6 sm:left-6 sm:right-auto sm:max-w-sm"
        >
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-4 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--color-text-primary)]">
                  We use cookies
                </p>
                <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-tertiary)]">
                  Essential + analytics cookies.{" "}
                  <a
                    href="/privacy"
                    className="underline underline-offset-2 transition-colors hover:text-[var(--color-accent)]"
                  >
                    Privacy Policy
                  </a>
                </p>
              </div>
              <button
                onClick={handleDismiss}
                aria-label="Dismiss cookie notice"
                className="flex min-h-[44px] min-w-[44px] shrink-0 cursor-pointer items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-text-tertiary)] transition-colors duration-150 hover:text-[var(--color-text-primary)]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={handleDecline}
                className="flex-1 cursor-pointer rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] py-2 text-xs font-medium text-[var(--color-text-secondary)] transition-colors duration-150 hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-text-primary)] min-h-[44px]"
              >
                Decline
              </button>
              <button
                onClick={handleAccept}
                className="flex-1 cursor-pointer rounded-[var(--radius-sm)] bg-[var(--color-accent)] py-2 text-xs font-medium text-white transition-colors duration-150 hover:opacity-90 min-h-[44px]"
              >
                Accept
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
