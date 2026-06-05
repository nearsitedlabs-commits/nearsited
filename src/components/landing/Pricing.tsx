"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { motion, AnimatePresence, useReducedMotion, type Variants } from "framer-motion";

// ── Types ─────────────────────────────────────────────────────────────────────

export type PricingProps = {
  navigate: (href: string) => void;
  mode?: "inline" | "page";
  /** If provided, called instead of navigating to /signup when a plan is selected. */
  onPlanSelect?: (productId: string) => void;
};

type Plan = {
  id: string;
  name: string;
  monthlyPrice: string;
  annualPrice: string;
  annualNote: string;
  description: string;
  features: string[];
  featured: boolean;
  cta: string;
  badge?: string;
  monthlyProductId: string;
  annualProductId: string;
};

// ── Plans ─────────────────────────────────────────────────────────────────────

const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    monthlyPrice: "$19/mo",
    annualPrice: "$15/mo",
    annualNote: "billed $180/yr",
    description: "For solo freelancers and independent web designers.",
    features: [
      "50 opportunity analyses per month",
      "3 city searches per month",
      "Single user",
    ],
    featured: false,
    monthlyProductId: "pdt_0NgKrmYBX9pAp9NhbeMqp",
    annualProductId: "pdt_0NgKs5x6MXKvmMOQemKP2",
    cta: "Get started →",
    badge: "Most popular",
  },
  {
    id: "agency",
    name: "Agency",
    monthlyPrice: "$49/mo",
    annualPrice: "$39/mo",
    annualNote: "billed $468/yr",
    description: "For small agencies and growing web design teams.",
    features: [
      "200 opportunity analyses per month",
      "10 city searches per month",
      "Up to 3 team seats",
    ],
    featured: true,
    monthlyProductId: "pdt_0NgKsF0ROmm9U603GRqMm",
    annualProductId: "pdt_0NgKsQO5UXCVGZskhrv89",
    cta: "Get started →",
    badge: "Best value",
  },
];

const SHARED_FEATURES = [
  "All 4 opportunity types — no website, social, platform, weak site",
  "Unlimited AI pitch generation",
  "Unlimited pipeline management",
  "PDF audit exports",
  "Shareable report links",
];

// ── Animation config ──────────────────────────────────────────────────────────

const ease = [0.25, 0.1, 0.25, 1] as const;
const viewport = { once: true, margin: "-40px" as const };

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease } },
};

const cardContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const cardItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease } },
};

// ── Component ──────────────────────────────────────────────────────────────────

