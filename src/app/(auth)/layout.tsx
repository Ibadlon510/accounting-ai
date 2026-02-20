"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Sparkles, Receipt, BarChart3, Zap, ShieldCheck, Globe, Lock } from "lucide-react";

const features = [
  { icon: Sparkles, text: "AI classifies your transactions in seconds", color: "text-[var(--accent-ai)]" },
  { icon: Receipt, text: "VAT returns generated automatically", color: "text-[var(--success)]" },
  { icon: BarChart3, text: "Real-time P&L and Balance Sheet", color: "text-[var(--accent-yellow)]" },
  { icon: Zap, text: "Bank reconciliation with one click", color: "text-[var(--accent-pink)]" },
];

const trustItems = [
  { icon: Globe, text: "Built for UAE businesses" },
  { icon: ShieldCheck, text: "FTA-compliant VAT" },
  { icon: Lock, text: "256-bit encryption" },
];

function FeatureCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setIndex((i) => (i + 1) % features.length), 5000);
    return () => clearInterval(timer);
  }, []);

  const feature = features[index];
  const Icon = feature.icon;

  return (
    <div className="relative h-[72px]">
      <div
        key={index}
        className="absolute inset-0 flex items-center gap-3 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-dark)] px-5 py-4 backdrop-blur-xl animate-in fade-in duration-500"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
          <Icon className={`h-5 w-5 ${feature.color}`} />
        </div>
        <p className="text-[14px] font-medium leading-snug text-white/90">{feature.text}</p>
      </div>
    </div>
  );
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Left Panel — Brand Showcase (hidden on mobile) */}
      <div className="bg-canvas-gradient relative hidden w-[520px] shrink-0 flex-col items-center justify-between px-12 py-10 lg:flex">
        {/* Logo */}
        <div className="flex w-full items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-orange-500">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-white" stroke="currentColor" strokeWidth={2.5}>
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[15px] font-bold text-text-primary">Agar</span>
            <span className="text-[11px] font-medium text-text-secondary">Smart Accounting</span>
          </div>
        </div>

        {/* Center — AI Character + Feature Carousel */}
        <div className="flex flex-col items-center gap-8">
          {/* AI Character */}
          <div className="relative">
            <div className="absolute -inset-4 rounded-full bg-[var(--success)]/10 blur-2xl" />
            <Image
              src="/assets/ai-character/avatar-placeholder.svg"
              alt="Agar AI Assistant"
              width={220}
              height={220}
              className="relative drop-shadow-lg"
              priority
            />
          </div>

          <div className="text-center">
            <h2 className="text-[22px] font-bold text-text-primary">
              Accounting that thinks for you
            </h2>
            <p className="mt-1.5 text-[14px] text-text-secondary">
              AI-powered bookkeeping, VAT automation & real-time insights
            </p>
          </div>

          <div className="w-full max-w-[380px]">
            <FeatureCarousel />
          </div>
        </div>

        {/* Trust Bar */}
        <div className="flex w-full items-center justify-center gap-6">
          {trustItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.text} className="flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5 text-text-meta" strokeWidth={1.8} />
                <span className="text-[11px] font-medium text-text-meta">{item.text}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex flex-1 items-center justify-center bg-surface px-6 py-10 max-lg:bg-canvas-gradient lg:px-12">
        <div className="w-full max-w-[420px]">
          {children}
        </div>
      </div>
    </div>
  );
}
