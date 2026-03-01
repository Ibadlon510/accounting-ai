'use client';

import React from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';

const ScrollProgress = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <>
      {/* Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-gold via-gold/80 to-gold transform-gpu z-50"
        style={{ scaleX, transformOrigin: '0%' }}
      />
      
      {/* Subtle glow effect */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-gold/50 via-gold/30 to-gold/50 blur-sm transform-gpu z-40"
        style={{ scaleX, transformOrigin: '0%' }}
      />
    </>
  );
};

export default ScrollProgress;
