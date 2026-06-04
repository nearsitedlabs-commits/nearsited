# Nearsited — Vibecode Artifact Refactoring Plan

> **Goal:** Eliminate all vibecode artifacts identified in the audit. Produce a maintainable, AI-friendly codebase where every pattern can be described in one sentence and discovered by an LLM in under 5 seconds.

---

## Table of Contents

1. [Shared Types Layer (Prerequisite for Everything)](#1-shared-types-layer-prerequisite-for-everything)
2. [Eliminate Record\<string, unknown\> Casts (8 files, 19 sites)](#2-eliminate-recordstring-unknown-casts)
3. [Extract Duplicate CountUp Hook](#3-extract-duplicate-countup-hook)
4. [Building the Landing Page from Existing Components](#4-rebuild-landing-page-from-existing-components)
5. [Refactor lead-detail-client.tsx (1492 → ~250 lines)](#5-refactor-lead-detail-clienttsx)
6. [Refactor discover/page.tsx (1741 → ~350 lines)](#6-refactor-discoverpagetsx)
7. [Refactor audit/page.tsx (1415 → ~300 lines)](#7-refactor-auditpagetsx)
8. [Refactor pipeline/page.tsx (465 → ~200 lines)](#8-refactor-pipelinepagetsx)
9. [Fix Silent Catch Patterns](#9-fix-silent-catch-patterns)
10. [Remove Dead Dependencies](#10-remove-dead-dependencies)
11. [Pending DB Migrations](#11-pending-db-migrations)
12. [CLAUDE.md Pattern Rules for Future AI Sessions](#12-claudemd-pattern-rules-for-future-ai-sessions)
13. [Implementation Order & Dependencies](#13-implementation-order--dependencies)

---

## 1. Shared Types Layer (Prerequisite for Everything)

**Rationale:** Every [`Record<string, unknown>`](#2-eliminate-recordstring-unknown-casts) cast exists because no typed Supabase query result type exists. We need dedicated types for each database table that Supabase queries return.

### 1.1 Create [`src/lib/db-types.ts`](src/lib/db-types.ts)

This is the single source of truth for every DB row shape. Every page imports from here instead of using `Record<string, unknown>`.

```typescript
// src/lib/db-types.ts — Auto-discovery target for AI sessions
// Every DB row type lives here. If you need a shape from a Supabase query,
// check here first. If it's missing, add it here.

/** Row shape from `businesses` table SELECT * */
export interface BusinessRow {
  id: string;
  user_id: string;
  name: string;
  business_type: string;
  address: string;
  city: string;
  place_id: string | null;
  website: string | null;
  website_status: string;
  phone: string | null;
  rating: number | null;
  review_count: number | null;
  performance_score: number | null;
  design_score: number | null;
  ux_score: number | null;
  opportunity_score: number | null;
  audited_at: string | null;
  design_analyzed_at: string | null;
  ux_analyzed_at: string | null;
  discovered_at: string;
  flagged_for_outreach: boolean;
  outreach_reason: string | null;
  contact_info: Record<string, unknown> | null;
}

/** Row shape from `audits` table SELECT * */
export interface AuditRow {
  id: string;
  business_id: string;
  user_id: string;
  strategy: "mobile" | "desktop";
  performance_score: number | null;
  seo_score: number | null;
  fcp: string | null;
  lcp: string | null;
  tbt: string | null;
  cls: string | null;
  has_ssl: boolean | null;
  audit_data: Record<string, unknown> | null;
  created_at: string;
}

/** Row shape from `design_analyses` table SELECT * */
export interface DesignAnalysisRow {
  id: string;
  business_id: string;
  user_id: string;
  strategy: "mobile" | "desktop";
  design_score: number | null;
  criteria_scores: Record<string, number> | null;
  issues: unknown[] | null;
  screenshot_url: string | null;
  raw_analysis: string | null;
  analyzed_at: string;
}

/** Row shape from `pipeline` table SELECT */
export interface PipelineRow {
  id: string;
  business_id: string;
  user_id: string;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/** Row shape from `pitches` table SELECT */
export interface PitchRow {
  id: string;
  business_id: string;
  user_id: string;
  subject: string;
  body: string;
  tone: string;
  lead_type: string | null;
  pitch_status: string | null;
  created_at: string;
}

/** Business with joined pipeline status for the leads list page */
export interface LeadListBusiness extends BusinessRow {
  issues_count?: number;
  pipeline_status?: string | null;
}

/** Business with nested pipeline data for the pipeline page */
export interface PipelineBusiness {
  pipeline_id: string;
  pipeline_status: string;
  created_at: string;
  id: string;
  name: string;
  address: string;
  website: string | null;
  phone: string | null;
  website_status: string;
  rating: number | null;
  review_count: number | null;
  city: string;
  business_type: string;
  performance_score: number | null;
}

/** The shape of share page data (fetched server-side via admin client) */
export interface ShareData {
  business: {
    name: string;
    business_type: string;
    address: string;
    city: string;
    website: string | null;
    website_status: string;
    rating: number | null;
    review_count: number | null;
    performance_score: number | null;
    design_score: number | null;
    audited_at: string | null;
    design_analyzed_at: string | null;
  };
  mobileAudit: AuditRow | null;
  desktopAudit: AuditRow | null;
  mobileDesign: DesignAnalysisRow | null;
  desktopDesign: DesignAnalysisRow | null;
}
```

### 1.2 Create [`src/lib/db-queries.ts`](src/lib/db-queries.ts) — Typed Query Helpers

Centralize the repeated Supabase query patterns. Each query returns properly typed data. This kills the `as any` casts in `share/[token]/page.tsx` too.

```typescript
// src/lib/db-queries.ts — Typed query helpers. Import these instead of writing inline supabase calls.

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { BusinessRow, AuditRow, DesignAnalysisRow, PipelineRow, PitchRow } from "@/lib/db-types";

export async function getBusinessById(supabase: ReturnType<typeof createClient>, id: string, userId: string) {
  return supabase.from("businesses").select("*").eq("id", id).eq("user_id", userId).single<BusinessRow>();
}

export async function getLatestAudits(supabase: ReturnType<typeof createClient>, businessId: string) {
  return supabase.from("audits").select("*").eq("business_id", businessId).order("created_at", { ascending: false }).limit(2).returns<AuditRow[]>();
}
// ... etc for each repeated query pattern
```

### 1.3 Dependency

**Step 1 (types) must be done first.** Everything else depends on having these types available to import.

---

## 2. Eliminate Record\<string, unknown\> Casts

### 2.1 Files to Modify (ordered by dependency)

| # | File | Lines | Current Pattern | Replace With |
|---|------|-------|-----------------|--------------|
| 1 | [`src/app/dashboard/leads/[id]/page.tsx`](src/app/dashboard/leads/[id]/page.tsx) | 69, 77, 86-92 | `business as Record<string, unknown>` | `business as BusinessRow` |
| 2 | [`src/app/dashboard/leads/[id]/lead-detail-client.tsx`](src/app/dashboard/leads/[id]/lead-detail-client.tsx) | 49-53, 260-261, 282-283, 292-303, 1099-1148 | Props typed `Record<string, unknown>[]` | Props typed `AuditRow[]` / `DesignAnalysisRow[]` |
| 3 | [`src/app/dashboard/pipeline/page.tsx`](src/app/dashboard/pipeline/page.tsx) | 95, 284, 311 | `row as Record<string, unknown>` | `row as PipelineBusiness` or typed supabase return |
| 4 | [`src/app/dashboard/leads/page.tsx`](src/app/dashboard/leads/page.tsx) | 311-314 | `lead as Record<string, unknown>` | Typed supabase query with `.returns<LeadListBusiness[]>()` |
| 5 | [`src/app/dashboard/discover/page.tsx`](src/app/dashboard/discover/page.tsx) | 161, 609-613 | `auditRows as Record<string, unknown>[]` | `auditRows as AuditRow[]` |
| 6 | [`src/app/dashboard/audit/page.tsx`](src/app/dashboard/audit/page.tsx) | 396, 525, 527 | `JSON.parse(stored) as Record<string, unknown>` | Properly typed session storage schema |
| 7 | [`src/app/share/[token]/page.tsx`](src/app/share/[token]/page.tsx) | 22-26, 69-70 | `Record<string, unknown> \| null` on audits/designs | `AuditRow \| null`, `DesignAnalysisRow \| null` |
| 8 | [`src/app/share/[token]/share-report-client.tsx`](src/app/share/[token]/share-report-client.tsx) | 23-26 | Props `Record<string, unknown> \| null` | Props typed `AuditRow \| null`, `DesignAnalysisRow \| null` |

### 2.2 Pattern Rule

After this change, **no file in `src/` should contain `Record<string, unknown>`** unless it's a genuinely dynamic data structure (e.g., `contact_info: Record<string, unknown>` in the DB type itself).

### 2.3 Dependency

Requires Step 1 (types) to be complete first.

---

## 3. Extract Duplicate CountUp Hook

### 3.1 Create [`src/lib/use-count-up.ts`](src/lib/use-count-up.ts)

Extract the shared animation hook from the 3 current locations:

```typescript
// src/lib/use-count-up.ts — Single count-up animation hook
// Import this instead of duplicating the useEffect/requestAnimationFrame pattern.

import { useEffect, useRef, useState } from "react";

export function useCountUp(value: number, duration = 600) {
  const [display, setDisplay] = useState(0);
  const [done, setDone] = useState(false);
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) { setDisplay(value); setDone(true); return; }
    hasRun.current = true;
    setDone(false);
    const start = performance.now();
    const from = 0;
    const diff = value - from;
    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + diff * eased));
      if (progress >= 1) setDone(true);
      else requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [value, duration]);

  return { display, done };
}

// Variant for null-safe display (used in share-report-client)
export function useCountUpNullable(value: number | null, duration = 800) {
  const [display, setDisplay] = useState(0);
  const done = useRef(false);

  useEffect(() => {
    if (value === null) return;
    if (done.current) { setDisplay(value); return; }
    done.current = true;
    const start = performance.now();
    const from = 0;
    const diff = value - from;
    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + diff * eased));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [value, duration]);

  if (value === null) return { display: null, done: false };
  return { display, done: true };
}
```

### 3.2 Files to Modify

| File | Current Code | Replace With |
|------|-------------|--------------|
| [`src/components/ui/ScoreRing.tsx`](src/components/ui/ScoreRing.tsx:21) | Inline `useCountUp` (lines 21-45) | `import { useCountUp } from "@/lib/use-count-up"` |
| [`src/app/dashboard/dashboard-client.tsx`](src/app/dashboard/dashboard-client.tsx:57) | Inline `CountUp` component (lines 57-78) | `import { useCountUp } from "@/lib/use-count-up"` |
| [`src/app/share/[token]/share-report-client.tsx`](src/app/share/[token]/share-report-client.tsx:31) | Inline `CountUp` (lines 31-54) | `import { useCountUpNullable } from "@/lib/use-count-up"` |

### 3.3 Dependency

Independent — can be done at any time.

---

## 4. Rebuild Landing Page from Existing Components

### 4.1 Problem

[`src/app/page.tsx`](src/app/page.tsx) (1,297 lines) defines **13 inline components** despite 7 corresponding files already existing in [`src/components/landing/`](src/components/landing/). The inline versions are a newer, completely different design from the component files.

### 4.2 Component Inventory

| Inline Component (page.tsx) | Lines | Orphaned Component File | Action |
|----------------------------|-------|------------------------|--------|
| `SectionLabel`, `SectionTitle`, `SectionSub` | 22-45 | — | Extract to [`src/components/landing/SectionHeading.tsx`](src/components/landing/SectionHeading.tsx) |
| `Nav` | 49-73 | [`src/components/landing/Nav.tsx`](src/components/landing/Nav.tsx) | **Rewrite** `Nav.tsx` with inline version's content |
| `AnimatedBackground` | 77-106 | — | Extract to [`src/components/landing/AnimatedBackground.tsx`](src/components/landing/AnimatedBackground.tsx) |
| `Hero` | 108-253 | [`src/components/landing/Hero.tsx`](src/components/landing/Hero.tsx) | **Rewrite** `Hero.tsx` with inline version's content + `AnimatedBackground` |
| `TrustBar` | 257-267 | — | Extract to [`src/components/landing/TrustBar.tsx`](src/components/landing/TrustBar.tsx) |
| `HowItWorks` | 306-348 | [`src/components/landing/HowItWorks.tsx`](src/components/landing/HowItWorks.tsx) | **Rewrite** `HowItWorks.tsx` with inline version's content |
| `WhyNearsited` | 372-453 | — | Extract to [`src/components/landing/WhyNearsited.tsx`](src/components/landing/WhyNearsited.tsx) |
| `SampleReport` | 459-721 | — | Extract to [`src/components/landing/SampleReport.tsx`](src/components/landing/SampleReport.tsx) |
| `SamplePitchSection` | 813-904 | — | Extract to [`src/components/landing/SamplePitchSection.tsx`](src/components/landing/SamplePitchSection.tsx) |
| `AgencyUseCases` | 929-965 | — (but `Comparison.tsx` exists with diff content) | Extract to [`src/components/landing/AgencyUseCases.tsx`](src/components/landing/AgencyUseCases.tsx) |
| `FounderStory` | 969-998 | — | Extract to [`src/components/landing/FounderStory.tsx`](src/components/landing/FounderStory.tsx) |
| `ObjectionsSection` | 1032-1085 | — | Extract to [`src/components/landing/ObjectionsSection.tsx`](src/components/landing/ObjectionsSection.tsx) |
| `ProofBlocks` | 1089-1108 | — | Extract to [`src/components/landing/ProofBlocks.tsx`](src/components/landing/ProofBlocks.tsx) |
| `FAQ` | 1112-1183 | [`src/components/landing/FAQ.tsx`](src/components/landing/FAQ.tsx) | **Rewrite** `FAQ.tsx` with inline version's content (accordion style) |
| `CTA` (FinalCTA) | 1187-1220 | [`src/components/landing/FinalCTA.tsx`](src/components/landing/FinalCTA.tsx) | **Rewrite** `FinalCTA.tsx` with inline version's content |
| `Footer` | 1224-1266 | [`src/components/landing/Footer.tsx`](src/components/landing/Footer.tsx) | **Rewrite** `Footer.tsx` with inline version's content |

### 4.3 Accordion Hook Extraction

Both `ObjectionsSection` and `FAQ` use the same `useState<number | null>` accordion pattern. Extract to:

**Create [`src/lib/use-accordion.ts`](src/lib/use-accordion.ts):**

```typescript
import { useState } from "react";

export function useAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const toggle = (index: number) => setOpenIndex(openIndex === index ? null : index);
  return { openIndex, toggle };
}
```

### 4.4 Result

After this step, [`src/app/page.tsx`](src/app/page.tsx) becomes:

```typescript
import Nav from "@/components/landing/Nav";
import Hero from "@/components/landing/Hero";
import TrustBar from "@/components/landing/TrustBar";
import HowItWorks from "@/components/landing/HowItWorks";
import WhyNearsited from "@/components/landing/WhyNearsited";
import SampleReport from "@/components/landing/SampleReport";
import SamplePitchSection from "@/components/landing/SamplePitchSection";
import AgencyUseCases from "@/components/landing/AgencyUseCases";
import FounderStory from "@/components/landing/FounderStory";
import ObjectionsSection from "@/components/landing/ObjectionsSection";
import ProofBlocks from "@/components/landing/ProofBlocks";
import FAQ from "@/components/landing/FAQ";
import Pricing from "@/components/landing/Pricing";
import CTA from "@/components/landing/FinalCTA";
import Footer from "@/components/landing/Footer";

export default function Home() {
  const router = useRouter();
  const navigate = router.push.bind(router);
  return (
    <div className="relative min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
      <Nav navigate={navigate} />
      <main className="pt-20">
        <Hero navigate={navigate} />
        <TrustBar />
        <HowItWorks />
        <WhyNearsited />
        <SampleReport navigate={navigate} />
        <SamplePitchSection navigate={navigate} />
        <AgencyUseCases navigate={navigate} />
        <FounderStory />
        <ObjectionsSection navigate={navigate} />
        <ProofBlocks navigate={navigate} />
        <FAQ />
        <Pricing navigate={navigate} />
        <CTA navigate={navigate} />
        <Footer />
      </main>
    </div>
  );
}
```

This is **~70 lines** instead of 1,297.

### 4.5 Dependency

Independent — can be done at any time. Suggested as step 3 because it's the highest visual impact.

---

## 5. Refactor lead-detail-client.tsx

### 5.1 Current State

[`src/app/dashboard/leads/[id]/lead-detail-client.tsx`](src/app/dashboard/leads/[id]/lead-detail-client.tsx) — **1,492 lines** with 8 inline sections plus all event handlers.

### 5.2 Extraction Plan

| Extracted Component | Approx Lines Saved | Content |
|--------------------|-------------------|---------|
| [`LeadDetailHeader`](src/app/dashboard/leads/[id]/components/lead-detail-header.tsx) | ~80 | Business name, address, pipeline dropdown, audit buttons, contact info |
| [`ScoreOverview`](src/app/dashboard/leads/[id]/components/score-overview.tsx) | ~150 | Score ring, overall/performance/seo/mobile/design/trust scores, desktop/mobile toggle |
| [`CoreWebVitalsCard`](src/app/dashboard/leads/[id]/components/core-web-vitals-card.tsx) | ~120 | FCP/LCP/TBT/CLS display with METRIC_META, technical details collapse |
| [`IssuesSection`](src/app/dashboard/leads/[id]/components/issues-section.tsx) | ~120 | Top issues with point deductions, criteria breakdown |
| [`PitchSection`](src/app/dashboard/leads/[id]/components/pitch-section.tsx) | ~200 | Pitch generation, tone/length/channel controls, copy/share |
| [`HistorySection`](src/app/dashboard/leads/[id]/components/history-section.tsx) | ~80 | Audit/design history timeline |
| [`AnalysisProgressPanel`](src/app/dashboard/leads/[id]/components/analysis-progress-panel.tsx) | ~100 | NDJSON progress step display for running audit/design |
| [`useLeadDetail` hook](src/app/dashboard/leads/[id]/hooks/use-lead-detail.ts) | ~200 | All state management, effects, and handlers extracted from the component |

### 5.3 Architecture

```
src/app/dashboard/leads/[id]/
  page.tsx                           ← server component (keep ~95 lines)
  lead-detail-client.tsx             ← reduced to ~250 lines, composes sub-components
  components/
    lead-detail-header.tsx
    score-overview.tsx
    core-web-vitals-card.tsx
    issues-section.tsx
    pitch-section.tsx
    history-section.tsx
    analysis-progress-panel.tsx
  hooks/
    use-lead-detail.ts               ← all state + effects + handlers
```

### 5.4 Pattern

The hook file [`use-lead-detail.ts`](src/app/dashboard/leads/[id]/hooks/use-lead-detail.ts) exports a single `useLeadDetail()` function that returns all state and callbacks. The client component destructures the hook and passes slices to sub-components. This keeps the component tree flat and testable.

```typescript
// use-lead-detail.ts (conceptual)
export function useLeadDetail(props: Props) {
  // All the state declarations, useEffects, useCallbacks
  return {
    biz, toast, showToast, handleRunAudit, handleRunDesignAnalysis,
    handleGeneratePitch, handlePipelineChange, ...
  };
}

// lead-detail-client.tsx (conceptual)
export default function LeadDetailClient(props: Props) {
  const {
    biz, toast, showToast, handleRunAudit, handleRunDesignAnalysis, ...
  } = useLeadDetail(props);

  return (
    <div>
      <LeadDetailHeader biz={biz} onRunAudit={handleRunAudit} ... />
      <ScoreOverview biz={biz} mobileAudit={...} desktopAudit={...} ... />
      <CoreWebVitalsCard mobileAudit={...} desktopAudit={...} />
      ...
    </div>
  );
}
```

### 5.5 Dependency

Requires Step 1 (types) for properly typed props. The `useCountUp` hook from Step 3 will also be used here (imported from lib).

---

## 6. Refactor discover/page.tsx

### 6.1 Current State

[`src/app/dashboard/discover/page.tsx`](src/app/dashboard/discover/page.tsx) — **1,741 lines**. Contains search UI, NDJSON stream reader, result list, audit/design analysis triggers, and client-side filters all in one file.

### 6.2 Extraction Plan

| Extracted Module | Approx Lines Saved | Content |
|-----------------|-------------------|---------|
| [`useDiscoverStream` hook](src/app/dashboard/discover/hooks/use-discover-stream.ts) | ~300 | NDJSON stream reading, progress tracking, result accumulation logic (shared pattern with audit page) |
| [`useDiscoverState` hook](src/app/dashboard/discover/hooks/use-discover-state.ts) | ~200 | All state declarations, sessionStorage persistence, filter logic |
| [`SearchForm`](src/app/dashboard/discover/components/search-form.tsx) | ~150 | City search, business type select, radius slider, save search, run button |
| [`ResultTable`](src/app/dashboard/discover/components/result-table.tsx) | ~200 | Business list with score rings, website badges, action buttons |
| [`ProgressPanel`](src/app/dashboard/discover/components/progress-panel.tsx) | ~100 | NDJSON stream progress visualization |
| [`FilterBar`](src/app/dashboard/discover/components/filter-bar.tsx) | ~100 | Client-side filter controls (tab filters, search within results) |

### 6.3 Shared Stream Reader

The NDJSON stream reading pattern is duplicated between discover, audit, and lead-detail pages. Extract to:

**Create [`src/lib/read-ndjson-stream.ts`](src/lib/read-ndjson-stream.ts):**

```typescript
// Shared NDJSON stream reader — used by discover, audit, and lead-detail pages
export type NdjsonCallbacks = {
  onProgress?: (step: string, label: string) => void;
  onResult?: (data: Record<string, unknown>) => void;
  onError?: (error: { message: string }) => void;
  onDone?: () => void;
};

export async function readNdjsonStream(
  response: Response,
  callbacks: NdjsonCallbacks
): Promise<void> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const parsed = JSON.parse(line);
        if (parsed.type === "progress") callbacks.onProgress?.(parsed.step, parsed.label);
        else if (parsed.type === "result") callbacks.onResult?.(parsed);
        else if (parsed.type === "error") callbacks.onError?.(parsed);
        else if (parsed.type === "done") callbacks.onDone?.();
      } catch { /* skip malformed */ }
    }
  }
}
```

### 6.4 Architecture

```
src/app/dashboard/discover/
  page.tsx                              ← reduced to ~50 lines
  hooks/
    use-discover-stream.ts              ← uses readNdjsonStream from lib
    use-discover-state.ts
  components/
    search-form.tsx
    result-table.tsx
    progress-panel.tsx
    filter-bar.tsx
```

### 6.5 Dependency

Requires Step 1 (types) + Step 3 (CountUp via ScoreRing).

---

## 7. Refactor audit/page.tsx

### 7.1 Current State

[`src/app/dashboard/audit/page.tsx`](src/app/dashboard/audit/page.tsx) — **1,415 lines**. Contains URL input, NDJSON stream reading, progress checklist, Core Web Vitals display, pitch generation, pipeline management.

### 7.2 Extraction Plan

| Extracted Module | Lines Saved | Content |
|-----------------|-------------|---------|
| [`useAuditStream` hook](src/app/dashboard/audit/hooks/use-audit-stream.ts) | ~300 | NDJSON stream reading, audit + design result accumulation, sessionStorage persistence |
| [`useAuditState` hook](src/app/dashboard/audit/hooks/use-audit-state.ts) | ~150 | State declarations, effect cleanup, error handling |
| [`UrlInput`](src/app/dashboard/audit/components/url-input.tsx) | ~50 | URL input + run button |
| [`ProgressChecklist`](src/app/dashboard/audit/components/progress-checklist.tsx) | ~100 | 9-step progress visualization |
| [`CWVResultsCard`](src/app/dashboard/audit/components/cwv-results-card.tsx) | ~200 | Core Web Vitals results with METRIC_META |
| [`DesignResultsCard`](src/app/dashboard/audit/components/design-results-card.tsx) | ~150 | Design analysis results with issues |
| [`PitchResultCard`](src/app/dashboard/audit/components/pitch-result-card.tsx) | ~100 | Generated pitch display, copy, pipeline save |

### 7.3 Architecture

```
src/app/dashboard/audit/
  page.tsx                          ← reduced to ~50 lines
  hooks/
    use-audit-stream.ts            ← uses shared readNdjsonStream from lib
    use-audit-state.ts
  components/
    url-input.tsx
    progress-checklist.tsx
    cwv-results-card.tsx
    design-results-card.tsx
    pitch-result-card.tsx
```

### 7.4 Dependency

Requires Step 1 (types) + shared `readNdjsonStream` from Step 6.

---

## 8. Refactor pipeline/page.tsx

### 8.1 Current State

[`src/app/dashboard/pipeline/page.tsx`](src/app/dashboard/pipeline/page.tsx) — **465 lines**. Not as large but has the `mapPipelineRow` function that's a prime `Record<string, unknown>` cast example.

### 8.2 Extraction Plan

| Extracted Module | Lines Saved | Content |
|-----------------|-------------|---------|
| [`PipelineTable`](src/app/dashboard/pipeline/components/pipeline-table.tsx) | ~200 | Table rendering, status dropdown, drag handlers |
| [`usePipeline` hook](src/app/dashboard/pipeline/hooks/use-pipeline.ts) | ~150 | Fetch logic, optimistic updates, drag state |

### 8.3 Architecture

```
src/app/dashboard/pipeline/
  page.tsx                          ← reduced to ~50 lines
  hooks/
    use-pipeline.ts
  components/
    pipeline-table.tsx
```

### 8.4 Dependency

Requires Step 1 (types) for `PipelineBusiness` type.

---

## 9. Fix Silent Catch Patterns

### 9.1 Files to Modify

All 3 files use this pattern:

```typescript
.catch(() => { /* silent — background only */ });
```

### 9.2 Fix

Replace with:

```typescript
.catch((err) => {
  console.warn("[REFRESH-RATINGS] Background refresh failed:', err instanceof Error ? err.message : err);
});
```

### 9.3 Files

| File | Line | Purpose |
|------|------|---------|
| [`src/app/dashboard/leads/[id]/lead-detail-client.tsx`](src/app/dashboard/leads/[id]/lead-detail-client.tsx) | 289 | Rating refresh |
| [`src/app/dashboard/leads/[id]/components/no-digital-presence-page.tsx`](src/app/dashboard/leads/[id]/components/no-digital-presence-page.tsx) | 64 | Rating refresh |
| [`src/app/dashboard/leads/[id]/components/social-opportunity-page.tsx`](src/app/dashboard/leads/[id]/components/social-opportunity-page.tsx) | 68 | Rating refresh |

### 9.4 Dependency

Independent — can be done at any time.

---

## 10. Remove Dead Dependencies

### 10.1 Files/Patterns to Check

| Package | File | Why Dead | Confirm Before Removing |
|---------|------|----------|------------------------|
| `axios` | [`package.json`](package.json:28) | Zero `import ... from "axios"` in `src/` | `grep -r "axios" src/` |
| `@anthropic-ai/sdk` | [`package.json`](package.json:14) | Uses Gemini, not Claude | `grep -r "anthropic" src/` |
| `cheerio` | [`package.json`](package.json:29) | Contact info scraping doesn't use cheerio | `grep -r "cheerio" src/` |

### 10.2 Action

1. Confirm zero imports via search
2. `npm uninstall axios @anthropic-ai/sdk cheerio`
3. Run `npm run build` to verify no compilation errors

### 10.3 Dependency

Independent — confirm at end after all other refactoring to avoid accidentally breaking an import.

---

## 11. Pending DB Migrations

### 11.1 Create [`scripts/migrate-vibecode.sql`](scripts/migrate-vibecode.sql)

```sql
-- Migration: contact_info JSONB column + channel column on pitches
-- These were identified as pending in the audit. Both are needed for
-- production features that are already partially coded.

-- 1. Add contact_info JSONB column to businesses (if not exists)
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS contact_info JSONB;

COMMENT ON COLUMN businesses.contact_info IS
  'Cached contact data: { email, phone, fetched_at }. Written by /api/contact-info.';

-- 2. Add channel column to pitches (if not exists)
ALTER TABLE pitches
  ADD COLUMN IF NOT EXISTS channel TEXT NOT NULL DEFAULT 'email';

COMMENT ON COLUMN pitches.channel IS
  'Outreach channel: email, whatsapp. Populated by /api/pitch.';
```

### 11.2 Update [`scripts/run-migrations.mjs`](scripts/run-migrations.mjs)

Add the new migration file to the runner's migration list.

### 11.3 Dependency

Can be run at any time (independent of code changes). But must be done before the channel feature works in the pitch route.

---

## 12. CLAUDE.md Pattern Rules for Future AI Sessions

### 12.1 Additions to [`CLAUDE.md`](CLAUDE.md)

Append these rules to the "Don't Repeat These" section:

```markdown
18. **Never use `Record<string, unknown>` for DB data.** Import from `src/lib/db-types.ts` instead. Every Supabase query result has a typed interface there. Add new types to that file, not inline.

19. **Keep files under ~400 lines.** If a component exceeds this, extract sub-components into `components/` and logic into `hooks/use-*.ts`. Each file should do one thing well.

20. **One count-up hook.** Never inline `useCountUp` logic. Import `useCountUp` or `useCountUpNullable` from `src/lib/use-count-up.ts`.

21. **One NDJSON stream reader.** Never inline `response.body!.getReader()` stream parsing. Import `readNdjsonStream` from `src/lib/read-ndjson-stream.ts`.

22. **One accordion hook.** Never duplicate `useState<number | null>` + toggle logic for accordions/FAQ. Import `useAccordion` from `src/lib/use-accordion.ts`.

23. **Landing page components live in `src/components/landing/`.** If you're adding a new section to the landing page, create a file there and import it in `page.tsx`. Never define landing components inline.

24. **Never silence `.catch()`.** Every caught error must log with a `[COMPONENT]` prefix. Even background tasks can fail — log the error so debugging isn't blind.

25. **Remove dead deps before adding new ones.** Run `npm ls` to check if a package is actually used before installing. If a dep has zero imports across `src/`, uninstall it.
```

### 12.2 Update the "New-Session / New-Task Checklist"

Add this to the checklist template:

```
TYPE PATTERNS: DB types in src/lib/db-types.ts · Hooks in hooks/use-*.ts · Components in components/
LANDING: src/components/landing/ (never inline in page.tsx)
```

---

## 13. Implementation Order & Dependencies

### Phase 0 — Foundation (do first, no deps)

```
Step 1a:  Create src/lib/db-types.ts          ← everyone depends on this
Step 1b:  Create src/lib/db-queries.ts         ← typed query helpers
Step 3:   Create src/lib/use-count-up.ts       ← independent
Step 9:   Create src/lib/use-accordion.ts      ← independent
Step 10:  Create src/lib/read-ndjson-stream.ts ← independent
Step 11a: Create scripts/migrate-vibecode.sql  ← SQL only
```

### Phase 1 — Landing Page (no type deps)

```
Step 4a:  Create src/components/landing/SectionHeading.tsx
Step 4b:  Create src/components/landing/AnimatedBackground.tsx
Step 4c:  Rewrite Hero.tsx, Nav.tsx using inline content
Step 4d:  Create TrustBar.tsx, WhyNearsited.tsx, SampleReport.tsx, SamplePitchSection.tsx,
          AgencyUseCases.tsx, FounderStory.tsx, ObjectionsSection.tsx, ProofBlocks.tsx
Step 4e:  Rewrite FAQ.tsx, FinalCTA.tsx, Footer.tsx using inline content
Step 4f:  Rewrite page.tsx to import all components
```

### Phase 2 — Types Migration (depends on Phase 0)

```
Step 2a:  Fix lead-detail page.tsx casts
Step 2b:  Fix lead-detail-client props and internal casts
Step 2c:  Fix pipeline page.tsx casts (mapPipelineRow + fetch)
Step 2d:  Fix leads page.tsx casts
Step 2e:  Fix discover page.tsx casts
Step 2f:  Fix audit page.tsx casts
Step 2g:  Fix share page.tsx + share-report-client.tsx casts
```

### Phase 3 — Large File Refactoring (depends on Phase 2)

```
Step 5:   Refactor lead-detail-client.tsx
Step 6:   Refactor discover/page.tsx
Step 7:   Refactor audit/page.tsx
Step 8:   Refactor pipeline/page.tsx
```

### Phase 4 — Cleanup (independent, do last)

```
Step 9:   Fix silent catch patterns in 3 files
Step 10:  Remove dead dependencies (axios, @anthropic-ai/sdk, cheerio)
Step 11b: Run DB migration
Step 12:  Update CLAUDE.md with new pattern rules
```

### Dependency Graph

```
Phase 0 (Foundation)
  ├─ Step 1: db-types.ts + db-queries.ts
  ├─ Step 3: use-count-up.ts
  ├─ Step 9: use-accordion.ts
  ├─ Step 10: read-ndjson-stream.ts
  └─ Step 11a: migration SQL file
       │
Phase 1 (Landing) ── no deps on Phase 0
  └─ Step 4: Rewrite landing page components
       │
Phase 2 (Types Migration) ── depends on Phase 0 Step 1
  └─ Step 2: Fix all Record<string, unknown> casts
       │
Phase 3 (File Splitting) ── depends on Phase 2
  ├─ Step 5: lead-detail-client.tsx ← also uses Phase 0 Step 3, 10
  ├─ Step 6: discover/page.tsx      ← also uses Phase 0 Step 10
  ├─ Step 7: audit/page.tsx         ← also uses Phase 0 Step 10
  └─ Step 8: pipeline/page.tsx
       │
Phase 4 (Cleanup) ── independent
  ├─ Step 9:  Fix silent catches
  ├─ Step 10: Remove dead deps
  ├─ Step 11b: Run migration
  └─ Step 12: Update CLAUDE.md
```

---

## Summary of Files to Create

| File | Purpose | Phase |
|------|---------|-------|
| `src/lib/db-types.ts` | Typed DB row interfaces | 0 |
| `src/lib/db-queries.ts` | Typed Supabase query helpers | 0 |
| `src/lib/use-count-up.ts` | Shared count-up animation hook | 0 |
| `src/lib/use-accordion.ts` | Shared accordion toggle hook | 0 |
| `src/lib/read-ndjson-stream.ts` | Shared NDJSON stream reader | 0 |
| `src/components/landing/SectionHeading.tsx` | SectionLabel/Title/Sub components | 1 |
| `src/components/landing/AnimatedBackground.tsx` | Animated background blobs | 1 |
| `src/components/landing/TrustBar.tsx` | Trust badges bar | 1 |
| `src/components/landing/WhyNearsited.tsx` | Comparison/why section | 1 |
| `src/components/landing/SampleReport.tsx` | Tabbed sample report | 1 |
| `src/components/landing/SamplePitchSection.tsx` | Tabbed sample pitch | 1 |
| `src/components/landing/AgencyUseCases.tsx` | Agency/freelancer use cases | 1 |
| `src/components/landing/FounderStory.tsx` | Founder story section | 1 |
| `src/components/landing/ObjectionsSection.tsx` | Objection handling accordion | 1 |
| `src/components/landing/ProofBlocks.tsx` | Early access proof section | 1 |
| `src/app/dashboard/leads/[id]/hooks/use-lead-detail.ts` | Lead detail state/handlers | 3 |
| `src/app/dashboard/leads/[id]/components/lead-detail-header.tsx` | Lead detail header | 3 |
| `src/app/dashboard/leads/[id]/components/score-overview.tsx` | Score display | 3 |
| `src/app/dashboard/leads/[id]/components/core-web-vitals-card.tsx` | CWV card | 3 |
| `src/app/dashboard/leads/[id]/components/issues-section.tsx` | Issues display | 3 |
| `src/app/dashboard/leads/[id]/components/pitch-section.tsx` | Pitch generation UI | 3 |
| `src/app/dashboard/leads/[id]/components/history-section.tsx` | History timeline | 3 |
| `src/app/dashboard/leads/[id]/components/analysis-progress-panel.tsx` | Progress steps | 3 |
| `src/app/dashboard/discover/hooks/use-discover-stream.ts` | Discover NDJSON logic | 3 |
| `src/app/dashboard/discover/hooks/use-discover-state.ts` | Discover state management | 3 |
| `src/app/dashboard/discover/components/search-form.tsx` | Discover search form | 3 |
| `src/app/dashboard/discover/components/result-table.tsx` | Discover results table | 3 |
| `src/app/dashboard/discover/components/progress-panel.tsx` | Discover progress display | 3 |
| `src/app/dashboard/discover/components/filter-bar.tsx` | Discover filters | 3 |
| `src/app/dashboard/audit/hooks/use-audit-stream.ts` | Audit NDJSON logic | 3 |
| `src/app/dashboard/audit/hooks/use-audit-state.ts` | Audit state management | 3 |
| `src/app/dashboard/audit/components/url-input.tsx` | Audit URL input | 3 |
| `src/app/dashboard/audit/components/progress-checklist.tsx` | Audit progress | 3 |
| `src/app/dashboard/audit/components/cwv-results-card.tsx` | Audit CWV results | 3 |
| `src/app/dashboard/audit/components/design-results-card.tsx` | Audit design results | 3 |
| `src/app/dashboard/audit/components/pitch-result-card.tsx` | Audit pitch display | 3 |
| `src/app/dashboard/pipeline/hooks/use-pipeline.ts` | Pipeline state | 3 |
| `src/app/dashboard/pipeline/components/pipeline-table.tsx` | Pipeline table | 3 |
| `scripts/migrate-vibecode.sql` | Pending DB migrations | 0 |
