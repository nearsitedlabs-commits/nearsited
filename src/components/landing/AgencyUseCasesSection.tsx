"use client";

import { Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SectionLabel } from "@/components/landing/SectionLabel";
import { SectionTitle } from "@/components/landing/SectionTitle";
import { SectionSub } from "@/components/landing/SectionSub";

const USE_CASES = [
  {
    icon: UserIcon,
    title: "Solo freelancers",
    desc: "Stop spending 10 hours/week prospecting. Surface 20–60 qualified leads in 3 seconds — no-website businesses, social-only, platform-only, and weak websites — pitch with evidence, and close 2–3 new projects per month.",
    stat: "Avg. 3 new clients/month",
    cta: "Start as a solo",
  },
  {
    icon: Users,
    title: "Small agencies",
    desc: "Replace cold email with warm, evidence-based outreach. Give your team a pipeline of scored opportunities — new builds and redesigns — with ready-to-send pitches. Close more, faster.",
    stat: "2–3× faster sales cycle",
    cta: "Start as an agency",
  },
];

function UserIcon() {
  return <Users className="h-5 w-5" />;
}

export function AgencyUseCasesSection({ navigate }: { navigate: (href: string) => void }) {
  return (
    <section className="border-t border-[var(--border)] py-24">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <SectionLabel>Who it&rsquo;s for</SectionLabel>
          <SectionTitle className="text-center">Agency use cases that close deals.</SectionTitle>
          <SectionSub className="mx-auto text-center">
            Whether you&rsquo;re a solo freelancer or running a small agency, the workflow is the same.
            The scale is different.
          </SectionSub>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 md:max-w-3xl md:mx-auto">
          {USE_CASES.map((uc) => {
            const Icon = uc.icon;
            return (
              <Card key={uc.title} variant="interactive" padding="lg" className="flex flex-col">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-tint)] text-[var(--accent)]">
                  <Icon />
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
      </div>
    </section>
  );
}
