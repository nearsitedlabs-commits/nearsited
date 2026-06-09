# Nearsited — Find businesses that need websites

**Find local businesses with weak websites. Audit their performance. Analyse their design. Generate a personalised pitch. All in under 2 minutes.**

Nearsited finds local businesses with weak websites or no website at all, shows you exactly what's wrong, and writes the pitch — so agencies close redesign deals in minutes, not hours.

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
| **Styling** | Tailwind CSS v4 (dark theme, near-black navy #0a0e12, sage green accent #8A9777) |
| **Database** | Supabase (Postgres 15 + Auth + Storage) |
| **AI** | Gemini 2.5 Flash (vision + pitch generation) |
| **Screenshots** | ScreenshotOne |
| **APIs** | Google Places, Geocoding, PageSpeed Insights |
| **PDF** | jsPDF |
| **Deploy** | Vercel (Runtime A) |

## Getting Started

```bash
# 1. Install dependencies
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
nearsited/                      # (c:/Projects/nearsited)
├── CLAUDE.md                    # Master rules for AI coding assistants
├── docs/
│   ├── ARCHITECTURE.md          # System architecture (two runtimes)
│   ├── CONVENTIONS.md           # Coding conventions + decisions log
│   ├── DESIGN_SYSTEM.md         # Design system specification
│   ├── DISCOVER_PAGE_LOGIC.md   # Discover page filter/sort logic
│   ├── GTM.md                   # Go-to-market strategy
│   ├── PRD.md                   # Product requirements
│   └── SCHEMA.md                # Database schema + migrations
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
- Performance audit (PageSpeed mobile + desktop, 7-day DB cache)
- Design analysis (ScreenshotOne + Gemini 2.5 Flash vision, 7-day DB cache)
- 6-core scoring model (Performance, SEO, Mobile, UX/Design, Trust, Overall) + opportunity scoring
- Lead Detail: pipeline status dropdown, Mobile/Desktop reactive scores, expanded Core Web Vitals with colour indicators, toast system
- Pitch generation (6 lead-type branches, tone/length/focus, cites real audit data, clipboard copy)
- Share Link (POST /api/share → creates token + copies URL to clipboard)
- Auto-pipeline on first audit (sets status → "analysed" automatically)
- Opportunity Review standalone (step-by-step progress checklist, sessionStorage persistence, plain-English summaries, ephemeral pitch generation)
- Pipeline management (7 canonical stages, optimistic updates)
- PDF audit report export (jsPDF)
- Persistent sidebar navigation (7 items, no Coming Soon section) + dark theme (sage green accent)
- NDJSON streaming for long-running routes (discover, audit, analyze-design)
- Saved searches (territories CRUD via /api/saved-searches)
- 3 parallel Nearby Search queries per discover run (keyword, keyword+type, 1.5×radius)

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

See the [`docs/`](docs/) directory for detailed documentation. [`CLAUDE.md`](CLAUDE.md) contains the canonical project rules used by AI coding assistants and is auto-loaded every Claude Code session.

| Document | Description |
|---|---|
| [`CLAUDE.md`](CLAUDE.md) | Master rules, enums, API references, build status — auto-loaded by Claude Code |
| [`docs/PRD.md`](docs/PRD.md) | Product requirements and page specifications |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Two-runtime architecture, stack, API routes |
| [`docs/SCHEMA.md`](docs/SCHEMA.md) | Database schema, enums, migrations (authoritative) |
| [`docs/CONVENTIONS.md`](docs/CONVENTIONS.md) | Coding conventions, anti-patterns, decisions log |
| [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) | Design system, tokens, component standards |
| [`docs/GTM.md`](docs/GTM.md) | Market, positioning, pricing, growth |

Built by [Again Labs](https://againlabs.com).
