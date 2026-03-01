'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';

interface EnhancedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  success?: boolean;
  icon?: React.ReactNode;
  showPasswordToggle?: boolean;
}

const EnhancedInput: React.FC<EnhancedInputProps> = ({
  label,
  error,
  success,
  icon,
  showPasswordToggle,
  type = 'text',
  className = '',
  ...props
}) => {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [hasValue, setHasValue] = useState(!!props.value || !!props.defaultValue);

  const inputType = showPasswordToggle && type === 'password' 
    ? (showPassword ? 'text' : 'password') 
    : type;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasValue(e.target.value.length > 0);
    props.onChange?.(e);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Floating Label */}
      <motion.label
        className={`absolute left-4 transition-all duration-300 pointer-events-none ${
          focused || hasValue
            ? 'top-2 text-xs text-gold font-medium'
            : 'top-1/2 -translate-y-1/2 text-agarwood/60'
        }`}
        animate={{
          y: focused || hasValue ? -12 : 0,
          scale: focused || hasValue ? 0.85 : 1,
        }}
        transition={{ duration: 0.2 }}
      >
        {label}
      </motion.label>

      <div className="relative">
        {/* Icon */}
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-agarwood/40">
            {icon}
          </div>
        )}

        {/* Input */}
        <input
          {...props}
          type={inputType}
          className={`
            w-full h-14 px-4 ${icon ? 'pl-12' : ''} ${showPasswordToggle ? 'pr-12' : ''} 
            border-2 rounded-xl transition-all duration-300 bg-white/80 backdrop-blur-sm
            ${error 
              ? 'border-red-300 focus:border-red-500' 
              : success 
                ? 'border-green-300 focus:border-green-500'
                : 'border-gold/20 focus:border-gold hover:border-gold/40'
            }
            focus:outline-none focus:ring-4 ${error 
              ? 'focus:ring-red-500/20' 
              : success 
                ? 'focus:ring-green-500/20'
                : 'focus:ring-gold/20'
            }
            placeholder-transparent
          `}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={handleInputChange}
        />

        {/* Password Toggle */}
        {showPasswordToggle && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-agarwood/60 hover:text-agarwood transition-colors"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        )}

        {/* Status Icons */}
        {(error || success) && !showPasswordToggle && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            {error && <AlertCircle size={20} className="text-red-500" />}
            {success && <CheckCircle2 size={20} className="text-green-500" />}
          </div>
        )}
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-red-500 text-sm mt-2 flex items-center space-x-2"
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </motion.p>
        )}
      </AnimatePresence>

      {/* Success Message */}
      <AnimatePresence>
        {success && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-green-500 text-sm mt-2 flex items-center space-x-2"
          >
            <CheckCircle2 size={16} />
            <span>Looks good!</span>
          </motion.p>
        )}
      </AnimatePresence>

      {/* Focus Ring Animation */}
      {focused && (
        <motion.div
          className="absolute inset-0 rounded-xl border-2 border-gold pointer-events-none"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
        />
      )}
    </div>
  );
};

export default EnhancedInput;
