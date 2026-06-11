"use client";

import { Users, Building2, Palette, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SectionLabel } from "@/components/landing/SectionLabel";
import { SectionTitle } from "@/components/landing/SectionTitle";
import { SectionSub } from "@/components/landing/SectionSub";
import { StaggerContainer, FadeUp } from "@/lib/motion";
import { useReducedMotion } from "@/lib/motion";

const USE_CASES = [
  {
    icon: Users,
    title: "Solo freelancers",
    desc: "Stop spending hours prospecting. Surface qualified leads in seconds: no-website, social-only, and weak websites. Pitch with evidence, and close new projects without cold outreach.",
  },
  {
    icon: Building2,
    title: "Small agencies",
    desc: "Replace cold email with warm, evidence-based outreach. Give your team a pipeline of scored opportunities with ready-to-send pitches tailored to each opportunity type.",
    badge: "White-label shareable reports",
  },
  {
    icon: Palette,
    title: "Design studios",
    desc: "Turn your portfolio into prospecting fuel. Find businesses with dated visual design, check their opportunity score, and walk into discovery calls with real evidence, not guesses.",
  },
  {
    icon: TrendingUp,
    title: "SEO agencies",
    desc: "Find businesses with poor PageSpeed, missing local SEO, and no SSL, ranked by opportunity score so you know exactly who to call first. Pitch with real data in under 2 minutes.",
  },
];

export function AgencyUseCasesSection({ navigate }: { navigate: (href: string) => void }) {
  const prefersReducedMotion = useReducedMotion();

  const rows = USE_CASES.map((uc) => {
    const Icon = uc.icon;
    return (
      <div key={uc.title} className="flex gap-5 py-6 border-b border-[var(--color-border-subtle)] last:border-0">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
          <Icon className="h-4.5 w-4.5" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <h3 className="text-[15px] font-medium text-[var(--color-text-primary)]">{uc.title}</h3>
            {"badge" in uc && uc.badge && (
              <span className="inline-flex items-center rounded-[var(--radius-sm)] border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 px-2 py-0.5 text-[10px] font-medium text-[var(--color-accent)]">
                {uc.badge}
              </span>
            )}
          </div>
          <p className="text-sm leading-7 text-[var(--color-text-secondary)]">{uc.desc}</p>
        </div>
      </div>
    );
  });

  return (
    <section id="usecases" className="scroll-mt-20 border-t border-[var(--color-border-subtle)] py-14 md:py-24">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <SectionLabel>Who it&rsquo;s for</SectionLabel>
          <SectionTitle className="text-center">Built for agencies that prospect locally.</SectionTitle>
          <SectionSub className="mx-auto text-center">
            Whether you&rsquo;re a solo freelancer, a small agency, or a specialist studio, the workflow is the same. Find the gap. Pitch the fix. Close the project.
          </SectionSub>
        </div>

        <div className="mt-10 mx-auto max-w-2xl">
          {prefersReducedMotion ? (
            <div>{rows}</div>
          ) : (
            <StaggerContainer>{rows}</StaggerContainer>
          )}

          {prefersReducedMotion ? (
            <div className="mt-8 text-center">
              <Button variant="primary" className="px-8 py-3 text-base" onClick={() => navigate("/signup")}>
                Start finding clients →
              </Button>
            </div>
          ) : (
            <FadeUp className="mt-8 text-center">
              <Button variant="primary" className="px-8 py-3 text-base" onClick={() => navigate("/signup")}>
                Start finding clients →
              </Button>
            </FadeUp>
          )}
        </div>
      </div>
    </section>
  );
}
