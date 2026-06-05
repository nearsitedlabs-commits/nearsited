import { FadeIn } from "@/lib/motion";
import type { WebsiteStatus } from "@/lib/db-types";

export function WebPresenceBadge({ status }: { status: WebsiteStatus }) {
  const color =
    status === "no_website"    ? "var(--score-high)" :
    status === "social_only"   ? "var(--score-mid)" :
    status === "platform_only" ? "var(--badge-indigo-text)" :
    "var(--text-tertiary)";

  const DIM = 52;

  return (
    <FadeIn>
    <svg width={DIM} height={DIM} viewBox={`0 0 ${DIM} ${DIM}`} className="flex-shrink-0">
      <circle
        cx="26" cy="26" r="20"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeDasharray="3 3"
        opacity="0.35"
      />
      <text
        x="26" y="31" textAnchor="middle"
        fontSize="14" fontWeight="600"
        fill={color}
        fontFamily="var(--font-sans, Geist)"
      >
        —
      </text>
    </svg>
    </FadeIn>
  );
}
