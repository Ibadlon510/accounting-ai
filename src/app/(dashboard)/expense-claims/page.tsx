"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageHeader } from "@/components/layout/page-header";
import { formatNumber } from "@/lib/accounting/engine";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StyledSelect } from "@/components/ui/styled-select";
import {
  SubmitExpenseClaimPanel,
  type ExpenseClaimRecord,
} from "@/components/modals/submit-expense-claim-panel";
import { usePageTitle } from "@/hooks/use-page-title";
import { useOrgConfig } from "@/hooks/use-organization";
import { showError, showSuccess } from "@/lib/utils/toast-helpers";
import {
  Check,
  ClipboardList,
  Plus,
  Search,
  Wallet,
  X,
} from "lucide-react";

export default function ExpenseClaimsPage() {
  usePageTitle("Expense Claims");
  const orgConfig = useOrgConfig();
  const ccy = orgConfig.currency;

  const [claims, setClaims] = useState<ExpenseClaimRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  const [reimburseId, setReimburseId] = useState<string | null>(null);
  const [reimburseMethod, setReimburseMethod] = useState<"cash" | "payable">("cash");
  const [reimburseDate, setReimburseDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [reimbursing, setReimbursing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/expense-claims", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { claims: [] }))
      .then((d) => setClaims(d.claims ?? []))
      .catch(() => setClaims([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return claims;
    return claims.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.claimNumber.toLowerCase().includes(q) ||
        c.claimantName.toLowerCase().includes(q) ||
        c.status.toLowerCase().includes(q)
    );
  }, [claims, search]);

  const stats = useMemo(() => {
    return {
      total: claims.length,
      submitted: claims.filter((c) => c.status === "submitted").length,
      approved: claims.filter((c) => c.status === "approved").length,
      reimbursed: claims.filter((c) => c.status === "reimbursed").length,
      pendingAmount: claims
        .filter((c) => c.status === "submitted" || c.status === "approved")
        .reduce((s, c) => s + c.total, 0),
    };
  }, [claims]);

  function handleSaved(claim: ExpenseClaimRecord) {
    setClaims((prev) => [claim, ...prev]);
  }

  async function handleApprove(id: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/expense-claims/${id}/approve`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        showError(json.error ?? "Approve failed");
        return;
      }
      showSuccess("Claim approved", `${json.claim.claimNumber} ready to reimburse.`);
      setClaims((prev) => prev.map((c) => (c.id === id ? json.claim : c)));
    } catch {
      showError("Approve failed");
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(id: string) {
    const reason = window.prompt("Rejection reason (optional)") ?? "";
    setBusyId(id);
    try {
      const res = await fetch(`/api/expense-claims/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() || null }),
      });
      const json = await res.json();
      if (!res.ok) {
        showError(json.error ?? "Reject failed");
        return;
      }
      showSuccess("Claim rejected", json.claim.claimNumber);
      setClaims((prev) => prev.map((c) => (c.id === id ? json.claim : c)));
    } catch {
      showError("Reject failed");
    } finally {
      setBusyId(null);
    }
  }

  async function handleReimburse() {
    if (!reimburseId) return;
    setReimbursing(true);
    try {
      const res = await fetch(`/api/expense-claims/${reimburseId}/reimburse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: reimburseMethod,
          reimbursementDate: reimburseDate,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        showError(json.error ?? "Reimbursement failed");
        return;
      }
      showSuccess(
        "Reimbursement posted",
        `${json.entryNumber}: ${ccy} ${formatNumber(json.total)}. Journals are reverse-only.`
      );
      setClaims((prev) =>
        prev.map((c) => (c.id === reimburseId ? json.claim : c))
      );
      setReimburseId(null);
    } catch {
      showError("Reimbursement failed");
    } finally {
      setReimbursing(false);
    }
  }

  const statusClass = (status: string) => {
    if (status === "submitted") return "bg-amber-500/10 text-amber-700";
    if (status === "approved") return "bg-blue-500/10 text-blue-700";
    if (status === "reimbursed") return "bg-success/10 text-success";
    if (status === "rejected") return "bg-error/10 text-error";
    return "bg-muted text-text-meta";
  };

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Workspaces", href: "/workspaces" },
          { label: "Expense Claims" },
        ]}
      />
      <PageHeader title="Expense Claims" />

      <p className="mb-6 max-w-2xl text-[14px] text-text-secondary">
        Staff submit expenses, managers approve, the ledger records the reimbursement.
        Ledger postings are reverse-only (immutable journals).
      </p>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="dashboard-card border-l-[3px] border-l-text-primary">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-text-primary/10">
            <ClipboardList className="h-5 w-5 text-text-primary" strokeWidth={1.8} />
          </div>
          <p className="mt-3 text-[12px] font-medium uppercase tracking-wide text-text-meta">
            All claims
          </p>
          <p className="mt-0.5 text-[28px] font-extrabold tracking-tight text-text-primary">
            {stats.total}
          </p>
        </div>
        <div className="dashboard-card border-l-[3px] border-l-amber-600">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10">
            <ClipboardList className="h-5 w-5 text-amber-700" strokeWidth={1.8} />
          </div>
          <p className="mt-3 text-[12px] font-medium uppercase tracking-wide text-text-meta">
            Awaiting approval
          </p>
          <p className="mt-0.5 text-[28px] font-extrabold tracking-tight text-amber-700">
            {stats.submitted}
          </p>
        </div>
        <div className="dashboard-card border-l-[3px] border-l-[var(--accent-ai)]">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent-ai)]/10">
            <Check className="h-5 w-5 text-[var(--accent-ai)]" strokeWidth={1.8} />
          </div>
          <p className="mt-3 text-[12px] font-medium uppercase tracking-wide text-text-meta">
            Approved
          </p>
          <p className="mt-0.5 text-[28px] font-extrabold tracking-tight text-[var(--accent-ai)]">
            {stats.approved}
          </p>
        </div>
        <div className="dashboard-card border-l-[3px] border-l-success">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-success/10">
            <Wallet className="h-5 w-5 text-success" strokeWidth={1.8} />
          </div>
          <p className="mt-3 text-[12px] font-medium uppercase tracking-wide text-text-meta">
            Pending amount
          </p>
          <p className="mt-0.5 text-[28px] font-extrabold tracking-tight text-success">
            {ccy} {formatNumber(stats.pendingAmount)}
          </p>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="relative min-w-[200px] max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-meta" />
          <Input
            placeholder="Search claims…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 rounded-xl border-border-subtle bg-surface pl-10 text-[13px]"
          />
        </div>
        <Button
          onClick={() => setAddOpen(true)}
          className="h-10 gap-2 rounded-xl bg-text-primary px-4 text-[13px] font-semibold text-white hover:bg-text-primary/90"
        >
          <Plus className="h-4 w-4" /> Submit claim
        </Button>
      </div>

      <div className="dashboard-card overflow-hidden !p-0">
        <div className="grid grid-cols-12 gap-3 border-b border-border-subtle bg-canvas/50 px-6 py-3 text-[12px] font-medium uppercase tracking-wide text-text-meta">
          <div className="col-span-3">Claim</div>
          <div className="col-span-2">Claimant</div>
          <div className="col-span-1">Date</div>
          <div className="col-span-1 text-right">Total</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-4 text-right">Actions</div>
        </div>

        {loading && (
          <div className="px-6 py-10 text-center text-[13px] text-text-meta">
            Loading claims…
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="px-6 py-10 text-center text-[13px] text-text-meta">
            No expense claims yet. Submit one for manager approval.
          </div>
        )}

        {!loading &&
          filtered.map((claim) => (
            <div
              key={claim.id}
              className="grid grid-cols-12 items-center gap-3 border-b border-border-subtle px-6 py-3 last:border-0"
            >
              <div className="col-span-3">
                <p className="text-[13px] font-semibold text-text-primary">
                  {claim.title}
                </p>
                <p className="text-[11px] text-text-meta">{claim.claimNumber}</p>
              </div>
              <div className="col-span-2 text-[13px] text-text-secondary">
                {claim.claimantName}
              </div>
              <div className="col-span-1 text-[13px] text-text-secondary">
                {claim.claimDate}
              </div>
              <div className="col-span-1 text-right font-mono text-[13px] font-semibold">
                {formatNumber(claim.total)}
              </div>
              <div className="col-span-1">
                <span
                  className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold capitalize ${statusClass(claim.status)}`}
                >
                  {claim.status}
                </span>
              </div>
              <div className="col-span-4 flex justify-end gap-2">
                {claim.status === "submitted" && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 rounded-lg text-[12px] gap-1"
                      disabled={busyId === claim.id}
                      onClick={() => handleApprove(claim.id)}
                    >
                      <Check className="h-3.5 w-3.5" /> Approve
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 rounded-lg text-[12px] text-error gap-1"
                      disabled={busyId === claim.id}
                      onClick={() => handleReject(claim.id)}
                    >
                      <X className="h-3.5 w-3.5" /> Reject
                    </Button>
                  </>
                )}
                {claim.status === "approved" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-lg text-[12px] gap-1"
                    onClick={() => {
                      setReimburseId(claim.id);
                      setReimburseMethod("cash");
                      setReimburseDate(new Date().toISOString().slice(0, 10));
                    }}
                  >
                    <Wallet className="h-3.5 w-3.5" /> Reimburse
                  </Button>
                )}
                {claim.status === "reimbursed" && claim.journalEntryId && (
                  <span className="text-[11px] text-text-meta">JE posted</span>
                )}
              </div>
            </div>
          ))}
      </div>

      {reimburseId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl">
            <h3 className="text-[16px] font-semibold text-text-primary">
              Reimburse claim
            </h3>
            <p className="mt-1 text-[13px] text-text-secondary">
              Posts Dr expense / Cr cash (1110) or payable (2020). Entry is immutable
              (reverse-only).
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase text-text-meta">
                  Method
                </label>
                <StyledSelect
                  value={reimburseMethod}
                  onChange={(e) =>
                    setReimburseMethod(
                      e.target.value === "payable" ? "payable" : "cash"
                    )
                  }
                  className="h-10 w-full rounded-xl"
                >
                  <option value="cash">Cash / bank (1110)</option>
                  <option value="payable">Payable (2020)</option>
                </StyledSelect>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase text-text-meta">
                  Reimbursement date
                </label>
                <Input
                  type="date"
                  value={reimburseDate}
                  onChange={(e) => setReimburseDate(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => setReimburseId(null)}
              >
                Cancel
              </Button>
              <Button
                className="rounded-xl bg-text-primary text-white hover:bg-text-primary/90"
                disabled={reimbursing}
                onClick={handleReimburse}
              >
                {reimbursing ? "Posting…" : "Reimburse & post"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <SubmitExpenseClaimPanel
        open={addOpen}
        onOpenChange={setAddOpen}
        onSaved={handleSaved}
      />
    </>
  );
}
