"use client";

import { useState, useEffect } from "react";
import { useCurrentOrgId } from "@/hooks/use-organization";
import { Button } from "@/components/ui/button";
import {
  Crown,
  Sparkles,
  Rocket,
  X,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { showError } from "@/lib/utils/toast-helpers";

const DISMISS_KEY = "agar_upsell_dismissed";

export function LoginUpsell() {
  const orgId = useCurrentOrgId();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    // If user already dismissed this session, don't show again until next login
    if (sessionStorage.getItem(DISMISS_KEY)) return;

    let cancelled = false;

    // Small delay so the dashboard paints first
    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/org/current", { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (!cancelled && data.subscriptionPlan === "FREE") {
          setShow(true);
        }
      } catch {
        // Silent — will retry on next mount / navigation
      }
    }, 800);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  function dismiss() {
    setShow(false);
    sessionStorage.setItem(DISMISS_KEY, "1");
  }

  async function handleCheckout(priceKey: string) {
    if (!orgId) return;
    setLoading(priceKey);
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
      setLoading(null);
    }
  }

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={dismiss}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl bg-surface border border-border-subtle shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Close */}
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-text-meta hover:text-text-primary hover:bg-black/5 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-6 sm:p-8">
          {/* Icon */}
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-yellow/10">
            <Crown className="h-7 w-7 text-accent-yellow" />
          </div>

          {/* Title & Message */}
          <h2 className="text-center text-[20px] font-bold text-text-primary">
            Welcome back! Ready to go Pro?
          </h2>
          <p className="mt-2 text-center text-[14px] leading-relaxed text-text-secondary">
            Unlock the full power of AI-driven accounting — unlimited scans,
            smart categorization, and priority support.
          </p>

          {/* Launch offer badge */}
          <div className="mt-4 flex justify-center">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-accent-yellow/10 border border-accent-yellow/25 px-3 py-1 text-[12px] font-bold text-accent-yellow">
              <Rocket className="h-3.5 w-3.5" />
              Launch Offer — 50% Off
            </div>
          </div>

          {/* CTAs */}
          <div className="mt-5 space-y-3">
            <Button
              onClick={() => handleCheckout("PRO_MONTHLY")}
              disabled={!!loading}
              className="h-11 w-full gap-2 rounded-xl bg-text-primary text-[14px] font-semibold text-white hover:bg-text-primary/90"
            >
              {loading === "PRO_MONTHLY" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Crown className="h-4 w-4" />
              )}
              <span className="line-through text-white/50">38 AED</span>
              Upgrade to Pro — 19 AED/mo
            </Button>
            <Button
              onClick={() => handleCheckout("PRO_ANNUAL")}
              disabled={!!loading}
              variant="outline"
              className="h-11 w-full gap-2 rounded-xl border-border-subtle text-[14px] font-medium text-text-primary hover:bg-black/5"
            >
              {loading === "PRO_ANNUAL" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
              <span className="line-through text-text-meta">380 AED</span>
              190 AED/year
              <span className="text-[11px] font-semibold text-[var(--success)]">
                Save 50%
              </span>
            </Button>
          </div>

          {/* Pro features summary */}
          <div className="mt-5 rounded-xl border border-border-subtle bg-surface/50 p-4">
            <p className="mb-2 text-[12px] font-semibold text-text-primary">
              Pro includes:
            </p>
            <ul className="space-y-1.5">
              {[
                "Unlimited journal entries",
                "150 AI tokens/month",
                "Unlimited document processing",
                "2 users (+9 AED/seat)",
                "Priority support",
              ].map((f) => (
                <li
                  key={f}
                  className="flex items-center gap-2 text-[12px] text-text-secondary"
                >
                  <Sparkles className="h-3 w-3 shrink-0 text-accent-yellow" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Dismiss */}
          <button
            onClick={dismiss}
            className="mt-4 w-full text-center text-[13px] font-medium text-text-meta hover:text-text-primary transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
