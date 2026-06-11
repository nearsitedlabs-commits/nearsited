"use client";

import { SkeletonLoader } from "@/lib/motion";

export default function PipelineLoading() {
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
            <SkeletonLoader className="mt-1" width="200px" height="32px" radius="6px" />
          </div>
          <div className="flex gap-2">
            <SkeletonLoader width="120px" height="36px" radius="8px" />
            <SkeletonLoader width="80px" height="36px" radius="8px" />
          </div>
        </div>

        {/* Pipeline kanban skeleton */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, col) => (
            <div key={col} className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-4">
              {/* Column header */}
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SkeletonLoader width="80px" height="16px" radius="4px" />
                  <SkeletonLoader width="24px" height="24px" radius="50%" />
                </div>
              </div>

              {/* Cards */}
              <div className="space-y-3">
                {Array.from({ length: 2 + (col % 3) }).map((_, card) => (
                  <div key={card} className="rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] p-3">
                    <SkeletonLoader width={`${60 + card * 10}%`} height="14px" radius="4px" />
                    <SkeletonLoader className="mt-2" width="80%" height="11px" radius="4px" />
                    <div className="mt-3 flex items-center gap-2">
                      <SkeletonLoader width="44px" height="44px" radius="50%" />
                      <div className="flex-1">
                        <SkeletonLoader width="60%" height="12px" radius="4px" />
                        <SkeletonLoader className="mt-1" width="40%" height="10px" radius="4px" />
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <SkeletonLoader width="60px" height="20px" radius="6px" />
                      <SkeletonLoader width="40px" height="20px" radius="6px" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
