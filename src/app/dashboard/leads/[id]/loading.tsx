"use client";

import { SkeletonLoader } from "@/lib/motion";

export default function LeadDetailLoading() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-page)]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Back link */}
        <SkeletonLoader width="100px" height="16px" radius="4px" />

        {/* Header */}
        <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1">
            <SkeletonLoader width="100px" height="12px" radius="4px" />
            <SkeletonLoader className="mt-2" width="300px" height="36px" radius="6px" />
            <SkeletonLoader className="mt-2" width="240px" height="14px" radius="4px" />
          </div>
          <div className="flex gap-2">
            <SkeletonLoader width="100px" height="32px" radius="8px" />
            <SkeletonLoader width="130px" height="32px" radius="8px" />
          </div>
        </div>

        {/* Score strip */}
        <div className="my-8 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-6">
          <div className="flex items-center justify-center gap-8">
            <div className="flex flex-col items-center gap-2">
              <SkeletonLoader width="72px" height="72px" radius="50%" />
              <SkeletonLoader width="80px" height="12px" radius="4px" />
            </div>
            <SkeletonLoader width="24px" height="24px" radius="4px" />
            <div className="flex flex-col items-center gap-2">
              <SkeletonLoader width="72px" height="72px" radius="50%" />
              <SkeletonLoader width="80px" height="12px" radius="4px" />
            </div>
            <SkeletonLoader width="24px" height="24px" radius="4px" />
            <div className="flex flex-col items-center gap-2">
              <SkeletonLoader width="60px" height="48px" radius="6px" />
              <SkeletonLoader width="80px" height="12px" radius="4px" />
            </div>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left column */}
          <div className="space-y-6">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-6">
                <SkeletonLoader width={`${40 + s * 15}%`} height="16px" radius="4px" />
                <div className="mt-4 space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <SkeletonLoader key={i} width={`${50 + i * 15}%`} height="12px" radius="4px" />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {[1, 2, 3].map((s) => (
              <div key={s} className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-6">
                <SkeletonLoader width={`${35 + s * 10}%`} height="16px" radius="4px" />
                <div className="mt-4 space-y-2">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <SkeletonLoader key={i} width={`${60 + i * 20}%`} height="36px" radius="8px" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
