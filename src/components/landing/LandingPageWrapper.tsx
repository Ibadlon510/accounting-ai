"use client";

import React from "react";
import dynamic from "next/dynamic";
import { ThemeProvider } from "@/components/landing/contexts/ThemeContext";
import ToastProvider from "@/components/landing/providers/ToastProvider";
import EnhancedHeader from "@/components/landing/sections/EnhancedHeader";
import EnhancedHero from "@/components/landing/sections/EnhancedHero";
import ScrollProgress from "@/components/landing/ui/ScrollProgress";
import FloatingActionButton from "@/components/landing/ui/FloatingActionButton";
import "./landing.css";

// Lazy load below-the-fold sections
const EnhancedAboutUs = dynamic(() => import("@/components/landing/sections/EnhancedAboutUs"), { ssr: true });
const EnhancedServicesExpertise = dynamic(() => import("@/components/landing/sections/EnhancedServicesExpertise"), { ssr: true });
const EnhancedWhyChooseUs = dynamic(() => import("@/components/landing/sections/EnhancedWhyChooseUs"), { ssr: true });
const EnhancedPricing = dynamic(() => import("@/components/landing/sections/EnhancedPricing"), { ssr: true });
const EnhancedFAQ = dynamic(() => import("@/components/landing/sections/EnhancedFAQ"), { ssr: true });
const MarketplaceTeaser = dynamic(() => import("@/components/landing/sections/MarketplaceTeaser"), { ssr: true });
const EnhancedTestimonials = dynamic(() => import("@/components/landing/sections/EnhancedTestimonials"), { ssr: true });
const EnhancedBlogHighlights = dynamic(() => import("@/components/landing/sections/EnhancedBlogHighlights"), { ssr: true });
const EnhancedCTAContact = dynamic(() => import("@/components/landing/sections/EnhancedCTAContact"), { ssr: true });
const EnhancedFooter = dynamic(() => import("@/components/landing/sections/EnhancedFooter"), { ssr: true });

export default function LandingPageWrapper() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <div className="agar-landing overflow-x-hidden">
          <ScrollProgress />
          <EnhancedHeader />
          <EnhancedHero />
          <EnhancedAboutUs />
          <EnhancedServicesExpertise />
          <EnhancedWhyChooseUs />
          <EnhancedPricing />
          <EnhancedFAQ />
          <MarketplaceTeaser />
          <EnhancedTestimonials />
          <EnhancedBlogHighlights />
          <EnhancedCTAContact />
          <EnhancedFooter />
          <FloatingActionButton />
        </div>
      </ToastProvider>
    </ThemeProvider>
  );
}
