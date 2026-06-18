# Opportunity Detail Audit (`/dashboard/leads/[id]`)
**Date:** 2026-06-18 · **Auditor:** Claude Code (Prompt 8) · **Source analysis** (no Playwright)

---

## Executive Summary

The Opportunity Detail is the most architecturally sophisticated surface in v1: three distinct workflow pages (Website / Social-only / No-digital-presence), each routed by `detectLeadWorkflow()` in a server component. The website workflow (`lead-detail-client.tsx`) alone handles 7 hooks, 5 shared components, optimistic pipeline updates with rollback, auto-analysis from `?analyze=1`, and a two-column responsive layout. It is largely well-implemented. The main quality gaps are: the "Re-analyse" button (the most important action after a first analysis) uses the invisible ghost border treatment; the edit (pencil) icon button has a touch target below 28px; the mobile contact row also uses ghost borders; and the `window.location.href` used in row action menus throughout the leads table forces full page reloads when navigating to lead detail. None are data-breaking, but two directly impact the primary CTA after completing an analysis.

---

## Critical Issues

_None._ The page fetches data, routes to the correct workflow, runs analysis, and saves pitches correctly.

---

## High Priority (fix within 2 weeks)

### [HIGH] "Re-analyse" button uses ghost border — the primary action after first analysis
**What I see:** `lead-detail-client.tsx:307` — the analysis button in `extraActions` renders conditionally:
- When `!hasAudit`: sage background (`bg-[var(--color-accent)] px-3 py-2 text-xs font-medium text-white`) — correctly prominent.
- When `hasAudit` (re-run): `border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] ... text-[var(--color-text-secondary)]` — ghost border, near-invisible.

```ts
hasAudit
  ? "... border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] ..."
  : "... bg-[var(--color-accent)] ..."
```

**Senior dev perspective:** After the first analysis completes, the product's primary action becomes "Re-analyse" — refresh the data after a site has changed or verify updated scores. This is the button the user reaches for when they want fresh data. Making it use `border-subtle` (6% white on dark) means it visually disappears after the first analysis succeeds. The button goes from sage to invisible at exactly the wrong moment.

**ICP perspective:** I run my first analysis, scores appear. I want to re-run after finding the site has a new mobile version. I look at the header area. The action that was previously a bright sage button is now... nothing visible. I can't find the "Re-analyse" button until I hover over the area and see it change color.

**Recommended fix:** Give "Re-analyse" the `<SecondaryButton>` treatment: `border border-[var(--color-accent)]/30 text-[var(--color-accent)] hover:border-[var(--color-accent)]/60 hover:bg-[var(--color-accent)]/10`. This is visually lower-hierarchy than the first "Analyse Opportunity" sage button while remaining visible and branded.

In `lead-detail-client.tsx:307`:
```tsx
? "inline-flex cursor-pointer items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--color-accent)]/30 px-3 py-2 text-xs font-medium text-[var(--color-accent)] transition-colors hover:border-[var(--color-accent)]/60 hover:bg-[var(--color-accent)]/10 disabled:cursor-not-allowed disabled:opacity-50"
```

**Effort:** 10 minutes.

**Confidence:** HIGH.

---

### [HIGH] Edit (pencil) icon button has ~28px touch target — no min-h
**What I see:** `lead-detail-client.tsx:293-300` — the business edit button (shown only when `!biz.place_id`):
```tsx
<button
  type="button"
  onClick={() => setShowEditPanel((v) => !v)}
  title="Edit business details"
  className="shrink-0 rounded-[var(--radius-sm)] p-1.5 text-[var(--color-text-tertiary)] ..."
>
  <Pencil className="h-4 w-4" />
</button>
```
`p-1.5` = 6px padding on each side. `h-4 w-4` = 16px icon. Total tap area: approximately 28px × 28px. CLAUDE.md minimum: 44×44px for icon-only buttons.

**Senior dev perspective:** This button only appears on manually-created leads (those without a `place_id`, i.e., not from Google Places). These are the leads where editing is most critical — the user typed them in and may have made a typo. The most-needed edit button is the hardest to tap.

**ICP perspective:** On mobile, I added a lead manually. I spot a typo in the name. I tap the tiny pencil icon in the header. Frequently miss it and accidentally tap the business name or the header row behind it.

**Recommended fix:** Add `min-h-[44px] min-w-[44px] flex items-center justify-center` to the pencil button in `lead-detail-client.tsx:293`. On desktop, the larger padding adds some whitespace to the header row — acceptable.

**Effort:** 5 minutes.

**Confidence:** HIGH.

---

