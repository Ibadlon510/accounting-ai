"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface FileAwayProps {
  show: boolean;
  children: React.ReactNode;
  onComplete?: () => void;
}

export function FileAwayAnimation({ show, children, onComplete }: FileAwayProps) {
  return (
    <AnimatePresence mode="wait" onExitComplete={onComplete}>
      {show && (
        <motion.div
          initial={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -40, scale: 0.95, filter: "blur(4px)" }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface ShakeButtonProps {
  shake: boolean;
  children: React.ReactNode;
  className?: string;
}

export function ShakeWrapper({ shake, children, className }: ShakeButtonProps) {
  return (
    <motion.div
      animate={shake ? { x: [0, -6, 6, -4, 4, -2, 2, 0] } : { x: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}

interface FadeInProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function FadeIn({ children, className, delay = 0 }: FadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
