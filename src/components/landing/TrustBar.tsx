import { FadeUp } from "@/lib/motion";

const ITEMS = [
  "Live discovery across 29,000+ cities",
  "Built by a solo founder tired of prospecting manually",
  "From city search to ready-to-send pitch in under 2 minutes",
];

const TRUST_DOTS = [
  { size: "h-2.5 w-2.5", opacity: "opacity-40" },
  { size: "h-3 w-3", opacity: "opacity-60" },
  { size: "h-2 w-2", opacity: "opacity-30" },
  { size: "h-3.5 w-3.5", opacity: "opacity-50" },
  { size: "h-2.5 w-2.5", opacity: "opacity-35" },
];

export function TrustBar() {
  return (
    <FadeUp>
      <div className="border-y border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)]">
        <div className="mx-auto max-w-7xl px-6 py-5 md:px-8">
          <ul className="flex flex-col items-center gap-3 text-sm text-[var(--color-text-tertiary)] sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-6 sm:gap-y-2">
            {ITEMS.map((item, i) => (
              <li key={i} className="flex items-center gap-2">
                {i > 0 && <span className="hidden sm:inline text-[var(--color-border-strong)]" aria-hidden="true">·</span>}
                {item}
              </li>
            ))}
          </ul>

          {/* Placeholder trust indicator dots — customer logos coming soon */}
          <div className="mt-4 flex items-center justify-center gap-3" aria-hidden="true">
            {TRUST_DOTS.map((dot, i) => (
              <span
                key={i}
                className={`${dot.size} rounded-full bg-[var(--color-accent)] ${dot.opacity}`}
              />
            ))}
          </div>
          <p className="mt-2 text-center text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]/50">
            Trusted by agencies worldwide
          </p>
        </div>
      </div>
    </FadeUp>
  );
}
