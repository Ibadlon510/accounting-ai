"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { AreaChart, Area, YAxis } from "recharts";
import { Landmark, CreditCard, CheckCircle2, FileCheck, Activity, Settings } from "lucide-react";
import { formatNumber } from "@/lib/accounting/engine";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────
export interface BankAccountCardTransaction {
  bankAccountId: string;
  transactionDate: string;
  amount: number;
  type: "debit" | "credit";
  isReconciled: boolean;
}

export interface BankAccountCardProps {
  id: string;
  accountName: string;
  bankName?: string | null;
  accountType?: "bank" | "credit_card";
  currency: string;
  currentBalance: number;
  isActive?: boolean;
  transactions: BankAccountCardTransaction[];
  isSelected?: boolean;
  onClick?: () => void;
  onSettingsClick?: (e: React.MouseEvent) => void;
}

// ── Helpers ──────────────────────────────────────────────────────────

/** Build daily running-balance points from transactions for sparkline. */
function buildTrendData(
  transactions: BankAccountCardTransaction[],
  currentBalance: number
) {
  if (transactions.length === 0) {
    // Show flat line at current balance
    return [
      { day: 0, balance: currentBalance },
      { day: 1, balance: currentBalance },
    ];
  }

  // Sort oldest → newest
  const sorted = [...transactions].sort(
    (a, b) => a.transactionDate.localeCompare(b.transactionDate)
  );

  // Walk backwards from currentBalance to compute historical balances
  // Start from current and subtract recent txns to find past balances
  const points: { day: number; balance: number }[] = [];
  let runningBalance = currentBalance;

  // Build reverse cumulative (newest first)
  const reversed = [...sorted].reverse();
  const balances: number[] = [currentBalance];

  for (const txn of reversed) {
    // Undo each transaction to get the balance before it
    if (txn.type === "credit") {
      runningBalance -= txn.amount;
    } else {
      runningBalance += txn.amount;
    }
    balances.unshift(runningBalance);
  }

  // Sample up to 30 points for a smooth sparkline
  const step = Math.max(1, Math.floor(balances.length / 30));
  for (let i = 0; i < balances.length; i += step) {
    points.push({ day: i, balance: balances[i] });
  }
  // Always include the last point (current balance)
  const last = balances[balances.length - 1];
  if (points[points.length - 1]?.balance !== last) {
    points.push({ day: balances.length - 1, balance: last });
  }

  return points;
}

// ── Component ────────────────────────────────────────────────────────

