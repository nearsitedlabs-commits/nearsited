"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "@/lib/motion";
import { Search, ExternalLink, Check, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ScoreRing } from "@/components/ui/ScoreRing";

const CanvasBackground = dynamic(
  () => import("@/components/ui/CanvasBackground").then((mod) => ({ default: mod.CanvasBackground })),
  { ssr: false },
);

const OpportunityAtlas = dynamic(
  () => import("@/components/landing/atlas/OpportunityAtlas"),
  { ssr: false },
);

const OPP_TYPES = ["no_website", "social_only", "has_website"] as const; // eslint-disable-line @typescript-eslint/no-unused-vars
type OppType = (typeof OPP_TYPES)[number];

const PITCHES: Record<OppType, string> = {
  no_website: `"Hi, I noticed Marina Legal has great reviews but no website. You're invisible to clients searching Google. I build legal websites that turn your reputation into new enquiries."`,
  social_only: `"Hi, Blue Wave's Instagram looks great. But Instagram isn't a website. You don't own it and can't rank on Google. A website turns your followers into reservations you control."`,
  has_website: `"Hi, I analysed Bright Smile Dental's website and found 5 critical issues costing you patients. A redesign would improve your online presence and directly increase bookings."`,
};

export function LandingHero({ navigate }: { navigate: (href: string) => void }) {
  const [activeOpp, setActiveOpp] = useState<OppType>("no_website");
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(PITCHES[activeOpp]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  const easeOut = [0.25, 0.1, 0.25, 1] as const;
  const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: 16 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.4, delay, ease: easeOut },
  });

  return (
    <section id="hero" className="relative overflow-hidden" style={{ contentVisibility: "auto" }}>
      <OpportunityAtlas />
      <CanvasBackground />

      <div className="relative mx-auto grid max-w-7xl gap-12 px-6 pt-6 pb-16 md:min-h-[calc(100svh-var(--nav-height,80px))] md:grid-cols-2 md:items-center md:px-8 md:pt-8 md:pb-20 lg:px-10">

      {/* Left: Copy */}
      <div className="relative z-10 flex flex-col justify-center space-y-6">
        <motion.div {...fadeUp(0)} className="space-y-5">
          <h1 className="text-[var(--text-hero)] font-medium tracking-[-0.04em] leading-[0.92] text-[var(--color-text-primary)]">
            Your next client is out there
            <br />
            <em className="italic not-italic">without a website</em>
          </h1>
          <p className="max-w-xl text-base leading-7 text-[var(--color-text-secondary)] sm:text-lg sm:leading-8">
            Nearsited finds local businesses with no website, social-only presence, platform-only listings, or weak websites. Ranks them by opportunity, writes the pitch.
          </p>
        </motion.div>

        <motion.div {...fadeUp(0.15)} className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
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

        <motion.div {...fadeUp(0.25)} className="flex flex-col gap-2 text-sm text-[var(--color-text-tertiary)] sm:flex-row sm:flex-wrap sm:gap-6">
          <span className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[var(--color-accent)]" />No credit card</span>
          <span className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[var(--color-accent)]" />10 free analyses</span>
          <span className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[var(--color-accent)]" />Cancel anytime</span>
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
              <p className="truncate text-[10px] uppercase tracking-[0.18em] md:tracking-[0.28em] text-[var(--color-text-tertiary)]">Discovered opportunities · Dubai</p>
              <Badge color="green" dot>Sample scan</Badge>
            </div>

            {/* Opportunity rows */}
            <div className="space-y-2.5">
              {[
                { type: "no_website" as OppType, score: 85, name: "Marina Legal Consultants", desc: "Dubai Marina · Legal", badge: "No Website", badgeColor: "var(--score-high)" },
                { type: "social_only" as OppType, score: 72, name: "Blue Wave Restaurant", desc: "JBR · Food & Beverage", badge: "Social Only", badgeColor: "var(--score-mid)" },
                { type: "has_website" as OppType, score: 72, name: "Bright Smile Dental", desc: "Jumeirah · Healthcare", badge: "Weak Website", badgeColor: "var(--score-mid)" },
              ].map((opp) => (
                <button
                  key={opp.type}
                  type="button"
                  onClick={() => setActiveOpp(opp.type)}
                  className={`flex w-full cursor-pointer items-center gap-3 rounded-[var(--radius-md)] border px-4 py-3 text-left transition-all duration-150 ${
                    activeOpp === opp.type
                      ? "border-[var(--color-accent)]/50 bg-[var(--color-accent)]/10"
                      : "border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] hover:border-[var(--color-accent)]/30"
                  }`}
                >
                  <ScoreRing score={opp.score} size={32} variant="estimate" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">{opp.name}</p>
                    <p className="text-xs text-[var(--color-text-tertiary)]">{opp.desc}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end">
                    <span
                      className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] border px-2 py-0.5 text-[10px] font-semibold"
                      style={{ borderColor: `${opp.badgeColor}30`, backgroundColor: `${opp.badgeColor}10`, color: opp.badgeColor }}
                    >
                      {opp.badge}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {/* Pitch preview — changes based on selected row */}
            <div className="mt-4 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] p-4">
              <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-[var(--color-text-tertiary)]">
                <MessageSquare className="h-3 w-3 text-[var(--color-accent)]" />
                AI pitch · ready to send
              </div>
              <p className="text-sm leading-7 text-[var(--color-text-secondary)] italic">{PITCHES[activeOpp]}</p>
              <div className="mt-3 border-t border-[var(--color-border-subtle)] pt-3">
                <Button variant="primary" onClick={handleCopy} className="w-full text-xs">
                  {copied ? "Copied!" : "Copy pitch →"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </motion.div>
      </div>
    </section>
  );
}