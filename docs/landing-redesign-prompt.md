# Landing Page Refactor — Professional Quality Pass

## CONTEXT
You are refactoring the Nearsited landing page (src/app/page.tsx and 
src/components/landing/*). The current state is functionally correct but 
visually undisciplined — every section uses the same bordered-card pattern 
(border-[var(--color-border-subtle)]), which makes the page read as 
"shadcn defaults applied to dark mode" instead of "premium B2B tool worth 
$249/mo at the top tier."

Read first:
- CLAUDE.md (design rules)
- docs/audit-2026-06/synthesis/MASTER_FINDINGS.md (current quality state)
- docs/audit-2026-06/systems/borders/PROPOSED_SYSTEM.md (border migration rules)
- src/app/globals.css (current tokens)
- Every file under src/components/landing/

# MANDATORY FIRST STEP
Before reading the rest of this prompt, view CLAUDE.md in full and 
internalize the A–J design rules, token system, border-radius rules, 
component inventory, and mobile rules. The instructions below are 
GENERIC senior-dev heuristics. Where they conflict with CLAUDE.md, 
CLAUDE.md wins — always. Read it first, then map its rules onto 
each section of the plan below before implementing.

## YOUR ROLE
You hold three perspectives at all times:

1. SENIOR FRONTEND ENGINEER (15 years building marketing sites at Linear, 
   Vercel, Stripe). You judge visual discipline, component reuse, animation 
   quality, performance, and accessibility.

2. SAAS FOUNDER (the one paying for hosting and Gemini calls). Every 
   change must justify itself against ICP conversion impact. No polish 
   that doesn't measurably improve trust, comprehension, or activation.

3. ICP — WEB DESIGN FREELANCER / SMALL AGENCY OWNER. The person paying 
   $29-$249/mo. They've evaluated 5+ tools this month. They can spot a 
   templated landing page in 3 seconds. The page must read "this is a 
   tool I'd present to my own clients" not "this is someone's side project."

## QUALITY REFERENCE BAR
Before making any visual decision, reference how these sites handle similar 
elements:
- Linear marketing pages (cards without borders, just elevation)
- Vercel marketing pages (precise typography, restrained motion)
- Stripe product pages (one accent color carrying the entire hierarchy)
- Raycast.com (dark mode landing with no decorative borders anywhere)
- Cron Calendar (warm dark mode + motion design)

If a section of your output would NOT pass a Linear / Vercel design review, 
redo it.

## CORE PRINCIPLE — BORDER REPLACEMENT

**The single most important change: every decorative border on the landing 
page is removed and replaced with one of:**

A. **Tonal background elevation.** Use the existing 4-level background system:
   - `--color-bg-page` (darkest, the page itself)
   - `--color-bg-surface` (cards, sections)
   - `--color-bg-surface-raised` (elevated cards, the highlighted pricing tier)
   - `--color-bg-overlay` (modals, dropdowns)
   
   Grouping comes from background SHIFT, not stroke.

B. **Whitespace + spacing.** Two elements 64px apart don't need a border 
   between them. The space itself is the divider.

C. **Thin horizontal dividers** (1px solid `--color-border-subtle` at 0.04 
   opacity) — ONLY for accordion items, between rows in lists, or between 
   major page sections. Never as a perimeter around a card.

D. **Left accent line** — a 2-3px vertical brand-colored bar on the left 
   edge of a quote, callout, or highlighted card. Conveys "this is 
   important" without boxing the content.

E. **Brand accent outline** — sage-colored border, used ONCE on the 
   landing page: the highlighted pricing tier (Agency / Best Value). 
   Nowhere else.

**Borders are RESERVED for:**
- The highlighted pricing tier
- Focus rings (keyboard navigation)
- Hover states (introduced on hover only, removed on mouse-out)
- Status chips / pills (e.g., "No Website", "20 free analyses")
- Form input fields
- Error states

That's it. If you find yourself adding a border for any other reason, you're 
wrong.

## ANIMATION STRATEGY

Animations carry the "premium" perception more than any other single change. 
But they must be DISCIPLINED. The standard:

**Allowed motion:**
- Section reveal on scroll: opacity 0→1 + translateY 16px→0, 400ms ease-out, 
  triggered via IntersectionObserver at 20% viewport entry
- Sub-element stagger within a section: 80ms delay between siblings
- Hover scale on cards: scale(1.0) → scale(1.012), 150ms ease-out
- Hover brightness on cards: brightness(1.0) → brightness(1.06)
- Score number count-up: 0 → final value over 800ms, ease-out
- The opportunities feed in hero: auto-cycle through 5 leads, 5s per lead, 
  smooth fade between
- AI pitch preview: typewriter effect on first viewport entry, ~40ms per 
  character, plays once
- Button hover/active: 150ms transitions on transform + background
- The pricing card hover: subtle lift (translateY -2px) + brightness

**Forbidden motion:**
- Bouncy easing (no spring physics on UI)
- Infinite-loop animations (except the hero opportunities feed cycle)
- Parallax scrolling
- Decorative particles, blobs, gradients in motion
- "Magic" cursor effects
- Animation longer than 600ms for any UI interaction
- Animation that triggers on every scroll event (use IntersectionObserver 
  ONCE per element)

**Reduced motion:**
Wrap every animation in `useReducedMotion()` from Framer Motion. If 
`prefers-reduced-motion: reduce` is true, set duration to 0 and skip 
translate — only opacity remains.

**Performance:**
- Use `transform` and `opacity` only (GPU-accelerated)
- Use `will-change: transform` ONLY on actively-animating elements, removed 
  after animation completes
- Lazy-load Framer Motion for below-fold sections via dynamic import

## SECTION-BY-SECTION REFACTOR PLAN

### 1. HERO (src/components/landing/LandingHero.tsx)
**Keep:** the headline + subtext + 2 CTAs + trust line structure.

**Change:**
- The opportunities sample card on the right (currently bordered): remove 
  border, replace with `--color-bg-surface-raised` background + subtle 
  inner highlight at top edge. Add a `box-shadow: 0 1px 0 rgba(255,255,255,0.04) 
  inset` to create a single-pixel highlight that suggests elevation without 
  stroking the whole card.
- Auto-cycle through 5 hand-written sample leads every 5 seconds. Smooth 
  crossfade. Pause on hover.
- The AI pitch preview at the bottom of the card: typewriter render on 
  first viewport entry, then static. Each subsequent cycle just swaps content.
- The "OPPORTUNITIES · DUBAI" eyebrow + "Sample" pill stays.
- The lead pills (No Website / Social Only / Weak Website) use the existing 
  status chip styling — those ARE allowed borders (semantic chips).

### 2. QUICK AUDIT MINI (src/components/landing/QuickAuditPreview.tsx or similar)
**Question first:** is this Quick Audit demo earning its place above the 
fold? It adds friction (another input on the page) and competes with the 
hero CTA. Either:
- (a) Make it the PRIMARY hero interaction (replace the static opportunities 
  card with this), OR
- (b) Move it below the workflow section as a "try before you sign up" demo
  
Pick (b) for this refactor — it's currently distracting from the hero CTA.

**Change to the section itself:**
- Remove the bordered card around the result.
- The "89/100 Strong" score: number counts up from 0 on viewport entry.
- The "Want the full picture?" gate: no border, just tonal background step 
  with a left accent line in sage.

### 3. TRUST STRIP (Live discovery · Built by solo founder · 2 minutes)
**Honest question:** "TRUSTED BY AGENCIES WORLDWIDE" with empty dot 
indicators reads as fake social proof — if there are no real logos to show, 
this section is doing harm, not help.

**Recommended change:**
- Kill the "TRUSTED BY AGENCIES WORLDWIDE" line and the dot indicators.
- Keep only the 3 inline trust signals (Live discovery · Built by solo 
  founder · From city search to pitch in 2 minutes).
- Display as horizontal text strip on a slightly raised surface, no border.
- Add subtle horizontal divider lines above and below to mark section.

### 4. WORKFLOW — "Four steps to your next website project"
**Keep:** the 4-step layout. It works.

**Change:**
- The "How opportunity scoring works" callout at the bottom: remove the 
  border around the entire callout AND the 3 score-range cards inside it.
- Replace with: tonal background section, the 3 ranges become inline pills 
  separated by spacing (no card per range).
- Each step row reveals on scroll with 80ms stagger.
- The step number ("01", "02", etc.) — currently italic serif numerals. 
  Consider whether this italic-serif treatment is consistent with the rest 
  of the typography system. If not, normalize to mono digits.

### 5. WHY NEARSITED COMPARISON ("Other tools find bad websites…")
**Critical fix — asymmetric border:**
The "Traditional prospecting" card has a border. The "Nearsited" card does 
NOT. This is the issue Adin flagged. Both must use the same treatment.

**Recommended change:**
- Remove borders from BOTH columns.
- Use tonal backgrounds: both cards on `--color-bg-surface`, same elevation.
- Add a 2px LEFT accent line: red-tinted for Traditional, sage for Nearsited.
- This signals "negative / positive" without boxing either side.

**Four opportunity types row (No Website / Social Only / Platform Only / 
Weak Website):**
- Remove border from each card.
- Use tonal background — but make each card slightly differentiated via a 
  subtle tint matching its dot color (very faint, 4-6% opacity background 
  hue shift).
- The colored dot stays. The type name stays. The tagline must be rewritten 
  to a consistent rhythm — currently mixed (see audit findings).

Pick one tagline pattern:
- All ACTION: "Build them a site / Build them a site / Replace the platform 
  / Redesign their site"
- All VALUE: "Highest ticket / Quick close / Migration deal / Refresh deal"
- All PRIORITY (RECOMMENDED): "Most underserved / Fastest to win / Most 
  replaceable / Most refreshable"

### 6. SAMPLE OPPORTUNITY REPORT (4 tabs)
**Heavy section that could be lighter.** Currently 4 nearly-identical card 
layouts behind 4 tabs.

**Change:**
- Remove the perimeter border around each sample report.
- Replace with `--color-bg-surface-raised` for the active tab's content.
- Tab transition: smooth crossfade (250ms) when switching between Weak/No 
  site/Social Only/Platform Only.
- The "Want to find opportunities like this in your city?" callout at the 
  bottom of each tab: remove border, use left accent line in sage.
- The technical scores collapsible (▶ Technical scores) — verify it 
  actually expands; if not currently functional, wire it up with smooth 
  height transition.

### 7. SAMPLE PITCHES (Every opportunity type gets a tailored pitch)
**Change:**
- Remove the border around the pitch preview card.
- The "Sample pitch" header + "Weak Website" pill + "Ready to send" pill: 
  keep as semantic chips (allowed borders).
- The bottom controls row (Tone: Professional / Regenerate / Copy pitch): 
  integrate as a single controls bar with internal dividers, not 3 separate 
  bordered buttons.
- Tab switching: same crossfade pattern as sample report section.

### 8. WHO IT'S FOR ("Built for agencies that prospect locally")
**Mostly working — this is the cleanest section already.** Minor changes:
- Verify no decorative card borders on the 4 segments (Solo / Small 
  agencies / Design studios / SEO agencies). If present, remove.
- The "White-label shareable reports" pill next to "Small agencies": 
  keep as semantic chip.
- Reveal each segment on scroll with stagger.

### 9. OBJECTIONS ("What's stopping you?")
**Change:**
- Each accordion item currently has a bordered card. Remove the border.
- Use thin horizontal dividers (`border-bottom: 1px solid 
  --color-border-subtle`) BETWEEN items, not perimeters AROUND items.
- The expand arrow: smooth 180deg rotation on open (150ms).
- Open content: smooth height transition (200ms ease-out).

### 10. WHAT IT DOES ("Built for agencies that actually close deals")
**Change:**
- Quote card has a border around it AND a sage left accent line. Remove 
  the border, keep the left accent.
- Three stat tiles (249 / 4 / <2 min): currently bordered. Remove borders.
- Use only typography and generous spacing — let the numbers breathe.
- Add count-up animation on the numeric portions when stats enter viewport.

### 11. FAQ ("Questions about closing deals")
**Same pattern as Objections section.** Remove per-item borders, use 
dividers between rows.

### 12. PRICING ("Start finding clients this week")
**This is THE most important section to get right.** It's where the buy 
decision happens.

**Change:**
- Free Trial, Solo, Scale cards: remove borders. Use `--color-bg-surface`.
- Agency card (Best Value): KEEP the sage border. This is the ONE allowed 
  brand-accent outline on the page.
- Agency card: also add a subtle scale-up (1.02) and slight translateY (-4px) 
  vs the other three. Make it visually dominant.
- The "Best value" pill on Agency: amber background with dark text — verify 
  it doesn't clash with the sage palette. Recommendation: use sage 
  background instead of amber to stay on-brand.
- Monthly/Annual toggle: smooth pill-slide transition (200ms) between states.
- Hover state on each card: brightness 1.06 + translateY -2px.
- The "Get started" button on Agency: more visually weighted (sage filled 
  with white text, bigger padding) than the equivalent on Solo/Scale.

### 13. FINAL CTA ("Your next client is out there, without a website")
**Change:**
- Remove the perimeter border around the entire section.
- Use `--color-bg-surface-raised` as the background to differentiate from 
  the page.
- "Start finding website opportunities today" eyebrow pill stays (semantic).
- "Find your first opportunity" button + "Sign in" button: clear hierarchy 
  (primary filled sage, secondary outlined or tonal).

### 14. FOOTER
**Change:**
- Investigate the floating icon column visible on the right edge in several 
  screenshots. If it's a fixed dashboard sidebar bleeding into the marketing 
  page, that's a layout bug to fix. If it's intentional (a quick-actions 
  rail), move or kill it — it doesn't belong on the marketing page.
- Otherwise, footer structure is fine. Minor: align the "Built by Again 
  Labs · Again Live family of products" text to match the rest of the 
  footer's vertical rhythm.

## NAVIGATION
The sticky top nav appears in several screenshots at unexpected positions 
(overlapping content in Image 5, repositioning in Image 16). Verify the 
sticky behavior is correct: nav should stick to top on scroll, never overlap 
section content. Use `backdrop-filter: blur(12px)` + tonal background at 80% 
opacity for the sticky state.

## TYPOGRAPHY DISCIPLINE PASS

While in here, verify the typography system on the landing:
- One display weight for all section headlines (consistent across sections)
- One body weight (consistent)
- One eyebrow style (mono uppercase with sage tint — already used; verify 
  it's consistent)
- The italic serif step numbers (01, 02, 03, 04) in the workflow — if these 
  are inconsistent with the rest of the type system, normalize to mono 
  digits or keep as a deliberate accent — but commit to the choice.

## WHAT NOT TO CHANGE

- The sage + dark navy palette
- The current copy on hero, workflow, comparison, pitches, who-it's-for, 
  objections, FAQ — these are voiced and earned
- The 4-step workflow structure
- The pricing tier structure (Free / Solo / Agency / Scale)
- The Adin Sheik testimonial card (note the bordered card around it can be 
  replaced, but the content stays)
- The sample reports' content (Brighton Dental, Harbor Legal, Hideaway Cafe, 
  Bloom Beauty Bar) — these prove the four-state classification works

## DO FIX

- The "10 free analyses" copy if it appears (should be "20 free audits" 
  matching the product)
- The asymmetric card border on the comparison section
- The unclear floating icon column
- The "TRUSTED BY AGENCIES WORLDWIDE" empty social proof
- The 4 opportunity type taglines (pick one rhythm)
- Any place where "credits" appears in copy without context

## OUTPUT EXPECTATIONS

1. Refactor src/components/landing/*.tsx files according to this plan.
2. Update src/app/globals.css if new tokens are needed for the elevation 
   levels or animation utilities.
3. Create animation utility hooks if they don't exist:
   - useScrollReveal (IntersectionObserver-based)
   - useCountUp (numeric animation)
   - A Typewriter component (for the AI pitch preview)
4. Verify the page renders correctly at 375 / 768 / 1280 / 1920 px via 
   Playwright after each section refactor.
5. Capture before/after screenshots per section. Save to 
   docs/landing-redesign-2026-06/before/ and after/.
6. After the entire pass, run Lighthouse on the live page. Performance 
   should be within 5 points of baseline; if it dropped further, identify 
   the animation cost and tune.

## VERIFICATION CHECKLIST

After completing the refactor, verify by self-review:
- [ ] Zero decorative borders on cards anywhere except the Agency pricing tier
- [ ] All section reveals stagger naturally (no popping)
- [ ] Animations respect `prefers-reduced-motion`
- [ ] The hero opportunities feed cycles smoothly
- [ ] The pricing card hierarchy is unambiguous (Agency is visually dominant)
- [ ] No section has more than one accent color (sage carries everything; 
      amber only on the Best value pill and the "Want full picture?" gate 
      if intentional)
- [ ] Mobile (375px) layout works for every section
- [ ] No console errors
- [ ] Lighthouse Performance ≥ 90, Accessibility ≥ 95
- [ ] A screenshot of any section, sent to a Linear or Vercel designer, 
      would not be immediately identified as "AI-generated"

## CONSTRAINTS

- Work section-by-section. Do not attempt to refactor all 14 sections in 
  one commit. One commit per section. Reviewable.
- Do not refactor any /dashboard/ pages as part of this. Landing only.
- Do not introduce new dependencies. Use the Framer Motion already in the 
  project. If a new dependency feels necessary, surface that as a question 
  before adding.
- If a section refactor reveals an architectural issue (e.g., a component 
  shared across landing and dashboard), flag it and choose the safer path 
  (duplicate, refactor in landing only, leave dashboard untouched).

## START WITH

Section 1 (Hero) and Section 12 (Pricing). These are the highest-impact 
sections. After these two are reviewed and approved, proceed through the 
remaining sections in order. Do not start Section 2 until Section 1 is 
approved.