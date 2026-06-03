"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
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
import Pricing from "@/components/landing/Pricing";
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

function Nav({ navigate }: { navigate: (href: string) => void }) {
  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-[var(--border)] bg-[var(--bg-base)]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-8">
        <a href="#" className="inline-flex items-center gap-2.5 text-base font-medium text-[var(--text-primary)]" style={{ fontFamily: 'Switzer, Geist, sans-serif' }}>
          <Image src="/logo-icon.svg" alt="" width={36} height={21} className="block shrink-0" />
          <span className="text-[22px] font-medium tracking-[0.02em] text-[var(--text-primary)]">NearSited</span>
        </a>

        <ul className="hidden items-center gap-8 text-sm text-[var(--text-tertiary)] md:flex">
          <li><a href="#how" className="transition hover:text-[var(--text-primary)]">How it works</a></li>
          <li><a href="#report" className="transition hover:text-[var(--text-primary)]">Sample report</a></li>
          <li><a href="#pitch" className="transition hover:text-[var(--text-primary)]">Sample pitch</a></li>
          <li><a href="/pricing" className="transition hover:text-[var(--text-primary)]">Pricing</a></li>
          <li><a href="#faq" className="transition hover:text-[var(--text-primary)]">FAQ</a></li>
        </ul>

        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate("/login")}>Sign in</Button>
          <Button variant="primary" onClick={() => navigate("/signup")}>Get started free</Button>
        </div>
      </div>
    </nav>
  );
}

// ── Hero ─────────────────────────────────────────────────────────────────────

