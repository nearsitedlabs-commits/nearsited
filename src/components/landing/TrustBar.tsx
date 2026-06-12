import { FadeUp } from "@/lib/motion";

const ITEMS = [
  "Live discovery across 29,000+ cities",
  "Built by a solo founder tired of prospecting manually",
  "From city search to ready-to-send pitch in under 2 minutes",
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
        </div>
      </div>
    </FadeUp>
  );
}
