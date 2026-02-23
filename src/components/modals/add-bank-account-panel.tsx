"use client";

import { useState } from "react";
import {
  EntityPanel,
  EntityPanelContent,
  EntityPanelBody,
  EntityPanelMain,
  EntityPanelSidebar,
  EntityPanelHeader,
  EntityPanelAvatar,
  EntityPanelFieldGroup,
  EntityPanelField,
  EntityPanelSidebarHeader,
  EntityPanelSidebarSection,
  EntityPanelFooter,
  EntityPanelInfoMessage,
} from "@/components/overlays/entity-panel";
import { Input } from "@/components/ui/input";
import { showSuccess, showError } from "@/lib/utils/toast-helpers";
import { Landmark, Building2, Hash, Globe, Info } from "lucide-react";

const CURRENCIES = ["AED", "USD", "EUR", "GBP", "SAR", "QAR", "BHD", "OMR", "KWD", "INR"];

interface AddBankAccountPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (account: { id: string; accountName: string; bankName?: string; currency: string }) => void;
}

export function AddBankAccountPanel({ open, onOpenChange, onSuccess }: AddBankAccountPanelProps) {
  const [accountName, setAccountName] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [iban, setIban] = useState("");
  const [swiftCode, setSwiftCode] = useState("");
  const [currency, setCurrency] = useState("AED");
  const [saving, setSaving] = useState(false);

  function reset() {
    setAccountName("");
    setBankName("");
    setAccountNumber("");
    setIban("");
    setSwiftCode("");
    setCurrency("AED");
  }

  async function handleSave() {
    if (!accountName.trim()) {
      showError("Account name is required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/banking/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountName: accountName.trim(),
          bankName: bankName.trim() || undefined,
          accountNumber: accountNumber.trim() || undefined,
          iban: iban.trim() || undefined,
          swiftCode: swiftCode.trim() || undefined,
          currency,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showError(err.error ?? "Failed to create bank account");
        return;
      }
      const data = await res.json();
      const created = data.account;
      showSuccess("Bank account added", `${accountName} has been added.`);
      reset();
      onOpenChange(false);
      onSuccess?.({
        id: created.id,
        accountName: created.accountName,
        bankName: created.bankName,
        currency: created.currency,
      });
    } catch {
      showError("Failed to create bank account", "Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <EntityPanel open={open} onOpenChange={onOpenChange}>
      <EntityPanelContent size="lg">
        <EntityPanelBody>
          <EntityPanelMain>
            <EntityPanelHeader title="Add Bank Account" />

            <EntityPanelAvatar
              name={accountName || "New Account"}
              subtitle={bankName || undefined}
              fallbackGradient="from-emerald-400 via-teal-300 to-cyan-400"
            />

            <EntityPanelFieldGroup>
              <EntityPanelField icon={<Landmark className="h-4 w-4" />} label="Account Name">
                <Input
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="e.g. Main Operating Account"
                  className="mt-1 h-8 rounded-lg border-border-subtle text-[14px] font-medium text-text-primary focus-visible:ring-text-primary/20"
                />
              </EntityPanelField>
              <EntityPanelField icon={<Building2 className="h-4 w-4" />} label="Bank Name">
                <Input
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. Emirates NBD"
                  className="mt-1 h-8 rounded-lg border-border-subtle text-[14px] font-medium text-text-primary focus-visible:ring-text-primary/20"
                />
              </EntityPanelField>
              <EntityPanelField icon={<Hash className="h-4 w-4" />} label="Account Number">
                <Input
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="e.g. 1017-XXXXXX-01"
                  className="mt-1 h-8 rounded-lg border-border-subtle text-[14px] font-medium text-text-primary focus-visible:ring-text-primary/20"
                />
              </EntityPanelField>
              <EntityPanelField icon={<Globe className="h-4 w-4" />} label="IBAN">
                <Input
                  value={iban}
                  onChange={(e) => setIban(e.target.value)}
                  placeholder="e.g. AE12026000101700000001"
                  className="mt-1 h-8 rounded-lg border-border-subtle text-[14px] font-medium text-text-primary focus-visible:ring-text-primary/20 font-mono"
                />
              </EntityPanelField>
              <EntityPanelField icon={<Globe className="h-4 w-4" />} label="SWIFT / BIC">
                <Input
                  value={swiftCode}
                  onChange={(e) => setSwiftCode(e.target.value)}
                  placeholder="e.g. EBILAEAD"
                  className="mt-1 h-8 rounded-lg border-border-subtle text-[14px] font-medium text-text-primary focus-visible:ring-text-primary/20 font-mono"
                />
              </EntityPanelField>
            </EntityPanelFieldGroup>
          </EntityPanelMain>

          <EntityPanelSidebar>
            <EntityPanelSidebarHeader title="Account Settings" />

            <EntityPanelSidebarSection title="Currency">
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="h-9 w-full rounded-lg border border-border-subtle bg-surface px-3 text-[14px] font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-text-primary/20"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </EntityPanelSidebarSection>

            <EntityPanelInfoMessage icon={<Info className="h-3.5 w-3.5" />}>
              Bank name, account number, IBAN and SWIFT are optional. You can add them later. The account will start with a zero balance.
            </EntityPanelInfoMessage>
          </EntityPanelSidebar>
        </EntityPanelBody>

        <EntityPanelFooter
          onCancel={() => {
            reset();
            onOpenChange(false);
          }}
          onSave={handleSave}
          saveLabel="Add Bank Account"
          saveDisabled={!accountName.trim() || saving}
        />
      </EntityPanelContent>
    </EntityPanel>
  );
}
