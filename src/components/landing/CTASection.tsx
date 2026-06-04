"use client";

import { Search, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export function CTASection({ navigate }: { navigate: (href: string) => void }) {
  return (
    <section className="border-t border-[var(--border)] py-24">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="relative overflow-hidden rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-surface)] px-8 py-16 text-center md:px-16">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[var(--accent)]/5 blur-[100px]" />

          <div className="relative z-10">
            <Badge color="indigo" dot>Start finding website opportunities today</Badge>
            <h2 className="mt-6 text-[clamp(2rem,4vw,3.5rem)] font-medium tracking-[-0.03em] leading-[1.1] text-[var(--text-primary)]">
              Your next client is out there — without a website.
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base leading-7 text-[var(--text-secondary)]">
              Enter a city and business type. Find businesses with no website, social-only presence, or weak websites — with a ready-to-send pitch for each one. All in under 3 minutes.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
              <Button variant="primary" icon={<Search className="h-4 w-4" />} onClick={() => navigate("/signup")} className="w-full px-8 py-3 text-base sm:w-auto">
                Find your first opportunity
              </Button>
              <Button variant="secondary" onClick={() => navigate("/login")} className="w-full px-8 py-3 text-base sm:w-auto">
                Sign in
              </Button>
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-6 text-sm text-[var(--text-tertiary)]">
              <span className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[var(--accent)]" />No credit card</span>
              <span className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[var(--accent)]" />Audit 50 businesses free</span>
              <span className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[var(--accent)]" />Cancel anytime</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
