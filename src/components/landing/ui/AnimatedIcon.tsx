'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface AnimatedIconProps {
  icon: LucideIcon;
  size?: number;
  variant?: 'default' | 'luxury' | 'minimal';
  animate?: 'none' | 'pulse' | 'bounce' | 'spin' | 'float';
  background?: boolean;
  className?: string;
}

const AnimatedIcon: React.FC<AnimatedIconProps> = ({
  icon: Icon,
  size = 20,
  variant = 'default',
  animate = 'none',
  background = false,
  className = '',
}) => {
  const animations = {
    none: {},
    pulse: {
      scale: [1, 1.1, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: [0.4, 0, 0.6, 1] as const
      }
    },
    bounce: {
      y: [0, -10, 0],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: [0.4, 0, 0.6, 1] as const
      }
    },
    spin: {
      rotate: 360,
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: [0, 0, 1, 1] as const
      }
    },
    float: {
      y: [0, -5, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: [0.4, 0, 0.6, 1] as const
      }
    }
  };

  const variants = {
    default: 'text-agarwood dark:text-beige',
    luxury: 'text-gold',
    minimal: 'text-agarwood/60 dark:text-beige/60'
  };

  const backgroundStyles = background ? {
    luxury: 'w-10 h-10 bg-gold/20 rounded-full flex items-center justify-center',
    default: 'w-10 h-10 bg-agarwood/10 dark:bg-beige/10 rounded-full flex items-center justify-center',
    minimal: 'w-8 h-8 bg-agarwood/5 dark:bg-beige/5 rounded-full flex items-center justify-center'
  } : {};

  if (background) {
    return (
      <motion.div
        className={`${backgroundStyles[variant]} ${className}`}
        animate={animations[animate]}
        whileHover={{ scale: 1.1 }}
        transition={{ duration: 0.2 }}
      >
        <Icon size={size} className={variants[variant]} />
      </motion.div>
    );
  }

  return (
    <motion.div
      className={`${variants[variant]} ${className}`}
      animate={animations[animate]}
      whileHover={{ scale: 1.1 }}
      transition={{ duration: 0.2 }}
    >
      <Icon size={size} />
    </motion.div>
  );
};

export default AnimatedIcon;
