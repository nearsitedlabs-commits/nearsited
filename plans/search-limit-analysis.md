# Search Limit Model — Analysis & Recommendations

## Current Model

| Tier | Searches | Radius | Reset |
|------|----------|--------|-------|
| Free | 3 lifetime | User configurable | Never |
| Starter ($19) | 3/month | User configurable | Monthly |
| Agency | 10/month | User configurable | Monthly |

One search = 1 API call (city + business type + radius). Same cost regardless of results count or radius size.

---

## Problems Identified

### 1. Radius is an exploit vector
A credit costs the same for 1km (5 results) vs 50km (500 results). Rational users always choose max radius, making radius controls meaningless. This also burns expensive Google Places API calls on the backend.

### 2. 0-result searches waste credits
If a user searches "dentist in a small town" and gets 0 results, they lose a credit. Bad first experience → churn.

### 3. City + business type isn't granular enough
A user can search "restaurant in New York" and get thousands of leads for one credit. But "vegan restaurant in a 5km radius of a specific suburb" costs the same. The pricing doesn't reflect value delivered.

---

## Recommendations

### A. Refund 0-result searches
If the API returns 0 businesses, automatically refund the credit. The user shouldn't pay for a failed search.

### B. Radius tiers
| Tier | Max radius | Notes |
|------|-----------|-------|
| Free | 15km fixed | Remove radius control — use 15km as default |
| Starter | 25km | Configurable up to 25km |
| Agency | 50km | Configurable up to 50km |

This prevents the "always max radius" exploit and gives a reason to upgrade.

### C. Smart radius defaults
Instead of letting the user pick any radius, use smart defaults based on business type:
- Dentists, cafes, salons → 10km (people travel locally)
- Lawyers, accountants → 25km (people travel further for professionals)
- Event venues, wedding services → 50km (people travel far)

### D. Credit model options

**Option 1: Flat search credits (current)** — 1 search = 1 credit regardless of radius/results
- ✅ Simple to understand
- ❌ Can be exploited with max radius
- ❌ 0 results still costs 1 credit

**Option 2: Tiered by radius** — Small (10km) = 1 credit, Medium (25km) = 2, Large (50km) = 3
- ✅ Prevents radius exploit
- ✅ More granular control
- ❌ More complex pricing

**Option 3: Results-based** — Free to browse preview, pay per lead saved to account
- ✅ User only pays for value received
- ❌ Higher backend costs (Google Places API still runs)
- ❌ Less predictable revenue

### E. Free trial UX
Current: "3 lifetime searches" → user feels pressure, might churn after one bad search.

Better: "Discover 30 leads free" (any searches, any radius — first 30 leads saved to your account are free). This reframes the free trial as value received rather than attempts made.

---

## Summary

The current model works but has three sharp edges:
1. Radius exploit (fix: tier radius limits)
2. 0-result waste (fix: refund credits on empty results)
3. Free trial anxiety (fix: reframe as "free leads" not "free searches")
