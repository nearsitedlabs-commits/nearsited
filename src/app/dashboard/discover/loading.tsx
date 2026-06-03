"use client";

import { SkeletonLoader } from "@/lib/motion";

export default function DiscoverLoading() {
  return (
    <div className="min-h-screen bg-[var(--bg-base)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <SkeletonLoader width="100px" height="12px" radius="4px" />
            <SkeletonLoader className="mt-2" width="320px" height="32px" radius="6px" />
          </div>
          <SkeletonLoader width="140px" height="40px" radius="10px" />
        </div>

        {/* Search card */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
          <div className="flex flex-wrap gap-2.5">
            <SkeletonLoader className="flex-1" height="44px" radius="12px" />
            <SkeletonLoader className="flex-1" height="44px" radius="12px" />
            <SkeletonLoader width="160px" height="44px" radius="12px" />
            <SkeletonLoader width="100px" height="44px" radius="12px" />
            <SkeletonLoader width="44px" height="44px" radius="12px" />
          </div>
        </div>

        {/* Results skeleton */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
          {/* Summary bar */}
          <div className="flex items-center gap-3 border-b border-[var(--border)] px-5 py-3.5">
            <SkeletonLoader width="80px" height="24px" radius="6px" />
            <SkeletonLoader width="140px" height="20px" radius="999px" />
            <div className="ml-auto flex gap-2">
              <SkeletonLoader width="80px" height="32px" radius="8px" />
              <SkeletonLoader width="200px" height="32px" radius="8px" />
            </div>
          </div>

          {/* Result rows */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 border-b border-[var(--border)] px-5 py-3"
            >
              {/* Score */}
              <SkeletonLoader width="44px" height="44px" radius="50%" />
              {/* Badge */}
              <SkeletonLoader width="90px" height="26px" radius="8px" />
              {/* Name + meta */}
              <div className="flex-1 space-y-1.5">
                <SkeletonLoader width={`${40 + (i * 5) % 35}%`} height="14px" radius="4px" />
                <SkeletonLoader width={`${25 + (i * 4) % 25}%`} height="11px" radius="4px" />
              </div>
              {/* Icons */}
              <div className="flex w-[168px] justify-end gap-3">
                <SkeletonLoader width="15px" height="15px" radius="3px" />
                <SkeletonLoader width="15px" height="15px" radius="3px" />
              </div>
              {/* Actions */}
              <div className="flex w-[216px] justify-end gap-2">
                <SkeletonLoader width="120px" height="30px" radius="8px" />
                <SkeletonLoader width="90px" height="30px" radius="8px" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
