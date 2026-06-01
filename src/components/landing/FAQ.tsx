const faqs = [
  {
    question: "Who is Nearsited for?",
    answer: "Nearsited is built for solo freelancers and small web agencies who want to find local redesign opportunities faster and turn them into pitch-ready leads.",
  },
  {
    question: "Do I need Google Places API access?",
    answer: "No. The app is already configured to discover local leads. You can also import your own URL lists in future updates.",
  },
  {
    question: "What does the free trial include?",
    answer: "The free trial includes a starter credit allocation so you can discover leads, run audits, and generate pitches before committing.",
  },
];

export default function FAQ() {
  return (
    <section id="faq" className="py-24 bg-[rgba(255,255,255,0.02)]">
      <div className="mx-auto max-w-7xl px-6 sm:px-8">
        <div className="max-w-3xl space-y-6">
          <p className="text-sm uppercase tracking-[0.3em] text-[var(--accent)]">FAQ</p>
          <h2 className="font-playfair text-4xl tracking-[-0.03em] text-white">Frequently asked questions</h2>
          <p className="text-lg leading-8 text-[var(--text-secondary)]">
            We keep the onboarding simple and the product self-serve. If you need support, we’ll be there.
          </p>
        </div>

        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          {faqs.map((faq) => (
            <div key={faq.question} className="rounded-[28px] border border-[var(--border)] bg-[rgba(255,255,255,0.03)] p-6">
              <h3 className="text-lg font-semibold text-white">{faq.question}</h3>
              <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
