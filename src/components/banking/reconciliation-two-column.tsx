"use client";

import { useState, useEffect, useCallback } from "react";
import { formatNumber } from "@/lib/accounting/engine";
import { Upload, ArrowDownLeft, ArrowUpRight, Link2, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { showSuccess, showError } from "@/lib/utils/toast-helpers";
import { RecordReceiptPanel } from "@/components/modals/record-receipt-panel";
import { RecordPaymentBankingPanel } from "@/components/modals/record-payment-banking-panel";

type StatementLine = {
  id: string;
  bankStatementId: string;
  transactionDate: string | null;
  description: string;
  amount: number;
  type: string;
  reference: string | null;
  matchedBankTransactionId: string | null;
  reconciledAt: Date | null;
  lineOrder: number;
};

type Match = {
  id: string;
  transactionDate: string | null;
  description: string;
  amount: number;
  type: string;
  category: string | null;
  transferReference?: string | null;
  score: number;
};

function matchTypeLabel(cat: string | null, hasTransferRef?: boolean): string {
  if (hasTransferRef) return "Inter-account Transfer";
  switch (cat) {
    case "customer_payment": return "Customer Payment";
    case "supplier_payment": return "Supplier Payment";
    case "owner_deposit": return "Owner's Deposit";
    case "owner_withdrawal": return "Owner's Withdrawal";
    case "refund_received": return "Refund Received";
    case "refund_to_customer": return "Refund to Customer";
    default: return cat ?? "—";
  }
}

interface ReconciliationTwoColumnProps {
  bankAccountId: string;
  accountName: string;
}

export function ReconciliationTwoColumn({ bankAccountId, accountName }: ReconciliationTwoColumnProps) {
  const [lines, setLines] = useState<StatementLine[]>([]);
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loadingLines, setLoadingLines] = useState(true);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [linkingId, setLinkingId] = useState<string | null>(null);
  const [createReceiptOpen, setCreateReceiptOpen] = useState(false);
  const [createPaymentOpen, setCreatePaymentOpen] = useState(false);
  const [createFromLineStatementId, setCreateFromLineStatementId] = useState<string | null>(null);
  const [createFromLineInitialValues, setCreateFromLineInitialValues] = useState<{ date: string; amount: number; description: string; bankAccountId: string } | null>(null);

  const fetchLines = useCallback(() => {
    setLoadingLines(true);
    fetch(`/api/banking/statement-lines?bankAccountId=${bankAccountId}`)
      .then((r) => (r.ok ? r.json() : { lines: [] }))
      .then((d) => setLines(d.lines ?? []))
      .catch(() => setLines([]))
      .finally(() => setLoadingLines(false));
  }, [bankAccountId]);

  useEffect(() => {
    fetchLines();
  }, [fetchLines]);

  useEffect(() => {
    if (!selectedLineId) {
      setMatches([]);
      return;
    }
    setLoadingMatches(true);
    fetch(`/api/banking/reconciliation/matches?statementLineId=${selectedLineId}`)
      .then((r) => (r.ok ? r.json() : { matches: [] }))
      .then((d) => setMatches(d.matches ?? []))
      .catch(() => setMatches([]))
      .finally(() => setLoadingMatches(false));
  }, [selectedLineId]);

  const selectedLine = lines.find((l) => l.id === selectedLineId);
  const isCredit = selectedLine?.type === "credit";

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("bankAccountId", bankAccountId);
    fetch("/api/banking/statements/upload", { method: "POST", body: fd })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          showError(d.error);
        } else {
          showSuccess("Statement uploaded", `${d.lineCount} lines imported.`);
          fetchLines();
        }
      })
      .catch(() => showError("Upload failed"))
      .finally(() => {
        setUploading(false);
        e.target.value = "";
      });
  };

  const handleLink = async (bankTransactionId: string) => {
    if (!selectedLineId) return;
    setLinkingId(bankTransactionId);
    try {
      const res = await fetch("/api/banking/reconciliation/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statementLineId: selectedLineId, bankTransactionId }),
      });
      const data = await res.json();
      if (data.error) {
        showError(data.error);
      } else {
        showSuccess("Linked", "Statement line matched to transaction.");
        fetchLines();
        setSelectedLineId(null);
      }
    } catch {
      showError("Link failed");
    } finally {
      setLinkingId(null);
    }
  };

  const handleCreateFromLine = () => {
    if (!selectedLineId || !selectedLine) return;
    const date = selectedLine.transactionDate ?? new Date().toISOString().slice(0, 10);
    const amt = Math.abs(selectedLine.amount);
    const desc = selectedLine.description ?? "From statement";
    setCreateFromLineStatementId(selectedLineId);
    setCreateFromLineInitialValues({ date, amount: amt, description: desc, bankAccountId });
    if (isCredit) {
      setCreateReceiptOpen(true);
    } else {
      setCreatePaymentOpen(true);
    }
  };

  const handleCreateFromLineSuccess = async (data?: { bankTransactionId?: string }) => {
    if (!createFromLineStatementId || !data?.bankTransactionId) {
      setCreateFromLineStatementId(null);
      setCreateFromLineInitialValues(null);
      fetchLines();
      return;
    }
    try {
      const res = await fetch("/api/banking/reconciliation/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statementLineId: createFromLineStatementId, bankTransactionId: data.bankTransactionId }),
      });
      const linkData = await res.json();
      if (linkData.error) {
        showError(linkData.error);
      } else {
        showSuccess("Created & linked", "Entry created and matched to statement line.");
        fetchLines();
        setSelectedLineId(null);
      }
    } catch {
      showError("Link failed");
    } finally {
      setCreateFromLineStatementId(null);
      setCreateFromLineInitialValues(null);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Left: Statement lines */}
      <div className="dashboard-card overflow-hidden !p-0">
        <div className="flex items-center justify-between border-b border-border-subtle bg-canvas/50 px-6 py-3">
          <h3 className="text-[13px] font-semibold text-text-primary">Statement lines</h3>
          <label className="cursor-pointer">
            <input type="file" accept=".csv" className="hidden" onChange={handleUpload} disabled={uploading} />
            <Button variant="outline" size="sm" className="h-9 gap-2" asChild>
              <span>
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Upload Statement
              </span>
            </Button>
          </label>
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {loadingLines ? (
            <div className="px-6 py-12 text-center text-[13px] text-text-meta">Loading…</div>
          ) : lines.length === 0 ? (
            <div className="px-6 py-12 text-center text-[13px] text-text-meta">
              Upload a CSV to reconcile. Format: date, description, amount (positive=credit, negative=debit).
            </div>
          ) : (
            <div className="divide-y divide-border-subtle/50">
              <div className="grid grid-cols-12 gap-2 px-6 py-2 text-[11px] font-medium uppercase tracking-wide text-text-meta">
                <div className="col-span-1">Date</div>
                <div className="col-span-4">Description</div>
                <div className="col-span-2 text-right">Amount</div>
                <div className="col-span-2">Type</div>
                <div className="col-span-2 text-right">Status</div>
              </div>
              {lines.map((l) => (
                <button
                  key={l.id}
                  onClick={() => setSelectedLineId(l.id === selectedLineId ? null : l.id)}
                  className={`grid w-full grid-cols-12 gap-2 px-6 py-3 text-left text-[13px] transition-colors hover:bg-black/[0.02] ${
                    selectedLineId === l.id ? "bg-muted/50" : ""
                  } ${l.reconciledAt ? "opacity-60" : ""}`}
                >
                  <div className="col-span-1 text-text-secondary">{l.transactionDate ?? "—"}</div>
                  <div className="col-span-4 truncate text-text-primary">{l.description ?? "—"}</div>
                  <div className={`col-span-2 text-right font-mono ${l.type === "credit" ? "text-success" : "text-error"}`}>
                    {l.type === "credit" ? "+" : "-"}
                    {formatNumber(l.amount)}
                  </div>
                  <div className="col-span-2 text-text-meta capitalize">{l.type ?? "—"}</div>
                  <div className="col-span-2 text-right">
                    {l.reconciledAt ? (
                      <span className="rounded bg-success/20 px-2 py-0.5 text-[11px] font-medium text-success">Matched</span>
                    ) : (
                      <span className="rounded bg-muted px-2 py-0.5 text-[11px] text-text-meta">Unmatched</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: Possible matches */}
      <div className="dashboard-card overflow-hidden !p-0">
        <div className="border-b border-border-subtle bg-canvas/50 px-6 py-3">
          <h3 className="text-[13px] font-semibold text-text-primary">
            {selectedLineId ? (isCredit ? "Possible receipts (credits)" : "Possible payments (debits)") : "Select a statement line"}
          </h3>
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {!selectedLineId ? (
            <div className="px-6 py-12 text-center text-[13px] text-text-meta">Select a statement line on the left to see matching transactions.</div>
          ) : loadingMatches ? (
            <div className="px-6 py-12 text-center text-[13px] text-text-meta">Finding matches…</div>
          ) : (
            <div className="space-y-2 p-4">
              <div className="mb-3 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" className="h-9 gap-2" onClick={handleCreateFromLine} disabled={!selectedLine}>
                  <Plus className="h-4 w-4" /> Create {isCredit ? "receipt" : "payment"} from line
                </Button>
                {isCredit ? (
                  <Button size="sm" variant="outline" className="h-9" onClick={() => { setCreateFromLineStatementId(null); setCreateFromLineInitialValues(null); setCreateReceiptOpen(true); }}>
                    Record new receipt
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" className="h-9" onClick={() => { setCreateFromLineStatementId(null); setCreateFromLineInitialValues(null); setCreatePaymentOpen(true); }}>
                    Record new payment
                  </Button>
                )}
              </div>
              {matches.length === 0 ? (
                <div className="rounded-lg bg-muted/30 px-4 py-6 text-center text-[13px] text-text-meta">No matching transactions. Create one from the line or record a new entry.</div>
              ) : (
                matches.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-medium text-text-primary">{m.description ?? "—"}</div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[12px] text-text-meta">
                        <span className="rounded bg-muted/80 px-1.5 py-0.5 text-[11px] font-medium text-text-secondary">
                          {matchTypeLabel(m.category, !!m.transferReference)}
                        </span>
                        <span>{m.transactionDate ?? "—"}</span>
                        <span className="font-mono">{formatNumber(m.amount)}</span>
                        {m.score >= 50 && (
                          <span className="rounded bg-success/20 px-1.5 py-0.5 text-[10px] font-medium text-success">{m.score}% match</span>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="h-8 gap-1.5"
                      onClick={() => handleLink(m.id)}
                      disabled={!!linkingId}
                    >
                      {linkingId === m.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Link2 className="h-3.5 w-3.5" />}
                      Link
                    </Button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <RecordReceiptPanel
        open={createReceiptOpen}
        onOpenChange={(o) => { setCreateReceiptOpen(o); if (!o) { setCreateFromLineStatementId(null); setCreateFromLineInitialValues(null); } }}
        onSuccess={createFromLineStatementId ? handleCreateFromLineSuccess : fetchLines}
        initialValues={createReceiptOpen && createFromLineInitialValues ? { ...createFromLineInitialValues, receiptType: "owner_deposit" } : null}
      />
      <RecordPaymentBankingPanel
        open={createPaymentOpen}
        onOpenChange={(o) => { setCreatePaymentOpen(o); if (!o) { setCreateFromLineStatementId(null); setCreateFromLineInitialValues(null); } }}
        onSuccess={createFromLineStatementId ? handleCreateFromLineSuccess : fetchLines}
        initialValues={createPaymentOpen && createFromLineInitialValues ? { ...createFromLineInitialValues, paymentType: "owner_withdrawal" } : null}
      />
    </div>
  );
}
