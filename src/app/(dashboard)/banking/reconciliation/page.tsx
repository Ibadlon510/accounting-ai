"use client";

import { useState, useEffect } from "react";
import { Landmark } from "lucide-react";
import { ReconciliationTwoColumn } from "@/components/banking/reconciliation-two-column";

type BankAccount = {
  id: string;
  accountName: string;
  bankName?: string;
  currency: string;
};

export default function ReconciliationPage() {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");

  useEffect(() => {
    fetch("/api/banking")
      .then((r) => (r.ok ? r.json() : { accounts: [] }))
      .then((data) => {
        const accounts = data.accounts ?? [];
        setBankAccounts(accounts);
        if (accounts.length > 0) setSelectedAccountId((prev) => prev || accounts[0].id);
      })
      .catch(() => {});
  }, []);

  if (bankAccounts.length === 0) {
    return (
      <div className="dashboard-card p-8 text-center">
        <p className="text-[15px] text-text-secondary">No bank accounts yet.</p>
        <p className="mt-1 text-[13px] text-text-meta">Add a bank account from the Accounts page to start reconciliation.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        {bankAccounts.map((account) => (
          <button
            key={account.id}
            onClick={() => setSelectedAccountId(account.id)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-medium transition-all ${
              selectedAccountId === account.id
                ? "bg-surface text-text-primary shadow-sm"
                : "text-text-secondary hover:bg-black/5 hover:text-text-primary"
            }`}
            style={selectedAccountId === account.id ? { boxShadow: "var(--shadow-card)" } : undefined}
          >
            <Landmark className="h-4 w-4" strokeWidth={1.8} />
            <div className="text-left">
              <p>{account.accountName}</p>
              <p className="text-[11px] text-text-meta">{account.bankName ? `${account.bankName} • ` : ""}{account.currency}</p>
            </div>
          </button>
        ))}
      </div>

      {selectedAccountId && (
        <ReconciliationTwoColumn
          bankAccountId={selectedAccountId}
          accountName={bankAccounts.find((a) => a.id === selectedAccountId)?.accountName ?? ""}
        />
      )}
    </div>
  );
}
