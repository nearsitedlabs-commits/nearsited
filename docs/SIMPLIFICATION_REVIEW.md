# Product Simplification Review
**Version:** 1.0 · **Date:** June 2026

---

## Purpose

This document captures findings from a comprehensive review of all dashboard pages. The goal is to identify features and patterns that add complexity without directly helping users **find opportunities, generate outreach, contact businesses, or win projects**.

---

## Summary of Findings

| Page | Lines | Estimated Simplification |
|------|-------|--------------------------|
| Leads (Opportunities) | 957 | ~400 lines |
| Lead Detail (+ sub-pages) | 1,378 + 337 + 385 | ~700 lines |
| Pipeline | 281 | ~80 lines |
| Pitches | 462 | ~200 lines |
| Discover | ~1,600 | ~500 lines |
| **Total** | **~5,400** | **~1,800 lines** |

---

## 1. Leads/Opportunities Page

**Source:** [`src/app/dashboard/leads/page.tsx`](../src/app/dashboard/leads/page.tsx)

### Remove
| Item | Reason |
|------|--------|
| **Score range slider** (0–100) | No user filters by exact score range. The slider + boundary state management adds complexity for zero value. |
| **Advanced filter panel** | 6+ filters (website type, sort order, sort by, score range, audited, analysed, archived) is over-engineered. Search + 1 tab bar is sufficient. |
| **Pipeline-specific filter tabs** (Prospect/Contacted/In Conversation/Won) | Duplicates Pipeline page. Users go there to manage pipeline stages. |
| **Desktop table + mobile cards** (dual render) | Two separate rendering paths (~300 lines duplicate). Use a single responsive card layout. |
| **sessionStorage pagination persistence** | 6 lines saving page number to sessionStorage. Unnecessary for a simple paginated list. |

### Simplify
| Item | Suggestion |
|------|------------|
| **3 filter groups** (Opportunity quality + Pipeline stage + Advanced) | Collapse to: search bar + single tab row (All / Needs Improvement / Strong Opportunity). |
| **Pagination** | Use simple client-side slicing without persistence. |

---

## 2. Lead Detail Page

**Source:** [`src/app/dashboard/leads/[id]/lead-detail-client.tsx`](../src/app/dashboard/leads/[id]/lead-detail-client.tsx)  
**Sub-pages:** [`components/no-digital-presence-page.tsx`](../src/app/dashboard/leads/[id]/components/no-digital-presence-page.tsx), [`components/social-opportunity-page.tsx`](../src/app/dashboard/leads/[id]/components/social-opportunity-page.tsx)

### Remove
| Item | Reason |
|------|--------|
| **3 separate workflow pages** (website / no_digital_presence / social_only) | 80% identical code tripled. Merge into a single page that adapts content by `website_status`. |
| **"Client Call Summary"** with hardcoded templated text | Static text blocks with `"━━ Current Situation ━━"` formatting. Scores and badges already communicate this. |
| **"Website Opportunity" educational content** (no-digital-presence page) | Explains why businesses need websites to web agencies. Redundant — users already know this. |
| **"Why This Is An Opportunity"** generic bullets | Static lists of obvious reasons. Replace with data-driven context (review count, rating) or remove. |

### Simplify
| Item | Suggestion |
|------|------------|
| **Pitch tone + length selectors** (3×3 = 9 combinations) | Default to professional/medium. Make tone a single regenerator option, not a pre-flight choice. |
| **PDF Export + Share Link** | Ancillary features that don't directly serve the core loop. Keep but don't invest further. |

---

## 3. Pipeline Page

**Source:** [`src/app/dashboard/pipeline/page.tsx`](../src/app/dashboard/pipeline/page.tsx)

### Remove
| Item | Reason |
|------|--------|
| **"Context" column** with score projections (`Score 41 → 66 · +25 pts`) | Projections imply false precision. The badge + status already communicates opportunity type. |
| **NEXT_ACTIONS map** (`new_lead → "Generate Outreach"`) | Generic labels guessed from status names. Single "Review" action suffices. |
| **Optimistic update + rollback on failure** | 25 lines of error recovery for a status dropdown. Server response updates are simpler. |

---

## 4. Pitches Page

**Source:** [`src/app/dashboard/pitches/page.tsx`](../src/app/dashboard/pitches/page.tsx)

### Remove
| Item | Reason |
|------|--------|
| **Channel filter chips** (Email/WhatsApp/Contact Form) | Commented as "future-proofing, informational only" — dead code that renders disabled-looking UI. |
| **Delete confirmation dialog** (two-step) | Pitches can be regenerated. Single-click delete with undo toast (like Gmail) is simpler. |
| **"Expand Card" / "Collapse" button** | Truncating pitch body to 3 lines adds friction to the primary action (copying pitches). Show full content inline. |
| **`window.addEventListener("focus", onFocus)`** re-fetch | Pitches don't change in the background. Unnecessary network traffic. |
| **"Opportunity Context"** score projections | Same projection math as Pipeline page. Redundant. |
| **CopiedId timer** (checkmark animation) | 4 state variables for a 2s animation. Use toast instead. |
| **Search across pitch body content** | Business name search is sufficient. |

---

## 5. Discover Page

**Source:** [`src/app/dashboard/discover/page.tsx`](../src/app/dashboard/discover/page.tsx)

### Remove
| Item | Reason |
|------|--------|
| **Saved Searches CRUD** | Full feature (create, list, load, API route + dialog + dropdown + re-fetch). Users can re-type city + type. |
| **sessionStorage persistence** (5 keys) | 50+ lines for persisting results/params/audited/analysed/pipeline across page refreshes. |

### Simplify
| Item | Suggestion |
|------|------------|
| **Sort dropdown** (3 options with custom comparators) | Default sort by website_status (no_website first) is what users want. |
| **Analyse Opportunity per-row** (triggers audit + design APIs for each) | Consider "Analyse All" as a batch action. |
| **Radius slider** (1km–100km with custom styling + tooltip) | Replace with simple select: 3km / 5km / 10km / 25km / 50km. |
| **Randomize button** | Fun but not core. Remove disabled/loading edge cases. |

---

## Core Principle

Every feature must answer: **Does this directly help users find opportunities, generate outreach, contact businesses, or win projects?**

If no, it should be removed, simplified, or deferred.
