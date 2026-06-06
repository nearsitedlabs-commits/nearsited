"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Search, ExternalLink, Check, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ScoreRing } from "@/components/ui/ScoreRing";

const CanvasBackground = dynamic(
  () => import("@/components/ui/CanvasBackground").then((mod) => ({ default: mod.CanvasBackground })),
  { ssr: false },
);

export function LandingHero({ navigate }: { navigate: (href: string) => void }) {
  const easeOut = [0.25, 0.1, 0.25, 1] as const;
  const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: 16 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.4, delay, ease: easeOut },
  });

  return (
    <section id="hero" className="relative mx-auto grid min-h-[calc(100svh-var(--nav-height,80px))] items-center max-w-7xl gap-12 px-6 py-16 md:grid-cols-2 md:px-8 md:py-20 lg:px-10">
      <CanvasBackground />

      {/* Left: Copy */}
      <div className="relative z-10 flex flex-col justify-center space-y-6">
        <motion.div {...fadeUp(0)}>
          <Badge color="indigo" dot>
            Find businesses that need websites
          </Badge>
        </motion.div>

        <motion.div {...fadeUp(0.1)} className="space-y-5">
          <h1 className="text-[clamp(2.8rem,5.5vw,5.5rem)] font-medium tracking-[-0.04em] leading-[0.92] text-[var(--text-primary)]">
            Your next client is out there
            <br />
            <em className="italic not-italic">without a website.</em>
          </h1>
          <p className="max-w-xl text-lg leading-8 text-[var(--text-secondary)]">
            Nearsited finds hyperlocal businesses with <strong className="text-[var(--text-primary)] font-medium">no website</strong>, social-only presence, platform-only listings, or weak websites — ranks them by opportunity score, and generates a tailored pitch for each type in under 2 minutes.
          </p>
        </motion.div>

        <motion.div {...fadeUp(0.2)} className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
          <Button
            variant="primary"
            icon={<Search className="h-4 w-4" />}
            onClick={() => navigate("/signup")}
            className="w-full px-6 py-3 text-base sm:w-auto"
          >
            Find your first opportunity
          </Button>
          <Button
            variant="secondary"
            icon={<ExternalLink className="h-4 w-4" />}
            onClick={() => document.getElementById("how")?.scrollIntoView({ behavior: "smooth" })}
            className="w-full px-6 py-3 text-base sm:w-auto"
          >
            See how agencies win
          </Button>
        </motion.div>

        <motion.div {...fadeUp(0.3)} className="flex flex-wrap items-center gap-6 text-sm text-[var(--text-tertiary)]">
          <span className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[var(--accent)]" />No credit card</span>
          <span className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[var(--accent)]" />Audit 10 businesses free</span>
          <span className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[var(--accent)]" />Cancel anytime</span>
          <span className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[var(--accent)]" />249 business types</span>
        </motion.div>
      </div>

      {/* Right: Mixed opportunity feed */}
      <motion.div
        className="relative z-10 flex items-center justify-center"
        initial={{ opacity: 0, x: 60 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <div className="relative w-full max-w-[440px]">
          <Card variant="default" padding="lg" className="border-[var(--border-strong)]">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--text-tertiary)]">Discovered opportunities · Dubai</p>
              <Badge color="green" dot>Live scan</Badge>
            </div>

            {/* Opportunity rows */}
            <div className="space-y-2.5">
              {/* No Website */}
              <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3">
                <ScoreRing score={85} size={32} variant="estimate" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--text-primary)]">Marina Legal Consultants</p>
                  <p className="text-xs text-[var(--text-tertiary)]">Dubai Marina · Legal</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="inline-flex items-center gap-1 rounded-full border border-[var(--score-high)]/30 bg-[var(--score-high)]/10 px-2 py-0.5 text-[10px] font-semibold text-[var(--score-high)]">
                    No Website
                  </span>
                  <span className="text-[10px] text-[var(--score-good)]">$2,000–$6,000</span>
                </div>
              </div>

              {/* Social Only */}
              <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3">
                <ScoreRing score={72} size={32} variant="estimate" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--text-primary)]">Blue Wave Restaurant</p>
                  <p className="text-xs text-[var(--text-tertiary)]">JBR · Food & Beverage</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="inline-flex items-center gap-1 rounded-full border border-[var(--score-mid)]/30 bg-[var(--score-mid)]/10 px-2 py-0.5 text-[10px] font-semibold text-[var(--score-mid)]">
                    Social Only
                  </span>
                  <span className="text-[10px] text-[var(--score-good)]">$1,500–$4,000</span>
                </div>
              </div>

              {/* Weak Website */}
              <div className="flex items-center gap-3 rounded-xl border border-[var(--accent)]/20 bg-[var(--accent-tint)] px-4 py-3">
                <ScoreRing score={72} size={32} variant="estimate" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--text-primary)]">Bright Smile Dental</p>
                  <p className="text-xs text-[var(--text-tertiary)]">Jumeirah · Healthcare</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="inline-flex items-center gap-1 rounded-full border border-[var(--score-mid)]/30 bg-[var(--score-mid)]/10 px-2 py-0.5 text-[10px] font-semibold text-[var(--score-mid)]">
                    Weak Website
                  </span>
                  <span className="text-[10px] text-[var(--score-good)]">$1,000–$3,000</span>
                </div>
              </div>
            </div>

            {/* Pitch preview */}
            <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
              <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
                <MessageSquare className="h-3 w-3 text-[var(--accent)]" />
                AI pitch — ready to send
              </div>
              <p className="text-sm leading-7 text-[var(--text-secondary)] italic">
                &ldquo;Hi — I noticed Marina Legal has great reviews but no website. You&rsquo;re invisible to clients searching Google. I build legal websites that turn your reputation into new enquiries.&rdquo;
              </p>
              <div className="mt-3 flex flex-wrap gap-2 border-t border-[var(--border)] pt-3">
                <Button variant="secondary" className="flex-1 text-xs">View report</Button>
                <Button variant="primary" onClick={() => navigate("/signup")} className="flex-1 text-xs">Copy pitch →</Button>
              </div>
            </div>
          </Card>
        </div>
      </motion.div>
    </section>
  );
}
