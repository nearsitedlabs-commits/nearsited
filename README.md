# Nearsited — AI Redesign Opportunity Intelligence

**Find local businesses with weak websites. Audit their performance. Analyse their design. Generate a personalised pitch. All in under 2 minutes.**

Nearsited is a **prospecting intelligence platform** built for web design agencies. It automates the entire business-development workflow: from discovering local businesses with poor web presence, to gathering hard evidence of their problems, to generating a personalised cold outreach pitch backed by real data.

---

## Magic Workflow

```
+ New Search → city + business type + radius
  → Discover 20–60 businesses, classified by web presence
  → Open a lead → Lead Detail
      → Screenshot + 6 scores (Performance, SEO, Mobile, UX/Design, Trust, Overall)
      → Top issues with point deductions + projection ("could reach X+")
      → AI Opportunity Summary (3–5 bullets)
      → AI Generated Pitch — tone/length adjustable, cites real numbers
      → Export: PDF Report / Copy Pitch / Share Link
  → Add to Pipeline → track to Won (auto-added on first audit)
```

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16.2.6 (App Router, Turbopack) |
| **Language** | TypeScript (strict) |
| **Styling** | Tailwind CSS v4 (light theme, indigo-600 accent) |
| **Database** | Supabase (Postgres 15 + Auth + Storage) |
| **AI** | Gemini 3.5 Flash (vision + pitch generation) |
| **Screenshots** | ScreenshotOne |
| **APIs** | Google Places, Geocoding, PageSpeed Insights |
| **PDF** | jsPDF |
| **Deploy** | Vercel (Runtime A) |

## Getting Started

```bash
# 1. Install dependencies
cd nearsited
npm install

# 2. Set up environment variables
# Create .env.local with:
#   NEXT_PUBLIC_SUPABASE_URL=
#   NEXT_PUBLIC_SUPABASE_ANON_KEY=
#   SUPABASE_SERVICE_ROLE_KEY=
#   GOOGLE_PLACES_API_KEY=
#   GEMINI_API_KEY=
#   SCREENSHOT_API_KEY=

# 3. Run database migrations
# Run the SQL from docs/SCHEMA.md in the Supabase SQL Editor

# 4. Start the dev server
npm run dev

# 5. Open http://localhost:3000
```

## Project Structure

```
nearsited/
├── CLAUDE.md                    # Master rules for AI coding assistants
├── docs/
│   ├── AGENTS.md                # Next.js agent rules
│   ├── ARCHITECTURE.md          # System architecture (two runtimes)
│   ├── BUSINESS_GTM_STRATEGY.md # Go-to-market strategy
│   ├── CONVENTIONS.md           # Coding conventions + decisions log
│   ├── DESIGN_SYSTEM.md         # Design system specification
│   ├── PRD.md                   # Product requirements
│   ├── SCHEMA.md                # Database schema + migrations
│   └── reference/               # Brand guide + design references
├── src/
│   ├── app/
│   │   ├── (auth)/              # Login, signup, OAuth callback
│   │   ├── api/
│   │   │   ├── discover/        # Google Places search + enrichment
│   │   │   ├── audit/           # PageSpeed Insights audit
│   │   │   ├── analyze-design/  # ScreenshotOne + Gemini vision
│   │   │   ├── pitch/           # Gemini pitch generation
│   │   │   ├── pipeline/        # Pipeline CRUD
│   │   │   ├── saved-searches/  # Saved territory searches
│   │   │   ├── share/           # Share link token management
│   │   │   └── export/pdf/      # PDF report generation
│   │   ├── dashboard/
│   │   │   ├── page.tsx         # Dashboard home
│   │   │   ├── leads/           # Leads table + Lead Detail
│   │   │   ├── discover/        # Business discovery search
│   │   │   ├── pipeline/        # Pipeline management
│   │   │   ├── audit/           # Standalone URL audit
│   │   │   ├── pitches/         # Saved pitches list
│   │   │   ├── settings/        # User settings
│   │   │   └── layout.tsx       # Sidebar navigation layout
│   │   └── middleware.ts        # Auth guard
│   ├── lib/
│   │   ├── supabase/            # Admin, server, browser clients
│   │   ├── types.ts             # Canonical enums + classifyWebsite()
│   │   ├── scoring.ts           # Score formulas
│   │   └── data/                # Cities, business types
│   └── components/ui/           # Shared UI components (Button, Card, Badge, etc.)
└── scripts/                     # Migrations, data downloads
```

## Features

### V1 (Live)
- Google Places discovery + website classification (5 statuses)
- Performance audit (PageSpeed mobile + desktop, 7-day cache)
- Design analysis (ScreenshotOne + Gemini 3.5 Flash vision, 7-day cache)
- 6-core scoring model (Performance, SEO, Mobile, UX/Design, Trust, Overall)
- Lead Detail: pipeline status dropdown, Mobile/Desktop reactive scores, expanded Core Web Vitals with colour indicators
- Pitch generation (6 lead-type branches, tone/length, cites real audit data, clipboard copy)
- Share Link (creates public share token + copies URL to clipboard)
- Auto-pipeline on first audit (sets status → "analysed" automatically)
- Quick Site Audit standalone (step-by-step progress checklist, sessionStorage persistence, plain-English summaries)
- Pipeline management (7 stages, optimistic updates)
- PDF audit report export
- Persistent sidebar navigation + light theme (indigo-600)
- NDJSON streaming for long-running routes (discover, audit, analyze-design)

### V2 (Planned)
- UX interaction analysis (Playwright + queue worker + Supabase Storage)
- Radar/decay monitoring (scheduled rescans)
- Competitor intelligence
- AI redesign mockups
- Stripe billing + credit enforcement
- Email sending in-product

## Scoring

| Score | Source | Formula |
|---|---|---|
| Performance | PageSpeed desktop | `categories.performance.score × 100` |
| SEO | PageSpeed desktop | `categories.seo.score × 100` |
| Mobile | PageSpeed mobile | `categories.performance.score × 100` |
| UX/Design | Gemini vision | `(modernity+readability+cta+hierarchy)/4 × 10` |
| Trust | Gemini vision | `trust × 10` |
| Overall | computed | `perf·0.25 + seo·0.15 + mobile·0.25 + uxdesign·0.20 + trust·0.15` |

## Documentation

See the [`docs/`](nearsited/docs/) directory for detailed documentation. [`CLAUDE.md`](nearsited/CLAUDE.md) contains the canonical project rules used by AI coding assistants and is auto-loaded every Claude Code session.

| Document | Description |
|---|---|
| [`CLAUDE.md`](nearsited/CLAUDE.md) | Master rules, enums, API references, build status — auto-loaded by Claude Code |
| [`docs/PRD.md`](nearsited/docs/PRD.md) | Product requirements and page specifications |
| [`docs/ARCHITECTURE.md`](nearsited/docs/ARCHITECTURE.md) | Two-runtime architecture, stack, API routes |
| [`docs/SCHEMA.md`](nearsited/docs/SCHEMA.md) | Database schema, enums, migrations (authoritative) |
| [`docs/CONVENTIONS.md`](nearsited/docs/CONVENTIONS.md) | Coding conventions, anti-patterns, decisions log |
| [`docs/DESIGN_SYSTEM.md`](nearsited/docs/DESIGN_SYSTEM.md) | Design system, tokens, component standards |
| [`docs/BUSINESS_GTM_STRATEGY.md`](nearsited/docs/BUSINESS_GTM_STRATEGY.md) | Market, positioning, pricing, growth |

Built by [Again Labs](https://againlabs.com).
