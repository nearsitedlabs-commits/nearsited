"use client";

import { EmptyState } from "@/components/ui/EmptyState";
import Link from "next/link";

export default function TemplatesPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-page)]">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <EmptyState
          title="Templates"
          description="Save and reuse pitch templates, report layouts, and outreach sequences. Coming soon."
          action={
            <Link
              href="/dashboard"
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] px-3 py-2 text-xs font-medium text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-accent)]/40 hover:text-[var(--color-accent)]"
            >
              Back to Dashboard
            </Link>
          }
        />
      </div>
    </div>
  );
}
