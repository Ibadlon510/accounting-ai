"use client";

import { useState, useEffect, useCallback } from "react";
import { Lock, Unlock, CheckCircle2, Calendar, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/formatting";

type Period = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: "open" | "closed" | "locked";
  closedAt: string | null;
};

type FiscalYear = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isClosed: boolean;
};

const statusConfig: Record<string, { icon: typeof Lock; color: string; bg: string }> = {
  open: { icon: Unlock, color: "text-success", bg: "bg-success-light" },
  closed: { icon: CheckCircle2, color: "text-accent-yellow", bg: "bg-accent-yellow/15" },
  locked: { icon: Lock, color: "text-error", bg: "bg-error-light" },
};


export default function PeriodsPage() {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [fiscalYear, setFiscalYear] = useState<FiscalYear | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/accounting/periods", { cache: "no-store" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setFiscalYear(data.fiscalYear ?? null);
      setPeriods(data.periods ?? []);
    } catch {
      setFiscalYear(null);
      setPeriods([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function togglePeriodStatus(periodId: string) {
    setToggling(periodId);
    try {
      const res = await fetch("/api/accounting/periods", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ periodId }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPeriods((prev) =>
        prev.map((p) => (p.id === periodId ? { ...p, ...data.period } : p)),
      );
    } catch {
      // silently fail; user can retry
    } finally {
      setToggling(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-5 w-5 animate-spin text-text-meta" />
        <span className="ml-2 text-[13px] text-text-meta">Loading periods...</span>
      </div>
    );
  }

  if (!fiscalYear) {
    return (
      <div className="dashboard-card flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
          <AlertCircle className="h-6 w-6 text-text-meta" />
        </div>
        <h3 className="mt-4 text-[15px] font-semibold text-text-primary">No Fiscal Year</h3>
        <p className="mt-1 max-w-sm text-[13px] text-text-secondary">
          No fiscal year has been set up for your organization yet. Create a fiscal year to start managing accounting periods.
        </p>
      </div>
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
            {formatDate(fiscalYear.startDate)} — {formatDate(fiscalYear.endDate)}
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
      {periods.length === 0 ? (
        <div className="dashboard-card py-12 text-center text-[14px] text-text-meta">
          No accounting periods found for this fiscal year.
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-4">
          {periods.map((period) => {
            const config = statusConfig[period.status] ?? statusConfig.open;
            const StatusIcon = config.icon;
            const isToggling = toggling === period.id;

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
                    {formatDate(period.startDate)} — {formatDate(period.endDate)}
                  </p>
                  <Button
                    onClick={() => togglePeriodStatus(period.id)}
                    disabled={isToggling}
                    variant="outline"
                    className="mt-3 h-8 w-full rounded-lg border-border-subtle text-[12px] font-medium hover:bg-black/[0.02]"
                  >
                    {isToggling ? (
                      <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                    ) : null}
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
      )}
    </>
  );
}
