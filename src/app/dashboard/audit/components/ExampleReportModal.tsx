"use client";

import { useEffect, useRef } from "react";
import { ArrowRight, X } from "lucide-react";
import type { ExampleTab } from "./types";

// ── Constants ───────────────────────────────────────────────────────────────────

const EXAMPLE_TABS: { key: ExampleTab; label: string }[] = [
  { key: "weak_website",  label: "Weak Website" },
  { key: "no_website",    label: "No Website" },
  { key: "social_only",   label: "Social Only" },
  { key: "platform_only", label: "Platform Only" },
];

type ExampleInfo = {
  businessLabel: string;
  currentScore?: number;
  potentialScore?: number;
  opportunityText: string;
  findings: string[];
};

const EXAMPLE_DATA: Record<ExampleTab, ExampleInfo> = {
  weak_website: {
    businessLabel: "lawfirmdubai.com",
    currentScore: 42,
    potentialScore: 81,
    opportunityText: "+39 Opportunity",
    findings: [
      "Mobile experience creates friction",
      "Weak trust signals",
      "Missing conversion pathways",
    ],
  },
  no_website: {
    businessLabel: "Marina Legal Consultants",
    opportunityText: "High Opportunity",
    findings: [
      "No website detected",
      "Limited online visibility",
      "Missed lead generation opportunities",
    ],
  },
  social_only: {
    businessLabel: "Blue Wave Restaurant",
    opportunityText: "High Opportunity",
    findings: [
      "Active social presence",
      "No dedicated website",
      "Limited search visibility",
    ],
  },
  platform_only: {
    businessLabel: "Serene Spa & Wellness",
    opportunityText: "High Opportunity",
    findings: [
      "Listed on Fresha / Booksy only",
      "No owned web presence",
      "Dependent on third-party platform",
    ],
  },
};

// ── Component ───────────────────────────────────────────────────────────────────

