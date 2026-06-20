"use client";

import { ChevronDown } from "lucide-react";
import type { AuditRow } from "@/lib/db-types";
import { MetricKey, METRIC_META, metricColor } from "@/lib/metric-meta";
import { ListRow } from "@/components/ui/ListRow";
import { SubScore } from "./SubScore";

type Props = {
  mobileAudit: AuditRow | undefined;
  desktopAudit: AuditRow | undefined;
  desktopPerfScore: number | null;
  mobilePerfScore: number | null;
  uxDesignScoreVal: number;
  designScore: number;
  trustScoreVal: number;
  overall: number;
  showTechDetails: boolean;
  onToggleTechDetails: () => void;
};

export function AuditDetailsCard({
  mobileAudit, desktopAudit,
  desktopPerfScore, mobilePerfScore,
  uxDesignScoreVal, designScore, trustScoreVal, overall,
  showTechDetails, onToggleTechDetails,
}: Props) {
  const auditsToShow = [mobileAudit, desktopAudit].filter(Boolean) as AuditRow[];

  return (
    <div className="rounded-[var(--radius-md)] bg-[var(--color-bg-surface)] p-5 sm:p-6">
      <button
        onClick={onToggleTechDetails}
        className="inline-flex w-full cursor-pointer items-center gap-1.5 text-sm font-medium text-[var(--color-text-secondary)] transition-colors duration-150 hover:text-[var(--color-text-primary)]"
      >
        <ChevronDown className={`h-4 w-4 transition-transform duration-150 ${showTechDetails ? "rotate-180" : ""}`} />
        {showTechDetails ? "Hide" : "View"} Technical Details
      </button>

      {showTechDetails && (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <SubScore label="Desktop Perf" score={desktopPerfScore} />
            <SubScore label="SEO"          score={(desktopAudit?.seo_score as number | null) ?? null} />
            <SubScore label="Mobile Perf"  score={mobilePerfScore} />
            <SubScore label="UX / Design"  score={uxDesignScoreVal || designScore || null} />
            <SubScore label="Trust"        score={trustScoreVal || null} />
            <SubScore label="Overall"      score={overall || null} />
          </div>

          {auditsToShow.length > 0 && (
            <div className="space-y-4">
              {auditsToShow.map((audit) => (
                <div key={audit.id as string}>
                  <p className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
                    {audit.strategy === "mobile" ? "Mobile" : "Desktop"} Web Vitals
                  </p>
                  <div className="overflow-hidden rounded-[var(--radius-sm)] bg-[var(--color-bg-elevated)]">
                    {(["fcp", "lcp", "tbt", "cls"] as MetricKey[]).map((metric) => {
                      const rawVal = audit[metric] as string | null | undefined;
                      const colorClass = metricColor(metric, rawVal);
                      const meta = METRIC_META[metric];
                      return (
                        <ListRow
                          key={metric}
                          title={meta.label}
                          subtitle={meta.subtitle}
                          trailing={
                            <span className={`text-xs font-bold tabular-nums ${colorClass}`}>{rawVal ?? "—"}</span>
                          }
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
