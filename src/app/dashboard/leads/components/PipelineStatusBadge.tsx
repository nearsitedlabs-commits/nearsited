import { Pill, type PillVariant } from "@/components/ui/Pill";
import type { OpportunityStatus } from "./types";

const STATUS_CONFIG: Record<OpportunityStatus, { label: string; variant: PillVariant }> = {
  new:         { label: "New",         variant: "info" },
  audited:     { label: "Audited",     variant: "neutral" },
  pitched:     { label: "Pitched",     variant: "info" },
  in_pipeline: { label: "In pipeline", variant: "info" },
  won:         { label: "Won",         variant: "success" },
  lost:        { label: "Lost",        variant: "danger" },
  archived:    { label: "Archived",    variant: "neutral" },
};

export function PipelineStatusBadge({ status }: { status: OpportunityStatus | undefined }) {
  const cfg = status ? STATUS_CONFIG[status] : STATUS_CONFIG.new;
  return (
    <Pill variant={cfg.variant} size="sm" dot display="status">
      {cfg.label}
    </Pill>
  );
}
PipelineStatusBadge.displayName = "PipelineStatusBadge";
