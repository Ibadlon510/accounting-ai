// Agar billing plans — all prices in fils (AED minor unit)
// 19.00 AED = 1900 fils

export const PLANS = {
  FREE: {
    key: "FREE" as const,
    name: "Free",
    monthlyPrice: 0,
    annualPrice: 0,
    currency: "AED",
    maxUsers: 1,
    journalEntriesPerMonth: 25,
    monthlyTokens: 0,
    freeAiDocs: 5, // lifetime, not monthly
    freeAiStatements: 1, // lifetime
    topUpAllowed: false,
    features: [
      "1 user",
      "25 journal entries/month",
      "5 AI document scans (lifetime)",
      "1 AI bank statement import (lifetime)",
      "Manual bookkeeping after trial",
      "Basic reports",
    ],
  },
  PRO: {
    key: "PRO" as const,
    name: "Pro",
    monthlyPrice: 1900, // 19.00 AED in fils
    annualPrice: 19000, // 190.00 AED in fils
    currency: "AED",
    maxUsers: 2, // base; extra seats at 900 fils/seat/mo
    extraSeatPrice: 900, // 9.00 AED in fils
    journalEntriesPerMonth: null, // unlimited
    monthlyTokens: 150,
    freeAiDocs: null, // unlimited (uses tokens)
    freeAiStatements: null, // unlimited
    topUpAllowed: true,
    topUpPrice: 3500, // 35.00 AED = 250 tokens
    topUpTokens: 250,
    features: [
      "2 users included (+9 AED/user/mo)",
      "Unlimited journal entries",
      "150 AI tokens/month (auto-refresh)",
      "Unlimited AI document processing",
      "Unlimited bank statement imports",
      "AI token top-ups available",
      "Priority support",
      "Advanced reports & analytics",
    ],
  },
} as const;

export type PlanKey = keyof typeof PLANS;

// Stripe price IDs — set these after creating products in Stripe Dashboard
export const STRIPE_PRICES = {
  PRO_MONTHLY: process.env.STRIPE_PRICE_PRO_MONTHLY || "",
  PRO_ANNUAL: process.env.STRIPE_PRICE_PRO_ANNUAL || "",
  EXTRA_SEAT: process.env.STRIPE_PRICE_EXTRA_SEAT || "",
  TOKEN_TOPUP: process.env.STRIPE_PRICE_TOKEN_TOPUP || "",
} as const;

export const STRIPE_LAUNCH_COUPON = process.env.STRIPE_LAUNCH_COUPON || "";

/** Format fils to AED string, e.g. 1900 → "19.00" */
export function formatAED(fils: number): string {
  return (fils / 100).toFixed(2);
}

/** Human-readable price, e.g. "19 AED/mo" */
export function formatPlanPrice(
  plan: (typeof PLANS)[PlanKey],
  interval: "monthly" | "annual"
): string {
  const price =
    interval === "monthly" ? plan.monthlyPrice : plan.annualPrice;
  if (price === 0) return "Free";
  const aed = price / 100;
  const suffix = interval === "monthly" ? "/mo" : "/yr";
  return `${aed} AED${suffix}`;
}
