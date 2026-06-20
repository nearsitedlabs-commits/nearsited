"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence, useSafeReducedMotion } from "@/lib/motion";
import { Search, ExternalLink, Check, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Pill, type PillVariant } from "@/components/ui/Pill";
import { ScoreCircle } from "@/components/ui/ScoreCircle";

const CanvasBackground = dynamic(
  () => import("@/components/ui/CanvasBackground").then((mod) => ({ default: mod.CanvasBackground })),
  { ssr: false, loading: () => <div className="absolute inset-0 bg-[var(--color-bg-page)]" aria-hidden="true" /> },
);

const OpportunityAtlas = dynamic(
  () => import("@/components/landing/atlas/OpportunityAtlas"),
  { ssr: false, loading: () => <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-bg-page)] to-transparent hidden md:block" aria-hidden="true" /> },
);

type Lead = {
  id: string;
  score: number;
  name: string;
  desc: string;
  badge: string;
  badgeVariant: PillVariant;
  pitch: string;
};

const LEADS: Lead[] = [
  {
    id: "marina-legal",
    score: 85,
    name: "Marina Legal Consultants",
    desc: "Dubai Marina · Legal",
    badge: "No Website",
    badgeVariant: "danger",
    pitch: `"Hi, I noticed Marina Legal has great reviews but no website. You're invisible to clients searching Google. I build legal websites that turn your reputation into new enquiries."`,
  },
  {
    id: "blue-wave",
    score: 72,
    name: "Blue Wave Restaurant",
    desc: "JBR · Food & Beverage",
    badge: "Social Only",
    badgeVariant: "info",
    pitch: `"Hi, Blue Wave's Instagram looks great. But Instagram isn't a website. You don't own it and can't rank on Google. A website turns your followers into reservations you control."`,
  },
  {
    id: "bright-smile",
    score: 68,
    name: "Bright Smile Dental",
    desc: "Jumeirah · Healthcare",
    badge: "Weak Website",
    badgeVariant: "warning",
    pitch: `"Hi, I analysed Bright Smile Dental's website and found 5 critical issues costing you patients. A redesign would improve your online presence and directly increase bookings."`,
  },
  {
    id: "bloom-beauty",
    score: 74,
    name: "Bloom Beauty Studio",
    desc: "Downtown · Beauty & Wellness",
    badge: "Platform Only",
    badgeVariant: "info",
    pitch: `"Hi, I found Bloom Beauty Studio on Fresha. You're paying commission on every booking and don't own your client data. A direct-booking website pays for itself in a month."`,
  },
  {
    id: "rafiq-tailoring",
    score: 81,
    name: "Rafiq's Tailoring & Co",
    desc: "Karama · Fashion & Retail",
    badge: "No Website",
    badgeVariant: "danger",
    pitch: `"Hi, Rafiq's Tailoring has a solid Google profile but no website. Customers searching for tailors in Karama are finding competitors with a web presence. I can fix that in 2 weeks."`,
  },
];

const CYCLE_INTERVAL = 5000;

