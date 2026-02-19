"use client";

import { useState, useEffect } from "react";
import {
  EntityPanel,
  EntityPanelContent,
  EntityPanelBody,
  EntityPanelMain,
  EntityPanelSidebar,
  EntityPanelHeader,
  EntityPanelSidebarHeader,
  EntityPanelSidebarSection,
  EntityPanelFooter,
  EntityPanelAiHint,
  EntityPanelInfoMessage,
} from "@/components/overlays/entity-panel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { showSuccess, showError } from "@/lib/utils/toast-helpers";
import { formatNumber, validateJournalEntry, calculateLineTotals } from "@/lib/accounting/engine";
import { mockAccounts } from "@/lib/accounting/mock-data";
import { Plus, Trash2, Info, CheckCircle2, AlertTriangle, Sparkles, Loader2 } from "lucide-react";
import { StyledSelect } from "@/components/ui/styled-select";

interface JournalLine {
  id: string;
  accountId: string;
  description: string;
  debit: number;
  credit: number;
}

type AccountOption = { id: string; code: string; name: string };

interface CreateJournalEntryPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (entry: {
    entryDate: string;
    description: string;
    reference: string;
    lines: JournalLine[];
    totalDebit: number;
    totalCredit: number;
  }) => void;
}

function emptyLine(): JournalLine {
  return { id: `jl-${Date.now()}-${Math.random()}`, accountId: "", description: "", debit: 0, credit: 0 };
}

