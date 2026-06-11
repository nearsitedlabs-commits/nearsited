import { IMPACT_PILL_STYLES } from "@/lib/ui-constants";

export function ImpactPill({ impact }: { impact: string }) {
  const style = IMPACT_PILL_STYLES[impact] ?? IMPACT_PILL_STYLES.Low;
  return (
    <span className={`inline-flex items-center rounded-[var(--radius-sm)] border px-2 py-0.5 text-[10px] font-semibold uppercase ${style}`}>
      {impact}
    </span>
  );
}