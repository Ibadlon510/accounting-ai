"use client";

import { useState, useEffect, useCallback } from "react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Building2,
  CreditCard,
  Users,
  Shield,
  Bell,
  Palette,
  Database,
  AlertTriangle,
  FileCode2,
  FileText,
  Mail,
  MailCheck,
  ArrowLeftRight,
  Plus,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { showSuccess, showError } from "@/lib/utils/toast-helpers";
import { setOrgFormatting } from "@/lib/formatting";
import { StyledSelect } from "@/components/ui/styled-select";
import { BillingSettings } from "@/components/settings/billing-settings";
import { TeamSettings } from "@/components/settings/team-settings";
import { SecuritySettings } from "@/components/settings/security-settings";
import { NotificationSettings } from "@/components/settings/notification-settings";
import { TemplateSettings } from "@/components/settings/template-settings";
import { EmailTemplateSettings } from "@/components/settings/email-template-settings";
import { EmailHistorySettings } from "@/components/settings/email-history-settings";
import { DocumentDefaultsSettings } from "@/components/settings/document-defaults-settings";
import { ImportExportButtons } from "@/components/import-export/import-export-buttons";

const tabs = [
  { id: "organization", label: "Organization", icon: Building2 },
  { id: "database", label: "Database", icon: Database },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "team", label: "Team", icon: Users },
  { id: "security", label: "Security", icon: Shield },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "document-defaults", label: "Document Defaults", icon: FileText },
  { id: "pdf-templates", label: "PDF Templates", icon: FileCode2 },
  { id: "email-templates", label: "Email Templates", icon: Mail },
  { id: "email-history", label: "Email History", icon: MailCheck },
  { id: "import-export", label: "Data Import/Export", icon: ArrowLeftRight },
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
          {activeTab === "database" && <DatabaseSettings />}
          {activeTab === "billing" && <BillingSettings />}
          {activeTab === "team" && <TeamSettings />}
          {activeTab === "security" && <SecuritySettings />}
          {activeTab === "notifications" && <NotificationSettings />}
          {activeTab === "appearance" && <AppearanceSettings />}
          {activeTab === "document-defaults" && <DocumentDefaultsSettings />}
          {activeTab === "pdf-templates" && <TemplateSettings />}
          {activeTab === "email-templates" && <EmailTemplateSettings />}
          {activeTab === "email-history" && <EmailHistorySettings />}
          {activeTab === "import-export" && <DataImportExportSettings />}
          {!["organization","database","billing","team","security","notifications","appearance","document-defaults","pdf-templates","email-templates","email-history","import-export"].includes(activeTab) && (
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
  const [orgTaxCodes, setOrgTaxCodes] = useState<{id: string; code: string; name: string; rate: string}[]>([]);
  const [form, setForm] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    currency: "AED",
    taxRegistrationNumber: "",
    fiscalYearStart: 1,
    emailFromName: "",
    emailReplyTo: "",
    emailSignatureHtml: "",
    emailDefaultCc: "",
    autoSendOnInvoiceConfirm: false,
    autoSendOnPaymentReceipt: false,
    numberFormat: "1,234.56",
    dateFormat: "DD/MM/YYYY",
    isVatRegistered: false,
    taxLabel: "VAT",
    defaultTaxCodeId: "" as string | null,
  });

  useEffect(() => {
    fetch("/api/org/settings", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.organization) {
          const org = data.organization;
          setForm({
            name: org.name ?? "",
            address: org.address ?? "",
            phone: org.phone ?? "",
            email: org.email ?? "",
            currency: org.currency ?? "AED",
            taxRegistrationNumber: org.taxRegistrationNumber ?? "",
            fiscalYearStart: org.fiscalYearStart ?? 1,
            emailFromName: org.emailFromName ?? "",
            emailReplyTo: org.emailReplyTo ?? "",
            emailSignatureHtml: org.emailSignatureHtml ?? "",
            emailDefaultCc: org.emailDefaultCc ?? "",
            autoSendOnInvoiceConfirm: org.autoSendOnInvoiceConfirm ?? false,
            autoSendOnPaymentReceipt: org.autoSendOnPaymentReceipt ?? false,
            numberFormat: org.numberFormat ?? "1,234.56",
            dateFormat: org.dateFormat ?? "DD/MM/YYYY",
            isVatRegistered: org.isVatRegistered ?? false,
            taxLabel: org.taxLabel ?? "VAT",
            defaultTaxCodeId: org.defaultTaxCodeId ?? null,
          });
        }
      })
      .finally(() => setLoading(false));
    fetch("/api/org/tax-codes")
      .then((r) => (r.ok ? r.json() : { taxCodes: [] }))
      .then((d) => setOrgTaxCodes((d.taxCodes ?? []).filter((tc: { isActive: boolean }) => tc.isActive)))
      .catch(() => {});
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
        if (form.numberFormat || form.dateFormat) {
          setOrgFormatting(form.numberFormat ?? "1,234.56", form.dateFormat ?? "DD/MM/YYYY");
        }
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
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-text-primary">
              Address
            </label>
            <textarea
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              rows={3}
              placeholder={"Office 301, Business Bay Tower\nDubai, UAE"}
              className="w-full rounded-xl border border-border-subtle bg-transparent p-3 text-[14px] text-text-primary outline-none focus:ring-2 focus:ring-text-primary/20"
            />
            <p className="mt-1 text-[12px] text-text-secondary">
              Appears on invoices, bills, and other documents
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-text-primary">
                Phone
              </label>
              <Input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+971 4 123 4567"
                className="h-11 rounded-xl border-border-subtle bg-transparent text-[14px] focus-visible:ring-text-primary/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-text-primary">
                Email
              </label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="info@company.com"
                className="h-11 rounded-xl border-border-subtle bg-transparent text-[14px] focus-visible:ring-text-primary/20"
              />
            </div>
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

      <div className="dashboard-card">
        <h2 className="text-[18px] font-semibold text-text-primary">
          Number & Date Formatting
        </h2>
        <p className="mt-1 text-[13px] text-text-secondary">
          Choose how numbers and dates are displayed throughout the system
        </p>

        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-text-primary">
                Number Format
              </label>
              <div className="space-y-2">
                {([
                  { value: "1,234.56", label: "1,234.56", desc: "Comma thousands, dot decimal" },
                  { value: "1.234,56", label: "1.234,56", desc: "Dot thousands, comma decimal" },
                  { value: "1 234.56", label: "1 234.56", desc: "Space thousands, dot decimal" },
                  { value: "1 234,56", label: "1 234,56", desc: "Space thousands, comma decimal" },
                ] as const).map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-all ${
                      form.numberFormat === opt.value
                        ? "border-text-primary/30 bg-text-primary/[0.03] shadow-sm"
                        : "border-border-subtle hover:border-border-subtle/80 hover:bg-black/[0.01]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="numberFormat"
                      value={opt.value}
                      checked={form.numberFormat === opt.value}
                      onChange={() => setForm((f) => ({ ...f, numberFormat: opt.value }))}
                      className="accent-text-primary"
                    />
                    <div className="flex-1">
                      <span className="font-mono text-[14px] font-semibold text-text-primary">{opt.label}</span>
                      <p className="text-[12px] text-text-secondary">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-text-primary">
                Date Format
              </label>
              <div className="space-y-2">
                {([
                  { value: "DD/MM/YYYY", example: "24/03/2026" },
                  { value: "MM/DD/YYYY", example: "03/24/2026" },
                  { value: "YYYY-MM-DD", example: "2026-03-24" },
                  { value: "DD MMM YYYY", example: "24 Mar 2026" },
                  { value: "MMM DD, YYYY", example: "Mar 24, 2026" },
                  { value: "DD.MM.YYYY", example: "24.03.2026" },
                ] as const).map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-2.5 transition-all ${
                      form.dateFormat === opt.value
                        ? "border-text-primary/30 bg-text-primary/[0.03] shadow-sm"
                        : "border-border-subtle hover:border-border-subtle/80 hover:bg-black/[0.01]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="dateFormat"
                      value={opt.value}
                      checked={form.dateFormat === opt.value}
                      onChange={() => setForm((f) => ({ ...f, dateFormat: opt.value }))}
                      className="accent-text-primary"
                    />
                    <div className="flex-1 flex items-center justify-between">
                      <span className="text-[13px] font-medium text-text-primary">{opt.value}</span>
                      <span className="font-mono text-[13px] text-text-secondary">{opt.example}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
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

      <div className="dashboard-card">
        <h2 className="text-[18px] font-semibold text-text-primary">
          Tax & Fiscal Configuration
        </h2>
        <p className="mt-1 text-[13px] text-text-secondary">
          Tax registration, fiscal year, and currency settings
        </p>

        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
                <option value="GBP">GBP — British Pound</option>
                <option value="SAR">SAR — Saudi Riyal</option>
                <option value="INR">INR — Indian Rupee</option>
                <option value="AUD">AUD — Australian Dollar</option>
              </StyledSelect>
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-text-primary">
                Fiscal Year Start Month
              </label>
              <StyledSelect
                value={form.fiscalYearStart}
                onChange={(e) => setForm((f) => ({ ...f, fiscalYearStart: Number(e.target.value) }))}
                className="h-11 text-[14px]"
              >
                <option value="1">January</option>
                <option value="4">April</option>
                <option value="7">July</option>
                <option value="10">October</option>
              </StyledSelect>
            </div>
          </div>

          <div className="rounded-xl border border-border-subtle p-4">
            <label className="flex items-center gap-3">
              <Checkbox
                checked={form.isVatRegistered}
                onCheckedChange={(v) => setForm((f) => ({ ...f, isVatRegistered: !!v }))}
              />
              <div>
                <span className="text-[14px] font-medium text-text-primary">
                  Organization is registered for {form.taxLabel || "Tax"}
                </span>
                <p className="text-[12px] text-text-secondary">
                  Enable tax on documents. When disabled, tax will not be applied.
                </p>
              </div>
            </label>

            {form.isVatRegistered && (
              <div className="mt-4 space-y-4 border-t border-border-subtle pt-4">
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
                      Tax Label
                    </label>
                    <Input
                      value={form.taxLabel}
                      onChange={(e) => setForm((f) => ({ ...f, taxLabel: e.target.value }))}
                      placeholder="VAT"
                      className="h-11 rounded-xl border-border-subtle bg-transparent text-[14px] focus-visible:ring-text-primary/20"
                    />
                    <p className="mt-1 text-[12px] text-text-secondary">
                      Appears on documents and reports (e.g., VAT, GST, Sales Tax)
                    </p>
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-text-primary">
                    Default Tax Code
                  </label>
                  <StyledSelect
                    value={form.defaultTaxCodeId ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, defaultTaxCodeId: e.target.value || null }))}
                    className="h-11 text-[14px]"
                  >
                    <option value="">— None —</option>
                    {orgTaxCodes.map(tc => (
                      <option key={tc.id} value={tc.id}>{tc.name} ({tc.rate}%)</option>
                    ))}
                  </StyledSelect>
                  <p className="mt-1 text-[12px] text-text-secondary">
                    Applied to new line items by default
                  </p>
                </div>
              </div>
            )}

            {!form.isVatRegistered && (
              <p className="mt-3 text-[12px] text-text-secondary">
                Tax will not be applied to documents. You can enable this later.
              </p>
            )}
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

      <TaxCodeManagement taxLabel={form.taxLabel} isVatRegistered={form.isVatRegistered} />

      <div className="dashboard-card">
        <h2 className="text-[18px] font-semibold text-text-primary">
          Email Delivery Settings
        </h2>
        <p className="mt-1 text-[13px] text-text-secondary">
          Configure how outgoing document emails are sent
        </p>

        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-text-primary">
                From Name
              </label>
              <Input
                placeholder="e.g. Acme Corp Finance"
                value={form.emailFromName}
                onChange={(e) => setForm((f) => ({ ...f, emailFromName: e.target.value }))}
                className="h-11 rounded-xl border-border-subtle bg-transparent text-[14px] focus-visible:ring-text-primary/20"
              />
              <p className="mt-1 text-[12px] text-text-secondary">
                Display name for outgoing emails
              </p>
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-text-primary">
                Reply-To Address
              </label>
              <Input
                type="email"
                placeholder="e.g. billing@acme.com"
                value={form.emailReplyTo}
                onChange={(e) => setForm((f) => ({ ...f, emailReplyTo: e.target.value }))}
                className="h-11 rounded-xl border-border-subtle bg-transparent text-[14px] focus-visible:ring-text-primary/20"
              />
              <p className="mt-1 text-[12px] text-text-secondary">
                Replies to document emails will go to this address
              </p>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-text-primary">
              Default CC
            </label>
            <Input
              type="email"
              placeholder="e.g. records@acme.com"
              value={form.emailDefaultCc}
              onChange={(e) => setForm((f) => ({ ...f, emailDefaultCc: e.target.value }))}
              className="h-11 rounded-xl border-border-subtle bg-transparent text-[14px] focus-visible:ring-text-primary/20"
            />
            <p className="mt-1 text-[12px] text-text-secondary">
              Automatically CC this address on all document emails
            </p>
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-text-primary">
              Email Signature (HTML)
            </label>
            <textarea
              rows={4}
              placeholder="<p>Regards,<br/>The Acme Finance Team</p>"
              value={form.emailSignatureHtml}
              onChange={(e) => setForm((f) => ({ ...f, emailSignatureHtml: e.target.value }))}
              className="w-full rounded-xl border border-border-subtle bg-transparent px-3 py-2.5 font-mono text-[13px] text-text-primary focus:outline-none focus:ring-2 focus:ring-text-primary/20"
            />
            <p className="mt-1 text-[12px] text-text-secondary">
              Appended to every outgoing document email
            </p>
          </div>
        </div>
      </div>

      <div className="dashboard-card">
        <h2 className="text-[18px] font-semibold text-text-primary">
          Automation
        </h2>
        <p className="mt-1 text-[13px] text-text-secondary">
          Automatically send emails when certain actions happen
        </p>

        <div className="mt-6 space-y-4">
          <label className="flex items-center gap-3">
            <Checkbox
              checked={form.autoSendOnInvoiceConfirm}
              onCheckedChange={(v) => setForm((f) => ({ ...f, autoSendOnInvoiceConfirm: !!v }))}
            />
            <div>
              <span className="text-[14px] font-medium text-text-primary">
                Auto-send invoice on confirmation
              </span>
              <p className="text-[12px] text-text-secondary">
                Automatically email the invoice PDF to the customer when you confirm an invoice
              </p>
            </div>
          </label>
          <label className="flex items-center gap-3">
            <Checkbox
              checked={form.autoSendOnPaymentReceipt}
              onCheckedChange={(v) => setForm((f) => ({ ...f, autoSendOnPaymentReceipt: !!v }))}
            />
            <div>
              <span className="text-[14px] font-medium text-text-primary">
                Auto-send payment receipt
              </span>
              <p className="text-[12px] text-text-secondary">
                Automatically email a payment receipt when a payment is recorded against an invoice
              </p>
            </div>
          </label>
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

const SEED_MODULES = [
  { id: "sales" as const, label: "Sales", desc: "Customers, invoices, payments" },
  { id: "purchases" as const, label: "Purchases", desc: "Suppliers, bills" },
  { id: "banking" as const, label: "Banking", desc: "Bank accounts, transactions" },
  { id: "inventory" as const, label: "Inventory", desc: "Items, movements" },
  { id: "accounting" as const, label: "Accounting", desc: "Journal entries" },
  { id: "vat" as const, label: "VAT", desc: "VAT returns" },
];

function DatabaseSettings() {
  const [hasDemoData, setHasDemoData] = useState<boolean | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [removingDemo, setRemovingDemo] = useState(false);
  const [confirmSeed, setConfirmSeed] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [confirmRemoveDemo, setConfirmRemoveDemo] = useState(false);
  const [selectedModules, setSelectedModules] = useState<Set<string>>(
    () => new Set(SEED_MODULES.map((m) => m.id))
  );

  const fetchHasDemoData = useCallback(() => {
    fetch("/api/org/demo-data", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { hasDemoData: false }))
      .then((data) => setHasDemoData(data.hasDemoData ?? false))
      .catch(() => setHasDemoData(false));
  }, []);

  useEffect(() => {
    fetchHasDemoData();
  }, [fetchHasDemoData]);

  function toggleModule(id: string) {
    setSelectedModules((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllModules() {
    setSelectedModules(new Set(SEED_MODULES.map((m) => m.id)));
  }

  function deselectAllModules() {
    setSelectedModules(new Set());
  }

  async function handleSeed() {
    const modules = [...selectedModules];
    if (modules.length === 0) {
      showError("Select at least one module", "Choose which data to seed.");
      return;
    }
    setConfirmSeed(false);
    setSeeding(true);
    try {
      const res = await fetch("/api/org/demo-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modules }),
      });
      if (res.ok) {
        showSuccess("Demo data loaded", "Selected modules have been seeded.");
      } else {
        const data = await res.json().catch(() => ({}));
        showError("Failed to load demo data", data.error ?? "Please try again.");
      }
    } finally {
      setSeeding(false);
      fetchHasDemoData();
    }
  }

  async function handleRemoveDemo() {
    setConfirmRemoveDemo(false);
    setRemovingDemo(true);
    try {
      const res = await fetch("/api/org/demo-data?demoOnly=true", { method: "DELETE" });
      if (res.ok) {
        showSuccess("Demo data removed", "Only seeded demo data was deleted. Your data is preserved.");
      } else {
        const data = await res.json().catch(() => ({}));
        showError("Failed to remove demo data", data.error ?? "Please try again.");
      }
    } finally {
      setRemovingDemo(false);
      fetchHasDemoData();
    }
  }

  async function handleRemove() {
    setConfirmRemove(false);
    setRemoving(true);
    try {
      const res = await fetch("/api/org/demo-data", { method: "DELETE" });
      if (res.ok) {
        showSuccess("Data removed", "All transactional and master data has been deleted.");
      } else {
        const data = await res.json().catch(() => ({}));
        showError("Failed to remove data", data.error ?? "Please try again.");
      }
    } finally {
      setRemoving(false);
      fetchHasDemoData();
    }
  }

  return (
    <div className="space-y-6">
      {/* Load Demo Data - only when no demo data exists */}
      {hasDemoData === false && (
      <div className="dashboard-card">
        <h2 className="text-[18px] font-semibold text-text-primary">Load Demo Data</h2>
        <p className="mt-1 text-[13px] text-text-secondary">
          Populate your organization with sample 2025 data including customers, suppliers,
          invoices, bills, journal entries, bank transactions, and VAT returns.
        </p>
        <div className="mt-5">
          {!confirmSeed ? (
            <Button
              onClick={() => setConfirmSeed(true)}
              disabled={seeding || removing || removingDemo}
              className="h-10 rounded-xl bg-text-primary px-6 text-[13px] font-semibold text-white hover:bg-text-primary/90"
            >
              {seeding ? "Loading..." : "Load Demo Data"}
            </Button>
          ) : (
            <div className="space-y-4 rounded-xl border border-border-subtle bg-surface/50 px-4 py-4">
              <p className="text-[13px] text-text-secondary">
                Choose which modules to seed. Foundation (chart of accounts, periods, tax codes) is always included. Existing data will not be overwritten.
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {SEED_MODULES.map((m) => (
                  <label
                    key={m.id}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-border-subtle px-3 py-2 hover:bg-surface/50"
                  >
                    <Checkbox
                      checked={selectedModules.has(m.id)}
                      onCheckedChange={() => toggleModule(m.id)}
                    />
                    <div>
                      <span className="text-[13px] font-medium text-text-primary">{m.label}</span>
                      <span className="ml-1.5 text-[12px] text-text-secondary">— {m.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={selectAllModules}
                  className="text-[12px] font-medium text-text-secondary underline hover:text-text-primary"
                >
                  Select all
                </button>
                <button
                  type="button"
                  onClick={deselectAllModules}
                  className="text-[12px] font-medium text-text-secondary underline hover:text-text-primary"
                >
                  Deselect all
                </button>
                <div className="ml-auto flex items-center gap-2">
              <Button
                onClick={handleSeed}
                disabled={seeding || removing || removingDemo || selectedModules.size === 0}
                    className="h-9 rounded-xl bg-text-primary px-5 text-[12px] font-semibold text-white hover:bg-text-primary/90"
                  >
                    {seeding ? "Loading..." : "Confirm"}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setConfirmSeed(false)}
                    className="h-9 rounded-xl text-[12px] font-medium text-text-secondary"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Remove Demo Data - only when demo data exists */}
      {hasDemoData === true && (
      <div className="dashboard-card border border-border-subtle">
        <h2 className="text-[18px] font-semibold text-text-primary">Remove Demo Data</h2>
        <p className="mt-1 text-[13px] text-text-secondary">
          Delete only seeded demo data (sample customers, invoices, etc.). Your own data will be preserved.
        </p>
        <div className="mt-5">
          {!confirmRemoveDemo ? (
            <Button
              onClick={() => setConfirmRemoveDemo(true)}
              disabled={seeding || removing || removingDemo}
              variant="outline"
              className="h-10 rounded-xl border-border-subtle text-[13px] font-medium text-text-secondary hover:border-text-primary/30 hover:bg-text-primary/5 hover:text-text-primary"
            >
              {removingDemo ? "Removing..." : "Remove Demo Data"}
            </Button>
          ) : (
            <div className="flex items-center gap-3 rounded-xl border border-border-subtle bg-surface/50 px-4 py-3">
              <p className="flex-1 text-[13px] font-medium text-text-secondary">
                Only demo data will be deleted. Your data stays.
              </p>
              <Button
                onClick={handleRemoveDemo}
                disabled={removingDemo}
                variant="outline"
                className="h-9 rounded-xl px-5 text-[12px] font-semibold"
              >
                {removingDemo ? "Removing..." : "Remove Demo Data"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setConfirmRemoveDemo(false)}
                className="h-9 rounded-xl text-[12px] font-medium text-text-secondary"
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Remove All Data */}
      <div className="dashboard-card border border-error/20">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-error" strokeWidth={1.8} />
          <div>
            <h2 className="text-[18px] font-semibold text-text-primary">Remove All Data</h2>
            <p className="mt-1 text-[13px] text-text-secondary">
              Delete all transactional and master data (customers, invoices, journal entries, etc.).
              Your organization profile and user accounts will be preserved.
            </p>
          </div>
        </div>
        <div className="mt-5">
          {!confirmRemove ? (
            <Button
              onClick={() => setConfirmRemove(true)}
              disabled={seeding || removing || removingDemo}
              className="h-10 rounded-xl bg-error px-6 text-[13px] font-semibold text-white hover:bg-error/90"
            >
              {removing ? "Removing..." : "Remove All Data"}
            </Button>
          ) : (
            <div className="flex items-center gap-3 rounded-xl border border-error/30 bg-error/5 px-4 py-3">
              <p className="flex-1 text-[13px] font-medium text-error">
                This action is irreversible. All data will be permanently deleted.
              </p>
              <Button
                onClick={handleRemove}
                disabled={removing}
                className="h-9 rounded-xl bg-error px-5 text-[12px] font-semibold text-white hover:bg-error/90"
              >
                {removing ? "Removing..." : "Delete Everything"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setConfirmRemove(false)}
                className="h-9 rounded-xl text-[12px] font-medium text-text-secondary"
              >
                Cancel
              </Button>
            </div>
          )}
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

function DataImportExportSettings() {
  const entities = [
    { slug: "chart-of-accounts", label: "Chart of Accounts", description: "GL account codes, names, types, and hierarchy" },
    { slug: "customers", label: "Customers", description: "Customer contacts, addresses, and credit terms" },
    { slug: "suppliers", label: "Suppliers", description: "Supplier contacts, addresses, and payment terms" },
    { slug: "items", label: "Items", description: "Products and services with pricing and inventory" },
    { slug: "tax-codes", label: "Tax Codes", description: "VAT/tax codes, rates, and types" },
    { slug: "employees", label: "Employees", description: "Employee records, positions, and salary info" },
    { slug: "bank-transactions", label: "Bank Transactions", description: "Bank account transaction records" },
    { slug: "invoices", label: "Invoices", description: "Sales invoices with line items" },
    { slug: "bills", label: "Bills", description: "Purchase bills with line items" },
    { slug: "journal-entries", label: "Journal Entries", description: "Journal entries with debit/credit lines" },
  ];

  return (
    <div className="space-y-6">
      <div className="dashboard-card">
        <h2 className="text-[18px] font-semibold text-text-primary">
          Data Import / Export
        </h2>
        <p className="mt-1 text-[14px] text-text-secondary">
          Import data from CSV files or export your data for backup and migration. Download a template first to see the expected format.
        </p>
      </div>

      <div className="space-y-3">
        {entities.map((entity) => (
          <div
            key={entity.slug}
            className="dashboard-card flex items-center justify-between gap-4"
          >
            <div>
              <h3 className="text-[14px] font-semibold text-text-primary">
                {entity.label}
              </h3>
              <p className="mt-0.5 text-[12px] text-text-meta">
                {entity.description}
              </p>
            </div>
            <ImportExportButtons
              entity={entity.slug}
              entityLabel={entity.label}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

interface TaxCode {
  id: string;
  code: string;
  name: string;
  rate: string;
  type: string;
  isActive: boolean;
}

function TaxCodeManagement({ taxLabel, isVatRegistered }: { taxLabel: string; isVatRegistered: boolean }) {
  const [codes, setCodes] = useState<TaxCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newCode, setNewCode] = useState({ code: "", name: "", rate: "", type: "output" });
  const [editForm, setEditForm] = useState({ name: "", rate: "", type: "", isActive: true });

  const fetchCodes = useCallback(() => {
    fetch("/api/org/tax-codes", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { taxCodes: [] }))
      .then((data) => setCodes(data.taxCodes ?? []))
      .catch(() => setCodes([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchCodes(); }, [fetchCodes]);

  async function handleAdd() {
    const rate = parseFloat(newCode.rate);
    if (!newCode.code || !newCode.name || isNaN(rate) || rate < 0 || rate > 100) {
      showError("Validation", "Please fill in all fields with valid values.");
      return;
    }
    try {
      const res = await fetch("/api/org/tax-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newCode, rate }),
      });
      if (res.ok) {
        showSuccess("Tax code created", `${newCode.code} added.`);
        setNewCode({ code: "", name: "", rate: "", type: "output" });
        setAdding(false);
        fetchCodes();
      } else {
        const data = await res.json().catch(() => ({}));
        showError("Failed", data.error ?? "Could not create tax code.");
      }
    } catch {
      showError("Error", "Network error.");
    }
  }

  function startEdit(tc: TaxCode) {
    setEditingId(tc.id);
    setEditForm({ name: tc.name, rate: tc.rate, type: tc.type, isActive: tc.isActive });
  }

  async function handleSaveEdit() {
    if (!editingId) return;
    const rate = parseFloat(editForm.rate);
    if (!editForm.name || isNaN(rate) || rate < 0 || rate > 100) {
      showError("Validation", "Please fill in valid values.");
      return;
    }
    try {
      const res = await fetch("/api/org/tax-codes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingId, name: editForm.name, rate, type: editForm.type, isActive: editForm.isActive }),
      });
      if (res.ok) {
        showSuccess("Tax code updated", "Changes saved.");
        setEditingId(null);
        fetchCodes();
      } else {
        const data = await res.json().catch(() => ({}));
        showError("Failed", data.error ?? "Could not update.");
      }
    } catch {
      showError("Error", "Network error.");
    }
  }

  const label = taxLabel || "Tax";

  return (
    <div className="dashboard-card">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[18px] font-semibold text-text-primary">{label} Codes</h2>
          <p className="mt-1 text-[13px] text-text-secondary">
            Manage tax codes and rates for your organization
          </p>
        </div>
        <Button
          onClick={() => setAdding(true)}
          disabled={adding}
          className="h-9 gap-1.5 rounded-xl bg-text-primary px-4 text-[12px] font-semibold text-white hover:bg-text-primary/90"
        >
          <Plus className="h-3.5 w-3.5" /> Add {label} Code
        </Button>
      </div>

      {!isVatRegistered && (
        <div className="mt-4 rounded-lg border border-border-subtle bg-surface/50 px-4 py-3">
          <p className="text-[13px] text-text-secondary">
            Enable tax registration above to apply tax to documents. You can still manage tax codes here.
          </p>
        </div>
      )}

      {loading ? (
        <p className="mt-6 text-center text-[13px] text-text-secondary">Loading tax codes...</p>
      ) : (
        <div className="mt-6">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border-subtle text-left text-text-secondary">
                <th className="pb-2 font-medium">Code</th>
                <th className="pb-2 font-medium">Name</th>
                <th className="pb-2 font-medium">Rate %</th>
                <th className="pb-2 font-medium">Type</th>
                <th className="pb-2 font-medium">Active</th>
                <th className="pb-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {codes.map((tc) => (
                <tr key={tc.id} className="border-b border-border-subtle/50">
                  {editingId === tc.id ? (
                    <>
                      <td className="py-2 pr-2 font-mono text-text-primary">{tc.code}</td>
                      <td className="py-2 pr-2">
                        <Input
                          value={editForm.name}
                          onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                          className="h-8 rounded-lg text-[12px]"
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <Input
                          type="number"
                          value={editForm.rate}
                          onChange={(e) => setEditForm((f) => ({ ...f, rate: e.target.value }))}
                          className="h-8 w-20 rounded-lg text-[12px]"
                          min={0} max={100} step={0.01}
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <StyledSelect
                          value={editForm.type}
                          onChange={(e) => setEditForm((f) => ({ ...f, type: e.target.value }))}
                          className="h-8 text-[12px]"
                        >
                          <option value="output">Output</option>
                          <option value="input">Input</option>
                          <option value="exempt">Exempt</option>
                          <option value="zero">Zero Rated</option>
                          <option value="reverse_charge">Reverse Charge</option>
                        </StyledSelect>
                      </td>
                      <td className="py-2 pr-2">
                        <Checkbox
                          checked={editForm.isActive}
                          onCheckedChange={(v) => setEditForm((f) => ({ ...f, isActive: !!v }))}
                        />
                      </td>
                      <td className="py-2">
                        <div className="flex gap-1">
                          <button onClick={handleSaveEdit} className="rounded p-1 hover:bg-green-50 text-green-600"><Check className="h-4 w-4" /></button>
                          <button onClick={() => setEditingId(null)} className="rounded p-1 hover:bg-red-50 text-red-500"><X className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="py-2.5 pr-2 font-mono font-semibold text-text-primary">{tc.code}</td>
                      <td className="py-2.5 pr-2 text-text-primary">{tc.name}</td>
                      <td className="py-2.5 pr-2 text-text-primary">{Number(tc.rate).toFixed(2)}%</td>
                      <td className="py-2.5 pr-2 capitalize text-text-secondary">{tc.type.replace("_", " ")}</td>
                      <td className="py-2.5 pr-2">
                        <span className={`inline-block h-2 w-2 rounded-full ${tc.isActive ? "bg-green-500" : "bg-gray-300"}`} />
                      </td>
                      <td className="py-2.5">
                        <button onClick={() => startEdit(tc)} className="rounded p-1 hover:bg-black/5 text-text-secondary hover:text-text-primary">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}

              {adding && (
                <tr className="border-b border-border-subtle/50 bg-surface/30">
                  <td className="py-2 pr-2">
                    <Input
                      value={newCode.code}
                      onChange={(e) => setNewCode((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                      placeholder="SR"
                      className="h-8 w-20 rounded-lg font-mono text-[12px]"
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <Input
                      value={newCode.name}
                      onChange={(e) => setNewCode((f) => ({ ...f, name: e.target.value }))}
                      placeholder="Standard Rate"
                      className="h-8 rounded-lg text-[12px]"
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <Input
                      type="number"
                      value={newCode.rate}
                      onChange={(e) => setNewCode((f) => ({ ...f, rate: e.target.value }))}
                      placeholder="5.00"
                      className="h-8 w-20 rounded-lg text-[12px]"
                      min={0} max={100} step={0.01}
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <StyledSelect
                      value={newCode.type}
                      onChange={(e) => setNewCode((f) => ({ ...f, type: e.target.value }))}
                      className="h-8 text-[12px]"
                    >
                      <option value="output">Output</option>
                      <option value="input">Input</option>
                      <option value="exempt">Exempt</option>
                      <option value="zero">Zero Rated</option>
                      <option value="reverse_charge">Reverse Charge</option>
                    </StyledSelect>
                  </td>
                  <td className="py-2" />
                  <td className="py-2">
                    <div className="flex gap-1">
                      <button onClick={handleAdd} className="rounded p-1 hover:bg-green-50 text-green-600"><Check className="h-4 w-4" /></button>
                      <button onClick={() => setAdding(false)} className="rounded p-1 hover:bg-red-50 text-red-500"><X className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {codes.length === 0 && !adding && (
            <p className="py-6 text-center text-[13px] text-text-secondary">
              No tax codes configured. Click &quot;Add {label} Code&quot; to get started.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
