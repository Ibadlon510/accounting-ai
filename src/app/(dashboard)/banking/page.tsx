"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { formatNumber } from "@/lib/accounting/engine";
import {
  Landmark, CheckCircle2, AlertCircle, Upload, LayoutDashboard, Settings, RefreshCw, X, Sparkles,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BankingDashboard } from "@/components/dashboard/variants/banking-dashboard";
import { useDashboardPillPreferences } from "@/hooks/use-dashboard-pill-preferences";
import { DashboardCustomizePanel } from "@/components/dashboard/dashboard-customize-panel";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { BankAccountCard } from "@/components/banking/bank-account-card";
import { usePageTitle } from "@/hooks/use-page-title";
import type { BankingMiniStats } from "@/lib/dashboard/mini-stats-types";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json() as Promise<T>;
}

type BankAccount = { id: string; accountName: string; bankName?: string; accountType?: string; currency: string; currentBalance: number; isActive?: boolean };
type BankTransaction = { id: string; bankAccountId: string; transactionDate: string; amount: number; type: "debit" | "credit"; isReconciled: boolean };

export default function BankingDashboardPage() {
  usePageTitle("Banking");
  const router = useRouter();
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [allTransactions, setAllTransactions] = useState<BankTransaction[]>([]);
  const [showCustomize, setShowCustomize] = useState(false);
  const [dismissedInsight, setDismissedInsight] = useState(false);
  const { isVisible } = useDashboardPillPreferences("banking");

  const { data: mini, isLoading: miniLoading, error: miniError, refetch: refetchMini } = useQuery({
    queryKey: ["mini-stats", "banking"],
    queryFn: () => fetchJson<BankingMiniStats>("/api/banking/mini-stats"),
  });

  useEffect(() => {
    fetch("/api/banking", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { accounts: [], transactions: [] }))
      .then((data) => {
        setBankAccounts(data.accounts ?? []);
        setAllTransactions(data.transactions ?? []);
      })
      .catch(() => {});
  }, []);

  const reconciled = allTransactions.filter((t) => t.isReconciled).length;
  const unreconciled = allTransactions.filter((t) => !t.isReconciled).length;
  const totalBalance = bankAccounts.reduce((s, a) => s + a.currentBalance, 0);

  const insightText =
    unreconciled > 0
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
        <Link href="/banking/accounts" className="dashboard-card border-l-[3px] border-l-[var(--accent-ai)] hover:shadow-lg transition-shadow block">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent-ai)]/10">
            <Landmark className="h-5 w-5 text-[var(--accent-ai)]" strokeWidth={1.8} />
          </div>
          <p className="mt-3 text-[12px] font-medium text-text-meta uppercase tracking-wide">Accounts</p>
          <p className="mt-0.5 text-[28px] font-extrabold tracking-tight text-[var(--accent-ai)]">{bankAccounts.length}</p>
          <p className="mt-1 text-[11px] text-text-meta">View bank accounts →</p>
        </Link>
      </div>

      {/* ── Bank Account Cards ────────────────────────────────────── */}
      {bankAccounts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-semibold text-text-primary">Your Accounts</h2>
            <Link
              href="/banking/accounts"
              className="text-[12px] font-medium text-[var(--accent-ai)] hover:underline"
            >
              Manage accounts →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {bankAccounts.map((account) => (
              <BankAccountCard
                key={account.id}
                id={account.id}
                accountName={account.accountName}
                bankName={account.bankName}
                accountType={account.accountType === "credit_card" ? "credit_card" : "bank"}
                currency={account.currency ?? "AED"}
                currentBalance={account.currentBalance}
                isActive={account.isActive}
                transactions={allTransactions}
                onClick={() => router.push(`/banking/accounts?selected=${account.id}`)}
              />
            ))}
          </div>
        </div>
      )}

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
    </div>
  );
}
