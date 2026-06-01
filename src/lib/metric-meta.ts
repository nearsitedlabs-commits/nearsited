/**
 * Nearsited Metric Metadata — Single Source of Truth
 *
 * Defines the four Core Web Vitals / Lighthouse metrics used across
 * the audit and lead-detail pages. Import this instead of duplicating.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export type MetricKey = "fcp" | "lcp" | "tbt" | "cls";

export type MetricMeta = {
  label: string;
  subtitle: string;
  thresholds: [number, number];
  toCanonical: (raw: string) => number;
};

// ── Registry ──────────────────────────────────────────────────────────────────

export const METRIC_META: Record<MetricKey, MetricMeta> = {
  fcp: {
    label: "First Contentful Paint (FCP)",
    subtitle: "Time until first content appears",
    thresholds: [1.8, 3],
    toCanonical: (raw) => {
      const n = parseFloat(raw.replace(/[^\d.]/g, ""));
      return raw.toLowerCase().includes("ms") ? n / 1000 : n;
    },
  },
  lcp: {
    label: "Largest Contentful Paint (LCP)",
    subtitle: "Time until main content loads",
    thresholds: [2.5, 4],
    toCanonical: (raw) => {
      const n = parseFloat(raw.replace(/[^\d.]/g, ""));
      return raw.toLowerCase().includes("ms") ? n / 1000 : n;
    },
  },
  tbt: {
    label: "Total Blocking Time (TBT)",
    subtitle: "Time the page is unresponsive to input",
    thresholds: [200, 600],
    toCanonical: (raw) => {
      const n = parseFloat(raw.replace(/[^\d.]/g, ""));
      const lower = raw.toLowerCase();
      if (!lower.includes("ms") && lower.includes("s")) return n * 1000;
      return n;
    },
  },
  cls: {
    label: "Cumulative Layout Shift (CLS)",
    subtitle: "How much the page jumps around while loading",
    thresholds: [0.1, 0.25],
    toCanonical: (raw) => parseFloat(raw.replace(/[^\d.]/g, "")),
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Returns a Tailwind text-colour class based on whether the raw metric value
 * is "good" (green), "needs improvement" (amber), or "poor" (red).
 */
export function metricColor(key: MetricKey, rawValue: string | null | undefined): string {
  if (!rawValue) return "text-[var(--text-secondary)]";
  const meta = METRIC_META[key];
  const val = meta.toCanonical(rawValue);
  if (isNaN(val)) return "text-[var(--text-secondary)]";
  return val < meta.thresholds[0] ? "text-[var(--score-good)]"
       : val < meta.thresholds[1] ? "text-[var(--score-mid)]"
       : "text-[var(--score-high)]";
}
