import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "Agar: Smart Accounting",
    template: "%s | Agar Smart Accounting",
  },
  description:
    "AI-powered accounting software for UAE businesses. VAT compliance, automated bookkeeping, bank reconciliation, and real-time financial insights — all in one platform.",
  keywords: [
    "accounting software",
    "UAE accounting",
    "VAT compliance",
    "AI bookkeeping",
    "smart accounting",
    "Agar",
    "FTA compliant",
    "invoice management",
    "bank reconciliation",
    "financial reports",
    "expense tracking",
    "Dubai accounting",
    "Abu Dhabi accounting",
  ],
  authors: [{ name: "Agar Smart Accounting" }],
  creator: "Agar Smart Accounting",
  publisher: "Agar Smart Accounting",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_AE",
    url: "https://agaraccounting.com",
    siteName: "Agar Smart Accounting",
    title: "Agar: AI-Powered Smart Accounting for UAE Businesses",
    description:
      "Automated bookkeeping, VAT returns, bank reconciliation, and real-time financial insights. Start free, upgrade when you grow.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Agar: Smart Accounting",
    description:
      "AI-powered accounting software for UAE businesses. Start free.",
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://agaraccounting.com"
  ),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0F172A" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Agar" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "Agar Smart Accounting",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              description:
                "AI-powered accounting software for UAE businesses. VAT compliance, automated bookkeeping, bank reconciliation, and real-time financial insights.",
              url: "https://agaraccounting.com",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "AED",
                description: "Free tier available",
              },
              featureList: [
                "AI-powered bookkeeping",
                "VAT return automation",
                "Bank reconciliation",
                "Invoice management",
                "Expense tracking",
                "Real-time financial reports",
                "FTA compliance",
              ],
              author: {
                "@type": "Organization",
                name: "Agar Smart Accounting",
                url: "https://agaraccounting.com",
              },
            }),
          }}
        />
      </head>
      <body className={`${plusJakarta.variable} font-sans antialiased`}>
        <AuthSessionProvider>
          <QueryProvider>
          <TooltipProvider>
            {children}
            <Toaster position="bottom-right" richColors />
          </TooltipProvider>
          </QueryProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
