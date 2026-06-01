"use client";

import {
  Search, Target, Mail, TrendingUp, Check,
  Zap, ExternalLink, DollarSign,
  ArrowUpRight, AlertTriangle,
  FileText, MessageSquare, Users, Briefcase,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { useState } from "react";

// ── Section helpers ──────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 inline-flex items-center gap-3 text-[0.7rem] uppercase tracking-[0.18em] text-[var(--accent)]">
      <span className="block h-px w-6 bg-[var(--accent)]" />
      {children}
    </div>
  );
}

function SectionTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <h2 className={`text-[clamp(1.8rem,3vw,2.8rem)] font-medium leading-[1.15] tracking-[-0.02em] text-[var(--text-primary)] ${className}`}>
      {children}
    </h2>
  );
}

function SectionSub({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`mt-4 max-w-2xl text-base leading-7 text-[var(--text-secondary)] ${className}`}>
      {children}
    </p>
  );
}

// ── Nav ──────────────────────────────────────────────────────────────────────

function Nav() {
  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-[var(--border)] bg-[var(--bg-base)]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-8">
        <a href="#" className="inline-flex items-center gap-2.5 text-base font-medium text-[var(--text-primary)]" style={{ fontFamily: 'Switzer, Geist, sans-serif' }}>
          <img src="/logo-icon.svg" alt="" width={36} height={20.6} className="block shrink-0" />
          <span className="text-[22px] font-medium tracking-[0.02em] text-[var(--text-primary)]">nearsited</span>
        </a>

        <ul className="hidden items-center gap-8 text-sm text-[var(--text-tertiary)] md:flex">
          <li><a href="#how" className="transition hover:text-[var(--text-primary)]">How it works</a></li>
          <li><a href="#report" className="transition hover:text-[var(--text-primary)]">Sample report</a></li>
          <li><a href="#pitch" className="transition hover:text-[var(--text-primary)]">Sample pitch</a></li>
          
          <li><a href="#faq" className="transition hover:text-[var(--text-primary)]">FAQ</a></li>
        </ul>

        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => window.location.href = "/login"}>Sign in</Button>
          <Button variant="primary" onClick={() => window.location.href = "/signup"}>Start closing deals</Button>
        </div>
      </div>
    </nav>
  );
}

// ── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative mx-auto grid max-w-7xl gap-12 px-6 pt-20 pb-16 md:grid-cols-2 md:px-8 md:pt-24 md:pb-20 lg:px-10">
      <div className="pointer-events-none absolute -left-60 -top-60 h-[500px] w-[500px] rounded-full bg-[var(--accent)]/3 blur-[150px]" />

      {/* Left: Copy */}
      <div className="relative z-10 flex flex-col justify-center space-y-6">
        <div>
          <Badge color="indigo" dot>
            Revenue intelligence for web agencies
          </Badge>
        </div>

        <div className="space-y-5">
          <h1 className="text-[clamp(2.8rem,5.5vw,5.5rem)] font-medium tracking-[-0.04em] leading-[0.92] text-[var(--text-primary)]">
            Close more redesign deals
            <br />
            <em className="italic not-italic">— without guessing.</em>
          </h1>
          <p className="max-w-xl text-lg leading-8 text-[var(--text-secondary)]">
            Nearsited finds local businesses with weak websites, shows you exactly what to pitch,
            and generates personalised outreach — so you spend less time prospecting and more time closing.
          </p>
        </div>

        <div className="flex flex-wrap gap-4">
          <Button
            variant="primary"
            icon={<Search className="h-4 w-4" />}
            onClick={() => window.location.href = "/signup"}
            className="px-6 py-3 text-base"
          >
            Find your first opportunity
          </Button>
          <Button
            variant="secondary"
            icon={<ExternalLink className="h-4 w-4" />}
            onClick={() => document.getElementById("how")?.scrollIntoView({ behavior: "smooth" })}
            className="px-6 py-3 text-base"
          >
            See how agencies win
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-sm text-[var(--text-tertiary)]">
          <span className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[var(--accent)]" />No credit card</span>
          <span className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[var(--accent)]" />Audit 100 businesses free</span>
          <span className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[var(--accent)]" />Cancel anytime</span>
        </div>
      </div>

      {/* Right: Opportunity card with revenue */}
      <div className="relative flex items-center justify-center">
        <div className="relative w-full max-w-[420px]">
          <Card variant="default" padding="lg" className="border-[var(--border-strong)]">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--text-tertiary)]">Discovered opportunity · Dubai</p>
                <h3 className="mt-2 text-lg font-medium text-[var(--text-primary)]">Bright Smile Dental</h3>
                <p className="mt-0.5 text-sm text-[var(--text-secondary)]">Jumeirah · brightsmile.ae</p>
              </div>
              <Badge color="amber">Pitch-ready</Badge>
            </div>

            <div className="mb-5 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5">
              <div className="flex items-center gap-4">
                <ScoreRing score={41} size={64} />
                <div className="flex-1">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--text-tertiary)]">Opportunity Score</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-secondary)]">
                    Poor mobile experience + weak SEO = clear pitch opening.
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-2.5 border-t border-[var(--border)] pt-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                    <DollarSign className="h-3.5 w-3.5 text-[var(--score-good)]" />
                    Est. redesign value
                  </span>
                  <span className="font-medium text-[var(--score-good)]">$1,000–$3,000</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-secondary)]">Critical issues to fix</span>
                  <span className="font-medium text-[var(--score-high)]">5</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-secondary)]">Pitch generated in</span>
                  <span className="font-medium text-[var(--text-primary)]">1.4 seconds</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5">
              <div className="mb-3 flex items-center justify-between text-[10px] uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
                <span className="inline-flex items-center gap-2">
                  <MessageSquare className="h-3 w-3 text-[var(--accent)]" />
                  AI-generated pitch — ready to send
                </span>
              </div>
              <p className="text-sm leading-7 text-[var(--text-secondary)] italic">
                &ldquo;Hi Dr. Sameer — I analysed your site and found 5 critical issues costing you
                patients: slow mobile load, weak local SEO, missing trust signals. A redesign
                could recover an estimated $1,000–$3,000/month in missed revenue.&rdquo;
              </p>
              <div className="mt-4 flex flex-wrap gap-3 border-t border-[var(--border)] pt-4">
                <Button variant="secondary">View full report</Button>
                <Button variant="primary" onClick={() => window.location.href = "/signup"}>Copy pitch →</Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}

// ── Trust Bar ────────────────────────────────────────────────────────────────

function TrustBar() {
  return (
    <div className="border-y border-[var(--border)] bg-[var(--bg-surface)]">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-6 px-6 py-5 text-sm text-[var(--text-tertiary)] md:px-8">
        <span className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[var(--accent)]" />No credit card</span>
        <span className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[var(--accent)]" />Audit 100 businesses free</span>
        <span className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[var(--accent)]" />Cancel anytime</span>
      </div>
    </div>
  );
}

// ── How It Works (Messaging Hierarchy) ──────────────────────────────────────

const HIERARCHY = [
  {
    number: "01",
    title: "Find opportunities",
    desc: "Enter a city + business category. Nearsited surfaces every local business with a weak website — ranked by opportunity score, not alphabetically.",
    icon: Search,
    statKey: "Surface rate",
    statValue: "40–60% of local businesses qualify",
  },
  {
    number: "02",
    title: "Understand weaknesses",
    desc: "Every lead gets a full audit: performance, mobile UX, SEO, design, trust signals. You see exactly what's broken — and what to pitch.",
    icon: Target,
    statKey: "Issues per lead",
    statValue: "4–7 critical issues found",
  },
  {
    number: "03",
    title: "Generate outreach",
    desc: "One click generates a personalised pitch that cites real problems from the audit. Adjust tone, copy, and send. No blank pages.",
    icon: Mail,
    statKey: "Pitch generation",
    statValue: "Under 2 seconds",
  },
  {
    number: "04",
    title: "Win redesign projects",
    desc: "Track every lead through a pipeline: New → Contacted → Proposal → Won. No spreadsheets, no missed follow-ups.",
    icon: TrendingUp,
    statKey: "Pipeline close rate",
    statValue: "Agencies report 2–3× conversion",
  },
];

