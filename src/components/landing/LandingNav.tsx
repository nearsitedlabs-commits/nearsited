"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { motion, useReducedMotion, AnimatePresence } from "@/lib/motion";
import { Button } from "@/components/ui/Button";
import { DURATION, EASE } from "@/lib/motion";

const NAV_LINKS = [
  { href: "#how", label: "How it works" },
  { href: "#report", label: "Sample report" },
  { href: "/pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
] as const;

function handleNavClick(href: string, navigate: (href: string) => void) {
  if (href.startsWith("#")) {
    const id = href.slice(1);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  } else {
    navigate(href);
  }
}

export function LandingNav({ navigate }: { navigate: (href: string) => void }) {
  // Default to true during SSR to avoid hydration mismatch.
  // After hydration, useReducedMotion() returns the actual preference.
  const shouldReduceMotion = useReducedMotion() ?? true;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

  // Close on Escape key
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMobileMenu();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [mobileMenuOpen, closeMobileMenu]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const handleLinkClick = (href: string) => {
    handleNavClick(href, navigate);
    closeMobileMenu();
  };

  // ── Logo ──
  const logo = (
    <a href="#" className="inline-flex items-center gap-2.5 text-base font-medium text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-sans)' }}>
      <Image src="/logo-icon.svg" alt="" width={36} height={21} className="block shrink-0" />
      <span className="text-[22px] font-medium tracking-[0.02em] text-[var(--text-primary)]">NearSited</span>
    </a>
  );

  // ── Desktop nav links (reduced-motion branch) ──
  const desktopLinks = (
    <ul className="hidden items-center gap-8 text-sm text-[var(--text-tertiary)] md:flex">
      <li><a href="#how" className="relative transition hover:text-[var(--text-primary)]">How it works</a></li>
      <li><a href="#report" className="relative transition hover:text-[var(--text-primary)]">Sample report</a></li>
      <li><Link href="/pricing" className="relative transition hover:text-[var(--text-primary)]">Pricing</Link></li>
      <li><a href="#faq" className="relative transition hover:text-[var(--text-primary)]">FAQ</a></li>
    </ul>
  );

  // ── Desktop nav links (animated branch with underline hover) ──
  const desktopLinksAnimated = (
    <ul className="hidden items-center gap-8 text-sm text-[var(--text-tertiary)] md:flex">
      <li>
        <a href="#how" className="relative transition hover:text-[var(--text-primary)] after:absolute after:inset-x-0 after:-bottom-1 after:h-px after:bg-[var(--text-primary)] after:scale-x-0 after:transition-transform after:duration-300 hover:after:scale-x-100">
          How it works
        </a>
      </li>
      <li>
        <a href="#report" className="relative transition hover:text-[var(--text-primary)] after:absolute after:inset-x-0 after:-bottom-1 after:h-px after:bg-[var(--text-primary)] after:scale-x-0 after:transition-transform after:duration-300 hover:after:scale-x-100">
          Sample report
        </a>
      </li>
      <li>
        <Link href="/pricing" className="relative transition hover:text-[var(--text-primary)] after:absolute after:inset-x-0 after:-bottom-1 after:h-px after:bg-[var(--text-primary)] after:scale-x-0 after:transition-transform after:duration-300 hover:after:scale-x-100">
          Pricing
        </Link>
      </li>
      <li>
        <a href="#faq" className="relative transition hover:text-[var(--text-primary)] after:absolute after:inset-x-0 after:-bottom-1 after:h-px after:bg-[var(--text-primary)] after:scale-x-0 after:transition-transform after:duration-300 hover:after:scale-x-100">
          FAQ
        </a>
      </li>
    </ul>
  );

  // ── CTA buttons ──
  const buttons = (
    <div className="flex items-center gap-2 sm:gap-3">
      <Button variant="ghost" className="hidden sm:inline-flex" onClick={() => navigate("/login")}>Sign in</Button>
      <Button variant="primary" className="px-4 py-2.5 text-sm sm:px-5 sm:text-base" onClick={() => navigate("/signup")}>
        <span className="sm:hidden">Get started</span>
        <span className="hidden sm:inline">Get started free</span>
      </Button>
    </div>
  );

  // ── Hamburger toggle button (visible only below md) ──
  const hamburgerButton = (
    <button
      type="button"
      className="inline-flex items-center justify-center rounded-lg p-2 text-[var(--text-secondary)] transition hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] md:hidden"
      onClick={() => setMobileMenuOpen((prev) => !prev)}
      aria-expanded={mobileMenuOpen}
      aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
    >
      {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
    </button>
  );

  // ── Mobile slide-down drawer ──
  const mobileDrawer = (animate: boolean) => {
    const content = (
      <nav className="px-6 py-6" aria-label="Mobile navigation">
        <ul className="flex flex-col gap-2">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <button
                type="button"
                onClick={() => handleLinkClick(link.href)}
                className="w-full rounded-lg px-4 py-3 text-left text-sm text-[var(--text-secondary)] transition hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
              >
                {link.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    );

    if (animate) {
      return (
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                key="mobile-backdrop"
                className="fixed inset-0 top-[68px] z-40 bg-black/60 md:hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: DURATION.micro, ease: EASE.out }}
                onClick={closeMobileMenu}
                aria-hidden="true"
              />
              {/* Drawer panel */}
              <motion.div
                key="mobile-drawer"
                className="fixed inset-x-0 top-[68px] z-50 border-b border-[var(--border)] bg-[var(--bg-base)] md:hidden"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: DURATION.card, ease: EASE.out }}
                role="dialog"
                aria-modal="true"
                aria-label="Mobile navigation"
              >
                {content}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      );
    }

    // Reduced motion: plain show/hide (no animation)
    if (!mobileMenuOpen) return null;
    return (
      <>
        <div
          className="fixed inset-0 top-[68px] z-40 bg-black/60 md:hidden"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
        <div
          className="fixed inset-x-0 top-[68px] z-50 border-b border-[var(--border)] bg-[var(--bg-base)] md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
        >
          {content}
        </div>
      </>
    );
  };

  // ── When motion is reduced (or during SSR), render a static nav without animation ──
  if (shouldReduceMotion) {
    return (
      <>
        <nav className="fixed inset-x-0 top-0 z-50 border-b border-[var(--border)] bg-[var(--bg-base)]/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-8">
            {logo}
            {desktopLinks}
            <div className="flex items-center gap-2 sm:gap-3">
              {hamburgerButton}
              {buttons}
            </div>
          </div>
        </nav>
        {mobileDrawer(false)}
      </>
    );
  }

  // ── Animated branch ──
  return (
    <>
      <motion.nav
        className="fixed inset-x-0 top-0 z-50 border-b border-[var(--border)] bg-[var(--bg-base)]/80 backdrop-blur-xl"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: DURATION.page, ease: EASE.out }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-8">
          {logo}
          {desktopLinksAnimated}
          <div className="flex items-center gap-2 sm:gap-3">
            {hamburgerButton}
            {buttons}
          </div>
        </div>
      </motion.nav>
      {mobileDrawer(true)}
    </>
  );
}
