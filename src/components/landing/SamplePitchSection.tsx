"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Zap, FileText, TrendingUp, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
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
  badgeColor: "amber" | "red" | "indigo";
  metaFor: string;
  body: React.ReactNode;
}> = {
  weak: {
    label: "Weak Website",
    badgeColor: "amber",
    metaFor: "Bright Smile Dental · 1.4s",
    body: (
      <div className="space-y-3 text-sm leading-7 text-[var(--text-secondary)]">
        <p>Hi Dr. Sameer,</p>
        <p>
          I ran a quick audit of <span className="font-medium text-[var(--text-primary)]">brightsmile.ae</span> and found several issues quietly costing you new patients.
        </p>
        <ul className="list-disc space-y-1.5 pl-4">
          <li><span className="text-[var(--score-high)]">4.2s mobile load time</span> — 53% of visitors leave before seeing your content</li>
          <li><span className="text-[var(--score-high)]">No local SEO</span> — you&rsquo;re not appearing in Google&rsquo;s local pack for &ldquo;dentist Jumeirah&rdquo;</li>
          <li><span className="text-[var(--score-high)]">Missing trust signals</span> — no SSL badge or social proof above the fold</li>
        </ul>
        <p>Fixing these could recover <span className="font-medium text-[var(--score-good)]">an estimated $1,000–$3,000/month</span> in missed revenue. Happy to walk you through the full audit?</p>
      </div>
    ),
  },
  none: {
    label: "No Website",
    badgeColor: "red",
    metaFor: "Marina Legal Consultants · 1.2s",
    body: (
      <div className="space-y-3 text-sm leading-7 text-[var(--text-secondary)]">
        <p>Hi,</p>
        <p>
          I was looking for legal services in Dubai Marina and found <span className="font-medium text-[var(--text-primary)]">Marina Legal Consultants</span> — great Google reviews, but no website.
        </p>
        <p>Every day without a website, potential clients searching &ldquo;legal consultant Dubai Marina&rdquo; are going to competitors who have one. Your 4.7★ reputation deserves more than a Google listing.</p>
        <ul className="list-disc space-y-1.5 pl-4">
          <li>Clients can&rsquo;t find your services without calling first</li>
          <li>No portfolio, no testimonials, no contact form</li>
          <li>Zero Google search visibility outside Maps</li>
        </ul>
        <p>I build professional websites for legal firms. Would you be open to a quick chat about what this could mean for your enquiry volume?</p>
      </div>
    ),
  },
  social: {
    label: "Social Only",
    badgeColor: "indigo",
    metaFor: "Blue Wave Restaurant · 1.1s",
    body: (
      <div className="space-y-3 text-sm leading-7 text-[var(--text-secondary)]">
        <p>Hi Blue Wave team,</p>
        <p>
          Your <span className="font-medium text-[var(--text-primary)]">Instagram</span> looks incredible — 4,200 followers and great content. But right now, that audience is trapped on a platform you don&rsquo;t own.
        </p>
        <ul className="list-disc space-y-1.5 pl-4">
          <li>No website = no way to take online reservations</li>
          <li>No Google search presence — invisible to people who don&rsquo;t already know you</li>
          <li>If Instagram changes its algorithm, you lose everything overnight</li>
        </ul>
        <p>A website would turn your existing followers into bookings you control — with an online menu, reservation form, and Google visibility. Worth a 10-minute conversation?</p>
      </div>
    ),
  },
  platform: {
    label: "Platform Only",
    badgeColor: "indigo",
    metaFor: "Bloom Spa & Wellness · 1.3s",
    body: (
      <div className="space-y-3 text-sm leading-7 text-[var(--text-secondary)]">
        <p>Hi,</p>
        <p>
          I found <span className="font-medium text-[var(--text-primary)]">Bloom Spa & Wellness</span> on Fresha — great reviews, but no website of your own.
        </p>
        <p>Right now every booking goes through Fresha&rsquo;s platform. That means you&rsquo;re paying a commission on every appointment, you don&rsquo;t own your client list, and if Fresha changes its terms you lose everything overnight.</p>
        <ul className="list-disc space-y-1.5 pl-4">
          <li>No Google search presence outside the Fresha listing</li>
          <li>No direct bookings — every client goes through a third party</li>
          <li>No brand story, no portfolio, no SEO you control</li>
        </ul>
        <p>A professional website would give you direct bookings, your own client database, and visibility on Google. Would you be open to a quick call?</p>
      </div>
    ),
  },
};

