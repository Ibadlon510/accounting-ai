'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Brain, Zap, Clock } from 'lucide-react';
import Link from 'next/link';
import Section from '@/components/landing/ui/Section';
import SectionHeader from '@/components/landing/ui/SectionHeader';
import EnhancedButton from '@/components/landing/ui/EnhancedButton';
import { APPS, type AppStatus } from '@/components/landing/data/apps';

const statusBadge: Record<AppStatus, { label: string; color: string; icon: React.ReactNode }> = {
  live: { label: 'Live', color: 'bg-emerald-500 text-white', icon: <Zap size={10} /> },
  beta: { label: 'Beta', color: 'bg-amber-500 text-white', icon: <Sparkles size={10} /> },
  'coming-soon': { label: 'Soon', color: 'bg-agarwood/15 text-agarwood/70', icon: <Clock size={10} /> },
};

const MarketplaceTeaser = () => {
  const previewApps = APPS.slice(0, 6);
  const featuredApp = APPS.find((a) => a.featured);

  return (
    <Section
      id="apps"
      variant="default"
      background="white"
      padding="lg"
    >
      <SectionHeader
        subtitle="App Marketplace"
        title="Our Growing Ecosystem|of Business Apps"
        description="From AI-powered accounting to tax tools — discover purpose-built apps designed for UAE businesses."
        variant="luxury"
      />

      {/* Featured App Banner */}
      {featuredApp && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12 lg:mb-16"
        >
          <Link href={`/tools/${featuredApp.slug}`} className="block group">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-agarwood via-dark-brown to-agarwood border-2 border-gold/30 shadow-xl hover:shadow-2xl hover:border-gold/50 transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-r from-gold/10 via-transparent to-gold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative z-10 p-8 lg:p-10 flex flex-col lg:flex-row items-center gap-6 lg:gap-10">
                <div className={`w-16 h-16 lg:w-20 lg:h-20 rounded-2xl bg-gradient-to-br ${featuredApp.gradient} flex items-center justify-center shadow-xl border border-gold/30 flex-shrink-0`}>
                  <Brain size={36} className="text-gold" />
                </div>

                <div className="flex-1 text-center lg:text-left">
                  <div className="flex items-center justify-center lg:justify-start space-x-3 mb-2">
                    <h3 className="text-xl lg:text-2xl font-serif font-bold text-white">
                      {featuredApp.name}
                    </h3>
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-gold text-agarwood rounded-full text-xs font-bold">
                      <Sparkles size={10} />
                      <span>Featured</span>
                    </span>
                  </div>
                  <p className="text-white/75 text-sm lg:text-base leading-relaxed max-w-xl">
                    {featuredApp.tagline} — {featuredApp.description.slice(0, 120)}...
                  </p>
                </div>

                <div className="flex items-center space-x-2 text-gold font-semibold group-hover:text-gold/80 transition-colors flex-shrink-0">
                  <span className="hidden sm:inline">Learn More</span>
                  <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform duration-300" />
                </div>
              </div>
            </div>
          </Link>
        </motion.div>
      )}

      {/* App Grid Preview */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-5 mb-12 lg:mb-16">
        {previewApps.map((app, index) => {
          const Icon = app.icon;
          const badge = statusBadge[app.status];
          return (
            <motion.div
              key={app.slug}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.06 }}
            >
              <Link href={`/tools/${app.slug}`} className="block group">
                <div className="relative bg-white/80 backdrop-blur-sm border-2 border-white/60 hover:border-gold/40 rounded-xl p-4 shadow-sm hover:shadow-lg transition-all duration-300 text-center">
                  {/* Status dot */}
                  <div className="absolute top-2 right-2">
                    <span className={`inline-flex items-center space-x-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${badge.color}`}>
                      {badge.icon}
                      <span>{badge.label}</span>
                    </span>
                  </div>

                  <div className={`w-12 h-12 mx-auto rounded-xl bg-gradient-to-br ${app.gradient} flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow duration-300 mb-3`}>
                    <Icon size={22} className="text-agarwood group-hover:scale-110 transition-transform duration-300" />
                  </div>

                  <h4 className="text-sm font-serif font-bold text-agarwood group-hover:text-gold transition-colors duration-300 line-clamp-1">
                    {app.name}
                  </h4>
                  <p className="text-[11px] text-agarwood/50 mt-1 line-clamp-1">
                    {app.tagline}
                  </p>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* CTA to Marketplace */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <Link href="/landing">
          <EnhancedButton
            variant="luxury"
            size="lg"
            showArrow
            glow
          >
            Explore All Apps
          </EnhancedButton>
        </Link>
        <p className="text-sm text-agarwood/50 mt-4">
          {APPS.length} apps available · More coming soon
        </p>
      </motion.div>
    </Section>
  );
};

export default MarketplaceTeaser;
