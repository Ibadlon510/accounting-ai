"use client";

import { useState, useCallback } from "react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageHeader } from "@/components/layout/page-header";
import { mockBankAccounts, mockBankTransactions, getBankingStats } from "@/lib/mock/banking-data";
import type { BankTransaction } from "@/lib/mock/banking-data";
import { formatNumber } from "@/lib/accounting/engine";
import { Landmark, CheckCircle2, AlertCircle, Upload, ArrowDownLeft, ArrowUpRight, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { comingSoon, showSuccess, showError } from "@/lib/utils/toast-helpers";
import { AiInsightBanner } from "@/components/ai/ai-insight-banner";

type Suggestion = {
  suggestedGlAccountId: string;
  suggestedGlName: string;
  confidence: number;
};

export default function BankingPage() {
  const stats = getBankingStats();
  const [selectedAccountId, setSelectedAccountId] = useState<string>(mockBankAccounts[0].id);
  const [suggestions, setSuggestions] = useState<Record<string, Suggestion>>({});
  const [suggestingId, setSuggestingId] = useState<string | null>(null);
  const [applyingId, setApplyingId] = useState<string | null>(null);

  const transactions = mockBankTransactions.filter((t) => t.bankAccountId === selectedAccountId);

  const getDisplaySuggestion = useCallback(
    (txn: BankTransaction) => {
      const ai = suggestions[txn.id];
      if (ai) return { name: ai.suggestedGlName, confidence: ai.confidence };
      return { name: txn.suggestedAccount, confidence: txn.confidence };
    },
    [suggestions]
  );

  const highConfUnreconciled = transactions.filter((t) => {
    if (t.isReconciled) return false;
    const { confidence } = getDisplaySuggestion(t);
    return confidence != null && confidence >= 0.9;
  });

  const fetchSuggestion = useCallback(async (txn: BankTransaction) => {
    setSuggestingId(txn.id);
    try {
      const res = await fetch("/api/bank-transactions/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: txn.description,
          amount: txn.amount,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.suggestedGlAccountId) {
        setSuggestions((prev) => ({
          ...prev,
          [txn.id]: {
            suggestedGlAccountId: data.suggestedGlAccountId,
            suggestedGlName: data.suggestedGlName ?? "Unknown",
            confidence: data.confidence ?? 0,
          },
        }));
      }
    } catch {
      showError("Could not fetch suggestion");
    } finally {
      setSuggestingId(null);
    }
  }, []);

  const applyAndLearn = useCallback(
    async (txn: BankTransaction) => {
      const ai = suggestions[txn.id];
      if (!ai) {
        showError("Suggest a GL first, then apply.");
        return;
      }
      setApplyingId(txn.id);
      try {
        const res = await fetch("/api/bank-transactions/classify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pattern: txn.description,
            glAccountId: ai.suggestedGlAccountId,
          }),
        });
        if (res.ok) {
          showSuccess("Preference saved", `Future transactions like "${txn.description.slice(0, 30)}…" will suggest ${ai.suggestedGlName}.`);
        } else {
          const data = await res.json().catch(() => ({}));
          showError(data?.error ?? "Could not save");
        }
      } catch {
        showError("Could not save");
      } finally {
        setApplyingId(null);
      }
    },
    [suggestions]
  );

  const suggestAllUnreconciled = useCallback(() => {
    const unreconciled = transactions.filter((t) => !t.isReconciled);
    unreconciled.forEach((txn) => fetchSuggestion(txn));
  }, [transactions, fetchSuggestion]);

  return (
    <>
      <Breadcrumbs items={[{ label: "Workspaces", href: "/workspaces" }, { label: "Banking" }]} />
      <PageHeader title="Banking" />

      <AiInsightBanner
        message="12 unreconciled transactions totaling AED 84,320. AI can suggest GL matches for 9 of them."
        detail="Largest unmatched: AED 42,000 credit from Emirates Steel on Jan 15."
      />

      {/* Stats bar */}
      <div className="grid grid-cols-1 gap-4 mb-8 sm:grid-cols-3 sm:gap-6">
        <div className="dashboard-card">
          <p className="text-[13px] text-text-secondary">Total Balance (AED)</p>
          <p className="mt-1 text-[28px] font-bold text-text-primary">AED {formatNumber(stats.totalBalance)}</p>
        </div>
        <div className="dashboard-card">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <p className="text-[13px] text-text-secondary">Reconciled</p>
          </div>
          <p className="mt-1 text-[28px] font-bold text-success">{stats.reconciled}</p>
        </div>
        <div className="dashboard-card">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-accent-yellow" />
            <p className="text-[13px] text-text-secondary">Unreconciled</p>
          </div>
          <p className="mt-1 text-[28px] font-bold text-accent-yellow">{stats.unreconciled}</p>
        </div>
      </div>

      {/* Bank account tabs */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
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
        <div className="ml-auto flex items-center gap-2">
          {transactions.some((t) => !t.isReconciled) && (
            <Button
              onClick={suggestAllUnreconciled}
              disabled={!!suggestingId}
              variant="outline"
              className="h-10 gap-2 rounded-xl border-[var(--accent-ai)]/30 text-[13px] font-semibold text-[var(--accent-ai)] hover:bg-[var(--accent-ai)]/5"
            >
              {suggestingId ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Suggest GL for all
            </Button>
          )}
          {highConfUnreconciled.length > 0 && (
            <Button
              onClick={() => showSuccess("Auto-Reconciled", `${highConfUnreconciled.length} high-confidence transactions matched with AI-suggested GL accounts.`)}
              variant="outline"
              className="h-10 gap-2 rounded-xl border-[var(--accent-ai)]/30 text-[13px] font-semibold text-[var(--accent-ai)] hover:bg-[var(--accent-ai)]/5"
            >
              <Sparkles className="h-4 w-4" /> Auto-Reconcile ({highConfUnreconciled.length})
            </Button>
          )}
          <Button onClick={() => comingSoon("CSV Import")} className="h-10 gap-2 rounded-xl bg-text-primary px-4 text-[13px] font-semibold text-white hover:bg-text-primary/90">
            <Upload className="h-4 w-4" /> Import CSV
          </Button>
        </div>
      </div>

      {/* Transactions table */}
      <div className="dashboard-card overflow-hidden !p-0 overflow-x-auto">
        <div className="grid grid-cols-12 gap-3 border-b border-border-subtle bg-canvas/50 px-6 py-3 text-[12px] font-medium uppercase tracking-wide text-text-meta">
          <div className="col-span-1">Date</div>
          <div className="col-span-4">Description</div>
          <div className="col-span-1">Ref</div>
          <div className="col-span-2">Suggested Account</div>
          <div className="col-span-1 text-center">Confidence</div>
          <div className="col-span-2 text-right">Amount</div>
          <div className="col-span-1 text-center">Status</div>
        </div>

        {transactions.map((txn) => {
          const { name: suggestedName, confidence } = getDisplaySuggestion(txn);
          const aiSuggestion = suggestions[txn.id];
          const isSuggesting = suggestingId === txn.id;
          const isApplying = applyingId === txn.id;

          return (
            <div key={txn.id} className="grid grid-cols-12 gap-3 border-b border-border-subtle/50 px-6 py-3 text-[13px] transition-colors hover:bg-black/[0.01] items-center">
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
              <div className="col-span-2 text-[12px] text-text-secondary flex items-center gap-2 flex-wrap">
                {suggestedName ? (
                  <span className="flex items-center gap-1">
                    {confidence != null && confidence >= 0.9 && <Sparkles className="h-3 w-3 text-[var(--accent-ai)] shrink-0" />}
                    {suggestedName}
                  </span>
                ) : (
                  "—"
                )}
                {!txn.isReconciled && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-[11px] text-[var(--accent-ai)]"
                    onClick={() => fetchSuggestion(txn)}
                    disabled={!!suggestingId}
                  >
                    {isSuggesting ? <Loader2 className="h-3 w-3 animate-spin" /> : "Suggest"}
                  </Button>
                )}
              </div>
              <div className="col-span-1 text-center">
                {confidence != null ? (
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    confidence >= 0.9 ? "bg-success-light text-success" : confidence >= 0.7 ? "bg-accent-yellow/20 text-amber-700" : "bg-muted text-text-secondary"
                  }`}>
                    {Math.round(confidence * 100)}%
                  </span>
                ) : "—"}
              </div>
              <div className={`col-span-2 text-right font-mono font-medium ${txn.type === "credit" ? "text-success" : "text-error"}`}>
                {txn.type === "credit" ? "+" : "-"}AED {formatNumber(txn.amount)}
              </div>
              <div className="col-span-1 text-center flex items-center justify-center gap-1 flex-wrap">
                {txn.isReconciled ? (
                  <span className="rounded-full bg-success-light px-2 py-0.5 text-[10px] font-medium text-success">Matched</span>
                ) : (
                  <>
                    {aiSuggestion && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-[10px]"
                        onClick={() => applyAndLearn(txn)}
                        disabled={!!applyingId}
                      >
                        {isApplying ? <Loader2 className="h-3 w-3 animate-spin" /> : "Apply & learn"}
                      </Button>
                    )}
                    <button onClick={() => comingSoon("Bank Reconciliation")} className="rounded-full bg-text-primary/5 px-2 py-0.5 text-[10px] font-medium text-text-primary hover:bg-text-primary/10">Match</button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
