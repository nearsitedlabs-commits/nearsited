export default function Comparison() {
  return (
    <section id="product" className="border-t border-[var(--border)] bg-[rgba(255,255,255,0.02)] py-24">
      <div className="mx-auto max-w-7xl px-6 sm:px-8">
        <div className="max-w-3xl space-y-6">
          <p className="text-sm uppercase tracking-[0.3em] text-[var(--accent)]">The shift</p>
          <h2 className="font-playfair text-4xl tracking-[-0.03em] text-white">
            Stop browsing. Start <em className="font-normal italic text-[var(--accent)]">pitching.</em>
          </h2>
          <p className="text-lg leading-8 text-[var(--text-secondary)]">
            Move from manual website research to a pipeline-ready sales workflow with ranked local opportunities, audit-backed proof, and personalised pitch-ready messaging.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <div className="rounded-[28px] border border-[var(--border)] bg-[rgba(255,255,255,0.03)] p-8">
            <p className="text-sm italic text-[var(--text-tertiary)]">The old way</p>
            <h3 className="mt-4 text-2xl font-semibold text-white">Manual. Slow. Inconsistent.</h3>
            <ul className="mt-6 space-y-3 text-[var(--text-secondary)]">
              {[
                "Browse Google Maps and list businesses by hand",
                "Open every website and eyeball whether it feels weak",
                "Run PageSpeed yourself and capture screenshots manually",
                "Write each pitch from a blank document",
                "Track leads in a spreadsheet you forget about",
                "Send 50 pitches, get 1 reply",
              ].map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-6">
                  <span className="mt-1 text-[var(--text-tertiary)]">—</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex items-center justify-between border-t border-[var(--border)] pt-6 text-sm text-[var(--text-secondary)]">
              <span>Time per pitch</span>
              <span>~ 45 min</span>
            </div>
          </div>

          <div className="rounded-[28px] border border-[var(--accent-border)] bg-[rgba(79,70,229,0.06)] p-8">
            <p className="text-sm italic text-[var(--accent)]">The Nearsited way</p>
            <h3 className="mt-4 text-2xl font-semibold text-white">Surfaced. Scored. Sent.</h3>
            <ul className="mt-6 space-y-3 text-[var(--text-secondary)]">
              {[
                "Type city + business type, get ranked leads",
                "Every site auto-audited, opportunity-scored",
                "Performance, SEO, UX, trust — all measured",
                "Personalised pitch cites their real problems",
                "Built-in pipeline tracks every opportunity",
                "Send 50 pitches, get the ones who care",
              ].map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-6">
                  <span className="mt-1 text-[var(--accent)]">→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex items-center justify-between border-t border-[var(--border)] pt-6 text-sm text-[var(--text-secondary)]">
              <span>Time per pitch</span>
              <span className="font-semibold text-[var(--accent)]">Under 2 min</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
