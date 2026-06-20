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
