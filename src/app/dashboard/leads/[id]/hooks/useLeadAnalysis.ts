"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { PitchResult } from "./usePitchGeneration";

export const AUDIT_STEP_KEYS = ["fetching", "mobile", "desktop", "audit_complete"] as const;

export const ANALYSE_STEPS: { key: string; label: string }[] = [
  { key: "fetching",           label: "Fetching site data" },
  { key: "mobile",             label: "Running Mobile PageSpeed" },
  { key: "desktop",            label: "Running Desktop PageSpeed" },
  { key: "audit_complete",     label: "Performance audit complete" },
  { key: "screenshot_mobile",  label: "Taking Mobile screenshot" },
  { key: "screenshot_desktop", label: "Taking Desktop screenshot" },
  { key: "analysing_mobile",   label: "Analysing Mobile design" },
  { key: "analysing_desktop",  label: "Analysing Desktop design" },
  { key: "design_complete",    label: "Analysis complete" },
];

export function useLeadAnalysis({
  businessId,
  website,
  websiteStatus,
  pitchTone,
  pitchLength,
  showToast,
  setQuotaError,
  startQuotaTimer,
  onPitchResult,
}: {
  businessId: string;
  website: string | null;
  websiteStatus: string;
  pitchTone: string;
  pitchLength: string;
  showToast: (msg: string) => void;
  setQuotaError: (error: string | null) => void;
  startQuotaTimer: (seconds: number) => void;
  onPitchResult: (result: PitchResult) => void;
}) {
  const router = useRouter();
  const [runningDesign, setRunningDesign] = useState(false);
  const [runningFullAnalysis, setRunningFullAnalysis] = useState(false);
  const [completedKeys, setCompletedKeys] = useState<string[]>([]);
  const [activeKeys, setActiveKeys] = useState<string[]>([]);
  const [designError, setDesignError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleRunDesign = useCallback(async () => {
    if (!website) return;
    setRunningDesign(true);
    try {
      const res = await fetch("/api/analyze-design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, website }),
      });
      if (res.ok && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let isQuotaError = false;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.trim()) continue;
            let chunk: Record<string, unknown> | null = null;
            try { chunk = JSON.parse(line); } catch { continue; }
            if (!chunk) continue;
            if (chunk.type === "error" && chunk.error === "AI_QUOTA_EXCEEDED") isQuotaError = true;
            else if (chunk.type === "error" && chunk.message) {
              console.error("[LEAD] Design API error:", chunk.message);
              showToast(`Design analysis failed — ${chunk.message as string}`);
            }
          }
        }
        if (isQuotaError) {
          setQuotaError("AI quota exceeded — please wait a moment and try again");
          startQuotaTimer(60);
          return;
        }
      }
      router.refresh();
    } catch (err) {
      console.error("[LEAD] Design analysis failed:", err);
      showToast("Design analysis failed — please try again.");
    } finally {
      setRunningDesign(false);
    }
  }, [businessId, website, router, showToast, setQuotaError, startQuotaTimer]);

  const handleFullAnalysis = useCallback(async () => {
    if (!website) return;
    console.log("[LEAD] handleFullAnalysis START", { id: businessId, website });
    setRunningFullAnalysis(true);
    setCompletedKeys([]);
    setActiveKeys([]);

    try {
      const abortController = new AbortController();
      abortControllerRef.current = abortController;
      const { signal } = abortController;

      // Phase 1: Audit stream
      console.log("[LEAD] Phase 1: fetching /api/audit...");
      const auditRes = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, website }),
        signal,
      });

      if (!auditRes.ok) {
        const errBody = await auditRes.json().catch(() => null);
        throw new Error(errBody?.error ?? `Audit failed (${auditRes.status})`);
      }

      if (auditRes.body) {
        const reader = auditRes.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
          if (signal.aborted) return;
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.trim()) continue;
            let parsed: Record<string, unknown> | null = null;
            try { parsed = JSON.parse(line); } catch { continue; }
            if (!parsed) continue;
            if (parsed.type === "progress" && parsed.step) {
              const key = parsed.step === "complete" ? "audit_complete" : parsed.step as string;
              setActiveKeys((prev) => (prev.includes(key) ? prev : [...prev, key]));
            } else if (parsed.type === "result") {
              setCompletedKeys([...AUDIT_STEP_KEYS]);
              setActiveKeys([]);
            } else if (parsed.type === "error") {
              throw new Error((parsed.message as string) ?? "Audit failed");
            }
          }
        }
      }

      // Phase 2: Design stream
      console.log("[LEAD] Phase 2: fetching /api/analyze-design...");
      const designRes = await fetch("/api/analyze-design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, website }),
        signal,
      });

      if (!designRes.ok) {
        const errBody = await designRes.json().catch(() => null);
        throw new Error(errBody?.error ?? `Design analysis failed (${designRes.status})`);
      }

      let designSucceeded = false;
      if (designRes.body) {
        const reader = designRes.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
          if (signal.aborted) return;
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.trim()) continue;
            let parsed: Record<string, unknown> | null = null;
            try { parsed = JSON.parse(line); } catch { continue; }
            if (!parsed) continue;
            if (parsed.type === "progress" && parsed.step) {
              const key = parsed.step === "complete" ? "design_complete" : parsed.step as string;
              setActiveKeys((prev) => (prev.includes(key) ? prev : [...prev, key]));
            } else if (parsed.type === "result") {
              setCompletedKeys(ANALYSE_STEPS.map((s) => s.key));
              setActiveKeys([]);
              setDesignError(null);
              designSucceeded = true;
            } else if (parsed.type === "cached") {
              setCompletedKeys(ANALYSE_STEPS.map((s) => s.key));
              setActiveKeys([]);
              setDesignError(null);
              designSucceeded = true;
            } else if (parsed.type === "error") {
              if ((parsed.error as string | undefined) === "AI_QUOTA_EXCEEDED") {
                setQuotaError("AI quota exceeded — please wait a moment and try again");
                startQuotaTimer(60);
                showToast("Performance audit saved — design analysis blocked by AI quota");
                router.refresh();
                return;
              }
              throw new Error((parsed.message as string) ?? "Design analysis failed");
            }
          }
        }
      }

      if (designSucceeded) {
        showToast("Analysis complete — scores updated");
      } else {
        // Design phase returned no result (e.g. cache hit returned plain JSON, not NDJSON)
        // Audit still succeeded so show partial success
        showToast("Performance audit complete — run design analysis to get full scores");
        setDesignError("Design analysis did not complete. Use the button above to retry.");
      }

      // Auto-generate pitch fire-and-forget
      fetch("/api/pitch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, tone: pitchTone, length: pitchLength, lead_type: websiteStatus }),
      }).then(async (pitchRes) => {
        if (pitchRes.ok) {
          const pitchData = await pitchRes.json();
          if (pitchData.success && pitchData.pitch && typeof pitchData.pitch.subject === "string" && typeof pitchData.pitch.body === "string") {
            onPitchResult({ subject: pitchData.pitch.subject, body: pitchData.pitch.body });
            showToast("Fresh pitch generated with new data");
          }
        }
      }).catch((pitchErr) => {
        console.warn("[LEAD] Pitch auto-generation failed:", pitchErr);
      });

      window.dispatchEvent(new CustomEvent("credits:updated"));
      router.refresh();
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        console.log("[LEAD] handleFullAnalysis aborted by user");
        return;
      }
      console.error("[LEAD] Full analysis failed:", err);
      showToast("Analysis failed — please try again.");
    } finally {
      setRunningFullAnalysis(false);
      abortControllerRef.current = null;
    }
  }, [businessId, website, websiteStatus, pitchTone, pitchLength, router, showToast, onPitchResult]);

  const handleCancelAnalysis = useCallback(() => {
    const controller = abortControllerRef.current;
    if (controller) {
      controller.abort();
      abortControllerRef.current = null;
    }
    setRunningFullAnalysis(false);
    setCompletedKeys([]);
    setActiveKeys([]);
    setDesignError(null);
    showToast("Analysis cancelled");
  }, [showToast]);

  return {
    runningDesign,
    runningFullAnalysis,
    completedKeys,
    activeKeys,
    designError,
    handleRunDesign,
    handleFullAnalysis,
    handleCancelAnalysis,
  };
}
