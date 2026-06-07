"use client";

import { useCallback, useState } from "react";
import type { WebsiteStatus } from "@/lib/db-types";

export type PitchResult = { subject: string; body: string };

export function usePitchGeneration({
  businessId,
  websiteStatus,
  showToast,
  setQuotaError,
  startQuotaTimer,
  savedPitch,
}: {
  businessId: string;
  websiteStatus: WebsiteStatus;
  showToast: (msg: string) => void;
  setQuotaError: (error: string | null) => void;
  startQuotaTimer: (seconds: number) => void;
  savedPitch: PitchResult | null;
}) {
  const [generatingPitch, setGeneratingPitch] = useState(false);
  const [pitchResult, setPitchResult] = useState<PitchResult | null>(savedPitch);
  const [pitchError, setPitchError] = useState<string | null>(null);
  const [pitchTone, setPitchTone] = useState("professional");
  const [pitchLength, setPitchLength] = useState("medium");
  const [pitchFocus, setPitchFocus] = useState("all");
  const [pitchOpening, setPitchOpening] = useState("direct");
  const [pitchUrgency, setPitchUrgency] = useState("medium");
  const [outreachChannel, setOutreachChannel] = useState<"email" | "whatsapp">("email");

  const handleGeneratePitch = useCallback(async (force = true) => {
    setGeneratingPitch(true);
    setPitchError(null);
    try {
      console.log("[LEAD] Generating pitch:", { businessId, tone: pitchTone, length: pitchLength, channel: outreachChannel, website_status: websiteStatus, force });
      const res = await fetch("/api/pitch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          tone: pitchTone,
          length: pitchLength,
          channel: outreachChannel,
          focus: pitchFocus,
          opening: pitchOpening,
          urgency: pitchUrgency,
          force,
        }),
      });
      if (res.status === 429) {
        const data = await res.json().catch(() => ({}));
        setQuotaError("AI quota exceeded — please wait a moment and try again");
        startQuotaTimer((data as { retryAfter?: number }).retryAfter ?? 60);
        return;
      }
      const data = await res.json();
      if (data.success && data.pitch && typeof data.pitch.subject === "string" && typeof data.pitch.body === "string") {
        setPitchResult({ subject: data.pitch.subject, body: data.pitch.body });
      } else if (data.success && data.pitch) {
        console.warn("[LEAD] Pitch API returned unexpected format:", data.pitch);
        setPitchError("Pitch data format error — please try again.");
      } else {
        setPitchError(data.error ?? data.message ?? "Pitch generation failed. Please try again.");
      }
    } catch (err) {
      console.error("[LEAD] Pitch generation failed:", err);
      setPitchError("Network error — please check your connection and try again.");
    } finally {
      setGeneratingPitch(false);
    }
  }, [businessId, pitchTone, pitchLength, outreachChannel, pitchFocus, pitchOpening, pitchUrgency, setQuotaError, startQuotaTimer]);

  const handleCopyPitch = useCallback(() => {
    if (!pitchResult) {
      showToast("Generate a pitch first");
      return;
    }
    navigator.clipboard.writeText(pitchResult.body).then(() => {
      showToast("Pitch copied to clipboard");
    });
  }, [pitchResult, showToast]);

  return {
    generatingPitch,
    pitchResult,
    setPitchResult,
    pitchError,
    pitchTone, setPitchTone,
    pitchLength, setPitchLength,
    pitchFocus, setPitchFocus,
    pitchOpening, setPitchOpening,
    pitchUrgency, setPitchUrgency,
    outreachChannel, setOutreachChannel,
    handleGeneratePitch,
    handleCopyPitch,
  };
}
