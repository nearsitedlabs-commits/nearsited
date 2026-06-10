"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

const BREADCRUMBS: Record<string, string> = {
  "/login": "Sign in",
  "/signup": "Create account",
  "/reset-password": "Reset password",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const pageLabel = BREADCRUMBS[pathname] ?? "Auth";

  return (
    <div className="relative flex min-h-screen flex-col">
      {/* Breadcrumb header */}
      <header className="relative z-20 flex items-center gap-2 px-6 py-4 md:px-8">
        <Link href="/" className="flex items-center gap-2 text-sm text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-primary)]">
          <Image src="/logo-icon.svg" alt="" width={22} height={13} className="shrink-0" />
          <span className="font-medium">NearSited</span>
        </Link>
        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[var(--text-tertiary)]/50" />
        <span className="text-sm text-[var(--text-secondary)]">{pageLabel}</span>
      </header>

      {/* Page content */}
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
