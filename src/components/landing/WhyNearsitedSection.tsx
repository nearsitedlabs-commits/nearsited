"use client";

import { AlertTriangle, Zap, Check } from "lucide-react";
import { SectionLabel } from "@/components/landing/SectionLabel";
import { SectionTitle } from "@/components/landing/SectionTitle";
import { SectionSub } from "@/components/landing/SectionSub";
import { motion, useReducedMotion } from "@/lib/motion";

const TRADITIONAL_CONS = [
  "No way to find businesses that have no website at all",
  "Cannot discover social-only or platform-only businesses",
  "Manual website checking, one business at a time",
  "No prioritisation, you guess who to contact first",
  "Generic cold outreach with no supporting evidence",
  "No built-in pipeline. Spreadsheets or external CRM required.",
  "Hours of research before a single pitch is sent",
];

const NEARSITED_PROS = [
  "Finds businesses with no website, social-only, and platform-only presence",
  "Surfaces weak websites ranked by opportunity score, not quality score",
  "Every lead gets an estimated score instantly. Analyse only the best to save credits.",
  "Pitch angle changes completely per lead type. Not one generic template.",
  "Generates evidence-based pitches citing real audit data",
  "Built-in pipeline to track every lead from discovery to closed deal",
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
    <section id="why" className="scroll-mt-20 border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] py-14 md:py-24">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <SectionLabel>Why Nearsited</SectionLabel>
          <SectionTitle className="text-center">Other tools find bad websites. Nearsited finds every opportunity.</SectionTitle>
          <SectionSub className="mx-auto text-center">
            Most tools show you which sites score low. Nearsited goes further. It finds the businesses with <em>no website at all</em>, ranks by who&rsquo;s worth approaching (not just who has problems), and writes a different pitch for every lead type.
          </SectionSub>
        </div>

        <div className="mt-8 grid gap-4 md:mt-12 md:gap-6 md:grid-cols-2 md:items-stretch">
          {/* Traditional — subtle border, no fill (the pain) */}
          <motion.div {...anim(0)} className="h-full">
            <div className="h-full rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] px-6 py-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--score-high)]/10">
                  <AlertTriangle className="h-4 w-4 text-[var(--score-high)]" />
                </div>
                <h3 className="text-base font-medium text-[var(--color-text-secondary)]">Traditional prospecting</h3>
              </div>
              <ul className="space-y-3">
                {TRADITIONAL_CONS.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-[var(--color-text-secondary)] opacity-70">
                    <span className="mt-0.5 shrink-0 text-[var(--score-high)] font-bold">✕</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          {/* Nearsited — accent bg tint, no border (the resolution) */}
          <motion.div {...anim(0.1)} className="h-full">
            <div className="h-full rounded-[var(--radius-md)] bg-[var(--color-accent)]/[0.04] px-6 py-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-accent)]/10">
                  <Zap className="h-4 w-4 text-[var(--color-accent)]" />
                </div>
                <h3 className="text-base font-medium text-[var(--color-text-primary)]">Nearsited</h3>
              </div>
              <ul className="space-y-3">
                {NEARSITED_PROS.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-[var(--color-text-secondary)]">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-accent)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>

        {/* Lead type badges */}
        <div className="mt-6 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] p-4 md:mt-10 md:p-6">
          <p className="mb-3 text-center text-[0.65rem] uppercase tracking-[0.14em] text-[var(--color-text-tertiary)] md:mb-4 md:tracking-[0.18em]">
            Four opportunity types · all in one search
          </p>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
            {[
              { color: "var(--score-high)", label: "No Website", sub: "Biggest opportunity" },
              { color: "var(--score-mid)", label: "Social Only", sub: "Social-only presence" },
              { color: "var(--badge-indigo-text)", borderColor: "var(--badge-indigo-border)", bg: "var(--badge-indigo-bg)", label: "Platform Only", sub: "Third-party platform" },
              { color: "var(--accent)", label: "Weak Website", sub: "Redesign opportunity" },
            ].map((item) => (
              <motion.div key={item.label} {...anim(0)}>
                <div
                  className="flex flex-col gap-1 rounded-[var(--radius-sm)] border px-3 py-3 md:px-4 md:py-4"
                  style={{
                    borderColor: `${item.borderColor ?? item.color}30`,
                    backgroundColor: `${item.bg ?? item.color}12`,
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: item.color }} />
                    <span className="text-[13px] font-medium leading-tight md:text-[15px]" style={{ color: item.color }}>{item.label}</span>
                  </div>
                  <span className="text-[10px] leading-snug text-[var(--color-text-tertiary)] md:text-[11px]">{item.sub}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
