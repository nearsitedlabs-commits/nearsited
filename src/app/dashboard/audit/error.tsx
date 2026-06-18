"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { AlertTriangle } from "lucide-react";

export default function AuditError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[AUDIT] Unhandled error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-danger)]/10">
        <AlertTriangle className="h-5 w-5 text-[var(--color-danger)]" aria-hidden="true" />
      </div>
      <div className="space-y-1.5">
        <h2 className="text-base font-medium text-[var(--color-text-primary)]">
          Audit couldn&rsquo;t run
        </h2>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Something went wrong. Check the URL is reachable and try again.
        </p>
      </div>
      <div className="flex gap-3">
        <Button variant="secondary" onClick={reset}>Try again</Button>
      </div>
    </div>
  );
}
