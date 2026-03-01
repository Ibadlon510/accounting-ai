import {
  Calculator,
  FileDown,
  Calendar,
  DollarSign,
  PieChart,
  Upload,
  Brain,
  LucideIcon,
} from 'lucide-react';

export type AppStatus = 'live' | 'coming-soon' | 'beta';
export type AppCategory = 'accounting' | 'tax' | 'tools' | 'finance' | 'documents';

export interface AppListing {
  slug: string;
  icon: LucideIcon;
  name: string;
  tagline: string;
  description: string;
  category: AppCategory;
  status: AppStatus;
  featured: boolean;
  gradient: string;
  features: string[];
  pricing?: string;
  appUrl?: string; // internal route to the actual app
  screenshots?: string[];
}

export const APP_CATEGORIES: Record<AppCategory, { label: string; description: string }> = {
  accounting: { label: 'Accounting', description: 'Full-service accounting solutions' },
  tax: { label: 'Tax & VAT', description: 'Tax compliance and advisory' },
  tools: { label: 'Business Tools', description: 'Productivity and efficiency' },
  finance: { label: 'Finance', description: 'Financial management' },
  documents: { label: 'Documents', description: 'Document management' },
};

export const APPS: AppListing[] = [
  {
    slug: 'accounting-ai',
    icon: Brain,
    name: 'AccountingAI',
    tagline: 'AI-Powered Smart Accounting',
    description:
      'The flagship AI-powered accounting platform. Automate bookkeeping, VAT filing, invoice processing, and get real-time financial insights — all powered by advanced AI that learns your business patterns.',
    category: 'accounting',
    status: 'live',
    featured: true,
    gradient: 'from-gold/30 via-gold/20 to-agarwood/10',
    features: [
      'AI-powered bookkeeping & auto-categorization',
      'Smart VAT return preparation',
      'Automated invoice & bill processing',
      'Real-time dashboard with financial insights',
      'Bank statement reconciliation',
      'Multi-currency support (AED, USD, EUR, GBP)',
      'Document OCR & intelligent data extraction',
      'Team collaboration with role-based access',
    ],
    pricing: 'Free tier available',
    appUrl: '/dashboard',
  },
  {
    slug: 'vat-calculator',
    icon: Calculator,
    name: 'UAE VAT Calculator',
    tagline: 'Instant VAT Calculations',
    description:
      'Calculate VAT amounts, totals, and reverse VAT for UAE tax rates (5%) with precision and ease. Supports bulk calculations and export.',
    category: 'tax',
    status: 'live',
    featured: false,
    gradient: 'from-gold/25 to-agarwood/15',
    features: [
      '5% UAE VAT Rate',
      'Reverse VAT Calculation',
      'Bulk Calculations',
      'Export Results',
    ],
    pricing: 'Free',
  },
  {
    slug: 'invoice-generator',
    icon: FileDown,
    name: 'Invoice Template Generator',
    tagline: 'Professional Templates',
    description:
      'Create professional, UAE-compliant invoice templates customized for your business branding. Multiple formats available.',
    category: 'documents',
    status: 'coming-soon',
    featured: false,
    gradient: 'from-agarwood/25 to-gold/15',
    features: [
      'UAE Compliance',
      'Custom Branding',
      'Multiple Formats',
      'Instant Download',
    ],
    pricing: 'Free',
  },
  {
    slug: 'tax-calendar',
    icon: Calendar,
    name: 'Tax Deadlines Calendar',
    tagline: 'Never Miss a Deadline',
    description:
      'Comprehensive calendar of UAE tax filing and payment deadlines with smart reminders and calendar sync.',
    category: 'tax',
    status: 'coming-soon',
    featured: false,
    gradient: 'from-gold/20 to-beige/25',
    features: [
      'Smart Reminders',
      'All UAE Taxes',
      'Calendar Sync',
      'Email Alerts',
    ],
    pricing: 'Free',
  },
  {
    slug: 'currency-converter',
    icon: DollarSign,
    name: 'Currency Converter',
    tagline: 'Real-time Exchange Rates',
    description:
      'Accurate, real-time currency conversion for international business transactions and reporting.',
    category: 'finance',
    status: 'coming-soon',
    featured: false,
    gradient: 'from-agarwood/20 to-gold/25',
    features: [
      'Live Rates',
      '100+ Currencies',
      'Rate History',
      'Export Data',
    ],
    pricing: 'Free',
  },
  {
    slug: 'expense-tracker',
    icon: PieChart,
    name: 'Business Expense Tracker',
    tagline: 'Simplified Expense Management',
    description:
      'Track and categorize business expenses with automated receipt processing and reporting.',
    category: 'finance',
    status: 'coming-soon',
    featured: false,
    gradient: 'from-gold/15 to-agarwood/20',
    features: [
      'Receipt Scanning',
      'Auto-categorization',
      'Monthly Reports',
      'VAT Tracking',
    ],
    pricing: 'Free',
  },
  {
    slug: 'document-portal',
    icon: Upload,
    name: 'Secure Document Portal',
    tagline: 'Safe File Sharing',
    description:
      'Securely upload and share financial documents with your accounting team using enterprise-grade encryption.',
    category: 'documents',
    status: 'coming-soon',
    featured: false,
    gradient: 'from-beige/25 to-gold/20',
    features: [
      '256-bit Encryption',
      'Version Control',
      'Access Logs',
      'Mobile Upload',
    ],
    pricing: 'Free',
  },
];

export function getAppBySlug(slug: string): AppListing | undefined {
  return APPS.find((app) => app.slug === slug);
}

export function getAppsByCategory(category: AppCategory): AppListing[] {
  return APPS.filter((app) => app.category === category);
}

export function getFeaturedApps(): AppListing[] {
  return APPS.filter((app) => app.featured);
}
