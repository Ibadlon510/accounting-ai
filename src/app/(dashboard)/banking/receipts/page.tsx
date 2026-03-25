"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatNumber, formatDate } from "@/lib/accounting/engine";
import { Plus, ArrowDownLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RecordReceiptPanel } from "@/components/modals/record-receipt-panel";
import type { BankingReceipt } from "@/lib/banking/types";

function categoryLabel(cat: string | null, isTransfer: boolean): string {
  if (isTransfer) return "Inter-account";
  switch (cat) {
    case "customer_payment":
      return "Customer Payment";
    case "owner_deposit":
      return "Owner's Deposit";
    case "refund_received":
      return "Refund Received";
    default:
      return cat ?? "—";
  }
}

async function fetchReceipts(page: number): Promise<{ receipts: BankingReceipt[]; total: number; totalPages: number }> {
  const res = await fetch(`/api/banking/receipts?page=${page}&limit=25`);
  if (!res.ok) return { receipts: [], total: 0, totalPages: 0 };
  const data = await res.json();
  return { receipts: data.receipts ?? [], total: data.total ?? 0, totalPages: data.totalPages ?? 0 };
}

export default function ReceiptsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const { data, isLoading: loading } = useQuery({
    queryKey: ["banking-receipts", page],
    queryFn: () => fetchReceipts(page),
  });
  const receipts = data?.receipts ?? [];
  const totalPages = data?.totalPages ?? 0;
  const total = data?.total ?? 0;
  const [search, setSearch] = useState("");
  const [recordOpen, setRecordOpen] = useState(false);

  const filtered = receipts.filter(
    (r) =>
      !search ||
      r.description?.toLowerCase().includes(search.toLowerCase()) ||
      r.accountName?.toLowerCase().includes(search.toLowerCase()) ||
      r.reference?.toLowerCase().includes(search.toLowerCase()) ||
      (r.entityName && r.entityName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Input
          type="search"
          placeholder="Search receipts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 w-64 rounded-xl border-border-subtle text-[13px]"
        />
        <Button onClick={() => setRecordOpen(true)} className="ml-auto h-10 gap-2 rounded-xl bg-text-primary px-4 text-[13px] font-semibold text-white hover:bg-text-primary/90">
          <Plus className="h-4 w-4" /> Record Receipt
        </Button>
      </div>

      <RecordReceiptPanel open={recordOpen} onOpenChange={setRecordOpen} onSuccess={() => { setPage(1); queryClient.invalidateQueries({ queryKey: ["banking-receipts"] }); }} />

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
          <div className="px-6 py-12 text-center text-[13px] text-text-meta">Loading receipts…</div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-12 text-center text-[13px] text-text-meta">No receipts yet. Record a receipt to get started.</div>
        ) : (
          filtered.map((r) => (
            <div key={r.id} className="grid grid-cols-12 gap-4 border-b border-border-subtle/50 px-6 py-3.5 text-[13px] transition-colors hover:bg-black/[0.01]">
              <div className="col-span-1 text-text-secondary">{formatDate(r.transactionDate)}</div>
              <div className="col-span-2 text-text-primary">{r.accountName}</div>
              <div className="col-span-2 flex items-center gap-1.5">
                {r.isInterAccountTransfer && (
                  <span className="rounded bg-muted px-2 py-0.5 text-[11px] font-medium text-text-secondary">Inter-account</span>
                )}
                <span>{categoryLabel(r.category, r.isInterAccountTransfer)}</span>
              </div>
              <div className="col-span-2 text-text-secondary truncate" title={r.entityName ?? "—"}>{r.entityName ?? "—"}</div>
              <div className="col-span-2 truncate text-text-primary">{r.description ?? "—"}</div>
              <div className="col-span-1 font-mono text-text-meta truncate">{r.reference ?? "—"}</div>
              <div className="col-span-2 flex items-center justify-end gap-1">
                <ArrowDownLeft className="h-3.5 w-3.5 text-success" />
                <span className="font-mono font-semibold text-success">
                  {r.currency} {formatNumber(r.amount)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between px-1">
          <p className="text-[12px] text-text-meta">{total} receipt{total !== 1 ? "s" : ""}</p>
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
