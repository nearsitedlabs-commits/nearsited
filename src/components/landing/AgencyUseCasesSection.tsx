"use client";

import { Users, Building2, Palette, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SectionLabel } from "@/components/landing/SectionLabel";
import { SectionTitle } from "@/components/landing/SectionTitle";
import { SectionSub } from "@/components/landing/SectionSub";
import { StaggerContainer, FadeUp } from "@/lib/motion";
import { useReducedMotion } from "@/lib/motion";

const USE_CASES = [
  {
    icon: Users,
    title: "Solo freelancers",
    desc: "Stop spending 10 hours/week prospecting. Surface qualified leads in seconds — no-website, social-only, and weak websites — pitch with evidence, and close new projects without cold outreach.",
    stat: "Avg. 3 new clients/month*",
    cta: "Start as a solo",
  },
  {
    icon: Building2,
    title: "Small agencies",
    desc: "Replace cold email with warm, evidence-based outreach. Give your team a pipeline of scored opportunities with ready-to-send pitches tailored to each opportunity type.",
    stat: "2–3× faster sales cycle*",
    cta: "Start as an agency",
  },
  {
    icon: Palette,
    title: "Design studios",
    desc: "Turn your portfolio into prospecting fuel. Find businesses with dated visual design, check their opportunity score, and walk into discovery calls with real evidence — not guesses.",
    stat: "Evidence-led pitches",
    cta: "Start finding clients",
  },
  {
    icon: TrendingUp,
    title: "SEO agencies",
    desc: "Find businesses with poor PageSpeed, missing local SEO, and no SSL — ranked by opportunity score so you know exactly who to call first. Pitch with real data in under 2 minutes.",
    stat: "4–7 technical issues per lead",
    cta: "Start finding leads",
  },
];

export function AgencyUseCasesSection({ navigate }: { navigate: (href: string) => void }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section id="usecases" className="scroll-mt-20 border-t border-[var(--border)] py-14 md:py-24">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <SectionLabel>Who it&rsquo;s for</SectionLabel>
          <SectionTitle className="text-center">Built for agencies that prospect locally.</SectionTitle>
          <SectionSub className="mx-auto text-center">
            Whether you&rsquo;re a solo freelancer, a small agency, or a specialist studio — the workflow is the same. Find the gap. Pitch the fix. Close the project.
          </SectionSub>
        </div>

        {prefersReducedMotion ? (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {USE_CASES.map((uc) => {
              const Icon = uc.icon;
              return (
                <Card key={uc.title} variant="interactive" padding="lg" className="flex flex-col">
                  <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-tint)] text-[var(--accent)]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-medium text-[var(--text-primary)]">{uc.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-7 text-[var(--text-secondary)]">{uc.desc}</p>
                  <div className="mt-6 border-t border-[var(--border)] pt-4">
                    <p className="text-xs text-[var(--accent)] font-medium mb-3">{uc.stat}</p>
                    <Button variant="primary" className="w-full" onClick={() => navigate("/signup")}>
                      {uc.cta} →
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <StaggerContainer className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {USE_CASES.map((uc) => {
              const Icon = uc.icon;
              return (
                <FadeUp key={uc.title} className="h-full">
                  <Card variant="interactive" padding="lg" className="h-full flex flex-col">
                    <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-tint)] text-[var(--accent)]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-medium text-[var(--text-primary)]">{uc.title}</h3>
                    <p className="mt-2 flex-1 text-sm leading-7 text-[var(--text-secondary)]">{uc.desc}</p>
                    <div className="mt-6 border-t border-[var(--border)] pt-4">
                      <p className="text-xs text-[var(--accent)] font-medium mb-3">{uc.stat}</p>
                      <Button variant="primary" className="w-full" onClick={() => navigate("/signup")}>
                        {uc.cta} →
                      </Button>
                    </div>
                  </Card>
                </FadeUp>
              );
            })}
          </StaggerContainer>
        )}
        <p className="mt-6 text-center text-xs text-[var(--text-tertiary)]">
          * Based on early beta user reports. Results vary by market, business type, and outreach effort.
        </p>
      </div>
    </section>
  );
}
