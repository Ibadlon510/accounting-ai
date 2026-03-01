"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { showError } from "@/lib/utils/toast-helpers";
import { StyledSelect } from "@/components/ui/styled-select";
import { ArrowLeft, Database, Check, Sparkles, Loader2, Zap, Crown } from "lucide-react";

const currencies = [
  { code: "AED", label: "AED — UAE Dirham" },
  { code: "USD", label: "USD — US Dollar" },
  { code: "EUR", label: "EUR — Euro" },
  { code: "GBP", label: "GBP — British Pound" },
  { code: "SAR", label: "SAR — Saudi Riyal" },
  { code: "INR", label: "INR — Indian Rupee" },
];

const fiscalMonths = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

const FREE_FEATURES = [
  "1 user",
  "25 journal entries/month",
  "5 AI document scans (lifetime)",
  "1 AI bank statement import",
  "Basic reports",
];

const PRO_FEATURES = [
  "2 users included (+9 AED/user)",
  "Unlimited journal entries",
  "150 AI tokens/month (auto-refresh)",
  "Unlimited AI document processing",
  "Unlimited bank statement imports",
  "Priority support",
  "Advanced reports & analytics",
];

type Step = "org-setup" | "plan-selection";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("org-setup");
  const [orgId, setOrgId] = useState<string | null>(null);
  const [orgName, setOrgName] = useState("");

  const [currency, setCurrency] = useState("AED");
  const [fiscalYear, setFiscalYear] = useState(1);
  const [trn, setTrn] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadDemo, setLoadDemo] = useState(false);
  const [status, setStatus] = useState("");
  const [billingInterval, setBillingInterval] = useState<"monthly" | "annual">("monthly");
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  async function handleSetup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    setStatus("Creating organization...");
    const { createOrganizationAndLaunch } = await import("./actions");
    const result = await createOrganizationAndLaunch({
      companyName: orgName,
      currency,
      fiscalYearStart: fiscalYear,
      trn: trn || undefined,
    });

    if (result.ok) {
      if (loadDemo) {
        setStatus("Loading demo data...");
        try {
          await fetch("/api/org/demo-data", { method: "POST" });
        } catch {
          // non-blocking — demo data is optional
        }
      }
      setOrgId(result.orgId);
      setLoading(false);
      setStatus("");
      setStep("plan-selection");
    } else {
      setLoading(false);
      setStatus("");
      console.error(result.error);
      showError("Onboarding failed", String(result.error));
    }
  }

  async function handleSelectFree() {
    router.push("/dashboard");
    router.refresh();
  }

  async function handleSelectPro() {
    if (!orgId) return;
    setCheckoutLoading(true);

    try {
      const priceKey = billingInterval === "monthly" ? "PRO_MONTHLY" : "PRO_ANNUAL";
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId,
          priceKey,
          successUrl: `${window.location.origin}/dashboard?upgraded=true`,
          cancelUrl: `${window.location.origin}/onboarding?step=plan`,
        }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        showError("Checkout failed", data.error || "Could not start checkout");
        setCheckoutLoading(false);
      }
    } catch {
      showError("Checkout failed", "Something went wrong. Please try again.");
      setCheckoutLoading(false);
    }
  }

  return (
    <div>
      <Link
        href="/login"
        className="mb-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-text-secondary hover:text-text-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back
      </Link>
      {/* Mobile logo */}
      <div className="mb-8 flex items-center gap-2 lg:hidden">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-orange-500">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-5 w-5 text-white"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-[17px] font-bold text-text-primary">Agar</span>
          <span className="text-[12px] font-medium text-text-secondary">Smart Accounting</span>
        </div>
      </div>

      {/* Step indicator */}
      <div className="mb-6 flex items-center gap-2">
        <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
          step === "org-setup" ? "bg-text-primary text-white" : "bg-[var(--success)] text-white"
        }`}>
          {step === "org-setup" ? "1" : <Check className="h-3.5 w-3.5" />}
        </div>
        <div className="h-px w-6 bg-border-subtle" />
        <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
          step === "plan-selection" ? "bg-text-primary text-white" : "bg-border-subtle text-text-meta"
        }`}>
          2
        </div>
      </div>

      {step === "org-setup" ? (
        <>
          <h1 className="text-[24px] font-bold text-text-primary">
            Set up your organization
          </h1>
          <p className="mt-1 text-[14px] text-text-secondary">
            Configure your company details to get started
          </p>

          <form onSubmit={handleSetup} className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-text-primary">
                Company Name
              </label>
              <Input
                type="text"
                placeholder="Al Noor Trading LLC"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                required
                className="h-11 rounded-xl border-border-subtle bg-transparent text-[14px] placeholder:text-text-meta focus-visible:ring-text-primary/20"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-text-primary">
                TRN (Tax Registration Number)
              </label>
              <Input
                type="text"
                placeholder="100XXXXXXXXX003"
                value={trn}
                onChange={(e) => setTrn(e.target.value)}
                className="h-11 rounded-xl border-border-subtle bg-transparent text-[14px] placeholder:text-text-meta focus-visible:ring-text-primary/20"
              />
              <p className="mt-1 text-[11px] text-text-meta">
                Optional — can be added later in Settings
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-text-primary">
                  Currency
                </label>
                <StyledSelect
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="h-11 text-[14px]"
                >
                  {currencies.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </StyledSelect>
              </div>
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-text-primary">
                  Fiscal Year Start
                </label>
                <StyledSelect
                  value={fiscalYear}
                  onChange={(e) => setFiscalYear(Number(e.target.value))}
                  className="h-11 text-[14px]"
                >
                  {fiscalMonths.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </StyledSelect>
              </div>
            </div>

            <label className="flex items-start gap-3 rounded-xl border border-border-subtle p-4 cursor-pointer hover:bg-black/[0.02] transition-colors">
              <input
                type="checkbox"
                checked={loadDemo}
                onChange={(e) => setLoadDemo(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-border-subtle accent-text-primary"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-text-secondary" strokeWidth={1.8} />
                  <span className="text-[13px] font-semibold text-text-primary">Load demo data</span>
                </div>
                <p className="mt-0.5 text-[12px] text-text-meta">
                  Add sample customers, invoices, journal entries, and more to explore the app. You can remove it later in Settings.
                </p>
              </div>
            </label>

            <Button
              type="submit"
              disabled={loading}
              className="h-11 w-full rounded-xl bg-text-primary text-[14px] font-semibold text-white hover:bg-text-primary/90"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {status || "Setting up..."}
                </span>
              ) : (
                "Continue"
              )}
            </Button>
          </form>
        </>
      ) : (
        <>
          <h1 className="text-[24px] font-bold text-text-primary">
            Choose your plan
          </h1>
          <p className="mt-1 text-[14px] text-text-secondary">
            Start free or unlock the full power of AI accounting
          </p>

          {/* Billing interval toggle */}
          <div className="mt-5 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setBillingInterval("monthly")}
              className={`rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors ${
                billingInterval === "monthly"
                  ? "bg-text-primary text-white"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingInterval("annual")}
              className={`rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors ${
                billingInterval === "annual"
                  ? "bg-text-primary text-white"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Annual
              <span className="ml-1 text-[10px] font-bold text-[var(--success)]">Save 17%</span>
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {/* Free Plan Card */}
            <div className="rounded-2xl border border-border-subtle p-5 transition-shadow hover:shadow-sm">
              <div className="flex items-center gap-2">
                <Zap className="h-4.5 w-4.5 text-text-secondary" strokeWidth={1.8} />
                <h3 className="text-[16px] font-bold text-text-primary">Free</h3>
              </div>
              <p className="mt-1 text-[22px] font-bold text-text-primary">
                0 AED
                <span className="text-[13px] font-normal text-text-meta"> forever</span>
              </p>
              <ul className="mt-4 space-y-2">
                {FREE_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-[13px] text-text-secondary">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-text-meta" strokeWidth={2} />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                type="button"
                variant="outline"
                onClick={handleSelectFree}
                className="mt-5 h-10 w-full rounded-xl border-border-subtle text-[13px] font-semibold text-text-primary hover:bg-black/5"
              >
                Start Free
              </Button>
            </div>

            {/* Pro Plan Card */}
            <div className="relative rounded-2xl border-2 border-text-primary p-5 shadow-sm">
              <div className="absolute -top-3 left-4 rounded-full bg-text-primary px-3 py-0.5 text-[10px] font-bold text-white">
                RECOMMENDED
              </div>
              <div className="flex items-center gap-2">
                <Crown className="h-4.5 w-4.5 text-[var(--accent-ai)]" strokeWidth={1.8} />
                <h3 className="text-[16px] font-bold text-text-primary">Pro</h3>
              </div>
              <p className="mt-1 text-[22px] font-bold text-text-primary">
                {billingInterval === "monthly" ? "19" : "190"} AED
                <span className="text-[13px] font-normal text-text-meta">
                  /{billingInterval === "monthly" ? "mo" : "yr"}
                </span>
              </p>
              <ul className="mt-4 space-y-2">
                {PRO_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-[13px] text-text-secondary">
                    <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--accent-ai)]" strokeWidth={2} />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                type="button"
                onClick={handleSelectPro}
                disabled={checkoutLoading}
                className="mt-5 h-10 w-full rounded-xl bg-text-primary text-[13px] font-semibold text-white hover:bg-text-primary/90"
              >
                {checkoutLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Redirecting to checkout...
                  </span>
                ) : (
                  `Start Pro — ${billingInterval === "monthly" ? "19 AED/mo" : "190 AED/yr"}`
                )}
              </Button>
            </div>
          </div>

          <p className="mt-4 text-center text-[11px] text-text-meta">
            You can change your plan anytime in Settings.
          </p>
        </>
      )}
    </div>
  );
}
