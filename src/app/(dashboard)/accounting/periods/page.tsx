"use client";

import { useState, useEffect } from "react";
import { Lock, Unlock, CheckCircle2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

type Period = { id: string; name: string; startDate: string; endDate: string; status: "open" | "closed" | "locked" };
type FiscalYear = { id: string; name: string; startDate: string; endDate: string; isClosed: boolean };

const statusConfig: Record<string, { icon: typeof Lock; color: string; bg: string }> = {
  open: { icon: Unlock, color: "text-success", bg: "bg-success-light" },
  closed: { icon: CheckCircle2, color: "text-accent-yellow", bg: "bg-accent-yellow/15" },
  locked: { icon: Lock, color: "text-error", bg: "bg-error-light" },
};

const defaultFY: FiscalYear = { id: "", name: "No Fiscal Year", startDate: "—", endDate: "—", isClosed: false };

export default function PeriodsPage() {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [fiscalYear, setFiscalYear] = useState<FiscalYear>(defaultFY);

  useEffect(() => {
    fetch("/api/dashboard/stats", { cache: "no-store" })
      .then((r) => r.ok ? r.json() : null)
      .then(() => {
        // Periods/fiscal years would come from a dedicated API
        // For now show empty state
      })
      .catch(() => {});
  }, []);

  function togglePeriodStatus(periodId: string) {
    setPeriods((prev) =>
      prev.map((p) => {
        if (p.id !== periodId) return p;
        const nextStatus =
          p.status === "open" ? "closed" : p.status === "closed" ? "locked" : "open";
        return { ...p, status: nextStatus as "open" | "closed" | "locked" };
      })
    );
  }

  return (
    <>
      {/* Fiscal Year info */}
      <div className="mb-6 dashboard-card flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-text-primary/5">
          <Calendar className="h-5 w-5 text-text-primary" strokeWidth={1.8} />
        </div>
        <div>
          <h3 className="text-[16px] font-semibold text-text-primary">
            {fiscalYear.name}
          </h3>
          <p className="text-[13px] text-text-secondary">
            {fiscalYear.startDate} — {fiscalYear.endDate}
          </p>
        </div>
        <div className="ml-auto">
          <span
            className={`rounded-full px-3 py-1 text-[12px] font-medium ${
              fiscalYear.isClosed
                ? "bg-error-light text-error"
                : "bg-success-light text-success"
            }`}
          >
            {fiscalYear.isClosed ? "Closed" : "Active"}
          </span>
        </div>
      </div>

      {/* Periods grid */}
      <div className="grid grid-cols-12 gap-4">
        {periods.map((period) => {
          const config = statusConfig[period.status];
          const StatusIcon = config.icon;

          return (
            <div key={period.id} className="col-span-3">
              <div className="dashboard-card">
                <div className="flex items-center justify-between">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${config.bg}`}
                  >
                    <StatusIcon className={`h-4 w-4 ${config.color}`} />
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${config.bg} ${config.color}`}
                  >
                    {period.status}
                  </span>
                </div>
                <h4 className="mt-3 text-[14px] font-semibold text-text-primary">
                  {period.name}
                </h4>
                <p className="mt-0.5 text-[11px] text-text-meta">
                  {period.startDate} — {period.endDate}
                </p>
                <Button
                  onClick={() => togglePeriodStatus(period.id)}
                  variant="outline"
                  className="mt-3 h-8 w-full rounded-lg border-border-subtle text-[12px] font-medium hover:bg-black/[0.02]"
                >
                  {period.status === "open"
                    ? "Close Period"
                    : period.status === "closed"
                      ? "Lock Period"
                      : "Reopen Period"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
