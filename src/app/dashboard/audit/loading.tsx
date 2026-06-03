"use client";

import { SkeletonLoader } from "@/lib/motion";

export default function AuditLoading() {
  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Back link */}
        <SkeletonLoader width="120px" height="16px" radius="4px" />

        {/* Title */}
        <div className="mt-6">
          <SkeletonLoader width="200px" height="28px" radius="6px" />
          <SkeletonLoader className="mt-2" width="300px" height="14px" radius="4px" />
        </div>

        {/* URL input card */}
        <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--bg-surface-1)] p-6">
          <div className="flex gap-3">
            <SkeletonLoader className="flex-1" height="44px" radius="8px" />
            <SkeletonLoader width="160px" height="44px" radius="8px" />
          </div>
        </div>

        {/* Example card */}
        <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--bg-surface-1)] p-6">
          <SkeletonLoader width="80px" height="12px" radius="4px" />
          <SkeletonLoader className="mt-3" width="200px" height="20px" radius="6px" />
          <SkeletonLoader className="mt-2" width="280px" height="14px" radius="4px" />

          {/* Score preview */}
          <div className="mt-6 flex flex-col gap-4 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-2)] p-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <SkeletonLoader width="60px" height="48px" radius="6px" />
              <SkeletonLoader width="20px" height="16px" radius="4px" />
              <SkeletonLoader width="60px" height="48px" radius="6px" />
            </div>
            <SkeletonLoader className="sm:ml-auto" width="80px" height="48px" radius="8px" />
          </div>

          {/* Findings */}
          <div className="mt-6 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonLoader key={i} width={`${50 + i * 15}%`} height="14px" radius="4px" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
