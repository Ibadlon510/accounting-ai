"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { BookOpen, FileText, BarChart3, Calendar, Shield } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";

const navItems = [
  { href: "/accounting/chart-of-accounts", label: "Chart of Accounts", icon: BookOpen },
  { href: "/accounting/journal-entries", label: "Journal Entries", icon: FileText },
  { href: "/accounting/general-ledger", label: "General Ledger", icon: BarChart3 },
  { href: "/accounting/trial-balance", label: "Trial Balance", icon: BarChart3 },
  { href: "/accounting/periods", label: "Periods", icon: Calendar },
  { href: "/accounting/audit-trail", label: "Audit Trail", icon: Shield },
];

const titleByPath: Record<string, string> = {
  "/accounting": "Accounting",
  "/accounting/chart-of-accounts": "Chart of Accounts",
  "/accounting/journal-entries": "Journal Entries",
  "/accounting/general-ledger": "General Ledger",
  "/accounting/trial-balance": "Trial Balance",
  "/accounting/periods": "Periods",
  "/accounting/audit-trail": "Audit Trail",
};

export default function AccountingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const pageTitle = titleByPath[pathname] ?? "Accounting";

  return (
    <>
      <Breadcrumbs items={[{ label: "Workspaces", href: "/workspaces" }, { label: "Accounting", href: "/accounting" }, ...(pathname !== "/accounting" ? [{ label: pageTitle }] : [])]} />
      <div className="flex flex-wrap items-center gap-3 pb-6">
        <h1 className="text-[28px] font-bold leading-tight tracking-tight text-text-primary">{pageTitle}</h1>
        <nav className="flex flex-wrap items-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-medium transition-colors ${
                  isActive
                    ? "bg-text-primary text-white"
                    : "bg-muted/60 text-text-secondary hover:bg-muted hover:text-text-primary"
                }`}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
      {children}
    </>
  );
}
