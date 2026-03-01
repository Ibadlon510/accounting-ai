'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X, Zap } from 'lucide-react';

export interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'info' | 'premium';
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  duration = 4000,
  onClose
}) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => onClose(id), duration);
      return () => clearTimeout(timer);
    }
  }, [duration, id, onClose]);

  const icons = {
    success: CheckCircle2,
    error: AlertCircle,
    info: Info,
    premium: Zap
  };

  const colors = {
    success: {
      bg: 'bg-green-50 border-green-200',
      text: 'text-green-800',
      icon: 'text-green-600'
    },
    error: {
      bg: 'bg-red-50 border-red-200',
      text: 'text-red-800',
      icon: 'text-red-600'
    },
    info: {
      bg: 'bg-blue-50 border-blue-200',
      text: 'text-blue-800',
      icon: 'text-blue-600'
    },
    premium: {
      bg: 'bg-gradient-to-r from-gold/10 to-agarwood/10 border-gold/30',
      text: 'text-agarwood',
      icon: 'text-gold'
    }
  };

  const Icon = icons[type];
  const colorScheme = colors[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: -100, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -100, scale: 0.95 }}
      className={`${colorScheme.bg} border rounded-xl shadow-lg p-4 min-w-80 max-w-md backdrop-blur-sm`}
      whileHover={{ scale: 1.02 }}
      layout
    >
      <div className="flex items-start space-x-3">
        <div className={`flex-shrink-0 ${colorScheme.icon}`}>
          <Icon size={20} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className={`font-semibold ${colorScheme.text}`}>
            {title}
          </div>
          {message && (
            <div className={`text-sm mt-1 ${colorScheme.text} opacity-80`}>
              {message}
            </div>
          )}
        </div>

        <button
          onClick={() => onClose(id)}
          className={`flex-shrink-0 ${colorScheme.text} opacity-60 hover:opacity-100 transition-opacity`}
        >
          <X size={16} />
        </button>
      </div>
    </motion.div>
  );
};

// Toast Container Component
export const ToastContainer: React.FC<{ toasts: ToastProps[]; onClose: (id: string) => void }> = ({
  toasts,
  onClose
}) => {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col space-y-3">
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} onClose={onClose} />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default Toast;
