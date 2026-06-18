# Mobile Audit — Proposed Fixes
**Date:** 2026-06-18T03:37:13.638Z · **Auditor:** Playwright (Prompt 18) · **Viewport:** 375×667px

---

## Executive Summary

Mobile audit conducted across 6 public pages at 375px viewport. The application uses responsive patterns (`lg:hidden`, `sm:*", `md:*` utilities) and has dedicated mobile components (`BottomNav`, `MobileHeader`, `BottomSheet`, `SwipeAction`). No horizontal scroll issues detected. Touch target analysis identifies small interactive elements that need attention.

---

## Per-Page Results

| Page | Horizontal Scroll | Touch Targets <44px | Body Font Size |
|------|:----------------:|:-------------------:|:--------------:|
| /landing | ✅ None | ⚠️ See below | 16px ✅ |
| /login | ✅ None | ⚠️ Some small links | 14px ✅ |
| /signup | ✅ None | ⚠️ Some small links | 14px ✅ |
| /pricing | ✅ None | ⚠️ See below | 16px ✅ |
| /privacy | ✅ None | ⚠️ Legal text links | 16px ✅ |
| /terms | ✅ None | ⚠️ Legal text links | 16px ✅ |

**No horizontal scroll on any page at 375px** — ✅ Responsive layout is correct.

---

## Touch Target Issues

Interactive elements smaller than 44×44px (WCAG 2.5.5 minimum):

| Common Pattern | Size | Issue |
|---------------|:----:|-------|
| Legal footer links | ~24×16px | Below minimum touch target |
| Breadcrumb links | ~30×20px | Below minimum |
| Forgot password link | ~80×20px | Height below 44px |
| Privacy/terms inline links | variable | No minimum size guarantee |

**Fix:** Add `min-h-[44px] min-w-[44px] py-2` to all inline links in legal pages and auth footer links. For breadcrumb links, increase padding to meet 44px minimum.

---

## Mobile Components Present

| Component | Used | Notes |
|-----------|:----:|-------|
| `BottomNav` | Dashboard pages | ✅ Fixed bottom, 56px height, safe-area aware |
| `MobileHeader` | Dashboard pages | ✅ Fixed top, 52px height, back button + title |
| `BottomSheet` | Dashboard pages | ✅ Drag-to-dismiss, focus trap, aria-modal |
| `SwipeAction` | Dashboard pages | ✅ Touch swipe with action buttons |
| `mobile-content-offset` CSS | All pages | ✅ Pads content for fixed header/nav |

---

## Proposed Fixes

1. **Increase touch targets on legal pages** — Inline links in privacy/terms should have `min-h-[44px]` padding
2. **Auth footer links** — "Sign up" / "Sign in" / "Privacy Policy" links in auth footer need larger tap targets
3. **Ensure `SwipeAction` action buttons** meet 44px minimum (currently uses `min-h-[44px]` ✅)
4. **Verify BottomNav items** meet 44px touch target (currently uses `min-h-[44px]` ✅)

---

## Mobile Scorecard

| Criterion | Score | Notes |
|-----------|:-----:|-------|
| No horizontal scroll | 10/10 | ✅ All pages clean |
| Touch targets ≥44px | 7/10 | ⚠️ Inline links need padding |
| Body text readability | 9/10 | ✅ Minimum 14px |
| Mobile-specific components | 9/10 | ✅ BottomNav, MobileHeader, BottomSheet, SwipeAction |
| Safe area handling | 9/10 | ✅ `env(safe-area-inset-*)` used |
| Viewport configuration | 10/10 | ✅ `width=device-width, initial-scale=1` |
| **Overall** | **8.5/10** | Strong mobile foundation; minor touch target gaps |
