# Nearsited — Unit Economics
*Last updated: June 2026. Assumes Google billing enabled, USD prices, ~84 INR/USD.*

---

## Revenue

| Plan | Price | Analyses/mo | Searches/mo |
|---|---|---|---|
| Free | $0 | 20 lifetime | 1 lifetime |
| Starter | $19/mo | 50 | 3 |
| Agency | $49/mo | 200 | 10 |

Annual plans: Starter $180/yr ($15/mo), Agency $468/yr ($39/mo).

---

## Cost Per Operation

### Google Maps Platform (billing enabled)
Google gives a **$200/month free credit** — first ~6,250 Nearby Searches or ~11,750 Place Details calls are free each month.

| Operation | API Call | Cost (USD) | Cost (INR) |
|---|---|---|---|
| Discover search | Nearby Search (Text) × 3 | $0.032 × 3 = $0.096 | ₹8.1 |
| Business enrichment | Place Details × ~25 businesses | $0.017 × 25 = $0.425 | ₹35.7 |
| Ratings refresh | Place Details × 1 | $0.017 | ₹1.4 |
| **Per discover session** | | **~$0.52** | **~₹44** |

PageSpeed Insights API: **free** (requires billing enabled but no per-call charge).

### ScreenshotOne
$17 per 2,000 screenshots = **$0.0085/screenshot**.

| Operation | Screenshots | Cost (USD) | Cost (INR) |
|---|---|---|---|
| Design analysis | 2 (mobile + desktop) | $0.017 | ₹1.4 |

Free tier: 200 screenshots/month (covers ~100 design analyses free).

### Gemini 3.5 Flash
$1.50/M input tokens, $9.00/M output tokens. Cached: $0.15/M.

| Operation | Est. tokens | Cost (USD) | Cost (INR) |
|---|---|---|---|
| Design analysis (1 strategy) | ~3k in / ~600 out | ~$0.0045 + $0.0054 = $0.010 | ₹0.84 |
| Design analysis (both strategies) | ~6k in / ~1.2k out | ~$0.020 | ₹1.68 |
| Pitch generation | ~2k in / ~500 out | ~$0.0075 | ₹0.63 |
| **Full analysis (audit + design + pitch)** | | **~$0.028** | **~₹2.35** |

> Switch to Flash-Lite ($0.25/$1.50) for design analysis at scale → cuts Gemini cost by ~83%.

---

## Cost Per Full Workflow

One "full workflow" = 1 discover search + analyse 1 business (audit + design + pitch):

| Component | Cost (USD) |
|---|---|
| Discover search (amortised over 25 leads) | $0.52 / 25 = $0.021 |
| PageSpeed audit (mobile + desktop) | $0.00 |
| Screenshots (2) | $0.017 |
| Gemini design analysis | $0.020 |
| Gemini pitch | $0.008 |
| **Total per lead analysed** | **~$0.066** (~₹5.5) |

---

## Margin Per Plan (assuming full usage)

### Free Plan
| | |
|---|---|
| Revenue | $0 |
| 20 analyses × $0.066 | −$1.32 |
| 3 search sessions × $0.52 | −$1.56 |
| **Net per free user** | **−$2.88** |

Free users are subsidised — acceptable as CAC if they convert. If they never convert, $2.88 is the cost of churn.

### Starter — $19/mo
| | |
|---|---|
| Revenue | $19.00 |
| 50 analyses × $0.066 | −$3.30 |
| 3 searches × $0.52 | −$1.56 |
| **Gross profit** | **$14.14** |
| **Gross margin** | **~74%** |

### Agency — $49/mo
| | |
|---|---|
| Revenue | $49.00 |
| 200 analyses × $0.066 | −$13.20 |
| 10 searches × $0.52 | −$5.20 |
| **Gross profit** | **$30.60** |
| **Gross margin** | **~62%** |

> Margin drops if Agency users saturate their limits every month. At 50% usage: ~80% margin.

---

## Google $200 Free Credit Impact

Until you exceed $200/month in Google API calls, effective cost of Nearby Search and Place Details is $0.

| Threshold | Monthly searches needed |
|---|---|
| Hit $200 credit | ~385 full discover sessions (at $0.52 each) |
| Or ~11,765 Place Details calls | ~470 searches enriching 25 leads each |

At current scale (pre-revenue, <50 users), you will not exceed the free credit. Once you reach ~300 active users doing 1 search/week each, Google costs become real.

---

## Break-Even Analysis

**Fixed costs (monthly estimates):**
| | |
|---|---|
| Vercel (Pro) | ~$20 |
| Supabase (Pro) | ~$25 |
| ScreenshotOne (2,000 screenshots) | ~$17 |
| Domain + misc | ~$5 |
| **Total fixed** | **~$67/mo** |

**Break-even:**
- All Starter ($19): need **4 paying users** to cover fixed costs
- All Agency ($49): need **2 paying users**
- Mix: ~3–4 users covers fixed costs

At 10 paying customers (target):
- 10 × Starter = $190/mo → profit ~$123/mo after fixed costs
- 10 × Agency = $490/mo → profit ~$350/mo after fixed costs

---

## Cost Reduction Levers (when scale demands it)

1. **Switch design analysis to Gemini Flash-Lite** — saves ~$0.017/analysis (83% Gemini cost reduction, minimal quality drop for standard sites)
2. **7-day audit cache** — already implemented; prevents re-running PageSpeed on revisited leads
3. **places_cache** — already implemented; prevents re-calling Place Details for known businesses
4. **ScreenshotOne → self-hosted Playwright** (v2) — eliminates screenshot cost entirely once worker server is running
5. **Google $200 credit** — effectively zero Google cost until ~300 active monthly users

---

## Key Risk: Agency Plan Margin at Full Usage

If an Agency user runs all 200 analyses + 10 searches every month:
- Variable cost: $13.20 + $5.20 = $18.40
- Revenue: $49
- Gross margin: 62%

If they also heavily use pitch generation (say 200 pitches/mo):
- Additional Gemini cost: 200 × $0.008 = $1.60
- Revised margin: ~59%

Still healthy. The risk is if Google billing exceeds the $200 credit (multiple Agency users doing many searches). Monitor monthly Google Cloud spend once you have 20+ active Agency users.
