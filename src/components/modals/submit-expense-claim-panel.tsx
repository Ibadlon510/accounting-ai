"use client";

import { useEffect, useState } from "react";
import {
  EntityPanel,
  EntityPanelContent,
  EntityPanelBody,
  EntityPanelMain,
  EntityPanelSidebar,
  EntityPanelHeader,
  EntityPanelAvatar,
  EntityPanelFieldGroup,
  EntityPanelFieldRow,
  EntityPanelField,
  EntityPanelSidebarHeader,
  EntityPanelSidebarSection,
  EntityPanelFooter,
  EntityPanelInfoMessage,
} from "@/components/overlays/entity-panel";
import { Input } from "@/components/ui/input";
import { StyledSelect } from "@/components/ui/styled-select";
import { Button } from "@/components/ui/button";
import { showError, showSuccess } from "@/lib/utils/toast-helpers";
import {
  Calendar,
  ClipboardList,
  Hash,
  Info,
  Plus,
  Trash2,
  User,
} from "lucide-react";

export type ExpenseClaimRecord = {
  id: string;
  claimNumber: string;
  title: string;
  description: string | null;
  claimDate: string;
  claimantName: string;
  status: string;
  currency: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  journalEntryId: string | null;
  lines: Array<{
    id: string;
    description: string;
    category: string;
    expenseAccountId: string;
    amount: number;
    taxAmount: number;
  }>;
};

type Account = { id: string; code: string; name: string };

type LineDraft = {
  key: string;
  description: string;
  category: string;
  expenseAccountId: string;
  amount: string;
  taxAmount: string;
};

interface SubmitExpenseClaimPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (claim: ExpenseClaimRecord) => void;
}

const CATEGORIES = [
  { value: "travel", label: "Travel & Entertainment", code: "6400" },
  { value: "supplies", label: "Office Supplies", code: "6300" },
  { value: "utilities", label: "Utilities", code: "6200" },
  { value: "professional", label: "Professional Fees", code: "6500" },
  { value: "marketing", label: "Marketing", code: "6900" },
  { value: "other", label: "Other", code: "7000" },
];

function newLine(accounts: Account[]): LineDraft {
  const travel =
    accounts.find((a) => a.code === "6400") ??
    accounts.find((a) => a.code.startsWith("6")) ??
    accounts[0];
  return {
    key: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    description: "",
    category: "travel",
    expenseAccountId: travel?.id ?? "",
    amount: "",
    taxAmount: "0",
  };
}

