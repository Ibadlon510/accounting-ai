"use client";

import { useState, useEffect } from "react";
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
import { Landmark, CreditCard, Building2, Hash, Globe, Info } from "lucide-react";

const CURRENCIES = ["AED", "USD", "EUR", "GBP", "SAR", "QAR", "BHD", "OMR", "KWD", "INR"];

type AccountType = "bank" | "credit_card";

export interface BankAccountForEdit {
  id: string;
  accountType?: string;
  accountName: string;
  bankName?: string | null;
  accountNumber?: string | null;
  iban?: string | null;
  swiftCode?: string | null;
  currency: string;
}

interface AddBankAccountPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (account: { id: string; accountType?: string; accountName: string; bankName?: string; currency: string }) => void;
  defaultAccountType?: AccountType;
  /** When provided, panel opens in edit mode with existing account data */
  account?: BankAccountForEdit | null;
}

export function AddBankAccountPanel({ open, onOpenChange, onSuccess, defaultAccountType = "bank", account }: AddBankAccountPanelProps) {
  const isEdit = !!account;
  const [accountType, setAccountType] = useState<AccountType>((account?.accountType as AccountType) ?? defaultAccountType);
  const [accountName, setAccountName] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [iban, setIban] = useState("");
  const [swiftCode, setSwiftCode] = useState("");
  const [currency, setCurrency] = useState("AED");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (account) {
        setAccountType((account.accountType as AccountType) ?? "bank");
        setAccountName(account.accountName ?? "");
        setBankName(account.bankName ?? "");
        setAccountNumber(account.accountNumber ?? "");
        setIban(account.iban ?? "");
        setSwiftCode(account.swiftCode ?? "");
        setCurrency(account.currency ?? "AED");
      } else {
        setAccountType(defaultAccountType);
        setAccountName("");
        setBankName("");
        setAccountNumber("");
        setIban("");
        setSwiftCode("");
        setCurrency("AED");
      }
    }
  }, [open, account, defaultAccountType]);

  function reset() {
    if (account) {
      setAccountType((account.accountType as AccountType) ?? "bank");
      setAccountName(account.accountName ?? "");
      setBankName(account.bankName ?? "");
      setAccountNumber(account.accountNumber ?? "");
      setIban(account.iban ?? "");
      setSwiftCode(account.swiftCode ?? "");
      setCurrency(account.currency ?? "AED");
    } else {
      setAccountType(defaultAccountType);
      setAccountName("");
      setBankName("");
      setAccountNumber("");
      setIban("");
      setSwiftCode("");
      setCurrency("AED");
    }
  }

  async function handleSave() {
    if (!accountName.trim()) {
      showError("Account name is required");
      return;
    }
    setSaving(true);
    try {
      if (isEdit && account) {
        const res = await fetch(`/api/banking/accounts/${account.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accountType,
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
          showError(err.error ?? "Failed to update bank account");
          return;
        }
        const data = await res.json();
        const updated = data.account;
        showSuccess("Bank account updated", `${accountName} has been saved.`);
        onOpenChange(false);
        onSuccess?.({
          id: updated.id,
          accountType: updated.accountType,
          accountName: updated.accountName,
          bankName: updated.bankName,
          currency: updated.currency,
        });
      } else {
        const res = await fetch("/api/banking/accounts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accountType,
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
        showSuccess(accountType === "credit_card" ? "Credit card added" : "Bank account added", `${accountName} has been added.`);
        reset();
        onOpenChange(false);
        onSuccess?.({
          id: created.id,
          accountType: created.accountType,
          accountName: created.accountName,
          bankName: created.bankName,
          currency: created.currency,
        });
      }
    } catch {
      showError(isEdit ? "Failed to update bank account" : "Failed to create bank account", "Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <EntityPanel open={open} onOpenChange={onOpenChange}>
      <EntityPanelContent size="lg">
        <EntityPanelBody>
          <EntityPanelMain>
            <EntityPanelHeader title={isEdit ? "Edit Bank Account" : (accountType === "credit_card" ? "Add Credit Card" : "Add Bank Account")} />

            <EntityPanelAvatar
              name={accountName || "New Account"}
              subtitle={bankName || undefined}
              fallbackGradient={accountType === "credit_card" ? "from-violet-400 via-purple-300 to-fuchsia-400" : "from-emerald-400 via-teal-300 to-cyan-400"}
            />

            <EntityPanelFieldGroup>
              <EntityPanelField icon={accountType === "credit_card" ? <CreditCard className="h-4 w-4" /> : <Landmark className="h-4 w-4" />} label="Account Type">
                <div className="flex gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setAccountType("bank")}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-lg border py-2.5 px-3 text-[13px] font-medium transition-colors ${
                      accountType === "bank"
                        ? "border-text-primary bg-text-primary/5 text-text-primary"
                        : "border-border-subtle text-text-meta hover:border-border-default hover:text-text-secondary"
                    }`}
                  >
                    <Landmark className="h-4 w-4" /> Bank Account
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccountType("credit_card")}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-lg border py-2.5 px-3 text-[13px] font-medium transition-colors ${
                      accountType === "credit_card"
                        ? "border-text-primary bg-text-primary/5 text-text-primary"
                        : "border-border-subtle text-text-meta hover:border-border-default hover:text-text-secondary"
                    }`}
                  >
                    <CreditCard className="h-4 w-4" /> Credit Card
                  </button>
                </div>
              </EntityPanelField>
              <EntityPanelField icon={accountType === "credit_card" ? <CreditCard className="h-4 w-4" /> : <Landmark className="h-4 w-4" />} label="Account Name">
                <Input
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder={accountType === "credit_card" ? "e.g. Corporate Amex" : "e.g. Main Operating Account"}
                  className="mt-1 h-8 rounded-lg border-border-subtle text-[14px] font-medium text-text-primary focus-visible:ring-text-primary/20"
                />
              </EntityPanelField>
              <EntityPanelField icon={<Building2 className="h-4 w-4" />} label={accountType === "credit_card" ? "Card Issuer" : "Bank Name"}>
                <Input
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder={accountType === "credit_card" ? "e.g. Amex, Emirates NBD" : "e.g. Emirates NBD"}
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
              {accountType === "credit_card"
                ? "Card issuer and last 4 digits are optional. The account will start with a zero balance."
                : "Bank name, account number, IBAN and SWIFT are optional. You can add them later. The account will start with a zero balance."}
            </EntityPanelInfoMessage>
          </EntityPanelSidebar>
        </EntityPanelBody>

        <EntityPanelFooter
          onCancel={() => {
            reset();
            onOpenChange(false);
          }}
          onSave={handleSave}
          saveLabel={isEdit ? "Save changes" : (accountType === "credit_card" ? "Add Credit Card" : "Add Bank Account")}
          saveDisabled={!accountName.trim() || saving}
        />
      </EntityPanelContent>
    </EntityPanel>
  );
}
