"use client";

import { useState, useEffect } from "react";
import { formatNumber, formatDate } from "@/lib/accounting/engine";
import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CreateExpensePanel } from "@/components/modals/create-expense-panel";

type Expense = {
  id: string;
  expenseNumber: string;
  date: string;
  supplierId: string | null;
  supplierName: string | null;
  bankAccountId: string;
  bankAccountName: string | null;
  description: string | null;
  subtotal: number;
  taxAmount: number;
  total: number;
  currency: string;
  reference: string | null;
  journalEntryId: string | null;
  createdAt: string;
};
type Supplier = { id: string; name: string; email: string; phone: string; isActive: boolean };
type BankAccount = { id: string; accountName: string; bankName: string; currency: string };
type Account = { id: string; code: string; name: string };

export default function ExpensesPage() {
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);

  function loadExpenses() {
    fetch("/api/purchases/expenses", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { expenses: [] }))
      .then((d) => setExpenses(d.expenses ?? []))
      .catch(() => {});
  }

  useEffect(() => {
    loadExpenses();
    fetch("/api/purchases/suppliers", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { suppliers: [] }))
      .then((d) => setSuppliers(d.suppliers ?? []))
      .catch(() => {});
    fetch("/api/banking", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { accounts: [] }))
      .then((d) => setBankAccounts(d.accounts ?? []))
      .catch(() => {});
    fetch("/api/accounting/chart-of-accounts", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { accounts: [] }))
      .then((d) => setAccounts(d.accounts ?? []))
      .catch(() => {});
  }, []);

  async function handleCreate(data: {
    date: string;
    supplierId?: string;
    supplierName?: string;
    bankAccountId: string;
    description?: string;
    currency?: string;
    reference?: string;
    lines: { description: string; glAccountId: string; quantity: number; unitPrice: number; amount: number; taxRate: number; taxAmount: number }[];
  }) {
    const subtotal = data.lines.reduce((s, l) => s + l.amount, 0);
    const taxAmount = data.lines.reduce((s, l) => s + l.taxAmount, 0);
    const res = await fetch("/api/purchases/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) {
      const { showError } = await import("@/lib/utils/toast-helpers");
      showError(json.error ?? "Failed to create expense");
      throw new Error(json.error ?? "Failed to create expense");
    }
    loadExpenses();
  }

  const filtered = expenses.filter(
    (e) =>
      (e.supplierName ?? "").toLowerCase().includes(search.toLowerCase()) ||
      e.expenseNumber.toLowerCase().includes(search.toLowerCase()) ||
      (e.description ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-meta" />
          <Input
            placeholder="Search expenses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 rounded-xl border-border-subtle bg-surface pl-10 text-[13px] focus-visible:ring-text-primary/20"
          />
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="h-10 gap-2 rounded-xl bg-text-primary px-4 text-[13px] font-semibold text-white hover:bg-text-primary/90"
        >
          <Plus className="h-4 w-4" /> New Expense
        </Button>
        <CreateExpensePanel
          open={createOpen}
          onOpenChange={setCreateOpen}
          suppliers={suppliers}
          bankAccounts={bankAccounts}
          accounts={accounts}
          onCreate={handleCreate}
        />
      </div>

      <div className="dashboard-card overflow-hidden !p-0">
        <div className="grid grid-cols-12 gap-4 border-b border-border-subtle bg-canvas/50 px-6 py-3 text-[12px] font-medium uppercase tracking-wide text-text-meta">
          <div className="col-span-2">Expense #</div>
          <div className="col-span-2">Date</div>
          <div className="col-span-2">Supplier</div>
          <div className="col-span-2">Bank Account</div>
          <div className="col-span-2">Description</div>
          <div className="col-span-2 text-right">Total</div>
        </div>

        {filtered.length === 0 && (
          <div className="px-6 py-12 text-center text-[13px] text-text-meta">
            No expenses found. Click &ldquo;New Expense&rdquo; to record a direct payment.
          </div>
        )}

        {filtered.map((exp) => (
          <div
            key={exp.id}
            className="grid w-full grid-cols-12 gap-4 border-b border-border-subtle/50 px-6 py-3.5 text-left text-[13px] transition-colors hover:bg-black/[0.01]"
          >
            <div className="col-span-2 font-mono font-medium text-text-primary">{exp.expenseNumber}</div>
            <div className="col-span-2 text-text-secondary">{formatDate(exp.date)}</div>
            <div className="col-span-2 text-text-primary">{exp.supplierName || "—"}</div>
            <div className="col-span-2 text-text-secondary">{exp.bankAccountName || "—"}</div>
            <div className="col-span-2 truncate text-text-secondary">{exp.description || "—"}</div>
            <div className="col-span-2 text-right font-mono font-medium text-text-primary">
              {exp.currency} {formatNumber(exp.total)}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
