"use client";

import { useState } from "react";
import { motion, AnimatePresence, useSafeReducedMotion } from "@/lib/motion";
import { Zap, FileText, TrendingUp, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Pill";
import { SectionLabel } from "@/components/landing/SectionLabel";
import { SectionTitle } from "@/components/landing/SectionTitle";
import { SectionSub } from "@/components/landing/SectionSub";

type PitchTab = "weak" | "none" | "social" | "platform";
type ToneOption = "professional" | "friendly" | "luxury";

const TONE_LABELS: Record<ToneOption, string> = {
  professional: "Professional",
  friendly: "Friendly",
  luxury: "Luxury",
};

const NEXT_TONE: Record<ToneOption, ToneOption> = {
  professional: "friendly",
  friendly: "luxury",
  luxury: "professional",
};

const PITCH_EXAMPLES: Record<PitchTab, {
  label: string;
  pillVariant: "warning" | "danger" | "info";
  metaFor: string;
  body: React.ReactNode;
}> = {
  weak: {
    label: "Weak Website",
    pillVariant: "warning",
    metaFor: "Brighton Dental · 1.4s",
    body: (
      <div className="space-y-3 text-sm leading-7 text-[var(--color-text-secondary)]">
        <p>Hi Dr. Mehta,</p>
        <p>
          I ran brightondental.co.uk through a website audit and found a few issues that are likely costing you new patients.
        </p>
        <ul className="list-disc space-y-1.5 pl-4">
          <li>The homepage takes <span className="font-medium text-[var(--color-text-primary)]">4.2 seconds</span> to load on mobile — Google says over half of visitors leave if it&rsquo;s slower than 3s</li>
          <li>Your <span className="font-medium text-[var(--color-text-primary)]">SSL certificate expired</span> three months ago — Chrome shows &ldquo;Not Secure&rdquo; in the address bar</li>
          <li>No local SEO markup, so you&rsquo;re not appearing in Google&rsquo;s local results for &ldquo;dentist near me&rdquo;</li>
        </ul>
        <p>These are straightforward fixes. Happy to walk through what I found and what it would take to sort them out.</p>
      </div>
    ),
  },
  none: {
    label: "No Website",
    pillVariant: "danger",
    metaFor: "Harbor Legal Group · 1.2s",
    body: (
      <div className="space-y-3 text-sm leading-7 text-[var(--color-text-secondary)]">
        <p>Hi,</p>
        <p>
          I was looking for legal services in downtown Austin and came across <span className="font-medium text-[var(--color-text-primary)]">Harbor Legal Group</span> — great Google reviews, but no website.
        </p>
        <p>Every day without one, potential clients searching for lawyers in your area are finding competitors first. Your 4.7★ reputation is invisible on Google outside of Maps.</p>
        <ul className="list-disc space-y-1.5 pl-4">
          <li>No way for clients to learn about your services without calling</li>
          <li>No portfolio of case experience or client testimonials</li>
          <li>Zero Google search presence beyond the Maps listing</li>
        </ul>
        <p>I build websites for legal practices. Would you be open to a quick conversation about what this could mean for your practice?</p>
      </div>
    ),
  },
  social: {
    label: "Social Only",
    pillVariant: "info",
    metaFor: "The Hideaway Cafe · 1.1s",
    body: (
      <div className="space-y-3 text-sm leading-7 text-[var(--color-text-secondary)]">
        <p>Hi,</p>
        <p>
          I was checking out cafes in Byron Bay and found <span className="font-medium text-[var(--color-text-primary)]">The Hideaway Cafe</span> on Instagram — 4,200 followers and great content. But you don&rsquo;t have a website.
        </p>
        <ul className="list-disc space-y-1.5 pl-4">
          <li>No online menu that shows up in Google searches</li>
          <li>No reservation system — every booking goes through DMs</li>
          <li>If Instagram changes its algorithm, you lose direct visibility to new customers</li>
        </ul>
        <p>A simple website with your menu, location, and a booking form would capture everyone searching for cafes in Byron Bay. Happy to show you some examples.</p>
      </div>
    ),
  },
  platform: {
    label: "Platform Only",
    pillVariant: "info",
    metaFor: "Bloom Beauty Bar · 1.3s",
    body: (
      <div className="space-y-3 text-sm leading-7 text-[var(--color-text-secondary)]">
        <p>Hi,</p>
        <p>
          I found <span className="font-medium text-[var(--color-text-primary)]">Bloom Beauty Bar</span> on Booksy — great reviews, but no website of your own.
        </p>
        <p>Right now every booking goes through Booksy. That means you&rsquo;re paying commission on every appointment and you don&rsquo;t own the relationship with your clients. If their fee structure changes or your listing drops, your entire online presence disappears.</p>
        <ul className="list-disc space-y-1.5 pl-4">
          <li>No Google search presence outside the Booksy listing</li>
          <li>No direct bookings — every client goes through a third party</li>
          <li>No way to showcase your work, pricing, or build a brand</li>
        </ul>
        <p>A professional website would let clients book directly, build your own client list, and get found on Google. Worth a quick chat?</p>
      </div>
    ),
  },
};

export function SamplePitchSection({ navigate }: { navigate: (href: string) => void }) {
  const [activeTab, setActiveTab] = useState<PitchTab>("weak");
  const [tone, setTone] = useState<ToneOption>("professional");
  const prefersReducedMotion = useSafeReducedMotion();
  const example = PITCH_EXAMPLES[activeTab];

  function cycleTone() {
    setTone((t) => NEXT_TONE[t]);
  }

  const metaDisplay = `Tone: ${TONE_LABELS[tone]} · For: ${example.metaFor}`;

  return (
    <section id="pitch" className="border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] py-14 md:py-24">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="grid gap-12 lg:grid-cols-2">
          {/* Left — description column (shown below card on mobile) */}
          <div className="order-2 lg:order-1">
            <SectionLabel>Sample pitches</SectionLabel>
            <SectionTitle>Every opportunity type gets a tailored pitch.</SectionTitle>
            <SectionSub>
              Pitches are generated from real opportunity data, not templates. The angle changes completely depending on whether the business has no website, social-only, platform-only, or a weak one.
            </SectionSub>

            <div className="mt-8 space-y-4">
              {[
                { icon: Zap,       text: "Angle adapts to the opportunity type: new build, social conversion, or improvement" },
                { icon: FileText,  text: "Adjustable tone: professional, friendly, or luxury" },
                { icon: TrendingUp, text: "Cites real data: performance scores, missing features, estimated impact" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.text} className="flex items-start gap-3 text-sm text-[var(--color-text-secondary)]">
                    <Icon aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-accent)]" />
                    <span>{item.text}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Pitch card — shown first on mobile */}
          <div className="order-1 lg:order-2">
            {/* Tab strip — above card on both layouts */}
            <div className="mb-4 flex flex-wrap gap-2">
              {(["weak", "none", "social", "platform"] as PitchTab[]).map((id) => {
                const tab = PITCH_EXAMPLES[id];
                return (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`inline-flex min-h-[44px] items-center rounded-[var(--radius-sm)] px-4 py-2 text-sm font-medium transition-colors ${
                      activeTab === id
                        ? "bg-[var(--color-accent)]/12 text-[var(--color-accent)]"
                        : "bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] [@media(hover:hover)]:hover:bg-[var(--color-accent)]/8 [@media(hover:hover)]:hover:text-[var(--color-text-primary)]"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
            <div className="rounded-[var(--radius-md)] bg-[var(--color-bg-surface-raised)] p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare aria-hidden="true" className="h-4 w-4 text-[var(--color-accent)]" />
                  <span className="text-sm font-medium text-[var(--color-text-primary)]">Sample pitch</span>
                </div>
                <div className="flex items-center gap-2">
                  <Pill variant={example.pillVariant} size="sm">{example.label}</Pill>
                  <Pill variant="success" size="sm" dot>Ready to send</Pill>
                </div>
              </div>

              <div className="rounded-[var(--radius-md)] bg-[var(--color-bg-elevated)] p-5">
                {prefersReducedMotion ? (
                  <>
                    <p className="mb-4 text-xs text-[var(--color-text-tertiary)]">{metaDisplay}</p>
                    {example.body}
                  </>
                ) : (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`${activeTab}-${tone}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                    >
                      <p className="mb-4 text-xs text-[var(--color-text-tertiary)]">{metaDisplay}</p>
                      {example.body}
                    </motion.div>
                  </AnimatePresence>
                )}

                <div className="mt-5 flex flex-col gap-3 border-t border-[var(--color-border-subtle)] pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      className="flex-1 sm:flex-none"
                      onClick={cycleTone}
                      title={`Current: ${TONE_LABELS[tone]} — click to switch`}
                    >
                      Tone: {TONE_LABELS[tone]}
                    </Button>
                    <Button
                      variant="secondary"
                      className="flex-1 sm:flex-none"
                      onClick={() => {
                        const tabs: PitchTab[] = ["weak", "none", "social", "platform"];
                        setActiveTab((t) => tabs[(tabs.indexOf(t) + 1) % tabs.length]);
                      }}
                    >Regenerate</Button>
                  </div>
                  <Button variant="primary" onClick={() => navigate("/signup")} className="w-full sm:w-auto">
                    Copy pitch →
                  </Button>
                </div>
              </div>

              <p className="mt-4 text-center text-xs text-[var(--color-text-tertiary)]">
                Every pitch is unique. No templates. Pitch angle, evidence, and tone are all generated from the opportunity.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
