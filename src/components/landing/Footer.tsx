export default function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-[rgba(255,255,255,0.03)] py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 sm:px-8 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[var(--text-secondary)]">© 2026 Nearsited. AI redesign opportunity intelligence for web agencies.</p>
        <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--text-secondary)]">
          <a href="#product" className="transition hover:text-white">Product</a>
          <a href="#pricing" className="transition hover:text-white">Pricing</a>
          <a href="#faq" className="transition hover:text-white">FAQ</a>
        </div>
      </div>
    </footer>
  );
}
