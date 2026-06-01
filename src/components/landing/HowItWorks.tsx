const steps = [
  {
    number: "I",
    title: "Discover",
    description: "Type a city and business type. We surface 20–60 local businesses ranked by opportunity score.",
    card: [
      ["Search", "Dentists in Dubai · 10km"],
      ["Found", "48 businesses"],
      ["Flagged", "23 high opportunity"],
      ["Sorted", "Score low to high"],
    ],
  },
  {
    number: "II",
    title: "Audit",
    description: "Every lead gets a six-score audit with ranked issues and revenue impact in plain English.",
    card: [
      ["Performance", "42/100 — Slow LCP"],
      ["SEO", "48/100 — Missing meta"],
      ["Mobile UX", "39/100 — Tap targets"],
      ["Trust", "38/100 — No HTTPS badge"],
    ],
  },
  {
    number: "III",
    title: "Pitch",
    description: "A personalised pitch generated from real audit data. Adjust tone. Copy-ready in seconds.",
    card: [
      ["Lead type", "Has website · weak"],
      ["Tone", "Direct · professional"],
      ["Length", "Short (under 80 words)"],
      ["Status", "Ready to send"],
    ],
  },
  {
    number: "IV",
    title: "Close",
    description: "Move every lead through your pipeline. New → Contacted → Proposal → Won.",
    card: [
      ["New", "12 leads"],
      ["Contacted", "8 leads"],
      ["Proposal", "3 leads"],
      ["Won", "2 deals"],
    ],
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24">
      <div className="mx-auto max-w-7xl px-6 sm:px-8">
        <div className="max-w-3xl space-y-6">
          <p className="text-sm uppercase tracking-[0.3em] text-[var(--accent)]">How it works</p>
          <h2 className="font-playfair text-4xl tracking-[-0.03em] text-white">
            Four steps, one <em className="font-normal italic text-[var(--accent)]">workflow.</em>
          </h2>
          <p className="text-lg leading-8 text-[var(--text-secondary)]">
            The product is built around a single motion: discover local opportunities, audit them automatically, generate a pitch, and move them into your pipeline.
          </p>
        </div>

        <div className="mt-14 space-y-8">
          {steps.map((step) => (
            <div key={step.number} className="grid gap-6 lg:grid-cols-[100px_minmax(260px,_1fr)_360px] lg:items-start">
              <div className="text-[4rem] font-playfair text-[rgba(79,70,229,0.16)] leading-none">{step.number}</div>
              <div className="space-y-3">
                <h3 className="text-2xl font-semibold text-white">{step.title}</h3>
                <p className="text-[var(--text-secondary)] leading-7">{step.description}</p>
              </div>
              <div className="rounded-3xl border border-[var(--border)] bg-[rgba(255,255,255,0.03)] p-5">
                {step.card.map(([label, value]) => (
                  <div key={label} className="mb-4 last:mb-0">
                    <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--text-tertiary)]">{label}</p>
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
