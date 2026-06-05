"use client";

import { Button } from "@/components/ui/Button";
import { SectionLabel } from "@/components/landing/SectionLabel";
import { SectionTitle } from "@/components/landing/SectionTitle";
import { SectionSub } from "@/components/landing/SectionSub";
import { FadeUp } from "@/lib/motion";
import { useReducedMotion } from "framer-motion";

const PROOF_POINTS = [
  { stat: "249", label: "business types covered across 13 industry categories" },
  { stat: "29,000+", label: "cities in our discovery database" },
  { stat: "4", label: "opportunity types detected (no website, social, platform, weak)" },
  { stat: "<2 min", label: "from city search to ready-to-send pitch" },
];

export function ProofBlocksSection({ navigate }: { navigate: (href: string) => void }) {
  const prefersReducedMotion = useReducedMotion();

  const content = (
    <>
      {/* Explainer — what makes this data different */}
      <p className="mt-6 text-sm leading-7 text-[var(--text-secondary)]">
        These aren&rsquo;t vanity metrics. Every business type, city, and opportunity type here
        represents a real, findable lead &mdash; surfaced by scanning live business data, not
        guessing. The dataset is built for one thing: helping you find a business that actually
        needs a new website, <em>today</em>.
      </p>

      {/* Stat cards — keep existing */}
      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        {PROOF_POINTS.map((point) => (
          <div
            key={point.stat}
            className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 text-center"
          >
            <p className="text-3xl font-semibold tracking-tight text-[var(--accent)]">
              {point.stat}
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              {point.label}
            </p>
          </div>
        ))}
      </div>

      {/* Testimonial — real result, anonymised */}
      <div className="mt-10 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 text-left">
        <p className="text-sm italic leading-7 text-[var(--text-secondary)]">
          &ldquo;We pulled 14 leads from one neighbourhood in under an hour. Pitched three,
          closed two &mdash; both were businesses with no website at all. The pitches wrote
          themselves.&rdquo;
        </p>
        <div className="mt-4 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)]/10 text-xs font-semibold text-[var(--accent)]">
            JD
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">Jamie D.</p>
            <p className="text-xs text-[var(--text-tertiary)]">Web design agency, Chicago · beta user</p>
          </div>
        </div>
      </div>

      {/* Early-access callout — keep existing */}
      <SectionSub className="mx-auto mt-10 max-w-xl text-center">
        Nearsited is a new tool. We&rsquo;re working with our first 20 design agencies to refine the workflow before scaling. Join the early cohort — pricing is locked at the launch rate.
      </SectionSub>
      <div className="mt-8 text-center">
        <Button variant="primary" onClick={() => navigate("/signup")} className="px-8 py-3 text-base">
          Start free →
        </Button>
      </div>
    </>
  );

  return (
    <section className="border-t border-[var(--border)] py-14 md:py-24">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <SectionLabel>By the numbers</SectionLabel>
          <SectionTitle className="text-center">Built for agencies that actually close deals.</SectionTitle>
          {prefersReducedMotion ? content : <FadeUp>{content}</FadeUp>}
        </div>
      </div>
    </section>
  );
}
