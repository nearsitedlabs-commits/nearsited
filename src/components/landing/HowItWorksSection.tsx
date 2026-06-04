"use client";

import { Search, Target, Mail, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { SectionLabel } from "@/components/landing/SectionLabel";
import { SectionTitle } from "@/components/landing/SectionTitle";
import { SectionSub } from "@/components/landing/SectionSub";

const HIERARCHY = [
  {
    number: "01",
    title: "Find opportunities",
    desc: "Enter a city + business category. Nearsited surfaces businesses with no website, social-only presence, or weak websites — ranked by opportunity score, not alphabetically.",
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
    statValue: "Agencies report 2–3× conversion",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how" className="border-t border-[var(--border)] py-24">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <SectionLabel>The workflow</SectionLabel>
          <SectionTitle className="text-center">Four steps to your next website project.</SectionTitle>
          <SectionSub className="mx-auto text-center">
            From finding the right lead to closing the deal — every step is designed to remove friction and shorten your sales cycle.
          </SectionSub>
        </div>

        <div className="mt-14 space-y-6">
          {HIERARCHY.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.number}>
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
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
