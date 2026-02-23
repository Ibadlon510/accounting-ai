"use client";

import { useState, useEffect } from "react";
import {
  EntityPanel,
  EntityPanelContent,
  EntityPanelBody,
  EntityPanelMain,
  EntityPanelSidebar,
  EntityPanelHeader,
  EntityPanelSidebarHeader,
  EntityPanelSidebarSection,
  EntityPanelFooter,
  EntityPanelInfoMessage,
} from "@/components/overlays/entity-panel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { showSuccess, showError } from "@/lib/utils/toast-helpers";
import { formatNumber } from "@/lib/accounting/engine";
import { Info } from "lucide-react";
import { SearchableSelect } from "@/components/ui/searchable-select";
import type { BankAccount } from "@/lib/banking/types";

interface TransferPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function TransferPanel({ open, onOpenChange, onSuccess }: TransferPanelProps) {
  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [reference, setReference] = useState("");
  const [saving, setSaving] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);

  useEffect(() => {
    if (!open) return;
    fetch("/api/banking", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { accounts: [] }))
      .then((d) => setBankAccounts(d.accounts ?? []));
  }, [open]);

  const toAccountOptions = bankAccounts.filter((a) => a.id !== fromAccountId);
  const fromAccountOptions = bankAccounts.filter((a) => a.id !== toAccountId);
  const selectedCurrency = bankAccounts.find((a) => a.id === fromAccountId)?.currency ?? "AED";
  const amt = Number(amount) || 0;

  function reset() {
    setFromAccountId("");
    setToAccountId("");
    setAmount("");
    setDate(new Date().toISOString().slice(0, 10));
    setReference("");
  }

  function handleSave() {
    if (!fromAccountId || !toAccountId) {
      showError("Select from and to accounts");
      return;
    }
    if (fromAccountId === toAccountId) {
      showError("From and to accounts must be different");
      return;
    }
    if (amt <= 0) {
      showError("Amount must be greater than zero");
      return;
    }

    setSaving(true);
    fetch("/api/banking/transfers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fromAccountId,
        toAccountId,
        amount: amt,
        date,
        reference: reference || undefined,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          showError(data.error);
          return;
        }
        showSuccess("Transfer completed", `${selectedCurrency} ${formatNumber(amt)} transferred successfully.`);
        reset();
        onOpenChange(false);
        onSuccess?.();
      })
      .catch(() => showError("Failed to create transfer"))
      .finally(() => setSaving(false));
  }

  const saveDisabled = !fromAccountId || !toAccountId || amt <= 0 || saving;

  return (
    <EntityPanel open={open} onOpenChange={onOpenChange}>
      <EntityPanelContent size="md">
        <EntityPanelBody>
          <EntityPanelMain>
            <EntityPanelHeader title="Inter-account Transfer" showAiButton={false} />

            <div className="space-y-4">
              <div>
                <Label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-meta">From account</Label>
                <SearchableSelect
                  value={fromAccountId}
                  onChange={(v) => setFromAccountId(v)}
                  options={fromAccountOptions.map((a) => ({
                    value: a.id,
                    label: `${a.accountName}${a.bankName ? ` (${a.bankName})` : ""} — ${a.currency}`,
                  }))}
                  placeholder="Select account"
                  searchPlaceholder="Search..."
                />
              </div>

              <div>
                <Label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-meta">To account</Label>
                <SearchableSelect
                  value={toAccountId}
                  onChange={(v) => setToAccountId(v)}
                  options={toAccountOptions.map((a) => ({
                    value: a.id,
                    label: `${a.accountName}${a.bankName ? ` (${a.bankName})` : ""} — ${a.currency}`,
                  }))}
                  placeholder="Select account"
                  searchPlaceholder="Search..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-meta">Date</Label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-10 rounded-xl border-border-subtle text-[13px]" required />
                </div>
                <div>
                  <Label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-meta">Amount</Label>
                  <Input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : "")} placeholder="0.00" className="h-10 rounded-xl border-border-subtle text-[13px] font-mono" />
                </div>
              </div>

              <div>
                <Label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-meta">Reference (optional)</Label>
                <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. Monthly transfer" className="h-10 rounded-xl border-border-subtle text-[13px]" />
              </div>
            </div>
          </EntityPanelMain>

          <EntityPanelSidebar>
            <EntityPanelSidebarHeader title="Transfer Info" />
            <EntityPanelSidebarSection title="Effect">
              <p className="text-[14px] font-medium text-text-primary">Debit from source account, credit to destination account. Balances are updated immediately.</p>
            </EntityPanelSidebarSection>
            <EntityPanelInfoMessage icon={<Info className="h-3.5 w-3.5" />}>Both accounts must belong to your organization. The same amount is debited from the source and credited to the destination.</EntityPanelInfoMessage>
          </EntityPanelSidebar>
        </EntityPanelBody>

        <EntityPanelFooter onCancel={() => { reset(); onOpenChange(false); }} onSave={handleSave} saveLabel={saving ? "Transferring..." : "Transfer"} saveDisabled={saveDisabled} />
      </EntityPanelContent>
    </EntityPanel>
  );
}
