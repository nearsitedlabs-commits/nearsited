"use client";

import { useState } from "react";
import { motion, AnimatePresence, useSafeReducedMotion } from "@/lib/motion";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SectionLabel } from "@/components/landing/SectionLabel";
import { SectionTitle } from "@/components/landing/SectionTitle";
import { SectionSub } from "@/components/landing/SectionSub";

type ReportTab = "weak" | "none" | "social" | "platform";

type IssueItem = { issue: string; impact: string };

const WEAK_ISSUES: IssueItem[] = [
  { issue: "Homepage takes 4.2s to load on mobile — Google says 53% of visitors leave if it takes over 3s", impact: "High" },
  { issue: "No schema markup — not showing up in Google's local pack for 'dentist near me'", impact: "High" },
  { issue: "SSL certificate expired 3 months ago — Chrome shows 'Not Secure' in the address bar", impact: "Medium" },
  { issue: "Contact page is a static address with no form, map, or click-to-call button", impact: "Medium" },
  { issue: "Site hasn't been updated since 2021 — pricing page still mentions COVID protocols", impact: "Low" },
];

const WEAK_SCORES = [
  { label: "Performance", score: 42 },
  { label: "Mobile UX",   score: 39 },
  { label: "SEO",         score: 48 },
  { label: "Design",      score: 36 },
  { label: "Trust",       score: 38 },
];

// ── Tab config ─────────────────────────────────────────────────────────────────

const TABS: { id: ReportTab; label: string; badge: string; badgeColor: string }[] = [
  { id: "weak",     label: "Weak Website",   badge: "Redesign",            badgeColor: "amber" },
  { id: "none",     label: "No site",        badge: "Website Build",       badgeColor: "red" },
  { id: "social",   label: "Social Only",    badge: "Website Opportunity", badgeColor: "indigo" },
  { id: "platform", label: "Platform Only",  badge: "Website Build",       badgeColor: "indigo" },
];

// ── Tab content components to avoid duplication ─────────────────────────────────

function WeakWebsiteContent() {
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--color-border-subtle)] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-medium text-[var(--color-text-primary)]">Brighton Dental</h3>
            <Badge color="green">Opportunity: 87/100</Badge>
            <Badge color="green">Verified</Badge>
          </div>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">brightondental.co.uk · Brighton, UK · Dentist</p>
        </div>
      </div>
      <div className="mt-6 rounded-[var(--radius-md)] border border-[var(--score-high)]/30 bg-[var(--score-high-tint)] p-5">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-4 w-4 text-[var(--score-high)]" />
          <span className="text-sm font-medium text-[var(--score-high)]">5 issues found</span>
        </div>
        <ul className="space-y-3 text-sm text-[var(--color-text-secondary)]">
          {WEAK_ISSUES.map((item) => (
            <li key={item.issue} className="flex items-start justify-between gap-3 rounded-[var(--radius-sm)] bg-[var(--color-bg-surface)] p-3">
              <span className="font-medium text-[var(--color-text-primary)]">{item.issue}</span>
              <span className="shrink-0 text-[11px] text-[var(--score-high)]">{item.impact}</span>
            </li>
          ))}
        </ul>
      </div>
      <details className="mt-4 group">
        <summary className="cursor-pointer text-[11px] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] list-none flex items-center gap-1.5">
          <svg aria-hidden="true" className="h-3 w-3 transition-transform group-open:rotate-90" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
          Technical scores
        </summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {WEAK_SCORES.map((item) => (
            <div key={item.label} className="rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] p-3 text-center">
              <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">{item.label}</p>
              <p className="mt-1 text-xl font-bold" style={{ color: item.score < 40 ? "var(--score-high)" : item.score < 55 ? "var(--score-mid)" : "var(--score-good)" }}>
                {item.score}
              </p>
            </div>
          ))}
        </div>
      </details>
    </>
  );
}

