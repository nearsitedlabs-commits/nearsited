import Link from "next/link";

export default function Nav() {
  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-[var(--border)] bg-[rgba(10,10,15,0.8)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 sm:px-8">
        <Link href="/" className="inline-flex items-center gap-3 text-sm font-medium text-[var(--text-primary)]">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--accent)] bg-[rgba(79,70,229,0.08)]">
            <svg className="h-5 w-5" viewBox="0 0 48 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="1" y="4" width="18" height="18" rx="9" stroke="#4F46E5" strokeWidth="2.2" />
              <rect x="29" y="4" width="18" height="18" rx="9" stroke="#4F46E5" strokeWidth="2.2" />
              <line x1="19" y1="13" x2="29" y2="13" stroke="#4F46E5" strokeWidth="2.2" />
              <circle cx="38" cy="13" r="2.5" fill="#a292ff" />
              <circle cx="39.5" cy="11.5" r="0.8" fill="white" opacity="0.8" />
            </svg>
          </span>
          <span className="text-base tracking-tight">Nearsited</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <a href="#product" className="text-sm text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]">Product</a>
          <a href="#how-it-works" className="text-sm text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]">How it works</a>
          <a href="#pricing" className="text-sm text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]">Pricing</a>
          <a href="#faq" className="text-sm text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]">FAQ</a>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/login" className="rounded-full border border-[var(--border)] bg-transparent px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]">
            Sign in
          </Link>
          <Link href="/signup" className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--accent-hover)]">
            Start Free →
          </Link>
        </div>
      </div>
    </nav>
  );
}
