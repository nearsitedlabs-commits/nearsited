import { LegalPage, LegalSection, LegalSubSection } from "@/components/legal/LegalPage";
import Link from "next/link";

const TOC = [
  { id: "what-we-collect",     label: "1. What We Collect" },
  { id: "how-we-use",          label: "2. How We Use Your Data" },
  { id: "third-parties",       label: "3. Third-Party Services" },
  { id: "retention",           label: "4. Data Retention" },
  { id: "cookies",             label: "5. Cookies & Tracking" },
  { id: "your-rights",         label: "6. Your Rights" },
  { id: "international",       label: "7. International Transfers" },
  { id: "changes",             label: "8. Changes to This Policy" },
];

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy policy" lastUpdated="8 June 2026" toc={TOC}>

      <p className="text-sm leading-[1.7] text-[var(--color-text-secondary)]">
        Nearsited is operated by Again Labs, a proprietorship registered in Kerala, India. This policy explains what data we collect, why we collect it, and how we handle it. We built Nearsited as a solo founder product — we have no data-brokering business, no ad network, and no incentive to sell your information.
      </p>

      <LegalSection id="what-we-collect" heading="1. What We Collect">
        <LegalSubSection heading="1.1 Account information">
          <p>When you sign up, we collect your email address and full name. If you use Google OAuth, we receive only your name and email from Google — we do not receive access to your Google Drive, Calendar, or any other Google service.</p>
        </LegalSubSection>

        <LegalSubSection heading="1.2 Business discovery data (Google Places)">
          <p>
            When you run a discovery search, Nearsited queries the Google Places API on your behalf. The results — business names, addresses, phone numbers, websites, ratings, and review counts — are returned by Google and cached in our database for up to 7 days to reduce redundant API calls. This cache is scoped to your account. The data belongs to Google&rsquo;s Places index; we are intermediaries, not the source.
          </p>
        </LegalSubSection>

        <LegalSubSection heading="1.3 Website audit data (PageSpeed)">
          <p>
            When you run an audit on a business website, we send the website URL to Google&rsquo;s PageSpeed Insights API. The API returns performance scores, SEO scores, and Core Web Vitals (FCP, LCP, TBT, CLS). We store these results in your account&rsquo;s audit history so you can reference them without re-running the audit. We do not store any content from the target website itself — only the scores and metrics.
          </p>
        </LegalSubSection>

        <LegalSubSection heading="1.4 Website screenshots (ScreenshotCore)">
          <p>
            Design analysis requires a screenshot of the target website. We send the website URL to ScreenshotCore, which captures a full-page screenshot and returns it as an image. We temporarily hold this image in memory for the duration of the Gemini analysis call, then we do not persist it to storage. The URL of the target website is shared with ScreenshotCore only for the duration of the screenshot request.
          </p>
        </LegalSubSection>

        <LegalSubSection heading="1.5 Pitch generation inputs (Gemini AI)">
          <p>
            When you generate a pitch, we send a prompt to Gemini (Google AI) that includes: the business name and type, performance scores from the audit, design issues identified by the analysis, and your selected tone and channel. We do not send your personal details or contact list to Gemini.
          </p>
          <p className="mt-2">
            <strong className="text-[var(--color-text-primary)]">These inputs are not used to train AI models.</strong> We use the Gemini API under Google Cloud&rsquo;s standard terms, which prohibit using API requests to improve Google&rsquo;s models unless you explicitly opt in. We have not opted in.
          </p>
        </LegalSubSection>

        <LegalSubSection heading="1.6 Leads, pipeline, and pitches (your data)">
          <p>
            Leads you save, pipeline entries, notes, and generated pitches are stored in your account on our Supabase database. This data is yours. We do not analyse it, share it, or use it for any purpose other than providing the service to you.
          </p>
        </LegalSubSection>

        <LegalSubSection heading="1.7 Usage analytics">
          <p>
            We collect basic usage data — which pages you visit, which features you use, and how often — to understand how the product is being used and where it needs improvement. This data is anonymised and not tied to identifiable individuals in our analytics system.
          </p>
        </LegalSubSection>
      </LegalSection>

      <LegalSection id="how-we-use" heading="2. How We Use Your Data">
        <ul className="list-disc space-y-2 pl-5">
          <li>To provide and maintain the Nearsited service.</li>
          <li>To process payments and manage your subscription via Dodo Payments.</li>
          <li>To send service-related emails: payment receipts, subscription updates, account notifications. We do not send marketing emails unless you opt in.</li>
          <li>To improve the product based on how it is used (anonymised usage data only).</li>
          <li>To detect and prevent abuse, fraud, or violations of our Terms of Service.</li>
        </ul>
        <p className="mt-3">
          <strong className="text-[var(--color-text-primary)]">We do not sell your data.</strong> We do not share your leads with competitors. We do not use your business data to train AI models. We do not use your data for advertising.
        </p>
      </LegalSection>

      <LegalSection id="third-parties" heading="3. Third-Party Services">
        <p>Nearsited relies on the following third-party services to operate. Each service receives only the minimum data required for its function:</p>

        <div className="mt-4 space-y-4">
          <div>
            <p className="font-medium text-[var(--color-text-primary)]">Supabase (Supabase Inc., USA)</p>
            <p className="mt-1">Database, authentication, and file storage. Stores your account data, leads, pitches, audits, and pipeline entries. All data at rest is encrypted. We use Supabase&rsquo;s Row Level Security to ensure users can only access their own data.</p>
          </div>

          <div>
            <p className="font-medium text-[var(--color-text-primary)]">Dodo Payments</p>
            <p className="mt-1">Payment processing for Starter and Agency subscriptions. We never store, see, or access your full payment card details. Dodo Payments holds all payment instrument data. Dodo shares only subscription status, renewal dates, and payment confirmation with us.</p>
          </div>

          <div>
            <p className="font-medium text-[var(--color-text-primary)]">Google Cloud — Places API, PageSpeed API, Gemini API</p>
            <p className="mt-1">
              <strong className="text-[var(--color-text-primary)]">Places API:</strong> receives city name and business type to return business listings. Returns business names, addresses, websites, ratings.
              <br />
              <strong className="text-[var(--color-text-primary)]">PageSpeed API:</strong> receives the URL of a target business website (not your URL) and returns performance metrics.
              <br />
              <strong className="text-[var(--color-text-primary)]">Gemini API:</strong> receives structured prompts containing business data and your pitch preferences (tone, channel, focus). Returns generated pitch text. Inputs are not used for model training.
            </p>
          </div>

          <div>
            <p className="font-medium text-[var(--color-text-primary)]">ScreenshotCore</p>
            <p className="mt-1">Receives the URL of a target business website to capture a screenshot for design analysis. We do not send any personal data to ScreenshotCore. Screenshots are used transiently for Gemini analysis and are not stored.</p>
          </div>
        </div>

        <p className="mt-5">
          Each third-party service is subject to its own privacy policy. We review these annually and will update this section if our service stack changes.
        </p>
      </LegalSection>

      <LegalSection id="retention" heading="4. Data Retention">
        <ul className="list-disc space-y-2 pl-5">
          <li><strong className="text-[var(--color-text-primary)]">Account data:</strong> retained for as long as your account is active.</li>
          <li><strong className="text-[var(--color-text-primary)]">Leads, audits, pitches, pipeline:</strong> retained until you delete them or delete your account.</li>
          <li><strong className="text-[var(--color-text-primary)]">Google Places cache:</strong> individual place records expire after 7 days and are refreshed on next lookup.</li>
          <li><strong className="text-[var(--color-text-primary)]">PageSpeed audit results:</strong> retained until you delete the associated lead or your account.</li>
          <li><strong className="text-[var(--color-text-primary)]">After account deletion:</strong> all personal data is deleted or anonymised within 30 days. Anonymised aggregate usage data (e.g. &ldquo;N users ran searches in this city&rdquo;) may be retained for product analysis.</li>
          <li><strong className="text-[var(--color-text-primary)]">Payment records:</strong> retained for 7 years as required by Indian GST regulations.</li>
        </ul>
      </LegalSection>

      <LegalSection id="cookies" heading="5. Cookies & Tracking">
        <p>We use only the cookies necessary to run the service:</p>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border-subtle)]">
                <th className="pb-2 pr-6 text-left text-xs font-medium text-[var(--color-text-tertiary)]">Cookie</th>
                <th className="pb-2 pr-6 text-left text-xs font-medium text-[var(--color-text-tertiary)]">Purpose</th>
                <th className="pb-2 text-left text-xs font-medium text-[var(--color-text-tertiary)]">Expires</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-subtle)]">
              <tr>
                <td className="py-2 pr-6 font-medium text-[var(--color-text-primary)]">sb-access-token</td>
                <td className="py-2 pr-6">Supabase session auth token — keeps you logged in</td>
                <td className="py-2">1 hour</td>
              </tr>
              <tr>
                <td className="py-2 pr-6 font-medium text-[var(--color-text-primary)]">sb-refresh-token</td>
                <td className="py-2 pr-6">Refreshes your session token automatically</td>
                <td className="py-2">7 days</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="mt-4">
          We do not use advertising cookies, tracking pixels, or any third-party analytics platform that links usage to your identity. Blocking the Supabase session cookies will prevent you from logging in.
        </p>
      </LegalSection>

      <LegalSection id="your-rights" heading="6. Your Rights">
        <p>Regardless of where you are located, you have the following rights over your data at any time:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li><strong className="text-[var(--color-text-primary)]">Access:</strong> request a copy of the personal data we hold about you.</li>
          <li><strong className="text-[var(--color-text-primary)]">Correction:</strong> update or correct inaccurate data in your account settings.</li>
          <li><strong className="text-[var(--color-text-primary)]">Deletion:</strong> delete your account and all associated data from Settings → Data & Privacy.</li>
          <li><strong className="text-[var(--color-text-primary)]">Export:</strong> download a JSON export of all your data from Settings → Data & Privacy.</li>
          <li><strong className="text-[var(--color-text-primary)]">Objection:</strong> opt out of usage analytics by emailing us — you will retain full service access.</li>
        </ul>

        <LegalSubSection heading="6.1 EU / EEA / UK users (GDPR)">
          <p>If you are in the EU, EEA, or UK, the General Data Protection Regulation applies to our processing of your personal data. In addition to the rights above, you have:</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>The right to data portability (machine-readable export — available from Settings).</li>
            <li>The right to restrict processing (we stop using your data while a dispute is pending).</li>
            <li>The right to withdraw consent at any time.</li>
            <li>The right to lodge a complaint with your local supervisory authority.</li>
          </ul>
          <p className="mt-3">Our lawful basis for processing: performance of contract (providing the service) for account and lead data; legitimate interest (improving the product) for anonymised usage data.</p>
        </LegalSubSection>

        <LegalSubSection heading="6.2 UAE users (PDPL)">
          <p>If you are in the UAE, the Personal Data Protection Law 2021 applies. You have the right to access, correct, and request deletion of your personal data. Contact us at nearsitedlabs@gmail.com to exercise these rights. We will respond within 30 days.</p>
        </LegalSubSection>

        <LegalSubSection heading="6.3 California users (CCPA)">
          <p>We do not sell personal information as defined by the CCPA. California residents have the right to know what personal information we collect, request its deletion, and opt out of any sale (there is none). To exercise these rights, email <a href="mailto:nearsitedlabs@gmail.com" className="text-[var(--color-accent)] hover:underline">nearsitedlabs@gmail.com</a>.</p>
        </LegalSubSection>

        <p className="mt-4">To exercise any of these rights, email <a href="mailto:nearsitedlabs@gmail.com" className="text-[var(--color-accent)] hover:underline">nearsitedlabs@gmail.com</a>. We will respond within 30 days. Account deletion is available immediately from your account settings.</p>
      </LegalSection>

      <LegalSection id="international" heading="7. International Transfers">
        <p>
          Again Labs is based in Kerala, India. Our infrastructure is hosted on Supabase (servers in USA and EU regions), and we use Google Cloud services (global). By using Nearsited, you acknowledge that your data may be processed in the USA, EU, or India.
        </p>
        <p>
          For EU/EEA users, transfers to the USA rely on Standard Contractual Clauses (SCCs) as the safeguard mechanism. For UK users, the UK International Data Transfer Agreement (IDTA) applies where relevant.
        </p>
      </LegalSection>

      <LegalSection id="changes" heading="8. Changes to This Policy">
        <p>
          We will notify you by email of any material changes to this policy — those that change what data we collect, with whom we share it, or how long we retain it — at least 14 days before the changes take effect. Minor clarifications may be made without notice; the &ldquo;Last updated&rdquo; date at the top of this page reflects every change.
        </p>
      </LegalSection>

      {/* Contact — flush block */}
      <div className="border-t border-[var(--color-border-subtle)] pt-8">
        <p className="text-sm text-[var(--color-text-secondary)]">
          <strong className="text-[var(--color-text-primary)]">Privacy questions or data requests?</strong>{" "}
          Email <a href="mailto:nearsitedlabs@gmail.com" className="text-[var(--color-accent)] hover:underline">nearsitedlabs@gmail.com</a> — we aim to respond within 2 business days.
        </p>
        <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
          See also:{" "}
          <Link href="/terms" className="text-[var(--color-accent)] hover:underline">Terms of Service</Link>
        </p>
      </div>

    </LegalPage>
  );
}
