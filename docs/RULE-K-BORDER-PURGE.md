# Rule K Border Purge — Change Summary
*Completed: 2026-06-24 · 83 files changed · TypeScript: clean*

---

## What Was Done

System-wide enforcement of **Rule K (amended)**: borders are permitted only on:
1. Focus rings — keyboard navigation indicators on interactive elements
2. Form input fields — any `<input>`, `<textarea>`, `<select>` with `focus:border-[var(--color-accent)]`
3. Error state inputs — validation failure feedback on form fields

Every decorative or structural perimeter border was replaced with **tonal backgrounds** (`bg-[color]/10–15`) or **surface elevation** (`--color-bg-surface` → `--color-bg-elevated`). Raw Tailwind color classes (`text-red-400`, `bg-amber-500`, `border-blue-500/30`, etc.) were also replaced with design tokens throughout.

---

## Permitted Borders (Unchanged)

These patterns were verified correct and deliberately left untouched:

| Pattern | Example | Reason |
|---|---|---|
| `border-t/b/y/r` dividers | Nav bars, sidebar, list rows | Structural chrome — not perimeter |
| `divide-y` | List separators | Row divider — permitted |
| `border-l-2` accent lines | KPI strip callouts | Accent line — permitted |
| `border-2 border-current border-t-transparent` | Button spinner | CSS spinner ring |
| `border-2` on custom checkboxes | Bulk select in leads list | Form control |
| `border border-[var(--color-border-subtle)] + focus:border-[var(--color-accent)]` | All `<input>`, `<textarea>`, `<select>` | Form inputs — explicitly permitted |
| `border-4 border-transparent border-t-[...]` in `ScoreRing.tsx` | Tooltip arrow | CSS triangle trick |

---

## 1. Core UI Components (`src/components/ui/`)

| File | Change |
|---|---|
| `Pill.tsx` | Removed `border border-[...]` from all variants; bumped tonal opacity to `/12` |
| `Button.tsx` | Removed `border` from secondary and destructive variants; replaced with tonal backgrounds |
| `Badge.tsx` | Removed border classes; converted to tonal `bg-[color]/12` |
| `Card.tsx` | Removed perimeter border; uses surface elevation only |
| `ActionMenu.tsx` | Removed dropdown container border |
| `OpportunityCard.tsx` | Removed card border + hover border; `OpportunityDot` border → tonal bg; icon button borders removed |
| `PipelineSelect.tsx` | Removed confirm-remove button border |
| `SearchableSelect.tsx` | Removed dropdown container border (text input border kept — form control) |
| `WebsiteBadge.tsx` | Removed badge border; added `bg-[var(--color-bg-elevated)]` |
| `ScoreRing.tsx` | Removed tooltip container border |
| `CreditsWidget.tsx` | `bg-red-500` / `bg-amber-500` → `--color-danger` / `--color-warning` |
| `Toast.tsx` | Removed border |
| `Tooltip.tsx` | Removed border |
| `ErrorState.tsx` | Removed border |

---

## 2. Shared UI Constants (`src/lib/ui-constants.ts`)

Removed `border border-[var(...)]` from all badge style maps:

| Constant | Fix |
|---|---|
| `PIPELINE_BADGE_STYLES` | All 6 pipeline statuses — borders removed |
| `OPPORTUNITY_INDICATORS` | All 6 opportunity levels — borders removed |
| `SCORE_STATUS_PILLS` | All 4 score label pills — borders removed |
| `ISSUES_COUNT_STYLES` | Border removed |

---

## 3. Leads Page — Status Badge Map (`src/app/dashboard/leads/components/types.ts`)

`STATUS_BADGE` record: removed `border-*` from all 7 entries; replaced raw Tailwind colors with design tokens.

