"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { formatNumber } from "@/lib/accounting/engine";
import {
  Landmark, CheckCircle2, AlertCircle, Upload, ArrowDownLeft, ArrowUpRight, Sparkles, Loader2, Plus,
  LayoutDashboard, Settings, RefreshCw, X, Activity, FileCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { comingSoon, showSuccess, showError } from "@/lib/utils/toast-helpers";
import { AddBankAccountPanel } from "@/components/modals/add-bank-account-panel";
import { BankingDashboard } from "@/components/dashboard/variants/banking-dashboard";
import { useDashboardPillPreferences } from "@/hooks/use-dashboard-pill-preferences";
import { DashboardCustomizePanel } from "@/components/dashboard/dashboard-customize-panel";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import type { BankingMiniStats } from "@/lib/dashboard/mini-stats-types";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json() as Promise<T>;
}

type BankAccount = { id: string; accountName: string; bankName: string; accountNumber: string; iban: string; currency: string; currentBalance: number; isActive: boolean };
type BankTransaction = { id: string; bankAccountId: string; transactionDate: string; description: string; amount: number; type: "debit" | "credit"; reference: string; category: string | null; isReconciled: boolean; suggestedAccount?: string; confidence?: number };

type Suggestion = {
  suggestedGlAccountId: string;
  suggestedGlName: string;
  confidence: number;
};

