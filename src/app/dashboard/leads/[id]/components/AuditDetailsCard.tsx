"use client";

import { ChevronDown } from "lucide-react";
import type { AuditRow } from "@/lib/db-types";
import { MetricKey, METRIC_META, metricColor } from "@/lib/metric-meta";
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
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 sm:p-6">
      <button
        onClick={onToggleTechDetails}
        className="inline-flex w-full cursor-pointer items-center gap-1.5 text-sm font-medium text-[var(--text-secondary)] transition-colors duration-150 hover:text-[var(--text-primary)]"
      >
        <ChevronDown className={`h-4 w-4 transition-transform duration-150 ${showTechDetails ? "rotate-180" : ""}`} />
        {showTechDetails ? "Hide" : "View"} Technical Details
      </button>

      {showTechDetails && (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <SubScore label="Desktop Perf" score={desktopPerfScore} />
            <SubScore label="SEO"          score={(desktopAudit?.seo_score as number | null) ?? null} />
            <SubScore label="Mobile Perf"  score={mobilePerfScore} />
            <SubScore label="UX / Design"  score={uxDesignScoreVal || designScore || null} />
            <SubScore label="Trust"        score={trustScoreVal || null} />
            <SubScore label="Overall"      score={overall || null} />
          </div>

          {auditsToShow.length > 0 && (
            <div className="space-y-3">
              {auditsToShow.map((audit) => (
                <div key={audit.id as string} className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-3">
                  <p className="text-xs font-medium text-[var(--text-primary)] mb-2">
                    {audit.strategy === "mobile" ? "Mobile" : "Desktop"} Web Vitals
                  </p>
                  <div className="space-y-2">
                    {(["fcp", "lcp", "tbt", "cls"] as MetricKey[]).map((metric) => {
                      const rawVal = audit[metric] as string | null | undefined;
                      const colorClass = metricColor(metric, rawVal);
                      const meta = METRIC_META[metric];
                      return (
                        <div key={metric} className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-[var(--text-primary)]">{meta.label}</p>
                            <p className="text-[10px] text-[var(--text-tertiary)]">{meta.subtitle}</p>
                          </div>
                          <span className={`text-xs font-bold ${colorClass}`}>{rawVal ?? "—"}</span>
                        </div>
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
