'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Menu, X, Phone, Mail, ChevronDown, LogIn, LayoutDashboard } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import EnhancedButton from '@/components/landing/ui/EnhancedButton';
import AnimatedIcon from '@/components/landing/ui/AnimatedIcon';
import ThemeToggle from '@/components/landing/ui/ThemeToggle';

const EnhancedHeader = () => {
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolledMenuOpen, setIsScrolledMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [scrollState, setScrollState] = useState({
    isScrolled: false,
    isDeepScrolled: false,
    isBackToHero: true
  });
  const { scrollY } = useScroll();
  
  // Enhanced transform values for dynamic header behavior
  const headerY = useTransform(scrollY, [0, 100], [0, -10]);
  const headerOpacity = useTransform(scrollY, [0, 50], [1, 0.98]);
  const headerScale = useTransform(scrollY, [0, 100], [1, 0.98]);
  const headerBlur = useTransform(scrollY, [0, 50], [0, 20]);

  // Reactive scroll detection
  useEffect(() => {
    const unsubscribe = scrollY.on('change', (latest) => {
      setScrollState({
        isScrolled: latest > 100,
        isDeepScrolled: latest > 200,
        isBackToHero: latest < 50
      });
    });
    return unsubscribe;
  }, [scrollY]);

  const { isScrolled, isDeepScrolled, isBackToHero } = scrollState;

  // Navigation items
  const navigation = useMemo(() => [
    { id: 'about', label: 'About', href: '#about' },
    { id: 'services', label: 'Services', href: '#services' },
    { id: 'why-choose-us', label: 'Why Us', href: '#why-choose-us' },
    { id: 'pricing', label: 'Pricing', href: '#pricing' },
    { id: 'tools', label: 'Apps', href: '/landing' },
    { id: 'blog', label: 'Blog', href: '/blog' },
    { id: 'contact', label: 'Contact', href: '#contact' }
  ], []);

  // Contact information
  const contactInfo = {
    phone: '+971 50 123 4567',
    email: 'admin@agaraccounting.com'
  };

  // Enhanced navigation handler
  const navigateToSection = useCallback((href: string) => {
    setIsMenuOpen(false);
    
    if (href.startsWith('#')) {
      if (pathname !== '/') {
        // On a sub-page — navigate to landing page with anchor
        router.push('/' + href);
        return;
      }
      // On landing page — smooth scroll
      const element = document.querySelector(href);
      if (element) {
        const headerHeight = 120;
        const elementPosition = element.getBoundingClientRect().top + window.scrollY;
        const offsetPosition = elementPosition - headerHeight;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    } else {
      // Handle page links via Next.js router
      router.push(href);
    }
  }, [router, pathname]);

  // Enhanced active section tracking (only for anchor links)
  useEffect(() => {
    const handleScroll = () => {
      // Only track sections that are anchor links (start with #)
      const anchorNavigation = navigation.filter(nav => nav.href.startsWith('#'));
      const sections = anchorNavigation.map(nav => document.querySelector(nav.href) as HTMLElement);
      const scrollPosition = window.scrollY + 200;

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(anchorNavigation[i].id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [navigation]);

  // Enhanced mobile menu handling
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
        setIsScrolledMenuOpen(false);
      }
    };
    
    if (isMenuOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    if (isScrolledMenuOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      if (!isScrolledMenuOpen) {
        document.body.style.overflow = 'unset';
      }
    };
  }, [isMenuOpen, isScrolledMenuOpen]);

  // Close scrolled menu when back to hero section
  useEffect(() => {
    if (isBackToHero && isScrolledMenuOpen) {
      setIsScrolledMenuOpen(false);
    }
  }, [isBackToHero, isScrolledMenuOpen]);

  return (
    <>
      {/* Enhanced Main Header */}
      <motion.header
        style={{ 
          y: headerY, 
          opacity: headerOpacity, 
          scale: headerScale,
          backdropFilter: `blur(${headerBlur.get()}px)`
        }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ease-out ${
          isDeepScrolled && !isBackToHero
            ? 'bg-transparent'
            : isScrolled
            ? 'bg-white/95 dark:bg-agar-dark/95 backdrop-blur-2xl shadow-2xl border-b border-gold/20'
            : 'bg-gradient-to-b from-white/10 via-white/5 to-transparent'
        }`}
      >
        <div className="luxury-container">
          <div className={`flex items-center justify-between transition-all duration-500 ${
            isDeepScrolled && !isBackToHero ? 'h-0 overflow-hidden' : isScrolled ? 'h-20 lg:h-24' : 'h-24 lg:h-28'
          }`}>
            
            {/* Enhanced Premium Logo */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="flex-shrink-0"
            >
              <button
                onClick={() => navigateToSection('#home')}
                className="flex items-center space-x-4 group focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 rounded-xl p-3 -m-3 hover:bg-white/10 transition-all duration-300"
                aria-label="AgarWood Accounting - Go to home"
              >
                {/* Logo Icon — Mini Circles/Orbits */}
                <motion.div 
                  className={`relative transition-all duration-500 ${
                    isScrolled 
                      ? 'w-10 h-10 lg:w-11 lg:h-11' 
                      : 'w-12 h-12 lg:w-13 lg:h-13'
                  }`}
                  whileHover={{ scale: 1.08 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Outer ring */}
                  <motion.div
                    className="absolute inset-0 rounded-full bg-gradient-to-br from-gold/25 via-white/20 to-agarwood/15 border border-gold/40 shadow-md group-hover:shadow-lg"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
                  />
                  {/* Inner circle with brand mark */}
                  <div className="absolute inset-[6px] rounded-full bg-gradient-to-br from-white/60 via-beige/40 to-white/60 dark:from-white/10 dark:via-beige/20 dark:to-white/10 border border-white/60 dark:border-white/15 flex items-center justify-center">
                    <motion.div
                      className={`rounded-full bg-gradient-to-br from-agarwood via-dark-brown to-agarwood flex items-center justify-center border-2 border-gold/20 ${
                        isScrolled ? 'w-5 h-5' : 'w-6 h-6'
                      } transition-all duration-500`}
                      animate={{ rotate: -360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                    >
                      <div className={`border border-gold rounded-sm transform rotate-45 ${
                        isScrolled ? 'w-2 h-2' : 'w-2.5 h-2.5'
                      } transition-all duration-500`} />
                    </motion.div>
                  </div>
                  {/* Orbiting dots */}
                  {[0, 120, 240].map((angle, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-1.5 h-1.5 bg-gold rounded-full shadow-sm"
                      style={{
                        left: '50%',
                        top: '50%',
                        marginLeft: '-3px',
                        marginTop: '-3px',
                        transformOrigin: '3px -18px',
                      }}
                      animate={{ rotate: [angle, angle + 360] }}
                      transition={{ duration: 10, repeat: Infinity, ease: 'linear', delay: i * 0.5 }}
                    />
                  ))}
                </motion.div>

                {/* Brand Text */}
                <div className="flex flex-col leading-none">
                  <motion.h1 
                    className={`font-serif font-bold tracking-tight transition-all duration-500 ${
                      isScrolled ? 'text-base lg:text-lg' : 'text-lg lg:text-xl'
                    }`}
                    style={{
                      background: 'linear-gradient(135deg, var(--color-agarwood) 0%, var(--color-gold) 50%, var(--color-agarwood) 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      backgroundSize: '200% 200%',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundPosition = '100% 0%'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundPosition = '0% 0%'; }}
                  >
                    AgarWood
                  </motion.h1>
                  <span className={`font-medium text-gold tracking-widest uppercase transition-all duration-500 ${
                    isScrolled ? 'text-[10px]' : 'text-xs'
                  }`}>
                    Accounting & Tax
                  </span>
                </div>
              </button>
            </motion.div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1">
              {navigation.map((item, index) => (
                <motion.button
                  key={item.id}
                  onClick={() => navigateToSection(item.href)}
                  className={`relative px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 ${
                    activeSection === item.id
                      ? 'text-agarwood bg-gold/15 dark:bg-gold/20'
                      : 'text-agarwood/70 hover:text-agarwood dark:hover:text-beige hover:bg-gold/8'
                  }`}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.06 }}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <span className="relative z-10">{item.label}</span>
                  
                  {/* Active underline */}
                  {activeSection === item.id && (
                    <motion.div
                      className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-gold rounded-full"
                      initial={{ opacity: 0, scaleX: 0 }}
                      animate={{ opacity: 1, scaleX: 1 }}
                      layoutId="activeIndicator"
                    />
                  )}
                </motion.button>
              ))}
            </nav>

            {/* Desktop CTA */}
            <div className="hidden lg:flex items-center space-x-3">
              <ThemeToggle />

              {isAuthenticated ? (
                <Link href="/dashboard">
                  <EnhancedButton
                    variant="luxury"
                    size="sm"
                    icon={<LayoutDashboard size={16} />}
                    iconPosition="left"
                  >
                    Dashboard
                  </EnhancedButton>
                </Link>
              ) : (
                <Link href="/login">
                  <EnhancedButton variant="outline" size="sm" icon={<LogIn size={14} />} iconPosition="left">
                    Sign In
                  </EnhancedButton>
                </Link>
              )}
            </div>

            {/* Enhanced Mobile Menu Toggle */}
            <motion.button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden relative p-3 rounded-xl text-agarwood hover:text-gold hover:bg-gold/10 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 group border-2 border-transparent hover:border-gold/20"
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
              aria-label="Toggle navigation menu"
            >
              <AnimatePresence mode="wait">
                {isMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X size={24} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu size={24} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Scrolled Logo Icon */}
      <AnimatePresence>
        {isDeepScrolled && (
          <motion.div
            initial={{ 
              opacity: 0, 
              scale: 0.8, 
              rotate: -1440, // Start with 4 full rotations
              x: -1000,      // Start further left for longer journey
              y: 40          // Start lower for more dramatic arc
            }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              rotate: isBackToHero ? -2160 : 0, // 6 rotations when going back
              x: isBackToHero ? -1000 : 0,
              y: isBackToHero ? 40 : 0
            }}
            exit={{ 
              opacity: 0, 
              scale: 0.6, 
              rotate: isBackToHero ? -2880 : 1440, // 8 rotations for exit
              x: isBackToHero ? -1200 : 200,
              y: isBackToHero ? 60 : -30
            }}
            transition={{ 
              duration: isBackToHero ? 1.8 : 1.5, // Longer duration for more visible rolling
              ease: isBackToHero ? "easeInOut" : "easeOut",
              rotate: { 
                duration: isBackToHero ? 2.2 : 1.8, // Even longer for rotation
                ease: "linear" // Linear for consistent rolling speed
              },
              x: {
                duration: isBackToHero ? 1.8 : 1.5,
                ease: "easeInOut"
              },
              y: {
                duration: isBackToHero ? 1.8 : 1.5,
                ease: "easeInOut"
              }
            }}
            className="fixed top-8 right-8 z-50"
            style={{
              // Add motion blur effect during animation
              filter: isBackToHero || scrollState.isDeepScrolled ? "blur(0px)" : "blur(1px)",
            }}
          >
            {/* Rolling trail effect */}
            <motion.div
              className="absolute inset-0 rounded-2xl bg-gradient-to-r from-gold/20 via-gold/10 to-transparent"
              animate={{
                opacity: isBackToHero ? [0, 0.8, 0] : [0, 0.3, 0],
                scale: isBackToHero ? [1, 1.5, 2] : [1, 1.2, 1.5],
                x: isBackToHero ? [-20, -40, -60] : [-5, -10, -15],
              }}
              transition={{
                duration: isBackToHero ? 2.2 : 1.8,
                ease: "easeOut",
                times: [0, 0.5, 1]
              }}
            />
            <motion.button
              onClick={() => setIsScrolledMenuOpen(!isScrolledMenuOpen)}
              className="w-14 h-14 bg-gradient-to-br from-agarwood via-dark-brown to-agarwood rounded-2xl shadow-2xl border-2 border-gold/30 hover:border-gold/60 flex items-center justify-center group transition-all duration-300 hover:shadow-gold/25"
              whileHover={{ 
                scale: 1.1,
                rotate: 5,
                boxShadow: '0 20px 40px rgba(198, 166, 100, 0.3)'
              }}
              whileTap={{ scale: 0.95 }}
              aria-label="Open navigation menu"
            >
              <motion.div 
                className="w-7 h-7 border-3 border-gold rounded-lg transform rotate-45 shadow-inner relative overflow-hidden"
                whileHover={{ rotate: 50, scale: 1.1 }}
                animate={{
                  rotate: isBackToHero ? [45, 405, 765] : [45, 45, 45], // Additional inner rotation for more visible rolling
                }}
                transition={{
                  duration: isBackToHero ? 2.2 : 0.3,
                  ease: isBackToHero ? "linear" : "easeOut"
                }}
              >
                {/* Add rolling indicator lines */}
                <motion.div
                  className="absolute inset-0 border-l-2 border-gold/60"
                  animate={{
                    rotate: isBackToHero ? [0, 720, 1440] : [0, 0, 0],
                  }}
                  transition={{
                    duration: isBackToHero ? 2.2 : 1.8,
                    ease: "linear"
                  }}
                />
                <motion.div
                  className="absolute inset-0 border-r-2 border-gold/40"
                  animate={{
                    rotate: isBackToHero ? [0, -720, -1440] : [0, 0, 0],
                  }}
                  transition={{
                    duration: isBackToHero ? 2.2 : 1.8,
                    ease: "linear"
                  }}
                />
              </motion.div>
              
              {/* Glow effect */}
              <motion.div
                className="absolute -inset-1 bg-gradient-to-r from-gold/0 via-gold/20 to-gold/0 rounded-2xl opacity-0 group-hover:opacity-100 blur-md"
                transition={{ duration: 0.3 }}
              />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Elegant Expandable FAB Menu */}
      <AnimatePresence>
        {isScrolledMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 pointer-events-none"
          >
            {/* Very subtle backdrop that doesn't block scrolling */}
            <motion.div
              className="absolute inset-0 bg-black/5"
              onClick={() => setIsScrolledMenuOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ pointerEvents: 'auto' }}
            />

            {/* Expandable Menu Items */}
            <div className="fixed top-24 right-8 flex flex-col-reverse items-end space-y-reverse space-y-4 pointer-events-auto">
              
              {/* Navigation Items */}
              {navigation.map((item, index) => (
                <motion.button
                  key={item.id}
                  onClick={() => {
                    navigateToSection(item.href);
                    setIsScrolledMenuOpen(false);
                  }}
                  className={`group flex items-center space-x-3 px-5 py-3 rounded-xl shadow-md border backdrop-blur-2xl transition-all duration-300 ${
                    activeSection === item.id
                      ? 'bg-gold/15 dark:bg-gold/20 border-gold/40 text-agarwood'
                      : 'bg-white/90 dark:bg-agar-dark-surface/90 border-white/20 dark:border-gold/10 text-agarwood hover:border-gold/30 hover:bg-gold/5'
                  }`}
                  initial={{ opacity: 0, scale: 0.5, x: 80 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.5, x: 80 }}
                  transition={{ 
                    duration: 0.3, 
                    delay: index * 0.04,
                    type: "spring",
                    stiffness: 250,
                    damping: 22
                  }}
                  whileHover={{ scale: 1.03, x: -4 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <span className="text-sm font-semibold whitespace-nowrap">{item.label}</span>
                  {activeSection === item.id && (
                    <motion.div
                      className="w-1.5 h-1.5 rounded-full bg-gold"
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* Enhanced Premium Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            {/* Enhanced Backdrop */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-agarwood/90 via-dark-brown/80 to-agarwood/90 backdrop-blur-2xl"
              onClick={() => setIsMenuOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Enhanced Mobile Menu Panel */}
            <motion.div
              initial={{ x: '100%', scale: 0.95 }}
              animate={{ x: 0, scale: 1 }}
              exit={{ x: '100%', scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 h-full w-full max-w-sm bg-gradient-to-b from-white/98 via-white/95 to-beige/90 dark:from-agar-dark/98 dark:via-agar-dark/95 dark:to-agar-dark-surface/90 backdrop-blur-2xl shadow-2xl border-l-2 border-gold/30"
            >
              <div className="flex flex-col h-full">
                
                {/* Enhanced Menu Header */}
                <div className="flex items-center justify-between p-6 border-b-2 border-gold/20 bg-gradient-to-r from-beige/40 to-gold/20 dark:from-agar-dark-surface/40 dark:to-gold/10">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-agarwood via-dark-brown to-agarwood rounded-xl flex items-center justify-center shadow-lg border-2 border-gold/30">
                      <div className="w-6 h-6 border-2 border-gold rounded-md transform rotate-45" />
                    </div>
                    <div style={{ lineHeight: 1, gap: 0 }}>
                      <h2 className="text-lg font-serif font-bold text-agarwood" style={{ lineHeight: 1, margin: 0, padding: 0 }}>AgarWood</h2>
                      <p className="text-sm text-gold font-semibold" style={{ lineHeight: 1, margin: 0, padding: 0, marginTop: '-0.1em' }}>Accounting & Tax</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <ThemeToggle />
                    <button
                      onClick={() => setIsMenuOpen(false)}
                      className="p-2 rounded-lg hover:bg-gold/10 transition-colors duration-200 border border-transparent hover:border-gold/20"
                      aria-label="Close menu"
                    >
                      <X size={20} className="text-agarwood" />
                    </button>
                  </div>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 p-6 space-y-1.5">
                  {navigation.map((item, index) => (
                    <motion.button
                      key={item.id}
                      onClick={() => navigateToSection(item.href)}
                      className={`w-full text-left px-4 py-3.5 rounded-xl transition-all duration-300 group relative overflow-hidden ${
                        activeSection === item.id
                          ? 'bg-gold/15 text-agarwood'
                          : 'text-agarwood/80 hover:bg-gold/8 hover:text-agarwood'
                      }`}
                      initial={{ opacity: 0, x: 40 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.06 }}
                      whileHover={{ x: 6 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-base font-semibold">{item.label}</span>
                        <ChevronDown className="transform -rotate-90 text-agarwood/30 group-hover:text-gold/60 transition-colors" size={16} />
                      </div>
                      
                      {activeSection === item.id && (
                        <motion.div
                          className="absolute left-1 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-gold rounded-full"
                          initial={{ opacity: 0, scaleY: 0 }}
                          animate={{ opacity: 1, scaleY: 1 }}
                          layoutId="mobileActiveIndicator"
                        />
                      )}
                    </motion.button>
                  ))}
                </nav>

                {/* Enhanced Contact Information */}
                <div className="p-6 bg-gradient-to-r from-beige/60 to-gold/20 dark:from-agar-dark-surface/60 dark:to-gold/10 border-t-2 border-gold/20">
                  <div className="space-y-4 mb-6">
                    <a
                      href={`tel:${contactInfo.phone}`}
                      className="flex items-center space-x-3 p-4 rounded-xl hover:bg-white/50 dark:hover:bg-agar-dark-surface/50 transition-colors duration-200 group border border-transparent hover:border-gold/20"
                    >
                      <AnimatedIcon
                        icon={Phone}
                        size={20}
                        variant="luxury"
                        animate="pulse"
                        background
                      />
                      <div>
                        <p className="text-sm text-agarwood/70">Call us</p>
                        <p className="font-semibold text-agarwood group-hover:text-gold transition-colors duration-200">
                          {contactInfo.phone}
                        </p>
                      </div>
                    </a>

                    <a
                      href={`mailto:${contactInfo.email}`}
                      className="flex items-center space-x-3 p-4 rounded-xl hover:bg-white/50 dark:hover:bg-agar-dark-surface/50 transition-colors duration-200 group border border-transparent hover:border-gold/20"
                    >
                      <AnimatedIcon
                        icon={Mail}
                        size={20}
                        variant="luxury"
                        animate="pulse"
                        background
                      />
                      <div>
                        <p className="text-sm text-agarwood/70">Email us</p>
                        <p className="font-semibold text-agarwood group-hover:text-gold transition-colors duration-200">
                          {contactInfo.email}
                        </p>
                      </div>
                    </a>
                  </div>

                  {/* Mobile Auth / CTA Buttons */}
                  {isAuthenticated ? (
                    <Link href="/dashboard" className="block w-full">
                      <EnhancedButton
                        variant="luxury"
                        size="lg"
                        icon={<LayoutDashboard size={20} />}
                        iconPosition="left"
                        fullWidth
                        className="shadow-lg hover:shadow-2xl"
                      >
                        My Dashboard
                      </EnhancedButton>
                    </Link>
                  ) : (
                    <Link href="/login" className="block w-full">
                      <EnhancedButton
                        variant="luxury"
                        size="lg"
                        icon={<LogIn size={18} />}
                        iconPosition="left"
                        fullWidth
                        className="shadow-lg hover:shadow-2xl"
                      >
                        Sign In
                      </EnhancedButton>
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default EnhancedHeader;
