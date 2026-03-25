"use client";

import { useEffect, useState } from "react";
import { BookOpen, FileText, BarChart3, Calendar, Shield } from "lucide-react";
import Link from "next/link";

const sectionDefs = [
  { title: "Chart of Accounts", description: "Manage your account structure", icon: BookOpen, href: "/accounting/chart-of-accounts", countKey: "accounts" as const, suffix: "accounts", fallback: "View accounts" },
  { title: "Journal Entries", description: "Create and view journal entries", icon: FileText, href: "/accounting/journal-entries", countKey: "journalEntries" as const, suffix: "entries", fallback: "View entries" },
  { title: "General Ledger", description: "View account transaction history", icon: BarChart3, href: "/accounting/general-ledger", countKey: null, suffix: "", fallback: "View ledger" },
  { title: "Trial Balance", description: "Verify debit/credit balance", icon: BarChart3, href: "/accounting/trial-balance", countKey: null, suffix: "", fallback: "View report" },
  { title: "Periods", description: "Manage accounting periods", icon: Calendar, href: "/accounting/periods", countKey: "periods" as const, suffix: "periods", fallback: "View periods" },
  { title: "Audit Trail", description: "Complete log of all system activity", icon: Shield, href: "/accounting/audit-trail", countKey: "auditLogs" as const, suffix: "entries", fallback: "View logs" },
];

type Counts = { accounts: number; journalEntries: number; periods: number; auditLogs: number };

export default function AccountingPage() {
  const [counts, setCounts] = useState<Counts | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/org/chart-of-accounts", { cache: "no-store" }).then((r) => r.ok ? r.json() : null),
      fetch("/api/accounting/journal-entries?limit=1", { cache: "no-store" }).then((r) => r.ok ? r.json() : null),
      fetch("/api/accounting/periods", { cache: "no-store" }).then((r) => r.ok ? r.json() : null),
      fetch("/api/accounting/audit-trail?limit=1", { cache: "no-store" }).then((r) => r.ok ? r.json() : null),
    ])
      .then(([coa, je, periods, audit]) => {
        setCounts({
          accounts: coa?.accounts?.length ?? 0,
          journalEntries: je?.total ?? 0,
          periods: periods?.periods?.length ?? 0,
          auditLogs: audit?.total ?? 0,
        });
      })
      .catch((e) => console.error("[accounting] Failed to load counts:", e));
  }, []);

  return (
    <div className="grid grid-cols-12 gap-6">
      {sectionDefs.map((section) => {
        const Icon = section.icon;
        const countLabel = section.countKey && counts
          ? `${counts[section.countKey]} ${section.suffix}`
          : section.fallback;
        return (
          <Link key={section.title} href={section.href} className="col-span-4">
            <div className="dashboard-card group cursor-pointer transition-all hover:shadow-lg">
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-text-primary/5">
                  <Icon className="h-5 w-5 text-text-primary" strokeWidth={1.8} />
                </div>
                <span className="text-[12px] font-medium text-text-meta">{countLabel}</span>
              </div>
              <h3 className="mt-4 text-[16px] font-semibold text-text-primary">{section.title}</h3>
              <p className="mt-1 text-[13px] text-text-secondary">{section.description}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
