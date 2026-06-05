"use client";

import { Search, Target, Mail, TrendingUp, Info } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { SectionLabel } from "@/components/landing/SectionLabel";
import { SectionTitle } from "@/components/landing/SectionTitle";
import { SectionSub } from "@/components/landing/SectionSub";
import { motion, useReducedMotion } from "framer-motion";

const HIERARCHY = [
  {
    number: "01",
    title: "Find opportunities",
    desc: "Enter a city + business category. Nearsited surfaces hyperlocal businesses with no website, social-only presence, or weak websites — ranked by opportunity score, not alphabetically.",
    icon: Search,
    statKey: "Surface rate",
    statValue: "40–60% of local businesses qualify",
  },
  {
    number: "02",
    title: "Understand the gap",
    desc: "Every lead gets a full assessment: website presence, performance, mobile UX, SEO, design, trust signals. You see exactly what's missing — and what to pitch.",
    icon: Target,
    statKey: "Issues per lead",
    statValue: "4–7 critical issues found",
  },
  {
    number: "03",
    title: "Generate outreach",
    desc: "One click generates a personalised pitch tailored to the opportunity type — website build, redesign, or improvement. Adjust tone, copy, and send.",
    icon: Mail,
    statKey: "Pitch generation",
    statValue: "Under 2 seconds",
  },
  {
    number: "04",
    title: "Win more website projects",
    desc: "Track every lead through a pipeline: New → Contacted → Proposal → Won. Whether it's a new build or a redesign, close it without spreadsheets.",
    icon: TrendingUp,
    statKey: "Pipeline close rate",
    statValue: "2–3× higher conversion†",
  },
];

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.4, delay, ease: [0.25, 0.1, 0.25, 1] as const },
});

export function HowItWorksSection() {
  const prefersReducedMotion = useReducedMotion();
  const anim = (d: number) => (prefersReducedMotion ? {} : fadeUp(d));

  return (
    <section id="how" className="border-t border-[var(--border)] py-14 md:py-24">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <SectionLabel>The workflow</SectionLabel>
          <SectionTitle className="text-center">Four steps to your next website project.</SectionTitle>
          <SectionSub className="mx-auto text-center">
            From finding the right lead to closing the deal — every step is designed to remove friction and shorten your sales cycle.
          </SectionSub>
        </div>

        <div className="mt-14 space-y-6">
          {HIERARCHY.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div key={step.number} {...anim(i * 0.1)}>
                <Card variant="default" padding="lg" className="grid gap-6 md:grid-cols-[80px_1fr_240px] items-center">
                  <div className="flex items-start">
                    <span className="text-[3rem] font-medium italic tracking-[-0.04em] text-[var(--text-tertiary)]/40">
                      {step.number}
                    </span>
                  </div>
                  <div>
                    <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-tint)] text-[var(--accent)]">
                      <Icon className="h-4 w-4" />
                    </div>
                    <h3 className="text-xl font-medium text-[var(--text-primary)]">{step.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-[var(--text-secondary)]">{step.desc}</p>
                  </div>
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 text-center">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-[var(--text-tertiary)]">{step.statKey}</p>
                    <p className="mt-1.5 text-sm font-medium text-[var(--accent)]">{step.statValue}</p>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <p className="mt-3 text-right text-xs text-[var(--text-tertiary)]">
          † Based on early beta user reports. Results vary by market and outreach effort.
        </p>

        {/* ── Scoring explainer — surfaced from FAQ for prominence ────────────── */}
        <motion.div
          {...anim(0.45)}
          className="mt-10 mx-auto max-w-2xl"
        >
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-tint)] text-[var(--accent)]">
                <Info className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  How opportunity scoring works
                </h3>
                <p className="mt-2 text-sm leading-7 text-[var(--text-secondary)]">
                  Every lead gets a single <strong className="text-[var(--text-primary)]">0–100 opportunity score</strong> that
                  combines website weakness with business viability. The higher the score, the hotter the lead.
                </p>

                {/* Tier indicators */}
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-3 text-center">
                    <span className="inline-flex items-center justify-center h-2 w-2 rounded-full bg-[var(--score-high)]" />
                    <p className="mt-1.5 text-xs font-semibold text-[var(--text-primary)]">Below 40</p>
                    <p className="text-[11px] text-[var(--text-tertiary)]">Low opportunity</p>
                  </div>
                  <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-3 text-center">
                    <span className="inline-flex items-center justify-center h-2 w-2 rounded-full bg-[var(--score-mid)]" />
                    <p className="mt-1.5 text-xs font-semibold text-[var(--text-primary)]">40–69</p>
                    <p className="text-[11px] text-[var(--text-tertiary)]">Medium opportunity</p>
                  </div>
                  <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-3 text-center">
                    <span className="inline-flex items-center justify-center h-2 w-2 rounded-full bg-[var(--score-good)]" />
                    <p className="mt-1.5 text-xs font-semibold text-[var(--text-primary)]">70+</p>
                    <p className="text-[11px] text-[var(--text-tertiary)]">High opportunity</p>
                  </div>
                </div>

                <p className="mt-3 text-xs leading-6 text-[var(--text-tertiary)]">
                  Agencies report that leads with a score above 70 convert at <strong className="text-[var(--text-primary)]">3× the rate</strong> of those below 30.
                  Use it to prioritise — not to disqualify.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