function NoWebsiteContent() {
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--color-border-subtle)] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-medium text-[var(--color-text-primary)]">Harbor Legal Group</h3>
            <Badge color="green">Opportunity: 85/100</Badge>
            <Badge color="green">Verified</Badge>
            <Badge color="red">No site</Badge>
          </div>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Google Business only · Downtown, Austin, TX · Legal Services</p>
        </div>
      </div>

      <div className="mt-6 rounded-[var(--radius-md)] border border-[var(--score-high)]/30 bg-[var(--score-high-tint)] p-5">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="h-4 w-4 text-[var(--score-high)]" />
          <span className="text-sm font-medium text-[var(--score-high)]">No website detected</span>
        </div>
        <p className="text-sm leading-7 text-[var(--color-text-secondary)]">
          This firm has no website. Their entire online presence is a single Google Business profile. No portfolio of case outcomes, no lawyer profiles, no contact form, no blog — and no Google search presence outside Maps. Every competitor firm with a website is capturing the clients they&rsquo;re missing.
        </p>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Google reviews", value: "4.7★ (38)", note: "Strong social proof" },
          { label: "In operation", value: "Since 2014", note: "Established practice" },
          { label: "Website", value: "None", note: "Highest-value opportunity" },
        ].map((item) => (
          <div key={item.label} className="rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] p-4">
            <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">{item.label}</p>
            <p className="mt-1 text-base font-medium text-[var(--color-text-primary)]">{item.value}</p>
            <p className="mt-0.5 text-xs text-[var(--color-accent)]">{item.note}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] p-4">
        <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-tertiary)] mb-2">AI-generated pitch</p>
        <p className="text-sm leading-7 text-[var(--color-text-secondary)] italic">
          &ldquo;Hi, I noticed Harbor Legal Group has strong reviews but no website. Potential clients searching for a lawyer in downtown Austin are finding your competitors first. I build legal practice websites — would you be open to a quick call?&rdquo;
        </p>
      </div>
    </>
  );
}

function SocialOnlyContent() {
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--color-border-subtle)] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-medium text-[var(--color-text-primary)]">The Hideaway Cafe</h3>
            <Badge color="green">Opportunity: 72/100</Badge>
            <Badge color="green">Verified</Badge>
            <Badge color="indigo">Social Only</Badge>
          </div>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">instagram.com/hideawaycafe · Byron Bay, NSW · Cafe</p>
        </div>
      </div>

      <div className="mt-6 rounded-[var(--radius-md)] border border-[var(--color-info)]/20 bg-[var(--color-info)]/10 p-5">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="h-4 w-4 text-[var(--color-info)]" />
          <span className="text-sm font-medium text-[var(--color-info)]">No website — Instagram is the entire online presence</span>
        </div>
        <p className="text-sm leading-7 text-[var(--color-text-secondary)]">
          This cafe runs its entire digital presence through Instagram. There&rsquo;s no menu page, no table reservation system, no Google search visibility, and no way to capture customer emails. If Instagram changes its algorithm or the account gets flagged, they lose all digital discoverability overnight.
        </p>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Instagram followers", value: "4,200", note: "Engaged local audience" },
          { label: "Booking method", value: "DMs & walk-ins", note: "No reservation system" },
          { label: "Google findability", value: "Low", note: "No SEO footprint" },
        ].map((item) => (
          <div key={item.label} className="rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] p-4">
            <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">{item.label}</p>
            <p className="mt-1 text-base font-medium text-[var(--color-text-primary)]">{item.value}</p>
            <p className="mt-0.5 text-xs text-[var(--color-accent)]">{item.note}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] p-4">
        <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-tertiary)] mb-2">AI-generated pitch</p>
        <p className="text-sm leading-7 text-[var(--color-text-secondary)] italic">
          &ldquo;Hi, The Hideaway Cafe has a great Instagram following. But Instagram isn&rsquo;t a website — you can&rsquo;t rank on Google, take reservations, or own your customer data through it. A simple website with your menu and a booking form would capture all the people searching for cafes in Byron Bay right now.&rdquo;
        </p>
      </div>
    </>
  );
}