export function SamplePitchSection({ navigate }: { navigate: (href: string) => void }) {
  const [activeTab, setActiveTab] = useState<PitchTab>("weak");
  const [tone, setTone] = useState<ToneOption>("professional");
  const prefersReducedMotion = useReducedMotion() ?? false;
  const example = PITCH_EXAMPLES[activeTab];

  function cycleTone() {
    setTone((t) => NEXT_TONE[t]);
  }

  const metaDisplay = `Tone: ${TONE_LABELS[tone]} · For: ${example.metaFor}`;

  return (
    <section id="pitch" className="border-t border-[var(--border)] bg-[var(--bg-surface)] py-24">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="grid gap-12 lg:grid-cols-2">
          {/* Left */}
          <div>
            <SectionLabel>Sample pitches</SectionLabel>
            <SectionTitle>Every opportunity type gets a tailored pitch.</SectionTitle>
            <SectionSub>
              Pitches are generated from real opportunity data — not templates. The angle changes completely depending on whether the business has no website, social-only, platform-only, or a weak one.
            </SectionSub>

            <div className="mt-8 space-y-4">
              {[
                { icon: Zap,       text: "Angle adapts to the opportunity type — new build, social conversion, or improvement" },
                { icon: FileText,  text: "Adjustable tone: professional, friendly, or luxury" },
                { icon: TrendingUp, text: "Cites real data — performance scores, missing features, estimated impact" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.text} className="flex items-start gap-3 text-sm text-[var(--text-secondary)]">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" />
                    <span>{item.text}</span>
                  </div>
                );
              })}
            </div>

            {/* Tab strip — left side */}
            <div className="mt-8 flex flex-wrap gap-2">
              {(["weak", "none", "social", "platform"] as PitchTab[]).map((id) => {
                const tab = PITCH_EXAMPLES[id];
                return (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                      activeTab === id
                        ? "border-[var(--accent)] bg-[var(--accent-tint)] text-[var(--accent)]"
                        : "border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Pitch card */}
          <div>
            <Card variant="default" padding="lg" className="border-[var(--border-strong)]">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-[var(--accent)]" />
                  <span className="text-sm font-medium text-[var(--text-primary)]">Generated pitch</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge color={example.badgeColor}>{example.label}</Badge>
                  <Badge color="green" dot>Ready to send</Badge>
                </div>
              </div>

              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5">
                {prefersReducedMotion ? (
                  <>
                    <p className="mb-4 text-xs text-[var(--text-tertiary)]">{metaDisplay}</p>
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
                      <p className="mb-4 text-xs text-[var(--text-tertiary)]">{metaDisplay}</p>
                      {example.body}
                    </motion.div>
                  </AnimatePresence>
                )}

                <div className="mt-5 flex flex-col gap-3 border-t border-[var(--border)] pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      className="flex-1 sm:flex-none"
                      onClick={cycleTone}
                      title={`Current: ${TONE_LABELS[tone]} — click to switch`}
                    >
                      Tone: {TONE_LABELS[tone]}
                    </Button>
                    <Button variant="secondary" className="flex-1 sm:flex-none">Regenerate</Button>
                  </div>
                  <Button variant="primary" onClick={() => navigate("/signup")} className="w-full sm:w-auto">
                    Copy pitch →
                  </Button>
                </div>
              </div>

              <p className="mt-4 text-center text-xs text-[var(--text-tertiary)]">
                Every pitch is unique. No templates — pitch angle, evidence, and tone are all generated from the opportunity.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
