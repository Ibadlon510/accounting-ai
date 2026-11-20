"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageHeader } from "@/components/layout/page-header";
import { formatNumber } from "@/lib/accounting/engine";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImportExportButtons } from "@/components/import-export/import-export-buttons";
import { EmployeePanel, type EmployeeRecord } from "@/components/modals/employee-panel";
import { PostSalaryPanel } from "@/components/modals/post-salary-panel";
import { usePageTitle } from "@/hooks/use-page-title";
import {
  Briefcase,
  Mail,
  Phone,
  Plus,
  Search,
  Users,
  Wallet,
  Pencil,
  Banknote,
  UserX,
} from "lucide-react";
import { showError, showSuccess } from "@/lib/utils/toast-helpers";

function monthlyTotal(e: EmployeeRecord) {
  return (e.basicSalary || 0) + (e.housingAllowance || 0) + (e.transportAllowance || 0);
}

export default function PayrollPage() {
  usePageTitle("Payroll");
  const [search, setSearch] = useState("");
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<EmployeeRecord | null>(null);
  const [salaryFor, setSalaryFor] = useState<EmployeeRecord | null>(null);

  const loadEmployees = useCallback(() => {
    setLoading(true);
    fetch("/api/employees", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { employees: [] }))
      .then((d) => setEmployees(d.employees ?? []))
      .catch(() => setEmployees([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return employees;
    return employees.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        (e.employeeNumber ?? "").toLowerCase().includes(q) ||
        (e.email ?? "").toLowerCase().includes(q) ||
        (e.department ?? "").toLowerCase().includes(q) ||
        (e.position ?? "").toLowerCase().includes(q)
    );
  }, [employees, search]);

  const stats = useMemo(() => {
    const active = employees.filter((e) => e.isActive);
    return {
      total: employees.length,
      active: active.length,
      monthlyPayroll: active.reduce((s, e) => s + monthlyTotal(e), 0),
    };
  }, [employees]);

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
    if (!emp.isActive) return;
    const res = await fetch(`/api/employees/${emp.id}`, { method: "DELETE" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      showError("Failed to deactivate", json.error ?? "Please try again.");
      return;
    }
    handleSaved(json.employee as EmployeeRecord);
    showSuccess("Employee deactivated", `${emp.name} is now inactive.`);
  }

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
        Employee records and foundation salary journals. Full pay runs, gratuity, and WPS file export are Coming soon.
      </p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-8">
        <div className="dashboard-card border-l-[3px] border-l-text-primary">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-text-primary/10">
            <Users className="h-5 w-5 text-text-primary" strokeWidth={1.8} />
          </div>
          <p className="mt-3 text-[12px] font-medium uppercase tracking-wide text-text-meta">Employees</p>
          <p className="mt-0.5 text-[28px] font-extrabold tracking-tight text-text-primary">{stats.total}</p>
          <p className="mt-1 text-[11px] text-text-meta">{stats.active} active</p>
        </div>
        <div className="dashboard-card border-l-[3px] border-l-[var(--accent-ai)]">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent-ai)]/10">
            <Briefcase className="h-5 w-5 text-[var(--accent-ai)]" strokeWidth={1.8} />
          </div>
          <p className="mt-3 text-[12px] font-medium uppercase tracking-wide text-text-meta">Active</p>
          <p className="mt-0.5 text-[28px] font-extrabold tracking-tight text-[var(--accent-ai)]">{stats.active}</p>
          <p className="mt-1 text-[11px] text-text-meta">On payroll</p>
        </div>
        <div className="dashboard-card border-l-[3px] border-l-success">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-success/10">
            <Wallet className="h-5 w-5 text-success" strokeWidth={1.8} />
          </div>
          <p className="mt-3 text-[12px] font-medium uppercase tracking-wide text-text-meta">Monthly run (est.)</p>
          <p className="mt-0.5 text-[28px] font-extrabold tracking-tight text-success">
            AED {formatNumber(stats.monthlyPayroll)}
          </p>
          <p className="mt-1 text-[11px] text-text-meta">Basic + allowances</p>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="relative max-w-sm flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-meta" />
          <Input
            placeholder="Search employees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 rounded-xl border-border-subtle bg-surface pl-10 text-[13px] focus-visible:ring-text-primary/20"
          />
        </div>
        <ImportExportButtons entity="employees" entityLabel="Employees" onImportComplete={loadEmployees} />
        <Button
          onClick={() => {
            setEditing(null);
            setAddOpen(true);
          }}
          className="h-10 gap-2 rounded-xl bg-text-primary px-4 text-[13px] font-semibold text-white hover:bg-text-primary/90"
        >
          <Plus className="h-4 w-4" /> Add Employee
        </Button>
      </div>

      <div className="dashboard-card overflow-hidden !p-0">
        <div className="grid grid-cols-12 gap-3 border-b border-border-subtle bg-canvas/50 px-6 py-3 text-[12px] font-medium uppercase tracking-wide text-text-meta">
          <div className="col-span-2">Employee</div>
          <div className="col-span-2">Contact</div>
          <div className="col-span-2">Role</div>
          <div className="col-span-1 text-right">Basic</div>
          <div className="col-span-1 text-right">Housing</div>
          <div className="col-span-1 text-right">Transport</div>
          <div className="col-span-1 text-right">Total</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {loading && (
          <div className="px-6 py-10 text-center text-[13px] text-text-meta">Loading employees…</div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="px-6 py-10 text-center text-[13px] text-text-meta">
            No employees yet. Add an employee to start salary posting.
          </div>
        )}

        {filtered.map((emp) => (
          <div
            key={emp.id}
            className="grid grid-cols-12 gap-3 border-b border-border-subtle/50 px-6 py-3 text-[13px] transition-colors hover:bg-black/[0.01]"
          >
            <div className="col-span-2 min-w-0">
              <p className="font-medium text-text-primary truncate">{emp.name}</p>
              <p className="text-[11px] text-text-meta font-mono">{emp.employeeNumber || "—"}</p>
              <span
                className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  emp.isActive ? "bg-success-light text-success" : "bg-muted text-text-meta"
                }`}
              >
                {emp.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="col-span-2 min-w-0 space-y-1">
              <div className="flex items-center gap-1.5 text-text-secondary truncate">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{emp.email || "—"}</span>
              </div>
              <div className="flex items-center gap-1.5 text-text-secondary truncate">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{emp.phone || "—"}</span>
              </div>
            </div>
            <div className="col-span-2 min-w-0">
              <p className="text-text-primary truncate">{emp.position || "—"}</p>
              <p className="text-[11px] text-text-meta truncate">{emp.department || "—"}</p>
            </div>
            <div className="col-span-1 text-right font-mono text-text-primary">
              {formatNumber(emp.basicSalary || 0)}
            </div>
            <div className="col-span-1 text-right font-mono text-text-secondary">
              {formatNumber(emp.housingAllowance || 0)}
            </div>
            <div className="col-span-1 text-right font-mono text-text-secondary">
              {formatNumber(emp.transportAllowance || 0)}
            </div>
            <div className="col-span-1 text-right font-mono font-medium text-text-primary">
              {formatNumber(monthlyTotal(emp))}
            </div>
            <div className="col-span-2 flex items-center justify-end gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-lg text-[11px] px-2"
                onClick={() => {
                  setEditing(emp);
                  setAddOpen(true);
                }}
                title="Edit"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-lg text-[11px] px-2"
                disabled={!emp.isActive}
                onClick={() => setSalaryFor(emp)}
                title="Post salary"
              >
                <Banknote className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-lg text-[11px] px-2"
                disabled={!emp.isActive}
                onClick={() => handleDeactivate(emp)}
                title="Deactivate"
              >
                <UserX className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

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
        onOpenChange={(o) => !o && setSalaryFor(null)}
        employee={salaryFor}
      />
    </>
  );
}
