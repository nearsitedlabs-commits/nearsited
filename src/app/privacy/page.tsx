import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
      <div className="mx-auto max-w-3xl px-6 py-16 md:px-8 md:py-24">
        {/* Header */}
        <Link href="/" className="mb-8 inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]">
          ← Back to Nearsited
        </Link>

        <h1 className="text-[clamp(2rem,4vw,3rem)] font-medium leading-[1.1] tracking-[-0.02em] text-[var(--text-primary)]">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-[var(--text-tertiary)]">Last updated: June 2026</p>

        <div className="mt-10 space-y-8 text-sm leading-7 text-[var(--text-secondary)]">
          <section>
            <h2 className="text-lg font-medium text-[var(--text-primary)]">1. What We Collect</h2>
            <p className="mt-3">
              We collect only the data needed to operate the service:
            </p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li><strong className="text-[var(--text-primary)]">Account information:</strong> email address and name when you sign up.</li>
              <li><strong className="text-[var(--text-primary)]">Payment data:</strong> processed securely by Lemon Squeezy. We never see or store your full payment details.</li>
              <li><strong className="text-[var(--text-primary)]">Business data:</strong> the leads, notes, and pipeline entries you save in the app.</li>
              <li><strong className="text-[var(--text-primary)]">Usage data:</strong> what features you use, how often, and basic analytics (page views, clicks).</li>
            </ul>
            <p className="mt-3">
              We do not collect browsing history, personal contacts, location data, or any information unrelated to operating the service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-[var(--text-primary)]">2. How We Use Your Data</h2>
            <ul className="mt-3 list-disc space-y-1.5 pl-5">
              <li>To provide and maintain the Nearsited service</li>
              <li>To process payments and manage subscriptions</li>
              <li>To send service-related communications (e.g., payment receipts, feature updates)</li>
              <li>To improve the product based on how it&rsquo;s used</li>
              <li>To detect and prevent abuse of the service</li>
            </ul>
            <p className="mt-3">
              We do not sell your data. We do not share your leads with competitors. We do not use your business data to train AI models.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-[var(--text-primary)]">3. Data Storage & Security</h2>
            <p className="mt-3">
              Your data is stored on Supabase servers. We use industry-standard encryption (HTTPS, TLS) for data in transit and at rest. We retain your data for as long as your account is active. After account deletion, we delete or anonymize your data within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-[var(--text-primary)]">4. Third-Party Services</h2>
            <p className="mt-3">
              Nearsited uses these third-party services to operate:
            </p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li><strong className="text-[var(--text-primary)]">Supabase:</strong> database and authentication</li>
              <li><strong className="text-[var(--text-primary)]">Lemon Squeezy:</strong> payment processing</li>
              <li><strong className="text-[var(--text-primary)]">Google Places & PageSpeed APIs:</strong> business discovery and website analysis</li>
              <li><strong className="text-[var(--text-primary)]">Gemini (Google AI):</strong> AI pitch generation</li>
              <li><strong className="text-[var(--text-primary)]">ScreenshotOne:</strong> website screenshots for analysis</li>
            </ul>
            <p className="mt-3">
              Each service processes data according to their own privacy policies. We only send them the minimum data required for each function.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-[var(--text-primary)]">5. Your Rights</h2>
            <p className="mt-3">
              You can request access to, correction of, or deletion of your personal data at any time by emailing us at <a href="mailto:nearsitedlabs@gmail.com" className="text-[var(--accent)] hover:underline">nearsitedlabs@gmail.com</a>. We will respond within 30 days. You can cancel your account at any time with no penalty.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-[var(--text-primary)]">6. Contact</h2>
            <p className="mt-3">
              For privacy-related inquiries: <a href="mailto:nearsitedlabs@gmail.com" className="text-[var(--accent)] hover:underline">nearsitedlabs@gmail.com</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
