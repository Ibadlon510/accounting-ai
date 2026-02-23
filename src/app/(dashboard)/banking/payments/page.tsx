"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatNumber } from "@/lib/accounting/engine";
import { Plus, ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RecordPaymentBankingPanel } from "@/components/modals/record-payment-banking-panel";
import type { BankingPayment } from "@/lib/banking/types";

function categoryLabel(cat: string | null, isTransfer: boolean): string {
  if (isTransfer) return "Inter-account";
  switch (cat) {
    case "supplier_payment":
      return "Supplier Payment";
    case "owner_withdrawal":
      return "Owner's Withdrawal";
    case "refund_to_customer":
      return "Refund to Customer";
    default:
      return cat ?? "—";
  }
}

async function fetchPayments(page: number): Promise<{ payments: BankingPayment[]; total: number; totalPages: number }> {
  const res = await fetch(`/api/banking/payments?page=${page}&limit=25`);
  if (!res.ok) return { payments: [], total: 0, totalPages: 0 };
  const data = await res.json();
  return { payments: data.payments ?? [], total: data.total ?? 0, totalPages: data.totalPages ?? 0 };
}

export default function PaymentsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const { data, isLoading: loading } = useQuery({
    queryKey: ["banking-payments", page],
    queryFn: () => fetchPayments(page),
  });
  const payments = data?.payments ?? [];
  const totalPages = data?.totalPages ?? 0;
  const total = data?.total ?? 0;
  const [search, setSearch] = useState("");
  const [recordOpen, setRecordOpen] = useState(false);

  const filtered = payments.filter(
    (p) =>
      !search ||
      p.description?.toLowerCase().includes(search.toLowerCase()) ||
      p.accountName?.toLowerCase().includes(search.toLowerCase()) ||
      p.reference?.toLowerCase().includes(search.toLowerCase()) ||
      (p.entityName && p.entityName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Input
          type="search"
          placeholder="Search payments..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 w-64 rounded-xl border-border-subtle text-[13px]"
        />
        <Button onClick={() => setRecordOpen(true)} className="ml-auto h-10 gap-2 rounded-xl bg-text-primary px-4 text-[13px] font-semibold text-white hover:bg-text-primary/90">
          <Plus className="h-4 w-4" /> Record Payment
        </Button>
      </div>

      <RecordPaymentBankingPanel open={recordOpen} onOpenChange={setRecordOpen} onSuccess={() => { setPage(1); queryClient.invalidateQueries({ queryKey: ["banking-payments"] }); }} />

      <div className="dashboard-card overflow-hidden !p-0">
        <div className="grid grid-cols-12 gap-4 border-b border-border-subtle bg-canvas/50 px-6 py-3 text-[12px] font-medium uppercase tracking-wide text-text-meta">
          <div className="col-span-1">Date</div>
          <div className="col-span-2">Bank Account</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-2">Entity</div>
          <div className="col-span-2">Description</div>
          <div className="col-span-1">Ref</div>
          <div className="col-span-2 text-right">Amount</div>
        </div>

        {loading ? (
          <div className="px-6 py-12 text-center text-[13px] text-text-meta">Loading payments…</div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-12 text-center text-[13px] text-text-meta">No payments yet. Record a payment to get started.</div>
        ) : (
          filtered.map((p) => (
            <div key={p.id} className="grid grid-cols-12 gap-4 border-b border-border-subtle/50 px-6 py-3.5 text-[13px] transition-colors hover:bg-black/[0.01]">
              <div className="col-span-1 text-text-secondary">{p.transactionDate}</div>
              <div className="col-span-2 text-text-primary">{p.accountName}</div>
              <div className="col-span-2 flex items-center gap-1.5">
                {p.isInterAccountTransfer && (
                  <span className="rounded bg-muted px-2 py-0.5 text-[11px] font-medium text-text-secondary">Inter-account</span>
                )}
                <span>{categoryLabel(p.category, p.isInterAccountTransfer)}</span>
              </div>
              <div className="col-span-2 text-text-secondary truncate" title={p.entityName ?? "—"}>{p.entityName ?? "—"}</div>
              <div className="col-span-2 truncate text-text-primary">{p.description ?? "—"}</div>
              <div className="col-span-1 font-mono text-text-meta truncate">{p.reference ?? "—"}</div>
              <div className="col-span-2 flex items-center justify-end gap-1">
                <ArrowUpRight className="h-3.5 w-3.5 text-error" />
                <span className="font-mono font-semibold text-error">
                  {p.currency} {formatNumber(p.amount)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between px-1">
          <p className="text-[12px] text-text-meta">{total} payment{total !== 1 ? "s" : ""}</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="h-8 gap-1 rounded-lg text-[12px]">
              <ChevronLeft className="h-3.5 w-3.5" /> Prev
            </Button>
            <span className="text-[12px] text-text-secondary">Page {page} of {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="h-8 gap-1 rounded-lg text-[12px]">
              Next <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