| Status | Before | After |
|---|---|---|
| `new` | `border-blue-500/30 bg-blue-500/10 text-blue-400` | `bg-[var(--color-info)]/10 text-[var(--color-info)]` |
| `audited` | `border-emerald-500/30 bg-emerald-500/10 text-emerald-400` | `bg-[var(--color-accent)]/10 text-[var(--color-accent)]` |
| `pitched` | `border-indigo-500/30 bg-indigo-500/10 text-indigo-400` | `bg-[var(--badge-indigo-bg)] text-[var(--badge-indigo-text)]` |
| `in_pipeline` | `border-cyan-500/30 bg-cyan-500/10 text-cyan-400` | `bg-[var(--color-info)]/10 text-[var(--color-info)]` |
| `won` | `border-emerald-500/30 bg-emerald-500/10 text-emerald-400` | `bg-[var(--color-success)]/10 text-[var(--color-success)]` |
| `lost` | `border-red-500/30 bg-red-500/10 text-red-400` | `bg-[var(--color-danger)]/10 text-[var(--color-danger)]` |
| `archived` | `border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] text-[...]` | `bg-[var(--color-bg-elevated)] text-[var(--color-text-tertiary)]` |

---

## 4. Landing Pages (`src/components/landing/`)

| File | Change |
|---|---|
| `Pricing.tsx` | Featured tier border removed; replaced with `scale-105` + elevated background |
| `SampleReportSection.tsx` | Section/panel borders removed |
| `SamplePitchSection.tsx` | Section borders removed |
| `LandingHero.tsx` | Hero panel border removed |
| `QuickAuditSection.tsx` | Error banner `border border-[var(--color-danger)]/20` removed |
| `LandingScrollNav.tsx` | Nav border removed |

---

## 5. Auth Pages (`src/app/(auth)/`)

| File | Change |
|---|---|
| `login/page.tsx` | Google OAuth button border removed; hover gated with `[@media(hover:hover)]` |
| `signup/page.tsx` | Same as login |
| `login/loading.tsx` | Auth card skeleton border removed |
| `signup/loading.tsx` | Same |

---

## 6. Dashboard Shell

| File | Change |
|---|---|
| `settings/loading.tsx` | Danger zone border removed; replaced with `bg-[var(--color-danger)]/8` |
| `radar/loading.tsx` | Skeleton container border removed |
| `templates/loading.tsx` | Skeleton container border removed |
| `radar/page.tsx` | "Back to Dashboard" link border removed |
| `templates/page.tsx` | Same |
| `radar/error.tsx` | `bg-red-500/10 text-red-400` → `--color-danger` tokens |
| `templates/error.tsx` | Same |
| `not-found.tsx` | `border border-transparent` removed from ghost link; hover gated |

---

## 7. Discover Page (`src/app/dashboard/discover/`)

| File | Change |
|---|---|
| `components/ResultCard.tsx` | Score ring: `border-2` + color borders → `bg-[color]/12` tonal circles; spinner `border-red-500` → `--color-danger`; "View" link border removed |
| `components/SaveSearchDialog.tsx` | Cancel button border removed (form inputs kept) |
| `components/EmptyState.tsx` | Border removed |

---

## 8. Leads Page (`src/app/dashboard/leads/`)

| File | Change |
|---|---|
| `components/LeadActionCell.tsx` | View/audit/send link borders → tonal bg; retry `red-500` → `--color-danger`; `text-red-400` → token; hover gated |
| `components/LeadsFilterBar.tsx` | Filter chip active/inactive borders → tonal elevation; search input kept |
| `components/LeadsKPIStrip.tsx` | Card border removed; `hover:border` → `[@media(hover:hover)]:hover:bg-[...]/10` |
| `components/LeadsMobileCards.tsx` | Container border removed; "Load more" border removed; bulk FAB perimeter border removed |
| `components/LeadsTable.tsx` | Table container border removed; pagination borders → tonal hover |
| `components/LeadsEmptyState.tsx` | "Find leads" link border removed |

---

## 9. Lead Detail Pages (`src/app/dashboard/leads/[id]/`)

| File | Change |
|---|---|
| `components/AIQuotaBanner.tsx` | All `text-red-400`, `text-amber-400/500`, `bg-purple-500/*` → design tokens; hover gated |
| `components/QuotaErrorBanner.tsx` | `text-amber-400`, `text-amber-500/80` → `--color-warning` |
| `components/LeadOutreachSection.tsx` | Error banner border removed |
| `components/PitchCard.tsx` | Error banner border removed |
| `components/ImpactPill.tsx` | Borders removed from all impact levels |
| `components/LeadHeaderStrip.tsx` | Borders removed |
| `components/DesignErrorBanner.tsx` | Border removed |
| `components/BusinessEditPanel.tsx` | `text-red-400` → `--color-danger` |
| `components/social-opportunity-page.tsx` | Borders removed |
| `components/no-digital-presence-page.tsx` | Borders removed |
| `components/opportunity-score-explanation.tsx` | Borders removed |
| `page.tsx` | `text-red-400` error text → `--color-danger` |