### [HIGH] `window.location.href` in LeadsTable row menus causes full page reload
**What I see:** `LeadsTable.tsx:127,148` — items in `buildRowMenu()`:
```ts
onClick: () => { window.location.href = `/dashboard/leads/${lead.id}`; },
```
This fires on "View opportunity", "View pitch", and "Generate pitch" menu items.

`window.location.href` is a hard navigation — it tears down React state, clears the current page, and does a full network round-trip to fetch the new page. Next.js App Router's client-side navigation (`router.push()`) would be 3–5× faster for this route since it's prefetched.

**Senior dev perspective:** This was likely written as a workaround when the `useRouter()` hook wasn't available in the function scope of `buildRowMenu`. The fix is straightforward: pull `router` into scope.

**ICP perspective:** I right-click "View opportunity" — no "Open in new tab" option. I middle-click — same, no new tab. The menu items fire `window.location.href` which doesn't support the browser's native link behaviors.

**Recommended fix:** Pass `router` into `buildRowMenu()` or call `router.push()` directly. In `LeadsTable.tsx`:
```ts
// Add to component imports/scope
import { useRouter } from "next/navigation";
// Pass into buildRowMenu or capture in renderRow
const router = useRouter(); // at component level

// In buildRowMenu
onClick: () => router.push(`/dashboard/leads/${lead.id}`),
```

**Effort:** 20 minutes.

**Confidence:** HIGH.

---

## Medium Priority (fix when refactoring nearby)

### [MEDIUM] Mobile contact row (phone + Maps) uses ghost borders
**What I see:** `lead-detail-client.tsx:394-414` — the mobile-only contact strip (shown when `business.phone || biz.address || biz.place_id`):
```tsx
className="inline-flex ... border border-[var(--color-border-subtle)] px-3 py-2 text-xs text-[var(--color-text-secondary)] ... min-h-[44px] hover:border-[var(--color-accent)]/40 ..."
```
Both the phone (tap-to-call) and Maps links use `border-subtle`. The phone number is the primary contact action on a lead page. Having it use a ghost border makes it look like a label, not a button.

**Senior dev perspective:** The mobile contact row is only shown below `lg:`. On a phone screen, this is the first thing after the header that the user sees when they pull up a lead to make a call. A ghost border on a tap-to-call button signals "informational" instead of "tap me."

**ICP perspective:** I pull up a lead on my phone, ready to call. I see the phone number at the top. It looks like text. I hesitate — is it a button? I tap it and it works, but the hesitation is unnecessary friction.

**Recommended fix:** Change both the phone and Maps links to use `border-[var(--color-border-strong)]` or `border-[var(--color-accent)]/30` in `lead-detail-client.tsx:394,408`. The phone link especially benefits from accent treatment since it's a primary mobile CTA.

**Effort:** 5 minutes.

**Confidence:** HIGH.

---

### [MEDIUM] `AIQuotaBanner`'s fallback callback does nothing except show a toast
**What I see:** `lead-detail-client.tsx:515`:
```tsx
onUseFallback={() => showToast("Lighter model unavailable — please retry in a moment")}
```
The `onUseFallback` prop in `AIQuotaBanner` is presumably intended to switch to a "Flash Lite" or cheaper model. Here it just shows a toast saying the lighter model is unavailable. There's no actual fallback model implementation.

**Senior dev perspective:** This is v2 work not yet implemented, surfaced as a dead button in the UI. `AIQuotaBanner` presumably renders a "Use lighter model" option that the user sees, taps, and gets... a toast saying it doesn't work. This is a false affordance.

**Recommended fix:** Until the fallback model is implemented, either (a) don't show the fallback option in `AIQuotaBanner` when it's not wired up — add a `showFallback={false}` prop and hide the option, or (b) change the toast to be explicit: "Flash Lite fallback coming soon." Option (a) is cleaner.

**Effort:** 15 minutes.

