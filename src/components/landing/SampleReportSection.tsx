"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "@/lib/motion";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SectionLabel } from "@/components/landing/SectionLabel";
import { SectionTitle } from "@/components/landing/SectionTitle";
import { SectionSub } from "@/components/landing/SectionSub";

type ReportTab = "weak" | "none" | "social" | "platform";

export function SampleReportSection({ navigate }: { navigate: (href: string) => void }) {
  const [activeTab, setActiveTab] = useState<ReportTab>("weak");
  const prefersReducedMotion = useReducedMotion() ?? true;

  const tabs: { id: ReportTab; label: string; badge: string; badgeColor: string }[] = [
    { id: "weak",     label: "Weak Website",   badge: "Redesign",            badgeColor: "amber" },
    { id: "none",     label: "No Website",     badge: "Website Build",       badgeColor: "red" },
    { id: "social",   label: "Social Only",    badge: "Website Opportunity", badgeColor: "indigo" },
    { id: "platform", label: "Platform Only",  badge: "Website Build",       badgeColor: "indigo" },
  ];

  return (
    <section id="report" className="border-t border-[var(--border)] py-14 md:py-24">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="max-w-3xl">
          <SectionLabel>SAMPLE OPPORTUNITY REPORT</SectionLabel>
          <SectionTitle>Every opportunity type, one platform.</SectionTitle>
          <SectionSub>
            Nearsited discovers all four kinds of website opportunity. Here&rsquo;s what each report looks like.
          </SectionSub>
        </div>

        {/* Tab strip */}
        <div className="mt-8 flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "border-[var(--accent)] bg-[var(--accent-tint)] text-[var(--accent)]"
                  : "border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <Card variant="default" padding="lg" className="mt-4 border-[var(--border-strong)]">

          {prefersReducedMotion ? (
            <>
              {/* ── Weak Website ───────────────────────────────────────── */}
              {activeTab === "weak" && (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border)] pb-6">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-medium text-[var(--text-primary)]">Bright Smile Dental</h3>
                        <Badge color="green">Opportunity: 87/100</Badge>
                        <Badge color="green">Verified</Badge>
                      </div>
                      <p className="mt-1 text-sm text-[var(--text-secondary)]">brightsmile.ae · Jumeirah, Dubai · Dentist</p>
                    </div>
                  </div>
                  <div className="mt-6 rounded-xl border border-[var(--score-high)]/30 bg-[var(--score-high-tint)] p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <AlertTriangle className="h-4 w-4 text-[var(--score-high)]" />
                      <span className="text-sm font-medium text-[var(--score-high)]">5 critical issues found</span>
                    </div>
                    <ul className="space-y-3 text-sm text-[var(--text-secondary)]">
                      {[
                        { issue: "Slow mobile load time (LCP: 4.2s)", impact: "High", pitch: "Faster experience = more bookings" },
                        { issue: "Missing local SEO schema", impact: "Medium", pitch: "Local SEO = free patient acquisition" },
                        { issue: "No SSL certificate badge", impact: "High", pitch: "Trust signals = higher conversion" },
                        { issue: "Outdated design (last updated 2021)", impact: "Medium", pitch: "Modern design = perceived quality" },
                        { issue: "No clear CTA above the fold", impact: "High", pitch: "Clear CTA = measurable bookings" },
                      ].map((item) => (
                        <li key={item.issue} className="flex flex-col gap-1 rounded-lg bg-[var(--bg-surface)] p-3">
                          <div className="flex items-start justify-between gap-3">
                            <span className="font-medium text-[var(--text-primary)]">{item.issue}</span>
                            <span className="shrink-0 text-[11px] text-[var(--score-high)]">{item.impact}</span>
                          </div>
                          <span className="text-[var(--accent)] text-xs">Pitch: {item.pitch}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <details className="mt-4 group">
                    <summary className="cursor-pointer text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] list-none flex items-center gap-1.5">
                      <svg className="h-3 w-3 transition-transform group-open:rotate-90" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                      Technical Analysis
                    </summary>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                      {[
                        { label: "Performance", score: 42 },
                        { label: "Mobile UX",   score: 39 },
                        { label: "SEO",         score: 48 },
                        { label: "Design",      score: 36 },
                        { label: "Trust",       score: 38 },
                      ].map((item) => (
                        <div key={item.label} className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-3 text-center">
                          <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--text-tertiary)]">{item.label}</p>
                          <p className="mt-1 text-xl font-bold" style={{ color: item.score < 40 ? "var(--score-high)" : item.score < 55 ? "var(--score-mid)" : "var(--score-good)" }}>
                            {item.score}
                          </p>
                        </div>
                      ))}
                    </div>
                  </details>
                </>
              )}

              {/* ── No Website ─────────────────────────────────────────── */}
              {activeTab === "none" && (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border)] pb-6">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-medium text-[var(--text-primary)]">Marina Legal Consultants</h3>
                        <Badge color="green">Opportunity: 85/100</Badge>
                        <Badge color="green">Verified</Badge>
                        <Badge color="red">No Website</Badge>
                      </div>
                      <p className="mt-1 text-sm text-[var(--text-secondary)]">Google Business only · Dubai Marina · Legal Services</p>
                    </div>
                  </div>

                  <div className="mt-6 rounded-xl border border-[var(--score-high)]/30 bg-[var(--score-high-tint)] p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="h-4 w-4 text-[var(--score-high)]" />
                      <span className="text-sm font-medium text-[var(--score-high)]">No web presence detected</span>
                    </div>
                    <p className="text-sm leading-7 text-[var(--text-secondary)]">
                      This business has no website. All online visibility relies on a single Google Business listing, no portfolio, no testimonials, no contact form, no SEO footprint. Every competitor with a website has a structural advantage.
                    </p>
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-3">
                    {[
                      { label: "Google reviews", value: "4.7★ (38)", note: "Strong social proof" },
                      { label: "In operation", value: "6+ years", note: "Established business" },
                      { label: "Website", value: "None", note: "Highest-value opportunity" },
                    ].map((item) => (
                      <div key={item.label} className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
                        <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--text-tertiary)]">{item.label}</p>
                        <p className="mt-1 text-base font-medium text-[var(--text-primary)]">{item.value}</p>
                        <p className="mt-0.5 text-xs text-[var(--accent)]">{item.note}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-tertiary)] mb-2">AI-generated pitch angle</p>
                    <p className="text-sm leading-7 text-[var(--text-secondary)] italic">
                      &ldquo;Hi, I noticed Marina Legal Consultants has great reviews but no website. Every day without one, you&rsquo;re invisible to clients searching Google. I build professional legal websites that turn your 4.7★ reputation into new enquiries.&rdquo;
                    </p>
                  </div>
                </>
              )}

              {/* ── Social Only ────────────────────────────────────────── */}
              {activeTab === "social" && (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border)] pb-6">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-medium text-[var(--text-primary)]">Blue Wave Restaurant</h3>
                        <Badge color="green">Opportunity: 72/100</Badge>
                        <Badge color="green">Verified</Badge>
                        <Badge color="indigo">Social Only</Badge>
                      </div>
                      <p className="mt-1 text-sm text-[var(--text-secondary)]">instagram.com/bluewaverest · JBR, Dubai · Restaurant</p>
                    </div>
                  </div>

                  <div className="mt-6 rounded-xl border border-[var(--score-mid)]/20 bg-[var(--score-mid-tint)] p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="h-4 w-4 text-[var(--score-mid)]" />
                      <span className="text-sm font-medium text-[var(--score-mid)]">Entire online presence is rented</span>
                    </div>
                    <p className="text-sm leading-7 text-[var(--text-secondary)]">
                      This business runs its entire online presence through Instagram. No website means no menu page, no reservation form, no SEO, no owned customer data. If Instagram changes its algorithm or bans the account, the business loses all digital visibility overnight.
                    </p>
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-3">
                    {[
                      { label: "Instagram followers", value: "4,200", note: "Engaged audience, no website" },
                      { label: "Booking method", value: "DMs only", note: "No reservation system" },
                      { label: "Google findability", value: "Minimal", note: "No SEO footprint" },
                    ].map((item) => (
                      <div key={item.label} className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
                        <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--text-tertiary)]">{item.label}</p>
                        <p className="mt-1 text-base font-medium text-[var(--text-primary)]">{item.value}</p>
                        <p className="mt-0.5 text-xs text-[var(--accent)]">{item.note}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-tertiary)] mb-2">AI-generated pitch angle</p>
                    <p className="text-sm leading-7 text-[var(--text-secondary)] italic">
                      &ldquo;Hi, Blue Wave&rsquo;s Instagram looks great. But Instagram isn&rsquo;t a website. You don&rsquo;t own it, you can&rsquo;t rank on Google, and bookings via DM cost you time every day. A real website takes your 4,200 followers and turns them into reservations you control.&rdquo;
                    </p>
                  </div>
                </>
              )}

              {/* ── Platform Only ──────────────────────────────────────── */}
              {activeTab === "platform" && (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border)] pb-6">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-medium text-[var(--text-primary)]">Bloom Spa & Wellness</h3>
                        <Badge color="green">Opportunity: 65/100</Badge>
                        <Badge color="green">Verified</Badge>
                        <Badge color="indigo">Platform Only</Badge>
                      </div>
                      <p className="mt-1 text-sm text-[var(--text-secondary)]">fresha.com/bloom-spa · Downtown Dubai · Beauty & Wellness</p>
                    </div>
                  </div>

                  <div className="mt-6 rounded-xl border border-[var(--badge-indigo-border)] bg-[var(--badge-indigo-bg)] p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="h-4 w-4 text-[var(--badge-indigo-text)]" />
                      <span className="text-sm font-medium text-[var(--badge-indigo-text)]">Entire online presence is on a third-party platform</span>
                    </div>
                    <p className="text-sm leading-7 text-[var(--text-secondary)]">
                      This business exists only as a listing on Fresha. No website means no brand story, no portfolio, no SEO footprint, and no direct bookings. If Fresha changes its fee structure or removes the listing, the business loses all online discoverability overnight.
                    </p>
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-3">
                    {[
                      { label: "Online presence",  value: "Fresha only",  note: "No owned web property" },
                      { label: "Google findability", value: "Minimal",    note: "No SEO outside the platform" },
                      { label: "Direct bookings",  value: "Platform only", note: "Pays % on every appointment" },
                    ].map((item) => (
                      <div key={item.label} className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
                        <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--text-tertiary)]">{item.label}</p>
                        <p className="mt-1 text-base font-medium text-[var(--text-primary)]">{item.value}</p>
                        <p className="mt-0.5 text-xs text-[var(--accent)]">{item.note}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-tertiary)] mb-2">AI-generated pitch angle</p>
                    <p className="text-sm leading-7 text-[var(--text-secondary)] italic">
                      &ldquo;Hi, I noticed Bloom Spa is listed on Fresha, but has no website of its own. Every booking goes through Fresha&rsquo;s platform. You&rsquo;re paying a commission each time and have no direct relationship with your clients. A website gives you direct bookings, your own brand, and Google visibility you actually own.&rdquo;
                    </p>
                  </div>
                </>
              )}
            </>
          ) : (
            <AnimatePresence mode="wait">
              {activeTab === "weak" && (
                <motion.div
                  key="weak"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border)] pb-6">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-medium text-[var(--text-primary)]">Bright Smile Dental</h3>
                        <Badge color="green">Opportunity: 87/100</Badge>
                        <Badge color="green">Verified</Badge>
                      </div>
                      <p className="mt-1 text-sm text-[var(--text-secondary)]">brightsmile.ae · Jumeirah, Dubai · Dentist</p>
                    </div>
                  </div>
                  <div className="mt-6 rounded-xl border border-[var(--score-high)]/30 bg-[var(--score-high-tint)] p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <AlertTriangle className="h-4 w-4 text-[var(--score-high)]" />
                      <span className="text-sm font-medium text-[var(--score-high)]">5 critical issues found</span>
                    </div>
                    <ul className="space-y-3 text-sm text-[var(--text-secondary)]">
                      {[
                        { issue: "Slow mobile load time (LCP: 4.2s)", impact: "High", pitch: "Faster experience = more bookings" },
                        { issue: "Missing local SEO schema", impact: "Medium", pitch: "Local SEO = free patient acquisition" },
                        { issue: "No SSL certificate badge", impact: "High", pitch: "Trust signals = higher conversion" },
                        { issue: "Outdated design (last updated 2021)", impact: "Medium", pitch: "Modern design = perceived quality" },
                        { issue: "No clear CTA above the fold", impact: "High", pitch: "Clear CTA = measurable bookings" },
                      ].map((item) => (
                        <li key={item.issue} className="flex flex-col gap-1 rounded-lg bg-[var(--bg-surface)] p-3">
                          <div className="flex items-start justify-between gap-3">
                            <span className="font-medium text-[var(--text-primary)]">{item.issue}</span>
                            <span className="shrink-0 text-[11px] text-[var(--score-high)]">{item.impact}</span>
                          </div>
                          <span className="text-[var(--accent)] text-xs">Pitch: {item.pitch}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <details className="mt-4 group">
                    <summary className="cursor-pointer text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] list-none flex items-center gap-1.5">
                      <svg className="h-3 w-3 transition-transform group-open:rotate-90" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                      Technical Analysis
                    </summary>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                      {[
                        { label: "Performance", score: 42 },
                        { label: "Mobile UX",   score: 39 },
                        { label: "SEO",         score: 48 },
                        { label: "Design",      score: 36 },
                        { label: "Trust",       score: 38 },
                      ].map((item) => (
                        <div key={item.label} className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-3 text-center">
                          <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--text-tertiary)]">{item.label}</p>
                          <p className="mt-1 text-xl font-bold" style={{ color: item.score < 40 ? "var(--score-high)" : item.score < 55 ? "var(--score-mid)" : "var(--score-good)" }}>
                            {item.score}
                          </p>
                        </div>
                      ))}
                    </div>
                  </details>
                </motion.div>
              )}

              {activeTab === "none" && (
                <motion.div
                  key="none"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border)] pb-6">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-medium text-[var(--text-primary)]">Marina Legal Consultants</h3>
                        <Badge color="green">Opportunity: 85/100</Badge>
                        <Badge color="green">Verified</Badge>
                        <Badge color="red">No Website</Badge>
                      </div>
                      <p className="mt-1 text-sm text-[var(--text-secondary)]">Google Business only · Dubai Marina · Legal Services</p>
                    </div>
                  </div>

                  <div className="mt-6 rounded-xl border border-[var(--score-high)]/30 bg-[var(--score-high-tint)] p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="h-4 w-4 text-[var(--score-high)]" />
                      <span className="text-sm font-medium text-[var(--score-high)]">No web presence detected</span>
                    </div>
                    <p className="text-sm leading-7 text-[var(--text-secondary)]">
                      This business has no website. All online visibility relies on a single Google Business listing, no portfolio, no testimonials, no contact form, no SEO footprint. Every competitor with a website has a structural advantage.
                    </p>
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-3">
                    {[
                      { label: "Google reviews", value: "4.7★ (38)", note: "Strong social proof" },
                      { label: "In operation", value: "6+ years", note: "Established business" },
                      { label: "Website", value: "None", note: "Highest-value opportunity" },
                    ].map((item) => (
                      <div key={item.label} className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
                        <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--text-tertiary)]">{item.label}</p>
                        <p className="mt-1 text-base font-medium text-[var(--text-primary)]">{item.value}</p>
                        <p className="mt-0.5 text-xs text-[var(--accent)]">{item.note}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-tertiary)] mb-2">AI-generated pitch angle</p>
                    <p className="text-sm leading-7 text-[var(--text-secondary)] italic">
                      &ldquo;Hi, I noticed Marina Legal Consultants has great reviews but no website. Every day without one, you&rsquo;re invisible to clients searching Google. I build professional legal websites that turn your 4.7★ reputation into new enquiries.&rdquo;
                    </p>
                  </div>
                </motion.div>
              )}

              {activeTab === "social" && (
                <motion.div
                  key="social"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border)] pb-6">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-medium text-[var(--text-primary)]">Blue Wave Restaurant</h3>
                        <Badge color="green">Opportunity: 72/100</Badge>
                        <Badge color="green">Verified</Badge>
                        <Badge color="indigo">Social Only</Badge>
                      </div>
                      <p className="mt-1 text-sm text-[var(--text-secondary)]">instagram.com/bluewaverest · JBR, Dubai · Restaurant</p>
                    </div>
                  </div>

                  <div className="mt-6 rounded-xl border border-[var(--score-mid)]/20 bg-[var(--score-mid-tint)] p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="h-4 w-4 text-[var(--score-mid)]" />
                      <span className="text-sm font-medium text-[var(--score-mid)]">Entire online presence is rented</span>
                    </div>
                    <p className="text-sm leading-7 text-[var(--text-secondary)]">
                      This business runs its entire online presence through Instagram. No website means no menu page, no reservation form, no SEO, no owned customer data. If Instagram changes its algorithm or bans the account, the business loses all digital visibility overnight.
                    </p>
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-3">
                    {[
                      { label: "Instagram followers", value: "4,200", note: "Engaged audience, no website" },
                      { label: "Booking method", value: "DMs only", note: "No reservation system" },
                      { label: "Google findability", value: "Minimal", note: "No SEO footprint" },
                    ].map((item) => (
                      <div key={item.label} className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
                        <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--text-tertiary)]">{item.label}</p>
                        <p className="mt-1 text-base font-medium text-[var(--text-primary)]">{item.value}</p>
                        <p className="mt-0.5 text-xs text-[var(--accent)]">{item.note}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-tertiary)] mb-2">AI-generated pitch angle</p>
                    <p className="text-sm leading-7 text-[var(--text-secondary)] italic">
                      &ldquo;Hi, Blue Wave&rsquo;s Instagram looks great. But Instagram isn&rsquo;t a website. You don&rsquo;t own it, you can&rsquo;t rank on Google, and bookings via DM cost you time every day. A real website takes your 4,200 followers and turns them into reservations you control.&rdquo;
                    </p>
                  </div>
                </motion.div>
              )}

              {activeTab === "platform" && (
                <motion.div
                  key="platform"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border)] pb-6">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-medium text-[var(--text-primary)]">Bloom Spa & Wellness</h3>
                        <Badge color="green">Opportunity: 65/100</Badge>
                        <Badge color="green">Verified</Badge>
                        <Badge color="indigo">Platform Only</Badge>
                      </div>
                      <p className="mt-1 text-sm text-[var(--text-secondary)]">fresha.com/bloom-spa · Downtown Dubai · Beauty & Wellness</p>
                    </div>
                  </div>

                  <div className="mt-6 rounded-xl border border-[var(--badge-indigo-border)] bg-[var(--badge-indigo-bg)] p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="h-4 w-4 text-[var(--badge-indigo-text)]" />
                      <span className="text-sm font-medium text-[var(--badge-indigo-text)]">Entire online presence is on a third-party platform</span>
                    </div>
                    <p className="text-sm leading-7 text-[var(--text-secondary)]">
                      This business exists only as a listing on Fresha. No website means no brand story, no portfolio, no SEO footprint, and no direct bookings. If Fresha changes its fee structure or removes the listing, the business loses all online discoverability overnight.
                    </p>
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-3">
                    {[
                      { label: "Online presence",  value: "Fresha only",  note: "No owned web property" },
                      { label: "Google findability", value: "Minimal",    note: "No SEO outside the platform" },
                      { label: "Direct bookings",  value: "Platform only", note: "Pays % on every appointment" },
                    ].map((item) => (
                      <div key={item.label} className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
                        <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--text-tertiary)]">{item.label}</p>
                        <p className="mt-1 text-base font-medium text-[var(--text-primary)]">{item.value}</p>
                        <p className="mt-0.5 text-xs text-[var(--accent)]">{item.note}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-tertiary)] mb-2">AI-generated pitch angle</p>
                    <p className="text-sm leading-7 text-[var(--text-secondary)] italic">
                      &ldquo;Hi, I noticed Bloom Spa is listed on Fresha, but has no website of its own. Every booking goes through Fresha&rsquo;s platform. You&rsquo;re paying a commission each time and have no direct relationship with your clients. A website gives you direct bookings, your own brand, and Google visibility you actually own.&rdquo;
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}

          {/* CTA — shared */}
          <div className="mt-6 flex flex-col gap-4 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">Want to find opportunities like this in your city?</p>
              <p className="mt-1 text-xs text-[var(--text-tertiary)]">Choose from 249 business types across 16 industries. Get ranked leads in under 2 minutes.</p>
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
