"use client";

import { useState } from "react";
import { Check, Minus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { SectionLabel } from "@/components/landing/SectionLabel";
import { motion, AnimatePresence, useSafeReducedMotion, type Variants } from "@/lib/motion";

// ── Types ─────────────────────────────────────────────────────────────────────

export type PricingProps = {
  navigate: (href: string) => void;
  mode?: "inline" | "page";
  /** If provided, called instead of navigating to /signup when a plan is selected. */
  onPlanSelect?: (productId: string) => void;
  /** User is authenticated — free trial CTA goes to dashboard instead of signup */
  isLoggedIn?: boolean;
};

type Plan = {
  id: string;
  name: string;
  monthlyPrice: string;
  annualPrice: string;
  annualNote: string;
  description: string;
  features: { label: string; included: boolean }[];
  featured: boolean;
  cta: string;
  badge?: string;
  monthlyProductId: string;
  annualProductId: string;
};

// ── Plans ─────────────────────────────────────────────────────────────────────

const PLANS: Plan[] = [
  {
    id: "free_trial",
    name: "Free Trial",
    monthlyPrice: "$0",
    annualPrice: "$0",
    annualNote: "forever free",
    description: "Audit 20 leads. No credit card.",
    features: [
      { label: "20 audits (lifetime)", included: true },
      { label: "Unlimited searches", included: true },
      { label: "Unlimited AI pitch generation", included: true },
      { label: "10 pipeline leads", included: true },
      { label: "3 default pitch templates", included: true },
      { label: "Saved searches", included: false },
      { label: "Team workspace", included: false },
      { label: "API access", included: false },
      { label: "White-label", included: false },
    ],
    featured: false,
    monthlyProductId:
      process.env.NEXT_PUBLIC_DODO_PRODUCT_FREE_TRIAL ?? "",
    annualProductId:
      process.env.NEXT_PUBLIC_DODO_PRODUCT_FREE_TRIAL ?? "",
    cta: "Start free →",
  },
  {
    id: "solo",
    name: "Solo",
    monthlyPrice: "$29/mo",
    annualPrice: "$24/mo",
    annualNote: "billed $288/yr (save 2 months)",
    description: "For freelancers. 100 audits/mo.",
    features: [
      { label: "100 audits per month", included: true },
      { label: "Unlimited searches", included: true },
      { label: "Unlimited AI pitch generation", included: true },
      { label: "Unlimited pipeline", included: true },
      { label: "5 saved searches", included: true },
      { label: "3 default pitch templates", included: true },
      { label: "Team workspace", included: false },
      { label: "API access", included: false },
      { label: "White-label", included: false },
    ],
    featured: false,
    monthlyProductId:
      process.env.NEXT_PUBLIC_DODO_PRODUCT_SOLO_MONTHLY ??
      "pdt_solo_monthly_placeholder",
    annualProductId:
      process.env.NEXT_PUBLIC_DODO_PRODUCT_SOLO_ANNUAL ??
      "pdt_solo_annual_placeholder",
    cta: "Get started →",
  },
  {
    id: "agency",
    name: "Agency",
    monthlyPrice: "$89/mo",
    annualPrice: "$74/mo",
    annualNote: "billed $888/yr (save 2 months)",
    description: "For small teams. 500 audits/mo, 3 seats.",
    features: [
      { label: "500 audits per month", included: true },
      { label: "Unlimited searches", included: true },
      { label: "Unlimited AI pitch generation", included: true },
      { label: "Unlimited pipeline", included: true },
      { label: "Unlimited saved searches", included: true },
      { label: "3 user seats", included: true },
      { label: "Team workspace", included: true },
      { label: "API access (read-only)", included: true },
      { label: "Custom pitch templates", included: true },
      { label: "Priority support", included: true },
      { label: "White-label", included: false },
    ],
    featured: true,
    badge: "Best value",
    monthlyProductId:
      process.env.NEXT_PUBLIC_DODO_PRODUCT_AGENCY_MONTHLY ??
      "pdt_agency_monthly_placeholder",
    annualProductId:
      process.env.NEXT_PUBLIC_DODO_PRODUCT_AGENCY_ANNUAL ??
      "pdt_agency_annual_placeholder",
    cta: "Get started →",
  },
  {
    id: "scale",
    name: "Scale",
    monthlyPrice: "$249/mo",
    annualPrice: "$207/mo",
    annualNote: "billed $2,484/yr (save 2 months)",
    description: "For high-volume operators. 2,000 audits/mo, white-label.",
    features: [
      { label: "2,000 audits per month", included: true },
      { label: "Unlimited searches", included: true },
      { label: "Unlimited AI pitch generation", included: true },
      { label: "Unlimited pipeline", included: true },
      { label: "Unlimited saved searches", included: true },
      { label: "10 user seats", included: true },
      { label: "Team workspace", included: true },
      { label: "API access (full)", included: true },
      { label: "Custom pitch templates", included: true },
      { label: "White-label", included: true },
      { label: "Slack/Discord support", included: true },
    ],
    featured: false,
    monthlyProductId:
      process.env.NEXT_PUBLIC_DODO_PRODUCT_SCALE_MONTHLY ??
      "pdt_scale_monthly_placeholder",
    annualProductId:
      process.env.NEXT_PUBLIC_DODO_PRODUCT_SCALE_ANNUAL ??
      "pdt_scale_annual_placeholder",
    cta: "Get started →",
  },
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
  visible: { transition: { staggerChildren: 0.06 } },
};

const cardItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease } },
};

