"use client";

import Link from "next/link";
import {
  Sparkles,
  BarChart3,
  Shield,
  Zap,
  Globe,
  Receipt,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  { icon: Sparkles, title: "AI-Powered Automation", description: "Smart transaction classification, natural language entry, and automated bookkeeping that learns your patterns." },
  { icon: Receipt, title: "VAT & Tax Ready", description: "Built-in VAT handling, compliant returns, input/output tracking, and automated tax calculations." },
  { icon: BarChart3, title: "Real-time Insights", description: "Live dashboards, P&L, balance sheets, and cash flow forecasts updated in real-time." },
  { icon: Shield, title: "Double-Entry Engine", description: "Immutable journal entries, automated trial balance verification, and complete audit trails." },
  { icon: Globe, title: "Multi-Currency", description: "Seamless AED, USD, EUR transactions with automatic exchange rate management." },
  { icon: Zap, title: "Bank Reconciliation", description: "Import CSV statements, AI-suggested matches, and one-click reconciliation." },
];

const benefits = [
  "Pre-configured chart of accounts template",
  "Automated invoice generation with VAT",
  "Customer & supplier management",
  "Inventory tracking with reorder alerts",
  "FTA-ready VAT return preparation",
  "AI-assisted transaction classification",
  "Profit & Loss and Balance Sheet reports",
  "Bank statement import & reconciliation",
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <header className="flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-orange-500">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-white" stroke="currentColor" strokeWidth={2.5}>
              <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <div className="flex flex-col leading-tight">
          <span className="text-[15px] font-bold text-text-primary">Agar</span>
          <span className="text-[11px] font-medium text-text-secondary">Smart Accounting</span>
        </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" className="h-9 rounded-xl text-[13px] font-medium text-text-secondary hover:text-text-primary">
              Sign in
            </Button>
          </Link>
          <Link href="/signup">
            <Button className="h-9 rounded-xl bg-text-primary px-5 text-[13px] font-semibold text-white hover:bg-text-primary/90">
              Get Started Free
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-canvas-gradient px-8 pb-20 pt-16 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border-subtle bg-surface px-4 py-1.5 text-[13px] text-text-secondary">
            <Sparkles className="h-3.5 w-3.5 text-accent-yellow" />
            AI-powered smart accounting for businesses
          </div>
          <h1 className="text-[52px] font-extrabold leading-[1.1] tracking-tight text-text-primary">
            Accounting that{" "}
            <span className="bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
              thinks
            </span>{" "}
            for you
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-[18px] leading-relaxed text-text-secondary">
            Smart bookkeeping, VAT automation, and real-time financial insights
            — built for SMEs who want to focus on growth, not paperwork.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link href="/signup">
              <Button className="h-12 gap-2 rounded-xl bg-text-primary px-8 text-[15px] font-semibold text-white hover:bg-text-primary/90">
                Start Free Trial <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" className="h-12 rounded-xl border-border-subtle px-8 text-[15px] font-medium text-text-primary hover:bg-black/5">
                View Demo
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-[13px] text-text-meta">No credit card required • Free for 14 days</p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="mx-auto max-w-6xl px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-[36px] font-bold tracking-tight text-text-primary">
            Everything you need to run your finances
          </h2>
          <p className="mt-3 text-[16px] text-text-secondary">
            From invoicing to VAT returns, powered by AI
          </p>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="dashboard-card">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-red-500/10 to-orange-500/10">
                  <Icon className="h-5 w-5 text-text-primary" strokeWidth={1.8} />
                </div>
                <h3 className="mt-4 text-[17px] font-semibold text-text-primary">{feature.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-text-secondary">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-canvas-gradient px-8 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-[36px] font-bold tracking-tight text-text-primary">
              Built for modern businesses
            </h2>
            <p className="mt-3 text-[16px] text-text-secondary">
              Pre-configured with accounting standards and tax compliance
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {benefits.map((benefit) => (
              <div key={benefit} className="flex items-center gap-3 rounded-xl bg-surface px-5 py-4" style={{ boxShadow: "var(--shadow-card)" }}>
                <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
                <span className="text-[14px] font-medium text-text-primary">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-8 py-20 text-center">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-[36px] font-bold tracking-tight text-text-primary">
            Ready to automate your accounting?
          </h2>
          <p className="mt-4 text-[16px] text-text-secondary">
            Join businesses saving hours every week with AI-powered bookkeeping.
          </p>
          <div className="mt-8">
            <Link href="/signup">
              <Button className="h-12 gap-2 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 px-8 text-[15px] font-semibold text-white hover:opacity-90">
                Get Started Free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border-subtle bg-surface px-8 py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-orange-500">
              <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 text-white" stroke="currentColor" strokeWidth={2.5}>
                <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="text-[13px] font-semibold text-text-primary">Agar</span>
          </div>
          <p className="text-[12px] text-text-meta">© 2026 Agar. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
