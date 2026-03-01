import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | Agar Smart Accounting",
  description: "Terms of Service for Agar Smart Accounting platform.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between px-8 py-5 border-b border-border-subtle">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-orange-500">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-white" stroke="currentColor" strokeWidth={2.5}>
              <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="text-[15px] font-bold text-text-primary">Agar</span>
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-8 py-16">
        <h1 className="text-[36px] font-bold tracking-tight text-text-primary">Terms of Service</h1>
        <p className="mt-2 text-[14px] text-text-meta">Last updated: January 2026</p>

        <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-text-secondary">
          <section>
            <h2 className="text-[20px] font-semibold text-text-primary mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using Agar Smart Accounting (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-text-primary mb-3">2. Description of Service</h2>
            <p>
              Agar Smart Accounting is a cloud-based accounting software platform that provides bookkeeping, VAT compliance, financial reporting, and AI-assisted features for businesses operating in the UAE and beyond.
            </p>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-text-primary mb-3">3. User Accounts</h2>
            <p>
              You must provide accurate information when creating an account. You are responsible for maintaining the security of your account credentials and for all activities under your account.
            </p>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-text-primary mb-3">4. Subscription & Billing</h2>
            <p>
              The Service offers Free and Pro plans. Pro subscriptions are billed monthly or annually in AED. Prices may change with 30 days&apos; notice. Refunds are handled on a case-by-case basis.
            </p>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-text-primary mb-3">5. Data Ownership</h2>
            <p>
              You retain ownership of all data you enter into the Service. We do not claim any intellectual property rights over your financial data. You may export your data at any time.
            </p>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-text-primary mb-3">6. AI Features</h2>
            <p>
              AI-powered features (document scanning, smart classification, natural language entry) are provided as assistive tools. You are responsible for reviewing and verifying all AI-generated outputs before finalizing any accounting entries.
            </p>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-text-primary mb-3">7. Limitation of Liability</h2>
            <p>
              The Service is provided &quot;as is&quot; without warranty. Agar shall not be liable for any indirect, incidental, or consequential damages arising from the use of the Service. Our total liability is limited to the amount paid by you in the 12 months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-text-primary mb-3">8. Termination</h2>
            <p>
              Either party may terminate this agreement at any time. Upon termination, you may export your data within 30 days. After that period, data may be permanently deleted.
            </p>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-text-primary mb-3">9. Governing Law</h2>
            <p>
              These Terms are governed by the laws of the United Arab Emirates. Any disputes shall be subject to the exclusive jurisdiction of the courts of Dubai.
            </p>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-text-primary mb-3">10. Contact</h2>
            <p>
              For questions about these Terms, contact us at{" "}
              <a href="mailto:admin@agaraccounting.com" className="text-text-primary underline">
                admin@agaraccounting.com
              </a>.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