function HowItWorks() {
  return (
    <section id="how" className="border-t border-[var(--border)] py-24">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <SectionLabel>The workflow</SectionLabel>
          <SectionTitle className="text-center">Four steps to your next signed project.</SectionTitle>
          <SectionSub className="mx-auto text-center">
            From finding the right lead to closing the deal — every step is designed to remove friction and shorten your sales cycle.
          </SectionSub>
        </div>

        <div className="mt-14 space-y-6">
          {HIERARCHY.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.number}>
                <Card variant="default" padding="lg" className="grid gap-6 md:grid-cols-[80px_1fr_240px] items-center">
                  <div className="flex items-start">
                    <span className="text-[3rem] font-medium italic tracking-[-0.04em] text-[var(--text-tertiary)]/40">
                      {step.number}
                    </span>
                  </div>
                  <div>
                    <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-tint)] text-[var(--accent)]">
                      <Icon className="h-4 w-4" />
                    </div>
                    <h3 className="text-xl font-medium text-[var(--text-primary)]">{step.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-[var(--text-secondary)]">{step.desc}</p>
                  </div>
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 text-center">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-[var(--text-tertiary)]">{step.statKey}</p>
                    <p className="mt-1.5 text-sm font-medium text-[var(--accent)]">{step.statValue}</p>
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── Sample Opportunity Report ────────────────────────────────────────────────

function SampleReport() {
  return (
    <section id="report" className="border-t border-[var(--border)] py-24">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="max-w-3xl">
          <SectionLabel>SAMPLE OPPORTUNITY REPORT</SectionLabel>
          <SectionTitle>This is what your next lead looks like.</SectionTitle>
          <SectionSub>
            Every discovered business gets a full audit report. Here&rsquo;s what you see before you pitch.
          </SectionSub>
        </div>

        <Card variant="default" padding="lg" className="mt-10 border-[var(--border-strong)]">
          {/* Report header */}
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border)] pb-6">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-medium text-[var(--text-primary)]">Bright Smile Dental</h3>
                <Badge color="amber">Score: 41/100</Badge>
              </div>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">brightsmile.ae · Jumeirah, Dubai · Dentist</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Estimated redesign value</p>
              <p className="mt-1 text-lg font-bold text-[var(--score-good)]">$1,000–$3,000 / month</p>
            </div>
          </div>

          {/* Score breakdown */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { label: "Performance", score: 42, color: "var(--score-high)" },
              { label: "Mobile UX", score: 39, color: "var(--score-high)" },
              { label: "SEO", score: 48, color: "var(--score-high)" },
              { label: "Design", score: 36, color: "var(--score-high)" },
              { label: "Trust signals", score: 38, color: "var(--score-high)" },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-4 text-center">
                <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--text-tertiary)]">{item.label}</p>
                <p className="mt-1 text-2xl font-bold text-[var(--text-primary)]" style={{ color: item.score < 40 ? "var(--score-high)" : item.score < 55 ? "var(--score-mid)" : "var(--score-good)" }}>
                  {item.score}
                </p>
              </div>
            ))}
          </div>

          {/* Critical issues */}
          <div className="mt-6 rounded-xl border border-[var(--score-high)]/30 bg-[var(--score-high-tint)] p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-4 w-4 text-[var(--score-high)]" />
              <span className="text-sm font-medium text-[var(--score-high)]">5 critical issues found</span>
            </div>
            <ul className="space-y-3 text-sm text-[var(--text-secondary)]">
              {[
                { issue: "Slow mobile load time (LCP: 4.2s)", impact: "High — 53% of mobile visitors bounce", pitch: "Pitch: faster experience = more bookings" },
                { issue: "Missing local SEO schema", impact: "Medium — not appearing in local pack results", pitch: "Pitch: local SEO = free patient acquisition" },
                { issue: "No SSL certificate badge", impact: "High — trust signal missing, 68% of users check", pitch: "Pitch: trust = conversion" },
                { issue: "Outdated design (last updated 2021)", impact: "Medium — feels abandoned to visitors", pitch: "Pitch: modern design = perceived quality" },
                { issue: "No clear CTA above the fold", impact: "High — visitors don't know what to do", pitch: "Pitch: clear CTA = measurable bookings" },
              ].map((item) => (
                <li key={item.issue} className="flex flex-col gap-1 rounded-lg bg-[var(--bg-surface)] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-medium text-[var(--text-primary)]">{item.issue}</span>
                    <span className="shrink-0 text-[11px] text-[var(--score-high)]">{item.impact.split("—")[0].trim()}</span>
                  </div>
                  <span className="text-[var(--accent)] text-xs">{item.pitch}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* CTA */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5">
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">Want to see reports like this for your city?</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">Enter any city + business type. Get ranked leads in under 3 seconds.</p>
            </div>
            <Button variant="primary" onClick={() => window.location.href = "/signup"} className="shrink-0">
              Try it now →
            </Button>
          </div>
        </Card>
      </div>
    </section>
  );
}

// ── Sample Pitch ─────────────────────────────────────────────────────────────

function SamplePitchSection() {
  return (
    <section id="pitch" className="border-t border-[var(--border)] bg-[var(--bg-surface)] py-24">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="grid gap-12 lg:grid-cols-2">
          {/* Left: Explanation */}
          <div>
            <SectionLabel>Sample pitch</SectionLabel>
            <SectionTitle>One click from audit to outreach.</SectionTitle>
            <SectionSub>
              Every pitch is generated from the actual audit data. No generic templates.
              No &ldquo;I noticed your website&hellip;&rdquo; fluff. Real issues, real solutions.
            </SectionSub>

            <div className="mt-8 space-y-4">
              {[
                { icon: Zap, text: "Pulls from 5 audit dimensions — not just PageSpeed" },
                { icon: FileText, text: "Adjustable tone: direct, professional, or friendly" },
                { icon: TrendingUp, text: "Includes estimated revenue impact for leverage" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.text} className="flex items-start gap-3 text-sm text-[var(--text-secondary)]">
                    <Icon className="h-4 w-4 mt-0.5 text-[var(--accent)] shrink-0" />
                    <span>{item.text}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Pitch card */}
          <div>
            <Card variant="default" padding="lg" className="border-[var(--border-strong)]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-[var(--accent)]" />
                  <span className="text-sm font-medium text-[var(--text-primary)]">Generated pitch</span>
                </div>
                <Badge color="green" dot>Ready to send</Badge>
              </div>

              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5">
                <div className="mb-4 flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
                  <span>Tone: Direct · professional</span>
                  <span className="h-3 w-px bg-[var(--border)]" />
                  <span>Generated in 1.4s</span>
                  <span className="h-3 w-px bg-[var(--border)]" />
                  <span>For: Bright Smile Dental</span>
                </div>

                <div className="space-y-3 text-sm leading-7 text-[var(--text-secondary)]">
                  <p>Hi Dr. Sameer,</p>
                  <p>
                    I ran a quick audit of <span className="text-[var(--text-primary)] font-medium">brightsmile.ae</span> and found
                    several issues that are quietly costing you new patients.
                  </p>
                  <ul className="space-y-1.5 list-disc pl-4">
                    <li><span className="text-[var(--score-high)]">4.2s mobile load time</span> — 53% of visitors leave before seeing your content</li>
                    <li><span className="text-[var(--score-high)]">No local SEO</span> — you&rsquo;re not appearing in Google&rsquo;s local pack for &ldquo;dentist Jumeirah&rdquo;</li>
                    <li><span className="text-[var(--score-high)]">No trust signals</span> — missing SSL badge and social proof above the fold</li>
                  </ul>
                  <p>
                    A redesign addressing these issues could recover <span className="text-[var(--score-good)] font-medium">an estimated $1,000–$3,000/month</span> in missed revenue.
                  </p>
                  <p>
                    I&rsquo;d love to walk you through the full audit. When works for a quick call?
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-[var(--border)] pt-4">
                  <div className="flex gap-2">
                    <Button variant="secondary">Edit tone</Button>
                    <Button variant="secondary">Regenerate</Button>
                  </div>
                  <Button variant="primary" onClick={() => window.location.href = "/signup"}>
                    Copy pitch →
                  </Button>
                </div>
              </div>

              <p className="mt-4 text-xs text-[var(--text-tertiary)] text-center">
                Every pitch is unique. No templates, no repetition, no &ldquo;I noticed your website could use some work&rdquo;.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Agency Use Cases ─────────────────────────────────────────────────────────

const USE_CASES = [
  {
    icon: UserIcon,
    title: "Solo freelancers",
    desc: "Stop spending 10 hours/week prospecting. Surface 20–60 qualified leads in 3 seconds, pitch with evidence, and close 2–3 redesigns per month without a sales team.",
    stat: "Avg. 3 new clients/month",
    cta: "Start as a solo",
  },
  {
    icon: Users,
    title: "Small agencies",
    desc: "Replace cold email with warm, evidence-based outreach. Give your sales team a pipeline of scored leads with ready-to-send pitches. Close more, faster.",
    stat: "2–3× faster sales cycle",
    cta: "Start as an agency",
  },
  {
    icon: Briefcase,
    title: "Web studios",
    desc: "Scale your redesign pipeline without scaling your sales team. Bulk-discover opportunities across cities, assign to account managers, track everything.",
    stat: "10× prospecting capacity",
    cta: "Start as a studio",
  },
];

function UserIcon() {
  return <Users className="h-5 w-5" />;
}

function AgencyUseCases() {
  return (
    <section className="border-t border-[var(--border)] py-24">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <SectionLabel>Who it&rsquo;s for</SectionLabel>
          <SectionTitle className="text-center">Agency use cases that close deals.</SectionTitle>
          <SectionSub className="mx-auto text-center">
            Whether you&rsquo;re a solo freelancer or a 20-person studio, the workflow is the same.
            The scale is different.
          </SectionSub>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {USE_CASES.map((uc) => {
            const Icon = uc.icon;
            return (
              <Card key={uc.title} variant="interactive" padding="lg" className="flex flex-col">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-tint)] text-[var(--accent)]">
                  <Icon />
                </div>
                <h3 className="text-lg font-medium text-[var(--text-primary)]">{uc.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-7 text-[var(--text-secondary)]">{uc.desc}</p>
                <div className="mt-6 border-t border-[var(--border)] pt-4">
                  <p className="text-xs text-[var(--accent)] font-medium mb-3">{uc.stat}</p>
                  <Button variant="primary" className="w-full" onClick={() => window.location.href = "/signup"}>
                    {uc.cta} →
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ROI examples removed per request

// ── Objections Section ───────────────────────────────────────────────────────

const OBJECTIONS = [
  {
    objection: "I already have enough clients.",
    response: "Great — then you know the value of a warm pipeline. Nearsited lets you cherry-pick the best opportunities without cold outreach. Keep your pipeline full so you never have a slow month.",
    answer: "How this helps you close more deals: A full pipeline means you can fire underpaying clients and replace them with better projects.",
  },
  {
    objection: "Isn't this just another tool I'll never use?",
    response: "Nearsited takes 3 minutes to get your first lead. No onboarding calls, no setup. Enter a city + category → get ranked leads → pitch in under 2 minutes. If you don't find a pitchable lead in your first search, you won't pay.",
    answer: "How this helps you close more deals: Speed to first lead is under 3 minutes. If it doesn't work, you owe nothing.",
  },
  {
    objection: "I can find leads myself on Google Maps.",
    response: "You can find businesses on Google Maps — but you can't audit 50 websites in 3 seconds, rank them by opportunity, and generate personalised pitches. That's the difference between browsing and closing.",
    answer: "How this helps you close more deals: What takes you 10 hours manually takes 3 minutes. That's 199× faster.",
  },
  {
    objection: "My clients aren't on page 1 of Google anyway.",
    response: "Most local businesses don't need to rank #1 — they need a website that doesn't drive customers away. Nearsited finds businesses whose websites are actively losing them money. That's a much easier pitch than 'I'll get you to #1'.",
    answer: "How this helps you close more deals: You're pitching revenue recovery, not SEO promises. Harder to say no to.",
  },
  {
    objection: "I don't do cold outreach.",
    response: "This isn't cold outreach. Every business on Nearsited has clear, measurable problems with their existing website. You're not guessing — you're responding to evidence they can see themselves. It's warm.",
    answer: "How this helps you close more deals: Evidence-based outreach converts 3–5× better than cold email. You're helping, not selling.",
  },
];

function ObjectionsSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="border-t border-[var(--border)] py-24">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <SectionLabel>Objections</SectionLabel>
          <SectionTitle className="text-center">What&rsquo;s stopping you?</SectionTitle>
          <SectionSub className="mx-auto text-center">
            We hear these objections every week. Here&rsquo;s the honest answer for each one.
          </SectionSub>
        </div>

        <div className="mt-10 mx-auto max-w-3xl space-y-3">
          {OBJECTIONS.map((item, i) => (
            <div
              key={item.objection}
              className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden transition-all duration-200"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
              >
                <span className="text-sm font-medium text-[var(--text-primary)]">{item.objection}</span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-[var(--text-tertiary)] transition-transform duration-200 ${
                    openIndex === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openIndex === i && (
                <div className="border-t border-[var(--border)] px-6 pb-6 pt-4 space-y-3">
                  <p className="text-sm leading-7 text-[var(--text-secondary)]">{item.response}</p>
                  <div className="flex items-start gap-2 rounded-lg bg-[var(--accent-tint)] p-3">
                    <ArrowUpRight className="h-4 w-4 mt-0.5 text-[var(--accent)] shrink-0" />
                    <p className="text-sm text-[var(--text-primary)] font-medium">{item.answer}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <p className="text-sm text-[var(--text-secondary)] mb-4">Still have objections? The best way to answer them is to try it.</p>
          <Button variant="primary" onClick={() => window.location.href = "/signup"} className="px-8 py-3 text-base">
            Try Nearsited free →
          </Button>
        </div>
      </div>
    </section>
  );
}

// ── Proof Blocks ─────────────────────────────────────────────────────────────

function ProofBlocks() {
  return (
    <section className="border-t border-[var(--border)] py-24">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <SectionLabel>Early access</SectionLabel>
          <SectionTitle className="text-center">Built for agencies that actually close deals.</SectionTitle>
          <SectionSub className="mx-auto text-center">
            Nearsited is a new tool. We&rsquo;re working with our first 20 design agencies to refine the workflow before scaling. Join the early cohort — pricing is locked at the launch rate.
          </SectionSub>
          <div className="mt-8">
            <Button variant="primary" onClick={() => window.location.href = "/signup"} className="px-8 py-3 text-base">
              Start free →
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── FAQ ──────────────────────────────────────────────────────────────────────

function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      q: "How does Nearsited help me close more redesign deals?",
      a: "It removes the three biggest bottlenecks in agency sales: finding leads that actually need you, knowing what to pitch, and writing outreach that gets replies. Instead of spending 10 hours prospecting, you spend 10 minutes — and pitch with evidence, not guesses.",
    },
    {
      q: "What kind of businesses does Nearsited find?",
      a: "Local businesses with measurable website problems: slow performance, poor mobile experience, weak SEO, outdated design, missing trust signals. Dentists, restaurants, lawyers, gyms, hotels — 80+ categories across any city. If the website is losing them money, Nearsited finds it.",
    },
    {
      q: "How accurate is the opportunity score?",
      a: "The score combines PageSpeed data, design analysis, SEO signals, and trust indicators into a single 0–100 number. It's not perfect — but it's consistent. Agencies report that leads scoring below 50 convert at 3× the rate of leads above 70. Use it to prioritise, not to disqualify.",
    },
    {
      q: "Do I need technical skills to use it?",
      a: "No. Enter a city and business type. Get ranked leads. Read the audit summary. Click to generate a pitch. If you can type two words and click a button, you can use Nearsited.",
    },
    {
      q: "What if there are no good opportunities in my city?",
      a: "That's extremely unlikely. Most cities have 40–60% of local businesses with below-average websites. But if you run a search and genuinely find nothing pitchable, email us and we'll refund your unused credits. No questions.",
    },
    {
      q: "How is this different from cold email tools?",
      a: "Cold email tools blast generic messages and hope someone replies. Nearsited is the opposite: every pitch is personalised from an actual audit of the business's website. You're not selling — you're showing them a problem they already have. That's why reply rates are 3–5× higher.",
    },
  ];

  return (
    <section id="faq" className="border-t border-[var(--border)] py-24">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center">
            <SectionLabel>FAQ</SectionLabel>
            <SectionTitle className="text-center">Questions about closing deals.</SectionTitle>
            <SectionSub className="mx-auto text-center">
              No fluff. No marketing speak. Just answers that help you decide if this works for your agency.
            </SectionSub>
          </div>

          <div className="mt-10 space-y-2">
            {faqs.map((faq, i) => (
              <div
                key={faq.q}
                className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                >
                  <span className="text-sm font-medium text-[var(--text-primary)]">{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-[var(--text-tertiary)] transition-transform duration-200 ${
                      openIndex === i ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openIndex === i && (
                  <div className="border-t border-[var(--border)] px-6 pb-6 pt-4">
                    <p className="text-sm leading-7 text-[var(--text-secondary)]">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Final CTA ────────────────────────────────────────────────────────────────

function CTA() {
  return (
    <section className="border-t border-[var(--border)] py-24">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="relative overflow-hidden rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-surface)] px-8 py-16 text-center md:px-16">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[var(--accent)]/5 blur-[100px]" />

          <div className="relative z-10">
            <Badge color="indigo" dot>Start closing redesign deals today</Badge>
            <h2 className="mt-6 text-[clamp(2rem,4vw,3.5rem)] font-medium tracking-[-0.03em] leading-[1.1] text-[var(--text-primary)]">
              Your next signed project is out there.
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base leading-7 text-[var(--text-secondary)]">
              Enter a city and business type. Get ranked leads with audits, estimated revenue impact, 
              and a ready-to-send pitch — all in under 3 minutes.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Button variant="primary" icon={<Search className="h-4 w-4" />} onClick={() => window.location.href = "/signup"} className="px-8 py-3 text-base">
                Find your first opportunity
              </Button>
              <Button variant="secondary" onClick={() => window.location.href = "/login"} className="px-8 py-3 text-base">
                Sign in
              </Button>
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-6 text-sm text-[var(--text-tertiary)]">
              <span className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[var(--accent)]" />No credit card</span>
              <span className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[var(--accent)]" />Audit 100 businesses free</span>
              <span className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[var(--accent)]" />Cancel anytime</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--bg-surface)] px-6 py-12 md:px-8">
      <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[2fr_1fr_1fr_1fr]">
        <div>
          <div className="mb-4 inline-flex items-center gap-2.5 text-base font-medium text-[var(--text-primary)]" style={{ fontFamily: 'Switzer, Geist, sans-serif' }}>
            <img src="/logo-icon.svg" alt="" width={28} height={16} className="block shrink-0" />
            <span className="text-base font-medium tracking-[0.02em] text-[var(--text-primary)]">nearsited</span>
          </div>
          <p className="max-w-sm text-sm leading-7 text-[var(--text-tertiary)]">
            Revenue intelligence for web agencies. Find, pitch, and win redesign projects.
          </p>
        </div>
        <div>
          <div className="mb-4 text-[0.7rem] uppercase tracking-[0.12em] text-[var(--text-tertiary)]">Product</div>
          <ul className="space-y-3 text-sm text-[var(--text-tertiary)]">
            <li><a href="#how" className="transition hover:text-[var(--text-primary)]">How it works</a></li>
            <li><a href="#report" className="transition hover:text-[var(--text-primary)]">Sample report</a></li>
            <li><a href="#pitch" className="transition hover:text-[var(--text-primary)]">Sample pitch</a></li>
            
          </ul>
        </div>
        <div>
          <div className="mb-4 text-[0.7rem] uppercase tracking-[0.12em] text-[var(--text-tertiary)]">Company</div>
          <ul className="space-y-3 text-sm text-[var(--text-tertiary)]">
            <li><a href="#" className="transition hover:text-[var(--text-primary)]">Blog</a></li>
            <li><a href="#" className="transition hover:text-[var(--text-primary)]">Contact</a></li>
          </ul>
        </div>
        <div>
          <div className="mb-4 text-[0.7rem] uppercase tracking-[0.12em] text-[var(--text-tertiary)]">Legal</div>
          <ul className="space-y-3 text-sm text-[var(--text-tertiary)]">
            <li><a href="#" className="transition hover:text-[var(--text-primary)]">Terms</a></li>
            <li><a href="#" className="transition hover:text-[var(--text-primary)]">Privacy</a></li>
          </ul>
        </div>
      </div>
      <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-[var(--border)] pt-6 text-sm text-[var(--text-tertiary)] md:flex-row">
        <span>© 2026 Nearsited. All rights reserved.</span>
        <span className="text-[var(--text-secondary)]">Built by Again Labs · <a href="https://againlive.com" className="transition hover:text-[var(--text-primary)]" target="_blank" rel="noopener noreferrer">Again Live</a> family of products</span>
      </div>
    </footer>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <div className="relative min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
      <Nav />
      <main className="pt-20">
        <Hero />
        <TrustBar />
        <HowItWorks />
        <SampleReport />
        <SamplePitchSection />
        <AgencyUseCases />
        {/* ROI examples removed */}
        <ObjectionsSection />
        <ProofBlocks />
        <FAQ />
        <CTA />
        <Footer />
      </main>
    </div>
  );
}
