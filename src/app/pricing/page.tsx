"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Pricing } from "@/components/landing/Pricing";
import { Button } from "@/components/ui/Button";
import { motion, useSafeReducedMotion, type Variants } from "@/lib/motion";
import { Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const ease = [0.25, 0.1, 0.25, 1] as const;
const viewport = { once: true, margin: "-40px" as const };

const fadeUp = (shouldReduce: boolean | null) =>
  shouldReduce
    ? {}
    : {
        initial: { opacity: 0, y: 12 },
        whileInView: { opacity: 1, y: 0 },
        viewport,
        transition: { duration: 0.35, ease },
      };

const faqContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const faqItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease } },
};

const FAQ_ITEMS = [
  {
    q: "When is an audit used?",
    a: "One audit is used every time you run a performance audit or a design analysis on a business. Searching for businesses, browsing your pipeline, and generating pitches do not use audits.",
  },
  {
    q: "How many audits do I get?",
    a: "Free Trial: 20 audits total (lifetime — they never reset). Solo: 100 audits per month. Agency: 500 audits per month. Scale: 2,000 audits per month. Paid plan audits reset at the start of each billing month; unused audits do not roll over.",
  },
  {
    q: "What happens when I run out?",
    a: "You can still log in, view your pipeline, manage leads, and access generated pitches. To run more audits, upgrade to a higher plan, or buy a booster pack (100 additional audits for $19).",
  },
  {
    q: "What if I need more audits than my plan allows?",
    a: "You can buy a one-time booster pack (100 audits for $19) for temporary volume spikes, or we charge $0.50 per extra audit beyond your plan limit. You'll get a prompt before any overage charges.",
  },
  {
    q: "Can I switch plans?",
    a: "Yes — upgrade anytime (takes effect immediately). Downgrades take effect at the next billing cycle. No partial refunds on downgrades.",
  },
  {
    q: "Is there a money-back guarantee?",
    a: "Yes — 14-day money-back guarantee on any paid plan. No questions asked.",
  },
];

