'use client';

import { useEffect, useState } from 'react';

// Hook for detecting mobile devices and touch capabilities
export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(
        'ontouchstart' in window || 
        window.navigator.maxTouchPoints > 0 || 
        window.innerWidth < 768
      );
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return isMobile;
};

// Hook for viewport detection
export const useViewportSize = () => {
  const [viewport, setViewport] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return viewport;
};

// Enhanced touch interaction utilities
export const touchOptimizedProps = {
  // Better touch targets (minimum 44px)
  touchTarget: "min-h-[44px] min-w-[44px]",
  
  // Enhanced touch feedback
  touchFeedback: "active:scale-95 transition-transform duration-100",
  
  // Improved scrolling on mobile
  smoothScroll: "scroll-smooth overscroll-behavior-y-contain",
  
  // Better form inputs on mobile
  mobileInput: "text-base" // Prevents zoom on iOS
};

const MobileOptimizations = { useIsMobile, useViewportSize, touchOptimizedProps };

export default MobileOptimizations;