// ── Component ─────────────────────────────────────────────────────────────────

export function Pricing({ navigate, mode = "inline", onPlanSelect, isLoggedIn }: PricingProps) {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const shouldReduce = useSafeReducedMotion();

  return (
    <section
      id="pricing"
      className={mode === "page" ? "py-14 sm:py-24" : "border-t border-[var(--color-border-subtle)] py-14 md:py-24"}
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
          {mode === "inline" && <SectionLabel>Pricing</SectionLabel>}
          {mode === "page" ? (
            <h1 className="text-[clamp(1.8rem,3vw,2.8rem)] font-medium leading-[1.15] tracking-[-0.02em] text-[var(--color-text-primary)]">
              Start finding clients this week.
            </h1>
          ) : (
            <h2 className="text-[clamp(1.8rem,3vw,2.8rem)] font-medium leading-[1.15] tracking-[-0.02em] text-[var(--color-text-primary)]">
              Start finding clients this week.
            </h2>
          )}
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-[var(--color-text-secondary)]">
            Audit 20 leads free. No credit card needed.
          </p>
        </motion.div>

        {/* Anchor value statement */}
        <motion.div
          className="mt-8 mx-auto max-w-2xl border-l-2 border-l-[var(--color-accent)] pl-5 text-sm"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
        >
          <p className="text-[var(--color-text-secondary)] leading-7">
            One closed client at $1,500 covers a full year of Agency.
          </p>
        </motion.div>

        {/* Monthly / Annual toggle */}
        <motion.div
          className="mt-8 flex justify-center"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
        >
          <div className="relative flex items-center rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] p-1 text-sm">
            {(["monthly", "annual"] as const).map((b) => (
              <button
                key={b}
                onClick={() => setBilling(b)}
                className={`relative rounded-full px-5 py-2 font-medium transition-colors duration-150 min-h-[44px] ${
                  billing === b
                    ? "text-[var(--color-text-primary)]"
                    : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
                }`}
              >
                {billing === b && (
                  <div
                    className="absolute inset-0 rounded-full bg-[var(--color-bg-surface)] shadow-sm transition-all duration-300"
                  />
                )}
                <span className="relative z-10 inline-flex items-center gap-1.5">
                  {b === "monthly" ? "Monthly" : "Annual"}
                  {b === "annual" && (
                    <span className="text-[0.6rem] font-medium tracking-wide text-[var(--color-accent)]">
                      SAVE ~17%
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Plan cards — 4-column on xl, 2-column on md, stacked on sm */}
        <motion.div
          className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-4"
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
                  className="pointer-events-none absolute inset-0 rounded-[var(--radius-md)]"
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
                    ? "border-[var(--color-accent)]/30 ring-1 ring-[var(--accent)]/10"
                    : ""
                }`}
              >
                {plan.badge && (
                  <Badge color={plan.featured ? "amber" : "indigo"} className="mb-4 self-start">
                    {plan.badge}
                  </Badge>
                )}
                <h3 className="text-xl font-medium text-[var(--color-text-primary)]">{plan.name}</h3>
                <p className="mt-1.5 text-sm text-[var(--color-text-secondary)]">{plan.description}</p>

                {/* Price — cross-fades on billing change */}
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={`${plan.id}-${billing}`}
                    initial={shouldReduce ? false : { opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={shouldReduce ? undefined : { opacity: 0, y: 8 }}
                    transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
                    className="mt-6"
                  >
                    <p className="text-3xl font-medium tracking-tight text-[var(--color-text-primary)]">
                      {billing === "monthly" ? plan.monthlyPrice : plan.annualPrice}
                    </p>
                    {billing === "annual" && (
                      <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">{plan.annualNote}</p>
                    )}
                  </motion.div>
                </AnimatePresence>

                <ul className="mt-6 flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li
                      key={feature.label}
                      className="flex items-start gap-3 text-sm text-[var(--color-text-secondary)]"
                    >
                      {feature.included ? (
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-accent)]" />
                      ) : (
                        <Minus className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-text-tertiary)]" />
                      )}
                      <span className={feature.included ? "" : "text-[var(--color-text-tertiary)]"}>
                        {feature.label}
                      </span>
                    </li>
                  ))}
                </ul>
                <Button
                  variant={plan.featured ? "primary" : plan.id === "free_trial" ? "ghost" : "secondary"}
                  onClick={() => {
                    if (plan.id === "free_trial") {
                      if (isLoggedIn) { navigate("/dashboard"); return; }
                      navigate("/signup");
                      return;
                    }
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

        {/* Trust / guarantee row — page mode only */}
        {mode === "page" && (
          <motion.div
            className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-[var(--color-text-tertiary)]"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
          >
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
              14-day money-back guarantee
            </span>
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
              Cancel anytime
            </span>
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
              $0.50/audit overage available
            </span>
          </motion.div>
        )}
      </div>
    </section>
  );
}
