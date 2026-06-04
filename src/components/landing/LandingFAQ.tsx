"use client";

import { ChevronDown } from "lucide-react";
import { SectionLabel } from "@/components/landing/SectionLabel";
import { SectionTitle } from "@/components/landing/SectionTitle";
import { SectionSub } from "@/components/landing/SectionSub";
import { useAccordion } from "@/lib/shared-hooks";

const faqs = [
  {
    q: "How does Nearsited help me win more website projects?",
    a: "It removes the three biggest bottlenecks in agency sales: finding the right leads, knowing what to pitch, and writing outreach that gets replies. Nearsited finds businesses with no website, social-only presence, platform-only listings, and weak websites — then gives you evidence-based pitches for each. Instead of 10 hours prospecting, you spend 10 minutes.",
  },
  {
    q: "What kind of businesses does Nearsited find?",
    a: "Four types: businesses with no website at all (often the highest-value leads), social-only businesses running entirely off Instagram or Facebook, businesses listed only on third-party booking or delivery platforms (Fresha, Booksy, Deliveroo), and businesses with weak websites scoring below 60 on performance, mobile, SEO, design, or trust. Dentists, restaurants, lawyers, gyms, web agencies, hotels — 249 business types across 16 industries in any city.",
  },
  {
    q: "How accurate is the opportunity score?",
    a: "The opportunity score combines website weakness and business viability into a single 0–100 number — higher means a hotter lead. A business with a broken website and active Google reviews scores high because it's both pitchable and likely to respond. Agencies report that leads with an opportunity score above 70 convert at 3× the rate of those below 30. Use it to prioritise, not to disqualify.",
  },
  {
    q: "Do I need technical skills to use it?",
    a: "No. Enter a city and business type. Get ranked leads. Read the audit summary. Click to generate a pitch. If you can type two words and click a button, you can use Nearsited.",
  },
  {
    q: "What if there are no good opportunities in my city?",
    a: "That's extremely unlikely. Most cities have 40–60% of local businesses with below-average websites — and many more with no website at all. But if you run a search and genuinely find nothing pitchable, email us and we'll refund your unused credits. No questions.",
  },
  {
    q: "How is this different from cold email tools?",
    a: "Cold email tools blast generic messages and hope someone replies. Nearsited is the opposite: every pitch is personalised around a real online presence gap — no website, social-only, platform-only, or a broken site. You're not selling — you're showing them a problem they already have. That's why reply rates are 3–5× higher.",
  },
];

export function LandingFAQ() {
  const { openIndex, toggle } = useAccordion();

  return (
    <section id="faq" className="border-t border-[var(--border)] py-24">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center">
            <SectionLabel>FAQ</SectionLabel>
            <SectionTitle className="text-center">Questions about closing deals.</SectionTitle>
            <SectionSub className="mx-auto text-center">
              No fluff. No marketing speak. Just answers that help you decide if this works for your agency.
            </SectionSub>
          </div>

          <div className="mt-10 space-y-2">
            {faqs.map((faq, i) => (
              <div
                key={faq.q}
                className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden"
              >
                <button
                  onClick={() => toggle(i)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                >
                  <span className="text-sm font-medium text-[var(--text-primary)]">{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-[var(--text-tertiary)] transition-transform duration-200 ${
                      openIndex === i ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openIndex === i && (
                  <div className="border-t border-[var(--border)] px-6 pb-6 pt-4">
                    <p className="text-sm leading-7 text-[var(--text-secondary)]">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
