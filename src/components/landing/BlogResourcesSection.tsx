"use client";

import { motion, useReducedMotion } from "framer-motion";
import { SectionLabel } from "@/components/landing/SectionLabel";
import { SectionTitle } from "@/components/landing/SectionTitle";
import { SectionSub } from "@/components/landing/SectionSub";
import { FadeUp, StaggerContainer, fadeUpVariants } from "@/lib/motion";
import { cn } from "@/lib/cn";

type BlogPost = {
  category: string;
  title: string;
  description: string;
  gradient: string;
};

const POSTS: BlogPost[] = [
  {
    category: "Finding Leads",
    title: "How to build a repeatable local business prospecting workflow",
    description:
      "Stop scrambling for leads. Learn how to build a repeatable system that surfaces local businesses actively looking for a new website.",
    gradient: "from-[var(--accent)]/20 via-[var(--bg-surface)] to-emerald-900/10",
  },
  {
    category: "Pitch Tips",
    title: "What we learned from analyzing 10,000+ business websites",
    description:
      "After auditing thousands of local business sites, patterns emerge. Here&rsquo;s what makes a business ready to say yes to a redesign.",
    gradient: "from-indigo-500/10 via-[var(--bg-surface)] to-[var(--accent)]/15",
  },
  {
    category: "Agency Growth",
    title: "Why hyperlocal targeting is the fastest way to grow your agency",
    description:
      "Forget competing nationally. The agencies winning right now dominate one neighbourhood, one niche, one city at a time.",
    gradient: "from-amber-500/10 via-[var(--bg-surface)] to-rose-500/10",
  },
];

export function BlogResourcesSection({
  navigate,
}: {
  navigate: (href: string) => void;
}) {
  const prefersReducedMotion = useReducedMotion();

  const content = (
    <>
      {/* Section header */}
      <div className="mx-auto max-w-2xl text-center">
        <SectionLabel>Resources</SectionLabel>
        <SectionTitle className="text-center">
          Guides, insights, and playbooks.
        </SectionTitle>
        <SectionSub className="mx-auto text-center">
          Tactical resources to help you find better leads, write pitches that
          convert, and grow your agency faster.
        </SectionSub>
      </div>

      {/* Blog post cards */}
      <StaggerContainer className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {POSTS.map((post) => (
          <motion.div
            key={post.title}
            variants={fadeUpVariants}
            className="group flex flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] transition-colors hover:border-[var(--border-strong)]"
          >
            {/* Gradient image placeholder */}
            <div
              className={cn(
                "relative aspect-[16/9] w-full bg-gradient-to-br",
                post.gradient,
              )}
            >
              {/* Subtle pattern overlay */}
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 1px 1px, var(--accent) 1px, transparent 0)",
                  backgroundSize: "20px 20px",
                }}
              />
            </div>

            {/* Card body */}
            <div className="flex flex-1 flex-col p-5">
              {/* Category tag */}
              <span className="mb-3 inline-block w-fit rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-[var(--accent)]">
                {post.category}
              </span>

              {/* Title */}
              <h3 className="text-base font-medium leading-snug text-[var(--text-primary)]">
                {post.title}
              </h3>

              {/* Description */}
              <p className="mt-2 flex-1 text-sm leading-6 text-[var(--text-secondary)]">
                {post.description}
              </p>

              {/* Read more link */}
              <button
                onClick={() => navigate("/resources")}
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--accent)] transition-colors hover:text-[var(--accent-hover)]"
              >
                Read more →
              </button>
            </div>
          </motion.div>
        ))}
      </StaggerContainer>

      {/* More guides coming soon */}
      <p className="mt-10 text-center text-sm text-[var(--text-tertiary)]">
        More guides coming soon
      </p>
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
