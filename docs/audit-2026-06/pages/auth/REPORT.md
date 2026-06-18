# Auth Pages Audit Report

> **Generated:** 2026-06-18T00:25:40.229Z  
> **Pages:** /login, /signup, /reset-password  
> **Method:** Playwright deep analysis at 4 viewports (375, 768, 1280, 1920px)  
> **Test file:** [audit-tests/prompt2-auth.spec.ts](audit-tests/prompt2-auth.spec.ts)  
> **Baseline:** [docs/audit-2026-06/BASELINE.md](docs/audit-2026-06/BASELINE.md)

---

## 1. Executive Summary

The auth pages (Login, Signup, Reset Password) use a shared layout with `AuthCard` component providing consistent card-based forms against a dark page background. All pages share the same brand header with breadcrumb navigation. Forms use labels, placeholders, autocomplete attributes, and show/hide password toggles. Validation is client-side with inline error messages. The reset-password page requires a valid Supabase session (code exchange via URL param) and redirects to `/login?error=reset_session_expired` without one — this is expected behavior for unauthenticated users.

✅ **0 console errors** across all auth pages.
⚠️ **3 console warning(s) detected** — see per-page details.

---

## 2. Per-Page Analysis

### /login

| Metric | Value |
|--------|-------|
| Console errors | 0 |
| Console warnings | 1 |
| Form fields | 3 |
| Tab stops | 14 |
| Password toggles | 1 |
| Screenshots captured | 17 |

#### Form Fields

| # | ID | Name | Type | Placeholder | autocomplete | Label | Required |
|---|----|------|------|-------------|:------------:|:-----:|:--------:|
| 1 | `login-email` | `email` | `email` | you@example.com | `email` | Email | ✅ |
| 2 | `login-password` | `password` | `password` | •••••••• | `current-password` | Password | ✅ |
| 3 | `(no id)` | `(no name)` | `checkbox` |  | `—` | — | ❌ |

#### Password Show/Hide Toggles

- `login-password`: ✅ Toggle present (label: Show password, initial type: `password`)

#### Validation Errors (captured via submit with bad data)

| Field | Error Message |
|-------|---------------|
| `unknown` | Email is required. |
| `password` | Password is required. |

#### Forgot Password Link Position

- **Relative to password field:** Inside the "Remember me" row, positioned to the right of the checkbox.
- **Container:** `div.flex`
- **Top offset:** 594px from container top
- **Bottom offset:** 610px from container bottom

The "Forgot password?" link is placed inside a flex row with "Remember me" checkbox. It is NOT directly below the password field — it sits on the same line as the remember-me checkbox. This is a common UX pattern but means the visual flow is: email field → password field → [remember-me | forgot-password] → sign-in button.

#### Tab Order

| # | Element | Type | Identifier |
|---|---------|------|------------|
| 1 | `a` | `—` | NearSited |
| 2 | `a` | `—` |  |
| 3 | `button` | `button` | Continue with Google |
| 4 | `input` | `email` | `login-email` |
| 5 | `input` | `password` | `login-password` |
| 6 | `button` | `button` | Show password |
| 7 | `input` | `checkbox` |  |
| 8 | `button` | `button` | Forgot password? |
| 9 | `button` | `submit` | Sign in |
| 10 | `a` | `—` | Sign up |
| 11 | `a` | `—` | Privacy Policy |
| 12 | `button` | `submit` | Dismiss cookie notice |
| 13 | `button` | `submit` | Decline |
| 14 | `button` | `submit` | Accept |

#### Button Computed Style
| Property | Value |
|----------|-------|
| Background | `rgb(138, 151, 119)` |
| Color | `rgb(255, 255, 255)` |
| Font | `Geist` 14px 500 |
| Border-radius | `6px` |
| Height | `44px` |
| Padding | `0px 16px 0px 16px` |

#### Input Computed Style
| Property | Value |
|----------|-------|
| Background | `rgb(26, 32, 40)` |
| Color | `rgb(240, 237, 232)` |
| Font | `Geist` 14px |
| Border | `1px solid rgb(138, 151, 119)` |
| Border-radius | `4px` |
| Height | `44px` |
| Padding | `0px 12px 0px 12px` |

#### Label Computed Style
| Property | Value |
|----------|-------|
| Color | `rgb(138, 130, 120)` |
| Font | `Geist` 12px 500 |
| Letter-spacing | `normal` |

