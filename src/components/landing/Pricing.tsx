"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

// ── Types ─────────────────────────────────────────────────────────────────────

export type PricingProps = {
  navigate: (href: string) => void;
  mode?: "inline" | "page";
};

// ── Plans ─────────────────────────────────────────────────────────────────────

type Plan = {
  id: string;
  name: string;
  price: string;
  description: string;
  features: string[];
  featured: boolean;
  cta: string;
  badge?: string;
};

// Three differentiating bullets per plan only — shared features listed below cards.
const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    price: "$19/mo",
    description: "For solo freelancers and independent web designers.",
    features: [
      "50 opportunity audits per month",
      "3 city searches per month",
      "Single user",
    ],
    featured: false,
    cta: "Start 14-day free trial →",
    badge: "Most popular",
  },
  {
    id: "agency",
    name: "Agency",
    price: "$49/mo",
    description: "For small agencies and growing web design teams.",
    features: [
      "200 opportunity audits per month",
      "10 city searches per month",
      "Up to 3 team seats",
    ],
    featured: true,
    cta: "Start 14-day free trial →",
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

// ── Component ──────────────────────────────────────────────────────────────────

export default function Pricing({ navigate, mode = "inline" }: PricingProps) {
  return (
    <section
      id="pricing"
      className={mode === "page" ? "py-16 sm:py-24" : "border-t border-[var(--border)] py-24"}
    >
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
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
            Try any plan free for 14 days. No credit card required.
          </p>
        </div>

        {/* Beta pricing banner */}
        <div className="mt-6 mx-auto max-w-2xl rounded-xl border border-[var(--accent)]/30 bg-[var(--accent-tint)] px-5 py-3 text-center text-sm">
          <span className="font-medium text-[var(--accent)]">Beta pricing</span>
          <span className="mx-2 text-[var(--text-tertiary)]">·</span>
          <span className="text-[var(--text-secondary)]">Your rate is locked for 12 months. No surprise increases.</span>
        </div>

        {/* Plan cards — 2 column */}
        <div className="mt-6 grid gap-6 md:grid-cols-2 md:max-w-3xl md:mx-auto">
          {PLANS.map((plan) => (
            <Card
              key={plan.id}
              variant={plan.featured ? "interactive" : "default"}
              padding="lg"
              className={`flex flex-col ${
                plan.featured
                  ? "border-[var(--accent)]/30 ring-1 ring-[var(--accent)]/10 md:scale-105"
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
              <p className="mt-6 text-3xl font-medium tracking-tight text-[var(--text-primary)]">
                {plan.price}
              </p>
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
                onClick={() => navigate("/signup")}
                className="mt-8 w-full"
              >
                {plan.cta}
              </Button>
              <p className="mt-3 text-center text-xs font-medium text-[var(--text-secondary)]">
                No credit card required
              </p>
            </Card>
          ))}
        </div>

        {/* Shared features — shown once below cards */}
        <div className="mt-8 mx-auto max-w-3xl rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-6 py-5">
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
        </div>

        {/* Trust row — page mode only */}
        {mode === "page" && (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-[var(--text-tertiary)]">
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
          </div>
        )}
      </div>
    </section>
  );
}
