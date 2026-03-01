'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Quote, ChevronLeft, ChevronRight, MapPin, Building, Award, TrendingUp, Shield, Users, CheckCircle2 } from 'lucide-react';
import Section from '@/components/landing/ui/Section';
import SectionHeader from '@/components/landing/ui/SectionHeader';
import EnhancedCard from '@/components/landing/ui/EnhancedCard';
import EnhancedButton from '@/components/landing/ui/EnhancedButton';

const testimonials = [
    {
      id: 1,
      name: "Ahmed Al-Rashid",
      position: "CEO & Founder",
      company: "Dubai Tech Solutions",
      rating: 5,
      text: "AgarWood Accounting transformed our financial operations completely. Their expertise in UAE VAT regulations saved us thousands in potential penalties. The personalized service and attention to detail is unmatched in the market.",
      industry: "Technology",
      location: "Dubai",
      metrics: "Saved AED 45,000 in penalties",
      year: "2024",
      icon: Award,
      gradient: "from-blue-500/20 via-blue-400/15 to-blue-300/10",
      accentColor: "text-blue-600 dark:text-blue-400",
      category: "VAT Compliance",
      testimonialType: "cost-saving"
    },
    {
      id: 2,
      name: "Sarah Mitchell",
      position: "Founder & Managing Director",
      company: "Emirates Fashion House",
      rating: 5,
      text: "As a startup, we needed accounting partners who understood our growth trajectory. AgarWood provided scalable solutions that grew with us. Their transparent pricing and expert guidance made all the difference in our success.",
      industry: "Fashion & Retail",
      location: "Abu Dhabi",
      metrics: "300% revenue growth",
      year: "2023",
      icon: TrendingUp,
      gradient: "from-purple-500/20 via-purple-400/15 to-purple-300/10",
      accentColor: "text-purple-600 dark:text-purple-400",
      category: "Growth Support",
      testimonialType: "growth"
    },
    {
      id: 3,
      name: "Mohammed Hassan",
      position: "Managing Director",
      company: "Gulf Trading Co.",
      rating: 5,
      text: "The boutique approach really sets them apart. Unlike larger firms, we get direct access to senior partners and customized solutions. Their audit support helped us achieve perfect compliance ratings with zero issues.",
      industry: "Import/Export",
      location: "Sharjah",
      metrics: "100% compliance rating",
      year: "2024",
      icon: Shield,
      gradient: "from-green-500/20 via-green-400/15 to-green-300/10",
      accentColor: "text-green-600 dark:text-green-400",
      category: "Audit & Compliance",
      testimonialType: "compliance"
    },
    {
      id: 4,
      name: "Fatima Al-Zahra",
      position: "CFO",
      company: "Emirates Healthcare Group",
      rating: 5,
      text: "Working with AgarWood has been a game-changer for our healthcare group. Their understanding of sector-specific requirements and proactive approach to compliance has given us complete peace of mind to focus on patient care.",
      industry: "Healthcare",
      location: "Dubai",
      metrics: "Streamlined 5 entities",
      year: "2023",
      icon: Users,
      gradient: "from-teal-500/20 via-teal-400/15 to-teal-300/10",
      accentColor: "text-teal-600 dark:text-teal-400",
      category: "Multi-Entity Management",
      testimonialType: "efficiency"
    },
    {
      id: 5,
      name: "Omar Al-Mahmoud",
      position: "Executive Chairman",
      company: "Desert Real Estate",
      rating: 5,
      text: "In the complex world of real estate accounting, AgarWood's expertise shines through. They've helped us navigate property transactions, VAT implications, and investment structures with remarkable precision and insight.",
      industry: "Real Estate",
      location: "Abu Dhabi",
      metrics: "Managed AED 50M+ transactions",
      year: "2024",
      icon: Building,
      gradient: "from-orange-500/20 via-orange-400/15 to-orange-300/10",
      accentColor: "text-orange-600 dark:text-orange-400",
      category: "Real Estate Expertise",
      testimonialType: "expertise"
    }
];

const EnhancedTestimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [direction, setDirection] = useState(0);

  const nextTestimonial = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  }, []);

  const prevTestimonial = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  }, []);

  const goToSlide = useCallback((index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  }, [currentIndex]);

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const timer = setInterval(() => {
      nextTestimonial();
    }, 5000);

    return () => clearInterval(timer);
  }, [isAutoPlaying, currentIndex, nextTestimonial]);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2, delay: i * 0.1 }}
      >
        <Star
          size={18}
          className={i < rating ? 'text-gold fill-gold' : 'text-gold/30'}
        />
      </motion.div>
    ));
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.8
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.8
    })
  };

  return (
    <Section
      id="testimonials"
      variant="luxury"
      padding="lg"
      className="overflow-hidden"
    >
      <SectionHeader
        subtitle="Client Success Stories"
        title="Transforming Businesses|Across the UAE"
        description="Discover how our boutique approach and UAE expertise have helped businesses achieve remarkable financial success and perfect compliance."
        variant="luxury"
      />

      {/* Main Testimonial Showcase */}
      <div className="relative max-w-6xl mx-auto mb-12 lg:mb-16">
        <EnhancedCard
          variant="luxury"
          padding="xl"
          className="relative overflow-hidden border-2 border-gold/30 shadow-2xl"
        >
          {/* Dynamic background based on testimonial category */}
          <div className={`absolute inset-0 bg-gradient-to-br ${testimonials[currentIndex]?.gradient || 'from-gold/10 to-agarwood/5'} opacity-30`} />
          
          {/* Background Quote Icon */}
          <div className="absolute top-8 right-8 opacity-10">
            <Quote size={120} className="text-gold" />
          </div>
          
          {/* Category Badge */}
          <motion.div
            key={`category-${currentIndex}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="absolute top-8 left-8 z-20"
          >
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-white/90 dark:bg-agar-dark-surface/90 backdrop-blur-sm border border-gold/30 rounded-full shadow-lg">
              {React.createElement(testimonials[currentIndex]?.icon || Star, { 
                size: 16, 
                className: testimonials[currentIndex]?.accentColor || 'text-gold' 
              })}
              <span className="text-sm font-semibold text-agarwood">
                {testimonials[currentIndex]?.category}
              </span>
            </div>
          </motion.div>

          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.3 },
                scale: { duration: 0.4 }
              }}
              className="relative z-10"
            >
              <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                
                {/* Testimonial Content */}
                <div className="space-y-8">
                  {/* Rating */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      {renderStars(testimonials[currentIndex]?.rating || 5)}
                      <span className="text-agarwood/60 text-sm ml-2">
                        ({testimonials[currentIndex]?.year})
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-agarwood/50 uppercase tracking-wider font-semibold">
                        Success Story #{currentIndex + 1} of {testimonials.length}
                      </p>
                    </div>
                  </div>

                  {/* Quote */}
                  <motion.blockquote
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-lg lg:text-xl text-agarwood leading-relaxed font-medium relative"
                  >
                    <span className="text-6xl text-gold/30 absolute -top-4 -left-2 font-serif leading-none">&ldquo;</span>
                    <span className="relative z-10 italic">
                      {testimonials[currentIndex]?.text}
                    </span>
                    <span className="text-6xl text-gold/30 absolute -bottom-8 -right-2 font-serif leading-none">&rdquo;</span>
                  </motion.blockquote>

                  {/* Enhanced Metrics */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="space-y-4"
                  >
                    <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-gold/15 via-gold/10 to-gold/15 border-2 border-gold/30 rounded-full shadow-lg">
                      <CheckCircle2 size={18} className="text-gold mr-2" />
                      <span className="text-base font-bold text-agarwood">
                        {testimonials[currentIndex]?.metrics}
                      </span>
                    </div>
                    
                    {/* Industry & Location Tags */}
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center px-3 py-1 bg-agarwood/5 border border-agarwood/20 rounded-full text-sm font-medium text-agarwood">
                        <Building size={14} className="mr-1" />
                        {testimonials[currentIndex]?.industry}
                      </span>
                      <span className="inline-flex items-center px-3 py-1 bg-agarwood/5 border border-agarwood/20 rounded-full text-sm font-medium text-agarwood">
                        <MapPin size={14} className="mr-1" />
                        {testimonials[currentIndex]?.location}
                      </span>
                    </div>
                  </motion.div>
                </div>

                {/* Client Info */}
                <div className="space-y-8">
                  {/* Enhanced Client Photo & Details */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="text-center lg:text-left"
                  >
                    <div className="relative inline-block mb-6">
                      {/* Enhanced Avatar with Dynamic Background */}
                      <div className={`w-28 h-28 lg:w-36 lg:h-36 rounded-2xl bg-gradient-to-br ${testimonials[currentIndex]?.gradient || 'from-gold/20 to-agarwood/20'} p-1.5 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500`}>
                        <div className="w-full h-full rounded-xl bg-gradient-to-br from-beige via-white to-beige flex items-center justify-center text-3xl lg:text-4xl font-serif font-bold text-agarwood border-2 border-white/50 shadow-inner">
                          {testimonials[currentIndex]?.name.split(' ').map(n => n[0]).join('')}
                        </div>
                      </div>
                      
                      {/* Enhanced Verification badge with category icon */}
                      <motion.div
                        className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-r from-gold via-gold/95 to-gold/90 rounded-full flex items-center justify-center border-3 border-white shadow-xl"
                        animate={{ 
                          scale: [1, 1.15, 1],
                          rotate: [0, 10, -10, 0]
                        }}
                        transition={{ duration: 3, repeat: Infinity }}
                      >
                        {React.createElement(testimonials[currentIndex]?.icon || Star, { 
                          size: 16, 
                          className: "text-agarwood" 
                        })}
                      </motion.div>
                    </div>

                    <h4 className="text-2xl lg:text-3xl font-serif font-bold text-agarwood mb-2 relative">
                      {testimonials[currentIndex]?.name}
                      <motion.div
                        className="absolute -bottom-1 left-0 h-0.5 bg-gold origin-left"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 0.8, delay: 0.5 }}
                      />
                    </h4>
                    <p className="text-lg text-gold font-bold mb-2">
                      {testimonials[currentIndex]?.position}
                    </p>
                    <p className="text-base text-agarwood font-semibold mb-6">
                      {testimonials[currentIndex]?.company}
                    </p>
                    
                    {/* Enhanced Company Info Card */}
                    <div className="bg-white/60 dark:bg-agar-dark-surface/60 backdrop-blur-sm border border-gold/20 rounded-xl p-4 space-y-3 shadow-lg">
                      <div className="flex items-center space-x-3 text-agarwood/80">
                        <div className="w-8 h-8 bg-agarwood/10 rounded-lg flex items-center justify-center">
                          <Building size={16} className="text-agarwood" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-agarwood/60 uppercase tracking-wider">Company</p>
                          <p className="font-bold text-agarwood">{testimonials[currentIndex]?.company}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 text-agarwood/80">
                        <div className="w-8 h-8 bg-agarwood/10 rounded-lg flex items-center justify-center">
                          <MapPin size={16} className="text-agarwood" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-agarwood/60 uppercase tracking-wider">Location & Industry</p>
                          <p className="font-bold text-agarwood">{testimonials[currentIndex]?.location} • {testimonials[currentIndex]?.industry}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Trust Indicators */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="text-center lg:text-left space-y-3"
                  >
                    <div className="flex items-center justify-center lg:justify-start space-x-2">
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star key={i} size={14} className="text-gold fill-gold" />
                        ))}
                      </div>
                      <span className="text-sm font-semibold text-agarwood/70">Verified Client</span>
                    </div>
                    
                    <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-agarwood/5 via-agarwood/10 to-agarwood/5 border border-agarwood/20 rounded-full">
                      <span className="text-sm font-bold text-agarwood">
                        {testimonials[currentIndex]?.industry} Sector • {testimonials[currentIndex]?.year}
                      </span>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Enhanced Navigation Controls */}
          <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between bg-white/80 dark:bg-agar-dark/80 backdrop-blur-sm border border-gold/20 rounded-2xl px-6 py-4 shadow-xl">
            <div className="flex items-center space-x-4">
              <EnhancedButton
                variant="outline"
                size="sm"
                onClick={prevTestimonial}
                icon={<ChevronLeft size={18} />}
                className="w-10 h-10 rounded-xl border-2 border-gold/40 hover:border-gold/70 hover:bg-gold/10"
                onMouseEnter={() => setIsAutoPlaying(false)}
                onMouseLeave={() => setIsAutoPlaying(true)}
              >
                <span className="sr-only">Previous testimonial</span>
              </EnhancedButton>
              <EnhancedButton
                variant="outline"
                size="sm"
                onClick={nextTestimonial}
                icon={<ChevronRight size={18} />}
                className="w-10 h-10 rounded-xl border-2 border-gold/40 hover:border-gold/70 hover:bg-gold/10"
                onMouseEnter={() => setIsAutoPlaying(false)}
                onMouseLeave={() => setIsAutoPlaying(true)}
              >
                <span className="sr-only">Next testimonial</span>
              </EnhancedButton>
            </div>

            {/* Enhanced Slide Indicators */}
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-agarwood/60 mr-2">
                {currentIndex + 1} / {testimonials.length}
              </span>
              <div className="flex space-x-2">
                {testimonials.map((_, index) => (
                  <motion.button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`relative overflow-hidden rounded-full transition-all duration-300 ${
                      index === currentIndex
                        ? 'w-8 h-3 bg-gold shadow-lg'
                        : 'w-3 h-3 bg-agarwood/30 hover:bg-agarwood/50'
                    }`}
                    onMouseEnter={() => setIsAutoPlaying(false)}
                    onMouseLeave={() => setIsAutoPlaying(true)}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {index === currentIndex && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-gold/60 via-gold to-gold/60"
                        initial={{ x: '-100%' }}
                        animate={{ x: '100%' }}
                        transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
                      />
                    )}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Enhanced Auto-play toggle */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-all duration-200 ${
                  isAutoPlaying 
                    ? 'bg-gold/20 text-gold border border-gold/30' 
                    : 'bg-agarwood/10 text-agarwood/60 border border-agarwood/20 hover:bg-agarwood/20'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${
                  isAutoPlaying ? 'bg-gold animate-pulse' : 'bg-agarwood/40'
                }`} />
                <span className="text-xs font-semibold">
                  {isAutoPlaying ? 'Auto' : 'Manual'}
                </span>
              </button>
            </div>
          </div>
        </EnhancedCard>
      </div>

    </Section>
  );
};

export default EnhancedTestimonials;
