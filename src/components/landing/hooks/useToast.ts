'use client';

import { useState, useCallback } from 'react';
import { ToastProps } from '@/components/landing/ui/Toast';

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const addToast = useCallback((
    type: ToastProps['type'],
    title: string,
    message?: string,
    duration?: number
  ) => {
    const id = Math.random().toString(36).substr(2, 9);
    
    const newToast: ToastProps = {
      id,
      type,
      title,
      message,
      duration,
      onClose: removeToast
    };

    setToasts(prev => [...prev, newToast]);
    
    return id;
  }, [removeToast]);

  const removeAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Convenience methods
  const success = useCallback((title: string, message?: string) => 
    addToast('success', title, message), [addToast]);
    
  const error = useCallback((title: string, message?: string) => 
    addToast('error', title, message), [addToast]);
    
  const info = useCallback((title: string, message?: string) => 
    addToast('info', title, message), [addToast]);
    
  const premium = useCallback((title: string, message?: string) => 
    addToast('premium', title, message, 6000), [addToast]);

  return {
    toasts,
    addToast,
    removeToast,
    removeAllToasts,
    success,
    error,
    info,
    premium
  };
};

export default useToast;