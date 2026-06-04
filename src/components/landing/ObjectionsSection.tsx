"use client";

import { ChevronDown, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SectionLabel } from "@/components/landing/SectionLabel";
import { SectionTitle } from "@/components/landing/SectionTitle";
import { SectionSub } from "@/components/landing/SectionSub";
import { useAccordion } from "@/lib/shared-hooks";

const OBJECTIONS = [
  {
    objection: "I already have enough clients.",
    response: "Great — then you know the value of a warm pipeline. Nearsited lets you cherry-pick the best opportunities without cold outreach. Keep your pipeline full so you never have a slow month.",
    answer: "How this helps you close more deals: A full pipeline means you can fire underpaying clients and replace them with better projects.",
  },
  {
    objection: "Isn't this just another tool I'll never use?",
    response: "Nearsited takes 3 minutes to get your first lead. No onboarding calls, no setup. Enter a city + category → get ranked leads → pitch in under 2 minutes. If you don't find a pitchable lead in your first search, you won't pay.",
    answer: "How this helps you close more deals: Speed to first lead is under 3 minutes. If it doesn't work, you owe nothing.",
  },
  {
    objection: "I can find leads myself on Google Maps.",
    response: "Google Maps shows you businesses that have websites. It can't show you businesses with no website, social-only presence, or platform-only listings — those are often your highest-value leads. And even for businesses with websites, you can't audit 50 in 3 seconds, rank them by opportunity, and generate personalised pitches.",
    answer: "How this helps you close more deals: You find opportunities Google Maps literally cannot show you. That's a different market.",
  },
  {
    objection: "My clients aren't on page 1 of Google anyway.",
    response: "Some of your best prospects aren't on Google at all — they have no website, or they're running everything from an Instagram page. Nearsited finds those businesses too. For the ones that do have a website, you're pitching revenue recovery from real, measurable problems — not vague SEO promises.",
    answer: "How this helps you close more deals: You're pitching a clear gap they already have. Much easier to say yes to than ranking promises.",
  },
  {
    objection: "I don't do cold outreach.",
    response: "This isn't cold outreach. Every opportunity on Nearsited has a clear, measurable gap — whether that's a broken website or no website at all. You're not guessing — you're responding to evidence they can see themselves. It's warm.",
    answer: "How this helps you close more deals: Evidence-based outreach converts 3–5× better than cold email. You're helping, not selling.",
  },
];

export function ObjectionsSection({ navigate }: { navigate: (href: string) => void }) {
  const { openIndex, toggle } = useAccordion();

  return (
    <section className="border-t border-[var(--border)] py-24">
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
              className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden transition-all duration-200"
            >
              <button
                onClick={() => toggle(i)}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
              >
                <span className="text-sm font-medium text-[var(--text-primary)]">{item.objection}</span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-[var(--text-tertiary)] transition-transform duration-200 ${
                    openIndex === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openIndex === i && (
                <div className="border-t border-[var(--border)] px-6 pb-6 pt-4 space-y-3">
                  <p className="text-sm leading-7 text-[var(--text-secondary)]">{item.response}</p>
                  <div className="flex items-start gap-2 rounded-lg bg-[var(--accent-tint)] p-3">
                    <ArrowUpRight className="h-4 w-4 mt-0.5 text-[var(--accent)] shrink-0" />
                    <p className="text-sm text-[var(--text-primary)] font-medium">{item.answer}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <p className="text-sm text-[var(--text-secondary)] mb-4">Still have objections? The best way to answer them is to try it.</p>
          <Button variant="primary" onClick={() => navigate("/signup")} className="px-8 py-3 text-base">
            Try Nearsited free →
          </Button>
        </div>
      </div>
    </section>
  );
}
