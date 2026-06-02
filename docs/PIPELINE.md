# Nearsited Pipeline System — Complete Documentation

**Version:** v1 (June 2026) · **Last Updated:** June 2, 2026

---

## Table of Contents

1. [Overview](#overview)
2. [Pipeline Statuses](#pipeline-statuses)
3. [Database Schema](#database-schema)
4. [API Routes](#api-routes)
5. [UI Locations & Buttons](#ui-locations--buttons)
6. [Add to Pipeline — Button Behavior](#add-to-pipeline--button-behavior)
7. [Pipeline Flow](#pipeline-flow)
8. [Code Implementation](#code-implementation)

---

## Overview

The **pipeline system** in Nearsited tracks the lifecycle of every business opportunity from discovery through deal closure. It is the core mechanism for sales funnel management.

**What it does:**
- Stores lead status as they move through your sales workflow
- Enables bulk tracking across discovered opportunities
- Surfaces pipeline metrics on the dashboard (funnel chart)
- Allows filtering and sorting by pipeline stage
- Supports RLS (row-level security) — each user only sees their own pipeline

**Who uses it:**
- Agency reps discovering businesses and tracking outreach
- Account managers moving leads through stages (Contacted → In Conversation → Won)
- Dashboard viewers monitoring conversion rates via the pipeline funnel

---

## Pipeline Statuses

All valid statuses are defined once in [`src/lib/types.ts`](../src/lib/types.ts) and referenced via the labels map in [`src/lib/ui-constants.ts`](../src/lib/ui-constants.ts).

| Status | Label | Color | Meaning |
|---|---|---|---|
| `new_lead` | New Lead | Gray (`--pipeline-new`) | Just added to pipeline; not yet analyzed or contacted |
| `analysed` | Analysed | Blue (`--pipeline-analysed`) | Website audit + design analysis complete; ready for pitch |
| `pitch_generated` | Pitch Generated | Indigo (`--pipeline-pitch`) | AI pitch created and ready to send *(currently unused in v1)* |
| `contacted` | Contacted | Amber (`--pipeline-contacted`) | Initial outreach email sent |
| `in_conversation` | In Conversation | Blue (`--pipeline-conversation`) | Prospect replied; ongoing discussion |
| `won` | Won | Green (`--pipeline-won`) | Deal closed / project signed |
| `lost` | Lost | Red (`--pipeline-lost`) | Opportunity ended (no deal) |

**Canonical enum in code:**
```typescript
export type PipelineStatus = "new_lead" | "analysed" | "pitch_generated" | "contacted" | "in_conversation" | "won" | "lost";
```

**Never invent a status string.** Always use the canonical enum above.

---

## Database Schema

### Table: `pipeline`

Stores one row per business–user pair once a business enters the funnel.

```sql
create table public.pipeline (
  id         uuid primary key default extensions.uuid_generate_v4(),
  user_id    uuid references public.profiles(id) on delete cascade,
  business_id uuid references public.businesses(id) on delete cascade,
  status     text default 'new_lead',           -- one of the canonical statuses (§2)
  notes      text,                             -- optional user notes
  created_at timestamptz default now(),        -- timestamp when added to pipeline
  updated_at timestamptz default now()         -- last status change
);

-- Foreign keys
alter table public.pipeline
  add constraint fk_pipeline_user foreign key (user_id) references public.profiles(id) on delete cascade,
  add constraint fk_pipeline_business foreign key (business_id) references public.businesses(id) on delete cascade;

-- Row-level security
alter table public.pipeline enable row level security;

create policy "users see own pipeline" on public.pipeline
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
```

**Key constraints:**
- Each `(user_id, business_id)` pair is **unique** — a business can only be added to a user's pipeline once
- Deleting a user cascades and deletes their entire pipeline
- Deleting a business cascades and removes it from all pipelines

---

## API Routes

### POST `/api/pipeline` — Add to Pipeline

**Purpose:** Create a new pipeline entry for a business.

**Request:**
```json
{
  "businessId": "uuid-string",
  "website": "https://example.com",
  "audit": { /* optional audit data */ },
  "design": { /* optional design data */ }
}
```

**Parameters:**
- `businessId` (optional): ID of an existing business. If provided, used directly.
- `website` (optional): URL. If no `businessId`, looks up existing business by URL or creates a new one.
- `audit`, `design` (optional): Analysis results (used only when creating a new business record).

**Response on success:**
```json
{
  "success": true,
  "pipeline_id": "uuid-string"
}
```

**Response if already in pipeline:**
```json
{
  "success": false,
  "message": "Already in pipeline"
}
```

**Error responses:**
- `400` — Missing `businessId` or `website`
- `401` — Not authenticated
- `500` — Database error

**What it does internally:**
1. Authenticate user via session
2. If `businessId` provided → use directly; otherwise look up business by `website`
3. If business doesn't exist → create new `businesses` row with name (parsed from URL) and scores
4. Check if `(user_id, business_id)` already exists in `pipeline`
5. If exists → return "Already in pipeline" (idempotent)
6. If not → INSERT new row with `status = 'new_lead'`
7. Return new `pipeline_id`

**Called from:**
- [Discover page](../src/app/dashboard/discover/page.tsx#L634) — `handleAddToPipeline()`
- [Lead detail page](../src/app/dashboard/leads/[id]/lead-detail-client.tsx#L419) — auto-add on first audit

---

### PATCH `/api/pipeline` — Update Pipeline Status

**Purpose:** Move a lead through stages (change status).

**Request:**
```json
{
  "businessId": "uuid-string",
  "status": "contacted",
  "pipelineId": "uuid-string"  // alternative to businessId
}
```

**Parameters:**
- `businessId` OR `pipelineId` (one required): Which row to update
- `status` (required): New status value (must be one of the canonical enum)

**Response on success:**
```json
{
  "success": true
}
```

**Response on upsert (create if not found):**
```json
{
  "success": true,
  "pipeline_id": "uuid-string"
}
```

**Error responses:**
- `400` — Missing or invalid status
- `401` — Not authenticated
- `404` — Pipeline record not found (if using `pipelineId`)
- `500` — Database error

**What it does internally:**
1. Validate `status` is in canonical enum
2. Authenticate user
3. Attempt UPDATE with `status` and update `updated_at`
4. If update succeeds → return success
5. If no rows updated AND `businessId` provided → INSERT new row with the requested status (upsert behavior)
6. If no rows updated AND only `pipelineId` provided → return 404 (record doesn't exist)

**Called from:**
- [Lead detail — pipeline dropdown](../src/app/dashboard/leads/[id]/lead-detail-client.tsx#L320) — `handlePipelineChange()`
- [Social opportunity page — pipeline dropdown](../src/app/dashboard/leads/[id]/components/social-opportunity-page.tsx#L58)
- [No digital presence page — pipeline dropdown](../src/app/dashboard/leads/[id]/components/no-digital-presence-page.tsx#L54)

---

### DELETE `/api/pipeline` — Remove from Pipeline

**Purpose:** Permanently delete a pipeline entry (untrack a lead).

**Request:**
```json
{
  "businessId": "uuid-string",
  "pipelineId": "uuid-string"  // alternative
}
```

**Parameters:**
- `businessId` OR `pipelineId` (one required): Which row(s) to delete

**Response on success:**
```json
{
  "success": true
}
```

**Error responses:**
- `400` — Missing both `businessId` and `pipelineId`
- `401` — Not authenticated
- `500` — Database error

**What it does internally:**
1. Authenticate user
2. Build query: `DELETE FROM pipeline WHERE user_id = ? AND (business_id = ? OR id = ?)`
3. Execute delete
4. Return success (even if 0 rows deleted — idempotent)

**Called from:**
- [Discover page](../src/app/dashboard/discover/page.tsx#L672) — `handleRemoveFromPipeline()`
- Button: "Remove" on businesses already in pipeline

---

## UI Locations & Buttons

### 1. **Discover Page** (`/dashboard/discover`)

**Location:** Far right of each business result row

**Buttons (mutually exclusive):**
- **"+ Add"** — Add business to pipeline
- **"Removing..."** — Loading state during DELETE
- **"Remove"** — Remove business from pipeline (shown if already in pipeline)

**Implementation:** [src/app/dashboard/discover/page.tsx](../src/app/dashboard/discover/page.tsx#L1435-L1470)

**State tracking:**
- `pipelineIds` — Set of all business IDs currently in pipeline (restored from session storage on mount)
- `pipelineLoadingId` — UUID of business being added/removed (loading indicator)
- `isInPipeline = pipelineIds.has(business.id)` — Determines which button to show

**Session storage:**
- Key: `nearsited_discover_pipeline`
- Value: Array of business IDs in pipeline
- Used to restore pipeline set on page reload (client-side only; doesn't persist across sessions without DB sync)

---

### 2. **Lead Detail Page** (`/dashboard/leads/[id]`)

**Locations:**
- **Header action bar** — Pipeline status dropdown + "Add to Pipeline" button
- **Overview tab** — Same dropdown + button

**Elements:**
- **Dropdown** (if `currentPipelineStatus` exists): Shows all 7 statuses; onChange triggers PATCH
- **"Add to Pipeline" button** (if `!currentPipelineStatus`): Calls PATCH with `status: 'new_lead'`

**Implementation:** 
- [lead-detail-client.tsx](../src/app/dashboard/leads/[id]/lead-detail-client.tsx#L172) — State: `currentPipelineStatus`
- [Line 320](../src/app/dashboard/leads/[id]/lead-detail-client.tsx#L320) — `handlePipelineChange()` function
- [Line 723](../src/app/dashboard/leads/[id]/lead-detail-client.tsx#L723) — Dropdown in overview
- [Line 931](../src/app/dashboard/leads/[id]/lead-detail-client.tsx#L931) — Dropdown in header actions

**Auto-add behavior:**
- On first successful audit (no prior `audited_at`), if business not in pipeline → auto-add with status `analysed`
- [Line 417](../src/app/dashboard/leads/[id]/lead-detail-client.tsx#L417) — Auto-add logic
- Fire-and-forget (no error handling shown to user; only logged)
- Toast: "Added to pipeline automatically"

---

### 3. **Social Opportunity Page** (`/dashboard/leads/[id]` — tab for social-only businesses)

**Location:** Status section

**Elements:**
- **Dropdown** (if in pipeline): All 7 statuses
- **"Add to Pipeline" button** (if not in pipeline)

**Implementation:** [social-opportunity-page.tsx](../src/app/dashboard/leads/[id]/components/social-opportunity-page.tsx#L186)

---

### 4. **No Digital Presence Page** (`/dashboard/leads/[id]` — tab for no-website businesses)

**Location:** Status section

**Elements:**
- **Dropdown** (if in pipeline): All 7 statuses
- **"Add to Pipeline" button** (if not in pipeline)

**Implementation:** [no-digital-presence-page.tsx](../src/app/dashboard/leads/[id]/components/no-digital-presence-page.tsx#L164)

---

### 5. **Pipeline Page** (`/dashboard/pipeline`)

**Purpose:** Dedicated view of all leads in pipeline; status changes here

**Render:** Table with business name, website status, pipeline status (dropdown), last updated

**Implementation:** [src/app/dashboard/pipeline/page.tsx](../src/app/dashboard/pipeline/page.tsx)

---

### 6. **Dashboard Home** (`/dashboard`)

**Metric cards:**
- "In Pipeline" — count of businesses in any pipeline stage (sum of all counts)

**Pipeline funnel chart:**
- Stacked bar chart showing distribution across all 7 stages
- Colors from `PIPELINE_BAR_COLORS` map

**Implementation:** [dashboard-client.tsx](../src/app/dashboard/dashboard-client.tsx#L31) — `pipelineCounts` prop (counts per stage)

---

### 7. **Leads List** (`/dashboard/leads`)

**Status column:**
- Shows human-readable pipeline status label (e.g. "Contacted", "Won", "Lost")
- Read-only display (not editable from this table)

**Implementation:** [leads/page.tsx](../src/app/dashboard/leads/page.tsx)

---

## Add to Pipeline — Button Behavior

### Discover Page Flow

```
User clicks "+ Add" on a business
    ↓
handleAddToPipeline(businessId, website) called
    ↓
POST /api/pipeline { businessId, website }
    ↓
Server: Check if already in pipeline
    ├─ YES → return { success: false, message: "Already in pipeline" }
    └─ NO → INSERT new row, return { success: true, pipeline_id }
    ↓
Client: On success
    ├─ Add businessId to pipelineIds Set
    ├─ Save to session storage
    ├─ Show toast: "Added to pipeline"
    └─ Button changes from "+ Add" to "Remove"
    ↓
User sees immediate feedback (optimistic update)
```

**Error handling:**
- Network error → toast: "Failed to add to pipeline"
- Already in pipeline → silent; button updates but no error shown
- 500 error → toast: "Failed to add to pipeline" + console error

---

### Lead Detail Page Flow

#### Manual Add (button click)

```
User clicks "Add to Pipeline" button
    ↓
handlePipelineChange("new_lead") called
    ↓
PATCH /api/pipeline { businessId, status: "new_lead" }
    ↓
Server: Try update; if fails, try insert
    ├─ Update success → return { success: true }
    ├─ No rows, insert success → return { success: true, pipeline_id }
    └─ Error → return error
    ↓
Client: On success
    ├─ Set currentPipelineStatus = "new_lead"
    ├─ Button changes to dropdown
    └─ Toast: "Pipeline status updated" (optional)
    ↓
On error
    ├─ Revert currentPipelineStatus to previous value
    └─ Toast: "Failed to update pipeline status"
```

#### Auto-Add (on first audit)

```
User runs "Analyse Opportunity" on a lead
    ↓
Audit + Design Analysis complete
    ↓
Lead detail page detects: isFirstAudit && !currentPipelineStatus
    ↓
fetch("/api/pipeline", { businessId, status: "analysed" })
    ↓
Server: Try update; if fails, try insert
    ↓
Client: On success
    ├─ Set currentPipelineStatus = "analysed"
    └─ Toast: "Added to pipeline automatically"
    ↓
On error: Silently log (no user error shown)
```

---

## Pipeline Flow

### Typical Lead Lifecycle

```
DISCOVER
    ↓ User searches city/business type
    ↓
RESULTS: Businesses shown with "+ Add" buttons
    ↓ User clicks "+ Add" on interesting business
    ↓ Server creates pipeline row with status = "new_lead"
    ↓
PIPELINE: Business now tracked, viewable in pipeline page
    ↓ User clicks business name to view detail
    ↓
LEAD DETAIL: Business opened for review
    ├─ Status shows: "New Lead" (yellow badge)
    ├─ User clicks "+ Analyse Opportunity"
    ├─ Audit + Design Analysis run (streaming progress)
    ├─ On completion: auto-add to pipeline with status = "analysed"
    └─ Status now shows: "Analysed" (blue badge)
    ↓ User reviews scores, issues, generated pitch
    ↓ User clicks dropdown to change status
    ↓
STATUS UPDATES:
    ├─ → "Contacted" (sent first email)
    ├─ → "In Conversation" (prospect replied)
    ├─ → "Won" (deal signed)
    └─ → "Lost" (no deal)
    ↓ Each status change persists to DB via PATCH
    ↓
DASHBOARD: Pipeline funnel chart updates in real-time
    └─ Shows count of leads at each stage
```

---

## Code Implementation

### Key Files

| File | Purpose |
|---|---|
| [`src/app/api/pipeline/route.ts`](../src/app/api/pipeline/route.ts) | POST/PATCH/DELETE handlers |
| [`src/lib/types.ts`](../src/lib/types.ts) | `PipelineStatus` enum definition |
| [`src/lib/ui-constants.ts`](../src/lib/ui-constants.ts) | `PIPELINE_LABELS`, `PIPELINE_STATUSES`, `PIPELINE_BADGE_STYLES`, `PIPELINE_BAR_COLORS`, `PIPELINE_TEXT_COLORS` |
| [`src/app/dashboard/discover/page.tsx`](../src/app/dashboard/discover/page.tsx) | Discover page with add/remove buttons |
| [`src/app/dashboard/leads/[id]/lead-detail-client.tsx`](../src/app/dashboard/leads/[id]/lead-detail-client.tsx) | Lead detail with dropdown + auto-add |
| [`src/app/dashboard/pipeline/page.tsx`](../src/app/dashboard/pipeline/page.tsx) | Pipeline page (table view) |
| [`src/app/dashboard/dashboard-client.tsx`](../src/app/dashboard/dashboard-client.tsx) | Dashboard funnel chart |
| [`src/app/globals.css`](../src/app/globals.css) | CSS variables for pipeline colors |

### Label Constants

All UI labels are defined in [`src/lib/ui-constants.ts`](../src/lib/ui-constants.ts):

```typescript
export const PIPELINE_LABELS: Record<string, string> = {
  new_lead:        "New Lead",
  analysed:        "Analysed",
  pitch_generated: "Pitch Generated",
  contacted:       "Contacted",
  in_conversation: "In Conversation",
  won:             "Won",
  lost:            "Lost",
};

export const PIPELINE_BADGE_STYLES: Record<string, string> = {
  new_lead:        "bg-[var(--bg-surface-2)] text-[var(--pipeline-new)] border border-[var(--border)]",
  analysed:        "bg-[var(--pipeline-analysed-tint)] text-[var(--pipeline-analysed)] border border-[var(--pipeline-analysed)]/30",
  contacted:       "bg-[var(--pipeline-contacted-tint)] text-[var(--pipeline-contacted)] border border-[var(--pipeline-contacted)]/30",
  in_conversation: "bg-[var(--pipeline-conversation-tint)] text-[var(--pipeline-conversation)] border border-[var(--pipeline-conversation)]/30",
  won:             "bg-[var(--pipeline-won-tint)] text-[var(--pipeline-won)] border border-[var(--pipeline-won)]/30",
  lost:            "bg-[var(--pipeline-lost-tint)] text-[var(--pipeline-lost)] border border-[var(--pipeline-lost)]/30",
};

export const PIPELINE_BAR_COLORS: Record<string, string> = {
  new_lead:        "bg-[var(--pipeline-new)]",
  analysed:        "bg-[var(--pipeline-analysed)]",
  contacted:       "bg-[var(--pipeline-contacted)]",
  in_conversation: "bg-[var(--pipeline-conversation)]",
  won:             "bg-[var(--pipeline-won)]",
  lost:            "bg-[var(--pipeline-lost)]",
};
```

### CSS Variables

All colors stored in [`src/app/globals.css`](../src/app/globals.css):

```css
--pipeline-new:          var(--text-tertiary);         /* gray */
--pipeline-analysed:     #60a5fa;                      /* blue */
--pipeline-contacted:    #fbbf24;                      /* amber */
--pipeline-conversation: #60a5fa;                      /* blue */
--pipeline-won:          #4ade80;                      /* green */
--pipeline-lost:         #f87171;                      /* red */

--pipeline-analysed-tint:    rgba(96,165,250,0.15);
--pipeline-contacted-tint:   rgba(251,191,36,0.15);
--pipeline-conversation-tint:rgba(96,165,250,0.15);
--pipeline-won-tint:         rgba(74,222,128,0.15);
--pipeline-lost-tint:        rgba(248,113,113,0.15);
```

### Session Storage (Discover Page)

On discover page, pipeline state is cached in session storage for performance:

```typescript
const STORAGE_KEY_PIPELINE = "nearsited_discover_pipeline";

// On mount
const pipeline = loadFromSession<string[]>(STORAGE_KEY_PIPELINE);
if (pipeline) setPipelineIds(new Set(pipeline));

// On add/remove
saveToSession(STORAGE_KEY_PIPELINE, [...pipelineIds]);
```

**Note:** This is client-side only and does NOT replace the DB. It's used to avoid re-fetching the full pipeline list on every page navigation during a session. On page refresh or new session, the client re-fetches from DB.

---

## Common Patterns

### Pattern 1: Dropdown Status Change

Used in Lead Detail, Social Opportunity, No Digital Presence pages:

```typescript
const handlePipelineChange = useCallback(async (newStatus: string) => {
  const prevStatus = currentPipelineStatus;
  setCurrentPipelineStatus(newStatus);  // Optimistic update

  try {
    const res = await fetch("/api/pipeline", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId: biz.id, status: newStatus }),
    });

    if (!res.ok) {
      setCurrentPipelineStatus(prevStatus);  // Revert on error
      showToast("Failed to update pipeline status");
    }
  } catch (err) {
    setCurrentPipelineStatus(prevStatus);
    showToast("Network error");
  }
}, [biz.id, currentPipelineStatus, showToast]);
```

### Pattern 2: Add to Pipeline (Discover Page)

```typescript
const handleAddToPipeline = useCallback(
  async (businessId: string) => {
    setPipelineLoadingId(businessId);

    try {
      const response = await fetch("/api/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId }),
      });

      const data = await response.json();

      if (data.success === true || data.message === "Already in pipeline") {
        setPipelineIds((prev) => {
          const next = new Set(prev);
          next.add(businessId);
          saveToSession(STORAGE_KEY_PIPELINE, [...next]);
          return next;
        });
        showToast("Added to pipeline");
      } else {
        throw new Error(data?.message ?? "Failed to add to pipeline");
      }
    } catch (err) {
      console.error("Pipeline add error:", err);
      showToast("Failed to add to pipeline");
    } finally {
      setPipelineLoadingId(null);
    }
  },
  [showToast],
);
```

---

## Troubleshooting

| Issue | Cause | Solution |
|---|---|---|
| Business added multiple times | Client-side race condition (multiple clicks) | Debounce button OR disable during loading |
| Pipeline count doesn't match reality | Session storage out of sync with DB | Clear session storage on mount; re-fetch from DB |
| Status dropdown shows old value | Optimistic update failed silently | Add error toast + revert UI |
| "Already in pipeline" shown but button doesn't update | Success response treated as error | Check API response parsing in client |
| Pipeline row deleted but still visible | RLS filtering not working | Verify `user_id` in session matches DB row |

---

## Future (V2) Considerations

- **Bulk status updates** — Move multiple leads at once
- **Pipeline templates** — Save common workflows (e.g., "Audit → Pitch → Contacted")
- **Pipeline automation** — Auto-move to "contacted" when email opened
- **Territories** — Assign leads to team members; track pipeline per account manager
- **Forecasting** — Project revenue based on win rate and pipeline distribution

---

