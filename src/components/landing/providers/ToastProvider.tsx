'use client';

import React from 'react';
import { ToastContainer } from '@/components/landing/ui/Toast';
import { useToast } from '@/components/landing/hooks/useToast';

// Create Toast Context
export const ToastContext = React.createContext<{
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  premium: (title: string, message?: string) => void;
} | null>(null);

// Toast Provider Component
const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toasts, success, error, info, premium, removeToast } = useToast();

  return (
    <ToastContext.Provider value={{ success, error, info, premium }}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  );
};

// Custom hook to use toast
export const useToastContext = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  return context;
};

export default ToastProvider;
