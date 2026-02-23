"use client";

import { useState, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { formatNumber } from "@/lib/accounting/engine";
import {
  ArrowDownLeft, ArrowUpRight, Sparkles, Loader2, ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { comingSoon, showSuccess, showError } from "@/lib/utils/toast-helpers";

type BankAccount = { id: string; accountName: string; bankName: string; accountNumber: string; iban: string; currency: string; currentBalance: number; isActive: boolean };
type BankTransaction = { id: string; bankAccountId: string; transactionDate: string; description: string; amount: number; type: "debit" | "credit"; reference: string; category: string | null; isReconciled: boolean; suggestedAccount?: string; confidence?: number };

type Suggestion = {
  suggestedGlAccountId: string;
  suggestedGlName: string;
  confidence: number;
};

export default function BankAccountTransactionsPage() {
  const params = useParams<{ accountId: string }>();
  const router = useRouter();
  const accountId = params.accountId;

  const [account, setAccount] = useState<BankAccount | null>(null);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [suggestions, setSuggestions] = useState<Record<string, Suggestion>>({});
  const [suggestingId, setSuggestingId] = useState<string | null>(null);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    if (!accountId) return;
    setLoading(true);
    setFetchError(null);
    fetch("/api/banking", { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error(`API returned ${r.status}`);
        return r.json();
      })
      .then((data: { accounts?: BankAccount[]; transactions?: BankTransaction[] }) => {
        const acct = (data.accounts ?? []).find((a) => a.id === accountId);
        const txns = (data.transactions ?? []).filter((t) => t.bankAccountId === accountId);
        setAccount(acct ?? null);
        setTransactions(txns);
        if (!acct) setFetchError("Account not found");
      })
      .catch((err) => {
        console.error("[BankAccount] fetch error:", err);
        setFetchError(err?.message ?? "Failed to load account");
      })
      .finally(() => setLoading(false));
  }, [accountId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

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
        body: JSON.stringify({ description: txn.description, amount: txn.amount }),
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
          body: JSON.stringify({ pattern: txn.description, glAccountId: ai.suggestedGlAccountId }),
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
    const unreconTxns = transactions.filter((t) => !t.isReconciled);
    unreconTxns.forEach((txn) => fetchSuggestion(txn));
  }, [transactions, fetchSuggestion]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-text-secondary text-[13px]">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading account…
      </div>
    );
  }

  if (fetchError || !account) {
    return (
      <div className="dashboard-card border-l-4 border-l-destructive">
        <p className="text-[13px] text-destructive font-medium">{fetchError ?? "Account not found"}</p>
        <Button variant="outline" size="sm" onClick={() => router.push("/banking/accounts")} className="mt-2 gap-2 rounded-xl text-[12px]">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Accounts
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with back link */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/banking/accounts")}
          className="gap-2 rounded-xl text-[13px] text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Accounts
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-[16px] font-semibold text-text-primary">
          Transactions — {account.accountName}
        </h2>
        <div className="flex items-center gap-2">
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
        </div>
      </div>

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

        {transactions.length === 0 ? (
          <div className="py-12 text-center text-text-secondary text-[13px]">
            No transactions for this account. Import a bank statement to get started.
          </div>
        ) : (
          transactions.map((txn) => {
            const { name: suggestedName, confidence } = getDisplaySuggestion(txn);
            const aiSuggestion = suggestions[txn.id];
            const isSuggesting = suggestingId === txn.id;
            const isApplying = applyingId === txn.id;

            return (
              <div
                key={txn.id}
                className="grid grid-cols-12 gap-3 border-b border-border-subtle/50 px-6 py-3 text-[13px] transition-colors hover:bg-black/[0.01] items-center"
              >
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
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        confidence >= 0.9 ? "bg-success-light text-success" : confidence >= 0.7 ? "bg-accent-yellow/20 text-amber-700" : "bg-muted text-text-secondary"
                      }`}
                    >
                      {Math.round(confidence * 100)}%
                    </span>
                  ) : (
                    "—"
                  )}
                </div>
                <div className={`col-span-2 text-right font-mono font-medium ${txn.type === "credit" ? "text-success" : "text-error"}`}>
                  {txn.type === "credit" ? "+" : "-"}{account.currency} {formatNumber(txn.amount)}
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
                      <button
                        onClick={() => comingSoon("Bank Reconciliation")}
                        className="rounded-full bg-text-primary/5 px-2 py-0.5 text-[10px] font-medium text-text-primary hover:bg-text-primary/10"
                      >
                        Match
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
