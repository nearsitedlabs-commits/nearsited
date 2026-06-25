# Nearsited — Backlog

Items deferred from active sprints. Add date + sprint source when filing.

---

## Lead Detail

**[lead-detail] Pre-Call Brief SUGGESTED SCOPE placeholder interpolation broken (platform leads, pre-analysis)**
The SUGGESTED SCOPE section reads: "A full audit and redesign would bring the score from 0 to an estimated 0/100." Both score placeholders show as literal `0` instead of real values. The pre-analysis platform branch of the Pre-Call Brief generation is not interpolating the score variables correctly. Check `buildPreCallBriefSections()` in `OpportunityBullets.tsx` for the pre-analysis platform branch.
_Filed: June 2026 — lead-detail sprint §6_

---

**[lead-detail] Trust score label is not self-explanatory**
The "Trust" metric tile in Technical Details does not explain what it measures. Users may not understand whether it refers to HTTPS, contact info presence, structured data, reviews, etc. Either add an inline tooltip or rename the label to something more descriptive (e.g., "Trust Signals"). The score is computed in `scoring.ts` via `trustScore({ trust })` from Gemini's `criteria_scores.trust`.
_Filed: June 2026 — lead-detail sprint §8.4_

---

**[lead-detail] History only logs audit events — non-audit events not tracked**
The History section only shows Performance Audit and Design Analysis rows. It should also log: pipeline stage changes, pitch generated, lead added to pipeline. This is particularly important for social and no-digital-presence leads where no audit runs — their history is always empty.
_Filed: June 2026 — lead-detail sprint §10.4_

---

## Content / Generation Prompts (out of UI scope)

**Pre-Call Brief grammar:** "Why This Is An Opportunity" prose in `LeadDetailClient` post-analysis contains subject-verb agreement issues (e.g., "design score of 68/100 need attention" should be "needs attention"). Update the generation prompt for grammar correctness.

**Projection tilde notation:** Pre-Call Brief and "Why This Is An Opportunity" descriptions use tilde-prefix on projected scores (e.g., "push the score from 78 to ~86"). Rule J bans tilde-prefix on score circles; the spirit extends to prose. Update the generation prompt to use parenthetical labels: "to 86 (projected)" or "to roughly 86" instead of "~86". Alternatively, add a render-time string sanitizer that converts `~N` to `N (projected)` if updating the generation prompt is out of scope.

**Suggested Scope placeholder interpolation:** Pre-analysis platform leads show literal "0/100" placeholders in SUGGESTED SCOPE text. Score interpolation broken in the pre-analysis generation prompt. (Already flagged in prior sprint.)

---

## UX Features (separate spec needed)

**Email edit affordance:** No way to mark a scraped/detected email as wrong or supply a correct one. Common failure mode with low-quality data sources. Add an inline edit pencil icon next to the email chip in the Pitch panel.

**PITCH ANGLES dual representation:** Right-rail shows two classification pills (e.g., MOBILE OPTIMISATION + CONVERSION OPTIMISATION) above the prose, AND a 3-bullet PITCH ANGLES list below. Unclear semantic relationship — is the pill row a "top 2 of 3 angles" summary, or redundant with the list? Decide info architecture and unify.

**Technical Details + Web Vitals unification:** Currently two separate sections. Vitals are a granular drill-down of the Mobile Perf / Desktop Perf scores already in Technical Details. Consider unifying under one toggle with vitals nested inside Technical Details.

---

## Scoring Formula

**Opportunity score calibration:** Post-analysis verified scores on has-website leads with high reviews + good contact accessibility + moderate design issues can land in the 30s (Medium Opportunity). The math may over-weight design issues relative to commercial signal. Audit scoring formula in `scoring.ts` against intuitive expected values for a sample of lead types.

---

## Landing (from polish sprint §0–§15, June 2026)

**Pricing card borders** — `src/components/landing/Pricing.tsx`. Non-featured plan cards still use `<Card variant="default">` which adds a subtle perimeter border via the shared Card component. Sprint plan says "Agency keeps brand-accent border" but other cards should use elevation only. Fix: replace `<Card>` with `<div>` + explicit classes, same as done in SampleReportSection / SamplePitchSection.

**Footer link hover not gated** — `src/components/landing/LandingFooter.tsx`. Footer `<a>` tags use `hover:text-[var(--color-text-primary)]` without `@media(hover:hover)`. Not a sticky-hover bug on simple text links but violates CLAUDE.md mobile rules. Gate with `[@media(hover:hover)]:hover:text-...` pattern.

**ProofBlocksSection founder avatar** — `src/components/landing/ProofBlocksSection.tsx` line 27. Uses `rounded-full` for avatar circle. CLAUDE.md bans `rounded-full`; acceptable exception for avatar circles but worth documenting for design audit.

---

## Lead-type-specific

**Social `Website` pill:** Social-only leads sometimes show a `Website` pill in the top pills row alongside `#Instagram`. Either misnamed (should be `Visit Profile` if it links to the social URL) or the lead classifier is misrouting leads. Investigate. (Note: suppressed in sprint by passing `website={null}` to `LeadHeaderStrip` for social leads — the `View Profile` badge already handles this link.)
_Filed: June 2026 — lead-detail polish addendum §6_

---

## Dashboard (from dashboard-refactor sprint, June 2026)

**Next-action queue expansion:** Today banner currently surfaces "leads ready to pitch." Could also surface: "pitches generated, awaiting send"; "contacted >7 days ago, follow-up due"; "won leads, awaiting handoff." Each state would have its own CTA. Requires data-layer support for these states and design for the multi-state banner.

**Focused pitch flow:** Alternative to "Pitch them" landing on filtered list — open a one-lead-at-a-time review flow (generate pitch → review → copy → mark sent → move to next). Higher activation/throughput for first-time users.

**Territory switcher:** Today banner is locked to one territory (derived from most common city in loaded leads). Multi-territory users need a way to switch territory context on the dashboard without going to Find. Requires a proper territory data model (currently inferred, not stored).

**Sidebar "Discover" duplication:** Both the sidebar (`Find`) and the dashboard top-right (`Discover`) lead to `/dashboard/discover` with different labels. Standardise naming across sidebar nav and dashboard header button.
