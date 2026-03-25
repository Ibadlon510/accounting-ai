import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  description:
    "Sign in to Agar Smart Accounting. Access your AI-powered bookkeeping, VAT returns, and financial dashboards.",
  openGraph: {
    title: "Sign In | Agar Smart Accounting",
    description:
      "Access your AI-powered accounting dashboard. Manage invoices, VAT, and bank reconciliation.",
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