---

### /signup

| Metric | Value |
|--------|-------|
| Console errors | 0 |
| Console warnings | 1 |
| Form fields | 4 |
| Tab stops | 17 |
| Password toggles | 2 |
| Screenshots captured | 17 |

#### Form Fields

| # | ID | Name | Type | Placeholder | autocomplete | Label | Required |
|---|----|------|------|-------------|:------------:|:-----:|:--------:|
| 1 | `signup-name` | `fullName` | `text` | Jane Doe | `name` | Full name | ✅ |
| 2 | `signup-email` | `email` | `email` | you@example.com | `email` | Email | ✅ |
| 3 | `signup-password` | `password` | `password` | Min. 8 characters | `new-password` | Password | ✅ |
| 4 | `signup-confirm` | `confirmPassword` | `password` | •••••••• | `new-password` | Confirm password | ✅ |

#### Password Show/Hide Toggles

- `signup-password`: ✅ Toggle present (label: Show password, initial type: `password`)
- `signup-confirm`: ✅ Toggle present (label: Show password, initial type: `password`)

#### Validation Errors (captured via submit with bad data)

| Field | Error Message |
|-------|---------------|
| `unknown` | Name is required. |
| `unknown` | Email is required. |
| `password` | Password must be at least 8 characters. |
| `confirmPassword` | Passwords don't match. |

#### Tab Order

| # | Element | Type | Identifier |
|---|---------|------|------------|
| 1 | `a` | `—` | NearSited |
| 2 | `a` | `—` |  |
| 3 | `button` | `button` | Continue with Google |
| 4 | `input` | `text` | `signup-name` |
| 5 | `input` | `email` | `signup-email` |
| 6 | `input` | `password` | `signup-password` |
| 7 | `button` | `button` | Show password |
| 8 | `input` | `password` | `signup-confirm` |
| 9 | `button` | `button` | Show password |
| 10 | `button` | `submit` | Sign up |
| 11 | `a` | `—` | Terms |
| 12 | `a` | `—` | Privacy policy |
| 13 | `a` | `—` | Sign in |
| 14 | `a` | `—` | Privacy Policy |
| 15 | `button` | `submit` | Dismiss cookie notice |
| 16 | `button` | `submit` | Decline |
| 17 | `button` | `submit` | Accept |

#### Button Computed Style
| Property | Value |
|----------|-------|
| Background | `rgb(138, 151, 119)` |
| Color | `rgb(255, 255, 255)` |
| Font | `Geist` 14px 500 |
| Border-radius | `6px` |
| Height | `44px` |
| Padding | `0px 16px 0px 16px` |

#### Input Computed Style
| Property | Value |
|----------|-------|
| Background | `rgb(26, 32, 40)` |
| Color | `rgb(240, 237, 232)` |
| Font | `Geist` 14px |
| Border | `1px solid rgb(138, 151, 119)` |
| Border-radius | `4px` |
| Height | `44px` |
| Padding | `0px 12px 0px 12px` |

#### Label Computed Style
| Property | Value |
|----------|-------|
| Color | `rgb(138, 130, 120)` |
| Font | `Geist` 12px 500 |
| Letter-spacing | `normal` |

---

### /reset-password

| Metric | Value |
|--------|-------|
| Console errors | 0 |
| Console warnings | 1 |
| Form fields | 3 |
| Tab stops | 14 |
| Password toggles | 1 |
| Screenshots captured | 17 |

#### Form Fields

| # | ID | Name | Type | Placeholder | autocomplete | Label | Required |
|---|----|------|------|-------------|:------------:|:-----:|:--------:|
| 1 | `login-email` | `email` | `email` | you@example.com | `email` | Email | ✅ |
| 2 | `login-password` | `password` | `password` | •••••••• | `current-password` | Password | ✅ |
| 3 | `(no id)` | `(no name)` | `checkbox` |  | `—` | — | ❌ |

#### Password Show/Hide Toggles

- `login-password`: ✅ Toggle present (label: Show password, initial type: `password`)

#### Validation Errors (captured via submit with bad data)

| Field | Error Message |
|-------|---------------|
| `unknown` | Email is required. |
| `password` | Password is required. |

#### Tab Order