export function BankAccountCard({
  id,
  accountName,
  bankName,
  accountType = "bank",
  currency,
  currentBalance,
  transactions,
  isSelected = false,
  onClick,
  onSettingsClick,
}: BankAccountCardProps) {
  const accountTxns = useMemo(
    () => transactions.filter((t) => t.bankAccountId === id),
    [transactions, id]
  );

  const unreconciled = useMemo(
    () => accountTxns.filter((t) => !t.isReconciled).length,
    [accountTxns]
  );

  const txCount = accountTxns.length;

  const trendData = useMemo(
    () => buildTrendData(accountTxns, currentBalance),
    [accountTxns, currentBalance]
  );

  const balanceColor = currentBalance >= 0 ? "text-success" : "text-error";
  const sparkColor = currentBalance >= 0 ? "var(--success)" : "var(--error)";
  const gradientId = `sparkGrad-${id.slice(0, 8)}`;

  // Self-measuring ref for sparkline (ResponsiveContainer fails inside absolute containers)
  const sparkRef = useRef<HTMLDivElement>(null);
  const [sparkWidth, setSparkWidth] = useState(0);

  useEffect(() => {
    const el = sparkRef.current;
    if (!el) return;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0) setSparkWidth(Math.round(rect.width));
    };
    measure();
    const obs = new ResizeObserver(measure);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const lastActivity = useMemo(() => {
    if (accountTxns.length === 0) return null;
    const sorted = [...accountTxns].sort((a, b) =>
      b.transactionDate.localeCompare(a.transactionDate)
    );
    return sorted[0].transactionDate;
  }, [accountTxns]);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative text-left overflow-hidden rounded-2xl border transition-all duration-200",
        "bg-[var(--surface)] hover:shadow-lg hover:-translate-y-0.5",
        "min-h-[210px] flex flex-col",
        isSelected
          ? "border-[var(--accent-ai)] ring-2 ring-[var(--accent-ai)]/20 shadow-md"
          : "border-[var(--border-subtle)] hover:border-[var(--border-default)]"
      )}
    >
      {/* ── Sparkline Background ──────────────────────────────── */}
      <div
        ref={sparkRef}
        className="absolute inset-x-0 bottom-0 h-24 pointer-events-none opacity-[0.35]"
      >
        {sparkWidth > 0 && (
          <AreaChart
            width={sparkWidth}
            height={96}
            data={trendData}
            margin={{ top: 4, right: 0, bottom: 0, left: 0 }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={sparkColor} stopOpacity={0.8} />
                <stop offset="100%" stopColor={sparkColor} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <YAxis hide domain={[(dataMin: number) => dataMin - (dataMin === 0 ? 100 : Math.abs(dataMin) * 0.1), (dataMax: number) => dataMax + (dataMax === 0 ? 100 : Math.abs(dataMax) * 0.1)]} />
            <Area
              type="monotone"
              dataKey="balance"
              stroke={sparkColor}
              strokeWidth={2.5}
              fill={`url(#${gradientId})`}
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        )}
      </div>

      {/* ── Card Content ──────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col flex-1 p-5">
        {/* Top row: icon + account name | badge + gear */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                isSelected ? "bg-[var(--accent-ai)]/10" : "bg-text-primary/5"
              )}
            >
              {accountType === "credit_card" ? (
                <CreditCard
                  className={cn(
                    "h-5 w-5",
                    isSelected ? "text-[var(--accent-ai)]" : "text-text-primary"
                  )}
                  strokeWidth={1.8}
                />
              ) : (
                <Landmark
                  className={cn(
                    "h-5 w-5",
                    isSelected ? "text-[var(--accent-ai)]" : "text-text-primary"
                  )}
                  strokeWidth={1.8}
                />
              )}
            </div>
            <p className="text-[18px] font-bold text-text-primary truncate leading-tight">
              {accountName}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
          {onSettingsClick && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSettingsClick(e);
              }}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-text-meta hover:bg-muted/60 hover:text-text-primary transition-colors"
              aria-label="Account settings"
            >
              <Settings className="h-4 w-4" strokeWidth={1.8} />
            </button>
          )}
          </div>
        </div>

        {/* Subtitle */}
        <p className="mt-4 text-[11px] text-text-meta truncate">
          {bankName || (accountType === "credit_card" ? "Card" : "Bank")} &middot; {currency}
        </p>

        {/* Balance (hero) */}
        <p className={cn("mt-2 text-[24px] font-extrabold tracking-tight leading-none", balanceColor)}>
          {currency} {formatNumber(currentBalance)}
        </p>

        {/* Footer meta */}
        <div className="mt-4 flex items-center justify-between gap-2 text-[11px] text-text-meta">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Activity className="h-3 w-3" />
              {txCount} transactions
            </span>
            {lastActivity && (
              <span>
                Last: {new Date(lastActivity).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
              </span>
            )}
          </div>
          <span
            className={cn(
              "flex items-center gap-1 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide",
              unreconciled === 0
                ? "bg-success/10 text-success"
                : "bg-accent-yellow/15 text-amber-700 dark:text-amber-400"
            )}
          >
            {unreconciled === 0 ? (
              <>
                <CheckCircle2 className="h-3 w-3" /> Up to date
              </>
            ) : (
              <>
                <FileCheck className="h-3 w-3" /> {unreconciled} to reconcile
              </>
            )}
          </span>
        </div>
      </div>
    </button>
  );
}