export default function BankingPage() {
  const router = useRouter();
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [allTransactions, setAllTransactions] = useState<BankTransaction[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [suggestions, setSuggestions] = useState<Record<string, Suggestion>>({});
  const [suggestingId, setSuggestingId] = useState<string | null>(null);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [addAccountOpen, setAddAccountOpen] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [dismissedInsight, setDismissedInsight] = useState(false);
  const { isVisible } = useDashboardPillPreferences("banking");

  const { data: mini, isLoading: miniLoading, error: miniError, refetch: refetchMini } = useQuery({
    queryKey: ["mini-stats", "banking"],
    queryFn: () => fetchJson<BankingMiniStats>("/api/banking/mini-stats"),
  });

  const refreshBanking = useCallback(() => {
    fetch("/api/banking")
      .then((r) => (r.ok ? r.json() : { accounts: [], transactions: [] }))
      .then((data) => {
        setBankAccounts(data.accounts ?? []);
        setAllTransactions(data.transactions ?? []);
        if (data.accounts?.length > 0) setSelectedAccountId((prev) => (prev ? prev : data.accounts[0].id));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/banking")
      .then((r) => (r.ok ? r.json() : { accounts: [], transactions: [] }))
      .then((data) => {
        setBankAccounts(data.accounts ?? []);
        setAllTransactions(data.transactions ?? []);
        if (data.accounts?.length > 0) setSelectedAccountId((prev) => (prev ? prev : data.accounts[0].id));
      })
      .catch(() => {});
  }, []);

  const transactions = allTransactions.filter((t) => t.bankAccountId === selectedAccountId);
  const reconciled = allTransactions.filter((t) => t.isReconciled).length;
  const unreconciled = allTransactions.filter((t) => !t.isReconciled).length;
  const totalBalance = bankAccounts.reduce((s, a) => s + a.currentBalance, 0);

  const getAccountInsights = (accountId: string) => {
    const acctTxns = allTransactions.filter((t) => t.bankAccountId === accountId);
    const rec = acctTxns.filter((t) => t.isReconciled).length;
    const unrecon = acctTxns.filter((t) => !t.isReconciled).length;
    const lastTxn = acctTxns.length > 0 ? [...acctTxns].sort((a, b) => b.transactionDate.localeCompare(a.transactionDate))[0] : null;
    return { reconciled: rec, unreconciled: unrecon, txCount: acctTxns.length, lastActivity: lastTxn?.transactionDate };
  };

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

  const insightText = unreconciled > 0
    ? `${unreconciled} transaction(s) need reconciliation — use AI suggestions to match`
    : allTransactions.length > 0
    ? "All transactions reconciled — bank feeds are up to date"
    : "No transactions yet. Import a bank statement to get started.";

  return (
    <div className="space-y-8">
      {/* ── AI Insight Banner ───────────────────────────────────────── */}
      {!dismissedInsight && (
        <div className="dashboard-card !py-3.5 !px-5 border-l-4 border-l-[var(--accent-ai)] flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-ai)]/10 shrink-0">
            <Sparkles className="h-4 w-4 text-[var(--accent-ai)]" />
          </div>
          <p className="flex-1 text-[13px] text-text-secondary">
            <span className="font-semibold text-text-primary">AI Insight: </span>
            {insightText}
          </p>
          <button
            onClick={() => setDismissedInsight(true)}
            className="flex h-6 w-6 items-center justify-center rounded-full text-text-meta hover:bg-muted/50 transition-colors shrink-0"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* ── Summary KPI Cards ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <div className="dashboard-card border-l-[3px] border-l-success">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-success/10">
            <Landmark className="h-5 w-5 text-success" strokeWidth={1.8} />
          </div>
          <p className="mt-3 text-[12px] font-medium text-text-meta uppercase tracking-wide">Total Balance</p>
          <p className="mt-0.5 text-[28px] font-extrabold tracking-tight text-success">AED {formatNumber(totalBalance)}</p>
          <p className="mt-1 text-[11px] text-text-meta">Across all accounts</p>
        </div>
        <div className="dashboard-card border-l-[3px] border-l-success">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-success/10">
            <CheckCircle2 className="h-5 w-5 text-success" strokeWidth={1.8} />
          </div>
          <p className="mt-3 text-[12px] font-medium text-text-meta uppercase tracking-wide">Reconciled</p>
          <p className="mt-0.5 text-[28px] font-extrabold tracking-tight text-success">{reconciled}</p>
          <p className="mt-1 text-[11px] text-text-meta">Transactions matched</p>
        </div>
        <div className="dashboard-card border-l-[3px] border-l-accent-yellow">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-yellow/10">
            <AlertCircle className="h-5 w-5 text-accent-yellow" strokeWidth={1.8} />
          </div>
          <p className="mt-3 text-[12px] font-medium text-text-meta uppercase tracking-wide">Unreconciled</p>
          <p className="mt-0.5 text-[28px] font-extrabold tracking-tight text-accent-yellow">{unreconciled}</p>
          <p className="mt-1 text-[11px] text-text-meta">Need matching</p>
        </div>
        <div className="dashboard-card border-l-[3px] border-l-[var(--accent-ai)]">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent-ai)]/10">
            <Landmark className="h-5 w-5 text-[var(--accent-ai)]" strokeWidth={1.8} />
          </div>
          <p className="mt-3 text-[12px] font-medium text-text-meta uppercase tracking-wide">Accounts</p>
          <p className="mt-0.5 text-[28px] font-extrabold tracking-tight text-[var(--accent-ai)]">{bankAccounts.length}</p>
          <p className="mt-1 text-[11px] text-text-meta">Bank accounts</p>
        </div>
      </div>

      {/* ── Banking Dashboard Section ───────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between pb-4 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-1.5">
              <LayoutDashboard className="h-4 w-4 text-text-secondary" />
              <h2 className="text-[15px] font-semibold text-text-primary">Dashboard</h2>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowCustomize(!showCustomize)} className="rounded-xl text-[12px]">
            <Settings className="h-3.5 w-3.5 mr-1.5" />
            {showCustomize ? "Back" : "Customize"}
          </Button>
        </div>
        {showCustomize ? (
          <div className="dashboard-card">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-border-subtle">
              <h3 className="text-[14px] font-semibold text-text-primary">Customize widgets</h3>
            </div>
            <DashboardCustomizePanel variant="banking" />
          </div>
        ) : (
          <>
            {miniLoading && <DashboardSkeleton />}
            {miniError && (
              <div className="dashboard-card border-l-4 border-l-destructive">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
                  <div className="flex-1">
                    <p className="text-[14px] font-semibold text-text-primary">Failed to load dashboard</p>
                    <p className="text-[12px] text-text-secondary mt-0.5">There was an error fetching banking data. Please try again.</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => refetchMini()} className="shrink-0 rounded-xl">
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Retry
                  </Button>
                </div>
              </div>
            )}
            {!miniLoading && !miniError && mini && (
              <BankingDashboard mini={mini} isVisible={isVisible} layout="page" />
            )}
          </>
        )}
      </div>

      {/* ── Bank Account Cards (insights per account) ─────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[16px] font-semibold text-text-primary">Bank Accounts</h2>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setAddAccountOpen(true)}
              className="h-10 gap-2 rounded-xl border-dashed border-border-subtle text-[13px] font-medium text-text-secondary hover:border-text-primary/30 hover:bg-text-primary/5 hover:text-text-primary"
            >
              <Plus className="h-4 w-4" /> Add Bank Account
            </Button>
            <Button
              onClick={() => router.push("/documents?upload=bank_statement")}
              className="h-10 gap-2 rounded-xl bg-text-primary px-4 text-[13px] font-semibold text-white hover:bg-text-primary/90"
            >
              <Upload className="h-4 w-4" /> Import Statement
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {bankAccounts.map((account) => {
            const insights = getAccountInsights(account.id);
            const isSelected = selectedAccountId === account.id;
            const balanceColor = account.currentBalance >= 0 ? "text-success" : "text-error";
            return (
              <button
                key={account.id}
                type="button"
                onClick={() => setSelectedAccountId(account.id)}
                className={`text-left dashboard-card border-l-[3px] transition-all hover:shadow-lg hover:-translate-y-0.5 ${
                  isSelected ? "border-l-[var(--accent-ai)] ring-2 ring-[var(--accent-ai)]/20" : "border-l-transparent"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-text-primary/10 shrink-0">
                    <Landmark className="h-5 w-5 text-text-primary" strokeWidth={1.8} />
                  </div>
                  {insights.unreconciled > 0 && (
                    <span className="rounded-full bg-accent-yellow/20 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                      {insights.unreconciled} unreconciled
                    </span>
                  )}
                </div>
                <p className="mt-3 text-[14px] font-semibold text-text-primary truncate">{account.accountName}</p>
                <p className="text-[11px] text-text-meta">{account.bankName || "Bank"} • {account.currency}</p>
                <p className={`mt-3 text-[22px] font-extrabold tracking-tight ${balanceColor}`}>
                  {account.currency} {formatNumber(account.currentBalance)}
                </p>
                <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-text-meta">
                  <span className="flex items-center gap-1">
                    <Activity className="h-3 w-3" />
                    {insights.txCount} transactions
                  </span>
                  <span className="flex items-center gap-1">
                    <FileCheck className="h-3 w-3 text-success" />
                    {insights.reconciled} reconciled
                  </span>
                </div>
                {insights.lastActivity && (
                  <p className="mt-1 text-[10px] text-text-meta">Last activity: {new Date(insights.lastActivity).toLocaleDateString()}</p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Selected Account: Transactions & Actions ─────────────────── */}
      {selectedAccountId && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[16px] font-semibold text-text-primary">
              Transactions — {bankAccounts.find((a) => a.id === selectedAccountId)?.accountName ?? "Account"}
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
      )}

      <AddBankAccountPanel
        open={addAccountOpen}
        onOpenChange={setAddAccountOpen}
        onSuccess={(account) => {
          refreshBanking();
          setSelectedAccountId(account.id);
        }}
      />
    </div>
  );
}
