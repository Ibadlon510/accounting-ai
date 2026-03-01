'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, MessageCircle, Mail, MapPin, Clock, CheckCircle2, User, Building, Calendar, FileText, Calculator, TrendingUp } from 'lucide-react';
import { useForm } from 'react-hook-form';
import Section from '@/components/landing/ui/Section';
import SectionHeader from '@/components/landing/ui/SectionHeader';
import EnhancedCard from '@/components/landing/ui/EnhancedCard';
import EnhancedButton from '@/components/landing/ui/EnhancedButton';
import AnimatedIcon from '@/components/landing/ui/AnimatedIcon';

interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  service: string;
  message: string;
  preferredContact: string;
  timeline: string;
}

const EnhancedCTAContact = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<ContactFormData>();

  const services = [
    { id: 'accounting', label: 'Accounting Services', icon: FileText, description: 'Complete bookkeeping & financial reporting' },
    { id: 'vat', label: 'UAE VAT Consultancy', icon: Calculator, description: 'VAT registration, filing & compliance' },
    { id: 'audit', label: 'Audit Support', icon: CheckCircle2, description: 'Audit preparation & regulatory compliance' },
    { id: 'advisory', label: 'Business Advisory', icon: TrendingUp, description: 'Strategic financial consulting' },
    { id: 'tax-planning', label: 'Tax Planning', icon: Calendar, description: 'Optimization & strategic planning' },
    { id: 'financial', label: 'Financial Consulting', icon: Building, description: 'Investment & financial strategy' },
    { id: 'other', label: 'Other', icon: MessageCircle, description: 'Custom solutions for your needs' }
  ];

  const contactMethods = [
    {
      id: 'phone',
      icon: Phone,
      label: 'Phone Call',
      value: '+971 50 123 4567',
      link: 'tel:+971501234567',
      description: 'Direct consultation',
      available: '9 AM - 6 PM'
    },
    {
      id: 'whatsapp',
      icon: MessageCircle,
      label: 'WhatsApp',
      value: '+971 50 123 4567',
      link: 'https://wa.me/971501234567',
      description: 'Instant messaging',
      available: '24/7 Response'
    },
    {
      id: 'email',
      icon: Mail,
      label: 'Email',
      value: 'admin@agaraccounting.com',
      link: 'mailto:admin@agaraccounting.com',
      description: 'Detailed inquiries',
      available: '24h Response'
    }
  ];

  const businessHours = [
    { day: 'Sunday - Thursday', hours: '9:00 AM - 6:00 PM' },
    { day: 'Friday', hours: '2:00 PM - 6:00 PM' },
    { day: 'Saturday', hours: 'By Appointment' }
  ];

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          phone: data.phone,
          company: data.company,
          service: data.service,
          message: data.message,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send message');
      }

      setIsSubmitted(true);
      
      // Reset form after success
      setTimeout(() => {
        reset();
        setIsSubmitted(false);
      }, 5000);
      
    } catch (error) {
      console.error('Form submission error:', error);
      setSubmitError(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Section
      id="contact"
      variant="gradient"
      padding="xl"
      parallax={{
        variant: 'ledger',
        intensity: 0.2
      }}
    >
      <SectionHeader
        subtitle="Get In Touch"
        title="Start Your Financial|Success Journey"
        description="Ready to experience premium accounting services? Contact our expert team for a personalized consultation tailored to your business needs."
        variant="luxury"
      />

      <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 max-w-7xl mx-auto">
        
        {/* Contact Information */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="space-y-12"
        >
          {/* Contact Methods */}
          <div className="space-y-6">
            <h3 className="text-2xl lg:text-3xl font-serif font-bold text-agarwood mb-8">
              Multiple Ways to Reach Us
            </h3>
            
            {contactMethods.map((method, index) => (
              <motion.a
                key={method.id}
                href={method.link}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="block group"
              >
                <EnhancedCard
                  variant="glass"
                  padding="lg"
                  hover
                  className="border-2 border-white/20 hover:border-gold/40 transition-all duration-300"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-gold/20 to-agarwood/15 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                      <AnimatedIcon
                        icon={method.icon}
                        size={24}
                        variant="luxury"
                        animate="pulse"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-semibold text-agarwood group-hover:text-gold transition-colors duration-300">
                          {method.label}
                        </h4>
                        <span className="text-xs text-agarwood/60 bg-beige/30 px-2 py-1 rounded-full">
                          {method.available}
                        </span>
                      </div>
                      <p className="text-agarwood/70 text-sm mb-2">{method.description}</p>
                      <p className="text-agarwood font-medium group-hover:text-gold transition-colors duration-300">
                        {method.value}
                      </p>
                    </div>
                  </div>
                </EnhancedCard>
              </motion.a>
            ))}
          </div>

          {/* Business Hours */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <EnhancedCard
              variant="luxury"
              padding="lg"
              className="border-2 border-gold/30"
            >
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <AnimatedIcon
                    icon={Clock}
                    size={24}
                    variant="luxury"
                    animate="pulse"
                  />
                  <h4 className="text-xl font-serif font-bold text-agarwood">Business Hours</h4>
                </div>
                
                <div className="space-y-3">
                  {businessHours.map((schedule, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-white/50 dark:bg-agar-dark-surface/50 rounded-lg border border-gold/20">
                      <span className="text-agarwood font-medium">{schedule.day}</span>
                      <span className="text-agarwood/70">{schedule.hours}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center space-x-2 p-3 bg-gold/10 border border-gold/30 rounded-lg">
                  <CheckCircle2 size={16} className="text-gold" />
                  <span className="text-sm text-agarwood">Emergency consultations available by appointment</span>
                </div>
              </div>
            </EnhancedCard>
          </motion.div>

          {/* Location Info */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <EnhancedCard
              variant="glass"
              padding="lg"
              className="border-2 border-white/20"
            >
              <div className="flex items-start space-x-4">
                <AnimatedIcon
                  icon={MapPin}
                  size={24}
                  variant="luxury"
                  animate="bounce"
                />
                <div>
                  <h4 className="text-lg font-semibold text-agarwood mb-2">Our Location</h4>
                  <p className="text-agarwood/70 leading-relaxed">
                    Business Bay, Dubai, UAE<br />
                    Serving clients across all Emirates<br />
                    <span className="text-sm text-gold">Virtual consultations available</span>
                  </p>
                </div>
              </div>
            </EnhancedCard>
          </motion.div>
        </motion.div>

        {/* Contact Form */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <EnhancedCard
            variant="luxury"
            padding="xl"
            className="border-2 border-gold/30 shadow-2xl"
          >
            <AnimatePresence mode="wait">
              {!isSubmitted ? (
                <motion.div
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                    <div>
                      <h3 className="text-2xl lg:text-3xl font-serif font-bold text-agarwood mb-2">
                        Book Your Consultation
                      </h3>
                      <p className="text-agarwood/70">
                        Fill out the form below and we&apos;ll get back to you within 24 hours
                      </p>
                    </div>

                    {/* Basic Information */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-agarwood mb-2">
                          Full Name *
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-agarwood/40" size={18} />
                          <input
                            {...register('name', { required: 'Name is required' })}
                            className="w-full pl-10 pr-4 py-3 border-2 border-beige/40 dark:border-gold/20 rounded-xl focus:border-gold/50 focus:outline-none transition-colors duration-200 text-agarwood placeholder:text-agarwood/40 bg-white/50 dark:bg-agar-dark-surface/50"
                            placeholder="Enter your full name"
                          />
                        </div>
                        {errors.name && (
                          <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-agarwood mb-2">
                          Email Address *
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-agarwood/40" size={18} />
                          <input
                            {...register('email', { 
                              required: 'Email is required',
                              pattern: {
                                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                message: 'Invalid email address'
                              }
                            })}
                            className="w-full pl-10 pr-4 py-3 border-2 border-beige/40 dark:border-gold/20 rounded-xl focus:border-gold/50 focus:outline-none transition-colors duration-200 text-agarwood placeholder:text-agarwood/40 bg-white/50 dark:bg-agar-dark-surface/50"
                            placeholder="your@email.com"
                          />
                        </div>
                        {errors.email && (
                          <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-agarwood mb-2">
                          Phone Number
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-agarwood/40" size={18} />
                          <input
                            {...register('phone')}
                            className="w-full pl-10 pr-4 py-3 border-2 border-beige/40 dark:border-gold/20 rounded-xl focus:border-gold/50 focus:outline-none transition-colors duration-200 text-agarwood placeholder:text-agarwood/40 bg-white/50 dark:bg-agar-dark-surface/50"
                            placeholder="+971 50 123 4567"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-agarwood mb-2">
                          Company Name
                        </label>
                        <div className="relative">
                          <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-agarwood/40" size={18} />
                          <input
                            {...register('company')}
                            className="w-full pl-10 pr-4 py-3 border-2 border-beige/40 dark:border-gold/20 rounded-xl focus:border-gold/50 focus:outline-none transition-colors duration-200 text-agarwood placeholder:text-agarwood/40 bg-white/50 dark:bg-agar-dark-surface/50"
                            placeholder="Your Company Ltd."
                          />
                        </div>
                      </div>
                    </div>

                    {/* Service Selection */}
                    <div>
                      <label className="block text-sm font-semibold text-agarwood mb-4">
                        Service Interest *
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {services.map((service) => (
                          <motion.label
                            key={service.id}
                            className={`relative flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                              watch('service') === service.id
                                ? 'border-gold bg-gold/10 shadow-lg'
                                : 'border-beige/40 dark:border-gold/10 hover:border-gold/30 bg-white/30 dark:bg-agar-dark-surface/30'
                            }`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <input
                              {...register('service', { required: 'Please select a service' })}
                              type="radio"
                              value={service.id}
                              className="sr-only"
                            />
                            <div className="flex items-center space-x-3 w-full">
                              <AnimatedIcon
                                icon={service.icon}
                                size={20}
                                variant={watch('service') === service.id ? "luxury" : "default"}
                                animate="pulse"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-agarwood truncate">
                                  {service.label}
                                </p>
                                <p className="text-xs text-agarwood/60 truncate">
                                  {service.description}
                                </p>
                              </div>
                            </div>
                          </motion.label>
                        ))}
                      </div>
                      {errors.service && (
                        <p className="text-red-500 text-xs mt-2">{errors.service.message}</p>
                      )}
                    </div>

                    {/* Message */}
                    <div>
                      <label className="block text-sm font-semibold text-agarwood mb-2">
                        Message *
                      </label>
                      <textarea
                        {...register('message', { required: 'Message is required' })}
                        rows={4}
                        className="w-full px-4 py-3 border-2 border-beige/40 dark:border-gold/20 rounded-xl focus:border-gold/50 focus:outline-none transition-colors duration-200 text-agarwood placeholder:text-agarwood/40 bg-white/50 dark:bg-agar-dark-surface/50 resize-none"
                        placeholder="Tell us about your business needs and how we can help..."
                      />
                      {errors.message && (
                        <p className="text-red-500 text-xs mt-1">{errors.message.message}</p>
                      )}
                    </div>

                    {/* Submit Button */}
                    <div className="space-y-4">
                      <EnhancedButton
                        type="submit"
                        variant="luxury"
                        size="xl"
                        loading={isSubmitting}
                        showArrow
                        glow
                        fullWidth
                        className="shadow-lg hover:shadow-2xl"
                      >
                        {isSubmitting ? 'Sending Your Request...' : 'Book Free Consultation'}
                      </EnhancedButton>

                      <div className="flex items-center justify-center space-x-4 text-xs text-agarwood/60">
                        <div className="flex items-center space-x-1">
                          <CheckCircle2 size={14} className="text-gold" />
                          <span>Free consultation</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <CheckCircle2 size={14} className="text-gold" />
                          <span>24h response</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <CheckCircle2 size={14} className="text-gold" />
                          <span>No commitment</span>
                        </div>
                      </div>
                    </div>
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12 space-y-6"
                >
                  <motion.div
                    className="w-20 h-20 bg-gold rounded-full flex items-center justify-center mx-auto shadow-xl"
                    animate={{
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <CheckCircle2 size={40} className="text-agarwood" />
                  </motion.div>
                  
                  <div>
                    <h3 className="text-2xl font-serif font-bold text-agarwood mb-2">
                      Thank You!
                    </h3>
                    <p className="text-agarwood/70 leading-relaxed">
                      Your consultation request has been received successfully. 
                      Our team will contact you within 24 hours to schedule your free consultation.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <EnhancedButton
                      variant="outline"
                      onClick={() => setIsSubmitted(false)}
                    >
                      Send Another Message
                    </EnhancedButton>
                    <EnhancedButton
                      variant="luxury"
                      onClick={() => window.location.href = 'tel:+971501234567'}
                      icon={<Phone size={18} />}
                    >
                      Call Us Now
                    </EnhancedButton>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </EnhancedCard>
        </motion.div>
      </div>
    </Section>
  );
};

export default EnhancedCTAContact;
