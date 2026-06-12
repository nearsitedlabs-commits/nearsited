"use client";

import React from "react";
import { motion, AnimatePresence, useReducedMotion } from "@/lib/motion";
import { ChevronDown, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SectionLabel } from "@/components/landing/SectionLabel";
import { SectionTitle } from "@/components/landing/SectionTitle";
import { SectionSub } from "@/components/landing/SectionSub";
import { useAccordion } from "@/lib/shared-hooks";

type Objection = {
  objection: string;
  response: React.ReactNode;
  answer: string;
};

const OBJECTIONS: Objection[] = [
  {
    objection: "I already have enough clients.",
    response: "Great. Then you know the value of a warm pipeline. Nearsited lets you cherry-pick the best opportunities without cold outreach. Keep your pipeline full so you never have a slow month.",
    answer: "How this helps you close more deals: A full pipeline means you can fire underpaying clients and replace them with better projects.",
  },
  {
    objection: "Isn't this just another tool I'll never use?",
    response: "Nearsited takes under 2 minutes to get your first lead. No onboarding calls, no setup. Enter a city + category → get ranked leads → pitch. If you don't find a pitchable lead in your first search, you won't pay.",
    answer: "How this helps you close more deals: Speed to first lead is under 2 minutes. If it doesn't work, you owe nothing.",
  },
  {
    objection: "I can find leads myself on Google Maps.",
    response: (
      <div className="space-y-3">
        <p>Google Maps is a directory. It shows you businesses, but can&rsquo;t tell you which ones have no website, which have a 4-second load time, or which are running entirely off Instagram.</p>
        <p className="font-medium text-[var(--color-text-primary)]">What Maps can&rsquo;t do:</p>
        <ul className="list-disc space-y-1 pl-4">
          <li>Filter for businesses with no website, social-only, or platform-only presence</li>
          <li>Rank 50+ businesses by opportunity score in seconds</li>
          <li>Analyse performance, SEO, mobile, design, and trust to back that score</li>
          <li>Generate a personalised pitch for each opportunity type</li>
        </ul>
        <p>Maps is the starting point. Nearsited turns that data into ranked, pitchable leads.</p>
      </div>
    ),
    answer: "How this helps you close more deals: Maps gives you a list. Nearsited gives you a prioritised pipeline with evidence-based pitches. That's the difference between prospecting taking 3 hours vs. 10 minutes.",
  },
  {
    objection: "The local businesses I'd pitch don't rank on Google anyway.",
    response: "Some of your best prospects aren't on Google at all. They have no website, or they're running everything from an Instagram page. Nearsited finds those businesses too. For the ones that do have a website, you're pitching revenue recovery from real, measurable problems, not vague SEO promises.",
    answer: "How this helps you close more deals: You're pitching a clear gap they already have. Much easier to say yes to than ranking promises.",
  },
  {
    objection: "I don't do cold outreach.",
    response: "This isn't cold outreach. Every opportunity on Nearsited has a clear, measurable gap — whether that's a broken website or no website at all. You're not guessing. You're responding to evidence they can see themselves. It's warm.",
    answer: "How this helps you close more deals: You're reaching out with a diagnosis, not a pitch. That's a completely different conversation.",
  },
  {
    objection: "I already use Apollo or Hunter for prospecting.",
    response: "Apollo and Hunter find contact details. They don't tell you whether a business's website is worth redesigning — or whether one even exists. Nearsited finds a different kind of lead: businesses where the website itself is the gap. No website, social-only, platform-only, or a broken site. You're not blasting emails. You're reaching out with a diagnosis.",
    answer: "How this helps you close more deals: Apollo gives you email addresses. Nearsited gives you reasons to reach out. Used together, they're a complete prospecting stack. Find the gap with Nearsited, send the message with Apollo.",
  },
];

export function ObjectionsSection({ navigate }: { navigate: (href: string) => void }) {
  const { openIndex, toggle } = useAccordion();
  const prefersReducedMotion = useReducedMotion() ?? true;

  return (
    <section className="border-t border-[var(--color-border-subtle)] py-14 md:py-24">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <SectionLabel>Objections</SectionLabel>
          <SectionTitle className="text-center">What&rsquo;s stopping you?</SectionTitle>
          <SectionSub className="mx-auto text-center">
            We hear these objections every week. Here&rsquo;s the honest answer for each one.
          </SectionSub>
        </div>

        <div className="mt-10 mx-auto max-w-3xl space-y-3">
          {OBJECTIONS.map((item, i) => (
            <div
              key={item.objection}
              className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] overflow-hidden"
            >
              <button
                onClick={() => toggle(i)}
                aria-expanded={openIndex === i}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
              >
                <span className="text-sm font-medium text-[var(--color-text-primary)]">{item.objection}</span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-[var(--color-text-tertiary)] transition-transform duration-200 ${
                    openIndex === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              {prefersReducedMotion ? (
                openIndex === i && (
                  <div className="border-t border-[var(--color-border-subtle)] px-6 pb-6 pt-4 space-y-3">
                    <p className="text-sm leading-7 text-[var(--color-text-secondary)]">{item.response}</p>
                    <div className="flex items-start gap-2 rounded-[var(--radius-sm)] bg-[var(--color-accent)]/10 p-3">
                      <ArrowUpRight className="h-4 w-4 mt-0.5 text-[var(--color-accent)] shrink-0" />
                      <p className="text-sm text-[var(--color-text-primary)] font-medium">{item.answer}</p>
                    </div>
                  </div>
                )
              ) : (
                <AnimatePresence initial={false}>
                  {openIndex === i && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-[var(--color-border-subtle)] px-6 pb-6 pt-4 space-y-3">
                        <div className="text-sm leading-7 text-[var(--color-text-secondary)]">{item.response}</div>
                        <div className="flex items-start gap-2 rounded-[var(--radius-sm)] bg-[var(--color-accent)]/10 p-3">
                          <ArrowUpRight className="h-4 w-4 mt-0.5 text-[var(--color-accent)] shrink-0" />
                          <p className="text-sm text-[var(--color-text-primary)] font-medium">{item.answer}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <p className="text-sm text-[var(--color-text-secondary)] mb-4">Still have objections? The best way to answer them is to try it.</p>
          <Button variant="primary" onClick={() => navigate("/signup")} className="px-8 py-3 text-base">
            Try Nearsited free →
          </Button>
        </div>
      </div>
    </section>
  );
}
