"use client";

/**
 * PasswordStrengthMeter — client-side password strength indicator.
 *
 * Evaluates the password against six criteria without any external dependency:
 *   • Length ≥ 8
 *   • Length ≥ 12
 *   • Has uppercase letter
 *   • Has lowercase letter
 *   • Has number
 *   • Has special character
 *
 * Displays a color-coded bar with a label ("Weak" → "Very Strong").
 * The form is NOT blocked — this is purely informational.
 *
 * Accessibility: an aria-live="polite" region announces the current strength
 * to screen readers whenever the password changes.
 */

import { useMemo, useId } from "react";

/* ── Strength scoring ─────────────────────────────────────────────── */

interface StrengthResult {
  /** 0–6 score */
  score: number;
  /** Human-readable label */
  label: string;
  /** CSS variable for the bar + label colour */
  color: string;
  /** CSS variable for the tint/background */
  tint: string;
  /** Number of filled segments (0–4) for the bar display */
  segments: number;
}

const LEVELS: StrengthResult[] = [
  { score: 0, label: "", color: "transparent", tint: "transparent", segments: 0 },
  { score: 1, label: "Weak", color: "var(--score-high)", tint: "var(--score-high-tint)", segments: 1 },
  { score: 2, label: "Weak", color: "var(--score-high)", tint: "var(--score-high-tint)", segments: 1 },
  { score: 3, label: "Fair", color: "var(--score-mid)", tint: "var(--score-mid-tint)", segments: 2 },
  { score: 4, label: "Fair", color: "var(--score-mid)", tint: "var(--score-mid-tint)", segments: 2 },
  { score: 5, label: "Strong", color: "var(--score-good)", tint: "var(--score-good-tint)", segments: 3 },
  { score: 6, label: "Very Strong", color: "var(--score-good)", tint: "var(--score-good-tint)", segments: 4 },
];

function evaluateStrength(password: string): StrengthResult {
  if (!password) return LEVELS[0];

  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  // Clamp to available levels
  const idx = Math.min(score, LEVELS.length - 1);
  return LEVELS[idx];
}

/* ── Component ────────────────────────────────────────────────────── */

interface Props {
  password: string;
}

export default function PasswordStrengthMeter({ password }: Props) {
  const uid = useId();
  const strength = useMemo(() => evaluateStrength(password), [password]);

  // Don't render anything when the field is empty
  if (!password) return null;

  return (
    <div className="mt-3 space-y-1.5" role="group" aria-label="Password strength meter">
      {/* Segmented bar */}
      <div
        className="flex gap-1"
        aria-hidden="true"
      >
        {[1, 2, 3, 4].map((seg) => (
          <div
            key={seg}
            className="h-1 flex-1 rounded-full transition-colors duration-200 ease-out"
            style={{
              backgroundColor:
                seg <= strength.segments
                  ? strength.color
                  : "rgba(255,255,255,0.06)",
            }}
          />
        ))}
      </div>

      {/* Label + criteria summary */}
      <div className="flex items-center justify-between">
        <span
          id={`${uid}-label`}
          className="text-xs font-medium transition-colors duration-200"
          style={{ color: strength.color }}
        >
          {strength.label}
        </span>

        <span className="text-[10px] text-[var(--color-text-tertiary)]">
          {describeCriteria(password)}
        </span>
      </div>

      {/* Screen-reader live region */}
      <div
        id={`${uid}-announce`}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {strength.label
          ? `Password strength: ${strength.label}. ${describeCriteria(password)}.`
          : "Enter a password to see strength evaluation."}
      </div>
    </div>
  );
}

/* ── Helpers ──────────────────────────────────────────────────────── */

/** Human-readable summary of which criteria are met. */
function describeCriteria(pw: string): string {
  const parts: string[] = [];
  if (pw.length >= 12) parts.push("12+ chars");
  else if (pw.length >= 8) parts.push("8+ chars");
  else if (pw.length >= 6) parts.push("6+ chars");
  else parts.push(`${pw.length} chars`);

  if (/[A-Z]/.test(pw)) parts.push("uppercase");
  if (/[a-z]/.test(pw)) parts.push("lowercase");
  if (/[0-9]/.test(pw)) parts.push("number");
  if (/[^A-Za-z0-9]/.test(pw)) parts.push("symbol");

  return parts.join(" · ");
}
