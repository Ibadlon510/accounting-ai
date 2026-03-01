'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import AnimatedCounter from '@/components/landing/ui/AnimatedCounter';
import EnhancedButton from '@/components/landing/ui/EnhancedButton';
import Section from '@/components/landing/ui/Section';
import AnimatedIcon from '@/components/landing/ui/AnimatedIcon';

// Deterministic particle positions to avoid SSR hydration mismatch
const PARTICLE_POSITIONS = [
  { left: 12, top: 8, duration: 5.2, delay: 0.3 },
  { left: 28, top: 15, duration: 6.1, delay: 1.7 },
  { left: 45, top: 5, duration: 4.8, delay: 2.4 },
  { left: 67, top: 22, duration: 7.3, delay: 0.8 },
  { left: 83, top: 12, duration: 5.5, delay: 3.1 },
  { left: 7, top: 45, duration: 6.8, delay: 1.2 },
  { left: 35, top: 55, duration: 4.5, delay: 4.0 },
  { left: 52, top: 38, duration: 7.1, delay: 0.5 },
  { left: 75, top: 48, duration: 5.9, delay: 2.8 },
  { left: 91, top: 35, duration: 6.4, delay: 1.5 },
  { left: 18, top: 72, duration: 5.0, delay: 3.6 },
  { left: 60, top: 78, duration: 6.7, delay: 0.9 },
];

