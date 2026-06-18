# Nearsited — Master Execution Plan (Playwright-Verified)

**Generated:** 2026-06-18T03:39 UTC
**Basis:** 47 findings across 11 pages + 10 system reports, all Playwright-verified on `http://localhost:3000`
**Constraint:** Cleanup and polish only — no redesigns. Work within current sage + dark navy direction.

---

## Phase 0 — Quick Wins (1-2 Days)

These items each take ≤30 min and deliver immediate visual or accessibility improvement. Do these first.

| # | Task | Finding | Effort | Playwright Data | File Targets |
|---|------|---------|--------|:---------------:|--------------|
| 0.1 | **Fix secondary button border opacity** — Change `border-[var(--color-border-subtle)]` (6% white) → `border-[var(--color-border-strong)]` (10% white) on secondary variant | X1: Invisible secondary border | 30 min | `rgba(255,255,255,0.06)` captured on all secondary buttons | [`Button.tsx:29`](src/components/ui/Button.tsx#L29) |
| 0.2 | **Fix pricing savings badge** — Change "SAVE 20%" to "Save up to 20%" or adjust prices to hit exactly 20% | H4: Pricing discrepancy (Starter 21%) | 15 min | Playwright verified: Starter $19→$15 = 21% savings | Pricing section in landing |
| 0.3 | **Add `focus-visible` to hero opportunity cards** — `focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]` | H5: No keyboard focus indicator | 15 min | Playwright confirmed: no visible focus on card `<button>` elements | [`LandingHero.tsx`](src/components/landing/LandingHero.tsx) |
| 0.4 | **Add `aria-hidden="true"` to 4 decorative icons** — 3 raw SVG opportunity card icons + 1 accordion chevron | H8: Icons missing aria-hidden | 15 min | 93 icons analyzed; 4 missing `aria-hidden` | Landing page SVGs |
| 0.5 | **Add `aria-live="polite"` to error banners** — AuthCard error container, ErrorState component | H7: Error banner not announced | 15 min | Playwright ARIA audit: no live region on error containers | [`AuthCard.tsx`](src/components/auth/AuthCard.tsx), [`ErrorState.tsx`](src/components/ui/ErrorState.tsx) |
| 0.6 | **Remove `recharts` from optimizePackageImports** (and package.json if unused) | M4: Dead recharts config | 10 min | Bundle analysis: recharts never imported | [`next.config.ts`](next.config.ts) |
| 0.7 | **Fix hero heading font** — Apply Switzer to hero H1 if declared in design system | M6: Hero uses Geist not Switzer | 15 min | Computed style: `Geist, "Geist Fallback"` on hero H1 | [`LandingHero.tsx`](src/components/landing/LandingHero.tsx) |
| 0.8 | **Add `aria-label="Remember me"`** to login remember-me checkbox | M22: Missing checkbox label | 10 min | Playwright found no explicit label association | Auth login page |
| 0.9 | **Remove decorative border from `Card.tsx` default variant** — cascades to every `<Card>` use | H6: Decorative borders | 20 min | ~55 decorative borders on landing alone | [`Card.tsx:33`](src/components/ui/Card.tsx#L33) |
| 0.10 | **Fix logo-icon.svg aspect ratio warning** — add `width: "auto"` or `height: "auto"` to CSS on the Image component | X10: Console warning on 13 routes | 30 min | Warning repeated 13 times across routes | All logo-icon renders |

**Total Phase 0 effort:** ~3-4 hours

---

## Phase 1 — System-Level Fixes (1 Week)

Items that cascade improvements across many pages. Each fix touches a single component/system file but improves every page that uses it.

### 1A — Button System Overhaul (1 day)

| # | Task | Effort | Detail |
|---|------|--------|--------|
| 1.1 | **Fix secondary hover/active states** — Accent-tinted hover, brighter active (not darker) | 30 min | Spec in [`PROPOSED_SYSTEM.md:49-55`](docs/audit-2026-06/systems/buttons/PROPOSED_SYSTEM.md#L49-L55) |
| 1.2 | **Add destructive variant** to Button.tsx | 30 min | NEW — red-tinted border/bg for delete/remove actions. Spec in [`PROPOSED_SYSTEM.md:77-98`](docs/audit-2026-06/systems/buttons/PROPOSED_SYSTEM.md#L77-L98) |
| 1.3 | **Fix size system** — sm: `min-h-[36px]`, explicit base padding | 15 min | Spec in [`PROPOSED_SYSTEM.md:122-136`](docs/audit-2026-06/systems/buttons/PROPOSED_SYSTEM.md#L122-L136) |
| 1.4 | **Migrate ~55 inline button clones** across dashboard pages to `<Button>` variants | 2-3h | Map in [`PROPOSED_SYSTEM.md:214-226`](docs/audit-2026-06/systems/buttons/PROPOSED_SYSTEM.md#L214-L226) |
| 1.5 | **Demote secondary CTAs on landing** — Keep ONE primary CTA per section | 1-2h | Landing currently has 16 primary buttons |
| 1.6 | **Fix border-radius violations** — `rounded-full` in LegalPage, `rounded-[20px]` in auth preview card | 30 min | [`LegalPage.tsx:130`](src/components/legal/LegalPage.tsx#L130), [`OpportunityPreviewCard.tsx:145`](src/components/auth/OpportunityPreviewCard.tsx#L145) |
| 1.7 | **Migrate destructive hover patterns** — FilterPanel, AuditProgressPanel, sign-out button to use destructive variant | 30 min | Map in [`PROPOSED_SYSTEM.md:233-239`](docs/audit-2026-06/systems/buttons/PROPOSED_SYSTEM.md#L233-L239) |

### 1B — Border System Migration (1 day)

| # | Task | Effort | Detail |
|---|------|--------|--------|
| 1.8 | **Remove decorative borders from content containers** — Card.tsx, StatTile.tsx, Section.tsx card/bordered variants | 1h | P0 in [`PROPOSED_SYSTEM.md:225-228`](docs/audit-2026-06/systems/borders/PROPOSED_SYSTEM.md#L225-L228) |
| 1.9 | **Remove decorative borders from lead detail cards** — AuditDetailsCard, ClientCallSummaryCard, AnalysisProgressBanner, PitchCard | 1h | P1 in [`PROPOSED_SYSTEM.md:230-232`](docs/audit-2026-06/systems/borders/PROPOSED_SYSTEM.md#L230-L232) |
| 1.10 | **Remove decorative borders from pipeline cards** — StageColumn, PipelineCard | 30 min | P1 continued |
| 1.11 | **Remove decorative borders from loading skeletons** to match rendered counterparts | 30 min | P3 in [`PROPOSED_SYSTEM.md:237-239`](docs/audit-2026-06/systems/borders/PROPOSED_SYSTEM.md#L237-L239) |
| 1.12 | **Migrate error banners to design tokens** — Replace `red-500/30` with `--color-danger`, `amber-500/30` with `--color-warning` | 1h | P2 in [`PROPOSED_SYSTEM.md:234-236`](docs/audit-2026-06/systems/borders/PROPOSED_SYSTEM.md#L234-L236) |

### 1C — State Coverage Gaps (1 day)

| # | Task | Effort | Detail |
|---|------|--------|--------|
| 1.13 | **Add error.tsx** to `/dashboard/leads/[id]/`, `/dashboard/discover/`, `/dashboard/audit/` | 1h | Each with context-aware messages: "Back to Opportunities", "Try a different search", "Check URL and try again" |
| 1.14 | **Add offline/online detection** — `useOnline()` hook + dismissable banner | 2-3h | Proposed in [`PROPOSED_COVERAGE.md:8-29`](docs/audit-2026-06/systems/states/PROPOSED_COVERAGE.md#L8-L29) |
| 1.15 | **Add skip-to-content link** — hidden until focused, keyboard-only visible | 1-2h | Standard accessible pattern |

### 1D — Accessibility System (0.5 day)

| # | Task | Effort | Detail |
|---|------|--------|--------|
| 1.16 | **Add `aria-live` to all error states** — auth forms, error.tsx components | 30 min | Screen reader announcement of validation/error messages |
| 1.17 | **Fix mobile touch targets <44px** — legal footer links, breadcrumb links, forgot password link | 1h | Details in [`PROPOSED_FIXES.md:29-38`](docs/audit-2026-06/systems/mobile/PROPOSED_FIXES.md#L29-L38) |

### 1E — Performance (0.5 day)

| # | Task | Effort | Detail |
|---|------|--------|--------|
| 1.18 | **Remove Framer Motion from dashboard bundle** — Replace `motion.div` in `Card.tsx` with CSS transitions | 1-2h | Saves ~40KB gzipped per dashboard page |
| 1.19 | **Standardize skeleton loading system** — Deprecate SkeletonLoader (Framer) in favor of `.skeleton` CSS class | 1h | Details in [`PROPOSED_SYSTEM.md:56-61`](docs/audit-2026-06/systems/animation/PROPOSED_SYSTEM.md#L56-L61) |

**Total Phase 1 effort:** ~5-7 days

---

## Phase 2 — Page-Level & Structural Fixes (2 Weeks)

Page-specific improvements that don't cascade but are independently valuable.

### 2A — Landing Page (3 days)

| # | Task | Effort | Report Reference |
|---|------|--------|-----------------|
| 2.1 | **Demote CTAs to one primary per section** — Currently 16 primary buttons | 1-2h | [`REPORT.md:26-34`](docs/audit-2026-06/pages/landing/REPORT.md#L26-L34) |
| 2.2 | **Fix hero spacing on mobile** — Reduce `gap-8` to `gap-4` at 375px | 1-2h | [`REPORT.md:57-65`](docs/audit-2026-06/pages/landing/REPORT.md#L57-L65) |
| 2.3 | **Standardize SectionLabel component** — Replace inline pricing label with `<SectionLabel>Pricing</SectionLabel>` | 1h | [`REPORT.md:66-71`](docs/audit-2026-06/pages/landing/REPORT.md#L66-L71) |
| 2.4 | **Add trust signals to TrustBar** — Placeholder dot indicators for future customer logos | 2-3h | [`REPORT.md:73-80`](docs/audit-2026-06/pages/landing/REPORT.md#L73-L80) |
| 2.5 | **Add URL fragment support to FAQ accordion** — Deep-link specific FAQ items | 1-2h | [`REPORT.md:82-87`](docs/audit-2026-06/pages/landing/REPORT.md#L82-L87) |
| 2.6 | **Replace legacy ScoreRing with ScoreCircle** on hero opportunity cards | 30 min | [`REPORT.md:105-109`](docs/audit-2026-06/pages/landing/REPORT.md#L105-L109) |
| 2.7 | **Add loading fallbacks for SSR:false components** — CanvasBackground, OpportunityAtlas | 1h | [`REPORT.md:199-200`](docs/audit-2026-06/pages/landing/REPORT.md#L199-L200) |
| 2.8 | **Fix hero subtitle line-height on mobile** — Change `leading-7` to `leading-6` | 15 min | [`REPORT.md:93-97`](docs/audit-2026-06/pages/landing/REPORT.md#L93-L97) |

### 2B — Auth Pages (1 day)

| # | Task | Effort | Report Reference |
|---|------|--------|-----------------|
| 2.9 | **Reposition "Forgot password?" link** — Place directly below password field | 1h | [`REPORT.md:54-59`](docs/audit-2026-06/pages/auth/REPORT.md#L54-L59) |
| 2.10 | **Add client-side email format validation** — Pattern check before submit | 30 min | [`REPORT.md:487`](docs/audit-2026-06/pages/auth/REPORT.md#L487) |
| 2.11 | **Fix password strength meter visibility** — Don't hide when field error present | 15 min | [`REPORT.md:488`](docs/audit-2026-06/pages/auth/REPORT.md#L488) |

### 2C — Legal Pages (0.5 day)

| # | Task | Effort | Report Reference |
|---|------|--------|-----------------|
| 2.12 | **Add "Last updated" schema.org structured data** | 30 min | [`REPORT.md:232`](docs/audit-2026-06/pages/legal/REPORT.md#L232) |
| 2.13 | **Fix legal body line length** — Increase content max-width for 60-80 char target | 1h | [`REPORT.md:39-41`](docs/audit-2026-06/pages/legal/REPORT.md#L39-L41) |
| 2.14 | **Consider print-friendly stylesheet** for legal pages | 1-2h | [`REPORT.md:233`](docs/audit-2026-06/pages/legal/REPORT.md#L233) |

### 2D — Typography Consolidation (3 days)

| # | Task | Effort | Report Reference |
|---|------|--------|-----------------|
| 2.15 | **Consolidate 21 font sizes to 8-10 step scale** | 2-3d | [`PROPOSED_SYSTEM.md:25-67`](docs/audit-2026-06/systems/typography/PROPOSED_SYSTEM.md#L25-L67) |
| 2.16 | **Consolidate 4 font weights to 3** (400/500/700) | 1d | [`PROPOSED_SYSTEM.md:72-88`](docs/audit-2026-06/systems/typography/PROPOSED_SYSTEM.md#L72-L88) |
| 2.17 | **Fix heading level skip on pricing page** — h0→h2 jump | 15 min | [`PROPOSED_SYSTEM.md:106`](docs/audit-2026-06/systems/typography/PROPOSED_SYSTEM.md#L106) |
| 2.18 | **Standardize body text to single font size** (14px mobile, 16px desktop) | 1d | [`PROPOSED_SYSTEM.md:178-185`](docs/audit-2026-06/systems/typography/PROPOSED_SYSTEM.md#L178-L185) |

### 2E — Animation System Polish (1 day)

| # | Task | Effort | Report Reference |
|---|------|--------|-----------------|
| 2.19 | **Add reduced-motion check to FadeUp/FadeIn/StaggerContainer** | 1h | [`PROPOSED_SYSTEM.md:49`](docs/audit-2026-06/systems/animation/PROPOSED_SYSTEM.md#L49) |
| 2.20 | **Replace Pricing toggle spring with CSS transition** | 30 min | [`REPORT.md:100-103`](docs/audit-2026-06/pages/landing/REPORT.md#L100-L103) |
| 2.21 | **Add page transition animations between dashboard routes** | 2-3h | Nice-to-have — Framer LayoutGroup |

**Total Phase 2 effort:** ~10-12 days

---

## Phase 3 — Architecture Improvements (1 Month)

Long-term maintainability and quality infrastructure.

| # | Task | Effort | Rationale |
|---|------|--------|-----------|
| 3.1 | **ESLint rule: ban inline button patterns** — `inline-flex cursor-pointer border border-\[var` should use `<Button>` component | 1d | Enforces button system compliance at build time |
| 3.2 | **ESLint rule: ban raw Tailwind semantic colors** — `red-500`, `amber-500` → `--color-danger`, `--color-warning` | 1d | Enforces design token usage |
| 3.3 | **ESLint rule: ban non-standard border-radius** — only `--radius-sm` (6px) and `--radius-md` (10px) allowed | 0.5d | Enforces radius discipline |
| 3.4 | **ESLint rule: require `aria-hidden` on decorative SVGs** | 0.5d | Accessibility enforcement |
| 3.5 | **Add font-size CSS custom properties** — Register all 8-10 font-size tokens in `globals.css` under `:root` | 1h | Currently only hero, display, 2xl, xl, lg are defined |
| 3.6 | **Consolidate color system to <20 colors** — Remove unused opacity variants, add `--color-border-default` alias | 1d | Currently 27 distinct colors |
| 3.7 | **Add code review checklist** to CLAUDE.md — Button variants, border-radius, design tokens, accessibility, mobile touch targets | 30 min | Prevents regression |
| 3.8 | **Review all 47 potential contrast issues** flagged by Playwright | 1d | Accessible color contrast |
| 3.9 | **Load Switzer font** via next/font and apply to hero headlines | 1h | Per design system declaration |
| 3.10 | **Add `sizes` prop to all `next/image` logo renders** | 1h | Image optimization |

**Total Phase 3 effort:** ~15-20 days

---

## Do NOT Do

These items are explicitly excluded from the current plan:

1. **No redesign of the landing page layout.** Cleanup only — keep current section structure, hero, pricing cards.
2. **No new components or sections.** Work within existing component inventory. Don't add new landing sections, auth flows, or dashboard pages.
3. **No color scheme changes.** The dark navy `#0a0e12` + sage `#8A9777` is correct and tested. No alternative themes.
4. **No animation overhaul.** The Framer Motion architecture is sound. Just fix the reduced-motion gaps and remove it from the dashboard bundle.
5. **No mobile layout restructure.** The responsive patterns are correct (mobile-first, BottomNav, MobileHeader, BottomSheet). Just fix touch targets.
6. **No recharts removal from package.json** if it's planned for v2 (radar charts, analytics). Remove from `optimizePackageImports` only.
7. **No content rewriting** on legal pages. The content is notably well-written for a solo-founder product.
8. **No auth flow redesign.** The middleware + layout double protection, Google OAuth, password reset flow are all correct.
9. **No new landing page hero concept.** Current hero with opportunity cards and live preview is effective. Fix polish issues.
10. **No full typography redesign.** Consolidate existing sizes — don't redefine the scale.

---

## Highest Effort-to-Impact Ratio Changes

Ranked by (ICP impact / implementation effort):

| Rank | Task | Impact | Effort | Ratio | Phase |
|:----:|------|--------|--------|:-----:|-------|
| 1 | **Fix invisible secondary button border** | HIGH — buttons are everywhere, invisible border = cheap feel | XS (30 min) | ★★★★★ | 0 |
| 2 | **Add offline detection** | HIGH — ICP on mobile or unstable connection sees silent failure | M (2-3h) | ★★★★★ | 1 |
| 3 | **Fix pricing savings badge** | HIGH — pricing trust critical for B2B SaaS | XS (15 min) | ★★★★★ | 0 |
| 4 | **Remove decorative borders from Card.tsx** | MEDIUM — affects every card in the app, instant visual upgrade | XS (20 min) | ★★★★☆ | 0 |
| 5 | **Add error.tsx to 3 critical pages** | MEDIUM — prevents blank error screens in dashboard | S (1h) | ★★★★☆ | 1 |
| 6 | **Fix hero focus indicators** | MEDIUM — keyboard accessibility | XS (15 min) | ★★★★☆ | 0 |
| 7 | **Remove Framer Motion from dashboard** | MEDIUM — ~40KB bundle saving | S (1-2h) | ★★★★☆ | 1 |
| 8 | **Demote landing CTAs to one primary per section** | HIGH — conversion design 101 | S (1-2h) | ★★★★☆ | 1 |
| 9 | **Add aria-live to error banners** | LOW — screen reader improvement | XS (15 min) | ★★★☆☆ | 0 |
| 10 | **Migrate inline button clones** | MEDIUM — architectural hygiene, prevents future inconsistency | M (2-3h) | ★★★☆☆ | 1 |

---

## Verification Criteria

### Phase 0 — Quick Wins Verification
- [ ] Secondary buttons show visible border (`rgba(255,255,255,0.10)`) at rest state — verify with Playwright computed-style capture
- [ ] Pricing badge shows correct savings percentage for both tiers — verify math
- [ ] Hero opportunity cards show `focus-visible:ring-2` accent ring on keyboard tab — verify with Playwright keyboard navigation
- [ ] 4 decorative SVGs now have `aria-hidden="true"` — verify with Playwright attribute check
- [ ] Error banners have `aria-live="polite"` — verify with Playwright attribute check
- [ ] `recharts` removed from `optimizePackageImports` — verify no import found
- [ ] Hero H1 uses Switzer font-family — verify computed style
- [ ] Remember-me checkbox has `aria-label` — verify with Playwright
- [ ] Card.tsx default variant no longer has `border border-[var(--color-border-subtle)]` — verify computed style
- [ ] 0 console warnings related to logo-icon.svg — verify with Playwright console capture

### Phase 1 — System-Level Verification
- [ ] All secondary buttons have accent-tinted hover state — verify with Playwright hover capture
- [ ] Destructive variant available and used in FilterPanel, AuditProgressPanel, sign-out button
- [ ] All ~55 inline button clones migrated to `<Button>` variants — verify by grep of inline patterns
- [ ] Landing page has ≤1 primary CTA per section — verify by button count per section
- [ ] 62 decorative borders removed — verify border count reduced from 137 baseline
- [ ] Error banners use `--color-danger`/`--color-warning` tokens, not `red-500`/`amber-500`
- [ ] 3 new `error.tsx` files exist at correct paths
- [ ] Offline banner appears when `navigator.onLine` is false — verify with Playwright emulation
- [ ] Skip-to-content link visible on keyboard focus — verify with Playwright keyboard navigation
- [ ] Framer Motion not in dashboard bundle — verify bundle analysis

### Phase 2 — Page-Level Verification
- [ ] Landing hero has responsive gap at 375px — demo card visible without scroll — verify viewport capture
- [ ] `SectionLabel` component used consistently across all sections
- [ ] TrustBar shows visual trust signals (placeholder dots)
- [ ] FAQ items have deep-linkable URL hash support
- [ ] "Forgot password?" link directly below password field — verify DOM position
- [ ] Email format validation present on client side
- [ ] Legal content line length 60-80 chars — verify computed layout
- [ ] Font sizes consolidated to 8-10 distinct values (down from 21) — verify with Playwright inventory
- [ ] Font weights consolidated to 3 (down from 4) — verify with Playwright inventory

### Phase 3 — Architecture Verification
- [ ] ESLint rules installed and pass on `npx eslint src/`
- [ ] Font-size CSS custom properties registered for all scale steps in `globals.css`
- [ ] Color count reduced to <20 distinct values — verify with Playwright color inventory
- [ ] Code review checklist added to `CLAUDE.md`
- [ ] 47 contrast issues reviewed and resolved or documented as intentional
- [ ] Switzer font loaded and applied to hero headlines — verify computed style

---

*Execution plan generated from real Playwright data on 2026-06-18.*  
*All items reference findings from 21 prompts executed on `http://localhost:3000` with Playwright.*
