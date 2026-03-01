'use client';

import React from 'react';
import { ThemeProvider } from '@/components/landing/contexts/ThemeContext';
import ToastProvider from '@/components/landing/providers/ToastProvider';
import EnhancedHeader from '@/components/landing/sections/EnhancedHeader';
import EnhancedFooter from '@/components/landing/sections/EnhancedFooter';
import '@/components/landing/landing.css';

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <div className="agar-landing overflow-x-hidden">
          <EnhancedHeader />
          {children}
          <EnhancedFooter />
        </div>
      </ToastProvider>
    </ThemeProvider>
  );
}
