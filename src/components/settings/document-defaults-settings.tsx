"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Save, Loader2, FileText, Receipt, FileX2 } from "lucide-react";
import { showSuccess, showError } from "@/lib/utils/toast-helpers";

const DOC_TYPES = [
  { key: "invoice", label: "Invoice", icon: FileText, description: "Default content pre-filled when creating a new invoice" },
  { key: "bill", label: "Bill", icon: Receipt, description: "Default content pre-filled when recording a new bill" },
  { key: "credit_note", label: "Credit Note", icon: FileX2, description: "Default content pre-filled for credit notes" },
] as const;

type DocTypeKey = (typeof DOC_TYPES)[number]["key"];

interface DocDefaults {
  defaultTerms: string;
  defaultNotes: string;
  defaultPaymentInfo: string;
}

const EMPTY: DocDefaults = { defaultTerms: "", defaultNotes: "", defaultPaymentInfo: "" };

export function DocumentDefaultsSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<DocTypeKey | null>(null);
  const [activeTab, setActiveTab] = useState<DocTypeKey>("invoice");
  const [defaults, setDefaults] = useState<Record<DocTypeKey, DocDefaults>>({
    invoice: { ...EMPTY },
    bill: { ...EMPTY },
    credit_note: { ...EMPTY },
  });

  const fetchDefaults = useCallback(async () => {
    try {
      const res = await fetch("/api/org/document-defaults", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const d = data.defaults ?? {};
        setDefaults({
          invoice: { defaultTerms: d.invoice?.defaultTerms ?? "", defaultNotes: d.invoice?.defaultNotes ?? "", defaultPaymentInfo: d.invoice?.defaultPaymentInfo ?? "" },
          bill: { defaultTerms: d.bill?.defaultTerms ?? "", defaultNotes: d.bill?.defaultNotes ?? "", defaultPaymentInfo: d.bill?.defaultPaymentInfo ?? "" },
          credit_note: { defaultTerms: d.credit_note?.defaultTerms ?? "", defaultNotes: d.credit_note?.defaultNotes ?? "", defaultPaymentInfo: d.credit_note?.defaultPaymentInfo ?? "" },
        });
      }
    } catch {
      // use empty defaults
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDefaults(); }, [fetchDefaults]);

  const handleSave = async (docType: DocTypeKey) => {
    setSaving(docType);
    try {
      const res = await fetch("/api/org/document-defaults", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentType: docType, ...defaults[docType] }),
      });
      if (res.ok) {
        showSuccess("Defaults saved", `${DOC_TYPES.find((d) => d.key === docType)?.label} defaults updated.`);
      } else {
        const data = await res.json().catch(() => ({}));
        showError("Save failed", data.error ?? "Failed to save defaults.");
      }
    } finally {
      setSaving(null);
    }
  };

  const updateField = (docType: DocTypeKey, field: keyof DocDefaults, value: string) => {
    setDefaults((prev) => ({ ...prev, [docType]: { ...prev[docType], [field]: value } }));
  };

  if (loading) {
    return <div className="dashboard-card py-8 text-center text-text-secondary">Loading defaults...</div>;
  }

  const active = DOC_TYPES.find((d) => d.key === activeTab)!;

  return (
    <div className="dashboard-card">
      <h2 className="text-[18px] font-semibold text-text-primary">Document Defaults</h2>
      <p className="mt-1 text-[13px] text-text-secondary">
        Set default terms, notes, and payment information for each document type.
        These will be pre-filled when creating new documents and included on generated PDFs.
      </p>

      <div className="mt-6 flex gap-1 rounded-xl bg-muted/60 p-1">
        {DOC_TYPES.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[13px] font-medium transition-all ${
              activeTab === key
                ? "bg-surface text-text-primary shadow-sm"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <Icon className="h-4 w-4" strokeWidth={1.8} />
            {label}
          </button>
        ))}
      </div>

      <p className="mt-5 text-[12px] text-text-secondary">{active.description}</p>

      <div className="mt-4 space-y-4">
        <div>
          <label className="mb-1.5 block text-[12px] font-medium text-text-secondary">Terms &amp; Conditions</label>
          <textarea
            value={defaults[activeTab].defaultTerms}
            onChange={(e) => updateField(activeTab, "defaultTerms", e.target.value)}
            rows={3}
            placeholder="Payment is due within 30 days of invoice date..."
            className="w-full rounded-xl border border-border-subtle bg-transparent p-3 text-[13px] text-text-primary outline-none transition-colors focus:ring-2 focus:ring-text-primary/20"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[12px] font-medium text-text-secondary">Notes</label>
          <textarea
            value={defaults[activeTab].defaultNotes}
            onChange={(e) => updateField(activeTab, "defaultNotes", e.target.value)}
            rows={2}
            placeholder="Thank you for your business..."
            className="w-full rounded-xl border border-border-subtle bg-transparent p-3 text-[13px] text-text-primary outline-none transition-colors focus:ring-2 focus:ring-text-primary/20"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[12px] font-medium text-text-secondary">Payment / Bank Details</label>
          <textarea
            value={defaults[activeTab].defaultPaymentInfo}
            onChange={(e) => updateField(activeTab, "defaultPaymentInfo", e.target.value)}
            rows={3}
            placeholder={"Bank: Emirates NBD\nAccount: 1234567890\nIBAN: AE12 3456 7890 1234 5678 901"}
            className="w-full rounded-xl border border-border-subtle bg-transparent p-3 text-[13px] text-text-primary outline-none transition-colors focus:ring-2 focus:ring-text-primary/20"
          />
        </div>
      </div>

      <div className="mt-5 flex justify-end">
        <Button
          onClick={() => handleSave(activeTab)}
          disabled={saving === activeTab}
          className="h-9 gap-2 rounded-xl bg-text-primary px-5 text-[12px] font-semibold text-white hover:bg-text-primary/90"
        >
          {saving === activeTab ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          {saving === activeTab ? "Saving..." : `Save ${active.label} Defaults`}
        </Button>
      </div>
    </div>
  );
}
