'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Calendar, Clock, Linkedin, Twitter, Instagram } from 'lucide-react';
import Section from '@/components/landing/ui/Section';
import EnhancedButton from '@/components/landing/ui/EnhancedButton';
import AnimatedIcon from '@/components/landing/ui/AnimatedIcon';

const EnhancedFooter = () => {
  const currentYear = new Date().getFullYear();
  
  const contactInfo = {
    email: 'admin@agaraccounting.com',
    phone: '+971 50 123 4567',
    address: 'Business Bay, Dubai, UAE',
    hours: 'Sun-Thu: 9AM-6PM'
  };

  const services = [
    'Accounting Services',
    'VAT Consultancy',
    'Audit Support', 
    'Business Advisory',
    'Tax Planning',
    'Financial Reporting'
  ];

  const quickLinks = [
    { name: 'About Us', href: '#about' },
    { name: 'Services', href: '#services' },
    { name: 'Why Choose Us', href: '#why-choose-us' },
    { name: 'Tools & Resources', href: '/landing' },
    { name: 'Testimonials', href: '#testimonials' },
    { name: 'Contact', href: '#contact' }
  ];

  const socialLinks = [
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Instagram, href: '#', label: 'Instagram' }
  ];

  return (
    <Section
      variant="dark"
      padding="xl"
      parallax={{
        variant: 'audit-papers',
        intensity: 0.2
      }}
      className="relative"
    >
      {/* Enhanced background overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-dark-brown via-agarwood to-agarwood opacity-95" />
      <div className="absolute inset-0 bg-gradient-to-br from-agarwood/50 via-transparent to-dark-brown/30" />
      
      <div className="relative z-10">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 mb-12">
          
          {/* Company Info */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-2 space-y-8"
          >
            {/* Enhanced Logo */}
            <motion.div 
              className="flex items-center space-x-4 group"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <div className="w-16 h-16 bg-gradient-to-br from-gold via-gold/90 to-gold/80 rounded-2xl flex items-center justify-center shadow-xl relative overflow-hidden">
                <motion.div
                  className="w-8 h-8 border-3 border-agarwood rounded-lg transform rotate-45"
                  whileHover={{ rotate: 50 }}
                  transition={{ duration: 0.3 }}
                />
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full group-hover:translate-x-full"
                  transition={{ duration: 0.8 }}
                />
              </div>
              <div>
                <h3 className="text-2xl lg:text-3xl font-serif font-bold text-white leading-none">
                  AgarWood
                </h3>
                <p className="text-gold font-semibold tracking-wider uppercase text-sm">
                  Accounting & Tax
                </p>
              </div>
            </motion.div>

            {/* Enhanced Description */}
            <p className="text-white/80 text-lg leading-relaxed max-w-md">
              Like the rare agarwood that develops its distinctive character over time, 
              we&apos;ve cultivated unparalleled expertise in accounting and tax services 
              across the UAE.
            </p>

            {/* Contact Info with Icons */}
            <div className="space-y-4">
              <motion.a
                href={`mailto:${contactInfo.email}`}
                className="flex items-center space-x-3 text-white/80 hover:text-gold transition-colors duration-300 group"
                whileHover={{ x: 5 }}
              >
                <AnimatedIcon
                  icon={Mail}
                  size={20}
                  variant="luxury"
                  animate="pulse"
                  background
                  className="group-hover:text-gold"
                />
                <span className="group-hover:underline">{contactInfo.email}</span>
              </motion.a>

              <motion.a
                href={`tel:${contactInfo.phone}`}
                className="flex items-center space-x-3 text-white/80 hover:text-gold transition-colors duration-300 group"
                whileHover={{ x: 5 }}
              >
                <AnimatedIcon
                  icon={Phone}
                  size={20}
                  variant="luxury"
                  animate="pulse"
                  background
                  className="group-hover:text-gold"
                />
                <span className="group-hover:underline">{contactInfo.phone}</span>
              </motion.a>

              <motion.div
                className="flex items-center space-x-3 text-white/80"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <AnimatedIcon
                  icon={MapPin}
                  size={20}
                  variant="luxury"
                  animate="pulse"
                  background
                />
                <span>{contactInfo.address}</span>
              </motion.div>

              <motion.div
                className="flex items-center space-x-3 text-white/80"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <AnimatedIcon
                  icon={Clock}
                  size={20}
                  variant="luxury"
                  animate="pulse"
                  background
                />
                <span>{contactInfo.hours}</span>
              </motion.div>
            </div>
          </motion.div>

          {/* Services */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-6"
          >
            <h4 className="text-xl font-serif font-bold text-white mb-6 relative">
              Our Services
              <motion.div
                className="absolute -bottom-1 left-0 w-8 h-0.5 bg-gold"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
              />
            </h4>
            <div className="space-y-3">
              {services.map((service, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="flex items-center space-x-2 text-white/80 hover:text-gold transition-colors duration-300 cursor-pointer group"
                  whileHover={{ x: 5 }}
                >
                  <div className="w-2 h-2 bg-gold rounded-full group-hover:scale-125 transition-transform duration-300" />
                  <span className="text-sm lg:text-base">{service}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            <h4 className="text-xl font-serif font-bold text-white mb-6 relative">
              Quick Links
              <motion.div
                className="absolute -bottom-1 left-0 w-8 h-0.5 bg-gold"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 }}
              />
            </h4>
            <div className="space-y-3">
              {quickLinks.map((link, index) => (
                <motion.button
                  key={index}
                  onClick={() => {
                    const element = document.querySelector(link.href);
                    if (element) element.scrollIntoView({ behavior: 'smooth' });
                  }}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="flex items-center space-x-2 text-white/80 hover:text-gold transition-colors duration-300 group w-full text-left"
                  whileHover={{ x: 5 }}
                >
                  <div className="w-2 h-2 bg-gold rounded-full group-hover:scale-125 transition-transform duration-300" />
                  <span className="text-sm lg:text-base">{link.name}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Enhanced CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center py-16 border-t border-gold/20"
        >
          <div className="max-w-4xl mx-auto space-y-8">
            <h3 className="text-2xl lg:text-3xl font-serif font-bold text-white">
              Ready to Transform Your Financial Future?
            </h3>
            <p className="text-lg text-white/80 leading-relaxed">
              Experience the AgarWood difference – where luxury meets precision in accounting services.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <EnhancedButton
                variant="luxury"
                size="xl"
                onClick={() => {
                  const element = document.querySelector('#contact');
                  if (element) element.scrollIntoView({ behavior: 'smooth' });
                }}
                showArrow
                glow
              >
                Book Free Consultation
              </EnhancedButton>
              <div className="flex items-center space-x-2 text-white/60">
                <Calendar size={16} />
                <span className="text-sm">No commitment required</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Bottom Bar */}
        <div className="flex flex-col lg:flex-row justify-between items-center pt-12 border-t border-gold/20 space-y-6 lg:space-y-0">
          
          {/* Copyright */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-white/60 text-sm text-center lg:text-left"
          >
            <p>© {currentYear} AgarWood Accounting & Tax. All rights reserved.</p>
            <p className="mt-1">Crafted with excellence in the UAE</p>
          </motion.div>

          {/* Social Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex items-center space-x-6"
          >
            {socialLinks.map((social, index) => (
              <motion.a
                key={index}
                href={social.href}
                className="w-10 h-10 bg-gold/20 border border-gold/30 rounded-full flex items-center justify-center text-gold hover:bg-gold hover:text-agarwood transition-all duration-300"
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                aria-label={social.label}
              >
                <social.icon size={18} />
              </motion.a>
            ))}
          </motion.div>

        </div>
      </div>
    </Section>
  );
};

export default EnhancedFooter;
