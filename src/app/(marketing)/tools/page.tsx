'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Star, ArrowRight, Sparkles, Grid3X3, Filter, Clock, Zap, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { APPS, APP_CATEGORIES, type AppCategory, type AppStatus } from '@/components/landing/data/apps';

const statusConfig: Record<AppStatus, { label: string; color: string; icon: React.ReactNode }> = {
  live: { label: 'Live', color: 'bg-emerald-500 text-white', icon: <Zap size={12} /> },
  beta: { label: 'Beta', color: 'bg-amber-500 text-white', icon: <Sparkles size={12} /> },
  'coming-soon': { label: 'Coming Soon', color: 'bg-agarwood/20 text-agarwood', icon: <Clock size={12} /> },
};

export default function ToolsMarketplacePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<AppCategory | 'all'>('all');

  const filteredApps = useMemo(() => {
    return APPS.filter((app) => {
      const matchesSearch =
        searchQuery === '' ||
        app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'all' || app.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory]);

  const featuredApp = APPS.find((a) => a.featured);

  return (
    <div className="agar-landing min-h-screen bg-gradient-to-b from-beige via-white to-beige/50 dark:from-agar-dark dark:via-agar-dark dark:to-agar-dark">
      {/* Hero */}
      <section className="relative pt-32 pb-16 lg:pt-40 lg:pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-agarwood/5 via-transparent to-gold/5" />
        <div className="absolute top-20 right-20 w-72 h-72 bg-gold/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-agarwood/5 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-gold/10 border border-gold/20 rounded-full mb-6"
          >
            <Grid3X3 size={16} className="text-gold" />
            <span className="text-sm font-semibold text-agarwood">App Marketplace</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-agarwood leading-tight mb-6"
          >
            Powerful Apps for{' '}
            <span className="bg-gradient-to-r from-gold via-gold/90 to-gold bg-clip-text text-transparent">
              Your Business
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-lg text-agarwood/75 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Discover our growing ecosystem of financial tools and services — from AI-powered accounting
            to VAT calculators, all designed for UAE businesses.
          </motion.p>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="relative max-w-xl mx-auto"
          >
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-agarwood/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search apps..."
              className="w-full pl-12 pr-4 py-4 bg-white/80 dark:bg-agar-dark-surface/80 backdrop-blur-sm border-2 border-gold/20 rounded-2xl text-agarwood placeholder:text-agarwood/40 focus:outline-none focus:border-gold/50 focus:ring-4 focus:ring-gold/10 transition-all duration-300 shadow-lg"
            />
          </motion.div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-wrap gap-3 justify-center"
        >
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 border-2 ${
              activeCategory === 'all'
                ? 'bg-agarwood text-white border-agarwood shadow-lg'
                : 'bg-white/60 dark:bg-agar-dark-surface/60 text-agarwood/70 border-transparent hover:border-gold/30 hover:bg-gold/5'
            }`}
          >
            All Apps
          </button>
          {Object.entries(APP_CATEGORIES).map(([key, cat]) => (
            <button
              key={key}
              onClick={() => setActiveCategory(key as AppCategory)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 border-2 ${
                activeCategory === key
                  ? 'bg-agarwood text-white border-agarwood shadow-lg'
                  : 'bg-white/60 dark:bg-agar-dark-surface/60 text-agarwood/70 border-transparent hover:border-gold/30 hover:bg-gold/5'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </motion.div>
      </section>

      {/* Featured App */}
      {featuredApp && activeCategory === 'all' && searchQuery === '' && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <Link href={`/tools/${featuredApp.slug}`} className="block group">
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-agarwood via-dark-brown to-agarwood border-2 border-gold/30 shadow-2xl hover:shadow-gold/20 transition-all duration-500 hover:border-gold/50">
                <div className="absolute inset-0 bg-gradient-to-r from-gold/10 via-transparent to-gold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute top-4 right-4 flex items-center space-x-2 px-3 py-1.5 bg-gold text-agarwood rounded-full text-xs font-bold shadow-lg">
                  <Star size={12} fill="currentColor" />
                  <span>Featured</span>
                </div>

                <div className="relative z-10 p-8 lg:p-12 grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                  {/* Left: Info */}
                  <div className="space-y-6">
                    <div className="flex items-center space-x-4">
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${featuredApp.gradient} flex items-center justify-center shadow-xl border border-gold/30`}>
                        <featuredApp.icon size={32} className="text-gold" />
                      </div>
                      <div>
                        <h2 className="text-2xl lg:text-3xl font-serif font-bold text-white">
                          {featuredApp.name}
                        </h2>
                        <p className="text-gold font-semibold text-sm">{featuredApp.tagline}</p>
                      </div>
                    </div>

                    <p className="text-white/80 leading-relaxed text-base">
                      {featuredApp.description}
                    </p>

                    <div className="flex items-center space-x-3 text-gold font-semibold group-hover:text-gold/80 transition-colors">
                      <span>Learn More</span>
                      <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform duration-300" />
                    </div>
                  </div>

                  {/* Right: Feature highlights */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {featuredApp.features.slice(0, 6).map((feature, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.6 + idx * 0.05 }}
                        className="flex items-start space-x-2 px-4 py-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10"
                      >
                        <CheckCircle2 size={16} className="text-gold flex-shrink-0 mt-0.5" />
                        <span className="text-white/90 text-sm">{feature}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        </section>
      )}

      {/* App Grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl lg:text-2xl font-serif font-bold text-agarwood">
            {activeCategory === 'all' ? 'All Apps' : APP_CATEGORIES[activeCategory].label}
            <span className="text-agarwood/40 font-normal text-base ml-3">
              {filteredApps.length} {filteredApps.length === 1 ? 'app' : 'apps'}
            </span>
          </h2>
          <div className="flex items-center space-x-2 text-sm text-agarwood/50">
            <Filter size={14} />
            <span>Sorted by relevance</span>
          </div>
        </div>

        <AnimatePresence mode="popLayout">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredApps.map((app, index) => {
              const StatusIcon = statusConfig[app.status].icon;
              return (
                <motion.div
                  key={app.slug}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.35, delay: index * 0.05 }}
                >
                  <Link href={`/tools/${app.slug}`} className="block group h-full">
                    <div className="relative h-full bg-white/80 dark:bg-agar-dark-surface/80 backdrop-blur-sm border-2 border-white/60 dark:border-gold/10 hover:border-gold/40 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-400 flex flex-col">
                      {/* Status badge */}
                      <div className="absolute top-4 right-4">
                        <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold ${statusConfig[app.status].color}`}>
                          {StatusIcon}
                          <span>{statusConfig[app.status].label}</span>
                        </span>
                      </div>

                      {/* Icon + Name */}
                      <div className="flex items-center space-x-4 mb-4">
                        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${app.gradient} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300 flex-shrink-0`}>
                          <app.icon size={28} className="text-agarwood group-hover:scale-110 transition-transform duration-300" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-lg font-serif font-bold text-agarwood group-hover:text-gold transition-colors duration-300 truncate">
                            {app.name}
                          </h3>
                          <p className="text-xs text-gold font-semibold truncate">{app.tagline}</p>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-agarwood/70 leading-relaxed mb-4 line-clamp-3 flex-1">
                        {app.description}
                      </p>

                      {/* Features preview */}
                      <div className="space-y-1.5 mb-5">
                        {app.features.slice(0, 3).map((f, i) => (
                          <div key={i} className="flex items-center space-x-2 text-xs text-agarwood/55">
                            <div className="w-1.5 h-1.5 bg-gold/60 rounded-full flex-shrink-0" />
                            <span className="truncate">{f}</span>
                          </div>
                        ))}
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-4 border-t border-beige/40 mt-auto">
                        <span className="text-xs text-agarwood/50 font-medium">
                          {app.pricing || 'Free'}
                        </span>
                        <div className="flex items-center space-x-1.5 text-gold font-semibold text-sm group-hover:text-agarwood transition-colors duration-300">
                          <span>View</span>
                          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-300" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>

        {filteredApps.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <Search size={48} className="mx-auto text-agarwood/20 mb-4" />
            <p className="text-lg text-agarwood/60 font-medium">No apps found matching your criteria.</p>
            <button
              onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
              className="mt-4 text-gold font-semibold hover:text-agarwood transition-colors"
            >
              Clear filters
            </button>
          </motion.div>
        )}
      </section>

      {/* Back to Home */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 text-center">
        <Link href="/landing" className="inline-flex items-center space-x-2 text-agarwood/60 hover:text-gold transition-colors font-medium">
          <ArrowRight size={16} className="rotate-180" />
          <span>Back to Apps</span>
        </Link>
      </section>
    </div>
  );
}