**Confidence:** MEDIUM (depends on `AIQuotaBanner`'s prop API).

---

### [MEDIUM] "Scores not yet verified" banner and "Analyse Now" button — double analysis affordance
**What I see:** `lead-detail-client.tsx:353-370` — when `!hasAudit && !hasDesign && hasWebsite`, a sage-tinted banner appears below the StatsRow with an "Analyse Now" button. This banner coexists with the "Analyse Opportunity" button already rendered in the header via `extraActions` (line 302-316).

**Senior dev perspective:** Two "run analysis" actions on the same page — one in the header strip, one as a full-width banner below the stats. Both are sage-backed. For a user who hasn't run an analysis, the banner is useful (more prominent, contextualizes why the scores are dashed). But it creates a scenario where tapping either button triggers analysis — both are correctly disabled during analysis. The duplication is intentional redundancy, but it could be simplified.

**ICP perspective:** No user impact — both buttons do the same thing. Minor visual clutter when the banner appears.

**Recommended fix:** Low priority — keep both. The banner is informative context ("Scores not yet verified" + explanation). The header button is positional convenience. They serve different user intents. If anything, remove the action from the banner and let it be informational only — the header button suffices.

**Effort:** 10 minutes if desired.

**Confidence:** LOW (current behavior is acceptable).

---

### [MEDIUM] `sectionContainer` / `sectionCard` motion variants are inline — not shared
**What I see:** `lead-detail-client.tsx:39-47` — animation constants defined at module level:
```ts
const sectionContainer = { hidden: {}, visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } } };
const sectionCard = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE_OUT } } };
```
Similar constants appear in `dashboard-client.tsx` and `discover/page.tsx`. Not a UX issue — pure code organization.

**Recommended fix:** Extract to `src/lib/motion.ts` alongside the existing `fadeUpVariants` / `staggerVariants`. Then import in each component. Low priority.

**Effort:** 20 minutes.

**Confidence:** HIGH (no user impact).

---

## Low Priority / Nice-to-have

### [LOW] "View pitch" in the row overflow menu navigates to `/dashboard/leads/[id]?tab=pitch`
**What I see:** `LeadsTable.tsx:132-136` — "View pitch" menu item:
```ts
onClick: () => { window.location.href = `/dashboard/leads/${lead.id}?tab=pitch`; },
```
The lead detail page (`lead-detail-client.tsx`) doesn't show evidence of consuming a `?tab=pitch` URL param to jump to the pitch section. If the query param is ignored, "View pitch" navigates to the lead detail without any special behavior — the pitch card will be present but not scrolled to or highlighted.

**Senior dev perspective:** If `?tab=pitch` is not handled, this is a dead affordance. The user clicks "View pitch" expecting to land on the pitch section; they land at the top of the page.

**Recommended fix:** Either implement `?tab=pitch` auto-scroll in `lead-detail-client.tsx` (add a `useEffect` that reads the search param and calls `document.querySelector("[data-section='pitch']").scrollIntoView()`), or remove "View pitch" from the row menu and just use "View opportunity."

**Effort:** 30 minutes (auto-scroll implementation).

**Confidence:** HIGH (the param appears to be unused).

---

### [LOW] `autoAnalyze` fires analysis only when no audit rows exist
**What I see:** `lead-detail-client.tsx:210-215`:
```ts
useEffect(() => {
  if (autoAnalyze && !hasAuditRows && hasWebsite && !analysis.runningFullAnalysis) {
    analysis.handleFullAnalysis();
  }
}, []); // intentional mount-only
```
`!hasAuditRows` means `!(mobileAudit || desktopAudit)` — no audit rows in the `audits` table. But `businesses.audited_at` can be set by the quick-audit flow without inserting into the `audits` table. So `hasAuditRows` can be `false` while `biz.audited_at` is set — causing `autoAnalyze` to re-trigger an analysis when the user navigates from Discovery with `?analyze=1` on a lead that was previously quick-audited.

**Senior dev perspective:** This is a subtle race condition: quick-audit saves to `businesses` columns only, not the `audits` table. `autoAnalyze` checks `audits` rows, not `businesses.audited_at`. So `?analyze=1` from Discovery could trigger a full re-analysis on a lead that was already quick-audited.

**Recommended fix:** Change the guard to include `hasAudit` (which uses `biz.audited_at`):
```ts
if (autoAnalyze && !hasAuditRows && !hasAudit && hasWebsite && !analysis.runningFullAnalysis)
```

**Effort:** 2 minutes.

**Confidence:** MEDIUM (depends on how frequently leads are quick-audited and then discovered again).

---

### [LOW] `urlToDisplayName()` strips domain extensions — may produce incorrect display names
**What I see:** `lead-detail-client.tsx:77-85`:
```ts
function urlToDisplayName(name: string): string {
  if (!name || name.includes(" ")) return name; // passes "Chai Wala" unchanged
  if (!name.includes(".") && !name.startsWith("http")) return name; // passes "ABC Restaurant"
  let n = name.replace(/^https?:\/\//i, "").replace(/^www\./i, "");
  n = n.split(/[./?#]/)[0]; // takes "chaiwala" from "chaiwala.com"
  n = n.replace(/[-_]/g, " ").trim();
  n = n.replace(/\b\w/g, (c) => c.toUpperCase());
  return n || name;
}
```
Edge case: a business named "Tech.io Solutions" would have the space stripped and the `.io` part incorrectly parsed as a URL. It would become "Tech" instead of "Tech.io Solutions."

**Recommended fix:** The function is called only when the business name looks like a URL (has no spaces). The edge case of a name like "Tech.io" is unlikely in practice given the product targets local businesses in India. Acceptable as-is. Document the edge case with a comment.

**Effort:** 10 minutes (defensive check).

**Confidence:** LOW.

---

## What's actually good

- **Server component parallel fetch.** `page.tsx:25-31` fires 5 DB queries in `Promise.all` — business, audits, design_analyses, pipeline, pitch all fetched concurrently. First-paint TTFB is bounded by the single slowest query, not the sum. This is the correct server-component pattern.

- **Three-workflow routing is clean.** `switch (workflow)` in `page.tsx:56` routes to three entirely different components based on `detectLeadWorkflow()`. The components receive the same prop shape. Each workflow can evolve independently without touching the others. The routing happens server-side — no client-side conditional renders causing layout shift.

- **Hook-based composition.** `lead-detail-client.tsx` delegates to 4 named hooks: `useContactInfo`, `useQuotaTimer`, `usePitchGeneration`, `useLeadAnalysis`. Each hook owns its state and side effects. The component is a composition layer, not a business logic host. This is the CLAUDE.md "thin route handler" equivalent for UI.

- **Optimistic pipeline update with rollback.** `handlePipelineChange` (line 220-240) immediately sets `currentPipelineStatus` optimistically, then rolls back on API failure with a toast. The user sees instant feedback even on slow networks. On failure, the state restores automatically.

- **`autoAnalyze` from `?analyze=1`.** Discovery page can pass `analyze=1` to lead detail, causing immediate analysis to start on mount (if no audit rows exist). This creates a seamless "discover → analyse" workflow without requiring the user to find and click the Analyse button themselves.

- **`BusinessEditPanel` for manually-added leads.** Leads without a `place_id` (manually entered) show an edit pencil in the header. The edit panel expands inline (no modal) with fields for name, city, and business type. The edit updates the local state with `setEditOverrides` for instant preview and persists via API. `onSaved` applies the patch to local state — no page reload needed.

- **Mobile contact row.** `lg:hidden` strip with tap-to-call phone link and Maps deep-link (uses `place_id` if available for precise Maps lookup, falls back to address). On a phone, this appears directly in the lead header — the two most-used mobile actions are one tap away. Ghost border aside, the placement is correct.

- **Pre-call brief.** `PreCallBrief` with HOOK/PAIN/SCOPE/OBJECTION sections gives the agency rep a one-page mental model before a call. Rendered above the fold on mobile (left column, after PitchCard), right column on desktop. Built from real data: actual score, actual issues, actual rating. Not generic text.

- **Reduced-motion throughout.** `useSafeReducedMotion()` is checked at the top of the component. `LayoutWrapper` and `MaybeFadeUp` conditionally wrap children with Framer Motion or plain divs based on the result. Users who've set "reduce motion" in their OS get no animation throughout the entire page without a separate CSS-only solution.

---

## Quality Scorecard

| Dimension | Score | Notes |
|---|---|---|
| Visual hierarchy | 7/10 | Two-column layout clear; "Re-analyse" ghost button breaks CTA hierarchy after first analysis |
| Typography discipline | 8/10 | Header names / subtext / metadata scale correct; pre-call brief readable at 13px |
| Color discipline | 7/10 | OpportunityScore correct; "Re-analyse" and mobile contact row ghost borders break semantic hierarchy |
| Button system quality | 6/10 | Sage "Analyse Opportunity" is correct; "Re-analyse" ghost treatment is the main regression |
| Icon discipline | 8/10 | Functional icons only; Pencil edit button is icon-only with insufficient touch target |
| Mobile responsiveness | 7/10 | Mobile contact row is correct pattern; pencil button 28px; ghost borders on tap-to-call |
| Loading/empty/error coverage | 9/10 | Analysis progress banner; design error banner; quota timer; partial-failure handled |
| Accessibility | 7/10 | Parallel fetch; optimistic updates; reduced motion; pencil button no min-h |
| Architecture quality | 9/10 | Hook decomposition, 3-workflow routing, server parallel fetch — all excellent |
| Does it look $89/mo | 7/10 | Pre-call brief and optimistic pipeline updates are premium; ghost "Re-analyse" and phone link undermine the finish |

**Top priority from this audit:** Fix "Re-analyse" ghost border (highest-traffic path after a successful analysis). Then add touch target to pencil button, ghost borders on mobile contact row.
