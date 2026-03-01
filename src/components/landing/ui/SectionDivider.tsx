'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface SectionDividerProps {
  className?: string;
  animated?: boolean;
}

const SectionDivider: React.FC<SectionDividerProps> = ({
  className = '',
  animated = true,
}) => {
  return (
    <div className={`flex items-center justify-center py-8 ${className}`}>
      <motion.div
        className="relative w-32 h-px bg-gradient-to-r from-transparent via-gold to-transparent"
        initial={animated ? { scaleX: 0, opacity: 0 } : {}}
        whileInView={animated ? { scaleX: 1, opacity: 1 } : {}}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        {animated && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/60 to-transparent"
            animate={{
              x: ['-100%', '100%'],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}
      </motion.div>
      <motion.div
        className="w-2 h-2 bg-gold rounded-full mx-4"
        initial={animated ? { scale: 0, opacity: 0 } : {}}
        whileInView={animated ? { scale: 1, opacity: 1 } : {}}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.4 }}
        animate={animated ? {
          scale: [1, 1.2, 1],
          opacity: [0.7, 1, 0.7],
        } : {}}
      >
        <motion.div
          className="w-full h-full bg-gold rounded-full"
          animate={animated ? {
            scale: [1, 1.2, 1],
            opacity: [0.7, 1, 0.7],
          } : {}}
          transition={animated ? {
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          } : {}}
        />
      </motion.div>
      <motion.div
        className="relative w-32 h-px bg-gradient-to-r from-gold via-transparent to-transparent"
        initial={animated ? { scaleX: 0, opacity: 0 } : {}}
        whileInView={animated ? { scaleX: 1, opacity: 1 } : {}}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      />
    </div>
  );
};

export default SectionDivider;
