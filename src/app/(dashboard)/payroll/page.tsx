"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageHeader } from "@/components/layout/page-header";
import { formatNumber } from "@/lib/accounting/engine";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StyledSelect } from "@/components/ui/styled-select";
import { ImportExportButtons } from "@/components/import-export/import-export-buttons";
import { EmployeePanel, type EmployeeRecord } from "@/components/modals/employee-panel";
import { PostSalaryPanel } from "@/components/modals/post-salary-panel";
import { usePageTitle } from "@/hooks/use-page-title";
import { useOrgConfig } from "@/hooks/use-organization";
import { cn } from "@/lib/utils";
import {
  Briefcase,
  Download,
  Mail,
  Phone,
  Plus,
  Search,
  Users,
  Wallet,
  Pencil,
  Banknote,
  UserX,
  CalendarDays,
  Shield,
  FileSpreadsheet,
} from "lucide-react";
import { showError, showSuccess } from "@/lib/utils/toast-helpers";

type Tab = "employees" | "pay-runs" | "gratuity";

type PayRunRecord = {
  id: string;
  runNumber: string;
  periodYear: number;
  periodMonth: number;
  periodStart: string;
  periodEnd: string;
  entryDate: string;
  status: string;
  payFrom: string;
  employeeCount: number;
  totalGross: number;
  journalEntryId: string | null;
  wpsGeneratedAt: string | null;
};

type ProvisionRecord = {
  id: string;
  provisionNumber: string;
  asOfDate: string;
  entryDate: string;
  employeeCount: number;
  totalLiability: number;
  totalIncrease: number;
  journalEntryId: string | null;
};

function monthlyTotal(e: EmployeeRecord) {
  return (e.basicSalary || 0) + (e.housingAllowance || 0) + (e.transportAllowance || 0);
}

