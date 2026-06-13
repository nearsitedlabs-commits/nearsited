"use client";

import { SkeletonLoader } from "@/lib/motion";

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-page)]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Header skeleton */}
        <div className="mb-8">
          <SkeletonLoader width="80px" height="12px" radius="4px" />
          <SkeletonLoader className="mt-3" width="280px" height="32px" radius="6px" />
        </div>

        {/* KPI cards skeleton */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-4">
              <SkeletonLoader width="32px" height="32px" radius="8px" />
              <SkeletonLoader className="mt-3" width="48px" height="28px" radius="4px" />
              <SkeletonLoader className="mt-2" width="80px" height="12px" radius="4px" />
            </div>
          ))}
        </div>

        {/* Recent opportunities skeleton */}
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-6">
          <div className="mb-4 flex items-center justify-between">
            <SkeletonLoader width="140px" height="16px" radius="4px" />
            <SkeletonLoader width="60px" height="14px" radius="4px" />
          </div>
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-[var(--radius-sm)] bg-[var(--color-bg-elevated)] p-3">
                <SkeletonLoader width="36px" height="36px" radius="50%" />
                <div className="flex-1">
                  <SkeletonLoader width={`${50 + i * 10}%`} height="14px" radius="4px" />
                  <SkeletonLoader className="mt-1.5" width={`${30 + i * 8}%`} height="11px" radius="4px" />
                </div>
                <SkeletonLoader width="60px" height="22px" radius="999px" />
              </div>
            ))}
          </div>
        </div>

        {/* Pipeline skeleton */}
        <div className="mt-6 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-6">
          <div className="mb-4 flex items-center justify-between">
            <SkeletonLoader width="120px" height="16px" radius="4px" />
            <SkeletonLoader width="60px" height="14px" radius="4px" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <div className="mb-1 flex items-center justify-between">
                  <SkeletonLoader width="80px" height="14px" radius="4px" />
                  <SkeletonLoader width="20px" height="14px" radius="4px" />
                </div>
                <SkeletonLoader height="8px" radius="999px" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
