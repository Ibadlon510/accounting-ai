import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account",
  description:
    "Create your free Agar Smart Accounting account. AI-powered bookkeeping, VAT automation, and real-time financial insights for UAE businesses.",
  openGraph: {
    title: "Create Account | Agar Smart Accounting",
    description:
      "Start free with AI-powered accounting. Automated VAT returns, bank reconciliation, and real-time insights.",
  },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
