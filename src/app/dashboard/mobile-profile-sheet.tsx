"use client";

import { useState } from "react";
import Link from "next/link";
import { Settings } from "lucide-react";
import { BottomSheet } from "@/components/ui/mobile/BottomSheet";
import CreditsWidget from "@/components/ui/CreditsWidget";
import SignOutButton from "./sign-out-button";

type MobileProfileSheetProps = {
  initial: string;
  email: string;
};

export function MobileProfileSheet({ initial, email }: MobileProfileSheetProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open profile menu"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)]/10 text-xs font-bold text-[var(--color-accent)] transition-colors hover:bg-[var(--color-accent)]/20"
      >
        {initial}
      </button>

      <BottomSheet isOpen={open} onClose={() => setOpen(false)} title="Account">
        {/* User info */}
        <div className="mb-4 flex items-center gap-3 rounded-[var(--radius-sm)] bg-[var(--color-bg-surface)] px-3 py-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)]/10 text-sm font-bold text-[var(--color-accent)]">
            {initial}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">{email}</p>
            <p className="text-[10px] text-[var(--color-text-tertiary)]">Free Beta</p>
          </div>
        </div>

        {/* Credits widget */}
        <div className="mb-4">
          <CreditsWidget />
        </div>

        {/* Nav actions */}
        <div className="space-y-1">
          <Link
            href="/dashboard/settings"
            onClick={() => setOpen(false)}
            className="flex min-h-[44px] items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-surface)] hover:text-[var(--color-text-primary)]"
          >
            <Settings className="h-4 w-4 shrink-0" aria-hidden="true" />
            Settings
          </Link>

          <div className="pt-1">
            <SignOutButton />
          </div>
        </div>
      </BottomSheet>
    </>
  );
}