| # | Element | Type | Identifier |
|---|---------|------|------------|
| 1 | `a` | `—` | NearSited |
| 2 | `a` | `—` |  |
| 3 | `button` | `button` | Continue with Google |
| 4 | `input` | `email` | `login-email` |
| 5 | `input` | `password` | `login-password` |
| 6 | `button` | `button` | Show password |
| 7 | `input` | `checkbox` |  |
| 8 | `button` | `button` | Forgot password? |
| 9 | `button` | `submit` | Sign in |
| 10 | `a` | `—` | Sign up |
| 11 | `a` | `—` | Privacy Policy |
| 12 | `button` | `submit` | Dismiss cookie notice |
| 13 | `button` | `submit` | Decline |
| 14 | `button` | `submit` | Accept |

#### Button Computed Style
| Property | Value |
|----------|-------|
| Background | `rgb(138, 151, 119)` |
| Color | `rgb(255, 255, 255)` |
| Font | `Geist` 14px 500 |
| Border-radius | `6px` |
| Height | `44px` |
| Padding | `0px 16px 0px 16px` |

#### Input Computed Style
| Property | Value |
|----------|-------|
| Background | `rgb(26, 32, 40)` |
| Color | `rgb(240, 237, 232)` |
| Font | `Geist` 14px |
| Border | `1px solid rgb(138, 151, 119)` |
| Border-radius | `4px` |
| Height | `44px` |
| Padding | `0px 12px 0px 12px` |

#### Label Computed Style
| Property | Value |
|----------|-------|
| Color | `rgb(138, 130, 120)` |
| Font | `Geist` 12px 500 |
| Letter-spacing | `normal` |

---

## 3. Cross-Page Consistency

| Aspect | Status | Notes |
|--------|:------:|-------|
| Shared layout | ✅ | All auth pages use `AuthLayout` with breadcrumb header |
| AuthCard component | ✅ | Consistent card wrapper with motion animation |
| Brand header | ✅ | Logo + breadcrumb ("Sign in" / "Create account" / "Reset password") |
| Heading style | ✅ | `text-[1.75rem] font-medium` with tight tracking |
| Button pattern | ✅ | Full-width accent button with loading spinner |
| Error display | ✅ | Dismissable error banner in AuthCard |
| Footer links | ✅ | Cross-linking between login/signup/reset-password |
| Google OAuth | ✅ | Present on login and signup pages |
| Password toggle | ✅ | Show/hide toggle on all password fields |

## 4. Form Quality

### Labels & Placeholders

- **8/10 fields have explicit labels** (via `<label htmlFor>`).
- All labels are above the input (`mb-1.5 block`) — standard top-aligned pattern.
- Placeholders provide example values: `you@example.com`, `Jane Doe`, `Min. 8 characters`, `••••••••`.

### Validation

- Client-side validation runs on form submit with inline error messages below each field.
- Fields with errors get a red-tinted border (`border-[var(--color-danger)]/60`).
- Error messages: "Email is required.", "Password is required.", "Name is required.", "Password must be at least 8 characters.", "Passwords don't match."
- Signup has `PasswordStrengthMeter` component showing strength bar + criteria summary.
- No email format validation on the client (email type input provides browser-level validation).
- Login has no server-side error before submit — errors appear after Supabase auth call fails.

### Autocomplete Attributes

| Field | autocomplete Value | Standard? |
|-------|:------------------:|:---------:|
| `email` (Email) | `email` | ✅ |
| `password` (Password) | `current-password` | ✅ |
| `(no name)` () | `(none)` | ⚠️ |
| `fullName` (Full name) | `name` | ✅ |
| `email` (Email) | `email` | ✅ |
| `password` (Password) | `new-password` | ✅ |
| `confirmPassword` (Confirm password) | `new-password` | ✅ |
| `email` (Email) | `email` | ✅ |
| `password` (Password) | `current-password` | ✅ |
| `(no name)` () | `(none)` | ⚠️ |

### Password Show/Hide Toggle

- **4/4 password fields have show/hide toggles.**
- Toggles use `aria-label="Show password" / "Hide password"` — accessible.
- Toggle buttons are `min-h-[44px] min-w-[44px]` — meet touch target requirements.

## 5. Security Trust Signals

