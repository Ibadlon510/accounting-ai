'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Crown, Sparkles, Zap, Users, FileText, Brain, ArrowRight, Mail, Rocket } from 'lucide-react';
import Section from '@/components/landing/ui/Section';
import SectionHeader from '@/components/landing/ui/SectionHeader';
import EnhancedButton from '@/components/landing/ui/EnhancedButton';

type BillingInterval = 'monthly' | 'annual';

const EnhancedPricing = () => {
  const [interval, setInterval] = useState<BillingInterval>('monthly');

  const plans = [
    {
      key: 'FREE',
      name: 'Free',
      description: 'Perfect for solo entrepreneurs getting started with smart bookkeeping.',
      monthlyPrice: 0,
      annualPrice: 0,
      badge: null,
      highlight: false,
      cta: 'Get Started Free',
      ctaVariant: 'outline' as const,
      features: [
        { text: '1 user', icon: Users },
        { text: '25 journal entries/month', icon: FileText },
        { text: '5 AI document scans (lifetime)', icon: Brain },
        { text: '1 AI bank statement import', icon: Zap },
        { text: 'Manual bookkeeping after trial', icon: FileText },
        { text: 'Basic financial reports', icon: FileText },
      ],
    },
    {
      key: 'PRO',
      name: 'Pro',
      description: 'Full-featured AI accounting for growing businesses.',
      monthlyPrice: 19,
      annualPrice: 190,
      originalMonthlyPrice: 38,
      originalAnnualPrice: 380,
      badge: '50% Off — Launch Price',
      highlight: true,
      cta: 'Start Pro',
      ctaVariant: 'luxury' as const,
      features: [
        { text: '2 users included (+9 AED/user)', icon: Users },
        { text: 'Unlimited journal entries', icon: FileText },
        { text: '150 AI tokens/month (auto-refresh)', icon: Sparkles },
        { text: 'Unlimited AI document processing', icon: Brain },
        { text: 'Unlimited bank statement imports', icon: Zap },
        { text: 'AI token top-ups available', icon: Zap },
        { text: 'Priority support', icon: CheckCircle2 },
        { text: 'Advanced reports & analytics', icon: FileText },
      ],
    },
  ];

  const annualSavings = Math.round((1 - 380 / (38 * 12)) * 100);

  return (
    <Section
      id="pricing"
      variant="gradient"
      padding="xl"
      parallax={{ variant: 'ledger', intensity: 0.3 }}
    >
      <SectionHeader
        subtitle="Launch Pricing"
        title="Plans that grow|with your business"
        description="Start free, upgrade when you need more. All paid plans are 50% off during our launch period. No hidden fees, no surprises — just straightforward pricing in AED."
        variant="luxury"
      />

      {/* Billing Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="flex items-center justify-center mb-12 lg:mb-16"
      >
        <div className="inline-flex items-center bg-white/80 dark:bg-agar-dark-surface/80 backdrop-blur-sm border border-gold/20 rounded-full p-1.5 shadow-lg">
          <button
            onClick={() => setInterval('monthly')}
            className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
              interval === 'monthly'
                ? 'bg-agarwood text-white shadow-md'
                : 'text-agarwood/70 hover:text-agarwood'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setInterval('annual')}
            className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 relative ${
              interval === 'annual'
                ? 'bg-agarwood text-white shadow-md'
                : 'text-agarwood/70 hover:text-agarwood'
            }`}
          >
            Annual
            <span className="absolute -top-2.5 -right-2.5 bg-gold text-agarwood text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
              -{annualSavings}%
            </span>
          </button>
        </div>
      </motion.div>

      {/* Plan Cards */}
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {plans.map((plan, index) => {
          const price = interval === 'monthly' ? plan.monthlyPrice : plan.annualPrice;
          const suffix = interval === 'monthly' ? '/mo' : '/yr';

          return (
            <motion.div
              key={plan.key}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 + index * 0.15 }}
              className="relative"
            >
              {/* Badge */}
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    className="inline-flex items-center gap-1.5 bg-gradient-to-r from-gold to-gold/90 text-agarwood px-4 py-1.5 rounded-full text-xs font-bold shadow-lg border border-gold/40"
                  >
                    {plan.badge?.includes('50%') ? <Rocket size={12} /> : <Crown size={12} />}
                    {plan.badge}
                  </motion.div>
                </div>
              )}

              <div
                className={`relative h-full rounded-3xl p-8 lg:p-10 transition-all duration-500 ${
                  plan.highlight
                    ? 'bg-white/95 dark:bg-agar-dark-surface/95 border-2 border-gold/40 shadow-2xl shadow-gold/10 hover:shadow-gold/20'
                    : 'bg-white/80 dark:bg-agar-dark-surface/80 border-2 border-beige/40 dark:border-gold/10 shadow-lg hover:shadow-xl hover:border-gold/30'
                }`}
              >
                {/* Plan Header */}
                <div className="mb-8">
                  <h3 className="text-2xl font-serif font-bold text-agarwood mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-agarwood/60 leading-relaxed">
                    {plan.description}
                  </p>
                </div>

                {/* Price */}
                <div className="mb-8">
                  {'originalMonthlyPrice' in plan && plan.originalMonthlyPrice ? (
                    <>
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gold/15 border border-gold/30 rounded-full mb-3">
                        <Rocket size={14} className="text-gold" />
                        <span className="text-xs font-bold text-gold">Launch Offer — 50% Off</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-agarwood/40 line-through">
                          {interval === 'monthly' ? plan.originalMonthlyPrice : plan.originalAnnualPrice}
                        </span>
                        <span className="text-4xl lg:text-5xl font-bold text-agarwood">{price}</span>
                        <span className="text-lg font-semibold text-agarwood/60">AED</span>
                        <span className="text-sm text-agarwood/40">{suffix}</span>
                      </div>
                      {interval === 'annual' && (
                        <p className="mt-1 text-xs text-gold font-semibold">
                          Save {(plan.originalMonthlyPrice ?? 0) * 12 - (plan.originalAnnualPrice ?? 0)} AED vs monthly billing
                        </p>
                      )}
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

                {/* CTA */}
                <div className="mb-8">
                  <EnhancedButton
                    variant={plan.ctaVariant}
                    size="lg"
                    fullWidth
                    showArrow
                    onClick={() => {
                      window.location.href = plan.key === 'FREE' ? '/signup' : '/signup?plan=pro';
                    }}
                  >
                    {plan.cta}
                  </EnhancedButton>
                </div>

                {/* Divider */}
                <div className="h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent mb-8" />

                {/* Features */}
                <ul className="space-y-3.5">
                  {plan.features.map((feature, i) => {
                    const FeatureIcon = feature.icon;
                    return (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: 0.6 + i * 0.05 }}
                        className="flex items-start gap-3"
                      >
                        <CheckCircle2
                          size={16}
                          className={`mt-0.5 flex-shrink-0 ${
                            plan.highlight ? 'text-gold' : 'text-agarwood/40'
                          }`}
                        />
                        <span className="text-sm text-agarwood/80 leading-relaxed">
                          {feature.text}
                        </span>
                      </motion.li>
                    );
                  })}
                </ul>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Enterprise CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="text-center mt-12 lg:mt-16"
      >
        <p className="text-agarwood/60 text-sm">
          Need more users or custom features?{' '}
          <a
            href="mailto:admin@agaraccounting.com"
            className="inline-flex items-center gap-1 text-gold font-semibold hover:text-gold/80 transition-colors"
          >
            <Mail size={14} />
            Contact us for Enterprise pricing
            <ArrowRight size={14} />
          </a>
        </p>
      </motion.div>
    </Section>
  );
};

export default EnhancedPricing;
