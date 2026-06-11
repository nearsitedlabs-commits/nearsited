"use client";

import { SkeletonLoader } from "@/lib/motion";

export default function SettingsLoading() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-page)]">
      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Header */}
        <div className="mb-2">
          <SkeletonLoader width="100px" height="12px" radius="4px" />
        </div>
        <div className="mb-8">
          <SkeletonLoader width="80px" height="12px" radius="4px" />
          <SkeletonLoader className="mt-1" width="200px" height="32px" radius="6px" />
        </div>

        <div className="space-y-6">
          {/* Profile section */}
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-6">
            <SkeletonLoader width="120px" height="18px" radius="4px" />
            <div className="mt-5 space-y-4">
              <div>
                <SkeletonLoader width="80px" height="12px" radius="4px" />
                <SkeletonLoader className="mt-1.5" width="100%" height="42px" radius="8px" />
              </div>
              <div>
                <SkeletonLoader width="60px" height="12px" radius="4px" />
                <SkeletonLoader className="mt-1.5" width="100%" height="42px" radius="8px" />
              </div>
              <SkeletonLoader width="120px" height="36px" radius="8px" />
            </div>
          </div>

          {/* Plan section */}
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-6">
            <SkeletonLoader width="100px" height="18px" radius="4px" />
            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] p-4">
                <div>
                  <SkeletonLoader width="100px" height="16px" radius="4px" />
                  <SkeletonLoader className="mt-1" width="140px" height="12px" radius="4px" />
                </div>
                <SkeletonLoader width="80px" height="28px" radius="6px" />
              </div>
              <div>
                <SkeletonLoader width="140px" height="12px" radius="4px" />
                <SkeletonLoader className="mt-2" width="100%" height="8px" radius="999px" />
                <SkeletonLoader className="mt-1" width="80px" height="12px" radius="4px" />
              </div>
            </div>
          </div>

          {/* Danger zone */}
          <div className="rounded-[var(--radius-md)] border border-red-500/20 bg-[var(--color-bg-surface)] p-6">
            <SkeletonLoader width="100px" height="18px" radius="4px" />
            <SkeletonLoader className="mt-2" width="240px" height="12px" radius="4px" />
            <SkeletonLoader className="mt-4" width="140px" height="36px" radius="8px" />
          </div>
        </div>
      </div>
    </div>
  );
}
