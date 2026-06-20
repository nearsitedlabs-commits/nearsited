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

## Lead-type-specific

**Social `Website` pill:** Social-only leads sometimes show a `Website` pill in the top pills row alongside `#Instagram`. Either misnamed (should be `Visit Profile` if it links to the social URL) or the lead classifier is misrouting leads. Investigate. (Note: suppressed in sprint by passing `website={null}` to `LeadHeaderStrip` for social leads — the `View Profile` badge already handles this link.)
_Filed: June 2026 — lead-detail polish addendum §6_
