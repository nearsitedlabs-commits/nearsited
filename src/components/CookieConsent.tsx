"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

const COOKIE_CONSENT_KEY = "nearsited_cookie_consent";

type ConsentChoice = "accepted" | "declined";

export function CookieConsent() {
  // Initialise from localStorage synchronously (lazy state initialiser)
  const [consent, setConsent] = useState<ConsentChoice | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(COOKIE_CONSENT_KEY) as ConsentChoice | null;
  });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!consent) {
      // Small delay so it doesn't flash on page load
      const timer = setTimeout(() => setVisible(true), 500);
      return () => clearTimeout(timer);
    }
  }, [consent]);

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
    setVisible(false);
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          className="fixed bottom-0 left-0 right-0 z-[100] border-t border-[var(--border)] bg-[var(--bg-surface)] p-4 shadow-2xl"
        >
          <div className="mx-auto flex max-w-7xl flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1 pr-8">
              <p className="text-sm font-medium text-[var(--text-primary)]">
                We use cookies
              </p>
              <p className="mt-1 text-xs text-[var(--text-tertiary)] leading-relaxed">
                Nearsited uses essential cookies for authentication and security.
                We also use analytics cookies to improve the product.
                See our{" "}
                <a
                  href="/privacy"
                  className="underline underline-offset-2 hover:text-[var(--accent)] transition-colors"
                >
                  Privacy Policy
                </a>{" "}
                for details.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={handleDecline}
                className="cursor-pointer rounded-lg border border-[var(--border)] px-4 py-2 text-xs font-medium text-[var(--text-secondary)] transition-colors duration-150 hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
              >
                Decline
              </button>
              <button
                onClick={handleAccept}
                className="cursor-pointer rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-medium text-white transition-colors duration-150 hover:bg-[var(--accent-hover)]"
              >
                Accept
              </button>
              <button
                onClick={handleDismiss}
                aria-label="Dismiss cookie notice"
                className="cursor-pointer rounded-lg p-2 text-[var(--text-tertiary)] transition-colors duration-150 hover:text-[var(--text-primary)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
