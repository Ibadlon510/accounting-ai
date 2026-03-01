import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Agar Smart Accounting",
  description: "Privacy Policy for Agar Smart Accounting platform.",
};

export default function PrivacyPage() {
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
        <h1 className="text-[36px] font-bold tracking-tight text-text-primary">Privacy Policy</h1>
        <p className="mt-2 text-[14px] text-text-meta">Last updated: January 2026</p>

        <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-text-secondary">
          <section>
            <h2 className="text-[20px] font-semibold text-text-primary mb-3">1. Information We Collect</h2>
            <p className="mb-2">We collect the following types of information:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Account Information:</strong> Name, email address, and password when you register.</li>
              <li><strong>Organization Data:</strong> Company name, TRN, currency preferences, and fiscal year settings.</li>
              <li><strong>Financial Data:</strong> Journal entries, invoices, bills, bank transactions, and other accounting records you create.</li>
              <li><strong>Documents:</strong> Files you upload for AI processing (invoices, receipts, bank statements).</li>
              <li><strong>Usage Data:</strong> Pages visited, features used, and performance metrics.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-text-primary mb-3">2. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>To provide and maintain the accounting Service.</li>
              <li>To process AI-assisted features (document scanning, classification, smart entry).</li>
              <li>To process billing and subscription management via Stripe.</li>
              <li>To send transactional emails (account verification, password reset, subscription updates).</li>
              <li>To improve the Service and develop new features.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-text-primary mb-3">3. Data Storage & Security</h2>
            <p>
              Your data is stored on secure cloud infrastructure with encryption at rest and in transit. We use industry-standard security measures including TLS encryption, hashed passwords (bcrypt), and immutable audit trails for all accounting operations.
            </p>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-text-primary mb-3">4. AI Processing</h2>
            <p>
              Documents uploaded for AI processing are sent to third-party AI providers (Google Gemini, OpenAI) for data extraction. These providers process data according to their respective privacy policies and do not retain your data for training purposes. We do not use your financial data to train AI models.
            </p>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-text-primary mb-3">5. Third-Party Services</h2>
            <p className="mb-2">We use the following third-party services:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Stripe:</strong> Payment processing and subscription management.</li>
              <li><strong>AWS S3:</strong> Secure document storage.</li>
              <li><strong>Google / OpenAI:</strong> AI-powered document processing and smart features.</li>
              <li><strong>Resend:</strong> Transactional email delivery.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-text-primary mb-3">6. Data Sharing</h2>
            <p>
              We do not sell, trade, or rent your personal or financial data to third parties. We only share data as necessary to provide the Service (e.g., payment processing with Stripe) or as required by law.
            </p>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-text-primary mb-3">7. Data Retention</h2>
            <p>
              We retain your data for as long as your account is active. Upon account termination, you have 30 days to export your data. After this period, data may be permanently deleted from our systems.
            </p>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-text-primary mb-3">8. Your Rights</h2>
            <p className="mb-2">You have the right to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Access and export your data at any time.</li>
              <li>Correct inaccurate personal information.</li>
              <li>Request deletion of your account and associated data.</li>
              <li>Object to processing of your data for certain purposes.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-text-primary mb-3">9. Cookies</h2>
            <p>
              We use essential cookies for authentication and session management. We do not use third-party tracking cookies. Analytics data is collected anonymously.
            </p>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-text-primary mb-3">10. Contact</h2>
            <p>
              For privacy-related inquiries, contact us at{" "}
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
