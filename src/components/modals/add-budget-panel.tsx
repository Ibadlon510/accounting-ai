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
  Hash,
  Info,
  PiggyBank,
  Plus,
  Trash2,
} from "lucide-react";

export type BudgetRecord = {
  id: string;
  name: string;
  description: string | null;
  fiscalYearId: string | null;
  periodId: string | null;
  startDate: string;
  endDate: string;
  status: string;
  currency: string;
  totalBudgeted: number;
  lineCount: number;
  lines: Array<{
    id: string;
    accountId: string;
    accountCode: string | null;
    accountName: string | null;
    periodId: string | null;
    periodName: string | null;
    amount: number;
    notes: string | null;
  }>;
};

type Account = { id: string; code: string; name: string };
type Period = { id: string; name: string; startDate: string; endDate: string };

type LineDraft = {
  key: string;
  accountId: string;
  periodId: string;
  amount: string;
  notes: string;
};

interface AddBudgetPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (budget: BudgetRecord) => void;
}

function newLine(accounts: Account[]): LineDraft {
  const preferred =
    accounts.find((a) => a.code.startsWith("6")) ??
    accounts.find((a) => a.code.startsWith("5")) ??
    accounts[0];
  return {
    key: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    accountId: preferred?.id ?? "",
    periodId: "",
    amount: "",
    notes: "",
  };
}

