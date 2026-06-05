"use client";

import { AlertTriangle, Zap, Check } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { SectionLabel } from "@/components/landing/SectionLabel";
import { SectionTitle } from "@/components/landing/SectionTitle";
import { SectionSub } from "@/components/landing/SectionSub";
import { motion, useReducedMotion } from "framer-motion";

const TRADITIONAL_CONS = [
  "No way to find businesses that have no website at all",
  "Cannot discover social-only or platform-only businesses",
  "Manual website checking — one business at a time",
  "No prioritisation — you guess who to contact first",
  "Generic cold outreach with no supporting evidence",
  "No built-in pipeline — spreadsheets or external CRM required",
  "Hours of research before a single pitch is sent",
];

const NEARSITED_PROS = [
  "Finds businesses with no website, social-only, and platform-only presence",
  "Surfaces weak websites ranked by opportunity score — not quality score",
  "Opportunity score weighs both site weakness AND business viability",
  "Pitch angle changes completely per lead type — not one generic template",
  "Generates evidence-based pitches citing real audit data",
  "Built-in pipeline — track every lead from discovery to closed deal",
  "From search to pitch-ready lead in under 2 minutes",
];

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.4, delay, ease: [0.25, 0.1, 0.25, 1] as const },
});

export function WhyNearsitedSection() {
  const prefersReducedMotion = useReducedMotion();
  const anim = (d: number) => (prefersReducedMotion ? {} : fadeUp(d));

  return (
    <section id="why" className="scroll-mt-20 border-t border-[var(--border)] bg-[var(--bg-surface)] py-14 md:py-24">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <SectionLabel>Why Nearsited</SectionLabel>
          <SectionTitle className="text-center">Other tools find bad websites. Nearsited finds every opportunity.</SectionTitle>
          <SectionSub className="mx-auto text-center">
            Most tools show you which sites score low. Nearsited goes further — it finds the businesses with <em>no website at all</em>, ranks by who&rsquo;s worth approaching (not just who has problems), and writes a different pitch for every lead type.
          </SectionSub>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 md:items-stretch">
          {/* Traditional */}
          <motion.div {...anim(0)} className="h-full">
            <Card variant="default" padding="lg" className="h-full border-[var(--score-high)]/20">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--score-high)]/10">
                  <AlertTriangle className="h-4 w-4 text-[var(--score-high)]" />
                </div>
                <h3 className="text-base font-medium text-[var(--text-primary)]">Traditional prospecting</h3>
              </div>
              <ul className="space-y-3">
                {TRADITIONAL_CONS.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-[var(--text-secondary)]">
                    <span className="mt-0.5 shrink-0 text-[var(--score-high)] font-bold">✕</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </motion.div>

          {/* Nearsited */}
          <motion.div {...anim(0.1)} className="h-full">
            <Card variant="default" padding="lg" className="h-full border-[var(--accent)]/30">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-tint)]">
                  <Zap className="h-4 w-4 text-[var(--accent)]" />
                </div>
                <h3 className="text-base font-medium text-[var(--text-primary)]">Nearsited</h3>
              </div>
              <ul className="space-y-3">
                {NEARSITED_PROS.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-[var(--text-secondary)]">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </motion.div>
        </div>

        {/* Lead type badges */}
        <div className="mt-10 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6">
          <p className="mb-4 text-center text-[0.7rem] uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
            Four types of website opportunity — all found in one search
          </p>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <motion.div {...anim(0)} className="h-full">
              <div className="flex h-full flex-col justify-center gap-1 rounded-xl border border-[var(--score-high)]/30 bg-[var(--score-high)]/8 px-3 py-3 sm:flex-row sm:items-center sm:gap-2.5 sm:px-4 sm:py-2.5">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--score-high)]" />
                  <span className="text-sm font-medium text-[var(--score-high)]">No Website</span>
                </div>
                <span className="text-xs text-[var(--text-tertiary)]">Biggest opportunity</span>
              </div>
            </motion.div>
            <motion.div {...anim(0.05)} className="h-full">
              <div className="flex h-full flex-col justify-center gap-1 rounded-xl border border-[var(--score-mid)]/30 bg-[var(--score-mid)]/8 px-3 py-3 sm:flex-row sm:items-center sm:gap-2.5 sm:px-4 sm:py-2.5">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--score-mid)]" />
                  <span className="text-sm font-medium text-[var(--score-mid)]">Social Only</span>
                </div>
                <span className="text-xs text-[var(--text-tertiary)]">Renting on social</span>
              </div>
            </motion.div>
            <motion.div {...anim(0.1)} className="h-full">
              <div className="flex h-full flex-col justify-center gap-1 rounded-xl border border-[var(--badge-indigo-border)] bg-[var(--badge-indigo-bg)] px-3 py-3 sm:flex-row sm:items-center sm:gap-2.5 sm:px-4 sm:py-2.5">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--badge-indigo-text)]" />
                  <span className="text-sm font-medium text-[var(--badge-indigo-text)]">Platform Only</span>
                </div>
                <span className="text-xs text-[var(--text-tertiary)]">Dependent on third-party</span>
              </div>
            </motion.div>
            <motion.div {...anim(0.15)} className="h-full">
              <div className="flex h-full flex-col justify-center gap-1 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent-tint)] px-3 py-3 sm:flex-row sm:items-center sm:gap-2.5 sm:px-4 sm:py-2.5">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--accent)]" />
                  <span className="text-sm font-medium text-[var(--accent)]">Weak Website</span>
                </div>
                <span className="text-xs text-[var(--text-tertiary)]">Redesign opportunity</span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
