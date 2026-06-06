"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { DURATION, EASE } from "@/lib/motion";

export function LandingNav({ navigate }: { navigate: (href: string) => void }) {
  // Default to true during SSR to avoid hydration mismatch.
  // After hydration, useReducedMotion() returns the actual preference.
  const shouldReduceMotion = useReducedMotion() ?? true;

  // When motion is reduced (or during SSR), render a static nav without animation
  if (shouldReduceMotion) {
    return (
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-[var(--border)] bg-[var(--bg-base)]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-8">
          <a href="#" className="inline-flex items-center gap-2.5 text-base font-medium text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-sans)' }}>
            <Image src="/logo-icon.svg" alt="" width={36} height={21} className="block shrink-0" />
            <span className="text-[22px] font-medium tracking-[0.02em] text-[var(--text-primary)]">NearSited</span>
          </a>

          <ul className="hidden items-center gap-8 text-sm text-[var(--text-tertiary)] md:flex">
            <li><a href="#how" className="relative transition hover:text-[var(--text-primary)]">How it works</a></li>
            <li><a href="#report" className="relative transition hover:text-[var(--text-primary)]">Sample report</a></li>
            <li><Link href="/pricing" className="relative transition hover:text-[var(--text-primary)]">Pricing</Link></li>
            <li><a href="#faq" className="relative transition hover:text-[var(--text-primary)]">FAQ</a></li>
          </ul>

          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="ghost" className="hidden sm:inline-flex" onClick={() => navigate("/login")}>Sign in</Button>
            <Button variant="primary" className="text-sm px-3 py-2 sm:px-4 sm:py-2 sm:text-base" onClick={() => navigate("/pricing")}>
              <span className="sm:hidden">Get started</span>
              <span className="hidden sm:inline">Get started free</span>
            </Button>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <motion.nav
      className="fixed inset-x-0 top-0 z-50 border-b border-[var(--border)] bg-[var(--bg-base)]/80 backdrop-blur-xl"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION.page, ease: EASE.out }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-8">
        <a href="#" className="inline-flex items-center gap-2.5 text-base font-medium text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-sans)' }}>
          <Image src="/logo-icon.svg" alt="" width={36} height={21} className="block shrink-0" />
          <span className="text-[22px] font-medium tracking-[0.02em] text-[var(--text-primary)]">NearSited</span>
        </a>

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

        <div className="flex items-center gap-2 sm:gap-3">
          <Button variant="ghost" className="hidden sm:inline-flex" onClick={() => navigate("/login")}>Sign in</Button>
          <Button variant="primary" className="text-sm px-3 py-2 sm:px-4 sm:py-2 sm:text-base" onClick={() => navigate("/pricing")}>
            <span className="sm:hidden">Get started</span>
            <span className="hidden sm:inline">Get started free</span>
          </Button>
        </div>
      </div>
    </motion.nav>
  );
}
