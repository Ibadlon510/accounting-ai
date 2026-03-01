'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  description?: string;
  centered?: boolean;
  variant?: 'default' | 'luxury' | 'minimal';
  titleColor?: 'default' | 'gold' | 'white';
  className?: string;
  delay?: number;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  description,
  centered = true,
  variant = 'default',
  titleColor = 'default',
  className = '',
  delay = 0,
}) => {
  const titleColors = {
    default: 'text-agarwood',
    gold: 'text-gold',
    white: 'text-white'
  };
  
  const textAlign = centered ? 'text-center' : 'text-left';
  const maxWidth = centered ? 'max-w-6xl mx-auto' : 'max-w-4xl';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay }}
      className={`${textAlign} mb-10 lg:mb-14 ${maxWidth} ${className}`}
    >
      {/* Subtitle/Badge */}
      {subtitle && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: delay + 0.1 }}
          className={`inline-flex items-center space-x-2 ${
            variant === 'luxury' 
              ? 'bg-gradient-to-r from-gold/10 to-gold/5 border border-gold/30 text-gold' 
              : 'bg-white/90 dark:bg-agar-dark-surface/90 border border-gold/30 text-agarwood'
          } rounded-full px-6 py-3 text-sm lg:text-base font-medium mb-6 lg:mb-8`}
        >
          <span>{subtitle}</span>
        </motion.div>
      )}
      
      {/* Main Title */}
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: delay + 0.2 }}
        className={`text-3xl sm:text-4xl lg:text-5xl font-serif font-bold ${titleColors[titleColor]} leading-tight mb-6 lg:mb-8`}
      >
        {/* Split title for animation if it contains a pipe character */}
        {title.includes('|') ? (
          <>
            <span className="block">
              {title.split('|')[0]}
              <motion.div
                className="h-1 bg-gradient-to-r from-gold to-gold/50 mt-2"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: delay + 0.8 }}
              />
            </span>
            <motion.span
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: delay + 0.6 }}
              className="text-gold block mt-4"
            >
              {title.split('|')[1]}
            </motion.span>
          </>
        ) : (
          <span className="relative">
            {title}
            <motion.div
              className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-gold to-gold/50"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: delay + 0.8 }}
            />
          </span>
        )}
      </motion.h2>
      
      {/* Description */}
      {description && (
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: delay + 0.4 }}
          className={`text-base sm:text-lg lg:text-xl xl:text-xl ${
            titleColor === 'white' ? 'text-white/80' : 'text-agarwood/80'
          } leading-relaxed font-normal px-4 lg:px-0`}
        >
          {description}
        </motion.p>
      )}
      
      {/* Decorative Elements for Luxury Variant */}
      {variant === 'luxury' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: delay + 1 }}
          className="flex items-center justify-center mt-6 lg:mt-8 space-x-8"
        >
          <div className="w-16 h-px bg-gradient-to-r from-transparent to-gold/50" />
          <div className="w-3 h-3 rounded-full border-2 border-gold bg-gold/20" />
          <div className="w-16 h-px bg-gradient-to-l from-transparent to-gold/50" />
        </motion.div>
      )}
    </motion.div>
  );
};

export default SectionHeader;
