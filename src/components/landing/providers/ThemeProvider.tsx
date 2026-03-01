'use client';

import React from 'react';
import { ThemeProvider as ThemeContextProvider } from '@/components/landing/contexts/ThemeContext';

interface ThemeProviderProps {
  children: React.ReactNode;
}

const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  return (
    <ThemeContextProvider>
      {children}
    </ThemeContextProvider>
  );
};

export default ThemeProvider;