export function Pricing({ navigate, mode = "inline", onPlanSelect }: PricingProps) {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const shouldReduce = useReducedMotion();

  return (
    <section
      id="pricing"
      className={mode === "page" ? "py-14 sm:py-24" : "border-t border-[var(--border)] py-14 md:py-24"}
    >
      <div className="mx-auto max-w-7xl px-6 md:px-8">

        {/* Header */}
        <motion.div
          className="mx-auto max-w-3xl text-center"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
        >
          {mode === "inline" && (
            <div className="mb-4 inline-flex items-center gap-3 text-[0.7rem] uppercase tracking-[0.18em] text-[var(--accent)]">
              <span className="block h-px w-6 bg-[var(--accent)]" />
              Pricing
            </div>
          )}
          <h2 className="text-[clamp(1.8rem,3vw,2.8rem)] font-medium leading-[1.15] tracking-[-0.02em] text-[var(--text-primary)]">
            Start finding clients this week.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-[var(--text-secondary)]">
            Start with 10 free analyses — no credit card needed to get started.
          </p>
        </motion.div>

        {/* Beta pricing banner */}
        <motion.div
          className="mt-6 mx-auto max-w-2xl rounded-xl border border-[var(--accent)]/30 bg-[var(--accent-tint)] px-5 py-3 text-center text-sm"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
        >
          <span className="font-medium text-[var(--accent)]">Beta pricing</span>
          <span className="mx-2 text-[var(--text-tertiary)]">·</span>
          <span className="text-[var(--text-secondary)]">Your rate is locked for 12 months. No surprise increases.</span>
        </motion.div>

        {/* Monthly / Annual toggle */}
        <motion.div
          className="mt-8 flex justify-center"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
        >
          <div className="relative flex items-center rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] p-1 text-sm">
            {(["monthly", "annual"] as const).map((b) => (
              <button
                key={b}
                onClick={() => setBilling(b)}
                className={`relative rounded-full px-5 py-2 font-medium transition-colors duration-150 ${
                  billing === b
                    ? "text-[var(--text-primary)]"
                    : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                }`}
              >
                {billing === b && (
                  <motion.div
                    layoutId="billing-pill"
                    className="absolute inset-0 rounded-full bg-[var(--bg-surface)] shadow-sm"
                    transition={
                      shouldReduce
                        ? { duration: 0 }
                        : { type: "spring", stiffness: 400, damping: 35 }
                    }
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  {b === "monthly" ? "Monthly" : "Annual"}
                  {b === "annual" && (
                    <span className="text-[0.6rem] font-semibold tracking-wide text-[var(--accent)]">
                      SAVE 20%
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Plan cards */}
        <motion.div
          className="mt-6 grid gap-6 md:grid-cols-2 md:max-w-3xl md:mx-auto"
          variants={cardContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
        >
          {PLANS.map((plan) => (
            <motion.div
              key={plan.id}
              variants={cardItem}
              whileHover={
                shouldReduce
                  ? undefined
                  : {
                      y: -4,
                      boxShadow: "0 20px 48px rgba(0,0,0,0.22)",
                      transition: { duration: 0.2, ease },
                    }
              }
              className="relative flex flex-col"
            >
              {/* Glow pulse — featured card only */}
              {plan.featured && !shouldReduce && (
                <motion.div
                  className="pointer-events-none absolute inset-0 rounded-xl"
                  animate={{
                    boxShadow: [
                      "0 0 0px 0px rgba(138,151,119,0)",
                      "0 0 28px 6px rgba(138,151,119,0.22)",
                      "0 0 0px 0px rgba(138,151,119,0)",
                    ],
                  }}
                  transition={{
                    duration: 1.8,
                    repeat: Infinity,
                    repeatDelay: 6.2,
                    ease: "easeInOut",
                    delay: 1.5,
                  }}
                />
              )}

              <Card
                variant={plan.featured ? "interactive" : "default"}
                padding="lg"
                className={`flex h-full flex-col ${
                  plan.featured
                    ? "border-[var(--accent)]/30 ring-1 ring-[var(--accent)]/10"
                    : ""
                }`}
              >
                {plan.badge && (
                  <Badge color={plan.featured ? "amber" : "indigo"} className="mb-4 self-start">
                    {plan.badge}
                  </Badge>
                )}
                <h3 className="text-xl font-medium text-[var(--text-primary)]">{plan.name}</h3>
                <p className="mt-1.5 text-sm text-[var(--text-secondary)]">{plan.description}</p>

                {/* Price — cross-fades on billing change */}
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={`${plan.id}-${billing}`}
                    initial={shouldReduce ? false : { opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={shouldReduce ? undefined : { opacity: 0, y: 8 }}
                    transition={{ type: "spring", stiffness: 400, damping: 35 }}
                    className="mt-6"
                  >
                    <p className="text-3xl font-medium tracking-tight text-[var(--text-primary)]">
                      {billing === "monthly" ? plan.monthlyPrice : plan.annualPrice}
                    </p>
                    {billing === "annual" && (
                      <p className="mt-1 text-xs text-[var(--text-tertiary)]">{plan.annualNote}</p>
                    )}
                  </motion.div>
                </AnimatePresence>

                <ul className="mt-6 flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-3 text-sm text-[var(--text-secondary)]"
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  variant={plan.featured ? "primary" : "secondary"}
                  onClick={() => {
                    const productId = billing === "monthly" ? plan.monthlyProductId : plan.annualProductId;
                    if (onPlanSelect) onPlanSelect(productId);
                    else navigate(`/signup?plan=${productId}`);
                  }}
                  className="mt-8 w-full"
                >
                  {plan.cta}
                </Button>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Shared features */}
        <motion.div
          className="mt-8 mx-auto max-w-3xl rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-6 py-5"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
        >
          <p className="mb-4 text-[0.7rem] font-medium uppercase tracking-[0.18em] text-[var(--text-tertiary)] text-center">
            Everything included on all plans
          </p>
          <ul className="flex flex-wrap justify-center gap-x-8 gap-y-2.5">
            {SHARED_FEATURES.map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <Check className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Trust row — page mode only */}
        {mode === "page" && (
          <motion.div
            className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-[var(--text-tertiary)]"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
          >
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
              Cancel anytime during trial
            </span>
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
              Your data stays yours
            </span>
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
              Built by an agency, for agencies
            </span>
          </motion.div>
        )}
      </div>
    </section>
  );
}
