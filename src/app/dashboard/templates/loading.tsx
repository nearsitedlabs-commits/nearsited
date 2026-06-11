"use client";

import { SkeletonLoader } from "@/lib/motion";

export default function TemplatesLoading() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-page)]">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Header */}
        <div className="mb-2">
          <SkeletonLoader width="100px" height="12px" radius="4px" />
        </div>
        <div className="mb-8 flex items-start justify-between">
          <div>
            <SkeletonLoader width="80px" height="12px" radius="4px" />
            <SkeletonLoader className="mt-1" width="240px" height="32px" radius="6px" />
            <SkeletonLoader className="mt-2" width="360px" height="14px" radius="4px" />
          </div>
        </div>

        {/* Empty state skeleton */}
        <div className="mx-auto max-w-lg rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-12 text-center">
          <SkeletonLoader className="mx-auto" width="48px" height="48px" radius="12px" />
          <SkeletonLoader className="mx-auto mt-6" width="200px" height="24px" radius="6px" />
          <SkeletonLoader className="mx-auto mt-3" width="280px" height="14px" radius="4px" />
          <SkeletonLoader className="mx-auto mt-8" width="160px" height="40px" radius="8px" />
        </div>
      </div>
    </div>
  );
}
