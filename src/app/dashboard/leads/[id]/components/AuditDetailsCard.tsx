"use client";

import { ChevronDown, Monitor, Smartphone } from "lucide-react";
import type { AuditRow } from "@/lib/db-types";
import { MetricKey, METRIC_META, metricColor } from "@/lib/metric-meta";
import { SubScore } from "./SubScore";

type Props = {
  strategy: "mobile" | "desktop";
  onStrategyChange: (s: "mobile" | "desktop") => void;
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
  strategy, onStrategyChange,
  mobileAudit, desktopAudit,
  desktopPerfScore, mobilePerfScore,
  uxDesignScoreVal, designScore, trustScoreVal, overall,
  showTechDetails, onToggleTechDetails,
}: Props) {
  const auditsToShow = [mobileAudit, desktopAudit].filter(Boolean) as AuditRow[];

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">
          {strategy === "mobile" ? "Mobile" : "Desktop"} Audit
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onStrategyChange("mobile")}
            className={`cursor-pointer rounded-lg px-2.5 py-1 text-xs font-medium transition-colors duration-150 ${strategy === "mobile" ? "bg-[var(--accent)] text-white" : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]"}`}
          >
            <Smartphone className="h-3 w-3 inline mr-1" />Mobile
          </button>
          <button
            onClick={() => onStrategyChange("desktop")}
            className={`cursor-pointer rounded-lg px-2.5 py-1 text-xs font-medium transition-colors duration-150 ${strategy === "desktop" ? "bg-[var(--accent)] text-white" : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]"}`}
          >
            <Monitor className="h-3 w-3 inline mr-1" />Desktop
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <SubScore label="Desktop Perf" score={desktopPerfScore} />
        <SubScore label="SEO"          score={(desktopAudit?.seo_score as number | null) ?? null} />
        <SubScore label="Mobile Perf"  score={mobilePerfScore} />
        <SubScore label="UX / Design"  score={uxDesignScoreVal || designScore || null} />
        <SubScore label="Trust"        score={trustScoreVal || null} />
        <SubScore label="Overall"      score={overall || null} />
      </div>

      <button
        onClick={onToggleTechDetails}
        className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-[var(--text-tertiary)] transition-colors duration-150 hover:text-[var(--text-secondary)]"
      >
        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-150 ${showTechDetails ? "rotate-180" : ""}`} />
        {showTechDetails ? "Hide" : "View"} Technical Details
      </button>

      {showTechDetails && auditsToShow.length > 0 && (
        <div className="mt-3 space-y-3">
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
  );
}
