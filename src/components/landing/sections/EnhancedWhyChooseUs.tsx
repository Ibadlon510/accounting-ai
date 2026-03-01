'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MapPin, DollarSign, Zap, CheckCircle2, Star } from 'lucide-react';
import Section from '@/components/landing/ui/Section';
import SectionHeader from '@/components/landing/ui/SectionHeader';
import EnhancedCard from '@/components/landing/ui/EnhancedCard';
import EnhancedButton from '@/components/landing/ui/EnhancedButton';
import AnimatedIcon from '@/components/landing/ui/AnimatedIcon';

const EnhancedWhyChooseUs = () => {
  const [activeFeature, setActiveFeature] = useState(0);
  
  const reasons = [
    {
      icon: Heart,
      title: "Personalized Service",
      subtitle: "Dedicated Account Management",
      description: "Every client receives dedicated attention with customized solutions tailored to their unique business needs and goals. Experience the difference of boutique-level service.",
      details: [
        "Dedicated account manager assigned to your business",
        "24/7 priority support availability for urgent matters", 
        "Regular strategic consultations and business reviews",
        "Flexible service packages that adapt to your needs",
        "Direct access to senior partners and specialists",
        "Proactive advice and business optimization suggestions"
      ],
      gradient: "from-gold/25 to-agarwood/15",
      accent: "gold",
      popular: true
    },
    {
      icon: MapPin,
      title: "UAE Expertise",
      subtitle: "Local Market Specialists", 
      description: "Deep understanding of UAE business landscape, VAT regulations, and local compliance requirements across all emirates with proven track record.",
      details: [
        "5+ years specialized UAE market experience",
        "Continuously updated on latest regulatory changes",
        "Comprehensive multi-emirate coverage and support",
        "Extensive local partnership and professional network",
        "Proven compliance record with zero penalties",
        "Bilingual support in Arabic and English"
      ],
      gradient: "from-agarwood/25 to-gold/15",
      accent: "agarwood",
      popular: false
    },
    {
      icon: DollarSign,
      title: "Transparent Pricing",
      subtitle: "No Hidden Surprises",
      description: "Clear, upfront pricing with no hidden fees or surprises. Flexible packages designed to grow with your business while providing exceptional value.",
      details: [
        "Fixed monthly pricing with no surprise charges",
        "Zero setup fees or hidden administrative costs",
        "Scalable service tiers for growing businesses",
        "30-day money-back satisfaction guarantee",
        "Free initial consultation and service assessment",
        "Competitive rates with premium service quality"
      ],
      gradient: "from-gold/20 to-beige/25",
      accent: "luxury",
      popular: false
    },
    {
      icon: Zap,
      title: "Scalable Solutions",
      subtitle: "Growth-Ready Services",
      description: "Solutions that evolve with your business, from startup to enterprise level, ensuring consistent quality and seamless scaling of services.",
      details: [
        "Seamless service scaling as your business grows",
        "Advanced cloud-based systems and processes",
        "Integration capabilities with popular business tools",
        "Automated workflows for improved efficiency",
        "Regular service reviews and optimization",
        "Enterprise-level security and data protection"
      ],
      gradient: "from-agarwood/20 to-gold/25",
      accent: "mixed",
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
      id="why-choose-us"
      variant="gradient"
      padding="lg"
    >
      <SectionHeader
        subtitle="Why Choose Us"
        title="Excellence That Sets|Us Apart"
        description="Discover what makes AgarWood Accounting the preferred choice for businesses seeking premium financial services in the UAE."
        variant="luxury"
      />

      {/* Interactive Feature Selection */}
      <div className="grid lg:grid-cols-4 gap-6 lg:gap-8 mb-12 lg:mb-16">
        {reasons.map((reason, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
          >
            <EnhancedCard
              variant={activeFeature === index ? "luxury" : "glass"}
              padding="lg"
              hover
              clickable
              onClick={() => setActiveFeature(index)}
              className={`relative transition-all duration-500 cursor-pointer ${
                activeFeature === index 
                  ? 'border-2 border-gold/50 shadow-2xl transform scale-105 bg-gradient-to-br from-gold/10 to-beige/20' 
                  : 'border-2 border-white/20 hover:border-gold/30'
              }`}
            >
              {/* Popular badge */}
              {reason.popular && (
                <motion.div
                  className="absolute -top-3 -right-3 bg-gold text-agarwood px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center space-x-1"
                  animate={{
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Star size={12} fill="currentColor" />
                  <span>Popular</span>
                </motion.div>
              )}

              <div className="text-center space-y-6">
                <motion.div
                  className={`w-20 h-20 lg:w-24 lg:h-24 mx-auto rounded-full bg-gradient-to-br ${reason.gradient} flex items-center justify-center shadow-lg relative overflow-hidden`}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ duration: 0.3 }}
                >
                  <AnimatedIcon
                    icon={reason.icon}
                    size={activeFeature === index ? 36 : 32}
                    variant={activeFeature === index ? "luxury" : "default"}
                    animate={activeFeature === index ? "pulse" : "bounce"}
                  />
                  
                  {activeFeature === index && (
                    <motion.div
                      className="absolute inset-0 bg-gold/20 rounded-full"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1, opacity: [0, 0.5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}
                </motion.div>

                <div>
                  <h3 className={`text-xl lg:text-2xl font-serif font-bold mb-2 transition-colors duration-300 ${
                    activeFeature === index ? 'text-gold' : 'text-agarwood'
                  }`}>
                    {reason.title}
                  </h3>
                  <p className="text-sm text-agarwood/70 font-medium">
                    {reason.subtitle}
                  </p>
                </div>

                {/* Selection indicator */}
                <motion.div
                  className={`w-3 h-3 rounded-full mx-auto transition-all duration-300 ${
                    activeFeature === index ? 'bg-gold shadow-lg' : 'bg-agarwood/20'
                  }`}
                  animate={activeFeature === index ? {
                    scale: [1, 1.2, 1],
                    opacity: [0.7, 1, 0.7]
                  } : {}}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              </div>
            </EnhancedCard>
          </motion.div>
        ))}
      </div>

      {/* Detailed Feature View */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeFeature}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{ duration: 0.5 }}
          className="max-w-6xl mx-auto mb-12 lg:mb-16"
        >
          <EnhancedCard
            variant="luxury"
            padding="xl"
            className="border-2 border-gold/30 shadow-2xl relative overflow-hidden"
          >
            {/* Background gradient specific to feature */}
            <div className={`absolute inset-0 bg-gradient-to-br ${reasons[activeFeature].gradient} opacity-20`} />
            
            <div className="relative z-10 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              
              {/* Left: Feature Details */}
              <div className="space-y-8">
                <div className="flex items-center space-x-4 mb-6">
                  <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${reasons[activeFeature].gradient} flex items-center justify-center shadow-xl`}>
                    {React.createElement(reasons[activeFeature].icon, { size: 36, className: "text-agarwood" })}
                  </div>
                  <div>
                    <h3 className="text-2xl lg:text-3xl font-serif font-bold text-agarwood">
                      {reasons[activeFeature].title}
                    </h3>
                    <p className="text-gold font-semibold text-lg">
                      {reasons[activeFeature].subtitle}
                    </p>
                  </div>
                </div>

                <p className="text-agarwood/80 text-lg leading-relaxed">
                  {reasons[activeFeature].description}
                </p>

                <EnhancedButton
                  variant="luxury"
                  size="lg"
                  onClick={handleBookConsultation}
                  showArrow
                  glow
                  className="w-full sm:w-auto"
                >
                  Experience the Difference
                </EnhancedButton>
              </div>

              {/* Right: Benefits List */}
              <div className="space-y-6">
                <h4 className="text-2xl font-serif font-bold text-agarwood mb-6">
                  What You Get:
                </h4>
                
                <div className="grid gap-4">
                  {reasons[activeFeature].details.map((detail, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      className="flex items-start space-x-4 p-4 bg-white/50 dark:bg-agar-dark-surface/50 rounded-xl border border-gold/20 hover:border-gold/40 transition-colors duration-300 group"
                    >
                      <div className="w-8 h-8 bg-gold rounded-full flex items-center justify-center flex-shrink-0 shadow-md group-hover:shadow-lg transition-shadow duration-300 mt-0.5">
                        <CheckCircle2 size={16} className="text-agarwood" />
                      </div>
                      <span className="text-agarwood/80 group-hover:text-agarwood font-medium transition-colors duration-300 leading-relaxed">
                        {detail}
                      </span>
                    </motion.div>
                  ))}
                </div>
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

export default EnhancedWhyChooseUs;
