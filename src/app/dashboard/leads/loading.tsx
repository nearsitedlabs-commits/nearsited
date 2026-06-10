"use client";

import { SkeletonLoader } from "@/lib/motion";

export default function LeadsLoading() {
  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Header — no eyebrow, no back link */}
        <div className="mb-8 flex items-start justify-between">
          <SkeletonLoader width="200px" height="32px" radius="6px" />
          <SkeletonLoader width="130px" height="40px" radius="8px" />
        </div>

        {/* KPI strip */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4">
              <SkeletonLoader width="48px" height="28px" radius="4px" />
              <SkeletonLoader className="mt-1" width="80px" height="12px" radius="4px" />
            </div>
          ))}
        </div>

        {/* Filter bar skeleton */}
        <div className="mb-4 flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonLoader key={i} width={`${60 + i * 20}px`} height="32px" radius="8px" />
          ))}
          <div className="ml-auto">
            <SkeletonLoader width="80px" height="32px" radius="8px" />
          </div>
        </div>

        {/* Search bar */}
        <div className="mb-4 flex items-center gap-3">
          <SkeletonLoader className="flex-1" height="40px" radius="8px" />
          <SkeletonLoader width="100px" height="40px" radius="8px" />
          <SkeletonLoader width="80px" height="40px" radius="8px" />
        </div>

        {/* Table skeleton — new column layout: checkbox, score, business, site, last audit, status, action */}
        <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-surface)]">
          {/* Table header */}
          <div className="border-b border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3">
            <div className="flex gap-3">
              <SkeletonLoader width="20px" height="14px" radius="4px" />
              <SkeletonLoader width="50px" height="14px" radius="4px" />
              <SkeletonLoader className="flex-1" height="14px" radius="4px" />
              <SkeletonLoader width="60px" height="14px" radius="4px" />
              <SkeletonLoader width="70px" height="14px" radius="4px" />
              <SkeletonLoader width="80px" height="14px" radius="4px" />
              <SkeletonLoader width="100px" height="14px" radius="4px" />
            </div>
          </div>

          {/* Table rows */}
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3"
            >
              <SkeletonLoader width="16px" height="16px" radius="3px" />
              <SkeletonLoader width="40px" height="40px" radius="50%" />
              <div className="flex-1 space-y-1">
                <SkeletonLoader width={`${45 + (i * 6) % 30}%`} height="14px" radius="4px" />
                <SkeletonLoader width={`${30 + (i * 5) % 20}%`} height="10px" radius="4px" />
              </div>
              <SkeletonLoader width="40px" height="14px" radius="4px" />
              <SkeletonLoader width="60px" height="14px" radius="4px" />
              <SkeletonLoader width="80px" height="24px" radius="12px" />
              <SkeletonLoader width="100px" height="28px" radius="8px" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