export default function PricingPage() {
  const router = useRouter();
  const navigate = router.push.bind(router);
  const shouldReduce = useSafeReducedMotion();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setIsLoggedIn(!!user));
  }, [supabase]);

  async function handlePlanSelect(productId: string) {
    if (!isLoggedIn) {
      try { localStorage.setItem("pendingUpgradePlan", productId); } catch { /* ignore */ }
      navigate("/signup");
      return;
    }
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    const json = await res.json();
    if (json.url) {
      window.location.href = json.url;
    } else {
      console.error("[PRICING] Checkout failed:", json.error ?? "No URL returned");
      // Fallback: redirect to settings page where upgrade buttons exist
      navigate("/dashboard/settings");
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
      {/* Header */}
      <motion.header
        className="border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)]/80 backdrop-blur-xl"
        initial={shouldReduce ? false : { opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-8">
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2.5 text-base font-medium text-[var(--text-primary)]"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            <Image src="/logo-icon.svg" alt="" width={28} height={17} sizes="28px" className="block shrink-0" />
            <span className="text-base font-medium tracking-[0.02em] text-[var(--text-primary)]">
              NearSited
            </span>
          </button>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate("/login")}>Sign in</Button>
            <Button variant="primary" onClick={() => navigate("/signup")}>Start free trial</Button>
          </div>
        </div>
      </motion.header>

      <main>
        {/* Page entrance */}
        <motion.div
          initial={shouldReduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease }}
        >
          {/* Pricing cards — animated internally */}
          <Pricing navigate={navigate} mode="page" onPlanSelect={handlePlanSelect} isLoggedIn={isLoggedIn} />

          {/* How Audits Work */}
          <motion.section
            className="border-t border-[var(--color-border-subtle)] py-20"
            {...fadeUp(shouldReduce)}
          >
            <div className="mx-auto max-w-3xl px-6 md:px-8">
              <div className="text-center">
                <div className="mb-4 inline-flex items-center gap-3 text-[0.7rem] uppercase tracking-[0.18em] text-[var(--accent)]">
                  <span className="block h-px w-6 bg-[var(--accent)]" />
                  How audits work
                </div>
                <h2 className="text-[clamp(1.8rem,3vw,2.8rem)] font-medium leading-[1.15] tracking-[-0.02em] text-[var(--text-primary)]">
                  What is an audit?
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-[var(--text-secondary)]">
                  An audit is a full performance + design analysis of a business website. Each audit runs PageSpeed Insights and AI design analysis. Searching for leads, generating pitches, and managing your pipeline do not use audits.
                </p>
              </div>

              <motion.div
                className="mt-10 space-y-4"
                variants={faqContainer}
                initial="hidden"
                whileInView="visible"
                viewport={viewport}
              >
                {FAQ_ITEMS.map((item) => (
                  <motion.div
                    key={item.q}
                    variants={faqItem}
                    className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] px-6 py-5"
                  >
                    <p className="text-sm font-medium text-[var(--text-primary)]">{item.q}</p>
                    <p className="mt-1.5 text-base lg:text-body leading-7 text-[var(--text-secondary)]">{item.a}</p>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </motion.section>

          {/* Founder Note */}
          <motion.section
            className="border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] py-20"
            {...fadeUp(shouldReduce)}
          >
            <div className="mx-auto max-w-2xl px-6 text-center md:px-8">
              <div className="mb-4 inline-flex items-center gap-3 text-[0.7rem] uppercase tracking-[0.18em] text-[var(--accent)]">
                <span className="block h-px w-6 bg-[var(--accent)]" />
                A note from the founder
              </div>
              <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] p-8 text-left">
                <p className="text-base leading-8 text-[var(--text-secondary)]">
                  I run a web design agency. I built Nearsited because I was spending 10 hours a week prospecting instead of building websites.
                </p>
                <p className="mt-4 text-base leading-8 text-[var(--text-secondary)]">
                  Finding clients who actually need a new website was always the hardest part. So I built a tool that does it for me. It works for my agency. I&rsquo;m turning it into a product.
                </p>
                <p className="mt-4 text-base leading-8 text-[var(--text-secondary)]">
                  If Nearsited doesn&rsquo;t help you find and close more website projects, email me and I&rsquo;ll refund every dollar. No questions.
                </p>
                <p className="mt-6 text-sm font-medium text-[var(--text-primary)]">
                  — Founder, Again Labs
                </p>
              </div>
            </div>
          </motion.section>

          {/* Bottom CTA */}
          <motion.section
            className="border-t border-[var(--color-border-subtle)] py-20"
            {...fadeUp(shouldReduce)}
          >
            <div className="mx-auto max-w-2xl px-6 text-center md:px-8">
              <h2 className="text-[clamp(1.8rem,3vw,2.8rem)] font-medium leading-[1.15] tracking-[-0.02em] text-[var(--text-primary)]">
                See if there are opportunities in your city.
              </h2>
              <p className="mx-auto mt-4 max-w-md text-base leading-7 text-[var(--text-secondary)]">
                Enter a city and business type. Nearsited shows you which businesses need a website — before you pay anything.
              </p>
              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Button
                  variant="primary"
                  icon={<Search className="h-4 w-4" />}
                  onClick={() => navigate("/signup")}
                  className="px-8 py-3 text-base"
                >
                  Audit 20 leads free →
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => navigate("/login")}
                  className="px-8 py-3 text-base"
                >
                  Sign in
                </Button>
              </div>
              <p className="mt-6 text-sm text-[var(--text-tertiary)]">
                No credit card required. 20 free audits, lifetime.
              </p>
            </div>
          </motion.section>

          {/* Footer */}
          <footer className="border-t border-[var(--color-border-subtle)] px-6 py-10 md:px-8">
            <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-sm text-[var(--text-tertiary)] md:flex-row">
              <span>&copy; 2026 Nearsited. Built by Again Labs.</span>
              <div className="flex items-center gap-6">
                <button onClick={() => navigate("/")} className="transition hover:text-[var(--text-primary)]">Home</button>
                <button onClick={() => navigate("/pricing")} className="transition hover:text-[var(--text-primary)]">Pricing</button>
                <a href="mailto:nearsitedlabs@gmail.com" className="transition hover:text-[var(--text-primary)]">Contact</a>
              </div>
            </div>
          </footer>
        </motion.div>
      </main>
    </div>
  );
}
