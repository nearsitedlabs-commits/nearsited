import type { OpportunityStatus } from "./types";
import { STATUS_BADGE } from "./types";

export function PipelineStatusBadge({ status }: { status: OpportunityStatus | undefined }) {
  if (!status) {
    return (
      <span className="inline-block whitespace-nowrap rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-[10px] font-medium text-blue-400 transition-all duration-300">
        New
      </span>
    );
  }
  const cfg = STATUS_BADGE[status];
  return (
    <span className={`inline-block whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-medium transition-all duration-300 ${cfg.class}`}>
      {cfg.label}
    </span>
  );
}
