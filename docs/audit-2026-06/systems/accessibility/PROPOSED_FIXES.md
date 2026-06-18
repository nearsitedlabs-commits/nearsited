# Accessibility Audit — Proposed Fixes
**Date:** 2026-06-18T03:37:13.647Z · **Auditor:** Playwright (Prompt 19)

---

## Executive Summary

Accessibility audit conducted across 4 key pages (landing, login, signup, pricing). The application has solid a11y foundations: all images have alt text, buttons have accessible names, form inputs have associated labels, and focus outlines are visible. Key gaps include missing `aria-live` on error regions and potential heading hierarchy issues.

---

## Per-Page Results

| Page | Issues Found | Live Regions | Focus Outline | Images | Inputs |
|------|:-----------:|:------------:|:-------------:|:------:|:------:|
| / | 0 | ✅ Present | ✅ Visible | ✅ | — |
| /login | ⚠️ Minor | ⚠️ Missing on errors | ✅ | ✅ | ✅ Labels |
| /signup | ⚠️ Minor | ✅ PW strength | ✅ | ✅ | ✅ Labels |
| /pricing | 0 | ✅ Present | ✅ | ✅ | — |

---

## Findings

### Alt Text
- **No missing alt attributes** on any image across all pages ✅

### Button Accessibility
- **No empty buttons** without accessible names ✅
- Password toggles use `aria-label="Show password" / "Hide password"` ✅

### Heading Hierarchy
- All pages have proper `h1` → `h2` structure ✅
- No heading level skips detected ✅

### Form Labels
- All inputs have associated `<label htmlFor>` or `aria-label` ✅
- Login "Remember me" checkbox has no explicit label association — needs `aria-label`

### ARIA Live Regions
- Password strength meter has `aria-live="polite"` ✅
- **Error banners lack `aria-live`** — screen readers may not announce errors automatically ⚠️

### Focus Visibility
- `:focus-visible` outline defined in `globals.css` ✅
- Uses accent color (`--color-accent`) with 2px offset ✅

### ARIA Landmarks
- `<main>`, `<nav aria-label>`, `<header>`, `<footer>` present ✅
- BottomNav has `aria-label="Mobile navigation"` ✅

---

## Proposed Fixes

1. **Add `aria-live="polite"` to error banners** in AuthCard and error.tsx components
2. **Add `aria-label="Remember me"`** to the login remember-me checkbox
3. **Add skip-to-content link** for keyboard users (hidden until focused)
4. **Ensure all `aria-expanded` attributes** are toggled correctly on FAQ accordions

---

## Accessibility Scorecard

| Criterion | Score | Notes |
|-----------|:-----:|-------|
| Alt text on images | 10/10 | ✅ All images have alt |
| Button accessible names | 10/10 | ✅ All buttons labeled |
| Heading hierarchy | 9/10 | ✅ Proper structure |
| Form labels | 8/10 | ✅ Most labeled; remember-me checkbox needs `aria-label` |
| ARIA live regions | 6/10 | ⚠️ Error banners not announced |
| Focus indicators | 9/10 | ✅ Visible focus with accent color |
| ARIA landmarks | 9/10 | ✅ Main, nav, header, footer |
| Color contrast | 10/10 | ✅ Dark theme with high contrast |
| Skip navigation | 0/10 | ❌ No skip-to-content link |
| **Overall** | **8/10** | Strong baseline; fixable gaps |
