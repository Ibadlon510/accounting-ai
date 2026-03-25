"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  EntityPanel,
  EntityPanelContent,
  EntityPanelBody,
  EntityPanelMain,
  EntityPanelHeader,
  EntityPanelFooter,
} from "@/components/overlays/entity-panel";
import { formatNumber, formatDate } from "@/lib/accounting/engine";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Loader2, ReceiptText, AlertCircle } from "lucide-react";

type AvailableCredit = {
  id: string;
  sourceType: string;
  sourceId: string;
  creditDate: string;
  description: string | null;
  originalAmount: number;
  remainingAmount: number;
};

interface ApplyCreditsPanelProps {
  open: boolean;
  onClose: () => void;
  documentType: "invoice" | "bill";
  documentId: string;
  documentNumber: string;
  amountDue: number;
  contactType: "customer" | "supplier";
  contactId: string;
  contactName: string;
  currency: string;
  onSuccess: () => void;
}

export function ApplyCreditsPanel({
  open,
  onClose,
  documentType,
  documentId,
  documentNumber,
  amountDue,
  contactType,
  contactId,
  contactName,
  currency,
  onSuccess,
}: ApplyCreditsPanelProps) {
  const [credits, setCredits] = useState<AvailableCredit[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [amounts, setAmounts] = useState<Record<string, string>>({});

  const fetchCredits = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/credits?contactType=${contactType}&contactId=${contactId}`
      );
      if (!res.ok) throw new Error("Failed to load credits");
      const data = await res.json();
      const parsed: AvailableCredit[] = (data.credits ?? []).map(
        (c: Record<string, unknown>) => ({
          ...c,
          originalAmount: typeof c.originalAmount === "string" ? parseFloat(c.originalAmount) : (c.originalAmount ?? 0),
          remainingAmount: typeof c.remainingAmount === "string" ? parseFloat(c.remainingAmount) : (c.remainingAmount ?? 0),
        })
      );
      setCredits(parsed);

      const initialAmounts: Record<string, string> = {};
      for (const c of parsed) {
        initialAmounts[c.id] = String(
          Math.min(c.remainingAmount, amountDue)
        );
      }
      setAmounts(initialAmounts);
    } catch {
      setError("Could not load available credits.");
    } finally {
      setLoading(false);
    }
  }, [contactType, contactId, amountDue]);

  useEffect(() => {
    if (open) {
      fetchCredits();
      setSelected({});
    }
  }, [open, fetchCredits]);

  const totalApplied = useMemo(() => {
    return credits.reduce((sum, c) => {
      if (!selected[c.id]) return sum;
      const amt = parseFloat(amounts[c.id] || "0");
      return sum + (isNaN(amt) ? 0 : amt);
    }, 0);
  }, [credits, selected, amounts]);

  const overLimit = totalApplied > amountDue + 0.005;

  const toggleCredit = (id: string) => {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const updateAmount = (id: string, value: string) => {
    setAmounts((prev) => ({ ...prev, [id]: value }));
  };

  const recalcAmounts = useCallback(() => {
    let remaining = amountDue;
    const newAmounts: Record<string, string> = {};
    for (const c of credits) {
      if (selected[c.id]) {
        const max = Math.min(c.remainingAmount, remaining);
        newAmounts[c.id] = String(Math.max(0, parseFloat(max.toFixed(2))));
        remaining -= parseFloat(max.toFixed(2));
      } else {
        newAmounts[c.id] = amounts[c.id] || String(Math.min(c.remainingAmount, amountDue));
      }
    }
    setAmounts(newAmounts);
  }, [credits, selected, amountDue, amounts]);

  const handleSubmit = async () => {
    if (overLimit || totalApplied <= 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const applications = credits
        .filter((c) => selected[c.id])
        .map((c) => ({
          creditId: c.id,
          amount: parseFloat(parseFloat(amounts[c.id] || "0").toFixed(2)),
        }))
        .filter((a) => a.amount > 0);

      const res = await fetch("/api/credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentType,
          documentId,
          applications,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to apply credits");
      }
      onSuccess();
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to apply credits");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCount = Object.values(selected).filter(Boolean).length;

  return (
    <EntityPanel open={open} onOpenChange={(o) => !o && onClose()}>
      <EntityPanelContent size="md" panelTitle={`Apply Credits to ${documentNumber}`}>
        <EntityPanelBody>
          <EntityPanelMain>
            <EntityPanelHeader
              title={`Apply Credits to ${documentNumber}`}
              showAiButton={false}
            />

            <div className="mb-6 rounded-2xl border border-border-subtle bg-muted/30 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-text-meta">
                    {documentType === "invoice" ? "Invoice" : "Bill"}
                  </p>
                  <p className="mt-0.5 text-[15px] font-semibold text-text-primary">
                    {documentNumber}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-text-meta">
                    Amount Due
                  </p>
                  <p className="mt-0.5 text-[18px] font-bold font-mono text-text-primary">
                    {currency} {formatNumber(amountDue)}
                  </p>
                </div>
              </div>
              <p className="mt-2 text-[13px] text-text-secondary">
                {contactName}
              </p>
            </div>

            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-text-meta" />
                <span className="ml-2 text-[13px] text-text-meta">
                  Loading available credits…
                </span>
              </div>
            )}

            {!loading && credits.length === 0 && !error && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ReceiptText className="h-10 w-10 text-text-meta/40 mb-3" />
                <p className="text-[14px] font-medium text-text-secondary">
                  No available credits
                </p>
                <p className="mt-1 text-[12px] text-text-meta">
                  There are no unused credit notes for this {contactType}.
                </p>
              </div>
            )}

            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-error-light px-4 py-3 text-[13px] text-error">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {!loading && credits.length > 0 && (
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-text-meta">
                    Available Credits
                  </p>
                  {selectedCount > 0 && (
                    <button
                      type="button"
                      onClick={recalcAmounts}
                      className="text-[11px] font-medium text-[var(--accent-ai)] hover:underline"
                    >
                      Auto-fill amounts
                    </button>
                  )}
                </div>

                <div className="rounded-2xl border border-border-subtle overflow-hidden">
                  <div className="grid grid-cols-12 gap-2 bg-canvas/50 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-text-meta">
                    <div className="col-span-1" />
                    <div className="col-span-2">Date</div>
                    <div className="col-span-3">Credit Note</div>
                    <div className="col-span-2 text-right">Original</div>
                    <div className="col-span-2 text-right">Remaining</div>
                    <div className="col-span-2 text-right">Apply</div>
                  </div>

                  {credits.map((credit) => {
                    const isSelected = !!selected[credit.id];
                    const parsedAmt = parseFloat(amounts[credit.id] || "0");
                    const amtExceedsRemaining =
                      isSelected &&
                      !isNaN(parsedAmt) &&
                      parsedAmt > credit.remainingAmount + 0.005;

                    return (
                      <div
                        key={credit.id}
                        className={`grid grid-cols-12 gap-2 items-center border-t border-border-subtle/50 px-4 py-3 text-[13px] transition-colors ${
                          isSelected ? "bg-success/[0.04]" : ""
                        }`}
                      >
                        <div className="col-span-1 flex items-center">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleCredit(credit.id)}
                          />
                        </div>
                        <div className="col-span-2 text-text-secondary">
                          {formatDate(credit.creditDate)}
                        </div>
                        <div className="col-span-3 text-text-primary font-medium truncate">
                          {credit.sourceType === "credit_note" ? `CN-${credit.sourceId.slice(0, 8)}` : credit.sourceType}
                          {credit.description && (
                            <span className="block text-[11px] text-text-meta truncate">
                              {credit.description}
                            </span>
                          )}
                        </div>
                        <div className="col-span-2 text-right font-mono text-text-secondary">
                          {formatNumber(credit.originalAmount)}
                        </div>
                        <div className="col-span-2 text-right font-mono text-text-primary">
                          {formatNumber(credit.remainingAmount)}
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            max={credit.remainingAmount}
                            value={isSelected ? amounts[credit.id] || "" : ""}
                            disabled={!isSelected}
                            onChange={(e) =>
                              updateAmount(credit.id, e.target.value)
                            }
                            className={`h-8 text-right font-mono text-[12px] ${
                              amtExceedsRemaining
                                ? "border-error ring-1 ring-error/30"
                                : ""
                            }`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 rounded-2xl border border-border-subtle p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-medium text-text-secondary">
                      Total Credits to Apply
                    </span>
                    <span
                      className={`text-[16px] font-bold font-mono ${
                        overLimit ? "text-error" : "text-text-primary"
                      }`}
                    >
                      {currency} {formatNumber(totalApplied)}
                    </span>
                  </div>
                  {overLimit && (
                    <p className="mt-1 text-[12px] text-error text-right">
                      Total exceeds the amount due of {currency}{" "}
                      {formatNumber(amountDue)}
                    </p>
                  )}
                  <div className="mt-2 flex items-center justify-between text-[12px] text-text-meta">
                    <span>Remaining after credits</span>
                    <span className="font-mono">
                      {currency} {formatNumber(Math.max(0, amountDue - totalApplied))}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </EntityPanelMain>
        </EntityPanelBody>

        <EntityPanelFooter
          onCancel={onClose}
          cancelLabel="Cancel"
          onSave={handleSubmit}
          saveLabel={
            submitting
              ? "Applying…"
              : `Apply ${selectedCount > 0 ? selectedCount : ""} Credit${selectedCount !== 1 ? "s" : ""}`
          }
          saveDisabled={
            submitting || totalApplied <= 0 || overLimit || selectedCount === 0
          }
        />
      </EntityPanelContent>
    </EntityPanel>
  );
}
