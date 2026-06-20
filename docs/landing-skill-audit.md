# Landing Page Skill Audit
*Audited against: CLAUDE.md (Design System Rules, Global Design Rules A–J, Mobile Rules, Component Inventory, Token Table)*
*Scope: `src/components/landing/**/*.tsx` — audit only, no files modified*
*Date: 2026-06-20*

---

## Prerequisite Blocker — Missing Token

**`--color-bg-surface-raised` does not exist in `globals.css`.**

The redesign prompt (`docs/landing-redesign-prompt.md`) references this token in 9+ sections as the primary replacement for decorative borders on content cards. It is not defined anywhere in the codebase. The closest existing token is `--color-bg-elevated` (`#1a2028` / `--bg-surface-2`).

**This token must be added to `globals.css` before any border→elevation refactor can proceed.** Suggested value:

```css
--color-bg-surface-raised: #1e2530;  /* between elevated and overlay */
```

Add under the `/* Surface hierarchy */` block in globals.css and update CLAUDE.md's token table.

---

## Summary by Severity

| Severity | Count |
|---|---|
| CRITICAL | 2 |
| HIGH | 14 |
| MEDIUM | 11 |
| LOW | 5 |

---

## CRITICAL

### C-1 — `LandingNav.tsx` — Mobile dialog missing focus trap
**File:** [LandingNav.tsx:183](src/components/landing/LandingNav.tsx#L183)

The mobile drawer renders with `role="dialog"` and `aria-modal="true"` but has no keyboard focus trap. CLAUDE.md mandates: *"Every `role="dialog"` needs a keyboard focus trap."* Tab / Shift+Tab focus cycles freely outside the drawer, which is an accessibility failure (WCAG 2.1 §2.1.2).

An Escape handler exists (line 35–41) but that only covers closing. No focus cycling logic is present. CLAUDE.md provides the exact required pattern: `containerRef` + `querySelectorAll` focusable + tab/shift-tab cycling + restore trigger on unmount.

**Fix:** Apply the focus trap pattern from CLAUDE.md to the `mobileDrawer()` rendered element (both the animated and reduced-motion branches).

---

### C-2 — `globals.css` — `--color-bg-surface-raised` token missing
**File:** [globals.css](src/app/globals.css)

Covered in the Prerequisite Blocker section above. Flagged here for completeness as it makes 9 sections of the redesign plan impossible to implement correctly.

---

## HIGH

### H-1 — `TrustBar.tsx` — Fake social proof active
**File:** [TrustBar.tsx:9-46](src/components/landing/TrustBar.tsx#L9)

Five placeholder dots (`TRUST_DOTS`) with varying size/opacity are rendered `aria-hidden="true"` beneath "Trusted by agencies worldwide" (line 41). No real logos or customer data backs this claim. The redesign prompt explicitly identifies this as harmful: *"reads as fake social proof — if there are no real logos to show, this section is doing harm, not help."*

**Fix:** Remove `TRUST_DOTS` array, remove the "Trusted by agencies worldwide" `<p>`, keep only the 3 inline trust signal `<li>` items. Display as horizontal strip on `--color-bg-surface`, no border.

---

### H-2 — `WhyNearsitedSection.tsx` — Asymmetric card treatment
**File:** [WhyNearsitedSection.tsx:53-90](src/components/landing/WhyNearsitedSection.tsx#L53)

The two comparison columns use different border treatments:
- Traditional card (line 54): `border border-white/10` — hardcoded `white/10`, not a token
- Nearsited card (line 74): `border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/[0.06]`

This is the asymmetry explicitly flagged in the redesign prompt (§5 "Critical fix — asymmetric border"). One card has a neutral border, the other has a brand-accent border — suggesting Nearsited is in an elevated/highlighted state, which muddies the direct comparison.

**Fix:** Remove borders from both cards. Use `--color-bg-surface` for both. Add a 2px left accent line: `border-l-2 border-l-[var(--color-danger)]` for Traditional, `border-l-2 border-l-[var(--color-accent)]` for Nearsited.

---

### H-3 — `WhyNearsitedSection.tsx` — Hardcoded color, not a token
**File:** [WhyNearsitedSection.tsx:54](src/components/landing/WhyNearsitedSection.tsx#L54)

`border-white/10` bypasses the design token system. The correct token for a subtle border is `border-[var(--color-border-subtle)]`. CLAUDE.md requires all colors to reference CSS variables.

---

### H-4 — `WhyNearsitedSection.tsx` — Opportunity type cards have inline border styles
**File:** [WhyNearsitedSection.tsx:107-112](src/components/landing/WhyNearsitedSection.tsx#L107)

Each of the four opportunity type cards (No Website / Social Only / Platform Only / Weak Website) uses inline `style={{ borderColor: ..., backgroundColor: ... }}` with dynamic values. These are bordered cards, which conflicts with the border replacement principle.

**Fix:** Remove the border from each card. Use a subtle tonal background tint (4–6% opacity hue shift) derived from each type's dot color, via background-only styling. The colored dot and label remain.

---

### H-5 — `ObjectionsSection.tsx` — Perimeter borders on accordion items
**File:** [ObjectionsSection.tsx:82-83](src/components/landing/ObjectionsSection.tsx#L82)

Each of the 6 objection items is wrapped in:
```tsx
className="rounded-[var(--radius-md)] border border-[var(--color-accent)]/15 bg-[var(--color-bg-surface)] overflow-hidden"
```
This boxes every item with a perimeter accent-tinted border. CLAUDE.md Rule C: *"Color only when it carries meaning."* The border here is decorative grouping, not semantic.

**Fix:** Remove the per-item border and radius. Replace with a thin `border-b border-[var(--color-border-subtle)]` divider between items (`last:border-b-0`). The outer wrapper needs no border — whitespace does the separation.

---

### H-6 — `LandingFAQ.tsx` — Perimeter borders on FAQ items (identical pattern)
**File:** [LandingFAQ.tsx:86-87](src/components/landing/LandingFAQ.tsx#L86)

Same pattern as H-5: every FAQ item is `border border-[var(--color-accent)]/15 bg-[var(--color-bg-surface)]`. Same fix applies.

---

### H-7 — `ProofBlocksSection.tsx` — Blockquote has both perimeter border and left accent
**File:** [ProofBlocksSection.tsx:22](src/components/landing/ProofBlocksSection.tsx#L22)

```tsx
className="... border border-[var(--color-accent)]/15 border-l-2 border-l-[var(--color-accent)] ..."
```

Two competing border declarations. The `border` creates a full perimeter; the `border-l-2` adds the accent left line. The redesign prompt says *"Remove the border, keep the left accent."* The perimeter border undercuts the left accent's visual hierarchy signal.

**Fix:** Remove `border border-[var(--color-accent)]/15`. Keep only `border-l-2 border-l-[var(--color-accent)] pl-6`. Remove the `rounded-[var(--radius-md)]` since the block is no longer boxed.

---

### H-8 — `ProofBlocksSection.tsx` — Stat tiles have perimeter borders
**File:** [ProofBlocksSection.tsx:40-50](src/components/landing/ProofBlocksSection.tsx#L40)

The three stat tiles (249 / 4 / <2 min) each have `border border-[var(--color-accent)]/15`. Redesign prompt §10: *"Three stat tiles: currently bordered. Remove borders. Use only typography and generous spacing — let the numbers breathe."*

**Fix:** Remove the border and `rounded-[var(--radius-md)]`. Keep the `p-6` padding and `text-center`. Replace the card bg with `--color-bg-surface` at most, but ideally just spacing.

---

### H-9 — `CTASection.tsx` — CTA container has perimeter accent border
**File:** [CTASection.tsx:16,44](src/components/landing/CTASection.tsx#L16)

The outer CTA div (duplicated in both motion branches) has `border border-[var(--color-accent)]/25`. This is a decorative card border on the final-conversion section. Redesign prompt §13: *"Remove the perimeter border around the entire section."*

**Fix:** Remove `border border-[var(--color-accent)]/25`. Use `bg-[var(--color-bg-surface-raised)]` (once that token is created) to differentiate from page background via elevation instead of stroke.

---

### H-10 — `HowItWorksSection.tsx` — Scoring callout and range cards both bordered
**File:** [HowItWorksSection.tsx:92-123](src/components/landing/HowItWorksSection.tsx#L92)

The "How opportunity scoring works" callout box has `border border-[var(--color-accent)]/15` (line 92). Inside it, each of the 3 score range cards also has `border border-[var(--color-accent)]/15` (line 111). Two levels of nested accent-tinted borders. Redesign prompt §4: *"Remove the border around the entire callout AND the 3 score-range cards inside it."*

**Fix:** Remove outer callout border → use `bg-[var(--color-bg-elevated)]` for elevation. Replace the 3 inner bordered cards with inline pills (no card per range).

---

### H-11 — `LandingHero.tsx` — Legacy `<Card>` component
**File:** [LandingHero.tsx:8,103,156](src/components/landing/LandingHero.tsx#L103)

Uses the legacy `<Card>` component. CLAUDE.md Component Inventory: *"Legacy card — prefer `<Section>` for new code."* For the landing page the issue is the bordered card treatment it produces (`border-[var(--border-strong)]` passed via className).

**Fix:** Replace the outer `<Card>` with a plain `<div>` using `bg-[var(--color-bg-surface-raised)]` and an inset top-edge highlight via `box-shadow: 0 1px 0 rgba(255,255,255,0.04) inset`.

---

### H-12 — `SampleReportSection.tsx` — Legacy `<Card>` with border
**File:** [SampleReportSection.tsx:278](src/components/landing/SampleReportSection.tsx#L278)

```tsx
<Card variant="default" padding="lg" className="mt-4 border-[var(--border-strong)]">
```

Legacy `<Card>` + legacy token `--border-strong` (see M-5). The entire report content is wrapped in a bordered box.

**Fix:** Replace with a plain `<div>` using `bg-[var(--color-bg-surface-raised)]` per the redesign prompt §6.

---

### H-13 — `SamplePitchSection.tsx` — Legacy `<Card>` with border
**File:** [SamplePitchSection.tsx:176](src/components/landing/SamplePitchSection.tsx#L176)

Same pattern as H-12. `<Card variant="default" padding="lg" className="border-[var(--border-strong)]">` on the pitch preview container.

**Fix:** Same as H-12.

---

### H-14 — `Pricing.tsx` — Infinite glow animation on featured card
**File:** [Pricing.tsx:281-298](src/components/landing/Pricing.tsx#L281)

```tsx
animate={{ boxShadow: [...] }}
transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 6.2 }}
```

This is an infinite-loop animation. The redesign prompt's animation rules explicitly forbid: *"Infinite-loop animations (except the hero opportunities feed cycle)."* The Agency card is not the hero feed.

**Fix:** Remove the `<motion.div>` glow pulse element. The featured card's visual dominance should come from scale (`transform: scale(1.02) translateY(-4px)`), the sage border, and the `<PrimaryButton>`. The glow adds attention-seeking motion that fights the restraint goal.

---

## MEDIUM

### M-1 — `QuickAuditSection.tsx` — Legacy token names throughout
**File:** [QuickAuditSection.tsx:86-93,152-185](src/components/landing/QuickAuditSection.tsx)

Multiple uses of legacy (non-semantic) variable names. `globals.css` comment (line 84–86): *"All new UI code must reference these tokens, not the raw vars above."*

| Line | Legacy token used | Correct semantic token |
|---|---|---|
| 86 | `var(--accent)` | `var(--color-accent)` |
| 87 | `var(--accent)` | `var(--color-accent)` |
| 90 | `var(--text-primary)]` | `var(--color-text-primary)` |
| 93 | `var(--text-secondary)]` | `var(--color-text-secondary)` |
| 152–159 | `var(--text-tertiary)]` (×3) | `var(--color-text-tertiary)` |
| 156 | `var(--text-primary)]` | `var(--color-text-primary)` |

---

### M-2 — `QuickAuditSection.tsx` — Raw Tailwind semantic colors for score display
**File:** [QuickAuditSection.tsx:70-74,173](src/components/landing/QuickAuditSection.tsx#L70)

Score color logic uses hardcoded Tailwind color classes:
```tsx
result.score >= 85 ? "text-green-400" : result.score >= 70 ? "text-amber-400" : "text-red-400"
```
And the issue icon at line 173 uses `text-amber-400`. CLAUDE.md: *"All colors reference CSS variables (`--color-*`) — no raw Tailwind semantic colors."*

**Fix:** Replace with CSS variable equivalents: `text-[var(--color-success)]`, `text-[var(--color-warning)]`, `text-[var(--color-danger)]`.

---

### M-3 — `LandingNav.tsx` — Legacy token in hover underline CSS
**File:** [LandingNav.tsx:82,87,92,97](src/components/landing/LandingNav.tsx#L82)

The animated desktop nav link underline uses `after:bg-[var(--text-primary)]` in the Tailwind `after:` pseudo-element:
```tsx
after:bg-[var(--text-primary)]
```
Should be `after:bg-[var(--color-text-primary)]`.

---

### M-4 — `HowItWorksSection.tsx` — Legacy `--border` token for step dividers
**File:** [HowItWorksSection.tsx:61](src/components/landing/HowItWorksSection.tsx#L61)

```tsx
className="... divide-y divide-[var(--border)]"
```
`--border` is the legacy variable. The correct semantic token is `--color-border-subtle`. Both resolve to the same value currently, but `--border` is marked for backward-compat only.

---

### M-5 — `LandingHero.tsx`, `SampleReportSection.tsx`, `SamplePitchSection.tsx` — Legacy `--border-strong` token
**Files:**
- [LandingHero.tsx:103](src/components/landing/LandingHero.tsx#L103)
- [SampleReportSection.tsx:269,278](src/components/landing/SampleReportSection.tsx#L269)
- [SamplePitchSection.tsx:168,176](src/components/landing/SamplePitchSection.tsx#L168)

All use `border-[var(--border-strong)]` or `hover:border-[var(--border-strong)]`. The semantic token is `var(--color-border-strong)`.

---

### M-6 — `LandingScrollNav.tsx` — Hardcoded rgba + legacy `--accent` token
**File:** [LandingScrollNav.tsx:76,131,146](src/components/landing/LandingScrollNav.tsx)

The scroll nav pill container (line 146) uses hardcoded rgba values:
```tsx
border border-[rgba(255,255,255,0.06)] bg-[rgba(10,14,18,0.7)]
```
These are valid design values but bypass the token system. `rgba(255,255,255,0.06)` = `--color-border-subtle`; `rgba(10,14,18,0.7)` ≈ `--color-bg-page` at 70% opacity.

Lines 76 and 131 use `var(--accent)` in `style` props (mobile progress bar and NavDot icon color).

**Fix:** Replace hardcoded rgba with CSS variables. Replace `var(--accent)` with `var(--color-accent)`.

---

### M-7 — `Pricing.tsx` — `rounded-full` on toggle UI, legacy `--accent` token
**File:** [Pricing.tsx:228,233,241,306](src/components/landing/Pricing.tsx)

The billing toggle uses `rounded-full` on the container (line 228), each button (line 233), and the active indicator div (line 241). CLAUDE.md: *"ONLY `--radius-sm` (6px) and `--radius-md` (10px) allowed."* No other values are permitted.

Additionally, line 306: `ring-1 ring-[var(--accent)]/10` uses the legacy `--accent` token.

**Fix:** Replace `rounded-full` on the toggle container and buttons with `rounded-[var(--radius-sm)]` (the pill shape). Replace `var(--accent)` with `var(--color-accent)`.

---

### M-8 — `LandingHero.tsx` — Pitch preview panel has perimeter border; `<Badge>` is legacy
**File:** [LandingHero.tsx:9,106,133,144](src/components/landing/LandingHero.tsx)

The pitch preview panel at line 144 has `border border-[var(--color-accent)]/15` as a sub-card inside the main card — two levels of nested borders.

Lines 8–9 import and use the legacy `<Badge>` component. CLAUDE.md: *"Legacy badge — prefer `<Pill>` for new code."* Badge is used for "Sample" (line 106) and the inline opportunity type badges (line 133–134, also using a raw `<span>` instead of `<Pill>`).

---

### M-9 — `SampleReportSection.tsx` + `SamplePitchSection.tsx` — Inner bordered sub-containers + `<Badge>` legacy
**Files:**
- [SampleReportSection.tsx:295](src/components/landing/SampleReportSection.tsx#L295)
- [SamplePitchSection.tsx:188](src/components/landing/SamplePitchSection.tsx#L188)

Both files have a bordered sub-container inside the main `<Card>`:
- SampleReport: `border border-[var(--color-accent)]/15 bg-[var(--color-bg-elevated)]` callout at bottom (line 295)
- SamplePitch: `border border-[var(--color-accent)]/15 bg-[var(--color-bg-elevated)]` wrapping the pitch body (line 188)

Both also use legacy `<Badge>` from `@/components/ui/Badge`.

---

### M-10 — `Pricing.tsx` — `<Badge>` legacy component
**File:** [Pricing.tsx:311](src/components/landing/Pricing.tsx#L311)

```tsx
<Badge color={plan.featured ? "amber" : "indigo"} className="mb-4 self-start">
```

Uses legacy `<Badge>`. Should use `<Pill>`.

---

### M-11 — Decorative icons without `aria-hidden` in multiple files

CLAUDE.md Rule B: *"No decorative icons. Icons appear only when they perform a function: button affordance, status indicator, or navigation. When in doubt, remove."*

The following icons are visually decorative (category ornamentation, not functional):

| File | Lines | Icons | Issue |
|---|---|---|---|
| [HowItWorksSection.tsx:79](src/components/landing/HowItWorksSection.tsx#L79) | 79 | `Search`, `Target`, `Mail`, `TrendingUp` | Step category icons — purely decorative |
| [AgencyUseCasesSection.tsx:42](src/components/landing/AgencyUseCasesSection.tsx#L42) | 42 | `Users`, `Building2`, `Palette`, `TrendingUp` | Use case category icons — purely decorative |
| [SamplePitchSection.tsx:143-148](src/components/landing/SamplePitchSection.tsx#L143) | 143–148 | `Zap`, `FileText`, `TrendingUp` | Feature bullet icons — purely decorative |
| [LandingHero.tsx:146](src/components/landing/LandingHero.tsx#L146) | 146 | `MessageSquare` | Followed by text label, icon is decorative |

None have `aria-hidden="true"`. Screen readers will announce these icons by their fallback name.

**Fix:** Add `aria-hidden="true"` to each decorative icon instance.

---

## LOW

### L-1 — `AgencyUseCasesSection.tsx` — Non-standard Tailwind size class
**File:** [AgencyUseCasesSection.tsx:43](src/components/landing/AgencyUseCasesSection.tsx#L43)

```tsx
<Icon className="h-4.5 w-4.5" />
```

`h-4.5` and `w-4.5` are not in the standard Tailwind spacing scale. Tailwind 3 JIT will generate the class but it's fragile and off the 4px grid. The closest correct value is `h-4 w-4` (16px) or `h-5 w-5` (20px).

---

### L-2 — `LandingFooter.tsx` — Raw `<button>` instead of `<Button>` component
**File:** [LandingFooter.tsx:109-115](src/components/landing/LandingFooter.tsx#L109)

The newsletter subscribe button is a raw `<button>` element with manual styling instead of using `<Button variant="primary">`. While the styling is correct visually, it bypasses the design system button component and creates a maintenance divergence point.

---

### L-3 — `SectionLabel.tsx`, `SectionTitle.tsx`, `SectionSub.tsx` — Nested animation risk
**Files:**
- [SectionLabel.tsx:5](src/components/landing/SectionLabel.tsx#L5)
- [SectionTitle.tsx:5](src/components/landing/SectionTitle.tsx#L5)
- [SectionSub.tsx:5](src/components/landing/SectionSub.tsx#L5)

Each of the three shared helper components wraps its content in `<FadeUp>`. When a parent section already wraps the entire header block in a `<FadeUp>` or `<motion.div>`, these create nested `whileInView` triggers on the same DOM subtree. In practice this causes the label, title, and subtitle to animate independently rather than as a unit, potentially creating visual desync on fast-loading connections.

**Fix:** Remove `<FadeUp>` from these shared components and let the parent section control the reveal timing with stagger.

---

### L-4 — `LandingScrollNav.tsx` — `rounded-full` on navigation dots
**File:** [LandingScrollNav.tsx:104-123](src/components/landing/LandingScrollNav.tsx#L104)

The `NavDot` component uses `rounded-full` for the small circular dot buttons. While CLAUDE.md says only `--radius-sm` and `--radius-md` are allowed, small UI dots/avatar circles are edge cases. Flag as LOW given the dot size (28–32px) and circular intent, but strictly the rule is violated.

---

### L-5 — `LandingScrollNav.tsx` — Scroll event triggers animation every frame
**File:** [LandingScrollNav.tsx:46-57](src/components/landing/LandingScrollNav.tsx#L46)

The `useScrollProgress` hook listens to `scroll` events (with `{ passive: true }`) and updates state on every event. The mobile progress bar `<motion.div>` re-renders with each `setProgress` call. The redesign prompt forbids *"Animation that triggers on every scroll event."* The Framer Motion `animate` with a short `0.1s linear` transition mitigates this partially, but the state update itself fires on every scroll tick.

**Fix:** Throttle `setProgress` with `requestAnimationFrame` or debounce — i.e., set the rAF in `update` and call `setProgress` only once per frame.

---

## Cross-Cutting Summary

### All files using legacy `<Card>` (prefer plain `<div>` or `<Section>`)
- [LandingHero.tsx](src/components/landing/LandingHero.tsx)
- [SampleReportSection.tsx](src/components/landing/SampleReportSection.tsx)
- [SamplePitchSection.tsx](src/components/landing/SamplePitchSection.tsx)

### All files using legacy `<Badge>` (prefer `<Pill>`)
- [LandingHero.tsx](src/components/landing/LandingHero.tsx)
- [SampleReportSection.tsx](src/components/landing/SampleReportSection.tsx)
- [SamplePitchSection.tsx](src/components/landing/SamplePitchSection.tsx)
- [Pricing.tsx](src/components/landing/Pricing.tsx)

### All files using legacy token names (replace with `--color-*` semantic tokens)
- [QuickAuditSection.tsx](src/components/landing/QuickAuditSection.tsx) — `--accent`, `--text-*` (×6 occurrences)
- [LandingNav.tsx](src/components/landing/LandingNav.tsx) — `--text-primary` in `after:` pseudo-element
- [LandingScrollNav.tsx](src/components/landing/LandingScrollNav.tsx) — `--accent` in style props
- [HowItWorksSection.tsx](src/components/landing/HowItWorksSection.tsx) — `--border`
- [LandingHero.tsx](src/components/landing/LandingHero.tsx) — `--border-strong`
- [SampleReportSection.tsx](src/components/landing/SampleReportSection.tsx) — `--border-strong`
- [SamplePitchSection.tsx](src/components/landing/SamplePitchSection.tsx) — `--border-strong`
- [Pricing.tsx](src/components/landing/Pricing.tsx) — `--accent`

---

## Files With No Violations

| File | Status |
|---|---|
| [LandingPageClient.tsx](src/components/landing/LandingPageClient.tsx) | Clean — thin composition layer only |
| [atlas/OpportunityAtlas.tsx](src/components/landing/atlas/OpportunityAtlas.tsx) | Clean — canvas animation, no design system tokens |
| [atlas/LandingBackground.tsx](src/components/landing/atlas/LandingBackground.tsx) | Clean — canvas animation, no design system tokens |
| [AgencyUseCasesSection.tsx](src/components/landing/AgencyUseCasesSection.tsx) | 2 LOW findings only (icon aria-hidden, h-4.5) |
| [LandingFooter.tsx](src/components/landing/LandingFooter.tsx) | 1 LOW finding (raw button); error state colors are correct |

---

## Recommended Fix Order

1. **Add `--color-bg-surface-raised` to `globals.css`** — unblocks all elevation-based border replacements
2. **`LandingNav.tsx` focus trap** (C-1) — accessibility, can't ship without it
3. **`TrustBar.tsx` fake social proof** (H-1) — credibility damage, quick fix
4. **`WhyNearsitedSection.tsx` asymmetric cards** (H-2, H-3, H-4) — flagged by you already, partially done
5. **`ObjectionsSection.tsx` + `LandingFAQ.tsx` accordion borders** (H-5, H-6) — same pattern, fix together
6. **`ProofBlocksSection.tsx`** (H-7, H-8) — border cleanup
7. **`CTASection.tsx`** (H-9) — 1 line change
8. **`HowItWorksSection.tsx` scoring callout** (H-10)
9. **Legacy token sweeps** (M-1 through M-6) — grep-replaceable, low risk
10. **`Pricing.tsx` glow animation** (H-14) + **`rounded-full` toggle** (M-7)
11. **`<Card>` + `<Badge>` → div + `<Pill>`** (H-11, H-12, H-13) — requires reviewing Card's padding/variant props
12. **Decorative icon `aria-hidden`** (M-11) — 4 files, mechanical fix
13. **LOW findings** — `h-4.5`, nested FadeUp, raw button, scroll throttle
