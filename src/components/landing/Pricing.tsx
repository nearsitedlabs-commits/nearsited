const plans = [
  {
    name: "Solo",
    price: "₹2,499/mo",
    description: "For freelancers prospecting on the side",
    features: ["100 audits/month", "Unlimited pitches", "Pipeline + exports", "Single user"],
    featured: false,
    cta: "Start with Solo",
  },
  {
    name: "Agency",
    price: "₹6,999/mo",
    description: "For small agencies closing more local work",
    features: ["500 audits/month", "Unlimited pitches + tones", "White-label PDF exports", "Up to 5 team seats"],
    featured: true,
    cta: "Start with Agency",
  },
  {
    name: "Studio",
    price: "₹12,999/mo",
    description: "For teams that need unlimited scale",
    features: ["2,000 audits/month", "Everything in Agency", "Unlimited seats", "Custom integrations"],
    featured: false,
    cta: "Talk to us",
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-24 border-t border-[var(--border)]">
      <div className="mx-auto max-w-7xl px-6 sm:px-8">
        <div className="max-w-3xl space-y-6">
          <p className="text-sm uppercase tracking-[0.3em] text-[var(--accent)]">Pricing</p>
          <h2 className="font-playfair text-4xl tracking-[-0.03em] text-white">
            Honest tiers. No <em className="font-normal italic text-[var(--accent)]">seat games.</em>
          </h2>
          <p className="text-lg leading-8 text-[var(--text-secondary)]">
            Pay for the volume you actually use. Every tier includes the full feature set.
          </p>
        </div>

        <div className="mt-12 grid gap-6 xl:grid-cols-3">
          {plans.map((plan) => (
            <div key={plan.name} className={`rounded-[28px] border p-8 ${plan.featured ? "border-[var(--accent-border)] bg-[rgba(79,70,229,0.06)]" : "border-[var(--border)] bg-[rgba(255,255,255,0.03)]"}`}>
              {plan.featured && (
                <div className="mb-5 inline-flex rounded-full bg-[var(--accent)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-white">
                  Most popular
                </div>
              )}
              <h3 className="text-2xl font-semibold text-white">{plan.name}</h3>
              <p className="mt-3 text-sm text-[var(--text-secondary)]">{plan.description}</p>
              <p className="mt-8 text-4xl font-normal text-white">{plan.price}</p>
              <ul className="mt-8 space-y-3 text-sm text-[var(--text-secondary)]">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <button className={`mt-10 w-full rounded-full px-5 py-3 text-sm font-semibold transition ${plan.featured ? "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]" : "border border-[var(--border)] bg-transparent text-[var(--text-secondary)] hover:border-[var(--accent-border)] hover:text-white"}`}>
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