function Hero({ navigate }: { navigate: (href: string) => void }) {
  return (
    <section className="relative mx-auto grid max-w-7xl gap-12 px-6 pt-20 pb-16 md:grid-cols-2 md:px-8 md:pt-24 md:pb-20 lg:px-10">
      <div className="pointer-events-none absolute -left-60 -top-60 h-[500px] w-[500px] rounded-full bg-[var(--accent)]/3 blur-[150px]" />

      {/* Left: Copy */}
      <div className="relative z-10 flex flex-col justify-center space-y-6">
        <div>
          <Badge color="indigo" dot>
            Find businesses that need websites
          </Badge>
        </div>

        <div className="space-y-5">
          <h1 className="text-[clamp(2.8rem,5.5vw,5.5rem)] font-medium tracking-[-0.04em] leading-[0.92] text-[var(--text-primary)]">
            Find website opportunities
            <br />
            <em className="italic not-italic">before competitors do.</em>
          </h1>
          <p className="max-w-xl text-lg leading-8 text-[var(--text-secondary)]">
            Nearsited finds local businesses with <strong className="text-[var(--text-primary)] font-medium">no website</strong>, social-only presence, platform-only listings, or weak websites — ranks them by opportunity score, and generates a tailored pitch for each type in under 2 minutes.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
          <Button
            variant="primary"
            icon={<Search className="h-4 w-4" />}
            onClick={() => navigate("/signup")}
            className="w-full px-6 py-3 text-base sm:w-auto"
          >
            Find your first opportunity
          </Button>
          <Button
            variant="secondary"
            icon={<ExternalLink className="h-4 w-4" />}
            onClick={() => document.getElementById("how")?.scrollIntoView({ behavior: "smooth" })}
            className="w-full px-6 py-3 text-base sm:w-auto"
          >
            See how agencies win
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-sm text-[var(--text-tertiary)]">
          <span className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[var(--accent)]" />No credit card</span>
          <span className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[var(--accent)]" />Audit 50 businesses free</span>
          <span className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[var(--accent)]" />Cancel anytime</span>
        </div>
      </div>

      {/* Right: Mixed opportunity feed */}
      <div className="relative flex items-center justify-center">
        <div className="relative w-full max-w-[440px]">
          <Card variant="default" padding="lg" className="border-[var(--border-strong)]">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--text-tertiary)]">Discovered opportunities · Dubai</p>
              <Badge color="green" dot>Live scan</Badge>
            </div>

            {/* Opportunity rows */}
            <div className="space-y-2.5">
              {/* No Website */}
              <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--score-high)]/10">
                  <span className="text-xs font-bold text-[var(--score-high)]">—</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--text-primary)]">Marina Legal Consultants</p>
                  <p className="text-xs text-[var(--text-tertiary)]">Dubai Marina · Legal</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="inline-flex items-center gap-1 rounded-full border border-[var(--score-high)]/30 bg-[var(--score-high)]/10 px-2 py-0.5 text-[10px] font-semibold text-[var(--score-high)]">
                    No Website
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-[var(--score-good)]">
                    <DollarSign className="h-2.5 w-2.5" />$2,000–$6,000
                  </span>
                </div>
              </div>

              {/* Social Only */}
              <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                  <span className="text-xs font-bold text-amber-500">—</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--text-primary)]">Blue Wave Restaurant</p>
                  <p className="text-xs text-[var(--text-tertiary)]">JBR · Food & Beverage</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
                    Social Only
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-[var(--score-good)]">
                    <DollarSign className="h-2.5 w-2.5" />$1,500–$4,000
                  </span>
                </div>
              </div>

              {/* Weak Website */}
              <div className="flex items-center gap-3 rounded-xl border border-[var(--accent)]/20 bg-[var(--accent-tint)] px-4 py-3">
                <ScoreRing score={87} size={32} variant="opportunity" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--text-primary)]">Bright Smile Dental</p>
                  <p className="text-xs text-[var(--text-tertiary)]">Jumeirah · Healthcare</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="inline-flex items-center gap-1 rounded-full border border-[var(--score-mid)]/30 bg-[var(--score-mid)]/10 px-2 py-0.5 text-[10px] font-semibold text-[var(--score-mid)]">
                    Weak Website
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-[var(--score-good)]">
                    <DollarSign className="h-2.5 w-2.5" />$1,000–$3,000
                  </span>
                </div>
              </div>
            </div>

            {/* Pitch preview */}
            <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
              <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
                <MessageSquare className="h-3 w-3 text-[var(--accent)]" />
                AI pitch — ready to send
              </div>
              <p className="text-sm leading-7 text-[var(--text-secondary)] italic">
                &ldquo;Hi — I noticed Marina Legal has great reviews but no website. You&rsquo;re invisible to clients searching Google. I build legal websites that turn your reputation into new enquiries.&rdquo;
              </p>
              <div className="mt-3 flex flex-wrap gap-2 border-t border-[var(--border)] pt-3">
                <Button variant="secondary" className="flex-1 text-xs">View report</Button>
                <Button variant="primary" onClick={() => navigate("/signup")} className="flex-1 text-xs">Copy pitch →</Button>
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
        <span className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[var(--accent)]" />Audit 50 businesses free</span>
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
    desc: "Enter a city + business category. Nearsited surfaces businesses with no website, social-only presence, or weak websites — ranked by opportunity score, not alphabetically.",
    icon: Search,
    statKey: "Surface rate",
    statValue: "40–60% of local businesses qualify",
  },
  {
    number: "02",
    title: "Understand the gap",
    desc: "Every lead gets a full assessment: website presence, performance, mobile UX, SEO, design, trust signals. You see exactly what's missing — and what to pitch.",
    icon: Target,
    statKey: "Issues per lead",
    statValue: "4–7 critical issues found",
  },
  {
    number: "03",
    title: "Generate outreach",
    desc: "One click generates a personalised pitch tailored to the opportunity type — website build, redesign, or improvement. Adjust tone, copy, and send.",
    icon: Mail,
    statKey: "Pitch generation",
    statValue: "Under 2 seconds",
  },
  {
    number: "04",
    title: "Win more website projects",
    desc: "Track every lead through a pipeline: New → Contacted → Proposal → Won. Whether it's a new build or a redesign, close it without spreadsheets.",
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
          <SectionTitle className="text-center">Four steps to your next website project.</SectionTitle>
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

// ── Why Nearsited ────────────────────────────────────────────────────────────

const TRADITIONAL_CONS = [
  "No way to find businesses that have no website at all",
  "Cannot discover social-only or platform-only businesses",
  "Manual website checking — one business at a time",
  "No prioritisation — you guess who to contact first",
  "Generic cold outreach with no supporting evidence",
  "No built-in pipeline — spreadsheets or external CRM required",
  "Hours of research before a single pitch is sent",
];

const NEARSITED_PROS = [
  "Finds businesses with no website, social-only, and platform-only presence",
  "Surfaces weak websites ranked by opportunity score — not quality score",
  "Opportunity score weighs both site weakness AND business viability",
  "Pitch angle changes completely per lead type — not one generic template",
  "Generates evidence-based pitches citing real audit data",
  "Built-in pipeline — track every lead from discovery to closed deal",
  "From search to pitch-ready lead in under 2 minutes",
];

function WhyNearsited() {
  return (
    <section className="border-t border-[var(--border)] bg-[var(--bg-surface)] py-24">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <SectionLabel>Why Nearsited</SectionLabel>
          <SectionTitle className="text-center">Other tools find bad websites. Nearsited finds every opportunity.</SectionTitle>
          <SectionSub className="mx-auto text-center">
            Most tools show you which sites score low. Nearsited goes further — it finds the businesses with <em>no website at all</em>, ranks by who&rsquo;s worth approaching (not just who has problems), and writes a different pitch for every lead type.
          </SectionSub>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {/* Traditional */}
          <Card variant="default" padding="lg" className="border-[var(--score-high)]/20">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--score-high)]/10">
                <AlertTriangle className="h-4 w-4 text-[var(--score-high)]" />
              </div>
              <h3 className="text-base font-medium text-[var(--text-primary)]">Traditional prospecting</h3>
            </div>
            <ul className="space-y-3">
              {TRADITIONAL_CONS.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-[var(--text-secondary)]">
                  <span className="mt-0.5 shrink-0 text-[var(--score-high)] font-bold">✕</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Card>

          {/* Nearsited */}
          <Card variant="default" padding="lg" className="border-[var(--accent)]/30">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-tint)]">
                <Zap className="h-4 w-4 text-[var(--accent)]" />
              </div>
              <h3 className="text-base font-medium text-[var(--text-primary)]">Nearsited</h3>
            </div>
            <ul className="space-y-3">
              {NEARSITED_PROS.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-[var(--text-secondary)]">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Lead type badges */}
        <div className="mt-10 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6">
          <p className="mb-4 text-center text-[0.7rem] uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
            Four types of website opportunity — all found in one search
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <div className="flex items-center gap-2.5 rounded-xl border border-[var(--score-high)]/30 bg-[var(--score-high)]/8 px-4 py-2.5">
              <span className="h-2 w-2 rounded-full bg-[var(--score-high)]" />
              <span className="text-sm font-medium text-[var(--score-high)]">No Website</span>
              <span className="text-xs text-[var(--text-tertiary)]">— biggest opportunity</span>
            </div>
            <div className="flex items-center gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/8 px-4 py-2.5">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span className="text-sm font-medium text-amber-400">Social Only</span>
              <span className="text-xs text-[var(--text-tertiary)]">— renting on social platforms</span>
            </div>
            <div className="flex items-center gap-2.5 rounded-xl border border-[var(--badge-indigo-border)] bg-[var(--badge-indigo-bg)] px-4 py-2.5">
              <span className="h-2 w-2 rounded-full bg-[var(--badge-indigo-text)]" />
              <span className="text-sm font-medium text-[var(--badge-indigo-text)]">Platform Only</span>
              <span className="text-xs text-[var(--text-tertiary)]">— dependent on third-party</span>
            </div>
            <div className="flex items-center gap-2.5 rounded-xl border border-[var(--score-mid)]/30 bg-[var(--score-mid)]/8 px-4 py-2.5">
              <span className="h-2 w-2 rounded-full bg-[var(--score-mid)]" />
              <span className="text-sm font-medium text-[var(--score-mid)]">Weak Website</span>
              <span className="text-xs text-[var(--text-tertiary)]">— redesign opportunity</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Sample Opportunity Report ────────────────────────────────────────────────

type ReportTab = "weak" | "none" | "social";

function SampleReport({ navigate }: { navigate: (href: string) => void }) {
  const [activeTab, setActiveTab] = useState<ReportTab>("weak");

  const tabs: { id: ReportTab; label: string; badge: string; badgeColor: string }[] = [
    { id: "weak",   label: "Weak Website",  badge: "Redesign",        badgeColor: "amber" },
    { id: "none",   label: "No Website",    badge: "Website Build",   badgeColor: "red" },
    { id: "social", label: "Social Only",   badge: "Website Opportunity", badgeColor: "indigo" },
  ];

  return (
    <section id="report" className="border-t border-[var(--border)] py-24">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="max-w-3xl">
          <SectionLabel>SAMPLE OPPORTUNITY REPORT</SectionLabel>
          <SectionTitle>Every opportunity type, one platform.</SectionTitle>
          <SectionSub>
            Nearsited discovers all three kinds of website opportunity. Here&rsquo;s what each report looks like.
          </SectionSub>
        </div>

        {/* Tab strip */}
        <div className="mt-8 flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
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

          {/* ── Weak Website ───────────────────────────────────────── */}
          {activeTab === "weak" && (
            <>
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border)] pb-6">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-medium text-[var(--text-primary)]">Bright Smile Dental</h3>
                    <Badge color="green">Opportunity: 87/100</Badge>
                  </div>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">brightsmile.ae · Jumeirah, Dubai · Dentist</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Est. project value</p>
                  <p className="mt-1 text-lg font-bold text-[var(--score-good)]">$1,000–$3,000 / month</p>
                </div>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {[
                  { label: "Performance", score: 42 },
                  { label: "Mobile UX",   score: 39 },
                  { label: "SEO",         score: 48 },
                  { label: "Design",      score: 36 },
                  { label: "Trust",       score: 38 },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-4 text-center">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--text-tertiary)]">{item.label}</p>
                    <p className="mt-1 text-2xl font-bold" style={{ color: item.score < 40 ? "var(--score-high)" : item.score < 55 ? "var(--score-mid)" : "var(--score-good)" }}>
                      {item.score}
                    </p>
                  </div>
                ))}
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
            </>
          )}

          {/* ── No Website ─────────────────────────────────────────── */}
          {activeTab === "none" && (
            <>
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border)] pb-6">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-medium text-[var(--text-primary)]">Marina Legal Consultants</h3>
                    <Badge color="red">No Website</Badge>
                  </div>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">Google Business only · Dubai Marina · Legal Services</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Est. project value</p>
                  <p className="mt-1 text-lg font-bold text-[var(--score-good)]">$2,000–$6,000</p>
                </div>
              </div>

              <div className="mt-6 rounded-xl border border-[var(--score-high)]/30 bg-[var(--score-high-tint)] p-5">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-4 w-4 text-[var(--score-high)]" />
                  <span className="text-sm font-medium text-[var(--score-high)]">No web presence detected</span>
                </div>
                <p className="text-sm leading-7 text-[var(--text-secondary)]">
                  This business has no website. All online visibility relies on a single Google Business listing — no portfolio, no testimonials, no contact form, no SEO footprint. Every competitor with a website has a structural advantage.
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
                  &ldquo;Hi — I noticed Marina Legal Consultants has great reviews but no website. Every day without one, you&rsquo;re invisible to clients searching Google. I build professional legal websites that turn your 4.7★ reputation into new enquiries.&rdquo;
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
                    <Badge color="indigo">Social Only</Badge>
                  </div>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">instagram.com/bluewaverest · JBR, Dubai · Restaurant</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Est. project value</p>
                  <p className="mt-1 text-lg font-bold text-[var(--score-good)]">$1,500–$4,000</p>
                </div>
              </div>

              <div className="mt-6 rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-medium text-amber-400">Entire online presence is rented</span>
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
                  &ldquo;Hi — Blue Wave&rsquo;s Instagram looks great. But Instagram isn&rsquo;t a website — you don&rsquo;t own it, you can&rsquo;t rank on Google, and bookings via DM cost you time every day. A real website takes your 4,200 followers and turns them into reservations you control.&rdquo;
                </p>
              </div>
            </>
          )}

          {/* CTA — shared */}
          <div className="mt-6 flex flex-col gap-4 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">Want to find opportunities like this in your city?</p>
              <p className="mt-1 text-xs text-[var(--text-tertiary)]">Enter any city + business type. Get ranked leads in under 3 seconds.</p>
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

