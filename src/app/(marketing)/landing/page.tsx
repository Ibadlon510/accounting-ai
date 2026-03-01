"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sparkles,
  BarChart3,
  Shield,
  Zap,
  Globe,
  Receipt,
  ArrowRight,
  CheckCircle2,
  LayoutDashboard,
  Crown,
  ChevronDown,
  Rocket,
  Grid3X3,
} from "lucide-react";
import { useSession } from "next-auth/react";
import Section from "@/components/landing/ui/Section";
import SectionHeader from "@/components/landing/ui/SectionHeader";
import EnhancedButton from "@/components/landing/ui/EnhancedButton";

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
  const { data: session } = useSession();
  const isSignedIn = !!session;

  return (
    <div className="min-h-screen bg-gradient-to-b from-beige via-white to-beige/50 dark:from-agar-dark dark:via-agar-dark dark:to-agar-dark">
      {/* Hero */}
      <section className="relative pt-32 pb-16 lg:pt-40 lg:pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-agarwood/5 via-transparent to-gold/5" />
        <div className="absolute top-20 right-20 w-72 h-72 bg-gold/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-agarwood/5 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-gold/10 border border-gold/20 rounded-full mb-8"
          >
            <Sparkles size={16} className="text-gold" />
            <span className="text-sm font-semibold text-agarwood">AI-Powered Smart Accounting</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-serif font-bold text-agarwood leading-tight mb-6"
          >
            Accounting that{" "}
            <span className="bg-gradient-to-r from-gold via-gold/90 to-gold bg-clip-text text-transparent">
              thinks
            </span>{" "}
            for you
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-lg text-agarwood/75 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Smart bookkeeping, VAT automation, and real-time financial insights
            — built for SMEs who want to focus on growth, not paperwork.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            {isSignedIn ? (
              <Link href="/dashboard">
                <EnhancedButton variant="luxury" size="lg" icon={<LayoutDashboard size={18} />} iconPosition="left" showArrow>
                  Go to Dashboard
                </EnhancedButton>
              </Link>
            ) : (
              <>
                <Link href="/signup">
                  <EnhancedButton variant="luxury" size="lg" showArrow glow>
                    Start Free Trial
                  </EnhancedButton>
                </Link>
                <Link href="/tools">
                  <EnhancedButton variant="outline" size="lg" icon={<Grid3X3 size={18} />} iconPosition="left">
                    Explore Apps
                  </EnhancedButton>
                </Link>
              </>
            )}
          </motion.div>

          {!isSignedIn && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-5 text-sm text-agarwood/50"
            >
              No credit card required &bull; Free plan available forever
            </motion.p>
          )}
        </div>
      </section>

      {/* Features Grid */}
      <Section id="features" variant="default" padding="lg">
        <SectionHeader
          subtitle="Platform Features"
          title="Everything you need to|run your finances"
          description="From invoicing to VAT returns, powered by AI that learns your business patterns."
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className="bg-white/80 dark:bg-agar-dark-surface/80 backdrop-blur-sm border-2 border-white/60 dark:border-gold/10 hover:border-gold/40 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 group"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-gold/20 to-agarwood/10 border border-gold/20 group-hover:from-gold/30 group-hover:to-agarwood/15 transition-all duration-300">
                  <Icon size={22} className="text-agarwood group-hover:text-gold transition-colors duration-300" strokeWidth={1.8} />
                </div>
                <h3 className="mt-5 text-lg font-serif font-bold text-agarwood">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-agarwood/70">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>
      </Section>

      {/* Benefits */}
      <Section variant="gradient" padding="lg">
        <SectionHeader
          subtitle="Why Agar"
          title="Built for modern|UAE businesses"
          description="Pre-configured with accounting standards and tax compliance for the UAE market."
        />

        <div className="grid sm:grid-cols-2 gap-4 max-w-4xl mx-auto">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit}
              initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.06 }}
              className="flex items-center gap-3 rounded-xl bg-white/70 dark:bg-agar-dark-surface/70 backdrop-blur-sm border border-gold/15 px-5 py-4 hover:border-gold/30 transition-all duration-300"
            >
              <CheckCircle2 size={18} className="shrink-0 text-gold" />
              <span className="text-sm font-medium text-agarwood">{benefit}</span>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* Pricing */}
      <PricingSection />

      {/* Explore Apps CTA */}
      <Section variant="default" padding="lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto"
        >
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-gold/10 border border-gold/20 rounded-full mb-6">
            <Grid3X3 size={16} className="text-gold" />
            <span className="text-sm font-semibold text-agarwood">App Marketplace</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-agarwood mb-4">
            Explore Our Growing Ecosystem
          </h2>
          <p className="text-base text-agarwood/70 leading-relaxed mb-8">
            Discover VAT calculators, invoice generators, tax calendars, and more — all designed for UAE businesses.
          </p>
          <Link href="/tools">
            <EnhancedButton variant="luxury" size="lg" showArrow glow icon={<Grid3X3 size={18} />} iconPosition="left">
              Browse All Apps
            </EnhancedButton>
          </Link>
        </motion.div>
      </Section>

      {/* FAQ */}
      <FAQSection />

      {/* CTA */}
      <Section variant="dark" padding="lg">
        <div className="text-center max-w-2xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-white mb-4"
          >
            Ready to automate your accounting?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-base text-white/70 leading-relaxed mb-8"
          >
            Join businesses saving hours every week with AI-powered bookkeeping.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Link href={isSignedIn ? "/dashboard" : "/signup"}>
              <EnhancedButton variant="luxury" size="lg" showArrow glow>
                {isSignedIn ? "Go to Dashboard" : "Get Started Free"}
              </EnhancedButton>
            </Link>
          </motion.div>
        </div>
      </Section>
    </div>
  );
}