export function LandingHero({ navigate }: { navigate: (href: string) => void }) {
  const [activeLead, setActiveLead] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [copied, setCopied] = useState(false);
  const [typewriterChars, setTypewriterChars] = useState(0);
  const [typewriterDone, setTypewriterDone] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const shouldReduce = useSafeReducedMotion();
  const shouldReduceRef = useRef(shouldReduce);
  useEffect(() => { shouldReduceRef.current = shouldReduce; });

  // Typewriter — fires once on first viewport entry for lead 0's pitch
  useEffect(() => {
    if (shouldReduceRef.current) {
      setTypewriterDone(true);
      return;
    }
    const el = heroRef.current;
    if (!el) return;
    const text = LEADS[0].pitch;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        observer.disconnect();
        let i = 0;
        timerRef.current = setInterval(() => {
          i++;
          setTypewriterChars(i);
          if (i >= text.length) {
            if (timerRef.current) clearInterval(timerRef.current);
            setTypewriterDone(true);
          }
        }, 40);
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-cycle every 5 seconds, pauses on hover
  useEffect(() => {
    if (isPaused) return;
    const cycleTimer = setInterval(() => {
      setActiveLead((prev) => (prev + 1) % LEADS.length);
    }, CYCLE_INTERVAL);
    return () => clearInterval(cycleTimer);
  }, [isPaused]);

  function handleLeadClick(idx: number) {
    setActiveLead(idx);
    // Skip typewriter if user interacts before it finishes
    if (!typewriterDone) {
      if (timerRef.current) clearInterval(timerRef.current);
      setTypewriterDone(true);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(LEADS[activeLead].pitch);
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
    <section id="hero" className="relative overflow-hidden [overflow-x:clip]">
      <OpportunityAtlas />
      <CanvasBackground />

      <div
        ref={heroRef}
        className="relative mx-auto grid max-w-7xl lg:gap-8 gap-4 px-4 pt-6 pb-16 sm:px-6 md:gap-12 md:min-h-[calc(100svh-var(--nav-height,80px))] md:grid-cols-2 md:items-center md:px-8 md:pt-8 md:pb-20 lg:px-10"
      >
        {/* Left: Copy */}
        <div className="relative z-10 flex flex-col justify-center space-y-6">
          <motion.div {...fadeUp(0)} className="space-y-5">
            <h1 className="text-[length:var(--text-hero)] font-bold tracking-[-0.04em] leading-[0.92] text-[var(--color-text-primary)] [font-family:var(--font-display)]">
              Your next client<br />
              is out there —<br />
              <span className="text-[var(--color-accent)]">without a website</span>
            </h1>
            <p className="max-w-xl text-base leading-6 lg:leading-7 text-[var(--color-text-secondary)] sm:text-lg sm:leading-8">
              Nearsited finds local businesses with no website, social-only presence, platform-only listings, or weak websites. Ranks them by opportunity, writes the pitch.
            </p>
          </motion.div>

          <motion.div {...fadeUp(0.15)} className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
            <Button
              variant="primary"
              icon={<Search className="h-4 w-4" aria-hidden="true" />}
              onClick={() => navigate("/signup")}
              className="w-full px-6 py-3 text-base sm:w-auto"
            >
              Find your first opportunity
            </Button>
            <Button
              variant="secondary"
              icon={<ExternalLink className="h-4 w-4" aria-hidden="true" />}
              onClick={() => document.getElementById("how")?.scrollIntoView({ behavior: "smooth" })}
              className="w-full px-6 py-3 text-base sm:w-auto"
            >
              See how agencies win
            </Button>
          </motion.div>

          <motion.div {...fadeUp(0.25)} className="flex flex-col gap-2 text-sm text-[var(--color-text-tertiary)] sm:flex-row sm:flex-wrap sm:gap-6">
            <span className="flex items-center gap-2"><Check aria-hidden="true" className="h-3.5 w-3.5 text-[var(--color-accent)]" />No credit card</span>
            <span className="flex items-center gap-2"><Check aria-hidden="true" className="h-3.5 w-3.5 text-[var(--color-accent)]" />20 free analyses</span>
            <span className="flex items-center gap-2"><Check aria-hidden="true" className="h-3.5 w-3.5 text-[var(--color-accent)]" />Cancel anytime</span>
          </motion.div>
        </div>

        {/* Right: Opportunity feed */}
        <motion.div
          className="relative z-10 flex min-w-0 w-full items-center justify-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <div
            className="relative w-full min-w-0 md:max-w-[440px] rounded-[var(--radius-md)] p-5"
            style={{
              background: "var(--color-bg-surface-raised)",
              boxShadow: "0 1px 0 rgba(255,255,255,0.04) inset",
            }}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <div className="mb-4 flex min-w-0 items-center gap-2">
              <p className="min-w-0 flex-1 truncate text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">
                Opportunities · Dubai
              </p>
              <Pill variant="success" dot size="sm" className="shrink-0">Sample</Pill>
            </div>

            {/* Opportunity rows — 5-lead list */}
            <div className="space-y-2">
              {LEADS.map((lead, idx) => (
                <button
                  key={lead.id}
                  type="button"
                  onClick={() => handleLeadClick(idx)}
                  className={`flex w-full cursor-pointer items-center gap-3 rounded-[var(--radius-md)] border px-3 py-2.5 text-left transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-page)] ${
                    activeLead === idx
                      ? "border-[var(--color-accent)]/50 bg-[var(--color-accent)]/10"
                      : "border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] hover:border-[var(--color-accent)]/30"
                  }`}
                >
                  <span aria-hidden="true">
                    <ScoreCircle score={lead.score} size={24} variant="estimated" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-[var(--color-text-primary)]">{lead.name}</p>
                    <p className="text-[11px] text-[var(--color-text-tertiary)]">{lead.desc}</p>
                  </div>
                  <Pill variant={lead.badgeVariant} size="sm" className="shrink-0">
                    {lead.badge}
                  </Pill>
                </button>
              ))}
            </div>

            {/* Pitch preview */}
            <div className="mt-4 rounded-[var(--radius-md)] bg-[var(--color-bg-elevated)] p-4">
              <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-[var(--color-text-tertiary)]">
                <MessageSquare aria-hidden="true" className="h-3 w-3 text-[var(--color-accent)]" />
                AI pitch · ready to send
              </div>

              <div className="min-h-[5.5rem]">
                {!typewriterDone ? (
                  <p className="text-sm leading-7 text-[var(--color-text-secondary)] italic">
                    {LEADS[0].pitch.slice(0, typewriterChars)}
                    <span
                      aria-hidden="true"
                      className="ml-px inline-block w-0.5 bg-[var(--color-accent)] animate-pulse"
                      style={{ height: "0.9em", verticalAlign: "text-bottom" }}
                    />
                  </p>
                ) : shouldReduce ? (
                  <p className="text-sm leading-7 text-[var(--color-text-secondary)] italic">
                    {LEADS[activeLead].pitch}
                  </p>
                ) : (
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={activeLead}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                      className="text-sm leading-7 text-[var(--color-text-secondary)] italic"
                    >
                      {LEADS[activeLead].pitch}
                    </motion.p>
                  </AnimatePresence>
                )}
              </div>

              <div className="mt-3 border-t border-[var(--color-border-subtle)] pt-3">
                <Button variant="secondary" onClick={handleCopy} className="w-full text-xs">
                  {copied ? "Copied!" : "Copy pitch →"}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
