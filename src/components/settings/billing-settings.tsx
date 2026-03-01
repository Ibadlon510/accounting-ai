"use client";

import { useState, useEffect } from "react";
import { useCurrentOrgId } from "@/hooks/use-organization";
import { Button } from "@/components/ui/button";
import {
  CreditCard,
  Zap,
  Users,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Crown,
  Sparkles,
  Rocket,
} from "lucide-react";
import { showError } from "@/lib/utils/toast-helpers";

interface BillingStatus {
  plan: string;
  planDetails: {
    name: string;
    monthlyTokens: number;
    journalEntriesPerMonth: number | null;
    features: string[];
  };
  tokenBalance: number;
  freeAiDocsUsed: number;
  freeAiStatementsUsed: number;
  maxUsers: number;
  currentUsers: number;
  hasStripeCustomer: boolean;
  hasActiveSubscription: boolean;
  subscriptionStatus: string;
  currentPeriodEnd: string | null;
  canManageBilling: boolean;
}

export function BillingSettings() {
  const orgId = useCurrentOrgId();
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!orgId) return;
    fetch(`/api/billing/status?orgId=${orgId}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setStatus(data))
      .catch(() => setStatus(null))
      .finally(() => setLoading(false));
  }, [orgId]);

  async function handleCheckout(priceKey: string) {
    if (!orgId) return;
    setActionLoading(priceKey);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId, priceKey }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        showError("Checkout failed", data.error || "Please try again.");
      }
    } catch {
      showError("Checkout failed", "Network error. Please try again.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handlePortal() {
    if (!orgId) return;
    setActionLoading("portal");
    try {
      const res = await fetch("/api/billing/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        showError("Portal error", data.error || "Please try again.");
      }
    } catch {
      showError("Portal error", "Network error. Please try again.");
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="dashboard-card flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-text-secondary" />
        <span className="ml-2 text-[14px] text-text-secondary">Loading billing info...</span>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="dashboard-card">
        <p className="text-[14px] text-text-secondary">Unable to load billing information.</p>
      </div>
    );
  }

  const isFree = status.plan === "FREE";
  const isPro = status.plan === "PRO";

  return (
    <div className="space-y-6">
      {/* Current Plan Card */}
      <div className="dashboard-card">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[18px] font-semibold text-text-primary">
                Current Plan
              </h2>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${
                  isPro
                    ? "bg-accent-yellow/15 text-accent-yellow"
                    : "bg-text-primary/10 text-text-primary"
                }`}
              >
                {isPro && <Crown className="h-3 w-3" />}
                {status.planDetails.name}
              </span>
            </div>
            <p className="mt-1 text-[13px] text-text-secondary">
              {isPro
                ? "You have full access to all features."
                : "Upgrade to Pro for unlimited features."}
            </p>
          </div>
          {status.canManageBilling && isPro && status.hasActiveSubscription && (
            <Button
              variant="outline"
              onClick={handlePortal}
              disabled={!!actionLoading}
              className="h-9 gap-1.5 rounded-xl border-border-subtle text-[13px] font-medium text-text-secondary hover:text-text-primary"
            >
              {actionLoading === "portal" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ArrowUpRight className="h-3.5 w-3.5" />
              )}
              Manage Subscription
            </Button>
          )}
        </div>

        {/* Plan Features */}
        <div className="mt-5 grid grid-cols-2 gap-2">
          {status.planDetails.features.map((feature) => (
            <div key={feature} className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" strokeWidth={2} />
              <span className="text-[13px] text-text-secondary">{feature}</span>
            </div>
          ))}
        </div>

        {/* Subscription status */}
        {isPro && status.currentPeriodEnd && (
          <div className="mt-4 rounded-lg bg-surface/50 px-3 py-2 text-[12px] text-text-meta">
            {status.subscriptionStatus === "active"
              ? `Next billing: ${new Date(status.currentPeriodEnd).toLocaleDateString()}`
              : `Status: ${status.subscriptionStatus}`}
          </div>
        )}
      </div>

      {/* Usage Stats */}
      <div className="dashboard-card">
        <h2 className="text-[18px] font-semibold text-text-primary">Usage</h2>
        <p className="mt-1 text-[13px] text-text-secondary">
          Current usage for this billing period
        </p>

        <div className="mt-5 grid grid-cols-3 gap-4">
          {/* AI Tokens */}
          <div className="rounded-xl border border-border-subtle px-4 py-3">
            <div className="flex items-center gap-2 text-[12px] font-medium text-text-meta">
              <Sparkles className="h-3.5 w-3.5" />
              AI Tokens
            </div>
            <div className="mt-1 text-[22px] font-bold text-text-primary">
              {isPro ? status.tokenBalance : "—"}
            </div>
            <div className="text-[12px] text-text-secondary">
              {isPro
                ? `of ${status.planDetails.monthlyTokens}/mo`
                : "Upgrade to Pro for AI tokens"}
            </div>
          </div>

          {/* Users */}
          <div className="rounded-xl border border-border-subtle px-4 py-3">
            <div className="flex items-center gap-2 text-[12px] font-medium text-text-meta">
              <Users className="h-3.5 w-3.5" />
              Users
            </div>
            <div className="mt-1 text-[22px] font-bold text-text-primary">
              {status.currentUsers}
            </div>
            <div className="text-[12px] text-text-secondary">
              of {status.maxUsers} allowed
            </div>
          </div>

          {/* AI Scans (Free plan) or JE count */}
          <div className="rounded-xl border border-border-subtle px-4 py-3">
            <div className="flex items-center gap-2 text-[12px] font-medium text-text-meta">
              <Zap className="h-3.5 w-3.5" />
              {isFree ? "AI Doc Scans" : "Journal Entries"}
            </div>
            <div className="mt-1 text-[22px] font-bold text-text-primary">
              {isFree ? `${status.freeAiDocsUsed}/5` : "∞"}
            </div>
            <div className="text-[12px] text-text-secondary">
              {isFree ? "lifetime free scans" : "unlimited"}
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade / Token Top-up */}
      {status.canManageBilling && (
        <div className="dashboard-card">
          <h2 className="text-[18px] font-semibold text-text-primary">
            {isFree ? "Upgrade to Pro" : "Token Top-up"}
          </h2>
          <p className="mt-1 text-[13px] text-text-secondary">
            {isFree
              ? "Unlock unlimited journal entries, AI tokens, and multi-user access."
              : "Running low on AI tokens? Purchase a top-up pack."}
          </p>

          {isFree && (
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-accent-yellow/10 border border-accent-yellow/25 px-3 py-1 text-[12px] font-bold text-accent-yellow">
              <Rocket className="h-3.5 w-3.5" />
              Launch Offer — 50% Off
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-3">
            {isFree && (
              <>
                <Button
                  onClick={() => handleCheckout("PRO_MONTHLY")}
                  disabled={!!actionLoading}
                  className="h-10 gap-2 rounded-xl bg-text-primary px-6 text-[13px] font-semibold text-white hover:bg-text-primary/90"
                >
                  {actionLoading === "PRO_MONTHLY" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CreditCard className="h-3.5 w-3.5" />
                  )}
                  <span className="line-through text-white/50">38 AED</span>
                  19 AED/month
                </Button>
                <Button
                  onClick={() => handleCheckout("PRO_ANNUAL")}
                  disabled={!!actionLoading}
                  variant="outline"
                  className="h-10 gap-2 rounded-xl border-border-subtle px-6 text-[13px] font-medium text-text-primary hover:bg-black/5"
                >
                  {actionLoading === "PRO_ANNUAL" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CreditCard className="h-3.5 w-3.5" />
                  )}
                  <span className="line-through text-text-meta">380 AED</span>
                  190 AED/year
                  <span className="text-[11px] text-success font-semibold">Save 50%</span>
                </Button>
              </>
            )}

            {isPro && (
              <Button
                onClick={() => handleCheckout("TOKEN_TOPUP")}
                disabled={!!actionLoading}
                className="h-10 gap-2 rounded-xl bg-text-primary px-6 text-[13px] font-semibold text-white hover:bg-text-primary/90"
              >
                {actionLoading === "TOKEN_TOPUP" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Zap className="h-3.5 w-3.5" />
                )}
                Buy 250 tokens — 35 AED
              </Button>
            )}
          </div>

          {isFree && (
            <div className="mt-4 flex items-start gap-2 rounded-lg bg-accent-yellow/5 px-3 py-2">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-yellow" />
              <p className="text-[12px] text-text-secondary">
                Free plan limited to 25 journal entries/month, 5 AI doc scans, and 1 bank statement import (lifetime).
              </p>
            </div>
          )}
        </div>
      )}

      {!status.canManageBilling && (
        <div className="dashboard-card border border-border-subtle">
          <p className="text-[13px] text-text-secondary">
            Only organization owners and admins can manage billing.
          </p>
        </div>
      )}
    </div>
  );
}
