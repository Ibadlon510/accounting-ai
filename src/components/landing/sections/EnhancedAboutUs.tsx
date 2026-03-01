'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Award, Users, Shield, TrendingUp } from 'lucide-react';
import Section from '@/components/landing/ui/Section';
import SectionHeader from '@/components/landing/ui/SectionHeader';
import EnhancedCard from '@/components/landing/ui/EnhancedCard';
import AnimatedIcon from '@/components/landing/ui/AnimatedIcon';

const EnhancedAboutUs = () => {
  const values = [
    {
      icon: Award,
      title: "Precision",
      description: "Every detail matters in our meticulous approach to accounting and tax services, ensuring accuracy in every transaction.",
      delay: 0
    },
    {
      icon: Shield,
      title: "Integrity", 
      description: "Trust forms the foundation of every client relationship we build, maintaining the highest ethical standards.",
      delay: 0.1
    },
    {
      icon: Users,
      title: "Partnership",
      description: "We work alongside you as trusted advisors, not just service providers, understanding your unique business needs.",
      delay: 0.2
    },
    {
      icon: TrendingUp,
      title: "Growth",
      description: "Our strategies are designed to support your business growth and success, creating sustainable financial solutions.",
      delay: 0.3
    }
  ];

  const storyPoints = [
    {
      title: "Boutique Excellence",
      description: "In a world of mass-market solutions, we stand apart as a boutique consultancy that believes in the power of personalized service. Every client receives our undivided attention, every challenge is met with tailored solutions, and every relationship is built on trust and transparency.",
      highlight: "personalized service"
    },
    {
      title: "UAE Expertise", 
      description: "Rooted deeply in the UAE market, we understand the intricacies of local regulations, VAT requirements, and business practices. Our team combines international accounting standards with local expertise to deliver solutions that are both compliant and strategic.",
      highlight: "UAE market expertise"
    },
    {
      title: "Commitment to Clarity",
      description: "We believe that financial clarity is the foundation of business success. Our approach transforms complex financial data into clear, actionable insights that empower you to make informed decisions with confidence.",
      highlight: "financial clarity"
    }
  ];

  return (
    <Section
      id="about"
      variant="gradient"
      padding="xl"
      parallax={{
        variant: 'ledger',
        intensity: 0.4
      }}
    >
      <SectionHeader
        subtitle="Our Story"
        title="Crafting Excellence in|Accounting & Tax"
        description="Like the rare and precious agarwood that develops its distinctive fragrance over time, we've cultivated our expertise through years of dedicated service, precision, and unwavering commitment to our clients."
        variant="luxury"
      />

      {/* Main Content - Enhanced Split Screen */}
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center justify-items-center mb-16 lg:mb-20 max-w-7xl mx-auto">
        
        {/* Left Column - Story Content */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="space-y-10 lg:space-y-12 px-4 lg:px-0"
        >
          {storyPoints.map((point, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="space-y-4 lg:space-y-5 group"
            >
              <motion.h3 
                className="text-xl lg:text-2xl xl:text-3xl font-serif font-semibold text-agarwood relative"
                whileHover={{ x: 10 }}
                transition={{ duration: 0.2 }}
              >
                {point.title}
                <motion.div
                  className="absolute -bottom-1 left-0 h-0.5 bg-gold origin-left opacity-0 group-hover:opacity-100"
                  initial={{ scaleX: 0 }}
                  whileHover={{ scaleX: 1 }}
                  transition={{ duration: 0.3 }}
                />
              </motion.h3>
              
              <p className="text-agarwood/85 leading-relaxed text-sm lg:text-base group-hover:text-agarwood/95 transition-colors duration-300">
                {point.description.split(point.highlight).map((part, i, array) => 
                  i < array.length - 1 ? (
                    <React.Fragment key={i}>
                      {part}
                      <span className="font-semibold text-gold bg-gold/10 px-1 rounded">
                        {point.highlight}
                      </span>
                    </React.Fragment>
                  ) : part
                )}
              </p>
              
              {/* Decorative element */}
              <motion.div
                className="w-12 h-px bg-gradient-to-r from-gold to-transparent opacity-0 group-hover:opacity-100"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.2 + 0.3 }}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Right Column - Enhanced Visual Element */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative w-full"
        >
          {/* Enhanced illustration container */}
          <EnhancedCard
            variant="luxury"
            rounded="3xl"
            className="relative w-full h-[28rem] lg:h-[32rem] xl:h-[36rem] overflow-hidden border-2 border-gold/30 p-0"
          >
            {/* Background pattern with enhanced opacity */}
            <div className="absolute inset-0 opacity-[0.08]">
              <svg viewBox="0 0 400 400" className="w-full h-full">
                <defs>
                  <pattern id="luxury-grain" patternUnits="userSpaceOnUse" width="60" height="60">
                    <path 
                      d="M0 30 Q30 0 60 30 Q30 60 0 30" 
                      stroke="#3B2C26" 
                      strokeWidth="1" 
                      fill="none" 
                      opacity="0.3"
                    />
                    <circle cx="30" cy="30" r="2" fill="#C6A664" opacity="0.2" />
                  </pattern>
                  <linearGradient id="textureGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#C6A664" stopOpacity="0.1"/>
                    <stop offset="50%" stopColor="#3B2C26" stopOpacity="0.05"/>
                    <stop offset="100%" stopColor="#C6A664" stopOpacity="0.1"/>
                  </linearGradient>
                </defs>
                <rect width="400" height="400" fill="url(#luxury-grain)" />
                <rect width="400" height="400" fill="url(#textureGrad)" />
              </svg>
            </div>

            {/* Enhanced Agarwood Branch SVG */}
            <div className="absolute inset-0 flex items-center justify-center p-8">
              <motion.svg
                viewBox="0 0 350 350"
                className="w-full h-full"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
              >
                {/* Enhanced main branch with gradient */}
                <defs>
                  <linearGradient id="branchGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3B2C26"/>
                    <stop offset="50%" stopColor="#2A1F1A"/>
                    <stop offset="100%" stopColor="#3B2C26"/>
                  </linearGradient>
                  <linearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#C6A664"/>
                    <stop offset="50%" stopColor="#D4B574"/>
                    <stop offset="100%" stopColor="#C6A664"/>
                  </linearGradient>
                  <filter id="glow">
                    <feMorphology operator="dilate" radius="1"/>
                    <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                
                <motion.path
                  d="M60 280 Q90 230 140 200 Q190 170 240 150 Q290 130 320 110"
                  stroke="url(#branchGrad)"
                  strokeWidth="6"
                  fill="none"
                  strokeLinecap="round"
                  filter="url(#glow)"
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  transition={{ duration: 2.5, ease: "easeInOut" }}
                />
                
                {/* Enhanced branch offshoots */}
                {[
                  { d: "M110 220 Q100 200 95 180 Q90 160 85 140", delay: 0.8 },
                  { d: "M160 190 Q150 170 145 150 Q140 130 135 110", delay: 1.2 },
                  { d: "M210 160 Q200 140 195 120 Q190 100 185 80", delay: 1.6 },
                  { d: "M140 210 Q150 230 160 250 Q170 270 180 290", delay: 1.0 },
                  { d: "M190 170 Q200 190 210 210 Q220 230 230 250", delay: 1.4 },
                  { d: "M260 140 Q270 160 280 180 Q290 200 300 220", delay: 1.8 },
                ].map((branch, index) => (
                  <motion.path
                    key={index}
                    d={branch.d}
                    stroke="url(#leafGrad)"
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                    filter="url(#glow)"
                    initial={{ pathLength: 0 }}
                    whileInView={{ pathLength: 1 }}
                    transition={{ duration: 1.8, delay: branch.delay, ease: "easeInOut" }}
                  />
                ))}

                {/* Enhanced leaves with gradient */}
                {[
                  { cx: 95, cy: 140, delay: 2.5 },
                  { cx: 145, cy: 110, delay: 2.8 },
                  { cx: 195, cy: 80, delay: 3.1 },
                  { cx: 180, cy: 290, delay: 2.7 },
                  { cx: 230, cy: 250, delay: 3.0 },
                  { cx: 300, cy: 220, delay: 3.3 },
                  { cx: 320, cy: 110, delay: 3.5 },
                ].map((leaf, index) => (
                  <motion.g key={index}>
                    <motion.circle
                      cx={leaf.cx}
                      cy={leaf.cy}
                      r="8"
                      fill="url(#leafGrad)"
                      filter="url(#glow)"
                      initial={{ scale: 0, opacity: 0 }}
                      whileInView={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.8, delay: leaf.delay }}
                    />
                    <motion.circle
                      cx={leaf.cx}
                      cy={leaf.cy}
                      r="4"
                      fill="#F5F1EB"
                      opacity="0.6"
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      transition={{ duration: 0.6, delay: leaf.delay + 0.2 }}
                    />
                  </motion.g>
                ))}
              </motion.svg>
            </div>

            {/* Enhanced floating golden elements */}
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-gold/40 rounded-full shadow-lg"
                style={{
                  left: `${20 + Math.random() * 60}%`,
                  top: `${20 + Math.random() * 60}%`,
                }}
                animate={{
                  y: [-15, -25, -15],
                  opacity: [0.4, 0.9, 0.4],
                  scale: [0.5, 1.2, 0.5],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 3,
                  ease: "easeInOut"
                }}
              />
            ))}

            {/* Luxury corner decorations */}
            <div className="absolute top-4 left-4 w-6 h-6 border-l-2 border-t-2 border-gold/40 rounded-tl-xl" />
            <div className="absolute top-4 right-4 w-6 h-6 border-r-2 border-t-2 border-gold/40 rounded-tr-xl" />
            <div className="absolute bottom-4 left-4 w-6 h-6 border-l-2 border-b-2 border-gold/40 rounded-bl-xl" />
            <div className="absolute bottom-4 right-4 w-6 h-6 border-r-2 border-b-2 border-gold/40 rounded-br-xl" />
          </EnhancedCard>
        </motion.div>
      </div>

      {/* Enhanced Values Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 max-w-7xl mx-auto">
        {values.map((value, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: value.delay }}
          >
            <EnhancedCard
              variant="glass"
              padding="lg"
              hover
              className="text-center h-full group border-2 border-white/20 hover:border-gold/30"
            >
              <div className="flex flex-col items-center space-y-6">
                <motion.div
                  className="relative"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="w-20 h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-gold via-gold/90 to-gold/80 rounded-full flex items-center justify-center shadow-xl relative overflow-hidden">
                    <AnimatedIcon
                      icon={value.icon}
                      size={32}
                      variant="default"
                      className="text-agarwood group-hover:scale-110 transition-transform duration-300 relative z-10"
                    />
                    
                    {/* Icon background glow */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-gold/20 to-gold/40 rounded-full opacity-0 group-hover:opacity-100"
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  
                  {/* Floating ring */}
                  <motion.div
                    className="absolute -inset-2 border-2 border-gold/20 rounded-full opacity-0 group-hover:opacity-100"
                    animate={{
                      rotate: 360,
                      scale: [1, 1.1, 1]
                    }}
                    transition={{
                      rotate: { duration: 10, repeat: Infinity, ease: "linear" },
                      scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                    }}
                  />
                </motion.div>
                
                <div className="space-y-3">
                  <h4 className="text-lg lg:text-xl font-serif font-semibold text-agarwood group-hover:text-gold transition-colors duration-300">
                    {value.title}
                  </h4>
                  <p className="text-agarwood/75 group-hover:text-agarwood/90 text-sm lg:text-[0.938rem] leading-relaxed transition-colors duration-300">
                    {value.description}
                  </p>
                </div>
                
                {/* Bottom accent */}
                <motion.div
                  className="w-8 h-px bg-gradient-to-r from-transparent via-gold to-transparent opacity-0 group-hover:opacity-100"
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: value.delay + 0.5 }}
                />
              </div>
            </EnhancedCard>
          </motion.div>
        ))}
      </div>
    </Section>
  );
};

export default EnhancedAboutUs;
