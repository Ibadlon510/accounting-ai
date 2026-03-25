"use client";

import { useState, useEffect } from "react";
import { formatNumber, formatDate } from "@/lib/accounting/engine";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

type Account = { id: string; code: string; name: string; accountType?: { name: string; category: string; normalBalance: string }; isActive: boolean };
type LedgerEntry = { date: string; entryNumber: string; description: string; reference?: string; debit: number; credit: number; balance: number };

export default function GeneralLedgerPage() {
  const [search, setSearch] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);

  useEffect(() => {
    fetch("/api/accounting/chart-of-accounts", { cache: "no-store" })
      .then((r) => r.ok ? r.json() : { accounts: [] })
      .then((d) => setAccounts(d.accounts ?? []))
      .catch(() => {});
    fetch("/api/accounting/general-ledger", { cache: "no-store" })
      .then((r) => r.ok ? r.json() : { balances: {} })
      .then((d) => setBalances(d.balances ?? {}))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedAccountId) { setLedgerEntries([]); return; }
    fetch(`/api/accounting/general-ledger?accountId=${selectedAccountId}`, { cache: "no-store" })
      .then((r) => r.ok ? r.json() : { entries: [] })
      .then((d) => setLedgerEntries(d.entries ?? []))
      .catch(() => setLedgerEntries([]));
  }, [selectedAccountId]);

  const filteredAccounts = accounts.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.code.includes(search)
  );

  const selectedAccount = selectedAccountId
    ? accounts.find((a) => a.id === selectedAccountId)
    : null;

  return (
    <>
      <div className="grid grid-cols-12 gap-6">
        {/* Account list sidebar */}
        <div className="col-span-4">
          <div className="dashboard-card !p-0 overflow-hidden">
            <div className="border-b border-border-subtle p-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-meta" />
                <Input
                  placeholder="Search accounts..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 rounded-lg border-border-subtle bg-transparent pl-9 text-[12px] focus-visible:ring-text-primary/20"
                />
              </div>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              {filteredAccounts.map((account) => {
                const balance = balances[account.id] ?? 0;

                return (
                  <button
                    key={account.id}
                    onClick={() => setSelectedAccountId(account.id)}
                    className={`flex w-full items-center justify-between border-b border-border-subtle/40 px-4 py-3 text-left transition-colors hover:bg-black/[0.02] ${
                      selectedAccountId === account.id
                        ? "bg-text-primary/5"
                        : ""
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-text-meta">
                          {account.code}
                        </span>
                      </div>
                      <span className="text-[13px] font-medium text-text-primary">
                        {account.name}
                      </span>
                    </div>
                    <span
                      className={`text-[13px] font-semibold ${
                        balance >= 0 ? "text-text-primary" : "text-error"
                      }`}
                    >
                      {formatNumber(Math.abs(balance))}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Ledger detail */}
        <div className="col-span-8">
          {selectedAccount ? (
            <div className="dashboard-card overflow-hidden !p-0">
              {/* Account header */}
              <div className="border-b border-border-subtle px-6 py-4">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[13px] text-text-meta">
                    {selectedAccount.code}
                  </span>
                  <h3 className="text-[16px] font-semibold text-text-primary">
                    {selectedAccount.name}
                  </h3>
                </div>
                <p className="mt-0.5 text-[12px] capitalize text-text-secondary">
                  {selectedAccount.accountType?.name} •{" "}
                  {selectedAccount.accountType?.normalBalance} balance
                </p>
              </div>

              {/* Table header */}
              <div className="grid grid-cols-12 gap-3 border-b border-border-subtle bg-canvas/50 px-6 py-2.5 text-[11px] font-medium uppercase tracking-wide text-text-meta">
                <div className="col-span-2">Date</div>
                <div className="col-span-2">Entry #</div>
                <div className="col-span-3">Description</div>
                <div className="col-span-1">Ref</div>
                <div className="col-span-1 text-right">Debit</div>
                <div className="col-span-1 text-right">Credit</div>
                <div className="col-span-2 text-right">Balance</div>
              </div>

              {/* Entries */}
              {ledgerEntries.map((entry, i) => (
                <div
                  key={i}
                  className="grid grid-cols-12 gap-3 border-b border-border-subtle/40 px-6 py-2.5 text-[13px] transition-colors hover:bg-black/[0.01]"
                >
                  <div className="col-span-2 text-text-secondary">
                    {formatDate(entry.date)}
                  </div>
                  <div className="col-span-2 font-mono text-[12px] text-text-secondary">
                    {entry.entryNumber}
                  </div>
                  <div className="col-span-3 truncate text-text-primary">
                    {entry.description}
                  </div>
                  <div className="col-span-1 text-[12px] text-text-meta">
                    {entry.reference ?? "—"}
                  </div>
                  <div className="col-span-1 text-right font-mono text-text-primary">
                    {entry.debit > 0 ? formatNumber(entry.debit) : "—"}
                  </div>
                  <div className="col-span-1 text-right font-mono text-text-primary">
                    {entry.credit > 0 ? formatNumber(entry.credit) : "—"}
                  </div>
                  <div className="col-span-2 text-right font-mono font-semibold text-text-primary">
                    {formatNumber(entry.balance)}
                  </div>
                </div>
              ))}

              {ledgerEntries.length === 0 && (
                <div className="px-6 py-12 text-center text-[14px] text-text-meta">
                  No transactions for this account
                </div>
              )}
            </div>
          ) : (
            <div className="dashboard-card flex items-center justify-center py-24">
              <p className="text-[14px] text-text-meta">
                Select an account to view its ledger
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
