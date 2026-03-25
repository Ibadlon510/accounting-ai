"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatNumber, formatDate } from "@/lib/accounting/engine";
import { Plus, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TransferPanel } from "@/components/modals/transfer-panel";
import type { BankingTransfer } from "@/lib/banking/types";

async function fetchTransfers(): Promise<BankingTransfer[]> {
  const res = await fetch("/api/banking/transfers", { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return data.transfers ?? [];
}

export default function TransfersPage() {
  const queryClient = useQueryClient();
  const { data: transfers = [], isLoading: loading } = useQuery({
    queryKey: ["banking-transfers"],
    queryFn: fetchTransfers,
  });
  const [transferOpen, setTransferOpen] = useState(false);

  return (
    <>
      <div className="mb-6 flex justify-end">
        <Button onClick={() => setTransferOpen(true)} className="h-10 gap-2 rounded-xl bg-text-primary px-4 text-[13px] font-semibold text-white hover:bg-text-primary/90">
          <Plus className="h-4 w-4" /> Transfer
        </Button>
      </div>

      <TransferPanel open={transferOpen} onOpenChange={setTransferOpen} onSuccess={() => queryClient.invalidateQueries({ queryKey: ["banking-transfers"] })} />

      <div className="dashboard-card overflow-hidden !p-0">
        <div className="grid grid-cols-12 gap-4 border-b border-border-subtle bg-canvas/50 px-6 py-3 text-[12px] font-medium uppercase tracking-wide text-text-meta">
          <div className="col-span-1">Date</div>
          <div className="col-span-3">From Account</div>
          <div className="col-span-1 flex items-center justify-center">
            <ArrowLeftRight className="h-4 w-4" />
          </div>
          <div className="col-span-3">To Account</div>
          <div className="col-span-2">Reference</div>
          <div className="col-span-2 text-right">Amount</div>
        </div>

        {loading ? (
          <div className="px-6 py-12 text-center text-[13px] text-text-meta">Loading transfers…</div>
        ) : transfers.length === 0 ? (
          <div className="px-6 py-12 text-center text-[13px] text-text-meta">No inter-account transfers yet. Use the Transfer button to create one.</div>
        ) : (
          transfers.map((t) => (
            <div key={t.id} className="grid grid-cols-12 gap-4 border-b border-border-subtle/50 px-6 py-3.5 text-[13px] transition-colors hover:bg-black/[0.01]">
              <div className="col-span-1 text-text-secondary">{formatDate(t.date)}</div>
              <div className="col-span-3 text-text-primary">{t.fromAccountName}</div>
              <div className="col-span-1 flex items-center justify-center">
                <ArrowLeftRight className="h-4 w-4 text-text-meta" />
              </div>
              <div className="col-span-3 text-text-primary">{t.toAccountName}</div>
              <div className="col-span-2 font-mono text-text-meta">{t.reference ?? "—"}</div>
              <div className="col-span-2 text-right font-mono font-semibold text-text-primary">{formatNumber(t.amount)}</div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
