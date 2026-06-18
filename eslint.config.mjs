import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
      }],

      // ── Design system enforcement (Phase 3 architecture rules) ───────────
      // Catch design-token violations in className literal strings.
      // Applies to direct Literal values (className="..." syntax).
      // Violations inside cn() / template literals are caught in code review.
      "no-restricted-syntax": [
        "warn",

        // 3.3 — Border-radius discipline
        // Only --radius-sm (6px) and --radius-md (10px) allowed.
        // Use: rounded-[var(--radius-sm)] or rounded-[var(--radius-md)]
        {
          selector: "JSXAttribute[name.name='className'] > Literal[value=/\\brounded-(xl|2xl|3xl|full)\\b/]",
          message:
            "[design-system] Non-standard border-radius. Use rounded-[var(--radius-sm)] (6px) or rounded-[var(--radius-md)] (10px) only.",
        },
        {
          selector: "JSXAttribute[name.name='className'] > Literal[value=/\\brounded-\\[[0-9]/]",
          message:
            "[design-system] Arbitrary px border-radius. Use rounded-[var(--radius-sm)] (6px) or rounded-[var(--radius-md)] (10px) only.",
        },

        // 3.2 — Semantic color discipline
        // Never use raw Tailwind color utilities for semantic states.
        // Use: --color-danger, --color-warning, --color-success, --color-info
        {
          selector:
            "JSXAttribute[name.name='className'] > Literal[value=/\\b(text|bg|border|ring)-(red|rose|amber|orange)-(400|500|600|700)\\b/]",
          message:
            "[design-system] Use semantic tokens: text-[var(--color-danger)] / bg-[var(--color-danger)]/10 for errors; text-[var(--color-warning)] for warnings.",
        },
        {
          selector:
            "JSXAttribute[name.name='className'] > Literal[value=/\\b(text|bg|border|ring)-(green|emerald)-(400|500|600|700)\\b/]",
          message:
            "[design-system] Use semantic tokens: text-[var(--color-success)] for positive states, text-[var(--color-accent)] for interactive.",
        },

        // 3.1 — Button component discipline
        // Inline button class strings must use <Button> variants instead.
        {
          selector:
            "JSXAttribute[name.name='className'] > Literal[value=/inline-flex[^'\"]*cursor-pointer[^'\"]*border[^'\"]*border-\\[var/]",
          message:
            "[design-system] Use <Button>, <SecondaryButton>, or <GhostButton> instead of inline button className.",
        },
      ],

      // 3.4 — Decorative SVG accessibility
      // ESLint cannot statically determine decorative vs. meaningful SVGs.
      // Enforced via code review checklist in CLAUDE.md (§ Code Review Checklist).
      // Rule: every <svg> needs aria-hidden="true" (decorative) or role="img" + <title> (meaningful).
    },
  },
]);

export default eslintConfig;
