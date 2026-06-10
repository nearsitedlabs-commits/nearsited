# Lead Detail Page Refactor Plan

## Context

Claude's prompt targeted a hypothetical single `/app/opportunities/[id]/page.tsx` for "No Digital Presence" leads.
Our project has **3 separate lead detail pages** at `/dashboard/leads/[id]/`, routed by `detectLeadWorkflow()`:

| Workflow | Component | Lines | State |
|---|---|---|---|
| `website` | `LeadDetailClient` | ~549 | Has shared hooks & components |
| `social_only` | `SocialOpportunityPage` | ~473 | Self-contained, standalone |
| `no_digital_presence` | `NoDigitalPresencePage` | ~462 | Self-contained, standalone |

## Problems Identified

### 1. Massive Duplication between `NoDigitalPresencePage` and `SocialOpportunityPage`
Both duplicate nearly identical code for:
- Pipeline change handler
- Contact info fetching + rating refresh
- Pitch generation (5 dropdowns: tone, length, focus, opening, urgency)
- Share link creation
- Toast management
- Hero/header section
- Score strip display
- "Why This Is An Opportunity" card
- "Website Opportunity" card (same 4 benefits)
- Export section (PDF + Share)
- Client Call Summary (em-dash format)

### 2. Broken AI Quota Error Handling
- `NoDigitalPresencePage` & `SocialOpportunityPage`: raw `res.status === 429` → "AI quota exceeded — please try again later"
- `LeadDetailClient`: uses `useQuotaTimer` hook with "AI quota exceeded — please wait a moment and try again"
- Both read as **user credit exhaustion**, not Gemini API rate limits
- No countdown display, no auto-retry, no fallback to Flash-Lite

### 3. Wrong Credit Copy
- `CreditsWidget`: `"{used} / {limit} credits used this month"` — Free credits are LIFETIME per GTM.md
- Should say: `"{used} / {limit} free credits used"` with tooltip

### 4. Bloated Cards to Remove
- "Why This Is An Opportunity" — generic text, no data
- "Website Opportunity" — 4 generic benefit subcards (More Visibility / More Trust / Better Lead Gen / Better Customer Experience)
- Standalone "OPPORTUNITY SCORE" hero circle — should be in stats row

### 5. Missing Data Points (not computed/stored)
- `estimated_project_value` — not in any model
- `review_velocity_30d` — not computed
- `local_competitors` — not queried from Places

## Plan

### Phase 1: Shared Components (new files)

| Component | File | Purpose |
|---|---|---|
| `LeadHeaderStrip` | `components/LeadHeaderStrip.tsx` | Back link, business name, meta, pipeline, share, PDF |
| `StatsRow` | `components/StatsRow.tsx` | 4 stat cards: opp score, est value, review velocity, competition |
| `PitchCard` | `components/PitchCard.tsx` | Single "Tone ▾" trigger with expandable options, channel toggle, textarea, actions |
| `PreCallBrief` | `components/PreCallBrief.tsx` | HOOK/PAIN/SCOPE/OBJECTION blocks replacing em-dash |
| `AIQuotaBanner` | `components/AIQuotaBanner.tsx` | Countdown, auto-retry 5s, Flash-Lite fallback |

### Phase 2: Update All 3 Pages

Each page gets:
1. Header → `LeadHeaderStrip`
2. Stats row (replaces score hero + adds new stats)
3. Remove "Why This Is An Opportunity" card
4. Remove "Website Opportunity" card
5. Pitch section → `PitchCard`
6. Call summary → `PreCallBrief`
7. `AIQuotaBanner` for all pitch/api errors

### Phase 3: Fix CreditsWidget
- Change label text
- Add tooltip

### Phase 4: Fix API/Data Layer
- Add computed fields (est value, review velocity, local competitors) at audit time

### Out of Scope (per prompt)
- Sidebar IA consolidation (separate PR)
- Billing changes
- Pitch generator backend