export function ExampleReportModal({
  type,
  onClose,
}: {
  type: ExampleTab;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });

  useEffect(() => {
    const trigger = document.activeElement as HTMLElement | null;
    const container = dialogRef.current;
    if (container) {
      const focusable = container.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      focusable[0]?.focus();
      const trap = (e: KeyboardEvent) => {
        if (e.key === "Escape") { onCloseRef.current(); return; }
        if (e.key !== "Tab") return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first?.focus();
        }
      };
      document.addEventListener("keydown", trap);
      return () => { document.removeEventListener("keydown", trap); trigger?.focus(); };
    }
  }, []);

  const data = EXAMPLE_DATA[type];
  const isWebsite = type === "weak_website";
  const badgeColor =
    type === "weak_website"
      ? "bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/30"
      : type === "no_website"
        ? "bg-[var(--color-danger)]/10 text-[var(--color-danger)] border-[var(--color-danger)]/30"
        : "bg-[var(--color-warning)]/10 text-[var(--color-warning)] border-[var(--color-warning)]/30";
  const badgeLabel = EXAMPLE_TABS.find((t) => t.key === type)?.label ?? "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[var(--color-bg-page)]/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="example-modal-title"
        className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] shadow-[var(--brand-shadow-lg)]"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-6 py-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] font-medium text-[var(--color-text-tertiary)]">
              Preview
            </p>
            <h2 id="example-modal-title" className="mt-0.5 text-base font-medium text-[var(--color-text-primary)]">
              Example Report &mdash; {badgeLabel}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close preview"
            className="cursor-pointer rounded-[var(--radius-sm)] p-1.5 text-[var(--color-text-tertiary)] transition-colors hover:bg-[var(--color-bg-surface)] hover:text-[var(--color-text-primary)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-6 p-6">
          {/* Type badge */}
          <div>
            <span
              className={`inline-flex items-center rounded-[var(--radius-sm)] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide border ${badgeColor}`}
            >
              {badgeLabel}
            </span>
          </div>

          {/* Opportunity Score */}
          {isWebsite ? (
            <div>
              <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
                Opportunity Score
              </p>
              <div className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-[var(--score-high)]">
                    {data.currentScore}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">Current</p>
                </div>
                <ArrowRight className="mx-2 h-4 w-4 flex-shrink-0 text-[var(--text-muted)]" />
                <div className="text-center">
                  <p className="text-3xl font-bold text-[var(--color-success)]">
                    {data.potentialScore}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">Potential</p>
                </div>
                <div className="ml-auto rounded-[var(--radius-sm)] border border-[var(--color-success)]/30 bg-[var(--color-success)]/10 px-4 py-2 text-center">
                  <p className="text-2xl font-bold text-[var(--color-success)]">
                    +{data.potentialScore! - data.currentScore!}
                  </p>
                  <p className="text-[10px] text-[var(--color-text-tertiary)]">Opportunity</p>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
                Website Opportunity
              </p>
              <div className="rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-4">
                <p className="text-sm font-medium text-[var(--color-text-primary)]">
                  {data.opportunityText}
                </p>
                <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
                  {type === "no_website"
                    ? "This business has no website &mdash; a significant gap in visibility and lead generation."
                    : "This business relies on social platforms &mdash; no owned website for search visibility."}
                </p>
              </div>
            </div>
          )}

          {/* Top Findings */}
          <div>
            <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
              {isWebsite ? "Top Issues" : "Why It Matters"}
            </p>
            <div className="space-y-2">
              {data.findings.map((finding, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] px-3 py-2.5"
                >
                  <div className="h-1.5 w-1.5 shrink-0 rounded-[var(--radius-sm)] bg-[var(--text-muted)]" />
                  <span className="text-sm text-[var(--color-text-secondary)]">{finding}</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Summary / Why It Matters */}
          {isWebsite ? (
            <div>
              <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
                AI Opportunity Summary
              </p>
              <div className="rounded-[var(--radius-sm)] border border-[var(--color-accent)]/20 bg-[var(--color-accent)]/10 p-4 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                The website appears functional but underperforms in several areas that may
                impact lead generation and trust. Improving mobile usability, trust indicators,
                and conversion pathways could significantly improve effectiveness.
              </div>
            </div>
          ) : (
            <div>
              <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
                {type === "no_website" ? "Why a Website Matters" : "Why an Owned Website Matters"}
              </p>
              <div className="rounded-[var(--radius-sm)] border border-[var(--color-accent)]/20 bg-[var(--color-accent)]/10 p-4 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                {type === "no_website"
                  ? "A professional website establishes credibility, improves search visibility, and creates a central hub for lead generation. Without one, potential customers may struggle to find or trust the business."
                  : "Social media drives engagement, but an owned website provides credibility, search visibility, and lead capture that platforms cannot replace. It's the foundation of a professional digital presence."}
              </div>
            </div>
          )}

          {/* Outreach Preview */}
          <div>
            <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
              Outreach Preview
            </p>
            <div className="rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-4 text-sm leading-relaxed text-[var(--color-text-secondary)]">
              {isWebsite ? (
                <>
                  <p>Hi,</p>
                  <p className="mt-3">
                    I recently reviewed your website and noticed several opportunities that
                    could improve user experience and increase enquiries.
                  </p>
                  <p className="mt-3">
                    A few areas that stood out were mobile usability, trust-building elements,
                    and conversion pathways.
                  </p>
                  <p className="mt-3">
                    I{"'"}d be happy to share a few ideas that could help improve results.
                  </p>
                </>
              ) : type === "no_website" ? (
                <>
                  <p>Hi,</p>
                  <p className="mt-3">
                    I noticed your business doesn{"'"}t have a website yet. In today{"'"}s
                    market, that means potential customers searching for your services may not
                    find you.
                  </p>
                  <p className="mt-3">
                    A professional website could help establish trust, improve discoverability,
                    and generate leads automatically.
                  </p>
                  <p className="mt-3">
                    I{"'"}d be happy to discuss how we could help.
                  </p>
                </>
              ) : (
                <>
                  <p>Hi,</p>
                  <p className="mt-3">
                    I noticed you{"'"}re doing a great job engaging customers on social media.
                    However, without a dedicated website, you{"'"}re leaving search visibility
                    and lead capture on the table.
                  </p>
                  <p className="mt-3">
                    A website complements your social presence and gives customers a professional
                    destination to learn more.
                  </p>
                  <p className="mt-3">
                    I{"'"}d love to show you what that could look like.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}