function PlatformOnlyContent() {
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--color-border-subtle)] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-medium text-[var(--color-text-primary)]">Bloom Beauty Bar</h3>
            <Badge color="green">Opportunity: 65/100</Badge>
            <Badge color="green">Verified</Badge>
            <Badge color="indigo">Platform Only</Badge>
          </div>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">booksy.com/bloom-beauty-bar · Williamsburg, Brooklyn, NY · Salon</p>
        </div>
      </div>

      <div className="mt-6 rounded-[var(--radius-md)] border border-[var(--badge-indigo-border)] bg-[var(--badge-indigo-bg)] p-5">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="h-4 w-4 text-[var(--badge-indigo-text)]" />
          <span className="text-sm font-medium text-[var(--badge-indigo-text)]">Entire online presence is on a third-party platform</span>
        </div>
        <p className="text-sm leading-7 text-[var(--color-text-secondary)]">
          This salon exists only as a listing on Booksy. No website means no brand story, no service menu, no Google search presence, and no direct client relationships. Every booking goes through the platform, paying commission each time — with no way to retain customers if they leave.
        </p>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Online presence",  value: "Booksy only",  note: "No owned property" },
          { label: "Google findability", value: "Minimal",    note: "No SEO outside platform" },
          { label: "Direct bookings",  value: "Platform only", note: "Pays commission per appointment" },
        ].map((item) => (
          <div key={item.label} className="rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] p-4">
            <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">{item.label}</p>
            <p className="mt-1 text-base font-medium text-[var(--color-text-primary)]">{item.value}</p>
            <p className="mt-0.5 text-xs text-[var(--color-accent)]">{item.note}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] p-4">
        <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-tertiary)] mb-2">AI-generated pitch</p>
        <p className="text-sm leading-7 text-[var(--color-text-secondary)] italic">
          &ldquo;Hi, I saw Bloom Beauty Bar is listed on Booksy with good reviews, but you don&rsquo;t have your own website. Every booking through the platform means paying commission, and you don&rsquo;t own the client relationship. A website would let clients book directly and find you on Google — completely on your own terms.&rdquo;
        </p>
      </div>
    </>
  );
}

function TabContent({ activeTab }: { activeTab: ReportTab }) {
  switch (activeTab) {
    case "weak":     return <WeakWebsiteContent />;
    case "none":     return <NoWebsiteContent />;
    case "social":   return <SocialOnlyContent />;
    case "platform": return <PlatformOnlyContent />;
  }
}

export function SampleReportSection({ navigate }: { navigate: (href: string) => void }) {
  const [activeTab, setActiveTab] = useState<ReportTab>("weak");
  const prefersReducedMotion = useSafeReducedMotion();

  return (
    <section id="report" className="border-t border-[var(--color-border-subtle)] py-14 md:py-24">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="max-w-3xl">
          <SectionLabel>SAMPLE OPPORTUNITY REPORT</SectionLabel>
          <SectionTitle>Every opportunity type, one platform.</SectionTitle>
          <SectionSub>
            Nearsited discovers all four kinds of website opportunity. Here&rsquo;s what each report looks like.
          </SectionSub>
          <p className="mt-3 text-xs text-[var(--color-text-tertiary)]">
            Sample data — actual output uses real audit data from Google Places and PageSpeed Insights.
          </p>
        </div>

        {/* Tab strip */}
        <div className="relative mt-8">
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-[var(--color-bg-page)] to-transparent sm:hidden" />
          <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 whitespace-nowrap rounded-[var(--radius-sm)] border px-4 py-2 min-h-[44px] text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                    : "border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--color-text-primary)]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <Card variant="default" padding="lg" className="mt-4 border-[var(--border-strong)]">
          {prefersReducedMotion ? (
            <TabContent activeTab={activeTab} />
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <TabContent activeTab={activeTab} />
              </motion.div>
            </AnimatePresence>
          )}

          {/* CTA */}
          <div className="mt-6 flex flex-col gap-4 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--color-text-primary)]">Want to find opportunities like this in your city?</p>
              <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">Choose from 249 business types across 16 industries. Get ranked leads in under 2 minutes.</p>
            </div>
            <Button variant="primary" onClick={() => navigate("/signup")} className="w-full sm:w-auto">
              Try it now →
            </Button>
          </div>
        </Card>
      </div>
    </section>
  );
}
