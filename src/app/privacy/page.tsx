import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
      <div className="mx-auto max-w-3xl px-6 py-16 md:px-8 md:py-24">
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
            <p className="mt-3">We collect only the data needed to operate the service:</p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li><strong className="text-[var(--text-primary)]">Account information:</strong> email address and name when you sign up.</li>
              <li><strong className="text-[var(--text-primary)]">Payment data:</strong> processed securely by Dodo Payments. We never see or store your full payment details.</li>
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
            <h2 className="text-lg font-medium text-[var(--text-primary)]">4. Cookies & Tracking</h2>
            <p className="mt-3">
              We use essential cookies to maintain your session and keep you logged in. These cookies are required for the service to function and do not track you across other websites.
            </p>
            <p className="mt-3">
              We also use basic analytics (page views, feature usage) to understand how the service is used. This data is anonymized and cannot be traced back to you.
            </p>
            <p className="mt-3 font-medium text-[var(--text-primary)]">Cookie categories:</p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li><strong className="text-[var(--text-primary)]">Essential</strong> (required): session tokens, CSRF tokens</li>
              <li><strong className="text-[var(--text-primary)]">Analytics</strong> (optional): page view counts, feature usage patterns</li>
            </ul>
            <p className="mt-3">
              You can disable analytics cookies in your browser settings. Blocking essential cookies will prevent the service from working. We do not use advertising cookies, tracking pixels, or third-party marketing cookies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-[var(--text-primary)]">5. Third-Party Services</h2>
            <p className="mt-3">Nearsited uses these third-party services to operate:</p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li><strong className="text-[var(--text-primary)]">Supabase:</strong> database and authentication</li>
              <li><strong className="text-[var(--text-primary)]">Dodo Payments:</strong> payment processing</li>
              <li><strong className="text-[var(--text-primary)]">Google Places & PageSpeed APIs:</strong> business discovery and website analysis</li>
              <li><strong className="text-[var(--text-primary)]">Gemini (Google AI):</strong> AI pitch generation and design analysis</li>
              <li><strong className="text-[var(--text-primary)]">ScreenshotCore:</strong> website screenshots for analysis</li>
              <li><strong className="text-[var(--text-primary)]">Upstash Redis:</strong> rate limiting</li>
            </ul>
            <p className="mt-3">
              Each service processes data according to their own privacy policies. We only send them the minimum data required for each function.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-[var(--text-primary)]">6. Your Rights</h2>
            <p className="mt-3">
              You can request access to, correction of, or deletion of your personal data at any time by emailing us. You can export your data from the dashboard at any time. You can cancel your subscription at any time with no penalty.
            </p>

            <h3 className="mt-5 font-medium text-[var(--text-primary)]">GDPR Rights (EU/EEA Users)</h3>
            <p className="mt-2">If you are in the EU or EEA, you have additional rights under GDPR:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li><strong className="text-[var(--text-primary)]">Right to access:</strong> request a copy of your personal data.</li>
              <li><strong className="text-[var(--text-primary)]">Right to rectification:</strong> request correction of inaccurate data.</li>
              <li><strong className="text-[var(--text-primary)]">Right to erasure:</strong> request deletion of your personal data.</li>
              <li><strong className="text-[var(--text-primary)]">Right to data portability:</strong> request a machine-readable export.</li>
              <li><strong className="text-[var(--text-primary)]">Right to object:</strong> object to our processing of your data for analytics.</li>
              <li><strong className="text-[var(--text-primary)]">Right to restrict processing:</strong> request limits on how we use your data.</li>
              <li><strong className="text-[var(--text-primary)]">Right to withdraw consent:</strong> withdraw consent at any time.</li>
            </ul>

            <h3 className="mt-5 font-medium text-[var(--text-primary)]">CCPA Rights (California Users)</h3>
            <p className="mt-2">If you are a California resident, the CCPA gives you the right to:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Know what personal information we collect, use, and share</li>
              <li>Request deletion of your personal information</li>
              <li>Opt out of the sale of your personal information</li>
            </ul>
            <p className="mt-3"><strong className="text-[var(--text-primary)]">We do not sell your personal information.</strong> To exercise your rights, email <a href="mailto:nearsitedlabs@gmail.com" className="text-[var(--accent)] hover:underline">nearsitedlabs@gmail.com</a>. We will respond within 30 days.</p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-[var(--text-primary)]">7. Data Retention</h2>
            <p className="mt-3">
              We retain your personal data for as long as your account is active. After account deletion, we delete or anonymize your data within 30 days. Analytics data may be retained in aggregate form after deletion.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-[var(--text-primary)]">8. International Transfers</h2>
            <p className="mt-3">
              Your data is processed on servers located in the United States and India. By using the service, you consent to the transfer of your data to these locations. For EU users, we ensure appropriate safeguards (Standard Contractual Clauses) are in place.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-[var(--text-primary)]">9. Contact</h2>
            <p className="mt-3">
              For privacy-related inquiries or to exercise your rights: <a href="mailto:nearsitedlabs@gmail.com" className="text-[var(--accent)] hover:underline">nearsitedlabs@gmail.com</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
