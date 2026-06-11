"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function SignOutButton({ compact }: { compact?: boolean }) {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  if (compact) {
    return (
      <button
        onClick={handleSignOut}
        className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] text-[var(--color-text-tertiary)] transition-colors duration-150 hover:bg-[var(--color-bg-surface)] hover:text-[var(--color-text-primary)]"
        title="Sign out"
      >
        <LogOut className="h-4 w-4" />
      </button>
    );
  }

  return (
    <button
      onClick={handleSignOut}
      className="rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition-colors duration-150 hover:bg-[var(--color-bg-surface)] hover:text-[var(--color-text-primary)]"
    >
      Sign out
    </button>
  );
}
