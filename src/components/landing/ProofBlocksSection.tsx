"use client";

import { Button } from "@/components/ui/Button";
import { SectionLabel } from "@/components/landing/SectionLabel";
import { SectionTitle } from "@/components/landing/SectionTitle";
import { SectionSub } from "@/components/landing/SectionSub";
import { FadeUp } from "@/lib/motion";
import { useReducedMotion } from "@/lib/motion";

const PROOF_POINTS = [
  { stat: "249", label: "business types across 13 industry categories" },
  { stat: "4", label: "opportunity types: no website, social, platform, weak" },
  { stat: "<2 min", label: "from city search to ready-to-send pitch" },
];

export function ProofBlocksSection({ navigate }: { navigate: (href: string) => void }) {
  const prefersReducedMotion = useReducedMotion();

  const content = (
    <>
      {/* Founder quote — left-border accent so it stands out from the stat grid */}
      <blockquote className="mt-8 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] border-l-2 border-l-[var(--color-accent)] bg-[var(--color-bg-elevated)] p-6 text-left">
        <p className="text-base italic leading-7 text-[var(--color-text-secondary)]">
          &ldquo;I was spending 3 hours every week just finding businesses to pitch. I built Nearsited so I could spend that time closing instead.&rdquo;
        </p>
        <footer className="mt-4 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-accent)]/10 text-xs font-semibold text-[var(--color-accent)]">
            AS
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--color-text-primary)]">Adin Sheik</p>
            <p className="text-xs text-[var(--color-text-tertiary)]">Founder, Again Labs. Built this to solve his own problem.</p>
          </div>
        </footer>
      </blockquote>

      {/* Stat cards */}
      <div className="mt-8 grid gap-6 sm:grid-cols-3">
        {PROOF_POINTS.map((point) => (
          <div
            key={point.stat}
            className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-6 text-center"
          >
            <p className="text-3xl font-semibold tracking-tight text-[var(--color-accent)]">
              {point.stat}
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
              {point.label}
            </p>
          </div>
        ))}
      </div>

      {/* Early-access callout */}
      <SectionSub className="mx-auto mt-10 max-w-xl text-center">
        Early adopters get launch pricing locked in permanently. The workflow is live. I&rsquo;m using it to close my own clients.
      </SectionSub>
      <div className="mt-8 text-center">
        <Button variant="primary" onClick={() => navigate("/signup")} className="px-8 py-3 text-base">
          Start free →
        </Button>
      </div>
    </>
  );

  return (
    <section className="border-t border-[var(--color-border-subtle)] py-14 md:py-24">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <SectionLabel>What it does</SectionLabel>
          <SectionTitle className="text-center">Built for agencies that actually close deals.</SectionTitle>
          {prefersReducedMotion ? content : <FadeUp>{content}</FadeUp>}
        </div>
      </div>
    </section>
  );
}
