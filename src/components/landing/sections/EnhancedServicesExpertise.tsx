'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, FileText, Search, TrendingUp, ArrowRight, Check, Star } from 'lucide-react';
import Section from '@/components/landing/ui/Section';
import SectionHeader from '@/components/landing/ui/SectionHeader';
import EnhancedButton from '@/components/landing/ui/EnhancedButton';
import EnhancedCard from '@/components/landing/ui/EnhancedCard';
import ServiceCard from '@/components/landing/ui/ServiceCard';

const EnhancedServicesExpertise = () => {
  const [activeService, setActiveService] = useState(0);

  const services = [
    {
      icon: Calculator,
      title: "Accounting Services",
      subtitle: "Complete Financial Solutions",
      description: "Comprehensive bookkeeping, financial reporting, and accounting solutions tailored for UAE businesses of all sizes, ensuring accuracy and compliance.",
      features: [
        "Monthly Financial Statements",
        "Cash Flow Management", 
        "Accounts Payable/Receivable",
        "General Ledger Maintenance",
        "Financial Analysis & Reporting",
        "Budget Planning & Forecasting"
      ],
      color: "from-gold/20 to-gold/10",
      accent: "gold",
      price: "Starting from AED 1,500/month",
      popular: true
    },
    {
      icon: FileText,
      title: "UAE VAT Consultancy", 
      subtitle: "Expert Tax Guidance",
      description: "Specialized guidance on VAT compliance, registration, filing, and optimization strategies specifically designed for UAE tax regulations and business requirements.",
      features: [
        "VAT Registration & De-registration",
        "Monthly/Quarterly VAT Returns",
        "VAT Compliance Audits",
        "Tax Planning & Advisory",
        "Penalty & Fine Resolution",
        "VAT Refund Processing"
      ],
      color: "from-agarwood/20 to-agarwood/10",
      accent: "agarwood",
      price: "Starting from AED 800/month",
      popular: false
    },
    {
      icon: Search,
      title: "Audit Support",
      subtitle: "Comprehensive Compliance",
      description: "Full-spectrum audit preparation and support services to ensure your business meets all regulatory requirements and maintains the highest standards of compliance.",
      features: [
        "Pre-audit Preparation",
        "Documentation Review",
        "Regulatory Compliance Check",
        "Risk Assessment & Mitigation",
        "Internal Controls Review",
        "Audit Trail Management"
      ],
      color: "from-gold/15 to-agarwood/15",
      accent: "mixed",
      price: "Starting from AED 2,500/project",
      popular: false
    },
    {
      icon: TrendingUp,
      title: "Business Advisory",
      subtitle: "Strategic Growth Solutions",
      description: "Strategic financial consulting and business advisory services designed to accelerate growth, optimize operations, and maximize your business potential in the UAE market.",
      features: [
        "Financial Strategy Planning",
        "Performance Analysis",
        "Investment Advisory",
        "Business Restructuring",
        "Market Analysis & Insights",
        "Growth Strategy Development"
      ],
      color: "from-gold/25 to-beige/20",
      accent: "luxury",
      price: "Custom pricing available",
      popular: false
    }
  ];

  const handleBookConsultation = () => {
    const element = document.querySelector('#contact');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <Section
      id="services"
      variant="default"
      background="gradient"
      padding="xl"
      parallax={{
        variant: 'income-statement',
        intensity: 0.35
      }}
    >
      <SectionHeader
        subtitle="Our Expertise"
        title="Premium Services|Tailored for UAE"
        description="From boutique accounting to strategic advisory, we deliver comprehensive financial solutions that drive business success across the United Arab Emirates."
        variant="luxury"
      />

      {/* Services Overview Grid - Standardized Sizing */}
      <div className="service-card-grid mb-12 lg:mb-16">
        {services.map((service, index) => (
          <ServiceCard
            key={index}
            icon={service.icon}
            title={service.title}
            subtitle={service.subtitle}
            price={service.price}
            color={service.color}
            accent={service.accent}
            popular={service.popular}
            isActive={activeService === index}
            onClick={() => setActiveService(index)}
            index={index}
          />
        ))}
      </div>

      {/* Detailed Service View */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeService}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{ duration: 0.5 }}
          className="max-w-6xl mx-auto"
        >
          <EnhancedCard
            variant="luxury"
            padding="xl"
            className="border-2 border-gold/30 shadow-2xl relative overflow-hidden"
          >
            {/* Background gradient specific to service */}
            <div className={`absolute inset-0 bg-gradient-to-br ${services[activeService].color} opacity-30`} />
            
            <div className="relative z-10 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              
              {/* Left: Service Details */}
              <div className="space-y-8">
                <div className="flex items-center space-x-4 mb-6">
                  <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${services[activeService].color} flex items-center justify-center shadow-xl`}>
                    {React.createElement(services[activeService].icon, { size: 36, className: "text-agarwood" })}
                  </div>
                  <div>
                    <h3 className="text-2xl lg:text-3xl font-serif font-bold text-agarwood">
                      {services[activeService].title}
                    </h3>
                    <p className="text-gold font-semibold text-lg">
                      {services[activeService].subtitle}
                    </p>
                  </div>
                </div>

                <p className="text-agarwood/80 text-lg leading-relaxed">
                  {services[activeService].description}
                </p>

                <div className="flex items-center space-x-4">
                  <div className="text-2xl font-bold text-gold">
                    {services[activeService].price}
                  </div>
                  {services[activeService].popular && (
                    <div className="flex items-center space-x-2 bg-gold/10 px-3 py-1 rounded-full">
                      <Star size={16} className="text-gold" fill="currentColor" />
                      <span className="text-gold font-semibold text-sm">Most Popular</span>
                    </div>
                  )}
                </div>

                <EnhancedButton
                  variant="luxury"
                  size="lg"
                  onClick={handleBookConsultation}
                  showArrow
                  glow
                  className="w-full sm:w-auto"
                >
                  Book Consultation
                </EnhancedButton>
              </div>

              {/* Right: Features List */}
              <div className="space-y-6">
                <h4 className="text-2xl font-serif font-bold text-agarwood mb-6">
                  What&apos;s Included:
                </h4>
                
                <div className="grid gap-4">
                  {services[activeService].features.map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      className="flex items-center space-x-4 p-4 bg-white/50 dark:bg-agar-dark-surface/50 rounded-xl border border-gold/20 hover:border-gold/40 transition-colors duration-300 group"
                    >
                      <div className="w-8 h-8 bg-gold rounded-full flex items-center justify-center flex-shrink-0 shadow-md group-hover:shadow-lg transition-shadow duration-300">
                        <Check size={16} className="text-agarwood" />
                      </div>
                      <span className="text-agarwood/80 group-hover:text-agarwood font-medium transition-colors duration-300">
                        {feature}
                      </span>
                    </motion.div>
                  ))}
                </div>

                {/* Additional CTA */}
                <motion.div
                  className="mt-8 p-6 bg-gradient-to-r from-gold/10 to-gold/5 rounded-2xl border border-gold/20"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-agarwood mb-2">Need a Custom Solution?</h5>
                      <p className="text-agarwood/70 text-sm">
                        We tailor our services to meet your specific business needs.
                      </p>
                    </div>
                    <motion.button
                      onClick={handleBookConsultation}
                      className="flex items-center space-x-2 text-gold hover:text-agarwood transition-colors duration-300 group"
                      whileHover={{ x: 5 }}
                    >
                      <span className="font-semibold">Discuss</span>
                      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
                    </motion.button>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute top-4 right-4 w-16 h-16 border-2 border-gold/20 rounded-full opacity-20" />
            <div className="absolute bottom-4 left-4 w-8 h-8 border-2 border-gold/20 rounded-lg transform rotate-45 opacity-20" />
          </EnhancedCard>
        </motion.div>
      </AnimatePresence>

    </Section>
  );
};

export default EnhancedServicesExpertise;
