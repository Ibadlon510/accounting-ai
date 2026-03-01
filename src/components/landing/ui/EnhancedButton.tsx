'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Loader2 } from 'lucide-react';

interface EnhancedButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd' | 'onTransitionEnd'> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'luxury';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  showArrow?: boolean;
  glow?: boolean;
  glass?: boolean;
  fullWidth?: boolean;
  className?: string;
}

const EnhancedButton: React.FC<EnhancedButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  showArrow = false,
  glow = false,
  glass = false,
  fullWidth = false,
  className = '',
  disabled,
  onClick,
  type,
  form,
  id,
  name,
  value,
  ...otherProps
}) => {
  const baseClasses = "relative inline-flex items-center justify-center font-bold transition-all duration-500 focus:outline-none focus:ring-4 focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none overflow-hidden group transform-gpu";
  
  const variants = {
    primary: `
      bg-gradient-to-r from-gold via-gold/95 to-gold/90 
      hover:from-gold/95 hover:via-gold hover:to-gold/95
      text-agarwood 
      border-2 border-gold/40 hover:border-gold/70 
      focus:ring-gold/30 focus:border-gold/80
      shadow-lg hover:shadow-2xl hover:shadow-gold/25
      before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700
    `,
    secondary: `
      bg-gradient-to-r from-agarwood via-dark-brown to-agarwood/90 
      hover:from-agarwood/95 hover:via-dark-brown hover:to-agarwood
      text-white 
      border-2 border-agarwood/40 hover:border-agarwood/70 
      focus:ring-agarwood/30 focus:border-agarwood/80
      shadow-lg hover:shadow-2xl hover:shadow-agarwood/20
      before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/15 before:to-transparent before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700
    `,
    outline: `
      bg-transparent hover:bg-gradient-to-r hover:from-agarwood/5 hover:via-agarwood/10 hover:to-agarwood/5
      dark:hover:from-agarwood/10 dark:hover:via-agarwood/15 dark:hover:to-agarwood/10
      border-2 border-agarwood/60 hover:border-agarwood/90 
      text-agarwood hover:text-agarwood
      focus:ring-agarwood/20 focus:bg-agarwood/5
      shadow-md hover:shadow-lg hover:shadow-agarwood/10
      backdrop-blur-sm
      before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-agarwood/10 before:to-transparent before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-600
    `,
    ghost: `
      bg-transparent hover:bg-gradient-to-r hover:from-agarwood/8 hover:via-agarwood/12 hover:to-agarwood/8
      dark:hover:from-agarwood/10 dark:hover:via-agarwood/15 dark:hover:to-agarwood/10
      text-agarwood hover:text-agarwood/90
      focus:ring-agarwood/15 focus:bg-agarwood/8
      border-2 border-transparent hover:border-agarwood/20
      hover:shadow-md hover:shadow-agarwood/10
      backdrop-blur-sm
    `,
    luxury: `
      bg-gradient-to-r from-gold via-gold/98 to-gold/95
      hover:from-gold/98 hover:via-gold hover:to-gold/98
      text-agarwood 
      border-2 border-gold/50 hover:border-gold/80 
      focus:ring-gold/40 focus:border-gold/90
      shadow-xl hover:shadow-2xl hover:shadow-gold/30
      before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/25 before:to-transparent before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-800
      after:absolute after:inset-0 after:bg-gradient-to-r after:from-gold/0 after:via-gold/20 after:to-gold/0 after:opacity-0 hover:after:opacity-100 after:blur-md after:transition-opacity after:duration-500
    `
  };
  
  const sizes = {
    sm: "px-5 py-2.5 text-sm rounded-xl font-semibold tracking-wide",
    md: "px-7 py-3.5 text-base rounded-2xl font-bold tracking-wide",
    lg: "px-9 py-4.5 text-lg rounded-2xl font-bold tracking-wide",
    xl: "px-10 py-4 text-lg rounded-2xl font-bold tracking-wide"
  };
  
  const glassEffect = glass ? "backdrop-blur-sm bg-white/10 border-white/20" : "";
  const glowEffect = glow ? "shadow-lg hover:shadow-2xl" : "";
  const widthClass = fullWidth ? "w-full" : "";
  
  const buttonClasses = `${baseClasses} ${variants[variant]} ${sizes[size]} ${glassEffect} ${glowEffect} ${widthClass} ${className}`;
  
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!loading && !disabled && onClick) {
      onClick(e);
    }
  };

  return (
    <motion.button
      className={buttonClasses}
      onClick={handleClick}
      disabled={disabled || loading}
      whileHover={{ 
        scale: disabled || loading ? 1 : 1.02, 
        y: disabled || loading ? 0 : -2 
      }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      type={type}
      form={form}
      id={id}
      name={name}
      value={value}
      {...otherProps}
    >
      {/* Background shimmer effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full"
        whileHover={{ x: '200%' }}
        transition={{ duration: 0.6 }}
      />
      
      {/* Glow effect for luxury variant */}
      {variant === 'luxury' && (
        <motion.div
          className="absolute inset-0 rounded-2xl bg-gradient-to-r from-gold/0 to-gold/30 opacity-0 group-hover:opacity-100 blur-md"
          transition={{ duration: 0.3 }}
        />
      )}
      
      {/* Button content */}
      <span className="relative z-10 flex items-center justify-center space-x-2">
        {loading ? (
          <Loader2 size={size === 'sm' ? 16 : size === 'md' ? 18 : size === 'lg' ? 20 : 22} className="animate-spin" />
        ) : (
          <>
            {icon && iconPosition === 'left' && <span className="flex-shrink-0">{icon}</span>}
            <span className="tracking-wide">{children}</span>
            {icon && iconPosition === 'right' && <span className="flex-shrink-0">{icon}</span>}
            {showArrow && (
              <ArrowRight 
                size={size === 'sm' ? 16 : size === 'md' ? 18 : size === 'lg' ? 20 : 22} 
                className="group-hover:translate-x-1 group-hover:scale-110 transition-all duration-300" 
              />
            )}
          </>
        )}
      </span>
    </motion.button>
  );
};

export default EnhancedButton;
