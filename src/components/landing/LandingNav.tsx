"use client";

import Image from "next/image";
import { Button } from "@/components/ui/Button";

export function LandingNav({ navigate }: { navigate: (href: string) => void }) {
  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-[var(--border)] bg-[var(--bg-base)]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-8">
        <a href="#" className="inline-flex items-center gap-2.5 text-base font-medium text-[var(--text-primary)]" style={{ fontFamily: 'Switzer, Geist, sans-serif' }}>
          <Image src="/logo-icon.svg" alt="" width={36} height={21} className="block shrink-0" />
          <span className="text-[22px] font-medium tracking-[0.02em] text-[var(--text-primary)]">NearSited</span>
        </a>

        <ul className="hidden items-center gap-8 text-sm text-[var(--text-tertiary)] md:flex">
          <li><a href="#how" className="transition hover:text-[var(--text-primary)]">How it works</a></li>
          <li><a href="#report" className="transition hover:text-[var(--text-primary)]">Sample report</a></li>
          <li><a href="#pitch" className="transition hover:text-[var(--text-primary)]">Sample pitch</a></li>
          <li><a href="/pricing" className="transition hover:text-[var(--text-primary)]">Pricing</a></li>
          <li><a href="#faq" className="transition hover:text-[var(--text-primary)]">FAQ</a></li>
        </ul>

        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate("/login")}>Sign in</Button>
          <Button variant="primary" onClick={() => navigate("/signup")}>Get started free</Button>
        </div>
      </div>
    </nav>
  );
}
