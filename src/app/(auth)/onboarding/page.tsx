"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

export default function OnboardingPage() {
  const router = useRouter();
  const [orgName, setOrgName] = useState("");
  const [currency, setCurrency] = useState("AED");
  const [fiscalYear, setFiscalYear] = useState(1);
  const [trn, setTrn] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSetup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    // TODO: Create organization in database via server action
    // For now, redirect to dashboard
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="w-full max-w-[440px]">
      <div className="dashboard-card">
        {/* Logo */}
        <div className="mb-8 flex items-center gap-2">
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
          <span className="text-[17px] font-bold text-text-primary">
            AccountingAI
          </span>
        </div>

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
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="h-11 w-full rounded-xl border border-border-subtle bg-transparent px-3 text-[14px] text-text-primary outline-none focus:ring-2 focus:ring-text-primary/20"
              >
                {currencies.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-text-primary">
                Fiscal Year Start
              </label>
              <select
                value={fiscalYear}
                onChange={(e) => setFiscalYear(Number(e.target.value))}
                className="h-11 w-full rounded-xl border border-border-subtle bg-transparent px-3 text-[14px] text-text-primary outline-none focus:ring-2 focus:ring-text-primary/20"
              >
                {fiscalMonths.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="h-11 w-full rounded-xl bg-text-primary text-[14px] font-semibold text-white hover:bg-text-primary/90"
          >
            {loading ? "Setting up..." : "Launch AccountingAI"}
          </Button>
        </form>
      </div>
    </div>
  );
}
