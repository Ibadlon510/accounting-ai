"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { formatNumber } from "@/lib/accounting/engine";
import { ShieldCheck, Pencil, Trash2 } from "lucide-react";

export type BankTransactionRow = {
  date: string;
  description: string;
  amount: number;
  type: "debit" | "credit";
  reference?: string;
  balance?: number;
};

type VerifyBankStatementProps = {
  transactions: BankTransactionRow[];
  onTransactionsChange?: (txns: BankTransactionRow[]) => void;
  bankAccounts: { id: string; accountName: string; bankName: string; currency: string }[];
  bankAccountId: string;
  setBankAccountId: (id: string) => void;
  saving: boolean;
  onSubmit: (e: React.FormEvent) => void;
};

export function VerifyBankStatement({
  transactions,
  onTransactionsChange,
  bankAccounts,
  bankAccountId,
  setBankAccountId,
  saving,
  onSubmit,
}: VerifyBankStatementProps) {
  const [editingIdx, setEditingIdx] = useState<number | null>(null);

  function updateTransaction(index: number, field: keyof BankTransactionRow, value: string | number) {
    if (!onTransactionsChange) return;
    const updated = transactions.map((t, i) => (i === index ? { ...t, [field]: value } : t));
    onTransactionsChange(updated);
  }

  function removeTransaction(index: number) {
    if (!onTransactionsChange) return;
    onTransactionsChange(transactions.filter((_, i) => i !== index));
  }

  return (
    <form onSubmit={onSubmit} className="flex-1 space-y-4">
      <div>
        <Label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-meta">
          Bank Account
        </Label>
        <SearchableSelect
          value={bankAccountId}
          onChange={setBankAccountId}
          options={bankAccounts.map((a) => ({
            value: a.id,
            label: `${a.accountName} (${a.bankName} — ${a.currency})`,
          }))}
          placeholder="Select bank account"
          searchPlaceholder="Search accounts..."
        />
      </div>

      <div className="rounded-xl border border-border-subtle overflow-hidden">
        <div className="max-h-80 overflow-auto">
          <table className="w-full text-[13px]">
            <thead className="sticky top-0 bg-muted/50">
              <tr className="border-b border-border-subtle">
                <th className="px-2 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-text-meta">Date</th>
                <th className="px-2 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-text-meta">Description</th>
                <th className="px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-text-meta">Type</th>
                <th className="px-2 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-text-meta">Amount</th>
                <th className="px-2 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-text-meta">Ref</th>
                {onTransactionsChange && <th className="w-14 px-2 py-2"></th>}
              </tr>
            </thead>
            <tbody>
              {transactions.map((t, i) => (
                <tr key={i} className="border-b border-border-subtle/50 group">
                  {editingIdx === i ? (
                    <>
                      <td className="px-2 py-1">
                        <Input type="date" value={t.date} onChange={(e) => updateTransaction(i, "date", e.target.value)} className="h-7 rounded-md border-border-subtle text-[12px]" />
                      </td>
                      <td className="px-2 py-1">
                        <Input value={t.description} onChange={(e) => updateTransaction(i, "description", e.target.value)} className="h-7 rounded-md border-border-subtle text-[12px]" />
                      </td>
                      <td className="px-2 py-1 text-center">
                        <select value={t.type} onChange={(e) => updateTransaction(i, "type", e.target.value)} className="h-7 rounded-md border border-border-subtle bg-transparent px-1 text-[12px]">
                          <option value="debit">debit</option>
                          <option value="credit">credit</option>
                        </select>
                      </td>
                      <td className="px-2 py-1">
                        <Input type="number" step="0.01" value={t.amount || ""} onChange={(e) => updateTransaction(i, "amount", parseFloat(e.target.value) || 0)} className="h-7 rounded-md border-border-subtle text-right text-[12px] font-mono" />
                      </td>
                      <td className="px-2 py-1">
                        <Input value={t.reference ?? ""} onChange={(e) => updateTransaction(i, "reference", e.target.value)} className="h-7 rounded-md border-border-subtle text-[12px]" />
                      </td>
                      <td className="px-2 py-1 text-center">
                        <button type="button" onClick={() => setEditingIdx(null)} className="text-[11px] text-success font-medium hover:underline">Done</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-2 py-2 text-text-secondary">{t.date}</td>
                      <td className="px-2 py-2 text-text-primary">{t.description}</td>
                      <td className="px-2 py-2 text-center">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${t.type === "credit" ? "bg-success/20 text-success" : "bg-error/20 text-error"}`}>
                          {t.type}
                        </span>
                      </td>
                      <td className={`px-2 py-2 text-right font-mono font-medium ${t.type === "credit" ? "text-success" : "text-error"}`}>
                        {t.type === "credit" ? "+" : "-"}
                        {formatNumber(t.amount)}
                      </td>
                      <td className="px-2 py-2 text-[11px] text-text-meta">{t.reference ?? "—"}</td>
                      {onTransactionsChange && (
                        <td className="px-2 py-2 text-center">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button type="button" onClick={() => setEditingIdx(i)} className="text-text-meta hover:text-text-primary" title="Edit">
                              <Pencil className="h-3 w-3" />
                            </button>
                            <button type="button" onClick={() => removeTransaction(i)} className="text-text-meta hover:text-error" title="Remove">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </td>
                      )}
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {transactions.length === 0 && (
          <div className="px-4 py-8 text-center text-[13px] text-text-secondary">
            No transactions extracted. Upload a CSV or Excel file for bank statements.
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-4">
        <span className="text-[12px] text-text-meta">{transactions.length} transaction{transactions.length !== 1 ? "s" : ""}</span>
        <Button
          type="submit"
          disabled={saving || !bankAccountId || transactions.length === 0}
          className="gap-2 rounded-xl bg-success px-6 text-[13px] font-semibold text-white hover:bg-success/90"
        >
          <ShieldCheck className="h-4 w-4" />
          {saving ? "Importing..." : "Verify & Import"}
        </Button>
      </div>
    </form>
  );
}
