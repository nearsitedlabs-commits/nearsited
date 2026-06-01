import HeroCard from "@/components/landing/HeroCard";

export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.18),_transparent_35%),radial-gradient(circle_at_80%_20%,_rgba(79,70,229,0.08),_transparent_28%)]" />
      <div className="relative mx-auto max-w-7xl px-6 pb-28 sm:px-8">
        <div className="grid gap-14 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="max-w-2xl space-y-8">
            <div className="inline-flex items-center gap-3 rounded-full border border-[var(--accent-border)] bg-[var(--accent-tint)] px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-[var(--text-secondary)]">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[var(--accent)] animate-pulse" />
              AI Redesign Opportunity Intelligence
            </div>
            <div className="space-y-5">
              <h1 className="font-playfair text-[clamp(3.5rem,5.5vw,5.8rem)] leading-[0.95] tracking-[-0.03em] text-white">
                Find what others <em className="font-normal italic text-[rgba(150,140,255,0.95)]">overlook.</em>
              </h1>
              <p className="max-w-xl text-lg leading-8 text-[var(--text-secondary)]">
                Nearsited surfaces the local businesses your competitors miss — and walks you into every pitch meeting already prepared.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <a href="#product" className="inline-flex items-center rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-hover)]">
                Start Finding Opportunities →
              </a>
              <button className="inline-flex items-center rounded-full border border-[var(--border)] bg-transparent px-6 py-3 text-sm font-medium text-[var(--text-secondary)] transition hover:border-[var(--accent-border)] hover:text-white">
                ▶ Watch 90 sec demo
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--text-tertiary)]">
              <span>No credit card</span>
              <span className="h-px w-1.5 bg-[var(--accent)]" />
              <span>100 free credits</span>
              <span className="h-px w-1.5 bg-[var(--accent)]" />
              <span>Cancel anytime</span>
            </div>
          </div>

          <div className="mx-auto w-full max-w-lg">
            <HeroCard />
          </div>
        </div>
      </div>
    </section>
  );
}