function monthLabel(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export default function PayrollPage() {
  usePageTitle("Payroll");
  const orgConfig = useOrgConfig();
  const ccy = orgConfig.currency || "AED";

  const [tab, setTab] = useState<Tab>("employees");
  const [search, setSearch] = useState("");
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [payRuns, setPayRuns] = useState<PayRunRecord[]>([]);
  const [provisions, setProvisions] = useState<ProvisionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<EmployeeRecord | null>(null);
  const [salaryFor, setSalaryFor] = useState<EmployeeRecord | null>(null);

  const now = new Date();
  const [runYear, setRunYear] = useState(now.getFullYear());
  const [runMonth, setRunMonth] = useState(now.getMonth() + 1);
  const [runPayFrom, setRunPayFrom] = useState<"payable" | "cash">("payable");
  const [creatingRun, setCreatingRun] = useState(false);

  const [asOfDate, setAsOfDate] = useState(() => now.toISOString().slice(0, 10));
  const [postingProvision, setPostingProvision] = useState(false);

  const loadEmployees = useCallback(() => {
    return fetch("/api/employees", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { employees: [] }))
      .then((d) => setEmployees(d.employees ?? []))
      .catch(() => setEmployees([]));
  }, []);

  const loadPayRuns = useCallback(() => {
    return fetch("/api/payroll/pay-runs", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { payRuns: [] }))
      .then((d) => setPayRuns(d.payRuns ?? []))
      .catch(() => setPayRuns([]));
  }, []);

  const loadProvisions = useCallback(() => {
    return fetch("/api/payroll/gratuity", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { provisions: [] }))
      .then((d) => setProvisions(d.provisions ?? []))
      .catch(() => setProvisions([]));
  }, []);

  const loadAll = useCallback(() => {
    setLoading(true);
    Promise.all([loadEmployees(), loadPayRuns(), loadProvisions()]).finally(() =>
      setLoading(false)
    );
  }, [loadEmployees, loadPayRuns, loadProvisions]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return employees;
    return employees.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        (e.employeeNumber ?? "").toLowerCase().includes(q) ||
        (e.email ?? "").toLowerCase().includes(q) ||
        (e.department ?? "").toLowerCase().includes(q) ||
        (e.position ?? "").toLowerCase().includes(q) ||
        (e.labourCardNumber ?? "").toLowerCase().includes(q)
    );
  }, [employees, search]);

  const stats = useMemo(() => {
    const active = employees.filter((e) => e.isActive);
    return {
      total: employees.length,
      active: active.length,
      monthlyPayroll: active.reduce((s, e) => s + monthlyTotal(e), 0),
      payRuns: payRuns.length,
      provisions: provisions.length,
    };
  }, [employees, payRuns, provisions]);

  function handleSaved(emp: EmployeeRecord) {
    setEmployees((prev) => {
      const idx = prev.findIndex((e) => e.id === emp.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = emp;
        return next;
      }
      return [emp, ...prev];
    });
  }

  async function handleDeactivate(emp: EmployeeRecord) {
    try {
      const res = await fetch(`/api/employees/${emp.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        showError(json.error ?? "Failed to deactivate");
        return;
      }
      showSuccess("Employee deactivated", emp.name);
      handleSaved(json.employee);
    } catch {
      showError("Failed to deactivate");
    }
  }

  async function createPayRun() {
    setCreatingRun(true);
    try {
      const res = await fetch("/api/payroll/pay-runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          periodYear: runYear,
          periodMonth: runMonth,
          payFrom: runPayFrom,
          post: true,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        showError(json.error ?? "Failed to create pay run");
        return;
      }
      showSuccess(
        "Pay run posted",
        `${json.payRun.runNumber}: ${ccy} ${formatNumber(json.payRun.totalGross)} · JE ${json.entryNumber}`
      );
      setPayRuns((prev) => [json.payRun, ...prev]);
      setTab("pay-runs");
    } catch {
      showError("Failed to create pay run");
    } finally {
      setCreatingRun(false);
    }
  }

  async function downloadWps(runId: string, runNumber: string) {
    try {
      const res = await fetch(`/api/payroll/pay-runs/${runId}/wps`);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        showError(json.error ?? "WPS export failed");
        return;
      }
      const blob = await res.blob();
      const cd = res.headers.get("Content-Disposition") || "";
      const match = /filename="([^"]+)"/.exec(cd);
      const filename = match?.[1] || `${runNumber}.sif`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      showSuccess("WPS file downloaded", filename);
      loadPayRuns();
    } catch {
      showError("WPS export failed");
    }
  }

  async function postGratuity() {
    setPostingProvision(true);
    try {
      const res = await fetch("/api/payroll/gratuity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ asOfDate }),
      });
      const json = await res.json();
      if (!res.ok) {
        showError(json.error ?? "Provision failed");
        return;
      }
      showSuccess(
        "Gratuity provision posted",
        `${json.provision.provisionNumber}: ${ccy} ${formatNumber(json.provision.totalIncrease)} · JE ${json.entryNumber}`
      );
      setProvisions((prev) => [json.provision, ...prev]);
      setTab("gratuity");
    } catch {
      showError("Provision failed");
    } finally {
      setPostingProvision(false);
    }
  }

  const tabs: { id: Tab; label: string; icon: typeof Users }[] = [
    { id: "employees", label: "Employees", icon: Users },
    { id: "pay-runs", label: "Pay runs", icon: CalendarDays },
    { id: "gratuity", label: "Gratuity provision", icon: Shield },
  ];

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Workspaces", href: "/workspaces" },
          { label: "Payroll" },
        ]}
      />
      <PageHeader title="Payroll" />

      <p className="mb-6 max-w-2xl text-[14px] text-text-secondary">
        Salaries, end-of-service provision and the journals they produce. Ledger postings are
        reverse-only (immutable journals).
      </p>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="dashboard-card border-l-[3px] border-l-text-primary">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-text-primary/10">
            <Users className="h-5 w-5 text-text-primary" strokeWidth={1.8} />
          </div>
          <p className="mt-3 text-[12px] font-medium uppercase tracking-wide text-text-meta">
            Active employees
          </p>
          <p className="mt-0.5 text-[28px] font-extrabold tracking-tight text-text-primary">
            {stats.active}
          </p>
        </div>
        <div className="dashboard-card border-l-[3px] border-l-teal-600">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500/10">
            <Wallet className="h-5 w-5 text-teal-700" strokeWidth={1.8} />
          </div>
          <p className="mt-3 text-[12px] font-medium uppercase tracking-wide text-text-meta">
            Monthly payroll
          </p>
          <p className="mt-0.5 text-[28px] font-extrabold tracking-tight text-teal-700">
            {formatNumber(stats.monthlyPayroll)}
          </p>
        </div>
        <div className="dashboard-card border-l-[3px] border-l-blue-600">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10">
            <CalendarDays className="h-5 w-5 text-blue-700" strokeWidth={1.8} />
          </div>
          <p className="mt-3 text-[12px] font-medium uppercase tracking-wide text-text-meta">
            Pay runs
          </p>
          <p className="mt-0.5 text-[28px] font-extrabold tracking-tight text-blue-700">
            {stats.payRuns}
          </p>
        </div>
        <div className="dashboard-card border-l-[3px] border-l-amber-600">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10">
            <Shield className="h-5 w-5 text-amber-700" strokeWidth={1.8} />
          </div>
          <p className="mt-3 text-[12px] font-medium uppercase tracking-wide text-text-meta">
            EOS provisions
          </p>
          <p className="mt-0.5 text-[28px] font-extrabold tracking-tight text-amber-700">
            {stats.provisions}
          </p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2 border-b border-border-subtle pb-3">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors",
                tab === t.id
                  ? "bg-text-primary text-white"
                  : "text-text-secondary hover:bg-black/[0.04]"
              )}
            >
              <Icon className="h-4 w-4" strokeWidth={1.8} />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "employees" && (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="relative min-w-[220px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-meta" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search employees…"
                className="pl-9"
              />
            </div>
            <ImportExportButtons
              entity="employees"
              entityLabel="Employees"
              onImportComplete={loadEmployees}
            />
            <Button onClick={() => { setEditing(null); setAddOpen(true); }}>
              <Plus className="mr-1.5 h-4 w-4" />
              Add employee
            </Button>
          </div>

          {loading ? (
            <div className="dashboard-card py-10 text-center text-text-secondary">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="dashboard-card py-10 text-center text-text-secondary">
              No employees yet. Add staff to run payroll.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border-subtle">
              <table className="w-full text-left text-[13px]">
                <thead className="bg-canvas text-text-meta">
                  <tr>
                    <th className="px-4 py-3 font-medium">Employee</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">WPS</th>
                    <th className="px-4 py-3 font-medium text-right">Monthly</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((e) => (
                    <tr key={e.id} className="border-t border-border-subtle">
                      <td className="px-4 py-3">
                        <div className="font-medium text-text-primary">{e.name}</div>
                        <div className="mt-0.5 flex flex-wrap gap-3 text-[12px] text-text-meta">
                          {e.employeeNumber && <span>{e.employeeNumber}</span>}
                          {e.email && (
                            <span className="inline-flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {e.email}
                            </span>
                          )}
                          {e.phone && (
                            <span className="inline-flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {e.phone}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        <div className="inline-flex items-center gap-1">
                          <Briefcase className="h-3.5 w-3.5" />
                          {e.position || "—"}
                        </div>
                        {e.department && (
                          <div className="text-[12px] text-text-meta">{e.department}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[12px] text-text-meta">
                        <div>{e.labourCardNumber || "No labour ID"}</div>
                        <div>{e.iban ? "IBAN set" : "No IBAN"}</div>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-text-primary">
                        {formatNumber(monthlyTotal(e))}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "rounded-md px-2 py-0.5 text-[11px] font-semibold",
                            e.isActive
                              ? "bg-success/10 text-success"
                              : "bg-muted text-text-meta"
                          )}
                        >
                          {e.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditing(e);
                              setAddOpen(true);
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          {e.isActive && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSalaryFor(e)}
                                title="Post single salary JE"
                              >
                                <Banknote className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeactivate(e)}
                                title="Deactivate"
                              >
                                <UserX className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === "pay-runs" && (
        <>
          <div className="dashboard-card mb-6">
            <h3 className="text-[15px] font-semibold text-text-primary">Create pay run</h3>
            <p className="mt-1 text-[13px] text-text-secondary">
              Includes all active employees and posts one consolidated salary journal (immutable).
              Dr 6010/6020/6030 · Cr 2110 (accrual) or 1110 (bank).
            </p>
            <div className="mt-4 flex flex-wrap items-end gap-3">
              <div>
                <label className="mb-1 block text-[12px] text-text-meta">Year</label>
                <Input
                  type="number"
                  className="w-28"
                  value={runYear}
                  onChange={(e) => setRunYear(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="mb-1 block text-[12px] text-text-meta">Month</label>
                <StyledSelect
                  value={String(runMonth)}
                  onChange={(e) => setRunMonth(Number(e.target.value))}
                  className="w-28"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={String(i + 1)}>
                      {String(i + 1).padStart(2, "0")}
                    </option>
                  ))}
                </StyledSelect>
              </div>
              <div>
                <label className="mb-1 block text-[12px] text-text-meta">Pay from</label>
                <StyledSelect
                  value={runPayFrom}
                  onChange={(e) =>
                    setRunPayFrom(e.target.value === "cash" ? "cash" : "payable")
                  }
                  className="w-56"
                >
                  <option value="payable">Accrued salaries (2110)</option>
                  <option value="cash">Bank (1110)</option>
                </StyledSelect>
              </div>
              <Button onClick={createPayRun} disabled={creatingRun}>
                <Plus className="mr-1.5 h-4 w-4" />
                {creatingRun ? "Posting…" : "Create & post"}
              </Button>
            </div>
          </div>

          {payRuns.length === 0 ? (
            <div className="dashboard-card py-10 text-center text-text-secondary">
              No pay runs yet.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border-subtle">
              <table className="w-full text-left text-[13px]">
                <thead className="bg-canvas text-text-meta">
                  <tr>
                    <th className="px-4 py-3 font-medium">Run</th>
                    <th className="px-4 py-3 font-medium">Period</th>
                    <th className="px-4 py-3 font-medium">Employees</th>
                    <th className="px-4 py-3 font-medium text-right">Gross</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium text-right">WPS</th>
                  </tr>
                </thead>
                <tbody>
                  {payRuns.map((r) => (
                    <tr key={r.id} className="border-t border-border-subtle">
                      <td className="px-4 py-3 font-medium text-text-primary">{r.runNumber}</td>
                      <td className="px-4 py-3 text-text-secondary">
                        {monthLabel(r.periodYear, r.periodMonth)}
                        <div className="text-[12px] text-text-meta">
                          {r.periodStart} → {r.periodEnd}
                        </div>
                      </td>
                      <td className="px-4 py-3">{r.employeeCount}</td>
                      <td className="px-4 py-3 text-right font-medium">
                        {formatNumber(r.totalGross)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-md bg-success/10 px-2 py-0.5 text-[11px] font-semibold text-success">
                          {r.status}
                        </span>
                        <div className="mt-0.5 text-[11px] text-text-meta">
                          via {r.payFrom === "cash" ? "bank 1110" : "accrual 2110"}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadWps(r.id, r.runNumber)}
                        >
                          <Download className="mr-1.5 h-3.5 w-3.5" />
                          WPS SIF
                        </Button>
                        {r.wpsGeneratedAt && (
                          <div className="mt-1 text-[11px] text-text-meta">
                            Exported {new Date(r.wpsGeneratedAt).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="mt-4 flex items-start gap-2 text-[12px] text-text-meta">
            <FileSpreadsheet className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            WPS export is a best-effort UAE SIF (SCR + EDR CSV lines). Set labour card, IBAN, and
            bank routing on each employee before bank submission.
          </p>
        </>
      )}

      {tab === "gratuity" && (
        <>
          <div className="dashboard-card mb-6">
            <h3 className="text-[15px] font-semibold text-text-primary">
              Post EOS / gratuity provision
            </h3>
            <p className="mt-1 text-[13px] text-text-secondary">
              UAE-style estimate on basic salary: 21 days/year for the first 5 years, 30 days/year
              thereafter (daily = basic ÷ 30), capped at 2 years&apos; basic. Posts the increase vs
              prior provisions — Dr 6040 / Cr 2600 (or 2300).
            </p>
            <div className="mt-4 flex flex-wrap items-end gap-3">
              <div>
                <label className="mb-1 block text-[12px] text-text-meta">As of date</label>
                <Input
                  type="date"
                  className="w-44"
                  value={asOfDate}
                  onChange={(e) => setAsOfDate(e.target.value)}
                />
              </div>
              <Button onClick={postGratuity} disabled={postingProvision}>
                <Shield className="mr-1.5 h-4 w-4" />
                {postingProvision ? "Posting…" : "Calculate & post"}
              </Button>
            </div>
          </div>

          {provisions.length === 0 ? (
            <div className="dashboard-card py-10 text-center text-text-secondary">
              No gratuity provisions yet. Employees need a join date and basic salary.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border-subtle">
              <table className="w-full text-left text-[13px]">
                <thead className="bg-canvas text-text-meta">
                  <tr>
                    <th className="px-4 py-3 font-medium">Provision</th>
                    <th className="px-4 py-3 font-medium">As of</th>
                    <th className="px-4 py-3 font-medium">Employees</th>
                    <th className="px-4 py-3 font-medium text-right">Total liability</th>
                    <th className="px-4 py-3 font-medium text-right">JE increase</th>
                  </tr>
                </thead>
                <tbody>
                  {provisions.map((p) => (
                    <tr key={p.id} className="border-t border-border-subtle">
                      <td className="px-4 py-3 font-medium text-text-primary">
                        {p.provisionNumber}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">{p.asOfDate}</td>
                      <td className="px-4 py-3">{p.employeeCount}</td>
                      <td className="px-4 py-3 text-right">{formatNumber(p.totalLiability)}</td>
                      <td className="px-4 py-3 text-right font-medium text-text-primary">
                        {formatNumber(p.totalIncrease)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <EmployeePanel
        open={addOpen}
        onOpenChange={(o) => {
          setAddOpen(o);
          if (!o) setEditing(null);
        }}
        employee={editing}
        onSaved={handleSaved}
      />
      <PostSalaryPanel
        open={!!salaryFor}
        onOpenChange={(o) => {
          if (!o) setSalaryFor(null);
        }}
        employee={salaryFor}
      />
    </>
  );
}
