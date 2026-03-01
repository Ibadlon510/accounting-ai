'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle } from 'lucide-react';
import Section from '@/components/landing/ui/Section';
import SectionHeader from '@/components/landing/ui/SectionHeader';

const faqs = [
  {
    question: 'Is there really a free plan?',
    answer:
      'Yes! The Free plan includes 1 user, 25 journal entries per month, 5 AI document scans, and 1 AI bank statement import — all at no cost. You can upgrade to Pro anytime when you need more.',
  },
  {
    question: 'How do AI tokens work?',
    answer:
      'AI tokens power features like document scanning, smart classification, and bank statement imports. Pro plans include 150 tokens per month that auto-refresh each billing cycle. Unused tokens do not roll over, but you can purchase top-up packs (250 tokens for 35 AED) at any time.',
  },
  {
    question: 'Is Agar compliant with UAE VAT regulations?',
    answer:
      'Absolutely. Agar is built specifically for UAE businesses and supports FTA-compliant VAT returns, tax registration number (TRN) management, and automated VAT calculations across all transactions.',
  },
  {
    question: 'How secure is my financial data?',
    answer:
      'We use 256-bit encryption for all data at rest and in transit. Your data is stored on secure, SOC 2-compliant infrastructure. We never share your financial information with third parties.',
  },
  {
    question: 'Can I add more team members?',
    answer:
      'The Free plan supports 1 user. Pro includes 2 users, and you can add more seats at 9 AED per user per month. Team members can be assigned roles (Admin, Accountant, Viewer) with appropriate permissions.',
  },
  {
    question: 'What happens if I cancel my Pro subscription?',
    answer:
      'If you cancel, you\'ll retain Pro access until the end of your current billing period. After that, your account moves to the Free plan. All your data is preserved — you can continue with manual bookkeeping or re-subscribe at any time.',
  },
  {
    question: 'Can I import data from other accounting software?',
    answer:
      'Yes. Agar supports importing bank statements via AI-powered parsing, and you can manually import journal entries and chart of accounts data. We\'re continuously adding more import options.',
  },
  {
    question: 'Do you support multiple currencies?',
    answer:
      'Each organization is set up with a base currency (default AED). Multi-currency transactions with automatic exchange rate lookup are on our roadmap and coming soon.',
  },
];

const EnhancedFAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <Section
      id="faq"
      variant="default"
      background="white"
      padding="xl"
    >
      <SectionHeader
        subtitle="FAQ"
        title="Common Questions"
        description="Everything you need to know about Agar Smart Accounting."
      />

      <div className="max-w-3xl mx-auto">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="border-b border-beige/40 dark:border-gold/10"
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="flex w-full items-center justify-between py-5 text-left group"
              >
                <span className="text-base font-semibold text-agarwood pr-4 group-hover:text-gold transition-colors duration-300">
                  {faq.question}
                </span>
                <motion.div
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex-shrink-0"
                >
                  <ChevronDown
                    size={18}
                    className={`transition-colors duration-300 ${
                      isOpen ? 'text-gold' : 'text-agarwood/40 group-hover:text-gold'
                    }`}
                  />
                </motion.div>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    key="content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <p className="pb-5 text-sm text-agarwood/70 leading-relaxed">
                      {faq.answer}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Contact CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="text-center mt-12"
      >
        <p className="text-agarwood/60 text-sm">
          Still have questions?{' '}
          <a
            href="mailto:admin@agaraccounting.com"
            className="inline-flex items-center gap-1 text-gold font-semibold hover:text-gold/80 transition-colors"
          >
            <HelpCircle size={14} />
            Get in touch
          </a>
        </p>
      </motion.div>
    </Section>
  );
};

export default EnhancedFAQ;
