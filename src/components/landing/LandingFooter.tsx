import Image from "next/image";

export function LandingFooter() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--bg-surface)] px-6 py-12 md:px-8">
      <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[2fr_1fr_1fr_1fr]">
        <div>
          <div className="mb-4 inline-flex items-center gap-2.5 text-base font-medium text-[var(--text-primary)]" style={{ fontFamily: 'Switzer, Geist, sans-serif' }}>
            <Image src="/logo-icon.svg" alt="" width={28} height={16} className="block shrink-0" />
            <span className="text-base font-medium tracking-[0.02em] text-[var(--text-primary)]">NearSited</span>
          </div>
          <p className="max-w-sm text-sm leading-7 text-[var(--text-tertiary)]">
            Find businesses that need websites, redesigns, or a stronger online presence.
          </p>
        </div>
        <div>
          <div className="mb-4 text-[0.7rem] uppercase tracking-[0.12em] text-[var(--text-tertiary)]">Product</div>
          <ul className="space-y-3 text-sm text-[var(--text-tertiary)]">
            <li><a href="#how" className="transition hover:text-[var(--text-primary)]">How it works</a></li>
            <li><a href="#report" className="transition hover:text-[var(--text-primary)]">Sample report</a></li>
            <li><a href="#pitch" className="transition hover:text-[var(--text-primary)]">Sample pitch</a></li>
            <li><a href="/pricing" className="transition hover:text-[var(--text-primary)]">Pricing</a></li>
          </ul>
        </div>
        <div>
          <div className="mb-4 text-[0.7rem] uppercase tracking-[0.12em] text-[var(--text-tertiary)]">Company</div>
          <ul className="space-y-3 text-sm text-[var(--text-tertiary)]">
            <li><a href="mailto:nearsitedlabs@gmail.com" className="transition hover:text-[var(--text-primary)]">Contact</a></li>
          </ul>
        </div>
        <div>
          <div className="mb-4 text-[0.7rem] uppercase tracking-[0.12em] text-[var(--text-tertiary)]">Legal</div>
          <ul className="space-y-3 text-sm text-[var(--text-tertiary)]">
            <li><a href="/terms" className="transition hover:text-[var(--text-primary)]">Terms</a></li>
            <li><a href="/privacy" className="transition hover:text-[var(--text-primary)]">Privacy</a></li>
          </ul>
        </div>
      </div>
      <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-[var(--border)] pt-6 text-sm text-[var(--text-tertiary)] md:flex-row">
        <span>© 2026 Nearsited. All rights reserved.</span>
        <span className="text-[var(--text-secondary)]">Built by Again Labs · <a href="https://againlive.com" className="transition hover:text-[var(--text-primary)]" target="_blank" rel="noopener noreferrer">Again Live</a> family of products</span>
      </div>
    </footer>
  );
}