export function CreateJournalEntryPanel({ open, onOpenChange, onCreate }: CreateJournalEntryPanelProps) {
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");
  const [reference, setReference] = useState("");
  const [lines, setLines] = useState<JournalLine[]>([emptyLine(), emptyLine()]);
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [smartEntryInput, setSmartEntryInput] = useState("");
  const [smartEntryLoading, setSmartEntryLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetch("/api/org/chart-of-accounts")
        .then((r) => (r.ok ? r.json() : { accounts: [] }))
        .then((data) => {
          const list = (data.accounts ?? []) as Array<{ id: string; code: string; name: string }>;
          setAccounts(list.filter((a) => a.id && a.code));
        })
        .catch(() => setAccounts([]));
    }
  }, [open]);

  const activeAccounts = accounts.length > 0
    ? accounts
    : mockAccounts.map((a) => ({ id: a.id, code: a.code, name: a.name }));

  function updateLine(index: number, field: keyof JournalLine, value: string | number) {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, [field]: value } : line)));
  }

  function addLine() { setLines((prev) => [...prev, emptyLine()]); }
  function removeLine(index: number) { if (lines.length > 2) setLines((prev) => prev.filter((_, i) => i !== index)); }

  const totals = calculateLineTotals(lines.map((l) => ({ ...l, lineOrder: 0, accountId: l.accountId })));

  function reset() {
    setEntryDate(new Date().toISOString().slice(0, 10));
    setDescription(""); setReference("");
    setLines([emptyLine(), emptyLine()]);
    setSmartEntryInput("");
  }

  async function handleSmartEntry() {
    const nl = smartEntryInput.trim();
    if (!nl) return;
    setSmartEntryLoading(true);
    try {
      const res = await fetch("/api/ai/smart-entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nl }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showError(data?.error ?? "Could not parse that description.");
        return;
      }
      const suggested = data.suggestedEntry;
      if (!suggested?.lines?.length) {
        showError("No lines returned. Try being more specific.");
        return;
      }
      setEntryDate(suggested.date ?? entryDate);
      setDescription(suggested.description ?? description);
      setLines(
        suggested.lines.map((l: { accountId: string; description?: string; debit?: number; credit?: number }) => ({
          id: `jl-${Date.now()}-${Math.random()}`,
          accountId: l.accountId ?? "",
          description: l.description ?? "",
          debit: Number(l.debit) ?? 0,
          credit: Number(l.credit) ?? 0,
        }))
      );
      setSmartEntryInput("");
      showSuccess("Entry suggested", "Review and edit the lines, then post when ready.");
    } catch {
      showError("Something went wrong.");
    } finally {
      setSmartEntryLoading(false);
    }
  }

  function handleSave() {
    const validation = validateJournalEntry({
      description,
      entryDate,
      lines: lines.map((l, i) => ({
        ...l,
        lineOrder: i + 1,
        accountId: l.accountId,
      })),
    });

    if (!validation.valid) {
      showError("Validation Error", validation.errors[0]);
      return;
    }

    onCreate({
      entryDate, description, reference, lines,
      totalDebit: totals.totalDebit,
      totalCredit: totals.totalCredit,
    });
    showSuccess("Journal entry created", `Entry for AED ${formatNumber(totals.totalDebit)} has been posted.`);
    reset();
    onOpenChange(false);
  }

  return (
    <EntityPanel open={open} onOpenChange={onOpenChange}>
      <EntityPanelContent size="xl">
        <EntityPanelBody>
          <EntityPanelMain>
            <EntityPanelHeader
              title="Create Journal Entry"
              onAiClick={() => document.getElementById("smart-entry-input")?.focus()}
            />

            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <EntityPanelAiHint className="flex-1">
                Describe a transaction in plain English and AI will suggest the debit/credit lines
              </EntityPanelAiHint>
              <div className="flex gap-2">
                <Input
                  id="smart-entry-input"
                  value={smartEntryInput}
                  onChange={(e) => setSmartEntryInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSmartEntry())}
                  placeholder="e.g. Office supplies 500 AED from bank"
                  className="h-9 flex-1 min-w-[200px] rounded-xl border-border-subtle text-[13px]"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 gap-1.5 rounded-xl border-[var(--accent-ai)]/30 text-[var(--accent-ai)] hover:bg-[var(--accent-ai)]/5"
                  onClick={handleSmartEntry}
                  disabled={!smartEntryInput.trim() || smartEntryLoading}
                >
                  {smartEntryLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  Suggest
                </Button>
              </div>
            </div>

            {/* Header fields */}
            <div className="mb-6 grid grid-cols-3 gap-4">
              <div>
                <Label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-meta">Date</Label>
                <Input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} className="h-9 rounded-xl border-border-subtle text-[13px]" />
              </div>
              <div>
                <Label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-meta">Description</Label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Office rent payment" className="h-9 rounded-xl border-border-subtle text-[13px]" />
              </div>
              <div>
                <Label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-meta">Reference</Label>
                <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Optional ref #" className="h-9 rounded-xl border-border-subtle text-[13px]" />
              </div>
            </div>

            {/* Journal lines */}
            <div className="rounded-2xl border border-border-subtle overflow-hidden">
              <div className="grid grid-cols-12 gap-2 bg-muted/30 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-text-meta">
                <div className="col-span-4">Account</div>
                <div className="col-span-3">Description</div>
                <div className="col-span-2 text-right">Debit (AED)</div>
                <div className="col-span-2 text-right">Credit (AED)</div>
                <div className="col-span-1"></div>
              </div>
              {lines.map((line, i) => (
                <div key={line.id} className="grid grid-cols-12 items-center gap-2 border-t border-border-subtle px-4 py-2">
                  <div className="col-span-4">
                    <StyledSelect
                      value={line.accountId}
                      onChange={(e) => updateLine(i, "accountId", e.target.value)}
                      className="h-8 text-[12px]"
                    >
                      <option value="">Select account</option>
                      {activeAccounts.map((a) => (
                        <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                      ))}
                    </StyledSelect>
                  </div>
                  <div className="col-span-3">
                    <Input value={line.description} onChange={(e) => updateLine(i, "description", e.target.value)} placeholder="Line memo" className="h-8 rounded-lg border-border-subtle text-[12px]" />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number" min="0" step="0.01"
                      value={line.debit || ""}
                      onChange={(e) => { updateLine(i, "debit", Number(e.target.value)); if (Number(e.target.value) > 0) updateLine(i, "credit", 0); }}
                      placeholder="0.00" className="h-8 rounded-lg border-border-subtle text-right text-[12px]"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number" min="0" step="0.01"
                      value={line.credit || ""}
                      onChange={(e) => { updateLine(i, "credit", Number(e.target.value)); if (Number(e.target.value) > 0) updateLine(i, "debit", 0); }}
                      placeholder="0.00" className="h-8 rounded-lg border-border-subtle text-right text-[12px]"
                    />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <button type="button" onClick={() => removeLine(i)} className="text-text-meta hover:text-error disabled:opacity-30" disabled={lines.length <= 2}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              <button onClick={addLine} className="flex w-full items-center gap-1.5 border-t border-border-subtle px-4 py-2.5 text-[13px] font-medium text-success hover:bg-muted/20">
                <Plus className="h-3.5 w-3.5" /> Add line
              </button>
            </div>

            {/* Totals + balance check */}
            <div className="mt-4 flex items-center justify-between">
              <div className={`flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-semibold ${totals.isBalanced ? "bg-success/10 text-success" : "bg-error/10 text-error"}`}>
                {totals.isBalanced ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                {totals.isBalanced ? "Entry is balanced" : `Out of balance by AED ${formatNumber(Math.abs(totals.totalDebit - totals.totalCredit))}`}
              </div>
              <div className="flex gap-6 text-[13px]">
                <div className="text-text-secondary">Total Debits: <span className="font-mono font-semibold text-text-primary">AED {formatNumber(totals.totalDebit)}</span></div>
                <div className="text-text-secondary">Total Credits: <span className="font-mono font-semibold text-text-primary">AED {formatNumber(totals.totalCredit)}</span></div>
              </div>
            </div>
          </EntityPanelMain>

          <EntityPanelSidebar>
            <EntityPanelSidebarHeader title="Entry Settings" />

            <EntityPanelSidebarSection title="Status">
              <p className="text-[14px] font-medium text-text-primary">Will be posted immediately</p>
              <p className="mt-1 text-[12px] text-text-secondary">Entry number auto-assigned on save</p>
            </EntityPanelSidebarSection>

            <EntityPanelSidebarSection title="Currency">
              <p className="text-[14px] font-medium text-text-primary">AED — UAE Dirham</p>
            </EntityPanelSidebarSection>

            <EntityPanelSidebarSection title="Period">
              <p className="text-[14px] font-medium text-text-primary">Auto-detected from date</p>
            </EntityPanelSidebarSection>

            <EntityPanelInfoMessage icon={<Info className="h-3.5 w-3.5" />}>
              Journal entries are immutable. Once posted, they can only be reversed, not edited.
            </EntityPanelInfoMessage>
          </EntityPanelSidebar>
        </EntityPanelBody>

        <EntityPanelFooter
          onCancel={() => { reset(); onOpenChange(false); }}
          onSave={handleSave}
          saveLabel="Post Entry"
          saveDisabled={!totals.isBalanced || totals.totalDebit === 0 || !description.trim()}
        />
      </EntityPanelContent>
    </EntityPanel>
  );
}