export function AddBudgetPanel({
  open,
  onOpenChange,
  onSaved,
}: AddBudgetPanelProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"draft" | "active">("draft");
  const [periodId, setPeriodId] = useState("");
  const [startDate, setStartDate] = useState(
    () => new Date().toISOString().slice(0, 10)
  );
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    d.setDate(0);
    return d.toISOString().slice(0, 10);
  });
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [lines, setLines] = useState<LineDraft[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    Promise.all([
      fetch("/api/org/chart-of-accounts", { cache: "no-store" }).then((r) =>
        r.ok ? r.json() : { accounts: [] }
      ),
      fetch("/api/accounting/periods", { cache: "no-store" }).then((r) =>
        r.ok ? r.json() : { periods: [] }
      ),
    ])
      .then(([coa, periodData]) => {
        const all = (coa.accounts ?? []) as Account[];
        setAccounts(all);
        setPeriods((periodData.periods ?? []) as Period[]);
        setLines([newLine(all)]);
      })
      .catch(() => {
        setAccounts([]);
        setPeriods([]);
        setLines([newLine([])]);
      });
  }, [open]);

  function reset() {
    setName("");
    setDescription("");
    setStatus("draft");
    setPeriodId("");
    setStartDate(new Date().toISOString().slice(0, 10));
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    d.setDate(0);
    setEndDate(d.toISOString().slice(0, 10));
    setLines([newLine(accounts)]);
  }

  function applyPeriod(id: string) {
    setPeriodId(id);
    const period = periods.find((p) => p.id === id);
    if (period) {
      setStartDate(period.startDate);
      setEndDate(period.endDate);
    }
  }

  function updateLine(key: string, patch: Partial<LineDraft>) {
    setLines((prev) =>
      prev.map((line) => (line.key === key ? { ...line, ...patch } : line))
    );
  }

  async function handleSave() {
    if (!name.trim()) {
      showError("Budget name is required");
      return;
    }
    if (!startDate || !endDate) {
      showError("Start and end dates are required");
      return;
    }
    if (!lines.length) {
      showError("Add at least one budget line");
      return;
    }

    for (const line of lines) {
      const amount = Number(line.amount);
      if (!Number.isFinite(amount)) {
        showError("Each line needs a numeric amount");
        return;
      }
      if (!line.accountId) {
        showError("Each line needs an account");
        return;
      }
    }

    setSaving(true);
    try {
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          status,
          periodId: periodId || null,
          startDate,
          endDate,
          lines: lines.map((line) => ({
            accountId: line.accountId,
            periodId: line.periodId || null,
            amount: Number(line.amount),
            notes: line.notes.trim() || null,
          })),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        showError(json.error ?? "Failed to create budget");
        return;
      }
      showSuccess("Budget created", json.budget.name);
      onSaved(json.budget);
      reset();
      onOpenChange(false);
    } catch {
      showError("Failed to create budget");
    } finally {
      setSaving(false);
    }
  }

  return (
    <EntityPanel open={open} onOpenChange={onOpenChange}>
      <EntityPanelContent size="lg">
        <EntityPanelBody>
          <EntityPanelMain>
            <EntityPanelHeader title="Create Budget" />
            <EntityPanelAvatar
              name={name || "New Budget"}
              subtitle="Budget lines per account and period"
              fallbackGradient="from-emerald-600 to-teal-800"
            />

            <EntityPanelFieldGroup>
              <EntityPanelField icon={<PiggyBank className="h-4 w-4" />} label="Name">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="FY 2026 operating budget"
                  className="h-8 border-0 bg-transparent p-0 text-[14px] font-medium text-text-primary shadow-none focus-visible:ring-0"
                />
              </EntityPanelField>
              <EntityPanelFieldRow>
                <EntityPanelField
                  icon={<Calendar className="h-4 w-4" />}
                  label="Accounting period"
                >
                  <StyledSelect
                    value={periodId}
                    onChange={(e) => applyPeriod(e.target.value)}
                    className="h-8 border-0 bg-transparent p-0 text-[14px] font-medium text-text-primary shadow-none focus-visible:ring-0"
                  >
                    <option value="">Custom date range</option>
                    {periods.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </StyledSelect>
                </EntityPanelField>
                <EntityPanelField icon={<Hash className="h-4 w-4" />} label="Status">
                  <StyledSelect
                    value={status}
                    onChange={(e) =>
                      setStatus(e.target.value === "active" ? "active" : "draft")
                    }
                    className="h-8 border-0 bg-transparent p-0 text-[14px] font-medium text-text-primary shadow-none focus-visible:ring-0"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                  </StyledSelect>
                </EntityPanelField>
              </EntityPanelFieldRow>
              <EntityPanelFieldRow>
                <EntityPanelField
                  icon={<Calendar className="h-4 w-4" />}
                  label="Start date"
                >
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-8 border-0 bg-transparent p-0 text-[14px] font-medium text-text-primary shadow-none focus-visible:ring-0"
                  />
                </EntityPanelField>
                <EntityPanelField
                  icon={<Calendar className="h-4 w-4" />}
                  label="End date"
                >
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
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
                  Budget lines
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
                  className="space-y-2 rounded-xl border border-border-subtle p-3"
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
                  <StyledSelect
                    value={line.accountId}
                    onChange={(e) =>
                      updateLine(line.key, { accountId: e.target.value })
                    }
                    className="h-10 rounded-xl"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.code} — {a.name}
                      </option>
                    ))}
                  </StyledSelect>
                  <div className="grid grid-cols-2 gap-2">
                    <StyledSelect
                      value={line.periodId}
                      onChange={(e) =>
                        updateLine(line.key, { periodId: e.target.value })
                      }
                      className="h-10 rounded-xl"
                    >
                      <option value="">Use budget dates</option>
                      {periods.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </StyledSelect>
                    <Input
                      type="number"
                      step="0.01"
                      value={line.amount}
                      onChange={(e) =>
                        updateLine(line.key, { amount: e.target.value })
                      }
                      placeholder="Budgeted amount"
                      className="rounded-xl"
                    />
                  </div>
                  <Input
                    value={line.notes}
                    onChange={(e) => updateLine(line.key, { notes: e.target.value })}
                    placeholder="Line notes (optional)"
                    className="rounded-xl"
                  />
                </div>
              ))}
            </div>
          </EntityPanelMain>

          <EntityPanelSidebar>
            <EntityPanelSidebarHeader title="Variance" />
            <EntityPanelSidebarSection title="Actuals">
              <EntityPanelInfoMessage icon={<Info className="h-3.5 w-3.5" />}>
                Variance compares each line&apos;s budgeted amount to posted journal
                actuals for that account over the period (or budget date range).
              </EntityPanelInfoMessage>
            </EntityPanelSidebarSection>
            <EntityPanelSidebarSection title="Sign">
              <EntityPanelInfoMessage icon={<Hash className="h-3.5 w-3.5" />}>
                Actual uses normal balance (Dr−Cr for expenses/assets; Cr−Dr for
                revenue). Positive variance means over budget.
              </EntityPanelInfoMessage>
            </EntityPanelSidebarSection>
          </EntityPanelSidebar>
        </EntityPanelBody>

        <EntityPanelFooter
          onCancel={() => onOpenChange(false)}
          onSave={handleSave}
          saveLabel={saving ? "Saving…" : "Create budget"}
          saveDisabled={saving}
        />
      </EntityPanelContent>
    </EntityPanel>
  );
}