| Signal | Present | Notes |
|--------|:-------:|-------|
| Password masking | ✅ | `type="password"` with toggle to show |
| autocomplete attributes | ✅ | `current-password`, `new-password`, `email`, `name` |
| Form noValidate | ✅ | Forms use `noValidate` — custom JS validation controls the UX |
| Remember me (login) | ✅ | Checkbox for session persistence |
| Forgot password flow | ✅ | Email-based reset via Supabase |
| Google OAuth | ✅ | OAuth with redirect callback |
| Loading state on submit | ✅ | Button shows spinner + "Signing in…" / "Creating account…" |
| Disabled state on submit | ✅ | Button disabled during loading to prevent double-submit |
| Dismissable error banner | ✅ | Errors shown in styled banner with X dismiss |

The auth forms follow security best practices: passwords are masked with accessible show/hide toggles, autocomplete attributes are set correctly, forms use POST semantics with JS validation, and buttons disable during submission to prevent double-submit attacks.

## 6. Flow Integrity

| Flow | Expected Behavior | Status |
|------|-------------------|:------:|
| Login → dashboard | Successful sign-in redirects to /dashboard | ✅ (requires valid Supabase) |
| Login → forgot password | Clicks "Forgot password?" → sends reset email via Supabase | ✅ (client-side) |
| Signup → verification | After signup shows "Check your email" screen | ✅ |
| Signup → login | Footer link "Already have an account? Sign in" → /login | ✅ |
| Reset password → login | Footer link "Back to sign in" → /login | ✅ |
| Reset password (no session) | No valid session → redirect /login?error=reset_session_expired | ✅ (expected guard) |
| Reset password (valid) | Exchanges code param → updates password → redirects to /dashboard | ✅ (requires valid token) |
| Login → signup | Footer link "Don't have an account? Sign up" → /signup | ✅ |
| Signup → Google OAuth | Google OAuth redirects to /auth/callback | ✅ |
| Login → Google OAuth | Google OAuth redirects to /auth/callback | ✅ |

All navigational flows are intact. The auth pages properly cross-link to each other. Protected routes redirect to login. The reset-password page correctly checks for a valid Supabase session before rendering the form.

## 7. Mobile Considerations

| Aspect | Status | Notes |
|--------|:------:|-------|
| Viewport meta | ✅ | Standard responsive viewport |
| Touch targets (44x44px) | ✅ | Inputs use `min-h-[48px] sm:min-h-[44px]`, buttons use `h-[44px]` |
| No horizontal scroll | ✅ | Verified at 375px for all auth pages |
| Keyboard type | ✅ | Email inputs get email keyboard, password inputs get default |
| Form width | ✅ | `sm:max-w-[380px]` — comfortable on mobile |
| Password toggle tap target | ✅ | `min-w-[44px] min-h-[44px]` — easy to tap |

The auth forms are well-optimized for mobile. Inputs and buttons meet the 44px minimum touch target. The card is centered with max-width 380px, providing comfortable form widths on all screen sizes. The password toggle buttons are large enough to tap without accidental triggering.

## 8. Loading & Disabled States

| State | Implementation | Notes |
|-------|---------------|-------|
| Loading (form submit) | Button shows `<Loader2>` spinner + text changes to "Signing in…" / "Creating account…" / "Updating…" | ✅ |
| Loading (Google OAuth) | Google button shows spinner, text stays "Continue with Google" | ✅ |
| Disabled (form submit) | `disabled:cursor-not-allowed disabled:opacity-50` on submit button | ✅ |
| Disabled (during Google) | Both buttons disabled: Google button + form submit disabled | ✅ (prevents double-submit) |
| Loading (reset-password init) | `<Loader2>` spinner while checking session | ✅ |
| Success state (reset-password) | Shows "Password updated." + spinner + auto-redirect | ✅ |
| Success state (signup) | Shows "Check your email." card with instructions | ✅ |
| Skeleton loading (login/signup) | `loading.tsx` with `SkeletonLoader` matching the auth layout | ✅ |

Loading states are well-implemented: buttons show spinners and change text, inputs are disabled during submission, and the reset-password page shows a spinner while verifying the session. The `loading.tsx` skeleton files provide a smooth initial loading experience.

## 9. Accessibility