---

## 10. Pipeline Page (`src/app/dashboard/pipeline/`)

| File | Change |
|---|---|
| `components/CardActionsMenu.tsx` | Dropdown container border removed; cancel chip border removed; `text-red-500` → token; delete confirm `bg-red-500 hover:bg-red-600` → `--color-danger`; `hover:bg-red-500/10` → token + gated hover |

---

## 11. Pitches Page (`src/app/dashboard/pitches/`)

- `page.tsx`: delete menu `hover:bg-red-500/10` → `[@media(hover:hover)]:hover:bg-[var(--color-danger)]/10`

---

## 12. Audit Page (`src/app/dashboard/audit/`)

| File | Change |
|---|---|
| `components/AuditResultsPanel.tsx` | `text-amber-400`, `text-red-400` → design tokens |
| `components/ReviewCompleteActions.tsx` | `text-red-400` → `--color-danger` |
| `components/ExampleReportModal.tsx` | Modal border removed |

---

## 13. Settings Page (`src/app/dashboard/settings/`)

`page.tsx`:
- `TIER_COLORS`: `bg-blue-500/12 text-blue-400` → `--color-info`; `bg-purple-500/12 text-purple-400` → `--badge-indigo-*`; `bg-amber-500/12 text-amber-400` → `--color-warning`
- Danger Zone: `border-y border-red-500/20 lg:bg-red-500/5` → `bg-[var(--color-danger)]/8`; icon `bg-red-500/10 text-red-400` → tokens
- All `text-red-400` error messages → `--color-danger`
- Confirm-input `focus:border-red-400` → `focus:border-[var(--color-danger)]`

---

## 14. Share Page (`src/app/share/[token]/`)

`share-report-client.tsx`:
- URL display row border removed
- All 5 section card `border border-[var(--color-border-subtle)]` removed
- Design issue item borders removed
- `ImpactPill` border classes removed
- Empty-state score circle `border-2 border-[var(--color-border-subtle)]` → bg only

---

## 15. Admin Pages (`src/app/admin/`)

| File | Change |
|---|---|
| `layout.tsx` | "Internal" badge: `border border-red-400/40 text-red-400` → `bg-[var(--color-danger)]/10 text-[var(--color-danger)]` |
| `scoring-audit/page.tsx` | `text-red-400` → `--color-danger` |
| `scoring-audit/scoring-audit-client.tsx` | `flagBg()`: border classes removed, raw colors → tokens; `flagIcon()`: raw colors → tokens; severity/impact badge spans: `border-*` + raw colors → tonal bg + tokens; all `rounded-lg` → `--radius-sm`; all `rounded-xl` → `--radius-md`; bare `rounded` → `--radius-sm`; warn states → tokens; row highlight `bg-amber-500/[0.03]` → `--color-warning` |

---

## 16. Other Components

| File | Change |
|---|---|
| `components/legal/LegalPage.tsx` | "Jump to section" button border removed; hover gated |
| `components/filters/FilterPanel.tsx` | `rounded-t-2xl` → `rounded-t-[var(--radius-md)]`; reset button `hover:text-red-400` → token + gated hover |
| `components/auth/AuthCard.tsx` | Border removed |
| `components/auth/OpportunityPreviewCard.tsx` | Borders removed |
| `components/CookieConsent.tsx` | Border removed |

---

## 17. CLAUDE.md

Updated Rule K, the Global Design Rules section, and the Code Review Checklist to document:
- Full border permission taxonomy (only focus rings, form inputs, error states)
- Hardcoded opacity border ban (`border-white/X`, `border-black/X`, raw rgba)
- Nested perimeter border ban
- PR review checklist items for ongoing enforcement

---

## Stats

| Metric | Value |
|---|---|
| Files changed | 83 |
| TypeScript errors | 0 |
| Remaining `border border-[var(...)]` in codebase | Form inputs only (all have `focus:border-`) |
| Remaining raw Tailwind colors | 0 |
| Remaining forbidden radius classes (`rounded-lg/xl/2xl/3xl`) | 0 |
