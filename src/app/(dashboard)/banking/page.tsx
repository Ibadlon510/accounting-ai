"use client";

import { useState } from "react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageHeader } from "@/components/layout/page-header";
import { mockBankAccounts, mockBankTransactions, getBankingStats } from "@/lib/mock/banking-data";
import { formatNumber } from "@/lib/accounting/engine";
import { Landmark, CheckCircle2, AlertCircle, Upload, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { comingSoon } from "@/lib/utils/toast-helpers";

export default function BankingPage() {
  const stats = getBankingStats();
  const [selectedAccountId, setSelectedAccountId] = useState<string>(mockBankAccounts[0].id);

  const transactions = mockBankTransactions.filter((t) => t.bankAccountId === selectedAccountId);

  return (
    <>
      <Breadcrumbs items={[{ label: "Workspaces", href: "/workspaces" }, { label: "Banking" }]} />
      <PageHeader title="Banking" showActions={false} />

      {/* Stats bar */}
      <div className="grid grid-cols-12 gap-6 mb-8">
        <div className="col-span-4 dashboard-card">
          <p className="text-[13px] text-text-secondary">Total Balance (AED)</p>
          <p className="mt-1 text-[28px] font-bold text-text-primary">AED {formatNumber(stats.totalBalance)}</p>
        </div>
        <div className="col-span-4 dashboard-card">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <p className="text-[13px] text-text-secondary">Reconciled</p>
          </div>
          <p className="mt-1 text-[28px] font-bold text-success">{stats.reconciled}</p>
        </div>
        <div className="col-span-4 dashboard-card">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-accent-yellow" />
            <p className="text-[13px] text-text-secondary">Unreconciled</p>
          </div>
          <p className="mt-1 text-[28px] font-bold text-accent-yellow">{stats.unreconciled}</p>
        </div>
      </div>

      {/* Bank account tabs */}
      <div className="mb-6 flex items-center gap-3">
        {mockBankAccounts.map((account) => (
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
              <p className="text-[11px] text-text-meta">{account.bankName} • {account.currency}</p>
            </div>
            <span className="ml-2 font-semibold">{account.currency} {formatNumber(account.currentBalance)}</span>
          </button>
        ))}
        <div className="ml-auto">
          <Button onClick={() => comingSoon("CSV Import")} className="h-10 gap-2 rounded-xl bg-text-primary px-4 text-[13px] font-semibold text-white hover:bg-text-primary/90">
            <Upload className="h-4 w-4" /> Import CSV
          </Button>
        </div>
      </div>

      {/* Transactions table */}
      <div className="dashboard-card overflow-hidden !p-0">
        <div className="grid grid-cols-12 gap-3 border-b border-border-subtle bg-canvas/50 px-6 py-3 text-[12px] font-medium uppercase tracking-wide text-text-meta">
          <div className="col-span-1">Date</div>
          <div className="col-span-4">Description</div>
          <div className="col-span-1">Ref</div>
          <div className="col-span-2">Suggested Account</div>
          <div className="col-span-1 text-center">Confidence</div>
          <div className="col-span-2 text-right">Amount</div>
          <div className="col-span-1 text-center">Status</div>
        </div>

        {transactions.map((txn) => (
          <div key={txn.id} className="grid grid-cols-12 gap-3 border-b border-border-subtle/50 px-6 py-3 text-[13px] transition-colors hover:bg-black/[0.01]">
            <div className="col-span-1 text-text-secondary">{txn.transactionDate.slice(5)}</div>
            <div className="col-span-4 flex items-center gap-2">
              {txn.type === "credit" ? (
                <ArrowDownLeft className="h-3.5 w-3.5 text-success" />
              ) : (
                <ArrowUpRight className="h-3.5 w-3.5 text-error" />
              )}
              <span className="font-medium text-text-primary">{txn.description}</span>
            </div>
            <div className="col-span-1 font-mono text-[11px] text-text-meta">{txn.reference}</div>
            <div className="col-span-2 text-[12px] text-text-secondary">{txn.suggestedAccount ?? "—"}</div>
            <div className="col-span-1 text-center">
              {txn.confidence ? (
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  txn.confidence >= 0.9 ? "bg-success-light text-success" : txn.confidence >= 0.7 ? "bg-accent-yellow/20 text-amber-700" : "bg-muted text-text-secondary"
                }`}>
                  {Math.round(txn.confidence * 100)}%
                </span>
              ) : "—"}
            </div>
            <div className={`col-span-2 text-right font-mono font-medium ${txn.type === "credit" ? "text-success" : "text-error"}`}>
              {txn.type === "credit" ? "+" : "-"}AED {formatNumber(txn.amount)}
            </div>
            <div className="col-span-1 text-center">
              {txn.isReconciled ? (
                <span className="rounded-full bg-success-light px-2 py-0.5 text-[10px] font-medium text-success">Matched</span>
              ) : (
                <button onClick={() => comingSoon("Bank Reconciliation")} className="rounded-full bg-text-primary/5 px-2 py-0.5 text-[10px] font-medium text-text-primary hover:bg-text-primary/10">Match</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
