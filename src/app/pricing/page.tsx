"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import Pricing from "@/components/landing/Pricing";
import { Button } from "@/components/ui/Button";
import { Search } from "lucide-react";

export default function PricingPage() {
  const router = useRouter();
  const navigate = router.push.bind(router);

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
      {/* ── Simple Header ── */}
      <header className="border-b border-[var(--border)] bg-[var(--bg-surface)]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-8">
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2.5 text-base font-medium text-[var(--text-primary)]"
            style={{ fontFamily: "Switzer, Geist, sans-serif" }}
          >
            <Image src="/logo-icon.svg" alt="" width={28} height={16} className="block shrink-0" />
            <span className="text-base font-medium tracking-[0.02em] text-[var(--text-primary)]">
              NearSited
            </span>
          </button>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate("/login")}>
              Sign in
            </Button>
            <Button variant="primary" onClick={() => navigate("/signup")}>
              Start free trial
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* ── Founder Beta Plan ── */}
        <Pricing navigate={navigate} mode="page" />

        {/* ── How Credits Work ── */}
        <section className="border-t border-[var(--border)] py-20">
          <div className="mx-auto max-w-3xl px-6 md:px-8">
            <div className="text-center">
              <div className="mb-4 inline-flex items-center gap-3 text-[0.7rem] uppercase tracking-[0.18em] text-[var(--accent)]">
                <span className="block h-px w-6 bg-[var(--accent)]" />
                How credits work
              </div>
              <h2 className="text-[clamp(1.8rem,3vw,2.8rem)] font-medium leading-[1.15] tracking-[-0.02em] text-[var(--text-primary)]">
                What is a credit?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-[var(--text-secondary)]">
                One credit = one business audit. Credits are deducted when you review a business for redesign opportunities.
              </p>
            </div>

            <div className="mt-10 space-y-4">
              {[
                {
                  q: "When are credits used?",
                  a: "Every time you run an opportunity analysis on a business — performance audit, design analysis, or a full scan — one credit is deducted. Searching for businesses and generating pitches do not use credits.",
                },
                {
                  q: "How many credits do I get?",
                  a: "Starter: 50 audits/month. Agency: 200 audits/month. Credits reset at the start of each billing month. Unused credits do not roll over.",
                },
                {
                  q: "What happens when I run out?",
                  a: "You can still log in, view your pipeline, manage leads, and access generated pitches. To audit new businesses, either wait for your credits to reset or upgrade to a higher plan.",
                },
              ].map((item) => (
                <div
                  key={item.q}
                  className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-6 py-5"
                >
                  <p className="text-sm font-medium text-[var(--text-primary)]">{item.q}</p>
                  <p className="mt-1.5 text-sm leading-7 text-[var(--text-secondary)]">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Founder Note ── */}
        <section className="border-t border-[var(--border)] bg-[var(--bg-surface)] py-20">
          <div className="mx-auto max-w-2xl px-6 text-center md:px-8">
            <div className="mb-4 inline-flex items-center gap-3 text-[0.7rem] uppercase tracking-[0.18em] text-[var(--accent)]">
              <span className="block h-px w-6 bg-[var(--accent)]" />
              A note from the founder
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-8 text-left">
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
        </section>

        {/* ── Bottom CTA ── */}
        <section className="border-t border-[var(--border)] py-20">
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
                Try it free for 14 days
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
              No credit card required. Full access for 14 days.
            </p>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="border-t border-[var(--border)] px-6 py-10 md:px-8">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-sm text-[var(--text-tertiary)] md:flex-row">
            <span>&copy; 2026 Nearsited. Built by Again Labs.</span>
            <div className="flex items-center gap-6">
              <button onClick={() => navigate("/")} className="transition hover:text-[var(--text-primary)]">
                Home
              </button>
              <button onClick={() => navigate("/pricing")} className="transition hover:text-[var(--text-primary)]">
                Pricing
              </button>
              <a href="mailto:nearsitedlabs@gmail.com" className="transition hover:text-[var(--text-primary)]">
                Contact
              </a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
