import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
      <div className="mx-auto max-w-3xl px-6 py-16 md:px-8 md:py-24">
        <Link href="/" className="mb-8 inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]">
          ← Back to Nearsited
        </Link>

        <h1 className="text-[clamp(2rem,4vw,3rem)] font-medium leading-[1.1] tracking-[-0.02em] text-[var(--text-primary)]">
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-[var(--text-tertiary)]">Last updated: June 8, 2026</p>

        <div className="mt-10 space-y-8 text-sm leading-7 text-[var(--text-secondary)]">
          <section>
            <h2 className="text-lg font-medium text-[var(--text-primary)]">1. Service Description</h2>
            <p className="mt-3">
              Nearsited is a tool that helps web designers and agencies find local businesses that need websites. It discovers businesses, analyzes their online presence, generates outreach messages, and helps manage a sales pipeline.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-[var(--text-primary)]">2. Accounts</h2>
            <p className="mt-3">
              You are responsible for maintaining the confidentiality of your account credentials. You are responsible for all activity that occurs under your account. You must provide accurate information when creating your account.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-[var(--text-primary)]">3. Subscriptions & Billing</h2>
            <p className="mt-3">
              <strong className="text-[var(--text-primary)]">Free tier:</strong> All accounts start on a free tier with a lifetime allowance of credits. No payment information is required to create an account or use the service within the free tier limits.
            </p>
            <p className="mt-2">
              <strong className="text-[var(--text-primary)]">Paid plans:</strong> Starter ($19/month) and Agency ($49/month) plans are available via Dodo Payments. You will never be charged without explicitly subscribing to a paid plan. Subscription charges are billed in advance on a monthly or annual basis.
            </p>
            <p className="mt-2">
              <strong className="text-[var(--text-primary)]">Cancellation:</strong> You may cancel your subscription at any time. Cancellation takes effect at the end of the current billing period. We do not offer refunds for partial billing periods.
            </p>
            <p className="mt-2">
              <strong className="text-[var(--text-primary)]">Price changes:</strong> We may change subscription prices with 30 days notice by email. Continued use after a price change takes effect constitutes acceptance of the new price.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-[var(--text-primary)]">4. Acceptable Use</h2>
            <p className="mt-3">You agree not to:</p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li>Use the service for any illegal purpose</li>
              <li>Attempt to bypass usage limits or access restrictions</li>
              <li>Scrape, crawl, or extract data from the service beyond normal use</li>
              <li>Use the service to send spam or unsolicited messages</li>
              <li>Reverse engineer, decompile, or modify the service</li>
              <li>Create multiple accounts to circumvent trial or plan limits</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-medium text-[var(--text-primary)]">5. Data & Privacy</h2>
            <p className="mt-3">
              Your data belongs to you. We do not sell your data or use your business information for purposes other than operating the service. You can export or delete your data at any time. See our <Link href="/privacy" className="text-[var(--accent)] hover:underline">Privacy Policy</Link> for details.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-[var(--text-primary)]">6. Limitation of Liability</h2>
            <p className="mt-3">
              Nearsited is provided &ldquo;as is&rdquo; without warranty of any kind. We are not liable for any damages arising from your use of the service. Our total liability is limited to the amount you&rsquo;ve paid us in the 12 months preceding a claim.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-[var(--text-primary)]">7. Changes to These Terms</h2>
            <p className="mt-3">
              We may update these terms from time to time. Material changes will be communicated via email. Continued use of the service after changes take effect constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-[var(--text-primary)]">8. Contact</h2>
            <p className="mt-3">
              For questions about these terms: <a href="mailto:nearsitedlabs@gmail.com" className="text-[var(--accent)] hover:underline">nearsitedlabs@gmail.com</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
