"use client";

import { useState } from "react";
import { useCurrentOrgId } from "@/hooks/use-organization";
import { Button } from "@/components/ui/button";
import {
  Crown,
  Sparkles,
  Zap,
  FileText,
  Users,
  X,
  Loader2,
  ArrowRight,
  Rocket,
} from "lucide-react";
import { showError } from "@/lib/utils/toast-helpers";

type UpgradeReason =
  | "journal_limit"
  | "ai_docs_exhausted"
  | "ai_statement_exhausted"
  | "tokens_exhausted"
  | "user_limit"
  | "general";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  reason?: UpgradeReason;
  message?: string;
}

const reasonConfig: Record<
  UpgradeReason,
  { icon: typeof Crown; title: string; defaultMessage: string }
> = {
  journal_limit: {
    icon: FileText,
    title: "Journal Entry Limit Reached",
    defaultMessage:
      "You've used all 25 journal entries this month on the Free plan.",
  },
  ai_docs_exhausted: {
    icon: Sparkles,
    title: "AI Document Scans Used Up",
    defaultMessage:
      "You've used all 5 free AI document scans. Upgrade to Pro for unlimited AI processing.",
  },
  ai_statement_exhausted: {
    icon: Zap,
    title: "AI Bank Import Used",
    defaultMessage:
      "You've used your free AI bank statement import. Upgrade to Pro for unlimited imports.",
  },
  tokens_exhausted: {
    icon: Sparkles,
    title: "AI Tokens Exhausted",
    defaultMessage:
      "You're out of AI tokens. Purchase a top-up or wait for your monthly refresh.",
  },
  user_limit: {
    icon: Users,
    title: "User Limit Reached",
    defaultMessage:
      "Your plan's user limit has been reached. Upgrade for more seats.",
  },
  general: {
    icon: Crown,
    title: "Upgrade to Pro",
    defaultMessage: "Unlock the full power of AI-driven accounting.",
  },
};

export function UpgradeModal({
  open,
  onClose,
  reason = "general",
  message,
}: UpgradeModalProps) {
  const orgId = useCurrentOrgId();
  const [loading, setLoading] = useState<string | null>(null);

  const config = reasonConfig[reason];
  const Icon = config.icon;
  const isTokenIssue = reason === "tokens_exhausted";

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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl bg-surface border border-border-subtle shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-text-meta hover:text-text-primary hover:bg-black/5 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-6 sm:p-8">
          {/* Icon */}
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-yellow/10">
            <Icon className="h-7 w-7 text-accent-yellow" />
          </div>

          {/* Title & Message */}
          <h2 className="text-center text-[20px] font-bold text-text-primary">
            {config.title}
          </h2>
          <p className="mt-2 text-center text-[14px] leading-relaxed text-text-secondary">
            {message || config.defaultMessage}
          </p>

          {/* Actions */}
          <div className="mt-6 space-y-3">
            {isTokenIssue ? (
              <>
                <Button
                  onClick={() => handleCheckout("TOKEN_TOPUP")}
                  disabled={!!loading}
                  className="h-11 w-full gap-2 rounded-xl bg-text-primary text-[14px] font-semibold text-white hover:bg-text-primary/90"
                >
                  {loading === "TOKEN_TOPUP" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4" />
                  )}
                  Buy 250 Tokens — 35 AED
                </Button>
                <p className="text-center text-[12px] text-text-meta">
                  Tokens are added instantly and stack with your monthly allocation.
                </p>
              </>
            ) : (
              <>
                <div className="mb-3 flex items-center justify-center gap-1.5 rounded-full bg-accent-yellow/10 border border-accent-yellow/25 px-3 py-1 text-[12px] font-bold text-accent-yellow">
                  <Rocket className="h-3.5 w-3.5" />
                  Launch Offer — 50% Off
                </div>
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
              </>
            )}
          </div>

          {/* Pro features summary */}
          {!isTokenIssue && (
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
          )}

          {/* Dismiss */}
          <button
            onClick={onClose}
            className="mt-4 w-full text-center text-[13px] font-medium text-text-meta hover:text-text-primary transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
