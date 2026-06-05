import { useCallback, useState } from "react";
import { ANALYSE_STEPS } from "../components/types";

type AnalyseProgress = { step: number; phase: string; label: string; error?: string };

type UseLeadInlineAnalysisResult = {
  analysingIds: Set<string>;
  analyseProgress: Map<string, AnalyseProgress>;
  handleAnalyse: (leadId: string, website: string) => Promise<void>;
};

export function useLeadInlineAnalysis(): UseLeadInlineAnalysisResult {
  const [analysingIds, setAnalysingIds] = useState<Set<string>>(new Set());
  const [analyseProgress, setAnalyseProgress] = useState<Map<string, AnalyseProgress>>(new Map());

  const readStream = useCallback(async (
    res: Response,
    leadId: string,
    phase: string,
    onProgress: (stepIndex: number) => void,
  ): Promise<boolean> => {
    const reader = res.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let buffer = "";
    let hasQuotaError = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line);
          if (parsed.type === "progress" && parsed.step) {
            const key = parsed.step === "complete"
              ? (phase === "audit" ? "audit_complete" : "design_complete")
              : parsed.step;
            const idx = ANALYSE_STEPS.findIndex((s) => s.key === key);
            if (idx !== -1) onProgress(idx);
          } else if (parsed.type === "error" && parsed.error === "AI_QUOTA_EXCEEDED") {
            hasQuotaError = true;
          }
        } catch {
          // skip malformed lines
        }
      }
    }
    return hasQuotaError;
  }, []);

  const handleAnalyse = useCallback(async (leadId: string, website: string) => {
    setAnalysingIds((prev) => new Set(prev).add(leadId));
    setAnalyseProgress((prev) => {
      const next = new Map(prev);
      next.set(leadId, { step: 0, phase: "audit", label: ANALYSE_STEPS[0].label });
      return next;
    });

    let quotaError = false;

    try {
      const auditRes = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: leadId, website, force: true }),
      });

      if (!auditRes.ok) throw new Error("Audit failed");

      quotaError = await readStream(auditRes, leadId, "audit", (idx) => {
        setAnalyseProgress((prev) => {
          const next = new Map(prev);
          next.set(leadId, { step: idx, phase: "audit", label: ANALYSE_STEPS[idx].label });
          return next;
        });
      });

      if (quotaError) {
        setAnalyseProgress((prev) => {
          const next = new Map(prev);
          next.set(leadId, { step: 0, phase: "audit", label: ANALYSE_STEPS[0].label, error: "AI quota exceeded — please wait a moment and try again" });
          return next;
        });
        return;
      }

      const designRes = await fetch("/api/analyze-design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: leadId, website, force: true }),
      });

      if (!designRes.ok) throw new Error("Design analysis failed");

      quotaError = await readStream(designRes, leadId, "design", (idx) => {
        setAnalyseProgress((prev) => {
          const next = new Map(prev);
          next.set(leadId, { step: idx, phase: "design", label: ANALYSE_STEPS[idx].label });
          return next;
        });
      });

      if (quotaError) {
        setAnalyseProgress((prev) => {
          const next = new Map(prev);
          next.set(leadId, { step: 0, phase: "design", label: ANALYSE_STEPS[0].label, error: "AI quota exceeded — please wait a moment and try again" });
          return next;
        });
        return;
      }

      setAnalyseProgress((prev) => {
        const next = new Map(prev);
        next.set(leadId, { step: ANALYSE_STEPS.length - 1, phase: "done", label: "Analysis complete" });
        return next;
      });
    } catch (err) {
      console.error("[LEADS] Analysis failed for", leadId, err);
      setAnalyseProgress((prev) => {
        const next = new Map(prev);
        next.set(leadId, { step: 0, phase: "error", label: "Analysis failed", error: err instanceof Error ? err.message : "Unknown error" });
        return next;
      });
    } finally {
      setAnalysingIds((prev) => {
        const next = new Set(prev);
        next.delete(leadId);
        return next;
      });
    }
  }, [readStream]);

  return { analysingIds, analyseProgress, handleAnalyse };
}