// ── Sample Pitch ─────────────────────────────────────────────────────────────

type PitchTab = "weak" | "none" | "social";

const PITCH_EXAMPLES: Record<PitchTab, {
  label: string;
  badgeColor: "amber" | "red" | "indigo";
  meta: string;
  body: React.ReactNode;
}> = {
  weak: {
    label: "Weak Website",
    badgeColor: "amber",
    meta: "Tone: Professional · For: Bright Smile Dental · 1.4s",
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
    meta: "Tone: Professional · For: Marina Legal Consultants · 1.2s",
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
    meta: "Tone: Friendly · For: Blue Wave Restaurant · 1.1s",
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
};

function SamplePitchSection({ navigate }: { navigate: (href: string) => void }) {
  const [activeTab, setActiveTab] = useState<PitchTab>("weak");
  const example = PITCH_EXAMPLES[activeTab];

  return (
    <section id="pitch" className="border-t border-[var(--border)] bg-[var(--bg-surface)] py-24">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="grid gap-12 lg:grid-cols-2">
          {/* Left */}
          <div>
            <SectionLabel>Sample pitches</SectionLabel>
            <SectionTitle>Every opportunity type gets a tailored pitch.</SectionTitle>
            <SectionSub>
              Pitches are generated from real opportunity data — not templates. The angle changes completely depending on whether the business has no website, social-only, or a weak one.
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
              {(["weak", "none", "social"] as PitchTab[]).map((id) => {
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
                <p className="mb-4 text-xs text-[var(--text-tertiary)]">{example.meta}</p>
                {example.body}

                <div className="mt-5 flex flex-col gap-3 border-t border-[var(--border)] pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" className="flex-1 sm:flex-none">Edit tone</Button>
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

// ── Agency Use Cases ─────────────────────────────────────────────────────────

const USE_CASES = [
  {
    icon: UserIcon,
    title: "Solo freelancers",
    desc: "Stop spending 10 hours/week prospecting. Surface 20–60 qualified leads in 3 seconds — no-website businesses, social-only, and weak websites — pitch with evidence, and close 2–3 new projects per month.",
    stat: "Avg. 3 new clients/month",
    cta: "Start as a solo",
  },
  {
    icon: Users,
    title: "Small agencies",
    desc: "Replace cold email with warm, evidence-based outreach. Give your team a pipeline of scored opportunities — new builds and redesigns — with ready-to-send pitches. Close more, faster.",
    stat: "2–3× faster sales cycle",
    cta: "Start as an agency",
  },
  {
    icon: Briefcase,
    title: "Web studios",
    desc: "Scale your project pipeline without scaling your sales team. Bulk-discover all opportunity types across cities, assign to account managers, and track every deal from discovery to close.",
    stat: "10× prospecting capacity",
    cta: "Start as a studio",
  },
];

function UserIcon() {
  return <Users className="h-5 w-5" />;
}

function AgencyUseCases({ navigate }: { navigate: (href: string) => void }) {
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
                  <Button variant="primary" className="w-full" onClick={() => navigate("/signup")}>
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

// ── Founder Story ────────────────────────────────────────────────────────────

function FounderStory() {
  return (
    <section className="border-t border-[var(--border)] bg-[var(--bg-surface)] py-24">
      <div className="mx-auto max-w-3xl px-6 md:px-8">
        <div className="text-center">
          <SectionLabel>The story</SectionLabel>
        </div>
        <div className="mt-8 space-y-5 text-base leading-8 text-[var(--text-secondary)]">
          <p>
            I run a web design agency. Finding clients who actually need a new website was always the hardest part.
          </p>
          <p>
            I&rsquo;d spend hours browsing Google Maps, opening every business website, trying to figure out which ones were outdated. Most were fine. Some were terrible. A few had no website at all. But finding them was manual, slow, and I was always guessing.
          </p>
          <p>
            So I built a tool that does it for me. Enter a city and business type. It finds the businesses with no website, social-only presence, or weak websites — ranks them by opportunity, audits the site, and writes the pitch.
          </p>
          <p>
            It worked for my agency. So I turned it into a product.
          </p>
        </div>
        <div className="mt-8 text-center">
          <p className="text-sm text-[var(--text-tertiary)]">
            Built by <a href="https://againlive.com" className="text-[var(--accent)] hover:underline" target="_blank" rel="noopener noreferrer">Again Labs</a>.
          </p>
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
    response: "Google Maps shows you businesses that have websites. It can't show you businesses with no website, social-only presence, or platform-only listings — those are often your highest-value leads. And even for businesses with websites, you can't audit 50 in 3 seconds, rank them by opportunity, and generate personalised pitches.",
    answer: "How this helps you close more deals: You find opportunities Google Maps literally cannot show you. That's a different market.",
  },
  {
    objection: "My clients aren't on page 1 of Google anyway.",
    response: "Some of your best prospects aren't on Google at all — they have no website, or they're running everything from an Instagram page. Nearsited finds those businesses too. For the ones that do have a website, you're pitching revenue recovery from real, measurable problems — not vague SEO promises.",
    answer: "How this helps you close more deals: You're pitching a clear gap they already have. Much easier to say yes to than ranking promises.",
  },
  {
    objection: "I don't do cold outreach.",
    response: "This isn't cold outreach. Every opportunity on Nearsited has a clear, measurable gap — whether that's a broken website or no website at all. You're not guessing — you're responding to evidence they can see themselves. It's warm.",
    answer: "How this helps you close more deals: Evidence-based outreach converts 3–5× better than cold email. You're helping, not selling.",
  },
];

function ObjectionsSection({ navigate }: { navigate: (href: string) => void }) {
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
          <Button variant="primary" onClick={() => navigate("/signup")} className="px-8 py-3 text-base">
            Try Nearsited free →
          </Button>
        </div>
      </div>
    </section>
  );
}

// ── Proof Blocks ─────────────────────────────────────────────────────────────

function ProofBlocks({ navigate }: { navigate: (href: string) => void }) {
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
            <Button variant="primary" onClick={() => navigate("/signup")} className="px-8 py-3 text-base">
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
      q: "How does Nearsited help me win more website projects?",
      a: "It removes the three biggest bottlenecks in agency sales: finding the right leads, knowing what to pitch, and writing outreach that gets replies. Nearsited finds businesses with no website, social-only presence, and weak websites — then gives you evidence-based pitches for each. Instead of 10 hours prospecting, you spend 10 minutes.",
    },
    {
      q: "What kind of businesses does Nearsited find?",
      a: "Three types: businesses with no website at all (often the highest-value leads), social-only businesses running entirely off Instagram or Facebook, and businesses with weak websites scoring below 60 on performance, mobile, SEO, design, or trust. Dentists, restaurants, lawyers, gyms, hotels — 80+ categories across any city.",
    },
    {
      q: "How accurate is the opportunity score?",
      a: "The opportunity score combines website weakness and business viability into a single 0–100 number — higher means a hotter lead. A business with a broken website and active Google reviews scores high because it's both pitchable and likely to respond. Agencies report that leads with an opportunity score above 70 convert at 3× the rate of those below 30. Use it to prioritise, not to disqualify.",
    },
    {
      q: "Do I need technical skills to use it?",
      a: "No. Enter a city and business type. Get ranked leads. Read the audit summary. Click to generate a pitch. If you can type two words and click a button, you can use Nearsited.",
    },
    {
      q: "What if there are no good opportunities in my city?",
      a: "That's extremely unlikely. Most cities have 40–60% of local businesses with below-average websites — and many more with no website at all. But if you run a search and genuinely find nothing pitchable, email us and we'll refund your unused credits. No questions.",
    },
    {
      q: "How is this different from cold email tools?",
      a: "Cold email tools blast generic messages and hope someone replies. Nearsited is the opposite: every pitch is personalised around a real online presence gap — no website, social-only, or a broken site. You're not selling — you're showing them a problem they already have. That's why reply rates are 3–5× higher.",
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

function CTA({ navigate }: { navigate: (href: string) => void }) {
  return (
    <section className="border-t border-[var(--border)] py-24">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="relative overflow-hidden rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-surface)] px-8 py-16 text-center md:px-16">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[var(--accent)]/5 blur-[100px]" />

          <div className="relative z-10">
            <Badge color="indigo" dot>Start finding website opportunities today</Badge>
            <h2 className="mt-6 text-[clamp(2rem,4vw,3.5rem)] font-medium tracking-[-0.03em] leading-[1.1] text-[var(--text-primary)]">
              Your next client is out there — without a website.
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base leading-7 text-[var(--text-secondary)]">
              Enter a city and business type. Find businesses with no website, social-only presence, or weak websites — with a ready-to-send pitch for each one. All in under 3 minutes.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
              <Button variant="primary" icon={<Search className="h-4 w-4" />} onClick={() => navigate("/signup")} className="w-full px-8 py-3 text-base sm:w-auto">
                Find your first opportunity
              </Button>
              <Button variant="secondary" onClick={() => navigate("/login")} className="w-full px-8 py-3 text-base sm:w-auto">
                Sign in
              </Button>
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-6 text-sm text-[var(--text-tertiary)]">
              <span className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[var(--accent)]" />No credit card</span>
              <span className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[var(--accent)]" />Audit 50 businesses free</span>
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
            <Image src="/logo-icon.svg" alt="" width={28} height={16} className="block shrink-0" />
            <span className="text-base font-medium tracking-[0.02em] text-[var(--text-primary)]">NearSited</span>
          </div>
          <p className="max-w-sm text-sm leading-7 text-[var(--text-tertiary)]">
            Find businesses that need websites, redesigns, or a stronger online presence.
          </p>
        </div>
        <div>
          <div className="mb-4 text-[0.7rem] uppercase tracking-[0.12em] text-[var(--text-tertiary)]">Product</div>
          <ul className="space-y-3 text-sm text-[var(--text-tertiary)]">
            <li><a href="#how" className="transition hover:text-[var(--text-primary)]">How it works</a></li>
            <li><a href="#report" className="transition hover:text-[var(--text-primary)]">Sample report</a></li>
            <li><a href="#pitch" className="transition hover:text-[var(--text-primary)]">Sample pitch</a></li>
            <li><a href="/pricing" className="transition hover:text-[var(--text-primary)]">Pricing</a></li>
          </ul>
        </div>
        <div>
          <div className="mb-4 text-[0.7rem] uppercase tracking-[0.12em] text-[var(--text-tertiary)]">Company</div>
          <ul className="space-y-3 text-sm text-[var(--text-tertiary)]">
            <li><a href="mailto:nearsitedlabs@gmail.com" className="transition hover:text-[var(--text-primary)]">Contact</a></li>
          </ul>
        </div>
        <div>
          <div className="mb-4 text-[0.7rem] uppercase tracking-[0.12em] text-[var(--text-tertiary)]">Legal</div>
          <ul className="space-y-3 text-sm text-[var(--text-tertiary)]">
            <li><a href="/terms" className="transition hover:text-[var(--text-primary)]">Terms</a></li>
            <li><a href="/privacy" className="transition hover:text-[var(--text-primary)]">Privacy</a></li>
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
  const router = useRouter();
  const navigate = router.push.bind(router);

  return (
    <div className="relative min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
      <Nav navigate={navigate} />
      <main className="pt-20">
        <Hero navigate={navigate} />
        <TrustBar />
        <HowItWorks />
        <WhyNearsited />
        <SampleReport navigate={navigate} />
        <SamplePitchSection navigate={navigate} />
        <AgencyUseCases navigate={navigate} />
        <FounderStory />
        {/* ROI examples removed */}
        <ObjectionsSection navigate={navigate} />
        <ProofBlocks navigate={navigate} />
        <FAQ />
        <Pricing navigate={navigate} />
        <CTA navigate={navigate} />
        <Footer />
      </main>
    </div>
  );
}
