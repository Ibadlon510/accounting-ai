'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface EnhancedCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'glass' | 'luxury' | 'minimal' | 'gradient';
  hover?: boolean;
  glowing?: boolean;
  padding?: 'sm' | 'md' | 'lg' | 'xl';
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  clickable?: boolean;
  onClick?: () => void;
}

const EnhancedCard: React.FC<EnhancedCardProps> = ({
  children,
  className = '',
  variant = 'default',
  hover = true,
  glowing = false,
  padding = 'lg',
  rounded = 'xl',
  delay = 0,
  direction = 'up',
  clickable = false,
  onClick,
}) => {
  const variants = {
    default: 'bg-white/80 dark:bg-agar-dark/80 backdrop-blur-sm border border-gold/20 shadow-lg hover:shadow-2xl hover:border-gold/40',
    glass: 'bg-white/10 dark:bg-agar-dark-surface/40 backdrop-blur-md border border-white/20 dark:border-gold/10 shadow-xl hover:shadow-2xl hover:bg-white/20 dark:hover:bg-agar-dark-surface/60',
    luxury: 'bg-gradient-to-br from-white via-beige/30 to-white dark:from-agar-dark dark:via-agar-dark-surface/30 dark:to-agar-dark border border-gold/30 shadow-xl hover:shadow-2xl hover:border-gold/50',
    minimal: 'bg-white dark:bg-agar-dark border border-beige/40 dark:border-gold/10 shadow-sm hover:shadow-lg hover:border-gold/30',
    gradient: 'bg-gradient-to-br from-gold/10 via-white/90 to-beige/20 dark:from-gold/5 dark:via-agar-dark/90 dark:to-beige/10 border border-gold/20 shadow-lg hover:shadow-xl'
  };
  
  const paddings = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10'
  };
  
  const roundings = {
    sm: 'rounded-lg',
    md: 'rounded-xl',
    lg: 'rounded-2xl',
    xl: 'rounded-3xl',
    '2xl': 'rounded-2xl',
    '3xl': 'rounded-3xl'
  };
  
  const directions = {
    up: { y: 30 },
    down: { y: -30 },
    left: { x: -30 },
    right: { x: 30 }
  };
  
  const hoverEffects = hover ? {
    y: direction === 'up' || direction === 'down' ? -8 : 0,
    x: direction === 'left' || direction === 'right' ? -8 : 0,
    scale: 1.02
  } : {};
  
  const glowEffect = glowing ? 'glow' : '';
  const cursorStyle = clickable ? 'cursor-pointer' : '';
  
  const cardClasses = `
    ${variants[variant]} 
    ${paddings[padding]} 
    ${roundings[rounded]} 
    ${glowEffect} 
    ${cursorStyle}
    transition-all duration-300 
    ${className}
  `.trim();

  return (
    <motion.div
      initial={{ opacity: 0, ...directions[direction] }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
      whileHover={hoverEffects}
      className={cardClasses}
      onClick={clickable ? onClick : undefined}
    >
      {/* Decorative corner elements for luxury variant */}
      {variant === 'luxury' && (
        <>
          <div className="absolute top-3 left-3 w-4 h-4 border-l-2 border-t-2 border-gold/30 rounded-tl-lg" />
          <div className="absolute top-3 right-3 w-4 h-4 border-r-2 border-t-2 border-gold/30 rounded-tr-lg" />
          <div className="absolute bottom-3 left-3 w-4 h-4 border-l-2 border-b-2 border-gold/30 rounded-bl-lg" />
          <div className="absolute bottom-3 right-3 w-4 h-4 border-r-2 border-b-2 border-gold/30 rounded-br-lg" />
        </>
      )}
      
      {/* Shimmer effect overlay */}
      {hover && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -translate-x-full opacity-0"
          whileHover={{ x: '200%', opacity: 1 }}
          transition={{ duration: 0.8 }}
        />
      )}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
};

export default EnhancedCard;
