"use client";

import { Check, X } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { SectionLabel } from "@/components/landing/SectionLabel";
import { SectionTitle } from "@/components/landing/SectionTitle";
import { SectionSub } from "@/components/landing/SectionSub";
import { FadeUp, StaggerContainer, fadeUpVariants } from "@/lib/motion";

type ComparisonRow = {
  task: string;
  manual: string;
  nearsited: string;
  advantage: "check" | "x";
};

const ROWS: ComparisonRow[] = [
  {
    task: "Find businesses",
    manual: "Browse Google Maps (30min)",
    nearsited: "Automated search (30s)",
    advantage: "check",
  },
  {
    task: "Check website status",
    manual: "Open each site (10min)",
    nearsited: "Classified instantly",
    advantage: "check",
  },
  {
    task: "Run performance audit",
    manual: "PageSpeed manually (5min/ea)",
    nearsited: "Automated + cached",
    advantage: "check",
  },
  {
    task: "Analyze design quality",
    manual: "Manual review (15min)",
    nearsited: "AI vision analysis",
    advantage: "check",
  },
  {
    task: "Write outreach pitch",
    manual: "Hours of writing",
    nearsited: "AI-generated in seconds",
    advantage: "check",
  },
];

export function CompetitorComparisonSection({
  navigate,
}: {
  navigate: (href: string) => void;
}) {
  const prefersReducedMotion = useReducedMotion();

  const content = (
    <>
      {/* Section header */}
      <div className="mx-auto max-w-2xl text-center">
        <SectionLabel>The smarter way</SectionLabel>
        <SectionTitle className="text-center">
          Manual prospecting vs. Nearsited.
        </SectionTitle>
        <SectionSub className="mx-auto text-center">
          Most agencies spend 3–5 hours per week on prospecting. Here&rsquo;s
          how Nearsited cuts that down to minutes.
        </SectionSub>
      </div>

      {/* Comparison table */}
      <div className="mx-auto mt-12 max-w-4xl overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-surface)]">
        {/* Table header */}
        <div className="grid grid-cols-3 gap-0 border-b border-[var(--border)] bg-[var(--bg-elevated)]">
          <div className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
            Task
          </div>
          <div className="border-x border-[var(--border)] px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
            Manual Process
          </div>
          <div className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[var(--accent)]">
            Nearsited
          </div>
        </div>

        {/* Table rows */}
        <StaggerContainer>
        {ROWS.map((row, i) => (
          <motion.div
            key={row.task}
            variants={fadeUpVariants}
            className={`grid grid-cols-3 gap-0 ${
              i < ROWS.length - 1 ? "border-b border-[var(--border)]" : ""
            }`}
          >
            <div className="flex items-center gap-3 px-5 py-4">
              <div
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                  row.advantage === "check"
                    ? "bg-[var(--accent)]/10 text-[var(--accent)]"
                    : "bg-[var(--score-high)]/10 text-[var(--score-high)]"
                }`}
              >
                {row.advantage === "check" ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <X className="h-3.5 w-3.5" />
                )}
              </div>
              <span className="text-sm font-medium text-[var(--text-primary)]">
                {row.task}
              </span>
            </div>
            <div className="flex items-center border-x border-[var(--border)] px-5 py-4">
              <span className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <X className="h-3.5 w-3.5 text-[var(--score-high)]" />
                {row.manual}
              </span>
            </div>
            <div className="flex items-center px-5 py-4">
              <span className="flex items-center gap-2 text-sm font-medium text-[var(--accent)]">
                <Check className="h-3.5 w-3.5" />
                {row.nearsited}
              </span>
            </div>
          </motion.div>
        ))}
        </StaggerContainer>
      </div>

      {/* CTA */}
      <div className="mt-10 text-center">
        <Button
          variant="primary"
          onClick={() => navigate("/signup")}
          className="px-8 py-3 text-base"
        >
          Start finding leads →
        </Button>
      </div>
    </>
  );

  return (
    <section className="border-t border-[var(--border)] py-24">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        {prefersReducedMotion ? content : <FadeUp>{content}</FadeUp>}
      </div>
    </section>
  );
}