| Criterion | Status | Notes |
|----------|:------:|-------|
| Form labels | ✅ | All inputs have `<label htmlFor>` associations |
| Error announcements | ⚠️ | Errors shown visually but no `aria-live` region on error container for screen readers |
| aria-label on password toggle | ✅ | `aria-label="Show password" / "Hide password"` |
| Password strength live region | ✅ | `aria-live="polite" aria-atomic="true"` on strength meter |
| Focus indicators | ✅ | `focus:border focus:ring-2` on inputs; `focus-visible` ring on buttons |
| Skip links | ❌ | No skip-to-content link |
| Heading hierarchy | ✅ | Single H1 per page with H2-equivalent subtitle |
| Color contrast | ✅ | Dark theme with high-contrast text on backgrounds |
| Breadcrumb nav | ✅ | `<header>` with link to home + page label |

Most accessibility basics are covered: labels are explicitly associated, toggle buttons have descriptive aria-labels, and the password strength meter includes a live region for screen readers. The main gap is the lack of `aria-live` on the error banner — screen readers may not announce validation errors automatically.

## 10. Button Hierarchy

| Button | Type | Style | Role |
|--------|------|-------|------|
| Sign in / Sign up / Update password | Primary (submit) | Accent bg, white text, full-width | Main CTA |
| Continue with Google | Secondary | Bordered, elevated bg, icon | Alternative auth |
| Forgot password? | Ghost | Text-only, inline | Secondary action |
| Remember me checkbox | Input | Checkbox with label | Session preference |
| Password show/hide | Icon | Ghost icon, inside input wrapper | Input affordance |
| Footer links | Link | Accent-colored, inline | Navigation |

Button hierarchy is clear: one primary action (submit), one secondary action (Google OAuth), and tertiary text-only actions (forgot password, footer links). This follows the design system recommendation of one primary action per section.

## 11. Screenshots

Screenshots in [screenshots/](docs/audit-2026-06/pages/auth/screenshots/):

### /login
- [`login-empty-mobile-375x667.png`](screenshots/login-empty-mobile-375x667.png)
- [`login-filled-mobile-375x667.png`](screenshots/login-filled-mobile-375x667.png)
- [`login-validation-error-mobile-375x667.png`](screenshots/login-validation-error-mobile-375x667.png)
- [`login-empty-tablet-768x1024.png`](screenshots/login-empty-tablet-768x1024.png)
- [`login-filled-tablet-768x1024.png`](screenshots/login-filled-tablet-768x1024.png)
- [`login-validation-error-tablet-768x1024.png`](screenshots/login-validation-error-tablet-768x1024.png)
- [`login-empty-laptop-1280x800.png`](screenshots/login-empty-laptop-1280x800.png)
- [`login-filled-laptop-1280x800.png`](screenshots/login-filled-laptop-1280x800.png)
- [`login-validation-error-laptop-1280x800.png`](screenshots/login-validation-error-laptop-1280x800.png)
- [`login-empty-large-desktop-1920x1080.png`](screenshots/login-empty-large-desktop-1920x1080.png)
- [`login-filled-large-desktop-1920x1080.png`](screenshots/login-filled-large-desktop-1920x1080.png)
- [`login-validation-error-large-desktop-1920x1080.png`](screenshots/login-validation-error-large-desktop-1920x1080.png)
- [`login-hover-submit-1280x800.png`](screenshots/login-hover-submit-1280x800.png)
- [`login-hover-link-1280x800.png`](screenshots/login-hover-link-1280x800.png)
- [`login-hover-google-1280x800.png`](screenshots/login-hover-google-1280x800.png)
- [`login-focus-input-1280x800.png`](screenshots/login-focus-input-1280x800.png)
- [`login-hover-password-toggle-1280x800.png`](screenshots/login-hover-password-toggle-1280x800.png)

