"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { AlertTriangle } from "lucide-react";

export default function TemplatesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Templates error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-8">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
          <AlertTriangle className="h-6 w-6 text-red-400" />
        </div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          Something went wrong
        </h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
        <Button
          variant="primary"
          onClick={reset}
          className="mt-6"
        >
          Try again
        </Button>
      </div>
    </div>
  );
}