const EnhancedHero = () => {
  const handleBookConsultation = () => {
    const element = document.querySelector('#contact');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleScrollToAbout = () => {
    const element = document.querySelector('#about');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <Section
      id="home"
      variant="luxury"
      padding="none"
      parallax={{
        variant: 'balance-sheet',
        intensity: 0.3
      }}
      className="min-h-screen pt-32 sm:pt-36 md:pt-40 lg:pt-44 xl:pt-48 2xl:pt-52"
    >
      {/* Enhanced Background Elements */}
      <div className="absolute inset-0">
        {/* Primary golden shimmer animation */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-transparent via-gold/15 to-transparent rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.7, 0.3],
            x: [0, 120, 0],
            y: [0, -60, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Secondary ambient light */}
        <motion.div
          className="absolute top-3/4 right-1/4 w-80 h-80 bg-gradient-to-l from-transparent via-gold/10 to-transparent rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.5, 0.2],
            x: [0, -100, 0],
            y: [0, 40, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 3
          }}
        />

        {/* Floating particle system */}
        {PARTICLE_POSITIONS.map((particle, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 bg-gold/25 rounded-full"
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
            }}
            animate={{
              y: [-25, -45, -25],
              opacity: [0, 1, 0],
              scale: [0.3, 1, 0.3],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              delay: particle.delay,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-8xl mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 min-h-screen flex items-center justify-center py-12 md:py-16 lg:py-20">
        <div className="w-full grid lg:grid-cols-2 gap-8 lg:gap-12 xl:gap-16 items-center justify-items-center max-w-7xl">
          
          {/* Left Column - Enhanced Content */}
          <div className="text-center space-y-6 lg:space-y-8 order-2 lg:order-1 px-4 lg:px-0">
            
            {/* Premium Badge */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="inline-flex items-center space-x-4 bg-gradient-to-r from-white/95 via-white/90 to-white/95 backdrop-blur-sm border border-gold/30 rounded-full px-8 py-4 shadow-xl"
            >
              <AnimatedIcon
                icon={Sparkles}
                size={20}
                variant="luxury"
                animate="pulse"
              />
              <span className="text-sm lg:text-base font-semibold text-agarwood tracking-wide">Premium Accounting Services in UAE</span>
            </motion.div>

            {/* Enhanced Main Headlines */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-agarwood leading-tight"
            >
              <span className="relative">
                Luxury in Accounting,
                <motion.div
                  className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-gold via-gold/80 to-gold/50"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 1.2, delay: 1.2 }}
                />
              </span>
              <br />
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="text-gold relative"
              >
                Rooted in Trust
                <motion.div
                  className="absolute -top-2 -right-2 w-3 h-3 bg-gold/30 rounded-full"
                  animate={{
                    scale: [0.8, 1.2, 0.8],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 2
                  }}
                />
              </motion.span>
            </motion.h1>

            {/* Enhanced Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="text-base sm:text-lg lg:text-xl text-agarwood/85 max-w-2xl mx-auto leading-relaxed px-4 lg:px-0"
            >
              <p className="mb-4">
                Boutique consultancy delivering <strong className="text-agarwood font-semibold">clarity in accounting</strong>, 
                <strong className="text-agarwood font-semibold"> tax consultation</strong>, and 
                <strong className="text-agarwood font-semibold"> audit services</strong> across the UAE.
              </p>
              <p className="text-sm lg:text-base text-agarwood/65">
                Like the rare agarwood that develops its distinctive character over time, 
                we&apos;ve cultivated unparalleled expertise through years of dedicated service.
              </p>
            </motion.div>

            {/* Enhanced Trust Indicators - Single Row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="flex items-center justify-center gap-8 sm:gap-12 lg:gap-16 xl:gap-20 pt-8 lg:pt-12 max-w-5xl mx-auto"
            >
              <motion.div 
                className="text-center group py-4 lg:py-6 relative flex-1 max-w-[120px]"
                whileHover={{ scale: 1.05, y: -2 }}
                transition={{ duration: 0.2 }}
              >
                <motion.div 
                  className="absolute -inset-3 bg-gradient-to-r from-gold/10 via-gold/5 to-gold/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                />
                <div className="relative z-10">
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-bold font-serif text-agarwood group-hover:text-gold transition-colors duration-300 mb-2 lg:mb-3">
                    <AnimatedCounter end={50} suffix="+" />
                  </div>
                  <div className="text-xs sm:text-sm lg:text-base text-agarwood/70 font-medium">Happy Clients</div>
                </div>
              </motion.div>
              
              <motion.div 
                className="w-px h-16 lg:h-20 bg-gradient-to-b from-transparent via-gold/30 to-transparent relative"
                animate={{ 
                  scaleY: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
              
              <motion.div 
                className="text-center group py-4 lg:py-6 relative flex-1 max-w-[120px]"
                whileHover={{ scale: 1.05, y: -2 }}
                transition={{ duration: 0.2 }}
              >
                <motion.div 
                  className="absolute -inset-3 bg-gradient-to-r from-gold/10 via-gold/5 to-gold/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                />
                <div className="relative z-10">
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-bold font-serif text-agarwood group-hover:text-gold transition-colors duration-300 mb-2 lg:mb-3">
                    <AnimatedCounter end={5} suffix="+" />
                  </div>
                  <div className="text-xs sm:text-sm lg:text-base text-agarwood/70 font-medium">Years Experience</div>
                </div>
              </motion.div>
              
              <motion.div 
                className="w-px h-16 lg:h-20 bg-gradient-to-b from-transparent via-gold/30 to-transparent relative"
                animate={{ 
                  scaleY: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              />
              
              <motion.div 
                className="text-center group py-4 lg:py-6 relative flex-1 max-w-[120px]"
                whileHover={{ scale: 1.05, y: -2 }}
                transition={{ duration: 0.2 }}
              >
                <motion.div 
                  className="absolute -inset-3 bg-gradient-to-r from-gold/10 via-gold/5 to-gold/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                />
                <div className="relative z-10">
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-bold font-serif text-agarwood group-hover:text-gold transition-colors duration-300 mb-2 lg:mb-3">
                    <AnimatedCounter end={100} suffix="%" />
                  </div>
                  <div className="text-xs sm:text-sm lg:text-base text-agarwood/70 font-medium">UAE Compliant</div>
                </div>
              </motion.div>
            </motion.div>

            {/* Enhanced CTA Buttons - Moved After Statistics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.2 }}
              className="flex flex-col sm:flex-row gap-5 lg:gap-6 items-center justify-center pt-8 lg:pt-12"
            >
              <EnhancedButton
                variant="luxury"
                size="lg"
                onClick={handleBookConsultation}
                showArrow
                glow
                className="w-full sm:w-auto min-w-[240px]"
              >
                Book a Consultation
              </EnhancedButton>

              <EnhancedButton
                variant="outline"
                size="lg"
                onClick={handleScrollToAbout}
                glass
                className="w-full sm:w-auto min-w-[200px]"
              >
                Learn More
              </EnhancedButton>
            </motion.div>
          </div>

          {/* Right Column - Dashboard Preview Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="hidden lg:flex items-center justify-center order-1 lg:order-2 w-full px-8 xl:px-12"
          >
            <motion.div
              className="relative w-full max-w-md xl:max-w-lg"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            >
              {/* Main dashboard card */}
              <div className="bg-white/85 dark:bg-agar-dark-surface/90 backdrop-blur-xl border-2 border-gold/20 rounded-2xl shadow-2xl overflow-hidden">
                {/* Card header */}
                <div className="px-6 py-4 border-b border-gold/10 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-gold/60" />
                    <span className="text-sm font-semibold text-agarwood">Financial Overview</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">Live</span>
                  </div>
                </div>

                {/* Revenue highlight */}
                <div className="px-6 pt-5 pb-4">
                  <p className="text-xs text-agarwood/50 font-medium uppercase tracking-wider mb-1">Total Revenue</p>
                  <div className="flex items-baseline space-x-3">
                    <span className="text-3xl xl:text-4xl font-bold text-agarwood">AED 125,450</span>
                    <span className="inline-flex items-center px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-bold">
                      <svg className="w-3 h-3 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                      12.4%
                    </span>
                  </div>
                </div>

                {/* Mini bar chart */}
                <div className="px-6 pb-4">
                  <div className="flex items-end space-x-1.5 h-16">
                    {[40, 55, 35, 70, 50, 85, 65, 90, 75, 60, 80, 95].map((h, i) => (
                      <motion.div
                        key={i}
                        className="flex-1 rounded-t bg-gradient-to-t from-gold/70 to-gold/40"
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        transition={{ duration: 0.6, delay: 0.8 + i * 0.05, ease: 'easeOut' }}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-[10px] text-agarwood/40">Jan</span>
                    <span className="text-[10px] text-agarwood/40">Dec</span>
                  </div>
                </div>

                {/* Bottom stats row */}
                <div className="px-6 pb-5 grid grid-cols-3 gap-3">
                  <div className="bg-beige/40 dark:bg-agar-dark/40 rounded-xl p-3 text-center">
                    <p className="text-lg font-bold text-agarwood">87</p>
                    <p className="text-[10px] text-agarwood/50 font-medium">Invoices</p>
                  </div>
                  <div className="bg-beige/40 dark:bg-agar-dark/40 rounded-xl p-3 text-center">
                    <p className="text-lg font-bold text-agarwood">24</p>
                    <p className="text-[10px] text-agarwood/50 font-medium">Clients</p>
                  </div>
                  <div className="bg-beige/40 dark:bg-agar-dark/40 rounded-xl p-3 text-center">
                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">5%</p>
                    <p className="text-[10px] text-agarwood/50 font-medium">VAT Filed</p>
                  </div>
                </div>
              </div>

              {/* Floating badge */}
              <motion.div
                className="absolute -top-3 -right-3 bg-gradient-to-r from-gold to-gold/90 text-agarwood px-3 py-1.5 rounded-full text-xs font-bold shadow-lg border border-gold/40 flex items-center space-x-1"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 1.2 }}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span>VAT Compliant</span>
              </motion.div>

              {/* Floating AI badge */}
              <motion.div
                className="absolute -bottom-2 -left-3 bg-white dark:bg-agar-dark-surface border-2 border-gold/20 text-agarwood px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center space-x-1.5"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 1.4 }}
              >
                <Sparkles size={14} className="text-gold" />
                <span>AI-Powered</span>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Trust Badges / Client Logo Strip */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.6 }}
        className="relative z-10 mt-12 lg:mt-16 xl:mt-20 pb-24 lg:pb-28"
      >
        <p className="text-center text-xs sm:text-sm font-medium text-agarwood/40 uppercase tracking-widest mb-6 lg:mb-8">
          Trusted by businesses across the UAE
        </p>
        <div className="flex items-center justify-center flex-wrap gap-6 sm:gap-8 lg:gap-12 opacity-50 hover:opacity-70 transition-opacity duration-500">
          {/* Placeholder client logos — replace with real logos later */}
          {[
            'Dubai Tech Solutions',
            'Emirates Fashion',
            'Gulf Trading Co.',
            'Desert Real Estate',
            'Healthcare Group',
          ].map((name, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 1.8 + i * 0.1 }}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg"
            >
              <div className="w-8 h-8 rounded-lg bg-agarwood/10 border border-agarwood/10 flex items-center justify-center">
                <span className="text-xs font-bold text-agarwood/50">
                  {name.split(' ').map(w => w[0]).join('')}
                </span>
              </div>
              <span className="text-sm font-semibold text-agarwood/40 hidden sm:inline">
                {name}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Enhanced Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.5 }}
        className="absolute bottom-12 lg:bottom-16 xl:bottom-20 left-1/2 transform -translate-x-1/2"
      >
        <motion.button
          onClick={handleScrollToAbout}
          className="flex flex-col items-center text-agarwood/60 hover:text-agarwood transition-colors duration-300 p-6 rounded-2xl hover:bg-white/20 backdrop-blur-sm group"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          whileHover={{ scale: 1.05 }}
        >
          <span className="text-sm lg:text-base xl:text-lg font-medium mb-4 lg:mb-5 group-hover:text-gold transition-colors duration-300">
            Scroll to explore
          </span>
          <motion.div 
            className="w-px h-12 lg:h-14 xl:h-16 bg-gradient-to-b from-transparent via-agarwood/60 to-transparent group-hover:via-gold/60 transition-colors duration-300"
            animate={{
              scaleY: [1, 1.2, 1],
              opacity: [0.6, 1, 0.6]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </motion.button>
      </motion.div>
    </Section>
  );
};

export default EnhancedHero;