/* ─── Pricing Section ─────────────────────────────────────── */

const pricingPlans = [
  {
    name: "Free",
    description: "For solo entrepreneurs getting started",
    monthlyPrice: 0,
    annualPrice: 0,
    originalMonthlyPrice: 0,
    originalAnnualPrice: 0,
    features: [
      "1 user",
      "25 journal entries/month",
      "5 AI document scans (lifetime)",
      "1 AI bank statement import (lifetime)",
      "Basic reports",
      "Manual bookkeeping",
    ],
    cta: "Get Started Free",
    href: "/signup",
    highlighted: false,
  },
  {
    name: "Pro",
    description: "For growing businesses that need AI power",
    monthlyPrice: 19,
    annualPrice: 190,
    originalMonthlyPrice: 38,
    originalAnnualPrice: 380,
    features: [
      "2 users included (+9 AED/user/mo)",
      "Unlimited journal entries",
      "150 AI tokens/month (auto-refresh)",
      "Unlimited AI document processing",
      "Unlimited bank statement imports",
      "AI token top-ups available",
      "Priority support",
      "Advanced reports & analytics",
    ],
    cta: "Start Pro Trial",
    href: "/signup",
    highlighted: true,
  },
];

function PricingSection() {
  const [annual, setAnnual] = useState(false);

  return (
    <Section id="pricing" variant="gradient" padding="lg">
      <SectionHeader
        subtitle="Launch Pricing"
        title="Simple, transparent|pricing"
        description="Start free, upgrade when you need more. All paid plans are 50% off during our launch period."
        variant="luxury"
      />

      {/* Monthly / Annual toggle */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="flex items-center justify-center mb-12"
      >
        <div className="inline-flex items-center bg-white/80 dark:bg-agar-dark-surface/80 backdrop-blur-sm border border-gold/20 rounded-full p-1.5 shadow-lg">
          <button
            onClick={() => setAnnual(false)}
            className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
              !annual
                ? "bg-agarwood text-white shadow-md"
                : "text-agarwood/70 hover:text-agarwood"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setAnnual(true)}
            className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 relative ${
              annual
                ? "bg-agarwood text-white shadow-md"
                : "text-agarwood/70 hover:text-agarwood"
            }`}
          >
            Annual
            <span className="absolute -top-2.5 -right-2.5 bg-gold text-agarwood text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
              -17%
            </span>
          </button>
        </div>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {pricingPlans.map((plan, index) => {
          const price = annual ? plan.annualPrice : plan.monthlyPrice;
          const originalPrice = annual ? plan.originalAnnualPrice : plan.originalMonthlyPrice;
          const suffix = annual ? "/yr" : "/mo";
          return (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 + index * 0.15 }}
              className="relative"
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                  <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-gold to-gold/90 text-agarwood px-4 py-1.5 rounded-full text-xs font-bold shadow-lg border border-gold/40">
                    <Rocket size={12} />
                    50% Off — Launch Price
                  </div>
                </div>
              )}

              <div
                className={`relative h-full rounded-3xl p-8 lg:p-10 transition-all duration-500 ${
                  plan.highlighted
                    ? "bg-white/95 dark:bg-agar-dark-surface/95 border-2 border-gold/40 shadow-2xl shadow-gold/10"
                    : "bg-white/80 dark:bg-agar-dark-surface/80 border-2 border-beige/40 dark:border-gold/10 shadow-lg"
                }`}
              >
                <div className="mb-8">
                  <h3 className="text-2xl font-serif font-bold text-agarwood mb-2">{plan.name}</h3>
                  <p className="text-sm text-agarwood/60 leading-relaxed">{plan.description}</p>
                </div>

                <div className="mb-8">
                  {originalPrice > 0 ? (
                    <>
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gold/15 border border-gold/30 rounded-full mb-3">
                        <Rocket size={14} className="text-gold" />
                        <span className="text-xs font-bold text-gold">Launch Offer — 50% Off</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-agarwood/40 line-through">{originalPrice}</span>
                        <span className="text-4xl lg:text-5xl font-bold text-agarwood">{price}</span>
                        <span className="text-lg font-semibold text-agarwood/60">AED</span>
                        <span className="text-sm text-agarwood/40">{suffix}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      {price === 0 ? (
                        <span className="text-4xl lg:text-5xl font-bold text-agarwood">Free</span>
                      ) : (
                        <>
                          <span className="text-4xl lg:text-5xl font-bold text-agarwood">{price}</span>
                          <span className="text-lg font-semibold text-agarwood/60">AED</span>
                          <span className="text-sm text-agarwood/40">{suffix}</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="mb-8">
                  <Link href={plan.href}>
                    <EnhancedButton
                      variant={plan.highlighted ? "luxury" : "outline"}
                      size="lg"
                      fullWidth
                      showArrow
                    >
                      {plan.cta}
                    </EnhancedButton>
                  </Link>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent mb-8" />

                <ul className="space-y-3.5">
                  {plan.features.map((feature, i) => (
                    <li key={feature} className="flex items-start gap-3">
                      <CheckCircle2
                        size={16}
                        className={`mt-0.5 flex-shrink-0 ${
                          plan.highlighted ? "text-gold" : "text-agarwood/40"
                        }`}
                      />
                      <span className="text-sm text-agarwood/80 leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          );
        })}
      </div>
    </Section>
  );
}

/* ─── FAQ Section ─────────────────────────────────────────── */

const faqItems = [
  {
    q: "Is the Free plan really free forever?",
    a: "Yes — the Free plan has no time limit. You can use it as long as you want with the included features. Upgrade to Pro only when your business needs grow.",
  },
  {
    q: "What are AI tokens and how do they work?",
    a: "AI tokens power automated features like document scanning, smart transaction classification, and bank statement imports. Pro users get 150 tokens/month that auto-refresh. Each document scan uses ~1 token and bank statement imports use ~5 tokens.",
  },
  {
    q: "Can I add more users to my Pro plan?",
    a: "Pro includes 2 users. You can add extra seats at 9 AED/user/month from your Billing Settings. There's no limit on the number of additional seats.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit and debit cards (Visa, Mastercard, American Express) through our secure payment partner Stripe. All prices are in AED.",
  },
  {
    q: "Is my data secure?",
    a: "Absolutely. We use industry-standard encryption, immutable audit trails, and your data is hosted on secure cloud infrastructure. We never share your financial data with third parties.",
  },
  {
    q: "Can I export my data?",
    a: "Yes — you can export all reports, journal entries, and financial data in standard formats (CSV, PDF) at any time, even on the Free plan.",
  },
];

function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <Section id="faq" variant="default" padding="lg">
      <SectionHeader
        subtitle="FAQ"
        title="Frequently asked|questions"
        description="Everything you need to know about Agar Smart Accounting."
      />

      <div className="max-w-3xl mx-auto space-y-3">
        {faqItems.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            className="rounded-2xl border-2 border-gold/10 hover:border-gold/25 bg-white/70 dark:bg-agar-dark-surface/70 backdrop-blur-sm overflow-hidden transition-all duration-300 shadow-sm"
          >
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="flex w-full items-center justify-between px-6 py-5 text-left"
            >
              <span className="text-[15px] font-semibold text-agarwood pr-4">
                {item.q}
              </span>
              <ChevronDown
                size={18}
                className={`shrink-0 text-gold transition-transform duration-300 ${
                  openIndex === i ? "rotate-180" : ""
                }`}
              />
            </button>
            {openIndex === i && (
              <div className="px-6 pb-5">
                <p className="text-sm leading-relaxed text-agarwood/70">
                  {item.a}
                </p>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </Section>
  );
}
