import { LegalPage, LegalSection, LegalSubSection } from "@/components/legal/LegalPage";
import Link from "next/link";

const TOC = [
  { id: "introduction",     label: "1. Introduction" },
  { id: "account",          label: "2. Account Registration" },
  { id: "acceptable-use",   label: "3. Acceptable Use" },
  { id: "billing",          label: "4. Subscriptions & Billing" },
  { id: "refunds",          label: "5. Refund Policy" },
  { id: "ip",               label: "6. Intellectual Property" },
  { id: "termination",      label: "7. Termination" },
  { id: "liability",        label: "8. Limitation of Liability" },
  { id: "governing-law",    label: "9. Governing Law" },
  { id: "changes",          label: "10. Changes to These Terms" },
];

export default function TermsPage() {
  return (
    <LegalPage title="Terms of service" lastUpdated="8 June 2026" toc={TOC}>

      <LegalSection id="introduction" heading="1. Introduction">
        <p>
          Nearsited is a lead-intelligence tool for web design agencies and freelancers. It finds local businesses with weak or absent online presences, audits their websites, and generates personalised outreach pitches. Nearsited is operated by Again Labs, a proprietorship registered in Kerala, India under MSME registration.
        </p>
        <p>
          By creating an account you agree to these Terms. If you do not agree, you may not use the service. &ldquo;You&rdquo; means the individual or entity accessing the service. &ldquo;We&rdquo; and &ldquo;Nearsited&rdquo; mean Again Labs.
        </p>
      </LegalSection>

      <LegalSection id="account" heading="2. Account Registration">
        <p>
          To use Nearsited you must create an account with a valid email address and a password of at least 8 characters. You may also sign in via Google OAuth.
        </p>
        <ul className="mt-2 list-disc space-y-1.5 pl-5">
          <li>You must be at least 18 years old.</li>
          <li>You must provide accurate information. We reserve the right to suspend accounts where information is found to be false.</li>
          <li>One account per person. Creating multiple accounts to circumvent free-tier limits is a breach of these Terms.</li>
          <li>You are responsible for maintaining the confidentiality of your credentials. All activity under your account is your responsibility.</li>
          <li>Notify us immediately at nearsitedlabs@gmail.com if you suspect unauthorised access.</li>
        </ul>
      </LegalSection>

      <LegalSection id="acceptable-use" heading="3. Acceptable Use">
        <p>Nearsited may be used only for legitimate business development purposes. You agree not to:</p>
        <ul className="mt-2 list-disc space-y-1.5 pl-5">
          <li>Use the service for any purpose that is illegal under applicable law.</li>
          <li>Use generated pitches to send spam or bulk unsolicited messages to businesses that have not indicated interest in hearing from you.</li>
          <li>Attempt to bypass credit limits by creating duplicate accounts.</li>
          <li>Scrape, crawl, or extract data from Nearsited programmatically beyond normal use of the web interface or documented API.</li>
          <li>Reverse engineer, decompile, or attempt to derive the source code of the service.</li>
          <li>Interfere with the normal operation of the service or attempt to gain unauthorised access to any underlying system.</li>
          <li>Resell or sublicense access to the service without written permission from Again Labs.</li>
        </ul>
        <p className="mt-3">
          Business data surfaced by Nearsited (business names, addresses, phone numbers, websites) is sourced from Google Places and is subject to <a href="https://policies.google.com/terms" className="text-[var(--color-accent)] hover:underline" target="_blank" rel="noopener noreferrer">Google&rsquo;s Terms of Service</a>. You are responsible for ensuring your outreach activity complies with applicable regulations in the recipient&rsquo;s jurisdiction.
        </p>
      </LegalSection>

      <LegalSection id="billing" heading="4. Subscriptions & Billing">
        <LegalSubSection heading="4.1 Plans">
          <p>Nearsited offers three tiers:</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li><strong className="text-[var(--color-text-primary)]">Free:</strong> 20 lifetime opportunity analyses and 3 city searches. No payment required.</li>
            <li><strong className="text-[var(--color-text-primary)]">Starter ($19/month):</strong> 50 analyses per month, 3 city searches per month, email pitch generation, pipeline tracking.</li>
            <li><strong className="text-[var(--color-text-primary)]">Agency ($49/month):</strong> 200 analyses per month, 10 city searches per month, email and WhatsApp pitch generation, white-label shared reports, priority support.</li>
          </ul>
          <p className="mt-3">
            Beta pricing is locked for 12 months from your first subscription date. We will give 30 days&rsquo; notice before any price change affects renewing subscriptions.
          </p>
        </LegalSubSection>

        <LegalSubSection heading="4.2 Payment Processing">
          <p>
            All payments are processed by Dodo Payments. We never store, see, or have access to your full payment card details. By subscribing, you authorise Dodo Payments to charge your payment method on a recurring basis on the subscription&rsquo;s renewal date.
          </p>
        </LegalSubSection>

        <LegalSubSection heading="4.3 Cancellation">
          <p>
            You may cancel a paid subscription at any time from your account settings. Cancellation takes effect at the end of the current billing period. You retain access to paid features until that date. We do not pro-rate unused days.
          </p>
        </LegalSubSection>
      </LegalSection>

      <LegalSection id="refunds" heading="5. Refund Policy">
        <p>
          We offer a 14-day money-back guarantee on the first payment for any paid plan. If the service does not work as described, email <a href="mailto:nearsitedlabs@gmail.com" className="text-[var(--color-accent)] hover:underline">nearsitedlabs@gmail.com</a> within 14 days of your first charge and we will refund the full amount, no questions asked.
        </p>
        <p>
          Refunds are not available for second or subsequent billing periods, annual plans after 14 days, or free-tier accounts (no charge was made).
        </p>
      </LegalSection>

      <LegalSection id="ip" heading="6. Intellectual Property">
        <LegalSubSection heading="6.1 Nearsited platform">
          <p>
            The Nearsited platform — including its code, visual design, trademarks, scoring algorithms, and prompt engineering — is the property of Again Labs and is protected by copyright and intellectual property law. Nothing in these Terms grants you a licence to copy or redistribute the platform itself.
          </p>
        </LegalSubSection>

        <LegalSubSection heading="6.2 Your data">
          <p>
            You own your data. Leads, pipeline entries, notes, and contact information you save in Nearsited remain yours. We do not claim any ownership over business data you import or generate through the service.
          </p>
        </LegalSubSection>

        <LegalSubSection heading="6.3 Generated pitches">
          <p>
            Pitches generated by Nearsited using your business data and Gemini AI are provided to you for your commercial outreach use. You have a perpetual, non-exclusive, royalty-free licence to use, edit, and send these pitches as part of your sales activity. Pitch inputs you submit to Nearsited are not used to train AI models — see Section 5 of our Privacy Policy for details.
          </p>
        </LegalSubSection>

        <LegalSubSection heading="6.4 Third-party data">
          <p>
            Business data surfaced in Nearsited (names, addresses, websites, ratings) is sourced from Google Places and is subject to Google&rsquo;s terms. We cache this data for up to 7 days to reduce API calls, consistent with Google&rsquo;s caching guidelines. You may not re-export this data in bulk for purposes unrelated to individual business outreach.
          </p>
        </LegalSubSection>
      </LegalSection>

      <LegalSection id="termination" heading="7. Termination">
        <LegalSubSection heading="7.1 By you">
          <p>
            You may close your account at any time from Settings → Data & Privacy → Delete account. Your data will be permanently deleted within 30 days of account closure. Paid subscription access continues until the end of the current billing period.
          </p>
        </LegalSubSection>

        <LegalSubSection heading="7.2 By us">
          <p>
            We may suspend or terminate your account if you breach these Terms, if your use threatens the security or integrity of the service, or if we reasonably suspect fraudulent activity. Where possible, we will give notice before suspension. For serious violations (spam, scraping, abuse), suspension may be immediate.
          </p>
          <p className="mt-2">
            We may also discontinue the service with 30 days&rsquo; written notice. In that case, paid subscribers will receive a pro-rated refund for the unused portion of their current billing period.
          </p>
        </LegalSubSection>
      </LegalSection>

      <LegalSection id="liability" heading="8. Limitation of Liability">
        <p>
          Nearsited is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of any kind, express or implied. We do not warrant that the service will be uninterrupted, error-free, or that business data sourced from Google Places will always be current or accurate.
        </p>
        <p>
          To the maximum extent permitted by applicable law, Again Labs is not liable for any indirect, incidental, special, consequential, or punitive damages — including lost revenue, lost clients, or lost business opportunities — arising from your use of, or inability to use, Nearsited.
        </p>
        <p>
          Our total liability for any claim arising out of these Terms or your use of the service is limited to the total fees you have paid to Again Labs in the 12 months immediately preceding the claim.
        </p>
        <p>
          Some jurisdictions do not allow the exclusion of certain warranties or the limitation of certain liabilities. In those jurisdictions, our liability is limited to the minimum extent permitted by law.
        </p>
      </LegalSection>

      <LegalSection id="governing-law" heading="9. Governing Law">
        <p>
          These Terms are governed by the laws of India. Any dispute arising out of or relating to these Terms or the Nearsited service shall be subject to the exclusive jurisdiction of the courts located in Kerala, India.
        </p>
        <p>
          If you are accessing the service from outside India, you agree that Indian law governs these Terms and you consent to the jurisdiction of the Kerala courts for any dispute that cannot be resolved informally. We will always attempt to resolve disputes amicably before resorting to formal proceedings.
        </p>
      </LegalSection>

      <LegalSection id="changes" heading="10. Changes to These Terms">
        <p>
          We may update these Terms from time to time. For material changes — those that affect your rights or obligations — we will send an email to your registered address at least 14 days before the changes take effect.
        </p>
        <p>
          Minor changes (typos, clarifications that do not change meaning, updates to linked resources) may be made without notice. The &ldquo;Last updated&rdquo; date at the top of this page will always reflect the most recent revision.
        </p>
        <p>
          Continued use of Nearsited after changes take effect constitutes your acceptance of the revised Terms.
        </p>
      </LegalSection>

      {/* Contact — flush block at bottom, outside numbered sections */}
      <div className="border-t border-[var(--color-border-subtle)] pt-8">
        <p className="text-sm text-[var(--color-text-secondary)]">
          <strong className="text-[var(--color-text-primary)]">Questions about these Terms?</strong>{" "}
          Email <a href="mailto:nearsitedlabs@gmail.com" className="text-[var(--color-accent)] hover:underline">nearsitedlabs@gmail.com</a> — we aim to respond within 2 business days.
        </p>
        <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
          See also:{" "}
          <Link href="/privacy" className="text-[var(--color-accent)] hover:underline">Privacy Policy</Link>
        </p>
      </div>

    </LegalPage>
  );
}
