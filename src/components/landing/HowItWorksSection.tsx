"use client";

import { Search, Target, Mail, TrendingUp, Info } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { SectionLabel } from "@/components/landing/SectionLabel";
import { SectionTitle } from "@/components/landing/SectionTitle";
import { SectionSub } from "@/components/landing/SectionSub";
import { motion, useReducedMotion } from "@/lib/motion";

const HIERARCHY = [
  {
    number: "01",
    title: "Find opportunities",
    desc: "Enter a city + business category. Nearsited surfaces hyperlocal businesses with no website, social-only presence, or weak websites, ranked by opportunity score, not alphabetically.",
    icon: Search,
  },
  {
    number: "02",
    title: "Understand the gap",
    desc: "Every lead gets an opportunity score (0–100) backed by website presence, performance, mobile, SEO, design, and trust analysis. The higher the score, the hotter the lead. Drill into the issues to see exactly what to pitch.",
    icon: Target,
  },
  {
    number: "03",
    title: "Generate outreach",
    desc: "One click generates a personalised pitch tailored to the opportunity type: website build, redesign, or improvement. Adjust tone, copy, and send.",
    icon: Mail,
  },
  {
    number: "04",
    title: "Win more website projects",
    desc: "Track every lead through a pipeline: New → Contacted → In Conversation → Won. Whether it's a new build or a redesign, close it without spreadsheets.",
    icon: TrendingUp,
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
    <section id="how" className="border-t border-[var(--color-border-subtle)] py-14 md:py-24">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <SectionLabel>The workflow</SectionLabel>
          <SectionTitle className="text-center">Four steps to your next website project.</SectionTitle>
          <SectionSub className="mx-auto text-center">
            From finding the right lead to closing the deal, every step is designed to remove friction and shorten your sales cycle.
          </SectionSub>
        </div>

        {/* Flush step list */}
        <div className="mt-14 mx-auto max-w-3xl divide-y divide-[var(--border)]">
          {HIERARCHY.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.number}
                {...anim(i * 0.1)}
                className="flex gap-6 py-8 first:pt-0 last:pb-0"
              >
                {/* Number */}
                <span className="shrink-0 text-[2.5rem] font-medium italic tracking-[-0.04em] text-[var(--color-text-tertiary)]/40 leading-none w-12 text-right">
                  {step.number}
                </span>

                {/* Body */}
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex items-center gap-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <h3 className="text-[15px] font-medium text-[var(--color-text-primary)]">{step.title}</h3>
                  </div>
                  <p className="text-sm leading-7 text-[var(--color-text-secondary)]">{step.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Scoring explainer */}
        <motion.div {...anim(0.45)} className="mt-12 mx-auto max-w-2xl">
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] p-6">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
                <Info className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                  How opportunity scoring works
                </h3>
                <p className="mt-2 text-sm leading-7 text-[var(--color-text-secondary)]">
                  Every lead gets a single <strong className="text-[var(--color-text-primary)]">0–100 opportunity score</strong> that
                  combines website weakness with business viability. The higher the score, the hotter the lead.
                </p>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {[
                    { color: "var(--score-high)", range: "< 40", label: "Low" },
                    { color: "var(--score-mid)", range: "40–69", label: "Medium" },
                    { color: "var(--score-good)", range: "70+", label: "High" },
                  ].map(({ color, range, label }) => (
                    <div key={label} className="rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] px-2 py-2.5 flex flex-col items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ background: color }} />
                      <p className="text-xs font-semibold text-[var(--color-text-primary)] leading-none">{range}</p>
                      <p className="text-[10px] text-[var(--color-text-tertiary)] leading-none">{label}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs leading-6 text-[var(--color-text-tertiary)]">
                  Use the score to prioritise, not to disqualify. A low score just means a different kind of pitch.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="mt-10 text-center">
          <Link href="/signup">
            <Button variant="primary" icon={<Search className="h-4 w-4" />} className="px-8 py-3 text-base">
              Find your first opportunity
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
