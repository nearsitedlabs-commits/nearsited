import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "404 — Page Not Found | NearSited",
  description: "The page you're looking for doesn't exist or has been moved. Find your way back to discovering website opportunities.",
  robots: { index: false, follow: true },
  openGraph: {
    title: "404 — Page Not Found | NearSited",
    description: "The page you're looking for doesn't exist or has been moved.",
  },
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      {/* ── Logo ── */}
      <Link
        href="/"
        className="inline-flex items-center gap-2.5 text-base font-medium text-[var(--color-text-primary)]"
        style={{ fontFamily: "var(--font-sans)" }}
      >
        <Image
          src="/logo-icon.svg"
          alt="NearSited"
          width={40}
          height={24}
          className="block shrink-0"
          priority
        />
        <span className="text-[22px] font-medium tracking-[0.02em] text-[var(--color-text-primary)]">
          NearSited
        </span>
      </Link>

      {/* ── Content ── */}
      <div className="mt-12 text-center">
        <p className="text-[6rem] font-medium leading-none text-[var(--color-text-tertiary)] md:text-[8rem]">
          404
        </p>

        <h1 className="mt-6 text-2xl font-normal text-[var(--color-text-primary)]">
          Page not found
        </h1>

        <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-[var(--color-text-secondary)]">
          The page you&rsquo;re looking for doesn&rsquo;t exist or has been
          moved. Let&rsquo;s get you back on track.
        </p>
      </div>

      {/* ── Actions ── */}
      <div className="mt-10 flex items-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-accent)] px-5 py-2.5 text-sm font-medium text-white shadow-[var(--brand-shadow-xs)] transition-colors duration-150 ease-out hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-tint)]"
        >
          Go home
        </Link>

        <Link
          href="/login"
          className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-transparent bg-transparent px-5 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] transition-colors duration-150 ease-out hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-tint)]"
        >
          Sign in
        </Link>
      </div>

      {/* ── Footer text ── */}
      <p className="mt-16 text-xs text-[var(--color-text-tertiary)]">
        <Link href="/" className="transition hover:text-[var(--color-text-primary)]">
          NearSited
        </Link>{" "}
        &mdash; Find businesses that need websites.
      </p>
    </div>
  );
}
