'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, FileDown, Calendar, DollarSign, PieChart, Download, Upload, X, ArrowRight } from 'lucide-react';
import Section from '@/components/landing/ui/Section';
import SectionHeader from '@/components/landing/ui/SectionHeader';
import EnhancedCard from '@/components/landing/ui/EnhancedCard';
import EnhancedButton from '@/components/landing/ui/EnhancedButton';
import AnimatedIcon from '@/components/landing/ui/AnimatedIcon';

const EnhancedToolsResources = () => {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [vatAmount, setVatAmount] = useState('');
  const [vatResult, setVatResult] = useState<{ vat: number; total: number } | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const tools = [
    {
      id: 'vat-calculator',
      icon: Calculator,
      title: 'UAE VAT Calculator',
      subtitle: 'Instant VAT Calculations',
      description: 'Calculate VAT amounts, totals, and reverse VAT for UAE tax rates (5%) with precision and ease',
      gradient: 'from-gold/25 to-agarwood/15',
      popular: true,
      features: ['5% UAE VAT Rate', 'Reverse VAT Calculation', 'Bulk Calculations', 'Export Results']
    },
    {
      id: 'invoice-generator',
      icon: FileDown,
      title: 'Invoice Template Generator',
      subtitle: 'Professional Templates',
      description: 'Create professional, UAE-compliant invoice templates customized for your business branding',
      gradient: 'from-agarwood/25 to-gold/15',
      popular: false,
      features: ['UAE Compliance', 'Custom Branding', 'Multiple Formats', 'Instant Download']
    },
    {
      id: 'tax-calendar',
      icon: Calendar,
      title: 'Tax Deadlines Calendar',
      subtitle: 'Never Miss a Deadline',
      description: 'Comprehensive calendar of UAE tax filing and payment deadlines with smart reminders',
      gradient: 'from-gold/20 to-beige/25',
      popular: false,
      features: ['Smart Reminders', 'All UAE Taxes', 'Calendar Sync', 'Email Alerts']
    },
    {
      id: 'currency-converter',
      icon: DollarSign,
      title: 'Currency Converter',
      subtitle: 'Real-time Exchange Rates',
      description: 'Accurate, real-time currency conversion for international business transactions and reporting',
      gradient: 'from-agarwood/20 to-gold/25',
      popular: false,
      features: ['Live Rates', '100+ Currencies', 'Rate History', 'Export Data']
    },
    {
      id: 'expense-tracker',
      icon: PieChart,
      title: 'Business Expense Tracker',
      subtitle: 'Simplified Expense Management',
      description: 'Track and categorize business expenses with automated receipt processing and reporting',
      gradient: 'from-gold/15 to-agarwood/20',
      popular: false,
      features: ['Receipt Scanning', 'Auto-categorization', 'Monthly Reports', 'VAT Tracking']
    },
    {
      id: 'document-upload',
      icon: Upload,
      title: 'Secure Document Portal',
      subtitle: 'Safe File Sharing',
      description: 'Securely upload and share financial documents with your accounting team using enterprise-grade encryption',
      gradient: 'from-beige/25 to-gold/20',
      popular: false,
      features: ['256-bit Encryption', 'Version Control', 'Access Logs', 'Mobile Upload']
    }
  ];

  const resources = [
    {
      title: 'UAE VAT Guide 2024',
      description: 'Complete guide to VAT compliance in the UAE',
      type: 'PDF Guide',
      size: '2.8 MB'
    },
    {
      title: 'Business Setup Checklist',
      description: 'Essential checklist for UAE business registration',
      type: 'Checklist',
      size: '1.2 MB'
    },
    {
      title: 'Tax Calendar Template',
      description: 'Excel template for tracking tax deadlines',
      type: 'Excel',
      size: '0.5 MB'
    },
    {
      title: 'Financial Ratios Calculator',
      description: 'Analyze your business financial health',
      type: 'Calculator',
      size: '0.8 MB'
    }
  ];

  const calculateVAT = () => {
    setIsCalculating(true);
    setTimeout(() => {
      const amount = parseFloat(vatAmount);
      if (!isNaN(amount)) {
        const vat = amount * 0.05;
        const total = amount + vat;
        setVatResult({ vat, total });
      }
      setIsCalculating(false);
    }, 1000);
  };

  const generateInvoice = () => {
    setIsGenerating(true);
    setTimeout(() => {
      // Simulate invoice generation
      const blob = new Blob(['Invoice template content'], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'invoice-template.docx';
      a.click();
      setIsGenerating(false);
      setActiveModal(null);
    }, 2000);
  };


  const downloadResource = (resource: { title: string; description: string }) => {
    // Simulate download
    const blob = new Blob([`${resource.title} content`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${resource.title.toLowerCase().replace(/\s+/g, '-')}.pdf`;
    a.click();
  };

  const closeModal = () => {
    setActiveModal(null);
    setVatAmount('');
    setVatResult(null);
  };

  const handleBookConsultation = () => {
    const element = document.querySelector('#contact');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <Section
      id="tools"
      variant="default"
      background="white"
      padding="xl"
      parallax={{
        variant: 'tax-forms',
        intensity: 0.25
      }}
    >
      <SectionHeader
        subtitle="Tools & Resources"
        title="Powerful Tools for|Financial Success"
        description="Access our comprehensive suite of financial tools and resources designed to streamline your business operations and ensure UAE compliance."
        variant="luxury"
      />

      {/* Interactive Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-12 lg:mb-16">
        {tools.map((tool, index) => (
          <motion.div
            key={tool.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
          >
            <EnhancedCard
              variant="glass"
              padding="lg"
              hover
              clickable
              onClick={() => setActiveModal(tool.id)}
              className="relative border-2 border-white/20 hover:border-gold/30 h-full group"
            >
              {/* Popular badge */}
              {tool.popular && (
                <motion.div
                  className="absolute -top-3 -right-3 bg-gold text-agarwood px-3 py-1 rounded-full text-xs font-bold shadow-lg"
                  animate={{
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  Popular
                </motion.div>
              )}

              <div className="space-y-6">
                <motion.div
                  className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${tool.gradient} flex items-center justify-center shadow-lg relative overflow-hidden group-hover:shadow-xl transition-shadow duration-300`}
                  whileHover={{ scale: 1.05, rotate: 3 }}
                  transition={{ duration: 0.3 }}
                >
                  <AnimatedIcon
                    icon={tool.icon}
                    size={32}
                    variant="default"
                    animate="bounce"
                    className="text-agarwood group-hover:scale-110 transition-transform duration-300"
                  />
                </motion.div>

                <div>
                  <h3 className="text-xl lg:text-2xl font-serif font-bold text-agarwood mb-2 group-hover:text-gold transition-colors duration-300">
                    {tool.title}
                  </h3>
                  <p className="text-sm text-gold font-semibold mb-3">
                    {tool.subtitle}
                  </p>
                  <p className="text-agarwood/70 leading-relaxed text-sm mb-4">
                    {tool.description}
                  </p>
                </div>

                {/* Features */}
                <div className="space-y-2">
                  {tool.features.slice(0, 3).map((feature, idx) => (
                    <div key={idx} className="flex items-center space-x-2 text-xs text-agarwood/60">
                      <div className="w-1.5 h-1.5 bg-gold rounded-full" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <motion.div
                  className="flex items-center space-x-2 text-gold font-semibold text-sm group-hover:text-agarwood transition-colors duration-300"
                  whileHover={{ x: 5 }}
                >
                  <span>Try Tool</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-300" />
                </motion.div>
              </div>
            </EnhancedCard>
          </motion.div>
        ))}
      </div>

      {/* Resources Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="mb-12 lg:mb-16"
      >
        <div className="text-center mb-12">
          <h3 className="text-2xl lg:text-3xl font-serif font-bold text-agarwood mb-4">
            Free Business Resources
          </h3>
          <p className="text-lg text-agarwood/80 max-w-3xl mx-auto">
            Download our comprehensive collection of templates, guides, and tools 
            to support your business growth in the UAE.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {resources.map((resource, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <EnhancedCard
                variant="minimal"
                padding="lg"
                hover
                className="border-2 border-beige/40 dark:border-gold/10 hover:border-gold/30 text-center group h-full"
              >
                <div className="space-y-4">
                  <AnimatedIcon
                    icon={Download}
                    size={32}
                    variant="luxury"
                    animate="pulse"
                    background
                    className="mx-auto"
                  />
                  
                  <div>
                    <h4 className="text-lg font-semibold text-agarwood group-hover:text-gold transition-colors duration-300 mb-2">
                      {resource.title}
                    </h4>
                    <p className="text-sm text-agarwood/70 mb-3">
                      {resource.description}
                    </p>
                    <div className="flex items-center justify-center space-x-4 text-xs text-agarwood/60">
                      <span className="bg-gold/10 px-2 py-1 rounded-full">{resource.type}</span>
                      <span>{resource.size}</span>
                    </div>
                  </div>

                  <EnhancedButton
                    variant="outline"
                    size="sm"
                    onClick={() => downloadResource(resource)}
                    icon={<Download size={16} />}
                    iconPosition="left"
                    className="w-full"
                  >
                    Download
                  </EnhancedButton>
                </div>
              </EnhancedCard>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* CTA Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="text-center"
      >
        <EnhancedCard
          variant="gradient"
          padding="xl"
          className="border-2 border-gold/30 max-w-4xl mx-auto"
        >
          <div className="space-y-8">
            <div>
              <h3 className="text-2xl lg:text-3xl font-serif font-bold text-agarwood mb-4">
                Need Custom Solutions?
              </h3>
              <p className="text-lg text-agarwood/80 leading-relaxed">
                Our tools are just the beginning. Get personalized accounting solutions 
                tailored to your business needs with our expert consultation.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <EnhancedButton
                variant="luxury"
                size="xl"
                onClick={handleBookConsultation}
                showArrow
                glow
              >
                Book Expert Consultation
              </EnhancedButton>
              <div className="flex items-center space-x-2 text-agarwood/60">
                <Calculator size={16} />
                <span className="text-sm">Free assessment included</span>
              </div>
            </div>
          </div>
        </EnhancedCard>
      </motion.div>

      {/* Enhanced Modals */}
      <AnimatePresence>
        {activeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-agarwood/80 backdrop-blur-xl z-50 flex items-center justify-center p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-serif font-bold text-agarwood">
                    {tools.find(t => t.id === activeModal)?.title}
                  </h3>
                  <button
                    onClick={closeModal}
                    className="w-10 h-10 bg-beige/50 rounded-full flex items-center justify-center hover:bg-gold/20 transition-colors duration-200"
                  >
                    <X size={20} className="text-agarwood" />
                  </button>
                </div>

                {/* VAT Calculator */}
                {activeModal === 'vat-calculator' && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-agarwood mb-2">
                        Amount (AED)
                      </label>
                      <input
                        type="number"
                        value={vatAmount}
                        onChange={(e) => setVatAmount(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-beige/40 dark:border-gold/20 rounded-xl focus:border-gold/50 focus:outline-none transition-colors duration-200 text-agarwood bg-white/50 dark:bg-agar-dark-surface/50"
                        placeholder="Enter amount..."
                      />
                    </div>
                    
                    <EnhancedButton
                      variant="luxury"
                      onClick={calculateVAT}
                      loading={isCalculating}
                      fullWidth
                    >
                      Calculate VAT
                    </EnhancedButton>

                    {vatResult && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-6 bg-gradient-to-r from-gold/10 to-beige/20 rounded-xl border border-gold/20"
                      >
                        <div className="space-y-3 text-lg">
                          <div className="flex justify-between">
                            <span className="text-agarwood/70">Amount:</span>
                            <span className="font-semibold text-agarwood">AED {parseFloat(vatAmount).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-agarwood/70">VAT (5%):</span>
                            <span className="font-semibold text-agarwood">AED {vatResult.vat.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between border-t border-gold/20 pt-3">
                            <span className="text-agarwood font-bold">Total:</span>
                            <span className="font-bold text-gold text-xl">AED {vatResult.total.toFixed(2)}</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* Invoice Generator */}
                {activeModal === 'invoice-generator' && (
                  <div className="space-y-6">
                    <p className="text-agarwood/70">
                      Generate professional invoice templates customized for UAE businesses with VAT compliance.
                    </p>
                    <EnhancedButton
                      variant="luxury"
                      onClick={generateInvoice}
                      loading={isGenerating}
                      fullWidth
                      icon={<Download size={20} />}
                    >
                      Generate Template
                    </EnhancedButton>
                  </div>
                )}

                {/* Other modals would follow similar patterns */}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Section>
  );
};

export default EnhancedToolsResources;
