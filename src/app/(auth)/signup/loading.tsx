"use client";

import { SkeletonLoader } from "@/lib/motion";

export default function SignupLoading() {
  return (
    <div className="relative min-h-screen bg-[var(--color-bg-page)] flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left: Brand story panel skeleton */}
          <div className="hidden lg:block space-y-6">
            <SkeletonLoader width="180px" height="36px" radius="8px" />
            <div className="space-y-3">
              <SkeletonLoader width="100%" height="14px" radius="4px" />
              <SkeletonLoader width="90%" height="14px" radius="4px" />
              <SkeletonLoader width="80%" height="14px" radius="4px" />
            </div>
            <div className="space-y-3 pt-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <SkeletonLoader width="44px" height="44px" radius="10px" />
                  <div className="flex-1">
                    <SkeletonLoader width="70%" height="14px" radius="4px" />
                    <SkeletonLoader className="mt-1" width="50%" height="12px" radius="4px" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Auth card skeleton */}
          <div className="w-full max-w-md mx-auto lg:mx-0 lg:justify-self-end">
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-8">
              <div className="text-center mb-8">
                <SkeletonLoader className="mx-auto" width="140px" height="28px" radius="6px" />
                <SkeletonLoader className="mx-auto mt-2" width="200px" height="14px" radius="4px" />
              </div>
              <div className="space-y-4">
                <div>
                  <SkeletonLoader width="80px" height="12px" radius="4px" />
                  <SkeletonLoader className="mt-1.5" width="100%" height="42px" radius="10px" />
                </div>
                <div>
                  <SkeletonLoader width="60px" height="12px" radius="4px" />
                  <SkeletonLoader className="mt-1.5" width="100%" height="42px" radius="10px" />
                </div>
                <div>
                  <SkeletonLoader width="70px" height="12px" radius="4px" />
                  <SkeletonLoader className="mt-1.5" width="100%" height="42px" radius="10px" />
                </div>
                <SkeletonLoader width="100%" height="44px" radius="10px" />
                <div className="flex items-center gap-3 my-6">
                  <SkeletonLoader className="flex-1" height="1px" radius="0" />
                  <SkeletonLoader width="40px" height="12px" radius="4px" />
                  <SkeletonLoader className="flex-1" height="1px" radius="0" />
                </div>
                <SkeletonLoader width="100%" height="44px" radius="10px" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
