'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Star,
  Sparkles,
  Clock,
  Zap,
  ExternalLink,
  LogIn,
  UserPlus,
  LayoutDashboard,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getAppBySlug, APPS, type AppStatus } from '@/components/landing/data/apps';

const statusLabels: Record<AppStatus, { label: string; color: string; icon: React.ReactNode }> = {
  live: { label: 'Available Now', color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30', icon: <Zap size={14} /> },
  beta: { label: 'Beta Access', color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30', icon: <Sparkles size={14} /> },
  'coming-soon': { label: 'Coming Soon', color: 'bg-agarwood/10 text-agarwood border-agarwood/20', icon: <Clock size={14} /> },
};

export default function AppSubLandingPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const app = getAppBySlug(slug);
  const { data: session, status: authStatus } = useSession();
  const isAuthenticated = authStatus === 'authenticated';

  if (!app) {
    return (
      <div className="agar-landing min-h-screen bg-gradient-to-b from-beige via-white to-beige/50 dark:from-agar-dark dark:via-agar-dark dark:to-agar-dark flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md mx-auto px-4">
          <h1 className="text-3xl font-serif font-bold text-agarwood">App Not Found</h1>
          <p className="text-agarwood/60">The app you're looking for doesn't exist or has been removed.</p>
          <Link href="/tools" className="inline-flex items-center space-x-2 text-gold font-semibold hover:text-agarwood transition-colors">
            <ArrowLeft size={16} />
            <span>Back to Marketplace</span>
          </Link>
        </div>
      </div>
    );
  }

  const Icon = app.icon;
  const sConfig = statusLabels[app.status];
  const relatedApps = APPS.filter((a) => a.slug !== app.slug && a.category === app.category).slice(0, 3);

  return (
    <div className="agar-landing min-h-screen bg-gradient-to-b from-beige via-white to-beige/50 dark:from-agar-dark dark:via-agar-dark dark:to-agar-dark">
      {/* Hero Section */}
      <section className="relative pt-28 pb-16 lg:pt-36 lg:pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-agarwood/5 via-transparent to-gold/5" />
        <div className="absolute top-20 right-20 w-64 h-64 bg-gold/8 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-center space-x-2 text-sm text-agarwood/50 mb-8"
          >
            <Link href="/" className="hover:text-gold transition-colors">Home</Link>
            <span>/</span>
            <Link href="/tools" className="hover:text-gold transition-colors">Apps</Link>
            <span>/</span>
            <span className="text-agarwood font-medium">{app.name}</span>
          </motion.div>

          <div className="grid lg:grid-cols-5 gap-10 lg:gap-14 items-start">
            {/* Left: Main Info (3 cols) */}
            <div className="lg:col-span-3 space-y-8">
              {/* App Identity */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex items-center space-x-5"
              >
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${app.gradient} flex items-center justify-center shadow-xl border-2 border-gold/20`}>
                  <Icon size={40} className="text-agarwood" />
                </div>
                <div>
                  <div className="flex items-center space-x-3 mb-1">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-agarwood">
                      {app.name}
                    </h1>
                    {app.featured && (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-gold/10 border border-gold/30 rounded-full text-xs font-bold text-gold">
                        <Star size={12} fill="currentColor" />
                        <span>Featured</span>
                      </span>
                    )}
                  </div>
                  <p className="text-gold font-semibold">{app.tagline}</p>
                </div>
              </motion.div>

              {/* Status + Category */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="flex flex-wrap items-center gap-3"
              >
                <span className={`inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-sm font-bold border ${sConfig.color}`}>
                  {sConfig.icon}
                  <span>{sConfig.label}</span>
                </span>
                <span className="px-3.5 py-1.5 rounded-full text-sm font-medium bg-beige/50 dark:bg-agar-dark-surface/50 text-agarwood/70 border border-beige/60 dark:border-gold/10">
                  {app.category.charAt(0).toUpperCase() + app.category.slice(1)}
                </span>
                {app.pricing && (
                  <span className="px-3.5 py-1.5 rounded-full text-sm font-medium bg-gold/10 text-gold border border-gold/20">
                    {app.pricing}
                  </span>
                )}
              </motion.div>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 }}
                className="text-base lg:text-lg text-agarwood/80 leading-relaxed"
              >
                {app.description}
              </motion.p>

              {/* Features List */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="space-y-4"
              >
                <h2 className="text-xl font-serif font-bold text-agarwood">Key Features</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {app.features.map((feature, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.35, delay: 0.25 + idx * 0.04 }}
                      className="flex items-start space-x-3 p-3.5 bg-white/70 dark:bg-agar-dark-surface/70 backdrop-blur-sm rounded-xl border border-gold/10 hover:border-gold/30 transition-colors duration-300"
                    >
                      <CheckCircle2 size={18} className="text-gold flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-agarwood/80 font-medium">{feature}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Right: CTA Sidebar (2 cols) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="lg:col-span-2"
            >
              <div className="sticky top-32 bg-white/90 dark:bg-agar-dark-surface/90 backdrop-blur-xl border-2 border-gold/20 rounded-3xl p-8 shadow-xl space-y-6">
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-serif font-bold text-agarwood">
                    {app.status === 'live' ? 'Get Started' : 'Stay Updated'}
                  </h3>
                  <p className="text-sm text-agarwood/60">
                    {app.status === 'live'
                      ? 'Sign up to start using this app today.'
                      : 'Create an account to be notified when this app launches.'}
                  </p>
                </div>

                {app.status === 'live' ? (
                  <>
                    {isAuthenticated && app.appUrl ? (
                      <Link href={app.appUrl} className="block">
                        <motion.button
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-gold via-gold/95 to-gold/90 text-agarwood font-bold rounded-2xl shadow-lg hover:shadow-xl border-2 border-gold/40 hover:border-gold/70 transition-all duration-300"
                        >
                          <LayoutDashboard size={20} />
                          <span>Go to App</span>
                          <ExternalLink size={16} />
                        </motion.button>
                      </Link>
                    ) : isAuthenticated ? (
                      <div className="text-center text-sm text-agarwood/60 py-4 bg-beige/30 dark:bg-agar-dark-surface/30 rounded-xl">
                        App access will be available soon.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Link href="/signup" className="block">
                          <motion.button
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-gold via-gold/95 to-gold/90 text-agarwood font-bold rounded-2xl shadow-lg hover:shadow-xl border-2 border-gold/40 hover:border-gold/70 transition-all duration-300"
                          >
                            <UserPlus size={18} />
                            <span>Create Free Account</span>
                          </motion.button>
                        </Link>
                        <Link href="/login" className="block">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full flex items-center justify-center space-x-2 px-6 py-3.5 bg-transparent text-agarwood font-semibold rounded-2xl border-2 border-agarwood/20 hover:border-agarwood/40 hover:bg-agarwood/5 transition-all duration-300"
                          >
                            <LogIn size={16} />
                            <span>Sign In</span>
                          </motion.button>
                        </Link>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="space-y-3">
                    {isAuthenticated ? (
                      <div className="flex items-center justify-center space-x-2 py-4 px-6 bg-beige/40 dark:bg-agar-dark-surface/40 rounded-xl text-sm text-agarwood/70 font-medium">
                        <Clock size={16} />
                        <span>We&apos;ll notify you at launch</span>
                      </div>
                    ) : (
                      <>
                        <Link href="/signup" className="block">
                          <motion.button
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-gold via-gold/95 to-gold/90 text-agarwood font-bold rounded-2xl shadow-lg hover:shadow-xl border-2 border-gold/40 hover:border-gold/70 transition-all duration-300"
                          >
                            <UserPlus size={18} />
                            <span>Sign Up for Early Access</span>
                          </motion.button>
                        </Link>
                        <Link href="/login" className="block">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full flex items-center justify-center space-x-2 px-6 py-3.5 bg-transparent text-agarwood font-semibold rounded-2xl border-2 border-agarwood/20 hover:border-agarwood/40 hover:bg-agarwood/5 transition-all duration-300"
                          >
                            <LogIn size={16} />
                            <span>Sign In</span>
                          </motion.button>
                        </Link>
                      </>
                    )}
                  </div>
                )}

                <div className="pt-4 border-t border-beige/40 dark:border-gold/10 text-center">
                  <p className="text-xs text-agarwood/40">No credit card required for free tier.</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Related Apps */}
      {relatedApps.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-beige/40 dark:border-gold/10">
          <h2 className="text-xl font-serif font-bold text-agarwood mb-8">Related Apps</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedApps.map((related) => {
              const RelIcon = related.icon;
              return (
                <Link key={related.slug} href={`/tools/${related.slug}`} className="group block">
                  <div className="bg-white/70 dark:bg-agar-dark-surface/70 backdrop-blur-sm border-2 border-white/60 dark:border-gold/10 hover:border-gold/30 rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all duration-300">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${related.gradient} flex items-center justify-center`}>
                        <RelIcon size={20} className="text-agarwood" />
                      </div>
                      <div>
                        <h3 className="font-serif font-bold text-agarwood group-hover:text-gold transition-colors text-sm">{related.name}</h3>
                        <p className="text-xs text-agarwood/50">{related.tagline}</p>
                      </div>
                    </div>
                    <p className="text-xs text-agarwood/60 line-clamp-2">{related.description}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Navigation */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 flex items-center justify-between">
        <Link href="/tools" className="inline-flex items-center space-x-2 text-agarwood/60 hover:text-gold transition-colors font-medium">
          <ArrowLeft size={16} />
          <span>All Apps</span>
        </Link>
        <Link href="/" className="inline-flex items-center space-x-2 text-agarwood/60 hover:text-gold transition-colors font-medium">
          <span>Home</span>
          <ArrowRight size={16} />
        </Link>
      </section>
    </div>
  );
}
