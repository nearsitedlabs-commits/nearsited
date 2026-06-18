# State Coverage Matrix
**Date:** 2026-06-18T03:37:13.628Z · **Auditor:** Playwright (Prompt 17)

---

## Page × State Coverage

| Page | loading.tsx | error.tsx | 404 | Empty State | Offline | Auth Guard |
|------|:-----------:|:---------:|:---:|:-----------:|:-------:|:----------:|
| / | N/A | N/A | N/A | ⚠️ Partial | ❌ | Public |
| /login | ✅ | N/A | N/A | N/A | ❌ | Public |
| /signup | ✅ | N/A | N/A | N/A | ❌ | Public |
| /pricing | N/A | N/A | N/A | N/A | ❌ | Public |
| /privacy | N/A | N/A | N/A | N/A | ❌ | Public |
| /terms | N/A | N/A | N/A | N/A | ❌ | Public |
| /dashboard | ✅ | ⚠️ | N/A | ⚠️ Partial | ❌ | ✅ → /login |
| /dashboard/leads | ⚠️ | ⚠️ | N/A | ✅ LeadsEmptyState | ❌ | ✅ → /login |
| /dashboard/leads/[id] | ✅ | ❌ | N/A | N/A | ❌ | ✅ → /login |
| /dashboard/discover | ⚠️ | ❌ | N/A | ⚠️ Partial | ❌ | ✅ → /login |
| /dashboard/audit | ⚠️ | ❌ | N/A | N/A | ❌ | ✅ → /login |
| /dashboard/pipeline | ⚠️ | ✅ | N/A | ✅ Motion empty | ❌ | ✅ → /login |
| /dashboard/pitches | ⚠️ | ✅ | N/A | ⚠️ | ❌ | ✅ → /login |
| /dashboard/radar | ✅ | ✅ | N/A | N/A | ❌ | ✅ → /login |
| /dashboard/settings | ✅ | ✅ | N/A | N/A | ❌ | ✅ → /login |
| /dashboard/templates | ✅ | ✅ | N/A | N/A | ❌ | ✅ → /login |
| /nonexistent-page | N/A | N/A | ✅ Custom | N/A | N/A | N/A |

**Legend:** ✅ = Covered, ⚠️ = Partial/Missing, ❌ = Not covered, N/A = Not applicable

---

## Key Findings

1. **404 page:** Custom not-found.tsx exists with logo, "Go home" and "Sign in" actions — ✅ Good
2. **Offline state:** ❌ No offline detection anywhere in the product (known gap)
3. **Auth redirect:** ✅ Middleware protects all /dashboard/* routes, redirects to /login
4. **Error boundaries:** 3 critical pages missing error.tsx (leads/[id], discover, audit)
5. **Empty states:** Some pages have empty states (pipeline, leads), others don't
