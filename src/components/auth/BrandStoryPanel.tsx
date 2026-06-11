"use client";

import { Search, BarChart3, Mail, ListFilter, Check } from "lucide-react";
import { useReducedMotion } from "@/lib/motion";
import { StaggerContainer, FadeUp } from "@/lib/motion";
import OpportunityPreviewCard from "./OpportunityPreviewCard";

const FEATURES = [
  { icon: Search, text: "Discover businesses with weak, social-only, or no website" },
  { icon: BarChart3, text: "Score every lead by opportunity: performance, SEO, design, and trust analysed automatically" },
  { icon: Mail, text: "Generate personalised outreach pitches in one click" },
  { icon: ListFilter, text: "Track every opportunity from discovery to won project" },
] as const;

export default function BrandStoryPanel() {
  const prefersReduced = useReducedMotion();

  const content = (
    <div className="space-y-8">
      <FadeUp>
        <div>
          <span className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-accent)]/20 bg-[var(--color-accent)]/10 px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--color-accent)]">
            <span className="h-1.5 w-1.5 rounded-[var(--radius-sm)] bg-[var(--color-accent)]" />
            Find website opportunities
          </span>
        </div>
      </FadeUp>

      <FadeUp>
        <div className="space-y-4">
          <h1 className="text-[clamp(2.5rem,4vw,3.8rem)] font-medium leading-[0.92] tracking-[-0.04em] text-[var(--color-text-primary)]">
            Find what others{" "}
            <em className="italic text-[var(--color-accent)] not-italic">overlook.</em>
          </h1>
          <p className="max-w-md text-base leading-7 text-[var(--color-text-secondary)]">
            Nearsited finds businesses that need a stronger online presence:
            weak websites, social-only, or no website at all. Discover
            opportunities, understand what&rsquo;s missing, and generate
            personalised outreach, all in one place.
          </p>
        </div>
      </FadeUp>

      <FadeUp>
        <ul className="space-y-3">
          {FEATURES.map((f) => (
            <li key={f.text} className="flex items-center gap-3 text-sm text-[var(--color-text-secondary)]">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-accent)]/10">
                <Check className="h-3 w-3 text-[var(--color-accent)]" />
              </span>
              {f.text}
            </li>
          ))}
        </ul>
      </FadeUp>
    </div>
  );

  return (
    <div className="relative z-10 flex h-full flex-col justify-between px-12 py-16 lg:px-16 xl:px-20">
      <div>
        {prefersReduced ? (
          content
        ) : (
          <StaggerContainer>{content}</StaggerContainer>
        )}
      </div>

      <div className="my-10">
        <OpportunityPreviewCard />
      </div>

    </div>
  );
}