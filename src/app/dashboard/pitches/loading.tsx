"use client";

import { SkeletonLoader } from "@/lib/motion";

export default function PitchesLoading() {
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
            <SkeletonLoader width="100px" height="36px" radius="8px" />
            <SkeletonLoader width="80px" height="36px" radius="8px" />
          </div>
        </div>

        {/* Search bar */}
        <div className="mb-6 flex items-center gap-3">
          <SkeletonLoader className="flex-1" height="40px" radius="8px" />
          <SkeletonLoader width="100px" height="40px" radius="8px" />
        </div>

        {/* Pitch cards grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-5">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <SkeletonLoader width={`${50 + (i * 8) % 40}%`} height="16px" radius="4px" />
                  <SkeletonLoader className="mt-1.5" width="70%" height="12px" radius="4px" />
                </div>
                <SkeletonLoader width="60px" height="22px" radius="999px" />
              </div>

              {/* Preview */}
              <div className="mt-4 space-y-1.5">
                <SkeletonLoader width="100%" height="10px" radius="4px" />
                <SkeletonLoader width="95%" height="10px" radius="4px" />
                <SkeletonLoader width="85%" height="10px" radius="4px" />
                <SkeletonLoader width="60%" height="10px" radius="4px" />
              </div>

              {/* Meta */}
              <div className="mt-4 flex items-center gap-2">
                <SkeletonLoader width="70px" height="20px" radius="6px" />
                <SkeletonLoader width="60px" height="20px" radius="6px" />
                <div className="ml-auto flex gap-1">
                  <SkeletonLoader width="28px" height="28px" radius="6px" />
                  <SkeletonLoader width="28px" height="28px" radius="6px" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
