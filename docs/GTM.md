# Nearsited — Go-To-Market Reference
*Current as of June 2026. Paste this into any AI tool before asking for outreach/pricing/product research.*

---

## What Nearsited Does
Nearsited finds local businesses with weak or missing websites, audits their performance, and generates a ready-to-send pitch — in under 2 minutes. Built for web design agencies and freelancers doing outbound prospecting.

**The workflow:**
1. Enter a city + business type → discovers 20–60 local businesses
2. Each business is classified: no website / social-only / platform-only / has website
3. Open a lead → get performance scores, design critique, ranked issues
4. AI generates a personalised pitch (email or WhatsApp format)
5. Export as PDF, share via link, track in pipeline

**Four opportunity types the tool handles:**
- `no_website` — business has no online presence at all
- `social_only` — only a Facebook/Instagram page, no real site
- `platform_only` — listed on Yelp/Booking/Fresha but no owned site
- `has_website` — has a site but it scores poorly on performance/design

---

## Payments & Billing
- **Payment processor: Dodo Payments** (live, not Stripe or PayPal)
- Dodo Payments is a global payment processor supporting credit/debit cards, UPI, and major international methods
- Checkout is handled via Dodo-hosted payment links; webhooks update subscription status

**No discount codes / promo codes system is built yet.**
**No free trial period** — free tier is the trial.

---

## Pricing (current, live)

| Plan | Monthly | Annual | Analyses/mo | City Searches/mo |
|---|---|---|---|---|
| **Free** | $0 | — | 20 (lifetime, not monthly) | 3 (lifetime) |
| **Starter** | $19/mo | $180/yr ($15/mo) | 50 | 3 |
| **Agency** | $49/mo | $468/yr ($39/mo) | 200 | 10 |

**Free tier detail:** New users get 20 audit credits at signup (covers ~10 full lead analyses: audit + design each). 3 city searches lifetime. No time limit — stays until credits run out. No credit card required.

**What counts as 1 analysis credit:** Running either a performance audit OR a design analysis on one business = 1 credit. A full analysis (both audit + design) = 2 credits.

**All plans include:**
- All 4 opportunity types (no website, social, platform, weak site)
- Unlimited AI pitch generation
- Unlimited pipeline management
- PDF audit exports
- Shareable report links

**Not yet built:**
- Team seats / multi-user (advertised previously, removed — coming later)
- Discount / coupon codes
- Referral system

**Pricing note (internal):** $19/mo may filter in the wrong customers — low expectations, personal-expense mindset, high churn. Competitors at $49–99 price to filter for serious agencies. Before locking pricing, pressure-test with 5 real outreach conversations: ask what they'd expect to pay and whether $19 makes them more or less serious. You may find the lower price actively hurts conversion among the ICP you actually want.

---

## Target Customer
**Primary ICP:** Solo web designers and 1–10 person web design agencies doing outbound prospecting. Non-technical, time-poor, prospecting 20–50 businesses per week.

**Secondary ICP:** Freelance SEO consultants who pitch local businesses on SEO + website improvements.

**Best fit markets (English-speaking, purchasing power):**
- USA, UK, Australia — freelancers and small agencies, $19/mo is low friction
- Singapore, Dubai — agencies with budgets, $49/mo Agency plan makes sense
- NOT recommended for first outreach: Philippines, Pakistan, Bangladesh — lower purchasing power makes $19/mo a harder sell; high churn risk

---

## What to Tell Prospects
- Free tier gives 10 full analyses to try — no card needed
- $19/mo Starter pays for itself if it helps close 1 client per quarter
- $49/mo Agency is designed for teams actively prospecting weekly
- Pitches are generated per lead — not generic templates
- Works for any local business type (restaurants, dentists, lawyers, salons, etc.)

---

## What Nearsited Is NOT
- Not an email sending tool (it generates pitch copy; user sends it themselves)
- Not an SEO tool (it audits existing sites, doesn't fix them)
- Not a CRM (has a basic pipeline tracker, not a full CRM)
- Not multi-user yet (single login per account)
- Does not integrate with Mailchimp, HubSpot, or any CRM yet

---

## Tech Stack (for technical prospects)
Next.js, Supabase, Google PageSpeed, Gemini AI (design analysis + pitch generation), ScreenshotOne. Hosted on Vercel. Data is per-user, not shared.
