export default function FinalCTA() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-6 sm:px-8">
        <div className="rounded-[28px] border border-[var(--border)] bg-[rgba(255,255,255,0.04)] p-10 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-[var(--accent)]">Ready to get started?</p>
          <h2 className="mt-4 text-4xl font-playfair tracking-[-0.03em] text-white">
            Launch your next redesign pipeline with evidence-backed pitch-ready leads.
          </h2>
          <p className="mt-5 max-w-2xl mx-auto text-lg leading-8 text-[var(--text-secondary)]">
            Start discovering local opportunities in minutes and stop wasting time on manual research.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a href="/signup" className="inline-flex rounded-full bg-[var(--accent)] px-7 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-hover)]">
              Start free now
            </a>
            <a href="/login" className="inline-flex rounded-full border border-[var(--border)] bg-transparent px-7 py-3 text-sm font-medium text-[var(--text-secondary)] transition hover:text-white">
              Sign in
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
