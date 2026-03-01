'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Clock, ArrowRight, BookOpen, Calendar, Eye, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import Section from '@/components/landing/ui/Section';
import SectionHeader from '@/components/landing/ui/SectionHeader';
import EnhancedCard from '@/components/landing/ui/EnhancedCard';
import EnhancedButton from '@/components/landing/ui/EnhancedButton';

const EnhancedBlogHighlights = () => {
  const [selectedPost, setSelectedPost] = useState<number | null>(null);
  const [hoveredPost, setHoveredPost] = useState<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const blogPosts = [
    {
      id: 1,
      title: "Ultimate Guide to UAE VAT Registration for New Businesses",
      excerpt: "Everything you need to know about VAT registration requirements, deadlines, and compliance for startups and new businesses in the UAE.",
      image: "",
      category: "VAT & Tax",
      readTime: "8 min read",
      publishDate: "December 15, 2024",
      featured: true,
      tags: ["VAT", "Registration", "UAE", "Startups"],
      views: "2.4k",
      gradient: "from-gold/20 to-agarwood/15"
    },
    {
      id: 2,
      title: "5 Common Accounting Mistakes That Cost UAE Businesses Money",
      excerpt: "Discover the most frequent accounting errors we see in UAE businesses and learn how to avoid costly mistakes that could impact your bottom line.",
      image: "",
      category: "Accounting Tips",
      readTime: "6 min read", 
      publishDate: "December 10, 2024",
      featured: false,
      tags: ["Accounting", "Mistakes", "Business Tips"],
      views: "1.8k",
      gradient: "from-agarwood/20 to-gold/15"
    },
    {
      id: 3,
      title: "Digital Transformation in UAE Accounting: What You Need to Know",
      excerpt: "How modern accounting technology is reshaping financial management for UAE businesses and what it means for your company's future.",
      image: "",
      category: "Technology",
      readTime: "10 min read",
      publishDate: "December 5, 2024", 
      featured: false,
      tags: ["Digital", "Technology", "Automation"],
      views: "3.1k",
      gradient: "from-gold/15 to-beige/25"
    },
    {
      id: 4,
      title: "Year-End Financial Planning Checklist for UAE Companies",
      excerpt: "Essential steps to ensure your business is financially prepared for the new year, including tax optimization and compliance requirements.",
      image: "",
      category: "Financial Planning",
      readTime: "12 min read",
      publishDate: "November 28, 2024",
      featured: true,
      tags: ["Planning", "Year-End", "Compliance"],
      views: "4.2k",
      gradient: "from-agarwood/25 to-gold/20"
    },
    {
      id: 5,
      title: "Understanding Corporate Tax in UAE: A Comprehensive Overview",
      excerpt: "Navigate the new corporate tax landscape in the UAE with our detailed guide covering rates, exemptions, and compliance requirements.",
      image: "",
      category: "VAT & Tax",
      readTime: "15 min read",
      publishDate: "November 20, 2024",
      featured: false,
      tags: ["Corporate Tax", "UAE", "Compliance"],
      views: "5.6k",
      gradient: "from-gold/20 to-agarwood/20"
    },
    {
      id: 6,
      title: "Cash Flow Management Strategies for Growing Businesses",
      excerpt: "Learn proven techniques to optimize cash flow, manage working capital, and ensure financial stability during periods of rapid growth.",
      image: "",
      category: "Financial Planning",
      readTime: "9 min read",
      publishDate: "November 15, 2024",
      featured: false,
      tags: ["Cash Flow", "Growth", "Management"],
      views: "2.9k",
      gradient: "from-beige/25 to-gold/15"
    }
  ];

  // Scroll functions
  const checkScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -400, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 400, behavior: 'smooth' });
    }
  };

  const openBlogPost = (postId: number) => {
    setSelectedPost(postId);
    // Navigate to blog post page
    const post = blogPosts.find(p => p.id === postId);
    if (post) {
      // In a real app, this would use Next.js router
      // For now, we'll simulate opening the blog post
      const slug = post.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      console.log(`Navigating to: /blog/${slug}`);
      
      // You could also open in a modal or navigate using:
      // router.push(`/blog/${slug}`);
      
      // For demonstration, let's show a toast or alert
      if (typeof window !== 'undefined') {
        window.open(`/blog/${slug}`, '_blank');
      }
    }
  };

  return (
    <Section
      id="blog"
      variant="gradient"
      padding="xl"
      parallax={{
        variant: 'audit-papers',
        intensity: 0.15
      }}
    >
      <SectionHeader
        subtitle="Insights & Resources"
        title="Latest Financial|Insights"
        description="Explore our expert insights on UAE accounting, tax regulations, and financial best practices. Scroll through our featured articles and click to read the full story."
        variant="luxury"
      />

      {/* Horizontal Scrollable Blog Pages */}
      <div className="relative">
        {/* Enhanced Scroll Navigation */}
        <div className="flex items-center justify-between mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex items-center space-x-4"
          >
            <div className="flex items-center space-x-3">
              <motion.div
                className="w-10 h-10 bg-gradient-to-br from-gold/20 to-agarwood/20 rounded-xl flex items-center justify-center"
                whileHover={{ scale: 1.1, rotate: 5 }}
              >
                <BookOpen size={20} className="text-agarwood" />
              </motion.div>
              <div>
                <h3 className="text-xl font-serif font-bold text-agarwood">
                  Featured Articles
                </h3>
                <p className="text-sm text-agarwood/60">
                  {blogPosts.length} insights to explore
                </p>
              </div>
            </div>
            <div className="h-px bg-gradient-to-r from-gold to-transparent w-20" />
          </motion.div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1 text-sm text-agarwood/60">
              <span>Scroll to explore</span>
              <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <ArrowRight size={16} />
              </motion.div>
            </div>
            
            <div className="flex items-center space-x-2">
              <motion.button
                onClick={scrollLeft}
                disabled={!canScrollLeft}
                className={`p-3 rounded-xl border-2 transition-all duration-300 backdrop-blur-sm ${
                  canScrollLeft
                    ? 'bg-white/90 dark:bg-agar-dark-surface/90 border-gold/40 text-agarwood hover:bg-gold hover:text-white hover:border-gold/70 shadow-lg hover:shadow-xl'
                    : 'bg-white/50 dark:bg-agar-dark-surface/50 border-white/30 dark:border-gold/10 text-agarwood/40 cursor-not-allowed'
                }`}
                whileHover={canScrollLeft ? { scale: 1.1, y: -2 } : {}}
                whileTap={canScrollLeft ? { scale: 0.95 } : {}}
              >
                <ChevronLeft size={20} />
              </motion.button>
              
              <motion.button
                onClick={scrollRight}
                disabled={!canScrollRight}
                className={`p-3 rounded-xl border-2 transition-all duration-300 backdrop-blur-sm ${
                  canScrollRight
                    ? 'bg-white/90 dark:bg-agar-dark-surface/90 border-gold/40 text-agarwood hover:bg-gold hover:text-white hover:border-gold/70 shadow-lg hover:shadow-xl'
                    : 'bg-white/50 dark:bg-agar-dark-surface/50 border-white/30 dark:border-gold/10 text-agarwood/40 cursor-not-allowed'
                }`}
                whileHover={canScrollRight ? { scale: 1.1, y: -2 } : {}}
                whileTap={canScrollRight ? { scale: 0.95 } : {}}
              >
                <ChevronRight size={20} />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Scrollable Container */}
        <div
          ref={scrollContainerRef}
          onScroll={checkScrollButtons}
          className="flex space-x-6 overflow-x-auto scrollbar-hide pb-8"
          style={{
            scrollSnapType: 'x mandatory',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {blogPosts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="flex-none w-80 scroll-snap-align-start"
              onHoverStart={() => setHoveredPost(post.id)}
              onHoverEnd={() => setHoveredPost(null)}
            >
              <motion.div
                className="h-full cursor-pointer"
                whileHover={{ y: -8, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => openBlogPost(post.id)}
              >
                <EnhancedCard
                  variant="luxury"
                  hover
                  className="overflow-hidden border-2 border-white/40 hover:border-gold/60 h-full group shadow-xl hover:shadow-2xl transform-gpu p-0"
                >
                  {/* Enhanced Full-height Image Section */}
                  <div className="relative h-96 overflow-hidden">
                    {/* Dynamic background with pattern */}
                    <motion.div
                      className={`absolute inset-0 bg-gradient-to-br ${post.gradient}`}
                      animate={hoveredPost === post.id ? { opacity: 0.95 } : { opacity: 0.85 }}
                      transition={{ duration: 0.3 }}
                    />
                    
                    {/* Subtle pattern overlay */}
                    <div className="absolute inset-0 opacity-10">
                      <svg className="w-full h-full" viewBox="0 0 100 100">
                        <defs>
                          <pattern id={`pattern-${post.id}`} patternUnits="userSpaceOnUse" width="20" height="20">
                            <circle cx="10" cy="10" r="1" fill="currentColor" className="text-white" />
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill={`url(#pattern-${post.id})`} />
                      </svg>
                    </div>
                    
                    {/* Content Overlay */}
                    <div className="absolute inset-0 p-8 flex flex-col justify-between text-white">
                      {/* Top Section */}
                      <div className="space-y-4">
                        {/* Category Badge */}
                        <motion.div
                          className="inline-flex"
                          whileHover={{ scale: 1.05 }}
                        >
                          <span className="px-4 py-2 bg-white/90 dark:bg-agar-dark-surface/90 text-agarwood rounded-full text-sm font-bold shadow-lg">
                            {post.category}
                          </span>
                        </motion.div>

                        {/* Featured Badge */}
                        {post.featured && (
                          <motion.div
                            className="px-3 py-1 bg-gold/90 text-agarwood rounded-full text-xs font-bold shadow-lg flex items-center space-x-1 w-fit"
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                          >
                            <BookOpen size={12} />
                            <span>Featured</span>
                          </motion.div>
                        )}
                      </div>

                      {/* Enhanced Center Icon */}
                      <div className="flex items-center justify-center">
                        <motion.div
                          className="relative"
                          whileHover={{ scale: 1.1 }}
                          transition={{ duration: 0.3 }}
                        >
                          {/* Pulsing background */}
                          <motion.div
                            className="absolute inset-0 w-24 h-24 bg-white/10 rounded-full"
                            animate={{
                              scale: [1, 1.2, 1],
                              opacity: [0.3, 0.1, 0.3]
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                          />
                          
                          {/* Main icon container */}
                          <motion.div
                            className="relative w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border-2 border-white/40 group-hover:border-white/80"
                            whileHover={{ rotate: 10 }}
                            transition={{ duration: 0.3 }}
                          >
                            <BookOpen size={32} className="text-white" />
                            
                            {/* Click indicator */}
                            <motion.div
                              className="absolute -top-2 -right-2 w-6 h-6 bg-gold rounded-full flex items-center justify-center"
                              animate={{
                                scale: [0.8, 1, 0.8],
                                rotate: [0, 180, 360]
                              }}
                              transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: "easeInOut"
                              }}
                            >
                              <ArrowRight size={12} className="text-agarwood" />
                            </motion.div>
                          </motion.div>
                        </motion.div>
                      </div>

                      {/* Bottom Section */}
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-xl font-serif font-bold leading-tight mb-3 line-clamp-2 group-hover:text-gold/90 transition-colors duration-300">
                            {post.title}
                          </h3>
                          <p className="text-white/80 text-sm leading-relaxed line-clamp-2">
                            {post.excerpt}
                          </p>
                        </div>

                        {/* Meta Info */}
                        <div className="flex items-center justify-between text-xs text-white/70">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1">
                              <Calendar size={12} />
                              <span>{post.publishDate.split(' ')[0]}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock size={12} />
                              <span>{post.readTime}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Eye size={12} />
                            <span>{post.views}</span>
                          </div>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1">
                          {post.tags.slice(0, 3).map((tag, tagIndex) => (
                            <span
                              key={tagIndex}
                              className="px-2 py-1 bg-white/20 text-white/90 rounded text-xs backdrop-blur-sm"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>

                        {/* Read More Button */}
                        <motion.div
                          className="pt-2"
                          whileHover={{ scale: 1.05 }}
                        >
                          <div className="flex items-center space-x-2 text-white group-hover:text-gold/90 transition-colors duration-300">
                            <span className="text-sm font-semibold">Read Article</span>
                            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
                          </div>
                        </motion.div>
                      </div>
                    </div>

                    {/* Hover Overlay */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10 opacity-0 group-hover:opacity-100"
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </EnhancedCard>
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Enhanced Scroll Indicator */}
        <div className="flex items-center justify-center mt-8 space-x-3">
          <div className="flex items-center space-x-2">
            {blogPosts.map((post, index) => (
              <motion.div
                key={index}
                className="relative cursor-pointer"
                onClick={() => {
                  // Scroll to specific post
                  if (scrollContainerRef.current) {
                    const postElement = scrollContainerRef.current.children[index] as HTMLElement;
                    postElement.scrollIntoView({ behavior: 'smooth', inline: 'center' });
                  }
                }}
                whileHover={{ scale: 1.2 }}
              >
                <motion.div
                  className="w-3 h-3 rounded-full border-2 border-agarwood/30"
                  animate={{
                    backgroundColor: hoveredPost === post.id ? '#C6A664' : 'transparent',
                    borderColor: hoveredPost === post.id ? '#C6A664' : 'rgba(59, 44, 38, 0.3)',
                    scale: hoveredPost === post.id ? 1.3 : 1
                  }}
                  transition={{ duration: 0.2 }}
                />
                
                {/* Post preview tooltip on hover */}
                {hoveredPost === post.id && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.8 }}
                    animate={{ opacity: 1, y: -40, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.8 }}
                    className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-agarwood text-white text-xs rounded-lg shadow-lg whitespace-nowrap z-10"
                  >
                    {post.category}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-agarwood" />
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
          
          <div className="text-xs text-agarwood/60 ml-4">
            {blogPosts.filter(post => post.featured).length} featured articles
          </div>
        </div>
      </div>

      {/* Enhanced Newsletter Subscription */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="mt-16 lg:mt-20"
      >
        <EnhancedCard
          variant="luxury"
          padding="xl"
          className="border-2 border-gold/40 text-center max-w-5xl mx-auto relative overflow-hidden shadow-2xl"
        >
          {/* Background elements */}
          <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-agarwood/5" />
          <div className="absolute top-8 right-8 opacity-5">
            <BookOpen size={120} className="text-gold" />
          </div>
          
          <div className="relative z-10 space-y-8">
            {/* Premium badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center space-x-3 bg-gradient-to-r from-white/95 via-white/90 to-white/95 backdrop-blur-sm border border-gold/40 rounded-full px-6 py-3 shadow-lg"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <BookOpen size={20} className="text-gold" />
              </motion.div>
              <span className="text-sm font-bold text-agarwood tracking-wide">Expert Financial Insights</span>
            </motion.div>
            
            <div>
              <h3 className="text-2xl lg:text-3xl font-serif font-bold text-agarwood mb-4">
                Never Miss Our Latest
                <span className="block bg-gradient-to-r from-gold via-gold/90 to-gold bg-clip-text text-transparent">
                  Financial Insights
                </span>
              </h3>
              <p className="text-lg text-agarwood/80 leading-relaxed max-w-3xl mx-auto">
                Get exclusive UAE accounting and tax insights delivered directly to your inbox. 
                Join 1,000+ business owners who rely on our expertise to stay ahead.
              </p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto"
            >
              <div className="relative flex-1">
                <input
                  type="email"
                  placeholder="Enter your business email"
                  className="w-full px-6 py-4 border-2 border-gold/40 rounded-xl focus:border-gold/70 focus:outline-none focus:ring-4 focus:ring-gold/20 transition-all duration-300 bg-white/80 dark:bg-agar-dark-surface/80 backdrop-blur-sm text-agarwood placeholder-agarwood/50 font-medium"
                />
                <motion.div
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <ArrowRight size={18} className="text-agarwood/40" />
                </motion.div>
              </div>
              
              <EnhancedButton
                variant="luxury"
                size="lg"
                showArrow
                glow
                className="sm:px-8 group"
              >
                <span className="flex items-center space-x-2">
                  <span>Get Insights</span>
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="group-hover:animate-spin"
                  >
                    <BookOpen size={18} />
                  </motion.div>
                </span>
              </EnhancedButton>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex flex-wrap items-center justify-center gap-6 text-sm text-agarwood/70"
            >
              {[
                { icon: CheckCircle2, text: "Weekly insights", delay: 0 },
                { icon: CheckCircle2, text: "UAE focused content", delay: 0.1 },
                { icon: CheckCircle2, text: "Expert analysis", delay: 0.2 },
                { icon: CheckCircle2, text: "Unsubscribe anytime", delay: 0.3 }
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.6 + item.delay }}
                    className="flex items-center space-x-2 group"
                  >
                    <Icon size={16} className="text-gold group-hover:scale-110 transition-transform duration-200" />
                    <span className="font-medium">{item.text}</span>
                  </motion.div>
                );
              })}
            </motion.div>
            
            {/* Trust indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="pt-6 border-t border-gold/20"
            >
              <p className="text-xs text-agarwood/60">
                Join business owners from Dubai, Abu Dhabi, and across the UAE
              </p>
            </motion.div>
          </div>
        </EnhancedCard>
      </motion.div>
    </Section>
  );
};

export default EnhancedBlogHighlights;
