"use client";

import { useState, useEffect } from "react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Building2,
  CreditCard,
  Users,
  Shield,
  Bell,
  Palette,
} from "lucide-react";
import { showSuccess, showError } from "@/lib/utils/toast-helpers";
import { StyledSelect } from "@/components/ui/styled-select";

const tabs = [
  { id: "organization", label: "Organization", icon: Building2 },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "team", label: "Team", icon: Users },
  { id: "security", label: "Security", icon: Shield },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "appearance", label: "Appearance", icon: Palette },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("organization");

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Workspaces", href: "/workspaces" },
          { label: "Settings" },
        ]}
      />

      <PageHeader title="Settings" showActions={false} />

      <div className="grid grid-cols-12 gap-8">
        {/* Sidebar tabs */}
        <div className="col-span-3">
          <nav className="flex flex-col gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-[14px] transition-colors ${
                    activeTab === tab.id
                      ? "bg-surface font-semibold text-text-primary shadow-sm"
                      : "text-text-secondary hover:bg-black/5 hover:text-text-primary"
                  }`}
                  style={
                    activeTab === tab.id
                      ? { boxShadow: "var(--shadow-card)" }
                      : undefined
                  }
                >
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="col-span-9">
          {activeTab === "organization" && <OrganizationSettings />}
          {activeTab === "appearance" && <AppearanceSettings />}
          {activeTab !== "organization" && activeTab !== "appearance" && (
            <div className="dashboard-card">
              <h2 className="text-[18px] font-semibold text-text-primary">
                {tabs.find((t) => t.id === activeTab)?.label}
              </h2>
              <p className="mt-2 text-[14px] text-text-secondary">
                This section will be available soon.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function OrganizationSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    currency: "AED",
    taxRegistrationNumber: "",
    fiscalYearStart: 1,
  });

  useEffect(() => {
    fetch("/api/org/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.organization) {
          const org = data.organization;
          setForm({
            name: org.name ?? "",
            currency: org.currency ?? "AED",
            taxRegistrationNumber: org.taxRegistrationNumber ?? "",
            fiscalYearStart: org.fiscalYearStart ?? 1,
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/org/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        showSuccess("Settings saved", "Organization settings updated.");
      } else {
        const data = await res.json().catch(() => ({}));
        showError("Save failed", data.error ?? "Failed to save settings.");
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="dashboard-card py-8 text-center text-text-secondary">Loading settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="dashboard-card">
        <h2 className="text-[18px] font-semibold text-text-primary">
          Organization Profile
        </h2>
        <p className="mt-1 text-[13px] text-text-secondary">
          Manage your company information
        </p>

        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-text-primary">
              Company Name
            </label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="h-11 rounded-xl border-border-subtle bg-transparent text-[14px] focus-visible:ring-text-primary/20"
            />
          </div>
        </div>
      </div>

      <div className="dashboard-card">
        <h2 className="text-[18px] font-semibold text-text-primary">
          Tax & Fiscal Configuration
        </h2>
        <p className="mt-1 text-[13px] text-text-secondary">
          VAT registration and fiscal year settings
        </p>

        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-text-primary">
                TRN (Tax Registration Number)
              </label>
              <Input
                value={form.taxRegistrationNumber}
                onChange={(e) => setForm((f) => ({ ...f, taxRegistrationNumber: e.target.value }))}
                className="h-11 rounded-xl border-border-subtle bg-transparent text-[14px] focus-visible:ring-text-primary/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-text-primary">
                Base Currency
              </label>
              <StyledSelect
                value={form.currency}
                onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                className="h-11 text-[14px]"
              >
                <option value="AED">AED — UAE Dirham</option>
                <option value="USD">USD — US Dollar</option>
                <option value="EUR">EUR — Euro</option>
              </StyledSelect>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-text-primary">
              Fiscal Year Start Month
            </label>
            <StyledSelect
              value={form.fiscalYearStart}
              onChange={(e) => setForm((f) => ({ ...f, fiscalYearStart: Number(e.target.value) }))}
              className="h-11 max-w-xs text-[14px]"
            >
              <option value="1">January</option>
              <option value="4">April</option>
              <option value="7">July</option>
              <option value="10">October</option>
            </StyledSelect>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="h-10 rounded-xl bg-text-primary px-6 text-[13px] font-semibold text-white hover:bg-text-primary/90"
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function AppearanceSettings() {
  const [theme, setTheme] = useState("light");

  return (
    <div className="dashboard-card">
      <h2 className="text-[18px] font-semibold text-text-primary">
        Appearance
      </h2>
      <p className="mt-1 text-[13px] text-text-secondary">
        Customize the look and feel
      </p>

      <div className="mt-6">
        <label className="mb-3 block text-[13px] font-medium text-text-primary">
          Theme
        </label>
        <div className="flex gap-3">
          {(["light", "dark", "system"] as const).map((option) => (
            <button
              key={option}
              onClick={() => {
                setTheme(option);
                if (option === "dark") {
                  document.documentElement.classList.add("dark");
                } else if (option === "light") {
                  document.documentElement.classList.remove("dark");
                } else {
                  const isDark = window.matchMedia(
                    "(prefers-color-scheme: dark)"
                  ).matches;
                  document.documentElement.classList.toggle("dark", isDark);
                }
              }}
              className={`rounded-xl border px-6 py-3 text-[13px] font-medium capitalize transition-all ${
                theme === option
                  ? "border-text-primary bg-text-primary text-white"
                  : "border-border-subtle text-text-secondary hover:border-text-primary/30 hover:text-text-primary"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
