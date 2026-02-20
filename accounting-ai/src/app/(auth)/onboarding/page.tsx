"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { showError } from "@/lib/utils/toast-helpers";
import { StyledSelect } from "@/components/ui/styled-select";
import { ArrowLeft } from "lucide-react";

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

    const { createOrganizationAndLaunch } = await import("./actions");
    const result = await createOrganizationAndLaunch({
      companyName: orgName,
      currency,
      fiscalYearStart: fiscalYear,
      trn: trn || undefined,
    });

    if (result.ok && result.redirect) {
      router.push(result.redirect);
      router.refresh();
    } else {
      setLoading(false);
      if (!result.ok && "error" in result) {
        console.error(result.error);
        showError("Onboarding failed", String(result.error));
      }
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

        <Button
          type="submit"
          disabled={loading}
          className="h-11 w-full rounded-xl bg-text-primary text-[14px] font-semibold text-white hover:bg-text-primary/90"
        >
          {loading ? "Setting up..." : "Launch Agar"}
        </Button>
      </form>
    </div>
  );
}
