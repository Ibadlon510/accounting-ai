'use client';

import React from 'react';
import ParallaxBackground from './ParallaxBackground';

interface SectionProps {
  id?: string;
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'gradient' | 'dark' | 'luxury' | 'minimal';
  padding?: 'sm' | 'md' | 'lg' | 'xl' | 'none';
  background?: 'white' | 'beige' | 'gradient' | 'transparent';
  parallax?: {
    variant: 'balance-sheet' | 'income-statement' | 'cash-flow' | 'ledger' | 'tax-forms' | 'audit-papers';
    intensity?: number;
  };
  containerSize?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  centered?: boolean;
  overflow?: 'visible' | 'hidden';
}

const Section: React.FC<SectionProps> = ({
  id,
  children,
  className = '',
  variant = 'default',
  padding = 'lg',
  background = 'white',
  parallax,
  containerSize = 'xl',
  centered = true,
  overflow = 'hidden',
}) => {
  const variants = {
    default: 'relative',
    gradient: 'relative bg-gradient-to-br from-white via-beige/30 to-white dark:from-agar-dark dark:via-beige/30 dark:to-agar-dark',
    dark: 'relative agar-dark-section bg-gradient-to-br from-agarwood via-dark-brown to-agarwood text-white',
    luxury: 'relative bg-gradient-to-br from-beige via-white to-beige wood-texture dark:via-agar-dark',
    minimal: 'relative bg-white dark:bg-agar-dark'
  };
  
  const paddings = {
    none: '',
    sm: 'py-12 md:py-16',
    md: 'py-16 md:py-20',
    lg: 'py-20 md:py-24 lg:py-28',
    xl: 'py-20 md:py-24 lg:py-28'
  };
  
  const backgrounds = {
    white: 'bg-white dark:bg-agar-dark',
    beige: 'bg-beige/30',
    gradient: 'bg-gradient-to-br from-white via-beige/30 to-white dark:from-agar-dark dark:via-beige/30 dark:to-agar-dark',
    transparent: 'bg-transparent'
  };
  
  const containerSizes = {
    sm: 'max-w-4xl',
    md: 'max-w-6xl',
    lg: 'max-w-7xl',
    xl: 'luxury-container',
    full: 'w-full'
  };
  
  const overflowClass = overflow === 'hidden' ? 'overflow-hidden' : 'overflow-visible';
  const centeringClass = centered ? 'mx-auto' : '';
  
  const sectionClasses = `
    ${variants[variant]} 
    ${variant === 'default' ? backgrounds[background] : ''} 
    ${paddings[padding]} 
    ${overflowClass} 
    ${className}
  `.trim();

  return (
    <section id={id} className={sectionClasses}>
      {/* Parallax Background */}
      {parallax && (
        <ParallaxBackground 
          variant={parallax.variant} 
          intensity={parallax.intensity || 0.5}
        />
      )}
      
      {/* Content Container */}
      <div className={`relative z-10 ${containerSizes[containerSize]} ${centeringClass} px-6 sm:px-8 lg:px-12`}>
        {children}
      </div>
    </section>
  );
};

export default Section;
