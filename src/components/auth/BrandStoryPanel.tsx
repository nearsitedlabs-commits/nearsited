"use client";

import { Search, BarChart3, Mail, ListFilter, Check } from "lucide-react";
import OpportunityPreviewCard from "./OpportunityPreviewCard";

const FEATURES = [
  { icon: Search, text: "Discover local businesses ready for redesign" },
  { icon: BarChart3, text: "AI-powered website audits with actionable scores" },
  { icon: Mail, text: "Personalised outreach pitches in one click" },
  { icon: ListFilter, text: "Opportunity tracking pipeline from lead to won" },
] as const;

export default function BrandStoryPanel() {
  return (
    <div className="relative z-10 flex h-full flex-col justify-between px-12 py-16 lg:px-16 xl:px-20">
      <div className="space-y-10">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/20 bg-[var(--accent-tint)] px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--accent)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
            AI-Powered Opportunity Intelligence
          </span>
        </div>

        <div className="space-y-4">
          <h1 className="text-[clamp(2.5rem,4vw,3.8rem)] font-medium leading-[0.92] tracking-[-0.04em] text-[var(--text-primary)]">
            Find what others{" "}
            <em className="italic text-[var(--accent)] not-italic">overlook.</em>
          </h1>
          <p className="max-w-md text-base leading-7 text-[var(--text-secondary)]">
            Nearsited helps agencies discover redesign opportunities,
            understand weaknesses, generate personalised outreach, and win
            more projects.
          </p>
        </div>

        <ul className="space-y-3">
          {FEATURES.map((f) => (
            <li key={f.text} className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent-tint)]">
                <Check className="h-3 w-3 text-[var(--accent)]" />
              </span>
              {f.text}
            </li>
          ))}
        </ul>
      </div>

      <div className="my-10">
        <OpportunityPreviewCard />
      </div>

    </div>
  );
}