export function SubmitExpenseClaimPanel({
  open,
  onOpenChange,
  onSaved,
}: SubmitExpenseClaimPanelProps) {
  const [title, setTitle] = useState("");
  const [claimantName, setClaimantName] = useState("");
  const [claimDate, setClaimDate] = useState(
    () => new Date().toISOString().slice(0, 10)
  );
  const [description, setDescription] = useState("");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [lines, setLines] = useState<LineDraft[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    fetch("/api/org/chart-of-accounts", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { accounts: [] }))
      .then((d) => {
        const all = (d.accounts ?? []) as Account[];
        const expenseAccounts = all.filter(
          (a) => a.code.startsWith("6") || a.code.startsWith("7")
        );
        const list = expenseAccounts.length ? expenseAccounts : all;
        setAccounts(list);
        setLines([newLine(list)]);
      })
      .catch(() => {
        setAccounts([]);
        setLines([newLine([])]);
      });
  }, [open]);

  function reset() {
    setTitle("");
    setClaimantName("");
    setClaimDate(new Date().toISOString().slice(0, 10));
    setDescription("");
    setLines([newLine(accounts)]);
  }

  function updateLine(key: string, patch: Partial<LineDraft>) {
    setLines((prev) =>
      prev.map((line) => (line.key === key ? { ...line, ...patch } : line))
    );
  }

  async function handleSave() {
    if (!title.trim()) {
      showError("Title is required");
      return;
    }
    if (!claimantName.trim()) {
      showError("Claimant name is required");
      return;
    }
    if (!lines.length) {
      showError("Add at least one expense line");
      return;
    }

    for (const line of lines) {
      const amount = Number(line.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        showError("Each line needs a positive amount");
        return;
      }
      if (!line.expenseAccountId) {
        showError("Each line needs an expense account");
        return;
      }
    }

    setSaving(true);
    try {
      const res = await fetch("/api/expense-claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          claimantName: claimantName.trim(),
          claimDate,
          description: description.trim() || null,
          lines: lines.map((line) => ({
            description: line.description.trim(),
            category: line.category,
            expenseAccountId: line.expenseAccountId,
            amount: Number(line.amount),
            taxAmount: Number(line.taxAmount) || 0,
          })),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        showError(json.error ?? "Failed to submit claim");
        return;
      }
      showSuccess("Claim submitted", `${json.claim.claimNumber} is awaiting approval.`);
      onSaved(json.claim);
      reset();
      onOpenChange(false);
    } catch {
      showError("Failed to submit claim");
    } finally {
      setSaving(false);
    }
  }

  return (
    <EntityPanel open={open} onOpenChange={onOpenChange}>
      <EntityPanelContent size="lg">
        <EntityPanelBody>
          <EntityPanelMain>
            <EntityPanelHeader title="Submit Expense Claim" />
            <EntityPanelAvatar
              name={title || "New Claim"}
              subtitle={claimantName || "Staff reimbursement request"}
              fallbackGradient="from-slate-500 to-zinc-700"
            />

            <EntityPanelFieldGroup>
              <EntityPanelField
                icon={<ClipboardList className="h-4 w-4" />}
                label="Title"
              >
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Client site travel — March"
                  className="h-8 border-0 bg-transparent p-0 text-[14px] font-medium text-text-primary shadow-none focus-visible:ring-0"
                />
              </EntityPanelField>
              <EntityPanelFieldRow>
                <EntityPanelField icon={<User className="h-4 w-4" />} label="Claimant">
                  <Input
                    value={claimantName}
                    onChange={(e) => setClaimantName(e.target.value)}
                    placeholder="Staff name"
                    className="h-8 border-0 bg-transparent p-0 text-[14px] font-medium text-text-primary shadow-none focus-visible:ring-0"
                  />
                </EntityPanelField>
                <EntityPanelField
                  icon={<Calendar className="h-4 w-4" />}
                  label="Claim Date"
                >
                  <Input
                    type="date"
                    value={claimDate}
                    onChange={(e) => setClaimDate(e.target.value)}
                    className="h-8 border-0 bg-transparent p-0 text-[14px] font-medium text-text-primary shadow-none focus-visible:ring-0"
                  />
                </EntityPanelField>
              </EntityPanelFieldRow>
              <EntityPanelField icon={<Info className="h-4 w-4" />} label="Notes">
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional"
                  className="h-8 border-0 bg-transparent p-0 text-[14px] font-medium text-text-primary shadow-none focus-visible:ring-0"
                />
              </EntityPanelField>
            </EntityPanelFieldGroup>

            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-[13px] font-semibold text-text-primary">
                  Expense lines
                </h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-lg gap-1"
                  onClick={() => setLines((prev) => [...prev, newLine(accounts)])}
                >
                  <Plus className="h-3.5 w-3.5" /> Add line
                </Button>
              </div>
              {lines.map((line, idx) => (
                <div
                  key={line.key}
                  className="rounded-xl border border-border-subtle p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-text-meta">
                      Line {idx + 1}
                    </p>
                    {lines.length > 1 && (
                      <button
                        type="button"
                        className="text-error"
                        onClick={() =>
                          setLines((prev) => prev.filter((l) => l.key !== line.key))
                        }
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <Input
                    value={line.description}
                    onChange={(e) =>
                      updateLine(line.key, { description: e.target.value })
                    }
                    placeholder="Description"
                    className="rounded-xl"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <StyledSelect
                      value={line.category}
                      onChange={(e) => {
                        const category = e.target.value;
                        const hint =
                          CATEGORIES.find((c) => c.value === category)?.code ??
                          "6400";
                        const match =
                          accounts.find((a) => a.code === hint) ??
                          accounts.find((a) => a.id === line.expenseAccountId);
                        updateLine(line.key, {
                          category,
                          expenseAccountId: match?.id ?? line.expenseAccountId,
                        });
                      }}
                      className="h-10 rounded-xl"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </StyledSelect>
                    <StyledSelect
                      value={line.expenseAccountId}
                      onChange={(e) =>
                        updateLine(line.key, { expenseAccountId: e.target.value })
                      }
                      className="h-10 rounded-xl"
                    >
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.code} — {a.name}
                        </option>
                      ))}
                    </StyledSelect>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={line.amount}
                      onChange={(e) =>
                        updateLine(line.key, { amount: e.target.value })
                      }
                      placeholder="Amount"
                      className="rounded-xl"
                    />
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={line.taxAmount}
                      onChange={(e) =>
                        updateLine(line.key, { taxAmount: e.target.value })
                      }
                      placeholder="Tax"
                      className="rounded-xl"
                    />
                  </div>
                </div>
              ))}
            </div>
          </EntityPanelMain>

          <EntityPanelSidebar>
            <EntityPanelSidebarHeader title="Workflow" />
            <EntityPanelSidebarSection title="Approval">
              <EntityPanelInfoMessage icon={<Info className="h-3.5 w-3.5" />}>
                Managers approve or reject submitted claims. Only accountants and above
                can approve, reject, or reimburse.
              </EntityPanelInfoMessage>
            </EntityPanelSidebarSection>
            <EntityPanelSidebarSection title="Reimbursement JE">
              <EntityPanelInfoMessage icon={<Hash className="h-3.5 w-3.5" />}>
                Posts Dr expense (e.g. 6400) / Cr cash (1110) or payable (2020). Journals
                are reverse-only.
              </EntityPanelInfoMessage>
            </EntityPanelSidebarSection>
          </EntityPanelSidebar>
        </EntityPanelBody>

        <EntityPanelFooter
          onCancel={() => onOpenChange(false)}
          onSave={handleSave}
          saveLabel={saving ? "Submitting…" : "Submit claim"}
          saveDisabled={saving}
        />
      </EntityPanelContent>
    </EntityPanel>
  );
}