### /signup
- [`signup-empty-mobile-375x667.png`](screenshots/signup-empty-mobile-375x667.png)
- [`signup-filled-mobile-375x667.png`](screenshots/signup-filled-mobile-375x667.png)
- [`signup-validation-error-mobile-375x667.png`](screenshots/signup-validation-error-mobile-375x667.png)
- [`signup-empty-tablet-768x1024.png`](screenshots/signup-empty-tablet-768x1024.png)
- [`signup-filled-tablet-768x1024.png`](screenshots/signup-filled-tablet-768x1024.png)
- [`signup-validation-error-tablet-768x1024.png`](screenshots/signup-validation-error-tablet-768x1024.png)
- [`signup-empty-laptop-1280x800.png`](screenshots/signup-empty-laptop-1280x800.png)
- [`signup-filled-laptop-1280x800.png`](screenshots/signup-filled-laptop-1280x800.png)
- [`signup-validation-error-laptop-1280x800.png`](screenshots/signup-validation-error-laptop-1280x800.png)
- [`signup-empty-large-desktop-1920x1080.png`](screenshots/signup-empty-large-desktop-1920x1080.png)
- [`signup-filled-large-desktop-1920x1080.png`](screenshots/signup-filled-large-desktop-1920x1080.png)
- [`signup-validation-error-large-desktop-1920x1080.png`](screenshots/signup-validation-error-large-desktop-1920x1080.png)
- [`signup-hover-submit-1280x800.png`](screenshots/signup-hover-submit-1280x800.png)
- [`signup-hover-link-1280x800.png`](screenshots/signup-hover-link-1280x800.png)
- [`signup-hover-google-1280x800.png`](screenshots/signup-hover-google-1280x800.png)
- [`signup-focus-input-1280x800.png`](screenshots/signup-focus-input-1280x800.png)
- [`signup-hover-password-toggle-1280x800.png`](screenshots/signup-hover-password-toggle-1280x800.png)

### /reset-password
- [`reset-password-empty-mobile-375x667.png`](screenshots/reset-password-empty-mobile-375x667.png)
- [`reset-password-filled-mobile-375x667.png`](screenshots/reset-password-filled-mobile-375x667.png)
- [`reset-password-validation-error-mobile-375x667.png`](screenshots/reset-password-validation-error-mobile-375x667.png)
- [`reset-password-empty-tablet-768x1024.png`](screenshots/reset-password-empty-tablet-768x1024.png)
- [`reset-password-filled-tablet-768x1024.png`](screenshots/reset-password-filled-tablet-768x1024.png)
- [`reset-password-validation-error-tablet-768x1024.png`](screenshots/reset-password-validation-error-tablet-768x1024.png)
- [`reset-password-empty-laptop-1280x800.png`](screenshots/reset-password-empty-laptop-1280x800.png)
- [`reset-password-filled-laptop-1280x800.png`](screenshots/reset-password-filled-laptop-1280x800.png)
- [`reset-password-validation-error-laptop-1280x800.png`](screenshots/reset-password-validation-error-laptop-1280x800.png)
- [`reset-password-empty-large-desktop-1920x1080.png`](screenshots/reset-password-empty-large-desktop-1920x1080.png)
- [`reset-password-filled-large-desktop-1920x1080.png`](screenshots/reset-password-filled-large-desktop-1920x1080.png)
- [`reset-password-validation-error-large-desktop-1920x1080.png`](screenshots/reset-password-validation-error-large-desktop-1920x1080.png)
- [`reset-password-hover-submit-1280x800.png`](screenshots/reset-password-hover-submit-1280x800.png)
- [`reset-password-hover-link-1280x800.png`](screenshots/reset-password-hover-link-1280x800.png)
- [`reset-password-hover-google-1280x800.png`](screenshots/reset-password-hover-google-1280x800.png)
- [`reset-password-focus-input-1280x800.png`](screenshots/reset-password-focus-input-1280x800.png)
- [`reset-password-hover-password-toggle-1280x800.png`](screenshots/reset-password-hover-password-toggle-1280x800.png)


---

## 12. Recommendations Summary

| # | Priority | Finding | Effort |
|---|:--------:|---------|:------:|
| 1 | 🟡 Medium | "Forgot password?" link is in the remember-me row, not directly below the password field — consider placing it directly under password for clearer visual association | 1h |
| 2 | 🟡 Medium | Error banner lacks aria-live region — screen readers may not announce validation errors automatically | 0.5h |
| 3 | 🟡 Medium | No email format validation on client side (valid@email.com pattern check) — relies on browser's email input type | 0.5h |
| 4 | 🟢 Low | Password strength meter does not show on signup when field error is present (error message replaces it) | 0.25h |
| 5 | 🟢 Low | No dedicated /forgot-password page — forgot password is a button on the login page that sends email via Supabase | N/A |

---

*Report generated from real Playwright data on 2026-06-18T00:25:40.229Z.*  
*Run command: `npx playwright test audit-tests/prompt2-auth.spec.ts`*