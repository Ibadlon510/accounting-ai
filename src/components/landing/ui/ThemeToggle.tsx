'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/components/landing/contexts/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.button
      onClick={toggleTheme}
      className="relative p-2 rounded-full bg-beige/20 hover:bg-beige/40 dark:bg-agar-dark-surface/40 dark:hover:bg-agar-dark-surface/60 border border-transparent dark:border-gold/20 transition-colors duration-300 touch-target"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <motion.div
        className="relative w-6 h-6"
        initial={false}
        animate={{ rotate: theme === 'dark' ? 180 : 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        {theme === 'light' ? (
          <Sun className="w-6 h-6 text-agarwood" />
        ) : (
          <Moon className="w-6 h-6 text-gold" />
        )}
      </motion.div>
    </motion.button>
  );
};

export default ThemeToggle;
